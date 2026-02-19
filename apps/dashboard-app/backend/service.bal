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
import ballerina/time;

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

    remote function interceptResponseError(error err, http:RequestContext ctx)
            returns http:BadRequest|error {
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

    # Fetch user information of the logged-in user.
    #
    # + ctx - Request context
    # + return - User info object|InternalServerError
    resource function get user\-info(http:RequestContext ctx)
            returns UserInfoResponse|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(authorization:USER_INFO_HEADER_NOT_FOUND_ERROR, userInfo);
            return <http:InternalServerError>{
                body: {
                    message: authorization:USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        if cache.hasKey(userInfo.email) {
            UserInfoResponse|error cachedUserInfo = cache.get(userInfo.email).ensureType();
            if cachedUserInfo is UserInfoResponse {
                return cachedUserInfo;
            }
        }

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

        int[] privileges = [];
        if authorization:checkPermissions([authorization:authorizedRoles.EMPLOYEE_PRIVILEGE], userInfo.groups) {
            privileges.push(authorization:EMPLOYEE_PRIVILEGE);
        }
        if authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
            privileges.push(authorization:SECURITY_ADMIN_PRIVILEGE);
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
    # + ctx - Request context
    # + payload - Meal record payload
    # + return - Created record|Conflict|Forbidden|BadRequest|InternalServerError
    resource function post meal\-records(http:RequestContext ctx, database:AddMealRecordPayload payload)
            returns http:Created|http:Conflict|http:Forbidden|http:BadRequest|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(authorization:USER_INFO_HEADER_NOT_FOUND_ERROR, userInfo);
            return <http:BadRequest>{
                body: {
                    message: authorization:USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: authorization:INSUFFICIENT_PRIVILEGES_ERROR
                }
            };
        }

        int|database:DuplicateMealRecordError|error mealRecordId =
            database:addMealRecord(payload, userInfo.email);
        if mealRecordId is database:DuplicateMealRecordError {
            return <http:Conflict>{
                body: {
                    message: mealRecordId.message()
                }
            };
        }
        if mealRecordId is error {
            string customError = "Error occurred while creating meal record!";
            log:printError(customError, mealRecordId);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        database:MealRecord|error? created = database:fetchMealRecord(mealRecordId);
        if created is error {
            string customError = "Error occurred while retrieving created meal record!";
            log:printError(customError, created);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        if created is () {
            string customError = "Created meal record is no longer available to access!";
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return <http:Created>{body: created};
    }

    # Get breakfast + lunch data for one specific day.
    #
    # + ctx - Request context
    # + date - Date (YYYY-MM-DD)
    # + return - DailyMealRecords|Forbidden|BadRequest|InternalServerError
    resource function get meal\-records/daily(http:RequestContext ctx, string date)
            returns database:DailyMealRecords|http:Forbidden|http:BadRequest|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(authorization:USER_INFO_HEADER_NOT_FOUND_ERROR, userInfo);
            return <http:BadRequest>{
                body: {
                    message: authorization:USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.EMPLOYEE_PRIVILEGE], userInfo.groups) &&
                !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: authorization:INSUFFICIENT_PRIVILEGES_ERROR
                }
            };
        }

        if !database:DATE_REGEX.isFullMatch(date) {
            return <http:BadRequest>{
                body: {
                    message: "Invalid date string. Expected YYYY-MM-DD."
                }
            };
        }

        database:DailyMealRecords|error daily = database:fetchDailyMealRecords(date);
        if daily is error {
            string customError = "Error occurred while fetching daily meal records!";
            log:printError(customError, daily);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        return daily;
    }

    # List/filter meal records (paginated).
    #
    # + ctx - Request context
    # + start_date - Start date (YYYY-MM-DD)
    # + end_date - End date (YYYY-MM-DD)
    # + meal_type - Meal type (BREAKFAST|LUNCH)
    # + page - Page number (1-based)
    # + pageSize - Page size
    # + return - Paginated list|Forbidden|BadRequest|InternalServerError
    resource function get meal\-records(http:RequestContext ctx, string? start_date, string? end_date,
            string? meal_type, int page = 1, int pageSize = database:DEFAULT_PAGE_SIZE)
            returns database:PaginatedMealRecords|http:Forbidden|http:BadRequest|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(authorization:USER_INFO_HEADER_NOT_FOUND_ERROR, userInfo);
            return <http:BadRequest>{
                body: {
                    message: authorization:USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.EMPLOYEE_PRIVILEGE], userInfo.groups) &&
                !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: authorization:INSUFFICIENT_PRIVILEGES_ERROR
                }
            };
        }

        if page < 1 {
            return <http:BadRequest>{
                body: {
                    message: "page must be >= 1"
                }
            };
        }
        if pageSize < 1 || pageSize > database:MAX_PAGE_SIZE {
            return <http:BadRequest>{
                body: {
                    message: string `pageSize must be between 1 and ${database:MAX_PAGE_SIZE}`
                }
            };
        }

        if meal_type is string && !(meal_type == "BREAKFAST" || meal_type == "LUNCH") {
            return <http:BadRequest>{
                body: {
                    message: "meal_type must be BREAKFAST or LUNCH"
                }
            };
        }

        int offset = (page - 1) * pageSize;
        database:MealRecordFilters filters = {start_date, end_date, meal_type, 'limit: pageSize, offset};
        database:PaginatedMealRecords|error pageResult = database:fetchMealRecords(filters, page, pageSize);
        if pageResult is error {
            string customError = "Error occurred while listing meal records!";
            log:printError(customError, pageResult);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        return pageResult;
    }

    # Update an existing meal record.
    #
    # + ctx - Request context
    # + id - Meal record id
    # + payload - Update payload
    # + return - Updated record|NotFound|Forbidden|BadRequest|InternalServerError
    resource function put meal\-records/[int id](http:RequestContext ctx, database:UpdateMealRecordPayload payload)
            returns database:MealRecord|http:NotFound|http:Forbidden|http:BadRequest|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(authorization:USER_INFO_HEADER_NOT_FOUND_ERROR, userInfo);
            return <http:BadRequest>{
                body: {
                    message: authorization:USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: authorization:INSUFFICIENT_PRIVILEGES_ERROR
                }
            };
        }

        if payload.total_waste_kg is () && payload.plate_count is () {
            return <http:BadRequest>{
                body: {
                    message: "At least one of total_waste_kg or plate_count must be provided."
                }
            };
        }

        database:MealRecord|database:MealRecordNotFoundError|error updated =
            database:updateMealRecord(id, payload, userInfo.email);
        if updated is database:MealRecordNotFoundError {
            return <http:NotFound>{
                body: {
                    message: updated.message()
                }
            };
        }
        if updated is error {
            string customError = "Error occurred while updating meal record!";
            log:printError(customError, updated);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        return updated;
    }

    # Delete a meal record.
    #
    # + ctx - Request context
    # + id - Meal record id
    # + return - NoContent|NotFound|Forbidden|BadRequest|InternalServerError
    resource function delete meal\-records/[int id](http:RequestContext ctx)
            returns http:NoContent|http:NotFound|http:Forbidden|http:BadRequest|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(authorization:USER_INFO_HEADER_NOT_FOUND_ERROR, userInfo);
            return <http:BadRequest>{
                body: {
                    message: authorization:USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: authorization:INSUFFICIENT_PRIVILEGES_ERROR
                }
            };
        }

        database:MealRecordNotFoundError|error? deleted = database:deleteMealRecord(id);
        if deleted is database:MealRecordNotFoundError {
            return <http:NotFound>{
                body: {
                    message: deleted.message()
                }
            };
        }
        if deleted is error {
            string customError = "Error occurred while deleting meal record!";
            log:printError(customError, deleted);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return <http:NoContent>{};
    }

    // --- Advertisements Endpoints ---

    # Create a new advertisement.
    #
    # + ctx - Request context
    # + payload - Advertisement payload
    # + return - Created advertisement ID|Forbidden|BadRequest|InternalServerError
    resource function post advertisements(http:RequestContext ctx, database:CreateAdvertisementPayload payload)
            returns http:Created|http:Forbidden|http:BadRequest|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(authorization:USER_INFO_HEADER_NOT_FOUND_ERROR, userInfo);
            return <http:BadRequest>{
                body: {
                    message: authorization:USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: authorization:INSUFFICIENT_PRIVILEGES_ERROR
                }
            };
        }

        int|error adId = database:addAdvertisement(payload, userInfo.email);
        if adId is error {
            string customError = "Error occurred while creating advertisement!";
            log:printError(customError, adId);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return <http:Created>{body: {id: adId}};
    }

    # Get all advertisements.
    #
    # + ctx - Request context
    # + return - List of advertisements|Forbidden|BadRequest|InternalServerError
    resource function get advertisements(http:RequestContext ctx)
            returns database:Advertisement[]|http:Forbidden|http:BadRequest|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(authorization:USER_INFO_HEADER_NOT_FOUND_ERROR, userInfo);
            return <http:BadRequest>{
                body: {
                    message: authorization:USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.EMPLOYEE_PRIVILEGE], userInfo.groups) &&
                !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: authorization:INSUFFICIENT_PRIVILEGES_ERROR
                }
            };
        }

        database:Advertisement[]|error ads = database:getAdvertisements();
        if ads is error {
            string customError = "Error occurred while fetching advertisements!";
            log:printError(customError, ads);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        return ads;
    }

    # Get the active advertisement.
    #
    # + ctx - Request context
    # + return - Active advertisement|NotFound|Forbidden|BadRequest|InternalServerError
    resource function get advertisements/active(http:RequestContext ctx)
            returns database:Advertisement|http:NotFound|http:Forbidden|http:BadRequest|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(authorization:USER_INFO_HEADER_NOT_FOUND_ERROR, userInfo);
            return <http:BadRequest>{
                body: {
                    message: authorization:USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        database:Advertisement|error? ad = database:getActiveAdvertisement();
        if ad is error {
            string customError = "Error occurred while fetching active advertisement!";
            log:printError(customError, ad);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        if ad is () {
            return <http:NotFound>{
                body: {
                    message: "No active advertisement found."
                }
            };
        }
        return ad;
    }

    # Activate an advertisement.
    #
    # + ctx - Request context
    # + id - Ad ID
    # + return - Ok|NotFound|Forbidden|BadRequest|InternalServerError
    resource function put advertisements/[int id]/activate(http:RequestContext ctx)
            returns http:Ok|http:NotFound|http:Forbidden|http:BadRequest|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(authorization:USER_INFO_HEADER_NOT_FOUND_ERROR, userInfo);
            return <http:BadRequest>{
                body: {
                    message: authorization:USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: authorization:INSUFFICIENT_PRIVILEGES_ERROR
                }
            };
        }

        error? result = database:activateAdvertisement(id);
        if result is error {
            if result.message().includes("not found") {
                return <http:NotFound>{
                    body: {
                        message: result.message()
                    }
                };
            }
            string customError = "Error occurred while activating advertisement!";
            log:printError(customError, result);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return <http:Ok>{body: {message: "Advertisement activated successfully"}};
    }

    # Delete an advertisement.
    #
    # + ctx - Request context
    # + id - Ad ID
    # + return - NoContent|BadRequest|NotFound|Forbidden|InternalServerError
    resource function delete advertisements/[int id](http:RequestContext ctx)
            returns http:NoContent|http:BadRequest|http:NotFound|http:Forbidden|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(authorization:USER_INFO_HEADER_NOT_FOUND_ERROR, userInfo);
            return <http:BadRequest>{
                body: {
                    message: authorization:USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: authorization:INSUFFICIENT_PRIVILEGES_ERROR
                }
            };
        }

        error? result = database:deleteAdvertisement(id);
        if result is error {
            if result.message().includes("active advertisement") {
                return <http:BadRequest>{
                    body: {
                        message: result.message()
                    }
                };
            }
            if result.message().includes("not found") {
                return <http:NotFound>{
                    body: {
                        message: result.message()
                    }
                };
            }
            string customError = "Error occurred while deleting advertisement!";
            log:printError(customError, result);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return <http:NoContent>{};
    }

    // --- Analytics Endpoints ---

    # Get today's KPIs.
    #
    # + ctx - Request context
    # + return - Today's KPIs|Forbidden|BadRequest|InternalServerError
    resource function get analytics/today(http:RequestContext ctx)
            returns database:TodayKPIs|http:Forbidden|http:BadRequest|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(authorization:USER_INFO_HEADER_NOT_FOUND_ERROR, userInfo);
            return <http:BadRequest>{
                body: {
                    message: authorization:USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.EMPLOYEE_PRIVILEGE], userInfo.groups) &&
                !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: authorization:INSUFFICIENT_PRIVILEGES_ERROR
                }
            };
        }

        string date = string:substring(time:utcToString(time:utcNow()), 0, 10);
        database:TodayKPIs|error kpis = database:getTodayKPIs(date);
        if kpis is error {
            string customError = "Error occurred while fetching today's KPIs!";
            log:printError(customError, kpis);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        return kpis;
    }

    // --- Reports Endpoints ---

    # Export meal records as CSV.
    #
    # + ctx - Request context
    # + start_date - Start date (YYYY-MM-DD)
    # + end_date - End date (YYYY-MM-DD)
    # + format - Export format (default: csv)
    # + return - CSV response|Forbidden|BadRequest|InternalServerError
    resource function get reports/export(http:RequestContext ctx, string start_date, string end_date,
            string format = "csv")
            returns http:Response|http:Forbidden|http:BadRequest|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(authorization:USER_INFO_HEADER_NOT_FOUND_ERROR, userInfo);
            return <http:BadRequest>{
                body: {
                    message: authorization:USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
            return <http:Forbidden>{
                body: {
                    message: authorization:INSUFFICIENT_PRIVILEGES_ERROR
                }
            };
        }

        if format != "csv" {
            return <http:BadRequest>{
                body: {
                    message: "Only 'csv' format is supported."
                }
            };
        }

        database:MealRecordFilters filters = {start_date, end_date, 'limit: 1000, offset: 0};
        database:PaginatedMealRecords|error records = database:fetchMealRecords(filters, 1, 1000);
        if records is error {
            string customError = "Error occurred while fetching data for export!";
            log:printError(customError, records);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        string csv = "record_date,meal_type,total_waste_kg,plate_count\n";
        foreach database:MealRecord rec in records.records {
            csv += string `${rec.record_date},${rec.meal_type},${rec.total_waste_kg},${rec.plate_count}` + "\n";
        }

        http:Response response = new;
        response.setTextPayload(csv, contentType = "text/csv");
        response.setHeader("Content-Disposition", string `attachment; filename="report-${start_date}.csv"`);
        return response;
    }
}
