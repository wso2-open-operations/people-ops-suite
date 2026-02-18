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
