// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

import ballerina/cache;
import ballerina/http;
import ballerina/lang.runtime;
import ballerina/log;

# Seconds before a cached copy is refreshed in the background. At least 1, and less than maxStaleSeconds.
configurable int refreshAfterSeconds = 120;

# Seconds a cached copy may be served at most, even while refreshes fail. More than refreshAfterSeconds.
configurable int maxStaleSeconds = 21600;

# Seconds a failed load is remembered; doubles with each failure in a row, up to 64 times. Between 1 and 60, so the
# longest a failure is remembered is about an hour.
configurable int failFastSeconds = 5;

const int MAX_FAIL_FAST_SECONDS = 60;
const int MAX_CACHED_ENTRIES = 500;
const int MAX_REMEMBERED_FAILURES = 1000;
const int MAX_BACKOFF_DOUBLINGS = 6;
const decimal WAIT_STEP_SECONDS = 0.05;
const int MAX_WAIT_STEPS = 400;
const string WARM_UP_REQUEST_ID = "startup-warm-up";

type CachedBody record {|
    json value;
    int fetchedAt;
|};

// Status 0 means the upstream was not reached; count is the failures in a row.
type FailedLoad record {|
    int status;
    int failedAt;
    int count;
|};

// Seconds a failure is remembered.
isolated function backoffOf(FailedLoad failed, int failFast) returns int =>
    failFast << int:min(failed.count - 1, MAX_BACKOFF_DOUBLINGS);

// Whether the upstream says a job no longer exists: 404, or 400, which is how the vacancy service answers for a
// vacancy that is not published. Only a job's detail is dropped this way; any other failure keeps the cached copy.
isolated function isGone(string key, int status) returns boolean =>
    key.startsWith("job:") && (status == 404 || status == 400);

isolated function jsonBodyOf(http:Response resp) returns json|error {
    if resp.statusCode != 200 {
        return error(string `The upstream replied with status ${resp.statusCode}`);
    }
    return resp.getJsonPayload();
}

isolated function replyFor(FailedLoad failed) returns http:Response|error {
    if failed.status == 0 {
        return error("The vacancy service could not be reached");
    }
    http:Response resp = new;
    resp.statusCode = failed.status;
    return resp;
}

# Serves upstream JSON replies from memory and refreshes them in the background.
public isolated class VacancyCache {
    private final cache:Cache entries;
    private final int refreshAfter;
    private final int failFast;
    private map<boolean> inFlight = {};
    private map<FailedLoad> failures = {};

    public isolated function init(int refreshAfter, int maxStale, int failFast) {
        self.refreshAfter = refreshAfter;
        self.failFast = failFast;
        self.entries = new ({
            capacity: MAX_CACHED_ENTRIES,
            evictionFactor: 0.2,
            defaultMaxAge: <decimal>maxStale,
            cleanupInterval: 3600
        });
    }

    # The cached JSON for the key, loaded from the upstream when missing.
    #
    # + key - Cache key
    # + call - Fetches from the upstream
    # + return - The JSON, or the upstream's reply or error
    public isolated function get(string key, isolated function () returns http:Response|error call)
            returns json|http:Response|error {
        CachedBody? cached = self.lookup(key);
        if cached is CachedBody {
            // A failed refresh is remembered, so a stale copy is not refreshed again until that has expired.
            boolean stale = currentEpoch() - cached.fetchedAt >= self.refreshAfter;
            if stale && self.recentFailure(key) is () && self.tryStart(key) {
                _ = start self.refresh(key, call);
            }
            return cached.value;
        }
        return self.loadMissing(key, call);
    }

    isolated function loadMissing(string key, isolated function () returns http:Response|error call)
            returns json|http:Response|error {
        foreach int _ in 0 ..< MAX_WAIT_STEPS {
            CachedBody? cached = self.lookup(key);
            if cached is CachedBody {
                return cached.value;
            }
            FailedLoad? failed = self.recentFailure(key);
            if failed is FailedLoad {
                return replyFor(failed);
            }
            if self.tryStart(key) {
                return self.load(key, call);
            }
            runtime:sleep(WAIT_STEP_SECONDS);
        }
        return error("Timed out waiting for the vacancy service");
    }

    isolated function load(string key, isolated function () returns http:Response|error call)
            returns json|http:Response|error {
        http:Response|error resp = call();
        json|http:Response|error result = resp;
        if resp is http:Response {
            json|error body = jsonBodyOf(resp);
            if body is json {
                self.store(key, body);
                result = body;
            } else {
                if isGone(key, resp.statusCode) {
                    self.drop(key);
                }
                self.recordFailure(key, resp.statusCode);
            }
        } else {
            self.recordFailure(key, 0);
        }
        lock {
            _ = self.inFlight.removeIfHasKey(key);
        }
        return result;
    }

    // Forgets the cached copy of a key, so it is no longer served.
    isolated function drop(string key) {
        if self.entries.hasKey(key) {
            cache:Error? dropped = self.entries.invalidate(key);
            if dropped is cache:Error {
                log:printWarn("Could not drop the cached copy of a vacancy that is gone", dropped, key = key);
            } else {
                log:printInfo("Dropped the cached copy of a vacancy that is no longer available", key = key);
            }
        }
    }

    isolated function lookup(string key) returns (CachedBody & readonly)? {
        any|cache:Error cached = self.entries.get(key);
        if cached is CachedBody {
            return cached.cloneReadOnly();
        }
        return ();
    }

    isolated function store(string key, json body) {
        readonly & CachedBody entry = {value: body.cloneReadOnly(), fetchedAt: currentEpoch()};
        cache:Error? stored = self.entries.put(key, entry);
        if stored is cache:Error {
            log:printWarn("Could not keep the vacancy reply in the cache", stored, key = key);
        }
        lock {
            _ = self.failures.removeIfHasKey(key);
        }
    }

    // Lets one request at a time call the upstream for a key.
    isolated function tryStart(string key) returns boolean {
        lock {
            if self.inFlight.hasKey(key) {
                return false;
            }
            self.inFlight[key] = true;
            return true;
        }
    }

    // Remembers a failed load of the key.
    isolated function recordFailure(string key, int status) {
        lock {
            FailedLoad? previous = self.failures[key];
            int now = currentEpoch();
            if self.failures.length() >= MAX_REMEMBERED_FAILURES {
                foreach string failedKey in self.failures.keys() {
                    if now - self.failures.get(failedKey).failedAt >= backoffOf(self.failures.get(failedKey), self.failFast) {
                        _ = self.failures.remove(failedKey);
                    }
                }
            }
            if previous is FailedLoad || self.failures.length() < MAX_REMEMBERED_FAILURES {
                self.failures[key] = {status, failedAt: now, count: previous is FailedLoad ? previous.count + 1 : 1};
            }
        }
    }

    isolated function recentFailure(string key) returns (FailedLoad & readonly)? {
        lock {
            FailedLoad? failed = self.failures[key];
            if failed is FailedLoad && currentEpoch() - failed.failedAt < backoffOf(failed, self.failFast) {
                return failed.cloneReadOnly();
            }
        }
        return ();
    }

    isolated function refresh(string key, isolated function () returns http:Response|error call) {
        json|http:Response|error result = self.load(key, call);
        if result is json {
            return;
        }
        if result is error {
            log:printWarn("Background refresh failed; keeping the cached copy", result, key = key);
        } else {
            log:printWarn("Background refresh failed; keeping the cached copy", key = key, status = result.statusCode);
        }
    }
}

