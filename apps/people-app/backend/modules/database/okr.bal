// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
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

// OKRs: objectives owned by an employee, each with key results given to them or someone in their
// team, each with its own due date, the actions towards each key result and comments on each action.

import ballerina/sql;

# Where an objective stands: still being worked on, achieved, or no longer pursued.
public enum OkrStatus {
    OKR_OPEN = "OPEN",
    OKR_COMPLETED = "COMPLETED",
    OKR_CLOSED = "CLOSED"
}

# Where a key result stands.
public enum KeyResultStatus {
    KR_NOT_STARTED = "NOT_STARTED",
    KR_AT_RISK = "AT_RISK",
    KR_IN_PROGRESS = "IN_PROGRESS",
    KR_ON_TRACK = "ON_TRACK",
    KR_COMPLETED = "COMPLETED"
}

# An objective as stored, with its owner's name and manager from their current employment.
public type OkrRow record {|
    # OKR ID
    int okrId;
    # Owner's work email
    string ownerEmail;
    # Owner's name
    string? ownerName;
    # Owner's manager's work email
    string? ownerLeadEmail;
    # The objective
    string objective;
    # OPEN, COMPLETED or CLOSED
    string status;
    # Why it was closed
    string? closeReason;
    # Who last completed, closed or reopened it
    string? statusChangedBy;
    # When, in seconds since the epoch
    int? statusChangedOn;
    # Goes up with every change to it or its key results' details
    int version;
    # Who set it
    string createdBy;
    # When, in seconds since the epoch
    int createdOn;
    # Who last changed it
    string updatedBy;
    # When, in seconds since the epoch
    int updatedOn;
|};

# A key result as stored, with its owner's name from their current employment.
public type KeyResultRow record {|
    # Key result ID
    int keyResultId;
    # The objective's OKR ID
    int okrId;
    # Owner's work email
    string ownerEmail;
    # Owner's name
    string? ownerName;
    # The key result
    string title;
    # Where it starts
    string? baseline;
    # Where it should get to
    string? target;
    # Due date (YYYY-MM-DD)
    string dueDate;
    # One of the key result statuses
    string status;
    # Its place among the objective's key results, from 0
    int position;
|};

# One status a key result has had.
public type KeyResultStatusRow record {|
    # Key result ID
    int keyResultId;
    # The status
    string status;
    # Who set it
    string changedBy;
    # When, in seconds since the epoch
    int changedOn;
|};

# An action towards a key result.
public type OkrActionRow record {|
    # Action ID
    int actionId;
    # Key result ID
    int keyResultId;
    # The action
    string title;
    # 1 when it's done
    int isDone;
    # Who ticked it off
    string? doneBy;
    # When, in seconds since the epoch
    int? doneOn;
    # How many comments it has
    int commentCount;
    # Who added it
    string createdBy;
    # When, in seconds since the epoch
    int createdOn;
|};

# A comment on an action.
public type OkrCommentRow record {|
    # Comment ID
    int commentId;
    # Action ID
    int actionId;
    # The comment
    string comment;
    # Who wrote it
    string createdBy;
    # Their name, from their current employment
    string? authorName;
    # When, in seconds since the epoch
    int createdOn;
|};

# Someone a key result can be given to.
public type OkrPersonRow record {|
    # Work email
    string workEmail;
    # Name
    string? name;
    # Job role
    string? jobRole;
    # Photo URL
    string? thumbnail;
|};

# A key result as entered: a new one, or an existing one when it has an ID.
public type KeyResultInput record {|
    # Key result ID, for one that already exists
    int? keyResultId = ();
    # Owner's work email
    string ownerEmail;
    # The key result
    string title;
    # Where it starts
    string? baseline;
    # Where it should get to
    string? target;
    # Due date (YYYY-MM-DD)
    string dueDate;
|};

# A new objective with its key results.
public type AddOkrPayload record {|
    # Owner's work email
    string ownerEmail;
    # The objective
    string objective;
    # Key results, in order
    KeyResultInput[] keyResults;
    # Who is setting it
    string createdBy;
|};

# An objective's new details and its key results, all of them: ones left out are removed.
public type UpdateOkrPayload record {|
    # OKR ID
    int okrId;
    # The version the change was made from
    int version;
    # The objective
    string objective;
    # Key results, in order
    KeyResultInput[] keyResults;
    # Who is changing it
    string updatedBy;
|};

# The ID of the employment a work email currently belongs to: the latest one that isn't Left, or the
# latest one when all are. A rehire keeps their work email, so one email can have several rows.
#
# + emailColumn - SQL expression holding the work email
# + return - Scalar subquery
isolated function currentEmploymentIdOf(sql:ParameterizedQuery emailColumn) returns sql:ParameterizedQuery =>
    sql:queryConcat(`(
        SELECT c.id
        FROM employee c
        WHERE LOWER(c.work_email) = LOWER(`, emailColumn, `)
        ORDER BY (c.employee_status <> ${EMPLOYEE_LEFT}) DESC, c.id DESC
        LIMIT 1
    )`);

