# Comprehensive User Data Management System

## Overview

This document describes the comprehensive user data management system implemented for the Adtip React Native app. The system provides centralized, efficient, and reliable access to user data throughout the application with automatic background refresh, offline support, and intelligent error handling.

## Architecture

### Core Components

1. **API Integration** (`src/services/ApiService.ts`)
   - `getUserData()` method for fetching comprehensive user data
   - Integrated with `/api/get-user-data` endpoint

2. **TanStack Query Hook** (`src/hooks/useQueries.ts`)
   - `useUserData()` hook with 5-minute auto-refresh
   - Background data fetching with offline support
   - Intelligent caching and error handling

3. **AsyncStorage Integration** (`src/services/UserDataStorageService.ts`)
   - Persistent local storage for offline access
   - Cache validation and expiry management
   - Data migration utilities

4. **Global Context Provider** (`src/contexts/UserDataContext.tsx`)
   - `UserDataProvider` for app-wide data access
   - Computed properties for easy consumption
   - Utility hooks for specific data access

5. **App State Management** (`src/services/AppStateService.ts`)
   - Background/foreground transition handling
   - Battery and data usage optimization
   - Smart refresh strategies

6. **Error Handling** (`src/services/UserDataErrorHandler.ts`)
   - Comprehensive error classification
   - Intelligent retry logic with exponential backoff
   - Graceful degradation with cached data

7. **Utility Functions** (`src/utils/userDataUtils.ts`)
   - Common user data operations
   - Data validation and formatting
   - Premium status checks and calculations

## Implementation

### 1. API Endpoint Integration

The system integrates with the `/api/get-user-data` endpoint:

```typescript
// Request
{
  "userid": 4586
}

// Response
{
  "status": true,
  "message": "User data retrieved successfully",
  "data": {
    "id": 4586,
    "name": "maneesh",
    // ... comprehensive user data
  }
}
```

### 2. Usage in Components

#### Basic Usage
```typescript
import { useUserDataContext } from '../contexts/UserDataContext';

const MyComponent = () => {
  const { userData, isLoading, isPremium, walletBalance } = useUserDataContext();
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <View>
      <Text>Welcome, {userData?.name}!</Text>
      <Text>Premium: {isPremium ? 'Yes' : 'No'}</Text>
      <Text>Balance: ₹{walletBalance}</Text>
    </View>
  );
};
```

#### Specific Data Access
```typescript
import { useUserPremiumStatus, useUserWallet, useUserProfile } from '../contexts/UserDataContext';

const PremiumComponent = () => {
  const { isPremium, premiumExpiresAt } = useUserPremiumStatus();
  const { walletBalance, totalWithdrawals } = useUserWallet();
  const { profile, hasCompletedProfile } = useUserProfile();
  
  // Component logic
};
```

#### Using Utility Functions
```typescript
import { isPremiumUser, formatWalletBalance, getUserDisplayName } from '../utils/userDataUtils';

const UserCard = ({ userData }) => {
  const displayName = getUserDisplayName(userData);
  const formattedBalance = formatWalletBalance(userData);
  const premium = isPremiumUser(userData);
  
  return (
    <View>
      <Text>{displayName}</Text>
      <Text>{formattedBalance}</Text>
      {premium && <PremiumBadge />}
    </View>
  );
};
```

### 3. Error Handling

The system provides comprehensive error handling:

```typescript
import { useUserDataErrorHandler } from '../services/UserDataErrorHandler';

const MyComponent = () => {
  const { userData, isError, error } = useUserDataContext();
  const { getUserFriendlyMessage } = useUserDataErrorHandler();
  
  if (isError) {
    const friendlyMessage = getUserFriendlyMessage(error);
    return <ErrorMessage message={friendlyMessage} />;
  }
  
  // Component logic
};
```

## Features

### 1. Background Data Fetching
- Automatic refresh every 5 minutes
- Pauses when app is backgrounded
- Resumes and refreshes when app becomes active

### 2. Offline Support
- Data persisted in AsyncStorage
- Automatic fallback to cached data
- Cache validation and expiry management

### 3. Error Handling & Retry Logic
- Intelligent error classification
- Exponential backoff retry strategy
- Graceful degradation with cached data
- Network-aware retry logic

### 4. Performance Optimization
- Efficient caching with TanStack Query
- Memoized computed properties
- Background/foreground state management
- Minimal re-renders with proper memoization

### 5. Data Validation
- Comprehensive data integrity checks
- Type safety with TypeScript interfaces
- Validation utilities for common operations

## Migration Guide

### From AuthContext User Data

**Before:**
```typescript
const { user, premiumState } = useAuth();
const isPremium = premiumState.isPremium;
const balance = premiumState.walletBalance;
```

**After:**
```typescript
const { userData, isPremium, walletBalance } = useUserDataContext();
```

### From Individual API Calls

**Before:**
```typescript
const { data: premiumData } = useSubscriptionStatus(userId);
const { data: balanceData } = useWalletBalance(userId);
```

**After:**
```typescript
const { isPremium, walletBalance } = useUserDataContext();
```

## Best Practices

### 1. Use Specific Hooks
Prefer specific hooks over the main context for better performance:
```typescript
// Good
const { isPremium } = useUserPremiumStatus();

// Less optimal
const { isPremium } = useUserDataContext();
```

### 2. Handle Loading States
Always handle loading and error states:
```typescript
const { userData, isLoading, isError } = useUserDataContext();

if (isLoading) return <LoadingSpinner />;
if (isError) return <ErrorMessage />;
```

### 3. Use Utility Functions
Leverage utility functions for common operations:
```typescript
import { isPremiumUser, formatWalletBalance } from '../utils/userDataUtils';

// Good
const premium = isPremiumUser(userData);
const balance = formatWalletBalance(userData);

// Avoid direct property access
const premium = userData?.is_premium === 1;
```

### 4. Error Handling
Use the error handler for user-friendly messages:
```typescript
const { getUserFriendlyMessage } = useUserDataErrorHandler();
const friendlyMessage = getUserFriendlyMessage(error);
```

## Configuration

### Cache Settings
- **Stale Time**: 5 minutes (data stays fresh)
- **Cache Time**: 30 minutes (data kept in memory)
- **Refetch Interval**: 5 minutes (background refresh)
- **Cache Expiry**: 24 hours (AsyncStorage)

### Retry Settings
- **Max Attempts**: 3
- **Base Delay**: 1 second
- **Max Delay**: 30 seconds
- **Strategy**: Exponential backoff

## Troubleshooting

### Common Issues

1. **Data Not Updating**
   - Check network connection
   - Verify user authentication
   - Check console for error messages

2. **Performance Issues**
   - Ensure proper memoization
   - Use specific hooks instead of main context
   - Check for unnecessary re-renders

3. **Cache Issues**
   - Clear AsyncStorage if needed
   - Check cache expiry settings
   - Verify data validation

### Debug Tools

Use the cache info utility for debugging:
```typescript
import UserDataStorageService from '../services/UserDataStorageService';

const cacheInfo = await UserDataStorageService.getCacheInfo(userId);
console.log('Cache Info:', cacheInfo);
```

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live data updates
2. **Selective Refresh**: Refresh only specific data sections
3. **Analytics Integration**: Track data usage patterns
4. **Advanced Caching**: Implement more sophisticated cache strategies
5. **Data Synchronization**: Conflict resolution for concurrent updates

## Conclusion

The comprehensive user data management system provides a robust, efficient, and user-friendly way to handle user data throughout the Adtip React Native app. It ensures data consistency, optimal performance, and excellent user experience with proper error handling and offline support.
