// src/services/ApiService.ts
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ApiEndpoints from '../constants/apiEndpoints';
import { FCM_SERVER_URL } from '../constants/api';
import { Platform } from 'react-native';
import messaging, { AuthorizationStatus } from '@react-native-firebase/messaging';
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
  FcmTokenRequest,
  MissedCallsResponse,
  VideoSDKGenerateTokenRequest,
  VideoSDKGenerateTokenResponse,
  VideoSDKCreateMeetingRequest,
  VideoSDKCreateMeetingResponse,
  VideoSDKDeactivateRoomRequest,
  VideoSDKDeactivateRoomResponse,
  VideoSDKValidateMeetingRequest,
  VideoSDKValidateMeetingResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  OtpVerifyApiResponse,
  FcmTokensRequest,
  FcmTokensResponse,
  GetCommentsRequest,
  GetCommentsResponse,
  SaveCommentRequest,
  SaveCommentResponse,
  LikeCommentRequest,
  LikeCommentResponse,
  DeleteCommentRequest,
  DeleteCommentResponse,
  ReportCommentRequest,
  ReportCommentResponse,
} from '../types/api';

// Interfaces moved from inside the class
export interface LikePostRequest {
  userId: number;
  postId: number;
  is_liked: boolean;
}

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

// Firebase-specific interfaces
export interface UpdateFcmTokenRequest {
  userId: string;
  fcmToken: string;
  platform?: 'ios' | 'android';
  apnsToken?: string; // For iOS
  deviceId?: string;
}

export interface UpdateFcmTokenResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface SendNotificationRequest {
  recipientId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  type?: 'call' | 'message' | 'general';
}

export interface SendNotificationResponse {
  success: boolean;
  message: string;
  messageId?: string;
}

export interface CallNotificationRequest {
  recipientId: string;
  callerId: string;
  callerName: string;
  callType: 'voice' | 'video' | 'audio-call' | 'video-call';
  meetingId?: string;
  channelName?: string;
  rtcToken?: string;
}

export interface HandleCallRequest {
  callerId: string;
  receiverId: string;
  action: 'calling' | 'accepted' | 'declined' | 'ended' | 'missed';
  callType: 'voice' | 'video' | 'audio-call' | 'video-call';
  channelName?: string;
  duration?: number;
  meetingId?: string;
}

export interface HandleCallResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface InitiateCallRequest {
  calleeInfo: {
    platform: 'ANDROID' | 'IOS';
    token: string;
  };
  callerInfo: {
    name: string;
    token: string;
  };
  videoSDKInfo: {
    meetingId: string;
    token: string;
  };
}

export interface InitiateCallResponse {
  success: boolean;
  message: string;
  data?: {
    callId?: string;
    meetingId?: string;
  };
}

export interface UpdateCallStatusRequest {
  callerInfo: {
    token: string;
    name: string;
    platform: 'ANDROID' | 'IOS';
  };
  type: 'CALL_ENDED' | 'CALL_MISSED' | 'CALL_ACCEPTED';
}

