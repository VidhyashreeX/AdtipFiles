// src/components/test/UserDataTest.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useUserDataContext, useUserPremiumStatus, useUserWallet, useUserProfile } from '../../contexts/UserDataContext';
import { isPremiumUser, formatWalletBalance, getUserDisplayName, createUserSummary } from '../../utils/userDataUtils';

/**
 * Test component to verify the user data management system
 * This component demonstrates all the features of the new system
 */
const UserDataTest: React.FC = () => {
  // Main context hook
  const {
    userData,
    isLoading,
    isError,
    error,
    isRefetching,
    refetch,
    clearUserData,
    updateUserDataFields,
  } = useUserDataContext();

  // Specific utility hooks
  const { isPremium, premiumExpiresAt, isContentCreatorPremium } = useUserPremiumStatus();
  const { walletBalance, totalWithdrawals } = useUserWallet();
  const { profile, hasCompletedProfile, isFirstTime } = useUserProfile();

  // Utility functions
  const displayName = getUserDisplayName(userData);
  const formattedBalance = formatWalletBalance(userData);
  const userSummary = createUserSummary(userData);

  const handleRefresh = () => {
    console.log('[UserDataTest] Manual refresh triggered');
    refetch();
  };

  const handleClearCache = async () => {
    console.log('[UserDataTest] Clearing user data cache');
    try {
      await clearUserData();
      console.log('[UserDataTest] Cache cleared successfully');
    } catch (error) {
      console.error('[UserDataTest] Failed to clear cache:', error);
    }
  };

  const handleUpdateField = async () => {
    console.log('[UserDataTest] Testing field update');
    try {
      await updateUserDataFields({
        bio: `Updated at ${new Date().toLocaleTimeString()}`,
      });
      console.log('[UserDataTest] Field updated successfully');
    } catch (error) {
      console.error('[UserDataTest] Failed to update field:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>User Data Test</Text>
        <Text style={styles.loading}>Loading user data...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>User Data Test</Text>
        <Text style={styles.error}>Error: {error?.message || 'Unknown error'}</Text>
        <TouchableOpacity style={styles.button} onPress={handleRefresh}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>User Data Management Test</Text>
      
      {/* Status Indicators */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        <Text style={styles.text}>Loading: {isLoading ? 'Yes' : 'No'}</Text>
        <Text style={styles.text}>Refreshing: {isRefetching ? 'Yes' : 'No'}</Text>
        <Text style={styles.text}>Error: {isError ? 'Yes' : 'No'}</Text>
      </View>

      {/* Basic User Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Info</Text>
        <Text style={styles.text}>ID: {userData?.id}</Text>
        <Text style={styles.text}>Name: {userData?.name}</Text>
        <Text style={styles.text}>Display Name: {displayName}</Text>
        <Text style={styles.text}>Email: {userData?.emailId}</Text>
        <Text style={styles.text}>Mobile: {userData?.mobile_number}</Text>
      </View>

      {/* Premium Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Premium Status</Text>
        <Text style={styles.text}>Is Premium: {isPremium ? 'Yes' : 'No'}</Text>
        <Text style={styles.text}>Content Creator: {isContentCreatorPremium ? 'Yes' : 'No'}</Text>
        <Text style={styles.text}>Expires At: {premiumExpiresAt || 'N/A'}</Text>
        <Text style={styles.text}>Premium Plan ID: {userData?.premium_plan_id}</Text>
      </View>

      {/* Wallet Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wallet</Text>
        <Text style={styles.text}>Balance: {walletBalance}</Text>
        <Text style={styles.text}>Formatted: {formattedBalance}</Text>
        <Text style={styles.text}>Total Withdrawals: {totalWithdrawals}</Text>
        <Text style={styles.text}>Withdrawal Count: {userData?.withdrawal_count}</Text>
      </View>

      {/* Profile Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Status</Text>
        <Text style={styles.text}>Completed Profile: {hasCompletedProfile ? 'Yes' : 'No'}</Text>
        <Text style={styles.text}>First Time: {isFirstTime ? 'Yes' : 'No'}</Text>
        <Text style={styles.text}>Online: {userData?.online_status ? 'Yes' : 'No'}</Text>
        <Text style={styles.text}>Available: {userData?.is_available ? 'Yes' : 'No'}</Text>
      </View>

      {/* Utility Functions Test */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Utility Functions</Text>
        <Text style={styles.text}>isPremiumUser(): {isPremiumUser(userData) ? 'Yes' : 'No'}</Text>
        <Text style={styles.text}>getUserDisplayName(): {displayName}</Text>
        <Text style={styles.text}>formatWalletBalance(): {formattedBalance}</Text>
      </View>

      {/* User Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Summary</Text>
        <Text style={styles.text}>Display Name: {userSummary.displayName}</Text>
        <Text style={styles.text}>Premium: {userSummary.isPremium ? 'Yes' : 'No'}</Text>
        <Text style={styles.text}>Balance: {userSummary.walletBalance}</Text>
        <Text style={styles.text}>Online: {userSummary.isOnline ? 'Yes' : 'No'}</Text>
        <Text style={styles.text}>Location: {userSummary.location}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        <TouchableOpacity style={styles.button} onPress={handleRefresh}>
          <Text style={styles.buttonText}>Refresh Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={handleClearCache}>
          <Text style={styles.buttonText}>Clear Cache</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={handleUpdateField}>
          <Text style={styles.buttonText}>Test Update Field</Text>
        </TouchableOpacity>
      </View>

      {/* Raw Data (for debugging) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Raw Data (Debug)</Text>
        <Text style={styles.debugText}>
          {JSON.stringify(userData, null, 2)}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  text: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
  loading: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginTop: 50,
  },
  error: {
    fontSize: 16,
    textAlign: 'center',
    color: '#e74c3c',
    marginTop: 20,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  debugText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#666',
    backgroundColor: '#f8f8f8',
    padding: 8,
    borderRadius: 4,
  },
});

export default UserDataTest;
