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
        // TODO: Fetch privileges and return along with the basic info
        return {...employeeBasicInfo, privileges: []};
    }

    # Fetch employee detailed information.
    #
    # + employeeId - Employee ID
    # + return - Employee detailed information
    resource function get employees/[string employeeId](http:RequestContext ctx)
        returns database:Employee|http:InternalServerError|http:NotFound|http:Forbidden {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: ERROR_USER_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        database:Employee|error? employeeInfo = database:getEmployeeInfo(employeeId);
        if employeeInfo is error {
            string customErr = string `Error occurred while fetching employee information for ID: ${employeeId}`;
            log:printError(customErr, employeeInfo, employeeId = employeeId);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }
        if employeeInfo is () {
            string customErr = "Employee information not found";
            log:printWarn(customErr, employeeId = employeeId);
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
    # + employeeId - Employee ID
    # + return - Employee personal information
    resource function get employees/[string employeeId]/personal\-info(http:RequestContext ctx)
        returns database:EmployeePersonalInfo|http:InternalServerError|http:NotFound|http:Forbidden {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: ERROR_USER_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        database:EmployeePersonalInfo|error? employeePersonalInfo = database:getEmployeePersonalInfo(employeeId);
        if employeePersonalInfo is error {
            string customErr = string `Error occurred while fetching employee personal information for ID: ${employeeId}`;
            log:printError(customErr, employeePersonalInfo, employeeId = employeeId);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }
        if employeePersonalInfo is () {
            string customErr = "Employee personal information not found";
            log:printWarn(customErr, employeeId = employeeId);
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

    # Get full organization chart.
    #
    # + return - Full organization chart
    resource function get org\-chart() returns database:OrgChartBusinessUnit[]|http:InternalServerError {
        database:OrgChartBusinessUnit[]|error orgChart = database:getFullOrgChart();
        if orgChart is error {
            string customErr = "Error while fetching organization chart";
            log:printError(customErr, orgChart);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }
        return orgChart;
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

    # Get employment types.
    #
    # + return - Employment types
    resource function get employment\-types() returns database:EmploymentType[]|http:InternalServerError {
        database:EmploymentType[]|error employmentTypes = database:getEmploymentTypes();
        if employmentTypes is error {
            string customErr = "Error while fetching Employment Types";
            log:printError(customErr, employmentTypes);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }
        return employmentTypes;
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
    # + employeeId - Employee ID
    # + payload - Employee personal information update payload
    # + return - HTTP OK or HTTP errors
    resource function patch employees/[string employeeId]/personal\-info(http:RequestContext ctx,
            database:UpdateEmployeePersonalInfoPayload payload)
        returns http:Ok|http:NotFound|http:Forbidden|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: ERROR_USER_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        boolean hasAdminAccess = authorization:checkPermissions([authorization:authorizedRoles.ADMIN_ROLE], userInfo.groups);

        database:Employee|error? employeeInfo = database:getEmployeeInfo(employeeId);
        if employeeInfo is error {
            log:printError(string `Error occurred while fetching employee information for ID: ${employeeId}`,
                    employeeInfo, employeeId = employeeId);
            return <http:InternalServerError>{
                body: {
                    message: ERROR_PERSONAL_INFO_UPDATE_FAILED
                }
            };
        }
        if employeeInfo is () {
            log:printWarn("Employee information not found", employeeId = employeeId);
            return <http:NotFound>{
                body: {
                    message: ERROR_PERSONAL_INFO_UPDATE_FAILED
                }
            };
        }

        if !hasAdminAccess {
            if employeeInfo.workEmail != userInfo.email {
                string customErr = "You are not allowed to update personal information of another employee";
                log:printWarn(customErr, employeeId = employeeId, invokerEmail = userInfo.email, targetEmail = employeeInfo.workEmail);
                return <http:Forbidden>{
                    body: {
                        message: customErr
                    }
                };
            }

            boolean hasRestrictedFields =
                payload.nicOrPassport is string ||
                payload.firstName is string ||
                payload.lastName is string ||
                payload.title is string ||
                payload.dob is string ||
                payload.gender is string ||
                payload.nationality is string;

            if hasRestrictedFields {
                string customErr = "You are not allowed to update one or more of the provided fields";
                log:printWarn(customErr, employeeId = employeeId, invokerEmail = userInfo.email);
                return <http:Forbidden>{
                    body: {
                        message: customErr
                    }
                };
            }
        }

        database:EmployeePersonalInfo|error? employeePersonalInfo = database:getEmployeePersonalInfo(employeeId);
        if employeePersonalInfo is error {
            string customErr = string `Error occurred while fetching employee personal information for ID: ${employeeId}`;
            log:printError(customErr, employeePersonalInfo, employeeId = employeeId);
            return <http:InternalServerError>{
                body: {
                    message: ERROR_PERSONAL_INFO_UPDATE_FAILED
                }
            };
        }
        if employeePersonalInfo is () {
            string customErr = "Employee personal information not found";
            log:printWarn(customErr, employeeId = employeeId);
            return <http:NotFound>{
                body: {
                    message: customErr
                }
            };
        }

        error? updateResult = database:updateEmployeePersonalInfo(employeePersonalInfo.id, payload, userInfo.email);
        if updateResult is error {
            string customErr = string `Error occurred while updating employee personal information for ID: ${employeeId}`;
            log:printError(customErr, updateResult, employeeId = employeeId);
            return <http:InternalServerError>{
                body: {
                    message: ERROR_PERSONAL_INFO_UPDATE_FAILED
                }
            };
        }

        return http:OK;
    }

    # Update employee job information.
    #
    # + employeeId - Employee ID
    # + payload - Employee job info update payload
    # + return - HTTP OK or HTTP errors
    resource function patch employees/[string employeeId]/job\-info(http:RequestContext ctx,
            database:UpdateEmployeeJobInfoPayload payload)
        returns http:Ok|http:NotFound|http:Forbidden|http:InternalServerError {

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
            log:printWarn("User is not authorized to update an employee", invokerEmail = userInfo.email);
            return <http:Forbidden>{
                body: {
                    message: "You are not authorized to update an employee"
                }
            };
        }

        database:Employee|error? employeeInfo = database:getEmployeeInfo(employeeId);
        if employeeInfo is error {
            log:printError(string `Error occurred while fetching employee information for ID: ${employeeId}`,
                    employeeInfo, employeeId = employeeId);

            return <http:InternalServerError>{
                body: {
                    message: ERROR_EMPLOYEE_INFO_UPDATE_FAILED
                }
            };
        }
        if employeeInfo is () {
            log:printWarn("Employee information not found", employeeId = employeeId);
            return <http:NotFound>{
                body: {
                    message: "Employee information not found"
                }
            };
        }

        error? updateResult = database:updateEmployeeJobInfo(employeeId, payload, userInfo.email);
        if updateResult is error {
            string customErr = string `Error occurred while updating employee job information for ID: ${employeeId}`;
            log:printError(customErr, updateResult, employeeId = employeeId);
            return <http:InternalServerError>{
                body: {
                    message: ERROR_EMPLOYEE_INFO_UPDATE_FAILED
                }
            };
        }

        return http:OK;
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
}
