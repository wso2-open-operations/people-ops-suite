// Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import ballerina/log;
import ballerina/http;

# Create a wifi account via the wifi service.

# + payload - Payload for creating wifi account
# + return - Error if any
public isolated function createWifiAccount(CreateWifiAccountPayload payload) 
    returns CreateWifiAccountResponse|error {

    CreateWifiAccountResponse|error response = wifiClient->/guest\-wifi\-accounts.post(payload);
    if response is error {
        if response is http:ClientRequestError {
            http:Detail? detail = response.detail();
            if detail is () {
                log:printError("No error detail available for the client request error", response);
                return error("Failed to create WiFi account due to client request error");
            }

            ResponseBody responseBody = check detail.body.cloneWithType();
            if detail.statusCode == http:STATUS_CONFLICT {
                return <CreateWifiAccountResponse>{
                    statusCode: http:STATUS_CONFLICT,
                    message: string `WiFi account already exists for this user: ${payload.username}`,
                    guestAccount: responseBody.guestAccount ?: payload.username
                };
            }
        }
        
        string customError = string `Client Error occurred while creating the Guest Wifi !`;
        log:printError(customError, response);
        return error(customError);
    }

    return response;
}
