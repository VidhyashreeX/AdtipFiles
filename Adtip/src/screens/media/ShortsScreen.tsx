// src/screens/media/ShortsScreen.tsx
import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Share,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/Feather';

// Components and services
import {useTheme} from '../../contexts/ThemeContext';
import {useShorts} from '../../contexts/ShortsContext';
import ApiService from '../../services/ApiService';
import {ENDPOINTS} from '../../constants/api';
import { createSecureVideoSource } from '../../utils/mediaUtils';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

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

const ShortsScreen = () => {
  const {colors} = useTheme();
  const navigation = useNavigation();
  const {setGlobalPlayState} = useShorts();

  // State variables
  const [activeIndex, setActiveIndex] = useState(0);
  const [shorts, setShorts] = useState<ShortVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Handle viewable items changed for video playback control
  const handleViewableItemsChanged = useRef(({viewableItems}: any) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      if (index !== activeIndex) {
        setActiveIndex(index);
      }
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
    waitForInteraction: false,
    minimumViewTime: 100,
  }).current;

  // Fetch shorts data from API
  const fetchShorts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await ApiService.get(ENDPOINTS.GET_PUBLIC_SHOTS);

      if (!response || !response.data) {
        throw new Error('Failed to load shorts data');
      }

      const publicShots = Array.isArray(response.data)
        ? response.data
        : response.data.status === 200 && response.data.data
          ? response.data.data
          : [];

      const mappedShorts: ShortVideo[] = publicShots.map(
        (shot: PublicShot) => ({
          id: shot.id?.toString() || 'unknown',
          title: shot.name || 'Untitled Short',
          thumbnail:
            shot.video_Thumbnail && shot.video_Thumbnail !== 'undefined'
              ? shot.video_Thumbnail
              : 'https://via.placeholder.com/150',
          channel: {
            id: shot.channelId?.toString() || 'unknown',
            name: shot.channelName || 'Unknown Channel',
            avatar:
              shot.channel_profile && shot.channel_profile !== 'null'
                ? shot.channel_profile
                : 'https://via.placeholder.com/36',
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
              : 'No description available',
          videoUrl: shot.video_link || '',
          comments: shot.total_comments || 0,
        }),
      );

      setShorts(mappedShorts);
    } catch (fetchError) {
      console.error('Error fetching shorts:', fetchError);
      setError('Failed to load shorts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShorts();
  }, []);

  // Handle screen focus/blur for video playback control
  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => {
      console.log('[ShortsScreen] Screen focused - resuming playback');
      setGlobalPlayState(true);
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
      console.log('[ShortsScreen] Screen blurred - pausing playback');
      setGlobalPlayState(false);
    });

    // Component unmount cleanup
    return () => {
      console.log('[ShortsScreen] Component unmounting - stopping all audio');
      setGlobalPlayState(false);
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation, setGlobalPlayState]);

  const handleGoBack = () => {
    navigation.goBack();
  };

  // Individual short video card component
  const ShortCard = ({
    item,
    isActive,
  }: {
    item: ShortVideo;
    isActive: boolean;
  }) => {
    const {isGloballyPlaying} = useShorts();
    const videoRef = useRef<any>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [liked, setLiked] = useState(false);
    const [secureVideoSource, setSecureVideoSource] = useState<any>(null);

    useEffect(() => {
      // Control video playback based on visibility
      if (isActive && !isPlaying) {
        setIsPlaying(true);
      } else if (!isActive && isPlaying) {
        setIsPlaying(false);
      }
    }, [isActive, isPlaying]);

    // Load secure video source
    useEffect(() => {
      const loadSecureVideoSource = async () => {
        if (item.videoUrl) {
          try {
            console.log('[ShortsScreen] Loading secure video source for:', item.videoUrl);
            const secureSource = await createSecureVideoSource(item.videoUrl);
            setSecureVideoSource(secureSource);
            console.log('[ShortsScreen] Secure video source loaded:', secureSource);
          } catch (error) {
            console.error('[ShortsScreen] Failed to load secure video source:', error);
          }
        }
      };

      loadSecureVideoSource();
    }, [item.videoUrl]);

    const togglePlayPause = () => {
      setIsPlaying(!isPlaying);
    };

    const handleLike = () => {
      setLiked(!liked);
      // Here you would call an API to update likes
    };

    const navigateToChannel = () => {
      (navigation as any).navigate('Channel', {channelId: item.channel.id});
    };

    const handleShare = async () => {
      try {
        // Simple share implementation
        // In a real app, you would generate a sharable link
        const shareUrl = `https://adtip.in/shorts/${item.id}`;

        await Share.share({
          message: `Check out this short: ${item.description} ${shareUrl}`,
        });
      } catch (shareError) {
        console.error('Error sharing video:', shareError);
      }
    };

    return (
      <View style={[styles.shortCardContainer, {height: SCREEN_HEIGHT}]}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={togglePlayPause}
          style={styles.videoContainer}>
          {secureVideoSource && (
            <Video
              ref={videoRef}
              source={secureVideoSource}
              style={styles.video}
              resizeMode="cover"
              poster={item.thumbnail || undefined}
              posterResizeMode="cover"
              repeat
              paused={!isPlaying || !isActive || !isGloballyPlaying}
              muted={false}
              volume={1.0}
            />
          )}

          {!isPlaying && (
            <View style={styles.pauseOverlay}>
              <Icon name="play" size={50} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.overlay}>
          <View style={styles.bottomContent}>
            <TouchableOpacity
              onPress={navigateToChannel}
              style={styles.channelInfo}>
              <Text style={styles.channelName}>{item.channel.name}</Text>
            </TouchableOpacity>
            <Text
              style={styles.description}
              numberOfLines={2}
              ellipsizeMode="tail">
              {item.description}
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Icon name="heart" size={28} color={liked ? '#24d05a' : '#FFF'} />
              <Text style={styles.actionText}>{item.likes}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Icon name="message-circle" size={28} color="#FFF" />
              <Text style={styles.actionText}>{item.comments}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Icon name="share-2" size={28} color="#FFF" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <SafeAreaView style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shorts</Text>
        <View style={styles.placeholder} />
      </SafeAreaView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, {color: colors.text.primary}]}>
            Loading shorts...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color="#FFF" />
          <Text style={[styles.errorText, {color: colors.error}]}>{error}</Text>
          <TouchableOpacity
            onPress={fetchShorts}
            style={[styles.retryButton, {backgroundColor: colors.primary}]}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={shorts}
          keyExtractor={item => item.id}
          renderItem={({item, index}) => (
            <ShortCard item={item} isActive={index === activeIndex} />
          )}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          snapToInterval={SCREEN_HEIGHT}
          snapToAlignment="start"
          decelerationRate="fast"
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Icon name="film" size={48} color="#FFF" />
              <Text style={styles.emptyText}>No shorts available</Text>
            </View>
          )}
          getItemLayout={(data, index) => ({
            length: SCREEN_HEIGHT,
            offset: SCREEN_HEIGHT * index,
            index,
          })}
          initialScrollIndex={0}
          maxToRenderPerBatch={2}
          windowSize={3}
          scrollEventThrottle={16}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
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
  },
  emptyText: {
    marginTop: 12,
    fontSize: 18,
    color: '#FFF',
  },
  shortCardContainer: {
    width: SCREEN_WIDTH,
    position: 'relative',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 80, // Space for bottom navigation
  },
  bottomContent: {
    flex: 1,
    position: 'absolute',
    left: 16,
    right: 80,
    bottom: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    borderRadius: 5,
  },
  channelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  channelName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
  description: {
    color: '#FFF',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
  actions: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  actionText: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
});

export default ShortsScreen;
