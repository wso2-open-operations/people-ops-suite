// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import par_app.types;

import ballerina/sql;

isolated function createParCycleQuery(ParCycle parCycle) returns sql:ParameterizedQuery =>
    let ParCycle {parCycleName, parCycleStartDate, parCycleEndDate, parEvaluationStartDate,
        parEvaluationEndDate, parEmployeeDeadline, parLeadDeadline, parSpecialRatingDeadline,
        parThreeSixtyRatingDeadline, parF2FDeadline, parCycleConfigurations, parCycleStatus, parCycleCreatedBy,
        parCycleUpdatedBy} = parCycle
    in `
        INSERT INTO
            hris_par_cycle
            (
                par_cycle_name,
                par_cycle_start_date,
                par_cycle_end_date,
                par_evaluation_start_date,
                par_evaluation_end_date,
                par_employee_deadline,
                par_lead_deadline,
                par_special_rating_deadline,
                par_f2f_deadline,
                par_three_sixty_rating_deadline,
                par_cycle_config,
                par_cycle_status,
                par_cycle_created_by,
                par_cycle_updated_by
            )
        VALUES
            (
                ${parCycleName},
                ${parCycleStartDate},
                ${parCycleEndDate},
                ${parEvaluationStartDate},
                ${parEvaluationEndDate},
                ${parEmployeeDeadline},
                ${parLeadDeadline},
                ${parSpecialRatingDeadline},
                ${parF2FDeadline},
                ${parThreeSixtyRatingDeadline},
                ${parCycleConfigurations},
                ${parCycleStatus},
                ${parCycleCreatedBy},
                ${parCycleUpdatedBy}
            )
    `;

isolated function getParCyclesByStatusAndEmailQuery(types:ParCycleStatus? status, string? email)
    returns sql:ParameterizedQuery => `
        SELECT
            par_cycle_id,
            par_cycle_name,
            par_cycle_start_date,
            par_cycle_end_date,
            par_evaluation_start_date,
            par_evaluation_end_date,
            par_employee_deadline,
            par_lead_deadline,
            par_special_rating_deadline,
            par_f2f_deadline,
            par_three_sixty_rating_deadline,
            par_cycle_config,
            par_cycle_status,
            par_cycle_created_by,
            par_cycle_created_on,
            par_cycle_updated_by,
            par_cycle_updated_on
        FROM hris_par_cycle
        WHERE
            (${status} IS NULL OR par_cycle_status = ${status})
            AND (${email} IS NULL OR par_cycle_id
                IN (SELECT par_cycle_id FROM hris_par_rating WHERE par_employee_email = ${email}))
    `;

isolated function getParCyclesByStatusQuery(types:ParCycleStatus[] status) returns sql:ParameterizedQuery =>
    sql:queryConcat(`
        SELECT
            par_cycle_id,
            par_cycle_name,
            par_cycle_start_date,
            par_cycle_end_date,
            par_evaluation_start_date,
            par_evaluation_end_date,
            par_employee_deadline,
            par_lead_deadline,
            par_special_rating_deadline,
            par_f2f_deadline,
            par_three_sixty_rating_deadline,
            par_cycle_config,
            par_cycle_status,
            par_cycle_created_by,
            par_cycle_created_on,
            par_cycle_updated_by,
            par_cycle_updated_on
        FROM hris_par_cycle
        WHERE par_cycle_status in (`, sql:arrayFlattenQuery(status), `)
    `);

isolated function getParCycleByIdQuery(int parCycleId) returns sql:ParameterizedQuery => `
    SELECT
        par_cycle_id,
        par_cycle_name,
        par_cycle_start_date,
        par_cycle_end_date,
        par_evaluation_start_date,
        par_evaluation_end_date,
        par_employee_deadline,
        par_lead_deadline,
        par_special_rating_deadline,
        par_f2f_deadline,
        par_three_sixty_rating_deadline,
        par_cycle_config,
        par_cycle_status,
        par_cycle_created_by,
        par_cycle_created_on,
        par_cycle_updated_by,
        par_cycle_updated_on
    FROM hris_par_cycle
    WHERE par_cycle_id = ${parCycleId}
`;

isolated function updateParCycleQuery(ParCycleOptionalized parCycle) returns sql:ParameterizedQuery =>
    let ParCycleOptionalized {parCycleName, parCycleStartDate, parCycleEndDate, parEvaluationStartDate,
        parEvaluationEndDate, parEmployeeDeadline, parLeadDeadline, parSpecialRatingDeadline, parF2FDeadline,
        parThreeSixtyRatingDeadline, parCycleStatus, parCycleConfigurations, parCycleUpdatedBy} = parCycle
    in `
        UPDATE
            hris_par_cycle
        SET
            par_cycle_name = COALESCE(${parCycleName}, par_cycle_name),
            par_cycle_start_date = COALESCE(${parCycleStartDate}, par_cycle_start_date),
            par_cycle_end_date = COALESCE(${parCycleEndDate}, par_cycle_end_date),
            par_evaluation_start_date = COALESCE(${parEvaluationStartDate}, par_evaluation_start_date),
            par_evaluation_end_date = COALESCE(${parEvaluationEndDate}, par_evaluation_end_date),
            par_employee_deadline = COALESCE(${parEmployeeDeadline}, par_employee_deadline),
            par_lead_deadline = COALESCE(${parLeadDeadline}, par_lead_deadline),
            par_special_rating_deadline = COALESCE(${parSpecialRatingDeadline}, par_special_rating_deadline),
            par_f2f_deadline = COALESCE(${parF2FDeadline}, par_f2f_deadline),
            par_three_sixty_rating_deadline = COALESCE(${parThreeSixtyRatingDeadline},
                par_three_sixty_rating_deadline),
            par_cycle_status = COALESCE(${parCycleStatus}, par_cycle_status),
            par_cycle_config = COALESCE(${parCycleConfigurations}, par_cycle_config),
            par_cycle_updated_by = COALESCE(${parCycleUpdatedBy}, par_cycle_updated_by)
        WHERE
            par_cycle_id = ${parCycle.parCycleId}
    `;

