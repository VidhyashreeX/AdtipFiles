import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  FlatList,
  Dimensions,
  StatusBar,
  Platform, // Add this import
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import Video from 'react-native-video';
import axios from 'axios';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  withSequence,
  withDelay,
} from 'react-native-reanimated';

// Type declaration for global.ErrorUtils (React Native)
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      ErrorUtils?: {
        getGlobalHandler?: () => ((error: Error, isFatal?: boolean) => void);
        setGlobalHandler?: (handler: (error: Error, isFatal?: boolean) => void) => void;
      };
    }
  }
  // For direct access on global (not globalThis)
  // @ts-ignore
  var ErrorUtils: {
    getGlobalHandler?: () => ((error: Error, isFatal?: boolean) => void);
    setGlobalHandler?: (handler: (error: Error, isFatal?: boolean) => void) => void;
  };
}

import {useTheme} from '../../contexts/ThemeContext';
import {useTabNavigator} from '../../contexts/TabNavigatorContext';
import {useAuth} from '../../contexts/AuthContext';
import ApiService from '../../services/ApiService';
import Header from '../../components/common/Header';
import VideoCardSkeleton from '../../components/skeletons/VideoCardSkeleton';
import RelatedVideoCardSkeleton from '../../components/skeletons/RelatedVideoCardSkeleton';
import MemoizedRelatedVideoCard from '../../components/tiptube/MemoizedRelatedVideoCard';

// Define interfaces (ensure these match your data structure)
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

