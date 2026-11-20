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

// OKRs. An objective's owner, anyone above them in their reporting chain and People Ops admins manage
// it: its details, its key results, and completing, closing or reopening it. Each key result is given
// to the owner or someone in their team, who can also change its status and measure, and add and tick
// off its actions. Anyone above a key result's owner can read the objective too, and anyone who can read
// it can comment on its actions.

import people.authorization;
import people.database;

import ballerina/http;
import ballerina/log;
import ballerina/time;

const OKR_OBJECTIVE_MAX_LENGTH = 300;
const OKR_KEY_RESULT_MAX_LENGTH = 200;
const OKR_MEASURE_MAX_LENGTH = 50;
const OKR_ACTION_MAX_LENGTH = 300;
const OKR_COMMENT_MAX_LENGTH = 2000;
const OKR_CLOSE_REASON_MAX_LENGTH = 500;
const OKR_TEAM_SEARCH_LIMIT = 25;

const OKR_CHANGED_MEANWHILE = "Someone changed this OKR after you opened it, so your change wasn't saved. "
    + "Their change shows now; make yours again.";
const OKR_NOT_OPEN = "This OKR is completed or closed. Reopen it to change it.";

# Lists of OKRs: the caller's own and their team's, or everyone's.
enum OkrScope {
    OKR_SCOPE_TEAM = "team",
    OKR_SCOPE_ALL = "all"
}

# Whether the caller is a People Ops admin, who may manage everyone's OKRs.
#
# + userInfo - Invoker's JWT payload
# + return - True for People Ops admins
isolated function isOkrAdmin(authorization:CustomJwtPayload userInfo) returns boolean =>
    authorization:checkPermissions([authorization:authorizedRoles.ADMIN_ROLE], userInfo.groups);

# Whether two work emails are the same person's.
#
# + a - One work email
# + b - Another
# + return - True when they are
isolated function isSameEmail(string a, string b) returns boolean => a.toLowerAscii() == b.toLowerAscii();

# Whether the caller may manage someone's objectives and read their OKRs: the person, anyone above them
# in their reporting chain, or a People Ops admin.
#
# + userInfo - Invoker's JWT payload
# + ownerEmail - Owner's work email
# + return - True when they may, or an error
isolated function canManageOkrsOf(authorization:CustomJwtPayload userInfo, string ownerEmail) returns boolean|error {
    if isOkrAdmin(userInfo) || isSameEmail(ownerEmail, userInfo.email) {
        return true;
    }
    return database:isInReportingChain(userInfo.email, ownerEmail);
}

# Works out once per person whether the caller manages their objectives.
#
# + userInfo - Invoker's JWT payload
# + emails - Work emails
# + return - Whether the caller manages each one's, by lowercased email, or an error
isolated function managedOwners(authorization:CustomJwtPayload userInfo, string[] emails) returns map<boolean>|error {
    map<boolean> managed = {};
    foreach string email in emails {
        string key = email.toLowerAscii();
        if !managed.hasKey(key) {
            managed[key] = check canManageOkrsOf(userInfo, email);
        }
    }
    return managed;
}

# Whether the caller may read an objective: they manage it, own one of its key results, or are above
# one of their owners in their reporting chain.
#
# + userInfo - Invoker's JWT payload
# + okr - The objective
# + keyResults - Its key results
# + return - True when they may, or an error
isolated function canReadOkr(authorization:CustomJwtPayload userInfo, database:OkrRow okr,
        database:KeyResultRow[] keyResults) returns boolean|error {
    if check canManageOkrsOf(userInfo, okr.ownerEmail) {
        return true;
    }
    foreach database:KeyResultRow keyResult in keyResults {
        if isSameEmail(keyResult.ownerEmail, userInfo.email) {
            return true;
        }
        boolean above = check database:isInReportingChain(userInfo.email, keyResult.ownerEmail);
        if above {
            return true;
        }
    }
    return false;
}

# Seconds since the epoch as an ISO 8601 UTC string.
#
# + seconds - Seconds since the epoch
# + return - The string
isolated function okrTime(int seconds) returns string => time:utcToString([seconds, 0]);

