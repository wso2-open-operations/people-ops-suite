// Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import ballerina/http;
import ballerina/log;

# Create a wifi account via the wifi service.

# + payload - Payload for creating wifi account
# + return - Error if any
public isolated function createWifiAccount(CreateWifiAccountPayload payload) returns error? {
    http:Response| http:ClientError response =  wifiClient->/guest\-wifi\-accounts.post(payload);
        if response is http:ClientError {
        string customError = string `Client Error occurred while creating the Guest Wifi !`;
        log:printError(customError, response);
        return error(customError);
    }
    if response.statusCode != http:STATUS_OK {

        string customError = string `Error occurred while creating the Guest Wifi !`;
        json|error responsePayload = response.getJsonPayload();
        if responsePayload is json {
            log:printError(string `${customError} : ${responsePayload.toJsonString()}`);
        } else {
            log:printError(customError);
        }
        return error(customError);
    }
}