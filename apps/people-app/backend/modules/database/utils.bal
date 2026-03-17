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

import ballerina/regex;
import ballerina/sql;

# Build the database select query with dynamic filter attributes.
#
# + mainQuery - Main query without the new sub query
# + filters - Array of sub queries to be added to the main query
# + return - Dynamically build sql:ParameterizedQuery
isolated function buildSqlSelectQuery(sql:ParameterizedQuery mainQuery, sql:ParameterizedQuery[] filters)
    returns sql:ParameterizedQuery {

    boolean isFirstSearch = true;
    sql:ParameterizedQuery updatedQuery = mainQuery;

    foreach sql:ParameterizedQuery filter in filters {
        if isFirstSearch {
            updatedQuery = sql:queryConcat(mainQuery, ` WHERE `, filter);
            isFirstSearch = false;
            continue;
        }

        updatedQuery = sql:queryConcat(updatedQuery, ` AND `, filter);
    }

    return updatedQuery;
}

# Build the database update query with dynamic attributes.
#
# + mainQuery - Main query without the new sub query
# + filters - Array of sub queries to be added to the main query
# + return - Dynamically build sql:ParameterizedQuery
isolated function buildSqlUpdateQuery(sql:ParameterizedQuery mainQuery, sql:ParameterizedQuery[] filters)
    returns sql:ParameterizedQuery {

    boolean isFirstUpdate = true;
    sql:ParameterizedQuery updatedQuery = ``;

    foreach sql:ParameterizedQuery filter in filters {
        if isFirstUpdate {
            updatedQuery = sql:queryConcat(mainQuery, filter);
            isFirstUpdate = false;
            continue;
        }

        updatedQuery = sql:queryConcat(updatedQuery, ` , `, filter);
    }

    return updatedQuery;
}

# Append a string filter to the filters array if the value is not null or empty.
#
# + filters - Array of sub queries to be added to the main query
# + value - The string value to check and append
# + condition - The sql:ParameterizedQuery representing the filter condition to append
isolated function appendStringFilter(sql:ParameterizedQuery[] filters, string? value, sql:ParameterizedQuery condition) {
    if value is string && value.trim() != "" {
        filters.push(condition);
    }
}

# Append an integer filter to the filters array if the value is not null.
#
# + filters - Array of sub queries to be added to the main query
# + value - The integer value to check and append
# + condition - The sql:ParameterizedQuery representing the filter condition to append
isolated function appendIntFilter(sql:ParameterizedQuery[] filters, int? value, sql:ParameterizedQuery condition) {
    if value is int {
        filters.push(condition);
    }
}

# Build the text token filter for the search query.
#
# + token - The text token to build the filter for
# + return - sql:ParameterizedQuery representing the text token filter
isolated function buildTextTokenFilter(string token) returns sql:ParameterizedQuery {
    string likeValue = "%" + token + "%";

    return `
        (
            LOWER(CONCAT(IFNULL(e.first_name, ''), ' ', IFNULL(e.last_name, '')))
                LIKE LOWER(${likeValue}) ESCAPE '\\'
            OR LOWER(e.employee_id)
                LIKE LOWER(${likeValue}) ESCAPE '\\'
            OR LOWER(e.first_name)
                LIKE LOWER(${likeValue}) ESCAPE '\\'
            OR LOWER(e.last_name)
                LIKE LOWER(${likeValue}) ESCAPE '\\'
            OR LOWER(pi.first_name)
                LIKE LOWER(${likeValue}) ESCAPE '\\'
            OR LOWER(pi.last_name)
                LIKE LOWER(${likeValue}) ESCAPE '\\'
            OR LOWER(e.work_email)
                LIKE LOWER(${likeValue}) ESCAPE '\\'
            OR LOWER(pi.personal_email)
                LIKE LOWER(${likeValue}) ESCAPE '\\'
            OR LOWER(pi.nic_or_passport)
                LIKE LOWER(${likeValue}) ESCAPE '\\'
            OR LOWER(pi.personal_phone)
                LIKE LOWER(${likeValue}) ESCAPE '\\'
            OR LOWER(pi.resident_number)
                LIKE LOWER(${likeValue}) ESCAPE '\\'
            OR LOWER(pi.city)
                LIKE LOWER(${likeValue}) ESCAPE '\\'
            OR LOWER(pi.state_or_province)
                LIKE LOWER(${likeValue}) ESCAPE '\\'
            OR LOWER(pi.country)
                LIKE LOWER(${likeValue}) ESCAPE '\\'
            OR LOWER(e.epf)
                LIKE LOWER(${likeValue}) ESCAPE '\\'
            OR LOWER(e.secondary_job_title)
                LIKE LOWER(${likeValue}) ESCAPE '\\'
        )
    `;
}

