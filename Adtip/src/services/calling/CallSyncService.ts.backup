// src/services/calling/CallSyncService.ts
import { AppRegistry, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appEventEmitter } from '../../events/AppEventEmitter';
import CallService from '../CallService';
import WhatsAppCallManager from './WhatsAppCallManager';

/**
 * Background call synchronization service
 * Ensures call state is synchronized between notifications and app UI
 * even when app is backgrounded or partially killed
 */
class CallSyncService {
  private static instance: CallSyncService;
  private syncInterval: NodeJS.Timeout | null = null;
  private isBackgroundSyncing = false;
  private readonly SYNC_INTERVAL = 2000; // 2 seconds
  private readonly SYNC_STATE_KEY = 'CALL_SYNC_STATE';
  private lastSyncedCallId: string | null = null;
  private syncDebounceTimer: NodeJS.Timeout | null = null;
  private isSyncing = false; // Prevent circular events

  private constructor() {}

  public static getInstance(): CallSyncService {
    if (!CallSyncService.instance) {
      CallSyncService.instance = new CallSyncService();
    }
    return CallSyncService.instance;
  }

  /**
   * Initialize the sync service
   */
  public async initialize(): Promise<void> {
    try {
      console.log('[CallSyncService] Initializing background sync service');
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Start background sync
      this.startBackgroundSync();
      
      console.log('[CallSyncService] ✅ Background sync service initialized');
    } catch (error) {
      console.error('[CallSyncService] ❌ Failed to initialize:', error);
    }
  }

  /**
   * Setup event listeners for call state changes
   */
  private setupEventListeners(): void {
    // Listen for call state changes from any source
    appEventEmitter.on('callStateChanged', this.handleCallStateChange.bind(this));
    appEventEmitter.on('callEnded', this.handleCallEnded.bind(this));
    appEventEmitter.on('callAccepted', this.handleCallAccepted.bind(this));
    appEventEmitter.on('callDeclined', this.handleCallDeclined.bind(this));
    
    console.log('[CallSyncService] Event listeners setup complete');
  }
  /**
   * Handle call state changes
   */
  private async handleCallStateChange(callData: any): Promise<void> {
    try {
      // Prevent circular events
      if (this.isSyncing) {
        console.log('[CallSyncService] Skipping sync - already in progress');
        return;
      }

      // Debounce rapid-fire events
      if (this.syncDebounceTimer) {
        clearTimeout(this.syncDebounceTimer);
      }

      this.syncDebounceTimer = setTimeout(async () => {
        // Check if this is a duplicate event for the same call
        if (callData.callId && callData.callId === this.lastSyncedCallId) {
          console.log('[CallSyncService] Skipping duplicate sync for call:', callData.callId);
          return;
        }

        console.log('[CallSyncService] Syncing call state change:', callData.status);
        this.lastSyncedCallId = callData.callId;
        await this.saveSyncState(callData);
        
        // Only perform limited synchronization to prevent loops
        // Do NOT call updateCallStatus which would trigger more events
        
      }, 200); // 200ms debounce
    } catch (error) {
      console.error('[CallSyncService] Error handling call state change:', error);
    }
  }
  /**
   * Handle call ended events
   */
  private async handleCallEnded(callData: any): Promise<void> {
    try {
      console.log('[CallSyncService] Syncing call ended:', callData.callId);
      
      // Set syncing flag to prevent circular events
      this.isSyncing = true;
      
      // Ensure both WhatsApp Call Manager and Call Service are synchronized
      const whatsAppCallManager = WhatsAppCallManager.getInstance();
      const currentCall = whatsAppCallManager.getCurrentCall();
      
      if (currentCall && currentCall.callId === callData.callId) {
        // If WhatsApp Call Manager still has the call, end it
        await whatsAppCallManager.endCall(callData.callId);
      }
      
      // Ensure Call Service is also synchronized
      if (CallService.activeCall && CallService.activeCall.callId === callData.callId) {
        await CallService.endCall('Synchronized end from notification');
      }
      
      // Clear sync state
      await this.clearSyncState();
      this.lastSyncedCallId = null;
      
    } catch (error) {
      console.error('[CallSyncService] Error handling call ended:', error);
    } finally {
      // Always reset syncing flag
      this.isSyncing = false;
    }
  }

