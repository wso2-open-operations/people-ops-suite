// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import ballerina/http;
import ballerina/log;

public configurable string visitorNotificationFrom = "";
public configurable string contactEmail = "";
public configurable string receptionEmail = "";

# Send an email alert via the email service.
#
# + payload - Payload for the email service
# + return - Response from the email service
public isolated function sendEmail(EmailPayload payload) returns error? {
    http:Response|http:ClientError response = emailClient->/send\-email.post(payload);
    if response is http:ClientError {
        string customError = string `Client Error occurred while sending the email !`;
        log:printError(customError, response);
        return error(customError);
    }
    if response.statusCode != http:STATUS_OK {

        string customError = string `Error occurred while sending the email !`;
        log:printError(string `${customError} : ${(check response.getJsonPayload()).toJsonString()}!`);
        return error(customError);
    }
    log:printInfo(string `Email sent successfully to ${payload.toString()}`);
}
