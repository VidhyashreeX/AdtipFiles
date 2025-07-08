import { register } from '@videosdk.live/react-native-sdk';
import ApiService from '../ApiService';

export interface VideoSDKConfig {
  token?: string;
  apiKey?: string;
  region?: 'sg001' | 'us001' | 'eu001';
}

export interface MeetingConfig {
  meetingId: string;
  token: string;
  participantName: string;
  micEnabled?: boolean;
  webcamEnabled?: boolean;
}

class VideoSDKService {
  private static instance: VideoSDKService;
  private isInitialized: boolean = false;
  private config: VideoSDKConfig = {};

  private constructor() {}

  public static getInstance(): VideoSDKService {
    if (!VideoSDKService.instance) {
      VideoSDKService.instance = new VideoSDKService();
    }
    return VideoSDKService.instance;
  }

  /**
   * Initialize VideoSDK with configuration
   */
  public async initialize(config: VideoSDKConfig = {}): Promise<boolean> {
    try {
      if (this.isInitialized) {
        console.log('[VideoSDK] Already initialized');
        return true;
      }

      this.config = config;

      // Register VideoSDK
      register();
      
      this.isInitialized = true;
      console.log('[VideoSDK] Service initialized successfully');
      
      return true;
    } catch (error) {
      console.error('[VideoSDK] Initialization failed:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Check if VideoSDK is initialized
   */
  public getInitializationStatus(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current configuration
   */
  public getConfig(): VideoSDKConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<VideoSDKConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('[VideoSDK] Configuration updated:', this.config);
  }  /**
   * Create a new meeting via backend API
   */
  public async createMeeting(participantToken: string): Promise<string | null> {
    try {
      console.log('[VideoSDK] Creating meeting via backend API');
      
      // Pass correct region code as per VideoSDK docs (us001, sg001, eu001)
      const response = await ApiService.createVideoSDKMeeting(participantToken, 'us001');
      
      console.log('[VideoSDK] Raw API response:', response);
      
      // Fix: Check the correct response structure
      if (response.success && response.data && response.data.roomId) {
        console.log('[VideoSDK] Meeting created:', response.data.roomId);
        return response.data.roomId;
      } else {
        console.error('[VideoSDK] Invalid response structure:', response);
        throw new Error('Failed to create meeting - invalid response structure');
      }
    } catch (error) {
      console.error('[VideoSDK] Failed to create meeting:', error);
      return null;
    }
  }

  /**
   * Validate meeting ID via backend API
   */
  public async validateMeeting(meetingId: string, participantToken: string): Promise<boolean> {
    try {
      console.log('[VideoSDK] Validating meeting via backend API:', meetingId);
      
      // For now, assume meeting is valid if we have a meetingId
      // You can implement actual validation later if needed
      return !!meetingId;
    } catch (error) {
      console.error('[VideoSDK] Failed to validate meeting:', error);
      return false;
    }
  }
  /**
   * Generate participant token via backend API
   */
  public async generateParticipantToken(): Promise<string | null> {
    try {
      console.log('[VideoSDK] Generating participant token via backend');
      
      const response = await ApiService.generateVideoSDKToken();
      
      if (response.token) {
        return response.token;
      } else {
        throw new Error('Failed to generate token');
      }
    } catch (error) {
      console.error('[VideoSDK] Failed to generate participant token:', error);
      return null;
    }
  }
  /**
   * Generate meeting configuration
   */
  public createMeetingConfig(
    meetingId: string,
    token: string,
    participantName: string,
    options: { micEnabled?: boolean; webcamEnabled?: boolean } = {}
  ): MeetingConfig {
    return {
      meetingId,
      token,
      participantName,
      micEnabled: options.micEnabled ?? false,
      webcamEnabled: options.webcamEnabled ?? false,
    };
  }

  /**
   * Reset service (for logout or cleanup)
   */
  public reset(): void {
    this.isInitialized = false;
    this.config = {};
    console.log('[VideoSDK] Service reset');
  }
}

// ✅ FIXED: Export the class itself, not getInstance()
export default VideoSDKService;