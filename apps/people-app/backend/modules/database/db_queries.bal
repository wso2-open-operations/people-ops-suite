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

# Fetch employee basic information.
#
# + email - Employee's work email address
# + return - Query to get employee basic information
isolated function getEmployeeBasicInfoQuery(string email) returns sql:ParameterizedQuery =>
    `SELECT 
        id,
        employee_id,
        first_name,
        last_name,
        work_email,
        employee_thumbnail
    FROM employee
    WHERE work_email = ${email};`;

# Fetch all employees' basic information.
#
# + return - Query to get all employees basic information
isolated function getAllEmployeesBasicInfoQuery() returns sql:ParameterizedQuery =>
    `SELECT 
        id,
        employee_id,
        first_name,
        last_name,
        work_email,
        employee_thumbnail
    FROM employee;`;

# Fetch employee detailed information.
#
# + employeeId - Employee ID
# + return - Query to get employee detailed information
isolated function getEmployeeInfoQuery(string employeeId) returns sql:ParameterizedQuery =>
    `SELECT 
        e.id AS id,
        e.employee_id AS employeeId,
        e.first_name AS firstName,
        e.last_name AS lastName,
        e.work_email AS workEmail,
        e.employee_thumbnail AS employeeThumbnail,
        e.epf AS epf,
        c.location AS employmentLocation,
        e.work_location AS workLocation,
        e.start_date AS startDate,
        e.manager_email AS managerEmail,
        COALESCE(eam.additionalManagerEmails, '') AS additionalManagerEmails,
        (
            SELECT COUNT(1)
            FROM employee e2
            WHERE e2.id <> e.id
              AND e2.manager_email = e.work_email
        ) AS subordinateCount,
        e.employee_status AS employeeStatus,
        e.continuous_service_record AS continuousServiceRecord,
        e.probation_end_date AS probationEndDate,
        e.agreement_end_date AS agreementEndDate,
        et.name AS employmentType,
        e.employment_type_id AS employmentTypeId,
        d.career_function_id AS careerFunctionId,
        d.designation AS designation,
        e.designation_id AS designationId,
        e.secondary_job_title AS secondaryJobTitle,
        o.name AS office,
        e.office_id AS officeId,
        bu.name AS businessUnit,
        e.business_unit_id AS businessUnitId,
        t.name AS team,
        e.team_id AS teamId,
        st.name AS subTeam,
        e.sub_team_id AS subTeamId,
        u.name AS unit,
        e.unit_id AS unitId
    FROM
        employee e
        LEFT JOIN (
            SELECT 
                employee_pk_id,
                GROUP_CONCAT(additional_manager_email ORDER BY additional_manager_email SEPARATOR ',') 
                AS additionalManagerEmails
            FROM employee_additional_managers
            GROUP BY employee_pk_id
        ) eam ON eam.employee_pk_id = e.id
        INNER JOIN employment_type et ON e.employment_type_id = et.id
        INNER JOIN designation d ON e.designation_id = d.id
        INNER JOIN office o ON e.office_id = o.id
        INNER JOIN company c ON c.id = o.company_id
        INNER JOIN team t ON e.team_id = t.id
        INNER JOIN sub_team st ON e.sub_team_id = st.id
        INNER JOIN business_unit bu ON e.business_unit_id = bu.id
        LEFT JOIN unit u ON e.unit_id = u.id
    WHERE
        e.employee_id = ${employeeId};`;

