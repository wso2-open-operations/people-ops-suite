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

# Email Service configuration.
type EmailServiceConfig record {
    # Email Service Endpoint
    string emailServiceEndpoint;
    # Token Endpoint
    string tokenEndpoint;
    # 
    # Client ID 
    string clientID;
    # Client Secret
    string clientSecret;
};

# Test the email configuration by routing all email to a single user.
type TestUserEmailConfig record {
    # Active test user 
    int enable = 0;
    # test user email
    string email = "";
};

# Email configurations for alerts and notifications
type EmailConfig record {
    # Link that on the recommendation email 
    string recommendationEmailLink;
    # Reply to email address for the notification email
    string notificationEmailReplyTo;
    # Sender of the notification email
    string notificationEmailSender;
};

# Email template configurations for reminder emails
type EmailTemplateConfig record {
    # Promotion application link 
    string promotionAppLink;
    # User guide link of the promotion application
    string userGuideLink;
};

# Email Module Payload.
public type EmailFinalRecord record {
    # Application ID of the email app
    string appUuid;
    # Receiver
    string[] to;
    # CC
    string[] cc?;
    # Sender
    string frm;
    # Email Subject
    string subject;
    # Email Template ID
    string templateId;
    # Variables and values for the email template
    map<string> contentKeyValPairs;
};

# Record for Recommendation Alert Email.
public type RecommendationAlertPayload record {
    # Receiver's Name  
    string receiverName;
    # Receiver's Email 
    string receiverEmail;
    # Sender's Name 
    string senderName;
    # Sender's Email 
    string senderEmail;
    # Application closing date
    string closingDate;
    # Email template ID
    PromotionRecommendationEmailTemplates templateId;
};

# Record for Email notification.
public type emailNotificationPayload record {
    # First name of the employee
    string employeeFirstName;
    # Last name of the employee
    string employeeLastName;
    # Email of the employee
    string employeeEmail;
    # Id of the employee
    string employeeId;
    # Promoted job band
    int? jobBand = ();
    # Job title of the employee
    string jobRole;
    # Effective date of the promotion
    string? effectiveDate = ();
    # Reason for the rejection 
    string? reasonForRejection = ();
    # Name of the promotion cycl
    string promotionCycle;
    # Email template ID
    EmailNotificationTemplates templateId;
};

# Record for generate email body content.
public type GenerateContentPayload record {
    # Deadline of the submission
    string deadline;
    # Recipient name
    string recipientName;
    # Remaining days for the deadline
    string remainingDays;
};

# Record representing template variables used when rendering email content.
public type EmailTemplateData record {
    # Deadline of the submission
    string deadline;
    # Recipient name
    string recipientName;
    # Remaining days for the deadline
    string remainingDays;
};
