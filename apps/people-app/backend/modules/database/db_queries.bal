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
        first_name,
        last_name,
        work_email,
        employee_thumbnail
    FROM employee;`;

# Fetch employee detailed information.
#
# + id - Employee ID
# + return - Query to get employee detailed information
isolated function getEmployeeInfoQuery(string id) returns sql:ParameterizedQuery =>
    `SELECT 
        e.id AS employeeId,
        e.first_name AS firstName,
        e.last_name AS lastName,
        e.work_email AS workEmail,
        e.employee_thumbnail AS employeeThumbnail,
        e.epf AS epf,
        c.location AS employmentLocation,
        e.work_location AS workLocation,
        e.work_phone_number AS workPhoneNumber,
        e.start_date AS startDate,
        e.manager_email AS managerEmail,
        e.additional_manager_emails AS additionalManagerEmails,
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
        u.name AS unit
    FROM
        employee e
        INNER JOIN employment_type et ON e.employment_type_id = et.id
        INNER JOIN designation d ON e.designation_id = d.id
        INNER JOIN office o ON e.office_id = o.id
        INNER JOIN company c ON c.id = o.company_id
        INNER JOIN team t ON e.team_id = t.id
        INNER JOIN sub_team st ON e.sub_team_id = st.id
        INNER JOIN business_unit bu ON e.business_unit_id = bu.id
        INNER JOIN unit u ON e.unit_id = u.id
    WHERE
        e.id = ${id};`;

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
        e.additional_manager_emails AS additionalManagerEmails,
        d.designation AS designation,
        e.secondary_job_title AS secondaryJobTitle,
        o.name AS office,
        bu.name AS businessUnit,
        t.name AS team,
        st.name AS subTeam,
        u.name AS unit
    FROM
        employee e
        INNER JOIN designation d ON e.designation_id = d.id
        INNER JOIN office o ON e.office_id = o.id
        INNER JOIN company c ON c.id = o.company_id
        INNER JOIN team t ON e.team_id = t.id
        INNER JOIN business_unit bu ON e.business_unit_id = bu.id
        LEFT JOIN sub_team st ON e.sub_team_id = st.id
        LEFT JOIN unit u ON e.unit_id = u.id
    WHERE
        e.work_email = ${workEmail};`;

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
            full_name,
            name_with_initials,
            p.first_name AS firstName,
            p.last_name AS lastName,
            title,
            dob,
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
# + id - Employee ID
# + return - Query to get employee personal information
isolated function getEmployeePersonalInfoQuery(string id) returns sql:ParameterizedQuery =>
    `SELECT 
        p.id AS id,
        nic_or_passport,
        full_name,
        name_with_initials,
        p.first_name AS firstName,
        p.last_name AS lastName,
        title,
        dob,
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
        emergency_contacts
    FROM personal_info p
    INNER JOIN employee e ON p.id = e.personal_info_id
        WHERE e.id = ${id};`;

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
            team t
        LEFT JOIN 
            business_unit_team but ON but.team_id = t.id`;

    if buId is int {
        query = sql:queryConcat(query, ` WHERE but.business_unit_id = ${buId}`);
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
            sub_team st
        LEFT JOIN business_unit_team_sub_team butst ON butst.sub_team_id = st.id`;
    if teamId is int {
        query = sql:queryConcat(query, ` WHERE butst.business_unit_team_id = ${teamId}`);
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
            unit u
        LEFT JOIN business_unit_team_sub_team_unit butstu ON butstu.unit_id = u.id`;
    if subTeamId is int {
        query = sql:queryConcat(query, ` WHERE butstu.business_unit_team_sub_team_id = ${subTeamId}`);
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
            full_name,
            name_with_initials,
            first_name,
            last_name,
            title,
            dob,
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
            emergency_contacts,
            created_by,
            updated_by
        )
    VALUES
        (
            ${payload.nicOrPassport},
            ${payload.fullName},
            ${payload.nameWithInitials},
            ${payload.firstName},
            ${payload.lastName},
            ${payload.title},
            ${payload.dob},
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
            ${payload.emergencyContacts.toJsonString()},
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
            work_phone_number,
            start_date,
            secondary_job_title,
            manager_email,
            additional_manager_emails,
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
            ${payload.workPhoneNumber},
            ${payload.startDate},
            ${payload.secondaryJobTitle},
            ${payload.managerEmail},
            ${string:'join(", ", ...payload.additionalManagerEmails)},
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
# + return - Personal info update query
isolated function updateEmployeePersonalInfoQuery(int id, UpdateEmployeePersonalInfoPayload payload)
    returns sql:ParameterizedQuery =>
    `UPDATE
        personal_info
     SET
        personal_email = ${payload.personalEmail},
        personal_phone = ${payload.personalPhone},
        resident_number = ${payload.residentNumber},
        address_line_1 = ${payload.addressLine1},
        address_line_2 = ${payload.addressLine2},
        city = ${payload.city},
        state_or_province = ${payload.stateOrProvince},
        postal_code = ${payload.postalCode},
        country = ${payload.country},
        emergency_contacts = ${payload.emergencyContacts.toJsonString()}
     WHERE
        id = ${id};`;

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

# Build query to update a business unit.
#
# + payload - Fields to update in the business unit
# + buId - ID of the business unit to update
# + return - Parameterized UPDATE query for the business unit
isolated function updateBusinessUnitQuery(UpdateUnitPayload payload, int buId) returns sql:ParameterizedQuery {
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
isolated function updateTeamQuery(UpdateUnitPayload payload, int teamId) returns sql:ParameterizedQuery {
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
isolated function updateSubTeamQuery(UpdateUnitPayload payload, int subTeamId) returns sql:ParameterizedQuery {
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
isolated function updateUnitQuery(UpdateUnitPayload payload, int unitId) returns sql:ParameterizedQuery {
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
                                'mappingId', CAST(but.id AS CHAR),
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
                                            'mappingId', CAST(butst.id AS CHAR),
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
                                                        'mappingId', CAST(butstu.id AS CHAR),
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

# Build query to insert a new business-unit-team.
#
# + userEmail - Email of the user performing the action
# + payload - Mapping payload
# + return - Parameterized INSERT query for the new business-unit-team
isolated function addBusinessUnitTeamQuery(string userEmail, OrgNodeMappingPayload payload) returns sql:ParameterizedQuery => `
  INSERT INTO business_unit_team(
    business_unit_id,
    team_id,
    head_email,
    created_by,
    created_on,
    updated_by,
    updated_on
  ) VALUES (
    ${payload.parentId},
    ${payload.childId},
    ${payload.functionalLeadEmail},
    ${userEmail},
    current_timestamp,
    ${userEmail},
    current_timestamp
  )
`;

# Build query to insert a new sub team into a business unit-team mapping.
#
# + userEmail - Email of the user performing the action
# + payload - Mapping payload
# + return - Parameterized INSERT query for the new business_unit_team_sub_team mapping
isolated function addBusinessUnitTeamSubTeamQuery(string userEmail, OrgNodeMappingPayload payload) returns sql:ParameterizedQuery => `
  INSERT INTO business_unit_team_sub_team(
    business_unit_team_id,
    sub_team_id,
    head_email,
    created_by,
    created_on,
    updated_by,
    updated_on
  ) VALUES (
    ${payload.parentId},
    ${payload.childId},
    ${payload.functionalLeadEmail},
    ${userEmail},
    current_timestamp,
    ${userEmail},
    current_timestamp
  )
`;

# Build query to insert a new unit into a business unit-team-sub team mapping.
#
# + userEmail - Email of the user performing the action
# + payload - Mapping payload
# + return - Parameterized INSERT query for the new business_unit_team_sub_team_unit mapping
isolated function addBusinessUnitTeamSubTeamUnitQuery(string userEmail, OrgNodeMappingPayload payload) returns sql:ParameterizedQuery => `
  INSERT INTO business_unit_team_sub_team_unit(
    business_unit_team_sub_team_id,
    unit_id,
    head_email,
    created_by,
    created_on,
    updated_by,
    updated_on
  ) VALUES (
    ${payload.parentId},
    ${payload.childId},
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
