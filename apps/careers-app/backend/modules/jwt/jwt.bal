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
import ballerina/jwt;

configurable AuthConfig authConfig = ?;

# Validates the token's signature (against Asgardeo's JWKS), issuer, audience and expiry, and returns the caller's subject.
public isolated function validateToken(string token) returns AsgardeoJwt|error {
    // Reject a malformed token before attempting signature validation.
    [jwt:Header, jwt:Payload] _ = check jwt:decode(token);

    jwt:ValidatorConfig config = {
        issuer: authConfig.issuer,
        audience: authConfig.audience,
        signatureConfig: {
            jwksConfig: {
                url: authConfig.jwksUrl
            }
        }
    };
    jwt:Payload payload = check jwt:validate(token, config);
    if payload?.exp is () {
        return error("Invalid token: missing exp");
    }
    string? sub = payload?.sub;
    if sub is () || sub == "" {
        return error("Invalid token: missing sub");
    }
    return {sub};
}

# Read the validated caller back out of the request context, for resource functions that need the caller's identity.
public isolated function getUser(http:RequestContext ctx) returns AsgardeoJwt|error {
    return ctx.getWithType(CTX_USER);
}