# Objectives that aren't deleted, each with its owner's current employment as `e`.
#
# + return - SELECT ... WHERE prefix; further conditions start with AND
isolated function okrSelectQuery() returns sql:ParameterizedQuery =>
    sql:queryConcat(`
    SELECT
        o.id AS okrId,
        o.owner_email AS ownerEmail,
        NULLIF(TRIM(CONCAT_WS(' ', e.first_name, e.last_name)), '') AS ownerName,
        NULLIF(e.manager_email, '') AS ownerLeadEmail,
        o.objective AS objective,
        o.status AS status,
        o.close_reason AS closeReason,
        o.status_changed_by AS statusChangedBy,
        CAST(UNIX_TIMESTAMP(o.status_changed_on) AS SIGNED) AS statusChangedOn,
        o.version AS version,
        o.created_by AS createdBy,
        CAST(UNIX_TIMESTAMP(o.created_on) AS SIGNED) AS createdOn,
        o.updated_by AS updatedBy,
        CAST(UNIX_TIMESTAMP(o.updated_on) AS SIGNED) AS updatedOn
    FROM okr o
    LEFT JOIN employee e ON e.id = `, currentEmploymentIdOf(`o.owner_email`), `
    WHERE o.is_active = 1`);

# One person's OKRs: the objectives they own and those with a key result of theirs, oldest first.
#
# + ownerEmail - Their work email
# + return - Parameterized query
isolated function getOkrsOfQuery(string ownerEmail) returns sql:ParameterizedQuery =>
    sql:queryConcat(okrSelectQuery(), `
        AND (
            LOWER(o.owner_email) = LOWER(${ownerEmail})
            OR EXISTS (
                SELECT 1
                FROM okr_key_result k
                WHERE k.okr_id = o.id
                  AND k.is_active = 1
                  AND LOWER(k.owner_email) = LOWER(${ownerEmail})
            )
        )
    ORDER BY o.id`);

# A lead's team's OKRs: objectives owned by someone in their reporting chain who hasn't left, and
# those with a key result of such a person's (the lead's own objectives included). By owner, then oldest
# first.
#
# + leadEmail - Lead's work email
# + return - Parameterized query
isolated function getOkrsInChainOfQuery(string leadEmail) returns sql:ParameterizedQuery =>
    sql:queryConcat(subordinateTreeCte(leadEmail), okrSelectQuery(), `
        AND (
            (e.id IN (SELECT pk_id FROM subordinate_tree) AND e.employee_status <> ${EMPLOYEE_LEFT})
            OR EXISTS (
                SELECT 1
                FROM okr_key_result k
                JOIN employee ke ON ke.id = `, currentEmploymentIdOf(`k.owner_email`), `
                WHERE k.okr_id = o.id
                  AND k.is_active = 1
                  AND ke.id IN (SELECT pk_id FROM subordinate_tree)
                  AND ke.employee_status <> ${EMPLOYEE_LEFT}
            )
        )
    ORDER BY ownerName, o.owner_email, o.id`);

# The work emails of everyone in a lead's reporting chain who hasn't left, lowercased.
#
# + leadEmail - Lead's work email
# + return - Parameterized query
isolated function getTeamEmailsQuery(string leadEmail) returns sql:ParameterizedQuery =>
    sql:queryConcat(subordinateTreeCte(leadEmail), `
    SELECT DISTINCT LOWER(e.work_email) AS workEmail
    FROM employee e
    WHERE e.id IN (SELECT pk_id FROM subordinate_tree)
      AND e.employee_status <> ${EMPLOYEE_LEFT}
      AND e.work_email IS NOT NULL`);

# Everyone's objectives, leavers' left out, by owner then oldest first.
#
# + return - Parameterized query
isolated function getAllOkrsQuery() returns sql:ParameterizedQuery =>
    sql:queryConcat(okrSelectQuery(), `
        AND (e.employee_status IS NULL OR e.employee_status <> ${EMPLOYEE_LEFT})
    ORDER BY ownerName, o.owner_email, o.id`);

# One objective that isn't deleted.
#
# + okrId - OKR ID
# + return - Parameterized query
isolated function getOkrQuery(int okrId) returns sql:ParameterizedQuery =>
    sql:queryConcat(okrSelectQuery(), ` AND o.id = ${okrId}`);

# Key results that aren't removed, each with its owner's current employment as `e`.
#
# + return - SELECT ... WHERE prefix; further conditions start with AND
isolated function keyResultSelectQuery() returns sql:ParameterizedQuery =>
    sql:queryConcat(`
    SELECT
        k.id AS keyResultId,
        k.okr_id AS okrId,
        k.owner_email AS ownerEmail,
        NULLIF(TRIM(CONCAT_WS(' ', e.first_name, e.last_name)), '') AS ownerName,
        k.title AS title,
        k.baseline AS baseline,
        k.target AS target,
        DATE_FORMAT(k.due_date, '%Y-%m-%d') AS dueDate,
        k.status AS status,
        k.position AS position
    FROM okr_key_result k
    JOIN okr o ON o.id = k.okr_id AND o.is_active = 1
    LEFT JOIN employee e ON e.id = `, currentEmploymentIdOf(`k.owner_email`), `
    WHERE k.is_active = 1`);

