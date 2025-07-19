import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../contexts/ThemeContext';

// Constants
const API_BASE_URL = 'https://api.adtip.in';

// Define navigation param list (consistent with ProfileScreen)
type RootStackParamList = {
  FollowersList: { followers: any[]; userId?: number };
};

// Define navigation type
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'FollowersList'>;

// Define follower type (updated to include is_followed)
interface Follower {
  id: string | number;
  name?: string | null;
  profile_image?: string | null;
  is_followed: number;
}

interface FollowersListProps {
  followers?: Follower[];
  currentUserId?: number;
  onUserPress?: (userId: number) => void;
  showHeader?: boolean;
}

// Component
const FollowersList: React.FC<FollowersListProps> = (props) => {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();

  // Use props first, then route params as fallback
  const { followers: routeFollowers, userId: routeUserId, onUserPress: routeOnUserPress } = (route.params || {}) as { followers?: Follower[]; userId?: number; onUserPress?: (userId: number) => void };
  const initialFollowers = props.followers || routeFollowers;
  const profileUserId = routeUserId; // The user whose followers we're viewing
  const currentUserId = props.currentUserId; // The logged-in user
  const onUserPress = props.onUserPress || routeOnUserPress;
  const showHeader = props.showHeader !== false; // Default to true

  // State for fetched followers and loading
  const [followers, setFollowers] = useState<Follower[]>(initialFollowers || []);
  const [loading, setLoading] = useState(!initialFollowers); // Only show loading if no initial data
  // State to track logged-in user's follow status for each user in the list
  const [loggedInUserFollowStatus, setLoggedInUserFollowStatus] = useState<Record<string, boolean>>({});

  // Default profile image
  const DEFAULT_PROFILE_IMAGE = 'https://avatar.iran.liara.run/public';

  // Helper function for full image URLs
  const getFullImageUrl = (url?: string | null): string => {
    if (!url || url === 'null' || url === 'undefined') {
      return DEFAULT_PROFILE_IMAGE;
    }
    if (url.startsWith('http')) {
      return url;
    }
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // Fetch logged-in user's following list to determine follow status
  const fetchLoggedInUserFollowStatus = async () => {
    if (!currentUserId) return;

    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/follow/followings/${currentUserId}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status && result.type === 'followings' && Array.isArray(result.data)) {
          const followStatusMap: Record<string, boolean> = {};
          result.data.forEach((following: any) => {
            followStatusMap[following.id.toString()] = true;
          });
          setLoggedInUserFollowStatus(followStatusMap);
        }
      }
    } catch (error) {
      console.error('Error fetching logged-in user follow status:', error);
    }
  };

  // Fetch followers data from API
  const fetchFollowers = async () => {
    if (!profileUserId) {
      setFollowers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/follow/followers/${profileUserId}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error('Error fetching followers:', await response.text());
        setFollowers([]);
        return;
      }

      const result = await response.json();
      if (result.status && result.type === 'followers' && Array.isArray(result.data)) {
        setFollowers(
          result.data.map((follower: any) => ({
            ...follower,
            profile_image: getFullImageUrl(follower.profile_image),
          }))
        );
      } else {
        setFollowers([]);
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
      setFollowers([]);
    } finally {
      setLoading(false);
    }
  };

  // Handler for follow/unfollow button
  const handleFollowToggle = async (targetUserId: string | number) => {
    if (!currentUserId) return;

    const isCurrentlyFollowing = loggedInUserFollowStatus[targetUserId.toString()] || false;
    const action = isCurrentlyFollowing ? 'unfollow' : 'follow';

    // Optimistically update the UI
    setLoggedInUserFollowStatus(prev => ({
      ...prev,
      [targetUserId.toString()]: !isCurrentlyFollowing
    }));

    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/follow-user`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          followingId: Number(targetUserId),
          followerId: currentUserId,
          action: action,
        }),
      });

      if (!response.ok) {
        // Revert the optimistic update on error
        setLoggedInUserFollowStatus(prev => ({
          ...prev,
          [targetUserId.toString()]: isCurrentlyFollowing
        }));
        console.error('Error toggling follow status:', await response.text());
      }
    } catch (error) {
      // Revert the optimistic update on error
      setLoggedInUserFollowStatus(prev => ({
        ...prev,
        [targetUserId.toString()]: isCurrentlyFollowing
      }));
      console.error('Error toggling follow status:', error);
    }
  };

  // Fetch data on component mount or when userId changes - only if no props data provided
  useEffect(() => {
    if (!initialFollowers && profileUserId) {
      fetchFollowers();
    }
  }, [profileUserId, initialFollowers]);

  // Fetch logged-in user's follow status when component mounts or currentUserId changes
  useEffect(() => {
    if (currentUserId) {
      fetchLoggedInUserFollowStatus();
    }
  }, [currentUserId]);

  // Update follow status when followers list changes
  useEffect(() => {
    if (currentUserId && followers.length > 0) {
      fetchLoggedInUserFollowStatus();
    }
  }, [followers.length, currentUserId]);

  // Render item for FlatList
  const renderFollowerItem = ({ item }: { item: Follower }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={() => onUserPress ? onUserPress(Number(item.id)) : (navigation as any).navigate('Profile', { userId: Number(item.id) })}>
      {item.profile_image ? (
        <Image
          source={{ uri: getFullImageUrl(item.profile_image) }}
          style={styles.avatarImage}
        />
      ) : (
        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.gray[200] }]}>
          <Text style={styles.avatarInitials}>
            {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>
      )}
      <Text style={[styles.username, { color: colors.text.primary }]}>
        {item.name || 'Unknown'}
      </Text>
      {currentUserId && Number(item.id) !== currentUserId && (
        <TouchableOpacity
          onPress={() => handleFollowToggle(item.id)}
          style={[
            styles.followButton,
            {
              backgroundColor: loggedInUserFollowStatus[item.id.toString()]
                ? colors.error || '#ff4444'
                : colors.primary || '#007bff'
            }
          ]}
        >
          <Text style={[styles.followButtonText, { color: '#ffffff' }]}>
            {loggedInUserFollowStatus[item.id.toString()] ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header - only show if showHeader is true */}
      {showHeader && (
        <View style={[styles.header, { backgroundColor: isDarkMode ? colors.card : '#fff' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Followers</Text>
        </View>
      )}

      {/* List of followers */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={followers}
          renderItem={renderFollowerItem}
          keyExtractor={(item) => String(item.id)}
          style={styles.list}
          contentContainerStyle={[styles.listContent, followers.length === 0 && styles.emptyListContent]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                No followers found.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 16,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  emptyListContent: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  username: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  followText: {
    fontSize: 14,
    color: '#1DA1F2', // Blue color for "Follow"/"Following" text
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
});

export default FollowersList;