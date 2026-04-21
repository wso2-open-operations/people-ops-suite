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

import ballerina/constraint;
import ballerina/sql;
import ballerinax/mysql;

# Email validation regex pattern
public const EMAIL_PATTERN_STRING = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";

# Phone number validation regex pattern
const PHONE_PATTERN_STRING = "^[0-9+\\-()\\s]*[0-9][0-9+\\-()\\s]*$";

# Date validation regex pattern (YYYY-MM-DD format), e.g. for parking booking_date.
public const DATE_PATTERN_STRING = "^\\d{4}-\\d{2}-\\d{2}$";

# URL validation regex pattern
const URL_PATTERN_STRING = "^(https?|ftp)://[^\\s/$.?#].[^\\s]*$";

# Constrained email string type.
@constraint:String {maxLength: 254, pattern: re `${EMAIL_PATTERN_STRING}`}
public type Email string;

# [Configurable] Database configs.
type DatabaseConfig record {|
    # If the MySQL server is secured, the username
    string user;
    # The password of the MySQL server for the provided username
    string password;
    # The name of the database
    string database;
    # Hostname of the MySQL server
    string host;
    # Port number of the MySQL server
    int port;
    # The `mysql:Options` configurations
    mysql:Options options?;
    # The `sql:ConnectionPool` configurations
    sql:ConnectionPool connectionPool?;
|};

# Employee basic information.
public type EmployeeBasicInfo record {|
    # Employee ID of the user
    @sql:Column {name: "employee_id"}
    string employeeId;
    # First name of the user
    @sql:Column {name: "first_name"}
    string firstName;
    # Last name of the user
    @sql:Column {name: "last_name"}
    string lastName;
    # Work email of the user
    @sql:Column {name: "work_email"}
    string workEmail;
    # Thumbnail URL of the user
    @sql:Column {name: "employee_thumbnail"}
    string? employeeThumbnail;
|};

# User information with privileges.
public type UserInfo record {|
    *EmployeeBasicInfo;
    # Privileges assigned to the user
    int[] privileges = [];
|};

# Generic single-flag DB result shape for EXISTS-based checks.
public type ExistsFlagResult record {|
    # 1 when a matching row exists, otherwise 0
    @sql:Column {name: "exists_flag"}
    int existsFlag;
|};

# Request payload for EPF uniqueness validation.
public type EpfValidationPayload record {|
    # EPF number to validate
    @constraint:String {maxLength: 45}
    string epf;
|};

# Response for EPF uniqueness validation.
public type EpfValidationResponse record {|
    # Whether the EPF already exists
    boolean epfExists;
|};

# Context record returned by the employee ID generation query.
public type EmployeeIdContext record {|
    # Company prefix
    string companyPrefix;
    # Employment type
    EmploymentTypeName employmentType;
|};

# Result record for the last numeric suffix query used in employee ID generation.
public type EmployeeIdSequence record {|
    # Last numeric ID used for the given prefix and employment type sequence
    decimal lastNumericId;
|};

# TODO: Add structured types for org structure fields and company details
# Employee information.
public type Employee record {|
    *EmployeeBasicInfo;
    # Employees' provident fund number
    string? epf;
    # Company name
    string company;
    # Company ID
    int companyId;
    # Work location
    string workLocation;
    # Start date
    string startDate;
    # Manager email
    string managerEmail;
    # Manager full name (resolved from DB join)
    string? managerName;
    # Additional manager email
    string? additionalManagerEmails;
    # Gender (from employee personal info)
    string? gender;
    # Employee status
    string employeeStatus;
    # Continuous service record reference (Employee ID)
    string? continuousServiceRecord;
    # Start date of the continuous service record (resolved via DB join)
    string? continuousServiceDate;
    # Probation end date
    string? probationEndDate;
    # Agreement end date
    string? agreementEndDate;
    # Resignation date
    string? resignationDate;
    # Final day in office
    string? finalDayInOffice;
    # Final day of employment
    string? finalDayOfEmployment;
    # Resignation reason
    string? resignationReason;
    # Employment type
    string employmentType;
    # Employment type ID
    int employmentTypeId;
    # Career Function ID
    int careerFunctionId;
    # Designation
    string designation;
    # Designation ID
    int designationId;
    # Job band
    int? jobBand;
    # Job role of the user
    string? secondaryJobTitle;
    # Office
    string? office;
    # Office ID
    int? officeId;
    # Business unit
    string businessUnit;
    # Business unit ID
    int businessUnitId;
    # Team
    string team;
    # Team ID
    int teamId;
    # Sub-team
    string subTeam;
    # Sub-team ID
    int subTeamId;
    # Unit
    string? unit;
    # Unit ID
    int? unitId;
    # House
    string? house;
    # House ID
    int? houseId;
    # Computed field: number of subordinates this employee manages
    int subordinateCount;
|};

