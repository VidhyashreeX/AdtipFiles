import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { IndianRupee } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getFallbackAvatarUrl, getFallbackThumbnailUrl, getSecureMediaUrl } from '../../utils/mediaUtils';
import { TIPTUBE_THEME, getVideoCardDimensions } from '../../utils/tiptubeTheme';

interface Video {
  id: number;
  title: string;
  thumbnail?: string;
  videoUrl?: string;
  duration: number;
  views: number;
  posted: string;
  avatar?: string;
  creatorName: string;
  isVerified?: boolean;
  channelId: number | string;
  price?: number;
  isPaidPromotional: number;
}

interface YouTubeStyleVideoCardProps {
  video: Video;
  onPress: () => void;
  onChannelPress?: () => void;
  onFollowPress?: () => void;
  isFollowing?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const { width: CARD_WIDTH, height: THUMBNAIL_HEIGHT } = getVideoCardDimensions();

const YouTubeStyleVideoCard: React.FC<YouTubeStyleVideoCardProps> = ({
  video,
  onPress,
  onChannelPress,
  onFollowPress,
  isFollowing = false,
}) => {
  const { colors, isDarkMode } = useTheme();
  const styles = createStyles(colors, isDarkMode);

  // State for secure media URLs
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(getFallbackThumbnailUrl(video.id));
  const [avatarUrl, setAvatarUrl] = useState<string>(getFallbackAvatarUrl(video.channelId));

  // Load secure media URLs
  useEffect(() => {
    const loadSecureUrls = async () => {
      // Load thumbnail
      if (video.thumbnail) {
        try {
          const secureThumbnail = await getSecureMediaUrl(video.thumbnail);
          if (secureThumbnail) {
            setThumbnailUrl(secureThumbnail);
          }
        } catch (error) {
          console.warn('[YouTubeStyleVideoCard] Failed to load thumbnail:', error);
        }
      }

      // Load avatar
      if (video.avatar) {
        try {
          const secureAvatar = await getSecureMediaUrl(video.avatar);
          if (secureAvatar) {
            setAvatarUrl(secureAvatar);
          }
        } catch (error) {
          console.warn('[YouTubeStyleVideoCard] Failed to load avatar:', error);
        }
      }
    };

    loadSecureUrls();
  }, [video.thumbnail, video.avatar, video.id, video.channelId]);

  // Format view count (e.g., 1.2k, 3.4M)
  const formatViewCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // Format duration from seconds to MM:SS or HH:MM:SS format
  const formatDuration = (durationInSeconds: number): string => {
    if (isNaN(durationInSeconds) || durationInSeconds <= 0) {
      return '0:00';
    }

    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    const seconds = durationInSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleChannelPress = () => {
    if (onChannelPress) {
      onChannelPress();
    }
  };

  const handleFollowPress = () => {
    if (onFollowPress) {
      onFollowPress();
    }
  };

  return (
    <View style={styles.container}>
      {/* Thumbnail Section */}
      <TouchableOpacity
        style={styles.thumbnailContainer}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: thumbnailUrl }}
          style={styles.thumbnail}
          resizeMode="cover"
          onError={() => {
            console.warn('[YouTubeStyleVideoCard] Thumbnail failed to load, using fallback');
            setThumbnailUrl(getFallbackThumbnailUrl(video.id));
          }}
        />
        
        {/* Duration Overlay */}
        <View style={styles.durationOverlay}>
          <Text style={styles.durationText}>
            {formatDuration(video.duration)}
          </Text>
        </View>

        {/* Price Badge for Paid Videos */}
        {video.isPaidPromotional === 1 && video.price && video.price > 0 && (
          <View style={styles.priceBadge}>
            <IndianRupee size={10} color="#FFFFFF" />
            <Text style={styles.priceBadgeText}>₹{video.price.toFixed(2)}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Video Info Section */}
      <View style={styles.videoInfo}>
        {/* Creator Avatar */}
        <TouchableOpacity onPress={handleChannelPress}>
          <Image
            source={{ uri: avatarUrl }}
            style={styles.avatar}
            onError={() => {
              console.warn('[YouTubeStyleVideoCard] Avatar failed to load, using fallback');
              setAvatarUrl(getFallbackAvatarUrl(video.channelId));
            }}
          />
        </TouchableOpacity>

        {/* Video Details */}
        <View style={styles.videoDetails}>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {video.title}
          </Text>
          
          <TouchableOpacity onPress={handleChannelPress}>
            <View style={styles.channelInfo}>
              <Text style={styles.channelName}>{video.creatorName}</Text>
              {video.isVerified && (
                <Icon name="check-circle" size={12} color={colors.primary} style={styles.verifiedIcon} />
              )}
            </View>
          </TouchableOpacity>
          
          <Text style={styles.videoStats}>
            {formatViewCount(video.views)} views • {video.posted}
          </Text>
        </View>

        {/* Follow Button */}
        <TouchableOpacity
          style={[
            styles.followButton,
            isFollowing && styles.followingButton
          ]}
          onPress={handleFollowPress}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.followButtonText,
            isFollowing && styles.followingButtonText
          ]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (colors: any, isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      marginBottom: 16,
    },
    thumbnailContainer: {
      width: SCREEN_WIDTH,
      height: THUMBNAIL_HEIGHT,
      backgroundColor: colors.border,
      position: 'relative',
    },
    thumbnail: {
      width: '100%',
      height: '100%',
    },
    durationOverlay: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      backgroundColor: 'rgba(0,0,0,0.8)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    durationText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: 'bold',
    },
    priceBadge: {
      position: 'absolute',
      top: 8,
      left: 8,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    priceBadgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: 'bold',
      marginLeft: 2,
    },
    videoInfo: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
      alignItems: 'flex-start',
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.border,
      marginRight: 12,
    },
    videoDetails: {
      flex: 1,
    },
    videoTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text.primary,
      lineHeight: 22,
      marginBottom: 4,
    },
    channelInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    channelName: {
      fontSize: 14,
      color: colors.text.secondary,
      marginRight: 4,
    },
    verifiedIcon: {
      marginLeft: 2,
    },
    videoStats: {
      fontSize: 14,
      color: colors.text.tertiary,
    },
    followButton: {
      backgroundColor: TIPTUBE_THEME.colors.primary,
      paddingHorizontal: TIPTUBE_THEME.spacing.lg,
      paddingVertical: TIPTUBE_THEME.spacing.xs + 2,
      borderRadius: TIPTUBE_THEME.borderRadius.round,
      marginLeft: TIPTUBE_THEME.spacing.sm,
    },
    followingButton: {
      backgroundColor: colors.cardSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    followButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
    followingButtonText: {
      color: colors.text.secondary,
    },
  });

export default YouTubeStyleVideoCard;
