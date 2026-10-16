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
import ballerina/log;
import ballerina/time;
import ballerina/url;

configurable AtsConfig atsConfig = ?;

// Identifies this service in the upstream's logs.
const USER_AGENT = "careers-app-backend/0.1.0";

// The longest a read, or a token request, waits for the upstream to reply.
const decimal UPSTREAM_TIMEOUT_SECONDS = 15;

final http:Client atsHttpClient = check new (atsConfig.baseUrl, {
    timeout: UPSTREAM_TIMEOUT_SECONDS
});

// Client for applications, which wait longer than reads.
final http:Client atsApplyHttpClient = check new (atsConfig.baseUrl, {
    timeout: 90
});

final http:Client tokenHttpClient = check new (atsConfig.tokenUrl, {
    auth: {
        username: atsConfig.clientId,
        password: atsConfig.clientSecret
    },
    timeout: UPSTREAM_TIMEOUT_SECONDS
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

isolated function getAtsToken() returns string|error {
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

# GET from the ATS with automatic token refresh on 401.
isolated function getWithToken(string path, string requestId) returns http:Response|error {
    string token = check getAtsToken();
    http:Response resp = check atsHttpClient->get(path, authHeaders(token, requestId));
    if resp.statusCode != http:STATUS_UNAUTHORIZED {
        return resp;
    }
    tokenCache.clear(token);
    string freshToken = check getAtsToken();
    return atsHttpClient->get(path, authHeaders(freshToken, requestId));
}

# POST to the ATS with automatic token refresh on 401.
isolated function postWithToken(string path, AtsCandidate payload, string requestId)
        returns http:Response|error {
    string token = check getAtsToken();
    http:Response resp = check atsApplyHttpClient->post(path, payload, authHeaders(token, requestId));
    if resp.statusCode != http:STATUS_UNAUTHORIZED {
        return resp;
    }
    tokenCache.clear(token);
    string freshToken = check getAtsToken();
    return atsApplyHttpClient->post(path, payload, authHeaders(freshToken, requestId));
}

# PATCH to the ATS with automatic token refresh on 401.
isolated function patchWithToken(string path, AtsCandidateUpdate payload, string requestId)
        returns http:Response|error {
    string token = check getAtsToken();
    http:Response resp = check atsHttpClient->patch(path, payload, authHeaders(token, requestId));
    if resp.statusCode != http:STATUS_UNAUTHORIZED {
        return resp;
    }
    tokenCache.clear(token);
    string freshToken = check getAtsToken();
    return atsHttpClient->patch(path, payload, authHeaders(freshToken, requestId));
}

// The path with a candidate's email replaced, so that it is safe to write to a log.
isolated function loggablePath(string path) returns string =>
    re `^/candidates/[^/]+/`.replace(path, "/candidates/{email}/");

// The JSON of a 200 reply; any other status becomes an UpstreamError.
isolated function atsJson(string path, string requestId) returns json|error {
    http:Response resp = check getWithToken(path, requestId);
    if resp.statusCode != http:STATUS_OK {
        log:printWarn("The ATS did not return 200", path = loggablePath(path), status = resp.statusCode,
            requestId = requestId);
        return error UpstreamError(string `The ATS replied with status ${resp.statusCode}`, status = resp.statusCode);
    }
    return resp.getJsonPayload();
}

// The reply for a failed load.
isolated function failedReply(error err, string requestId) returns http:Response|error {
    if err is http:ClientError {
        return err;
    }
    http:Response resp = new;
    if err is UpstreamError {
        resp.statusCode = err.detail().status;
    } else {
        log:printError("Could not build a vacancy reply from the ATS data", err, requestId = requestId);
        resp.statusCode = http:STATUS_BAD_GATEWAY;
    }
    resp.setTextPayload(err.message());
    return resp;
}

// A 200 reply carrying the JSON.
isolated function okReply(json body) returns http:Response {
    http:Response resp = new;
    resp.statusCode = http:STATUS_OK;
    resp.setJsonPayload(body);
    return resp;
}

// The published vacancies, optionally of one designation and employment type.
isolated function publishedVacancies(string requestId, int? designationId = (), string? employmentType = ())
        returns AtsVacancy[]|error {
    string query = "status=PUBLISHED";
    if designationId is int {
        query += "&designationId=" + designationId.toString();
    }
    if employmentType is string {
        query += "&employmentType=" + check url:encode(employmentType, "UTF-8");
    }
    json body = check atsJson("/vacancies?" + query, requestId);
    AtsVacancyResponse response = check body.fromJsonWithType();
    return response.vacancies;
}

isolated function fetchVacancy(string jobId, string requestId) returns AtsVacancy|error {
    json body = check atsJson("/vacancies/" + jobId, requestId);
    return body.fromJsonWithType();
}

isolated function orgDetails(string requestId) returns AtsBusinessUnit[]|error {
    json body = check atsJson("/org-details", requestId);
    return body.fromJsonWithType();
}

isolated function companies(string requestId) returns AtsCompany[]|error {
    json body = check atsJson("/companies", requestId);
    return body.fromJsonWithType();
}

isolated function careerFunctions(string requestId) returns AtsCareerFunction[]|error {
    json body = check atsJson("/career-functions", requestId);
    return body.fromJsonWithType();
}

isolated function appConfig(string requestId) returns AtsAppConfig|error {
    json body = check atsJson("/app-config", requestId);
    return body.fromJsonWithType();
}

isolated function loadJobList(string requestId) returns VacancyBasicInfo[]|error {
    AtsVacancy[] vacancies = check publishedVacancies(requestId);
    AtsBusinessUnit[] units = check orgDetails(requestId);
    return from AtsVacancy vacancy in vacancies
        select basicInfoOf(vacancy, units);
}

isolated function loadOrgStructure(string requestId) returns OrgStructure|error {
    AtsCompany[] allCompanies = check companies(requestId);
    AtsBusinessUnit[] units = check orgDetails(requestId);
    AtsAppConfig|error config = appConfig(requestId);
    if config is error {
        log:printError("Could not read the ATS app config", config, requestId = requestId);
    }
    return orgStructureOf(allCompanies, units, config is AtsAppConfig ? config : ());
}

isolated function loadJobDetail(string jobId, string requestId) returns JobDetail|error {
    AtsVacancy vacancy = check fetchVacancy(jobId, requestId);
    if vacancy.status != STATUS_PUBLISHED {
        return error UpstreamError("The vacancy is not published", status = http:STATUS_BAD_REQUEST);
    }
    AtsCompany[] allCompanies = check companies(requestId);
    AtsBusinessUnit[] units = check orgDetails(requestId);
    AtsCareerFunction[] functions = check careerFunctions(requestId);
    AtsVacancy[] sameDesignation = check publishedVacancies(requestId, vacancy.designationId, vacancy.employmentType);
    return detailOf(vacancy, allCompanies, units, functions, sameDesignation);
}

isolated function candidateFor(string jobId, CandidateApplication candidate, string requestId)
        returns AtsCandidate|error {
    int|error vacancyId = int:fromString(jobId);
    if vacancyId is error {
        return error UpstreamError("Invalid vacancy id", status = http:STATUS_BAD_REQUEST);
    }
    AtsVacancy vacancy = check fetchVacancy(jobId, requestId);
    if vacancy.status != STATUS_PUBLISHED {
        return error UpstreamError("The vacancy is not published", status = http:STATUS_NOT_FOUND);
    }
    AtsCandidate|string atsCandidate = atsCandidateOf(candidate, vacancy.employmentType, vacancyId);
    if atsCandidate is string {
        return error UpstreamError(atsCandidate, status = http:STATUS_BAD_REQUEST);
    }
    return atsCandidate;
}

# The published vacancies, in the shape the web app reads.
public isolated function listJobs(string requestId) returns http:Response|error {
    VacancyBasicInfo[]|error jobs = loadJobList(requestId);
    return jobs is error ? failedReply(jobs, requestId) : okReply(jobs.toJson());
}

# The teams and hiring locations.
public isolated function getOrgStructure(string requestId) returns http:Response|error {
    OrgStructure|error org = loadOrgStructure(requestId);
    return org is error ? failedReply(org, requestId) : okReply(org.toJson());
}

# One published vacancy, with its similar listings.
public isolated function getJob(string jobId, string requestId) returns http:Response|error {
    JobDetail|error detail = loadJobDetail(jobId, requestId);
    return detail is error ? failedReply(detail, requestId) : okReply(detail.toJson());
}

isolated function candidateHistory(string email, string requestId) returns AtsHistoryEntry[]|error {
    string path = "/candidates/" + check url:encode(email, "UTF-8") + "/histories?limit=" + MAX_HISTORY_ENTRIES.toString();
    json body = check atsJson(path, requestId);
    AtsHistoryResponse history = check body.fromJsonWithType();
    return history.candidates;
}

isolated function profileFor(string email, string requestId) returns CandidateProfile|error {
    AtsHistoryEntry[] history = check candidateHistory(email, requestId);
    CandidateProfile? profile = profileOf(history, email);
    if profile is () {
        return error UpstreamError(NO_APPLICATIONS_MESSAGE, status = http:STATUS_NOT_FOUND);
    }
    return profile;
}

isolated function profileReplyOf(CandidateProfile|error profile, string requestId) returns http:Response|error =>
    profile is error ? failedReply(profile, requestId) : okReply(profile.toJson());

# The candidate's details from their most recent application; a 404 reply when they have not applied.
public isolated function getProfile(string email, string requestId) returns http:Response|error =>
    profileReplyOf(profileFor(email, requestId), requestId);

# The candidate's applications, newest first.
public isolated function listApplications(string email, string requestId) returns ApplicationSummary[]|error {
    AtsHistoryEntry[] history = check candidateHistory(email, requestId);
    json|http:Response|error jobs = cachedJobs(requestId);
    return applicationsOf(history, departmentsOf(jobs is json ? jobs : ()));
}

isolated function saveProfile(string email, ProfileChanges changes, string requestId) returns CandidateProfile|error {
    AtsCandidateUpdate|string update = atsUpdateOf(changes);
    if update is string {
        return error UpstreamError(update, status = http:STATUS_BAD_REQUEST);
    }
    AtsHistoryEntry[] history = check candidateHistory(email, requestId);
    AtsHistoryEntry? latest = latestEntry(history);
    if latest is () || latest.candidateId < 1 {
        return error UpstreamError(NO_APPLICATIONS_MESSAGE, status = http:STATUS_NOT_FOUND);
    }
    if update.length() > 0 {
        string path = string `/candidates/${latest.candidateId}/vacancies/${latest.id}`;
        http:Response resp = check patchWithToken(path, update, requestId);
        if resp.statusCode == http:STATUS_BAD_REQUEST {
            return error UpstreamError("The details were not accepted. Please check them and try again.",
                status = http:STATUS_BAD_REQUEST);
        }
        if resp.statusCode != http:STATUS_OK {
            return error UpstreamError(string `The ATS replied with status ${resp.statusCode}`, status = resp.statusCode);
        }
    }
    return profileFor(email, requestId);
}

# Saves the changes to the candidate's details, found through their own email, and returns their profile.
public isolated function updateProfile(string email, ProfileChanges changes, string requestId)
        returns http:Response|error => profileReplyOf(saveProfile(email, changes, requestId), requestId);

# Creates the candidate in the ATS and returns its reply unchanged.
public isolated function applyForJob(string jobId, CandidateApplication candidate, string requestId)
        returns http:Response|error {
    AtsCandidate|error atsCandidate = candidateFor(jobId, candidate, requestId);
    if atsCandidate is error {
        return failedReply(atsCandidate, requestId);
    }
    return postWithToken("/candidates", atsCandidate, requestId);
}