# Filters for getting employees.
public type EmployeeFilters record {|
    # Title
    string? title = ();
    # First name
    string? firstName = ();
    # Last name
    string? lastName = ();
    # National Identity Card number or Passport
    int|string? nicOrPassport = ();
    # Date of birth
    string? dateOfBirth = ();
    # Gender
    string? gender = ();
    # Personal email
    string? personalEmail = ();
    # Personal phone number
    string? personalPhone = ();
    # Resident number
    string? residentNumber = ();
    # City
    string? city = ();
    # Country
    string? country = ();
    # Career function ID
    int? careerFunctionId = ();
    # Manager email
    string? managerEmail = ();
    # Company ID
    int? companyId = ();
    # Office ID
    int? officeId = ();
    # Business unit ID
    int? businessUnitId = ();
    # Team ID
    int? teamId = ();
    # Sub-team ID
    int? subTeamId = ();
    # Unit ID
    int? unitId = ();
    # Designation ID
    int? designationId = ();
    # Employment type ID
    int? employmentTypeId = ();
    # Employee Status
    string? employeeStatus = ();
    # Direct reports only (true = direct only, false = all subordinates recursively)
    boolean? directReports = ();
    # When true, excludes employees whose start date is in the future
    boolean? excludeFutureStartDate = ();
    # When true, includes employees with "Marked leaver" status alongside the primary employeeStatus filter
    boolean? includeMarkedLeavers = ();
|};

# Payload for the employee report generation endpoint.
public type EmployeeReportPayload record {|
    # Filters to apply to the employee export; mirrors EmployeeFilters used by /employees/search
    EmployeeFilters filters = {};
    # Optional column allowlist (canonical key strings). nil or empty = all columns for the report type.
    string[]? columns = ();
|};

# Pagination information.
public type Pagination record {|
    # Limit of records per page
    @constraint:Int {minValue: 1, maxValue: 100}
    int 'limit = DEFAULT_RECORDS_PER_PAGE;
    # Offset for pagination
    @constraint:Int {minValue: 0}
    int offset = 0;
|};

# Allowlisted sort order values and their SQL fragments.
public final map<sql:ParameterizedQuery> & readonly SortOrder = {
    "ASC": `ASC`,
    "DESC": `DESC`,
    "asc": `ASC`,
    "desc": `DESC`,
    "Asc": `ASC`,
    "Desc": `DESC`
};

# Allowed Employee sort fields with their corresponding database columns.
public final map<sql:ParameterizedQuery> & readonly EmployeeSortField = {
    "employeeId": `e.employee_id`,
    "firstName": `e.first_name`,
    "lastName": `e.last_name`,
    "fullName": `CONCAT(e.first_name, ' ', e.last_name)`,
    "workEmail": `e.work_email`,
    "startDate": `e.start_date`,
    "employeeStatus": `e.employee_status`,
    "employmentType": `et.name`,
    "designation": `d.designation`,
    "businessUnit": `bu.name`,
    "team": `t.name`,
    "company": `c.name`
};

# Sort configuration for employee listing.
public type Sort record {|
    # Field to sort by
    string sortField = "employeeId";
    # Sort order: "ASC" for ascending, "DESC" for descending
    string sortOrder = "ASC";
|};

# Filter payload for getting employees.
public type EmployeeSearchPayload record {|
    # Search query
    @constraint:String {
        maxLength: 100,
        pattern: re `^[\p{L}\p{M}0-9\s@._'+-]*$`
    }
    string? searchString = ();
    # Filters
    EmployeeFilters filters;
    # Pagination
    Pagination pagination;
    # Sort configuration
    Sort sort;
    # When true, restricts results to the caller's direct and additional subordinates
    # even if the caller has admin access. Used by the "My Team" view.
    boolean leadOnly = false;
|};

# Employee record with total count.
public type EmployeeRecord record {|
    *Employee;
    # Total count of matching employees
    int totalCount;
|};

# Filtered employees response with total count.
public type EmployeesResponse record {|
    # List of filtered employees
    Employee[] employees;
    # Total count of matching employees
    int totalCount;
|};

