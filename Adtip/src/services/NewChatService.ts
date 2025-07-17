/**
 * New Chat Service for React Native
 * 
 * This service handles real-time chat functionality using Socket.IO
 * Features:
 * - Real-time messaging
 * - Offline message queuing
 * - Typing indicators
 * - Message status tracking
 * - FCM integration for notifications when app is killed
 */

import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService  from './ApiService';
import messaging from '@react-native-firebase/messaging';
import { AppState, AppStateStatus } from 'react-native';
import { API_BASE_URL } from '../constants/api';
import { CHAT_ENDPOINTS } from '../constants/apiEndpoints';

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
}

export interface Conversation {
  conversation_id: string;
  type: 'direct' | 'group';
  title?: string;
  last_activity_at: string;
  unread_count: number;
  is_muted: boolean;
  last_message_content?: string;
  last_message_type?: string;
  last_message_time?: string;
  last_message_sender_name?: string;
  other_user_id?: string;
  other_user_name?: string;
  other_user_avatar?: string;
  other_user_status?: 'online' | 'offline' | 'away';
}

export interface ChatEventHandlers {
  onMessageReceived?: (message: Message) => void;
  onMessageSent?: (message: Message) => void;
  onMessageDelivered?: (messageId: string, deliveredAt: string) => void;
  onMessageRead?: (messageId: string, readAt: string, readBy: string) => void;
  onUserTyping?: (conversationId: string, userId: string, isTyping: boolean) => void;
  onUserStatusChanged?: (userId: string, status: string) => void;
  onConversationUpdated?: (conversation: Conversation) => void;
  onConnectionStatusChanged?: (connected: boolean) => void;
}

class NewChatService {
  private socket: Socket | null = null;
  private isConnected = false;
  private eventHandlers: ChatEventHandlers = {};
  private messageQueue: Message[] = [];
  private currentUserId: string | null = null;
  private authToken: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private appState: AppStateStatus = 'active';

  constructor() {
    this.setupAppStateListener();
    this.loadQueuedMessages();
  }

