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

import ballerina/constraint;
import ballerina/sql;
import ballerinax/mysql;

# Email validation regex pattern
const EMAIL_PATTERN_STRING = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";

# Phone number validation regex pattern  
const PHONE_PATTERN_STRING = "^\\+?[0-9][0-9\\-()\\s]{5,19}$";

# Date validation regex pattern (YYYY-MM-DD format)
const DATE_PATTERN_STRING = "^\\d{4}-\\d{2}-\\d{2}$";

# URL validation regex pattern
const URL_PATTERN_STRING = "^(https?|ftp):\\/\\/[^\\s/$.?#][^\\s]*$";

# [Configurable] Database configs.
type DatabaseConfig record {|
    # If the MySQL server is secured, the username
    string user;
    # The password of the MySQL server for the provided username
    string password;
    # The name of the database
    string database;
    # Hostname of the MySQL server
    string host;
    # Port number of the MySQL server
    int port;
    # The `mysql:Options` configurations
    mysql:Options options?;
    # The `sql:ConnectionPool` configurations
    sql:ConnectionPool connectionPool?;
|};

# Employee basic information.
public type EmployeeBasicInfo record {|
    # Employee ID of the user
    @sql:Column {name: "id"}
    string employeeId;
    # First name of the user
    @sql:Column {name: "first_name"}
    string firstName;
    # Last name of the user
    @sql:Column {name: "last_name"}
    string lastName;
    # Work email of the user
    @sql:Column {name: "work_email"}
    string workEmail;
    # Thumbnail URL of the user
    @sql:Column {name: "employee_thumbnail"}
    string? employeeThumbnail;
    # Job role of the user
    @sql:Column {name: "job_role"}
    string jobRole;
|};

# User information with privileges.
public type UserInfo record {|
    *EmployeeBasicInfo;
    # Privileges assigned to the user
    int[] privileges = [];
|};

# Employee information.
public type Employee record {|
    *EmployeeBasicInfo;
    # Employees' provident fund number
    string? epf;
    # Employee location
    string employeeLocation;
    # Work location
    string workLocation;
    # Work phone number
    string? workPhoneNumber;
    # Start date
    string startDate;
    # Manager email
    string managerEmail;
    # Additional manager email
    string? additionalManagerEmail;
    # Employee status
    string employeeStatus;
    # Length of service
    int? lengthOfService;
    # Relocation status
    string? relocationStatus;
    # Subordinate count
    int? subordinateCount;
    # Probation end date
    string? probationEndDate;
    # Agreement end date
    string? agreementEndDate;
    # Employment type
    string employmentType;
    # Designation
    string designation;
    # Office
    string office;
    # Team
    string team;
    # Sub-team
    string subTeam;
    # Business unit
    string businessUnit;
|};

# Personal information of an employee.
public type EmployeePersonalInfo record {|
    # Primary key ID
    int id;
    # National Identity Card number
    string? nic;
    # Full name of the person
    @sql:Column {name: "full_name"}
    string fullName;
    # Name with initials
    @sql:Column {name: "name_with_initials"}
    string? nameWithInitials;
    # First name
    string? firstName;
    # Last name
    string? lastName;
    # Title (Mr./Ms./Dr./etc.)
    string? title;
    # Date of birth
    string? dob;
    # Age
    int? age;
    # Personal email address
    @sql:Column {name: "personal_email"}
    string? personalEmail;
    # Personal phone number
    @sql:Column {name: "personal_phone"}
    string? personalPhone;
    # Home phone number
    @sql:Column {name: "home_phone"}
    string? homePhone;
    # Home address
    string? address;
    # Postal code
    @sql:Column {name: "postal_code"}
    string? postalCode;
    # Country of residence
    string? country;
    # Nationality
    string? nationality;
|};

# Business unit.
public type BusinessUnit record {|
    # Business unit ID
    int id;
    # Business unit name
    string name;
|};

# Team.
public type Team record {|
    # Team ID
    int id;
    # Team name
    string name;
|};

# Sub team.
public type SubTeam record {|
    # Sub team ID
    int id;
    # Sub team name
    string name;
|};

# Unit.
public type Unit record {|
    # Unit ID
    int id;
    # Unit name
    string name;
|};

# Career function.
public type CareerFunction record {|
    # Career function ID
    int id;
    # Career function name
    @sql:Column {name: "career_function"}
    string careerFunction;
|};

# Office.
public type Office record {|
    # Office ID
    int id;
    # Office name
    string name;
    # Working locations
    @sql:Column {name: "working_locations"}
    json workingLocations;
|};

