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

# [Configurable] OAuth2 entity application configuration.
type Oauth2Config record {|
    # OAuth2 token endpoint
    string tokenUrl;
    # OAuth2 client ID
    string clientId;
    # OAuth2 client secret
    string clientSecret;
|};

# Retry config for the graphql client.
public type GraphQlRetryConfig record {|
    # Retry count
    int count = RETRY_COUNT;
    # Retry interval
    decimal interval = RETRY_INTERVAL;
    # Retry backOff factor
    float backOffFactor = RETRY_BACKOFF_FACTOR;
    # Retry max interval
    decimal maxWaitInterval = RETRY_MAX_INTERVAL;
|};

# Basic employee information.
public type Employee record {|
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

# Employee data.
type EmployeeData record {
    # Employee
    Employee employee;
};

# Employee response.
type EmployeeResponse record {
    # Employee data
    EmployeeData data;
};

# The EmployeeFilter record type represents the filter criteria for the employees.
public type EmployeeFilter record {|
    # The employee statuses
    string[]? employeeStatus?;
    # The employment types
    string[]? employmentType?;
|};

# Basic employee information.
public type EmployeeBasic record {|
    # First name of the employee
    string firstName;
    # Last name of the employee
    string lastName;
    # Email of the employee
    string workEmail;
    # Thumbnail of the employee
    string? employeeThumbnail = ();
|};

# Employees data.
type EmployeesData record {
    # Array of employees
    EmployeeBasic[] employees;
};

# Employees response.
type EmployeesResponse record {
    # Employees data
    EmployeesData data;
};

# [Configurable] Employee entity configuration.
type HrServiceConfig record {|
    # URL
    string apiEndpoint;
    # Token Endpoint
    string tokenEndpoint;
    # Client ID
    string clientId;
    # Client Secret
    string clientSecret;
|};

# Designation.
public type Designation record {
    # Name of the designation
    string designation;
    # Job band of the designation
    int jobBand;
    # Id of the designation
    int id;
};

# Career function.
public type CareerFunction record {
    # Id of the career function
    int id;
    # Title of the career function
    string careerFunction;
    # Designations of the career function
    Designation[] designations;
};

# Career function data.
type CareerFunctionData record {
    # Array of career functions
    CareerFunction[] careerFunctions;
};

# Career function response.
type CareerFunctionResponse record {
    # Career function data
    CareerFunctionData data;
};

# Sub team.
public type SubTeam record {
    # Id of the sub team
    int id;
    # Name of the sub team
    string subTeam;
};

# Team.
public type Team record {
    # Id of the team
    int id;
    # Name of the team
    string team;
    # Sub teams of the team
    SubTeam[]? subTeams;
};

# Department.
public type Department record {
    # Id of the department
    int id;
    # Name of the department
    string department;
    # Teams of the department
    Team[]? teams;
};

# Business unit.
public type BusinessUnit record {
    # Id of the business unit
    int id;
    # Name of the business unit
    string businessUnit;
    # Departments of the business unit
    Department[]? departments;
};

# Org Details.
type OrgDetails record {
    # Business units
    BusinessUnit[] orgDetails;
};

# Org Details Response.
type OrgDetailsResponse record {
    # Org Details
    OrgDetails data;
};

# Company.
public type Company record {
    # Id of the company
    int id;
    # Name of the company
    string company;
    # Location of the company
    string location;
    # Offices of the company
    Office[] offices;
};

# Office.
public type Office record {
    # Id of the office
    int id;
    # Name of the office
    string office;
    # Location of the office
    string location;
};

# Company data.
type CompanyData record {
    # Array of companies
    Company[] companies;
};

# Company response.
type CompanyResponse record {
    # Company data
    CompanyData data;
};