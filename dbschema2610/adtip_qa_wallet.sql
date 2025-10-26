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
-- Table structure for table `wallet`
--

DROP TABLE IF EXISTS `wallet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wallet` (
  `id` int NOT NULL AUTO_INCREMENT,
  `totalBalance` decimal(15,2) NOT NULL DEFAULT '0.00',
  `transaction_status` tinyint DEFAULT NULL,
  `amount` double DEFAULT '0',
  `withdraw_req_amount` int NOT NULL DEFAULT '0',
  `withdraw_request_id` int DEFAULT NULL,
  `complaint` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paid_status` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT 'Paid',
  `transaction_date` datetime DEFAULT NULL,
  `bankName` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `accountNumber` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `IFSC` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mobileNumber` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `upi_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transaction_method` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transaction_type` varchar(25) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Deposite',
  `card_number` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `card_expiry` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cvv` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transaction_otp` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdby` int DEFAULT NULL,
  `createddate` datetime DEFAULT NULL,
  `updateddate` datetime DEFAULT NULL,
  `call_transaction_id` int DEFAULT NULL,
  `order_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_withdrawn` decimal(10,2) DEFAULT '0.00',
  `pending_withdrawals` decimal(10,2) DEFAULT '0.00',
  `gross_amount` decimal(10,2) DEFAULT NULL COMMENT 'Gross earning amount before commission',
  `platform_commission` decimal(10,2) DEFAULT NULL COMMENT 'Platform commission deducted',
  `commission_rate` decimal(5,4) DEFAULT NULL COMMENT 'Commission rate applied (0.30 for premium, 0.60 for regular)',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT 'Transaction description',
  `gst_amount` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_createdby_type_status` (`createdby`,`transaction_type`,`transaction_status`),
  KEY `idx_wallet_createdby` (`createdby`),
  KEY `idx_wallet_total_withdrawn` (`total_withdrawn`),
  KEY `idx_wallet_commission` (`createdby`,`gross_amount`,`platform_commission`)
) ENGINE=InnoDB AUTO_INCREMENT=534991 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-26 13:05:00
