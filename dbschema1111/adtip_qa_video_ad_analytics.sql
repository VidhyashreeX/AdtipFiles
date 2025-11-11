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
-- Table structure for table `video_ad_analytics`
--

DROP TABLE IF EXISTS `video_ad_analytics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `video_ad_analytics` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `creative_id` int NOT NULL,
  `placement_id` int NOT NULL,
  `campaign_id` int NOT NULL,
  `user_id` int DEFAULT NULL COMMENT 'Viewer user ID (NULL for anonymous)',
  `video_id` int DEFAULT NULL COMMENT 'Content video being watched',
  `session_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Unique playback session',
  `event_type` enum('request','impression','start','first_quartile','midpoint','third_quartile','complete','skip','click','close','error') COLLATE utf8mb4_unicode_ci NOT NULL,
  `time_watched_seconds` decimal(10,2) DEFAULT NULL COMMENT 'How long ad was actually watched',
  `video_position_seconds` int DEFAULT NULL COMMENT 'Where in content video ad was shown',
  `error_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `error_message` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `billable` tinyint(1) DEFAULT '0' COMMENT 'Should this event be billed?',
  `billing_amount` decimal(10,4) DEFAULT NULL COMMENT 'Amount to charge advertiser',
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `platform` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'web, mobile, tablet',
  `event_timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_date` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_creative` (`creative_id`),
  KEY `idx_campaign` (`campaign_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_event_type` (`event_type`),
  KEY `idx_event_timestamp` (`event_timestamp`),
  KEY `idx_session` (`session_id`),
  KEY `idx_billable` (`billable`),
  KEY `idx_analytics_reporting` (`campaign_id`,`event_type`,`event_timestamp`),
  CONSTRAINT `fk_analytics_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `admodels` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_analytics_creative` FOREIGN KEY (`creative_id`) REFERENCES `video_ad_creatives` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-11 10:44:49
