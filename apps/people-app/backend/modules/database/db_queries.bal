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

# Get parking floors.
#
# + return - Query to get parking floors
isolated function getParkingFloorsQuery() returns sql:ParameterizedQuery =>
    `SELECT
        id,
        name,
        display_order as 'displayOrder',
        coins_per_slot as 'coinsPerSlot',
        is_active as 'isActive'
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
              AND pr.status = 'CONFIRMED'
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
      AND status = 'CONFIRMED'
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
        'PENDING', 
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

# Update parking reservation status and optional transaction_hash.
#
# + reservationId - Reservation id
# + status - New status
# + transactionHash - Transaction hash (optional)
# + updatedBy - Updated by
# + return - Query to update reservation
isolated function updateParkingReservationStatusQuery(int reservationId, ParkingReservationStatus status,
        string? transactionHash, string updatedBy) returns sql:ParameterizedQuery {

    sql:ParameterizedQuery mainQuery = `UPDATE parking_reservation SET`;

    sql:ParameterizedQuery[] setClauses = [` status = ${status}`, ` updated_by = ${updatedBy}`];

    if transactionHash is string {
        setClauses.push(` transaction_hash = ${transactionHash}`);
    }

    mainQuery = buildSqlUpdateQuery(mainQuery, setClauses);

    return sql:queryConcat(mainQuery, ` WHERE id = ${reservationId}`);
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
