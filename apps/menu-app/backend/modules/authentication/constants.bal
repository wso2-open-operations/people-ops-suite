// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

# Authorization Constants.
public const JWT_ASSERTION_HEADER = "x-jwt-assertion";
public const HEADER_USER_INFO = "user-info";
public const USER_NOT_FOUND_ERROR = "User information header not found!";

# Privileges.
public const EMPLOYEE_PRIVILEGE = 987;
public const ADMIN_PRIVILEGE = 789;

// Validation regex patterns
public final string:RegExp WSO2_EMAIL = re `^[a-zA-Z][\p{L}_\-]+@wso2\.com$`;
