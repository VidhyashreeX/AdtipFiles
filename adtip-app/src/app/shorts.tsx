import {useState, useRef, useEffect} from 'react';
import {StyleSheet, View, FlatList, Dimensions, Text} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft} from 'lucide-react-native';
import {TouchableOpacity} from 'react-native';
import {StatusBar} from 'expo-status-bar';
import {router} from 'expo-router';
import ShortCard from '@/components/ShortCard';
import Constants from 'expo-constants';

const API_URL =
  Constants.expoConfig?.extra?.VITE_API_URL || 'https://api.adtip.in';

const {height: SCREEN_HEIGHT, width: SCREEN_WIDTH} = Dimensions.get('window');

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

export default function ShortsScreen() {
  const insets = useSafeAreaInsets();
  const HEADER_HEIGHT = 60 + insets.top; // Dynamic header height with safe area
  const ITEM_HEIGHT = SCREEN_HEIGHT; // Use SCREEN_HEIGHT for snapping
  const [activeIndex, setActiveIndex] = useState(0);
  const [shorts, setShorts] = useState<ShortVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const handleViewableItemsChanged = useRef(
    ({viewableItems}: {viewableItems: any[]}) => {
      if (viewableItems.length > 0) {
        const index = viewableItems[0].index;
        if (index !== activeIndex) {
          setActiveIndex(index);
          flatListRef.current?.scrollToIndex({index, animated: false});
        }
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
    waitForInteraction: false,
    minimumViewTime: 100,
  }).current;

  const fetchShorts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/getpublicshots`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const publicShots = Array.isArray(data)
        ? data
        : data.status === 200 && data.data
          ? data.data
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
    } catch (error) {
      console.error('Error fetching shorts:', error);
      setError('Failed to load shorts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShorts();
  }, []);

  const goBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView
        style={[styles.header, {height: HEADER_HEIGHT}]}
        edges={['top']}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shorts</Text>
        <View style={styles.placeholder} />
      </SafeAreaView>

      {loading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchShorts} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={shorts}
          keyExtractor={item => item.id}
          renderItem={({item, index}) => (
            <ShortCard short={item} isActive={index === activeIndex} />
          )}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          snapToInterval={ITEM_HEIGHT}
          snapToAlignment="start"
          decelerationRate="fast"
          contentContainerStyle={styles.shortsContainer} // Removed paddingTop
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>No shorts available.</Text>
          )}
          getItemLayout={(data, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
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
}

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
    zIndex: 20, // Increased zIndex to ensure header stays above content
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Added background for visibility
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
  shortsContainer: {
    flexGrow: 1,
  },
  loadingText: {
    flex: 1,
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#FFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: 'red',
  },
  emptyText: {
    flex: 1,
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#FFF',
  },
  retryButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#24d05a',
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
});
