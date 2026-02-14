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
    # Started Date
    JoinedDetails joinedDetails;
    # Job role
    string jobRole;
    # Thumbnail of the employee
    string? employeeThumbnail;
    # User Privileges
    int[] privileges;
|};

# Represents the response structure for retrieving user information.
public type JoinedDetails record {|
    # Started Date
    string startDate;
    # Started Job Role
    string? startedJobRole = "";
    # Started Business Unit
    string? startedBusinessUnit = "";
    # Started Team
    string? startedTeam = "";
    # Started Sub Team
    string? startedSubTeam = "";
    # Reporting Lead
    string? startedReportingLead = "";
    # Joined Job Band
    int? jobBand = ();
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

# Response type for GET employee-info.
public type EmployeeInfo record {
    # Employee Info record
    EmployeeInfoWithLead employeeInfo;
};

# Employee information with reporting lead.
public type EmployeeInfoWithLead record {
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
