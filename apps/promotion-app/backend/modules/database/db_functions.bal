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
import ballerina/lang.regexp as regex;
import ballerina/log;
import ballerina/sql;

# Retrieving user by id.
#
# + id - User id 
# + email - User email 
# + return - User  or Error
public isolated function getUser(int? id = (), string? email = ()) returns User|error? {

    // Get the user by id and email.
    DbUser|error user = databaseClient->queryRow(getUsersQuery(id, email));

    // Handle error.
    if user is error {
        // Handle sql errors.
        if user is sql:NoRowsError {
            return;
        }
        return user;
    }

    // Initialize an empty array to store roles assigned to the user.
    Role[] roles = [];
    // Retrieve the user's roles, which are stored in a string (user.roles).
    string? user_roles = user.roles;
    // Check if user_roles is a string (to ensure that it contains role data).
    if user_roles is string {
        // Split the string by commas to create an array of role strings.
        string[] rolesList = regex:split(re `,`, user_roles);
        foreach string role in rolesList {
            // If the current role is valid and of type Role, push it to the roles array.
            if role is Role {
                roles.push(role);
            }
        }
    }

    User userRes = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        jobBand: user.jobBand,
        email: user.email,
        roles: roles,
        functionalLeadAccessLevels: check processPermissions(user.functionalLeadAccessLevels),
        active: user.active == 1
    };

    return userRes;
}

# Get Promotion Cycles By Status.
#
# + statusArray - Array of the promotion cycle Status
# + return - Array of Promotion Cycles
public isolated function getPromotionCycles(PromotionCyclesStatus[]? statusArray)
    returns PromotionCycle[]|error {

    stream<PromotionCycle, error?> resultStream = databaseClient->query(getPromotionCyclesByStatusQuery(statusArray));

    PromotionCycle[] cycles = [];
    error? queryError = from PromotionCycle promotionCycle in resultStream
        do {
            cycles.push(promotionCycle);
        };

    if queryError is error {
        _ = check resultStream.close();
        log:printError(queryError.toString());
        return error("An error occurred while retrieving promotion cycles");
    }

    return cycles;
}

# Retrieving full promotion.  
#
# + employeeEmail - WSO2 Email  
# + statusArray - Promotion Request Status  
# + cycleID - Cycle ID  
# + id - Promotion Request Id  
# + businessAccessLevels - Functional lead  access levels  
# + 'type - Promotion Request Type  
# + recommendedBy - Lead who recommended the special promotion 
# + return - Array of Promotion Requests
public isolated function getPromotions(string? employeeEmail = (), string[]? statusArray = (), int? cycleID = (),
        int? id = (), FunctionalLeadAccessLevels? businessAccessLevels = (), string? 'type = (), string? recommendedBy = ())
    returns Promotion[]|error {

    stream<Promotion, error?> resultStream = databaseClient->query(getUserPromotionRequestsQuery(
            employeeEmail = employeeEmail, statusArray = statusArray, cycleID = cycleID, id = id,
            businessAccessLevels = businessAccessLevels, 'type = 'type, recommendedBy = recommendedBy));

    Promotion[] promotions = [];
    error? queryError = from Promotion promotionRequest in resultStream
        do {
            promotions.push(promotionRequest);
        };

    if queryError is error {
        _ = check resultStream.close();
        log:printError(queryError.toString());
        return error("An error occurred while retrieving promotion requests!");
    }

    return promotions;
}

# Retrieving promotion recommendations.
#
# + id - Recommendation ID  
# + promotionRequestId - Promotion Request Id  
# + employeeEmail - Email of the employee  
# + leadEmail - Email of the lead  
# + statusArray - Array of Promotion Recommendation Status  
# + cycleID - Cycle ID
# + return - Array of Promotion Requests
public isolated function getFullPromotionRecommendations(int? id = (), int? promotionRequestId = (),
        string? employeeEmail = (), string? leadEmail = (), string[]? statusArray = (), int? cycleID = ())
    returns FullPromotionRecommendation[]|error {

    stream<FullPromotionRecommendation, error?> resultStream = databaseClient->query(getFullPromotionRecommendationsQuery(
            id = id,
            employeeEmail = employeeEmail,
            leadEmail = leadEmail,
            statusArray = statusArray,
            cycleID = cycleID,
            promotionRequestId = promotionRequestId
            )
        );

    FullPromotionRecommendation[] requests = [];
    error? queryError = from FullPromotionRecommendation promotionRequest in resultStream
        do {
            requests.push(promotionRequest);
        };

    if queryError is error {
        _ = check resultStream.close();
        log:printError(queryError.toString());
        return error("An error occurred while retrieving promotion recommendations ");
    }

    return requests;
}
