import axios from 'axios';

// Use environment variable for API base URL
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7082';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('UserLoggedIn');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data
    });
    
    // Only redirect on actual 401 (unauthorized) errors
    if (error.response?.status === 401) {
      console.log('🚫 401 Unauthorized - clearing auth data and redirecting');
      localStorage.removeItem('UserLoggedIn');
      localStorage.removeItem('user');
      localStorage.removeItem('UserId');
      
      // Only redirect if we're not already on the login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API Response Types
interface OTPResponse {
  status: number;
  message: string;
  data: Array<{
    otp: string;
    id: number;
    messageId: string;
    mobile_number: string;
    user_type: string;
    isOtpVerified: number;
    is_first_time: boolean;
  }>;
}

interface VerifyOTPResponse {
  status: number;
  message: string;
  accessToken: string;
  data: Array<{
    id: number;
    name: string;
    firstName: string | null;
    lastName: string | null;
    emailId: string;
    gender: string;
    dob: string;
    profile_image: string;
    mobile_number: string;
    profession: string;
    maternal_status: string;
    address: string;
    longitude: string;
    latitude: string;
    pincode: string | null;
    isOtpVerified: number;
    isSaveUserDetails: number;
    online_status: boolean;
    referal_code: string;
    referal_earnings: number;
    bio: string;
    premium_plan_id: number;
    content_creator_plan_id: number;
    is_available: boolean;
    dnd: boolean;
    premium: number;
    country_code: string;
    country: string;
    languages: Array<{ id: number; name: string; isPrimary: boolean }>;
    interests: Array<{ id: number; name: string; isPrimary: boolean }>;
    is_premium: boolean;
  }>;
}

interface WalletResponse {
  status: number;
  message: string;
  availableBalance: string;
}

interface PostListResponse {
  status: boolean;
  message: string;
  data: Array<{
    id: number;
    user_id: number;
    title: string;
    content: string;
    media_url: string;
    media_type: "video" | "image";
    is_promoted: number;
    video_category_id: number;
    user_name: string | null;
    user_profile_image: string | null;
    address: string | null;
    category_name: string;
    post_promotion_id: number | null;
    target_min_age: number | null;
    target_max_age: number | null;
    reach_goal: number | null;
    duration_days: number | null;
    pay_per_view: string | null;
    total_pay: string | null;
    platform_fee: string | null;
    likeCount: number;
    commentCount: number;
    is_liked: boolean;
  }>;
  pagination: {
    current_page: number;
    total_page: number;
    total_count: number;
  };
}

export interface ChannelInfo {
  channelId: string; // This is the key field
  channelName: string;
  description: string;
  // ... other fields
}

// Auth APIs
export const authAPI = {
  sendOTP: (mobileNumber: string) => 
    api.post('/api/otplogin', { 
      mobileNumber,
      userType: 1
    }),
    
  verifyOTP: (mobileNumber: string, otp: string, id: string) => {
    const payload = {
      mobile_number: mobileNumber,
      otp: otp
    };
    console.log('📤 Sending payload to /api/otpverify:', payload);
    return api.post('/api/otpverify', payload)
      .then(response => {
        console.log('✅ verifyOTP response:', response.data);
        return response;
      })
      .catch(error => {
        console.error('❌ verifyOTP error:', {
          status: error.response?.status,
          data: error.response?.data,
          payload
        });
        throw error;
      });
  },

  logout: (id: string) =>
    api.post('/api/logout', { id }),

  saveUserDetails: (data: {
    id: number;
    name: string;
    firstname: string;
    lastname: string;
    gender: string;
    dob: string;
    profile_image: string;
    profession: string;
    maternal_status: string;
    address: string;
    emailId: string;
    longitude: string;
    latitude: string;
    pincode: string;
    languages: number;
    interests: number;
    referal_code: string;
  }) => api.post('/api/saveuserdetails', data),

  ping: () => api.get('/api/ping'),

  sendEmailOTP: (email: string, userType: string = "2") => 
    api.post<OTPResponse>('/api/emailotp', { email, userType }),

  verifyEmailOTP: (email: string, otp: string, id: string) =>
    api.post<VerifyOTPResponse>('/api/emailotpverify', { email, otp, id }),

  // Add a test endpoint to verify API connectivity
  testConnection: () => api.get('/api/ping'),
};

// Content APIs
export const contentAPI = {
  listPosts: (params: {
    category: number;
    page: number;
    limit: number;
    loggined_user_id: number;
  }) => api.post<PostListResponse>('/api/list-posts', params),

  getVideos: (userId: string, categoryId: string = "0", offset: string = "1") =>
    api.get(`/api/getvideos/${userId}/${categoryId}/${offset}`),

  // Get user's own videos (TipTube content) - using existing endpoint with user filter
  getUserVideos: (userId: string) =>
    api.get(`/api/getvideos/${userId}/0/1`),

  // Get user's own shorts (TipShorts content) - using existing endpoint  
  getUserShorts: (userId: string) =>
    api.get(`/api/getshots/${userId}`),

  getShorts: (userId: string) =>
    api.get(`/api/getshots/${userId}`),

  // ⭐ New: Fetch a single short by ID (for deep linking)
  getShortById: (userId: string, shortId: string) =>
    api.get(`/api/getShortById/${userId}/${shortId}`),

  // Premium checks are handled exclusively via premiumService:
  // - GET /api/user-premium-status/:userId
  // - GET /api/content-premium/status/:userId
};

// User APIs
export const userAPI = {
  getWalletBalance: (userId: string) =>
    api.get<WalletResponse>(`/api/getfunds/${userId}`),

  getChannel: (userId: string) =>
    api.get(`/api/getchannelbyuserid/${userId}`),

  getAnalytics: (channelId: string) =>
    api.get(`/api/analytics/${channelId}`),

  getChannelSubscribers: (channelId: string) =>
    api.get(`/api/channel/${channelId}/subscribers`),
};

export const uploadVideo = (formData: FormData, token: string) => {
  return api.post('/api/uploadcontent', formData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });
};

export default api;