// Animated Video Card Component to avoid hook order issues
const AnimatedVideoCard = React.memo<{
  video: Video;
  onPress: () => void;
  onPressIn: () => void;
  onPressOut: () => void;
  isSelected: boolean;
  isPreview: boolean;
  styles: any;
  colors: any;
  onNavigateToChannel: () => void;
}>(({ video, onPress, onPressIn, onPressOut, isSelected, isPreview, styles, colors, onNavigateToChannel }) => {
  // Card press animation
  const cardPressAnimation = useSharedValue(1);
  const selectedCardScale = useSharedValue(1);

  // Update animations when selection changes
  useEffect(() => {
    if (isSelected) {
      selectedCardScale.value = withSequence(
        withTiming(0.98, { duration: 150 }),
        withSpring(1, { damping: 12, stiffness: 100 })
      );
    } else {
      // Ensure deselection also animates smoothly
      selectedCardScale.value = withSpring(1, { damping: 15, stiffness: 200 });
    }
  }, [isSelected, selectedCardScale]);

  const cardAnimatedStyle = useAnimatedStyle(() => {
    const scale = isSelected ? selectedCardScale.value : cardPressAnimation.value;
    return {
      transform: [{ scale }],
    };
  });

  const handlePressIn = () => {
    cardPressAnimation.value = withTiming(0.95, { duration: 100 });
    onPressIn();
  };

  const handlePressOut = () => {
    cardPressAnimation.value = withSpring(1, { damping: 15, stiffness: 200 });
    onPressOut();
  };

  return (
    <Animated.View style={[cardAnimatedStyle]}>
      <TouchableOpacity 
        style={styles.videoCard} 
        onPress={onPress} 
        onPressIn={handlePressIn} 
        onPressOut={handlePressOut}
        activeOpacity={0.95} // Subtle feedback
      >
        <View style={styles.thumbnailContainer}>
          {video.price && video.price > 0 && (
            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText}>₹{video.price}</Text>
            </View>
          )}
          {isPreview && video.videoUrl ? (
            <Video 
              source={{uri: video.videoUrl}} 
              style={styles.videoThumbnail} 
              resizeMode="cover" 
              repeat 
              muted 
              paused={!isPreview} 
              playInBackground={false} 
              playWhenInactive={false} 
              ignoreSilentSwitch="obey"
              bufferConfig={{ // Optimized buffer for previews
                minBufferMs: 2000,
                maxBufferMs: 5000,
                bufferForPlaybackMs: 500,
                bufferForPlaybackAfterRebufferMs: 1000
              }}
            />
          ) : (
            <Image 
              source={{uri: video.thumbnail || "https://via.placeholder.com/300x169.png?text=No+Thumbnail"}} 
              style={styles.thumbnailImage} 
              resizeMode="cover" 
            />
          )}
          <View style={styles.durationOverlay}>
            <Text style={styles.durationText}>{formatDuration(video.duration)}</Text>
          </View>
        </View>
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

const TipTubeScreen = () => {
  const {isDarkMode, colors} = useTheme();
  const {contentPaddingBottom} = useTabNavigator();
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  
  const [offset, setOffset] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  
  const [previewingVideoId, setPreviewingVideoId] = useState<number | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Use 'any' to allow calling 'seek' on the ref, or import the correct type from 'react-native-video'
  const videoPlayerRef = useRef<any>(null);

  // Add the missing controlsTimeoutRef
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to format time for progress bar
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const pad = (num: number) => (num < 10 ? '0' + num : num);
    return `${pad(m)}:${pad(s)}`;
  };

  // Toggle controls visibility
  const toggleControlsVisibility = () => setShowControls((prev) => !prev);

  // Toggle mute
  const toggleMute = () => setIsMuted((prev) => !prev);

  // Toggle play/pause
  const togglePlayPause = () => setIsPaused((prev) => !prev);

  // Toggle fullscreen (stub, implement as needed)
  const toggleFullscreen = () => setIsFullscreen((prev) => !prev);

  // Seek video by seconds with proper limits
  const seekVideo = (seconds: number) => {
    if (videoPlayerRef.current && typeof videoPlayerRef.current.seek === 'function') {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      videoPlayerRef.current.seek(newTime);
      setCurrentTime(newTime);
    }
  };

  const {user} = useAuth();
  const navigation = useNavigation<any>();

  const scrollViewRef = useRef<ScrollView>(null);
  const upNextFlatListRef = useRef<FlatList<Video>>(null);

  const [upNextVideos, setUpNextVideos] = useState<Video[]>([]);
  const [loadingUpNext, setLoadingUpNext] = useState(false); 
  const [isVideoReady, setIsVideoReady] = useState(false); // Simplified video readiness state

  const mainListAbortControllerRef = useRef<AbortController | null>(null);

  const modalScale = useSharedValue(0.3);
  const modalOpacity = useSharedValue(0);
  const videoPlayerOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(100);
  const backgroundOpacity = useSharedValue(0);

  const styles = createStyles(colors, isDarkMode);

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

  const renderInitialSkeleton = () => (
    <View style={styles.videoGrid}>{Array(6).fill(0).map((_, index) => <VideoCardSkeleton key={`skeleton-${index}`} />)}</View>
  );

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

  const fetchVideos = useCallback(async (options: { 
    isReset?: boolean, 
    pageToFetch?: number, 
    signal?: AbortSignal,
    apiSearchQuery?: string
  } = {}) => {
    const { 
      isReset = false, 
      pageToFetch = 1, 
      signal,
      apiSearchQuery = ''
    } = options;
    
    try {
      const userIdForApi = user?.id ? user.id : 0;
      const categoryId = categoryToIdMap[selectedCategory] || 0;
      
      const apiRes = await ApiService.getVideos(userIdForApi, categoryId, pageToFetch, apiSearchQuery, signal);
      let newVideosData: Video[] = [];
      if (apiRes && Array.isArray(apiRes.data)) {
        newVideosData = apiRes.data.map(transformVideoData);
      }

      if (signal?.aborted) {
        return;
      }

      if (isReset) {
        const shuffledVideos = shuffleArray(newVideosData);
        setAllVideos(shuffledVideos);
        setFilteredVideos(applyFilter(searchQuery, shuffledVideos));
        setOffset(pageToFetch + 1);
      } else {
        setAllVideos((prevVideos) => {
          const updatedVideos = [...prevVideos, ...newVideosData];
          setFilteredVideos(applyFilter(searchQuery, updatedVideos));
          return updatedVideos;
        });
        if (newVideosData.length > 0) {
          setOffset(pageToFetch + 1);
        }
      }
      setHasMore(newVideosData.length > 0);
    } catch (err: any) {
      if (axios.isCancel(err) || err.name === 'AbortError') {
        console.log("[TipTubeScreen FetchVideos] Request canceled/aborted:", err.message);
      } else {
        console.error("[TipTubeScreen] Failed to fetch videos:", err);
        setHasMore(false);
      }
    }
  }, [selectedCategory, user?.id, transformVideoData, applyFilter, searchQuery]);

  useEffect(() => {
    setFilteredVideos(applyFilter(searchQuery, allVideos));
  }, [searchQuery, allVideos, applyFilter]);

  useEffect(() => {
    mainListAbortControllerRef.current?.abort();
    mainListAbortControllerRef.current = new AbortController();
    const signal = mainListAbortControllerRef.current.signal;

    setInitialLoading(true);
    setAllVideos([]);
    setFilteredVideos([]);
    setHasMore(true);
    setOffset(1);

    fetchVideos({ isReset: true, pageToFetch: 1, signal, apiSearchQuery: '' }).finally(() => {
      if (!signal.aborted) setInitialLoading(false);
    });
    
    return () => {
      mainListAbortControllerRef.current?.abort();
    }
  }, [selectedCategory, fetchVideos]);

  const handleRefresh = useCallback(async () => {
    mainListAbortControllerRef.current?.abort();
    mainListAbortControllerRef.current = new AbortController();
    const signal = mainListAbortControllerRef.current.signal;

    setRefreshing(true);
    setHasMore(true);
    await fetchVideos({ isReset: true, pageToFetch: 1, signal, apiSearchQuery: '' });
    if (!signal.aborted) setRefreshing(false);
  }, [fetchVideos]);

  const handleScroll = useCallback(({nativeEvent}: {nativeEvent: any}) => {
    const {layoutMeasurement, contentOffset, contentSize} = nativeEvent;
    const paddingToBottom = 250;

    if (
      layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom &&
      !initialLoading && !loading && hasMore && !refreshing
    ) {
      setLoading(true); 

      if (!mainListAbortControllerRef.current || mainListAbortControllerRef.current.signal.aborted) {
        mainListAbortControllerRef.current = new AbortController();
      }
      const signal = mainListAbortControllerRef.current.signal;

      fetchVideos({ isReset: false, pageToFetch: offset, signal, apiSearchQuery: '' }).finally(() => {
        if (!signal.aborted) setLoading(false);
      });
    }
  }, [initialLoading, loading, hasMore, refreshing, offset, fetchVideos]);

  // Removed duplicate handleVideoReadyForDisplay declaration to fix redeclaration error

  useEffect(() => {
    if (showPlayerModal && currentVideo && isVideoReady) { // Depend on isVideoReady
      setLoadingUpNext(true);
      const filteredAndShuffled = shuffleArray(allVideos.filter(v => v.id !== currentVideo.id));
      setUpNextVideos(filteredAndShuffled);
      setLoadingUpNext(false);

      contentTranslateY.value = withDelay(100, withSpring(0, { // Reduced delay
        damping: 20,
        stiffness: 100,
      }));
    } else if (!showPlayerModal) {
      setUpNextVideos([]);
      setLoadingUpNext(false);
      // isVideoReady is reset in closePlayer's runOnJS
    }
  }, [showPlayerModal, currentVideo, isVideoReady, allVideos, contentTranslateY]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        mainListAbortControllerRef.current?.abort();
        if (showPlayerModal) {
          // Ensure states are reset if screen loses focus while modal is open
          setIsVideoReady(false); 
        }
      };
    }, [showPlayerModal])
  );

  const openPlayer = (video: Video) => {
    console.log('[TipTubeScreen] Opening player for video:', video.id);
    
    // Reset video states
    setIsVideoReady(false);
    setIsPaused(false);
    setIsMuted(false);
    setCurrentTime(0);
    setDuration(0);
    setShowControls(true);
    setIsFullscreen(false);
    setHasVideoEnded(false); // Reset video ended state
    
    // Clear any existing timeout
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    // Set states immediately
    setSelectedVideoId(video.id);
    setCurrentVideo(video);
    setShowPlayerModal(true);

    // Simple entrance animation - no complex sequencing
    modalOpacity.value = 0;
    modalScale.value = 0.8;
    videoPlayerOpacity.value = 0;
    contentTranslateY.value = 50;
    backgroundOpacity.value = 0;

    // Animate in with simple timing
    modalOpacity.value = withTiming(1, { duration: 250 });
    modalScale.value = withTiming(1, { duration: 250 });
    backgroundOpacity.value = withTiming(1, { duration: 250 });
  };

  // Keep only ONE closePlayer declaration

  // Update the Modal's animated styles to be simpler:
  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ scale: modalScale.value }],
  }));

  const videoPlayerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: videoPlayerOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentTranslateY.value }],
  }));

  // Update the handleVideoReadyForDisplay to be simpler:
  const handleVideoReadyForDisplay = useCallback(() => {
    console.log('[TipTubeScreen] Video ready - starting content animations');
    setIsVideoReady(true);
    
    // Simple fade in for video and content
    videoPlayerOpacity.value = withTiming(1, { duration: 300 });
    contentTranslateY.value = withTiming(0, { duration: 300 });
    
    // Start auto-hide timer when video is ready and playing
    if (!isPaused) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 4000);
    }
  }, [videoPlayerOpacity, contentTranslateY, isPaused]);

  // Simplify the useEffect for up next videos:
  useEffect(() => {
    if (showPlayerModal && currentVideo && isVideoReady) {
      console.log('[TipTubeScreen] Setting up next videos');
      setLoadingUpNext(true);
      
      const filteredAndShuffled = shuffleArray(allVideos.filter(v => v.id !== currentVideo.id));
      setUpNextVideos(filteredAndShuffled);
      setLoadingUpNext(false);
    } else if (!showPlayerModal) {
      // Clean reset when modal closes
      setUpNextVideos([]);
      setLoadingUpNext(false);
    }
  }, [showPlayerModal, currentVideo, isVideoReady, allVideos]);

  const handleCardPressIn = (videoId: number) => {
    setPreviewingVideoId(videoId);
  };

  const handleCardPressOut = () => {
    setPreviewingVideoId(null);
  };

  // Handler to navigate to a channel screen
  const handleNavigateToChannel = (channelId: number | string) => {
    navigation.navigate('ChannelScreen', { channelId });
  };

  // Update renderVideoCard to use enhanced navigation handler
  const renderVideoCard = (video: Video) => {
    return (
      <AnimatedVideoCard
        key={video.id}
        video={video}
        onPress={() => openPlayer(video)}
        onPressIn={() => handleCardPressIn(video.id)}
        onPressOut={handleCardPressOut}
        isSelected={selectedVideoId === video.id}
        isPreview={previewingVideoId === video.id}
        styles={styles}
        colors={colors}
        onNavigateToChannel={() => handleNavigateToChannel(video.channelId)}
      />
    );
  };

  // Add state for video ended
  const [hasVideoEnded, setHasVideoEnded] = useState(false);

  // Update the Video component with onEnd handler:
  // In the Modal section, update the Video component:
                  <Video 
                    key={`video-${currentVideo?.id}-${showPlayerModal}`}
                    source={{uri: currentVideo.videoUrl!}} 
                    style={styles.youtubeVideoPlayer} 
                    controls={false}
                    paused={!showPlayerModal || !isVideoReady || isPaused}
                    resizeMode={isFullscreen ? "cover" : "contain"}
                    onReadyForDisplay={handleVideoReadyForDisplay}
                    onProgress={(data) => {
                      setCurrentTime(data.currentTime);
                      setDuration(data.seekableDuration);
                    }}
                    onError={(error) => {
                      console.error('[TipTubeScreen] Video player error:', error);
                      setIsVideoReady(false);
                    }}
                    onEnd={() => {
                      console.log('[TipTubeScreen] Video ended');
                      setHasVideoEnded(true);
                      setIsPaused(true);
                      setShowControls(true);
                      // Clear auto-hide timeout when video ends
                      if (controlsTimeoutRef.current) {
                        clearTimeout(controlsTimeoutRef.current);
                      }
                    }}
                    repeat={false}
                    playInBackground={false}
                    playWhenInactive={false}
                    reportBandwidth={true}
                    muted={isMuted}
                    bufferConfig={{
                      minBufferMs: 5000,
                      maxBufferMs: 20000,
                      bufferForPlaybackMs: 2500,
                      bufferForPlaybackAfterRebufferMs: 5000
                    }}
                    ref={videoPlayerRef}
                  />


  // Update the center controls to show replay button when video ends:
                    {/* Center Play/Pause Controls */}
                    {showControls && (
                      <View style={styles.youtubeCenterControls}>
                        <TouchableOpacity 
                          style={styles.youtubeSeekButton}
                          onPress={() => seekVideo(-10)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.youtubeSeekIcon}>‹‹</Text>
                          <Text style={styles.youtubeSeekText}>10</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={styles.youtubePlayPauseButton}
                          onPress={hasVideoEnded ? replayVideo : togglePlayPause}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.youtubePlayPauseIcon}>
                            {hasVideoEnded ? '↻' : (isPaused ? '▷' : '❚❚')}
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={styles.youtubeSeekButton}
                          onPress={() => seekVideo(10)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.youtubeSeekIcon}>››</Text>
                          <Text style={styles.youtubeSeekText}>10</Text>
                        </TouchableOpacity>
                      </View>
                    )}

  // Helper to show controls temporarily (e.g., after replay)
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);
  }, []);

  // Add replay functionality
  const replayVideo = useCallback(() => {
    if (videoPlayerRef.current && typeof videoPlayerRef.current.seek === 'function') {
      videoPlayerRef.current.seek(0);
      setCurrentTime(0);
      setIsPaused(false);
      setHasVideoEnded(false);
      showControlsTemporarily();
    }
  }, [showControlsTemporarily]);

  // Update closePlayer to clear timeout
  const closePlayer = useCallback(() => {
    if (!showPlayerModal) {
      return;
    }

    console.log('[TipTubeScreen] Starting simple closePlayer animation');

    // Clear controls timeout
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = null;
    }

    // Immediate state cleanup to prevent crashes
    setShowPlayerModal(false);
    setCurrentVideo(null);
    setIsVideoReady(false);
    setUpNextVideos([]);
    setLoadingUpNext(false);
    setSelectedVideoId(null);
    setIsFullscreen(false); // Reset fullscreen state
    setShowControls(true); // Reset controls visibility
    setHasVideoEnded(false); // Reset video ended state

    // Simple fade out animation (no complex sequencing)
    modalOpacity.value = withTiming(0, { 
      duration: 200 
    });
    
    // Reset all animation values immediately for next use
    setTimeout(() => {
      modalScale.value = 0.3;
      videoPlayerOpacity.value = 0;
      contentTranslateY.value = 100;
      backgroundOpacity.value = 0;
    }, 250);

  }, [
    showPlayerModal,
    modalOpacity,
    modalScale,
    videoPlayerOpacity, 
    contentTranslateY,
    backgroundOpacity
  ]);

  // Add useEffect to handle cleanup on component unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Update renderRelatedVideoItem to reset video ended state when switching videos
  const renderRelatedVideoItem = useCallback(({item}: {item: Video}) => (
    <MemoizedRelatedVideoCard 
      item={item} 
      onPress={() => {
        setIsVideoReady(false); // Reset for new video
        setHasVideoEnded(false); // Reset video ended state
        setCurrentVideo(item);
        setSelectedVideoId(item.id);
        upNextFlatListRef.current?.scrollToOffset({ animated: false, offset: 0 });
        
        videoPlayerOpacity.value = 0; // Reset animation
        contentTranslateY.value = 100; // Reset animation
        
        // Clear existing timeout
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      }} 
    />
  ), [videoPlayerOpacity, contentTranslateY]);

  // Handler for Header search query change
  const handleHeaderQueryChange = (query: string) => {
    setSearchQuery(query);
  };

  // Handler for Header search submit (API search)
  const handleHeaderSearchAPISubmit = (query: string) => {
    setSearchQuery(query);
    // Optionally, you can trigger a refresh or API call here if needed
    // handleRefresh(); // Uncomment if you want to refresh on submit
  };

  // Move the loading skeleton to after all hooks are declared
  if (initialLoading && !refreshing) {
    return (
      <View style={styles.container}>
        <Header 
          title="TipTube" 
          showTipShortsIcon 
          showSearch={true}
          onSearchQueryChange={handleHeaderQueryChange}
          onSearchSubmit={handleHeaderSearchAPISubmit}
        />
        <ScrollView contentContainerStyle={[styles.scrollViewContent, {paddingBottom: contentPaddingBottom}]} showsVerticalScrollIndicator={false}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroller}>
            {categories.map((cat) => (
              <TouchableOpacity key={cat.name} style={styles.categoryButton} disabled={true}>
                <Text style={styles.categoryButtonText}>{cat.icon} {cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {renderInitialSkeleton()}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        title="TipTube" 
        showTipShortsIcon 
        showSearch={true}
        onSearchQueryChange={handleHeaderQueryChange}
        onSearchSubmit={handleHeaderSearchAPISubmit}
      />
      <ScrollView
        ref={scrollViewRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.scrollViewContent, {paddingBottom: contentPaddingBottom}]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroller}>
          {categories.map((cat) => (
            <TouchableOpacity 
              key={cat.name} 
              onPress={() => setSelectedCategory(cat.name)} 
              style={[styles.categoryButton, selectedCategory === cat.name && styles.selectedCategoryButton]}
            >
              <Text style={[styles.categoryButtonText, selectedCategory === cat.name && styles.selectedCategoryButtonText]}>
                {cat.icon} {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {filteredVideos.length === 0 && !loading && !refreshing && !initialLoading ? (
          <View style={styles.noVideosContainer}>
            <Text style={[styles.noVideosText, {color: colors.text.secondary}]}>
              {searchQuery ? `No videos found for "${searchQuery}".` : "No videos found."}
            </Text>
            {searchQuery && (
              <Text style={[styles.noVideosText, {fontSize: 14, color: colors.text.tertiary, marginTop: 8}]}>
                Try a different search term.
              </Text>
            )}
          </View>
        ) : filteredVideos.length === 0 && loading && !refreshing && !initialLoading ? (
          <View style={[styles.loadingContainer, {flex: 1, justifyContent: 'center', paddingTop: 50}]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, {color: colors.text.secondary}]}>Loading videos...</Text>
          </View>
        ) : (
          <View style={styles.videoGrid}>
            {filteredVideos.map(renderVideoCard)}
          </View>
        )}
        
        {loading && filteredVideos.length > 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, {color: colors.text.secondary}]}>Loading more...</Text>
          </View>
        )}
      </ScrollView>
      
      {/* Video Modal - YouTube-style Full Screen */}
      <Modal 
        visible={showPlayerModal} 
        animationType="none"
        presentationStyle="fullScreen"
        onRequestClose={closePlayer}
        transparent={false}
        statusBarTranslucent={true}
      >
        <StatusBar backgroundColor="#000" barStyle="light-content" translucent={true} />
        
        {/* YouTube-style full screen layout */}
        <View style={styles.youtubeModalContainer}>
          <Animated.View style={[styles.youtubeModalContent, modalAnimatedStyle]}>
            {currentVideo ? (
              <>
                {/* Video Player Section - Full width, no padding */}
                <Animated.View style={[
                  styles.youtubeVideoContainer, 
                  videoPlayerAnimatedStyle,
                  // Apply fullscreen styles dynamically
                  isFullscreen && {
                    aspectRatio: undefined,
                    height: '100%',
                  }
                ]}>
                  {currentVideo ? (
                    <Video 
                      key={`video-${currentVideo.id}-${showPlayerModal}`}
                      source={{uri: currentVideo.videoUrl ?? ''}} 
                      style={styles.youtubeVideoPlayer} 
                      controls={false}
                      paused={!showPlayerModal || !isVideoReady || isPaused}
                      resizeMode={isFullscreen ? "cover" : "contain"} // Dynamic resize mode
                      onReadyForDisplay={handleVideoReadyForDisplay}
                      onProgress={(data) => {
                        setCurrentTime(data.currentTime);
                        setDuration(data.seekableDuration);
                      }}
                      onError={(error) => {
                        console.error('[TipTubeScreen] Video player error:', error);
                        setIsVideoReady(false);
                      }}
                      onEnd={() => {
                        console.log('[TipTubeScreen] Video ended');
                        setHasVideoEnded(true);
                        setIsPaused(true);
                        setShowControls(true);
                        // Clear auto-hide timeout when video ends
                        if (controlsTimeoutRef.current) {
                          clearTimeout(controlsTimeoutRef.current);
                        }
                      }}
                      repeat={false}
                      playInBackground={false}
                      playWhenInactive={false}
                      reportBandwidth={true}
                      muted={isMuted}
                      bufferConfig={{
                        minBufferMs: 5000,
                        maxBufferMs: 20000,
                        bufferForPlaybackMs: 2500,
                        bufferForPlaybackAfterRebufferMs: 5000
                      }}
                      ref={videoPlayerRef}
                    />
                  ) : null}
                  
                  {/* Custom YouTube-style controls overlay */}
                  <TouchableOpacity 
                    style={styles.youtubeVideoTouchArea}
                    onPress={toggleControlsVisibility}
                    activeOpacity={1}
                  >
                    {/* Top Controls Bar - NO background overlay */}
                    {showControls && (
                      <View style={styles.youtubeTopControls}>
                        <TouchableOpacity 
                          style={styles.youtubeBackButton}
                          onPress={closePlayer}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.youtubeBackIcon}>←</Text>
                        </TouchableOpacity>
                        
                        <View style={styles.youtubeTopRightControls}>
                          <TouchableOpacity 
                            style={styles.youtubeControlButton}
                            onPress={toggleMute}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.youtubeControlIcon}>
                              {isMuted ? '🔇' : '♪'}
                            </Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={styles.youtubeControlButton}
                            onPress={toggleFullscreen}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.youtubeControlIcon}>
                              {isFullscreen ? '⛶' : '⛶'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                    
                    {/* Center Play/Pause Controls */}
                    {showControls && (
                      <View style={styles.youtubeCenterControls}>
                        <TouchableOpacity 
                          style={styles.youtubeSeekButton}
                          onPress={() => seekVideo(-10)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.youtubeSeekIcon}>‹‹</Text>
                          <Text style={styles.youtubeSeekText}>10</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={styles.youtubePlayPauseButton}
                          onPress={hasVideoEnded ? replayVideo : togglePlayPause}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.youtubePlayPauseIcon}>
                            {hasVideoEnded ? '↻' : (isPaused ? '▷' : '❚❚')}
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={styles.youtubeSeekButton}
                          onPress={() => seekVideo(10)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.youtubeSeekIcon}>››</Text>
                          <Text style={styles.youtubeSeekText}>10</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    {/* Bottom Progress Bar */}
                    {showControls && (
                      <View style={styles.youtubeBottomControls}>
                        <View style={styles.youtubeProgressContainer}>
                          <Text style={styles.youtubeTimeText}>
                            {formatTime(currentTime)}
                          </Text>
                          
                          <View style={styles.youtubeProgressBarContainer}>
                            <View style={styles.youtubeProgressBarBackground} />
                            <View 
                              style={[
                                styles.youtubeProgressBar, 
                                { width: `${(currentTime / duration) * 100 || 0}%` }
                              ]} 
                            />
                          </View>
                          
                          <Text style={styles.youtubeTimeText}>
                            {formatTime(duration)}
                          </Text>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>

                  {!isVideoReady && (
                    <View style={styles.youtubeLoadingOverlay}>
                      <ActivityIndicator size="large" color="#fff" />
                    </View>
                  )}
                </Animated.View>
                
                {/* Content Section - Hide when fullscreen */}
                {!isFullscreen && (
                  <Animated.View style={[styles.youtubeContentSection, contentAnimatedStyle]}>
                    <ScrollView 
                      style={styles.youtubeScrollContent}
                      showsVerticalScrollIndicator={false}
                      bounces={false}
                    >
                      {/* Video Info Section */}
                      <View style={styles.youtubeVideoInfo}>
                        <Text style={styles.youtubeVideoTitle} numberOfLines={2}>
                          {currentVideo.title}
                        </Text>
                        
                        <View style={styles.youtubeVideoMeta}>
                          <Text style={styles.youtubeVideoStats}>
                            {currentVideo.views.toLocaleString()} views • {currentVideo.posted}
                          </Text>
                        </View>
                        
                        {/* Action Buttons Row */}
                        <View style={styles.youtubeActionRow}>
                          <TouchableOpacity style={styles.youtubeActionButton} activeOpacity={0.7}>
                            <Text style={styles.youtubeActionIcon}>👍</Text>
                            <Text style={styles.youtubeActionText}>14K</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity style={styles.youtubeActionButton} activeOpacity={0.7}>
                            <Text style={styles.youtubeActionIcon}>👎</Text>
                            <Text style={styles.youtubeActionText}>Dislike</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity style={styles.youtubeActionButton} activeOpacity={0.7}>
                            <Text style={styles.youtubeActionIcon}>↗</Text>
                            <Text style={styles.youtubeActionText}>Share</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity style={styles.youtubeActionButton} activeOpacity={0.7}>
                            <Text style={styles.youtubeActionIcon}>↓</Text>
                            <Text style={styles.youtubeActionText}>Download</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity style={styles.youtubeActionButton} activeOpacity={0.7}>
                            <Text style={styles.youtubeActionIcon}>...</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      
                      {/* Channel Section */}
                      <View style={styles.youtubeChannelSection}>
                        <View style={styles.youtubeChannelInfo}>
                          <Image 
                            source={{uri: currentVideo.avatar || "https://via.placeholder.com/40.png?text=N/A"}} 
                            style={styles.youtubeChannelAvatar} 
                          />
                          <View style={styles.youtubeChannelText}>
                            <TouchableOpacity 
                              onPress={() => handleNavigateToChannel(currentVideo.channelId)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.youtubeChannelName}>
                                {currentVideo.creatorName}
                              </Text>
                              <Text style={styles.youtubeChannelSubs}>1.67 lakh subscribers</Text>
                            </TouchableOpacity>
                          </View>
                          <TouchableOpacity style={styles.youtubeSubscribeButton} activeOpacity={0.8}>
                            <Text style={styles.youtubeSubscribeText}>Subscribe</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      
                      {/* Comments Section */}
                      <View style={styles.youtubeCommentsSection}>
                        <View style={styles.youtubeCommentsHeader}>
                          <Text style={styles.youtubeCommentsTitle}>Comments</Text>
                          <Text style={styles.youtubeCommentsCount}>489</Text>
                        </View>
                        
                        {/* Sample Comment */}
                        <View style={styles.youtubeComment}>
                          <View style={styles.youtubeCommentAvatar}>
                            <Text style={styles.youtubeCommentAvatarText}>H</Text>
                          </View>
                          <View style={styles.youtubeCommentContent}>
                            <Text style={styles.youtubeCommentText}>
                              I have a phd in youtube.
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Up Next Section */}
                      <View style={styles.youtubeUpNextSection}>
                        <Text style={styles.youtubeUpNextTitle}>Up next</Text>
                        
                        {isVideoReady && loadingUpNext && upNextVideos.length === 0 ? (
                          <View>
                            {Array(3).fill(0).map((_, i) => (
                              <RelatedVideoCardSkeleton key={`upnext-skel-${i}`} />
                            ))}
                          </View>
                        ) : (
                          <FlatList
                            ref={upNextFlatListRef}
                            data={upNextVideos.slice(0, 10)} // Limit to 10 videos like YouTube
                            renderItem={({item}) => (
                              <TouchableOpacity 
                                style={styles.youtubeUpNextItem}
                                onPress={() => {
                                  setIsVideoReady(false);
                                  setCurrentVideo(item);
                                  setSelectedVideoId(item.id);
                                  upNextFlatListRef.current?.scrollToOffset({ animated: false, offset: 0 });
                                  videoPlayerOpacity.value = 0;
                                  contentTranslateY.value = 100;
                                }}
                                activeOpacity={0.7}
                              >
                                <Image 
                                  source={{uri: item.thumbnail || "https://via.placeholder.com/168x94.png"}}
                                  style={styles.youtubeUpNextThumbnail}
                                />
                                <View style={styles.youtubeUpNextInfo}>
                                  <Text style={styles.youtubeUpNextTitle} numberOfLines={2}>
                                    {item.title}
                                  </Text>
                                  <Text style={styles.youtubeUpNextChannel} numberOfLines={1}>
                                    {item.creatorName}
                                  </Text>
                                  <Text style={styles.youtubeUpNextViews}>
                                    {item.views.toLocaleString()} views
                                  </Text>
                                </View>
                                <TouchableOpacity style={styles.youtubeUpNextMenu}>
                                  <Text style={styles.youtubeUpNextMenuIcon}>⋮</Text>
                                </TouchableOpacity>
                              </TouchableOpacity>
                            )}
                            keyExtractor={(item) => `upnext-${item.id.toString()}`}
                            scrollEnabled={false} // Let parent ScrollView handle scrolling
                            showsVerticalScrollIndicator={false}
                          />
                        )}
                      </View>
                      
                      {/* Bottom spacing */}
                      <View style={styles.youtubeBottomSpacing} />
                    </ScrollView>
                  </Animated.View>
                )}
              </>
            ) : (
              <View style={styles.youtubeLoadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.youtubeLoadingText, {color: colors.text.primary}]}>
                  Loading...
                </Text>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const screenWidth = Dimensions.get('window').width;
// const screenHeight = Dimensions.get('window').height; // Not used
const CARD_MARGIN_HORIZONTAL = 16;
const CARD_GAP = 16;
const NUM_COLUMNS = 2;
const cardWidth = (screenWidth - CARD_MARGIN_HORIZONTAL * 2 - CARD_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

const createStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollViewContent: { paddingHorizontal: CARD_MARGIN_HORIZONTAL, paddingTop: 16, },
  categoryScroller: { marginBottom: 16, paddingHorizontal: 0, marginLeft: -CARD_MARGIN_HORIZONTAL, marginRight: -CARD_MARGIN_HORIZONTAL, paddingLeft: CARD_MARGIN_HORIZONTAL },
  categoryButton: { paddingVertical: 8, paddingHorizontal: 16, marginRight: 8, borderRadius: 20, backgroundColor: colors.cardSecondary, borderWidth: 1, borderColor: colors.border },
  selectedCategoryButton: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryButtonText: { fontSize: 14, fontWeight: '600', color: colors.text.secondary },
  selectedCategoryButtonText: { color: colors.white },
  videoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  videoCard: { width: cardWidth, marginBottom: CARD_GAP, backgroundColor: colors.card, borderRadius: 12, shadowColor: colors.shadow, shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3, overflow: 'hidden' },
  thumbnailContainer: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.border },
  thumbnailImage: { flex: 1 }, videoThumbnail: { flex: 1 },
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
  loadingContainer: { paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 8, fontSize: 14, color: colors.text.secondary },
  noVideosContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  noVideosText: { fontSize: 16, color: colors.text.secondary },
  
  // New full screen modal styles
  fullScreenModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 16 : 0, // Only notification bar padding
  },
  
  fullScreenModalContent: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  videoPlayerContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainVideoPlayer: { 
    width: '100%', 
    height: '100%',
  },
  videoLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  videoLoadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  mainVideoInfo: { 
    padding: 16,
    backgroundColor: colors.background,
  },
  mainVideoTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text.primary, marginBottom: 8 },
  mainVideoCreatorSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  mainVideoAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: colors.border },
  mainVideoCreatorText: { flex: 1 },
  mainVideoCreatorName: { fontSize: 16, fontWeight: '600', color: colors.text.primary },
  mainVideoStats: { fontSize: 13, color: colors.text.tertiary },
  subscribeButton: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  subscribeButtonText: { color: colors.white, fontWeight: 'bold', fontSize: 14 },
  backButton: { 
    alignItems: 'center', 
    paddingVertical: 14, 
    backgroundColor: colors.cardSecondary, 
    borderRadius: 10, 
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: { 
    fontSize: 16, 
    color: colors.primary, 
    fontWeight: '600',
  },
  relatedVideosSection: { 
    flex: 1, 
    paddingHorizontal: 16, 
    paddingTop: 8,
    backgroundColor: colors.background,
  },
  relatedVideosTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text.primary, marginBottom: 12 },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  
  // YouTube-style modal styles - Updated to start below notification bar
  youtubeModalContainer: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44, // Add proper top padding for notification bar
  },
  
  youtubeModalContent: {
    flex: 1,
    backgroundColor: '#000',
  },
  
  youtubeVideoContainer: {
    width: '100%',
    aspectRatio: 16 / 9, // Fixed aspect ratio - will be overridden by style prop when fullscreen
    backgroundColor: '#000',
    position: 'relative',
  },
  
  youtubeVideoPlayer: {
    width: '100%',
    height: '100%',
  },
  
  youtubeControlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'transparent', // Changed from 'rgba(0,0,0,0.3)' to 'transparent'
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  
  youtubeBackButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', // Slightly more opaque for visibility
    borderRadius: 20,
  },
  
  youtubeBackIcon: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  
  youtubeLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  
  youtubeContentSection: {
    flex: 1,
    backgroundColor: isDarkMode ? '#0f0f0f' : '#fff',
  },
  
  youtubeScrollContent: {
    flex: 1,
  },
  
  youtubeVideoInfo: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: isDarkMode ? '#272727' : '#e0e0e0',
  },
  
  youtubeVideoTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: isDarkMode ? '#fff' : '#0f0f0f',
    lineHeight: 22,
    marginBottom: 4,
  },
  
  youtubeVideoMeta: {
    marginBottom: 12,
  },
  
  youtubeVideoStats: {
    fontSize: 14,
    color: isDarkMode ? '#aaa' : '#606060',
  },
  
  youtubeActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  youtubeActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  
  youtubeActionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  
  youtubeActionText: {
    fontSize: 12,
    color: isDarkMode ? '#aaa' : '#606060',
    fontWeight: '500',
  },
  
  youtubeChannelSection: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 4,
    borderBottomColor: isDarkMode ? '#272727' : '#e0e0e0',
  },
  
  youtubeChannelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  youtubeChannelAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  
  youtubeChannelText: {
    flex: 1,
  },
  
  youtubeChannelName: {
    fontSize: 14,
    fontWeight: '500',
    color: isDarkMode ? '#fff' : '#0f0f0f',
    marginBottom: 2,
  },
  
  youtubeChannelSubs: {
    fontSize: 12,
    color: isDarkMode ? '#aaa' : '#606060',
  },
  
  youtubeSubscribeButton: {
    backgroundColor: isDarkMode ? '#fff' : '#0f0f0f',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  
  youtubeSubscribeText: {
    color: isDarkMode ? '#0f0f0f' : '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  
  youtubeCommentsSection: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderBottomWidth: 4,
    borderBottomColor: isDarkMode ? '#272727' : '#e0e0e0',
  },
  
  youtubeCommentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  youtubeCommentsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: isDarkMode ? '#fff' : '#0f0f0f',
    marginRight: 8,
  },
  
  youtubeCommentsCount: {
    fontSize: 14,
    color: isDarkMode ? '#aaa' : '#606060',
  },
  
  youtubeComment: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  
  youtubeCommentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff6b35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  
  youtubeCommentAvatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  youtubeCommentContent: {
    flex: 1,
  },
  
  youtubeCommentText: {
    fontSize: 14,
    color: isDarkMode ? '#fff' : '#0f0f0f',
    lineHeight: 20,
  },
  
  youtubeUpNextSection: {
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  
  youtubeUpNextTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: isDarkMode ? '#fff' : '#0f0f0f',
    marginBottom: 12,
  },
  
  youtubeUpNextItem: {
    flexDirection: 'row',
    paddingVertical: 8,
    alignItems: 'flex-start',
  },
  
  youtubeUpNextThumbnail: {
    width: 168,
    height: 94,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: isDarkMode ? '#272727' : '#f0f0f0',
  },
  
  youtubeUpNextInfo: {
    flex: 1,
    paddingRight: 8,
  },
  
  youtubeUpNextVideoTitle: {
    fontSize: 14,
    color: isDarkMode ? '#fff' : '#0f0f0f',
    lineHeight: 20,
    marginBottom: 4,
  },
  
  youtubeUpNextChannel: {
    fontSize: 12,
    color: isDarkMode ? '#aaa' : '#606060',
    marginBottom: 2,
  },
  
  youtubeUpNextViews: {
    fontSize: 12,
    color: isDarkMode ? '#aaa' : '#606060',
  },
  
  youtubeUpNextMenu: {
    padding: 4,
  },
  
  youtubeUpNextMenuIcon: {
    fontSize: 16,
    color: isDarkMode ? '#aaa' : '#606060',
  },
  
  youtubeBottomSpacing: {
    height: 32,
  },
  
  youtubeLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f0f',
  },
  
  youtubeLoadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  
  // Remove the old youtubeControlsOverlay style and add these new ones:
  youtubeVideoTouchArea: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  
  youtubeTopControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: 'transparent', // Changed from 'rgba(0,0,0,0.3)' to 'transparent'
  },
  
  youtubeTopRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  youtubeControlButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', // Slightly more opaque for visibility
    borderRadius: 20,
    marginLeft: 8,
  },
  
  youtubeControlIcon: {
    fontSize: 18, // Reduced from 20 for cleaner look
    color: '#fff',
    textAlign: 'center',
  },
  
  youtubeCenterControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  
  youtubeSeekButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)', // Slightly more opaque
    borderRadius: 30,
    marginHorizontal: 20,
  },
  
  youtubeSeekIcon: {
    fontSize: 20, // Clean double chevrons
    color: '#fff',
    fontWeight: '300', // Lighter weight for minimalistic look
    textAlign: 'center',
  },
  
  youtubeSeekText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500', // Slightly bolder for readability
    marginTop: 2,
    textAlign: 'center',
  },
  
  youtubePlayPauseButton: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)', // More opaque for main control
    borderRadius: 40,
  },
  
  youtubePlayPauseIcon: {
    fontSize: 28, // Reduced from 32 for cleaner proportions
    color: '#fff',
    fontWeight: '300', // Lighter weight
    textAlign: 'center',
  },
  
  youtubeBottomControls: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.1)', // Much lighter shade
  },
  
  youtubeProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  youtubeTimeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'center',
  },
  
  youtubeProgressBarContainer: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginHorizontal: 12,
    position: 'relative',
  },
  
  youtubeProgressBarBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  
  youtubeProgressBar: {
    height: '100%',
    backgroundColor: '#ff0000',
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    top: 0,
  },
});

export default React.memo(TipTubeScreen);