/**
 * Chat Storage Cleanup Script
 * 
 * Run this script to clean up sample/dummy conversation data
 * and prepare for the new local-only chat architecture.
 * 
 * Usage: Import and call from a React component or development screen
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatStorageCleanup } from '../utils/ChatStorageCleanup';

export class ChatCleanupScript {
  
  /**
   * Run the complete cleanup process
   */
  static async runCleanup(): Promise<void> {
    try {
      console.log('🧹 [ChatCleanupScript] Starting chat storage cleanup...');
      
      // Get initial storage report
      const initialReport = await ChatStorageCleanup.getStorageReport();
      console.log('📊 [ChatCleanupScript] Initial storage report:', {
        totalKeys: initialReport.totalKeys,
        chatKeysCount: initialReport.chatKeys.length,
        chatKeys: initialReport.chatKeys,
        estimatedSize: `${Math.round(initialReport.storageSize / 1024)}KB`
      });
      
      // Perform complete reset
      await ChatStorageCleanup.performCompleteReset();
      
      // Get final storage report
      const finalReport = await ChatStorageCleanup.getStorageReport();
      console.log('✅ [ChatCleanupScript] Final storage report:', {
        totalKeys: finalReport.totalKeys,
        chatKeysCount: finalReport.chatKeys.length,
        chatKeys: finalReport.chatKeys,
        estimatedSize: `${Math.round(finalReport.storageSize / 1024)}KB`
      });
      
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
      
      const report = await ChatStorageCleanup.getStorageReport();
      console.log('📋 [ChatCleanupScript] Storage Report:', {
        totalKeys: report.totalKeys,
        chatKeysCount: report.chatKeys.length,
        estimatedChatStorageSize: `${Math.round(report.storageSize / 1024)}KB`,
        chatKeys: report.chatKeys
      });
      
      // Log each chat key with its content preview
      for (const key of report.chatKeys) {
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

// Export for easy import
export { ChatStorageCleanup };
