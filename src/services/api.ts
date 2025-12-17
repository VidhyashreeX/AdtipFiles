import axios from 'axios';
import { triggerLoginModal } from '../utils/authRedirect';
import { UpdateChannelRequest, UserCompleteData, ChannelData, VideoData, Post } from '../types';

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
    
    const status = error.response?.status;
    const url = error.config?.url || '';
    
    // Handle different error types with user-friendly messages
    if (status === 401) {
      console.log('🚫 401 Unauthorized - clearing auth data');
      localStorage.removeItem('UserLoggedIn');
      localStorage.removeItem('user');
      localStorage.removeItem('UserId');
      
      // Only trigger login modal if we're not already on auth pages
      const authPages = ['/login', '/verify-otp', '/onboarding'];
      const isAuthPage = authPages.some(page => window.location.pathname.includes(page));
      
      if (!isAuthPage) {
        triggerLoginModal();
      }
    } else if (status === 404 && url.includes('otp')) {
      // Handle OTP-specific 404 errors
      console.log('🔍 OTP not found - likely expired');
    } else if (status >= 500) {
      // Handle server errors
      console.log('🚨 Server error occurred');
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

  // Updated: Use the proper recently uploaded videos endpoint
  getUserVideos: (userId: string) =>
    api.get(`/api/getrecentlyuploadedvideo/${userId}`),

  // Get user's own shorts (TipShorts content) - using existing endpoint  
  getUserShorts: (userId: string) =>
    api.get(`/api/getshots/${userId}`),

  // Get videos by channel - this matches mobile app pattern
  getVideosByChannel: (videoType: string, channelId: string, userId: string) =>
    api.get(`/api/getvideobychannel/${videoType}/${channelId}/${userId}`),

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

  // Updated to match mobile app's endpoint: /api/analytics/:channelId
  getAnalytics: (channelId: string) =>
    api.get(`/api/analytics/${channelId}`),

  // Add channel analytics endpoints to match backend
  getChannelAnalytics: (channelId: string) =>
    api.get(`/api/channel-analytics/${channelId}`),

  getChannelDashboard: (channelId: string) =>
    api.get(`/api/channel-analytics/${channelId}/dashboard`),

  getChannelSubscribers: (channelId: string) =>
    api.get(`/api/channel/${channelId}/subscribers`),

  // Add channel content endpoint
  getChannelContent: (channelId: string) =>
    api.get(`/api/channel/${channelId}/content`),

  // Add channel earnings endpoint
  getChannelEarnings: (channelId: string) =>
    api.get(`/api/channel/${channelId}/earnings`),

  // Add channel update endpoint
  updateChannel: (channelId: string, data: UpdateChannelRequest) =>
    api.post(`/api/channel/${channelId}/update`, data),

  // Get user's posts using the proper endpoint (matches mobile app)
  getUserPosts: (userId: string, page: number = 1, limit: number = 10, loggedUserId: number = 0) =>
    api.get(`/api/users/${userId}/posts?page=${page}&limit=${limit}&loggined_user_id=${loggedUserId}`),

  // Get consolidated profile data (matches mobile app)
  getConsolidatedProfile: (userId: string, loggedUserId?: number) => {
    const params = loggedUserId ? `?loggined_user_id=${loggedUserId}` : '';
    return api.get(`/api/users/${userId}/profile${params}`);
  },

  // Add comprehensive user data fetch (similar to mobile app)
  getUserCompleteData: async (userId: string) => {
    try {
      const [channelResponse, videosResponse, shortsResponse, postsResponse] = await Promise.allSettled([
        api.get(`/api/getchannelbyuserid/${userId}`),
        api.get(`/api/getrecentlyuploadedvideo/${userId}`),
        api.get(`/api/getshots/${userId}`),
        api.get(`/api/users/${userId}/posts`)
      ]);

      const result: UserCompleteData = {
        channel: null,
        videos: [],
        shorts: [],
        posts: [],
        errors: []
      };

      if (channelResponse.status === 'fulfilled' && channelResponse.value.data?.status) {
        const channelData = channelResponse.value.data.data;
        result.channel = Array.isArray(channelData) ? channelData[0] : channelData;
      } else {
        result.errors.push('Failed to fetch channel data');
      }

      if (videosResponse.status === 'fulfilled' && videosResponse.value.data?.status) {
        result.videos = videosResponse.value.data.data || [];
      } else {
        result.errors.push('Failed to fetch videos');
      }

      if (shortsResponse.status === 'fulfilled' && shortsResponse.value.data?.status) {
        result.shorts = shortsResponse.value.data.data || [];
      } else {
        result.errors.push('Failed to fetch shorts');
      }

      if (postsResponse.status === 'fulfilled' && postsResponse.value.data?.status) {
        result.posts = postsResponse.value.data.data || [];
      } else {
        result.errors.push('Failed to fetch posts');
      }

      return result;
    } catch (error) {
      console.error('Error fetching complete user data:', error);
      throw error;
    }
  },
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
