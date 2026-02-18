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

# Database configs.
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

# Functional lead permission.
public type FunctionalLeadAccessLevels record {|
    # Business unit array
    BusinessUnit[]? businessUnits = [];
|};

# Business Unit Details.
public type BusinessUnit record {|
    # id of the business unit
    int id;
    # name of the BU  
    string name;
    # department list
    Department[]? departments = [];
|};

# Description.
public type Department record {|
    # id of the department 
    int id;
    # Department name
    string name;
    # Teams list
    Team[]? teams = [];
|};

# Description.
public type Team record {|
    # id of the team
    int id;
    # Team name 
    string name;
    # sub team list
    SubTeam[]? subTeams = [];
|};

# Description.
public type SubTeam record {|
    # id of the sub
    int id;
    # Name of the sub team
    string name;

|};

# User.
public type User record {
    # User id
    int id;
    # first name of the employee
    string firstName;
    # last name of the employee
    string lastName;
    # Job band
    int? jobBand;
    # Lead Email
    string email;
    # Reporting lead or not
    Role[] roles = [];
    # functional lead permission 
    FunctionalLeadAccessLevels? functionalLeadAccessLevels = ();
    # User active state
    boolean active;
};

# DbUser.
public type DbUser record {
    # User id
    int id;
    # first name of the employee 
    string firstName;
    # last name of the employee 
    string lastName;
    # Job band
    int? jobBand;
    # Lead Email
    string email;
    # Reporting lead or not
    string? roles;
    # functional lead permission
    string? functionalLeadAccessLevels = ();
    # User active state
    int active;
};

# Custom record type for promotion request with recommendations.
public type FullPromotion record {
    # Promotion Request ID 
    int id;
    # Employee email
    string employeeEmail;
    # Current Job Band
    int currentJobBand;
    # Current Job Role
    string currentJobRole;
    # Promotion Job Band
    int nextJobBand;
    # Promotion Cycle
    string promotionCycle;
    # Promotion Statement
    string? promotionStatement;
    # Business unit of the employee
    string businessUnit;
    # Department of the employee
    string department;
    # Team of the employee
    string team;
    # Sub Team of the employee
    string? subTeam;
    # Promotion Recommendations Array
    FullPromotionRecommendation[] recommendations;
    # Person who created the record 
    string createdBy;
    # Time when the record was created
    string createdOn;
    # Person who updated the record 
    string updatedBy;
    # Time when the record was updated
    string updatedOn;
    # NORMAL | SPECIAL
    string promotionType;
    # Promotion Request Status
    string status;
    # Reason for rejection
    string? reasonForRejection;
    # Notification email sent status
    boolean isNotificationEmailSent;
};

# Return record for single promotion recommendation.
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

# Return record for single promotion cycle.
public type PromotionCycle record {|
    # Promotion Cycle ID 
    int id;
    # Promotion Cycle Name
    string name;
    # Promotion Cycle Start Date
    string startDate;
    # Promotion Cycle End Date
    string endDate;
    # Promotion Cycle status
    string status;
    # Person who creates the  record
    string createdBy;
    # Time when creates the  record
    string createdOn;
    # Person who updated the  record
    string updatedBy;
    # Time when updated the  record
    string updatedOn;

|};

# Return record for single promotion request.
public type Promotion record {|
    # Promotion Request ID 
    int id;
    # Employee email
    string employeeEmail;
    # Employee's Current Job Band
    int currentJobBand;
    # Employee's Current Job Role
    string currentJobRole;
    # Promoting Job Band
    int nextJobBand;
    # Promotion Statement
    string? promotionStatement = ();
    # Promotion Cycle Name
    string promotionCycle;
    # Business Unit of the employee
    string businessUnit;
    # Department of the employee
    string department;
    # Team of the employee
    string team;
    # Sub Team of the employee
    string? subTeam;
    # Person who creates the  record
    string createdBy;
    # Time when creates the  record 
    string createdOn;
    # Person who updated the  record
    string updatedBy;
    # Time when updated the  record
    string updatedOn;
    # SPECIAL | NORMAL
    string promotionType;
    # Promotion Request status
    string status;
    # Reason for rejection
    string? reasonForRejection;
    # Notification email sent or not
    boolean isNotificationEmailSent;
|};
