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

# The routes open to guests, listed exactly: the job list, org structure, one job's detail and applying.
# A route added later, such as GET /jobs/saved, is not public unless it is added here.
isolated function isPublicRoute(string method, string[] path) returns boolean {
    if method == http:GET {
        return (path.length() == 1 && path[0] == "jobs")
            || (path.length() == 2 && path[0] == "jobs" && path[1] == "org-structure")
            || (path.length() == 2 && path[0] == "jobs" && types:isValidJobId(path[1]));
    }
    if method == http:POST {
        return path.length() == 3 && path[0] == "jobs" && types:isValidJobId(path[1]) && path[2] == "apply";
    }
    return false;
}

# Validates the caller's bearer token (JWKS, falling back to introspection)
# and stashes their identity in the request context for resource functions
public isolated service class JwtInterceptor {
    *http:RequestInterceptor;

    isolated resource function 'default [string... path](http:RequestContext ctx, http:Request req)
            returns http:NextService|AppUnauthorizedError|error? {
        if req.method == http:OPTIONS {
            return ctx.next();
        }

        if isPublicRoute(req.method, path) {
            return ctx.next();
        }

        string|http:HeaderNotFoundError authHeader = req.getHeader(http:AUTH_HEADER);
        if authHeader is http:HeaderNotFoundError || !authHeader.startsWith("Bearer ") {
            log:printError("Missing or malformed Authorization header", requestId = types:requestIdOf(ctx));
            return <AppUnauthorizedError>{body: {message: "Unauthorized"}};
        }
        string token = authHeader.substring(7);

        AsgardeoJwt|error user = validateToken(token);
        if user is error {
            log:printError("Token validation failed", user, requestId = types:requestIdOf(ctx));
            return <AppUnauthorizedError>{body: {message: "Unauthorized"}};
        }

        ctx.set(CTX_USER, user);
        return ctx.next();
    }
}
