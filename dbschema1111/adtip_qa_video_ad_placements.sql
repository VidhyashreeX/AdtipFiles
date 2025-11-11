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
-- Table structure for table `video_ad_placements`
--

DROP TABLE IF EXISTS `video_ad_placements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `video_ad_placements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `creative_id` int NOT NULL,
  `placement_type` enum('pre-roll','mid-roll','post-roll','banner','overlay') COLLATE utf8mb4_unicode_ci NOT NULL,
  `cue_point_seconds` int DEFAULT NULL COMMENT 'For mid-roll: when to show (e.g., 300 = 5min mark)',
  `cue_point_percentage` int DEFAULT NULL COMMENT 'Alternative: percentage of video (e.g., 50 = halfway)',
  `target_video_categories` text COLLATE utf8mb4_unicode_ci COMMENT 'JSON array of category IDs',
  `target_video_ids` text COLLATE utf8mb4_unicode_ci COMMENT 'JSON array of specific video IDs',
  `min_video_duration` int DEFAULT NULL COMMENT 'Only show on videos longer than X seconds',
  `priority` int DEFAULT '1' COMMENT 'Higher priority = shown first',
  `frequency_cap` int DEFAULT NULL COMMENT 'Max times per user per day',
  `is_active` tinyint(1) DEFAULT '1',
  `created_date` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_creative` (`creative_id`),
  KEY `idx_placement_type` (`placement_type`),
  KEY `idx_priority` (`priority`),
  KEY `idx_ad_request` (`placement_type`,`is_active`,`priority` DESC),
  CONSTRAINT `fk_placement_creative` FOREIGN KEY (`creative_id`) REFERENCES `video_ad_creatives` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-11 10:45:56
