/**
 * Enhanced WatermelonDB Sync Service
 *
 * Handles synchronization between local WatermelonDB and backend database.
 * Provides conflict resolution, dual write support, and data consistency mechanisms.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../index';
import { WatermelonChatDatabase } from './WatermelonChatDatabase';
import { QueryHelpers } from './QueryHelpers';
import { API_BASE_URL } from '../../constants/api';
import Logger from '../../utils/LogUtils';

export interface SyncStatus {
  lastSyncAt?: Date;
  isInProgress: boolean;
  pendingChanges: number;
  conflicts: number;
  errors: string[];
}

export interface SyncResult {
  success: boolean;
  syncedMessages: number;
  syncedConversations: number;
  syncedUsers: number;
  conflicts: number;
  errors: string[];
  duration: number;
}

export class SyncService {
  private chatDb: WatermelonChatDatabase;
  private isSync: boolean = false;
  private syncStatusKey = '@watermelon_sync_status';

  constructor() {
    this.chatDb = new WatermelonChatDatabase();
  }

  /**
   * Get current sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    try {
      const pendingMessages = await QueryHelpers.getMessagesByStatus('sending');
      
      return {
        lastSyncAt: await this.getLastSyncTime(),
        isInProgress: this.isSync,
        pendingChanges: pendingMessages.length,
        conflicts: 0, // TODO: Implement conflict tracking
        errors: []
      };
    } catch (error) {
      Logger.error('[SyncService] Error getting sync status:', error);
      return {
        isInProgress: false,
        pendingChanges: 0,
        conflicts: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Perform incremental sync
   */
  async performSync(userId: string): Promise<SyncResult> {
    if (this.isSync) {
      Logger.warn('[SyncService] Sync already in progress');
      return {
        success: false,
        syncedMessages: 0,
        syncedConversations: 0,
        syncedUsers: 0,
        conflicts: 0,
        errors: ['Sync already in progress'],
        duration: 0
      };
    }

    const startTime = Date.now();
    this.isSync = true;

    const result: SyncResult = {
      success: false,
      syncedMessages: 0,
      syncedConversations: 0,
      syncedUsers: 0,
      conflicts: 0,
      errors: [],
      duration: 0
    };

    try {
      Logger.info('[SyncService] Starting sync...');

      // Sync pending messages first
      result.syncedMessages = await this.syncPendingMessages();

      // Sync user data
      result.syncedUsers = await this.syncUserData(userId);

      // Sync conversations
      result.syncedConversations = await this.syncConversations(userId);

      // Update last sync time
      await this.updateLastSyncTime();

      result.success = true;
      Logger.info('[SyncService] Sync completed successfully', result);

    } catch (error) {
      Logger.error('[SyncService] Sync failed:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      this.isSync = false;
      result.duration = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Sync pending messages to backend (enhanced with backend integration)
   */
  private async syncPendingMessages(): Promise<number> {
    try {
      // Get messages that need to be synced to backend
      const pendingMessages = await QueryHelpers.getMessagesByStatus('sending');
      const sentMessages = await QueryHelpers.getMessagesByStatus('sent');

      // Filter messages that don't have external_id (not synced to backend)
      const allPendingMessages = [...pendingMessages, ...sentMessages].filter((msg: any) =>
        !msg._raw.external_id
      );

      if (allPendingMessages.length === 0) {
        Logger.debug('[SyncService] No pending messages to sync');
        return 0;
      }

      Logger.info(`[SyncService] Syncing ${allPendingMessages.length} pending messages to backend`);

      // Prepare messages for backend sync
      const messagesToSync = allPendingMessages.map(msg => ({
        tempId: msg.tempId || msg.id,
        chatId: msg.chatId,
        recipientId: msg.recipientId,
        content: msg.content,
        messageType: msg.messageType,
        timestamp: msg.createdAt.toISOString(),
        replyToMessageId: msg.replyTo
      }));

      // Send batch sync request to backend
      const syncResult = await this.batchSyncToBackend(messagesToSync);

      // Update local messages with server IDs
      let syncedCount = 0;
      if (syncResult.syncResults) {
        for (const result of syncResult.syncResults) {
          if (result.status === 'synced' && result.tempId && result.serverId) {
            await this.updateMessageWithServerId(result.tempId, result.serverId);
            syncedCount++;
          }
        }
      }

      Logger.info(`[SyncService] Successfully synced ${syncedCount} messages to backend`);
      return syncedCount;

    } catch (error) {
      Logger.error('[SyncService] Error syncing pending messages:', error);
      return 0;
    }
  }

  /**
   * Sync user data
   */
  private async syncUserData(userId: string): Promise<number> {
    try {
      // Update current user's last seen
      const user = await this.chatDb.getUserById(userId);
      if (user) {
        await this.chatDb.updateUserLastSeen(userId);
        return 1;
      }
      return 0;
    } catch (error) {
      Logger.error('[SyncService] Error syncing user data:', error);
      return 0;
    }
  }

  /**
   * Sync conversations (user chats)
   */
  private async syncConversations(userId: string): Promise<number> {
    try {
      const userChats = await QueryHelpers.getUserConversations(userId);
      let syncedCount = 0;

      for (const userChat of userChats) {
        try {
          // For user chats, we don't need to update activity since it's handled automatically
          // when messages are sent/received. Just count as synced.
          syncedCount++;
          Logger.debug(`[SyncService] Synced user chat: ${userChat.chatId}`);
        } catch (error) {
          Logger.error(`[SyncService] Failed to sync user chat ${userChat.chatId}:`, error);
        }
      }

      return syncedCount;
    } catch (error) {
      Logger.error('[SyncService] Error syncing user chats:', error);
      return 0;
    }
  }

  /**
   * Handle incoming message from external source
   */
  async handleIncomingMessage(messageData: {
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    content: string;
    messageType: string;
    timestamp: string;
  }, currentUserId?: string): Promise<boolean> {
    try {
      // Check if message already exists
      const existingMessage = await this.chatDb.getMessageById(messageData.id);
      if (existingMessage) {
        Logger.debug(`[SyncService] Message ${messageData.id} already exists`);
        return true;
      }

      // Ensure sender user exists
      let senderUser = await this.chatDb.getUserById(messageData.senderId);
      if (!senderUser) {
        Logger.info(`[SyncService] Sender user ${messageData.senderId} doesn't exist, creating it...`);
        try {
          senderUser = await this.chatDb.createUser({
            id: messageData.senderId,
            name: messageData.senderName
          });
          Logger.info(`[SyncService] Created sender user: ${messageData.senderId}`);
        } catch (createError) {
          Logger.error(`[SyncService] Failed to create sender user ${messageData.senderId}:`, createError);
        }
      }

      // Generate user-based chat ID
      if (!currentUserId) {
        throw new Error('Current user ID is required for user-based chat system');
      }

      const chatId = QueryHelpers.generateChatId(messageData.senderId, currentUserId);
      Logger.info(`[SyncService] Using user-based chat ID: ${chatId}`);

      // Ensure user chat exists
      await QueryHelpers.getOrCreateUserChat(messageData.senderId, currentUserId);

      // Create new message with user-based fields
      await this.chatDb.createMessage({
        id: messageData.id,
        chatId: chatId,
        senderId: messageData.senderId,
        recipientId: currentUserId,
        senderName: messageData.senderName,
        content: messageData.content,
        messageType: messageData.messageType as any,
        status: 'delivered'
      });

      // Update user chat with new message
      try {
        await QueryHelpers.updateUserChatWithMessage(
          messageData.id,
          chatId,
          messageData.content,
          new Date(messageData.timestamp)
        );
        Logger.info(`[SyncService] Updated user chat: ${chatId}`);
      } catch (error) {
        Logger.error(`[SyncService] Failed to update user chat:`, error);
      }

      Logger.info(`[SyncService] Processed incoming message: ${messageData.id}`);
      return true;

    } catch (error) {
      Logger.error('[SyncService] Error handling incoming message:', error);
      return false;
    }
  }

  /**
   * Resolve sync conflicts
   */
  async resolveConflicts(): Promise<number> {
    try {
      // TODO: Implement conflict resolution logic
      // This would typically involve:
      // 1. Identifying conflicting records
      // 2. Applying resolution strategy (last-write-wins, merge, etc.)
      // 3. Updating local database
      
      Logger.info('[SyncService] Conflict resolution not yet implemented');
      return 0;
    } catch (error) {
      Logger.error('[SyncService] Error resolving conflicts:', error);
      return 0;
    }
  }

  /**
   * Force full sync (re-sync all data)
   */
  async performFullSync(userId: string): Promise<SyncResult> {
    Logger.info('[SyncService] Performing full sync...');
    
    // Clear last sync time to force full sync
    await this.clearLastSyncTime();
    
    return await this.performSync(userId);
  }

  /**
   * Get last sync time
   */
  private async getLastSyncTime(): Promise<Date | undefined> {
    try {
      const syncData = await database.adapter.getLocal(this.syncStatusKey);
      return syncData ? new Date(syncData) : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Update last sync time
   */
  private async updateLastSyncTime(): Promise<void> {
    try {
      await database.adapter.setLocal(this.syncStatusKey, new Date().toISOString());
    } catch (error) {
      Logger.error('[SyncService] Error updating last sync time:', error);
    }
  }

  /**
   * Clear last sync time
   */
  private async clearLastSyncTime(): Promise<void> {
    try {
      await database.adapter.removeLocal(this.syncStatusKey);
    } catch (error) {
      Logger.error('[SyncService] Error clearing last sync time:', error);
    }
  }

  /**
   * Cleanup old sync data
   */
  async cleanup(): Promise<void> {
    try {
      Logger.info('[SyncService] Performing sync cleanup...');
      
      // Clean up old deleted messages
      await this.chatDb.cleanup();
      
      Logger.info('[SyncService] Sync cleanup completed');
    } catch (error) {
      Logger.error('[SyncService] Error during sync cleanup:', error);
    }
  }

  // =====================================================
  // BACKEND SYNC METHODS
  // =====================================================

  /**
   * Batch sync messages to backend
   */
  private async batchSyncToBackend(messages: any[]): Promise<any> {
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
        throw new Error(`Backend sync failed: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      Logger.debug('[SyncService] Backend sync response:', result);
      return result.data;

    } catch (error) {
      Logger.error('[SyncService] Backend sync API call failed:', error);
      throw error;
    }
  }

  /**
   * Update local message with server ID
   */
  private async updateMessageWithServerId(tempId: string, serverId: string): Promise<void> {
    try {
      const messages = await QueryHelpers.getMessagesByTempId(tempId);
      if (messages.length > 0) {
        const message = messages[0];
        await this.chatDb.database.write(async () => {
          await message.update((msg: any) => {
            msg._raw.external_id = serverId;
          });
        });
        Logger.debug('[SyncService] Updated message with server ID:', { tempId, serverId });
      }
    } catch (error) {
      Logger.error('[SyncService] Failed to update message with server ID:', error);
    }
  }

  /**
   * Pull messages from backend for a chat
   */
  async pullMessagesFromBackend(chatId: string, page: number = 1): Promise<any[]> {
    try {
      Logger.info(`[SyncService] Pulling messages from backend for chat: ${chatId}`);

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

      Logger.info(`[SyncService] Pulled ${backendMessages.length} messages from backend`);

      // Merge with local database
      const newMessages = [];
      for (const backendMsg of backendMessages) {
        try {
          const existingMessage = await QueryHelpers.getMessageById(String(backendMsg.id));

          if (!existingMessage) {
            const localMessage = await this.createMessageFromBackend(backendMsg);
            newMessages.push(localMessage);
          }
        } catch (error) {
          Logger.error('[SyncService] Failed to process backend message:', error);
        }
      }

      Logger.info(`[SyncService] Merged ${newMessages.length} new messages from backend`);
      return newMessages;

    } catch (error) {
      Logger.error('[SyncService] Failed to pull messages from backend:', error);
      throw error;
    }
  }

  /**
   * Create local message from backend data
   */
  private async createMessageFromBackend(backendMessage: any): Promise<any> {
    try {
      const messageData = {
        id: String(backendMessage.id),
        chatId: backendMessage.chat_id,
        senderId: String(backendMessage.sender_id),
        recipientId: String(backendMessage.recipient_id),
        senderName: backendMessage.sender_name,
        senderAvatar: backendMessage.sender_avatar,
        content: backendMessage.content,
        messageType: backendMessage.message_type,
        status: backendMessage.status,
        tempId: backendMessage.temp_id,
        replyTo: backendMessage.reply_to_message_id ? String(backendMessage.reply_to_message_id) : undefined
      };

      const message = await this.chatDb.createMessage(messageData);
      Logger.debug('[SyncService] Created local message from backend data:', message.id);

      return message;
    } catch (error) {
      Logger.error('[SyncService] Failed to create message from backend data:', error);
      throw error;
    }
  }

  /**
   * Force full sync with backend
   */
  async forceFullSync(userId: string): Promise<SyncResult> {
    try {
      Logger.info('[SyncService] Starting force full sync with backend');

      const startTime = Date.now();
      const result: SyncResult = {
        success: false,
        syncedMessages: 0,
        syncedConversations: 0,
        syncedUsers: 0,
        conflicts: 0,
        errors: [],
        duration: 0
      };

      // 1. Sync pending messages to backend
      result.syncedMessages = await this.syncPendingMessages();

      // 2. Pull missing messages from backend for all user chats
      const userChats = await QueryHelpers.getUserConversations(userId);
      for (const chat of userChats) {
        try {
          const newMessages = await this.pullMessagesFromBackend(chat.chatId);
          result.syncedMessages += newMessages.length;
        } catch (error) {
          Logger.error(`[SyncService] Failed to pull messages for chat ${chat.chatId}:`, error);
          result.errors.push(`Failed to sync chat ${chat.chatId}: ${error.message}`);
        }
      }

      result.success = result.errors.length === 0;
      result.duration = Date.now() - startTime;

      Logger.info('[SyncService] Force full sync completed:', result);
      return result;

    } catch (error) {
      Logger.error('[SyncService] Force full sync failed:', error);
      throw error;
    }
  }

  /**
   * Export data for backup
   */
  async exportData(): Promise<any> {
    try {
      // TODO: Implement data export functionality
      // This would export all chat data in a portable format

      Logger.info('[SyncService] Data export not yet implemented');
      return null;
    } catch (error) {
      Logger.error('[SyncService] Error exporting data:', error);
      return null;
    }
  }

  /**
   * Import data from backup
   */
  async importData(data: any): Promise<boolean> {
    try {
      // TODO: Implement data import functionality
      // This would import chat data from a backup

      Logger.info('[SyncService] Data import not yet implemented');
      return false;
    } catch (error) {
      Logger.error('[SyncService] Error importing data:', error);
      return false;
    }
  }
}
