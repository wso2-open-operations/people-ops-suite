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
        employee_id,
        first_name,
        last_name,
        work_email,
        employee_thumbnail
    FROM employee;`;

# Fetch employee ID by primary key ID.
#
# + id - Primary key ID of the employee record
# + return - Query to get employee ID
isolated function getEmployeeIdQuery(int id) returns sql:ParameterizedQuery =>
    `SELECT employee_id FROM employee WHERE id = ${id};`;

# Fetch employee ID by EPF.
#
# + epf - Employee Provident Fund number
# + return - Query to get employee ID by EPF number
isolated function getEmployeeIdByEpfQuery(string epf) returns sql:ParameterizedQuery =>
    `SELECT employee_id FROM employee WHERE epf = ${epf} LIMIT 1;`;

# Fetch employee detailed information.
#
# + employeeId - Employee ID
# + return - Query to get employee detailed information
isolated function getEmployeeInfoQuery(string employeeId) returns sql:ParameterizedQuery =>
    `SELECT 
        e.employee_id AS employeeId,
        e.first_name AS firstName,
        e.last_name AS lastName,
        e.work_email AS workEmail,
        e.employee_thumbnail AS employeeThumbnail,
        e.epf AS epf,
        c.name AS company,
        e.company_id AS companyId,
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
        LEFT JOIN office o ON e.office_id = o.id
        INNER JOIN company c ON c.id = e.company_id
        INNER JOIN team t ON e.team_id = t.id
        INNER JOIN sub_team st ON e.sub_team_id = st.id
        INNER JOIN business_unit bu ON e.business_unit_id = bu.id
        LEFT JOIN unit u ON e.unit_id = u.id
    WHERE
        e.employee_id = ${employeeId};`;

# Fetch employees with filters.
#
# + payload - Get employees filter payload
# + leadEmail - If provided, restricts results to subordinates of this lead
# + return - Parameterized query for fetching employees
isolated function getEmployeesQuery(EmployeeSearchPayload payload, string? leadEmail = ()) returns sql:ParameterizedQuery {

    int 'limit = payload.pagination.'limit;
    int offset = payload.pagination.offset;

    sql:ParameterizedQuery baseQuery = `
        SELECT
            e.employee_id AS employeeId,
            e.first_name AS firstName,
            e.last_name AS lastName,
            e.work_email AS workEmail,
            e.employee_thumbnail AS employeeThumbnail,
            e.epf AS epf,
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
            e.unit_id AS unitId,
            c.name AS company,
            e.company_id AS companyId,
            r.date                    AS resignationDate,
            r.final_day_in_office     AS finalDayInOffice,
            r.final_day_of_employment AS finalDayOfEmployment,
            r.reason                  AS resignationReason,
            COUNT(*) OVER() AS totalCount
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
            INNER JOIN company c ON c.id = e.company_id
            LEFT JOIN office o ON o.id = e.office_id
            INNER JOIN business_unit bu ON bu.id = e.business_unit_id
            INNER JOIN team t ON t.id = e.team_id
            INNER JOIN sub_team st ON st.id = e.sub_team_id
            LEFT JOIN unit u ON u.id = e.unit_id
            LEFT JOIN resignation r ON r.employee_id = e.id
        `;

    sql:ParameterizedQuery[] filters = [];

    // Lead restriction: must be the first filter so it cannot be bypassed.
    if leadEmail is string {
        if payload.filters.directReports == false {
            // Show all subordinates recursively
            sql:ParameterizedQuery ctePrefix = `WITH RECURSIVE subordinate_tree (pk_id, w_email, visited) AS (
                SELECT id, work_email, CAST(id AS CHAR(1000))
                FROM employee
                WHERE LOWER(manager_email) = LOWER(${leadEmail})
                UNION
                SELECT e2.id, e2.work_email, CAST(e2.id AS CHAR(1000))
                FROM employee e2
                JOIN employee_additional_managers eam2 ON eam2.employee_pk_id = e2.id
                WHERE LOWER(eam2.additional_manager_email) = LOWER(${leadEmail})
                UNION ALL
                SELECT e2.id, e2.work_email, CONCAT(st.visited, ',', e2.id)
                FROM employee e2
                JOIN subordinate_tree st ON LOWER(e2.manager_email) = LOWER(st.w_email)
                WHERE NOT FIND_IN_SET(e2.id, st.visited)
                UNION ALL
                SELECT e2.id, e2.work_email, CONCAT(st.visited, ',', e2.id)
                FROM employee e2
                JOIN employee_additional_managers eam2 ON eam2.employee_pk_id = e2.id
                JOIN subordinate_tree st ON LOWER(eam2.additional_manager_email) = LOWER(st.w_email)
                WHERE NOT FIND_IN_SET(e2.id, st.visited)
            ) `;
            baseQuery = sql:queryConcat(ctePrefix, baseQuery);
            filters.push(`e.id IN (SELECT pk_id FROM subordinate_tree)`);
        } else {
            // Direct reports only (default)
            filters.push(`(
                LOWER(e.manager_email) = LOWER(${leadEmail})
                OR EXISTS (
                    SELECT 1
                    FROM employee_additional_managers leam
                    WHERE leam.employee_pk_id = e.id
                      AND LOWER(leam.additional_manager_email) = LOWER(${leadEmail})
                )
            )`);
        }
    }

    appendStringFilter(filters, payload.filters.title, `pi.title = ${payload.filters.title}`);
    appendStringFilter(filters, payload.filters.firstName, `LOWER(pi.first_name) = LOWER(${payload.filters.firstName})`);
    appendStringFilter(filters, payload.filters.lastName, `LOWER(pi.last_name) = LOWER(${payload.filters.lastName})`);
    appendStringFilter(filters, payload.filters.dateOfBirth, `pi.dob = ${payload.filters.dateOfBirth}`);
    appendStringFilter(filters, payload.filters.gender, `pi.gender = ${payload.filters.gender}`);
    appendStringFilter(filters, payload.filters.personalEmail, `LOWER(pi.personal_email) = LOWER(${payload.filters.personalEmail})`);
    appendStringFilter(filters, payload.filters.personalPhone, `pi.personal_phone = ${payload.filters.personalPhone}`);
    appendStringFilter(filters, payload.filters.residentNumber, `pi.resident_number = ${payload.filters.residentNumber}`);
    appendStringFilter(filters, payload.filters.city, `LOWER(pi.city) = LOWER(${payload.filters.city})`);
    appendStringFilter(filters, payload.filters.country, `LOWER(pi.country) = LOWER(${payload.filters.country})`);
    appendStringFilter(filters, payload.filters.employeeStatus, `LOWER(e.employee_status) = LOWER(${payload.filters.employeeStatus})`);

    if payload.filters.managerEmail is string {
        filters.push(`LOWER(e.manager_email) LIKE LOWER(CONCAT('%', ${payload.filters.managerEmail}, '%'))`);
    }

    if payload.filters.nicOrPassport is int|string {
        filters.push(`pi.nic_or_passport = ${payload.filters.nicOrPassport}`);
    }

    appendIntFilter(filters, payload.filters.companyId, `e.company_id = ${payload.filters.companyId}`);
    appendIntFilter(filters, payload.filters.officeId, `e.office_id = ${payload.filters.officeId}`);
    appendIntFilter(filters, payload.filters.designationId, `e.designation_id = ${payload.filters.designationId}`);
    appendIntFilter(filters, payload.filters.careerFunctionId, `d.career_function_id = ${payload.filters.careerFunctionId}`);
    appendIntFilter(filters, payload.filters.businessUnitId, `e.business_unit_id = ${payload.filters.businessUnitId}`);
    appendIntFilter(filters, payload.filters.teamId, `e.team_id = ${payload.filters.teamId}`);
    appendIntFilter(filters, payload.filters.subTeamId, `e.sub_team_id = ${payload.filters.subTeamId}`);
    appendIntFilter(filters, payload.filters.unitId, `e.unit_id = ${payload.filters.unitId}`);
    appendIntFilter(filters, payload.filters.employmentTypeId, `e.employment_type_id = ${payload.filters.employmentTypeId}`);

    string? searchString = payload.searchString;

    if searchString is string {
        filters.push(buildTextTokenFilter(searchString));
    }

    sql:ParameterizedQuery retrieveEmployeeQuery = buildSqlSelectQuery(baseQuery, filters);
    sql:ParameterizedQuery orderByClause = buildOrderByClause(payload.sort);

    retrieveEmployeeQuery = sql:queryConcat(retrieveEmployeeQuery, orderByClause, ` LIMIT ${'limit} OFFSET ${offset};`);

    return retrieveEmployeeQuery;
};

