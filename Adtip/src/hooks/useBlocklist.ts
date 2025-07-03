import { useState, useEffect, useCallback } from 'react';
import BlocklistService, { BlockedUser } from '../services/BlocklistService';

interface UseBlocklistReturn {
  blockedUsers: BlockedUser[];
  blockedUsersCount: number;
  isUserBlocked: (userId: string | number) => boolean;
  blockUser: (userId: string | number, userName: string) => Promise<void>;
  unblockUser: (userId: string | number) => Promise<void>;
  clearBlocklist: () => Promise<void>;
  refreshBlocklist: () => Promise<void>;
  isInitialized: boolean;
}

/**
 * Custom hook for managing blocklist functionality
 */
export const useBlocklist = (): UseBlocklistReturn => {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const blocklistService = BlocklistService.getInstance();

  // Initialize and load blocklist
  const initializeBlocklist = useCallback(async () => {
    try {
      await blocklistService.initialize();
      const users = blocklistService.getBlockedUsers();
      setBlockedUsers(users);
      setIsInitialized(true);
    } catch (error) {
      console.error('[useBlocklist] Failed to initialize blocklist:', error);
      setIsInitialized(true); // Still mark as initialized to prevent infinite loading
    }
  }, [blocklistService]);

  // Refresh blocklist from service
  const refreshBlocklist = useCallback(async () => {
    try {
      const users = blocklistService.getBlockedUsers();
      setBlockedUsers(users);
    } catch (error) {
      console.error('[useBlocklist] Failed to refresh blocklist:', error);
    }
  }, [blocklistService]);

  // Check if user is blocked
  const isUserBlocked = useCallback((userId: string | number): boolean => {
    return blocklistService.isUserBlocked(userId);
  }, [blocklistService]);

  // Block a user
  const blockUser = useCallback(async (userId: string | number, userName: string): Promise<void> => {
    try {
      await blocklistService.blockUser(userId, userName);
      await refreshBlocklist();
    } catch (error) {
      console.error('[useBlocklist] Failed to block user:', error);
      throw error;
    }
  }, [blocklistService, refreshBlocklist]);

  // Unblock a user
  const unblockUser = useCallback(async (userId: string | number): Promise<void> => {
    try {
      await blocklistService.unblockUser(userId);
      await refreshBlocklist();
    } catch (error) {
      console.error('[useBlocklist] Failed to unblock user:', error);
      throw error;
    }
  }, [blocklistService, refreshBlocklist]);

  // Clear all blocked users
  const clearBlocklist = useCallback(async (): Promise<void> => {
    try {
      await blocklistService.clearBlocklist();
      await refreshBlocklist();
    } catch (error) {
      console.error('[useBlocklist] Failed to clear blocklist:', error);
      throw error;
    }
  }, [blocklistService, refreshBlocklist]);

  // Initialize on mount
  useEffect(() => {
    initializeBlocklist();
  }, [initializeBlocklist]);

  return {
    blockedUsers,
    blockedUsersCount: blockedUsers.length,
    isUserBlocked,
    blockUser,
    unblockUser,
    clearBlocklist,
    refreshBlocklist,
    isInitialized,
  };
};

export default useBlocklist;
