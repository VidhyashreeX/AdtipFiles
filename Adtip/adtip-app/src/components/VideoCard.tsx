// components/VideoCard.tsx
import { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ImageStyle } from 'react-native';
import { router } from 'expo-router';

// Default thumbnail image
const DEFAULT_THUMBNAIL = 'https://via.placeholder.com/150';

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    thumbnail: string | null;
    channel: {
      id: string;
      name: string;
      avatar: string;
      verified: boolean;
      subscribers: number;
    };
    views: number;
    likes: number;
    duration: string;
    isLive?: boolean;
    createdAt: string;
    category: string;
    isPaidPromotional?: boolean;
    postedAt: string;
    description: string;
    videoUrl: string;
    comments: number;
  };
}

export default function VideoCard({ video }: VideoCardProps) {
  const [thumbnailError, setThumbnailError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    console.log(`Thumbnail URL for video ${video.id}:`, video.thumbnail);
  }, [video.thumbnail, video.id]);

  const handlePress = () => {
    router.push({
      pathname: '/video',
      params: { video: JSON.stringify(video) },
    });
  };

  const handleRetry = () => {
    setThumbnailError(false);
    setRetryCount(prev => prev + 1);
  };

  const thumbnailUri = video.thumbnail && !thumbnailError
    ? `${video.thumbnail}?t=${Date.now()}&retry=${retryCount}`
    : DEFAULT_THUMBNAIL;

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.8}>
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: thumbnailUri }}
          style={styles.thumbnail as ImageStyle} // Explicitly cast to ImageStyle
          resizeMode="cover"
          onError={(error) => {
            console.error(`Thumbnail error for video ${video.id}:`, error.nativeEvent.error);
            setThumbnailError(true);
          }}
          onLoad={() => {
            console.log(`Thumbnail loaded for video ${video.id}: ${thumbnailUri}`);
            setThumbnailError(false);
          }}
        />
        {thumbnailError && (
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {video.title}
        </Text>
        <Text style={styles.channel}>{video.channel.name}</Text>
        <Text style={styles.stats}>
          {video.views} views • {video.duration}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    backgroundColor: '#FFF',
    borderRadius: 8,
  },
  thumbnailContainer: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: 200,
  },
  retryButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -15 }],
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: 4,
  },
  retryText: {
    color: '#FFF',
    fontSize: 14,
  },
  info: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  channel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  stats: {
    fontSize: 12,
    color: '#888',
  },
});