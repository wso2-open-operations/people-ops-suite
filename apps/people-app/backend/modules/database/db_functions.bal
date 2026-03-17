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

# Fetch continuous service record by work email.
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

# Update business unit.
#
# + payload - Update payload  
# + buId - Business unit ID
# + return - Error when update fails
public isolated function updateBusinessUnit(UpdateUnitPayload payload, int buId) returns error? {
    _ = check databaseClient->execute(updateBusinessUnitQuery(payload, buId));
}

# Update team.
#
# + payload - Update payload
# + teamId - Team ID
# + return - Error when update fails
public isolated function updateTeam(UpdateUnitPayload payload, int teamId) returns error? {
    _ = check databaseClient->execute(updateTeamQuery(payload, teamId));
}

# Update sub team.
#
# + payload - Update payload
# + subTeamId - Sub team ID
# + return - Error when update fails
public isolated function updateSubTeam(UpdateUnitPayload payload, int subTeamId) returns error? {
    _ = check databaseClient->execute(updateSubTeamQuery(payload, subTeamId));
}

# Update unit.
#
# + payload - Update payload
# + unitId - Unit ID
# + return - Error when update fails
public isolated function updateUnit(UpdateUnitPayload payload, int unitId) returns error? {
    _ = check databaseClient->execute(updateUnitQuery(payload, unitId));
}

# Update the functional lead of a business unit-team mapping.
#
# + payload - Fields to update in the business unit-team mapping
# + buId - ID of the business unit
# + teamId - ID of the team
# + return - Nil on success, error if the update fails
public isolated function updateBusinessUnitTeam(UpdateBusinessUnitTeamPayload payload, int buId, int teamId) returns boolean|error {
    sql:ExecutionResult executionResults = check databaseClient->execute(updateBusinessUnitTeamQuery(payload, buId, teamId));
    if executionResults.affectedRowCount > 0 {
        return true;
    }
    return false;
}

# Update the functional lead of a team-sub team mapping.
#
# + payload - Fields to update in the team-sub team mapping
# + teamId - ID of the team
# + subTeamId - ID of the sub team
# + return - Nil on success, error if the update fails
public isolated function updateTeamSubTeam(UpdateTeamSubTeamPayload payload, int teamId, int subTeamId) returns boolean|error {
    sql:ExecutionResult executionResults = check databaseClient->execute(updateTeamSubTeamQuery(payload, teamId, subTeamId));
    if executionResults.affectedRowCount > 0 {
        return true;
    }
    return false;
}

# Update the functional lead of a sub team-unit mapping.
#
# + payload - Fields to update in the sub team-unit mapping
# + subTeamId - ID of the sub team
# + unitId - ID of the unit
# + return - Nil on success, error if the update fails
public isolated function updateSubTeamUnit(UpdateSubTeamUnitPayload payload, int subTeamId, int unitId) returns boolean|error {
    sql:ExecutionResult executionResults = check databaseClient->execute(updateSubTeamUnitQuery(payload, subTeamId, unitId));
    if executionResults.affectedRowCount > 0 {
        return true;
    }
    return false;
}

# Delete a business unit.
#
# + userEmail - Email of the user performing the deletion
# + buId - ID of the business unit to delete
# + return - True if deleted, false if not found, error on failure
public isolated function deleteBusinessUnit(string userEmail, int buId) returns boolean|error {
    sql:ExecutionResult executionResult = check databaseClient->execute(deleteBusinessUnitQuery(userEmail, buId));
    if executionResult.affectedRowCount > 0 {
        return true;
    }
    return false;
}

# Delete a business unit-team mapping.
#
# + userEmail - Email of the user performing the deletion
# + buId - ID of the business unit
# + teamId - ID of the team
# + return - True if deleted, false if not found, error on failure
public isolated function deleteBusinessUnitTeam(string userEmail, int buId, int teamId)
    returns boolean|error {
    sql:ExecutionResult executionResult = check databaseClient->execute(deleteBusinessUnitTeamQuery(userEmail, buId, teamId));
    if executionResult.affectedRowCount > 0 {
        return true;
    }
    return false;
}

# Delete a team-sub team mapping.
#   
# + userEmail - Email of the user performing the deletion
# + teamId - ID of the team
# + subTeamId - ID of the sub team
# + return - True if deleted, false if not found, error on failure
public isolated function deleteTeamSubTeam(string userEmail, int teamId, int subTeamId) returns boolean|error {
    sql:ExecutionResult executionResult = check databaseClient->execute(deleteTeamSubTeamQuery(userEmail, teamId, subTeamId));
    if executionResult.affectedRowCount > 0 {
        return true;
    }
    return false;
}