# Put objectives together with their key results, each key result's status history and actions, and
# what the caller may do with each.
#
# + userInfo - Invoker's JWT payload
# + rows - The objectives
# + team - For a team list, the caller's team's work emails, lowercased: each owner is marked as in it
# or not
# + return - The OKRs, or an error
isolated function toOkrs(authorization:CustomJwtPayload userInfo, database:OkrRow[] rows, string[]? team = ())
        returns Okr[]|error {
    int[] okrIds = from database:OkrRow row in rows
        select row.okrId;
    database:KeyResultRow[] keyResultRows = check database:getKeyResultsOf(okrIds);
    int[] keyResultIds = from database:KeyResultRow keyResult in keyResultRows
        select keyResult.keyResultId;
    database:KeyResultStatusRow[] statusRows = check database:getKeyResultStatuses(keyResultIds);
    database:OkrActionRow[] actionRows = check database:getActionsOf(keyResultIds);
    map<boolean> managed = check managedOwners(userInfo, from database:OkrRow row in rows
        select row.ownerEmail);

    Okr[] okrs = [];
    foreach database:OkrRow row in rows {
        boolean canManage = managed[row.ownerEmail.toLowerAscii()] ?: false;
        OkrKeyResult[] keyResults = [];
        foreach database:KeyResultRow keyResult in keyResultRows {
            if keyResult.okrId != row.okrId {
                continue;
            }
            OkrStatusChange[] statusHistory = [];
            foreach database:KeyResultStatusRow change in statusRows {
                if change.keyResultId == keyResult.keyResultId {
                    statusHistory.push({
                        status: check change.status.ensureType(),
                        changedBy: change.changedBy,
                        changedOn: okrTime(change.changedOn)
                    });
                }
            }
            OkrAction[] actions = from database:OkrActionRow action in actionRows
                where action.keyResultId == keyResult.keyResultId
                select toOkrAction(action);
            OkrKeyResult converted = {
                keyResultId: keyResult.keyResultId,
                ownerEmail: keyResult.ownerEmail,
                title: keyResult.title,
                dueDate: keyResult.dueDate,
                status: check keyResult.status.ensureType(),
                statusHistory,
                actions,
                canUpdate: canManage || isSameEmail(keyResult.ownerEmail, userInfo.email)
            };
            string? ownerName = keyResult.ownerName;
            if ownerName is string {
                converted.ownerName = ownerName;
            }
            string? baseline = keyResult.baseline;
            if baseline is string {
                converted.baseline = baseline;
            }
            string? target = keyResult.target;
            if target is string {
                converted.target = target;
            }
            if team is string[] {
                converted.ownerInTeam = team.indexOf(keyResult.ownerEmail.toLowerAscii()) !is ();
            }
            keyResults.push(converted);
        }

        Okr okr = {
            okrId: row.okrId,
            ownerEmail: row.ownerEmail,
            objective: row.objective,
            status: check row.status.ensureType(),
            version: row.version,
            keyResults,
            canManage,
            createdBy: row.createdBy,
            createdOn: okrTime(row.createdOn),
            updatedBy: row.updatedBy,
            updatedOn: okrTime(row.updatedOn)
        };
        string? ownerName = row.ownerName;
        if ownerName is string {
            okr.ownerName = ownerName;
        }
        string? ownerLeadEmail = row.ownerLeadEmail;
        if ownerLeadEmail is string {
            okr.ownerLeadEmail = ownerLeadEmail;
        }
        string? closeReason = row.closeReason;
        if closeReason is string {
            okr.closeReason = closeReason;
        }
        string? statusChangedBy = row.statusChangedBy;
        if statusChangedBy is string {
            okr.statusChangedBy = statusChangedBy;
        }
        int? statusChangedOn = row.statusChangedOn;
        if statusChangedOn is int {
            okr.statusChangedOn = okrTime(statusChangedOn);
        }
        if team is string[] {
            okr.ownerInTeam = team.indexOf(row.ownerEmail.toLowerAscii()) !is ();
        }
        okrs.push(okr);
    }
    return okrs;
}

# Convert a stored action for the API.
#
# + row - The stored action
# + return - The action
isolated function toOkrAction(database:OkrActionRow row) returns OkrAction {
    OkrAction action = {
        actionId: row.actionId,
        title: row.title,
        done: row.isDone == 1,
        commentCount: row.commentCount,
        createdBy: row.createdBy,
        createdOn: okrTime(row.createdOn)
    };
    string? doneBy = row.doneBy;
    if doneBy is string {
        action.doneBy = doneBy;
    }
    int? doneOn = row.doneOn;
    if doneOn is int {
        action.doneOn = okrTime(doneOn);
    }
    return action;
}

