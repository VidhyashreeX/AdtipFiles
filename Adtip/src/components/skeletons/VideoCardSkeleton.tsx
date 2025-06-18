import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext'; 

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = 16;
const THUMBNAIL_HEIGHT = (SCREEN_WIDTH * 9) / 16; // 16:9 aspect ratio, full width

const VideoCardSkeleton: React.FC<{ isYouTubeLayout?: boolean }> = ({ isYouTubeLayout = false }) => {
  const { colors, isDarkMode } = useTheme();
  const pulseAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnimation]);

  const pulseStyle = {
    opacity: pulseAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 1], 
    }),
  };

  // YouTube-style skeleton
  if (isYouTubeLayout) {
    return (
      <View style={styles.youtubeSkeletonContainer}>
        {/* Full-width thumbnail */}
        <View 
          style={[
            styles.youtubeThumbnailPlaceholder, 
            { backgroundColor: colors.skeleton.background }
          ]} 
        />
        
        {/* Video info section */}
        <View style={styles.youtubeInfoContainer}>
          {/* Avatar */}
          <View 
            style={[
              styles.youtubeAvatarPlaceholder, 
              { backgroundColor: colors.skeleton.background }
            ]} 
          />
          
          {/* Title and details */}
          <View style={styles.youtubeTextContainer}>
            {/* Title lines */}
            <Animated.View 
              style={[
                styles.youtubeTitleLine1, 
                { backgroundColor: colors.skeleton.background }, 
                pulseStyle
              ]} 
            />
            <Animated.View 
              style={[
                styles.youtubeTitleLine2, 
                { backgroundColor: colors.skeleton.background }, 
                pulseStyle
              ]} 
            />
            
            {/* Channel name */}
            <Animated.View 
              style={[
                styles.youtubeChannelName, 
                { backgroundColor: colors.skeleton.background }, 
                pulseStyle
              ]} 
            />
            
            {/* Stats line */}
            <Animated.View 
              style={[
                styles.youtubeStatsLine, 
                { backgroundColor: colors.skeleton.background }, 
                pulseStyle
              ]} 
            />
          </View>
        </View>
      </View>
    );
  }

  // Original grid-style skeleton for backward compatibility
  const cardWidth = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - 16) / 2; // 2 columns with gap
  
  return (
    <View style={[styles.videoCard, { backgroundColor: colors.card, shadowColor: colors.text.primary, width: cardWidth }]}>
      {/* Static thumbnail background */}
      <View 
        style={[
          styles.thumbnailPlaceholder, 
          { backgroundColor: colors.skeleton.background }
        ]} 
      />
      
      <View style={styles.contentPlaceholder}>
        <View style={styles.avatarRow}>
          {/* Static avatar */}
          <View 
            style={[
              styles.avatarPlaceholder, 
              { backgroundColor: colors.skeleton.background }
            ]} 
          />
          
          <View style={styles.textLinesPlaceholder}>
            {/* Animated text lines */}
            <Animated.View 
              style={[
                styles.textLine, 
                { width: '70%', backgroundColor: colors.skeleton.background }, 
                pulseStyle
              ]} 
            />
            <Animated.View 
              style={[
                styles.textLine, 
                { width: '50%', backgroundColor: colors.skeleton.background, marginTop: 4 }, 
                pulseStyle
              ]} 
            />
          </View>
        </View>
        
        {/* Animated title lines */}
        <Animated.View 
          style={[
            styles.titleLine, 
            { width: '90%', backgroundColor: colors.skeleton.background, marginTop: 8 }, 
            pulseStyle
          ]} 
        />
        <Animated.View 
          style={[
            styles.titleLine, 
            { width: '60%', backgroundColor: colors.skeleton.background, marginTop: 4 }, 
            pulseStyle
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // YouTube-style skeleton styles
  youtubeSkeletonContainer: {
    backgroundColor: 'transparent',
    marginBottom: 16,
  },
  youtubeThumbnailPlaceholder: {
    width: SCREEN_WIDTH, // Full screen width
    height: THUMBNAIL_HEIGHT,
  },
  youtubeInfoContainer: {
    flexDirection: 'row',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 12,
    paddingBottom: 4,
  },
  youtubeAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  youtubeTextContainer: {
    flex: 1,
  },
  youtubeTitleLine1: {
    width: '95%',
    height: 16,
    borderRadius: 8,
    marginBottom: 6,
  },
  youtubeTitleLine2: {
    width: '75%',
    height: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  youtubeChannelName: {
    width: '40%',
    height: 14,
    borderRadius: 7,
    marginBottom: 4,
  },
  youtubeStatsLine: {
    width: '60%',
    height: 12,
    borderRadius: 6,
  },
  
  // Original grid skeleton styles
  videoCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, 
    shadowRadius: 2,
    elevation: 2,
  },
  thumbnailPlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderTopLeftRadius: 12, 
    borderTopRightRadius: 12,
  },
  contentPlaceholder: {
    padding: 12,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  textLinesPlaceholder: {
    flex: 1,
  },
  textLine: {
    height: 10,
    borderRadius: 5,
    marginBottom: 6,
  },
  titleLine: {
    height: 12,
    borderRadius: 6,
    marginBottom: 6,
  },
});

export default VideoCardSkeleton;