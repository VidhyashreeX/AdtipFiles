import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { MainNavigatorParamList } from '../../types/navigation';
import Icon from 'react-native-vector-icons/Feather';
import FollowersList from './FollowersList';
import FollowingsList from './FollowingsList';
import ApiService from '../../services/ApiService';

type FollowersFollowingScreenRouteProp = RouteProp<MainNavigatorParamList, 'FollowersFollowing'>;
type FollowersFollowingScreenNavigationProp = NativeStackNavigationProp<MainNavigatorParamList, 'FollowersFollowing'>;

interface FollowersFollowingScreenProps {}

const FollowersFollowingScreen: React.FC<FollowersFollowingScreenProps> = () => {
  const { colors, isDarkMode } = useTheme();
  const { user: currentUser } = useAuth();
  const navigation = useNavigation<FollowersFollowingScreenNavigationProp>();
  const route = useRoute<FollowersFollowingScreenRouteProp>();
  
  const { userId, initialTab = 'followers', userName } = route.params;
  
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // Fetch followers and following data
  const fetchData = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Fetch followers
      const followersResponse = await ApiService.getFollowers(userId);
      if (followersResponse?.data) {
        setFollowers(followersResponse.data);
        setFollowersCount(followersResponse.data.length);
      }

      // Fetch following
      const followingResponse = await ApiService.getFollowing(userId);
      if (followingResponse?.data) {
        setFollowing(followingResponse.data);
        setFollowingCount(followingResponse.data.length);
      }
    } catch (error) {
      console.error('Error fetching followers/following:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle user press in lists
  const handleUserPress = useCallback((selectedUserId: number) => {
    if (selectedUserId === userId) {
      // If it's the same user, just go back
      navigation.goBack();
    } else {
      // Navigate to the selected user's profile
      navigation.replace('Profile', { userId: selectedUserId });
    }
  }, [navigation, userId]);

  // Handle back button
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Tab button component
  const TabButton = ({ tab, title, count }: { tab: 'followers' | 'following'; title: string; count: number }) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[
        styles.tabText,
        { color: activeTab === tab ? colors.primary : colors.text.secondary }
      ]}>
        {count.toLocaleString()} {title}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            {userName || 'User'}
          </Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          {userName || 'User'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TabButton tab="followers" title="followers" count={followersCount} />
        <TabButton tab="following" title="following" count={followingCount} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'followers' ? (
          <FollowersList
            followers={followers}
            currentUserId={currentUser?.id || 0}
            onUserPress={handleUserPress}
            showHeader={false}
          />
        ) : (
          <FollowingsList
            followings={following}
            currentUserId={currentUser?.id || 0}
            onUserPress={handleUserPress}
            showHeader={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FollowersFollowingScreen;