# Convert a stored comment for the API.
#
# + row - The stored comment
# + return - The comment
isolated function toOkrComment(database:OkrCommentRow row) returns OkrComment {
    OkrComment comment = {
        commentId: row.commentId,
        comment: row.comment,
        createdBy: row.createdBy,
        createdOn: okrTime(row.createdOn)
    };
    string? authorName = row.authorName;
    if authorName is string {
        comment.authorName = authorName;
    }
    return comment;
}

# Read one objective as the caller sees it.
#
# + userInfo - Invoker's JWT payload
# + okrId - OKR ID
# + return - The OKR, or the error response to send
isolated function okrResponse(authorization:CustomJwtPayload userInfo, int okrId)
        returns Okr|http:NotFound|http:InternalServerError {
    database:OkrRow|error? row = database:getOkr(okrId);
    if row is () {
        return <http:NotFound>{body: {message: "OKR not found"}};
    }
    Okr[]|error okrs = row is error ? row : toOkrs(userInfo, [row]);
    if okrs is error {
        string customErr = string `Error occurred while reading OKR ${okrId}`;
        log:printError(customErr, okrs, okrId = okrId);
        return <http:InternalServerError>{body: {message: customErr}};
    }
    return okrs[0];
}

# Log an error and make the response for it.
#
# + message - What went wrong, for the log and the response
# + err - The error
# + return - The response
isolated function okrError(string message, error err) returns http:InternalServerError {
    log:printError(message, err);
    return <http:InternalServerError>{body: {message}};
}

# Get an objective the caller may manage.
#
# + userInfo - Invoker's JWT payload
# + okrId - OKR ID
# + return - The objective, or the response to send: not found (including deleted), or forbidden
isolated function getManageableOkr(authorization:CustomJwtPayload userInfo, int okrId)
        returns database:OkrRow|http:Forbidden|http:NotFound|http:InternalServerError {
    database:OkrRow|error? existing = database:getOkr(okrId);
    if existing is error {
        return okrError(string `Error occurred while fetching OKR ${okrId}`, existing);
    }
    if existing is () {
        return <http:NotFound>{body: {message: "OKR not found"}};
    }
    boolean|error canManage = canManageOkrsOf(userInfo, existing.ownerEmail);
    if canManage is error {
        return okrError("Error occurred while checking access to OKRs", canManage);
    }
    if !canManage {
        return <http:Forbidden>{body: {message: "Only its owner and the leads above them can change this OKR"}};
    }
    return existing;
}

# Get a key result the caller may work on, and its objective: they manage the objective or own the key
# result.
#
# + userInfo - Invoker's JWT payload
# + keyResultId - Key result ID
# + return - The objective and the key result, or the response to send
isolated function getUpdatableKeyResult(authorization:CustomJwtPayload userInfo, int keyResultId)
        returns [database:OkrRow, database:KeyResultRow]|http:Forbidden|http:NotFound|http:InternalServerError {
    database:KeyResultRow|error? keyResult = database:getKeyResult(keyResultId);
    if keyResult is error {
        return okrError(string `Error occurred while fetching key result ${keyResultId}`, keyResult);
    }
    if keyResult is () {
        return <http:NotFound>{body: {message: "Key result not found"}};
    }
    database:OkrRow|error? okr = database:getOkr(keyResult.okrId);
    if okr is error {
        return okrError(string `Error occurred while fetching OKR ${keyResult.okrId}`, okr);
    }
    if okr is () {
        return <http:NotFound>{body: {message: "OKR not found"}};
    }
    if isSameEmail(keyResult.ownerEmail, userInfo.email) {
        return [okr, keyResult];
    }
    boolean|error canManage = canManageOkrsOf(userInfo, okr.ownerEmail);
    if canManage is error {
        return okrError("Error occurred while checking access to OKRs", canManage);
    }
    if !canManage {
        return <http:Forbidden>{
            body: {message: "Only the key result's owner, the objective's owner and the leads above them can change it"}
        };
    }
    return [okr, keyResult];
}