# Employee record for QR code export — extends EmployeeBasicInfo with house and status fields.
public type EmployeeQrInfo record {|
    *EmployeeBasicInfo;
    # House
    string? house;
    # House ID
    int? houseId;
    # Employee status
    string employeeStatus;
|};

# QR code export response.
public type EmployeeQrInfoResponse record {|
    # List of employees
    EmployeeQrInfo[] employees;
    # Total count of matching employees
    int totalCount;
|};

# Filters relevant to the QR code employee search.
public type QrCodeSearchFilters record {|
    # Employee status
    string? employeeStatus = ();
|};

# Search payload for the QR code export endpoint.
public type QrCodeSearchPayload record {|
    # Search query
    @constraint:String {
        maxLength: 100,
        pattern: re `^[\p{L}\p{M}0-9\s@._'+-]*$`
    }
    string? searchString = ();
    # Filters
    QrCodeSearchFilters filters;
    # Pagination
    Pagination pagination;
    # Sort configuration
    Sort sort;
|};

# Personal information of an employee.
public type EmployeePersonalInfo record {|
    # National Identity Card number
    @sql:Column {name: "nic_or_passport"}
    string nicOrPassport;
    # First name
    string firstName;
    # Last name
    string lastName;
    # Full name
    @sql:Column {name: "full_name"}
    string fullName;
    # Title (Mr./Ms./Dr./etc.)
    string title;
    # Date of birth
    string dob;
    # Gender of the person
    string gender;
    # Personal email address
    @sql:Column {name: "personal_email"}
    string? personalEmail;
    # Personal phone number
    @sql:Column {name: "personal_phone"}
    string? personalPhone;
    # Resident number
    @sql:Column {name: "resident_number"}
    string? residentNumber;
    # Address line 1
    @sql:Column {name: "address_line_1"}
    string? addressLine1;
    # Address line 2
    @sql:Column {name: "address_line_2"}
    string? addressLine2;
    # City
    string? city;
    # State or province
    @sql:Column {name: "state_or_province"}
    string? stateOrProvince;
    # Postal code
    @sql:Column {name: "postal_code"}
    string? postalCode;
    # Country of residence
    string? country;
    # Nationality
    string nationality;
    # Emergency contacts
    EmergencyContact[] emergencyContacts = [];
|};

# Continuous service record information.
public type ContinuousServiceRecordInfo record {|
    # Employee ID of the user
    string employeeId;
    # First name
    string firstName;
    # Last name
    string lastName;
    # Company name
    string company;
    # Work location
    string workLocation;
    # Start date
    string startDate;
    # Manager email
    string managerEmail;
    # Additional manager emails
    string? additionalManagerEmails;
    # Designation
    string designation;
    # Job role of the user
    string? secondaryJobTitle;
    # Office
    string? office;
    # Business unit
    string businessUnit;
    # Team
    string team;
    # Sub-team
    string subTeam;
    # Unit
    string? unit;
|};

# Business unit.
public type BusinessUnit record {|
    # Business unit ID
    int id;
    # Business unit name
    string name;
|};

# Team.
public type Team record {|
    # Team ID
    int id;
    # Team name
    string name;
|};

# Sub team.
public type SubTeam record {|
    # Sub team ID
    int id;
    # Sub team name
    string name;
|};

# Unit.
public type Unit record {|
    # Unit ID
    int id;
    # Unit name
    string name;
|};

# Organization structure unit.
public type OrgStructureUnit Unit;

# Organization structure sub-team.
public type OrgStructureSubTeam record {|
    # SubTeam ID
    int id;
    # SubTeam name
    string name;
    # Units under this sub-team
    OrgStructureUnit[] units = [];
|};

# Organization structure team.
public type OrgStructureTeam record {|
    # Team ID
    int id;
    # Team name
    string name;
    # Sub-teams under this team
    OrgStructureSubTeam[] subTeams = [];
|};

# Organization structure business unit.
public type OrgStructureBusinessUnit record {|
    # Business unit ID
    int id;
    # Business unit name
    string name;
    # Teams under this business unit
    OrgStructureTeam[] teams = [];
|};

# [Database] Organization structure business unit row with teams as a JSON string.
type OrgStructureBusinessUnitRow record {|
    # Business unit ID
    int id;
    # Business unit name
    string name;
    # Teams under this business unit with their nested sub-teams and units
    json teams;
|};

# Career function.
public type CareerFunction record {|
    # Career function ID
    int id;
    # Career function name
    @sql:Column {name: "career_function"}
    string careerFunction;
|};

