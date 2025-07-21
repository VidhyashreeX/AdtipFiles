/**
 * Chat Storage Cleanup Script
 * 
 * Run this script to clean up sample/dummy conversation data
 * and prepare for the new local-only chat architecture.
 * 
 * Usage: Import and call from a React component or development screen
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export class ChatCleanupScript {

  /**
   * Run the complete cleanup process
   * Note: ChatStorageCleanup has been removed - this is a simplified version
   */
  static async runCleanup(): Promise<void> {
    try {
      console.log('🧹 [ChatCleanupScript] Starting chat storage cleanup...');

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

      console.log('📊 [ChatCleanupScript] Found chat keys:', chatKeys);

      // Remove chat-related keys
      if (chatKeys.length > 0) {
        await AsyncStorage.multiRemove(chatKeys);
        console.log('✅ [ChatCleanupScript] Removed', chatKeys.length, 'chat keys');
      }

      console.log('🎉 [ChatCleanupScript] Chat storage cleanup completed successfully!');

      return;
    } catch (error) {
      console.error('❌ [ChatCleanupScript] Cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Run only the storage report (non-destructive)
   */
  static async runStorageReport(): Promise<void> {
    try {
      console.log('📊 [ChatCleanupScript] Generating storage report...');

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

      console.log('📋 [ChatCleanupScript] Storage Report:', {
        totalKeys: allKeys.length,
        chatKeysCount: chatKeys.length,
        chatKeys: chatKeys
      });

      // Log each chat key with its content preview
      for (const key of chatKeys) {
        try {
          const value = await AsyncStorage.getItem(key);
          const preview = value ? value.substring(0, 100) + '...' : 'null';
          console.log(`🔍 [${key}]: ${preview}`);
        } catch (error) {
          console.warn(`⚠️ Could not read key [${key}]:`, error);
        }
      }

    } catch (error) {
      console.error('❌ [ChatCleanupScript] Storage report failed:', error);
      throw error;
    }
  }
}

// Note: ChatStorageCleanup has been removed - use ChatCleanupScript instead
