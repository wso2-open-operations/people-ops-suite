// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import ballerina/constraint;
import ballerina/lang.regexp;
import ballerina/time;

# The ParCycleCreate record represents the data required to create a new performance appraisal cycle.
public type ParCycleCreate record {|
    # The name of the performance appraisal cycle
    @constraint:String {
        pattern: {
            value: NONE_EMPTY_PRINTABLE_STRING_REGEX,
            message: "The parCycleName should be a non-empty string with printable characters."
        }
    }
    string parCycleName;
    # The start date of the performance appraisal cycle
    @constraint:String {
        pattern: {
            value: DATE_FORMAT_REGEX,
            message: "The parCycleStartDate should be in the format 'YYYY-MM-DD'."
        }
    }
    string parCycleStartDate;
    # The end date of the performance appraisal cycle
    @constraint:String {
        pattern: {
            value: DATE_FORMAT_REGEX,
            message: "The parCycleEndDate should be in the format 'YYYY-MM-DD'."
        }
    }
    string parCycleEndDate;
    # The start date of the performance appraisal evaluation period
    @constraint:String {
        pattern: {
            value: DATE_FORMAT_REGEX,
            message: "The parEvaluationStartDate should be in the format 'YYYY-MM-DD'."
        }
    }
    string parEvaluationStartDate;
    # The end date of the performance appraisal evaluation period
    @constraint:String {
        pattern: {
            value: DATE_FORMAT_REGEX,
            message: "The parEvaluationEndDate should be in the format 'YYYY-MM-DD'."
        }
    }
    string parEvaluationEndDate;
    # The deadline for special ratings
    @constraint:String {
        pattern: {
            value: DATE_FORMAT_REGEX,
            message: "The parSpecialRatingDeadline should be in the format 'YYYY-MM-DD'."
        }
    }
    string parSpecialRatingDeadline;
    # The deadline for 360 degree ratings
    @constraint:String {
        pattern: {
            value: DATE_FORMAT_REGEX,
            message: "The parThreeSixtyRatingDeadline should be in the format 'YYYY-MM-DD'."
        }
    }
    string parThreeSixtyRatingDeadline;
    # The deadline for employee ratings
    @constraint:String {
        pattern: {
            value: DATE_FORMAT_REGEX,
            message: "The parEmployeeDeadline should be in the format 'YYYY-MM-DD'."
        }
    }
    string parF2FDeadline;
    # The deadline for face to face meetings
    @constraint:String {
        pattern: {
            value: DATE_FORMAT_REGEX,
            message: "The parF2FDeadline should be in the format 'YYYY-MM-DD'."
        }
    }
    string parEmployeeDeadline;
    # The deadline for lead ratings
    @constraint:String {
        pattern: {
            value: DATE_FORMAT_REGEX,
            message: "The parLeadDeadline should be in the format 'YYYY-MM-DD'."
        }
    }
    string parLeadDeadline;
    # The configurations for the performance appraisal cycle
    ParCycleConfigurations parCycleConfigurations;
|};

# The ParCycleConfigurations record represents the configurations for a performance appraisal cycle.
public type ParCycleConfigurations record {|
    # The question to be asked from the employee
    @constraint:String {
        pattern: {
            value: NONE_EMPTY_PRINTABLE_STRING_REGEX,
            message: "The employeeParQuestion should be a non-empty string with printable characters."
        }
    }
    string employeeParQuestion;
    # The question to be asked from the 360 degree reviewer
    @constraint:String {
        pattern: {
            value: NONE_EMPTY_PRINTABLE_STRING_REGEX,
            message: "The threeSixtyReviewQuestion should be a non-empty string with printable characters."
        }
    }
    string threeSixtyReviewQuestion;
    # The ratings for the performance appraisal
    @constraint:Array {
        minLength: {
            value: 1,
            message: "The parRatings should be a non-empty string array."
        }
    }
    string[] parRatings;
    # The ratings for the 360 degree review
    @constraint:Array {
        minLength: {
            value: 1,
            message: "The threeSixtyReviewRatings should be a non-empty string array."
        }
    }
    string[] threeSixtyReviewRatings;
|};

# The ParCycleModify record represents the data required to modify an existing performance appraisal cycle.
public type ParCycleModify record {|
    # The name of the performance appraisal cycle
    @constraint:String {
        pattern: NONE_EMPTY_PRINTABLE_STRING_REGEX
    }
    string parCycleName?;
    # The start date of the performance appraisal cycle
    @constraint:String {
        pattern: DATE_FORMAT_REGEX
    }
    string parCycleStartDate?;
    # The end date of the performance appraisal cycle
    @constraint:String {
        pattern: DATE_FORMAT_REGEX
    }
    string parCycleEndDate?;
    # The start date of the performance appraisal evaluation period
    @constraint:String {
        pattern: DATE_FORMAT_REGEX
    }
    string parEvaluationStartDate?;
    # The end date of the performance appraisal evaluation period
    @constraint:String {
        pattern: DATE_FORMAT_REGEX
    }
    string parEvaluationEndDate?;
    # The deadline for special ratings
    @constraint:String {
        pattern: DATE_FORMAT_REGEX
    }
    string parSpecialRatingDeadline?;
    # The deadline for face to face meetings
    @constraint:String {
        pattern: DATE_FORMAT_REGEX
    }
    string parF2FDeadline?;
    # The deadline for 360 degree ratings
    @constraint:String {
        pattern: DATE_FORMAT_REGEX
    }
    string parThreeSixtyRatingDeadline?;
    # The deadline for employee ratings
    @constraint:String {
        pattern: DATE_FORMAT_REGEX
    }
    string parEmployeeDeadline?;
    # The deadline for lead ratings
    @constraint:String {
        pattern: DATE_FORMAT_REGEX
    }
    string parLeadDeadline?;
    # The configurations for the performance appraisal cycle
    ParCycleConfigurationsOptionalized parCycleConfigurations?;
    # The status of the performance appraisal cycle
    @constraint:String {
        pattern: NONE_EMPTY_PRINTABLE_STRING_REGEX
    }
    ParCycleStatus parCycleStatus?;
|};

