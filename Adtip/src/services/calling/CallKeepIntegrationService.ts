/**
 * CallKeep Integration Service - Self-Managed Mode
 * 
 * This service integrates CallKeep with the existing UnifiedCallService
 * to provide native-like call UI without registering as a SIM option.
 */

import CallKeep from 'react-native-callkeep';
import { Platform } from 'react-native';
import UnifiedCallService from './UnifiedCallService';

export interface CallKeepConfig {
  ios: {
    appName: string;
    supportsVideo: boolean;
    maximumCallGroups: string;
    maximumCallsPerCallGroup: string;
    supportsDTMF: boolean;
    supportsHolding: boolean;
    supportsGrouping: boolean;
    supportsUngrouping: boolean;
    supportsSettingUptime: boolean;
    supportsAddCall: boolean;
  };
  android: {
    alertTitle: string;
    alertDescription: string;
    cancelButton: string;
    okButton: string;
    additionalPermissions: string[];
    // Self-managed mode configuration
    selfManaged: boolean;
    foregroundService: {
      channelId: string;
      channelName: string;
      notificationTitle: string;
      notificationIcon: string;
    };
  };
}

class CallKeepIntegrationService {
  private static instance: CallKeepIntegrationService;
  private isInitialized = false;
  private currentCallUUID: string | null = null;

  private constructor() {}

  public static getInstance(): CallKeepIntegrationService {
    if (!CallKeepIntegrationService.instance) {
      CallKeepIntegrationService.instance = new CallKeepIntegrationService();
    }
    return CallKeepIntegrationService.instance;
  }

