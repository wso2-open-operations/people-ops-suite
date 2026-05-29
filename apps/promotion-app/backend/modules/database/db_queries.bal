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

# Retrieving users data query.
#
# + id - User id 
# + email - User email
# + return - ParameterizedQuery - Retrieving users Query
isolated function getUsersQuery(int? id = (), string? email = ()) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery sqlQuery = `
       SELECT 
            user_first_name as firstName, 
            user_last_name as lastName, 
            user_job_band as jobBand,
            user_id as id,
            user_roles as roles,
            user_email as email, 
            user_functional_lead_access_levels as functionalLeadAccessLevels,
            user_active as active
        FROM 
            hris_user`;

    sql:ParameterizedQuery[] filters = [];

    if id is int {
        filters.push(<sql:ParameterizedQuery>` user_id = ${id}`);
    }

    if email is string {
        filters.push(<sql:ParameterizedQuery>` user_email = ${email}`);
    }
    
    sql:ParameterizedQuery updatedQuery = buildSqlSelectQuery(sqlQuery,filters);

    return updatedQuery;
}

# Get Promotion cycle by status.
#
# + statusArray - Array of the promotion cycle status
# + return - sql:ParameterizedQuery - Get promotion cycles by given status 
isolated function getPromotionCyclesByStatusQuery(PromotionCyclesStatus[]? statusArray) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery sqlQuery = `
        SELECT 
            promotion_cycle_id as id,
            promotion_cycle_name as name, 
            promotion_cycle_start as startDate,
            promotion_cycle_end as endDate,
            promotion_cycle_lead_deadline as leadDeadline,
            promotion_cycle_functional_lead_deadline as functionalLeadDeadline,
            promotion_cycle_promotion_board_deadline as promotionBoardDeadline,
            promotion_cycle_status as status,
            promotion_cycle_created_by as createdBy,
            promotion_cycle_created_on as createdOn,
            promotion_cycle_updated_by as updatedBy,
            promotion_cycle_updated_on as updatedOn
        FROM 
            hris_promotion_cycle
       `;

    if statusArray is PromotionCyclesStatus[] {
        sqlQuery = sql:queryConcat(sqlQuery, `WHERE promotion_cycle_status IN (`,
                sql:arrayFlattenQuery(statusArray), `) `);
    }

    return sqlQuery;
}

