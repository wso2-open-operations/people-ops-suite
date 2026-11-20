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

import ballerina/sql;
import ballerina/test;

const OKR_OWNER_EMAIL = "owner@example.invalid";

@test:Config {}
isolated function testOkrAccessWalksTheSameChainAsMyTeam() {
    string walk = sqlText(subordinateTreeCte(LEAD_EMAIL));
    test:assertTrue(sqlText(getOkrsInChainOfQuery(LEAD_EMAIL)).startsWith(walk),
            "a lead's OKR list should walk the chain with the shared query");
    test:assertTrue(sqlText(isInReportingChainQuery(LEAD_EMAIL, OKR_OWNER_EMAIL)).startsWith(walk),
            "OKR access should walk the same chain as the My Team list");
}

@test:Config {}
isolated function testOkrAccessFollowsTheCurrentEmployment() {
    // A rehire keeps their work email, and their earlier, Left row still names the manager they had
    // then. Matching the chain by email would give that manager their OKRs.
    sql:ParameterizedQuery query = isInReportingChainQuery(LEAD_EMAIL, OKR_OWNER_EMAIL);
    string text = sqlText(query);
    test:assertTrue(text.includes("WHERE pk_id = ("), "the chain should be matched on one employment");
    test:assertTrue(text.includes("ORDER BY (c.employee_status <> ?) DESC, c.id DESC"),
            "the employment should be the latest one that isn't Left");
    test:assertTrue(query.insertions.some(value => value == EMPLOYEE_LEFT));
}

@test:Config {}
isolated function testOkrReadsLeaveOutDeletedOnes() {
    sql:ParameterizedQuery[] reads = [
        getOkrsOfQuery(OKR_OWNER_EMAIL),
        getOkrsInChainOfQuery(LEAD_EMAIL),
        getAllOkrsQuery(),
        getOkrQuery(1)
    ];
    foreach sql:ParameterizedQuery read in reads {
        test:assertTrue(sqlText(read).includes("WHERE o.is_active = 1"), "a deleted OKR must not be read");
    }
    string keyResults = sqlText(getKeyResultsOfQuery([1]));
    test:assertTrue(keyResults.includes("WHERE k.is_active = 1"), "a removed key result must not be read");
    test:assertTrue(keyResults.includes("JOIN okr o ON o.id = k.okr_id AND o.is_active = 1"),
            "a deleted OKR's key results must not be read");
    test:assertTrue(sqlText(getActionsOfQuery([1])).includes("WHERE a.is_active = 1"), "a removed action must not be read");
}

@test:Config {}
isolated function testOnesOwnOkrsIncludeTheirKeyResultsOnOthersObjectives() {
    string text = sqlText(getOkrsOfQuery(OKR_OWNER_EMAIL));
    test:assertTrue(text.includes("LOWER(o.owner_email) = LOWER(?)"), "the objectives they own");
    test:assertTrue(text.includes("AND LOWER(k.owner_email) = LOWER(?)"), "and those with a key result of theirs");
}

@test:Config {}
isolated function testALeadsListIsTheirTeamsWithoutLeavers() {
    string team = sqlText(getOkrsInChainOfQuery(LEAD_EMAIL));
    test:assertFalse(team.includes("LOWER(o.owner_email) = LOWER(?)"),
            "a lead's own objectives are on their own page, not their team's list");
    test:assertTrue(team.includes("e.id IN (SELECT pk_id FROM subordinate_tree)"), "objectives the team owns");
    test:assertTrue(team.includes("e.employee_status <> ?"), "a leaver's OKRs should not be listed");
    test:assertTrue(team.includes("ke.id IN (SELECT pk_id FROM subordinate_tree)"),
            "an objective with a key result of someone in the team belongs in the list");
    test:assertTrue(sqlText(getAllOkrsQuery()).includes("e.employee_status <> ?"), "a leaver's OKRs should not be listed");
}

