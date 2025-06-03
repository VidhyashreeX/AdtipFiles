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

  // Function to fetch wallet balance
  const refreshBalance = useCallback(async () => {
    try {
      if (!user || !user.id) {
        return;
      }

      setIsLoading(true);

      // Get wallet balance
      const walletBalance = await WalletService.getWalletBalance(user.id);
      setBalance(walletBalance);

      // Check premium status (if needed)
      const premiumStatus = await WalletService.checkPremiumStatus(user.id);
      setIsPremium(premiumStatus.isPremium);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load wallet balance when user changes
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
