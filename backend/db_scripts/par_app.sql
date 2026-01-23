-- MySQL dump 10.13  Distrib 8.0.34, for macos13 (arm64)
--
-- Host: localhost    Database: hris
-- ------------------------------------------------------
-- Server version	8.0.35

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `hris_par_360_review`
--

DROP TABLE IF EXISTS `hris_par_360_review`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hris_par_360_review` (
  `par_employee_email` varchar(60) NOT NULL,
  `par_reviewer_email` varchar(60) NOT NULL,
  `par_cycle_id` int NOT NULL,
  `par_360_rating` blob NOT NULL,
  `par_360_comment` mediumblob,
  `par_360_status` varchar(30) NOT NULL,
  `par_360_employee_requested` tinyint(1) NOT NULL DEFAULT '0',
  `par_360_lead_requested` tinyint(1) NOT NULL DEFAULT '0',
  `par_360_created_by` varchar(60) NOT NULL,
  `par_360_created_on` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `par_360_updated_by` varchar(60) NOT NULL,
  `par_360_updated_on` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`par_employee_email`,`par_reviewer_email`,`par_cycle_id`),
  KEY `fk_par_360_review_par_cycle_idx` (`par_cycle_id`),
  CONSTRAINT `fk_par_360_review_par_cycle` FOREIGN KEY (`par_cycle_id`) REFERENCES `hris_par_cycle` (`par_cycle_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=CURRENT_USER*/ /*!50003 TRIGGER `hris_par_360_review_AFTER_UPDATE` AFTER UPDATE ON `hris_par_360_review` FOR EACH ROW BEGIN
	IF (NEW.par_360_rating <> OLD.par_360_rating) OR
    (NEW.par_360_status <> OLD.par_360_status) OR
    (NEW.par_360_employee_requested <> OLD.par_360_employee_requested) OR
    (NEW.par_360_lead_requested <> OLD.par_360_lead_requested) THEN
		INSERT INTO hris_par_360_review_audit (
			par_employee_email,
			par_reviewer_email,
			par_cycle_id,
			par_360_rating,
			par_360_comment,
			par_360_status,
			par_360_employee_requested,
			par_360_lead_requested,
			par_360_created_by,
			par_360_created_on,
			par_360_updated_by,
			par_360_updated_on
		) VALUES (
			OLD.par_employee_email,
			OLD.par_reviewer_email,
			OLD.par_cycle_id,
			OLD.par_360_rating,
			OLD.par_360_comment,
			OLD.par_360_status,
			OLD.par_360_employee_requested,
			OLD.par_360_lead_requested,
			OLD.par_360_created_by,
			OLD.par_360_created_on,
			OLD.par_360_updated_by,
			OLD.par_360_updated_on
		);
	END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=CURRENT_USER*/ /*!50003 TRIGGER `hris_par_360_review_AFTER_DELETE` AFTER DELETE ON `hris_par_360_review` FOR EACH ROW BEGIN
	INSERT INTO hris_par_360_review_audit (
		par_employee_email,
		par_reviewer_email,
		par_cycle_id,
		par_360_rating,
		par_360_comment,
		par_360_status,
		par_360_employee_requested,
		par_360_lead_requested,
		par_360_created_by,
		par_360_created_on,
		par_360_updated_by,
		par_360_updated_on
	) VALUES (
		OLD.par_employee_email,
		OLD.par_reviewer_email,
		OLD.par_cycle_id,
		OLD.par_360_rating,
		OLD.par_360_comment,
		OLD.par_360_status,
		OLD.par_360_employee_requested,
		OLD.par_360_lead_requested,
		OLD.par_360_created_by,
		OLD.par_360_created_on,
		OLD.par_360_updated_by,
		OLD.par_360_updated_on
	);
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `hris_par_360_review_audit`
--

DROP TABLE IF EXISTS `hris_par_360_review_audit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hris_par_360_review_audit` (
  `par_360_audit_id` int NOT NULL AUTO_INCREMENT,
  `par_360_audit_timestamp` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `par_employee_email` varchar(60) NOT NULL,
  `par_reviewer_email` varchar(60) NOT NULL,
  `par_cycle_id` int NOT NULL,
  `par_360_rating` blob NOT NULL,
  `par_360_comment` mediumblob,
  `par_360_status` varchar(30) NOT NULL,
  `par_360_employee_requested` tinyint(1) NOT NULL DEFAULT '0',
  `par_360_lead_requested` tinyint(1) NOT NULL DEFAULT '0',
  `par_360_created_by` varchar(60) NOT NULL,
  `par_360_created_on` timestamp(6) NOT NULL,
  `par_360_updated_by` varchar(60) NOT NULL,
  `par_360_updated_on` timestamp(6) NOT NULL,
  PRIMARY KEY (`par_360_audit_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hris_par_configs`
--

DROP TABLE IF EXISTS `hris_par_configs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hris_par_configs` (
  `par_config_key` varchar(100) NOT NULL,
  `par_config_value` mediumtext NOT NULL,
  `par_config_created_by` varchar(60) NOT NULL,
  `par_config_created_on` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `par_config_updated_by` varchar(60) NOT NULL,
  `par_config_updated_on` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`par_config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hris_par_cycle`
--

DROP TABLE IF EXISTS `hris_par_cycle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hris_par_cycle` (
  `par_cycle_id` int NOT NULL AUTO_INCREMENT,
  `par_cycle_name` varchar(100) NOT NULL,
  `par_cycle_start_date` date NOT NULL,
  `par_cycle_end_date` date NOT NULL,
  `par_evaluation_start_date` date NOT NULL,
  `par_evaluation_end_date` date NOT NULL,
  `par_special_rating_deadline` date NOT NULL,
  `par_employee_deadline` date NOT NULL,
  `par_lead_deadline` date NOT NULL,
  `par_three_sixty_rating_deadline` date NOT NULL,
  `par_cycle_config` mediumtext NOT NULL,
  `par_cycle_status` varchar(30) NOT NULL,
  `par_cycle_created_by` varchar(60) NOT NULL,
  `par_cycle_created_on` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `par_cycle_updated_by` varchar(60) NOT NULL,
  `par_cycle_updated_on` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`par_cycle_id`),
  KEY `par_cycle_id_idx` (`par_cycle_id`),
  KEY `par_cycle_status_idx` (`par_cycle_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=CURRENT_USER*/ /*!50003 TRIGGER `hris_par_cycle_AFTER_UPDATE` AFTER UPDATE ON `hris_par_cycle` FOR EACH ROW BEGIN
  IF (NEW.par_cycle_name <> OLD.par_cycle_name) OR
    (NEW.par_cycle_start_date <> OLD.par_cycle_start_date) OR
    (NEW.par_cycle_end_date <> OLD.par_cycle_end_date) OR
    (NEW.par_evaluation_start_date <> OLD.par_evaluation_start_date) OR
    (NEW.par_evaluation_end_date <> OLD.par_evaluation_end_date) OR
    (NEW.par_special_rating_deadline <> OLD.par_special_rating_deadline) OR
    (NEW.par_employee_deadline <> OLD.par_employee_deadline) OR
    (NEW.par_lead_deadline <> OLD.par_lead_deadline) OR
    (NEW.par_three_sixty_rating_deadline <> OLD.par_three_sixty_rating_deadline) OR
    (NEW.par_cycle_config <> OLD.par_cycle_config) OR
    (NEW.par_cycle_status <> OLD.par_cycle_status) THEN
    INSERT INTO hris_par_cycle_audit (
        par_cycle_id,
        par_cycle_name,
        par_cycle_start_date,
        par_cycle_end_date,
        par_evaluation_start_date,
        par_evaluation_end_date,
        par_special_rating_deadline,
        par_employee_deadline,
        par_lead_deadline,
        par_three_sixty_rating_deadline,
        par_cycle_config,
        par_cycle_status,
        par_cycle_created_by,
        par_cycle_created_on,
        par_cycle_updated_by,
        par_cycle_updated_on
    ) VALUES (
        OLD.par_cycle_id,
        OLD.par_cycle_name,
        OLD.par_cycle_start_date,
        OLD.par_cycle_end_date,
        OLD.par_evaluation_start_date,
        OLD.par_evaluation_end_date,
        OLD.par_special_rating_deadline,
        OLD.par_employee_deadline,
        OLD.par_lead_deadline,
        OLD.par_three_sixty_rating_deadline,
        OLD.par_cycle_config,
        OLD.par_cycle_status,
        OLD.par_cycle_created_by,
        OLD.par_cycle_created_on,
        OLD.par_cycle_updated_by,
        OLD.par_cycle_updated_on
    );
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=CURRENT_USER*/ /*!50003 TRIGGER `hris_par_cycle_AFTER_DELETE` AFTER DELETE ON `hris_par_cycle` FOR EACH ROW BEGIN
  INSERT INTO hris_par_cycle_audit (
    par_cycle_id,
    par_cycle_name,
    par_cycle_start_date,
    par_cycle_end_date,
    par_evaluation_start_date,
    par_evaluation_end_date,
    par_special_rating_deadline,
    par_employee_deadline,
    par_lead_deadline,
    par_three_sixty_rating_deadline,
    par_cycle_config,
    par_cycle_status,
    par_cycle_created_by,
    par_cycle_created_on,
    par_cycle_updated_by,
    par_cycle_updated_on
  ) VALUES (
    OLD.par_cycle_id,
    OLD.par_cycle_name,
    OLD.par_cycle_start_date,
    OLD.par_cycle_end_date,
    OLD.par_evaluation_start_date,
    OLD.par_evaluation_end_date,
    OLD.par_special_rating_deadline,
    OLD.par_employee_deadline,
    OLD.par_lead_deadline,
    OLD.par_three_sixty_rating_deadline,
    OLD.par_cycle_config,
    OLD.par_cycle_status,
    OLD.par_cycle_created_by,
    OLD.par_cycle_created_on,
    OLD.par_cycle_updated_by,
    OLD.par_cycle_updated_on
  );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `hris_par_cycle_audit`
--

DROP TABLE IF EXISTS `hris_par_cycle_audit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hris_par_cycle_audit` (
  `par_cycle_audit_id` int NOT NULL AUTO_INCREMENT,
  `par_cycle_audit_timestamp` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `par_cycle_id` int NOT NULL,
  `par_cycle_name` varchar(100) NOT NULL,
  `par_cycle_start_date` date NOT NULL,
  `par_cycle_end_date` date NOT NULL,
  `par_evaluation_start_date` date NOT NULL,
  `par_evaluation_end_date` date NOT NULL,
  `par_special_rating_deadline` date NOT NULL,
  `par_employee_deadline` date NOT NULL,
  `par_lead_deadline` date NOT NULL,
  `par_three_sixty_rating_deadline` date NOT NULL,
  `par_cycle_config` mediumtext NOT NULL,
  `par_cycle_status` varchar(30) NOT NULL,
  `par_cycle_created_by` varchar(60) NOT NULL,
  `par_cycle_created_on` timestamp(6) NOT NULL,
  `par_cycle_updated_by` varchar(60) NOT NULL,
  `par_cycle_updated_on` timestamp(6) NOT NULL,
  PRIMARY KEY (`par_cycle_audit_id`),
  KEY `par_cycle_id_idx` (`par_cycle_id`),
  KEY `par_cycle_status_idx` (`par_cycle_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hris_par_email`
--

DROP TABLE IF EXISTS `hris_par_email`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hris_par_email` (
  `par_email_id` int NOT NULL AUTO_INCREMENT,
  `par_cycle_id` int NOT NULL,
  `par_email_recipient_email` varchar(60) NOT NULL,
  `par_email_recipient_name` varchar(100) NOT NULL,
  `par_email_type` varchar(60) NOT NULL,
  `par_email_trigger_details` varchar(100) NOT NULL,
  `par_email_status` varchar(30) NOT NULL,
  `par_email_template_data` mediumblob NOT NULL,
  PRIMARY KEY (`par_email_id`),
  UNIQUE KEY `par_email_UNIQUE` (`par_cycle_id`,`par_email_recipient_email`,`par_email_type`,`par_email_trigger_details`),
  KEY `fk_par_email_notification_par_cycle_idx` (`par_cycle_id`),
  CONSTRAINT `fk_par_email_notification_par_cycle` FOREIGN KEY (`par_cycle_id`) REFERENCES `hris_par_cycle` (`par_cycle_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hris_par_rating`
--

DROP TABLE IF EXISTS `hris_par_rating`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hris_par_rating` (
  `par_rating_id` int NOT NULL AUTO_INCREMENT,
  `par_employee_email` varchar(60) NOT NULL,
  `par_employee_name` varchar(100) NOT NULL,
  `par_cycle_id` int NOT NULL,
  `par_company` varchar(60) NOT NULL,
  `par_location` varchar(60) NOT NULL,
  `par_team_id` int NOT NULL DEFAULT '0',
  `par_rating` blob NOT NULL,
  `par_special_rating` blob NOT NULL,
  `par_employee_comment` mediumblob,
  `par_employee_status` varchar(30) NOT NULL,
  `par_lead_comment` mediumblob,
  `par_lead_status` varchar(30) NOT NULL,
  `par_f2f_status` varchar(30) NOT NULL,
  `par_f2f_date` timestamp(6) NULL DEFAULT NULL,
  `par_employee_acceptance_status` varchar(30) NOT NULL,
  `par_employee_acceptance_comment` mediumblob,
  `par_admin_comment` mediumblob,
  `par_rating_created_by` varchar(60) NOT NULL,
  `par_rating_created_on` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `par_rating_updated_by` varchar(60) NOT NULL,
  `par_rating_updated_on` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`par_rating_id`),
  UNIQUE KEY `par_employee_email_cycle_id_UNIQUE` (`par_employee_email`,`par_cycle_id`),
  KEY `fk_par_rating_par_cycle_idx` (`par_cycle_id`),
  KEY `fk_par_rating_par_team_idx` (`par_team_id`),
  CONSTRAINT `fk_par_rating_par_cycle` FOREIGN KEY (`par_cycle_id`) REFERENCES `hris_par_cycle` (`par_cycle_id`),
  CONSTRAINT `fk_par_rating_par_team` FOREIGN KEY (`par_team_id`) REFERENCES `hris_par_team` (`par_team_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=CURRENT_USER*/ /*!50003 TRIGGER `hris_par_rating_AFTER_UPDATE` AFTER UPDATE ON `hris_par_rating` FOR EACH ROW BEGIN
    IF (NEW.par_rating <> OLD.par_rating) OR
		(NEW.par_special_rating <> OLD.par_special_rating) OR
		(NEW.par_employee_status <> OLD.par_employee_status) OR
        (NEW.par_lead_status <> OLD.par_lead_status) OR
        (NEW.par_f2f_status <> OLD.par_f2f_status) OR
        (NEW.par_employee_acceptance_status <> OLD.par_employee_acceptance_status) OR
        (NEW.par_admin_comment <> OLD.par_admin_comment) THEN
		INSERT INTO hris_par_rating_audit (
			par_rating_id,
			par_employee_email,
			par_employee_name,
			par_cycle_id,
			par_company,
			par_location,
			par_team_id,
			par_rating,
			par_special_rating,
			par_employee_comment,
			par_employee_status,
			par_lead_comment,
			par_lead_status,
			par_f2f_status,
			par_f2f_date,
			par_employee_acceptance_status,
			par_employee_acceptance_comment,
			par_admin_comment,
			par_rating_created_by,
			par_rating_created_on,
			par_rating_updated_by,
			par_rating_updated_on
		) VALUES (
			OLD.par_rating_id,
			OLD.par_employee_email,
			OLD.par_employee_name,
			OLD.par_cycle_id,
			OLD.par_company,
			OLD.par_location,
			OLD.par_team_id,
			OLD.par_rating,
			OLD.par_special_rating,
			OLD.par_employee_comment,
			OLD.par_employee_status,
			OLD.par_lead_comment,
			OLD.par_lead_status,
			OLD.par_f2f_status,
			OLD.par_f2f_date,
			OLD.par_employee_acceptance_status,
			OLD.par_employee_acceptance_comment,
			OLD.par_admin_comment,
			OLD.par_rating_created_by,
			OLD.par_rating_created_on,
			OLD.par_rating_updated_by,
			OLD.par_rating_updated_on
		);
	END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=CURRENT_USER*/ /*!50003 TRIGGER `hris_par_rating_AFTER_DELETE` AFTER DELETE ON `hris_par_rating` FOR EACH ROW BEGIN
	INSERT INTO hris_par_rating_audit (
		par_rating_id,
        par_employee_email,
        par_employee_name,
        par_cycle_id,
        par_company,
        par_location,
        par_team_id,
        par_rating,
        par_special_rating,
        par_employee_comment,
        par_employee_status,
        par_lead_comment,
        par_lead_status,
        par_f2f_status,
        par_f2f_date,
        par_employee_acceptance_status,
        par_employee_acceptance_comment,
        par_admin_comment,
        par_rating_created_by,
        par_rating_created_on,
        par_rating_updated_by,
        par_rating_updated_on
    ) VALUES (
		OLD.par_rating_id,
        OLD.par_employee_email,
        OLD.par_employee_name,
        OLD.par_cycle_id,
        OLD.par_company,
        OLD.par_location,
        OLD.par_team_id,
        OLD.par_rating,
        OLD.par_special_rating,
        OLD.par_employee_comment,
        OLD.par_employee_status,
        OLD.par_lead_comment,
        OLD.par_lead_status,
        OLD.par_f2f_status,
        OLD.par_f2f_date,
        OLD.par_employee_acceptance_status,
        OLD.par_employee_acceptance_comment,
        OLD.par_admin_comment,
        OLD.par_rating_created_by,
        OLD.par_rating_created_on,
        OLD.par_rating_updated_by,
        OLD.par_rating_updated_on
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `hris_par_rating_audit`
--

DROP TABLE IF EXISTS `hris_par_rating_audit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hris_par_rating_audit` (
  `par_rating_audit_id` int NOT NULL AUTO_INCREMENT,
  `par_rating_audit_timestamp` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `par_rating_id` int NOT NULL,
  `par_employee_email` varchar(60) NOT NULL,
  `par_employee_name` varchar(100) NOT NULL,
  `par_cycle_id` int NOT NULL,
  `par_company` varchar(60) NOT NULL,
  `par_location` varchar(60) NOT NULL,
  `par_team_id` int NOT NULL DEFAULT '0',
  `par_rating` blob NOT NULL,
  `par_special_rating` blob NOT NULL,
  `par_employee_comment` mediumblob,
  `par_employee_status` varchar(30) NOT NULL,
  `par_lead_comment` mediumblob,
  `par_lead_status` varchar(30) NOT NULL,
  `par_f2f_status` varchar(30) NOT NULL,
  `par_f2f_date` timestamp(6) NULL DEFAULT NULL,
  `par_employee_acceptance_status` varchar(30) NOT NULL,
  `par_employee_acceptance_comment` mediumblob,
  `par_admin_comment` mediumblob,
  `par_rating_created_by` varchar(60) NOT NULL,
  `par_rating_created_on` timestamp(6) NOT NULL,
  `par_rating_updated_by` varchar(60) NOT NULL,
  `par_rating_updated_on` timestamp(6) NOT NULL,
  PRIMARY KEY (`par_rating_audit_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hris_par_special_rating_group`
--

DROP TABLE IF EXISTS `hris_par_special_rating_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hris_par_special_rating_group` (
  `par_special_rating_group_id` int NOT NULL AUTO_INCREMENT,
  `par_cycle_id` int NOT NULL,
  `par_business_unit` varchar(100) NOT NULL,
  `par_department` varchar(100) NOT NULL,
  `par_special_quota_id` int DEFAULT NULL,
  `par_sr_group_created_by` varchar(60) NOT NULL,
  `par_sr_group_created_on` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `par_sr_group_updated_by` varchar(60) NOT NULL,
  `par_sr_group_updated_on` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`par_special_rating_group_id`),
  KEY `fk_hris_par_special_rating_department_par_cycle_idx` (`par_cycle_id`),
  CONSTRAINT `fk_hris_par_special_rating_department_par_cycle` FOREIGN KEY (`par_cycle_id`) REFERENCES `hris_par_cycle` (`par_cycle_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hris_par_special_rating_quota`
--

DROP TABLE IF EXISTS `hris_par_special_rating_quota`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hris_par_special_rating_quota` (
  `par_quota_id` int NOT NULL AUTO_INCREMENT,
  `par_cycle_id` int NOT NULL,
  `par_special_quota_name` varchar(100) DEFAULT NULL,
  `par_top5_quota` int NOT NULL DEFAULT '0',
  `par_top20_quota` int NOT NULL DEFAULT '0',
  `par_sr_quota_created_by` varchar(60) NOT NULL,
  `par_sr_quota_created_on` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `par_sr_quota_updated_by` varchar(60) NOT NULL,
  `par_sr_quota_updated_on` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`par_quota_id`),
  KEY `fk_par_special_rating_quota_par_cycle_idx` (`par_cycle_id`),
  CONSTRAINT `fk_par_special_rating_quota_par_cycle` FOREIGN KEY (`par_cycle_id`) REFERENCES `hris_par_cycle` (`par_cycle_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hris_par_team`
--

DROP TABLE IF EXISTS `hris_par_team`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hris_par_team` (
  `par_team_id` int NOT NULL AUTO_INCREMENT,
  `par_cycle_id` int NOT NULL,
  `par_business_unit` varchar(100) NOT NULL,
  `par_department` varchar(100) NOT NULL,
  `par_team` varchar(100) NOT NULL,
  `par_sub_team` varchar(100) DEFAULT NULL,
  `par_lead_email` varchar(60) NOT NULL,
  `par_special_rating_group_id` int NOT NULL,
  `par_team_created_by` varchar(60) NOT NULL,
  `par_team_created_on` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `par_team_updated_by` varchar(60) NOT NULL,
  `par_team_updated_on` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`par_team_id`),
  KEY `fk_par_team_par_cycle_idx` (`par_cycle_id`),
  KEY `fk_par_team_par_special_rating_department_idx` (`par_special_rating_group_id`),
  CONSTRAINT `fk_par_team_par_cycle` FOREIGN KEY (`par_cycle_id`) REFERENCES `hris_par_cycle` (`par_cycle_id`),
  CONSTRAINT `fk_par_team_par_special_rating_department` FOREIGN KEY (`par_special_rating_group_id`) REFERENCES `hris_par_special_rating_group` (`par_special_rating_group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-06-09  7:53:48
