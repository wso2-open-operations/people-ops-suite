// Copyright (c) 2023, WSO2 Inc. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 Inc. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import employee_data_sync.clients;
import employee_data_sync.email;
import employee_data_sync.types;

import ballerina/log;
import ballerina/sql;
import ballerinax/peoplehr;

const EMPLOYEE_TABLE = "employee";

types:ForeignTableData[] hrisDesignations = check getForeignKeyTableData(`hris_designation`, `designation_id`,
        `designation`);
types:ForeignTableData[] hrisCompanies = check getForeignKeyTableData(`hris_company`, `company_id`, `company_name`);
types:ForeignTableData[] hrisBusinessUnits = check getForeignKeyTableData(`hris_business_unit`, `business_unit_id`,
        `business_unit_name`);

types:ForeignTableData[] hrisTeams = check getForeignKeyTableData(`hris_team`, `team_id`, `team_name`);
types:ForeignTableData[] hrisUnits = check getForeignKeyTableData(`hris_unit`, `unit_id`, `unit_name`);
types:ForeignTableData[] hrisSubUnits = check getForeignKeyTableData(`hris_sub_unit`, `sub_unit_id`,
        `sub_unit_name`);
types:ForeignTableData[] hrisEmployementTypes = check getForeignKeyTableData(`hris_employment_type`,
        `employment_type_id`, `employment_type_name`);

// Employee data sync schedule task will retrieve employee data and
// sync it to a MySQL database related to the People HR sync.

