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
    if (error.response) {
      if (error.response.status === 401) {
        // Unauthorized - token expired or invalid
        console.warn('API: Unauthorized access - token may be expired');
      }

      if (error.response.status === 429) {
        console.warn('API rate limit exceeded. Please try again later.');
      }
    } else if (error.request) {
      console.error('Network error. Please check your connection.');
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
      fcmToken,
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
        platform: data.platform || Platform.OS,
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
   * Handle call status updates
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
          status: false, 
          message: 'Request canceled by client', 
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
  static async getAdPassbook(userId: string | number): Promise<any> {
    return this.get(`${ApiEndpoints.HOME_ENDPOINTS.GET_AD_PASSBOOK}/${userId}`);
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
   * Generate a VideoSDK participant token via the backend
   */
  static async generateVideoSDKParticipantToken(): Promise<VideoSDKGenerateTokenResponse> {
    console.log('[API] Requesting VideoSDK participant token from backend');
    try {
      const response = await this.post<VideoSDKGenerateTokenResponse>(
        ApiEndpoints.TIP_CALLS_ENDPOINTS.VIDEOSDK_GENERATE_TOKEN,
        {},
      );
      console.log('[API] VideoSDK participant token response:', {
        success: response.success,
        hasToken: !!response.token,
        message: response.message
      });
      
      if (!response.success || !response.token) {
        throw new Error(response.message || 'Failed to generate VideoSDK token from backend.');
      }
      return response;
    } catch (error) {
      console.error('[API] Error generating VideoSDK participant token:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Create a VideoSDK meeting room via the backend
   */
  static async createVideoSDKMeeting(
    videoSDKToken: string,
    region: string = "us"
  ): Promise<VideoSDKCreateMeetingResponse> {
    const requestData: VideoSDKCreateMeetingRequest = {
      token: videoSDKToken,
      region: region
    };
    
    console.log('[API] Creating VideoSDK meeting via backend:', {
      hasToken: !!videoSDKToken,
      region: region
    });
    
    try {
      const response = await this.post<VideoSDKCreateMeetingResponse>(
        ApiEndpoints.TIP_CALLS_ENDPOINTS.VIDEOSDK_CREATE_MEETING,
        requestData,
      );
      
      console.log('[API] Create VideoSDK meeting response:', {
        success: response.success,
        roomId: response.data?.roomId,
        message: response.message
      });
      
      if (!response.success || !response.data || !response.data.roomId) {
        throw new Error(response.message || 'Failed to create VideoSDK meeting via backend.');
      }
      return response;
    } catch (error) {
      console.error('[API] Error creating VideoSDK meeting:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Deactivate a VideoSDK meeting room via the backend
   */
  static async deactivateVideoSDKRoom(
    data: VideoSDKDeactivateRoomRequest,
  ): Promise<VideoSDKDeactivateRoomResponse> {
    console.log('[API] Requesting to deactivate VideoSDK room via backend:', data);
    try {
      const response = await this.post<VideoSDKDeactivateRoomResponse>(
        ApiEndpoints.TIP_CALLS_ENDPOINTS.VIDEOSDK_DEACTIVATE_ROOM,
        data,
      );
      console.log('[API] Deactivate VideoSDK room response:', JSON.stringify(response, null, 2));
      if (!response.success) {
        throw new Error(response.message || 'Failed to deactivate VideoSDK room via backend.');
      }
      return response;
    } catch (error) {
      console.error('[API] Error deactivating VideoSDK room:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Validate a VideoSDK meeting room via the backend
   */
  static async validateVideoSDKMeeting(
    data: VideoSDKValidateMeetingRequest,
  ): Promise<VideoSDKValidateMeetingResponse> {
    console.log('[API] Requesting to validate VideoSDK meeting via backend:', data);
    try {
      const response = await this.post<VideoSDKValidateMeetingResponse>(
        ApiEndpoints.TIP_CALLS_ENDPOINTS.VIDEOSDK_VALIDATE_MEETING,
        data,
      );
      console.log('[API] Validate VideoSDK meeting response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error('[API] Error validating VideoSDK meeting:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update user profile information including DND status
   */
  static async updateUser(data: UpdateUserRequest): Promise<UpdateUserResponse> {
    console.log('[API] Updating user with data:', JSON.stringify(data, null, 2));
    try {
      const response = await this.post<UpdateUserResponse>(
        '/api/updateuser',
        data,
      );
      console.log('[API] Update user response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error('[API] Error updating user:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Initiate call with VideoSDK integration
   */
  static async initiateCall(data: InitiateCallRequest): Promise<InitiateCallResponse> {
    console.log('[ApiService] Initiating call:', {
      calleePlatform: data.calleeInfo.platform,
      callerName: data.callerInfo.name,
      meetingId: data.videoSDKInfo.meetingId,
      hasCalleeToken: !!data.calleeInfo.token,
      hasCallerToken: !!data.callerInfo.token,
      hasVideoSDKToken: !!data.videoSDKInfo.token,
    });

    try {
      const response = await this.post<InitiateCallResponse>(
        '/api/initiate-call',
        data,
      );

      console.log('[ApiService] Initiate call response:', {
        success: response.success,
        message: response.message,
        hasData: !!response.data,
      });

      return response;
    } catch (error) {
      console.error('[ApiService] Error initiating call:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Enhanced initiate call that tries Firebase Cloud Functions first
   */
  static async initiateCallWithFirebase(data: InitiateCallRequest): Promise<InitiateCallResponse> {
    console.log('[ApiService] Initiating call with Firebase integration:', {
      calleePlatform: data.calleeInfo.platform,
      callerName: data.callerInfo.name,
      meetingId: data.videoSDKInfo.meetingId,
    });

    try {
      // Try Firebase Cloud Functions first
      const firebaseResponse = await fetch(`${FCM_SERVER_URL}/api/call/initiate-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          callerInfo: data.callerInfo,
          calleeInfo: data.calleeInfo,
          videoSDKInfo: data.videoSDKInfo,
        }),
        timeout: 30000,
      });

      const firebaseData = await firebaseResponse.json();
      
      if (firebaseResponse.ok) {
        console.log('[ApiService] Firebase call initiated successfully:', firebaseData);
        return {
          success: true,
          message: firebaseData.message || 'Call initiated successfully',
          data: firebaseData.data || firebaseData,
        };
      } else {
        console.warn('[ApiService] Firebase call failed, falling back to regular API');
        throw new Error(firebaseData.error || 'Firebase call failed');
      }
    } catch (error) {
      console.error('[ApiService] Firebase call initiation failed, trying fallback:', error);
      
      // Fallback to the existing API method
      try {
        return await this.initiateCall(data);
      } catch (fallbackError) {
        console.error('[ApiService] Both Firebase and fallback methods failed:', fallbackError);
        throw new Error('Failed to initiate call. Please check your connection and try again.');
      }
    }
  }

  /**
   * Get FCM tokens for multiple users
   */
  static async getFcmTokensForUsers(data: FcmTokensRequest): Promise<FcmTokensResponse> {
    console.log('[API] Getting FCM tokens for users:', data.userIds);
    try {
      const response = await this.post<FcmTokensResponse>(
        ApiEndpoints.TIP_CALLS_ENDPOINTS.GET_FCM_TOKENS,
        data,
      );
      console.log('[API] FCM tokens response:', response);
      return response;
    } catch (error) {
      console.error('[API] Error getting FCM tokens:', error);
      throw this.handleError(error);
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
}