isolated function createParSpecialRatingQuotaQuery(ParSpecialRatingQuota parSpecialRatingQuota)
    returns sql:ParameterizedQuery =>
    let ParSpecialRatingQuota {parCycleId, parQuotaName, parTop5Quota, parTop20Quota,
        parSrQuotaCreatedBy, parSrQuotaUpdatedBy, allocatedLeads} = parSpecialRatingQuota
    in `
        INSERT INTO hris_par_special_rating_quota (
            par_cycle_id,
            par_special_quota_name,
            par_top5_quota,
            par_top20_quota,
            par_sr_quota_created_by,
            par_sr_quota_updated_by,
            par_allowed_leads
        ) VALUES (
            ${parCycleId},
            ${parQuotaName},
            ${parTop5Quota},
            ${parTop20Quota},
            ${parSrQuotaCreatedBy},
            ${parSrQuotaUpdatedBy},
            ${allocatedLeads.toBalString()}
        )
    `;

isolated function updateParSpecialRatingGroupQuotaIdQuery(int parCycleId, int specialRatingGroupId,
        int specialRatingQuotaId)
    returns sql:ParameterizedQuery => `
        UPDATE
            hris_par_special_rating_group
        SET
            par_special_quota_id = ${specialRatingQuotaId}
        WHERE
            par_special_rating_group_id = ${specialRatingGroupId} AND
            par_cycle_id = ${parCycleId}
    `;

isolated function bulkInsertParRatingQuery(ParRating[] parRatings) returns sql:ParameterizedQuery[] {
    return from ParRating rating in parRatings
        let ParRating {parEmployeeEmail, parEmployeeName, parCycleId, parCompany, parLocation, parTeamId, parRating,
            parSpecialRating, parEmployeeStatus, parLeadStatus, parF2fStatus, parEmployeeAcceptanceStatus,
            parRatingCreatedBy, parRatingUpdatedBy, parSpecialRatingEligibility} = rating
        select sql:queryConcat(`
            INSERT INTO hris_par_rating (
                par_employee_email,
                par_employee_name,
                par_cycle_id,
                par_company,
                par_location,
                par_team_id,
                par_rating,
                par_special_rating,
                par_employee_status,
                par_lead_status,
                par_f2f_status,
                par_employee_acceptance_status,
                par_rating_created_by,
                par_rating_updated_by,
                par_special_rating_eligibility
            )
            VALUES (
                ${parEmployeeEmail},
                ${parEmployeeName},
                ${parCycleId},
                ${parCompany},
                ${parLocation},
                ${parTeamId},`,
                getAesEncryptionValueQuery(parRating), `,`,
                getAesEncryptionValueQuery(parSpecialRating), `,`, `
                ${parEmployeeStatus},
                ${parLeadStatus},
                ${parF2fStatus},
                ${parEmployeeAcceptanceStatus},
                ${parRatingCreatedBy},
                ${parRatingUpdatedBy},
                ${parSpecialRatingEligibility}
            )
        `);
}

isolated function getLeadOfEmployeeInActiveParCycleQuery(string email) returns sql:ParameterizedQuery => `
    SELECT par_lead_email
    FROM hris_par_team
    WHERE par_team_id = (
            SELECT par_team_id
            FROM hris_par_rating
            WHERE par_employee_email = ${email} AND
                par_cycle_id = (
                    SELECT par_cycle_id
                    FROM hris_par_cycle
                    WHERE par_cycle_status = ${types:OPEN}
                )
        )
`;

isolated function getParRatingQuery(int parCycleId, string email) returns sql:ParameterizedQuery =>
    sql:queryConcat(`
        SELECT
            par_rating_id,
            par_employee_email,
            par_employee_name,
            par_cycle_id,
            par_company,
            par_location,
            par_team_id,`,
        getAesDecryptionFieldQuery(`par_rating`), ` AS par_rating,`,
        getAesDecryptionFieldQuery(`par_special_rating`), ` AS par_special_rating,`,
        getAesDecryptionFieldQuery(`par_employee_comment`), ` AS par_employee_comment,`, `
            par_employee_status,`,
        getAesDecryptionFieldQuery(`par_lead_comment`), ` AS par_lead_comment,`, `
            par_lead_status,
            par_f2f_status,
            par_f2f_date,
            par_employee_acceptance_status,`,
        getAesDecryptionFieldQuery(`par_employee_acceptance_comment`), ` AS par_employee_acceptance_comment,`,
        getAesDecryptionFieldQuery(`par_admin_comment`), ` AS par_admin_comment,`, `
            par_rating_created_by,
            par_rating_updated_by,
            par_rating_shared_by,
            par_performance_notice_ack
        FROM
            hris_par_rating
        WHERE
            par_cycle_id = ${parCycleId} AND
            par_employee_email = ${email}
    `);

isolated function getParRatingsWithoutCommentsQuery(int parCycleId) returns sql:ParameterizedQuery =>
    sql:queryConcat(`
        SELECT
            par_rating_id,
            par_employee_email,
            par_employee_name,
            par_cycle_id,
            par_company,
            par_location,
            par_team_id,`,
        getAesDecryptionFieldQuery(`par_rating`), ` AS par_rating,`,
        getAesDecryptionFieldQuery(`par_special_rating`), ` AS par_special_rating,`, `
            par_employee_status,
            par_lead_status,
            par_f2f_status,
            par_f2f_date,
            par_employee_acceptance_status,
            par_rating_created_by,
            par_rating_updated_by
        FROM
            hris_par_rating
        WHERE
            par_cycle_id = ${parCycleId}
`);

