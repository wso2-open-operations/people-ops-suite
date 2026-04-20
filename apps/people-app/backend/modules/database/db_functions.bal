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
# + return - Companies with allowed locations and probation periods
public isolated function getCompanies() returns CompanyResponse[]|error {
    stream<CompanyRow, error?> companyStream = databaseClient->query(getCompaniesQuery());

    return check from CompanyRow company in companyStream
        select check mapToCompanyResponse(company);
}

# Map company DB row to CompanyResponse.
#
# + company - Raw company record from DB
# + return - CompanyResponse with parsed allowedLocations
isolated function mapToCompanyResponse(CompanyRow company) returns CompanyResponse|error {
    AllowedLocation[] allowedLocations = [];

    string? rawLocations = company.allowedLocations;
    if rawLocations is string {
        allowedLocations = check rawLocations.fromJsonStringWithType();
    }

    return {
        id: company.id,
        name: company.name,
        prefix: company.prefix,
        location: company.location,
        allowedLocations: allowedLocations
    };
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

# Get houses.
#
# + return - Houses
public isolated function getHouses() returns House[]|error {
    stream<House, sql:Error?> resultStream = databaseClient->query(getHousesQuery());
    return from House house in resultStream select house;
}

# Get the house with the fewest active employees.
#
# + return - House with the least active employees, nil if no active houses, or error
public isolated function getHouseWithLeastActiveEmployees() returns House|error? {
    House|error result = databaseClient->queryRow(getHouseWithLeastActiveEmployeesQuery());
    return result is sql:NoRowsError ? () : result;
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
        check syncEmergencyContacts(employeeId, payload.personalInfo.emergencyContacts ?: [], createdBy);
        check syncAdditionalManagers(employeeId, payload.additionalManagerEmails, createdBy);
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

# Sync emergency contacts for an employee based on the desired set of contacts.
#
# + employeeId - Employee ID string
# + desiredContacts - The full desired set of emergency contacts
# + actor - User performing the operation
# + return - Nil or error
isolated function syncEmergencyContacts(string employeeId, EmergencyContact[] desiredContacts, string actor)
    returns error? {

    stream<EmergencyContactRow, error?> currentStream =
        databaseClient->query(getEmergencyContactRowsQuery(employeeId));

    EmergencyContactRow[] currentRows = check from EmergencyContactRow contactRow in currentStream
        select contactRow;

    map<EmergencyContactRow> currentByMobile = map from EmergencyContactRow contactRow in currentRows
        select [contactRow.mobile, contactRow];

    string[] desiredMobiles = from EmergencyContact contact in desiredContacts
        select contact.mobile;

    string[] toRemove = from string mobile in currentByMobile.keys()
        where desiredMobiles.indexOf(mobile) is ()
        select mobile;

    EmergencyContact[] toAdd = from EmergencyContact contact in desiredContacts
        where !currentByMobile.hasKey(contact.mobile)
        select contact;

    EmergencyContact[] toUpdate = from EmergencyContact contact in desiredContacts
        let EmergencyContactRow? existing = currentByMobile[contact.mobile]
        where existing != () &&
            (existing.name != contact.name ||
                (existing.telephone ?: "") != (contact.telephone ?: "") ||
                existing.relationship != contact.relationship)
        select contact;

    sql:ParameterizedQuery[] deleteQueries = from string mobile in toRemove
        select deleteEmergencyContactQuery(employeeId, mobile, actor);

    if deleteQueries.length() > 0 {
        _ = check databaseClient->batchExecute(deleteQueries);
    }

    sql:ParameterizedQuery[] insertQueries = from EmergencyContact contact in toAdd
        select addPersonalInfoEmergencyContactQuery(employeeId, contact, actor);

    if insertQueries.length() > 0 {
        _ = check databaseClient->batchExecute(insertQueries);
    }

    sql:ParameterizedQuery[] updateQueries = from EmergencyContact contact in toUpdate
        select addPersonalInfoEmergencyContactQuery(employeeId, contact, actor);

    if updateQueries.length() > 0 {
        _ = check databaseClient->batchExecute(updateQueries);
    }
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
        sql:ExecutionResult executionResult = check databaseClient->execute(
            updateEmployeePersonalInfoQuery(employeeId, payload, updatedBy));

        EmergencyContact[]? contactsOpt = payload.emergencyContacts;
        if contactsOpt is EmergencyContact[] {
            check syncEmergencyContacts(employeeId, contactsOpt, updatedBy);
        } else {
            check checkAffectedCount(executionResult.affectedRowCount);
        }

        check commit;
    }
}

# Sync additional managers for an employee based on the desired set of manager emails.
#
# + employeeId - Employee ID string
# + desiredEmails - The full desired set of additional manager emails
# + actor - User performing the operation
# + return - Nil or error
isolated function syncAdditionalManagers(string employeeId, Email[] desiredEmails, string actor)
    returns error? {

    stream<AdditionalManagerEmailRow, error?> currentStream =
        databaseClient->query(getAdditionalManagerEmailsQuery(employeeId));

    string[] currentEmails = check from AdditionalManagerEmailRow emailRow in currentStream
        select emailRow.additionalManagerEmail.toLowerAscii();

    string[] desiredLower = from Email email in desiredEmails
        select email.trim().toLowerAscii();

    map<string> currentEmailMap = map from string email in currentEmails
        select [email, email];
    map<string> desiredEmailMap = map from string email in desiredLower
        select [email, email];

    string[] toRemove = from string current in currentEmails
        where !desiredEmailMap.hasKey(current)
        select current;

    Email[] toAdd = from Email email in desiredEmails
        where !currentEmailMap.hasKey(email.trim().toLowerAscii())
        select email;

    sql:ParameterizedQuery[] deleteQueries = from string email in toRemove
        select deleteAdditionalManagerQuery(employeeId, email, actor);

    if deleteQueries.length() > 0 {
        _ = check databaseClient->batchExecute(deleteQueries);
    }

    if toAdd.length() > 0 {
        int employeePkId = check databaseClient->queryRow(
            `SELECT id FROM employee WHERE employee_id = ${employeeId}`
        );
        sql:ParameterizedQuery[] insertQueries = from Email email in toAdd
            select addEmployeeAdditionalManagerQuery(employeePkId, email.trim(), actor);

        _ = check databaseClient->batchExecute(insertQueries);
    }
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
            check syncAdditionalManagers(employeeId, additionalManagerEmails, updatedBy);
        }
        check syncResignationRecord(employeeId, payload, updatedBy);
        check commit;
    }
}