# The key results of some objectives, in each objective's order.
#
# + okrIds - OKR IDs; at least one
# + return - Parameterized query
isolated function getKeyResultsOfQuery(int[] okrIds) returns sql:ParameterizedQuery =>
    sql:queryConcat(keyResultSelectQuery(), ` AND k.okr_id IN (`, buildIntInClause(okrIds), `)
    ORDER BY k.okr_id, k.position, k.id`);

# One key result of an objective that isn't deleted.
#
# + keyResultId - Key result ID
# + return - Parameterized query
isolated function getKeyResultQuery(int keyResultId) returns sql:ParameterizedQuery =>
    sql:queryConcat(keyResultSelectQuery(), ` AND k.id = ${keyResultId}`);

# Every status some key results have had, oldest first.
#
# + keyResultIds - Key result IDs; at least one
# + return - Parameterized query
isolated function getKeyResultStatusesQuery(int[] keyResultIds) returns sql:ParameterizedQuery =>
    sql:queryConcat(`
    SELECT
        s.key_result_id AS keyResultId,
        s.status AS status,
        s.changed_by AS changedBy,
        CAST(UNIX_TIMESTAMP(s.changed_on) AS SIGNED) AS changedOn
    FROM okr_key_result_status s
    WHERE s.key_result_id IN (`, buildIntInClause(keyResultIds), `)
    ORDER BY s.key_result_id, s.changed_on, s.id`);

# Actions that aren't removed, with how many comments each has.
#
# + return - SELECT ... WHERE prefix; further conditions start with AND
isolated function actionSelectQuery() returns sql:ParameterizedQuery => `
    SELECT
        a.id AS actionId,
        a.key_result_id AS keyResultId,
        a.title AS title,
        CAST(a.is_done AS SIGNED) AS isDone,
        a.done_by AS doneBy,
        CAST(UNIX_TIMESTAMP(a.done_on) AS SIGNED) AS doneOn,
        (SELECT COUNT(*) FROM okr_action_comment cm WHERE cm.action_id = a.id) AS commentCount,
        a.created_by AS createdBy,
        CAST(UNIX_TIMESTAMP(a.created_on) AS SIGNED) AS createdOn
    FROM okr_action a
    WHERE a.is_active = 1`;

# The actions towards some key results, oldest first.
#
# + keyResultIds - Key result IDs; at least one
# + return - Parameterized query
isolated function getActionsOfQuery(int[] keyResultIds) returns sql:ParameterizedQuery =>
    sql:queryConcat(actionSelectQuery(), ` AND a.key_result_id IN (`, buildIntInClause(keyResultIds), `)
    ORDER BY a.key_result_id, a.id`);

# One action that isn't removed.
#
# + actionId - Action ID
# + return - Parameterized query
isolated function getActionQuery(int actionId) returns sql:ParameterizedQuery =>
    sql:queryConcat(actionSelectQuery(), ` AND a.id = ${actionId}`);

# The comments on an action, oldest first, each with its author's name.
#
# + actionId - Action ID
# + return - Parameterized query
isolated function getActionCommentsQuery(int actionId) returns sql:ParameterizedQuery =>
    sql:queryConcat(`
    SELECT
        cm.id AS commentId,
        cm.action_id AS actionId,
        cm.comment AS comment,
        cm.created_by AS createdBy,
        NULLIF(TRIM(CONCAT_WS(' ', e.first_name, e.last_name)), '') AS authorName,
        CAST(UNIX_TIMESTAMP(cm.created_on) AS SIGNED) AS createdOn
    FROM okr_action_comment cm
    LEFT JOIN employee e ON e.id = `, currentEmploymentIdOf(`cm.created_by`), `
    WHERE cm.action_id = ${actionId}
    ORDER BY cm.created_on, cm.id`);

# Whether anyone has worked on an objective: completed, closed or reopened it, changed a key result's
# status, or added an action.
#
# + okrId - OKR ID
# + return - Parameterized query returning 1 when someone has, 0 when not
isolated function isOkrWorkedOnQuery(int okrId) returns sql:ParameterizedQuery => `
    SELECT CAST((
        o.status_changed_on IS NOT NULL
        OR EXISTS (
            SELECT 1
            FROM okr_action a
            JOIN okr_key_result k ON k.id = a.key_result_id
            WHERE k.okr_id = o.id
        )
        OR EXISTS (
            SELECT 1
            FROM okr_key_result_status s
            JOIN okr_key_result k ON k.id = s.key_result_id
            WHERE k.okr_id = o.id
            GROUP BY s.key_result_id
            HAVING COUNT(*) > 1
        )
    ) AS SIGNED) AS workedOn
    FROM okr o
    WHERE o.id = ${okrId}`;

