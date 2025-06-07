// src/services/ApiService.ts
import axios, {AxiosRequestConfig, AxiosResponse} from 'axios';
import {API_BASE_URL} from '../constants/api';
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
  AgoraTokenRequest,
  AgoraTokenResponse,
  AgoraCallRequest,
  FcmTokenRequest,
  MissedCallsResponse,
} from '../types/api';

// Define public endpoints that don't require authentication
const PUBLIC_ENDPOINTS = [
  ApiEndpoints.AUTH_ENDPOINTS.OTP_LOGIN,
  ApiEndpoints.AUTH_ENDPOINTS.OTP_VERIFY
];

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Increase to 60 seconds
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Add request interceptor to add auth token to requests (except public endpoints)
apiClient.interceptors.request.use(
  async config => {
    try {
      // Check if the URL is a public endpoint that doesn't need authentication
      const isPublicEndpoint = PUBLIC_ENDPOINTS.some(endpoint => 
        config.url?.includes(endpoint)
      );

      // Only try to add auth token for protected endpoints
      if (!isPublicEndpoint) {
        // Check both token storage keys - the app uses 'accessToken', but our service was checking '@auth_token'
        let token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          token = await AsyncStorage.getItem('@auth_token'); // Fallback to old key format
        }
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('Authorization header added to request');
        } else {
          console.warn('No auth token found for protected endpoint');
        }
      }
    } catch (error) {
      console.error('Error adding auth token:', error);
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
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
  },
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
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await apiClient.get(url, {
        params,
        ...config,
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
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await apiClient.post(
        url,
        data,
        config,
      );
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
    config?: AxiosRequestConfig,
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
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await apiClient.patch(
        url,
        data,
        config,
      );
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
    config?: AxiosRequestConfig,
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
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await apiClient.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: progressEvent => {
          if (onProgress && progressEvent.total) {
            const percentage = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
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
      // Detailed logging to diagnose the exact issue
      console.log('API Error Details:', {
        isAxiosError: true,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          timeout: error.config?.timeout,
        }
      });
      
      if (error.response) {
        // The server responded with an error status
        const serverMessage = error.response.data?.message || error.response.statusText;
        return new Error(serverMessage || error.message);
      } else if (error.request) {
        // The request was made but no response was received
        console.log('Request was made but no response received:', error.request);
        // Check if we're using the emulator and if the API is on localhost
        const isEmulator = error.config?.baseURL?.includes('10.0.2.2');
        if (isEmulator) {
          return new Error('Network error while connecting to local server. Ensure your server is running and accessible.');
        }
        return new Error('Network error. Check your connection and try again.');
      } else {
        // Something happened in setting up the request
        return new Error(`Error setting up request: ${error.message}`);
      }
    }
    // Not an Axios error
    console.log('Non-Axios error:', error);
    return error instanceof Error ? error : new Error(String(error));
  }

  // ===== AUTHENTICATION SERVICES =====

  /**
   * Send OTP for login
   * @param data - Request data containing mobile number and user type
   */
  static async sendLoginOtp(
    data: OtpLoginRequest,
  ): Promise<ApiResponse<OtpLoginResponse[]>> {
    return this.post<ApiResponse<OtpLoginResponse[]>>(
      ApiEndpoints.AUTH_ENDPOINTS.OTP_LOGIN,
      data,
    );
  }

  /**
   * Verify OTP
   * @param data - Request data containing mobile number, OTP, and ID
   */ static async verifyOtp(
    data: OtpVerifyRequest,
  ): Promise<ApiResponse<OtpVerifyResponse[]> & {accessToken: string}> {
    const response = await this.post<
      ApiResponse<OtpVerifyResponse[]> & {accessToken: string}
    >(ApiEndpoints.AUTH_ENDPOINTS.OTP_VERIFY, data);

    // Store the token for future requests
    if (response.accessToken) {
      await AsyncStorage.setItem('accessToken', response.accessToken);
    }

    return response;
  }

  /**
   * Logout user
   * @param userId - User ID
   */
  static async logout(userId: string): Promise<any> {
    const data: LogoutRequest = {id: userId};
    return this.post(ApiEndpoints.AUTH_ENDPOINTS.LOGOUT, data);
  }

  /**
   * Save or update user details
   * @param data - User details data
   */
  static async saveUserDetails(
    data: UserDetailsRequest,
  ): Promise<ApiResponse<OtpVerifyResponse[]>> {
    return this.post<ApiResponse<OtpVerifyResponse[]>>(
      ApiEndpoints.AUTH_ENDPOINTS.SAVE_USER_DETAILS,
      data,
    );
  }

  /**
   * Ping the server to keep the session alive
   */
  static async ping(): Promise<any> {
    return this.get(ApiEndpoints.AUTH_ENDPOINTS.PING);
  }

  /**
   * Ping the server to check if it's alive
   */
  public ping(): Promise<any> {
    return this.api.get('/api/ping');
  }
  // ===== HOME PAGE SERVICES =====

  /**
   * Get wallet balance
   * @param userId - User ID
   */
  static async getWalletBalance(
    userId: string | number,
  ): Promise<WalletBalanceResponse> {
    try {
      // Add logging to debug the API call
      console.log(`Fetching wallet balance for user ID: ${userId}`);
      console.log(
        `Using endpoint: ${ApiEndpoints.HOME_ENDPOINTS.GET_WALLET_BALANCE}/${userId}`,
      );

      // Make sure userId is properly formatted
      const formattedUserId = userId.toString().trim();

      // Get the token to check if it's available
      let token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        token = await AsyncStorage.getItem('@auth_token'); // Fallback to old key format
      }
      console.log('Auth token available:', !!token);

      if (!token) {
        console.warn('No authentication token found. API request might fail.');
      }

      // Make the API call
      console.log('Making API request to get wallet balance...');
      const response = await this.get<WalletBalanceResponse>(
        `${ApiEndpoints.HOME_ENDPOINTS.GET_WALLET_BALANCE}/${formattedUserId}`,
      );
      console.log('Wallet balance API response:', JSON.stringify(response));
      return response;
    } catch (error) {
      console.error('Error in getWalletBalance:', error);
      // Return a default response to prevent app crashes
      return {
        status: 0,
        message: 'Failed to fetch wallet balance',
        availableBalance: '0.00',
      };
    }
  }

  /**
   * Get list of posts
   * @param data - Request data containing category, page, limit, and logged-in user ID
   */
  static async listPosts(data: PostListRequest): Promise<PostListResponse> {
    return this.post<PostListResponse>(
      ApiEndpoints.HOME_ENDPOINTS.LIST_POSTS,
      data,
    );
  }

  /**
   * Check if user has premium subscription
   * @param userId - User ID
   */
  static async checkPremium(
    userId: string | number,
  ): Promise<PremiumCheckResponse> {
    return this.get<PremiumCheckResponse>(
      `${ApiEndpoints.HOME_ENDPOINTS.CHECK_PREMIUM}/${userId}`,
    );
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
    return this.get(
      `${ApiEndpoints.HOME_ENDPOINTS.GET_CHANNEL_BY_USER_ID}/${userId}`,
    );
  }

  // ===== TIP-TUBE SERVICES =====

  /**
   * Get videos
   * @param userId - User ID
   * @param categoryId - Category ID (0 for all categories)
   * @param offset - Page offset
   */
  static async getVideos(
    userId: string | number,
    categoryId: number,
    offset: number,
  ): Promise<any> {
    return this.get(
      `${ApiEndpoints.TIP_TUBE_ENDPOINTS.GET_VIDEOS}/${userId}/${categoryId}/${offset}`,
    );
  }

  /**
   * Get channel analytics
   * @param channelId - Channel ID
   */
  static async getChannelAnalytics(channelId: string | number): Promise<any> {
    return this.get(
      `${ApiEndpoints.TIP_TUBE_ENDPOINTS.GET_ANALYTICS}/${channelId}`,
    );
  }

  // ===== TIP-SHORTS SERVICES =====

  /**
   * Get shorts
   * @param userId - User ID
   */
  static async getShorts(userId: string | number): Promise<any> {
    return this.get(
      `${ApiEndpoints.TIP_SHORTS_ENDPOINTS.GET_SHORTS}/${userId}`,
    );
  }

  // ===== TIP-CALLS SERVICES =====

  /**
   * Get users
   * @param data - Request data for filtering users
   */
  static async getUsers(data: UserListRequest): Promise<UserListResponse> {
    return this.post<UserListResponse>(
      ApiEndpoints.TIP_CALLS_ENDPOINTS.GET_USERS,
      data,
    );
  }

  /**
   * Get all users
   * @param data - Request data for filtering all users
   */
  static async getAllUsers(data: UserListRequest): Promise<UserListResponse> {
    return this.post<UserListResponse>(
      ApiEndpoints.TIP_CALLS_ENDPOINTS.GET_ALL_USERS,
      data,
    );
  }

  // ===== AGORA API SERVICES =====

  /**
   * Get Agora token for a channel
   * @param data - Request data containing channel name and uid
   */
  static async getAgoraToken(
    data: AgoraTokenRequest,
  ): Promise<ApiResponse<AgoraTokenResponse>> {
    return this.post<ApiResponse<AgoraTokenResponse>>(
      ApiEndpoints.TIP_CALLS_ENDPOINTS.GET_AGORA_TOKEN,
      data,
    );
  }

  /**
   * Handle call actions (start, end, missed)
   * @param data - Call action data
   */
  static async handleCall(
    data: AgoraCallRequest,
  ): Promise<ApiResponse<any>> {
    return this.post<ApiResponse<any>>(
      ApiEndpoints.TIP_CALLS_ENDPOINTS.CALL,
      data,
    );
  }

  /**
   * Update call status for call tracking
   * @param callerId - ID of the caller
   * @param receiverId - ID of the receiver
   * @param status - Call status (accepted, rejected, missed, ended)
   * @param callType - Type of call (audio or video)
   * @param callId - Optional call ID for tracking ongoing calls
   */
  static async updateCallStatus(
    callerId: string | number,
    receiverId: string | number,
    status: string,
    callType: string,
    callId?: number,
  ): Promise<ApiResponse<any>> {
    // Map the status to the appropriate action for the API
    let action: 'start' | 'end' | 'missed-video-call' | 'missed-audio-call';
    
    switch (status) {
      case 'accepted':
        action = 'start';
        break;
      case 'missed':
        action = callType === 'video' ? 'missed-video-call' : 'missed-audio-call';
        break;
      default:
        action = 'end'; // Default to end for rejected/ended calls
    }
    
    return this.handleCall({
      callerId,
      receiverId,
      action,
      callType: callType === 'video' ? 'video-call' : 'audio-call',
      ...(callId && { callId }),
    });
  }

  /**
   * Update FCM token for push notifications
   * @param data - FCM token data containing user ID and token
   */
  static async updateFcmToken(
    data: FcmTokenRequest,
  ): Promise<ApiResponse<any>> {
    return this.post<ApiResponse<any>>(
      ApiEndpoints.TIP_CALLS_ENDPOINTS.UPDATE_FCM_TOKEN,
      data,
    );
  }

  /**
   * Get missed calls for a user
   * @param userId - User ID
   */
  static async getMissedCalls(
    userId: string | number,
  ): Promise<ApiResponse<MissedCallsResponse>> {
    return this.get<ApiResponse<MissedCallsResponse>>(
      `${ApiEndpoints.TIP_CALLS_ENDPOINTS.MISSED_CALLS}/${userId}`,
    );
  }

  // ===== REFERRAL SERVICES =====

  /**
   * Get referral details
   * @param userId - User ID
   */
  static async getReferralDetails(
    userId: string | number,
  ): Promise<ReferralDetailsResponse> {
    return this.get<ReferralDetailsResponse>(
      `${ApiEndpoints.REFERRAL_ENDPOINTS.GET_REFERRAL_DETAILS}/${userId}`,
    );
  }
}
