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

import ballerina/sql;
import ballerina/time;

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

# Build a parameterized UPDATE query for an organization hierarchy table.
#
# + mainQuery - Base UPDATE query with the target table name
# + payload - Fields to update (name, head email, updated by)
# + id - ID of the record to update
# + return - Complete parameterized UPDATE query with SET clauses and WHERE condition
isolated function buildOrganizationUnitUpdateQuery(sql:ParameterizedQuery mainQuery, UpdateOrgUnitPayload payload, int id)
    returns sql:ParameterizedQuery {

    UpdateOrgUnitPayload {name, headEmail, updatedBy} = payload;

    sql:ParameterizedQuery[] filters = [];

    if name is string {
        filters.push(` name = ${name}`);
    }

    if headEmail is string {
        filters.push(` head_email = ${headEmail}`);
    }

    filters.push(` updated_by = ${updatedBy}`);

    sql:ParameterizedQuery updatedQuery = buildSqlUpdateQuery(mainQuery, filters);

    return sql:queryConcat(updatedQuery, ` WHERE id = ${id}`);
}

# Build a parameterized INSERT query using SET syntax (MySQL).
#
# + mainQuery - Base INSERT query (e.g., `INSERT INTO business_unit SET`)
# + columnValuePairs - Array of column=value pairs (only non-empty pairs included)
# + return - Complete parameterized INSERT query
isolated function buildSqlInsertQuery(sql:ParameterizedQuery mainQuery, sql:ParameterizedQuery[] columnValuePairs)
    returns sql:ParameterizedQuery {

    sql:ParameterizedQuery query = mainQuery;

    boolean isFirst = true;
    foreach sql:ParameterizedQuery pair in columnValuePairs {
        if isFirst {
            query = sql:queryConcat(query, pair);
            isFirst = false;
        } else {
            query = sql:queryConcat(query, `, `, pair);
        }
    }

    return query;
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
        return "\"" + re `"`.replaceAll(v, "\"\"") + "\"";
    }
    return v;
}

# Calculate the length of service from a start date string to today.
#
# + startDateStr - Start date in YYYY-MM-DD format
# + return - Human-readable string like "2 Year(s) 3 Month(s)"
isolated function calculateLengthOfService(string startDateStr) returns string {
    time:Utc now = time:utcNow();
    time:Civil civil = time:utcToCivil(now);
    int todayYear = civil.year;
    int todayMonth = civil.month;
    int todayDay = civil.day;

    string[] parts = re`-`.split(startDateStr);
    if parts.length() != 3 {
        return "";
    }
    int|error startYear = int:fromString(parts[0]);
    int|error startMonth = int:fromString(parts[1]);
    int|error startDay = int:fromString(parts[2]);
    if startYear is error || startMonth is error || startDay is error {
        return "";
    }

    // Return empty string if start date is in the future
    if startYear > todayYear
        || (startYear == todayYear && startMonth > todayMonth)
        || (startYear == todayYear && startMonth == todayMonth && startDay > todayDay) {
        return "";
    }

    int years = todayYear - startYear;
    int months = todayMonth - startMonth;
    // If the anniversary day hasn't been reached yet this month, subtract one month
    if todayDay < startDay {
        months -= 1;
    }
    if months < 0 {
        years -= 1;
        months += 12;
    }
    return string `${years} Year(s) ${months} Month(s)`;
}

# Resolve a comma-separated list of additional manager emails to full names using the name map.
# Falls back to the original email if a name is not found.
#
# + emails - Comma-separated emails string (may be null/empty)
# + nameMap - Map of email -> full name
# + return - Comma-separated full names string
isolated function resolveAdditionalManagerNames(string? emails, map<string> nameMap) returns string {
    if emails is () || emails.trim() == "" {
        return "";
    }
    string[] emailList = re`,`.split(emails);
    string[] names = from string email in emailList
        let string trimmed = email.trim()
        select nameMap[trimmed.toLowerAscii()] ?: trimmed;
    return string:'join(", ", ...names);
}

