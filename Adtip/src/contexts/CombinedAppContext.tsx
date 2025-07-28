// src/contexts/CombinedAppContext.tsx
import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useWallet } from './WalletContext';
import { useTheme } from './ThemeContext';
import { useUserData } from './UserDataContext';
import { useFCMChat } from './FCMChatContext';

// ✅ COMBINED APP CONTEXT - Flattened hierarchy for better performance
export interface CombinedAppContextType {
  // Auth state
  auth: {
    isAuthenticated: boolean;
    isGuest: boolean;
    user: any;
    loading: boolean;
    error: string | null;
    isInitialized: boolean;
    login: (mobileNumber: string) => Promise<any>;
    verifyOtp: (mobileNumber: string, otp: string, id: string) => Promise<any>;
    logout: () => Promise<void>;
    enterGuestMode: () => Promise<void>;
    exitGuestMode: () => Promise<void>;
  };
  
  // Theme state
  theme: {
    isDarkMode: boolean;
    colors: any;
    toggleTheme: () => void;
    setDarkMode: (isDark: boolean) => void;
  };
  
  // Wallet state
  wallet: {
    balance: string;
    isPremium: boolean;
    refreshBalance: () => Promise<void>;
    isLoading: boolean;
  };
  
  // User data state
  userData: {
    userData: any;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    refetch: () => void;
    isPremium: boolean;
    walletBalance: string;
  };
  
  // Chat state
  chat: {
    messages: any[];
    isLoading: boolean;
    sendMessage: (message: any) => Promise<void>;
    markAsRead: (messageId: string) => void;
  };
}

const CombinedAppContext = createContext<CombinedAppContextType | null>(null);

// ✅ COMBINED APP PROVIDER - Single provider for all app state
export const CombinedAppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Get all context values
  const auth = useAuth();
  const theme = useTheme();
  const wallet = useWallet();
  const userData = useUserData();
  const chat = useFCMChat();

  // ✅ MEMOIZED CONTEXT VALUE - Prevents unnecessary re-renders
  const contextValue = useMemo<CombinedAppContextType>(() => ({
    auth: {
      isAuthenticated: auth.isAuthenticated,
      isGuest: auth.isGuest,
      user: auth.user,
      loading: auth.loading,
      error: auth.error,
      isInitialized: auth.isInitialized,
      login: auth.login,
      verifyOtp: auth.verifyOtp,
      logout: auth.logout,
      enterGuestMode: auth.enterGuestMode,
      exitGuestMode: auth.exitGuestMode,
    },
    
    theme: {
      isDarkMode: theme.isDarkMode,
      colors: theme.colors,
      toggleTheme: theme.toggleTheme,
      setDarkMode: theme.setDarkMode,
    },
    
    wallet: {
      balance: wallet.balance,
      isPremium: wallet.isPremium,
      refreshBalance: wallet.refreshBalance,
      isLoading: wallet.isLoading,
    },
    
    userData: {
      userData: userData.userData,
      isLoading: userData.isLoading,
      isError: userData.isError,
      error: userData.error,
      refetch: userData.refetch,
      isPremium: userData.isPremium,
      walletBalance: userData.walletBalance,
    },
    
    chat: {
      messages: chat.messages || [],
      isLoading: chat.isLoading || false,
      sendMessage: chat.sendMessage || (async () => {}),
      markAsRead: chat.markAsRead || (() => {}),
    },
  }), [
    // Auth dependencies
    auth.isAuthenticated,
    auth.isGuest,
    auth.user,
    auth.loading,
    auth.error,
    auth.isInitialized,
    
    // Theme dependencies
    theme.isDarkMode,
    theme.colors,
    
    // Wallet dependencies
    wallet.balance,
    wallet.isPremium,
    wallet.isLoading,
    
    // User data dependencies
    userData.userData,
    userData.isLoading,
    userData.isError,
    userData.error,
    userData.isPremium,
    userData.walletBalance,
    
    // Chat dependencies
    chat.messages,
    chat.isLoading,
  ]);

  return (
    <CombinedAppContext.Provider value={contextValue}>
      {children}
    </CombinedAppContext.Provider>
  );
};

// ✅ COMBINED APP HOOK - Single hook for all app state
export const useCombinedApp = (): CombinedAppContextType => {
  const context = useContext(CombinedAppContext);
  if (!context) {
    throw new Error('useCombinedApp must be used within a CombinedAppProvider');
  }
  return context;
};

// ✅ SELECTIVE HOOKS - Use only what you need for better performance
export const useAppAuth = () => {
  const { auth } = useCombinedApp();
  return auth;
};

export const useAppTheme = () => {
  const { theme } = useCombinedApp();
  return theme;
};

export const useAppWallet = () => {
  const { wallet } = useCombinedApp();
  return wallet;
};

export const useAppUserData = () => {
  const { userData } = useCombinedApp();
  return userData;
};

export const useAppChat = () => {
  const { chat } = useCombinedApp();
  return chat;
};

// ✅ COMPUTED STATE HOOKS - Derived state for common use cases
export const useAppUser = () => {
  const { auth, userData } = useCombinedApp();
  
  return useMemo(() => ({
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isGuest: auth.isGuest,
    isPremium: userData.isPremium,
    walletBalance: userData.walletBalance,
    isLoading: auth.loading || userData.isLoading,
  }), [
    auth.user,
    auth.isAuthenticated,
    auth.isGuest,
    auth.loading,
    userData.isPremium,
    userData.walletBalance,
    userData.isLoading,
  ]);
};

export const useAppStatus = () => {
  const { auth, wallet, userData } = useCombinedApp();
  
  return useMemo(() => ({
    isInitialized: auth.isInitialized,
    isLoading: auth.loading || wallet.isLoading || userData.isLoading,
    hasError: !!auth.error || userData.isError,
    error: auth.error || userData.error?.message,
  }), [
    auth.isInitialized,
    auth.loading,
    auth.error,
    wallet.isLoading,
    userData.isLoading,
    userData.isError,
    userData.error,
  ]);
};

// ✅ PERFORMANCE MONITORING
export const useContextPerformance = () => {
  const renderCount = React.useRef(0);
  renderCount.current += 1;
  
  React.useEffect(() => {
    console.log(`CombinedAppContext rendered ${renderCount.current} times`);
  });
  
  return renderCount.current;
};

export default CombinedAppContext;
