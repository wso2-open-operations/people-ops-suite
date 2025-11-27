// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
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
import ballerina/log;

configurable ClientConfig config = ?;
configurable string atsClientUrl = ?;

final http:Client atsClient = check new (atsClientUrl, {
    httpVersion: http:HTTP_1_1,
    http1Settings: {keepAlive: http:KEEPALIVE_NEVER},
    timeout: 180.0,
    retryConfig: {
        count: 3,
        interval: 5.0,
        statusCodes: [
            http:STATUS_REQUEST_TIMEOUT,
            http:STATUS_BAD_GATEWAY,
            http:STATUS_SERVICE_UNAVAILABLE,
            http:STATUS_GATEWAY_TIMEOUT
        ]
    }
});

# Generate security headers.
#
# + return - return value description
public isolated function getSecurityHeaders() returns map<string|string[]>|http:ClientAuthError {
    http:ClientOAuth2Handler handler = new ({...config});
    map<string|string[]>|http:ClientAuthError authHeaders = handler.getSecurityHeaders();
    if authHeaders is http:ClientAuthError {
        log:printError("Error while generating security headers", authHeaders);
        handler = new ({...config});
        return handler.getSecurityHeaders();
    }
    return authHeaders;
}
