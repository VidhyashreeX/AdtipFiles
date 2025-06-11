// src/services/ApiService.ts
import axios, { AxiosRequestConfig, AxiosResponse, AbortSignal } from 'axios'; // Import AbortSignal
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
  AgoraCallerTokenRequest, // Updated type
  AgoraCalleeTokenRequest, // Added type
  AgoraTokenResponse,
  AgoraCallRequest,
  FcmTokenRequest,
  MissedCallsResponse,
} from '../types/api';
import { RtmTokenRequest, RtmTokenResponse } from './AgoraRtmHelper';

// Interfaces moved from inside the class
export interface LikePostRequest {
  userId: number;
  postId: number;
  is_liked: boolean;
}

// Update the LikePostResponse interface to match actual API response
export interface LikePostResponse {
  status: boolean;
  message: string;
  is_liked: boolean;
}

export interface LikeShortRequest {
  reelId: number;
  userId: number;
  like: number; // 1 for like, 0 for unlike
  reelCreatorId: number;
}

export interface LikeShortResponse {
  status: number;
  message: string;
  data?: any;
}

// Define public endpoints that don't require authentication
const PUBLIC_ENDPOINTS = [
  ApiEndpoints.AUTH_ENDPOINTS.OTP_LOGIN,          // Example: "/api/otplogin"
  ApiEndpoints.AUTH_ENDPOINTS.OTP_VERIFY,         // Example: "/api/otpverify"
  // ApiEndpoints.TIP_CALLS_ENDPOINTS.GET_AGORA_TOKEN, // Removed: Assuming token endpoints are protected
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
      // Use a more precise check: config.url should exactly match one of the public endpoints.
      // Axios config.url is the path relative to the baseURL.
      const isPublicEndpoint = PUBLIC_ENDPOINTS.some(endpoint => {
        // Ensure both config.url and endpoint are treated consistently (e.g., leading slash)
        const requestPath = config.url;
        return requestPath === endpoint;
      });

      if (isPublicEndpoint) {
        console.log(`Request to public endpoint: ${config.url}. No Authorization header will be added.`);
      } else {
        console.log(`Request to protected endpoint: ${config.url}. Attempting to add Authorization header.`);
        // Check both token storage keys - the app uses 'accessToken', but our service was checking '@auth_token'
        let token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          token = await AsyncStorage.getItem('@auth_token'); // Fallback to old key format
        }
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('Authorization header added to request for:', config.url);
        } else {
          console.warn(`No auth token found for protected endpoint: ${config.url}`);
        }
      }
    } catch (error) {
      console.error('Error in request interceptor while handling auth token:', error);
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
    } catch (error: any) {
      if (axios.isCancel(error)) {
        console.log(`ApiService.get to ${url} canceled.`);
        throw error; // Re-throw the original cancellation error
      }
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
    } catch (error: any) {
      if (axios.isCancel(error)) {
        console.log(`ApiService.post to ${url} canceled.`);
        throw error; // Re-throw the original cancellation error
      }
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
    } catch (error: any) {
      if (axios.isCancel(error)) {
        console.log(`ApiService.put to ${url} canceled.`);
        throw error; // Re-throw the original cancellation error
      }
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
    } catch (error: any) {
      if (axios.isCancel(error)) {
        console.log(`ApiService.patch to ${url} canceled.`);
        throw error; // Re-throw the original cancellation error
      }
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
    } catch (error: any) {
      if (axios.isCancel(error)) {
        console.log(`ApiService.delete to ${url} canceled.`);
        throw error; // Re-throw the original cancellation error
      }
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
    } catch (error: any) {
      if (axios.isCancel(error)) {
        console.log(`ApiService.uploadFile to ${url} canceled.`);
        throw error; // Re-throw the original cancellation error
      }
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
      console.log('API Error Details (handleError):', {
        isAxiosError: true,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message, // This would be "canceled" if it's an unhandled cancellation
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
        console.log('Request was made but no response received (handleError):', error.request);
        const isEmulator = error.config?.baseURL?.includes('10.0.2.2');
        if (isEmulator) {
          return new Error('Network error while connecting to local server. Ensure your server is running and accessible.');
        }
        return new Error('Network error. Check your connection and try again.');
      } else {
        // Something happened in setting up the request that wasn't a direct cancellation handled above
        // This path should be less common for cancellations now.
        return new Error(`Error setting up request (handleError): ${error.message}`);
      }
    }
    // Not an Axios error
    console.log('Non-Axios error (handleError):', error);
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
    return ApiService.get(ApiEndpoints.AUTH_ENDPOINTS.PING);
  }
  // ===== HOME PAGE SERVICES =====

  /**
   * Get wallet balance
   * @param userId - User ID
   * @param config - Optional Axios request configuration (can include AbortSignal)
   */
  static async getWalletBalance(
    userId: string | number,
    config?: AxiosRequestConfig, // Add config parameter
  ): Promise<WalletBalanceResponse> {
    try {
      console.log(`Fetching wallet balance for user ID: ${userId}`);
      const formattedUserId = String(userId).trim(); // Ensure userId is a string

      // Make the API call, passing the config which may include the signal
      const response = await this.get<WalletBalanceResponse>(
        `${ApiEndpoints.HOME_ENDPOINTS.GET_WALLET_BALANCE}/${formattedUserId}`,
        undefined, // No specific query parameters for this URL structure
        config,    // Pass the config object
      );
      console.log('Wallet balance API response:', JSON.stringify(response));
      return response;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('ApiService.getWalletBalance request canceled');
        // Return a specific structure or rethrow for cancellation
        return { status: 0, message: 'Request canceled', availableBalance: '0.00' };
      }
      console.error('Error in getWalletBalance:', error);
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
   * @param config - Optional Axios request configuration (can include AbortSignal)
   */
  static async listPosts(
    data: PostListRequest,
    config?: AxiosRequestConfig, // Add config parameter
  ): Promise<PostListResponse> {
    try {
      // this.post will now re-throw original cancellation errors
      return await this.post<PostListResponse>(
        ApiEndpoints.HOME_ENDPOINTS.LIST_POSTS,
        data,
        config, // Pass the config object
      );
    } catch (error: any) {
      if (axios.isCancel(error)) {
        console.log('ApiService.listPosts request canceled (handling specific cancellation).');
        // Return a defined structure for cancellations, so HomeScreen doesn't treat it as an unhandled error.
        return { status: false, message: 'Request canceled by client', data: [], pagination: { current_page: 0, total_page: 0, total_count: 0 } };
      }
      // For other errors (which would have been processed by handleError in this.post)
      console.error('ApiService.listPosts error (not a direct cancellation):', error.message);
      // Re-throw the error to be caught by the calling function in HomeScreen
      throw error;
    }
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
   * @param search - Optional search query
   * @param signal - Optional AbortSignal for cancellation
   */
  static async getVideos(
    userId: string | number,
    categoryId: number,
    offset: number,
    search?: string, // Added search parameter
    signal?: AbortSignal // Added signal parameter
  ): Promise<any> { // Replace 'any' with your actual Video API response type
    try {
      // Construct parameters, ensuring search is handled if present
      const params: any = {};
      if (search) {
        params.search_query = search; // Or however your API expects search
      }

      // The endpoint structure might vary based on your API design.
      // This example assumes query parameters for search, and path params for others.
      // Adjust ApiEndpoints.TIP_TUBE_ENDPOINTS.GET_VIDEOS if it needs to be dynamic with search.
      // For simplicity, if GET_VIDEOS is a base path, and others are query params:
      // const response = await apiClient.get(ApiEndpoints.TIP_TUBE_ENDPOINTS.GET_VIDEOS, {
      //   params: { userId, categoryId, page: offset, search_query: search },
      //   signal, // Pass the signal to axios
      // });

      // If using path parameters as before:
      let url = `${ApiEndpoints.TIP_TUBE_ENDPOINTS.GET_VIDEOS}/${userId}/${categoryId}/${offset}`;
      // If search needs to be part of the URL or specific query param handling:
      // if (search) url += `?search_query=${encodeURIComponent(search)}`; // Example

      const response = await apiClient.get(url, {
        params: search ? { search_query: search } : undefined, // Example if search is a query param
        signal, // Pass the signal to axios
      });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('ApiService.getVideos request canceled');
        throw error; // Re-throw so the caller knows it was cancelled
      }
      // Assuming this.handleError is defined and handles other errors
      // throw this.handleError(error);
      // For now, rethrow directly if handleError is not static or accessible
      console.error('ApiService.getVideos error:', error);
      throw error;
    }
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
   * Get users (potentially filtered - this was your existing method)
   * @param data - Request data for filtering users
   */
  static async getUsers(data: UserListRequest): Promise<UserListResponse> {
    console.log('[API] Fetching users with data:', JSON.stringify(data, null, 2));
    return this.post<UserListResponse>(
      ApiEndpoints.TIP_CALLS_ENDPOINTS.GET_USERS, // Uses /api/users
      data,
    );
  }

  /**
   * Get all users with minimal filtering, primarily for call list.
   * Uses the /api/allusers endpoint.
   * @param data - Request data, typically including pagination and logged_user_id
   */
  static async getAllUsersList(data: UserListRequest): Promise<UserListResponse> {
    console.log('[API] Fetching all users list with data:', JSON.stringify(data, null, 2));
    try {
      const response = await this.post<UserListResponse>(
        ApiEndpoints.TIP_CALLS_ENDPOINTS.GET_ALL_USERS, // This should point to '/api/allusers'
        data,
      );
      console.log('[API] getAllUsersList response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error('[API] getAllUsersList error:', error);
      throw this.handleError(error); // Ensure handleError is accessible or called correctly
    }
  }

  // ===== AGORA API SERVICES =====

  /**
   * Get Agora token for a caller
   * @param data - Request data containing uid
   */
  static async getAgoraTokenForCaller( // Renamed from getAgoraToken
    data: AgoraCallerTokenRequest,
  ): Promise<AgoraTokenResponse> {
    console.log('[API] getAgoraTokenForCaller called with data:', JSON.stringify(data, null, 2));
    try {
      const response = await this.post<AgoraTokenResponse>(
        ApiEndpoints.TIP_CALLS_ENDPOINTS.GET_AGORA_TOKEN_CALLER, // Updated endpoint
        data,
      );
      console.log('[API] getAgoraTokenForCaller response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error('[API] getAgoraTokenForCaller error:', error);
      throw error; // Re-throw to be handled by the caller
    }
  }

  /**
   * Get Agora token for a callee
   * @param data - Request data containing uid and channelName
   */
  static async getAgoraTokenForCallee(
    data: AgoraCalleeTokenRequest,
  ): Promise<AgoraTokenResponse> {
    console.log('[API] getAgoraTokenForCallee called with data:', JSON.stringify(data, null, 2));
    try {
      const response = await this.post<AgoraTokenResponse>(
        ApiEndpoints.TIP_CALLS_ENDPOINTS.GET_AGORA_TOKEN_CALLEE, // New endpoint
        data,
      );
      console.log('[API] getAgoraTokenForCallee response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error('[API] getAgoraTokenForCallee error:', error);
      throw error; // Re-throw to be handled by the caller
    }
  }

  /**
   * Handle call actions (start, end, missed)
   * @param data - Call action data
   */
  static async handleCall(
    data: AgoraCallRequest,
  ): Promise<ApiResponse<any>> {
    console.log('[FCM-API] handleCall request:', JSON.stringify(data, null, 2));
    try {
      const response = await this.post<ApiResponse<any>>(
        ApiEndpoints.TIP_CALLS_ENDPOINTS.CALL,
        data,
      );
      console.log('[FCM-API] handleCall response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error('[FCM-API] handleCall error:', error);
      throw error;
    }
  }

  /**
   * Update FCM token for push notifications
   * @param data - FCM token data containing user ID and token
   */
  static async updateFcmToken(
    data: FcmTokenRequest,
  ): Promise<ApiResponse<any>> {
    console.log('[FCM-API] updateFcmToken request:', JSON.stringify({
      userId: data.userId,
      fcmToken: data.fcmToken.substring(0, 10) + '...' // Log partial token for security
    }, null, 2));
    
    try {
      const response = await this.post<ApiResponse<any>>(
        ApiEndpoints.TIP_CALLS_ENDPOINTS.UPDATE_FCM_TOKEN,
        data,
      );
      console.log('[FCM-API] updateFcmToken response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error('[FCM-API] updateFcmToken error:', error);
      throw error;
    }
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

  // ===== RTM TOKEN SERVICE =====
  /**
   * Get Agora RTM token for messaging
   * @param data - Request data containing uid
   */
  static async getRtmToken(
    data: RtmTokenRequest,
  ): Promise<RtmTokenResponse> {
    console.log('[RTM-API] Fetching RTM token for uid:', data.uid);
    try {
      const response = await this.post<RtmTokenResponse>(
        ApiEndpoints.TIP_CALLS_ENDPOINTS.GET_RTM_TOKEN,
        data,
      );
      console.log('[RTM-API] RTM token response:', JSON.stringify(response, null, 2));
      
      if (!response || !response.token || typeof response.token !== 'string') {
        console.error('[RTM-API] Invalid RTM token response:', response);
        throw new Error('Invalid RTM token received from server');
      }
      
      return response;
    } catch (error) {
      console.error('[RTM-API] Error fetching RTM token:', error);
      throw error;
    }
  }

  /**
   * Like or unlike a post
   * @param data - Like request data containing userId, postId, and is_liked status
   * @param config - Optional Axios request configuration (can include AbortSignal)
   */
  static async likePost(
    data: LikePostRequest,
    config?: AxiosRequestConfig, // Add config parameter
  ): Promise<LikePostResponse> {
    console.log('[API] Sending like request:', JSON.stringify(data, null, 2));
    try {
      // this.post will now re-throw original cancellation errors
      const response = await this.post<LikePostResponse>(
        '/api/save-user-post-like', // Ensure this endpoint is correct
        data,
        config, // Pass the config object
      );
      console.log('[API] Like response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error: any) {
      if (axios.isCancel(error)) {
        console.log('ApiService.likePost request canceled (handling specific cancellation).');
        // Return a defined structure for cancellations
        return { status: false, message: 'Request canceled by client', is_liked: data.is_liked };
      }
      console.error('[API] Like request failed (ApiService.likePost):', error.message);
      // Re-throw other errors (which would have been processed by handleError in this.post)
      throw error;
    }
  }

  /**
   * Like or unlike a short video
   * @param data - Like request data containing reelId, userId, like status, and reelCreatorId
   */
  static async likeShortVideo(data: LikeShortRequest): Promise<LikeShortResponse> {
    console.log('[API] Sending short like request:', JSON.stringify(data, null, 2));
    try {
      const response = await this.post<LikeShortResponse>(
        '/saveVideoLike',
        data,
      );
      console.log('[API] Short like response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error('[API] Short like request failed:', error);
      throw error;
    }
  }
}
