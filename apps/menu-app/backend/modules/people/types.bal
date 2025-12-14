// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

# OAuth2 client auth configurations.
public type ClientAuthConfig record {|
    # Token URL
    string tokenUrl;
    # Client Id
    string clientId;
    # Client Secret
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

# Employee information.
public type Employee record {|
    # Employee first name
    string firstName;
    # Employee last name
    string lastName;
    # Employee ID
    string employeeId;
    # Employee thumbnail
    string? employeeThumbnail?;
    # Employee work emails
    string workEmail;
    # Employee job role
    string jobRole;
    # Team of the employee
    string? team;
    # Department of the employee
    string department?;
    # Employee manager email
    string managerEmail;
|};

# Employee information.
public type EmployeeData record {|
    # Employee object
    Employee employee;
|};

# Response when fetching employee.
public type EmployeeResponse record {|
    # Employee data fetched
    EmployeeData data;
|};