# Get an action the caller may work on, with its objective and key result.
#
# + userInfo - Invoker's JWT payload
# + actionId - Action ID
# + return - The objective, the key result and the action, or the response to send
isolated function getUpdatableAction(authorization:CustomJwtPayload userInfo, int actionId)
        returns [database:OkrRow, database:KeyResultRow, database:OkrActionRow]
            |http:Forbidden|http:NotFound|http:InternalServerError {
    database:OkrActionRow|error? action = database:getAction(actionId);
    if action is error {
        return okrError(string `Error occurred while fetching action ${actionId}`, action);
    }
    if action is () {
        return <http:NotFound>{body: {message: "Action not found"}};
    }
    [database:OkrRow, database:KeyResultRow]|http:Forbidden|http:NotFound|http:InternalServerError found =
        getUpdatableKeyResult(userInfo, action.keyResultId);
    if found !is [database:OkrRow, database:KeyResultRow] {
        return found;
    }
    return [found[0], found[1], action];
}

# Whether an objective is still open, so its key results and actions can change.
#
# + okr - The objective
# + return - Nil when it is, or the response to send
isolated function requireOpen(database:OkrRow okr) returns http:BadRequest? {
    if okr.status != database:OKR_OPEN {
        return <http:BadRequest>{body: {message: OKR_NOT_OPEN}};
    }
    return;
}

# Whether a string is a real calendar date written as YYYY-MM-DD.
#
# + date - The string
# + return - True when it is
isolated function isValidDate(string date) returns boolean {
    if !re `\d{4}-\d{2}-\d{2}`.isFullMatch(date) {
        return false;
    }
    int|error year = int:fromString(date.substring(0, 4));
    int|error month = int:fromString(date.substring(5, 7));
    int|error day = int:fromString(date.substring(8, 10));
    if year is error || month is error || day is error {
        return false;
    }
    return time:dateValidate({year, month, day}) is ();
}

# A trimmed optional text: nil when it's blank.
#
# + text - The text
# + return - It trimmed, or nil
isolated function optionalText(string? text) returns string? {
    string trimmed = (text ?: "").trim();
    return trimmed == "" ? () : trimmed;
}

# Check a key result's measure and tidy it.
#
# + baseline - Where it starts
# + target - Where it should get to
# + return - Both trimmed, blanks as nil, or why they can't be stored
isolated function validateMeasure(string? baseline, string? target) returns [string?, string?]|string {
    string? cleanBaseline = optionalText(baseline);
    string? cleanTarget = optionalText(target);
    if (cleanBaseline ?: "").length() > OKR_MEASURE_MAX_LENGTH || (cleanTarget ?: "").length() > OKR_MEASURE_MAX_LENGTH {
        return string `Keep the baseline and target under ${OKR_MEASURE_MAX_LENGTH} characters.`;
    }
    return [cleanBaseline, cleanTarget];
}

# Check an objective and its key results, and tidy them. The objective has no due date; each key result
# has its own. A key result with no owner is the objective owner's. There's no limit on how many.
#
# + ownerEmail - The objective owner's work email
# + objective - The objective
# + keyResults - Its key results, in order
# + return - The trimmed objective and key results, or why they can't be stored
isolated function validateOkr(string ownerEmail, string objective, KeyResultEntry[] keyResults)
        returns [string, database:KeyResultInput[]]|string {
    string cleanObjective = objective.trim();
    if cleanObjective == "" {
        return "The OKR needs an objective.";
    }
    if cleanObjective.length() > OKR_OBJECTIVE_MAX_LENGTH {
        return string `Keep the objective under ${OKR_OBJECTIVE_MAX_LENGTH} characters.`;
    }
    database:KeyResultInput[] cleanKeyResults = [];
    foreach KeyResultEntry keyResult in keyResults {
        string title = keyResult.title.trim();
        if title == "" {
            return "Every key result needs a title.";
        }
        if title.length() > OKR_KEY_RESULT_MAX_LENGTH {
            return string `Keep each key result under ${OKR_KEY_RESULT_MAX_LENGTH} characters.`;
        }
        [string?, string?]|string measure = validateMeasure(keyResult.baseline, keyResult.target);
        if measure is string {
            return measure;
        }
        string? keyResultDue = keyResult.dueDate;
        if keyResultDue is () {
            return string `"${title}" needs a due date.`;
        }
        if !isValidDate(keyResultDue) {
            return "A key result's due date must be a real date in the format YYYY-MM-DD.";
        }
        cleanKeyResults.push({
            keyResultId: keyResult.keyResultId,
            ownerEmail: (keyResult.ownerEmail ?: ownerEmail).trim().toLowerAscii(),
            title,
            baseline: measure[0],
            target: measure[1],
            dueDate: keyResultDue
        });
    }
    return [cleanObjective, cleanKeyResults];
}

