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
-- Table structure for table `admodels`
--

DROP TABLE IF EXISTS `admodels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admodels` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_name` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `campaign_name` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_gender` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `marital_status` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_lower_age` int DEFAULT NULL,
  `target_upper_age` int DEFAULT NULL,
  `target_professions` varchar(455) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_area` longtext COLLATE utf8mb4_unicode_ci,
  `ad_total_people` int DEFAULT '0',
  `ad_customer_target_per_day` int DEFAULT '0',
  `adwatch_per_day` int DEFAULT NULL,
  `ad_perday_pay` double DEFAULT NULL,
  `is_fisrtpage_save` int DEFAULT NULL,
  `ad_per_view_percentage` int DEFAULT NULL,
  `ad_per_preview_percentage` int DEFAULT NULL,
  `professions` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ad_view` int DEFAULT '0',
  `ad_like` int DEFAULT '0',
  `ad_start_date` datetime DEFAULT NULL,
  `ad_end_date` datetime DEFAULT NULL,
  `ad_time` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ad_end_time` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ad_comments_on` tinyint(1) DEFAULT NULL,
  `is_second_page_save` tinyint(1) DEFAULT NULL,
  `ad_upload_filename` varchar(455) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mediaType` int DEFAULT NULL,
  `ad_upload_original_filename` varchar(455) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ad_animation_id` int DEFAULT NULL,
  `ad_button_text_id` int DEFAULT NULL,
  `ad_image_alignment` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ad_headline` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ad_font_size` int DEFAULT NULL,
  `ad_font_bold` int DEFAULT NULL,
  `is_third_page_save` int DEFAULT NULL,
  `ad_description` varchar(455) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ad_website_link` longtext COLLATE utf8mb4_unicode_ci,
  `ad_website` longtext COLLATE utf8mb4_unicode_ci,
  `ad_company_location` varchar(455) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ad_tax_number` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_forth_page_save` int DEFAULT NULL,
  `ad_place_app` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ad_other_platform` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ad_customised_que1` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ad_customised_que2` varchar(455) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ad_customised_que3` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ad_customised_que4` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ad_refferal` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ad_payment_mode` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ad_order_value` double DEFAULT NULL,
  `ad_charges_value` double DEFAULT NULL,
  `ad_tax` double DEFAULT NULL,
  `ad_total` double DEFAULT NULL,
  `pending_ad_balance` int NOT NULL DEFAULT '0',
  `ad_coupon` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_five_page_save` int DEFAULT NULL,
  `ad_spend_per_day` double DEFAULT NULL,
  `company_id` int DEFAULT NULL,
  `ad_model_id` int DEFAULT NULL,
  `createdby` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `adPauseCountinue` int DEFAULT '1',
  `createddate` datetime DEFAULT NULL,
  `updateddate` datetime DEFAULT NULL,
  `ad_pause_status_date` datetime DEFAULT NULL,
  `modelTypeName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1045 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-11 10:44:31