# Fetch employees with filters.
# 
# + params - Get employees filter payload
# + return - Parameterized query for fetching employees
isolated function getEmployeesQuery(EmployeeSearchPayload params) returns sql:ParameterizedQuery {

    int page = params.pagination.page;
    int perPage = params.pagination.perPage;
    int offset = (page - 1) * perPage;

    sql:ParameterizedQuery baseQuery = `
        SELECT
            e.id AS id,
            e.employee_id AS employeeId,
            e.first_name AS firstName,
            e.last_name AS lastName,
            e.work_email AS workEmail,
            e.employee_thumbnail AS employeeThumbnail,
            e.epf AS epf,
            e.employment_location AS employmentLocation,
            e.work_location AS workLocation,
            e.start_date AS startDate,
            e.manager_email AS managerEmail,
            COALESCE(eam.additionalManagerEmails, '') AS additionalManagerEmails,
            COALESCE(sc.subordinateCount, 0) AS subordinateCount,
            e.employee_status AS employeeStatus,
            e.continuous_service_record AS continuousServiceRecord,
            e.probation_end_date AS probationEndDate,
            e.agreement_end_date AS agreementEndDate,
            et.name AS employmentType,
            d.designation AS designation,
            e.secondary_job_title AS secondaryJobTitle,
            o.name AS office,
            bu.name AS businessUnit,
            t.name AS team,
            st.name AS subTeam,
            u.name AS unit,
            COUNT(*) OVER() AS totalCount
        FROM
            employee e
            LEFT JOIN (
                SELECT 
                    employee_id,
                    GROUP_CONCAT(additional_manager_email ORDER BY additional_manager_email SEPARATOR ',') 
                    AS additionalManagerEmails
                FROM employee_additional_managers
                GROUP BY employee_id
            ) eam ON eam.employee_id = e.id

            LEFT JOIN (
                SELECT 
                    LOWER(manager_email) AS managerEmail,
                    COUNT(*) AS subordinateCount
                FROM employee
                WHERE manager_email IS NOT NULL AND manager_email <> ''
                GROUP BY LOWER(manager_email)
            ) sc ON sc.managerEmail = LOWER(e.work_email)
            
            INNER JOIN personal_info pi ON pi.id = e.personal_info_id
            INNER JOIN employment_type et ON et.id = e.employment_type_id
            INNER JOIN designation d ON d.id = e.designation_id
            INNER JOIN office o ON o.id = e.office_id
            INNER JOIN business_unit bu ON bu.id = e.business_unit_id
            INNER JOIN team t ON t.id = e.team_id
            INNER JOIN sub_team st ON st.id = e.sub_team_id
            INNER JOIN company c ON c.id = o.company_id
            LEFT JOIN unit u ON u.id = e.unit_id
        `;

    sql:ParameterizedQuery[] filters = [];

    filters.push(`(${params.filters.title} IS NULL OR pi.title = ${params.filters.title})`);
    filters.push(`(${params.filters.firstName} IS NULL OR LOWER(pi.first_name) = LOWER(${params.filters.firstName}))`);
    filters.push(`(${params.filters.lastName} IS NULL OR LOWER(pi.last_name) = LOWER(${params.filters.lastName}))`);
    filters.push(`(${params.filters.nicOrPassport} IS NULL OR pi.nic_or_passport = ${params.filters.nicOrPassport})`);
    filters.push(`(${params.filters.dateOfBirth} IS NULL OR pi.dob = ${params.filters.dateOfBirth})`);
    filters.push(`(${params.filters.gender} IS NULL OR pi.gender = ${params.filters.gender})`);
    filters.push(`(${params.filters.personalEmail} IS NULL OR LOWER(pi.personal_email) = LOWER(${params.filters.personalEmail}))`);
    filters.push(`(${params.filters.personalPhone} IS NULL OR pi.personal_phone = ${params.filters.personalPhone})`);
    filters.push(`(${params.filters.city} IS NULL OR LOWER(pi.city) = LOWER(${params.filters.city}))`);
    filters.push(`(${params.filters.country} IS NULL OR LOWER(pi.country) = LOWER(${params.filters.country}))`);

    string escapedManager = escapeLike(params.filters.managerEmail ?: "");
    string escapedLocation = escapeLike(params.filters.location ?: "");

    filters.push(`(${params.filters.managerEmail} IS NULL OR LOWER(e.manager_email) LIKE LOWER(CONCAT('%', ${escapedManager}, '%')))`);
    filters.push(`(${params.filters.companyId} IS NULL OR o.company_id = ${params.filters.companyId})`);
    filters.push(`(${params.filters.location} IS NULL OR LOWER(e.employment_location) LIKE LOWER(CONCAT('%', ${escapedLocation}, '%')))`);
    filters.push(`(${params.filters.officeId} IS NULL OR e.office_id = ${params.filters.officeId})`);
    filters.push(`(${params.filters.designationId} IS NULL OR e.designation_id = ${params.filters.designationId})`);
    filters.push(`(${params.filters.careerFunctionId} IS NULL OR d.career_function_id = ${params.filters.careerFunctionId})`);
    filters.push(`(${params.filters.employeeStatus} IS NULL OR LOWER(e.employee_status) = LOWER(${params.filters.employeeStatus}))`);
    filters.push(`(${params.filters.businessUnitId} IS NULL OR e.business_unit_id = ${params.filters.businessUnitId})`);
    filters.push(`(${params.filters.teamId} IS NULL OR e.team_id = ${params.filters.teamId})`);
    filters.push(`(${params.filters.subTeamId} IS NULL OR e.sub_team_id = ${params.filters.subTeamId})`);
    filters.push(`(${params.filters.unitId} IS NULL OR e.unit_id = ${params.filters.unitId})`);
    filters.push(`(${params.filters.employmentTypeId} IS NULL OR e.employment_type_id = ${params.filters.employmentTypeId})`);

    string? searchString = params.searchString;

    if searchString is string {
        string[] tokens = tokenizeSearchQuery(searchString);
        foreach string token in tokens {
            filters.push(buildTextTokenFilter(token));
        }
    }

    sql:ParameterizedQuery updated = buildSqlSelectQuery(baseQuery, filters);

    updated = sql:queryConcat(updated, `
        ORDER BY e.id ASC
        LIMIT ${perPage} OFFSET ${offset}
    `);

    return updated;
};

