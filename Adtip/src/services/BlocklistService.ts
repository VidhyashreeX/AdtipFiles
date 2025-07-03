/**
 * BlocklistService - Manages blocked users functionality
 * 
 * Features:
 * - Persistent storage of blocked user IDs
 * - Block/unblock operations
 * - Blocklist checking for incoming calls
 * - Memory caching for performance
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const BLOCKLIST_STORAGE_KEY = 'ADTIP_BLOCKLIST';

export interface BlockedUser {
  id: string;
  name: string;
  blockedAt: number;
}

class BlocklistService {
  private static instance: BlocklistService;
  private blockedUsersCache: Set<string> = new Set();
  private blockedUsersData: BlockedUser[] = [];
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): BlocklistService {
    if (!BlocklistService.instance) {
      BlocklistService.instance = new BlocklistService();
    }
    return BlocklistService.instance;
  }

  /**
   * Initialize the blocklist service - loads data from storage
   */
  public async initialize(): Promise<void> {
    try {
      await this.loadBlocklist();
      this.isInitialized = true;
      console.log('[BlocklistService] Initialized with', this.blockedUsersCache.size, 'blocked users');
    } catch (error) {
      console.error('[BlocklistService] Failed to initialize:', error);
      this.isInitialized = true; // Continue with empty blocklist
    }
  }

  /**
   * Load blocklist from AsyncStorage
   */
  private async loadBlocklist(): Promise<void> {
    try {
      const storedData = await AsyncStorage.getItem(BLOCKLIST_STORAGE_KEY);
      
      if (storedData) {
        this.blockedUsersData = JSON.parse(storedData);
        this.blockedUsersCache = new Set(this.blockedUsersData.map(user => user.id));
        console.log('[BlocklistService] Loaded', this.blockedUsersData.length, 'blocked users from storage');
      } else {
        this.blockedUsersData = [];
        this.blockedUsersCache = new Set();
        console.log('[BlocklistService] No existing blocklist found');
      }
    } catch (error) {
      console.error('[BlocklistService] Failed to load blocklist:', error);
      this.blockedUsersData = [];
      this.blockedUsersCache = new Set();
    }
  }

  /**
   * Save blocklist to AsyncStorage
   */
  private async saveBlocklist(): Promise<void> {
    try {
      await AsyncStorage.setItem(BLOCKLIST_STORAGE_KEY, JSON.stringify(this.blockedUsersData));
      console.log('[BlocklistService] Saved blocklist to storage');
    } catch (error) {
      console.error('[BlocklistService] Failed to save blocklist:', error);
    }
  }

  /**
   * Check if a user is blocked
   */
  public isUserBlocked(userId: string | number): boolean {
    if (!this.isInitialized) {
      console.warn('[BlocklistService] Service not initialized, assuming user not blocked');
      return false;
    }

    const userIdString = userId.toString();
    const isBlocked = this.blockedUsersCache.has(userIdString);
    
    if (isBlocked) {
      console.log('[BlocklistService] User', userId, 'is blocked');
    }
    
    return isBlocked;
  }

  /**
   * Block a user
   */
  public async blockUser(userId: string | number, userName: string): Promise<void> {
    try {
      const userIdString = userId.toString();
      
      if (this.blockedUsersCache.has(userIdString)) {
        console.log('[BlocklistService] User', userId, 'is already blocked');
        return;
      }

      const blockedUser: BlockedUser = {
        id: userIdString,
        name: userName,
        blockedAt: Date.now()
      };

      this.blockedUsersData.push(blockedUser);
      this.blockedUsersCache.add(userIdString);
      
      await this.saveBlocklist();
      
      console.log('[BlocklistService] Blocked user:', userId, userName);
    } catch (error) {
      console.error('[BlocklistService] Failed to block user:', error);
      throw error;
    }
  }

  /**
   * Unblock a user
   */
  public async unblockUser(userId: string | number): Promise<void> {
    try {
      const userIdString = userId.toString();
      
      if (!this.blockedUsersCache.has(userIdString)) {
        console.log('[BlocklistService] User', userId, 'is not blocked');
        return;
      }

      this.blockedUsersData = this.blockedUsersData.filter(user => user.id !== userIdString);
      this.blockedUsersCache.delete(userIdString);
      
      await this.saveBlocklist();
      
      console.log('[BlocklistService] Unblocked user:', userId);
    } catch (error) {
      console.error('[BlocklistService] Failed to unblock user:', error);
      throw error;
    }
  }

  /**
   * Get all blocked users
   */
  public getBlockedUsers(): BlockedUser[] {
    console.log('[BlocklistService] Getting all blocked users, count:', this.blockedUsersData.length);
    return [...this.blockedUsersData];
  }

  /**
   * Get blocked users count
   */
  public getBlockedUsersCount(): number {
    return this.blockedUsersData.length;
  }

  /**
   * Clear all blocked users
   */
  public async clearBlocklist(): Promise<void> {
    try {
      this.blockedUsersData = [];
      this.blockedUsersCache = new Set();
      await this.saveBlocklist();
      console.log('[BlocklistService] Cleared all blocked users');
    } catch (error) {
      console.error('[BlocklistService] Failed to clear blocklist:', error);
      throw error;
    }
  }

  /**
   * Check if incoming call should be blocked
   * This is the main method used by call handling logic
   */
  public shouldBlockIncomingCall(callerId: string | number): boolean {
    const isBlocked = this.isUserBlocked(callerId);
    
    if (isBlocked) {
      console.log('[BlocklistService] Blocking incoming call from user:', callerId);
    }
    
    return isBlocked;
  }
}

export default BlocklistService;
