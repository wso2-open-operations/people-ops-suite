// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

# Document attachment record.
public type Document record {|
    # Name of the document
    string contentName;
    # Document type 
    string contentType;
    # Document content byte array
    byte[] attachment;
|};

# Payload of the email alerting service.
public type EmailPayload record {|
    # Application uuid
    string appUuid = "";
    # Recipient email(s) as string array
    string[] to;
    # Sender email
    string 'from;
    # Email subject
    string subject;
    # Email template
    string template;
    # Attachments
    Document[] attachments = [];
    # CC'ed recipient email(s) as string array
    string[] cc?;
    # BCC'd recipient email(s)
    string[] bcc?;
|};

# Email Service Configuration.
type EmailServiceConfig record {|
    # Email Service Endpoint
    string emailServiceEndpoint;
    # Auth Configurations
    AuthConfig authConfig;
|};

# Auth configurations.
public type AuthConfig record {|
    # Token URL
    string tokenUrl;
    # Client ID
    string clientId;
    # Client Secret
    string clientSecret;
|};

# Email configurations for alerts and notifications.
type EmailConfig record {
    # Contact team name
    string contactTeam;
    # Contact team email address
    string contactTeamEmail;
    # Sender of the notification email
    string notificationFrom;
    # Reply to email addresses for the notification email 
    string[] notificationTo;
};
