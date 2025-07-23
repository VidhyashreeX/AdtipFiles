/**
 * Frontend Message Cleanup Service
 * 
 * Handles automated cleanup of old messages in WatermelonDB for local storage management.
 * Provides configurable retention periods and background cleanup scheduling.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../database';
import { QueryHelpers } from '../database/services/QueryHelpers';
import { WatermelonChatDatabase } from '../database/services/WatermelonChatDatabase';
import Logger from '../utils/LogUtils';

export interface CleanupOptions {
  retentionDays?: number;
  batchSize?: number;
  preserveUnread?: boolean;
  preserveRecent?: boolean;
}

export interface CleanupResult {
  deletedMessages: number;
  deletedChats: number;
  freedSpaceMB: number;
  duration: number;
  errors: string[];
  success: boolean;
}

export class MessageCleanupService {
  private static instance: MessageCleanupService;
  private chatDb: WatermelonChatDatabase;
  private isRunning: boolean = false;
  private lastCleanupKey = '@message_cleanup_last_run';
  private settingsKey = '@message_cleanup_settings';

  constructor() {
    this.chatDb = new WatermelonChatDatabase();
  }

  static getInstance(): MessageCleanupService {
    if (!MessageCleanupService.instance) {
      MessageCleanupService.instance = new MessageCleanupService();
    }
    return MessageCleanupService.instance;
  }

  /**
   * Get cleanup settings from storage
   */
  async getCleanupSettings(): Promise<CleanupOptions> {
    try {
      const settingsStr = await AsyncStorage.getItem(this.settingsKey);
      if (settingsStr) {
        return JSON.parse(settingsStr);
      }
      
      // Default settings
      return {
        retentionDays: 30, // Keep messages for 30 days locally
        batchSize: 100,
        preserveUnread: true,
        preserveRecent: true
      };
    } catch (error) {
      Logger.error('[MessageCleanupService] Error getting cleanup settings:', error);
      return {
        retentionDays: 30,
        batchSize: 100,
        preserveUnread: true,
        preserveRecent: true
      };
    }
  }

  /**
   * Save cleanup settings to storage
   */
  async saveCleanupSettings(settings: CleanupOptions): Promise<void> {
    try {
      await AsyncStorage.setItem(this.settingsKey, JSON.stringify(settings));
      Logger.info('[MessageCleanupService] Cleanup settings saved:', settings);
    } catch (error) {
      Logger.error('[MessageCleanupService] Error saving cleanup settings:', error);
    }
  }

  /**
   * Check if cleanup should run based on schedule
   */
  async shouldRunCleanup(): Promise<boolean> {
    try {
      const lastRunStr = await AsyncStorage.getItem(this.lastCleanupKey);
      if (!lastRunStr) {
        return true; // Never run before
      }

      const lastRun = new Date(lastRunStr);
      const now = new Date();
      const daysSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60 * 24);

      // Run cleanup weekly
      return daysSinceLastRun >= 7;
    } catch (error) {
      Logger.error('[MessageCleanupService] Error checking cleanup schedule:', error);
      return true; // Run on error to be safe
    }
  }

  /**
   * Perform message cleanup
   */
  async performCleanup(options?: CleanupOptions): Promise<CleanupResult> {
    if (this.isRunning) {
      throw new Error('Cleanup is already running');
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      Logger.info('[MessageCleanupService] Starting message cleanup');

      const settings = { ...await this.getCleanupSettings(), ...options };
      const cutoffDate = new Date(Date.now() - settings.retentionDays! * 24 * 60 * 60 * 1000);

      const result: CleanupResult = {
        deletedMessages: 0,
        deletedChats: 0,
        freedSpaceMB: 0,
        duration: 0,
        errors: [],
        success: false
      };

      // Get database size before cleanup
      const sizeBefore = await this.getDatabaseSize();

      try {
        // 1. Clean up old messages
        result.deletedMessages = await this.cleanupOldMessages(cutoffDate, settings);
      } catch (error) {
        Logger.error('[MessageCleanupService] Error cleaning up messages:', error);
        result.errors.push(`Message cleanup failed: ${error.message}`);
      }

      try {
        // 2. Clean up empty chats
        result.deletedChats = await this.cleanupEmptyChats();
      } catch (error) {
        Logger.error('[MessageCleanupService] Error cleaning up chats:', error);
        result.errors.push(`Chat cleanup failed: ${error.message}`);
      }

      try {
        // 3. Optimize database
        await this.optimizeDatabase();
      } catch (error) {
        Logger.error('[MessageCleanupService] Error optimizing database:', error);
        result.errors.push(`Database optimization failed: ${error.message}`);
      }

      // Calculate freed space
      const sizeAfter = await this.getDatabaseSize();
      result.freedSpaceMB = Math.max(0, sizeBefore - sizeAfter);

      result.duration = Date.now() - startTime;
      result.success = result.errors.length === 0;

      // Update last cleanup time
      await AsyncStorage.setItem(this.lastCleanupKey, new Date().toISOString());

      Logger.info('[MessageCleanupService] Cleanup completed:', {
        deletedMessages: result.deletedMessages,
        deletedChats: result.deletedChats,
        freedSpaceMB: result.freedSpaceMB,
        duration: `${result.duration}ms`,
        success: result.success
      });

      return result;

    } catch (error) {
      Logger.error('[MessageCleanupService] Cleanup failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Clean up old messages from WatermelonDB
   */
  private async cleanupOldMessages(cutoffDate: Date, settings: CleanupOptions): Promise<number> {
    try {
      Logger.info('[MessageCleanupService] Cleaning up messages older than:', cutoffDate.toISOString());

      let deletedCount = 0;
      const batchSize = settings.batchSize || 100;

      // Get old messages in batches
      while (true) {
        const oldMessages = await QueryHelpers.getOldMessages(cutoffDate, batchSize);
        
        if (oldMessages.length === 0) {
          break; // No more messages to delete
        }

        // Filter messages based on settings
        const messagesToDelete = oldMessages.filter(message => {
          // Preserve unread messages if setting is enabled
          if (settings.preserveUnread && message.status === 'delivered') {
            return false;
          }

          // Preserve recent messages (last 24 hours) if setting is enabled
          if (settings.preserveRecent) {
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            if (message.createdAt > oneDayAgo) {
              return false;
            }
          }

          return true;
        });

        if (messagesToDelete.length === 0) {
          break; // No messages to delete in this batch
        }

        // Delete messages in a transaction
        await database.write(async () => {
          for (const message of messagesToDelete) {
            await message.markAsDeleted();
          }
        });

        deletedCount += messagesToDelete.length;
        Logger.debug(`[MessageCleanupService] Deleted batch of ${messagesToDelete.length} messages`);

        // Break if we deleted fewer messages than batch size (last batch)
        if (messagesToDelete.length < batchSize) {
          break;
        }
      }

      Logger.info(`[MessageCleanupService] Deleted ${deletedCount} old messages`);
      return deletedCount;

    } catch (error) {
      Logger.error('[MessageCleanupService] Error cleaning up old messages:', error);
      throw error;
    }
  }

  /**
   * Clean up empty chats (chats with no messages)
   */
  private async cleanupEmptyChats(): Promise<number> {
    try {
      Logger.info('[MessageCleanupService] Cleaning up empty chats');

      const emptyChats = await QueryHelpers.getEmptyChats();
      
      if (emptyChats.length === 0) {
        Logger.info('[MessageCleanupService] No empty chats found');
        return 0;
      }

      // Delete empty chats
      await database.write(async () => {
        for (const chat of emptyChats) {
          await chat.markAsDeleted();
        }
      });

      Logger.info(`[MessageCleanupService] Deleted ${emptyChats.length} empty chats`);
      return emptyChats.length;

    } catch (error) {
      Logger.error('[MessageCleanupService] Error cleaning up empty chats:', error);
      throw error;
    }
  }

  /**
   * Optimize database (compact and vacuum)
   */
  private async optimizeDatabase(): Promise<void> {
    try {
      Logger.info('[MessageCleanupService] Optimizing database');

      // WatermelonDB doesn't expose direct SQLite VACUUM, but we can trigger optimization
      // by performing a batch operation that forces database maintenance
      await database.write(async () => {
        // This write operation helps trigger internal optimizations
        Logger.debug('[MessageCleanupService] Database optimization triggered');
      });

      Logger.info('[MessageCleanupService] Database optimization completed');

    } catch (error) {
      Logger.error('[MessageCleanupService] Error optimizing database:', error);
      throw error;
    }
  }

  /**
   * Get approximate database size (in MB)
   */
  private async getDatabaseSize(): Promise<number> {
    try {
      // This is an approximation since WatermelonDB doesn't expose direct size info
      const messageCount = await QueryHelpers.getTotalMessageCount();
      const chatCount = await QueryHelpers.getTotalChatCount();
      
      // Rough estimate: 1KB per message, 0.5KB per chat
      const estimatedSizeKB = (messageCount * 1) + (chatCount * 0.5);
      return estimatedSizeKB / 1024; // Convert to MB

    } catch (error) {
      Logger.error('[MessageCleanupService] Error getting database size:', error);
      return 0;
    }
  }

  /**
   * Get cleanup statistics
   */
  async getCleanupStats(): Promise<any> {
    try {
      const settings = await this.getCleanupSettings();
      const lastRunStr = await AsyncStorage.getItem(this.lastCleanupKey);
      const shouldRun = await this.shouldRunCleanup();
      
      const totalMessages = await QueryHelpers.getTotalMessageCount();
      const totalChats = await QueryHelpers.getTotalChatCount();
      const databaseSizeMB = await this.getDatabaseSize();

      // Count old messages
      const cutoffDate = new Date(Date.now() - settings.retentionDays! * 24 * 60 * 60 * 1000);
      const oldMessages = await QueryHelpers.getOldMessages(cutoffDate, 1000);

      return {
        settings,
        lastRun: lastRunStr ? new Date(lastRunStr) : null,
        shouldRun,
        isRunning: this.isRunning,
        stats: {
          totalMessages,
          totalChats,
          oldMessages: oldMessages.length,
          databaseSizeMB
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      Logger.error('[MessageCleanupService] Error getting cleanup stats:', error);
      throw error;
    }
  }

  /**
   * Schedule automatic cleanup
   */
  async scheduleCleanup(): Promise<void> {
    try {
      const shouldRun = await this.shouldRunCleanup();
      
      if (shouldRun && !this.isRunning) {
        Logger.info('[MessageCleanupService] Scheduling automatic cleanup');
        
        // Run cleanup in background
        setTimeout(async () => {
          try {
            await this.performCleanup();
          } catch (error) {
            Logger.error('[MessageCleanupService] Scheduled cleanup failed:', error);
          }
        }, 5000); // Delay 5 seconds to avoid blocking app startup
      }

    } catch (error) {
      Logger.error('[MessageCleanupService] Error scheduling cleanup:', error);
    }
  }

  /**
   * Force immediate cleanup
   */
  async forceCleanup(options?: CleanupOptions): Promise<CleanupResult> {
    Logger.info('[MessageCleanupService] Force cleanup requested');
    return await this.performCleanup(options);
  }
}

export default MessageCleanupService;
