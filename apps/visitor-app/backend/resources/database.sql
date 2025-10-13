CREATE TABLE `visit_invitation` (
  `invitation_id` int NOT NULL AUTO_INCREMENT,
  `invitee_email` varchar(45) NOT NULL,
  `encode_value` varchar(255) NOT NULL,
  `no_of_visitors` int NOT NULL DEFAULT '1',
  `visit_info` json DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '0',
  `created_by` varchar(255) NOT NULL,
  `created_on` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` varchar(255) NOT NULL,
  `updated_on` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`invitation_id`),
  UNIQUE KEY `unique_encode_value` (`encode_value`)
);

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
  `pass_number` varchar(50) DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `whom_they_meet` varchar(255) NOT NULL,
  `purpose_of_visit` text NOT NULL,
  `accessible_locations` json DEFAULT NULL,
  `time_of_entry` datetime NOT NULL,
  `time_of_departure` datetime NOT NULL,
  `invitation_id` int DEFAULT NULL,
  `rejection_reason` varchar(45) DEFAULT NULL,
  `actioned_by` varchar(45) DEFAULT NULL,
  `invited_by` varchar(45) NOT NULL,
  `status` enum('REQUESTED','APPROVED','REJECTED','COMPLETED') NOT NULL,
  `created_by` varchar(60) NOT NULL,
  `created_on` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_by` varchar(60) NOT NULL,
  `updated_on` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`visit_id`),
  KEY `fk_nic_hash_idx` (`nic_hash`),
  KEY `fk_invitation_id` (`invitation_id`),
  CONSTRAINT `fk_invitation_id` FOREIGN KEY (`invitation_id`) REFERENCES `visit_invitation` (`invitation_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_nic_hash` FOREIGN KEY (`nic_hash`) REFERENCES `visitor` (`nic_hash`)
);
