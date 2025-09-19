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

# Build query to fetch basic userinfo
#
# + email - User's email to uniquely identify an user 
# + return - sql:ParameterizedQuery - fetch basic userinfo
isolated function fetchBasicUserInfoQuery(string email) returns sql:ParameterizedQuery
=> `
    SELECT 
        id as employeeId,
        wso2_email as workEmail,
        first_name as firstName,
        last_name as lastName,
        job_role as jobRole,
        employee_thumbnail as employeeThumbnail
    FROM employee 
    WHERE wso2_email = ${email}
`;

# Build query to retrieve an employee.
#
# + email - Identification of the user
# + return - sql:ParameterizedQuery - Select query for to retrieve an employee information
isolated function getEmployeeInfo(string email) returns sql:ParameterizedQuery =>

    `SELECT
        e.id                                         AS id,
        e.last_name                                  AS lastName,
        e.first_name                                 AS firstName,
        e.work_location                                      AS workLocation,
        e.epf                                        AS epf,
        e.employee_location                          AS employeeLocation,
        e.wso2_email                                 AS wso2Email,
        e.work_phone_number                          AS workPhoneNumber,
        e.start_date                                 AS startDate,
        e.job_role                                   AS jobRole,
        e.manager_email                              AS managerEmail,
        e.report_to_email                            AS reportToEmail,
        e.additional_manager_email                   AS additionalManagerEmail,
        e.additional_report_to_email                 AS additionalReportToEmail,
        e.employee_status                            AS employeeStatus,
        e.length_of_service                          AS lengthOfService,
        e.relocation_status                          AS relocationStatus,
        e.employee_thumbnail                         AS employeeThumbnail,
        e.subordinate_count                          AS subordinateCount,
        e._timestamp                                 AS timestamp,
        e.probation_end_date                         AS probationEndDate,
        e.agreement_end_date                         AS agreementEndDate,
        et.name                                      AS employmentType,
        d.job_band                                   AS jobBand,
        c.name                                       AS company,
        o.name                                       AS office,
        bu.name                                      AS businessUnit,
        t.name                                       AS team,
        st.name                                      AS subTeam,
        u.name                                       AS unit
    FROM employee e
    LEFT JOIN designation          d  ON d.id  = e.designation_id
    LEFT JOIN employment_type      et ON et.id  = e.employment_type_id
    LEFT JOIN office               o  ON o.id   = e.office_id
    LEFT JOIN company              c  ON c.id   = o.company_id
    LEFT JOIN business_unit   bu ON bu.id  = e.business_unit_id
    LEFT JOIN team            t  ON t.id   = e.team_id
    LEFT JOIN sub_team        st ON st.id  = e.sub_team_id
    LEFT JOIN unit            u  ON u.id   = e.unit_id
    WHERE e.wso2_email = ${email}`;

