// src/components/home/PostItem.tsx
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Modal,
  Alert,
} from 'react-native';
import Video from 'react-native-video';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Play, Pause, VolumeX, Volume2, AlertTriangle, Image as ImageIcon } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  createSecureImageSource, 
  createSecureVideoSource, 
  testVideoUrl, 
  validateAndFixVideoUrl 
} from '../../utils/mediaUtils';
import { ProfileFastImage, ContentFastImage } from '../../utils/FastImageOptimizer';

const {width} = Dimensions.get('window');

// Helper function to format numbers
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

interface PostItemProps {
  id: number;
  username: string;
  profileImage?: string | null;
  postImage: string | null;
  caption: string;
  likes: number;
  comments: number;
  timeAgo: string;
  created_at?: string;
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
  isGloballyMuted?: boolean;
  onToggleGlobalMute?: () => void;
  onPromotedView?: (postId: number) => void;
  isPromoted?: boolean;
  duration_days?: number;
  remaining_budget?: number;
  alreadyRewarded?: boolean;
  is_promtion_post_viewed?: number;
  showMenu?: boolean;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
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
  media_type = 'image',
  isPremium = false,
  onLike,
  onComment,
  onShare,
  onPostPress,
  onUserPress,
  onFollow,
  isLiked = false,
  userId,
  isVisible = true,
  last_active,
  isGloballyMuted = false,
  onToggleGlobalMute,
  onPromotedView,
  isPromoted = false,
  duration_days,
  created_at,
  remaining_budget,
  alreadyRewarded = false,
  is_promtion_post_viewed,
  showMenu = false,
  onEdit,
  onDelete,
}) => {
  // Debug logging for profileImage type
  if (profileImage && typeof profileImage !== 'string') {
    console.warn(`[PostItem ${id}] profileImage is not a string:`, typeof profileImage, profileImage);
  }
  
  // Debug logging for postImage type
  if (postImage && typeof postImage !== 'string') {
    console.warn(`[PostItem ${id}] postImage is not a string:`, typeof postImage, postImage);
  }
  const { colors } = useTheme();

  const [securePostImage, setSecurePostImage] = useState<any>(null);
  const [secureVideoSource, setSecureVideoSource] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wasManuallyPaused, setWasManuallyPaused] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [hasRewarded, setHasRewarded] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoTimer, setPromoTimer] = useState(5);
  const [canClosePromoModal, setCanClosePromoModal] = useState(false);
  const [showDropdownMenu, setShowDropdownMenu] = useState(false);

  // Enhanced video URL testing and validation
  const testAndValidateVideoUrl = useCallback(async (url: string) => {
    try {
      const isValid = await testVideoUrl(url);
      if (!isValid) {
        const fixedUrl = await validateAndFixVideoUrl(url);
        if (fixedUrl) {
          console.log(`[PostItem ${id}] Fixed video URL:`, fixedUrl);
          return fixedUrl;
        }
      }
      return url;
    } catch (error) {
      console.error(`[PostItem ${id}] Video URL validation error:`, error);
      return url;
    }
  }, [id]);

  // Load secure media sources with enhanced error handling
  useEffect(() => {
    const loadSecureMedia = async () => {
      try {
        // Profile images are handled directly by ProfileFastImage component
        // No need to pre-process them here as ProfileFastImage handles URL processing and fallbacks

        // Load secure post media
        if (postImage && typeof postImage === 'string') {
          if (media_type === 'video') {
            console.log(`[PostItem ${id}] Loading video:`, postImage);
            
            // Test the video URL first
            await testAndValidateVideoUrl(postImage);
            
            // Create secure video source
            const secureVideo = await createSecureVideoSource(postImage);
            console.log(`[PostItem ${id}] Created secure video source:`, {
              hasUri: !!secureVideo.uri,
              uri: secureVideo.uri,
              hasHeaders: !!(secureVideo as any).headers
            });
            setSecureVideoSource(secureVideo);
          } else {
            const secureImage = await createSecureImageSource(postImage);
            console.log(`[PostItem ${id}] Created secure image source:`, {
              hasUri: !!secureImage?.uri,
              uri: secureImage?.uri
            });
            setSecurePostImage(secureImage);
          }
        }
      } catch (error) {
        console.error(`[PostItem ${id}] Failed to load secure media:`, error);
        if (media_type === 'video') {
          setVideoError(true);
        }
      }
    };

    loadSecureMedia();
  }, [postImage, media_type, id, testAndValidateVideoUrl]);

  // Enhanced Video Playback Logic - INSTANT play/pause on visibility change
  useEffect(() => {
    if (media_type === 'video') {
      if (isVisible && !wasManuallyPaused && !videoError) {
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    }
  }, [isVisible, wasManuallyPaused, media_type, videoError]);

  // Check if post has been viewed by current user
  const hasBeenViewed = useMemo(() => {
    return is_promtion_post_viewed === 1 || hasRewarded;
  }, [is_promtion_post_viewed, hasRewarded]);

  useEffect(() => {
    let interval: any;
    if (showPromoModal && media_type === 'image' && isPromoted && !hasBeenViewed && onPromotedView) {
      setPromoTimer(5);
      setCanClosePromoModal(false);
      interval = setInterval(() => {
        setPromoTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setHasRewarded(true);
            setTimeout(() => {
              // Log API request
              console.log('[PostItem] Calling view-promoted-post API:', { user_id: userId, post_id: id });
              onPromotedView(id);
            }, 0);
            setTimeout(() => {
              setCanClosePromoModal(true); // Allow closing after reward
            }, 500); // Give a short delay for popup
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showPromoModal, media_type, isPromoted, hasBeenViewed, onPromotedView, id, userId]);

  // For video: reward on video end in modal
  const handlePromoVideoEnd = useCallback(() => {
    if (isPromoted && !hasBeenViewed && onPromotedView) {
      setHasRewarded(true);
      setTimeout(() => {
        console.log('[PostItem] Calling view-promoted-post API for video:', { user_id: userId, post_id: id });
        onPromotedView(id);
      }, 0);
      setTimeout(() => {
        setCanClosePromoModal(true);
      }, 500);
    }
  }, [isPromoted, hasBeenViewed, onPromotedView, id, userId]);

  // Check if promotional post is active
  const isPromoActive = useMemo(() => {
    if (!isPromoted) return false;
    
    // Check duration
    if (duration_days && created_at) {
      const endDate = new Date(created_at);
      endDate.setDate(endDate.getDate() + duration_days);
      if (new Date() > endDate) return false;
    }
    
    // Check budget
    if (typeof remaining_budget === 'number' && remaining_budget <= 0) return false;
    
    return true;
  }, [isPromoted, duration_days, created_at, remaining_budget]);

  // Handle promotional post view
  const handlePromotedView = useCallback(async () => {
    if (!onPromotedView) return;
    
    setShowPromoModal(false);
    
    try {
      await onPromotedView(id);
    } catch (error) {
      console.error('Promoted view error:', error);
    }
  }, [onPromotedView, id]);

  const handlePostPress = useCallback(() => {
    onPostPress(id);
  }, [onPostPress, id]);

  const handleUserPress = useCallback(() => {
    onUserPress(userId);
  }, [onUserPress, userId]);

  const handleLike = useCallback(() => {
    onLike(id);
  }, [onLike, id]);

  const handleComment = useCallback(() => {
    onComment(id);
  }, [onComment, id]);

  const handleShare = useCallback(() => {
    onShare(id);
  }, [onShare, id]);

  const handleFollow = useCallback(async () => {
    if (followLoading) return;
    
    setFollowLoading(true);
    try {
      await onFollow(userId);
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Follow error:', error);
    } finally {
      setFollowLoading(false);
    }
  }, [onFollow, userId, isFollowing, followLoading]);

  const togglePlayPause = useCallback(() => {
    if (media_type === 'video') {
      setWasManuallyPaused(!isPlaying);
      setIsPlaying(!isPlaying);
    }
  }, [media_type, isPlaying]);

  const handleVideoLoadStart = useCallback(() => {
    setVideoLoading(true);
    setVideoError(false);
  }, []);

  const handleVideoLoad = useCallback(() => {
    setVideoLoading(false);
    setVideoError(false);
  }, []);

  const handleVideoProgress = useCallback(() => {
    // Video is playing successfully
  }, []);

  const handleVideoEnd = useCallback(() => {
    if (isPromoted && !hasBeenViewed && onPromotedView) {
      setHasRewarded(true);
      onPromotedView(id);
    }
    // Video ended, could restart or show replay button
  }, [isPromoted, hasBeenViewed, onPromotedView, id]);

  const handleVideoError = useCallback((error: any) => {
    console.error(`[PostItem ${id}] Video error:`, error);
    setVideoLoading(false);
    setVideoError(true);
  }, [id]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleUserPress} style={styles.userInfo}>
          <ProfileFastImage
            source={profileImage}
            size={32}
            style={styles.profileImage}
          />
          <View style={styles.userDetails}>
            <Text style={[styles.username, { color: colors.text.primary }]}>
              {username}
            </Text>
            <Text style={[styles.timeAgo, { color: colors.text.secondary }]}>
              {timeAgo}
            </Text>
          </View>
        </TouchableOpacity>

        {showMenu && (
          <View style={styles.menuContainer}>
            <TouchableOpacity
              onPress={() => setShowDropdownMenu(!showDropdownMenu)}
              style={styles.moreButton}
            >
              <MoreHorizontal size={20} color={colors.text.primary} />
            </TouchableOpacity>

            {/* Dropdown Menu */}
            {showDropdownMenu && (
              <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowDropdownMenu(false);
                    onEdit?.(id);
                  }}
                >
                  <Text style={[styles.menuItemText, { color: colors.text.primary }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowDropdownMenu(false);
                    onDelete?.(id);
                  }}
                >
                  <Text style={[styles.menuItemText, { color: colors.error }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Media Content or Promo Button */}
      {isPromoActive ? (
        <View style={styles.promoButtonContainer}>
          <TouchableOpacity
            style={[styles.promoButton, hasRewarded && { backgroundColor: '#ccc' }]}
            onPress={() => setShowPromoModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.promoButtonText}>
              {hasBeenViewed ? 'View Again' : 'View Promotional Post'}
            </Text>
          </TouchableOpacity>
          <Modal
            visible={showPromoModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowPromoModal(false)}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.modalContent}>
                <TouchableOpacity 
                  style={styles.modalClose} 
                  onPress={() => { 
                    if (canClosePromoModal || hasBeenViewed) setShowPromoModal(false); 
                  }} 
                  disabled={!canClosePromoModal && !hasBeenViewed}
                >
                  <Text style={{ fontSize: 18, color: (canClosePromoModal || hasBeenViewed) ? '#333' : '#aaa' }}>✕</Text>
                </TouchableOpacity>
                {media_type === 'image' && postImage && (
                  <>
                    <ContentFastImage source={postImage} style={styles.promoMedia} />
                    {!hasBeenViewed && (
                      <Text style={styles.promoTimerText}>Please wait {promoTimer} seconds...</Text>
                    )}
                    {!canClosePromoModal && !hasBeenViewed && (
                      <Text style={{ color: '#888', marginTop: 8, fontSize: 14 }}>You can close after reward is processed.</Text>
                    )}
                  </>
                )}
                {media_type === 'video' && postImage && !videoError && (
                  <Video
                    source={secureVideoSource}
                    style={styles.promoMedia}
                    resizeMode="cover"
                    repeat={false}
                    paused={false}
                    muted={isGloballyMuted}
                    onEnd={hasBeenViewed ? undefined : handlePromoVideoEnd}
                    onError={handleVideoError}
                    playInBackground={false}
                    playWhenInactive={false}
                    ignoreSilentSwitch="ignore"
                    mixWithOthers="duck"
                  />
                )}
                {media_type === 'video' && videoError && (
                  <View style={styles.videoErrorContainer}>
                    <AlertTriangle size={50} color={colors.text.tertiary || '#CCCCCC'} />
                    <Text style={[styles.errorText, {color: colors.text.secondary}]}>Video unavailable</Text>
                  </View>
                )}
              </View>
            </View>
          </Modal>
        </View>
      ) : (
        // Non-promoted or expired/exhausted: show media as usual
        <TouchableOpacity onPress={handlePostPress} activeOpacity={1}>
          <View style={styles.mediaContainer}>
            {media_type === 'image' && postImage && (
              <ContentFastImage source={postImage} style={styles.postMedia} />
            )}
            {media_type === 'video' && postImage && !videoError && (
              <TouchableWithoutFeedback onPress={togglePlayPause}>
                <View style={styles.videoPlayerContainer}>
                  <Video
                    source={secureVideoSource}
                    style={styles.postMedia}
                    resizeMode="cover"
                    repeat={true}
                    paused={!isPlaying}
                    muted={isGloballyMuted}
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
                      <Text style={[styles.loadingText, {color: colors.text.secondary}]}>Loading video...</Text>
                    </View>
                  )}
                  {!videoLoading && !isPlaying && (
                    <View style={styles.playButton}>
                      <Play size={40} color="#fff" />
                    </View>
                  )}
                </View>
              </TouchableWithoutFeedback>
            )}
            {media_type === 'video' && videoError && (
              <View style={styles.videoErrorContainer}>
                <AlertTriangle size={50} color={colors.text.tertiary || '#CCCCCC'} />
                <Text style={[styles.errorText, {color: colors.text.secondary}]}>Video unavailable</Text>
              </View>
            )}
            {!postImage && media_type === 'image' && (
              <View style={styles.noImageContainer}>
                <ImageIcon size={50} color={colors.text.tertiary || '#CCCCCC'} />
                <Text style={[styles.noImageText, {color: colors.text.secondary}]}>No image available</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
            <Heart
              size={24}
              color={isLiked ? '#FF3040' : colors.text.primary}
              fill={isLiked ? '#FF3040' : 'transparent'}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleComment} style={styles.actionButton}>
            <MessageCircle size={24} color={colors.text.primary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
            <Send size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/*<TouchableOpacity onPress={() => {}} style={styles.bookmarkButton}>
          <Bookmark size={24} color={colors.text.primary} />
        </TouchableOpacity>*/}
      </View>

      {/* Likes Count */}
      {likes > 0 && (
        <View style={styles.likesContainer}>
          <Text style={[styles.likesText, { color: colors.text.primary }]}>
            {likes === 1 ? '1 like' : `${formatNumber(likes)} likes`}
          </Text>
        </View>
      )}

      {/* Caption */}
      {caption && (
        <View style={styles.captionContainer}>
          <Text style={[styles.caption, { color: colors.text.primary }]}>
            <Text style={[styles.captionUsername, { color: colors.text.primary }]}>
              {username}{' '}
            </Text>
            {caption}
          </Text>
        </View>
      )}

      {/* Comments Link */}
      {comments > 0 && (
        <TouchableOpacity onPress={handleComment} style={styles.commentsContainer}>
          <Text style={[styles.commentsText, { color: colors.text.secondary }]}>
            View all {comments} comments
          </Text>
        </TouchableOpacity>
      )}

      {/* Time Ago */}
      <View style={styles.timeContainer}>
        <Text style={[styles.timeText, { color: colors.text.secondary }]}>
          {timeAgo}
        </Text>
      </View>

      {/* Premium Badge */}
      {isPremium && (
        <View style={[styles.premiumBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumText}>Premium</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginBottom: 0,
  },
  header: {
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
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
  },
  timeAgo: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
  moreButton: {
    padding: 4,
  },
  mediaContainer: {
    position: 'relative',
    width: '100%',
    height: width, // Square aspect ratio like Instagram
    justifyContent: 'center',
    alignItems: 'center',
  },
  postMedia: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  videoPlayerContainer: {
    position: 'relative',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  videoErrorContainer: {
    height: width,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
  },
  noImageContainer: {
    height: width,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  noImageText: {
    marginTop: 8,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: 16,
  },
  bookmarkButton: {
    // No additional styling needed
  },
  likesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  likesText: {
    fontSize: 14,
    fontWeight: '600',
  },
  captionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  caption: {
    fontSize: 14,
    lineHeight: 18,
  },
  captionUsername: {
    fontWeight: '600',
  },
  commentsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  commentsText: {
    fontSize: 14,
  },
  timeContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  timeText: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
  premiumBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  premiumText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  promoButtonContainer: {
    width: '100%',
    height: width, // Match media area
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 0, // Remove extra margin
  },
  promoButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 0,
  },
  promoButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '90%',
    alignItems: 'center',
    position: 'relative',
  },
  modalClose: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  promoMedia: {
    width: 300,
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
  },
  promoTimerText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
    marginTop: 8,
  },
  menuContainer: {
    position: 'relative',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 30,
    right: 0,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 100,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default React.memo(PostItem);
