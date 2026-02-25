ALTER TABLE personal_info
  MODIFY COLUMN nic_or_passport VARCHAR(20) NOT NULL,
  MODIFY COLUMN first_name      VARCHAR(100) NOT NULL,
  MODIFY COLUMN last_name       VARCHAR(100) NOT NULL,
  MODIFY COLUMN title           VARCHAR(100) NOT NULL,
  MODIFY COLUMN dob             DATE NOT NULL,
  MODIFY COLUMN nationality     VARCHAR(100) NOT NULL;

ALTER TABLE employee
  MODIFY COLUMN start_date           DATE NOT NULL,
  MODIFY COLUMN employment_type_id   INT NOT NULL,
  MODIFY COLUMN sub_team_id          INT NOT NULL;

ALTER TABLE employee DROP COLUMN additional_manager_emails;

CREATE TABLE `employee_additional_managers` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `employee_pk_id` INT NOT NULL,
  `additional_manager_email` VARCHAR(254) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL,
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_eam_employee_email` (`employee_pk_id`, `additional_manager_email`),
  KEY `idx_eam_manager_email` (`additional_manager_email`),
  CONSTRAINT `fk_eam_employee`
    FOREIGN KEY (`employee_pk_id`) REFERENCES `employee` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `employee_additional_managers_audit` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `employee_pk_id` int DEFAULT NULL,
  `action_type` enum('INSERT', 'UPDATE', 'DELETE') NOT NULL,
  `action_by` varchar(254) NOT NULL,
  `db_user` varchar(254) NULL,
  `action_on` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `data` json NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_eam_audit_employee_pk_id` (`employee_pk_id`),
  KEY `idx_eam_audit_action_on` (`action_on`),
  CONSTRAINT `fk_employee_additional_managers_audit_employee_pk_id`
    FOREIGN KEY (`employee_pk_id`) REFERENCES `employee` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

ALTER TABLE personal_info DROP COLUMN emergency_contacts;

