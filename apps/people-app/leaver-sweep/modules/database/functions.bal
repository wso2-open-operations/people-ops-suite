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
    stream<LeaverTransition, error?> expiredLeaversStream = databaseClient->query(getExpiredLeaversQuery());
    LeaverTransition[] transitions = check from LeaverTransition transition in expiredLeaversStream
        select transition;

    if transitions.length() == 0 {
        return transitions;
    }

    transaction {
        sql:ExecutionResult executionResult = check databaseClient->execute(transitionExpiredLeaversQuery(actor));
        check checkAffectedCount(executionResult.affectedRowCount);
        check commit;
    }

    return transitions;
}
