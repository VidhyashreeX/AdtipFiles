import React, { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Image,
  StatusBar,
  SafeAreaView,
  Platform,
  Animated,
} from 'react-native';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import ApiService from '../../services/ApiService';
import { ENDPOINTS } from '../../constants/api';
import { useShorts } from '../../contexts/ShortsContext';
import { getSecureMediaUrl, getFallbackAvatarUrl } from '../../utils/mediaUtils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PAGE_SIZE = 8; // Number of shorts to fetch per page

interface ShortVideo {
  id: string;
  title: string;
  thumbnail: string | null;
  channel: {
    id: string;
    name: string;
    avatar: string;
    verified: boolean;
    subscribers: number;
  };
  views: number;
  likes: number;
  duration: string;
  createdAt: string;
  category: string;
  isPaidPromotional?: boolean;
  postedAt: string;
  description: string;
  videoUrl: string;
  comments: number;
  musicName?: string;
}

interface PublicShot {
  id: number;
  name: string;
  category_id: number;
  video_link: string;
  video_description: string;
  total_views: number;
  total_likes: number;
  createddate: string;
  video_Thumbnail: string;
  channelName: string;
  channel_profile: string;
  channelId: number;
  total_comments: number;
  play_duration: string;
  is_paid_promotional: number;
  total_channel_followers: number;
}

// Utility function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Animated Like Button Component
const AnimatedLikeButton = memo(({ 
  isLiked, 
  onPress, 
  likeCount,
  disabled = false 
}: { 
  isLiked: boolean; 
  onPress: () => void; 
  likeCount: number;
  disabled?: boolean;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const handlePress = useCallback(() => {
    if (disabled) return;

    // Scale animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for liked state
    if (!isLiked) {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Rotation animation
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        rotateAnim.setValue(0);
      });
    }

    onPress();
  }, [disabled, isLiked, scaleAnim, pulseAnim, rotateAnim, onPress]);

  const animatedStyle = {
    transform: [
      { scale: scaleAnim },
      { 
        rotate: rotateAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        })
      },
    ],
  };

  const pulseStyle = {
    transform: [{ scale: pulseAnim }],
  };

  return (
    <TouchableOpacity 
      style={styles.actionButton} 
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Animated.View style={animatedStyle}>
        {isLiked ? (
          <Animated.View style={pulseStyle}>
            <LinearGradient
              colors={['#FF6B6B', '#FF8E53', '#FF6B35']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.likedHeartGradient}
            >
              <Icon name="heart" size={28} color="#FFFFFF" />
            </LinearGradient>
          </Animated.View>
        ) : (
          <View style={styles.unlikedHeartContainer}>
            <Icon name="heart" size={28} color="#FFF" />
          </View>
        )}
      </Animated.View>
      <Text style={styles.actionText}>{likeCount}</Text>
    </TouchableOpacity>
  );
});