isolated function updateParRatingQuery(ParRatingOptionalized rating) returns sql:ParameterizedQuery {
    ParRatingOptionalized {parRating, parSpecialRating, parEmployeeComment, parEmployeeStatus,
        parLeadComment, parLeadStatus, parF2fStatus, parF2fDate, parEmployeeAcceptanceStatus,
        parEmployeeAcceptanceComment, parAdminComment, parPerformanceNoticeAck} = rating;
    sql:ParameterizedQuery updateQuery = `
        UPDATE
            hris_par_rating
        SET
            par_employee_status = COALESCE(${parEmployeeStatus}, par_employee_status),
            par_lead_status = COALESCE(${parLeadStatus}, par_lead_status),
            par_f2f_status = COALESCE(${parF2fStatus}, par_f2f_status),
            par_f2f_date = COALESCE(${parF2fDate}, par_f2f_date),
            par_employee_acceptance_status = COALESCE(${parEmployeeAcceptanceStatus}, par_employee_acceptance_status),
    `;
    if parRating != () {
        updateQuery = sql:queryConcat(updateQuery, `par_rating = `,
                getAesEncryptionValueQuery(parRating), `,`,
                `par_rating_shared_by = ${rating.parRatingUpdatedBy}, `);
    }
    if parSpecialRating != () {
        updateQuery = sql:queryConcat(updateQuery, `par_special_rating = `,
                getAesEncryptionValueQuery(parSpecialRating), `,`);
    }
    if parEmployeeComment != () {
        updateQuery = sql:queryConcat(updateQuery, `par_employee_comment = `,
                getAesEncryptionValueQuery(parEmployeeComment), `,`);
    }
    if parLeadComment != () {
        updateQuery = sql:queryConcat(updateQuery, `par_lead_comment = `,
                getAesEncryptionValueQuery(parLeadComment), `,`);
    }
    if parEmployeeAcceptanceComment != () {
        updateQuery = sql:queryConcat(updateQuery, `par_employee_acceptance_comment = `,
                getAesEncryptionValueQuery(parEmployeeAcceptanceComment), `,`);
    }
    if parAdminComment != () {
        updateQuery = sql:queryConcat(updateQuery, `par_admin_comment = `,
                getAesEncryptionValueQuery(parAdminComment), `,`);
    }
    if parPerformanceNoticeAck != () {
        updateQuery = sql:queryConcat(updateQuery, `par_performance_notice_ack =
            COALESCE(${parPerformanceNoticeAck}, par_performance_notice_ack),`);
    }
    updateQuery = sql:queryConcat(updateQuery, `
            par_rating_updated_by = ${rating.parRatingUpdatedBy}
        WHERE
            par_rating_id = ${rating.parRatingId}
        `
    );
    return updateQuery;
}

isolated function getAesEncryptionValueQuery(string value) returns sql:ParameterizedQuery => `
    AES_ENCRYPT(${value}, ${encryptionKey})
`;

isolated function getAesDecryptionFieldQuery(sql:ParameterizedQuery fieldName) returns sql:ParameterizedQuery =>
    sql:queryConcat(`AES_DECRYPT(`, fieldName, `, ${encryptionKey})`);

isolated function getBlobFieldQuery(sql:ParameterizedQuery fieldName) returns sql:ParameterizedQuery =>
    fieldName;

isolated function insertParSpecialRatingGroupsQuery(ParSpecialRatingGroup[] parSpecialRatingGroups)
    returns sql:ParameterizedQuery[] => from ParSpecialRatingGroup parSpecialRatingGroup in parSpecialRatingGroups
    let ParSpecialRatingGroup {parCycleId, parBusinessUnit, parDepartment, parTeam,
            parSrGroupCreatedBy, parSrGroupUpdatedBy} = parSpecialRatingGroup
    select `
        INSERT INTO hris_par_special_rating_group (
            par_cycle_id,
            par_business_unit,
            par_department,
            par_team,
            par_sr_group_created_by,
            par_sr_group_updated_by
        )
        VALUES (
            ${parCycleId},
            ${parBusinessUnit},
            ${parDepartment},
            ${parTeam},
            ${parSrGroupCreatedBy},
            ${parSrGroupUpdatedBy}
        )
    `;

isolated function getParSpecialRatingGroupsQuery(int parCycleId) returns sql:ParameterizedQuery => `
    SELECT
        par_special_rating_group_id,
        par_cycle_id,
        par_business_unit,
        par_department,
        par_team,
        par_special_quota_id,
        par_sr_group_created_by,
        par_sr_group_created_on,
        par_sr_group_updated_by,
        par_sr_group_updated_on
    FROM
        hris_par_special_rating_group
    WHERE
        par_cycle_id = ${parCycleId}
`;

isolated function insertParTeamsQuery(ParTeam[] parTeams)
    returns sql:ParameterizedQuery[] => from ParTeam team in parTeams
    let ParTeam {parCycleId, parBusinessUnit, parDepartment, parTeam, parSubTeam, parLeadEmail,
        parSpecialRatingGroupId, parTeamCreatedBy, parTeamUpdatedBy} = team
    select `
        INSERT INTO hris_par_team (
            par_cycle_id,
            par_business_unit,
            par_department,
            par_team,
            par_sub_team,
            par_lead_email,
            par_special_rating_group_id,
            par_team_created_by,
            par_team_updated_by
        )
        VALUES (
            ${parCycleId},
            ${parBusinessUnit},
            ${parDepartment},
            ${parTeam},
            ${parSubTeam},
            ${parLeadEmail},
            ${parSpecialRatingGroupId},
            ${parTeamCreatedBy},
            ${parTeamUpdatedBy}
        )
    `;

isolated function getParTeamsQuery(int parCycleId) returns sql:ParameterizedQuery => `
    SELECT
        par_team_id,
        par_cycle_id,
        par_business_unit,
        par_department,
        par_team,
        par_sub_team,
        par_lead_email,
        par_special_rating_group_id,
        par_team_created_by,
        par_team_created_on,
        par_team_updated_by,
        par_team_updated_on
    FROM
        hris_par_team
    WHERE
        par_cycle_id = ${parCycleId}
`;

