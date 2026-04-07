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
import people.database;

import ballerina/data.csv;
import ballerina/http;
import ballerina/log;
import ballerina/mime;

# Generate the next employee ID for the given payload.
#
# + payload - Add employee payload
# + return - Generated or manually provided employee ID string or an HTTP error response in case of failure
public isolated function generateEmployeeId(database:CreateEmployeePayload payload)
        returns string|http:BadRequest|http:InternalServerError {

    database:EmployeeIdContext|error ctx = database:getEmployeeIdContext(
            payload.companyId, payload.employmentTypeId
    );
    if ctx is error {
        string customErr = "Error occurred while fetching employee ID context";
        log:printError(customErr, ctx);
        return <http:InternalServerError>{
            body: {
                message: customErr
            }
        };
    }

    match ctx.employmentType {
        database:PERMANENT|database:INTERNSHIP => {
            database:EmployeeIdSequence|error row = database:getLastEmployeeNumericSuffix(
                    ctx.companyPrefix, [ctx.employmentType]
            );
            if row is error {
                string customErr = "Error occurred while fetching last employee numeric suffix";
                log:printError(customErr, row, employmentType = ctx.employmentType, companyPrefix = ctx.companyPrefix);
                return <http:InternalServerError>{
                    body: {
                        message: customErr
                    }
                };
            }
            return string `${ctx.companyPrefix}${<int>row.lastNumericId + 1}`;
        }
        database:CONSULTANCY|database:ADVISORY_CONSULTANCY|database:PART_TIME_CONSULTANCY => {
            database:EmployeeIdSequence|error row = database:getLastEmployeeNumericSuffix(
                    database:CONSULTANCY_ID_PREFIX, [
                        database:CONSULTANCY,
                        database:ADVISORY_CONSULTANCY,
                        database:PART_TIME_CONSULTANCY
                    ]
            );
            if row is error {
                string customErr = "Error occurred while fetching last employee numeric suffix";
                log:printError(customErr, row, employmentType = ctx.employmentType);
                return <http:InternalServerError>{
                    body: {
                        message: customErr
                    }
                };
            }
            return string `${database:CONSULTANCY_ID_PREFIX}${<int>row.lastNumericId + 1}`;
        }
        database:FIXED_TERM => {
            string manualId = (payload.employeeId ?: "").trim();
            if manualId.length() == 0 {
                string customErr = "Employee ID must be provided manually for fixed-term employment type";
                log:printWarn(customErr);
                return <http:BadRequest>{
                    body: {
                        message: customErr
                    }
                };
            }

            if manualId.startsWith(ctx.companyPrefix) && re `[0-9]+`.isFullMatch(manualId.substring(ctx.companyPrefix.length()))
                || manualId.startsWith(database:CONSULTANCY_ID_PREFIX) && re `[0-9]+`.
                    isFullMatch(manualId.substring(database:CONSULTANCY_ID_PREFIX.length())) {
                string customErr = string `Employee ID '${manualId}' is reserved for auto-generation and cannot be assigned manually`;
                log:printWarn(customErr, employeeId = manualId);
                return <http:BadRequest>{
                    body: {
                        message: customErr
                    }
                };
            }

            database:Employee|error? existing = database:getEmployeeInfo(manualId);
            if existing is error {
                string customErr = "Error occurred while checking existing employee ID";
                log:printError(customErr, existing, employeeId = manualId);
                return <http:InternalServerError>{
                    body: {
                        message: customErr
                    }
                };
            }
            if existing is database:Employee {
                string customErr = string `Employee ID already in use: ${manualId}`;
                log:printWarn(customErr, employeeId = manualId);
                return <http:BadRequest>{
                    body: {
                        message: customErr
                    }
                };
            }
            return manualId;
        }
        _ => {
            string customErr = string `Unsupported employment type: ${ctx.employmentType}`;
            log:printError(customErr, employmentType = ctx.employmentType);
            return <http:InternalServerError>{
                body: {
                    message: customErr
                }
            };
        }
    }
}

