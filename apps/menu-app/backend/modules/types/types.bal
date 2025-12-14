// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import menu_app.people;

import ballerina/http;
import ballerina/time;
import ballerina/sql;

# Response for fetching user information.
public type UserInfo record {|
    *people:Employee;
    # Array of privileges assigned to the user
    int[] privileges;
    json...;
|};

# Menu Items.
public type Menu record {|
    # Meal date
    string date;
    # Breakfast item
    MetaData breakfast;
    # Juice item
    MetaData juice;
    # Lunch item
    MetaData lunch;
    # Dessert item
    MetaData dessert;
    # Snack item
    MetaData snack;
|};

# Meta Data.
public type MetaData record {|
    # Title
    string title;
    # Description
    string description;
|};

# App Server Error Response.
public type AppServerErrorResponse record {|
    *http:InternalServerError;
    # Message body
    record {|
        string message;
    |} body;
|};

# 401 Unauthorized response.
public type AppUnauthorizedErrorResponse record {|
    *http:Unauthorized;
    # Message body
    record {|
        string message;
    |} body;
|};

# App Server Success Response.
public type AppServerSuccessResponse record {|
    *http:Created;
    # Message body
    record {|
        string message;
    |} body;
|};

# Lunch feedback record.
public type Feedback record {|
    # Feedback message
    string message;
    # Meal type
    Meal meal = LUNCH;
|};

# <eta information.
public type MetaInfo record {|
    # Start time for lunch feedback
    time:TimeOfDay lunchFeedbackStartTime;
    # End time for lunch feedback
    time:TimeOfDay lunchFeedbackEndTime;
|};

# Meal enum.
public enum Meal {
    LUNCH = "Lunch"
}

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