/**
 * Local Chat Manager
 * 
 * Core service for local-only chat functionality using AsyncStorage
 * and direct FCM messaging without backend dependencies.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import { DirectFCMService } from './DirectFCMService';
import ApiService from './ApiService';
import Logger from '../utils/LogUtils';

// Storage keys
export const STORAGE_KEYS = {
  CONVERSATIONS: '@fcm_chat_conversations',
  MESSAGES_PREFIX: '@fcm_chat_messages_',
  USER_PROFILES: '@fcm_chat_user_profiles',
  UNREAD_COUNTS: '@fcm_chat_unread_counts',
  LAST_SYNC: '@fcm_chat_last_sync',
  FCM_TOKENS: '@fcm_chat_fcm_tokens',
  MESSAGE_QUEUE: '@fcm_chat_message_queue'
};

// Data structures
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

export interface CachedUserProfile {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  fcmToken?: string;
  lastUpdated: string;
}

export interface QueuedMessage {
  message: LocalMessage;
  retryCount: number;
  nextRetryAt: string;
  maxRetries: number;
}

export interface LocalChatEventHandlers {
  onMessageReceived?: (message: LocalMessage) => void;
  onMessageSent?: (message: LocalMessage) => void;
  onConversationUpdated?: (conversation: LocalConversation) => void;
  onUnreadCountChanged?: (conversationId: string, count: number) => void;
}

export class LocalChatManager {
  private static instance: LocalChatManager;
  private currentUserId: string | null = null;
  private currentUserName: string | null = null;
  private isInitialized = false;
  private activeConversationId: string | null = null;
  private fcmService: DirectFCMService;
  private eventHandlers: LocalChatEventHandlers = {};

  private constructor() {
    this.fcmService = DirectFCMService.getInstance();
  }

  static getInstance(): LocalChatManager {
    if (!LocalChatManager.instance) {
      LocalChatManager.instance = new LocalChatManager();
    }
    return LocalChatManager.instance;
  }

  /**
   * Initialize the chat manager
   */
  async initialize(userId: string, userName: string, eventHandlers: LocalChatEventHandlers = {}): Promise<void> {
    try {
      this.currentUserId = userId;
      this.currentUserName = userName;
      this.eventHandlers = eventHandlers;

      // Initialize DirectFCMService
      await this.fcmService.initialize();

      // Initialize storage structure
      await this.initializeStorage();

      // Setup FCM message handler
      await this.setupFCMHandler();

      this.isInitialized = true;
      console.log('[LocalChatManager] Initialized successfully');
    } catch (error) {
      console.error('[LocalChatManager] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Generate deterministic conversation ID
   */
  generateConversationId(userId1: string, userId2: string): string {
    const participants = [userId1, userId2].sort();
    return `conv_${participants[0]}_${participants[1]}`;
  }

  /**
   * Create or get conversation
   */
  async createOrGetConversation(participantId: string): Promise<string> {
    if (!this.currentUserId) throw new Error('Chat manager not initialized');

    const conversationId = this.generateConversationId(this.currentUserId, participantId);
    
    // Check if conversation exists
    const conversations = await this.getConversations();
    const existingConversation = conversations.find(c => c.id === conversationId);
    
    if (existingConversation) {
      return conversationId;
    }

    // Create new conversation
    const newConversation: LocalConversation = {
      id: conversationId,
      type: 'direct',
      participants: [this.currentUserId, participantId],
      lastActivity: new Date().toISOString(),
      unreadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save conversation
    conversations.push(newConversation);
    await AsyncStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));

    Logger.log('[LocalChatManager] Created new conversation:', conversationId);
    return conversationId;
  }

  /**
   * Send message
   */
  async sendMessage(conversationId: string, content: string, replyTo?: string): Promise<LocalMessage> {
    if (!this.currentUserId || !this.currentUserName) {
      throw new Error('Chat manager not initialized');
    }

    // Create optimistic message
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const optimisticMessage: LocalMessage = {
      id: tempId,
      conversationId,
      senderId: this.currentUserId,
      senderName: this.currentUserName,
      content: content.trim(),
      messageType: 'text',
      createdAt: new Date().toISOString(),
      status: 'sending',
      tempId,
      replyTo
    };

    // Save message locally immediately
    await this.saveMessageToLocal(optimisticMessage);

    // Send via FCM
    try {
      await this.sendFCMMessage(optimisticMessage);

      // Update status to sent
      optimisticMessage.status = 'sent';
      await this.updateMessageInLocal(optimisticMessage);

      // Emit message sent event
      this.eventHandlers.onMessageSent?.(optimisticMessage);

    } catch (error) {
      console.error('[LocalChatManager] Failed to send FCM message:', error);

      // Update status to failed and add to retry queue
      optimisticMessage.status = 'sending';
      await this.addToRetryQueue(optimisticMessage);
    }

    return optimisticMessage;
  }

  /**
   * Get conversations
   */
  async getConversations(): Promise<LocalConversation[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[LocalChatManager] Error getting conversations:', error);
      return [];
    }
  }

  /**
   * Get messages for conversation
   */
  async getMessages(conversationId: string): Promise<LocalMessage[]> {
    try {
      const key = `${STORAGE_KEYS.MESSAGES_PREFIX}${conversationId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[LocalChatManager] Error getting messages:', error);
      return [];
    }
  }

  /**
   * Set active conversation (for notification management)
   */
  setActiveConversation(conversationId: string | null): void {
    this.activeConversationId = conversationId;
    Logger.log('[LocalChatManager] Active conversation set to:', conversationId);
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: string): Promise<void> {
    try {
      const messages = await this.getMessages(conversationId);
      const updatedMessages = messages.map(msg => ({
        ...msg,
        status: msg.status === 'delivered' ? 'read' : msg.status
      }));

      const key = `${STORAGE_KEYS.MESSAGES_PREFIX}${conversationId}`;
      await AsyncStorage.setItem(key, JSON.stringify(updatedMessages));

      // Reset unread count
      await this.updateUnreadCount(conversationId, 0);

      // Emit unread count changed event
      this.eventHandlers.onUnreadCountChanged?.(conversationId, 0);

    } catch (error) {
      console.error('[LocalChatManager] Error marking messages as read:', error);
    }
  }

  /**
   * Get unread count for conversation
   */
  async getUnreadCount(conversationId: string): Promise<number> {
    try {
      const unreadCounts = await AsyncStorage.getItem(STORAGE_KEYS.UNREAD_COUNTS);
      const counts = unreadCounts ? JSON.parse(unreadCounts) : {};
      return counts[conversationId] || 0;
    } catch (error) {
      console.error('[LocalChatManager] Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Initialize storage structure
   */
  private async initializeStorage(): Promise<void> {
    try {
      // Initialize conversations if not exists
      const conversations = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      if (!conversations) {
        await AsyncStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify([]));
      }

      // Initialize other storage structures
      const storageInits = [
        [STORAGE_KEYS.USER_PROFILES, JSON.stringify({})],
        [STORAGE_KEYS.UNREAD_COUNTS, JSON.stringify({})],
        [STORAGE_KEYS.FCM_TOKENS, JSON.stringify({})],
        [STORAGE_KEYS.MESSAGE_QUEUE, JSON.stringify([])],
        [STORAGE_KEYS.LAST_SYNC, JSON.stringify(Date.now())]
      ];

      for (const [key, defaultValue] of storageInits) {
        const existing = await AsyncStorage.getItem(key);
        if (!existing) {
          await AsyncStorage.setItem(key, defaultValue);
        }
      }

      console.log('[LocalChatManager] Storage structure initialized');
    } catch (error) {
      console.error('[LocalChatManager] Error initializing storage:', error);
      throw error;
    }
  }

  /**
   * Setup FCM message handler
   */
  private async setupFCMHandler(): Promise<void> {
    try {
      // Handle foreground messages
      messaging().onMessage(async (remoteMessage) => {
        await this.handleIncomingFCMMessage(remoteMessage);
      });

      // Handle background messages
      messaging().setBackgroundMessageHandler(async (remoteMessage) => {
        await this.handleIncomingFCMMessage(remoteMessage);
      });

      console.log('[LocalChatManager] FCM handler setup complete');
    } catch (error) {
      console.error('[LocalChatManager] Error setting up FCM handler:', error);
      throw error;
    }
  }

  /**
   * Handle incoming FCM message
   */
  private async handleIncomingFCMMessage(remoteMessage: any): Promise<void> {
    try {
      const { data } = remoteMessage;

      if (data?.type !== 'chat_message') return;

      const incomingMessage: LocalMessage = {
        id: data.messageId,
        conversationId: data.conversationId,
        senderId: data.senderId,
        senderName: data.senderName,
        content: data.content,
        messageType: 'text',
        createdAt: data.timestamp,
        status: 'delivered'
      };

      // Save message locally
      await this.saveMessageToLocal(incomingMessage);

      // Update conversation
      await this.updateConversationLastMessage(data.conversationId, incomingMessage);

      // Emit message received event for real-time UI updates
      this.eventHandlers.onMessageReceived?.(incomingMessage);

      // Handle notifications and unread counts
      if (this.activeConversationId === data.conversationId) {
        // User is in this chat - don't show notification, don't increment unread
        console.log('[LocalChatManager] Message received in active chat - real-time UI update');
      } else {
        // User is not in this chat - show notification and increment unread
        await this.incrementUnreadCount(data.conversationId);

        // Get updated unread count and emit event
        const unreadCount = await this.getUnreadCount(data.conversationId);
        this.eventHandlers.onUnreadCountChanged?.(data.conversationId, unreadCount);

        console.log('[LocalChatManager] Message received - showing notification');
      }

    } catch (error) {
      console.error('[LocalChatManager] Error handling incoming FCM message:', error);
    }
  }

  /**
   * Save message to local storage
   */
  private async saveMessageToLocal(message: LocalMessage): Promise<void> {
    try {
      const key = `${STORAGE_KEYS.MESSAGES_PREFIX}${message.conversationId}`;
      const messages = await this.getMessages(message.conversationId);

      // Check for duplicates
      const existingIndex = messages.findIndex(m =>
        m.id === message.id || m.tempId === message.tempId
      );

      if (existingIndex >= 0) {
        messages[existingIndex] = message;
      } else {
        messages.push(message);
      }

      // Sort by timestamp
      messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      await AsyncStorage.setItem(key, JSON.stringify(messages));
    } catch (error) {
      console.error('[LocalChatManager] Error saving message:', error);
      throw error;
    }
  }

  /**
   * Update message in local storage
   */
  private async updateMessageInLocal(message: LocalMessage): Promise<void> {
    await this.saveMessageToLocal(message);
  }

  /**
   * Send FCM message directly
   */
  private async sendFCMMessage(message: LocalMessage): Promise<void> {
    try {
      // Get recipient FCM token
      // Conversation ID format: conv_userId1_userId2
      const conversationParts = message.conversationId.split('_');
      Logger.log('[LocalChatManager] Conversation ID parts:', conversationParts);
      Logger.log('[LocalChatManager] Current user ID:', this.currentUserId);

      // Skip the 'conv' prefix and find the user ID that's not the current user
      const recipientId = conversationParts.slice(1).find(id => id !== this.currentUserId);
      Logger.log('[LocalChatManager] Extracted recipient ID:', recipientId);

      if (!recipientId) throw new Error('Could not determine recipient');

      const recipientToken = await this.getRecipientFCMToken(recipientId);
      if (!recipientToken) throw new Error('Recipient FCM token not available');

      // Validate FCM token
      if (!DirectFCMService.isValidFCMToken(recipientToken)) {
        throw new Error('Invalid FCM token format');
      }

      // Create FCM payload using DirectFCMService
      const fcmPayload = DirectFCMService.createChatMessagePayload(
        recipientToken,
        message.senderId,
        message.senderName,
        message.conversationId,
        message.content,
        message.id
      );

      // Send via DirectFCMService
      const result = await this.fcmService.sendMessage(fcmPayload);

      if (!result.success) {
        throw new Error(result.error || 'FCM send failed');
      }

      console.log('[LocalChatManager] FCM message sent successfully:', result.messageId);

    } catch (error) {
      console.error('[LocalChatManager] Error sending FCM message:', error);
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
        Logger.error('[LocalChatManager] Invalid user ID format:', userId);
        return null;
      }

      // First check local cache
      const tokens = await AsyncStorage.getItem(STORAGE_KEYS.FCM_TOKENS);
      const tokenCache = tokens ? JSON.parse(tokens) : {};

      const cachedToken = tokenCache[userId];
      if (cachedToken && new Date(cachedToken.expiresAt) > new Date()) {
        Logger.log('[LocalChatManager] Using cached FCM token for user:', userId);
        return cachedToken.token;
      }

      // If not in cache or expired, fetch from API
      Logger.log('[LocalChatManager] Fetching FCM token from API for user:', userId);

      // Use the same API service that the calling system uses
      Logger.log('[LocalChatManager] Calling ApiService.getFCMToken with userId:', userId);
      const tokenData = await ApiService.getFCMToken(userId);
      Logger.log('[LocalChatManager] API response for FCM token:', tokenData);

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

        Logger.log('[LocalChatManager] FCM token cached for user:', userId);
        return tokenData.token;
      }

      Logger.warn('[LocalChatManager] FCM token not available for user:', userId);
      return null;
    } catch (error) {
      Logger.error('[LocalChatManager] Error getting recipient FCM token:', error);
      return null;
    }
  }

  /**
   * Update conversation last message
   */
  private async updateConversationLastMessage(conversationId: string, message: LocalMessage): Promise<void> {
    try {
      const conversations = await this.getConversations();
      const conversationIndex = conversations.findIndex(c => c.id === conversationId);

      if (conversationIndex >= 0) {
        conversations[conversationIndex].lastMessage = message;
        conversations[conversationIndex].lastActivity = message.createdAt;
        conversations[conversationIndex].updatedAt = new Date().toISOString();

        await AsyncStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
      }
    } catch (error) {
      console.error('[LocalChatManager] Error updating conversation last message:', error);
    }
  }

  /**
   * Increment unread count
   */
  private async incrementUnreadCount(conversationId: string): Promise<void> {
    try {
      const unreadCounts = await AsyncStorage.getItem(STORAGE_KEYS.UNREAD_COUNTS);
      const counts = unreadCounts ? JSON.parse(unreadCounts) : {};

      counts[conversationId] = (counts[conversationId] || 0) + 1;

      await AsyncStorage.setItem(STORAGE_KEYS.UNREAD_COUNTS, JSON.stringify(counts));
    } catch (error) {
      console.error('[LocalChatManager] Error incrementing unread count:', error);
    }
  }

  /**
   * Update unread count
   */
  private async updateUnreadCount(conversationId: string, count: number): Promise<void> {
    try {
      const unreadCounts = await AsyncStorage.getItem(STORAGE_KEYS.UNREAD_COUNTS);
      const counts = unreadCounts ? JSON.parse(unreadCounts) : {};

      counts[conversationId] = count;

      await AsyncStorage.setItem(STORAGE_KEYS.UNREAD_COUNTS, JSON.stringify(counts));
    } catch (error) {
      console.error('[LocalChatManager] Error updating unread count:', error);
    }
  }

  /**
   * Add message to retry queue
   */
  private async addToRetryQueue(message: LocalMessage): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem(STORAGE_KEYS.MESSAGE_QUEUE);
      const queue: QueuedMessage[] = queueData ? JSON.parse(queueData) : [];

      const queuedMessage: QueuedMessage = {
        message,
        retryCount: 0,
        nextRetryAt: new Date(Date.now() + 1000).toISOString(), // Retry in 1 second
        maxRetries: 5
      };

      queue.push(queuedMessage);
      await AsyncStorage.setItem(STORAGE_KEYS.MESSAGE_QUEUE, JSON.stringify(queue));

      console.log('[LocalChatManager] Message added to retry queue:', message.id);
    } catch (error) {
      console.error('[LocalChatManager] Error adding to retry queue:', error);
    }
  }
}
