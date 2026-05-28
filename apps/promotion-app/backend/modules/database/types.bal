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
    # Promotion Cycle lead deadline
    string leadDeadline;
    # Promotion Cycle functional lead deadline
    string functionalLeadDeadline;
    # Promotion Cycle promotion board deadline
    string promotionBoardDeadline;
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

# Insert record for hris_promotion_request table.
public type PromotionRequestInsertPayload record {
    # Employee Email
    string employeeEmail;
    # Promotion Job Band 
    int requestedJobBand;
    # Current Job Band
    int currentJobBand;
    # NORMAL | SPECIAL
    string promotionType;
    # Promotion Request Status 
    PromotionRequestStatus status;
    # Applying Promotion Cycle ID
    int promotionCycleId;
};

# Insert record for hris_promotion_request table.
public type PromotionRequestDbInsertPayload record {
    *PromotionRequestInsertPayload;
    # Business Unit
    string businessUnit;
    # Department of the employee
    string? department = ();
    # Team of the employee 
    string? team = ();
    # Sub team of the of the employee
    string? subTeam = ();
    # Current Job Role
    string jobRole;
    # Employee
    string createdBy;
};

# Insert record for hris_promotion_recommendation table.
public type PromotionRecommendationInsertPayload record {
    # Promotion Request ID
    int promotionRequestID;
    # Lead Email
    string leadEmail;
    # Reporting lead or not
    boolean isReportingLead;
    # Recommendation statement
    string? statement = ();
    # Recommendation comment
    string? comment = ();
    # Recommendation Status
    PromotionRecommendationStatus status;
    # Person who created the record
    string createdBy;
};

# Promotion Recommendation Update Payload.
public type PromotionRecommendationUpdatePayload record {
    # Recommendation ID
    int id;
    # Statement
    string? statement = ();
    # Any Other Comments
    string? comments = ();
    # Recommendation Status
    PromotionRecommendationStatus? status = ();
};

# Promotion Recommendation Update Payload.
public type PromotionRecommendationDbUpdatePayload record {
    *PromotionRecommendationUpdatePayload;
    # To identify the last user who modified or updated
    string updatedBy;
    # Expected current status to ensure safe update
    string? expectedStatus;  
    # Expected promotion cycle to ensure consistency
    int? expectedCycleId;
};

# Update record for hris_promotion_recommendation table.
public type ApplicationUpdatePayload record {
    # Promotion Request ID
    int id;
    # Promotion Request statement
    string? statement = ();
    # Promotion Request status
    PromotionRequestStatus? status = ();
    # Job band of the promotion
    int? promotingJobBand = ();
};

# Update record for hris_promotion_recommendation table.
public type ApplicationDbUpdatePayload record {
    *ApplicationUpdatePayload;
    # Business unit of the employee
    string? businessUnit = ();
    # Department of the employee
    string? department = ();
    # Team of the employee
    string? team = ();
    # Sub team of the employee
    string? subTeam = ();
    # Reason for rejection
    string? reasonForRejection = ();
    # Notification email sent status
    int? isNotificationEmailSent = ();
    # To identify the last user who modified or updated
    string updatedBy;
};

# Insert Promotion cycle payload.
public type PromotionCycleInsertData record {
    # Promotion cycle name
    string name;
    # Promotion cycle start date
    string startDate;
    # Promotion cycle end date
    string endDate;
    # Promotion cycle Lead Deadline
    string leadDeadline;
    # Promotion cycle Functional Lead Deadline
    string functionalLeadDeadline;
    # Promotion cycle Promotion Board Deadline
    string promotionBoardDeadline;
    # Promotion cycle status 
    string status;
    # used to identify the creator or author
    string createdBy;
};

# HRIS Config record.
public type Config record {
    # Key of the config
    string key;
    # value of the config
    string value;
    # Additional information
    string? additionalInfo = ();
    # Person who created the record
    string createdBy;
    # Timestamp of record creation
    string createdOn;
    # Person who updated the record
    string updatedBy;
    # Timestamp of record update
    string updatedOn;
};

# Update Promotion cycle payload.
public type PromotionCycleUpdateData record {
    # Promotion cycle id
    int id;
    # Promotion cycle name 
    string? name = ();
    # Promotion cycle start date
    string? startDate = ();
    # Promotion cycle end date
    string? endDate = ();
    # ACTIVE | END
    PromotionCyclesStatus? status = ();
};

# Update Promotion cycle payload.
public type PromotionCycleDbUpdateData record {
    *PromotionCycleUpdateData;
    # To identify the last user who modified or updated
    string updatedBy;
};

# User update database payload.
public type UserDbUpdatePayload record {
    # User id 
    int id;
    # first name of the employee
    string? firstName = ();
    # last name of the employee
    string? lastName = ();
    # functional lead permission
    FunctionalLeadAccessLevels? functionalLeadAccessLevels = ();
    # Job band 
    int? jobBand = ();
    # Email
    string? email = ();
    # Role list
    Role[]? roles = ();
    # User business unit
    string? businessUnit = ();
    # User active state 
    boolean? active = ();
    # To identify the last user who modified or updated
    string updatedBy;
};

# Business Unit.
public type DbBusinessUnit record {
    # Id of the business unit
    int id;
    # Title of the business unit
    string businessUnit;
    # List of departments
    string departments;
};

# User insert payload for database.
public type UserDbInsertPayload record {
    # first name of the employee
    string firstName;
    # last name of the employee
    string lastName;
    # Job band  
    int? jobBand;
    # functional lead permission
    FunctionalLeadAccessLevels? functionalLeadAccessLevels = ();
    # Email 
    string email;
    # Reporting lead or not
    Role[] roles;
    # User business unit
    string? businessUnit = ();
    # used to identify the creator or author
    string createdBy;
};

# Reminder Email record.
public type InsertEmailData record {
    # The unique identifier for the email notification
    @sql:Column {name: "promotion_email_id"}
    int? promotionEmailId = ();
    # The unique identifier for the promotion cycle
    @sql:Column {name: "promotion_cycle_id"}
    int cycleId;
    # The email recipient's email
    @sql:Column {name: "promotion_email_recipient_email"}
    string recipientEmail;
    # The email recipient's name
    @sql:Column {name: "promotion_email_recipient_name"}
    string recipientName;
    # The type of the email
    @sql:Column {name: "promotion_email_type"}
    string emailType;
    # The status of the email
    @sql:Column {name: "promotion_email_status"}
    string status;
    # The email template data
    @sql:Column {name: "promotion_email_template_data"}
    string templateData;
};

# HRIS Config Update Payload.
public type ConfigUpdatePayload record {
    # Key of the config
    string key;
    # value of the config
    string value;
    # Additional information
    string? additionalInfo = ();
    # Person who created the record
    string createdBy;
    # Person who updated the record
    string updatedBy;
};

# Return record for single recommendation lead email.
public type LeadEmail record {|
    # Email of the lead
    string leadEmail;
|};
