// src/contexts/UserDataContext.tsx
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUserData } from '../hooks/useQueries';
import { useAuth } from './AuthContext';
import { ComprehensiveUserData } from '../types/api';
import UserDataStorageService from '../services/UserDataStorageService';
import { useAppState } from '../services/AppStateService';

// User Data Context Type
interface UserDataContextType {
  userData: ComprehensiveUserData | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isRefetching: boolean;
  refetch: () => void;
  clearUserData: () => Promise<void>;
  updateUserDataFields: (updates: Partial<ComprehensiveUserData>) => Promise<void>;
  // Computed properties for easy access
  isPremium: boolean;
  isContentCreatorPremium: boolean;
  premiumExpiresAt: string | null;
  walletBalance: number;
  totalWithdrawals: number;
  isFirstTime: boolean;
  hasCompletedProfile: boolean;
}

// Create Context
const UserDataContext = createContext<UserDataContextType | null>(null);

// Provider Props
interface UserDataProviderProps {
  children: React.ReactNode;
}

// User Data Provider Component
export const UserDataProvider: React.FC<UserDataProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { onForeground, shouldRefreshData } = useAppState();

  // Use the TanStack Query hook for user data
  const {
    data: userData,
    isLoading,
    isError,
    error,
    isRefetching,
    refetch,
  } = useUserData(user?.id || 0);

  // Handle app state changes to refresh user data when needed
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const unsubscribe = onForeground(() => {
      // App became active, check if we should refresh user data
      if (shouldRefreshData()) {
        console.log('[UserDataProvider] App became active after long background, refetching user data');
        refetch();
      } else {
        console.log('[UserDataProvider] App became active, user data is still fresh');
      }
    });

    return unsubscribe;
  }, [isAuthenticated, user?.id, refetch, onForeground, shouldRefreshData]);

  // Clear user data when user logs out
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      console.log('[UserDataProvider] User logged out, clearing user data cache');
      clearUserData();
    }
  }, [isAuthenticated, user?.id]);

  // Migrate old user data format on mount
  useEffect(() => {
    if (user?.id) {
      UserDataStorageService.migrateUserDataIfNeeded(user.id);
    }
  }, [user?.id]);

  // Clear user data function
  const clearUserData = async () => {
    try {
      if (user?.id) {
        await UserDataStorageService.clearUserData(user.id);
      }
      // Invalidate TanStack Query cache
      queryClient.invalidateQueries({ queryKey: ['userData'] });
      console.log('[UserDataProvider] User data cleared successfully');
    } catch (error) {
      console.error('[UserDataProvider] Failed to clear user data:', error);
    }
  };

  // Update user data fields function
  const updateUserDataFields = async (updates: Partial<ComprehensiveUserData>) => {
    try {
      if (!user?.id) {
        throw new Error('No user ID available');
      }

      // Update in AsyncStorage
      await UserDataStorageService.updateUserDataFields(user.id, updates);
      
      // Update TanStack Query cache
      queryClient.setQueryData(['userData', user.id], (oldData: ComprehensiveUserData | undefined) => {
        if (oldData) {
          return { ...oldData, ...updates };
        }
        return oldData;
      });

      console.log('[UserDataProvider] User data fields updated successfully');
    } catch (error) {
      console.error('[UserDataProvider] Failed to update user data fields:', error);
      throw error;
    }
  };

  // Computed properties for easy access
  const contextValue = useMemo(() => {
    const isPremium = userData?.is_premium === 1;
    const isContentCreatorPremium = userData?.content_creator_premium_status === 1;
    const premiumExpiresAt = userData?.premium_expires_at || null;
    const walletBalance = userData?.referal_earnings || 0;
    const totalWithdrawals = userData?.total_withdrawals || 0;
    const isFirstTime = userData?.is_first_time === 1;
    const hasCompletedProfile = userData?.isSaveUserDetails === 1;

    return {
      userData: userData || null,
      isLoading,
      isError,
      error: error as Error | null,
      isRefetching,
      refetch,
      clearUserData,
      updateUserDataFields,
      // Computed properties
      isPremium,
      isContentCreatorPremium,
      premiumExpiresAt,
      walletBalance,
      totalWithdrawals,
      isFirstTime,
      hasCompletedProfile,
    };
  }, [
    userData,
    isLoading,
    isError,
    error,
    isRefetching,
    refetch,
  ]);

  return (
    <UserDataContext.Provider value={contextValue}>
      {children}
    </UserDataContext.Provider>
  );
};

// Custom hook to use UserData context
export const useUserDataContext = (): UserDataContextType => {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserDataContext must be used within a UserDataProvider');
  }
  return context;
};

// Utility hooks for specific data access
export const useUserPremiumStatus = () => {
  const { isPremium, premiumExpiresAt, isContentCreatorPremium } = useUserDataContext();
  return { isPremium, premiumExpiresAt, isContentCreatorPremium };
};

export const useUserWallet = () => {
  const { walletBalance, totalWithdrawals } = useUserDataContext();
  return { walletBalance, totalWithdrawals };
};

export const useUserProfile = () => {
  const { userData, hasCompletedProfile, isFirstTime } = useUserDataContext();
  return {
    profile: userData ? {
      id: userData.id,
      name: userData.name,
      emailId: userData.emailId,
      profile_image: userData.profile_image,
      bio: userData.bio,
      profession: userData.profession,
      address: userData.address,
      mobile_number: userData.mobile_number,
    } : null,
    hasCompletedProfile,
    isFirstTime,
  };
};

export default UserDataContext;
