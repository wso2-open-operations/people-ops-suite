// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import ballerina/sql;

# Insert new dinner request to database.
# 
# + employee - Employee data
# + dinnerRequest - Dinner request data
# + email - Employee email
# + return - SQL parameterized query
isolated function insertDinnerRequestQuery(DinnerRequest dinnerRequest, string email, Employee employee) 
    returns sql:ParameterizedQuery =>
    
    `INSERT INTO dinner_bookings (
        email, 
        meal_option, 
        date,
        department,
        team,
        manager_email
    ) VALUES (
        ${email}, 
        ${dinnerRequest.mealOption}, 
        ${dinnerRequest.date}, 
        ${employee.department?: null}, 
        ${employee.team?: null},
        ${employee.managerEmail}
    )`;

# Cancel dinner request.
#
# + email - Dinner request email
# + return - SQL parameterized query
isolated function cancelDinnerRequestQuery(string email) returns sql:ParameterizedQuery =>
    `   
        DELETE FROM 
            dinner_bookings 
        WHERE 
            email = ${email}
    `;

# Retrieve dinner request by email.
#
# + email - Employee email
# + return - SQL parameterized query
isolated function getDinnerRequestByEmailQuery(string email) returns sql:ParameterizedQuery =>
    `
        SELECT 
            id,
            meal_option,
            date,
            department,
            team,
            manager_email,
            _timestamp
        FROM 
            dinner_bookings 
        WHERE 
            email = ${email} AND is_active = 1 AND date >= CURRENT_DATE
    `;

# Retrieve all dinner requests.
# 
# + return - SQL parameterized query
isolated function getAllDinnerRequestsQuery() returns sql:ParameterizedQuery => 
    `
        SELECT 
            email,
            meal_option,
            date,
            department,
            team,
            manager_email,
            _timestamp
        FROM 
            dinner_bookings 
        WHERE 
            is_active = 1 AND date >= CURRENT_DATE;
    `;
