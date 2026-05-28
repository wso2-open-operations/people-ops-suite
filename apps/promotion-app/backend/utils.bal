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
import promotion_app.database;
import promotion_app.email;
import promotion_app.gsheet;
import promotion_app.people;

import ballerina/lang.regexp as regex;
import ballerina/time;
import ballerina/task;
import ballerina/log;

configurable string eligibleEmployeeGoogleSheetURL = ?;

configurable int emailBatchSize = 10;

configurable boolean enableEmailScheduler = false;

configurable boolean enableAutoReminderScheduler = false;

const SEND_REMINDERS_INTERVAL = 60.0d;
const SCHEDULE_AUTO_REMINDERS_INTERVAL = 86400.0d;

task:JobId? sendRemindersJobId = enableEmailScheduler ?
    check task:scheduleJobRecurByFrequency(new SendRemindersJob(), SEND_REMINDERS_INTERVAL) : ();
task:JobId? sendAutoRemindersJobId = enableAutoReminderScheduler ?
    check task:scheduleJobRecurByFrequency(new ScheduleAutoRemindersJob(), SCHEDULE_AUTO_REMINDERS_INTERVAL,
            startTime = time:utcToCivil(time:utcAddSeconds(check getDateTodayUtc(),
                            check SECONDS_FOR_ONE_DAY.ensureType()))) : ();

# Checks whether the deadlines are in future with user's timezone offset.
#
# + dbStoredDate - The date stored in database to be checked
# + userTimezoneOffset - User's timezone offset
# + return - Returns true if the date is in the future, false otherwise
public isolated function isFutureDate(string dbStoredDate, decimal userTimezoneOffset) returns boolean|error {
    time:Utc dbDateUtc = check getDateUtc(dbStoredDate);
    // Add 86400 to include that day
    time:Utc dbDateUserLocal = time:utcAddSeconds(dbDateUtc, 86400d + userTimezoneOffset * 3600d);

    time:Utc currentDateUtc = time:utcNow();
    time:Utc currentDateUserLocal = time:utcAddSeconds(currentDateUtc, userTimezoneOffset * 3600);

    return time:utcDiffSeconds(dbDateUserLocal, currentDateUserLocal) >= 0d;
}

# Check if the given number of seconds is greater than a day with a threshold.
#
# + seconds - The number of seconds.
# + return - True if the given number of seconds is one day before, false otherwise.
public isolated function isOneDayBefore(int seconds) returns boolean {
    int diffSeconds = seconds - SECONDS_FOR_ONE_DAY;
    return diffSeconds >= 0 && diffSeconds < SECONDS_THRESHOLD;
}

# Check if the given number of seconds is greater than three days with a threshold.
#
# + seconds - The number of seconds.
# + return - True if the given number of seconds is three days before, false otherwise.
public isolated function isThreeDaysBefore(int seconds) returns boolean {
    int diffSeconds = seconds - SECONDS_FOR_THREE_DAYS;
    return diffSeconds >= 0 && diffSeconds < SECONDS_THRESHOLD;
}

# Check if the given number of seconds is greater than seven days with a threshold.
#
# + seconds - The number of seconds.
# + return - True if the given number of seconds is seven days before, false otherwise.
public isolated function isSevenDaysBefore(int seconds) returns boolean {
    int diffSeconds = seconds - SECONDS_FOR_SEVEN_DAYS;
    return diffSeconds >= 0 && diffSeconds < SECONDS_THRESHOLD;
}

# Check if the auto reminder is eligible for the given date.
#
# + dateUtc - The date in UTC
# + return - True if the auto reminder is eligible, false otherwise
public isolated function isAutoReminderEligible(time:Utc dateUtc) returns boolean {
    int|error diffSeconds = getRemainingSeconds(dateUtc);
    if diffSeconds is error {
        log:printDebug("Unable to get the difference in seconds.");
        return false;
    }
    return isOneDayBefore(diffSeconds) || isThreeDaysBefore(diffSeconds) ||
        isSevenDaysBefore(diffSeconds);
}

