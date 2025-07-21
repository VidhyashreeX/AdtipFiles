/**
 * Chat Storage Cleanup Utility
 * 
 * Utility to clean up sample/dummy conversation data and reset chat storage
 * for the new local-only chat architecture.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export class ChatStorageCleanup {
  
  /**
   * Clean up all chat-related storage data
   */
  static async cleanupAllChatData(): Promise<void> {
    try {
      console.log('[ChatStorageCleanup] Starting complete chat data cleanup...');
      
      // Get all AsyncStorage keys
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Filter chat-related keys
      const chatKeys = allKeys.filter(key => 
        key.includes('chat') || 
        key.includes('conversation') || 
        key.includes('message') ||
        key.startsWith('@chat_') ||
        key.startsWith('chat_messages_') ||
        key.includes('CHAT_STORAGE_')
      );
      
      console.log('[ChatStorageCleanup] Found chat-related keys:', chatKeys);
      
      // Remove all chat-related data
      if (chatKeys.length > 0) {
        await AsyncStorage.multiRemove(chatKeys);
        console.log('[ChatStorageCleanup] Removed', chatKeys.length, 'chat-related storage keys');
      }
      
      console.log('[ChatStorageCleanup] Chat data cleanup completed successfully');
    } catch (error) {
      console.error('[ChatStorageCleanup] Error during chat data cleanup:', error);
      throw error;
    }
  }
  
  /**
   * Clean up specific storage patterns
   */
  static async cleanupSpecificPatterns(): Promise<void> {
    try {
      console.log('[ChatStorageCleanup] Cleaning up specific storage patterns...');
      
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Patterns to clean up
      const patternsToClean = [
        // Old chat storage patterns
        /^chat_messages_/,
        /^@chat_/,
        /^CHAT_STORAGE_/,
        // Sample/test data patterns
        /test.*chat/i,
        /mock.*chat/i,
        /sample.*chat/i,
        /dummy.*chat/i,
        // Conversation patterns
        /conversation/i,
        /conv_/
      ];
      
      const keysToRemove: string[] = [];
      
      for (const key of allKeys) {
        for (const pattern of patternsToClean) {
          if (pattern.test(key)) {
            keysToRemove.push(key);
            break;
          }
        }
      }
      
      console.log('[ChatStorageCleanup] Keys to remove:', keysToRemove);
      
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
        console.log('[ChatStorageCleanup] Removed', keysToRemove.length, 'keys matching cleanup patterns');
      }
      
    } catch (error) {
      console.error('[ChatStorageCleanup] Error during pattern cleanup:', error);
      throw error;
    }
  }
  
  /**
   * Initialize clean storage structure for new local-only chat
   */
  static async initializeCleanChatStorage(): Promise<void> {
    try {
      console.log('[ChatStorageCleanup] Initializing clean chat storage structure...');
      
      // Initialize empty storage structures for new local-only chat
      const initialData = {
        '@fcm_chat_conversations': JSON.stringify([]),
        '@fcm_chat_sync_status': JSON.stringify({}),
        '@fcm_chat_last_sync': JSON.stringify(Date.now()),
        '@fcm_chat_unread_counts': JSON.stringify({})
      };
      
      // Set initial data
      for (const [key, value] of Object.entries(initialData)) {
        await AsyncStorage.setItem(key, value);
      }
      
      console.log('[ChatStorageCleanup] Clean chat storage structure initialized');
    } catch (error) {
      console.error('[ChatStorageCleanup] Error initializing clean storage:', error);
      throw error;
    }
  }
  
  /**
   * Get storage usage report
   */
  static async getStorageReport(): Promise<{
    totalKeys: number;
    chatKeys: string[];
    storageSize: number;
  }> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const chatKeys = allKeys.filter(key => 
        key.includes('chat') || 
        key.includes('conversation') || 
        key.includes('message')
      );
      
      // Estimate storage size (rough calculation)
      let totalSize = 0;
      for (const key of chatKeys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            totalSize += value.length;
          }
        } catch (error) {
          console.warn('[ChatStorageCleanup] Could not read key:', key);
        }
      }
      
      return {
        totalKeys: allKeys.length,
        chatKeys,
        storageSize: totalSize
      };
    } catch (error) {
      console.error('[ChatStorageCleanup] Error generating storage report:', error);
      throw error;
    }
  }
  
  /**
   * Complete cleanup and reset for local-only chat
   */
  static async performCompleteReset(): Promise<void> {
    try {
      console.log('[ChatStorageCleanup] Performing complete chat reset...');
      
      // Step 1: Clean up all existing chat data
      await this.cleanupAllChatData();
      
      // Step 2: Clean up specific patterns
      await this.cleanupSpecificPatterns();
      
      // Step 3: Initialize clean storage structure
      await this.initializeCleanChatStorage();
      
      console.log('[ChatStorageCleanup] Complete chat reset finished successfully');
    } catch (error) {
      console.error('[ChatStorageCleanup] Error during complete reset:', error);
      throw error;
    }
  }
}