  /**
   * Initialize CallKeep with self-managed configuration
   */
  public async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) {
        console.log('[CallKeepIntegration] Already initialized');
        return true;
      }

      console.log('[CallKeepIntegration] Initializing CallKeep with self-managed mode...');

      const options: CallKeepConfig = {
        ios: {
          appName: 'Adtip',
          supportsVideo: true,
          maximumCallGroups: '1',
          maximumCallsPerCallGroup: '1',
          supportsDTMF: true,
          supportsHolding: true,
          supportsGrouping: false,
          supportsUngrouping: false,
          supportsSettingUptime: false,
          supportsAddCall: false,
        },
        android: {
          alertTitle: 'Permissions required',
          alertDescription: 'This application needs to access your phone accounts',
          cancelButton: 'Don\'t allow',
          okButton: 'Allow',
          additionalPermissions: [],
          // ✅ SELF-MANAGED MODE - No SIM registration
          selfManaged: true,
          foregroundService: {
            channelId: 'com.adtip.callkeep',
            channelName: 'CallKeep Service',
            notificationTitle: 'Adtip Call',
            notificationIcon: 'ic_call',
          },
        },
      };

      // Setup CallKeep
      await CallKeep.setup(options);
      
      // Register event listeners
      this.setupEventListeners();
      
      // Register phone account (self-managed)
      await CallKeep.registerPhoneAccount(options);
      
      this.isInitialized = true;
      console.log('[CallKeepIntegration] ✅ CallKeep initialized successfully in self-managed mode');
      return true;

    } catch (error) {
      console.error('[CallKeepIntegration] ❌ Failed to initialize CallKeep:', error);
      return false;
    }
  }

  /**
   * Setup CallKeep event listeners
   */
  private setupEventListeners(): void {
    // Incoming call answered
    CallKeep.addEventListener('answerCall', async ({ callUUID }) => {
      console.log('[CallKeepIntegration] Call answered:', callUUID);
      try {
        const unifiedCallService = UnifiedCallService.getInstance();
        await unifiedCallService.acceptCall(callUUID);
      } catch (error) {
        console.error('[CallKeepIntegration] Error accepting call:', error);
      }
    });

    // Call ended
    CallKeep.addEventListener('endCall', async ({ callUUID }) => {
      console.log('[CallKeepIntegration] Call ended:', callUUID);
      try {
        const unifiedCallService = UnifiedCallService.getInstance();
        await unifiedCallService.endCall(callUUID);
      } catch (error) {
        console.error('[CallKeepIntegration] Error ending call:', error);
      }
    });

    // Call audio route changed
    CallKeep.addEventListener('didChangeAudioRoute', async ({ callUUID, output }) => {
      console.log('[CallKeepIntegration] Audio route changed:', callUUID, output);
      try {
        const unifiedCallService = UnifiedCallService.getInstance();
        if (output === 'Speaker') {
          await unifiedCallService.toggleSpeaker();
        }
      } catch (error) {
        console.error('[CallKeepIntegration] Error changing audio route:', error);
      }
    });

    console.log('[CallKeepIntegration] Event listeners setup complete');
  }

  /**
   * Display incoming call in native UI
   */
  public async displayIncomingCall(
    callUUID: string,
    callerName: string,
    hasVideo: boolean = false,
    handle?: string
  ): Promise<void> {
    try {
      if (!this.isInitialized) {
        console.warn('[CallKeepIntegration] CallKeep not initialized');
        return;
      }

      console.log('[CallKeepIntegration] Displaying incoming call:', {
        callUUID,
        callerName,
        hasVideo,
        handle
      });

      this.currentCallUUID = callUUID;

      // Display incoming call in native UI
      await CallKeep.displayIncomingCall(callUUID, handle || callerName, callerName, 'generic', hasVideo);

      console.log('[CallKeepIntegration] ✅ Incoming call displayed successfully');

    } catch (error) {
      console.error('[CallKeepIntegration] ❌ Failed to display incoming call:', error);
    }
  }

  /**
   * Start outgoing call in native UI
   */
  public async startOutgoingCall(
    callUUID: string,
    recipientName: string,
    hasVideo: boolean = false,
    handle?: string
  ): Promise<void> {
    try {
      if (!this.isInitialized) {
        console.warn('[CallKeepIntegration] CallKeep not initialized');
        return;
      }

      console.log('[CallKeepIntegration] Starting outgoing call:', {
        callUUID,
        recipientName,
        hasVideo,
        handle
      });

      this.currentCallUUID = callUUID;

      // Start outgoing call in native UI
      await CallKeep.startCall(callUUID, handle || recipientName, recipientName, 'generic', hasVideo);

      console.log('[CallKeepIntegration] ✅ Outgoing call started successfully');

    } catch (error) {
      console.error('[CallKeepIntegration] ❌ Failed to start outgoing call:', error);
    }
  }

  /**
   * End current call
   */
  public async endCall(callUUID?: string): Promise<void> {
    try {
      const uuid = callUUID || this.currentCallUUID;
      if (!uuid) {
        console.warn('[CallKeepIntegration] No call UUID to end');
        return;
      }

      console.log('[CallKeepIntegration] Ending call:', uuid);
      await CallKeep.endCall(uuid);
      
      if (uuid === this.currentCallUUID) {
        this.currentCallUUID = null;
      }

      console.log('[CallKeepIntegration] ✅ Call ended successfully');

    } catch (error) {
      console.error('[CallKeepIntegration] ❌ Failed to end call:', error);
    }
  }

  /**
   * Set call as active
   */
  public async setCallActive(callUUID: string): Promise<void> {
    try {
      if (!this.isInitialized) {
        console.warn('[CallKeepIntegration] CallKeep not initialized');
        return;
      }

      console.log('[CallKeepIntegration] Setting call as active:', callUUID);
      await CallKeep.setCurrentCallActive(callUUID);

    } catch (error) {
      console.error('[CallKeepIntegration] ❌ Failed to set call active:', error);
    }
  }

  /**
   * Update call display
   */
  public async updateCallDisplay(
    callUUID: string,
    displayName: string,
    handle?: string
  ): Promise<void> {
    try {
      if (!this.isInitialized) {
        console.warn('[CallKeepIntegration] CallKeep not initialized');
        return;
      }

      console.log('[CallKeepIntegration] Updating call display:', {
        callUUID,
        displayName,
        handle
      });

      await CallKeep.updateDisplay(callUUID, displayName, handle || displayName);

    } catch (error) {
      console.error('[CallKeepIntegration] ❌ Failed to update call display:', error);
    }
  }

  /**
   * Check if CallKeep is available
   */
  public async isAvailable(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        return await CallKeep.isConnectionServiceAvailable();
      }
      return true; // iOS always available
    } catch (error) {
      console.error('[CallKeepIntegration] Error checking availability:', error);
      return false;
    }
  }

  /**
   * Check if phone account is enabled
   */
  public async isPhoneAccountEnabled(): Promise<boolean> {
    try {
      return await CallKeep.hasPhoneAccount();
    } catch (error) {
      console.error('[CallKeepIntegration] Error checking phone account:', error);
      return false;
    }
  }

  /**
   * Get current call UUID
   */
  public getCurrentCallUUID(): string | null {
    return this.currentCallUUID;
  }

  /**
   * Check if initialized
   */
  public getIsInitialized(): boolean {
    return this.isInitialized;
  }
}

export default CallKeepIntegrationService; 