# Fetch distinct managers.
#
# + return - Parameterized query for fetching distinct managers
isolated function getManagersQuery() returns sql:ParameterizedQuery =>
    `SELECT DISTINCT 
        m.employee_id, 
        m.work_email
    FROM employee e
    JOIN employee m ON e.manager_email = m.work_email
    WHERE e.manager_email IS NOT NULL AND e.manager_email <> '';`;

# Check if a target employee is a direct or additional subordinate of a lead.
#
# + leadEmail - Work email of the potential lead
# + employeeId - Employee ID of the target employee
# + return - Parameterized query returning 1 row if the relationship exists
isolated function isSubordinateOfLeadQuery(string leadEmail, string employeeId) returns sql:ParameterizedQuery =>
    `WITH RECURSIVE subordinate_tree (pk_id, w_email, visited) AS (
        SELECT id, work_email, CAST(id AS CHAR(1000))
        FROM employee
        WHERE LOWER(manager_email) = LOWER(${leadEmail})
        UNION
        SELECT e.id, e.work_email, CAST(e.id AS CHAR(1000))
        FROM employee e
        JOIN employee_additional_managers eam ON eam.employee_pk_id = e.id
        WHERE LOWER(eam.additional_manager_email) = LOWER(${leadEmail})
        UNION ALL
        SELECT e.id, e.work_email, CONCAT(st.visited, ',', e.id)
        FROM employee e
        JOIN subordinate_tree st ON LOWER(e.manager_email) = LOWER(st.w_email)
        WHERE NOT FIND_IN_SET(e.id, st.visited)
        UNION ALL
        SELECT e.id, e.work_email, CONCAT(st.visited, ',', e.id)
        FROM employee e
        JOIN employee_additional_managers eam ON eam.employee_pk_id = e.id
        JOIN subordinate_tree st ON LOWER(eam.additional_manager_email) = LOWER(st.w_email)
        WHERE NOT FIND_IN_SET(e.id, st.visited)
    )
    SELECT 1
    FROM subordinate_tree
    WHERE pk_id = (SELECT id FROM employee WHERE employee_id = ${employeeId})
    LIMIT 1`;

# Check if an employee is a lead (has at least one direct or additional subordinate).
#
# + leadEmail - Work email of the employee to check
# + return - Parameterized query returning 1 row if the employee is a lead
isolated function isLeadQuery(string leadEmail) returns sql:ParameterizedQuery =>
    `SELECT 1
     FROM employee
     WHERE LOWER(manager_email) = LOWER(${leadEmail})
       AND manager_email IS NOT NULL
       AND manager_email <> ''
     UNION ALL
     SELECT 1
     FROM employee_additional_managers
     WHERE LOWER(additional_manager_email) = LOWER(${leadEmail})
     LIMIT 1;`;

