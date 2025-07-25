/**
 * WatermelonDB Local Chat Manager
 * 
 * Enhanced version of LocalChatManager using WatermelonDB for persistent storage.
 * Provides the same API interface while leveraging WatermelonDB's reactive capabilities.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DirectFCMService } from './DirectFCMService';
import { WatermelonChatDatabase } from '../database/services/WatermelonChatDatabase';
import { QueryHelpers } from '../database/services/QueryHelpers';
import { SyncService } from '../database/services/SyncService';
import { initializeDatabase } from '../database';
import { API_BASE_URL } from '../constants/api';
import ApiService from './ApiService';
import Logger from '../utils/LogUtils';
import type { Message } from '../database/models/Message';
import type { UserChat } from '../database/models/UserChat';
import type { User } from '../database/models/User';

// Import navigation
import { navigationRef } from '../navigation/NavigationService';

// Storage keys for FCM token caching
export const STORAGE_KEYS = {
  CONVERSATIONS: '@fcm_chat_conversations',
  MESSAGES_PREFIX: '@fcm_chat_messages_',
  USER_PROFILES: '@fcm_chat_user_profiles',
  UNREAD_COUNTS: '@fcm_chat_unread_counts',
  LAST_SYNC: '@fcm_chat_last_sync',
  FCM_TOKENS: '@fcm_chat_fcm_tokens',
  MESSAGE_QUEUE: '@fcm_chat_message_queue'
};

// Re-export types for compatibility
export interface LocalMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageType: 'text' | 'image' | 'video' | 'audio' | 'file';
  createdAt: string;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  tempId?: string;
  replyTo?: string;
}

export interface LocalConversation {
  id: string;
  type: 'direct' | 'group';
  participants: string[];
  lastMessage?: LocalMessage;
  lastActivity: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CachedUserProfile {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  fcmToken?: string;
  lastUpdated: string;
}

// Sync status types
export interface ConversationSyncStatus {
  conversationId: string;
  status: 'idle' | 'syncing' | 'complete' | 'error';
  lastSyncAt: Date | null;
  error: string | null;
}

export interface LocalChatEventHandlers {
  onMessageReceived?: (message: LocalMessage) => void;
  onMessageSent?: (message: LocalMessage) => void;
  onConversationUpdated?: (conversation: LocalConversation) => void;
  onUnreadCountChanged?: (count: number) => void;
  onChatUnavailable?: (recipientName: string, error: any) => void;
  onSyncStatusChanged?: (status: ConversationSyncStatus) => void;
}

export class WatermelonLocalChatManager {
  private chatDb: WatermelonChatDatabase;
  private syncService: SyncService;
  private fcmService: DirectFCMService;
  
  private currentUserId: string | null = null;
  private currentUserName: string | null = null;
  private currentConversationId: string | null = null;
  private currentParticipantId: string | null = null; // Store the current chat participant ID
  private eventHandlers: LocalChatEventHandlers = {};
  private isInitialized: boolean = false;
  private conversationSyncStatuses: Map<string, ConversationSyncStatus> = new Map();

  constructor() {
    this.chatDb = new WatermelonChatDatabase();
    this.syncService = new SyncService();
    this.fcmService = DirectFCMService.getInstance();

    // Setup notification channels
    this.setupNotificationChannels();
  }

  /**
   * Setup notification channels for chat notifications
   */
  private async setupNotificationChannels(): Promise<void> {
    try {
      await notifee.createChannel({
        id: 'chat',
        name: 'Chat Messages',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });

      Logger.info('[WatermelonLocalChatManager] Notification channels created');
    } catch (error) {
      Logger.error('[WatermelonLocalChatManager] Failed to create notification channels:', error);
    }
  }

  /**
   * Setup notification interaction handlers
   */
  private async setupNotificationHandlers(): Promise<void> {
    try {
      // Handle notification press events (foreground)
      notifee.onForegroundEvent(async ({ type, detail }) => {
        if (type === EventType.PRESS) {
          const data = detail.notification?.data;
          if (data?.type === 'chat_message' && data?.senderId) {
            Logger.info('[WatermelonLocalChatManager] 📱 Foreground notification pressed for user-based chat');
            // Get sender name from notification data or title
            const senderName = String(data.senderName || detail.notification?.title || 'Unknown User');

            // Navigate to FCMChatScreen
            await this.navigateToUserChat(String(data.senderId), senderName);
          }
        }
      });

      // Handle background notification press events
      notifee.onBackgroundEvent(async ({ type, detail }) => {
        if (type === EventType.PRESS) {
          const data = detail.notification?.data;
          if (data?.type === 'chat_message' && data?.senderId) {
            Logger.info('[WatermelonLocalChatManager] 📱 Background notification pressed for user-based chat');
            // Store navigation intent for when app becomes active
            const senderName = String(data.senderName || detail.notification?.title || 'Unknown User');
            await this.storePendingNavigation(String(data.senderId), senderName);
          }
        }
      });

      Logger.info('[WatermelonLocalChatManager] Notification handlers setup complete');
    } catch (error) {
      Logger.error('[WatermelonLocalChatManager] Failed to setup notification handlers:', error);
    }
  }

  /**
   * Navigate to user-based chat from notification
   */
  private async navigateToUserChat(senderId: string, senderName?: string): Promise<void> {
    try {
      Logger.info('[WatermelonLocalChatManager] 🧭 Navigating to user chat with sender:', senderId);

      // Use provided sender name or try to get from database
      let finalSenderName = senderName;
      if (!finalSenderName || finalSenderName === 'Unknown User') {
        const senderUser = await this.chatDb.getUserById(senderId);
        finalSenderName = senderUser?.name || senderName || 'Unknown User';
      }

      Logger.info('[WatermelonLocalChatManager] 🧭 Sender info:', { senderId, senderName: finalSenderName });

      // Navigate to FCMChatScreen with sender info
      // The FCMChatScreen will create/get the user-based chat with this participant
      if (navigationRef.isReady()) {
        const currentRoute = navigationRef.getCurrentRoute();
        Logger.info('[WatermelonLocalChatManager] 🧭 Current route:', currentRoute?.name);

        // Navigate to FCMChatScreen with participant info
        if (currentRoute?.name && ['Home', 'TipTube', 'TipCall', 'Profile', 'Conversations', 'FCMChat'].includes(currentRoute.name)) {
          Logger.info('[WatermelonLocalChatManager] 🧭 Navigating directly to FCMChat');
          (navigationRef as any).navigate('FCMChat', {
            participantId: senderId,
            participantName: finalSenderName,
          });
        } else {
          Logger.info('[WatermelonLocalChatManager] 🧭 Navigating to Main navigator then FCMChat');
          (navigationRef as any).navigate('Main', {
            screen: 'FCMChat',
            params: {
              participantId: senderId,
              participantName: finalSenderName,
            },
          });
        }

        Logger.info('[WatermelonLocalChatManager] ✅ Navigation completed');
      } else {
        Logger.warn('[WatermelonLocalChatManager] ❌ Navigation not ready');
      }
    } catch (error) {
      Logger.error('[WatermelonLocalChatManager] ❌ Error navigating to user chat:', error);
    }
  }

  /**
   * Store pending navigation for background notification press
   */
  private async storePendingNavigation(senderId: string, senderName: string): Promise<void> {
    try {
      const pendingNavigation = {
        senderId,
        senderName,
        timestamp: Date.now()
      };

      await AsyncStorage.setItem('pendingChatNavigation', JSON.stringify(pendingNavigation));
      Logger.info('[WatermelonLocalChatManager] 📱 Stored pending navigation:', pendingNavigation);
    } catch (error) {
      Logger.error('[WatermelonLocalChatManager] ❌ Error storing pending navigation:', error);
    }
  }

  /**
   * Check and handle pending navigation from background notification
   */
  private async handlePendingNavigation(): Promise<void> {
    try {
      const pendingNavigation = await AsyncStorage.getItem('pendingChatNavigation');
      if (pendingNavigation) {
        const data = JSON.parse(pendingNavigation);
        Logger.info('[WatermelonLocalChatManager] 📱 Handling pending navigation:', data);

        // Clear the pending navigation
        await AsyncStorage.removeItem('pendingChatNavigation');

        // Navigate to chat with a small delay to ensure app is fully active
        setTimeout(() => {
          this.navigateToUserChat(String(data.senderId), String(data.senderName));
        }, 1000);
      }
    } catch (error) {
      Logger.error('[WatermelonLocalChatManager] ❌ Error handling pending navigation:', error);
    }
  }

  /**
   * Initialize the chat manager
   */
  async initialize(userId: string, userName: string, eventHandlers: LocalChatEventHandlers = {}, options?: { disableFCMHandlers?: boolean }): Promise<void> {
    try {
      Logger.info('[WatermelonLocalChatManager] Initializing...', 'FCM disabled:', options?.disableFCMHandlers);

      this.currentUserId = userId;
      this.currentUserName = userName;
      this.eventHandlers = eventHandlers;

      // Initialize WatermelonDB
      await initializeDatabase();

      // Initialize DirectFCMService
      await this.fcmService.initialize();

      // Create or update current user
      await this.ensureCurrentUser();

      // Setup FCM message handler (unless disabled)
      // Note: In the main app, FCM handlers should be disabled to prevent conflicts with FCMMessageRouter
      if (!options?.disableFCMHandlers) {
        await this.setupFCMHandler();
        await this.setupNotificationHandlers();
        Logger.info('[WatermelonLocalChatManager] FCM handlers enabled - this should only be used in standalone mode');
      } else {
        // Only setup notification handlers for notification press events
        await this.setupNotificationHandlers();
        Logger.info('[WatermelonLocalChatManager] FCM message handlers disabled - using centralized FCMMessageRouter');
      }

      // Perform initial sync
      await this.syncService.performSync(userId);

      // Handle any pending navigation from background notifications
      await this.handlePendingNavigation();

      this.isInitialized = true;
      Logger.info('[WatermelonLocalChatManager] Initialized successfully');

    } catch (error) {
      Logger.error('[WatermelonLocalChatManager] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get user chats with reactive updates
   */
  observeConversations(): Observable<LocalConversation[]> {
    if (!this.currentUserId) {
      throw new Error('Chat manager not initialized');
    }

    return QueryHelpers.getUserChatsObservable(this.currentUserId)
      .pipe(
        map(userChats => userChats.map(this.convertUserChatToLocal))
      );
  }

  /**
   * Get messages for a user-based chat with reactive updates
   */
  observeMessages(chatId: string, limit: number = 50): Observable<LocalMessage[]> {
    if (!this.currentUserId) {
      throw new Error('Chat manager not initialized');
    }

    // Extract other user ID from chat ID (format: chat_userId1_userId2)
    const [, userId1, userId2] = chatId.split('_');
    const otherUserId = userId1 === this.currentUserId ? userId2 : userId1;

    Logger.info('[WatermelonLocalChatManager] 📨 Observing user-based messages between:', this.currentUserId, 'and', otherUserId);

    return QueryHelpers.getUserMessagesObservable(this.currentUserId, otherUserId, limit)
      .pipe(
        map(messages => {
          const convertedMessages = messages.map(this.convertMessageToLocal);
          // Debug log to see message statuses from database
          const failedMessages = convertedMessages.filter(m => m.status === 'failed');
          if (failedMessages.length > 0) {
            Logger.info('[WatermelonLocalChatManager] 🔴 Failed messages from DB:', failedMessages.map(m => ({
              id: m.id,
              tempId: m.tempId,
              status: m.status,
              content: m.content.substring(0, 20) + '...'
            })));
          }
          return convertedMessages;
        })
      );
  }

  /**
   * Send a message
   */
  async sendMessage(conversationId: string, content: string, replyTo?: string): Promise<LocalMessage> {
    if (!this.currentUserId || !this.currentUserName) {
      throw new Error('Chat manager not initialized');
    }

    // Create optimistic message
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    Logger.info('[WatermelonLocalChatManager] Creating message:', messageId);

    // Extract recipient ID from user-based chat ID (format: chat_userId1_userId2)
    const [, userId1, userId2] = conversationId.split('_');
    const recipientId = userId1 === this.currentUserId ? userId2 : userId1;
    Logger.info('[WatermelonLocalChatManager] 📨 User-based chat - recipient ID:', recipientId);

    const message = await this.chatDb.createMessage({
      id: messageId,
      chatId: conversationId, // conversationId is actually chatId in user-based system
      senderId: this.currentUserId,
      recipientId: recipientId,
      senderName: this.currentUserName,
      content: content.trim(),
      messageType: 'text',
      status: 'sending',
      tempId,
      replyTo
    });

    const localMessage = this.convertMessageToLocal(message);
    Logger.info('[WatermelonLocalChatManager] Message created in database:', messageId);

    // Emit message sent event immediately for optimistic UI
    this.eventHandlers.onMessageSent?.(localMessage);

    // Send via FCM and sync to backend in background
    this.sendFCMMessage(localMessage, recipientId)
      .then(async () => {
        Logger.info('[WatermelonLocalChatManager] ✅ FCM API call completed successfully for message:', messageId);
        // Update status to sent
        await this.chatDb.updateMessageStatus(messageId, 'sent');

        // Emit updated message with sent status
        const updatedMessage = { ...localMessage, status: 'sent' as const };
        this.eventHandlers.onMessageSent?.(updatedMessage);

        // Queue for backend sync (dual write)
        this.queueForBackendSync(localMessage, recipientId);
      })
      .catch(async (error) => {
        Logger.error('[WatermelonLocalChatManager] ❌ Failed to send FCM message via API:', error);
        Logger.error('[WatermelonLocalChatManager] ❌ Error details:', {
          messageId,
          conversationId: localMessage.conversationId,
          recipientId: recipientId,
          errorMessage: error.message,
          errorStack: error.stack
        });

        // Check if this is a chat unavailability error (FCM token issues)
        const isUnavailableError = this.isChatUnavailableError(error);
        Logger.info('[WatermelonLocalChatManager] 🔍 Error analysis result:', {
          isUnavailableError,
          recipientId,
          hasEventHandler: !!this.eventHandlers.onChatUnavailable
        });



        if (isUnavailableError && recipientId) {
          Logger.info('[WatermelonLocalChatManager] 🚫 Chat unavailable error detected, triggering alert');

          // Get recipient name for the alert
          const recipientName = await this.getRecipientName(recipientId);
          Logger.info('[WatermelonLocalChatManager] 🚫 Recipient name:', recipientName);

          // Check if event handler exists
          if (this.eventHandlers.onChatUnavailable) {
            Logger.info('[WatermelonLocalChatManager] 🚫 Calling onChatUnavailable event handler');
            this.eventHandlers.onChatUnavailable(recipientName, error);
          } else {
            Logger.error('[WatermelonLocalChatManager] ❌ onChatUnavailable event handler not found!');
          }

          // Update message status to failed
          Logger.info('[WatermelonLocalChatManager] 🔴 Updating message status to failed:', messageId);
          const updatedMessage = await this.chatDb.updateMessageStatus(messageId, 'failed');
          Logger.info('[WatermelonLocalChatManager] 🔴 Message status updated result:', {
            messageId,
            updatedStatus: updatedMessage?.status,
            success: !!updatedMessage
          });

          // Emit updated message with failed status
          const failedMessage = { ...localMessage, status: 'failed' as const };
          this.eventHandlers.onMessageSent?.(failedMessage);
        } else {
          // For other errors, ALSO mark as failed to show proper UI feedback
          Logger.info('[WatermelonLocalChatManager] ❌ Non-availability error, but marking as failed for UI feedback');

          // Update message status to failed for ALL errors
          Logger.info('[WatermelonLocalChatManager] 🔴 Updating message status to failed (non-availability error):', messageId);
          const updatedMessage = await this.chatDb.updateMessageStatus(messageId, 'failed');
          Logger.info('[WatermelonLocalChatManager] 🔴 Message status updated result (non-availability):', {
            messageId,
            updatedStatus: updatedMessage?.status,
            success: !!updatedMessage
          });

          // Emit updated message with failed status
          const failedMessage = { ...localMessage, status: 'failed' as const };
          this.eventHandlers.onMessageSent?.(failedMessage);

          // FALLBACK: If any message fails and we have a recipient, show alert anyway
          // This ensures users get feedback even if error detection fails
          if (recipientId && this.eventHandlers.onChatUnavailable) {
            Logger.info('[WatermelonLocalChatManager] 🚨 FALLBACK: Triggering alert for any message failure');
            const recipientName = await this.getRecipientName(recipientId);
            this.eventHandlers.onChatUnavailable(recipientName, error);
          }
        }
      });

    return localMessage;
  }

  /**
   * Create or get conversation (non-blocking, immediate return)
   */
  async createOrGetConversation(participantId: string): Promise<string> {
    if (!this.currentUserId) {
      throw new Error('Chat manager not initialized');
    }

    Logger.info('[WatermelonLocalChatManager] 🔍 Creating/getting user chat between:', this.currentUserId, 'and', participantId);

    // Use new user-based chat system
    const chatId = QueryHelpers.generateChatId(this.currentUserId, participantId);

    // Ensure user chat exists locally (immediate)
    await QueryHelpers.getOrCreateUserChat(this.currentUserId, participantId);

    Logger.info('[WatermelonLocalChatManager] ✅ User chat ready locally:', chatId);

    // Start background sync without blocking
    this.syncConversationInBackground(chatId);

    return chatId;
  }

  /**
   * Sync conversation messages in background (non-blocking)
   */
  private syncConversationInBackground(chatId: string): void {
    // Update sync status to indicate sync is starting
    const syncStatus: ConversationSyncStatus = {
      conversationId: chatId,
      status: 'syncing',
      lastSyncAt: null,
      error: null
    };

    this.conversationSyncStatuses.set(chatId, syncStatus);
    this.eventHandlers.onSyncStatusChanged?.(syncStatus);

    // Perform sync in background
    this.syncService.syncConversationMessages(chatId)
      .then((syncedMessages) => {
        Logger.info(`[WatermelonLocalChatManager] ✅ Background sync completed: ${syncedMessages.length} messages for ${chatId}`);

        // Update sync status to indicate success
        const completedStatus: ConversationSyncStatus = {
          conversationId: chatId,
          status: 'complete',
          lastSyncAt: new Date(),
          error: null
        };

        this.conversationSyncStatuses.set(chatId, completedStatus);
        this.eventHandlers.onSyncStatusChanged?.(completedStatus);
      })
      .catch((syncError) => {
        Logger.error('[WatermelonLocalChatManager] ⚠️ Background sync failed for conversation:', chatId, syncError);

        // Update sync status to indicate error
        const errorStatus: ConversationSyncStatus = {
          conversationId: chatId,
          status: 'error',
          lastSyncAt: null,
          error: syncError.message || 'Sync failed'
        };

        this.conversationSyncStatuses.set(chatId, errorStatus);
        this.eventHandlers.onSyncStatusChanged?.(errorStatus);
      });
  }

  /**
   * Get sync status for a conversation
   */
  getSyncStatus(conversationId: string): ConversationSyncStatus {
    return this.conversationSyncStatuses.get(conversationId) || {
      conversationId,
      status: 'idle',
      lastSyncAt: null,
      error: null
    };
  }

  /**
   * Mark user chat as read
   */
  async markAsRead(chatId: string, _messageId?: string): Promise<void> {
    if (!this.currentUserId) return;

    // Extract other user ID from chat ID
    const [, userId1, userId2] = chatId.split('_');
    const otherUserId = userId1 === this.currentUserId ? userId2 : userId1;

    await QueryHelpers.markUserChatAsRead(this.currentUserId, otherUserId);

    // Update unread count
    const unreadCount = await QueryHelpers.getTotalUnreadCount(this.currentUserId);
    this.eventHandlers.onUnreadCountChanged?.(unreadCount);
  }

  /**
   * Set current conversation for notification management
   */
  setCurrentConversation(conversationId: string | null, participantId?: string | null): void {
    this.currentConversationId = conversationId;
    if (participantId !== undefined) {
      this.currentParticipantId = participantId;
      Logger.info('[WatermelonLocalChatManager] Set current participant ID:', participantId);
    }
  }

  /**
   * Set active conversation (alias for setCurrentConversation for compatibility)
   */
  setActiveConversation(conversationId: string | null): void {
    this.setCurrentConversation(conversationId);
  }

  /**
   * Mark messages as read in a user chat
   */
  async markMessagesAsRead(chatId: string): Promise<void> {
    if (!this.currentUserId) return;

    try {
      // Extract other user ID from chat ID
      const [, userId1, userId2] = chatId.split('_');
      const otherUserId = userId1 === this.currentUserId ? userId2 : userId1;

      await QueryHelpers.markUserChatAsRead(this.currentUserId, otherUserId);

      // Update unread count
      const unreadCount = await QueryHelpers.getTotalUnreadCount(this.currentUserId);
      this.eventHandlers.onUnreadCountChanged?.(unreadCount);

      Logger.info('[WatermelonLocalChatManager] Marked messages as read for chat:', chatId);
    } catch (error) {
      Logger.error('[WatermelonLocalChatManager] Error marking messages as read:', error);
    }
  }

  /**
   * Get total unread count
   */
  async getUnreadCount(): Promise<number> {
    if (!this.currentUserId) return 0;
    return await QueryHelpers.getTotalUnreadCount(this.currentUserId);
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<User | null> {
    return await this.chatDb.getUserById(userId);
  }



  /**
   * Update current user's FCM token
   */
  async updateFCMToken(fcmToken: string): Promise<void> {
    if (!this.currentUserId) return;

    try {
      await this.chatDb.updateUser(this.currentUserId, { fcmToken });
      Logger.info('[WatermelonLocalChatManager] Updated FCM token for user:', this.currentUserId);
    } catch (error) {
      Logger.error('[WatermelonLocalChatManager] Error updating FCM token:', error);
    }
  }

  /**
   * Public method to handle incoming messages (for use by other services)
   */
  async handleIncomingMessage(messageData: {
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    content: string;
    messageType: string;
    timestamp: string;
  }): Promise<boolean> {
    try {
      Logger.info('[WatermelonLocalChatManager] 📨 PUBLIC: Handling incoming message:', messageData.id);

      const success = await this.syncService.handleIncomingMessage(messageData, this.currentUserId || undefined);

      if (success) {
        Logger.info('[WatermelonLocalChatManager] ✅ PUBLIC: Message saved to database successfully');

        // Create message object for event handlers
        const messageForHandlers: LocalMessage = {
          id: messageData.id,
          conversationId: messageData.conversationId,
          senderId: messageData.senderId,
          senderName: messageData.senderName,
          content: messageData.content,
          messageType: (messageData.messageType as any) || 'text',
          status: 'delivered' as const,
          createdAt: messageData.timestamp || new Date().toISOString()
        };

        // Always notify event handlers for UI updates
        this.eventHandlers.onMessageReceived?.(messageForHandlers);

        // Don't show notification if user is viewing this conversation
        if (this.currentConversationId !== messageData.conversationId) {
          Logger.info('[WatermelonLocalChatManager] 🔔 PUBLIC: Showing notification for conversation:', messageData.conversationId);
          // Show actual notification
          await this.showChatNotification(messageForHandlers);
        } else {
          Logger.info('[WatermelonLocalChatManager] 👁️ PUBLIC: User viewing this conversation - no notification needed');
        }

        return true;
      } else {
        Logger.warn('[WatermelonLocalChatManager] ❌ PUBLIC: Sync service failed to process message');
        return false;
      }
    } catch (error) {
      Logger.error('[WatermelonLocalChatManager] ❌ PUBLIC: Error handling incoming message:', error);
      return false;
    }
  }

  /**
   * Get chat participants with user details (user-based)
   */
  async getConversationParticipants(chatId: string): Promise<User[]> {
    try {
      // Extract user IDs from chat ID
      const [, userId1, userId2] = chatId.split('_');
      const users: User[] = [];

      const user1 = await this.chatDb.getUserById(userId1);
      const user2 = await this.chatDb.getUserById(userId2);

      if (user1) users.push(user1);
      if (user2) users.push(user2);

      return users;
    } catch (error) {
      Logger.error('[WatermelonLocalChatManager] Error getting chat participants:', error);
      return [];
    }
  }

  /**
   * Search messages
   */
  async searchMessages(query: string, conversationId?: string): Promise<LocalMessage[]> {
    const messages = await QueryHelpers.searchMessages(query, conversationId);
    return messages.map(this.convertMessageToLocal);
  }

  /**
   * Get user chat by ID
   */
  async getConversationById(chatId: string): Promise<LocalConversation | null> {
    const userChat = await this.chatDb.getUserChatById(chatId);
    return userChat ? this.convertUserChatToLocal(userChat) : null;
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, profile: Partial<CachedUserProfile>): Promise<void> {
    await this.chatDb.updateUser(userId, {
      name: profile.name,
      username: profile.username,
      avatar: profile.avatar,
      fcmToken: profile.fcmToken
    });
  }

  /**
   * Cleanup and maintenance
   */
  async cleanup(): Promise<void> {
    await this.chatDb.cleanup();
    await this.syncService.cleanup();
  }

  // Private helper methods
  private async ensureCurrentUser(): Promise<void> {
    if (!this.currentUserId || !this.currentUserName) return;

    let user = await this.chatDb.getUserById(this.currentUserId);

    if (!user) {
      user = await this.chatDb.createUser({
        id: this.currentUserId,
        name: this.currentUserName
      });
    } else {
      // Update last seen using the database service method which includes writer transaction
      await this.chatDb.updateUserLastSeen(this.currentUserId);
    }
  }

  private async setupFCMHandler(): Promise<void> {
    Logger.info('[WatermelonLocalChatManager] 🔧 Setting up FCM message handlers...');

    messaging().onMessage(async (remoteMessage) => {
      // Check for chat messages in both direct data and info field formats
      const isDirectChatMessage = remoteMessage.data?.type === 'chat_message';
      const isInfoChatMessage = remoteMessage.data?.info &&
        (() => {
          try {
            const infoString = typeof remoteMessage.data.info === 'string' ? remoteMessage.data.info : JSON.stringify(remoteMessage.data.info);
            const parsed = JSON.parse(infoString);
            return parsed.type === 'chat_message';
          } catch {
            return false;
          }
        })();

      if (isDirectChatMessage || isInfoChatMessage) {
        Logger.info('[WatermelonLocalChatManager] 📱 Foreground chat message received');
        await this.handleIncomingFCMMessage(remoteMessage);
      }
    });

    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      // Check for chat messages in both direct data and info field formats
      const isDirectChatMessage = remoteMessage.data?.type === 'chat_message';
      const isInfoChatMessage = remoteMessage.data?.info &&
        (() => {
          try {
            const infoString = typeof remoteMessage.data.info === 'string' ? remoteMessage.data.info : JSON.stringify(remoteMessage.data.info);
            const parsed = JSON.parse(infoString);
            return parsed.type === 'chat_message';
          } catch {
            return false;
          }
        })();

      if (isDirectChatMessage || isInfoChatMessage) {
        Logger.info('[WatermelonLocalChatManager] 📱 Background chat message received');
        await this.handleIncomingFCMMessage(remoteMessage);
      }
    });

    Logger.info('[WatermelonLocalChatManager] ✅ FCM message handlers setup complete');
  }

  private async handleIncomingFCMMessage(remoteMessage: any): Promise<void> {
    try {
      Logger.info('[WatermelonLocalChatManager] 📨 ENTRY: Processing incoming FCM message:', remoteMessage.data);

      // Parse message data - handle both direct data and info field formats
      let messageData;
      if (remoteMessage.data?.info) {
        // New format: data is in 'info' field as JSON string
        try {
          const infoString = typeof remoteMessage.data.info === 'string' ? remoteMessage.data.info : JSON.stringify(remoteMessage.data.info);
          messageData = JSON.parse(infoString);
          Logger.info('[WatermelonLocalChatManager] 📨 Parsed message from info field:', messageData);
        } catch (parseError) {
          Logger.error('[WatermelonLocalChatManager] Failed to parse info field:', parseError);
          return;
        }
      } else {
        // Legacy format: data is directly in remoteMessage.data
        messageData = remoteMessage.data;
        Logger.info('[WatermelonLocalChatManager] 📨 Using direct data format:', messageData);
      }

      if (!messageData || messageData.type !== 'chat_message') {
        Logger.warn('[WatermelonLocalChatManager] Invalid or non-chat message data:', messageData);
        return;
      }

      const success = await this.syncService.handleIncomingMessage({
        id: messageData.messageId,
        conversationId: messageData.conversationId,
        senderId: messageData.senderId,
        senderName: messageData.senderName,
        content: messageData.content,
        messageType: messageData.messageType || 'text',
        timestamp: messageData.timestamp || new Date().toISOString()
      }, this.currentUserId || undefined);

      if (success) {
        Logger.info('[WatermelonLocalChatManager] ✅ Message processed successfully by sync service');

        // Create message object for handlers and notifications
        const messageForHandlers = {
          id: messageData.messageId,
          conversationId: messageData.conversationId,
          senderId: messageData.senderId,
          senderName: messageData.senderName,
          content: messageData.content,
          messageType: messageData.messageType || 'text',
          status: 'delivered' as const,
          createdAt: messageData.timestamp || new Date().toISOString()
        };

        // Always notify event handlers for UI updates
        this.eventHandlers.onMessageReceived?.(messageForHandlers);

        // Don't show notification if user is viewing this conversation
        if (this.currentConversationId !== messageData.conversationId) {
          Logger.info('[WatermelonLocalChatManager] 🔔 Showing notification for conversation:', messageData.conversationId);
          // Show actual notification
          await this.showChatNotification(messageForHandlers);
        } else {
          Logger.info('[WatermelonLocalChatManager] 👁️ User viewing this conversation - no notification needed');
        }
      } else {
        Logger.warn('[WatermelonLocalChatManager] ❌ Sync service failed to process message');
      }

    } catch (error) {
      Logger.error('[WatermelonLocalChatManager] Error handling incoming FCM message:', error);
    }
  }

  /**
   * Show chat notification using notifee
   */
  private async showChatNotification(message: LocalMessage): Promise<void> {
    try {
      Logger.info('[WatermelonLocalChatManager] 📱 Displaying notification for message:', message.id);

      // Generate user-based chat ID for notification data
      const chatId = this.currentUserId
        ? QueryHelpers.generateChatId(message.senderId, this.currentUserId)
        : message.conversationId; // Fallback to original conversation ID

      // Create unique notification ID to prevent duplicates
      const notificationId = `chat_${message.id}_${Date.now()}`;

      await notifee.displayNotification({
        id: notificationId, // Unique ID to prevent duplicates
        title: message.senderName,
        body: message.content,
        data: {
          type: 'chat_message',
          chatId: chatId,
          conversationId: message.conversationId, // Keep for backward compatibility
          senderId: message.senderId,
          senderName: message.senderName, // Add sender name for navigation
          messageId: message.id
        },
        android: {
          channelId: 'chat',
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
          sound: 'default',
          vibrationPattern: [200, 300], // Shorter, gentler vibration
        },
        ios: {
          sound: 'default',
        },
      });

      Logger.info('[WatermelonLocalChatManager] ✅ Notification displayed successfully with ID:', notificationId);
    } catch (error) {
      Logger.error('[WatermelonLocalChatManager] ❌ Error showing notification:', error);
    }
  }

  private async sendFCMMessage(message: LocalMessage, recipientId?: string): Promise<void> {
    try {
      Logger.info('[WatermelonLocalChatManager] 🚀 Starting FCM message send process for:', message.id);

      // Use provided recipient ID or fall back to stored participant ID
      Logger.info('[WatermelonLocalChatManager] Current conversation ID:', message.conversationId);
      Logger.info('[WatermelonLocalChatManager] Current user ID:', this.currentUserId);
      Logger.info('[WatermelonLocalChatManager] Provided recipient ID:', recipientId);
      Logger.info('[WatermelonLocalChatManager] Stored participant ID:', this.currentParticipantId);

      const finalRecipientId = recipientId || this.currentParticipantId;
      if (!finalRecipientId) {
        throw new Error(`No recipient ID available for conversation: ${message.conversationId}. Make sure setCurrentConversation() was called with participantId or provide recipientId parameter.`);
      }

      Logger.info('[WatermelonLocalChatManager] ✅ Using recipient ID:', finalRecipientId);

      Logger.info('[WatermelonLocalChatManager] 🔍 Getting FCM token for recipient:', finalRecipientId);
      const recipientToken = await this.getRecipientFCMToken(finalRecipientId);
      if (!recipientToken) {
        throw new Error(`Recipient FCM token not available for user: ${finalRecipientId}`);
      }

      Logger.info('[WatermelonLocalChatManager] ✅ Got FCM token, length:', recipientToken.length);

      // Validate FCM token
      if (!DirectFCMService.isValidFCMToken(recipientToken)) {
        throw new Error(`Invalid FCM token format for user: ${finalRecipientId}`);
      }

      // Send via Firebase Cloud Function FCM API (FCM_CHAT_SERVER_URL)
      Logger.info('[WatermelonLocalChatManager] 📡 Calling FCM Chat Server API...');
      Logger.info('[WatermelonLocalChatManager] 📡 API Payload:', {
        senderId: message.senderId,
        senderName: message.senderName,
        recipientId: finalRecipientId,
        recipientTokenLength: recipientToken.length,
        conversationId: message.conversationId,
        content: message.content.substring(0, 50) + '...',
        messageType: message.messageType
      });

      const fcmResponse = await ApiService.sendChatMessage({
        senderId: message.senderId,
        senderName: message.senderName,
        recipientId: finalRecipientId,
        recipientToken: recipientToken,
        conversationId: message.conversationId,
        content: message.content,
        messageType: message.messageType,
        replyToMessageId: message.replyTo
      });

      Logger.info('[WatermelonLocalChatManager] 📡 FCM API Response:', fcmResponse);

      if (!fcmResponse.success) {
        throw new Error(`FCM Chat Server API call failed: ${JSON.stringify(fcmResponse)}`);
      }

      Logger.info('[WatermelonLocalChatManager] ✅ FCM message sent successfully via Chat Server:', fcmResponse.messageId);

    } catch (error) {
      Logger.error('[WatermelonLocalChatManager] Error sending FCM message:', error);
      throw error;
    }
  }

  /**
   * Check if an error indicates chat unavailability (FCM token issues)
   */
  private isChatUnavailableError(error: any): boolean {
    // Get error message
    const errorMessage = error.message || error.toString() || '';
    const errorLower = errorMessage.toLowerCase();

    // Get response data if available (for HTTP errors)
    const responseData = error.response?.data || error.data || {};
    const responseMessage = responseData.message || responseData.error || '';
    const responseMessageLower = responseMessage.toLowerCase();

    // Get status code
    const statusCode = error.response?.status || error.status;

    Logger.info('[WatermelonLocalChatManager] 🔍 Checking error for chat unavailability:', {
      errorMessage,
      responseMessage,
      statusCode,
      responseData
    });

    const unavailablePatterns = [
      'invalid or unregistered fcm token',
      'fcm token not found',
      'invalid fcm token',
      'unregistered fcm token',
      'token not found',
      'invalid token',
      'registration token not found',
      'messaging/registration-token-not-registered',
      'messaging/invalid-registration-token',
      'recipient fcm token not available',
      'user not found',
      'recipient not found',
      'fcm token is invalid',
      'fcm token expired',
      'token is not registered',
    ];

    // Check error message
    const messageMatch = unavailablePatterns.some(pattern => errorLower.includes(pattern));

    // Check response message
    const responseMatch = unavailablePatterns.some(pattern => responseMessageLower.includes(pattern));

    // For HTTP 400 errors, assume it's likely an FCM token issue if no specific pattern matches
    // This is a fallback for cases where the server doesn't provide detailed error messages
    const is400Error = statusCode === 400;

    const isUnavailable = messageMatch || responseMatch || is400Error;

    Logger.info('[WatermelonLocalChatManager] 🔍 Error classification result:', {
      messageMatch,
      responseMatch,
      is400Error,
      isUnavailable
    });

    return isUnavailable;
  }

  /**
   * Get recipient name for display in alerts
   */
  private async getRecipientName(recipientId: string): Promise<string> {
    try {
      // Try to get from local database first
      const user = await this.chatDb.getUserById(recipientId);
      if (user?.name) {
        return user.name;
      }

      // Try to get from cached user profiles
      const profiles = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILES);
      if (profiles) {
        const profileCache = JSON.parse(profiles);
        const cachedProfile = profileCache[recipientId];
        if (cachedProfile?.name) {
          return cachedProfile.name;
        }
      }

      // Fallback to "Unknown User"
      return 'Unknown User';
    } catch (error) {
      Logger.error('[WatermelonLocalChatManager] Error getting recipient name:', error);
      return 'Unknown User';
    }
  }

  /**
   * Get recipient FCM token
   */
  private async getRecipientFCMToken(userId: string): Promise<string | null> {
    try {
      // Validate userId format
      if (!userId || userId === 'conv' || userId === 'undefined') {
        Logger.error('[WatermelonLocalChatManager] Invalid user ID format:', userId);
        return null;
      }

      // First check local cache
      const tokens = await AsyncStorage.getItem(STORAGE_KEYS.FCM_TOKENS);
      const tokenCache = tokens ? JSON.parse(tokens) : {};

      const cachedToken = tokenCache[userId];
      if (cachedToken && new Date(cachedToken.expiresAt) > new Date()) {
        Logger.info('[WatermelonLocalChatManager] Using cached FCM token for user:', userId);
        return cachedToken.token;
      }

      // If not in cache or expired, fetch from API
      Logger.info('[WatermelonLocalChatManager] 🔄 Fetching FCM token from API for user:', userId);

      // Use the same API service that the calling system uses
      Logger.info('[WatermelonLocalChatManager] 🔄 Calling ApiService.getFCMToken with userId:', userId);
      const tokenData = await ApiService.getFCMToken(userId);
      Logger.info('[WatermelonLocalChatManager] 🔄 API response for FCM token:', tokenData);

      if (tokenData?.token) {
        // Cache the token with 24-hour expiration
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        // Update token cache
        tokenCache[userId] = {
          token: tokenData.token,
          expiresAt: expiresAt.toISOString()
        };

        // Save updated cache
        await AsyncStorage.setItem(STORAGE_KEYS.FCM_TOKENS, JSON.stringify(tokenCache));

        Logger.info('[WatermelonLocalChatManager] FCM token cached for user:', userId);
        return tokenData.token;
      }

      Logger.warn('[WatermelonLocalChatManager] FCM token not available for user:', userId);
      return null;
    } catch (error) {
      Logger.error('[WatermelonLocalChatManager] Error getting recipient FCM token:', error);
      return null;
    }
  }

  private convertMessageToLocal = (message: Message): LocalMessage => ({
    id: message.id,
    conversationId: message.chatId, // Use chatId for conversationId field
    senderId: message.senderId,
    senderName: message.senderName,
    senderAvatar: message.senderAvatar,
    content: message.content,
    messageType: message.messageType,
    createdAt: message.createdAt.toISOString(),
    status: message.status,
    tempId: message.tempId,
    replyTo: message.replyTo
  });

  private convertUserChatToLocal = (userChat: UserChat): LocalConversation => ({
    id: userChat.chatId,
    type: 'direct' as const,
    participants: [userChat.userId1, userChat.userId2],
    lastActivity: userChat.lastMessageTime?.toISOString() || userChat.createdAt.toISOString(),
    unreadCount: this.currentUserId ? userChat.getUnreadCount(this.currentUserId) : 0,
    createdAt: userChat.createdAt.toISOString(),
    updatedAt: userChat.updatedAt.toISOString()
  });

  // =====================================================
  // DUAL WRITE BACKEND SYNC METHODS
  // =====================================================

  /**
   * Queue message for backend sync (dual write pattern)
   */
  private async queueForBackendSync(message: LocalMessage, recipientId: string): Promise<void> {
    try {
      Logger.info('[WatermelonLocalChatManager] 🔄 Queuing message for backend sync:', message.id);

      // Check if user is authenticated before attempting sync
      const authToken = await AsyncStorage.getItem('accessToken');
      if (!authToken) {
        Logger.warn('[WatermelonLocalChatManager] ⚠️ No auth token available, skipping backend sync. Message saved locally and sent via FCM.');
        return;
      }

      // Prepare message data for backend
      const backendMessageData = {
        tempId: message.tempId,
        chatId: message.conversationId, // conversationId is chatId in user-based system
        recipientId: recipientId,
        content: message.content,
        messageType: message.messageType,
        timestamp: message.createdAt,
        replyToMessageId: message.replyTo
      };

      // Send to backend API
      await this.syncMessageToBackend(backendMessageData);
      Logger.info('[WatermelonLocalChatManager] ✅ Message synced to backend successfully:', message.id);

    } catch (error) {
      Logger.error('[WatermelonLocalChatManager] ❌ Failed to sync message to backend:', error);
      // Don't throw error to avoid breaking the main flow
      // The message is already stored locally and sent via FCM
    }
  }

  /**
   * Sync individual message to backend
   */
  private async syncMessageToBackend(messageData: any): Promise<void> {
    try {
      const authToken = await AsyncStorage.getItem('accessToken');
      if (!authToken) {
        throw new Error('No auth token available');
      }

      const response = await fetch(`${API_BASE_URL}/api/chat/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(messageData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Backend sync failed: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      Logger.info('[WatermelonLocalChatManager] 📤 Backend sync response:', result);

      // Update local message with server ID if provided
      if (result.data?.message?.id && messageData.tempId) {
        await this.updateMessageWithServerId(messageData.tempId, result.data.message.id);
      }

    } catch (error) {
      Logger.error('[WatermelonLocalChatManager] ❌ Backend sync API call failed:', error);
      throw error;
    }
  }

  /**
   * Update local message with server ID
   */
  private async updateMessageWithServerId(tempId: string, serverId: string): Promise<void> {
    try {
      // Find message by tempId and update with server ID
      const messages = await QueryHelpers.getMessagesByTempId(tempId);
      if (messages.length > 0) {
        const message = messages[0];
        await this.chatDb.database.write(async () => {
          await message.update((msg: any) => {
            msg._raw.external_id = serverId;
          });
        });
        Logger.info('[WatermelonLocalChatManager] ✅ Updated message with server ID:', { tempId, serverId });
      }
    } catch (error) {
      Logger.error('[WatermelonLocalChatManager] ❌ Failed to update message with server ID:', error);
    }
  }

  /**
   * Sync pending messages to backend (batch sync)
   */
  async syncPendingMessagesToBackend(): Promise<void> {
    try {
      Logger.info('[WatermelonLocalChatManager] 🔄 Starting batch sync of pending messages');

      // Get messages with 'sending' or 'sent' status that haven't been synced
      const pendingMessages = await QueryHelpers.getMessagesByStatus('sending');
      const sentMessages = await QueryHelpers.getMessagesByStatus('sent');

      const allPendingMessages = [...pendingMessages, ...sentMessages].filter((msg: any) =>
        !msg._raw.external_id // Only sync messages without server ID
      );

      if (allPendingMessages.length === 0) {
        Logger.info('[WatermelonLocalChatManager] ✅ No pending messages to sync');
        return;
      }

      Logger.info('[WatermelonLocalChatManager] 📤 Syncing', allPendingMessages.length, 'pending messages');

      // Prepare messages for batch sync
      const messagesToSync = allPendingMessages.map(msg => ({
        tempId: msg.tempId,
        chatId: msg.chatId,
        recipientId: msg.recipientId,
        content: msg.content,
        messageType: msg.messageType,
        timestamp: msg.createdAt.toISOString()
      }));

      // Send batch sync request
      await this.batchSyncToBackend(messagesToSync);
      Logger.info('[WatermelonLocalChatManager] ✅ Batch sync completed successfully');

    } catch (error) {
      Logger.error('[WatermelonLocalChatManager] ❌ Batch sync failed:', error);
      throw error;
    }
  }

  /**
   * Batch sync messages to backend
   */
  private async batchSyncToBackend(messages: any[]): Promise<void> {
    try {
      const authToken = await AsyncStorage.getItem('accessToken');
      if (!authToken) {
        throw new Error('No auth token available');
      }

      const response = await fetch(`${API_BASE_URL}/api/chat/sync-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ messages })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Batch sync failed: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      Logger.info('[WatermelonLocalChatManager] 📤 Batch sync response:', result);

      // Update local messages with server IDs
      if (result.data?.syncResults) {
        for (const syncResult of result.data.syncResults) {
          if (syncResult.status === 'synced' && syncResult.tempId && syncResult.serverId) {
            await this.updateMessageWithServerId(syncResult.tempId, syncResult.serverId);
          }
        }
      }

    } catch (error) {
      Logger.error('[WatermelonLocalChatManager] ❌ Batch sync API call failed:', error);
      throw error;
    }
  }

  /**
   * Pull messages from backend for a chat
   */
  async pullMessagesFromBackend(chatId: string, page: number = 1): Promise<LocalMessage[]> {
    try {
      Logger.info('[WatermelonLocalChatManager] 📥 Pulling messages from backend for chat:', chatId);

      const authToken = await AsyncStorage.getItem('accessToken');
      if (!authToken) {
        throw new Error('No auth token available');
      }

      const response = await fetch(`${API_BASE_URL}/api/chat/messages/${chatId}?page=${page}&limit=50`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to pull messages: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      const backendMessages = result.data?.messages || [];

      Logger.info('[WatermelonLocalChatManager] 📥 Pulled', backendMessages.length, 'messages from backend');

      // Convert backend messages to local format and merge with local database
      const localMessages: LocalMessage[] = [];
      for (const backendMsg of backendMessages) {
        try {
          // Check if message already exists locally
          const existingMessage = await QueryHelpers.getMessageById(String(backendMsg.id));

          if (!existingMessage) {
            // Create new local message from backend data
            const localMessage = await this.createMessageFromBackend(backendMsg);
            localMessages.push(this.convertMessageToLocal(localMessage));
          }
        } catch (error) {
          Logger.error('[WatermelonLocalChatManager] ❌ Failed to process backend message:', error);
        }
      }

      Logger.info('[WatermelonLocalChatManager] ✅ Successfully merged', localMessages.length, 'new messages from backend');
      return localMessages;

    } catch (error) {
      Logger.error('[WatermelonLocalChatManager] ❌ Failed to pull messages from backend:', error);
      throw error;
    }
  }

  /**
   * Create local message from backend data
   */
  private async createMessageFromBackend(backendMessage: any): Promise<Message> {
    try {
      const messageData = {
        id: String(backendMessage.id),
        chatId: backendMessage.chat_id,
        senderId: String(backendMessage.sender_id),
        recipientId: String(backendMessage.recipient_id),
        senderName: backendMessage.sender_name,
        senderAvatar: backendMessage.sender_avatar,
        content: backendMessage.content,
        messageType: backendMessage.message_type as any,
        status: backendMessage.status as any,
        tempId: backendMessage.temp_id,
        replyTo: backendMessage.reply_to_message_id ? String(backendMessage.reply_to_message_id) : undefined
      };

      const message = await this.chatDb.createMessage(messageData);
      Logger.info('[WatermelonLocalChatManager] ✅ Created local message from backend data:', message.id);

      return message;
    } catch (error) {
      Logger.error('[WatermelonLocalChatManager] ❌ Failed to create message from backend data:', error);
      throw error;
    }
  }
}
