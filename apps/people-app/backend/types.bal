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

# Response structure of retrieving user.
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

# Response structure of retrieving user response to the webapp.
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

# Personal information record mapped from the `personal_info` table.
public type PersonalInfo record {|
    # Unique identifier of the person
    int id;
    # National identity card number
    string nic;
    # Full legal name
    string fullName;
    # Name with initials, if available
    string? nameWithInitials;
    # First name or given name
    string? firstName;
    # Last name or family name
    string? lastName;
    # Honorific title (e.g., Mr., Ms., Dr.)
    string title;
    # Date of birth
    time:Date dob;
    # Age in years
    int? age;
    # Personal email address
    string personalEmail;
    # Personal mobile phone number
    string personalPhone;
    # Home landline number
    string homePhone;
    # Residential address
    string address;
    # Postal/ZIP code
    string? postalCode;
    # Country of residence
    string country;
    # Nationality or citizenship
    string? nationality;
    # Languages spoken (as JSON structure)
    json? languageSpoken;
    # Next-of-kin information
    json? nokInfo;
    # Onboarding-related documents
    json? onboardingDocuments;
    # Education background details
    json? educationInfo;
    # User who created the record
    string createdBy;
    # Record creation timestamp
    time:Utc createdOn;
    # User who last updated the record
    string updatedBy;
    # Record last update timestamp
    time:Utc updatedOn;
|};

# Response structure of retrieving employee_info.
public type EmployeeInfo record {|
    # Employee ID
    string id;
    # Last name
    string lastName;
    # First name
    string firstName;
    # EPF number (optional)
    string? epf;
    # Employee location (optional)
    string? employeeLocation;
    # Work location (optional)
    string? workLocation;
    # WSO2 email
    string wso2Email;
    # Work phone (optional)
    string? workPhoneNumber;
    # Start date (optional)
    time:Date? startDate;
    # Job role (optional)
    string? jobRole;
    # Manager email (optional)
    string? managerEmail;
    # Report-to email (optional)
    string? reportToEmail;
    # Additional manager email (optional)
    string? additionalManagerEmail;
    # Additional report-to email (optional)
    string? additionalReportToEmail;
    # Employee status (optional)
    string? employeeStatus;
    # Length of service (optional)
    int? lengthOfService;
    # Thumbnail (optional)
    string? employeeThumbnail;
    # Subordinate count (optional)
    int? subordinateCount;
    # Probation end date (optional)
    time:Date? probationEndDate;
    # Agreement end date (optional)
    time:Date? agreementEndDate;
    # Employment type ID
    int employmentTypeId;
    # Designation ID
    int designationId;
    # Office ID
    int officeId;
    # Company ID
    int companyId;
    # Team ID
    int teamId;
    # Sub-team ID
    int subTeamId;
    # Business unit ID
    int businessUnitId;
    # Unit ID
    int unitId;
    # Personal info ID
    int personalInfoId;
|};

# Response strcutre of Employee record.
public type Employee record {|
    # Personal Info
    PersonalInfo personalInfo;
    # Employee Info
    EmployeeInfo employeeInfo;
|};

# Response structure of updating employee_info.
public type UpdateEmployeeInfoPlayload record {|
    # Id of the employee
    string id?;
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
    # Id of the company the employee belongs to
    int companyId?;
    # Id of the office where the employee works
    int officeId?;
    # Id of the business unit of the employee
    int businessUnitId?;
    # Id of the team of the employee
    int teamId?;
    # Id of the sub-team of the employee
    int subTeamId?;
    # Id of the unit of the employee
    int unitId?;
|};

# Structure of the org data filter value
type FilterValue boolean|int|string|int[]|string[]|time:Date;

# [OrgRecord] Structure of organization filter record.
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

# Structure of json response.
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
    # Comapny id
    int companyId;
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

# Represents an app config response type.
public type AppConfig record {|
    # A list of companies
    Company[] companies;
    # A list of offices
    Office[] offices;
    # A list of designations
    Designation[] designations;
    # A list of career functions
    CareerFunction[] careerFunctions;
    # A list of employment types
    EmploymentType[] employmentTypes;
|};