# Retrieve query to fetch org data from the db.
#
# + filter - Criteria to filter the data  
# + limit - Number of records to retrieve
# + offset - Number of records to offset
# + return - List of business units
isolated function getOrgDataQuery(OrgDetailsFilter filter, int 'limit, int offset) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery sqlQuery = `
    SELECT 
        bu.id AS id,
        bu.name AS businessUnit,
        bu.head_email AS headEmail,
        bu.is_active AS isActive,
        (
            SELECT
                JSON_ARRAYAGG(JSON_OBJECT(
                    'id', t.id,
                    'team', t.name,
                    'headEmail', t.head_email,
                    'isActive', t.is_active,
                    'subTeams', (
                        SELECT 
                            JSON_ARRAYAGG(JSON_OBJECT(
                                'id', st.id,
                                'subTeam', st.name,
                                'headEmail', st.head_email,
                                'isActive', st.is_active,
                                'units', (
                                    SELECT
                                        JSON_ARRAYAGG(JSON_OBJECT(
                                            'id', u.id,
                                            'unit', u.name,
                                            'headEmail', u.head_email,
                                            'isActive', u.is_active
                                        ))
                                    FROM
                                        unit u
                                        RIGHT JOIN
                                        (SELECT * FROM business_unit_team_sub_team_unit WHERE is_active = 1) butstu
                                        ON u.id = butstu.unit_id
                                    WHERE butstu.business_unit_team_sub_team_id = butst.id
                                )
                            ))
                        FROM 
                            sub_team st
                            RIGHT JOIN
                            (SELECT * FROM business_unit_team_sub_team WHERE is_active = 1) butst
                            ON st.id = butst.sub_team_id
                        WHERE butst.business_unit_team_id = but.id
                    )
                ))
            FROM 
                team t
                RIGHT JOIN
                (SELECT * FROM business_unit_team WHERE is_active = 1) but
                ON t.id = but.team_id
            WHERE but.business_unit_id = bu.id
        ) AS teams
    FROM 
        business_unit bu
    WHERE
        bu.id IN (SELECT distinct(business_unit_id) FROM business_unit_team WHERE is_active = 1)
    `;

    OrgDetailsFilter {
        businessUnitIds,
        businessUnits
    } = filter;

    sql:ParameterizedQuery[] filterQueries = [];

    if businessUnitIds is int[] && businessUnitIds.length() > 0 {
        filterQueries.push(sql:queryConcat(
                `bu.id IN `,
                `(`,
                sql:arrayFlattenQuery(businessUnitIds),
                `)`)
        );
    }

    if businessUnits is string[] && businessUnits.length() > 0 {
        filterQueries.push(sql:queryConcat(
                `bu.name IN `,
                `(`,
                sql:arrayFlattenQuery(businessUnits),
                `)`)
        );
    }

    sqlQuery = buildSqlQuery(sqlQuery, filterQueries);

    sqlQuery = sql:queryConcat(sqlQuery, ` LIMIT ${'limit} OFFSET ${offset}`);

    return sqlQuery;
}

# Query to update employee info in the database.
#
# + email - User's wso2 email 
# + employee - Employee payload that includes changed user information
# + return - Update query to update employee info
isolated function updateEmployeeQuery(string email, UpdatedEmployeeInfo employee) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery query = `
        UPDATE employee SET
    `;
    sql:ParameterizedQuery[] setClauses = [];

    if employee.firstName is string {
        setClauses.push(`first_name = ${employee.firstName}`);
    }

    if employee.lastName is string {
        setClauses.push(`last_name = ${employee.lastName} `);
    }

    if employee.workPhoneNumber is string {
        setClauses.push(`work_phone_number = ${employee.workPhoneNumber}`);
    }

    if employee.employeeLocation is string {
        setClauses.push(`employee_location = ${employee.employeeLocation}`);
    }

    if employee.startDate is time:Date {
        setClauses.push(`start_date = ${employee.startDate}`);
    }

    if employee.jobRole is string {
        setClauses.push(`job_role = ${employee.jobRole}`);
    }

    if employee.jobBand is string {
        setClauses.push(`job_band = ${employee.jobBand}`);
    }

    if employee.managerEmail is string {
        setClauses.push(`manager_email = ${employee.managerEmail}`);
    }

    if employee.reportToEmail is string {
        setClauses.push(`report_to_email = ${employee.reportToEmail}`);
    }

    if employee.additionalManagerEmail is string {
        setClauses.push(`additional_manager_email = ${employee.additionalManagerEmail}`);
    }
    if employee.additionalReportToEmail is string {
        setClauses.push(`additional_report_to_email = ${employee.additionalReportToEmail}`);
    }
    if employee.lengthOfService is int {
        setClauses.push(`length_of_service = ${employee.lengthOfService}`);
    }
    if employee.relocationStatus is string {
        setClauses.push(`relocation_status = ${employee.relocationStatus}`);
    }
    if employee.employeeThumbnail is string {
        setClauses.push(`employee_thumbnail = ${employee.employeeThumbnail}`);
    }
    if employee.subordinateCount is int {
        setClauses.push(`subordinate_count = ${employee.subordinateCount}`);
    }
    if employee.probationEndDate is time:Date {
        setClauses.push(`probation_end_date = ${employee.probationEndDate}`);
    }

    if employee.agreementEndDate is time:Date {
        setClauses.push(`agreement_end_date = ${employee.agreementEndDate}`);
    }

    if employee.timestamp is time:Utc {
        setClauses.push(`_timestamp = ${employee.timestamp}`);
    } else {
        setClauses.push(`_timestamp = CURRENT_TIMESTAMP`);
    }

    // Build query
    if setClauses.length() > 0 {
        sql:ParameterizedQuery joinedClauses = joinQuery(setClauses, `, `);
        query = sql:queryConcat(query, joinedClauses);
    }
    query = sql:queryConcat(query, ` WHERE id = ${employee.id}`);

    return query;
}