# What is wrong with the cache settings, or nothing when they are fine.
#
# + refreshAfter - Seconds before a cached copy is refreshed
# + maxStale - Seconds a cached copy may be served at most
# + failFast - Seconds a failed load is remembered
# + return - A message naming the setting, or nothing
isolated function settingsProblem(int refreshAfter, int maxStale, int failFast) returns string? {
    if refreshAfter < 1 {
        return string `refreshAfterSeconds must be at least 1, but it is ${refreshAfter}`;
    }
    if maxStale <= refreshAfter {
        return string `maxStaleSeconds (${maxStale}) must be more than refreshAfterSeconds (${refreshAfter})`;
    }
    if failFast < 1 || failFast > MAX_FAIL_FAST_SECONDS {
        return string `failFastSeconds must be between 1 and ${MAX_FAIL_FAST_SECONDS}, but it is ${failFast}`;
    }
    return ();
}

// Stops the service from starting, with a clear message, when a cache setting makes no sense.
isolated function createCache() returns VacancyCache|error {
    string? problem = settingsProblem(refreshAfterSeconds, maxStaleSeconds, failFastSeconds);
    if problem is string {
        return error("Invalid vacancy cache setting: " + problem);
    }
    return new (refreshAfterSeconds, maxStaleSeconds, failFastSeconds);
}

final VacancyCache vacancyCache = check createCache();

# The cached job list.
public isolated function cachedJobs(string requestId) returns json|http:Response|error =>
    vacancyCache.get("jobs", isolated function() returns http:Response|error => listJobs(requestId));

# The cached org structure.
public isolated function cachedOrgStructure(string requestId) returns json|http:Response|error =>
    vacancyCache.get("org-structure", isolated function() returns http:Response|error => getOrgStructure(requestId));

# One job's cached detail.
public isolated function cachedJob(string jobId, string requestId) returns json|http:Response|error =>
    vacancyCache.get(string `job:${jobId}`, isolated function() returns http:Response|error => getJob(jobId, requestId));

# Fills the cache at start-up.
public isolated function warmUp() {
    json|http:Response|error jobs = cachedJobs(WARM_UP_REQUEST_ID);
    json|http:Response|error orgStructure = cachedOrgStructure(WARM_UP_REQUEST_ID);
    if jobs is json && orgStructure is json {
        log:printInfo("Vacancy cache warmed up");
    } else {
        log:printWarn("Vacancy cache warm-up did not complete; the first requests will fetch from the upstream");
    }
}
