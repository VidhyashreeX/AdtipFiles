import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import Video, { VideoRef } from 'react-native-video';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  interpolate,
  Extrapolate,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

import { useTheme } from '../../contexts/ThemeContext';
import MemoizedRelatedVideoCard from '../../components/tiptube/MemoizedRelatedVideoCard';

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

// Utility functions
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// VideoPlayerModalScreen Component
const VideoPlayerModalScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { video, cardLayout, upNextVideos } = route.params;
  const { isDarkMode, colors } = useTheme();
  
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoPlayerRef = useRef<VideoRef | null>(null);

  // Animation values - separate backdrop and content opacity
  const backdropOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  // Handle Android back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleClose();
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  // Fade-in animation on mount
  useEffect(() => {
    // Backdrop fades in first
    backdropOpacity.value = withTiming(1, {
      duration: 200,
      easing: Easing.out(Easing.quad),
    });
    
    // Content fades in slightly after
    contentOpacity.value = withDelay(100, withTiming(1, {
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }));
  }, []);

  // Fixed fade-out on close - backdrop stays visible until navigation completes
  const handleClose = useCallback(() => {
    // First fade out content quickly
    contentOpacity.value = withTiming(0, {
      duration: 200,
      easing: Easing.bezier(0.4, 0.0, 1, 1),
    });
    
    // Keep backdrop visible longer to prevent white flash
    backdropOpacity.value = withDelay(150, withTiming(0, {
      duration: 200,
      easing: Easing.bezier(0.4, 0.0, 1, 1),
    }, () => {
      // Navigate back only after backdrop animation completes
      runOnJS(navigation.goBack)();
    }));
  }, [navigation, backdropOpacity, contentOpacity]);

  // Drag gesture for video area
  const dragY = useSharedValue(0);

  const dragGesture = Gesture.Pan()
    .onUpdate((event) => {
      'worklet';
      if (event.translationY > 0) {
        dragY.value = event.translationY * 0.8;
        
        // Reduce content opacity during drag
        const progress = Math.min(event.translationY / (SCREEN_HEIGHT * 0.3), 1);
        contentOpacity.value = interpolate(
          progress,
          [0, 1],
          [1, 0.5],
          Extrapolate.CLAMP
        );
        
        // Keep backdrop more opaque to prevent white flash
        backdropOpacity.value = interpolate(
          progress,
          [0, 1],
          [1, 0.8],
          Extrapolate.CLAMP
        );
      }
    })
    .onEnd((event) => {
      'worklet';
      if (event.translationY > SCREEN_HEIGHT * 0.2 || event.velocityY > 1000) {
        // Close modal with smooth transition
        runOnJS(handleClose)();
      } else {
        // Bounce back
        dragY.value = withSpring(0, { damping: 15, stiffness: 200 });
        contentOpacity.value = withSpring(1, { damping: 15, stiffness: 200 });
        backdropOpacity.value = withSpring(1, { damping: 15, stiffness: 200 });
      }
    });

  // Separate animated styles for backdrop and content
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    backgroundColor: isDarkMode ? '#000000' : '#000000', // Always black backdrop for consistency
  }), [isDarkMode]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: dragY.value }],
  }), []);

  const styles = useMemo(() => createModalStyles(colors, isDarkMode), [colors, isDarkMode]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <StatusBar backgroundColor="transparent" barStyle="light-content" translucent />
      
      {/* Fixed Backdrop - Prevents white flash */}
      <Animated.View style={[StyleSheet.absoluteFillObject, backdropStyle]} />
      
      {/* Content Layer */}
      <Animated.View style={[{ flex: 1 }, contentStyle]}>
        {/* Video Player */}
        <GestureDetector gesture={dragGesture}>
          <View style={styles.videoContainer}>
            <Video
              key={video.id}
              source={{uri: video.videoUrl ?? ''}}
              style={StyleSheet.absoluteFillObject}
              controls={true}
              paused={false}
              resizeMode="contain"
              onReadyForDisplay={() => setIsVideoReady(true)}
              onError={(error) => {
                console.error('[VideoPlayerModal] Video error:', error);
              }}
              repeat={false}
              playInBackground={false}
              playWhenInactive={false}
              bufferConfig={{
                minBufferMs: 1500,
                maxBufferMs: 6000,
                bufferForPlaybackMs: 800,
                bufferForPlaybackAfterRebufferMs: 1500
              }}
              ref={videoPlayerRef}
            />
            
            {!isVideoReady && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}
          </View>
        </GestureDetector>

        {/* Close Button */}
        <View style={styles.modalHeader}>
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Text style={styles.modalCloseButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        {/* Content Section */}
        <View style={styles.contentSection}>
          <ScrollView 
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
            scrollEventThrottle={16}
          >
            <View style={styles.videoInfo}>
              <Text style={styles.videoTitle} numberOfLines={2}>
                {video.title}
              </Text>
              <View style={styles.videoMeta}>
                <Text style={styles.videoStats}>
                  {video.views.toLocaleString()} views • {video.posted}
                </Text>
              </View>
            </View>

            <View style={styles.upNextSection}>
              <Text style={styles.upNextTitle}>Up next</Text>
              
              <ScrollView
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                style={styles.upNextScrollView}
                contentContainerStyle={styles.upNextScrollContent}
                scrollEventThrottle={16}
                bounces={true}
              >
                {upNextVideos.slice(0, 15).map((item: Video, index: number) => (
                  <View
                    key={`upnext-${item.id}`}
                    style={styles.upNextVideoItem}
                  >
                    <MemoizedRelatedVideoCard 
                      item={item} 
                      onPress={() => {
                        navigation.replace('VideoPlayerModal', {
                          video: item,
                          cardLayout: null,
                          upNextVideos: shuffleArray(upNextVideos.filter((v: Video) => v.id !== video.id))
                        });
                      }} 
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      </Animated.View>
    </GestureHandlerRootView>
  );
};

// Modal styles
const createModalStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  videoContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 24),
    left: 0,
    right: 0,
    height: SCREEN_WIDTH * 9 / 16,
    backgroundColor: '#000',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalHeader: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 54,
    right: 20,
    zIndex: 100,
  },
  modalCloseButton: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  contentSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: SCREEN_WIDTH * 9 / 16 + (Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24),
    backgroundColor: isDarkMode ? '#0f0f0f' : '#fff',
  },
  scrollContent: {
    flex: 1,
  },
  videoInfo: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: isDarkMode ? '#272727' : '#e0e0e0',
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: isDarkMode ? '#f1f1f1' : '#0f0f0f',
    lineHeight: 24,
    marginBottom: 8,
  },
  videoMeta: {
    marginBottom: 8,
  },
  videoStats: {
    fontSize: 14,
    color: isDarkMode ? '#aaa' : '#606060',
  },
  upNextSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    flex: 1,
  },
  upNextTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: isDarkMode ? '#f1f1f1' : '#0f0f0f',
    marginBottom: 16,
  },
  upNextScrollView: {
    flex: 1,
  },
  upNextScrollContent: {
    paddingBottom: 32,
  },
  upNextVideoItem: {
    marginBottom: 12,
  },
});

export default VideoPlayerModalScreen;