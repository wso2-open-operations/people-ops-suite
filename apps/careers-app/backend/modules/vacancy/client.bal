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

import wso2/careers_app.types;

import ballerina/http;
import ballerina/time;

configurable VacancyConfig vacancyConfig = ?;

// Identifies this service in the upstream's logs.
const string USER_AGENT = "careers-app-backend/0.1.0";

final http:Client vacancyHttpClient = check new (vacancyConfig.baseUrl, {
    timeout: 15
});

// Applying stores the candidate and uploads the CV to Google Drive upstream, which takes far longer than a read.
final http:Client vacancyApplyHttpClient = check new (vacancyConfig.baseUrl, {
    timeout: 90
});

final http:Client tokenHttpClient = check new (vacancyConfig.tokenUrl, {
    auth: {
        username: vacancyConfig.clientId,
        password: vacancyConfig.clientSecret
    },
    timeout: 15
});

isolated function currentEpoch() returns int {
    [int, decimal] [seconds, _] = time:utcNow();
    return seconds;
}


isolated class TokenCache {
    private string cachedToken = "";
    private int expiryEpoch = 0;

    isolated function get() returns string? {
        lock {
            if self.cachedToken != "" && currentEpoch() < self.expiryEpoch {
                return self.cachedToken;
            }
        }
        return ();
    }

    isolated function put(string token, int expiresInSeconds) {
        lock {
            self.cachedToken = token;
            self.expiryEpoch = currentEpoch() + (expiresInSeconds - 60);
        }
    }

    # Forgets the rejected token
    isolated function clear(string rejectedToken) {
        lock {
            if self.cachedToken == rejectedToken {
                self.cachedToken = "";
                self.expiryEpoch = 0;
            }
        }
    }
}

final TokenCache tokenCache = new;

isolated function getVacancyToken() returns string|error {
    string? cached = tokenCache.get();
    if cached is string {
        return cached;
    }

    http:Request req = new;
    req.setTextPayload("grant_type=client_credentials");
    req.setHeader("Content-Type", "application/x-www-form-urlencoded");

    TokenResponse tokenResponse = check tokenHttpClient->post("", req);
    tokenCache.put(tokenResponse.access_token, tokenResponse.expires_in);
    return tokenResponse.access_token;
}

isolated function authHeaders(string token, string requestId) returns map<string> => {
    "Authorization": "Bearer " + token,
    "User-Agent": USER_AGENT,
    [types:REQUEST_ID_HEADER]: requestId
};

# GET from the vacancy service with automatic token refresh on 401.
isolated function getWithToken(string path, string requestId) returns http:Response|error {
    string token = check getVacancyToken();
    http:Response resp = check vacancyHttpClient->get(path, authHeaders(token, requestId));
    if resp.statusCode != http:STATUS_UNAUTHORIZED {
        return resp;
    }
    tokenCache.clear(token);
    string freshToken = check getVacancyToken();
    return vacancyHttpClient->get(path, authHeaders(freshToken, requestId));
}

# POST to the vacancy service with automatic token refresh on 401. A request rejected with 401 was not processed,
# so the retry cannot create the candidate twice.
isolated function postWithToken(string path, CandidateApplication payload, string requestId)
        returns http:Response|error {
    string token = check getVacancyToken();
    http:Response resp = check vacancyApplyHttpClient->post(path, payload, authHeaders(token, requestId));
    if resp.statusCode != http:STATUS_UNAUTHORIZED {
        return resp;
    }
    tokenCache.clear(token);
    string freshToken = check getVacancyToken();
    return vacancyApplyHttpClient->post(path, payload, authHeaders(freshToken, requestId));
}

# Proxies GET /vacancies/basic-info.
public isolated function listJobs(string requestId) returns http:Response|error =>
    getWithToken("/vacancies/basic-info", requestId);

# Proxies GET /org-structure.
public isolated function getOrgStructure(string requestId) returns http:Response|error =>
    getWithToken("/org-structure", requestId);

# Proxies GET /vacancies/{jobId}.
public isolated function getJob(string jobId, string requestId) returns http:Response|error =>
    getWithToken("/vacancies/" + jobId, requestId);

# Proxies POST /vacancies/{jobId}/apply, creating the candidate in the ATS.
public isolated function applyForJob(string jobId, CandidateApplication candidate, string requestId)
        returns http:Response|error => postWithToken("/vacancies/" + jobId + "/apply", candidate, requestId);