# Retrieves a parameterized SQL query to fetch company information.
#
# + return - A parameterized query that returns a json object that contains json object arrays
isolated function fetchAppConfigQuery() returns sql:ParameterizedQuery {
    sql:ParameterizedQuery query = `
    
        SELECT JSON_OBJECT(
            'companies',
                (SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT(
                    'id', id,
                    'name', name,
                    'location', location
                )), JSON_ARRAY()) FROM company WHERE is_active = 1),

            'offices',
                (SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT(
                    'id', id,
                    'office', name,          -- maps to Office.office
                    'location', location     -- include if your schema has it
                )), JSON_ARRAY()) FROM office WHERE is_active = 1),

            'designations',
                (SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT(
                    'id', id,
                    'name', designation,         -- maps to Designation.name
                    'jobBand', job_band,         -- camelCase
                    'careerFunctionId', career_function_id
                )), JSON_ARRAY()) FROM designation WHERE is_active = 1),

            'careerFunctions',
                (SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT(
                    'id', id,
                    'name', career_function
                )), JSON_ARRAY()) FROM career_function WHERE is_active = 1),

            'employmentTypes',
                (SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT(
                    'id', id,
                    'name', name
                )), JSON_ARRAY()) FROM employment_type WHERE is_active = 1)
        ) AS result;
    `;

    return query;
}

# Retrieves a parameterized SQL query to fetch all companies as a JSON array.
#
# + return - A parameterized query that returns a JSON array of company objects
isolated function getCompaniesQuery() returns sql:ParameterizedQuery {
    sql:ParameterizedQuery sqlQuery = `
        SELECT JSON_ARRAYAGG(
                JSON_OBJECT('id', id, 'name', name, 'location', location)
            ) AS result
        FROM company
        WHERE id IS NOT NULL;
    `;

    return sqlQuery;
}

# Retrieves a parameterized SQL query to fetch all offices as a JSON array.
#
# + return - A parameterized query that returns a JSON array of office objects
isolated function getOfficesQuery() returns sql:ParameterizedQuery {
    sql:ParameterizedQuery sqlQuery = `
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
            'id', id, 'name', name
            )
        ) as result
        FROM office 
        WHERE id IS NOT NULL;
    `;

    return sqlQuery;
}

# Retrieves a parameterized SQL query to fetch all career functions as a JSON array.
#
# + return - A parameterized query that returns a JSON array of career function objects
isolated function getCareerFunctionQuery() returns sql:ParameterizedQuery {
    sql:ParameterizedQuery sqlQuery = `
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', id, 'name', career_function
            )
        ) as result
        FROM career_function WHERE id IS NOT NULL;
    `;

    return sqlQuery;
}

# Retrieves a parameterized SQL query to fetch all designations as a JSON array.
#
# + return - A parameterized query that returns a JSON array of designation objects
isolated function getDesignationQuery() returns sql:ParameterizedQuery {
    sql:ParameterizedQuery sqlQuery = `
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', id, 'name', designation, 'job_band', job_band, 'career_function_id', career_function_id
            )
        ) as result
        FROM designation WHERE id IS NOT NULL
    `;

    return sqlQuery;
}

# Retrieves a parameterized SQL query to fetch active employment types as a JSON array.
#
# + return - A parameterized query that returns a JSON array of active employment type objects.
isolated function getEmploymentTypeQuery() returns sql:ParameterizedQuery {
    sql:ParameterizedQuery sqlQuery = `
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', id, 'name', name
            )
        ) as result
        FROM employment_type
        WHERE id IS NOT NULL 
        AND is_active = 1;
    `;

    return sqlQuery;
}

