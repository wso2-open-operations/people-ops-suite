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

# OAuth2 entity application configuration.
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

// Get employee graphQL service Responses.
# Return record for single employee.
public type Employee record {
    # Id of the employee 
    string? employeeId = ();
    # Last Promoted Date
    string? lastPromotedDate = ();
    # Manager email
    string? managerEmail = ();
    # First Name
    string firstName;
    # is employee a lead
    boolean lead = false;
    # Reporting lead's name
    string? reportsTo = ();
    # Job Band
    int? jobBand = ();
    # Job Role
    string jobRole;
    # Last Name
    string lastName;
    # Start date at WSO2
    string startDate;
    # Employee Status
    string? employeeStatus = ();
    # Business unit of the employee
    string businessUnit;
    # Employee's department
    string? department = ();
    # Employee's Team
    string? team = ();
    # Employee's sub team
    string? subTeam = ();
    # Employee Thumbnail URL
    string? employeeThumbnail = ();
};

// Get employee graphQL service Responses.
# Employee.
public type EmployeesBasicInfo record {|
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

# Inner record for single employee.
type EmployeeData record {
    # Employee Object
    Employee? employee = ();
};

# Employee data.
type EmployeeInfo record {
    # Employee
    EmployeesBasicInfo employee;
};

# Employee response.
type EmployeeResponse record {
    # Employee data
    EmployeeInfo data;
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

# Return record for single employee.
type EmployeeResults record {
    # Employee Data Object
    EmployeeData data;
};

# Get employee information response.
public type EmployeeHistory record {
    # WSO2 email 
    string workEmail;
    # Start Date of at WSO2
    string startDate;
    # Job band of the employee
    int? jobBand = ();
    # Manager email
    string? managerEmail = "";
    # Joined Job role
    string? joinedJobRole = "";
    # Joined Business Unit
    string? joinedBusinessUnit = "";
    # Joined Department 
    string? joinedDepartment = "";
    # Joined Team
    string? joinedTeam = "";
    # Joined Location
    string? joinedLocation = "";
    # Last Promoted Date
    string? lastPromotedDate = "";
    # Employee Thumbnail URL
    string? employeeThumbnail = "";
};

# Employee history response.
type EmployeeHistoryResponse record {
    # Employee history Data
    EmployeeHistoryData data;
};

# Employee history data.
type EmployeeHistoryData record {
    # Employee history record
    EmployeeHistory employee;
};

# Return record for single employee Name.
type EmployeeThumbnailResult record {
    # Employee thumbnail Data Object
    EmployeeThumbnailData data;
};

# Return record for single employee thumbnail.
type EmployeeThumbnailData record {
    # Employee thumbnail Object
    EmployeeThumbnail? employee = ();
};

# eturn record for single employee thumbnail.
public type EmployeeThumbnail record {
    # Thumbnail of the employee
    string? employeeThumbnail = "";
};