# Fetch continuous service record by work email.
#
# + workEmail - Work email of the employee
# + return - Parameterized query for continuous service record
isolated function getContinuousServiceRecordQuery(string workEmail) returns sql:ParameterizedQuery =>
    `SELECT 
        e.employee_id AS employeeId,
        e.first_name AS firstName,
        e.last_name AS lastName,
        e.work_location AS workLocation,
        e.start_date AS startDate,
        e.manager_email AS managerEmail,
        COALESCE(eam.additionalManagerEmails, '') AS additionalManagerEmails,
        d.designation AS designation,
        e.secondary_job_title AS secondaryJobTitle,
        o.name AS office,
        bu.name AS businessUnit,
        c.name AS company,
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
        LEFT JOIN office o ON e.office_id = o.id
        INNER JOIN company c ON c.id = e.company_id
        INNER JOIN team t ON e.team_id = t.id
        INNER JOIN sub_team st ON e.sub_team_id = st.id
        INNER JOIN business_unit bu ON e.business_unit_id = bu.id
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
            nic_or_passport,
            p.first_name AS firstName,
            p.last_name AS lastName,
            full_name,
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
        nic_or_passport,
        p.first_name AS firstName,
        p.last_name AS lastName,
        full_name,
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
# + employeeId - Employee ID
# + return - Query to fetch emergency contacts
isolated function getEmergencyContactsByEmployeeIdQuery(string employeeId) returns sql:ParameterizedQuery =>
    `SELECT
        piec.name,
        piec.relationship,
        piec.mobile,
        piec.telephone
    FROM personal_info_emergency_contacts piec
    INNER JOIN employee e ON e.personal_info_id = piec.personal_info_id
    WHERE e.employee_id = ${employeeId};`;

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

# Get full organization structure query.
#
# + return - Full organization structure query
isolated function getFullOrganizationStructureQuery() returns sql:ParameterizedQuery =>
    `SELECT
        bu.id,
        bu.name,
        COALESCE(
            (
                SELECT JSON_ARRAYAGG(team_sub.obj)
                FROM LATERAL (
                    SELECT JSON_OBJECT(
                        'id', t.id,
                        'name', t.name,
                        'subTeams',
                        COALESCE(
                            (
                                SELECT JSON_ARRAYAGG(subteam_sub.obj)
                                FROM LATERAL (
                                    SELECT JSON_OBJECT(
                                        'id', st.id,
                                        'name', st.name,
                                        'units',
                                        COALESCE(
                                            (
                                                SELECT JSON_ARRAYAGG(unit_sub.obj)
                                                FROM LATERAL (
                                                    SELECT JSON_OBJECT(
                                                        'id', u.id,
                                                        'name', u.name
                                                    ) AS obj
                                                    FROM business_unit_team_sub_team_unit butstu
                                                    INNER JOIN unit u ON u.id = butstu.unit_id
                                                    WHERE butstu.business_unit_team_sub_team_id = butst.id
                                                    ORDER BY u.name
                                                ) AS unit_sub
                                            ),
                                            JSON_ARRAY()
                                        )
                                    ) AS obj
                                    FROM business_unit_team_sub_team butst
                                    INNER JOIN sub_team st ON st.id = butst.sub_team_id
                                    WHERE butst.business_unit_team_id = but.id
                                    ORDER BY st.name
                                ) AS subteam_sub
                            ),
                            JSON_ARRAY()
                        )
                    ) AS obj
                    FROM business_unit_team but
                    INNER JOIN team t ON t.id = but.team_id
                    WHERE but.business_unit_id = bu.id
                    ORDER BY t.name
                ) AS team_sub
            ),
            JSON_ARRAY()
        ) AS teams
    FROM business_unit bu
    ORDER BY bu.name;`;

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

# Get companies query.
#
# + return - Companies query
isolated function getCompaniesQuery() returns sql:ParameterizedQuery =>
    `SELECT 
        c.id,
        c.name,
        c.prefix,
        c.location,
        GROUP_CONCAT(cal.allowed_location ORDER BY cal.allowed_location SEPARATOR ',') AS allowedLocations
    FROM company c
    LEFT JOIN companies_allowed_locations cal 
        ON c.id = cal.company_id AND cal.is_active = 1
    GROUP BY c.id, c.name, c.prefix, c.location;`;

# Get offices query.
#
# + companyId - Company ID (optional)
# + return - Offices query
isolated function getOfficesQuery(int? companyId = ()) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery query = `
        SELECT 
            id,
            name,
            location,
            working_locations
        FROM office`;
    if companyId is int {
        query = sql:queryConcat(query, ` WHERE company_id = ${companyId}`);
    }
    return sql:queryConcat(query, `;`);
}

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
            full_name,
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
            ${payload.fullName},
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
# + employeeId - Employee ID
# + contact - Emergency contact details
# + createdBy - Creator of the emergency contact record
# + return - Emergency contact insert query
isolated function addPersonalInfoEmergencyContactQuery(string employeeId, EmergencyContact contact, string createdBy)
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
            (SELECT personal_info_id FROM employee WHERE employee_id = ${employeeId}),
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
            company_id,
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
            ${payload.companyId},
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
# + employeeId - Personal info ID
# + payload - Personal info update payload
# + updatedBy - Updater of the personal info record
# + return - sql:ParameterizedQuery - Update query for personal info
isolated function updateEmployeePersonalInfoQuery(string employeeId, UpdateEmployeePersonalInfoPayload payload, string updatedBy)
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

    if payload.fullName != () {
        updates.push(`full_name = ${payload.fullName}`);
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

    if payload.personalEmail is string {
        if payload.personalEmail == "" {
            updates.push(`personal_email = NULL`);
        } else {
            updates.push(`personal_email = ${payload.personalEmail}`);
        }
    }

    if payload.personalPhone is string {
        if payload.personalPhone == "" {
            updates.push(`personal_phone = NULL`);
        } else {
            updates.push(`personal_phone = ${payload.personalPhone}`);
        }
    }

    if payload.residentNumber is string {
        if payload.residentNumber == "" {
            updates.push(`resident_number = NULL`);
        } else {
            updates.push(`resident_number = ${payload.residentNumber}`);
        }
    }

    if payload.addressLine1 is string {
        if payload.addressLine1 == "" {
            updates.push(`address_line_1 = NULL`);
        } else {
            updates.push(`address_line_1 = ${payload.addressLine1}`);
        }
    }

    if payload.addressLine2 is string {
        if payload.addressLine2 == "" {
            updates.push(`address_line_2 = NULL`);
        } else {
            updates.push(`address_line_2 = ${payload.addressLine2}`);
        }
    }

    if payload.city is string {
        if payload.city == "" {
            updates.push(`city = NULL`);
        } else {
            updates.push(`city = ${payload.city}`);
        }
    }

    if payload.stateOrProvince is string {
        if payload.stateOrProvince == "" {
            updates.push(`state_or_province = NULL`);
        } else {
            updates.push(`state_or_province = ${payload.stateOrProvince}`);
        }
    }

    if payload.postalCode is string {
        if payload.postalCode == "" {
            updates.push(`postal_code = NULL`);
        } else {
            updates.push(`postal_code = ${payload.postalCode}`);
        }
    }

    if payload.country is string {
        if payload.country == "" {
            updates.push(`country = NULL`);
        } else {
            updates.push(`country = ${payload.country}`);
        }
    }

    updates.push(`updated_by = ${updatedBy}`);

    sql:ParameterizedQuery query = buildSqlUpdateQuery(mainQuery, updates);

    sql:ParameterizedQuery finalQuery = sql:queryConcat(query, `
        WHERE id = (SELECT personal_info_id FROM employee WHERE employee_id = ${employeeId})
    `);

    return finalQuery;
}

# Delete emergency contacts by personal info id.
#
# + employeeId - Employee ID
# + return - sql:ParameterizedQuery - Delete query for emergency contacts
isolated function deleteEmergencyContactsByEmployeeIdQuery(string employeeId) returns sql:ParameterizedQuery =>
    `DELETE piec
        FROM personal_info_emergency_contacts piec
        INNER JOIN employee e ON e.personal_info_id = piec.personal_info_id
        WHERE e.employee_id = ${employeeId};`;

# Insert an emergency contact for a personal_info id.
#
# + employeeId - Employee ID
# + contact - Emergency contact details
# + createdBy - Creator of the emergency contact record
# + return - sql:ParameterizedQuery - Insert query for emergency contacts
isolated function updatePersonalInfoEmergencyContactQuery(string employeeId, EmergencyContact contact,
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
                (SELECT personal_info_id FROM employee WHERE employee_id = ${employeeId}),
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

    if payload.epf is string {
        if payload.epf == "" {
            updates.push(`epf = NULL`);
        } else {
            updates.push(`epf = ${payload.epf}`);
        }
    }

    if payload.companyId != () {
        updates.push(`company_id = ${payload.companyId}`);
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

    if payload.secondaryJobTitle is string {
        if payload.secondaryJobTitle == "" {
            updates.push(`secondary_job_title = NULL`);
        } else {
            updates.push(`secondary_job_title = ${payload.secondaryJobTitle}`);
        }
    }

    if payload.managerEmail != () {
        updates.push(`manager_email = ${payload.managerEmail}`);
    }

    if payload.employeeThumbnail is string {
        if payload.employeeThumbnail == "" {
            updates.push(`employee_thumbnail = NULL`);
        } else {
            updates.push(`employee_thumbnail = ${payload.employeeThumbnail}`);
        }
    }

    if payload.probationEndDate is string {
        if payload.probationEndDate == "" {
            updates.push(`probation_end_date = NULL`);
        } else {
            updates.push(`probation_end_date = ${payload.probationEndDate}`);
        }
    }

    if payload.agreementEndDate is string {
        if payload.agreementEndDate == "" {
            updates.push(`agreement_end_date = NULL`);
        } else {
            updates.push(`agreement_end_date = ${payload.agreementEndDate}`);
        }
    }

    if payload.employmentTypeId != () {
        updates.push(`employment_type_id = ${payload.employmentTypeId}`);
    }

    if payload.designationId != () {
        updates.push(`designation_id = ${payload.designationId}`);
    }

    if payload.officeId is int {
        updates.push(`office_id = ${payload.officeId}`);
    } else if payload.officeId is () {
        updates.push(`office_id = NULL`);
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

    if payload.unitId is int {
        updates.push(`unit_id = ${payload.unitId}`);
    } else if payload.unitId is () {
        updates.push(`unit_id = NULL`);
    }

    if payload.continuousServiceRecord is string {
        if payload.continuousServiceRecord == "" {
            updates.push(`continuous_service_record = NULL`);
        } else {
            updates.push(`continuous_service_record = ${payload.continuousServiceRecord}`);
        }
    }

    updates.push(`updated_by = ${updatedBy}`);

    sql:ParameterizedQuery query = buildSqlUpdateQuery(mainQuery, updates);

    sql:ParameterizedQuery finalQuery = sql:queryConcat(query, `
        WHERE employee_id = ${employeeId}
    `);

    return finalQuery;
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
# + vehicleType - Filter :  type of the vehicle
# + 'limit - Limit of the response  
# + offset - Offset of the response
# + return - sql:ParameterizedQuery - Select query for the vehicles
isolated function fetchVehiclesQuery(string? owner, VehicleStatus? vehicleStatus, VehicleTypes? vehicleType,
        int? 'limit, int? offset) returns sql:ParameterizedQuery {

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

    if vehicleType is VehicleTypes {
        filters.push(` vehicle_type = ${vehicleType}`);
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

# Get owner email of a vehicle by id.
#
# + vehicleId - Vehicle ID
# + return - Query to get the owner email of the vehicle
isolated function getVehicleOwnerQuery(int vehicleId) returns sql:ParameterizedQuery =>
    `SELECT employee_email as 'owner' FROM vehicle
     WHERE vehicle_id = ${vehicleId} AND vehicle_status = 'ACTIVE'
     LIMIT 1`;

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

# Build query to update a business unit.
#
# + payload - Fields to update in the business unit
# + buId - ID of the business unit to update
# + return - Parameterized UPDATE query for the business unit
isolated function updateBusinessUnitQuery(UpdateOrgUnitPayload payload, int buId) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery mainQuery = `
      UPDATE
        business_unit
      SET
    `;
    return buildOrganizationUnitUpdateQuery(mainQuery, payload, buId);
}

# Build query to update a team.
#
# + payload - Fields to update in the team
# + teamId - ID of the team to update
# + return - Parameterized UPDATE query for the team
isolated function updateTeamQuery(UpdateOrgUnitPayload payload, int teamId) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery mainQuery = `
      UPDATE
        team
      SET
    `;
    return buildOrganizationUnitUpdateQuery(mainQuery, payload, teamId);
}

# Build query to update a sub team.
#
# + payload - Fields to update in the sub team
# + subTeamId - ID of the sub team to update
# + return - Parameterized UPDATE query for the sub team
isolated function updateSubTeamQuery(UpdateOrgUnitPayload payload, int subTeamId) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery mainQuery = `
      UPDATE
        sub_team
      SET
    `;
    return buildOrganizationUnitUpdateQuery(mainQuery, payload, subTeamId);
}

# Build query to update a unit.
#
# + payload - Fields to update in the unit
# + unitId - ID of the unit to update
# + return - Parameterized UPDATE query for the unit
isolated function updateUnitQuery(UpdateOrgUnitPayload payload, int unitId) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery mainQuery = `
      UPDATE
        unit
      SET
    `;
    return buildOrganizationUnitUpdateQuery(mainQuery, payload, unitId);
}

# Build query to update the functional lead of a business unit-team mapping.
#
# + payload - Fields to update in the business unit-team mapping
# + buId - ID of the business unit
# + teamId - ID of the team
# + return - Parameterized UPDATE query for the business_unit_team mapping
isolated function updateBusinessUnitTeamQuery(UpdateBusinessUnitTeamPayload payload, int buId, int teamId) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery mainQuery = `
      UPDATE
        business_unit_team
      SET
    `;

    sql:ParameterizedQuery subQuery = `
      WHERE business_unit_id = ${buId} AND team_id = ${teamId}
    `;

    sql:ParameterizedQuery[] filters = [];

    if payload.functionalLeadEmail is string {
        filters.push(` head_email = ${payload.functionalLeadEmail}`);
    }

    filters.push(` updated_by = ${payload.updatedBy}`);

    mainQuery = buildSqlUpdateQuery(mainQuery, filters);

    return sql:queryConcat(mainQuery, subQuery);
}

# Build query to update the functional lead of a team-sub team mapping.
#
# + payload - Fields to update in the team-sub team mapping
# + teamId - ID of the team
# + subTeamId - ID of the sub team
# + return - Parameterized UPDATE query for the business_unit_team_sub_team mapping
isolated function updateTeamSubTeamQuery(UpdateTeamSubTeamPayload payload, int teamId, int subTeamId) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery mainQuery = `
      UPDATE
        business_unit_team_sub_team
      SET
    `;

    sql:ParameterizedQuery subQuery = `
      WHERE business_unit_team_id = ${teamId} AND sub_team_id = ${subTeamId}
    `;

    sql:ParameterizedQuery[] filters = [];

    if payload.functionalLeadEmail is string {
        filters.push(` head_email = ${payload.functionalLeadEmail}`);
    }

    filters.push(` updated_by = ${payload.updatedBy}`);

    mainQuery = buildSqlUpdateQuery(mainQuery, filters);

    return sql:queryConcat(mainQuery, subQuery);
}

# Build query to update the functional lead of a sub team-unit mapping.
#
# + payload - Fields to update in the sub team-unit mapping
# + subTeamId - ID of the sub team
# + unitId - ID of the unit
# + return - Parameterized UPDATE query for the business_unit_team_sub_team_unit mapping
isolated function updateSubTeamUnitQuery(UpdateSubTeamUnitPayload payload, int subTeamId, int unitId) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery mainQuery = `
      UPDATE
        business_unit_team_sub_team_unit
      SET
    `;

    sql:ParameterizedQuery subQuery = `
      WHERE business_unit_team_sub_team_id = ${subTeamId} AND unit_id = ${unitId}
    `;

    sql:ParameterizedQuery[] filters = [];

    if payload.functionalLeadEmail is string {
        filters.push(` head_email = ${payload.functionalLeadEmail}`);
    }

    filters.push(` updated_by = ${payload.updatedBy}`);

    mainQuery = buildSqlUpdateQuery(mainQuery, filters);

    return sql:queryConcat(mainQuery, subQuery);
}

# Build query to soft delete a business unit.
#
# + email - Email of the user performing the update
# + buId - ID of the business unit to delete
# + return - Parameterized UPDATE query for soft deletion
isolated function deleteBusinessUnitQuery(string email, int buId) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery query = `
      UPDATE
        business_unit
      SET
        is_active = 0,
        updated_by = ${email},
        updated_on = current_timestamp
      WHERE 
        id = ${buId}
    `;

    return query;
};

# Build query to soft delete a business unit-team mapping.
#
# + email - Email of the user performing the update
# + buId - ID of the business unit
# + teamId - ID of the team
# + return - Parameterized UPDATE query for soft deletion
isolated function deleteBusinessUnitTeamQuery(string email, int buId, int teamId)
    returns sql:ParameterizedQuery {
    sql:ParameterizedQuery query = `
      UPDATE
        business_unit_team
      SET
        is_active = 0,
        updated_by = ${email},
        updated_on = current_timestamp
      WHERE
        business_unit_id = ${buId} AND team_id = ${teamId}
    `;

    return query;
}

# Build query to soft delete a team-sub team mapping.
#
# + email - Email of the user performing the update
# + teamId - ID of the team
# + subTeamId - ID of the sub team
# + return - Parameterized UPDATE query for soft deletion
isolated function deleteTeamSubTeamQuery(string email, int teamId, int subTeamId)
    returns sql:ParameterizedQuery {
    sql:ParameterizedQuery query = `
      UPDATE
        business_unit_team_sub_team
      SET
        is_active = 0,
        updated_by = ${email},
        updated_on = current_timestamp
      WHERE
        business_unit_team_id = ${teamId} AND sub_team_id = ${subTeamId}
    `;

    return query;
}

# Build query to soft delete a sub team-unit mapping.
#
# + email - Email of the user performing the update
# + subTeamId - ID of the sub team
# + unitId - ID of the unit
# + return - Parameterized UPDATE query for soft deletion
isolated function deleteSubTeamUnitQuery(string email, int subTeamId, int unitId)
    returns sql:ParameterizedQuery {
    sql:ParameterizedQuery query = `
      UPDATE
        business_unit_team_sub_team_unit
      SET
        is_active = 0,
        updated_by = ${email},
        updated_on = current_timestamp
      WHERE
        business_unit_team_sub_team_id = ${subTeamId} AND unit_id = ${unitId}
    `;

    return query;
}

# Fetch the organization structure with business units, teams, sub-teams, units,
#
# + return - Query to get the full organization hierarchy
isolated function getOrganizationStructureQuery() returns sql:ParameterizedQuery =>
    `SELECT 
        CAST(c.id AS CHAR) AS id,
        c.name AS name,
        COALESCE((
            SELECT COUNT(*)
            FROM employee e
            INNER JOIN office o ON e.office_id = o.id
            WHERE o.company_id = c.id
        ), 0) AS headCount,
        COALESCE(
            (
                SELECT JSON_ARRAYAGG(JSON_OBJECT(
                    'id', CAST(bu.id AS CHAR),
                    'name', bu.name,
                    'headCount', COALESCE((
                        SELECT COUNT(*) FROM employee e
                        WHERE e.business_unit_id = bu.id
                    ), 0),
                    'head', CASE 
                        WHEN bu_head.work_email IS NOT NULL THEN JSON_OBJECT(
                            'name', CONCAT(bu_head.first_name, ' ', bu_head.last_name),
                            'email', bu_head.work_email,
                            'avatar', bu_head.employee_thumbnail
                        )
                        ELSE CAST('null' AS JSON)
                    END,
                    'teams', COALESCE(
                        (
                            SELECT JSON_ARRAYAGG(JSON_OBJECT(
                                'id', CAST(t.id AS CHAR),
                                'businessUnitTeamId', CAST(bu.id AS CHAR),
                                'name', t.name,
                                'headCount', COALESCE((
                                    SELECT COUNT(*) FROM employee e
                                    WHERE e.team_id = t.id
                                      AND e.business_unit_id = bu.id
                                ), 0),
                                'head', CASE 
                                    WHEN t_head.work_email IS NOT NULL THEN JSON_OBJECT(
                                        'name', CONCAT(t_head.first_name, ' ', t_head.last_name),
                                        'email', t_head.work_email,
                                        'avatar', t_head.employee_thumbnail
                                    )
                                    ELSE CAST('null' AS JSON)
                                END,
                                'functionalLead', CASE 
                                    WHEN t_fl.work_email IS NOT NULL THEN JSON_OBJECT(
                                        'name', CONCAT(t_fl.first_name, ' ', t_fl.last_name),
                                        'email', t_fl.work_email,
                                        'avatar', t_fl.employee_thumbnail
                                    )
                                    ELSE CAST('null' AS JSON)
                                END,
                                'subTeams', COALESCE(
                                    (
                                        SELECT JSON_ARRAYAGG(JSON_OBJECT(
                                            'id', CAST(st.id AS CHAR),
                                            'businessUnitTeamId', CAST(but.id AS CHAR),
                                            'businessUnitId', CAST(bu.id AS CHAR),
                                            'name', st.name,
                                            'headCount', COALESCE((
                                                SELECT COUNT(*) FROM employee e
                                                WHERE e.sub_team_id = st.id
                                                  AND e.team_id = t.id
                                                  AND e.business_unit_id = bu.id
                                            ), 0),
                                            'head', CASE 
                                                WHEN st_head.work_email IS NOT NULL THEN JSON_OBJECT(
                                                    'name', CONCAT(st_head.first_name, ' ', st_head.last_name),
                                                    'email', st_head.work_email,
                                                    'avatar', st_head.employee_thumbnail
                                                )
                                                ELSE CAST('null' AS JSON)
                                            END,
                                            'functionalLead', CASE 
                                                WHEN st_fl.work_email IS NOT NULL THEN JSON_OBJECT(
                                                    'name', CONCAT(st_fl.first_name, ' ', st_fl.last_name),
                                                    'email', st_fl.work_email,
                                                    'avatar', st_fl.employee_thumbnail
                                                )
                                                ELSE CAST('null' AS JSON)
                                            END
                                            ,
                                            'units', COALESCE(
                                                (
                                                    SELECT JSON_ARRAYAGG(JSON_OBJECT(
                                                        'id', CAST(u.id AS CHAR),
                                                        'businessUnitTeamSubTeamId', CAST(butst.id AS CHAR),
                                                        'businessUnitTeamId', CAST(but.id AS CHAR),
                                                        'businessUnitId', CAST(bu.id AS CHAR),
                                                        'name', u.name,
                                                        'headCount', COALESCE((
                                                            SELECT COUNT(*) FROM employee e
                                                            WHERE e.unit_id = u.id
                                                              AND e.sub_team_id = st.id
                                                              AND e.team_id = t.id
                                                              AND e.business_unit_id = bu.id
                                                        ), 0),
                                                        'head', CASE 
                                                            WHEN u_head.work_email IS NOT NULL THEN JSON_OBJECT(
                                                                'name', CONCAT(u_head.first_name, ' ', u_head.last_name),
                                                                'email', u_head.work_email,
                                                                'avatar', u_head.employee_thumbnail
                                                            )
                                                            ELSE CAST('null' AS JSON)
                                                        END,
                                                        'functionalLead', CASE 
                                                            WHEN u_fl.work_email IS NOT NULL THEN JSON_OBJECT(
                                                                'name', CONCAT(u_fl.first_name, ' ', u_fl.last_name),
                                                                'email', u_fl.work_email,
                                                                'avatar', u_fl.employee_thumbnail
                                                            )
                                                            ELSE CAST('null' AS JSON)
                                                        END
                                                    ))
                                                    FROM unit u
                                                    INNER JOIN business_unit_team_sub_team_unit butstu
                                                        ON u.id = butstu.unit_id AND butstu.is_active = 1
                                                    LEFT JOIN employee u_head
                                                        ON u.head_email = u_head.work_email
                                                    LEFT JOIN employee u_fl
                                                        ON butstu.head_email = u_fl.work_email
                                                    WHERE butstu.business_unit_team_sub_team_id = butst.id
                                                ),
                                                JSON_ARRAY()
                                            )
                                        ))
                                        FROM sub_team st
                                        INNER JOIN business_unit_team_sub_team butst
                                            ON st.id = butst.sub_team_id AND butst.is_active = 1
                                        LEFT JOIN employee st_head
                                            ON st.head_email = st_head.work_email
                                        LEFT JOIN employee st_fl
                                            ON butst.head_email = st_fl.work_email
                                        WHERE butst.business_unit_team_id = but.id
                                    ),
                                    JSON_ARRAY()
                                )
                            ))
                            FROM team t
                            INNER JOIN business_unit_team but
                                ON t.id = but.team_id AND but.is_active = 1
                            LEFT JOIN employee t_head
                                ON t.head_email = t_head.work_email
                            LEFT JOIN employee t_fl
                                ON but.head_email = t_fl.work_email
                            WHERE but.business_unit_id = bu.id
                        ),
                        JSON_ARRAY()
                    )
                ))
                FROM 
                    business_unit bu
                    LEFT JOIN employee bu_head ON bu.head_email = bu_head.work_email
                WHERE bu.is_active = 1
            ),
            JSON_ARRAY()
        ) AS businessUnits
    FROM 
        company c
    WHERE
        c.is_active = 1
    LIMIT 1`;

# Build query to insert a new business-unit.
#
# + userEmail - Email of the user performing the action
# + payload - Node details (name and head email)
# + return - Parameterized INSERT query for the new business-unit
isolated function addBusinessUnitQuery(string userEmail, OrgNodeInfo payload) returns sql:ParameterizedQuery => `
  INSERT INTO business_unit(
    name,
    head_email,
    created_by,
    created_on,
    updated_by,
    updated_on
  ) VALUES (
    ${payload.name},
    ${payload.headEmail},
    ${userEmail},
    current_timestamp,
    ${userEmail},
    current_timestamp
  )
