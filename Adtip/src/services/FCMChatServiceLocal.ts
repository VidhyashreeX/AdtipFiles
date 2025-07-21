/**
 * FCM Chat Service - Local Only Version
 * 
 * Refactored version that uses only AsyncStorage for chat functionality
 * without any backend API dependencies. Integrates with LocalChatManager
 * for core functionality.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { AppState, AppStateStatus } from 'react-native';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { WatermelonLocalChatManager, LocalMessage, LocalConversation } from './WatermelonLocalChatManager';
import Logger from '../utils/LogUtils';

export interface Message extends LocalMessage {}
export interface Conversation extends LocalConversation {}

export interface FCMChatEventHandlers {
  onMessageReceived?: (message: Message) => void;
  onMessageSent?: (message: Message) => void;
  onMessageDelivered?: (messageId: string) => void;
  onConversationUpdated?: (conversation: Conversation) => void;
  onError?: (error: string) => void;
}

export class FCMChatServiceLocal {
  private static instance: FCMChatServiceLocal;
  private isInitialized = false;
  private currentUserId: string | null = null;
  private eventHandlers: FCMChatEventHandlers = {};
  private localChatManager: WatermelonLocalChatManager;
  private currentConversationId: string | null = null;
  private currentParticipantId: string | null = null;

  private constructor() {
    this.localChatManager = new WatermelonLocalChatManager();
  }

  static getInstance(): FCMChatServiceLocal {
    if (!FCMChatServiceLocal.instance) {
      FCMChatServiceLocal.instance = new FCMChatServiceLocal();
    }
    return FCMChatServiceLocal.instance;
  }

  /**
   * Initialize the service
   */
  async initialize(userId: string, authToken: string, eventHandlers: FCMChatEventHandlers = {}): Promise<void> {
    try {
      this.currentUserId = userId;
      this.eventHandlers = eventHandlers;

      // Get user name from storage
      const userName = await this.getCurrentUserName();
      if (!userName) {
        throw new Error('User name not available for chat initialization');
      }

      // Initialize LocalChatManager with event handlers
      const localEventHandlers = {
        onMessageReceived: (message: Message) => {
          this.eventHandlers.onMessageReceived?.(message);
        },
        onMessageSent: (message: Message) => {
          this.eventHandlers.onMessageSent?.(message);
        },
        onConversationUpdated: (conversation: Conversation) => {
          this.eventHandlers.onConversationUpdated?.(conversation);
        },
        onUnreadCountChanged: (conversationId: string, count: number) => {
          // Handle unread count changes
          console.log('[FCMChatServiceLocal] Unread count changed:', conversationId, count);
        }
      };

      await this.localChatManager.initialize(userId, userName, localEventHandlers);

      // Setup FCM for notifications
      await this.setupFCMForChat();

      // Setup app state handling
      this.setupAppStateHandling();

      this.isInitialized = true;
      console.log('[FCMChatServiceLocal] Initialized successfully');
    } catch (error) {
      console.error('[FCMChatServiceLocal] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Check if service is initialized
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Send a message
   */
  async sendMessage(conversationId: string, content: string, replyTo?: string): Promise<Message> {
    if (!this.isInitialized) {
      throw new Error('FCM Chat Service not initialized');
    }

    try {
      // Send message via LocalChatManager
      const message = await this.localChatManager.sendMessage(conversationId, content, replyTo);
      
      // Emit event
      this.eventHandlers.onMessageSent?.(message);
      
      return message;
    } catch (error) {
      console.error('[FCMChatServiceLocal] Error sending message:', error);
      this.eventHandlers.onError?.('Failed to send message');
      throw error;
    }
  }

  /**
   * Create or get conversation
   */
  async createOrGetConversation(participantId: string): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('FCM Chat Service not initialized');
    }

    try {
      const conversationId = await this.localChatManager.createOrGetConversation(participantId);
      
      // Update current conversation tracking
      this.currentConversationId = conversationId;
      this.currentParticipantId = participantId;
      
      return conversationId;
    } catch (error) {
      console.error('[FCMChatServiceLocal] Error creating/getting conversation:', error);
      throw error;
    }
  }

  /**
   * Get conversations
   */
  async getConversations(): Promise<Conversation[]> {
    if (!this.isInitialized) {
      return [];
    }

    try {
      return await this.localChatManager.getConversations();
    } catch (error) {
      console.error('[FCMChatServiceLocal] Error getting conversations:', error);
      return [];
    }
  }

  /**
   * Get messages for conversation
   */
  async getMessages(conversationId: string): Promise<Message[]> {
    if (!this.isInitialized) {
      return [];
    }

    try {
      return await this.localChatManager.getMessages(conversationId);
    } catch (error) {
      console.error('[FCMChatServiceLocal] Error getting messages:', error);
      return [];
    }
  }

  /**
   * Set current conversation for notification management
   */
  setCurrentConversation(conversationId: string | null, participantId?: string): void {
    this.currentConversationId = conversationId;
    this.currentParticipantId = participantId || null;
    
    // Update LocalChatManager
    this.localChatManager.setActiveConversation(conversationId);
    
    Logger.log('[FCMChatServiceLocal] Current conversation set to:', conversationId);
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: string): Promise<void> {
    if (!this.isInitialized) return;

    try {
      await this.localChatManager.markMessagesAsRead(conversationId);
    } catch (error) {
      console.error('[FCMChatServiceLocal] Error marking messages as read:', error);
    }
  }

  /**
   * Get current user name from storage
   */
  private async getCurrentUserName(): Promise<string | null> {
    try {
      // Try multiple sources for user name
      const userName = await AsyncStorage.getItem('userName');
      if (userName) return userName;

      const userDataString = await AsyncStorage.getItem('user');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        return userData.name || userData.username || null;
      }

      return null;
    } catch (error) {
      console.error('[FCMChatServiceLocal] Error getting user name:', error);
      return null;
    }
  }

  /**
   * Setup FCM for chat notifications
   */
  private async setupFCMForChat(): Promise<void> {
    try {
      // Request permission
      const authStatus = await messaging().requestPermission();
      const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                     authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.warn('[FCMChatServiceLocal] FCM permission not granted');
        return;
      }

      // Get FCM token
      const fcmToken = await messaging().getToken();
      Logger.log('[FCMChatServiceLocal] FCM Token obtained:', fcmToken.substring(0, 20) + '...');

      // Store token locally
      await AsyncStorage.setItem('@fcm_token', fcmToken);

      // Setup message handlers
      this.setupFCMMessageHandlers();

      console.log('[FCMChatServiceLocal] FCM setup completed');
    } catch (error) {
      console.error('[FCMChatServiceLocal] Error setting up FCM:', error);
    }
  }

  /**
   * Setup FCM message handlers
   */
  private setupFCMMessageHandlers(): void {
    // Handle foreground messages
    messaging().onMessage(async (remoteMessage) => {
      await this.handleFCMMessage(remoteMessage, 'foreground');
    });

    // Handle background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      await this.handleFCMMessage(remoteMessage, 'background');
    });

    // Handle notification interactions
    notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS && detail.notification?.data?.conversationId) {
        this.handleNotificationPress(detail.notification.data.conversationId as string);
      }
    });
  }

  /**
   * Handle FCM message
   */
  private async handleFCMMessage(remoteMessage: FirebaseMessagingTypes.RemoteMessage, context: 'foreground' | 'background'): Promise<void> {
    try {
      const { data } = remoteMessage;
      
      if (data?.type !== 'chat_message') return;

      console.log('[FCMChatServiceLocal] Handling FCM chat message:', {
        context,
        conversationId: data.conversationId,
        senderId: data.senderId
      });

      // Create message object
      const message: Message = {
        id: data.messageId as string,
        conversationId: data.conversationId as string,
        senderId: data.senderId as string,
        senderName: data.senderName as string,
        content: data.content as string,
        messageType: 'text',
        createdAt: data.timestamp as string,
        status: 'delivered'
      };

      // Let LocalChatManager handle the message processing
      // It will save to storage and manage notifications
      
      // Emit event for UI updates
      this.eventHandlers.onMessageReceived?.(message);

      // Show notification if not in active chat
      if (this.currentConversationId !== data.conversationId) {
        await this.showChatNotification(message);
      }

    } catch (error) {
      console.error('[FCMChatServiceLocal] Error handling FCM message:', error);
    }
  }

  /**
   * Show chat notification
   */
  private async showChatNotification(message: Message): Promise<void> {
    try {
      await notifee.displayNotification({
        title: message.senderName,
        body: message.content,
        data: {
          conversationId: message.conversationId,
          senderId: message.senderId
        },
        android: {
          channelId: 'chat',
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
        },
        ios: {
          sound: 'default',
        },
      });
    } catch (error) {
      console.error('[FCMChatServiceLocal] Error showing notification:', error);
    }
  }

  /**
   * Handle notification press
   */
  private handleNotificationPress(conversationId: string): void {
    // Navigate to chat screen
    // This would typically use navigation service
    console.log('[FCMChatServiceLocal] Notification pressed for conversation:', conversationId);
  }

  /**
   * Setup app state handling
   */
  private setupAppStateHandling(): void {
    AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App became active - clear notifications for current conversation
        if (this.currentConversationId) {
          this.clearNotificationsForConversation(this.currentConversationId);
        }
      }
    });
  }

  /**
   * Clear notifications for conversation
   */
  private async clearNotificationsForConversation(conversationId: string): Promise<void> {
    try {
      // Clear notifications that match the conversation
      const notifications = await notifee.getDisplayedNotifications();
      for (const notification of notifications) {
        if (notification.notification?.data?.conversationId === conversationId) {
          await notifee.cancelNotification(notification.id);
        }
      }
    } catch (error) {
      console.error('[FCMChatServiceLocal] Error clearing notifications:', error);
    }
  }
}
