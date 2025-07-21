/**
 * WatermelonDB Local Chat Manager
 * 
 * Enhanced version of LocalChatManager using WatermelonDB for persistent storage.
 * Provides the same API interface while leveraging WatermelonDB's reactive capabilities.
 */

import messaging from '@react-native-firebase/messaging';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DirectFCMService } from './DirectFCMService';
import { WatermelonChatDatabase } from '../database/services/WatermelonChatDatabase';
import { QueryHelpers } from '../database/services/QueryHelpers';
import { SyncService } from '../database/services/SyncService';
import { initializeDatabase } from '../database';
import Logger from '../utils/LogUtils';
import type { Message } from '../database/models/Message';
import type { Conversation } from '../database/models/Conversation';
import type { User } from '../database/models/User';

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
  private eventHandlers: LocalChatEventHandlers = {};
  private isInitialized: boolean = false;

  constructor() {
    this.chatDb = new WatermelonChatDatabase();
    this.syncService = new SyncService();
    this.fcmService = DirectFCMService.getInstance();
  }

  /**
   * Initialize the chat manager
   */
  async initialize(userId: string, userName: string, eventHandlers: LocalChatEventHandlers = {}): Promise<void> {
    try {
      Logger.info('[WatermelonLocalChatManager] Initializing...');

      this.currentUserId = userId;
      this.currentUserName = userName;
      this.eventHandlers = eventHandlers;

      // Initialize WatermelonDB
      await initializeDatabase();

      // Initialize DirectFCMService
      await this.fcmService.initialize();

      // Create or update current user
      await this.ensureCurrentUser();

      // Setup FCM message handler
      await this.setupFCMHandler();

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
        Logger.info('[WatermelonLocalChatManager] FCM message sent successfully:', messageId);
        // Update status to sent
        await this.chatDb.updateMessageStatus(messageId, 'sent');

        // Emit updated message with sent status
        const updatedMessage = { ...localMessage, status: 'sent' as const };
        this.eventHandlers.onMessageSent?.(updatedMessage);
      })
      .catch((error) => {
        Logger.error('[WatermelonLocalChatManager] Failed to send FCM message:', error);
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
  setCurrentConversation(conversationId: string | null): void {
    this.currentConversationId = conversationId;
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
    messaging().onMessage(async (remoteMessage) => {
      if (remoteMessage.data?.type === 'chat_message') {
        await this.handleIncomingFCMMessage(remoteMessage);
      }
    });

    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      if (remoteMessage.data?.type === 'chat_message') {
        await this.handleIncomingFCMMessage(remoteMessage);
      }
    });
  }

  private async handleIncomingFCMMessage(remoteMessage: any): Promise<void> {
    try {
      const messageData = remoteMessage.data;
      
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
        // Don't show notification if user is viewing this conversation
        if (this.currentConversationId !== messageData.conversationId) {
          // Handle notification display
          this.eventHandlers.onMessageReceived?.({
            id: messageData.messageId,
            conversationId: messageData.conversationId,
            senderId: messageData.senderId,
            senderName: messageData.senderName,
            content: messageData.content,
            messageType: messageData.messageType || 'text',
            status: 'delivered',
            createdAt: messageData.timestamp || new Date().toISOString()
          });
        }
      }

    } catch (error) {
      Logger.error('[WatermelonLocalChatManager] Error handling incoming FCM message:', error);
    }
  }

  private async sendFCMMessage(message: LocalMessage): Promise<void> {
    // Implementation would depend on how FCM tokens are managed
    // This is a placeholder for the FCM sending logic
    Logger.info('[WatermelonLocalChatManager] Sending FCM message:', message.id);
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
