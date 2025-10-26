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
-- Table structure for table `messages_local_sync`
--

DROP TABLE IF EXISTS `messages_local_sync`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages_local_sync` (
  `id` int NOT NULL AUTO_INCREMENT,
  `message_id` int NOT NULL COMMENT 'Reference to messages table',
  `chat_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Chat ID for grouping',
  `local_message_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Local/temp message ID from client',
  `local_timestamp` timestamp NOT NULL COMMENT 'Timestamp when message was created locally',
  `server_timestamp` timestamp NULL DEFAULT NULL COMMENT 'Timestamp when message was synced to server',
  `sync_status` enum('pending','synced','conflict','failed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `sync_attempts` int DEFAULT '0' COMMENT 'Number of sync attempts',
  `last_sync_attempt` timestamp NULL DEFAULT NULL COMMENT 'Last time sync was attempted',
  `error_message` text COLLATE utf8mb4_unicode_ci COMMENT 'Error details if sync failed',
  `client_version` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Client app version for debugging',
  PRIMARY KEY (`id`),
  KEY `idx_message_id` (`message_id`),
  KEY `idx_chat_id` (`chat_id`),
  KEY `idx_local_message_id` (`local_message_id`),
  KEY `idx_sync_status` (`sync_status`),
  KEY `idx_sync_attempts` (`sync_attempts`),
  KEY `idx_last_sync_attempt` (`last_sync_attempt`),
  CONSTRAINT `fk_sync_message` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE
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

-- Dump completed on 2025-10-26 13:03:27
