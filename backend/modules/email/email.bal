// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import par_app.database;
import par_app.types;

import ballerina/http;
import ballerina/log;
import ballerina/url;

configurable boolean allowedEmailAddressesOnly = true;
configurable string[] allowedEmailAddresses = [];
configurable string userGuideLink = ?;
configurable string slidesLink = ?;

# Send an email using the email client.
#
# + emailRecord - EmailRecord object which contains the email details.
# + return - An error if the email sending fails.
public isolated function sendEmail(EmailRecord emailRecord) returns error? {
    if allowedEmailAddressesOnly && !isAllowedToSend(emailRecord) {
        return error("Email sending is limited only to the configured email addresses. Failed to send email, To : [" +
                string:'join(", ", ...emailRecord.to) + "] and Cc: [" + string:'join(", ", ...emailRecord.cc) + "]");
    }
    emailRecord.appUuid = emailAppUuid;
    emailRecord.frm = fromEmail;
    http:Response|http:ClientError response = emailClient->/send\-smtp\-email.post(emailRecord);
    if response is http:ClientError {
        string errorMsg = string `Client Error occurred while sending the email: ${response.toString()}`;
        log:printError(errorMsg, response);
        return error(errorMsg);
    }
    if response.statusCode != http:STATUS_OK {
        string errorMsg = string `Error occurred while sending the email. Status Code: ${response.statusCode}`;
        log:printError(errorMsg);
        return error(errorMsg);
    }
    log:printInfo("Email sent successfully to " + emailRecord.to.toString());
}