# Check whether the job-info update payload contains any leaver-specific fields.
#
# + payload - Job information update payload
# + return - True if any resignation field is present
public isolated function hasLeaverFields(UpdateEmployeeJobInfoPayload payload) returns boolean =>
    payload.finalDayInOffice is string
    || payload.finalDayOfEmployment is string
    || payload.resignationReason is string;

# Sync the resignation table row for an employee based on the job-info update payload.
# Retains any existing resignation record when the employee is reactivated, so historical details are preserved.
#
# + employeeId - Employee ID
# + payload - Job information update payload
# + updatedBy - User performing the operation
# + return - Nil or error
isolated function syncResignationRecord(string employeeId, UpdateEmployeeJobInfoPayload payload, string updatedBy)
    returns error? {

    if hasLeaverFields(payload) {
        _ = check databaseClient->execute(upsertResignationQuery(employeeId, payload, updatedBy));
    }
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
# + pendingExpiryMinutes - Pending expiry duration in minutes
# + return - Parking slots (with isBooked)
public isolated function getParkingSlotsByFloor(int floorId, string bookingDate, int pendingExpiryMinutes)
        returns ParkingSlot[]|error {
    stream<ParkingSlotRow, error?> slotStream = databaseClient->query(
        getParkingSlotsByFloorQuery(floorId, bookingDate, pendingExpiryMinutes));
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
# + pendingExpiryMinutes - Pending expiry duration in minutes
# + return - True if slot has an active reservation (CONFIRMED, or PENDING within `pendingExpiryMinutes`), false
#           otherwise, or error
public isolated function isParkingSlotBookedForDate(string slotId, string bookingDate, int pendingExpiryMinutes)
        returns boolean|error {
    ReservationIdRow|error row = databaseClient->queryRow(
        getActiveParkingReservationForSlotDateQuery(slotId, bookingDate, pendingExpiryMinutes));
    if row is sql:NoRowsError {
        return false;
    }
    if row is error {
        return row;
    }
    return true;
}

# Expire stale PENDING reservations (PENDING -> EXPIRED) for slot/date.
#
# + slotId - Slot id
# + bookingDate - Booking date (YYYY-MM-DD)
# + expiryMinutes - Expiry duration in minutes
# + return - True if any rows updated
public isolated function expireStalePendingParkingReservationForSlotDate(string slotId, string bookingDate,
        int expiryMinutes) returns boolean|error {
    sql:ExecutionResult result = check databaseClient->execute(
        expireStalePendingParkingReservationForSlotDateQuery(slotId, bookingDate, expiryMinutes));
    return result.affectedRowCount > 0;
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

# Get a map of employee work email to full name for all employees.
#
# + return - Map of work_email -> full_name, or error
public isolated function getEmployeeEmailToNameMap() returns map<string>|error {
    stream<EmployeeNameRow, error?> resultStream = databaseClient->query(getEmployeeEmailToNameMapQuery());
    map<string> nameMap = {};
    check from EmployeeNameRow row in resultStream
        do {
            nameMap[row.workEmail.toLowerAscii()] = row.fullName;
        };
    return nameMap;
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

# Get organization details with business units, teams, sub-teams, units,
#
# + return - Organization details
public isolated function getOrganizationDetails() returns OrgCompany|error {
    CompanyRaw|error companyRow = databaseClient->queryRow(getOrganizationStructureQuery());
    if companyRow is sql:NoRowsError {
        return error("Organization details not found");
    }
    if companyRow is error {
        return companyRow;
    }

    OrgBusinessUnit[] businessUnits = check companyRow.businessUnits.fromJsonWithType();

    return {
        id: companyRow.id,
        name: companyRow.name,
        headCount: companyRow.headCount,
        businessUnits
    };
}

# Add new business unit.
#
# + userEmail - Email of the user creating the record
# + payload - Node details (name and head email)
# + return - Created business unit ID or error
public isolated function addBusinessUnit(string userEmail, OrgNodeInfo payload) returns int|error {
    sql:ExecutionResult executionResult = check databaseClient->execute(addBusinessUnitQuery(userEmail, payload));
    return executionResult.lastInsertId.ensureType(int);
}

# Add new team.
#
# + userEmail - Email of the user creating the record
# + payload - Node details (name and head email)
# + return - Created team ID or error
public isolated function addTeam(string userEmail, OrgNodeInfo payload) returns int|error {
    sql:ExecutionResult executionResult = check databaseClient->execute(addTeamQuery(userEmail, payload));
    return executionResult.lastInsertId.ensureType(int);
}

# Add new sub team.
#
# + userEmail - Email of the user creating the record
# + payload - Node details (name and head email)
# + return - Created sub-team ID or error
public isolated function addSubTeam(string userEmail, OrgNodeInfo payload) returns int|error {
    sql:ExecutionResult executionResult = check databaseClient->execute(addSubTeamQuery(userEmail, payload));
    return executionResult.lastInsertId.ensureType(int);
}

# Add new unit.
#
# + userEmail - Email of the user creating the record
# + payload - Node details (name and head email)
# + return - Created unit ID or error
public isolated function addUnit(string userEmail, OrgNodeInfo payload) returns int|error {
    sql:ExecutionResult executionResult = check databaseClient->execute(addUnitQuery(userEmail, payload));
    return executionResult.lastInsertId.ensureType(int);
}

# Create a new team and map it to a business unit atomically.
#
# + userEmail - Email of the user creating the record
# + payload - Team details
# + return - Created mapping ID or error
public isolated function addTeamWithMapping(string userEmail, CreateTeamPayload payload) returns int|error {
    transaction {
        sql:ExecutionResult executionResult = check databaseClient->execute(
            addTeamQuery(userEmail, {name: payload.name, headEmail: payload.headEmail}));
        int teamId = check executionResult.lastInsertId.ensureType(int);

        sql:ExecutionResult executionResultTwo = check databaseClient->execute(
            addBusinessUnitTeamQuery(userEmail, {
                                                    businessUnitId: payload.businessUnit.businessUnitId,
                                                    teamId,
                                                    functionalLeadEmail: payload.businessUnit.functionalLeadEmail
                                                }));
        int id = check executionResultTwo.lastInsertId.ensureType(int);

        check commit;
        return id;
    }
}

# Create a new sub-team and map it to a business unit-team atomically.
#
# + userEmail - Email of the user creating the record
# + payload - Sub-team details
# + return - Created mapping ID or error
public isolated function addSubTeamWithMapping(string userEmail, CreateSubTeamPayload payload) returns int|error {
    transaction {
        sql:ExecutionResult executionResult = check databaseClient->execute(
            addSubTeamQuery(userEmail, {name: payload.name, headEmail: payload.headEmail}));
        int subTeamId = check executionResult.lastInsertId.ensureType(int);

        sql:ExecutionResult executionResultTwo = check databaseClient->execute(
            addBusinessUnitTeamSubTeamQuery(userEmail, {
                                                           businessUnitTeamId: payload.businessUnitTeam.businessUnitTeamId,
                                                           subTeamId,
                                                           functionalLeadEmail: payload.businessUnitTeam.functionalLeadEmail
                                                       }));
        int id = check executionResultTwo.lastInsertId.ensureType(int);

        check commit;
        return id;
    }
}

# Create a new unit and map it to a business unit-team-sub-team atomically.
#
# + userEmail - Email of the user creating the record
# + payload - Unit details 
# + return - Created mapping ID or error
public isolated function addUnitWithMapping(string userEmail, CreateUnitPayload payload) returns int|error {
    transaction {
        sql:ExecutionResult executionResult = check databaseClient->execute(
            addUnitQuery(userEmail, {name: payload.name, headEmail: payload.headEmail}));
        int unitId = check executionResult.lastInsertId.ensureType(int);

        sql:ExecutionResult executionResultTwo = check databaseClient->execute(
            addBusinessUnitTeamSubTeamUnitQuery(userEmail, {
                                                               businessUnitTeamSubTeamId: payload.businessUnitTeamSubTeamUnit.businessUnitTeamSubTeamId,
                                                               unitId,
                                                               functionalLeadEmail: payload.businessUnitTeamSubTeamUnit.functionalLeadEmail
                                                           }));
        int id = check executionResultTwo.lastInsertId.ensureType(int);

        check commit;
        return id;
    }
}

# Map an existing team to a business unit.
#
# + userEmail - Email of the user creating the record
# + payload - Business unit ID, team ID, and functional lead email
# + return - Created mapping ID or error
public isolated function addBusinessUnitTeam(string userEmail, CreateBusinessUnitTeamPayload payload)
    returns int|error {

    sql:ExecutionResult executionResult = check databaseClient->execute(addBusinessUnitTeamQuery(userEmail, payload));
    return executionResult.lastInsertId.ensureType(int);
}

# Map an existing sub-team to a business unit-team.
#
# + userEmail - Email of the user creating the record
# + payload - Business unit-team ID, sub-team ID, and functional lead email
# + return - Created mapping ID or error
public isolated function addBusinessUnitTeamSubTeam(string userEmail, CreateBusinessUnitTeamSubTeamPayload payload)
    returns int|error {

    sql:ExecutionResult executionResult =
        check databaseClient->execute(addBusinessUnitTeamSubTeamQuery(userEmail, payload));

    return executionResult.lastInsertId.ensureType(int);
}

# Map an existing unit to a business unit-team-sub-team.
#
# + userEmail - Email of the user creating the record
# + payload - Business unit-team-sub-team ID, unit ID, and functional lead email
# + return - Created mapping ID or error
public isolated function addBusinessUnitTeamSubTeamUnit
        (string userEmail, CreateBusinessUnitTeamSubTeamUnitPayload payload) returns int|error {

    sql:ExecutionResult executionResult =
        check databaseClient->execute(addBusinessUnitTeamSubTeamUnitQuery(userEmail, payload));

    return executionResult.lastInsertId.ensureType(int);
}

# Update business unit.
#
# + payload - Update payload  
# + buId - Business unit ID
# + return - Error when update fails
public isolated function updateBusinessUnit(UpdateOrgUnitPayload payload, int buId) returns error? {
    _ = check databaseClient->execute(updateBusinessUnitQuery(payload, buId));
}

# Update team.
#
# + payload - Update payload
# + teamId - Team ID
# + return - Error when update fails
public isolated function updateTeam(UpdateOrgUnitPayload payload, int teamId) returns error? {
    _ = check databaseClient->execute(updateTeamQuery(payload, teamId));
}

# Update sub team.
#
# + payload - Update payload
# + subTeamId - Sub team ID
# + return - Error when update fails
public isolated function updateSubTeam(UpdateOrgUnitPayload payload, int subTeamId) returns error? {
    _ = check databaseClient->execute(updateSubTeamQuery(payload, subTeamId));
}

# Update unit.
#
# + payload - Update payload
# + unitId - Unit ID
# + return - Error when update fails
public isolated function updateUnit(UpdateOrgUnitPayload payload, int unitId) returns error? {
    _ = check databaseClient->execute(updateUnitQuery(payload, unitId));
}

# Update the functional lead of a business unit-team mapping.
#
# + payload - Fields to update in the business unit-team mapping
# + buId - ID of the business unit
# + teamId - ID of the team
# + return - True if updated, false if not found, error if the update fails
public isolated function updateBusinessUnitTeam(UpdateBusinessUnitTeamPayload payload, int buId, int teamId)
    returns boolean|error {

    sql:ExecutionResult executionResults =
        check databaseClient->execute(updateBusinessUnitTeamQuery(payload, buId, teamId));

    return executionResults.affectedRowCount > 0;
}

# Update the functional lead of a team-sub team mapping.
#
# + payload - Fields to update in the team-sub team mapping
# + teamId - ID of the team
# + subTeamId - ID of the sub team
# + return - True if updated, false if not found, error if the update fails
public isolated function updateTeamSubTeam(UpdateTeamSubTeamPayload payload, int teamId, int subTeamId)
    returns boolean|error {

    sql:ExecutionResult executionResults =
        check databaseClient->execute(updateTeamSubTeamQuery(payload, teamId, subTeamId));

    return executionResults.affectedRowCount > 0;
}

# Update the functional lead of a sub team-unit mapping.
#
# + payload - Fields to update in the sub team-unit mapping
# + subTeamId - ID of the sub team
# + unitId - ID of the unit
# + return - True if updated, false if not found, error if the update fails
public isolated function updateSubTeamUnit(UpdateSubTeamUnitPayload payload, int subTeamId, int unitId)
    returns boolean|error {

    sql:ExecutionResult executionResults =
        check databaseClient->execute(updateSubTeamUnitQuery(payload, subTeamId, unitId));

    return executionResults.affectedRowCount > 0;
}

# Delete a business unit.
#
# + userEmail - Email of the user performing the deletion
# + buId - ID of the business unit to delete
# + return - True if deleted, false if not found, error on failure
public isolated function deleteBusinessUnit(string userEmail, int buId) returns boolean|error {
    sql:ExecutionResult executionResult =
        check databaseClient->execute(deleteBusinessUnitQuery(userEmail, buId));

    return executionResult.affectedRowCount > 0;
}

# Delete a business unit-team mapping.
#
# + userEmail - Email of the user performing the deletion
# + buId - ID of the business unit
# + teamId - ID of the team
# + return - True if deleted, false if not found, error on failure
public isolated function deleteBusinessUnitTeam(string userEmail, int buId, int teamId)
    returns boolean|error {
    sql:ExecutionResult executionResult =
        check databaseClient->execute(deleteBusinessUnitTeamQuery(userEmail, buId, teamId));

    return executionResult.affectedRowCount > 0;
}

# Delete a team-sub team mapping.
#
# + userEmail - Email of the user performing the deletion
# + teamId - ID of the team
# + subTeamId - ID of the sub team
# + return - True if deleted, false if not found, error on failure
public isolated function deleteTeamSubTeam(string userEmail, int teamId, int subTeamId) returns boolean|error {
    sql:ExecutionResult executionResult =
        check databaseClient->execute(deleteTeamSubTeamQuery(userEmail, teamId, subTeamId));

    return executionResult.affectedRowCount > 0;
}

# Delete a sub team-unit mapping.
#
# + userEmail - Email of the user performing the deletion
# + subTeamId - ID of the sub team
# + unitId - ID of the unit
# + return - True if deleted, false if not found, error on failure
public isolated function deleteSubTeamUnit(string userEmail, int subTeamId, int unitId) returns boolean|error {
    sql:ExecutionResult executionResult =
        check databaseClient->execute(deleteSubTeamUnitQuery(userEmail, subTeamId, unitId));

    return executionResult.affectedRowCount > 0;
}

# Check whether a business unit name is unique among active rows.
#
# + businessUnitName - Business unit name to check
# + return - True if unique, false if already exists (or error on failure)
public isolated function validateBusinessUnitNameUniqueness(string businessUnitName) returns boolean|error {
    ExistsFlagResult result =
        check databaseClient->queryRow(validateBusinessUnitNameUniquenessQuery(businessUnitName));

    return result.existsFlag == 0;
}

# Check whether a team name is unique among active rows.
#
# + teamName - Team name to check
# + return - True if unique, false if already exists (or error on failure)
public isolated function validateTeamNameUniqueness(string teamName) returns boolean|error {
    ExistsFlagResult result =
        check databaseClient->queryRow(validateTeamNameUniquenessQuery(teamName));

    return result.existsFlag == 0;
}

# Check whether a sub-team name is unique among active rows.
#
# + subTeamName - Sub-team name to check
# + return - True if unique, false if already exists (or error on failure)
public isolated function validateSubTeamNameUniqueness(string subTeamName) returns boolean|error {
    ExistsFlagResult result =
        check databaseClient->queryRow(validateSubTeamNameUniquenessQuery(subTeamName));

    return result.existsFlag == 0;
}

# Check whether a unit name is unique among active rows.
#
# + unitName - Unit name to check
# + return - True if unique, false if already exists (or error on failure)
public isolated function validateUnitNameUniqueness(string unitName) returns boolean|error {
    ExistsFlagResult result =
        check databaseClient->queryRow(validateUnitNameUniquenessQuery(unitName));

    return result.existsFlag == 0;
}

# Check whether a BusinessUnit exists by ID.
#
# + buId - Business unit ID
# + return - True if exists, false otherwise (or error on failure)
public isolated function businessUnitExists(int buId) returns boolean|error {
    ExistsFlagResult result =
        check databaseClient->queryRow(businessUnitExistsQuery(buId));

    return result.existsFlag == 1;
}

# Check whether a Team exists by ID.
#
# + teamId - Team ID
# + return - True if exists, false otherwise (or error on failure)
public isolated function teamExists(int teamId) returns boolean|error {
    ExistsFlagResult result =
        check databaseClient->queryRow(teamExistsQuery(teamId));

    return result.existsFlag == 1;
}

# Check whether a SubTeam exists by ID.
#
# + subTeamId - Sub-team ID
# + return - True if exists, false otherwise (or error on failure)
public isolated function subTeamExists(int subTeamId) returns boolean|error {
    ExistsFlagResult result =
        check databaseClient->queryRow(subTeamExistsQuery(subTeamId));

    return result.existsFlag == 1;
}

# Check whether a unit exists by ID.
#
# + unitId - Unit ID
# + return - True if exists, false otherwise (or error on failure)
public isolated function unitExists(int unitId) returns boolean|error {
    ExistsFlagResult result =
        check databaseClient->queryRow(unitExistsQuery(unitId));

    return result.existsFlag == 1;
}

# Check whether a BusinessUnit-Team mapping exists by ID.
#
# + id - business_unit_team mapping ID
# + return - True if exists, false otherwise (or error on failure)
public isolated function businessUnitTeamMappingExists(int id) returns boolean|error {
    ExistsFlagResult result =
        check databaseClient->queryRow(businessUnitTeamMappingExistsQuery(id));

    return result.existsFlag == 1;
}

# Check whether a BusinessUnit-Team-SubTeam mapping exists by ID.
#
# + id - business_unit_team_sub_team mapping ID
# + return - True if exists, false otherwise (or error on failure)
public isolated function businessUnitTeamSubTeamMappingExists(int id) returns boolean|error {
    ExistsFlagResult result =
        check databaseClient->queryRow(businessUnitTeamSubTeamMappingExistsQuery(id));

    return result.existsFlag == 1;
}

# Check whether a business unit has child teams (active mappings).
#
# + buId - Business unit ID
# + return - True if it has child teams, false otherwise (or error on failure)
public isolated function businessUnitHasChildren(int buId) returns boolean|error {
    ExistsFlagResult result =
        check databaseClient->queryRow(businessUnitHasChildrenQuery(buId));

    return result.existsFlag == 1;
}

# Check whether a business unit-team mapping has child sub-teams (active mappings).
#
# + businessUnitId - Business unit ID
# + teamId - Team ID
# + return - True if it has child sub-teams, false otherwise (or error on failure)
public isolated function businessUnitTeamHasChildren(int businessUnitId, int teamId) returns boolean|error {
    ExistsFlagResult result =
        check databaseClient->queryRow(businessUnitTeamHasChildrenQuery(businessUnitId, teamId));

    return result.existsFlag == 1;
}

# Check whether a team-sub-team mapping has child units (active mappings).
#
# + teamId - Team ID
# + subTeamId - Sub-team ID
# + return - True if it has child units, false otherwise (or error on failure)
public isolated function teamSubTeamHasChildren(int teamId, int subTeamId) returns boolean|error {
    ExistsFlagResult result =
        check databaseClient->queryRow(teamSubTeamHasChildrenQuery(teamId, subTeamId));

    return result.existsFlag == 1;
}

# Retrieve the count of employees assigned to a specific Business Unit.
#
# + buId - Business Unit ID
# + return - Number of employees in the Business Unit, or error
public isolated function retreiveBusinessUnitHeadCount(int buId) returns int|error {
    return databaseClient->queryRow(retrieveBusinessUnitHeadCountQuery(buId));
}

# Retrieve the count of employees assigned to a specific Team-SubTeam combination.
# The Team ID is derived from the businessUnitTeamId mapping.
#
# + businessUnitTeamId - Business Unit-Team mapping ID
# + subTeamId - Sub Team ID
# + return - Number of employees in the Team-SubTeam, or error
public isolated function retreiveBusinessUnitTeamSubTeamHeadCount(int businessUnitTeamId, int subTeamId)
    returns int|error {
    return databaseClient->queryRow(retrieveBusinessUnitTeamSubTeamHeadCountQuery(businessUnitTeamId, subTeamId));
}

# Retrieve the count of employees assigned to a specific SubTeam-Unit combination.
# The Team and SubTeam IDs are derived from the businessUnitTeamSubTeamId mapping.
#
# + businessUnitTeamSubTeamId - Business Unit-Team-SubTeam mapping ID
# + unitId - Unit ID
# + return - Number of employees in the SubTeam-Unit, or error
public isolated function retreiveBusinessUnitTeamSubTeamUnitHeadCount(int businessUnitTeamSubTeamId, int unitId)
    returns int|error {
    return databaseClient->queryRow(retrieveBusinessUnitTeamSubTeamUnitHeadCountQuery(businessUnitTeamSubTeamId, unitId));
}

# Retrieve the count of employees assigned to a specific Business Unit-Team combination.
#
# + businessUnitId - Business Unit ID
# + teamId - Team ID
# + return - Number of employees in the Business Unit-Team, or error
public isolated function retreiveBusinessUnitTeamHeadCount(int businessUnitId, int teamId)
    returns int|error {
    return databaseClient->queryRow(retrieveBusinessUnitTeamHeadCountQuery(businessUnitId, teamId));
}

# Rename a Business Unit by creating a new one with the updated name.
# This operation:
# 1. Inserts a new Business Unit with the new name
# 2. Updates all business_unit_team mappings to use the new BU
# 3. Updates all active employees to use the new BU
# 4. Deactivates the old Business Unit
#
# + payload - Payload containing the BU ID, new name, and updated by
# + return - The new Business Unit ID, or error
public isolated function renameBusinessUnit(RenameBusinessUnitName payload) returns int|error {
    transaction {
        sql:ExecutionResult insertResult = check databaseClient->execute(
            insertRenamedBusinessUnitQuery(payload));
        int newBuId = check insertResult.lastInsertId.ensureType(int);

        _ = check databaseClient->execute(
            updateBusinessUnitTeamMappingsQuery(payload.businessUnitId, newBuId, payload.updatedBy));

        _ = check databaseClient->execute(
            updateEmployeesBusinessUnitQuery(payload.businessUnitId, newBuId, payload.updatedBy));

        _ = check databaseClient->execute(deactivateOldBusinessUnitQuery(payload));

        check commit;
        return newBuId;
    }
}

# Renames a Team by creating a new one with the updated name.
# This operation:
# 1. Inserts a new Team with the new name (copying head_email from old)
# 2. Updates all business_unit_team mappings to use the new Team
# 3. Updates all active employees to use the new Team
# 4. Deactivates the old Team
#
# + payload - Payload containing the Team ID, new name, and updated by
# + return - The new Team ID, or error
public isolated function renameTeam(RenameTeamName payload) returns int|error {
    transaction {
        sql:ExecutionResult insertResult = check databaseClient->execute(
            insertRenamedTeamQuery(payload));
        int newTeamId = check insertResult.lastInsertId.ensureType(int);

        _ = check databaseClient->execute(
            updateBusinessUnitTeamMappingsForTeamQuery(payload.teamId, newTeamId, payload.updatedBy));

        _ = check databaseClient->execute(
            updateEmployeesTeamQuery(payload.teamId, newTeamId, payload.updatedBy));

        _ = check databaseClient->execute(deactivateOldTeamQuery(payload));

        check commit;
        return newTeamId;
    }
}

# Renames a SubTeam by creating a new one with the updated name.
# This operation:
# 1. Inserts a new SubTeam with the new name (copying head_email from old)
# 2. Updates all business_unit_team_sub_team mappings to use the new SubTeam
# 3. Updates all active employees to use the new SubTeam
# 4. Deactivates the old SubTeam
#
# + payload - Payload containing the SubTeam ID, new name, and updated by
# + return - The new SubTeam ID, or error
public isolated function renameSubTeam(RenameSubTeamName payload) returns int|error {
    transaction {
        sql:ExecutionResult insertResult = check databaseClient->execute(
            insertRenamedSubTeamQuery(payload));
        int newSubTeamId = check insertResult.lastInsertId.ensureType(int);

        _ = check databaseClient->execute(
            updateBusinessUnitTeamSubTeamMappingsQuery(payload.subTeamId, newSubTeamId, payload.updatedBy));

        _ = check databaseClient->execute(
            updateEmployeesSubTeamQuery(payload.subTeamId, newSubTeamId, payload.updatedBy));

        _ = check databaseClient->execute(deactivateOldSubTeamQuery(payload));

        check commit;
        return newSubTeamId;
    }
}

# Renames a Unit by creating a new one with the updated name.
# This operation:
# 1. Inserts a new Unit with the new name (copying head_email from old)
# 2. Updates all business_unit_team_sub_team_unit mappings to use the new Unit
# 3. Updates all active employees to use the new Unit
# 4. Deactivates the old Unit
#
# + payload - Payload containing the Unit ID, new name, and updated by
# + return - The new Unit ID, or error
public isolated function renameUnit(RenameUnitName payload) returns int|error {
    transaction {
        sql:ExecutionResult insertResult = check databaseClient->execute(
            insertRenamedUnitQuery(payload));
        int newUnitId = check insertResult.lastInsertId.ensureType(int);

        _ = check databaseClient->execute(
            updateBusinessUnitTeamSubTeamUnitMappingsQuery(payload.unitId, newUnitId, payload.updatedBy));

        _ = check databaseClient->execute(
            updateEmployeesUnitQuery(payload.unitId, newUnitId, payload.updatedBy));

        _ = check databaseClient->execute(deactivateOldUnitQuery(payload));

        check commit;
        return newUnitId;
    }
}

# Checks if a Business Unit name already exists.
#
# + name - Business Unit name to check
# + return - True if name exists, false otherwise, or error
public isolated function businessUnitNameExists(string name) returns boolean|error {
    int existsFlag = check databaseClient->queryRow(businessUnitNameExistsQuery(name));
    return existsFlag == 1;
}

# Checks if a Team name already exists.
#
# + name - Team name to check
# + return - True if name exists, false otherwise, or error
public isolated function teamNameExists(string name) returns boolean|error {
    int existsFlag = check databaseClient->queryRow(teamNameExistsQuery(name));
    return existsFlag == 1;
}

# Checks if a SubTeam name already exists.
#
# + name - SubTeam name to check
# + return - True if name exists, false otherwise, or error
public isolated function subTeamNameExists(string name) returns boolean|error {
    int existsFlag = check databaseClient->queryRow(subTeamNameExistsQuery(name));
    return existsFlag == 1;
}

# Checks if a Unit name already exists.
#
# + name - Unit name to check
# + return - True if name exists, false otherwise, or error
public isolated function unitNameExists(string name) returns boolean|error {
    int existsFlag = check databaseClient->queryRow(unitNameExistsQuery(name));
    return existsFlag == 1;
}
