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

// Get employee graphQL service Responses
# [Employee Entity] Return record for single employee.
#
# + employeeId - Id of the employee  
# + lastPromotedDate - Last Promoted Date  
# + managerEmail - Manager email  
# + firstName - First Name  
# + lead - is employee a lead  
# + reportsTo - Reporting lead's name  
# + jobBand - Job Band  
# + jobRole - Job Role  
# + lastName - Last Name  
# + startDate - Start date at WSO2  
# + employeeStatus - Employee Status  
# + businessUnit - Business unit of the employee  
# + department - Employee's department  
# + team - Employee's Team  
# + subTeam - Employee's sub team  
# + employeeThumbnail - Employee Thumbnail URL

public type Employee record {
    string? employeeId = ();
    string? lastPromotedDate = ();
    string? managerEmail = ();
    string firstName;
    boolean? lead = false;
    string? reportsTo = ();
    int? jobBand = ();
    string jobRole;
    string lastName;
    string startDate;
    string? employeeStatus = ();
    string businessUnit;
    string? department = ();
    string? team = ();
    string? subTeam = ();
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

# [Employee Entity] Inner record for single employee.
#
# + employee - Employee Object
type EmployeeData record {
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

# [Employee Entity] Return record for single employee.
#
# + data - Employee Data Object
type EmployeeResults record {
    EmployeeData data;
};

// GraphQL Responses
// Get employee information response
# Description
#
# + workEmail - WSO2 email  
# + startDate - Start Date of at WSO2  
# + jobBand - Job band of the employee  
# + managerEmail - Manager email  
# + joinedJobRole - Joined Job role  
# + joinedBusinessUnit - Joined Business Unit  
# + joinedDepartment - Joined Department  
# + joinedTeam - Joined Team  
# + joinedLocation - Joined Location  
# + lastPromotedDate - Last Promoted Date  
# + employeeThumbnail - Employee Thumbnail URL
public type EmployeeHistory record {
    string workEmail;
    string startDate;
    int? jobBand = ();
    string? managerEmail = "";
    string? joinedJobRole = "";
    string? joinedBusinessUnit = "";
    string? joinedDepartment = "";
    string? joinedTeam = "";
    string? joinedLocation = "";
    string? lastPromotedDate = "";
    string? employeeThumbnail = "";
};

// Get employee history response
# Employee history response
#
# + data - Employee history Data
type EmployeeHistoryResponse record {
    EmployeeHistoryData data;
};

// Get employee history response
# Employee history data
#
# + employee - Employee history record
type EmployeeHistoryData record {
    EmployeeHistory employee;
};

# [Employee Entity] Return record for single employee Name.
#
# + data - Employee thumbnail Data Object
type EmployeeThumbnailResult record {
    EmployeeThumbnailData data;
};

# [Employee Entity] Return record for single employee thumbnail.
#
# + employee - Employee thumbnail Object 
type EmployeeThumbnailData record {
    EmployeeThumbnail? employee = ();
};

// API response for receiving the employee thumbnail from WSO2 email
# [Employee Entity] Return record for single employee thumbnail.
#
# + employeeThumbnail - Thumbnail of the employee
public type EmployeeThumbnail record {
    string? employeeThumbnail = "";
};