# The ParCycleConfigurationsOptionalized record represents the optionalized configurations for a performance appraisal cycle.
public type ParCycleConfigurationsOptionalized record {|
    # The question to be asked from the employee
    @constraint:String {
        pattern: NONE_EMPTY_PRINTABLE_STRING_REGEX
    }
    string employeeParQuestion?;
    # The question to be asked from the 360 degree reviewer
    @constraint:String {
        pattern: NONE_EMPTY_PRINTABLE_STRING_REGEX
    }
    string threeSixtyReviewQuestion?;
    # The ratings for the performance appraisal
    @constraint:Array {
        minLength: 1
    }
    string[] parRatings?;
    # The ratings for the 360 degree review
    @constraint:Array {
        minLength: 1
    }
    string[] threeSixtyReviewRatings?;
|};

# The ParCycleConfigurationsOptionalizedResponse record represents the optionalized configurations for a performance appraisal cycle.
public type ParCycleConfigurationsOptionalizedResponse record {|
    # The question to be asked from the employee
    string employeeParQuestion?;
    # The question to be asked from the 360 degree reviewer
    string threeSixtyReviewQuestion?;
    # The ratings for the performance appraisal
    string[] parRatings?;
    # The ratings for the 360 degree review
    string[] threeSixtyReviewRatings?;
|};

# The ParCycle record represents a performance appraisal cycle.
# This record is used to reply to the client with the details of a performance appraisal cycle.
public type ParCycle record {|
    # The ID of the performance appraisal cycle
    int parCycleId;
    # The name of the performance appraisal cycle
    string parCycleName;
    # The start date of the performance appraisal cycle
    string parCycleStartDate;
    # The end date of the performance appraisal cycle
    string parCycleEndDate;
    # The start date of the performance appraisal evaluation period
    string parEvaluationStartDate;
    # The end date of the performance appraisal evaluation period
    string parEvaluationEndDate;
    # The deadline for special ratings
    string parSpecialRatingDeadline;
    # The deadline for face to face meetings
    string parF2FDeadline;
    # The deadline for 360 degree ratings
    string parThreeSixtyRatingDeadline;
    # The deadline for employee ratings
    string parEmployeeDeadline;
    # The deadline for lead ratings
    string parLeadDeadline;
    # The configurations for the performance appraisal cycle
    ParCycleConfigurations parCycleConfigurations;
    # The status of the performance appraisal cycle
    ParCycleStatus parCycleStatus;
|};

# The ParCycleDates record represents the dates of a performance appraisal cycle.
# This record is used internally to validate the dates of a performance appraisal cycle.
public type ParCycleDates record {|
    # The start date of the performance appraisal cycle
    string parCycleStartDate;
    # The end date of the performance appraisal cycle
    string parCycleEndDate;
    # The start date of the performance appraisal evaluation period
    string parEvaluationStartDate;
    # The end date of the performance appraisal evaluation period
    string parEvaluationEndDate;
    # The deadline for special ratings
    string parSpecialRatingDeadline;
    # The deadline for face to face meetings
    string parF2FDeadline;
    # The deadline for 360 degree ratings
    string parThreeSixtyRatingDeadline;
    # The deadline for employee ratings
    string parEmployeeDeadline;
    # The deadline for lead ratings
    string parLeadDeadline;
|};