# Normalizes a string into a lowercase alphanumeric key.
#
# + value - Raw string to normalize
# + return - Lowercase alphanumeric string
public isolated function normalizeKey(string value) returns string {
    string stripped = value.startsWith("\u{FEFF}") ? value.substring(1) : value;
    return re `[^a-zA-Z0-9]+`.replaceAll(stripped.trim(), "").toLowerAscii();
}

# Generates an employee ID for a single CSV row during bulk onboarding.
#
# + payload - Partially built payload for the current row
# + contextCache - Cache mapping `"companyId:employmentTypeId"` to `EmployeeIdContext`
# + sequenceCache - Cache mapping sequence key to last used numeric suffix
# + return - Auto-generated employee ID, or an error on DB failure
public isolated function generateBulkEmployeeId(database:CreateEmployeePayload payload,
        map<database:EmployeeIdContext> contextCache, map<int> sequenceCache) returns string|error {

    string ctxKey = string `${payload.companyId}:${payload.employmentTypeId}`;

    database:EmployeeIdContext context;
    database:EmployeeIdContext? cached = contextCache[ctxKey];
    if cached is database:EmployeeIdContext {
        context = cached;
    } else {
        context = check database:getEmployeeIdContext(payload.companyId, payload.employmentTypeId);
        contextCache[ctxKey] = context;
    }

    match context.employmentType {
        database:PERMANENT|database:INTERNSHIP|database:FIXED_TERM => {
            string seqKey = context.companyPrefix + ":" + context.employmentType.toString();
            if !sequenceCache.hasKey(seqKey) {
                database:EmployeeIdSequence seq = check database:getLastEmployeeNumericSuffix(
                        context.companyPrefix, [context.employmentType]);
                sequenceCache[seqKey] = <int>seq.lastNumericId;
            }
            int next = (sequenceCache[seqKey] ?: 0) + 1;
            sequenceCache[seqKey] = next;
            return string `${context.companyPrefix}${next}`;
        }
        database:CONSULTANCY|database:ADVISORY_CONSULTANCY|database:PART_TIME_CONSULTANCY => {
            string seqKey = database:CONSULTANCY_ID_PREFIX;
            if !sequenceCache.hasKey(seqKey) {
                database:EmployeeIdSequence seq = check database:getLastEmployeeNumericSuffix(
                        database:CONSULTANCY_ID_PREFIX,
                        [database:CONSULTANCY, database:ADVISORY_CONSULTANCY, database:PART_TIME_CONSULTANCY]);
                sequenceCache[seqKey] = <int>seq.lastNumericId;
            }
            int next = (sequenceCache[seqKey] ?: 0) + 1;
            sequenceCache[seqKey] = next;
            return string `${database:CONSULTANCY_ID_PREFIX}${next}`;
        }
        _ => {
            return error("Unsupported employment type: " + context.employmentType.toString());
        }
    }
}

# Loads all reference data required for bulk CSV validation from the database
# and builds normalized name-to-ID lookup maps.
#
# + return - `BulkRefData` with lookup maps, or an error if any DB query fails
isolated function loadBulkReferenceData() returns BulkRefData|error {
    database:BusinessUnit[] businessUnits = check database:getBusinessUnits();
    database:Team[] teams = check database:getTeams();
    database:SubTeam[] subTeams = check database:getSubTeams();
    database:Unit[] units = check database:getUnits();
    database:Designation[] designations = check database:getDesignations();
    database:EmploymentType[] employmentTypes = check database:getEmploymentTypes();
    database:CompanyResponse[] companies = check database:getCompanies();
    database:Office[] offices = check database:getOffices();
    database:House[] houses = check database:getHouses();

    database:House|error? suggestedHouse = database:getHouseWithLeastActiveEmployees();
    int? suggestedHouseId = suggestedHouse is database:House ? suggestedHouse.id : ();

    return {
        businessUnitIds: map from database:BusinessUnit bu in businessUnits
            select [normalizeKey(bu.name), bu.id],
        teamIds: map from database:Team t in teams
            select [normalizeKey(t.name), t.id],
        subTeamIds: map from database:SubTeam st in subTeams
            select [normalizeKey(st.name), st.id],
        unitIds: map from database:Unit u in units
            select [normalizeKey(u.name), u.id],
        designationIds: map from database:Designation d in designations
            select [normalizeKey(d.designation), d.id],
        employmentTypeIds: map from database:EmploymentType et in employmentTypes
            select [normalizeKey(et.name), et.id],
        companyIds: map from database:CompanyResponse c in companies
            select [normalizeKey(c.name), c.id],
        officeIds: map from database:Office o in offices
            select [normalizeKey(o.name), o.id],
        houseIds: map from database:House h in houses
            select [normalizeKey(h.name), h.id],
        suggestedHouseId
    };
}

