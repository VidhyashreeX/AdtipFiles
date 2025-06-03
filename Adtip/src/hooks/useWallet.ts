// src/hooks/useWallet.ts
import {useState, useEffect, useCallback} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {useWallet as useWalletContext} from '../contexts/WalletContext';

/**
 * React hook for accessing wallet data
 * @returns Wallet data and methods
 */
export const useWallet = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const {user} = useAuth();

  // Get wallet data from context
  const walletContext = useWalletContext();
  const {balance, isPremium, refreshBalance} = walletContext;

  // Function to fetch wallet data
  const fetchWalletData = useCallback(async () => {
    try {
      if (!user || !user.id) {
        return;
      }

      setIsLoading(true);

      // First refresh the balance using the wallet context
      await refreshBalance();
    } catch (error) {
      console.error('Error in useWallet hook:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, refreshBalance]);

  // Function to refresh wallet data
  const refreshWallet = () => {
    setIsRefreshing(true);
    fetchWalletData();
  };
  // Load wallet data when user changes
  useEffect(() => {
    if (user && user.id) {
      fetchWalletData();
    }
  }, [user, fetchWalletData]);

  return {
    balance,
    isLoading,
    isRefreshing,
    refreshWallet,
    isPremium,
  };
};

export default useWallet;
