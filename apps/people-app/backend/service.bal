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
import ballerina/regex;

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

        int[] privileges = [authorization:ADMIN_PRIVILEGE, authorization:EMPLOYEE_PRIVILEGE];

        // TODO: Fetch privileges and return along with the basic info
        return {...employeeBasicInfo, privileges};
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

    # Fetch continuous service record by work email.
    #
    # + workEmail - Work email of the employee
    # + return - Employee ID and continuous service record or error response
    resource function get continuous\-service\-records(http:RequestContext ctx, string workEmail)
        returns database:ContinuousServiceRecordInfo[]|http:InternalServerError|http:BadRequest|http:Forbidden {

        if workEmail.trim().length() == 0 {
            string customErr = "Work email is a mandatory query parameter";
            log:printWarn(customErr);
            return <http:BadRequest>{
                body: {
                    message: customErr
                }
            };
        }

        if !regex:matches(workEmail, database:EMAIL_PATTERN_STRING) {
            string customErr = "Invalid work email format";
            log:printWarn(customErr, workEmail = workEmail);
            return <http:BadRequest>{
                body: {
                    message: customErr
                }
            };
        }

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: ERROR_USER_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        database:ContinuousServiceRecordInfo[]|error serviceRecords = database:getContinuousServiceRecordsByEmail(workEmail);
        if serviceRecords is error {
            string customErr = "Error occurred while fetching continuous service records";
            log:printError(customErr, serviceRecords, workEmail = workEmail);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }
        return serviceRecords;
    }

    # Fetch all employees' basic information.
    #
    # + return - All employees' basic information
    resource function get employees/basic\-info() returns database:EmployeeBasicInfo[]|http:InternalServerError {
        database:EmployeeBasicInfo[]|error employeesBasicInfos = database:getAllEmployeesBasicInfo();
        if employeesBasicInfos is error {
            string customErr = "Error occurred while fetching employees' basic information";
            log:printError(customErr, employeesBasicInfos);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }
        return employeesBasicInfos;
    }

    # Get business units.
    # + return - Business units
    resource function get business\-units() returns database:BusinessUnit[]|http:InternalServerError {
        database:BusinessUnit[]|error businessUnits = database:getBusinessUnits();
        if businessUnits is error {
            string customErr = "Error while fetching Business Units";
            log:printError(customErr, businessUnits);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }
        return businessUnits;
    }

    # Get teams.
    #
    # + buId - Business unit ID (optional)
    # + return - Teams
    resource function get teams(int? buId = ()) returns database:Team[]|http:InternalServerError {
        database:Team[]|error teams = database:getTeams(buId);
        if teams is error {
            string customErr = "Error while fetching Teams";
            log:printError(customErr, teams);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }
        return teams;
    }

    # Get sub teams.
    #
    # + teamId - Team ID (optional)
    # + return - Sub teams
    resource function get sub\-teams(int? teamId = ()) returns database:SubTeam[]|http:InternalServerError {
        database:SubTeam[]|error subTeams = database:getSubTeams(teamId);
        if subTeams is error {
            string customErr = "Error while fetching Sub Teams";
            log:printError(customErr, subTeams);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }
        return subTeams;
    }

    # Get units.
    #
    # + subTeamId - Sub team ID (optional)
    # + return - Units
    resource function get units(int? subTeamId = ()) returns database:Unit[]|http:InternalServerError {
        database:Unit[]|error units = database:getUnits(subTeamId);
        if units is error {
            string customErr = "Error while fetching Units";
            log:printError(customErr, units);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }
        return units;
    }

    # Get career functions.
    #
    # + return - Career functions
    resource function get career\-functions() returns database:CareerFunction[]|http:InternalServerError {
        database:CareerFunction[]|error careerFunctions = database:getCareerFunctions();
        if careerFunctions is error {
            string customErr = "Error while fetching Career Functions";
            log:printError(customErr, careerFunctions);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }
        return careerFunctions;
    }

    # Get designations.
    #
    # + careerFunctionId - Career function ID (optional)
    # + return - Designations
    resource function get designations(int? careerFunctionId = ())
        returns database:Designation[]|http:InternalServerError {

        database:Designation[]|error designations = database:getDesignations(careerFunctionId);
        if designations is error {
            string customErr = "Error while fetching Designations";
            log:printError(customErr, designations);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }
        return designations;
    }

    # Get offices.
    #
    # + return - Offices
    resource function get offices() returns database:Office[]|http:InternalServerError {
        database:Office[]|error offices = database:getOffices();
        if offices is error {
            string customErr = "Error while fetching Offices";
            log:printError(customErr, offices);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }
        return offices;
    }

    # Create a new employee.
    #
    # + return - The created employee ID as an integer, or HTTP errors
    resource function post employees(http:RequestContext ctx, database:CreateEmployeePayload payload)
        returns int|http:Forbidden|http:BadRequest|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: ERROR_USER_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        boolean hasAdminAccess = authorization:checkPermissions([authorization:authorizedRoles.ADMIN_ROLE], userInfo.groups);
        if !hasAdminAccess {
            log:printWarn("User is not authorized to create new employees", invokerEmail = userInfo.email);
            return <http:Forbidden>{
                body: {
                    message: "You are not authorized to create new employees"
                }
            };
        }

        database:EmployeePersonalInfo[]|error employeePersonalInfoList = database:searchEmployeePersonalInfo(
                {nicOrPassport: payload.personalInfo.nicOrPassport});
        if employeePersonalInfoList is error {
            string customErr = "Error occurred while checking existing employee personal information";
            log:printError(customErr, employeePersonalInfoList, nicOrPassport = payload.personalInfo.nicOrPassport);
            return <http:InternalServerError>{
                body: {
                    message: ERROR_EMPLOYEE_CREATION_FAILED
                }
            };
        }
        if employeePersonalInfoList.length() > 0 {
            string customErr = "Employee with the given NIC/Passport already exists";
            log:printWarn(customErr, nicOrPassport = payload.personalInfo.nicOrPassport);
            return <http:BadRequest>{
                body: {
                    message: customErr
                }
            };
        }

        int|error employeeId = database:addEmployee(payload, userInfo.email);
        if employeeId is error {
            log:printError(ERROR_EMPLOYEE_CREATION_FAILED, employeeId);
            return <http:InternalServerError>{
                body: {
                    message: ERROR_EMPLOYEE_CREATION_FAILED
                }
            };
        }
        return employeeId;
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

        return {
            id: employeePersonalInfo.id,
            nicOrPassport: employeePersonalInfo.nicOrPassport,
            fullName: employeePersonalInfo.fullName,
            nameWithInitials: employeePersonalInfo.nameWithInitials,
            firstName: employeePersonalInfo.firstName,
            lastName: employeePersonalInfo.lastName,
            title: employeePersonalInfo.title,
            dob: employeePersonalInfo.dob,
            nationality: employeePersonalInfo.nationality,
            personalEmail: payload.personalEmail,
            personalPhone: payload.personalPhone,
            residentNumber: payload.residentNumber,
            addressLine1: payload.addressLine1,
            addressLine2: payload.addressLine2,
            city: payload.city,
            stateOrProvince: payload.stateOrProvince,
            postalCode: payload.postalCode,
            country: payload.country,
            emergencyContacts: payload.emergencyContacts
        };
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

    # Delete a vehicle for an employee (soft delete).
    #
    # + employeeEmail - Email of the employee who owns the vehicle
    # + vehicleId - ID of the vehicle to delete
    # + return - HTTP OK on success, or HTTP errors on failure
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

    # Update a business unit by ID.
    #
    # + buId - ID of the business unit to update
    # + payload - Fields to update in the business unit
    # + return - HTTP OK on success, or HTTP errors on failure
    resource function patch organization/business\-unit/[int buId](http:RequestContext ctx, UnitPayload payload)
        returns http:Ok|http:InternalServerError|http:Forbidden|http:BadRequest {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        if payload.name is () && payload.headEmail is () {
            string customErr = "At least one field should be provided for update";
            log:printWarn(customErr, updatedBy = payload.updatedBy);
            return <http:BadRequest>{
                body: {
                    message: customErr
                }
            };
        }

        string? headEmail = payload.headEmail;
        if headEmail is string {
            EmployeeBasicInfo|error? headsBasicInfo = database:getEmployeeBasicInfo(headEmail);
            if headsBasicInfo is error {
                return <http:InternalServerError>{
                    body: {
                        message: "Error while validating head's email"
                    }
                };
            }

            if headsBasicInfo is () {
                return <http:BadRequest>{
                    body: {
                        message: "No head is found for given email"
                    }
                };
            }
        }

        error? updateResult = database:updateBusinessUnit(payload, buId);
        if updateResult is error {
            log:printError("Error while updating business unit : ", updateResult);
            return <http:InternalServerError>{
                body: {
                    message: "Error while updating the business unit"
                }
            };
        }

        return <http:Ok>{
            body: {
                message: "Successfully updated the business unit"
            }
        };
    }

    # Update a team by ID.
    #
    # + teamId - ID of the team to update
    # + payload - Fields to update in the team
    # + return - HTTP OK on success, or HTTP errors on failure
    resource function patch organization/team/[int teamId](http:RequestContext ctx, UnitPayload payload)
        returns http:Ok|http:InternalServerError|http:Forbidden|http:BadRequest {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        if payload.name is () && payload.headEmail is () {
            string customErr = "At least one field should be provided for update";
            log:printWarn(customErr, updatedBy = payload.updatedBy);
            return <http:BadRequest>{
                body: {
                    message: customErr
                }
            };
        }

        error? updateResult = database:updateTeam(payload, teamId);
        if updateResult is error {
            log:printError("Error while updating team : ", updateResult, teamId = teamId);
            return <http:InternalServerError>{
                body: {
                    message: "Error while updating the team"
                }
            };
        }

        return <http:Ok>{
            body: {
                message: "Successfully updated the team"
            }
        };
    }

    # Update a sub team by ID.
    #
    # + subTeamId - ID of the sub team to update
    # + payload - Fields to update in the sub team
    # + return - HTTP OK on success, or HTTP errors on failure
    resource function patch organization/sub\-team/[int subTeamId](http:RequestContext ctx, UnitPayload payload)
        returns http:Ok|http:InternalServerError|http:Forbidden|http:BadRequest {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        if payload.name is () && payload.headEmail is () {
            string customErr = "At least one field should be provided for update";
            log:printWarn(customErr, updatedBy = payload.updatedBy);
            return <http:BadRequest>{
                body: {
                    message: customErr
                }
            };
        }

        error? updateResult = database:updateSubTeam(payload, subTeamId);
        if updateResult is error {
            log:printError("Error while updating sub team : ", updateResult, subTeamId = subTeamId);
            return <http:InternalServerError>{
                body: {
                    message: "Error while updating the sub team"
                }
            };
        }

        return <http:Ok>{
            body: {
                message: "Successfully updated the sub team"
            }
        };
    }

    # Update a unit by ID.
    #
    # + unitId - ID of the unit to update
    # + payload - Fields to update in the unit
    # + return - HTTP OK on success, or HTTP errors on failure
    resource function patch organization/unit/[int unitId](http:RequestContext ctx, UnitPayload payload)
        returns http:Ok|http:InternalServerError|http:Forbidden|http:BadRequest {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        if payload.name is () && payload.headEmail is () {
            string customErr = "At least one field should be provided for update";
            log:printWarn(customErr, updatedBy = payload.updatedBy);
            return <http:BadRequest>{
                body: {
                    message: customErr
                }
            };
        }

        error? updateResult = database:updateUnit(payload, unitId);
        if updateResult is error {
            log:printError("Error while updating unit : ", updateResult, unitId = unitId);
            return <http:InternalServerError>{
                body: {
                    message: "Error while updating the unit"
                }
            };
        }

        return <http:Ok>{
            body: {
                message: "Successfully updated the unit"
            }
        };
    }

    # Update the functional lead of a business unit-team mapping.
    #
    # + buId - ID of the business unit
    # + teamId - ID of the team
    # + payload - Fields to update in the mapping
    # + return - HTTP OK on success, or HTTP errors on failure
    resource function patch organization/business\-unit/[int buId]/team/[int teamId]
            (http:RequestContext ctx, UpdateBusinessUnitTeamPayload payload)
        returns http:Ok|http:InternalServerError|http:Forbidden|http:BadRequest {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        error|boolean updateResult = database:updateBusinessUnitTeam(payload, buId, teamId);
        if updateResult is error {
            log:printError("Error while updating business_unit_team : ", updateResult, buId = buId, teamId = teamId);
            return <http:InternalServerError>{
                body: {
                    message: "Error while updating the unit"
                }
            };
        }

        if updateResult == false {
            log:printError(string `No team is found with businessUnitId ${buId} and teamId = ${teamId} to update!`);
            return <http:BadRequest>{
                body: {
                    message: "No team found to update"
                }
            };
        }

        return <http:Ok>{
            body: {
                message: "Successfully updated the team"
            }
        };

    }

    # Update the functional lead of a team-sub team mapping.
    #
    # + teamId - ID of the team
    # + subTeamId - ID of the sub team
    # + payload - Fields to update in the mapping
    # + return - HTTP OK on success, or HTTP errors on failure
    resource function patch organization/team/[int teamId]/sub\-team/[int subTeamId]
            (http:RequestContext ctx, UpdateTeamSubTeamPayload payload)
        returns http:Ok|http:InternalServerError|http:Forbidden|http:BadRequest {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        error|boolean updateResult = database:updateTeamSubTeam(payload, teamId, subTeamId);
        if updateResult is error {
            log:printError("Error while updating team_sub_team : ", updateResult, teamId = teamId, subTeamId = subTeamId);
            return <http:InternalServerError>{
                body: {
                    message: "Error while updating the unit"
                }
            };
        }

        if updateResult == false {
            log:printError(string `No sub team is found with teamId ${teamId} and subTeamId = ${subTeamId} to update!`);
            return <http:BadRequest>{
                body: {
                    message: "No sub team found to update"
                }
            };
        }

        return <http:Ok>{
            body: {
                message: "Successfully updated the sub team"
            }
        };
    }

    # Update the functional lead of a sub team-unit mapping.
    #
    # + subTeamId - ID of the sub team
    # + unitId - ID of the unit
    # + payload - Fields to update in the mapping
    # + return - HTTP OK on success, or HTTP errors on failure
    resource function patch organization/sub\-team/[int subTeamId]/unit/[int unitId]
            (http:RequestContext ctx, UpdateSubTeamUnitPayload payload)
        returns http:Ok|http:InternalServerError|http:Forbidden|http:BadRequest {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        error|boolean updateResult = database:updateSubTeamUnit(payload, subTeamId, unitId);
        if updateResult is error {
            log:printError("Error while updating sub_team_unit : ", updateResult, subTeamId = subTeamId, unitId = unitId);
            return <http:InternalServerError>{
                body: {
                    message: "Error while updating the unit"
                }
            };
        }

        if updateResult == false {
            log:printError(string `No unit is found with subTeamId ${subTeamId} and unitId = ${unitId} to update!`);
            return <http:BadRequest>{
                body: {
                    message: "No unit found to update"
                }
            };
        }

        return <http:Ok>{
            body: {
                message: "Successfully updated the unit"
            }
        };
    }

    # Delete a business unit by ID.
    #
    # + buId - ID of the business unit to delete
    # + return - HTTP OK on success, or HTTP errors on failure
    resource function delete organization/business\-unit/[int buId](http:RequestContext ctx)
        returns http:Ok|http:InternalServerError|http:Forbidden|http:BadRequest {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        string workEmail = validatedUserInfo.email;
        error|boolean deleteResult = database:deleteBusinessUnit(workEmail, buId);
        if deleteResult is error {
            log:printError("Error while deleting business unit : ", deleteResult, buId = buId);
            return <http:InternalServerError>{
                body: {
                    message: "Error while deleting the business unit"
                }
            };
        }

        if deleteResult == false {
            log:printError(string `No business unit found with ID ${buId}`);
            return <http:BadRequest>{
                body: {
                    message: "No business unit found to delete"
                }
            };
        }

        return <http:Ok>{
            body: {
                message: "Successfully deleted the business unit"
            }
        };
    }

    # Delete a team-sub team mapping by IDs.
    #
    # + teamId - ID of the team
    # + subTeamId - ID of the sub team
    # + return - HTTP OK on success, or HTTP errors on failure
    resource function delete organization/team/[int teamId]/sub\-team/[int subTeamId]
            (http:RequestContext ctx)
        returns http:Ok|http:InternalServerError|http:Forbidden|http:BadRequest {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        string workEmail = validatedUserInfo.email;
        error|boolean deleteResult = database:deleteTeamSubTeam(workEmail, teamId, subTeamId);
        if deleteResult is error {
            log:printError("Error while deleting team_sub_team : ", deleteResult, teamId = teamId, subTeamId = subTeamId);
            return <http:InternalServerError>{
                body: {
                    message: "Error while deleting the team sub team mapping"
                }
            };
        }

        if deleteResult == false {
            log:printError(string `No team sub team mapping found with teamId ${teamId} and subTeamId ${subTeamId}`);
            return <http:BadRequest>{
                body: {
                    message: "No team sub team mapping found to delete"
                }
            };
        }

        return <http:Ok>{
            body: {
                message: "Successfully deleted the team sub team mapping"
            }
        };
    }

    # Delete a sub team-unit mapping by IDs.
    #
    # + subTeamId - ID of the sub team
    # + unitId - ID of the unit
    # + return - HTTP OK on success, or HTTP errors on failure
    resource function delete organization/sub\-team/[int subTeamId]/unit/[int unitId]
            (http:RequestContext ctx)
        returns http:Ok|http:InternalServerError|http:Forbidden|http:BadRequest {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        string workEmail = validatedUserInfo.email;
        error|boolean deleteResult = database:deleteSubTeamUnit(workEmail, subTeamId, unitId);
        if deleteResult is error {
            log:printError("Error while deleting sub_team_unit : ", deleteResult, subTeamId = subTeamId, unitId = unitId);
            return <http:InternalServerError>{
                body: {
                    message: "Error while deleting the sub team unit mapping"
                }
            };
        }

        if deleteResult == false {
            log:printError(string `No sub team unit mapping found with subTeamId ${subTeamId} and unitId ${unitId}`);
            return <http:BadRequest>{
                body: {
                    message: "No sub team unit mapping found to delete"
                }
            };
        }

        return <http:Ok>{
            body: {
                message: "Successfully deleted the sub team unit mapping"
            }
        };
    }

    # Delete a business unit-team mapping by IDs.
    #
    # + businessUnitId - ID of the business unit
    # + teamId - ID of the team
    # + return - HTTP OK on success, or HTTP errors on failure
    resource function delete organization/business\-unit/[int businessUnitId]/team/[int teamId]
            (http:RequestContext ctx)
        returns http:Ok|http:InternalServerError|http:Forbidden|http:BadRequest {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        string workEmail = validatedUserInfo.email;
        error|boolean deleteResult = database:deleteBusinessUnitTeam(workEmail, businessUnitId, teamId);
        if deleteResult is error {
            log:printError("Error while deleting business_unit_team : ", deleteResult, buId = businessUnitId, teamId = teamId);
            return <http:InternalServerError>{
                body: {
                    message: "Error while deleting the business unit team mapping"
                }
            };
        }

        if deleteResult == false {
            log:printError(string `No business unit team mapping found with businessUnitId ${businessUnitId} and teamId ${teamId}`);
            return <http:BadRequest>{
                body: {
                    message: "No team mapping found to delete"
                }
            };
        }

        return <http:Ok>{
            body: {
                message: "Successfully deleted the team"
            }
        };
    }

    # Get organization details (full hierarchy with business units, teams, sub-teams, units).
    #
    # + return - Organization hierarchy with head, functional lead, and headcount per node
    resource function get organization(http:RequestContext ctx) 
        returns http:InternalServerError|http:Forbidden|http:BadRequest|Company {

       http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        database:Company|error orgStructure = database:getOrganizationDetails();

        if orgStructure is error {
            string customErr = "Error while fetching organization details";
            log:printError(customErr, orgStructure);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }

        return orgStructure;
    }

    # Add new business unit.
    #
    # + payload - Business-unit details
    # + return - HTTP Created on success, or HTTP errors on failure 
    resource function post organization/business\-units(http:RequestContext ctx, OrgNodeInfo payload) 
        returns http:InternalServerError|http:Forbidden|http:BadRequest|http:Created {
        
        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }


        boolean|error nameUniqueness = database:validateBusinessUnitNameUniqueness(payload.name);
        if nameUniqueness is error {
            string customErr = "Error while validating business unit name uniqueness";
            log:printError(customErr, nameUniqueness);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }

        if nameUniqueness == false {
            return <http:BadRequest>{
                body: {
                    message: "Business unit name already exists"
                }
            };
        }

        string workEmail = validatedUserInfo.email;
        int|error result = database:addBusinessUnit(workEmail, payload);
        if result is error {
            string customErr = "Error while adding a business unit";
            log:printError(customErr, result);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }

        return <http:Created>{
            body: {
                message: string `Business unit ${payload.name} Successfully created`
            }
        };
    }

    # Create a new team, and optionally map it to a business unit.
    #
    # + payload - Team details; include `orgNodeLinkInfo` to map to an existing business unit
    # + return - HTTP Created on success, or HTTP errors on failure
    resource function post organization/teams(http:RequestContext ctx, OrgNodePayload payload) 
        returns http:InternalServerError|http:BadRequest|http:Forbidden|http:Created {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        boolean|error nameUniqueness = database:validateTeamNameUniqueness(payload.name);
        if nameUniqueness is error {
            string customErr = "Error while validating team name uniqueness";
            log:printError(customErr, nameUniqueness);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }

        if nameUniqueness == false {
            return <http:BadRequest>{
                body: {
                    message: "Team name already exists"
                }
            };
        }

        string workEmail = validatedUserInfo.email;
        OrgNodeLinkInfo? orgNodeLinkInfo = payload.orgNodeLinkInfo;
        if orgNodeLinkInfo is OrgNodeLinkInfo {
            int|error result = database:addTeamWithMapping(workEmail, {name: payload.name, headEmail: payload.headEmail, orgNodeLinkInfo: orgNodeLinkInfo});
            if result is error {
                string customErr = "Error while adding a team";
                log:printError(customErr, result);
                return <http:InternalServerError>{
                    body: {
                        message: customErr
                    }
                };
            }

            return <http:Created>{
                body: {
                    message: string `Team ${payload.name} Successfully created`
                }
            };
        }

        int|error result = database:addTeam(workEmail, {name: payload.name, headEmail: payload.headEmail});
        if result is error {
            string customErr = "Error while adding a team";
            log:printError(customErr, result);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }

        return <http:Created>{
            body: {
                message: string `Team ${payload.name} Successfully created`
            }
        };
    }

    # Create a new sub-team, and optionally map it to a business unit-team.
    #
    # + payload - Sub-team details; include `orgNodeLinkInfo` with the `business_unit_team` ID to create the mapping
    # + return - HTTP Created on success, or HTTP errors on failure
    resource function post organization/sub\-teams(http:RequestContext ctx, OrgNodePayload payload) 
        returns http:InternalServerError|http:BadRequest|http:Forbidden|http:Created {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        boolean|error nameUniqueness = database:validateSubTeamNameUniqueness(payload.name);
        if nameUniqueness is error {
            string customErr = "Error while validating sub-team name uniqueness";
            log:printError(customErr, nameUniqueness);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }

        if nameUniqueness == false {
            return <http:BadRequest>{
                body: {
                    message: "Sub-team name already exists"
                }
            };
        }

        string workEmail = validatedUserInfo.email;
        OrgNodeLinkInfo? orgNodeLinkInfo = payload.orgNodeLinkInfo;
        if orgNodeLinkInfo is OrgNodeLinkInfo {
            int|error result = database:addSubTeamWithMapping(workEmail, {name: payload.name, headEmail: payload.headEmail, orgNodeLinkInfo: orgNodeLinkInfo});
            if result is error {
                string customErr = "Error while adding a sub-team";
                log:printError(customErr, result);
                return <http:InternalServerError>{
                    body: {
                        message: customErr
                    }
                };
            }

            return <http:Created>{
                body: {
                    message: string `Sub-team ${payload.name} Successfully created`
                }
            };
        }

        int|error result = database:addSubTeam(workEmail, {name: payload.name, headEmail: payload.headEmail});
        if result is error {
            string customErr = "Error while adding a sub-team";
            log:printError(customErr, result);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }

        return <http:Created>{
            body: {
                message: string `Sub-team ${payload.name} Successfully created`
            }
        };
    }

    # Create a new unit, and optionally map it to a business unit-team-sub-team.
    #
    # + payload - Unit details; include `orgNodeLinkInfo` with the `business_unit_team_sub_team` ID to create the mapping
    # + return - HTTP Created on success, or HTTP errors on failure
    resource function post organization/units(http:RequestContext ctx, OrgNodePayload payload) 
        returns http:InternalServerError|http:BadRequest|http:Forbidden|http:Created {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        boolean|error nameUniqueness = database:validateUnitNameUniqueness(payload.name);
        if nameUniqueness is error {
            string customErr = "Error while validating unit name uniqueness";
            log:printError(customErr, nameUniqueness);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }

        if nameUniqueness == false {
            return <http:BadRequest>{
                body: {
                    message: "Unit name already exists"
                }
            };
        }

        string workEmail = validatedUserInfo.email;
        OrgNodeLinkInfo? orgNodeLinkInfo = payload.orgNodeLinkInfo;
        if orgNodeLinkInfo is OrgNodeLinkInfo {
            int|error result = database:addUnitWithMapping(workEmail, {name: payload.name, headEmail: payload.headEmail, orgNodeLinkInfo: orgNodeLinkInfo});
            if result is error {
                string customErr = "Error while adding a unit";
                log:printError(customErr, result);
                return <http:InternalServerError>{
                    body: {
                        message: customErr
                    }
                };
            }

            return <http:Created>{
                body: {
                    message: string `Unit ${payload.name} Successfully created`
                }
            };
        }

        int|error result = database:addUnit(workEmail, {name: payload.name, headEmail: payload.headEmail});
        if result is error {
            string customErr = "Error while adding a unit";
            log:printError(customErr, result);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }

        return <http:Created>{
            body: {
                message: string `Unit ${payload.name} Successfully created`
            }
        };
    }

    # Create a business-unit-team mapping.
    #
    # + payload - Mapping details; `parentId` = business-unit ID, `childId` = team ID
    # + return - HTTP Created on success, or HTTP errors on failure
    resource function post organization/business\-units/teams(http:RequestContext ctx, OrgNodeMappingPayload payload) 
        returns http:InternalServerError|http:BadRequest|http:Forbidden|http:Created {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        string workEmail = validatedUserInfo.email;
        int|error result = database:addBusinessUnitTeam(workEmail, payload);
        if result is error {
            string customErr = "Error while adding BusinessUnit-Team";
            log:printError(customErr, result);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }

        return <http:Created>{
            body: {
                message: string `BusinessUnit-Team Successfully created`
            }
        };
    }

    # Create a team-sub-team mapping.
    #
    # + payload - Mapping details; `parentId` = business-unit-team ID, `childId` = sub-team ID
    # + return - HTTP Created on success, or HTTP errors on failure
    resource function post organization/teams\-sub\-teams(http:RequestContext ctx, OrgNodeMappingPayload payload) 
        returns http:InternalServerError|http:BadRequest|http:Forbidden|http:Created {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        string workEmail = validatedUserInfo.email;
        int|error result = database:addBusinessUnitTeam(workEmail, payload);
        if result is error {
            string customErr = "Error while adding BusinessUnit-Team-SubTeam";
            log:printError(customErr, result);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }

        return <http:Created>{
            body: {
                message: string `BusinessUnit-Team-SubTeam Successfully created`
            }
        };
    }

    resource function post organization/sub\-teams\-units(http:RequestContext ctx, OrgNodeMappingPayload payload) 
        returns http:InternalServerError|http:BadRequest|http:Forbidden|http:Created {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        string workEmail = validatedUserInfo.email;
        int|error result = database:addBusinessUnitTeam(workEmail, payload);
        if result is error {
            string customErr = "Error while adding BusinessUnit-Team-SubTeam-Unit";
            log:printError(customErr, result);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }

        return <http:Created>{
            body: {
                message: string `BusinessUnit-Team-SubTeam-Unit Successfully created`
            }
        };
    }
}

