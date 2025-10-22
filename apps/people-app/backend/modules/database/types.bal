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
import ballerinax/mysql;
import ballerina/sql;
import ballerina/time;

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
    string epf;
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
    # Report-to email
    string reportToEmail;
    # Additional manager email
    string? additionalManagerEmail;
    # Additional report-to email
    string? additionalReportToEmail;
    # Employee status
    string employeeStatus;
    # Length of service
    int lengthOfService;
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
    # Personal info ID
    int personal_info_id;
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

# Employee personal information update payload.
public type UpdateEmployeePersonalInfoPayload record {|
    # Personal email address
    string? personalEmail;
    # Personal phone number
    string? personalPhone;
    # Home phone number
    string? homePhone;
    # Home address
    string? address;
    # Postal code
    string? postalCode;
    # Country of residence
    string? country;
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

# [Database] Represents a recruit record.
public type Recruit record {|
    # The unique identifier for the recruit
    int id;
    # First name of the recruit
    string firstName;
    # Last name of the recruit
    string lastName;
    # Corporate email address of the recruit
    string workEmail;
    # Date of joining
    time:Date dateOfJoin;
    # End date of the probation period           
    time:Date? probationEndDate;
    # End date of the employment agreement     
    time:Date? agreementEndDate;
    # Location where the recruit is based    
    string employeeLocation;
    # Work location of the recruit
    string workLocation;
    # Email address of the reporting manager
    string? reportsTo;
    # Email address of the recruit’s direct manager
    string managerEmail;
    # Additional comments about the recruit
    string? additionalComments;
    # Current status of the recruit 
    string status;
    # Name of the business unit of the recruit          
    string businessUnit;
    # Name of the unit of the recruit
    string unit;
    # Name of the team of the recruit
    string team;
    # Name of the sub-team of the recruit
    string subTeam;
    # Name of the company the recruit belongs to
    string company;
    # Name of the office where the recruit works
    string office;
    # Type of employment 
    string employmentType;
    # Designation id of the recruit
    string designation;
    # ID of the personal info
    int personalInfoId;
    # Compensation data of the recruit
    json compensation;
|};

#[Database] Insert type for recruit.
public type AddRecruitPayload record {|
    # First name of the recruit
    string firstName;
    # Last name of the recruit
    string lastName;
    # Corporate email address of the recruit
    string workEmail;
     # Date of joining
    time:Date dateOfJoin;
    # End date of the probation period           
    time:Date? probationEndDate;
    # End date of the employment agreement     
    time:Date? agreementEndDate;
    # Location where the recruit is based
    string? employeeLocation;
    # Work location of the recruit
    string? workLocation;
    # Designation id of the recruit
    int designationId;
    # Email address of the recruit’s direct manager
    string? managerEmail;
    # Compensation data of the recruit
    json compensation;
    # Additional comments about the recruit
    string? additionalComments;
    # Current status of the recruit 
    string status;
    # ID of the business unit
    int businessUnit;
    # ID of the unit
    int? unit;
    # ID of the team
    int team;
    # ID of the sub-team
    int subTeam;
    # ID of the company
    int company;
    # ID of the office
    int office;
    # ID of the employment type
    int employmentType;
    # ID of the personal info
    int personalInfoId;
    # Email of the person who created the recruit record
    string createdBy;
|};

# Payload type for updating a recruit.
public type UpdateRecruitPayload record {|
    # First name of the recruit
    string firstName?;
    # Last name of the recruit
    string lastName?;
    # Corporate email address of the recruit
    string workEmail?;
    # Date of joining
    time:Date dateOfJoin?;
    # End date of the probation period
    time:Date probationEndDate?;
    # End date of the employment agreement
    time:Date agreementEndDate?;
    # Location where the recruit is based
    string employeeLocation?;
    # Work location of the recruit
    string workLocation?;
    # Designation id of the recruit
    int designationId?;
    # Email address of the recruit’s direct manager
    string managerEmail?;
    # Compensation data of the recruit
    json compensation?;  
    # Additional comments about the recruit       
    string additionalComments?;
    # Current status of the recruit
    string status?;
    # ID of the business unit
    int businessUnit?;
    # Id of the unit
    int unit?;
    # ID of the team
    int team?;
    # Id of the sub-team
    int subTeam?;
    # ID of the company
    int company?;
    # ID of the office
    int office?;
    # ID of the employment type
    int employmentType?;
    # ID of the personal info
    int personalInfoId?;
    # Person who updated the recruit record
    string updatedBy;
|};