@display {
    label: "People-HR Employee sync scheduled task",
    id: "hris/employee-data-sync"
}
public function main() returns error? {
    log:printInfo("Employee data sync task started");
    int insertQueryCount = 0;
    int insertedQueryCount = 0;
    sql:ParameterizedQuery[] insertPeopleHrQueries = [];
    sql:ParameterizedQuery[] insertHrisQueries = [];

    do {
        peoplehr:QueryDetail peopleHrResponse = check clients:baseClient->getQueryByName(
            {QueryName: types:PEOPLE_HR_QUERY_NAME}
        );
        json peopleHrEmployees = peopleHrResponse.Result;
        if peopleHrEmployees is json[] {
            foreach json peoplehrEmployeeData in peopleHrEmployees {
                types:Employee employee = check peoplehrEmployeeData.cloneWithType();
                insertPeopleHrQueries[insertQueryCount] = populatePeopleHrQuery(employee);
                sql:ParameterizedQuery|error? queryResult = populateHrisEmployeeQuery(employee);
                if queryResult is error {
                    log:printError("Error occurred while populating employee table: ", queryResult);
                    return queryResult;
                }
                if queryResult != () {
                    insertHrisQueries[insertQueryCount] = queryResult;
                }
                //if insert query count is 100, execute the batch
                insertQueryCount = insertQueryCount + 1;
                if (insertQueryCount == 100) {
                    insertedQueryCount += 100;
                    sql:ExecutionResult[]|sql:Error execResultPeopleHr =
                        clients:peopleHrDatabaseClient->batchExecute(insertPeopleHrQueries);
                    if execResultPeopleHr is sql:Error {
                        log:printError("Error occurred while inserting data to the database: ", execResultPeopleHr);
                        return execResultPeopleHr;
                    }

                    sql:ExecutionResult[]|sql:Error execResultHris =
                        clients:hrisDatabaseClient->batchExecute(insertHrisQueries);
                    if execResultHris is sql:Error {
                        log:printError("Error occurred while populating data to the HRIS database: ", execResultHris);
                        return execResultHris;
                    }
                    log:printInfo(string `Inserted  ${insertedQueryCount} records to the database`);
                    insertQueryCount = 0;
                    insertPeopleHrQueries = [];
                    insertHrisQueries = [];
                }
            }
            insertedQueryCount += insertPeopleHrQueries.length();
            _ = check clients:peopleHrDatabaseClient->batchExecute(insertPeopleHrQueries);
            _ = check clients:hrisDatabaseClient->batchExecute(insertHrisQueries);
            log:printInfo(string `Last batch inserted with ${insertedQueryCount} total records to the database`);

            // Update the subordinate count with 0 for all the employees in people_hr
            log:printInfo("Updating subordinate count to 0");
            sql:ParameterizedQuery updateSubordinateCount = `
                UPDATE people_hr
                SET SubordinateCount = CASE
                WHEN SubordinateCount != 0 THEN 0
                ELSE SubordinateCount
                END;`;

            sql:ExecutionResult subordinateCountResetResults =
                check clients:peopleHrDatabaseClient->execute(updateSubordinateCount);
            log:printInfo(string `Subordinate count reset for : ${subordinateCountResetResults.affectedRowCount ?: 0}`);

            // Update the subordinate count in people_hr
            sql:ParameterizedQuery query = `
                UPDATE people_hr AS p1
                    JOIN (
                            SELECT ManagerEmail, COUNT(WorkEmail) AS SubordinateCount
                            FROM people_hr
                            WHERE EmployeeStatus IN ('Active', 'Marked Leaver')
                            GROUP BY ManagerEmail
                    ) AS p2 ON p1.WorkEmail = p2.ManagerEmail
                SET p1.SubordinateCount = p2.SubordinateCount
            `;

            sql:ExecutionResult subordinateCountUpdateResultsPeopleHr =
                check clients:peopleHrDatabaseClient->execute(query);
            log:printInfo(string `Subordinate count updated for : ${
                    subordinateCountUpdateResultsPeopleHr.affectedRowCount ?: 0}`);

            // Update the subordinate count with 0 for all the employees in hris_employee
            sql:ParameterizedQuery updateSubordinateCountHris = `
                UPDATE hris_employee
                SET employee_subordinate_count = CASE
                WHEN employee_subordinate_count != 0 THEN 0
                ELSE employee_subordinate_count
                END;`;

            sql:ExecutionResult subordinateCountResetResultsHRIS =
                check clients:hrisDatabaseClient->execute(updateSubordinateCountHris);
            log:printInfo(string
                    `Subordinate count reset for hris: ${subordinateCountResetResultsHRIS.affectedRowCount ?: 0}`);

            // Update the subordinate count in hris_employee
            sql:ParameterizedQuery hrisSubordinateCountQuery = `
                UPDATE hris_employee AS p1
                    JOIN (
                            SELECT employee_lead, COUNT(employee_work_email) AS employee_subordinate_count
                            FROM hris_employee
                            WHERE employee_status IN ('Active', 'Marked Leaver')
                            GROUP BY employee_lead
                    ) AS p2 ON p1.employee_work_email = p2.employee_lead
                SET p1.employee_subordinate_count = p2.employee_subordinate_count
            `;

            sql:ExecutionResult subordinateCountUpdateResultsHris =
                check clients:hrisDatabaseClient->execute(hrisSubordinateCountQuery);
            log:printInfo(
                    string `Subordinate count updated for : ${subordinateCountUpdateResultsHris.affectedRowCount ?: 0}`
            );
        }
    } on fail error e {
        log:printError("Error occured during the sync process", e);
        return e;
    }
}

