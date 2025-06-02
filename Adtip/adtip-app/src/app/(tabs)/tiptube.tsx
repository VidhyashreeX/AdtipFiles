import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import Header from '@/components/Header';
import CategorySelector from '@/components/CategorySelector';
import VideoCard from '@/components/VideoCard';
import PromotionCard from '@/components/PromotionCard';
import { Heart, Share2 } from 'lucide-react-native';
import { router } from 'expo-router';

// API and base URLs
const API_URL = Constants.expoConfig?.extra?.VITE_API_URL || 'https://api.adtip.in';
const BASE_IMAGE_URL = 'https://api.adtip.in';
const PUBSCALE_BASE_URL = 'https://wow.pubscale.com';
const PUBSCALE_APP_ID = '39604779';

// Define interfaces
interface Channel {
  id: string;
  name: string;
  avatar: string;
  verified: boolean;
  subscribers: number;
}

interface VideoCardVideo {
  id: string;
  title: string;
  thumbnail: string | null;
  channel: Channel;
  views: number;
  likes: number;
  duration: string;
  isLive?: boolean;
  createdAt: string;
  category: string;
  isPaidPromotional?: boolean;
  postedAt: string;
  description: string;
  videoUrl: string;
  comments: number;
}

interface PremiumPost {
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

interface PublicVideo {
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

interface ShortsRowItem {
  type: 'shorts';
  shorts: VideoCardVideo[];
}

type ListItem = VideoCardVideo | ShortsRowItem;

// ShortsRow component
const ShortsRow = ({ shorts }: { shorts: VideoCardVideo[] }) => {
  const [likedShorts, setLikedShorts] = useState<{ [key: string]: boolean }>({});
  const [likesCount, setLikesCount] = useState<{ [key: string]: number }>(
    shorts.reduce((acc, short) => ({ ...acc, [short.id]: short.likes }), {})
  );

  const handleShortPress = (short: VideoCardVideo, index: number) => {
    router.push({
      pathname: '/shorts',
      params: {
        initialIndex: index.toString(),
        shorts: JSON.stringify(shorts),
      },
    });
  };

  const handleLikePress = (short: VideoCardVideo) => {
    const isLiked = likedShorts[short.id] || false;
    setLikedShorts((prev) => ({ ...prev, [short.id]: !isLiked }));
    setLikesCount((prev) => ({
      ...prev,
      [short.id]: isLiked ? prev[short.id] - 1 : prev[short.id] + 1,
    }));
  };

  const handleSharePress = (short: VideoCardVideo) => {
    console.log(`Sharing short: ${short.title}`);
  };

  return (
    <View style={styles.shortsRowContainer}>
      {shorts.slice(0, 2).map((short, index) => (
        <TouchableOpacity
          key={short.id}
          style={styles.shortContainer}
          onPress={() => handleShortPress(short, index)}
        >
          <Image
            source={{ uri: short.thumbnail || 'https://via.placeholder.com/150' }}
            style={styles.shortThumbnail}
            resizeMode="cover"
          />
          <View style={styles.shortOverlay}>
            <Text style={styles.shortCaption} numberOfLines={2} ellipsizeMode="tail">
              {short.description}
            </Text>
            <View style={styles.shortIcons}>
              <TouchableOpacity
                onPress={() => handleLikePress(short)}
                style={styles.iconButton}
              >
                <Heart
                  size={16}
                  color="#FFF"
                  fill={likedShorts[short.id] ? '#FFF' : 'transparent'}
                />
                <Text style={styles.shortIconText}>{likesCount[short.id]}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleSharePress(short)}
                style={styles.iconButton}
              >
                <Share2 size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default function TipTubeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('1');
  const [videos, setVideos] = useState<VideoCardVideo[]>([]);
  const [listData, setListData] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  // Function to open Pubscale URL
  const openLink = async () => {
    const userId = 'guest'; // Fallback for userId
    const finalUrl = `${PUBSCALE_BASE_URL}?app_id=${PUBSCALE_APP_ID}&user_id=${userId}`;

    try {
      const supported = await Linking.canOpenURL(finalUrl);
      if (supported) {
        await Linking.openURL(finalUrl);
        console.log('Pubscale URL opened successfully');
        return true;
      } else {
        console.log('Cannot open URL:', finalUrl);
        return false;
      }
    } catch (e) {
      console.error('Failed to launch URL:', e);
      return false;
    }
  };

  // Function to show the dialog
  const showCreditedDialog = () => {
    setShowDialog(true);
  };

  // Function to handle "Watch & Earn" button press
  const handleReferPress = () => {
    showCreditedDialog();
  };

  // Function to handle dialog button press
  const handleDialogButtonPress = async () => {
    setShowDialog(false);
    await openLink();
  };

  const handlePlayToEarnPress = () => {
    console.log('Play to Earn pressed');
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const premiumResponse = await fetch(`${API_URL}/api/list-premium-posts`);
      if (!premiumResponse.ok) {
        throw new Error(`Premium posts HTTP error! status: ${premiumResponse.status}`);
      }
      const premiumData = await premiumResponse.json();
      const premiumPosts = Array.isArray(premiumData) ? premiumData : premiumData.status === 200 && premiumData.data ? premiumData.data : [];

      const publicVideosResponse = await fetch(`${API_URL}/api/getpublicvideos/0/2`);
      if (!publicVideosResponse.ok) {
        throw new Error(`Public videos HTTP error! status: ${publicVideosResponse.status}`);
      }
      const publicVideosData = await publicVideosResponse.json();
      const publicVideos = Array.isArray(publicVideosData) ? publicVideosData : publicVideosData.status === 200 && publicVideosData.data ? publicVideosData.data : [];

      const publicShotsResponse = await fetch(`${API_URL}/api/getpublicshots`);
      if (!publicShotsResponse.ok) {
        throw new Error(`Public shots HTTP error! status: ${publicShotsResponse.status}`);
      }
      const publicShotsData = await publicShotsResponse.json();
      const publicShots = Array.isArray(publicShotsData) ? publicShotsData : publicShotsData.status === 200 && publicShotsData.data ? publicShotsData.data : [];

      const mapToVideoCard = (post: PremiumPost | PublicVideo | PublicShot): VideoCardVideo => {
        let thumbnail: string | null = null;
        if (post.video_Thumbnail && post.video_Thumbnail !== 'undefined' && post.video_Thumbnail.trim() !== '') {
          if (post.video_Thumbnail.startsWith('http')) {
            thumbnail = post.video_Thumbnail;
          } else if (post.video_Thumbnail.startsWith('/')) {
            thumbnail = `${BASE_IMAGE_URL}${post.video_Thumbnail}`;
          } else {
            thumbnail = `${BASE_IMAGE_URL}/${post.video_Thumbnail}`;
          }
        }

        return {
          id: post.id?.toString() || 'unknown',
          title: post.name || 'Untitled Post',
          thumbnail,
          channel: {
            id: post.channelId?.toString() || 'unknown',
            name: post.channelName || 'Unknown Channel',
            avatar: post.channel_profile && post.channel_profile !== 'null' ? post.channel_profile : 'https://via.placeholder.com/36',
            verified: false,
            subscribers: post.total_channel_followers || 0,
          },
          views: post.total_views || 0,
          likes: post.total_likes || 0,
          duration: post.play_duration || '0:00',
          isLive: false,
          createdAt: post.createddate || new Date().toISOString(),
          category: post.category_id?.toString() || '1',
          isPaidPromotional: post.is_paid_promotional === 1,
          postedAt: post.createddate || new Date().toISOString(),
          description: post.video_description && post.video_description !== 'undefined' ? post.video_description : 'No description available',
          videoUrl: post.video_link || '',
          comments: post.total_comments || 0,
        };
      };

      const mappedVideos: VideoCardVideo[] = [
        ...premiumPosts.map(mapToVideoCard),
        ...publicVideos.map(mapToVideoCard),
        ...publicShots.map(mapToVideoCard),
      ].filter(video => video.thumbnail !== null);

      const filteredVideos = selectedCategory === '1' ? mappedVideos : mappedVideos.filter(video => video.category === selectedCategory);
      setVideos(filteredVideos);

      const newListData: ListItem[] = [];
      const shorts = publicShots.map(mapToVideoCard).filter(video => video.thumbnail !== null);
      let shortIndex = 0;

      filteredVideos.forEach((video, index) => {
        newListData.push(video);
        if ((index + 1) % 3 === 0 && shortIndex < shorts.length) {
          const shortsPair = shorts.slice(shortIndex, shortIndex + 2);
          if (shortsPair.length > 0) {
            newListData.push({ type: 'shorts', shorts: shortsPair });
          }
          shortIndex += 2;
        }
      });

      setListData(newListData);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setError('Failed to load videos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory]);

  useEffect(() => {
    console.log('List Data state updated:', listData);
  }, [listData]);

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
  };

  const renderItem = ({ item }: { item: ListItem }) => {
    if ('type' in item && item.type === 'shorts') {
      return <ShortsRow shorts={item.shorts} />;
    }
    return <VideoCard video={item as VideoCardVideo} />;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header activeTab="shorts" />
      <CategorySelector onSelectCategory={handleSelectCategory} />
      {loading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <>
          <FlatList
            data={listData}
            keyExtractor={(item, index) =>
              'type' in item ? `shorts-${index}` : (item as VideoCardVideo).id.toString()
            }
            renderItem={renderItem}
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            ListHeaderComponent={() => (
              <View>
                <PromotionCard
                  title="Watch & Earn"
                  description="Complete tasks to earn rewards. Tap to install now!"
                  image="https://images.pexels.com/photos/6694543/pexels-photo-6694543.jpeg"
                  buttonText="Refer Now"
                  onPress={handleReferPress}
                  backgroundColor="#E0F7FA"
                />
                <PromotionCard
                  title="Play to Earn!"
                  description="Play Ludo and earn real money. Start with just ₹10!"
                  buttonText="Play Now"
                  onPress={handlePlayToEarnPress}
                  backgroundColor="#FFF3E0"
                />
              </View>
            )}
            ListEmptyComponent={() => (
              <Text style={styles.emptyText}>No videos available.</Text>
            )}
          />
          <Modal
            animationType="fade"
            transparent={true}
            visible={showDialog}
            onRequestClose={() => setShowDialog(false)}
          >
            <View style={styles.dialogContainer}>
              <View style={styles.dialog}>
                <Image
                  source={{ uri: 'https://via.placeholder.com/150' }}
                  style={styles.dialogImage}
                  resizeMode="cover"
                />
                <Text style={styles.dialogText}>
                  Do you want to earn money? Tap on Earn to visit the website
                </Text>
                <Pressable
                  style={styles.dialogButton}
                  onPress={handleDialogButtonPress}
                >
                  <Text style={styles.dialogButtonText}>Earn</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  videoList: {
    padding: 16,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: 'red',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  shortsRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  shortContainer: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  shortThumbnail: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
  },
  shortOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  shortCaption: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  shortIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 16,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shortIconText: {
    color: '#FFF',
    fontSize: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  dialogContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialog: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    width: '80%',
    alignItems: 'center',
  },
  dialogImage: {
    width: 150,
    height: 150,
    borderRadius: 12,
    marginBottom: 8,
  },
  dialogText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  dialogButton: {
    backgroundColor: '#FF9500',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  dialogButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});