`;

# Build query to insert a new team.
#
# + userEmail - Email of the user performing the action
# + payload - Node details (name and head email)
# + return - Parameterized INSERT query for the new team
isolated function addTeamQuery(string userEmail, OrgNodeInfo payload) returns sql:ParameterizedQuery => `
  INSERT INTO team(
    name,
    head_email,
    created_by,
    created_on,
    updated_by,
    updated_on
  ) VALUES (
    ${payload.name},
    ${payload.headEmail},
    ${userEmail},
    current_timestamp,
    ${userEmail},
    current_timestamp
  )
`;

# Build query to insert a new sub team.
#
# + userEmail - Email of the user performing the action
# + payload - Node details (name and head email)
# + return - Parameterized INSERT query for the new sub team
isolated function addSubTeamQuery(string userEmail, OrgNodeInfo payload) returns sql:ParameterizedQuery => `
  INSERT INTO sub_team(
    name,
    head_email,
    created_by,
    created_on,
    updated_by,
    updated_on
  ) VALUES (
    ${payload.name},
    ${payload.headEmail},
    ${userEmail},
    current_timestamp,
    ${userEmail},
    current_timestamp
  )
`;

# Build query to insert a new unit.
#
# + userEmail - Email of the user performing the action
# + payload - Node details (name and head email)
# + return - Parameterized INSERT query for the new unit
isolated function addUnitQuery(string userEmail, OrgNodeInfo payload) returns sql:ParameterizedQuery => `
  INSERT INTO unit(
    name,
    head_email,
    created_by,
    created_on,
    updated_by,
    updated_on
  ) VALUES (
    ${payload.name},
    ${payload.headEmail},
    ${userEmail},
    current_timestamp,
    ${userEmail},
    current_timestamp
  )
