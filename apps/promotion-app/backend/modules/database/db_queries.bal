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

    // TODO : move this functionality to separate function.
    if filters.length() > 0 {
        boolean firstCondition = true;
        foreach sql:ParameterizedQuery condition in filters {
            if firstCondition {
                sqlQuery = sql:queryConcat(sqlQuery, ` WHERE `, condition);
                firstCondition = false;
            } else {
                sqlQuery = sql:queryConcat(sqlQuery, ` AND `, condition);
            }
        }
    }

    return sqlQuery;
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
        WHERE
			pr.promotion_request_id = prc.promotion_request_id
		AND
			pr.promotion_cycle_id = pc.promotion_cycle_id
        `;

    if id is int {
        sqlQuery = sql:queryConcat(sqlQuery, ` AND prc.promotion_recommendation_id = ${id} `);
    }

    if employeeEmail is string {
        sqlQuery = sql:queryConcat(sqlQuery, ` AND pr.promotion_request_employee_email = ${employeeEmail} `);
    }

    if leadEmail is string {
        sqlQuery = sql:queryConcat(sqlQuery, ` AND prc.promotion_recommendation_lead_email = ${leadEmail} `);
    }

    if statusArray is string[] {
        sqlQuery = sql:queryConcat(sqlQuery, ` AND prc.promotion_recommendation_status IN (`,
                sql:arrayFlattenQuery(statusArray), `)  `);
    }

    if cycleID is int {
        sqlQuery = sql:queryConcat(sqlQuery, ` AND pr.promotion_cycle_id = ${cycleID} `);
    }

    if promotionRequestId is int {
        sqlQuery = sql:queryConcat(sqlQuery, ` AND pr.promotion_request_id = ${promotionRequestId} `);
    }

    //Order By promotion cycle (desc).
    sqlQuery = sql:queryConcat(sqlQuery, ` ORDER BY pr.promotion_cycle_id desc `);

    return sqlQuery;
}
