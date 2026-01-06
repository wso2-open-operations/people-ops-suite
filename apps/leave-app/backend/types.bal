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
import leave_service.database;
import leave_service.employee;

# Holiday.
public type Holiday record {|
    # Title of the holiday
    string title;
    # Date of the holiday
    string date;
|};

# Calculated leave.
public type CalculatedLeave record {|
    # Number of working days
    float workingDays;
    # Whether the leave has an overlap
    boolean hasOverlap;
    # Message of the leave
    string message?;
    # List of holidays
    Holiday[] holidays?;
|};

# Day.
public type Day record {|
    # string date
    string date;
    # List of holidays
    Holiday[] holidays?;
|};

# Leave stat.
public type LeaveStat record {|
    # Leave type
    string 'type;
    # Number of leave types 
    float count;
|};

# Record for fetched leaves.
public type FetchedLeavesRecord record {|
    # List of leaves
    database:Leave[] leaves;
    # List of leave stats
    LeaveStat[] stats;
|};

# Leave policy.
public type LeavePolicy record {|
    # Annual leave count
    float? annual?;
    # Casual leave count
    float? casual?;
|};

# Leave.
public type Leave record {|
    # Leave ID
    int id;
    # Start date of the leave
    string startDate;
    # End date of the leave
    string endDate;
    # Leave Status
    Status status;
    # Type of the leave
    string leaveType;
    # Period type of the leave
    string periodType;
    # Whether the leave is a morning leave
    boolean? isMorningLeave;
    # Email of the employee
    string email;
    # Created date of the leave
    string createdDate;
    # List of email recipients
    string[] emailRecipients = [];
    # Number of days of the leave
    float numberOfDays;
    # Employee location
    string? location = ();
    # Whether the leave can be cancelled by the user
    boolean isCancelAllowed = false;
|};

# Leave day.
public type LeaveDay record {|
    *database:LeaveDay;
|};

# Leave Entitlement.
public type LeaveEntitlement record {|
    # Year of the leave entitlement
    int year;
    # Employee location
    string? location;
    # Leave policy
    LeavePolicy leavePolicy;
    # Leaves taken after policy adjustment
    LeavePolicy policyAdjustedLeave;
|};

# Leave input for leave creation.
public type LeaveInput record {|
    *database:LeaveInput;
|};

# Leave details.
public type LeaveDetails record {|
    *LeaveInput;
    # Leave ID
    int id;
    # Created date
    string createdDate;
    # Effective days
    LeaveDay[] effectiveDays = [];
    # Calendar event ID
    string? calendarEventId;
    # Number of leave days
    float? numberOfDays = 0.0;
    # Employee location
    string? location;
|};

# Payload for leave creation.
public type LeavePayload record {|
    *database:LeavePayload;
|};

# Leave entity.
public type LeaveResponse record {|
    *database:LeaveResponse;
|};

# Report generation payload.
public type ReportPayload readonly & record {|
    # Start date of the report
    string? startDate = ();
    # End date of the report
    string? endDate = ();
    # Location of employees
    string? location = ();
    # Business unit of employees
    string? businessUnit = ();
    # Department of employees
    string? department = ();
    # Team of employees
    string? team = ();
    # Employee status list
    EmployeeStatus[]? employeeStatuses = DEFAULT_EMPLOYEE_STATUSES;
|};

# User calendar content.
public type UserCalendarInformation record {|
    # List of leaves
    Leave[] leaves;
    # List of holidays
    Holiday[] holidays;
|};

# Employee.
public type Employee record {|
    *employee:Employee;
|};

# Minimal Employee information.
public type MinimalEmployeeInfo record {|
    *employee:MinimalEmployeeInfo;
|};

# Leaves report content.
public type ReportContent map<map<float>>;

# Report filters record
public type ReportFilters record {|
    # List of countries
    string[] countries;
    # List of business units
    employee:OrgStructure orgStructure;
    # Employee statuses
    EmployeeStatus[] employeeStatuses;
|};

# User Info payload.
public type UserInfo record {|
    # Employee Id
    string? employeeId;
    # First name
    string? firstName;
    # Last name
    string? lastName;
    # Work email
    string? workEmail;
    # Lead email
    string? leadEmail;
    # Employee thumbnail
    string? employeeThumbnail;
    # Job role
    string? jobRole;
    # Privileges
    int[] privileges;
    # Employment start date
    string? employmentStartDate;
    # Is lead or not
    boolean? isLead;
    # Is eligible for sabbatical leave or not
    boolean isSabbaticalLeaveEligible = false;
    # Last sabbatical leave end date
    string? lastSabbaticalLeaveEndDate;
    # Subordinate percentage on sabbatical leave
    string? subordinatePercentageOnSabbaticalLeave = ();
|};

# Leave approval status payload.
public type LeaveApprovalStatusPayload record {|
    # Approval status (PENDING/APPROVED/REJECTED)
    database:ApprovalStatus[] status;
|};

# Leave approval status response.
public type LeaveApprovalStatusResponse record {|
    # Employees as a percentage on sabbatical leave under the specific lead
    string percentageOfEmployeesOnSabbaticalLeave;
    # List of leave approval status of employees under the specific lead
    database:LeaveApprovalStatus[] leaveApprovalStatusList;
|};

# Sabbatical leave application payload record.
public type SabbaticalLeaveApplicationPayload record {|
    # Leave start date
    string startDate = "";
    # Leave end date
    string endDate = "";
    # Additional comment
    string additionalComment = "";
|};

# Application configurations.
public type AppConfig record {|
    # Is sabbatical leave enabled or not
    boolean isSabbaticalLeaveEnabled;
    # Sabbatical leave policy URL
    string sabbaticalLeavePolicyUrl;
    # Sabbatical leave user guide URL
    string sabbaticalLeaveUserGuideUrl;
|};

# Sabbatical Leave Response.
public type SabbaticalLeaveResponse record {|
    # Start date
    string startDate;
    # End date
    string endDate;
    # Leave ID
    string id;
    # Location.
    string? location;
|};

# Sabbatical Leave Eligibility Response.
public type SabbaticalLeaveEligibilityResponse record {|
    # Employment start date
    string employmentStartDate;
    # Last sabbatical leave end date
    string lastSabbaticalLeaveEndDate;
    # Is eligible for sabbatical leave
    boolean isEligible;
|};

# APPROVE/REJECT Action enum.
public enum Action {
    APPROVE = "APPROVE",
    REJECT = "REJECT"
};

# Status of the leave.
public enum Status {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    CANCELLED = "CANCELLED"
}

