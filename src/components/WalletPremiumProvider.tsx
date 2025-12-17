import React, { useEffect, ReactNode, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWalletPremiumStore } from '../stores/wallet-premium.store';

interface WalletPremiumProviderProps {
  children: ReactNode;
}

export const WalletPremiumProvider: React.FC<WalletPremiumProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const store = useWalletPremiumStore();
  const initializedRef = useRef<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const userId = user.id.toString();
      
      // Only initialize if we haven't already initialized for this user
      if (initializedRef.current !== userId) {
        console.log('🔄 Initializing wallet and premium data for user:', userId);
        
        // Initialize both wallet and premium data
        store.initializeWalletData(userId).catch(console.error);
        store.initializePremiumData(userId).catch(console.error);
        
        initializedRef.current = userId;
      }
      
    } else if (!isAuthenticated) {
      // Clear data when user logs out
      if (initializedRef.current !== null) {
        console.log('🧹 Clearing wallet and premium data');
        store.clearWalletData();
        store.clearPremiumData();
        initializedRef.current = null;
      }
    }
  }, [isAuthenticated, user?.id, store]);

  return <>{children}</>;
};