# The ParRatingModify record represents the data required to modify an existing performance appraisal rating.
public type ParRatingModify record {|
    # The PAR rating of the employee
    @constraint:String {
        pattern: {
            value: NONE_EMPTY_PRINTABLE_STRING_REGEX,
            message: "The parRating should be a non-empty string with printable characters."
        }
    }
    string parRating?;
    # The special rating of the employee
    @constraint:String {
        pattern: {
            value: NONE_EMPTY_PRINTABLE_STRING_REGEX,
            message: "The parSpecialRating should be a non-empty string with printable characters."
        }
    }
    string parSpecialRating?;
    # The comment of the employee
    @constraint:String {
        pattern: {
            value: NONE_EMPTY_BASE64_STRING_REGEX,
            message: "The parEmployeeComment should be a non-empty base64 string."
        }
    }
    string parEmployeeComment?;
    # The PAR status of the employee
    ParEmployeeStatus parEmployeeStatus?;
    # The comment of the lead
    @constraint:String {
        pattern: {
            value: NONE_EMPTY_BASE64_STRING_REGEX,
            message: "The parLeadComment should be a non-empty base64 string."
        }
    }
    string parLeadComment?;
    # The PAR status of the lead
    @constraint:String {
        pattern: {
            value: NONE_EMPTY_PRINTABLE_STRING_REGEX,
            message: "The parLeadStatus should be a non-empty string with printable characters."
        }
    }
    ParLeadStatus parLeadStatus?;
    # The status of the face-to-face meeting
    @constraint:String {
        pattern: {
            value: NONE_EMPTY_PRINTABLE_STRING_REGEX,
            message: "The parF2fStatus should be a non-empty string with printable characters."
        }
    }
    ParF2fStatus parF2fStatus?;
    # The date of the face-to-face meeting
    @constraint:String {
        pattern: DATE_FORMAT_REGEX
    }
    string parF2fDate?;
    # The status of the employee acceptance
    @constraint:String {
        pattern: {
            value: NONE_EMPTY_PRINTABLE_STRING_REGEX,
            message: "The parEmployeeAcceptanceStatus should be a non-empty string with printable characters."
        }
    }
    ParEmployeeAcceptanceStatus parEmployeeAcceptanceStatus?;
    # The comment of the employee acceptance
    @constraint:String {
        pattern: {
            value: NONE_EMPTY_BASE64_STRING_REGEX,
            message: "The parEmployeeAcceptanceComment should be a non-empty base64 string."
        }
    }
    string parEmployeeAcceptanceComment?;
    # The comment of the admin
    @constraint:String {
        pattern: {
            value: NONE_EMPTY_BASE64_STRING_REGEX,
            message: "The parAdminComment should be a non-empty base64 string."
        }
    }
    string parAdminComment?;
    # The proof document link confirms that the employee was informed in advance about the weak rating they are facing
    @constraint:String {
        pattern: {
            value: re `[\s\S]*\S[\s\S]*`,
            message: "The parPerformanceNoticeAck should be a non-empty string with printable characters."
        }
    }
    string parPerformanceNoticeAck?;
|};

# The ParRating record represents a performance appraisal rating.
public type ParRating record {|
    # The ID of the PAR rating
    int parRatingId;
    # The ID of the performance appraisal cycle
    int parCycleId;
    # The email of the employee
    string parEmployeeEmail;
    # The company of the employee
    string parCompany;
    # The location of the employee
    string parLocation;
    # The business unit of the employee
    string parBusinessUnit;
    # The department of the employee
    string parDepartment;
    # The team of the employee
    string parTeam?;
    # The sub-team of the employee
    string parSubTeam?;
    # The email of the lead
    string parLeadEmail?;
    # The PAR rating of the employee
    string parRating?;
    # The special rating of the employee
    string parSpecialRating?;
    # The comment of the employee
    string parEmployeeComment?;
    # The PAR status of the employee
    ParEmployeeStatus parEmployeeStatus;
    # The comment of the lead
    string parLeadComment?;
    # The PAR status of the lead
    ParLeadStatus parLeadStatus;
    # The status of the face-to-face meeting
    ParF2fStatus parF2fStatus;
    # The date of the face-to-face meeting
    string parF2fDate?;
    # The status of the employee acceptance
    ParEmployeeAcceptanceStatus parEmployeeAcceptanceStatus;
    # The comment of the employee acceptance
    string parEmployeeAcceptanceComment?;
    # The comment of the admin
    string parAdminComment?;
    # The invoker who shared the par of the employee
    string parRatingSharedBy?;
    # Proof document link confirming prior notice of weak rating
    string parPerformanceNoticeAck?;
|};

# The ParTeamSummary record represents a summary of a team in a performance appraisal cycle.
public type ParTeamSummary record {|
    # The ID of the team
    int parTeamId;
    # The ID of the performance appraisal cycle
    int parCycleId;
    # The business unit of the team
    string parBusinessUnit;
    # The department of the team
    string parDepartment;
    # The name of the team
    string parTeam?;
    # The name of the sub-team
    string parSubTeam?;
    # The email of the lead
    string parLeadEmail?;
    # The number of team members
    int numberOfTeamMembers;
    # The top 5 ratings quota
    int numberOf5pSlots;
    # The top 20 ratings quota
    int numberOf20pSlots;
    # The number of available slots for the top 5% ratings
    int available5pSlots;
    # The number of available slots for the top 20% ratings
    int available20pSlots;
    # The summary of the teams progress
    ParTeamSummaryCounts summary;
|};

# The ParTeamSummaryCounts record represents the progress of a team in a performance appraisal cycle.
public type ParTeamSummaryCounts record {|
    # The number of employees who have completed the self evaluation
    int employeeParCompletedCount;
    # The number of employees whose lead review has been completed
    int leadsReviewCompletedCount;
    # The number of employees whose face-to-face meeting has been completed
    int f2fCompletedCount;
|};

# The ParTeamDetails record represents a team in a performance appraisal cycle.
public type ParTeamDetails record {|
    *ParTeamSummary;
    # The details of the team members
    ParRatingMinimal[]? details;
|};