@test:Config {}
isolated function testKeyResultOwnersComeFromTheObjectiveOwnersTeam() {
    string walk = sqlText(subordinateTreeCte(OKR_OWNER_EMAIL));
    string text = sqlText(getOkrTeamQuery(OKR_OWNER_EMAIL, "", 25));
    test:assertTrue(text.startsWith(walk), "the owner's team is their reporting chain, as for My Team");
    test:assertTrue(text.includes("e.employee_status <> ?"), "a leaver can't be given a key result");
    test:assertFalse(text.includes("LIKE"), "an empty search matches everyone");
    test:assertTrue(sqlText(getOkrTeamQuery(OKR_OWNER_EMAIL, "ravi", 25)).includes("LIKE"));
}

@test:Config {}
isolated function testChangesOnlyApplyToTheVersionOpened() {
    string details = sqlText(updateOkrDetailsQuery({
        okrId: 1,
        version: 3,
        objective: "Objective",
        keyResults: [],
        updatedBy: LEAD_EMAIL
    }));
    string bump = sqlText(bumpOkrVersionQuery(1, 3, LEAD_EMAIL));
    foreach string text in [details, bump] {
        test:assertTrue(text.includes("version = version + 1"), "a change moves the OKR on a version");
        test:assertTrue(text.includes("AND version = ?"), "a change made from an older version must not overwrite");
    }
}

@test:Config {}
isolated function testRemovingKeyResultsKeepsTheOnesSent() {
    test:assertFalse(sqlText(removeOtherKeyResultsQuery(1, [], LEAD_EMAIL)).includes("NOT IN"),
            "with none kept, all of them go");
    test:assertTrue(sqlText(removeOtherKeyResultsQuery(1, [4, 5], LEAD_EMAIL)).includes("AND id NOT IN (?, ?)"));
}

@test:Config {}
isolated function testAKeyResultsStatusIsRecordedOnlyWhenItChanges() {
    test:assertTrue(sqlText(setKeyResultStatusQuery(1, KR_ON_TRACK, LEAD_EMAIL)).includes("AND status <> ?"),
            "setting the status it already has must not add a change to its history");
}

@test:Config {}
isolated function testTickingAnActionReadsItBeforeItChanges() {
    // MySQL applies single-table SET assignments left to right.
    string text = sqlText(updateActionQuery(1, "Action", true, LEAD_EMAIL));
    int? doneAt = text.indexOf("is_done = ?");
    int? doneByAt = text.indexOf("done_by = CASE");
    int? doneOnAt = text.indexOf("done_on = CASE");
    if doneAt is () || doneByAt is () || doneOnAt is () {
        test:assertFail("the update should set is_done and both done columns");
    }
    test:assertTrue(doneByAt < doneAt && doneOnAt < doneAt, "the done columns should be set before is_done");
}

@test:Config {}
isolated function testOnlyAnOkrNobodyWorkedOnIsDeleted() {
    string workedOn = sqlText(isOkrWorkedOnQuery(1));
    string delete = sqlText(deleteOkrQuery(1, LEAD_EMAIL));
    test:assertTrue(workedOn.includes("status_changed_on IS NOT NULL") && delete.includes("status_changed_on IS NULL"),
            "completed, closed or reopened counts as worked on");
    foreach string part in ["FROM okr_action a", "FROM okr_key_result_status s", "HAVING COUNT(*) > 1"] {
        test:assertTrue(workedOn.includes(part) && delete.includes(part),
                string `the delete must check what the worked-on check does: ${part}`);
    }
}

@test:Config {}
isolated function testNamesAreLookedUpByTheRightEmail() {
    // currentEmploymentIdOf's subquery calls the employee table `c`, so an outer alias of `c` would be
    // shadowed inside it and match the employee's own columns instead.
    foreach string text in [sqlText(getActionCommentsQuery(1)), sqlText(okrSelectQuery()), sqlText(keyResultSelectQuery())] {
        test:assertFalse(text.includes("LOWER(c.created_by)") || text.includes("LOWER(c.owner_email)"),
                "an outer `c` alias is shadowed by the employment lookup");
    }
}

@test:Config {}
isolated function testTheTeamIsTheSameWalkWithoutLeavers() {
    string walk = sqlText(subordinateTreeCte(LEAD_EMAIL));
    string text = sqlText(getTeamEmailsQuery(LEAD_EMAIL));
    test:assertTrue(text.startsWith(walk), "the team is the reporting chain, as for My Team");
    test:assertTrue(text.includes("e.employee_status <> ?"), "a leaver isn't in the team");
}
