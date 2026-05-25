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
import ballerina/http;
import ballerina/jwt;
import ballerina/log;

public configurable AppRoles authorizedRoles = ?;
configurable string AUTHORIZED_CLIENT_ID = ?;

# To handle authorization for each resource function invocation.
public isolated service class JwtInterceptor {

    *http:RequestInterceptor;

    isolated resource function default [string... path](http:RequestContext ctx, http:Request req)
        returns http:NextService|http:Forbidden|http:InternalServerError|error? {
        // For public endpoints that bypass authorization
        if path.length() > 0 && path[0] == INVITATIONS {
            if req.method == http:POST && path.length() == 3 && path[1].length() > 0 && path[2] == AUTHORIZE {
                return ctx.next();
            }
            if req.method == http:POST && path.length() == 3 && path[1].length() > 0 && path[2] == FILL {
                return ctx.next();
            }
        }

        string|error idToken = req.getHeader(JWT_ASSERTION_HEADER);
        if idToken is error {
            string errorMsg = "Missing invoker info header!";
            log:printError(errorMsg, idToken);
            return <http:InternalServerError>{
                body: {
                    message: errorMsg
                }
            };
        }

        [jwt:Header, jwt:Payload]|jwt:Error result = jwt:decode(idToken);
        if result is jwt:Error {
            string errorMsg = "Error while reading the Invoker info!";
            log:printError(errorMsg, result);
            return <http:InternalServerError>{
                body: {
                    message: errorMsg
                }
            };
        }

        CustomJwtPayload|ClientCredentialJwtPayload|error userInfo = result[1].cloneWithType();
        if userInfo is error {
            string errorMsg = "Malformed Invoker info object!";
            log:printError(errorMsg, userInfo);
            return <http:InternalServerError>{
                body: {
                    message: errorMsg
                }
            };
        }

        // If the token belongs to a client credential flow, we skip group checks as there won't be any groups in the token. We can add more checks here in the future if needed, such as checking the client_id against a list of allowed client IDs.
        if userInfo is ClientCredentialJwtPayload {
            log:printInfo("Client credential flow detected, skipping group checks");
            if userInfo.client_id != AUTHORIZED_CLIENT_ID {
                string errorMsg = "Unauthorized client: " + userInfo.client_id;
                log:printError(errorMsg);
                return <http:Forbidden>{
                    body: {
                        message: "Unauthorized client!"
                    }
                };
            }
            CustomJwtPayload clientAsUserInfo = {
                email: "Client ID: " + userInfo.client_id,
                groups: [authorizedRoles.ADMIN_ROLE] // Assuming client credentials should have admin privileges, adjust as necessary
            };
            ctx.set(HEADER_USER_INFO, clientAsUserInfo);
            return ctx.next();
        }

        // For regular user tokens, we check if they have the required roles to access the resource.
        if userInfo is CustomJwtPayload {
            foreach anydata role in authorizedRoles.toArray() {
                if userInfo.groups.some(r => r === role) {
                    CustomJwtPayload authorizedUserInfo = {
                        email: userInfo.email,
                        groups: userInfo.groups
                    };
                    ctx.set(HEADER_USER_INFO, authorizedUserInfo);
                    return ctx.next();
                }
            }

            log:printError(
                    string `${userInfo.email} is missing required permissions, only has ${userInfo.groups.toBalString()}`);

            return <http:Forbidden>{
                body: {
                    message: "Insufficient privileges!"
                }
            };
        }
    }
}