# The ParRating record represents a performance appraisal rating.
public type ParRatingMinimal record {|
    # The ID of the PAR rating
    int parRatingId;
    # The ID of the performance appraisal cycle
    int parCycleId;
    # The email of the employee
    string parEmployeeEmail;
    # The employee name
    string parEmployeeName;
    # The team of the employee
    int parTeamId;
    # The PAR rating of the employee
    string parRating?;
    # The special rating of the employee
    string parSpecialRating?;
    # The PAR status of the employee
    ParEmployeeStatus parEmployeeStatus;
    # The PAR status of the lead
    ParLeadStatus parLeadStatus;
    # The status of the three sixty review
    Par360ReviewStatus par360ReviewStatus;
    # The par 360 review counts
    Par360ReviewCounts par360ReviewCounts;
    # The status of the face-to-face meeting
    ParF2fStatus parF2fStatus;
    # The status of the employee acceptance
    ParEmployeeAcceptanceStatus parEmployeeAcceptanceStatus;
|};

# Par360ReviewCounts record represents the counts of 360 reviews.
#
# + requestedReviewCount - The number of requested reviews
# + sharedReviewCount - The number of shared reviews
public type Par360ReviewCounts record {|
    int requestedReviewCount;
    int sharedReviewCount;
|};

# The BasicEmployeeInfo record represents the basic details of an employee.
public type BasicEmployeeInfo record {|
    # The employee name
    string employeeName;
    # The work email
    string workEmail;
    # The thumbnail of the employee
    string employeeThumbnail?;
    # Whether the employee is a lead
    boolean isLead?;
    # The email of the manager
    string managerEmail?;
|};

# The EmployeeTeam record represents the details of an employee team.
public type EmployeeTeam record {|
    # The employee name
    string employeeName;
    # The work email
    string workEmail;
    # The team ID
    int teamId;
|};

# The EmployeeInfo record represents the details of an employee.
public type EmployeeInfo record {|
    *BasicEmployeeInfo;
    # The start date
    string startDate?;
    # The job role
    string jobRole?;
    # The business unit
    string businessUnit?;
    # The department
    string department?;
    # The team
    string team?;
    # The email of the lead
    string? leadEmail;
    # The location
    string location?;
    # Whether the employee is a team lead
    boolean isTeamLead;
    # Whether the employee is a lead
    boolean? lead;
|};

# The Par360ReviewRequestCreate record represents the data required to create a new 360 review request.
public type Par360ReviewRequestCreate record {|
    # List of reviewer emails
    string[] reviewerEmails;
|};

# The Par360Reviewer record represents the details of a 360 reviewer.
public type Par360Reviewer record {|
    # The email of the reviewer
    string reviewerEmail;
    # The status of the review
    Par360ReviewStatus reviewStatus;
    # Whether the lead has requested the review
    boolean isLeadRequested;
    # Whether the employee has requested the review
    boolean isEmployeeRequested;
|};

# The Par360ReviewUpdate record represents the details of a 360 review to be updated.
public type Par360ReviewUpdate record {|
    # The review rating
    string reviewRating?;
    # The review comment
    @constraint:String {
        pattern: {
            value: NONE_EMPTY_BASE64_STRING_REGEX,
            message: "The review comment should be a non-empty base64 string."
        }
    }
    string reviewComment?;
    # The status of the review
    Par360ReviewStatus par360ReviewStatus?;
    # The optional field for the review offerer email
    string reviewerEmail?;
|};

# The Par360ReviewRequest record represents the details 360 review request.
public type Par360ReviewRequest record {|
    # The email of the employee to whom the review is given
    string employeeEmail;
    # The status of the review
    Par360ReviewStatus reviewStatus;
    # Is the review requested by the lead
    boolean isLeadRequested;
    # Is the review requested by the employee
    boolean isEmployeeRequested;
|};

# The Par360Review record represents the details of a 360 review.
public type Par360Review record {|
    # The email of the reviewer
    string reviewerEmail;
    # The review rating
    string reviewRating?;
    # The review comment
    string reviewComment?;
    # The status of the review
    Par360ReviewStatus reviewStatus;
|};

# The ParSpecialRatingQuota record represents the quota for special ratings.
public type ParSpecialRatingQuota record {|
    # The ID of the special rating quota
    int specialRatingQuotaId = 0;
    # The quota for top 5% ratings
    int top5pQuota = 0;
    # The quota for top 20% ratings
    int top20pQuota = 0;
|};

# The ParCurrentSpecialRating record represents the current special ratings assigned to employees.
public type ParCurrentSpecialRating record {|
    # The ID of the team
    int teamId = 0;
    # The ID of the performance appraisal cycle
    int parCycleId = 0;
    # The ID of the special rating group
    int specialRatingGroupId = 0;
    # The ID of the special rating quota
    int specialRatingQuotaId = 0;
    # The top 5 rating count
    int top5pCount = 0;
    # The top 20 rating count
    int top20pCount = 0;
|};

public type MaintenanceStatus record {|
    boolean isMaintenanceMode = false;
    string maintenanceMessage?;
|};

# The ParSpecialRatingGroup record represents the details of a special rating group.
public type ParSpecialRatingGroupWithHeadCount record {|
    # The ID of the par cycle
    int parCycleId;
    # The ID of the special rating group
    int specialRatingGroupId;
    # The name of business unit
    string businessUnit;
    # The name of the department
    string department;
    # The name of the team
    string team;
    # The number of people in the group
    int headCount;
    # The the special rating quota for the group
    ParSpecialRatingQuota specialRatingQuota?;
|};

