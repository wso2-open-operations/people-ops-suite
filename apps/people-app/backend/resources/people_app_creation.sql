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
DROP TABLE IF EXISTS companies_allowed_locations;
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
  `company_id` int NOT NULL,
  `office_id` INT NULL,
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
  CONSTRAINT `fk_emp_company`
    FOREIGN KEY (`company_id`) REFERENCES `company` (`id`),
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
  -- Look up the company prefix from the company
  SELECT c.prefix
    INTO v_prefix
    FROM company c
   WHERE c.id = NEW.company_id
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
        SET MESSAGE_TEXT = 'Cannot derive company prefix: invalid company_id or missing company prefix.';
    END IF;

    SET NEW.employee_id = CONCAT(
      v_prefix,
      (SELECT AUTO_INCREMENT
         FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'employee')
    );
  END IF;
END IF;
END//
DELIMITER ;

-- Additional_managers table
CREATE TABLE `employee_additional_managers` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `employee_pk_id` INT NOT NULL,
  `additional_manager_email` VARCHAR(254) NOT NULL,
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

-- Emergency_contacts table
CREATE TABLE `personal_info_emergency_contacts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `personal_info_id` INT NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `mobile` VARCHAR(20) NOT NULL,
  `telephone` VARCHAR(20) NOT NULL,
  `relationship` VARCHAR(100) NOT NULL,
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL,
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_ec_personal_info_id` (`personal_info_id`),
  KEY `idx_ec_mobile` (`mobile`),
  CONSTRAINT `fk_ec_personal_info`
    FOREIGN KEY (`personal_info_id`) REFERENCES `personal_info` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Companies allowed locations table
CREATE TABLE `companies_allowed_locations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `company_id` INT NOT NULL,
  `allowed_location` VARCHAR(255) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL,
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cal_company_location` (`company_id`, `allowed_location`),
  KEY `idx_cal_company_id` (`company_id`),
  KEY `idx_cal_location` (`allowed_location`),
  CONSTRAINT `fk_cal_company`
    FOREIGN KEY (`company_id`) REFERENCES `company` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;