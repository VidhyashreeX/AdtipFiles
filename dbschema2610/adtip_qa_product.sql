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
-- Table structure for table `product`
--

DROP TABLE IF EXISTS `product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(455) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_type` tinyint(1) DEFAULT NULL,
  `images` longtext COLLATE utf8mb4_unicode_ci,
  `brand` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category_id` int DEFAULT NULL,
  `delivery_time` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `terms_condition` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_views` int NOT NULL DEFAULT '0',
  `total_likes` int NOT NULL DEFAULT '0',
  `units` int DEFAULT NULL,
  `regular_price` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `market_price` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_rating` int DEFAULT '0',
  `total_wish_list` int DEFAULT '0',
  `size` varchar(450) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_id` int NOT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `createddate` datetime DEFAULT NULL,
  `updatedate` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `your_price` double DEFAULT NULL,
  `keyword` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci,
  `manufacturer_date` mediumtext COLLATE utf8mb4_unicode_ci,
  `product_description` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci,
  `product_specification` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci,
  `inches` double DEFAULT NULL,
  `additional_accessories` longtext COLLATE utf8mb4_unicode_ci,
  `stock` double DEFAULT NULL,
  `procurement_type` mediumtext COLLATE utf8mb4_unicode_ci,
  `procurement_time` double DEFAULT NULL,
  `shipping_fee` double DEFAULT NULL,
  `replacement_days` double DEFAULT NULL,
  `warranty_days` double DEFAULT NULL,
  `sku_id` mediumtext COLLATE utf8mb4_unicode_ci,
  `auto_bargain` int DEFAULT NULL,
  `bargain_minimum_price` double DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id_fk_idx` (`company_id`)
) ENGINE=InnoDB AUTO_INCREMENT=162 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-26 13:05:09
