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
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `firstName` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastName` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emailId` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dob` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profile_image` varchar(245) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mobile_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `otp` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_type` int DEFAULT NULL,
  `profession` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `maternal_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `longitude` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pincode` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `current_otp_verified` tinyint(1) DEFAULT NULL,
  `created_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `isOtpVerified` tinyint(1) DEFAULT '0',
  `isSaveUserDetails` tinyint(1) DEFAULT '0',
  `is_active` int DEFAULT NULL,
  `createdby` int DEFAULT NULL,
  `access_type` int DEFAULT NULL,
  `online_status` int DEFAULT '2',
  `device_token` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_block` varchar(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_mute` varchar(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referal_code` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `referal_earnings` double NOT NULL DEFAULT '0',
  `referred_by` int DEFAULT NULL,
  `username` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referred_count` int DEFAULT '0',
  `is_first_time` tinyint DEFAULT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci,
  `premium_plan_id` int DEFAULT '0',
  `content_creator_plan_id` int DEFAULT '0',
  `is_available` tinyint DEFAULT '1',
  `dnd` tinyint DEFAULT '0',
  `premium` tinyint DEFAULT '0',
  `country_code` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT '+91',
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'India',
  `fcm_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fcm_token_platform` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fcm_token_updation_date` datetime DEFAULT NULL,
  `platform` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `premium_expires_at` timestamp NULL DEFAULT NULL,
  `is_premium` tinyint DEFAULT '0',
  `content_creator_premium_status` tinyint DEFAULT '0',
  `content_creator_premium_expires_at` timestamp NULL DEFAULT NULL,
  `otp_created_at` timestamp NULL DEFAULT NULL COMMENT 'Timestamp when OTP was created for expiration tracking',
  `total_withdrawals` decimal(10,2) DEFAULT '0.00',
  `last_withdrawal_date` timestamp NULL DEFAULT NULL,
  `withdrawal_count` int DEFAULT '0',
  `wallet_balance` decimal(12,2) DEFAULT '0.00',
  `current_session_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `current_device_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_type` enum('web','android','ios') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_stream_time` int DEFAULT '0' COMMENT 'Total streaming time in minutes',
  `total_stream_earnings` decimal(10,2) DEFAULT '0.00' COMMENT 'Total earnings from streaming',
  `premium_activated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mobileNumber_unique` (`mobile_number`),
  UNIQUE KEY `username_UNIQUE` (`username`),
  KEY `idx_country_mobile` (`country_code`,`mobile_number`),
  KEY `idx_otp` (`otp`),
  KEY `idx_mobile_otp` (`mobile_number`,`otp`),
  KEY `idx_is_otp_verified` (`isOtpVerified`),
  KEY `idx_mobile_number` (`mobile_number`),
  KEY `idx_users_name` (`name`),
  KEY `idx_users_total_withdrawals` (`total_withdrawals`),
  KEY `idx_users_wallet_balance` (`id`,`wallet_balance`),
  KEY `idx_users_stats` (`id`,`total_stream_time`,`total_stream_earnings`),
  KEY `idx_is_premium` (`is_premium`),
  KEY `idx_premium_expires_at` (`premium_expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=1004308 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-26 13:03:03