# Get the remaining seconds for the given date.
#
# + dateUtc - The date in UTC
# + return - The remaining seconds or an error if the operation failed
public isolated function getRemainingSeconds(time:Utc dateUtc) returns int|error {
    time:Utc dateTodayUtc = check getDateTodayUtc();
    time:Seconds utcDiffSeconds = time:utcDiffSeconds(dateUtc, dateTodayUtc);
    return check int:fromString(utcDiffSeconds.toString());
}

# Get today's date in UTC.
#
# + return - Today's date in UTC or an error if the operation failed
public isolated function getDateTodayUtc() returns time:Utc|error =>
    time:utcFromString(time:utcToString(time:utcNow()).substring(0, 10) +
        UTC_DEFAULT_STRING);

# Get date in UTC for the given date.
#
# + date - The date in the format 'yyyy-MM-dd'
# + return - The date in UTC or an error if the operation failed
public isolated function getDateUtc(string date) returns time:Utc|error =>
    time:utcFromString(date + UTC_DEFAULT_STRING);

# Get the remaining days for the given date.
#
# + dateUtc - The date in UTC
# + return - The remaining days or an error if the operation failed
public isolated function getRemainingDays(time:Utc dateUtc) returns int|error {
    int diffSeconds = check getRemainingSeconds(dateUtc);
    return diffSeconds / SECONDS_FOR_ONE_DAY;
}

# Check Role array has the functional lead role.
#
# + roles - The array of roles
# + return - True or false
isolated function hasFunctionalLeadRole(database:Role[] roles) returns boolean {
    foreach database:Role r in roles {
        if r == database:FUNCTIONAL_LEAD {
            return true;
        }
    }
    return false;
}

# The Job class for sending reminders.
class SendRemindersJob {
    *task:Job;

    public function execute() {
        error? sendRemindersResult = sendReminders();
        if sendRemindersResult is error {
            log:printWarn("Error occurred while sending reminders.", sendRemindersResult);
        }
    }
}

# The Job class for scheduling auto reminders.
class ScheduleAutoRemindersJob {
    *task:Job;

    public function execute() {
        error? scheduleAutoRemindersResult = scheduleAutoReminders();
        if scheduleAutoRemindersResult is error {
            log:printWarn("Error occurred while scheduling auto reminders.", scheduleAutoRemindersResult);
        }
    }
}

# Send scheduled reminder emails to leads and functional leads.
#
# + return - An error if the operation failed or nil otherwise
public isolated function sendReminders() returns error? {
    database:InsertEmailData[] emailNotifications = [];
    transaction {
        emailNotifications = check database:getEmailNotifications(database:PENDING, emailBatchSize);
        if emailNotifications.length() > 0 {
            int[] notificationIds = from database:InsertEmailData {promotionEmailId} in emailNotifications
                where promotionEmailId !is ()
                select promotionEmailId;
            check database:updateEmailNotifications(notificationIds, database:PROCESSING);
        }
        check commit;
    }

    if emailNotifications.length() > 0 {
        foreach database:InsertEmailData emailNotification in emailNotifications {
            email:EmailTemplateData emailTemplateData = check emailNotification.templateData.fromJsonStringWithType();
            email:GenerateContentPayload generateContentPayload = {
                deadline: emailTemplateData.deadline,
                recipientName: emailNotification.recipientName,
                remainingDays: emailTemplateData.remainingDays
            };
                
            string emailContent = check email:generateEmailContent(generateContentPayload);

            database:PromotionCycle promotionCycle = check database:getPromotionCycleById(emailNotification.cycleId);

            error? sendEmailResult = email:sendReminderEmail([emailNotification.recipientEmail], promotionCycle.name, emailContent);

            if sendEmailResult is error {
                log:printError("Error occurred while sending the email.", sendEmailResult);
                check database:updateEmailNotifications([check emailNotification.promotionEmailId.ensureType()], database:FAILED);
                continue;
            }
            check database:updateEmailNotifications([check emailNotification.promotionEmailId.ensureType()], database:SENT);
        }
    }
}

