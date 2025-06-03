// src/hooks/useWallet.ts
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import WalletService from '../services/WalletService';

/**
 * React hook for accessing wallet data
 * @returns Wallet data and methods
 */
export const useWallet = () => {
  const [balance, setBalance] = useState<string>('0.00');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const { user } = useAuth();

  // Function to fetch wallet data
  const fetchWalletData = async () => {
    try {
      if (!user || !user.id) return;
      
      setIsLoading(true);
      
      // Get wallet balance
      const walletBalance = await WalletService.getWalletBalance(user.id);
      setBalance(walletBalance);
      
      // Get transaction history
      const history = await WalletService.getTransactionHistory(user.id);
      setTransactions(history);
      
      // Check premium status
      const premiumStatus = await WalletService.checkPremiumStatus(user.id);
      setIsPremium(premiumStatus.isPremium);
    } catch (error) {
      console.error('Error in useWallet hook:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Function to refresh wallet data
  const refreshWallet = () => {
    setIsRefreshing(true);
    fetchWalletData();
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
