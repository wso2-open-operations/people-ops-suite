// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import par_app.types;

import ballerina/sql;
import ballerinax/mysql;

# Database client configurations.
type DbClientConfig record {|
    # The username for the MySQL server
    string user;
    # The password for the MySQL server
    string password;
    # The name of the database
    string database;
    # The host of the MySQL server
    string host;
    # The port of the MySQL server
    int port;
    # The `mysql:Options` configurations
    mysql:Options options?;
    # The `sql:ConnectionPool` configurations
    sql:ConnectionPool connectionPool?;
|};

# The record type for the ParCycle table.
public type ParCycle record {|
    # The unique identifier for the PAR cycle
    @sql:Column {name: "par_cycle_id"}
    int parCycleId?;
    # The name of the PAR cycle
    @sql:Column {name: "par_cycle_name"}
    string parCycleName;
    # The start date of the PAR cycle
    @sql:Column {name: "par_cycle_start_date"}
    string parCycleStartDate;
    # The end date of the PAR cycle
    @sql:Column {name: "par_cycle_end_date"}
    string parCycleEndDate;
    # The start date of the evaluation period
    @sql:Column {name: "par_evaluation_start_date"}
    string parEvaluationStartDate;
    # The end date of the evaluation period
    @sql:Column {name: "par_evaluation_end_date"}
    string parEvaluationEndDate;
    # The deadline for special ratings
    @sql:Column {name: "par_special_rating_deadline"}
    string parSpecialRatingDeadline;
    # The deadline for face to face meetings
    @sql:Column {name: "par_f2f_deadline"}
    string parF2FDeadline;
    # The deadline for 360 ratings
    @sql:Column {name: "par_three_sixty_rating_deadline"}
    string parThreeSixtyRatingDeadline;
    # The deadline for employee ratings
    @sql:Column {name: "par_employee_deadline"}
    string parEmployeeDeadline;
    # The deadline for lead ratings
    @sql:Column {name: "par_lead_deadline"}
    string parLeadDeadline;
    # The configurations for the PAR cycle
    @sql:Column {name: "par_cycle_config"}
    string parCycleConfigurations;
    # The status of the PAR cycle
    @sql:Column {name: "par_cycle_status"}
    types:ParCycleStatus parCycleStatus?;
    # The user who created the PAR cycle
    @sql:Column {name: "par_cycle_created_by"}
    string parCycleCreatedBy?;
    # The date the PAR cycle was created
    @sql:Column {name: "par_cycle_created_on"}
    string parCycleCreatedOn?;
    # The user who last updated the PAR cycle
    @sql:Column {name: "par_cycle_updated_by"}
    string parCycleUpdatedBy?;
    # The date the PAR cycle was last updated
    @sql:Column {name: "par_cycle_updated_on"}
    string parCycleUpdatedOn?;
|};

# The record type for the ParCycleConfigurations.
public type ParCycleConfigurationsOptionalized record {|
    # The question for the employee PAR
    string employeeParQuestion?;
    # The question for the 360 review
    string threeSixtyReviewQuestion?;
    # The ratings for the PAR
    string[] parRatings?;
    # The ratings for the 360 review
    string[] threeSixtyReviewRatings?;
|};

# The record type for the ParCycle table with optional fields.
public type ParCycleOptionalized record {|
    # The unique identifier for the PAR cycle
    int parCycleId;
    # The name of the PAR cycle
    string parCycleName?;
    # The start date of the PAR cycle
    string parCycleStartDate?;
    # The end date of the PAR cycle
    string parCycleEndDate?;
    # The start date of the evaluation period
    string parEvaluationStartDate?;
    # The end date of the evaluation period
    string parEvaluationEndDate?;
    # The deadline for special ratings
    string parSpecialRatingDeadline?;
    # The deadline for face to face meetings
    string parF2FDeadline?;
    # The deadline for 360 ratings
    string parThreeSixtyRatingDeadline?;
    # The deadline for employee ratings
    string parEmployeeDeadline?;
    # The deadline for lead ratings
    string parLeadDeadline?;
    # The configurations for the PAR cycle
    string parCycleConfigurations?;
    # The status of the PAR cycle
    types:ParCycleStatus parCycleStatus?;
    # The user who created the PAR cycle
    string parCycleCreatedBy?;
    # The timestamp the PAR cycle was created
    string parCycleCreatedOn?;
    # The user who last updated the PAR cycle
    string parCycleUpdatedBy?;
    # The timestamp the PAR cycle was last updated
    string parCycleUpdatedOn?;
|};

