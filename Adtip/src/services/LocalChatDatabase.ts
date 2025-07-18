/**
 * Local Chat Database Service
 * 
 * Enhanced AsyncStorage-based local database system for chat history persistence
 * and offline viewing capabilities. Provides robust data management with
 * synchronization support.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  CONVERSATIONS: '@chat_conversations',
  MESSAGES_PREFIX: '@chat_messages_',
  USER_PROFILE_PREFIX: '@chat_user_',
  SYNC_STATUS: '@chat_sync_status',
  OFFLINE_QUEUE: '@chat_offline_queue',
  LAST_SYNC: '@chat_last_sync',
  UNREAD_COUNTS: '@chat_unread_counts',
};

// Types
export interface LocalMessage {
  id: string | number;
  conversationId: string | number;
  senderId: string | number;
  receiverId?: string | number;
  content: string;
  messageType: 'text' | 'image' | 'video' | 'audio' | 'file';
  timestamp: string;
  createdAt: string;
  isRead: boolean;
  isSent: boolean;
  isDelivered: boolean;
  tempId?: string;
  replyTo?: string | number;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
}

export interface LocalConversation {
  id: string | number;
  type: 'direct' | 'group';
  title?: string;
  participants: number[];
  lastMessage?: LocalMessage;
  lastActivity: string;
  unreadCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocalUserProfile {
  id: number;
  name: string;
  profileImage?: string;
  isOnline: boolean;
  lastSeen?: string;
}

export interface SyncStatus {
  conversationId: string | number;
  lastSyncedMessageId?: string | number;
  lastSyncTime: string;
  pendingMessages: number;
}

export interface OfflineQueueItem {
  id: string;
  type: 'send_message' | 'mark_read' | 'update_conversation';
  data: any;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
}

class LocalChatDatabase {
  private static instance: LocalChatDatabase;
  private isInitialized = false;

  static getInstance(): LocalChatDatabase {
    if (!LocalChatDatabase.instance) {
      LocalChatDatabase.instance = new LocalChatDatabase();
    }
    return LocalChatDatabase.instance;
  }

  /**
   * Initialize the local database
   */
  async initialize(): Promise<void> {
    try {
      console.log('[LocalChatDatabase] Initializing...');
      
      // Ensure all required storage structures exist
      await this.ensureStorageStructure();
      
      // Clean up old data if needed
      await this.performMaintenance();
      
      this.isInitialized = true;
      console.log('[LocalChatDatabase] Initialized successfully');
    } catch (error) {
      console.error('[LocalChatDatabase] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Ensure storage structure exists
   */
  private async ensureStorageStructure(): Promise<void> {
    try {
      // Initialize conversations list if not exists
      const conversations = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      if (!conversations) {
        await AsyncStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify([]));
      }

      // Initialize sync status if not exists
      const syncStatus = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_STATUS);
      if (!syncStatus) {
        await AsyncStorage.setItem(STORAGE_KEYS.SYNC_STATUS, JSON.stringify({}));
      }

      // Initialize offline queue if not exists
      const offlineQueue = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      if (!offlineQueue) {
        await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify([]));
      }

      // Initialize unread counts if not exists
      const unreadCounts = await AsyncStorage.getItem(STORAGE_KEYS.UNREAD_COUNTS);
      if (!unreadCounts) {
        await AsyncStorage.setItem(STORAGE_KEYS.UNREAD_COUNTS, JSON.stringify({}));
      }
    } catch (error) {
      console.error('[LocalChatDatabase] Error ensuring storage structure:', error);
      throw error;
    }
  }

  /**
   * Perform database maintenance
   */
  private async performMaintenance(): Promise<void> {
    try {
      // Clean up old messages (keep last 1000 messages per conversation)
      await this.cleanupOldMessages();
      
      // Clean up failed offline queue items
      await this.cleanupOfflineQueue();
      
      console.log('[LocalChatDatabase] Maintenance completed');
    } catch (error) {
      console.error('[LocalChatDatabase] Maintenance failed:', error);
    }
  }

  /**
   * Clean up old messages to prevent storage bloat
   */
  private async cleanupOldMessages(): Promise<void> {
    try {
      const conversations = await this.getConversations();
      
      for (const conversation of conversations) {
        const messages = await this.getMessages(conversation.id);
        
        // Keep only the latest 1000 messages
        if (messages.length > 1000) {
          const messagesToKeep = messages
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 1000);
          
          await this.saveMessages(conversation.id, messagesToKeep);
          console.log(`[LocalChatDatabase] Cleaned up ${messages.length - 1000} old messages for conversation ${conversation.id}`);
        }
      }
    } catch (error) {
      console.error('[LocalChatDatabase] Error cleaning up old messages:', error);
    }
  }

  /**
   * Clean up failed offline queue items
   */
  private async cleanupOfflineQueue(): Promise<void> {
    try {
      const queue = await this.getOfflineQueue();
      const now = new Date();
      
      // Remove items older than 24 hours or with max retries exceeded
      const cleanQueue = queue.filter(item => {
        const itemAge = now.getTime() - new Date(item.timestamp).getTime();
        const isOld = itemAge > 24 * 60 * 60 * 1000; // 24 hours
        const maxRetriesExceeded = item.retryCount >= item.maxRetries;
        
        return !isOld && !maxRetriesExceeded;
      });
      
      if (cleanQueue.length !== queue.length) {
        await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(cleanQueue));
        console.log(`[LocalChatDatabase] Cleaned up ${queue.length - cleanQueue.length} offline queue items`);
      }
    } catch (error) {
      console.error('[LocalChatDatabase] Error cleaning up offline queue:', error);
    }
  }

  // =====================================================
  // CONVERSATION MANAGEMENT
  // =====================================================

  /**
   * Get all conversations
   */
  async getConversations(): Promise<LocalConversation[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[LocalChatDatabase] Error getting conversations:', error);
      return [];
    }
  }

  /**
   * Save conversations
   */
  async saveConversations(conversations: LocalConversation[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
    } catch (error) {
      console.error('[LocalChatDatabase] Error saving conversations:', error);
      throw error;
    }
  }

  /**
   * Get conversation by ID
   */
  async getConversation(conversationId: string | number): Promise<LocalConversation | null> {
    try {
      const conversations = await this.getConversations();
      return conversations.find(c => c.id.toString() === conversationId.toString()) || null;
    } catch (error) {
      console.error('[LocalChatDatabase] Error getting conversation:', error);
      return null;
    }
  }

  /**
   * Save or update conversation
   */
  async saveConversation(conversation: LocalConversation): Promise<void> {
    try {
      const conversations = await this.getConversations();
      const existingIndex = conversations.findIndex(c => c.id.toString() === conversation.id.toString());

      if (existingIndex >= 0) {
        conversations[existingIndex] = { ...conversations[existingIndex], ...conversation, updatedAt: new Date().toISOString() };
      } else {
        conversations.push({ ...conversation, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      }

      await this.saveConversations(conversations);
    } catch (error) {
      console.error('[LocalChatDatabase] Error saving conversation:', error);
      throw error;
    }
  }

  // =====================================================
  // MESSAGE MANAGEMENT
  // =====================================================

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string | number): Promise<LocalMessage[]> {
    try {
      const key = `${STORAGE_KEYS.MESSAGES_PREFIX}${conversationId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[LocalChatDatabase] Error getting messages:', error);
      return [];
    }
  }

  /**
   * Save messages for a conversation
   */
  async saveMessages(conversationId: string | number, messages: LocalMessage[]): Promise<void> {
    try {
      const key = `${STORAGE_KEYS.MESSAGES_PREFIX}${conversationId}`;
      await AsyncStorage.setItem(key, JSON.stringify(messages));
    } catch (error) {
      console.error('[LocalChatDatabase] Error saving messages:', error);
      throw error;
    }
  }

  /**
   * Add a single message
   */
  async addMessage(message: LocalMessage): Promise<void> {
    try {
      const messages = await this.getMessages(message.conversationId);

      // Check if message already exists (prevent duplicates)
      const existingIndex = messages.findIndex(m =>
        m.id.toString() === message.id.toString() ||
        (message.tempId && m.tempId === message.tempId)
      );

      if (existingIndex >= 0) {
        // Update existing message
        messages[existingIndex] = message;
      } else {
        // Add new message
        messages.push(message);
      }

      // Sort messages by timestamp
      messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      await this.saveMessages(message.conversationId, messages);

      // Update conversation's last message
      await this.updateConversationLastMessage(message.conversationId, message);
    } catch (error) {
      console.error('[LocalChatDatabase] Error adding message:', error);
      throw error;
    }
  }

  /**
   * Update message status (read, delivered, etc.)
   */
  async updateMessageStatus(messageId: string | number, updates: Partial<LocalMessage>): Promise<void> {
    try {
      // Find the message across all conversations
      const conversations = await this.getConversations();

      for (const conversation of conversations) {
        const messages = await this.getMessages(conversation.id);
        const messageIndex = messages.findIndex(m => m.id.toString() === messageId.toString());

        if (messageIndex >= 0) {
          messages[messageIndex] = { ...messages[messageIndex], ...updates };
          await this.saveMessages(conversation.id, messages);
          break;
        }
      }
    } catch (error) {
      console.error('[LocalChatDatabase] Error updating message status:', error);
      throw error;
    }
  }

  /**
   * Update conversation's last message
   */
  private async updateConversationLastMessage(conversationId: string | number, message: LocalMessage): Promise<void> {
    try {
      const conversation = await this.getConversation(conversationId);
      if (conversation) {
        conversation.lastMessage = message;
        conversation.lastActivity = message.timestamp;
        await this.saveConversation(conversation);
      }
    } catch (error) {
      console.error('[LocalChatDatabase] Error updating conversation last message:', error);
    }
  }
  // =====================================================
  // OFFLINE QUEUE MANAGEMENT
  // =====================================================

  /**
   * Get offline queue
   */
  async getOfflineQueue(): Promise<OfflineQueueItem[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[LocalChatDatabase] Error getting offline queue:', error);
      return [];
    }
  }

  /**
   * Add item to offline queue
   */
  async addToOfflineQueue(item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    try {
      const queue = await this.getOfflineQueue();
      const queueItem: OfflineQueueItem = {
        ...item,
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        retryCount: 0,
      };

      queue.push(queueItem);
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    } catch (error) {
      console.error('[LocalChatDatabase] Error adding to offline queue:', error);
      throw error;
    }
  }

  /**
   * Remove item from offline queue
   */
  async removeFromOfflineQueue(itemId: string): Promise<void> {
    try {
      const queue = await this.getOfflineQueue();
      const filteredQueue = queue.filter(item => item.id !== itemId);
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(filteredQueue));
    } catch (error) {
      console.error('[LocalChatDatabase] Error removing from offline queue:', error);
      throw error;
    }
  }

  /**
   * Update offline queue item retry count
   */
  async updateOfflineQueueItemRetry(itemId: string): Promise<void> {
    try {
      const queue = await this.getOfflineQueue();
      const itemIndex = queue.findIndex(item => item.id === itemId);

      if (itemIndex >= 0) {
        queue[itemIndex].retryCount++;
        await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
      }
    } catch (error) {
      console.error('[LocalChatDatabase] Error updating offline queue item:', error);
      throw error;
    }
  }

  // =====================================================
  // USER PROFILE MANAGEMENT
  // =====================================================

  /**
   * Save user profile
   */
  async saveUserProfile(profile: LocalUserProfile): Promise<void> {
    try {
      const key = `${STORAGE_KEYS.USER_PROFILE_PREFIX}${profile.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(profile));
    } catch (error) {
      console.error('[LocalChatDatabase] Error saving user profile:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: number): Promise<LocalUserProfile | null> {
    try {
      const key = `${STORAGE_KEYS.USER_PROFILE_PREFIX}${userId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[LocalChatDatabase] Error getting user profile:', error);
      return null;
    }
  }

  // =====================================================
  // UNREAD COUNT MANAGEMENT
  // =====================================================

  /**
   * Get unread counts for all conversations
   */
  async getUnreadCounts(): Promise<Record<string, number>> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.UNREAD_COUNTS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('[LocalChatDatabase] Error getting unread counts:', error);
      return {};
    }
  }

  /**
   * Update unread count for a conversation
   */
  async updateUnreadCount(conversationId: string | number, count: number): Promise<void> {
    try {
      const unreadCounts = await this.getUnreadCounts();
      unreadCounts[conversationId.toString()] = count;
      await AsyncStorage.setItem(STORAGE_KEYS.UNREAD_COUNTS, JSON.stringify(unreadCounts));
    } catch (error) {
      console.error('[LocalChatDatabase] Error updating unread count:', error);
      throw error;
    }
  }

  /**
   * Clear unread count for a conversation
   */
  async clearUnreadCount(conversationId: string | number): Promise<void> {
    await this.updateUnreadCount(conversationId, 0);
  }

  // =====================================================
  // SYNC STATUS MANAGEMENT
  // =====================================================

  /**
   * Get sync status for all conversations
   */
  async getSyncStatus(): Promise<Record<string, SyncStatus>> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_STATUS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('[LocalChatDatabase] Error getting sync status:', error);
      return {};
    }
  }

  /**
   * Update sync status for a conversation
   */
  async updateSyncStatus(conversationId: string | number, status: Partial<SyncStatus>): Promise<void> {
    try {
      const syncStatuses = await this.getSyncStatus();
      const key = conversationId.toString();

      syncStatuses[key] = {
        ...syncStatuses[key],
        ...status,
        conversationId,
        lastSyncTime: new Date().toISOString(),
      };

      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_STATUS, JSON.stringify(syncStatuses));
    } catch (error) {
      console.error('[LocalChatDatabase] Error updating sync status:', error);
      throw error;
    }
  }

  /**
   * Get last sync time
   */
  async getLastSyncTime(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    } catch (error) {
      console.error('[LocalChatDatabase] Error getting last sync time:', error);
      return null;
    }
  }

  /**
   * Update last sync time
   */
  async updateLastSyncTime(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    } catch (error) {
      console.error('[LocalChatDatabase] Error updating last sync time:', error);
      throw error;
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  /**
   * Clear all chat data (for logout or reset)
   */
  async clearAllData(): Promise<void> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);

      // Also remove all message and user profile keys
      const allKeys = await AsyncStorage.getAllKeys();
      const chatKeys = allKeys.filter(key =>
        key.startsWith(STORAGE_KEYS.MESSAGES_PREFIX) ||
        key.startsWith(STORAGE_KEYS.USER_PROFILE_PREFIX)
      );

      if (chatKeys.length > 0) {
        await AsyncStorage.multiRemove(chatKeys);
      }

      console.log('[LocalChatDatabase] All chat data cleared');
    } catch (error) {
      console.error('[LocalChatDatabase] Error clearing all data:', error);
      throw error;
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    totalConversations: number;
    totalMessages: number;
    offlineQueueSize: number;
    lastSyncTime: string | null;
  }> {
    try {
      const conversations = await this.getConversations();
      const offlineQueue = await this.getOfflineQueue();
      const lastSyncTime = await this.getLastSyncTime();

      let totalMessages = 0;
      for (const conversation of conversations) {
        const messages = await this.getMessages(conversation.id);
        totalMessages += messages.length;
      }

      return {
        totalConversations: conversations.length,
        totalMessages,
        offlineQueueSize: offlineQueue.length,
        lastSyncTime,
      };
    } catch (error) {
      console.error('[LocalChatDatabase] Error getting storage stats:', error);
      return {
        totalConversations: 0,
        totalMessages: 0,
        offlineQueueSize: 0,
        lastSyncTime: null,
      };
    }
  }
}

export default LocalChatDatabase;
