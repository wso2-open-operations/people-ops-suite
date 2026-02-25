DROP TABLE IF EXISTS resignation;
DROP TABLE IF EXISTS vehicle;
DROP TABLE IF EXISTS employee_additional_managers;
DROP TABLE IF EXISTS employee;
DROP TABLE IF EXISTS recruit;
DROP TABLE IF EXISTS business_unit_team_sub_team_unit;
DROP TABLE IF EXISTS business_unit_team_sub_team;
DROP TABLE IF EXISTS business_unit_team;
DROP TABLE IF EXISTS unit;
DROP TABLE IF EXISTS sub_team;
DROP TABLE IF EXISTS team;
DROP TABLE IF EXISTS business_unit;
DROP TABLE IF EXISTS office;
DROP TABLE IF EXISTS company;
DROP TABLE IF EXISTS designation;
DROP TABLE IF EXISTS career_function;
DROP TABLE IF EXISTS employment_type;
DROP TABLE IF EXISTS personal_info_emergency_contacts;
DROP TABLE IF EXISTS personal_info;

CREATE TABLE `vehicle` (
  `vehicle_id` int NOT NULL AUTO_INCREMENT,
  `employee_email` varchar(45) NOT NULL,
  `vehicle_registration_number` varchar(45) NOT NULL,
  `vehicle_type` enum('CAR','MOTORCYCLE') NOT NULL,
  `vehicle_status` enum('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `created_on` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `created_by` varchar(45) NOT NULL,
  `updated_on` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `updated_by` varchar(60) NOT NULL,
  PRIMARY KEY (`vehicle_id`)
);

CREATE TABLE `business_unit` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  `head_email` VARCHAR(254) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL,
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
);

CREATE TABLE `team` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  `head_email` VARCHAR(254) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL,
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
);

CREATE TABLE `business_unit_team` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `business_unit_id` INT NOT NULL,
  `team_id` INT NOT NULL,
  `head_email` VARCHAR(254) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL,
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_but_bu`
    FOREIGN KEY (`business_unit_id`) REFERENCES `business_unit` (`id`),
  CONSTRAINT `fk_but_team`
    FOREIGN KEY (`team_id`) REFERENCES `team` (`id`)
);

CREATE TABLE `sub_team` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  `head_email` VARCHAR(254) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL,
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
);

CREATE TABLE `business_unit_team_sub_team` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `business_unit_team_id` INT NOT NULL,
  `sub_team_id` INT NOT NULL,
  `head_email` VARCHAR(254) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL,
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_butst_but`
    FOREIGN KEY (`business_unit_team_id`) REFERENCES `business_unit_team` (`id`),
  CONSTRAINT `fk_butst_st`
    FOREIGN KEY (`sub_team_id`) REFERENCES `sub_team` (`id`)
);

CREATE TABLE `unit` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  `head_email` VARCHAR(254) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL,
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
);

CREATE TABLE `business_unit_team_sub_team_unit` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `business_unit_team_sub_team_id` INT NOT NULL,
  `unit_id` INT NOT NULL,
  `head_email` VARCHAR(254) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL,
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_butstu_butst`
    FOREIGN KEY (`business_unit_team_sub_team_id`) REFERENCES `business_unit_team_sub_team` (`id`),
  CONSTRAINT `fk_butstu_unit`
    FOREIGN KEY (`unit_id`) REFERENCES `unit` (`id`)
);

-- Company table
CREATE TABLE `company` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `prefix` VARCHAR(20) NOT NULL,
  `location` VARCHAR(255) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL,
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
);

-- Office table
CREATE TABLE `office` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `company_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `location` VARCHAR(255) NOT NULL,
  `working_locations` JSON NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL,
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_office_company`
    FOREIGN KEY (`company_id`) REFERENCES `company` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- Career_function table
CREATE TABLE `career_function` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `career_function` VARCHAR(150) NOT NULL,
  `is_active` TINYINT(1) NULL DEFAULT 1, 
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL,
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
);

-- Designation table
CREATE TABLE `designation` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `designation` VARCHAR(150) NOT NULL,
  `job_band` INT NULL,
  `career_function_id` INT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,  
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL,
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT `fk_designation_career_function`
    FOREIGN KEY (`career_function_id`) REFERENCES `career_function` (`id`)
);

-- Employment_types table
CREATE TABLE `employment_type` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `is_active` TINYINT(1) NULL DEFAULT 1, 
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL,
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
);

-- Personal_info table
CREATE TABLE `personal_info` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nic_or_passport` VARCHAR(20) NOT NULL UNIQUE,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `title` VARCHAR(100) NOT NULL,
  `dob` DATE NOT NULL,
  `gender` VARCHAR(20) NOT NULL DEFAULT 'Not Specified',
  `personal_email` VARCHAR(254),
  `personal_phone` VARCHAR(20),
  `resident_number` VARCHAR(20),
  `address_line_1` VARCHAR(255),
  `address_line_2` VARCHAR(255),
  `city` VARCHAR(100),
  `state_or_province` VARCHAR(100),
  `postal_code` VARCHAR(20),
  `country` VARCHAR(100),
  `nationality` VARCHAR(100) NOT NULL,
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL,
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
);

