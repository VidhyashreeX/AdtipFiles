// src/contexts/WalletContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo, // Added useMemo
} from 'react';
import {useAuth} from './AuthContext';
import WalletService from '../services/WalletService';

interface WalletContextType {
  balance: string;
  isPremium: boolean;
  refreshBalance: () => Promise<void>;
  isLoading: boolean;
}

const defaultContext: WalletContextType = {
  balance: '0.00',
  isPremium: false,
  refreshBalance: async () => {},
  isLoading: false,
};

export const WalletContext = createContext<WalletContextType>(defaultContext);

export const useWallet = () => useContext(WalletContext);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({children}) => {
  const [balance, setBalance] = useState<string>('0.00');
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const {user} = useAuth();

  const refreshBalance = useCallback(async () => {
    console.log('🔄 [WalletContext] Refreshing wallet balance and premium status for user:', user?.id);
    
    try {
      if (!user || !user.id) {
        console.log('❌ [WalletContext] No user or user ID available');
        return;
      }
      
      console.log('📡 [WalletContext] Fetching wallet balance...');
      const walletBalance = await WalletService.getWalletBalance(user.id);
      console.log('💰 [WalletContext] Wallet balance received:', walletBalance);
      
      console.log('📡 [WalletContext] Fetching premium status...');
      const premiumStatus = await WalletService.checkPremiumStatus(user.id);
      console.log('👑 [WalletContext] Premium status received:', premiumStatus);
      
      // Only update if changed
      setBalance(prev => {
        const changed = prev !== walletBalance;
        if (changed) {
          console.log('🔄 [WalletContext] Updating balance from', prev, 'to', walletBalance);
        }
        return changed ? walletBalance : prev;
      });
      
      setIsPremium(prev => {
        const changed = prev !== premiumStatus.isPremium;
        if (changed) {
          console.log('🔄 [WalletContext] Updating premium status from', prev, 'to', premiumStatus.isPremium);
        }
        return changed ? premiumStatus.isPremium : prev;
      });
    } catch (error) {
      console.error('❌ [WalletContext] Error fetching wallet balance in Context:', error);
    }
  }, [user]);

  // Automatically refresh balance on mount and when user changes
  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    balance,
    isPremium,
    refreshBalance,
    isLoading,
  }), [balance, isPremium, refreshBalance, isLoading]);

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};