# Checks for missing or invalid values in an Employee record.
#
# + employee - Employee details to be validated.
# + return - Returns an error? indicating any detected invalid fields, or nil if all fields are valid.
public function checkInvalidValues(types:Employee employee) returns error? {

    if employee.Work\ Email is () {
        log:printWarn(string `Null work email observed in ${EMPLOYEE_TABLE} for user ${employee.Employee\ Id}`);
        return check email:sendEmployeeSyncAlert(EMPLOYEE_TABLE, "Work Email", (), employee.Work\ Email);
    }
    if employee.Title is () {
        log:printWarn(string `Null title observed in ${EMPLOYEE_TABLE} for user ${employee.Work\ Email ?: ""}`);
        return check email:sendEmployeeSyncAlert(EMPLOYEE_TABLE, "Title", (), employee.Work\ Email);
    }
    if employee.Personal\ Email is () {
        log:printWarn(string `Null personal email observed in ${EMPLOYEE_TABLE} for user ${
            employee.Work\ Email ?: ""}`);
        return check email:sendEmployeeSyncAlert(EMPLOYEE_TABLE, "Personal Email", (), employee.Work\ Email);
    }
    if employee.Personal\ Phone\ Number is () {
        log:printWarn(string `Null personal phone number observed in ${EMPLOYEE_TABLE} for user ${
            employee.Work\ Email ?: ""}`);
        return check email:sendEmployeeSyncAlert(EMPLOYEE_TABLE, "Personal Phone Number", (), employee.Work\ Email);
    }
    if employee.EPF\ Number\ \(EPF\) is () {
        log:printWarn(string `Null epf observed in ${EMPLOYEE_TABLE} for user ${employee.Work\ Email ?: ""}`);
        return check email:sendEmployeeSyncAlert(EMPLOYEE_TABLE, "EPF", (), employee.Work\ Email);
    }
    if employee?.System1\ ID is () {
        log:printWarn(string `Null job band observed in ${EMPLOYEE_TABLE} for user ${employee.Work\ Email ?: ""}`);
        return check email:sendEmployeeSyncAlert(EMPLOYEE_TABLE, "Job Band", (), employee.Work\ Email);
    }
    if employee?.Team\ \(Team\ and\ Sub\ Team\) is () {
        log:printWarn(string `Null unit observed in ${EMPLOYEE_TABLE} for user ${employee.Work\ Email ?: ""}`);
        return check email:sendEmployeeSyncAlert(EMPLOYEE_TABLE, "Unit", (), employee.Work\ Email);
    }
    if employee?.Manager\ Email is () {
        log:printWarn(string `Null lead observed in ${EMPLOYEE_TABLE} for user ${employee.Work\ Email ?: ""}`);
        return check email:sendEmployeeSyncAlert(EMPLOYEE_TABLE, "Lead", (), employee.Work\ Email);
    }
}

# Retrieves foreign key table data from the database.
#
# + tableName - The name of the table to query
# + id - The column representing the foreign key ID
# + value - The column representing the corresponding value
# + return - An array of records containing the retrieved IDs and values, or an error if the query fails
public function getForeignKeyTableData(sql:ParameterizedQuery tableName, sql:ParameterizedQuery id,
        sql:ParameterizedQuery value) returns types:ForeignTableData[]|error {

    stream<types:ForeignTableData, error?> resultStream = clients:hrisDatabaseClient->query(
            sql:queryConcat(`SELECT `, id, ` AS id, `, value, ` AS value FROM `, tableName));

    return from types:ForeignTableData result in resultStream
        select {
            id: result.id,
            value: result.value
        };
}

# Retrieves the foreign key ID from a given table based on a matching value.
#
# + hrisTable - An array of records representing the foreign key table
# + tableName - The name of the table being queried (used for logging purposes)
# + attribute - Name of the attribute in the table 
# + value - The value to search for in the table
# + empEmail - Employee email
# + return - The matching foreign key ID if found, null if no match is found, or an error if any issue occurs
public function getForeignKeyId(types:ForeignTableData[] hrisTable, string tableName, string attribute, string? value,
        string? empEmail) returns int|error? {

    if value != () {
        int[] ids = from types:ForeignTableData tableRecord in hrisTable
            where string:toLowerAscii(tableRecord.value) == string:toLowerAscii(value)
            limit 1
            select tableRecord.id;
        if ids.length() == 0 {
            log:printWarn(string `No rows retrieved in ${tableName} for ${empEmail ?: ""}`, column = attribute,
                    value = value);
            error? emailResponse = email:sendEmployeeSyncAlert(tableName, attribute, value, empEmail);
            if emailResponse is error {
                log:printError("Error occurred while processing the email!", emailResponse);
            }
            return;
        }
        return ids[0];
    }
    return;
}