# Check that each key result is given to the objective owner or a current employee in their team.
# Only owners that are new are checked, so a key result whose owner has since moved or left doesn't
# stop the rest of the objective from being changed.
#
# + ownerEmail - The objective owner's work email
# + keyResults - The key results
# + storedOwners - The stored owner of each existing key result, by key result ID
# + return - Nil when they all may be, why one may not, or an error
isolated function checkKeyResultOwners(string ownerEmail, database:KeyResultInput[] keyResults,
        map<string> storedOwners = {}) returns string|error? {
    map<boolean> checked = {};
    foreach database:KeyResultInput keyResult in keyResults {
        string krOwner = keyResult.ownerEmail;
        int? keyResultId = keyResult.keyResultId;
        if keyResultId is int && isSameEmail(storedOwners[keyResultId.toString()] ?: "", krOwner) {
            continue;
        }
        if checked.hasKey(krOwner) {
            continue;
        }
        checked[krOwner] = true;
        string? status = check database:getCurrentEmployeeStatus(krOwner);
        if status is () || status == database:EMPLOYEE_LEFT {
            return string `${krOwner} isn't a current employee.`;
        }
        if isSameEmail(krOwner, ownerEmail) {
            continue;
        }
        boolean inTeam = check database:isInReportingChain(ownerEmail, krOwner);
        if !inTeam {
            return string `${krOwner} isn't in the objective owner's team. A key result can only be given to them or `
                + "someone in their team.";
        }
    }
    return;
}

# A stored key result as entered, for re-saving it unchanged.
#
# + row - The stored key result
# + return - The key result as entered
isolated function toKeyResultEntry(database:KeyResultRow row) returns KeyResultEntry {
    KeyResultEntry entry = {
        keyResultId: row.keyResultId,
        title: row.title,
        ownerEmail: row.ownerEmail,
        dueDate: row.dueDate
    };
    string? baseline = row.baseline;
    if baseline is string {
        entry.baseline = baseline;
    }
    string? target = row.target;
    if target is string {
        entry.target = target;
    }
    return entry;
}

# Get an action whose OKR the caller can read, with its objective and key result.
#
# + userInfo - Invoker's JWT payload
# + actionId - Action ID
# + return - The objective, the key result and the action, or the response to send
isolated function getReadableAction(authorization:CustomJwtPayload userInfo, int actionId)
        returns [database:OkrRow, database:KeyResultRow, database:OkrActionRow]
            |http:Forbidden|http:NotFound|http:InternalServerError {
    database:OkrActionRow|error? action = database:getAction(actionId);
    if action is error {
        return okrError(string `Error occurred while fetching action ${actionId}`, action);
    }
    if action is () {
        return <http:NotFound>{body: {message: "Action not found"}};
    }
    database:KeyResultRow|error? keyResult = database:getKeyResult(action.keyResultId);
    if keyResult is error {
        return okrError(string `Error occurred while fetching key result ${action.keyResultId}`, keyResult);
    }
    if keyResult is () {
        return <http:NotFound>{body: {message: "Action not found"}};
    }
    database:OkrRow|error? okr = database:getOkr(keyResult.okrId);
    if okr is error {
        return okrError(string `Error occurred while fetching OKR ${keyResult.okrId}`, okr);
    }
    if okr is () {
        return <http:NotFound>{body: {message: "Action not found"}};
    }
    database:KeyResultRow[]|error keyResults = database:getKeyResultsOf([okr.okrId]);
    if keyResults is error {
        return okrError(string `Error occurred while fetching OKR ${okr.okrId}`, keyResults);
    }
    boolean|error canRead = canReadOkr(userInfo, okr, keyResults);
    if canRead is error {
        return okrError("Error occurred while checking access to OKRs", canRead);
    }
    if !canRead {
        return <http:Forbidden>{body: {message: "You can't see this OKR"}};
    }
    return [okr, keyResult, action];
}
