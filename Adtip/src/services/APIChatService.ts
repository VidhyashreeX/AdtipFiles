/**
 * API-based Chat Service
 * 
 * Replaces Socket.IO with REST API calls for chat functionality.
 * Integrates with FCM for real-time notifications and local database
 * for offline persistence.
 */

import ApiService from './ApiService';
import LocalChatDatabase, { LocalMessage, LocalConversation, LocalUserProfile } from './LocalChatDatabase';
import { FCM_CHAT_ENDPOINTS } from '../constants/apiEndpoints';

export interface APIChatMessage {
  id?: string | number;
  conversationId: string | number;
  senderId: string | number;
  receiverId?: string | number;
  content: string;
  messageType: 'text' | 'image' | 'video' | 'audio' | 'file';
  replyTo?: string | number;
  tempId?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
}

export interface APIChatConversation {
  id: string | number;
  type: 'direct' | 'group';
  title?: string;
  participants: number[];
  createdBy: number;
  isActive: boolean;
}

export interface APIChatEventHandlers {
  onMessageReceived?: (message: LocalMessage) => void;
  onMessageSent?: (message: LocalMessage) => void;
  onMessageDelivered?: (messageId: string | number) => void;
  onMessageRead?: (messageId: string | number) => void;
  onConversationUpdated?: (conversation: LocalConversation) => void;
  onUserStatusChanged?: (userId: number, isOnline: boolean) => void;
  onError?: (error: string) => void;
}

class APIChatService {
  private static instance: APIChatService;
  private localDB: LocalChatDatabase;
  private eventHandlers: APIChatEventHandlers = {};
  private currentUserId: string | null = null;
  private authToken: string | null = null;
  private isInitialized = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private offlineQueueInterval: NodeJS.Timeout | null = null;

  static getInstance(): APIChatService {
    if (!APIChatService.instance) {
      APIChatService.instance = new APIChatService();
    }
    return APIChatService.instance;
  }

  constructor() {
    this.localDB = LocalChatDatabase.getInstance();
  }