# Validates a single CSV data row for required fields, formats, and reference data.
#
# + rowNumber - 1-based row number used in error reporting
# + row - Typed CSV row to validate
# + refData - Pre-loaded reference data lookup maps
# + return - Validation errors for the row; empty if valid
isolated function validateBulkRow(int rowNumber, BulkEmployeeCsvRow row, BulkRefData refData)
    returns database:BulkEmployeeError[] {

    database:BulkEmployeeError[] errors = [];

    // Required field presence checks
    if row.firstName.trim().length() == 0 {
        errors.push({row: rowNumber, 'field: CSV_FIELD_FIRST_NAME, message: "First name is required"});
    }
    if row.lastName.trim().length() == 0 {
        errors.push({row: rowNumber, 'field: CSV_FIELD_LAST_NAME, message: "Last name is required"});
    }
    if row.workEmail.trim().length() == 0 {
        errors.push({row: rowNumber, 'field: CSV_FIELD_WORK_EMAIL, message: "Work email is required"});
    } else if !database:EMAIL_PATTERN.isFullMatch(row.workEmail.trim()) {
        errors.push({row: rowNumber, 'field: CSV_FIELD_WORK_EMAIL, message: "Invalid work email format"});
    }
    if row.managerEmail.trim().length() == 0 {
        errors.push({row: rowNumber, 'field: CSV_FIELD_MANAGER_EMAIL, message: "Manager email is required"});
    } else if !database:EMAIL_PATTERN.isFullMatch(row.managerEmail.trim()) {
        errors.push({row: rowNumber, 'field: CSV_FIELD_MANAGER_EMAIL, message: "Invalid manager email format"});
    }
    if row.designation.trim().length() == 0 {
        errors.push({row: rowNumber, 'field: CSV_FIELD_DESIGNATION, message: "Designation is required"});
    }
    if row.businessUnit.trim().length() == 0 {
        errors.push({row: rowNumber, 'field: CSV_FIELD_BUSINESS_UNIT, message: "Business unit is required"});
    }
    if row.team.trim().length() == 0 {
        errors.push({row: rowNumber, 'field: CSV_FIELD_TEAM, message: "Team is required"});
    }
    if row.subTeam.trim().length() == 0 {
        errors.push({row: rowNumber, 'field: CSV_FIELD_SUB_TEAM, message: "Sub team is required"});
    }
    if row.startDate.trim().length() == 0 {
        errors.push({row: rowNumber, 'field: CSV_FIELD_START_DATE, message: "Start date is required"});
    } else if !database:DATE_PATTERN.isFullMatch(row.startDate.trim()) {
        errors.push({row: rowNumber, 'field: CSV_FIELD_START_DATE, message: "Start date must be YYYY-MM-DD"});
    }
    if row.employmentType.trim().length() == 0 {
        errors.push({row: rowNumber, 'field: CSV_FIELD_EMPLOYMENT_TYPE, message: "Employment type is required"});
    }
    if row.company.trim().length() == 0 {
        errors.push({row: rowNumber, 'field: CSV_FIELD_COMPANY, message: "Company is required"});
    }
    if row.workLocation.trim().length() == 0 {
        errors.push({row: rowNumber, 'field: CSV_FIELD_WORK_LOCATION, message: "Work location is required"});
    }
    if row.title.trim().length() == 0 {
        errors.push({row: rowNumber, 'field: CSV_FIELD_TITLE, message: "Title is required"});
    }
    if row.nicOrPassport.trim().length() == 0 {
        errors.push({row: rowNumber, 'field: CSV_FIELD_NIC_OR_PASSPORT, message: "NIC / Passport is required"});
    }
    if row.dob.trim().length() == 0 {
        errors.push({row: rowNumber, 'field: CSV_FIELD_DOB, message: "Date of birth is required"});
    } else if !database:DATE_PATTERN.isFullMatch(row.dob.trim()) {
        errors.push({row: rowNumber, 'field: CSV_FIELD_DOB, message: "Date of birth must be YYYY-MM-DD"});
    }
    if row.gender.trim().length() == 0 {
        errors.push({row: rowNumber, 'field: CSV_FIELD_GENDER, message: "Gender is required"});
    }
    if row.nationality.trim().length() == 0 {
        errors.push({row: rowNumber, 'field: CSV_FIELD_NATIONALITY, message: "Nationality is required"});
    }

    // Optional field format checks
    if row.personalEmail.trim().length() > 0 && !database:EMAIL_PATTERN.isFullMatch(row.personalEmail.trim()) {
        errors.push({row: rowNumber, 'field: CSV_FIELD_PERSONAL_EMAIL, message: "Invalid personal email format"});
    }
    if row.probationEndDate.trim().length() > 0 && !database:DATE_PATTERN.isFullMatch(row.probationEndDate.trim()) {
        errors.push({row: rowNumber, 'field: CSV_FIELD_PROBATION_END_DATE, message: "Probation end date must be YYYY-MM-DD"});
    }
    if row.agreementEndDate.trim().length() > 0 && !database:DATE_PATTERN.isFullMatch(row.agreementEndDate.trim()) {
        errors.push({row: rowNumber, 'field: CSV_FIELD_AGREEMENT_END_DATE, message: "Agreement end date must be YYYY-MM-DD"});
    }

    if row.additionalManagerEmails.trim().length() > 0 {
        string[] parts = re `;`.split(row.additionalManagerEmails);
        foreach string part in parts {
            string email = part.trim();
            if email.length() > 0 && !database:EMAIL_PATTERN.isFullMatch(email) {
                errors.push({
                    row: rowNumber,
                    'field: CSV_FIELD_ADDITIONAL_MANAGER_EMAILS,
                    message: "Invalid email in additionalManagerEmails: " + email
                });
            }
        }
    }

    string ecName = row.emergencyContactName.trim();
    if ecName.length() > 0 {
        if row.emergencyContactMobile.trim().length() == 0 {
            errors.push({
                row: rowNumber,
                'field: CSV_FIELD_EMERGENCY_CONTACT_MOBILE,
                message: "Emergency contact mobile is required when name is provided"
            });
        }
        if row.emergencyContactRelationship.trim().length() == 0 {
            errors.push({
                row: rowNumber,
                'field: CSV_FIELD_EMERGENCY_CONTACT_RELATIONSHIP,
                message: "Emergency contact relationship is required when name is provided"
            });
        }
    }

    if row.designation.trim().length() > 0 && !refData.designationIds.hasKey(normalizeKey(row.designation)) {
        errors.push({row: rowNumber, 'field: CSV_FIELD_DESIGNATION, message: "Unknown designation"});
    }
    if row.businessUnit.trim().length() > 0 && !refData.businessUnitIds.hasKey(normalizeKey(row.businessUnit)) {
        errors.push({row: rowNumber, 'field: CSV_FIELD_BUSINESS_UNIT, message: "Unknown business unit"});
    }
    if row.team.trim().length() > 0 && !refData.teamIds.hasKey(normalizeKey(row.team)) {
        errors.push({row: rowNumber, 'field: CSV_FIELD_TEAM, message: "Unknown team"});
    }
    if row.subTeam.trim().length() > 0 && !refData.subTeamIds.hasKey(normalizeKey(row.subTeam)) {
        errors.push({row: rowNumber, 'field: CSV_FIELD_SUB_TEAM, message: "Unknown sub team"});
    }
    if row.employmentType.trim().length() > 0 && !refData.employmentTypeIds.hasKey(normalizeKey(row.employmentType)) {
        errors.push({row: rowNumber, 'field: CSV_FIELD_EMPLOYMENT_TYPE, message: "Unknown employment type"});
    }
    if row.company.trim().length() > 0 && !refData.companyIds.hasKey(normalizeKey(row.company)) {
        errors.push({row: rowNumber, 'field: CSV_FIELD_COMPANY, message: "Unknown company"});
    }
    if row.office.trim().length() > 0 && !refData.officeIds.hasKey(normalizeKey(row.office)) {
        errors.push({row: rowNumber, 'field: CSV_FIELD_OFFICE, message: "Unknown office: '" + row.office.trim() + "'"});
    }

    return errors;
}

# Builds a `CreateEmployeePayload` from a validated CSV row.
#
# + row - Typed CSV row to build the payload from
# + refData - Pre-loaded reference data lookup maps
# + return - Fully populated `CreateEmployeePayload` ready for DB insertion
isolated function buildBulkEmployeePayload(BulkEmployeeCsvRow row, BulkRefData refData)
    returns database:CreateEmployeePayload {

    string firstName = row.firstName.trim();
    string lastName = row.lastName.trim();

    string officeRaw = row.office.trim();
    string unitRaw = row.unit.trim();
    int? officeId = officeRaw.length() > 0 ? refData.officeIds[normalizeKey(officeRaw)] : ();
    int? unitId = unitRaw.length() > 0 ? refData.unitIds[normalizeKey(unitRaw)] : ();

    database:Email[] additionalManagerEmails = [];
    if row.additionalManagerEmails.trim().length() > 0 {
        string[] parts = re `;`.split(row.additionalManagerEmails);
        foreach string part in parts {
            string email = part.trim();
            if email.length() > 0 {
                additionalManagerEmails.push(email);
            }
        }
    }

    database:EmergencyContact[]? emergencyContacts = ();
    string ecName = row.emergencyContactName.trim();
    if ecName.length() > 0 {
        string ecTelephone = row.emergencyContactTelephone.trim();
        emergencyContacts = [
            {
                name: ecName,
                mobile: row.emergencyContactMobile.trim(),
                relationship: row.emergencyContactRelationship.trim(),
                telephone: ecTelephone.length() > 0 ? ecTelephone : ()
            }
        ];
    }

    return {
        firstName,
        lastName,
        epf: row.epf.trim().length() > 0 ? row.epf.trim() : (),
        companyId: refData.companyIds[normalizeKey(row.company)] ?: 0,
        workLocation: row.workLocation.trim(),
        workEmail: row.workEmail.trim(),
        startDate: row.startDate.trim(),
        managerEmail: row.managerEmail.trim(),
        secondaryJobTitle: row.secondaryJobTitle.trim().length() > 0 ? row.secondaryJobTitle.trim() : (),
        employmentTypeId: refData.employmentTypeIds[normalizeKey(row.employmentType)] ?: 0,
        designationId: refData.designationIds[normalizeKey(row.designation)] ?: 0,
        teamId: refData.teamIds[normalizeKey(row.team)] ?: 0,
        subTeamId: refData.subTeamIds[normalizeKey(row.subTeam)] ?: 0,
        unitId,
        businessUnitId: refData.businessUnitIds[normalizeKey(row.businessUnit)] ?: 0,
        officeId,
        houseId: refData.suggestedHouseId,
        additionalManagerEmails,
        continuousServiceRecord: row.continuousServiceRecord.trim().length() > 0 ? row.continuousServiceRecord.trim() : (),
        probationEndDate: row.probationEndDate.trim().length() > 0 ? row.probationEndDate.trim() : (),
        agreementEndDate: row.agreementEndDate.trim().length() > 0 ? row.agreementEndDate.trim() : (),
        personalInfo: {
            nicOrPassport: row.nicOrPassport.trim(),
            firstName,
            lastName,
            fullName: (firstName + " " + lastName).trim(),
            title: row.title.trim(),
            dob: row.dob.trim(),
            gender: row.gender.trim(),
            nationality: row.nationality.trim(),
            personalEmail: row.personalEmail.trim().length() > 0 ? row.personalEmail.trim() : (),
            personalPhone: row.personalPhone.trim().length() > 0 ? row.personalPhone.trim() : (),
            residentNumber: row.residentNumber.trim().length() > 0 ? row.residentNumber.trim() : (),
            addressLine1: row.addressLine1.trim().length() > 0 ? row.addressLine1.trim() : (),
            addressLine2: row.addressLine2.trim().length() > 0 ? row.addressLine2.trim() : (),
            city: row.city.trim().length() > 0 ? row.city.trim() : (),
            stateOrProvince: row.stateOrProvince.trim().length() > 0 ? row.stateOrProvince.trim() : (),
            postalCode: row.postalCode.trim().length() > 0 ? row.postalCode.trim() : (),
            country: row.country.trim().length() > 0 ? row.country.trim() : (),
            emergencyContacts
        }
    };
}

# Extracts the CSV file bytes from a multipart HTTP request.
#
# + req - Incoming HTTP request containing multipart form-data
# + return - File contents as a byte array, or `http:BadRequest` if missing or unreadable
public isolated function extractCsvFileBytes(http:Request req) returns byte[]|http:BadRequest {
    mime:Entity[]|error bodyParts = req.getBodyParts();
    if bodyParts is error {
        return <http:BadRequest>{
            body: {
                message: "Invalid multipart payload"
            }
        };
    }

    foreach mime:Entity part in bodyParts {
        string|mime:HeaderNotFoundError cd = part.getHeader(mime:CONTENT_DISPOSITION);
        if cd is string {
            mime:ContentDisposition disposition = mime:getContentDispositionObject(cd);
            if disposition.name == "file" {
                byte[]|mime:ParserError fileBytes = part.getByteArray();
                if fileBytes is mime:ParserError {
                    return <http:BadRequest>{
                        body: {
                            message: "Failed to read uploaded file"
                        }
                    };
                }
                return fileBytes;
            }
        }
    }
    return <http:BadRequest>{
        body: {
            message: "Missing 'file' field in multipart form data"
        }
    };
}

# Processes all CSV data rows in a single pass: validates each row
# and builds intra-CSV email and NIC duplicate indices.
#
# + rows - Typed CSV rows parsed from the uploaded file
# + refData - Pre-loaded reference data lookup maps
# + return - `BulkFirstPassResult` with parsed rows, errors, and duplicate indices
isolated function processBulkCsvRows(BulkEmployeeCsvRow[] rows, BulkRefData refData)
        returns BulkFirstPassResult {
    CsvRowInfo[] rowInfos = [];
    database:BulkEmployeeError[] errors = [];
    map<int> emailByRow = {};
    map<int> nicByRow = {};
    string[] candidateEmails = [];
    string[] candidateNics = [];

    foreach int i in 0 ..< rows.length() {
        BulkEmployeeCsvRow row = rows[i];
        int rowNumber = i + 2;

        errors.push(...validateBulkRow(rowNumber, row, refData));

        string normEmail = normalizeKey(row.workEmail);
        if normEmail.length() > 0 {
            if emailByRow.hasKey(normEmail) {
                errors.push({row: rowNumber, 'field: CSV_FIELD_WORK_EMAIL, message: "Duplicate work email in CSV"});
            } else {
                emailByRow[normEmail] = rowNumber;
                candidateEmails.push(normEmail);
            }
        }

        string normNic = row.nicOrPassport.trim();
        if normNic.length() > 0 {
            if nicByRow.hasKey(normNic) {
                errors.push({row: rowNumber, 'field: CSV_FIELD_NIC_OR_PASSPORT, message: "Duplicate NIC/Passport in CSV"});
            } else {
                nicByRow[normNic] = rowNumber;
                candidateNics.push(normNic);
            }
        }

        rowInfos.push({rowNumber, values: row});
    }

    return {
        rowInfos,
        errors,
        skipped: 0,
        emailByRow,
        nicByRow,
        candidateEmails,
        candidateNics
    };
}

# Checks for database-level duplicate work emails and NIC/Passport numbers.
#
# + emailByRow - Normalized work email to row number map
# + nicByRow - NIC/Passport value to row number map
# + candidateEmails - Work emails to batch-check against the DB
# + candidateNics - NIC/Passport values to batch-check against the DB
# + return - Duplicate errors found in the DB, or an error if the DB query fails
public isolated function detectDbDuplicates(map<int> emailByRow, map<int> nicByRow,
        string[] candidateEmails, string[] candidateNics)
        returns database:BulkEmployeeError[]|error {
    database:BulkEmployeeError[] errors = [];

    if candidateEmails.length() > 0 {
        string[] existingEmails = check database:getExistingWorkEmails(candidateEmails);
        foreach string existing in existingEmails {
            int? rowNum = emailByRow[normalizeKey(existing)];
            if rowNum is int {
                errors.push({
                    row: rowNum,
                    'field: CSV_FIELD_WORK_EMAIL,
                    message: "Work email already exists"
                });
            }
        }
    }

    if candidateNics.length() > 0 {
        string[] existingNics = check database:getExistingNicOrPassport(candidateNics);
        foreach string existing in existingNics {
            int? rowNum = nicByRow[existing.trim()];
            if rowNum is int {
                errors.push({
                    row: rowNum,
                    'field: CSV_FIELD_NIC_OR_PASSPORT,
                    message: "NIC/Passport already exists"
                });
            }
        }
    }

    return errors;
}

# Builds `CreateEmployeePayload` records for all validated rows
# and auto-generates employee IDs using in-memory sequence caches.
#
# + rowInfos - Parsed and validated data rows from `processBulkCsvRows`
# + refData - Pre-loaded reference data lookup maps
# + return - `BulkPayloadResult` with resolved employees, or an error on DB failure
isolated function buildBulkPayloads(CsvRowInfo[] rowInfos, BulkRefData refData)
        returns BulkPayloadResult|error {
    ResolvedEmployee[] employees = [];
    map<database:EmployeeIdContext> contextCache = {};
    map<int> sequenceCache = {};

    foreach CsvRowInfo rowInfo in rowInfos {
        database:CreateEmployeePayload payload = buildBulkEmployeePayload(rowInfo.values, refData);
        string generatedId = check generateBulkEmployeeId(payload, contextCache, sequenceCache);
        payload.employeeId = generatedId;
        employees.push({employeeId: generatedId, payload, rowNumber: rowInfo.rowNumber});
    }

    return {employees};
}

# Parses raw CSV bytes into typed `BulkEmployeeCsvRow` records.
# Requires at least one data row after the header.
#
# + fileBytes - Raw bytes of the uploaded CSV file
# + return - Array of typed CSV rows, or an error on failure
public isolated function parseCsvBytes(byte[] fileBytes) returns BulkEmployeeCsvRow[]|error {
    BulkEmployeeCsvRow[] rows = check csv:parseBytes(fileBytes);
    if rows.length() == 0 {
        return error("CSV must contain a header row and at least one data row");
    }
    return rows;
}
