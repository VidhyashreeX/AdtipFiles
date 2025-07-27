/**
 * API configuration
 */

// Base URL for API calls
//export const API_BASE_URL = 'https://api.adtip.in';   // Production URL
//export const API_BASE_URL = 'http://192.168.0.110:7082';   // Local Development URL
//export const API_BASE_URL = 'http://192.168.1.178:7082';   // DEV URL
export const API_BASE_URL = 'https://api.adtip.in';   // Production URL
//export const API_BASE_URL = 'http://192.168.250.209:7082';   // DEV URL
//export const API_BASE_URL = 'http://192.168.0.104:7082';   // DEV URL

// Firebase Cloud Functions URL for call notifications
export const FCM_SERVER_URL = "https://us-central1-adtip-3873c.cloudfunctions.net/callApi"; // Production
//export const FCM_SERVER_URL = API_BASE_URL; // Use same server as API for development

// Firebase Cloud Functions URL for chat notifications
export const FCM_CHAT_SERVER_URL = "https://us-central1-adtip-3873c.cloudfunctions.net/chatApi"; // Production

// Timeout for API calls (in milliseconds)
export const API_TIMEOUT = 30000;

// PubScale integration
export const PUBSCALE_APP_ID = '39604779';
export const PUBSCALE_BASE_URL = 'https://offerwall.pubscale.com';

// CPX Research integration
export const CPX_RESEARCH_APP_ID = '28376'; // Correct app ID for this project
export const CPX_RESEARCH_BASE_URL = 'https://offers.cpx-research.com';
export const CPX_RESEARCH_API_URL = 'https://live-api.cpx-research.com/api/get-surveys.php';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/otplogin',
    VERIFY_OTP: '/api/otpverify',
    LOGOUT: '/api/logout',
    SAVE_USER_DETAILS: '/api/saveuserdetails',
    PING: '/api/ping',
  },

  // Home
  HOME: {
    LIST_POSTS: '/api/list-posts',
    GET_FUNDS: '/api/getfunds',
    CHECK_PREMIUM: '/api/check-premium',
  },

  // Channels
  CHANNEL: {
    GET_BY_USER_ID: '/api/getchannelbyuserid',
    GET_ANALYTICS: '/api/analytics',
  },

  // Videos
  VIDEOS: {
    GET_VIDEOS: '/api/getvideos',
    GET_SHOTS: '/api/getshots',
  },

  // Users
  USERS: {
    GET_USERS: '/api/users',
    GET_ALL_USERS: '/api/allusers',
    FOLLOW: '/api/follow',
  },

  // Profile
  PROFILE: {
    USER_PREMIUM_PLANS: '/api/user-premium-plans',
    CONTENT_PREMIUM_PLANS: '/api/content-premium-plans',
    USER_POSTS: '/users',
  },

  // Referral
  REFERRAL: {
    GET_DETAILS: '/referral/details',
  },

  // Payment
  PAYMENT: {
    ADD_FUNDS: '/api/add-funds',
    WITHDRAW_FUNDS: '/api/withdraw-funds',
  },

  // Analytics
  ANALYTICS: {
    TRACK: '/api/track-analytics',
    // Commented out PubScale integration - June 2, 2025
    // PUBSCALE: '/api/track-pubscale',
  },

  // Rewards
  REWARDS: {
    // Commented out PubScale integration - June 2, 2025
    // TRACK_REWARD: '/api/track-reward',
  },
};

// Legacy flat endpoints structure for backward compatibility
export const ENDPOINTS = {
  // Auth endpoints
  OTP_LOGIN: '/api/otplogin',
  OTP_VERIFY: '/api/otpverify',
  LOGOUT: '/api/logout',
  SAVE_USER_DETAILS: '/api/saveuserdetails',
  PING: '/api/ping',

  // Content endpoints
  CREATE_POST: '/api/create-post',
  GET_CATEGORIES: '/api/categories',
  UPLOAD_VIDEO: '/api/upload-video',
  UPLOAD_SHORT: '/api/upload-short',

  // Media endpoints
  GET_VIDEO: '/api/video',
  CHECK_LIKE: '/api/check-like',
  CHECK_SUBSCRIBE: '/api/check-subscribe',
  TRACK_VIEW: '/api/track-view',
  EARN_REWARD: '/api/earn-reward',
  LIKE_VIDEO: '/api/like-video',
  UNLIKE_VIDEO: '/api/unlike-video',
  SUBSCRIBE: '/api/subscribe',
  UNSUBSCRIBE: '/api/unsubscribe',
  GET_PUBLIC_SHOTS: '/api/public-shots',
  GET_SHORTS: '/api/getshots',

  // Wallet endpoints
  GET_WALLET_BALANCE: '/api/wallet/balance',
  // Reward endpoints
  TRACK_WATCH_TIME: '/api/track-watch-time',
  GET_REWARD_BALANCE: '/api/reward/balance',
  CHECK_DAILY_REWARD: '/api/daily-reward/check',
  GET_REWARD_HISTORY: '/api/reward/history',
  TRACK_REWARD: '/api/track-reward',

  // Analytics
  TRACK_ANALYTICS: '/api/track-analytics',

  // Commented out PubScale integration - June 2, 2025
  // REWARDS: {
  //   TRACK_REWARD: '/api/track-reward',
  // }
};
