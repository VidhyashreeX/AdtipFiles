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
import { AppState, AppStateStatus, Platform } from 'react-native';
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
  // Retry tracking fields
  retryCount?: number;
  lastRetryAt?: string;
  nextRetryAt?: string;
  isInDeadLetterQueue?: boolean;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  title?: string;
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
    fcmToken?: string;
  }>;
  lastMessage?: Message;
  unreadCount: number;
  lastActivity: string;
}

// Interface for the actual API response structure
export interface ApiConversation {
  conversation_id?: string | number;
  id?: string | number;
  conversationId?: string | number;
  type: 'direct' | 'group';
  title?: string;
  last_activity_at?: string;
  lastActivity?: string;
  unread_count?: number;
  is_muted?: boolean;
  last_message_content?: string;
  last_message_type?: string;
  last_message_time?: string;
  last_message_sender_name?: string;
  other_user_id?: string | number;
  other_user_name?: string;
  other_user_avatar?: string;
  other_user_status?: 'online' | 'offline' | 'away';
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
  private deadLetterQueue: Message[] = [];
  private appState: AppStateStatus = 'active';
  private isInitialized = false;
  private fcmUnsubscribe: (() => void) | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private appStateSubscription: any = null;
  private isProcessingQueue = false;
  private consecutiveFailures = 0;
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly MAX_CONSECUTIVE_FAILURES = 10;
  private readonly BASE_RETRY_DELAY = 2000; // 2 seconds
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second minimum between requests

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