# The ParSpecialRatingGroup record represents the details of a special rating group.
public type ParSpecialRatingGroupQuota record {|
    # Special rating groups
    ParSpecialRatingGroup[] parSpecialRatingGroups;
    # Special rating quotas
    ParSpecialRatingQuotaWithName[] specialRatingQuotas;
|};

# The ParSpecialRatingGroup record represents the details of a special rating group.
public type ParSpecialRatingGroup record {|
    # The ID of the par cycle
    int parCycleId;
    # The ID of the special rating group
    int specialRatingGroupId;
    # The name of business unit
    string businessUnit;
    # The name of the department
    string department;
    # The name of the team
    string team;
    # The the special rating quota for the group
    int specialRatingQuotaId;
|};

# The ParSpecialRatingQuota record represents the quota for special ratings.
public type ParSpecialRatingQuotaWithName record {|
    # The ID of the special rating quota
    int specialRatingQuotaId;
    # The name of the special rating quota
    string specialRatingQuotaName;
    # The quota for top 5% ratings
    int top5pQuota;
    # The quota for top 20% ratings
    int top20pQuota;
    # The allocated leads with viewing permission
    string[] allocatedLeads;
|};

# The AdditionalReportsParRating record represents a lead's additional report's performance appraisal rating.
public type AdditionalReportsParRating record {|
    *ParRatingMinimal;
    # The direct lead of the employee
    string parDirectLead;
    # The reporting type of the employee
    string reportingType;
|};

# The ChainReportsParRating record represents a performance appraisal rating with chain report data.
public type ChainReportsParRating record {|
    *ParRatingMinimal;
    # The team of the employee
    string parTeam;
    # Sub team of the employee
    string parSubTeam;
    # The direct lead of the employee
    string parLeadEmail;
    # The department of the employee
    string parDepartment;
    # The business unit of the employee
    string parBusinessUnit;
    # Indication of is the employee a lead
    string isEmployeeALead;
|};

# Validate the ParSpecialRatingGroupQuota record.
#
# + parCycle - The ParCycle record
# + parSpecialRatingGroupQuota - The ParSpecialRatingGroupQuota record to be validated
# + existingSRGroupIds - The existing special rating group IDs
# + return - The error message if the validation fails or nil otherwise
public isolated function validateParSpecialRatingGroupQuota(ParCycle parCycle,
        ParSpecialRatingGroupQuota & readonly parSpecialRatingGroupQuota, int[] existingSRGroupIds) returns error? {
    if parCycle.parCycleStatus != PENDING_QUOTA {
        return error(string `Cannot create special rating quotas when the PAR cycle is not in the ${
            PENDING_QUOTA} state.`, code = ERR_PAR_SPECIAL_RATING_QUOTA_BAD_REQUEST);
    }

    ParSpecialRatingGroup[] parSpecialRatingGroups = parSpecialRatingGroupQuota.parSpecialRatingGroups;
    //Commented out since this logic needs to be verified
    // if existingSRGroupIds.length() != parSpecialRatingGroups.length() {
    //     return error("The special rating group quota list size mismatch.");
    // }

    foreach ParSpecialRatingGroup parSpecialRatingGroup in parSpecialRatingGroups {
        if existingSRGroupIds.indexOf(parSpecialRatingGroup.specialRatingGroupId) == () {
            return error(string `The special rating group quota not found for the group id ${
                parSpecialRatingGroup.specialRatingGroupId}.`);
        }
    }
    foreach ParSpecialRatingQuotaWithName specialRatingQuota in parSpecialRatingGroupQuota.specialRatingQuotas {
        if specialRatingQuota.allocatedLeads.length() <= 0 {
            return error("The special rating groups should have at least one lead with view access");
        }
    }

    int[] quotaIdsFromGroups = from ParSpecialRatingGroup parSpecialRatingGroup
        in parSpecialRatingGroupQuota.parSpecialRatingGroups
        select parSpecialRatingGroup.specialRatingQuotaId;
    int[] quotaIdsFromQuotas = from ParSpecialRatingQuotaWithName parSpecialRatingQuota
        in parSpecialRatingGroupQuota.specialRatingQuotas
        select parSpecialRatingQuota.specialRatingQuotaId;

    foreach int quotaIdFromGroups in quotaIdsFromGroups {
        if quotaIdsFromQuotas.indexOf(quotaIdFromGroups) == () {
            return error(string `The special rating quota not found for the quota id ${quotaIdFromGroups}.`);
        }
    }
}

# Validate the ParCycle record.
#
# + parCycle - The ParCycle record to be validated
# + return - The error message if the validation fails
public isolated function validateParCycle(ParCycleCreate parCycle) returns error[] {
    return validateDates({
                             parCycleStartDate: parCycle.parCycleStartDate,
                             parCycleEndDate: parCycle.parCycleEndDate,
                             parEvaluationStartDate: parCycle.parEvaluationStartDate,
                             parEvaluationEndDate: parCycle.parEvaluationEndDate,
                             parSpecialRatingDeadline: parCycle.parSpecialRatingDeadline,
                             parF2FDeadline: parCycle.parF2FDeadline,
                             parThreeSixtyRatingDeadline: parCycle.parThreeSixtyRatingDeadline,
                             parEmployeeDeadline: parCycle.parEmployeeDeadline,
                             parLeadDeadline: parCycle.parLeadDeadline
                         });
}

