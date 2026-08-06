// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
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

import ballerina/sql;

# Fetch employees whose Marked-leaver final day of employment has arrived (today or earlier).
#
# + return - Query to select employees pending auto-transition to Left
isolated function getExpiredLeaversQuery() returns sql:ParameterizedQuery =>
    `SELECT
        e.employee_id,
        e.first_name,
        e.last_name,
        e.work_email,
        r.final_day_of_employment
    FROM employee e
    JOIN resignation r ON r.employee_id = e.id
    WHERE e.employee_status = 'Marked leaver'
        AND r.final_day_of_employment IS NOT NULL
        AND r.final_day_of_employment <= UTC_DATE();`;

# Build an SQL IN clause for a list of string values.
#
# + values - List of string values to include in the IN clause
# + return - Parameterized query representing the IN clause
isolated function buildInClause(string[] values) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery clause = ``;
    foreach int i in 0 ..< values.length() {
        clause = i == 0
            ? sql:queryConcat(clause, `${values[i]}`)
            : sql:queryConcat(clause, `, `, `${values[i]}`);
    }
    return clause;
}

# Transition employees whose Marked-leaver final day of employment has arrived (today or earlier) to Left.
#
# + actor - System actor performing the update
# + employeeIds - External employee IDs to restrict the update to (from the SELECT that found them)
# + return - Query to update matching employees' status to Left
isolated function transitionExpiredLeaversQuery(string actor, string[] employeeIds) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery inClause = buildInClause(employeeIds);
    return sql:queryConcat(
        `UPDATE employee e
        JOIN resignation r ON r.employee_id = e.id
        SET e.employee_status = 'Left', e.updated_by = ${actor}
        WHERE e.employee_status = 'Marked leaver'
            AND r.final_day_of_employment IS NOT NULL
            AND r.final_day_of_employment <= UTC_DATE()
            AND e.employee_id IN (`,
        inClause,
        `);`
    );
}
