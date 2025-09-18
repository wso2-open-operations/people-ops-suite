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

import ballerina/log;
import ballerina/sql;

# Fetch vehicles.
#
# + owner - Filter : owner of the vehicles  
# + vehicleStatus - Filter :  status of the vehicle
# + 'limit - Limit of the response  
# + offset - Offset of the response
# + return - Vehicles | Error
public isolated function fetchVehicles(string? owner = (), VehicleStatus? vehicleStatus = (), int? 'limit = (),
        int? offset = ()) returns Vehicles|error {

    stream<FetchVehicleResponse, error?> vehiclesResponse = databaseClient->query(
            fetchVehiclesQuery(owner, vehicleStatus, 'limit, offset));

    Vehicle[] vehicles = [];
    int totalCount = 0;
    _ = check from FetchVehicleResponse vehicle in vehiclesResponse
        do {
            vehicles.push({
                vehicleId: vehicle.vehicleId,
                owner: vehicle.owner,
                vehicleRegistrationNumber: vehicle.vehicleRegistrationNumber,
                updatedBy: vehicle.updatedBy,
                createdBy: vehicle.createdBy,
                vehicleStatus: vehicle.vehicleStatus,
                updatedOn: vehicle.updatedOn,
                createdOn: vehicle.createdOn,
                vehicleType: vehicle.vehicleType
            });

            totalCount = vehicle.totalCount;
        };

    return {
        vehicles,
        totalCount
    };
}

# Persist new vehicle.
#
# + payload - Payload containing the vehicle details
# + return - Id of the vehicle | Error
public isolated function addVehicle(AddVehiclePayload payload) returns int|error {
    sql:ExecutionResult executionResults = check databaseClient->execute(addVehicleQuery(payload));
    return executionResults.lastInsertId.ensureType(int);
}

# Update specific vehicle.
#
# + payload - Payload containing the update details
# + return - true if the update was successful or error
public isolated function updateVehicle(UpdateVehiclePayload payload) returns boolean|error {
    sql:ExecutionResult executionResults = check databaseClient->execute(updateVehicleQuery(payload));
    if executionResults.affectedRowCount > 0 {
        return true;
    }
    return false;
}

# fetch employee info from an user email.
#
# + email - user's wso2 email 
# + return - employee info or an error
public isolated function fetchEmployeeInfo(string email) returns EmployeeInfo|error? {
    EmployeeInfo|sql:Error result = databaseClient->queryRow(getEmployeeInfo(email));

    if result is EmployeeInfo {
        EmployeeInfo employee = {
            id: result.id,
            lastName: result.lastName,
            firstName: result.firstName,
            workLocation: result.workLocation,
            epf: result.epf,
            employeeLocation: result.employeeLocation,
            wso2Email: result.wso2Email,
            workPhoneNumber: result.workPhoneNumber,
            startDate: result.startDate,
            jobRole: result.jobRole,
            jobBand: result.jobBand,
            managerEmail: result.managerEmail,
            reportToEmail: result.reportToEmail,
            additionalManagerEmail: result.additionalManagerEmail,
            additionalReportToEmail: result.additionalReportToEmail,
            employeeStatus: result.employeeStatus,
            lengthOfService: result.lengthOfService,
            relocationStatus: result.relocationStatus,
            employeeThumbnail: result.employeeThumbnail,
            subordinateCount: result.subordinateCount,
            timestamp: result.timestamp,
            probationEndDate: result.probationEndDate,
            agreementEndDate: result.agreementEndDate,
            employmentType: result.employmentType,
            company: result.company,
            office: result.office,
            businessUnit: result.businessUnit,
            team: result.team,
            subTeam: result.subTeam,
            unit: result.unit
        };
        return employee;
    }

    return result;
}

# Retrieve Organizational details from HRIS.
#
# + filter - Criteria to filter the data  
# + limit - Number of records to retrieve
# + offset - Number of records to offset
# + return - List of business units
public isolated function getOrgDetails(OrgDetailsFilter filter, int 'limit, int offset)
    returns BusinessUnit[]|error {

    BusinessUnit[] businessUnits = [];

    stream<BusinessUnitStr, sql:Error?> resultStream = databaseClient->query(getOrgDataQuery(
            filter = filter, 'limit = 'limit, offset = offset));

    error? iterateError = from BusinessUnitStr bu in resultStream
        do {

            Team[]|error teams = bu.teams.fromJsonStringWithType();
            if teams is error {
                string errorMsg = string `An error occurred when retrieving departments data of ${
                    bu.businessUnit
                } !`;

                log:printError(errorMsg, teams);
                return error(errorMsg);
            }

            businessUnits.push({
                id: bu.id,
                businessUnit: bu.businessUnit,
                headEmail: bu.headEmail,
                teams: teams
            });

        };

    if iterateError is sql:Error {
        string errorMsg = string `An error occurred when retrieving organization details!`;
        log:printError(errorMsg, iterateError);
        return error(errorMsg);
    }

    return businessUnits;
}

# Update employee info on only changed fields.
#
# + email - user's wso2 email 
# + employee - employee payload that includes changed user information
# + return - sql-execution result or an error
public isolated function UpdateEmployeeInfo(string email, UpdatedEmployeeInfo employee) returns sql:ExecutionResult|error? {

    if employee.entries().length() === 0 {
        return error(string `No data to update to employee : ${employee.firstName.toString()} !`);
    }

    sql:ExecutionResult|sql:Error executionResult = databaseClient->execute(updateEmployeeQuery(email, employee));

    if executionResult is sql:Error {

        string customError = string `Error occurred while updating the employee data  of ${employee.firstName.toString()}`;

        log:printError(customError, executionResult);

        return error(customError);

    }

    if (executionResult.affectedRowCount == 0) {
        return error(string `No employee were to update from id : ${employee.firstName.toString()} !`);

    }
    return executionResult;
}
