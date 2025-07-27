/**
 * Optimized User Data Manager
 * Handles logged-in user data with batched AsyncStorage operations and proper caching
 */

import OptimizedAsyncStorage from './OptimizedAsyncStorage';
import { Logger } from '../utils/ProductionLogger';

export interface UserSessionData {
  userId: number;
  userName: string;
  channelId?: number;
  channelName?: string;
  isPremium: boolean;
  premiumPlanId: number;
  contentCreatorPlanId: number;
  walletBalance: string;
  accessToken?: string;
  profileImageUrl?: string;
  isVerified: boolean;
  lastLoginTime: number;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  autoplay: boolean;
  videoQuality: 'auto' | 'high' | 'medium' | 'low';
  language: string;
  region: string;
}

class UserDataManager {
  private static instance: UserDataManager;
  private userCache: UserSessionData | null = null;
  private preferencesCache: UserPreferences | null = null;
  private isInitialized = false;

  // Storage keys
  private static readonly KEYS = {
    USER_SESSION: '@user_session',
    USER_PREFERENCES: '@user_preferences',
    CHANNEL_DATA: '@channel_data',
    LAST_SYNC: '@last_sync_time',
  };

  private constructor() {}

  static getInstance(): UserDataManager {
    if (!UserDataManager.instance) {
      UserDataManager.instance = new UserDataManager();
    }
    return UserDataManager.instance;
  }

  /**
   * Initialize user data manager and load cached data
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      Logger.debug('UserDataManager', 'Initializing user data manager');
      
      // Load cached data in parallel
      const [sessionData, preferencesData] = await Promise.all([
        this.loadUserSession(),
        this.loadUserPreferences(),
      ]);

      this.userCache = sessionData;
      this.preferencesCache = preferencesData;
      this.isInitialized = true;

      Logger.info('UserDataManager', 'User data manager initialized successfully');
    } catch (error) {
      Logger.error('UserDataManager', 'Failed to initialize user data manager', error);
      this.isInitialized = true; // Mark as initialized even on error to prevent retry loops
    }
  }

  /**
   * Save complete user session data with batched operations
   */
  async saveUserSession(userData: Partial<UserSessionData>): Promise<void> {
    try {
      const currentData = this.userCache || {};
      const updatedData: UserSessionData = {
        ...currentData,
        ...userData,
        lastLoginTime: Date.now(),
      } as UserSessionData;

      // Update cache immediately
      this.userCache = updatedData;

      // Prepare batch operations
      const batchOperations: [string, string][] = [
        [UserDataManager.KEYS.USER_SESSION, JSON.stringify(updatedData)],
        [UserDataManager.KEYS.LAST_SYNC, Date.now().toString()],
      ];

      // Add individual keys for backward compatibility and quick access
      if (updatedData.userId) {
        batchOperations.push(['userId', updatedData.userId.toString()]);
      }
      if (updatedData.userName) {
        batchOperations.push(['userName', updatedData.userName]);
      }
      if (updatedData.accessToken) {
        batchOperations.push(['accessToken', updatedData.accessToken]);
      }
      if (updatedData.channelId) {
        batchOperations.push(['channelId', updatedData.channelId.toString()]);
      }

      // Perform batched write
      await OptimizedAsyncStorage.multiSet(batchOperations);

      Logger.debug('UserDataManager', 'User session data saved successfully');
    } catch (error) {
      Logger.error('UserDataManager', 'Failed to save user session data', error);
      throw error;
    }
  }

  /**
   * Load user session data from storage
   */
  async loadUserSession(): Promise<UserSessionData | null> {
    try {
      const sessionData = await OptimizedAsyncStorage.getItem(UserDataManager.KEYS.USER_SESSION);
      
      if (!sessionData) {
        Logger.debug('UserDataManager', 'No cached user session found');
        return null;
      }

      const userData = JSON.parse(sessionData) as UserSessionData;
      Logger.debug('UserDataManager', 'User session data loaded from cache');
      return userData;
    } catch (error) {
      Logger.error('UserDataManager', 'Failed to load user session data', error);
      return null;
    }
  }

