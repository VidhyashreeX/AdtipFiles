import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import Logger from '../../utils/LogUtils';

/**
 * CallStatePersistenceService - Handles call state persistence for offline recovery
 * 
 * This service solves the critical issue where the app is killed during incoming calls
 * and users miss calls because the call state isn't properly persisted and restored.
 * 
 * Key Features:
 * - Persists call state to AsyncStorage during incoming calls
 * - Restores call state when app resumes from killed state
 * - Handles cleanup of stale/expired call data
 * - Provides recovery mechanisms for interrupted calls
 */

interface CallStateData {
  sessionId: string;
  callerName: string;
  callType: 'voice' | 'video';
  meetingId: string;
  token: string;
  timestamp: number;
  expiresAt: number;
  callerId?: string;
  receiverId?: string;
  channelName?: string;
  status: 'incoming' | 'active' | 'ended' | 'missed';
  fcmMessageId?: string;
  appState: 'background' | 'killed' | 'foreground';
  fromKilledState?: boolean; // flag to indicate if call was initiated from killed state
}

interface CallRecoveryOptions {
  maxCallAge?: number; // Maximum age in milliseconds before call is considered expired
  retryAttempts?: number;
  showMissedCallUI?: boolean;
}

class CallStatePersistenceService {
  private static instance: CallStatePersistenceService;
  private readonly CALL_STATE_KEY = '@adtip/call_state';
  private readonly MISSED_CALLS_KEY = '@adtip/missed_calls';
  private readonly DEFAULT_CALL_TIMEOUT = 60000; // 60 seconds
  private readonly MAX_MISSED_CALLS = 50;

