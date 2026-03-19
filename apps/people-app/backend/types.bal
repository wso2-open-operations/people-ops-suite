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

# User information from the JWT payload.
public type JwtPayloadUserInfo record {|
    # User email 
    string email;
    # User groups
    string[] groups;
|};

# Payload for adding a vehicle.
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
|};

# Payload for updating a business unit-team mapping.
type UpdateBusinessUnitTeamPayload record {|
    # Email of the functional lead for the mapping
    string functionalLeadEmail?;
|};

# Payload for updating a team-sub team mapping.
type UpdateTeamSubTeamPayload record {|
    # Email of the functional lead for the mapping
    string functionalLeadEmail?;
|};

# Payload for updating a sub team-unit mapping.
type UpdateSubTeamUnitPayload record {|
    # Email of the functional lead for the mapping
    string functionalLeadEmail?;
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
public type OrgCompany record {|
    # Unique identifier of the company
    string id;
    # Display name of the company
    string name;
    # Total number of employees or members in the company
    int headCount;
    # List of business units belonging to the company
    OrgBusinessUnit[] businessUnits = [];
|};

# Payload for adding a new organization node (business unit, team, sub-team, or unit).
public type OrgNodeInfo record {|
    # Name of the node
    string name;
    # Email of the head of the node
    string headEmail;
|};

# Internal payload for inserting a row into any org-node mapping table.
public type OrgNodeMappingPayload record {|
    # ID of the parent junction row
    string parentId;
    # ID of the newly created child node
    string childId;
    # Functional lead email for the mapping
    string functionalLeadEmail;
|};

# Reference to a parent organization node with mapping details.
public type OrgNodeLinkInfo record {|
    # ID of the parent node
    string id;
    # Functional lead email for the mapping
    string functionalLeadEmail;
|};

# Payload for adding any organization node.
public type OrgNodePayload record {|
    # Name of the node
    string name;
    # Head email of the node
    string headEmail;
    # Parent node link details — required for mapping nodes only
    OrgNodeLinkInfo orgNodeLinkInfo?;
|};
# Request body for creating a parking reservation (before payment).
type CreateParkingReservationRequest record {|
    # Slot identifier (e.g. B-01)
    string slotId;
    # Booking date (YYYY-MM-DD), same-day only
    @constraint:String {
        pattern: {
            value: re `${database:DATE_PATTERN_STRING}`,
            message: "Booking date must be in YYYY-MM-DD format."
        }
    }
    string bookingDate;
    # Registered vehicle ID (car only)
    int vehicleId;
|};

# Response after creating a PENDING reservation.
type CreateParkingReservationResponse record {|
    # Reservation identifier
    int reservationId;
    # Amount to be paid in coins
    decimal coinsAmount;
|};

# Request body for confirming reservation with transaction hash.
type ConfirmParkingReservationRequest record {|
    # Reservation identifier (from create response)
    int reservationId;
    # Transaction hash from payment
    string transactionHash;
|};

# Car park config returned to the micro app (e.g. for Wallet app redirect).
type CarParkConfigResponse record {|
    # Master wallet address for O2C car park payments (0x-prefixed).
    string publicWalletAddress;
|};
