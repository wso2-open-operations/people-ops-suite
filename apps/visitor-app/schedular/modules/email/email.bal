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
import ballerina/time;

public configurable string fromEmailAddress = ?;
public configurable string[] adminEmailList = ?;

# Sends a notification email to the admin group for a visit that was force-completed
# by the scheduler because the scheduled departure time passed without reception action.
#
# + visit - Details of the completed visit
# + return - An error if sending fails
public function sendForceCompleteEmail(CompletedVisitInfo visit) returns error? {
    string template = check bindKeyValues(
            forceCompleteTemplate,
            {
                "VISIT_ID": visit.id.toString(),
                "VISITOR_NAME": visit.visitorName,
                "COMPANY": visit.companyName ?: "N/A",
                "VISIT_DATE": visit.visitDate,
                "TIME_OF_ENTRY": visit.timeOfEntry ?: "N/A",
                "TIME_OF_DEPARTURE": visit.timeOfDeparture ?: "N/A",
                "WHOM_THEY_MEET": visit.whomTheyMeet ?: "N/A",
                "PASS_NUMBER": visit.passNumber ?: "N/A",
                "PURPOSE_OF_VISIT": visit.purposeOfVisit ?: "N/A",
                "YEAR": time:utcToCivil(time:utcNow()).year.toString()
            });
    return sendEmail(FORCE_COMPLETE_SUBJECT, template, visit.id);
}

# Sends a notification email to the admin group for a visit that has been active
# for more than one week with no departure recorded.
#
# + visit - Details of the long-running visit
# + return - An error if sending fails
public function sendExpiredVisitEmail(CompletedVisitInfo visit) returns error? {
    string|error template = bindKeyValues(
            expiredVisitTemplate,
            {
                "VISIT_ID": visit.id.toString(),
                "VISITOR_NAME": visit.visitorName,
                "COMPANY": visit.companyName ?: "N/A",
                "VISIT_DATE": visit.visitDate,
                "TIME_OF_ENTRY": visit.timeOfEntry ?: "N/A",
                "WHOM_THEY_MEET": visit.whomTheyMeet ?: "N/A",
                "PASS_NUMBER": visit.passNumber ?: "N/A",
                "PURPOSE_OF_VISIT": visit.purposeOfVisit ?: "N/A",
                "YEAR": time:utcToCivil(time:utcNow()).year.toString()
            });
    if template is error {
        log:printError("Failed to bind expired-visit email template", template, id = visit.id);
        return template;
    }
    return sendEmail(EXPIRED_VISIT_SUBJECT, template, visit.id);
}

isolated function sendEmail(string subject, string template, int visitId) returns error? {
    http:Response response = check emailClient->/send\-email.post(<EmailPayload>{
        to: adminEmailList,
        'from: fromEmailAddress,
        subject: subject,
        template: template
    });

    if response.statusCode != http:STATUS_OK {
        string msg = string `Email service rejected email for visit ${visitId}, status: ${response.statusCode}`;
        log:printError(msg);
        return error(msg);
    }
}
