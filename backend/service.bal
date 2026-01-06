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
import par.authorization;
import par.entity;
import ballerina/cache;
import ballerina/log;
import ballerina/http;

final cache:Cache cache = new ({
    capacity: 2000,
    defaultMaxAge: 1800.0,
    cleanupInterval: 900.0
});

@display {
    label: "Par Backend Service",
    id: "PAR-application"
}

service class ErrorInterceptor {
    *http:ResponseErrorInterceptor;

    remote function interceptResponseError(error err, http:RequestContext ctx) returns http:BadRequest|error {

        // Handle data-binding errors.
        if err is http:PayloadBindingError {
            string customError = string `Payload binding failed!`;
            log:printError(customError, err);
            return {
                body: {
                    message: customError
                }
            };
        }
        return err;
    }
}

service http:InterceptableService / on new http:Listener(9094) {

    # Request interceptor.
    #
    # + return - authorization:JwtInterceptor, ErrorInterceptor
    public function createInterceptors() returns http:Interceptor[] =>
        [new authorization:JwtInterceptor(), new ErrorInterceptor()];

    # Fetch user information of the logged in users.
    #
    # + ctx - Request object
    # + return - User information | Error
    resource function get user\-info(http:RequestContext ctx) returns UserInfoResponse|http:InternalServerError {

        // User information header.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            return <http:InternalServerError>{
                body: {
                    message: "User information header not found!"
                }
            };
        }

        // Check if the employees are already cached.
        if cache.hasKey(userInfo.email) {
            UserInfoResponse|error cachedUserInfo = cache.get(userInfo.email).ensureType();
            if cachedUserInfo is UserInfoResponse {
                return cachedUserInfo;
            }
        }

        // Fetch the user information from the people service.
        entity:Employee|error loggedInUser = entity:fetchEmployeesBasicInfo(userInfo.email);
        if loggedInUser is error {
            string customError = string `Error occurred while retrieving user data: ${userInfo.email}!`;
            log:printError(customError, loggedInUser);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        // Fetch the user's privileges based on the roles.
        int[] privileges = [];
        if authorization:checkPermissions([authorization:authorizedRoles.EMPLOYEE_ROLE], userInfo.groups) {
            privileges.push(authorization:EMPLOYEE_PRIVILEGE);
        }
        if authorization:checkPermissions([authorization:authorizedRoles.ADMIN_ROLE], userInfo.groups) {
            privileges.push(authorization:ADMIN_PRIVILEGE);
        }
        if authorization:checkPermissions([authorization:authorizedRoles.LEAD_ROLE], userInfo.groups) {
            privileges.push(authorization:LEAD_PRIVILEGE);
        }

        UserInfoResponse userInfoResponse = {...loggedInUser, privileges};

        error? cacheError = cache.put(userInfo.email, userInfoResponse);
        if cacheError is error {
            log:printError("An error occurred while writing user info to the cache", cacheError);
        }
        return userInfoResponse;
    }
}
