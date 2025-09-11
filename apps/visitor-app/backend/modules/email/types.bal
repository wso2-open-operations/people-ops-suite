//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

# [Configurable] Choreo OAuth2 application configuration.
type ChoreoApp record {|
    # OAuth2 token endpoint
    string tokenUrl;
    # OAuth2 client ID
    string clientId;
    # OAuth2 client secret
    string clientSecret;
|};

# [Configurable] Email alerting service configuration record.
#
# + uuid - Authorized app UUID provided by the Email service
# + from - Email sender
# + templateId - ID of the email template
public type EmailAlertConfig record {|
    string uuid;
    string 'from;
    string templateId;
|};

# Email notification details record.
public type EmailNotificationDetails record {|
    # Email subject
    string subject;
    # Email body
    string body;
|};

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
    # Recipient email(s) as string 
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

# Object to store floor and relevant rooms.
public type Floor record {|
    # Floor that can be accessed by visitor
    int floor;
    # Rooms that can be accessed by visitor
    string[] rooms;
|};
