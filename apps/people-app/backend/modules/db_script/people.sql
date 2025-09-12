SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS `hris_people`;
CREATE DATABASE `hris_people`;
USE `hris_people`;

SET FOREIGN_KEY_CHECKS = 1;

-- Org structure tables
CREATE TABLE `hris_business_unit` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  `head_email` VARCHAR(254) NOT NULL,
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL,
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `hris_team` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  `head_email` VARCHAR(254) NOT NULL,
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL,
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- BU <-> Team link table
CREATE TABLE `hris_business_unit_team` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `business_unit_id` INT NOT NULL,
  `team_id` INT NOT NULL,
  `head_email` VARCHAR(254) NOT NULL,
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL,
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_but_bu`
    FOREIGN KEY (`business_unit_id`) REFERENCES `hris_business_unit` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_but_team`
    FOREIGN KEY (`team_id`) REFERENCES `hris_team` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY `uk_bu_team` (`business_unit_id`, `team_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `hris_sub_team` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  `head_email` VARCHAR(254) NOT NULL,
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL,
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- (BU-Team) <-> SubTeam link table
CREATE TABLE `hris_business_unit_team_sub_team` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `business_unit_team_id` INT NOT NULL,
  `sub_team_id` INT NOT NULL,
  `head_email` VARCHAR(254) NOT NULL,
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL,
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_butst_but`
    FOREIGN KEY (`business_unit_team_id`) REFERENCES `hris_business_unit_team` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_butst_st`
    FOREIGN KEY (`sub_team_id`) REFERENCES `hris_sub_team` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY `uk_but_subteam` (`business_unit_team_id`, `sub_team_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `hris_unit` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  `head_email` VARCHAR(254) NOT NULL,
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL,
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- (BU-Team-SubTeam) <-> Unit link table
CREATE TABLE `hris_business_unit_team_sub_team_unit` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `business_unit_team_sub_team_id` INT NOT NULL,
  `unit_id` INT NOT NULL,
  `head_email` VARCHAR(254) NOT NULL,
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL,
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_butstu_butst`
    FOREIGN KEY (`business_unit_team_sub_team_id`) REFERENCES `hris_business_unit_team_sub_team` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_butstu_unit`
    FOREIGN KEY (`unit_id`) REFERENCES `hris_unit` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY `uk_butst_unit` (`business_unit_team_sub_team_id`, `unit_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Company table
CREATE TABLE `company` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `location` VARCHAR(255) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL,
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Career_function table
CREATE TABLE `career_function` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `career_function` VARCHAR(150) NOT NULL,
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Designation table
CREATE TABLE `designation` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `designation` VARCHAR(150) NOT NULL,
  `job_band` VARCHAR(50) NULL,
  `status` VARCHAR(50) NULL,
  `career_function_id` INT NULL,
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL,
  CONSTRAINT `fk_designation_career_function`
    FOREIGN KEY (`career_function_id`) REFERENCES `career_function` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Resignation table
CREATE TABLE `resignation` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `final_day_in_office` DATE NULL,
  `final_day_of_employment` DATE NULL,
  `reason` VARCHAR(300) NULL,
  `date` DATE NULL,
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Employment_types table
CREATE TABLE `employment_type` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL,
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `is_active` TINYINT(1) NULL DEFAULT 1, 
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_employment_type_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
  `language_spoken` JSON,
  `nok_info` JSON,
  `onboarding_documents` JSON,
  `education_info` JSON,
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL,
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Recruit table
CREATE TABLE `recruit` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `first_name` VARCHAR(255) NOT NULL,
  `last_name` VARCHAR(255) NOT NULL,
  `wso2_email` VARCHAR(254) NULL,
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
    FOREIGN KEY (`personal_info_id`) REFERENCES `personal_info` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_recruit_bu`
    FOREIGN KEY (`business_unit`) REFERENCES `hris_business_unit` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_recruit_team`
    FOREIGN KEY (`team`) REFERENCES `hris_team` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_recruit_subteam`
    FOREIGN KEY (`sub_team`) REFERENCES `hris_sub_team` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_recruit_unit`
    FOREIGN KEY (`unit`) REFERENCES `hris_unit` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_recruit_company`
    FOREIGN KEY (`company`) REFERENCES `company` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_recruit_office`
    FOREIGN KEY (`office`) REFERENCES `office` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_recruit_designation`
    FOREIGN KEY (`designation_id`) REFERENCES `designation` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_recruit_employment_type`
    FOREIGN KEY (`employment_type`) REFERENCES `employment_type` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Employee table
CREATE TABLE `employee` (
  `id` VARCHAR(99) PRIMARY KEY,
  `last_name` VARCHAR(50) NOT NULL,
  `first_name` VARCHAR(150) NOT NULL,
  `epf` VARCHAR(45) NULL,
  `employee_location` VARCHAR(255) NULL,
  `work_location` VARCHAR(100) NULL,
  `wso2_email` VARCHAR(254) NOT NULL,
  `work_phone_number` VARCHAR(45) NULL,
  `start_date` DATE NULL,
  `job_role` VARCHAR(100) NULL,
  `manager_email` VARCHAR(254) NULL,
  `report_to_email` VARCHAR(254) NULL,
  `additional_manager_email` VARCHAR(254) NULL,
  `additional_report_to_email` VARCHAR(254) NULL,
  `employee_status` VARCHAR(50) NULL,
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
  `resignation_id` INT NULL,
  `designation_id` INT NULL,
  `office_id` INT NULL,
  `team_id` INT NULL,
  `sub_team_id` INT NULL,
  `business_unit_id` INT NULL,
  `unit_id` INT NULL,
  `personal_info_id` INT NOT NULL,
  CONSTRAINT `fk_emp_personal_info`
    FOREIGN KEY (`personal_info_id`) REFERENCES `personal_info` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_emp_employment_type`
    FOREIGN KEY (`employment_type_id`) REFERENCES `employment_type` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_emp_resignation`
    FOREIGN KEY (`resignation_id`) REFERENCES `resignation` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_emp_designation`
    FOREIGN KEY (`designation_id`) REFERENCES `designation` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_emp_office`
    FOREIGN KEY (`office_id`) REFERENCES `office` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_emp_team`
    FOREIGN KEY (`team_id`) REFERENCES `hris_team` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_emp_subteam`
    FOREIGN KEY (`sub_team_id`) REFERENCES `hris_sub_team` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_emp_bu`
    FOREIGN KEY (`business_unit_id`) REFERENCES `hris_business_unit` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_emp_unit`
    FOREIGN KEY (`unit_id`) REFERENCES `hris_unit` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
