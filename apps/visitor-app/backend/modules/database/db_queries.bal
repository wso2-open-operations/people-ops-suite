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

# Build query to fetch a visitor by hashed NIC.
#
# + hashedNic - Filter : Hashed NIC of the visitor
# + return - sql:ParameterizedQuery - Select query for the visitor based on the hashed NIC
isolated function getVisitorByNicQuery(string hashedNic) returns sql:ParameterizedQuery
    => `
        SELECT   
            nic_hash as nicHash,        
            name,
            nic_number as nicNumber,
            contact_number as contactNumber,
            email,
            created_by as createdBy,
            created_on as createdOn,
            updated_by as updatedBy,
            updated_on as updatedOn
        FROM 
            visitor
        WHERE 
            nic_hash = ${hashedNic};
        `;

# Build query to persist a visitor.
#
# + payload - Payload containing the visitor details
# + createdBy - Person who is creating the visitor
# + return - sql:ParameterizedQuery - Insert query for the new visitor
isolated function addVisitorQuery(AddVisitorPayload payload, string createdBy) returns sql:ParameterizedQuery
    => `
        INSERT INTO visitor
        (
            nic_hash,
            name,
            nic_number,
            email,
            contact_number,
            created_by,
            updated_by
        )
        VALUES
        (
            ${payload.nicHash},
            ${payload.name},
            ${payload.nicNumber},
            ${payload.email},
            ${payload.contactNumber},
            ${createdBy},
            ${createdBy}
        )
        ON DUPLICATE KEY UPDATE
            name = ${payload.name},
            nic_number = ${payload.nicNumber},
            email = ${payload.email},
            contact_number = ${payload.contactNumber},
            updated_by = ${createdBy}
        ;`;

# Build query to persist a visit.
#
# + payload - Payload containing the visit details
# + createdBy - Person who is creating the visit
# + inviationId - Invitation ID associated with the visit
# + return - sql:ParameterizedQuery - Insert query for the new visit
isolated function addVisitQuery(AddVisitPayload payload, string createdBy, int? inviationId) returns sql:ParameterizedQuery
    => `
        INSERT INTO visit
        (
            nic_hash,
            pass_number,
            company_name,
            whom_they_meet,
            purpose_of_visit,
            accessible_locations,
            time_of_entry,
            time_of_departure,
            invitation_id,
            status,
            created_by,
            updated_by
        )
        VALUES
        (
            ${payload.nicHash},
            ${payload.passNumber},
            ${payload.companyName},
            ${payload.whomTheyMeet},
            ${payload.purposeOfVisit},
            ${payload.accessibleLocations.toJsonString()},
            ${payload.timeOfEntry},
            ${payload.timeOfDeparture},
            ${inviationId},
            ${payload.status},
            ${createdBy},
            ${createdBy}
        );`;

# Build query to create a new invitation.
#
# + payload - Payload containing the invitation details
# + createdBy - Person who is creating the invitation
# + encodeString - Encoded uuid value
# + return - sql:ParameterizedQuery - Insert query for the new invitation
isolated function addInvitationQuery(AddInvitationPayload payload, string createdBy, string encodeString)
    returns sql:ParameterizedQuery
    
    => `
        INSERT INTO visit_invitation
        (
            encode_value,
            no_of_invitations,
            visit_info,
            is_active,
            created_by,
            updated_by
        )
        VALUES
        (
            ${encodeString},
            ${payload.noOfInvitations},
            ${payload.visitDetails.toJsonString()},
            ${payload.isActive},
            ${createdBy},
            ${payload.updatedBy}
        );`;

# Query to check whether invitation is active or inactive.
#
# + encodeValue - Encoded uuid value
# + return - Invitation object
isolated function checkInvitationQuery(string encodeValue) returns sql:ParameterizedQuery => `
        SELECT
            vi.invitation_id     AS invitationId,
            vi.is_active         AS isActive,
            vi.no_of_invitations AS noOfInvitations,
            vi.visit_info        AS visitDetails,
            vi.created_by      AS invitedBy
        FROM visit_invitation vi
        WHERE vi.encode_value = ${encodeValue}
        AND vi.is_active = 1;
    `;

