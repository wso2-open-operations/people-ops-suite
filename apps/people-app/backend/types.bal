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
import people.database;

import ballerina/constraint;

// # Payload for adding a vehicle.
type NewVehicle record {|
    # Registration number of the vehicle
    @constraint:String {
        pattern: {
            value: re `^([A-Za-z]{1,3}|\d{1,3}) \d{4}$`,
            message: "Vehicle registration number should be a valid pattern in Sri Lanka."
        }
    }
    string vehicleRegistrationNumber;
    # Type of the vehicle
    database:VehicleTypes vehicleType;
|};

# Base open payload for all organization hierarchy PATCH requests.
type OrgPatchPayload record {
    # Email of the user performing the update
    string updatedBy;
};

# Payload for updating a standalone organization unit.
type UnitPayload record {|
    # New name for the unit
    string name?;
    # Email of the new head of the unit
    string headEmail?;
    # Email of the user performing the update
    string updatedBy;
|};

# Payload for updating a business unit-team mapping.
type UpdateBusinessUnitTeamPayload record {|
    # Email of the functional lead for the mapping
    string functionalLeadEmail?;
    # Email of the user performing the update
    string updatedBy;
|};

# Payload for updating a team-sub team mapping.
type UpdateTeamSubTeamPayload record {|
    # Email of the functional lead for the mapping
    string functionalLeadEmail?;
    # Email of the user performing the update
    string updatedBy;
|};

# Payload for updating a sub team-unit mapping.
type UpdateSubTeamUnitPayload record {|
    # Email of the functional lead for the mapping
    string functionalLeadEmail?;
    # Email of the user performing the update
    string updatedBy;
|};

# Payload for deleting a business unit.
public type DeleteBusinessUnitPayload record {|
    # Email of the user performing the deletion
    string updatedBy;
|};

# Payload for deleting a business unit-team mapping.
public type DeleteBusinessUnitTeamPayload record {|
    # Email of the user performing the deletion
    string updatedBy;
|};

# Payload for deleting a team-sub team mapping.
public type DeleteTeamSubTeamPayload record {|
    # Email of the user performing the deletion
    string updatedBy;
|};

# Payload for deleting a sub team-unit mapping.
public type DeleteSubTeamUnitPayload record {|
    # Email of the user performing the deletion
    string updatedBy;
|};

# Employee basic information.
public type EmployeeBasicInfo record {|
    # Employee ID of the user
    string employeeId;
    # First name of the user
    string firstName;
    # Last name of the user
    string lastName;
    # Work email of the user
    string workEmail;
    # Thumbnail URL of the user
    string? employeeThumbnail;
|};

# Represents the database organization business unit.
public type OrgBusinessUnit record {|
    *database:OrgBusinessUnit;
|};

# Represents the top-level company in the organization hierarchy.
public type Company record {|
    # Unique identifier of the company
    string id;
    # Display name of the company
    string name;
    # Total number of employees or members in the company
    int headCount;
    # List of business units belonging to the company
    OrgBusinessUnit[] businessUnits = [];
|};

# Payload for adding a new business unit.
public type BusinessUnitPayload record {|
    # Name of the business unit
    string name;
    # Email of the heading email
    string headEmail;
|};

# Payload for adding a new team.
public type TeamPayload record {|
    # Name of the team
    string name;
    # Email of the head of the team
    string headEmail;
|};

# Payload for adding a new sub team.
public type SubTeamPayload record {|
    # Name of the sub team
    string name;
    # Email of the head of the sub team
    string headEmail;
|};

# Payload for adding a new unit.
public type UnitOrgPayload record {|
    # Name of the unit
    string name;
    # Email of the head of the unit
    string headEmail;
|};
