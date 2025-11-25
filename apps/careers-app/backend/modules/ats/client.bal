// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
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