`;

# Build query to insert a new business-unit-team mapping.
#
# + userEmail - Email of the user performing the action
# + payload - Business unit ID, team ID, and functional lead email
# + return - Parameterized INSERT query for the new business-unit-team
isolated function addBusinessUnitTeamQuery(string userEmail, CreateBusinessUnitTeamPayload payload) returns sql:ParameterizedQuery => `
  INSERT INTO business_unit_team(
    business_unit_id,
    team_id,
    head_email,
    created_by,
    created_on,
    updated_by,
    updated_on
  ) VALUES (
    ${payload.businessUnitId},
    ${payload.teamId},
    ${payload.functionalLeadEmail},
    ${userEmail},
    current_timestamp,
    ${userEmail},
    current_timestamp
  )
`;

# Build query to insert a new business-unit-team-sub-team mapping.
#
# + userEmail - Email of the user performing the action
# + payload - Business unit-team ID, sub-team ID, and functional lead email
# + return - Parameterized INSERT query for the new business_unit_team_sub_team mapping
isolated function addBusinessUnitTeamSubTeamQuery(string userEmail, CreateBusinessUnitTeamSubTeamPayload payload) returns sql:ParameterizedQuery => `
  INSERT INTO business_unit_team_sub_team(
    business_unit_team_id,
    sub_team_id,
    head_email,
    created_by,
    created_on,
    updated_by,
    updated_on
  ) VALUES (
    ${payload.businessUnitTeamId},
    ${payload.subTeamId},
    ${payload.functionalLeadEmail},
    ${userEmail},
    current_timestamp,
    ${userEmail},
    current_timestamp
  )