CREATE TABLE `personal_info_emergency_contacts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `personal_info_id` INT NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `mobile` VARCHAR(20) NOT NULL,
  `telephone` VARCHAR(20) NOT NULL,
  `relationship` VARCHAR(100) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL,
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ec_personal_mobile` (`personal_info_id`, `mobile`),
  KEY `idx_ec_personal_info_id` (`personal_info_id`),
  KEY `idx_ec_mobile` (`mobile`),
  CONSTRAINT `fk_ec_personal_info`
    FOREIGN KEY (`personal_info_id`) REFERENCES `personal_info` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `personal_info_emergency_contacts_audit` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `personal_info_id` int DEFAULT NULL,
  `action_type` enum('INSERT', 'UPDATE', 'DELETE') NOT NULL,
  `action_by` varchar(254) NOT NULL,
  `db_user` varchar(254) NULL,
  `action_on` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `data` json NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ec_audit_personal_info_id` (`personal_info_id`),
  KEY `idx_ec_audit_action_on` (`action_on`),
  CONSTRAINT `fk_personal_info_emergency_contacts_audit_personal_info_id`
    FOREIGN KEY (`personal_info_id`) REFERENCES `personal_info` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `personal_info_audit` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `personal_info_pk_id` int DEFAULT NULL,
  `action_type` enum('INSERT', 'UPDATE', 'DELETE') NOT NULL,
  `action_by` varchar(254) NOT NULL,
  `action_on` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `data` json NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pi_audit_pi_pk` (`personal_info_pk_id`),
  KEY `idx_pi_audit_action_on` (`action_on`),
  CONSTRAINT `fk_pi_audit_personal_info` FOREIGN KEY (`personal_info_pk_id`) REFERENCES `personal_info` (`id`) ON DELETE
  SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `employee_audit` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `employee_pk_id` int DEFAULT NULL,
  `action_type` enum('INSERT', 'UPDATE', 'DELETE') NOT NULL,
  `action_by` varchar(254) NOT NULL,
  `action_on` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `data` json NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_emp_audit_employee_pk` (`employee_pk_id`),
  KEY `idx_emp_audit_action_on` (`action_on`),
  CONSTRAINT `fk_emp_audit_employee` FOREIGN KEY (`employee_pk_id`) REFERENCES `employee` (`id`) ON DELETE
  SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Personal Info INSERT Trigger
DELIMITER //
CREATE TRIGGER `trg_personal_info_audit_insert`
AFTER INSERT ON `personal_info`
FOR EACH ROW
BEGIN
  INSERT INTO personal_info_audit (personal_info_pk_id, action_type, action_by, action_on, data)
  VALUES (
    NEW.id,
    'INSERT',
    NEW.created_by,
    CURRENT_TIMESTAMP(6),
    JSON_OBJECT(
      'id', NEW.id,
      'nic_or_passport', NEW.nic_or_passport,
      'first_name', NEW.first_name,
      'last_name', NEW.last_name,
      'title', NEW.title,
      'dob', NEW.dob,
      'gender', NEW.gender,
      'personal_email', NEW.personal_email,
      'personal_phone', NEW.personal_phone,
      'resident_number', NEW.resident_number,
      'address_line_1', NEW.address_line_1,
      'address_line_2', NEW.address_line_2,
      'city', NEW.city,
      'state_or_province', NEW.state_or_province,
      'postal_code', NEW.postal_code,
      'country', NEW.country,
      'nationality', NEW.nationality,
      'created_by', NEW.created_by,
      'created_on', NEW.created_on,
      'updated_by', NEW.updated_by,
      'updated_on', NEW.updated_on
    )
  );
END//
DELIMITER ;

-- Personal Info UPDATE Trigger
DELIMITER //
CREATE TRIGGER `trg_personal_info_audit_update`
AFTER UPDATE ON `personal_info`
FOR EACH ROW
BEGIN
  INSERT INTO personal_info_audit (personal_info_pk_id, action_type, action_by, action_on, data)
  VALUES (
    NEW.id,
    'UPDATE',
    NEW.updated_by,
    CURRENT_TIMESTAMP(6),
    JSON_OBJECT(
      'id', NEW.id,
      'nic_or_passport', NEW.nic_or_passport,
      'first_name', NEW.first_name,
      'last_name', NEW.last_name,
      'title', NEW.title,
      'dob', NEW.dob,
      'gender', NEW.gender,
      'personal_email', NEW.personal_email,
      'personal_phone', NEW.personal_phone,
      'resident_number', NEW.resident_number,
      'address_line_1', NEW.address_line_1,
      'address_line_2', NEW.address_line_2,
      'city', NEW.city,
      'state_or_province', NEW.state_or_province,
      'postal_code', NEW.postal_code,
      'country', NEW.country,
      'nationality', NEW.nationality,
      'created_by', NEW.created_by,
      'created_on', NEW.created_on,
      'updated_by', NEW.updated_by,
      'updated_on', NEW.updated_on
    )
  );
END//
DELIMITER ;

-- Personal Info Emergency Contacts INSERT Trigger
DELIMITER //
CREATE TRIGGER `trg_personal_info_emergency_contacts_audit_insert`
AFTER INSERT ON `personal_info_emergency_contacts`
FOR EACH ROW
BEGIN
  DECLARE v_action_by VARCHAR(254);
  DECLARE v_db_user VARCHAR(254);
  
  IF NEW.created_by IS NOT NULL AND TRIM(NEW.created_by) <> '' THEN
    SET v_action_by = NEW.created_by;
  ELSE
    SET v_action_by = 'SYSTEM';
  END IF;

  SET v_db_user = USER();

  INSERT INTO personal_info_emergency_contacts_audit
    (personal_info_id, action_type, action_by, db_user, action_on, data)
  VALUES (
    NEW.personal_info_id,
    'INSERT',
    v_action_by,
    v_db_user,
    CURRENT_TIMESTAMP(6),
    JSON_OBJECT(
      'id', NEW.id,
      'personal_info_id', NEW.personal_info_id,
      'name', NEW.name,
      'mobile', NEW.mobile,
      'telephone', NEW.telephone,
      'relationship', NEW.relationship,
      'is_active', NEW.is_active,
      'created_by', NEW.created_by,
      'created_on', NEW.created_on,
      'updated_by', NEW.updated_by,
      'updated_on', NEW.updated_on
    )
  );
END//
DELIMITER ;

-- Personal Info Emergency Contacts UPDATE Trigger
DELIMITER //
CREATE TRIGGER `trg_personal_info_emergency_contacts_audit_update`
AFTER UPDATE ON `personal_info_emergency_contacts`
FOR EACH ROW
BEGIN
  DECLARE v_action_by VARCHAR(254);
  DECLARE v_db_user VARCHAR(254);
  DECLARE v_action_type ENUM('INSERT','UPDATE','DELETE');

  IF NEW.updated_by IS NOT NULL AND TRIM(NEW.updated_by) <> '' THEN
    SET v_action_by = NEW.updated_by;
  ELSE
    SET v_action_by = 'SYSTEM';
  END IF;

  SET v_db_user = USER();

  IF OLD.is_active = 1 AND NEW.is_active = 0 THEN
    SET v_action_type = 'DELETE';
  ELSE
    SET v_action_type = 'UPDATE';
  END IF;

  INSERT INTO personal_info_emergency_contacts_audit
    (personal_info_id, action_type, action_by, db_user, action_on, data)
  VALUES (
    NEW.personal_info_id,
    v_action_type,
    v_action_by,
    v_db_user,
    CURRENT_TIMESTAMP(6),
    JSON_OBJECT(
      'id', NEW.id,
      'personal_info_id', NEW.personal_info_id,
      'name', NEW.name,
      'mobile', NEW.mobile,
      'telephone', NEW.telephone,
      'relationship', NEW.relationship,
      'is_active', NEW.is_active,
      'created_by', NEW.created_by,
      'created_on', NEW.created_on,
      'updated_by', NEW.updated_by,
      'updated_on', NEW.updated_on
    )
  );
END//
DELIMITER ;

-- Employee INSERT Trigger
DELIMITER //
CREATE TRIGGER `trg_employee_audit_insert`
AFTER INSERT ON `employee`
FOR EACH ROW
BEGIN
  INSERT INTO employee_audit (employee_pk_id, action_type, action_by, action_on, data)
  VALUES (
    NEW.id,
    'INSERT',
    NEW.created_by,
    CURRENT_TIMESTAMP(6),
    JSON_OBJECT(
      'id', NEW.id,
      'employee_id', NEW.employee_id,
      'first_name', NEW.first_name,
      'last_name', NEW.last_name,
      'epf', NEW.epf,
      'employment_location', NEW.employment_location,
      'work_location', NEW.work_location,
      'work_email', NEW.work_email,
      'start_date', NEW.start_date,
      'secondary_job_title', NEW.secondary_job_title,
      'manager_email', NEW.manager_email,
      'employee_status', NEW.employee_status,
      'continuous_service_record', NEW.continuous_service_record,
      'employee_thumbnail', NEW.employee_thumbnail,
      'probation_end_date', NEW.probation_end_date,
      'agreement_end_date', NEW.agreement_end_date,
      'employment_type_id', NEW.employment_type_id,
      'designation_id', NEW.designation_id,
      'office_id', NEW.office_id,
      'team_id', NEW.team_id,
      'sub_team_id', NEW.sub_team_id,
      'business_unit_id', NEW.business_unit_id,
      'unit_id', NEW.unit_id,
      'personal_info_id', NEW.personal_info_id,
      'created_by', NEW.created_by,
      'created_on', NEW.created_on,
      'updated_by', NEW.updated_by,
      'updated_on', NEW.updated_on
    )
  );
END//
DELIMITER ;

-- Employee UPDATE Trigger
DELIMITER //
CREATE TRIGGER `trg_employee_audit_update`
AFTER UPDATE ON `employee`
FOR EACH ROW
BEGIN
  INSERT INTO employee_audit (employee_pk_id, action_type, action_by, action_on, data)
  VALUES (
    NEW.id,
    'UPDATE',
    NEW.updated_by,
    CURRENT_TIMESTAMP(6),
    JSON_OBJECT(
      'id', NEW.id,
      'employee_id', NEW.employee_id,
      'first_name', NEW.first_name,
      'last_name', NEW.last_name,
      'epf', NEW.epf,
      'employment_location', NEW.employment_location,
      'work_location', NEW.work_location,
      'work_email', NEW.work_email,
      'start_date', NEW.start_date,
      'secondary_job_title', NEW.secondary_job_title,
      'manager_email', NEW.manager_email,
      'employee_status', NEW.employee_status,
      'continuous_service_record', NEW.continuous_service_record,
      'employee_thumbnail', NEW.employee_thumbnail,
      'probation_end_date', NEW.probation_end_date,
      'agreement_end_date', NEW.agreement_end_date,
      'employment_type_id', NEW.employment_type_id,
      'designation_id', NEW.designation_id,
      'office_id', NEW.office_id,
      'team_id', NEW.team_id,
      'sub_team_id', NEW.sub_team_id,
      'business_unit_id', NEW.business_unit_id,
      'unit_id', NEW.unit_id,
      'personal_info_id', NEW.personal_info_id,
      'created_by', NEW.created_by,
      'created_on', NEW.created_on,
      'updated_by', NEW.updated_by,
      'updated_on', NEW.updated_on
    )
  );
END//
DELIMITER ;

-- Employee Additional Managers INSERT Trigger
DELIMITER //
CREATE TRIGGER `trg_employee_additional_managers_audit_insert`
AFTER INSERT ON `employee_additional_managers`
FOR EACH ROW
BEGIN
  DECLARE v_action_by VARCHAR(254);
  DECLARE v_db_user VARCHAR(254);

  IF NEW.created_by IS NOT NULL AND TRIM(NEW.created_by) <> '' THEN
    SET v_action_by = NEW.created_by;
  ELSE
    SET v_action_by = 'SYSTEM';
  END IF;

  SET v_db_user = USER();

  INSERT INTO employee_additional_managers_audit (employee_pk_id, action_type, action_by, db_user, action_on, data)
  VALUES (
    NEW.employee_pk_id,
    'INSERT',
    v_action_by,
    v_db_user,
    CURRENT_TIMESTAMP(6),
    JSON_OBJECT(
      'id', NEW.id,
      'employee_pk_id', NEW.employee_pk_id,
      'additional_manager_email', NEW.additional_manager_email,
      'is_active', NEW.is_active,
      'created_by', NEW.created_by,
      'created_on', NEW.created_on,
      'updated_by', NEW.updated_by,
      'updated_on', NEW.updated_on
    )
  );
END//
DELIMITER ;

-- Employee Additional Managers UPDATE Trigger
DELIMITER //
CREATE TRIGGER `trg_employee_additional_managers_audit_update`
AFTER UPDATE ON `employee_additional_managers`
FOR EACH ROW
BEGIN
  DECLARE v_action_by VARCHAR(254);
  DECLARE v_db_user VARCHAR(254);
  DECLARE v_action_type ENUM('INSERT','UPDATE','DELETE');

  IF NEW.updated_by IS NOT NULL AND TRIM(NEW.updated_by) <> '' THEN
    SET v_action_by = NEW.updated_by;
  ELSE
    SET v_action_by = 'SYSTEM';
  END IF;

  SET v_db_user = USER();

  IF OLD.is_active = 1 AND NEW.is_active = 0 THEN
    SET v_action_type = 'DELETE';
  ELSE
    SET v_action_type = 'UPDATE';
  END IF;

  INSERT INTO employee_additional_managers_audit
    (employee_pk_id, action_type, action_by, db_user, action_on, data)
  VALUES (
    NEW.employee_pk_id,
    v_action_type,
    v_action_by,
    v_db_user,
    CURRENT_TIMESTAMP(6),
    JSON_OBJECT(
      'id', NEW.id,
      'employee_pk_id', NEW.employee_pk_id,
      'additional_manager_email', NEW.additional_manager_email,
      'is_active', NEW.is_active,
      'created_by', NEW.created_by,
      'created_on', NEW.created_on,
      'updated_by', NEW.updated_by,
      'updated_on', NEW.updated_on
    )
  );
END//
DELIMITER ;