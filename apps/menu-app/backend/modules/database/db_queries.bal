// Copyright (c) 2023, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import ballerina/sql;

# Upsert dinner request (insert or update if exists).
#
# + email - Employee email
# + dinnerRequest - Dinner request data
# + employee - Employee data
# + return - SQL parameterized query
isolated function upsertDinnerRequestQuery(string email, DinnerRequest dinnerRequest, Employee employee) 
    returns sql:ParameterizedQuery =>
    `
        INSERT INTO dinner_bookings (
            email, 
            meal_option, 
            date,
            department,
            team,
            manager_email,
            is_active
        ) VALUES (
            ${email}, 
            ${dinnerRequest.mealOption}, 
            ${dinnerRequest.date}, 
            ${employee.department?: null}, 
            ${employee.team?: null},
            ${employee.managerEmail},
            1
        )
        ON DUPLICATE KEY UPDATE
            meal_option = VALUES(meal_option),
            is_active = 1,
            _timestamp = CURRENT_TIMESTAMP
    `;

# Cancel dinner request.
#
# + email - Dinner request email
# + return - SQL parameterized query
isolated function cancelDinnerRequestQuery(string email) returns sql:ParameterizedQuery =>
    `   
        UPDATE dinner_bookings 
        SET is_active = 0
        WHERE email = ${email} AND is_active = 1 AND date >= CURRENT_DATE
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
