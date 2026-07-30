# OAuth2 application configuration.
public type Oauth2Config record {|
    # The URL of the token endpoint
    string tokenUrl;
    # The client ID of the application
    string clientId;
    # The client secret of the application
    string clientSecret;
    # OAuth2 scopes
    string[] scopes = [];
|};

# Email Service Configuration.
public type EmailServiceConfig record {|
    # Email Service Endpoint
    string emailServiceEndpoint;
    # Auth Configurations
    Oauth2Config oauthConfig;
    # Sender email
    string 'from;
|};

# Payload of the email alerting service.
public type EmailPayload record {|
    # Recipient email(s) as string array
    string[] to;
    # Sender email
    string 'from;
    # Email subject
    string subject;
    # Email template
    string template;
|};
