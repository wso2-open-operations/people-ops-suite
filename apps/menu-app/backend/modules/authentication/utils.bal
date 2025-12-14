// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import ballerina/http;

# Check permissions.
#
# + requiredRoles - Required Role list
# + userRoles - Roles list, The user has
# + return - Allow or not
public isolated function checkPermissions(string[] requiredRoles, string[] userRoles) returns boolean {
    if userRoles.length() == 0 && requiredRoles.length() > 0 {
        return false;
    }

    final string[] & readonly userRolesReadOnly = userRoles.cloneReadOnly();
    return requiredRoles.every(role => userRolesReadOnly.indexOf(role) !is ());
}

# Get user email from the request context.
#
# + ctx - request context
# + return - email string or error response
public isolated function getUserEmailFromRequestContext(http:RequestContext ctx) returns http:BadRequest|string {
    CustomJwtPayload|error userInfo = ctx.getWithType(HEADER_USER_INFO);
    if userInfo is error {
        return <http:BadRequest>{
            body:  {
                message: USER_NOT_FOUND_ERROR
            }
        };
    }

    string email = userInfo.email;
    if !email.matches(WSO2_EMAIL) {
        return <http:BadRequest> {
            body: {message: "Invalid email"}
        };
    }

    return email;
}
