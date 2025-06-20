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
  INITIATE_CALL: '/api/initiate-call', // Add this new endpoint
  GET_AGORA_TOKEN_CALLER: '/api/get-agora-token/caller',
  GET_AGORA_TOKEN_CALLEE: '/api/get-agora-token/callee',
  GET_RTM_TOKEN: '/api/get-rtm-token',
  MISSED_CALLS: '/api/missed-calls',
  UPDATE_FCM_TOKEN: '/api/update-fcm-token',

  // VideoSDK specific endpoints - make sure these match your backend routes
  VIDEOSDK_GENERATE_TOKEN: '/api/generate-token/videosdk',
  VIDEOSDK_CREATE_MEETING: '/api/create-meeting/videosdk',
  VIDEOSDK_DEACTIVATE_ROOM: '/api/deactivate-room/videosdk',
  VIDEOSDK_VALIDATE_MEETING: '/api/validate-meeting/videosdk',
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