# Schedule auto reminders for the Promotion cycle deadlines.
#
# + return - An error if the operation failed or nil otherwise
public isolated function scheduleAutoReminders() returns error? {

    database:PromotionCycle[] promotionCycles = check database:getPromotionCyclesByStatus([database:OPEN]);

    if promotionCycles.length() > 0 {
        if isAutoReminderEligible(check getDateUtc(promotionCycles[0].leadDeadline)) {
            _ = check scheduleLeadReminders(promotionCycles[0]);
        }
        if isAutoReminderEligible(check getDateUtc(promotionCycles[0].functionalLeadDeadline)) {
            _ = check scheduleFunctionalLeadReminders(promotionCycles[0]);
        }
    }
}

# Schedule lead email reminders.
#
# + promotionCycle - The open promotion cycle
# + return - integer or error
public isolated function scheduleLeadReminders(database:PromotionCycle promotionCycle) returns int|error {
    database:FullPromotionRecommendation[] recommendationsArray = check database:getFullPromotionRecommendations(
                statusArray = [database:REQUESTED],
                cycleID = promotionCycle.id);

    map<string|boolean> pendingLeads = {};
    database:InsertEmailData[] insertEmailDataArray = [];

    foreach database:FullPromotionRecommendation promotionRequest in recommendationsArray {
        if pendingLeads.hasKey(promotionRequest.leadEmail){
            continue;
        }
        pendingLeads[promotionRequest.leadEmail] = true;
    }

    foreach string leadEmail in pendingLeads.keys() {
        people:EmployeeName leadName = check people:getEmployeeName(leadEmail);

        email:EmailTemplateData templateData = {
            deadline: promotionCycle.leadDeadline,
            recipientName: leadName.firstName,
            remainingDays: int:abs(check getRemainingDays(check getDateUtc(promotionCycle.leadDeadline))).toString()
        };

        database:InsertEmailData insertEmailData = {
            cycleId: promotionCycle.id,
            recipientEmail: leadEmail,
            recipientName: leadName.firstName,
            emailType: database:LEAD_REMINDER,
            status: database:PENDING,
            templateData: templateData.toString()
        };

        insertEmailDataArray.push(insertEmailData);
    }

    _ = check database:insertEmailNotificationsBulk(insertEmailDataArray);
    return 1;
}

# Schedule functional lead reminders.
# 
# + promotionCycle - The open promotion cycle
# + return - Integer or an error if the operation failed
public isolated function scheduleFunctionalLeadReminders(database:PromotionCycle promotionCycle) returns int|error {
        database:User[] users = check database:getUsers();
        database:User[] functionalLeads = users.filter(u => hasFunctionalLeadRole(u.roles));
        database:User[] pending = [];
        database:InsertEmailData[] insertEmailDataArray = [];

        foreach database:User functionalLead in functionalLeads {
            database:Promotion[] requests = check database:getPromotions(
                businessAccessLevels = functionalLead.functionalLeadAccessLevels,
                statusArray = [database:SUBMITTED], cycleID = promotionCycle.id);
            if requests.length() > 0 {
                pending.push(functionalLead);
            }
        }

        foreach database:User pendingFunctionalLead in pending {
            email:EmailTemplateData templateData = {
                deadline: promotionCycle.functionalLeadDeadline,
                recipientName: pendingFunctionalLead.firstName,
                remainingDays: int:abs(check getRemainingDays(check getDateUtc(promotionCycle.functionalLeadDeadline))).toString()
            };

            database:InsertEmailData insertEmailData = {
                cycleId: promotionCycle.id,
                recipientEmail: pendingFunctionalLead.email,
                recipientName: pendingFunctionalLead.firstName,
                emailType: database:FUNCTIONAL_LEAD_REMINDER,
                status: database:PENDING,
                templateData: templateData.toString()
            };
        
            insertEmailDataArray.push(insertEmailData);
        }

        _ = check database:insertEmailNotificationsBulk(insertEmailDataArray);

        return 1;
}

