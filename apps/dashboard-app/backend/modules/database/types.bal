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
import ballerina/constraint;
import ballerina/sql;
import ballerinax/mysql;

# [Configurable] database configs.
type DatabaseConfig record {|
    # Database User 
    string user;
    # Database Password
    string password;
    # Database Name
    string database;
    # Database Host
    string host;
    # Database port
    int port;
    # Database connection pool
    sql:ConnectionPool connectionPool;
|};

# Database config record.
type DatabaseClientConfig record {|
    *DatabaseConfig;
    # Additional configurations related to the MySQL database connection
    mysql:Options? options;
|};

# Breakfast/lunch type.
public enum MealType {
    BREAKFAST,
    LUNCH
}

# A single food waste record.
public type FoodWasteRecord record {|
    # Unique id of the food waste record
    int id;
    # Date of the record (YYYY-MM-DD)
    string record_date;
    # Meal type (BREAKFAST|LUNCH)
    string meal_type;
    # Total waste (kg)
    decimal total_waste_kg;
    # Plate count
    int plate_count;
    # Timestamp when created
    string created_on;
    # User who created the record
    string created_by;
    # Timestamp when updated
    string updated_on;
    # User who updated the record
    string updated_by;
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
    @constraint:String {
        pattern: {
            value: DATE_REGEX,
            message: "record_date must be a valid date string (YYYY-MM-DD)."
        }
    }
    string record_date;
    # Meal type
    MealType meal_type;
    # Total waste (kg)
    decimal total_waste_kg;
    # Plate count
    int plate_count;
|};

# Payload for updating a food waste record.
public type UpdateFoodWasteRecordPayload record {|
    # Total waste (kg)
    decimal? total_waste_kg = ();
    # Plate count
    int? plate_count = ();
|};

# Filters for listing food waste records.
public type FoodWasteRecordFilters record {|
    # Start date (YYYY-MM-DD)
    string? start_date = ();
    # End date (YYYY-MM-DD)
    string? end_date = ();
    # Meal type filter (BREAKFAST|LUNCH)
    string? meal_type = ();
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
    string record_date;
    # Breakfast record (if exists)
    FoodWasteRecord? breakfast = ();
    # Lunch record (if exists)
    FoodWasteRecord? lunch = ();
|};

# Duplicate key error for (record_date, meal_type).
public type DuplicateFoodWasteRecordError distinct error;

# Not-found error for operations by id.
public type FoodWasteRecordNotFoundError distinct error;

# Media types for advertisements.
public enum MediaType {
    VIDEO_MP4 = "video/mp4",
    VIDEO_WEBM = "video/webm",
    IMAGE_JPEG = "image/jpeg",
    IMAGE_PNG = "image/png",
    IMAGE_GIF = "image/gif"
}

# Advertisement record.
public type Advertisement record {|
    # Unique id
    int id;
    # Media URL
    string media_url;
    # Media Type
    string media_type;
    # Duration in seconds
    int duration_seconds;
    # Thumbnail URL
    string? thumbnail_url;
    # Is active status
    boolean is_active;
    # Display order
    int display_order;
    # Date uploaded
    string uploaded_date;
    # Created timestamp
    string created_on;
    # Created by
    string? created_by;
    # Updated timestamp
    string updated_on;
|};

# Payload for creating an advertisement.
public type CreateAdvertisementPayload record {|
    # Media URL
    string media_url;
    # Media Type
    MediaType media_type;
    # Duration in seconds
    int duration_seconds;
    # Thumbnail URL
    string? thumbnail_url;
|};

# Daily Summary for Analytics.
public type DailySummary record {|
    # Date
    string date;
    # Total Waste (kg)
    decimal total_daily_waste_kg;
    # Total Plates
    int total_daily_plates;
    # Average Waste per Plate (g)
    decimal average_waste_per_plate_grams;
|};

# Weekly Trend Item.
public type WeeklyTrendItem record {|
    # Date
    string date;
    # Breakfast Waste (kg)
    decimal breakfast_waste;
    # Lunch Waste (kg)
    decimal lunch_waste;
|};

# Monthly Trend Item.
public type MonthlyTrendItem record {|
    # Month (YYYY-MM)
    string month;
    # Breakfast Waste (kg)
    decimal breakfast_waste;
    # Lunch Waste (kg)
    decimal lunch_waste;
|};

# Date Range Summary.
public type DateRangeSummary record {|
    # Start Date
    string start_date;
    # End Date
    string end_date;
    # Total Waste (kg)
    decimal total_waste_kg;
    # Total Plates
    int total_plates;
    # Average Waste per Plate (g)
    decimal average_waste_per_plate_grams;
    # Highest Waste Day (kg)
    decimal highest_waste_day_kg;
    # Highest Waste Date
    string highest_waste_date;
|};

# Today's KPI Dashboard Data.
public type TodayKPIs record {|
    # Date
    string date;
    # Breakfast data
    FoodWasteRecord? breakfast;
    # Lunch data
    FoodWasteRecord? lunch;
    # Total Daily Waste (kg)
    decimal total_daily_waste_kg;
    # Total Daily Plates
    int total_daily_plates;
    # Average Waste per Plate (g)
    decimal average_waste_per_plate_grams;
|};

