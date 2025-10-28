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
    if visitor is error {
        return visitor is sql:NoRowsError ? () : visitor;
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
        return invitationRecord is sql:NoRowsError ? () : invitationRecord;
    }

    string? visitInfo = invitationRecord.visitInfo;
    return {
        invitationId: invitationRecord.invitationId,
        inviteeEmail: invitationRecord.inviteeEmail,
        noOfVisitors: invitationRecord.noOfVisitors,
        visitInfo: visitInfo is string ? check visitInfo.fromJsonStringWithType() : (),
        active: invitationRecord.active,
        'type: invitationRecord.'type,
        createdBy: invitationRecord.createdBy,
        createdOn: invitationRecord.createdOn,
        updatedBy: invitationRecord.updatedBy,
        updatedOn: invitationRecord.updatedOn
    };
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
# + invitedBy - The person who invited the visitor  
# + createdBy - Person who is creating the visit  
# + invitationId - Invitation ID associated with the visit
# + return - Error if the insertion failed
public isolated function addVisit(AddVisitPayload payload, string invitedBy, string createdBy, int? invitationId = ())
    returns error? {

    _ = check databaseClient->execute(addVisitQuery(payload, invitedBy, createdBy, invitationId));
}

# Fetch visit by ID.
#
# + visitId - ID of the visit to fetch
# + return - Visit object or error
public isolated function fetchVisit(int visitId) returns Visit|error? {
    VisitRecord|error visit = databaseClient->queryRow(fetchVisitsQuery({visitId: visitId}));

    if visit is error {
        return visit is sql:NoRowsError ? () : visit;
    }

    string? accessibleLocations = visit.accessibleLocations;
    string? email = visit.email;
    return {
        id: visit.id,
        timeOfEntry: visit.timeOfEntry.endsWith(".0")
            ? visit.timeOfEntry.substring(0, visit.timeOfEntry.length() - 2)
            : visit.timeOfEntry,
        timeOfDeparture: visit.timeOfDeparture.endsWith(".0")
            ? visit.timeOfDeparture.substring(0, visit.timeOfDeparture.length() - 2)
            : visit.timeOfDeparture,
        passNumber: visit.passNumber,
        nicHash: visit.nicHash,
        nicNumber: check decrypt(visit.nicNumber),
        name: check decrypt(visit.name),
        email: email is () ? () : check decrypt(email),
        contactNumber: check decrypt(visit.contactNumber),
        companyName: visit.companyName,
        whomTheyMeet: visit.whomTheyMeet,
        purposeOfVisit: visit.purposeOfVisit,
        accessibleLocations: accessibleLocations is string ?
            check accessibleLocations.fromJsonStringWithType() : null,
        invitationId: visit.invitationId,
        status: visit.status,
        createdBy: visit.createdBy,
        createdOn: visit.createdOn,
        updatedBy: visit.updatedBy,
        updatedOn: visit.updatedOn
    };
}

# Fetch visits with pagination.
#
# + filters - Filters for fetching visits
# + return - Array of visits objects or error
public isolated function fetchVisits(VisitFilters filters) returns VisitsResponse|error {
    stream<VisitRecord, sql:Error?> resultStream = databaseClient->query(fetchVisitsQuery(filters));

    int totalCount = 0;
    Visit[] visits = [];
    check from VisitRecord visit in resultStream
        do {
            string? accessibleLocations = visit.accessibleLocations;
            string? email = visit.email;
            totalCount = visit.totalCount;
            visits.push({
                id: visit.id,
                timeOfEntry: visit.timeOfEntry.endsWith(".0")
                    ? visit.timeOfEntry.substring(0, visit.timeOfEntry.length() - 2)
                    : visit.timeOfEntry,
                timeOfDeparture: visit.timeOfDeparture.endsWith(".0")
                    ? visit.timeOfDeparture.substring(0, visit.timeOfDeparture.length() - 2)
                    : visit.timeOfDeparture,
                passNumber: visit.passNumber,
                nicHash: visit.nicHash,
                nicNumber: check decrypt(visit.nicNumber),
                name: check decrypt(visit.name),
                email: email is () ? () : check decrypt(email),
                contactNumber: check decrypt(visit.contactNumber),
                companyName: visit.companyName,
                whomTheyMeet: visit.whomTheyMeet,
                purposeOfVisit: visit.purposeOfVisit,
                accessibleLocations: accessibleLocations is string ?
                    check accessibleLocations.fromJsonStringWithType() : null,
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
