import React, {useState, useEffect, useCallback, useRef, useMemo} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Dimensions,
  StatusBar,
  Platform,
  LayoutChangeEvent,
  BackHandler,
} from 'react-native';
import {useNavigation, useFocusEffect, useRoute} from '@react-navigation/native';
import Video, { VideoRef } from 'react-native-video';
import axios from 'axios';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Extrapolate,
  runOnJS,
  useDerivedValue,
  Easing,
  cancelAnimation,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutDown,
  ZoomIn,
  ZoomOut,
  useAnimatedReaction,
  measure,
  useAnimatedRef,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

import {useTheme} from '../../contexts/ThemeContext';
import {useTabNavigator} from '../../contexts/TabNavigatorContext';
import {useAuth} from '../../contexts/AuthContext';
import ApiService from '../../services/ApiService';
import Header from '../../components/common/Header';
import VideoCardSkeleton from '../../components/skeletons/VideoCardSkeleton';
import RelatedVideoCardSkeleton from '../../components/skeletons/RelatedVideoCardSkeleton';
import MemoizedRelatedVideoCard from '../../components/tiptube/MemoizedRelatedVideoCard';
import ScreenTransition from '../../components/common/ScreenTransition';

// Get screen dimensions and create constants
const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
const MODAL_ANIMATION_DURATION = 350;
const CARD_ANIMATION_DURATION = 200;
const STAGGER_DELAY = 30;

