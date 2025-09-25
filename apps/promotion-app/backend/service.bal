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

service / on new http:Listener(9090) {

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

        people:EmployeeHistory|error employeeData = people:fetchEmployeeHistory(userInfo.email);
        if employeeData is error {
            string customError = string `Error occurred while retrieving employee history: ${userInfo.email}!`;
            log:printError(customError, employeeData);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

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
    resource function GET promotions/[string email](http:RequestContext ctx, string[]? statusArray)
        returns database:FullPromotion[]|http:Forbidden|http:Unauthorized|http:InternalServerError {

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

        if userInfo.email != email {
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
            employeeEmail = email,  // Constrain by user email if needed.
            statusArray = statusArray // Filter by status.
        );

        if PromotionArray is error {
            string customError = string `Error while retrieving promotions!`;
            log:printError(customError);
            return <http:Forbidden>{
                body: {
                    message: customError
                }
            };
        }

        // Initialize an array to hold the full promotion request data.
        database:FullPromotion[] promotions = [];

        foreach database:Promotion promotionRequest in PromotionArray {

            // Retrieve promotion recommendations for a specific promotion request.
            database:FullPromotionRecommendation[]|error promotionRecommendationsArray = database:getFullPromotionRecommendations(
                    promotionRequestId = promotionRequest.id);

            if promotionRecommendationsArray is error {
                string customError = string `Error while retrieving Promotion Recommendations!`;
                log:printError(customError);
                return <http:Forbidden>{
                    body: {
                        message: customError
                    }
                };
            }

            error? updateError = from database:FullPromotionRecommendation recommendation in promotionRecommendationsArray
                do {
                    recommendation.recommendationStatement = "";
                    recommendation.recommendationAdditionalComment = "";
                };
            if updateError is error {
                return <http:InternalServerError>{
                    body: {
                        message: "Error occurred while data sanitization"
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

        return promotions;
    }
}
