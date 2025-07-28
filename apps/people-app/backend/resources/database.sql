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
)