# Constructs an SQL INSERT query to populate the `PEOPLE_HR` table with employee data.
#
# + employee - The Employee record containing employee details
# + return - A sql:ParameterizedQuery representing the insert or update SQL statement
public function populatePeopleHrQuery(types:Employee employee) returns sql:ParameterizedQuery => `
    INSERT INTO PEOPLE_HR (
        EmployeeId,
        EPF,
        Title,
        FirstName,
        LastName,
        WorkEmail,
        PersonalEmail,
        Gender,
        StartDate,
        JobRole,
        Company,
        Location,
        Department,
        ReportsTo,
        ManagerEmail,
        ReportsToEmail,
        Team,
        SubTeam,
        SupportRotationEligible,
        EmploymentType,
        ResignationDate,
        FinalDayinOffice,
        FinalDayofEmployment,
        EmployeeStatus,
        SupportLead,
        QSPLead,
        ResignationReason,
        PersonalPhoneNumber,
        WorkPhoneNumber,
        ContinuousServiceDate,
        Initialdateofjoining,
        AdditionalManager,
        LengthOfService,
        BusinessUnit,
        JobBand,
        RelocationStatus
    )
    VALUES(
        ${employee.Employee\ Id},
        ${employee.EPF\ Number\ \(EPF\)},
        ${employee.Title},
        ${employee.First\ Name},
        ${employee.Last\ Name},
        ${employee.Work\ Email},
        ${employee.Personal\ Email},
        ${employee.Gender},
        ${employee.Start\ Date},
        ${employee.Job\ Role},
        ${employee.Company},
        ${employee.Location},
        ${employee.Department},
        ${employee.Reports\ To},
        ${employee.Manager\ Email},
        ${employee?.Email\ \(Lead\ Email\ ID\)},
        ${employee?.Team\ \(Team\ and\ Sub\ Team\)},
        ${employee?.Sub\ Team\ \(Team\ and\ Sub\ Team\)},
        ${""},
        ${employee.Employment\ Type},
        ${employee.Resignation\ Date},
        ${employee.Final\ Day\ in\ Office},
        ${employee.Final\ Day\ of\ Employment},
        ${employee.Employee\ Status},
        ${employee?.Support\ Lead\ \(Lead\ Role\ Status\)},
        ${employee?.QSP\ Lead\ \(Lead\ Role\ Status\)},
        ${employee?.Reason\ for\ Resignation\ \(Resignation\ Reasons\)},
        ${employee.Personal\ Phone\ Number}, 
        ${employee.Work\ Phone\ Number},
        ${employee.Continuous\ Service\ Date},
        ${employee?.Initial\ date\ of\ joining\ \(Actual\ Start\ Date\)},
        ${employee.Additional\ Manager},
        ${employee.Length\ Of\ Service},
        ${employee.BU\ \(Business\ Unit\)},
        ${employee?.System1\ ID},
        ${employee?.Relocation\ \(Relocation\)}
    )
    ON DUPLICATE KEY UPDATE 
        EmployeeId=${employee.Employee\ Id},
        EPF=${employee.EPF\ Number\ \(EPF\)},
        Title=${employee.Title},
        FirstName=${employee.First\ Name},
        LastName=${employee.Last\ Name},
        WorkEmail=${employee.Work\ Email},
        Gender=${employee.Gender},
        StartDate=${employee.Start\ Date},
        JobRole=${employee.Job\ Role},
        Company=${employee.Company},
        Location=${employee.Location},
        Department=${employee.Department},
        ReportsTo=${employee.Reports\ To},
        ManagerEmail=${employee.Manager\ Email},
        ReportsToEmail=${employee?.Email\ \(Lead\ Email\ ID\)},
        Team=${employee?.Team\ \(Team\ and\ Sub\ Team\)},
        SubTeam=${employee?.Sub\ Team\ \(Team\ and\ Sub\ Team\)},
        SupportRotationEligible=${""},
        EmploymentType=${employee.Employment\ Type},
        ResignationDate=${employee.Resignation\ Date},
        FinalDayinOffice=${employee.Final\ Day\ in\ Office},
        FinalDayofEmployment=${employee.Final\ Day\ of\ Employment},
        EmployeeStatus=${employee.Employee\ Status},
        SupportLead=${employee?.Support\ Lead\ \(Lead\ Role\ Status\)},
        QSPLead=${employee?.QSP\ Lead\ \(Lead\ Role\ Status\)},
        ResignationReason=${employee?.Reason\ for\ Resignation\ \(Resignation\ Reasons\)},
        PersonalPhoneNumber=${employee.Personal\ Phone\ Number},
        WorkPhoneNumber=${employee.Work\ Phone\ Number},
        ContinuousServiceDate=${employee.Continuous\ Service\ Date},
        Initialdateofjoining=${employee?.Initial\ date\ of\ joining\ \(Actual\ Start\ Date\)},
        AdditionalManager=${employee.Additional\ Manager},
        LengthOfService=${employee.Length\ Of\ Service},
        BusinessUnit=${employee.BU\ \(Business\ Unit\)},
        JobBand=${employee?.System1\ ID},
        RelocationStatus=${employee?.Relocation\ \(Relocation\)}
`;

