import leaver_sweep.database;

import ballerina/http;
import ballerina/log;
import ballerina/time;

# Send a summary email listing employees auto-transitioned from Marked leaver to Left.
#
# + transitions - Employees that were transitioned during this sweep (must be non-empty)
# + return - Error if the email notification fails to send
public isolated function notifyLeaverAutoTransition(database:LeaverTransition[] transitions) returns error? {
    string employeeListHtml = string:'join("",
    ...from database:LeaverTransition t in transitions
       select string `<li>${htmlEscape(t.firstName)} ${htmlEscape(t.lastName)} (${htmlEscape(t.employeeId)})
            &mdash; ${htmlEscape(t.workEmail)} &mdash; final day: ${htmlEscape(t.finalDayOfEmployment)}</li>`);

    map<string> keyValues = {
        APP_NAME: appName,
        RUN_DATE: time:utcToString(time:utcNow()).substring(0, 10),
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
        'from: emailServiceConfig.'from,
        subject: string `Employee Offboarding Alert: ${transitions.length()} employee(s) transitioned to Left`,
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
        log:printError(customError);
        return error(customError);
    }
    log:printInfo(string `Leaver auto-transition summary email sent successfully to ${emailPayload.to.toString()}`);
}