export interface UpdateCallStatusResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Define public endpoints that don't require authentication
const PUBLIC_ENDPOINTS = [
  ApiEndpoints.AUTH_ENDPOINTS.OTP_LOGIN,
  ApiEndpoints.AUTH_ENDPOINTS.OTP_VERIFY,
];

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Add request interceptor to add auth token to requests (except public endpoints)
apiClient.interceptors.request.use(
  async config => {
    try {
      const isPublicEndpoint = PUBLIC_ENDPOINTS.some(endpoint => {
        const requestPath = config.url;
        return requestPath === endpoint;
      });

      if (isPublicEndpoint) {
        console.log(`Request to public endpoint: ${config.url}. No Authorization header will be added.`);
      } else {
        console.log(`Request to protected endpoint: ${config.url}. Attempting to add Authorization header.`);
        let token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          token = await AsyncStorage.getItem('@auth_token');
        }
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('Authorization header added to request for:', config.url);
        } else {
          console.warn(`No auth token found for protected endpoint: ${config.url}`);
        }
      }

      // Log raw request details
      console.log('🚀 API REQUEST:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL || ''}${config.url || ''}`,
        headers: config.headers,
        params: config.params,
        data: config.data,
        timeout: config.timeout,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in request interceptor while handling auth token:', error);
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// Add response interceptor for logging and error handling
apiClient.interceptors.response.use(
  response => {
    // Log raw response details
    console.log('📥 API RESPONSE:', {
      method: response.config.method?.toUpperCase(),
      url: response.config.url,
      baseURL: response.config.baseURL,
      fullURL: `${response.config.baseURL || ''}${response.config.url || ''}`,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      timestamp: new Date().toISOString()
    });
    return response;
  },
  error => {
    // Log error response details
    if (error.response) {
      console.log('❌ API ERROR RESPONSE:', {
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: `${error.config?.baseURL || ''}${error.config?.url || ''}`,
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data,
        timestamp: new Date().toISOString()
      });

      if (error.response.status === 401) {
        // Unauthorized - token expired or invalid
        console.warn('API: Unauthorized access - token may be expired');
      }

      if (error.response.status === 429) {
        console.warn('API rate limit exceeded. Please try again later.');
      }
    } else if (error.request) {
      console.error('Network error. Please check your connection.');
      console.log('❌ API NETWORK ERROR:', {
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: `${error.config?.baseURL || ''}${error.config?.url || ''}`,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }

    return Promise.reject(error);
  },
);

/**
 * API Service for handling network requests with Firebase v22.2.1 integration
 */
export default class ApiService {
  /**
   * Get current FCM token - Firebase v22.2.1 compatible
   */
  static async getCurrentFCMToken(): Promise<string | null> {
    try {
      // Firebase v22.2.1 - isSupported is now a static method on the messaging module
      if (!messaging().isSupported) {
        console.warn('[ApiService] Firebase Messaging not supported');
        return null;
      }

      const authStatus = await messaging().hasPermission();
      if (authStatus !== AuthorizationStatus.AUTHORIZED &&
          authStatus !== AuthorizationStatus.PROVISIONAL) {
        console.warn('[ApiService] FCM permissions not granted');
        return null;
      }

      const token = await messaging().getToken();
      return token || null; // Convert undefined to null for consistency
    } catch (error) {
      console.error('[ApiService] Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Get APNs token for iOS (Firebase v22.2.1)
   */
  private static async getAPNSToken(): Promise<string | null> {
    if (Platform.OS !== 'ios') return null;
    
    try {
      const apnsToken = await messaging().getAPNSToken();
      return apnsToken || null; // Convert undefined to null for consistency
    } catch (error) {
      console.error('[ApiService] Error getting APNs token:', error);
      return null;
    }
  }

  /**
   * Make a GET request
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
        throw error;
      }
      throw this.handleError(error);
    }
  }

  /**
   * Make a POST request
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
        throw error;
      }
      throw this.handleError(error);
    }
  }

  /**
   * Make a PUT request
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
        throw error;
      }
      throw this.handleError(error);
    }
  }

  /**
   * Make a PATCH request
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
        throw error;
      }
      throw this.handleError(error);
    }
  }

  /**
   * Make a DELETE request
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
        throw error;
      }
      throw this.handleError(error);
    }
  }

  /**
   * Upload a file
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
        throw error;
      }
      throw this.handleError(error);
    }
  }

  /**
   * Standard error handler
   */
  private static handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      console.log('API Error Details (handleError):', {
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
        const serverMessage = error.response.data?.message || error.response.statusText;
        return new Error(serverMessage || error.message);
      } else if (error.request) {
        console.log('Request was made but no response received (handleError):', error.request);
        const isEmulator = error.config?.baseURL?.includes('10.0.2.2');
        if (isEmulator) {
          return new Error('Network error while connecting to local server. Ensure your server is running and accessible.');
        }
        return new Error('Network error. Check your connection and try again.');
      } else {
        return new Error(`Error setting up request (handleError): ${error.message}`);
      }
    }
    console.log('Non-Axios error (handleError):', error);
    return error instanceof Error ? error : new Error(String(error));
  }

  // ===== AUTHENTICATION SERVICES =====

  /**
   * Send OTP for login with automatic FCM token registration
   */
  static async sendLoginOtp(
    data: OtpLoginRequest,
  ): Promise<ApiResponse<OtpLoginResponse[]>> {
    const fcmToken = await this.getCurrentFCMToken();
    const apnsToken = await this.getAPNSToken();

    const requestData = {
      ...data,
      fcmToken: fcmToken || undefined, // Convert null to undefined for API consistency
      apnsToken: apnsToken || undefined,
      platform: Platform.OS,
    };

    return this.post<ApiResponse<OtpLoginResponse[]>>(
      ApiEndpoints.AUTH_ENDPOINTS.OTP_LOGIN,
      requestData,
    );
  }

  /**
   * Verify OTP with FCM token registration
   */
  static async verifyOtp(
    data: OtpVerifyRequest,
  ): Promise<OtpVerifyApiResponse> {
    const fcmToken = await this.getCurrentFCMToken();
    const apnsToken = await this.getAPNSToken();

    const requestData = {
      ...data,
      fcmToken: fcmToken || undefined,
      apnsToken: apnsToken || undefined,
      platform: Platform.OS,
    };

    const response = await this.post<OtpVerifyApiResponse>(
      ApiEndpoints.AUTH_ENDPOINTS.OTP_VERIFY, 
      requestData
    );

    // Store the token for future requests
    const accessToken = response.accessToken || (response as any).accessToken;
    if (accessToken) {
      await AsyncStorage.setItem('accessToken', accessToken);
    }

    return response;
  }

  /**
   * Logout user with FCM token cleanup
   */
  static async logout(userId: string): Promise<any> {
    const fcmToken = await this.getCurrentFCMToken();
    
    const data: LogoutRequest & { fcmToken?: string; platform?: string } = {
      id: userId,
      fcmToken: fcmToken || undefined,
      platform: Platform.OS,
    };

    const response = await this.post(ApiEndpoints.AUTH_ENDPOINTS.LOGOUT, data);

    // Clear local tokens
    await AsyncStorage.multiRemove(['accessToken', '@auth_token', 'userId', 'fcmToken']);
    
    // Delete FCM token
    try {
      await messaging().deleteToken();
    } catch (error) {
      console.warn('[ApiService] Error deleting FCM token during logout:', error);
    }

    return response;
  }

  /**
   * Save or update user details with FCM token
   */
  static async saveUserDetails(
    data: UserDetailsRequest,
  ): Promise<ApiResponse<OtpVerifyResponse[]>> {
    const fcmToken = await this.getCurrentFCMToken();
    const apnsToken = await this.getAPNSToken();

    const requestData = {
      ...data,
      fcmToken: fcmToken || undefined,
      apnsToken: apnsToken || undefined,
      platform: Platform.OS,
    };

    return this.post<ApiResponse<OtpVerifyResponse[]>>(
      ApiEndpoints.AUTH_ENDPOINTS.SAVE_USER_DETAILS,
      requestData,
    );
  }

  /**
   * Ping the server to keep the session alive
   */
  static async ping(): Promise<any> {
    return this.get(ApiEndpoints.AUTH_ENDPOINTS.PING);
  }

  // ===== FIREBASE FCM SERVICES =====

  /**
   * Update FCM token on server (Firebase v22.2.1 compatible)
   */
  static async updateFcmToken(data: UpdateFcmTokenRequest): Promise<UpdateFcmTokenResponse> {
    console.log('[ApiService] Updating FCM token on server:', {
      userId: data.userId,
      platform: data.platform || Platform.OS,
      hasFcmToken: !!data.fcmToken,
      hasApnsToken: !!data.apnsToken,
    });

    try {
      // If no FCM token provided, get current one
      const fcmToken = data.fcmToken || await this.getCurrentFCMToken();
      const apnsToken = data.apnsToken || await this.getAPNSToken();

      const requestData: UpdateFcmTokenRequest = {
        ...data,
        fcmToken: fcmToken || '', // Provide empty string if null
        platform: (Platform.OS === 'ios' || Platform.OS === 'android') ? Platform.OS : undefined,
        apnsToken: apnsToken || undefined,
        deviceId: await AsyncStorage.getItem('deviceId') || undefined,
      };

      const response = await this.post<UpdateFcmTokenResponse>(
        '/api/update-fcm-token',
        requestData,
      );

      console.log('[ApiService] FCM token update response:', response);
      return response;
    } catch (error) {
      console.error('[ApiService] Error updating FCM token:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Send notification via server
   */
  static async sendNotification(data: SendNotificationRequest): Promise<SendNotificationResponse> {
    console.log('[ApiService] Sending notification:', data);
    try {
      const response = await this.post<SendNotificationResponse>(
        '/api/send-notification',
        data,
      );
      console.log('[ApiService] Send notification response:', response);
      return response;
    } catch (error) {
      console.error('[ApiService] Error sending notification:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Send call notification
   */
  static async sendCallNotification(data: CallNotificationRequest): Promise<SendNotificationResponse> {
    console.log('[ApiService] Sending call notification:', data);
    try {
      const notificationData = {
        recipientId: data.recipientId,
        title: `Incoming ${data.callType} call`,
        body: `${data.callerName} is calling you`,
        data: {
          isIncomingCall: 'true',
          callType: data.callType,
          callerId: data.callerId,
          callerName: data.callerName,
          meetingId: data.meetingId,
          channelName: data.channelName,
          rtcToken: data.rtcToken,
        },
        type: 'call' as const,
      };

      const response = await this.sendNotification(notificationData);
      console.log('[ApiService] Call notification sent:', response);
      return response;
    } catch (error) {
      console.error('[ApiService] Error sending call notification:', error);
      throw this.handleError(error);
    }
  }
  /**
   * Handle call status updates (DEPRECATED - use updateCallStatus instead)
   */
  static async handleCall(data: HandleCallRequest): Promise<HandleCallResponse> {
    console.log('[ApiService] Handling call status:', data);
    try {
      const response = await this.post<HandleCallResponse>(
        '/api/handle-call',
        data,
      );
      console.log('[ApiService] Handle call response:', response);
      return response;
    } catch (error) {
      console.error('[ApiService] Error handling call:', error);
      throw this.handleError(error);
    }
  }

  // ===== HOME PAGE SERVICES =====

  /**
   * Get wallet balance
   */
  static async getWalletBalance(
    userId: string | number,
    config?: AxiosRequestConfig,
  ): Promise<WalletBalanceResponse> {
    try {
      console.log(`Fetching wallet balance for user ID: ${userId}`);
      const formattedUserId = String(userId).trim();

      const response = await this.get<WalletBalanceResponse>(
        `${ApiEndpoints.HOME_ENDPOINTS.GET_WALLET_BALANCE}/${formattedUserId}`,
        undefined,
        config,
      );
      console.log('Wallet balance API response:', JSON.stringify(response));
      return response;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('ApiService.getWalletBalance request canceled');
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
   */
  static async listPosts(
    data: PostListRequest,
    config?: AxiosRequestConfig,
  ): Promise<PostListResponse> {
    try {
      return await this.post<PostListResponse>(
        ApiEndpoints.HOME_ENDPOINTS.LIST_POSTS,
        data,
        config,
      );
    } catch (error: any) {
      if (axios.isCancel(error)) {
        console.log('ApiService.listPosts request canceled (handling specific cancellation).');
        return { 
          data: [], 
          pagination: { current_page: 0, total_page: 0, total_count: 0 } 
        };
      }
      console.error('ApiService.listPosts error (not a direct cancellation):', error.message);
      throw error;
    }
  }

  /**
   * Check if user has premium subscription
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
   */
  static async getAdPassbook(userId: number, page: number, limit: number): Promise<any> {
    return this.get(`/passbook/get-passbook-by-userid/${userId}?page=${page}&limit=${limit}`);
  }
  /**
   * Get FCM token for a user (Updated to use fcm-tokens-of-both-users API)
   * @param userId - The user ID to get FCM token for
   * @param callerUserId - Optional caller user ID for batch request (for efficiency)
   */
  static async getFCMToken(userId: string, callerUserId?: string): Promise<{ token: string; platform: 'ANDROID' | 'IOS' } | null> {
    try {
      // Use the new batch API to get FCM tokens
      const userIds = callerUserId ? [parseInt(callerUserId), parseInt(userId)] : [parseInt(userId)];
      
      const response = await this.getFcmTokensForUsers({ userIds });
      
      if (response && response.results) {
        // Find the token for the requested userId
        const targetUser = response.results.find(result => result.userId === parseInt(userId));
        
        if (targetUser && targetUser.status && targetUser.fcm_token) {
          return {
            token: targetUser.fcm_token,
            platform: 'ANDROID', // Default to Android as per your requirement
          };
        }
      }
      
      console.warn(`[ApiService] No FCM token found for user ${userId}`);
      return null;
    } catch (error) {
      console.error(`[ApiService] Error fetching FCM token for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Get channel by user ID
   */
  static async getChannelByUserId(userId: string | number): Promise<any> {
    return this.get(
      `${ApiEndpoints.HOME_ENDPOINTS.GET_CHANNEL_BY_USER_ID}/${userId}`,
    );
  }

  // ===== TIP-TUBE SERVICES =====

  /**
   * Get videos
   */
  static async getVideos(
    userId: string | number,
    categoryId: number,
    offset: number,
    search?: string,
    signal?: AbortSignal
  ): Promise<any> {
    try {
      const params: any = {};
      if (search) {
        params.search_query = search;
      }

      let url = `${ApiEndpoints.TIP_TUBE_ENDPOINTS.GET_VIDEOS}/${userId}/${categoryId}/${offset}`;

      const response = await apiClient.get(url, {
        params: search ? { search_query: search } : undefined,
        signal,
      });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('ApiService.getVideos request canceled');
        throw error;
      }
      console.error('ApiService.getVideos error:', error);
      throw error;
    }
  }

  /**
   * Get channel analytics
   */
  static async getChannelAnalytics(channelId: string | number): Promise<any> {
    return this.get(
      `${ApiEndpoints.TIP_TUBE_ENDPOINTS.GET_ANALYTICS}/${channelId}`,
    );
  }

  // ===== TIP-SHORTS SERVICES =====

  /**
   * Get shorts
   */
  static async getShorts(userId: string | number): Promise<any> {
    return this.get(
      `${ApiEndpoints.TIP_SHORTS_ENDPOINTS.GET_SHORTS}/${userId}`,
    );
  }

  // ===== TIP-CALLS SERVICES =====

  /**
   * Get users (potentially filtered)
   */
  static async getUsers(data: UserListRequest): Promise<UserListResponse> {
    console.log('[API] Fetching users with data:', JSON.stringify(data, null, 2));
    return this.post<UserListResponse>(
      ApiEndpoints.TIP_CALLS_ENDPOINTS.GET_USERS,
      data,
    );
  }

  /**
   * Get all users with minimal filtering
   */
  static async getAllUsersList(data: UserListRequest): Promise<UserListResponse> {
    console.log('[API] Fetching all users list with data:', JSON.stringify(data, null, 2));
    try {
      const response = await this.post<UserListResponse>(
        '/api/allusers',
        data,
      );
      console.log('[API] getAllUsersList response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error('[API] getAllUsersList error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Like or unlike a post
   */
  static async likePost(
    data: LikePostRequest,
    config?: AxiosRequestConfig,
  ): Promise<LikePostResponse> {
    console.log('[API] Sending like request:', JSON.stringify(data, null, 2));
    try {
      const response = await this.post<LikePostResponse>(
        '/api/save-user-post-like',
        data,
        config,
      );
      console.log('[API] Like response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error: any) {
      if (axios.isCancel(error)) {
        console.log('ApiService.likePost request canceled (handling specific cancellation).');
        return { status: false, message: 'Request canceled by client', is_liked: data.is_liked };
      }
      console.error('[API] Like request failed (ApiService.likePost):', error.message);
      throw error;
    }
  }

  /**
   * Like or unlike a short video
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

  // ===== VideoSDK API SERVICES =====

  /**
   * Get FCM tokens for multiple users
   */
  static async getFcmTokensForUsers(data: FcmTokensRequest): Promise<FcmTokensResponse> {
    console.log('[API] Getting FCM tokens for users:', data.userIds);
    try {
      // Make sure the endpoint is correct
      const response = await this.post<FcmTokensResponse>(
        '/api/fcm-tokens-of-both-users', // Use the direct path instead of the constant if needed
        data,
      );
      console.log('[API] FCM tokens response:', {
        success: !!response.results,
        resultsCount: response.results?.length || 0
      });
      return response;
    } catch (error) {
      console.error('[API] Error getting FCM tokens:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get FCM tokens for both caller and recipient users efficiently
   * @param callerUserId - Caller's user ID
   * @param recipientUserId - Recipient's user ID
   * @returns Object with both caller and recipient FCM token details
   */
  static async getBothUsersFCMTokens(callerUserId: string, recipientUserId: string): Promise<{
    callerToken: string | null;
    recipientToken: string | null;
    callerPlatform: 'ANDROID' | 'IOS';
    recipientPlatform: 'ANDROID' | 'IOS';
  }> {
    try {
      const userIds = [parseInt(callerUserId), parseInt(recipientUserId)];
      const response = await this.getFcmTokensForUsers({ userIds });
      
      let callerToken = null;
      let recipientToken = null;
      let callerPlatform: 'ANDROID' | 'IOS' = 'ANDROID';
      let recipientPlatform: 'ANDROID' | 'IOS' = 'ANDROID';
      
      if (response && response.results) {
        const callerResult = response.results.find(result => result.userId === parseInt(callerUserId));
        const recipientResult = response.results.find(result => result.userId === parseInt(recipientUserId));
        
        if (callerResult && callerResult.status && callerResult.fcm_token) {
          callerToken = callerResult.fcm_token;
        }
        
        if (recipientResult && recipientResult.status && recipientResult.fcm_token) {
          recipientToken = recipientResult.fcm_token;
        }
      }
      
      return {
        callerToken,
        recipientToken,
        callerPlatform,
        recipientPlatform,
      };
    } catch (error) {
      console.error(`[ApiService] Error fetching FCM tokens for users ${callerUserId} and ${recipientUserId}:`, error);
      return {
        callerToken: null,
        recipientToken: null,
        callerPlatform: 'ANDROID',
        recipientPlatform: 'ANDROID',
      };
    }
  }

  // ===== COMMENTS SERVICES =====

  /**
   * Get comments for a specific post
   */
  static async getPostComments(data: GetCommentsRequest): Promise<GetCommentsResponse> {
    console.log('[API] Fetching comments for post:', data.postId);
    try {
      const params = {
        userId: data.userId,
        page: data.page || 1,
        limit: data.limit || 20,
      };

      const response = await this.get<any>(
        `${ApiEndpoints.TIP_CALLS_ENDPOINTS.GET_COMMENTS}/${data.postId}/comments`,
        params,
      );
      
      console.log('[API] Raw comments response:', response);

      // Transform the response to match expected format
      if (response.status && response.data) {
        const transformedComments = response.data.map((comment: any) => ({
          id: comment.id,
          post_id: comment.postId,
          user_id: comment.user_id,
          user_name: comment.user_name,
          user_profile_image: comment.user_profile, // Map user_profile to user_profile_image
          content: comment.comment, // Map comment to content
          like_count: 0, // Default values since API doesn't provide these
          reply_count: 0,
          is_liked: false,
          created_at: comment.created_at,
          parent_id: null,
        }));

        const transformedResponse: GetCommentsResponse = {
          success: true,
          message: response.message,
          data: transformedComments,
          pagination: {
            current_page: response.pagination?.current_page || 1,
            total_pages: Math.ceil((response.pagination?.total_comments || 0) / (data.limit || 20)),
            total_count: response.pagination?.total_comments || 0,
            per_page: data.limit || 20,
          }
        };

        console.log('[API] Transformed comments response:', {
          success: transformedResponse.success,
          commentCount: transformedResponse.data?.length || 0,
          totalCount: transformedResponse.pagination?.total_count || 0,
        });

        return transformedResponse;
      } else {
        throw new Error(response.message || 'Failed to fetch comments');
      }
    } catch (error) {
      console.error('[API] Error fetching comments:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Save a new comment or reply
   */
  static async saveComment(data: SaveCommentRequest): Promise<SaveCommentResponse> {
    console.log('[API] Saving comment:', {
      postId: data.postId,
      userId: data.userId,
      hasContent: !!data.content,
      isReply: !!data.parentId,
    });
    
    try {
      const response = await this.post<SaveCommentResponse>(
        ApiEndpoints.TIP_CALLS_ENDPOINTS.SAVE_COMMENT,
        data,
      );
      
      console.log('[API] Save comment response:', {
        success: response.success,
        message: response.message,
        hasData: !!response.data,
      });
      
      return response;
    } catch (error) {
      console.error('[API] Error saving comment:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Like or unlike a comment
   */
  static async likeComment(data: LikeCommentRequest): Promise<LikeCommentResponse> {
    console.log('[API] Liking comment:', {
      commentId: data.commentId,
      userId: data.userId,
      isLiked: data.is_liked,
    });
    
    try {
      const response = await this.post<LikeCommentResponse>(
        ApiEndpoints.TIP_CALLS_ENDPOINTS.LIKE_COMMENT,
        data,
      );
      
      console.log('[API] Like comment response:', response);
      return response;
    } catch (error) {
      console.error('[API] Error liking comment:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Delete a comment
   */
  static async deleteComment(data: DeleteCommentRequest): Promise<DeleteCommentResponse> {
    console.log('[API] Deleting comment:', data);
    
    try {
      const response = await this.post<DeleteCommentResponse>(
        ApiEndpoints.TIP_CALLS_ENDPOINTS.DELETE_COMMENT,
        data,
      );
      
      console.log('[API] Delete comment response:', response);
      return response;
    } catch (error) {
      console.error('[API] Error deleting comment:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Report a comment
   */
  static async reportComment(data: ReportCommentRequest): Promise<ReportCommentResponse> {
    console.log('[API] Reporting comment:', data);
    
    try {
      const response = await this.post<ReportCommentResponse>(
        ApiEndpoints.TIP_CALLS_ENDPOINTS.REPORT_COMMENT,
        data,
      );
      
      console.log('[API] Report comment response:', response);
      return response;
    } catch (error) {
      console.error('[API] Error reporting comment:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Generate VideoSDK Token
   */
  static async generateVideoSDKToken(): Promise<{ token: string }> {
    try {
      const response = await this.post<{ token: string }>('/api/generate-token/videosdk', {});
      return response;
    } catch (error) {
      console.error('[ApiService] Error generating VideoSDK token:', error);
      throw this.handleError(error);
    }
  }
  /**
   * Create Meeting Room
   */
  static async createVideoSDKMeeting(token: string, region: string = 'us'): Promise<VideoSDKCreateMeetingResponse> {
    try {
      const response = await this.post<VideoSDKCreateMeetingResponse>('/api/create-meeting/videosdk', { token, region });
      console.log('[ApiService] Create VideoSDK meeting response:', response);
      return response;
    } catch (error) {
      console.error('[ApiService] Error creating VideoSDK meeting:', error);
      throw this.handleError(error);
    }
  }  /**
   * Initiate Call (Cloud Function) - Direct FCM Server call
   */
  static async initiateCall(payload: {
    calleeInfo: { platform: string; token: string };
    callerInfo: { name: string; token: string };
    videoSDKInfo: { meetingId: string; token: string };
  }): Promise<any> {
    try {
      console.log('🚀 [ApiService] Making direct call to FCM Server for initiate-call:', FCM_SERVER_URL);
      
      // Get auth token for authenticated requests
      const authToken = await AsyncStorage.getItem('accessToken') || await AsyncStorage.getItem('@auth_token');
      
      const headers: any = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      
      // Add auth token if available
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }
      
      const response = await axios.post(`${FCM_SERVER_URL}/api/call/initiate-call`, payload, {
        headers,
        timeout: 30000,
      });
      
      console.log('✅ [ApiService] initiate-call response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [ApiService] initiate-call error:', error);
      throw this.handleError(error);
    }
  }
  /**
   * Update Call Status (Cloud Function) - Direct FCM Server call with new format
   */
  static async updateCallStatus(payload: UpdateCallStatusRequest): Promise<UpdateCallStatusResponse> {
    try {
      console.log('🚀 [ApiService] Making direct call to FCM Server for update-call:', FCM_SERVER_URL);
      
      // Get auth token for authenticated requests
      const authToken = await AsyncStorage.getItem('accessToken') || await AsyncStorage.getItem('@auth_token');
      
      const headers: any = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      
      // Add auth token if available
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }
      
      const response = await axios.post(`${FCM_SERVER_URL}/api/call/update-call`, payload, {
        headers,
        timeout: 30000,
      });
      
      console.log('✅ [ApiService] update-call response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [ApiService] update-call error:', error);
      throw this.handleError(error);
    }
  }

  // ===== MISSING GUEST APIS (NO LOGIN REQUIRED) =====

  /**
   * Get premium posts for homepage (no login required)
   */
  static async getListPremiumPosts(): Promise<any> {
    return this.get('/api/list-premium-posts');
  }

  /**
   * Get public videos for TipTube (no login required)
   */
  static async getPublicVideos(categoryId: number = 0, offset: number = 0): Promise<any> {
    return this.get(`/getpublicvideos/${categoryId}/${offset}`);
  }

  /**
   * Get public shots for TipShorts (no login required)
   */
  static async getPublicShots(): Promise<any> {
    return this.get('/getpublicshots');
  }

  // ===== VIDEO/SHORTS INTERACTION APIS =====

  /**
   * Save video like/unlike
   */
  static async saveVideoLike(data: {
    videoId: number;
    userId: number;
    like: number; // 1 for like, 0 for unlike
    videoCreatorId: number;
  }): Promise<any> {
    return this.post('/saveVideoLike', data);
  }

  /**
   * Save video comment
   */
  static async saveVideoComment(data: {
    comment: string;
    videoId: number;
    createdBy: number;
    parentCommetId?: number | null;
  }): Promise<any> {
    return this.post('/savevideocomment', data);
  }

  /**
   * Save video comment like
   */
  static async saveVideoCommentLike(data: {
    commentId: number;
    userId: number;
  }): Promise<any> {
    return this.post('/savevideocommentlike', data);
  }

  /**
   * Get comments of videos
   */
  static async getCommentsOfVideos(userId: number, videoId: number): Promise<any> {
    return this.get(`/getcommentsofvideos/${userId}/${videoId}`);
  }

  // ===== FOLLOW/UNFOLLOW APIS =====

  /**
   * Follow or unfollow a user
   */
  static async followUser(data: {
    followingId: number;
    followerId: number;
    action: 'follow' | 'unfollow';
  }): Promise<any> {
    return this.post('/api/follow-user', data);
  }

  /**
   * Get user followers
   */
  static async getUserFollowers(userId: number): Promise<any> {
    return this.get(`/api/follow/followers/${userId}`);
  }

  /**
   * Get user followings
   */
  static async getUserFollowings(userId: number): Promise<any> {
    return this.get(`/api/follow/followings/${userId}`);
  }

  /**
   * Get user posts with pagination
   */
  static async getUserPosts(userId: number, page: number = 1, limit: number = 10, loggedUserId: number): Promise<any> {
    return this.get(`/api/users/${userId}/posts?page=${page}&limit=${limit}&loggined_user_id=${loggedUserId}`);
  }

  // ===== UPLOAD APIS =====

  /**
   * Upload post (promoted or non-promoted)
   */
  static async uploadPost(data: {
    user_id: number;
    title: string;
    content: string;
    media_url: string;
    media_type: 'video' | 'image';
    is_promoted: boolean;
    video_category_id: number;
    start_date: string;
    end_date: string;
    target_min_age?: number;
    target_max_age?: number;
    pay_per_view?: number;
    reach_goal?: number;
    duration_days?: number;
    total_pay?: number;
    platform_fee?: number;
    post_target_locations?: string[];
    post_target_genders?: string[];
  }): Promise<any> {
    return this.post('/api/post', data);
  }

  /**
   * Upload shot (TipTube or TipShorts)
   */
  static async uploadShot(data: {
    name: string;
    isShot: boolean; // false for TipTube, true for TipShorts
    categoryId: number;
    channelId: number;
    videoLink: string;
    videoDesciption: string;
    createdby: number;
    play_duration: string;
    video_Thumbnail: string;
  }): Promise<any> {
    return this.post('/uploadshot', data);
  }

  /**
   * Generate presigned URL for file uploads
   */
  static async generatePresignedUrl(files: Array<{ contentType: string }>): Promise<any> {
    return this.post('/api/generatePresignedUrl', { files });
  }

  // ===== CHANNEL MANAGEMENT APIS =====

  /**
   * Save/Create channel
   */
  static async saveMyChannel(data: {
    channelName: string;
    channelDescription: string;
    profileImageURL: string;
    coverImageURL: string;
    createdBy: number;
    updatedBy: number;
  }): Promise<any> {
    return this.post('/api/savemychannel', data);
  }

  /**
   * Update channel
   */
  static async updateChannel(data: {
    id: number;
    channelName: string;
    channelDescription: string;
    profileImageURL: string;
  }): Promise<any> {
    return this.post('/api/updatechanel', data);
  }

  /**
   * Get popular shorts/videos for channel home
   */
  static async getPopularShort(videoType: number, userId: number): Promise<any> {
    return this.get(`/getpopularshort/${videoType}/${userId}`);
  }

  /**
   * Get videos by channel
   */
  static async getVideoByChannel(videoType: number, channelId: number, userId: number): Promise<any> {
    return this.get(`/getvideobychannel/${videoType}/${channelId}/${userId}`);
  }

  /**
   * Get list of followed channels
   */
  static async getListOfFollowedChannelByUser(userId: number): Promise<any> {
    return this.get(`/getlistoffollowedchannelbyuser/${userId}`);
  }

  // ===== PREMIUM PLAN APIS =====

  /**
   * Get user premium plans
   */
  static async getUserPremiumPlans(userId: number): Promise<any> {
    return this.get(`/api/user-premium-plans/${userId}`);
  }

  /**
   * Get content premium plans
   */
  static async getContentPremiumPlans(userId: number): Promise<any> {
    return this.get(`/api/content-premium-plans/${userId}`);
  }

  /**
   * Upgrade to premium
   */
  static async upgradePremium(data: {
    coupon_code?: string | null;
    isCron: boolean;
    order_id: string;
    payment_id: string;
    payment_status: string;
    plan_id: number;
    user_id: number;
  }): Promise<any> {
    return this.post('/api/upgrade-premium', data);
  }

  /**
   * Upgrade to content premium
   */
  static async upgradeContentPremium(data: {
    payment_status: string;
    user_id: number;
    plan_id: number;
    order_id: string;
    payment_id: string;
    coupon_code?: string | null;
    isCron: boolean;
  }): Promise<any> {
    return this.post('/api/upgrade-content-premium', data);
  }

  // ===== SUBSCRIPTION APIS =====

  static async getSubscriptionPlans(): Promise<any> {
    return this.get('/api/subscription-plans');
  }

  static async createSubscription(plan_id: string, user_id: number): Promise<any> {
    return this.post('/api/subscriptions/create', { plan_id, user_id });
  }

  static async cancelSubscription(): Promise<any> {
    return this.post('/api/subscriptions/cancel', {});
  }

  static async getSubscriptionStatus(userId: number): Promise<any> {
    return this.get(`/api/subscriptions/status/${userId}`);
  }

  // ===== RAZORPAY INTEGRATION APIS =====

  /**
   * Get Razorpay details
   */
  static async getRazorpayDetails(): Promise<any> {
    return this.get('/api/razorpay-details');
  }

  /**
   * Create Razorpay order
   */
  static async createRazorpayOrder(data: {
    amount: number;
    currency: string;
    user_id: number;
  }): Promise<any> {
    return this.post('/api/razorpay-order', data);
  }

  /**
   * Verify Razorpay payment
   */
  static async verifyRazorpayPayment(data: {
    amount: number;
    currency: string;
    order_id: string;
    payment_status: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    transaction_for: string;
    user_id: number;
    plan_id?: number;
  }): Promise<any> {
    return this.post('/api/razorpay-verification', data);
  }

  /**
   * Add funds to wallet
   */
  static async addFunds(data: {
    amount: number;
    createdby: number;
    isCron: boolean;
    order_id: string;
    payment_id: string;
    transaction_type: string;
    transactionStatus: string;
  }): Promise<any> {
    return this.post('/api/addfunds', data);
  }

  // ===== CELEBRATION ADS APIS =====

  /**
   * Save celebration ads
   */
  static async saveCelebrationAds(data: {
    campaignName: string;
    targetPeople: number;
    AdModelId: number;
    targetArea: string;
    targetLowerAge: number;
    targetUpperAge: number;
    maritalStatus: string;
    targetGender: string;
    targetProfessions: string;
    adTotal: number;
    Coupon?: string;
    AdTax: number;
    createdby: number;
    adStartDateTime: string;
    adEndDateTime: string;
    modelTypeName?: string;
    adFile?: string;
  }): Promise<any> {
    return this.post('/api/savecelebrationadds', data);
  }

  /**
   * Get celebration ads
   */
  static async getCelebrationAds(data: {
    userId: number;
    gender: string;
    age: number;
    maritalStatus: string;
    targetLocation: string;
    targetProfession?: string;
    limit?: number;
  }): Promise<any> {
    return this.post('/getcelebrationads', data);
  }

  /**
   * Save celebration ad view
   */
  static async saveCelebrationAdView(data: {
    adId: number;
    userId: number;
  }): Promise<any> {
    return this.post('/savecelebrationadview', data);
  }

  // ===== NOTIFICATIONS & EXPLORE APIS =====

  /**
   * Get sent notifications
   */
  static async getSentNotifications(userId: number): Promise<any> {
    return this.get(`/getsentnotification/${userId}`);
  }

  /**
   * Get explore content
   */
  static async getExploreContent(data: {
    page: number;
    limit: number;
    loggined_user_id: number;
  }): Promise<any> {
    return this.post('/api/explore', data);
  }

  /**
   * Update user settings (DND, availability)
   */
  static async updateUser(data: UpdateUserRequest): Promise<UpdateUserResponse> {
    return this.post('/api/updateuser', data);
  }

  // ===== REFERRAL APIS =====
  /**
   * Get referral details
   */
  static async getReferralDetails(userId: number): Promise<any> {
    return this.get(`/api/referral/details/${userId}`);
  }
}