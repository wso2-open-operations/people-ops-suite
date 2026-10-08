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
import ballerina/test;

final http:Client testClient = check new (string `http://localhost:${port}`);

@test:Config {}
function validJobIdsAreAccepted() {
    test:assertTrue(isValidJobId("258"));
    test:assertTrue(isValidJobId("job-1_a"));
}

@test:Config {}
function pathTraversalAndOddJobIdsAreRejected() {
    string[] rejected = ["", "..", "../org-structure", "..%2Forg-structure", "1/2", "1 2", "1?x=y", "%2e%2e"];
    foreach string jobId in rejected {
        test:assertFalse(isValidJobId(jobId), string `Job id "${jobId}" should be rejected`);
    }
}

@test:Config {}
function requestWithoutTokenIsUnauthorized() returns error? {
    http:Response resp = check testClient->get("/jobs");
    test:assertEquals(resp.statusCode, 401);
}

@test:Config {}
function requestWithGarbageTokenIsUnauthorized() returns error? {
    http:Response resp = check testClient->get("/jobs", {"Authorization": "Bearer not-a-jwt"});
    test:assertEquals(resp.statusCode, 401);
}

@test:Config {}
function traversalJobIdWithoutTokenIsUnauthorized() returns error? {
    http:Response resp = check testClient->get("/jobs/..%2Forg-structure");
    test:assertEquals(resp.statusCode, 401);
}

function responseWithStatus(int statusCode) returns http:Response {
    http:Response resp = new;
    resp.statusCode = statusCode;
    return resp;
}

@test:Config {}
function upstreamJsonIsPassedThrough() {
    http:Response resp = responseWithStatus(200);
    resp.setJsonPayload({"id": 258});
    test:assertEquals(forwardOrError(resp, "failed"), {"id": 258});
}

@test:Config {}
function unreachableUpstreamBecomesGatewayTimeout() {
    test:assertTrue(forwardOrError(error("connection refused"), "failed") is http:GatewayTimeout);
}

@test:Config {}
function upstreamUnavailableOrTimedOutBecomesGatewayTimeout() {
    test:assertTrue(forwardOrError(responseWithStatus(503), "failed") is http:GatewayTimeout);
    test:assertTrue(forwardOrError(responseWithStatus(504), "failed") is http:GatewayTimeout);
}

@test:Config {}
function otherUpstreamFailuresBecomeBadGateway() {
    test:assertTrue(forwardOrError(responseWithStatus(500), "failed") is http:BadGateway);
    test:assertTrue(forwardOrError(responseWithStatus(401), "failed") is http:BadGateway);
}

@test:Config {}
function nonJsonUpstreamBodyBecomesBadGateway() {
    http:Response resp = responseWithStatus(200);
    resp.setTextPayload("not json", "text/plain");
    test:assertTrue(forwardOrError(resp, "failed") is http:BadGateway);
}
