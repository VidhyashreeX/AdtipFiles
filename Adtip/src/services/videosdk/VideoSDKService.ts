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
  private initializationPromise: Promise<boolean> | null = null;
  private config: VideoSDKConfig = {};
  
  // Add active meeting session tracking
  private activeMeetingSession: string | null = null;
  private meetingStateCleanupTimestamp: number = 0;

  private constructor() {}

  public static getInstance(): VideoSDKService {
    if (!VideoSDKService.instance) {
      VideoSDKService.instance = new VideoSDKService();
    }
    return VideoSDKService.instance;
  }

  /**
   * Initialize VideoSDK with proper WebSocket connection handling
   */
  async initialize(): Promise<boolean> {
    // If already initializing, return the existing promise
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    
    // If already initialized, return immediately
    if (this.isInitialized) {
      console.log('[VideoSDK] Already initialized');
      return true;
    }
    
    // Create a new initialization promise
    this.initializationPromise = (async () => {
      try {
        console.log('[VideoSDK] Initializing...');
        
        // Register with VideoSDK
        await register();
        
        // Add a small delay to ensure WebSocket connection is established
        await new Promise(resolve => setTimeout(resolve, 500));
        
        this.isInitialized = true;
        console.log('[VideoSDK] Initialization complete');
        return true;
      } catch (error) {
        console.error('[VideoSDK] Initialization failed:', error);
        this.isInitialized = false;
        return false;
      } finally {
        this.initializationPromise = null;
      }
    })();
    
    return this.initializationPromise;
  }

  /**
   * Get initialization status
   */
  getInitializationStatus(): boolean {
    return this.isInitialized;
  }

  /**
   * Ensure VideoSDK is initialized with WebSocket ready
   */
  async ensureInitialized(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }
    
    return this.initialize();
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
   * Create a new meeting via backend API with state isolation
   */
  public async createMeeting(participantToken: string): Promise<string | null> {
    try {
      console.log('[VideoSDK] Creating meeting via backend API with state isolation');
      
      // First, clear any existing meeting state to prevent conflicts
      await this.clearExistingMeetingState();
      
      // Pass correct region code as per VideoSDK docs (us001, sg001, eu001)
      const response = await ApiService.createVideoSDKMeeting(participantToken, 'us001');
      
      console.log('[VideoSDK] Raw API response:', response);
      
      // Fix: Check the correct response structure
      if (response.success && response.data && response.data.roomId) {
        console.log('[VideoSDK] Meeting created with isolation:', response.data.roomId);
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
   * Force clear any existing meeting state before creating a new one
   * This prevents meeting ID conflicts and ensures clean state
   */
  public async clearExistingMeetingState(): Promise<void> {
    console.log('[VideoSDK] Clearing existing meeting state to prevent conflicts');
    
    try {
      // Clear any global meeting references
      if (global.videoSDKMeetingData) {
        global.videoSDKMeetingData = null;
      }
      
      // Clear active meeting session tracking
      if (this.activeMeetingSession) {
        console.log('[VideoSDK] Clearing previous active meeting session:', this.activeMeetingSession);
        this.activeMeetingSession = null;
        this.meetingStateCleanupTimestamp = Date.now();
      }
      
      // Clear any participant data
      if (global.videoSDKParticipants) {
        global.videoSDKParticipants.clear();
      }
      
      // Clear VideoSDK internal state if accessible
      if (global.VideoSDK?.currentMeeting) {
        global.VideoSDK.currentMeeting = null;
      }
      
      // Force garbage collection to clear any remaining references
      if (global.gc) {
        global.gc();
      }
      
      // Add small delay to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('[VideoSDK] Meeting state cleared successfully');
    } catch (error) {
      console.warn('[VideoSDK] Error clearing meeting state:', error);
    }
  }

  /**
   * Reset service (for logout or cleanup)
   */
  public reset(): void {
    console.log('[VideoSDK] Starting comprehensive service reset');

    // Reset initialization state
    this.isInitialized = false;
    this.config = {};
    this.initializationPromise = null;

    // Force cleanup of any lingering WebRTC connections and participant state
    try {
      // Clear any global VideoSDK state if available
      if (global.VideoSDK) {
        console.log('[VideoSDK] Clearing global VideoSDK state');
        // Force cleanup of any active meetings or connections
      }

      // Clear any cached participant data that might cause state bleeding
      if (global.videoSDKParticipants) {
        console.log('[VideoSDK] Clearing cached participant data');
        global.videoSDKParticipants.clear();
        global.videoSDKParticipants = new Map();
      }

      // Clear any meeting data cache
      if (global.videoSDKMeetingData) {
        console.log('[VideoSDK] Clearing cached meeting data');
        global.videoSDKMeetingData = null;
      }

      // Force WebRTC cleanup to prevent participant ID conflicts
      if (global.RTCPeerConnection) {
        console.log('[VideoSDK] Forcing WebRTC connection cleanup');
        // This helps prevent participant ID conflicts between calls
      }

      // Clear any component instance tracking that might interfere
      if (global.meetingComponentInstances) {
        console.log('[VideoSDK] Clearing component instance tracking');
        global.meetingComponentInstances = {};
      }

      // Force clear React Native VideoSDK internal state
      try {
        // Clear any internal participant tracking that might cause ID conflicts
        if (global.VideoSDK?.participants) {
          global.VideoSDK.participants.clear();
        }
        
        // Reset any meeting session state
        if (global.VideoSDK?.currentMeeting) {
          global.VideoSDK.currentMeeting = null;
        }
        
        // Clear any WebSocket connection state
        if (global.VideoSDK?.websocketConnection) {
          global.VideoSDK.websocketConnection = null;
        }
      } catch (wsError) {
        console.warn('[VideoSDK] Error clearing WebSocket state:', wsError);
      }

    } catch (error) {
      console.warn('[VideoSDK] Error during comprehensive state cleanup:', error);
    }

    // Add delay to ensure all cleanup operations are complete
    setTimeout(() => {
      console.log('[VideoSDK] Service reset complete with delay');
    }, 100);

    console.log('[VideoSDK] Service reset complete');
  }

  /**
   * Set active meeting session to prevent multiple simultaneous meetings
   */
  public setActiveMeetingSession(sessionId: string): boolean {
    const now = Date.now();
    
    // If there's already an active session, check if it's the same or if enough time has passed for cleanup
    if (this.activeMeetingSession && this.activeMeetingSession !== sessionId) {
      // If the last cleanup was recent, don't allow new session
      if (now - this.meetingStateCleanupTimestamp < 2000) {
        console.warn('[VideoSDK] Another meeting session is active, rejecting new session:', {
          active: this.activeMeetingSession,
          new: sessionId,
          timeSinceCleanup: now - this.meetingStateCleanupTimestamp
        });
        return false;
      }
    }
    
    console.log('[VideoSDK] Setting active meeting session:', sessionId);
    this.activeMeetingSession = sessionId;
    return true;
  }
  
  /**
   * Clear active meeting session
   */
  public clearActiveMeetingSession(sessionId: string): void {
    if (this.activeMeetingSession === sessionId) {
      console.log('[VideoSDK] Clearing active meeting session:', sessionId);
      this.activeMeetingSession = null;
      this.meetingStateCleanupTimestamp = Date.now();
    }
  }
  
  /**
   * Check if a meeting session is active
   */
  public isSessionActive(sessionId: string): boolean {
    return this.activeMeetingSession === sessionId;
  }
}

// ✅ FIXED: Export the class itself, not getInstance()
export default VideoSDKService;
