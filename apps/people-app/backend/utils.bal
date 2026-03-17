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

import people.authorization;
import people.database;

import ballerina/http;
import ballerina/log;
import ballerina/regex;

# Validate and authorize organization entity patch requests.
#
# + ctx - Request context
# + return - `()` when valid, otherwise corresponding http error response
function validateOrganizationRequest(http:RequestContext ctx)
    returns http:InternalServerError|http:Forbidden|http:BadRequest|JwtPayloadUserInfo {

    authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
    if userInfo is error {
        return <http:InternalServerError>{
            body: {
                message: ERROR_USER_INFORMATION_HEADER_NOT_FOUND
            }
        };
    }

    string workEmail = userInfo.email;
    if !regex:matches(workEmail, database:EMAIL_PATTERN_STRING) {
        string customErr = "Invalid work email format";
        log:printWarn(customErr, workEmail = workEmail);
        return <http:BadRequest>{
            body: {
                message: customErr
            }
        };
    }

    boolean hasAdminAccess = authorization:checkPermissions([authorization:authorizedRoles.ADMIN_ROLE], userInfo.groups);
    if !hasAdminAccess {
        log:printWarn("User is not authorized to update organization hierarchy", invokerEmail = workEmail);
        return <http:Forbidden>{
            body: {
                message: "You are not authorized to update organization hierarchy"
            }
        };
    }

   return <JwtPayloadUserInfo>userInfo;
}