# The record type for the ParRating table.
public type ParRating record {|
    # The unique identifier for the PAR rating
    @sql:Column {name: "par_rating_id"}
    int parRatingId?;
    # The email of the employee
    @sql:Column {name: "par_employee_email"}
    string parEmployeeEmail;
    # The name of the employee
    @sql:Column {name: "par_employee_name"}
    string parEmployeeName;
    # The unique identifier for the PAR cycle
    @sql:Column {name: "par_cycle_id"}
    int parCycleId;
    # The company of the employee
    @sql:Column {name: "par_company"}
    string parCompany;
    # The location of the employee
    @sql:Column {name: "par_location"}
    string parLocation;
    # The unique identifier for the PAR team
    @sql:Column {name: "par_team_id"}
    int parTeamId;
    # The par rating of the employee
    @sql:Column {name: "par_rating"}
    string parRating;
    # The special rating of the employee
    @sql:Column {name: "par_special_rating"}
    string parSpecialRating;
    # The par comment of the employee
    @sql:Column {name: "par_employee_comment"}
    string parEmployeeComment?;
    # The status of the employee par rating
    @sql:Column {name: "par_employee_status"}
    types:ParEmployeeStatus parEmployeeStatus;
    # The par comment of the lead
    @sql:Column {name: "par_lead_comment"}
    string parLeadComment?;
    # The status of the lead par rating
    @sql:Column {name: "par_lead_status"}
    types:ParLeadStatus parLeadStatus;
    # The status of the face to face meeting
    @sql:Column {name: "par_f2f_status"}
    types:ParF2fStatus parF2fStatus;
    # The date of the face-to-face meeting
    @sql:Column {name: "par_f2f_date"}
    string parF2fDate?;
    # The status of the employee acceptance
    @sql:Column {name: "par_employee_acceptance_status"}
    types:ParEmployeeAcceptanceStatus parEmployeeAcceptanceStatus;
    # The comment of the employee acceptance
    @sql:Column {name: "par_employee_acceptance_comment"}
    string parEmployeeAcceptanceComment?;
    # The comment of the HR admin
    @sql:Column {name: "par_admin_comment"}
    string parAdminComment?;
    # The user who created the PAR rating
    @sql:Column {name: "par_rating_created_by"}
    string parRatingCreatedBy?;
    # The timestamp the PAR rating was created
    @sql:Column {name: "par_rating_created_on"}
    string parRatingCreatedOn?;
    # The user who last updated the PAR rating
    @sql:Column {name: "par_rating_updated_by"}
    string parRatingUpdatedBy?;
    # The user who last shared the PAR rating
    @sql:Column {name: "par_rating_shared_by"}
    string parRatingSharedBy?;
    # The timestamp the PAR rating was last updated
    @sql:Column {name: "par_rating_updated_on"}
    string parRatingUpdatedOn?;
    # Proof document link confirming prior notice of weak rating
    @sql:Column {name: "par_performance_notice_ack"}
    string parPerformanceNoticeAck?;
    # Indication of the eligibility for special rating
    @sql:Column {name: "par_special_rating_eligibility"}
    boolean parSpecialRatingEligibility;
|};

