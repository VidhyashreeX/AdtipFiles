// src/hooks/useWalletBalance.ts
import {useWallet} from '../contexts/WalletContext';

/**
 * A simplified hook that just returns the wallet balance
 * Use this in components that only need to display the balance
 */
export const useWalletBalance = () => {
  const {balance, refreshBalance, isLoading} = useWallet();
  return {balance, refreshBalance, isLoading};
};
