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
-- Table structure for table `user_ad_view_sessions`
--

DROP TABLE IF EXISTS `user_ad_view_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_ad_view_sessions` (
  `session_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'UUID for session tracking',
  `user_id` int NOT NULL COMMENT 'References users.id',
  `ad_id` int NOT NULL COMMENT 'References admodels.id',
  `ad_model_type` enum('NON_SKIP','SKIP','BUMPER','BRAND_AWARENESS','BUSINESS_STATUS','NON_SKIP_LEAD','BRAND_AWARENESS_QUESTION','NON_SKIP_QUESTION') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Type of ad determining payout rules',
  `watch_time` int DEFAULT '0' COMMENT 'Total seconds watched by user',
  `required_watch_time` int NOT NULL COMMENT 'Minimum seconds required for base payout',
  `total_ad_duration` int NOT NULL COMMENT 'Total ad duration in seconds',
  `last_watch_update` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Last time watch_time was updated',
  `skipped` tinyint(1) DEFAULT '0' COMMENT 'Whether user skipped the ad',
  `skip_time` int DEFAULT NULL COMMENT 'Second at which user clicked skip button',
  `skip_allowed` tinyint(1) DEFAULT '0' COMMENT 'Whether skip is allowed for this ad type',
  `website_visited` tinyint(1) DEFAULT '0' COMMENT 'Whether user clicked website link',
  `website_visit_start_time` timestamp NULL DEFAULT NULL COMMENT 'When user opened advertiser website',
  `website_visit_duration` int DEFAULT '0' COMMENT 'Seconds spent on advertiser website',
  `website_visit_completed` tinyint(1) DEFAULT '0' COMMENT 'TRUE if stayed 30+ seconds',
  `question_shown` tinyint(1) DEFAULT '0' COMMENT 'Whether question modal was displayed',
  `question_answered` tinyint(1) DEFAULT '0' COMMENT 'Whether user submitted an answer',
  `answer_correct` tinyint(1) DEFAULT '0' COMMENT 'Whether answer was correct',
  `user_answer` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'User selected answer',
  `base_payout` decimal(10,2) DEFAULT '0.00' COMMENT 'Payout for watching required duration',
  `bonus_payout` decimal(10,2) DEFAULT '0.00' COMMENT 'Additional payout for interaction (visit/question)',
  `total_payout` decimal(10,2) DEFAULT '0.00' COMMENT 'base_payout + bonus_payout',
  `payout_processed` tinyint(1) DEFAULT '0' COMMENT 'Whether payout has been credited',
  `payout_processed_at` timestamp NULL DEFAULT NULL COMMENT 'When payout was processed',
  `status` enum('ACTIVE','COMPLETED','ABANDONED','FRAUD','EXPIRED') COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE' COMMENT 'Current session state',
  `fraud_score` int DEFAULT '0' COMMENT 'Calculated fraud risk score (0-100)',
  `fraud_reasons` json DEFAULT NULL COMMENT 'Array of fraud indicators detected',
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'User IP address for fraud detection',
  `user_agent` text COLLATE utf8mb4_unicode_ci COMMENT 'User browser/device info',
  `device_info` json DEFAULT NULL COMMENT 'Additional device metadata',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Session start time',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update time',
  PRIMARY KEY (`session_id`),
  KEY `idx_user_status` (`user_id`,`status`),
  KEY `idx_ad_status` (`ad_id`,`status`),
  KEY `idx_payout` (`payout_processed`,`status`),
  KEY `idx_created` (`created_at`),
  KEY `idx_fraud` (`fraud_score`,`status`),
  CONSTRAINT `user_ad_view_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_ad_view_sessions_ibfk_2` FOREIGN KEY (`ad_id`) REFERENCES `admodels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tracks user ad viewing sessions with watch time and rewards';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-11 10:46:06
