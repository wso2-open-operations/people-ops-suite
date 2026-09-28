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
-- Employee leadership attributes
--
-- Three seeded attributes (Leadership Group, Business Leadership, Senior
-- Leadership) assignable to an employee in any combination, including none.
--
-- The value list lives in a table rather than an ENUM so that adding a fourth
-- attribute is an INSERT, not a coordinated backend+webapp release: the CSV
-- export derives its column headers from these rows at export time.
--
-- employee_leadership soft-deletes (is_active = 0) rather than deleting, which
-- is what makes the audit trail meaningful. Re-assigning a previously removed
-- attribute must UPDATE the existing row back to is_active = 1 -- the unique
-- key makes a plain INSERT fail.
-- ---------------------------------------------------------------------------

CREATE TABLE `leadership_group` (
  `id`         INT NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(100) NOT NULL,
  `is_active`  TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL,
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                 ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_leadership_group_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audits changes to the attribute list itself, the way career_function_audit does
-- for career functions. A rename or retirement changes what every holder's profile,
-- report and CSV column shows, so the previous value has to be recoverable.
CREATE TABLE `leadership_group_audit` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `leadership_group_pk_id` int DEFAULT NULL,
  `action_type` enum('INSERT', 'UPDATE', 'DELETE') NOT NULL,
  `action_by` varchar(254) NOT NULL,
  `db_user` varchar(254) NULL,
  `action_on` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `data` json NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_lg_audit_leadership_group_pk` (`leadership_group_pk_id`),
  KEY `idx_lg_audit_action_on` (`action_on`),
  CONSTRAINT `fk_lg_audit_leadership_group`
    FOREIGN KEY (`leadership_group_pk_id`) REFERENCES `leadership_group` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Arguments are passed positionally from both triggers below. Adding a column
-- means adding it at the same ordinal in this signature and in BOTH CALL
-- argument lists, or every later argument shifts and the audit JSON is silently
-- written with values in the wrong keys.
DELIMITER //
CREATE PROCEDURE `prc_leadership_group_audit`(
  IN p_id          INT,
  IN p_action_type VARCHAR(10),
  IN p_action_by   VARCHAR(254),
  IN p_name        VARCHAR(100),
  IN p_is_active   TINYINT(1),
  IN p_created_by  VARCHAR(254),
  IN p_created_on  DATETIME(6),
  IN p_updated_by  VARCHAR(254),
  IN p_updated_on  DATETIME(6)
)
BEGIN
  INSERT INTO leadership_group_audit
    (leadership_group_pk_id, action_type, action_by, db_user, action_on, data)
  VALUES (
    p_id,
    p_action_type,
    p_action_by,
    USER(),
    CURRENT_TIMESTAMP(6),
    JSON_OBJECT(
      'id',         p_id,
      'name',       p_name,
      'is_active',  p_is_active,
      'created_by', p_created_by,
      'created_on', p_created_on,
      'updated_by', p_updated_by,
      'updated_on', p_updated_on
    )
  );
END//
DELIMITER ;

DELIMITER //
CREATE TRIGGER `trg_leadership_group_audit_insert`
AFTER INSERT ON `leadership_group`
FOR EACH ROW
BEGIN
  CALL prc_leadership_group_audit(
    NEW.id, 'INSERT', COALESCE(NULLIF(TRIM(NEW.created_by), ''), 'SYSTEM'),
    NEW.name,       NEW.is_active,
    NEW.created_by, NEW.created_on,
    NEW.updated_by, NEW.updated_on
  );
END//
DELIMITER ;

-- Logs DELETE when is_active flips 1 -> 0, UPDATE otherwise.
DELIMITER //
CREATE TRIGGER `trg_leadership_group_audit_update`
AFTER UPDATE ON `leadership_group`
FOR EACH ROW
BEGIN
  CALL prc_leadership_group_audit(
    NEW.id,
    CASE WHEN OLD.is_active = 1 AND NEW.is_active = 0 THEN 'DELETE' ELSE 'UPDATE' END,
    COALESCE(NULLIF(TRIM(NEW.updated_by), ''), 'SYSTEM'),
    NEW.name,       NEW.is_active,
    NEW.created_by, NEW.created_on,
    NEW.updated_by, NEW.updated_on
  );
END//
DELIMITER ;

-- Seeded after the audit triggers exist, so the audit log starts from the first row.
INSERT IGNORE INTO `leadership_group` (`name`, `created_by`, `updated_by`) VALUES
  ('Leadership Group',    'MIGRATION', 'MIGRATION'),
  ('Business Leadership', 'MIGRATION', 'MIGRATION'),
  ('Senior Leadership',   'MIGRATION', 'MIGRATION');

CREATE TABLE `employee_leadership` (
  `id`                  INT NOT NULL AUTO_INCREMENT,
  `employee_pk_id`      INT NOT NULL,
  `leadership_group_id` INT NOT NULL,
  `is_active`           TINYINT(1) NOT NULL DEFAULT 1,
  `created_by`          VARCHAR(254) NOT NULL,
  `created_on`          TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by`          VARCHAR(254) NOT NULL,
  `updated_on`          TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                          ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_el_employee_group` (`employee_pk_id`, `leadership_group_id`),
  KEY `idx_el_group` (`leadership_group_id`),
  CONSTRAINT `fk_el_employee`
    FOREIGN KEY (`employee_pk_id`) REFERENCES `employee` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_el_group`
    FOREIGN KEY (`leadership_group_id`) REFERENCES `leadership_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `employee_leadership_audit` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `employee_pk_id` int DEFAULT NULL,
  `action_type` enum('INSERT', 'UPDATE', 'DELETE') NOT NULL,
  `action_by` varchar(254) NOT NULL,
  `db_user` varchar(254) NULL,
  `action_on` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `data` json NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_el_audit_employee_pk_id` (`employee_pk_id`),
  KEY `idx_el_audit_action_on` (`action_on`),
  CONSTRAINT `fk_employee_leadership_audit_employee_pk_id`
    FOREIGN KEY (`employee_pk_id`) REFERENCES `employee` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Arguments are passed positionally from both triggers below. Adding a column
-- means adding it at the same ordinal in this signature and in BOTH CALL
-- argument lists, or every later argument shifts and the audit JSON is silently
-- written with values in the wrong keys.
DELIMITER //
CREATE PROCEDURE `prc_employee_leadership_audit`(
  IN p_employee_pk_id      BIGINT,
  IN p_action_type         VARCHAR(10),
  IN p_action_by           VARCHAR(254),
  IN p_id                  BIGINT,
  IN p_leadership_group_id INT,
  IN p_is_active           TINYINT(1),
  IN p_created_by          VARCHAR(254),
  IN p_created_on          DATETIME(6),
  IN p_updated_by          VARCHAR(254),
  IN p_updated_on          DATETIME(6)
)
BEGIN
  INSERT INTO employee_leadership_audit
    (employee_pk_id, action_type, action_by, db_user, action_on, data)
  VALUES (
    p_employee_pk_id,
    p_action_type,
    p_action_by,
    USER(),
    CURRENT_TIMESTAMP(6),
    JSON_OBJECT(
      'id',                  p_id,
      'employee_pk_id',      p_employee_pk_id,
      'leadership_group_id', p_leadership_group_id,
      'is_active',           p_is_active,
      'created_by',          p_created_by,
      'created_on',          p_created_on,
      'updated_by',          p_updated_by,
      'updated_on',          p_updated_on
    )
  );
END//
DELIMITER ;

DELIMITER //
CREATE TRIGGER `trg_employee_leadership_audit_insert`
AFTER INSERT ON `employee_leadership`
FOR EACH ROW
BEGIN
  CALL prc_employee_leadership_audit(
    NEW.employee_pk_id,
    'INSERT',
    COALESCE(NULLIF(TRIM(NEW.created_by), ''), 'SYSTEM'),
    NEW.id,         NEW.leadership_group_id, NEW.is_active,
    NEW.created_by, NEW.created_on,
    NEW.updated_by, NEW.updated_on
  );
END//
DELIMITER ;

-- Logs DELETE when is_active flips 1 -> 0, UPDATE otherwise.
DELIMITER //
CREATE TRIGGER `trg_employee_leadership_audit_update`
AFTER UPDATE ON `employee_leadership`
FOR EACH ROW
BEGIN
  CALL prc_employee_leadership_audit(
    NEW.employee_pk_id,
    CASE WHEN OLD.is_active = 1 AND NEW.is_active = 0 THEN 'DELETE' ELSE 'UPDATE' END,
    COALESCE(NULLIF(TRIM(NEW.updated_by), ''), 'SYSTEM'),
    NEW.id,         NEW.leadership_group_id, NEW.is_active,
    NEW.created_by, NEW.created_on,
    NEW.updated_by, NEW.updated_on
  );
END//
DELIMITER ;
