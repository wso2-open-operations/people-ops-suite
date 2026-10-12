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
import ballerina/log;

# How long a cached copy is served before the next request starts a background refresh.
configurable int refreshAfterSeconds = 600;

# The longest a cached copy is served at all, even while refreshes keep failing.
configurable int maxStaleSeconds = 21600;

# The most entries held at once; a job's detail is cached only for jobs that exist, so this is never reached in practice.
const int MAX_CACHED_ENTRIES = 500;

const string WARM_UP_REQUEST_ID = "startup-warm-up";

# An upstream JSON body and when it was fetched, in epoch seconds.
type CachedBody record {|
    json value;
    int fetchedAt;
|};

# The JSON body of a successful upstream reply, or an error when the reply is not a 200 with a JSON body.
isolated function jsonBodyOf(http:Response resp) returns json|error {
    if resp.statusCode != 200 {
        return error(string `The upstream replied with status ${resp.statusCode}`);
    }
    return resp.getJsonPayload();
}

# Keeps upstream JSON replies and serves them without waiting. A copy older than the refresh time is still served at
# once, and one request per key refreshes it in the background; a failed refresh keeps the old copy.
public isolated class VacancyCache {
    private final cache:Cache entries;
    private final int refreshAfter;
    private map<boolean> refreshing = {};

    public isolated function init(int refreshAfter, int maxStale) {
        self.refreshAfter = refreshAfter;
        self.entries = new ({
            capacity: MAX_CACHED_ENTRIES,
            evictionFactor: 0.2,
            defaultMaxAge: <decimal>maxStale,
            cleanupInterval: 3600
        });
    }

    # The cached JSON for the key. When there is none, the upstream is called and a 200 JSON reply is kept; any other
    # reply or error is passed back to the caller to turn into a response, and is not kept.
    #
    # + key - What is cached, such as "jobs"
    # + call - Fetches the data from the upstream
    # + return - The JSON, or the upstream's own reply or error
    public isolated function get(string key, isolated function () returns http:Response|error call)
            returns json|http:Response|error {
        CachedBody? cached = self.lookup(key);
        if cached is CachedBody {
            if currentEpoch() - cached.fetchedAt >= self.refreshAfter && self.tryStartRefresh(key) {
                _ = start self.refresh(key, call);
            }
            return cached.value;
        }

        http:Response|error resp = call();
        if resp is http:Response {
            json|error body = jsonBodyOf(resp);
            if body is json {
                self.store(key, body);
                return body;
            }
        }
        return resp;
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
    }

    # Whether this call is the one to refresh the key; false when a refresh for it is already running.
    isolated function tryStartRefresh(string key) returns boolean {
        lock {
            if self.refreshing.hasKey(key) {
                return false;
            }
            self.refreshing[key] = true;
            return true;
        }
    }

    isolated function refresh(string key, isolated function () returns http:Response|error call) {
        do {
            http:Response resp = check call();
            json body = check jsonBodyOf(resp);
            self.store(key, body);
        } on fail error err {
            log:printWarn("Background refresh failed; keeping the cached copy", err, key = key);
        }
        lock {
            _ = self.refreshing.removeIfHasKey(key);
        }
    }
}

final VacancyCache vacancyCache = new (refreshAfterSeconds, maxStaleSeconds);

# The job listing, from the cache when it holds a copy.
public isolated function cachedJobs(string requestId) returns json|http:Response|error =>
    vacancyCache.get("jobs", isolated function() returns http:Response|error => listJobs(requestId));

# The team and location options, from the cache when it holds a copy.
public isolated function cachedOrgStructure(string requestId) returns json|http:Response|error =>
    vacancyCache.get("org-structure", isolated function() returns http:Response|error => getOrgStructure(requestId));

# One job's detail, from the cache when it holds a copy. The job id must already be checked.
public isolated function cachedJob(string jobId, string requestId) returns json|http:Response|error =>
    vacancyCache.get(string `job:${jobId}`, isolated function() returns http:Response|error => getJob(jobId, requestId));

# Fills the cache with the job listing and the org structure when the service starts, so the first visitors do not wait.
public isolated function warmUp() {
    json|http:Response|error jobs = cachedJobs(WARM_UP_REQUEST_ID);
    json|http:Response|error orgStructure = cachedOrgStructure(WARM_UP_REQUEST_ID);
    if jobs is json && orgStructure is json {
        log:printInfo("Vacancy cache warmed up");
    } else {
        log:printWarn("Vacancy cache warm-up did not complete; the first requests will fetch from the upstream");
    }
}