# The record type for the additional report's ParRating.
public type AdditionalReportsParRating record {|
    # The unique identifier for the PAR rating
    @sql:Column {name: "par_rating_id"}
    int parRatingId;
    # The email of the employee
    @sql:Column {name: "par_employee_email"}
    string parEmployeeEmail;
    # The name of the employee
    @sql:Column {name: "par_employee_name"}
    string parEmployeeName;
    # The unique identifier for the PAR cycle
    @sql:Column {name: "par_cycle_id"}
    int parCycleId;
    # The company of the employee
    @sql:Column {name: "par_company"}
    string parCompany;
    # The location of the employee
    @sql:Column {name: "par_location"}
    string parLocation;
    # The unique identifier for the PAR team
    @sql:Column {name: "par_team_id"}
    int parTeamId;
    # The par rating of the employee
    @sql:Column {name: "par_rating"}
    string parRating;
    # The special rating of the employee
    @sql:Column {name: "par_special_rating"}
    string parSpecialRating;
    # The par comment of the employee
    @sql:Column {name: "par_employee_comment"}
    string parEmployeeComment?;
    # The status of the employee par rating
    @sql:Column {name: "par_employee_status"}
    types:ParEmployeeStatus parEmployeeStatus;
    # The par comment of the lead
    @sql:Column {name: "par_lead_comment"}
    string parLeadComment?;
    # The status of the lead par rating
    @sql:Column {name: "par_lead_status"}
    types:ParLeadStatus parLeadStatus;
    # The status of the face to face meeting
    @sql:Column {name: "par_f2f_status"}
    types:ParF2fStatus parF2fStatus;
    # The date of the face-to-face meeting
    @sql:Column {name: "par_f2f_date"}
    string parF2fDate?;
    # The status of the employee acceptance
    @sql:Column {name: "par_employee_acceptance_status"}
    types:ParEmployeeAcceptanceStatus parEmployeeAcceptanceStatus;
    # The comment of the employee acceptance
    @sql:Column {name: "par_employee_acceptance_comment"}
    string parEmployeeAcceptanceComment?;
    # The comment of the HR admin
    @sql:Column {name: "par_admin_comment"}
    string parAdminComment?;
    # The user who created the PAR rating
    @sql:Column {name: "par_rating_created_by"}
    string parRatingCreatedBy?;
    # The timestamp the PAR rating was created
    @sql:Column {name: "par_rating_created_on"}
    string parRatingCreatedOn?;
    # The user who last updated the PAR rating
    @sql:Column {name: "par_rating_updated_by"}
    string parRatingUpdatedBy?;
    # The timestamp the PAR rating was last updated
    @sql:Column {name: "par_rating_updated_on"}
    string parRatingUpdatedOn?;
    # The type of the leads report
    @sql:Column {name: "reportType"}
    string reportType;
    # The direct lead of the employee
    @sql:Column {name: "employee_lead"}
    string? employeeLead;
|};

# The record type for the ParRating with lead data.
public type ParRatingWithLevels record {|
    # The unique identifier for the PAR rating
    @sql:Column {name: "par_rating_id"}
    int parRatingId;
    # The email of the employee
    @sql:Column {name: "par_employee_email"}
    string parEmployeeEmail;
    # The name of the employee
    @sql:Column {name: "par_employee_name"}
    string parEmployeeName;
    # The unique identifier for the PAR cycle
    @sql:Column {name: "par_cycle_id"}
    int parCycleId;
    # The business unit of the employee
    @sql:Column {name: "par_business_unit"}
    string parBusinessUnit;
    # The department of the employee
    @sql:Column {name: "par_department"}
    string parDepartment;
    # Team id of the employee
    @sql:Column {name: "par_team_id"}
    int parTeamId;
    # The team of the employee
    @sql:Column {name: "par_team"}
    string parTeam?;
    # The sub team of the employee
    @sql:Column {name: "par_sub_team"}
    string parSubTeam?;
    # The email of the lead
    @sql:Column {name: "par_lead_email"}
    string parLeadEmail;
    # The par rating of the employee
    @sql:Column {name: "par_rating"}
    string parRating;
    # The special rating of the employee
    @sql:Column {name: "par_special_rating"}
    string parSpecialRating?;
    # The par comment of the employee
    @sql:Column {name: "par_employee_comment"}
    string parEmployeeComment?;
    # The status of the employee par rating
    @sql:Column {name: "par_employee_status"}
    types:ParEmployeeStatus parEmployeeStatus;
    # The par comment of the lead
    @sql:Column {name: "par_lead_comment"}
    string parLeadComment?;
    # The status of the lead par rating
    @sql:Column {name: "par_lead_status"}
    types:ParLeadStatus parLeadStatus;
    # The status of the face to face meeting
    @sql:Column {name: "par_f2f_status"}
    types:ParF2fStatus parF2fStatus;
    # The date of the face-to-face meeting
    @sql:Column {name: "par_f2f_date"}
    string parF2fDate?;
    # The status of the employee acceptance
    @sql:Column {name: "par_employee_acceptance_status"}
    types:ParEmployeeAcceptanceStatus parEmployeeAcceptanceStatus;
    # The comment of the employee acceptance
    @sql:Column {name: "par_employee_acceptance_comment"}
    string parEmployeeAcceptanceComment?;
    # The comment of the HR admin
    @sql:Column {name: "par_admin_comment"}
    string parAdminComment?;
    # The user who created the PAR rating
    @sql:Column {name: "par_rating_created_by"}
    string parRatingCreatedBy?;
    # The timestamp the PAR rating was created
    @sql:Column {name: "par_rating_created_on"}
    string parRatingCreatedOn?;
    # The user who last updated the PAR rating
    @sql:Column {name: "par_rating_updated_by"}
    string parRatingUpdatedBy?;
    # The timestamp the PAR rating was last updated
    @sql:Column {name: "par_rating_updated_on"}
    string parRatingUpdatedOn?;
    # Indication of is the employee a lead
    @sql:Column {name: "is_employee_lead"}
    string isEmployeeALead;
|};

