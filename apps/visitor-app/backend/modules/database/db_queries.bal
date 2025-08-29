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
# + hashedNIC - Filter : Hashed NIC of the visitor
# + return - sql:ParameterizedQuery - Select query for the visitor based on the hashed NIC
isolated function getVisitorByNicQuery(string hashedNIC) returns sql:ParameterizedQuery
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
        nic_hash = ${hashedNIC}
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
    ;`
;

# Build query to persist a visit.
#
# + payload - Payload containing the visit details
# + createdBy - Person who is creating the visit
# + return - sql:ParameterizedQuery - Insert query for the new visit
isolated function addVisitQuery(DatabaseAddVisitPayload payload, string createdBy) returns sql:ParameterizedQuery
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
        ${payload.status},
        ${createdBy},
        ${createdBy}
    );`
;

# Build query to fetch visits with pagination.
#
# + 'limit - Limit number of visits to fetch
# + offset - Offset for pagination
# + return - sql:ParameterizedQuery - Select query for the visits with pagination
isolated function getVisitsQuery(int? 'limit, int? offset) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery mainQuery = `
        SELECT 
            v.visit_id as visitId,
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
            COUNT(*) OVER() AS totalCount
        FROM 
            visit v
        LEFT JOIN
            visitor vs
        ON
            v.nic_hash = vs.nic_hash
    `;

    // Sorting the result by created_on.
    mainQuery = sql:queryConcat(mainQuery, ` ORDER BY v.time_of_entry DESC`);

    // Setting the limit and offset.
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
