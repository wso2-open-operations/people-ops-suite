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

import ballerina/log;
import ballerina/sql;

# Check the affected row count after an update operation.
#
# + affectedRowCount - Number of rows affected by the update operation
# + return - Error if no rows are updated
isolated function checkAffectedCount(int? affectedRowCount) returns error? {
    if affectedRowCount == 0 || affectedRowCount is () {
        return error("No rows were updated");
    }
    return;
}

# Auto-transition employees whose Marked-leaver final day of employment has arrived (today or earlier) to Left.
#
# + actor - System actor performing the update (e.g. "system-scheduler")
# + return - The employees that were transitioned (empty if none were due), or an error
public isolated function transitionExpiredLeavers(string actor) returns LeaverTransition[]|error {
    log:printInfo("Loading employees due for leaver transition");

    stream<LeaverTransition, error?> expiredLeaversStream = databaseClient->query(getExpiredLeaversQuery());
    LeaverTransition[] transitions = check from LeaverTransition transition in expiredLeaversStream
        select transition;

    log:printInfo("Loaded employees due for leaver transition", count = transitions.length());

    if transitions.length() == 0 {
        return transitions;
    }

    string[] employeeIds = from LeaverTransition t in transitions select t.employeeId;

    transaction {
        sql:ExecutionResult executionResult =
            check databaseClient->execute(transitionExpiredLeaversQuery(actor, employeeIds));
        check checkAffectedCount(executionResult.affectedRowCount);
        check commit;
    }

    log:printInfo("Marked employees as Left", count = transitions.length());

    return transitions;
}
