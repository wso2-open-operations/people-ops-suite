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

import sabbatical_reminder.database;
import sabbatical_reminder.email;
import sabbatical_reminder.employee;

import ballerina/log;
import ballerina/time;

# How many days before a sabbatical starts its lead is reminded.
configurable int reminderLeadTimeInDays = 28;

# Entry point for the sabbatical reminder job (deployed as a WSO2 Choreo Scheduled Task, run daily).
# Emails the lead of every approved sabbatical leave starting within the reminder window that has not
# had its reminder yet, then records the reminder as sent. One failed leave does not stop the others;
# the run reports an error at the end so it visibly shows as failed, and the failed leaves are retried
# on the next run.
#
# + return - Error if the leaves could not be read, or if any reminder failed
public function main() returns error? {
    time:Utc now = time:utcNow();
    string today = time:utcToString(now).substring(0, 10);
    string windowEnd = time:utcToString(time:utcAddSeconds(now, <decimal>reminderLeadTimeInDays * 86400d))
        .substring(0, 10);
    log:printInfo("Sabbatical reminder run started", today = today, windowEnd = windowEnd);

    database:SabbaticalReminder[] reminders = check database:getDueSabbaticalReminders(today, windowEnd);
    log:printInfo("Sabbatical leaves due for a reminder", count = reminders.length());

    int failed = 0;
    foreach database:SabbaticalReminder reminder in reminders {
        error? result = sendReminder(reminder);
        if result is error {
            failed += 1;
            log:printError("Failed to send sabbatical reminder", result, leaveId = reminder.id);
        }
    }

    log:printInfo("Sabbatical reminder run completed", sent = reminders.length() - failed, failed = failed);
    if failed > 0 {
        return error(string `${failed} sabbatical reminder(s) failed — see logs for details`);
    }
}

# Send the reminder for one sabbatical leave and record it as sent.
#
# + reminder - Leave due for a reminder
# + return - Error if the email could not be sent or recorded
function sendReminder(database:SabbaticalReminder reminder) returns error? {
    string|error employeeName = employee:getEmployeeName(reminder.email);
    if employeeName is error {
        log:printWarn("Could not fetch employee name, using email instead", employeeName,
                leaveId = reminder.id);
    }

    check email:sendSabbaticalReminder({
        employeeName: employeeName is string ? employeeName : reminder.email,
        employeeEmail: reminder.email,
        leadEmail: reminder.approverEmail,
        startDate: reminder.startDate,
        endDate: reminder.endDate,
        durationDays: reminder.durationDays
    });
    check database:markSabbaticalReminderSent(reminder.id);
    log:printInfo("Sabbatical reminder sent", leaveId = reminder.id);
}