  /**
   * Initialize chat service with user authentication
   */
  async initialize(userId: string, authToken: string): Promise<void> {
    try {
      this.currentUserId = userId;
      this.authToken = authToken;

      console.log('[NewChatService] Initializing with user ID:', userId);

      await this.connect();
      await this.setupFCMForChat();

      console.log('[NewChatService] Initialized successfully with user ID:', this.currentUserId);
    } catch (error) {
      console.error('[NewChatService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Connect to Socket.IO server
   */
  private async connect(): Promise<void> {
    if (this.socket?.connected) {
      return;
    }

    try {
      const serverUrl = await this.getServerUrl();
      console.log('[NewChatService] Attempting to connect to:', serverUrl);

      this.socket = io(serverUrl, {
        auth: {
          token: this.authToken
        },
        transports: ['polling', 'websocket'], // Try polling first, then websocket
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        forceNew: true
      });

      console.log('[NewChatService] Socket.IO client created with config:', {
        url: serverUrl,
        transports: ['polling', 'websocket'],
        hasAuth: !!this.authToken
      });

      this.setupSocketEventHandlers();

    } catch (error) {
      console.error('[NewChatService] Connection failed:', error);
      throw error;
    }
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupSocketEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('[NewChatService] Connected to server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.eventHandlers.onConnectionStatusChanged?.(true);
      this.processMessageQueue();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[NewChatService] Disconnected:', reason);
      this.isConnected = false;
      this.eventHandlers.onConnectionStatusChanged?.(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[NewChatService] Connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[NewChatService] Max reconnection attempts reached');
        console.error('[NewChatService] Please check if the backend server is running on port 7082');
      }
    });

    // Chat events
    this.socket.on('message_received', (data) => {
      const message = this.formatMessage(data.message);
      this.eventHandlers.onMessageReceived?.(message);
    });

    this.socket.on('message_sent', (data) => {
      const message = this.formatMessage(data.message);
      this.eventHandlers.onMessageSent?.(message);
    });

    this.socket.on('message_delivered', (data) => {
      this.eventHandlers.onMessageDelivered?.(data.messageId, data.deliveredAt);
    });

    this.socket.on('message_read', (data) => {
      this.eventHandlers.onMessageRead?.(data.messageId, data.readAt, data.readBy);
    });

    this.socket.on('user_typing', (data) => {
      this.eventHandlers.onUserTyping?.(data.conversationId, data.userId, data.isTyping);
    });

    this.socket.on('user_status_changed', (data) => {
      this.eventHandlers.onUserStatusChanged?.(data.userId, data.status);
    });

    this.socket.on('conversation_updated', (data) => {
      this.eventHandlers.onConversationUpdated?.(data.conversation);
    });

    this.socket.on('error', (error) => {
      console.error('[NewChatService] Socket error:', error);
    });
  }

  /**
   * Setup FCM for chat notifications when app is killed
   */
  private async setupFCMForChat(): Promise<void> {
    try {
      // Request permission for notifications
      const authStatus = await messaging().requestPermission();
      const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                     authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.warn('[NewChatService] FCM permission not granted');
        return;
      }

      // Get FCM token
      const fcmToken = await messaging().getToken();
      console.log('[NewChatService] FCM Token:', fcmToken);

      // Update FCM token on server
      await this.updateFCMToken(fcmToken);

      // Handle foreground messages
      messaging().onMessage(async (remoteMessage) => {
        console.log('[NewChatService] Foreground FCM message:', remoteMessage);
        this.handleFCMMessage(remoteMessage);
      });

      // Handle background/killed app messages
      messaging().setBackgroundMessageHandler(async (remoteMessage) => {
        console.log('[NewChatService] Background FCM message:', remoteMessage);
        this.handleFCMMessage(remoteMessage);
      });

      // Handle notification opened app
      messaging().onNotificationOpenedApp((remoteMessage) => {
        console.log('[NewChatService] Notification opened app:', remoteMessage);
        this.handleNotificationTap(remoteMessage);
      });

      // Check if app was opened from a notification
      const initialNotification = await messaging().getInitialNotification();
      if (initialNotification) {
        console.log('[NewChatService] App opened from notification:', initialNotification);
        this.handleNotificationTap(initialNotification);
      }

    } catch (error) {
      console.error('[NewChatService] FCM setup failed:', error);
    }
  }

  /**
   * Send a message
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
      replyTo
    };

    console.log('[NewChatService] Sending message:', {
      tempId,
      conversationId,
      senderId: this.currentUserId,
      content: content.substring(0, 20) + '...',
      isConnected: this.isConnected
    });

    // Add to queue for offline support
    this.messageQueue.push(message);
    await this.saveQueuedMessages();

    // Emit optimistically
    this.eventHandlers.onMessageSent?.(message);

    if (this.isConnected && this.socket) {
      this.socket.emit('send_message', {
        conversationId,
        content,
        messageType: 'text',
        replyTo,
        tempId
      });
      console.log('[NewChatService] Message sent via socket');
    } else {
      console.log('[NewChatService] Message queued for when connection is restored');
    }
  }

  /**
   * Join a conversation room
   */
  joinConversation(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join_conversation', { conversationId });
    }
  }

