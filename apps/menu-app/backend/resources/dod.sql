CREATE DATABASE `dinner_on_demand` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

CREATE TABLE `dinner_bookings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(45) NOT NULL,
  `meal_option` varchar(45) NOT NULL,
  `date` varchar(45) NOT NULL,
  `is_active` tinyint NOT NULL DEFAULT '1',
  `department` varchar(299) DEFAULT NULL,
  `team` varchar(299) DEFAULT NULL,
  `manager_email` varchar(45) DEFAULT NULL,
  `_timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_email_date` (`email`, `date`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
