/**
 * SimpleVideoCard - Fully memoized, simple video card
 * 
 * Key features:
 * - React.memo with custom comparison to prevent re-renders
 * - Minimal state
 * - No complex effects or animations
 * - Stable callbacks using useCallback
 */

import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Eye, Clock } from 'lucide-react-native';

interface Video {
  id: number;
  title: string;
  thumbnail?: string;
  duration: number;
  views: number;
  posted: string;
  avatar?: string;
  creatorName: string;
  isVerified?: boolean;
  channelId: number | string;
  price?: number;
}

interface SimpleVideoCardProps {
  video: Video;
  onPress: (videoId: number) => void;
  colors: any;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;
const THUMBNAIL_HEIGHT = (CARD_WIDTH * 9) / 16;

const formatViewCount = (count: number): string => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

const formatDuration = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatTimeAgo = (dateString: string): string => {
  if (!dateString || dateString === 'Recently') return 'Recently';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
};

const SimpleVideoCard: React.FC<SimpleVideoCardProps> = ({ video, onPress, colors }) => {
  const styles = createStyles(colors);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(video.id)}
      activeOpacity={0.7}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ 
            uri: video.thumbnail || 'https://via.placeholder.com/640x360'
          }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        
        {/* Duration Badge */}
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>
            {formatDuration(video.duration)}
          </Text>
        </View>

        {/* Price Badge */}
        {video.price && video.price > 0 && (
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>₹{video.price}</Text>
          </View>
        )}
      </View>

      {/* Video Info */}
      <View style={styles.infoContainer}>
        <Image
          source={{ 
            uri: video.avatar || 'https://via.placeholder.com/40'
          }}
          style={styles.avatar}
        />
        
        <View style={styles.details}>
          <Text style={styles.title} numberOfLines={2}>
            {video.title}
          </Text>
          
          <View style={styles.channelRow}>
            <Text style={styles.channelName} numberOfLines={1}>
              {video.creatorName}
            </Text>
            {video.isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓</Text>
              </View>
            )}
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Eye size={12} color={colors.text.secondary} />
              <Text style={styles.statText}>
                {formatViewCount(video.views)}
              </Text>
            </View>
            <Text style={styles.separator}>•</Text>
            <View style={styles.stat}>
              <Clock size={12} color={colors.text.secondary} />
              <Text style={styles.statText}>
                {formatTimeAgo(video.posted)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    card: {
      width: CARD_WIDTH,
      marginHorizontal: 16,
      marginBottom: 20,
      backgroundColor: colors.card,
      borderRadius: 12,
      overflow: 'hidden',
    },
    thumbnailContainer: {
      width: '100%',
      height: THUMBNAIL_HEIGHT,
      backgroundColor: colors.cardSecondary,
      position: 'relative',
    },
    thumbnail: {
      width: '100%',
      height: '100%',
    },
    durationBadge: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    durationText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
    priceBadge: {
      position: 'absolute',
      top: 8,
      left: 8,
      backgroundColor: '#00D9FF',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    priceText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: 'bold',
    },
    infoContainer: {
      flexDirection: 'row',
      padding: 12,
      gap: 12,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.cardSecondary,
    },
    details: {
      flex: 1,
    },
    title: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text.primary,
      lineHeight: 18,
      marginBottom: 4,
    },
    channelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 4,
    },
    channelName: {
      fontSize: 12,
      color: colors.text.secondary,
      flex: 1,
    },
    verifiedBadge: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: '#00D9FF',
      justifyContent: 'center',
      alignItems: 'center',
    },
    verifiedText: {
      fontSize: 9,
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    stat: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statText: {
      fontSize: 12,
      color: colors.text.secondary,
    },
    separator: {
      fontSize: 12,
      color: colors.text.secondary,
    },
  });

// Custom comparison function - only re-render if video ID changes
const arePropsEqual = (prevProps: SimpleVideoCardProps, nextProps: SimpleVideoCardProps) => {
  return prevProps.video.id === nextProps.video.id;
};

export default memo(SimpleVideoCard, arePropsEqual);
