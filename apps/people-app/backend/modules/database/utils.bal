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

import ballerina/lang.regexp;
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

# Validate an optional string against a regex pattern. Nil and empty string
# are accepted (interpreted as "absent" or "cleared"); any non-empty value
# must match the supplied pattern.
#
# + value - Optional string value to validate
# + pattern - Regex pattern that non-empty values must satisfy
# + return - True if the value is nil/empty or matches the pattern, false otherwise
public isolated function isValidOptionalPatternString(string? value, regexp:RegExp pattern) returns boolean {
    if value is () || value == "" {
        return true;
    }
    return value.matches(pattern);
}

# Maps a database error to a bulk insert status code.
#
# + err - The error to map
# + return - BULK_INSERT_DUPLICATE for MySQL duplicate entry,
#            BULK_INSERT_FAILED for all other errors
public isolated function getErrorCode(error err) returns int {
    if err is sql:DatabaseError {
        if err.detail().errorCode == 1062 {
            return BULK_INSERT_DUPLICATE;
        }
    }
    return BULK_INSERT_FAILED;
}

# Escape a value for CSV (RFC 4180).
#
# + value - The string value to escape
# + return - The escaped string value
isolated function csvEscape(string? value) returns string {
    string v = value ?: "";
    if v.includes(",") || v.includes("\"") || v.includes("\n") || v.includes("\r") {
        return "\"" + re`"`.replaceAll(v, "\"\"") + "\"";
    }
    return v;
}

# Calculate the length of service from a start date up to the end date or today, whichever
# is earlier, so a leaver's service stops at their final day of employment. The final day is
# a day worked, so it counts towards the service.
#
# + startDateStr - Start date in YYYY-MM-DD format
# + endDateStr - Final day of employment in YYYY-MM-DD format, if any
# + today - Date to count up to when there is no earlier end date; defaults to today (UTC)
# + return - Human-readable string like "2 Year(s) 3 Month(s)"
isolated function calculateLengthOfService(string startDateStr, string? endDateStr = (),
        time:Date? today = ()) returns string {
    time:Date until = today ?: time:utcToCivil(time:utcNow());

    time:Date? 'start = parseIsoDate(startDateStr);
    if 'start is () {
        return "";
    }
    // Return empty string if start date is in the future
    if dateKey('start) > dateKey(until) {
        return "";
    }

    time:Date? end = endDateStr is string ? parseIsoDate(endDateStr) : ();
    if end is time:Date && dateKey(end) <= dateKey(until) {
        time:Date? dayAfterEnd = nextDay(end);
        if dayAfterEnd is time:Date {
            until = dayAfterEnd;
        }
    }
    if dateKey('start) > dateKey(until) {
        return "";
    }

    int years = until.year - 'start.year;
    int months = until.month - 'start.month;
    // If the anniversary day hasn't been reached yet this month, subtract one month
    if until.day < 'start.day {
        months -= 1;
    }
    if months < 0 {
        years -= 1;
        months += 12;
    }
    return string `${years} Year(s) ${months} Month(s)`;
}

# Parse a YYYY-MM-DD string into its year, month and day.
#
# + dateStr - Date in YYYY-MM-DD format
# + return - The parsed date, or () if the string is not in that shape
isolated function parseIsoDate(string dateStr) returns time:Date? {
    string[] parts = re`-`.split(dateStr);
    if parts.length() != 3 {
        return ();
    }
    int|error year = int:fromString(parts[0]);
    int|error month = int:fromString(parts[1]);
    int|error day = int:fromString(parts[2]);
    if year is error || month is error || day is error {
        return ();
    }
    return {year, month, day};
}

# The calendar day after a date, rolling over month and year ends.
#
# + date - Date to move forward
# + return - The following day, or () if the date is not a real calendar date
isolated function nextDay(time:Date date) returns time:Date? {
    time:Utc|time:Error utc = time:utcFromCivil({
        year: date.year, month: date.month, day: date.day,
        hour: 0, minute: 0, second: 0, utcOffset: {hours: 0, minutes: 0}
    });
    if utc is time:Error {
        return ();
    }
    time:Civil next = time:utcToCivil(time:utcAddSeconds(utc, 86400));
    return {year: next.year, month: next.month, day: next.day};
}

# Collapse a date into a single sortable number (YYYYMMDD).
#
# + date - Date to collapse
# + return - The date as YYYYMMDD
isolated function dateKey(time:Date date) returns int => date.year * 10000 + date.month * 100 + date.day;

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

# Ordered canonical column keys for the active-employee CSV (41 columns).
final string[] & readonly EMPLOYEE_CSV_COLUMNS = [
    "employeeId", "firstName", "lastName", "gender", "workEmail", "company",
    "location", "employmentType", "jobRole", "externalDesignation", "jobBand", "startDate",
    "continuousServiceDate", "lengthOfService", "reportsTo", "additionalManager",
    "employeeStatus", "team", "subTeam", "epfNumber", "leadEmail", "businessUnit",
    "house", "leadershipGroups", "unit", "office", "probationEndDate", "agreementEndDate",
    "nicOrPassport", "dateOfBirth", "nationality", "personalEmail", "personalPhone",
    "residentNumber", "addressLine1", "addressLine2", "city", "stateOrProvince",
    "postalCode", "country", "emergencyContacts"
];

