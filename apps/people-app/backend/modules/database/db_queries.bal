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
        employee_thumbnail,
        job_role
    FROM employee
    WHERE work_email = ${email};`;

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
        e.job_role AS jobRole,
        e.epf AS epf,
        e.employee_location AS employeeLocation,
        e.work_location AS workLocation,
        e.work_phone_number AS workPhoneNumber,
        e.start_date AS startDate,
        e.manager_email AS managerEmail,
        e.report_to_email AS reportToEmail,
        e.additional_manager_email AS additionalManagerEmail,
        e.additional_report_to_email AS additionalReportToEmail,
        e.employee_status AS employeeStatus,
        e.length_of_service AS lengthOfService,
        e.relocation_status AS relocationStatus,
        e.subordinate_count AS subordinateCount,
        e.probation_end_date AS probationEndDate,
        e.agreement_end_date AS agreementEndDate,
        et.name AS employmentType,
        d.designation AS designation,
        o.name AS office,
        t.name AS team,
        st.name AS subTeam,
        bu.name AS businessUnit
    FROM
        employee e
        INNER JOIN employment_type et ON e.employment_type_id = et.id
        INNER JOIN designation d ON e.designation_id = d.id
        INNER JOIN office o ON e.office_id = o.id
        INNER JOIN team t ON e.team_id = t.id
        INNER JOIN sub_team st ON e.sub_team_id = st.id
        INNER JOIN business_unit bu ON e.business_unit_id = bu.id
    WHERE
        e.id = ${id};`;

# Fetch employee personal information.
#
# + id - Employee ID
# + return - Query to get employee personal information
isolated function getEmployeePersonalInfoQuery(string id) returns sql:ParameterizedQuery =>
    `SELECT 
        p.id AS id,
        nic,
        full_name,
        name_with_initials,
        p.first_name AS firstName,
        p.last_name AS lastName,
        title,
        dob,
        age,
        personal_email,
        personal_phone,
        home_phone,
        address,
        postal_code,
        country,
        nationality
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
# + return - Teams query
isolated function getTeamsQuery() returns sql:ParameterizedQuery =>
    `SELECT 
         id,
         name
     FROM team;`;

# Get sub teams query.
# + return - sub teams query
isolated function getSubTeamsQuery() returns sql:ParameterizedQuery =>
    `SELECT 
         id,
         name
     FROM sub_team;`;

# Get units query.
# + return - Units query
isolated function getUnitsQuery() returns sql:ParameterizedQuery =>
    `SELECT 
         id,
         name
     FROM unit;`;

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
        home_phone = ${payload.homePhone},
        address = ${payload.address},
        postal_code = ${payload.postalCode},
        country = ${payload.country}
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
