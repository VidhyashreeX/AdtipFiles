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
-- Temporary view structure for view `active_paid_statuses`
--

DROP TABLE IF EXISTS `active_paid_statuses`;
/*!50001 DROP VIEW IF EXISTS `active_paid_statuses`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `active_paid_statuses` AS SELECT 
 1 AS `id`,
 1 AS `user_id`,
 1 AS `content`,
 1 AS `media_url`,
 1 AS `media_type`,
 1 AS `price_to_view`,
 1 AS `is_premium_only`,
 1 AS `created_at`,
 1 AS `expires_at`,
 1 AS `user_name`,
 1 AS `user_avatar`,
 1 AS `user_is_premium`,
 1 AS `view_count`,
 1 AS `total_earnings`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `message_delivery_analysis`
--

DROP TABLE IF EXISTS `message_delivery_analysis`;
/*!50001 DROP VIEW IF EXISTS `message_delivery_analysis`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `message_delivery_analysis` AS SELECT 
 1 AS `message_id`,
 1 AS `conversation_id`,
 1 AS `sender_id`,
 1 AS `sender_name`,
 1 AS `content`,
 1 AS `delivery_status`,
 1 AS `delivery_attempts`,
 1 AS `created_at`,
 1 AS `last_delivery_attempt`,
 1 AS `delivered_at`,
 1 AS `delivery_time_seconds`,
 1 AS `failure_reason`,
 1 AS `failure_attempts`,
 1 AS `failed_at`,
 1 AS `recipient_id`,
 1 AS `recipient_name`,
 1 AS `has_fcm_token`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `message_details`
--

DROP TABLE IF EXISTS `message_details`;
/*!50001 DROP VIEW IF EXISTS `message_details`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `message_details` AS SELECT 
 1 AS `id`,
 1 AS `chat_id`,
 1 AS `sender_id`,
 1 AS `recipient_id`,
 1 AS `sender_name`,
 1 AS `sender_avatar`,
 1 AS `content`,
 1 AS `message_type`,
 1 AS `file_url`,
 1 AS `file_size`,
 1 AS `file_name`,
 1 AS `file_mime_type`,
 1 AS `thumbnail_url`,
 1 AS `reply_to_message_id`,
 1 AS `external_id`,
 1 AS `temp_id`,
 1 AS `fcm_message_id`,
 1 AS `status`,
 1 AS `created_at`,
 1 AS `updated_at`,
 1 AS `is_deleted`,
 1 AS `deleted_at`,
 1 AS `deleted_by`,
 1 AS `is_edited`,
 1 AS `edited_at`,
 1 AS `original_content`,
 1 AS `sender_display_name`,
 1 AS `sender_profile_image`,
 1 AS `recipient_display_name`,
 1 AS `recipient_profile_image`,
 1 AS `reply_to_content`,
 1 AS `reply_to_sender_name`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `user_chat_list`
--

DROP TABLE IF EXISTS `user_chat_list`;
/*!50001 DROP VIEW IF EXISTS `user_chat_list`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `user_chat_list` AS SELECT 
 1 AS `id`,
 1 AS `user_id`,
 1 AS `chat_id`,
 1 AS `other_user_id`,
 1 AS `other_user_name`,
 1 AS `other_user_avatar`,
 1 AS `unread_count`,
 1 AS `last_read_message_id`,
 1 AS `last_message_id`,
 1 AS `last_message_content`,
 1 AS `last_message_time`,
 1 AS `is_muted`,
 1 AS `is_blocked`,
 1 AS `is_archived`,
 1 AS `is_pinned`,
 1 AS `created_at`,
 1 AS `updated_at`,
 1 AS `last_activity_at`,
 1 AS `other_user_display_name`,
 1 AS `other_user_profile_image`,
 1 AS `other_user_online_status`,
 1 AS `last_message_preview`,
 1 AS `last_message_type`,
 1 AS `last_message_timestamp`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vw_campaign_ad_performance`
--

DROP TABLE IF EXISTS `vw_campaign_ad_performance`;
/*!50001 DROP VIEW IF EXISTS `vw_campaign_ad_performance`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_campaign_ad_performance` AS SELECT 
 1 AS `campaign_id`,
 1 AS `campaign_name`,
 1 AS `company_id`,
 1 AS `creative_id`,
 1 AS `creative_name`,
 1 AS `impressions`,
 1 AS `starts`,
 1 AS `completions`,
 1 AS `skips`,
 1 AS `clicks`,
 1 AS `completion_rate`,
 1 AS `ctr`,
 1 AS `total_spend`*/;