# Populates or updates the HRIS employee table with the provided employee details.
#
# + employee - The Employee record containing the details to populate in the HRIS database
# + return - Returns an error if any foreign key lookup or database operation fails; otherwise, returns null
public function populateHrisEmployeeQuery(types:Employee employee) returns sql:ParameterizedQuery|error? {

    int? employeeDesignationId = check getForeignKeyId(hrisDesignations, "hris_designation", "Designation",
            employee.Job\ Role, employee.Work\ Email);
    int? employeeCompanyId = check getForeignKeyId(hrisCompanies, "hris_company", "Company",
            mapCompanyName(employee.Company, employee.Employee\ Id), employee.Work\ Email);
    int? employeeBusinessUnitId = check getForeignKeyId(hrisBusinessUnits, "hris_business_unit", "Business Unit",
            employee.BU\ \(Business\ Unit\), employee.Work\ Email);
    int? employeeTeamId = check getForeignKeyId(hrisTeams, "hris_team", "Team", employee.Department,
            employee.Work\ Email);
    int? employeeUnitId = check getForeignKeyId(hrisUnits, "hris_unit", "Unit",
            employee?.Team\ \(Team\ and\ Sub\ Team\), employee.Work\ Email);
    int? employeeSubUnitId = check getForeignKeyId(hrisSubUnits, "hris_sub_unit", "Sub Unit",
            employee?.Sub\ Team\ \(Team\ and\ Sub\ Team\), employee.Work\ Email);
    int? employeeEmploymentTypeId = check getForeignKeyId(hrisEmployementTypes, "hris_employment_type",
            "Employment Type", employee.Employment\ Type, employee.Work\ Email);

    if employeeDesignationId == () ||
    employeeCompanyId == () ||
    employeeBusinessUnitId == () ||
    employeeTeamId == () ||
    employeeSubUnitId == () ||
    employeeEmploymentTypeId == () {
        return;
    }

    return `
        INSERT INTO hris_employee (
            employee_id,
            employee_epf,
            employee_title,
            employee_first_name,
            employee_last_name,
            employee_work_email, 
            employee_personal_email,
            employee_gender,
            employee_personal_phone_number,
            employee_work_phone_number, 
            employee_start_date,
            employee_company_id,
            employee_location,
            employee_job_band,
            employee_designation_id, 
            employee_business_unit_id,
            employee_team_id,
            employee_unit_id,
            employee_sub_unit_id,
            employee_lead, 
            employee_additional_lead,
            employee_employment_type_id,
            employee_resignation_date, 
            employee_resignation_reason,
            employee_final_day_in_office,
            employee_final_day_of_employment, 
            employee_status,
            employee_relocation_status,
            employee_created_by,
            employee_updated_by
        ) 
        VALUES (
            ${employee.Employee\ Id},
            ${employee.EPF\ Number\ \(EPF\)},
            ${employee.Title},
            ${employee.First\ Name},
            ${employee.Last\ Name},
            ${employee.Work\ Email},
            ${employee.Personal\ Email},
            ${employee.Gender},
            ${employee.Personal\ Phone\ Number},
            ${employee.Work\ Phone\ Number},
            ${employee.Start\ Date},
            ${employeeCompanyId},
            ${replaceLocations(employee.Location)},
            ${employee?.System1\ ID},
            ${employeeDesignationId},
            ${employeeBusinessUnitId},
            ${employeeTeamId},
            ${employeeUnitId},
            ${employeeSubUnitId},
            ${employee.Manager\ Email},
            ${processAdditionalLeadEmails(employee?.Email\ \(Lead\ Email\ ID\), employee.Manager\ Email)},
            ${employeeEmploymentTypeId},
            ${employee.Resignation\ Date},
            ${employee?.Reason\ for\ Resignation\ \(Resignation\ Reasons\)},
            ${employee.Final\ Day\ in\ Office},
            ${employee.Final\ Day\ of\ Employment},
            ${employee.Employee\ Status},
            ${employee.Relocation\ \(Relocation\)},
            "SYSTEM",
            "SYSTEM"
        )
        ON DUPLICATE KEY UPDATE
            employee_id=${employee.Employee\ Id},
            employee_epf=${employee.EPF\ Number\ \(EPF\)},
            employee_title=${employee.Title},
            employee_first_name=${employee.First\ Name},
            employee_last_name=${employee.Last\ Name},
            employee_work_email=${employee.Work\ Email},
            employee_personal_email=${employee.Personal\ Email},
            employee_gender=${employee.Gender},
            employee_personal_phone_number=${employee.Personal\ Phone\ Number},
            employee_work_phone_number=${employee.Work\ Phone\ Number},
            employee_start_date=${employee.Start\ Date},
            employee_company_id=${employeeCompanyId},
            employee_location=${replaceLocations(employee.Location)},
            employee_job_band=${employee?.System1\ ID},
            employee_designation_id=${employeeDesignationId},
            employee_business_unit_id=${employeeBusinessUnitId},
            employee_team_id=${employeeTeamId},
            employee_unit_id=${employeeUnitId},
            employee_sub_unit_id=${employeeSubUnitId},
            employee_lead=${employee.Manager\ Email},
            employee_additional_lead=${processAdditionalLeadEmails(
                employee?.Email\ \(Lead\ Email\ ID\), employee.Manager\ Email)},
            employee_employment_type_id=${employeeEmploymentTypeId},
            employee_resignation_date=${employee.Resignation\ Date},
            employee_resignation_reason=${employee?.Reason\ for\ Resignation\ \(Resignation\ Reasons\)},
            employee_final_day_in_office=${employee.Final\ Day\ in\ Office},
            employee_final_day_of_employment=${employee.Final\ Day\ of\ Employment},
            employee_status=${employee.Employee\ Status},
            employee_relocation_status=${employee.Relocation\ \(Relocation\)},
            employee_created_by="SYSTEM",
            employee_updated_by="SYSTEM"
    `;
}