-- Recruit table
CREATE TABLE `recruit` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `first_name` VARCHAR(255) NOT NULL,
  `last_name` VARCHAR(255) NOT NULL,
  `work_email` VARCHAR(254) NULL,
  `date_of_join` DATE NOT NULL,
  `probation_end_date` DATE NULL,
  `agreement_end_date` DATE NULL,
  `employment_location` VARCHAR(255) NULL,
  `work_location` VARCHAR(100) NULL,
  `reports_to` VARCHAR(254) NULL,
  `manager_email` VARCHAR(254) NULL,
  `compensation` JSON NULL,
  `additional_comments` BLOB NULL,
  `status` VARCHAR(255) NOT NULL,
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL,
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `business_unit` INT NOT NULL,
  `unit` INT NULL,
  `team` INT NOT NULL,
  `sub_team` INT NOT NULL,
  `company` INT NOT NULL,
  `office` INT NOT NULL,
  `employment_type` INT NOT NULL,
  `designation_id` INT NOT NULL,
  `personal_info_id` INT NULL,
  CONSTRAINT `fk_recruit_personal_info`
    FOREIGN KEY (`personal_info_id`) REFERENCES `personal_info` (`id`),
  CONSTRAINT `fk_recruit_bu`
    FOREIGN KEY (`business_unit`) REFERENCES `business_unit` (`id`),
  CONSTRAINT `fk_recruit_team`
    FOREIGN KEY (`team`) REFERENCES `team` (`id`),
  CONSTRAINT `fk_recruit_subteam`
    FOREIGN KEY (`sub_team`) REFERENCES `sub_team` (`id`),
  CONSTRAINT `fk_recruit_unit`
    FOREIGN KEY (`unit`) REFERENCES `unit` (`id`),
  CONSTRAINT `fk_recruit_company`
    FOREIGN KEY (`company`) REFERENCES `company` (`id`),
  CONSTRAINT `fk_recruit_office`
    FOREIGN KEY (`office`) REFERENCES `office` (`id`),
  CONSTRAINT `fk_recruit_designation`
    FOREIGN KEY (`designation_id`) REFERENCES `designation` (`id`),
  CONSTRAINT `fk_recruit_employment_type`
    FOREIGN KEY (`employment_type`) REFERENCES `employment_type` (`id`)
);

-- Employee table
CREATE TABLE `employee` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `employee_id` VARCHAR(99) UNIQUE,
  `first_name` VARCHAR(150) NOT NULL,
  `last_name` VARCHAR(150) NOT NULL,
  `epf` VARCHAR(45) NULL,
  `employment_location` VARCHAR(255) NOT NULL,
  `work_location` VARCHAR(100) NOT NULL,
  `work_email` VARCHAR(254) NOT NULL,
  `start_date` DATE NOT NULL,
  `secondary_job_title` VARCHAR(100) NOT NULL,
  `manager_email` VARCHAR(254) NOT NULL,
  `employee_status` VARCHAR(50) NOT NULL,
  `continuous_service_record` VARCHAR(99) NULL,
  `employee_thumbnail` VARCHAR(512) NULL,
  `probation_end_date` DATE NULL,
  `agreement_end_date` DATE NULL,
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL,
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `employment_type_id` INT NOT NULL,
  `designation_id` INT NOT NULL,
  `office_id` INT NOT NULL,
  `team_id` INT NOT NULL,
  `sub_team_id` INT NOT NULL,
  `business_unit_id` INT NOT NULL,
  `unit_id` INT NULL,
  `personal_info_id` INT NOT NULL,
  CONSTRAINT `fk_emp_personal_info`
    FOREIGN KEY (`personal_info_id`) REFERENCES `personal_info` (`id`),
  CONSTRAINT `fk_emp_employment_type`
    FOREIGN KEY (`employment_type_id`) REFERENCES `employment_type` (`id`),
  CONSTRAINT `fk_emp_designation`
    FOREIGN KEY (`designation_id`) REFERENCES `designation` (`id`),
  CONSTRAINT `fk_emp_office`
    FOREIGN KEY (`office_id`) REFERENCES `office` (`id`),
  CONSTRAINT `fk_emp_team`
    FOREIGN KEY (`team_id`) REFERENCES `team` (`id`),
  CONSTRAINT `fk_emp_subteam`
    FOREIGN KEY (`sub_team_id`) REFERENCES `sub_team` (`id`),
  CONSTRAINT `fk_emp_bu`
    FOREIGN KEY (`business_unit_id`) REFERENCES `business_unit` (`id`),
  CONSTRAINT `fk_emp_unit`
    FOREIGN KEY (`unit_id`) REFERENCES `unit` (`id`),
  CONSTRAINT `fk_emp_continuous_service_record`
    FOREIGN KEY (`continuous_service_record`) REFERENCES `employee` (`employee_id`)
);