SET character_set_client = @saved_cs_client;

--
-- Final view structure for view `active_paid_statuses`
--

/*!50001 DROP VIEW IF EXISTS `active_paid_statuses`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`adtpuser`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `active_paid_statuses` AS select `ps`.`id` AS `id`,`ps`.`user_id` AS `user_id`,`ps`.`content` AS `content`,`ps`.`media_url` AS `media_url`,`ps`.`media_type` AS `media_type`,`ps`.`price_to_view` AS `price_to_view`,`ps`.`is_premium_only` AS `is_premium_only`,`ps`.`created_at` AS `created_at`,`ps`.`expires_at` AS `expires_at`,`u`.`name` AS `user_name`,`u`.`profile_image` AS `user_avatar`,`u`.`premium` AS `user_is_premium`,coalesce(`view_stats`.`view_count`,0) AS `view_count`,coalesce(`view_stats`.`total_earnings`,0) AS `total_earnings` from ((`paid_status` `ps` left join `users` `u` on((`ps`.`user_id` = `u`.`id`))) left join (select `psv`.`status_id` AS `status_id`,count(0) AS `view_count`,sum((case when (`ps_inner`.`price_to_view` > 0) then (`ps_inner`.`price_to_view` * 0.8) else 0 end)) AS `total_earnings` from (`paid_status_views` `psv` left join `paid_status` `ps_inner` on((`psv`.`status_id` = `ps_inner`.`id`))) group by `psv`.`status_id`) `view_stats` on((`ps`.`id` = `view_stats`.`status_id`))) where ((`ps`.`expires_at` > now()) and (`ps`.`is_active` = 1) and (`u`.`id` is not null)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `message_delivery_analysis`
--

/*!50001 DROP VIEW IF EXISTS `message_delivery_analysis`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`adtpuser`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `message_delivery_analysis` AS select `m`.`id` AS `message_id`,`m`.`chat_id` AS `conversation_id`,`m`.`sender_id` AS `sender_id`,`sender`.`name` AS `sender_name`,`m`.`content` AS `content`,`m`.`status` AS `delivery_status`,0 AS `delivery_attempts`,`m`.`created_at` AS `created_at`,NULL AS `last_delivery_attempt`,(case when (`m`.`status` = 'delivered') then `m`.`updated_at` else NULL end) AS `delivered_at`,(case when (`m`.`status` = 'delivered') then timestampdiff(SECOND,`m`.`created_at`,`m`.`updated_at`) else NULL end) AS `delivery_time_seconds`,NULL AS `failure_reason`,NULL AS `failure_attempts`,NULL AS `failed_at`,`m`.`recipient_id` AS `recipient_id`,`recipient`.`name` AS `recipient_name`,(case when (`recipient`.`fcm_token` is not null) then 1 else 0 end) AS `has_fcm_token` from ((`messages` `m` join `users` `sender` on((`m`.`sender_id` = `sender`.`id`))) join `users` `recipient` on((`m`.`recipient_id` = `recipient`.`id`))) where ((`recipient`.`id` <> `m`.`sender_id`) and (`m`.`is_deleted` = 0)) order by `m`.`created_at` desc */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `message_details`
--