  /**
   * Save user preferences with optimized storage
   */
  async saveUserPreferences(preferences: Partial<UserPreferences>): Promise<void> {
    try {
      const currentPrefs = this.preferencesCache || this.getDefaultPreferences();
      const updatedPrefs = { ...currentPrefs, ...preferences };

      // Update cache immediately
      this.preferencesCache = updatedPrefs;

      // Save to storage
      await OptimizedAsyncStorage.setItem(
        UserDataManager.KEYS.USER_PREFERENCES,
        JSON.stringify(updatedPrefs)
      );

      Logger.debug('UserDataManager', 'User preferences saved successfully');
    } catch (error) {
      Logger.error('UserDataManager', 'Failed to save user preferences', error);
      throw error;
    }
  }

  /**
   * Load user preferences from storage
   */
  async loadUserPreferences(): Promise<UserPreferences> {
    try {
      const prefsData = await OptimizedAsyncStorage.getItem(UserDataManager.KEYS.USER_PREFERENCES);
      
      if (!prefsData) {
        const defaultPrefs = this.getDefaultPreferences();
        Logger.debug('UserDataManager', 'Using default user preferences');
        return defaultPrefs;
      }

      const preferences = JSON.parse(prefsData) as UserPreferences;
      Logger.debug('UserDataManager', 'User preferences loaded from cache');
      return preferences;
    } catch (error) {
      Logger.error('UserDataManager', 'Failed to load user preferences', error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Get current user session data (from cache)
   */
  getCurrentUser(): UserSessionData | null {
    return this.userCache;
  }

  /**
   * Get current user preferences (from cache)
   */
  getCurrentPreferences(): UserPreferences {
    return this.preferencesCache || this.getDefaultPreferences();
  }

  /**
   * Update specific user data fields
   */
  async updateUserField(field: keyof UserSessionData, value: any): Promise<void> {
    if (!this.userCache) {
      throw new Error('No user session data available');
    }

    await this.saveUserSession({ [field]: value });
  }

  /**
   * Clear all user data (logout)
   */
  async clearUserData(): Promise<void> {
    try {
      // Clear cache
      this.userCache = null;
      this.preferencesCache = null;

      // Clear storage
      const keysToRemove = [
        UserDataManager.KEYS.USER_SESSION,
        UserDataManager.KEYS.CHANNEL_DATA,
        'userId',
        'userName',
        'accessToken',
        'channelId',
        'user', // Legacy key
      ];

      await Promise.all(keysToRemove.map(key => OptimizedAsyncStorage.removeItem(key)));

      Logger.info('UserDataManager', 'User data cleared successfully');
    } catch (error) {
      Logger.error('UserDataManager', 'Failed to clear user data', error);
      throw error;
    }
  }

  /**
   * Check if user has channel data for TipTube
   */
  hasChannelData(): boolean {
    return !!(this.userCache?.channelId && this.userCache?.channelName);
  }

  /**
   * Get channel data for TipTube
   */
  getChannelData(): { channelId: number; channelName: string } | null {
    if (!this.hasChannelData()) return null;
    
    return {
      channelId: this.userCache!.channelId!,
      channelName: this.userCache!.channelName!,
    };
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      theme: 'auto',
      notifications: true,
      autoplay: false,
      videoQuality: 'auto',
      language: 'en',
      region: 'IN',
    };
  }

  /**
   * Get storage info for debugging
   */
  async getStorageInfo(): Promise<any> {
    try {
      const info = await OptimizedAsyncStorage.getInfo();
      return {
        ...info,
        hasUserSession: !!this.userCache,
        hasPreferences: !!this.preferencesCache,
        isInitialized: this.isInitialized,
      };
    } catch (error) {
      Logger.error('UserDataManager', 'Failed to get storage info', error);
      return null;
    }
  }
}

// Export singleton instance
export const userDataManager = UserDataManager.getInstance();
export default UserDataManager;
