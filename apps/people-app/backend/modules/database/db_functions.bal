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
# + return - Error is so
public isolated function updateVehicle(UpdateVehiclePayload payload) returns boolean|error {
    sql:ExecutionResult executionResults = check databaseClient->execute(updateVehicleQuery(payload));
    if executionResults.affectedRowCount < 0 {
        return false;
    }
    return true;
}