      // Load dead letter queue from storage
      await this.loadDeadLetterQueue();

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
    // IMMEDIATE CIRCUIT BREAKER CHECK - Stop infinite loops
    if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
      console.warn(`[FCMChatService] Circuit breaker active. Rejecting message send. Consecutive failures: ${this.consecutiveFailures}`);
      throw new Error('Circuit breaker active - too many consecutive failures. Please try again later.');
    }

    // RATE LIMITING - Prevent rapid-fire requests
    const now = Date.now();
    if (now - this.lastRequestTime < this.MIN_REQUEST_INTERVAL) {
      console.warn(`[FCMChatService] Rate limit exceeded. Rejecting message send. Last request: ${now - this.lastRequestTime}ms ago`);
      throw new Error('Rate limit exceeded - please wait before sending another message.');
    }
    this.lastRequestTime = now;

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
      content: content.substring(0, 20) + '...',
      consecutiveFailures: this.consecutiveFailures,
      timeSinceLastRequest: now - this.lastRequestTime
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

      if (!currentUser) {
        throw new Error('Current user information not available');
      }

      if (!conversation) {
        throw new Error('Conversation information not available. Please ensure the conversation exists and try again.');
      }

      // Find recipient for direct conversations
      const recipient = conversation.participants.find(p => p.id !== currentUser.id);
      if (!recipient) {
        throw new Error('Recipient not found in conversation');
      }

      console.log('[FCMChatService] Recipient found:', {
        id: recipient.id,
        name: recipient.name,
        fcmToken: recipient.fcmToken ? `${recipient.fcmToken.substring(0, 20)}...` : 'null',
        tokenLength: recipient.fcmToken?.length || 0
      });

      // Validate recipient has a valid FCM token - if not, try to fetch it again
      if (!recipient.fcmToken || recipient.fcmToken.length < 10) {
        console.warn('[FCMChatService] Recipient FCM token invalid, attempting to refetch...', {
          currentToken: recipient.fcmToken,
          recipientId: recipient.id
        });

        try {
          const tokenData = await ApiService.getFCMToken(recipient.id);
          if (tokenData?.token && tokenData.token.length >= 10) {
            recipient.fcmToken = tokenData.token;
            console.log('[FCMChatService] Successfully refetched FCM token for recipient:', recipient.id);
          } else {
            throw new Error(`Recipient does not have a valid FCM token after refetch. Token: ${tokenData?.token || 'null'}`);
          }
        } catch (refetchError) {
          console.error('[FCMChatService] Failed to refetch FCM token:', refetchError);
          throw new Error(`Recipient does not have a valid FCM token. Token: ${recipient.fcmToken || 'null'}`);
        }
      }

      // Send via Firebase Cloud Function FCM API
      const fcmResponse = await ApiService.sendChatMessage({
        senderId: currentUser.id,
        senderName: currentUser.name,
        recipientId: recipient.id,
        recipientToken: recipient.fcmToken,
        conversationId,
        content,
        messageType: 'text',
        replyToMessageId: replyTo
      });

      console.log('[FCMChatService] FCM message sent successfully via Firebase Cloud Function:', fcmResponse);

      // Save message to database via backend API
      const dbResponse = await ApiService.post('/api/chat/save-message', {
        conversationId,
        content,
        messageType: 'text',
        replyToMessageId: replyTo,
        messageId: fcmResponse.data?.messageId, // Link to FCM message
        tempId: message.tempId, // Include temp ID for sync tracking
        timestamp: message.createdAt // Include client timestamp
      });

      console.log('[FCMChatService] Message saved to database successfully:', dbResponse);

      // Update message status with database response
      message.status = 'sent';
      message.deliveryStatus = 'sent';
      message.id = dbResponse.data?.message?.id || fcmResponse.data?.messageId || message.id;

      await this.updateMessageInLocal(message);
      
      // Remove from queue
      this.messageQueue = this.messageQueue.filter(m => m.tempId !== tempId);
      await this.saveQueuedMessages();

    } catch (error: any) {
      console.error('[FCMChatService] Failed to send message:', error);

      // Check if this is a permanent failure (invalid token, etc.)
      const isPermanentFailure = this.isPermanentFailure(error);

      if (isPermanentFailure) {
        console.warn(`[FCMChatService] Permanent failure detected, moving to dead letter queue:`, message.tempId);
        message.status = 'sending';
        message.deliveryStatus = 'failed';
        await this.updateMessageInLocal(message);

        // Remove from queue and move to dead letter queue immediately
        this.messageQueue = this.messageQueue.filter(m => m.tempId !== message.tempId);
        await this.moveToDeadLetterQueue(message);
      } else {
        // Temporary failure - apply retry logic
        message.status = 'sending'; // Keep as sending for retry
        message.deliveryStatus = 'failed';
        message.retryCount = (message.retryCount || 0) + 1;
        message.lastRetryAt = new Date().toISOString();

        // Calculate next retry time with exponential backoff
        const retryDelay = this.calculateRetryDelay(message.retryCount);
        message.nextRetryAt = new Date(Date.now() + retryDelay).toISOString();

        await this.updateMessageInLocal(message);

        // Only keep in queue if not exceeded max attempts
        if (message.retryCount >= this.MAX_RETRY_ATTEMPTS) {
          console.warn(`[FCMChatService] Message exceeded max retry attempts, removing from queue:`, message.tempId);
          this.messageQueue = this.messageQueue.filter(m => m.tempId !== message.tempId);
          await this.moveToDeadLetterQueue(message);
        }
      }

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
      console.log('[FCMChatService] Getting conversation info for ID:', conversationId);

      // Try to get conversations from the service
      const conversationsResult = await this.getConversations(1, 100);
      console.log('[FCMChatService] Retrieved conversations:', {
        count: conversationsResult.conversations.length,
        conversationIds: conversationsResult.conversations.map((c: any) => c.id || c.conversationId || c.conversation_id),
        sampleConversation: conversationsResult.conversations[0] // Log first conversation structure
      });

      // Try to find conversation by various ID fields (backend uses conversation_id)
      let conversation: ApiConversation | undefined = conversationsResult.conversations.find((c: any) => {
        const cId = c.id || c.conversationId || c.conversation_id;
        return cId === conversationId ||
               String(cId) === String(conversationId) ||
               parseInt(cId) === parseInt(conversationId);
      });

      console.log('[FCMChatService] Conversation search result:', {
        searchingFor: conversationId,
        found: !!conversation,
        foundId: conversation ? (conversation.id || conversation.conversationId || conversation.conversation_id) : null
      });

      if (conversation) {
        const currentUserId = await AsyncStorage.getItem('userId');
        console.log('[FCMChatService] Found conversation:', {
          id: conversation.conversation_id || conversation.id,
          type: conversation.type,
          currentUserId,
          otherUserId: conversation.other_user_id
        });

        // Build participants array based on conversation structure
        const participants: Array<{ id: string; name: string; fcmToken?: string }> = [];

        // Add current user
        if (currentUserId) {
          participants.push({
            id: currentUserId,
            name: 'You'
          });
        }

        // Add other participant (for direct chats)
        if (conversation.other_user_id) {
          participants.push({
            id: String(conversation.other_user_id),
            name: conversation.other_user_name || 'Unknown User'
          });
        }

        // Fetch FCM tokens for all participants
        for (const participant of participants) {
          if (participant.id && participant.id !== currentUserId) {
            try {
              console.log('[FCMChatService] Fetching FCM token for participant:', participant.id);
              const tokenData = await ApiService.getFCMToken(participant.id);
              if (tokenData?.token) {
                participant.fcmToken = tokenData.token;
                console.log('[FCMChatService] Successfully assigned FCM token to participant:', {
                  participantId: participant.id,
                  tokenLength: tokenData.token.length,
                  tokenPreview: tokenData.token.substring(0, 20) + '...'
                });
              } else {
                console.warn('[FCMChatService] No FCM token received for participant:', participant.id, tokenData);
              }
            } catch (error) {
              console.warn('[FCMChatService] Failed to fetch FCM token for participant:', participant.id, error);
            }
          }
        }

        console.log('[FCMChatService] Built participants:', {
          count: participants.length,
          participants: participants.map(p => ({
            id: p.id,
            name: p.name,
            hasToken: !!p.fcmToken,
            tokenLength: p.fcmToken?.length || 0
          }))
        });

        return { participants };
      }

      // No fallback - return null if conversation info cannot be fetched
      console.warn('[FCMChatService] Could not find conversation with ID:', conversationId);
      return null;
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
   * Update FCM token on server - Use same mechanism as calling system
   */
  private async updateFCMToken(token: string): Promise<void> {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        console.warn('[FCMChatService] No userId found, cannot update FCM token');
        return;
      }

      // Use the same FCM token update mechanism as the calling system
      await ApiService.updateFcmToken({
        userId,
        fcmToken: token,
        platform: Platform.OS
      });
      console.log('[FCMChatService] FCM token updated on server using calling system method');
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
  async saveMessageToLocal(message: Message): Promise<void> {
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
   * Load dead letter queue
   */
  private async loadDeadLetterQueue(): Promise<void> {
    try {
      if (!this.currentUserId) return;

      const deadLetterData = await AsyncStorage.getItem(`fcm_chat_dead_letter_${this.currentUserId}`);
      if (deadLetterData) {
        this.deadLetterQueue = JSON.parse(deadLetterData);
        console.log(`[FCMChatService] Loaded ${this.deadLetterQueue.length} dead letter messages`);
      }
    } catch (error) {
      console.error('[FCMChatService] Failed to load dead letter queue:', error);
    }
  }

  /**
   * Process queued messages with retry logic and circuit breaker
   */
  private async processMessageQueue(): Promise<void> {
    if (this.messageQueue.length === 0 || this.isProcessingQueue) return;

    // Circuit breaker: stop processing if too many consecutive failures
    if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
      console.warn(`[FCMChatService] Circuit breaker activated. Too many consecutive failures (${this.consecutiveFailures}). Skipping queue processing.`);
      return;
    }

    this.isProcessingQueue = true;
    console.log(`[FCMChatService] Processing ${this.messageQueue.length} queued messages`);

    const messagesToProcess = [...this.messageQueue];
    this.messageQueue = [];

    let successCount = 0;
    let failureCount = 0;

    for (const message of messagesToProcess) {
      try {
        // Check if message should be retried
        if (!this.shouldRetryMessage(message)) {
          console.warn(`[FCMChatService] Moving message to dead letter queue:`, message.tempId);
          await this.moveToDeadLetterQueue(message);
          continue;
        }

        // Update retry tracking
        message.retryCount = (message.retryCount || 0) + 1;
        message.lastRetryAt = new Date().toISOString();

        // Send message directly via API (avoid infinite recursion)
        await this.sendMessageDirectly(message);
        successCount++;

        console.log(`[FCMChatService] Successfully sent queued message:`, message.tempId);

      } catch (error) {
        console.error('[FCMChatService] Failed to send queued message:', error);
        failureCount++;

        // Calculate next retry time with exponential backoff
        const retryDelay = this.calculateRetryDelay(message.retryCount || 0);
        message.nextRetryAt = new Date(Date.now() + retryDelay).toISOString();

        // Re-add to queue for retry if not exceeded max attempts
        if ((message.retryCount || 0) < this.MAX_RETRY_ATTEMPTS) {
          this.messageQueue.push(message);
        } else {
          console.warn(`[FCMChatService] Message exceeded max retry attempts, moving to dead letter queue:`, message.tempId);
          await this.moveToDeadLetterQueue(message);
        }
      }
    }

    // Update consecutive failure counter
    if (failureCount > 0 && successCount === 0) {
      this.consecutiveFailures++;
    } else if (successCount > 0) {
      this.consecutiveFailures = 0; // Reset on any success
    }

    console.log(`[FCMChatService] Queue processing completed. Success: ${successCount}, Failures: ${failureCount}, Consecutive failures: ${this.consecutiveFailures}`);

    await this.saveQueuedMessages();
    this.isProcessingQueue = false;
  }

  /**
   * Check if an error represents a permanent failure that shouldn't be retried
   */
  private isPermanentFailure(error: any): boolean {
    if (!error) return false;

    // Check for HTTP status codes that indicate permanent failures
    if (error.status === 400 || error.status === 401 || error.status === 403) {
      return true;
    }

    // Check for specific error codes from the backend
    if (error.response?.data?.errorCode) {
      const errorCode = error.response.data.errorCode;
      const permanentErrorCodes = [
        'invalid_token',
        'token_not_found',
        'config_mismatch'
      ];
      return permanentErrorCodes.includes(errorCode);
    }

    // Check error message for permanent failure indicators
    const errorMessage = error.message || '';
    const permanentFailureMessages = [
      'Invalid or unregistered FCM token',
      'FCM token not found',
      'token may be invalid',
      'different Firebase project'
    ];

    return permanentFailureMessages.some(msg =>
      errorMessage.toLowerCase().includes(msg.toLowerCase())
    );
  }

  /**
   * Check if a message should be retried
   */
  private shouldRetryMessage(message: Message): boolean {
    const retryCount = message.retryCount || 0;

    // Don't retry if already exceeded max attempts
    if (retryCount >= this.MAX_RETRY_ATTEMPTS) {
      return false;
    }

    // Don't retry if already in dead letter queue
    if (message.isInDeadLetterQueue) {
      return false;
    }

    // Check if enough time has passed for next retry
    if (message.nextRetryAt) {
      const nextRetryTime = new Date(message.nextRetryAt).getTime();
      const now = Date.now();
      if (now < nextRetryTime) {
        return false; // Not time for retry yet
      }
    }

    return true;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(retryCount: number): number {
    return Math.min(
      this.BASE_RETRY_DELAY * Math.pow(2, retryCount),
      30000 // Max 30 seconds
    );
  }

  /**
   * Move message to dead letter queue
   */
  private async moveToDeadLetterQueue(message: Message): Promise<void> {
    message.isInDeadLetterQueue = true;
    message.deliveryStatus = 'failed';
    this.deadLetterQueue.push(message);

    // Save dead letter queue to storage
    await this.saveDeadLetterQueue();

    console.log(`[FCMChatService] Message moved to dead letter queue: ${message.tempId}`);
  }

  /**
   * Send message directly via API without adding to queue
   */
  private async sendMessageDirectly(message: Message): Promise<void> {
    // Get current user and conversation info for Firebase Cloud Function
    const currentUser = await this.getCurrentUserInfo();
    const conversation = await this.getConversationInfo(message.conversationId);

    if (!currentUser || !conversation) {
      throw new Error('Missing user or conversation information');
    }

    // Find recipient for direct conversations
    const recipient = conversation.participants.find(p => p.id !== currentUser.id);
    if (!recipient) {
      throw new Error('Recipient not found');
    }

    // Send via Firebase Cloud Function FCM API
    const fcmResponse = await ApiService.sendChatMessage({
      senderId: currentUser.id,
      senderName: currentUser.name,
      recipientId: recipient.id,
      recipientToken: recipient.fcmToken,
      conversationId: message.conversationId,
      content: message.content,
      messageType: message.messageType,
      replyToMessageId: message.replyTo
    });

    console.log('[FCMChatService] FCM message sent successfully via Firebase Cloud Function:', fcmResponse);

    // Save message to database via backend API
    const dbResponse = await ApiService.post('/api/chat/save-message', {
      conversationId: message.conversationId,
      content: message.content,
      messageType: message.messageType,
      replyToMessageId: message.replyTo,
      messageId: fcmResponse.data?.messageId, // Link to FCM message
      tempId: message.tempId, // Include temp ID for sync tracking
      timestamp: message.createdAt // Include client timestamp
    });

    console.log('[FCMChatService] Message saved to database successfully:', dbResponse);

    // Update message status
    message.status = 'sent';
    message.deliveryStatus = 'sent';
    message.id = dbResponse.data?.message?.id || fcmResponse.data?.messageId || message.id;

    await this.updateMessageInLocal(message);
  }

  /**
   * Save dead letter queue to storage
   */
  private async saveDeadLetterQueue(): Promise<void> {
    try {
      if (!this.currentUserId) return;

      await AsyncStorage.setItem(
        `fcm_chat_dead_letter_${this.currentUserId}`,
        JSON.stringify(this.deadLetterQueue)
      );
    } catch (error) {
      console.error('[FCMChatService] Failed to save dead letter queue:', error);
    }
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
      if (this.appState === 'active' && this.consecutiveFailures < this.MAX_CONSECUTIVE_FAILURES) {
        this.syncMessages();
      } else if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
        console.warn('[FCMChatService] Skipping sync - circuit breaker active');
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
   * Reset circuit breaker (for manual recovery)
   */
  resetCircuitBreaker(): void {
    this.consecutiveFailures = 0;
    this.lastRequestTime = 0;
    console.log('[FCMChatService] Circuit breaker reset');
  }

  /**
   * Emergency stop - immediately halt all queue processing and clear queues
   */
  emergencyStop(): void {
    console.warn('[FCMChatService] EMERGENCY STOP - Halting all queue processing');

    // Stop all processing
    this.isProcessingQueue = false;
    this.consecutiveFailures = this.MAX_CONSECUTIVE_FAILURES; // Activate circuit breaker

    // Clear all queues to stop loops
    const queuedCount = this.messageQueue.length;
    const deadLetterCount = this.deadLetterQueue.length;

    this.messageQueue = [];
    this.deadLetterQueue = [];

    // Stop periodic sync
    this.stopPeriodicSync();

    console.warn(`[FCMChatService] Emergency stop completed. Cleared ${queuedCount} queued messages and ${deadLetterCount} dead letter messages.`);
    console.warn('[FCMChatService] Call resetCircuitBreaker() to resume normal operation.');
  }

  /**
   * Get queue status for debugging
   */
  getQueueStatus(): {
    messageQueue: number;
    deadLetterQueue: number;
    consecutiveFailures: number;
    isProcessing: boolean;
  } {
    return {
      messageQueue: this.messageQueue.length,
      deadLetterQueue: this.deadLetterQueue.length,
      consecutiveFailures: this.consecutiveFailures,
      isProcessing: this.isProcessingQueue,
    };
  }

  /**
   * Manually retry dead letter queue (for admin/debugging)
   */
  async retryDeadLetterQueue(): Promise<void> {
    if (this.deadLetterQueue.length === 0) {
      console.log('[FCMChatService] No messages in dead letter queue to retry');
      return;
    }

    console.log(`[FCMChatService] Retrying ${this.deadLetterQueue.length} messages from dead letter queue`);

    // Move messages back to main queue with reset retry count
    const messagesToRetry = [...this.deadLetterQueue];
    this.deadLetterQueue = [];

    for (const message of messagesToRetry) {
      message.retryCount = 0;
      message.isInDeadLetterQueue = false;
      message.nextRetryAt = undefined;
      this.messageQueue.push(message);
    }

    await this.saveQueuedMessages();
    await this.saveDeadLetterQueue();

    // Reset circuit breaker for fresh start
    this.resetCircuitBreaker();
  }

  /**
   * Handle FCM token refresh when permanent failures are detected
   */
  async handleTokenRefresh(): Promise<void> {
    try {
      console.log('[FCMChatService] Attempting to refresh FCM token...');

      // Get new FCM token
      const newToken = await messaging().getToken();
      if (newToken) {
        console.log('[FCMChatService] New FCM token obtained');
        await this.updateFCMToken(newToken);

        // Reset circuit breaker and retry dead letter queue
        this.resetCircuitBreaker();
        await this.retryDeadLetterQueue();

        console.log('[FCMChatService] FCM token refresh completed successfully');
      } else {
        console.warn('[FCMChatService] Failed to obtain new FCM token');
      }
    } catch (error) {
      console.error('[FCMChatService] FCM token refresh failed:', error);
    }
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
