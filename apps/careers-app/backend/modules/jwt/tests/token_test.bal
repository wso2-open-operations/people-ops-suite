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

import ballerina/test;

// Header {"alg":"none"} with a payload that looks valid (right issuer and audience, far-future expiry) and no signature.
const string UNSIGNED_TOKEN = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0."
    + "eyJzdWIiOiJzb21lb25lIiwiZXhwIjo5OTk5OTk5OTk5LCJpc3MiOiJodHRwczovL2lzc3Vlci5leGFtcGxlLnRlc3QiLCJhdWQiOiJ0ZXN0LWF1ZGllbmNlIn0.";

@test:Config {}
function emptyTokenIsRejected() {
    test:assertTrue(validateToken("") is error);
}

@test:Config {}
function malformedTokenIsRejected() {
    test:assertTrue(validateToken("not-a-jwt") is error);
}

@test:Config {}
function unsignedTokenIsRejected() {
    test:assertTrue(validateToken(UNSIGNED_TOKEN) is error);
}