# Build the `ORDER BY` clause for the SQL query based on the sort configuration.
#
# + sortConfig - Sort configuration from the request payload
# + return - Parameterized query fragment for ORDER BY clause
public isolated function buildOrderByClause(Sort sortConfig) returns sql:ParameterizedQuery {
    return sql:queryConcat(` ORDER BY `,
            EmployeeSortField.get(sortConfig.sortField), ` `, SortOrder.get(sortConfig.sortOrder));
}

# Check the affected row count after an update operation.
#
# + affectedRowCount - Number of rows affected by the update operation
# + return - Error if no rows are updated
public isolated function checkAffectedCount(int? affectedRowCount) returns error? {
    if affectedRowCount == 0 || affectedRowCount is () {
        return error(ERROR_NO_ROWS_UPDATED);
    }
    return;
}

# Escape a value for CSV (RFC 4180).
#
# + value - The string value to escape
# + return - The escaped string value
isolated function csvEscape(string? value) returns string {
    string v = value ?: "";
    if v.includes(",") || v.includes("\"") || v.includes("\n") || v.includes("\r") {
        return "\"" + regex:replaceAll(v, "\"", "\"\"") + "\"";
    }
    return v;
}

# Build a CSV string from a list of employees.
#
# + employees - List of employees
# + return - CSV string
public isolated function buildEmployeeCsv(Employee[] employees) returns string {
    string[] headers = [
        "Employee ID",
        "First Name",
        "Last Name",
        "Work Email",
        "EPF",
        "Company",
        "Work Location",
        "Start Date",
        "Lead's Email",
        "Additional Leads' Emails",
        "Employee Status",
        "Employment Type",
        "Designation",
        "Business Unit",
        "Team",
        "Sub Team",
        "Unit",
        "Office",
        "Secondary Job Title",
        "Probation End Date",
        "Agreement End Date"
    ];
    string[] lines = [string:'join(",", ...headers)];
    foreach Employee e in employees {
        string[] row = [
            csvEscape(e.employeeId),
            csvEscape(e.firstName),
            csvEscape(e.lastName),
            csvEscape(e.workEmail),
            csvEscape(e.epf),
            csvEscape(e.company),
            csvEscape(e.workLocation),
            csvEscape(e.startDate),
            csvEscape(e.managerEmail),
            csvEscape(e.additionalManagerEmails),
            csvEscape(e.employeeStatus),
            csvEscape(e.employmentType),
            csvEscape(e.designation),
            csvEscape(e.businessUnit),
            csvEscape(e.team),
            csvEscape(e.subTeam),
            csvEscape(e.unit),
            csvEscape(e.office),
            csvEscape(e.secondaryJobTitle),
            csvEscape(e.probationEndDate),
            csvEscape(e.agreementEndDate)
        ];
        lines.push(string:'join(",", ...row));
    }
    return string:'join("\n", ...lines);
}

# Build a CSV string from a list of resigned employees.
#
# + employees - List of resigned employees
# + return - CSV string
public isolated function buildResignationCsv(Employee[] employees) returns string {
    string[] headers = [
        "Employee ID",
        "First Name",
        "Last Name",
        "Work Email",
        "EPF",
        "Company",
        "Work Location",
        "Start Date",
        "Lead's Email",
        "Additional Leads' Emails",
        "Employee Status",
        "Employment Type",
        "Designation",
        "Business Unit",
        "Team",
        "Sub Team",
        "Unit",
        "Office",
        "Secondary Job Title",
        "Probation End Date",
        "Agreement End Date",
        "Resignation Date",
        "Final Day in Office",
        "Final Day of Employment",
        "Resignation Reason"
    ];
    string[] lines = [string:'join(",", ...headers)];
    foreach Employee e in employees {
        string[] row = [
            csvEscape(e.employeeId),
            csvEscape(e.firstName),
            csvEscape(e.lastName),
            csvEscape(e.workEmail),
            csvEscape(e.epf),
            csvEscape(e.company),
            csvEscape(e.workLocation),
            csvEscape(e.startDate),
            csvEscape(e.managerEmail),
            csvEscape(e.additionalManagerEmails),
            csvEscape(e.employeeStatus),
            csvEscape(e.employmentType),
            csvEscape(e.designation),
            csvEscape(e.businessUnit),
            csvEscape(e.team),
            csvEscape(e.subTeam),
            csvEscape(e.unit),
            csvEscape(e.office),
            csvEscape(e.secondaryJobTitle),
            csvEscape(e.probationEndDate),
            csvEscape(e.agreementEndDate),
            csvEscape(e.resignationDate),
            csvEscape(e.finalDayInOffice),
            csvEscape(e.finalDayOfEmployment),
            csvEscape(e.resignationReason)
        ];
        lines.push(string:'join(",", ...row));
    }
    return string:'join("\n", ...lines);
}
