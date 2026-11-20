-- Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
--
-- WSO2 LLC. licenses this file to you under the Apache License,
-- Version 2.0 (the "License"); you may not use this file except
-- in compliance with the License.
-- You may obtain a copy of the License at
--
-- http://www.apache.org/licenses/LICENSE-2.0
--
-- Unless required by applicable law or agreed to in writing,
-- software distributed under the License is distributed on an
-- "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
-- KIND, either express or implied.  See the License for the
-- specific language governing permissions and limitations
-- under the License.

-- ---------------------------------------------------------------------------
-- OKRs
--
-- An objective owned by one employee, with its key results. The owner, anyone
-- above them in their reporting chain and People Ops admins manage it. The
-- objective has no due date: each key result is given to the owner or someone
-- in their team and has its own due date, an optional baseline and target, and a status
-- whose every change is kept. Each key result lists the actions taken towards
-- it, and each action has comments. Owners are named by work email, which stays
-- the same across a rehire. An objective is completed or closed rather than
-- deleted; one nobody has worked on yet can be deleted (is_active 0). `version`
-- goes up with every change to the objective or its key results' details, so
-- two people editing at once can't overwrite each other.
-- ---------------------------------------------------------------------------

CREATE TABLE `okr` (
  `id`                INT NOT NULL AUTO_INCREMENT,
  `owner_email`       VARCHAR(254) NOT NULL,
  `objective`         VARCHAR(300) NOT NULL,
  `status`            ENUM('OPEN', 'COMPLETED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
  `close_reason`      VARCHAR(500) NULL,
  `status_changed_by` VARCHAR(254) NULL,
  `status_changed_on` TIMESTAMP(6) NULL,
  `version`           INT NOT NULL DEFAULT 1,
  `is_active`         TINYINT(1) NOT NULL DEFAULT 1,
  `created_by`        VARCHAR(254) NOT NULL,
  `created_on`        TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by`        VARCHAR(254) NOT NULL,
  `updated_on`        TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                        ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_okr_owner` (`owner_email`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `okr_key_result` (
  `id`          INT NOT NULL AUTO_INCREMENT,
  `okr_id`      INT NOT NULL,
  `owner_email` VARCHAR(254) NOT NULL,
  `title`       VARCHAR(200) NOT NULL,
  `baseline`    VARCHAR(50) NULL,
  `target`      VARCHAR(50) NULL,
  `due_date`    DATE NOT NULL,
  `status`      ENUM('NOT_STARTED', 'AT_RISK', 'IN_PROGRESS', 'ON_TRACK', 'COMPLETED') NOT NULL
                  DEFAULT 'NOT_STARTED',
  `position`    INT NOT NULL,
  `is_active`   TINYINT(1) NOT NULL DEFAULT 1,
  `created_by`  VARCHAR(254) NOT NULL,
  `created_on`  TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by`  VARCHAR(254) NOT NULL,
  `updated_on`  TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                  ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_okr_key_result_okr` (`okr_id`, `is_active`, `position`),
  KEY `idx_okr_key_result_owner` (`owner_email`, `is_active`),
  CONSTRAINT `fk_okr_key_result_okr` FOREIGN KEY (`okr_id`) REFERENCES `okr` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Every status a key result has had, the first one from when it was added.
CREATE TABLE `okr_key_result_status` (
  `id`            INT NOT NULL AUTO_INCREMENT,
  `key_result_id` INT NOT NULL,
  `status`        ENUM('NOT_STARTED', 'AT_RISK', 'IN_PROGRESS', 'ON_TRACK', 'COMPLETED') NOT NULL,
  `changed_by`    VARCHAR(254) NOT NULL,
  `changed_on`    TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_okr_key_result_status_kr` (`key_result_id`, `changed_on`),
  CONSTRAINT `fk_okr_key_result_status_kr` FOREIGN KEY (`key_result_id`) REFERENCES `okr_key_result` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Initiatives and actions towards a key result. Removing one sets is_active to 0.
CREATE TABLE `okr_action` (
  `id`            INT NOT NULL AUTO_INCREMENT,
  `key_result_id` INT NOT NULL,
  `title`         VARCHAR(300) NOT NULL,
  `is_done`       TINYINT(1) NOT NULL DEFAULT 0,
  `done_by`       VARCHAR(254) NULL,
  `done_on`       TIMESTAMP(6) NULL,
  `is_active`     TINYINT(1) NOT NULL DEFAULT 1,
  `created_by`    VARCHAR(254) NOT NULL,
  `created_on`    TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by`    VARCHAR(254) NOT NULL,
  `updated_on`    TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                    ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_okr_action_kr` (`key_result_id`, `is_active`),
  CONSTRAINT `fk_okr_action_kr` FOREIGN KEY (`key_result_id`) REFERENCES `okr_key_result` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `okr_action_comment` (
  `id`         INT NOT NULL AUTO_INCREMENT,
  `action_id`  INT NOT NULL,
  `comment`    VARCHAR(2000) NOT NULL,
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_okr_action_comment_action` (`action_id`, `created_on`),
  CONSTRAINT `fk_okr_action_comment_action` FOREIGN KEY (`action_id`) REFERENCES `okr_action` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
