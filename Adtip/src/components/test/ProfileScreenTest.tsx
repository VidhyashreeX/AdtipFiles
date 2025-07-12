// src/components/test/ProfileScreenTest.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { useProfile } from '../../hooks/useQueries';
import { useUserDataContext } from '../../contexts/UserDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { getUserDisplayName, isPremiumUser } from '../../utils/userDataUtils';

/**
 * Test component to verify ProfileScreen data loading
 * This component tests the enhanced useProfile hook and user data integration
 */
const ProfileScreenTest: React.FC = () => {
  const { user } = useAuth();
  const [testUserId, setTestUserId] = useState<string>(user?.id?.toString() || '4586');
  const [isTestingOwnProfile, setIsTestingOwnProfile] = useState(true);

  // Test the enhanced useProfile hook
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useProfile(parseInt(testUserId));

  // Test user data context (only works for current user)
  const { userData, isLoading: userDataLoading } = useUserDataContext();

  const currentUserId = parseInt(testUserId);
  const isOwnProfile = currentUserId === user?.id;

  // Determine which data to show
  const displayData = isOwnProfile && userData ? userData : profileData;

  const handleTestUserId = (userId: string) => {
    setTestUserId(userId);
    setIsTestingOwnProfile(parseInt(userId) === user?.id);
  };

  const handleRefresh = async () => {
    try {
      await refetchProfile();
      Alert.alert('Success', 'Profile data refreshed successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh profile data');
    }
  };

  const normalizeProfileData = (data: any) => {
    if (!data) return null;
    
    // If it's comprehensive user data (new API), map to display format
    if (data.emailId && data.mobile_number) {
      return {
        id: data.id,
        name: data.name,
        username: data.username || data.name,
        display_name: getUserDisplayName(data),
        bio: data.bio,
        profile_image: data.profile_image,
        email: data.emailId,
        mobile: data.mobile_number,
        is_premium: data.is_premium,
        premium_expires_at: data.premium_expires_at,
        wallet_balance: data.referal_earnings,
        api_source: 'comprehensive_user_data',
      };
    }
    
    // If it's old API format
    return {
      ...data,
      api_source: 'old_profile_api',
    };
  };

  const normalizedData = normalizeProfileData(displayData);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>ProfileScreen Data Test</Text>
      
      {/* Test Controls */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Controls</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Test User ID:</Text>
          <TextInput
            style={styles.input}
            value={testUserId}
            onChangeText={handleTestUserId}
            placeholder="Enter user ID"
            keyboardType="numeric"
          />
        </View>
        
        <Text style={styles.info}>
          Testing: {isTestingOwnProfile ? 'Own Profile' : 'Other User Profile'}
        </Text>
        
        <TouchableOpacity style={styles.button} onPress={handleRefresh}>
          <Text style={styles.buttonText}>Refresh Profile Data</Text>
        </TouchableOpacity>
      </View>

      {/* Loading States */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Loading States</Text>
        <Text style={styles.text}>Profile Loading: {profileLoading ? 'Yes' : 'No'}</Text>
        <Text style={styles.text}>User Data Loading: {userDataLoading ? 'Yes' : 'No'}</Text>
        <Text style={styles.text}>Has Error: {profileError ? 'Yes' : 'No'}</Text>
        {profileError && (
          <Text style={styles.error}>Error: {profileError.message}</Text>
        )}
      </View>

      {/* Data Source Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Source</Text>
        <Text style={styles.text}>Using Data From: {isOwnProfile ? 'User Data Context + Profile API' : 'Profile API Only'}</Text>
        <Text style={styles.text}>API Source: {normalizedData?.api_source || 'Unknown'}</Text>
        <Text style={styles.text}>Has Profile Data: {profileData ? 'Yes' : 'No'}</Text>
        <Text style={styles.text}>Has User Data: {userData ? 'Yes' : 'No'}</Text>
        <Text style={styles.text}>Social Stats: Separate API calls for followers/following/posts</Text>
      </View>

      {/* Profile Data Display */}
      {normalizedData ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Data</Text>
          <Text style={styles.text}>ID: {normalizedData.id}</Text>
          <Text style={styles.text}>Name: {normalizedData.name}</Text>
          <Text style={styles.text}>Username: {normalizedData.username}</Text>
          <Text style={styles.text}>Display Name: {normalizedData.display_name}</Text>
          <Text style={styles.text}>Bio: {normalizedData.bio || 'No bio'}</Text>
          <Text style={styles.text}>Email: {normalizedData.email || 'N/A'}</Text>
          <Text style={styles.text}>Mobile: {normalizedData.mobile || 'N/A'}</Text>
          <Text style={styles.text}>Premium: {normalizedData.is_premium ? 'Yes' : 'No'}</Text>
          <Text style={styles.text}>Profile Image: {normalizedData.profile_image ? 'Yes' : 'No'}</Text>
          {normalizedData.wallet_balance !== undefined && (
            <Text style={styles.text}>Wallet Balance: ₹{normalizedData.wallet_balance}</Text>
          )}
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Data</Text>
          <Text style={styles.text}>No profile data available</Text>
        </View>
      )}

      {/* Utility Functions Test */}
      {normalizedData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Utility Functions Test</Text>
          <Text style={styles.text}>getUserDisplayName(): {getUserDisplayName(displayData)}</Text>
          <Text style={styles.text}>isPremiumUser(): {isPremiumUser(displayData) ? 'Yes' : 'No'}</Text>
        </View>
      )}

      {/* Raw Data (for debugging) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Raw Profile Data (Debug)</Text>
        <Text style={styles.debugText}>
          {JSON.stringify(profileData, null, 2)}
        </Text>
      </View>

      {isOwnProfile && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Raw User Data (Debug)</Text>
          <Text style={styles.debugText}>
            {JSON.stringify(userData, null, 2)}
          </Text>
        </View>
      )}
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
  info: {
    fontSize: 14,
    marginBottom: 12,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  error: {
    fontSize: 14,
    color: '#e74c3c',
    marginTop: 8,
  },
  inputContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
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
    maxHeight: 200,
  },
});

export default ProfileScreenTest;
