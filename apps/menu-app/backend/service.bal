// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import menu_app.authentication;
import menu_app.database;
import menu_app.menu_sheet as menu;
import menu_app.dod_sheet as dod;
import menu_app.people;

import ballerina/cache;
import ballerina/http;
import ballerina/log;
import ballerina/sql;
import ballerina/time;

configurable time:TimeOfDay lunchFeedbackStartTime = {hour: 12, minute: 0, second: 0};
configurable time:TimeOfDay lunchFeedbackEndTime = {hour: 16, minute: 15, second: 0};

final cache:Cache cache = new ({
    defaultMaxAge: 300.0,
    evictionFactor: 0.2
});

@display {
    label: "Menu Application",
    id: "menu-application"
}
service http:InterceptableService / on new http:Listener(9090) {

    public function createInterceptors() returns authentication:JwtInterceptor {
        return new authentication:JwtInterceptor();
    }

    # Fetch logged-in user's details.
    #
    # + return - User information or InternalServerError
    resource function get user\-info(http:RequestContext ctx) returns http:InternalServerError|http:NotFound|UserInfo {
        authentication:CustomJwtPayload|error userInfo = ctx.getWithType(authentication:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(USER_NOT_FOUND_ERROR, userInfo);
            return <http:InternalServerError>{
                body: {
                    message: USER_NOT_FOUND_ERROR
                }
            };
        }

        // Check if the user-info is already cached
        if cache.hasKey(userInfo.email) {
            UserInfo|error cachedUserInfo = cache.get(userInfo.email).ensureType();
            if cachedUserInfo is UserInfo {
                return cachedUserInfo;
            }
        }

        people:Employee|error? employee = people:fetchEmployee(userInfo.email);
        if employee is error {
            string customError = string `Error occurred while fetching user information for user : ${userInfo.email}`;
            log:printError(customError, employee);
            return <http:InternalServerError>{
                body: customError
            };
        }

        if employee is () {
            log:printError(string `No employee information found for the user: ${userInfo.email}`);
            return <http:NotFound>{
                body: {
                    message: "No user found!"
                }
            };
        }

        // Fetch the user's privileges based on the roles.
        int[] privileges = [];
        if authentication:checkPermissions([authentication:authorizedRoles.EMPLOYEE_ROLE], userInfo.groups) {
            privileges.push(authentication:EMPLOYEE_PRIVILEGE);
        }
        if authentication:checkPermissions([authentication:authorizedRoles.ADMIN_ROLE], userInfo.groups) {
            privileges.push(authentication:ADMIN_PRIVILEGE);
        }

        UserInfo userInfoResponse = {...employee, privileges};

        error? cacheError = cache.put(userInfo.email, userInfoResponse);
        if cacheError is error {
            string customError = string `An error occurred while writing user info to the cache for user: ${userInfo.email}`;
            log:printError(customError, cacheError);
        }
        return userInfoResponse;
    }

    function init() {
        Menu|error menu = menu:getMenu();
        if menu is error {
            log:printError("Error retrieving menu data", menu);
        }

        log:printInfo("Menu Application service started.");
    }

    # Fetch meta info.
    #
    # + return - Meta info
    isolated resource function get meta\-info() returns MetaInfo => {
        lunchFeedbackStartTime,
        lunchFeedbackEndTime
    };

    # Retrieve list of menu items.
    #
    # + return - Menu items or error response
    isolated resource function get menu() returns http:InternalServerError|Menu {
        Menu|error menu = menu:getMenu();
        if menu is error {
            log:printError("Error retrieving menu data", menu);
            return <http:InternalServerError>{
                body: {message: "Error retrieving menu data"}
            };
        }
        return menu;
    }

    # Add feedback to a sheet.
    #
    # + return - Successful feedback or en error
    isolated resource function post feedback(Feedback feedback)
        returns http:InternalServerError|http:BadRequest|http:Created {

        Menu|error menu = menu:getMenu();
        if menu is error {
            string customErr = "Error retrieving menu data when getting vendor for the feedback";
            log:printError(customErr, menu);
            return <http:InternalServerError>{
                body: {message: customErr}
            };
        }

        // Checks if current time is within the given time period to add feedbacks
        boolean|error isFeedbackPeriod = isWithinTimeRange(menu.date, lunchFeedbackStartTime, lunchFeedbackEndTime);
        if isFeedbackPeriod is error {
            string customErr = "Error occurred while checking the feedback period";
            log:printError(customErr, isFeedbackPeriod);
            return <http:InternalServerError>{
                body: {message: customErr}
            };
        }

        if !isFeedbackPeriod {
            string errorMessage = string `Lunch feedback can only be submitted on ${menu.date} between ${
                lunchFeedbackStartTime.hour.toString().padStart(2, "0")}:${
                lunchFeedbackStartTime.minute.toString().padStart(2, "0")} and ${
                lunchFeedbackEndTime.hour.toString().padStart(2, "0")}:${
                lunchFeedbackEndTime.minute.toString().padStart(2, "0")}`;
            log:printWarn(errorMessage);
            return <http:BadRequest>{
                body: {
                    message: errorMessage
                }
            };
        }

        int|error feedbackId = menu:addFeedback(feedback, menu.lunch.title);
        if feedbackId is error {
            string customErr = "Error occurred while inserting the lunch feedback";
            log:printError(customErr, feedbackId);
            return <http:InternalServerError>{
                body: {message: customErr}
            };
        }

        return http:CREATED;
    }

    # Retrieve dinner requests for employee.
    #
    # + return - Dinner request for employee or error response
    resource function get dinner(http:RequestContext ctx) 
        returns http:BadRequest|http:Ok|http:InternalServerError|DinnerRequest {

        string|http:BadRequest userEmail = authentication:getUserEmailFromRequestContext(ctx);
        if userEmail is http:BadRequest {
            return userEmail;
        }

        DinnerRequest|error? dinnerRequest = database:getDinnerRequestByEmail(userEmail);
        if dinnerRequest is () {
            return <http:Ok>{
                body: {message: DINNER_REQUEST_NOT_AVAILABLE}
            };
        }

        if dinnerRequest is error {
            log:printError(DINNER_REQUEST_RETRIEVAL_ERROR, dinnerRequest, dinnerRequest.stackTrace());
            return <http:InternalServerError>{
                body: {message: DINNER_REQUEST_RETRIEVAL_ERROR}
            };
        }
        return dinnerRequest;
    }

    # Insert dinner requests.
    #
    # + payload - Dinner request data (email, date, meal option)
    # + return - Dinner request success response or error response
    resource function post dinner(http:RequestContext ctx, @http:Payload DinnerRequest payload) 
        returns http:BadRequest|http:InternalServerError|http:Created {

        string|http:BadRequest userEmail = authentication:getUserEmailFromRequestContext(ctx);
        if userEmail is http:BadRequest {
            return userEmail;
        }

        DinnerRequest|error? dinnerRequestResult = database:getDinnerRequestByEmail(userEmail);
        if dinnerRequestResult is error {
            log:printError(DINNER_REQUEST_RETRIEVAL_ERROR, dinnerRequestResult, dinnerRequestResult.stackTrace());
            return <http:InternalServerError>{
                body: {message: DINNER_REQUEST_RETRIEVAL_ERROR}
            };
        }

        if dinnerRequestResult is DinnerRequest {
            return <http:InternalServerError>{
                body: {message: DINNER_REQUEST_ALREADY_EXISTS}
            };
        }

        sql:ExecutionResult|error result = database:insertDinnerRequest(payload, userEmail);

        if result is error {
            log:printError(DINNER_REQUEST_ERROR, result, result.stackTrace());
            return <http:InternalServerError>{
                body: {message: DINNER_REQUEST_ERROR}
            };
        }

        error? sheetResult = dod:insertDinnerRequest(payload, userEmail);

        if sheetResult is error {
            log:printError(DINNER_REQUEST_SHEET_ERROR, sheetResult, sheetResult.stackTrace());
            return <http:InternalServerError>{
                body: {message: DINNER_REQUEST_ERROR}
            };
        }

        return <http:Created>{
            body: {message: DINNER_REQUEST_SUCCESS}
        };
    }

    # Cancel dinner requests.
    #
    # + return - Dinner request success response or error response
    resource function delete dinner(http:RequestContext ctx) 
        returns http:BadRequest|http:InternalServerError|http:Created {

        string|http:BadRequest userEmail = authentication:getUserEmailFromRequestContext(ctx);
        if userEmail is http:BadRequest {
            return userEmail;
        }

        sql:ExecutionResult|error result = database:cancelDinnerRequest(userEmail);
        if result is error {
            log:printError(DINNER_REQUEST_CANCELLED_ERROR, result, result.stackTrace());
            return <http:InternalServerError>{
                body: {message: DINNER_REQUEST_CANCELLED_ERROR}
            };
        }

        error? sheetResult = dod:cancelDinnerRequest(userEmail);

        if sheetResult is error {
            log:printError(DINNER_REQUEST_CANCELLED_ERROR, sheetResult, sheetResult.stackTrace());
            return <http:InternalServerError>{
                body: {message: DINNER_REQUEST_CANCELLED_ERROR}
            };
        }

        return <http:Created>{
            body: {message: DINNER_REQUEST_CANCELLED}
        };
    }

}
