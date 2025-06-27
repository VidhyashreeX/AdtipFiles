// src/components/home/PostItem.tsx
import React, {useRef, useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from 'react-native';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/Feather';
import { Heart, MessageCircle, Share2, UserPlus } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { createSecureImageSource, createSecureVideoSource } from '../../utils/mediaUtils';

const {width} = Dimensions.get('window');

interface PostItemProps {
  id: number;
  username: string;
  profileImage?: string | null;
  postImage: string | null;
  caption: string;
  likes: number;
  comments: number;
  timeAgo: string;
  media_type?: string;
  isPremium?: boolean;
  onLike: (id: number) => void;
  onComment: (id: number) => void;
  onShare: (id: number) => void;
  onPostPress: (id: number) => void;
  onUserPress: (userId: number) => void;
  onFollow: (userId: number) => Promise<void>;
  isLiked?: boolean;
  userId: number;
  isVisible?: boolean;
  last_active?: string | null;
}

const PostItem: React.FC<PostItemProps> = ({
  id,
  username,
  profileImage,
  postImage,
  caption,
  likes,
  comments,
  timeAgo,
  media_type,
  isPremium = false,
  onLike,
  onComment,
  onShare,
  onPostPress,
  onUserPress,
  onFollow,
  isLiked = false,
  userId,
  isVisible = false,
  last_active,
}) => {  const {colors, isDarkMode} = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoLoading, setVideoLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [wasManuallyPaused, setWasManuallyPaused] = useState(false);
  const [secureProfileImage, setSecureProfileImage] = useState<any>(null);
  const [securePostImage, setSecurePostImage] = useState<any>(null);
  const [secureVideoSource, setSecureVideoSource] = useState<any>(null);

  // Defensive: Ensure all text props are strings or numbers
  const safeUsername = typeof username === 'string' || typeof username === 'number' ? String(username) : '';
  const safeCaption = typeof caption === 'string' || typeof caption === 'number' ? String(caption) : '';
  const safeTimeAgo = typeof timeAgo === 'string' || typeof timeAgo === 'number' ? String(timeAgo) : '';
  const safeLastActive = typeof last_active === 'string' || typeof last_active === 'number' ? String(last_active) : '';

  if (typeof username !== 'string' && typeof username !== 'number') {
    console.warn('PostItem: username is not a string/number', username);
  }
  if (typeof caption !== 'string' && typeof caption !== 'number') {
    console.warn('PostItem: caption is not a string/number', caption);
  }
  if (typeof timeAgo !== 'string' && typeof timeAgo !== 'number') {
    console.warn('PostItem: timeAgo is not a string/number', timeAgo);
  }
  if (last_active && typeof last_active !== 'string' && typeof last_active !== 'number') {
    console.warn('PostItem: last_active is not a string/number', last_active);
  }

  // Load secure media sources
  useEffect(() => {
    const loadSecureMedia = async () => {
      try {
        // Load secure profile image
        if (profileImage) {
          const secureProfile = await createSecureImageSource(profileImage);
          setSecureProfileImage(secureProfile);
        }

        // Load secure post media
        if (postImage) {
          if (media_type === 'video') {
            const secureVideo = await createSecureVideoSource(postImage);
            setSecureVideoSource(secureVideo);
          } else {
            const secureImage = await createSecureImageSource(postImage);
            setSecurePostImage(secureImage);
          }
        }
      } catch (error) {
        console.error('Failed to load secure media:', error);
      }
    };

    loadSecureMedia();
  }, [profileImage, postImage, media_type]);

  // Enhanced Video Playback Logic - INSTANT play/pause on visibility change
  useEffect(() => {
    if (media_type === 'video') {
      if (isVisible) {
        // INSTANT play when visible (only if not manually paused)
        if (!wasManuallyPaused) {
          setIsPlaying(true);
        }
        setVideoError(false);
      } else {
        // INSTANT pause when out of view
        setIsPlaying(false);
        // Reset manual pause state when video goes out of view completely
        setWasManuallyPaused(false);
      }
    }
  }, [isVisible, media_type, wasManuallyPaused]);

  // Enhanced toggle play/pause with manual state tracking
  const togglePlayPause = useCallback(() => {
    const newPlayingState = !isPlaying;
    setIsPlaying(newPlayingState);
    
    // Track if user manually paused the video
    if (!newPlayingState && isVisible) {
      setWasManuallyPaused(true);
    } else if (newPlayingState) {
      setWasManuallyPaused(false);
    }
    
    setShowControls(true);
    // Reduced control timeout for better responsiveness
    setTimeout(() => setShowControls(false), 1500);
  }, [isPlaying, isVisible]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    setShowControls(true);
    // Reduced control timeout for better responsiveness
    setTimeout(() => setShowControls(false), 1500);
  }, []);

  // Optimized video load handlers
  const handleVideoLoadStart = useCallback(() => {
    setVideoLoading(true);
  }, []);

  const handleVideoLoad = useCallback((meta: any) => {
    setVideoDuration(meta.duration);
    setVideoLoading(false);
    // Auto-play immediately after load if visible and not manually paused
    if (isVisible && !wasManuallyPaused) {
      setIsPlaying(true);
    }
  }, [isVisible, wasManuallyPaused]);

  const handleVideoProgress = useCallback((progress: any) => {
    setVideoProgress(progress.currentTime);
  }, []);

  const handleVideoEnd = useCallback(() => {
    setIsPlaying(false);
    setWasManuallyPaused(false);
  }, []);

  const handleVideoError = useCallback((error: any) => {
    console.error("Video playback error:", error);
    setVideoError(true);
    setIsPlaying(false);
    setVideoLoading(false);
    setWasManuallyPaused(false);
  }, []);

  // Instant error reset when video comes back into view
  useEffect(() => {
    if (media_type === 'video' && isVisible && videoError) {
      setVideoError(false);
      setVideoLoading(true);
      // Try to play immediately if visible
      if (!wasManuallyPaused) {
        setIsPlaying(true);
      }
    }
  }, [isVisible, media_type, videoError, wasManuallyPaused]);

  const handleLikePress = () => {
    onLike(id);
  };

  const handleCommentPress = () => {
    onComment(id);
  };

  const handleSharePress = () => {
    onShare(id);
  };

  const handlePostPress = () => {
    onPostPress(id);
  };

  const handleUserPress = () => {
    onUserPress(userId);
  };

  const handleFollowPress = async () => {
    await onFollow(userId);
  };

  try {
    return (
      <View style={[styles.postContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {/* User Info Header */}
        <View style={styles.postHeader}>
          <TouchableOpacity onPress={handleUserPress} style={styles.userInfo}>
            <Image
              source={secureProfileImage || {
                uri: 'https://via.placeholder.com/40x40.png?text=U',
              }}
              style={styles.profileImage}
            />
            <View>
              <Text style={[styles.username, {color: colors.text.primary}]}>
                {safeUsername}
              </Text>
              {safeLastActive.trim() && (
                <Text style={[styles.lastActive, {color: colors.text.secondary}]}>
                  Active {safeLastActive}
                </Text>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleFollowPress} style={styles.followIconButton}>
            <UserPlus size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {/* Media Content (Image or Video) */}
        <TouchableOpacity onPress={handlePostPress} activeOpacity={1}>
          <View style={styles.mediaContainer}>
            {media_type === 'image' && postImage && securePostImage && (
              <Image
                source={securePostImage}
                style={styles.postMedia}
                resizeMode="cover"
              />
            )}

            {media_type === 'video' && postImage && secureVideoSource && !videoError && (
              <TouchableWithoutFeedback onPress={togglePlayPause}>
                <View style={styles.videoPlayerContainer}>
                  <Video
                    source={secureVideoSource}
                    style={styles.postMedia}
                    resizeMode="cover"
                    repeat={true}
                    paused={!isPlaying} // Instant pause/play response
                    muted={isMuted}
                    onLoadStart={handleVideoLoadStart}
                    onLoad={handleVideoLoad}
                    onProgress={handleVideoProgress}
                    onEnd={handleVideoEnd}
                    onError={handleVideoError}
                    bufferConfig={{
                      minBufferMs: 2000,
                      maxBufferMs: 8000,
                      bufferForPlaybackMs: 500,
                      bufferForPlaybackAfterRebufferMs: 1000,
                    }}
                    playInBackground={false}
                    playWhenInactive={false}
                    ignoreSilentSwitch="ignore"
                    mixWithOthers="duck"
                  />
                  {videoLoading && (
                    <View style={styles.videoOverlay}>
                      <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                  )}
                  {(showControls || !isPlaying || !isVisible) && !videoLoading && (
                    <TouchableOpacity onPress={togglePlayPause} style={styles.videoControlOverlay}>
                      <Icon 
                        name={isPlaying && isVisible ? 'pause-circle' : 'play-circle'} 
                        size={50} 
                        color="white" 
                      />
                    </TouchableOpacity>
                  )}
                  {(showControls || !isPlaying) && !videoLoading && isVisible && (
                    <TouchableOpacity onPress={toggleMute} style={styles.muteButton}>
                      <Icon name={isMuted ? 'volume-x' : 'volume-2'} size={24} color="white" />
                    </TouchableOpacity>
                  )}
                  {!isVisible && (
                    <View style={styles.outOfViewOverlay}>
                      <Text style={styles.outOfViewText}>Video paused</Text>
                    </View>
                  )}
                </View>
              </TouchableWithoutFeedback>
            )}
            {media_type === 'video' && videoError && (
              <View style={styles.errorMedia}>
                <Icon name="alert-triangle" size={50} color={colors.danger || '#FF0000'} />
                <Text style={[styles.errorText, {color: colors.text.secondary}]}>Video failed to load.</Text>
                <TouchableOpacity 
                  onPress={() => {
                    setVideoError(false); 
                    setVideoLoading(true);
                    if (isVisible) {
                      setIsPlaying(true);
                      setWasManuallyPaused(false);
                    }
                  }} 
                  style={styles.retryButton}
                >
                  <Text style={{color: colors.primary}}>Tap to Retry</Text>
                </TouchableOpacity>
              </View>
            )}
            {!postImage && (
              <View style={[styles.placeholderMedia, { backgroundColor: colors.surface }]}>
                <Icon name="image" size={50} color={colors.text.tertiary || '#CCCCCC'} />
                <Text style={[styles.placeholderText, { color: colors.text.tertiary }]}>No media</Text>
              </View>
            )}
            {isPremium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>Premium</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        {/* Actions (Like, Comment, Share) */}
        <View style={styles.postActions}>
          <View style={styles.leftActions}>
            <TouchableOpacity onPress={handleLikePress} style={styles.actionButton}>
              <Heart 
                size={24} 
                color={isLiked ? "#FF0000" : (isDarkMode ? colors.text.primary : "#1A1A1A")} 
                fill={isLiked ? "#FF0000" : "none"}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCommentPress} style={styles.actionButton}>
              <MessageCircle size={24} color={isDarkMode ? colors.text.primary : "#1A1A1A"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSharePress} style={styles.actionButton}>
              <Share2 size={24} color={isDarkMode ? colors.text.primary : "#1A1A1A"} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.likesCount, {color: colors.text.primary}]}>
          {`${likes} ${likes === 1 ? 'like' : 'likes'}`}
        </Text>
        {safeCaption.trim() && (
          <Text style={[styles.caption, {color: colors.text.primary}]}>
            <Text style={styles.captionUsername}>{safeUsername}</Text>
            {` ${safeCaption.trim()}`}
          </Text>
        )}
        {comments > 0 && (
          <TouchableOpacity onPress={handleCommentPress}>
            <Text style={[styles.commentsCount, {color: colors.text.secondary}]}>
              View all {comments} comments
            </Text>
          </TouchableOpacity>
        )}
        {safeTimeAgo.trim() && (
          <Text style={[styles.timeAgo, {color: colors.text.secondary}]}>
            {safeTimeAgo}
          </Text>
        )}
      </View>
    );
  } catch (err) {
    console.error('Error rendering PostItem:', err);
    return <Text style={{color: 'red'}}>Error rendering post</Text>;
  }
};

// Add new styles for the out-of-view overlay
const styles = StyleSheet.create({
  postContainer: {
    backgroundColor: '#FFFFFF',
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: '#E0E0E0',
  },
  username: {
    fontWeight: '600',
    fontSize: 14,
    color: '#1A1A1A',
  },
  lastActive: {
    fontSize: 12,
    marginTop: 2,
    color: '#666666',
  },
  followIconButton: {
    padding: 4,
  },
  mediaContainer: {
    width: '100%',
    height: width,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postMedia: {
    width: '100%',
    height: '100%',
  },
  videoPlayerContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  videoControlOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  muteButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    padding: 5,
  },
  // NEW STYLE: Out of view overlay
  outOfViewOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  outOfViewText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  errorMedia: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
  },
  retryButton: {
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  placeholderMedia: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#CCCCCC',
  },
  premiumBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  premiumText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  leftActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginRight: 16,
    padding: 4,
  },
  likesCount: {
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 4,
    fontSize: 14,
    color: '#1A1A1A',
  },
  caption: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    fontSize: 14,
    lineHeight: 18,
    color: '#1A1A1A',
  },
  captionUsername: {
    fontWeight: '600',
  },
  commentsCount: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    fontSize: 14,
    color: '#666666',
  },
  timeAgo: {
    fontSize: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
    color: '#666666',
  },
});

export default React.memo(PostItem);