# Fetch distinct managers.
# 
# + return - Parameterized query for fetching distinct managers
isolated function getManagersQuery() returns sql:ParameterizedQuery =>
    `SELECT DISTINCT 
        m.id, 
        m.employee_id, 
        m.work_email
    FROM employee e
    JOIN employee m ON e.manager_email = m.work_email
    WHERE e.manager_email IS NOT NULL AND e.manager_email <> '';`;

# Fetch continuous service record by work email.
#
# + workEmail - Work email of the employee
# + return - Parameterized query for continuous service record
isolated function getContinuousServiceRecordQuery(string workEmail) returns sql:ParameterizedQuery =>
    `SELECT 
        e.id AS id,
        e.employee_id AS employeeId,
        e.first_name AS firstName,
        e.last_name AS lastName,
        c.location AS employmentLocation,
        e.work_location AS workLocation,
        e.start_date AS startDate,
        e.manager_email AS managerEmail,
        COALESCE(eam.additionalManagerEmails, '') AS additionalManagerEmails,
        d.designation AS designation,
        e.secondary_job_title AS secondaryJobTitle,
        o.name AS office,
        bu.name AS businessUnit,
        t.name AS team,
        st.name AS subTeam,
        u.name AS unit
    FROM employee e
        LEFT JOIN (
            SELECT 
                employee_pk_id,
                GROUP_CONCAT(additional_manager_email ORDER BY additional_manager_email SEPARATOR ',') 
                AS additionalManagerEmails
            FROM employee_additional_managers
            GROUP BY employee_pk_id
        ) eam ON eam.employee_pk_id = e.id
        INNER JOIN employment_type et ON e.employment_type_id = et.id
        INNER JOIN designation d ON e.designation_id = d.id
        INNER JOIN office o ON e.office_id = o.id
        INNER JOIN company c ON c.id = o.company_id
        INNER JOIN team t ON e.team_id = t.id
        INNER JOIN business_unit bu ON e.business_unit_id = bu.id
        LEFT JOIN sub_team st ON e.sub_team_id = st.id
        LEFT JOIN unit u ON e.unit_id = u.id
    WHERE
        e.work_email = ${workEmail}
        AND et.is_active = 1
        AND et.name IN ('Permanent');`;

