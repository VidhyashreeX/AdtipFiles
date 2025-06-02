/**
 * API configuration
 */

// Base URL for API calls
export const API_BASE_URL = 'http://3.6.15.198:7082';

// Timeout for API calls (in milliseconds)
export const API_TIMEOUT = 30000;

// External service URLs
// Commented out PubScale integration - June 2, 2025
// export const PUBSCALE_BASE_URL = 'https://wow.pubscale.com';
// export const PUBSCALE_APP_ID = '39604779';

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
  
  // Payment  PAYMENT: {
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
  }
};