# The record type for the ParRating table with optional fields.
public type ParRatingOptionalized record {|
    # The unique identifier for the PAR rating
    int parRatingId;
    # The par rating of the employee
    string parRating?;
    # The special rating of the employee
    string parSpecialRating?;
    # The par comment of the employee
    string parEmployeeComment?;
    # The status of the employee par rating
    types:ParEmployeeStatus parEmployeeStatus?;
    # The par comment of the lead
    string parLeadComment?;
    # The status of the lead par rating
    types:ParLeadStatus parLeadStatus?;
    # The status of the face to face meeting
    types:ParF2fStatus parF2fStatus?;
    # The date of the face-to-face meeting
    string parF2fDate?;
    # The status of the employee acceptance
    types:ParEmployeeAcceptanceStatus parEmployeeAcceptanceStatus?;
    # The comment of the employee acceptance
    string parEmployeeAcceptanceComment?;
    # The comment of the HR admin
    string parAdminComment?;
    # The user who last updated the PAR rating
    string parRatingUpdatedBy;
    # Proof document link confirming prior notice of weak rating
    string parPerformanceNoticeAck?;
|};

# The record type for the ParTeam table.
public type ParTeam record {|
    # The unique identifier for the PAR team
    @sql:Column {name: "par_team_id"}
    int parTeamId?;
    # The unique identifier for the PAR cycle
    @sql:Column {name: "par_cycle_id"}
    int parCycleId;
    # The name of the Business Unit
    @sql:Column {name: "par_business_unit"}
    string parBusinessUnit;
    # The name of the Department
    @sql:Column {name: "par_department"}
    string parDepartment;
    # The name of the Team
    @sql:Column {name: "par_team"}
    string parTeam?;
    # The name of the Sub Team
    @sql:Column {name: "par_sub_team"}
    string parSubTeam?;
    # The email of the lead
    @sql:Column {name: "par_lead_email"}
    string parLeadEmail?;
    # The unique identifier for the special rating group
    @sql:Column {name: "par_special_rating_group_id"}
    int parSpecialRatingGroupId?;
    # The user who created the PAR team
    @sql:Column {name: "par_team_created_by"}
    string parTeamCreatedBy?;
    # The date the PAR team was created
    @sql:Column {name: "par_team_created_on"}
    string parTeamCreatedOn?;
    # The user who last updated the PAR team
    @sql:Column {name: "par_team_updated_by"}
    string parTeamUpdatedBy?;
    # The date the PAR team was last updated
    @sql:Column {name: "par_team_updated_on"}
    string parTeamUpdatedOn?;
|};

