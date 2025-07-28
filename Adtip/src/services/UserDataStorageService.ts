// src/services/UserDataStorageService.ts
import OptimizedAsyncStorage from './OptimizedAsyncStorage';
import { ComprehensiveUserData } from '../types/api';
import { Logger } from '../utils/ProductionLogger';

/**
 * Service for managing user data persistence in AsyncStorage
 * Provides methods for storing, retrieving, and managing cached user data
 */
class UserDataStorageService {
  private static readonly USER_DATA_PREFIX = '@user_data_';
  private static readonly USER_DATA_TIMESTAMP_PREFIX = '@user_data_timestamp_';
  private static readonly CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Store user data in AsyncStorage with timestamp
   */
  static async storeUserData(userId: number, userData: ComprehensiveUserData): Promise<void> {
    try {
      const key = `${this.USER_DATA_PREFIX}${userId}`;
      const timestampKey = `${this.USER_DATA_TIMESTAMP_PREFIX}${userId}`;
      const timestamp = Date.now();

      // Use optimized batch operation
      await OptimizedAsyncStorage.multiSet([
        [key, JSON.stringify(userData)],
        [timestampKey, timestamp.toString()],
      ]);

      Logger.debug('UserDataStorageService', 'User data stored successfully for userId:', userId);
    } catch (error) {
      Logger.error('UserDataStorageService', 'Failed to store user data:', error);
      throw error;
    }
  }

  /**
   * Retrieve user data from AsyncStorage
   */
  static async getUserData(userId: number): Promise<ComprehensiveUserData | null> {
    try {
      const key = `${this.USER_DATA_PREFIX}${userId}`;
      const data = await OptimizedAsyncStorage.getItem(key);

      if (!data) {
        Logger.debug('UserDataStorageService', 'No cached user data found for userId:', userId);
        return null;
      }

      const userData = JSON.parse(data) as ComprehensiveUserData;
      Logger.debug('UserDataStorageService', 'Retrieved cached user data for userId:', userId);
      return userData;
    } catch (error) {
      Logger.error('UserDataStorageService', 'Failed to retrieve user data:', error);
      return null;
    }
  }

  /**
   * Check if cached user data is still valid (not expired)
   */
  static async isUserDataValid(userId: number): Promise<boolean> {
    try {
      const timestampKey = `${this.USER_DATA_TIMESTAMP_PREFIX}${userId}`;
      const timestampStr = await OptimizedAsyncStorage.getItem(timestampKey);

      if (!timestampStr) {
        return false;
      }

      const timestamp = parseInt(timestampStr, 10);
      const now = Date.now();
      const isValid = (now - timestamp) < this.CACHE_EXPIRY_TIME;

      Logger.debug('UserDataStorageService', 'Cache validity check for userId:', userId, 'isValid:', isValid);
      return isValid;
    } catch (error) {
      Logger.error('UserDataStorageService', 'Failed to check cache validity:', error);
      return false;
    }
  }

  /**
   * Get user data if valid, otherwise return null
   */
  static async getValidUserData(userId: number): Promise<ComprehensiveUserData | null> {
    const isValid = await this.isUserDataValid(userId);
    if (!isValid) {
      Logger.debug('UserDataStorageService', 'Cached data is expired for userId:', userId);
      return null;
    }

    return this.getUserData(userId);
  }

  /**
   * Clear user data from AsyncStorage
   */
  static async clearUserData(userId: number): Promise<void> {
    try {
      const key = `${this.USER_DATA_PREFIX}${userId}`;
      const timestampKey = `${this.USER_DATA_TIMESTAMP_PREFIX}${userId}`;

      // Use optimized batch removal
      await OptimizedAsyncStorage.multiRemove([key, timestampKey]);

      Logger.debug('UserDataStorageService', 'User data cleared for userId:', userId);
    } catch (error) {
      Logger.error('UserDataStorageService', 'Failed to clear user data:', error);
      throw error;
    }
  }

  /**
   * Clear all cached user data
   */
  static async clearAllUserData(): Promise<void> {
    try {
      const keys = await OptimizedAsyncStorage.getAllKeys();
      const userDataKeys = keys.filter(
        key => key.startsWith(this.USER_DATA_PREFIX) || key.startsWith(this.USER_DATA_TIMESTAMP_PREFIX)
      );

      if (userDataKeys.length > 0) {
        await OptimizedAsyncStorage.multiRemove(userDataKeys);
        Logger.debug('UserDataStorageService', 'All user data cleared, removed keys:', userDataKeys.length);
      }
    } catch (error) {
      Logger.error('UserDataStorageService', 'Failed to clear all user data:', error);
      throw error;
    }
  }

  /**
   * Get cache info for debugging
   */
  static async getCacheInfo(userId: number): Promise<{
    hasData: boolean;
    isValid: boolean;
    timestamp: number | null;
    ageInMinutes: number | null;
  }> {
    try {
      const userData = await this.getUserData(userId);
      const isValid = await this.isUserDataValid(userId);
      const timestampKey = `${this.USER_DATA_TIMESTAMP_PREFIX}${userId}`;
      const timestampStr = await OptimizedAsyncStorage.getItem(timestampKey);
      
      const timestamp = timestampStr ? parseInt(timestampStr, 10) : null;
      const ageInMinutes = timestamp ? Math.floor((Date.now() - timestamp) / (1000 * 60)) : null;

      return {
        hasData: !!userData,
        isValid,
        timestamp,
        ageInMinutes,
      };
    } catch (error) {
      Logger.error('UserDataStorageService', 'Failed to get cache info:', error);
      return {
        hasData: false,
        isValid: false,
        timestamp: null,
        ageInMinutes: null,
      };
    }
  }

  /**
   * Update specific fields in cached user data
   */
  static async updateUserDataFields(
    userId: number,
    updates: Partial<ComprehensiveUserData>
  ): Promise<void> {
    try {
      const existingData = await this.getUserData(userId);
      if (!existingData) {
        Logger.warn('UserDataStorageService', 'No existing data to update for userId:', userId);
        return;
      }

      const updatedData = { ...existingData, ...updates };
      await this.storeUserData(userId, updatedData);
      Logger.debug('UserDataStorageService', 'User data fields updated for userId:', userId);
    } catch (error) {
      Logger.error('UserDataStorageService', 'Failed to update user data fields:', error);
      throw error;
    }
  }

  /**
   * Migrate old user data format if needed
   */
  static async migrateUserDataIfNeeded(userId: number): Promise<void> {
    try {
      // Check for old format user data (from AuthContext)
      const oldUserData = await OptimizedAsyncStorage.getItem('user');
      if (oldUserData) {
        const parsedOldData = JSON.parse(oldUserData);
        if (parsedOldData.id === userId) {
          // Convert old format to new comprehensive format
          const comprehensiveData: Partial<ComprehensiveUserData> = {
            ...parsedOldData,
            // Add any missing fields with default values
            total_withdrawals: parsedOldData.total_withdrawals || 0,
            last_withdrawal_date: parsedOldData.last_withdrawal_date || null,
            withdrawal_count: parsedOldData.withdrawal_count || 0,
          };

          await this.storeUserData(userId, comprehensiveData as ComprehensiveUserData);
          Logger.info('UserDataStorageService', 'Migrated old user data format for userId:', userId);
        }
      }
    } catch (error) {
      Logger.error('UserDataStorageService', 'Failed to migrate user data:', error);
      // Don't throw error for migration failures
    }
  }
}

export default UserDataStorageService;