# Get User Promotion Request Query.
#
# + employeeEmail - Work Email  
# + statusArray - Array of promotion Request Status  
# + cycleID - Promotion cycle ID  
# + id - Promotion Request ID  
# + businessAccessLevels - Functional lead  access levels  
# + 'type - Promotion Request Type  
# + recommendedBy - Lead who recommended the promotion
# + return - sql:ParameterizedQuery - Retrieve promotion requests for a specific user
isolated function getUserPromotionRequestsQuery(string? employeeEmail, string[]? statusArray, int? cycleID, int? id,
        FunctionalLeadAccessLevels? businessAccessLevels = (), string? 'type = (), string? recommendedBy = ())
        returns sql:ParameterizedQuery {

    sql:ParameterizedQuery sqlQuery = `
        SELECT 
            pr.promotion_request_id as id,
            pr.promotion_request_employee_email as employeeEmail,
            pr.promotion_request_status as status,
            pr.promotion_request_current_job_band as currentJobBand,
            pr.promotion_request_current_job_role as currentJobRole,
            pr.promotion_request_requested_job_band as nextJobBand,
            pr.promotion_request_statement as promotionStatement,
            pc.promotion_cycle_name as promotionCycle,
            pr.promotion_request_business_unit as businessUnit,
            pr.promotion_request_department as department,
            pr.promotion_request_team as team,
            pr.promotion_request_sub_team as subTeam,
            pr.promotion_request_type as promotionType,
            pr.promotion_request_reason_for_reject as reasonForRejection,
            pr.promotion_request_email_sent as isNotificationEmailSent,
            pr.promotion_request_created_by as createdBy,
            pr.promotion_request_created_on as createdOn,
            pr.promotion_request_updated_by as updatedBy,
            pr.promotion_request_updated_on as updatedOn
        FROM 
            hris_promotion_request  pr, hris_promotion_cycle pc
        WHERE 
			pr.promotion_cycle_id = pc.promotion_cycle_id

        `;

    if statusArray is string[] {
        sqlQuery = sql:queryConcat(sqlQuery, ` AND promotion_request_status IN (`,
                sql:arrayFlattenQuery(statusArray), `) `);
    }

    if cycleID is int {
        sqlQuery = sql:queryConcat(sqlQuery, ` AND pc.promotion_cycle_id = ${cycleID} `);
    }

    if id is int {
        sqlQuery = sql:queryConcat(sqlQuery, ` AND promotion_request_id = ${id} `);
    }

    if 'type is string {
        sqlQuery = sql:queryConcat(sqlQuery, ` AND promotion_request_type = ${'type} `);
    }

    if recommendedBy is string {
        sqlQuery = sql:queryConcat(sqlQuery, ` AND promotion_request_created_by = ${recommendedBy} `);
    }

    if businessAccessLevels is FunctionalLeadAccessLevels {

        BusinessUnit[]? businessUnits = businessAccessLevels.businessUnits;
        Department[]? departments;
        Team[]? teams;
        if businessUnits is BusinessUnit[] {
            boolean isFirst = true;
            sql:ParameterizedQuery query = ``;

            foreach BusinessUnit businessUnit in businessUnits {
                departments = businessUnit.departments;
                if departments is Department[] {
                    if departments.length() > 0 {
                        foreach Department department in departments {

                            teams = department.teams;
                            if teams is Team[] {

                                if teams.length() > 0 {
                                    foreach Team team in teams {
                                        if isFirst {
                                            query = sql:queryConcat(query, `AND (`);
                                        } else {
                                            query = sql:queryConcat(query, `OR `);
                                        }

                                        query = sql:queryConcat(query, `( 
                                        promotion_request_business_unit= ${businessUnit.name} AND
                                        promotion_request_department = ${department.name} AND 
                                        promotion_request_team = ${team.name} 
                                    ) `);
                                        isFirst = false;
                                    }
                                } else {
                                    if isFirst {
                                        query = sql:queryConcat(query, `AND (`);
                                    } else {
                                        query = sql:queryConcat(query, `OR `);
                                    }

                                    query = sql:queryConcat(query, `( 
                                        promotion_request_business_unit= ${businessUnit.name} AND
                                        promotion_request_department = ${department.name} 
                                    ) `);
                                    isFirst = false;
                                }

                            }
                        }
                    } else {
                        if isFirst {
                            query = sql:queryConcat(query, `AND (`);
                        } else {
                            query = sql:queryConcat(query, `OR `);
                        }

                        query = sql:queryConcat(query, `( 
                                        promotion_request_business_unit= ${businessUnit.name}
                                    ) `);
                        isFirst = false;
                    }

                }

            }

            if !isFirst {
                query = sql:queryConcat(query, ` )`);
                sqlQuery = sql:queryConcat(sqlQuery, query);
            }
        }
    }

    if employeeEmail is string {
        sqlQuery = sql:queryConcat(sqlQuery, ` AND promotion_request_employee_email = ${employeeEmail} `);
    }

    //Order By promotion cycle (desc).
    sqlQuery = sql:queryConcat(sqlQuery, ` ORDER BY pr.promotion_cycle_id desc `);
    return sqlQuery;
}

