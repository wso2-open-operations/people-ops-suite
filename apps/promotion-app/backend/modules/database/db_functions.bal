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
import ballerina/lang.array;

# Retrieving users 
#
# + return - User Array or Error
public isolated function getUsers() returns User[]|error {

    stream<DbUser, error?> resultStream = databaseClient->query(getUsersQuery());

    User[] users = [];
    error? queryError = from DbUser user in resultStream
        do {
            // mapping CSV to role[]
            Role[] roles = [];

            string? user_roles = user.roles;
            if user_roles is string {
                string[] rolesList = regex:split(re `,`, user_roles);

                foreach string role in rolesList {
                    if role is Role {
                        roles.push(role);
                    }
                }
            }

            users.push(
                {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                jobBand: user.jobBand,
                email: user.email,
                roles: roles,
                functionalLeadAccessLevels: check processPermissions(user.functionalLeadAccessLevels),
                active: user.active == 1
            }
            );
        };

    if queryError is error {
        _ = check resultStream.close();
        return error("An error occurred while retrieving users");
    }

    return users;
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

# Get Promotion Cycles By Id
#
# + PromotionId - Promotion Cycle Id
# + return - Promotion Cycle or Error
public isolated function getPromotionCycleById(int PromotionId) returns PromotionCycle|error {

    PromotionCycle|error promotionCycle = databaseClient->queryRow(getPromotionCyclesByIdQuery(PromotionId));

    if promotionCycle is error {
        if promotionCycle is sql:NoRowsError {
            return error("No promotion cycle found!");
        }

        return error("An error occurred while retrieving the promotion cycle!");
    }

    return promotionCycle;
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

# Insert New Promotion Cycle
#
# + payload - Promotion Cycle Data
# + return - Promotion Cycle ID
public isolated function insertPromotionCycle(PromotionCycleInsertData payload)
        returns int|error {

    sql:ExecutionResult result = check databaseClient->execute(insertPromotionCycleQuery(payload));

    return <int>result.lastInsertId;
}

# Get app configs from hris_config table
#
# + key - Specific the key of the config record
# + return - Array of App configs
public isolated function getConfigs(string? key = ()) returns Config[]|error {

    stream<Config, error?> resultStream = databaseClient->query(getConfigsQuery(key));

    return from Config config in resultStream
        select config;
}

# Update Promotion Cycle
#
# + payload - Promotion cycle update payload
# + return - error, if available
public isolated function updatePromotionCycle(PromotionCycleDbUpdateData payload)
        returns int|error {

    sql:ExecutionResult result = check databaseClient->execute(updatePromotionCycleQuery(payload));

    return result.affectedRowCount ?: 0;
}

# Expire Pending Promotion Requests
#
# + promotionCycleId - Promotion cycle id  
# + updatedBy - Person who updated the request
# + return - Error if any
public isolated function expirePendingRequests(int promotionCycleId, string updatedBy) returns int|error? {

    sql:ExecutionResult result = check databaseClient->execute(
        expirePendingRequestsQuery(promotionCycleId = promotionCycleId, updatedBy = updatedBy)
    );

    return result.affectedRowCount ?: 0;
}

# Expire Pending Promotion Recommendations
#
# + promotionCycleId - Promotion cycle id  
# + updatedBy - Person who updated the recommendation
# + return - Error if any
public isolated function expirePendingRecommendations(int promotionCycleId, string updatedBy) returns int|error? {

    sql:ExecutionResult result = check databaseClient->execute(expirePendingRecommendationsQuery(
            promotionCycleId = promotionCycleId, updatedBy = updatedBy)
    );

    return result.affectedRowCount ?: 0;
}

# Retrieving user by id
#
# + id - User id 
# + email - User email 
# + return - User  or Error
public isolated function getUserBy(int? id = (), string? email = ()) returns User|error? {

    DbUser user = check databaseClient->queryRow(getUsersQuery(id, email));

    // mapping CSV to role[]
    Role[] roles = [];
    string? user_roles = user.roles;
    if user_roles is string {
        string[] rolesList = regex:split(re `,`, user_roles);

        foreach string role in rolesList {
            if role is Role {
                roles.push(role);
            }
        }
    }

    return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        jobBand: user.jobBand,
        email: user.email,
        roles: roles,
        functionalLeadAccessLevels: check processPermissions(user.functionalLeadAccessLevels),
        active: user.active == 1
    };
}

# Update User
#
# + payload - User Update Data
# + return - error if any
public isolated function updateUser(UserDbUpdatePayload payload) returns int|error? {

    // cleaning function lead access level when functional lead role is not there
    if array:indexOf(payload.roles ?: [], <Role>FUNCTIONAL_LEAD) === () {
        payload.functionalLeadAccessLevels = ();
    }

    sql:ExecutionResult result = check databaseClient->execute(updateUserQuery(payload));

    return result.affectedRowCount ?: 0;
}

# Obtain Business unit mapping
#
# + return - Formatted list of business units, departments and teams
public isolated function getBusinessUnitMapping() returns BusinessUnit[]|error {

    stream<DbBusinessUnit, error?> resultStream = databaseClient->query(getBusinessUnitMappingQuery());

    return from DbBusinessUnit bu in resultStream
        select {
                id: bu.id,
                name: bu.businessUnit,
                departments: check bu.departments.fromJsonStringWithType()
            };
}

# Insert a new Users
#
# + payload - User Insert Data
# + return - User ID
public isolated function insertUser(UserDbInsertPayload payload) returns int|error {

    // cleaning function lead access level when functional lead role is not there
    if array:indexOf(payload.roles, <Role>FUNCTIONAL_LEAD) === () {
        payload.functionalLeadAccessLevels = ();
    }

    sql:ExecutionResult result = check databaseClient->execute(insertUserQuery(payload));

    return <int>result.lastInsertId;
}

# Delete user by id
#
# + id - User id  
# + return - User  or Error
public isolated function deleteUserById(int id) returns int|error? {

    sql:ExecutionResult result = check databaseClient->execute(deleteUserQuery(id));

    return result.affectedRowCount ?: 0;
}

# Get EmailNotifications for a given email status and count.
#
# + emailStatus - Email status
# + count - The count of the email notifications
# + return - A list of EmailNotification objects or an error if the operation failed
public isolated function getEmailNotifications(EmailStatus emailStatus, int count)
        returns InsertEmailData[]|error {
    stream<InsertEmailData, error?> resultStream = databaseClient->query(getEmailNotificationsQuery(emailStatus, count));
    return from InsertEmailData emailNotification in resultStream
        select emailNotification;
}

# Update the status of EmailNotifications.
#
# + notificationIds - The notification IDs
# + emailStatus - Email status
# + return - An error if the operation failed or nil if successful
public isolated function updateEmailNotifications(int[] notificationIds, EmailStatus emailStatus) returns error? {
    if notificationIds.length() > 0 {
        _ = check databaseClient->execute(updateEmailNotificationsStateQuery(notificationIds, emailStatus));
    }
}

# Insert EmailNotifications in bulk.
#
# + emailNotifications - EmailNotification array
# + return - An error if the operation failed or nil if successful
public isolated function insertEmailNotificationsBulk(InsertEmailData[] emailNotifications) returns error? =>
    emailNotifications.length() > 0 ? check batchExecute(insertEmailNotificationQuery(emailNotifications)) : ();

# Execute queries in batch.
#
# + queries - Array of ParameterizedQuerys
# + return - An error if the operation failed or nil if successful
isolated function batchExecute(sql:ParameterizedQuery[] queries) returns error? {
    int index = 0;
    int length = queries.length();
    while index < length {
        int safeLastIndexForBatch = int:min(index + BATCH_SIZE, length);
        sql:ParameterizedQuery[] chunk = queries.slice(index, safeLastIndexForBatch);
        _ = check databaseClient->batchExecute(chunk);
        index = safeLastIndexForBatch;
    }
}

# Insert or Update hris_config
#
# + payload - Key,Value and the metadata for create or update config record
# + return - error if any
public isolated function insertOrUpdateConfig(ConfigUpdatePayload payload) returns int|error? {

    sql:ExecutionResult result = check databaseClient->execute(insertOrUpdateConfigQuery(payload));


    return result.affectedRowCount ?: 0;
}

# Retrieving user promotion requests.
#
# + cycleID - Cycle ID  
# + 'type - Type of the promotion request
# + return - Array of Promotion Requests
public isolated function getRecommendedLeads(int? cycleID = (), PromotionRequestType? 'type = ())
    returns string[]|error {

    stream<LeadEmail, sql:Error?> resultStream = databaseClient->query(
        getRecommendedLeadsQuery(cycleID = cycleID, 'type = 'type)
        );

    return from LeadEmail lead in resultStream
        select lead.leadEmail;
}