# The record type for the ParSpecialRatingGroup table.
public type ParSpecialRatingGroup record {|
    # The unique identifier for the special rating group
    @sql:Column {name: "par_special_rating_group_id"}
    int parSpecialRatingGroupId?;
    # The unique identifier for the PAR cycle
    @sql:Column {name: "par_cycle_id"}
    int parCycleId;
    # The name of the Business Unit
    @sql:Column {name: "par_business_unit"}
    string parBusinessUnit;
    # The name of the Department
    @sql:Column {name: "par_department"}
    string parDepartment;
    # The name of the Team
    @sql:Column {name: "par_team"}
    string parTeam;
    # The unique identifier for the special rating quota
    @sql:Column {name: "par_special_quota_id"}
    int parSpecialQuotaId?;
    # The user who created the special rating group
    @sql:Column {name: "par_sr_group_created_by"}
    string parSrGroupCreatedBy?;
    # The date the special rating group was created
    @sql:Column {name: "par_sr_group_created_on"}
    string parSrGroupCreatedOn?;
    # The user who last updated the special rating group
    @sql:Column {name: "par_sr_group_updated_by"}
    string parSrGroupUpdatedBy?;
    # The date the special rating group was last updated
    @sql:Column {name: "par_sr_group_updated_on"}
    string parSrGroupUpdatedOn?;
|};

# The record type for the ParSpecialRatingGroup table.
public type ParSpecialRatingGroupWithHeadCount record {|
    # The unique identifier for the special rating group
    @sql:Column {name: "par_special_rating_group_id"}
    int parSpecialRatingGroupId?;
    # The unique identifier for the PAR cycle
    @sql:Column {name: "par_cycle_id"}
    int parCycleId;
    # The name of the Business Unit
    @sql:Column {name: "par_business_unit"}
    string parBusinessUnit;
    # The name of the Department
    @sql:Column {name: "par_department"}
    string parDepartment;
    # The name of the Team
    @sql:Column {name: "par_team"}
    string parTeam;
    # The par group head count
    @sql:Column {name: "group_head_count"}
    int parGroupHeadCount;
|};

# The record type for the ParSpecialRatingQuota table.
public type ParSpecialRatingQuota record {|
    # The unique identifier for the special rating quota
    @sql:Column {name: "par_quota_id"}
    int parQuotaId?;
    # The unique identifier for the PAR cycle
    @sql:Column {name: "par_cycle_id"}
    int parCycleId;
    # The special rating quota name
    @sql:Column {name: "par_special_quota_name"}
    string parQuotaName;
    # The top 5 quota
    @sql:Column {name: "par_top5_quota"}
    int parTop5Quota;
    # The top 20 quota
    @sql:Column {name: "par_top20_quota"}
    int parTop20Quota;
    # The user who created the special rating quota
    @sql:Column {name: "par_sr_quota_created_by"}
    string parSrQuotaCreatedBy?;
    # The date the special rating quota was created
    @sql:Column {name: "par_sr_quota_created_on"}
    string parSrQuotaCreatedOn?;
    # The user who last updated the special rating quota
    @sql:Column {name: "par_sr_quota_updated_by"}
    string parSrQuotaUpdatedBy?;
    # The date the special rating quota was last updated
    @sql:Column {name: "par_sr_quota_updated_on"}
    string parSrQuotaUpdatedOn?;
    # The array of allocated leads to the group
    @sql:Column {name: "par_allowed_leads"}
    string[] allocatedLeads?;
|};

# The record type for the ParTeamSummary.
public type ParTeamSummary record {|
    # The business unit of the employee
    @sql:Column {name: "par_team_id"}
    int parTeamId;
    # The business unit of the employee
    @sql:Column {name: "par_cycle_id"}
    int parCycleId;
    # The business unit of the employee
    @sql:Column {name: "par_business_unit"}
    string parBusinessUnit;
    # The department of the employee
    @sql:Column {name: "par_department"}
    string parDepartment;
    # The team of the employee
    @sql:Column {name: "par_team"}
    string parTeam?;
    # The sub team of the employee
    @sql:Column {name: "par_sub_team"}
    string parSubTeam?;
    # The lead's email
    @sql:Column {name: "par_lead_email"}
    string parLeadEmail?;
    # The special rating group id
    @sql:Column {name: "par_special_rating_group_id"}
    int parSpecialRatingGroupId;
    # The par team count
    @sql:Column {name: "par_team_count"}
    int parTeamCount;
    # The employee completed count
    @sql:Column {name: "par_employee_completed_count"}
    int parEmployeeCompletedCount;
    # The lead completed count
    @sql:Column {name: "par_lead_completed_count"}
    int parLeadCompletedCount;
    # The F2F completed count
    @sql:Column {name: "par_f2f_completed_count"}
    int parF2fCompletedCount;
|};

