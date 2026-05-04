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

// --- Food Waste Functions ---

# Add a food waste record.
#
# + payload - Payload containing the food waste record details
# + createdBy - Person who is creating the record
# + return - Id of the inserted record or DuplicateFoodWasteRecordError or Error
public isolated function addFoodWasteRecord(AddFoodWasteRecordPayload payload, string createdBy)
    returns int|DuplicateFoodWasteRecordError|error {

    sql:ExecutionResult|error executionResults = databaseClient->execute(addFoodWasteRecordQuery(payload, createdBy));
    if executionResults is error {
        string errMsg = executionResults.message();
        if errMsg.includes("Duplicate entry") || errMsg.includes("uniq_food_waste_record_date_type") {
            return error DuplicateFoodWasteRecordError(
                "Food waste record already exists for the given date and meal type.");
        }
        return executionResults;
    }
    anydata lastInsertId = executionResults.lastInsertId;
    if lastInsertId is int {
        return lastInsertId;
    }
    return error("Failed to retrieve the last insert ID.");
}

# Fetch food waste record by id.
#
# + id - Food waste record id
# + return - FoodWasteRecord or Error or () if not found
public isolated function fetchFoodWasteRecord(int id) returns FoodWasteRecord|error? {
    FoodWasteRecord|sql:Error foodWasteRecord = databaseClient->queryRow(getFoodWasteRecordByIdQuery(id));
    if foodWasteRecord is sql:NoRowsError {
        return ();
    }
    return foodWasteRecord;
}

# Fetch food waste records list (paginated).
#
# + filters - Filters
# + page - Page number
# + pageSize - Page size
# + return - PaginatedFoodWasteRecords or Error
public isolated function fetchFoodWasteRecords(FoodWasteRecordFilters filters, int page, int pageSize)
    returns PaginatedFoodWasteRecords|error {

    stream<FoodWasteRecordListRow, sql:Error?> resultStream =
        databaseClient->query(getFoodWasteRecordsQuery(filters, page, pageSize));
    int totalCount = 0;
    FoodWasteRecord[] records = [];

    check from FoodWasteRecordListRow row in resultStream
        do {
            totalCount = row.totalCount;
            records.push({
                id: row.id,
                recordDate: row.recordDate,
                mealType: row.mealType,
                totalWasteKg: row.totalWasteKg,
                plateCount: row.plateCount,
                createdOn: row.createdOn,
                createdBy: row.createdBy,
                updatedOn: row.updatedOn,
                updatedBy: row.updatedBy
            });
        };

    return {totalCount, page, pageSize, records};
}

# Fetch breakfast + lunch records for a given date.
#
# + recordDate - Date (YYYY-MM-DD)
# + return - Daily response or Error
public isolated function fetchDailyFoodWasteRecords(string recordDate) returns DailyFoodWasteRecords|error {
    stream<FoodWasteRecord, sql:Error?> resultStream =
        databaseClient->query(getFoodWasteRecordsByDateQuery(recordDate));
    FoodWasteRecord? breakfast = ();
    FoodWasteRecord? lunch = ();

    check from FoodWasteRecord rec in resultStream
        do {
            if rec.mealType == "BREAKFAST" {
                breakfast = rec;
            } else if rec.mealType == "LUNCH" {
                lunch = rec;
            }
        };

    return {recordDate, breakfast, lunch};
}

# Update an existing food waste record.
#
# + id - Food waste record id
# + payload - Fields to update
# + updatedBy - Person who is updating
# + return - FoodWasteRecordNotFoundError or DuplicateFoodWasteRecordError or Error if update failed
public isolated function updateFoodWasteRecord(int id, UpdateFoodWasteRecordPayload payload, string updatedBy)
    returns FoodWasteRecordNotFoundError|DuplicateFoodWasteRecordError|error? {

    sql:ExecutionResult|error executionResult =
        databaseClient->execute(updateFoodWasteRecordQuery(id, payload, updatedBy));
    if executionResult is error {
        string errMsg = executionResult.message();
        if errMsg.includes("Duplicate entry") || errMsg.includes("uniq_food_waste_record_date_type") {
            return error DuplicateFoodWasteRecordError(
                "Food waste record already exists for the given date and meal type.");
        }
        return executionResult;
    }
    if executionResult.affectedRowCount < 1 {
        FoodWasteRecord|error? existing = fetchFoodWasteRecord(id);
        if existing is error {
            return existing;
        }
        if existing is () {
            return error FoodWasteRecordNotFoundError("Food waste record not found.");
        }
    }
}

# Delete an existing food waste record.
#
# + id - Food waste record id
# + return - FoodWasteRecordNotFoundError or Error if deletion failed
public isolated function deleteFoodWasteRecord(int id) returns FoodWasteRecordNotFoundError|error? {
    sql:ExecutionResult executionResult = check databaseClient->execute(deleteFoodWasteRecordQuery(id));
    if executionResult.affectedRowCount < 1 {
        return error FoodWasteRecordNotFoundError("Food waste record not found.");
    }
}

// --- Advertisement Functions ---

