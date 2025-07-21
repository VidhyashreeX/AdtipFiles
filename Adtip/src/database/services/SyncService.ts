/**
 * WatermelonDB Sync Service
 * 
 * Handles synchronization between local WatermelonDB and external systems.
 * Provides conflict resolution and data consistency mechanisms.
 */

import { database } from '../index';
import { WatermelonChatDatabase } from './WatermelonChatDatabase';
import { QueryHelpers } from './QueryHelpers';
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
   * Sync pending messages (messages with 'sending' status)
   */
  private async syncPendingMessages(): Promise<number> {
    try {
      const pendingMessages = await QueryHelpers.getMessagesByStatus('sending');
      let syncedCount = 0;

      for (const message of pendingMessages) {
        try {
          // Here you would typically send the message via FCM or API
          // For now, we'll just update the status to 'sent'
          await this.chatDb.updateMessageStatus(message.id, 'sent');
          syncedCount++;
          
          Logger.debug(`[SyncService] Synced message: ${message.id}`);
        } catch (error) {
          Logger.error(`[SyncService] Failed to sync message ${message.id}:`, error);
        }
      }

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
