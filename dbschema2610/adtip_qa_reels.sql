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
-- Table structure for table `reels`
--

DROP TABLE IF EXISTS `reels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reels` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` longtext COLLATE utf8mb4_unicode_ci,
  `is_shot` int DEFAULT '0',
  `category_id` int DEFAULT NULL,
  `video_channel` int DEFAULT '0',
  `video_link` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `video_Thumbnail` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `qr_code_image` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `video_desciption` longtext COLLATE utf8mb4_unicode_ci,
  `total_views` int NOT NULL DEFAULT '0',
  `total_likes` int NOT NULL DEFAULT '0',
  `is_active` int DEFAULT NULL,
  `createdby` int DEFAULT NULL,
  `updatedby` int DEFAULT NULL,
  `createddate` datetime DEFAULT NULL,
  `updateddate` datetime DEFAULT NULL,
  `play_duration` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '0',
  `is_paid_promotional` tinyint(1) DEFAULT '0',
  `promotional_price` decimal(10,2) DEFAULT NULL COMMENT 'Price per view in INR (supports up to 99999999.99)',
  `stream_status` enum('pending','uploading','inprogress','pendingupload','ready','error','downloading','queued','live-inprogress') COLLATE utf8mb4_unicode_ci DEFAULT 'pending' COMMENT 'Stream video processing status - expanded for Cloudflare compatibility',
  `adaptive_manifest_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'HLS/DASH manifest URL for adaptive streaming',
  `stream_created_at` timestamp NULL DEFAULT NULL COMMENT 'When video was uploaded to Stream',
  `stream_ready_at` timestamp NULL DEFAULT NULL COMMENT 'When video encoding completed',
  `stream_duration` decimal(10,2) DEFAULT NULL COMMENT 'Video duration in seconds from Stream',
  `stream_size_bytes` bigint DEFAULT NULL COMMENT 'Video file size in bytes',
  `stream_video_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Cloudflare Stream video ID',
  PRIMARY KEY (`id`),
  KEY `idx_reels_stream_status` (`stream_status`),
  KEY `idx_reels_stream_ready` (`stream_status`,`stream_ready_at`),
  KEY `idx_reels_stream_video_id` (`stream_video_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5008 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-26 13:04:28