# Validate the ParCycle dates.
#
# + parCycleDates - The ParCycleDates record to be validated
# + return - The error message if the validation fails
public isolated function validateDates(ParCycleDates parCycleDates) returns error[] {
    do {
        time:Utc parCycleStartDateUtc = check getUtcDate(parCycleDates.parCycleStartDate, "parCycleStartDate");
        time:Utc parCycleEndDateUtc = check getUtcDate(parCycleDates.parCycleEndDate, "parCycleEndDate");
        time:Utc parEvaluationStartDateUtc = check getUtcDate(parCycleDates.parEvaluationStartDate, "parEvaluationStartDate");
        time:Utc parEvaluationEndDateUtc = check getUtcDate(parCycleDates.parEvaluationEndDate, "parEvaluationEndDate");
        time:Utc parSpecialRatingDeadlineUtc = check getUtcDate(parCycleDates.parSpecialRatingDeadline, "parSpecialRatingDeadline");
        time:Utc parF2FDeadlineUtc = check getUtcDate(parCycleDates.parF2FDeadline, "parF2FDeadline");
        time:Utc parThreeSixtyRatingDeadlineUtc = check getUtcDate(parCycleDates.parThreeSixtyRatingDeadline, "parThreeSixtyRatingDeadline");
        time:Utc parEmployeeDeadlineUtc = check getUtcDate(parCycleDates.parEmployeeDeadline, "parEmployeeDeadline");
        time:Utc parLeadDeadlineUtc = check getUtcDate(parCycleDates.parLeadDeadline, "parLeadDeadline");

        error[] errors = [];

        if parCycleStartDateUtc >= parCycleEndDateUtc {
            errors.push(error(PAR_CYCLE_START_END_DATE_ERROR));
        }

        if parEvaluationStartDateUtc >= parEvaluationEndDateUtc {
            errors.push(error(PAR_EVALUATION_START_END_DATE_ERROR));
        }

        if parSpecialRatingDeadlineUtc <= parEvaluationStartDateUtc || parSpecialRatingDeadlineUtc > parEvaluationEndDateUtc {
            errors.push(error(PAR_SPECIAL_RATING_DEADLINE_ERROR));
        }

        if parF2FDeadlineUtc <= parEvaluationStartDateUtc || parF2FDeadlineUtc > parEvaluationEndDateUtc {
            errors.push(error(PAR_F2F_DEADLINE_ERROR));
        }

        if parThreeSixtyRatingDeadlineUtc <= parEvaluationStartDateUtc || parThreeSixtyRatingDeadlineUtc > parEvaluationEndDateUtc {
            errors.push(error(PAR_360_RATING_DEADLINE_ERROR));
        }

        if parEmployeeDeadlineUtc <= parEvaluationStartDateUtc || parEmployeeDeadlineUtc > parEvaluationEndDateUtc {
            errors.push(error(PAR_EMPLOYEE_DEADLINE_ERROR));
        }

        if parLeadDeadlineUtc <= parEvaluationStartDateUtc || parLeadDeadlineUtc > parEvaluationEndDateUtc {
            errors.push(error(PAR_LEAD_DEADLINE_ERROR));
        }

        if parLeadDeadlineUtc <= parEmployeeDeadlineUtc {
            errors.push(error(PAR_EMPLOYEE_LEAD_DEADLINE_MISMATCH_ERROR));
        }

        return errors;

    } on fail error e {
        return [e];
    }
}

# Check whether the given PAR rating can be modified based on the invoker type.
#
# + parRatingModify - The PAR rating to be modified
# + isLead - Whether the invoker is a lead
# + isSelf - Whether the invoker is the employee
# + return - An error if the PAR rating cannot be modified, or nil otherwise
public isolated function checkForModifiableFields(ParRatingModify parRatingModify, boolean isLead, boolean isSelf)
        returns error? {
    if isLead {
        return checkForModifiableFieldsForLead(parRatingModify);
    }
    if isSelf {
        return checkForModifiableFieldsForSelf(parRatingModify);
    }
}

# Check whether the given PAR rating can be modified by the lead.
#
# + parRatingModify - The PAR rating to be modified
# + return - An error if the PAR rating cannot be modified, or nil otherwise
public isolated function checkForModifiableFieldsForLead(ParRatingModify parRatingModify) returns error? {
    ParRatingModify {parEmployeeComment, parEmployeeStatus, parEmployeeAcceptanceStatus,
        parEmployeeAcceptanceComment, parAdminComment} = parRatingModify;

    if parEmployeeComment != () && parEmployeeComment.trim() != "" {
        return error("Leads are not allowed to modify the employee comment.", code = ERR_PAR_RATING_UPDATE_FORBIDDEN);
    }
    if parEmployeeStatus != () {
        return error("Leads are not allowed to modify the employee status.", code = ERR_PAR_RATING_UPDATE_FORBIDDEN);
    }
    if parEmployeeAcceptanceStatus != () {
        return error("Leads are not allowed to modify the employee acceptance status.",
            code = ERR_PAR_RATING_UPDATE_FORBIDDEN);
    }
    if parEmployeeAcceptanceComment != () && parEmployeeAcceptanceComment.trim() != "" {
        return error("Leads are not allowed to modify the employee acceptance comment.",
            code = ERR_PAR_RATING_UPDATE_FORBIDDEN);
    }
    if parAdminComment != () && parAdminComment.trim() != "" {
        return error("Leads are not allowed to modify the admin comment.", code = ERR_PAR_RATING_UPDATE_FORBIDDEN);
    }
}