# Get Promotion Recommendation Query.
#
# + id - Recommendation ID  
# + employeeEmail - Recommendation requestor email  
# + leadEmail - Recommendation provider email  
# + statusArray - Promotion Recommendation Status  
# + cycleID - Promotion cycle ID  
# + promotionRequestId - Promotion Request Id
# + return - sql:ParameterizedQuery - Retrieve promotion recommendations
isolated function getFullPromotionRecommendationsQuery(int? id, string? employeeEmail, string? leadEmail,
        string[]? statusArray, int? cycleID, int? promotionRequestId) returns sql:ParameterizedQuery {

    sql:ParameterizedQuery sqlQuery = `
        SELECT 
            pr.promotion_request_id as requestId,
            pr.promotion_request_type as promotionType,
            pr.promotion_cycle_id as promotionCycleId,
            pr.promotion_request_requested_job_band as promotingJobBand,
            pr.promotion_request_current_job_band as currentJobBand,
            pr.promotion_request_employee_email as employeeEmail,
            pr.promotion_request_status as promotionRequestStatus,
            pr.promotion_request_reason_for_reject as reasonForRejection,
            pc.promotion_cycle_name as promotionCycle,
            prc.promotion_recommendation_id as recommendationId,
            prc.promotion_recommendation_lead_email as leadEmail,
            prc.promotion_recommendation_is_reporting_lead as reportingLead,
            prc.promotion_recommendation_comments as recommendationAdditionalComment,
            prc.promotion_recommendation_statement as recommendationStatement,
            prc.promotion_recommendation_status as recommendationStatus,
            prc.promotion_recommendation_created_by as createdBy,
            prc.promotion_recommendation_created_on as createdOn,
            prc.promotion_recommendation_updated_by as updatedBy,
            prc.promotion_recommendation_updated_on as updatedOn
        FROM 
            hris_promotion_request  pr, hris_promotion_recommendation prc, hris_promotion_cycle pc

        `;

    sql:ParameterizedQuery[] filters = [];

    filters.push(<sql:ParameterizedQuery>` pr.promotion_request_id = prc.promotion_request_id `);

    filters.push(<sql:ParameterizedQuery>` pr.promotion_cycle_id = pc.promotion_cycle_id`);

    if id is int {
        filters.push(<sql:ParameterizedQuery>` prc.promotion_recommendation_id = ${id} `);
    }

    if employeeEmail is string {
        filters.push(<sql:ParameterizedQuery>` pr.promotion_request_employee_email = ${employeeEmail} `);
    }

    if leadEmail is string {
        filters.push(<sql:ParameterizedQuery>` prc.promotion_recommendation_lead_email = ${leadEmail} `);
    }

    if statusArray is string[] {
        filters.push(sql:queryConcat(
            <sql:ParameterizedQuery>` prc.promotion_recommendation_status IN (`,
                sql:arrayFlattenQuery(statusArray), `) `));
    }

    if cycleID is int {
        filters.push(<sql:ParameterizedQuery>` pr.promotion_cycle_id = ${cycleID} `);
    }

    if promotionRequestId is int {
        filters.push(<sql:ParameterizedQuery>` pr.promotion_request_id = ${promotionRequestId} `);
    }

    sql:ParameterizedQuery updatedQuery = buildSqlSelectQuery(sqlQuery,filters);

    //Order By promotion cycle (desc).
    updatedQuery = sql:queryConcat(updatedQuery, ` ORDER BY pr.promotion_cycle_id desc `);

    return updatedQuery;
}

# Get Duplicate Promotion Request Count Query.
#
# + employeeEmail - WSO2 Email  
# + promotionCycleId - Promotion Cycle ID
# + return - sql:ParameterizedQuery - Retrieve duplicate promotion requests count
isolated function getDuplicatePromotionRequestCountQuery(string employeeEmail, int promotionCycleId)
        returns sql:ParameterizedQuery {

    sql:ParameterizedQuery mainQuery = `
        SELECT 
            COUNT(promotion_request_id) 
        FROM 
            hris_promotion_request
        WHERE 
            promotion_request_employee_email = ${employeeEmail} 
        AND 
            promotion_cycle_id = ${promotionCycleId} 
    `;

    return sql:queryConcat(
        mainQuery, ` AND  promotion_request_status NOT IN (`,
        sql:arrayFlattenQuery([WITHDRAW, EXPIRED, REMOVED]), `) `
    );
}

# Insert Promotion Request Query.
#
# + payload - Promotion Request Insert Payload  
# + return - sql:ParameterizedQuery - Inset query for the promotion request table
isolated function insertPromotionRequestQuery(PromotionRequestDbInsertPayload payload)
    returns sql:ParameterizedQuery 
    => `
        INSERT INTO 
            hris_promotion_request 
            ( 
              promotion_cycle_id,
              promotion_request_employee_email,
              promotion_request_requested_job_band,
              promotion_request_current_job_band,
              promotion_request_current_job_role,
              promotion_request_type,
              promotion_request_status,
              promotion_request_business_unit,
              promotion_request_department,
              promotion_request_team,
              promotion_request_sub_team,
              promotion_request_created_by,
              promotion_request_updated_by

            )
        VALUES 
            (
                ${payload.promotionCycleId},
                ${payload.employeeEmail},
                ${payload.requestedJobBand},
                ${payload.currentJobBand},
                ${payload.jobRole},
                ${payload.promotionType},
                ${payload.status},
                ${payload.businessUnit},
                ${payload.department},
                ${payload.team},
                ${payload.subTeam},
                ${payload.createdBy},
                ${payload.createdBy}
            )`;

