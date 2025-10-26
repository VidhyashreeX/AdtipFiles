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
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `chat_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Format: chat_userId1_userId2 (sorted)',
  `sender_id` int NOT NULL COMMENT 'User who sent the message',
  `recipient_id` int NOT NULL COMMENT 'User who receives the message',
  `sender_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Sender display name',
  `sender_avatar` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Sender profile image URL',
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Message text content',
  `message_type` enum('text','image','video','audio','file','system') COLLATE utf8mb4_unicode_ci DEFAULT 'text',
  `file_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'URL for media/file messages',
  `file_size` int DEFAULT NULL COMMENT 'File size in bytes',
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Original file name',
  `file_mime_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'MIME type of the file',
  `thumbnail_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Thumbnail URL for images/videos',
  `reply_to_message_id` int DEFAULT NULL COMMENT 'ID of message being replied to',
  `external_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'External ID from FCM or other systems',
  `temp_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Temporary ID from client for sync tracking',
  `fcm_message_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'FCM message ID for tracking',
  `status` enum('sending','sent','delivered','read','failed') COLLATE utf8mb4_unicode_ci DEFAULT 'sent',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by` int DEFAULT NULL COMMENT 'User who deleted the message',
  `is_edited` tinyint(1) DEFAULT '0',
  `edited_at` timestamp NULL DEFAULT NULL,
  `original_content` text COLLATE utf8mb4_unicode_ci COMMENT 'Original content before editing',
  PRIMARY KEY (`id`),
  KEY `idx_chat_id_created` (`chat_id`,`created_at` DESC),
  KEY `idx_sender_recipient` (`sender_id`,`recipient_id`),
  KEY `idx_sender_created` (`sender_id`,`created_at` DESC),
  KEY `idx_recipient_created` (`recipient_id`,`created_at` DESC),
  KEY `idx_external_id` (`external_id`),
  KEY `idx_temp_id` (`temp_id`),
  KEY `idx_fcm_message_id` (`fcm_message_id`),
  KEY `idx_status` (`status`),
  KEY `idx_deleted` (`is_deleted`,`deleted_at`),
  KEY `idx_reply_to` (`reply_to_message_id`),
  KEY `fk_messages_deleted_by` (`deleted_by`),
  CONSTRAINT `fk_messages_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_messages_recipient` FOREIGN KEY (`recipient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_messages_reply_to` FOREIGN KEY (`reply_to_message_id`) REFERENCES `messages` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=139 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-26 13:04:43
