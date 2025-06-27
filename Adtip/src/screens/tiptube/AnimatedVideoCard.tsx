import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  LayoutChangeEvent,
  Dimensions,
} from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  Easing,
  cancelAnimation,
  FadeIn,
  ZoomIn,
  useAnimatedReaction,
  useAnimatedRef,
  runOnJS,
} from 'react-native-reanimated';

// Get screen dimensions
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STAGGER_DELAY = 30;

// Define interfaces
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
}

interface CardLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  thumbnailLayout?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface AnimatedVideoCardProps {
  video: Video | null;
  onPress: (layout: CardLayout) => void;
  onPressIn: () => void;
  onPressOut: () => void;
  isSelected: boolean;
  isPreview: boolean;
  styles: any;
  colors: any;
  onNavigateToChannel: () => void;
  index: number;
  isYouTubeLayout?: boolean; // Add this prop
}

// Utility function
const formatDuration = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (num: number) => (num < 10 ? '0' + num : num);
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

// Constants
const CARD_MARGIN_HORIZONTAL = 16;

// Enhanced AnimatedVideoCard with shared transition tag
const AnimatedVideoCard = React.memo<AnimatedVideoCardProps>(({ 
  video, 
  onPress, 
  onPressIn, 
  onPressOut, 
  isSelected, 
  isPreview, 
  styles, 
  colors, 
  onNavigateToChannel, 
  index,
  isYouTubeLayout = false // Default to false for backward compatibility
}) => {
  // Shared values for ultra-smooth animations
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const borderRadius = useSharedValue(12);
  const shadowOpacity = useSharedValue(0.08);
  const elevation = useSharedValue(3);

  const cardRef = useAnimatedRef<View>();
  const thumbnailRef = useAnimatedRef<View>();
  const [cardLayout, setCardLayout] = useState<CardLayout>({ x: 0, y: 0, width: 0, height: 0 });
  const [thumbnailLayout, setThumbnailLayout] = useState<CardLayout>({ x: 0, y: 0, width: 0, height: 0 });

  // Entrance animation
  useEffect(() => {
    const delay = index * STAGGER_DELAY;
    
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: 400,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );
    
    translateY.value = withDelay(
      delay,
      withSpring(0, {
        damping: 18,
        stiffness: 120,
        mass: 0.8,
      })
    );
  }, [index]);

  // Selection animation
  useAnimatedReaction(
    () => isSelected,
    (selected) => {
      if (selected) {
        // YouTube-style selection with subtle scale and glow
        scale.value = withSequence(
          withTiming(0.98, { 
            duration: 60, 
            easing: Easing.bezier(0.4, 0.0, 0.2, 1) 
          }),
          withSpring(1.01, { 
            damping: 15, 
            stiffness: 300,
            mass: 0.5,
          })
        );
        borderRadius.value = withSpring(16, { damping: 15, stiffness: 200 });
        shadowOpacity.value = withSpring(0.15, { damping: 15, stiffness: 200 });
        elevation.value = withSpring(8, { damping: 15, stiffness: 200 });
      } else {
        scale.value = withSpring(1, { 
          damping: 15, 
          stiffness: 180,
          mass: 0.7,
        });
        borderRadius.value = withSpring(12, { damping: 15, stiffness: 200 });
        shadowOpacity.value = withSpring(0.08, { damping: 15, stiffness: 200 });
        elevation.value = withSpring(3, { damping: 15, stiffness: 200 });
      }
    }
  );

  // Animated styles
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value }
    ],
    opacity: opacity.value,
    borderRadius: borderRadius.value,
    shadowOpacity: shadowOpacity.value,
    elevation: elevation.value,
  }), []);

  // Layout handlers
  const handleCardLayout = useCallback((event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    // Account for scroll position and header
    setCardLayout({ x: x + CARD_MARGIN_HORIZONTAL, y: y + 100, width, height });
  }, []);

  const handleThumbnailLayout = useCallback((event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    // Calculate absolute position from card layout
    setThumbnailLayout({ 
      x: cardLayout.x + x, 
      y: cardLayout.y + y,
      width, 
      height 
    });
  }, [cardLayout]);

  // Press handlers
  const handlePressIn = useCallback(() => {
    'worklet';
    cancelAnimation(scale);
    scale.value = withTiming(0.98, { 
      duration: 80, 
      easing: Easing.bezier(0.4, 0.0, 0.2, 1) 
    });
    runOnJS(onPressIn)();
  }, [scale, onPressIn]);

  const handlePressOut = useCallback(() => {
    'worklet';
    cancelAnimation(scale);
    scale.value = withSpring(1, { 
      damping: 12, 
      stiffness: 180,
      mass: 0.6,
    });
    runOnJS(onPressOut)();
  }, [scale, onPressOut]);

  const handlePress = useCallback(() => {
    onPress({ 
      ...cardLayout, 
      thumbnailLayout: thumbnailLayout.width > 0 ? thumbnailLayout : { 
        x: cardLayout.x, 
        y: cardLayout.y, 
        width: cardLayout.width, 
        height: cardLayout.width * 9 / 16 
      }
    });
  }, [onPress, cardLayout, thumbnailLayout]);

  if (!video) return null;

  // Render YouTube-style layout
  if (isYouTubeLayout) {
    return (
      <Animated.View style={[styles.youtubeVideoCard, cardAnimatedStyle]}>
        <TouchableOpacity
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.98}
        >
          {/* Full-width Thumbnail - edge to edge */}
          <Animated.View 
            style={styles.youtubeThumbnailContainer}
            onLayout={handleThumbnailLayout}
            ref={thumbnailRef}
            sharedTransitionTag={`video-thumbnail-${video?.id}`}
          >
            {video?.price && video.price > 0 && (
              <Animated.View 
                entering={ZoomIn.delay(index * STAGGER_DELAY + 200).duration(200)}
                style={styles.youtubePriceBadge}
              >
                <Text style={styles.youtubePriceBadgeText}>₹{video.price}</Text>
              </Animated.View>
            )}
            
            {isPreview && video?.videoUrl ? (
              <Video
                source={{uri: video.videoUrl}}
                style={styles.youtubeThumbnailImage}
                resizeMode="cover"
                repeat
                muted
                paused={!isPreview}
                playInBackground={false}
                playWhenInactive={false}
              />
            ) : (
              <Image
                source={{uri: video?.thumbnail || "https://via.placeholder.com/400x225.png?text=No+Thumbnail"}}
                style={styles.youtubeThumbnailImage}
                resizeMode="cover"
              />
            )}
            
            <Animated.View 
              entering={FadeIn.delay(index * STAGGER_DELAY + 250).duration(200)}
              style={styles.youtubeDurationOverlay}
            >
              <Text style={styles.youtubeDurationText}>{formatDuration(video?.duration || 0)}</Text>
            </Animated.View>
          </Animated.View>

          {/* Video Info - with padding */}
          <View style={styles.youtubeVideoInfo}>
            <TouchableOpacity onPress={onNavigateToChannel}>
              <Image
                source={{uri: video.avatar || "https://via.placeholder.com/40.png?text=N/A"}}
                style={styles.youtubeAvatar}
              />
            </TouchableOpacity>
            
            <View style={styles.youtubeVideoDetails}>
              <Text style={styles.youtubeVideoTitle} numberOfLines={2}>
                {video.title}
              </Text>
              <TouchableOpacity onPress={onNavigateToChannel}>
                <Text style={styles.youtubeChannelName} numberOfLines={1}>
                  {video.creatorName}
                </Text>
              </TouchableOpacity>
              <Text style={styles.youtubeVideoStats}>
                {(video.views || 0).toLocaleString()} views • {video.posted}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View 
      style={[styles.videoCard, cardAnimatedStyle]}
      onLayout={handleCardLayout}
      ref={cardRef}
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.98}
      >
        {/* Add shared transition tag to thumbnail container */}
        <Animated.View 
          style={styles.thumbnailContainer}
          onLayout={handleThumbnailLayout}
          ref={thumbnailRef}
          sharedTransitionTag={`video-thumbnail-${video?.id}`} // React Navigation shared element
        >
          {video?.price && video.price > 0 && (
            <Animated.View 
              entering={ZoomIn.delay(index * STAGGER_DELAY + 200).duration(200)}
              style={styles.priceBadge}
            >
              <Text style={styles.priceBadgeText}>₹{video.price}</Text>
            </Animated.View>
          )}
          {isPreview && video?.videoUrl ? (
            <Video
              source={{uri: video.videoUrl}}
              style={styles.videoThumbnail}
              resizeMode="cover"
              repeat
              muted
              paused={!isPreview}
              playInBackground={false}
              playWhenInactive={false}
            />
          ) : (
            <Image
              source={{uri: video?.thumbnail || "https://via.placeholder.com/300x169.png?text=No+Thumbnail"}}
              style={styles.thumbnailImage}
              resizeMode="cover"
            />
          )}
          <Animated.View 
            entering={FadeIn.delay(index * STAGGER_DELAY + 250).duration(200)}
            style={styles.durationOverlay}
          >
            <Text style={styles.durationText}>{formatDuration(video?.duration || 0)}</Text>
          </Animated.View>
        </Animated.View>
        <View style={styles.cardContent}>
          <View style={styles.creatorInfo}>
            <Image
              source={{uri: video.avatar || "https://via.placeholder.com/32.png?text=N/A"}}
              style={styles.avatar}
            />
            <View style={styles.creatorText}>
              <TouchableOpacity onPress={onNavigateToChannel}>
                <Text style={styles.creatorName} numberOfLines={1}>{video.creatorName}</Text>
              </TouchableOpacity>
              <Text style={styles.videoStats}>
                {(video.views || 0).toLocaleString()} views • {video.posted}
              </Text>
            </View>
          </View>
          <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default AnimatedVideoCard;