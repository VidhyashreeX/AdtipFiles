-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: 13.203.57.213    Database: adtip_qa
-- ------------------------------------------------------
-- Server version	8.0.43-0ubuntu0.24.04.1

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
-- Table structure for table `company`
--

DROP TABLE IF EXISTS `company`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company` (
  `id` int NOT NULL AUTO_INCREMENT,
  `is_verified` int DEFAULT NULL,
  `company_name_in_gst` longtext COLLATE utf8mb4_unicode_ci,
  `gst_number` longtext COLLATE utf8mb4_unicode_ci,
  `gst_img` longtext COLLATE utf8mb4_unicode_ci,
  `bank_name` longtext COLLATE utf8mb4_unicode_ci,
  `account_name` longtext COLLATE utf8mb4_unicode_ci,
  `account_number` longtext COLLATE utf8mb4_unicode_ci,
  `ifsc_code` longtext COLLATE utf8mb4_unicode_ci,
  `pan_number` longtext COLLATE utf8mb4_unicode_ci,
  `pan_img` longtext COLLATE utf8mb4_unicode_ci,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `industry` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `about` varchar(455) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci,
  `button` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `coverimage` varchar(455) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profileimage` varchar(455) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profileFilename` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `coverFilename` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `followers` int DEFAULT '0',
  `rating` int DEFAULT '0',
  `is_active` int DEFAULT NULL,
  `createdby` int DEFAULT NULL,
  `createddate` datetime DEFAULT NULL,
  `updatedate` datetime DEFAULT NULL,
  `qr_code_image` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `question` text COLLATE utf8mb4_unicode_ci COMMENT 'Quiz question for BRAND_AWARENESS_QUESTION and NON_SKIP_QUESTION ads',
  `question_answer` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Correct answer to the question',
  `question_options` json DEFAULT NULL COMMENT 'Multiple choice options as JSON array ["Option 1", "Option 2", "Option 3", "Option 4"]',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_comany_user_id` (`createdby`,`name`)
) ENGINE=InnoDB AUTO_INCREMENT=1698 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-11 10:45:06
