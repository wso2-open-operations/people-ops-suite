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
import ballerina/jwt;
import ballerina/log;

configurable AuthConfig authConfig = ?;

# Validates the token's signature, issuer, audience and expiry, and returns the caller's identity.
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
    return identityOf(payload);
}

isolated function identityOf(jwt:Payload payload) returns AsgardeoJwt|error {
    string? sub = payload?.sub;
    if sub is () || sub == "" {
        return error("Invalid token: missing sub");
    }
    return {sub};
}

isolated function userInfoUrlOf(AuthConfig config) returns string {
    string? configured = config?.userInfoUrl;
    if configured is string {
        return configured;
    }
    string issuer = config.issuer;
    return issuer.endsWith("/token") ? issuer.substring(0, issuer.length() - "token".length()) + "userinfo" : issuer;
}

isolated function emailOf(json userInfo) returns string? {
    if userInfo is map<json> {
        json email = userInfo["email"];
        if email is string && email.trim() != "" {
            return email.trim().toLowerAscii();
        }
    }
    return ();
}

final http:Client userInfoClient = check new (userInfoUrlOf(authConfig), {timeout: 15});

// Callers' emails by subject.
final cache:Cache emailCache = new ({capacity: 1000, defaultMaxAge: 300, cleanupInterval: 600});

# The caller's email in lower case from the identity provider; nothing when the account has none.
public isolated function callerEmail(AsgardeoJwt user, string accessToken) returns string|error? {
    any|cache:Error cached = emailCache.get(user.sub);
    if cached is string {
        return cached == "" ? () : cached;
    }
    json userInfo = check userInfoClient->get("", {"Authorization": "Bearer " + accessToken});
    string? email = emailOf(userInfo);
    cache:Error? stored = emailCache.put(user.sub, email ?: "");
    if stored is cache:Error {
        log:printWarn("Could not keep the caller's email in the cache", stored);
    }
    return email;
}

# The access token of the validated caller.
public isolated function getAccessToken(http:RequestContext ctx) returns string|error {
    return ctx.getWithType(CTX_TOKEN);
}

# Read the validated caller back out of the request context, for resource functions that need the caller's identity.
public isolated function getUser(http:RequestContext ctx) returns AsgardeoJwt|error {
    return ctx.getWithType(CTX_USER);
}