# Maps the given company name or employee ID to the standardized company name based on predefined mappings.
#
# + companyName - The name of the company to be mapped
# + employeeId - The ID of the employee to be checked for special case mappings
# + return - The mapped company name if a mapping is found, otherwise the original company name
public function mapCompanyName(string? companyName, string? employeeId) returns string? {

    map<string> companyMappings = {
        "WSO2-AUSTRALIA": "WSO2 - AUSTRALIA",
        "WSO2 - US": "WSO2 - USA",
        "WSO2- INDIA": "WSO2 - INDIA",
        "WSO2 - SG": "WSO2 - SINGAPORE",
        "WSO2 Germany GmbH": "WSO2 - GERMANY"
    };

    // Special cases based on employeeId
    map<string> employeeIdMappings = {
        "CON000057": "WSO2 - UK",
        "LK100001": "WSO2 - SRI LANKA",
        "US100067": "WSO2 - USA"
    };

    // Check for mapping based on company name
    if companyName is string && companyMappings.hasKey(companyName) {
        return companyMappings.get(companyName);
    }

    // Check for mapping based on employee ID
    if employeeId is string && employeeIdMappings.hasKey(employeeId) {
        return employeeIdMappings.get(employeeId);
    }

    return companyName;
}

# Removes specific suffixes from the given location string to standardize location name.
#
# + location - The location string to be processed
# + return - The standardized location string with the suffix removed, or the original location if no match is found
public function replaceLocations(string? location) returns string? {

    if location is string && (location.endsWith(" - TL") || location.endsWith(" - TL") || location.endsWith(" - VP")) {
        return location.substring(0, location.length() - 5);
    }
    return location;
}

# Process additional lead emails by filtering out the manager's email and returning a sorted, comma-separated list.
#
# + additionalLeads - A comma-separated string of additional lead email addresses
# + managerEmail - The email address of the manager
# + return - A sorted, comma-separated string of additional lead emails excluding the manager's email, or the 
# original additional leads if no processing is required
public function processAdditionalLeadEmails(string? additionalLeads, string? managerEmail) returns string? {

    if additionalLeads is string {
        string[] leadEmails = re `,`.split(additionalLeads);
        string leadEmail = managerEmail is string ? managerEmail : "";
        if managerEmail is string {
            string[] filteredEmails = leadEmails.filter(function(string email) returns boolean {
                return email.trim() != leadEmail.trim();
            });
            filteredEmails = filteredEmails.sort("ascending");
            return string:'join(",", ...filteredEmails);
        }
    }
    return additionalLeads;
}