# Designation.
public type Designation record {|
    # Designation ID
    int id;
    # Designation name
    string designation;
    # Job band
    @sql:Column {name: "job_band"}
    int jobBand;
|};

# [Database] Company record with allowed locations as a JSON string.
public type CompanyRow record {|
    # Company ID
    int id;
    # Company name
    string name;
    # Company prefix
    string prefix;
    # Company location
    string location;
    # Allowed locations
    string? allowedLocations;
|};

# Allowed location with probation period.
public type AllowedLocation record {|
    # Work location name
    string location;
    # Probation period in months
    int? probationPeriod;
|};

# Company with parsed allowed locations.
public type CompanyResponse record {|
    # Company ID
    int id;
    # Company name
    string name;
    # Company prefix
    string prefix;
    # Company location
    string location;
    # Allowed work locations with probation periods
    AllowedLocation[] allowedLocations;
|};

# Office.
public type Office record {|
    # Office ID
    int id;
    # Office name
    string name;
    # Office location
    string location;
    # Working locations
    @sql:Column {name: "working_locations"}
    json workingLocations;
|};

# Employment type.
public type EmploymentType record {|
    # ID of the employment type
    int id;
    # Name of the employment type
    string name;
|};

# House.
public type House record {|
    # House ID
    int id;
    # House name
    string name;
|};

# Manager payload.
public type Manager record {|
    # Employee ID of the manager
    @sql:Column {name: "employee_id"}
    string employeeId;
    # Manager work email
    @sql:Column {name: "work_email"}
    string workEmail;
|};

# Search employee personal information payload.
public type SearchEmployeePersonalInfoPayload record {|
    # National Identity Card number or Passport
    string nicOrPassport?;
|};

# Emergency contact information.
public type EmergencyContact record {|
    # Name of the emergency contact
    string name;
    # Relationship with the employee
    string relationship;
    # Telephone number of the emergency contact
    string? telephone;
    # Mobile number of the emergency contact
    string mobile;
|};

# Emergency contact row mapping.
public type EmergencyContactRow record {|
    # Name of the emergency contact
    string name;
    # Telephone number of the emergency contact
    string? telephone;
    # Relationship with the employee
    string relationship;
    # Mobile number of the emergency contact
    string mobile;
|};

# [Database] Employee name row mapping for email-to-name lookups.
type EmployeeNameRow record {|
    # Work email of the employee
    @sql:Column {name: "work_email"}
    string workEmail;
    # Full name of the employee
    @sql:Column {name: "full_name"}
    string fullName;
|};

# Additional manager email row mapping.
public type AdditionalManagerEmailRow record {|
    # Additional manager email
    @sql:Column {name: "additional_manager_email"}
    string additionalManagerEmail;
|};

# Create personal info payload.
public type CreatePersonalInfoPayload record {|
    # National Identity Card number or Passport
    string nicOrPassport;
    # First name
    @constraint:String {maxLength: 100}
    string firstName;
    # Last name
    @constraint:String {maxLength: 100}
    string lastName;
    # Full name
    @constraint:String {maxLength: 255}
    string fullName;
    # Title (Mr./Ms./Dr./etc.)
    @constraint:String {maxLength: 20}
    string title;
    # Date of birth
    @constraint:String {pattern: re `^\d{4}-\d{2}-\d{2}$`}
    string dob;
    # Gender of the person
    @constraint:String {maxLength: 20}
    string gender;
    # Personal email address
    @constraint:String {maxLength: 254, pattern: re `${EMAIL_PATTERN_STRING}`}
    string? personalEmail = ();
    # Personal phone number
    @constraint:String {maxLength: 100, pattern: re `${PHONE_PATTERN_STRING}`}
    string? personalPhone = ();
    # Resident number
    @constraint:String {maxLength: 100, pattern: re `${PHONE_PATTERN_STRING}`}
    string? residentNumber = ();
    # Address line 1
    @constraint:String {maxLength: 255}
    string? addressLine1 = ();
    # Address line 2
    @constraint:String {maxLength: 255}
    string? addressLine2 = ();
    # City
    @constraint:String {maxLength: 100}
    string? city = ();
    # State or province
    @constraint:String {maxLength: 100}
    string? stateOrProvince = ();
    # Postal code
    @constraint:String {maxLength: 20}
    string? postalCode = ();
    # Country of residence
    @constraint:String {maxLength: 100}
    string? country = ();
    # Nationality
    @constraint:String {maxLength: 100}
    string nationality;
    # Emergency contacts
    EmergencyContact[]? emergencyContacts = ();
|};

