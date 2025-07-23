import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import Logger from '../utils/LogUtils';

/**
 * FCMMessageRouter - Central coordinator for all FCM messages
 * 
 * This router solves the critical issue of multiple FCM handlers competing
 * for the same messages by providing a single entry point that routes
 * messages to the appropriate handler based on message type.
 * 
 * Key Features:
 * - Preserves existing call FCM functionality completely
 * - Adds chat FCM handling capability
 * - Prevents handler conflicts and race conditions
 * - Maintains backward compatibility
 */
export class FCMMessageRouter {
  private static instance: FCMMessageRouter;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): FCMMessageRouter {
    if (!FCMMessageRouter.instance) {
      FCMMessageRouter.instance = new FCMMessageRouter();
    }
    return FCMMessageRouter.instance;
  }

  /**
   * Initialize the router (called once during app startup)
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    Logger.info('[FCMMessageRouter] Initializing FCM message router...');
    this.isInitialized = true;
    Logger.info('[FCMMessageRouter] Router initialized successfully');
  }

  /**
   * Route FCM message to appropriate handler based on message type
   * This is the main entry point for all FCM messages
   */
  public async routeMessage(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage,
    context: 'foreground' | 'background' = 'background'
  ): Promise<void> {
    try {
      Logger.info(`[FCMMessageRouter] Routing ${context} message:`, {
        data: remoteMessage.data,
        notification: remoteMessage.notification
      });

      const messageType = this.extractMessageType(remoteMessage);
      Logger.info('[FCMMessageRouter] Detected message type:', messageType);

      if (this.isCallMessage(messageType)) {
        await this.routeToCallHandler(remoteMessage, context);
      } else if (this.isChatMessage(messageType)) {
        // Route chat messages to WatermelonLocalChatManager
        await this.routeToChatHandler(remoteMessage, context);
      } else {
        Logger.info('[FCMMessageRouter] Unknown message type, ignoring:', messageType);
      }
    } catch (error) {
      Logger.error('[FCMMessageRouter] Error routing message:', error);
      // Don't throw to prevent app crashes
    }
  }

  /**
   * Extract message type from FCM message
   * Handles both new format (info field) and legacy format (direct type)
   */
  private extractMessageType(remoteMessage: FirebaseMessagingTypes.RemoteMessage): string | null {
    // Check new format (info field)
    if (remoteMessage.data?.info && typeof remoteMessage.data.info === 'string') {
      try {
        const parsedInfo = JSON.parse(remoteMessage.data.info);
        return parsedInfo.type || null;
      } catch (e) {
        console.warn('[FCMMessageRouter] Failed to parse info field:', e);
      }
    }

    // Check legacy format (direct type)
    if (remoteMessage.data?.type && typeof remoteMessage.data.type === 'string') {
      return remoteMessage.data.type;
    }

    return null;
  }

  /**
   * Determine if message is call-related
   * Preserves exact logic from existing index.js implementation
   */
  private isCallMessage(messageType: string | null): boolean {
    if (!messageType) return false;

    // Call message types (preserving existing logic exactly)
    const callMessageTypes = [
      'CALL_INITIATED', 'CALL_INITIATE', 
      'CALL_ACCEPT', 'CALL_ACCEPTED', 
      'CALL_END', 'CALL_ENDED'
    ];

    return callMessageTypes.includes(messageType);
  }

  /**
   * Determine if message is chat-related
   */
  private isChatMessage(messageType: string | null): boolean {
    if (!messageType) return false;

    // Chat message types
    const chatMessageTypes = [
      'chat_message'
    ];

    return chatMessageTypes.includes(messageType);
  }

  /**
   * Route message to call handler (Enhanced CallFCMHandler)
   * Uses new VideoSDK CallKeep integration best practices
   */
  private async routeToCallHandler(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage,
    context: 'foreground' | 'background'
  ): Promise<void> {
    try {
      console.log('[FCMMessageRouter] Routing to enhanced call handler...');

      // Use enhanced CallFCMHandler for better CallKeep integration
      const { CallFCMHandler } = await import('./calling/CallFCMHandler');
      const callHandler = new CallFCMHandler();

      // Check if handler can process this message
      if (!callHandler.canHandle(remoteMessage)) {
        console.warn('[FCMMessageRouter] CallFCMHandler cannot handle message, falling back to ReliableCallManager');

        // Fallback to existing ReliableCallManager
        const ReliableCallManagerModule = await import('./calling/ReliableCallManager');
        const callManager = ReliableCallManagerModule.default.getInstance();

        if (!callManager.isReady()) {
          await callManager.initialize();
        }

        await callManager.handleFCMMessage(remoteMessage, context);
        return;
      }

      // Use enhanced handler
      await callHandler.handle(remoteMessage, context);
      console.log('[FCMMessageRouter] Enhanced call message processed successfully');
    } catch (error) {
      console.error('[FCMMessageRouter] Error routing to call handler:', error);

      // Fallback to existing system on error
      try {
        console.log('[FCMMessageRouter] Attempting fallback to ReliableCallManager...');
        const ReliableCallManagerModule = await import('./calling/ReliableCallManager');
        const callManager = ReliableCallManagerModule.default.getInstance();

        if (!callManager.isReady()) {
          await callManager.initialize();
        }

        await callManager.handleFCMMessage(remoteMessage, context);
        console.log('[FCMMessageRouter] Fallback call processing successful');
      } catch (fallbackError) {
        console.error('[FCMMessageRouter] Fallback call processing failed:', fallbackError);
        throw error; // Throw original error
      }
    }
  }

  /**
   * Route message to chat handler (WatermelonLocalChatManager)
   * Updated to use the new WatermelonDB-based chat system
   */
  private async routeToChatHandler(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage,
    context: 'foreground' | 'background'
  ): Promise<void> {
    try {
      console.log('[FCMMessageRouter] Routing chat message to WatermelonLocalChatManager');

      // Parse message data from FCM message
      const messageData = this.parseChatMessageData(remoteMessage);
      if (!messageData) {
        console.warn('[FCMMessageRouter] Failed to parse chat message data');
        return;
      }

      // Try to get the WatermelonLocalChatManager instance from global context first
      let chatManager = (global as any).watermelonChatManager;

      if (chatManager && chatManager.isInitialized) {
        // Use existing initialized manager (app is running)
        const success = await chatManager.handleIncomingMessage(messageData);
        if (success) {
          console.log('[FCMMessageRouter] Chat message routed successfully to existing WatermelonLocalChatManager');
        } else {
          console.warn('[FCMMessageRouter] Existing WatermelonLocalChatManager failed to process message');
        }
      } else {
        // App is killed or manager not available - create temporary instance
        console.log('[FCMMessageRouter] Creating temporary WatermelonLocalChatManager for killed app state');
        await this.handleKilledAppChatMessage(messageData, context);
      }

    } catch (error) {
      console.error('[FCMMessageRouter] Error routing chat message:', error);
      // Don't throw for chat errors to avoid breaking call functionality
    }
  }

  /**
   * Handle chat message when app is killed (no global manager available)
   */
  private async handleKilledAppChatMessage(messageData: any, context: 'foreground' | 'background'): Promise<void> {
    try {
      console.log('[FCMMessageRouter] Handling chat message for killed app state');

      // Import required modules dynamically
      const [
        { WatermelonLocalChatManager },
        { initializeDatabase },
        AsyncStorage
      ] = await Promise.all([
        import('./WatermelonLocalChatManager'),
        import('../database'),
        import('@react-native-async-storage/async-storage')
      ]);

      // Get user info from storage (needed for initialization)
      const userDataStr = await AsyncStorage.default.getItem('user');
      if (!userDataStr) {
        console.warn('[FCMMessageRouter] No user data available for killed app chat processing');
        return;
      }

      const userData = JSON.parse(userDataStr);
      const userId = userData.id?.toString();
      const userName = userData.name || userData.username || 'Unknown User';

      if (!userId) {
        console.warn('[FCMMessageRouter] No user ID available for killed app chat processing');
        return;
      }

      // Initialize database
      await initializeDatabase();

      // Create temporary chat manager instance
      const tempChatManager = new WatermelonLocalChatManager();

      // Initialize with minimal setup (disable FCM handlers to prevent conflicts)
      await tempChatManager.initialize(userId, userName, {}, { disableFCMHandlers: true });

      // Process the message (write to WatermelonDB)
      const success = await tempChatManager.handleIncomingMessage(messageData);

      if (success) {
        console.log('[FCMMessageRouter] Chat message processed successfully in killed app state');

        // Queue for backend sync (dual write)
        await this.queueBackgroundMessageForSync(messageData, userId);
      } else {
        console.warn('[FCMMessageRouter] Failed to process chat message in killed app state');
      }

    } catch (error) {
      console.error('[FCMMessageRouter] Error handling killed app chat message:', error);
    }
  }

  /**
   * Parse chat message data from FCM remote message
   */
  private parseChatMessageData(remoteMessage: FirebaseMessagingTypes.RemoteMessage): any {
    try {
      const { data } = remoteMessage;

      // Check new format (info field)
      if (data?.info && typeof data.info === 'string') {
        try {
          const messageData = JSON.parse(data.info);
          if (messageData.type === 'chat_message') {
            return {
              id: messageData.messageId,
              conversationId: messageData.conversationId,
              senderId: messageData.senderId,
              senderName: messageData.senderName,
              content: messageData.content,
              messageType: messageData.messageType || 'text',
              timestamp: messageData.timestamp || new Date().toISOString()
            };
          }
        } catch (e) {
          console.warn('[FCMMessageRouter] Failed to parse info field:', e);
        }
      }

      // Check legacy format (direct type)
      if (data?.type === 'chat_message') {
        return {
          id: data.messageId,
          conversationId: data.conversationId,
          senderId: data.senderId,
          senderName: data.senderName,
          content: data.content,
          messageType: data.messageType || 'text',
          timestamp: data.timestamp || new Date().toISOString()
        };
      }

      return null;
    } catch (error) {
      console.error('[FCMMessageRouter] Error parsing chat message data:', error);
      return null;
    }
  }

  /**
   * Queue background message for backend sync (dual write)
   */
  private async queueBackgroundMessageForSync(messageData: any, currentUserId: string): Promise<void> {
    try {
      console.log('[FCMMessageRouter] 🔄 Queuing background message for backend sync');

      // Import required modules
      const [AsyncStorage, { API_BASE_URL }] = await Promise.all([
        import('@react-native-async-storage/async-storage'),
        import('../constants/api')
      ]);

      // Get auth token first
      const authToken = await AsyncStorage.default.getItem('accessToken');
      if (!authToken) {
        console.warn('[FCMMessageRouter] ⚠️ No auth token available for background sync. Message saved locally via WatermelonDB.');
        return;
      }

      // Prepare message data for backend
      const backendMessageData = {
        tempId: messageData.id, // Use FCM message ID as temp ID
        chatId: messageData.conversationId,
        recipientId: currentUserId, // Current user is the recipient
        content: messageData.content,
        messageType: messageData.messageType || 'text',
        timestamp: messageData.timestamp || new Date().toISOString()
      };

      // Send to backend API
      const response = await fetch(`${API_BASE_URL}/api/chat/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(backendMessageData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[FCMMessageRouter] ✅ Background message synced to backend successfully:', result);
      } else {
        const errorData = await response.json();
        console.error('[FCMMessageRouter] ❌ Background sync failed:', errorData);
      }

    } catch (error) {
      console.error('[FCMMessageRouter] ❌ Failed to queue background message for sync:', error);
      // Don't throw error to avoid breaking message processing
    }
  }

  /**
   * Get router status for debugging
   */
  public getStatus(): { initialized: boolean } {
    return {
      initialized: this.isInitialized
    };
  }
}

export default FCMMessageRouter;

// Export the handler interface for implementations
export interface FCMHandler {
  canHandle(message: FirebaseMessagingTypes.RemoteMessage): boolean
  handle(message: FirebaseMessagingTypes.RemoteMessage, context: 'foreground' | 'background'): Promise<void>
  priority: number
}
