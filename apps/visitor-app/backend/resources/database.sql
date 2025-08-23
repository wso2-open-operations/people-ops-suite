CREATE TABLE `visitor` (
  `nic_hash` varchar(64) NOT NULL,
  `name` varchar(255) NOT NULL,
  `nic_number` varchar(255) NOT NULL,
  `contact_number` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `created_by` varchar(60) NOT NULL,
  `created_on` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` varchar(60) DEFAULT NULL,
  `updated_on` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`nic_hash`)
);

CREATE TABLE `visit` (
  `visit_id` int NOT NULL AUTO_INCREMENT,
  `nic_hash` varchar(64) NOT NULL,
  `pass_number` varchar(50) NOT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `whom_they_meet` varchar(255) NOT NULL,
  `purpose_of_visit` text NOT NULL,
  `accessible_locations` json NOT NULL,
  `time_of_entry` datetime NOT NULL,
  `time_of_departure` datetime NOT NULL,
  `status` enum('PENDING','ACCEPTED','REJECTED') NOT NULL,
  `created_by` varchar(60) NOT NULL,
  `created_on` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` varchar(60) NOT NULL,
  `updated_on` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`visit_id`),
  KEY `fk_nic_hash_idx` (`nic_hash`),
  CONSTRAINT `fk_nic_hash` FOREIGN KEY (`nic_hash`) REFERENCES `visitor` (`nic_hash`)
);
