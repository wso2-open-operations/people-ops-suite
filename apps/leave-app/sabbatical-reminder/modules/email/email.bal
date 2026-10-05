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
import ballerina/time;

# Send the sabbatical reminder to the lead, copying People Operations and the employee.
#
# + details - Reminder details
# + return - Error if the email could not be sent
public isolated function sendSabbaticalReminder(SabbaticalReminderDetails details) returns error? {
    string startDate = formatDisplayDate(details.startDate);
    string endDate = formatDisplayDate(details.endDate);
    string template = check bindKeyValues(sabbaticalReminderTemplate, {
        EMPLOYEE_NAME: details.employeeName,
        LEAVE_DURATION: formatDuration(details.durationDays),
        LEAVE_START_DATE: startDate,
        LEAVE_END_DATE: endDate,
        YEAR: time:utcToCivil(time:utcNow()).year.toString()
    });

    string[] debugRecipients = emailServiceConfig.debugRecipients;
    boolean isDebug = debugRecipients.length() > 0;
    EmailPayload payload = {
        to: isDebug ? debugRecipients : [details.leadEmail],
        cc: isDebug ? [] : [...emailServiceConfig.peopleOperationsRecipients, details.employeeEmail],
        'from: emailServiceConfig.'from,
        subject: string `[Leave App] Upcoming Sabbatical Leave Reminder - ${details.employeeName} (${
            startDate} - ${endDate})`,
        template
    };

    http:Response response = check emailClient->/send\-email.post(payload);
    if response.statusCode != http:STATUS_OK {
        return error(string `Email service responded with HTTP ${response.statusCode}`);
    }
}