  /**
   * Initialize the API chat service
   */
  async initialize(userId: string, authToken: string): Promise<void> {
    try {
      console.log('[APIChatService] Initializing...');
      
      this.currentUserId = userId;
      this.authToken = authToken;
      
      // Initialize local database
      await this.localDB.initialize();
      
      // Start periodic sync
      this.startPeriodicSync();
      
      // Start offline queue processing
      this.startOfflineQueueProcessing();
      
      this.isInitialized = true;
      console.log('[APIChatService] Initialized successfully');
    } catch (error) {
      console.error('[APIChatService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Set event handlers
   */
  setEventHandlers(handlers: APIChatEventHandlers): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  /**
   * Get current user information
   */
  private async getCurrentUser(): Promise<{ id: string; name: string } | null> {
    if (!this.currentUserId) {
      return null;
    }

    try {
      // Try to get user info from local database first
      const userProfile = await this.localDB.getUserProfile(this.currentUserId);
      if (userProfile) {
        return {
          id: this.currentUserId,
          name: userProfile.name || 'Unknown User'
        };
      }

      // If not in local DB, return basic info
      return {
        id: this.currentUserId,
        name: 'Unknown User'
      };
    } catch (error) {
      console.warn('[APIChatService] Error getting current user:', error);
      return {
        id: this.currentUserId,
        name: 'Unknown User'
      };
    }
  }

  /**
   * Start periodic sync with server
   */
  private startPeriodicSync(): void {
    // Sync every 30 seconds when app is active
    this.syncInterval = setInterval(async () => {
      try {
        await this.syncWithServer();
      } catch (error) {
        console.error('[APIChatService] Periodic sync failed:', error);
      }
    }, 30000);
  }

  /**
   * Start offline queue processing
   */
  private startOfflineQueueProcessing(): void {
    // Process offline queue every 10 seconds
    this.offlineQueueInterval = setInterval(async () => {
      try {
        await this.processOfflineQueue();
      } catch (error) {
        console.error('[APIChatService] Offline queue processing failed:', error);
      }
    }, 10000);
  }

  /**
   * Stop all background processes
   */
  cleanup(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    if (this.offlineQueueInterval) {
      clearInterval(this.offlineQueueInterval);
      this.offlineQueueInterval = null;
    }
    
    this.isInitialized = false;
    console.log('[APIChatService] Cleanup completed');
  }

  // =====================================================
  // CONVERSATION MANAGEMENT
  // =====================================================

  /**
   * Get conversations from server and sync with local
   */
  async getConversations(): Promise<LocalConversation[]> {
    try {
      console.log('[APIChatService] Fetching conversations...');
      
      // Try to get from server first
      try {
        const response = await ApiService.get('/api/chat/conversations');
        
        if (response.status === 200 && response.data) {
          const serverConversations = response.data.map(this.mapServerConversationToLocal);
          
          // Save to local database
          for (const conversation of serverConversations) {
            await this.localDB.saveConversation(conversation);
          }
          
          console.log(`[APIChatService] Synced ${serverConversations.length} conversations from server`);
          return serverConversations;
        }
      } catch (error) {
        console.warn('[APIChatService] Failed to fetch from server, using local data:', error);
      }
      
      // Fallback to local data
      const localConversations = await this.localDB.getConversations();
      console.log(`[APIChatService] Using ${localConversations.length} local conversations`);
      return localConversations;
      
    } catch (error) {
      console.error('[APIChatService] Error getting conversations:', error);
      this.eventHandlers.onError?.('Failed to get conversations');
      return [];
    }
  }

  /**
   * Create a new conversation
   */
  async createConversation(participants: number[], type: 'direct' | 'group' = 'direct', title?: string): Promise<LocalConversation | null> {
    try {
      console.log('[APIChatService] Creating conversation...');
      
      const conversationData: APIChatConversation = {
        id: `temp_${Date.now()}`,
        type,
        title,
        participants,
        createdBy: parseInt(this.currentUserId!),
        isActive: true,
      };
      
      try {
        // Try to create on server
        const response = await ApiService.post('/api/chat/conversations', conversationData);
        
        if (response.status === 201 && response.data) {
          const serverConversation = this.mapServerConversationToLocal(response.data);
          await this.localDB.saveConversation(serverConversation);
          
          this.eventHandlers.onConversationUpdated?.(serverConversation);
          return serverConversation;
        }
      } catch (error) {
        console.warn('[APIChatService] Failed to create on server, saving locally:', error);
        
        // Add to offline queue
        await this.localDB.addToOfflineQueue({
          type: 'update_conversation',
          data: conversationData,
          maxRetries: 5,
        });
      }
      
      // Save locally
      const localConversation = this.mapServerConversationToLocal(conversationData);
      await this.localDB.saveConversation(localConversation);
      
      this.eventHandlers.onConversationUpdated?.(localConversation);
      return localConversation;
      
    } catch (error) {
      console.error('[APIChatService] Error creating conversation:', error);
      this.eventHandlers.onError?.('Failed to create conversation');
      return null;
    }
  }

  // =====================================================
  // MESSAGE MANAGEMENT
  // =====================================================

  /**
   * Send a message
   */
  async sendMessage(messageData: APIChatMessage): Promise<LocalMessage | null> {
    try {
      console.log('[APIChatService] Sending message...');
      
      // Create local message with temp ID
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const localMessage: LocalMessage = {
        ...messageData,
        id: tempId,
        tempId,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        isRead: false,
        isSent: false,
        isDelivered: false,
      };
      
      // Save locally immediately for instant UI update
      await this.localDB.addMessage(localMessage);
      this.eventHandlers.onMessageSent?.(localMessage);
      
      try {
        // Get current user info for the message
        const currentUser = await this.getCurrentUser();
        if (!currentUser) {
          throw new Error('User not authenticated');
        }

        // Get recipient info for FCM token
        const conversation = await this.localDB.getConversation(messageData.conversationId);
        if (!conversation) {
          throw new Error('Conversation not found');
        }

        // For direct conversations, find the other participant
        const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id);
        if (!otherParticipant) {
          throw new Error('Recipient not found');
        }

        // Try to send to server via Firebase Cloud Function endpoint
        const fcmResponse = await ApiService.sendChatMessage({
          senderId: currentUser.id,
          senderName: currentUser.name,
          recipientId: otherParticipant.id,
          recipientToken: otherParticipant.fcmToken, // This should be available from conversation data
          conversationId: messageData.conversationId,
          content: messageData.content,
          messageType: messageData.messageType,
          replyToMessageId: messageData.replyTo,
        });

        if (fcmResponse.success) {
          // Save message to database via backend API
          const dbResponse = await ApiService.post('/api/chat/save-message', {
            conversationId: messageData.conversationId,
            content: messageData.content,
            messageType: messageData.messageType,
            replyToMessageId: messageData.replyTo,
            messageId: fcmResponse.data?.messageId // Link to FCM message
          });

          // Update local message with database response
          const updatedMessage: LocalMessage = {
            ...localMessage,
            id: dbResponse.data?.message?.id || fcmResponse.data?.messageId,
            isSent: true,
            isDelivered: true,
            timestamp: dbResponse.data?.message?.created_at || fcmResponse.data?.timestamp,
          };

          await this.localDB.addMessage(updatedMessage);
          this.eventHandlers.onMessageSent?.(updatedMessage);

          return updatedMessage;
        }
      } catch (error) {
        console.warn('[APIChatService] Failed to send to server, queuing for retry:', error);
        
        // Add to offline queue for retry
        await this.localDB.addToOfflineQueue({
          type: 'send_message',
          data: messageData,
          maxRetries: 5,
        });
      }
      
      return localMessage;
      
    } catch (error) {
      console.error('[APIChatService] Error sending message:', error);
      this.eventHandlers.onError?.('Failed to send message');
      return null;
    }
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string | number, page: number = 1, limit: number = 50): Promise<LocalMessage[]> {
    try {
      console.log(`[APIChatService] Getting messages for conversation ${conversationId}...`);

      // Try to get from server first
      try {
        const response = await ApiService.get(`/api/chat/conversations/${conversationId}/messages`, {
          params: { page, limit }
        });

        if (response.status === 200 && response.data) {
          const serverMessages = response.data.map(this.mapServerMessageToLocal);

          // Save to local database
          for (const message of serverMessages) {
            await this.localDB.addMessage(message);
          }

          console.log(`[APIChatService] Synced ${serverMessages.length} messages from server`);
          return serverMessages;
        }
      } catch (error) {
        console.warn('[APIChatService] Failed to fetch messages from server, using local data:', error);
      }

      // Fallback to local data
      const localMessages = await this.localDB.getMessages(conversationId);
      console.log(`[APIChatService] Using ${localMessages.length} local messages`);
      return localMessages;

    } catch (error) {
      console.error('[APIChatService] Error getting messages:', error);
      this.eventHandlers.onError?.('Failed to get messages');
      return [];
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: string | number, messageIds: (string | number)[]): Promise<void> {
    try {
      console.log(`[APIChatService] Marking ${messageIds.length} messages as read...`);

      // Update locally first
      for (const messageId of messageIds) {
        await this.localDB.updateMessageStatus(messageId, { isRead: true });
      }

      // Clear unread count
      await this.localDB.clearUnreadCount(conversationId);

      try {
        // Try to update on server
        await ApiService.post(`/api/chat/conversations/${conversationId}/mark-read`, {
          messageIds
        });

        console.log('[APIChatService] Messages marked as read on server');
      } catch (error) {
        console.warn('[APIChatService] Failed to mark as read on server, queuing for retry:', error);

        // Add to offline queue
        await this.localDB.addToOfflineQueue({
          type: 'mark_read',
          data: { conversationId, messageIds },
          maxRetries: 3,
        });
      }

    } catch (error) {
      console.error('[APIChatService] Error marking messages as read:', error);
      this.eventHandlers.onError?.('Failed to mark messages as read');
    }
  }

  // =====================================================
  // SYNC AND OFFLINE MANAGEMENT
  // =====================================================

  /**
   * Sync with server
   */
  private async syncWithServer(): Promise<void> {
    try {
      console.log('[APIChatService] Starting sync with server...');

      // Get last sync time
      const lastSyncTime = await this.localDB.getLastSyncTime();

      // Sync conversations
      await this.syncConversations(lastSyncTime);

      // Sync messages for each conversation
      const conversations = await this.localDB.getConversations();
      for (const conversation of conversations) {
        await this.syncConversationMessages(conversation.id, lastSyncTime);
      }

      // Update last sync time
      await this.localDB.updateLastSyncTime();

      console.log('[APIChatService] Sync completed successfully');
    } catch (error) {
      console.error('[APIChatService] Sync failed:', error);
    }
  }

  /**
   * Sync conversations with server
   */
  private async syncConversations(since?: string | null): Promise<void> {
    try {
      const params = since ? { since } : {};
      const response = await ApiService.get('/api/chat/conversations', { params });

      if (response.status === 200 && response.data) {
        for (const serverConversation of response.data) {
          const localConversation = this.mapServerConversationToLocal(serverConversation);
          await this.localDB.saveConversation(localConversation);
          this.eventHandlers.onConversationUpdated?.(localConversation);
        }
      }
    } catch (error) {
      console.warn('[APIChatService] Failed to sync conversations:', error);
    }
  }

  /**
   * Sync messages for a conversation
   */
  private async syncConversationMessages(conversationId: string | number, since?: string | null): Promise<void> {
    try {
      const params = since ? { since } : {};
      const response = await ApiService.get(`/api/chat/conversations/${conversationId}/messages`, { params });

      if (response.status === 200 && response.data) {
        for (const serverMessage of response.data) {
          const localMessage = this.mapServerMessageToLocal(serverMessage);
          await this.localDB.addMessage(localMessage);
          this.eventHandlers.onMessageReceived?.(localMessage);
        }
      }
    } catch (error) {
      console.warn(`[APIChatService] Failed to sync messages for conversation ${conversationId}:`, error);
    }
  }

  /**
   * Process offline queue
   */
  private async processOfflineQueue(): Promise<void> {
    try {
      const queue = await this.localDB.getOfflineQueue();

      if (queue.length === 0) {
        return;
      }

      console.log(`[APIChatService] Processing ${queue.length} offline queue items...`);

      for (const item of queue) {
        try {
          let success = false;

          switch (item.type) {
            case 'send_message':
              success = await this.retrySendMessage(item.data);
              break;
            case 'mark_read':
              success = await this.retryMarkRead(item.data);
              break;
            case 'update_conversation':
              success = await this.retryUpdateConversation(item.data);
              break;
          }

          if (success) {
            await this.localDB.removeFromOfflineQueue(item.id);
            console.log(`[APIChatService] Successfully processed offline item: ${item.id}`);
          } else {
            await this.localDB.updateOfflineQueueItemRetry(item.id);
            console.log(`[APIChatService] Retry failed for offline item: ${item.id}, attempt ${item.retryCount + 1}`);
          }
        } catch (error) {
          console.error(`[APIChatService] Error processing offline item ${item.id}:`, error);
          await this.localDB.updateOfflineQueueItemRetry(item.id);
        }
      }
    } catch (error) {
      console.error('[APIChatService] Error processing offline queue:', error);
    }
  }

  /**
   * Retry sending a message
   */
  private async retrySendMessage(messageData: APIChatMessage): Promise<boolean> {
    try {
      const response = await ApiService.sendChatMessage({
        senderId: messageData.senderId.toString(),
        senderName: 'User', // We might not have the name in retry context
        recipientId: messageData.receiverId?.toString() || '',
        recipientToken: '', // This would need to be fetched
        conversationId: messageData.conversationId.toString(),
        content: messageData.content,
        messageType: messageData.messageType,
        replyToMessageId: messageData.replyTo?.toString()
      });
      return response.success;
    } catch (error) {
      console.warn('[APIChatService] Retry send message failed:', error);
      return false;
    }
  }

  /**
   * Retry marking messages as read
   */
  private async retryMarkRead(data: { conversationId: string | number; messageIds: (string | number)[] }): Promise<boolean> {
    try {
      const response = await ApiService.post(`/api/chat/conversations/${data.conversationId}/mark-read`, {
        messageIds: data.messageIds
      });
      return response.status === 200;
    } catch (error) {
      console.warn('[APIChatService] Retry mark read failed:', error);
      return false;
    }
  }

  /**
   * Retry updating conversation
   */
  private async retryUpdateConversation(conversationData: APIChatConversation): Promise<boolean> {
    try {
      const response = await ApiService.post('/api/chat/conversations', conversationData);
      return response.status === 201;
    } catch (error) {
      console.warn('[APIChatService] Retry update conversation failed:', error);
      return false;
    }
  }

  // =====================================================
  // MAPPING FUNCTIONS
  // =====================================================

  /**
   * Map server conversation to local format
   */
  private mapServerConversationToLocal(serverConversation: any): LocalConversation {
    return {
      id: serverConversation.id,
      type: serverConversation.type || 'direct',
      title: serverConversation.title,
      participants: serverConversation.participants || [],
      lastMessage: serverConversation.lastMessage ? this.mapServerMessageToLocal(serverConversation.lastMessage) : undefined,
      lastActivity: serverConversation.lastActivity || serverConversation.updated_at || new Date().toISOString(),
      unreadCount: serverConversation.unreadCount || 0,
      isActive: serverConversation.isActive !== false,
      createdAt: serverConversation.created_at || new Date().toISOString(),
      updatedAt: serverConversation.updated_at || new Date().toISOString(),
    };
  }

  /**
   * Map server message to local format
   */
  private mapServerMessageToLocal(serverMessage: any): LocalMessage {
    return {
      id: serverMessage.id,
      conversationId: serverMessage.conversation_id || serverMessage.conversationId,
      senderId: serverMessage.sender_id || serverMessage.senderId,
      receiverId: serverMessage.receiver_id || serverMessage.receiverId,
      content: serverMessage.content,
      messageType: serverMessage.message_type || serverMessage.messageType || 'text',
      timestamp: serverMessage.created_at || serverMessage.timestamp || new Date().toISOString(),
      createdAt: serverMessage.created_at || new Date().toISOString(),
      isRead: serverMessage.is_read || serverMessage.isRead || false,
      isSent: true, // Messages from server are considered sent
      isDelivered: true, // Messages from server are considered delivered
      tempId: serverMessage.temp_id || serverMessage.tempId,
      replyTo: serverMessage.reply_to || serverMessage.replyTo,
      fileUrl: serverMessage.file_url || serverMessage.fileUrl,
      fileName: serverMessage.file_name || serverMessage.fileName,
      fileSize: serverMessage.file_size || serverMessage.fileSize,
      fileMimeType: serverMessage.file_mime_type || serverMessage.fileMimeType,
    };
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    return await this.localDB.getStorageStats();
  }

  /**
   * Clear all local data
   */
  async clearAllData(): Promise<void> {
    await this.localDB.clearAllData();
  }

  /**
   * Handle incoming FCM message
   */
  async handleIncomingFCMMessage(messageData: any): Promise<void> {
    try {
      console.log('[APIChatService] Handling incoming FCM message:', messageData);

      if (messageData.type === 'chat_message') {
        const localMessage: LocalMessage = {
          id: messageData.messageId || Date.now(),
          conversationId: messageData.conversationId,
          senderId: messageData.senderId,
          content: messageData.content || 'New message',
          messageType: 'text',
          timestamp: messageData.timestamp || new Date().toISOString(),
          createdAt: messageData.timestamp || new Date().toISOString(),
          isRead: false,
          isSent: true,
          isDelivered: true,
        };

        await this.localDB.addMessage(localMessage);
        this.eventHandlers.onMessageReceived?.(localMessage);

        // Update unread count
        const unreadCounts = await this.localDB.getUnreadCounts();
        const currentCount = unreadCounts[localMessage.conversationId.toString()] || 0;
        await this.localDB.updateUnreadCount(localMessage.conversationId, currentCount + 1);
      }
    } catch (error) {
      console.error('[APIChatService] Error handling incoming FCM message:', error);
    }
  }
}

export default APIChatService;
