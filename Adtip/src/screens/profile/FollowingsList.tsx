import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../contexts/ThemeContext';

// Constants
const API_BASE_URL = 'https://api.adtip.in';

// Define navigation param list (updated to include userId)
type RootStackParamList = {
  FollowingsList: { followings: any[]; userId?: number };
};

// Define navigation type
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'FollowingsList'>;

// Define following type (consistent with ProfileScreen and API response)
interface Following {
  id: string | number;
  name?: string;
  profile_image?: string | null;
}

interface FollowingsListProps {
  followings?: Following[];
  currentUserId?: number;
  onUserPress?: (userId: number) => void;
  showHeader?: boolean;
}

// Component
const FollowingsList: React.FC<FollowingsListProps> = (props) => {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();

  // Use props first, then route params as fallback
  const { followings: routeFollowings, userId: routeUserId, onUserPress: routeOnUserPress } = (route.params || {}) as { followings?: Following[]; userId?: number; onUserPress?: (userId: number) => void };
  const initialFollowings = props.followings || routeFollowings;
  const userId = props.currentUserId || routeUserId;
  const onUserPress = props.onUserPress || routeOnUserPress;
  const showHeader = props.showHeader !== false; // Default to true

  // State for fetched followings and loading
  const [followings, setFollowings] = useState<Following[]>(initialFollowings || []);
  const [loading, setLoading] = useState(!initialFollowings); // Only show loading if no initial data

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

  // Fetch followings data from API
  const fetchFollowings = async () => {
    if (!userId) {
      setFollowings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/follow/followings/${userId}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error('Error fetching followings:', await response.text());
        setFollowings([]);
        return;
      }

      const result = await response.json();
      if (result.status && result.type === 'followings' && Array.isArray(result.data)) {
        setFollowings(
          result.data.map((following: any) => ({
            ...following,
            profile_image: getFullImageUrl(following.profile_image),
          }))
        );
      } else {
        setFollowings([]);
      }
    } catch (error) {
      console.error('Error fetching followings:', error);
      setFollowings([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount or when userId changes - only if no props data provided
  useEffect(() => {
    if (!initialFollowings && userId) {
      fetchFollowings();
    }
  }, [userId, initialFollowings]);

  // Render item for FlatList
  const renderFollowingItem = ({ item }: { item: Following }) => (
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
      <Text style={styles.followingText}>following</Text>
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
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Following</Text>
        </View>
      )}

      {/* List of followings */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={followings}
          renderItem={renderFollowingItem}
          keyExtractor={(item) => String(item.id)}
          style={styles.list}
          contentContainerStyle={[styles.listContent, followings.length === 0 && styles.emptyListContent]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                No followings found.
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
  followingText: {
    fontSize: 14,
    color: '#FF4D4F', // Red color for "following" text
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

export default FollowingsList;