# The record type for the Par360Review table.
public type Par360Review record {|
    # The email of the employee
    @sql:Column {name: "par_employee_email"}
    string parEmployeeEmail;
    # The email of the reviewer
    @sql:Column {name: "par_reviewer_email"}
    string parReviewerEmail;
    # The unique identifier for the PAR cycle
    @sql:Column {name: "par_cycle_id"}
    int parCycleId;
    # The par 360 rating
    @sql:Column {name: "par_360_rating"}
    string par360Rating;
    # The par 360 comment
    @sql:Column {name: "par_360_comment"}
    string par360Comment?;
    # The status of the par 360 review
    @sql:Column {name: "par_360_status"}
    types:Par360ReviewStatus par360Status;
    # Whether the employee requested the review
    @sql:Column {name: "par_360_employee_requested"}
    boolean isEmployeeRequested;
    # Whether the lead requested the review
    @sql:Column {name: "par_360_lead_requested"}
    boolean isLeadRequested;
    # The user who created the par 360 review
    @sql:Column {name: "par_360_created_by"}
    string par360CreatedBy?;
    # The timestamp the par 360 review was created
    @sql:Column {name: "par_360_created_on"}
    string par360CreatedOn?;
    # The user who last updated the par 360 review
    @sql:Column {name: "par_360_updated_by"}
    string par360UpdatedBy?;
    # The timestamp the par 360 review was last updated
    @sql:Column {name: "par_360_updated_on"}
    string par360UpdatedOn?;
|};

# The record type for the ParCurrentSpecialRatings table.
public type ParCurrentSpecialRatings record {|
    # The unique identifier for the PAR cycle
    @sql:Column {name: "par_cycle_id"}
    int parCycleId;
    # The special rating quota id
    @sql:Column {name: "par_special_quota_id"}
    int parSpecialRatingQuotaId;
    # The top 5 quota
    @sql:Column {name: "top_5_count"}
    int parTop5Count;
    # The top 20 quota
    @sql:Column {name: "top_20_count"}
    int parTop20Count;
|};

public type ParConfiguration record {|
    # The key for the configuration
    @sql:Column {name: "par_config_key"}
    string parConfigKey;
    # The value for the configuration
    @sql:Column {name: "par_config_value"}
    string parConfigValue;
    # The user who created the par configuration
    @sql:Column {name: "par_config_created_by"}
    string parConfigCreatedBy?;
    # The timestamp the par configuration was created
    @sql:Column {name: "par_config_created_on"}
    string parConfigCreatedOn?;
    # The user who last updated the par configuration
    @sql:Column {name: "par_config_updated_by"}
    string parConfigUpdatedBy?;
    # The timestamp the par configuration was last updated
    @sql:Column {name: "par_config_updated_on"}
    string parConfigUpdatedOn?;
|};

public type EmailNotification record {|
    # The unique identifier for the email notification
    @sql:Column {name: "par_email_id"}
    int parEmailId?;
    # The unique identifier for the PAR cycle
    @sql:Column {name: "par_cycle_id"}
    int parCycleId;
    # The email recipient's email
    @sql:Column {name: "par_email_recipient_email"}
    string recipientEmail;
    # The email recipient's name
    @sql:Column {name: "par_email_recipient_name"}
    string recipientName;
    # The type of the email
    @sql:Column {name: "par_email_type"}
    types:EmailType emailType;
    # The email trigger details
    @sql:Column {name: "par_email_trigger_details"}
    string emailTriggerDetails;
    # The status of the email
    @sql:Column {name: "par_email_status"}
    types:EmailStatus emailStatus;
    # The email template data
    @sql:Column {name: "par_email_template_data"}
    string emailTemplateData;
|};