// Constants
const CARD_MARGIN_HORIZONTAL = 16;
const CARD_GAP = 16;
const NUM_COLUMNS = 2;
const cardWidth = (SCREEN_WIDTH - CARD_MARGIN_HORIZONTAL * 2 - CARD_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

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

// Navigation types
type TipTubeStackParamList = {
  TipTubeMain: undefined;
  VideoPlayerModal: {
    video: Video;
    cardLayout: CardLayout;
    upNextVideos: Video[];
  };
};

// Categories and utility functions
const categories = [
  {name: 'All', icon: '🌍'}, {name: 'Gaming', icon: '🎮'}, {name: 'Music', icon: '🎵'},
  {name: 'Education', icon: '📚'}, {name: 'Sports', icon: '⚽️'}, {name: 'Tech', icon: '💻'},
  {name: 'News', icon: '📰'}, {name: 'Comedy', icon: '😂'},
];

const categoryToIdMap: {[key: string]: number} = {
  All: 0, Gaming: 1, Music: 2, Education: 3, Sports: 4, Tech: 5, News: 6, Comedy: 7,
};

const formatDuration = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (num: number) => (num < 10 ? '0' + num : num);
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Enhanced AnimatedVideoCard with shared transition tag
const AnimatedVideoCard = React.memo<{
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
}>(({ video, onPress, onPressIn, onPressOut, isSelected, isPreview, styles, colors, onNavigateToChannel, index }) => {
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
                {video.views.toLocaleString()} views • {video.posted}
              </Text>
            </View>
          </View>
          <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// Simplified VideoPlayerModalScreen with proper dark mode fade-out fix
const VideoPlayerModalScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { video, cardLayout, upNextVideos } = route.params;
  const {isDarkMode, colors} = useTheme();
  
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
                {upNextVideos.slice(0, 15).map((item, index) => (
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

// Simplified modal styles - removed unnecessary complexity
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

// Update MainNavigator.tsx for simple modal presentation
// In MainNavigator.tsx, use these options:
/*
<Stack.Screen 
  name="VideoPlayerModal" 
  component={EnhancedVideoPlayerModalScreen}
  options={{
    presentation: 'transparentModal', // Changed to transparentModal
    headerShown: false,
    gestureEnabled: false,
    animation: 'none', // No navigation animation to prevent conflicts
    animationDuration: 0,
    contentStyle: { backgroundColor: 'transparent' }, // Transparent to show our backdrop
  }}
/>
*/

// Main TipTube Screen (simplified without modal logic)
const TipTubeScreen = () => {
  const {isDarkMode, colors} = useTheme();
  const {contentPaddingBottom} = useTabNavigator();
  const {user} = useAuth();
  const navigation = useNavigation<any>();

  // All state hooks (same as before)
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [offset, setOffset] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewingVideoId, setPreviewingVideoId] = useState<number | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  
  // API call tracking
  const [apiCallStatus, setApiCallStatus] = useState<{
    [key: string]: {
      called: boolean;
      success: boolean;
      retries: number;
    }
  }>({});
  const [hasInitialDataLoaded, setHasInitialDataLoaded] = useState(false);

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const mainListAbortControllerRef = useRef<AbortController | null>(null);

  // Memoized styles
  const styles = useMemo(() => createStyles(colors, isDarkMode), [colors, isDarkMode]);

  // ADD MISSING UTILITY FUNCTIONS
  const applyFilter = useCallback((query: string, videosToFilter: Video[]): Video[] => {
    if (!query.trim()) {
      return videosToFilter;
    }
    const lowerCaseQuery = query.toLowerCase();
    return videosToFilter.filter(video => 
      video.title?.toLowerCase().includes(lowerCaseQuery) ||
      video.creatorName?.toLowerCase().includes(lowerCaseQuery)
    );
  }, []);

  const transformVideoData = useCallback((apiVideo: any): Video => ({
    id: apiVideo.id || 0, 
    title: apiVideo.name || apiVideo.title || "Untitled Video",
    thumbnail: apiVideo.video_Thumbnail !== "undefined" ? apiVideo.video_Thumbnail : undefined,
    videoUrl: apiVideo.video_link || apiVideo.videoUrl,
    duration: parseInt(apiVideo.play_duration || apiVideo.duration || "0", 10),
    views: apiVideo.total_views || 0, 
    posted: apiVideo.createddate || "Recently",
    avatar: apiVideo.channel_profile !== "null" ? apiVideo.channel_profile : undefined,
    creatorName: apiVideo.channelName || "Unknown Creator", 
    isVerified: false,
    channelId: apiVideo.video_channel || apiVideo.channelId || apiVideo.createdby || 0,
    price: apiVideo.price ? parseFloat(apiVideo.price) : undefined,
  }), []);

  // OPTIMIZED FETCH VIDEOS FUNCTION
  const fetchVideos = useCallback(async (
    categoryName: string = "All", 
    pageOffset: number = 1, 
    searchText: string = "", 
    shouldReset: boolean = false,
    forceRefresh: boolean = false
  ) => {
    if (!user?.id) {
      console.log('[TipTubeScreen] No user ID available, skipping video fetch');
      return;
    }

    // Create unique key for this API call
    const apiCallKey = `${categoryName}_${pageOffset}_${searchText}`;
    
    // Check if we should make this API call
    const callStatus = apiCallStatus[apiCallKey];
    if (!forceRefresh && callStatus?.called && callStatus?.success) {
      console.log('[TipTubeScreen] Skipping API call - already successful:', apiCallKey);
      return;
    }

    // Check retry limit (max 2 retries)
    if (callStatus?.retries && callStatus.retries >= 2) {
      console.log('[TipTubeScreen] Max retries reached for:', apiCallKey);
      return;
    }

    try {
      // Cancel previous request if exists
      if (mainListAbortControllerRef.current) {
        mainListAbortControllerRef.current.abort();
      }

      // Create new abort controller
      const abortController = new AbortController();
      mainListAbortControllerRef.current = abortController;

      // Update API call status
      setApiCallStatus(prev => ({
        ...prev,
        [apiCallKey]: {
          called: true,
          success: false,
          retries: (prev[apiCallKey]?.retries || 0) + 1
        }
      }));

      if (shouldReset) {
        setInitialLoading(true);
        if (forceRefresh) {
          setAllVideos([]);
          setFilteredVideos([]);
        }
      } else {
        setLoading(true);
      }

      const categoryId = categoryToIdMap[categoryName] || 0;
      
      console.log('[TipTubeScreen] Making API call:', {
        userId: user.id,
        categoryId,
        offset: pageOffset,
        search: searchText,
        key: apiCallKey,
        retries: callStatus?.retries || 0
      });

      const response = await ApiService.getVideos(
        user.id,
        categoryId,
        pageOffset,
        searchText,
        abortController.signal
      );

      if (abortController.signal.aborted) {
        console.log('[TipTubeScreen] Request was aborted');
        return;
      }

      console.log('[TipTubeScreen] API response status:', response?.status);

      // Check if response is successful (status 200 or truthy status)
      if (response && (response.status === 200 || response.status === true)) {
        const videosArray = Array.isArray(response.data) ? response.data : [];
        const transformedVideos = videosArray.map(transformVideoData);
        
        // Mark API call as successful
        setApiCallStatus(prev => ({
          ...prev,
          [apiCallKey]: {
            called: true,
            success: true,
            retries: prev[apiCallKey]?.retries || 1
          }
        }));

        setAllVideos(prev => shouldReset ? transformedVideos : [...prev, ...transformedVideos]);
        
        // Apply search filter
        const filtered = applyFilter(searchText, shouldReset ? transformedVideos : [...allVideos, ...transformedVideos]);
        setFilteredVideos(filtered);
        
        setHasMore(transformedVideos.length > 0);
        setOffset(pageOffset + 1);
        setHasInitialDataLoaded(true);

        console.log('[TipTubeScreen] API call successful:', apiCallKey);
      } else {
        console.warn('[TipTubeScreen] API returned unsuccessful response:', response?.status);
        
        const currentRetries = apiCallStatus[apiCallKey]?.retries || 0;
        if (currentRetries < 2) {
          console.log(`[TipTubeScreen] Retrying API call (${currentRetries + 1}/2):`, apiCallKey);
          setTimeout(() => {
            fetchVideos(categoryName, pageOffset, searchText, shouldReset, false);
          }, 1000 * currentRetries);
        } else {
          console.error('[TipTubeScreen] Max retries reached, giving up:', apiCallKey);
          setHasMore(false);
        }
      }

    } catch (error: any) {
      if (axios.isCancel(error)) {
        console.log('[TipTubeScreen] Video fetch cancelled');
        return;
      }
      
      console.error('[TipTubeScreen] Error fetching videos:', error);
      
      const currentRetries = apiCallStatus[apiCallKey]?.retries || 0;
      if (currentRetries < 2) {
        console.log(`[TipTubeScreen] Retrying after error (${currentRetries + 1}/2):`, apiCallKey);
        setTimeout(() => {
          fetchVideos(categoryName, pageOffset, searchText, shouldReset, false);
        }, 1000 * currentRetries);
      } else {
        console.error('[TipTubeScreen] Max retries reached after error:', apiCallKey);
        setHasMore(false);
      }
    } finally {
      setInitialLoading(false);
      setLoading(false);
      setRefreshing(false);
      mainListAbortControllerRef.current = null;
    }
  }, [user?.id, transformVideoData, applyFilter, allVideos, apiCallStatus]);

  // REFRESH HANDLER
  const handleRefresh = useCallback(() => {
    console.log('[TipTubeScreen] Manual refresh triggered');
    setRefreshing(true);
    setOffset(1);
    setHasInitialDataLoaded(false);
    setApiCallStatus({});
    fetchVideos(selectedCategory, 1, searchQuery, true, true);
  }, [selectedCategory, searchQuery, fetchVideos]);

  // CATEGORY CHANGE HANDLER
  const handleCategoryChange = useCallback((categoryName: string) => {
    console.log('[TipTubeScreen] Category changed to:', categoryName);
    setSelectedCategory(categoryName);
    setOffset(1);
    
    const apiCallKey = `${categoryName}_1_${searchQuery}`;
    const callStatus = apiCallStatus[apiCallKey];
    
    if (callStatus?.success && allVideos.length > 0) {
      console.log('[TipTubeScreen] Using cached data for category:', categoryName);
      const filtered = applyFilter(searchQuery, allVideos);
      setFilteredVideos(filtered);
    } else {
      fetchVideos(categoryName, 1, searchQuery, true, false);
    }
  }, [searchQuery, fetchVideos, apiCallStatus, allVideos, applyFilter]);

  // ADD MISSING SEARCH HANDLER
  const handleSearch = useCallback((query: string) => {
    console.log('[TipTubeScreen] Search query:', query);
    setSearchQuery(query);
    
    if (hasInitialDataLoaded && allVideos.length > 0) {
      const filtered = applyFilter(query, allVideos);
      setFilteredVideos(filtered);
    } else {
      console.log('[TipTubeScreen] No data loaded yet, search will apply when data arrives');
    }
  }, [applyFilter, allVideos, hasInitialDataLoaded]);

  // Enhanced openPlayer - now navigates to modal screen
  const openPlayer = useCallback((video: Video, layout: CardLayout) => {
    console.log('[TipTubeScreen] Opening player for video:', video.id);
    
    setSelectedVideoId(video.id);
    
    // Generate up-next videos with explicit typing
    const shuffledVideos = shuffleArray(filteredVideos.filter((v: Video) => v.id !== video.id));
    
    // Navigate to modal screen with shared element transition
    navigation.navigate('VideoPlayerModal', {
      video,
      cardLayout: layout,
      upNextVideos: shuffledVideos.slice(0, 10)
    });
  }, [filteredVideos, navigation]);

  // Enhanced render function
  const renderVideoCard = useCallback((video: Video, index: number) => {
    return (
      <AnimatedVideoCard
        key={video.id}
        video={video}
        onPress={(layout) => openPlayer(video, layout)}
        onPressIn={() => setPreviewingVideoId(video.id)}
        onPressOut={() => setPreviewingVideoId(null)}
        isSelected={selectedVideoId === video.id}
        isPreview={previewingVideoId === video.id}
        styles={styles}
        colors={colors}
        onNavigateToChannel={() => navigation.navigate('ChannelScreen', { channelId: video.channelId })}
        index={index}
      />
    );
  }, [openPlayer, selectedVideoId, previewingVideoId, styles, colors, navigation]);

  // INITIAL LOAD EFFECT
  useEffect(() => {
    if (user?.id && !hasInitialDataLoaded) {
      console.log('[TipTubeScreen] Initial data load');
      fetchVideos(selectedCategory, 1, '', true, false);
    }
  }, [user?.id, hasInitialDataLoaded, selectedCategory, fetchVideos]);

  // FOCUS EFFECT
  useFocusEffect(
    useCallback(() => {
      if (user?.id && !hasInitialDataLoaded && allVideos.length === 0) {
        console.log('[TipTubeScreen] Focus effect - loading initial data');
        fetchVideos(selectedCategory, 1, '', true, false);
      }
    }, [user?.id, hasInitialDataLoaded, allVideos.length, selectedCategory, fetchVideos])
  );

  // CLEANUP EFFECT
  useEffect(() => {
    return () => {
      if (mainListAbortControllerRef.current) {
        mainListAbortControllerRef.current.abort();
      }
    };
  }, []);

  // Render (same as before, just without the modal)
  return (
    <ScreenTransition animationType="slide" skipAnimation={false}>
      <View style={styles.container}>
        <Header 
          title="TipTube" 
          showTipShortsIcon 
          showSearch={true}
          onSearchQueryChange={handleSearch}
          onSearchSubmit={handleSearch}
        />
        
        <ScrollView
          ref={scrollViewRef}
          scrollEventThrottle={16}
          contentContainerStyle={[styles.scrollViewContent, {paddingBottom: contentPaddingBottom}]}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh} 
              colors={[colors.primary]} 
              tintColor={colors.primary} 
            />
          }
        >
          {/* Categories */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroller}>
            {categories.map((cat, index) => (
              <Animated.View
                key={cat.name}
                entering={FadeIn.delay(index * 30).duration(200)}
              >
                <TouchableOpacity 
                  onPress={() => handleCategoryChange(cat.name)} 
                  style={[styles.categoryButton, selectedCategory === cat.name && styles.selectedCategoryButton]}
                >
                  <Text style={[styles.categoryButtonText, selectedCategory === cat.name && styles.selectedCategoryButtonText]}>
                    {cat.icon} {cat.name}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
          
          {/* Content */}
          {(initialLoading || (!hasInitialDataLoaded && filteredVideos.length === 0)) ? (
            <View style={styles.videoGrid}>
              {Array(6).fill(0).map((_, index) => (
                <Animated.View
                  key={`skeleton-${index}`}
                  entering={FadeIn.delay(index * 50).duration(300)}
                  style={styles.skeletonCardContainer}
                >
                  <VideoCardSkeleton />
                </Animated.View>
              ))}
            </View>
          ) : filteredVideos.length === 0 ? (
            <View style={styles.noVideosContainer}>
              <Text style={styles.noVideosText}>
                {searchQuery ? `No videos found for "${searchQuery}"` : 'No videos found'}
              </Text>
            </View>
          ) : (
            <View style={styles.videoGrid}>
              {filteredVideos.map((video, index) => renderVideoCard(video, index))}
              
              {loading && (
                <>
                  {Array(2).fill(0).map((_, index) => (
                    <Animated.View
                      key={`loading-skeleton-${index}`}
                      entering={FadeIn.delay(index * 100).duration(200)}
                      style={styles.skeletonCardContainer}
                    >
                      <VideoCardSkeleton />
                    </Animated.View>
                  ))}
                </>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenTransition>
  );
};

// Main styles (same as before)
const createStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollViewContent: { paddingHorizontal: CARD_MARGIN_HORIZONTAL, paddingTop: 16, },
  categoryScroller: { marginBottom: 16, paddingHorizontal: 0, marginLeft: -CARD_MARGIN_HORIZONTAL, marginRight: -CARD_MARGIN_HORIZONTAL, paddingLeft: CARD_MARGIN_HORIZONTAL },
  categoryButton: { paddingVertical: 8, paddingHorizontal: 16, marginRight: 8, borderRadius: 20, backgroundColor: colors.cardSecondary, borderWidth: 1, borderColor: colors.border },
  selectedCategoryButton: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryButtonText: { fontSize: 14, fontWeight: '600', color: colors.text.secondary },
  selectedCategoryButtonText: { color: colors.white },
  videoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  videoCard: { 
    width: cardWidth, 
    marginBottom: CARD_GAP, 
    backgroundColor: colors.card, 
    borderRadius: 12, 
    shadowColor: colors.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden' 
  },
  thumbnailContainer: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.border },
  thumbnailImage: { flex: 1 }, 
  videoThumbnail: { flex: 1 },
  durationOverlay: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  durationText: { color: colors.white, fontSize: 10, fontWeight: 'bold' },
  priceBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, zIndex: 1 },
  priceBadgeText: { color: colors.white, fontSize: 11, fontWeight: 'bold' },
  cardContent: { padding: 10 },
  creatorInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8, backgroundColor: colors.border },
  creatorText: { flex: 1 },
  creatorName: { fontSize: 13, fontWeight: '600', color: colors.text.primary },
  videoStats: { fontSize: 11, color: colors.text.tertiary },
  videoTitle: { fontSize: 14, fontWeight: '500', color: colors.text.primary, marginTop: 4, lineHeight: 18 },
  skeletonCardContainer: {
    width: cardWidth,
    marginBottom: CARD_GAP,
  },
  loadingContainer: { paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 8, fontSize: 14, color: colors.text.secondary },
  noVideosContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  noVideosText: { fontSize: 16, color: colors.text.secondary },
});

// Export both components
export { VideoPlayerModalScreen };
export default React.memo(TipTubeScreen);