# Search employee personal information.
#
# + payload - Search employee personal information payload
# + return - Query to search employee personal information
isolated function searchEmployeePersonalInfoQuery(SearchEmployeePersonalInfoPayload payload)
    returns sql:ParameterizedQuery {
    sql:ParameterizedQuery mainQuery = `
        SELECT 
            p.id AS id,
            nic_or_passport,
            p.first_name AS firstName,
            p.last_name AS lastName,
            title,
            dob,
            gender,
            personal_email,
            personal_phone,
            resident_number,
            address_line_1,
            address_line_2,
            city,
            state_or_province,
            postal_code,
            country,
            nationality
        FROM personal_info p`;

    string? nicOrPassport = payload?.nicOrPassport;
    if nicOrPassport is string {
        mainQuery = sql:queryConcat(mainQuery, ` WHERE p.nic_or_passport = ${nicOrPassport}`);
    }
    return sql:queryConcat(mainQuery, `;`);
}

# Fetch employee personal information.
#
# + employeeId - Employee ID
# + return - Query to get employee personal information
isolated function getEmployeePersonalInfoQuery(string employeeId) returns sql:ParameterizedQuery =>
    `SELECT 
        p.id AS id,
        nic_or_passport,
        p.first_name AS firstName,
        p.last_name AS lastName,
        title,
        dob,
        gender,
        personal_email,
        personal_phone,
        resident_number,
        address_line_1,
        address_line_2,
        city,
        state_or_province,
        postal_code,
        country,
        nationality
    FROM personal_info p
    INNER JOIN employee e ON p.id = e.personal_info_id
        WHERE e.employee_id = ${employeeId};`;

# Fetch emergency contacts by personal info ID.
#
# + personalInfoId - Personal info primary key
# + return - Query to fetch emergency contacts
isolated function getEmergencyContactsByPersonalInfoIdQuery(int personalInfoId) returns sql:ParameterizedQuery =>
    `SELECT
        name,
        relationship,
        mobile,
        telephone
    FROM personal_info_emergency_contacts
    WHERE personal_info_id = ${personalInfoId};`;

# Get business units query.
# + return - Business units query
isolated function getBusinessUnitsQuery() returns sql:ParameterizedQuery =>
    `SELECT 
        id,
        name
    FROM business_unit;`;

# Get teams query.
#
# + buId - Business unit ID (optional)
# + return - Teams query
isolated function getTeamsQuery(int? buId = ()) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery query = `
        SELECT
            t.id, t.name
        FROM
            team t`;

    if buId is int {
        query = sql:queryConcat(query, `
            LEFT JOIN 
                business_unit_team but ON but.team_id = t.id
            WHERE 
                but.business_unit_id = ${buId}`);
    }
    return sql:queryConcat(query, `;`);
}

# Get sub teams query.
#
# + teamId - Team ID (optional)
# + return - Sub teams query
isolated function getSubTeamsQuery(int? teamId = ()) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery query = `
        SELECT
            st.id, st.name
        FROM
            sub_team st`;
    if teamId is int {
        query = sql:queryConcat(query, ` 
            LEFT JOIN 
                business_unit_team_sub_team butst ON butst.sub_team_id = st.id
            WHERE 
                butst.business_unit_team_id = ${teamId}`);
    }
    return sql:queryConcat(query, `;`);
}

# Get units query.
#
# + subTeamId - Sub team ID (optional)
# + return - Units query
isolated function getUnitsQuery(int? subTeamId = ()) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery query = `
        SELECT
            u.id, u.name
        FROM
            unit u`;
    if subTeamId is int {
        query = sql:queryConcat(query, ` 
            LEFT JOIN 
                business_unit_team_sub_team_unit butstu ON butstu.unit_id = u.id
            WHERE 
                butstu.business_unit_team_sub_team_id = ${subTeamId}`);
    }
    return sql:queryConcat(query, `;`);
}

# Get career functions query.
#
# + return - Career functions query
isolated function getCareerFunctionsQuery() returns sql:ParameterizedQuery =>
    `SELECT 
        id,
        career_function
    FROM career_function;`;

# Get designations query.
#
# + careerFunctionId - Career function ID (optional)
# + return - Designations query
isolated function getDesignationsQuery(int? careerFunctionId = ()) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery query = `
        SELECT 
            id,
            designation,
            job_band
        FROM designation`;
    if careerFunctionId is int {
        query = sql:queryConcat(query, ` WHERE career_function_id = ${careerFunctionId}`);
    }
    return sql:queryConcat(query, `;`);
}

