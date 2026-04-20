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
import people.qr;
import people.wso2_coin;

import ballerina/http;
import ballerina/log;
import ballerina/regex;
import ballerina/time;

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
            return <http:NotFound>{
                body: {
                    message: customErr
                }
            };
        }

        int[] privileges = [];
        if authorization:checkPermissions([authorization:authorizedRoles.EMPLOYEE_ROLE], userInfo.groups) {
            privileges.push(authorization:EMPLOYEE_PRIVILEGE);
        }
        if authorization:checkPermissions([authorization:authorizedRoles.ADMIN_ROLE], userInfo.groups) {
            privileges.push(authorization:ADMIN_PRIVILEGE);
        }
        if authorization:checkPermissions([authorization:authorizedRoles.SERVICE_DESK_ROLE], userInfo.groups) {
            privileges.push(authorization:SERVICE_DESK_PRIVILEGE);
        }

        boolean|error isLeadUser = database:isLead(userInfo.email);
        if isLeadUser is error {
            string customErr = "Error occurred while checking lead status";
            log:printError(customErr, isLeadUser, email = userInfo.email);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }

        if isLeadUser {
            privileges.push(authorization:LEAD_PRIVILEGE);
        }
        return {...employeeBasicInfo, privileges};
    }

    # Validate EPF uniqueness.
    #
    # + payload - EPF validation payload
    # + return - Whether the EPF already exists, or HTTP errors
    resource function post employees/validate\-epf(http:RequestContext ctx, database:EpfValidationPayload payload)
        returns database:EpfValidationResponse|http:Forbidden|http:BadRequest|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: ERROR_USER_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_ROLE], userInfo.groups) {
            log:printWarn("User is not authorized to validate EPF", invokerEmail = userInfo.email);
            return <http:Forbidden>{
                body: {
                    message: "You are not authorized to validate EPF"
                }
            };
        }

        string trimmedEpf = payload.epf.trim();
        if trimmedEpf == "" {
            string customErr = "EPF validation failed: EPF cannot be empty";
            log:printWarn(customErr);
            return <http:BadRequest>{
                body: {
                    message: customErr
                }
            };
        }

        string|error? employeeId = database:getEmployeeIdByEpf(trimmedEpf);
        if employeeId is error {
            string customErr = "Error occurred while validating EPF uniqueness";
            log:printError(customErr, employeeId, epf = trimmedEpf);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }

        return {epfExists: employeeId is string};
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

        boolean hasAdminAccess = authorization:checkPermissions([authorization:authorizedRoles.ADMIN_ROLE], userInfo.groups);
        boolean isSelf = employeeInfo != () && employeeInfo.workEmail == userInfo.email;
        if !hasAdminAccess && !isSelf {
            boolean|error isSubordinate = database:isSubordinateOfLead(userInfo.email, employeeId);
            if isSubordinate is error {
                string customErr = string `Error occurred while checking lead authorization for ID: ${employeeId}`;
                log:printError(customErr, isSubordinate, employeeId = employeeId);
                return <http:InternalServerError>{body: {message: customErr}};
            }
            if !isSubordinate {
                log:printWarn("User is not authorized to view this employee's information", invokerEmail = userInfo.email);
                return <http:Forbidden>{body: {message: "You are not authorized to view this employee's information"}};
            }
        }

        if employeeInfo is () {
            string customErr = "Employee information not found";
            log:printWarn(customErr, employeeId = employeeId);
            return <http:NotFound>{body: {message: customErr}};
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

        boolean hasAdminAccess = authorization:checkPermissions([authorization:authorizedRoles.ADMIN_ROLE], userInfo.groups);
        boolean isSelf = employeeInfo != () && employeeInfo.workEmail == userInfo.email;
        if !hasAdminAccess && !isSelf {
            boolean|error isSubordinate = database:isSubordinateOfLead(userInfo.email, employeeId);
            if isSubordinate is error {
                string customErr = string `Error occurred while checking lead authorization for ID: ${employeeId}`;
                log:printError(customErr, isSubordinate, employeeId = employeeId);
                return <http:InternalServerError>{body: {message: customErr}};
            }
            if !isSubordinate {
                log:printWarn("User is not authorized to view this employee's information", invokerEmail = userInfo.email);
                return <http:Forbidden>{body: {message: "You are not authorized to view this employee's information"}};
            }
        }

        if employeeInfo is () {
            string customErr = "Employee information not found";
            log:printWarn(customErr, employeeId = employeeId);
            return <http:NotFound>{body: {message: customErr}};
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

    # Generate a QR code PNG for a single employee.
    # Non-admins may only request their own QR code or that of a subordinate.
    #
    # + employeeId - Employee ID to generate QR for
    # + return - PNG binary, or HTTP errors
    resource function get employees/[string employeeId]/qr\-code(http:RequestContext ctx)
            returns byte[]|http:Forbidden|http:BadRequest|http:NotFound|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{body: {message: ERROR_USER_INFORMATION_HEADER_NOT_FOUND}};
        }

        boolean hasQrExportAccess
                = authorization:checkPermissions([authorization:authorizedRoles.ADMIN_ROLE], userInfo.groups)
                || authorization:checkPermissions([authorization:authorizedRoles.SERVICE_DESK_ROLE], userInfo.groups);

        database:Employee|error? employee = database:getEmployeeInfo(employeeId);
        if employee is error {
            string customErr = string `Error fetching employee: ${employeeId}`;
            log:printError(customErr, employee, employeeId = employeeId);
            return <http:InternalServerError>{body: {message: customErr}};
        }
        if employee is () {
            return <http:NotFound>{body: {message: string `Employee not found: ${employeeId}`}};
        }

        if !hasQrExportAccess {
            boolean isSelf = employee.workEmail == userInfo.email;
            if !isSelf {
                boolean|error isSubordinate = database:isSubordinateOfLead(userInfo.email, employeeId);
                if isSubordinate is error {
                    string customErr = string `Error checking authorization for employee: ${employeeId}`;
                    log:printError(customErr, isSubordinate, employeeId = employeeId);
                    return <http:InternalServerError>{body: {message: customErr}};
                }
                if !isSubordinate {
                    log:printWarn("User is not authorized to generate QR for this employee",
                            invokerEmail = userInfo.email);
                    return <http:Forbidden>{
                        body: {message: "You are not authorized to generate a QR code for this employee"}
                    };
                }
            }
        }

        string? house = employee.house;
        if house is () {
            return <http:BadRequest>{
                body: {
                    message: string `Employee ${employeeId} has no house assigned`
                }
            };
        }

        byte[]|error imageBytes = qr:generateEmployeeQrCode({
                                                                employeeNumber: employee.employeeId,
                                                                firstName: employee.firstName,
                                                                lastName: employee.lastName,
                                                                house
                                                            });
        if imageBytes is error {
            string customErr = "Error occurred while generating QR code";
            log:printError(customErr, imageBytes);
            return <http:InternalServerError>{body: {message: customErr}};
        }
        return imageBytes;
    }

    # Fetch managers.
    #
    # + return - List of managers or error response
    resource function get employees/managers(http:RequestContext ctx)
        returns database:Manager[]|http:InternalServerError|http:Forbidden {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: ERROR_USER_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        boolean hasAdminAccess
            = authorization:checkPermissions([authorization:authorizedRoles.ADMIN_ROLE], userInfo.groups);

        if !hasAdminAccess {
            boolean|error isLeadUser = database:isLead(userInfo.email);
            if isLeadUser is error {
                string customErr = "Error occurred while checking lead status";
                log:printError(customErr, isLeadUser, email = userInfo.email);
                return <http:InternalServerError>{body: {message: customErr}};
            }
            if !isLeadUser {
                log:printWarn("User is not authorized to view managers", invokerEmail = userInfo.email);
                return <http:Forbidden>{body: {message: "You are not authorized to view managers"}};
            }
        }

        database:Manager[]|error managers = database:getManagers();
        if managers is error {
            string customErr = "Error occurred while fetching managers";
            log:printError(customErr, managers);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }
        return managers;
    }

    # Fetch employees based on filters.
    #
    # + payload - Get employees filter payload
    # + return - List of employees or error response
    resource function post employees/search(http:RequestContext ctx, database:EmployeeSearchPayload payload)
        returns http:Ok|http:InternalServerError|http:BadRequest|http:Forbidden {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: ERROR_USER_INFORMATION_HEADER_NOT_FOUND
                }
            };
        }

        boolean hasAdminAccess
            = authorization:checkPermissions([authorization:authorizedRoles.ADMIN_ROLE], userInfo.groups);

        string sortField = payload.sort.sortField;
        if !database:EmployeeSortField.hasKey(sortField) {
            string customErr = string `Invalid sort field ${sortField}`;
            log:printWarn(customErr, sortField = sortField);
            return <http:BadRequest>{
                body: {
                    message: customErr
                }
            };
        }

        string sortOrder = payload.sort.sortOrder;
        if !database:SortOrder.hasKey(sortOrder) {
            string customErr = string `Invalid sort order ${sortOrder}`;
            log:printWarn(customErr, sortOrder = sortOrder);
            return <http:BadRequest>{
                body: {
                    message: customErr
                }
            };
        }

        if hasAdminAccess && !payload.leadOnly {
            database:EmployeesResponse|error employees = database:getEmployees(payload);
            if employees is error {
                string customErr = "Error occurred while fetching employees";
                log:printError(customErr, employees);
                return <http:InternalServerError>{
                    body: {
                        message: customErr
                    }
                };
            }
            return <http:Ok>{body: employees};
        }

        // Lead path: verify the caller manages at least one employee.
        boolean|error isLeadUser = database:isLead(userInfo.email);
        if isLeadUser is error {
            string customErr = "Error occurred while fetching employees";
            log:printError(customErr, isLeadUser);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }
        if !isLeadUser {
            log:printWarn("User is not authorized to view employee list", invokerEmail = userInfo.email);
            return <http:Forbidden>{
                body: {
                    message: "You are not authorized to view employee list"
                }
            };
        }

        // Lead: results restricted to their subordinates.
        database:EmployeesResponse|error employees = database:getEmployees(payload, userInfo.email);
        if employees is error {
            string customErr = "Error occurred while fetching employees";
            log:printError(customErr, employees);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }
        return <http:Ok>{body: employees};
    }

    # Search employees for QR code export.
    #
    # + payload - QR code search payload
    # + return - Lean employee list for QR export, or HTTP errors
    resource function post reports/qr\-codes/search(http:RequestContext ctx, database:QrCodeSearchPayload payload)
            returns http:Ok|http:InternalServerError|http:BadRequest|http:Forbidden {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {message: ERROR_USER_INFORMATION_HEADER_NOT_FOUND}
            };
        }

        boolean hasQrSearchAccess
            = authorization:checkPermissions([authorization:authorizedRoles.ADMIN_ROLE], userInfo.groups)
            || authorization:checkPermissions([authorization:authorizedRoles.SERVICE_DESK_ROLE], userInfo.groups);

        if !hasQrSearchAccess {
            log:printWarn("User is not authorized to search employees for QR export",
                    invokerEmail = userInfo.email);
            return <http:Forbidden>{
                body: {message: "You are not authorized to search employees for QR export"}
            };
        }

        if !database:EmployeeSortField.hasKey(payload.sort.sortField) {
            string customErr = "Invalid sort field: " + payload.sort.sortField;
            log:printWarn(customErr, sortField = payload.sort.sortField);
            return <http:BadRequest>{
                body: {message: customErr}
            };
        }

        if !database:SortOrder.hasKey(payload.sort.sortOrder) {
            string customErr = "Invalid sort order: " + payload.sort.sortOrder;
            log:printWarn(customErr, sortOrder = payload.sort.sortOrder);
            return <http:BadRequest>{
                body: {message: customErr}
            };
        }

        database:EmployeesResponse|error result = database:getEmployees({
                                                                            searchString: payload.searchString,
                                                                            filters: {employeeStatus: payload.filters.employeeStatus},
                                                                            pagination: payload.pagination,
                                                                            sort: payload.sort
                                                                        });
        if result is error {
            string customErr = "Error occurred while fetching employees for QR export";
            log:printError(customErr, result);
            return <http:InternalServerError>{
                body: {message: customErr}
            };
        }
        database:EmployeeQrInfo[] qrInfoList = from database:Employee e in result.employees
            select {
                employeeId: e.employeeId,
                firstName: e.firstName,
                lastName: e.lastName,
                workEmail: e.workEmail,
                employeeThumbnail: e.employeeThumbnail,
                house: e.house,
                houseId: e.houseId,
                employeeStatus: e.employeeStatus
            };
        return <http:Ok>{
            body: {
                employees: qrInfoList,
                totalCount: result.totalCount
            }
        };
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

        boolean hasAdminAccess = authorization:checkPermissions([authorization:authorizedRoles.ADMIN_ROLE], userInfo.groups);
        if !hasAdminAccess {
            log:printWarn("User is not authorized to view continuous service records", invokerEmail = userInfo.email);
            return <http:Forbidden>{
                body: {
                    message: "You are not authorized to view continuous service records"
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
    resource function get employees/basic\-info(http:RequestContext ctx)
        returns database:EmployeeBasicInfo[]|http:Forbidden|http:InternalServerError {

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
            log:printWarn("User is not authorized to view employees basic information", invokerEmail = userInfo.email);
            return <http:Forbidden>{
                body: {
                    message: "You are not authorized to view employees basic information"
                }
            };
        }

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

    # Get full organization structure.
    #
    # + return - Full organization structure
    resource function get organization\-structure() returns database:OrgStructureBusinessUnit[]|http:InternalServerError {
        database:OrgStructureBusinessUnit[]|error orgStructure = database:getFullOrganizationStructure();
        if orgStructure is error {
            string customErr = "Error while fetching organization structure";
            log:printError(customErr, orgStructure);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }
        return orgStructure;
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

    # Get companies.
    #
    # + return - Companies
    resource function get companies() returns database:CompanyResponse[]|http:InternalServerError {
        database:CompanyResponse[]|error companies = database:getCompanies();
        if companies is error {
            string customErr = "Error while fetching Companies";
            log:printError(customErr, companies);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }
        return companies;
    }

    # Get offices.
    #
    # + companyId - Company ID (optional)
    # + return - Offices
    resource function get offices(int? companyId = ()) returns database:Office[]|http:InternalServerError {
        database:Office[]|error offices = database:getOffices(companyId);
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

    # Get houses.
    #
    # + ctx - Request context
    # + return - Houses
    resource function get houses(http:RequestContext ctx)
        returns database:House[]|http:Forbidden|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{body: {message: ERROR_USER_INFORMATION_HEADER_NOT_FOUND}};
        }
        if !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_ROLE], userInfo.groups) {
            log:printWarn("User is not authorized to view houses", invokerEmail = userInfo.email);
            return <http:Forbidden>{body: {message: "You are not authorized to view houses"}};
        }
        database:House[]|error houses = database:getHouses();
        if houses is error {
            string customError = "Error while fetching Houses";
            log:printError(customError, houses);
            return <http:InternalServerError>{body: {message: customError}};
        }
        return houses;
    }

    # Get the house with the fewest active employees.
    #
    # + ctx - Request context
    # + return - The suggested house, 404 if none found, or 500 on error
    resource function get houses/suggested(http:RequestContext ctx) returns database:House|http:Forbidden|http:NotFound|http:InternalServerError {
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{body: {message: ERROR_USER_INFORMATION_HEADER_NOT_FOUND}};
        }
        if !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_ROLE], userInfo.groups) {
            log:printWarn("User is not authorized to view suggested house", invokerEmail = userInfo.email);
            return <http:Forbidden>{body: {message: "You are not authorized to view suggested house"}};
        }
        database:House|error? house = database:getHouseWithLeastActiveEmployees();
        if house is error {
            log:printError("Error while fetching suggested house", house);
            return <http:InternalServerError>{body: {message: "Error while fetching suggested house"}};
        }
        if house is () {
            return <http:NotFound>{body: {message: "No active houses found"}};
        }
        return house;
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

        string? epfOpt = payload.epf;
        if epfOpt is string && epfOpt.trim() != "" {
            string|error? existingEmp = database:getEmployeeIdByEpf(epfOpt);
            if existingEmp is error {
                string customErr = "Error occurred while validating EPF uniqueness";
                log:printError(customErr, existingEmp, epf = epfOpt);
                return <http:InternalServerError>{
                    body: {
                        message: ERROR_EMPLOYEE_CREATION_FAILED
                    }
                };
            }
            if existingEmp is string {
                string customErr = "EPF already exists";
                log:printWarn(customErr, epf = epfOpt);
                return <http:BadRequest>{
                    body: {
                        message: customErr
                    }
                };
            }
        }

        string|http:BadRequest|http:InternalServerError generatedEmployeeId = generateEmployeeId(payload);
        if generatedEmployeeId is http:BadRequest|http:InternalServerError {
            return generatedEmployeeId;
        }
        string employeeId = generatedEmployeeId;

        int|error newEmployeeId = database:addEmployee(payload, userInfo.email, employeeId);
        if newEmployeeId is error {
            log:printError(ERROR_EMPLOYEE_CREATION_FAILED, newEmployeeId);
            return <http:InternalServerError>{
                body: {
                    message: ERROR_EMPLOYEE_CREATION_FAILED
                }
            };
        }
        return newEmployeeId;

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
                payload.fullName is string ||
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

        error? updateResult = database:updateEmployeePersonalInfo(employeeId, payload, userInfo.email);
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
        returns http:Ok|http:NotFound|http:Forbidden|http:BadRequest|http:InternalServerError {

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

        string? epfOpt = payload.epf;
        if epfOpt is string && epfOpt.trim() != "" {
            string|error? existingEmp = database:getEmployeeIdByEpf(epfOpt);
            if existingEmp is error {
                string customErr = "Error occurred while validating EPF uniqueness for update";
                log:printError(customErr, existingEmp, epf = epfOpt);
                return <http:InternalServerError>{
                    body: {
                        message: ERROR_EMPLOYEE_INFO_UPDATE_FAILED
                    }
                };
            }
            if existingEmp is string && existingEmp != employeeId {
                string customErr = "EPF already exists for another employee";
                log:printWarn(customErr, epf = epfOpt, employeeId = employeeId);
                return <http:BadRequest>{
                    body: {
                        message: customErr
                    }
                };
            }
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
            database:VehicleStatus? vehicleStatus, database:VehicleTypes? vehicleType, int? offset, int? 'limit)
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
                vehicleType = vehicleType,
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
                                                                vehicleId,
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

    # Get car park configs.
    #
    # + return - Car park configs or error response
    resource function get parkings/configs(http:RequestContext ctx)
        returns CarParkConfigResponse|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {message: ERROR_USER_INFORMATION_HEADER_NOT_FOUND}
            };
        }
        return {
            publicWalletAddress: wso2_coin:masterWalletAddress,
            reservationWindowStartHour: wso2_coin:reservationWindowStartHour,
            reservationWindowEndHour: wso2_coin:reservationWindowEndHour
        };
    }

    # List parking floors.
    #
    # + return - List of parking floors or error response
    resource function get parkings/floors(http:RequestContext ctx)
        returns database:ParkingFloor[]|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {message: ERROR_USER_INFORMATION_HEADER_NOT_FOUND}
            };
        }

        database:ParkingFloor[]|error floors = database:getParkingFloors();
        if floors is error {
            log:printError("Error fetching parking floors", floors);
            return <http:InternalServerError>{
                body: {message: "Error occurred while fetching parking floors."}
            };
        }
        return floors;
    }

    # List parking slots for a floor with availability for a given date.
    #
    # + id - Floor identifier
    # + date - Booking date
    # + return - List of parking slots with availability status or error response
    resource function get parkings/floors/[int id]/slots(http:RequestContext ctx, string date)
        returns database:ParkingSlot[]|http:InternalServerError|http:BadRequest {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {message: ERROR_USER_INFORMATION_HEADER_NOT_FOUND}
            };
        }

        if !regex:matches(date, database:DATE_PATTERN_STRING) {
            return <http:BadRequest>{
                body: {message: "Query parameter 'date' must be in YYYY-MM-DD format."}
            };
        }

        database:ParkingSlot[]|error slots = database:getParkingSlotsByFloor(id, date,
                wso2_coin:pendingReservationExpiryMinutes);
        if slots is error {
            log:printError("Error fetching parking slots", slots);
            return <http:InternalServerError>{
                body: {message: "Error occurred while fetching parking slots."}
            };
        }
        return slots;
    }

    # Create a parking reservation.
    #
    # + body - Reservation creation details
    # + return - Reservation ID and amount to be paid in coins, or error response
    resource function post parkings/reservations(http:RequestContext ctx, CreateParkingReservationRequest body)
        returns CreateParkingReservationResponse|http:InternalServerError|http:BadRequest|http:Forbidden {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {message: ERROR_USER_INFORMATION_HEADER_NOT_FOUND}
            };
        }

        time:Utc nowUtc = time:utcNow();
        string today;
        int hour;
        time:Zone? sriLankaZone = time:getZone("Asia/Colombo");
        if sriLankaZone is time:Zone {
            time:Civil civil = sriLankaZone.utcToCivil(nowUtc);
            string|error civilStr = time:civilToString(civil);
            today = civilStr is string ? civilStr.substring(0, 10) : time:utcToString(time:utcAddSeconds(nowUtc, 19800)).substring(0, 10);
            hour = civil.hour;
        } else {
            time:Utc slTime = time:utcAddSeconds(nowUtc, 19800);
            today = time:utcToString(slTime).substring(0, 10);
            string hourStr = time:utcToString(slTime).substring(11, 13);
            int|error parsedHour = int:fromString(hourStr);
            hour = parsedHour is int ? parsedHour : 0;
        }
        if hour < wso2_coin:reservationWindowStartHour || hour >= wso2_coin:reservationWindowEndHour {
            return <http:BadRequest>{
                body: {
                    message: string `Reservations are only allowed from ${wso2_coin:reservationWindowStartHour}:00 to ${wso2_coin:reservationWindowEndHour}:00.`
                }
            };
        }
        if body.bookingDate != today {
            return <http:BadRequest>{
                body: {message: "Reservations are only allowed for the same day. Use date " + today + "."}
            };
        }

        string|error? vehicleOwner = database:getVehicleOwner(body.vehicleId);
        if vehicleOwner is error {
            log:printError("Error fetching vehicle owner", vehicleOwner);
            return <http:InternalServerError>{
                body: {message: "Error occurred while validating vehicle."}
            };
        }
        if vehicleOwner is () || vehicleOwner != userInfo.email {
            return <http:Forbidden>{
                body: {message: "Vehicle not found or you are not the owner. Use one of your registered (active) vehicles."}
            };
        }

        database:ParkingSlot|error? slot = database:getParkingSlotById(body.slotId);
        if slot is error {
            log:printError("Error fetching slot for reservation", slot);
            return <http:InternalServerError>{
                body: {message: "Error occurred while validating slot."}
            };
        }
        if slot is () {
            return <http:BadRequest>{
                body: {message: string `Parking slot '${body.slotId}' not found.`}
            };
        }

        // Expire stale pending reservations so the slot/date becomes reusable.
        boolean|error cleared = database:expireStalePendingParkingReservationForSlotDate(body.slotId, body.bookingDate,
                wso2_coin:pendingReservationExpiryMinutes);
        if cleared is error {
            log:printError("Error expiring stale pending reservations", cleared);
            return <http:InternalServerError>{
                body: {message: "Error occurred while validating slot availability."}
            };
        }

        boolean|error booked = database:isParkingSlotBookedForDate(body.slotId, body.bookingDate,
                wso2_coin:pendingReservationExpiryMinutes);
        if booked is error {
            log:printError("Error checking slot availability", booked);
            return <http:InternalServerError>{
                body: {message: "Error occurred while checking slot availability."}
            };
        }
        if booked {
            return <http:BadRequest>{
                body: {
                    message: string `Slot ${body.slotId} is unavailable for ${body.bookingDate}. `
                        + "It may be temporarily reserved or already booked."
                }
            };
        }

        // Insert a new PENDING row
        int|error reservationId = database:addParkingReservation({
                                                                     slotId: body.slotId,
                                                                     bookingDate: body.bookingDate,
                                                                     employeeEmail: userInfo.email,
                                                                     vehicleId: body.vehicleId,
                                                                     coinsAmount: slot.coinsPerSlot,
                                                                     createdBy: userInfo.email
                                                                 });
        if reservationId is error {
            log:printError("Error creating parking reservation", reservationId);
            return <http:InternalServerError>{
                body: {message: "Error occurred while creating reservation."}
            };
        }

        return {
            reservationId,
            coinsAmount: slot.coinsPerSlot
        };
    }

    # Get current user's parking reservations.
    #
    # + fromDate - Filter reservations from this date
    # + toDate - Filter reservations up to this date
    # + return - List of parking reservations or error response
    resource function get parkings/reservations(http:RequestContext ctx, string? fromDate, string? toDate)
        returns database:ParkingReservationDetails[]|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {message: ERROR_USER_INFORMATION_HEADER_NOT_FOUND}
            };
        }

        database:ParkingReservationDetails[]|error list = database:getParkingReservationsByEmployee(
                userInfo.email, fromDate, toDate);
        if list is error {
            log:printError("Error fetching parking reservations", list);
            return <http:InternalServerError>{
                body: {message: "Error occurred while fetching reservations."}
            };
        }
        return list;
    }

    # Get a single reservation.
    #
    # + id - Reservation identifier
    # + return - Parking reservation details or error response
    resource function get parkings/reservations/[int id](http:RequestContext ctx)
        returns database:ParkingReservationDetails|http:InternalServerError|http:Forbidden {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {message: ERROR_USER_INFORMATION_HEADER_NOT_FOUND}
            };
        }

        database:ParkingReservationDetails|error? reservation = database:getParkingReservationById(id);
        if reservation is error {
            log:printError("Error fetching parking reservation", reservation);
            return <http:InternalServerError>{
                body: {message: "Error occurred while fetching reservation."}
            };
        }
        if reservation is () || reservation.employeeEmail != userInfo.email {
            return <http:Forbidden>{
                body: {message: "You are not allowed to view this reservation."}
            };
        }
        return reservation;
    }

    # Export employees as a CSV file, optionally filtered by status.
    #
    # + payload - Report generation options (status filter, future-joiner exclusion, marked-leaver inclusion)
    # + return - CSV file response or HTTP errors
    resource function post reports/employees/generate(http:RequestContext ctx,
        @http:Payload database:EmployeeReportPayload payload)
        returns http:Response|http:Forbidden|http:InternalServerError {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {message: ERROR_USER_INFORMATION_HEADER_NOT_FOUND}
            };
        }
        if !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_ROLE], userInfo.groups) {
            log:printWarn("User is not authorized to access reports", invokerEmail = userInfo.email);
            return <http:Forbidden>{
                body: {message: "You are not authorized to access reports"}
            };
        }

        database:Employee[] allEmployees = [];
        boolean fetchMore = true;
        int offset = 0;

        while fetchMore {
            database:EmployeesResponse|error pageResult = database:getEmployees({
                searchString: (),
                filters: payload.filters,
                pagination: {'limit: database:DEFAULT_LIMIT, offset: offset},
                sort: {sortField: "employeeId", sortOrder: "ASC"}
            });
            if pageResult is error {
                log:printError("Error fetching employees for report", pageResult);
                return <http:InternalServerError>{
                    body: {message: "Error generating report"}
                };
            }
            allEmployees.push(...pageResult.employees);
            if pageResult.employees.length() < database:DEFAULT_LIMIT {
                fetchMore = false;
            }
            offset += database:DEFAULT_LIMIT;
        }

        map<string>|error nameMap = database:getEmployeeEmailToNameMap();
        if nameMap is error {
            log:printError("Error fetching employee name map for report", nameMap);
            return <http:InternalServerError>{
                body: {message: "Error generating report"}
            };
        }

        string csvContent = payload.filters.employeeStatus == database:EMPLOYEE_LEFT
            ? database:buildResignationCsv(allEmployees, nameMap, payload.columns)
            : database:buildEmployeeCsv(allEmployees, nameMap, payload.columns);
        string? filterStatus = payload.filters.employeeStatus;
        string statusLabel = filterStatus is () ? "all" : re ` `.replaceAll(filterStatus.toLowerAscii(), "_");
        string filename = statusLabel + "_employees_report_" + time:utcToString(time:utcNow()).substring(0, 10) + ".csv";

        http:Response response = new;
        response.setHeader("Content-Type", "text/csv");
        response.setHeader("Content-Disposition", string `attachment; filename="${filename}"`);
        response.setTextPayload(csvContent);
        return response;
    }

    # Confirm parking reservation with transaction hash.
    #
    # + body - Request containing transaction hash and optional reservation ID
    # + return - Reservation details with CONFIRMED status or error response
    resource function post parkings/reservations/confirm(http:RequestContext ctx, ConfirmParkingReservationRequest body)
        returns database:ParkingReservationDetails|http:BadRequest|http:InternalServerError|http:Forbidden {

        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {message: ERROR_USER_INFORMATION_HEADER_NOT_FOUND}
            };
        }

        database:ParkingReservationDetails|error? reservation = database:getParkingReservationById(body.reservationId);

        if reservation is error {
            log:printError("Error fetching reservation", reservation);
            return <http:InternalServerError>{
                body: {message: "Error occurred while confirming reservation."}
            };
        }
        if reservation is () || reservation.employeeEmail != userInfo.email {
            return <http:Forbidden>{
                body: {message: "You are not allowed to confirm this reservation."}
            };
        }

        if reservation.status != database:PENDING {
            return <http:BadRequest>{
                body: {message: string `Reservation is already ${reservation.status.toString()}. Cannot confirm.`}
            };
        }

        // Prevent reuse of the same blockchain transaction hash across multiple reservations.
        database:ReservationIdRow|error? existingTx =
            database:getParkingReservationByTransactionHash(body.transactionHash);
        if existingTx is error {
            log:printError("Error checking transaction hash reuse", existingTx);
            return <http:InternalServerError>{
                body: {message: "Error occurred while verifying transaction hash."}
            };
        }
        if existingTx is database:ReservationIdRow && existingTx.id != reservation.id {
            return <http:BadRequest>{
                body: {message: "This transaction hash has already been used for another reservation."}
            };
        }

        error? confirmErr = wso2_coin:confirmTransaction(body.transactionHash, wso2_coin:masterWalletAddress,
                reservation.coinsAmount);
        if confirmErr is error {
            log:printError("Error confirming transaction", confirmErr);
            return <http:BadRequest>{
                body: {message: "Transaction verification failed."}
            };
        }

        boolean|error updated = database:updateParkingReservationStatus({
                                                                            reservationId: reservation.id,
                                                                            status: database:CONFIRMED,
                                                                            transactionHash: body.transactionHash,
                                                                            updatedBy: userInfo.email
                                                                        });
        if updated is error {
            log:printError("Error confirming reservation", updated);
            return <http:InternalServerError>{
                body: {message: "Error occurred while confirming reservation."}
            };
        }
        if !updated {
            return <http:InternalServerError>{
                body: {message: "Failed to update reservation status."}
            };
        }

        database:ParkingReservationDetails|error? confirmedReservation = database:getParkingReservationById(reservation.id);
        if confirmedReservation is error || confirmedReservation is () {
            log:printError("Error fetching confirmed reservation", confirmedReservation);
            return <http:InternalServerError>{
                body: {message: "Reservation confirmed but failed to fetch updated details."}
            };
        }

        // Append to Google Sheet.
        error? sheetErr = wso2_coin:appendParkingReservation(confirmedReservation);
        if sheetErr is error {
            log:printError("Failed to append parking reservation to Google Sheet", sheetErr,
                    reservationId = confirmedReservation.id);
        }

        return confirmedReservation;
    }

    # Get organization details (full hierarchy with business units, teams, sub-teams, units).
    #
    # + return - Organization hierarchy with head, functional lead, and headcount per node
    resource function get organization(http:RequestContext ctx)
        returns http:InternalServerError|OrgCompany {

        OrgCompany|error orgStructure = database:getOrganizationDetails();
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

    # Add new BusinessUnit.
    #
    # + payload - Business-unit details
    # + return - HTTP Created on success, or HTTP errors on failure 
    resource function post organization/business\-units(http:RequestContext ctx, CreateBusinessUnitPayload payload)
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

        if !nameUniqueness {
            return <http:BadRequest>{
                body: {
                    message: "Business unit name already exists"
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

    # Create a new Team, and optionally map it to a BusinessUnit.
    #
    # + payload - Team details & optional BusinessUnit mapping info
    # + return - HTTP Created on success, or HTTP errors on failure
    resource function post organization/teams(http:RequestContext ctx, CreateTeamPayload payload)
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

        if !nameUniqueness {
            return <http:BadRequest>{
                body: {
                    message: "Team name already exists"
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
        string workEmail = validatedUserInfo.email;
        CreateBusinessUnitTeamPayload? businessUnit = payload.businessUnit;
        if businessUnit is CreateBusinessUnitTeamPayload {
            boolean|error buExists = database:businessUnitExists(businessUnit.businessUnitId);
            if buExists is error {
                log:printError("Error while validating business unit",
                        buExists, businessUnitId = businessUnit.businessUnitId);
                return <http:InternalServerError>{
                    body: {message: "Error while validating the business unit"}
                };
            }

            if !buExists {
                return <http:BadRequest>{
                    body: {message: string `Business unit with ID ${businessUnit.businessUnitId} not found`}
                };
            }

            string? functionalLeadEmail = businessUnit.functionalLeadEmail;
            if functionalLeadEmail is string {
                EmployeeBasicInfo|error? leadsBasicInfo = database:getEmployeeBasicInfo(functionalLeadEmail);
                if leadsBasicInfo is error {
                    return <http:InternalServerError>{
                        body: {
                            message: "Error while validating functional lead's email"
                        }
                    };
                }

                if leadsBasicInfo is () {
                    return <http:BadRequest>{
                        body: {
                            message: "No functional lead is found for given email"
                        }
                    };
                }
            }

            int|error result = database:addTeamWithMapping(
                    workEmail,
                    {name: payload.name, headEmail: payload.headEmail, businessUnit}
            );

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

    # Create a new SubTeam, and optionally map it to a BusinessUnit-Team.
    #
    # + payload - SubTeam details & optional BusinessUnit-team mapping info
    # + return - HTTP Created on success, or HTTP errors on failure
    resource function post organization/sub\-teams(http:RequestContext ctx, CreateSubTeamPayload payload)
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

        if !nameUniqueness {
            return <http:BadRequest>{
                body: {
                    message: "Sub-team name already exists"
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

        string workEmail = validatedUserInfo.email;
        CreateBusinessUnitTeamSubTeamPayload? businessUnitTeam = payload.businessUnitTeam;
        if businessUnitTeam is CreateBusinessUnitTeamSubTeamPayload {
            boolean|error buTeamMappingExists =
                database:businessUnitTeamMappingExists(businessUnitTeam.businessUnitTeamId);

            if buTeamMappingExists is error {
                log:printError("Error while validating business unit-team mapping", buTeamMappingExists,
                        businessUnitTeamId = businessUnitTeam.businessUnitTeamId);
                return <http:InternalServerError>{
                    body: {message: "Error while validating the business unit-team mapping"}
                };
            }

            if !buTeamMappingExists {
                return <http:BadRequest>{
                    body: {
                        message:
                            string `Business unit-team mapping with ID ${businessUnitTeam.businessUnitTeamId} not found`
                    }
                };
            }

            string? functionalLeadEmail = businessUnitTeam.functionalLeadEmail;
            if functionalLeadEmail is string {
                EmployeeBasicInfo|error? leadsBasicInfo = database:getEmployeeBasicInfo(functionalLeadEmail);
                if leadsBasicInfo is error {
                    return <http:InternalServerError>{
                        body: {
                            message: "Error while validating functional lead's email"
                        }
                    };
                }

                if leadsBasicInfo is () {
                    return <http:BadRequest>{
                        body: {
                            message: "No functional lead is found for given email"
                        }
                    };
                }
            }

            int|error result = database:addSubTeamWithMapping(
                    workEmail,
                    {name: payload.name, headEmail: payload.headEmail, businessUnitTeam}
            );

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

    # Create a new Unit, and optionally map it to a BusinessUnit-Team-SubTeam.
    #
    # + payload - Unit details & optional BusinessUnit-team-sub-team mapping info
    # + return - HTTP Created on success, or HTTP errors on failure
    resource function post organization/units(http:RequestContext ctx, CreateUnitPayload payload)
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

        if !nameUniqueness {
            return <http:BadRequest>{
                body: {
                    message: "Unit name already exists"
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

        string workEmail = validatedUserInfo.email;
        CreateBusinessUnitTeamSubTeamUnitPayload? businessUnitTeamSubTeamUnit = payload.businessUnitTeamSubTeamUnit;
        if businessUnitTeamSubTeamUnit is CreateBusinessUnitTeamSubTeamUnitPayload {
            boolean|error buTeamSubTeamMappingExists =
                database:businessUnitTeamSubTeamMappingExists(businessUnitTeamSubTeamUnit.businessUnitTeamSubTeamId);

            if buTeamSubTeamMappingExists is error {
                log:printError("Error while validating business unit-team-sub-team mapping",
                        buTeamSubTeamMappingExists,
                        businessUnitTeamSubTeamId = businessUnitTeamSubTeamUnit.businessUnitTeamSubTeamId);
                return <http:InternalServerError>{
                    body: {message: "Error while validating the business unit-team-sub-team mapping"}
                };
            }

            if !buTeamSubTeamMappingExists {
                return <http:BadRequest>{
                    body: {
                        message: string
                            `Business unit-team-sub-team mapping with ID 
                            ${businessUnitTeamSubTeamUnit.businessUnitTeamSubTeamId} not found`
                    }
                };
            }

            string? functionalLeadEmail = businessUnitTeamSubTeamUnit.functionalLeadEmail;
            if functionalLeadEmail is string {
                EmployeeBasicInfo|error? leadsBasicInfo = database:getEmployeeBasicInfo(functionalLeadEmail);
                if leadsBasicInfo is error {
                    return <http:InternalServerError>{
                        body: {
                            message: "Error while validating functional lead's email"
                        }
                    };
                }

                if leadsBasicInfo is () {
                    return <http:BadRequest>{
                        body: {
                            message: "No functional lead is found for given email"
                        }
                    };
                }
            }

            int|error result = database:addUnitWithMapping(
                    workEmail,
                    {name: payload.name, headEmail: payload.headEmail, businessUnitTeamSubTeamUnit}
            );

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

    # Create a BusinessUnit-Team mapping.
    #
    # + payload - BusinessUnit ID, team ID, and functional lead email
    # + return - HTTP Created on success, or HTTP errors on failure
    resource function post organization/business\-unit/team
            (http:RequestContext ctx, CreateBusinessUnitTeamPayload payload)
        returns http:InternalServerError|http:BadRequest|http:Forbidden|http:Created {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        int? teamId = payload.teamId;
        if teamId is () {
            return <http:BadRequest>{
                body: {
                    message: "Team ID is required"
                }
            };
        }

        boolean|error buExists = database:businessUnitExists(payload.businessUnitId);
        if buExists is error {
            log:printError("Error while validating business unit", buExists, businessUnitId = payload.businessUnitId);
            return <http:InternalServerError>{
                body: {message: "Error while validating the business unit"}
            };
        }

        if !buExists {
            return <http:BadRequest>{
                body: {message: string `Business unit with ID ${payload.businessUnitId} not found`}
            };
        }

        boolean|error teamExists = database:teamExists(teamId);
        if teamExists is error {
            log:printError("Error while validating team", teamExists, teamId = teamId);
            return <http:InternalServerError>{
                body: {message: "Error while validating the team"}
            };
        }

        if !teamExists {
            return <http:BadRequest>{
                body: {message: string `Team with ID ${teamId} not found`}
            };
        }

        string? functionalLeadEmail = payload.functionalLeadEmail;
        if functionalLeadEmail is string {
            EmployeeBasicInfo|error? leadsBasicInfo = database:getEmployeeBasicInfo(functionalLeadEmail);
            if leadsBasicInfo is error {
                return <http:InternalServerError>{
                    body: {
                        message: "Error while validating functional lead's email"
                    }
                };
            }

            if leadsBasicInfo is () {
                return <http:BadRequest>{
                    body: {
                        message: "No functional lead is found for given email"
                    }
                };
            }
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

    # Create a BusinessUnit-Team-SubTeam mapping.
    #
    # + payload - BusinessUnit-team ID, sub-team ID, and functional lead email
    # + return - HTTP Created on success, or HTTP errors on failure
    resource function post organization/team/sub\-team
            (http:RequestContext ctx, CreateBusinessUnitTeamSubTeamPayload payload)
        returns http:InternalServerError|http:BadRequest|http:Forbidden|http:Created {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        int? subTeamId = payload.subTeamId;
        if subTeamId is () {
            return <http:BadRequest>{
                body: {
                    message: "Sub-team ID is required"
                }
            };
        }

        boolean|error buTeamMappingExists = database:businessUnitTeamMappingExists(payload.businessUnitTeamId);
        if buTeamMappingExists is error {
            log:printError("Error while validating business unit-team mapping", buTeamMappingExists,
                    businessUnitTeamId = payload.businessUnitTeamId);
            return <http:InternalServerError>{
                body: {message: "Error while validating the business unit-team mapping"}
            };
        }

        if !buTeamMappingExists {
            return <http:BadRequest>{
                body: {
                    message: string `Business unit-team mapping with ID ${payload.businessUnitTeamId} not found`
                }
            };
        }

        boolean|error subTeamExistsResult = database:subTeamExists(subTeamId);
        if subTeamExistsResult is error {
            log:printError("Error while validating sub-team", subTeamExistsResult, subTeamId = subTeamId);
            return <http:InternalServerError>{
                body: {message: "Error while validating the sub-team"}
            };
        }

        if !subTeamExistsResult {
            return <http:BadRequest>{
                body: {message: string `Sub-team with ID ${subTeamId} not found`}
            };
        }

        string? functionalLeadEmail = payload.functionalLeadEmail;
        if functionalLeadEmail is string {
            EmployeeBasicInfo|error? leadsBasicInfo = database:getEmployeeBasicInfo(functionalLeadEmail);
            if leadsBasicInfo is error {
                return <http:InternalServerError>{
                    body: {
                        message: "Error while validating functional lead's email"
                    }
                };
            }

            if leadsBasicInfo is () {
                return <http:BadRequest>{
                    body: {
                        message: "No functional lead is found for given email"
                    }
                };
            }
        }

        string workEmail = validatedUserInfo.email;
        int|error result = database:addBusinessUnitTeamSubTeam(workEmail, payload);
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

    # Create a BusinessUnit-Team-SubTeam-Unit mapping.
    #
    # + payload - BusinessUnit-team-subTeam ID, unit ID, and functional lead email
    # + return - HTTP Created on success, or HTTP errors on failure
    resource function post organization/sub\-team/unit
            (http:RequestContext ctx, CreateBusinessUnitTeamSubTeamUnitPayload payload)
        returns http:InternalServerError|http:BadRequest|http:Forbidden|http:Created {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        int? unitId = payload.unitId;
        if unitId is () {
            return <http:BadRequest>{
                body: {
                    message: "Unit ID is required"
                }
            };
        }

        boolean|error buTeamSubTeamMappingExists =
            database:businessUnitTeamSubTeamMappingExists(payload.businessUnitTeamSubTeamId);
        if buTeamSubTeamMappingExists is error {
            log:printError("Error while validating business unit-team-sub-team mapping", buTeamSubTeamMappingExists,
                    businessUnitTeamSubTeamId = payload.businessUnitTeamSubTeamId);
            return <http:InternalServerError>{
                body: {message: "Error while validating the business unit-team-sub-team mapping"}
            };
        }

        if !buTeamSubTeamMappingExists {
            return <http:BadRequest>{
                body: {
                    message: string
                        `Business unit-team-sub-team mapping with ID ${payload.businessUnitTeamSubTeamId} not found`
                }
            };
        }

        boolean|error unitExistsResult = database:unitExists(unitId);
        if unitExistsResult is error {
            log:printError("Error while validating unit", unitExistsResult, unitId = unitId);
            return <http:InternalServerError>{
                body: {message: "Error while validating the unit"}
            };
        }

        if !unitExistsResult {
            return <http:BadRequest>{
                body: {message: string `Unit with ID ${unitId} not found`}
            };
        }

        string? functionalLeadEmail = payload.functionalLeadEmail;
        if functionalLeadEmail is string {
            EmployeeBasicInfo|error? leadsBasicInfo = database:getEmployeeBasicInfo(functionalLeadEmail);
            if leadsBasicInfo is error {
                return <http:InternalServerError>{
                    body: {
                        message: "Error while validating functional lead's email"
                    }
                };
            }

            if leadsBasicInfo is () {
                return <http:BadRequest>{
                    body: {
                        message: "No functional lead is found for given email"
                    }
                };
            }
        }

        string workEmail = validatedUserInfo.email;
        int|error result = database:addBusinessUnitTeamSubTeamUnit(workEmail, payload);
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

    # Update a BusinessUnit by ID.
    #
    # + buId - ID of the BusinessUnit to update
    # + payload - name or headEmail to update in the BusinessUnit
    # + return - HTTP OK on success, or HTTP errors on failure
    resource function patch organization/business\-unit/[int buId](http:RequestContext ctx, UnitPayload payload)
        returns http:Ok|http:InternalServerError|http:Forbidden|http:BadRequest {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        boolean|error buExists = database:businessUnitExists(buId);
        if buExists is error {
            log:printError("Error while validating business unit", buExists, buId = buId);
            return <http:InternalServerError>{
                body: {message: "Error while validating the business unit"}
            };
        }

        if !buExists {
            return <http:BadRequest>{
                body: {message: string `Business unit with ID ${buId} not found`}
            };
        }

        string workEmail = validatedUserInfo.email;
        if payload.name is () && payload.headEmail is () {
            string customErr = "At least one field should be provided for update";
            log:printWarn(customErr, updatedBy = workEmail);
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

        error? updateResult = database:updateBusinessUnit(
                {
                    ...payload,
                    updatedBy: workEmail
                }, buId);
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

    # Rename a Business Unit by creating a new one with the updated name.
    # This operation:
    # 1. Inserts a new Business Unit with the new name
    # 2. Updates all business_unit_team mappings to use the new BU
    # 3. Updates all active employees to use the new BU
    # 4. Deactivates the old Business Unit
    #
    # + buId - ID of the Business Unit to rename
    # + payload - Payload containing the new name
    # + return - HTTP OK on success, or HTTP errors on failure
    resource function post organization/business\-unit/[int buId]/rename(http:RequestContext ctx,
            RenameBusinessUnitName payload)
        returns http:Ok|http:InternalServerError|http:Forbidden|http:BadRequest {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        boolean|error buExists = database:businessUnitExists(buId);
        if buExists is error {
            log:printError("Error while validating business unit", buExists, buId = buId);
            return <http:InternalServerError>{
                body: {message: "Error while validating the business unit"}
            };
        }

        if !buExists {
            return <http:BadRequest>{
                body: {message: string `Business unit with ID ${buId} not found`}
            };
        }

        string trimmedName = payload.name.trim();
        if trimmedName.length() == 0 {
            return <http:BadRequest>{
                body: {message: "Name cannot be empty"}
            };
        }

        boolean|error buNameExists = database:businessUnitNameExists(trimmedName);
        if buNameExists is error {
            log:printError("Error while checking business unit name", buNameExists);
            return <http:InternalServerError>{
                body: {message: "Error while checking the business unit name"}
            };
        }

        if buNameExists {
            return <http:BadRequest>{
                body: {message: string `Business unit '${trimmedName}' already exists`}
            };
        }

        int|error newBuId = database:renameBusinessUnit({
                                                            businessUnitId: buId,
                                                            name: trimmedName,
                                                            updatedBy: validatedUserInfo.email
                                                        });

        if newBuId is error {
            log:printError("Error while renaming business unit", newBuId, buId = buId);
            return <http:InternalServerError>{
                body: {message: "Error while renaming the business unit"}
            };
        }

        return <http:Ok>{
            body: {
                message: string `Successfully renamed business unit to '${trimmedName}'`,
                newBusinessUnitId: newBuId
            }
        };
    }

    # Rename a Team by creating a new one with the updated name.
    # This operation:
    # 1. Inserts a new Team with the new name
    # 2. Updates all business_unit_team mappings to use the new Team
    # 3. Updates all active employees to use the new Team
    # 4. Deactivates the old Team
    #
    # + teamId - ID of the Team to rename
    # + payload - Payload containing the new name
    # + return - HTTP OK on success, or HTTP errors on failure
    resource function post organization/team/[int teamId]/rename(http:RequestContext ctx,
            RenameTeamName payload)
        returns http:Ok|http:InternalServerError|http:Forbidden|http:BadRequest {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        boolean|error teamExists = database:teamExists(teamId);
        if teamExists is error {
            log:printError("Error while validating team", teamExists, teamId = teamId);
            return <http:InternalServerError>{
                body: {message: "Error while validating the team"}
            };
        }

        if !teamExists {
            return <http:BadRequest>{
                body: {message: string `Team with ID ${teamId} not found`}
            };
        }

        string trimmedName = payload.name.trim();
        if trimmedName.length() == 0 {
            return <http:BadRequest>{
                body: {message: "Name cannot be empty"}
            };
        }

        boolean|error teamNameExists = database:teamNameExists(trimmedName);
        if teamNameExists is error {
            log:printError("Error while checking team name", teamNameExists);
            return <http:InternalServerError>{
                body: {message: "Error while checking the team name"}
            };
        }

        if teamNameExists {
            return <http:BadRequest>{
                body: {message: string `Team '${trimmedName}' already exists`}
            };
        }

        int|error newTeamId = database:renameTeam({
                                                            teamId: teamId,
                                                            name: trimmedName,
                                                            updatedBy: validatedUserInfo.email
                                                        });

        if newTeamId is error {
            log:printError("Error while renaming team", newTeamId, teamId = teamId);
            return <http:InternalServerError>{
                body: {message: "Error while renaming the team"}
            };
        }

        return <http:Ok>{
            body: {
                message: string `Successfully renamed team to '${trimmedName}'`,
                newTeamId: newTeamId
            }
        };
    }

    # Rename a SubTeam by creating a new one with the updated name.
    # This operation:
    # 1. Inserts a new SubTeam with the new name
    # 2. Updates all business_unit_team_sub_team mappings to use the new SubTeam
    # 3. Updates all active employees to use the new SubTeam
    # 4. Deactivates the old SubTeam
    #
    # + subTeamId - ID of the SubTeam to rename
    # + payload - Payload containing the new name
    # + return - HTTP OK on success, or HTTP errors on failure
    resource function post organization/sub\-team/[int subTeamId]/rename(http:RequestContext ctx,
            RenameSubTeamName payload)
        returns http:Ok|http:InternalServerError|http:Forbidden|http:BadRequest {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        boolean|error subTeamExists = database:subTeamExists(subTeamId);
        if subTeamExists is error {
            log:printError("Error while validating sub-team", subTeamExists, subTeamId = subTeamId);
            return <http:InternalServerError>{
                body: {message: "Error while validating the sub-team"}
            };
        }

        if !subTeamExists {
            return <http:BadRequest>{
                body: {message: string `Sub-team with ID ${subTeamId} not found`}
            };
        }

        string trimmedName = payload.name.trim();
        if trimmedName.length() == 0 {
            return <http:BadRequest>{
                body: {message: "Name cannot be empty"}
            };
        }

        boolean|error subTeamNameExists = database:subTeamNameExists(trimmedName);
        if subTeamNameExists is error {
            log:printError("Error while checking sub-team name", subTeamNameExists);
            return <http:InternalServerError>{
                body: {message: "Error while checking the sub-team name"}
            };
        }

        if subTeamNameExists {
            return <http:BadRequest>{
                body: {message: string `Sub-team '${trimmedName}' already exists`}
            };
        }

        int|error newSubTeamId = database:renameSubTeam({
                                                            subTeamId: subTeamId,
                                                            name: trimmedName,
                                                            updatedBy: validatedUserInfo.email
                                                        });

        if newSubTeamId is error {
            log:printError("Error while renaming sub-team", newSubTeamId, subTeamId = subTeamId);
            return <http:InternalServerError>{
                body: {message: "Error while renaming the sub-team"}
            };
        }

        return <http:Ok>{
            body: {
                message: string `Successfully renamed sub-team to '${trimmedName}'`,
                newSubTeamId: newSubTeamId
            }
        };
    }

    # Rename a Unit by creating a new one with the updated name.
    # This operation:
    # 1. Inserts a new Unit with the new name
    # 2. Updates all business_unit_team_sub_team_unit mappings to use the new Unit
    # 3. Updates all active employees to use the new Unit
    # 4. Deactivates the old Unit
    #
    # + unitId - ID of the Unit to rename
    # + payload - Payload containing the new name
    # + return - HTTP OK on success, or HTTP errors on failure
    resource function post organization/unit/[int unitId]/rename(http:RequestContext ctx,
            RenameUnitName payload)
        returns http:Ok|http:InternalServerError|http:Forbidden|http:BadRequest {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        boolean|error unitExists = database:unitExists(unitId);
        if unitExists is error {
            log:printError("Error while validating unit", unitExists, unitId = unitId);
            return <http:InternalServerError>{
                body: {message: "Error while validating the unit"}
            };
        }

        if !unitExists {
            return <http:BadRequest>{
                body: {message: string `Unit with ID ${unitId} not found`}
            };
        }

        string trimmedName = payload.name.trim();
        if trimmedName.length() == 0 {
            return <http:BadRequest>{
                body: {message: "Name cannot be empty"}
            };
        }

        boolean|error unitNameExists = database:unitNameExists(trimmedName);
        if unitNameExists is error {
            log:printError("Error while checking unit name", unitNameExists);
            return <http:InternalServerError>{
                body: {message: "Error while checking the unit name"}
            };
        }

        if unitNameExists {
            return <http:BadRequest>{
                body: {message: string `Unit '${trimmedName}' already exists`}
            };
        }

        int|error newUnitId = database:renameUnit({
                                                            unitId: unitId,
                                                            name: trimmedName,
                                                            updatedBy: validatedUserInfo.email
                                                        });

        if newUnitId is error {
            log:printError("Error while renaming unit", newUnitId, unitId = unitId);
            return <http:InternalServerError>{
                body: {message: "Error while renaming the unit"}
            };
        }

        return <http:Ok>{
            body: {
                message: string `Successfully renamed unit to '${trimmedName}'`,
                newUnitId: newUnitId
            }
        };
    }

    # Update a Team by ID.
    #
    # + teamId - ID of the Team to update
    # + payload - name or headEmail to update in the Team
    # + return - HTTP OK on success, or HTTP errors on failure
    resource function patch organization/team/[int teamId](http:RequestContext ctx, UnitPayload payload)
        returns http:Ok|http:InternalServerError|http:Forbidden|http:BadRequest {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        boolean|error teamExists = database:teamExists(teamId);
        if teamExists is error {
            log:printError("Error while validating team", teamExists, teamId = teamId);
            return <http:InternalServerError>{
                body: {message: "Error while validating the team"}
            };
        }

        if !teamExists {
            return <http:BadRequest>{
                body: {message: string `Team with ID ${teamId} not found`}
            };
        }

        string workEmail = validatedUserInfo.email;
        if payload.name is () && payload.headEmail is () {
            string customErr = "At least one field should be provided for update";
            log:printWarn(customErr, updatedBy = workEmail);
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

        error? updateResult = database:updateTeam({
                                                      ...payload,
                                                      updatedBy: workEmail
                                                  }, teamId);
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

    # Update a SubTeam by ID.
    #
    # + subTeamId - ID of the SubTeam to update
    # + payload - name or headEmail to update in the SubTeam
    # + return - HTTP OK on success, or HTTP errors on failure
    resource function patch organization/sub\-team/[int subTeamId](http:RequestContext ctx, UnitPayload payload)
        returns http:Ok|http:InternalServerError|http:Forbidden|http:BadRequest {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        boolean|error subTeamExists = database:subTeamExists(subTeamId);
        if subTeamExists is error {
            log:printError("Error while validating sub team", subTeamExists, subTeamId = subTeamId);
            return <http:InternalServerError>{
                body: {message: "Error while validating the sub team"}
            };
        }

        if !subTeamExists {
            return <http:BadRequest>{
                body: {message: string `Sub team with ID ${subTeamId} not found`}
            };
        }

        string workEmail = validatedUserInfo.email;
        if payload.name is () && payload.headEmail is () {
            string customErr = "At least one field should be provided for update";
            log:printWarn(customErr, updatedBy = workEmail);
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

        error? updateResult = database:updateSubTeam({
                                                         ...payload,
                                                         updatedBy: workEmail
                                                     }, subTeamId);
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

    # Update a Unit by ID.
    #
    # + unitId - ID of the Unit to update
    # + payload - name or headEmail to update in the Unit
    # + return - HTTP OK on success, or HTTP errors on failure
    resource function patch organization/unit/[int unitId](http:RequestContext ctx, UnitPayload payload)
        returns http:Ok|http:InternalServerError|http:Forbidden|http:BadRequest {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        boolean|error unitExists = database:unitExists(unitId);
        if unitExists is error {
            log:printError("Error while validating unit", unitExists, unitId = unitId);
            return <http:InternalServerError>{
                body: {message: "Error while validating the unit"}
            };
        }

        if !unitExists {
            return <http:BadRequest>{
                body: {message: string `Unit with ID ${unitId} not found`}
            };
        }

        string workEmail = validatedUserInfo.email;
        if payload.name is () && payload.headEmail is () {
            string customErr = "At least one field should be provided for update";
            log:printWarn(customErr, updatedBy = workEmail);
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

        error? updateResult = database:updateUnit({
                                                      ...payload,
                                                      updatedBy: workEmail
                                                  }, unitId);
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

    # Update a BusinessUnit-Team mapping by IDs.
    #
    # + buId - ID of the BusinessUnit
    # + teamId - ID of the Team
    # + payload - functionalLeadEmail to update in the mapping
    # + return - HTTP OK on success, or HTTP errors on failure
    resource function patch organization/business\-unit/[int buId]/team/[int teamId]
            (http:RequestContext ctx, UpdateOrgUnitPayload payload)
        returns http:Ok|http:InternalServerError|http:Forbidden|http:BadRequest {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        boolean|error buExists = database:businessUnitExists(buId);
        if buExists is error {
            log:printError("Error while validating BusinessUnit", buExists, buId = buId);
            return <http:InternalServerError>{
                body: {
                    message: "Error while validating the BusinessUnit"
                }
            };
        }

        if !buExists {
            return <http:BadRequest>{
                body: {
                    message: string `BusinessUnit with ID ${buId} not found`
                }
            };
        }

        boolean|error teamExists = database:teamExists(teamId);
        if teamExists is error {
            log:printError("Error while validating team", teamExists, teamId = teamId);
            return <http:InternalServerError>{
                body: {
                    message: "Error while validating the team"
                }
            };
        }

        if !teamExists {
            return <http:BadRequest>{
                body: {
                    message: string `Team with ID ${teamId} not found`
                }
            };
        }

        string? functionalLead = payload.functionalLeadEmail;
        if functionalLead is string {
            EmployeeBasicInfo|error? leadsBasicInfo = database:getEmployeeBasicInfo(functionalLead);
            if leadsBasicInfo is error {
                return <http:InternalServerError>{
                    body: {
                        message: "Error while validating functional lead's email"
                    }
                };
            }

            if leadsBasicInfo is () {
                return <http:BadRequest>{
                    body: {
                        message: "No functional lead is found for given email"
                    }
                };
            }
        }

        string workEmail = validatedUserInfo.email;
        error|boolean updateResult = database:updateBusinessUnitTeam({...payload, updatedBy: workEmail}, buId, teamId);
        if updateResult is error {
            log:printError("Error while updating BusinessUnit-Team", updateResult, buId = buId, teamId = teamId);
            return <http:InternalServerError>{
                body: {
                    message: "Error while updating the BusinessUnit-Team"
                }
            };
        }

        if !updateResult {
            log:printError(string `
                No BusinessUnit-Team found for businessUnitId ${buId} and teamId ${teamId} to update`);
            return <http:BadRequest>{
                body: {
                    message: string `Unknown error while updating BusinessUnit-Team`
                }
            };
        }

        return <http:Ok>{
            body: {
                message: string `Successfully updated the BusinessUnit-Team`
            }
        };

    }

    # Update a Team-SubTeam mapping by IDs.
    #
    # + businessUnitTeamId - ID of the BusinessUnit-Team
    # + subTeamId - ID of the SubTeam
    # + payload - functionalLeadEmail to update in the mapping
    # + return - HTTP OK on success, or HTTP errors on failure
    resource function patch organization/team/[int businessUnitTeamId]/sub\-team/[int subTeamId]
            (http:RequestContext ctx, UpdateOrgUnitPayload payload)
        returns http:Ok|http:InternalServerError|http:Forbidden|http:BadRequest {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        boolean|error mappingExists = database:businessUnitTeamMappingExists(businessUnitTeamId);
        if mappingExists is error {
            log:printError(
                    "Error while validating BusinessUnit-Team",
                    mappingExists,
                    businessUnitTeamId = businessUnitTeamId
            );
            return <http:InternalServerError>{
                body: {
                    message: "Error while validating the BusinessUnit-Team"
                }
            };
        }

        if !mappingExists {
            return <http:BadRequest>{
                body: {
                    message: string `BusinessUnit-Team with ID ${businessUnitTeamId} not found`
                }
            };
        }

        boolean|error subTeamExists = database:subTeamExists(subTeamId);
        if subTeamExists is error {
            log:printError("Error while validating sub team", subTeamExists, subTeamId = subTeamId);
            return <http:InternalServerError>{
                body: {
                    message: "Error while validating the sub team"
                }
            };
        }

        if !subTeamExists {
            return <http:BadRequest>{
                body: {
                    message: string `Sub team with ID ${subTeamId} not found`
                }
            };
        }

        string? functionalLead = payload.functionalLeadEmail;
        if functionalLead is string {
            EmployeeBasicInfo|error? leadsBasicInfo = database:getEmployeeBasicInfo(functionalLead);
            if leadsBasicInfo is error {
                return <http:InternalServerError>{
                    body: {
                        message: "Error while validating functional lead's email"
                    }
                };
            }

            if leadsBasicInfo is () {
                return <http:BadRequest>{
                    body: {
                        message: "No functional lead is found for given email"
                    }
                };
            }
        }

        string workEmail = validatedUserInfo.email;
        error|boolean updateResult = database:updateTeamSubTeam(
                {...payload, updatedBy: workEmail}, businessUnitTeamId, subTeamId);
        if updateResult is error {
            log:printError(
                    "Error while updating BusinessUnit-Team-SubTeam",
                    updateResult,
                    businessUnitTeamId = businessUnitTeamId,
                    subTeamId = subTeamId
            );
            return <http:InternalServerError>{
                body: {
                    message: "Error while updating the BusinessUnit-Team-SubTeam"
                }
            };
        }

        if !updateResult {
            log:printError(string `No BusinessUnit-Team-SubTeam found for businessUnitTeamId 
                ${businessUnitTeamId} and subTeamId ${subTeamId} to update`
            );
            return <http:BadRequest>{
                body: {
                    message: string
                        `BusinessUnit-Team-SubTeam not found for businessUnitTeamId ${businessUnitTeamId} 
                        and subTeamId ${subTeamId}`
                }
            };
        }

        return <http:Ok>{
            body: {
                message: "Successfully updated the BusinessUnit-Team-SubTeam"
            }
        };
    }

    # Update a SubTeam-Unit mapping by IDs.
    #
    # + businessUnitTeamSubTeamId - ID of the BusinessUnit-Team-SubTeam
    # + unitId - ID of the Unit
    # + payload - functionalLeadEmail to update in the mapping
    # + return - HTTP OK on success, or HTTP errors on failure
    resource function patch organization/sub\-team/[int businessUnitTeamSubTeamId]/unit/[int unitId]
            (http:RequestContext ctx, UpdateOrgUnitPayload payload)
        returns http:Ok|http:InternalServerError|http:Forbidden|http:BadRequest {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        boolean|error mappingExists = database:businessUnitTeamSubTeamMappingExists(businessUnitTeamSubTeamId);
        if mappingExists is error {
            log:printError(
                    "Error while validating BusinessUnit-Team-SubTeam",
                    mappingExists,
                    businessUnitTeamSubTeamId = businessUnitTeamSubTeamId
            );
            return <http:InternalServerError>{
                body: {message: "Error while validating the BusinessUnit-Team-SubTeam"}
            };
        }

        if !mappingExists {
            return <http:BadRequest>{
                body: {message: string `BusinessUnit-Team-SubTeam with ID ${businessUnitTeamSubTeamId} not found`}
            };
        }

        boolean|error unitExists = database:unitExists(unitId);
        if unitExists is error {
            log:printError("Error while validating unit", unitExists, unitId = unitId);
            return <http:InternalServerError>{
                body: {message: "Error while validating the unit"}
            };
        }

        if !unitExists {
            return <http:BadRequest>{
                body: {message: string `Unit with ID ${unitId} not found`}
            };
        }

        string? functionalLead = payload.functionalLeadEmail;
        if functionalLead is string {
            EmployeeBasicInfo|error? leadsBasicInfo = database:getEmployeeBasicInfo(functionalLead);
            if leadsBasicInfo is error {
                return <http:InternalServerError>{
                    body: {
                        message: "Error while validating functional lead's email"
                    }
                };
            }

            if leadsBasicInfo is () {
                return <http:BadRequest>{
                    body: {
                        message: "No functional lead is found for given email"
                    }
                };
            }
        }

        string workEmail = validatedUserInfo.email;
        error|boolean updateResult = database:updateSubTeamUnit(
                {...payload, updatedBy: workEmail}, businessUnitTeamSubTeamId, unitId);
        if updateResult is error {
            log:printError(
                    "Error while updating BusinessUnit-Team-SubTeam-Unit",
                    updateResult,
                    businessUnitTeamSubTeamId = businessUnitTeamSubTeamId,
                    unitId = unitId
            );
            return <http:InternalServerError>{
                body: {
                    message: "Error while updating the BusinessUnit-Team-SubTeam-Unit"
                }
            };
        }

        if !updateResult {
            log:printError(string
                    `No BusinessUnit-Team-SubTeam-Unit found for businessUnitTeamSubTeamId ${businessUnitTeamSubTeamId} 
                and unitId ${unitId} to update`
            );
            return <http:BadRequest>{
                body: {
                    message: string
                        `No BusinessUnit-Team-SubTeam-Unit found for 
                        businessUnitTeamSubTeamId ${businessUnitTeamSubTeamId} and unitId ${unitId}`
                }
            };
        }

        return <http:Ok>{
            body: {message: "Successfully updated the BusinessUnit-Team-SubTeam-Unit"}
        };
    }

    # Delete a BusinessUnit by ID.
    #
    # + buId - ID of the BusinessUnit
    # + return - HTTP OK on success, or HTTP errors on failure
    resource function delete organization/business\-unit/[int buId](http:RequestContext ctx)
        returns http:Ok|http:InternalServerError|http:Forbidden|http:BadRequest {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        int|error headCount = database:retreiveBusinessUnitHeadCount(buId);
        if headCount is error {
            string customErr = "Error while checking employee count in BusinessUnit";
            log:printError(customErr, headCount, buId = buId);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }

        if headCount > 0 {
            log:printWarn(
                    "Cannot delete BusinessUnit because it has assigned employees",
                    buId = buId,
                    headCount = headCount,
                    invokerEmail = validatedUserInfo.email
            );
            return <http:BadRequest>{
                body: {
                    message: string
                        `Cannot delete this BusinessUnit because it has ${headCount} assigned employee(s). Reassign employees to another BusinessUnit first.`
                }
            };
        }

        boolean|error hasChildren = database:businessUnitHasChildren(buId);
        if hasChildren is error {
            string customErr = "Error while checking BusinessUnit children";
            log:printError(customErr, hasChildren, buId = buId);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }

        if hasChildren {
            log:printWarn(
                    "Cannot delete BusinessUnit because it has child teams",
                    buId = buId,
                    invokerEmail = validatedUserInfo.email
            );
            return <http:BadRequest>{
                body: {
                    message: string
                        `Cannot delete BusinessUnit because it has child teams. 
                        Remove or deactivate child teams first.`
                }
            };
        }

        string workEmail = validatedUserInfo.email;
        error|boolean deleteResult = database:deleteBusinessUnit(workEmail, buId);
        if deleteResult is error {
            log:printError("Error while deleting BusinessUnit : ", deleteResult, buId = buId);
            return <http:InternalServerError>{
                body: {
                    message: "Error while deleting the BusinessUnit"
                }
            };
        }

        if deleteResult == false {
            log:printError(string `No BusinessUnit found with ID ${buId}`);
            return <http:BadRequest>{
                body: {
                    message: "No BusinessUnit found to delete"
                }
            };
        }

        return <http:Ok>{
            body: {
                message: "Successfully deleted the BusinessUnit"
            }
        };
    }

    # Delete a BusinessUnit-Team mapping.
    #
    # + businessUnitId - ID of the BusinessUnit
    # + teamId - ID of the Team
    # + return - HTTP OK on success, or HTTP errors on failure
    resource function delete organization/business\-unit/[int businessUnitId]/team/[int teamId]
            (http:RequestContext ctx)
        returns http:Ok|http:InternalServerError|http:Forbidden|http:BadRequest {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        int|error headCount = database:retreiveBusinessUnitTeamHeadCount(businessUnitId, teamId);
        if headCount is error {
            string customErr = "Error while checking employee count in BusinessUnit-Team";
            log:printError(customErr, headCount, businessUnitId = businessUnitId, teamId = teamId);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }

        if headCount > 0 {
            log:printWarn(
                    "Cannot delete BusinessUnit-Team because it has assigned employees",
                    businessUnitId = businessUnitId,
                    teamId = teamId,
                    headCount = headCount,
                    invokerEmail = validatedUserInfo.email
            );
            return <http:BadRequest>{
                body: {
                    message: string
                        `Cannot delete this BusinessUnit-Team because it has ${headCount} assigned employee(s). Reassign employees to another Team first.`
                }
            };
        }

        boolean|error hasChildren = database:businessUnitTeamHasChildren(businessUnitId, teamId);
        if hasChildren is error {
            string customErr = "Error while checking BusinessUnit-Team children";
            log:printError(customErr, hasChildren, buId = businessUnitId, teamId = teamId);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }

        if hasChildren {
            log:printWarn(
                    "Cannot delete BusinessUnit-Team because it has child sub-teams",
                    buId = businessUnitId,
                    teamId = teamId,
                    invokerEmail = validatedUserInfo.email
            );
            return <http:BadRequest>{
                body: {
                    message: string
                        `Cannot delete this BusinessUnit-Team because it has child sub-teams. 
                        Remove or deactivate child sub-teams first.`
                }
            };
        }

        string workEmail = validatedUserInfo.email;
        error|boolean deleteResult = database:deleteBusinessUnitTeam(workEmail, businessUnitId, teamId);
        if deleteResult is error {
            log:printError(
                    "Error while deleting BusinessUnit-Team : ",
                    deleteResult,
                    buId = businessUnitId,
                    teamId = teamId
            );
            return <http:InternalServerError>{
                body: {
                    message: "Error while deleting the BusinessUnit-Team"
                }
            };
        }

        if deleteResult == false {
            log:printError(
                    string `No BusinessUnit-Team found with businessUnitId ${businessUnitId} and teamId ${teamId}`);
            return <http:BadRequest>{
                body: {
                    message: "No BusinessUnit-Team found to delete"
                }
            };
        }

        return <http:Ok>{
            body: {
                message: "Successfully deleted the BusinessUnit-Team"
            }
        };
    }

    # Delete a Team-SubTeam mapping by IDs.
    #
    # + businessUnitTeamId - ID of the BusinessUnit-Team
    # + subTeamId - ID of the SubTeam
    # + return - HTTP OK on success, or HTTP errors on failure
    resource function delete organization/team/[int businessUnitTeamId]/sub\-team/[int subTeamId]
            (http:RequestContext ctx)
        returns http:Ok|http:InternalServerError|http:Forbidden|http:BadRequest {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        int|error headCount = database:retreiveBusinessUnitTeamSubTeamHeadCount(businessUnitTeamId, subTeamId);
        if headCount is error {
            string customErr = "Error while checking employee count in Team-SubTeam";
            log:printError(customErr, headCount, businessUnitTeamId = businessUnitTeamId, subTeamId = subTeamId);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }

        if headCount > 0 {
            log:printWarn(
                    "Cannot delete Team-SubTeam because it has assigned employees",
                    businessUnitTeamId = businessUnitTeamId,
                    subTeamId = subTeamId,
                    headCount = headCount,
                    invokerEmail = validatedUserInfo.email
            );
            return <http:BadRequest>{
                body: {
                    message: string
                        `Cannot delete this Team-SubTeam because it has ${headCount} assigned employee(s). Reassign employees to another SubTeam first.`
                }
            };
        }

        boolean|error hasChildren = database:teamSubTeamHasChildren(businessUnitTeamId, subTeamId);
        if hasChildren is error {
            string customErr = "Error while checking Team-SubTeam children";
            log:printError(customErr, hasChildren, businessUnitTeamId = businessUnitTeamId, subTeamId = subTeamId);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }

        if hasChildren {
            log:printWarn(
                    "Cannot delete Team-SubTeam because it has child Units",
                    businessUnitTeamId = businessUnitTeamId,
                    subTeamId = subTeamId,
                    invokerEmail = validatedUserInfo.email
            );
            return <http:BadRequest>{
                body: {
                    message: string
                        `Cannot delete this Team-SubTeam because it has child Units. 
                        Remove or deactivate child Units first.`
                }
            };
        }

        string workEmail = validatedUserInfo.email;
        error|boolean deleteResult = database:deleteTeamSubTeam(workEmail, businessUnitTeamId, subTeamId);
        if deleteResult is error {
            log:printError(
                    "Error while deleting Team-SubTeam : ",
                    deleteResult,
                    businessUnitTeamId = businessUnitTeamId,
                    subTeamId = subTeamId
            );
            return <http:InternalServerError>{
                body: {
                    message: "Error while deleting the Team-SubTeam"
                }
            };
        }

        if deleteResult == false {
            log:printError(
                    string `No Team-SubTeam found with teamId ${businessUnitTeamId} and subTeamId ${subTeamId}`);
            return <http:BadRequest>{
                body: {
                    message: "No Team-SubTeam found to delete"
                }
            };
        }

        return <http:Ok>{
            body: {
                message: "Successfully deleted the Team-SubTeam"
            }
        };
    }

    # Delete a SubTeam-Unit mapping by IDs.
    #
    # + businessUnitTeamSubTeamId - ID of the BusinessUnit-Team-SubTeam
    # + unitId - ID of the Unit
    # + return - HTTP OK on success, or HTTP errors on failure
    resource function delete organization/sub\-team/[int businessUnitTeamSubTeamId]/unit/[int unitId]
            (http:RequestContext ctx)
        returns http:Ok|http:InternalServerError|http:Forbidden|http:BadRequest {

        http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo validatedUserInfo =
            validateOrganizationRequest(ctx);

        if validatedUserInfo is http:InternalServerError|http:Forbidden|http:BadRequest {
            return validatedUserInfo;
        }

        int|error headCount = database:retreiveBusinessUnitTeamSubTeamUnitHeadCount(businessUnitTeamSubTeamId, unitId);
        if headCount is error {
            string customErr = "Error while checking employee count in SubTeam-Unit";
            log:printError(customErr, headCount, businessUnitTeamSubTeamId = businessUnitTeamSubTeamId, unitId = unitId);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }

        if headCount > 0 {
            log:printWarn(
                    "Cannot delete SubTeam-Unit because it has assigned employees",
                    businessUnitTeamSubTeamId = businessUnitTeamSubTeamId,
                    unitId = unitId,
                    headCount = headCount,
                    invokerEmail = validatedUserInfo.email
            );
            return <http:BadRequest>{
                body: {
                    message: string
                        `Cannot delete this SubTeam-Unit because it has ${headCount} assigned employee(s). 
                        Reassign employees to another Unit first.`
                }
            };
        }

        string workEmail = validatedUserInfo.email;
        error|boolean deleteResult = database:deleteSubTeamUnit(workEmail, businessUnitTeamSubTeamId, unitId);
        if deleteResult is error {
            log:printError(
                    "Error while deleting SubTeam-Unit : ",
                    deleteResult,
                    businessUnitTeamSubTeamId = businessUnitTeamSubTeamId,
                    unitId = unitId
            );
            return <http:InternalServerError>{
                body: {
                    message: "Error while deleting the SubTeam-Unit"
                }
            };
        }

        if deleteResult == false {
            log:printError(string `
                No SubTeam-Unit found with businessUnitTeamSubTeamId ${businessUnitTeamSubTeamId} 
                and unitId ${unitId}`
            );
            return <http:BadRequest>{
                body: {
                    message: "No SubTeam-Unit found to delete"
                }
            };
        }

        return <http:Ok>{
            body: {
                message: "Successfully deleted the SubTeam-Unit"
            }
        };
    }
}
