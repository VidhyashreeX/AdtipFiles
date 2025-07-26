import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/common/Header';
import ApiService from '../../services/ApiService';
import { getSecureMediaUrl, getFallbackAvatarUrl } from '../../utils/mediaUtils';

interface FollowedChannel {
  id: number;
  name: string;
  avatar: string;
  isFollowing: boolean;
  subscriberCount?: number;
  channelId?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2; // 2 cards per row with padding

const FollowedChannelScreen: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // State for followed channels
  const [channels, setChannels] = useState<FollowedChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const styles = createStyles(colors, isDarkMode, insets.top);

  // Fetch followed channels data
  const fetchFollowedChannels = useCallback(async () => {
    console.log('🚀 [FollowedChannelScreen] Fetching followed channels for user:', user?.id);

    if (!user?.id) {
      console.error('❌ [FollowedChannelScreen] User not authenticated');
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    try {
      setError('');
      console.log('📡 [FollowedChannelScreen] Making API call to getListOfFollowedChannelByUser...');
      const response = await ApiService.getListOfFollowedChannelByUser(Number(user.id));
      console.log('📥 [FollowedChannelScreen] Followed channels API response:', {
        status: response.status,
        hasData: !!response.data,
        dataLength: response.data?.length
      });

      if (response.status === 200 && response.data && Array.isArray(response.data)) {
        const transformedChannels: FollowedChannel[] = await Promise.all(
          response.data.map(async (channel: any) => ({
            id: channel.channelId || channel.id,
            channelId: channel.channelId,
            name: channel.channelName || channel.name || 'Unknown Channel',
            avatar: channel.profileImage
              ? await getSecureMediaUrl(channel.profileImage)
              : getFallbackAvatarUrl(channel.channelId || channel.id),
            isFollowing: true, // They are in the followed list
            subscriberCount: channel.totalSubscribers || channel.total_subscribers || 0,
          }))
        );

        console.log('✅ [FollowedChannelScreen] Transformed channels:', transformedChannels.length);
        setChannels(transformedChannels);
      } else {
        console.log('📭 [FollowedChannelScreen] No followed channels found');
        setChannels([]);
      }
    } catch (err: any) {
      console.error('Error fetching followed channels:', err);
      setError(err.message || 'Failed to load followed channels');
      setChannels([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchFollowedChannels();
  }, [fetchFollowedChannels]);

  // Load data on component mount
  useEffect(() => {
    fetchFollowedChannels();
  }, [fetchFollowedChannels]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleUnfollow = async (channelId: number) => {
    if (!user?.id) return;

    try {
      console.log('🔄 [FollowedChannelScreen] Unfollowing channel:', channelId);

      // Call the API to unfollow the channel
      const response = await ApiService.saveChannelFollowers({
        userId: Number(user.id),
        channelId: channelId,
        follow: 0, // 0 for unfollow, 1 for follow
      });

      if (response.status === 200) {
        // Update local state to remove the channel from the list
        setChannels(prevChannels =>
          prevChannels.filter(channel => channel.id !== channelId)
        );
        console.log('✅ [FollowedChannelScreen] Successfully unfollowed channel:', channelId);
      } else {
        console.error('❌ [FollowedChannelScreen] Failed to unfollow channel:', response);
      }
    } catch (error) {
      console.error('Error unfollowing channel:', error);
      // Optionally show an error message to the user
    }
  };

  const handleChannelPress = (channel: FollowedChannel) => {
    // Navigate to channel details
    (navigation as any).navigate('Channel', {
      channelId: channel.id,
      channelData: {
        channelId: channel.id,
        channelName: channel.name,
        profileImage: channel.avatar,
        isVerified: false,
      },
    });
  };

  const formatSubscriberCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const renderChannelCard = ({ item }: { item: FollowedChannel }) => (
    <TouchableOpacity
      style={styles.channelCard}
      onPress={() => handleChannelPress(item)}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: item.avatar }}
        style={styles.channelAvatar}
        resizeMode="cover"
      />
      
      <Text style={styles.channelName} numberOfLines={1}>
        {item.name}
      </Text>
      
      {item.subscriberCount && (
        <Text style={styles.subscriberCount}>
          {formatSubscriberCount(item.subscriberCount)} subscribers
        </Text>
      )}
      
      <TouchableOpacity
        style={[
          styles.followButton,
          !item.isFollowing && styles.unfollowedButton
        ]}
        onPress={() => handleUnfollow(item.id)}
        activeOpacity={0.8}
      >
        <Text style={[
          styles.followButtonText,
          !item.isFollowing && styles.unfollowedButtonText
        ]}>
          {item.isFollowing ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header
          title="Followed Channels"
          showSearch={false}
          showWallet={false}
          showPremium={false}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading followed channels...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header
        title="Followed Channels"
        showSearch={false}
        showWallet={false}
        showPremium={false}
      />

      {/* Channels Grid */}
      <FlatList
        data={channels}
        renderItem={renderChannelCard}
        keyExtractor={(item) => `channel-${item.id}`}
        numColumns={2}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Icon name="users" size={48} color={colors.text.secondary} />
            <Text style={[styles.emptyStateText, { color: colors.text.primary }]}>
              You're not following any channels yet
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: colors.text.secondary }]}>
              Discover and follow channels to see them here
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const createStyles = (colors: any, _isDarkMode: boolean, topInset: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: topInset + 12,
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text.primary,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 16,
    },
    headerSpacer: {
      width: 40, // Same width as back button for centering
    },
    gridContent: {
      padding: 16,
      flexGrow: 1,
    },
    row: {
      justifyContent: 'space-between',
    },
    separator: {
      height: 16,
    },
    channelCard: {
      width: CARD_WIDTH,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    channelAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.border,
      marginBottom: 12,
    },
    channelName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
      textAlign: 'center',
      marginBottom: 4,
    },
    subscriberCount: {
      fontSize: 12,
      color: colors.text.tertiary,
      textAlign: 'center',
      marginBottom: 12,
    },
    followButton: {
      backgroundColor: '#00C853',
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 20,
      minWidth: 80,
      alignItems: 'center',
    },
    unfollowedButton: {
      backgroundColor: colors.cardSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    followButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
    unfollowedButtonText: {
      color: colors.text.secondary,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
      paddingHorizontal: 40,
    },
    emptyStateText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text.primary,
      textAlign: 'center',
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: colors.text.secondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    loadingText: {
      fontSize: 16,
      marginTop: 12,
      textAlign: 'center',
    },
  });

export default FollowedChannelScreen;
