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
    string companyEmail;
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
    int designationId;
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
    string companyEmail;
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
    string companyEmail?;
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
