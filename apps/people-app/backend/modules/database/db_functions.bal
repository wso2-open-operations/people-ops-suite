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

# Fetch employee basic information.
#
# + email - Employee's work email address
# + return - Employee basic information
public isolated function getEmployeeBasicInfo(string email) returns EmployeeBasicInfo|error? {
    EmployeeBasicInfo|error employeeBasicInfo = databaseClient->queryRow(getEmployeeBasicInfoQuery(email));
    return employeeBasicInfo is sql:NoRowsError ? () : employeeBasicInfo;
}

# Fetch employee detailed information.
#
# + id - Employee ID
# + return - Get employee detailed information
public isolated function getEmployeeInfo(string id) returns Employee|error? {
    Employee|error employeeInfo = databaseClient->queryRow(getEmployeeInfoQuery(id));
    return employeeInfo is sql:NoRowsError ? () : employeeInfo;
}

# Fetch employee personal information.
#
# + id - Employee ID
# + return - Get employee personal information
public isolated function getEmployeePersonalInfo(string id) returns EmployeePersonalInfo|error? {
    EmployeePersonalInfo|error employeePersonalInfo = databaseClient->queryRow(getEmployeePersonalInfoQuery(id));
    return employeePersonalInfo is sql:NoRowsError ? () : employeePersonalInfo;
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

# Function to fetch a recruit by ID.
#
# + recruitId - ID of the recruit to fetch
# + return - Recruit or an error or null if not found
public isolated function fetchRecruitById(int recruitId) returns Recruit|error? {
    Recruit|error result = databaseClient->queryRow(getRecruitByIdQuery(recruitId));

    if result is sql:NoRowsError {
        return ();
    }

    return result;
}

# Function to fetch all recruits.
#
# + return - Array of recruits or an error
public isolated function fetchRecruits() returns Recruit[]|error? {
    stream<Recruit, error?> recruitsResponse = databaseClient->query(getRecruits());

    Recruit[] recruits = [];
    check from Recruit recruit in recruitsResponse
        do {
            recruits.push(recruit);
        };

    return recruits;
}

# Persist new recruit in DB.
#
# + recruit - Recruit payload
# + createdBy - User who creates the recruit entry
# + return - Id of the newly created recruit or an error
public isolated function addRecruit(AddRecruitPayload recruit, string createdBy) returns int|error {
    sql:ExecutionResult executionResult = check databaseClient->execute(addRecruitQuery(recruit, createdBy));

    return executionResult.lastInsertId.ensureType(int);
}

# Update recruit info dynamically based on changed fields.
#
# + id - Recruit id
# + recruit - Recruit payload with updated fields
# + return - error or null
public isolated function UpdateRecruit(int id, UpdateRecruitPayload recruit) returns error? {
    if recruit.entries().length() === 0 {
        return error(string `No data to update for recruit with id: ${id}`);
    }

    sql:ExecutionResult|sql:Error executionResult = databaseClient->execute(updateRecruitQuery(id, recruit));

    if executionResult is sql:Error {
        string customError = string `Error occurred while updating recruit with id ${id}`;
        log:printError(customError, executionResult);
        return error(customError);
    }

    if executionResult.affectedRowCount == 0 {
        return error(string `No recruit found to update for id: ${id}`);
    }
}
