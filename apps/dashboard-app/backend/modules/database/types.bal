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
import ballerinax/mysql;

# [Configurable] Database configs.
type DatabaseConfig record {|
    # Database user
    string user;
    # Database password
    string password;
    # Database name
    string database;
    # Database host
    string host;
    # Database port
    int port;
    # MySQL connection options
    mysql:Options options?;
    # Connection pool config
    sql:ConnectionPool connectionPool?;
|};

# Common audit fields shared by all database records.
public type AuditFields record {|
    # User who created the record
    string createdBy;
    # Timestamp when the record was created
    string createdOn;
    # User who last updated the record
    string updatedBy;
    # Timestamp when the record was last updated
    string updatedOn;
|};

# A single food waste record.
public type FoodWasteRecord record {|
    # Unique id of the food waste record
    int id;
    # Date of the record (YYYY-MM-DD)
    string recordDate;
    # Meal type (BREAKFAST|LUNCH)
    string mealType;
    # Total waste (kg)
    decimal totalWasteKg;
    # Plate count
    int plateCount;
    *AuditFields;
|};

# DB row type for paginated listing (includes totalCount window value).
type FoodWasteRecordListRow record {|
    *FoodWasteRecord;
    # Total number of records for the applied filters
    int totalCount;
|};

# Payload for creating a food waste record.
public type AddFoodWasteRecordPayload record {|
    # Record date (YYYY-MM-DD)
    string recordDate;
    # Meal type
    MealType mealType;
    # Total waste (kg)
    decimal totalWasteKg;
    # Plate count
    int plateCount;
|};

# Payload for updating a food waste record.
public type UpdateFoodWasteRecordPayload record {|
    # Total waste (kg)
    decimal? totalWasteKg = ();
    # Plate count
    int? plateCount = ();
|};

# Filters for listing food waste records.
public type FoodWasteRecordFilters record {|
    # Start date (YYYY-MM-DD)
    string? startDate = ();
    # End date (YYYY-MM-DD)
    string? endDate = ();
    # Meal type filter (BREAKFAST|LUNCH)
    string? mealType = ();
    # SQL LIMIT
    int 'limit;
    # SQL OFFSET
    int offset;
|};

# Paginated response for listing food waste records.
public type PaginatedFoodWasteRecords record {|
    # Total number of records for the applied filters
    int totalCount;
    # Current page (1-based)
    int page;
    # Page size
    int pageSize;
    # Records for the page
    FoodWasteRecord[] records;
|};

# Daily response: breakfast + lunch for a given date.
public type DailyFoodWasteRecords record {|
    # Record date (YYYY-MM-DD)
    string recordDate;
    # Breakfast record (if exists)
    FoodWasteRecord? breakfast = ();
    # Lunch record (if exists)
    FoodWasteRecord? lunch = ();
|};

# Duplicate key error for (recordDate, mealType).
public type DuplicateFoodWasteRecordError distinct error;

# Not-found error for food waste record operations.
public type FoodWasteRecordNotFoundError distinct error;

# Advertisement record.
public type Advertisement record {|
    # Unique id
    int id;
    # Media URL
    string mediaUrl;
    # Media type
    string mediaType;
    # Duration in seconds
    int durationSeconds;
    # Thumbnail URL
    string? thumbnailUrl;
    # Whether this advertisement is currently active
    boolean isActive;
    # Display order
    int displayOrder;
    # Date uploaded
    string uploadedDate;
    # Created timestamp
    string createdOn;
    # Created by
    string? createdBy;
    # Updated timestamp
    string updatedOn;
|};

# Payload for creating an advertisement.
public type CreateAdvertisementPayload record {|
    # Media URL
    string mediaUrl;
    # Media type
    MediaType mediaType;
    # Duration in seconds
    int durationSeconds;
    # Thumbnail URL
    string? thumbnailUrl;
|};

# Not-found error for advertisement operations.
public type AdvertisementNotFoundError distinct error;

# Error raised when attempting to delete an active advertisement.
public type ActiveAdvertisementError distinct error;

# Weekly Trend Item.
public type WeeklyTrendItem record {|
    # Date
    string date;
    # Breakfast waste (kg)
    decimal breakfastWaste;
    # Lunch waste (kg)
    decimal lunchWaste;
|};

# Monthly Trend Item.
public type MonthlyTrendItem record {|
    # Month (YYYY-MM)
    string month;
    # Breakfast waste (kg)
    decimal breakfastWaste;
    # Lunch waste (kg)
    decimal lunchWaste;
|};

# Date range summary.
public type DateRangeSummary record {|
    # Start date
    string startDate;
    # End date
    string endDate;
    # Total waste (kg)
    decimal totalWasteKg;
    # Total plates
    int totalPlates;
    # Average waste per plate (g)
    decimal averageWastePerPlateGrams;
    # Highest single-day waste (kg)
    decimal highestWasteDayKg;
    # Date of highest single-day waste
    string highestWasteDate;
|};

# Today's KPI dashboard data.
public type TodayKPIs record {|
    # Date
    string date;
    # Breakfast data
    FoodWasteRecord? breakfast;
    # Lunch data
    FoodWasteRecord? lunch;
    # Total daily waste (kg)
    decimal totalDailyWasteKg;
    # Total daily plates
    int totalDailyPlates;
    # Average waste per plate (g)
    decimal averageWastePerPlateGrams;
|};