# Automatic promotions for JB 5 to JB 6.
#
# + promotionCycleId - Promotion cycle ID
# + sheetUrl - Time-Based sync sheet URL
# + return - return error is any
isolated function createAutomaticPromotionRequests(int promotionCycleId, string sheetUrl) returns error? {

    // Update config tables with process status
    _ = check database:insertOrUpdateConfig({
        key: TIME_BASED_PROMOTION_KEY,
        value: database:IN_PROGRESS,
        createdBy: "SYSTEM",
        updatedBy: "SYSTEM"
    });

    //Retrieve the list of eligible employees from google sheet and process
    (int|string|decimal)[][]|error sheetData = gsheet:getSheetData(sheetUrl);
    if sheetData is error {
        string cusError = "Error occurred while accessing the google sheet";
        _ = check database:insertOrUpdateConfig({
            key: TIME_BASED_PROMOTION_KEY,
            value: database:ERROR,
            createdBy: "SYSTEM",
            updatedBy: "SYSTEM"
        });

        return error(cusError);
    }

    foreach (int|string|decimal)[] dataRow in sheetData {
        do {

            string employeeEmail = dataRow[0].toString();
            people:Employee|error employee = people:getEmployee(employeeEmail);
            if employee is error {
                log:printError(string `An error occurred while retrieving information of ${employeeEmail}`, employee);
                // Adding skipped completed employee to the google sheet
                _ = check gsheet:appendData(sheetUrl, 4, [employeeEmail, employee.message()]);
                continue;
            }

            // verifying last promoted date is null
            if employee.lastPromotedDate is null {
                employee.lastPromotedDate = employee.startDate;
            }

            // Fix for the incorrect last promotion date pattern
            employee.lastPromotedDate = regex:replaceAll(re `/`, <string>employee.lastPromotedDate, "-");

            // Check if there are any existing promotion requests for the same promotion cycle
            if !check database:isDuplicatePromotionRequest(employeeEmail, promotionCycleId) {

                // Create promotion request
                int applicationID = check database:insertPromotionRequest(
                        {
                    employeeEmail: employeeEmail,
                    currentJobBand: 5,
                    requestedJobBand: 6,
                    promotionType: database:TIME_BASED,
                    status: database:DRAFT,
                    promotionCycleId: promotionCycleId,
                    businessUnit: employee.businessUnit,
                    department: employee.department,
                    team: employee.team,
                    subTeam: employee.subTeam,
                    jobRole: employee.jobRole,
                    createdBy: "SYSTEM"
                }
                    );

                // Add a new promotion recommendation
                _ = check database:insertPromotionRecommendation(
                        {
                    promotionRequestID: applicationID,
                    leadEmail: <string>employee.managerEmail,
                    isReportingLead: true,
                    status: database:REQUESTED,
                    createdBy: "SYSTEM"
                }
                    );

                // TODO : Email notification for reporting leads.
                // db:PromotionCycle promotionCycle = check db:getPromotionCycleById(promotionCycleId);
                // _ = check email:recommendationAlert(payload = {
                //     receiverName: "Lead",
                //     receiverEmail:  <string>employee.managerEmail,
                //     senderName: employee.firstName + " " + employee.lastName,
                //     senderEmail: email:ALERT_FROM,
                //     closingDate: promotionCycle.endDate,
                //     templateId: email:hrisPromotionRecommendationRequest
                // });

                // Adding completed employee to the google sheet
                _ = check gsheet:appendData(sheetUrl, 2, [employeeEmail]);
            }
        } on fail error dataError {
            // Update config tables with background process error
            _ = check database:insertOrUpdateConfig(
                    {
                key: TIME_BASED_PROMOTION_KEY,
                value: database:ERROR,
                additionalInfo: "Error while processing employee list.",
                createdBy: "SYSTEM",
                updatedBy: "SYSTEM"
            }
                );

            string cusError = "Error while processing automatic promotions for JB 5 to 6.";
            log:printError(cusError, dataError);
            return error(cusError);
        }
    }

    // Retrieve list of leads email to send the notification
    string[] leads = check database:getRecommendedLeads(cycleID = promotionCycleId, 'type = database:TIME_BASED);

    foreach string lead in leads {
        //Adding completed employee to the google sheet
        _ = check gsheet:appendData(eligibleEmployeeGoogleSheetURL, 3, [lead]);
    }

    //TODO send the mail

    // Update config tables with background process status
    _ = check database:insertOrUpdateConfig(
            {
        key: TIME_BASED_PROMOTION_KEY,
        value: database:SUCCESS,
        createdBy: "SYSTEM",
        updatedBy: "SYSTEM"
    }
        );
}