# Add a new advertisement.
#
# + payload - Advertisement data
# + createdBy - User creating the ad
# + return - Created ID or Error
public isolated function addAdvertisement(CreateAdvertisementPayload payload, string createdBy) returns int|error {
    sql:ExecutionResult result = check databaseClient->execute(addAdvertisementQuery(payload, createdBy));
    anydata lastInsertId = result.lastInsertId;
    if lastInsertId is int {
        return lastInsertId;
    }
    return error("Failed to retrieve last insert ID.");
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
# + return - Active Advertisement or () if none or Error
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
# + return - Advertisement or () if not found or Error
public isolated function getAdvertisementById(int id) returns Advertisement|error? {
    Advertisement|sql:Error result = databaseClient->queryRow(getAdvertisementByIdQuery(id));
    if result is sql:NoRowsError {
        return ();
    }
    return result;
}

# Activate an advertisement (DB trigger deactivates others).
#
# + id - Advertisement ID
# + return - AdvertisementNotFoundError or Error if failed
public isolated function activateAdvertisement(int id) returns AdvertisementNotFoundError|error? {
    sql:ExecutionResult result = check databaseClient->execute(activateAdvertisementQuery(id));
    if result.affectedRowCount == 0 {
        Advertisement|error? ad = getAdvertisementById(id);
        if ad is error {
            return ad;
        }
        if ad is () {
            return error AdvertisementNotFoundError("Advertisement not found.");
        }
    }
}

# Deactivate an advertisement.
#
# + id - Advertisement ID
# + return - AdvertisementNotFoundError or Error if failed
public isolated function deactivateAdvertisement(int id) returns AdvertisementNotFoundError|error? {
    sql:ExecutionResult result = check databaseClient->execute(deactivateAdvertisementQuery(id));
    if result.affectedRowCount == 0 {
        Advertisement|error? ad = getAdvertisementById(id);
        if ad is error {
            return ad;
        }
        if ad is () {
            return error AdvertisementNotFoundError("Advertisement not found.");
        }
    }
}

# Delete an advertisement (active-ad guard is in the operation layer).
#
# + id - Advertisement ID
# + return - AdvertisementNotFoundError or Error if failed
public isolated function deleteAdvertisement(int id) returns AdvertisementNotFoundError|error? {
    sql:ExecutionResult result = check databaseClient->execute(deleteAdvertisementQuery(id));
    if result.affectedRowCount == 0 {
        return error AdvertisementNotFoundError("Advertisement not found.");
    }
}

// --- Analytics Functions ---

# Get weekly food waste trend.
#
# + startDate - Start date (YYYY-MM-DD)
# + return - Weekly trend items or Error
public isolated function getWeeklyTrend(string startDate) returns WeeklyTrendItem[]|error {
    stream<WeeklyTrendItem, sql:Error?> resultStream = databaseClient->query(getWeeklyTrendQuery(startDate));
    return from WeeklyTrendItem item in resultStream
        select item;
}

# Get weekly food waste trend for a specific date range.
#
# + startDate - Start date (YYYY-MM-DD)
# + endDate - End date (YYYY-MM-DD)
# + return - Weekly trend items or Error
public isolated function getWeeklyTrendDateRange(string startDate, string endDate) returns WeeklyTrendItem[]|error {
    stream<WeeklyTrendItem, sql:Error?> resultStream = databaseClient->query(getWeeklyTrendRangeQuery(startDate, endDate));
    return from WeeklyTrendItem item in resultStream
        select item;
}

# Get monthly food waste trend.
#
# + startMonth - Start month (YYYY-MM)
# + endMonth - End month (YYYY-MM)
# + return - Monthly trend items or Error
public isolated function getMonthlyTrend(string startMonth, string endMonth) returns MonthlyTrendItem[]|error {
    stream<MonthlyTrendItem, sql:Error?> resultStream =
        databaseClient->query(getMonthlyTrendQuery(startMonth, endMonth));
    return from MonthlyTrendItem item in resultStream
        select item;
}

# Fetch total waste and plate count for a date range.
#
# + startDate - Start date (YYYY-MM-DD)
# + endDate - End date (YYYY-MM-DD)
# + return - Aggregated stats or Error
public isolated function fetchDateRangeSummaryStats(string startDate, string endDate)
    returns record {|decimal totalWasteKg; int totalPlates;|}|error {
    record {|decimal totalWasteKg; int totalPlates;|}|error result =
        databaseClient->queryRow(getDateRangeSummaryStatsQuery(startDate, endDate));
    if result is sql:NoRowsError {
        return {totalWasteKg: 0, totalPlates: 0};
    }
    return result;
}

# Fetch the highest waste day in a date range.
#
# + startDate - Start date (YYYY-MM-DD)
# + endDate - End date (YYYY-MM-DD)
# + return - Highest waste day or () if no data or Error
public isolated function fetchHighestWasteDay(string startDate, string endDate)
    returns record {|string recordDate; decimal dailyTotal;|}|error? {
    record {|string recordDate; decimal dailyTotal;|}|sql:Error result =
        databaseClient->queryRow(getHighestWasteDayQuery(startDate, endDate));
    if result is sql:NoRowsError {
        return ();
    }
    return result;
}
