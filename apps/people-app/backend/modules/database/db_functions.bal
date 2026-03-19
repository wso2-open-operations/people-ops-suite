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
# + return - Employee basic information
public isolated function getEmployeeBasicInfo(string email) returns EmployeeBasicInfo|error? {
    EmployeeBasicInfo|error employeeBasicInfo = databaseClient->queryRow(getEmployeeBasicInfoQuery(email));
    return employeeBasicInfo is sql:NoRowsError ? () : employeeBasicInfo;
}

# Fetch all employees' basic information.
#
# + return - All employees' basic information
public isolated function getAllEmployeesBasicInfo() returns EmployeeBasicInfo[]|error {
    stream<EmployeeBasicInfo, error?> employeeBasicInfoStream = databaseClient->query(getAllEmployeesBasicInfoQuery());
    return from EmployeeBasicInfo employeesBasicInfo in employeeBasicInfoStream
        select employeesBasicInfo;
}

# Get employee ID by EPF.
#
# + epf - Employee Provident Fund number
# + return - Employee ID string, nil if not found, or error
public isolated function getEmployeeIdByEpf(string epf) returns string|error? {
    string|error result = databaseClient->queryRow(getEmployeeIdByEpfQuery(epf));
    return result is sql:NoRowsError ? () : result;
}

# Fetch employee detailed information.
#
# + employeeId - Employee ID
# + return - Employee detailed information
public isolated function getEmployeeInfo(string employeeId) returns Employee|error? {
    Employee|error employeeInfo = databaseClient->queryRow(getEmployeeInfoQuery(employeeId));
    return employeeInfo is sql:NoRowsError ? () : employeeInfo;
}

# Fetch employees with filters.
#
# + payload - Get employees filter payload
# + leadEmail - If provided, restricts results to subordinates of this lead
# + return - List of employees or error
public isolated function getEmployees(EmployeeSearchPayload payload, string? leadEmail = ()) returns EmployeesResponse|error {
    stream<EmployeeRecord, error?> resultStream = databaseClient->query(getEmployeesQuery(payload, leadEmail));

    int totalCount = 0;
    Employee[] employees = [];

    check from EmployeeRecord employeeRecord in resultStream
        do {
            EmployeeRecord {totalCount: count, ...employeeData} = employeeRecord;
            totalCount = count;
            employees.push(employeeData);
        };

    return {employees, totalCount};
}

# Fetch continuous service record by work email.
#
# + workEmail - Work email of the employee
# + return - Continuous service record information or error
public isolated function getContinuousServiceRecordsByEmail(string workEmail)
    returns ContinuousServiceRecordInfo[]|error {

    stream<ContinuousServiceRecordInfo, sql:Error?> recordStream = databaseClient->query(
        getContinuousServiceRecordQuery(workEmail)
    );
    return from ContinuousServiceRecordInfo serviceRecord in recordStream
        select serviceRecord;
}

# Search employee personal information.
#
# + payload - Search employee personal information payload
# + return - Employee personal information search results
public isolated function searchEmployeePersonalInfo(SearchEmployeePersonalInfoPayload payload)
    returns EmployeePersonalInfo[]|error {

    stream<EmployeePersonalInfo, error?> employeePersonalInfoStream = databaseClient->query(
            searchEmployeePersonalInfoQuery(payload));
    return from EmployeePersonalInfo employeePersonalInfo in employeePersonalInfoStream
        select employeePersonalInfo;
}

# Fetch employee personal information.
#
# + employeeId - Employee ID
# + return - Employee personal information
public isolated function getEmployeePersonalInfo(string employeeId) returns EmployeePersonalInfo|error? {
    EmployeePersonalInfo|error employeePersonalInfo = databaseClient->queryRow(getEmployeePersonalInfoQuery(employeeId));

    if employeePersonalInfo is sql:NoRowsError {
        return ();
    }
    if employeePersonalInfo is error {
        return employeePersonalInfo;
    }

    stream<EmergencyContact, error?> contactsStream =
        databaseClient->query(getEmergencyContactsByEmployeeIdQuery(employeeId));

    employeePersonalInfo.emergencyContacts = check from EmergencyContact contact in contactsStream
        select contact;
    return employeePersonalInfo;
}

# Get business units.
#
# + return - Business units
public isolated function getBusinessUnits() returns BusinessUnit[]|error {
    stream<BusinessUnit, error?> businessUnitStream = databaseClient->query(getBusinessUnitsQuery());
    return from BusinessUnit businessUnit in businessUnitStream
        select businessUnit;
}