# Get offices query.
#
# + return - Offices query
isolated function getOfficesQuery() returns sql:ParameterizedQuery =>
    `SELECT 
        id,
        name,
        location,
        working_locations
    FROM office;`;

# Get employment types query.
#
# + return - Employment types query
isolated function getEmploymentTypesQuery() returns sql:ParameterizedQuery =>
    `SELECT 
        id,
        name
    FROM employment_type;`;

# Add employee personal information query.
#
# + payload - Create personal info payload
# + createdBy - Creator of the personal info record
# + return - Personal info insert query
isolated function addEmployeePersonalInfoQuery(CreatePersonalInfoPayload payload, string createdBy)
    returns sql:ParameterizedQuery =>
    `INSERT INTO personal_info
        (
            nic_or_passport,
            first_name,
            last_name,
            title,
            dob,
            gender,
            personal_email,
            personal_phone,
            resident_number,
            address_line_1,
            address_line_2,
            city,
            state_or_province,
            postal_code,
            country,
            nationality,
            created_by,
            updated_by
        )
    VALUES
        (
            ${payload.nicOrPassport},
            ${payload.firstName},
            ${payload.lastName},
            ${payload.title},
            ${payload.dob},
            ${payload.gender},
            ${payload.personalEmail},
            ${payload.personalPhone},
            ${payload.residentNumber},
            ${payload.addressLine1},
            ${payload.addressLine2},
            ${payload.city},
            ${payload.stateOrProvince},
            ${payload.postalCode},
            ${payload.country},
            ${payload.nationality},
            ${createdBy},
            ${createdBy}
        );`;

# Add emergency contact query.
#
# + personalInfoId - Personal info primary key
# + contact - Emergency contact details
# + createdBy - Creator of the emergency contact record
# + return - Emergency contact insert query
isolated function addPersonalInfoEmergencyContactQuery(int personalInfoId, EmergencyContact contact, string createdBy)
    returns sql:ParameterizedQuery =>
    `INSERT INTO personal_info_emergency_contacts
        (
            personal_info_id,
            name,
            mobile,
            telephone,
            relationship,
            created_by,
            updated_by
        )
     VALUES
        (
            ${personalInfoId},
            ${contact.name},
            ${contact.mobile},
            ${contact.telephone},
            ${contact.relationship},
            ${createdBy},
            ${createdBy}
        );`;

# Add employee query.
#
# + payload - Add employee payload
# + createdBy - Creator of the employee record
# + personalInfoId - Personal info ID
# + return - Employee insert query
isolated function addEmployeeQuery(CreateEmployeePayload payload, string createdBy, int personalInfoId)
    returns sql:ParameterizedQuery =>
    `INSERT INTO employee
        (
            first_name,
            last_name,
            epf,
            employment_location,
            work_location,
            work_email,
            start_date,
            secondary_job_title,
            manager_email,
            employee_status,
            continuous_service_record,
            employee_thumbnail,
            probation_end_date,
            agreement_end_date,
            personal_info_id,
            employment_type_id,
            designation_id,
            office_id,
            team_id,
            sub_team_id,
            business_unit_id,
            unit_id,
            created_by,
            updated_by
        )
    VALUES
        (
            ${payload.firstName},
            ${payload.lastName},
            ${payload.epf},
            ${payload.employmentLocation},
            ${payload.workLocation},
            ${payload.workEmail},
            ${payload.startDate},
            ${payload.secondaryJobTitle},
            ${payload.managerEmail},
            ${payload.employeeStatus},
            ${payload.continuousServiceRecord},
            ${payload.employeeThumbnail},
            ${payload.probationEndDate},
            ${payload.agreementEndDate},
            ${personalInfoId},
            ${payload.employmentTypeId},
            ${payload.designationId},
            ${payload.officeId},
            ${payload.teamId},
            ${payload.subTeamId},
            ${payload.businessUnitId},
            ${payload.unitId},
            ${createdBy},
            ${createdBy}
        );`;