`;

# Build query to insert a new business-unit-team-sub-team-unit mapping.
#
# + userEmail - Email of the user performing the action
# + payload - Business unit-team-sub-team ID, unit ID, and functional lead email
# + return - Parameterized INSERT query for the new business_unit_team_sub_team_unit mapping
isolated function addBusinessUnitTeamSubTeamUnitQuery(string userEmail, CreateBusinessUnitTeamSubTeamUnitPayload payload) returns sql:ParameterizedQuery => `
  INSERT INTO business_unit_team_sub_team_unit(
    business_unit_team_sub_team_id,
    unit_id,
    head_email,
    created_by,
    created_on,
    updated_by,
    updated_on
  ) VALUES (
    ${payload.businessUnitTeamSubTeamId},
    ${payload.unitId},
    ${payload.functionalLeadEmail},
    ${userEmail},
    current_timestamp,
    ${userEmail},
    current_timestamp
  )
`;

# Build query to check if a business unit name is unique.
#
# + businessUnitName - Business unit name to check
# + return - Query returning `exists_flag` (1 if exists, else 0)
isolated function validateBusinessUnitNameUniquenessQuery(string businessUnitName) returns sql:ParameterizedQuery => `
    SELECT
      CASE WHEN EXISTS (
        SELECT 1
        FROM business_unit
        WHERE is_active = 1 AND name = ${businessUnitName}
      ) THEN 1 ELSE 0 END AS exists_flag
`;

# Build query to check if a team name is unique.
#
# + teamName - Team name to check
# + return - Query returning `exists_flag` (1 if exists, else 0)
isolated function validateTeamNameUniquenessQuery(string teamName) returns sql:ParameterizedQuery => `
    SELECT
      CASE WHEN EXISTS (
        SELECT 1
        FROM team
        WHERE is_active = 1 AND name = ${teamName}
      ) THEN 1 ELSE 0 END AS exists_flag
