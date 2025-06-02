// src/components/tiptube/VideoCard.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../contexts/ThemeContext';

interface VideoCardProps {
  id: number;
  title: string;
  thumbnailUrl: string;
  duration: string;
  username: string;
  userImageUrl?: string;
  views: number;
  postedTime: string;
  isPremium?: boolean;
  onPress: () => void;
}

const VideoCard: React.FC<VideoCardProps> = ({
  title,
  thumbnailUrl,
  duration,
  username,
  userImageUrl,
  views,
  postedTime,
  isPremium = false,
  onPress
}) => {
  const { colors } = useTheme();
  
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

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.white }]} 
      onPress={onPress}
    >
      <View style={styles.thumbnailContainer}>
        <Image 
          source={{ uri: thumbnailUrl }} 
          style={styles.thumbnail}
          resizeMode="cover"
        />
        <View style={styles.durationContainer}>
          <Text style={styles.duration}>{duration}</Text>
        </View>
        {isPremium && (
          <View style={[styles.premiumBadge, { backgroundColor: colors.secondary }]}>
            <Text style={styles.premiumText}>Premium</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.userImageContainer}>
          {userImageUrl ? (
            <Image source={{ uri: userImageUrl }} style={styles.userImage} />
          ) : (
            <View style={[styles.userImagePlaceholder, { backgroundColor: colors.gray[200] }]} />
          )}
        </View>
        <View style={styles.textContent}>
          <Text style={[styles.title, { color: colors.text.primary }]} numberOfLines={2}>
            {title}
          </Text>
          <Text style={[styles.username, { color: colors.text.secondary }]}>
            {username}
          </Text>
          <Text style={[styles.metadata, { color: colors.text.tertiary }]}>
            {formatViewCount(views)} views • {postedTime}
          </Text>
        </View>
        <TouchableOpacity style={styles.optionsButton}>
          <Icon name="more-vertical" size={18} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  thumbnailContainer: {
    position: 'relative',
    height: 200,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  durationContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  duration: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  premiumText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  content: {
    flexDirection: 'row',
    padding: 12,
  },
  userImageContainer: {
    marginRight: 12,
  },
  userImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  userImagePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  username: {
    fontSize: 12,
    marginBottom: 2,
  },
  metadata: {
    fontSize: 12,
  },
  optionsButton: {
    padding: 4,
  },
});

export default VideoCard;