isolated function getParTeamQuery(int parTeamId) returns sql:ParameterizedQuery => `
    SELECT
        par_team_id,
        par_cycle_id,
        par_business_unit,
        par_department,
        par_team,
        par_sub_team,
        par_lead_email,
        par_special_rating_group_id,
        par_team_created_by,
        par_team_created_on,
        par_team_updated_by,
        par_team_updated_on
    FROM
        hris_par_team
    WHERE
        par_team_id = ${parTeamId}
`;

isolated function getParTeamsOfLeadQuery(int parCycleId, string leadEmail) returns sql:ParameterizedQuery => `
    SELECT
        t.par_team_id,
        t.par_cycle_id,
        t.par_business_unit,
        t.par_department,
        t.par_team,
        t.par_sub_team,
        t.par_lead_email,
        t.par_special_rating_group_id,
        t.par_team_created_by,
        t.par_team_created_on,
        t.par_team_updated_by,
        t.par_team_updated_on
    FROM
        hris_par_team t
    INNER JOIN hris_par_rating r
        ON t.par_team_id = r.par_team_id
    WHERE
        t.par_cycle_id = ${parCycleId}
        AND t.par_lead_email = ${leadEmail}
    GROUP BY
        t.par_team_id;
`;

isolated function getParTeamSummaryQuery(int parCycleId, string? leadEmail, int? parTeamId) returns sql:ParameterizedQuery => `
    SELECT
        hris_par_rating.par_team_id AS par_team_id,
        hris_par_rating.par_cycle_id AS par_cycle_id,
        par_business_unit,
        par_department,
        par_team,
        par_sub_team,
        par_lead_email,
        par_special_rating_group_id,
        COUNT(par_employee_email) AS par_team_count,
        COUNT(CASE WHEN par_employee_status IN ('SHARED', 'SHARED_BLOCKED', 'COMPLETED') THEN 1 ELSE NULL END)
            AS par_employee_completed_count,
        COUNT(CASE WHEN par_lead_status = 'SHARED' THEN 1 ELSE NULL END) AS par_lead_completed_count,
        COUNT(CASE WHEN par_f2f_status = 'COMPLETED' THEN 1 ELSE NULL END) AS par_f2f_completed_count
    FROM
        hris_par_rating
    JOIN hris_par_team
        ON hris_par_rating.par_team_id = hris_par_team.par_team_id
    WHERE
        hris_par_rating.par_cycle_id=${parCycleId} AND
        (${leadEmail} IS NULL OR par_lead_email = ${leadEmail}) AND
        (${parTeamId} IS NULL OR hris_par_rating.par_team_id = ${parTeamId})
    GROUP BY
        par_team_id,
        par_cycle_id,
        par_business_unit,
        par_department,
        par_team,
        par_sub_team,
        par_lead_email
`;

isolated function getParSpecialRatingGroupsWithHeadCountQuery(int parCycleId) returns sql:ParameterizedQuery => `
    SELECT
        hris_par_special_rating_group.par_special_rating_group_id AS par_special_rating_group_id,
        hris_par_rating.par_cycle_id AS par_cycle_id,
        hris_par_special_rating_group.par_business_unit AS par_business_unit,
        hris_par_special_rating_group.par_department AS par_department,
        hris_par_special_rating_group.par_team AS par_team,
        COUNT(par_employee_email) AS group_head_count
    FROM
        hris_par_rating
    JOIN hris_par_team
        ON hris_par_rating.par_team_id = hris_par_team.par_team_id
	JOIN hris_par_special_rating_group
		ON hris_par_rating.par_cycle_id = hris_par_special_rating_group.par_cycle_id
    WHERE
        hris_par_rating.par_cycle_id=${parCycleId} AND
        hris_par_team.par_business_unit = hris_par_special_rating_group.par_business_unit AND
		hris_par_team.par_department = hris_par_special_rating_group.par_department AND
        hris_par_team.par_team = hris_par_special_rating_group.par_team AND
        hris_par_rating.par_special_rating_eligibility is TRUE
    GROUP BY
        par_special_rating_group_id,
        par_cycle_id,
        hris_par_special_rating_group.par_business_unit,
        hris_par_special_rating_group.par_department,
        hris_par_special_rating_group.par_team
`;

isolated function getParRatingsOfTeamQuery(int parCycleId, int parTeamId) returns sql:ParameterizedQuery =>
    sql:queryConcat(`
        SELECT
            par_rating_id,
            par_employee_email,
            par_employee_name,
            par_cycle_id,
            par_company,
            par_location,
            par_team_id,`,
        getAesDecryptionFieldQuery(`par_rating`), ` AS par_rating,`,
        getAesDecryptionFieldQuery(`par_special_rating`), ` AS par_special_rating,`,
        getAesDecryptionFieldQuery(`par_employee_comment`), ` AS par_employee_comment,`, `
            par_employee_status,`,
        getAesDecryptionFieldQuery(`par_lead_comment`), ` AS par_lead_comment,`, `
            par_lead_status,
            par_f2f_status,
            par_f2f_date,
            par_employee_acceptance_status,`,
        getAesDecryptionFieldQuery(`par_employee_acceptance_comment`), ` AS par_employee_acceptance_comment,`,
        getAesDecryptionFieldQuery(`par_admin_comment`), ` AS par_admin_comment,`, `
            par_rating_created_by,
            par_rating_updated_by
        FROM
            hris_par_rating
        WHERE
            par_cycle_id = ${parCycleId} AND
            par_team_id = ${parTeamId}
    `);

isolated function getParCycleEmployeeEmailsQuery(int parCycleId) returns sql:ParameterizedQuery => `
    SELECT
        par_employee_email AS email
    FROM
        hris_par_rating
    WHERE
        par_cycle_id = ${parCycleId}
`;