# The EmployeeStatus represents the status of an employee.
public enum EmployeeStatus {
    EmployeeStatusMarkedLeaver = "Marked leaver",
    EmployeeStatusActive = "Active",
    EmployeeStatusLeft = "Left"
}

# The Par360ReviewStatus represents possible statuses of 360 degree reviews in a performance appraisal cycle.
public enum Par360ReviewStatus {
    PENDING,
    DRAFT,
    SHARED,
    REJECTED
}

# The participant record
public type Participant record {|
    # The email of the participating employee
    @sql:Column {name: "par_employee_email"}
    string workEmail;
    # The name of the participating employee
    @sql:Column {name: "par_employee_name"}
    string employeeName;
|};

# The record type for the rejected review request table.
public type RejectedReview record {|
    # The email of the reviewee
    @sql:Column {name: "par_employee_email"}
    string employeeEmail;
    # The email of the reviewer
    @sql:Column {name: "par_reviewer_email"}
    string reviewerEmail;
    # The type of the feedback (offered/requested)
    @sql:Column {name: "is_offered_feedback"}
    string isOfferedFeedback;
|};

# The basic record type for the ParTeam table.
public type BasicParTeam record {|
    # The unique identifier for the PAR team
    @sql:Column {name: "par_team_id"}
    int parTeamId;
    # The unique identifier for the PAR cycle
    @sql:Column {name: "par_cycle_id"}
    int parCycleId;
    # The name of the business unit
    @sql:Column {name: "par_business_unit"}
    string parBusinessUnit;
    # The name of the department
    @sql:Column {name: "par_department"}
    string parDepartment;
    # The name of the team
    @sql:Column {name: "par_team"}
    string parTeam;
    # The email of the lead
    @sql:Column {name: "par_lead_email"}
    string parLeadEmail;
|};

# The PAR summary record type.
public type EmployeeParSummary record {|
    # The email of the person who shared the PAR
    @sql:Column {name: "par_rating_shared_by"}
    string? parSharedBy;
    # The unique identifier for the PAR cycle
    @sql:Column {name: "par_cycle_id"}
    int parCycleId;
    # The name of PAR cycle
    @sql:Column {name: "par_cycle_name"}
    string parCycleName;
    # The PAR cycle start date
    @sql:Column {name: "par_cycle_start_date"}
    string parCycleStartDate;
    # The PAR cycle end date
    @sql:Column {name: "par_cycle_end_date"}
    string parCycleEndDate;
    # The date that par rating field updated
    @sql:Column {name: "par_rating_updated_on"}
    string parUpdatedOn;
    # The status of the employee par rating
    @sql:Column {name: "par_employee_status"}
    types:ParEmployeeStatus parEmployeeStatus;
    # The status of the lead par rating
    @sql:Column {name: "par_lead_status"}
    types:ParLeadStatus parLeadStatus;
    # The email of the lead
    @sql:Column {name: "par_lead_email"}
    string parLeadEmail;
    # The status of the cycle
    @sql:Column {name: "par_cycle_status"}
    ParCycleStatus parCycleStatus;
|};

# The PAR summary record type.
public type SpecialRatingAllocation record {|
    # Name of the business unit
    @sql:Column {name: "par_business_unit"}
    string parBusinessUnit;
    # Name of the department
    @sql:Column {name: "par_department"}
    string parDepartment;
    # Name of the team
    @sql:Column {name: "par_team"}
    string parTeam;
    # The par quota id
    @sql:Column {name: "par_quota_id"}
    int parQuotaId;
    # The quota name
    @sql:Column {name: "par_special_quota_name"}
    string parSpecialQuotaName;
    # The top5 quota allocation
    @sql:Column {name: "par_top5_quota"}
    int parTop5Quota;
    # The top20 quota allocation
    @sql:Column {name: "par_top20_quota"}
    int parTop20Quota;
|};

# The ParCycleStatus represents possible statuses of a performance appraisal cycle.
public enum ParCycleStatus {
    PENDING,
    PENDING_QUOTA,
    OPEN,
    CLOSED,
    FAILED
}