# Create employee payload.
public type CreateEmployeePayload record {|
    # First name of the user
    @constraint:String {maxLength: 150}
    string firstName;
    # Last name of the user
    @constraint:String {maxLength: 150}
    string lastName;
    # Employee's Provident Fund number
    @constraint:String {maxLength: 45}
    string? epf = ();
    # Company ID
    int companyId;
    # Work location
    @constraint:String {maxLength: 100}
    string workLocation;
    # Work email of the user
    @constraint:String {maxLength: 254, pattern: re `${EMAIL_PATTERN_STRING}`}
    string workEmail;
    # Start date
    @constraint:String {pattern: re `${DATE_PATTERN_STRING}`}
    string startDate;
    # Secondary job title
    @constraint:String {maxLength: 100}
    string? secondaryJobTitle = ();
    # Manager email
    @constraint:String {maxLength: 254, pattern: re `${EMAIL_PATTERN_STRING}`}
    string managerEmail;
    # Additional manager emails
    Email[] additionalManagerEmails = [];
    # Employee thumbnail URL
    @constraint:String {maxLength: 2048, pattern: re `${URL_PATTERN_STRING}`}
    string? employeeThumbnail = ();
    # Probation end date
    @constraint:String {pattern: re `${DATE_PATTERN_STRING}`}
    string? probationEndDate = ();
    # Agreement end date
    @constraint:String {pattern: re `${DATE_PATTERN_STRING}`}
    string? agreementEndDate = ();
    # Employment type ID
    int employmentTypeId;
    # Designation ID
    int designationId;
    # Office ID
    int? officeId = ();
    # Team ID
    int teamId;
    # Sub-team ID
    int? subTeamId = ();
    # Business unit ID
    int businessUnitId;
    # Unit ID
    int? unitId = ();
    # House ID
    int? houseId = ();
    # Continuous service record
    @constraint:String {maxLength: 99}
    string? continuousServiceRecord = ();
    # Employee Status
    EmployeeStatus employeeStatus = EMPLOYEE_ACTIVE;
    # Employee ID (required for fixed-term employment type)
    @constraint:String {maxLength: 50}
    string? employeeId = ();
    # Employee personal information
    CreatePersonalInfoPayload personalInfo;
|};

# Employee personal information update payload.
public type UpdateEmployeePersonalInfoPayload record {|
    # National Identity Card number or Passport
    @constraint:String {maxLength: 100}
    string? nicOrPassport = ();
    # First name
    @constraint:String {maxLength: 100}
    string? firstName = ();
    # Last name
    @constraint:String {maxLength: 100}
    string? lastName = ();
    # Full name
    @constraint:String {maxLength: 255}
    string? fullName = ();
    # Title (Mr./Ms./Dr./etc.)
    @constraint:String {maxLength: 20}
    string? title = ();
    # Date of birth
    @constraint:String {pattern: re `^\d{4}-\d{2}-\d{2}$`}
    string? dob = ();
    # Gender of the person
    @constraint:String {maxLength: 20}
    string? gender = ();
    # Nationality
    @constraint:String {maxLength: 100}
    string? nationality = ();
    # Personal email address
    @constraint:String {maxLength: 254, pattern: re `${EMAIL_PATTERN_STRING}`}
    string? personalEmail = ();
    # Personal phone number
    @constraint:String {maxLength: 100, pattern: re `${PHONE_PATTERN_STRING}`}
    string? personalPhone = ();
    # Resident number
    @constraint:String {maxLength: 100, pattern: re `${PHONE_PATTERN_STRING}`}
    string? residentNumber = ();
    # Address line 1
    @constraint:String {maxLength: 255}
    string? addressLine1 = ();
    # Address line 2
    @constraint:String {maxLength: 255}
    string? addressLine2 = ();
    # City
    @constraint:String {maxLength: 100}
    string? city = ();
    # State or province
    @constraint:String {maxLength: 100}
    string? stateOrProvince = ();
    # Postal code
    @constraint:String {maxLength: 20}
    string? postalCode = ();
    # Country of residence
    @constraint:String {maxLength: 100}
    string? country = ();
    # Emergency contacts
    EmergencyContact[]? emergencyContacts = ();
|};

