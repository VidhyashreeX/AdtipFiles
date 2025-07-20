// src/constants/apiEndpoints.ts
// This file contains all API endpoint paths

// Authentication endpoints
export const AUTH_ENDPOINTS = {
  OTP_LOGIN: '/api/otplogin',
  OTP_VERIFY: '/api/otpverify',
  LOGOUT: '/api/logout',
  SAVE_USER_DETAILS: '/api/saveuserdetails',
  PING: '/api/ping',
  REFRESH_TOKEN: '/api/refresh-token',
};

// Home page endpoints
export const HOME_ENDPOINTS = {
  GET_WALLET_BALANCE: '/api/getfunds',
  LIST_POSTS: '/api/list-posts',
  CHECK_PREMIUM: '/api/check-premium',
  GET_AD_PASSBOOK: '/api/getadpassbook',
  GET_CHANNEL_BY_USER_ID: '/api/getchannelbyuserid',
  SAVE_USER_POST_LIKE: '/api/save-user-post-like',
  GET_HOME_BANNERS_INDIA: '/api/get-home-banners-india',
};

// TipTube endpoints
export const TIP_TUBE_ENDPOINTS = {
  GET_VIDEOS: '/api/getvideos',
  GET_CHANNEL_BY_USER_ID: '/api/getchannelbyuserid',
  GET_ANALYTICS: '/api/analytics',
};

// TipShorts endpoints
export const TIP_SHORTS_ENDPOINTS = {
  GET_SHORTS: '/api/getshots',
};

// TipCalls endpoints
export const TIP_CALLS_ENDPOINTS = {
  GET_USERS: '/api/users',
  GET_ALL_USERS: '/api/allusers',
  CALL: '/api/call',
  INITIATE_CALL: '/api/initiate-call',
  UPDATE_CALL_STATUS: '/api/call/update-call', // Add this new endpoint
  GET_AGORA_TOKEN_CALLER: '/api/get-agora-token/caller',
  GET_AGORA_TOKEN_CALLEE: '/api/get-agora-token/callee',
  GET_RTM_TOKEN: '/api/get-rtm-token',
  MISSED_CALLS: '/api/missed-calls',
  UPDATE_FCM_TOKEN: '/api/update-fcm-token',
  GET_FCM_TOKEN: '/api/get-fcm-token', // Single user FCM token endpoint
  GET_FCM_TOKENS: '/api/fcm-tokens-of-both-users',
  SAVE_COMMENT: '/api/save-user-post-comment',
  GET_COMMENTS: '/api/posts', // Will be used as /api/posts/{postId}/comments
  LIKE_COMMENT: '/api/like-comment',
  DELETE_COMMENT: '/api/delete-comment',
  REPORT_COMMENT: '/api/report-comment', // Add if you have this endpoint

  // VideoSDK specific endpoints
  VIDEOSDK_GENERATE_TOKEN: '/api/generate-token/videosdk',
  VIDEOSDK_CREATE_MEETING: '/api/create-meeting/videosdk',
  VIDEOSDK_DEACTIVATE_ROOM: '/api/deactivate-room/videosdk',
  VIDEOSDK_VALIDATE_MEETING: '/api/validate-meeting/videosdk',
  
  // New Voice Call endpoints (subscription-based)
  VOICE_CALL: '/api/voice-call',
  VOICE_CALL_BALANCE: '/api/voice-call/balance', // + '/:userId'
  VOICE_CALL_HISTORY: '/api/voice-call/history', // + '/:userId'
  
  // New Video Call endpoints (subscription-based)
  VIDEO_CALL: '/api/video-call',
  VIDEO_CALL_BALANCE: '/api/video-call/balance', // + '/:userId'
  VIDEO_CALL_HISTORY: '/api/video-call/history', // + '/:userId'
};

// Firebase Cloud Functions endpoints
export const FCM_ENDPOINTS = {
  INITIATE_CALL: '/api/call/initiate-call',
  UPDATE_CALL_STATUS: '/api/call/update-call',
};

// Profile endpoints
export const PROFILE_ENDPOINTS = {
  USER_PREMIUM_PLANS: '/api/user-premium-plans',
  CONTENT_PREMIUM_PLANS: '/api/content-premium-plans',
  USER_POSTS: '/users', // + '/:userId/posts'
  GET_FOLLOWING: '/api/follow/followings',
  GET_FOLLOWERS: '/api/follow/followers',
};

// Referral endpoints
export const REFERRAL_ENDPOINTS = {
  GET_REFERRAL_DETAILS: '/api/referral/details',
};

// Wallet endpoints
export const WALLET_ENDPOINTS = {
  GET_FUNDS: '/api/getfunds', // Already defined in HOME_ENDPOINTS, just aliased here
};

// Explore endpoints
export const EXPLORE_ENDPOINTS = {
  GET_EXPLORE_CONTENT: '/api/explore',
};