isolated function getPar360ReviewsQuery(int parCycleId, string employeeEmail) returns sql:ParameterizedQuery =>
    sql:queryConcat(`
        SELECT
            par_employee_email,
            par_reviewer_email,
            par_cycle_id,`,
        getAesDecryptionFieldQuery(`par_360_rating`), ` AS par_360_rating,`,
        getAesDecryptionFieldQuery(`par_360_comment`), ` AS par_360_comment,`, `
            par_360_status,
            par_360_employee_requested,
            par_360_lead_requested,
            par_360_created_by,
            par_360_created_on,
            par_360_updated_by,
            par_360_updated_on
        FROM
            hris_par_360_review
        WHERE
            par_cycle_id=${parCycleId} AND
            par_employee_email=${employeeEmail}
    `);

isolated function getPar360ReviewQuery(int parCycleId, string employeeEmail, string reviewerEmail)
        returns sql:ParameterizedQuery =>
    sql:queryConcat(`
        SELECT
            par_employee_email,
            par_reviewer_email,
            par_cycle_id,`,
        getAesDecryptionFieldQuery(`par_360_rating`), ` AS par_360_rating,`,
        getAesDecryptionFieldQuery(`par_360_comment`), ` AS par_360_comment,`, `
            par_360_status,
            par_360_employee_requested,
            par_360_lead_requested,
            par_360_created_by,
            par_360_created_on,
            par_360_updated_by,
            par_360_updated_on
        FROM
            hris_par_360_review
        WHERE
            par_cycle_id=${parCycleId} AND
            par_employee_email=${employeeEmail} AND
            par_reviewer_email=${reviewerEmail}
    `);

isolated function createOrUpdate360RequestQuery(Par360Review par360Review) returns sql:ParameterizedQuery =>
    let Par360Review {parEmployeeEmail, parReviewerEmail, parCycleId, par360Rating, par360Status, isEmployeeRequested,
        isLeadRequested, par360CreatedBy, par360UpdatedBy} = par360Review
    in sql:queryConcat(`
        INSERT INTO
            hris_par_360_review
            (
                par_employee_email,
                par_reviewer_email,
                par_cycle_id,
                par_360_rating,
                par_360_status,
                par_360_employee_requested,
                par_360_lead_requested,
                par_360_created_by,
                par_360_updated_by
            )
        VALUES
            (
                ${parEmployeeEmail},
                ${parReviewerEmail},
                ${parCycleId},`, getAesEncryptionValueQuery(par360Rating), `,`, `
                ${par360Status},
                ${isEmployeeRequested},
                ${isLeadRequested},
                ${par360CreatedBy},
                ${par360UpdatedBy}
            )
        ON DUPLICATE KEY UPDATE
            par_360_employee_requested =
                CASE WHEN par_360_employee_requested = false
                    THEN VALUES(par_360_employee_requested) ELSE par_360_employee_requested END,
            par_360_lead_requested =
                CASE WHEN par_360_lead_requested = false
                    THEN VALUES(par_360_lead_requested) ELSE par_360_lead_requested END,
            par_360_updated_by = ${par360UpdatedBy}
    `);

isolated function update360ReviewQuery(Par360Review par360Review) returns sql:ParameterizedQuery {
    Par360Review {parEmployeeEmail, parReviewerEmail, parCycleId, par360Status, par360Rating, par360Comment,
        par360UpdatedBy} = par360Review;
    sql:ParameterizedQuery updateQuery = `
        UPDATE
            hris_par_360_review
        SET
            par_360_status = ${par360Status},
    `;
    updateQuery = sql:queryConcat(updateQuery, `par_360_rating = `,
            getAesEncryptionValueQuery(par360Rating), `,`);
    if par360Comment != () {
        updateQuery = sql:queryConcat(updateQuery, `par_360_comment = `,
                getAesEncryptionValueQuery(par360Comment), `,`);
    }
    updateQuery = sql:queryConcat(updateQuery, `
            par_360_updated_by = ${par360UpdatedBy}
        WHERE
            par_employee_email = ${parEmployeeEmail} AND
            par_reviewer_email = ${parReviewerEmail} AND
            par_cycle_id = ${parCycleId}
        `
    );
    return updateQuery;
}

isolated function getPar360ReviewRequestsQuery(int parCycleId, string reviewerEmail) returns sql:ParameterizedQuery =>
    sql:queryConcat(`
        SELECT
            par_employee_email,
            par_reviewer_email,
            par_cycle_id,`,
        getAesDecryptionFieldQuery(`par_360_rating`), ` AS par_360_rating,`,
        getAesDecryptionFieldQuery(`par_360_comment`), ` AS par_360_comment,`, `
            par_360_status,
            par_360_employee_requested,
            par_360_lead_requested,
            par_360_created_by,
            par_360_created_on,
            par_360_updated_by,
            par_360_updated_on
        FROM
            hris_par_360_review
        WHERE
            par_cycle_id=${parCycleId} AND
            par_reviewer_email=${reviewerEmail}
    `);

isolated function getParSpecialRatingQuotaQuery(int parCycleId, int parSpecialRatingGroupId)
        returns sql:ParameterizedQuery => `
    SELECT
        par_quota_id,
        hris_par_special_rating_group.par_cycle_id as par_cycle_id,
        par_special_quota_name,
        par_top5_quota,
        par_top20_quota
    FROM
        hris_par_special_rating_quota
    JOIN hris_par_special_rating_group
        ON hris_par_special_rating_group.par_special_quota_id = hris_par_special_rating_quota.par_quota_id
    WHERE
        hris_par_special_rating_group.par_cycle_id=${parCycleId} AND
        hris_par_special_rating_group.par_special_rating_group_id = ${parSpecialRatingGroupId}
`;

