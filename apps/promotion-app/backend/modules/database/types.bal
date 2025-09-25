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
import ballerinax/mysql;

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

# Functional lead permission
#
# + businessUnits - Business unit array
public type FunctionalLeadAccessLevels record {|
    BusinessUnit[]? businessUnits = [];
|};


# Business Unit Details
#
# + id - id of the business unit  
# + name - name of the BU  
# + departments - department list 
public type BusinessUnit record {|
    int id;
    string name;
    Department[]? departments = [];
|};

# Description
#
# + id - id of the department  
# + name - Department name  
# + teams - Teams list
public type Department record {|
    int id;
    string name;
    Team[]? teams = [];
|};

# Description
#
# + id - id of the team  
# + name - Team name  
# + subTeams - sub team list
public type Team record {|
    int id;
    string name;
    SubTeam[]? subTeams = [];
|};

# Description
#
# + id - id of the sub
# + name - Name of the sub team
public type SubTeam record {|
    int id;
    string name;

|};

# [User] User 
#
# + id - User id
# + firstName - first name of the employee  
# + lastName - last name of the employee 
# + jobBand - Job band   
# + email - Lead Email  
# + roles - Reporting lead or not  
# + functionalLeadAccessLevels - functional lead permission 
# + active - User active state
public type User record {
    int id;
    string firstName;
    string lastName;
    int? jobBand;
    string email;
    Role[] roles = [];
    FunctionalLeadAccessLevels? functionalLeadAccessLevels = ();
    boolean active;
};

# [User] DbUser 
#
# + id - User id  
# + firstName - first name of the employee  
# + lastName - last name of the employee 
# + jobBand - Job band   
# + email - Lead Email  
# + roles - Reporting lead or not  
# + functionalLeadAccessLevels - functional lead permission
# + active - User active state
public type DbUser record {
    int id;
    string firstName;
    string lastName;
    int? jobBand;
    string email;
    string? roles;
    string? functionalLeadAccessLevels = ();
    int active;
};

//Custom Records
# [function specific] Custom record type for promotion request with recommendations
#
# + id - Promotion Request ID  
# + employeeEmail - Employee email  
# + currentJobBand - Current Job Band  
# + currentJobRole - Current Job Role  
# + nextJobBand - Promotion Job Band  
# + promotionCycle - Promotion Cycle  
# + promotionStatement - Promotion Statement  
# + businessUnit - Business unit of the employee  
# + department - Department of the employee  
# + team - Team of the employee  
# + subTeam - Sub Team of the employee  
# + recommendations - Promotion Recommendations Array  
# + createdBy - Person who created the record  
# + createdOn - Time when the record was created  
# + updatedBy - Person who updated the record  
# + updatedOn - Time when the record was updated  
# + promotionType - NORMAL | SPECIAL  
# + status - Promotion Request Status  
# + reasonForRejection - Reason for rejection  
# + isNotificationEmailSent - Notification email sent status
public type FullPromotion record {
    int id;
    string employeeEmail;
    int currentJobBand;
    string currentJobRole;
    int nextJobBand;
    string promotionCycle;
    string? promotionStatement;
    string businessUnit;
    string department;
    string team;
    string? subTeam;
    FullPromotionRecommendation[] recommendations;
    string createdBy;
    string createdOn;
    string updatedBy;
    string updatedOn;
    string promotionType;
    string status;
    string? reasonForRejection;
    boolean isNotificationEmailSent;
};

//new
# [HRIS_Promotion Db] Return record for single promotion recommendation.
public type FullPromotionRecommendation record {|
    # Promotion request id
    int requestId;
    # Promotion type
    string promotionType;
    # Recommendation id
    int recommendationID;
    # Promotion cycle id
    int promotionCycleId;
    # Promotion cycle name
    string promotionCycle;
    # Employee email
    string employeeEmail;
    # Lead email
    string leadEmail;
    # Reporting lead or not
    int reportingLead;
    # Recommendation statement
    string? recommendationStatement;
    # Recommendation comment
    string? recommendationAdditionalComment;
    # Recommendation status
    string recommendationStatus;
    # Recommended job band
    int promotingJobBand;
    # Current job band
    int currentJobBand;
    # Promotion request status
    string promotionRequestStatus;
    # Reason for rejection is any
    string? reasonForRejection = ();
    # Recommendation created by
    string createdBy;
    # Recommendation created on
    string createdOn;
    # Recommendation updated by
    string updatedBy;
    # Recommendation updated on
    string updatedOn;
|};

# [HRIS_Promotion Db] Return record for single promotion cycle.
#
# + id - Promotion Cycle ID  
# + name - Promotion Cycle Name  
# + startDate - Promotion Cycle Start Date  
# + endDate - Promotion Cycle End Date  
# + status - Promotion Cycle status  
# + createdBy - Person who creates the  record 
# + createdOn - Time when creates the  record   
# + updatedBy - Person who updated the  record  
# + updatedOn - Time when updated the  record
public type PromotionCycle record {|
    int id;
    string name;
    string startDate;
    string endDate;
    string status;
    string createdBy;
    string createdOn;
    string updatedBy;
    string updatedOn;

|};

# [HRIS_Promotion Db] Return record for single promotion request.
#
# + id - Promotion Request ID  
# + employeeEmail - Employee email  
# + currentJobBand - Employee's Current Job Band  
# + currentJobRole - Employee's Current Job Role  
# + nextJobBand - Promoting Job Band  
# + promotionStatement - Promotion Statement  
# + promotionCycle - Promotion Cycle Name  
# + businessUnit - Business Unit of the employee  
# + department - Department of the employee  
# + team - Team of the employee  
# + subTeam - Sub Team of the employee  
# + createdBy - Person who creates the  record  
# + createdOn - Time when creates the  record  
# + updatedBy - Person who updated the  record  
# + updatedOn - Time when updated the  record  
# + promotionType - SPECIAL | NORMAL  
# + status - Promotion Request status  
# + reasonForRejection - Reason for rejection  
# + isNotificationEmailSent - Notification email sent or not
public type Promotion record {|
    int id;
    string employeeEmail;
    int currentJobBand;
    string currentJobRole;
    int nextJobBand;
    string? promotionStatement = ();
    string promotionCycle;
    string businessUnit;
    string department;
    string team;
    string? subTeam;
    string createdBy;
    string createdOn;
    string updatedBy;
    string updatedOn;
    string promotionType;
    string status;
    string? reasonForRejection;
    boolean isNotificationEmailSent;
|};