# Ordered canonical column keys for the resignation CSV (41 shared + 4 resignation-specific).
final string[] & readonly RESIGNATION_CSV_COLUMNS = [
    "employeeId", "firstName", "lastName", "gender", "workEmail", "company",
    "location", "employmentType", "jobRole", "externalDesignation", "jobBand", "startDate",
    "continuousServiceDate", "lengthOfService", "reportsTo", "additionalManager",
    "employeeStatus", "team", "subTeam", "epfNumber", "leadEmail", "businessUnit",
    "house", "leadershipGroups", "unit", "office", "probationEndDate", "agreementEndDate",
    "resignationDate", "finalDayInOffice", "finalDayOfEmployment", "resignationReason",
    "nicOrPassport", "dateOfBirth", "nationality", "personalEmail", "personalPhone",
    "residentNumber", "addressLine1", "addressLine2", "city", "stateOrProvince",
    "postalCode", "country", "emergencyContacts"
];

# Map from canonical column key to its CSV header label.
final map<string> & readonly COLUMN_HEADER_MAP = {
    "employeeId":            "Employee Id",
    "firstName":             "First Name",
    "lastName":              "Last Name",
    "gender":                "Gender",
    "nicOrPassport":         "NIC/Passport",
    "dateOfBirth":           "Date of Birth",
    "nationality":           "Nationality",
    "personalEmail":         "Personal Email",
    "personalPhone":         "Personal Phone",
    "residentNumber":        "Resident Number",
    "addressLine1":          "Address Line 1",
    "addressLine2":          "Address Line 2",
    "city":                  "City",
    "stateOrProvince":       "State/Province",
    "postalCode":            "Postal Code",
    "country":               "Country",
    "emergencyContacts":     "Emergency Contacts",
    "workEmail":             "Work Email",
    "company":               "Company",
    "location":              "Location",
    "employmentType":        "Employment Type",
    "jobRole":               "Job Role",
    "externalDesignation":   "External Designation",
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
        "nicOrPassport"         => { return csvEscape(e.nicOrPassport); }
        "dateOfBirth"           => { return csvEscape(e.dateOfBirth); }
        "nationality"           => { return csvEscape(e.nationality); }
        "personalEmail"         => { return csvEscape(e.personalEmail); }
        "personalPhone"         => { return csvEscape(e.personalPhone); }
        "residentNumber"        => { return csvEscape(e.residentNumber); }
        "addressLine1"          => { return csvEscape(e.addressLine1); }
        "addressLine2"          => { return csvEscape(e.addressLine2); }
        "city"                  => { return csvEscape(e.city); }
        "stateOrProvince"       => { return csvEscape(e.stateOrProvince); }
        "postalCode"            => { return csvEscape(e.postalCode); }
        "country"               => { return csvEscape(e.country); }
        "emergencyContacts"     => { return csvEscape(e.emergencyContacts); }
        "workEmail"             => { return csvEscape(e.workEmail); }
        "company"               => { return csvEscape(e.company); }
        "location"              => { return csvEscape(e.workLocation); }
        "employmentType"        => { return csvEscape(e.employmentType); }
        "jobRole"               => { return csvEscape(e.designation); }
        "externalDesignation"   => { return csvEscape(e.externalDesignation); }
        "jobBand"               => { return csvEscape(e.jobBand != () ? e.jobBand.toString() : ()); }
        "startDate"             => { return csvEscape(e.startDate); }
        "continuousServiceDate" => { return csvEscape(e.continuousServiceDate); }
        "lengthOfService"       => {
            string effectiveStartDate = e.continuousServiceDate ?: e.startDate;
            return csvEscape(calculateLengthOfService(effectiveStartDate, e.finalDayOfEmployment));
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

# Sentinel key that the CSV builder expands into one column per active leadership attribute.
const LEADERSHIP_COLUMN_KEY = "leadershipGroups";

# Prefix marking a synthetic per-attribute leadership column key.
const LEADERSHIP_COLUMN_PREFIX = "__leadership__";

# Expand the leadership sentinel key into one synthetic key per active attribute.
#
# Synthetic keys are prefixed so they cannot collide with a real column key. Ordering is
# alphabetical by name so column order is stable between exports and independent of the
# order rows were inserted into leadership_group.
#
# + cols - Effective column list, possibly containing the sentinel
# + groups - Active leadership attributes
# + return - Column list with the sentinel replaced in place
isolated function expandLeadershipColumns(string[] cols, LeadershipGroup[] groups) returns string[] {
    if cols.indexOf(LEADERSHIP_COLUMN_KEY) == () {
        return cols;
    }
    LeadershipGroup[] sorted = from LeadershipGroup g in groups
        order by g.name ascending
        select g;
    string[] expanded = [];
    foreach string key in cols {
        if key == LEADERSHIP_COLUMN_KEY {
            foreach LeadershipGroup g in sorted {
                expanded.push(string `${LEADERSHIP_COLUMN_PREFIX}${g.name}`);
            }
        } else {
            expanded.push(key);
        }
    }
    return expanded;
}

# Header text for a column key, resolving synthetic leadership keys to the attribute name.
#
# + key - Canonical or synthetic (`__leadership__`-prefixed) column key
# + return - Header text to print in the CSV
isolated function leadershipAwareHeader(string key) returns string {
    if key.startsWith(LEADERSHIP_COLUMN_PREFIX) {
        return key.substring(LEADERSHIP_COLUMN_PREFIX.length());
    }
    return COLUMN_HEADER_MAP[key] ?: key;
}

# Cell value for a column key, resolving synthetic leadership keys to Yes/No.
#
# + e - Employee row being rendered
# + key - Canonical or synthetic (`__leadership__`-prefixed) column key
# + nameMap - email->name resolution map, forwarded to resolveColumnValue for non-leadership keys
# + return - Cell value to print in the CSV
isolated function leadershipAwareValue(Employee e, string key, map<string> nameMap) returns string {
    if key.startsWith(LEADERSHIP_COLUMN_PREFIX) {
        string name = key.substring(LEADERSHIP_COLUMN_PREFIX.length());
        string held = e.leadershipGroups ?: "";
        // leadershipGroups arrives comma-joined from GROUP_CONCAT; compare whole entries so
        // "Senior Leadership" never matches inside another attribute's name.
        string[] parts = re `,`.split(held);
        return parts.indexOf(name) == () ? "No" : "Yes";
    }
    return resolveColumnValue(e, key, nameMap);
}

# Shared CSV builder — used by both buildEmployeeCsv and buildResignationCsv.
# Filters the effective column list to only keys present in defaultCols (ignores unknown keys).
#
# + employees - Employees to export
# + nameMap - email->name resolution map
# + defaultCols - Full ordered column list for this report type
# + requestedCols - Optional subset requested by the caller; nil or empty means use defaultCols
# + leadershipGroups - Active leadership attributes used to expand the leadership sentinel column
# + return - CSV string
isolated function buildCsvWithColumns(
        Employee[] employees,
        map<string> nameMap,
        string[] defaultCols,
        string[]? requestedCols,
        LeadershipGroup[] leadershipGroups) returns string {
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
    effectiveCols = expandLeadershipColumns(effectiveCols, leadershipGroups);

    string[] headers = from string key in effectiveCols
        select csvEscape(leadershipAwareHeader(key));
    string[] lines = [string:'join(",", ...headers)];
    foreach Employee e in employees {
        string[] row = from string key in effectiveCols
            select leadershipAwareValue(e, key, nameMap);
        lines.push(string:'join(",", ...row));
    }
    return string:'join("\n", ...lines);
}

# Build a CSV string from a list of employees aligned with the People HR report format.
#
# + employees - List of employees
# + nameMap - Map of work_email -> full name for resolving additional manager names
# + columns - Optional column allowlist (canonical keys). nil or empty = all 41 columns.
# + leadershipGroups - Active leadership attributes used to expand the leadership sentinel column
# + return - CSV string
public isolated function buildEmployeeCsv(Employee[] employees, map<string> nameMap,
        string[]? columns, LeadershipGroup[] leadershipGroups) returns string =>
    buildCsvWithColumns(employees, nameMap, EMPLOYEE_CSV_COLUMNS, columns, leadershipGroups);

# Build a CSV string from a list of resigned employees aligned with the People HR report format.
#
# + employees - List of resigned employees
# + nameMap - Map of work_email -> full name for resolving additional manager names
# + columns - Optional column allowlist (canonical keys). nil or empty = all 45 columns.
# + leadershipGroups - Active leadership attributes used to expand the leadership sentinel column
# + return - CSV string
public isolated function buildResignationCsv(Employee[] employees, map<string> nameMap,
        string[]? columns, LeadershipGroup[] leadershipGroups) returns string =>
    buildCsvWithColumns(employees, nameMap, RESIGNATION_CSV_COLUMNS, columns, leadershipGroups);

# Whether a prior record can be linked as the employment another one continues from.
#
# Continuous service carries over from a finished employment that came before, so the
# linked record must have ended (status Left) and must have started before the target.
# The start-date rule also rules out cycles: two records cannot each start before the
# other. An employment can never continue from itself.
#
# + priorRecord - Candidate record from the continuous-service-records lookup
# + targetStartDate - Start date (YYYY-MM-DD) of the employment being linked
# + targetEmployeeId - Employee ID of the employment being linked, or () when creating one
# + return - true when the candidate is an eligible prior employment
public isolated function isEligiblePriorEmployment(ContinuousServiceRecordInfo priorRecord,
        string targetStartDate, string? targetEmployeeId) returns boolean =>
    priorRecord.employeeStatus == EMPLOYEE_LEFT
        && priorRecord.employeeId != targetEmployeeId
        && priorRecord.startDate < targetStartDate;
