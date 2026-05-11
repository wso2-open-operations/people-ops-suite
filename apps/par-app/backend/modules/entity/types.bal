// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import ballerina/graphql;

# The EntityApp record type represents the configuration of the EntityApp.
type EntityApp record {|
    # The URL of the token endpoint
    string tokenUrl;
    # The client ID of the application
    string clientId;
    # The client secret of the application
    string clientSecret;
|};

# The Employee record type represents an employee in the organization.
public type Employee record {|
    # The first name of the employee
    string firstName;
    # The last name of the employee
    string lastName;
    # The work email address of the employee
    string workEmail;
    # The company of the employee
    string company;
    # The location of the employee
    string location;
    # The business unit of the employee
    string businessUnit;
    # The department of the employee
    string department;
    # The team of the employee
    string? team;
    # The sub team of the employee
    string? subTeam;
    # The email address of the manager of the employee
    string? managerEmail;
    # The job role of the employee
    string? jobRole;
    # The employment start date of the employee
    string startDate;
    # The thumbnail of the employee
    string? employeeThumbnail;
    # Whether the employee is a lead
    boolean lead;
    # The employment type of the employee
    EmploymentType employmentType;
    # The status of the employee
    EmployeeStatus employeeStatus;
    # The additional manager email
    string? additionalManagerEmail = ();
|};

# The EmployeeFilter record type represents the filter criteria for the employees.
public type EmployeeFilter record {|
    # The employee statuses
    string[]? employeeStatus?;
    # The employment types
    string[]? employmentType?;
    # The email
    string? email?;
    # The manager email
    string? managerEmail?;
    # The additional manager email
    string? additionalManagerEmail?;
|};

# The GetEmployeesResponse record type represents the response of the getEmployees query.
type GetEmployeesResponse readonly & record {
    *graphql:GenericResponseWithErrors;
    record {
        Employee[] & readonly employees;
    } data;
};

# The GetEmployeeResponse record type represents the response of the getEmployee query.
type GetEmployeeResponse readonly & record {
    *graphql:GenericResponseWithErrors;
    record {
        Employee & readonly employee;
    } data;
};

# The EmployeeStatus represents the status of an employee.
public enum EmployeeStatus {
    EmployeeStatusMarkedLeaver = "Marked leaver",
    EmployeeStatusActive = "Active",
    EmployeeStatusLeft = "Left"
}

# The EmploymentType represents the employment type of an employee.
public enum EmploymentType {
    ADVISORY\ CONSULTANT,
    CONSULTANCY,
    INTERNSHIP,
    PART\ TIME\ CONSULTANCY,
    PERMANENT,
    PROBATION
}

// Get employee graphQL service Responses.
# Employee.
public type Employeebasic record {|
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
    Employeebasic employee;
};

# Employee response.
type EmployeeResponse record {
    # Employee data
    EmployeeData data;
};
