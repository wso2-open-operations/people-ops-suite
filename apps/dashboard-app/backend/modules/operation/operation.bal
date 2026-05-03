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

import dashboard_app_backend.database;

import ballerina/time;

// --- Utility ---

# Calculate average waste per plate in grams.
#
# + totalWasteKg - Total waste in kilograms
# + totalPlates - Total number of plates
# + return - Average waste per plate in grams
public isolated function calculateAverageWastePerPlateGrams(decimal totalWasteKg, int totalPlates) returns decimal {
    if totalPlates <= 0 {
        return 0.0d;
    }
    return (totalWasteKg * 1000.0d) / <decimal>totalPlates;
}

# Calculate total waste/plates and average for a day.
#
# + breakfastWasteKg - Breakfast waste in kilograms
# + breakfastPlateCount - Breakfast plate count
# + lunchWasteKg - Lunch waste in kilograms
# + lunchPlateCount - Lunch plate count
# + return - Daily totals and average
public isolated function calculateDailySummary(decimal? breakfastWasteKg, int? breakfastPlateCount,
        decimal? lunchWasteKg, int? lunchPlateCount) returns DailySummary {

    decimal totalWasteKg = (breakfastWasteKg ?: 0.0d) + (lunchWasteKg ?: 0.0d);
    int totalPlates = (breakfastPlateCount ?: 0) + (lunchPlateCount ?: 0);
    decimal avg = calculateAverageWastePerPlateGrams(totalWasteKg, totalPlates);

    return {totalDailyWasteKg: totalWasteKg, totalDailyPlates: totalPlates, averageWastePerPlateGrams: avg};
}

// --- Business Logic ---

# Build date-range summary from database data.
#
# + startDate - Start date (YYYY-MM-DD)
# + endDate - End date (YYYY-MM-DD)
# + return - Date range summary or Error
public isolated function getDateRangeSummary(string startDate, string endDate) returns database:DateRangeSummary|error {
    record {|decimal totalWasteKg; int totalPlates;|} stats =
        check database:fetchDateRangeSummaryStats(startDate, endDate);

    record {|string recordDate; decimal dailyTotal;|}|error? highest =
        database:fetchHighestWasteDay(startDate, endDate);
    if highest is error {
        return highest;
    }

    decimal avg = calculateAverageWastePerPlateGrams(stats.totalWasteKg, stats.totalPlates);

    return {
        startDate,
        endDate,
        totalWasteKg: stats.totalWasteKg,
        totalPlates: stats.totalPlates,
        averageWastePerPlateGrams: avg,
        highestWasteDayKg: highest?.dailyTotal ?: 0.0d,
        highestWasteDate: highest?.recordDate ?: ""
    };
}

# Build KPI summary for a given date from database records.
#
# + date - Date (YYYY-MM-DD)
# + return - KPI summary or Error
public isolated function getTodayKpis(string date) returns database:TodayKPIs|error {
    database:DailyFoodWasteRecords daily = check database:fetchDailyFoodWasteRecords(date);

    database:FoodWasteRecord? breakfast = daily.breakfast;
    database:FoodWasteRecord? lunch = daily.lunch;

    decimal? breakfastWasteKg = breakfast?.totalWasteKg;
    int? breakfastPlateCount = breakfast?.plateCount;
    decimal? lunchWasteKg = lunch?.totalWasteKg;
    int? lunchPlateCount = lunch?.plateCount;

    var summary = calculateDailySummary(breakfastWasteKg, breakfastPlateCount, lunchWasteKg, lunchPlateCount);

    return {
        date,
        breakfast,
        lunch,
        totalDailyWasteKg: summary.totalDailyWasteKg,
        totalDailyPlates: summary.totalDailyPlates,
        averageWastePerPlateGrams: summary.averageWastePerPlateGrams
    };
}

# Update a food waste record and return the refreshed record.
#
# + id - Food waste record id
# + payload - Fields to update
# + updatedBy - Person who is updating
# + return - Updated FoodWasteRecord or FoodWasteRecordNotFoundError or DuplicateFoodWasteRecordError or Error
public isolated function updateFoodWasteRecord(int id, database:UpdateFoodWasteRecordPayload payload,
        string updatedBy)
        returns database:FoodWasteRecord|database:FoodWasteRecordNotFoundError|database:DuplicateFoodWasteRecordError|error {

    database:FoodWasteRecordNotFoundError|database:DuplicateFoodWasteRecordError|error? result =
        database:updateFoodWasteRecord(id, payload, updatedBy);
    if result is database:FoodWasteRecordNotFoundError {
        return result;
    }
    if result is database:DuplicateFoodWasteRecordError {
        return result;
    }
    if result is error {
        return result;
    }

    database:FoodWasteRecord|error? updated = database:fetchFoodWasteRecord(id);
    if updated is error {
        return updated;
    }
    if updated is () {
        return error database:FoodWasteRecordNotFoundError("Food waste record not found after update.");
    }
    return updated;
}

# Delete an advertisement after validating it is not currently active.
#
# + id - Advertisement ID
# + return - ActiveAdvertisementError or AdvertisementNotFoundError or Error if failed
public isolated function deleteAdvertisement(int id)
    returns database:ActiveAdvertisementError|database:AdvertisementNotFoundError|error? {

    database:Advertisement|error? ad = database:getAdvertisementById(id);
    if ad is error {
        return ad;
    }
    if ad is () {
        return error database:AdvertisementNotFoundError("Advertisement not found.");
    }
    if ad.isActive {
        return error database:ActiveAdvertisementError(
            "Cannot delete an active advertisement. Deactivate it first.");
    }
    return database:deleteAdvertisement(id);
}

# Get weekly food waste trend from endDate going back to startDate.
#
# + startDate - Start date (YYYY-MM-DD)
# + endDate - End date (YYYY-MM-DD)
# + return - Weekly trend items or Error
public isolated function getWeeklyTrendData(string startDate, string endDate) returns database:WeeklyTrendItem[]|error {
    return database:getWeeklyTrendDateRange(startDate, endDate);
}

# Get weekly food waste trend for the current date going back 7 days.
#
# + return - Weekly trend items or Error
public isolated function getWeeklyTrendDataDefault() returns database:WeeklyTrendItem[]|error {
    time:Utc now = time:utcNow();
    time:Utc weekAgo = time:utcAddSeconds(now, -7 * 24 * 60 * 60);
    string endDate = string:substring(time:utcToString(now), 0, 10);
    string startDate = string:substring(time:utcToString(weekAgo), 0, 10);
    return database:getWeeklyTrendDateRange(startDate, endDate);
}

# Get monthly food waste trend for the current calendar month.
#
# + return - Monthly trend items or Error
public isolated function getMonthlyTrendData() returns database:MonthlyTrendItem[]|error {
    string date = string:substring(time:utcToString(time:utcNow()), 0, 10);
    string currentMonth = string:substring(date, 0, 7);
    return database:getMonthlyTrend(currentMonth, currentMonth);
}

# Get food waste trend by month for the current calendar year.
#
# + return - Monthly trend items or Error
public isolated function getYearlyTrendData() returns database:MonthlyTrendItem[]|error {
    string date = string:substring(time:utcToString(time:utcNow()), 0, 10);
    string currentYear = string:substring(date, 0, 4);
    return database:getMonthlyTrend(currentYear + "-01", currentYear + "-12");
}
