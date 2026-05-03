// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
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
import dashboard_app_backend.operation;

import ballerina/cache;
import ballerina/http;
import ballerina/log;
import ballerina/time;

final cache:Cache cache = new ({
    capacity: 2000,
    defaultMaxAge: 1800.0,
    cleanupInterval: 900.0
});

// Intercept and sanitize HTTP Bad Request responses caused by payload binding failures.
service class BadRequestInterceptor {
    *http:ResponseErrorInterceptor;

    remote function interceptResponseError(error err, http:RequestContext ctx) returns http:BadRequest|error {
        if err is http:PayloadBindingError {
            log:printError("Payload binding failed!", err, payloadBindingMessage = err.message());
            return {
                body: {
                    message: "Invalid request payload"
                }
            };
        }
        return err;
    }
}

@display {
    label: "Dashboard Application",
    id: "people-ops-suite/dashboard-service"
}
service http:InterceptableService / on new http:Listener(9090) {

    # Request interceptor.
    #
    # + return - authorization:JwtInterceptor, BadRequestInterceptor
    public function createInterceptors() returns http:Interceptor[] =>
        [new authorization:JwtInterceptor(), new BadRequestInterceptor()];

    # Fetch user information of the logged-in user.
    #
    # + ctx - Request context
    # + return - User info object or InternalServerError
    resource function get user\-info(http:RequestContext ctx)
            returns UserInfoResponse|http:InternalServerError {
        do {
            authorization:CustomJwtPayload userInfo = check ctx.getWithType(authorization:HEADER_USER_INFO);

            lock {
                if cache.hasKey(userInfo.email) {
                    UserInfoResponse|error cachedUserInfo = cache.get(userInfo.email).ensureType();
                    if cachedUserInfo is UserInfoResponse {
                        return cachedUserInfo;
                    }
                }
            }

            entity:Employee loggedInUser = check entity:fetchEmployeesBasicInfo(userInfo.email);

            int[] privileges = [];
            if authorization:checkPermissions([authorization:authorizedRoles.EMPLOYEE_PRIVILEGE], userInfo.groups) {
                privileges.push(authorization:EMPLOYEE_PRIVILEGE);
            }
            if authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
                privileges.push(authorization:SECURITY_ADMIN_PRIVILEGE);
            }

            UserInfoResponse userInfoResponse = {...loggedInUser, privileges};
            lock {
                error? cacheError = cache.put(userInfo.email, userInfoResponse);
                if cacheError is error {
                    log:printError("An error occurred while writing user info to the cache", cacheError);
                }
            }
            return userInfoResponse;
        } on fail error internalErr {
            log:printError(authorization:USER_INFO_HEADER_NOT_FOUND_ERROR, internalErr);
            return <http:InternalServerError>{body: {message: authorization:USER_INFO_HEADER_NOT_FOUND_ERROR}};
        }
    }

    // --- Food Waste Endpoints ---

    # Create a new breakfast or lunch food waste record.
    #
    # + ctx - Request context
    # + payload - Food waste record payload
    # + return - Created record or Conflict or Forbidden or BadRequest or InternalServerError
    resource function post food\-waste(http:RequestContext ctx, AddFoodWasteRecordPayload payload)
            returns http:Created|http:Conflict|http:Forbidden|http:BadRequest|http:InternalServerError {
        do {
            authorization:CustomJwtPayload userInfo = check ctx.getWithType(authorization:HEADER_USER_INFO);

            if !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
                return <http:Forbidden>{body: {message: authorization:INSUFFICIENT_PRIVILEGES_ERROR}};
            }

            int|database:DuplicateFoodWasteRecordError|error result =
                database:addFoodWasteRecord(payload, userInfo.email);

            if result is database:DuplicateFoodWasteRecordError {
                return <http:Conflict>{body: {message: result.message()}};
            }
            int foodWasteRecordId = check result;

            FoodWasteRecord|error? created = database:fetchFoodWasteRecord(foodWasteRecordId);
            if created is error {
                return <http:InternalServerError>{body: {message: "Error occurred while retrieving created food waste record!"}};
            }
            if created is () {
                return <http:InternalServerError>{body: {message: "Created food waste record is no longer available to access!"}};
            }
            return <http:Created>{body: created};
        } on fail error internalErr {
            log:printError("Error occurred while creating food waste record!", internalErr);
            return <http:InternalServerError>{body: {message: "Error occurred while creating food waste record!"}};
        }
    }

    # Get breakfast + lunch data for one specific day.
    #
    # + ctx - Request context
    # + date - Date (YYYY-MM-DD)
    # + return - DailyFoodWasteRecords or Forbidden or BadRequest or InternalServerError
    resource function get food\-waste/daily(http:RequestContext ctx, string date)
            returns DailyFoodWasteRecords|http:Forbidden|http:BadRequest|http:InternalServerError {
        do {
            authorization:CustomJwtPayload userInfo = check ctx.getWithType(authorization:HEADER_USER_INFO);

            if !authorization:checkPermissions([authorization:authorizedRoles.EMPLOYEE_PRIVILEGE], userInfo.groups) &&
                    !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
                return <http:Forbidden>{body: {message: authorization:INSUFFICIENT_PRIVILEGES_ERROR}};
            }

            if !database:DATE_REGEX.isFullMatch(date) {
                return <http:BadRequest>{body: {message: "Invalid date string. Expected YYYY-MM-DD."}};
            }

            DailyFoodWasteRecords daily = check database:fetchDailyFoodWasteRecords(date);
            return daily;
        } on fail error internalErr {
            log:printError("Error occurred while fetching daily food waste records!", internalErr);
            return <http:InternalServerError>{body: {message: "Error occurred while fetching daily food waste records!"}};
        }
    }

    # List/filter food waste records with pagination.
    #
    # + ctx - Request context
    # + startDate - Start date (YYYY-MM-DD) - optional
    # + endDate - End date (YYYY-MM-DD) - optional
    # + mealType - Meal type (BREAKFAST or LUNCH) - optional
    # + duration - Analytics duration (yearly or monthly or weekly) - optional
    # + latest - Get only the most recent record - optional
    # + limit - Maximum number of records to return - optional
    # + offset - Number of records to skip - optional
    # + return - Paginated list or latest KPI summary or analytics data or Forbidden or BadRequest or InternalServerError
    resource function get food\-waste(http:RequestContext ctx, string? startDate = (), string? endDate = (),
            string? mealType = (), string? duration = (), boolean latest = false, int? 'limit = (),
            int? offset = ())
            returns PaginatedFoodWasteRecords|TodayKPIs|WeeklyTrendItem[]|
                MonthlyTrendItem[]|http:Forbidden|http:BadRequest|http:InternalServerError {
        do {
            authorization:CustomJwtPayload userInfo = check ctx.getWithType(authorization:HEADER_USER_INFO);

            if !authorization:checkPermissions([authorization:authorizedRoles.EMPLOYEE_PRIVILEGE], userInfo.groups) &&
                    !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
                return <http:Forbidden>{body: {message: authorization:INSUFFICIENT_PRIVILEGES_ERROR}};
            }

            if startDate is string && !database:DATE_REGEX.isFullMatch(startDate) ||
                    endDate is string && !database:DATE_REGEX.isFullMatch(endDate) {
                return <http:BadRequest>{body: {message: "Invalid date string. Expected YYYY-MM-DD."}};
            }

            if duration is string {
                if !(duration == "yearly" || duration == "monthly" || duration == "weekly") {
                    return <http:BadRequest>{body: {message: "duration must be yearly, monthly, or weekly"}};
                }

                if duration == "weekly" {
                    if startDate is () && endDate is string || startDate is string && endDate is () {
                        return <http:BadRequest>{
                            body: {message: "Provide both startDate and endDate for weekly duration."}
                        };
                    }
                    if startDate is string && endDate is string && startDate > endDate {
                        return <http:BadRequest>{body: {message: "startDate must be <= endDate."}};
                    }

                    WeeklyTrendItem[] weeklyData;
                    if startDate is string && endDate is string {
                        weeklyData = check operation:getWeeklyTrendData(startDate, endDate);
                    } else {
                        weeklyData = check operation:getWeeklyTrendDataDefault();
                    }
                    return weeklyData;
                } else if duration == "monthly" {
                    MonthlyTrendItem[] monthlyData = check operation:getMonthlyTrendData();
                    return monthlyData;
                }

                MonthlyTrendItem[] yearlyData = check operation:getYearlyTrendData();
                return yearlyData;
            }

            if mealType is string && !(mealType == "BREAKFAST" || mealType == "LUNCH") {
                return <http:BadRequest>{body: {message: "mealType must be BREAKFAST or LUNCH"}};
            }

            int limitValue = 'limit ?: database:DEFAULT_PAGE_SIZE;
            int offsetValue = offset ?: 0;

            if limitValue < 1 || limitValue > database:MAX_PAGE_SIZE {
                return <http:BadRequest>{
                    body: {message: string `limit must be between 1 and ${database:MAX_PAGE_SIZE}`}
                };
            }
            if offsetValue < 0 {
                return <http:BadRequest>{body: {message: "offset must be >= 0"}};
            }

            if latest {
                database:FoodWasteRecordFilters latestFilters = {startDate, endDate, mealType, 'limit: 1, offset: 0};
                PaginatedFoodWasteRecords result =
                    check database:fetchFoodWasteRecords(latestFilters, 1, 1);

                string kpiDate = endDate ?: string:substring(time:utcToString(time:utcNow()), 0, 10);
                if result.records.length() == 0 {
                    return {
                        date: kpiDate,
                        breakfast: (),
                        lunch: (),
                        totalDailyWasteKg: 0.0d,
                        totalDailyPlates: 0,
                        averageWastePerPlateGrams: 0.0d
                    };
                }

                kpiDate = result.records[0].recordDate;
                TodayKPIs latestKpi = check operation:getTodayKpis(kpiDate);
                return latestKpi;
            }

            database:FoodWasteRecordFilters filters = {
                startDate,
                endDate,
                mealType,
                'limit: limitValue,
                offset: offsetValue
            };
            int page = (offsetValue / limitValue) + 1;
            PaginatedFoodWasteRecords pageResult =
                check database:fetchFoodWasteRecords(filters, page, limitValue);
            return pageResult;
        } on fail error internalErr {
            log:printError("Error occurred while listing food waste records!", internalErr);
            return <http:InternalServerError>{body: {message: "Error occurred while listing food waste records!"}};
        }
    }

    # Update an existing food waste record.
    #
    # + ctx - Request context
    # + id - Food waste record id
    # + payload - Update payload
    # + return - Updated record or Conflict or NotFound or Forbidden or BadRequest or InternalServerError
    resource function put food\-waste/[int id](http:RequestContext ctx, UpdateFoodWasteRecordPayload payload)
            returns FoodWasteRecord|http:Conflict|http:NotFound|http:Forbidden|http:BadRequest|http:InternalServerError {
        do {
            authorization:CustomJwtPayload userInfo = check ctx.getWithType(authorization:HEADER_USER_INFO);

            if !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
                return <http:Forbidden>{body: {message: authorization:INSUFFICIENT_PRIVILEGES_ERROR}};
            }

            if payload.totalWasteKg is () && payload.plateCount is () {
                return <http:BadRequest>{
                    body: {message: "At least one of totalWasteKg or plateCount must be provided."}
                };
            }

            FoodWasteRecord updated = check operation:updateFoodWasteRecord(id, payload, userInfo.email);
            return updated;
        } on fail error internalErr {
            if internalErr is database:DuplicateFoodWasteRecordError {
                return <http:Conflict>{body: {message: internalErr.message()}};
            }
            if internalErr is database:FoodWasteRecordNotFoundError {
                return <http:NotFound>{body: {message: internalErr.message()}};
            }
            log:printError("Error occurred while updating food waste record!", internalErr);
            return <http:InternalServerError>{body: {message: "Error occurred while updating food waste record!"}};
        }
    }

    # Delete a food waste record.
    #
    # + ctx - Request context
    # + id - Food waste record id
    # + return - NoContent or NotFound or Forbidden or BadRequest or InternalServerError
    resource function delete food\-waste/[int id](http:RequestContext ctx)
            returns http:NoContent|http:NotFound|http:Forbidden|http:BadRequest|http:InternalServerError {
        do {
            authorization:CustomJwtPayload userInfo = check ctx.getWithType(authorization:HEADER_USER_INFO);

            if !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
                return <http:Forbidden>{body: {message: authorization:INSUFFICIENT_PRIVILEGES_ERROR}};
            }

            check database:deleteFoodWasteRecord(id);
            return <http:NoContent>{};
        } on fail error internalErr {
            if internalErr is database:FoodWasteRecordNotFoundError {
                return <http:NotFound>{body: {message: internalErr.message()}};
            }
            log:printError("Error occurred while deleting food waste record!", internalErr);
            return <http:InternalServerError>{body: {message: "Error occurred while deleting food waste record!"}};
        }
    }

    // --- Advertisement Endpoints ---

    # Create a new advertisement.
    #
    # + ctx - Request context
    # + payload - Advertisement payload
    # + return - Created advertisement or Forbidden or BadRequest or InternalServerError
    resource function post advertisements(http:RequestContext ctx, CreateAdvertisementPayload payload)
            returns http:Created|http:Forbidden|http:BadRequest|http:InternalServerError {
        do {
            authorization:CustomJwtPayload userInfo = check ctx.getWithType(authorization:HEADER_USER_INFO);

            if !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
                return <http:Forbidden>{body: {message: authorization:INSUFFICIENT_PRIVILEGES_ERROR}};
            }

            int adId = check database:addAdvertisement(payload, userInfo.email);
            return <http:Created>{body: {id: adId}};
        } on fail error internalErr {
            log:printError("Error occurred while creating advertisement!", internalErr);
            return <http:InternalServerError>{body: {message: "Error occurred while creating advertisement!"}};
        }
    }

    # Get all advertisements.
    #
    # + ctx - Request context
    # + return - List of advertisements or Forbidden or BadRequest or InternalServerError
    resource function get advertisements(http:RequestContext ctx)
            returns Advertisement[]|http:Forbidden|http:BadRequest|http:InternalServerError {
        do {
            authorization:CustomJwtPayload userInfo = check ctx.getWithType(authorization:HEADER_USER_INFO);

            if !authorization:checkPermissions([authorization:authorizedRoles.EMPLOYEE_PRIVILEGE], userInfo.groups) &&
                    !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
                return <http:Forbidden>{body: {message: authorization:INSUFFICIENT_PRIVILEGES_ERROR}};
            }

            Advertisement[] ads = check database:getAdvertisements();
            return ads;
        } on fail error internalErr {
            log:printError("Error occurred while fetching advertisements!", internalErr);
            return <http:InternalServerError>{body: {message: "Error occurred while fetching advertisements!"}};
        }
    }

    # Get the active advertisement.
    #
    # + ctx - Request context
    # + return - Active advertisement or NotFound or Forbidden or BadRequest or InternalServerError
    resource function get advertisements/active(http:RequestContext ctx)
            returns Advertisement|http:NotFound|http:Forbidden|http:BadRequest|http:InternalServerError {
        do {
            authorization:CustomJwtPayload userInfo = check ctx.getWithType(authorization:HEADER_USER_INFO);

            if !authorization:checkPermissions([authorization:authorizedRoles.EMPLOYEE_PRIVILEGE], userInfo.groups) &&
                    !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
                return <http:Forbidden>{body: {message: authorization:INSUFFICIENT_PRIVILEGES_ERROR}};
            }

            Advertisement|error? adResult = database:getActiveAdvertisement();
            if adResult is error {
                return <http:InternalServerError>{body: {message: "Error occurred while fetching active advertisement!"}};
            }
            if adResult is () {
                return <http:NotFound>{body: {message: "No active advertisement found."}};
            }
            return adResult;
        } on fail error internalErr {
            log:printError("Error occurred while fetching active advertisement!", internalErr);
            return <http:InternalServerError>{body: {message: "Error occurred while fetching active advertisement!"}};
        }
    }

    # Activate an advertisement.
    #
    # + ctx - Request context
    # + id - Ad ID
    # + return - Ok or NotFound or Forbidden or BadRequest or InternalServerError
    resource function put advertisements/[int id]/activate(http:RequestContext ctx)
            returns http:Ok|http:NotFound|http:Forbidden|http:BadRequest|http:InternalServerError {
        do {
            authorization:CustomJwtPayload userInfo = check ctx.getWithType(authorization:HEADER_USER_INFO);

            if !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
                return <http:Forbidden>{body: {message: authorization:INSUFFICIENT_PRIVILEGES_ERROR}};
            }

            check database:activateAdvertisement(id);
            return <http:Ok>{body: {message: "Advertisement activated successfully"}};
        } on fail error internalErr {
            if internalErr is database:AdvertisementNotFoundError {
                return <http:NotFound>{body: {message: internalErr.message()}};
            }
            log:printError("Error occurred while activating advertisement!", internalErr);
            return <http:InternalServerError>{body: {message: "Error occurred while activating advertisement!"}};
        }
    }

    # Delete an advertisement.
    #
    # + ctx - Request context
    # + id - Ad ID
    # + return - NoContent or BadRequest or NotFound or Forbidden or InternalServerError
    resource function delete advertisements/[int id](http:RequestContext ctx)
            returns http:NoContent|http:BadRequest|http:NotFound|http:Forbidden|http:InternalServerError {
        do {
            authorization:CustomJwtPayload userInfo = check ctx.getWithType(authorization:HEADER_USER_INFO);

            if !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
                return <http:Forbidden>{body: {message: authorization:INSUFFICIENT_PRIVILEGES_ERROR}};
            }

            check operation:deleteAdvertisement(id);
            return <http:NoContent>{};
        } on fail error internalErr {
            if internalErr is database:ActiveAdvertisementError {
                return <http:BadRequest>{body: {message: internalErr.message()}};
            }
            if internalErr is database:AdvertisementNotFoundError {
                return <http:NotFound>{body: {message: internalErr.message()}};
            }
            log:printError("Error occurred while deleting advertisement!", internalErr);
            return <http:InternalServerError>{body: {message: "Error occurred while deleting advertisement!"}};
        }
    }

    // --- Date Range Summary Endpoint ---

    # Get summary statistics for a date range.
    #
    # + ctx - Request context
    # + startDate - Start date (YYYY-MM-DD)
    # + endDate - End date (YYYY-MM-DD)
    # + return - DateRangeSummary or Forbidden or BadRequest or InternalServerError
    resource function get food\-waste/summary(http:RequestContext ctx, string startDate, string endDate)
            returns DateRangeSummary|http:Forbidden|http:BadRequest|http:InternalServerError {
        do {
            authorization:CustomJwtPayload userInfo = check ctx.getWithType(authorization:HEADER_USER_INFO);

            if !authorization:checkPermissions([authorization:authorizedRoles.EMPLOYEE_PRIVILEGE], userInfo.groups) &&
                    !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
                return <http:Forbidden>{body: {message: authorization:INSUFFICIENT_PRIVILEGES_ERROR}};
            }

            if !database:DATE_REGEX.isFullMatch(startDate) || !database:DATE_REGEX.isFullMatch(endDate) {
                return <http:BadRequest>{body: {message: "Invalid date string. Expected YYYY-MM-DD."}};
            }

            if startDate > endDate {
                return <http:BadRequest>{body: {message: "startDate must be <= endDate."}};
            }

            DateRangeSummary summary = check operation:getDateRangeSummary(startDate, endDate);
            return summary;
        } on fail error internalErr {
            log:printError("Error occurred while fetching date range summary!", internalErr);
            return <http:InternalServerError>{body: {message: "Error occurred while fetching date range summary!"}};
        }
    }
}
