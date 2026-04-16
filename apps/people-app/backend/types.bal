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
    # First hour (Asia/Colombo) when same-day reservations are allowed.
    int reservationWindowStartHour;
    # Hour after which same-day reservations are no longer allowed.
    int reservationWindowEndHour;
|};

# Internal payload for inserting a row into any org-node mapping table.
public type OrgNodeMappingPayload record {|
    # ID of the parent junction row
    @constraint:String {
        pattern: {
            value: PRINTABLE_CHARACTERS_FORMAT,
            message: "Corrupted parent-id: Id cannot be empty & should contain valid characters"
        }
    }
    string parentId;
    # ID of the newly created child node
    @constraint:String {
        pattern: {
            value: PRINTABLE_CHARACTERS_FORMAT,
            message: "Corrupted child-id: Id cannot be empty & should contain valid characters"
        }
    }
    string childId;
    # Functional lead email for the mapping
    @constraint:String {
        pattern: {
            value: WSO2_EMAIL,
            message: string `Functional lead ${ERROR_INVALID_EMAIL} `
        }
    }
    string functionalLeadEmail?;
|};

# Payload for updating a standalone organization unit.
type UnitPayload record {|
    # New name for the unit
    @constraint:String {
        pattern: {
            value: PRINTABLE_CHARACTERS_FORMAT,
            message: "Name cannot be empty and should contain valid characters"
        }
    }
    string name?;
    # Email of the new head of the unit
    @constraint:String {
        pattern: {
            value: WSO2_EMAIL,
            message: string `Head ${ERROR_INVALID_EMAIL} `
        }
    }
    string headEmail?;
|};

# Payload for updating a business unit-team mapping.
type UpdateOrgUnitPayload record {|
    # Email of the functional lead for the mapping
    @constraint:String {
        pattern: {
            value: WSO2_EMAIL,
            message: string `Functional lead ${ERROR_INVALID_EMAIL} `
        }
    }
    string functionalLeadEmail;
|};

# Represents the database organization business unit.
public type OrgBusinessUnit record {|
    *database:OrgBusinessUnit;
|};

# Represents the top-level company in the organization hierarchy.
public type OrgCompany record {|
    # Unique identifier of the company
    int id;
    # Display name of the company
    string name;
    # Total number of employees or members in the company
    int headCount;
    # List of business units belonging to the company
    OrgBusinessUnit[] businessUnits = [];
|};

public type CreateBusinessUnitPayload record {|
    # Name of the business unit
    @constraint:String {
        pattern: {
            value: PRINTABLE_CHARACTERS_FORMAT,
            message: "Name cannot be empty and should contain valid characters"
        }
    }
    string name;
    # Email of the head of the business unit
    @constraint:String {
        pattern: {
            value: WSO2_EMAIL,
            message: string `Head ${ERROR_INVALID_EMAIL} `
        }
    }
    string headEmail?;
|};

public type CreateBusinessUnitTeamPayload record {|
    # ID of the business unit
    int businessUnitId;
    # ID of the team — required only when mapping an existing team
    int teamId?;
    # Email of the functional lead for the mapping
    @constraint:String {
        pattern: {
            value: WSO2_EMAIL,
            message: string `Functional lead ${ERROR_INVALID_EMAIL} `
        }
    }
    string functionalLeadEmail?;
|};

public type CreateTeamPayload record {|
    # Name of the team
    @constraint:String {
        pattern: {
            value: PRINTABLE_CHARACTERS_FORMAT,
            message: "Name cannot be empty and should contain valid characters"
        }
    }
    string name;
    # Email of the head of the team
    @constraint:String {
        pattern: {
            value: WSO2_EMAIL,
            message: string `Head ${ERROR_INVALID_EMAIL} `
        }
    }
    string headEmail?;
    # Business unit-team mapping details — required only when mapping to a business unit
    CreateBusinessUnitTeamPayload businessUnit?;
|};

public type CreateBusinessUnitTeamSubTeamPayload record {|
    # ID of the business unit-team mapping
    int businessUnitTeamId;
    # ID of the sub-team — required only when mapping an existing sub-team
    int subTeamId?;
    # Email of the functional lead for the mapping
    @constraint:String {
        pattern: {
            value: WSO2_EMAIL,
            message: string `Functional lead ${ERROR_INVALID_EMAIL} `
        }
    }
    string functionalLeadEmail?;
|};

public type CreateSubTeamPayload record {|
    # Name of the sub-team
    @constraint:String {
        pattern: {
            value: PRINTABLE_CHARACTERS_FORMAT,
            message: "Name cannot be empty and should contain valid characters"
        }
    }
    string name;
    # Email of the head of the sub-team
    @constraint:String {
        pattern: {
            value: WSO2_EMAIL,
            message: string `Head ${ERROR_INVALID_EMAIL} `
        }
    }
    string headEmail?;
    # Business unit-team-sub-team mapping details — required only when mapping to a business unit-team
    CreateBusinessUnitTeamSubTeamPayload businessUnitTeam?;
|};

public type CreateBusinessUnitTeamSubTeamUnitPayload record {|
    # ID of the business unit-team-sub-team mapping
    int businessUnitTeamSubTeamId;
    # ID of the unit — required only when mapping an existing unit
    int unitId?;
    # Email of the functional lead for the mapping
    @constraint:String {
        pattern: {
            value: WSO2_EMAIL,
            message: string `Functional lead ${ERROR_INVALID_EMAIL} `
        }
    }
    string functionalLeadEmail?;
|};

public type CreateUnitPayload record {|
    # Name of the unit
    @constraint:String {
        pattern: {
            value: PRINTABLE_CHARACTERS_FORMAT,
            message: "Name cannot be empty and should contain valid characters"
        }
    }
    string name;
    # Email of the head of the unit
    @constraint:String {
        pattern: {
            value: WSO2_EMAIL,
            message: string `Head ${ERROR_INVALID_EMAIL} `
        }
    }
    string headEmail?;
    # Business unit-team-sub-team-unit mapping details — required only when mapping to a business unit-team-sub-team
    CreateBusinessUnitTeamSubTeamUnitPayload businessUnitTeamSubTeamUnit?;
|};

public type RenameBusinessUnitName record {|
    int businessUnitId;
    string name;
|};

public type RenameTeamName record {|
    int teamId;
    string name;
|};

public type RenameSubTeamName record {|
    int subTeamId;
    string name;
|};

public type RenameUnitName record {|
    int unitId;
    string name;
|};
