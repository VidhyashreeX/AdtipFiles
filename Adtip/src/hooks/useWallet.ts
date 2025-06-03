// src/hooks/useWallet.ts
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet as useWalletContext } from '../contexts/WalletContext';
import WalletService from '../services/WalletService';

/**
 * React hook for accessing wallet data
 * @returns Wallet data and methods
 */
export const useWallet = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const { user } = useAuth();
  
  // Get wallet data from context
  const walletContext = useWalletContext();
  const { balance, isPremium, refreshBalance } = walletContext;

  // Function to fetch wallet data
  const fetchWalletData = async () => {
    try {
      if (!user || !user.id) return;
      
      setIsLoading(true);
      
      // First refresh the balance using the wallet context
      await refreshBalance();
      
      // Get transaction history - still handled by this hook
      const history = await WalletService.getTransactionHistory(user.id);
      setTransactions(history);
    } catch (error) {
      console.error('Error in useWallet hook:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };  // Function to refresh wallet data
  const refreshWallet = () => {
    setIsRefreshing(true);
    fetchWalletData();
  };
  // Load wallet data when user changes
  useEffect(() => {
    if (user && user.id) {
      fetchWalletData();
    }
  }, [user]);

  return {
    balance,
    transactions,
    isLoading,
    isRefreshing,
    refreshWallet,
    isPremium
  };

  // Load wallet data when user changes
  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  return {
    balance,
    transactions,
    isLoading,
    isRefreshing,
    isPremium,
    refreshWallet,
  };
};

export default useWallet;
