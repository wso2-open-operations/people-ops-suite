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

final http:Client introspectClient = check new (authConfig.introspectUrl, {
    auth: {
        username: authConfig.clientId,
        password: authConfig.clientSecret
    }
});

type IntrospectResponse record {
    boolean active;
    string sub?;
};

isolated function validateViaJwks(string token) returns AsgardeoJwt|error {
    // Reject a malformed token before attempting signature validation.
    [jwt:Header, jwt:Payload] _ = check jwt:decode(token);

    jwt:ValidatorConfig config = {
        signatureConfig: {
            jwksConfig: {
                url: authConfig.jwksUrl
            }
        }
    };
    jwt:Payload payload = check jwt:validate(token, config);
    string? sub = payload?.sub;
    if sub is () || sub == "" {
        return error("Invalid token: missing sub");
    }
    return {sub};
}

# Fallback for opaque tokens that aren't a verifiable JWT.
isolated function validateViaIntrospection(string token) returns AsgardeoJwt|error {
    http:Request req = new;
    req.setTextPayload("token=" + token);
    req.setHeader("Content-Type", "application/x-www-form-urlencoded");

    IntrospectResponse introspected = check introspectClient->post("", req);
    if !introspected.active {
        return error("Token inactive");
    }
    string? sub = introspected?.sub;
    if sub is () || sub == "" {
        return error("Invalid token: missing sub");
    }
    return {sub};
}

# JWKS validation first, introspection as a fallback for tokens that fail it.
public isolated function validateToken(string token) returns AsgardeoJwt|error {
    AsgardeoJwt|error result = validateViaJwks(token);
    if result is AsgardeoJwt {
        return result;
    }
    return validateViaIntrospection(token);
}

# Read the validated caller back out of the request context, for resource functions that need the caller's identity.
public isolated function getUser(http:RequestContext ctx) returns AsgardeoJwt|error {
    return ctx.getWithType(CTX_USER);
}
