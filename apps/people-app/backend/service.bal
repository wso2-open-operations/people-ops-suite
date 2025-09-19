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
// under the License
import people.authorization;
import people.database;

import ballerina/cache;
import ballerina/http;
import ballerina/log;

@display {
    label: "People Service",
    id: "people-ops-suite/people-service"
}

final cache:Cache userInfoCache = new ({
    capacity: 2000,
    defaultMaxAge: 1800.0,
    cleanupInterval: 900.0
});

final cache:Cache employeeInfoCache = new (capacity = 100, evictionFactor = 0.2);

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

    # Fetch vehicles of a specific employee.
    #
    # + employeeEmail - The email of the employee  
    # + vehicleStatus - filter :  status of the vehicle
    # + offset - offset of the response  
    # + 'limit - limit of the response
    # + return - List  of vehicles | Error
    resource function get employees/[string employeeEmail]/vehicles(http:RequestContext ctx,
            database:VehicleStatus? vehicleStatus, int? offset, int? 'limit)
        returns database:Vehicles|http:InternalServerError|http:NotFound|http:Forbidden {

        // User information header.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if employeeEmail !== userInfo.email {
            return <http:Forbidden>{
                body: {
                    message: "You are not allowed to view vehicles of other employees!"
                }
            };
        }

        database:Vehicles|error vehicles = database:fetchVehicles(
                owner = employeeEmail,
                vehicleStatus = vehicleStatus,
                'limit = 'limit,
                offset = offset
            );

        if vehicles is error {
            string customError = string `An error occurred while fetching vehicles of ${employeeEmail}`;
            log:printError(customError, vehicles);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return vehicles;
    }

    # Persist new vehicle.
    #
    # + employeeEmail - The email of the employee
    # + vehicle - The vehicle details
    # + return - success | Error
    resource function post employees/[string employeeEmail]/vehicles(http:RequestContext ctx, NewVehicle vehicle)
        returns http:Created|http:Forbidden|http:InternalServerError {

        // User information header.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if employeeEmail !== userInfo.email {
            return <http:Forbidden>{
                body: {
                    message: "You are not allowed to add vehicles for other employees!"
                }
            };
        }

        int|error vehicleResult = database:addVehicle({
                                                          owner: userInfo.email,
                                                          vehicleRegistrationNumber: vehicle.vehicleRegistrationNumber,
                                                          vehicleType: vehicle.vehicleType,
                                                          vehicleStatus: database:ACTIVE,
                                                          createdBy: userInfo.email
                                                      });
        if vehicleResult is error {
            string customError = string `Error occurred while adding vehicle!`;
            log:printError(customError, vehicleResult);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return http:CREATED;

    }

    resource function delete employees/[string employeeEmail]/vehicles/[int vehicleId](http:RequestContext ctx)
        returns http:Ok|http:Forbidden|http:InternalServerError|http:BadRequest {

        // User information header.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        if employeeEmail !== userInfo.email {
            return <http:Forbidden>{
                body: {
                    message: "You are not allowed to remove vehicles for other employees!"
                }
            };
        }

        boolean|error updateResult = database:updateVehicle({
                                                                vehicleId: vehicleId,
                                                                vehicleStatus: database:INACTIVE,
                                                                updatedBy: userInfo.email
                                                            });

        if updateResult is error {
            string customError = string `Error occurred while updating vehicle!`;
            log:printError(customError, updateResult);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if updateResult == false {
            string customError = string `No vehicle found with ID ${vehicleId} to update!`;
            log:printError(customError);
            return <http:BadRequest>{
                body: {
                    message: customError
                }
            };
        }

        return http:OK;
    }

    # Endpoint to fetch user information of the logged in users.
    #
    # + ctx - Request object
    # + return - User info object|Error
    resource function get user\-info(http:RequestContext ctx)
        returns UserResponse|http:InternalServerError {

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
        if userInfo.hasKey(userInfo.email) {
            UserResponse|error cachedUserInfo = userInfo.get(userInfo.email).ensureType();
            if cachedUserInfo is UserResponse {
                return cachedUserInfo;
            }
        }

        // Fetch the user information from the entity service.
        UserInfo|error loggedInUser = database:fetchBasicUserInfo(userInfo.email);
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

        UserResponse userInfoResponse = {...loggedInUser, privileges};

        error? cacheError = userInfoCache.put(userInfo.email, userInfoResponse);
        if cacheError is error {
            log:printError("An error occurred while writing user info to the cache", cacheError);
        }
        return userInfoResponse;

    }

    # Endpoint to fetch user information of the logged in users.
    #
    # + email - user's wso2 email
    # + return - Employeeinfo object or an Error
    resource function get employeeInfo/[string email]()
        returns EmployeeInfo|http:InternalServerError|http:Forbidden|http:BadRequest|http:NotFound {

        if !email.matches(WSO2_EMAIL) {
            string customError = string `Input email is not a valid WSO2 email address: ${email}`;
            log:printError(customError);
            return <http:BadRequest>{
                body: {
                    message: customError
                }
            };
        }

        if employeeInfoCache.hasKey(email) {
            EmployeeInfo|error cacheResult = employeeInfoCache.get(email).ensureType();

            if cacheResult is EmployeeInfo {
                return cacheResult;
            }
        }

        EmployeeInfo|error? employeeInfo = database:fetchEmployeeInfo(email);

        if employeeInfo is error {
            string customError = string `Internal Server Error`;
            log:printError(customError, employeeInfo);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if employeeInfo is () {
            string customError = string `User Not Found for email : ${email}`;
            log:printError(customError);
            return <http:NotFound>{
                body: {
                    message: customError
                }
            };
        }

        error? employee = employeeInfoCache.put(email, employeeInfo);

        if employee is error {
            string customError = string `Failed to cache employee : ${email} employee info`;
            log:printError(customError, employee);
        }

        return employeeInfo;
    }

    # Endpoint to handle update employee info on only changed fields.
    #
    # + email - User's wso2 email 
    # + updateEmployee - Employee payload that includes changed user information
    # + return - SQL-execution result or an error
    resource function patch employeeInfo/[string email](UpdateEmployeeInfoPlayload updateEmployee)
        returns http:Ok|http:BadRequest|http:InternalServerError {

        log:printInfo(`Update employee info invoked : ${email}`);

        if !email.matches(WSO2_EMAIL) {
            string customError = string `Input email is not a valid WSO2 email address: ${email}`;
            log:printError(customError);
            return <http:BadRequest>{
                body: {
                    message: customError
                }
            };
        }

        error? result = database:UpdateEmployeeInfo(email, updateEmployee);

        if result is error {
            string customError = string `Error while updating employee info ${result.message()}`;
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return <http:Ok>{
            body: {
                message: "Successfully updated the employee data"
            }
        };

    }

    # Endpoint to get organization structure for a given filter criteria (graphql query).
    #
    # + filter - Filter criteria for organization structure
    # + limit - Number of records to retrieve
    # + offset - Number of records to offset
    # + return - Organization structure or an Error
    resource function get orgData(OrgDetailsFilter? filter, int? 'limit, int? offset)
        returns BusinessUnit[]|http:InternalServerError {

        BusinessUnit[]|error orgData = database:fetchOrgDetails(filter ?: {}, 'limit ?: 1000, offset ?: 0);

        if orgData is error {
            string customError = string `Error while retrieving org details`;
            log:printError(customError, orgData);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return orgData;
    }

    # Endpoint to fetch essential app related information.
    #
    # + return - Comapany Information as app config or an error
    resource function get appConfig() returns AppConfig|http:InternalServerError|http:NotFound {

        log:printInfo("Fetch App Config Invoked!");

        AppConfig|error? result = database:fetchAppConfig();

        if result is error {
            string customError = string `Error when retrieving user info ${result.message()}`;
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        if result is () {
            string customError = string `Couldn\'t retrieve any the AppConfigs from the database`;
            log:printError(customError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return result;

    }
}

