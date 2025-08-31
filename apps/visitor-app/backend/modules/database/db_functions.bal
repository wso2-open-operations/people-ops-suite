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

import ballerina/sql;

# Fetch Visitor.
#
# + hashedNIC - Filter :  hashed NIC of the visitor
# + return - Visitor object or error if so
public isolated function fetchVisitor(string hashedNIC) returns Visitor|error? {
    Visitor|error visitor = databaseClient->queryRow(getVisitorByNicQuery(hashedNIC));
    if visitor is sql:NoRowsError {
        return;
    }
    if visitor is error {
        return visitor;
    }

    // Decrypt sensitive fields.
    visitor.name = check decrypt(visitor.name);
    visitor.nicNumber = check decrypt(visitor.nicNumber);
    visitor.contactNumber = check decrypt(visitor.contactNumber);

    string? email = visitor.email;
    visitor.email = email is string ? check decrypt(email) : null;

    return visitor;
}

# Add new visitor.
#
# + payload - Payload containing the visitor details  
# + createdBy - Person who is creating the visitor
# + return - Error if the insertion failed
public isolated function AddVisitor(AddVisitorPayload payload, string createdBy) returns error? {
    // Encrypt sensitive fields.
    payload.name = check encrypt(payload.name);
    payload.nicNumber = check encrypt(payload.nicNumber);
    string? email = payload.email;
    payload.email = email is string ? check encrypt(email) : null;
    payload.contactNumber = check encrypt(payload.contactNumber);

    sql:ExecutionResult _ = check databaseClient->execute(addVisitorQuery(payload, createdBy));
}

# Add new visit.
#
# + payload - Payload containing the visit details
# + createdBy - Person who is creating the visit
# + return - Error if the insertion failed
public isolated function AddVisit(AddVisitPayload payload, string createdBy) returns error? {
    sql:ExecutionResult _ = check databaseClient->execute(addVisitQuery(payload, createdBy));
}

# Fetch visits with pagination.
#
# + 'limit - Limit number of visits to fetch
# + offset - Offset for pagination
# + return - Array of visits objects or error
public isolated function fetchVisits(int? 'limit, int? offset) returns VisitsResponse|error {
    stream<DatabaseVisitRecord, sql:Error?> resultStream = databaseClient->query(getVisitsQuery('limit, offset));

    int totalCount = 0;
    Visit[] visits = [];
    check from DatabaseVisitRecord visit in resultStream
        do {
            totalCount = visit.totalCount;
            visits.push({
                id: visit.id,
                timeOfEntry: visit.timeOfEntry,
                timeOfDeparture: visit.timeOfDeparture,
                passNumber: visit.passNumber,
                nicHash: visit.nicHash,
                nicNumber: check decrypt(visit.nicNumber),
                name: check decrypt(visit.name),
                email: visit.email is string ? check decrypt(<string>visit.email) : null,
                contactNumber: check decrypt(visit.contactNumber),
                companyName: visit.companyName,
                whomTheyMeet: visit.whomTheyMeet,
                purposeOfVisit: visit.purposeOfVisit,
                accessibleLocations: check visit.accessibleLocations.cloneWithType(),
                status: visit.status,
                createdBy: visit.createdBy,
                createdOn: visit.createdOn,
                updatedBy: visit.updatedBy,
                updatedOn: visit.updatedOn
            });
        };

    return {totalCount, visits};
}
