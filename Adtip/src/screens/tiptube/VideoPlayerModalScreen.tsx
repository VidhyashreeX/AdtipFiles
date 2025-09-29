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
  Image,
  Share,
} from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import Video, { VideoRef } from 'react-native-video';
import Orientation from 'react-native-orientation-locker';
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
import { Heart, Share as ShareIcon } from 'lucide-react-native';

import { useTheme } from '../../contexts/ThemeContext';
import MemoizedRelatedVideoCard from '../../components/tiptube/MemoizedRelatedVideoCard';
import VideoCommentsModal from '../../components/tiptube/VideoCommentsModal';
import VideoPlayerChannelSection from '../../components/tiptube/VideoPlayerChannelSection';
import { createSecureVideoSource } from '../../utils/mediaUtils';
import ApiService from '../../services/ApiService';
import { useAuth } from '../../contexts/AuthContext';
import { useCommentCount } from '../../hooks/useComments';
import { OrientationManager } from '../../utils/OrientationUtils';
import shareService from '../../services/ShareService';
import { getSetting } from '../../utils/settingsStorage';

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
  const { user } = useAuth ? useAuth() : { user: null };

  const [isVideoReady, setIsVideoReady] = useState(false);
  const [videoSource, setVideoSource] = useState<any>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoPlayerRef = useRef<VideoRef | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [isVideoLiked, setIsVideoLiked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRotationEnabled, setAutoRotationEnabled] = useState(true);
  const [isVideoPaused, setIsVideoPaused] = useState(false);

  // Get comment count for preview
  const { data: commentCount = 0 } = useCommentCount({ videoId: video.id });

  // Load secure video source
  useEffect(() => {
    const loadVideoSource = async () => {
      try {
        setVideoError(null);
        const secureSource = await createSecureVideoSource(video.videoUrl);
        console.log('[VideoPlayerModal] Loading video source:', {
          originalUrl: video.videoUrl,
          secureSource: secureSource,
        });
        setVideoSource(secureSource);
      } catch (error) {
        console.error('[VideoPlayerModal] Failed to create secure video source:', error);
        setVideoError('Failed to load video source');
      }
    };

    loadVideoSource();
  }, [video.videoUrl]);

  // Load auto-rotation setting from storage
  useEffect(() => {
    const loadAutoRotationSetting = async () => {
      try {
        const autoRotation = await getSetting('AUTO_ROTATION', true);
        setAutoRotationEnabled(autoRotation);
        console.log('[VideoPlayerModal] Auto-rotation setting loaded:', autoRotation);
      } catch (error) {
        console.error('[VideoPlayerModal] Error loading auto-rotation setting:', error);
      }
    };

    loadAutoRotationSetting();
  }, []);

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
  // Lock orientation for media screen while mounted
  useEffect(() => {
    OrientationManager.unlockAllOrientations();
    
    return () => {
      OrientationManager.lockToPortrait();
    };
  }, []);

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

  // Handle orientation changes for auto-rotation
  useEffect(() => {
    if (!autoRotationEnabled) return;

    if (isFullscreen) {
      console.log('[VideoPlayerModal] Switching to landscape mode');
      Orientation.lockToLandscape();
    } else {
      console.log('[VideoPlayerModal] Switching to portrait mode');
      Orientation.lockToPortrait();
    }

    // Cleanup: Always return to portrait when component unmounts
    return () => {
      console.log('[VideoPlayerModal] Component unmounting - returning to portrait');
      Orientation.lockToPortrait();
    };
  }, [isFullscreen, autoRotationEnabled]);

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

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    console.log('[VideoPlayerModal] Toggling fullscreen:', !isFullscreen);
    setIsFullscreen(prev => !prev);
  }, [isFullscreen]);

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

  // Handle liking the video
  const handleLikeVideo = useCallback(async () => {
    if (!user?.id) return;
    try {
      setIsVideoLiked((prev) => !prev);
      await ApiService.saveVideoLike(Number(video.id), Number(user?.id), isVideoLiked ? 0 : 1, Number(video.channelId));
    } catch (error) {
      console.error('[VideoPlayerModal] Error liking video:', error);
    }
  }, [user?.id, video?.id, video?.channelId, isVideoLiked]);

  // Handle sharing the video using ShareService
  const handleShareVideo = useCallback(async () => {
    try {
      // Use ShareService for proper deep link generation
      await shareService.shareVideo(video.id, video.title, {
        useUniversalLink: true,
        includeAppName: true
      });

      console.log('[VideoPlayerModal] Video shared successfully');
    } catch (error) {
      console.error('[VideoPlayerModal] Error sharing video:', error);
      // Fallback to basic share
      try {
        const shareMessage = `Check out this video: ${video.title}\n\nhttps://adtip.in/video/${video.id}`;
        await Share.share({
          message: shareMessage,
          title: video.title,
        });
      } catch (fallbackError) {
        console.error('[VideoPlayerModal] Fallback share also failed:', fallbackError);
      }
    }
  }, [video.id, video.title]);



  // Handle navigation to channel from channel section
  const handleNavigateToChannelFromSection = useCallback(() => {
    if (video?.channelId) {
      // Pause the video before navigating to channel
      setIsVideoPaused(true);
      
      navigation.navigate('Channel', {
        channelId: String(video.channelId),
        channelData: {
          channelId: String(video.channelId),
          channelName: video.creatorName,
          profileImage: video.avatar,
          isVerified: video.isVerified || false,
          createdBy: typeof video.channelId === 'number' ? video.channelId : parseInt(String(video.channelId))
        }
      });
    }
  }, [navigation, video?.channelId, video?.creatorName, video?.avatar, video?.isVerified]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <StatusBar backgroundColor="transparent" barStyle="light-content" translucent />

      {/* Fixed Backdrop - Prevents white flash */}
      <Animated.View style={[StyleSheet.absoluteFillObject, backdropStyle]} />

      {/* Content Layer */}
      <Animated.View style={[{ flex: 1 }, contentStyle]}>
        {/* Video Player */}        <GestureDetector gesture={dragGesture}>
          <View style={styles.videoContainer}>
            {videoSource && !videoError ? (
              <>
                <Video
                  key={video.id}
                  source={videoSource}
                  style={StyleSheet.absoluteFillObject}
                  controls={true}
                  paused={isVideoPaused}
                  resizeMode="contain"
                  onReadyForDisplay={() => setIsVideoReady(true)}
                  onError={(error) => {
                    console.error('[VideoPlayerModal] Video playback error:', error);
                    console.log('[VideoPlayerModal] Switching to portrait mode');
                    setVideoError('Video playback failed. Please check your internet connection.');
                    // Try to switch to portrait mode on error
                    if (isFullscreen) {
                      setIsFullscreen(false);
                    }
                  }}
                  onLoadStart={() => {
                    console.log('[VideoPlayerModal] Video loading started');
                    setIsVideoReady(false);
                  }}
                  onLoad={(data) => {
                    console.log('[VideoPlayerModal] Video loaded successfully:', data);
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

                {/* Fullscreen Toggle Button */}
                {autoRotationEnabled && (
                  <TouchableOpacity
                    style={styles.fullscreenButton}
                    onPress={toggleFullscreen}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.fullscreenButtonText}>
                      {isFullscreen ? '⤢' : '⤡'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View style={styles.loadingOverlay}>
                {videoError ? (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: '#fff', textAlign: 'center', marginBottom: 16 }}>
                      {videoError}
                    </Text>
                    <TouchableOpacity
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.3)',
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 8,
                      }}
                      onPress={() => {
                        setVideoError(null);
                        // Retry loading
                        const retryLoad = async () => {
                          try {
                            const secureSource = await createSecureVideoSource(video.videoUrl);
                            setVideoSource(secureSource);
                          } catch (error) {
                            setVideoError('Failed to load video source');
                          }
                        };
                        retryLoad();
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <ActivityIndicator size="large" color="#fff" />
                )}
              </View>
            )}

            {!isVideoReady && !videoError && videoSource && (
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
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={true}
            bounces={true}
            scrollEventThrottle={16}
          >
            <View style={styles.videoInfo}>
              <Text style={styles.videoTitle} numberOfLines={2}>
                {video.title}
              </Text>
              <View style={styles.videoMeta}>
                <Text style={styles.videoStats}>
                  {(video.views || 0).toLocaleString()} views • {video.posted}
                </Text>
              </View>


            </View>

            {/* Channel Section - YouTube Style */}
            <VideoPlayerChannelSection
              video={{
                id: video.id,
                channelId: video.channelId,
                creatorName: video.creatorName,
                avatar: video.avatar,
                isVerified: video.isVerified,
              }}
              onNavigateToChannel={handleNavigateToChannelFromSection}
              onSubscribe={() => {
                // VideoPlayerChannelSection handles its own follow status
                console.log('[VideoPlayerModal] Channel follow status updated via VideoPlayerChannelSection');
              }}
            />

            {/* Action Buttons Section */}
            <View style={styles.actionButtonsContainer}>
              <View style={styles.actionButtonsRow}>
                {/* Like Button */}
                <TouchableOpacity onPress={handleLikeVideo} style={styles.actionButton}>
                  <View style={styles.actionButtonContent}>
                    <Heart
                      size={20}
                      color={isVideoLiked ? '#e53935' : colors.text.secondary}
                      fill={isVideoLiked ? '#e53935' : 'transparent'}
                    />
                    <Text style={[styles.actionButtonText, isVideoLiked ? styles.liked : styles.notLiked]}>
                      {isVideoLiked ? 'Liked' : 'Like'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Share Button */}
                <TouchableOpacity onPress={handleShareVideo} style={styles.actionButton}>
                  <View style={styles.actionButtonContent}>
                    <ShareIcon
                      size={20}
                      color={colors.text.secondary}
                    />
                    <Text style={[styles.actionButtonText, styles.notLiked]}>
                      Share
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Comments Preview Section */}
            <TouchableOpacity
              onPress={() => setShowComments(true)}
              style={styles.commentsPreviewContainer}
            >
              <Text style={styles.commentsPreviewTitle}>
                Comments {commentCount > 0 && `• ${commentCount}`}
              </Text>
              <Text style={styles.commentsPreviewSubtitle}>
                {commentCount > 0 ? 'Tap to view all comments' : 'Be the first to comment'}
              </Text>
            </TouchableOpacity>

            {/* Up next section - now below comments */}
            <View style={styles.upNextSection}>
              <Text style={styles.upNextTitle}>Up next</Text>
              {upNextVideos && upNextVideos.length > 0 ? (
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
              ) : (
                <Text style={{ color: '#888', textAlign: 'center', marginVertical: 16 }}>No up next videos.</Text>
              )}
            </View>
          </ScrollView>
        </View>

        {/* Reddit-style Video Comments Modal */}
        {video?.id && (
          <VideoCommentsModal
            visible={showComments}
            onClose={() => setShowComments(false)}
            videoId={Number(video.id)}
            userId={user?.id ? Number(user.id) : 0}
          />
        )}
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
  commentCard: {
    backgroundColor: colors.cardSecondary,
    borderRadius: 12,
    marginHorizontal: 12,
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: isDarkMode ? '#272727' : '#e0e0e0',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    minWidth: 80,
  },
  actionButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  liked: {
    color: '#e53935',
  },
  notLiked: {
    color: colors.text.secondary,
  },
  commentsPreviewContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: isDarkMode ? '#272727' : '#e0e0e0',
  },
  commentsPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: isDarkMode ? '#f1f1f1' : '#0f0f0f',
    marginBottom: 4,
  },
  commentsPreviewSubtitle: {
    fontSize: 14,
    color: isDarkMode ? '#aaa' : '#606060',
  },
  commentsTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
    color: colors.text.primary,
  },
  commentsButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentsButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  fullscreenButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  fullscreenButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

});

export default VideoPlayerModalScreen;