# Employee job information update payload.
public type UpdateEmployeeJobInfoPayload record {|
    # Employee's Provident Fund number
    @constraint:String {maxLength: 45}
    string? epf = ();
    # Company ID
    int? companyId = ();
    # Work location   
    @constraint:String {maxLength: 100}
    string? workLocation = ();
    # Work email - WARNING: Identity key used for authorization checks
    @constraint:String {maxLength: 254, pattern: re `${EMAIL_PATTERN_STRING}`}
    string? workEmail = ();
    # Start date    
    @constraint:String {pattern: re `${DATE_PATTERN_STRING}`}
    string? startDate = ();
    # Secondary job title
    @constraint:String {maxLength: 100}
    string? secondaryJobTitle = ();
    # Manager email
    @constraint:String {maxLength: 254, pattern: re `${EMAIL_PATTERN_STRING}`}
    string? managerEmail = ();
    # Additional manager emails
    Email[]? additionalManagerEmails = ();
    # Employee thumbnail URL
    @constraint:String {maxLength: 2048, pattern: re `${URL_PATTERN_STRING}`}
    string? employeeThumbnail = ();
    # Probation end date
    @constraint:String {pattern: re `${DATE_PATTERN_STRING}`}
    string? probationEndDate = ();
    # Agreement end date
    @constraint:String {pattern: re `${DATE_PATTERN_STRING}`}
    string? agreementEndDate = ();
    # Employment type ID
    int? employmentTypeId = ();
    # Designation ID
    int? designationId = ();
    # Office ID
    int? officeId = ();
    # Team ID
    int? teamId = ();
    # Sub-team ID
    int? subTeamId = ();
    # Business unit ID
    int? businessUnitId = ();
    # Unit ID
    int? unitId = ();
    # House ID
    int? houseId = ();
    # Continuous service record
    @constraint:String {maxLength: 99}
    string? continuousServiceRecord = ();
    # Employee Status
    EmployeeStatus? employeeStatus = ();
    # Final day in office
    @constraint:String {pattern: re `${DATE_PATTERN_STRING}`}
    string? finalDayInOffice = ();
    # Final day of employment 
    @constraint:String {pattern: re `${DATE_PATTERN_STRING}`}
    string? finalDayOfEmployment = ();
    # Resignation reason
    string? resignationReason = ();
|};

# [Database] Insert type for vehicle.
public type AddVehiclePayload record {|
    # Owner of the vehicle
    string owner;
    # Registration number of the vehicle
    string vehicleRegistrationNumber;
    # Type of the vehicle
    VehicleTypes vehicleType;
    # Status of the vehicle
    VehicleStatus vehicleStatus;
    # User who created the vehicle record
    string createdBy;
|};

# [Database] Vehicle type.
public type Vehicle record {|
    *AddVehiclePayload;
    # Auto-increment vehicle ID
    int vehicleId;
    # Timestamp when created
    string createdOn;
    # Timestamp when updated
    string updatedOn;
    # Person who updated the vehicle record
    string updatedBy;
|};

# Database records of vehicle
public type FetchVehicleResponse record {|
    *Vehicle;
    # Total count of the query
    int totalCount;
|};

# Vehicles array with total count.
public type Vehicles record {|
    # List of vehicles.
    Vehicle[] vehicles;
    # Total number of records.
    int totalCount;
|};

# [Database] Update payload of the vehicle.
public type UpdateVehiclePayload record {|
    # Id of the vehicle.
    int vehicleId;
    # Status of the vehicle
    VehicleStatus? vehicleStatus;
    # User who created the vehicle record
    string updatedBy;
|};

# [Database] Parking floor.
public type ParkingFloor record {|
    # Floor identifier
    int id;
    # Floor name (e.g. "Ground Floor")
    string name;
    # Display order of the floor
    int displayOrder;
    # Number of coins per slot on the floor
    decimal coinsPerSlot;
|};

# [Database] Parking slot.
public type ParkingSlot record {|
    # Slot identifier (e.g. B-01)
    string slotId;
    # Floor identifier
    int floorId;
    # Floor name
    string floorName;
    # Number of coins per slot
    decimal coinsPerSlot;
    # Availability status for the given date
    boolean isBooked;
|};

# [Database] Parking slot row mapping.
public type ParkingSlotRow record {|
    # Slot identifier (e.g. B-01)
    string slotId;
    # Floor identifier
    int floorId;
    # Floor name
    string floorName;
    # Number of coins per slot
    decimal coinsPerSlot;
    # Booked status flag (0 = available, 1 = booked)
    int isBooked;
|};