isolated function getParCurrentSpecialRatingsQuery(int parCycleId, int parTeamId, int parSpecialRatingGroupId)
        returns sql:ParameterizedQuery =>
    sql:queryConcat(`
        SELECT
            hris_par_rating.par_cycle_id AS par_cycle_id,
            hris_par_special_rating_group.par_special_quota_id,
            COUNT(CASE WHEN `,
        getAesDecryptionFieldQuery(`par_special_rating`), `='TOP5P' THEN 1 ELSE NULL END) AS top_5_count,
            COUNT(CASE WHEN `,
        getAesDecryptionFieldQuery(`par_special_rating`), `='TOP20P' THEN 1 ELSE NULL END) AS top_20_count
        FROM
            hris_par_rating
        JOIN hris_par_team
            ON hris_par_rating.par_team_id = hris_par_team.par_team_id
        JOIN hris_par_special_rating_group
            ON hris_par_team.par_special_rating_group_id = hris_par_special_rating_group.par_special_rating_group_id
        JOIN hris_par_special_rating_group AS hris_par_special_rating_group_sub
            ON hris_par_special_rating_group.par_special_quota_id = hris_par_special_rating_group_sub.par_special_quota_id
        WHERE
            hris_par_rating.par_cycle_id = ${parCycleId} AND
            hris_par_special_rating_group_sub.par_special_rating_group_id = ${parSpecialRatingGroupId}
        GROUP BY
            hris_par_rating.par_cycle_id,
            hris_par_special_rating_group.par_special_quota_id
    `);

isolated function getParConfigurationQuery(string configKey) returns sql:ParameterizedQuery => `
    SELECT
        par_config_key,
        par_config_value
    FROM
        hris_par_configs
    WHERE
        par_config_key = ${configKey}
`;

isolated function createOrUpdateParConfigurationQuery(ParConfiguration parConfiguration)
        returns sql:ParameterizedQuery =>
    let ParConfiguration {parConfigKey, parConfigValue, parConfigCreatedBy, parConfigUpdatedBy} = parConfiguration
    in `
        INSERT INTO
            hris_par_configs
            (
                par_config_key,
                par_config_value,
                par_config_created_by,
                par_config_updated_by
            )
        VALUES
            (
                ${parConfigKey},
                ${parConfigValue},
                ${parConfigCreatedBy},
                ${parConfigUpdatedBy}
            )
        ON DUPLICATE KEY UPDATE
            par_config_value = ${parConfigValue},
            par_config_updated_by = ${parConfigUpdatedBy}
    `;

isolated function insertEmailNotificationQuery(EmailNotification[] emailNotifications)
        returns sql:ParameterizedQuery[] => from EmailNotification emailNotification in emailNotifications
    let EmailNotification {parCycleId, recipientEmail, recipientName, emailType, emailTriggerDetails,
        emailStatus, emailTemplateData} = emailNotification
    select `
        INSERT IGNORE INTO hris_par_email (
            par_cycle_id,
            par_email_recipient_email,
            par_email_recipient_name,
            par_email_type,
            par_email_trigger_details,
            par_email_status,
            par_email_template_data
        )
        VALUES (
            ${parCycleId},
            ${recipientEmail},
            ${recipientName},
            ${emailType},
            ${emailTriggerDetails},
            ${emailStatus},
            ${emailTemplateData}
        )
    `;

isolated function getEmailNotificationsQuery(types:EmailStatus emailStatus, int count) returns sql:ParameterizedQuery =>
    sql:queryConcat(`
        SELECT
            par_email_id,
            par_cycle_id,
            par_email_recipient_email,
            par_email_recipient_name,
            par_email_type,
            par_email_status,`,
        getBlobFieldQuery(`par_email_template_data`), ` AS par_email_template_data`, `
        FROM
            hris_par_email
        WHERE
            par_email_status = ${emailStatus}
        LIMIT ${count}
        FOR UPDATE
    `);

isolated function updateEmailNotificationsStateQuery(int[] ids, types:EmailStatus emailStatus)
        returns sql:ParameterizedQuery =>
    sql:queryConcat(`
        UPDATE
            hris_par_email
        SET
            par_email_status = ${emailStatus}
        WHERE par_email_id in (`, sql:arrayFlattenQuery(ids), `)
    `);

# SQL query to get direct and indirect reports for a given ParCycle and lead email.
#
# + parCycleId - The ParCycle ID
# + employeeEmails - Emails
# + return - A list of report objects or an sql error if the operation failed
isolated function getDirectAndIndirectEmployeesOfLeadQuery(int parCycleId, string[] employeeEmails)
        returns sql:ParameterizedQuery {
    return sql:queryConcat(
    `SELECT
        par.par_rating_id,
        par.par_employee_email,
        par.par_employee_name,
        par.par_cycle_id,
        par.par_company,
        par.par_location,
        par.par_team_id,`,
        getAesDecryptionFieldQuery(`par_rating`), ` AS par_rating,`,
        getAesDecryptionFieldQuery(`par_special_rating`), ` AS par_special_rating,`,
        getAesDecryptionFieldQuery(`par_employee_comment`), ` AS par_employee_comment,`,
        `par_employee_status,`,
        getAesDecryptionFieldQuery(`par_lead_comment`), ` AS par_lead_comment,`,
        `par.par_lead_status,
         par.par_f2f_status,
         par.par_f2f_date,
         par.par_employee_acceptance_status,`,
        getAesDecryptionFieldQuery(`par_employee_acceptance_comment`), ` AS par_employee_acceptance_comment,`,
        getAesDecryptionFieldQuery(`par_admin_comment`), ` AS par_admin_comment,`,
        `par.par_rating_created_by,
         par.par_rating_updated_by,
         'Indirect' AS reportType,
         '' AS employee_lead
        FROM
            hris_par_rating par
        WHERE
            par.par_cycle_id = `,
        `${parCycleId}`,
        ` AND par.par_employee_email IN (`,
        sql:arrayFlattenQuery(employeeEmails),
        `)`
    );
}

