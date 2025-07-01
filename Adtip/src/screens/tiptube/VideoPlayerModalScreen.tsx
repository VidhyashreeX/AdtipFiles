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
  TextInput,
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
import { createSecureVideoSource } from '../../utils/mediaUtils';
import ApiService from '../../services/ApiService';
import { useAuth } from '../../contexts/AuthContext';

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

// Helper to get a fallback avatar
const getCommentatorAvatar = (img: any) => {
  if (img && typeof img === 'string' && img.trim() !== '') {
    return { uri: img };
  }
  // Use a nice random avatar
  return { uri: 'https://ui-avatars.com/api/?name=User&background=random' };
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
  const [comments, setComments] = useState<any[]>([]);
  const [commentCount, setCommentCount] = useState<number>(0);
  const [newComment, setNewComment] = useState<string>('');
  const [isLiking, setIsLiking] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<number>>(new Set());
  const [isVideoLiked, setIsVideoLiked] = useState(false);
  const [isFollowingChannel, setIsFollowingChannel] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

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

  // Fetch comments and count
  const fetchComments = useCallback(async () => {
    if (!video?.id) return;
    try {
      const commentCountResponse = await ApiService.getCommentOfVideo(Number(video.id), 1, 10);
      const commentsResponse = await ApiService.getCommentsOfVideos(Number(user?.id), Number(video.id));
      console.log('[VideoPlayerModal] commentCountResponse:', commentCountResponse);
      console.log('[VideoPlayerModal] commentsResponse:', commentsResponse);

      const count = Array.isArray(commentCountResponse) ? commentCountResponse.length : 0;
      const comments = Array.isArray(commentsResponse) ? commentsResponse : [];

      setCommentCount(count);
      setComments(comments);

      console.log('[VideoPlayerModal] Comments fetched:', {
        count,
        comments
      });
    } catch (error) {
      console.error('[VideoPlayerModal] Error fetching comments:', error);
    }
  }, [video?.id, user?.id]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Handle adding a comment
  const handleAddComment = useCallback(async () => {
    if (!user?.id || !newComment.trim()) return;
    try {
      await ApiService.saveVideoComment(Number(video.id), Number(user?.id), newComment);
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('[VideoPlayerModal] Error adding comment:', error);
    }
  }, [user?.id, newComment, video?.id, fetchComments]);

  // Handle liking a comment
  const handleLikeComment = useCallback(async (commentId: number) => {
    if (!user?.id) return;
    try {
      setIsLiking(true);
      await ApiService.saveVideoCommentLike(commentId, Number(user?.id));
      setLikedComments(prev => {
        const newSet = new Set(prev);
        if (newSet.has(commentId)) {
          newSet.delete(commentId);
        } else {
          newSet.add(commentId);
        }
        return newSet;
      });
      fetchComments();
    } catch (error) {
      console.error('[VideoPlayerModal] Error liking comment:', error);
    } finally {
      setIsLiking(false);
    }
  }, [user?.id, fetchComments]);

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

  // Check if user is following the channel
  const checkChannelFollowStatus = useCallback(async () => {
    if (!user?.id || !video?.channelId) return;
    try {
      const videoDetails = await ApiService.getVideoWithUserContext(Number(video.id), Number(user.id));
      console.log('[VideoPlayerModal] Video details with user context:', videoDetails);
      
      // Check if the video data contains follow status
      if (videoDetails && videoDetails.data) {
        const videoData = Array.isArray(videoDetails.data) ? videoDetails.data[0] : videoDetails.data;
        setIsFollowingChannel(videoData?.is_following || false);
      }
    } catch (error) {
      console.error('[VideoPlayerModal] Error checking channel follow status:', error);
    }
  }, [user?.id, video?.id, video?.channelId]);

  // Handle follow/unfollow channel
  const handleFollowChannel = useCallback(async () => {
    if (!user?.id || !video?.channelId) return;
    try {
      setIsFollowLoading(true);
      const followAction = isFollowingChannel ? 0 : 1;
      
      await ApiService.saveChannelFollowers({
        userId: Number(user.id),
        channelId: Number(video.channelId),
        follow: followAction
      });
      
      setIsFollowingChannel(!isFollowingChannel);
      console.log('[VideoPlayerModal] Channel follow status updated:', !isFollowingChannel);
    } catch (error) {
      console.error('[VideoPlayerModal] Error following/unfollowing channel:', error);
    } finally {
      setIsFollowLoading(false);
    }
  }, [user?.id, video?.channelId, isFollowingChannel]);

  // Check channel follow status when component mounts
  useEffect(() => {
    checkChannelFollowStatus();
  }, [checkChannelFollowStatus]);

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
              <Video
                key={video.id}
                source={videoSource}
                style={StyleSheet.absoluteFillObject}
                controls={true}
                paused={false}
                resizeMode="contain"
                onReadyForDisplay={() => setIsVideoReady(true)}
                onError={(error) => {
                  console.error('[VideoPlayerModal] Video playback error:', error);
                  setVideoError('Video playback failed');
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
              
              {/* Follow/Unfollow Channel Button */}
              {user?.id && video?.channelId && user.id !== video.channelId && (
                <TouchableOpacity 
                  onPress={handleFollowChannel} 
                  disabled={isFollowLoading}
                  style={[
                    styles.followChannelButton,
                    isFollowingChannel ? styles.unfollowButton : styles.followButton
                  ]}
                >
                  {isFollowLoading ? (
                    <ActivityIndicator 
                      size="small" 
                      color={isFollowingChannel ? colors.text.primary : colors.white} 
                    />
                  ) : (
                    <Text style={[
                      styles.followChannelButtonText,
                      isFollowingChannel ? styles.unfollowButtonText : styles.followButtonText
                    ]}>
                      {isFollowingChannel ? 'Unfollow Channel' : 'Follow Channel'}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Comment Section - moved above Up next */}
            <View style={[styles.commentCard, { minHeight: 120 }]}> 
              <Text style={styles.commentsTitle}>
                Comments ({commentCount})
              </Text>
              {/* Like Video Button */}
              <TouchableOpacity onPress={handleLikeVideo} style={styles.likeVideoButton}>
                <Text style={[styles.likeVideoButtonText, isVideoLiked ? styles.liked : styles.notLiked]}>
                  {isVideoLiked ? '♥ Liked' : '♡ Like this video'}
                </Text>
              </TouchableOpacity>
              {/* Comments List */}
              {Array.isArray(comments) && comments.length > 0 ? (
                comments.map((comment, idx) => (
                  <View key={comment.id ? String(comment.id) : `comment-${idx}`} style={styles.commentItemRow}>
                    <Image
                      source={getCommentatorAvatar(comment.commentator_image)}
                      style={styles.commentatorImage}
                    />
                    <View style={styles.commentContent}>
                      <Text style={styles.commentatorName}>{comment.commentator_name || 'Anonymous'}</Text>
                      <Text style={styles.commentText}>{comment.comment}</Text>
                      <View style={styles.commentActions}>
                        <TouchableOpacity onPress={() => handleLikeComment(comment.id)} disabled={isLiking}>
                          <Text style={[styles.commentLikeText, likedComments.has(comment.id) ? styles.liked : styles.notLiked]}>
                            {likedComments.has(comment.id) ? '♥' : '♡'} Like ({comment.total_comment_like || 0})
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noCommentsText}>No comments yet.</Text>
              )}
              {/* Add Comment Input */}
              <View style={styles.commentInputRow}>
                <TextInput
                  style={styles.commentInput}
                  value={newComment}
                  onChangeText={setNewComment}
                  placeholder="Add a comment..."
                  placeholderTextColor="#888"
                />
                <TouchableOpacity onPress={handleAddComment} style={styles.commentSendButton}>
                  <Text style={styles.commentSendButtonText}>Post</Text>
                </TouchableOpacity>
              </View>
            </View>

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
  commentsTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
    color: colors.text.primary,
  },
  likeVideoButton: {
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  likeVideoButtonText: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  liked: {
    color: '#e53935',
  },
  notLiked: {
    color: colors.text.secondary,
  },
  commentItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  commentatorImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  commentContent: {
    flex: 1,
  },
  commentatorName: {
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  commentText: {
    color: colors.text.primary,
  },
  commentActions: {
    flexDirection: 'row',
    marginTop: 4,
  },
  commentLikeText: {
    fontWeight: 'bold',
    marginRight: 10,
  },
  noCommentsText: {
    color: colors.text.secondary,
    textAlign: 'center',
    marginVertical: 16,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 10,
    marginRight: 10,
    backgroundColor: colors.background,
    color: colors.text.primary,
  },
  commentSendButton: {
    padding: 10,
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  commentSendButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  followChannelButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButton: {
    backgroundColor: colors.primary,
  },
  unfollowButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  followChannelButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  followButtonText: {
    color: colors.white,
  },
  unfollowButtonText: {
    color: colors.text.primary,
  },
});

export default VideoPlayerModalScreen;