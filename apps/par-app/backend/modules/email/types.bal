// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

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

# Email Template Data.
public type EmailTemplateData record {|
    # Subject of the email
    string subject;
    # Title of the email
    string title;
    # Par cycle Name
    string parCycleName;
    # Deadline related to the email
    string deadline?;
    # Remaining days for the deadline
    int remainingDays?;
    # Data to generate the email content
    map<anydata> content = {};
|};

# Payload of the email service.
public type EmailRecord record {|
    # Application uuid
    string appUuid = "";
    # Recipient email(s) as string array
    string[] to;
    # CC'ed recipient email(s) as string array
    string[] cc = [];
    # Sender email
    string frm = "";
    # Email subject
    string subject;
    # Template id of the email body
    string templateId;
    # Content as key value pairs (keys are not case sensitive). Eg: {HEADER: "header", BODY: "This is the body"}
    map<string> contentKeyValPairs;
    # Attachments
    EmailAttachment[] attachments = [];
|};

# Email Attachment.
public type EmailAttachment record {|
    # Name of the attachment
    string contentName;
    # Content type of the attachment
    AttachmentType contentType;
    # Attachment content
    byte[] attachment;
|};

# Attachment type.
public enum AttachmentType {
    # Attachment type is a PDF
    PDF
}