# Insert Promotion Recommendation Query.
#
# + payload - Promotion Recommendation Data
# + return - sql:ParameterizedQuery - Insert query for the promotion recommendation table
isolated function insertPromotionRecommendationQuery(PromotionRecommendationInsertPayload payload)
    returns sql:ParameterizedQuery 
    
    => `
        INSERT INTO 
            hris_promotion_recommendation 
            ( 
                promotion_request_id,
                promotion_recommendation_lead_email,
                promotion_recommendation_is_reporting_lead,
                promotion_recommendation_statement,
                promotion_recommendation_comments,
                promotion_recommendation_status,
                promotion_recommendation_created_by,
                promotion_recommendation_updated_by
            )
        VALUES 
            (
                ${payload.promotionRequestID},
                ${payload.leadEmail},
                ${payload.isReportingLead},
                ${payload.statement},
                ${payload.comment},
                ${payload.status},
                ${payload.createdBy},
                ${payload.createdBy}
            )`;

# Update Promotion Recommendation Query
#
# + payload - Promotion Recommendation Update Payload
# + return - sql:ParameterizedQuery - Update query for the Promotion Recommendation
isolated function updatePromotionRecommendationQuery(PromotionRecommendationDbUpdatePayload payload)
        returns sql:ParameterizedQuery {
        
    sql:ParameterizedQuery sqlQuery = `
        UPDATE 
            hris_promotion_recommendation
        SET
        `;

    boolean isFirstUpdate = true;

    if payload.statement is string {
        sqlQuery = buildSqlUpdateQuery(isFirstUpdate, sqlQuery,
                `promotion_recommendation_statement = ${payload.statement}`);
        isFirstUpdate = false;
    }

    if payload.comments is string {
        sqlQuery = buildSqlUpdateQuery(isFirstUpdate, sqlQuery,
                `promotion_recommendation_comments = ${payload.comments}`);
        isFirstUpdate = false;
    }

    if payload.status is string {
        sqlQuery = buildSqlUpdateQuery(isFirstUpdate, sqlQuery,
                `promotion_recommendation_status = ${payload.status}`);
        isFirstUpdate = false;
    }
    
    sqlQuery = buildSqlUpdateQuery(isFirstUpdate, sqlQuery,
            `promotion_recommendation_updated_by = ${payload.updatedBy}`);

    sqlQuery = sql:queryConcat(sqlQuery, ` WHERE promotion_recommendation_id = ${payload.id}`);

    return sqlQuery;
}

# Update Promotion Request Query
#
# + payload - Promotion Request Update Payload  
# + return - sql:ParameterizedQuery - Update query for the Promotion Request
isolated function updatePromotionRequestQuery(ApplicationDbUpdatePayload payload)
    returns sql:ParameterizedQuery {

    sql:ParameterizedQuery sqlQuery = `
        UPDATE
            hris_promotion_request
        SET 

        `;

    boolean isFirstUpdate = true;

    if payload.promotingJobBand is int {
        sqlQuery = buildSqlUpdateQuery(isFirstUpdate, sqlQuery,
                ` promotion_request_requested_job_band = ${payload.promotingJobBand} `);
        isFirstUpdate = false;
    }

    if payload.businessUnit is string {
        sqlQuery = buildSqlUpdateQuery(isFirstUpdate, sqlQuery,
                ` promotion_request_business_unit = ${payload.businessUnit} `);
        isFirstUpdate = false;
    }

    if payload.isNotificationEmailSent is int {
        sqlQuery = buildSqlUpdateQuery(isFirstUpdate, sqlQuery,
                ` promotion_request_email_sent = ${payload.isNotificationEmailSent} `);
        isFirstUpdate = false;
    }

    if payload.reasonForRejection is string {
        sqlQuery = buildSqlUpdateQuery(isFirstUpdate, sqlQuery,
                ` promotion_request_reason_for_reject = ${payload.reasonForRejection} `);
        isFirstUpdate = false;
    }

    if payload.statement !is null {
        sqlQuery = buildSqlUpdateQuery(isFirstUpdate, sqlQuery, ` promotion_request_statement = ${payload.statement}`);
        isFirstUpdate = false;
    }

    if payload.status !is null {
        sqlQuery = buildSqlUpdateQuery(isFirstUpdate, sqlQuery, ` promotion_request_status = ${payload.status} `);
        isFirstUpdate = false;
    }

    sqlQuery = buildSqlUpdateQuery(isFirstUpdate, sqlQuery, ` promotion_request_updated_by = ${payload.updatedBy} `);

    return sql:queryConcat(sqlQuery, ` WHERE promotion_request_id = ${payload.id}`);
}