# Ordered canonical column keys for the active-employee CSV (26 columns).
final string[] & readonly EMPLOYEE_CSV_COLUMNS = [
    "employeeId", "firstName", "lastName", "gender", "workEmail", "company",
    "location", "employmentType", "jobRole", "jobBand", "startDate",
    "continuousServiceDate", "lengthOfService", "reportsTo", "additionalManager",
    "employeeStatus", "team", "subTeam", "epfNumber", "leadEmail", "businessUnit",
    "house", "unit", "office", "probationEndDate", "agreementEndDate"
];

# Ordered canonical column keys for the resignation CSV (26 shared + 4 resignation-specific).
final string[] & readonly RESIGNATION_CSV_COLUMNS = [
    "employeeId", "firstName", "lastName", "gender", "workEmail", "company",
    "location", "employmentType", "jobRole", "jobBand", "startDate",
    "continuousServiceDate", "lengthOfService", "reportsTo", "additionalManager",
    "employeeStatus", "team", "subTeam", "epfNumber", "leadEmail", "businessUnit",
    "house", "unit", "office", "probationEndDate", "agreementEndDate",
    "resignationDate", "finalDayInOffice", "finalDayOfEmployment", "resignationReason"
];

# Map from canonical column key to its CSV header label.
final map<string> & readonly COLUMN_HEADER_MAP = {
    "employeeId":            "Employee Id",
    "firstName":             "First Name",
    "lastName":              "Last Name",
    "gender":                "Gender",
    "workEmail":             "Work Email",
    "company":               "Company",
    "location":              "Location",
    "employmentType":        "Employment Type",
    "jobRole":               "Job Role",
    "jobBand":               "Job Band",
    "startDate":             "Start Date",
    "continuousServiceDate": "Continuous Service Date",
    "lengthOfService":       "Length Of Service",
    "reportsTo":             "Reports To",
    "additionalManager":     "Additional Manager",
    "employeeStatus":        "Employee Status",
    "team":                  "Team (Team and Sub Team)",
    "subTeam":               "Sub Team (Team and Sub Team)",
    "epfNumber":             "EPF Number (EPF)",
    "leadEmail":             "Email (Lead Email ID)",
    "businessUnit":          "BU (Business Unit)",
    "house":                 "House",
    "unit":                  "Unit",
    "office":                "Office",
    "probationEndDate":      "Probation End Date",
    "agreementEndDate":      "Agreement End Date",
    "resignationDate":       "Resignation Date",
    "finalDayInOffice":      "Final Day in Office",
    "finalDayOfEmployment":  "Final Day of Employment",
    "resignationReason":     "Resignation Reason"
};

