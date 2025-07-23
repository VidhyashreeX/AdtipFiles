import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FollowedChannel {
  id: number;
  name: string;
  avatar: string;
  isFollowing: boolean;
  subscriberCount?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2; // 2 cards per row with padding

// Mock data for demonstration
const mockFollowedChannels: FollowedChannel[] = [
  {
    id: 1,
    name: 'Jarad Dugley',
    avatar: 'https://picsum.photos/100/100?random=1',
    isFollowing: true,
    subscriberCount: 1200,
  },
  {
    id: 2,
    name: 'Foodmania',
    avatar: 'https://picsum.photos/100/100?random=2',
    isFollowing: true,
    subscriberCount: 5600,
  },
  {
    id: 3,
    name: 'Bakeryergy',
    avatar: 'https://picsum.photos/100/100?random=3',
    isFollowing: true,
    subscriberCount: 890,
  },
  {
    id: 4,
    name: 'Bakery SQ',
    avatar: 'https://picsum.photos/100/100?random=4',
    isFollowing: true,
    subscriberCount: 2300,
  },
  {
    id: 5,
    name: 'Paint Junction',
    avatar: 'https://picsum.photos/100/100?random=5',
    isFollowing: true,
    subscriberCount: 750,
  },
  {
    id: 6,
    name: 'Activity',
    avatar: 'https://picsum.photos/100/100?random=6',
    isFollowing: true,
    subscriberCount: 1800,
  },
];

const FollowedChannelScreen: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [channels, setChannels] = useState(mockFollowedChannels);

  const styles = createStyles(colors, isDarkMode, insets.top);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleUnfollow = (channelId: number) => {
    setChannels(prevChannels =>
      prevChannels.map(channel =>
        channel.id === channelId
          ? { ...channel, isFollowing: false }
          : channel
      )
    );
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Followed Channel</Text>
        <View style={styles.headerSpacer} />
      </View>

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
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Icon name="users" size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyStateText}>
              You're not following any channels yet
            </Text>
            <Text style={styles.emptyStateSubtext}>
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
  });

export default FollowedChannelScreen;