  /**
   * Start typing indicator
   */
  startTyping(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('typing_start', { conversationId });
    }
  }

  /**
   * Stop typing indicator
   */
  stopTyping(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('typing_stop', { conversationId });
    }
  }

  /**
   * Mark messages as read
   */
  markAsRead(conversationId: string, messageId?: string): void {
    if (this.socket?.connected) {
      this.socket.emit('mark_read', { conversationId, messageId });
    }
  }

  /**
   * Get conversations via REST API
   */
  async getConversations(page = 1, limit = 20): Promise<{ conversations: Conversation[], pagination: any }> {
    try {
      const response = await ApiService.get(`${CHAT_ENDPOINTS.GET_CONVERSATIONS}?page=${page}&limit=${limit}`);
      console.log('[NewChatService] Raw conversations API response:', response);

      // Backend returns: { status, message, data: [...], pagination: {...} }
      // ApiService.get returns response.data, so we access response.data directly
      return {
        conversations: response.data || [],
        pagination: response.pagination || {}
      };
    } catch (error) {
      console.error('[NewChatService] Failed to get conversations:', error);
      throw error;
    }
  }

  /**
   * Get messages for a conversation via REST API
   */
  async getMessages(conversationId: string, page = 1, limit = 50): Promise<{ messages: Message[], pagination: any }> {
    try {
      const response = await ApiService.get(`${CHAT_ENDPOINTS.GET_MESSAGES}/${conversationId}/messages?page=${page}&limit=${limit}`);
      console.log('[NewChatService] Raw API response:', response);

      // Backend returns: { status, message, data: { messages: [...], pagination: {...} } }
      // ApiService.get returns response.data, so we access response.data.messages directly
      console.log('[NewChatService] Response structure:', {
        hasData: !!response.data,
        hasMessages: !!response.data?.messages,
        hasDataData: !!response.data?.data,
        messagesCount: response.data?.messages?.length || 0,
        dataDataMessagesCount: response.data?.data?.messages?.length || 0
      });

      const messages = (response.data?.messages || []).map(this.formatMessage);

      return {
        messages,
        pagination: response.data?.pagination || {}
      };
    } catch (error) {
      console.error('[NewChatService] Failed to get messages:', error);
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

      console.log('[NewChatService] Create conversation response:', response);

      // Backend returns: { status, message, data: { conversationId: ... } }
      // ApiService.post returns response.data, so we access response.data.conversationId
      return { conversationId: response.data?.conversationId };
    } catch (error) {
      console.error('[NewChatService] Failed to create conversation:', error);
      throw error;
    }
  }

  /**
   * Set event handlers
   */
  setEventHandlers(handlers: ChatEventHandlers): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  /**
   * Disconnect from chat service
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.eventHandlers.onConnectionStatusChanged?.(false);
  }

  /**
   * Helper: Format message from server response
   */
  private formatMessage(messageData: any): Message {
    const formattedMessage = {
      id: messageData.id?.toString() || messageData.tempId,
      conversationId: messageData.conversation_id || messageData.conversationId,
      senderId: (messageData.sender_id || messageData.senderId)?.toString(),
      senderName: messageData.sender_name || messageData.senderName || 'Unknown',
      senderAvatar: messageData.sender_avatar || messageData.senderAvatar,
      content: messageData.content || '',
      messageType: messageData.message_type || messageData.messageType || 'text',
      createdAt: messageData.created_at || messageData.createdAt || new Date().toISOString(),
      tempId: messageData.tempId,
      status: messageData.status || 'sent',
      replyTo: messageData.reply_to_message_id || messageData.replyTo
    };

    console.log('[NewChatService] Formatted message:', {
      id: formattedMessage.id,
      senderId: formattedMessage.senderId,
      senderName: formattedMessage.senderName,
      content: formattedMessage.content,
      currentUserId: this.currentUserId,
      isOwnMessage: formattedMessage.senderId === this.currentUserId
    });

    return formattedMessage;
  }

  /**
   * Helper: Get server URL from config
   */
  private async getServerUrl(): Promise<string> {
    // Use the same base URL as the API for consistency
    // Socket.IO will automatically handle the connection protocol
    const serverUrl = API_BASE_URL;

    console.log(`[NewChatService] Using server URL: ${serverUrl}`);
    return serverUrl;
  }

  /**
   * Helper: Update FCM token on server
   */
  private async updateFCMToken(token: string): Promise<void> {
    try {
      // Use the existing ApiService method which handles the correct endpoint
      await ApiService.updateFcmToken({
        userId: this.currentUserId!,
        fcmToken: token
      });
      console.log('[NewChatService] FCM token updated on server');
    } catch (error) {
      console.error('[NewChatService] Failed to update FCM token:', error);
    }
  }

  /**
   * Helper: Handle FCM message
   */
  private handleFCMMessage(remoteMessage: any): void {
    const { data } = remoteMessage;

    if (data?.type === 'chat_message') {
      // If app is in foreground and user is in the same conversation, don't show notification
      if (this.appState === 'active') {
        // Let the chat screen handle the message
        return;
      }

      // Handle background message
      console.log('[NewChatService] Received chat message via FCM:', data);
    }
  }

  /**
   * Helper: Handle notification tap
   */
  private handleNotificationTap(remoteMessage: any): void {
    const { data } = remoteMessage;

    if (data?.type === 'chat_message' && data?.conversationId) {
      // Navigate to chat screen
      this.navigateToChat(data.conversationId, data.senderName);
    }
  }

  /**
   * Navigate to chat screen
   */
  private navigateToChat(conversationId: string, participantName?: string): void {
    try {
      // Import navigation service dynamically to avoid circular imports
      const NavigationService = require('../navigation/NavigationService');

      if (NavigationService.isNavigationReady()) {
        NavigationService.navigate('NewChat', {
          conversationId,
          participantName
        });
      } else {
        // If navigation isn't ready, wait and try again
        setTimeout(() => {
          if (NavigationService.isNavigationReady()) {
            NavigationService.navigate('NewChat', {
              conversationId,
              participantName
            });
          }
        }, 1000);
      }
    } catch (error) {
      console.error('[NewChatService] Failed to navigate to chat:', error);
    }
  }

  /**
   * Helper: Setup app state listener
   */
  private setupAppStateListener(): void {
    AppState.addEventListener('change', (nextAppState) => {
      this.appState = nextAppState;

      if (nextAppState === 'active') {
        // App came to foreground, reconnect if needed
        if (!this.isConnected && this.authToken) {
          this.connect();
        }
      } else if (nextAppState === 'background') {
        // App went to background
        console.log('[NewChatService] App went to background');
      }
    });
  }

  /**
   * Helper: Process queued messages when connection is restored
   */
  private async processMessageQueue(): Promise<void> {
    if (this.messageQueue.length === 0) return;

    console.log(`[NewChatService] Processing ${this.messageQueue.length} queued messages`);

    const messagesToSend = [...this.messageQueue];
    this.messageQueue = [];

    for (const message of messagesToSend) {
      if (this.socket?.connected) {
        this.socket.emit('send_message', {
          conversationId: message.conversationId,
          content: message.content,
          messageType: message.messageType,
          replyTo: message.replyTo,
          tempId: message.tempId
        });
      }
    }

    await this.saveQueuedMessages();
  }

  /**
   * Helper: Save queued messages to AsyncStorage
   */
  private async saveQueuedMessages(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `chat_queue_${this.currentUserId}`,
        JSON.stringify(this.messageQueue)
      );
    } catch (error) {
      console.error('[NewChatService] Failed to save queued messages:', error);
    }
  }

  /**
   * Helper: Load queued messages from AsyncStorage
   */
  private async loadQueuedMessages(): Promise<void> {
    try {
      if (!this.currentUserId) return;

      const queuedData = await AsyncStorage.getItem(`chat_queue_${this.currentUserId}`);
      if (queuedData) {
        this.messageQueue = JSON.parse(queuedData);
        console.log(`[NewChatService] Loaded ${this.messageQueue.length} queued messages`);
      }
    } catch (error) {
      console.error('[NewChatService] Failed to load queued messages:', error);
    }
  }

  /**
   * Get connection status
   */
  isConnectedToChat(): boolean {
    return this.isConnected;
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    try {
      if (this.currentUserId) {
        await AsyncStorage.removeItem(`chat_queue_${this.currentUserId}`);
      }
      this.messageQueue = [];
      console.log('[NewChatService] Cache cleared');
    } catch (error) {
      console.error('[NewChatService] Failed to clear cache:', error);
    }
  }
}

export default new NewChatService();
