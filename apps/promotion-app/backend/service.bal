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
import promotion_app.email;
import promotion_app.gsheet;
import promotion_app.people;

import ballerina/cache;
import ballerina/http;
import ballerina/log;
import ballerina/lang.regexp;
import ballerina/time;

public configurable AppConfig appConfig = ?;

final cache:Cache cache = new ({
    capacity: 2000,
    defaultMaxAge: 1800.0,
    cleanupInterval: 900.0
});

@display {
    label: "Promotion Backend Service",
    id: "people-ops-suite/promotion-backend"
}


service http:InterceptableService / on new http:Listener(9090) {

    # Request interceptor.
    #
    # + return - authorization:JwtInterceptor
    public function createInterceptors() returns http:Interceptor[] =>
        [new authorization:JwtInterceptor()];

    # Retrieve application configurations.
    #
    # + return - Application configuration object or error
    resource function get app\-config() returns AppConfig => appConfig;

    resource function get user\-info(http:RequestContext ctx) returns UserInfoResponse|http:InternalServerError {
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(USER_INFORMATION_HEADER_NOT_FOUND);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        if cache.hasKey(userInfo.email) {
            UserInfoResponse|error cachedUserInfo = cache.get(userInfo.email).ensureType();
            if cachedUserInfo is UserInfoResponse {
                return cachedUserInfo;
            }
        }

        people:EmployeeBasicInfo|error loggedInUser = people:fetchEmployeesBasicInfo(userInfo.email);
        if loggedInUser is error {
            string customError = string `Error occurred while retrieving user data: ${userInfo.email}!`;
            log:printError(customError, loggedInUser);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        people:EmployeeHistory|error employeeData = people:fetchEmployeeHistory(userInfo.email);
        if employeeData is error {
            log:printError(string `Error occurred while retrieving employee history: ${userInfo.email}!`, employeeData);
            return {
                body: {
                    message: "Error occurred while retrieving employee history!"
                }
            };
        }

        int[] privileges = [];
        if authorization:checkPermissions([authorization:authorizedRoles.EMPLOYEE_ROLE], userInfo.groups) {
            privileges.push(authorization:EMPLOYEE_PRIVILEGE);
        }
        if authorization:checkPermissions([authorization:authorizedRoles.LEAD_ROLE], userInfo.groups) {
            privileges.push(authorization:LEAD_PRIVILEGE);
        }
        if authorization:checkPermissions([authorization:authorizedRoles.FUNCTIONAL_LEAD], userInfo.groups) {
            privileges.push(authorization:FUNCTIONAL_LEAD_PRIVILEGE);
        }
        if authorization:checkPermissions([authorization:authorizedRoles.PROMOTION_BOARD_MEMBER], userInfo.groups) {
            privileges.push(authorization:PROMOTION_BOARD_PRIVILEGE);
        }
        if authorization:checkPermissions([authorization:authorizedRoles.HR_ADMIN], userInfo.groups) {
            privileges.push(authorization:HR_ADMIN_PRIVILEGE);
        }

        UserInfoResponse userInfoResponse = {
            employeeId: loggedInUser.employeeId,
            workEmail: loggedInUser.workEmail,
            firstName: loggedInUser.firstName,
            lastName: loggedInUser.lastName,
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

    # Retrieve promotion cycles by status.
    #
    # + statusArray - Array of status to filter the promotion cycles
    # + return - Promotion Cycle or error
    resource function GET promotion/cycles(database:PromotionCyclesStatus[]? statusArray) 
        returns PromotionCycles|http:InternalServerError {

        database:PromotionCycle[]|error promotionCycles = database:getPromotionCyclesByStatus(statusArray);

        if promotionCycles is error {
            string customError = string `Error while retrieving promotion cycles!`;
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return {promotionCycles};
    }

    # Check whether the specific employee is eligible for the promotion.
    #
    # + ctx - Request Context 
    # + return - Employees list or error
    resource function GET employees(http:RequestContext ctx, boolean? filterLeads, string? managerEmail, string? additionalManagerEmail)
        returns Employees|http:Forbidden|http:InternalServerError {

        // Check if the employees are already cached.
        if cache.hasKey(EMPLOYEES_CACHE_KEY) {
            people:EmployeeInfo[]|error cachedEmployees = cache.get(EMPLOYEES_CACHE_KEY).ensureType();
            if cachedEmployees is people:EmployeeInfo[] {
                return {
                    employees: cachedEmployees
                };
            }
        }

        // "HEADER_USER_INFO" is the email of the user access this resource.
        // Interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);

        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if filterLeads is boolean && filterLeads == false {
            authorization:UserAppPrivilege|error userAppPrivileges = authorization:getUserPrivileges(userInfo.email);

            if userAppPrivileges is error {
                return <http:InternalServerError>{
                    body: {
                        message: "Error occurred while retrieving User Privileges!"
                    }
                };
            }

            if !database:checkRoles([database:LEAD], userAppPrivileges.roles) {
                return <http:Forbidden>{
                    body: {
                        message: "Insufficient privileges!"
                    }
                };
            }
        }

        // Get all Employees.
        people:EmployeeInfo[]|error employees = people:getEmployees(
            filterLeads = filterLeads,
            managerEmail = managerEmail,
            additionalManagerEmail = additionalManagerEmail
        );

        if employees is error {
            string customError = (filterLeads is boolean && filterLeads == true) ? "Error while retrieving lead list!" : "Error while retrieving employee list!";
            log:printError(customError, employees);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        employees = from var employee in employees
            order by employee.workEmail.toLowerAscii() ascending
            select employee;

        if employees is error {
            string customError = string `Error occurred while retrieving employees!`;
            log:printError(customError, employees);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        error? cacheError = cache.put(EMPLOYEES_CACHE_KEY, employees);
        if cacheError is error {
            log:printError("An error occurred while writing employees to the cache", cacheError);
        }

        return {
            employees: employees
        };
    }

    # Retrieve list of  active business units
    #
    # + ctx - Request Context 
    # + return - Internal Server Error or Business units list object
    resource function GET business\-units(http:RequestContext ctx)
        returns BusinessUnits|http:InternalServerError|http:Unauthorized|error {

        // "RequestedBy" is the email of the user access this resource
        // Interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(USER_INFORMATION_HEADER_NOT_FOUND);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        // [Start] Resource level authorization 
         authorization:UserAppPrivilege|error userAppPrivileges = authorization:getUserPrivileges(userInfo.email);

        if userAppPrivileges is error {
            return <http:InternalServerError>{
                body: {
                    message: "Error occurred while retrieving User Privileges!"
                }
            };
        }

        // Only the HR Admin can retrieve the BU list
        if !(database:checkRoles([database:HR_ADMIN], userAppPrivileges.roles)) {

            return <http:Unauthorized>{
                body: {
                    message: "You are not authorized to access Business Units."
                }
            };
        }

        database:BusinessUnit[]|error businessUnits = database:getBusinessUnitMapping();

        if businessUnits is error {
            return <http:InternalServerError>{
                body: {
                    message: "Error occurred while retrieving Business Unit Mapping!"
                }
            };
        }

        return {businessUnits};
    }

    # Get employee joined deatails.
    #
    # + ctx - Request Context er Description  
    # + employeeWorkEmail - employee email
    # + return - Internal Server Error or Unauthorized Error or Employee info object
    resource function GET employee/history(http:RequestContext ctx, string employeeWorkEmail)
        returns EmployeeJoinedDetails|http:InternalServerError|http:Forbidden {

        // "RequestedBy" is the email of the user access this resource
        // Interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(USER_INFORMATION_HEADER_NOT_FOUND);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        if userInfo.email != employeeWorkEmail {
            authorization:UserAppPrivilege|error userAppPrivileges = authorization:getUserPrivileges(userInfo.email);
            if userAppPrivileges is error {
                string customError =  "Error while retrieving user App Privileges!";
                log:printError(customError);
                return <http:InternalServerError>{
                    body:  {
                        message: customError
                    }
                };
            }
            if !database:checkRoles([database:LEAD], userAppPrivileges.roles) {
                return <http:Forbidden>{
                    body: {
                        message: "Insufficient privileges!"
                    }
                };
            }
        }

        //Get employee History.
        people:EmployeeHistory|error employeeData = people:fetchEmployeeHistory(employeeWorkEmail);

        if employeeData is error {
            string customError = string `Error while retrieving Employee Data!`;
            log:printError(customError, employeeData);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if employeeData.managerEmail == "" {
            string customError = string `Reporting lead email is not available!`;
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        
        string reportingLead = employeeData.managerEmail ?: "";

        EmployeeJoinedDetails employeeInfoWithLead = {
            workEmail: employeeData.workEmail,
            startDate: employeeData.startDate,
            jobBand: employeeData.jobBand,
            joinedJobRole: employeeData.joinedJobRole,
            joinedBusinessUnit: employeeData.joinedBusinessUnit,
            joinedDepartment: employeeData.joinedDepartment,
            joinedTeam: employeeData.joinedTeam,
            joinedLocation: employeeData.joinedLocation,
            lastPromotedDate: employeeData.lastPromotedDate,
            employeeThumbnail: employeeData.employeeThumbnail,
            reportingLead: reportingLead
        };
        return employeeInfoWithLead;
    }

    # Retrieve specific users' promotion requests for given criteria.
    # 
    # + statusArray - Status of the promotion request
    # + return - Promotion request array or error
    resource function GET promotions(http:RequestContext ctx, string[]? statusArray, 
            string? employeeEmail,  int? cycleId, string? recommendedBy, boolean? enableBuFilter, string? 'type)
        returns Promotions|http:Forbidden|http:InternalServerError {

        // if there is a status array.
        if statusArray !is null {
            // Verifying the status of the promotion request.
            foreach string status in statusArray {
                if status !is database:PromotionRequestStatus {
                    return <http:InternalServerError>{
                        body: {
                            message: "Invalid promotion request status provided!"
                        }
                    };
                }
            }
        }

        // "HEADER_USER_INFO" is the email of the user access this resource.
        // Interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(USER_INFORMATION_HEADER_NOT_FOUND);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        // Data sanitization
        boolean hideRecommendations = false;
        boolean hideStatus = false;

        // [Start] Custom Resource level authorization 
        boolean setEmailConstrain = false;
        boolean setBuConstrain = false; // use to set BU constrain

        authorization:UserAppPrivilege|error userAppPrivileges = authorization:getUserPrivileges(userInfo.email);

        if userAppPrivileges is error {
            return <http:InternalServerError>{
                body: {
                    message: "Error occurred while retrieving User Privileges!"
                }
            };
        }

        if !(database:checkRoles([database:HR_ADMIN], userAppPrivileges.roles) ||
            database:checkRoles([database:FUNCTIONAL_LEAD], userAppPrivileges.roles) ||
            database:checkRoles([database:PROMOTION_BOARD_MEMBER], userAppPrivileges.roles)) {

            hideRecommendations = true;

            // Employees and leads cannot see their own promotion request status while cycle is ended.
            hideStatus = true;

            if employeeEmail !is () && userInfo.email != employeeEmail {
                people:Employee|error employeeResult = people:getEmployee(workEmail = employeeEmail);
                if employeeResult is error {
                    return <http:InternalServerError>{
                        body: {
                            message: "Error occurred while retrieving Employee!"
                        }
                    };
                }
                if employeeResult.managerEmail != userInfo.email {
                    string[] reportsToEmails = regexp:split(re `,`, employeeResult.reportsTo ?: "");
                    reportsToEmails = from var email in reportsToEmails
                        select email.trim();

                    if reportsToEmails.indexOf(userInfo.email) == () {
                        log:printError("Unauthorized access attempt by " + userInfo.email);
                        return <http:Forbidden>{
                            body: {
                                message: "Insufficient privilege to access promotion application of others."
                            }
                        };
                    }
                }
            } else {
                setEmailConstrain = true;
            }

        } else if !(database:checkRoles([database:HR_ADMIN], userAppPrivileges.roles) ||
            database:checkRoles([database:PROMOTION_BOARD_MEMBER], userAppPrivileges.roles)) &&
            database:checkRoles([database:FUNCTIONAL_LEAD], userAppPrivileges.roles) {

            // functional lead cannot access others BU requests. 
            setBuConstrain = true;
        } else {
            // for function lead 
            setBuConstrain = enableBuFilter is boolean ? enableBuFilter : false;
        }

        // validating functional lead permission 
        if setBuConstrain && userAppPrivileges.functionalLeadAccessLevels is () {
            return <http:Forbidden>{
                body: {
                    message: "Insufficient privilege to enable BU filter."
                }
            };
        }

        // Getting active promotion cycle.
        database:PromotionCycle[]|error promotionCycles = database:getPromotionCyclesByStatus([database:OPEN]);

        if promotionCycles is error {
            string customError = string `Error while retrieving Promotion Cycle!`;
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if promotionCycles.length() == 0 {
            string customError = "There is no open promotion cycle for applying!";
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if 'type is string && 'type == database:INDIVIDUAL_CONTRIBUTOR {
            setEmailConstrain = false;
            hideRecommendations = false;
        }

        // Retrieve promotion requests from the database, using various filters and constraints.
        database:Promotion[]|error PromotionArray = database:getPromotions(
            employeeEmail = setEmailConstrain ? userInfo.email : employeeEmail,
            statusArray = statusArray,
            cycleID = cycleId,
            businessAccessLevels = setBuConstrain ? userAppPrivileges.functionalLeadAccessLevels : (),
            recommendedBy = recommendedBy,
            'type ='type
        );

        if PromotionArray is error {
            string customError = string `Error while retrieving promotions!`;
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        // Initialize an array to hold the full promotion request data.
        database:FullPromotion[] promotions = [];

        foreach database:Promotion promotionRequest in PromotionArray {

            // Retrieve promotion recommendations for a specific promotion request.
            database:FullPromotionRecommendation[]|error promotionRecommendationsArray = database:getRecommendations(
                    promotionRequestId = promotionRequest.id);

            if promotionRecommendationsArray is error {
                string customError = string `Error while retrieving Promotion Recommendations!`;
                log:printError(customError, promotionRecommendationsArray);
                return <http:InternalServerError>{
                    body: {
                        message: customError
                    }
                };
            }
            if hideRecommendations {
                error? updateError = from database:FullPromotionRecommendation recommendation in promotionRecommendationsArray
                    do {
                        recommendation.recommendationStatement = "";
                        recommendation.recommendationAdditionalComment = "";
                    };
                if updateError is error {
                    string customError = string `Error occurred while data sanitization`;
                    log:printError(customError, updateError);
                    return <http:InternalServerError>{
                        body: {
                            message: customError
                        }
                    };
                }
            }
            // Hide status if the user is not a HR admin or a promotion board member
            if hideStatus && !(promotionRequest.status == database:SUBMITTED || promotionRequest.status == database:DRAFT) &&
                promotionRequest.promotionCycle == promotionCycles[0].name && promotionRequest.employeeEmail == userInfo.email {
                promotionRequest.status = database:PROCESSING;
            }

            promotions.push({
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

        Promotions promortionRes = {
            promotionRequests: promotions
        };
        return promortionRes;
    }

    # Draft new promotion request.
    #
    # + ctx - Request Context appended from the interceptor  
    # + application - Application data
    # + return - Internal Server Error or Forbidden or Apply Promotion Service Results
    resource function POST promotions(http:RequestContext ctx, @http:Payload Application application)
        returns ApplicationInfo|http:BadRequest|http:Forbidden|http:InternalServerError {

        // "HEADER_USER_INFO" is the email of the user access this resource.
        // Interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);

        if userInfo is error {
            log:printError(USER_INFORMATION_HEADER_NOT_FOUND);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        authorization:UserAppPrivilege|error userAppPrivileges = authorization:getUserPrivileges(userInfo.email);

        if userAppPrivileges is error {
            return <http:InternalServerError>{
                body: {
                    message: "Error occurred while retrieving User Privileges!"
                }
            };
        }

        if !database:checkRoles([database:LEAD], userAppPrivileges.roles) {
            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }
        
        // [Special Promotion Request] leads can create promotion requests for others.
        if userInfo.email != application.employeeEmail {
            string customError = "Insufficient privilege to create promotion application for others.";
            log:printError(customError);
            return <http:Forbidden>{
                body: {
                    message: customError
                }
            };
        }

        people:Employee|error employeeData = people:getEmployee(workEmail = application.employeeEmail);

        if employeeData is error {
            string customError = string `Error while retrieving employees!`;
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        // Job band conversion to int.
        int? currentJobBand = employeeData.jobBand;
        if currentJobBand is () {
            string customError = "Invalid Job Band for " + userInfo.email + ".";
            log:printError(customError, currentJobBand);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        // Getting active promotion cycle.
        database:PromotionCycle[]|error promotionCycles = database:getPromotionCyclesByStatus([database:OPEN]);

        if promotionCycles is error {
            string customError = string `Error while retrieving Promotion Cycle!`;
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if promotionCycles.length() == 0 {
            string customError = "There is no open promotion cycle for applying!";
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        string leadDeadline = promotionCycles[0].leadDeadline;

        string|error ctxUserTimezoneOffset = ctx.getWithType(USER_TIMEZONE_OFFSET);

        if ctxUserTimezoneOffset is error {
            return <http:InternalServerError>{
                body: {
                    message: "An error occurred while retrieving time zone offset header."
                }
            };
        }

        decimal|error userTimezoneOffset = decimal:fromString(ctxUserTimezoneOffset);

        if userTimezoneOffset is error {
            return <http:InternalServerError>{
                body: {
                    message: "An error occurred while converting time zone offset header."
                }
            };
        }

        if userTimezoneOffset < -12.0d || userTimezoneOffset > 14.0d {
            return <http:BadRequest>{
                body: {
                    message: "Invalid timezone offset."
                }
            };
        }

        boolean|error isLeadDeadlinePast = isFutureDate(leadDeadline, userTimezoneOffset);

        if isLeadDeadlinePast is error {
            return <http:InternalServerError>{
                body: {
                    message: "An error occurred while checking deadline."
                }
            };
        }

        if (!isLeadDeadlinePast && !database:checkRoles([database:HR_ADMIN], userAppPrivileges.roles)) {
            return <http:Forbidden>{
                body: {
                    message: "The Lead deadline has passed."
                }
            };
        }

        int activePromotionCycleId = promotionCycles[0].id;

        if activePromotionCycleId != application.PromotionCycleID {
            string customError = "Invalid promotion cycle id!";
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        // For promotion application insert payload.
        database:PromotionRequestDbInsertPayload promotionApplication;

        // For promotion recommendation payload.
        database:PromotionRecommendationInsertPayload promotionRecommendation;

        // Duplicate promotion request check.
        boolean|error isDuplicatePromotionRequest = database:isDuplicatePromotionRequest(employeeEmail = application.employeeEmail,
                promotionCycleId = application.PromotionCycleID);

        if isDuplicatePromotionRequest is error {
            string customError = string `Error while cheking DuplicatePromotionRequest`;
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        // Check if there are any existing promotion requests for the same promotion cycle.
        if isDuplicatePromotionRequest {
            string customError = "Promotion request could not be inserted, duplicate promotion request found!";
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if application.'type == database:INDIVIDUAL_CONTRIBUTOR {
            // For SPECIAL promotion application.
            // Checking if the requested job band is valid.
            if application.promotingJobBand is () || application.promotingJobBand <= currentJobBand {
                string customError = "Invalid promoting job band!";
                log:printError(customError);
                return <http:InternalServerError>{
                    body: {
                        message: customError
                    }
                };
            }

            if application.employeeEmail == userInfo.email {
                string customError = "You can't apply for a individual contributor promotion for yourself!";
                log:printError(customError);
                return <http:InternalServerError>{
                    body: {
                        message: customError
                    }
                };
            }

            // Setting promotion application payload.
            promotionApplication = {
                employeeEmail: application.employeeEmail,
                currentJobBand: currentJobBand,
                requestedJobBand: application.promotingJobBand ?: 0,
                promotionType: database:INDIVIDUAL_CONTRIBUTOR,
                status: database:checkRoles([database:FUNCTIONAL_LEAD], userAppPrivileges.roles) ? database:FL_APPROVED : database:SUBMITTED,
                promotionCycleId: activePromotionCycleId,
                businessUnit: employeeData.businessUnit,
                department: employeeData.department,
                team: employeeData.team,
                subTeam: employeeData.subTeam,
                jobRole: employeeData.jobRole,
                createdBy: userInfo.email
            };

            int|error applicationID;
            int|error lastInsertId;

            transaction {
                applicationID =  database:insertPromotionRequest(payload = promotionApplication);

                if applicationID is int {
                    // Setting promotion recommendation payload.
                    promotionRecommendation = {
                        promotionRequestID: applicationID,
                        leadEmail: userInfo.email,
                        isReportingLead: (employeeData.managerEmail ?: "") === userInfo.email,
                        statement: application.statement,
                        comment: application.comment,
                        status: database:SUBMITTED,
                        createdBy: userInfo.email
                    };

                    lastInsertId = database:insertPromotionRecommendation(promotionRecommendation);

                    if lastInsertId is error {
                        rollback;
                        string customError = string `Error while inserting Promotion Recommendation!`;
                        log:printError(customError);
                        return <http:InternalServerError>{
                            body: {
                                message: customError
                            }
                        };
                    } else {
                        check commit;
                    }
                } else {
                    rollback;
                    string customError = string `Error while inserting Promotion Request!`;
                    log:printError(customError);
                    return <http:InternalServerError>{
                        body: {
                            message: customError
                        }
                    };
                }
            } on fail error err {
                return <http:InternalServerError>{
                    body: {
                        message: err.toString()
                    }
                };
            }

            if applicationID is error {
                string customError = string `Error while inserting Promotion Request!`;
                log:printError(customError);
                return <http:InternalServerError>{
                    body: {
                        message: customError
                    }
                };
            }

            return <ApplicationInfo>{applicationID};

        } else {
            string customError = string `Invalid promotion type!`;
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

    }

    # Initiates time-based promotions.
    #
    # + ctx - Request Context  
    # + return - Internal Server Error or business unit sync results results
    resource function POST promotion/requests/time\-based(http:RequestContext ctx, TimeBasedPromotionPayload payload)
        returns ProcessStatus|http:InternalServerError|error|http:Forbidden {

        // "HEADER_USER_INFO" is the email of the user access this resource.
        // Interceptor set this value ater validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);

        if userInfo is error {
            log:printError(USER_INFORMATION_HEADER_NOT_FOUND);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        // [Start] Custom Resource level authorization 
         authorization:UserAppPrivilege|error userAppPrivileges = authorization:getUserPrivileges(userInfo.email);

        if userAppPrivileges is error {
            return <http:InternalServerError>{
                body: {
                    message: "Error occurred while retrieving User Privileges!"
                }
            };
        }

        if !database:checkRoles([database:HR_ADMIN], userAppPrivileges.roles) {
            return <http:Forbidden>{
                body:  {
                    message: "Insufficient privileges!"
                }
            };
        }
        // [End] Custom Resource level authorization

        // Check the current status of the process
        database:Config[]|error configs = database:getConfigs(key = TIME_BASED_PROMOTION_KEY);

        if configs is error {
            string customError = "An error occurred while retrieving the app configs!";
            log:printError(customError, configs);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        // When multiple or no process config is returned, it is an error
        if configs.length() != 1 {
            return error("We were not able to retrieve the Time-based promotion status. Please contact app support!");
        }

        database:PromotionCycle[]|error promotionCycles = database:getPromotionCyclesByStatus([database:OPEN]);

        if promotionCycles is error {
            string customError = "Error while retrieving Promotion Cycles!";
            log:printError(customError, promotionCycles);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        
        if promotionCycles.length() == 0 {
            string customError = "There is no open promotion cycle!";
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        //Retrieve the list of eligible employees from google sheet and process
        (int|string|decimal)[][]|error sheetData = gsheet:getSheetData(check payload.sheet.ensureType());
        if sheetData is error {
            string customError = "Error occurred while accessing the google sheet";
            log:printError(customError, sheetData);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        // Check whether the process is already running
        database:Config config = configs[0];
        if config.value == database:IN_PROGRESS {
            string customError = "Process is already running!";
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        // Thread to run sync process in background
        worker syncWorker returns http:InternalServerError|error? {
            database:PromotionCycle[]|error promotionCycles = database:getPromotionCyclesByStatus([database:OPEN]);

            if promotionCycles is error {
                string customError = "Error while retrieving Promotion Cycles!";
                log:printError(customError, promotionCycles);
                return <http:InternalServerError>{
                    body: {
                        message: customError
                    }
                };
            }

            if promotionCycles.length() == 0 {
                string customError = "There is no open promotion cycle!";
                log:printError(customError);
                return <http:InternalServerError>{
                    body: {
                        message: customError
                    }
                };
            }
            log:printInfo(string `The process of creating time-based promotions for ${
                    promotionCycles[0].name} has started in the background...`);

            string|error sheetType = payload.sheet.ensureType();

            if sheetType is error {
                string customError = "Error while retrieving ensure type of the sheet!";
                log:printError(customError);
                return <http:InternalServerError>{
                    body: {
                        message: customError
                    }
                };
            }

            //Create automatic promotion requests for jb 5 to 6
        error? result = createAutomaticPromotionRequests(promotionCycles[0].id, sheetType);
            if result is error {
                string customError = "Error while retrieving creating promotions!";
                log:printError(customError, result);
                return <http:InternalServerError>{
                    body: {
                        message: customError
                    }
                };
            }
            log:printInfo("The process of creating time-based promotions has successfully completed");
        }

        return {status: "Successfully started the TIME-BASED promotion process!"};
    }

    # Retrieve specific users' promotion recommendations.
    #
    # + ctx - Request Context appended from the interceptor
    # + leadEmail - Email of the lead  
    # + statusArray - Status of the promotion recommendation  
    # + promotionCycleId - Promotion cycle ID
    # + return - Internal Server Error or Promotion Recommendations array
    resource function GET promotion/recommendations(http:RequestContext ctx, string? leadEmail, string[]? statusArray,
            int? promotionCycleId) returns FullPromotionRecommendation[]|http:InternalServerError|http:Forbidden {

        // "HEADER_USER_INFO" is the email of the user access this resource.
        // Interceptor set this value ater validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);

        if userInfo is error {
            log:printError(USER_INFORMATION_HEADER_NOT_FOUND);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        authorization:UserAppPrivilege|error userAppPrivileges = authorization:getUserPrivileges(userInfo.email);

        if userAppPrivileges is error {
            string customError = "Error occurred while retrieving User Privileges!";
            log:printError(customError, userAppPrivileges);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        boolean setEmailConstrain = false;
        if !(database:checkRoles([database:HR_ADMIN], userAppPrivileges.roles) ||
            database:checkRoles([database:FUNCTIONAL_LEAD], userAppPrivileges.roles) ||
            database:checkRoles([database:PROMOTION_BOARD_MEMBER], userAppPrivileges.roles)) {

            if !database:checkRoles([database:LEAD], userAppPrivileges.roles) || leadEmail !is () && userInfo.email != leadEmail {
                string customError = "Insufficient privilege to access the recommendations.";
                log:printError(customError);
                return <http:Forbidden>{
                    body: {
                        message: customError
                    }
                };
            } else {
                setEmailConstrain = true;
            }
        }

        if statusArray !is null {
            foreach string status in statusArray {
                if status !is database:PromotionRecommendationStatus {
                    string customError = "Invalid promotion recommendation status provided!";
                    log:printError(customError);
                    return <http:InternalServerError>{
                        body: {
                            message: customError
                        }
                    };
                }
            }
        }

        database:FullPromotionRecommendation[]|error recommendationsArray = database:getFullPromotionRecommendations(
                employeeEmail = (),
                leadEmail = setEmailConstrain ? userInfo.email : leadEmail,
                statusArray = statusArray,
                cycleID = promotionCycleId);
        
        if recommendationsArray is error {
            string customError = "Error occurred while retrieving Recommendations!";
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        FullPromotionRecommendation[] recommendations = [];

        // Adding employee name to recommendation
        error? queryError = from database:FullPromotionRecommendation recommendation in recommendationsArray
            do {
                people:EmployeeName|error employeeName = people:getEmployeeName(recommendation.employeeEmail);
                if employeeName is error {
                    string customError = "Error occurred while retrieving Employee Name!";
                    log:printError(customError, employeeName);
                    return <http:InternalServerError>{
                        body: {
                            message: customError
                        }
                    };
                }
                recommendations.push({
                    ...recommendation,
                    employeeName: employeeName.firstName + " " + employeeName.lastName
                });
            };

        if queryError is error {
            string customError = "An error occurred while processing promotion recommendations!";
            log:printError(customError, queryError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return recommendations;
    }

    # Update Recommendation data.
    #
    # + ctx - Request Context appended from the interceptor 
    # + payload - Recommendation update payload
    # + return - Internal Server Error or recommendation update results
    resource function patch promotion/recommendations(http:RequestContext ctx,
            @http:Payload RecommendationUpdateData payload)
        returns RecommendationStatus|http:Forbidden|http:InternalServerError|http:BadRequest {

        // "HEADER_USER_INFO" is the email of the user access this resource.
        // Interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);

        if userInfo is error {
            log:printError(USER_INFORMATION_HEADER_NOT_FOUND);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        authorization:UserAppPrivilege|error userAppPrivileges = authorization:getUserPrivileges(userInfo.email);

        if userAppPrivileges is error {
            string customError = "Error occurred while retrieving User Privileges!";
            log:printError(customError, userAppPrivileges);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        // Getting active promotion cycle
        database:PromotionCycle[]|error promotionCycles = database:getPromotionCyclesByStatus([database:OPEN]);

        if promotionCycles is error {
            string customError = "Error while retrieving Promotion Cycles!";
            log:printError(customError, promotionCycles);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        
        if promotionCycles.length() == 0 {
            string customError = "There is no open promotion cycle!";
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        string leadDeadline = promotionCycles[0].leadDeadline;

        string|error ctxUserTimezoneOffset = ctx.getWithType(USER_TIMEZONE_OFFSET);

        if ctxUserTimezoneOffset is error {
            return <http:InternalServerError>{
                body: {
                    message: "An error occurred while retrieving time zone offset header."
                }
            };
        }

        decimal|error userTimezoneOffset = decimal:fromString(ctxUserTimezoneOffset);

        if userTimezoneOffset is error {
            return <http:InternalServerError>{
                body: {
                    message: "An error occurred while converting time zone offset header."
                }
            };
        }

        if userTimezoneOffset < -12.0d || userTimezoneOffset > 14.0d {
            return <http:BadRequest>{
                body: {
                    message: "Invalid timezone offset."
                }
            };
        }

        boolean|error isLeadDeadlinePast = isFutureDate(leadDeadline, userTimezoneOffset);

        if isLeadDeadlinePast is error {
            return <http:InternalServerError>{
                body: {
                    message: "An error occurred while checking deadline."
                }
            };
        }

        if (!isLeadDeadlinePast && !database:checkRoles([database:HR_ADMIN], userAppPrivileges.roles)) {
            return <http:Forbidden>{
                body: {
                    message: "The Lead deadline has passed."
                }
            };
        }

        database:FullPromotionRecommendation[]|error recommendationsArray = database:getFullPromotionRecommendations(
                id = payload.id);

        if recommendationsArray is error {
            string customError =  "Error while retrieving Recommendations Array!";
            log:printError(customError, recommendationsArray);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if recommendationsArray.length() == 0 {
            string customError = "Promotion recommendation is not found!";
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        database:FullPromotionRecommendation recommendation = recommendationsArray[0];

        if recommendation.leadEmail != userInfo.email && !database:checkRoles([database:HR_ADMIN], userAppPrivileges.roles){
            string customError = "Insufficient privilege to access the recommendation!";
            log:printError(customError);
            return <http:Forbidden>{
                body: {
                    message: customError
                }
            };
        }

        if recommendation.recommendationStatus != database:REQUESTED && !database:checkRoles([database:HR_ADMIN], userAppPrivileges.roles) {
            string customError = "Promotion recommendation is not in editable state!";
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if recommendation.promotionCycleId != promotionCycles[0].id {
            string customError = "Recommendation does not belongs to current promotion cycle!";
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        error? updateRecommendation = database:updatePromotionRecommendation({
            id: payload.id,
            statement: payload.statement,
            comments: payload.comment,
            updatedBy: userInfo.email,
            expectedStatus: (),
            expectedCycleId: promotionCycles[0].id
        });

        if updateRecommendation is error {
            string customError = "Error while Updating the Recommendation!";
            log:printError(customError, updateRecommendation);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return {
            status: "Successfully updated the recommendation."
        };
    }

    # Submit promotion recommendation.
    #
    # + id - Id of the recommendation  
    # + ctx - Request Context appended from the interceptor
    # + return - Internal Server Error or recommendation submit results
    resource function get promotion/recommendations/[int id]/submit(http:RequestContext ctx)
            returns RecommendationStatus|http:Forbidden|http:NotFound|http:InternalServerError|http:BadRequest {

        // "HEADER_USER_INFO" is the email of the user access this resource.
        // Interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);

        if userInfo is error {
            log:printError(USER_INFORMATION_HEADER_NOT_FOUND);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        /// Getting active promotion cycle
        database:PromotionCycle[]|error promotionCycles = database:getPromotionCyclesByStatus([database:OPEN]);
        if promotionCycles is error {
            string customError = "Error while retrieving Promotion Cycles!";
            log:printError(customError, promotionCycles);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if promotionCycles.length() == 0 {
            string customError = "There is no open promotion cycle!";
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        string leadDeadline = promotionCycles[0].leadDeadline;

        string|error ctxUserTimezoneOffset = ctx.getWithType(USER_TIMEZONE_OFFSET);

        if ctxUserTimezoneOffset is error {
            return <http:InternalServerError>{
                body: {
                    message: "An error occurred while retrieving time zone offset header."
                }
            };
        }

        decimal|error userTimezoneOffset = decimal:fromString(ctxUserTimezoneOffset);

        if userTimezoneOffset is error {
            return <http:InternalServerError>{
                body: {
                    message: "An error occurred while converting time zone offset header."
                }
            };
        }

        if userTimezoneOffset < -12.0d || userTimezoneOffset > 14.0d {
            return <http:BadRequest>{
                body: {
                    message: "Invalid timezone offset."
                }
            };
        }

        boolean|error isLeadDeadlinePast = isFutureDate(leadDeadline, userTimezoneOffset);

        if isLeadDeadlinePast is error {
            return <http:InternalServerError>{
                body: {
                    message: "An error occurred while checking deadline."
                }
            };
        }

        if (!isLeadDeadlinePast) {
            return <http:Forbidden>{
                body: {
                    message: "The Lead deadline has passed."
                }
            };
        }

        database:FullPromotionRecommendation[]|error recommendationsArray = database:getFullPromotionRecommendations(
                id = id);
        
        if recommendationsArray is error {
            string customError = "Error while retrieving Recommendations Array!";
            log:printError(customError, recommendationsArray);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if recommendationsArray.length() == 0 {
            string customError = string `Promotion recommendation is not found!`;
            log:printError(customError);
            return <http:NotFound>{
                body: {
                    message: customError
                }
            };
        }

        database:FullPromotionRecommendation recommendation = recommendationsArray[0];

        if recommendation.leadEmail != userInfo.email {
            string customError = "Insufficient privilege to access the recommendation.";
            log:printError(customError);
            return <http:Forbidden>{
                body: {
                    message: customError
                }
            };
        }

        if recommendation.recommendationStatus != database:REQUESTED {
            string customError = "Promotion recommendation is not in editable state!";
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if recommendation.promotionCycleId != promotionCycles[0].id {
            string customError = "Recommendation does not belongs to current promotion cycle!";
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        transaction {
            error? updateRecommendation = database:updatePromotionRecommendation({
                id: id,
                status: database:SUBMITTED,
                updatedBy: userInfo.email,
                expectedStatus: database:REQUESTED,
                expectedCycleId: promotionCycles[0].id
            });
            if updateRecommendation is error {
                rollback;
                string customError = "Error while Updating the Recommendation!";
                log:printError(customError, updateRecommendation);
                return <http:InternalServerError>{
                    body: {
                        message: customError
                    }
                };
            }else{
                //get name by work email for send the email
                people:EmployeeName|error leadName = people:getEmployeeName(workEmail = userInfo.email);
        
                if leadName is error{
                    rollback;
                    string customError = "Error while retrieving Lead Name!";
                    log:printError(customError, leadName);
                    return <http:InternalServerError>{
                        body: {
                            message: customError
                        }
                    };
                }else{
                    //get employee name by work email for send the email
                    people:EmployeeName|error employeeName = people:getEmployeeName(workEmail = recommendation.employeeEmail);

                    if employeeName is error{
                        rollback;
                        string customError = "Error while retrieving Employee Name!";
                        log:printError(customError, employeeName);
                        return <http:InternalServerError>{
                            body: {
                                message: customError
                            }
                        };
                    }else{
                        if recommendation.promotionType == database:TIME_BASED {
                            database:PromotionRequestStatus approvedStatus = database:SUBMITTED;
                            //if login user is a functional lead -> approve
                            authorization:UserAppPrivilege|error userAppPrivileges = authorization:getUserPrivileges(userInfo.email);

                            if userAppPrivileges is error {
                                rollback;
                                string customError = "Error occurred while retrieving User Privileges!";
                                log:printError(customError, userAppPrivileges);
                                return <http:InternalServerError>{
                                    body: {
                                        message: customError
                                    }
                                };
                            }else{
                                if (database:checkRoles([database:FUNCTIONAL_LEAD], userAppPrivileges.roles)) {
                                    approvedStatus = database:APPROVED;
                                }
                                //Submit promotion request
                                error? updateRequest = database:updatePromotionRequest({
                                    id: recommendation.requestId,
                                    status: approvedStatus,
                                    updatedBy: userInfo.email
                                });

                                if updateRequest is error {
                                    rollback;
                                    string customError = string `Error while Updating the Promotion Request!`;
                                    log:printError(customError, updateRequest);
                                    return <http:InternalServerError>{
                                        body: {
                                            message: customError
                                        }
                                    };
                                }else{
                                    check commit;
                                    return {
                                        status: "Successfully approved the Time-based promotion."
                                    };
                                }
                            }
                        }else{
                            error? recommendationAlert = email:recommendationAlert({
                                receiverName: employeeName.firstName,
                                receiverEmail: recommendation.employeeEmail,
                                senderName: leadName.firstName + " " + leadName.lastName,
                                senderEmail: userInfo.email,
                                closingDate: promotionCycles[0].endDate,
                                templateId: email:hrisPromotionRecommendationRequestSubmission
                            });

                            if recommendationAlert is error {
                                rollback;
                                string customError = string `An error occurred during sending the promotion recommendation alert!`;
                                log:printError(customError, recommendationAlert);
                                return <http:InternalServerError>{
                                    body: {
                                        message: customError
                                    }
                                };
                            }else{
                                check commit;
                                string timestamp = time:utcToString(time:utcNow()).substring(0, 19);
                                log:printInfo("Recommendation Alert sent at " + timestamp);
                                return {
                                    status: "Successfully submitted the recommendation."
                                };
                            }
                        }
                    }
                }
            }
        } on fail error err {
            return <http:InternalServerError>{
                body: {
                    message: err.toString()
                }
            };
        }
    }

    # Decline promotion recommendation
    #
    # + id - Id of the recommendation
    # + ctx - Request Context appended from the interceptor
    # + comment - Comment for the decline
    # + return - Internal Server Error or recommendation submit results
    resource function get promotion/recommendations/[int id]/decline(http:RequestContext ctx, string comment)
            returns RecommendationStatus|http:Forbidden|http:NotFound|http:InternalServerError|http:BadRequest {

        // "HEADER_USER_INFO" is the email of the user access this resource.
        // Interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);

        if userInfo is error {
            log:printError(USER_INFORMATION_HEADER_NOT_FOUND);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        /// Getting active promotion cycle
        database:PromotionCycle[]|error promotionCycles = database:getPromotionCyclesByStatus([database:OPEN]);

        if promotionCycles is error {
            string customError = "Error while retrieving Promotion Cycles!";
            log:printError(customError, promotionCycles);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if promotionCycles.length() == 0 {
            string customError = "There is no open promotion cycle!";
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        string leadDeadline = promotionCycles[0].leadDeadline;

        string|error ctxUserTimezoneOffset = ctx.getWithType(USER_TIMEZONE_OFFSET);

        if ctxUserTimezoneOffset is error {
            return <http:InternalServerError>{
                body: {
                    message: "An error occurred while retrieving time zone offset header."
                }
            };
        }

        decimal|error userTimezoneOffset = decimal:fromString(ctxUserTimezoneOffset);

        if userTimezoneOffset is error {
            return <http:InternalServerError>{
                body: {
                    message: "An error occurred while converting time zone offset header."
                }
            };
        }

        if userTimezoneOffset < -12.0d || userTimezoneOffset > 14.0d {
            return <http:BadRequest>{
                body: {
                    message: "Invalid timezone offset."
                }
            };
        }

        boolean|error isLeadDeadlinePast = isFutureDate(leadDeadline, userTimezoneOffset);

        if isLeadDeadlinePast is error {
            return <http:InternalServerError>{
                body: {
                    message: "An error occurred while checking deadline."
                }
            };
        }

        if (!isLeadDeadlinePast) {
            return <http:Forbidden>{
                body: {
                    message: "The Lead deadline has passed."
                }
            };
        }

        database:FullPromotionRecommendation[]|error recommendationsArray = database:getFullPromotionRecommendations(
                id = id);

        if recommendationsArray is error {
            string customError = "Error while retrieving Recommendations Array!";
            log:printError(customError, recommendationsArray);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if recommendationsArray.length() == 0 {
            string customError = "Promotion recommendation is not found!";
            log:printError(customError);
            return <http:NotFound>{
                body: {
                    message: customError
                }
            };
        }

        database:FullPromotionRecommendation recommendation = recommendationsArray[0];

        if recommendation.leadEmail != userInfo.email {
            string customError = "Insufficient privilege to access the recommendation.";
            log:printError(customError);
            return <http:Forbidden>{
                body: {
                    message: customError
                }
            };
        }

        if recommendation.recommendationStatus != database:REQUESTED {
            string customError = "Promotion recommendation is not in editable state!";
            log:printError(customError);
            return <http:Forbidden>{
                body: {
                    message: customError
                }
            };
        }

        if recommendation.promotionCycleId != promotionCycles[0].id {
            string customError = "Recommendation does not belongs to current promotion cycle!";
            log:printError(customError);
            return <http:Forbidden>{
                body: {
                    message: customError
                }
            };
        }

        // Update promotion recommendation status 
        error? updateRecommendation = database:updatePromotionRecommendation({
            id: id,
            status: database:DECLINED,
            updatedBy: userInfo.email,
            comments: comment,
            expectedStatus: database:REQUESTED,
            expectedCycleId: promotionCycles[0].id
        });

        if updateRecommendation is error {
            string customError = "Error while Updating the Recommendation!";
            log:printError(customError, updateRecommendation);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        error? updateRequest = database:updatePromotionRequest({
            id: recommendation.requestId,
            status: database:REJECTED,
            updatedBy: userInfo.email,
            reasonForRejection: comment
        });
    
        if updateRequest is error {
            string customError = "Error while Updating the Promotion Request!";
            log:printError(customError, updateRequest);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return {
            status: "Successfully declined the recommendation."
        };
    }

    # Update promotion request data
    #
    # + ctx - Request Context appended from the interceptor
    # + payload - Promotion request update payload
    # + return - Internal Server Error or update results
    resource function PATCH promotions(http:RequestContext ctx, @http:Payload ApplicationUpdateData payload)
        returns ApplicationStatus|http:BadRequest|http:InternalServerError|http:Forbidden {

        // "HEADER_USER_INFO" is the email of the user access this resource.
        // Interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);

        if userInfo is error {
            log:printError(USER_INFORMATION_HEADER_NOT_FOUND);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        // [Start] Resource level authorization 
        // NOTE : After introducing ballerina resource level authorization we can remove this section
        authorization:UserAppPrivilege|error userAppPrivileges = authorization:getUserPrivileges(userInfo.email);

        if userAppPrivileges is error {
            string customError = "Error occurred while retrieving User Privileges!";
            log:printError(customError, userAppPrivileges);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if !(database:checkRoles([database:LEAD], userAppPrivileges.roles) ||
                database:checkRoles([database:FUNCTIONAL_LEAD], userAppPrivileges.roles) ||
                database:checkRoles([database:PROMOTION_BOARD_MEMBER], userAppPrivileges.roles)) {
            string customError = "You do not have the required permission!";
            log:printError(customError);
            return <http:Forbidden>{
                body: {
                    message: customError
                }
            };
        }

        if payload.statement is () && payload.promotingJobBand is () 
            && payload.reasonForRejection is () {
            string customError = "Nothing to update!";
            log:printError(customError);
            return <http:BadRequest>{
                body: {
                    message: customError
                }
            };
        }

        // Getting active promotion cycle
        database:PromotionCycle[]|error promotionCycles = database:getPromotionCyclesByStatus([database:OPEN]);

        if promotionCycles is error {
            string customError = "Error while retrieving Promotion Cycles!";
            log:printError(customError, promotionCycles);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if promotionCycles.length() == 0 {
            string customError = "There is no open promotion cycle!";
            log:printError(customError);
            return <http:BadRequest>{
                body: {
                    message: customError
                }
            };
        }

        database:Promotion[]|error promotionRequests =
            database:getPromotions(cycleID = promotionCycles[0].id, id = payload.id);

        if promotionRequests is error {
            string customError = "Error while retrieving Promotion Requests!";
            log:printError(customError, promotionRequests);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if promotionRequests.length() == 0 {
            string customError = "Invalid promotion request id!";
            log:printError(customError);
            return <http:BadRequest>{
                body: {
                    message: customError
                }
            };
        }

        error? updatePromotion = database:updatePromotionRequest({
            id: payload.id,
            statement: payload.statement,
            reasonForRejection: payload.reasonForRejection,
            promotingJobBand: payload.promotingJobBand,
            updatedBy: userInfo.email
        });

        if updatePromotion is error {
            string customError = "Error while Updating Promotion Requests!";
            log:printError(customError, updatePromotion);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return {
            status: "Successfully updated the application."
        };
    }

    # approve promotion request
    #
    # + id - Id of the promotion request  
    # + ctx - Request Context appended from the interceptor
    # + 'from - User who approve the promotion request
    # + return - Internal Server Error or application submit results
    resource function GET promotions/[int id]/approve(http:RequestContext ctx, string 'from)
            returns ApplicationStatus|http:Forbidden|http:NotFound|http:InternalServerError|http:BadRequest {

        if 'from !is database:ApprovalParties {
            string customError = "Invalid approver!";
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        // "HEADER_USER_INFO" is the email of the user access this resource.
        // Interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);

        if userInfo is error {
            log:printError(USER_INFORMATION_HEADER_NOT_FOUND);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        authorization:UserAppPrivilege|error userAppPrivileges = authorization:getUserPrivileges(userInfo.email);

        if userAppPrivileges is error {
            string customError = "Error occurred while retrieving User Privileges!";
            log:printError(customError, userAppPrivileges);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if !(
            'from is database:promotion_board && database:checkRoles([database:PROMOTION_BOARD_MEMBER], userAppPrivileges.roles) ||
            'from is database:functional_lead && database:checkRoles([database:FUNCTIONAL_LEAD], userAppPrivileges.roles)) {

            string customError = "Insufficient privilege to approve this application.";
            log:printError(customError);
            return <http:Forbidden>{
                body: {
                    message: customError
                }
            };
        }

        database:Promotion[]|error promotionRequestArray = database:getPromotions(id = id,
                statusArray = ['from is database:promotion_board ? database:FL_APPROVED : database:SUBMITTED]);

        if promotionRequestArray is error {
            string customError = "Error while retrieving Promotion Requests!";
            log:printError(customError, promotionRequestArray);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if promotionRequestArray.length() == 0 {
            string customError = "Invalid promotion request id!";
            log:printError(customError);
            return <http:BadRequest>{
                body: {
                    message: customError
                }
            };
        }

        // Getting open promotion cycle
        database:PromotionCycle[]|error openedPromotionCycles = database:getPromotionCyclesByStatus([database:OPEN]);

        if openedPromotionCycles is error {
            string customError = "Error while retrieving Promotion Cycles!";
            log:printError(customError, openedPromotionCycles);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if openedPromotionCycles.length() == 0 {
            string customError = "There is no open promotion cycle!";
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        string functionalLeadDeadline = openedPromotionCycles[0].functionalLeadDeadline;
        string promotionBoardDeadline = openedPromotionCycles[0].promotionBoardDeadline;

        string|error ctxUserTimezoneOffset = ctx.getWithType(USER_TIMEZONE_OFFSET);

        if ctxUserTimezoneOffset is error {
            return <http:InternalServerError>{
                body: {
                    message: "An error occurred while retrieving time zone offset header."
                }
            };
        }

        decimal|error userTimezoneOffset = decimal:fromString(ctxUserTimezoneOffset);

        if userTimezoneOffset is error {
            return <http:InternalServerError>{
                body: {
                    message: "An error occurred while converting time zone offset header."
                }
            };
        }

        if userTimezoneOffset < -12.0d || userTimezoneOffset > 14.0d {
            return <http:BadRequest>{
                body: {
                    message: "Invalid timezone offset."
                }
            };
        }

        boolean|error isFunctionalLeadDeadlinePast = isFutureDate(functionalLeadDeadline, userTimezoneOffset);

        if isFunctionalLeadDeadlinePast is error {
            return <http:InternalServerError>{
                body: {
                    message: "An error occurred while checking deadline."
                }
            };
        }

        boolean|error isPromotionBoardDeadlinePast = isFutureDate(promotionBoardDeadline, userTimezoneOffset);

        if isPromotionBoardDeadlinePast is error {
            return <http:InternalServerError>{
                body: {
                    message: "An error occurred while checking deadline."
                }
            };
        }

        if ('from == "functional_lead" && !isFunctionalLeadDeadlinePast) {
            return <http:Forbidden>{
                body: {
                    message: "The Functional Lead deadline has passed."
                }
            };
        }

        if ('from == "promotion_board" && !isPromotionBoardDeadlinePast) {
            return <http:Forbidden>{
                body: {
                    message: "The Promotion Board deadline has passed."
                }
            };
        }

        // Update promotion request status 
        error? updatePromotion = database:updatePromotionRequest({
            id: promotionRequestArray[0].id,
            status: 'from is database:promotion_board ? database:APPROVED :
                (promotionRequestArray[0].promotionType == database:TIME_BASED ? database:APPROVED : database:FL_APPROVED),
            updatedBy: userInfo.email
        });

        if updatePromotion is error {
            string customError = "Error while Updating Promotion Requests!";
            log:printError(customError, updatePromotion);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return {
            status: "Successfully approved the application."
        };
    }

    # Reject promotion request
    #
    # + id - Id of the promotion request  
    # + ctx - Request Context appended from the interceptor  
    # + 'from - Who sent the reject request  
    # + reason - Reason for the rejection
    # + return - Internal Server Error or application submit results
    resource function GET promotions/[int id]/reject(http:RequestContext ctx, string 'from, string reason)
        returns ApplicationStatus|http:Forbidden|http:NotFound|http:InternalServerError|http:BadRequest {

        if 'from !is database:ApprovalParties {
            // return error("Invalid rejector!");
            string customError = "Invalid rejector!";
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        // "HEADER_USER_INFO" is the email of the user access this resource.
        // Interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);

        if userInfo is error {
            log:printError(USER_INFORMATION_HEADER_NOT_FOUND);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        authorization:UserAppPrivilege|error userAppPrivileges = authorization:getUserPrivileges(userInfo.email);

        if userAppPrivileges is error {
            string customError = "Error occurred while retrieving User Privileges!";
            log:printError(customError, userAppPrivileges);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if !(
            'from is database:promotion_board && database:checkRoles([database:PROMOTION_BOARD_MEMBER], userAppPrivileges.roles) ||
            'from is database:functional_lead && database:checkRoles([database:FUNCTIONAL_LEAD], userAppPrivileges.roles)) {

            string customError = "Insufficient privilege to reject this application.";
            log:printError(customError);
            return <http:Forbidden>{
                body: {
                    message: customError
                }
            };
        }

        // Getting open promotion cycle
        database:PromotionCycle[]|error openedPromotionCycles = database:getPromotionCyclesByStatus([database:OPEN]);

        if openedPromotionCycles is error {
            string customError = "Error while retrieving Promotion Cycles!";
            log:printError(customError, openedPromotionCycles);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if openedPromotionCycles.length() == 0 {
            string customError = "There is no open promotion cycle!";
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        string functionalLeadDeadline = openedPromotionCycles[0].functionalLeadDeadline;
        string promotionBoardDeadline = openedPromotionCycles[0].promotionBoardDeadline;

        string|error ctxUserTimezoneOffset = ctx.getWithType(USER_TIMEZONE_OFFSET);

        if ctxUserTimezoneOffset is error {
            return <http:InternalServerError>{
                body: {
                    message: "An error occurred while retrieving time zone offset header."
                }
            };
        }

        decimal|error userTimezoneOffset = decimal:fromString(ctxUserTimezoneOffset);

        if userTimezoneOffset is error {
            return <http:InternalServerError>{
                body: {
                    message: "An error occurred while converting time zone offset header."
                }
            };
        }

        if userTimezoneOffset < -12.0d || userTimezoneOffset > 14.0d {
            return <http:BadRequest>{
                body: {
                    message: "Invalid timezone offset."
                }
            };
        }

        boolean|error isFunctionalLeadDeadlinePast = isFutureDate(functionalLeadDeadline, userTimezoneOffset);

        if isFunctionalLeadDeadlinePast is error {
            return <http:InternalServerError>{
                body: {
                    message: "An error occurred while checking deadline."
                }
            };
        }

        boolean|error isPromotionBoardDeadlinePast = isFutureDate(promotionBoardDeadline, userTimezoneOffset);

        if isPromotionBoardDeadlinePast is error {
            return <http:InternalServerError>{
                body: {
                    message: "An error occurred while checking deadline."
                }
            };
        }

        if ('from == "functional_lead" && !isFunctionalLeadDeadlinePast) {
            return <http:Forbidden>{
                body: {
                    message: "The Functional Lead deadline has passed."
                }
            };
        }

        if ('from == "promotion_board" && !isPromotionBoardDeadlinePast) {
            return <http:Forbidden>{
                body: {
                    message: "The Promotion Board deadline has passed."
                }
            };
        }

        database:Promotion[]|error promotionRequestArray = database:getPromotions(id = id,
                statusArray = ['from is database:promotion_board ? database:FL_APPROVED : database:SUBMITTED]);

        if promotionRequestArray is error {
            string customError = "Error while retrieving Promotion Requests!";
            log:printError(customError, promotionRequestArray);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if promotionRequestArray.length() == 0 {
            string customError = "There is no promotion application to reject!";
            log:printError(customError);
            return <http:NotFound>{
                body: {
                    message: customError
                }
            };
        }

        // Update promotion request status 
        error? updatePromotion = database:updatePromotionRequest({
            id: promotionRequestArray[0].id,
            status: 'from is database:promotion_board ? database:REJECTED : database:FL_REJECTED,
            reasonForRejection: reason,
            updatedBy: userInfo.email
        });

        if updatePromotion is error {
            string customError = "Error while Updating Promotion Requests!";
            log:printError(customError, updatePromotion);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return {
            status: "Successfully rejected the application."
        };
    }

    # Create new promotion cycle
    #
    # + ctx - Request Context  
    # + payload - Promotion cycle insert payload
    # + return - Internal Server Error or recommendation create results
    resource function POST promotion/cycles(http:RequestContext ctx, PromotionCycleCreateData payload)
        returns http:Created|http:Forbidden|http:InternalServerError {

        // "HEADER_USER_INFO" is the email of the user access this resource.
        // Interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);

        if userInfo is error {
            log:printError(USER_INFORMATION_HEADER_NOT_FOUND);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        authorization:UserAppPrivilege|error userAppPrivileges = authorization:getUserPrivileges(userInfo.email);

        if userAppPrivileges is error {
            string customError = "Error occurred while retrieving User Privileges!";
            log:printError(customError, userAppPrivileges);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        if !database:checkRoles([database:HR_ADMIN], userAppPrivileges.roles) {
            string customError = "Insufficient privileges!";
            log:printError(customError);
            return <http:Forbidden>{
                body: {
                    message: customError
                }
            };
        }

        // Validating dates 
        time:Utc|time:Error startDate = time:utcFromString(payload.startDate + UTC_DEFAULT_STRING);
        time:Utc|time:Error endDate = time:utcFromString(payload.endDate + UTC_DEFAULT_STRING);
        time:Utc|time:Error leadDeadline = time:utcFromString(payload.leadDeadline + UTC_DEFAULT_STRING);
        time:Utc|time:Error functionalLeadDeadline = time:utcFromString(payload.functionalLeadDeadline + UTC_DEFAULT_STRING);
        time:Utc|time:Error promotionBoardDeadline = time:utcFromString(payload.promotionBoardDeadline + UTC_DEFAULT_STRING);

        if startDate is time:Error || endDate is time:Error ||
            leadDeadline is time:Error || functionalLeadDeadline is time:Error || promotionBoardDeadline is time:Error {
            string customError = "Invalid date format in one or more date fields. Date format should be YYYY-MM-DD.";
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if <int>time:utcDiffSeconds(endDate, startDate) < 0 {
            string customError = "The end date should be greater than the start date.";
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if <int>time:utcDiffSeconds(endDate, leadDeadline) < 0 {
            string customError = "The end date should be greater than the lead deadline date.";
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if <int>time:utcDiffSeconds(endDate, functionalLeadDeadline) < 0 {
            string customError = "The end date should be greater than the functional lead deadline.";
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if <int>time:utcDiffSeconds(endDate, promotionBoardDeadline) < 0 {
            string customError = "The end date should be greater than the promotion board deadline.";
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if <int>time:utcDiffSeconds(promotionBoardDeadline, functionalLeadDeadline) < 0 {
            string customError = "The promotion board deadline should be greater than the functional lead deadline.";
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if <int>time:utcDiffSeconds(leadDeadline, startDate) <= 0 {
            string customError = "The lead deadline should be after the start date.";
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        if <int>time:utcDiffSeconds(functionalLeadDeadline, leadDeadline) <= 0 {
            string customError = "The functional lead deadline should be after the lead deadline.";
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        int|error cretaedPromotionCycle = database:insertPromotionCycle({
            name: payload.name,
            startDate: payload.startDate,
            endDate: payload.endDate,
            leadDeadline: payload.leadDeadline,
            functionalLeadDeadline: payload.functionalLeadDeadline,
            promotionBoardDeadline: payload.promotionBoardDeadline,
            status: database:OPEN,
            createdBy: userInfo.email
        });

        if cretaedPromotionCycle is error {
            if cretaedPromotionCycle.message().includes("insert failed due to there is a active promotion-cycle", 0) {
                string customError = "An error occurred while creating a promotion cycle.there is an active promotion cycle";
                log:printError(customError, cretaedPromotionCycle);
                return <http:InternalServerError>{
                    body: {
                        message: customError
                    }
                };
            }
            string customError = "An error occurred during the insertion of promotion cycle data!";
            log:printError(customError, cretaedPromotionCycle);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        database:Config[]|error configs = database:getConfigs(key = TIME_BASED_PROMOTION_KEY);

        if configs is error {
            string customError = "An error occurred while retrieving the app configs!";
            log:printError(customError, configs);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        // When multiple or no process config is returned, it is an error
        if configs.length() != 1 {
            string customError = "We were not able to retrieve the Time-based promotion status. Please contact app support!";
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        // Check whether the process is already running
        if configs.length() == 1 {
            database:Config config = configs[0];
            if config.value == database:IN_PROGRESS {
                string customError = "Process is already running!";
                log:printError(customError);
                return <http:InternalServerError>{
                    body: {
                        message: customError
                    }
                };
            }
        }

        database:PromotionCycle[]|error promotionCycles = database:getPromotionCyclesByStatus([database:OPEN]);

        if promotionCycles is error {
            string customError = "Error while retrieving Promotion Cycles!";
            log:printError(customError, promotionCycles);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return <http:Created>{
            body: {id: promotionCycles[0].id}
        };
    }

    # End promotion cycle
    #
    # + id - Promotion cycle id  
    # + ctx - Request Context appended from the interceptor
    # + return - Status or error
    resource function GET promotion/cycles/[int id]/end(http:RequestContext ctx)
        returns PromotionCycleStatus|http:Forbidden|http:NotFound|http:InternalServerError {

        // "HEADER_USER_INFO" is the email of the user access this resource.
        // Interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);

        if userInfo is error {
            log:printError(USER_INFORMATION_HEADER_NOT_FOUND);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        // After introducing ballerina resource level authorization we can remove this section
        authorization:UserAppPrivilege|error userAppPrivileges = authorization:getUserPrivileges(userInfo.email);

        if userAppPrivileges is error {
            string customError = "Error occurred while retrieving User Privileges!";
            log:printError(customError, userAppPrivileges);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if !database:checkRoles([database:HR_ADMIN], userAppPrivileges.roles) {
            string customError = "Insufficient privileges!";
            log:printError(customError);
            return <http:Forbidden>{
                body: {
                    message: customError
                }
            };
        }

        int|error affectedRowCount = database:updatePromotionCycle({
            id: id,
            status: database:END,
            updatedBy: userInfo.email
        });

        if affectedRowCount is error {
            string customError = "An error occurred while updating promotion cycle";
            log:printError(customError, affectedRowCount);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if affectedRowCount == 0 {
            string customError = "There is no promotion cycle to end!";
            log:printError(customError);
            return <http:NotFound>{
                body: {
                    message: customError
                }
            };
        }

        // Expiring all the pending applications and recommendations
        int|error?  expirePendingRequests = database:expirePendingRequests(promotionCycleId = id, updatedBy = userInfo.email);

        if expirePendingRequests is error {
            string customError = "An error occurred during expiring the promotion requests!";
            log:printError(customError, expirePendingRequests);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        int|error? expirePendingRecommendations = database:expirePendingRecommendations(promotionCycleId = id, updatedBy = userInfo.email);

        if expirePendingRecommendations is error {
            string customError = "An error occurred during expiring the promotion recommendations!";
            log:printError(customError, expirePendingRecommendations);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return {status: "The promotion cycle ended successfully!"};
    }

    # get users
    #
    # + ctx - Request Context appended from the interceptor
    # + return - Internal Server Error or user create results
    resource function get users(http:RequestContext ctx) returns http:InternalServerError|http:Unauthorized|Users {

        // "HEADER_USER_INFO" is the email of the user access this resource.
        // Interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);

        if userInfo is error {
            log:printError(USER_INFORMATION_HEADER_NOT_FOUND);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        // // After introducing ballerina resource level authorization we can remove this section
        authorization:UserAppPrivilege|error userAppPrivileges = authorization:getUserPrivileges(userInfo.email);

        if userAppPrivileges is error {
            string customError = "Error occurred while retrieving User Privileges!";
            log:printError(customError, userAppPrivileges);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if !database:checkRoles([database:HR_ADMIN], userAppPrivileges.roles) {
            string customError = "Insufficient privilege to access the user list.";
            log:printError(customError);
            return <http:Unauthorized>{
                body: {
                    message: customError
                }
            }; 
        }

        database:User[]|error users = database:getUsers();

        if users is error {
            string customError = "Error occurred while retrieving Users";
            log:printError(customError, users);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return {users};
    }

    # Create new user
    #
    # + ctx - Request Context appended from the interceptor
    # + payload - User Insert Payload
    # + return - Internal Server Error or user create results
    resource function post users(http:RequestContext ctx, @http:Payload UserInsertPayload payload)
        returns UserStatus|http:InternalServerError|http:Unauthorized {

        // "HEADER_USER_INFO" is the email of the user access this resource.
        // Interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);

        if userInfo is error {
            log:printError(USER_INFORMATION_HEADER_NOT_FOUND);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        // After introducing ballerina resource level authorization we can remove this section
        authorization:UserAppPrivilege|error userAppPrivileges = authorization:getUserPrivileges(userInfo.email);

        if userAppPrivileges is error {
            string customError = "Error occurred while retrieving User Privileges!";
            log:printError(customError, userAppPrivileges);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if !database:checkRoles([database:HR_ADMIN], userAppPrivileges.roles) {
            string customError = "Insufficient privilege to access the user list.";
            log:printError(customError);
            return <http:Unauthorized>{
                body: {
                    message: customError
                }
            }; 
        }

        people:Employee|error employeeData = people:getEmployee(workEmail = payload.email);

        if employeeData is error {
            string customError = "Employee not found for given email!";
            log:printError(customError, employeeData);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        int|error cretaedUser = database:insertUser({
            firstName: employeeData.firstName,
            lastName: employeeData.lastName,
            jobBand: employeeData.jobBand,
            email: payload.email,
            functionalLeadAccessLevels: payload.functionalLeadAccessLevels,
            roles: payload.roles,
            businessUnit: employeeData.businessUnit,
            createdBy: userInfo.email
        });

        if cretaedUser is error {
            string customError = "An error occurred during the insertion of promotion cycle data!";
            log:printError(customError, cretaedUser);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return {
            status: "Successfully created the user."
        };
    }

    # Update user : HR admin
    #
    # + ctx - Request Context appended from the interceptor
    # + payload - User Update Payload
    # + return - Internal Server Error / Unauthorized
    resource function patch users(http:RequestContext ctx, @http:Payload UserUpdatePayload payload)
        returns UserStatus|http:InternalServerError|http:Unauthorized|http:NotFound {

        // "HEADER_USER_INFO" is the email of the user access this resource.
        // Interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);

        if userInfo is error {
            log:printError(USER_INFORMATION_HEADER_NOT_FOUND);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        // After introducing ballerina resource level authorization we can remove this section
        authorization:UserAppPrivilege|error userAppPrivileges = authorization:getUserPrivileges(userInfo.email);

        if userAppPrivileges is error {
            string customError = "Error occurred while retrieving User Privileges!";
            log:printError(customError, userAppPrivileges);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if !database:checkRoles([database:HR_ADMIN], userAppPrivileges.roles) {
            string customError = "Insufficient privilege to access the user list.";
            log:printError(customError);
            return <http:Unauthorized>{
                body: {
                    message: customError
                }
            }; 
        }

        // when change email of the user update first and last name of the user according to the new email
        people:Employee|error? employeeData = ();
        string? userEmail = payload.email;
        if userEmail is string {
            employeeData = people:getEmployee(workEmail = userEmail);

            if employeeData is error {
                string customError = "Employee not found for given email!";
                log:printError(customError, employeeData);
                return <http:NotFound>{
                    body: {
                        message: customError
                    }
                };
            }
        }

        database:UserDbUpdatePayload updateUserData = {
            id: payload.id,
            email: payload.email,
            firstName: employeeData is people:Employee ? employeeData.firstName : (),
            lastName: employeeData is people:Employee ? employeeData.lastName : (),
            roles: payload.roles,
            active: payload.active,
            functionalLeadAccessLevels: payload.functionalLeadAccessLevels,
            updatedBy: userInfo.email
        };

        int|error? affectedRowCount = database:updateUser(updateUserData);

        if affectedRowCount is error {
            string customError = "Error occurred while updating the user!";
            log:printError(customError, affectedRowCount);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if affectedRowCount == 0 {
            string customError = "No matching user found to update.";
            log:printError(customError);
            return <http:NotFound>{
                body: {
                    message: customError
                }
            };
        }

        return {
            status: "Successfully updated the user."
        };
    }

    # delete user by userId
    #
    # + id - User id  
    # + ctx - Request Context appended from the interceptor
    # + return - Internal Server Error or user create results
    resource function delete users/[int id](http:RequestContext ctx) 
        returns UserStatus|http:InternalServerError|http:Unauthorized|http:NotFound {

        // "HEADER_USER_INFO" is the email of the user access this resource.
        // Interceptor set this value after validating the jwt.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);

        if userInfo is error {
            log:printError(USER_INFORMATION_HEADER_NOT_FOUND);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        // After introducing ballerina resource level authorization we can remove this section
        authorization:UserAppPrivilege|error userAppPrivileges = authorization:getUserPrivileges(userInfo.email);

        if userAppPrivileges is error {
            string customError = "Error occurred while retrieving User Privileges!";
            log:printError(customError, userAppPrivileges);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if !database:checkRoles([database:HR_ADMIN], userAppPrivileges.roles) {
            string customError = "Insufficient privilege to delete the user.";
            log:printError(customError);
            return <http:Unauthorized>{
                body: {
                    message: customError
                }
            };
        }

        int|error? affectedRowCount = database:deleteUserById(id);

        if affectedRowCount is error {
            string customError = "Error occurred while deleting the user!";
            log:printError(customError, affectedRowCount);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if affectedRowCount == 0 {
            string customError = "No matching user found to delete.";
            log:printError(customError);
            return <http:NotFound>{
                body: {
                    message: customError
                }
            };
        }

        return {
            status: "Successfully deleted the user."
        };
    }
}