# Check whether the given PAR rating can be modified by the employee.
#
# + parRatingModify - The PAR rating to be modified
# + return - An error if the PAR rating cannot be modified, or nil otherwise
public isolated function checkForModifiableFieldsForSelf(ParRatingModify parRatingModify) returns error? {
    ParRatingModify {parRating, parSpecialRating, parLeadComment, parLeadStatus,
        parAdminComment, parPerformanceNoticeAck} = parRatingModify;

    if parRating != () && parRating.trim() != "" {
        return error("Employees are not allowed to modify the PAR rating.", code = ERR_PAR_RATING_UPDATE_FORBIDDEN);
    }
    if parSpecialRating != () && parSpecialRating.trim() != "" {
        return error("Employees are not allowed to modify the special rating.", code = ERR_PAR_RATING_UPDATE_FORBIDDEN);
    }
    if parLeadComment != () && parLeadComment.trim() != "" {
        return error("Employees are not allowed to modify the lead comment.", code = ERR_PAR_RATING_UPDATE_FORBIDDEN);
    }
    if parLeadStatus != () {
        return error("Employees are not allowed to modify the lead status.", code = ERR_PAR_RATING_UPDATE_FORBIDDEN);
    }
    if parAdminComment != () && parAdminComment.trim() != "" {
        return error("Employees are not allowed to modify the admin comment.", code = ERR_PAR_RATING_UPDATE_FORBIDDEN);
    }
    if parPerformanceNoticeAck != () && parPerformanceNoticeAck.trim() != "" {
        return error("Employees are not allowed to modify communication proof.", code = ERR_PAR_RATING_UPDATE_FORBIDDEN);
    }
}

# Sanitizes the given PAR rating based on the invoker type.
#
# + parRating - The PAR rating to be sanitized
# + isLead - Whether the invoker is a lead
# + isSelf - Whether the invoker is the employee
# + return - The sanitized PAR rating
public isolated function sanitizeParRating(ParRating parRating, boolean isLead, boolean isSelf) returns ParRating {
    if isLead {
        return sanitizeParRatingForLead(parRating);
    }
    if isSelf {
        return sanitizeParRatingForSelf(parRating);
    }
    return parRating;
}

# Sanitizes the given PAR rating for the lead.
#
# + parRating - The PAR rating to be sanitized
# + return - The sanitized PAR rating
public isolated function sanitizeParRatingForLead(ParRating parRating) returns ParRating {
    parRating.parEmployeeAcceptanceComment = ();
    parRating.parAdminComment = ();
    if parRating.parEmployeeStatus is PENDING|DRAFT {
        parRating.parEmployeeComment = ();
    }
    return parRating;
}

# Sanitizes the given PAR rating for the employee.
#
# + parRating - The PAR rating to be sanitized
# + return - The sanitized PAR rating
public isolated function sanitizeParRatingForSelf(ParRating parRating) returns ParRating {
    if parRating.parLeadStatus is PENDING|DRAFT {
        parRating.parRating = ();
        parRating.parSpecialRating = ();
        parRating.parLeadComment = ();
    }
    parRating.parAdminComment = ();
    return parRating;
}

# Sanitizes the given PAR configurations for non-admins.
#
# + parCycleConfigurations - The PAR configurations to be sanitized
# + return - The sanitized PAR configurations
public isolated function sanitizeParConfigsForNonAdmins(ParCycleConfigurationsOptionalizedResponse parCycleConfigurations)
        returns ParCycleConfigurationsOptionalizedResponse =>
    let ParCycleConfigurationsOptionalizedResponse {employeeParQuestion, threeSixtyReviewQuestion, parRatings,
        threeSixtyReviewRatings} = parCycleConfigurations
    in {
        employeeParQuestion,
        threeSixtyReviewQuestion,
        parRatings,
        threeSixtyReviewRatings
    };

# Get the UTC date from the given date string.
#
# + date - The date string in the format 'YYYY-MM-DD'
# + fieldName - The name of the field
# + return - The UTC date if the date string is valid, else an error
public isolated function getUtcDate(string date, string fieldName) returns time:Utc|error {
    time:Utc|time:Error utcDate = time:utcFromString(date + DEFAULT_TIME_OF_DAY);
    if utcDate is time:Error {
        return error(string `Invalid date format for the field '${fieldName}'. The date should be in the format 'YYYY-MM-DD'`);
    }
    return utcDate;
}

# The InvokerDetails record represents the details of the invoker.
public type InvokerDetails readonly & record {|
    # The email of the invoker
    string email;
    # The roles of the invoker
    string[] roles;
    # Whether the invoker is an admin
    boolean isAdmin;
|};

# The JwtPayload record represents the payload of a JWT token.
public type JwtPayload readonly & record {
    # The email of the user
    string email;
    # The groups of the user
    string[] groups;
};

