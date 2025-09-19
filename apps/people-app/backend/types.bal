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
import people.database;

import ballerina/constraint;
import ballerina/time;

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

# Response structure of retrieving user response to the webapp
public type UserResponse record {|
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
    # User Privileges
    int[] privileges;
|};

# Response structure of retrieving employee_info
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

# Response structure of updating employee_info
public type UpdateEmployeeInfoPlayload record {|
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

# Structure of the org data filter value
type FilterValue boolean|int|string|int[]|string[]|time:Date;

# [OrgRecord] Structure of organization filter record
public type OrgDetailsFilter record {|
    # Id of the business unit
    int[]? businessUnitIds = ();
    # Name of the business unit
    string[]? businessUnits = ();
|};

# [OrgRecord] Structure of org record response.
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

# Structure of Business Unit.
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

# Structure of Team.
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

# Structure of Business Unit.
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

# Structure of Team.
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

# Structure of Sub Team.
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

# Structure of Sub Team.
public type Unit record {
    # Id of the sub team
    int id;
    # Title of the sub team
    string unit;
    # Email of the head
    string headEmail;
    # Status of unit
    int isActive;
};

# Structure of json response
public type Row record {|
    # Json execution result
    json result;
|};

# Structure of Company.
public type Company record {
    # Id of the company
    int id;
    # Name of the company
    string name;
    # Location of the company
    string location;
};

# Structure of Office.
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
    # The unique identifier for the designation
    int id;
    # The name of the designation
    string name;
    # The job band or level associated with the designation
    int jobBand;
    # The identifier of the associated career function
    int careerFunctionId;
|};

# [Database] Represents a career function within the organization.
public type CareerFunction record {|
    # The unique identifier for the career function
    int id;
    # The name of the career function
    string name;
|};

# [Database] Represents an employment type in the organization.
public type EmploymentType record {|
    # The unique identifier for the employment type
    int id;
    # The name of the employment type
    string name;
|};
