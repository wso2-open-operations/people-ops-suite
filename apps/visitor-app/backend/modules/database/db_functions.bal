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

# Fetch Visitor.
#
# + hashedNic - Filter :  hashed NIC of the visitor
# + return - Visitor object or error if so
public isolated function fetchVisitor(string hashedNic) returns Visitor|error? {
    Visitor|error visitor = databaseClient->queryRow(fetchVisitorByNicQuery(hashedNic));
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

# Fetch invitation by encoded value.
#
# + encodeValue - Encoded uuid value
# + return - Invitation object or error
public isolated function fetchInvitation(string encodeValue) returns Invitation|error? {
    InvitationRecord|error invitationRecord = databaseClient->queryRow(fetchInvitationQuery(encodeValue));
    if invitationRecord is error {
        if invitationRecord is sql:NoRowsError {
            return;
        }
        return invitationRecord;
    }

    string? visitInfo = invitationRecord.visitInfo;
    Invitation invitation = {
        invitationId: invitationRecord.invitationId,
        inviteeEmail: invitationRecord.inviteeEmail,
        noOfVisitors: invitationRecord.noOfVisitors,
        visitInfo: visitInfo is string ? check visitInfo.fromJsonStringWithType() : (),
        active: invitationRecord.active,
        createdBy: invitationRecord.createdBy,
        createdOn: invitationRecord.createdOn,
        updatedBy: invitationRecord.updatedBy,
        updatedOn: invitationRecord.updatedOn
    };
    return invitation;
}

# Update invitation details.
#
# + invitationId - ID of the invitation to update
# + payload - Payload containing the fields to update  
# + updatedBy - Person who is updating the invitation
# + return - Error if the update failed or no rows were affected
public isolated function updateInvitation(int invitationId, UpdateInvitationPayload payload, string updatedBy)
    returns error? {

    sql:ExecutionResult executionResult = check databaseClient->execute(updateInvitationQuery(
            invitationId, payload, updatedBy));

    if executionResult.affectedRowCount < 1 {
        return error("No row was updated!");
    }
}

# Add new visit.
#
# + payload - Payload containing the visit details
# + createdBy - Person who is creating the visit
# + invitationId - Invitation ID associated with the visit
# + return - Error if the insertion failed
public isolated function addVisit(AddVisitPayload payload, string createdBy, int? invitationId = ()) returns error? {
    _ = check databaseClient->execute(addVisitQuery(payload, createdBy, invitationId));
}

# Fetch visit by ID.
#
# + visitId - ID of the visit to fetch
# + return - Visit object or error
public isolated function fetchVisit(int visitId) returns VisitRecord|error {
    VisitRecord|error visitRecord = databaseClient->queryRow(fetchVisitsQuery(visitId));

    if visitRecord is error {
        return visitRecord;
    }

    visitRecord.name = check decrypt(visitRecord.name);
    visitRecord.nicNumber = check decrypt(visitRecord.nicNumber);
    visitRecord.contactNumber = check decrypt(visitRecord.contactNumber);
    visitRecord.email = check decrypt(visitRecord.email);
    visitRecord.timeOfEntry = visitRecord.timeOfEntry.endsWith(".0")
        ? visitRecord.timeOfEntry.substring(0, visitRecord.timeOfEntry.length() - 2)
        : visitRecord.timeOfEntry;

    visitRecord.timeOfDeparture = visitRecord.timeOfDeparture.endsWith(".0")
        ? visitRecord.timeOfDeparture.substring(0, visitRecord.timeOfDeparture.length() - 2)
        : visitRecord.timeOfDeparture;

    return visitRecord;
}

# Fetch visits with pagination.
#
# + 'limit - Limit number of visits to fetch
# + offset - Offset for pagination
# + invitationId - Filter by invitation ID
# + status - Filter by visit status
# + return - Array of visits objects or error
public isolated function fetchVisits(string? status = (), int? 'limit = (), int? offset = (), int? invitationId = ())
    returns VisitsResponse|error {

    stream<VisitRecord, sql:Error?> resultStream = databaseClient->query(fetchVisitsQuery(
            'limit, offset, invitationId, status));

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

# Update visit details.
#
# + visitId - ID of the visit to update
# + payload - Payload containing the fields to update
# + updatedBy - Person who is updating the visit
# + return - Error if the update failed or no rows were affected
public isolated function updateVisit(int visitId, UpdateVisitPayload payload, string updatedBy) returns error? {
    sql:ExecutionResult executionResult = check databaseClient->execute(updateVisitQuery(visitId, payload, updatedBy));

    if executionResult.affectedRowCount < 1 {
        return error("No row was updated!");
    }
}
