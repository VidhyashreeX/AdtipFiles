// src/components/hoc/withWalletBalance.tsx
import React, { memo } from 'react';
import {useWallet} from '../../contexts/WalletContext';

/**
 * Higher Order Component that passes wallet balance to screens
 * This ensures all screens can access the wallet balance in their headers
 *
 * @param WrappedComponent - The screen component to wrap
 */
export const withWalletBalance = <P extends object>(
  Component: React.ComponentType<P & { walletBalance?: string }>,
) => {
  const WrappedComponent = memo((props: P) => { // Memoize the wrapped component
    const { balance } = useWallet();
    
    return <Component {...props} walletBalance={balance} />;
  });
  
  WrappedComponent.displayName = `withWalletBalance(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};