# SQL query to get the indirect leads of a employee.
#
# + leadEmail - The email of the lead
# + employeeEmail - The email of the employee
# + return - A list of report objects or an sql error if the operation failed
isolated function getIndirectLeadOfEmployeeQuery(string employeeEmail, string leadEmail)
    returns sql:ParameterizedQuery => `
    SELECT
	CASE
		WHEN employee_additional_lead like CONCAT('%', ${leadEmail}, '%')
			THEN 'TRUE'
			ELSE 'FALSE'
	END AS is_additional_lead
    FROM
        hris.hris_employee
    WHERE
        employee_work_email = ${employeeEmail};
`;

# SQL query to get the indirect lead.
#
# + leadEmail - The email of the lead
# + return - A list of report objects or an sql error if the operation failed
isolated function getIndirectLeadQuery(string leadEmail)
    returns sql:ParameterizedQuery => `

    SELECT EXISTS (
        SELECT 1
        FROM hris.hris_employee
        WHERE employee_status != 'Left'
        AND employee_additional_lead LIKE CONCAT('%', ${leadEmail}, '%')
    ) AS is_additional_lead;
`;

# SQL query to get two levels of PAR ratings for a given ParCycle and lead email.
#
# + parCycleId - The ParCycle ID
# + leadEmail - The email of the lead
# + return - A list of PAR rating objects or an sql error if the operation failed
isolated function getDirectParRatingsOfEmployeesQuery(int parCycleId, string leadEmail)
    returns sql:ParameterizedQuery =>
    sql:queryConcat(`
    WITH DirectReports AS (
        SELECT
            pr.par_rating_id,
            pr.par_cycle_id,
            pr.par_employee_email,
            pr.par_employee_name,`,
        getAesDecryptionFieldQuery(`pr.par_rating`), ` AS par_rating,`,
        getAesDecryptionFieldQuery(`pr.par_special_rating`), ` AS par_special_rating,`,
        `   pt.par_business_unit,
            pt.par_department,
            pt.par_team_id,
            pt.par_team,
            pt.par_sub_team,
            pt.par_lead_email,`,
        getAesDecryptionFieldQuery(`pr.par_employee_comment`), ` AS par_employee_comment,`,
        `pr.par_employee_status,`,
        getAesDecryptionFieldQuery(`pr.par_lead_comment`), ` AS par_lead_comment,`,
        `pr.par_lead_status,
            pr.par_f2f_status,
            pr.par_f2f_date,
            pr.par_employee_acceptance_status,
            CASE WHEN EXISTS (
                SELECT 1
                FROM hris_par_team ht
                WHERE ht.par_lead_email = pr.par_employee_email
                AND ht.par_cycle_id = ${parCycleId}
            ) THEN 'True' ELSE 'False' END AS is_employee_lead
        FROM hris_par_rating pr
        JOIN hris_par_team pt
            ON pr.par_team_id = pt.par_team_id
            AND pr.par_cycle_id = pt.par_cycle_id
        WHERE pt.par_lead_email = ${leadEmail}
        AND pr.par_cycle_id = ${parCycleId}
    ),
    SecondLevel AS (
        SELECT
            pr.par_rating_id,
            pr.par_cycle_id,
            pr.par_employee_email,
            pr.par_employee_name,`,
        getAesDecryptionFieldQuery(`pr.par_rating`), ` AS par_rating,`,
        getAesDecryptionFieldQuery(`pr.par_special_rating`), ` AS par_special_rating,`,
        `   pt.par_business_unit,
            pt.par_department,
            pt.par_team_id,
            pt.par_team,
            pt.par_sub_team,
            pt.par_lead_email,`,
        getAesDecryptionFieldQuery(`pr.par_employee_comment`), ` AS par_employee_comment,`,
        `pr.par_employee_status,`,
        getAesDecryptionFieldQuery(`pr.par_lead_comment`), ` AS par_lead_comment,`,
        `pr.par_lead_status,
            pr.par_f2f_status,
            pr.par_f2f_date,
            pr.par_employee_acceptance_status,
            CASE WHEN EXISTS (
                SELECT 1
                FROM hris_par_team ht
                WHERE ht.par_lead_email = pr.par_employee_email
                AND ht.par_cycle_id = ${parCycleId}
            ) THEN 'True' ELSE 'False' END AS is_employee_lead
        FROM hris_par_rating pr
        JOIN hris_par_team pt
            ON pr.par_team_id = pt.par_team_id
            AND pr.par_cycle_id = pt.par_cycle_id
        WHERE pt.par_lead_email IN (
            SELECT par_employee_email
            FROM DirectReports
            WHERE is_employee_lead = 'True'
        )
        AND pr.par_cycle_id = ${parCycleId}
    )
    SELECT * FROM DirectReports
    UNION ALL
    SELECT * FROM SecondLevel;
`);

# SQL query to get the participants of a par cycle.
#
# + parCycleId - The ID of the par cycle
# + leadEmail - The email of the lead
# + return - A list of participants or sql error if the operation failed
isolated function getParticipantsOfTheParCycleQuery(int parCycleId, string? leadEmail) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery mainQuery = `
        SELECT
            r.par_employee_email,
            r.par_employee_name
        FROM
            hris_par_rating r
        JOIN
            hris_par_team t ON r.par_team_id = t.par_team_id
        WHERE
    `;
    if leadEmail is string {
        mainQuery = sql:queryConcat(mainQuery, ` t.par_lead_email = ${leadEmail} AND `);
    }
    return sql:queryConcat(mainQuery, ` r.par_cycle_id = ${parCycleId};`);
}