# Insert Promotion Cycle Query
#
# + payload - Promotion Cycle Insert Payload
# + return - sql:ParameterizedQuery - Insert query for the promotion cycle table
isolated function insertPromotionCycleQuery(PromotionCycleInsertData payload) returns sql:ParameterizedQuery {

    return `
    INSERT INTO hris.hris_promotion_cycle
        (
            promotion_cycle_name,
            promotion_cycle_start,
            promotion_cycle_end,
            promotion_cycle_lead_deadline,
            promotion_cycle_functional_lead_deadline,
            promotion_cycle_promotion_board_deadline,
            promotion_cycle_status,
            promotion_cycle_created_by,
            promotion_cycle_updated_by
        )
    VALUES
        (
            ${payload.name},
            ${payload.startDate},
            ${payload.endDate},
            ${payload.leadDeadline},
            ${payload.functionalLeadDeadline},
            ${payload.promotionBoardDeadline},
            ${payload.status},
            ${payload.createdBy},
            ${payload.createdBy}
                
        )`;
}

# Get Configs Query
#
# + key - Specific the key of the config record
# + return - sql:ParameterizedQuery - retrieve configs from the hris_config table
isolated function getConfigsQuery(string? key = ()) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery sqlQuery = `
            SELECT 
                config_key AS 'key',
                config_value AS 'value',
                config_additional_info AS 'additionalInfo',
                config_created_by AS 'createdBy',
                config_created_on AS 'createdOn',
                config_updated_by As 'updatedBy',
                config_updated_on As 'updatedOn'
            FROM 
                hris_config`;
    if key is string {
        sqlQuery = sql:queryConcat(sqlQuery, ` WHERE config_key = ${key}`);
    }

    return sqlQuery;
}

# Update Promotion Cycle
#
# + payload - Promotion Cycle Update Payload
# + return - sql:ParameterizedQuery - Insert query for the promotion cycle table
isolated function updatePromotionCycleQuery(PromotionCycleDbUpdateData payload) returns sql:ParameterizedQuery {

    sql:ParameterizedQuery sqlQuery = `
        UPDATE 
            hris_promotion_cycle
        SET
        `;

    boolean isFirstUpdate = true;

    if payload.name is string {
        sqlQuery = buildSqlUpdateQuery(isFirstUpdate, sqlQuery,
                `promotion_cycle_name = ${payload.name}`);
        isFirstUpdate = false;
    }

    if payload.startDate is string {
        sqlQuery = buildSqlUpdateQuery(isFirstUpdate, sqlQuery,
                `promotion_cycle_start = ${payload.startDate}`);
        isFirstUpdate = false;
    }

    if payload.endDate is string {
        sqlQuery = buildSqlUpdateQuery(isFirstUpdate, sqlQuery,
                `promotion_cycle_end = ${payload.endDate}`);
        isFirstUpdate = false;
    }

    if payload.status is string {
        sqlQuery = buildSqlUpdateQuery(isFirstUpdate, sqlQuery,
                `promotion_cycle_status = ${payload.status}`);
        isFirstUpdate = false;
    }
    sqlQuery = buildSqlUpdateQuery(isFirstUpdate, sqlQuery,
            `promotion_cycle_updated_by = ${payload.updatedBy}`);

    return sql:queryConcat(sqlQuery, ` WHERE promotion_cycle_id = ${payload.id}`);
}

# Expire pending promotion requests Query
#
# + promotionCycleId - Promotion Cycle ID  
# + updatedBy - Person who updated the record
# + return - sql:ParameterizedQuery - expire pending promotion requests query
isolated function expirePendingRequestsQuery(int promotionCycleId, string updatedBy) returns sql:ParameterizedQuery {

    return `
        UPDATE hris_promotion_request
        SET
            promotion_request_updated_by = ${updatedBy},
            promotion_request_status = ${EXPIRED}
        WHERE 
            promotion_cycle_id = ${promotionCycleId} AND promotion_request_status = ${DRAFT};
        `;
}

