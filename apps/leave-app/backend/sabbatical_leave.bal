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
import leave_service.calendar_events;
import leave_service.database;
import leave_service.email;
import leave_service.employee;

import ballerina/log;
import ballerina/time;

configurable string[] sabbaticalMailGroups = ?;
configurable string sabbaticalLeaveApprovalUrl = ?;

# Create sabbatical leave event in calendar.
#
# + email - User email
# + leave - Sabbatical leave response
# + calendarEventId - Calendar event ID
isolated function createSabbaticalLeaveEventInCalendar(string email, SabbaticalLeaveResponse leave,
        string calendarEventId) {
    SabbaticalLeaveResponse {id, startDate, endDate, location} = leave;
    string startDateString = getDateStringFromTimestamp(startDate);
    string endDateString = getDateStringFromTimestamp(endDate);

    string timeZoneOffset = "+00:00";
    if location is string && TIMEZONE_OFFSET_MAP.hasKey(location) {
        timeZoneOffset = TIMEZONE_OFFSET_MAP.get(location);
    }

    calendar_events:Time startTime = {
        dateTime: string `${startDateString}T00:00:00.000`,
        timeZone: string `GMT${timeZoneOffset}`
    };
    calendar_events:Time endTime = {
        dateTime: string `${endDateString}T23:59:00.000`,
        timeZone: string `GMT${timeZoneOffset}`
    };

    string summary = "On Sabbatical Leave";
    string|error? eventId = calendar_events:createEvent(
            email,
            {
                summary,
                description: summary,
                colorId: "4",
                'start: startTime,
                end: endTime,
                id: calendarEventId
            }
    );

    if eventId is string {
        log:printInfo(string `Sabbatical event created successfully with event id: ${eventId}. Leave id: ${id}.`);
    } else if eventId is error {
        log:printError(
                string `Error occurred while creating sabbatical event for leave id: ${id} with ID: ${calendarEventId}.`,
                eventId
        );
    } else {
        log:printError(
                string `Error occurred while creating sabbatical event for leave id: ${id} with ID: ${calendarEventId}.
            No ID returned.`
        );
    }
}

# Process sabbatical leaves based on actions.
#
# + payload - Sabbatical leave request process payload
# + return - Error if any
function processSabbaticalLeaveRequest(SabbaticalProcessPayload payload)
    returns error? {
    var {action, applicantEmail, approverEmail, leaveStartDate, leaveEndDate, leaveId, location, comment, numberOfDays}
    = payload;
    string[] recipientsList = check getRecipientsForSabbaticalNotifications(applicantEmail, approverEmail);
    string emailSubject = "[Leave App] Sabbatical Leave Application - " + applicantEmail + " (" + leaveStartDate +
    " - " + leaveEndDate + ")";
    string emailBody = "";
    string year = time:utcToCivil(time:utcNow()).year.toString();
    string|error template = "";
    match (action) {
        APPROVE => {
            template = email:bindKeyValues(email:sabbaticalApprovalTemplate, {
                                                                                 "APPLICANT_EMAIL": applicantEmail,
                                                                                 "LEAD_EMAIL": approverEmail,
                                                                                 "LEAVE_START_DATE": leaveStartDate,
                                                                                 "LEAVE_END_DATE": leaveEndDate,
                                                                                 "YEAR": year,
                                                                                 "STATUS": "Approved"
                                                                             });
            _ = check database:setLeaveStatus(<int>leaveId, APPROVED);
            // Create calendar event for approved sabbatical leave
            string calendarEventId = createUuidForCalendarEvent();
            SabbaticalLeaveResponse leaveResponse = {
                id: calendarEventId,
                startDate: leaveStartDate,
                endDate: leaveEndDate,
                location: location
            };
            createSabbaticalLeaveEventInCalendar(applicantEmail, leaveResponse, calendarEventId);
            _ = check database:setCalendarEventIdForSabbaticalLeave(
                    <int>payload.leaveId, calendarEventId);
        }
        REJECT => {
            template = email:bindKeyValues(email:sabbaticalApprovalTemplate, {
                                                                                 "APPLICANT_EMAIL": applicantEmail,
                                                                                 "LEAD_EMAIL": approverEmail,
                                                                                 "LEAVE_START_DATE": leaveStartDate,
                                                                                 "LEAVE_END_DATE": leaveEndDate,
                                                                                 "YEAR": year,
                                                                                 "STATUS": "Rejected"
                                                                             });
            _ = check database:setLeaveStatus(<int>leaveId, REJECTED);
        }
        CANCEL => {
            template = email:bindKeyValues(email:sabbaticalCancellationTemplate, {
                                                                                     "APPLICANT_EMAIL": applicantEmail,
                                                                                     "LEAVE_START_DATE": leaveStartDate,
                                                                                     "LEAVE_END_DATE": leaveEndDate,
                                                                                     "YEAR": year
                                                                                 });
        }
        APPLY => {
            LeaveInput leaveInput = {
                startDate: leaveStartDate,
                endDate: leaveEndDate,
                leaveType: database:SABBATICAL_LEAVE,
                periodType: database:MULTIPLE_DAYS_LEAVE,
                email: applicantEmail,
                comment: comment,
                emailSubject: emailSubject,
                emailRecipients: recipientsList,
                isMorningLeave: (),
                status: PENDING,
                approverEmail: approverEmail
            };
            template = email:bindKeyValues(email:sabbaticalApplicationTemplate, {
                                                                                    "APPLICANT_EMAIL": applicantEmail,
                                                                                    "LEAD_EMAIL": approverEmail,
                                                                                    "LEAVE_START_DATE": leaveStartDate,
                                                                                    "LEAVE_END_DATE": leaveEndDate,
                                                                                    "YEAR": year,
                                                                                    "LEAVE_APP_URL":
                                                                                    sabbaticalLeaveApprovalUrl
                                                                                });
            if location is string {
                _ = check database:insertLeave(leaveInput, numberOfDays ?: 0.0, location);
            }
        }
    }

    map<string> emailContent = {"CONTENT": emailBody};
    if template is error {
        log:printError("Failed to bind key values to sabbatical leave template", template);
        return;
    }
    error? notificationResult = email:processEmailNotification("", emailSubject, emailContent, recipientsList,
            template);
    if (notificationResult is error) {
        log:printError("Failed to process sabbatical approval notification", notificationResult);
    }
}

