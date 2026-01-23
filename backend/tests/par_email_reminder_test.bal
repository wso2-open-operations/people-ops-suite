// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import par_app.database;
import par_app.types;

import ballerina/http;
import ballerina/test;
import ballerina/time;

@test:Mock {
    moduleName: "par_app.database",
    functionName: "getBlobFieldQuery"
}
test:MockFunction getBlobFieldQueryMockFn = new ();

@test:Mock {
    moduleName: "par_app.email",
    functionName: "sendEmail"
}
test:MockFunction sendEmailMockFn = new ();

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParRating_GetAllParRatingAsNonAdmin]
}
function testParEmailReminders_SendLeadReminders() returns error? {
    int parCycleId = 3;
    database:EmailNotification[] emailNotifications = check getEmailNotificationsFromDB(parCycleId);
    int emailCount = emailNotifications.length();

    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    http:Response response = check testClient->patch(string `/reminders/schedule-lead-reminders`, (),
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_ACCEPTED,
        string `Invalid status code received when sending lead reminders. ` +
            string `Expected: ${http:STATUS_ACCEPTED}, Received: ${response.statusCode}`);

    emailNotifications = check getEmailNotificationsFromDB(parCycleId);
    test:assertEquals(emailNotifications.length(), emailCount + 4, "Email notifications count is incorrect.");

    database:EmailNotification[] leadReminders = from database:EmailNotification emailNotification in emailNotifications
        where emailNotification.emailType == types:LEAD_REMINDER
        select emailNotification;
    test:assertEquals(leadReminders.length(), 4, "Email lead reminders count is incorrect.");
    test:assertEquals(leadReminders[0].recipientEmail, "carl@wso2.com", "Email lead reminder recipient is incorrect.");
    test:assertEquals(leadReminders[1].recipientEmail, "bob@wso2.com", "Email lead reminder recipient is incorrect.");
    test:assertEquals(leadReminders[2].recipientEmail, "randy@wso2.com", "Email lead reminder recipient is incorrect.");
    test:assertEquals(leadReminders[3].recipientEmail, "diana@wso2.com", "Email lead reminder recipient is incorrect.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParEmailReminders_SendLeadReminders]
}
function testParEmailReminders_SendLeadReminders_AsNonAdmin() returns error? {
    types:InvokerDetails invokerDetails = getInvokerDetailsAs("tom@wso2.com");
    http:Response response = check testClient->patch(string `/reminders/schedule-lead-reminders`, (),
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when sending lead reminders. ` +
            string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload, {"message": "You are not authorized to send lead reminders."});
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParEmailReminders_SendLeadReminders]
}
function testParEmailReminders_SendEmployeeReminders() returns error? {
    int parCycleId = 3;
    database:EmailNotification[] emailNotifications = check getEmailNotificationsFromDB(parCycleId);
    int emailCount = emailNotifications.length();

    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    http:Response response = check testClient->patch(string `/reminders/schedule-employee-reminders`, (),
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_ACCEPTED,
        string `Invalid status code received when sending employee reminders. ` +
            string `Expected: ${http:STATUS_ACCEPTED}, Received: ${response.statusCode}`);

    emailNotifications = check getEmailNotificationsFromDB(parCycleId);
    test:assertEquals(emailNotifications.length(), emailCount + 5, "Email notifications count is incorrect.");

    database:EmailNotification[] empReminders = from database:EmailNotification emailNotification in emailNotifications
        where emailNotification.emailType == types:EMPLOYEE_REMINDER
        select emailNotification;
    test:assertEquals(empReminders.length(), 5, "Email employee reminders count is incorrect.");
    test:assertEquals(empReminders[0].recipientEmail, "brad@wso2.com", "Email employee reminder recipient is incorrect.");
    test:assertEquals(empReminders[1].recipientEmail, "carl@wso2.com", "Email employee reminder recipient is incorrect.");
    test:assertEquals(empReminders[2].recipientEmail, "sam@wso2.com", "Email employee reminder recipient is incorrect.");
    test:assertEquals(empReminders[3].recipientEmail, "anne@wso2.com", "Email employee reminder recipient is incorrect.");
    test:assertEquals(empReminders[4].recipientEmail, "david@wso2.com", "Email employee reminder recipient is incorrect.");

}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParEmailReminders_SendEmployeeReminders]
}
function testParEmailReminders_SendEmployeeReminders_AsNonAdmin() returns error? {
    types:InvokerDetails invokerDetails = getInvokerDetailsAs("tom@wso2.com");
    http:Response response = check testClient->patch(string `/reminders/schedule-employee-reminders`, (),
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when sending lead reminders. ` +
            string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload, {"message": "You are not authorized to send employee reminders."});
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [
        testParEmailReminders_SendEmployeeReminders,
        testPar360Reviews_AddPar360Review_WithoutStatus
    ]
}
function testParEmailReminders_Send360Reminders() returns error? {
    int parCycleId = 3;
    database:EmailNotification[] emailNotifications = check getEmailNotificationsFromDB(parCycleId);
    int emailCount = emailNotifications.length();

    types:InvokerDetails invokerDetails = getInvokerDetailsAs("carl@wso2.com");
    http:Response response = check testClient->patch(string `/reminders/schedule-360-reminders`, (),
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_ACCEPTED,
        string `Invalid status code received when sending 360 reminders. ` +
            string `Expected: ${http:STATUS_ACCEPTED}, Received: ${response.statusCode}`);

    emailNotifications = check getEmailNotificationsFromDB(parCycleId);
    test:assertEquals(emailNotifications.length(), emailCount + 2, "Email notifications count is incorrect.");

    database:EmailNotification[] threeSixtyReminders = from database:EmailNotification emailNotification in emailNotifications
        where emailNotification.emailType == types:THREE_SIXTY_REMINDER
        select emailNotification;
    test:assertEquals(threeSixtyReminders.length(), 2, "Email 360 reminders count is incorrect.");
    test:assertEquals(threeSixtyReminders[0].recipientEmail, "david@wso2.com", "Email 360 reminder recipient is incorrect.");
    test:assertEquals(threeSixtyReminders[1].recipientEmail, "sam@wso2.com", "Email 360 reminder recipient is incorrect.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParEmailReminders_Send360Reminders]
}
function testParEmailReminders_Send360Reminders_AsNonLead() returns error? {
    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    http:Response response = check testClient->patch(string `/reminders/schedule-360-reminders`, (),
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when sending 360 reminders. ` +
            string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload, {"message": "You are not authorized to send 360 reminders."});
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParEmailReminders_Send360Reminders]
}
function testParEmailReminders_SendSpecialRatingReminders() returns error? {
    int parCycleId = 3;
    database:EmailNotification[] emailNotifications = check getEmailNotificationsFromDB(parCycleId);
    int emailCount = emailNotifications.length();

    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    http:Response response = check testClient->patch(string `/reminders/schedule-special-rating-reminders`, (),
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_ACCEPTED,
        string `Invalid status code received when sending special rating reminders. ` +
            string `Expected: ${http:STATUS_ACCEPTED}, Received: ${response.statusCode}`);

    emailNotifications = check getEmailNotificationsFromDB(parCycleId);
    test:assertEquals(emailNotifications.length(), emailCount + 4, "Email notifications count is incorrect.");

    database:EmailNotification[] specialRatingReminders = from database:EmailNotification emailNotification in emailNotifications
        where emailNotification.emailType == types:SPECIAL_RATING_REMINDER
        select emailNotification;
    test:assertEquals(specialRatingReminders.length(), 4, "Email special rating reminders count is incorrect.");
    test:assertEquals(specialRatingReminders[0].recipientEmail, "carl@wso2.com", "Email special rating reminder recipient is incorrect.");
    test:assertEquals(specialRatingReminders[1].recipientEmail, "bob@wso2.com", "Email special rating reminder recipient is incorrect.");
    test:assertEquals(specialRatingReminders[2].recipientEmail, "randy@wso2.com", "Email special rating reminder recipient is incorrect.");
    test:assertEquals(specialRatingReminders[3].recipientEmail, "diana@wso2.com", "Email special rating reminder recipient is incorrect.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParEmailReminders_Send360Reminders]
}
function testParEmailReminders_SendSpecialRatingReminders_AsNonAdmin() returns error? {
    types:InvokerDetails invokerDetails = getInvokerDetailsAs("tom@wso2.com");
    http:Response response = check testClient->patch(string `/reminders/schedule-special-rating-reminders`, (),
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_FORBIDDEN,
        string `Invalid status code received when sending special rating reminders. ` +
            string `Expected: ${http:STATUS_FORBIDDEN}, Received: ${response.statusCode}`);
    json jsonPayload = check response.getJsonPayload();
    test:assertEquals(jsonPayload, {"message": "You are not authorized to send special rating reminders."});
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParEmailReminders_SendSpecialRatingReminders]
}
function testParEmailReminders_SendReminders() returns error? {
    test:when(getBlobFieldQueryMockFn).call("getBlobFieldQueryForTests");
    test:when(sendEmailMockFn).call("sendEmail");

    int notificationCount = (check database:getEmailNotifications(types:PENDING, 1000)).length();
    int parCycleId = 3;
    database:EmailNotification[] emailNotifications = check getEmailNotificationsFromDB(parCycleId);
    int emailCount = emailNotifications.length();

    globalEmailRecordArray.removeAll();
    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();

    while notificationCount > globalEmailRecordArray.length() {
        http:Response response = check testClient->patch(string `/reminders/send-reminders`, (),
        headers = getDefaultHeaders(invokerDetails));
        test:assertEquals(response.statusCode, http:STATUS_ACCEPTED,
        string `Invalid status code received when sending special rating reminders. ` +
            string `Expected: ${http:STATUS_ACCEPTED}, Received: ${response.statusCode}`);
    }

    database:EmailNotification[] emailNotificationsAfter = check getEmailNotificationsFromDB(parCycleId);
    test:assertEquals(emailNotificationsAfter.length(), emailCount, "Number of email notifications count is incorrect.");

    int sendEmailCount = (from database:EmailNotification emailNotification in emailNotificationsAfter
        where emailNotification.emailStatus == types:SENT
        select emailNotification).length();
    test:assertEquals(sendEmailCount, emailCount, "Number of sent email notifications count is incorrect.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParEmailReminders_SendReminders]
}
function testParEmailReminders_ScheduleAutoReminders_OnTheSameDayOfDeadline() returns error? {
    int parCycleId = 3;
    database:EmailNotification[] emailNotifications = check getEmailNotificationsFromDB(parCycleId);
    int emailCount = emailNotifications.length();

    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    http:Response response = check testClient->patch(string `/reminders/schedule-auto-reminders`, (),
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_ACCEPTED,
        string `Invalid status code received when sending special rating reminders. ` +
            string `Expected: ${http:STATUS_ACCEPTED}, Received: ${response.statusCode}`);

    emailNotifications = check getEmailNotificationsFromDB(parCycleId);
    test:assertEquals(emailNotifications.length(), emailCount, "Email notifications count is incorrect.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParEmailReminders_ScheduleAutoReminders_OnTheSameDayOfDeadline]
}
function testParEmailReminders_ScheduleAutoReminders() returns error? {
    int parCycleId = 3;
    database:EmailNotification[] emailNotifications = check getEmailNotificationsFromDB(parCycleId);
    int emailCount = emailNotifications.length();

    time:Utc tomorrowUtc = check getTomorrowUtc();
    check updateParCycleEmployeeDeadline(parCycleId, tomorrowUtc);
    check updateParCycleLeadDeadline(parCycleId, tomorrowUtc);
    check updateParCycleSpecialRatingDeadline(parCycleId, tomorrowUtc);

    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    http:Response response = check testClient->patch(string `/reminders/schedule-auto-reminders`, (),
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_ACCEPTED,
        string `Invalid status code received when sending special rating reminders. ` +
            string `Expected: ${http:STATUS_ACCEPTED}, Received: ${response.statusCode}`);

    emailNotifications = check getEmailNotificationsFromDB(parCycleId);
    test:assertEquals(emailNotifications.length(), emailCount + 13, "Email notifications count is incorrect.");

    database:EmailNotification[] empReminders = from database:EmailNotification emailNotification in emailNotifications
        where (emailNotification.emailType == types:EMPLOYEE_REMINDER && emailNotification.emailStatus == types:PENDING)
        select emailNotification;
    test:assertEquals(empReminders.length(), 5, "Email employee reminders count is incorrect.");
    test:assertEquals(empReminders[0].recipientEmail, "brad@wso2.com", "Email employee reminder recipient is incorrect.");
    test:assertEquals(empReminders[1].recipientEmail, "carl@wso2.com", "Email employee reminder recipient is incorrect.");
    test:assertEquals(empReminders[2].recipientEmail, "sam@wso2.com", "Email employee reminder recipient is incorrect.");
    test:assertEquals(empReminders[3].recipientEmail, "anne@wso2.com", "Email employee reminder recipient is incorrect.");
    test:assertEquals(empReminders[4].recipientEmail, "david@wso2.com", "Email employee reminder recipient is incorrect.");

    database:EmailNotification[] leadReminders = from database:EmailNotification emailNotification in emailNotifications
        where (emailNotification.emailType == types:LEAD_REMINDER && emailNotification.emailStatus == types:PENDING)
        select emailNotification;
    test:assertEquals(leadReminders.length(), 4, "Email lead reminders count is incorrect.");
    test:assertEquals(leadReminders[0].recipientEmail, "carl@wso2.com", "Email lead reminder recipient is incorrect.");
    test:assertEquals(leadReminders[1].recipientEmail, "bob@wso2.com", "Email lead reminder recipient is incorrect.");
    test:assertEquals(leadReminders[2].recipientEmail, "randy@wso2.com", "Email lead reminder recipient is incorrect.");
    test:assertEquals(leadReminders[3].recipientEmail, "diana@wso2.com", "Email lead reminder recipient is incorrect.");

    database:EmailNotification[] specialRatingReminders = from database:EmailNotification emailNotification in emailNotifications
        where (emailNotification.emailType == types:SPECIAL_RATING_REMINDER && emailNotification.emailStatus == types:PENDING)
        select emailNotification;
    test:assertEquals(specialRatingReminders.length(), 4, "Email special rating reminders count is incorrect.");
    test:assertEquals(specialRatingReminders[0].recipientEmail, "carl@wso2.com", "Email special rating reminder recipient is incorrect.");
    test:assertEquals(specialRatingReminders[1].recipientEmail, "bob@wso2.com", "Email special rating reminder recipient is incorrect.");
    test:assertEquals(specialRatingReminders[2].recipientEmail, "randy@wso2.com", "Email special rating reminder recipient is incorrect.");
    test:assertEquals(specialRatingReminders[3].recipientEmail, "diana@wso2.com", "Email special rating reminder recipient is incorrect.");
}

@test:Config {
    groups: ["CreateParCycleBasicTests"],
    dependsOn: [testParEmailReminders_ScheduleAutoReminders]
}
function testParEmailReminders_SendLeadReminders_Overdue() returns error? {
    int parCycleId = 3;
    types:ParCycle parCycle = check getParCycle(parCycleId);
    string originalLeadDeadline = parCycle.parLeadDeadline;
    check updateParCycleLeadDeadline(parCycleId, check getYesterdayUtc());

    database:EmailNotification[] emailNotifications = check getEmailNotificationsFromDB(parCycleId);
    int emailCount = emailNotifications.length();

    types:InvokerDetails invokerDetails = getDefaultInvokerDetails();
    http:Response response = check testClient->patch(string `/reminders/schedule-lead-reminders`, (),
        headers = getDefaultHeaders(invokerDetails));
    test:assertEquals(response.statusCode, http:STATUS_ACCEPTED,
        string `Invalid status code received when sending lead reminders. ` +
            string `Expected: ${http:STATUS_ACCEPTED}, Received: ${response.statusCode}`);

    emailNotifications = check getEmailNotificationsFromDB(parCycleId);
    test:assertEquals(emailNotifications.length(), emailCount + 4, "Email notifications count is incorrect.");

    check updateParCycleLeadDeadline(parCycleId, check getDateUtc(originalLeadDeadline));

    database:EmailNotification[] leadReminders = from database:EmailNotification emailNotification in emailNotifications
        where emailNotification.emailType == types:LEAD_REMINDER_OVERDUE
        select emailNotification;
    test:assertEquals(leadReminders.length(), 4, "Email lead reminders count is incorrect.");
    test:assertEquals(leadReminders[0].recipientEmail, "carl@wso2.com", "Email lead reminder recipient is incorrect.");
    test:assertEquals(leadReminders[1].recipientEmail, "bob@wso2.com", "Email lead reminder recipient is incorrect.");
    test:assertEquals(leadReminders[2].recipientEmail, "randy@wso2.com", "Email lead reminder recipient is incorrect.");
    test:assertEquals(leadReminders[3].recipientEmail, "diana@wso2.com", "Email lead reminder recipient is incorrect.");
}
