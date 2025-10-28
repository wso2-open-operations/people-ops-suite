DROP TABLE IF EXISTS resignation;
DROP TABLE IF EXISTS vehicle;
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
  `nic` VARCHAR(20) UNIQUE,
  `full_name` VARCHAR(150) NOT NULL,
  `name_with_initials` VARCHAR(100),
  `first_name` VARCHAR(100),
  `last_name` VARCHAR(100),
  `title` VARCHAR(100) NULL,
  `dob` DATE,
  `age` INT,
  `personal_email` VARCHAR(254),
  `personal_phone` VARCHAR(20),
  `home_phone` VARCHAR(20),
  `address` VARCHAR(255),
  `postal_code` VARCHAR(20),
  `country` VARCHAR(100),
  `nationality` VARCHAR(100),
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
  `employee_location` VARCHAR(255) NULL,
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
  `last_name` VARCHAR(50) NOT NULL,
  `first_name` VARCHAR(150) NOT NULL,
  `epf` VARCHAR(45) NULL,
  `employee_location` VARCHAR(255) NOT NULL,
  `work_location` VARCHAR(100) NOT NULL,
  `work_email` VARCHAR(254) NOT NULL,
  `work_phone_number` VARCHAR(45) NULL,
  `start_date` DATE NULL,
  `job_role` VARCHAR(100) NOT NULL,
  `manager_email` VARCHAR(254) NULL,
  `report_to_email` VARCHAR(254) NOT NULL,
  `additional_manager_email` VARCHAR(254) NULL,
  `additional_report_to_email` VARCHAR(254) NULL,
  `employee_status` VARCHAR(50) NOT NULL,
  `length_of_service` INT NULL,
  `relocation_status` VARCHAR(50) NULL,
  `employee_thumbnail` VARCHAR(512) NULL,
  `subordinate_count` INT NULL,
  `_timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `probation_end_date` DATE NULL,
  `agreement_end_date` DATE NULL,
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL,
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `employment_type_id` INT NULL,
  `designation_id` INT NOT NULL,
  `office_id` INT NOT NULL,
  `team_id` INT NOT NULL,
  `sub_team_id` INT NULL,
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
    FOREIGN KEY (`unit_id`) REFERENCES `unit` (`id`)
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
  -- Find the company prefix from the employee's office
  SELECT c.prefix
    INTO v_prefix
    FROM office o
    JOIN company c ON c.id = o.company_id
   WHERE o.id = NEW.office_id
   LIMIT 1;
  IF v_prefix IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Cannot derive company prefix: invalid office_id or missing company prefix.';
  END IF;
  SET NEW.employee_id = CONCAT(
    v_prefix, 
    (
      SELECT 
        AUTO_INCREMENT 
      FROM 
        information_schema.TABLES 
      WHERE 
        TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'employee'
    )
  );
END//
DELIMITER ;