# Delete a sub team-unit mapping.
#
# + userEmail - Email of the user performing the deletion
# + subTeamId - ID of the sub team
# + unitId - ID of the unit
# + return - True if deleted, false if not found, error on failure
public isolated function deleteSubTeamUnit(string userEmail, int subTeamId, int unitId) returns boolean|error {
    sql:ExecutionResult executionResult = check databaseClient->execute(deleteSubTeamUnitQuery(userEmail, subTeamId, unitId));
    if executionResult.affectedRowCount > 0 {
        return true;
    }
    return false;
}

# Get organization details with business units, teams, sub-teams, units,
# including head, functional lead, and headcount for each node.
#
# + return - Organization details
public isolated function getOrganizationDetails() returns Company|error {
    CompanyRaw|error companyRow = databaseClient->queryRow(getOrganizationStructureQuery());
    if companyRow is sql:NoRowsError {
        return error("Organization details not found");
    }
    if companyRow is error {
        return companyRow;
    }

    OrgBusinessUnit[] businessUnits = check companyRow.businessUnits.fromJsonWithType();

    return {
        id: companyRow.id,
        name: companyRow.name,
        headCount: companyRow.headCount,
        businessUnits
    };
}

# Add new business unit.
#
# + userEmail - Email of the user creating the record
# + payload - Node details (name and head email)
# + return - Created business unit ID or error
public isolated function addBusinessUnit(string userEmail, OrgNodeInfo payload) returns int|error {
    sql:ExecutionResult executionResult = check databaseClient->execute(addBusinessUnitQuery(userEmail, payload));
    return executionResult.lastInsertId.ensureType(int);
}

# Add new team.
#
# + userEmail - Email of the user creating the record
# + payload - Node details (name and head email)
# + return - Created team ID or error
public isolated function addTeam(string userEmail, OrgNodeInfo payload) returns int|error {
    sql:ExecutionResult executionResult = check databaseClient->execute(addTeamQuery(userEmail, payload));
    return executionResult.lastInsertId.ensureType(int);
}

# Add new sub team.
#
# + userEmail - Email of the user creating the record
# + payload - Node details (name and head email)
# + return - Created sub-team ID or error
public isolated function addSubTeam(string userEmail, OrgNodeInfo payload) returns int|error {
    sql:ExecutionResult executionResult = check databaseClient->execute(addSubTeamQuery(userEmail, payload));
    return executionResult.lastInsertId.ensureType(int);
}

# Add new unit.
#
# + userEmail - Email of the user creating the record
# + payload - Node details (name and head email)
# + return - Created unit ID or error
public isolated function addUnit(string userEmail, OrgNodeInfo payload) returns int|error {
    sql:ExecutionResult executionResult = check databaseClient->execute(addUnitQuery(userEmail, payload));
    return executionResult.lastInsertId.ensureType(int);
}

# Create a new team and map it to a business unit atomically.
#
# + userEmail - Email of the user creating the record
# + payload - Team details
# + return - Created mapping ID or error
public isolated function addTeamWithMapping(string userEmail, OrgNodePayload payload) returns int|error {
    transaction {
        sql:ExecutionResult executionResult = check databaseClient->execute(addTeamQuery(userEmail, {name: payload.name, headEmail: payload.headEmail}));
        int teamId = check executionResult.lastInsertId.ensureType(int);

        sql:ExecutionResult executionResultTwo = check databaseClient->execute(addBusinessUnitTeamQuery(userEmail, {parentId: payload.orgNodeLinkInfo.id, childId: teamId.toString(), functionalLeadEmail: payload.orgNodeLinkInfo.functionalLeadEmail}));
        int id = check executionResultTwo.lastInsertId.ensureType(int);

        check commit;
        return id;
    }
}

# Create a new sub-team and map it to a business unit-team atomically.
#
# + userEmail - Email of the user creating the record
# + payload - Sub-team details
# + return - Created mapping ID or error
public isolated function addSubTeamWithMapping(string userEmail, OrgNodePayload payload) returns int|error {
    transaction {
        sql:ExecutionResult executionResult = check databaseClient->execute(addSubTeamQuery(userEmail, {name: payload.name, headEmail: payload.headEmail}));
        int subTeamId = check executionResult.lastInsertId.ensureType(int);

        sql:ExecutionResult executionResultTwo = check databaseClient->execute(addBusinessUnitTeamSubTeamQuery(userEmail, {parentId: payload.orgNodeLinkInfo.id, childId: subTeamId.toString(), functionalLeadEmail: payload.orgNodeLinkInfo.functionalLeadEmail}));
        int id = check executionResultTwo.lastInsertId.ensureType(int);

        check commit;
        return id;
    }
}