# Generate the email content based on the email type and the email template data.
#
# + emailNotification - EmailNotification object which contains the email type and the email template data.
# + return - The generated email content or an error if the email template is not found.
public isolated function generateEmailContent(database:EmailNotification emailNotification)
        returns string|error {
    EmailTemplateData emailTemplateData = check emailNotification.emailTemplateData.fromJsonStringWithType();
    map<string> replacementValues = {};
    replacementValues[types:EMAIL_RECIPIENT_NAME] = emailNotification.recipientName;
    replacementValues[types:EMAIL_PAR_CYCLE_NAME] = emailTemplateData.parCycleName;
    string parBaseUrl = (check database:getParConfiguration(types:EMAIL_PAR_APP_BASE_URL)).parConfigValue;
    string content;
    if emailNotification.emailType == types:EMPLOYEE_INVITATION && isTemplateAllowed(emailNotification.emailType) {
        types:ParCycleDates parCycleDates =
            check (emailTemplateData.content[types:EMAIL_ADDITIONAL_DATA]).cloneWithType();
        replacementValues[types:EMAIL_PAR_CYCLE_START_DATE] =
            check formatDateString(parCycleDates.parCycleStartDate);
        replacementValues[types:EMAIL_PAR_CYCLE_END_DATE] =
            check formatDateString(parCycleDates.parCycleEndDate);
        replacementValues[types:EMAIL_PAR_EVALUATION_START_DATE] =
            check formatDateString(parCycleDates.parEvaluationStartDate);
        replacementValues[types:EMAIL_PAR_EVALUATION_END_DATE] =
            check formatDateString(parCycleDates.parEvaluationEndDate);
        replacementValues[types:EMAIL_EMPLOYEE_DEADLINE] =
            check formatDateString(parCycleDates.parEmployeeDeadline);
        replacementValues[types:EMAIL_LEAD_DEADLINE] =
            check formatDateString(parCycleDates.parLeadDeadline);
        replacementValues[types:EMAIL_360_DEADLINE] =
            check formatDateString(parCycleDates.parThreeSixtyRatingDeadline);
        replacementValues[types:EMAIL_SPECIAL_RATING_DEADLINE] =
            check formatDateString(parCycleDates.parSpecialRatingDeadline);
        replacementValues[types:EMAIL_F2F_DEADLINE] =
            check formatDateString(parCycleDates.parF2FDeadline);
        replacementValues[types:USER_GUIDE_LINK] = userGuideLink;
        replacementValues[types:SLIDES_LINK] = slidesLink;
        content = (check database:getParConfiguration(types:EMAIL_TEMPLATE_PAR_INVITATION)).parConfigValue;
    } else if emailNotification.emailType == types:EMPLOYEE_REMINDER && isTemplateAllowed(emailNotification.emailType) {
        string? deadline = emailTemplateData.deadline;
        replacementValues[types:EMAIL_DEADLINE] =
            deadline is string ? check formatDateString(deadline) : types:EMAIL_NO_DATA;
        replacementValues[types:EMAIL_REMAINING_DAYS] = emailTemplateData.remainingDays != () ?
            emailTemplateData.remainingDays.toString() : types:EMAIL_NO_DATA;
        replacementValues[types:USER_GUIDE_LINK] = userGuideLink;
        content = (check database:getParConfiguration(types:EMAIL_TEMPLATE_EMPLOYEE_REMINDER)).parConfigValue;
    } else if (emailNotification.emailType == types:LEAD_REMINDER && isTemplateAllowed(emailNotification.emailType)) ||
        (emailNotification.emailType == types:LEAD_REMINDER_OVERDUE && isTemplateAllowed(emailNotification.emailType)) {
        string? deadline = emailTemplateData.deadline;
        replacementValues[types:EMAIL_DEADLINE] =
            deadline is string ? check formatDateString(deadline) : types:EMAIL_NO_DATA;
        replacementValues[types:EMAIL_REMAINING_DAYS] = int:abs(emailTemplateData.remainingDays ?: 0).toString();
        replacementValues[types:EMAIL_ADDITIONAL_DATA] =
            getParTeamSummary(check (emailTemplateData.content[types:EMAIL_ADDITIONAL_DATA]).cloneWithType());
        replacementValues[types:USER_GUIDE_LINK] = userGuideLink;
        content = emailNotification.emailType == types:LEAD_REMINDER ?
            (check database:getParConfiguration(types:EMAIL_TEMPLATE_LEAD_REMINDER)).parConfigValue :
            (check database:getParConfiguration(types:EMAIL_TEMPLATE_LEAD_OVERDUE_REMINDER)).parConfigValue;
    } else if emailNotification.emailType ==
        types:THREE_SIXTY_REMINDER && isTemplateAllowed(emailNotification.emailType) {
        string? deadline = emailTemplateData.deadline;
        replacementValues[types:EMAIL_DEADLINE] =
            deadline is string ? check formatDateString(deadline) : types:EMAIL_NO_DATA;
        replacementValues[types:EMAIL_REMAINING_DAYS] = emailTemplateData.remainingDays != () ?
            emailTemplateData.remainingDays.toString() : types:EMAIL_NO_DATA;
        replacementValues[types:EMAIL_ADDITIONAL_DATA] = check getRevieweesDetails(
            check (emailTemplateData.content[types:EMAIL_ADDITIONAL_DATA]).cloneWithType(), parBaseUrl);
        replacementValues[types:USER_GUIDE_LINK] = userGuideLink;
        content = (check database:getParConfiguration(types:EMAIL_TEMPLATE_360_REMINDER)).parConfigValue;
    } else if emailNotification.emailType == types:THREE_SIXTY_NOTIFICATION
        && isTemplateAllowed(emailNotification.emailType) {
        string? deadline = emailTemplateData.deadline;
        replacementValues[types:EMAIL_DEADLINE] = deadline is string ?
            check formatDateString(deadline) : types:EMAIL_NO_DATA;
        replacementValues[types:EMAIL_REMAINING_DAYS] = emailTemplateData.remainingDays != () ?
            emailTemplateData.remainingDays.toString() : types:EMAIL_NO_DATA;
        replacementValues[types:EMAIL_EMPLOYEE_NAME] = check getRevieweeDetails(
            check (emailTemplateData.content[types:EMAIL_ADDITIONAL_DATA]).cloneWithType());
        replacementValues[types:EMAIL_ADDITIONAL_DATA] = check getRedirectURL(
            check (emailTemplateData.content[types:EMAIL_ADDITIONAL_DATA]).cloneWithType(), parBaseUrl);
        content = (check database:getParConfiguration(types:EMAIL_TEMPLATE_360_NOTIFICATION)).parConfigValue;
    } else if emailNotification.emailType == types:SPECIAL_RATING_REMINDER
        && isTemplateAllowed(emailNotification.emailType) {
        string? deadline = emailTemplateData.deadline;
        replacementValues[types:EMAIL_DEADLINE] =
            deadline is string ? check formatDateString(deadline) : types:EMAIL_NO_DATA;
        replacementValues[types:EMAIL_REMAINING_DAYS] = emailTemplateData.remainingDays != () ?
            emailTemplateData.remainingDays.toString() : types:EMAIL_NO_DATA;
        content = (check database:getParConfiguration(types:EMAIL_TEMPLATE_SPECIAL_RATING_REMINDER)).parConfigValue;
    } else if emailNotification.emailType == types:PAR_LEAD_SHARED_NOTIFICATION
        && isTemplateAllowed(emailNotification.emailType) {
        replacementValues[types:USER_GUIDE_LINK] = userGuideLink;
        content = (check database:getParConfiguration(types:EMAIL_TEMPLATE_LEAD_SHARED_NOTIFICATION)).parConfigValue;
    } else if emailNotification.emailType == types:PAR_EMPLOYEE_SHARED_NOTIFICATION
        && isTemplateAllowed(emailNotification.emailType) {
        types:EmployeeTeam employeeTeam = check emailTemplateData.content[types:EMAIL_ADDITIONAL_DATA].cloneWithType();
        replacementValues[types:EMAIL_EMPLOYEE_NAME] = employeeTeam.employeeName;
        replacementValues[types:EMAIL_EMPLOYEE_PAR_LINK] = check getEmployeeParLink(parBaseUrl, employeeTeam.workEmail,
            employeeTeam.teamId);
        content = (check database:getParConfiguration(types:EMAIL_TEMPLATE_EMPLOYEE_SHARED_NOTIFICATION)).parConfigValue;
    } else {
        return error("Email template not found for the email type: " + emailNotification.emailType.toString());
    }
    return replacePlaceHolders(content, replacementValues);
}