const TipShorts = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();

  // Global video playback states from context
  const { isGloballyMuted, isGloballyPlaying, toggleGlobalPlayPause, toggleGlobalMute } = useShorts();

  // Local component states
  const [activeIndex, setActiveIndex] = useState(0);
  const [shorts, setShorts] = useState<ShortVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likedShorts, setLikedShorts] = useState<{ [key: string]: boolean }>({});
  const [likingShorts, setLikingShorts] = useState<{ [key: string]: boolean }>({});
  const [refreshing, setRefreshing] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // Refs for FlatList and to manage scroll cooldown
  const flatListRef = useRef<FlatList>(null);
  const lastScrollTime = useRef(0);
  const SCROLL_COOLDOWN = 600;

  // Handle like/unlike short video
  const handleLikeShort = useCallback(async (shortId: string, creatorId: string, currentLikes: number) => {
    if (!user?.id || likingShorts[shortId]) {
      console.warn('User not authenticated or already processing like for this short');
      return;
    }

    const wasLiked = likedShorts[shortId] || false;
    const newLikedState = !wasLiked;

    // Optimistically update the UI
    setLikedShorts(prev => ({
      ...prev,
      [shortId]: newLikedState,
    }));

    setShorts(prevShorts =>
      prevShorts.map(short =>
        short.id === shortId
          ? { ...short, likes: short.likes + (newLikedState ? 1 : -1) }
          : short,
      ),
    );

    // Set loading state for this specific short
    setLikingShorts(prev => ({
      ...prev,
      [shortId]: true,
    }));

    try {
      console.log('Sending like request for short:', { 
        shortId, 
        userId: user.id, 
        creatorId, 
        newLikedState 
      });
      
      const response = await ApiService.likeShortVideo({
        reelId: parseInt(shortId),
        userId: parseInt(user.id.toString()),
        like: newLikedState ? 1 : 0,
        reelCreatorId: parseInt(creatorId),
      });
      
      console.log('Short like API response:', response);
      
      if (response.status !== 200 && response.status !== 1) {
        throw new Error('API response indicates failure');
      }
      
      console.log('Short like status updated successfully');
      
    } catch (error: any) {
      console.error('Error updating short like status:', error);
      
      // Rollback UI changes on error
      setLikedShorts(prev => ({
        ...prev,
        [shortId]: wasLiked,
      }));

      setShorts(prevShorts =>
        prevShorts.map(short =>
          short.id === shortId
            ? { ...short, likes: short.likes + (wasLiked ? 1 : -1) }
            : short,
        ),
      );

      setError(`Failed to ${newLikedState ? 'like' : 'unlike'} short. Please try again.`);
    } finally {
      // Remove loading state for this specific short
      setLikingShorts(prev => {
        const newState = { ...prev };
        delete newState[shortId];
        return newState;
      });
    }
  }, [user, likedShorts, likingShorts]);

  // Memoized callback for FlatList's onViewableItemsChanged
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      const now = Date.now();

      if (newIndex !== activeIndex && (now - lastScrollTime.current > SCROLL_COOLDOWN)) {
        setActiveIndex(newIndex);
        lastScrollTime.current = now;
      }
    }
  }, [activeIndex]);

  // Viewability configuration for FlatList
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 100,
    minimumViewTime: 500,
  }).current;

  // Function to fetch short videos from the API
  const fetchShorts = useCallback(async (reset = false) => {
    if (isFetchingMore && !reset) return;

    try {
      if (reset) {
        setLoading(true);
        setShorts([]);
        setPage(1);
        setHasMore(true);
      } else {
        setIsFetchingMore(true);
      }
      setError(null);

      const userId = user?.id || '50816';
      const currentPage = reset ? 1 : page;
      const apiUrl = `${ENDPOINTS.GET_SHORTS}/${userId}?page=${currentPage}&limit=${PAGE_SIZE}`;

      const response = await ApiService.get(apiUrl);

      if (!response || (!response.data && response.status !== 200)) {
        throw new Error('Failed to load shorts: Invalid API response or empty data');
      }

      const publicShots: PublicShot[] = Array.isArray(response.data)
        ? response.data
        : response.data.status === 200 && Array.isArray(response.data.data)
          ? response.data.data
          : [];      const mappedShortsPromises = publicShots
        .filter(shot => shot.video_link && shot.video_link.startsWith('http'))
        .map(async (shot: PublicShot) => ({
          id: shot.id?.toString() || Math.random().toString(),
          title: shot.name || 'Untitled Short',
          thumbnail:
            shot.video_Thumbnail && shot.video_Thumbnail !== 'undefined'
              ? (await getSecureMediaUrl(shot.video_Thumbnail)) || null
              : null,
          channel: {
            id: shot.channelId?.toString() || 'unknownChannel',
            name: shot.channelName || 'Unknown Channel',
            avatar:
              shot.channel_profile && shot.channel_profile !== 'null'
                ? (await getSecureMediaUrl(shot.channel_profile)) || getFallbackAvatarUrl(shot.channelId || Math.random().toString())
                : getFallbackAvatarUrl(shot.channelId || Math.random().toString()),
            verified: false,
            subscribers: shot.total_channel_followers || 0,
          },
          views: shot.total_views || 0,
          likes: shot.total_likes || 0,
          duration: shot.play_duration || '0:00',
          createdAt: shot.createddate || new Date().toISOString(),
          category: shot.category_id?.toString() || '1',
          isPaidPromotional: shot.is_paid_promotional === 1,
          postedAt: shot.createddate || new Date().toISOString(),
          description:
            shot.video_description && shot.video_description !== 'undefined'
              ? shot.video_description
              : 'No description available for this short.',
          videoUrl: (await getSecureMediaUrl(shot.video_link || '')) || '',
          comments: shot.total_comments || 0,
          musicName: shot.name || 'Original Sound',
        }));      const mappedShorts: ShortVideo[] = await Promise.all(mappedShortsPromises);

      setShorts(prev => {
        const existingIds = new Set(prev.map(s => s.id));
        const newUniqueShorts = mappedShorts.filter(s => !existingIds.has(s.id));
        
        return reset ? shuffleArray(newUniqueShorts) : [...prev, ...newUniqueShorts];
      });

      setHasMore(mappedShorts.length === PAGE_SIZE);
      if (mappedShorts.length > 0) {
        setPage(prev => prev + 1);
      }
    } catch (fetchError: any) {
      console.error('Error fetching shorts:', fetchError.message, fetchError.stack);
      setError(`Failed to load shorts. Please check your internet connection or try again.`);
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
      setRefreshing(false);
    }
  }, [page, user, isFetchingMore]);

  // Initial data fetch on component mount
  useEffect(() => {
    fetchShorts(true);
  }, [fetchShorts]);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setActiveIndex(0);
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ animated: false, offset: 0 });
    }
    fetchShorts(true);
  }, [fetchShorts]);

  // Handle reaching the end of the list to load more data
  const handleEndReached = useCallback(() => {
    if (!loading && !isFetchingMore && hasMore) {
      fetchShorts(false);
    }
  }, [loading, isFetchingMore, hasMore, fetchShorts]);

  // Manual navigation function with cooldown to prevent rapid scrolls
  const navigateToShort = useCallback((direction: 'next' | 'previous') => {
    const now = Date.now();
    if (now - lastScrollTime.current < SCROLL_COOLDOWN) {
      return;
    }

    const nextIndex = direction === 'next'
      ? Math.min(activeIndex + 1, shorts.length - 1)
      : Math.max(activeIndex - 1, 0);

    if (nextIndex !== activeIndex && flatListRef.current) {
      lastScrollTime.current = now;
      flatListRef.current.scrollToIndex({
        animated: true,
        index: nextIndex,
        viewPosition: 0,
      });
      setActiveIndex(nextIndex);
    }
  }, [activeIndex, shorts.length, SCROLL_COOLDOWN]);

  // Memoized ShortCard component for performance
  const ShortCard = memo(
    ({
      item,
      isActive,
      isGloballyMuted,
      isGloballyPlaying,
      liked,
      onLike,
      onShare,
      onNavigateToChannel,
      toggleGlobalPlayPause,
      toggleGlobalMute,
      likingInProgress,
    }: {
      item: ShortVideo;
      isActive: boolean;
      isGloballyMuted: boolean;
      isGloballyPlaying: boolean;
      liked: boolean;
      onLike: () => void;
      onShare: () => void;
      onNavigateToChannel: () => void;
      toggleGlobalPlayPause: () => void;
      toggleGlobalMute: () => void;
      likingInProgress: boolean;
    }) => {
      const videoSource = useMemo(() => ({ uri: item.videoUrl }), [item.videoUrl]);

      const handlePlayPausePress = useCallback((e: any) => {
        e.stopPropagation();
        toggleGlobalPlayPause();
      }, [toggleGlobalPlayPause]);

      const handleMutePress = useCallback((e: any) => {
        e.stopPropagation();
        toggleGlobalMute();
      }, [toggleGlobalMute]);

      return (
        <View style={styles.shortCardContainer}>
          <TouchableOpacity
            style={styles.videoTouchable}
            activeOpacity={1}
            onPress={() => {
              // Optional tap-to-pause/play functionality
            }}
          >
            <Video
              source={videoSource}
              style={styles.video}
              resizeMode="cover"
              poster={item.thumbnail || undefined}
              posterResizeMode="cover"
              repeat
              paused={!isGloballyPlaying || !isActive}
              muted={isGloballyMuted}
              playInBackground={false}
              playWhenInactive={false}
              ignoreSilentSwitch="ignore"
              onError={(e: any) => console.error(`Error loading video ${item.id}:`, e.error || e)}
              bufferConfig={{
                minBufferMs: 15000,
                maxBufferMs: 50000,
                bufferForPlaybackMs: 2500,
                bufferForPlaybackAfterRebufferMs: 5000,
              }}
            />
          </TouchableOpacity>

          {/* Top Controls Overlay (Play/Pause, Mute/Unmute) */}
          <View style={styles.topControlsOverlay}>
            <TouchableOpacity
              onPress={handlePlayPausePress}
              style={styles.controlButton}
              activeOpacity={0.7}
            >
              <Icon name={isGloballyPlaying && isActive ? "pause" : "play"} size={26} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleMutePress}
              style={styles.controlButton}
              activeOpacity={0.7}
            >
              <Icon name={isGloballyMuted ? "volume-x" : "volume-2"} size={26} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Bottom Content and Actions Overlay */}
          <View style={styles.overlay}>
            <View style={styles.bottomContent}>
              <TouchableOpacity onPress={onNavigateToChannel} style={styles.channelInfo}>
                <Image source={{ uri: item.channel.avatar }} style={styles.channelAvatar} />
                <View style={styles.channelTextContainer}>
                  <Text style={styles.channelName}>@{item.channel.name}</Text>
                  {item.musicName && <Text style={styles.musicName}>♫ {item.musicName}</Text>}
                </View>
                <TouchableOpacity style={styles.subscribeButton}>
                  <Text style={styles.subscribeText}>Subscribe</Text>
                </TouchableOpacity>
              </TouchableOpacity>
              <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
                {item.description}
              </Text>
            </View>

            <View style={styles.actions}>
              <AnimatedLikeButton
                isLiked={liked}
                onPress={onLike}
                likeCount={item.likes}
                disabled={likingInProgress}
              />
              <TouchableOpacity style={styles.actionButton}>
                <Icon name="message-circle" size={28} color="#FFF" />
                <Text style={styles.actionText}>{item.comments}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={onShare}>
                <Icon name="share-2" size={28} color="#FFF" />
                <Text style={styles.actionText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Icon name="more-horizontal" size={28} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    },
    (prevProps, nextProps) => {
      return (
        prevProps.item.id === nextProps.item.id &&
        prevProps.isActive === nextProps.isActive &&
        prevProps.isGloballyMuted === nextProps.isGloballyMuted &&
        prevProps.isGloballyPlaying === nextProps.isGloballyPlaying &&
        prevProps.liked === nextProps.liked &&
        prevProps.likingInProgress === nextProps.likingInProgress
      );
    }
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background || '#000' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {loading && shorts.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary || '#FF4057'} />
          <Text style={[styles.loadingText, { color: colors.text?.primary || '#FFF' }]}>
            Loading shorts...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color={colors.error || '#FF6B6B'} />
          <Text style={[styles.errorText, { color: colors.error || '#FF6B6B' }]}>{error}</Text>
          <TouchableOpacity
            onPress={() => fetchShorts(true)}
            style={[styles.retryButton, { backgroundColor: colors.primary || '#FF4057' }]}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : shorts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="film" size={48} color="#FFF" />
          <Text style={styles.emptyText}>No shorts available right now.</Text>
          <TouchableOpacity
            onPress={handleRefresh}
            style={[styles.retryButton, { backgroundColor: colors.primary || '#FF4057', marginTop: 20 }]}>
            <Text style={styles.retryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={shorts}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <ShortCard
              item={item}
              isActive={index === activeIndex}
              isGloballyMuted={isGloballyMuted}
              isGloballyPlaying={isGloballyPlaying}
              liked={!!likedShorts[item.id]}
              onLike={useCallback(() => {
                handleLikeShort(item.id, item.channel.id, item.likes);
              }, [item.id, item.channel.id, item.likes])}
              onShare={useCallback(async () => {
                try {
                  await Share.share({ message: `Check out this short by ${item.channel.name}: ${item.videoUrl}` });
                } catch (shareError) {
                  console.error('Error sharing video:', shareError);
                }
              }, [item.channel.name, item.videoUrl])}
              onNavigateToChannel={useCallback(() =>
                navigation.navigate('ChannelProfileScreen' as never, { userId: item.channel.id } as never),
                [item.channel.id, navigation]
              )}
              toggleGlobalPlayPause={toggleGlobalPlayPause}
              toggleGlobalMute={toggleGlobalMute}
              likingInProgress={!!likingShorts[item.id]}
            />
          )}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          snapToInterval={SCREEN_HEIGHT}
          snapToAlignment="start"
          decelerationRate="fast"
          scrollEventThrottle={16}
          bounces={false}
          overScrollMode="never"
          directionalLockEnabled={true}
          disableIntervalMomentum={true}
          scrollEnabled={true}
          nestedScrollEnabled={false}
          getItemLayout={(data, index) => ({
            length: SCREEN_HEIGHT,
            offset: SCREEN_HEIGHT * index,
            index,
          })}
          initialScrollIndex={0}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          windowSize={3}
          maxToRenderPerBatch={2}
          initialNumToRender={1}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.7}
          ListFooterComponent={isFetchingMore ? (
            <ActivityIndicator size="small" color={colors.primary || '#FF4057'} style={styles.footerLoader} />
          ) : !hasMore && shorts.length > 0 ? (
            <Text style={[styles.endOfListText, { color: colors.text?.secondary || '#AAA' }]}>
              You've reached the end!
            </Text>
          ) : null}
          removeClippedSubviews={Platform.OS === 'android'}
        />
      )}

      {/* Manual Navigation Controls */}
      <View style={styles.navigationControls}>
        {activeIndex > 0 && (
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigateToShort('previous')}
          >
            <Icon name="chevron-up" color="#FFF" size={28} />
          </TouchableOpacity>
        )}
        {activeIndex < shorts.length - 1 && (
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigateToShort('next')}
          >
            <Icon name="chevron-down" color="#FFF" size={28} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#FFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
    color: '#FF6B6B',
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 18,
    color: '#FFF',
    textAlign: 'center',
  },
  shortCardContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'relative',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoTouchable: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  topControlsOverlay: {
    position: 'absolute',
    top: (StatusBar.currentHeight || 0) + (Platform.OS === 'ios' ? 20 : 10),
    left: 15,
    right: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 30,
  },
  controlButton: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 90 : 70,
    zIndex: 20,
  },
  bottomContent: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 70,
    left: 16,
    right: 80,
  },
  channelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  channelAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    marginRight: 8,
    backgroundColor: '#333',
  },
  channelTextContainer: {
    flex: 1,
  },
  channelName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  musicName: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subscribeButton: {
    backgroundColor: '#FF4057',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 10,
  },
  subscribeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  description: {
    color: '#FFF',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginTop: 5,
  },
  actions: {
    position: 'absolute',
    right: 10,
    bottom: Platform.OS === 'ios' ? 100 : 80,
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  actionText: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  // Like button styles
  likedHeartGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  unlikedHeartContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  footerLoader: {
    marginVertical: 20,
  },
  endOfListText: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 14,
  },
  navigationControls: {
    position: 'absolute',
    right: 20,
    top: SCREEN_HEIGHT / 2 - 80,
    zIndex: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  }
});

export default TipShorts;