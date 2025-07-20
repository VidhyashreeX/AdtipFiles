/**
 * FCM-based Chat Service for React Native
 * 
 * This service handles chat functionality using FCM high priority notifications
 * for reliable message delivery, replacing Socket.IO with API-based messaging.
 * 
 * Features:
 * - FCM high priority notifications for real-time messaging
 * - Local database persistence with AsyncStorage
 * - Offline message queuing and synchronization
 * - Message status tracking
 * - Background message handling
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { AppState, AppStateStatus } from 'react-native';
import ApiService from './ApiService';
import { API_BASE_URL } from '../constants/api';
import { CHAT_ENDPOINTS, FCM_CHAT_ENDPOINTS } from '../constants/apiEndpoints';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageType: 'text' | 'image' | 'video' | 'audio' | 'file';
  createdAt: string;
  tempId?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  replyTo?: string;
  deliveryStatus?: 'pending' | 'sent' | 'delivered' | 'failed';
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  title?: string;
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  lastMessage?: Message;
  unreadCount: number;
  lastActivity: string;
}

interface FCMChatEventHandlers {
  onMessageReceived?: (message: Message) => void;
  onMessageSent?: (message: Message) => void;
  onMessageDelivered?: (messageId: string) => void;
  onMessageRead?: (messageId: string, readBy: string) => void;
  onConversationUpdated?: (conversation: Conversation) => void;
  onTypingStart?: (conversationId: string, userId: string) => void;
  onTypingStop?: (conversationId: string, userId: string) => void;
}

class FCMChatService {
  private static instance: FCMChatService;
  private currentUserId: string | null = null;
  private authToken: string | null = null;
  private eventHandlers: FCMChatEventHandlers = {};
  private messageQueue: Message[] = [];
  private appState: AppStateStatus = 'active';
  private isInitialized = false;
  private fcmUnsubscribe: (() => void) | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private appStateSubscription: any = null;

  private constructor() {
    // Monitor app state changes using the new subscription-based API
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
  }

  public static getInstance(): FCMChatService {
    if (!FCMChatService.instance) {
      FCMChatService.instance = new FCMChatService();
    }
    return FCMChatService.instance;
  }

  /**
   * Initialize FCM chat service
   */
  async initialize(userId: string, authToken: string): Promise<void> {
    try {
      this.currentUserId = userId;
      this.authToken = authToken;

      console.log('[FCMChatService] Initializing with user ID:', userId);

      // Setup FCM for chat notifications
      await this.setupFCMForChat();
      
      // Load queued messages from storage
      await this.loadQueuedMessages();
      
      // Start periodic sync
      this.startPeriodicSync();

      this.isInitialized = true;
      console.log('[FCMChatService] Initialized successfully');
    } catch (error) {
      console.error('[FCMChatService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Set event handlers
   */
  setEventHandlers(handlers: FCMChatEventHandlers): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  /**
   * Setup FCM for chat notifications
   */
  private async setupFCMForChat(): Promise<void> {
    try {
      // Request permissions
      const authStatus = await messaging().requestPermission();
      const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                     authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.warn('[FCMChatService] FCM permissions not granted');
        return;
      }

      // Get and update FCM token
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        await this.updateFCMToken(fcmToken);
      }

      // FCM message handling is now centralized in FCMMessageRouter
      // Foreground and background handlers are disabled to prevent conflicts
      // Messages will be routed to this service via handleFCMMessageFromRouter()
      console.log('[FCMChatService] FCM message handling delegated to FCMMessageRouter');

      // Handle notification opened app
      messaging().onNotificationOpenedApp((remoteMessage) => {
        console.log('[FCMChatService] Notification opened app:', remoteMessage);
        this.handleNotificationTap(remoteMessage);
      });

      // Check if app was opened from a notification
      const initialNotification = await messaging().getInitialNotification();
      if (initialNotification) {
        console.log('[FCMChatService] App opened from notification:', initialNotification);
        this.handleNotificationTap(initialNotification);
      }

      // Handle token refresh
      messaging().onTokenRefresh(async (token) => {
        console.log('[FCMChatService] FCM token refreshed:', token);
        await this.updateFCMToken(token);
      });

    } catch (error) {
      console.error('[FCMChatService] FCM setup failed:', error);
    }
  }

  /**
   * Send a message via FCM API
   */
  async sendMessage(conversationId: string, content: string, replyTo?: string): Promise<void> {
    const tempId = `temp_${Date.now()}_${Math.random()}`;

    const message: Message = {
      id: tempId,
      conversationId,
      senderId: this.currentUserId!,
      senderName: 'You',
      content,
      messageType: 'text',
      createdAt: new Date().toISOString(),
      tempId,
      status: 'sending',
      replyTo,
      deliveryStatus: 'pending'
    };

    console.log('[FCMChatService] Sending message:', {
      tempId,
      conversationId,
      content: content.substring(0, 20) + '...'
    });

    // Add to local storage immediately for optimistic UI
    await this.saveMessageToLocal(message);
    
    // Add to queue for offline support
    this.messageQueue.push(message);
    await this.saveQueuedMessages();

    // Emit optimistically
    this.eventHandlers.onMessageSent?.(message);

    try {
      // Get current user and conversation info for Firebase Cloud Function
      const currentUser = await this.getCurrentUserInfo();
      const conversation = await this.getConversationInfo(conversationId);

      if (!currentUser || !conversation) {
        throw new Error('Missing user or conversation information');
      }

      // Find recipient for direct conversations
      const recipient = conversation.participants.find(p => p.id !== currentUser.id);
      if (!recipient) {
        throw new Error('Recipient not found');
      }

      // Send via Firebase Cloud Function FCM API
      const response = await ApiService.post(FCM_CHAT_ENDPOINTS.SEND_MESSAGE, {
        senderId: currentUser.id,
        senderName: currentUser.name,
        recipientId: recipient.id,
        recipientToken: recipient.fcmToken,
        conversationId,
        content,
        messageType: 'text',
        replyToMessageId: replyTo
      });

      console.log('[FCMChatService] Message sent successfully via Firebase Cloud Function:', response);

      // Update message status with Firebase Cloud Function response
      message.status = 'sent';
      message.deliveryStatus = 'sent';
      message.id = response.data?.messageId || message.id;
      
      await this.updateMessageInLocal(message);
      
      // Remove from queue
      this.messageQueue = this.messageQueue.filter(m => m.tempId !== tempId);
      await this.saveQueuedMessages();

    } catch (error) {
      console.error('[FCMChatService] Failed to send message:', error);
      
      // Update message status to failed
      message.status = 'sending'; // Keep as sending for retry
      message.deliveryStatus = 'failed';
      await this.updateMessageInLocal(message);
      
      throw error;
    }
  }

  /**
   * Get current user information
   */
  private async getCurrentUserInfo(): Promise<{ id: string; name: string } | null> {
    try {
      // This should be implemented to get current user info
      // For now, return a placeholder - this should be integrated with your auth system
      return {
        id: this.currentUserId || 'unknown',
        name: 'Current User' // This should come from your auth context
      };
    } catch (error) {
      console.error('[FCMChatService] Error getting current user info:', error);
      return null;
    }
  }

  /**
   * Get conversation information including participants
   */
  private async getConversationInfo(conversationId: string): Promise<{
    participants: Array<{ id: string; name: string; fcmToken?: string }>
  } | null> {
    try {
      // This should fetch conversation details from your API or local storage
      // For now, return a placeholder - this should be implemented based on your data structure

      // Try to get conversations from the service
      const conversationsResult = await this.getConversations(1, 100);
      const conversation = conversationsResult.conversations.find((c: any) => c.id === conversationId);

      if (conversation) {
        return {
          participants: conversation.participants.map((p: any) => ({
            id: p.id,
            name: p.name,
            fcmToken: p.fcmToken // This should be available from participant data
          }))
        };
      }

      // Fallback: return a basic structure for testing
      return {
        participants: [
          { id: 'user1', name: 'User 1', fcmToken: 'token1' },
          { id: 'user2', name: 'User 2', fcmToken: 'token2' }
        ]
      };
    } catch (error) {
      console.error('[FCMChatService] Error getting conversation info:', error);
      return null;
    }
  }

  /**
   * Get conversations via API
   */
  async getConversations(page = 1, limit = 20): Promise<{ conversations: Conversation[], pagination: any }> {
    try {
      const response = await ApiService.get(`${CHAT_ENDPOINTS.GET_CONVERSATIONS}?page=${page}&limit=${limit}`);
      
      return {
        conversations: response.data || [],
        pagination: response.pagination || {}
      };
    } catch (error) {
      console.error('[FCMChatService] Failed to get conversations:', error);
      throw error;
    }
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string, page = 1, limit = 50): Promise<{ messages: Message[], pagination: any }> {
    try {
      const response = await ApiService.get(`${CHAT_ENDPOINTS.GET_MESSAGES}/${conversationId}/messages?page=${page}&limit=${limit}`);
      
      const messages = response.data?.messages || [];
      
      // Save messages to local storage
      for (const message of messages) {
        await this.saveMessageToLocal(message);
      }
      
      return {
        messages,
        pagination: response.data?.pagination || {}
      };
    } catch (error) {
      console.error('[FCMChatService] Failed to get messages:', error);
      throw error;
    }
  }

  /**
   * Create or get conversation
   */
  async createOrGetConversation(participantId: string): Promise<{ conversationId: string }> {
    try {
      const response = await ApiService.post(CHAT_ENDPOINTS.CREATE_CONVERSATION, {
        participantId,
        type: 'direct'
      });

      return { conversationId: response.data?.conversationId };
    } catch (error) {
      console.error('[FCMChatService] Failed to create conversation:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(conversationId: string, messageId?: string): Promise<void> {
    try {
      await ApiService.put(`${CHAT_ENDPOINTS.GET_MESSAGES}/${conversationId}/read`, {
        messageId
      });
    } catch (error) {
      console.error('[FCMChatService] Failed to mark as read:', error);
      throw error;
    }
  }

  /**
   * Handle FCM message
   */
  private async handleFCMMessage(remoteMessage: FirebaseMessagingTypes.RemoteMessage): Promise<void> {
    const { data, notification } = remoteMessage;

    if (data?.type === 'chat_message') {
      console.log('[FCMChatService] Received chat message via FCM:', data);

      // Create message object from FCM data
      const message: Message = {
        id: data.messageId || `fcm_${Date.now()}`,
        conversationId: data.conversationId || '',
        senderId: data.senderId || '',
        senderName: data.senderName || 'Unknown',
        content: notification?.body || data.content || '',
        messageType: 'text',
        createdAt: data.timestamp || new Date().toISOString(),
        status: 'delivered',
        deliveryStatus: 'delivered'
      };

      // Save to local storage
      await this.saveMessageToLocal(message);

      // Notify handlers
      this.eventHandlers.onMessageReceived?.(message);

      // If app is in foreground and user is in the same conversation, mark as read
      if (this.appState === 'active') {
        // Auto-mark as read if user is viewing the conversation
        // This would be handled by the chat screen
      }
    }
  }

  /**
   * Handle notification tap
   */
  private handleNotificationTap(remoteMessage: FirebaseMessagingTypes.RemoteMessage): void {
    const { data } = remoteMessage;

    if (data?.type === 'chat_message' && data?.conversationId) {
      // Navigate to chat screen - this would be handled by navigation service
      console.log('[FCMChatService] Should navigate to conversation:', data.conversationId);
    }
  }

  /**
   * Update FCM token on server
   */
  private async updateFCMToken(token: string): Promise<void> {
    try {
      await ApiService.post(FCM_CHAT_ENDPOINTS.UPDATE_TOKEN, {
        fcmToken: token,
        platform: 'react-native'
      });
      console.log('[FCMChatService] FCM token updated on server');
    } catch (error) {
      console.error('[FCMChatService] Failed to update FCM token:', error);
    }
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange = (nextAppState: AppStateStatus): void => {
    console.log('[FCMChatService] App state changed:', this.appState, '->', nextAppState);
    this.appState = nextAppState;

    if (nextAppState === 'active') {
      // App became active, sync messages
      this.syncMessages();
    }
  };

  /**
   * Save message to local storage
   */
  private async saveMessageToLocal(message: Message): Promise<void> {
    try {
      const key = `chat_messages_${message.conversationId}`;
      const existingData = await AsyncStorage.getItem(key);
      const messages: Message[] = existingData ? JSON.parse(existingData) : [];
      
      // Check if message already exists
      const existingIndex = messages.findIndex(m => m.id === message.id || m.tempId === message.tempId);
      
      if (existingIndex >= 0) {
        // Update existing message
        messages[existingIndex] = message;
      } else {
        // Add new message
        messages.push(message);
      }
      
      // Sort by creation time
      messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      await AsyncStorage.setItem(key, JSON.stringify(messages));
    } catch (error) {
      console.error('[FCMChatService] Failed to save message to local storage:', error);
    }
  }

  /**
   * Update message in local storage
   */
  private async updateMessageInLocal(message: Message): Promise<void> {
    await this.saveMessageToLocal(message);
  }

  /**
   * Get messages from local storage
   */
  async getMessagesFromLocal(conversationId: string): Promise<Message[]> {
    try {
      const key = `chat_messages_${conversationId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[FCMChatService] Failed to get messages from local storage:', error);
      return [];
    }
  }

  /**
   * Save queued messages
   */
  private async saveQueuedMessages(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `fcm_chat_queue_${this.currentUserId}`,
        JSON.stringify(this.messageQueue)
      );
    } catch (error) {
      console.error('[FCMChatService] Failed to save queued messages:', error);
    }
  }

  /**
   * Load queued messages
   */
  private async loadQueuedMessages(): Promise<void> {
    try {
      if (!this.currentUserId) return;

      const queuedData = await AsyncStorage.getItem(`fcm_chat_queue_${this.currentUserId}`);
      if (queuedData) {
        this.messageQueue = JSON.parse(queuedData);
        console.log(`[FCMChatService] Loaded ${this.messageQueue.length} queued messages`);
      }
    } catch (error) {
      console.error('[FCMChatService] Failed to load queued messages:', error);
    }
  }

  /**
   * Process queued messages
   */
  private async processMessageQueue(): Promise<void> {
    if (this.messageQueue.length === 0) return;

    console.log(`[FCMChatService] Processing ${this.messageQueue.length} queued messages`);

    const messagesToSend = [...this.messageQueue];
    this.messageQueue = [];

    for (const message of messagesToSend) {
      try {
        await this.sendMessage(message.conversationId, message.content, message.replyTo);
      } catch (error) {
        console.error('[FCMChatService] Failed to send queued message:', error);
        // Re-add to queue for retry
        this.messageQueue.push(message);
      }
    }

    await this.saveQueuedMessages();
  }

  /**
   * Sync messages with server
   */
  private async syncMessages(): Promise<void> {
    try {
      // Process any queued messages
      await this.processMessageQueue();
      
      // Sync could include fetching latest messages, updating read status, etc.
      console.log('[FCMChatService] Message sync completed');
    } catch (error) {
      console.error('[FCMChatService] Message sync failed:', error);
    }
  }

  /**
   * Start periodic sync
   */
  private startPeriodicSync(): void {
    // Sync every 30 seconds when app is active
    this.syncInterval = setInterval(() => {
      if (this.appState === 'active') {
        this.syncMessages();
      }
    }, 30000);
  }

  /**
   * Stop periodic sync
   */
  private stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.fcmUnsubscribe) {
      this.fcmUnsubscribe();
      this.fcmUnsubscribe = null;
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    this.stopPeriodicSync();
    this.isInitialized = false;
  }

  /**
   * Check if service is initialized
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Public method to handle FCM messages (called by FCMMessageRouter)
   * This enables the router to delegate chat messages to this service
   */
  public async handleFCMMessageFromRouter(remoteMessage: FirebaseMessagingTypes.RemoteMessage): Promise<void> {
    if (!this.isInitialized) {
      console.warn('[FCMChatService] Service not initialized, cannot handle FCM message');
      return;
    }

    try {
      console.log('[FCMChatService] Handling FCM message via router:', remoteMessage.data);
      await this.handleFCMMessage(remoteMessage);
    } catch (error) {
      console.error('[FCMChatService] Error handling FCM message via router:', error);
      // Don't throw to prevent breaking the router
    }
  }
}

export default FCMChatService;
