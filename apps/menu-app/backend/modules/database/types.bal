// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import ballerina/sql;

# [Configurable] Database configuration.
#
public type DatabaseConfig record {|
    # Database Host
    string host;
    # Database User
    string user;
    # Database Password
    string password;
    # Database Name
    string name;
    # Database Port
    int port;
|};

# Dinner request data.
public type DinnerRequest record {|
    # Request Id 
    string id?;
    # Meal option
    @sql:Column {name: "meal_option"}
    string mealOption;
    # Date of meal request
    string date;
    # Department of employee
    string department;
    # Team of employee
    string? team;
    # Manager email
    @sql:Column {name: "manager_email"}
    string managerEmail;
    # Timestamp of the request
    @sql:Column {name: "_timestamp"}
    string timestamp?;
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