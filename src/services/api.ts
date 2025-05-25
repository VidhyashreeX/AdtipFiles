import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL?.endsWith("/api")
  ? import.meta.env.VITE_API_URL
  : `${import.meta.env.VITE_API_URL}/api`;

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('UserLoggedIn');
  const user = localStorage.getItem('user');

  if (token && user) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear auth state if token is invalid
      localStorage.removeItem('user');
      localStorage.removeItem('UserLoggedIn');
      window.location.href = '/login';
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

// Auth APIs
export const authAPI = {
  sendOTP: (mobileNumber: string, userType: string = "2") =>
    api.post<OTPResponse>('/otplogin', { mobileNumber, userType }),

  verifyOTP: (mobile_number: string, otp: string, id: string) =>
    api.post<VerifyOTPResponse>('/otpverify', { mobile_number, otp, id }),

  logout: (id: string) =>
    api.post('/logout', { id }),

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
  }) => api.post('/saveuserdetails', data),

  ping: () => api.get('/ping'),

  sendEmailOTP: (email: string, userType: string = "2") => 
    api.post<OTPResponse>('/emailotp', { email, userType }),

  verifyEmailOTP: (email: string, otp: string, id: string) =>
    api.post<VerifyOTPResponse>('/emailotpverify', { email, otp, id }),
};

// Content APIs
export const contentAPI = {
  listPosts: (params: {
    category: number;
    page: number;
    limit: number;
    loggined_user_id: number;
  }) => api.post<PostListResponse>('/list-posts', params),

  getVideos: (userId: string, categoryId: string = "0", offset: string = "1") =>
    api.get(`/getvideos/${userId}/${categoryId}/${offset}`),

  getShorts: (userId: string) =>
    api.get(`/getshots/${userId}`),

  checkPremium: (userId: string) =>
    api.get(`/check-premium/${userId}`),
};

// User APIs
export const userAPI = {
  getWalletBalance: (userId: string) =>
    api.get<WalletResponse>(`/getfunds/${userId}`),

  getChannel: (userId: string) =>
    api.get(`/getchannelbyuserid/${userId}`),

  getAnalytics: (channelId: string) =>
    api.get(`/analytics/${channelId}`),
};

export default api;
