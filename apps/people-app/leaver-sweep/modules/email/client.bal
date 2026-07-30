import ballerina/http;

public configurable EmailServiceConfig emailServiceConfig = ?;
public configurable string appName = ?;
public configurable string[] leaverNotificationRecipients = ?;

final http:Client emailClient = check new (emailServiceConfig.emailServiceEndpoint, {
    auth: {
        ...emailServiceConfig.oauthConfig
    },
    timeout: 15.0,
    httpVersion: http:HTTP_1_1,
    http1Settings: {
        keepAlive: http:KEEPALIVE_NEVER
    },
    retryConfig: {
        count: 3,
        interval: 3.0,
        statusCodes: [
            http:STATUS_BAD_GATEWAY,
            http:STATUS_SERVICE_UNAVAILABLE,
            http:STATUS_GATEWAY_TIMEOUT
        ]
    }
});
