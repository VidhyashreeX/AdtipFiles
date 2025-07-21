import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

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

    console.log('[FCMMessageRouter] Initializing FCM message router...');
    this.isInitialized = true;
    console.log('[FCMMessageRouter] Router initialized successfully');
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
      console.log(`[FCMMessageRouter] Routing ${context} message:`, {
        data: remoteMessage.data,
        notification: remoteMessage.notification
      });

      const messageType = this.extractMessageType(remoteMessage);
      console.log('[FCMMessageRouter] Detected message type:', messageType);

      if (this.isCallMessage(messageType, remoteMessage)) {
        await this.routeToCallHandler(remoteMessage, context);
      } else if (this.isChatMessage(messageType, remoteMessage)) {
        await this.routeToChatHandler(remoteMessage, context);
      } else {
        console.log('[FCMMessageRouter] Unknown message type, ignoring:', messageType);
      }
    } catch (error) {
      console.error('[FCMMessageRouter] Error routing message:', error);
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
  private isCallMessage(messageType: string | null, remoteMessage: FirebaseMessagingTypes.RemoteMessage): boolean {
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
  private isChatMessage(messageType: string | null, remoteMessage: FirebaseMessagingTypes.RemoteMessage): boolean {
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
   * Route message to chat handler (FCMChatService)
   * New functionality to enable chat FCM
   */
  private async routeToChatHandler(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage,
    context: 'foreground' | 'background'
  ): Promise<void> {
    try {
      console.log('[FCMMessageRouter] Routing to chat handler...');

      // Import FCMChatService dynamically to avoid circular dependencies
      const { default: FCMChatService } = await import('./FCMChatService');
      const chatService = FCMChatService.getInstance();

      // Check if chat service is initialized
      if (!chatService.isServiceInitialized()) {
        console.warn('[FCMMessageRouter] FCMChatService not initialized, skipping chat message');
        return;
      }

      // Call the chat service's message handler (receive only - sending handled by WatermelonDB)
      await chatService.handleFCMMessageFromRouter(remoteMessage);
      console.log('[FCMMessageRouter] Chat message processed successfully');
    } catch (error) {
      console.error('[FCMMessageRouter] Error routing to chat handler:', error);
      // Don't throw for chat errors to avoid breaking call functionality
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