  /**
   * Handle call accepted events
   */
  private async handleCallAccepted(callData: any): Promise<void> {
    try {
      console.log('[CallSyncService] Syncing call accepted:', callData.callId);
      await this.saveSyncState(callData);
      await this.synchronizeCallState(callData);
    } catch (error) {
      console.error('[CallSyncService] Error handling call accepted:', error);
    }
  }

  /**
   * Handle call declined events
   */
  private async handleCallDeclined(callData: any): Promise<void> {
    try {
      console.log('[CallSyncService] Syncing call declined:', callData.callId);
      await this.synchronizeCallState(callData);
      await this.clearSyncState();
    } catch (error) {
      console.error('[CallSyncService] Error handling call declined:', error);
    }
  }

  /**
   * Start background sync process
   */
  private startBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      if (!this.isBackgroundSyncing) {
        this.isBackgroundSyncing = true;
        try {
          await this.performBackgroundSync();
        } catch (error) {
          console.error('[CallSyncService] Background sync error:', error);
        } finally {
          this.isBackgroundSyncing = false;
        }
      }
    }, this.SYNC_INTERVAL);

    console.log('[CallSyncService] Background sync started');
  }

  /**
   * Perform background synchronization
   */
  private async performBackgroundSync(): Promise<void> {
    try {
      const whatsAppCallManager = WhatsAppCallManager.getInstance();
      const whatsAppCall = whatsAppCallManager.getCurrentCall();
      const callServiceCall = CallService.activeCall;
      const syncState = await this.getSyncState();

      // Check for state mismatches and synchronize
      if (whatsAppCall && !callServiceCall) {
        // WhatsApp Call Manager has a call but Call Service doesn't
        console.log('[CallSyncService] Syncing: WhatsApp has call, Call Service doesn\'t');
        await this.syncCallServiceFromWhatsApp(whatsAppCall);
      } else if (!whatsAppCall && callServiceCall) {
        // Call Service has a call but WhatsApp Call Manager doesn't
        console.log('[CallSyncService] Syncing: Call Service has call, WhatsApp doesn\'t');
        await this.syncWhatsAppFromCallService(callServiceCall);
      } else if (whatsAppCall && callServiceCall) {
        // Both have calls - ensure they're the same
        if (whatsAppCall.callId !== callServiceCall.callId) {
          console.log('[CallSyncService] Syncing: Call ID mismatch, synchronizing');
          await this.resolveCallIdMismatch(whatsAppCall, callServiceCall);
        }
      }

      // Check for orphaned sync state
      if (syncState && !whatsAppCall && !callServiceCall) {
        console.log('[CallSyncService] Cleaning up orphaned sync state');
        await this.clearSyncState();
      }

    } catch (error) {
      console.error('[CallSyncService] Background sync error:', error);
    }
  }
  /**
   * Synchronize call state between components (SIMPLIFIED to prevent loops)
   */
  private async synchronizeCallState(callData: any): Promise<void> {
    try {
      // Only update local state without triggering events
      // This prevents infinite event loops
      
      const whatsAppCallManager = WhatsAppCallManager.getInstance();
      const currentCall = whatsAppCallManager.getCurrentCall();
      
      if (currentCall && currentCall.callId === callData.callId) {
        // Update WhatsApp Call Manager state DIRECTLY without triggering events
        currentCall.status = callData.status;
        // DO NOT call updateCallStatus which would emit more events
      }
      
      // Update Call Service state if needed
      if (CallService.activeCall && CallService.activeCall.callId === callData.callId) {
        CallService.activeCall.status = callData.status;
      }
      
    } catch (error) {
      console.error('[CallSyncService] Error synchronizing call state:', error);
    }
  }

  /**
   * Sync Call Service from WhatsApp Call Manager
   */
  private async syncCallServiceFromWhatsApp(whatsAppCall: any): Promise<void> {
    try {
      // Convert WhatsApp call to Call Service format
      const callServiceCall = {
        callId: whatsAppCall.callId,
        meetingId: whatsAppCall.meetingId,
        token: whatsAppCall.token,
        callType: whatsAppCall.callType,
        callerName: whatsAppCall.callerName,
        recipientName: whatsAppCall.recipientName,
        callerId: whatsAppCall.callerId,
        recipientId: whatsAppCall.recipientId,
        isInitiator: whatsAppCall.isInitiator,
        status: whatsAppCall.status,
        timestamp: whatsAppCall.startTime,
      };
      
      CallService.activeCall = callServiceCall;
      console.log('[CallSyncService] Call Service synchronized from WhatsApp');
    } catch (error) {
      console.error('[CallSyncService] Error syncing Call Service from WhatsApp:', error);
    }
  }

  /**
   * Sync WhatsApp Call Manager from Call Service
   */
  private async syncWhatsAppFromCallService(callServiceCall: any): Promise<void> {
    try {
      // This is more complex as WhatsApp Call Manager manages its own state
      // We should emit an event to let it know about the call
      appEventEmitter.emit('callStateChanged', {
        callId: callServiceCall.callId,
        status: callServiceCall.status,
        ...callServiceCall
      });
      
      console.log('[CallSyncService] WhatsApp Call Manager notified of Call Service state');
    } catch (error) {
      console.error('[CallSyncService] Error syncing WhatsApp from Call Service:', error);
    }
  }

  /**
   * Resolve call ID mismatch between services
   */
  private async resolveCallIdMismatch(whatsAppCall: any, callServiceCall: any): Promise<void> {
    try {
      // Prefer the more recent call
      const whatsAppTime = whatsAppCall.startTime || 0;
      const callServiceTime = callServiceCall.timestamp || 0;
      
      if (whatsAppTime > callServiceTime) {
        // WhatsApp call is more recent
        await this.syncCallServiceFromWhatsApp(whatsAppCall);
      } else {
        // Call Service call is more recent
        await this.syncWhatsAppFromCallService(callServiceCall);
      }
      
      console.log('[CallSyncService] Call ID mismatch resolved');
    } catch (error) {
      console.error('[CallSyncService] Error resolving call ID mismatch:', error);
    }
  }

  /**
   * Save sync state to AsyncStorage
   */
  private async saveSyncState(callData: any): Promise<void> {
    try {
      const syncState = {
        callId: callData.callId,
        status: callData.status,
        timestamp: Date.now(),
        ...callData
      };
      
      await AsyncStorage.setItem(this.SYNC_STATE_KEY, JSON.stringify(syncState));
    } catch (error) {
      console.error('[CallSyncService] Error saving sync state:', error);
    }
  }

  /**
   * Get sync state from AsyncStorage
   */
  private async getSyncState(): Promise<any | null> {
    try {
      const syncStateJson = await AsyncStorage.getItem(this.SYNC_STATE_KEY);
      return syncStateJson ? JSON.parse(syncStateJson) : null;
    } catch (error) {
      console.error('[CallSyncService] Error getting sync state:', error);
      return null;
    }
  }

  /**
   * Clear sync state
   */
  private async clearSyncState(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.SYNC_STATE_KEY);
    } catch (error) {
      console.error('[CallSyncService] Error clearing sync state:', error);
    }
  }

  /**
   * Stop background sync
   */
  public stopBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('[CallSyncService] Background sync stopped');
    }
  }
  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.stopBackgroundSync();
    
    // Clear debounce timer
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
      this.syncDebounceTimer = null;
    }
    
    // Reset state
    this.lastSyncedCallId = null;
    this.isSyncing = false;
    
    this.clearSyncState();
    console.log('[CallSyncService] Cleanup completed');
  }
}

/**
 * Background task for handling call synchronization when app is backgrounded
 */
const CallSyncBackgroundTask = async (taskData: any) => {
  console.log('[CallSyncBackgroundTask] Processing sync task:', taskData);
  
  try {
    const syncService = CallSyncService.getInstance();
    await syncService.initialize();
    
    // Process the specific sync task
    const { action, callData } = taskData;
    
    switch (action) {
      case 'endCall':
        await syncService['handleCallEnded'](callData);
        break;
      case 'stateChange':
        await syncService['handleCallStateChange'](callData);
        break;
      default:
        console.log('[CallSyncBackgroundTask] Unknown action:', action);
    }
    
  } catch (error) {
    console.error('[CallSyncBackgroundTask] Error processing sync task:', error);
  }
};

// Register the background task
AppRegistry.registerHeadlessTask('CallSyncBackgroundTask', () => CallSyncBackgroundTask);

export default CallSyncService;
