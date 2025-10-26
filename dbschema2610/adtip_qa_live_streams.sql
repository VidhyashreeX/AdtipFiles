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
-- Table structure for table `live_streams`
--

DROP TABLE IF EXISTS `live_streams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `live_streams` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `meeting_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cost_per_minute` decimal(10,2) NOT NULL DEFAULT '10.00',
  `viewer_reward_per_minute` decimal(10,2) DEFAULT '0.00',
  `is_private` tinyint(1) DEFAULT '0',
  `status` enum('active','ended','paused','pending_payment') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `start_time` timestamp NULL DEFAULT NULL,
  `end_time` timestamp NULL DEFAULT NULL,
  `duration_minutes` int DEFAULT '0',
  `viewer_count` int DEFAULT '0',
  `total_earnings` decimal(10,2) DEFAULT '0.00',
  `total_spent` decimal(10,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `stream_type` enum('free','influencer','promotional') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'free' COMMENT 'Type of live stream',
  `target_age_group` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Target age group for promotional streams',
  `target_gender` enum('all','male','female','other') COLLATE utf8mb4_unicode_ci DEFAULT 'all' COMMENT 'Target gender for promotional streams',
  `target_location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Target location for promotional streams',
  `target_viewer_count` int DEFAULT NULL COMMENT 'Target number of viewers for promotional streams',
  `stream_duration_minutes` int DEFAULT NULL COMMENT 'Expected duration in minutes for promotional streams',
  `company_pay_per_viewer_per_minute` decimal(10,2) DEFAULT NULL COMMENT 'Amount company pays per viewer per minute',
  `product_service_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Product or service name for promotional streams',
  `product_service_description` text COLLATE utf8mb4_unicode_ci COMMENT 'Product or service description for promotional streams',
  `total_paid_amount` decimal(10,2) DEFAULT '0.00' COMMENT 'Total amount paid for promotional streams',
  `payment_status` enum('pending','paid','failed','refunded') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Payment status for promotional streams',
  `razorpay_order_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Razorpay order ID for payment tracking',
  `razorpay_payment_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Razorpay payment ID for payment tracking',
  `expected_earnings` decimal(10,2) DEFAULT '0.00' COMMENT 'Expected earnings for influencer streams',
  PRIMARY KEY (`id`),
  UNIQUE KEY `meeting_id` (`meeting_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_meeting_id` (`meeting_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_live_streams_user_status` (`user_id`,`status`,`start_time` DESC),
  KEY `idx_live_streams_meeting_status` (`meeting_id`,`status`),
  KEY `idx_live_streams_status_start_time` (`status`,`start_time`),
  KEY `idx_live_streams_user_earnings` (`user_id`,`status`,`total_earnings`,`start_time`),
  KEY `idx_live_streams_composite` (`user_id`,`meeting_id`,`status`,`start_time` DESC),
  KEY `idx_live_streams_type` (`stream_type`),
  KEY `idx_live_streams_type_status` (`stream_type`,`status`),
  KEY `idx_live_streams_payment_status` (`payment_status`),
  CONSTRAINT `live_streams_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-26 13:02:21
