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
import people.authorization;
import people.database;

import ballerina/http;
import ballerina/log;

@display {
    label: "People Service",
    id: "people-ops-suite/people-service"
}

service class ErrorInterceptor {
    *http:ResponseErrorInterceptor;

    remote function interceptResponseError(error err, http:RequestContext ctx) returns http:BadRequest|error {

        // Handle data-binding errors.
        if err is http:PayloadBindingError {
            string customErr = string `Payload binding failed!`;
            log:printError(customErr, err);
            return {
                body: {
                    message: customErr
                }
            };
        }
        return err;
    }
}

service http:InterceptableService / on new http:Listener(9090) {

    # Service initialization.
    function init() {
        log:printInfo("People App backend started...");
    }

    # Request interceptor.
    #
    # + return - authorization:JwtInterceptor, ErrorInterceptor
    public function createInterceptors() returns http:Interceptor[] =>
        [new authorization:JwtInterceptor(), new ErrorInterceptor()];

    # Get user information.
    #
    # + return - User information or http errors
    resource function get user\-info(http:RequestContext ctx)
        returns database:UserInfo|http:InternalServerError|http:NotFound {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: ERROR_USER_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        database:EmployeeBasicInfo|error? employeeBasicInfo = database:getEmployeeBasicInfo(userInfo.email);
        if employeeBasicInfo is error {
            string customErr = string `Error occurred while fetching employee basic information`;
            log:printError(customErr, employeeBasicInfo, email = userInfo.email);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }
        if employeeBasicInfo is () {
            string customErr = "Employee basic information not found";
            log:printWarn(customErr, user = userInfo.email);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }
        // TODO: Fetch privileges and return along with the basic info
        return {...employeeBasicInfo, privileges: []};
    }

    # Fetch employee detailed information.
    #
    # + id - Employee ID
    # + return - Employee detailed information
    resource function get employees/[string id](http:RequestContext ctx)
        returns database:Employee|http:InternalServerError|http:NotFound|http:Forbidden {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: ERROR_USER_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        database:Employee|error? employeeInfo = database:getEmployeeInfo(id);
        if employeeInfo is error {
            string customErr = string `Error occurred while fetching employee information for ID: ${id}`;
            log:printError(customErr, employeeInfo, id = id);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }
        if employeeInfo is () {
            string customErr = "Employee information not found";
            log:printWarn(customErr, id = id);
            return <http:NotFound>{
                body: {
                    message: customErr
                }
            };
        }
        return employeeInfo;
    }

    # Fetch employee personal information.
    #
    # + id - Employee ID
    # + return - Employee personal information
    resource function get employees/[string id]/personal\-info(http:RequestContext ctx)
        returns database:EmployeePersonalInfo|http:InternalServerError|http:NotFound|http:Forbidden {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: ERROR_USER_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        database:EmployeePersonalInfo|error? employeePersonalInfo = database:getEmployeePersonalInfo(id);
        if employeePersonalInfo is error {
            string customErr = string `Error occurred while fetching employee personal information for ID: ${id}`;
            log:printError(customErr, employeePersonalInfo, id = id);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }
        if employeePersonalInfo is () {
            string customErr = "Employee personal information not found";
            log:printWarn(customErr, id = id);
            return <http:NotFound>{
                body: {
                    message: customErr
                }
            };
        }
        return employeePersonalInfo;
    }

    # Update employee personal information.
    #
    # + id - Employee ID
    # + payload - Employee personal information update payload
    # + return - HTTP OK or HTTP errors
    resource function put employees/[string id]/personal\-info(http:RequestContext ctx,
            database:UpdateEmployeePersonalInfoPayload payload)
        returns database:EmployeePersonalInfo|http:NotFound|http:Forbidden|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: ERROR_USER_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        database:Employee|error? employeeInfo = database:getEmployeeInfo(id);
        if employeeInfo is error {
            log:printError(string `Error occurred while fetching employee information for ID: ${id}`,
                    employeeInfo, id = id);
            return <http:InternalServerError>{
                body: {
                    message: ERROR_PERSONAL_INFO_UPDATE_FAILED
                }
            };
        }
        if employeeInfo is () {
            log:printWarn("Employee information not found", id = id);
            return <http:NotFound>{
                body: {
                    message: ERROR_PERSONAL_INFO_UPDATE_FAILED
                }
            };
        }
        if employeeInfo.workEmail != userInfo.email {
            log:printWarn("User is trying to update personal info of another employee", id = id,
                    invokerEmail = userInfo.email);
            return <http:Forbidden>{
                body: {
                    message: "You are not allowed to update personal information of other employees"
                }
            };
        }

        database:EmployeePersonalInfo|error? employeePersonalInfo = database:getEmployeePersonalInfo(id);
        if employeePersonalInfo is error {
            string customErr = string `Error occurred while fetching employee personal information for ID: ${id}`;
            log:printError(customErr, employeePersonalInfo, id = id);
            return <http:InternalServerError>{
                body: {
                    message: ERROR_PERSONAL_INFO_UPDATE_FAILED
                }
            };
        }
        if employeePersonalInfo is () {
            string customErr = "Employee personal information not found";
            log:printWarn(customErr, id = id);
            return <http:NotFound>{
                body: {
                    message: customErr
                }
            };
        }

        error? updateResult = database:updateEmployeePersonalInfo(employeePersonalInfo.id, payload);
        if updateResult is error {
            string customErr = string `Error occurred while updating employee personal information for ID: ${id}`;
            log:printError(customErr, updateResult, id = id);
            return <http:InternalServerError>{
                body: {
                    message: ERROR_PERSONAL_INFO_UPDATE_FAILED
                }
            };
        }

        return {...payload, id: employeePersonalInfo.id};
    }

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
                    message: ERROR_USER_INFORMATION_HEADER_NOT_FOUND
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
                    message: ERROR_USER_INFORMATION_HEADER_NOT_FOUND
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
                    message: ERROR_USER_INFORMATION_HEADER_NOT_FOUND
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

    # Endpoint to fetch a specific recruit.
    #
    # + recruitId - ID of the recruit to fetch
    # + return - Recruit | NotFound | InternalServerError
    resource function get recruits/[int recruitId](http:RequestContext ctx)
        returns database:Recruit|http:Forbidden|http:InternalServerError|http:NotFound {
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: ERR_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        int[] privileges = [];
        if authorization:checkPermissions([authorization:authorizedRoles.recruitmentTeamRole], userInfo.groups) {
            privileges.push(authorization:RECRUITMENT_TEAM_ROLE_PRIVILEGE);
        }
        if privileges.indexOf(authorization:RECRUITMENT_TEAM_ROLE_PRIVILEGE) is () {
            log:printWarn(string `${UNAUTHORIZED_REQUEST} email: ${userInfo.email} groups:
            ${userInfo.groups.toString()}`);
            return <http:Forbidden>{
                body: {
                    message: UNAUTHORIZED_REQUEST
                }
            };
        }
        // Fetch recruit from the database
        database:Recruit|error? recruit = database:fetchRecruitById(recruitId);

        if recruit is error {
            string customError = "Internal Server Error";
            log:printError(customError, recruit);
            return <http:InternalServerError>{
                body: {message: customError}
            };
        }

        if recruit is () {
            string customError = "Recruit Not Found";
            log:printError(customError);
            return <http:NotFound>{
                body: {message: customError}
            };
        }

        return recruit;
    }

    # Endpoint to fetch all recruits.
    #
    # + return - List of recruits | NotFound | InternalServerError
    resource function get recruits(http:RequestContext ctx)
        returns database:Recruit[]|http:Forbidden|http:InternalServerError|http:BadRequest|http:NotFound {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: ERR_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        int[] privileges = [];
        if authorization:checkPermissions([authorization:authorizedRoles.recruitmentTeamRole], userInfo.groups) {
            privileges.push(authorization:RECRUITMENT_TEAM_ROLE_PRIVILEGE);
        }
        if privileges.indexOf(authorization:RECRUITMENT_TEAM_ROLE_PRIVILEGE) is () {
            log:printWarn(string `${UNAUTHORIZED_REQUEST} email: ${userInfo.email} groups: ${
                    userInfo.groups.toString()
                    }`);

            return <http:Forbidden>{
                body: {
                    message: UNAUTHORIZED_REQUEST
                }
            };
        }
        // Fetch recruits from the database
        database:Recruit[]|error? recruits = database:fetchRecruits();

        if recruits is error {
            string customError = string `Internal Server Error`;
            log:printError(customError, recruits);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        if recruits is () {
            string customError = string `Recruits Not Found`;
            log:printError(customError);
            return <http:NotFound>{
                body: {
                    message: customError
                }
            };
        }

        return recruits;
    }

    # Endpoint to add a recruit.
    #
    # + recruit - Recruit details
    # + return - Created | Forbidden | InternalServerError
    resource function post recruits(http:RequestContext ctx, database:AddRecruitPayload recruit)
        returns http:Created|http:Forbidden|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: ERR_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        int[] privileges = [];
        if authorization:checkPermissions([authorization:authorizedRoles.recruitmentTeamRole], userInfo.groups) {
            privileges.push(authorization:RECRUITMENT_TEAM_ROLE_PRIVILEGE);
        }
        if privileges.indexOf(authorization:RECRUITMENT_TEAM_ROLE_PRIVILEGE) is () {
            log:printWarn(string `${UNAUTHORIZED_REQUEST} email: ${userInfo.email} groups:
            ${userInfo.groups.toString()}`);
            return <http:Forbidden>{
                body: {
                    message: UNAUTHORIZED_REQUEST
                }
            };
        }

        // Add recruit to the database
        int|error recruitId = database:addRecruit(recruit, userInfo.email);
        if recruitId is error {
            string customError = "Failed to add recruit!";
            log:printError(customError, recruitId);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return http:CREATED;
    }

    # Endpoint to update recruit info dynamically.
    #
    # + id - Recruit id
    # + recruit - Payload with changed fields
    # + return - Ok | BadRequest | InternalServerError
    resource function patch recruits/[int id](database:UpdateRecruitPayload recruit)
        returns http:Ok|http:BadRequest|http:InternalServerError {

        log:printInfo(string `Update recruit invoked`);

        error? result = database:UpdateRecruit(id, recruit);

        if result is error {
            string customError = string `Error while updating recruit info`;
            log:printError(customError, result);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return <http:Ok>{
            body: {
                message: "Successfully updated the recruit data"
            }
        };
    }

    # Endpoint to delete a recruit by ID.
    #
    # + recruitId - ID of the recruit to delete
    # + return - Ok | NotFound | InternalServerError
    resource function delete recruits/[int recruitId](http:RequestContext ctx)
        returns http:Ok|http:NotFound|http:Forbidden|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: ERR_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        int[] privileges = [];
        if authorization:checkPermissions([authorization:authorizedRoles.recruitmentTeamRole], userInfo.groups) {
            privileges.push(authorization:RECRUITMENT_TEAM_ROLE_PRIVILEGE);
        }
        if privileges.indexOf(authorization:RECRUITMENT_TEAM_ROLE_PRIVILEGE) is () {
            log:printWarn(string `${UNAUTHORIZED_REQUEST} email: ${userInfo.email} groups:
            ${userInfo.groups.toString()}`);
            return <http:Forbidden>{
                body: {
                    message: UNAUTHORIZED_REQUEST
                }
            };
        }

        // Delete recruit from the database
        boolean|error deleteResult = database:deleteRecruitById(recruitId);

        if deleteResult is error {
            string customError = "Error occurred while deleting recruit";
            log:printError(customError, deleteResult);
            return <http:InternalServerError>{
                body: {message: customError}
            };
        }

        if !deleteResult {
            string customError = string `No recruit found with ID ${recruitId}`;
            return <http:NotFound>{
                body: {message: customError}
            };
        }

        return http:OK;
    }

}
