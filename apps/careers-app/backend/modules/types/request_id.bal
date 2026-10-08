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
import ballerina/uuid;

# The header that carries the request id to and from other services.
public const string REQUEST_ID_HEADER = "X-Request-ID";

const string CTX_REQUEST_ID = "careers-app-request-id";

// Letters, digits and "-" only, so an id taken from a caller cannot forge or split log lines.
final string:RegExp REQUEST_ID_PATTERN = re `[A-Za-z0-9-]{8,64}`;

# The id to use for a request: the caller's own when it is well formed, otherwise a new one.
#
# + incoming - The X-Request-ID the caller sent, if any
# + return - An id made of letters, digits and "-"
public isolated function requestIdFrom(string? incoming) returns string {
    if incoming is string && REQUEST_ID_PATTERN.isFullMatch(incoming) {
        return incoming;
    }
    return uuid:createType4AsString();
}

# Gives every request an id, so one request can be followed through this service's logs and the services it calls.
public isolated service class RequestIdInterceptor {
    *http:RequestInterceptor;

    isolated resource function 'default [string... path](http:RequestContext ctx, http:Request req)
            returns http:NextService|error? {
        string|http:HeaderNotFoundError incoming = req.getHeader(REQUEST_ID_HEADER);
        ctx.set(CTX_REQUEST_ID, requestIdFrom(incoming is string ? incoming : ()));
        return ctx.next();
    }
}

# The id given to the request by `RequestIdInterceptor`.
#
# + ctx - The request context
# + return - The request id, or "unknown" when it was not recorded
public isolated function requestIdOf(http:RequestContext ctx) returns string {
    string|error id = ctx.getWithType(CTX_REQUEST_ID);
    return id is string ? id : "unknown";
}