# Expire pending promotion requests Query
#
# + promotionCycleId - Promotion Cycle ID  
# + updatedBy - Person who updated the record
# + return - sql:ParameterizedQuery - expire pending promotion requests query
isolated function expirePendingRecommendationsQuery(int promotionCycleId, string updatedBy)
    returns sql:ParameterizedQuery {

    sql:ParameterizedQuery sqlQuery = `
        UPDATE hris_promotion_recommendation
        SET
            promotion_recommendation_updated_by = ${updatedBy},
            promotion_recommendation_status = ${EXPIRED}
        WHERE promotion_recommendation_id 
            IN (
                SELECT recommendationId from ( 
                    SELECT 
                        prc.promotion_recommendation_id as recommendationId
                    FROM 
                        hris.hris_promotion_recommendation prc,
                        hris_promotion_request pr
                    WHERE
                        pr.promotion_request_id = prc.promotion_request_id
                        AND
                        pr.promotion_cycle_id = ${promotionCycleId}

        `;
    //Status array of pending promotion recommendations
    string[] statusArray = [DRAFT, REQUESTED];
    sqlQuery = sql:queryConcat(sqlQuery, ` AND prc.promotion_recommendation_status IN (`,
            sql:arrayFlattenQuery(statusArray), `) ) as selectionTable)`);

    return sqlQuery;
}

# Update User Query
#
# + payload - User Update Payload
# + return - sql:ParameterizedQuery - Update query for the User
isolated function updateUserQuery(UserDbUpdatePayload payload) returns sql:ParameterizedQuery {

    sql:ParameterizedQuery sqlQuery = `
        UPDATE 
            hris_user
        SET
        `;

    boolean isFirstUpdate = true;

    if payload.firstName is string {
        sqlQuery = buildSqlUpdateQuery(isFirstUpdate, sqlQuery,
                `user_first_name = ${payload.firstName}`);
        isFirstUpdate = false;
    }

    if payload.lastName is string {
        sqlQuery = buildSqlUpdateQuery(isFirstUpdate, sqlQuery,
                `user_last_name = ${payload.lastName}`);
        isFirstUpdate = false;
    }

    if payload.jobBand is int {
        sqlQuery = buildSqlUpdateQuery(isFirstUpdate, sqlQuery,
                `user_job_band = ${payload.jobBand}`);
        isFirstUpdate = false;
    }

    if payload.email is string {
        sqlQuery = buildSqlUpdateQuery(isFirstUpdate, sqlQuery,
                `user_email = ${payload.email}`);
        isFirstUpdate = false;
    }

    if payload.businessUnit is string {
        sqlQuery = buildSqlUpdateQuery(isFirstUpdate, sqlQuery,
                `user_business_unit = ${payload.businessUnit}`);
        isFirstUpdate = false;
    }

    if payload.active is boolean {
        sqlQuery = buildSqlUpdateQuery(isFirstUpdate, sqlQuery,
                `user_active = ${payload.active}`);
        isFirstUpdate = false;
    }

    if payload.roles is Role[] {
        sqlQuery = buildSqlUpdateQuery(isFirstUpdate, sqlQuery,
                `user_roles = ${string:'join(",", ...payload.roles ?: [])}`);
        isFirstUpdate = false;
    }

    if payload.functionalLeadAccessLevels !is () {
        sqlQuery = buildSqlUpdateQuery(isFirstUpdate, sqlQuery,
            `user_functional_lead_access_levels = ${payload.functionalLeadAccessLevels.toString()}`);
        isFirstUpdate = false;
    }

    sqlQuery = buildSqlUpdateQuery(isFirstUpdate, sqlQuery, `user_updated_by = ${payload.updatedBy}`);

    // isFirstUpdate = false;
    // sqlQuery = buildSqlUpdateQuery(isFirstUpdate, sqlQuery,
    //         `user_functional_lead_access_levels = ${payload.functionalLeadAccessLevels is () ?
    //     "{}" : payload.functionalLeadAccessLevels.toString()}`);

    sqlQuery = sql:queryConcat(sqlQuery, `WHERE user_id = ${payload.id}`);

    return sqlQuery;
}

