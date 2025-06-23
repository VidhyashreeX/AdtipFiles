// src/constants/apiEndpoints.ts
// This file contains all API endpoint paths

// Authentication endpoints
export const AUTH_ENDPOINTS = {
  OTP_LOGIN: '/api/otplogin',
  OTP_VERIFY: '/api/otpverify',
  LOGOUT: '/api/logout',
  SAVE_USER_DETAILS: '/api/saveuserdetails',
  PING: '/api/ping',
};

// Home page endpoints
export const HOME_ENDPOINTS = {
  GET_WALLET_BALANCE: '/api/getfunds',
  LIST_POSTS: '/api/list-posts',
  CHECK_PREMIUM: '/api/check-premium',
  GET_AD_PASSBOOK: '/getadpassbook',
  GET_CHANNEL_BY_USER_ID: '/getchannelbyuserid',
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

// Additional endpoints from CSV analysis
export const ADDITIONAL_ENDPOINTS = {
  // Guest endpoints (no login required)
  LIST_PREMIUM_POSTS: '/api/list-premium-posts',
  GET_PUBLIC_VIDEOS: '/getpublicvideos', // + '/:categoryId/:offset'
  GET_PUBLIC_SHOTS: '/getpublicshots',
  
  // Video interactions
  SAVE_VIDEO_LIKE: '/saveVideoLike',
  SAVE_VIDEO_COMMENT: '/savevideocomment',
  SAVE_VIDEO_COMMENT_LIKE: '/savevideocommentlike',
  GET_COMMENTS_OF_VIDEOS: '/getcommentsofvideos', // + '/:userId/:videoId'
  
  // Follow/Unfollow
  FOLLOW_USER: '/api/follow-user',
  
  // Channel management
  SAVE_MY_CHANNEL: '/api/savemychannel',
  UPDATE_CHANNEL: '/api/updatechanel',
  GET_POPULAR_SHORT: '/getpopularshort', // + '/:videoType/:userId'
  GET_VIDEO_BY_CHANNEL: '/getvideobychannel', // + '/:videoType/:channelId/:userId'
  GET_FOLLOWED_CHANNELS: '/getlistoffollowedchannelbyuser', // + '/:userId'
  
  // Premium plans
  USER_PREMIUM_PLANS: '/api/user-premium-plans', // + '/:userId'
  CONTENT_PREMIUM_PLANS: '/api/content-premium-plans', // + '/:userId'
  UPGRADE_PREMIUM: '/api/upgrade-premium',
  UPGRADE_CONTENT_PREMIUM: '/api/upgrade-content-premium',
  
  // Razorpay
  RAZORPAY_DETAILS: '/razorpay-details',
  RAZORPAY_ORDER: '/api/razorpay-order',
  RAZORPAY_VERIFICATION: '/api/razorpay-verification',
  ADD_FUNDS: '/api/addfunds',
  
  // Celebration ads
  SAVE_CELEBRATION_ADS: '/api/savecelebrationadds',
  GET_CELEBRATION_ADS: '/getcelebrationads',
  SAVE_CELEBRATION_AD_VIEW: '/savecelebrationadview',
  
  // Others
  GET_SENT_NOTIFICATIONS: '/getsentnotification', // + '/:userId'
  UPDATE_USER: '/api/updateuser',
  UPLOAD_POST: '/api/post',
  UPLOAD_SHOT: '/uploadshot',
  GENERATE_PRESIGNED_URL: '/api/generatePresignedUrl',
  GET_REFERRAL_DETAILS: '/api/referral/details', // + '/:userId'
};