# SQL query to get the rejected reviews of a par cycle.
#
# + parCycleId - The ID of the par cycle
# + return - A list of rejected reviews or sql error if the operation failed
isolated function getRejectedReviewsQuery(int parCycleId) returns sql:ParameterizedQuery => `
    SELECT
        par_employee_email,
        par_reviewer_email,
        CASE
            WHEN
                par_360_employee_requested = 0
                    AND par_360_lead_requested = 0
            THEN
                'TRUE'
            ELSE 'FALSE'
        END AS is_offered_feedback
    FROM
        hris.hris_par_360_review
    WHERE
        par_360_status = ${REJECTED}
        AND par_cycle_id = ${parCycleId};
`;

# Get the team details of a given employee for a given par cycle ID.
#
# + employeeEmail - THe email of the employee
# + parCycleId - The ID of the par cycle
# + return - Details of the par team or sql error if the operation failed
isolated function getParTeamOfEmployeeQuery(string employeeEmail, int parCycleId) returns sql:ParameterizedQuery => `
    SELECT
        pt.par_team_id,
        pt.par_business_unit,
        pt.par_department,
        pt.par_team,
        pt.par_lead_email,
        pt.par_cycle_id
    FROM
        hris_par_team pt
    WHERE
        pt.par_team_id = (
            SELECT
                pr.par_team_id
            FROM
                hris_par_rating pr
            WHERE
                pr.par_employee_email = ${employeeEmail}
                AND pr.par_cycle_id = ${parCycleId});
`;

# SQL query to get the basic team details of a lead.
#
# + parCycleId - The ID of the par cycle
# + leadEmail - The email of the lead
# + parDepartment - The department of the employee
# + parBusinessUnit - The business unit of the employee
# + parTeam - The team of the employee
# + return - The basic team info or sql error if the operation failed
isolated function getParTeamDetailsOfLeadQuery(string leadEmail, int parCycleId, string parDepartment,
        string parBusinessUnit, string parTeam) returns sql:ParameterizedQuery => `
    SELECT
        par_team_id,
        par_business_unit,
        par_department,
        par_team,
        par_lead_email,
        par_cycle_id
    FROM
        hris_par_team
    WHERE
        par_lead_email = ${leadEmail}
        AND par_department = ${parDepartment}
        AND par_business_unit = ${parBusinessUnit}
        AND par_team = ${parTeam}
        AND par_cycle_id = ${parCycleId};
`;

# SQL query to update the par team ID of the parRating table.
#
# + parCycleId - The ID of the par cycle
# + employeeEmail - The email of the employee
# + newTeamId - The new ID of the team
# + return - The execution result
isolated function updateParTeamIdOfEmployeeQuery(int newTeamId, string employeeEmail, int parCycleId)
    returns sql:ParameterizedQuery => `
    UPDATE hris_par_rating
    SET
        par_team_id = ${newTeamId}
    WHERE
        par_cycle_id = ${parCycleId}
        AND par_employee_email = ${employeeEmail};
`;

# SQL query to get par summaries of a given employee.
#
# + employeeEmail - The email of the employee
# + return - The execution result
isolated function getParSummariesOfEmployeeQuery(string employeeEmail) returns sql:ParameterizedQuery => `
    SELECT
        r.par_rating_shared_by,
        c.par_cycle_id,
        c.par_cycle_name,
        c.par_cycle_start_date,
        c.par_cycle_end_date,
        r.par_rating_updated_on,
        r.par_employee_status,
        r.par_lead_status,
        t.par_lead_email,
        c.par_cycle_status
    FROM
        hris_par_rating r
    JOIN
        hris_par_cycle c ON r.par_cycle_id = c.par_cycle_id
    JOIN
        hris_par_team t ON r.par_team_id = t.par_team_id
    WHERE
        r.par_employee_email = ${employeeEmail};
`;

# SQL query to get special rating allocation for the active cycle.
#
# + leadEmail - The email of the invoker
# + parCycleId - The ID of the par cycle
# + return - The execution result
isolated function getSpecialRatingAllocationsQuery(int parCycleId, string? leadEmail) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery mainQuery = `
    SELECT
        g.par_business_unit,
        g.par_department,
        g.par_team,
        q.par_quota_id,
        q.par_special_quota_name,
        q.par_top5_quota,
        q.par_top20_quota
    FROM
        hris_par_special_rating_group g
    JOIN hris_par_cycle c
        ON g.par_cycle_id = c.par_cycle_id
    LEFT JOIN hris_par_special_rating_quota q
        ON g.par_special_quota_id = q.par_quota_id
    WHERE
        c.par_cycle_id = ${parCycleId}
    `;
    if leadEmail is string {
        string leadPattern = "%\"" + leadEmail + "\"%";
        mainQuery = sql:queryConcat(mainQuery, ` AND q.par_allowed_leads LIKE ${leadPattern} `);
    }
    return sql:queryConcat(mainQuery, `  AND EXISTS (
            SELECT 1
            FROM hris_par_rating r
            JOIN hris_par_team t ON r.par_team_id = t.par_team_id
            WHERE
                r.par_special_rating_eligibility = TRUE
                AND r.par_cycle_id = g.par_cycle_id
                AND t.par_business_unit = g.par_business_unit
                AND t.par_department = g.par_department
                AND t.par_team = g.par_team
        );
    `);
};

# SQL query to get headcount of a team.
#
# + teamId - The id of the team
# + return - The execution result
isolated function getHeadCountOfTeamQuery(int teamId) returns sql:ParameterizedQuery => `
    SELECT
        COUNT(par_employee_email) AS par_team_count
    FROM
        hris_par_rating
            JOIN
        hris_par_team ON hris_par_rating.par_team_id = hris_par_team.par_team_id
    WHERE
        hris_par_rating.par_team_id = ${teamId}
`;

# SQL query to delete a PAR team.
#
# + teamId - The id of the team
# + return - The execution result
isolated function deleteParTeamQuery(int teamId) returns sql:ParameterizedQuery => `
    DELETE FROM hris_par_team WHERE par_team_id = ${teamId};
`;
