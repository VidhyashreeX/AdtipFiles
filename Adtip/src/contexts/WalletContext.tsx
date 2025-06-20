// src/contexts/WalletContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback, // Added useCallback
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
    try {
      if (!user || !user.id) {
        return;
      }
      const walletBalance = await WalletService.getWalletBalance(user.id);
      const premiumStatus = await WalletService.checkPremiumStatus(user.id);
      // Only update if changed
      setBalance(prev => (prev !== walletBalance ? walletBalance : prev));
      setIsPremium(prev => (prev !== premiumStatus.isPremium ? premiumStatus.isPremium : prev));
    } catch (error) {
      console.error('Error fetching wallet balance in Context:', error);
    }
  }, [user]);

  // Automatically refresh balance on mount and when user changes
  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  return (
    <WalletContext.Provider
      value={{
        balance,
        isPremium,
        refreshBalance,
        isLoading,
      }}>
      {children}
    </WalletContext.Provider>
  );
};