// Chat endpoints
export const CHAT_ENDPOINTS = {
  // Test endpoint
  TEST: '/api/chat/test',

  // Conversations
  GET_CONVERSATIONS: '/api/chat/conversations',
  CREATE_CONVERSATION: '/api/chat/conversations',

  // Messages
  GET_MESSAGES: '/api/chat/conversations', // + '/:conversationId/messages'
  SEND_MESSAGE: '/api/chat/conversations', // + '/:conversationId/messages'

  // Mark as read
  MARK_AS_READ: '/api/chat/conversations', // + '/:conversationId/read'
};

// FCM Chat endpoints (high priority notifications) - Now using Firebase Cloud Functions
export const FCM_CHAT_ENDPOINTS = {
  // Firebase Cloud Function messaging endpoints
  SEND_MESSAGE: '/api/chat/send-message',
  SEND_MESSAGE_MULTICAST: '/api/chat/send-message-multicast',

  // Conversation management
  CREATE_CONVERSATION: '/api/chat/create-conversation',

  // Status updates
  UPDATE_TYPING_STATUS: '/api/chat/update-typing-status',
  UPDATE_MESSAGE_STATUS: '/api/chat/update-message-status',

  // FCM token management - REMOVED: Now uses calling system's /api/update-fcm-token
  // UPDATE_FCM_TOKEN: '/api/chat/update-fcm-token', // DEPRECATED - Use ApiService.updateFcmToken() instead

  // Legacy endpoints (for backward compatibility)
  LEGACY_SEND_MESSAGE: '/api/chat/fcm/send-message',
  LEGACY_SEND_MESSAGE_MULTICAST: '/api/chat/fcm/send-message-multicast',
  // LEGACY_UPDATE_TOKEN: '/api/chat/fcm/update-token', // DEPRECATED - Use ApiService.updateFcmToken() instead

  // Message status and queue management (legacy)
  QUEUE_STATS: '/api/chat/fcm/queue-stats',
  MESSAGE_STATUS: '/api/chat/fcm/message-status', // + '/:messageId'
  RETRY_FAILED: '/api/chat/fcm/retry-failed',

  // Test and health endpoints
  TEST_FCM: '/api/chat/test-fcm',
  HEALTH: '/api/chat/health',
};

// Additional endpoints from CSV analysis
export const ADDITIONAL_ENDPOINTS = {
  // Guest endpoints (no login required)
  LIST_PREMIUM_POSTS: '/api/list-premium-posts',
  GET_PUBLIC_VIDEOS: '/api/getpublicvideos', // + '/:categoryId/:offset'
  GET_PUBLIC_SHOTS: '/api/getpublicshots',
  
  // Video interactions
  SAVE_VIDEO_LIKE: '/api/saveVideoLike',
  SAVE_VIDEO_COMMENT: '/api/savevideocomment',
  SAVE_VIDEO_COMMENT_LIKE: '/api/savevideocommentlike',
  GET_COMMENTS_OF_VIDEOS: '/api/getcommentsofvideos', // + '/:userId/:videoId'
  
  // Follow/Unfollow
  FOLLOW_USER: '/api/follow-user',
  
  // Channel management
  SAVE_MY_CHANNEL: '/api/savemychannel',
  UPDATE_CHANNEL: '/api/updatechanel',
  GET_POPULAR_SHORT: '/api/getpopularshort', // + '/:videoType/:userId'
  GET_VIDEO_BY_CHANNEL: '/api/getvideobychannel', // + '/:videoType/:channelId/:userId'
  GET_FOLLOWED_CHANNELS: '/api/getlistoffollowedchannelbyuser', // + '/:userId'
  
  // Premium plans
  USER_PREMIUM_PLANS: '/api/user-premium-plans', // + '/:userId'
  CONTENT_PREMIUM_PLANS: '/api/content-premium-plans', // + '/:userId'
  UPGRADE_PREMIUM: '/api/upgrade-premium',
  UPGRADE_CONTENT_PREMIUM: '/api/upgrade-content-premium',
  
  // Subscription Plans
  GET_SUBSCRIPTION_PLANS: '/api/subscription-plans',
  CREATE_SUBSCRIPTION: '/api/subscriptions/create',
  CANCEL_SUBSCRIPTION: '/api/subscriptions/cancel',
  GET_SUBSCRIPTION_STATUS: '/api/subscriptions/status', // + '/:userId'
  
  // Razorpay
  RAZORPAY_DETAILS: '/razorpay-details',
  RAZORPAY_ORDER: '/api/razorpay-order',
  RAZORPAY_VERIFICATION: '/api/razorpay-verification',
  ADD_FUNDS: '/api/addfunds',
  
  // Celebration ads
  SAVE_CELEBRATION_ADS: '/api/savecelebrationadds',
  GET_CELEBRATION_ADS: '/api/getcelebrationads',
  SAVE_CELEBRATION_AD_VIEW: '/api/savecelebrationadview',
  
  // Others
  GET_SENT_NOTIFICATIONS: '/api/getsentnotification', // + '/:userId'
  UPDATE_USER: '/api/updateuser',
  UPLOAD_POST: '/api/post',
  UPLOAD_SHOT: '/api/uploadshot',
  GENERATE_PRESIGNED_URL: '/api/generatePresignedUrl',
  GET_REFERRAL_DETAILS: '/api/referral/details', // + '/:userId'
};
