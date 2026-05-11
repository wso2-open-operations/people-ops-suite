// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

public final string:RegExp DATE_FORMAT_REGEX = re `^\d{4}-\d{2}-\d{2}$`;
public final string:RegExp NONE_EMPTY_PRINTABLE_STRING_REGEX = re `^(?:.*\S)[ -~]+$`;
public final string:RegExp NONE_EMPTY_BASE64_STRING_REGEX = re `^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$`;

public const CACHE_PAR_CYCLE_CONFIGURATIONS = "CACHE_PAR_CYCLE_CONFIGURATIONS";

public const NOT_ASSIGNED = "NOT_ASSIGNED";

public const INVOKER_DETAILS = "invokerDetails";

public const USER_TIMEZONE_OFFSET = "user-timezone-offset";

public const DEFAULT_TIME_OF_DAY = "T00:00:00.00Z";

public const PAR_CYCLE_CONFIGURATIONS = "PAR_CYCLE_CONFIGURATIONS";

public const LEADERSHIP_GROUP = "LEADERSHIP GROUP";

public const ERR_PAR_CYCLE_UNAUTHORIZED = 10403;
public const ERR_PAR_CYCLE_NOT_FOUND = 10404;
public const ERR_PAR_CYCLE_CANNOT_BE_PROCESSED = 10422;
public const ERR_PAR_CYCLE_CONFLICT = 10409;
public const ERR_PAR_RATING_NOT_FOUND = 11404;
public const ERR_PAR_RATING_CANNOT_BE_PROCESSED = 11422;
public const ERR_PAR_RATING_UPDATE_FORBIDDEN = 11403;
public const ERR_PAR_SPECIAL_RATING_GROUP_NOT_FOUND = 12404;
public const ERR_PAR_TEAM_NOT_FOUND = 13404;
public const ERR_PAR_CYCLE_LEAD_NOT_FOUND = 14404;
public const ERR_PAR_TEAM_SUMMARY_NOT_FOUND = 15404;
public const ERR_PAR_360_REVIEW_NOT_FOUND = 16404;
public const ERR_PAR_360_REVIEW_FORBIDDEN = 16403;
public const ERR_PAR_360_REVIEW_CANNOT_BE_PROCESSED = 16422;
public const ERR_PAR_SPECIAL_RATING_QUOTA_NOT_FOUND = 17404;
public const ERR_PAR_CURRENT_SPECIAL_RATING_NOT_FOUND = 18404;
public const ERR_PAR_SPECIAL_RATING_QUOTA_EXCEEDED = 17409;
public const ERR_PAR_CONFIGURATION_NOT_FOUND = 18409;
public const ERR_PAR_SPECIAL_RATING_QUOTA_BAD_REQUEST = 19400;

public const BATCH_SIZE = 100;

public const PAR_CYCLE_START_END_DATE_ERROR = "The 'parCycleStartDate' should be earlier than 'parCycleEndDate'";
public const PAR_EVALUATION_START_END_DATE_ERROR = "The 'parEvaluationStartDate' should be earlier than 'parEvaluationEndDate'";
public const PAR_SPECIAL_RATING_DEADLINE_ERROR = "The 'parSpecialRatingDeadline' must be set between 'parEvaluationStartDate' and 'parEvaluationEndDate'";
public const PAR_F2F_DEADLINE_ERROR = "The 'parF2FDeadline' must be set between 'parEvaluationStartDate' and 'parEvaluationEndDate'";
public const PAR_360_RATING_DEADLINE_ERROR = "The 'parThreeSixtyRatingDeadline' must be set between 'parEvaluationStartDate' and 'parEvaluationEndDate'";
public const PAR_EMPLOYEE_DEADLINE_ERROR = "The 'parEmployeeDeadline' must be set between 'parEvaluationStartDate' and 'parEvaluationEndDate'";
public const PAR_LEAD_DEADLINE_ERROR = "The 'parLeadDeadline' must be set between 'parEvaluationStartDate' and 'parEvaluationEndDate'";
public const PAR_EMPLOYEE_LEAD_DEADLINE_MISMATCH_ERROR = "The 'parEmployeeDeadline' must be earlier than 'parLeadDeadline'";

public const SECONDS_FOR_ONE_DAY = 86400;
public const SECONDS_FOR_THREE_DAYS = 259200;
public const SECONDS_FOR_SEVEN_DAYS = 604800;
public const SECONDS_THRESHOLD = 3600;
public const TOP_RATINGS_ELIGIBILITY_DAYS  = 90.0;

public const EMAIL_NO_DATA = "No Data";
public const EMAIL_CLOSING_AND_SIGNATURE = "Thank you,<br/>People Operations Team";

public const EMAIL_RECIPIENT_NAME = "RECIPIENT_NAME";
public const EMAIL_PAR_CYCLE_NAME = "PAR_CYCLE_NAME";
public const EMAIL_DEADLINE = "DEADLINE";
public const EMAIL_REMAINING_DAYS = "REMAINING_DAYS";
public const EMAIL_ADDITIONAL_DATA = "ADDITIONAL_DATA";
public const EMAIL_PAR_APP_BASE_URL = "PAR_APP_BASE_URL";
public const EMAIL_EMPLOYEE_PAR_LINK = "EMPLOYEE_PAR_LINK";
public const EMAIL_EMPLOYEE_NAME = "EMPLOYEE_NAME";