`;

# Build query to check if a sub-team name is unique.
#
# + subTeamName - Sub-team name to check
# + return - Query returning `exists_flag` (1 if exists, else 0)
isolated function validateSubTeamNameUniquenessQuery(string subTeamName) returns sql:ParameterizedQuery => `
    SELECT
      CASE WHEN EXISTS (
        SELECT 1
        FROM sub_team
        WHERE is_active = 1 AND name = ${subTeamName}
      ) THEN 1 ELSE 0 END AS exists_flag
`;

# Build query to check if a unit name is unique.
#
# + unitName - Unit name to check
# + return - Query returning `exists_flag` (1 if exists, else 0)
isolated function validateUnitNameUniquenessQuery(string unitName) returns sql:ParameterizedQuery => `
    SELECT
      CASE WHEN EXISTS (
        SELECT 1
        FROM unit
        WHERE is_active = 1 AND name = ${unitName}
      ) THEN 1 ELSE 0 END AS exists_flag
`;

# Build query to check whether a business unit has child teams.
#
# + buId - Business unit ID
# + return - Query returning `exists_flag` (1 if children exist, else 0)
isolated function businessUnitHasChildrenQuery(int buId) returns sql:ParameterizedQuery => `
    SELECT
      CASE WHEN EXISTS (
        SELECT 1
        FROM business_unit_team
        WHERE is_active = 1 AND business_unit_id = ${buId}
      ) THEN 1 ELSE 0 END AS exists_flag
`;

# Build query to check whether a business unit-team mapping has child sub-teams.
#
# + businessUnitId - Business unit ID
# + teamId - Team ID
# + return - Query returning `exists_flag` (1 if children exist, else 0)
isolated function businessUnitTeamHasChildrenQuery(int businessUnitId, int teamId) returns sql:ParameterizedQuery => `
    SELECT
      CASE WHEN EXISTS (
        SELECT 1
        FROM business_unit_team_sub_team butst
        INNER JOIN business_unit_team but
          ON butst.business_unit_team_id = but.id
        WHERE but.business_unit_id = ${businessUnitId}
          AND but.team_id = ${teamId}
          AND but.is_active = 1
          AND butst.is_active = 1
      ) THEN 1 ELSE 0 END AS exists_flag
`;

# Build query to check whether a team-sub-team mapping has child units.
#
# + teamId - Team ID
# + subTeamId - Sub-team ID
# + return - Query returning `exists_flag` (1 if children exist, else 0)
isolated function teamSubTeamHasChildrenQuery(int teamId, int subTeamId) returns sql:ParameterizedQuery => `
    SELECT
      CASE WHEN EXISTS (
        SELECT 1
        FROM business_unit_team_sub_team_unit butstu
        INNER JOIN business_unit_team_sub_team butst
          ON butstu.business_unit_team_sub_team_id = butst.id
        WHERE butst.business_unit_team_id = ${teamId}
          AND butst.sub_team_id = ${subTeamId}
          AND butst.is_active = 1
          AND butstu.is_active = 1
      ) THEN 1 ELSE 0 END AS exists_flag
`;

# Build query to check whether a sub-team unit mapping has assigned employees.
#
# + subTeamMappingId - business_unit_team_sub_team mapping ID
# + unitId - Unit ID
# + return - Query returning `exists_flag` (1 if assigned employees exist, else 0)
isolated function subTeamUnitHasChildrenQuery(int subTeamMappingId, int unitId) returns sql:ParameterizedQuery => `
    SELECT
      CASE WHEN EXISTS (
        SELECT 1
        FROM employee e
        INNER JOIN business_unit_team_sub_team butst
          ON butst.id = ${subTeamMappingId}
        INNER JOIN business_unit_team but
          ON but.id = butst.business_unit_team_id
        WHERE e.unit_id = ${unitId}
          AND e.sub_team_id = butst.sub_team_id
          AND e.team_id = but.team_id
          AND e.business_unit_id = but.business_unit_id
      ) THEN 1 ELSE 0 END AS exists_flag
`;

# Build query to check if a BusinessUnit exists by ID.
#
# + buId - BusinessUnit ID
# + return - Query returning `exists_flag` (1 if exists, else 0)
isolated function businessUnitExistsQuery(int buId) returns sql:ParameterizedQuery => `
    SELECT
      CASE WHEN EXISTS (
        SELECT 1
        FROM business_unit
        WHERE is_active = 1 AND id = ${buId}
      ) THEN 1 ELSE 0 END AS exists_flag
`;

# Build query to check if a Team exists by ID.
#
# + teamId - Team ID
# + return - Query returning `exists_flag` (1 if exists, else 0)
isolated function teamExistsQuery(int teamId) returns sql:ParameterizedQuery => `
    SELECT
      CASE WHEN EXISTS (
        SELECT 1
        FROM team
        WHERE is_active = 1 AND id = ${teamId}
      ) THEN 1 ELSE 0 END AS exists_flag
`;

# Build query to check if a SubTeam exists by ID.
#
# + subTeamId - Sub-team ID
# + return - Query returning `exists_flag` (1 if exists, else 0)
isolated function subTeamExistsQuery(int subTeamId) returns sql:ParameterizedQuery => `
    SELECT
      CASE WHEN EXISTS (
        SELECT 1
        FROM sub_team
        WHERE is_active = 1 AND id = ${subTeamId}
      ) THEN 1 ELSE 0 END AS exists_flag
`;

# Build query to check if a Unit exists by ID.
#
# + unitId - Unit ID
# + return - Query returning `exists_flag` (1 if exists, else 0)
isolated function unitExistsQuery(int unitId) returns sql:ParameterizedQuery => `
    SELECT
      CASE WHEN EXISTS (
        SELECT 1
        FROM unit
        WHERE is_active = 1 AND id = ${unitId}
      ) THEN 1 ELSE 0 END AS exists_flag
`;

# Build query to check if a BusinessUnit-Team mapping exists by ID.
#
# + id - business_unit_team mapping ID
# + return - Query returning `exists_flag` (1 if exists, else 0)
isolated function businessUnitTeamMappingExistsQuery(int id) returns sql:ParameterizedQuery => `
    SELECT
      CASE WHEN EXISTS (
        SELECT 1
        FROM business_unit_team
        WHERE is_active = 1 AND id = ${id}
      ) THEN 1 ELSE 0 END AS exists_flag
`;

# Build query to check if a BusinessUnit-Team-SubTeam mapping exists by ID.
#
# + id - business_unit_team_sub_team mapping ID
# + return - Query returning `exists_flag` (1 if exists, else 0)
isolated function businessUnitTeamSubTeamMappingExistsQuery(int id) returns sql:ParameterizedQuery => `
    SELECT
      CASE WHEN EXISTS (
        SELECT 1
        FROM business_unit_team_sub_team
        WHERE is_active = 1 AND id = ${id}
      ) THEN 1 ELSE 0 END AS exists_flag
