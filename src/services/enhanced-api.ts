import axios from 'axios';
import { toast } from 'sonner';

// Use environment variable for API base URL
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7082';

// Create enhanced API instance
const enhancedAPI = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Track if we're already showing a login modal to prevent multiple modals
let isLoginModalOpen = false;
let authRedirectCallback: (() => void) | null = null;

// Function to set the auth redirect callback
export const setAuthRedirectCallback = (callback: () => void) => {
  authRedirectCallback = callback;
};

// Request interceptor to add auth token
enhancedAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('UserLoggedIn');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with better error handling
enhancedAPI.interceptors.response.use(
  (response) => {
    // Reset login modal flag on successful requests
    if (response.status === 200) {
      isLoginModalOpen = false;
    }
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    const status = error.response?.status;
    const url = error.config?.url || '';

    // Handle different types of errors
    switch (status) {
      case 401:
        handleUnauthorizedError(error);
        break;
      case 403:
        handleForbiddenError(error);
        break;
      case 404:
        handleNotFoundError(error, url);
        break;
      case 429:
        handleRateLimitError(error);
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        handleServerError(error);
        break;
      default:
        handleGenericError(error);
    }

    return Promise.reject(error);
  }
);

// Handle 401 Unauthorized errors
const handleUnauthorizedError = (error: any) => {
  console.log('🚫 401 Unauthorized - handling authentication error');
  
  // Clear auth data
  localStorage.removeItem('UserLoggedIn');
  localStorage.removeItem('user');
  localStorage.removeItem('UserId');
  localStorage.removeItem('tempUserId');

  // Show user-friendly message instead of raw error
  const isLoginEndpoint = error.config?.url?.includes('/login') || 
                         error.config?.url?.includes('/otpverify') ||
                         error.config?.url?.includes('/emailotpverify');

  if (isLoginEndpoint) {
    // Don't show generic auth error for login endpoints
    return;
  }

  // Show login modal only once
  if (!isLoginModalOpen && authRedirectCallback) {
    isLoginModalOpen = true;
    toast.error('Your session has expired. Please log in again.');
    
    // Small delay to ensure the toast is shown before modal
    setTimeout(() => {
      authRedirectCallback?.();
    }, 500);
  }
};

// Handle 403 Forbidden errors
const handleForbiddenError = (error: any) => {
  const message = error.response?.data?.message || 'Access denied. You do not have permission to perform this action.';
  toast.error(message);
};

// Handle 404 Not Found errors
const handleNotFoundError = (error: any, url: string) => {
  // Don't show 404 errors for certain endpoints
  const silentEndpoints = ['/api/ping', '/api/health'];
  const shouldShowError = !silentEndpoints.some(endpoint => url.includes(endpoint));

  if (shouldShowError) {
    const isOTPEndpoint = url.includes('otp');
    if (isOTPEndpoint) {
      toast.error('OTP not found or expired. Please request a new one.');
    } else {
      toast.error('The requested resource was not found.');
    }
  }
};

// Handle 429 Rate Limit errors
const handleRateLimitError = (error: any) => {
  const message = error.response?.data?.message || 'Too many requests. Please wait a moment and try again.';
  toast.error(message);
};

// Handle 5xx Server errors
const handleServerError = (error: any) => {
  const status = error.response?.status;
  let message = 'Server error occurred. Please try again later.';

  switch (status) {
    case 500:
      message = 'Internal server error. Our team has been notified.';
      break;
    case 502:
      message = 'Service temporarily unavailable. Please try again.';
      break;
    case 503:
      message = 'Service under maintenance. Please try again later.';
      break;
    case 504:
      message = 'Request timeout. Please check your connection and try again.';
      break;
  }

  toast.error(message);
};

// Handle network and other generic errors
const handleGenericError = (error: any) => {
  if (!error.response) {
    // Network error
    toast.error('Network connection failed. Please check your internet connection.');
  } else {
    // Other HTTP errors
    const message = error.response?.data?.message || 'An unexpected error occurred. Please try again.';
    toast.error(message);
  }
};

// Enhanced auth API with better error handling
export const enhancedAuthAPI = {
  sendOTP: (mobileNumber: string) => 
    enhancedAPI.post('/api/otplogin', { 
      mobileNumber,
      userType: 1
    }),
    
  verifyOTP: (mobileNumber: string, otp: string, id: string) => {
    const payload = {
      mobile_number: mobileNumber,
      otp: otp
    };
    console.log('📤 Sending payload to /api/otpverify:', payload);
    return enhancedAPI.post('/api/otpverify', payload);
  },

  sendEmailOTP: (email: string, userType: string = "2") => 
    enhancedAPI.post('/api/emailotp', { email, userType }),

  verifyEmailOTP: (email: string, otp: string, id: string) =>
    enhancedAPI.post('/api/emailotpverify', { email, otp, id }),

  logout: (id: string) =>
    enhancedAPI.post('/api/logout', { id }),

  // Test connection with better error handling
  testConnection: () => enhancedAPI.get('/api/ping'),

  // Get user by ID with auth handling
  getUserById: (userId: string) =>
    enhancedAPI.get(`/api/getuserbyid/${userId}`),
};

// Enhanced content API
export const enhancedContentAPI = {
  listPosts: (params: {
    category: number;
    page: number;
    limit: number;
    loggined_user_id: number;
  }) => enhancedAPI.post('/api/list-posts', params),

  getVideos: (userId: string, categoryId: string = "0", offset: string = "1") =>
    enhancedAPI.get(`/api/getvideos/${userId}/${categoryId}/${offset}`),

  getUserVideos: (userId: string) =>
    enhancedAPI.get(`/api/getrecentlyuploadedvideo/${userId}`),

  getUserShorts: (userId: string) =>
    enhancedAPI.get(`/api/getshots/${userId}`),

  getShorts: (userId: string) =>
    enhancedAPI.get(`/api/getshots/${userId}`),
};

// Enhanced user API
export const enhancedUserAPI = {
  getWalletBalance: (userId: string) =>
    enhancedAPI.get(`/api/getfunds/${userId}`),

  getChannel: (userId: string) =>
    enhancedAPI.get(`/api/getchannelbyuserid/${userId}`),

  getAnalytics: (channelId: string) =>
    enhancedAPI.get(`/api/analytics/${channelId}`),
};

// Utility function to check if API is reachable
export const checkAPIHealth = async (): Promise<boolean> => {
  try {
    const response = await enhancedAPI.get('/api/ping', { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

export default enhancedAPI;