/*!50001 DROP VIEW IF EXISTS `message_details`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`adtpuser`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `message_details` AS select `m`.`id` AS `id`,`m`.`chat_id` AS `chat_id`,`m`.`sender_id` AS `sender_id`,`m`.`recipient_id` AS `recipient_id`,`m`.`sender_name` AS `sender_name`,`m`.`sender_avatar` AS `sender_avatar`,`m`.`content` AS `content`,`m`.`message_type` AS `message_type`,`m`.`file_url` AS `file_url`,`m`.`file_size` AS `file_size`,`m`.`file_name` AS `file_name`,`m`.`file_mime_type` AS `file_mime_type`,`m`.`thumbnail_url` AS `thumbnail_url`,`m`.`reply_to_message_id` AS `reply_to_message_id`,`m`.`external_id` AS `external_id`,`m`.`temp_id` AS `temp_id`,`m`.`fcm_message_id` AS `fcm_message_id`,`m`.`status` AS `status`,`m`.`created_at` AS `created_at`,`m`.`updated_at` AS `updated_at`,`m`.`is_deleted` AS `is_deleted`,`m`.`deleted_at` AS `deleted_at`,`m`.`deleted_by` AS `deleted_by`,`m`.`is_edited` AS `is_edited`,`m`.`edited_at` AS `edited_at`,`m`.`original_content` AS `original_content`,`sender`.`name` AS `sender_display_name`,`sender`.`profile_image` AS `sender_profile_image`,`recipient`.`name` AS `recipient_display_name`,`recipient`.`profile_image` AS `recipient_profile_image`,`reply_msg`.`content` AS `reply_to_content`,`reply_sender`.`name` AS `reply_to_sender_name` from ((((`messages` `m` join `users` `sender` on((`m`.`sender_id` = `sender`.`id`))) join `users` `recipient` on((`m`.`recipient_id` = `recipient`.`id`))) left join `messages` `reply_msg` on((`m`.`reply_to_message_id` = `reply_msg`.`id`))) left join `users` `reply_sender` on((`reply_msg`.`sender_id` = `reply_sender`.`id`))) where (`m`.`is_deleted` = false) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `user_chat_list`
--

/*!50001 DROP VIEW IF EXISTS `user_chat_list`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`adtpuser`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `user_chat_list` AS select `ucm`.`id` AS `id`,`ucm`.`user_id` AS `user_id`,`ucm`.`chat_id` AS `chat_id`,`ucm`.`other_user_id` AS `other_user_id`,`ucm`.`other_user_name` AS `other_user_name`,`ucm`.`other_user_avatar` AS `other_user_avatar`,`ucm`.`unread_count` AS `unread_count`,`ucm`.`last_read_message_id` AS `last_read_message_id`,`ucm`.`last_message_id` AS `last_message_id`,`ucm`.`last_message_content` AS `last_message_content`,`ucm`.`last_message_time` AS `last_message_time`,`ucm`.`is_muted` AS `is_muted`,`ucm`.`is_blocked` AS `is_blocked`,`ucm`.`is_archived` AS `is_archived`,`ucm`.`is_pinned` AS `is_pinned`,`ucm`.`created_at` AS `created_at`,`ucm`.`updated_at` AS `updated_at`,`ucm`.`last_activity_at` AS `last_activity_at`,`u`.`name` AS `other_user_display_name`,`u`.`profile_image` AS `other_user_profile_image`,`u`.`online_status` AS `other_user_online_status`,`m`.`content` AS `last_message_preview`,`m`.`message_type` AS `last_message_type`,`m`.`created_at` AS `last_message_timestamp` from ((`user_chat_metadata` `ucm` join `users` `u` on((`ucm`.`other_user_id` = `u`.`id`))) left join `messages` `m` on((`ucm`.`last_message_id` = `m`.`id`))) where (`ucm`.`is_archived` = false) order by `ucm`.`last_activity_at` desc */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vw_campaign_ad_performance`
--

/*!50001 DROP VIEW IF EXISTS `vw_campaign_ad_performance`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`adtpuser`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_campaign_ad_performance` AS select `c`.`id` AS `campaign_id`,`c`.`campaign_name` AS `campaign_name`,`c`.`company_id` AS `company_id`,`vc`.`id` AS `creative_id`,`vc`.`creative_name` AS `creative_name`,count(distinct (case when (`va`.`event_type` = 'impression') then `va`.`id` end)) AS `impressions`,count(distinct (case when (`va`.`event_type` = 'start') then `va`.`id` end)) AS `starts`,count(distinct (case when (`va`.`event_type` = 'complete') then `va`.`id` end)) AS `completions`,count(distinct (case when (`va`.`event_type` = 'skip') then `va`.`id` end)) AS `skips`,count(distinct (case when (`va`.`event_type` = 'click') then `va`.`id` end)) AS `clicks`,round(((count(distinct (case when (`va`.`event_type` = 'complete') then `va`.`id` end)) * 100.0) / nullif(count(distinct (case when (`va`.`event_type` = 'start') then `va`.`id` end)),0)),2) AS `completion_rate`,round(((count(distinct (case when (`va`.`event_type` = 'click') then `va`.`id` end)) * 100.0) / nullif(count(distinct (case when (`va`.`event_type` = 'impression') then `va`.`id` end)),0)),2) AS `ctr`,sum((case when (`va`.`billable` = 1) then `va`.`billing_amount` else 0 end)) AS `total_spend` from ((`admodels` `c` left join `video_ad_creatives` `vc` on((`c`.`id` = `vc`.`campaign_id`))) left join `video_ad_analytics` `va` on((`vc`.`id` = `va`.`creative_id`))) where (`c`.`is_active` = 1) group by `c`.`id`,`vc`.`id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-11 10:46:27
