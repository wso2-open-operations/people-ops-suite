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

# Build query to insert a meal record.
#
# + payload - Meal record to be added
# + createdBy - The user who is adding the record
# + return - sql:ParameterizedQuery - Insert query for the meal_records table
isolated function addMealRecordQuery(AddMealRecordPayload payload, string createdBy) returns sql:ParameterizedQuery =>
`
    INSERT INTO sample_schema.meal_records
    (
        record_date,
        meal_type,
        total_waste_kg,
        plate_count,
        created_by,
        updated_by
    )
    VALUES
    (
        ${payload.record_date},
        ${payload.meal_type.toString()},
        ${payload.total_waste_kg},
        ${payload.plate_count},
        ${createdBy},
        ${createdBy}
    )
`;

# Build query to retrieve a meal record by id.
#
# + id - Meal record id
# + return - sql:ParameterizedQuery - Select query for meal_records
isolated function getMealRecordByIdQuery(int id) returns sql:ParameterizedQuery =>
`
    SELECT
        meal_record_id AS 'id',
        record_date AS 'record_date',
        meal_type AS 'meal_type',
        total_waste_kg AS 'total_waste_kg',
        plate_count AS 'plate_count',
        created_on AS 'created_on',
        created_by AS 'created_by',
        updated_on AS 'updated_on',
        updated_by AS 'updated_by'
    FROM
        sample_schema.meal_records
    WHERE
        meal_record_id = ${id}
`;

# Build query to retrieve meal records for a given date (breakfast/lunch).
#
# + recordDate - Date (YYYY-MM-DD)
# + return - sql:ParameterizedQuery - Select query for meal_records by date
isolated function getMealRecordsByDateQuery(string recordDate) returns sql:ParameterizedQuery =>
`
    SELECT
        meal_record_id AS 'id',
        record_date AS 'record_date',
        meal_type AS 'meal_type',
        total_waste_kg AS 'total_waste_kg',
        plate_count AS 'plate_count',
        created_on AS 'created_on',
        created_by AS 'created_by',
        updated_on AS 'updated_on',
        updated_by AS 'updated_by'
    FROM
        sample_schema.meal_records
    WHERE
        record_date = ${recordDate}
        AND meal_type IN ('BREAKFAST', 'LUNCH')
    ORDER BY
        meal_type ASC
`;

# Build query to retrieve meal records with filters (paginated).
#
# + filters - Filters for listing
# + return - sql:ParameterizedQuery - Select query for meal_records list
isolated function getMealRecordsQuery(MealRecordFilters filters) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery mainQuery = `
        SELECT
            meal_record_id AS 'id',
            record_date AS 'record_date',
            meal_type AS 'meal_type',
            total_waste_kg AS 'total_waste_kg',
            plate_count AS 'plate_count',
            created_on AS 'created_on',
            created_by AS 'created_by',
            updated_on AS 'updated_on',
            updated_by AS 'updated_by',
            COUNT(*) OVER() AS 'totalCount'
        FROM
            sample_schema.meal_records
    `;

    sql:ParameterizedQuery[] whereFilters = [];

    if filters.start_date is string {
        whereFilters.push(`record_date >= ${filters.start_date}`);
    }
    if filters.end_date is string {
        whereFilters.push(`record_date <= ${filters.end_date}`);
    }
    if filters.meal_type is string {
        whereFilters.push(`meal_type = ${filters.meal_type}`);
    }

    mainQuery = buildSqlSelectQuery(mainQuery, whereFilters);
    mainQuery = sql:queryConcat(mainQuery, ` ORDER BY record_date DESC, meal_type ASC`);
    mainQuery = sql:queryConcat(mainQuery, ` LIMIT ${filters.'limit} OFFSET ${filters.offset}`);

    return mainQuery;
}

# Build query to update a meal record.
#
# + id - Meal record id
# + payload - Update payload
# + updatedBy - user performing update
# + return - sql:ParameterizedQuery - Update query
isolated function updateMealRecordQuery(int id, UpdateMealRecordPayload payload, string updatedBy)
    returns sql:ParameterizedQuery {

    sql:ParameterizedQuery mainQuery = `UPDATE sample_schema.meal_records SET `;
    sql:ParameterizedQuery[] updateFilters = [];

    if payload.total_waste_kg is decimal {
        updateFilters.push(`total_waste_kg = ${payload.total_waste_kg}`);
    }
    if payload.plate_count is int {
        updateFilters.push(`plate_count = ${payload.plate_count}`);
    }

    // Always update audit fields.
    updateFilters.push(`updated_by = ${updatedBy}`);

    mainQuery = buildSqlUpdateQuery(mainQuery, updateFilters);
    return sql:queryConcat(mainQuery, ` WHERE meal_record_id = ${id}`);
}

# Build query to delete a meal record.
#
# + id - Meal record id
# + return - sql:ParameterizedQuery - Delete query
isolated function deleteMealRecordQuery(int id) returns sql:ParameterizedQuery =>
`
    DELETE FROM sample_schema.meal_records
    WHERE meal_record_id = ${id}
`;

// --- Advertisement Queries ---

