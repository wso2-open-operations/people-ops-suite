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

# Add meal record.
#
# + payload - Payload containing the meal record details
# + createdBy - Person who is creating the record
# + return - Id of the meal record|DuplicateMealRecordError|Error
public isolated function addMealRecord(AddMealRecordPayload payload, string createdBy)
    returns int|DuplicateMealRecordError|error {

    sql:ExecutionResult|error executionResults = databaseClient->execute(addMealRecordQuery(payload, createdBy));
    if executionResults is error {
        // MySQL duplicate key errors bubble up via JDBC with messages like:
        // - "Duplicate entry ... for key ..."
        // - "SQLIntegrityConstraintViolationException"
        // We avoid relying on driver-specific structured fields for compatibility.
        string errMsg = executionResults.message();
        if errMsg.includes("Duplicate entry") || errMsg.includes("SQLIntegrityConstraintViolationException") ||
                errMsg.includes("uniq_meal_record_date_type") {
            return error DuplicateMealRecordError("Meal record already exists for the given date and meal_type.");
        }
        return executionResults;
    }

    return <int>executionResults.lastInsertId;
}

# Fetch meal record by id.
#
# + id - Meal record id
# + return - Meal record|Error or () if not found
public isolated function fetchMealRecord(int id) returns MealRecord|error? {
    MealRecord|sql:Error mealRecord = databaseClient->queryRow(getMealRecordByIdQuery(id));
    if mealRecord is sql:Error && mealRecord is sql:NoRowsError {
        return;
    }
    return mealRecord;
}

# Fetch meal records list (paginated).
#
# + filters - Filters
# + page - Page number
# + pageSize - Page size
# + return - Paginated response|Error
public isolated function fetchMealRecords(MealRecordFilters filters, int page, int pageSize) returns PaginatedMealRecords|error {
    stream<MealRecordListRow, sql:Error?> resultStream = databaseClient->query(getMealRecordsQuery(filters));

    int totalCount = 0;
    MealRecord[] records = [];

    check from MealRecordListRow row in resultStream
        do {
            totalCount = row.totalCount;
            records.push({
                id: row.id,
                record_date: row.record_date,
                meal_type: row.meal_type,
                total_waste_kg: row.total_waste_kg,
                plate_count: row.plate_count,
                created_on: row.created_on,
                created_by: row.created_by,
                updated_on: row.updated_on,
                updated_by: row.updated_by
            });
        };

    return {totalCount, page, pageSize, records};
}

# Fetch breakfast + lunch records for a given date.
#
# + recordDate - Date (YYYY-MM-DD)
# + return - Daily response|Error
public isolated function fetchDailyMealRecords(string recordDate) returns DailyMealRecords|error {
    stream<MealRecord, sql:Error?> resultStream = databaseClient->query(getMealRecordsByDateQuery(recordDate));
    MealRecord? breakfast = ();
    MealRecord? lunch = ();

    check from MealRecord rec in resultStream
        do {
            if rec.meal_type == "BREAKFAST" {
                breakfast = rec;
            } else if rec.meal_type == "LUNCH" {
                lunch = rec;
            }
        };

    return {record_date: recordDate, breakfast, lunch};
}

# Update an existing meal record.
#
# + id - Meal record id
# + payload - Fields to update
# + updatedBy - Person who is updating
# + return - Updated record|MealRecordNotFoundError|Error
public isolated function updateMealRecord(int id, UpdateMealRecordPayload payload, string updatedBy)
    returns MealRecord|MealRecordNotFoundError|error {

    sql:ExecutionResult executionResult = check databaseClient->execute(updateMealRecordQuery(id, payload, updatedBy));
    if executionResult.affectedRowCount < 1 {
        return error MealRecordNotFoundError("Meal record not found.");
    }

    MealRecord|error? updated = fetchMealRecord(id);
    if updated is error {
        return updated;
    }
    if updated is () {
        return error MealRecordNotFoundError("Meal record not found.");
    }
    return updated;
}

# Delete an existing meal record.
#
# + id - Meal record id
# + return - MealRecordNotFoundError|Error if deletion failed
public isolated function deleteMealRecord(int id) returns MealRecordNotFoundError|error? {
    sql:ExecutionResult executionResult = check databaseClient->execute(deleteMealRecordQuery(id));
    if executionResult.affectedRowCount < 1 {
        return error MealRecordNotFoundError("Meal record not found.");
    }
}