isolated function replacePlaceHolders(string content, map<string> emailParameters)
        returns string|error {
    string modifiedContent = content;
    foreach var [key, value] in emailParameters.entries() {
        modifiedContent = re `<!-- \[${key.toUpperAscii()}\] -->`.replaceAll(modifiedContent, value);
    }
    return modifiedContent;
}

isolated function getParTeamSummary(database:ParTeamSummary[] pendingTeamSummaries) returns string {
    return (xml `
        <table>
            <thead>
                <tr style="background-color:#E8EAED;text-align:center">
                    <th style="padding:10px">Business Unit</th>
                    <th style="padding:10px">Team</th>
                    <th style="padding:10px">Sub Team</th>
                    <th style="padding:10px">Team Size</th>
                    <th style="padding:10px">Incomplete PAR Count</th>
                </tr>
            </thead>
            <tbody>${from var {parBusinessUnit, parDepartment, parTeam, parTeamCount,
                parLeadCompletedCount} in pendingTeamSummaries
        select xml `
                <tr style="background-color:#F8F9FA;">
                    <td style="padding:10px">${parBusinessUnit}</td>
                    <td style="padding:10px">${parDepartment}</td>
                    <td style="padding:10px">${parTeam ?: ""}</td>
                    <td style="text-align: center">${parTeamCount}</td>
                    <td style="text-align: center">${parTeamCount - parLeadCompletedCount}</td>
                </tr>`}
            </tbody>
        </table>
    `).toString();
}

# Get the reviewees details as a list of links.
#
# + basicEmployeeInfo - BasicEmployeeInfo array which contains the employee details.
# + parBaseUrl - The base URL of the PAR application.
# + return - The reviewees details as a list of links.
isolated function getRevieweesDetails(types:BasicEmployeeInfo[] basicEmployeeInfo, string parBaseUrl)
        returns string|error =>
    (xml `<ol>${from var {employeeName} in basicEmployeeInfo
    select xml `
        <li><a href="${parBaseUrl + "/?tab=provideThreeSixtyReviews"}">${employeeName}</a></li>`}
    </ol>`).toString();

# Get the reviewee details as a link.
#
# + basicEmployeeInfo - BasicEmployeeInfo object which contains the employee details.
# + return - The reviewee details as a link.
isolated function getRevieweeDetails(types:BasicEmployeeInfo basicEmployeeInfo)
        returns string|error =>
    (xml `${basicEmployeeInfo.employeeName}`).toString();

# Get the redirect URL for a given reviewee.
#
# + basicEmployeeInfo - BasicEmployeeInfo object which contains the employee details.
# + parBaseUrl - The base URL of the PAR application.
# + return - The redirect URL.
isolated function getRedirectURL(types:BasicEmployeeInfo basicEmployeeInfo, string parBaseUrl)
        returns string|error =>
    (xml `<a target="_blank" style="color: rgb(255, 115, 0); text-decoration-line: none"
        href="${parBaseUrl + "/?tab=provideThreeSixtyReviews&employeeEmail=" +
            check url:encode(basicEmployeeInfo.workEmail, "UTF-8")}">here</a>`).toString();

isolated function getEmployeeParLink(string parBaseUrl, string employeeEmail, int teamId) returns string|error =>
    parBaseUrl + "/lead-portal?teamId=" + teamId.toString() + "&employeeEmail=" + check url:encode(employeeEmail, "UTF-8");

isolated function isAllowedToSend(EmailRecord emailRecord) returns boolean {
    if allowedEmailAddresses.length() == 0 {
        log:printWarn("Limited email addresses are not configured. Email not sent.");
        return false;
    }
    string[] filteredToEmails = emailRecord.to.filter(email => isAllowedEmailAddress(email));
    string[] filteredCcEmails = emailRecord.cc.filter(email => isAllowedEmailAddress(email));
    return filteredToEmails.length() == emailRecord.to.length() && filteredCcEmails.length() == emailRecord.cc.length();
}

isolated function isAllowedEmailAddress(string email) returns boolean =>
    allowedEmailAddresses.indexOf(email) != ();