# Query to add a new advertisement.
#
# + payload - Advertisement payload
# + createdBy - User creating the ad
# + return - Parameterized query
isolated function addAdvertisementQuery(CreateAdvertisementPayload payload, string createdBy) returns sql:ParameterizedQuery {
    return `
        INSERT INTO advertisements (
            media_url, media_type, duration_seconds, thumbnail_url, 
            is_active, display_order, uploaded_date, created_by
        ) VALUES (
            ${payload.media_url}, ${payload.media_type}, ${payload.duration_seconds}, ${payload.thumbnail_url},
            FALSE, 0, CURRENT_DATE(), ${createdBy}
        )
    `;
}

# Query to fetch all advertisements.
#
# + return - Parameterized query
isolated function getAdvertisementsQuery() returns sql:ParameterizedQuery {
    return `SELECT * FROM advertisements ORDER BY created_on DESC`;
}

# Query to fetch the active advertisement.
#
# + return - Parameterized query
isolated function getActiveAdvertisementQuery() returns sql:ParameterizedQuery {
    return `SELECT * FROM advertisements WHERE is_active = TRUE LIMIT 1`;
}

# Query to fetch advertisement by ID.
#
# + id - Advertisement ID
# + return - Parameterized query
isolated function getAdvertisementByIdQuery(int id) returns sql:ParameterizedQuery {
    return `SELECT * FROM advertisements WHERE id = ${id}`;
}

# Query to activate an advertisement.
#
# + id - Advertisement ID
# + return - Parameterized query
isolated function activateAdvertisementQuery(int id) returns sql:ParameterizedQuery {
    return `UPDATE advertisements SET is_active = TRUE WHERE id = ${id}`;
}

# Query to delete an advertisement.
#
# + id - Advertisement ID
# + return - Parameterized query
isolated function deleteAdvertisementQuery(int id) returns sql:ParameterizedQuery {
    return `DELETE FROM advertisements WHERE id = ${id}`;
}

// --- Analytics Queries ---

# Query to get data for a specific date range.
#
# + startDate - The start date for the query range
# + endDate - The end date for the query range
# + return - The parameterized SQL query
isolated function getMealRecordsByDateRangeQuery(string startDate, string endDate) returns sql:ParameterizedQuery {
    return `SELECT * FROM meal_records WHERE record_date >= ${startDate} AND record_date <= ${endDate}`;
}

# Query to get weekly trend (7 days up to end date).
#
# + startDate - The start date for the query range
# + return - The parameterized SQL query
isolated function getWeeklyTrendQuery(string startDate) returns sql:ParameterizedQuery {
    // Assuming 7 days from start date
    return `
        SELECT 
            record_date as date,
            SUM(CASE WHEN meal_type = 'BREAKFAST' THEN total_waste_kg ELSE 0 END) as breakfast_waste,
            SUM(CASE WHEN meal_type = 'LUNCH' THEN total_waste_kg ELSE 0 END) as lunch_waste
        FROM meal_records
        WHERE record_date >= ${startDate} AND record_date < DATE_ADD(${startDate}, INTERVAL 7 DAY)
        GROUP BY record_date
        ORDER BY record_date ASC
    `;
}

# Query to get monthly trend.
#
# + startMonth - The start month for the query range
# + endMonth - The end month for the query range
# + return - The parameterized SQL query
isolated function getMonthlyTrendQuery(string startMonth, string endMonth) returns sql:ParameterizedQuery {
    return `
        SELECT 
            DATE_FORMAT(record_date, '%Y-%m') as month,
            SUM(CASE WHEN meal_type = 'BREAKFAST' THEN total_waste_kg ELSE 0 END) as breakfast_waste,
            SUM(CASE WHEN meal_type = 'LUNCH' THEN total_waste_kg ELSE 0 END) as lunch_waste
        FROM meal_records
        WHERE DATE_FORMAT(record_date, '%Y-%m') >= ${startMonth} AND DATE_FORMAT(record_date, '%Y-%m') <= ${endMonth}
        GROUP BY month
        ORDER BY month ASC
    `;
}

# Query to get summary stats for a date range.
#
# + startDate - The start date for the query range
# + endDate - The end date for the query range
# + return - The parameterized SQL query
isolated function getDateRangeSummaryStatsQuery(string startDate, string endDate) returns sql:ParameterizedQuery {
    return `
        SELECT 
            COALESCE(SUM(total_waste_kg), 0) as total_waste_kg,
            COALESCE(SUM(plate_count), 0) as total_plates
        FROM meal_records
        WHERE record_date >= ${startDate} AND record_date <= ${endDate}
    `;
}

# Query to get the highest waste day in a date range.
#
# + startDate - The start date for the query range
# + endDate - The end date for the query range
# + return - The parameterized SQL query
isolated function getHighestWasteDayQuery(string startDate, string endDate) returns sql:ParameterizedQuery {
    return `
        SELECT record_date, SUM(total_waste_kg) as daily_total
        FROM meal_records
        WHERE record_date >= ${startDate} AND record_date <= ${endDate}
        GROUP BY record_date
        ORDER BY daily_total DESC
        LIMIT 1
    `;
}