  private appStateSubscription: any = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): CallStatePersistenceService {
    if (!CallStatePersistenceService.instance) {
      CallStatePersistenceService.instance = new CallStatePersistenceService();
    }
    return CallStatePersistenceService.instance;
  }

  /**
   * Initialize the service with app state monitoring
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    Logger.info('[CallStatePersistence] Initializing call state persistence service...');

    // Set up app state monitoring
    this.setupAppStateMonitoring();

    // Clean up any expired call states on startup
    await this.cleanupExpiredCalls();

    this.isInitialized = true;
    Logger.info('[CallStatePersistence] Service initialized successfully');
  }

  /**
   * Save call state during incoming call processing
   */
  public async saveCallState(callData: Partial<CallStateData>): Promise<boolean> {
    try {
      const now = Date.now();
      const callTimeout = callData.callType === 'video' ? 90000 : this.DEFAULT_CALL_TIMEOUT;
      
      const fullCallData: CallStateData = {
        sessionId: callData.sessionId || `call-${now}`,
        callerName: callData.callerName || 'Unknown Caller',
        callType: callData.callType || 'voice',
        meetingId: callData.meetingId || `meeting-${now}`,
        token: callData.token || `token-${now}`,
        timestamp: now,
        expiresAt: now + callTimeout,
        status: 'incoming',
        appState: AppState.currentState === 'active' ? 'foreground' : 'background',
        ...callData
      };

      await AsyncStorage.setItem(this.CALL_STATE_KEY, JSON.stringify(fullCallData));
      
      Logger.info('[CallStatePersistence] Call state saved successfully:', {
        sessionId: fullCallData.sessionId,
        callerName: fullCallData.callerName,
        callType: fullCallData.callType,
        expiresAt: new Date(fullCallData.expiresAt).toISOString()
      });

      return true;
    } catch (error) {
      Logger.error('[CallStatePersistence] Failed to save call state:', error);
      return false;
    }
  }

  /**
   * Retrieve current persisted call state
   */
  public async getCallState(): Promise<CallStateData | null> {
    try {
      const callStateStr = await AsyncStorage.getItem(this.CALL_STATE_KEY);
      if (!callStateStr) {
        return null;
      }

      const callState = JSON.parse(callStateStr) as CallStateData;
      
      // Check if call has expired
      if (Date.now() > callState.expiresAt) {
        Logger.info('[CallStatePersistence] Call state expired, moving to missed calls');
        await this.moveToMissedCalls(callState);
        await this.clearCallState();
        return null;
      }

      return callState;
    } catch (error) {
      Logger.error('[CallStatePersistence] Failed to retrieve call state:', error);
      return null;
    }
  }

  /**
   * Update call state status
   */
  public async updateCallStatus(status: CallStateData['status'], additionalData?: Partial<CallStateData>): Promise<boolean> {
    try {
      const currentState = await this.getCallState();
      if (!currentState) {
        Logger.warn('[CallStatePersistence] No call state found to update');
        return false;
      }

      const updatedState: CallStateData = {
        ...currentState,
        status,
        ...additionalData,
        timestamp: Date.now() // Update timestamp
      };

      await AsyncStorage.setItem(this.CALL_STATE_KEY, JSON.stringify(updatedState));
      
      Logger.info('[CallStatePersistence] Call status updated:', {
        sessionId: updatedState.sessionId,
        status: status
      });

      // Clear state if call ended
      if (status === 'ended') {
        await this.clearCallState();
      }

      return true;
    } catch (error) {
      Logger.error('[CallStatePersistence] Failed to update call status:', error);
      return false;
    }
  }

  /**
   * Clear current call state
   */
  public async clearCallState(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.CALL_STATE_KEY);
      Logger.info('[CallStatePersistence] Call state cleared');
    } catch (error) {
      Logger.error('[CallStatePersistence] Failed to clear call state:', error);
    }
  }

  /**
   * Check for call state recovery on app startup/foreground
   */
  public async checkForCallRecovery(options: CallRecoveryOptions = {}): Promise<CallStateData | null> {
    try {
      Logger.info('[CallStatePersistence] Checking for call recovery...');
      
      const callState = await this.getCallState();
      if (!callState) {
        Logger.info('[CallStatePersistence] No call state found for recovery');
        return null;
      }

      const {
        maxCallAge = this.DEFAULT_CALL_TIMEOUT,
        retryAttempts = 3,
        showMissedCallUI = true
      } = options;

      const callAge = Date.now() - callState.timestamp;
      
      // Check if call is too old
      if (callAge > maxCallAge) {
        Logger.info('[CallStatePersistence] Call too old for recovery, marking as missed');
        await this.moveToMissedCalls(callState);
        await this.clearCallState();
        return null;
      }

      // Check if call is still active (within expiration window)
      if (Date.now() < callState.expiresAt && callState.status === 'incoming') {
        Logger.info('[CallStatePersistence] Active call found for recovery:', {
          sessionId: callState.sessionId,
          callerName: callState.callerName,
          ageSeconds: Math.floor(callAge / 1000)
        });

        // Update app state to indicate recovery
        await this.updateCallStatus('incoming', { appState: 'foreground' });
        
        return callState;
      }

      // Call expired but within recent window - show missed call
      if (showMissedCallUI && callAge < (maxCallAge * 2)) {
        Logger.info('[CallStatePersistence] Recent expired call found, showing missed call UI');
        await this.moveToMissedCalls(callState);
        await this.clearCallState();
        
        // Return call data for missed call UI
        return { ...callState, status: 'missed' };
      }

      // Call too old, clean up
      await this.clearCallState();
      return null;

    } catch (error) {
      Logger.error('[CallStatePersistence] Error during call recovery check:', error);
      return null;
    }
  }

  /**
   * Move call to missed calls list
   */
  private async moveToMissedCalls(callState: CallStateData): Promise<void> {
    try {
      const missedCallsStr = await AsyncStorage.getItem(this.MISSED_CALLS_KEY);
      let missedCalls: CallStateData[] = [];
      
      if (missedCallsStr) {
        missedCalls = JSON.parse(missedCallsStr);
      }

      // Add to missed calls
      const missedCall: CallStateData = {
        ...callState,
        status: 'missed',
        timestamp: Date.now()
      };

      missedCalls.unshift(missedCall);

      // Keep only recent missed calls
      if (missedCalls.length > this.MAX_MISSED_CALLS) {
        missedCalls = missedCalls.slice(0, this.MAX_MISSED_CALLS);
      }

      await AsyncStorage.setItem(this.MISSED_CALLS_KEY, JSON.stringify(missedCalls));
      
      Logger.info('[CallStatePersistence] Call moved to missed calls:', {
        sessionId: callState.sessionId,
        totalMissedCalls: missedCalls.length
      });

    } catch (error) {
      Logger.error('[CallStatePersistence] Failed to move call to missed calls:', error);
    }
  }

  /**
   * Get missed calls list
   */
  public async getMissedCalls(): Promise<CallStateData[]> {
    try {
      const missedCallsStr = await AsyncStorage.getItem(this.MISSED_CALLS_KEY);
      if (!missedCallsStr) {
        return [];
      }

      return JSON.parse(missedCallsStr);
    } catch (error) {
      Logger.error('[CallStatePersistence] Failed to retrieve missed calls:', error);
      return [];
    }
  }

  /**
   * Clear missed calls list
   */
  public async clearMissedCalls(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.MISSED_CALLS_KEY);
      Logger.info('[CallStatePersistence] Missed calls cleared');
    } catch (error) {
      Logger.error('[CallStatePersistence] Failed to clear missed calls:', error);
    }
  }

  /**
   * Setup app state monitoring to handle app lifecycle changes
   */
  private setupAppStateMonitoring(): void {
    this.appStateSubscription = AppState.addEventListener('change', async (nextAppState) => {
      Logger.info('[CallStatePersistence] App state changed:', nextAppState);

      if (nextAppState === 'active') {
        // App became active - check for call recovery
        setTimeout(async () => {
          await this.checkForCallRecovery({
            showMissedCallUI: true,
            maxCallAge: 120000 // 2 minutes
          });
        }, 1000); // Delay to allow app initialization
      } else if (nextAppState === 'background') {
        // App going to background - update any active call state
        const callState = await this.getCallState();
        if (callState && callState.status === 'incoming') {
          await this.updateCallStatus('incoming', { appState: 'background' });
        }
      }
    });
  }

  /**
   * Clean up expired call states
   */
  private async cleanupExpiredCalls(): Promise<void> {
    try {
      const callState = await this.getCallState();
      if (callState && Date.now() > callState.expiresAt) {
        Logger.info('[CallStatePersistence] Cleaning up expired call state');
        await this.moveToMissedCalls(callState);
        await this.clearCallState();
      }
    } catch (error) {
      Logger.error('[CallStatePersistence] Error during cleanup:', error);
    }
  }

  /**
   * Cleanup resources when service is destroyed
   */
  public cleanup(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    this.isInitialized = false;
    Logger.info('[CallStatePersistence] Service cleaned up');
  }

  /**
   * Get service status for debugging
   */
  public getStatus(): {
    initialized: boolean;
    hasActiveCall: boolean;
    appStateMonitored: boolean;
  } {
    return {
      initialized: this.isInitialized,
      hasActiveCall: false, // Will be updated in real-time checks
      appStateMonitored: this.appStateSubscription !== null
    };
  }
}

export default CallStatePersistenceService;
export type { CallStateData, CallRecoveryOptions };