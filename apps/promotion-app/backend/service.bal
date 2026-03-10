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
            log:printError(`Error occurred while retrieving employee history: ${userInfo.email}!`, employeeData);
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

    # Retrieve promotion cycles by status
    #
    # + statusArray - Array of status to filter the promotion cycles
    # + return - http:Ok|http:Unauthorized|http:InternalServerError
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

    # Check whether the specific employee is eligible for the promotion
    #
    # + ctx - Request Context 
    # + return - Internal Server Error or Lead list object
    resource function GET employees(http:RequestContext ctx, boolean? filterLeads)
        returns Employees|http:Forbidden|http:InternalServerError|error {

        // Check if the employees are already cached.
        if cache.hasKey(EMPLOYEES_CACHE_KEY) {
            people:EmployeeInfo[]|error cachedEmployees = cache.get(EMPLOYEES_CACHE_KEY).ensureType();
            if cachedEmployees is people:EmployeeInfo[] {
                return {
                    employees: cachedEmployees
                };
            }
        }

        // "HEADER_USER_INFO" is the email of the user access this resource
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

        // Get all Employees
        people:EmployeeInfo[]|error employees = people:getEmployees();

        if employees is error {
            string customError = string `Error occurred while retrieving employees!`;
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

    # Get employee joined deatails
    #
    # + ctx - Request Context er Description  
    # + employeeWorkEmail - employee email
    # + return - Internal Server Error or Unauthorized Error or Employee info object
    resource function GET employee/history(http:RequestContext ctx, string employeeWorkEmail)
        returns EmployeeJoinedDetails|http:InternalServerError|http:Unauthorized {

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
                return <http:Unauthorized>{
                    body: {
                        message: "Insufficient privileges!"
                    }
                };
            }
        }

        //Get employee History
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
    # + return - Internal Server Error or Promotion request array
    resource function GET promotions(http:RequestContext ctx, string[]? statusArray, 
            string? employeeEmail, string? recommendedBy, string? 'type)
        returns Promotions|http:Forbidden|http:Unauthorized|http:InternalServerError {

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

        authorization:UserAppPrivilege|error userAppPrivileges = authorization:getUserPrivileges(userInfo.email);

        if userAppPrivileges is error {
            return <http:InternalServerError>{
                body: {
                    message: "Error occurred while retrieving User Privileges!"
                }
            };
        }

        if !database:checkRoles([database:LEAD], userAppPrivileges.roles) && userInfo.email != employeeEmail {
            string customError = string `You are not authorized to view promotion details of other employees!`;
            log:printError(customError);
            return <http:Forbidden>{
                body: {
                    message: customError
                }
            };
        }

        // Retrieve promotion requests from the database, using various filters and constraints.
        database:Promotion[]|error PromotionArray = database:getPromotions(
            employeeEmail = employeeEmail,
            statusArray = statusArray,
            recommendedBy = recommendedBy
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

    # Draft new promotion request
    #
    # + ctx - Request Context appended from the interceptor  
    # + application - Application data
    # + return - Internal Server Error or Apply Promotion Service Results
    resource function POST promotions(http:RequestContext ctx, @http:Payload Application application)
        returns ApplicationInfo|http:Forbidden|http:InternalServerError|error {

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
        // After introducing ballerina resource level authorization we can remove this section
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
        // Verifying the requester 
        // [Special Promotion Request] leads can create promotion requests for others 
        if !database:checkRoles([database:LEAD], userAppPrivileges.roles) && userInfo.email != application.employeeEmail {
            string customError = "Insufficient privilege to create promotion application for others.";
            log:printError(customError);
            return <http:Forbidden>{
                body: {
                    message: customError
                }
            };
        }
        // [End] Resource level authorization

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

        // Job band conversion to int
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

        // Getting active promotion cycle
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

        // For promotion application insert payload
        database:PromotionRequestDbInsertPayload promotionApplication;

        // For promotion recommendation payload
        database:PromotionRecommendationInsertPayload promotionRecommendation;

        // Duplicate promotion request check
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

        // Check if there are any existing promotion requests for the same promotion cycle
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
            // For SPECIAL promotion application
            // Checking if the requested job band is valid
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

            // Setting promotion application payload
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
                    // Setting promotion recommendation payload
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
                        string customError = string `Error while inserting Promotion Recommendation`;
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
                    string customError = string `Error while inserting Promotion Request`;
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
                string customError = string `Error while inserting Promotion Request`;
                log:printError(customError);
                return <http:InternalServerError>{
                    body: {
                        message: customError
                    }
                };
            }

            return <ApplicationInfo>{applicationID};

        } else {
            return error("Invalid promotion type!");
        }

    }
}
