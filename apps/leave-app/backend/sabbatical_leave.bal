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

import ballerina/log;
import ballerina/time;

configurable string sabbaticalEmailGroupToNotify = ?;
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

# Process sabbatical leave approval notifications (Email & Calendar).
#
# + isApproved - Is leave approved or not
# + applicantEmail - Applicant email
# + leadEmail - Reporting lead email
# + leaveStartDate - Leave start date
# + leaveEndDate - Leave end date
# + approvalStatusId - Leave approval status ID
# + location - Employee location
# + recipientsList - List of email recipients
# + return - Error if any
isolated function processSabbaticalLeaveApprovalNotification(boolean isApproved, string applicantEmail, string leadEmail,
        string leaveStartDate, string leaveEndDate, string approvalStatusId, string location, string[] recipientsList)
    returns error? {
    string subject = "Sabbatical Leave Application " + (isApproved ? "Approved - " : "Rejected - ") + applicantEmail;
    string emailBody = "The Sabbatical leave application of " + applicantEmail + " has been " +
    (isApproved ? "approved" : "rejected") + " by the reporting lead: " + leadEmail +
    ".<br/><br/> Approval Status Tracking ID: " + approvalStatusId + "<br/>Requested Leave Start Date: " +
    leaveStartDate + " <br/>Requested Leave End Date: " + leaveEndDate;

    map<string> emailContent = {"CONTENT": emailBody};
    error? notificationResult = email:processEmailNotification("", subject, emailContent, recipientsList);
    if (notificationResult is error) {
        log:printError("Failed to process sabbatical approval notification", notificationResult);
    }

    if !isApproved {
        return;
    }

    string calendarEventId = createUuidForCalendarEvent();
    SabbaticalLeaveResponse leaveResponse = {
        id: calendarEventId,
        startDate: leaveStartDate.substring(0, 10),
        endDate: leaveEndDate.substring(0, 10),
        location: location
    };
    createSabbaticalLeaveEventInCalendar(applicantEmail, leaveResponse, calendarEventId);
    return;
}

# Process sabbatical leave application requests.
#
# + applicantEmail - Applicant email
# + leadEmail - Reporting lead email
# + location - Employee location
# + numberOfDays - Number of days for the leave
# + leaveStartDate - Leave start date
# + leaveEndDate - Leave end date
# + recipientsList - List of email recipients
# + return - Error if any
isolated function processSabbaticalLeaveApplicationRequest(string applicantEmail, string leadEmail, string location,
        float numberOfDays, string leaveStartDate, string leaveEndDate, string[] recipientsList) returns error? {

    LeaveInput leaveInput = {
        startDate: leaveStartDate,
        endDate: leaveEndDate,
        leaveType: database:SABBATICAL_LEAVE,
        periodType: "multiple",
        email: applicantEmail,
        emailRecipients: recipientsList,
        isMorningLeave: ()
    };
    string approvalStatusId = check database:createSabbaticalLeaveRecord(leaveInput, numberOfDays, location, leadEmail);
    string subject = "New Sabbatical Leave Application - " + applicantEmail;
    string emailBody = "A new Sabbatical leave application has been submitted by " + applicantEmail +
    ".<br/><br/> Approval Status Tracking ID: " + approvalStatusId + "<br/>Requested Leave Start Date: " +
    leaveStartDate + " <br/>Requested Leave End Date: " + leaveEndDate + "<br/>Authorized Reporting Lead: " +
    leadEmail + "<br/><br/> The above stated reporting lead is required to review the application and" +
    " approve / reject this application via the Leave App (" + sabbaticalLeaveApprovalUrl + ").";

    map<string> emailContent = {"CONTENT": emailBody};
    error? notificationResult = email:processEmailNotification("", subject, emailContent, recipientsList);
    if (notificationResult is error) {
        log:printError("Failed to process sabbatical application notification", notificationResult);
    }
}

# Check eligibility criteria for sabbatical leave applications.
#
# + employmentStartDate - Employment start date
# + lastSabbaticalLeaveEndDate - Last sabbatical leave end date
# + return - Error if not eligible
isolated function checkEligibilityForSabbaticalApplication(string employmentStartDate,
        string lastSabbaticalLeaveEndDate) returns boolean|error {

    time:Utc nowUTC = time:utcNow();
    string nowStr = time:utcToString(nowUTC).substring(0, 10);
    int|error daysSinceEmployment = check getDateDiffInDays(nowStr, employmentStartDate);
    int|error daysSinceLastSabbaticalLeave = getDateDiffInDays(nowStr, lastSabbaticalLeaveEndDate);
    if daysSinceLastSabbaticalLeave is error {
        log:printInfo("Days since last sabbatical leave is empty.");
    }
    if daysSinceEmployment is int {
        if lastSabbaticalLeaveEndDate == "" && daysSinceEmployment > 1095 {
            return true;
        }

    }
    // Eligibility: Employed for more than 3 years and last sabbatical leave taken more than 3 years ago
    if daysSinceEmployment is int && daysSinceLastSabbaticalLeave is int {
        if ((daysSinceEmployment > 1095 && daysSinceLastSabbaticalLeave > 1095) || (daysSinceEmployment > 1095 &&
        lastSabbaticalLeaveEndDate == "")) {
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

    return <int>(diffSeconds / 86400);
}
