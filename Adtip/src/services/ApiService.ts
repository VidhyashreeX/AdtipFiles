// src/services/ApiService.ts
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ApiEndpoints from '../constants/apiEndpoints';
import { FCM_SERVER_URL, FCM_CHAT_SERVER_URL } from '../constants/api';
import { Platform } from 'react-native';
import messaging, { AuthorizationStatus } from '@react-native-firebase/messaging';
import FirebaseService from './FirebaseService';
import { Logger } from '../utils/ProductionLogger';
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
  Contact,
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
  ExploreContentRequest,
  ExploreContentResponse,
  GetUserDataRequest,
  GetUserDataResponse,
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
    callType: 'voice' | 'video';
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
  calleeInfo?: {
    platform: 'ANDROID' | 'IOS';
    token: string;
  };
  callerInfo: {
    token: string;
    name: string;
    platform: 'ANDROID' | 'IOS';
  };
  videoSDKInfo?: {
    meetingId: string;
    token: string;
    callType: 'voice' | 'video';
  };
  type: 'CALL_ENDED' | 'CALL_MISSED' | 'CALL_ACCEPTED';
  sessionId?: string; // Optional for update operations
}

export interface UpdateCallStatusResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Chat message interfaces for FCM Cloud Functions
export interface SendChatMessageRequest {
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientToken: string;
  conversationId: string;
  content: string;
  messageType?: 'text' | 'image' | 'video' | 'audio' | 'file';
  replyToMessageId?: string;
}

export interface SendChatMessageResponse {
  messageId: string;
  success: boolean;
  data?: {
    messageId: string;
    conversationId: string;
    timestamp: string;
  };
}