# The owner and the people in their team who haven't left, matching what's typed, by name.
#
# + ownerEmail - The objective owner's work email
# + search - Part of a name or work email; empty for anyone
# + 'limit - At most this many
# + return - Parameterized query
isolated function getOkrTeamQuery(string ownerEmail, string search, int 'limit) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery query = sql:queryConcat(subordinateTreeCte(ownerEmail), `
    SELECT
        e.work_email AS workEmail,
        NULLIF(TRIM(CONCAT_WS(' ', e.first_name, e.last_name)), '') AS name,
        NULLIF(TRIM(e.job_role), '') AS jobRole,
        e.employee_thumbnail AS thumbnail
    FROM employee e
    WHERE e.employee_status <> ${EMPLOYEE_LEFT}
      AND (e.id IN (SELECT pk_id FROM subordinate_tree) OR e.id = `, currentEmploymentIdOf(`${ownerEmail}`), `)`);
    string text = search.trim().toLowerAscii();
    if text != "" {
        string pattern = string `%${text}%`;
        query = sql:queryConcat(query, `
      AND (LOWER(CONCAT_WS(' ', e.first_name, e.last_name)) LIKE ${pattern} OR LOWER(e.work_email) LIKE ${pattern})`);
    }
    return sql:queryConcat(query, `
    ORDER BY name, e.work_email
    LIMIT ${'limit}`);
}

# Add an objective.
#
# + payload - The objective
# + return - Parameterized query
isolated function addOkrQuery(AddOkrPayload payload) returns sql:ParameterizedQuery => `
    INSERT INTO okr (owner_email, objective, status, created_by, updated_by)
    VALUES (${payload.ownerEmail}, ${payload.objective}, ${OKR_OPEN}, ${payload.createdBy}, ${payload.createdBy})`;

# Add a key result, not started.
#
# + okrId - The objective's OKR ID
# + keyResult - The key result
# + position - Its place among the objective's key results
# + createdBy - Who is adding it
# + return - Parameterized query
isolated function addKeyResultQuery(int okrId, KeyResultInput keyResult, int position, string createdBy)
        returns sql:ParameterizedQuery => `
    INSERT INTO okr_key_result
        (okr_id, owner_email, title, baseline, target, due_date, status, position, created_by, updated_by)
    VALUES (${okrId}, ${keyResult.ownerEmail}, ${keyResult.title}, ${keyResult.baseline}, ${keyResult.target},
        ${keyResult.dueDate}, ${KR_NOT_STARTED}, ${position}, ${createdBy}, ${createdBy})`;

# Record a status a key result now has.
#
# + keyResultId - Key result ID
# + status - The status
# + changedBy - Who set it
# + return - Parameterized query
isolated function addKeyResultStatusQuery(int keyResultId, KeyResultStatus status, string changedBy)
        returns sql:ParameterizedQuery => `
    INSERT INTO okr_key_result_status (key_result_id, status, changed_by)
    VALUES (${keyResultId}, ${status}, ${changedBy})`;

# Change an objective's details, only when nobody has changed it since the version given.
#
# + payload - New details
# + return - Parameterized query
isolated function updateOkrDetailsQuery(UpdateOkrPayload payload) returns sql:ParameterizedQuery => `
    UPDATE okr
    SET objective = ${payload.objective},
        version = version + 1,
        updated_by = ${payload.updatedBy}
    WHERE id = ${payload.okrId} AND version = ${payload.version} AND is_active = 1`;

# Change one of an objective's key results. Its status is changed on its own.
#
# + okrId - The objective's OKR ID
# + keyResultId - Key result ID
# + keyResult - New details
# + position - Its place among the objective's key results
# + updatedBy - Who is changing it
# + return - Parameterized query
isolated function updateKeyResultQuery(int okrId, int keyResultId, KeyResultInput keyResult, int position,
        string updatedBy) returns sql:ParameterizedQuery => `
    UPDATE okr_key_result
    SET owner_email = ${keyResult.ownerEmail},
        title = ${keyResult.title},
        baseline = ${keyResult.baseline},
        target = ${keyResult.target},
        due_date = ${keyResult.dueDate},
        position = ${position},
        updated_by = ${updatedBy}
    WHERE id = ${keyResultId} AND okr_id = ${okrId} AND is_active = 1`;

# Remove an objective's key results other than the ones kept, keeping the rows.
#
# + okrId - The objective's OKR ID
# + keptIds - Key results to keep
# + removedBy - Who is removing them
# + return - Parameterized query
isolated function removeOtherKeyResultsQuery(int okrId, int[] keptIds, string removedBy)
        returns sql:ParameterizedQuery {
    sql:ParameterizedQuery query = `
    UPDATE okr_key_result
    SET is_active = 0,
        updated_by = ${removedBy}
    WHERE okr_id = ${okrId} AND is_active = 1`;
    return keptIds.length() == 0 ? query : sql:queryConcat(query, ` AND id NOT IN (`, buildIntInClause(keptIds), `)`);
}

# Complete, close or reopen an objective. Only a closed one keeps a reason.
#
# + okrId - OKR ID
# + status - The new status
# + reason - Why it's closed
# + changedBy - Who is changing it
# + return - Parameterized query
isolated function setOkrStatusQuery(int okrId, OkrStatus status, string? reason, string changedBy)
        returns sql:ParameterizedQuery => `
    UPDATE okr
    SET status = ${status},
        close_reason = ${status == OKR_CLOSED ? reason : ()},
        status_changed_by = ${changedBy},
        status_changed_on = CURRENT_TIMESTAMP(6),
        updated_by = ${changedBy}
    WHERE id = ${okrId} AND is_active = 1`;

# Change a key result's status, when it's a different one.
#
# + keyResultId - Key result ID
# + status - The new status
# + changedBy - Who is changing it
# + return - Parameterized query
isolated function setKeyResultStatusQuery(int keyResultId, KeyResultStatus status, string changedBy)
        returns sql:ParameterizedQuery => `
    UPDATE okr_key_result
    SET status = ${status},
        updated_by = ${changedBy}
    WHERE id = ${keyResultId} AND is_active = 1 AND status <> ${status}`;

# Move an objective on a version, only from the version given: a key result's own owner changing its
# measure must not overwrite a change to the objective made meanwhile, nor the other way round.
#
# + okrId - OKR ID
# + version - The version the change was made from
# + updatedBy - Who is changing it
# + return - Parameterized query
isolated function bumpOkrVersionQuery(int okrId, int version, string updatedBy) returns sql:ParameterizedQuery => `
    UPDATE okr
    SET version = version + 1,
        updated_by = ${updatedBy}
    WHERE id = ${okrId} AND version = ${version} AND is_active = 1`;

# Change a key result's baseline and target.
#
# + keyResultId - Key result ID
# + baseline - Where it starts
# + target - Where it should get to
# + updatedBy - Who is changing it
# + return - Parameterized query
isolated function updateKeyResultMeasureQuery(int keyResultId, string? baseline, string? target, string updatedBy)
        returns sql:ParameterizedQuery => `
    UPDATE okr_key_result
    SET baseline = ${baseline},
        target = ${target},
        updated_by = ${updatedBy}
    WHERE id = ${keyResultId} AND is_active = 1`;

# Add an action towards a key result.
#
# + keyResultId - Key result ID
# + title - The action
# + createdBy - Who is adding it
# + return - Parameterized query
isolated function addActionQuery(int keyResultId, string title, string createdBy) returns sql:ParameterizedQuery => `
    INSERT INTO okr_action (key_result_id, title, created_by, updated_by)
    VALUES (${keyResultId}, ${title}, ${createdBy}, ${createdBy})`;

# Rename an action or tick it off. MySQL applies single-table SET assignments left to right, so the
# done columns read is_done before it changes: ticking keeps the first one to tick it, unticking
# clears both.
#
# + actionId - Action ID
# + title - The action
# + done - Whether it's done
# + updatedBy - Who is changing it
# + return - Parameterized query
isolated function updateActionQuery(int actionId, string title, boolean done, string updatedBy)
        returns sql:ParameterizedQuery => `
    UPDATE okr_action
    SET done_by = CASE WHEN ${done} THEN IF(is_done = 1, done_by, ${updatedBy}) ELSE NULL END,
        done_on = CASE WHEN ${done} THEN IF(is_done = 1, done_on, CURRENT_TIMESTAMP(6)) ELSE NULL END,
        is_done = ${done},
        title = ${title},
        updated_by = ${updatedBy}
    WHERE id = ${actionId} AND is_active = 1`;

# Remove an action, keeping the row and its comments.
#
# + actionId - Action ID
# + removedBy - Who is removing it
# + return - Parameterized query
isolated function removeActionQuery(int actionId, string removedBy) returns sql:ParameterizedQuery => `
    UPDATE okr_action
    SET is_active = 0,
        updated_by = ${removedBy}
    WHERE id = ${actionId} AND is_active = 1`;

# Add a comment on an action.
#
# + actionId - Action ID
# + comment - The comment
# + createdBy - Who wrote it
# + return - Parameterized query
isolated function addActionCommentQuery(int actionId, string comment, string createdBy)
        returns sql:ParameterizedQuery => `
    INSERT INTO okr_action_comment (action_id, comment, created_by)
    VALUES (${actionId}, ${comment}, ${createdBy})`;

# Delete an objective nobody has worked on, keeping the row. The same conditions as
# isOkrWorkedOnQuery, so someone starting on it just before can't lose their work.
#
# + okrId - OKR ID
# + deletedBy - Who is deleting it
# + return - Parameterized query
isolated function deleteOkrQuery(int okrId, string deletedBy) returns sql:ParameterizedQuery => `
    UPDATE okr o
    SET o.is_active = 0,
        o.updated_by = ${deletedBy}
    WHERE o.id = ${okrId}
      AND o.is_active = 1
      AND o.status_changed_on IS NULL
      AND NOT EXISTS (
          SELECT 1
          FROM okr_action a
          JOIN okr_key_result k ON k.id = a.key_result_id
          WHERE k.okr_id = o.id
      )
      AND NOT EXISTS (
          SELECT 1
          FROM okr_key_result_status s
          JOIN okr_key_result k ON k.id = s.key_result_id
          WHERE k.okr_id = o.id
          GROUP BY s.key_result_id
          HAVING COUNT(*) > 1
      )`;

# Whether an employee's current employment is in a lead's reporting chain, the same walk My Team and
# record access use.
#
# + leadEmail - Lead's work email
# + employeeEmail - Employee's work email
# + return - Parameterized query returning one row when they are
isolated function isInReportingChainQuery(string leadEmail, string employeeEmail) returns sql:ParameterizedQuery =>
    sql:queryConcat(subordinateTreeCte(leadEmail), `
    SELECT 1
    FROM subordinate_tree
    WHERE pk_id = `, currentEmploymentIdOf(`${employeeEmail}`), `
    LIMIT 1`);

# The status of the employment a work email currently belongs to.
#
# + workEmail - Work email
# + return - Parameterized query returning at most one row
isolated function getCurrentEmployeeStatusQuery(string workEmail) returns sql:ParameterizedQuery =>
    sql:queryConcat(`
    SELECT employee_status
    FROM employee
    WHERE id = `, currentEmploymentIdOf(`${workEmail}`));

# Get one person's OKRs: the objectives they own and those with a key result of theirs.
#
# + ownerEmail - Their work email
# + return - The objectives, oldest first, or an error
public isolated function getOkrsOf(string ownerEmail) returns OkrRow[]|error {
    stream<OkrRow, error?> rows = databaseClient->query(getOkrsOfQuery(ownerEmail));
    return from OkrRow row in rows
        select row;
}

# Get a lead's team's OKRs: objectives owned by someone in their reporting chain, and those with a key
# result of such a person's.
#
# + leadEmail - Lead's work email
# + return - The objectives by owner then oldest first, or an error
public isolated function getOkrsInChainOf(string leadEmail) returns OkrRow[]|error {
    stream<OkrRow, error?> rows = databaseClient->query(getOkrsInChainOfQuery(leadEmail));
    return from OkrRow row in rows
        select row;
}

# Get the work emails of everyone in a lead's reporting chain who hasn't left.
#
# + leadEmail - Lead's work email
# + return - The work emails, lowercased, or an error
public isolated function getTeamEmails(string leadEmail) returns string[]|error {
    stream<record {|string workEmail;|}, error?> rows = databaseClient->query(getTeamEmailsQuery(leadEmail));
    return from record {|string workEmail;|} row in rows
        select row.workEmail;
}

# Get everyone's objectives, leavers' left out.
#
# + return - The objectives by owner then oldest first, or an error
public isolated function getAllOkrs() returns OkrRow[]|error {
    stream<OkrRow, error?> rows = databaseClient->query(getAllOkrsQuery());
    return from OkrRow row in rows
        select row;
}

# Get one objective.
#
# + okrId - OKR ID
# + return - The objective, nil when there is none or it was deleted, or an error
public isolated function getOkr(int okrId) returns OkrRow|error? {
    OkrRow|error row = databaseClient->queryRow(getOkrQuery(okrId));
    if row is sql:NoRowsError {
        return;
    }
    return row;
}

# Get the key results of some objectives.
#
# + okrIds - OKR IDs
# + return - The key results in each objective's order, or an error
public isolated function getKeyResultsOf(int[] okrIds) returns KeyResultRow[]|error {
    if okrIds.length() == 0 {
        return [];
    }
    stream<KeyResultRow, error?> rows = databaseClient->query(getKeyResultsOfQuery(okrIds));
    return from KeyResultRow row in rows
        select row;
}

# Get one key result.
#
# + keyResultId - Key result ID
# + return - The key result, nil when there is none or it or its objective was removed, or an error
public isolated function getKeyResult(int keyResultId) returns KeyResultRow|error? {
    KeyResultRow|error row = databaseClient->queryRow(getKeyResultQuery(keyResultId));
    if row is sql:NoRowsError {
        return;
    }
    return row;
}

# Get every status some key results have had.
#
# + keyResultIds - Key result IDs
# + return - The statuses, oldest first, or an error
public isolated function getKeyResultStatuses(int[] keyResultIds) returns KeyResultStatusRow[]|error {
    if keyResultIds.length() == 0 {
        return [];
    }
    stream<KeyResultStatusRow, error?> rows = databaseClient->query(getKeyResultStatusesQuery(keyResultIds));
    return from KeyResultStatusRow row in rows
        select row;
}

# Get the actions towards some key results.
#
# + keyResultIds - Key result IDs
# + return - The actions, oldest first, or an error
public isolated function getActionsOf(int[] keyResultIds) returns OkrActionRow[]|error {
    if keyResultIds.length() == 0 {
        return [];
    }
    stream<OkrActionRow, error?> rows = databaseClient->query(getActionsOfQuery(keyResultIds));
    return from OkrActionRow row in rows
        select row;
}

# Get one action.
#
# + actionId - Action ID
# + return - The action, nil when there is none or it was removed, or an error
public isolated function getAction(int actionId) returns OkrActionRow|error? {
    OkrActionRow|error row = databaseClient->queryRow(getActionQuery(actionId));
    if row is sql:NoRowsError {
        return;
    }
    return row;
}

# Get the comments on an action.
#
# + actionId - Action ID
# + return - The comments, oldest first, or an error
public isolated function getActionComments(int actionId) returns OkrCommentRow[]|error {
    stream<OkrCommentRow, error?> rows = databaseClient->query(getActionCommentsQuery(actionId));
    return from OkrCommentRow row in rows
        select row;
}

# Whether anyone has worked on an objective.
#
# + okrId - OKR ID
# + return - True when someone has, or an error
public isolated function isOkrWorkedOn(int okrId) returns boolean|error {
    int workedOn = check databaseClient->queryRow(isOkrWorkedOnQuery(okrId));
    return workedOn == 1;
}

# Get the people a key result of someone's objective can be given to: them and their team.
#
# + ownerEmail - The objective owner's work email
# + search - Part of a name or work email; empty for anyone
# + 'limit - At most this many
# + return - The people by name, or an error
public isolated function getOkrTeam(string ownerEmail, string search, int 'limit) returns OkrPersonRow[]|error {
    stream<OkrPersonRow, error?> rows = databaseClient->query(getOkrTeamQuery(ownerEmail, search, 'limit));
    return from OkrPersonRow row in rows
        select row;
}

# Add a key result with its first status.
#
# + okrId - The objective's OKR ID
# + keyResult - The key result
# + position - Its place among the objective's key results
# + createdBy - Who is adding it
# + return - An error when it couldn't be added
isolated function addKeyResult(int okrId, KeyResultInput keyResult, int position, string createdBy) returns error? {
    sql:ExecutionResult result = check databaseClient->execute(addKeyResultQuery(okrId, keyResult, position, createdBy));
    int keyResultId = check result.lastInsertId.ensureType(int);
    _ = check databaseClient->execute(addKeyResultStatusQuery(keyResultId, KR_NOT_STARTED, createdBy));
}

# Add an objective with its key results.
#
# + payload - The objective
# + return - The new objective's OKR ID, or an error
public isolated function addOkr(AddOkrPayload payload) returns int|error {
    int okrId = 0;
    transaction {
        sql:ExecutionResult result = check databaseClient->execute(addOkrQuery(payload));
        okrId = check result.lastInsertId.ensureType(int);
        foreach int i in 0 ..< payload.keyResults.length() {
            check addKeyResult(okrId, payload.keyResults[i], i, payload.createdBy);
        }
        check commit;
    }
    return okrId;
}

# Change an objective's details and its key results: change the ones with an ID, add the ones without,
# and remove the rest.
#
# + payload - New details and every key result
# + return - True when it was changed, false when someone changed it since the version given (or it's
# gone), or an error
public isolated function updateOkr(UpdateOkrPayload payload) returns boolean|error {
    boolean changed = false;
    transaction {
        sql:ExecutionResult result = check databaseClient->execute(updateOkrDetailsQuery(payload));
        if result.affectedRowCount == 0 {
            rollback;
        } else {
            int[] keptIds = from KeyResultInput keyResult in payload.keyResults
                let int? id = keyResult.keyResultId
                where id is int
                select id;
            _ = check databaseClient->execute(removeOtherKeyResultsQuery(payload.okrId, keptIds, payload.updatedBy));
            foreach int i in 0 ..< payload.keyResults.length() {
                KeyResultInput keyResult = payload.keyResults[i];
                int? keyResultId = keyResult.keyResultId;
                if keyResultId is int {
                    _ = check databaseClient->execute(
                        updateKeyResultQuery(payload.okrId, keyResultId, keyResult, i, payload.updatedBy));
                } else {
                    check addKeyResult(payload.okrId, keyResult, i, payload.updatedBy);
                }
            }
            check commit;
            changed = true;
        }
    }
    return changed;
}

# Complete, close or reopen an objective.
#
# + okrId - OKR ID
# + status - The new status
# + reason - Why it's closed
# + changedBy - Who is changing it
# + return - True when it was changed, false when there is no such objective, or an error
public isolated function setOkrStatus(int okrId, OkrStatus status, string? reason, string changedBy)
        returns boolean|error {
    sql:ExecutionResult result = check databaseClient->execute(setOkrStatusQuery(okrId, status, reason, changedBy));
    return result.affectedRowCount > 0;
}

# Change a key result's status, recording the change. Setting the status it already has records nothing.
#
# + keyResultId - Key result ID
# + status - The new status
# + changedBy - Who is changing it
# + return - An error when it couldn't be changed
public isolated function setKeyResultStatus(int keyResultId, KeyResultStatus status, string changedBy) returns error? {
    transaction {
        sql:ExecutionResult result = check databaseClient->execute(
            setKeyResultStatusQuery(keyResultId, status, changedBy));
        if result.affectedRowCount > 0 {
            _ = check databaseClient->execute(addKeyResultStatusQuery(keyResultId, status, changedBy));
        }
        check commit;
    }
}

# Change a key result's baseline and target, only when nobody has changed its objective since the
# version given.
#
# + okrId - The objective's OKR ID
# + version - The version the change was made from
# + keyResultId - Key result ID
# + baseline - Where it starts
# + target - Where it should get to
# + updatedBy - Who is changing it
# + return - True when it was changed, false when someone changed the objective since, or an error
public isolated function updateKeyResultMeasure(int okrId, int version, int keyResultId, string? baseline,
        string? target, string updatedBy) returns boolean|error {
    boolean changed = false;
    transaction {
        sql:ExecutionResult result = check databaseClient->execute(bumpOkrVersionQuery(okrId, version, updatedBy));
        if result.affectedRowCount == 0 {
            rollback;
        } else {
            _ = check databaseClient->execute(updateKeyResultMeasureQuery(keyResultId, baseline, target, updatedBy));
            check commit;
            changed = true;
        }
    }
    return changed;
}

# Add an action towards a key result.
#
# + keyResultId - Key result ID
# + title - The action
# + createdBy - Who is adding it
# + return - The new action's ID, or an error
public isolated function addAction(int keyResultId, string title, string createdBy) returns int|error {
    sql:ExecutionResult result = check databaseClient->execute(addActionQuery(keyResultId, title, createdBy));
    return result.lastInsertId.ensureType(int);
}

# Rename an action or tick it off.
#
# + actionId - Action ID
# + title - The action
# + done - Whether it's done
# + updatedBy - Who is changing it
# + return - True when it was changed, false when there is no such action, or an error
public isolated function updateAction(int actionId, string title, boolean done, string updatedBy)
        returns boolean|error {
    sql:ExecutionResult result = check databaseClient->execute(updateActionQuery(actionId, title, done, updatedBy));
    return result.affectedRowCount > 0;
}

# Remove an action.
#
# + actionId - Action ID
# + removedBy - Who is removing it
# + return - True when it was removed, false when there is no such action, or an error
public isolated function removeAction(int actionId, string removedBy) returns boolean|error {
    sql:ExecutionResult result = check databaseClient->execute(removeActionQuery(actionId, removedBy));
    return result.affectedRowCount > 0;
}

# Add a comment on an action.
#
# + actionId - Action ID
# + comment - The comment
# + createdBy - Who wrote it
# + return - The new comment's ID, or an error
public isolated function addActionComment(int actionId, string comment, string createdBy) returns int|error {
    sql:ExecutionResult result = check databaseClient->execute(addActionCommentQuery(actionId, comment, createdBy));
    return result.lastInsertId.ensureType(int);
}

# Delete an objective nobody has worked on.
#
# + okrId - OKR ID
# + deletedBy - Who is deleting it
# + return - True when it was deleted, false when there is no such objective or someone has worked on
# it, or an error
public isolated function deleteOkr(int okrId, string deletedBy) returns boolean|error {
    sql:ExecutionResult result = check databaseClient->execute(deleteOkrQuery(okrId, deletedBy));
    return result.affectedRowCount > 0;
}

# Check whether an employee is in a lead's reporting chain: their manager or active additional
# manager is the lead, or someone in the lead's chain.
#
# + leadEmail - Lead's work email
# + employeeEmail - Employee's work email
# + return - True when they are, or an error
public isolated function isInReportingChain(string leadEmail, string employeeEmail) returns boolean|error {
    int|error result = databaseClient->queryRow(isInReportingChainQuery(leadEmail, employeeEmail));
    if result is sql:NoRowsError {
        return false;
    }
    if result is error {
        return result;
    }
    return true;
}

# Get the status of the employment a work email currently belongs to.
#
# + workEmail - Work email
# + return - The employee status, nil when nobody has that work email, or an error
public isolated function getCurrentEmployeeStatus(string workEmail) returns string|error? {
    string|error status = databaseClient->queryRow(getCurrentEmployeeStatusQuery(workEmail));
    if status is sql:NoRowsError {
        return;
    }
    return status;
}