-- Resignation table
CREATE TABLE `resignation` (
  `employee_id` INT PRIMARY KEY,
  `final_day_in_office` DATE NULL,
  `final_day_of_employment` DATE NULL,
  `reason` VARCHAR(300) NULL,
  `date` DATE NULL,
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL,
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT `fk_emp_resignation`
    FOREIGN KEY (`employee_id`) REFERENCES `employee` (`id`)
);

-- Trigger to set employee.employee_id before insertion
DELIMITER //
CREATE TRIGGER trg_employee_set_employee_id
BEFORE INSERT ON employee
FOR EACH ROW
BEGIN
  DECLARE v_prefix VARCHAR(20);
  -- Look up the company prefix once for this office
  SELECT c.prefix
    INTO v_prefix
    FROM office o
    JOIN company c ON c.id = o.company_id
   WHERE o.id = NEW.office_id
   LIMIT 1;

  IF NEW.employee_id IS NOT NULL AND TRIM(NEW.employee_id) <> '' THEN
    -- Keep caller-provided value if provided
    IF v_prefix IS NOT NULL AND v_prefix <> ''
       AND NOT REGEXP_LIKE(TRIM(NEW.employee_id), CONCAT('^', v_prefix, '[0-9]+$'))
    THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'employee_id does not match company prefix';
    END IF;

    SET NEW.employee_id = TRIM(NEW.employee_id);
  ELSE
    -- No employee_id supplied: require a prefix and auto-generate
    IF v_prefix IS NULL OR v_prefix = '' THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot derive company prefix: invalid office_id or missing company prefix.';
    END IF;

    SET NEW.employee_id = CONCAT(
      v_prefix,
      (SELECT AUTO_INCREMENT
         FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'employee')
    );
  END IF;
END//
DELIMITER ;

-- Additional_managers table
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

-- Additional Managers Audit table
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

-- Emergency_contacts table
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

-- Emergency Contacts Audit table
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

-- Personal Info Audit table
CREATE TABLE `personal_info_audit` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `personal_info_pk_id` int DEFAULT NULL,
  `action_type` enum('INSERT', 'UPDATE', 'DELETE') NOT NULL,
  `action_by` varchar(254) NOT NULL,
  `db_user` varchar(254) NULL,
  `action_on` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `data` json NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pi_audit_pi_pk` (`personal_info_pk_id`),
  KEY `idx_pi_audit_action_on` (`action_on`),
  CONSTRAINT `fk_pi_audit_personal_info` FOREIGN KEY (`personal_info_pk_id`) REFERENCES `personal_info` (`id`) ON DELETE
  SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Employee Audit table
CREATE TABLE `employee_audit` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `employee_pk_id` int DEFAULT NULL,
  `action_type` enum('INSERT', 'UPDATE', 'DELETE') NOT NULL,
  `action_by` varchar(254) NOT NULL,
  `db_user` varchar(254) NULL,
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
  DECLARE v_db_user VARCHAR(254);
  
  SET v_db_user = USER();
  
  INSERT INTO personal_info_audit (personal_info_pk_id, action_type, action_by, db_user, action_on, data)
  VALUES (
    NEW.id,
    'INSERT',
    NEW.created_by,
    v_db_user,
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
  DECLARE v_db_user VARCHAR(254);
  
  SET v_db_user = USER();
  
  INSERT INTO personal_info_audit (personal_info_pk_id, action_type, action_by, db_user, action_on, data)
  VALUES (
    NEW.id,
    'UPDATE',
    NEW.updated_by,
    v_db_user,
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
  DECLARE v_db_user VARCHAR(254);
  
  SET v_db_user = USER();
  
  INSERT INTO employee_audit (employee_pk_id, action_type, action_by, db_user, action_on, data)
  VALUES (
    NEW.id,
    'INSERT',
    NEW.created_by,
    v_db_user,
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
  DECLARE v_db_user VARCHAR(254);
  
  SET v_db_user = USER();
  
  INSERT INTO employee_audit (employee_pk_id, action_type, action_by, db_user, action_on, data)
  VALUES (
    NEW.id,
    'UPDATE',
    NEW.updated_by,
    v_db_user,
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
