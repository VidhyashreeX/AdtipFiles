// app/video.tsx
import { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import Constants from 'expo-constants';
import VideoCard from '@/components/VideoCard';
import { useLocalSearchParams } from 'expo-router';

const API_URL = Constants.expoConfig?.extra?.VITE_API_URL || 'https://api.adtip.in';
const BASE_IMAGE_URL = 'https://api.adtip.in';

interface VideoCardVideo {
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
  isLive?: boolean;
  createdAt: string;
  category: string;
  isPaidPromotional?: boolean;
  postedAt: string;
  description: string;
  videoUrl: string;
  comments: number;
}

export default function VideoPlayerScreen() {
  const { video } = useLocalSearchParams();
  const parsedVideo: VideoCardVideo | null = video ? JSON.parse(video as string) : null;
  const videoRef = useRef<Video>(null);
  const [recommendedVideos, setRecommendedVideos] = useState<VideoCardVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecommendedVideos = async () => {
    if (!parsedVideo) return;
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/getpublicvideos/0/10?category=${parsedVideo.category}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const videos = Array.isArray(data) ? data : data.status === 200 && data.data ? data.data : [];
      console.log('Recommended Videos:', videos.map((v: any) => ({ id: v.id, video_Thumbnail: v.video_Thumbnail })));

      const mapToVideoCard = (post: any): VideoCardVideo => {
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
        console.log(`Mapping thumbnail for recommended post ${post.id}:`, thumbnail);

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
          postedAt: post.createddate || new Date().toISOString(),
          description: post.video_description && post.video_description !== 'undefined' ? post.video_description : 'No description available',
          videoUrl: post.video_link || '',
          comments: post.total_comments || 0,
        };
      };

      const mappedVideos = videos
        .filter((v: any) => v.id.toString() !== parsedVideo.id)
        .map(mapToVideoCard);

      setRecommendedVideos(mappedVideos);
    } catch (error) {
      console.error('Error fetching recommended videos:', error);
      setError('Failed to load recommended videos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendedVideos();
  }, [parsedVideo?.category]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRecommendedVideos().finally(() => setRefreshing(false));
  };

  if (!parsedVideo) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Video data not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={{ uri: parsedVideo.videoUrl }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls
          shouldPlay
          isLooping
          onError={(error) => console.error('Video error:', error)}
        />
        <View style={styles.videoInfo}>
          <Text style={styles.title}>{parsedVideo.title}</Text>
          <Text style={styles.channel}>{parsedVideo.channel.name}</Text>
          <Text style={styles.meta}>
            {parsedVideo.views} views • {new Date(parsedVideo.createdAt).toLocaleDateString()}
          </Text>
          <Text style={styles.description}>{parsedVideo.description}</Text>
        </View>
      </View>
      <Text style={styles.recommendedTitle}>Recommended Videos</Text>
      {loading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={recommendedVideos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <VideoCard video={item} />}
          contentContainerStyle={styles.recommendedList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>No recommended videos available.</Text>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  videoContainer: {
    backgroundColor: '#000',
    paddingBottom: 16,
  },
  video: {
    width: '100%',
    height: 200,
  },
  videoInfo: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  channel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  meta: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
  },
  recommendedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    margin: 16,
    color: '#000',
  },
  recommendedList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
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
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});