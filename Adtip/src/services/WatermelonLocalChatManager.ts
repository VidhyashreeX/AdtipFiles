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
import ApiService from './ApiService';
import Logger from '../utils/LogUtils';
import type { Message } from '../database/models/Message';
import type { Conversation } from '../database/models/Conversation';
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
  status: 'sending' | 'sent' | 'delivered' | 'read';
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

export interface LocalChatEventHandlers {
  onMessageReceived?: (message: LocalMessage) => void;
  onMessageSent?: (message: LocalMessage) => void;
  onConversationUpdated?: (conversation: LocalConversation) => void;
  onUnreadCountChanged?: (count: number) => void;
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
      // Handle notification press events
      notifee.onForegroundEvent(async ({ type, detail }) => {
        if (type === EventType.PRESS) {
          const data = detail.notification?.data;
          if (data?.type === 'chat_message' && data?.conversationId && data?.senderId) {
            Logger.info('[WatermelonLocalChatManager] 📱 Notification pressed, opening conversation:', data.conversationId);
            // Get sender name from notification title (which is the sender name)
            const senderName = detail.notification?.title || 'Unknown User';
            await this.navigateToConversation(String(data.conversationId), String(data.senderId), senderName);
          }
        }
      });

      Logger.info('[WatermelonLocalChatManager] Notification handlers setup complete');
    } catch (error) {
      Logger.error('[WatermelonLocalChatManager] Failed to setup notification handlers:', error);
    }
  }

  /**
   * Navigate to conversation from notification
   */
  private async navigateToConversation(conversationId: string, senderId: string, senderName?: string): Promise<void> {
    try {
      Logger.info('[WatermelonLocalChatManager] 🧭 Navigating to conversation:', conversationId, 'from sender:', senderId);

      // Use provided sender name or try to get from database
      let finalSenderName = senderName;
      if (!finalSenderName || finalSenderName === 'Unknown User') {
        const senderUser = await this.chatDb.getUserById(senderId);
        finalSenderName = senderUser?.name || senderName || 'Unknown User';
      }

      Logger.info('[WatermelonLocalChatManager] 🧭 Sender info:', { senderId, senderName: finalSenderName });

      // Navigate to FCMChatScreen with sender info
      // The FCMChatScreen will create/get the conversation with this participant
      // and should load the existing conversation that contains the message
      if (navigationRef.isReady()) {
        const currentRoute = navigationRef.getCurrentRoute();
        Logger.info('[WatermelonLocalChatManager] 🧭 Current route:', currentRoute?.name);

        // Store the target conversation ID for the FCMChatScreen to use
        await AsyncStorage.setItem('targetConversationId', conversationId);

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
      Logger.error('[WatermelonLocalChatManager] ❌ Error navigating to conversation:', error);
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
      if (!options?.disableFCMHandlers) {
        await this.setupFCMHandler();
        await this.setupNotificationHandlers();
      } else {
        Logger.info('[WatermelonLocalChatManager] FCM handlers disabled - skipping FCM setup to prevent conflicts');
      }

      // Perform initial sync
      await this.syncService.performSync(userId);

      this.isInitialized = true;
      Logger.info('[WatermelonLocalChatManager] Initialized successfully');

    } catch (error) {
      Logger.error('[WatermelonLocalChatManager] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get conversations with reactive updates
   */
  observeConversations(): Observable<LocalConversation[]> {
    if (!this.currentUserId) {
      throw new Error('Chat manager not initialized');
    }

    return QueryHelpers.observeActiveConversations(this.currentUserId)
      .pipe(
        map(conversations => conversations.map(this.convertConversationToLocal))
      );
  }

  /**
   * Get messages for a conversation with reactive updates
   */
  observeMessages(conversationId: string, limit: number = 50): Observable<LocalMessage[]> {
    return QueryHelpers.observeConversationMessages(conversationId, limit)
      .pipe(
        map(messages => messages.map(this.convertMessageToLocal))
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

    const message = await this.chatDb.createMessage({
      id: messageId,
      conversationId,
      senderId: this.currentUserId,
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

    // Send via FCM in background
    this.sendFCMMessage(localMessage)
      .then(async () => {
        Logger.info('[WatermelonLocalChatManager] ✅ FCM API call completed successfully for message:', messageId);
        // Update status to sent
        await this.chatDb.updateMessageStatus(messageId, 'sent');

        // Emit updated message with sent status
        const updatedMessage = { ...localMessage, status: 'sent' as const };
        this.eventHandlers.onMessageSent?.(updatedMessage);
      })
      .catch((error) => {
        Logger.error('[WatermelonLocalChatManager] ❌ Failed to send FCM message via API:', error);
        Logger.error('[WatermelonLocalChatManager] ❌ Error details:', {
          messageId,
          conversationId: localMessage.conversationId,
          recipientId: 'extracted from conversation',
          errorMessage: error.message,
          errorStack: error.stack
        });
        // Message remains in 'sending' status for retry
      });

    return localMessage;
  }

  /**
   * Create or get conversation
   */
  async createOrGetConversation(participantId: string): Promise<string> {
    if (!this.currentUserId) {
      throw new Error('Chat manager not initialized');
    }

    // Check if direct conversation already exists
    const existingConversation = await QueryHelpers.getDirectConversation(
      this.currentUserId,
      participantId
    );

    if (existingConversation) {
      return existingConversation.id;
    }

    // Create new conversation
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const conversation = await this.chatDb.createConversation({
      id: conversationId,
      type: 'direct',
      participantIds: [this.currentUserId, participantId]
    });

    return conversation.id;
  }

  /**
   * Mark conversation as read
   */
  async markAsRead(conversationId: string, messageId?: string): Promise<void> {
    if (!this.currentUserId) return;

    await this.chatDb.markConversationAsRead(conversationId, this.currentUserId, messageId);
    
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
   * Mark messages as read in a conversation
   */
  async markMessagesAsRead(conversationId: string): Promise<void> {
    if (!this.currentUserId) return;

    try {
      // Mark conversation as read
      await this.chatDb.markConversationAsRead(conversationId, this.currentUserId);

      // Update unread count
      const unreadCount = await QueryHelpers.getTotalUnreadCount(this.currentUserId);
      this.eventHandlers.onUnreadCountChanged?.(unreadCount);

      Logger.info('[WatermelonLocalChatManager] Marked messages as read for conversation:', conversationId);
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

      const success = await this.syncService.handleIncomingMessage(messageData);

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
   * Get conversation participants with user details
   */
  async getConversationParticipants(conversationId: string): Promise<User[]> {
    try {
      const participants = await this.chatDb.getConversationParticipants(conversationId);
      const users: User[] = [];

      for (const participant of participants) {
        const user = await this.chatDb.getUserById(participant.userId);
        if (user) {
          users.push(user);
        }
      }

      return users;
    } catch (error) {
      Logger.error('[WatermelonLocalChatManager] Error getting conversation participants:', error);
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
   * Get conversation by ID
   */
  async getConversationById(conversationId: string): Promise<LocalConversation | null> {
    const conversation = await this.chatDb.getConversationById(conversationId);
    return conversation ? this.convertConversationToLocal(conversation) : null;
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
      });

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

      await notifee.displayNotification({
        title: message.senderName,
        body: message.content,
        data: {
          type: 'chat_message',
          conversationId: message.conversationId,
          senderId: message.senderId,
          messageId: message.id
        },
        android: {
          channelId: 'chat',
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
          sound: 'default',
          vibrationPattern: [300, 500, 300, 500],
        },
        ios: {
          sound: 'default',
        },
      });

      Logger.info('[WatermelonLocalChatManager] ✅ Notification displayed successfully');
    } catch (error) {
      Logger.error('[WatermelonLocalChatManager] ❌ Error showing notification:', error);
    }
  }

  private async sendFCMMessage(message: LocalMessage): Promise<void> {
    try {
      Logger.info('[WatermelonLocalChatManager] 🚀 Starting FCM message send process for:', message.id);

      // Get recipient ID from stored participant ID (from TipCallScreenSimple contact card)
      Logger.info('[WatermelonLocalChatManager] Current conversation ID:', message.conversationId);
      Logger.info('[WatermelonLocalChatManager] Current user ID:', this.currentUserId);
      Logger.info('[WatermelonLocalChatManager] Stored participant ID:', this.currentParticipantId);

      const recipientId = this.currentParticipantId;
      if (!recipientId) {
        throw new Error(`No participant ID available for conversation: ${message.conversationId}. Make sure setCurrentConversation() was called with participantId.`);
      }

      Logger.info('[WatermelonLocalChatManager] ✅ Using recipient ID from contact card:', recipientId);

      Logger.info('[WatermelonLocalChatManager] 🔍 Getting FCM token for recipient:', recipientId);
      const recipientToken = await this.getRecipientFCMToken(recipientId);
      if (!recipientToken) {
        throw new Error(`Recipient FCM token not available for user: ${recipientId}`);
      }

      Logger.info('[WatermelonLocalChatManager] ✅ Got FCM token, length:', recipientToken.length);

      // Validate FCM token
      if (!DirectFCMService.isValidFCMToken(recipientToken)) {
        throw new Error(`Invalid FCM token format for user: ${recipientId}`);
      }

      // Send via Firebase Cloud Function FCM API (FCM_CHAT_SERVER_URL)
      Logger.info('[WatermelonLocalChatManager] 📡 Calling FCM Chat Server API...');
      Logger.info('[WatermelonLocalChatManager] 📡 API Payload:', {
        senderId: message.senderId,
        senderName: message.senderName,
        recipientId: recipientId,
        recipientTokenLength: recipientToken.length,
        conversationId: message.conversationId,
        content: message.content.substring(0, 50) + '...',
        messageType: message.messageType
      });

      const fcmResponse = await ApiService.sendChatMessage({
        senderId: message.senderId,
        senderName: message.senderName,
        recipientId: recipientId,
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
    conversationId: message.conversationId,
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

  private convertConversationToLocal = (conversation: Conversation): LocalConversation => ({
    id: conversation.id,
    type: conversation.type,
    participants: [], // Would need to fetch participants
    lastActivity: conversation.lastActivity.toISOString(),
    unreadCount: conversation.unreadCount,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString()
  });
}
