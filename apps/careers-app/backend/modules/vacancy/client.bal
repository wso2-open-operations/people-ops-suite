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

import ballerina/http;
import ballerina/time;

configurable VacancyConfig vacancyConfig = ?;

// Identifies this service in the upstream's logs.
const string USER_AGENT = "careers-app-backend/0.1.0";

final http:Client vacancyHttpClient = check new (vacancyConfig.baseUrl, {
    timeout: 15
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

# Proxies GET /vacancies/basic-info.
public isolated function listJobs() returns http:Response|error {
    string token = check getVacancyToken();
    return vacancyHttpClient->get("/vacancies/basic-info", {"Authorization": "Bearer " + token, "User-Agent": USER_AGENT});
}

# Proxies GET /org-structure.
public isolated function getOrgStructure() returns http:Response|error {
    string token = check getVacancyToken();
    return vacancyHttpClient->get("/org-structure", {"Authorization": "Bearer " + token, "User-Agent": USER_AGENT});
}

# Proxies GET /vacancies/{jobId}.
public isolated function getJob(string jobId) returns http:Response|error {
    string token = check getVacancyToken();
    return vacancyHttpClient->get("/vacancies/" + jobId, {"Authorization": "Bearer " + token, "User-Agent": USER_AGENT});
}
