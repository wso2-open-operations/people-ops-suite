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

// --- Advertisement Functions ---

# Add a new advertisement.
#
# + payload - Advertisement data
# + createdBy - User creating the ad
# + return - Created ID or Error
public isolated function addAdvertisement(CreateAdvertisementPayload payload, string createdBy) returns int|error {
    sql:ExecutionResult|error result = databaseClient->execute(addAdvertisementQuery(payload, createdBy));
    if result is error {
        return result;
    }
    return <int>result.lastInsertId;
}

# Get all advertisements.
#
# + return - List of advertisements or Error
public isolated function getAdvertisements() returns Advertisement[]|error {
    stream<Advertisement, sql:Error?> resultStream = databaseClient->query(getAdvertisementsQuery());
    return from Advertisement ad in resultStream
        select ad;
}

# Get the currently active advertisement.
#
# + return - Active Advertisement or () if none, or Error
public isolated function getActiveAdvertisement() returns Advertisement|error? {
    Advertisement|sql:Error result = databaseClient->queryRow(getActiveAdvertisementQuery());
    if result is sql:NoRowsError {
        return ();
    }
    return result;
}

# Get advertisement by ID.
#
# + id - Ad ID
# + return - Advertisement or () if not found, or Error
public isolated function getAdvertisementById(int id) returns Advertisement|error? {
    Advertisement|sql:Error result = databaseClient->queryRow(getAdvertisementByIdQuery(id));
    if result is sql:NoRowsError {
        return ();
    }
    return result;
}

# Activate an advertisement (deactivating others via DB trigger).
#
# + id - Advertisement ID
# + return - Error if failed
public isolated function activateAdvertisement(int id) returns error? {
    sql:ExecutionResult|error result = databaseClient->execute(activateAdvertisementQuery(id));
    if result is error {
        return result;
    }
    if result.affectedRowCount == 0 {
        return error("Advertisement not found or already active");
    }
}

# Delete an advertisement.
#
# + id - Advertisement ID
# + return - Error if failed (e.g. active ad cannot be deleted logic should be checked before calling this, or handle DB constraint if any)
public isolated function deleteAdvertisement(int id) returns error? {
    // Check if active before deleting?
    Advertisement|error? ad = getAdvertisementById(id);
    if ad is Advertisement && ad.is_active {
        return error("Cannot delete an active advertisement. Deactivate it first.");
    }

    sql:ExecutionResult|error result = databaseClient->execute(deleteAdvertisementQuery(id));
    if result is error {
        return result;
    }
    if result.affectedRowCount == 0 {
        return error("Advertisement not found");
    }
}

// --- Analytics Functions ---

public isolated function getWeeklyTrend(string startDate) returns WeeklyTrendItem[]|error {
    stream<WeeklyTrendItem, sql:Error?> resultStream = databaseClient->query(getWeeklyTrendQuery(startDate));
    return from WeeklyTrendItem item in resultStream
        select item;
}

public isolated function getMonthlyTrend(string startMonth, string endMonth) returns MonthlyTrendItem[]|error {
    stream<MonthlyTrendItem, sql:Error?> resultStream = databaseClient->query(getMonthlyTrendQuery(startMonth, endMonth));
    return from MonthlyTrendItem item in resultStream
        select item;
}

public isolated function getDateRangeSummary(string startDate, string endDate) returns DateRangeSummary|error {
    // 1. Get total stats
    record {|decimal total_waste_kg; int total_plates;|} stats =
        check databaseClient->queryRow(getDateRangeSummaryStatsQuery(startDate, endDate));

    // 2. Get highest waste day
    record {|string record_date; decimal daily_total;|}|sql:Error highest =
        databaseClient->queryRow(getHighestWasteDayQuery(startDate, endDate));

    decimal highest_waste = 0.0d;
    string highest_date = "";

    if highest is record {|string record_date; decimal daily_total;|} {
        highest_waste = highest.daily_total;
        highest_date = highest.record_date;
    }

    decimal avg = 0.0d;
    if stats.total_plates > 0 {
        avg = (stats.total_waste_kg * 1000.0d) / <decimal>stats.total_plates;
    }

    return {
        start_date: startDate,
        end_date: endDate,
        total_waste_kg: stats.total_waste_kg,
        total_plates: stats.total_plates,
        average_waste_per_plate_grams: avg,
        highest_waste_day_kg: highest_waste,
        highest_waste_date: highest_date
    };
}

public isolated function getTodayKPIs(string date) returns TodayKPIs|error {
    DailyMealRecords daily = check fetchDailyMealRecords(date);

    decimal totalWaste = 0.0d;
    int totalPlates = 0;

    MealRecord? breakfast = daily.breakfast;
    if breakfast is MealRecord {
        totalWaste += breakfast.total_waste_kg;
        totalPlates += breakfast.plate_count;
    }

    MealRecord? lunch = daily.lunch;
    if lunch is MealRecord {
        totalWaste += lunch.total_waste_kg;
        totalPlates += lunch.plate_count;
    }

    decimal avg = 0.0d;
    if totalPlates > 0 {
        avg = (totalWaste * 1000.0d) / <decimal>totalPlates;
    }

    return {
        date: date,
        breakfast: daily.breakfast,
        lunch: daily.lunch,
        total_daily_waste_kg: totalWaste,
        total_daily_plates: totalPlates,
        average_waste_per_plate_grams: avg
    };
}
