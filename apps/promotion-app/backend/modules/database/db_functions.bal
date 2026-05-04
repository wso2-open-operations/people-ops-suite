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
    string? userRoles = user.roles;
    // Check if userRoles is a string (to ensure that it contains role data).
    if userRoles is string {
        // Split the string by commas to create an array of role strings.
        string[] rolesList = regex:split(re `,`, userRoles);
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

    return from PromotionCycle promotionCycle in resultStream
        select promotionCycle;
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

    return from Promotion promotionRequest in resultStream
        select promotionRequest;
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
public isolated function getRecommendations(int? id = (), int? promotionRequestId = (),
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
    return from FullPromotionRecommendation promotionRequest in resultStream
        select promotionRequest;
}

# Get Promotion Cycles By Status.
#
# + statusArray - Array of the promotion cycle Status
# + return - Array of Promotion Cycles
public isolated function getPromotionCyclesByStatus(PromotionCyclesStatus[]? statusArray)
    returns PromotionCycle[]|error {

    stream<PromotionCycle, error?> resultStream = databaseClient->query(getPromotionCyclesByStatusQuery(statusArray));

    return from PromotionCycle promotionCycle in resultStream
        select promotionCycle;
}

# Is Duplicate Promotion Request.
#
# + employeeEmail - Employee WSO2 email  
# + promotionCycleId - Promotion cycle id 
# + return - true if duplicate request exists or error if any
public isolated function isDuplicatePromotionRequest(
        string employeeEmail, int promotionCycleId) returns boolean|error {

    int count = check databaseClient->queryRow(getDuplicatePromotionRequestCountQuery(employeeEmail,
            promotionCycleId));

    return count > 0;
}

# Insert Promotion Request.
#
# + payload - Promotion Request Insert Payload
# + return - Id of the Created Record
public isolated function insertPromotionRequest(PromotionRequestDbInsertPayload payload)
    returns int|error {

    sql:ExecutionResult result = check databaseClient->execute(insertPromotionRequestQuery(payload));

    int|string? lastInsertId = result.lastInsertId;
    if lastInsertId is int {
        return lastInsertId;
    }

    return error("Failed to retrieve last inserted promotion ID!");
}

# Insert New Promotion Recommendation.
#
# + payload - Promotion Recommendation Data
# + return - Promotion Recommendation ID
public isolated function insertPromotionRecommendation(PromotionRecommendationInsertPayload payload)
        returns int|error {

    sql:ExecutionResult result = check databaseClient->execute(insertPromotionRecommendationQuery(payload));

    int|string? lastInsertId = result.lastInsertId;

    if lastInsertId is int {
        return lastInsertId;
    }

    return error("Failed to retrieve last inserted promotion recommendation ID!");
}

# Retrieving promotion recommendations
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

    return from FullPromotionRecommendation promotionRequest in resultStream
        select promotionRequest;
}

# Update Promotion Recommendation
#
# + payload - Update payload
# + return - Return Value Description
public isolated function updatePromotionRecommendation(PromotionRecommendationDbUpdatePayload payload)
        returns error? {

    sql:ExecutionResult result = check databaseClient->execute(updatePromotionRecommendationQuery(payload));

    if result.affectedRowCount == 0 {
        return error("No editable promotion recommendation found for update!");
    }
}

# Update Promotion Request
#
# + payload - Promotion Request Update Data
# + return - Error or Null
public isolated function updatePromotionRequest(ApplicationDbUpdatePayload payload)
    returns error? {

    sql:ExecutionResult result = check databaseClient->execute(updatePromotionRequestQuery(payload));

    if result.affectedRowCount == 0 {
        return error("No editable promotion request found for update!");
    }
}
