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

