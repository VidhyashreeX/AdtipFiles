// src/hooks/useWallet.ts
import {useState, useEffect, useCallback} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {useWallet as useWalletContext} from '../contexts/WalletContext';
import WalletService from '../services/WalletService';

/**
 * React hook for accessing wallet data
 * @returns Wallet data and methods
 */
export const useWallet = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingHook, setIsLoadingHook] = useState<boolean>(false);
  const [isRefreshingHook, setIsRefreshingHook] = useState<boolean>(false);
  const {user} = useAuth();

  const walletContext = useWalletContext();

  const fetchWalletData = useCallback(async () => {
    if (!user || !user.id) {
      // Ensure states are reset if no user
      setTransactions([]);
      // isLoadingHook and isRefreshingHook are managed by refreshWalletHook
      return;
    }

    try {
      // Refresh balance using the wallet context's method
      await walletContext.refreshBalance();

      // Fetch transaction history
      const history = await WalletService.getTransactionHistory(user.id);
      setTransactions(history);
    } catch (error) {
      console.error('Error in useWallet hook fetchWalletData:', error);
    }
  }, [user, walletContext]);

  const refreshWalletHook = useCallback(async () => {
    if (!user || !user.id) {
      // If no user, don't attempt to refresh.
      // Reset states if necessary, though fetchWalletData also handles this.
      setIsLoadingHook(false);
      setIsRefreshingHook(false);
      setTransactions([]);
      // Ensure context balance is also reset if desired (context might handle this or expose a reset)
      return;
    }
    setIsLoadingHook(true);
    setIsRefreshingHook(true); // Typically set true for user-initiated refresh
    try {
      await fetchWalletData();
    } catch (e) {
      console.error("Error in refreshWalletHook", e);
    } finally {
      setIsLoadingHook(false);
      setIsRefreshingHook(false);
    }
  }, [user, fetchWalletData]);

  // Removed useEffect that called fetchWalletData automatically
  // useEffect(() => {
  //   if (user && user.id) {
  //     // fetchWalletData(); // This was causing automatic fetch
  //   } else {
  //     setIsLoadingHook(false);
  //     setTransactions([]);
  //   }
  // }, [user, fetchWalletData]);


  return {
    balance: walletContext.balance,
    transactions,
    isLoading: isLoadingHook || walletContext.isLoading, // Combined loading state
    isRefreshing: isRefreshingHook,
    refreshWallet: refreshWalletHook,
    isPremium: walletContext.isPremium,
  };
};

export default useWallet;
