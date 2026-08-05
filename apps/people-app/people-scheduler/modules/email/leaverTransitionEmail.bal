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

import people_scheduler.database;

import ballerina/http;
import ballerina/log;
import ballerina/time;

configurable string[] leaverNotificationRecipients = ?;

# Send a summary email listing employees auto-transitioned from Marked leaver to Left.
#
# + transitions - Employees that were transitioned during this sweep (must be non-empty)
# + return - Error if the email notification fails to send
public isolated function notifyLeaverAutoTransition(database:LeaverTransition[] transitions) returns error? {
    string employeeListHtml = string:'join("",
    ...from database:LeaverTransition t in transitions
       select string `<li>${htmlEscape(t.firstName)} ${htmlEscape(t.lastName)} (${htmlEscape(t.employeeId)})
            &mdash; ${htmlEscape(t.workEmail)} &mdash; final day: ${htmlEscape(t.finalDayOfEmployment)}</li>`);

    string runDate = time:utcToString(time:utcNow()).substring(0, 10);

    map<string> keyValues = {
        APP_NAME: appName,
        RUN_DATE: runDate,
        COUNT: transitions.length().toString(),
        EMPLOYEE_LIST: employeeListHtml,
        YEAR: time:utcToCivil(time:utcNow()).year.toString()
    };

    string|error boundTemplate = bindKeyValues(leaverAutoTransitionSummaryTemplate, keyValues);
    if boundTemplate is error {
        log:printError("Failed to bind email template for leaver auto-transition summary notification",
                boundTemplate);
        return boundTemplate;
    }

    EmailPayload emailPayload = {
        to: leaverNotificationRecipients,
        'from: fromEmailAddress,
        subject: string `Employee Offboarding Alert (${runDate}): ${transitions.length()} employee(s) transitioned to Left`,
        template: boundTemplate
    };

    http:Response|http:ClientError response = emailClient->/send\-email.post(emailPayload);
    if response is http:ClientError {
        string customError = "Client Error occurred while sending the leaver auto-transition summary email!";
        log:printError(customError, response);
        return error(customError);
    }
    if response.statusCode != http:STATUS_OK {
        string customError = string `Error occurred while sending the leaver auto-transition summary email! - HTTP ${response.statusCode}`;
        json|error responseBody = response.getJsonPayload();
        log:printError(customError, responseBody = responseBody is json ? responseBody.toJsonString() : responseBody.message());
        return error(customError);
    }
    log:printInfo(string `Leaver auto-transition summary email sent successfully to ${emailPayload.to.toString()}`);
}
