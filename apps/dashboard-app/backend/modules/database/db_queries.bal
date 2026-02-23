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

// --- Food Waste Queries ---

# Build query to insert a food waste record.
#
# + payload - Food waste record to insert
# + createdBy - User creating the record
# + return - Parameterized insert query
isolated function addFoodWasteRecordQuery(AddFoodWasteRecordPayload payload, string createdBy)
    returns sql:ParameterizedQuery =>
`
    INSERT INTO sample_schema.food_waste_records
        (record_date, meal_type, total_waste_kg, plate_count, created_by, updated_by)
    VALUES
        (${payload.recordDate}, ${payload.mealType.toString()}, ${payload.totalWasteKg},
         ${payload.plateCount}, ${createdBy}, ${createdBy})
`;

# Build query to retrieve a food waste record by id.
#
# + id - Food waste record id
# + return - Parameterized select query
isolated function getFoodWasteRecordByIdQuery(int id) returns sql:ParameterizedQuery =>
`
    SELECT
        food_waste_record_id AS id,
        record_date          AS recordDate,
        meal_type            AS mealType,
        total_waste_kg       AS totalWasteKg,
        plate_count          AS plateCount,
        created_on           AS createdOn,
        created_by           AS createdBy,
        updated_on           AS updatedOn,
        updated_by           AS updatedBy
    FROM  sample_schema.food_waste_records
    WHERE food_waste_record_id = ${id}
`;

# Build query to retrieve all records for a given date.
#
# + recordDate - Target date (YYYY-MM-DD)
# + return - Parameterized select query
isolated function getFoodWasteRecordsByDateQuery(string recordDate) returns sql:ParameterizedQuery =>
`
    SELECT
        food_waste_record_id AS id,
        record_date          AS recordDate,
        meal_type            AS mealType,
        total_waste_kg       AS totalWasteKg,
        plate_count          AS plateCount,
        created_on           AS createdOn,
        created_by           AS createdBy,
        updated_on           AS updatedOn,
        updated_by           AS updatedBy
    FROM  sample_schema.food_waste_records
    WHERE record_date = ${recordDate}
`;

# Build paginated query to list food waste records with optional filters.
#
# + filters - Pagination and filter options
# + return - Parameterized select query
isolated function getFoodWasteRecordsQuery(FoodWasteRecordFilters filters) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery baseQuery =
`
    SELECT
        food_waste_record_id AS id,
        record_date          AS recordDate,
        meal_type            AS mealType,
        total_waste_kg       AS totalWasteKg,
        plate_count          AS plateCount,
        created_on           AS createdOn,
        created_by           AS createdBy,
        updated_on           AS updatedOn,
        updated_by           AS updatedBy,
        COUNT(*) OVER ()     AS totalCount
    FROM  sample_schema.food_waste_records
    WHERE 1=1
`;
    if filters.startDate is string {
        baseQuery = sql:queryConcat(baseQuery, ` AND record_date >= ${filters.startDate}`);
    }
    if filters.endDate is string {
        baseQuery = sql:queryConcat(baseQuery, ` AND record_date <= ${filters.endDate}`);
    }
    if filters.mealType is string {
        baseQuery = sql:queryConcat(baseQuery, ` AND meal_type = ${filters.mealType}`);
    }
    return sql:queryConcat(baseQuery,
        ` ORDER BY record_date DESC LIMIT ${filters.'limit} OFFSET ${filters.offset}`);
}

# Build query to update a food waste record.
#
# + id - Record id
# + payload - Fields to update
# + updatedBy - User performing the update
# + return - Parameterized update query
isolated function updateFoodWasteRecordQuery(int id, UpdateFoodWasteRecordPayload payload, string updatedBy)
    returns sql:ParameterizedQuery {
    sql:ParameterizedQuery baseQuery = `UPDATE sample_schema.food_waste_records SET updated_by = ${updatedBy}`;
    if payload.totalWasteKg is decimal {
        baseQuery = sql:queryConcat(baseQuery, `, total_waste_kg = ${payload.totalWasteKg}`);
    }
    if payload.plateCount is int {
        baseQuery = sql:queryConcat(baseQuery, `, plate_count = ${payload.plateCount}`);
    }
    return sql:queryConcat(baseQuery, ` WHERE food_waste_record_id = ${id}`);
}

# Build query to delete a food waste record by id.
#
# + id - Food waste record id
# + return - Parameterized delete query
isolated function deleteFoodWasteRecordQuery(int id) returns sql:ParameterizedQuery =>
    `DELETE FROM sample_schema.food_waste_records WHERE food_waste_record_id = ${id}`;

// --- Advertisement Queries ---

# Build query to insert an advertisement.
#
# + payload - Advertisement payload
# + createdBy - User creating the ad
# + return - Parameterized insert query
isolated function addAdvertisementQuery(CreateAdvertisementPayload payload, string createdBy)
    returns sql:ParameterizedQuery =>
`
    INSERT INTO sample_schema.advertisements
        (media_url, media_type, duration_seconds, thumbnail_url, created_by, updated_by)
    VALUES
        (${payload.mediaUrl}, ${payload.mediaType.toString()}, ${payload.durationSeconds},
         ${payload.thumbnailUrl}, ${createdBy}, ${createdBy})
`;

