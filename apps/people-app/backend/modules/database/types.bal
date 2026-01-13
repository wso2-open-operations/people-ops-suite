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
public const EMAIL_PATTERN_STRING = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";

# Phone number validation regex pattern
const PHONE_PATTERN_STRING = "^[0-9+\\-()\\s]*[0-9][0-9+\\-()\\s]*$";

# Date validation regex pattern (YYYY-MM-DD format)
const DATE_PATTERN_STRING = "^\\d{4}-\\d{2}-\\d{2}$";

# URL validation regex pattern
const URL_PATTERN_STRING = "^(https?|ftp)://[^\\s/$.?#].[^\\s]*$";

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
    # Employment location
    string employmentLocation;
    # Work location
    string workLocation;
    # Start date
    string startDate;
    # Manager email
    string managerEmail;
    # Additional manager email
    string? additionalManagerEmails;
    # Employee status
    string employeeStatus;
    # Continuous service record reference (Employee ID)
    string? continuousServiceRecord;
    # Probation end date
    string? probationEndDate;
    # Agreement end date
    string? agreementEndDate;
    # Employment type
    string employmentType;
    # Designation
    string designation;
    # Job role of the user
    string secondaryJobTitle;
    # Office
    string office;
    # Business unit
    string businessUnit;
    # Team
    string team;
    # Sub-team
    string subTeam;
    # Unit
    string? unit;
    # Computed field: number of subordinates this employee manages
    int subordinateCount?;
|};

# Personal information of an employee.
public type EmployeePersonalInfo record {|
    # Primary key ID
    int id;
    # National Identity Card number
    @sql:Column {name: "nic_or_passport"}
    string? nicOrPassport;
    # First name
    string? firstName;
    # Last name
    string? lastName;
    # Title (Mr./Ms./Dr./etc.)
    string? title;
    # Date of birth
    string? dob;
    # Gender of the person
    string? gender;
    # Personal email address
    @sql:Column {name: "personal_email"}
    string? personalEmail;
    # Personal phone number
    @sql:Column {name: "personal_phone"}
    string? personalPhone;
    # Resident number
    @sql:Column {name: "resident_number"}
    string? residentNumber;
    # Address line 1
    @sql:Column {name: "address_line_1"}
    string? addressLine1;
    # Address line 2
    @sql:Column {name: "address_line_2"}
    string? addressLine2;
    # City
    string? city;
    # State or province
    @sql:Column {name: "state_or_province"}
    string? stateOrProvince;
    # Postal code
    @sql:Column {name: "postal_code"}
    string? postalCode;
    # Country of residence
    string? country;
    # Nationality
    string? nationality;
    # Emergency contacts
    @sql:Column {name: "emergency_contacts"}
    json? emergencyContacts;
|};

# Continuous service record information.
public type ContinuousServiceRecordInfo record {|
    # Primary key ID
    @sql:Column {name: "id"}
    int id;
    # Employee ID of the user
    @sql:Column {name: "employeeId"}
    string employeeId;
    # First name
    string firstName;
    # Last name
    string lastName;
    # Employment location
    string employmentLocation;
    # Work location
    string workLocation;
    # Start date
    string startDate;
    # Manager email
    string managerEmail;
    # Additional manager emails
    string? additionalManagerEmails;
    # Designation
    string designation;
    # Job role of the user
    string secondaryJobTitle;
    # Office
    string office;
    # Business unit
    string businessUnit;
    # Team
    string team;
    # Sub-team
    string subTeam;
    # Unit
    string? unit;
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

# Designation.
public type Designation record {|
    # Designation ID
    int id;
    # Designation name
    string designation;
    # Job band
    @sql:Column {name: "job_band"}
    int jobBand;
|};

# Office.
public type Office record {|
    # Office ID
    int id;
    # Office name
    string name;
    # Office location
    @sql:Column {name: "location"}
    string location;
    # Working locations
    @sql:Column {name: "working_locations"}
    json workingLocations;
|};

# Employment type.
public type EmploymentType record {|
    # ID of the employment type
    int id;
    # Name of the employment type
    string name;
|};

# Search employee personal information payload.
public type SearchEmployeePersonalInfoPayload record {|
    # National Identity Card number or Passport
    string nicOrPassport?;
|};

# Emergency contact information.
public type EmergencyContact record {|
    # Name of the emergency contact
    string name;
    # Relationship with the employee
    string relationship;
    # Telephone number of the emergency contact
    string telephone;
    # Mobile number of the emergency contact
    string mobile;
|};

# Create personal info payload.
public type CreatePersonalInfoPayload record {|
    # National Identity Card number or Passport
    string nicOrPassport;
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
    # Gender of the person
    @constraint:String {maxLength: 20}
    string? gender = ();
    # Personal email address
    @constraint:String {maxLength: 254, pattern: re `${EMAIL_PATTERN_STRING}`}
    string? personalEmail = ();
    # Personal phone number
    @constraint:String {pattern: re `${PHONE_PATTERN_STRING}`}
    string? personalPhone = ();
    # Resident number
    @constraint:String {pattern: re `${PHONE_PATTERN_STRING}`}
    string? residentNumber = ();
    # Address line 1
    @constraint:String {maxLength: 255}
    string? addressLine1 = ();
    # Address line 2
    @constraint:String {maxLength: 255}
    string? addressLine2 = ();
    # City
    @constraint:String {maxLength: 100}
    string? city = ();
    # State or province
    @constraint:String {maxLength: 100}
    string? stateOrProvince = ();
    # Postal code
    @constraint:String {maxLength: 20}
    string? postalCode = ();
    # Country of residence
    @constraint:String {maxLength: 100}
    string? country = ();
    # Nationality
    @constraint:String {maxLength: 100}
    string? nationality = ();
    # Emergency contacts
    EmergencyContact[]? emergencyContacts = ();
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
    string employmentLocation;
    # Work location
    @constraint:String {maxLength: 100}
    string workLocation;
    # Work email of the user
    @constraint:String {maxLength: 254, pattern: re `${EMAIL_PATTERN_STRING}`}
    string workEmail;
    # Start date
    @constraint:String {pattern: re `${DATE_PATTERN_STRING}`}
    string startDate;
    # Secondary job title
    @constraint:String {maxLength: 100}
    string secondaryJobTitle;
    # Manager email
    @constraint:String {maxLength: 254, pattern: re `${EMAIL_PATTERN_STRING}`}
    string managerEmail;
    # Additional manager emails
    string[] additionalManagerEmails = [];
    # Employee status
    @constraint:String {maxLength: 50}
    string employeeStatus;
    # Employee thumbnail URL
    @constraint:String {maxLength: 512, pattern: re `${URL_PATTERN_STRING}`}
    string? employeeThumbnail = ();
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
    # Continuous service record
    @constraint:String {maxLength: 99}
    string? continuousServiceRecord = ();
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
    # Resident number
    @constraint:String {pattern: re `${PHONE_PATTERN_STRING}`}
    string? residentNumber = ();
    # Address line 1
    @constraint:String {maxLength: 255}
    string? addressLine1 = ();
    # Address line 2
    @constraint:String {maxLength: 255}
    string? addressLine2 = ();
    # City
    @constraint:String {maxLength: 100}
    string? city = ();
    # State or province
    @constraint:String {maxLength: 100}
    string? stateOrProvince = ();
    # Postal code
    @constraint:String {maxLength: 20}
    string? postalCode = ();
    # Country of residence
    @constraint:String {maxLength: 100}
    string? country = ();
    # Emergency contacts
    EmergencyContact[]? emergencyContacts = ();
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
