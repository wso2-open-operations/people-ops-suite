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
import ballerina/sql;

# Fetch employee basic information.
#
# + email - Employee's work email address
# + return - Employee basic information
public isolated function getEmployeeBasicInfo(string email) returns EmployeeBasicInfo|error? {
    EmployeeBasicInfo|error employeeBasicInfo = databaseClient->queryRow(getEmployeeBasicInfoQuery(email));
    return employeeBasicInfo is sql:NoRowsError ? () : employeeBasicInfo;
}

# Fetch all employees' basic information.
#
# + return - All employees' basic information
public isolated function getAllEmployeesBasicInfo() returns EmployeeBasicInfo[]|error {
    stream<EmployeeBasicInfo, error?> employeeBasicInfoStream = databaseClient->query(getAllEmployeesBasicInfoQuery());
    return from EmployeeBasicInfo employeesBasicInfo in employeeBasicInfoStream
        select employeesBasicInfo;
}

# Fetch employee detailed information.
#
# + id - Employee ID
# + return - Employee detailed information
public isolated function getEmployeeInfo(string id) returns Employee|error? {
    Employee|error employeeInfo = databaseClient->queryRow(getEmployeeInfoQuery(id));
    return employeeInfo is sql:NoRowsError ? () : employeeInfo;
}

# Fetch continuos service record by work email.
#
# + workEmail - Work email of the employee
# + return - Continuous service record information or error
public isolated function getContinuousServiceRecordsByEmail(string workEmail)
    returns ContinuousServiceRecordInfo[]|error {

    stream<ContinuousServiceRecordInfo, sql:Error?> recordStream = databaseClient->query(
        getContinuousServiceRecordQuery(workEmail)
    );
    return from ContinuousServiceRecordInfo serviceRecord in recordStream
        select serviceRecord;
}

# Search employee personal information.
#
# + payload - Search employee personal information payload
# + return - Employee personal information search results
public isolated function searchEmployeePersonalInfo(SearchEmployeePersonalInfoPayload payload)
    returns EmployeePersonalInfo[]|error {

    stream<EmployeePersonalInfo, error?> employeePersonalInfoStream = databaseClient->query(
            searchEmployeePersonalInfoQuery(payload));
    return from EmployeePersonalInfo employeePersonalInfo in employeePersonalInfoStream
        select employeePersonalInfo;
}

# Fetch employee personal information.
#
# + id - Employee ID
# + return - Employee personal information
public isolated function getEmployeePersonalInfo(string id) returns EmployeePersonalInfo|error? {
    EmployeePersonalInfo|error employeePersonalInfo = databaseClient->queryRow(getEmployeePersonalInfoQuery(id));
    return employeePersonalInfo is sql:NoRowsError ? () : employeePersonalInfo;
}

# Get business units.
#
# + return - Business units
public isolated function getBusinessUnits() returns BusinessUnit[]|error {
    stream<BusinessUnit, error?> businessUnitStream = databaseClient->query(getBusinessUnitsQuery());
    return from BusinessUnit businessUnit in businessUnitStream
        select businessUnit;
}

# Get teams.
#
# + buId - Business unit ID (optional)
# + return - Teams
public isolated function getTeams(int? buId = ()) returns Team[]|error {
    stream<Team, error?> teamStream = databaseClient->query(getTeamsQuery(buId));
    return from Team team in teamStream
        select team;
}

# Get sub teams.
#
# + teamId - Team ID (optional)
# + return - Sub teams
public isolated function getSubTeams(int? teamId = ()) returns SubTeam[]|error {
    stream<SubTeam, error?> subTeamStream = databaseClient->query(getSubTeamsQuery(teamId));
    return from SubTeam subTeam in subTeamStream
        select subTeam;
}

# Get units.
#
# + subTeamId - Sub team ID (optional)
# + return - Units
public isolated function getUnits(int? subTeamId = ()) returns Unit[]|error {
    stream<Unit, error?> unitStream = databaseClient->query(getUnitsQuery(subTeamId));
    return from Unit unit in unitStream
        select unit;
}

# Get career functions.
#
# + return - Career functions
public isolated function getCareerFunctions() returns CareerFunction[]|error {
    stream<CareerFunction, error?> careerFunctionStream = databaseClient->query(getCareerFunctionsQuery());
    return from CareerFunction careerFunction in careerFunctionStream
        select careerFunction;
}

# Get designations.
#
# + careerFunctionId - Career function ID (optional)
# + return - Designations
public isolated function getDesignations(int? careerFunctionId = ()) returns Designation[]|error {
    stream<Designation, error?> designationStream = databaseClient->query(getDesignationsQuery(careerFunctionId));
    return from Designation designation in designationStream
        select designation;
}

# Get offices.
#
# + return - Offices
public isolated function getOffices() returns Office[]|error {
    stream<Office, error?> officeStream = databaseClient->query(getOfficesQuery());
    return from Office office in officeStream
        select office;
}

# Add new employee.
#
# + payload - Add employee payload
# + createdBy - Creator of the employee record
# + return - Created employee ID or error
public isolated function addEmployee(CreateEmployeePayload payload, string createdBy) returns int|error {
    transaction {
        sql:ExecutionResult personalInfoResult = check databaseClient->execute(addEmployeePersonalInfoQuery(
                payload.personalInfo, createdBy));
        int personalInfoId = check personalInfoResult.lastInsertId.ensureType(int);

        sql:ExecutionResult employeeResult = check databaseClient->execute(addEmployeeQuery(payload, createdBy,
                personalInfoId));
        int employeeId = check employeeResult.lastInsertId.ensureType(int);

        check commit;
        return employeeId;
    }
}

# Update employee personal information.
#
# + id - Personal information ID
# + payload - Personal info update payload
# + return - True if the update was successful or error
public isolated function updateEmployeePersonalInfo(int id, UpdateEmployeePersonalInfoPayload payload) returns error? {
    sql:ExecutionResult executionResult = check databaseClient->execute(updateEmployeePersonalInfoQuery(id, payload));
    return executionResult.affectedRowCount > 0 ? () : error(ERROR_NO_ROWS_UPDATED);
}

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