# Get teams.
#
# + buId - Business unit ID (optional)
# + return - Teams
public isolated function getTeams(int? buId = ()) returns Team[]|error {
    stream<Team, error?> teamStream = databaseClient->query(getTeamsQuery(buId));
    return from Team team in teamStream
        select team;
}

# Get sub teams.
#
# + teamId - Team ID (optional)
# + return - Sub teams
public isolated function getSubTeams(int? teamId = ()) returns SubTeam[]|error {
    stream<SubTeam, error?> subTeamStream = databaseClient->query(getSubTeamsQuery(teamId));
    return from SubTeam subTeam in subTeamStream
        select subTeam;
}

# Get units.
#
# + subTeamId - Sub team ID (optional)
# + return - Units
public isolated function getUnits(int? subTeamId = ()) returns Unit[]|error {
    stream<Unit, error?> unitStream = databaseClient->query(getUnitsQuery(subTeamId));
    return from Unit unit in unitStream
        select unit;
}

# Fetch organization structure with business units, teams, sub-teams and units.
#
# + return - Organization structure data or error
public isolated function getFullOrganizationStructure() returns OrgStructureBusinessUnit[]|error {
    stream<OrgStructureBusinessUnitRow, sql:Error?> orgStructureStream =
        databaseClient->query(getFullOrganizationStructureQuery());

    return from OrgStructureBusinessUnitRow row in orgStructureStream
        select {
            id: row.id,
            name: row.name,
            teams: check row.teams.fromJsonWithType()
        };
}

# Get career functions.
#
# + return - Career functions
public isolated function getCareerFunctions() returns CareerFunction[]|error {
    stream<CareerFunction, error?> careerFunctionStream = databaseClient->query(getCareerFunctionsQuery());
    return from CareerFunction careerFunction in careerFunctionStream
        select careerFunction;
}

# Get designations.
#
# + careerFunctionId - Career function ID (optional)
# + return - Designations
public isolated function getDesignations(int? careerFunctionId = ()) returns Designation[]|error {
    stream<Designation, error?> designationStream = databaseClient->query(getDesignationsQuery(careerFunctionId));
    return from Designation designation in designationStream
        select designation;
}

# Get companies.
#
# + return - Companies
public isolated function getCompanies() returns Company[]|error {
    stream<Company, error?> companyStream = databaseClient->query(getCompaniesQuery());
    return from Company company in companyStream
        select company;
}

# Get offices.
#
# + companyId - Company ID (optional)
# + return - Offices
public isolated function getOffices(int? companyId = ()) returns Office[]|error {
    stream<Office, error?> officeStream = databaseClient->query(getOfficesQuery(companyId));
    return from Office office in officeStream
        select office;
}

# Get employment types.
#
# + return - Employment types
public isolated function getEmploymentTypes() returns EmploymentType[]|error {
    stream<EmploymentType, error?> employmentTypeStream = databaseClient->query(getEmploymentTypesQuery());
    return from EmploymentType employmentType in employmentTypeStream
        select employmentType;
}

# Get managers.
#
# + return - Managers
public isolated function getManagers() returns Manager[]|error {
    stream<Manager, error?> managerStream = databaseClient->query(getManagersQuery());
    return from Manager manager in managerStream
        select manager;
}

# Check if a target employee is a direct or additional subordinate of a lead.
#
# + leadEmail - Work email of the potential lead
# + employeeId - Employee ID of the target employee
# + return - True if the employee is a subordinate, false if not, or error
public isolated function isSubordinateOfLead(string leadEmail, string employeeId) returns boolean|error {
    int|error result = databaseClient->queryRow(isSubordinateOfLeadQuery(leadEmail, employeeId));
    if result is sql:NoRowsError {
        return false;
    }
    if result is error {
        return result;
    }
    return true;
}

# Check if an employee is a lead (manages at least one employee).
#
# + leadEmail - Work email of the employee
# + return - True if the employee is a lead, false if not, or error
public isolated function isLead(string leadEmail) returns boolean|error {
    int|error result = databaseClient->queryRow(isLeadQuery(leadEmail));
    if result is sql:NoRowsError {
        return false;
    }
    if result is error {
        return result;
    }
    return true;
}

