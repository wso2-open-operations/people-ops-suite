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
import ballerina/time;
import ballerinax/mysql;

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

# Response structure of retrieving user
public type UserInfo record {|
    # Id of the employee
    string employeeId;
    # Email of the employee
    string workEmail;
    # First name of the employee
    string firstName;
    # Last name of the employee
    string lastName;
    # Job role
    string jobRole;
    # Thumbnail of the employee
    string? employeeThumbnail;
|};

# [Database] EmployeeInfo type
public type EmployeeInfo record {|
    # Id of the employee
    string id;
    # Last name of the employee
    string lastName;
    # First name of the employee
    string firstName;
    # Official WSO2 email address of the employee
    string wso2Email;
    # Work phone number of the employee
    string workPhoneNumber;
    # Employee Provident Fund (EPF) number
    string? epf;
    # Work location of the employee
    string? workLocation;
    # Location where the employee is based
    string employeeLocation;
    # Start date of employment
    time:Date startDate;
    # Job role of the employee
    string jobRole;
    # Job band of the employee
    string jobBand;
    # Email address of the employee’s direct manager
    string? managerEmail;
    # Email address of the reporting manager
    string? reportToEmail;
    # Email address of the additional manager (if applicable)
    string? additionalManagerEmail;
    # Email address of the additional reporting manager (if applicable)
    string? additionalReportToEmail;
    # Current status of the employee (e.g., Active, Inactive)
    string? employeeStatus;
    # Length of service in years or months
    int? lengthOfService;
    # Relocation status of the employee
    string? relocationStatus;
    # URL or path to the employee’s thumbnail image
    string? employeeThumbnail;
    # Number of subordinates reporting to this employee
    int? subordinateCount;
    # Last updated timestamp of the employee record
    time:Utc? timestamp;
    # End date of the probation period
    time:Date probationEndDate;
    # End date of the employment agreement
    time:Date? agreementEndDate;
    # Type of employment (e.g., Full-time, Part-time, Contract)
    string? employmentType;
    # Name of the company the employee belongs to
    string company;
    # Name of the office where the employee works
    string office;
    # Name of the business unit of the employee
    string businessUnit;
    # Name of the team of the employee
    string team;
    # Name of the sub-team of the employee
    string subTeam;
    # Name of the unit of the employee
    string unit;
|};

# [Database] Response Structure of updating employee_info
public type UpdatedEmployeeInfo record {|
    # Id of the employee
    string id;
    # Last name of the employee
    string lastName?;
    # First name of the employee
    string firstName?;
    # Official WSO2 email address of the employee
    string wso2Email?;
    # Work phone number of the employee
    string workPhoneNumber?;
    # Employee Provident Fund (EPF) number
    string epf?;
    # Work location of the employee
    string workLocation?;
    # Location where the employee is based
    string employeeLocation?;
    # Start date of employment
    time:Date startDate?;
    # Job role of the employee
    string jobRole?;
    # Job band of the employee
    string jobBand?;
    # Email address of the employee’s direct manager
    string managerEmail?;
    # Email address of the reporting manager
    string reportToEmail?;
    # Email address of the additional manager (if applicable)
    string additionalManagerEmail?;
    # Email address of the additional reporting manager (if applicable)
    string additionalReportToEmail?;
    # Current status of the employee (e.g., Active, Inactive)
    string employeeStatus?;
    # Length of service in years or months
    int lengthOfService?;
    # Relocation status of the employee
    string relocationStatus?;
    # URL or path to the employee’s thumbnail image
    string employeeThumbnail?;
    # Number of subordinates reporting to this employee
    int subordinateCount?;
    # Last updated timestamp of the employee record
    time:Utc timestamp?;
    # End date of the probation period
    time:Date probationEndDate?;
    # End date of the employment agreement
    time:Date agreementEndDate?;
    # Type of employment (e.g., Full-time, Part-time, Contract)
    string employmentType?;
    # Name of the company the employee belongs to
    string company?;
    # Name of the office where the employee works
    string office?;
    # Name of the business unit of the employee
    string businessUnit?;
    # Name of the team of the employee
    string team?;
    # Name of the sub-team of the employee
    string subTeam?;
    # Name of the unit of the employee
    string unit?;
|};

# [Database] filter value to filter db actions
type FilterValue boolean|int|string|int[]|string[]|time:Date;

public type OrgDetailsFilter record {|
    # Id of the business unit
    int[]? businessUnitIds = ();
    # Name of the business unit
    string[]? businessUnits = ();
|};

# [OrgRecord] Structure a record.
public type OrgRecord record {
    # Business Unit
    string businessUnit;
    # Team
    string team;
    # Sub Team
    string subTeam;
    # Unit
    string unit;
};

# [Database] Structure a Business Unit to iterate in a resultstream 
public type BusinessUnitStr record {
    # Id of the business unit
    int id;
    # Title of the business unit
    string businessUnit;
    # Email of the head
    string headEmail;
    # Status of unit
    int isActive;
    # List of teams
    string teams;
};

# [Database] Structure of a Team to iterate in a resultstream 
public type TeamStr record {
    # Id of the team
    int id;
    # Title of the team
    string team;
    # Email of the head
    string headEmail;
    # Status of unit
    int isActive;
    # List of sub teams
    string? subTeams;
};

# [Database] Structure Business Unit to iterate in a resultstream 
public type BusinessUnit record {
    # Id of the business unit
    int id;
    # Title of the business unit
    string businessUnit;
    # Email of the head
    string headEmail;
    # List of teams
    Team[]? teams;
};

# [Database] Structure a Team to iterate in a resultstream 
public type Team record {
    # Id of the team
    int id;
    # Title of the team
    string team;
    # Email of the head
    string headEmail;
    # Status of unit
    int isActive;
    # List of sub teams
    SubTeam[]? subTeams;
};

# [Database] Sub Team to iterate in a resultstream 
public type SubTeam record {
    # Id of the sub team
    int id;
    # Title of the sub team
    string subTeam;
    # Email of the head
    string headEmail;
    # Status of unit
    int isActive;
    # List of units
    Unit[]? units;
};

# [Database] Sub Team to iterate in a resultstream 
public type Unit record {
    # Id of the unit
    int id;
    # Title of the unit
    string unit;
    # Email of the head 
    string headEmail;
    # Status of unit
    int isActive;
};

# [Databse] Structure of json type db retrieval 
public type Row record {|
    # Result of a db query
    json result;
|};

# [Database] Structure of a Company.
public type Company record {
    # Id of the company
    int id;
    # Name of the company
    string name;
    # Location of the company
    string location;

};

# [Database] Structure of a Office.
public type Office record {
    # Id of the office
    int id;
    # Name of the office
    string office;
    # Location of the office
    string location;
};

# [Database] Represents a designation in the organization.
public type Designation record {|
    # The unique identifier for the designation.
    int id;
    # The name of the designation.
    string name;
    # The job band or level associated with the designation.
    int jobBand;
    # The identifier of the associated career function.
    int careerFunctionId;
|};

# [Database] Represents a career function within the organization.
public type CareerFunction record {|
    # The unique identifier for the career function.
    int id;
    # The name of the career function.
    string name;
|};

# [Database] Represents an employment type in the organization.
public type EmploymentType record {|
    # The unique identifier for the employment type.
    int id;
    # The name of the employment type.
    string name;
|};
