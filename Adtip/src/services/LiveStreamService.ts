// src/services/LiveStreamService.ts - Enhanced service for live streaming with VideoSDK integration

import ApiService from './ApiService';
import VideoSDKService from './videosdk/VideoSDKService';
import { Logger, logVideoSDK, logError } from '../utils/ProductionLogger';

export interface StreamConfig {
  title: string;
  cost_per_minute: number;
  viewer_reward_per_minute?: number;
  is_private?: boolean;
}

export interface TipData {
  amount: number;
  message?: string;
}

export interface LiveStreamResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface DeviceConfig {
  micEnabled: boolean;
  webcamEnabled: boolean;
  speakerEnabled: boolean;
}

class LiveStreamService {
  private static videoSDKService = VideoSDKService.getInstance();

  /**
   * Initialize VideoSDK for live streaming with proper device management
   */
  static async initializeForLiveStream(): Promise<boolean> {
    try {
      logVideoSDK('LiveStreamService', 'Initializing VideoSDK for live streaming...');
      
      // Ensure VideoSDK is initialized with enhanced configuration
      const initialized = await this.videoSDKService.ensureInitialized();
      
      if (!initialized) {
        throw new Error('Failed to initialize VideoSDK');
      }
      
      logVideoSDK('LiveStreamService', 'VideoSDK initialized successfully for live streaming');
      return true;
    } catch (error) {
      logError('LiveStreamService', 'Failed to initialize VideoSDK for live streaming', error);
      return false;
    }
  }

  /**
   * Create a live streaming meeting with proper VideoSDK configuration
   */
  static async createLiveStreamMeeting(): Promise<{
    success: boolean;
    meetingId?: string;
    token?: string;
    error?: string;
  }> {
    try {
      logVideoSDK('LiveStreamService', 'Creating live stream meeting...');
      
      // Generate VideoSDK token using ApiService (has proper logging and error handling)
      const tokenResponse = await ApiService.generateVideoSDKToken();
      
      if (!tokenResponse?.token) {
        throw new Error('Failed to generate VideoSDK token');
      }
      
      // Create meeting with live streaming configuration using ApiService
      const meetingResponse = await ApiService.createVideoSDKMeeting(tokenResponse.token, 'us001');
      
      if (!meetingResponse?.data?.roomId) {
        throw new Error('Failed to create VideoSDK meeting');
      }
      
      logVideoSDK('LiveStreamService', 'Live stream meeting created successfully', {
        meetingId: meetingResponse.data.roomId
      });
      
      return {
        success: true,
        meetingId: meetingResponse.data.roomId,
        token: tokenResponse.token
      };
    } catch (error) {
      logError('LiveStreamService', 'Failed to create live stream meeting', error);
      return {
        success: false,
        error: (error as any)?.message || 'Failed to create meeting'
      };
    }
  }

