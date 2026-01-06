// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

public const DEFAULT_TIME_OF_DAY = "T00:00:00.00Z";
public const DEFAULT_TIME_OFFSET = 5.5d;

public const USER_NOT_FOUND_ERROR = "User information header not found!";
public const HEADER_USER_INFO = "user-info";

public final string:RegExp WSO2_EMAIL = re `^[a-zA-Z][\p{L}_\-]+@wso2\.com$`;

public const ACCEPT_HEADER = "Accept";
public const ALL_ORIGINS = "*";
public const JWT_DECODE_ERROR = "Error while decoding JWT";
public const EMAIL_RETRIEVAL_ERROR = "Error while retrieving the user email from jwt payload";
public const READING_JWT_HEADER_ERROR = "Error while reading JWT header";
public const USER_UNAUTHORIZED = "You are Unauthorized for this action/page. Try Logging in again. If this issue persists please contact internal-apps team.";
public const USER_FORBIDDEN = "You are Forbidden for this action/page. Try Logging in again. If this issue persists please contact internal-apps team.";
public const USER_EMAIL = "user-email";
public const CANNOT_RETRIEVE_EMAIL = "Cannot retrieve email from the jwt Id token";
public const X_JWT_ASSERTION = "x-jwt-assertion";

public const INTERNAL_ERROR = "Something went wrong. Please try again. If this issue persists please contact the internal apps team";
public const DINNER_REQUEST_ALREADY_EXISTS = "Dinner request already exists.";
public const DINNER_REQUEST_NOT_AVAILABLE = "No dinner request has been made.";
public const DINNER_REQUEST_SUCCESS = "Dinner request made successfully.";
public const DINNER_REQUEST_CANCELLED = "Dinner request cancelled.";
public const DINNER_REQUEST_CANCELLED_ERROR = "Error cancelling dinner request.";
public const DINNER_REQUEST_ERROR = "Error inserting dinner request.";
public const DINNER_REQUEST_SHEET_ERROR = "Error inserting dinner request to Google sheet.";
public const DINNER_REQUEST_RETRIEVAL_ERROR = "Error retrieving dinner request for employee.";
public const EMPLOYEE_RETRIEVAL_ERROR = "Error retrieving employee data.";
public const EMPLOYEE_NOT_FOUND_ERROR = "No matching employee found ";
