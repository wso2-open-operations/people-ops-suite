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
# + hashedNic - Filter :  hashed NIC of the visitor
# + return - Visitor object or error if so
public isolated function fetchVisitor(string hashedNic) returns Visitor|error? {
    Visitor|error visitor = databaseClient->queryRow(getVisitorByNicQuery(hashedNic));
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
public isolated function addVisitor(AddVisitorPayload payload, string createdBy) returns error? {
    // Encrypt sensitive fields.
    payload.name = check encrypt(payload.name);
    payload.nicNumber = check encrypt(payload.nicNumber);
    string? email = payload.email;
    payload.email = email is string ? check encrypt(email) : null;
    payload.contactNumber = check encrypt(payload.contactNumber);

    _ = check databaseClient->execute(addVisitorQuery(payload, createdBy));
}

# Add new visit.
#
# + payload - Payload containing the visit details
# + createdBy - Person who is creating the visit
# + inviationId - Invitation ID associated with the visit
# + return - Error if the insertion failed
public isolated function addVisit(AddVisitPayload payload, string createdBy, int? inviationId = ()) returns error? {
    _ = check databaseClient->execute(addVisitQuery(payload, createdBy, inviationId));
}

# Create a new invitation.
#
# + payload - Payload containing the invitation details
# + createdBy - Person who is creating the invitation
# + encodeString - Encoded uuid value
# + return - Error if the insertion failed
public isolated function addInvitation(AddInvitationPayload payload, string createdBy, string encodeString)
    returns error? {

    _ = check databaseClient->execute(addInvitationQuery(payload, createdBy, encodeString));
}

# Checks whether invitation is valid.
#
# + encodeValue - Encoded uuid value
# + return - Invitation object or error
public isolated function checkInvitation(string encodeValue) returns Invitation|error {
    Invitation|sql:Error invitation = databaseClient->queryRow(checkInvitationQuery(encodeValue));
    if invitation is sql:Error {
        return invitation;
    }
    VisitInfo visitInfo = check invitation.visitDetails.cloneWithType();
    invitation.visitDetails = visitInfo;
    return invitation;
}

# Fetch visits with pagination.
#
# + 'limit - Limit number of visits to fetch
# + offset - Offset for pagination
# + invitation_id - Filter by invitation ID
# + status - Filter by visit status
# + return - Array of visits objects or error
public isolated function fetchVisits(string? status = (), int? 'limit = (), int? offset = (), int? invitation_id = ())
    returns VisitsResponse|error {

    stream<VisitRecord, sql:Error?> resultStream = databaseClient->query(getVisitsQuery('limit, offset, invitation_id, status));

    int totalCount = 0;
    Visit[] visits = [];
    check from VisitRecord visit in resultStream
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
                email: check decrypt(<string>visit.email),
                contactNumber: check decrypt(visit.contactNumber),
                companyName: visit.companyName,
                whomTheyMeet: visit.whomTheyMeet,
                purposeOfVisit: visit.purposeOfVisit,
                accessibleLocations: check visit.accessibleLocations.cloneWithType(),
                invitationId: visit.invitationId,
                status: visit.status,
                createdBy: visit.createdBy,
                createdOn: visit.createdOn,
                updatedBy: visit.updatedBy,
                updatedOn: visit.updatedOn
            });
        };

    return {totalCount, visits};
}

# Update visit details of an existing visit.
#
# + visitId - ID of the visit to be updated
# + action - Action to be performed on the visit (ACCEPTED, REJECTED, COMPLETED)
# + payload - Payload containing the visit details to be updated
# + return - Encoded email of the visitor or error
public isolated function updateVisit(int visitId, Action action, updateVisitPayload payload) returns string|error {
    transaction {
        sql:ParameterizedQuery[] queries = updateVisitQuery(visitId, action, payload);
        _ = check databaseClient->execute(queries[0]);
        string email = check databaseClient->queryRow(queries[1]);
        check commit;
        return email;
    }
}