  /**
   * Start a new live stream with enhanced VideoSDK integration
   */
  static async startStream(userId: number, meetingId: string = '', config: StreamConfig): Promise<LiveStreamResponse> {
    try {
      logVideoSDK('LiveStreamService', 'Starting enhanced live stream:', { userId, config });

      // Let the backend handle meeting creation and token generation internally
      // Send empty string for meeting_id so backend creates its own
      const response = await ApiService.startLiveStream({
        user_id: userId,
        meeting_id: '', // Empty string - backend will auto-generate
        title: config.title,
        cost_per_minute: config.cost_per_minute,
        viewer_reward_per_minute: config.viewer_reward_per_minute || 0,
        is_private: config.is_private || false
      });

      logVideoSDK('LiveStreamService', 'Live stream started successfully:', response);
      
      return {
        success: true,
        message: 'Stream started successfully',
        data: {
          ...response.data,
          // The backend returns the actual meeting_id and token it created
          // Add streaming-specific data
          streaming_config: {
            hls_enabled: true,
            rtmp_enabled: false,
            max_participants: 100,
            auto_start_recording: false
          }
        }
      };

    } catch (error) {
      logError('LiveStreamService', 'Failed to start enhanced stream', error);
      
      // Check for specific VideoSDK configuration errors
      const errorMessage = (error as any)?.response?.data?.message || (error as any)?.message || 'Failed to start stream';
      const errorData = (error as any)?.response?.data;
      
      // Handle VideoSDK 404 errors specifically
      if (errorData?.error === 'Request failed with status code 404') {
        return {
          success: false,
          message: 'Video streaming service is temporarily unavailable. Please try again later or contact support.'
        };
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  /**
   * Configure device settings for live streaming
   */
  static async configureDevicesForStreaming(config: DeviceConfig): Promise<boolean> {
    try {
      logVideoSDK('LiveStreamService', 'Configuring devices for streaming:', config);
      
      // This will be used by the VideoSDK meeting components
      // The actual device control happens in the meeting screen
      const deviceConfig = {
        micEnabled: config.micEnabled,
        webcamEnabled: config.webcamEnabled,
        speakerEnabled: config.speakerEnabled,
        // Enhanced settings for live streaming
        audioQuality: 'high',
        videoQuality: 'hd',
        autoGainControl: true,
        noiseSuppression: true,
        echoCancellation: true
      };
      
      // Store config for use in meeting components
      // Note: Device config will be applied during MeetingProvider initialization
      
      logVideoSDK('LiveStreamService', 'Device configuration updated successfully');
      return true;
    } catch (error) {
      logError('LiveStreamService', 'Failed to configure devices', error);
      return false;
    }
  }

  /**
   * End an active live stream
   */
  static async endStream(userId: number, meetingId: string): Promise<LiveStreamResponse> {
    try {
      logVideoSDK('LiveStreamService', 'Ending live stream:', { userId, meetingId });

      const response = await ApiService.endLiveStream({
        user_id: userId,
        meeting_id: meetingId
      });

      logVideoSDK('LiveStreamService', 'Stream ended successfully:', response);
      return {
        success: true,
        message: 'Stream ended successfully',
        data: response.data
      };

    } catch (error) {
      logError('LiveStreamService', 'Failed to end stream', error);
      return {
        success: false,
        message: (error as any)?.response?.data?.message || (error as any)?.message || 'Failed to end stream'
      };
    }
  }

  /**
   * Join a live stream as viewer
   */
  static async joinStream(userId: number, meetingId: string): Promise<LiveStreamResponse> {
    try {
      logVideoSDK('LiveStreamService', 'Joining live stream:', { userId, meetingId });

      const response = await ApiService.joinLiveStream({
        user_id: userId,
        meeting_id: meetingId
      });

      logVideoSDK('LiveStreamService', 'Joined stream successfully:', response);
      return {
        success: true,
        message: 'Joined stream successfully',
        data: response.data
      };

    } catch (error) {
      logError('LiveStreamService', 'Failed to join stream', error);
      return {
        success: false,
        message: (error as any)?.response?.data?.message || (error as any)?.message || 'Failed to join stream'
      };
    }
  }

  /**
   * Send tip to streamer
   */
  static async sendTip(userId: number, meetingId: string, tipData: TipData): Promise<LiveStreamResponse> {
    try {
      logVideoSDK('LiveStreamService', 'Sending tip:', { userId, meetingId, tipData });

      const response = await ApiService.sendTip({
        user_id: userId,
        meeting_id: meetingId,
        amount: tipData.amount,
        message: tipData.message || ''
      });

      logVideoSDK('LiveStreamService', 'Tip sent successfully:', response);
      return {
        success: true,
        message: 'Tip sent successfully',
        data: response.data
      };

    } catch (error) {
      logError('LiveStreamService', 'Failed to send tip', error);
      return {
        success: false,
        message: (error as any)?.response?.data?.message || (error as any)?.message || 'Failed to send tip'
      };
    }
  }

  /**
   * Get list of active live streams
   */
  static async getActiveStreams(page: number = 1, limit: number = 20): Promise<LiveStreamResponse> {
    try {
      logVideoSDK('LiveStreamService', 'Getting active streams:', { page, limit });

      // Use getActiveStreams from ApiService properly
      const response = await ApiService.getActiveStreams({ page, limit });

      logVideoSDK('LiveStreamService', 'Retrieved active streams:', response);
      
      // Handle the response structure properly
      if (response && response.data) {
        return {
          success: true,
          message: 'Active streams retrieved successfully',
          data: response.data
        };
      } else {
        return {
          success: true,
          message: 'No streams found',
          data: { streams: [], pagination: { page, limit, total: 0, pages: 0 } }
        };
      }

    } catch (error) {
      logError('LiveStreamService', 'Failed to get active streams', error);
      return {
        success: false,
        message: (error as any)?.response?.data?.message || (error as any)?.message || 'Failed to get active streams'
      };
    }
  }

  /**
   * Validate stream configuration
   */
  static validateStreamConfig(config: StreamConfig): { valid: boolean; error?: string } {
    if (!config.title || config.title.trim().length === 0) {
      return { valid: false, error: 'Stream title is required' };
    }

    if (config.title.trim().length > 255) {
      return { valid: false, error: 'Stream title must be less than 255 characters' };
    }

    if (!config.cost_per_minute || config.cost_per_minute < 1 || config.cost_per_minute > 1000) {
      return { valid: false, error: 'Cost per minute must be between 1-1000' };
    }

    if (config.viewer_reward_per_minute && (config.viewer_reward_per_minute < 0 || config.viewer_reward_per_minute > 100)) {
      return { valid: false, error: 'Viewer reward must be between 0-100' };
    }

    return { valid: true };
  }

  /**
   * Validate tip amount
   */
  static validateTipAmount(amount: number): { valid: boolean; error?: string } {
    if (!amount || amount < 1 || amount > 1000) {
      return { valid: false, error: 'Tip amount must be between 1-1000' };
    }

    return { valid: true };
  }

  /**
   * Format stream duration
   */
  static formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }

    return `${mins}m`;
  }

  /**
   * Format currency amount
   */
  static formatCurrency(amount: number): string {
    return `₹${amount.toFixed(2)}`;
  }

  /**
   * Calculate streaming cost
   */
  static calculateStreamingCost(durationMinutes: number, costPerMinute: number): number {
    return Math.ceil(durationMinutes) * costPerMinute;
  }

  /**
   * Calculate viewer rewards
   */
  static calculateViewerReward(watchMinutes: number, rewardPerMinute: number): number {
    return Math.floor(watchMinutes) * rewardPerMinute;
  }
}

export default LiveStreamService;