# Create a new unit and map it to a business unit-team-sub-team atomically.
#
# + userEmail - Email of the user creating the record
# + payload - Unit details 
# + return - Created mapping ID or error
public isolated function addUnitWithMapping(string userEmail, OrgNodePayload payload) returns int|error {
    transaction {
        sql:ExecutionResult executionResult = check databaseClient->execute(addUnitQuery(userEmail, {name: payload.name, headEmail: payload.headEmail}));
        int unitId = check executionResult.lastInsertId.ensureType(int);

        sql:ExecutionResult executionResultTwo = check databaseClient->execute(addBusinessUnitTeamSubTeamUnitQuery(userEmail, {parentId: payload.orgNodeLinkInfo.id, childId: unitId.toString(), functionalLeadEmail: payload.orgNodeLinkInfo.functionalLeadEmail}));
        int id = check executionResultTwo.lastInsertId.ensureType(int);

        check commit;
        return id;
    }
}

# Map an existing team to a business unit.
#
# + userEmail - Email of the user creating the record
# + payload - Mapping details; `parentId` = business unit ID, `childId` = team ID
# + return - Created mapping ID or error
public isolated function addBusinessUnitTeam(string userEmail, OrgNodeMappingPayload payload) returns int|error {
    sql:ExecutionResult executionResult = check databaseClient->execute(addBusinessUnitTeamQuery(userEmail, payload));
    return executionResult.lastInsertId.ensureType(int);
}

# Map an existing sub-team to a business unit-team.
#
# + userEmail - Email of the user creating the record
# + payload - Mapping details; `parentId` = business_unit_team ID, `childId` = sub-team ID
# + return - Created mapping ID or error
public isolated function addBusinessUnitTeamSubTeam(string userEmail, OrgNodeMappingPayload payload) returns int|error {
    sql:ExecutionResult executionResult = check databaseClient->execute(addBusinessUnitTeamSubTeamQuery(userEmail, payload));
    return executionResult.lastInsertId.ensureType(int);
}

# Map an existing unit to a business unit-team-sub-team.
#
# + userEmail - Email of the user creating the record
# + payload - Mapping details; `parentId` = business_unit_team_sub_team ID, `childId` = unit ID
# + return - Created mapping ID or error
public isolated function addBusinessUnitTeamSubTeamUnit(string userEmail, OrgNodeMappingPayload payload) returns int|error {
    sql:ExecutionResult executionResult = check databaseClient->execute(addBusinessUnitTeamSubTeamUnitQuery(userEmail, payload));
    return executionResult.lastInsertId.ensureType(int);
}

public isolated function validateBusinessUnitNameUniqueness(string businessUnitName) returns boolean|error {
    ExistsFlagResult result =
        check databaseClient->queryRow(validateBusinessUnitNameUniquenessQuery(businessUnitName));

    return result.exists_flag == 0;
}

public isolated function validateTeamNameUniqueness(string teamName) returns boolean|error {
    ExistsFlagResult result =
        check databaseClient->queryRow(validateTeamNameUniquenessQuery(teamName));

    return result.exists_flag == 0;
}

public isolated function validateSubTeamNameUniqueness(string subTeamName) returns boolean|error {
    ExistsFlagResult result =
        check databaseClient->queryRow(validateSubTeamNameUniquenessQuery(subTeamName));

    return result.exists_flag == 0;
}

public isolated function validateUnitNameUniqueness(string unitName) returns boolean|error {
    ExistsFlagResult result =
        check databaseClient->queryRow(validateUnitNameUniquenessQuery(unitName));

    return result.exists_flag == 0;
}

public isolated function businessUnitHasChildren(int buId) returns boolean|error {
    ExistsFlagResult result =
        check databaseClient->queryRow(businessUnitHasChildrenQuery(buId));

    return result.exists_flag == 1;
}

public isolated function businessUnitTeamHasChildren(int businessUnitId, int teamId) returns boolean|error {
    ExistsFlagResult result =
        check databaseClient->queryRow(businessUnitTeamHasChildrenQuery(businessUnitId, teamId));

    return result.exists_flag == 1;
}

public isolated function teamSubTeamHasChildren(int teamId, int subTeamId) returns boolean|error {
    ExistsFlagResult result =
        check databaseClient->queryRow(teamSubTeamHasChildrenQuery(teamId, subTeamId));

    return result.exists_flag == 1;
}

public isolated function subTeamUnitHasChildren(int subTeamMappingId, int unitId) returns boolean|error {
    ExistsFlagResult result =
        check databaseClient->queryRow(subTeamUnitHasChildrenQuery(subTeamMappingId, unitId));

    return result.exists_flag == 1;
}
