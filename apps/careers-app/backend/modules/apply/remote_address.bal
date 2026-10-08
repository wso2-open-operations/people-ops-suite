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

const string CTX_REMOTE_HOST = "careers-app-remote-host";

# Records the address of the connection in the request context. A resource that takes `http:Caller` cannot return
# typed responses, so the apply resource reads the address from the context instead.
public isolated service class RemoteAddressInterceptor {
    *http:RequestInterceptor;

    isolated resource function 'default [string... path](http:RequestContext ctx, http:Caller caller)
            returns http:NextService|error? {
        ctx.set(CTX_REMOTE_HOST, caller.remoteAddress.host);
        return ctx.next();
    }
}

# The address of the connection recorded by `RemoteAddressInterceptor`.
#
# + ctx - The request context
# + return - The connection's host, or "unknown" when it was not recorded
public isolated function remoteHost(http:RequestContext ctx) returns string {
    string|error host = ctx.getWithType(CTX_REMOTE_HOST);
    return host is string ? host : "unknown";
}