`;
# Get parking floors.
#
# + return - Query to get parking floors
isolated function getParkingFloorsQuery() returns sql:ParameterizedQuery =>
    `SELECT
        id,
        name,
        display_order as 'displayOrder',
        coins_per_slot as 'coinsPerSlot'
    FROM parking_floor
    WHERE is_active = 1
    ORDER BY display_order ASC, id ASC`;

# Get parking slots for a floor for a date.
#
# + floorId - Floor id
# + bookingDate - Booking date (YYYY-MM-DD)
# + return - Query to get parking slots with isBooked
isolated function getParkingSlotsByFloorQuery(int floorId, string bookingDate) returns sql:ParameterizedQuery =>
    `SELECT
        ps.slot_id as 'slotId',
        ps.floor_id as 'floorId',
        pf.name as 'floorName',
        pf.coins_per_slot as 'coinsPerSlot',
        CASE WHEN EXISTS (
            SELECT 1 FROM parking_reservation pr
            WHERE pr.slot_id = ps.slot_id
              AND pr.booking_date = ${bookingDate}
              AND pr.status = ${CONFIRMED}
        ) THEN 1 ELSE 0 END as 'isBooked'
    FROM parking_slot ps
    INNER JOIN parking_floor pf ON ps.floor_id = pf.id
    WHERE ps.floor_id = ${floorId}
    ORDER BY ps.slot_id ASC
`;

# Get parking slot by id.
#
# + slotId - Slot id
# + return - Query to get parking slot
isolated function getParkingSlotByIdQuery(string slotId) returns sql:ParameterizedQuery =>
    `SELECT
        ps.slot_id as 'slotId',
        ps.floor_id as 'floorId',
        pf.name as 'floorName',
        pf.coins_per_slot as 'coinsPerSlot',
        0 as 'isBooked'
    FROM parking_slot ps
    INNER JOIN parking_floor pf ON ps.floor_id = pf.id
    WHERE ps.slot_id = ${slotId}`;

# Get confirmed reservation id for slot and date (existence check).
#
# + slotId - Slot id
# + bookingDate - Booking date (YYYY-MM-DD)
# + return - Query to get reservation id if booked
isolated function getConfirmedParkingReservationForSlotDateQuery(string slotId, string bookingDate)
    returns sql:ParameterizedQuery =>
    `SELECT id
    FROM parking_reservation
    WHERE slot_id = ${slotId}
      AND booking_date = ${bookingDate}
      AND status = ${CONFIRMED}
    LIMIT 1`;

# Insert parking reservation (PENDING).
#
# + payload - Reservation payload
# + return - Query to insert parking reservation
isolated function addParkingReservationQuery(AddParkingReservationPayload payload) returns sql:ParameterizedQuery =>
    `
    INSERT INTO parking_reservation
    (
        slot_id, 
        booking_date, 
        employee_email, 
        vehicle_id, 
        status, 
        coins_amount, 
        created_by, 
        updated_by
    )
    VALUES
    (
        ${payload.slotId},
        ${payload.bookingDate}, 
        ${payload.employeeEmail}, 
        ${payload.vehicleId},
        ${PENDING}, 
        ${payload.coinsAmount}, 
        ${payload.createdBy}, 
        ${payload.createdBy}
    );
`;

# Get parking reservation by id.
#
# + reservationId - Reservation id
# + return - Query to get reservation details
isolated function getParkingReservationByIdQuery(int reservationId) returns sql:ParameterizedQuery =>
    `SELECT
        pr.id,
        pr.slot_id as 'slotId',
        pr.booking_date as 'bookingDate',
        pr.employee_email as 'employeeEmail',
        pr.vehicle_id as 'vehicleId',
        v.vehicle_registration_number as 'vehicleRegistrationNumber',
        v.vehicle_type as 'vehicleType',
        pr.status,
        pr.transaction_hash as 'transactionHash',
        pr.coins_amount as 'coinsAmount',
        pf.name as 'floorName',
        DATE_FORMAT(pr.created_on, '%Y-%m-%d %H:%i:%s') AS 'createdOn',
        pr.created_by as 'createdBy',
        DATE_FORMAT(pr.updated_on, '%Y-%m-%d %H:%i:%s') AS 'updatedOn',
        pr.updated_by as 'updatedBy'
    FROM parking_reservation pr
    INNER JOIN parking_slot ps ON pr.slot_id = ps.slot_id
    INNER JOIN parking_floor pf ON ps.floor_id = pf.id
    INNER JOIN vehicle v ON pr.vehicle_id = v.vehicle_id
    WHERE pr.id = ${reservationId}`;

# Get parking reservation id by transaction hash.
#
# + transactionHash - Blockchain transaction hash
# + return - Query to get reservation id if hash is already used
isolated function getParkingReservationByTransactionHashQuery(string transactionHash)
    returns sql:ParameterizedQuery =>
    `SELECT
        id
    FROM parking_reservation
    WHERE transaction_hash = ${transactionHash}
    LIMIT 1`;

# Update parking reservation status and optional transaction_hash.
#
# + payload - Update payload
# + return - Query to update reservation
isolated function updateParkingReservationStatusQuery(UpdateParkingReservationStatusPayload payload)
    returns sql:ParameterizedQuery {

    sql:ParameterizedQuery mainQuery = `UPDATE parking_reservation SET`;

    sql:ParameterizedQuery[] setClauses = [` status = ${payload.status}`, ` updated_by = ${payload.updatedBy}`];

    if payload.transactionHash is string {
        setClauses.push(` transaction_hash = ${payload.transactionHash}`);
    }

    mainQuery = buildSqlUpdateQuery(mainQuery, setClauses);

    return sql:queryConcat(mainQuery, ` WHERE id = ${payload.reservationId}`);
}

# Get parking reservations by employee.
#
# + employeeEmail - Employee email
# + fromDate - From date (optional)
# + toDate - To date (optional)
# + return - Query to get reservations
isolated function getParkingReservationsByEmployeeQuery(string employeeEmail, string? fromDate, string? toDate)
    returns sql:ParameterizedQuery {

    sql:ParameterizedQuery mainQuery = `
    SELECT
        pr.id,
        pr.slot_id as 'slotId',
        pr.booking_date as 'bookingDate',
        pr.employee_email as 'employeeEmail',
        pr.vehicle_id as 'vehicleId',
        v.vehicle_registration_number as 'vehicleRegistrationNumber',
        v.vehicle_type as 'vehicleType',
        pr.status,
        pr.transaction_hash as 'transactionHash',
        pr.coins_amount as 'coinsAmount',
        pf.name as 'floorName',
        DATE_FORMAT(pr.created_on, '%Y-%m-%d %H:%i:%s') AS 'createdOn',
        pr.created_by as 'createdBy',
        DATE_FORMAT(pr.updated_on, '%Y-%m-%d %H:%i:%s') AS 'updatedOn',
        pr.updated_by as 'updatedBy'
    FROM parking_reservation pr
    INNER JOIN parking_slot ps ON pr.slot_id = ps.slot_id
    INNER JOIN parking_floor pf ON ps.floor_id = pf.id
    INNER JOIN vehicle v ON pr.vehicle_id = v.vehicle_id`;

    sql:ParameterizedQuery[] filters = [` pr.employee_email = ${employeeEmail}`];

    if fromDate is string {
        filters.push(` pr.booking_date >= ${fromDate}`);
    }
    if toDate is string {
        filters.push(` pr.booking_date <= ${toDate}`);
    }

    mainQuery = buildSqlSelectQuery(mainQuery, filters);

    return sql:queryConcat(mainQuery, ` ORDER BY pr.booking_date DESC, pr.created_on DESC`);
}