# Create personal info payload.
public type CreatePersonalInfoPayload record {|
    # National Identity Card number
    string nic;
    # Full name of the person
    @constraint:String {maxLength: 255}
    string fullName;
    # Name with initials
    @constraint:String {maxLength: 150}
    string? nameWithInitials = ();
    # First name
    @constraint:String {maxLength: 100}
    string? firstName = ();
    # Last name
    @constraint:String {maxLength: 100}
    string? lastName = ();
    # Title (Mr./Ms./Dr./etc.)
    @constraint:String {maxLength: 20}
    string? title = ();
    # Date of birth
    @constraint:String {pattern: re `^\d{4}-\d{2}-\d{2}$`}
    string? dob = ();
    # Age
    @constraint:Int {minValue: 0}
    int? age = ();
    # Personal email address
    @constraint:String {maxLength: 254, pattern: re `${EMAIL_PATTERN_STRING}`}
    string? personalEmail = ();
    # Personal phone number
    @constraint:String {pattern: re `${PHONE_PATTERN_STRING}`}
    string? personalPhone = ();
    # Home phone number
    @constraint:String {pattern: re `${PHONE_PATTERN_STRING}`}
    string? homePhone = ();
    # Home address
    @constraint:String {maxLength: 255}
    string? address = ();
    # Postal code
    @constraint:String {maxLength: 20}
    string? postalCode = ();
    # Country of residence
    @constraint:String {maxLength: 100}
    string? country = ();
    # Nationality
    @constraint:String {maxLength: 100}
    string? nationality = ();
|};

# Create employee payload.
public type CreateEmployeePayload record {|
    # First name of the user
    @constraint:String {maxLength: 150}
    string firstName;
    # Last name of the user
    @constraint:String {maxLength: 150}
    string lastName;
    # Employee's Provident Fund number
    @constraint:String {maxLength: 45}
    string? epf = ();
    # Employee location
    @constraint:String {maxLength: 255}
    string employeeLocation;
    # Work location
    @constraint:String {maxLength: 100}
    string workLocation;
    # Work email of the user
    @constraint:String {maxLength: 254, pattern: re `${EMAIL_PATTERN_STRING}`}
    string workEmail;
    # Work phone number
    @constraint:String {pattern: re `${PHONE_PATTERN_STRING}`}
    string? workPhoneNumber = ();
    # Start date
    @constraint:String {pattern: re `${DATE_PATTERN_STRING}`}
    string startDate;
    # Job role of the user
    @constraint:String {maxLength: 100}
    string jobRole;
    # Manager email
    @constraint:String {maxLength: 254, pattern: re `${EMAIL_PATTERN_STRING}`}
    string managerEmail;
    # Additional manager email
    @constraint:String {maxLength: 254, pattern: re `${EMAIL_PATTERN_STRING}`}
    string? additionalManagerEmail = ();
    # Employee status
    @constraint:String {maxLength: 50}
    string employeeStatus;
    # Employee thumbnail URL
    @constraint:String {maxLength: 2048, pattern: re `${URL_PATTERN_STRING}`}
    string? employeeThumbnail = ();
    # Subordinate count
    int? subordinateCount = ();
    # Probation end date
    @constraint:String {pattern: re `${DATE_PATTERN_STRING}`}
    string? probationEndDate = ();
    # Agreement end date
    @constraint:String {pattern: re `${DATE_PATTERN_STRING}`}
    string? agreementEndDate = ();
    # Employment type ID
    int? employmentTypeId = ();
    # Designation ID
    int designationId;
    # Office ID
    int officeId;
    # Team ID
    int teamId;
    # Sub-team ID
    int? subTeamId = ();
    # Business unit ID
    int businessUnitId;
    # Unit ID
    int? unitId = ();
    # Employee personal information
    CreatePersonalInfoPayload personalInfo;
|};

# Employee personal information update payload.
public type UpdateEmployeePersonalInfoPayload record {|
    # Personal email address
    @constraint:String {maxLength: 254, pattern: re `${EMAIL_PATTERN_STRING}`}
    string? personalEmail = ();
    # Personal phone number
    @constraint:String {pattern: re `${PHONE_PATTERN_STRING}`}
    string? personalPhone = ();
    # Home phone number
    @constraint:String {pattern: re `${PHONE_PATTERN_STRING}`}
    string? homePhone = ();
    # Home address
    @constraint:String {maxLength: 255}
    string? address = ();
    # Postal code
    @constraint:String {maxLength: 20}
    string? postalCode = ();
    # Country of residence
    @constraint:String {maxLength: 100}
    string? country = ();
|};

# [Database] Insert type for vehicle.
public type AddVehiclePayload record {|
    # Owner of the vehicle
    string owner;
    # Registration number of the vehicle
    string vehicleRegistrationNumber;
    # Type of the vehicle
    VehicleTypes vehicleType;
    # Status of the vehicle
    VehicleStatus vehicleStatus;
    # User who created the vehicle record
    string createdBy;
|};

# [Database] Vehicle type.
public type Vehicle record {|
    *AddVehiclePayload;
    # Auto-increment vehicle ID
    int vehicleId;
    # Timestamp when created
    string createdOn;
    # Timestamp when updated
    string updatedOn;
    # Person who updated the vehicle record
    string updatedBy;
|};

# Database records of vehicle
public type FetchVehicleResponse record {|
    *Vehicle;
    # Total count of the query
    int totalCount;
|};

# Vehicles array with total count.
public type Vehicles record {|
    # List of vehicles.
    Vehicle[] vehicles;
    # Total number of records.
    int totalCount;
|};

# [Database] Update payload of the vehicle.
public type UpdateVehiclePayload record {|
    # Id of the vehicle.
    int vehicleId;
    # Status of the vehicle
    VehicleStatus? vehicleStatus;
    # User who created the vehicle record
    string updatedBy;
|};