# Add new employee.
#
# + payload - Add employee payload
# + createdBy - Creator of the employee record
# + employeeId - Pre-resolved employee ID string
# + return - Created employee record ID or error
public isolated function addEmployee(CreateEmployeePayload payload, string createdBy, string employeeId)
        returns int|error {
    int lastInsertedId = 0;

    retry transaction {
        int personalInfoId = check addPersonalInfo(payload.personalInfo, createdBy);
        lastInsertedId = check addEmployeeRecord(payload, createdBy, personalInfoId, employeeId);
        check addEmergencyContacts(employeeId, payload.personalInfo.emergencyContacts ?: [], createdBy);
        check addAdditionalManagers(lastInsertedId, payload.additionalManagerEmails, createdBy);
        check commit;
    }
    return lastInsertedId;
}

# Fetch employee ID generation context.
#
# + companyId - Company ID of the new employee
# + employmentTypeId - Employment type ID of the new employee
# + return - EmployeeIdContext or error
public isolated function getEmployeeIdContext(int companyId, int employmentTypeId)
        returns EmployeeIdContext|error {
    return databaseClient->queryRow(getEmployeeIdContextQuery(companyId, employmentTypeId));
}

# Fetch and lock the last numeric suffix for the given prefix and employment types.
#
# + prefix - The ID prefix to lock on (company prefix or consultancy prefix)
# + employmentTypes - Employment type names that share this sequence
# + return - EmployeeIdSequence or error
public isolated function getLastEmployeeNumericSuffix(string prefix, EmploymentTypeName[] employmentTypes)
        returns EmployeeIdSequence|error {
    return databaseClient->queryRow(getAndLockLastEmployeeNumericSuffixQuery(prefix, employmentTypes));
}

# Add employee personal information.
#
# + personalInfo - Personal information of the employee
# + createdBy - Creator of the personal info record
# + return - Created personal info ID or error
isolated function addPersonalInfo(CreatePersonalInfoPayload personalInfo, string createdBy) returns int|error {
    sql:ExecutionResult result = check databaseClient->execute(addEmployeePersonalInfoQuery(personalInfo, createdBy));
    return check result.lastInsertId.ensureType(int);
}

# Add employee record.
#
# + payload - Add employee payload
# + createdBy - Creator of the employee record
# + personalInfoId - Personal info ID to be linked with the employee record
# + employeeId - Employee ID to be used in the employee record
# + return - Created employee ID or error
isolated function addEmployeeRecord(CreateEmployeePayload payload, string createdBy, int personalInfoId, string employeeId)
    returns int|error {
    sql:ExecutionResult result = check databaseClient->execute(addEmployeeQuery(payload, createdBy, personalInfoId, employeeId));
    return check result.lastInsertId.ensureType(int);
}

# Get the generated employee ID based on the last inserted employee record ID.
#
# + lastInsertedEmployeeId - Last inserted employee record ID
# + return - Generated employee ID or error
isolated function getGeneratedEmployeeId(int lastInsertedEmployeeId) returns string|error {
    return check databaseClient->queryRow(getEmployeeIdQuery(lastInsertedEmployeeId));
}

# Add emergency contacts for the employee.
#
# + employeeId - Employee ID
# + contacts - Emergency contacts to be added
# + createdBy - Creator of the emergency contact records
# + return - Nil if the operation was successful or error
isolated function addEmergencyContacts(string employeeId, EmergencyContact[] contacts, string createdBy)
    returns error? {
    sql:ParameterizedQuery[] emergencyInsertQueries =
        from EmergencyContact contact in contacts
    select addPersonalInfoEmergencyContactQuery(employeeId, contact, createdBy);

    if emergencyInsertQueries.length() > 0 {
        _ = check databaseClient->batchExecute(emergencyInsertQueries);
    }
    return;
}

# Add additional managers for the employee.
#
# + employeeId - Employee ID
# + additionalManagerEmails - List of additional manager email addresses to be added
# + createdBy - Creator of the additional manager records
# + return - Nil if the operation was successful or error
isolated function addAdditionalManagers(int employeeId, Email[] additionalManagerEmails, string createdBy)
    returns error? {
    sql:ParameterizedQuery[] managerInsertQueries =
        from Email managerEmail in additionalManagerEmails
    select addEmployeeAdditionalManagerQuery(employeeId, managerEmail, createdBy);

    if managerInsertQueries.length() > 0 {
        _ = check databaseClient->batchExecute(managerInsertQueries);
    }
    return;
}