# Get Business unit mapping Query
#
# + return - sql:ParameterizedQuery - Get Business unit mapping Query
isolated function getBusinessUnitMappingQuery() returns sql:ParameterizedQuery {
    return `
        SELECT 
            business_unit_id AS id,
            business_unit_name AS businessUnit,
            (
                SELECT
                    JSON_ARRAYAGG(JSON_OBJECT(
                        'id', d.team_id,
                        'name' , d.team_name,
                        'teams', (
                                    SELECT 
                                        JSON_ARRAYAGG(JSON_OBJECT(
                                            'id',t.unit_id,
                                            'name',t.unit_name,
                                            'subTeams',(
                                                            SELECT
                                                                JSON_ARRAYAGG(JSON_OBJECT(
                                                                    'id' , st.sub_unit_id,
                                                                    'name', st.sub_unit_name
                                                                    ))
                                                            FROM
                                                                hris_sub_unit st
                                                                RIGHT JOIN
                                                                (SELECT * FROM hris_business_unit_team_unit_sub_unit WHERE business_unit_team_unit_sub_unit_is_active = 1) budtst
                                                                ON st.sub_unit_id = budtst.sub_unit_id
                                                            WHERE budtst.business_unit_team_unit_id = budt.business_unit_team_unit_id
                                            )
                                        ))
                                    FROM 
                                        hris_unit t
                                        RIGHT JOIN
                                        (SELECT * FROM hris_business_unit_team_unit WHERE business_unit_team_unit_is_active = 1) budt
                                        ON t.unit_id = budt.unit_id
                                    WHERE budt.business_unit_team_id = bud.business_unit_team_id
                        )
                    ))
                FROM 
                    hris_team d
                    RIGHT JOIN
                    (SELECT * FROM hris_business_unit_team WHERE business_unit_team_is_active = 1) bud
                    ON d.team_id = bud.team_id
                WHERE bud.business_unit_id = bu.business_unit_id
            ) AS departments
        FROM 
            hris_business_unit bu
        WHERE
            bu.business_unit_id IN (SELECT distinct(business_unit_id) FROM hris_business_unit_team WHERE business_unit_team_is_active = 1)
    `;

}

# Insert user query
#
# + payload - User insert payload
# + return - sql:ParameterizedQuery - Insert query for the user
isolated function insertUserQuery(UserDbInsertPayload payload) returns sql:ParameterizedQuery {

    return `
        INSERT INTO hris_user 
            ( 
                user_first_name,
                user_last_name,
                user_job_band,
                user_email,
                user_functional_lead_access_levels,
                user_roles,
                user_created_by,
                user_updated_by
            )
        VALUES 
            (
                ${payload.firstName},
                ${payload.lastName},
                ${payload.jobBand},
                ${payload.email},
                ${payload.functionalLeadAccessLevels !is () ?
        payload.functionalLeadAccessLevels.toString() : ()},
                ${string:'join(",", ...payload.roles)},
                ${payload.createdBy},
                ${payload.createdBy}
            )`;
}

# Deleting user by user-id query
#
# + id - User id 
# + return - ParameterizedQuery - delete user by user-id Query
isolated function deleteUserQuery(int id) returns sql:ParameterizedQuery {
    return `DELETE FROM hris_user WHERE ( user_id = ${id} )`;
}

isolated function getBlobFieldQuery(sql:ParameterizedQuery fieldName) returns sql:ParameterizedQuery =>
    fieldName;

isolated function getEmailNotificationsQuery(EmailStatus emailStatus, int count) returns sql:ParameterizedQuery =>
    sql:queryConcat(`
        SELECT
            promotion_email_id,
            promotion_cycle_id,
            promotion_email_recipient_email,
            promotion_email_recipient_name,
            promotion_email_type,
            promotion_email_status,`,
        getBlobFieldQuery(`promotion_email_template_data`), ` AS promotion_email_template_data`, `
        FROM
            hris_promotion_email
        WHERE
            promotion_email_status = ${emailStatus}
        LIMIT ${count}
        FOR UPDATE
    `);

isolated function updateEmailNotificationsStateQuery(int[] ids, EmailStatus emailStatus)
        returns sql:ParameterizedQuery =>
    sql:queryConcat(`
        UPDATE
            hris_promotion_email
        SET
            promotion_email_status = ${emailStatus}
        WHERE promotion_email_id in (`, sql:arrayFlattenQuery(ids), `)
    `);

