import { NativeModules, Platform, NativeEventEmitter } from 'react-native';
import notifee, { AndroidImportance, AndroidStyle, AndroidCategory, AndroidVisibility } from '@notifee/react-native';
import PermissionsService from './PermissionsService';

const { OngoingCall } = NativeModules;

// Track permission status to avoid repeated requests
let phoneCallPermissionGranted: boolean | null = null;

// Enhanced state tracking for bulletproof notifications
interface CallNotificationState {
  isActive: boolean;
  callId: string | null;
  startTime: number | null;
  callType: 'voice' | 'video';
  participantName: string;
  notificationId: string | null;
}

// Global state for notification management
let currentCallState: CallNotificationState = {
  isActive: false,
  callId: null,
  startTime: null,
  callType: 'voice',
  participantName: '',
  notificationId: null,
};

let notificationUpdateTimer: NodeJS.Timeout | null = null;

const LINKING_ERROR =
  `The package 'OngoingCallModule' doesn't seem to be linked. Make sure:
\n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo managed workflow\n';

const OngoingCallNative = NativeModules.OngoingCallModule || {};
const eventEmitter = new NativeEventEmitter(OngoingCallNative);

/**
 * BULLETPROOF OngoingCallModule with dual notification system
 * Uses both native foreground service and Notifee for maximum reliability
 */
const OngoingCallModule = {
  /**
   * Enhanced notification channel creation
   */
  async createNotificationChannel(): Promise<void> {
    if (Platform.OS !== 'android') return;
    
    try {
      await notifee.createChannel({
        id: 'ongoing_calls',
        name: 'Ongoing Calls',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
        description: 'Notifications for active voice and video calls',
      });
      
      console.log('[OngoingCallModule] Notifee channel created successfully');
    } catch (error) {
      console.error('[OngoingCallModule] Failed to create notifee channel:', error);
    }
  },

  /**
   * Start ongoing call notification with bulletproof dual system
   */
  async startOngoingCallNotification(title: string, message: string, options?: {
    callId?: string;
    callType?: 'voice' | 'video';
    participantName?: string;
  }) {
    try {
      // Update global state
      currentCallState = {
        isActive: true,
        callId: options?.callId || `call_${Date.now()}`,
        startTime: Date.now(),
        callType: options?.callType || 'voice',
        participantName: options?.participantName || 'Participant',
        notificationId: `ongoing_call_${Date.now()}`,
      };

      // Method 1: Native foreground service (primary for Android)
      if (Platform.OS === 'android' && Platform.Version >= 34 && phoneCallPermissionGranted === null) {
        console.log('[OngoingCallModule] First time checking FOREGROUND_SERVICE_PHONE_CALL permission');
        phoneCallPermissionGranted = await PermissionsService.requestPhoneCallForegroundServicePermission();
        
        if (!phoneCallPermissionGranted) {
          console.warn('[OngoingCallModule] FOREGROUND_SERVICE_PHONE_CALL permission denied. Using fallback notification.');
        }
      }
      
      if (Platform.OS === 'android' && OngoingCallNative.startOngoingCallNotification) {
        console.log('[OngoingCallModule] Starting native ongoing call notification');
        OngoingCallNative.startOngoingCallNotification(title, message);
      }

      // Method 2: Notifee notification (fallback and iOS)
      await this.createNotificationChannel();
      await this.showNotifeeOngoingNotification(title, message);

      // Start auto-update timer for duration
      this.startNotificationAutoUpdate();
      
    } catch (error) {
      console.error('[OngoingCallModule] Error starting ongoing call notification:', error);
      // Fallback to basic notification
      await this.showBasicNotification(title, message);
    }
  },

  /**
   * Show Notifee ongoing notification
   */
  async showNotifeeOngoingNotification(title: string, message: string): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      const notificationId = currentCallState.notificationId || 'ongoing_call_fallback';
      
      await notifee.displayNotification({
        id: notificationId,
        title,
        body: message,
        android: {
          channelId: 'ongoing_calls',
          ongoing: true,
          autoCancel: false,
          category: AndroidCategory.CALL,
          visibility: AndroidVisibility.PUBLIC,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'open_call',
            launchActivity: 'default',
          },
          style: {
            type: AndroidStyle.BIGTEXT,
            text: message,
          },
          actions: [
            {
              title: 'Mute',
              pressAction: { id: 'toggle_mute' },
            },
            {
              title: 'End Call',
              pressAction: { id: 'end_call' },
            },
            {
              title: 'Open',
              pressAction: { id: 'open_call' },
            },
          ],
          color: currentCallState.callType === 'video' ? '#007AFF' : '#34C759',
          smallIcon: 'ic_call',
        },
      });

      console.log('[OngoingCallModule] Notifee ongoing notification shown');
    } catch (error) {
      console.error('[OngoingCallModule] Failed to show Notifee notification:', error);
    }
  },
  
  /**
   * Update ongoing call notification with enhanced state sync
   */
  updateOngoingCallNotification(message: string) {
    try {
      // Update native notification
      if (Platform.OS === 'android' && OngoingCallNative.updateOngoingCallNotification) {
        console.log('[OngoingCallModule] Updating native ongoing call notification');
        OngoingCallNative.updateOngoingCallNotification(message);
      }

      // Update Notifee notification
      if (currentCallState.isActive) {
        this.updateNotifeeNotification(message);
      }
    } catch (error) {
      console.error('[OngoingCallModule] Error updating ongoing call notification:', error);
    }
  },

  /**
   * Update Notifee notification
   */
  async updateNotifeeNotification(message: string): Promise<void> {
    if (Platform.OS !== 'android' || !currentCallState.isActive) return;

    try {
      const duration = this.formatDuration(Date.now() - (currentCallState.startTime || Date.now()));
      const enhancedMessage = `${message} - ${duration}`;
      
      await this.showNotifeeOngoingNotification(
        `${currentCallState.callType === 'voice' ? 'Voice' : 'Video'} Call`,
        enhancedMessage
      );
    } catch (error) {
      console.error('[OngoingCallModule] Error updating Notifee notification:', error);
    }
  },

  /**
   * Stop ongoing call notification with complete cleanup
   */
  async stopOngoingCallNotification() {
    try {
      // Stop native notification
      if (Platform.OS === 'android' && OngoingCallNative.stopOngoingCallNotification) {
        console.log('[OngoingCallModule] Stopping native ongoing call notification');
        OngoingCallNative.stopOngoingCallNotification();
      }

      // Stop Notifee notification
      if (currentCallState.notificationId) {
        await notifee.cancelNotification(currentCallState.notificationId);
      }
      
      // Also cancel fallback notification
      await notifee.cancelNotification('ongoing_call_fallback');

      // Stop auto-update timer
      if (notificationUpdateTimer) {
        clearInterval(notificationUpdateTimer);
        notificationUpdateTimer = null;
      }

      // Reset state
      currentCallState = {
        isActive: false,
        callId: null,
        startTime: null,
        callType: 'voice',
        participantName: '',
        notificationId: null,
      };

      console.log('[OngoingCallModule] All ongoing call notifications stopped');
    } catch (error) {
      console.error('[OngoingCallModule] Error stopping ongoing call notification:', error);
    }
  },

  /**
   * Start auto-update timer for call duration
   */
  startNotificationAutoUpdate(): void {
    if (notificationUpdateTimer) {
      clearInterval(notificationUpdateTimer);
    }

    notificationUpdateTimer = setInterval(() => {
      if (currentCallState.isActive && currentCallState.startTime) {
        const duration = this.formatDuration(Date.now() - currentCallState.startTime);
        const message = `Call with ${currentCallState.participantName}`;
        this.updateOngoingCallNotification(message);
      }
    }, 5000); // Update every 5 seconds
  },

  /**
   * Format duration in MM:SS format
   */
  formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  /**
   * Show basic fallback notification
   */
  async showBasicNotification(title: string, message: string): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      await notifee.displayNotification({
        id: 'basic_ongoing_call',
        title,
        body: message,
        android: {
          channelId: 'ongoing_calls',
          ongoing: true,
          autoCancel: false,
          smallIcon: 'ic_call',
          pressAction: {
            id: 'open_call',
            launchActivity: 'default',
          },
        },
      });
    } catch (error) {
      console.error('[OngoingCallModule] Even basic notification failed:', error);
    }
  },

  // Reset permission status (useful for testing or after permission changes)
  resetPermissionStatus() {
    phoneCallPermissionGranted = null;
  },

  /**
   * Get current call state
   */
  getCurrentCallState(): CallNotificationState {
    return { ...currentCallState };
  },

  /**
   * Listen for mute toggled events from native notification
   */
  onMuteToggled(callback: (isMuted: boolean) => void): () => void {
    const subscription = eventEmitter.addListener('MuteToggled', callback);
    return () => subscription.remove();
  },

  /**
   * Initialize the module
   */
  async initialize(): Promise<void> {
    try {
      await this.createNotificationChannel();
      console.log('[OngoingCallModule] Module initialized successfully');
    } catch (error) {
      console.error('[OngoingCallModule] Initialization failed:', error);
    }
  },

  /**
   * Cleanup all resources
   */
  cleanup(): void {
    if (notificationUpdateTimer) {
      clearInterval(notificationUpdateTimer);
      notificationUpdateTimer = null;
    }

    currentCallState = {
      isActive: false,
      callId: null,
      startTime: null,
      callType: 'voice',
      participantName: '',
      notificationId: null,
    };

    console.log('[OngoingCallModule] Cleanup completed');
  },
};

export default OngoingCallModule;