# Resolve the CSV cell value for a single column key on one employee.
#
# + e - The employee record
# + key - The canonical column key
# + nameMap - Map of email -> full name (used for additionalManager)
# + return - The escaped CSV cell string
isolated function resolveColumnValue(Employee e, string key, map<string> nameMap) returns string {
    match key {
        "employeeId"            => { return csvEscape(e.employeeId); }
        "firstName"             => { return csvEscape(e.firstName); }
        "lastName"              => { return csvEscape(e.lastName); }
        "gender"                => { return csvEscape(e.gender); }
        "workEmail"             => { return csvEscape(e.workEmail); }
        "company"               => { return csvEscape(e.company); }
        "location"              => { return csvEscape(e.workLocation); }
        "employmentType"        => { return csvEscape(e.employmentType); }
        "jobRole"               => {
            string? secTitle = e.secondaryJobTitle;
            string jobRole = secTitle is string && secTitle.trim() != ""
                ? e.designation + " / " + secTitle
                : e.designation;
            return csvEscape(jobRole);
        }
        "jobBand"               => { return csvEscape(e.jobBand != () ? e.jobBand.toString() : ()); }
        "startDate"             => { return csvEscape(e.startDate); }
        "continuousServiceDate" => { return csvEscape(e.continuousServiceDate); }
        "lengthOfService"       => {
            string effectiveStartDate = e.continuousServiceDate ?: e.startDate;
            return csvEscape(calculateLengthOfService(effectiveStartDate));
        }
        "reportsTo"             => { return csvEscape(e.managerName); }
        "additionalManager"     => { return csvEscape(resolveAdditionalManagerNames(e.additionalManagerEmails, nameMap)); }
        "employeeStatus"        => { return csvEscape(e.employeeStatus); }
        "team"                  => { return csvEscape(e.team); }
        "subTeam"               => { return csvEscape(e.subTeam); }
        "epfNumber"             => { return csvEscape(e.epf); }
        "leadEmail"             => { return csvEscape(e.managerEmail); }
        "businessUnit"          => { return csvEscape(e.businessUnit); }
        "house"                 => { return csvEscape(e.house); }
        "unit"                  => { return csvEscape(e.unit); }
        "office"                => { return csvEscape(e.office); }
        "probationEndDate"      => { return csvEscape(e.probationEndDate); }
        "agreementEndDate"      => { return csvEscape(e.agreementEndDate); }
        "resignationDate"       => { return csvEscape(e.resignationDate); }
        "finalDayInOffice"      => { return csvEscape(e.finalDayInOffice); }
        "finalDayOfEmployment"  => { return csvEscape(e.finalDayOfEmployment); }
        "resignationReason"     => { return csvEscape(e.resignationReason); }
        _                       => { return ""; }
    }
}

# Shared CSV builder — used by both buildEmployeeCsv and buildResignationCsv.
# Filters the effective column list to only keys present in defaultCols (ignores unknown keys).
#
# + employees - Employees to export
# + nameMap - email->name resolution map
# + defaultCols - Full ordered column list for this report type
# + requestedCols - Optional subset requested by the caller; nil or empty means use defaultCols
# + return - CSV string
isolated function buildCsvWithColumns(
        Employee[] employees,
        map<string> nameMap,
        string[] defaultCols,
        string[]? requestedCols) returns string {
    string[] effectiveCols;
    if requestedCols is () || requestedCols.length() == 0 {
        effectiveCols = defaultCols;
    } else {
        // Deduplicate while preserving first-seen order; ignore unknown keys.
        map<boolean> seen = {};
        string[] filtered = [];
        foreach string key in requestedCols {
            if defaultCols.indexOf(key) != () && !seen.hasKey(key) {
                filtered.push(key);
                seen[key] = true;
            }
        }
        // Fall back to the full default set if every requested key was unknown.
        effectiveCols = filtered.length() > 0 ? filtered : defaultCols;
    }
    string[] headers = from string key in effectiveCols
        select COLUMN_HEADER_MAP[key] ?: key;
    string[] lines = [string:'join(",", ...headers)];
    foreach Employee e in employees {
        string[] row = from string key in effectiveCols
            select resolveColumnValue(e, key, nameMap);
        lines.push(string:'join(",", ...row));
    }
    return string:'join("\n", ...lines);
}

# Build a CSV string from a list of employees aligned with the People HR report format.
#
# + employees - List of employees
# + nameMap - Map of work_email -> full name for resolving additional manager names
# + columns - Optional column allowlist (canonical keys). nil or empty = all 26 columns.
# + return - CSV string
public isolated function buildEmployeeCsv(
        Employee[] employees,
        map<string> nameMap,
        string[]? columns = ()) returns string {
    return buildCsvWithColumns(employees, nameMap, EMPLOYEE_CSV_COLUMNS, columns);
}

# Build a CSV string from a list of resigned employees aligned with the People HR report format.
#
# + employees - List of resigned employees
# + nameMap - Map of work_email -> full name for resolving additional manager names
# + columns - Optional column allowlist (canonical keys). nil or empty = all 30 columns.
# + return - CSV string
public isolated function buildResignationCsv(
        Employee[] employees,
        map<string> nameMap,
        string[]? columns = ()) returns string {
    return buildCsvWithColumns(employees, nameMap, RESIGNATION_CSV_COLUMNS, columns);
}
