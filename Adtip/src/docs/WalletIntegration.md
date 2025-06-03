# Wallet Integration Documentation

This document explains how to integrate the wallet functionality into your Adtip app components.

## Available Services

### WalletService

The `WalletService` class provides static methods for wallet operations:

```typescript
import WalletService from '../services/WalletService';

// Get wallet balance
const balance = await WalletService.getWalletBalance(userId);

// Get transaction history
const transactions = await WalletService.getTransactionHistory(userId);

// Get channel data
const channelData = await WalletService.getChannelData(userId);

// Check premium status
const premiumStatus = await WalletService.checkPremiumStatus(userId);
```

### useWallet Hook

The `useWallet` hook provides a React-friendly way to access wallet data:

```typescript
import useWallet from '../hooks/useWallet';

const MyComponent = () => {
  const { 
    balance,        // Current wallet balance
    transactions,   // Transactions history
    isLoading,      // Loading state
    isRefreshing,   // Refreshing state
    isPremium,      // Premium status
    refreshWallet   // Function to refresh wallet data
  } = useWallet();

  // Your component code here
};
```

### WalletBalance Component

For easy display of wallet balance in any screen, use the `WalletBalance` component:

```tsx
import WalletBalance from '../components/wallet/WalletBalance';

// Regular display
<WalletBalance />

// Compact display (for headers, etc.)
<WalletBalance compact />

// With refresh button
<WalletBalance showRefresh />

// With custom press handler
<WalletBalance onPress={() => console.log('Wallet pressed')} />

// With custom styling
<WalletBalance style={{ marginHorizontal: 16 }} />
```

## Integration Examples

### Adding Wallet Balance to a Header

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Header from '../components/common/Header';
import WalletBalance from '../components/wallet/WalletBalance';

const MyScreen = () => {
  return (
    <View style={styles.container}>
      <Header 
        title="My Screen" 
        showBackButton
        rightComponent={<WalletBalance compact />}
      />
      {/* Rest of your screen content */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

### Showing Premium Features

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import useWallet from '../hooks/useWallet';

const PremiumFeature = () => {
  const { isPremium } = useWallet();
  
  return (
    <View>
      {isPremium ? (
        <Text>Premium content here</Text>
      ) : (
        <Text>Please upgrade to access premium features</Text>
      )}
    </View>
  );
};
```

## API Reference

The wallet integration uses these API endpoints as defined in ApiService:

- `GET /api/getfunds/:userId` - Get wallet balance
- `GET /getadpassbook/:userId` - Get transaction history
- `GET /api/check-premium/:userId` - Check premium status
- `GET /getchannelbyuserid/:userId` - Get user channel data

These endpoints are abstracted through the ApiService and WalletService classes.
