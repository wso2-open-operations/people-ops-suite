// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import par_app.types;
import par_app.authorization;
import ballerina/http;
import ballerina/log;

# Read the invoker details from the request context and returns it.
#
# + ctx - The request context.
# + return - The invoker details or an error if the invoker details are not found.
public isolated function getInvokerDetails(http:RequestContext ctx) returns types:InvokerDetails|error {
    authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);

    if userInfo is error {
        return error("Invoker details not found: User info header missing.");
    }

    boolean hasAdminPrivilege = authorization:checkPermissions(
        [authorization:authorizedRoles.headPeopleOperationsRole], 
        userInfo.groups
    );

    types:InvokerDetails invokerDetails = {
        email: userInfo.email,
        isAdmin: hasAdminPrivilege, 
        roles: userInfo.groups.cloneReadOnly()
    };

    return invokerDetails;
}

# Check if the given string is updated.
#
# + originalValue - The original value.
# + newValue - The new value.
# + return - True if the string is updated, false otherwise.
public isolated function isUpdatedString(string? originalValue, string? newValue) returns boolean =>
    newValue != () && newValue.trim() != "" && newValue != originalValue;

# Check if the given string array is updated.
#
# + originalValue - The original value.
# + newValue - The new value.
# + return - True if the string array is updated, false otherwise.
public isolated function isUpdatedStringArray(string[]? originalValue, string[]? newValue) returns boolean =>
    newValue != () && newValue != originalValue;

# Check if the given number of seconds is greater than a day with a threshold.
#
# + seconds - The number of seconds.
# + return - True if the given number of seconds is one day before, false otherwise.
public isolated function isOneDayBefore(int seconds) returns boolean {
    int diffSeconds = seconds - types:SECONDS_FOR_ONE_DAY;
    return diffSeconds >= 0 && diffSeconds < types:SECONDS_THRESHOLD;
}

# Check if the given number of seconds is greater than three days with a threshold.
#
# + seconds - The number of seconds.
# + return - True if the given number of seconds is three days before, false otherwise.
public isolated function isThreeDaysBefore(int seconds) returns boolean {
    int diffSeconds = seconds - types:SECONDS_FOR_THREE_DAYS;
    return diffSeconds >= 0 && diffSeconds < types:SECONDS_THRESHOLD;
}

# Check if the given number of seconds is greater than seven days with a threshold.
#
# + seconds - The number of seconds.
# + return - True if the given number of seconds is seven days before, false otherwise.
public isolated function isSevenDaysBefore(int seconds) returns boolean {
    int diffSeconds = seconds - types:SECONDS_FOR_SEVEN_DAYS;
    return diffSeconds >= 0 && diffSeconds < types:SECONDS_THRESHOLD;
}

# Check if the given string is nil or empty.
#
# + value - The string value.
# + return - True if the string is nil or empty, false otherwise.
public isolated function isNilOrEmpty(string? value) returns boolean =>
    value is () || value.trim() == "";

# Create an internal server error response with the given message and error.
#
# + err - The error
# + message - The error message
# + return - The internal server error response
public isolated function createInternalServerErrorResponse(error err, string message) returns http:InternalServerError {
    log:printError(message, err);
    return <http:InternalServerError>{
        body: {
            message
        }
    };
}

# Create a service unavailable response with the given error.
#
# + message - The error message
# + return - The service unavailable response
public isolated function createServiceUnavailableResponse(string message) returns http:ServiceUnavailable {
    log:printError(message);
    return <http:ServiceUnavailable>{
        body: {
            message
        }
    };
}

# Create a bad request response with the given error.
#
# + err - The error
# + message - The error message
# + return - The bad request response
public isolated function createBadRequestResponse(error err, string message = types:DEFAULT_ERR_HTTP_BAD_REQUEST)
        returns http:BadRequest {
    log:printWarn(message, err);
    return <http:BadRequest>{
        body: {
            message: message
        }
    };
}

# Create a conflict response with the given error.
#
# + err - The error
# + message - The error message
# + return - The conflict response
public isolated function createConflictResponse(error err, string message = types:DEFAULT_ERR_HTTP_CONFLICT)
        returns http:Conflict {
    log:printWarn(message, err);
    return <http:Conflict>{
        body: {
            message: err.message()
        }
    };
}

# Create a not found response with the given error.
#
# + err - The error
# + message - The error message
# + return - The not found response
public isolated function createNotFoundResponse(error err, string message = types:DEFAULT_ERR_HTTP_NOT_FOUND)
        returns http:NotFound {
    log:printWarn(message, err);
    return <http:NotFound>{
        body: {
            message
        }
    };
}

# Create a forbidden response with the given message.
#
# + message - The message
# + return - The forbidden response
public isolated function createForbiddenResponse(string message) returns http:Forbidden {
    log:printWarn(message);
    return <http:Forbidden>{
        body: {
            message
        }
    };
}

# Create a unprocessable entity response with the given error.
#
# + err - The error
# + message - The error message
# + return - The unprocessable entity response
public isolated function createUnprocessableEntityResponse(error err,
        string message = types:DEFAULT_ERR_HTTP_UNPROCESSABLE_ENTITY) returns http:UnprocessableEntity {
    log:printWarn(message, err);
    return <http:UnprocessableEntity>{
        body: {
            message: err.message()
        }
    };
}
