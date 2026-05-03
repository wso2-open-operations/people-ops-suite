-- Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).

-- WSO2 LLC. licenses this file to you under the Apache License,
-- Version 2.0 (the "License"); you may not use this file except
-- in compliance with the License.
-- You may obtain a copy of the License at

-- http://www.apache.org/licenses/LICENSE-2.0

-- Unless required by applicable law or agreed to in writing,
-- software distributed under the License is distributed on an
-- "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
-- KIND, either express or implied.  See the License for the
-- specific language governing permissions and limitations
-- under the License.

CREATE DATABASE IF NOT EXISTS dashboard_app_db;
USE dashboard_app_db;

CREATE TABLE IF NOT EXISTS `food_waste_records` (
    `food_waste_record_id` int NOT NULL AUTO_INCREMENT,
  `record_date` date NOT NULL,
  `meal_type` varchar(20) NOT NULL,
  `total_waste_kg` decimal(10,2) NOT NULL,
  `plate_count` int NOT NULL,
  `created_on` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `created_by` varchar(100) NOT NULL,
  `updated_on` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `updated_by` varchar(100) NOT NULL,
    PRIMARY KEY (`food_waste_record_id`),
    UNIQUE KEY `uniq_food_waste_record_date_type` (`record_date`,`meal_type`),
    KEY `idx_food_waste_record_date` (`record_date`),
    KEY `idx_food_waste_record_meal_type` (`meal_type`)
);

-- Table: advertisements
CREATE TABLE IF NOT EXISTS advertisements (
    advertisement_id INT AUTO_INCREMENT PRIMARY KEY,
    ad_name VARCHAR(255) NOT NULL,
    media_url VARCHAR(2048) NOT NULL,
    media_type ENUM('video/mp4', 'video/webm', 'image/jpeg', 'image/png', 'image/gif') NOT NULL,
    duration_seconds INT NOT NULL DEFAULT 5,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT DEFAULT 0,
    uploaded_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) NOT NULL,
    INDEX idx_is_active (is_active),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Migration: backfill NULL audit columns before the NOT NULL constraint takes effect on existing databases.
-- Run this block once against any existing schema where created_by/updated_by may contain NULLs,
-- then apply the ALTER TABLE statements below to enforce the constraint.
--
--   UPDATE advertisements SET created_by = 'system' WHERE created_by IS NULL;
--   UPDATE advertisements SET updated_by = 'system' WHERE updated_by IS NULL;
--   ALTER TABLE advertisements MODIFY COLUMN created_by VARCHAR(100) NOT NULL;
--   ALTER TABLE advertisements MODIFY COLUMN updated_by VARCHAR(100) NOT NULL;

-- NOTE: A BEFORE UPDATE trigger cannot UPDATE the same table it fires on (MySQL ERROR 1442).
-- The single-active-ad constraint is enforced via the stored procedure below.
-- Call activate_advertisement(ad_id) from the application layer instead of doing a plain UPDATE.
DELIMITER $$
CREATE PROCEDURE activate_advertisement(IN p_advertisement_id INT)
BEGIN
    DECLARE v_ad_exists INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
        SELECT COUNT(*)
        INTO v_ad_exists
        FROM advertisements
        WHERE advertisement_id = p_advertisement_id
        FOR UPDATE;

        IF v_ad_exists = 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Advertisement not found';
        END IF;

        -- Clear the current active advertisement (if any).
        UPDATE advertisements
        SET    is_active  = FALSE,
               updated_by = 'system',
               updated_on = CURRENT_TIMESTAMP
        WHERE  is_active = TRUE
          AND  advertisement_id != p_advertisement_id;

        -- Activate the requested advertisement.
        UPDATE advertisements
        SET    is_active  = TRUE,
               updated_by = 'system',
               updated_on = CURRENT_TIMESTAMP
        WHERE  advertisement_id = p_advertisement_id;
    COMMIT;
END$$
DELIMITER ;

-- Table: daily_summaries (Materialized view / Pre-aggregation)
CREATE TABLE IF NOT EXISTS daily_summaries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    summary_date DATE NOT NULL UNIQUE,
    total_breakfast_waste_kg DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_lunch_waste_kg DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_daily_waste_kg DECIMAL(10, 2) GENERATED ALWAYS AS (total_breakfast_waste_kg + total_lunch_waste_kg) STORED,
    total_breakfast_plates INT NOT NULL DEFAULT 0,
    total_lunch_plates INT NOT NULL DEFAULT 0,
    total_daily_plates INT GENERATED ALWAYS AS (total_breakfast_plates + total_lunch_plates) STORED,
    average_waste_per_plate_grams DECIMAL(10, 2) GENERATED ALWAYS AS ((total_daily_waste_kg * 1000) / NULLIF(total_daily_plates, 0)) STORED,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_summary_date (summary_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: audit_log
CREATE TABLE IF NOT EXISTS audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    old_values JSON,
    new_values JSON,
    changed_by VARCHAR(100) NOT NULL DEFAULT 'system',
    changed_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_table_record (table_name, record_id),
    INDEX idx_changed_on (changed_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Migration for existing deployments (idempotent: only runs when column is nullable).
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS migrate_audit_log_changed_by()
BEGIN
    DECLARE v_is_nullable VARCHAR(3);
    SELECT IS_NULLABLE
    INTO v_is_nullable
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'audit_log'
      AND COLUMN_NAME = 'changed_by';

    IF v_is_nullable = 'YES' THEN
        UPDATE audit_log SET changed_by = 'system' WHERE changed_by IS NULL;
        ALTER TABLE audit_log MODIFY COLUMN changed_by VARCHAR(100) NOT NULL DEFAULT 'system';
    END IF;
END$$
DELIMITER ;

CALL migrate_audit_log_changed_by();
DROP PROCEDURE IF EXISTS migrate_audit_log_changed_by;
