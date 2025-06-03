// src/services/ApiService.ts
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ApiEndpoints from '../constants/apiEndpoints';
import {
  ApiResponse,
  OtpLoginRequest,
  OtpLoginResponse,
  OtpVerifyRequest,
  OtpVerifyResponse,
  LogoutRequest,
  UserDetailsRequest,
  WalletBalanceResponse,
  PostListRequest,
  PostListResponse,
  PremiumCheckResponse,
  UserListRequest,
  UserListResponse,
  ReferralDetailsResponse,
  Post,
  User
} from '../types/api';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add request interceptor to add auth token to every request
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors here
    if (error.response) {
      // Server responded with an error
      if (error.response.status === 401) {
        // Unauthorized - token expired or invalid
        // Could handle logout or token refresh here
      }
      
      if (error.response.status === 429) {
        // Rate limited
        console.warn('API rate limit exceeded. Please try again later.');
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

/**
 * API Service for handling network requests
 */
export default class ApiService {
  /**
   * Make a GET request
   * @param url - Endpoint URL (will be appended to base URL)
   * @param params - Query parameters
   * @param config - Additional axios config
   */
  static async get<T = any>(
    url: string, 
    params?: any, 
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await apiClient.get(url, { 
        params, 
        ...config 
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Make a POST request
   * @param url - Endpoint URL (will be appended to base URL)
   * @param data - Request body data
   * @param config - Additional axios config
   */
  static async post<T = any>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await apiClient.post(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Make a PUT request
   * @param url - Endpoint URL (will be appended to base URL)
   * @param data - Request body data
   * @param config - Additional axios config
   */
  static async put<T = any>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await apiClient.put(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Make a PATCH request
   * @param url - Endpoint URL (will be appended to base URL)
   * @param data - Request body data
   * @param config - Additional axios config
   */
  static async patch<T = any>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await apiClient.patch(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Make a DELETE request
   * @param url - Endpoint URL (will be appended to base URL)
   * @param config - Additional axios config
   */
  static async delete<T = any>(
    url: string, 
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await apiClient.delete(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Upload a file
   * @param url - Endpoint URL (will be appended to base URL)
   * @param formData - FormData containing file and additional data
   * @param onProgress - Progress callback (percentage)
   * @param config - Additional axios config
   */
  static async uploadFile<T = any>(
    url: string,
    formData: FormData,
    onProgress?: (percentage: number) => void,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await apiClient.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentage = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentage);
          }
        },
        ...config,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Standard error handler
   * @param error - Error object
   */
  private static handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const serverError = error.response?.data?.message || error.message;
      return new Error(serverError);
    }
    return error;
  }

  // ===== AUTHENTICATION SERVICES =====

  /**
   * Send OTP for login
   * @param data - Request data containing mobile number and user type
   */
  static async sendLoginOtp(data: OtpLoginRequest): Promise<ApiResponse<OtpLoginResponse[]>> {
    return this.post<ApiResponse<OtpLoginResponse[]>>(ApiEndpoints.AUTH_ENDPOINTS.OTP_LOGIN, data);
  }

  /**
   * Verify OTP
   * @param data - Request data containing mobile number, OTP, and ID
   */
  static async verifyOtp(data: OtpVerifyRequest): Promise<ApiResponse<OtpVerifyResponse[]> & { accessToken: string }> {
    const response = await this.post<ApiResponse<OtpVerifyResponse[]> & { accessToken: string }>(
      ApiEndpoints.AUTH_ENDPOINTS.OTP_VERIFY, 
      data
    );
    
    // Store the token for future requests
    if (response.accessToken) {
      await AsyncStorage.setItem('@auth_token', response.accessToken);
    }
    
    return response;
  }

  /**
   * Logout user
   * @param userId - User ID
   */
  static async logout(userId: string): Promise<any> {
    const data: LogoutRequest = { id: userId };
    return this.post(ApiEndpoints.AUTH_ENDPOINTS.LOGOUT, data);
  }

  /**
   * Save or update user details
   * @param data - User details data
   */
  static async saveUserDetails(data: UserDetailsRequest): Promise<ApiResponse<OtpVerifyResponse[]>> {
    return this.post<ApiResponse<OtpVerifyResponse[]>>(ApiEndpoints.AUTH_ENDPOINTS.SAVE_USER_DETAILS, data);
  }

  /**
   * Ping the server to keep the session alive
   */
  static async ping(): Promise<any> {
    return this.get(ApiEndpoints.AUTH_ENDPOINTS.PING);
  }

  // ===== HOME PAGE SERVICES =====
  /**
   * Get wallet balance
   * @param userId - User ID
   */  
  static async getWalletBalance(userId: string | number): Promise<WalletBalanceResponse> {
    // Ensure the userId is correctly formatted in the URL path
    return this.get<WalletBalanceResponse>(`${ApiEndpoints.HOME_ENDPOINTS.GET_WALLET_BALANCE}/${userId}`);
  }

  /**
   * Get list of posts
   * @param data - Request data containing category, page, limit, and logged-in user ID
   */
  static async listPosts(data: PostListRequest): Promise<PostListResponse> {
    return this.post<PostListResponse>(ApiEndpoints.HOME_ENDPOINTS.LIST_POSTS, data);
  }

  /**
   * Check if user has premium subscription
   * @param userId - User ID
   */
  static async checkPremium(userId: string | number): Promise<PremiumCheckResponse> {
    return this.get<PremiumCheckResponse>(`${ApiEndpoints.HOME_ENDPOINTS.CHECK_PREMIUM}/${userId}`);
  }

  /**
   * Get ad passbook
   * @param userId - User ID
   */
  static async getAdPassbook(userId: string | number): Promise<any> {
    return this.get(`${ApiEndpoints.HOME_ENDPOINTS.GET_AD_PASSBOOK}/${userId}`);
  }

  /**
   * Get channel by user ID
   * @param userId - User ID
   */
  static async getChannelByUserId(userId: string | number): Promise<any> {
    return this.get(`${ApiEndpoints.HOME_ENDPOINTS.GET_CHANNEL_BY_USER_ID}/${userId}`);
  }

  // ===== TIP-TUBE SERVICES =====

  /**
   * Get videos
   * @param userId - User ID
   * @param categoryId - Category ID (0 for all categories)
   * @param offset - Page offset
   */
  static async getVideos(userId: string | number, categoryId: number, offset: number): Promise<any> {
    return this.get(`${ApiEndpoints.TIP_TUBE_ENDPOINTS.GET_VIDEOS}/${userId}/${categoryId}/${offset}`);
  }

  /**
   * Get channel analytics
   * @param channelId - Channel ID
   */
  static async getChannelAnalytics(channelId: string | number): Promise<any> {
    return this.get(`${ApiEndpoints.TIP_TUBE_ENDPOINTS.GET_ANALYTICS}/${channelId}`);
  }

  // ===== TIP-SHORTS SERVICES =====

  /**
   * Get shorts
   * @param userId - User ID
   */
  static async getShorts(userId: string | number): Promise<any> {
    return this.get(`${ApiEndpoints.TIP_SHORTS_ENDPOINTS.GET_SHORTS}/${userId}`);
  }

  // ===== TIP-CALLS SERVICES =====

  /**
   * Get users
   * @param data - Request data for filtering users
   */
  static async getUsers(data: UserListRequest): Promise<UserListResponse> {
    return this.post<UserListResponse>(ApiEndpoints.TIP_CALLS_ENDPOINTS.GET_USERS, data);
  }

  /**
   * Get all users
   * @param data - Request data for filtering all users
   */
  static async getAllUsers(data: UserListRequest): Promise<UserListResponse> {
    return this.post<UserListResponse>(ApiEndpoints.TIP_CALLS_ENDPOINTS.GET_ALL_USERS, data);
  }

  // ===== PROFILE SERVICES =====

  /**
   * Get user premium plans
   * @param userId - User ID
   */
  static async getUserPremiumPlans(userId: string | number): Promise<any> {
    return this.get(`${ApiEndpoints.PROFILE_ENDPOINTS.USER_PREMIUM_PLANS}/${userId}`);
  }

  /**
   * Get content premium plans
   * @param userId - User ID
   */
  static async getContentPremiumPlans(userId: string | number): Promise<any> {
    return this.get(`${ApiEndpoints.PROFILE_ENDPOINTS.CONTENT_PREMIUM_PLANS}/${userId}`);
  }

  /**
   * Get user posts
   * @param userId - User ID
   */
  static async getUserPosts(userId: string | number): Promise<any> {
    return this.get(`${ApiEndpoints.PROFILE_ENDPOINTS.USER_POSTS}/${userId}/posts`);
  }

  /**
   * Get user followings
   * @param userId - User ID
   */
  static async getUserFollowings(userId: string | number): Promise<any> {
    return this.get(`${ApiEndpoints.PROFILE_ENDPOINTS.GET_FOLLOWING}/${userId}`);
  }

  /**
   * Get user followers
   * @param userId - User ID
   */
  static async getUserFollowers(userId: string | number): Promise<any> {
    return this.get(`${ApiEndpoints.PROFILE_ENDPOINTS.GET_FOLLOWERS}/${userId}`);
  }

  // ===== REFERRAL SERVICES =====

  /**
   * Get referral details
   * @param userId - User ID
   */
  static async getReferralDetails(userId: string | number): Promise<ReferralDetailsResponse> {
    return this.get<ReferralDetailsResponse>(`${ApiEndpoints.REFERRAL_ENDPOINTS.GET_REFERRAL_DETAILS}/${userId}`);
  }
}