# Get Promotion cycle by id
#
# + id - Promotion Cycle id
# + return - sql:ParameterizedQuery - Get promotion cycle by given id 
isolated function getPromotionCyclesByIdQuery(int id) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery sqlQuery = `
        SELECT 
            promotion_cycle_id as id,
            promotion_cycle_name as name, 
            promotion_cycle_start as startDate,
            promotion_cycle_end as endDate,
            promotion_cycle_status as status,
            promotion_cycle_created_by as createdBy,
            promotion_cycle_created_on as createdOn,
            promotion_cycle_updated_by as updatedBy,
            promotion_cycle_updated_on as updatedOn
        FROM 
            hris_promotion_cycle
        WHERE promotion_cycle_id = ${id}`;

    return sqlQuery;
}

isolated function insertEmailNotificationQuery(InsertEmailData[] emailNotifications)
        returns sql:ParameterizedQuery[] => from InsertEmailData emailNotification in emailNotifications
    let InsertEmailData {cycleId, recipientEmail, recipientName, emailType, status, templateData} = emailNotification
    select `
        INSERT IGNORE INTO hris_promotion_email (
            promotion_cycle_id,
            promotion_email_recipient_email,
            promotion_email_recipient_name,
            promotion_email_type,
            promotion_email_status,
            promotion_email_template_data
        )
        VALUES (
            ${cycleId},
            ${recipientEmail},
            ${recipientName},
            ${emailType},
            ${status},
            ${templateData}
        )
    `;

# Insert or update record to hris_config Query
#
# + payload - Key,Value and the metadata for create config record
# + return - sql:ParameterizedQuery - Inset or update query for the hris_config table
isolated function insertOrUpdateConfigQuery(ConfigUpdatePayload payload) returns sql:ParameterizedQuery {
    return `
        INSERT INTO 
            hris_config
            (
                config_key,
                config_value,
                config_additional_info,
                config_created_by,
                config_updated_by
            ) 
        VALUES 
            (
                ${payload.key},
                ${payload.value},
                ${payload.additionalInfo},
                ${payload.updatedBy},
                ${payload.updatedBy}
            )
        ON DUPLICATE KEY 
        UPDATE 
            config_key = ${payload.key},
            config_value = ${payload.value},
            config_additional_info = ${payload.additionalInfo},
            config_created_by = ${payload.updatedBy},
            config_updated_by = ${payload.updatedBy}
        `;
}

# Retire list of recommended leads for give promotion type and cycle.
#
# + cycleID - Promotion cycle ID  
# + 'type - Type of the promotion request
# + return - sql:ParameterizedQuery - Retire promotion requests with recommendations Query.
isolated function getRecommendedLeadsQuery(int? cycleID = (), PromotionRequestType? 'type = ())
    returns sql:ParameterizedQuery {

    sql:ParameterizedQuery sqlQuery = `
            SELECT 
                distinct (prc.promotion_recommendation_lead_email) AS 'leadEmail'
                
            FROM 
                hris.hris_promotion_request pr
            LEFT JOIN
                hris.hris_promotion_recommendation prc
            ON
                pr.promotion_request_id = prc.promotion_request_id
        `;

    sql:ParameterizedQuery[] filters = [];

    if cycleID is int {
        sql:ParameterizedQuery secondQuery = `pr.promotion_cycle_id = ${cycleID}`;
        filters.push(secondQuery);
    }

    if 'type is PromotionRequestType {
        sql:ParameterizedQuery secondQuery = `pr.promotion_request_type = ${'type}`;
        filters.push(secondQuery);
    }

    if filters.length() > 0 {
        boolean firstCondition = true;
        foreach sql:ParameterizedQuery secondQuery in filters {
            if firstCondition {
                sqlQuery = sql:queryConcat(sqlQuery, ` WHERE `, secondQuery);
                firstCondition = false;
                continue;
            }
            sqlQuery = sql:queryConcat(sqlQuery, ` AND `, secondQuery);
        }
    }

    sql:ParameterizedQuery groupingQuery = `
            GROUP BY 
                prc.promotion_recommendation_lead_email
            `;

    return sql:queryConcat(sqlQuery, ` `, groupingQuery);

}
