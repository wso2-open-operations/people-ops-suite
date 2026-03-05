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
import promotion_app.database;
import promotion_app.people;

# Represents the response structure for retrieving user information.
public type UserInfoResponse record {|
    # Id of the employee
    string employeeId;
    # Email of the employee
    string workEmail;
    # First name of the employee
    string firstName;
    # Last name of the employee
    string lastName;
    # Job role
    string jobRole;
    # Thumbnail of the employee
    string? employeeThumbnail;
    # User Privileges
    int[] privileges;
|};

# Represent the name and email address of a support team.
public type SupportTeamEmail record {|
    # Name of the support team
    string team;
    # Email address of the support team
    string email;
|};

# List of App Configurations.
public type AppConfig record {|
    # List of support team emails
    SupportTeamEmail[] supportTeamEmails;
|};

# Employee information with reporting lead.
public type EmployeeJoinedDetails record {
    # WSO2 email
    string workEmail;
    # Start Date of at WSO2
    string startDate;
    # Job band of the employee
    int? jobBand = ();
    # Joined Job role
    string? joinedJobRole = "";
    # Joined Business Unit
    string? joinedBusinessUnit = "";
    # Joined Department
    string? joinedDepartment = "";
    # Joined Team
    string? joinedTeam = "";
    # Joined Location
    string? joinedLocation = "";
    # Last Promoted Date
    string? lastPromotedDate = "";
    # Employee Thumbnail URL
    string? employeeThumbnail = "";
    # Email of the reporting lead
    string reportingLead;
};

# Result object of the get user promotion requests resource function.
type Promotions record {
    # array of promotion requests
    database:FullPromotion[] promotionRequests;
};
# Result object of the get promotion cycle resource function.
type PromotionCycles record {
    # Array of promotion cycles
    database:PromotionCycle[] promotionCycles;
};

# Result object of the get employees resource function.
type Employees record {
    # List of employees based on the filter Lead or not
    people:EmployeeInfo[] employees;
};

// Response type for POST promotion/request/
# Result object of the Update promotion request resource function.
type ApplicationInfo record {
    # New Application ID
    int applicationID;
};

# Promotion Request application payload.
public type Application record {
    # Promotion cycle id
    int PromotionCycleID;
    # Promotion application type
    string 'type;
    # Employee email
    string employeeEmail;
    # Promoting job band for the special promotion
    int? promotingJobBand = ();
    # Promotion recommendation statement for the special promotion
    string? statement = ();
    # Promotion recommendation comment for the special promotion
    string? comment = ();
};
