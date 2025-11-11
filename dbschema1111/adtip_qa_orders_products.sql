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
-- Table structure for table `orders_products`
--

DROP TABLE IF EXISTS `orders_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders_products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` bigint DEFAULT NULL,
  `product_name` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci,
  `product_image` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci,
  `product_price` double DEFAULT NULL,
  `discount_on_product` double DEFAULT NULL,
  `platform_fee` double DEFAULT NULL,
  `shipping_fee` double DEFAULT NULL,
  `payment_method` longtext COLLATE utf8mb4_unicode_ci,
  `created_by` bigint DEFAULT NULL,
  `product_created_by` bigint DEFAULT NULL,
  `created_date` timestamp NULL DEFAULT NULL,
  `company_id` bigint DEFAULT NULL,
  `size` text COLLATE utf8mb4_unicode_ci,
  `inches` int DEFAULT NULL,
  `paid` int DEFAULT NULL,
  `liter` int DEFAULT NULL,
  `kg` int DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `address` longtext COLLATE utf8mb4_unicode_ci,
  `total_amount` double DEFAULT NULL,
  `status` text COLLATE utf8mb4_unicode_ci,
  `shipping_company` text COLLATE utf8mb4_unicode_ci,
  `shipping_company_track_id` mediumtext COLLATE utf8mb4_unicode_ci,
  `shipping_company_additional_information` longtext COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-11 10:44:33