# Update employee personal information query.
#
# + id - Personal info ID
# + payload - Personal info update payload
# + updatedBy - Updater of the personal info record
# + return - sql:ParameterizedQuery - Update query for personal info
isolated function updateEmployeePersonalInfoQuery(int id, UpdateEmployeePersonalInfoPayload payload, string updatedBy)
    returns sql:ParameterizedQuery {

    sql:ParameterizedQuery mainQuery = `UPDATE personal_info SET `;
    sql:ParameterizedQuery[] updates = [];

    if payload.nicOrPassport != () {
        updates.push(`nic_or_passport = ${payload.nicOrPassport}`);
    }

    if payload.firstName != () {
        updates.push(`first_name = ${payload.firstName}`);
    }

    if payload.lastName != () {
        updates.push(`last_name = ${payload.lastName}`);
    }

    if payload.title != () {
        updates.push(`title = ${payload.title}`);
    }

    if payload.dob != () {
        updates.push(`dob = ${payload.dob}`);
    }

    if payload.gender != () {
        updates.push(`gender = ${payload.gender}`);
    }

    if payload.nationality != () {
        updates.push(`nationality = ${payload.nationality}`);
    }

    if payload.personalEmail is () || payload.personalEmail == "" {
        updates.push(`personal_email = NULL`);
    } else {
        updates.push(`personal_email = ${payload.personalEmail}`);
    }

    if payload.personalPhone is () || payload.personalPhone == "" {
        updates.push(`personal_phone = NULL`);
    } else {
        updates.push(`personal_phone = ${payload.personalPhone}`);
    }

    if payload.residentNumber is () || payload.residentNumber == "" {
        updates.push(`resident_number = NULL`);
    } else {
        updates.push(`resident_number = ${payload.residentNumber}`);
    }

    if payload.addressLine1 is () || payload.addressLine1 == "" {
        updates.push(`address_line_1 = NULL`);
    } else {
        updates.push(`address_line_1 = ${payload.addressLine1}`);
    }

    if payload.addressLine2 is () || payload.addressLine2 == "" {
        updates.push(`address_line_2 = NULL`);
    } else {
        updates.push(`address_line_2 = ${payload.addressLine2}`);
    }

    if payload.city is () || payload.city == "" {
        updates.push(`city = NULL`);
    } else {
        updates.push(`city = ${payload.city}`);
    }

    if payload.stateOrProvince is () || payload.stateOrProvince == "" {
        updates.push(`state_or_province = NULL`);
    } else {
        updates.push(`state_or_province = ${payload.stateOrProvince}`);
    }

    if payload.postalCode is () || payload.postalCode == "" {
        updates.push(`postal_code = NULL`);
    } else {
        updates.push(`postal_code = ${payload.postalCode}`);
    }

    if payload.country is () || payload.country == "" {
        updates.push(`country = NULL`);
    } else {
        updates.push(`country = ${payload.country}`);
    }

    updates.push(`updated_by = ${updatedBy}`);

    sql:ParameterizedQuery query = buildSqlUpdateQuery(mainQuery, updates);
    sql:ParameterizedQuery finalQuery = sql:queryConcat(query, ` WHERE id = ${id}`);
    return finalQuery;
}

# Delete emergency contacts by personal info id.
#
# + personalInfoId - Personal info primary key
# + return - sql:ParameterizedQuery - Delete query for emergency contacts
isolated function deleteEmergencyContactsByPersonalInfoIdQuery(int personalInfoId) returns sql:ParameterizedQuery =>
    `DELETE 
        FROM personal_info_emergency_contacts
            WHERE personal_info_id = ${personalInfoId};`;

# Insert an emergency contact for a personal_info id.
#
# + personalInfoId - Personal info primary key
# + contact - Emergency contact details
# + createdBy - Creator of the emergency contact record
# + return - sql:ParameterizedQuery - Insert query for emergency contacts
isolated function updatePersonalInfoEmergencyContactQuery(int personalInfoId, EmergencyContact contact,
        string createdBy) returns sql:ParameterizedQuery => `
        INSERT INTO personal_info_emergency_contacts
            (
                personal_info_id,
                name, 
                relationship, 
                mobile, 
                telephone, 
                created_by, 
                updated_by
            )
        VALUES
            (
                ${personalInfoId},
                ${contact.name},
                ${contact.relationship},
                ${contact.mobile},
                ${contact.telephone},
                ${createdBy},
                ${createdBy}
            );`;