// Define public endpoints that don't require authentication
const PUBLIC_ENDPOINTS = [
  ApiEndpoints.AUTH_ENDPOINTS.OTP_LOGIN,
  ApiEndpoints.AUTH_ENDPOINTS.OTP_VERIFY,
  // Guest mode endpoints
  '/api/list-premium-posts',
  '/api/getpublicvideos',
  '/api/getpublicshots',
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
      // Check if user is in guest mode
      const isGuestMode = await AsyncStorage.getItem('@guest_mode') === 'true';

      const isPublicEndpoint = PUBLIC_ENDPOINTS.some(endpoint => {
        const requestPath = config.url;
        return requestPath === endpoint || requestPath?.startsWith(endpoint);
      });

      if (isPublicEndpoint || isGuestMode) {
        console.log(`Request to public endpoint or guest mode: ${config.url}. No Authorization header will be added.`);
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
    // Log raw response details using ProductionLogger
    Logger.network('ApiService',
      response.config.method?.toUpperCase() || 'UNKNOWN',
      `${response.config.baseURL || ''}${response.config.url || ''}`,
      response.status,
      {
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        timestamp: new Date().toISOString()
      }
    );
    return response;
  },
  async error => {
    const originalRequest = error.config;

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

      // Handle 401 Unauthorized - attempt token refresh
      if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          console.log('🔄 Attempting token refresh...');
          const currentToken = await AsyncStorage.getItem('accessToken');

          if (currentToken) {
            // Attempt to refresh token
            const refreshResponse = await axios.post(
              `${API_BASE_URL}/api/refresh-token`,
              {},
              {
                headers: {
                  'Authorization': `Bearer ${currentToken}`,
                  'Content-Type': 'application/json'
                }
              }
            );

            if (refreshResponse.data.status && refreshResponse.data.accessToken) {
              const newToken = refreshResponse.data.accessToken;
              await AsyncStorage.setItem('accessToken', newToken);

              // Update the original request with new token
              originalRequest.headers.Authorization = `Bearer ${newToken}`;

              console.log('✅ Token refreshed successfully, retrying original request');
              return apiClient(originalRequest);
            }
          }
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);

          // Clear stored auth data
          await AsyncStorage.multiRemove(['accessToken', '@auth_token', 'user']);

          console.warn('🚨 User needs to re-authenticate - token refresh failed');
        }
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
   * Check network connectivity to the API server
   */
  static async checkNetworkConnectivity(): Promise<{
    isConnected: boolean;
    error?: string;
    details?: any;
  }> {
    try {
      console.log('[ApiService] Checking network connectivity to:', API_BASE_URL);
      
      // Test basic connectivity
      const response = await fetch(`${API_BASE_URL}/api/ping`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('[ApiService] Network connectivity test response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      return {
        isConnected: response.ok,
        details: {
          status: response.status,
          statusText: response.statusText,
          url: `${API_BASE_URL}/api/ping`
        }
      };
    } catch (error: any) {
      console.error('[ApiService] Network connectivity check failed:', error);
      
      const errorMessage = error.message || 'Unknown network error';
      const isLocalServer = API_BASE_URL.includes('192.168.0.104') || 
                           API_BASE_URL.includes('localhost') || 
                           API_BASE_URL.includes('127.0.0.1');
      
      let detailedError = errorMessage;
      if (isLocalServer) {
        detailedError = `Local server connectivity failed: ${errorMessage}\n` +
                       `Server URL: ${API_BASE_URL}\n` +
                       `Please ensure:\n` +
                       `1. Backend server is running\n` +
                       `2. Device and server are on same network\n` +
                       `3. Firewall allows connections to port 7082`;
      }
      
      return {
        isConnected: false,
        error: detailedError,
        details: {
          originalError: error.message,
          url: `${API_BASE_URL}/api/ping`,
          isLocalServer
        }
      };
    }
  }

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
        
        // Enhanced network error detection
        const baseURL = error.config?.baseURL || '';
        const isLocalServer = baseURL.includes('192.168.0.104') || baseURL.includes('localhost') || baseURL.includes('127.0.0.1');
        const isEmulator = baseURL.includes('10.0.2.2') || baseURL.includes('10.0.3.2');
        
        if (isLocalServer || isEmulator) {
          return new Error(
            'Network error while connecting to local server. Please check:\n' +
            '1. Backend server is running on ' + baseURL + '\n' +
            '2. Device and server are on same network\n' +
            '3. Firewall allows connections to port 7082\n' +
            '4. Try using your computer\'s IP address instead of localhost'
          );
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
    
    // Delete FCM token using centralized service
    try {
      const firebaseService = FirebaseService.getInstance();
      await firebaseService.deleteTokenOnLogout();
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

  /**
   * Refresh authentication token
   */
  static async refreshToken(): Promise<any> {
    try {
      const currentToken = await AsyncStorage.getItem('accessToken');

      if (!currentToken) {
        throw new Error('No token available for refresh');
      }

      const response = await this.post('/api/refresh-token', {}, {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status && response.accessToken) {
        await AsyncStorage.setItem('accessToken', response.accessToken);
        return response;
      } else {
        throw new Error('Invalid refresh response');
      }
    } catch (error) {
      console.error('[ApiService] Token refresh failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get comprehensive user data including profile, premium status, and withdrawal information
   */
  static async getUserData(data: GetUserDataRequest): Promise<GetUserDataResponse> {
    console.log('[ApiService] Fetching comprehensive user data for userId:', data.userid);

    try {
      const response = await this.post<GetUserDataResponse>(
        '/api/get-user-data',
        data,
      );

      console.log('[ApiService] User data fetched successfully:', {
        userId: response.data?.id,
        isPremium: response.data?.is_premium,
        premiumExpiresAt: response.data?.premium_expires_at,
      });

      return response;
    } catch (error) {
      console.error('[ApiService] Failed to fetch user data:', error);
      throw this.handleError(error);
    }
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
      const response = await this.get<WalletBalanceResponse>(
        `/api/getfunds/${userId}`,
        undefined,
        config,
      );
      return response;
    } catch (error) {
      throw this.handleError(error);
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
    try {
      const response = await this.get<PremiumCheckResponse>(
        `${ApiEndpoints.HOME_ENDPOINTS.CHECK_PREMIUM}/${userId}`,
      );
      return response;
    } catch (error: any) {
      // Handle the case where the API returns "No active premium plan" as an error
      if (error?.message?.toLowerCase().includes('no active premium plan')) {
        // This is a valid response indicating no premium, return a structured response
        return {
          is_premium_expired: true,
          user_id: '',
          plan_id: 0,
          end_time: '',
        };
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Get ad passbook for a user
   */
  static async getAdPassbook(userId: string | number): Promise<{
    status: number;
    message: string;
    data: any[];
  }> {
    try {
      console.log(`[ApiService] Fetching ad passbook for user ID: ${userId}`);
      
      const response = await this.get<{
        status: number;
        message: string;
        data: any[];
      }>(`/api/getadpassbook/${userId}`);
      
      console.log('[ApiService] Ad passbook response:', response);
      return response;
    } catch (error) {
      console.error('[ApiService] Error fetching ad passbook:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get FCM token for a user
   * @param userId - The user ID to get FCM token for
   * @param callerUserId - Optional caller user ID for batch request (for efficiency)
   */
  static async getFCMToken(userId: string, callerUserId?: string): Promise<{ token: string } | null> {
    try {
      // If callerUserId is provided, use the batch API for efficiency
      if (callerUserId) {
        const userIds = [parseInt(callerUserId), parseInt(userId)];
        const response = await this.getFcmTokensForUsers({ userIds });
        
        if (response && response.results) {
          // Find the token for the requested userId
          const targetUser = response.results.find(result => result.userId === parseInt(userId));
          
          if (targetUser && targetUser.status && targetUser.fcm_token) {
            return {
              token: targetUser.fcm_token,
            };
          }
        }
      } else {
        // Use single user endpoint for individual requests
        console.log(`[ApiService] Getting FCM token for single user: ${userId}`);
        const response = await this.get<{ fcm_token: string; status: boolean }>(`/api/get-fcm-token/${userId}`);
        
        console.log(`[ApiService] Single user FCM token response:`, response);
        
        if (response && response.status && response.fcm_token) {
          console.log(`[ApiService] Successfully extracted FCM token for user ${userId}:`, response.fcm_token);
          return {
            token: response.fcm_token,
          };
        }
        
        console.warn(`[ApiService] No FCM token found in response for user ${userId}:`, response);
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
   * Search videos using searchfuntube API
   */
  static async searchVideos(searchQuery: string, page: number = 1): Promise<any> {
    try {
      const response = await this.post('/api/searchfuntube', {
        searchname: searchQuery,
        page: page
      });
      return response;
    } catch (error) {
      console.error('ApiService.searchVideos error:', error);
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
      //console.log('[API] getAllUsersList response:', JSON.stringify(response, null, 2));
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
        ApiEndpoints.HOME_ENDPOINTS.SAVE_USER_POST_LIKE,
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
        '/api/saveVideoLike',
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
   * Get FCM tokens for both caller and recipient users
   * @param callerUserId - Caller's user ID
   * @param recipientUserId - Recipient's user ID
   * @returns Object with both caller and recipient FCM tokens
   */
  static async getBothUsersFCMTokens(callerUserId: string, recipientUserId: string): Promise<{
    callerToken: string | null;
    recipientToken: string | null;
  }> {
    try {
      const userIds = [parseInt(callerUserId), parseInt(recipientUserId)];
      const response = await this.getFcmTokensForUsers({ userIds });
      
      let callerToken = null;
      let recipientToken = null;
      
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
      };
    } catch (error) {
      console.error(`[ApiService] Error fetching FCM tokens for users ${callerUserId} and ${recipientUserId}:`, error);
      return {
        callerToken: null,
        recipientToken: null,
      };
    }
  }

  /**
   * Get recipient's FCM token from a call between two users
   * @param callerUserId - The caller's user ID (first in array)
   * @param recipientUserId - The recipient's user ID (second in array)
   * @returns The recipient's FCM token or null if not found
   */
  static async getRecipientFCMToken(callerUserId: string, recipientUserId: string): Promise<string | null> {
    try {
      const tokens = await this.getBothUsersFCMTokens(callerUserId, recipientUserId);
      return tokens.recipientToken;
    } catch (error) {
      console.error(`[ApiService] Error fetching recipient FCM token:`, error);
      return null;
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
  static async initiateCall(payload: InitiateCallRequest): Promise<any> {
    try {
      console.log('🚀 [ApiService] Making direct call to FCM Server for initiate-call:', FCM_SERVER_URL);
      console.log('🚀 [ApiService] Payload with callType:', JSON.stringify(payload, null, 2));
      
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
   * Send Call Signal - For CallSignalingService integration
   */
  static async sendCallSignal(recipientId: string, payload: any): Promise<void> {
    try {
      console.log('[ApiService] Sending call signal to recipient:', recipientId, payload);

      // Get recipient FCM token
      const recipientTokenData = await this.getFCMToken(recipientId);
      if (!recipientTokenData?.token) {
        throw new Error(`No FCM token found for recipient: ${recipientId}`);
      }

      // Get caller's FCM token
      const currentUserId = await AsyncStorage.getItem('userId');
      let callerToken = '';
      if (currentUserId) {
        try {
          const callerTokenData = await this.getFCMToken(currentUserId);
          callerToken = callerTokenData?.token || '';
        } catch (error) {
          console.warn('[ApiService] Could not fetch caller FCM token:', error);
        }
      }

      // Prepare the call signal payload to match initiate-call structure
      const signalPayload: UpdateCallStatusRequest = {
        callerInfo: {
          platform: 'ANDROID' as const,
          token: callerToken,
          name: payload.callerName || 'Unknown Caller',
        },
        calleeInfo: {
          platform: 'ANDROID' as const,
          token: recipientTokenData.token,
        },
        videoSDKInfo: {
          meetingId: payload.meetingId || 'unknown',
          token: payload.token || 'signal-operation',
          callType: payload.callType || 'video',
        },
        type: payload.type,
        sessionId: payload.sessionId,
      };

      // Use the existing updateCallStatus method for consistency
      await this.updateCallStatus(signalPayload);

    } catch (error) {
      console.error('[ApiService] sendCallSignal error:', error);
      throw error;
    }
  }

  /**
   * Update Call Status (Cloud Function) - Direct FCM Server call with new format
   */
  static async updateCallStatus(payload: UpdateCallStatusRequest): Promise<UpdateCallStatusResponse> {
    try {
      console.log('🚀 [ApiService] Making direct call to FCM Server for update-call:', FCM_SERVER_URL);

      // Ensure callerInfo.token is populated if empty
      if (!payload.callerInfo.token) {
        try {
          // Get current user's FCM token
          const currentUserId = await AsyncStorage.getItem('userId');
          if (currentUserId) {
            const tokenData = await this.getFCMToken(currentUserId);
            if (tokenData?.token) {
              payload.callerInfo.token = tokenData.token;
            }
          }
        } catch (tokenError) {
          console.warn('[ApiService] Could not fetch caller FCM token:', tokenError);
        }
      }

      // Add default videoSDKInfo if not provided (required for validation)
      if (!payload.videoSDKInfo) {
        payload.videoSDKInfo = {
          meetingId: payload.sessionId || 'unknown',
          token: 'update-operation',
          callType: 'video' // Default to video
        };
      }

      // Validate payload structure matches expected format
      if (!payload.callerInfo || !payload.callerInfo.name || !payload.callerInfo.platform || !payload.type) {
        console.error('❌ [ApiService] Invalid payload structure:', JSON.stringify(payload, null, 2));
        throw new Error('Invalid payload: missing required fields in callerInfo or type');
      }
      
      // Ensure payload matches the exact expected format
      const validatedPayload = {
        callerInfo: {
          token: payload.callerInfo.token,
          name: payload.callerInfo.name,
          platform: payload.callerInfo.platform
        },
        type: payload.type
      };
      
      console.log('📤 [ApiService] updateCallStatus validated payload:', JSON.stringify(validatedPayload, null, 2));
      
      // Get auth token for authenticated requests
      const authToken = await AsyncStorage.getItem('accessToken') || await AsyncStorage.getItem('@auth_token');
      console.log('🔑 [ApiService] Auth token available:', !!authToken);
      
      if (!authToken) {
        console.error('❌ [ApiService] No auth token found - this is required for update-call API');
        throw new Error('Authentication token required for updateCallStatus API');
      }
      
      const headers: any = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
      };
      
      console.log('🚀 [ApiService] Request headers:', { 
        'Content-Type': headers['Content-Type'],
        'Accept': headers.Accept,
        'Authorization': 'Bearer [REDACTED]'
      });
      
      const response = await axios.post(`${FCM_SERVER_URL}/api/call/update-call`, validatedPayload, {
        headers,
        timeout: 30000,
      });
      
      console.log('✅ [ApiService] update-call response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [ApiService] update-call error:', error);
      console.error('❌ [ApiService] update-call error details:', {
        payload: JSON.stringify(payload, null, 2),
        url: `${FCM_SERVER_URL}/api/call/update-call`,
        hasAuthToken: !!(await AsyncStorage.getItem('accessToken') || await AsyncStorage.getItem('@auth_token'))
      });
      throw this.handleError(error);
    }
  }

  /**
   * Send Chat Message (Cloud Function) - Direct FCM Chat Server call
   *
   * ⚠️ DEPRECATED: Use DirectFCMService instead for local-only chat
   * @deprecated Use DirectFCMService.sendMessage() instead
   */
  static async sendChatMessage(payload: SendChatMessageRequest): Promise<SendChatMessageResponse> {
    try {
      Logger.debug('ApiService', 'Making direct call to FCM Chat Server for send-message:', FCM_CHAT_SERVER_URL);
      Logger.debug('ApiService', 'Chat payload:', JSON.stringify(payload, null, 2));

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

      const response = await axios.post(`${FCM_CHAT_SERVER_URL}/api/chat/send-message`, payload, {
        headers,
        timeout: 30000,
      });

      console.log('✅ [ApiService] send-chat-message response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [ApiService] send-chat-message error:', error);
      console.error('❌ [ApiService] send-chat-message error details:', {
        payload: JSON.stringify(payload, null, 2),
        url: `${FCM_CHAT_SERVER_URL}/api/chat/send-message`,
        hasAuthToken: !!(await AsyncStorage.getItem('accessToken') || await AsyncStorage.getItem('@auth_token'))
      });
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
    return this.get(`/api/getpublicvideos/${categoryId}/${offset}`);
  }

  /**
   * Get public shots for TipShorts (no login required)
   */
  static async getPublicShots(): Promise<any> {
    return this.get('/api/getpublicshots');
  }

  // ===== VIDEO/SHORTS INTERACTION APIS =====

  /**
   * Save video like
   */
  static async saveVideoLike(reelId: number, userId: number, like: number, reelCreatorId: number): Promise<any> {
    const payload = { reelId, userId, like, reelCreatorId };
    console.log('[ApiService] Saving video like:', payload);
    try {
      const response = await this.post('/api/saveVideoLike', payload);
      console.log('[ApiService] Video like saved:', response.data);
      return response.data;
    } catch (error) {
      console.error('[ApiService] Error saving video like:', error);
      throw error;
    }
  }

  /**
   * Save video comment
   */
  static async saveVideoComment(
    videoId: number,
    userId: number,
    comment: string,
    parentCommetId: number | null = null,
    commentatorName: string = 'User',
    commentatorImage: string = ''
  ): Promise<any> {
    const payload = {
      comment,
      videoId,
      createdBy: userId,
      parentCommetId,
      commentatorName,
      commentatorImage
    };
    console.log('[ApiService] Saving video comment:', payload);
    try {
      const response = await this.post('/api/savevideocomment', payload);
      console.log('[ApiService] Video comment saved:', response.data);
      return response.data;
    } catch (error) {
      console.error('[ApiService] Error saving video comment:', error);
      throw error;
    }
  }

  /**
   * Save video comment like
   */
  static async saveVideoCommentLike(commentId: number, userId: number): Promise<any> {
    const payload = { commentId, userId };
    console.log('[ApiService] Saving video comment like:', payload);
    try {
      const response = await this.post('/api/savevideocommentlike', payload);
      console.log('[ApiService] Video comment like saved:', response.data);
      return response.data;
    } catch (error) {
      console.error('[ApiService] Error saving video comment like:', error);
      throw error;
    }
  }

  /**
   * Get total comments count for a video
   */
  static async getCommentOfVideo(videoId: number, page: number, limit: number): Promise<any> {
    console.log('[ApiService] Fetching comment count for video:', { videoId, page, limit });
    try {
      const response = await this.get(`/api/getCommentOfVideo/${videoId}/${page}/${limit}`);
      console.log('[ApiService] Comment count fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('[ApiService] Error fetching comment count:', error);
      throw error;
    }
  }

  /**
   * Get comments for a video
   */
  static async getCommentsOfVideos(userId: number, videoId: number): Promise<any> {
    console.log('[ApiService] Fetching comments for video:', { userId, videoId });
    try {
      const response = await this.get(`/api/getcommentsofvideos/${userId}/${videoId}`);
      console.log('[ApiService] Comments fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('[ApiService] Error fetching comments:', error);
      throw error;
    }
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
   * Get followers list for a user
   */
  static async getFollowers(userId: number): Promise<any> {
    return this.get(`/api/follow/followers/${userId}`);
  }

  /**
   * Get following list for a user
   */
  static async getFollowing(userId: number): Promise<any> {
    return this.get(`/api/follow/followings/${userId}`);
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

  /**
   * Get consolidated profile data (user info, posts, followers, following, social stats)
   * This replaces multiple API calls with a single efficient call
   */
  static async getConsolidatedProfile(userId: number, loggedUserId?: number): Promise<any> {
    const params = loggedUserId ? `?loggined_user_id=${loggedUserId}` : '';
    return this.get(`/api/users/${userId}/profile${params}`);
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
    media_type: 'video' | 'image' | 'audio';
    is_promoted: boolean;
    video_category_id?: number;
    start_date?: string;
    end_date?: string;
    target_min_age?: number;
    target_max_age?: number;
    pay_per_view?: number;
    reach_goal?: number;
    duration_days?: number;
    total_pay?: number;
    platform_fee?: number;
    post_target_locations?: Array<{id: number; name: string}>;
    post_target_genders?: Array<{id: number; name: string}>;
  }): Promise<{
    status: boolean;
    statusCode: number;
    message: string;
    data?: {
      post_id: number;
      user_id: number;
      title: string;
      is_promoted: boolean;
    };
  }> {
    try {
      console.log('[ApiService] Uploading post with data:', data);

      // Validate required fields
      if (!data.user_id || !data.title?.trim() || !data.media_type) {
        throw new Error('Missing required fields: user_id, title, media_type');
      }

      // For non-promoted posts, either content or media_url is required
      if (!data.is_promoted && !data.content?.trim() && !data.media_url) {
        throw new Error('Either content or media file is required for posts');
      }

      // Validate media_type enum
      if (!['image', 'video', 'audio'].includes(data.media_type)) {
        throw new Error('Invalid media_type. Must be image, video, or audio');
      }

      // Validate promoted post requirements
      if (data.is_promoted) {
        if (!data.pay_per_view || !data.reach_goal || !data.duration_days || !data.total_pay) {
          throw new Error('Missing required promotional fields: pay_per_view, reach_goal, duration_days, total_pay');
        }
        if (!data.post_target_locations?.length || !data.post_target_genders?.length) {
          throw new Error('Missing targeting information: post_target_locations, post_target_genders');
        }
      }

      const response = await this.post('/api/post', data);
      console.log('[ApiService] Post upload response:', response);
      return response;
    } catch (error: any) {
      console.error('[ApiService] Post upload failed:', error);
      throw this.handleError(error);
    }
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
    is_paid_promotional?: boolean;
    promotional_price?: number;
  }): Promise<{
    status: number;
    message: string;
    data: Array<{
      id: number;
      name: string;
      isShot: boolean;
      categoryId: number;
      channelId: number;
      videoLink: string;
      videoDesciption: string;
      createdby: number;
      play_duration: string;
      video_Thumbnail: string;
      is_paid_promotional?: boolean;
      promotional_price?: number;
    }>;
  }> {
    try {
      console.log('[ApiService] Uploading video shot:', data);

      // Validate required fields
      if (!data.name?.trim()) {
        throw new Error('Video title is required');
      }
      if (!data.categoryId) {
        throw new Error('Video category is required');
      }
      if (!data.channelId) {
        throw new Error('Channel ID is required');
      }
      if (!data.videoLink) {
        throw new Error('Video URL is required');
      }
      if (!data.video_Thumbnail) {
        throw new Error('Video thumbnail is required');
      }
      if (!data.createdby) {
        throw new Error('User authentication required');
      }
      if (!data.play_duration) {
        throw new Error('Video duration is required');
      }

      // Validate paid promotional fields if applicable
      if (data.is_paid_promotional && (!data.promotional_price || data.promotional_price <= 0)) {
        throw new Error('Valid promotional price is required for paid videos');
      }

      const response = await this.post('/api/uploadshot', data);
      console.log('[ApiService] Video shot uploaded successfully:', response);
      return response;
    } catch (error: any) {
      console.error('[ApiService] Video shot upload failed:', error);
      throw this.handleError(error);
    }
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
    return this.get(`/api/getpopularshort/${videoType}/${userId}`);
  }

  /**
   * Get videos by channel
   */
  static async getVideoByChannel(videoType: number, channelId: number, userId: number): Promise<any> {
    return this.get(`/api/getvideobychannel/${videoType}/${channelId}/${userId}`);
  }

  /**
   * Get list of followed channels
   */
  static async getListOfFollowedChannelByUser(userId: number): Promise<any> {
    return this.get(`/api/getlistoffollowedchannelbyuser/${userId}`);
  }

  // ===== VIDEO MANAGEMENT APIS =====

  /**
   * Edit video metadata (title, description, thumbnail)
   */
  static async editVideo(data: {
    id: number;
    name?: string;
    description?: string;
    thumbnail?: string;
  }): Promise<any> {
    console.log('[ApiService] Editing video:', data);
    try {
      const response = await this.post('/api/editVideo', data);
      console.log('[ApiService] Video edited successfully:', response);
      return response;
    } catch (error) {
      console.error('[ApiService] Error editing video:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Delete video
   */
  static async deleteVideo(videoId: number): Promise<any> {
    console.log('[ApiService] Deleting video:', videoId);
    try {
      const response = await this.get(`/api/deleteVideo/${videoId}`);
      console.log('[ApiService] Video deleted successfully:', response);
      return response;
    } catch (error) {
      console.error('[ApiService] Error deleting video:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Delete post
   */
  static async deletePost(postId: number): Promise<any> {
    console.log('[ApiService] Deleting post:', postId);
    try {
      const response = await this.post('/api/post/delete', { post_id: postId });
      console.log('[ApiService] Post deleted successfully:', response);
      return response;
    } catch (error) {
      console.error('[ApiService] Error deleting post:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get single post by ID
   */
  static async getSinglePost(postId: number): Promise<any> {
    console.log('[ApiService] Getting single post:', postId);
    try {
      const response = await this.get(`/api/post/${postId}`);
      console.log('[ApiService] Single post retrieved successfully:', response);
      return response;
    } catch (error) {
      console.error('[ApiService] Error getting single post:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update post
   */
  static async updatePost(data: {
    post_id: number;
    title: string;
    content: string;
  }): Promise<any> {
    console.log('[ApiService] Updating post:', data);
    try {
      const response = await this.post('/api/update-post', data);
      console.log('[ApiService] Post updated successfully:', response);
      return response;
    } catch (error) {
      console.error('[ApiService] Error updating post:', error);
      throw this.handleError(error);
    }
  }

  // ===== CONTACT FORM APIS =====

  /**
   * Submit contact form
   */
  static async submitContactForm(data: {
    name: string;
    email: string;
    phone?: string | null;
    subject: string;
    message: string;
    category?: string;
    priority?: string;
    app_version?: string;
    device_info?: any;
  }): Promise<any> {
    console.log('[ApiService] 🚀 submitContactForm - Starting submission');
    console.log('[ApiService] 📝 Contact form data:', {
      ...data,
      message: data.message?.substring(0, 100) + '...', // Truncate for logging
    });

    try {
      console.log('[ApiService] 🌐 Making POST request to /api/contact/submit');
      const response = await this.post('/api/contact/submit', data);

      console.log('[ApiService] ✅ Contact form submitted successfully');
      console.log('[ApiService] 📥 Response details:', {
        status: response.status,
        message: response.message,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
      });

      return response;
    } catch (error) {
      console.error('[ApiService] ❌ Error submitting contact form:', error);
      console.error('[ApiService] 🔍 Error details:', {
        name: (error as any)?.name,
        message: (error as any)?.message,
        status: (error as any)?.status,
        response: (error as any)?.response,
      });
      throw this.handleError(error);
    }
  }

  // ===== PREMIUM PLAN APIS =====

  /**
   * Get user premium plans - DEPRECATED: Use getSubscriptionStatus instead
   */
  // static async getUserPremiumPlans(userId: number): Promise<any> {
  //   return this.get(`/api/user-premium-plans/${userId}`);
  // }

  /**
   * Get content premium plans
   */
  static async getContentPremiumPlans(): Promise<any> {
    return this.get('/api/content-premium-plans');
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

  // Get subscription plans with GST for Razorpay checkout
  static async getSubscriptionPlansWithGST(): Promise<any> {
    return this.get('/api/subscription-plans-with-gst');
  }

  static async createSubscription(plan_id: string, user_id: number): Promise<any> {
    return this.post('/api/subscriptions/create', { plan_id, user_id });
  }

  static async cancelSubscription(user_id: number): Promise<any> {
    console.log('🌐 [ApiService] Making POST request to /api/subscriptions/cancel with user_id:', user_id);
    const response = await this.post('/api/subscriptions/cancel', { user_id });
    console.log('📥 [ApiService] cancelSubscription response:', response);
    return response;
  }

  static async cancelSubscriptionTest(user_id: number): Promise<any> {
    return this.post('/api/subscriptions/cancel-test', { user_id });
  }

  static async getSubscriptionStatus(userId: number): Promise<any> {
    console.log('🌐 [ApiService] Making GET request to /api/subscriptions/status/' + userId);
    const response = await this.get(`/api/subscriptions/status/${userId}`);
    console.log('📥 [ApiService] getSubscriptionStatus response:', response);
    return response;
  }

  // Content Creator Subscription apis
  static async getContentSubscriptionPlans(): Promise<any> {
    return this.get('/api/content-premium-plans');
  }

  // Get content creator premium plans with GST for Razorpay checkout
  static async getContentSubscriptionPlansWithGST(): Promise<any> {
    return this.get('/api/content-premium-plans-with-gst');
  }

  // ===== SUBSCRIPTION APIS TEST=====
  static async getSubscriptionPlansTest(): Promise<any> {
    return this.get('/api/subscription-plans-test');
  }

  // Get test subscription plans with GST for Razorpay checkout
  static async getSubscriptionPlansTestWithGST(): Promise<any> {
    return this.get('/api/subscription-plans-test-with-gst');
  }

  static async createSubscriptionTest(plan_id: string, user_id: number): Promise<any> {
    return this.post('/api/subscriptions/create-test', { plan_id, user_id });
  }

  // ===== RAZORPAY INTEGRATION APIS =====

  /**
   * Get Razorpay details
   */
  static async getRazorpayDetails(): Promise<any> {
    return this.get('/api/razorpay-details');
  }

  static async getRazorpayDetailsTest(): Promise<any> {
    return this.get('/api/razorpay-details-test');
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
    return this.post('/api/getcelebrationads', data);
  }

  /**
   * Save celebration ad view
   */
  static async saveCelebrationAdView(data: {
    adId: number;
    userId: number;
  }): Promise<any> {
    return this.post('/api/savecelebrationadview', data);
  }

  // ===== NOTIFICATIONS & EXPLORE APIS =====

  /**
   * Get sent notifications
   */
  static async getSentNotifications(userId: number): Promise<any> {
    return this.get(`/api/getsentnotification/${userId}`);
  }

  /**
   * Get explore content
   */
  static async getExploreContent(data: ExploreContentRequest): Promise<ExploreContentResponse> {
    console.log('🔍 Getting explore content with params:', data);
    const response = await this.post('/api/explore', data);
    console.log('📥 Explore API response:', response);
    return response;
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

  // ===== TIP-TUBE UPLOAD SERVICES =====

  /**
   * Upload TipShorts video using the enhanced uploadShot method
   */
  static async uploadTipShortsVideo(data: {
    name: string;
    categoryId: number;
    channelId: number;
    videoLink: string;
    videoDesciption: string;
    createdby: number;
    play_duration: string;
    video_Thumbnail: string;
    is_paid_promotional?: boolean;
    promotional_price?: number;
  }): Promise<{
    status: number;
    message: string;
    data: Array<{
      id: number;
      name: string;
      isShot: boolean;
      categoryId: number;
      channelId: number;
      videoLink: string;
      videoDesciption: string;
      createdby: number;
      play_duration: string;
      video_Thumbnail: string;
      is_paid_promotional?: boolean;
      promotional_price?: number;
    }>;
  }> {
    return this.uploadShot({
      ...data,
      isShot: true, // TipShorts videos have isShot: true
    });
  }

  /**
   * Upload TipTube video using the enhanced uploadShot method
   */
  static async uploadTipTubeVideo(data: {
    name: string;
    categoryId: number;
    channelId: number;
    videoLink: string;
    videoDesciption: string;
    createdby: number;
    play_duration: string;
    video_Thumbnail: string;
    is_paid_promotional?: boolean;
    promotional_price?: number;
  }): Promise<{
    status: number;
    message: string;
    data: Array<{
      id: number;
      name: string;
      isShot: boolean;
      categoryId: number;
      channelId: number;
      videoLink: string;
      videoDesciption: string;
      createdby: number;
      play_duration: string;
      video_Thumbnail: string;
      is_paid_promotional?: boolean;
      promotional_price?: number;
    }>;
  }> {
    return this.uploadShot({
      ...data,
      isShot: false, // TipTube videos have isShot: false
    });
  }

  /**
   * Create a new post (updated to use uploadPost method)
   */
  static async createPost(data: {
    user_id: number;
    title: string;
    content: string;
    media_url: string;
    media_type: 'video' | 'image' | 'audio';
    is_promoted: boolean;
    video_category_id?: number;
    start_date?: string;
    end_date?: string;
    target_min_age?: number;
    target_max_age?: number;
    pay_per_view?: number;
    reach_goal?: number;
    duration_days?: number;
    total_pay?: number;
    platform_fee?: number;
    post_target_locations?: Array<{id: number; name: string}>;
    post_target_genders?: Array<{id: number; name: string}>;
  }): Promise<{
    status: boolean;
    statusCode: number;
    message: string;
    data?: {
      post_id: number;
      user_id: number;
      title: string;
      is_promoted: boolean;
    };
  }> {
    // Use the updated uploadPost method
    return this.uploadPost(data);
  }

  static async viewNormalVideo(videoId: number): Promise<any> {
    try {
      const response = await this.post(
        `/api/viewNormalVideo`,
        { reelId: videoId }
      );

      // Track analytics event for normal video view
      if (response.status === true || response.statusCode === 200) {
        try {
          const analyticsService = (await import('./AnalyticsService')).default;
          await analyticsService.trackEvent('video_view', {
            videoId: videoId,
            videoType: 'normal',
            timestamp: Date.now(),
            source: 'api_call'
          });
        } catch (analyticsError) {
          console.warn('Failed to track analytics for normal video view:', analyticsError);
        }
      }

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async viewPaidVideo(videoId: number): Promise<any> {
    try {
      const response = await this.post(
        `/api/viewPaidVideo`,
        { reelId: videoId }
      );

      // Track analytics event for paid video view
      if (response.status === true || response.statusCode === 200) {
        try {
          const analyticsService = (await import('./AnalyticsService')).default;
          await analyticsService.trackEvent('video_view', {
            videoId: videoId,
            videoType: 'paid',
            paymentType: 'standard',
            timestamp: Date.now(),
            source: 'api_call'
          });
        } catch (analyticsError) {
          console.warn('Failed to track analytics for paid video view:', analyticsError);
        }
      }

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async saveChannelFollowers(data: {
    userId: number;
    channelId: number;
    follow: number; // 1 for follow, 0 for unfollow
  }): Promise<any> {
    try {
      const response = await this.post('/api/saveChannelFollowers', data);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getVideoWithUserContext(videoId: number, userId: number): Promise<any> {
    try {
      const response = await this.get(`/api/getvideo/${videoId}/${userId}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async createContentPremiumSubscription(plan_id: string, user_id: number): Promise<any> {
    return this.post('/api/content-premium/create', { plan_id, user_id });
  }

  static async cancelContentPremiumSubscription(user_id: number): Promise<any> {
    console.log('🌐 [ApiService] Making POST request to /api/content-premium/cancel with user_id:', user_id);
    const response = await this.post('/api/content-premium/cancel', { user_id });
    console.log('📥 [ApiService] cancelContentPremiumSubscription response:', response);
    return response;
  }

  static async getContentPremiumStatus(userId: number): Promise<any> {
    console.log('🌐 [ApiService] Making GET request to /api/content-premium/status/' + userId);
    const response = await this.get(`/api/content-premium/status/${userId}`);
    console.log('📥 [ApiService] getContentPremiumStatus response:', response);
    return response;
  }

  static async getContentPremiumRazorpayDetails(): Promise<any> {
    return this.get('/api/content-premium/razorpay-details');
  }

  /**
   * Get missed calls for a user
   */
  static async getMissedCalls(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<ApiResponse<Contact[]>> {
    try {
      const response = await this.get<ApiResponse<Contact[]>>(
        `${ApiEndpoints.TIP_CALLS_ENDPOINTS.MISSED_CALLS}/${userId}`,
        { page, limit },
      );
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Search users by name with pagination
   */
  static async searchUsersByName(
    search_by_name: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    status: boolean;
    message: string;
    data: {
      users: Array<{
        id: number;
        name: string;
        profile_image: string | null;
      }>;
      pagination: {
        current_page: number;
        total_pages: number;
        total_users: number;
        limit: number;
        has_next: boolean;
        has_prev: boolean;
      };
    };
  }> {
    try {
      const response = await this.post('/api/search-users', {
        search_by_name,
        page,
        limit,
      });
      return response;
    } catch (error) {
      console.error('❌ [ApiService] Error searching users:', error);
      throw this.handleError(error);
    }
  }

  static async checkAppVersion(data: {
    current_version: string;
    current_build: string;
    platform: string;
  }): Promise<{
    status: boolean;
    message: string;
    data?: {
      latest_version: string;
      minimum_version: string;
      force_update: boolean;
      update_message?: string;
      store_url?: string;
    };
  }> {
    try {
      console.log('📡 [ApiService] Checking app version:', data);
      const response = await this.post('/api/check-app-version', data);
      console.log('📥 [ApiService] App version check response:', response);
      return response;
    } catch (error) {
      console.error('❌ [ApiService] Error checking app version:', error);
      throw this.handleError(error);
    }
  }

  static async getLanguages(): Promise<any> {
    return this.get('/api/getlanguages');
  }

  static async getInterests(): Promise<any> {
    return this.get('/api/getinterests');
  }

  static async getTargetProfessions(): Promise<any> {
    return this.get('/api/gettargetprofession');
  }

  // Voice Call APIs (New subscription-based system)
  static async initiateVoiceCall(data: {
    callerId: number;
    receiverId: number;
    action: 'start' | 'end' | 'missed';
    callId?: number;
  }): Promise<any> {
    return this.post('/api/voice-call', data);
  }

  static async getVoiceCallBalance(userId: number): Promise<any> {
    return this.get(`/api/voice-call/balance/${userId}`);
  }

  static async getVoiceCallHistory(userId: number, page: number = 1, limit: number = 10): Promise<any> {
    return this.get(`/api/voice-call/history/${userId}?page=${page}&limit=${limit}`);
  }

  // Video Call APIs (New subscription-based system)
  static async initiateVideoCall(data: {
    callerId: number;
    receiverId: number;
    action: 'start' | 'end' | 'missed';
    callId?: number;
  }): Promise<any> {
    return this.post('/api/video-call', data);
  }

  static async getVideoCallBalance(userId: number): Promise<any> {
    return this.get(`/api/video-call/balance/${userId}`);
  }

  static async getVideoCallHistory(userId: number, page: number = 1, limit: number = 10): Promise<any> {
    return this.get(`/api/video-call/history/${userId}?page=${page}&limit=${limit}`);
  }

  // Consolidated Call API (combines token generation, meeting creation, and call initiation)
  static async initiateConsolidatedCall(data: {
    callerId: number;
    receiverId: number;
    callType: 'voice' | 'video';
    platform?: 'ANDROID' | 'IOS';
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      callId: number;
      sessionId: string;
      meetingId: string;
      token: string;
      channelName: string;
      maxDuration: number;
      maxDurationMinutes: number;
      callerInfo: { id: number; name: string };
      receiverInfo: { id: number; name: string };
      callType: string;
      platform: string;
      startTime: string;
      maxEndTime: string;
    };
  }> {
    return this.post('/api/adtipcall', data);
  }

  // ===== WITHDRAWAL APIs =====

  // Get withdrawal settings
  static async getWithdrawalSettings(): Promise<any> {
    try {
      const response = await this.get('/api/withdrawal-settings');
      return response;
    } catch (error) {
      console.error('Error getting withdrawal settings:', error);
      throw error;
    }
  }

  // Check withdrawal eligibility
  static async checkWithdrawalEligibility(userId: number, amount: number, withdrawalType: string): Promise<any> {
    try {
      const response = await this.post('/api/check-withdrawal-eligibility', {
        userId,
        amount,
        withdrawalType
      });
      return response;
    } catch (error) {
      console.error('Error checking withdrawal eligibility:', error);
      throw error;
    }
  }

  // Process wallet withdrawal
  static async processWalletWithdrawal(data: {
    userId: number;
    amount: number;
    transactionMethod: 'BANK' | 'UPI';
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    mobileNumber?: string;
    upiId?: string;
  }): Promise<any> {
    try {
      const response = await this.post('/api/process-wallet-withdrawal', data);
      return response;
    } catch (error) {
      console.error('Error processing wallet withdrawal:', error);
      throw error;
    }
  }

  // Process referral withdrawal
  static async processReferralWithdrawal(data: {
    userId: number;
    amount: number;
    withdrawalType: 'referral' | 'coupon';
    bankName?: string;
    bankIfsc?: string;
    bankAccountNumber?: string;
    upiId?: string;
  }): Promise<any> {
    try {
      const response = await this.post('/api/process-referral-withdrawal', data);
      return response;
    } catch (error) {
      console.error('Error processing referral withdrawal:', error);
      throw error;
    }
  }

  // Process channel withdrawal
  static async processChannelWithdrawal(data: {
    userId: number;
    channelId?: number;
    amount: number;
    withdrawalType: 'creator_referral' | 'content_earnings';
    bankName?: string;
    bankIfsc?: string;
    bankAccountNumber?: string;
    upiId?: string;
  }): Promise<any> {
    try {
      const response = await this.post('/api/process-channel-withdrawal', data);
      return response;
    } catch (error) {
      console.error('Error processing channel withdrawal:', error);
      throw error;
    }
  }

  // Get withdrawal history
  static async getWithdrawalHistory(userId: number, type: string = 'all', page: number = 1, limit: number = 10): Promise<any> {
    try {
      const response = await this.get(`/api/withdrawal-history/${userId}?type=${type}&page=${page}&limit=${limit}`);
      return response;
    } catch (error) {
      console.error('Error getting withdrawal history:', error);
      throw error;
    }
  }

  // Get withdrawal statistics
  static async getWithdrawalStats(userId: number): Promise<any> {
    try {
      const response = await this.get(`/api/withdrawal-stats/${userId}`);
      return response;
    } catch (error) {
      console.error('Error getting withdrawal stats:', error);
      throw error;
    }
  }

  /**
   * Credit ad reward to user's wallet (no transaction record)
   * @param { userId, amount }
   */
  static async creditAdReward({ userId, amount }: { userId: number, amount: number }) {
    try {
      const response = await this.post('/api/wallet/credit-ad-reward', { userId, amount });
      return response;
    } catch (error) {
      console.error('Error crediting ad reward:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get reward history for a user
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 20)
   */
  static async getRewardHistory(page: number = 1, limit: number = 20) {
    try {
      const response = await this.get(`/api/reward/history?page=${page}&limit=${limit}`);
      return response;
    } catch (error) {
      console.error('Error getting reward history:', error);
      throw this.handleError(error);
    }
  }

  // Add missing getUnreadMessageCount method
  static async getUnreadMessageCount(userId: number): Promise<number> {
    try {
      // Since we're using local storage for chat, we need to calculate unread count from local storage
      const keys = await AsyncStorage.getAllKeys();
      const userChatKeys = keys.filter(key => 
        key.startsWith('@chat_') && 
        (key.includes(`_${userId}`) || key.includes(`${userId}_`))
      );
      
      let totalUnread = 0;
      for (const key of userChatKeys) {
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
          const messages = JSON.parse(raw);
          const unreadCount = messages.filter((msg: any) => 
            msg.receiver === userId && !msg.is_seen
          ).length;
          totalUnread += unreadCount;
        }
      }
      return totalUnread;
    } catch (error) {
      console.error('Error getting unread message count:', error);
      return 0;
    }
  }

  static async viewSubscriptionPaidVideo(videoId: number): Promise<any> {
    try {
      const response = await this.post(
        `/api/viewSubscriptionPaidVideo`,
        { reelId: videoId }
      );

      // Track analytics event for subscription paid video view
      if (response.status === true || response.statusCode === 200) {
        try {
          const analyticsService = (await import('./AnalyticsService')).default;
          await analyticsService.trackEvent('video_view', {
            videoId: videoId,
            videoType: 'paid',
            paymentType: 'subscription',
            timestamp: Date.now(),
            source: 'api_call'
          });
        } catch (analyticsError) {
          console.warn('Failed to track analytics for subscription paid video view:', analyticsError);
        }
      }

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async viewPaidVideoNoPremium(videoId: number): Promise<any> {
    try {
      const response = await this.post(
        `/api/viewPaidVideoNoPremium`,
        { reelId: videoId }
      );

      // Track analytics event for paid video view (no premium)
      if (response.status === true || response.statusCode === 200) {
        try {
          const analyticsService = (await import('./AnalyticsService')).default;
          await analyticsService.trackEvent('video_view', {
            videoId: videoId,
            videoType: 'paid',
            paymentType: 'no_premium',
            timestamp: Date.now(),
            source: 'api_call'
          });
        } catch (analyticsError) {
          console.warn('Failed to track analytics for paid video view (no premium):', analyticsError);
        }
      }

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}