# Get recipients for sabbatical leave notifications.
# + applicantEmail - Applicant email
# + leadEmail - Reporting lead email
# + return - List of recipient emails or an error
function getRecipientsForSabbaticalNotifications(string applicantEmail, string leadEmail)
    returns string[]|error {
    Employee reportingLead = check employee:getEmployee(leadEmail);

    string[] recipientsList = [];
    foreach string mailGroup in sabbaticalMailGroups {
        recipientsList.push(mailGroup);

    }
    recipientsList.push(applicantEmail); // applicant email
    recipientsList.push(leadEmail); // reporting lead email (approver)
    if reportingLead.leadEmail is () {
        log:printInfo("Functional Lead info is not available. Skipped notification for the functional lead.");
    }
    if reportingLead.leadEmail is string {
        string functionalLeadEmail = (<string>reportingLead.leadEmail).toLowerAscii(); // functional lead email
        boolean isOptedOut = false;
        foreach string optOutMail in sabbaticalFunctionalLeadOptOutMails {
            if functionalLeadEmail == optOutMail.toLowerAscii() {
                isOptedOut = true;
                break;
            }
        }
        if (!isOptedOut) {
            recipientsList.push(functionalLeadEmail);
        }
    }

    return recipientsList;
}

# Check eligibility criteria for sabbatical leave applications.
#
# + employmentStartDate - Employment start date
# + lastSabbaticalLeaveEndDate - Last sabbatical leave end date
# + return - Error if not eligible
isolated function checkEligibilityForSabbaticalApplication(string employmentStartDate,
        string? lastSabbaticalLeaveEndDate) returns boolean|error {

    time:Utc nowUTC = time:utcNow();
    string nowStr = time:utcToString(nowUTC).substring(0, 10);
    int|error daysSinceEmployment = check getDateDiffInDays(nowStr, employmentStartDate);
    int|error daysSinceLastSabbaticalLeave = 0;
    if lastSabbaticalLeaveEndDate is string {
        daysSinceLastSabbaticalLeave = getDateDiffInDays(nowStr, lastSabbaticalLeaveEndDate);
    }
    if daysSinceEmployment is int {
        if lastSabbaticalLeaveEndDate == () && daysSinceEmployment > sabbaticalLeaveEligibilityDuration {
            return true;
        }

    }
    // Eligibility: Employed for more than 3 years and last sabbatical leave taken more than 3 years ago
    if daysSinceEmployment is int && daysSinceLastSabbaticalLeave is int {
        if (daysSinceEmployment > sabbaticalLeaveEligibilityDuration &&
        daysSinceLastSabbaticalLeave > sabbaticalLeaveEligibilityDuration) {
            return true;
        }

    }
    return false;
}

# Calculate date difference in days.
#
# + endDate - End date (yyyy-mm-dd)
# + startDate - Start date (yyyy-mm-dd)
# + return - Difference in days or error
isolated function getDateDiffInDays(string endDate, string startDate) returns int|error {
    time:Utc utc1 = check time:utcFromString(endDate + "T00:00:00Z");
    time:Utc utc2 = check time:utcFromString(startDate + "T00:00:00Z");

    time:Seconds diffSeconds = time:utcDiffSeconds(utc1, utc2);

    return <int>(diffSeconds / 86400) + 1;
}

# Get subordinate count for a specific lead.
#
# + leadEmail - email of the reporting lead
# + return - subordinate count as an integer or an error on failure
isolated function getSubordinateCount(string leadEmail) returns int|error {
    Employee employee = check employee:getEmployee(leadEmail);
    return employee.subordinateCount;
}

# Get percentage of subordinates on sabbatical leave.
#
# + leadEmail - email of the reporting lead
# + return - percentage of subordinates on sabbatical leave or an error     
isolated function getSubordinateCountOnSabbaticalLeaveAsAPercentage(string leadEmail) returns string|error {
    int subordinateCount = check getSubordinateCount(leadEmail);
    if subordinateCount == 0 {
        return "0%"; // early return to prevent division by zero
    }
    int subordinateOnSabbaticalLeaveCount = check database:getSubordinateCountOnSabbaticalLeave(leadEmail);
    return ((<float>subordinateOnSabbaticalLeaveCount / <float>subordinateCount) * 100).toString() + "%";
}

