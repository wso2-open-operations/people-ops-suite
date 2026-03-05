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
    # + return - User info object|InternalServerError
    resource function get user\-info(http:RequestContext ctx)
            returns UserInfoResponse|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(authorization:USER_INFO_HEADER_NOT_FOUND_ERROR, userInfo);
            return <http:InternalServerError>{body: {message: authorization:USER_INFO_HEADER_NOT_FOUND_ERROR}};
        }

        if cache.hasKey(userInfo.email) {
            UserInfoResponse|error cachedUserInfo = cache.get(userInfo.email).ensureType();
            if cachedUserInfo is UserInfoResponse {
                return cachedUserInfo;
            }
        }

        entity:Employee|error loggedInUser = entity:fetchEmployeesBasicInfo(userInfo.email);
        if loggedInUser is error {
            string customError = "Error occurred while retrieving user data!";
            log:printError(customError, loggedInUser, userEmail = userInfo.email);
            return <http:InternalServerError>{body: {message: customError}};
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

    // --- Food Waste Endpoints ---

    # Create a new breakfast or lunch food waste record.
    #
    # + ctx - Request context
    # + payload - Food waste record payload
    # + return - Created record|Conflict|Forbidden|BadRequest|InternalServerError
    resource function post food\-waste(http:RequestContext ctx, AddFoodWasteRecordPayload payload)
            returns http:Created|http:Conflict|http:Forbidden|http:BadRequest|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(authorization:USER_INFO_HEADER_NOT_FOUND_ERROR, userInfo);
            return <http:BadRequest>{body: {message: authorization:USER_INFO_HEADER_NOT_FOUND_ERROR}};
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
            return <http:Forbidden>{body: {message: authorization:INSUFFICIENT_PRIVILEGES_ERROR}};
        }

        int|database:DuplicateFoodWasteRecordError|error foodWasteRecordId =
            database:addFoodWasteRecord(payload, userInfo.email);
        if foodWasteRecordId is database:DuplicateFoodWasteRecordError {
            return <http:Conflict>{body: {message: foodWasteRecordId.message()}};
        }
        if foodWasteRecordId is error {
            string customError = "Error occurred while creating food waste record!";
            log:printError(customError, foodWasteRecordId);
            return <http:InternalServerError>{body: {message: customError}};
        }

        FoodWasteRecord|error? created = database:fetchFoodWasteRecord(foodWasteRecordId);
        if created is error {
            string customError = "Error occurred while retrieving created food waste record!";
            log:printError(customError, created);
            return <http:InternalServerError>{body: {message: customError}};
        }
        if created is () {
            string customError = "Created food waste record is no longer available to access!";
            log:printError(customError);
            return <http:InternalServerError>{body: {message: customError}};
        }
        return <http:Created>{body: created};
    }

    # Get breakfast + lunch data for one specific day.
    #
    # + ctx - Request context
    # + date - Date (YYYY-MM-DD)
    # + return - DailyFoodWasteRecords|Forbidden|BadRequest|InternalServerError
    resource function get food\-waste/daily(http:RequestContext ctx, string date)
            returns DailyFoodWasteRecords|http:Forbidden|http:BadRequest|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(authorization:USER_INFO_HEADER_NOT_FOUND_ERROR, userInfo);
            return <http:BadRequest>{body: {message: authorization:USER_INFO_HEADER_NOT_FOUND_ERROR}};
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.EMPLOYEE_PRIVILEGE], userInfo.groups) &&
                !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
            return <http:Forbidden>{body: {message: authorization:INSUFFICIENT_PRIVILEGES_ERROR}};
        }

        if !database:DATE_REGEX.isFullMatch(date) {
            return <http:BadRequest>{body: {message: "Invalid date string. Expected YYYY-MM-DD."}};
        }

        DailyFoodWasteRecords|error daily = database:fetchDailyFoodWasteRecords(date);
        if daily is error {
            string customError = "Error occurred while fetching daily food waste records!";
            log:printError(customError, daily);
            return <http:InternalServerError>{body: {message: customError}};
        }
        return daily;
    }

    # List/filter food waste records with pagination.
    #
    # + ctx - Request context
    # + startDate - Start date (YYYY-MM-DD) - optional
    # + endDate - End date (YYYY-MM-DD) - optional
    # + mealType - Meal type (BREAKFAST|LUNCH) - optional
    # + duration - Analytics duration (yearly|monthly|weekly) - optional
    # + latest - Get only the most recent record - optional
    # + limit - Maximum number of records to return - optional
    # + offset - Number of records to skip - optional
    # + return - Paginated list|latest KPI summary|analytics data|Forbidden|BadRequest|InternalServerError
    resource function get food\-waste(http:RequestContext ctx, string? startDate = (), string? endDate = (),
            string? mealType = (), string? duration = (), boolean latest = false, int? 'limit = (),
            int? offset = ())
            returns PaginatedFoodWasteRecords|TodayKPIs|WeeklyTrendItem[]|
                MonthlyTrendItem[]|http:Forbidden|http:BadRequest|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(authorization:USER_INFO_HEADER_NOT_FOUND_ERROR, userInfo);
            return <http:BadRequest>{body: {message: authorization:USER_INFO_HEADER_NOT_FOUND_ERROR}};
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.EMPLOYEE_PRIVILEGE], userInfo.groups) &&
                !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
            return <http:Forbidden>{body: {message: authorization:INSUFFICIENT_PRIVILEGES_ERROR}};
        }

        if duration is string {
            if !(duration == "yearly" || duration == "monthly" || duration == "weekly") {
                return <http:BadRequest>{body: {message: "duration must be yearly, monthly, or weekly"}};
            }

            if duration == "weekly" {
                WeeklyTrendItem[]|error weeklyData;
                if startDate is string && endDate is string {
                    weeklyData = operation:getWeeklyTrendData(startDate, endDate);
                } else {
                    weeklyData = operation:getWeeklyTrendDataDefault();
                }
                if weeklyData is error {
                    string customError = "Error occurred while fetching weekly analytics!";
                    log:printError(customError, weeklyData);
                    return <http:InternalServerError>{body: {message: customError}};
                }
                return weeklyData;
            } else if duration == "monthly" {
                MonthlyTrendItem[]|error monthlyData = operation:getMonthlyTrendData();
                if monthlyData is error {
                    string customError = "Error occurred while fetching monthly analytics!";
                    log:printError(customError, monthlyData);
                    return <http:InternalServerError>{body: {message: customError}};
                }
                return monthlyData;
            }

            MonthlyTrendItem[]|error yearlyData = operation:getYearlyTrendData();
            if yearlyData is error {
                string customError = "Error occurred while fetching yearly analytics!";
                log:printError(customError, yearlyData);
                return <http:InternalServerError>{body: {message: customError}};
            }
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
            PaginatedFoodWasteRecords|error result =
                database:fetchFoodWasteRecords(latestFilters, 1, 1);
            if result is error {
                string customError = "Error occurred while fetching latest food waste KPI!";
                log:printError(customError, result);
                return <http:InternalServerError>{body: {message: customError}};
            }

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
            TodayKPIs|error latestKpi = operation:getTodayKpis(kpiDate);
            if latestKpi is error {
                string customError = "Error occurred while fetching latest food waste KPI!";
                log:printError(customError, latestKpi);
                return <http:InternalServerError>{body: {message: customError}};
            }
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
        PaginatedFoodWasteRecords|error pageResult =
            database:fetchFoodWasteRecords(filters, page, limitValue);
        if pageResult is error {
            string customError = "Error occurred while listing food waste records!";
            log:printError(customError, pageResult);
            return <http:InternalServerError>{body: {message: customError}};
        }
        return pageResult;
    }

    # Update an existing food waste record.
    #
    # + ctx - Request context
    # + id - Food waste record id
    # + payload - Update payload
    # + return - Updated record|NotFound|Forbidden|BadRequest|InternalServerError
    resource function put food\-waste/[int id](http:RequestContext ctx, UpdateFoodWasteRecordPayload payload)
            returns FoodWasteRecord|http:NotFound|http:Forbidden|http:BadRequest|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(authorization:USER_INFO_HEADER_NOT_FOUND_ERROR, userInfo);
            return <http:BadRequest>{body: {message: authorization:USER_INFO_HEADER_NOT_FOUND_ERROR}};
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
            return <http:Forbidden>{body: {message: authorization:INSUFFICIENT_PRIVILEGES_ERROR}};
        }

        if payload.totalWasteKg is () && payload.plateCount is () {
            return <http:BadRequest>{
                body: {message: "At least one of totalWasteKg or plateCount must be provided."}
            };
        }

        FoodWasteRecord|database:FoodWasteRecordNotFoundError|error updated =
            operation:updateFoodWasteRecord(id, payload, userInfo.email);
        if updated is database:FoodWasteRecordNotFoundError {
            return <http:NotFound>{body: {message: updated.message()}};
        }
        if updated is error {
            string customError = "Error occurred while updating food waste record!";
            log:printError(customError, updated);
            return <http:InternalServerError>{body: {message: customError}};
        }
        return updated;
    }

    # Delete a food waste record.
    #
    # + ctx - Request context
    # + id - Food waste record id
    # + return - NoContent|NotFound|Forbidden|BadRequest|InternalServerError
    resource function delete food\-waste/[int id](http:RequestContext ctx)
            returns http:NoContent|http:NotFound|http:Forbidden|http:BadRequest|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(authorization:USER_INFO_HEADER_NOT_FOUND_ERROR, userInfo);
            return <http:BadRequest>{body: {message: authorization:USER_INFO_HEADER_NOT_FOUND_ERROR}};
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
            return <http:Forbidden>{body: {message: authorization:INSUFFICIENT_PRIVILEGES_ERROR}};
        }

        database:FoodWasteRecordNotFoundError|error? deleted = database:deleteFoodWasteRecord(id);
        if deleted is database:FoodWasteRecordNotFoundError {
            return <http:NotFound>{body: {message: deleted.message()}};
        }
        if deleted is error {
            string customError = "Error occurred while deleting food waste record!";
            log:printError(customError, deleted);
            return <http:InternalServerError>{body: {message: customError}};
        }
        return <http:NoContent>{};
    }

    // --- Advertisement Endpoints ---

    # Create a new advertisement.
    #
    # + ctx - Request context
    # + payload - Advertisement payload
    # + return - Created advertisement|Forbidden|BadRequest|InternalServerError
    resource function post advertisements(http:RequestContext ctx, CreateAdvertisementPayload payload)
            returns http:Created|http:Forbidden|http:BadRequest|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(authorization:USER_INFO_HEADER_NOT_FOUND_ERROR, userInfo);
            return <http:BadRequest>{body: {message: authorization:USER_INFO_HEADER_NOT_FOUND_ERROR}};
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
            return <http:Forbidden>{body: {message: authorization:INSUFFICIENT_PRIVILEGES_ERROR}};
        }

        int|error adId = database:addAdvertisement(payload, userInfo.email);
        if adId is error {
            string customError = "Error occurred while creating advertisement!";
            log:printError(customError, adId);
            return <http:InternalServerError>{body: {message: customError}};
        }
        return <http:Created>{body: {id: adId}};
    }

    # Get all advertisements.
    #
    # + ctx - Request context
    # + return - List of advertisements|Forbidden|BadRequest|InternalServerError
    resource function get advertisements(http:RequestContext ctx)
            returns Advertisement[]|http:Forbidden|http:BadRequest|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(authorization:USER_INFO_HEADER_NOT_FOUND_ERROR, userInfo);
            return <http:BadRequest>{body: {message: authorization:USER_INFO_HEADER_NOT_FOUND_ERROR}};
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.EMPLOYEE_PRIVILEGE], userInfo.groups) &&
                !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
            return <http:Forbidden>{body: {message: authorization:INSUFFICIENT_PRIVILEGES_ERROR}};
        }

        Advertisement[]|error ads = database:getAdvertisements();
        if ads is error {
            string customError = "Error occurred while fetching advertisements!";
            log:printError(customError, ads);
            return <http:InternalServerError>{body: {message: customError}};
        }
        return ads;
    }

    # Get the active advertisement.
    #
    # + ctx - Request context
    # + return - Active advertisement|NotFound|Forbidden|BadRequest|InternalServerError
    resource function get advertisements/active(http:RequestContext ctx)
            returns Advertisement|http:NotFound|http:Forbidden|http:BadRequest|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(authorization:USER_INFO_HEADER_NOT_FOUND_ERROR, userInfo);
            return <http:BadRequest>{body: {message: authorization:USER_INFO_HEADER_NOT_FOUND_ERROR}};
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.EMPLOYEE_PRIVILEGE], userInfo.groups) &&
                !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
            return <http:Forbidden>{body: {message: authorization:INSUFFICIENT_PRIVILEGES_ERROR}};
        }

        Advertisement|error? ad = database:getActiveAdvertisement();
        if ad is error {
            string customError = "Error occurred while fetching active advertisement!";
            log:printError(customError, ad);
            return <http:InternalServerError>{body: {message: customError}};
        }
        if ad is () {
            return <http:NotFound>{body: {message: "No active advertisement found."}};
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
            return <http:BadRequest>{body: {message: authorization:USER_INFO_HEADER_NOT_FOUND_ERROR}};
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
            return <http:Forbidden>{body: {message: authorization:INSUFFICIENT_PRIVILEGES_ERROR}};
        }

        database:AdvertisementNotFoundError|error? result = database:activateAdvertisement(id);
        if result is database:AdvertisementNotFoundError {
            return <http:NotFound>{body: {message: result.message()}};
        }
        if result is error {
            string customError = "Error occurred while activating advertisement!";
            log:printError(customError, result);
            return <http:InternalServerError>{body: {message: customError}};
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
            return <http:BadRequest>{body: {message: authorization:USER_INFO_HEADER_NOT_FOUND_ERROR}};
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
            return <http:Forbidden>{body: {message: authorization:INSUFFICIENT_PRIVILEGES_ERROR}};
        }

        database:ActiveAdvertisementError|database:AdvertisementNotFoundError|error? result =
            operation:deleteAdvertisement(id);
        if result is database:ActiveAdvertisementError {
            return <http:BadRequest>{body: {message: result.message()}};
        }
        if result is database:AdvertisementNotFoundError {
            return <http:NotFound>{body: {message: result.message()}};
        }
        if result is error {
            string customError = "Error occurred while deleting advertisement!";
            log:printError(customError, result);
            return <http:InternalServerError>{body: {message: customError}};
        }
        return <http:NoContent>{};
    }

    // --- Date Range Summary Endpoint ---

    # Get summary statistics for a date range.
    #
    # + ctx - Request context
    # + startDate - Start date (YYYY-MM-DD)
    # + endDate - End date (YYYY-MM-DD)
    # + return - DateRangeSummary|Forbidden|BadRequest|InternalServerError
    resource function get food\-waste/summary(http:RequestContext ctx, string startDate, string endDate)
            returns DateRangeSummary|http:Forbidden|http:BadRequest|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(authorization:USER_INFO_HEADER_NOT_FOUND_ERROR, userInfo);
            return <http:BadRequest>{body: {message: authorization:USER_INFO_HEADER_NOT_FOUND_ERROR}};
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.EMPLOYEE_PRIVILEGE], userInfo.groups) &&
                !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_PRIVILEGE], userInfo.groups) {
            return <http:Forbidden>{body: {message: authorization:INSUFFICIENT_PRIVILEGES_ERROR}};
        }

        if !database:DATE_REGEX.isFullMatch(startDate) || !database:DATE_REGEX.isFullMatch(endDate) {
            return <http:BadRequest>{body: {message: "Invalid date string. Expected YYYY-MM-DD."}};
        }

        DateRangeSummary|error summary = operation:getDateRangeSummary(startDate, endDate);
        if summary is error {
            string customError = "Error occurred while fetching date range summary!";
            log:printError(customError, summary);
            return <http:InternalServerError>{body: {message: customError}};
        }
        return summary;
    }
}
