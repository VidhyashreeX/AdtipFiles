// src/components/hoc/withWalletBalance.tsx
import React from 'react';
import { useWallet } from '../../contexts/WalletContext';

/**
 * Higher Order Component that passes wallet balance to screens
 * This ensures all screens can access the wallet balance in their headers
 * 
 * @param WrappedComponent - The screen component to wrap
 */
export const withWalletBalance = <P extends object>(WrappedComponent: React.ComponentType<P>): React.FC<P> => {
  const WithWalletBalance: React.FC<P> = (props) => {
    const { balance } = useWallet();
    
    // Merge the wallet balance into the component's props
    return <WrappedComponent {...props} walletBalance={balance} />;
  };
  
  // Set display name for easier debugging
  WithWalletBalance.displayName = `withWalletBalance(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  
  return WithWalletBalance;
};