# [Database] Parking reservation.
public type ParkingReservation record {|
    # Reservation identifier
    int id;
    # Slot identifier
    string slotId;
    # Booking date
    string bookingDate;
    # Employee email
    string employeeEmail;
    # Registered vehicle ID
    int vehicleId;
    # Reservation status
    ParkingReservationStatus status;
    # Transaction hash
    string? transactionHash;
    # Amount to be paid in coins
    decimal coinsAmount;
    # Timestamp when created
    string createdOn;
    # Person who created the parking reservation record
    string createdBy;
    # Timestamp when updated
    string updatedOn;
    # Person who updated the parking reservation record
    string updatedBy;
|};

# [Database] Payload to create parking reservation.
public type AddParkingReservationPayload record {|
    # Slot identifier
    string slotId;
    # Booking date
    string bookingDate;
    # Employee email
    string employeeEmail;
    # Registered vehicle ID
    int vehicleId;
    # Amount to be paid in coins
    decimal coinsAmount;
    # User who created the parking reservation record
    string createdBy;
|};

# [Database] Payload to update parking reservation status.
public type UpdateParkingReservationStatusPayload record {|
    # Reservation id
    int reservationId;
    # New status
    ParkingReservationStatus status;
    # Transaction hash
    string? transactionHash;
    # Updated by
    string updatedBy;
|};

# [Database] Parking reservation details (slot, floor, vehicle).
public type ParkingReservationDetails record {|
    # Reservation identifier
    int id;
    # Slot identifier
    string slotId;
    # Booking date
    string bookingDate;
    # Employee email
    string employeeEmail;
    # Registered vehicle ID 
    int vehicleId;
    # Vehicle registration number
    string vehicleRegistrationNumber;
    # Vehicle type
    string? vehicleType;
    # Reservation status
    ParkingReservationStatus status;
    # Transaction hash
    string? transactionHash;
    # Amount to be paid in coins
    decimal coinsAmount;
    # Floor name (e.g. "Ground Floor")
    string floorName;
    # Timestamp when created
    string createdOn;
    # Person who created the parking reservation record
    string createdBy;
    # Timestamp when updated
    string updatedOn;
    # Person who updated the parking reservation record
    string updatedBy;
|};

# [Database] Reservation id row (existence check).
public type ReservationIdRow record {|
    # Reservation identifier
    int id;
|};

# Represents a head or leader of an organization unit.
public type Head record {|
    # Display name of the head
    string name;
    # Work email of the head
    string email;
    # Optional URL to the head's avatar or profile image
    string? avatar = ();
|};

# Represents a functional lead responsible for an organization unit.
public type FunctionalLead record {|
    # Display name of the functional lead
    string name;
    # Work email of the functional lead
    string email;
    # Optional URL to the functional lead's avatar or profile image
    string? avatar = ();
|};

# Represents a unit within the organization hierarchy.
public type OrgUnit record {|
    # Unique identifier of the unit
    int id;
    # Parent mapping: business_unit_team_sub_team_unit.id
    int businessUnitTeamSubTeamUnitId;
    # Parent mapping: business_unit_team_sub_team.id
    int businessUnitTeamSubTeamId;
    # Display name of the unit
    string name;
    # Total number of employees or members in the unit
    int headCount;
    # Optional head or direct manager of the unit
    Head? head = ();
    # Optional functional lead overseeing the unit
    FunctionalLead? functionalLead = ();
|};

# Represents a sub-team within the organization hierarchy.
public type OrgSubTeam record {|
    # Unique identifier of the sub-team
    int id;
    # Parent mapping: business_unit_team_sub_team.id
    int businessUnitTeamSubTeamId;
    # Parent mapping: business_unit_team.id
    int businessUnitTeamId;
    # Display name of the sub-team
    string name;
    # Total number of employees or members in the sub-team
    int headCount;
    # Optional head or direct manager of the sub-team
    Head? head = ();
    # Optional functional lead overseeing the sub-team
    FunctionalLead? functionalLead = ();
    # List of units belonging to this sub-team
    OrgUnit[] units = [];
|};

# Represents a team within the organization hierarchy.
public type OrgTeam record {|
    # Unique identifier of the team
    int id;
    # Parent: business_unit.id
    int businessUnitId;
    # Parent mapping: business_unit_team.id
    int businessUnitTeamId;
    # Display name of the team
    string name;
    # Total number of employees or members in the team
    int headCount;
    # Optional head or direct manager of the team
    Head? head = ();
    # Optional functional lead overseeing the team
    FunctionalLead? functionalLead = ();
    # List of sub-teams belonging to this team
    OrgSubTeam[] subTeams = [];
|};