public const EMAIL_PAR_CYCLE_START_DATE = "PAR_CYCLE_START_DATE";
public const EMAIL_PAR_CYCLE_END_DATE = "PAR_CYCLE_END_DATE";
public const EMAIL_PAR_EVALUATION_START_DATE = "PAR_EVALUATION_START_DATE";
public const EMAIL_PAR_EVALUATION_END_DATE = "PAR_EVALUATION_END_DATE";
public const EMAIL_EMPLOYEE_DEADLINE = "EMPLOYEE_DEADLINE";
public const EMAIL_LEAD_DEADLINE = "LEAD_DEADLINE";
public const EMAIL_360_DEADLINE = "360_DEADLINE";
public const EMAIL_SPECIAL_RATING_DEADLINE = "SPECIAL_RATING_DEADLINE";
public const EMAIL_F2F_DEADLINE = "F2F_DEADLINE";
public const USER_GUIDE_LINK = "USER_GUIDE_LINK";
public const SLIDES_LINK = "SLIDES_LINK";

public const EMAIL_TEMPLATE_PAR_INVITATION = "EMAIL_TEMPLATE_PAR_INVITATION";
public const EMAIL_TEMPLATE_EMPLOYEE_REMINDER = "EMAIL_TEMPLATE_EMPLOYEE_REMINDER";
public const EMAIL_TEMPLATE_LEAD_REMINDER = "EMAIL_TEMPLATE_LEAD_REMINDER";
public const EMAIL_TEMPLATE_LEAD_OVERDUE_REMINDER = "EMAIL_TEMPLATE_LEAD_OVERDUE_REMINDER";
public const EMAIL_TEMPLATE_360_REMINDER = "EMAIL_TEMPLATE_360_REMINDER";
public const EMAIL_TEMPLATE_360_NOTIFICATION = "EMAIL_TEMPLATE_360_NOTIFICATION";
public const EMAIL_TEMPLATE_SPECIAL_RATING_REMINDER = "EMAIL_TEMPLATE_SPECIAL_RATING_REMINDER";
public const EMAIL_TEMPLATE_LEAD_SHARED_NOTIFICATION = "EMAIL_TEMPLATE_LEAD_SHARED_NOTIFICATION";
public const EMAIL_TEMPLATE_EMPLOYEE_SHARED_NOTIFICATION = "EMAIL_TEMPLATE_EMPLOYEE_SHARED_NOTIFICATION";

public const EMAIL_SUBJECT_LEAD_PAR_DEADLINE = "Reminder: Lead PAR Submission Deadline Approaching";
public const EMAIL_TITLE_LEAD_PAR_DEADLINE = "Lead PAR Submission Deadline Approaching";
public const EMAIL_SUBJECT_LEAD_PAR_DEADLINE_OVERDUE = "Urgent: Missed Deadline for Lead PAR Submission";
public const EMAIL_TITLE_LEAD_PAR_DEADLINE_OVERDUE = "Missed Deadline for Lead PAR Submission";
public const EMAIL_SUBJECT_EMPLOYEE_PAR_INVITATION = "[Team] IMPORTANT : ";
public const EMAIL_TITLE_EMPLOYEE_PAR_INVITATION = "Performance Appraisal Review (PAR)";
public const EMAIL_SUBJECT_EMPLOYEE_PAR_DEADLINE = "Reminder: Employee PAR Submission Deadline Approaching";
public const EMAIL_TITLE_EMPLOYEE_PAR_DEADLINE = "Employee PAR Submission Deadline Approaching";
public const EMAIL_SUBJECT_360_REVIEW_DEADLINE = "Reminder: 360 Review Submission Deadline Approaching";
public const EMAIL_TITLE_360_REVIEW_DEADLINE = "360 Review Submission Deadline Approaching";
public const EMAIL_SUBJECT_360_NOTIFICATION = "Invitation to Review Your Colleague";
public const EMAIL_TITLE_360_NOTIFICATION = "360 Review Request";
public const EMAIL_SUBJECT_SPECIAL_RATING_DEADLINE = "Reminder: Special Rating Submission Deadline Approaching";
public const EMAIL_TITLE_SPECIAL_RATING_DEADLINE = "Special Rating Submission Deadline Approaching";
public const EMAIL_SUBJECT_EMPLOYEE_PAR_READY = "Your Performance Appraisal Review is Ready";
public const EMAIL_TITLE_EMPLOYEE_PAR_READY = "Your Performance Appraisal Review is Ready";
public const EMAIL_SUBJECT_EMPLOYEE_SHARED = "Employee PAR Shared";
public const EMAIL_TITLE_EMPLOYEE_SHARED = "Employee PAR is ready for your review";

public const DEFAULT_ERR_HTTP_BAD_REQUEST = "Creating HTTP Bad Request response.";
public const DEFAULT_ERR_HTTP_CONFLICT = "Creating HTTP Conflict response.";
public const DEFAULT_ERR_HTTP_NOT_FOUND = "Creating HTTP Not Found response.";
public const DEFAULT_ERR_HTTP_UNPROCESSABLE_ENTITY = "Creating HTTP Unprocessable Entity response.";
