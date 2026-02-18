// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
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
import dashboard_app_backend.authorization;
import dashboard_app_backend.database;
import dashboard_app_backend.entity;

import ballerina/cache;
import ballerina/http;
import ballerina/log;

final cache:Cache cache = new ({
    capacity: 2000,
    defaultMaxAge: 1800.0,
    cleanupInterval: 900.0
});

@display {
    label: "Dashboard Application",
    id: "domain/dashboard-application"
}

service class ErrorInterceptor {
    *http:ResponseErrorInterceptor;

    remote function interceptResponseError(error err, http:RequestContext ctx) returns http:BadRequest|error {

        // Handle data-binding errors.
        if err is http:PayloadBindingError {
            string customError = string `Payload binding failed!`;
            log:printError(customError, err);
            return {
                body: {
                    message: customError
                }
            };
        }
        return err;
    }
}

service http:InterceptableService / on new http:Listener(9090) {

    # Request interceptor.
    #
    # + return - authorization:JwtInterceptor, ErrorInterceptor
    public function createInterceptors() returns http:Interceptor[] =>
        [new authorization:JwtInterceptor(), new ErrorInterceptor()];

    # Fetch user information of the logged in users.
    #
    # + ctx - Request object
    # + return - User info object|Error
    resource function get user\-info(http:RequestContext ctx) returns UserInfoResponse|http:InternalServerError {

        // User information header.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }

            };
        }

        // Check cache for logged in user.
        if cache.hasKey(userInfo.email) {
            UserInfoResponse|error cachedUserInfo = cache.get(userInfo.email).ensureType();
            if cachedUserInfo is UserInfoResponse {
                return cachedUserInfo;
            }
        }

        // Fetch the user information from the entity service.
        entity:Employee|error loggedInUser = entity:fetchEmployeesBasicInfo(userInfo.email);
        if loggedInUser is error {
            string customError = string `Error occurred while retrieving user data: ${userInfo.email}!`;
            log:printError(customError, loggedInUser);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        // Fetch the user's privileges based on the roles.
        int[] privileges = [];
        if authorization:checkPermissions([authorization:authorizedRoles.employeeRole], userInfo.groups) {
            privileges.push(authorization:EMPLOYEE_ROLE_PRIVILEGE);
        }
        if authorization:checkPermissions([authorization:authorizedRoles.headPeopleOperationsRole], userInfo.groups) {
            privileges.push(authorization:HEAD_PEOPLE_OPERATIONS_PRIVILEGE);
        }

        UserInfoResponse userInfoResponse = {...loggedInUser, privileges};

        error? cacheError = cache.put(userInfo.email, userInfoResponse);
        if cacheError is error {
            log:printError("An error occurred while writing user info to the cache", cacheError);
        }
        return userInfoResponse;
    }

    # Create a new breakfast or lunch waste record.
    #
    # + payload - Meal record payload
    # + return - Created record|Conflict|Error
    resource function post meal\-records(http:RequestContext ctx, database:AddMealRecordPayload payload)
        returns http:Created|http:Conflict|http:Forbidden|http:BadRequest|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:BadRequest>{body: {message: "User information header not found!"}};
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.headPeopleOperationsRole], userInfo.groups) {
            return <http:Forbidden>{body: {message: "Insufficient privileges!"}};
        }

        int|database:DuplicateMealRecordError|error mealRecordId = database:addMealRecord(payload, userInfo.email);
        if mealRecordId is database:DuplicateMealRecordError {
            return <http:Conflict>{body: {message: mealRecordId.message()}};
        }
        if mealRecordId is error {
            string customError = "Error occurred while creating meal record!";
            log:printError(customError, mealRecordId);
            return <http:InternalServerError>{body: {message: customError}};
        }

        database:MealRecord|error? created = database:fetchMealRecord(mealRecordId);
        if created is error {
            string customError = "Error occurred while retrieving created meal record!";
            log:printError(customError, created);
            return <http:InternalServerError>{body: {message: customError}};
        }
        if created is () {
            string customError = "Created meal record is no longer available to access!";
            log:printError(customError);
            return <http:InternalServerError>{body: {message: customError}};
        }

        return <http:Created>{body: created};
    }

    # Get breakfast + lunch data for one specific day.
    #
    # + date - Date (YYYY-MM-DD)
    # + return - DailyMealRecords or error
    resource function get meal\-records/daily(http:RequestContext ctx, string date)
        returns database:DailyMealRecords|http:Forbidden|http:BadRequest|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:BadRequest>{body: {message: "User information header not found!"}};
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.employeeRole], userInfo.groups) &&
                !authorization:checkPermissions([authorization:authorizedRoles.headPeopleOperationsRole], userInfo.groups) {
            return <http:Forbidden>{body: {message: "Insufficient privileges!"}};
        }

        if !database:DATE_REGEX.isFullMatch(date) {
            return <http:BadRequest>{body: {message: "Invalid date string. Expected YYYY-MM-DD."}};
        }

        database:DailyMealRecords|error daily = database:fetchDailyMealRecords(date);
        if daily is error {
            string customError = "Error occurred while fetching daily meal records!";
            log:printError(customError, daily);
            return <http:InternalServerError>{body: {message: customError}};
        }
        return daily;
    }

    # List/filter meal records (paginated).
    #
    # + start_date - Start date (YYYY-MM-DD)
    # + end_date - End date (YYYY-MM-DD)
    # + meal_type - Meal type (BREAKFAST|LUNCH)
    # + page - Page number (1-based)
    # + pageSize - Page size
    # + return - Paginated list or error
    resource function get meal\-records(http:RequestContext ctx, string? start_date, string? end_date, string? meal_type,
            int page = 1, int pageSize = database:DEFAULT_PAGE_SIZE)
        returns database:PaginatedMealRecords|http:Forbidden|http:BadRequest|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:BadRequest>{body: {message: "User information header not found!"}};
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.employeeRole], userInfo.groups) &&
                !authorization:checkPermissions([authorization:authorizedRoles.headPeopleOperationsRole], userInfo.groups) {
            return <http:Forbidden>{body: {message: "Insufficient privileges!"}};
        }

        if page < 1 {
            return <http:BadRequest>{body: {message: "page must be >= 1"}};
        }
        if pageSize < 1 || pageSize > database:MAX_PAGE_SIZE {
            return <http:BadRequest>{body: {message: string `pageSize must be between 1 and ${database:MAX_PAGE_SIZE}`}};
        }

        // Validate meal_type manually since we accept string?
        if meal_type is string && !(meal_type == "BREAKFAST" || meal_type == "LUNCH") {
            return <http:BadRequest>{body: {message: "meal_type must be BREAKFAST or LUNCH"}};
        }

        int offset = (page - 1) * pageSize;
        database:MealRecordFilters filters = {start_date, end_date, meal_type, 'limit: pageSize, offset};
        database:PaginatedMealRecords|error pageResult = database:fetchMealRecords(filters, page, pageSize);
        if pageResult is error {
            string customError = "Error occurred while listing meal records!";
            log:printError(customError, pageResult);
            return <http:InternalServerError>{body: {message: customError}};
        }
        return pageResult;
    }

    # Update existing meal record.
    #
    # + id - Meal record id
    # + payload - Update payload
    # + return - Updated record or error
    resource function put meal\-records/[int id](http:RequestContext ctx, database:UpdateMealRecordPayload payload)
        returns database:MealRecord|http:NotFound|http:Forbidden|http:BadRequest|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:BadRequest>{body: {message: "User information header not found!"}};
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.headPeopleOperationsRole], userInfo.groups) {
            return <http:Forbidden>{body: {message: "Insufficient privileges!"}};
        }

        if payload.total_waste_kg is () && payload.plate_count is () {
            return <http:BadRequest>{body: {message: "At least one of total_waste_kg or plate_count must be provided."}};
        }

        database:MealRecord|database:MealRecordNotFoundError|error updated =
            database:updateMealRecord(id, payload, userInfo.email);
        if updated is database:MealRecordNotFoundError {
            return <http:NotFound>{body: {message: updated.message()}};
        }
        if updated is error {
            string customError = "Error occurred while updating meal record!";
            log:printError(customError, updated);
            return <http:InternalServerError>{body: {message: customError}};
        }
        return updated;
    }

    # Delete a meal record.
    #
    # + id - Meal record id
    # + return - NoContent or error
    resource function delete meal\-records/[int id](http:RequestContext ctx)
        returns http:NoContent|http:NotFound|http:Forbidden|http:BadRequest|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:BadRequest>{body: {message: "User information header not found!"}};
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.headPeopleOperationsRole], userInfo.groups) {
            return <http:Forbidden>{body: {message: "Insufficient privileges!"}};
        }

        database:MealRecordNotFoundError|error? deleted = database:deleteMealRecord(id);
        if deleted is database:MealRecordNotFoundError {
            return <http:NotFound>{body: {message: deleted.message()}};
        }
        if deleted is error {
            string customError = "Error occurred while deleting meal record!";
            log:printError(customError, deleted);
            return <http:InternalServerError>{body: {message: customError}};
        }

        return <http:NoContent>{};
    }
}
