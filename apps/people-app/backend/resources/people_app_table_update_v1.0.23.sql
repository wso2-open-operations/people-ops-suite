-- =====================================================================
-- people_app_table_update_v1.0.23.sql
-- PROPOSAL - not yet reviewed or applied to any environment.
--
-- Runs against a database already at v1.0.22.
--
-- Adds the `internship` table for the intern-only data that `employee`
-- does not already hold: university. Every other
-- intern detail is read from the intern's `employee` row.
--
-- Keyed by employee.id (one row per intern), following the `resignation`
-- table pattern.
-- =====================================================================

-- Internship table
CREATE TABLE `internship` (
  `employee_id` INT PRIMARY KEY,
  `university` VARCHAR(200) NULL,
  `created_by` VARCHAR(254) NOT NULL,
  `created_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` VARCHAR(254) NOT NULL,
  `updated_on` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT `fk_emp_internship`
    FOREIGN KEY (`employee_id`) REFERENCES `employee` (`id`)
);
