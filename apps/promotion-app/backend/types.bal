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
    string? startedJobRole="";
    # Started Business Unit
    string? startedBusinessUnit="";
    # Started Team
    string? startedTeam="";
    # Started Sub Team
    string? startedSubTeam="";
    # Reporting Lead
    string? startedReportingLead="";
    # Joined Job Band
    int? jobBand=();
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
#
# + employeeInfo - Employee Info record
public type EmployeeInfo record {
    EmployeeInfoWithLead employeeInfo;
};

# Employee information with reporting lead.
#
# + workEmail - WSO2 email  
# + startDate - Start Date of at WSO2  
# + jobBand - Job band of the employee  
# + joinedJobRole - Joined Job role  
# + joinedBusinessUnit - Joined Business Unit  
# + joinedDepartment - Joined Department  
# + joinedTeam - Joined Team  
# + joinedLocation - Joined Location  
# + lastPromotedDate - Last Promoted Date  
# + employeeThumbnail - Employee Thumbnail URL
# + reportingLead - Email of the reporting lead  
# + reportingLeadThumbnail - Thumbnail of the reporting lead
public type EmployeeInfoWithLead record {
    string workEmail;
    string startDate;
    int? jobBand = ();
    string? joinedJobRole = "";
    string? joinedBusinessUnit = "";
    string? joinedDepartment = "";
    string? joinedTeam = "";
    string? joinedLocation = "";
    string? lastPromotedDate = "";
    string? employeeThumbnail = "";
    string reportingLead;
    string reportingLeadThumbnail;
};

// Response type for GET promotion/requests
# [Return] Result object of the get user promotion requests resource function.
#
# + promotionRequests - array of promotion requests
type PromotionRequests record {
    database:FullPromotion[] promotionRequests;
};
