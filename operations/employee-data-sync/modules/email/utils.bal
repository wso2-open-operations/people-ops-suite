// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import ballerina/log;
import ballerina/mime;

# Bind values to the email template and encode.
#
# + content - Email content  
# + keyValPairs - Key value pairs
# + return - Email content
public isolated function bindKeyValues(string content, map<string> keyValPairs) returns string|error {
    string bindContent = keyValPairs.entries().reduce(
        isolated function(string accumulation, [string, string] keyVal) returns string {
        string:RegExp r = re `<!-- \[${keyVal[0].toUpperAscii()}\] -->`;
        return r.replaceAll(accumulation, keyVal[1]);
    },
    content);
    return mime:base64Encode(bindContent).ensureType();
}

# Sends an email alert when an employee data synchronization issue is detected.
#
# + tableName - Mame of the database table where the issue was found
# + attribute - Attribute that contains an invalid or missing value
# + value - Invalid value detected in the attribute (if applicable)
# + empEmail - Email address of the employee associated with the issue (if available)
# + return - An error if an issue occurs while generating the email content or sending the email, otherwise returns nil
public isolated function sendEmployeeSyncAlert(string tableName, string attribute, string? value, string? empEmail)
    returns error? {

    string|error content = bindKeyValues(
            invalidValueTemplate,
            {
                "EMPLOYEE_EMAIL": empEmail ?: "",
                "DATABASE_TABLE": tableName,
                "ATTRIBUTE": attribute,
                "INVALID_VALUE": value ?: "",
                "CONTACT_TEAM": emailConfig.contactTeam,
                "CONTACT_EMAIL": emailConfig.contactTeamEmail
            });
    if content is error {
        return error("Error with email template!", content);
    }
    error? emailResponse = sendEmail(
            {
                to: emailConfig.notificationTo,
                'from: emailConfig.notificationFrom,
                subject: string `[People-Ops - Employee Sync Service] Employee Sync Alert - Data Issue Detected`,
                template: content
            });
    if emailResponse is error {
        log:printError("Error occurred while sending the email!", emailResponse);
    }
    return emailResponse;
}
