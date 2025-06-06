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

// Component
const FollowersList: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { followers: initialFollowers, userId } = route.params as { followers: Follower[]; userId?: number };

  // State for fetched followers and loading
  const [followers, setFollowers] = useState<Follower[]>(initialFollowers || []);
  const [loading, setLoading] = useState(false);

  // Default profile image
  const DEFAULT_PROFILE_IMAGE = 'https://via.placeholder.com/150';

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

  // Fetch followers data from API
  const fetchFollowers = async () => {
    if (!userId) {
      setFollowers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/follow/followers/${userId}`, {
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
  const handleFollowToggle = (followerId: string | number, currentIsFollowed: number) => {
    setFollowers((prevFollowers) =>
      prevFollowers.map((follower) =>
        follower.id === followerId ? { ...follower, is_followed: currentIsFollowed ? 0 : 1 } : follower
      )
    );
    // In a real app, you'd also make an API call here to update the follow status on the server
    console.log(`Toggled follow status for user ${followerId}`);
  };

  // Fetch data on component mount or when userId changes
  useEffect(() => {
    fetchFollowers();
  }, [userId]);

  // Render item for FlatList
  const renderFollowerItem = ({ item }: { item: Follower }) => (
    <View style={styles.itemContainer}>
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
      <TouchableOpacity onPress={() => handleFollowToggle(item.id, item.is_followed)}>
        <Text style={styles.followText}>
          {item.is_followed ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDarkMode ? colors.card : '#fff' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>My Followers</Text>
      </View>

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
          contentContainerStyle={styles.listContent}
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
  listContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
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