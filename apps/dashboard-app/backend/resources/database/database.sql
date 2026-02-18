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

CREATE TABLE `meal_records` (
  `meal_record_id` int NOT NULL AUTO_INCREMENT,
  `record_date` date NOT NULL,
  `meal_type` varchar(20) NOT NULL,
  `total_waste_kg` decimal(10,2) NOT NULL,
  `plate_count` int NOT NULL,
  `created_on` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `created_by` varchar(100) NOT NULL,
  `updated_on` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `updated_by` varchar(100) NOT NULL,
  PRIMARY KEY (`meal_record_id`),
  UNIQUE KEY `uniq_meal_record_date_type` (`record_date`,`meal_type`),
  KEY `idx_meal_record_date` (`record_date`),
  KEY `idx_meal_record_meal_type` (`meal_type`)
);