isolated function getVisitsQuery(int? 'limit, int? offset, int? invitationId, string? status) returns sql:ParameterizedQuery {
    // Base query with joins to visitor and visit_invitation tables
    sql:ParameterizedQuery mainQuery = `
        SELECT 
            v.visit_id as id,
            v.time_of_entry as timeOfEntry,
            v.time_of_departure as timeOfDeparture,
            v.pass_number as passNumber,
            v.nic_hash as nicHash,
            vs.nic_number as nicNumber,
            vs.name,
            vs.email,
            vs.contact_number as contactNumber,
            v.company_name as companyName,
            v.whom_they_meet as whomTheyMeet,
            v.purpose_of_visit as purposeOfVisit,
            v.accessible_locations as accessibleLocations,
            v.status,
            v.created_by as createdBy,
            v.created_on as createdOn,
            v.updated_by as updatedBy,
            v.updated_on as updatedOn,
            vi.invitation_id as invitationId,
            COUNT(*) OVER() AS totalCount
        FROM 
            visit v
        LEFT JOIN
            visitor vs
        ON
            v.nic_hash = vs.nic_hash
        LEFT JOIN
            visit_invitation vi
        ON
            v.invitation_id = vi.invitation_id
    `;

    // Add WHERE clause for invitationId if provided
    if invitationId is int {
        mainQuery = sql:queryConcat(mainQuery, ` WHERE v.invitation_id = ${invitationId}`);
    }

    // Add WHERE clause for status if provided
    if status is string {
        mainQuery = sql:queryConcat(mainQuery, ` WHERE v.status = ${status}`);
    }

    // Sorting the result by time_of_entry in descending order
    mainQuery = sql:queryConcat(mainQuery, ` ORDER BY v.time_of_entry DESC`);

    // Setting the limit and offset for pagination
    if 'limit is int {
        mainQuery = sql:queryConcat(mainQuery, ` LIMIT ${'limit}`);
        if offset is int {
            mainQuery = sql:queryConcat(mainQuery, ` OFFSET ${offset}`);
        }
    } else {
        mainQuery = sql:queryConcat(mainQuery, ` LIMIT ${DEFAULT_LIMIT}`);
    }

    return mainQuery;
}

isolated function bulkUpdateVisitStatusQuery(VisitApprovePayload[] payloads) returns sql:ParameterizedQuery|error {

    sql:ParameterizedQuery[] statusCases = [];
    sql:ParameterizedQuery[] passNumberCases = [];
    int[] inClauseIds = []; // Changed from anydata[] to int[] since visit_id is likely an integer

    // Build CASE conditions and collect IDs for IN clause
    foreach VisitApprovePayload update in payloads {
        // Validate that passNumber is not null when status is ACCEPTED
        if update.status == "ACCEPTED" && update.passNumber is () {
            return error("passNumber cannot be null when status is ACCEPTED for visit_id: " + update.id.toString());
        }

        statusCases.push(sql:queryConcat(` WHEN visit_id = ${update.id} THEN ${update.status}`));
        passNumberCases.push(sql:queryConcat(` WHEN visit_id = ${update.id} THEN ${update.passNumber}`));
        inClauseIds.push(update.id);
    }

    // Combine CASE conditions into single queries
    sql:ParameterizedQuery statusCaseQuery = sql:queryConcat(...statusCases);
    sql:ParameterizedQuery passNumberCaseQuery = sql:queryConcat(...passNumberCases);

    // Construct the final parameterized query
    sql:ParameterizedQuery updateQuery = sql:queryConcat(
            `UPDATE visit SET status = CASE `,
            statusCaseQuery,
            ` ELSE status END, pass_number = CASE `,
            passNumberCaseQuery,
            ` ELSE pass_number END, updated_on = CURRENT_TIMESTAMP WHERE visit_id IN (`,
            sql:arrayFlattenQuery(inClauseIds),
            `)`
);

    return updateQuery;
}

# Build queries to update visit status and fetch visitor email.
#
# + payload - Payload containing the visit ID and the new status
# + return - Array of sql:ParameterizedQuery - First query updates the visit status, second
isolated function updateVisitStatusQuery(VisitApprovePayload payload) returns sql:ParameterizedQuery[] {
    sql:ParameterizedQuery updateQuery = sql:queryConcat(
            `UPDATE visit v `,
            `SET status = ${payload.status}, `,
            `pass_number = CASE WHEN ${payload.passNumber} IS NOT NULL THEN ${payload.passNumber} ELSE pass_number END, `,
            `updated_on = CURRENT_TIMESTAMP `,
            `WHERE v.visit_id = ${payload.id}`
    );

    sql:ParameterizedQuery selectQuery = sql:queryConcat(
            `SELECT vs.email `,
            `FROM visit v `,
            `JOIN visitor vs ON v.nic_hash = vs.nic_hash `,
            `WHERE v.visit_id = ${payload.id}`
    );

    return [updateQuery, selectQuery];
}