# The ParCycleStatus represents possible statuses of a performance appraisal cycle.
public enum ParCycleStatus {
    PENDING,
    PENDING_QUOTA,
    OPEN,
    CLOSED,
    FAILED
}

# The ParEmployeeStatus represents possible statuses of self evaluations in a performance appraisal cycle.
public enum ParEmployeeStatus {
    PENDING,
    DRAFT,
    SHARED,
    SHARED_BLOCKED
}

# The ParLeadStatus represents possible statuses of lead evaluations in a performance appraisal cycle.
public enum ParLeadStatus {
    PENDING,
    DRAFT,
    SHARED
}

# The ParF2fStatus represents possible statuses of face-to-face meetings in a performance appraisal cycle.
public enum ParF2fStatus {
    PENDING,
    SCHEDULED,
    COMPLETED
}

# The ParEmployeeAcceptanceStatus represents possible statuses of employee acceptances in a performance appraisal cycle.
public enum ParEmployeeAcceptanceStatus {
    PENDING,
    ACCEPTED,
    REJECTED
}

# The Par360ReviewStatus represents possible statuses of 360 degree reviews in a performance appraisal cycle.
public enum Par360ReviewStatus {
    PENDING,
    DRAFT,
    SHARED,
    REJECTED,
    SANITIZED
}

# The ParSpecialRatings represents possible statuses of special ratings in a performance appraisal cycle.
public enum ParSpecialRatings {
    TOP5P,
    TOP20P
}

public enum EmailType {
    LEAD_REMINDER,
    LEAD_REMINDER_OVERDUE,
    EMPLOYEE_INVITATION,
    EMPLOYEE_REMINDER,
    THREE_SIXTY_REMINDER,
    THREE_SIXTY_NOTIFICATION,
    SPECIAL_RATING_REMINDER,
    PAR_EMPLOYEE_SHARED_NOTIFICATION,
    PAR_LEAD_SHARED_NOTIFICATION
}

public enum EmailTriggerType {
    SERVICE,
    SCHEDULER,
    PROCESSING
}

public enum EmailStatus {
    PENDING,
    PROCESSING,
    SENT,
    FAILED
}

# Regex for the date conversion function
public final regexp:RegExp & readonly REGEX_DATE_YYYY_MM_DD = re `[12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])`;

# Error message for the date conversion
public const ERR_MSG_INVALID_DATE_FORMAT = "Invalid date. Date string should be in ISO 8601 format.";

# Validation error record
public type ValidationError error<ValidationErrorDetail>;

# Validation error detail record.
public type ValidationErrorDetail record {
    # Error message for response
    string externalMessage;
};

# The participant record type
public type Participant record {|
    # The email of the participating employee
    string workEmail;
    # The name of the participating employee
    string employeeName;
|};

# The record type for the rejected review request table.
public type RejectedReview record {|
    # The email of the reviewer
    string employeeEmail;
    # The email of the reviewer
    string reviewerEmail;
    # The type of the feedback (offered/requested)
    string isOfferedFeedback;
|};

# ScheduleMeetingRequest Represents the meeting schedule request record type.
public type ScheduleMeetingRequest record {|
    # Id of the par rating
    int parRatingId;
    # The title of the meeting
    string title;
    # The description of the meeting
    string description;
    # The start time of the meeting
    string startTime;
    # The end time of the meeting
    string endTime;
    # The date of the meeting to be scheduled
    string date;
|};

# Default time zone for the calendar module.
public enum CalendarDefaultTimeZone {
    UTC = "UTC"
}

# Type for employee par team details
public type ParTeamBasic record {|
    # ID of the par team
    int parTeamId;
    # ID of the par cycle
    int parCycleId;
    # Email of the lead
    string parLeadEmail;
    # Department of the employee
    string parDepartment;
    # Business unit  of the employee
    string parBusinessUnit;
    # Team of the employee
    string parTeam;
|};

# The client config type for the google calendar.
public type GoogleCalendarClientConfig record {|
    # Client ID
    string clientId;
    # Client secret
    string clientSecret;
    # Refresh token
    string refreshToken;
    # Refresh URL
    string refreshUrl;
|};

# The employee PAR summary record type.
public type EmployeeParSummary record {|
    # The email of the employee who shared the PAR
    string? parSharedBy;
    # The unique identifier for the PAR cycle
    int parCycleId;
    # The name of the PAR cycle
    string parCycleName;
    # The PAR cycle start date
    string parCycleStartDate;
    # The PAR cycle end date
    string parCycleEndDate;
    # The date that par rating field updated
    string parUpdatedOn;
    # The status of the employee par rating
    ParEmployeeStatus parEmployeeStatus;
    # The status of the lead par rating
    ParLeadStatus parLeadStatus;
    # The email of the lead
    string parLeadEmail;
    # The status of the cycle
    ParCycleStatus parCycleStatus;
|};

# The PAR summary record type.
public type SpecialRatingAllocation record {|
    # Name of the business unit
    string parBusinessUnit;
    # Name of the department
    string parDepartment;
    # Name of the team
    string parTeam;
    # The par quota id
    int parQuotaId;
    # The quota name
    string parSpecialQuotaName;
    # The top5 quota allocation
    int parTop5Quota;
    # The top20 quota allocation
    int parTop20Quota;
|};
