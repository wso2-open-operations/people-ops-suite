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
import promotion_app.authorization;
import promotion_app.database;
import promotion_app.people;

import ballerina/cache;
import ballerina/http;
import ballerina/log;

public configurable AppConfig appConfig = ?;

final cache:Cache cache = new ({
    capacity: 2000,
    defaultMaxAge: 1800.0,
    cleanupInterval: 900.0
});

@display {
    label: "Promotion Backend Service",
    id: "people-ops/promotion-backend"
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

    # Retrieve application configurations.
    #
    # + return - Application configuration object or error
    resource function get app\-config() returns AppConfig => appConfig;

    resource function get user\-info(http:RequestContext ctx) returns UserInfoResponse|http:InternalServerError {
        // User information header.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);

        // Handle User Info error.
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        // Check if the employees are already cached.
        if cache.hasKey(userInfo.email) {
            UserInfoResponse|error cachedUserInfo = cache.get(userInfo.email).ensureType();
            if cachedUserInfo is UserInfoResponse {
                return cachedUserInfo;
            }
        }

        // Fetch the user information from the people service.
        people:EmployeesBasicInfo|error loggedInUser = people:fetchEmployeesBasicInfo(userInfo.email);
        if loggedInUser is error {
            string customError = string `Error occurred while retrieving user data: ${userInfo.email}!`;
            log:printError(customError, loggedInUser);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        //Get employee History.
        people:EmployeeHistory|error employeeData = people:getEmployeeHistory(userInfo.email);
        if employeeData is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        // Fetch the user's privileges based on the roles.
        int[] privileges = [];
        if authorization:checkPermissions([authorization:authorizedRoles.EMPLOYEE], userInfo.groups) {
            privileges.push(authorization:EMPLOYEE);
        }

        UserInfoResponse userInfoResponse = {
            employeeId: loggedInUser.employeeId,
            workEmail: loggedInUser.workEmail,
            firstName: loggedInUser.firstName,
            lastName: loggedInUser.lastName,
            joinedDetails: {
                startDate: employeeData.startDate,
                startedJobRole: employeeData.joinedJobRole,
                startedBusinessUnit: employeeData.joinedBusinessUnit,
                startedTeam: employeeData.joinedDepartment,
                startedSubTeam: employeeData.joinedTeam,
                startedReportingLead: employeeData.managerEmail,
                jobBand: employeeData.jobBand
            },
            jobRole: loggedInUser.jobRole,
            employeeThumbnail: loggedInUser.employeeThumbnail,
            privileges: privileges
        };

        error? cacheError = cache.put(userInfo.email, userInfoResponse);
        if cacheError is error {
            log:printError("An error occurred while writing user info to the cache", cacheError);
        }
        return userInfoResponse;
    }

    # Retrieve specific users' promotion requests for given criteria.
    #
    # + ctx - Request Context appended from the interceptor  
    # + employeeEmail - email of the employee  
    # + statusArray - Status of the promotion request  
    # + cycleId - Promotion Cycle Id  
    # + enableBuFilter - filter promotion requests base on logged in user business unit  
    # + 'type - Type of the promotion request  
    # + recommendedBy - Lead who recommended the promotion request
    # + return - Internal Server Error or Promotion request array
    resource function GET promotion/requests(http:RequestContext ctx, string? employeeEmail,
            string[]? statusArray, int? cycleId, boolean? enableBuFilter, string? 'type, string? recommendedBy)
        returns PromotionRequests|http:Forbidden|http:Unauthorized|error {

        // if there is a status array.
        if statusArray !is null {
            // Verifying the status of the promotion request.
            foreach string status in statusArray {
                if status !is database:PromotionRequestStatus {
                    return error("Invalid promotion request status provided!");
                }
            }
        }

        // "HEADER_USER_INFO" is the email of the user access this resource.
        // Interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload userInfo = check ctx.getWithType(authorization:HEADER_USER_INFO);

        // Get all privileges/roles for the user making the request.
        authorization:UserAppPrivilege userAppPrivileges = check authorization:getUserPrivileges(userInfo.email);

        if userInfo.email != employeeEmail {

            //checks if a user has all the required roles.
            if !database:checkRoles([database:LEAD], userAppPrivileges.roles) {
                return <http:Forbidden>{
                    body: {
                        message: "Insufficient privileges!"
                    }
                };
            }
        }

        // Flag to determine if recommendations should be hidden from the response.
        boolean hideRecommendations = false;

        // Flag to determine if status should be hidden from the response.
        boolean hideStatus = false;

        // Flag to control whether email-based filtering should be enforced (used to restrict access to user's own data).
        boolean setEmailConstrain = false;

        // Determines whether Business Unit (BU) filtering should be applied.
        // If `enableBuFilter` is a boolean, use it; otherwise default to `false`.
        boolean setBuConstrain = enableBuFilter is boolean ? enableBuFilter : false;

        // If the user is NOT an HR_ADMIN, FUNCTIONAL_LEAD, or PROMOTION_BOARD_MEMBER.
        if !(database:checkRoles([database:HR_ADMIN], userAppPrivileges.roles) ||
            database:checkRoles([database:FUNCTIONAL_LEAD], userAppPrivileges.roles) ||
            database:checkRoles([database:PROMOTION_BOARD_MEMBER], userAppPrivileges.roles)) {

            // If an employee email is provided, but it doesn't match the logged-in user's email.
            if employeeEmail !is () && userInfo.email != employeeEmail {
                // Block access - user is not authorized to view others' promotion history.
                return <http:Unauthorized>{
                    body: {
                        message: "Insufficient privilege to access promotion application of others."
                    }
                };
            }

            // Since user isn't privileged, hide the recommendation section from them.
            hideRecommendations = true;

            // Employees and leads cannot see their own promotion request status after the cycle has ended.
            hideStatus = true;

            // Enforce filtering based on user email (only allow access to their own data).
            setEmailConstrain = true;
        }

        // If the user is a FUNCTIONAL_LEAD but NOT an HR_ADMIN or PROMOTION_BOARD_MEMBER.
        if !(database:checkRoles([database:HR_ADMIN], userAppPrivileges.roles) ||
            database:checkRoles([database:PROMOTION_BOARD_MEMBER], userAppPrivileges.roles)) &&
            database:checkRoles([database:FUNCTIONAL_LEAD], userAppPrivileges.roles) {

            // Restrict functional leads from accessing data outside of their BU.
            setBuConstrain = true;
        }

        // If BU constraint is set, but the user has no functional lead access levels defined.
        if setBuConstrain && userAppPrivileges.functionalLeadAccessLevels is () {
            // Deny access because they cannot be scoped to any BU.
            return <http:Forbidden>{
                body: {
                    message: "Insufficient privilege to enable BU filter."
                }
            };
        }

        // [End] Custom Resource level authorization.

        // Getting open promotion cycles from the database.
        database:PromotionCycle[] openedPromotionCycles = check database:getPromotionCyclesByStatus([database:OPEN]);

        // Getting closed promotion cycles from the database.
        database:PromotionCycle[] closedPromotionCycles = check database:getPromotionCyclesByStatus([database:CLOSED]);

        // Initialize a variable to hold the name of the active promotion cycle.
        string activePromotionCycle = "";

        // If there are any open promotion cycles, use the first one as the active cycle.
        if openedPromotionCycles.length() != 0 {
            activePromotionCycle = openedPromotionCycles[0].name;
        }

        if openedPromotionCycles.length() == 0{
            // If there are no open cycles but there are closed ones, fallback to the first closed cycle.
            if closedPromotionCycles.length() != 0 {
                activePromotionCycle = closedPromotionCycles[0].name;
            }
        }



        // Check if the current type is a string and is equal to `INDIVIDUAL_CONTRIBUTOR`.
        if 'type is string && 'type == database:INDIVIDUAL_CONTRIBUTOR {
            // Adjust filters: allow broader access to promotion data for ICs.
            setEmailConstrain = false;
            hideRecommendations = false;
        }

        // Retrieve promotion requests from the database, using various filters and constraints.
        database:PromotionRequest[] PromotionRequestArray = check database:getPromotionRequests(
            employeeEmail = setEmailConstrain ? userInfo.email : employeeEmail,  // Constrain by user email if needed.
            statusArray = statusArray,  // Filter by status.
            cycleID = cycleId,  // Filter by promotion cycle.
            businessAccessLevels = setBuConstrain ? userAppPrivileges.functionalLeadAccessLevels : (),  // BU-level access.
            'type = 'type,  // Type of request (e.g., IC or Manager).
            recommendedBy = recommendedBy // Filter by recommender if provided.
        );

        // Initialize an array to hold the full promotion request data.
        database:FullPromotionRequest[] promotionRequests = [];

        foreach database:PromotionRequest promotionRequest in PromotionRequestArray {

            // Retrieve promotion recommendations for a specific promotion request.
            database:FullPromotionRecommendation[] promotionRecommendationsArray = check database:getFullPromotionRecommendations(
                    promotionRequestId = promotionRequest.id);

            // Hide recommendations if the user is not a HR admin or a promotion board member.
            if hideRecommendations {
                error? updateError = from database:FullPromotionRecommendation recommendation in promotionRecommendationsArray
                    do {
                        recommendation.recommendationStatement = "";
                        recommendation.recommendationAdditionalComment = "";
                    };
                if updateError is error {
                    return error(("Error occurred while data sanitization"));
                }
            }

            // Hide status if the user is not a HR admin or a promotion board member.
            if hideStatus && !(promotionRequest.status == database:SUBMITTED || promotionRequest.status == database:DRAFT) &&
                promotionRequest.promotionCycle == activePromotionCycle && promotionRequest.employeeEmail == userInfo.email {
                promotionRequest.status = database:PROCESSING;
            }

            promotionRequests.push({
                id: promotionRequest.id,
                employeeEmail: promotionRequest.employeeEmail,
                currentJobBand: promotionRequest.currentJobBand,
                currentJobRole: promotionRequest.currentJobRole,
                nextJobBand: promotionRequest.nextJobBand,
                promotionCycle: promotionRequest.promotionCycle,
                promotionStatement: promotionRequest.promotionStatement,
                recommendations: promotionRecommendationsArray,
                businessUnit: promotionRequest.businessUnit,
                department: promotionRequest.department,
                team: promotionRequest.team,
                subTeam: promotionRequest.subTeam,
                promotionType: promotionRequest.promotionType,
                status: promotionRequest.status,
                reasonForRejection: promotionRequest.reasonForRejection,
                isNotificationEmailSent: promotionRequest.isNotificationEmailSent,
                createdBy: promotionRequest.createdBy,
                createdOn: promotionRequest.createdOn,
                updatedBy: promotionRequest.updatedBy,
                updatedOn: promotionRequest.updatedOn
            });
        }

        return {promotionRequests};
    }
}