# Update employee job information query.
#
# + employeeId - Employee ID
# + payload - Job information update payload
# + updatedBy - User performing the update
# + return - sql:ParameterizedQuery - Update query for employee job info
isolated function updateEmployeeJobInfoQuery(string employeeId, UpdateEmployeeJobInfoPayload payload, string updatedBy)
    returns sql:ParameterizedQuery {

    sql:ParameterizedQuery mainQuery = `UPDATE employee SET `;
    sql:ParameterizedQuery[] updates = [];

    if payload.epf is () || payload.epf == "" {
        updates.push(`epf = NULL`);
    } else {
        updates.push(`epf = ${payload.epf}`);
    }

    if payload.employmentLocation != () {
        updates.push(`employment_location = ${payload.employmentLocation}`);
    }

    if payload.workLocation != () {
        updates.push(`work_location = ${payload.workLocation}`);
    }

    if payload.workEmail != () {
        updates.push(`work_email = ${payload.workEmail}`);
    }

    if payload.startDate != () {
        updates.push(`start_date = ${payload.startDate}`);
    }

    if payload.secondaryJobTitle != () {
        updates.push(`secondary_job_title = ${payload.secondaryJobTitle}`);
    }

    if payload.managerEmail != () {
        updates.push(`manager_email = ${payload.managerEmail}`);
    }

    if payload.employeeThumbnail is () || payload.employeeThumbnail == "" {
        updates.push(`employee_thumbnail = NULL`);
    } else {
        updates.push(`employee_thumbnail = ${payload.employeeThumbnail}`);
    }

    if payload.probationEndDate is () || payload.probationEndDate == "" {
        updates.push(`probation_end_date = NULL`);
    } else {
        updates.push(`probation_end_date = ${payload.probationEndDate}`);
    }

    if payload.agreementEndDate is () || payload.agreementEndDate == "" {
        updates.push(`agreement_end_date = NULL`);
    } else {
        updates.push(`agreement_end_date = ${payload.agreementEndDate}`);
    }

    if payload.employmentTypeId != () {
        updates.push(`employment_type_id = ${payload.employmentTypeId}`);
    }
    if payload.designationId != () {
        updates.push(`designation_id = ${payload.designationId}`);
    }
    if payload.officeId != () {
        updates.push(`office_id = ${payload.officeId}`);

    }
    if payload.teamId != () {
        updates.push(`team_id = ${payload.teamId}`);

    }
    if payload.subTeamId != () {
        updates.push(`sub_team_id = ${payload.subTeamId}`);
    }

    if payload.businessUnitId != () {
        updates.push(`business_unit_id = ${payload.businessUnitId}`);
    }

    if payload.unitId is () {
        updates.push(`unit_id = NULL`);
    } else {
        updates.push(`unit_id = ${payload.unitId}`);
    }

    if payload.continuousServiceRecord is () || payload.continuousServiceRecord == "" {
        updates.push(`continuous_service_record = NULL`);
    } else {
        updates.push(`continuous_service_record = ${payload.continuousServiceRecord}`);
    }

    if payload.employeeStatus != () {
        updates.push(`employee_status = ${payload.employeeStatus}`);
    }

    updates.push(`updated_by = ${updatedBy}`);

    sql:ParameterizedQuery query = buildSqlUpdateQuery(mainQuery, updates);
    return sql:queryConcat(query, ` WHERE employee_id = ${employeeId}`);
}

# Delete additional managers by employee database ID.
#
# + employeePkId - Employee ID
# + return - sql:ParameterizedQuery - Delete query for all additional managers
isolated function deleteAdditionalManagersByEmployeeIdQuery(int employeePkId) returns sql:ParameterizedQuery =>
    `DELETE FROM employee_additional_managers
      WHERE 
        employee_pk_id = ${employeePkId};`;