# Update employee personal information.
#
# + employeeId - Employee ID
# + payload - Personal info update payload
# + updatedBy - Updater of the personal info record
# + return - Nil if the update was successful or error
public isolated function updateEmployeePersonalInfo(string employeeId, UpdateEmployeePersonalInfoPayload payload,
        string updatedBy)
    returns error? {

    transaction {
        sql:ExecutionResult executionResult = check databaseClient->execute(updateEmployeePersonalInfoQuery(employeeId,
                payload, updatedBy));

        check checkAffectedCount(executionResult.affectedRowCount);

        EmergencyContact[]? contactsOpt = payload.emergencyContacts;
        if contactsOpt is EmergencyContact[] {

            _ = check databaseClient->execute(deleteEmergencyContactsByEmployeeIdQuery(employeeId));

            sql:ParameterizedQuery[] insertQueries =
                from EmergencyContact contact in contactsOpt
            select addPersonalInfoEmergencyContactQuery(employeeId, contact, updatedBy);

            if insertQueries.length() > 0 {
                _ = check databaseClient->batchExecute(insertQueries);
            }
        }
        check commit;
    }
    return;
}

# Update employee job information.
#
# + employeeId - Employee ID
# + payload - Job information update payload
# + updatedBy - Updater of the job info record
# + return - Nil if the update was successful or error
public isolated function updateEmployeeJobInfo(string employeeId, UpdateEmployeeJobInfoPayload payload, string updatedBy)
    returns error? {

    transaction {
        sql:ExecutionResult executionResult =
            check databaseClient->execute(updateEmployeeJobInfoQuery(employeeId, payload, updatedBy));

        check checkAffectedCount(executionResult.affectedRowCount);

        Email[]? additionalManagerEmails = payload.additionalManagerEmails;
        if additionalManagerEmails is Email[] {

            int|error pkIdResult = databaseClient->queryRow(
                `SELECT id FROM employee WHERE employee_id = ${employeeId}`
            );

            int employeePkId = check pkIdResult.ensureType(int);
            _ = check databaseClient->execute(deleteAdditionalManagersByEmployeeIdQuery(employeePkId));

            sql:ParameterizedQuery[] insertQueries =
                from Email email in additionalManagerEmails
            select addEmployeeAdditionalManagerQuery(employeePkId, email, updatedBy);

            if insertQueries.length() > 0 {
                _ = check databaseClient->batchExecute(insertQueries);
            }
        }

        check commit;
    }
    return;
}