# Represents a business unit within the organization hierarchy.
public type OrgBusinessUnit record {|
    # Unique identifier of the business unit
    int id;
    # Display name of the business unit
    string name;
    # Total number of employees or members in the business unit
    int headCount;
    # Optional head or direct manager of the business unit
    Head? head = ();
    # List of teams belonging to this business unit
    OrgTeam[] teams = [];
|};

# Represents the top-level company in the organization hierarchy.
public type OrgCompany record {|
    # Unique identifier of the company
    int id;
    # Display name of the company
    string name;
    # Total number of employees or members in the company
    int headCount;
    # List of business units belonging to the company
    OrgBusinessUnit[] businessUnits = [];
|};

# Raw database row type for the top-level company organization response.
public type CompanyRaw record {|
    # Unique identifier of the company
    int id;
    # Display name of the company
    string name;
    # Total number of employees or members in the company
    int headCount;
    # List of business units belonging to the company
    json businessUnits = [];
|};

# Payload for updating an organization unit.
public type UpdateOrgUnitPayload record {|
    # New name for the unit
    string name?;
    # Email of the new head of the unit
    @sql:Column {name: "head_email"}
    string headEmail?;
    # Email of the user performing the update
    @sql:Column {name: "updated_by"}
    string updatedBy;
|};

# Payload for updating a business unit-team mapping.
public type UpdateBusinessUnitTeamPayload record {|
    # Email of the functional lead for the mapping
    @sql:Column {name: "head_email"}
    string functionalLeadEmail?;
    # Email of the user performing the update
    @sql:Column {name: "updated_by"}
    string updatedBy;
|};

# Payload for updating a team-sub team mapping.
public type UpdateTeamSubTeamPayload record {|
    # Email of the functional lead for the mapping
    @sql:Column {name: "head_email"}
    string functionalLeadEmail?;
    # Email of the user performing the update
    @sql:Column {name: "updated_by"}
    string updatedBy;
|};

# Payload for updating a sub team-unit mapping.
public type UpdateSubTeamUnitPayload record {|
    # Email of the functional lead for the mapping
    @sql:Column {name: "head_email"}
    string functionalLeadEmail?;
    # Email of the user performing the update
    @sql:Column {name: "updated_by"}
    string updatedBy;
|};

# Payload for adding a new organization node (business unit, team, sub-team, or unit).
public type OrgNodeInfo record {|
    # Name of the node
    string name;
    # Email of the head of the node
    string headEmail?;
|};

public type CreateBusinessUnitPayload record {|
    # Name of the business unit
    string name;
    # Email of the head of the business unit
    string headEmail?;
|};

public type CreateBusinessUnitTeamPayload record {|
    # ID of the business unit
    int businessUnitId;
    # ID of the team
    int teamId?;
    # Email of the functional lead for the mapping
    string functionalLeadEmail?;
|};

public type CreateTeamPayload record {|
    # Name of the team
    string name;
    # Email of the head of the team
    string headEmail?;
    # Business unit-team mapping details
    CreateBusinessUnitTeamPayload businessUnit;
|};

public type CreateBusinessUnitTeamSubTeamPayload record {|
    # ID of the business unit-team mapping
    int businessUnitTeamId;
    # ID of the sub-team
    int subTeamId?;
    # Email of the functional lead for the mapping
    string functionalLeadEmail?;
|};

public type CreateSubTeamPayload record {|
    # Name of the sub-team
    string name;
    # Email of the head of the sub-team
    string headEmail?;
    # Business unit-team-sub-team mapping details
    CreateBusinessUnitTeamSubTeamPayload businessUnitTeam;
|};

public type CreateBusinessUnitTeamSubTeamUnitPayload record {|
    # ID of the business unit-team-sub-team mapping
    int businessUnitTeamSubTeamId;
    # ID of the unit
    int unitId?;
    # Email of the functional lead for the mapping
    string functionalLeadEmail?;
|};

public type CreateUnitPayload record {|
    # Name of the unit
    string name;
    # Email of the head of the unit
    string headEmail?;
    # Business unit team sub-team details
    CreateBusinessUnitTeamSubTeamUnitPayload businessUnitTeamSubTeamUnit;
|};

public type RenameBusinessUnitName record {|
    int businessUnitId;
    string name;
    string updatedBy;
|};

public type RenameTeamName record {|
    int teamId;
    string name;
    string updatedBy;
|};

public type RenameSubTeamName record {|
    int subTeamId;
    string name;
    string updatedBy;
|};

public type RenameUnitName record {|
    int unitId;
    string name;
    string updatedBy;
|};