# Add an additional manager for an employee.
#
# + id - Employee ID
# + email - Additional manager email address
# + actor - User creating the additional manager record
# + return - sql:ParameterizedQuery - Insert query for an additional managers
isolated function addEmployeeAdditionalManagerQuery(int id, string email, string actor)
    returns sql:ParameterizedQuery =>
    `INSERT INTO employee_additional_managers
        (
            employee_pk_id,
            additional_manager_email,
            created_by,
            updated_by
        )
      VALUES
        (
            ${id}, 
            ${email}, 
            ${actor}, 
            ${actor}
        );`;

# Build query to fetch vehicles.
#
# + owner - Filter : Owner of the vehicles
# + vehicleStatus - Filter :  status of the vehicle
# + 'limit - Limit of the response  
# + offset - Offset of the response
# + return - sql:ParameterizedQuery - Select query for the vehicles
isolated function fetchVehiclesQuery(string? owner, VehicleStatus? vehicleStatus, int? 'limit, int? offset)
    returns sql:ParameterizedQuery {

    sql:ParameterizedQuery mainQuery = `
        SELECT 
            vehicle_id as 'vehicleId',
            employee_email as 'owner',
            vehicle_registration_number as 'vehicleRegistrationNumber',
            vehicle_type as 'vehicleType',
            vehicle_status as 'vehicleStatus',
            DATE_FORMAT(created_on, '%Y-%m-%d %H:%i:%s') AS 'createdOn',
            created_by as createdBy,
            DATE_FORMAT(updated_on, '%Y-%m-%d %H:%i:%s') AS 'updatedOn',
            updated_by as updatedBy,
            COUNT(*) OVER() AS totalCount
        FROM vehicle
    `;

    // Setting the filters.
    sql:ParameterizedQuery[] filters = [];

    if owner is string {
        filters.push(` employee_email = ${owner}`);
    }

    if vehicleStatus is VehicleStatus {
        filters.push(` vehicle_status = ${vehicleStatus}`);
    }

    // Building the WHERE clause.
    mainQuery = buildSqlSelectQuery(mainQuery, filters);

    // Sorting the result by created_on.
    mainQuery = sql:queryConcat(mainQuery, ` ORDER BY created_on DESC`);

    // Setting the limit and offset.
    if 'limit is int {
        mainQuery = sql:queryConcat(mainQuery, ` LIMIT ${'limit}`);
        if offset is int {
            mainQuery = sql:queryConcat(mainQuery, ` OFFSET ${offset}`);
        }
    } else {
        mainQuery = sql:queryConcat(mainQuery, ` LIMIT ${DEFAULT_LIMIT}`);
    }

    return mainQuery;
}

# Build query to persist a vehicle.
#
# + payload - Payload containing the vehicle details
# + return - sql:ParameterizedQuery - Insert query for the new vehicle
isolated function addVehicleQuery(AddVehiclePayload payload) returns sql:ParameterizedQuery
=> `
    INSERT INTO vehicle
    (
        employee_email,
        vehicle_registration_number,
        vehicle_type,
        vehicle_status,
        created_by,
        updated_by
    )
    VALUES
    (
        ${payload.owner},
        ${payload.vehicleRegistrationNumber},
        ${payload.vehicleType},
        ${payload.vehicleStatus},
        ${payload.createdBy},
        ${payload.createdBy}
    );
`;

# Build query to update the vehicle.
#
# + payload - Payload containing the vehicle details
# + return - sql:ParameterizedQuery - Update query for the specific vehicle
isolated function updateVehicleQuery(UpdateVehiclePayload payload) returns sql:ParameterizedQuery {
    UpdateVehiclePayload {vehicleId, vehicleStatus, updatedBy} = payload;

    sql:ParameterizedQuery mainQuery = `
        UPDATE 
            vehicle
        SET 
    `;

    sql:ParameterizedQuery subQuery = `
        WHERE vehicle_id = ${vehicleId}
    `;

    // Setting the updates based on the payload.
    sql:ParameterizedQuery[] filters = [];

    if vehicleStatus is VehicleStatus {
        filters.push(` vehicle_status = ${vehicleStatus}`);
    }

    // Setting the updated by.
    filters.push(` updated_by = ${updatedBy}`);

    mainQuery = buildSqlUpdateQuery(mainQuery, filters);

    return sql:queryConcat(mainQuery, subQuery);
}
