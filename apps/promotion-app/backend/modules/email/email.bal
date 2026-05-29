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

# Email Service Client
final http:Client emailServiceEndPoint = check initializeEmailServiceClient();

configurable readonly & TestUserEmailConfig testUserEmailConfig = ?;
configurable readonly & EmailConfig emailConfig = ?;
configurable readonly & EmailTemplateConfig emailTemplateConfig = ?;

# Recommendation email alert function
#
# + payload - Email configs
# + return - Error or Null
public isolated function recommendationAlert(RecommendationAlertPayload payload) returns error? {

    int currentYear = time:utcToCivil(time:utcNow())["year"];

    map<string> finalContentKeyValPairs = {
        APP_NAME: APP_NAME,
        CURRENT_YEAR: currentYear.toString()
    };

    string subject;
    if payload.templateId == hrisPromotionRecommendationRequest {
        subject = RECOMMENDATION_REQUEST_SUBJECT + payload.senderName;
        finalContentKeyValPairs["EMPLOYEE_NAME"] = payload.senderName;
        finalContentKeyValPairs["LEAD_NAME"] = payload.receiverName;
        finalContentKeyValPairs["CLOSING_DATE"] = payload.closingDate;
        finalContentKeyValPairs["RECOMMENDATION_LINK"] = emailConfig.recommendationEmailLink;
    } else {
        subject = RECOMMENDATION_SUBMISSION_SUBJECT + payload.senderName;
        finalContentKeyValPairs["LEAD_NAME"] = payload.senderName;
        finalContentKeyValPairs["EMPLOYEE_NAME"] = payload.receiverName;
    }

    EmailFinalRecord finalPayload = {
        appUuid: APP_UUID,
        to: [testUserEmailConfig.enable == 1 ? testUserEmailConfig.email : payload.receiverEmail],
        cc: testUserEmailConfig.enable == 1 ? [] : [payload.senderEmail],
        frm: ALERT_FROM,
        subject: subject,
        templateId: payload.templateId,
        contentKeyValPairs: finalContentKeyValPairs
    };

    _ = check sendEmail(finalPayload);
}

# Send email notification
#
# + payload - Email configs
# + return - Error or Null
public isolated function emailNotification(emailNotificationPayload payload) returns error? {

    int currentYear = time:utcToCivil(time:utcNow())["year"];

    map<string> finalContentKeyValPairs = {
        APP_NAME: APP_NAME,
        CURRENT_YEAR: currentYear.toString()
    };

    string subject;
    if payload.templateId == hrisPromotionApproved {
        string effectiveDate = payload.effectiveDate ?: "";
        subject = EMAIL_NOTIFICATION_SUBJECT + payload.promotionCycle + " - " + payload.employeeFirstName + " " +
            payload.employeeLastName + ", " + payload.employeeId;
        finalContentKeyValPairs["EMPLOYEE_NAME"] = payload.employeeFirstName;
        finalContentKeyValPairs["JOB_BAND"] = payload.jobBand.toString();
        finalContentKeyValPairs["JOB_ROLE"] = payload.jobRole;
        finalContentKeyValPairs["EFFECTIVE_DATE"] = effectiveDate;
        finalContentKeyValPairs["REPLY_TO"] = emailConfig.notificationEmailReplyTo;
        finalContentKeyValPairs["SENDER"] = emailConfig.notificationEmailSender;

    } else if payload.templateId == hrisPromotionRejected {
        subject = EMAIL_NOTIFICATION_SUBJECT + payload.promotionCycle + " - " + payload.employeeFirstName + " " +
            payload.employeeLastName + ", " + payload.employeeId;
        finalContentKeyValPairs["EMPLOYEE_NAME"] = payload.employeeFirstName;
        finalContentKeyValPairs["PROMOTION_CYCLE"] = payload.promotionCycle;
        finalContentKeyValPairs["REASON"] = payload.reasonForRejection ?: "";
        finalContentKeyValPairs["SENDER"] = emailConfig.notificationEmailSender;

    } else {
        return error("Invalid email template");
    }

    EmailFinalRecord finalPayload = {
        appUuid: APP_UUID,
        to: [testUserEmailConfig.enable == 1 ? testUserEmailConfig.email : payload.employeeEmail],
        cc: [],
        frm: ALERT_FROM,
        subject: subject,
        templateId: payload.templateId,
        contentKeyValPairs: finalContentKeyValPairs
    };

    _ = check sendEmail(finalPayload);
}

# Email sending function
#
# + payload - Email Function Payload
# + return - Error or Null
public isolated function sendEmail(EmailFinalRecord payload) returns error? {

    // For global forwarding 
    if testUserEmailConfig.enable == 1 {
        payload.subject = payload.subject + " - To : " + payload.to.toString();
        payload.to = [testUserEmailConfig.email];
        payload.cc = [];
        payload.frm = ALERT_FROM;
    }

    json _ = check emailServiceEndPoint->post("/send-smtp-email", payload.toJson());
}

# Generate Email Content
#
# + generateContentPayload - Generate content payload
# + return - Error or Null
public isolated function generateEmailContent(GenerateContentPayload generateContentPayload ) returns error|string {

    map<string> replacementValues = {};
    replacementValues["RECIPIENT_NAME"] = generateContentPayload.recipientName;
    replacementValues["DEADLINE"] = generateContentPayload.deadline;
    replacementValues["REMAINING_DAYS"] = generateContentPayload.remainingDays;
    replacementValues["PROMOTION_APP_LINK"] = emailTemplateConfig.promotionAppLink;
    replacementValues["USER_GUIDE_LINK"] = emailTemplateConfig.userGuideLink;

    return check replacePlaceHolders( reminderTemplate, replacementValues);
}

isolated function replacePlaceHolders(string content, map<string> emailParameters)
        returns string|error {
    string modifiedContent = content;
    foreach var [key, value] in emailParameters.entries() {
        modifiedContent = re `<!-- \[${key.toUpperAscii()}\] -->`.replaceAll(modifiedContent, value);
    }
    return modifiedContent;
}

# Email sending function
#
# + to - The recipient email
# + promotionCycleName - Name of the active promotion cycle
# + emailBody - Email body template
# + return - Error or Null
public isolated function sendReminderEmail(string[] to, string promotionCycleName, string emailBody) returns error? {
    _ = check sendEmail({
                                    appUuid: APP_UUID,
                                    to: to ,
                                    frm: ALERT_FROM,
                                    subject: RECOMMENDATION_SUBMISSION_SUBJECT,
                                    templateId: "genericTemplate",
                                    contentKeyValPairs: {
                                        TITLE: EMAIL_REMINDER_TITLE,
                                        SUB_TITLE: EMAIL_REMINDER_SUB_TITLE + promotionCycleName,
                                        EMAIL_BODY: emailBody,
                                        CLOSING_AND_SIGNATURE: CLOSING_AND_SIGNATURE
                                    }
                                });
}