# Fetch vehicles.
#
# + owner - Filter : owner of the vehicles  
# + vehicleStatus - Filter :  status of the vehicle
# + vehicleType - Filter :  type of the vehicle (e.g. CAR for parking booking, excluding bikes)
# + 'limit - Limit of the response  
# + offset - Offset of the response
# + return - Vehicles | Error
public isolated function fetchVehicles(string? owner = (), VehicleStatus? vehicleStatus = (),
        VehicleTypes? vehicleType = (), int? 'limit = (), int? offset = ()) returns Vehicles|error {

    stream<FetchVehicleResponse, error?> vehiclesResponse = databaseClient->query(
            fetchVehiclesQuery(owner, vehicleStatus, vehicleType, 'limit, offset));

    Vehicle[] vehicles = [];
    int totalCount = 0;
    _ = check from FetchVehicleResponse vehicle in vehiclesResponse
        do {
            vehicles.push({
                vehicleId: vehicle.vehicleId,
                owner: vehicle.owner,
                vehicleRegistrationNumber: vehicle.vehicleRegistrationNumber,
                updatedBy: vehicle.updatedBy,
                createdBy: vehicle.createdBy,
                vehicleStatus: vehicle.vehicleStatus,
                updatedOn: vehicle.updatedOn,
                createdOn: vehicle.createdOn,
                vehicleType: vehicle.vehicleType
            });

            totalCount = vehicle.totalCount;
        };

    return {
        vehicles,
        totalCount
    };
}

# Get owner email of a vehicle by id.
#
# + vehicleId - Vehicle identifier
# + return - Owner email or error
public isolated function getVehicleOwner(int vehicleId) returns string|error? {
    record {|string owner;|}|error row = databaseClient->queryRow(getVehicleOwnerQuery(vehicleId));
    if row is sql:NoRowsError {
        return ();
    }
    if row is error {
        return row;
    }
    return row.owner;
}

# Persist new vehicle.
#
# + payload - Payload containing the vehicle details
# + return - Id of the vehicle | Error
public isolated function addVehicle(AddVehiclePayload payload) returns int|error {
    sql:ExecutionResult executionResults = check databaseClient->execute(addVehicleQuery(payload));
    return executionResults.lastInsertId.ensureType(int);
}

# Update specific vehicle.
#
# + payload - Payload containing the update details
# + return - true if the update was successful or error
public isolated function updateVehicle(UpdateVehiclePayload payload) returns boolean|error {
    sql:ExecutionResult executionResults = check databaseClient->execute(updateVehicleQuery(payload));
    if executionResults.affectedRowCount > 0 {
        return true;
    }
    return false;
}

# Get active parking floors.
#
# + return - Parking floors
public isolated function getParkingFloors() returns ParkingFloor[]|error {
    stream<ParkingFloor, error?> floorStream = databaseClient->query(getParkingFloorsQuery());
    return from ParkingFloor f in floorStream
        select f;
}

# Get parking slots for a floor for a date.
#
# + floorId - Floor id
# + bookingDate - Booking date (YYYY-MM-DD)
# + return - Parking slots (with isBooked)
public isolated function getParkingSlotsByFloor(int floorId, string bookingDate) returns ParkingSlot[]|error {
    stream<ParkingSlotRow, error?> slotStream = databaseClient->query(getParkingSlotsByFloorQuery(floorId, bookingDate));
    return from ParkingSlotRow r in slotStream
        select {
            slotId: r.slotId,
            floorId: r.floorId,
            floorName: r.floorName,
            coinsPerSlot: r.coinsPerSlot,
            isBooked: r.isBooked == 1
        };
}

# Get parking slot by ID.
#
# + slotId - Slot id
# + return - Parking slot or nil
public isolated function getParkingSlotById(string slotId) returns ParkingSlot|error? {
    ParkingSlotRow|error row = databaseClient->queryRow(getParkingSlotByIdQuery(slotId));
    if row is sql:NoRowsError {
        return ();
    }
    if row is error {
        return row;
    }
    return {
        slotId: row.slotId,
        floorId: row.floorId,
        floorName: row.floorName,
        coinsPerSlot: row.coinsPerSlot,
        isBooked: row.isBooked == 1
    };
}

# Check if slot is unavailable for date.
#
# + slotId - Slot id
# + bookingDate - Booking date (YYYY-MM-DD)
# + return - True if slot has an active reservation (PENDING/CONFIRMED), false otherwise, or error
public isolated function isParkingSlotBookedForDate(string slotId, string bookingDate) returns boolean|error {
    ReservationIdRow|error row = databaseClient->queryRow(
        getConfirmedParkingReservationForSlotDateQuery(slotId, bookingDate));
    if row is sql:NoRowsError {
        return false;
    }
    if row is error {
        return row;
    }
    return true;
}

# Create parking reservation (PENDING).
#
# + payload - Reservation payload
# + return - New reservation id
public isolated function addParkingReservation(AddParkingReservationPayload payload) returns int|error {
    sql:ExecutionResult result = check databaseClient->execute(addParkingReservationQuery(payload));
    return result.lastInsertId.ensureType(int);
}

# Get parking reservation by ID.
#
# + reservationId - Reservation id
# + return - Reservation details or nil
public isolated function getParkingReservationById(int reservationId) returns ParkingReservationDetails|error? {
    ParkingReservationDetails|error row = databaseClient->queryRow(getParkingReservationByIdQuery(reservationId));
    return row is sql:NoRowsError ? () : row;
}

# Get parking reservation id by transaction hash.
#
# + transactionHash - Blockchain transaction hash
# + return - Reservation id or nil
public isolated function getParkingReservationByTransactionHash(string transactionHash)
        returns ReservationIdRow|error? {
    ReservationIdRow|error row = databaseClient->queryRow(
        getParkingReservationByTransactionHashQuery(transactionHash));
    if row is sql:NoRowsError {
        return ();
    }
    return row;
}

# Update reservation status and optional transaction_hash.
#
# + payload - Update payload
# + return - True if updated
public isolated function updateParkingReservationStatus(UpdateParkingReservationStatusPayload payload)
    returns boolean|error {
    sql:ExecutionResult result = check databaseClient->execute(
        updateParkingReservationStatusQuery(payload));
    return result.affectedRowCount > 0;
}

# Get parking reservations by employee.
#
# + employeeEmail - Employee email
# + fromDate - From date (optional)
# + toDate - To date (optional)
# + return - Reservations
public isolated function getParkingReservationsByEmployee(string employeeEmail, string? fromDate = (),
        string? toDate = ()) returns ParkingReservationDetails[]|error {
    stream<ParkingReservationDetails, error?> resStream = databaseClient->query(
        getParkingReservationsByEmployeeQuery(employeeEmail, fromDate, toDate));
    return from ParkingReservationDetails r in resStream
        select r;
}
