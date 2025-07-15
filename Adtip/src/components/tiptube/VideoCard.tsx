// src/components/tiptube/VideoCard.tsx
import React, {useState} from 'react';
import {View, Text, StyleSheet, Image, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { IndianRupee } from 'lucide-react-native';
import {useTheme} from '../../contexts/ThemeContext';
import Video from 'react-native-video';

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
  price?: number;
  videoUrl?: string;
  onPress: () => void;
  showPaidBadge?: boolean;
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
  price,
  videoUrl,
  onPress,
  showPaidBadge = false,
}) => {
  const {colors} = useTheme();
  const [isHovering, setIsHovering] = useState(false);

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
      style={[styles.container, {backgroundColor: colors.white}]}
      onPress={onPress}
      onPressIn={() => setIsHovering(true)}
      onPressOut={() => setIsHovering(false)}
      activeOpacity={0.9}>
      <View style={styles.thumbnailContainer}>
        {isHovering && videoUrl ? (
          <Video
            source={{uri: videoUrl}}
            style={styles.thumbnail}
            resizeMode="cover"
            muted={true}
            playInBackground={false}
            repeat={true}
            paused={false}
          />
        ) : (
          <Image
            source={{
              uri:
                thumbnailUrl ||
                'https://via.placeholder.com/320x180?text=No+Thumbnail',
            }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        )}
        <View style={styles.durationContainer}>
          <Text style={styles.duration}>{String(duration)}</Text>
        </View>
        {isPremium && (
          <View
            style={[styles.premiumBadge, {backgroundColor: colors.secondary}]}>
            <Icon
              name="star"
              size={10}
              color={colors.white}
              style={styles.badgeIcon}
            />
            <Text style={styles.premiumText}>Premium</Text>
          </View>
        )}
        {(showPaidBadge || (price && price > 0)) && (
          <View
            style={[
              styles.priceBadge,
              {backgroundColor: colors.success},
              isPremium ? styles.priceBadgePremium : styles.priceBadgeRegular,
            ]}>
            <IndianRupee
              size={10}
              color={colors.white}
              style={styles.badgeIcon}
            />
            <Text style={styles.priceText}>₹{(price || 0).toFixed(2)}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.userImageContainer}>
          {userImageUrl ? (
            <Image source={{uri: userImageUrl}} style={styles.userImage} />
          ) : (
            <View
              style={[
                styles.userImagePlaceholder,
                {backgroundColor: colors.gray[200]},
              ]}
            />
          )}
        </View>

        <View style={styles.textContent}>
          <Text
            style={[styles.title, {color: colors.text.primary}]}
            numberOfLines={2}>
            {String(title)}
          </Text>
          <Text style={[styles.username, {color: colors.text.secondary}]}>
            {String(username)}
          </Text>
          <Text style={[styles.metadata, {color: colors.text.tertiary}]}>
            {formatViewCount(views)} views • {String(postedTime)}
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
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  thumbnailContainer: {
    position: 'relative',
    height: 180,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeIcon: {
    marginRight: 4,
  },
  premiumText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  priceBadge: {
    position: 'absolute',
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priceText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  priceBadgePremium: {
    top: 40,
  },
  priceBadgeRegular: {
    top: 8,
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
