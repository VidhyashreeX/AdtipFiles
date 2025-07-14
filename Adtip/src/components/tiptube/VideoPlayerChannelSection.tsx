import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/ApiService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ChannelSectionProps {
  video: {
    id: number;
    channelId: number | string;
    creatorName: string;
    avatar?: string;
    isVerified?: boolean;
  };
  onNavigateToChannel: () => void;
  onSubscribe?: () => void;
}

const VideoPlayerChannelSection: React.FC<ChannelSectionProps> = ({
  video,
  onNavigateToChannel,
  onSubscribe,
}) => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);

  // Use video data directly instead of making API calls
  const channelInfo = {
    channelName: video.creatorName,
    profileImage: video.avatar,
    isVerified: video.isVerified,
    description: '', // Not available in video data
  };

  // Check if user is following the channel
  const checkFollowStatus = useCallback(async () => {
    if (!user?.id || !video?.channelId) return;
    
    try {
      const videoDetails = await ApiService.getVideoWithUserContext(Number(video.id), Number(user.id));
      if (videoDetails?.data) {
        const videoData = Array.isArray(videoDetails.data) ? videoDetails.data[0] : videoDetails.data;
        setIsFollowing(videoData?.is_following || false);
      }
    } catch (error) {
      console.error('[VideoPlayerChannelSection] Error checking follow status:', error);
    }
  }, [user?.id, video?.id, video?.channelId]);

  // Handle follow/unfollow
  const handleFollowToggle = useCallback(async () => {
    if (!user?.id || !video?.channelId) return;
    
    try {
      setIsLoading(true);
      const followAction = isFollowing ? 0 : 1;
      
      await ApiService.saveChannelFollowers({
        userId: Number(user.id),
        channelId: Number(video.channelId),
        follow: followAction
      });
      
      setIsFollowing(!isFollowing);
      
      // Update subscriber count optimistically
      setSubscriberCount(prev => isFollowing ? prev - 1 : prev + 1);
      
      if (onSubscribe) {
        onSubscribe();
      }
    } catch (error) {
      console.error('[VideoPlayerChannelSection] Error toggling follow:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, video?.channelId, isFollowing, onSubscribe]);

  // Format subscriber count
  const formatSubscriberCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  useEffect(() => {
    checkFollowStatus();
    // Set a placeholder subscriber count
    setSubscriberCount(Math.floor(Math.random() * 10000) + 100);
  }, [checkFollowStatus]);

  const styles = createStyles(colors, isDarkMode);

  return (
    <View style={styles.container}>
      {/* Channel Header */}
      <TouchableOpacity 
        style={styles.channelHeader} 
        onPress={onNavigateToChannel}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: video.avatar || "https://via.placeholder.com/48.png?text=CH" }}
          style={styles.channelAvatar}
        />

        <View style={styles.channelInfo}>
          <View style={styles.channelNameContainer}>
            <Text style={styles.channelName} numberOfLines={1}>
              {video.creatorName}
            </Text>
            {video.isVerified && (
              <Icon name="check-circle" size={16} color="#1DA1F2" style={styles.verifiedIcon} />
            )}
          </View>

          <Text style={styles.subscriberCount}>
            {formatSubscriberCount(subscriberCount)} subscribers
          </Text>
        </View>
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {/* Subscribe/Following Button */}
        {user?.id && video?.channelId && user.id !== video.channelId && (
          <TouchableOpacity
            style={[
              styles.subscribeButton,
              isFollowing ? styles.followingButton : styles.subscribeActiveButton
            ]}
            onPress={handleFollowToggle}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator 
                size="small" 
                color={isFollowing ? colors.text.primary : colors.white} 
              />
            ) : (
              <>
                <Icon 
                  name={isFollowing ? "user-check" : "user-plus"} 
                  size={16} 
                  color={isFollowing ? colors.text.primary : colors.white}
                  style={styles.buttonIcon}
                />
                <Text style={[
                  styles.subscribeButtonText,
                  isFollowing ? styles.followingButtonText : styles.subscribeActiveButtonText
                ]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Visit Channel Button */}
        <TouchableOpacity
          style={styles.visitChannelButton}
          onPress={onNavigateToChannel}
          activeOpacity={0.8}
        >
          <Icon name="tv" size={16} color={colors.text.primary} style={styles.buttonIcon} />
          <Text style={styles.visitChannelButtonText}>Visit Channel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    backgroundColor: isDarkMode ? colors.card : colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: isDarkMode ? 0.3 : 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  channelAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: colors.border,
  },
  channelInfo: {
    flex: 1,
  },
  channelNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  channelName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginRight: 6,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  subscriberCount: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 6,
  },
  channelDescription: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flex: 1,
    justifyContent: 'center',
  },
  subscribeActiveButton: {
    backgroundColor: colors.primary,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonIcon: {
    marginRight: 6,
  },
  subscribeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  subscribeActiveButtonText: {
    color: colors.white,
  },
  followingButtonText: {
    color: colors.text.primary,
  },
  visitChannelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
    justifyContent: 'center',
  },
  visitChannelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
});

export default VideoPlayerChannelSection;