# Build query to retrieve all advertisements.
#
# + return - Parameterized select query
isolated function getAdvertisementsQuery() returns sql:ParameterizedQuery =>
`
    SELECT
        advertisement_id AS id,
        media_url        AS mediaUrl,
        media_type       AS mediaType,
        duration_seconds AS durationSeconds,
        thumbnail_url    AS thumbnailUrl,
        is_active        AS isActive,
        display_order    AS displayOrder,
        uploaded_date    AS uploadedDate,
        created_on       AS createdOn,
        created_by       AS createdBy,
        updated_on       AS updatedOn
    FROM  sample_schema.advertisements
    ORDER BY display_order ASC
`;

# Build query to retrieve the currently active advertisement.
#
# + return - Parameterized select query
isolated function getActiveAdvertisementQuery() returns sql:ParameterizedQuery =>
`
    SELECT
        advertisement_id AS id,
        media_url        AS mediaUrl,
        media_type       AS mediaType,
        duration_seconds AS durationSeconds,
        thumbnail_url    AS thumbnailUrl,
        is_active        AS isActive,
        display_order    AS displayOrder,
        uploaded_date    AS uploadedDate,
        created_on       AS createdOn,
        created_by       AS createdBy,
        updated_on       AS updatedOn
    FROM  sample_schema.advertisements
    WHERE is_active = TRUE
    LIMIT 1
`;

# Build query to retrieve an advertisement by id.
#
# + id - Advertisement id
# + return - Parameterized select query
isolated function getAdvertisementByIdQuery(int id) returns sql:ParameterizedQuery =>
`
    SELECT
        advertisement_id AS id,
        media_url        AS mediaUrl,
        media_type       AS mediaType,
        duration_seconds AS durationSeconds,
        thumbnail_url    AS thumbnailUrl,
        is_active        AS isActive,
        display_order    AS displayOrder,
        uploaded_date    AS uploadedDate,
        created_on       AS createdOn,
        created_by       AS createdBy,
        updated_on       AS updatedOn
    FROM  sample_schema.advertisements
    WHERE advertisement_id = ${id}
`;

# Build query to activate an advertisement.
#
# + id - Advertisement id
# + return - Parameterized update query
isolated function activateAdvertisementQuery(int id) returns sql:ParameterizedQuery =>
    `UPDATE sample_schema.advertisements SET is_active = TRUE WHERE advertisement_id = ${id}`;

# Build query to delete an advertisement.
#
# + id - Advertisement id
# + return - Parameterized delete query
isolated function deleteAdvertisementQuery(int id) returns sql:ParameterizedQuery =>
    `DELETE FROM sample_schema.advertisements WHERE advertisement_id = ${id}`;

// --- Analytics Queries ---

# Build query to retrieve weekly trend data.
#
# + startDate - Start date (YYYY-MM-DD)
# + return - Parameterized select query
isolated function getWeeklyTrendQuery(string startDate) returns sql:ParameterizedQuery =>
`
    SELECT
        record_date AS date,
        SUM(CASE WHEN meal_type = 'BREAKFAST' THEN total_waste_kg ELSE 0 END) AS breakfastWaste,
        SUM(CASE WHEN meal_type = 'LUNCH'     THEN total_waste_kg ELSE 0 END) AS lunchWaste
    FROM  sample_schema.food_waste_records
    WHERE record_date >= ${startDate}
    GROUP BY record_date
    ORDER BY record_date ASC
`;

# Build query to retrieve monthly trend data.
#
# + startMonth - Start month (YYYY-MM)
# + endMonth - End month (YYYY-MM)
# + return - Parameterized select query
isolated function getMonthlyTrendQuery(string startMonth, string endMonth) returns sql:ParameterizedQuery =>
`
    SELECT
        DATE_FORMAT(record_date, '%Y-%m') AS month,
        SUM(CASE WHEN meal_type = 'BREAKFAST' THEN total_waste_kg ELSE 0 END) AS breakfastWaste,
        SUM(CASE WHEN meal_type = 'LUNCH'     THEN total_waste_kg ELSE 0 END) AS lunchWaste
    FROM  sample_schema.food_waste_records
    WHERE DATE_FORMAT(record_date, '%Y-%m') BETWEEN ${startMonth} AND ${endMonth}
    GROUP BY DATE_FORMAT(record_date, '%Y-%m')
    ORDER BY month ASC
`;

# Build query to retrieve total waste and plate count for a date range.
#
# + startDate - Start date (YYYY-MM-DD)
# + endDate - End date (YYYY-MM-DD)
# + return - Parameterized select query
isolated function getDateRangeSummaryStatsQuery(string startDate, string endDate)
    returns sql:ParameterizedQuery =>
`
    SELECT
        COALESCE(SUM(total_waste_kg), 0) AS totalWasteKg,
        COALESCE(SUM(plate_count), 0)    AS totalPlates
    FROM  sample_schema.food_waste_records
    WHERE record_date BETWEEN ${startDate} AND ${endDate}
`;

# Build query to find the highest-waste day in a date range.
#
# + startDate - Start date (YYYY-MM-DD)
# + endDate - End date (YYYY-MM-DD)
# + return - Parameterized select query
isolated function getHighestWasteDayQuery(string startDate, string endDate)
    returns sql:ParameterizedQuery =>
`
    SELECT
        record_date         AS recordDate,
        SUM(total_waste_kg) AS dailyTotal
    FROM  sample_schema.food_waste_records
    WHERE record_date BETWEEN ${startDate} AND ${endDate}
    GROUP BY record_date
    ORDER BY dailyTotal DESC
    LIMIT 1
`;
