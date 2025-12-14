// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import menu_app.authentication;
import menu_app.people;
import menu_app.menu_sheet as menu;
import menu_app.types;

import ballerina/cache;
import ballerina/http;
import ballerina/log;
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
    resource function get user\-info(http:RequestContext ctx) returns types:UserInfo|http:InternalServerError|http:NotFound {
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
            types:UserInfo|error cachedUserInfo = cache.get(userInfo.email).ensureType();
            if cachedUserInfo is types:UserInfo {
                return cachedUserInfo;
            }
        }

        // people:Employee|error? employee = people:fetchEmployee(userInfo.email);
        // if employee is error {
        //     string customError = string `Error occurred while fetching user information for user : ${userInfo.email}`;
        //     log:printError(customError, employee);
        //     return <http:InternalServerError>{
        //         body: customError
        //     };
        // }

        // if employee is () {
        //     log:printError(string `No employee information found for the user: ${userInfo.email}`);
        //     return <http:NotFound>{
        //         body: {
        //             message: "No user found!"
        //         }
        //     };
        // }

        // // Fetch the user's privileges based on the roles.
        // int[] privileges = [];
        // if authentication:checkPermissions([authentication:authorizedRoles.EMPLOYEE_ROLE], userInfo.groups) {
        //     privileges.push(authentication:EMPLOYEE_PRIVILEGE);
        // }
        // if authentication:checkPermissions([authentication:authorizedRoles.ADMIN_ROLE], userInfo.groups) {
        //     privileges.push(authentication:ADMIN_PRIVILEGE);
        // }
        
        people:Employee employee = {
            firstName: "Dineth",
            lastName: "Silva",
            employeeId: "E001",
            employeeThumbnail: (),
            workEmail: "dineths@wso2.com",
            jobRole: "Intern"
        };

        int[] privileges = [];

        privileges.push(authentication:EMPLOYEE_PRIVILEGE);
        privileges.push(authentication:ADMIN_PRIVILEGE);

        types:UserInfo userInfoResponse = {...employee, privileges};

        error? cacheError = cache.put(userInfo.email, userInfoResponse);
        if cacheError is error {
            string customError = string `An error occurred while writing user info to the cache for user: ${userInfo.email}`;
            log:printError(customError, cacheError);
        }
        return userInfoResponse;
    }

    function init() {
        types:Menu|error menu = menu:getMenu();
        if menu is error {
            log:printError("Error retrieving menu data", menu);
        }

        log:printInfo("Menu Application service started.");
    }

    # Fetch meta info.
    #
    # + return - Meta info
    isolated resource function get meta\-info() returns types:MetaInfo => {
        lunchFeedbackStartTime,
        lunchFeedbackEndTime
    };

    # Retrieve list of menu items.
    #
    # + return - Menu items or error response
    isolated resource function get menu() returns types:Menu|types:AppServerErrorResponse {
        types:Menu|error menu = menu:getMenu();
        if menu is error {
            log:printError("Error retrieving menu data", menu);
            return <types:AppServerErrorResponse>{
                body: {message: "Error retrieving menu data"}
            };
        }
        return menu;
    }

    # Add feedback to a sheet.
    #
    # + return - Successful feedback or en error
    isolated resource function post feedback(types:Feedback feedback)
        returns http:Created|http:InternalServerError|http:BadRequest {

        types:Menu|error menu = menu:getMenu();
        if menu is error {
            string customErr = "Error retrieving menu data when getting vendor for the feedback";
            log:printError(customErr, menu);
            return <types:AppServerErrorResponse>{
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
                lunchFeedbackStartTime.hour.toString().padStart(2,"0")}:${
                lunchFeedbackStartTime.minute.toString().padStart(2,"0")} and ${
                lunchFeedbackEndTime.hour.toString().padStart(2,"0")}:${
                lunchFeedbackEndTime.minute.toString().padStart(2,"0")}`;
            log:printWarn(errorMessage);
            return <http:BadRequest>{
                body: {
                    message: errorMessage
                }
            };
        }

        int|error feedbackId = menu:addFeedback(feedback, menu.lunch.title);
        if feedbackId is error {
            string customeErr = "Error occurred while inserting the lunch feedback";
            log:printError(customeErr, feedbackId);
            return <http:InternalServerError>{
                body: {message: customeErr}
            };
        }

        return http:CREATED;
    }
}
