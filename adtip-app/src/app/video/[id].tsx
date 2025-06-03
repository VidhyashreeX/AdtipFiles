import {useEffect, useState, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Video} from 'expo-av';
import {
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  Share2,
  Heart,
} from 'lucide-react-native';
import VideoCard from '@/components/VideoCard';
import {videos} from '@/utils/dummyData';
import {useUserStore} from '@/store/userStore';

export default function VideoScreen() {
  const {id} = useLocalSearchParams<{id: string}>();
  const router = useRouter();
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState({});
  const {
    isVideoLiked,
    likeVideo,
    unlikeVideo,
    isChannelFollowed,
    followChannel,
    unfollowChannel,
  } = useUserStore();

  const video = videos.find(v => v.id === id);
  const recommendedVideos = videos.filter(v => v.id !== id).slice(0, 5);

  const isLiked = video ? isVideoLiked(video.id) : false;
  const isFollowing = video ? isChannelFollowed(video.channel.id) : false;

  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.unloadAsync();
      }
    };
  }, []);

  if (!video) {
    return (
      <SafeAreaView style={styles.notFoundContainer}>
        <Text>Video not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleLike = () => {
    if (isLiked) {
      unlikeVideo(video.id);
    } else {
      likeVideo(video.id);
    }
  };

  const handleFollow = () => {
    if (isFollowing) {
      unfollowChannel(video.channel.id);
    } else {
      followChannel(video.channel.id);
    }
  };

  const navigateToChannel = () => {
    router.push(`/channel/${video.channel.id}`);
  };

  const goBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={{uri: video.videoUrl}}
            rate={1.0}
            volume={1.0}
            isMuted={false}
            resizeMode="contain"
            shouldPlay
            useNativeControls
            style={styles.video}
            onPlaybackStatusUpdate={status => setStatus(() => status)}
          />
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.videoTitle}>{video.title}</Text>
          <Text style={styles.viewsText}>
            {video.views.toLocaleString()} views •{' '}
            {new Date(video.postedAt).toLocaleDateString()}
          </Text>

          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <ThumbsUp
                size={22}
                color={isLiked ? '#FF0000' : '#333'}
                fill={isLiked ? '#FF0000' : 'transparent'}
              />
              <Text style={[styles.actionText, isLiked && styles.activeText]}>
                {video.likes.toLocaleString()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <MessageSquare size={22} color="#333" />
              <Text style={styles.actionText}>
                {video.comments.toLocaleString()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Share2 size={22} color="#333" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.channelSection}
          onPress={navigateToChannel}>
          <Image
            source={{uri: video.channel.avatar}}
            style={styles.channelAvatar}
          />
          <View style={styles.channelInfo}>
            <Text style={styles.channelName}>
              {video.channel.name}
              {video.channel.verified && (
                <Text style={styles.verifiedBadge}> ✓</Text>
              )}
            </Text>
            <Text style={styles.subscriberCount}>
              {video.channel.subscribers.toLocaleString()} subscribers
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.followingButton]}
            onPress={handleFollow}>
            <Text
              style={[
                styles.followButtonText,
                isFollowing && styles.followingButtonText,
              ]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>

        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionText}>{video.description}</Text>
        </View>

        <View style={styles.recommendedSection}>
          <Text style={styles.recommendedTitle}>Recommended videos</Text>
          {recommendedVideos.map(recommendedVideo => (
            <VideoCard key={recommendedVideo.id} video={recommendedVideo} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backLink: {
    color: '#FF0000',
    fontSize: 16,
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 8,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
  },
  infoSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  viewsText: {
    fontSize: 14,
    color: '#606060',
    marginBottom: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    color: '#606060',
    marginTop: 4,
  },
  activeText: {
    color: '#FF0000',
  },
  channelSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  channelAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  channelInfo: {
    flex: 1,
    marginLeft: 12,
  },
  channelName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  verifiedBadge: {
    color: '#606060',
  },
  subscriberCount: {
    fontSize: 14,
    color: '#606060',
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FF0000',
    borderRadius: 20,
  },
  followingButton: {
    backgroundColor: '#EEEEEE',
  },
  followButtonText: {
    color: '#FFF',
    fontWeight: '500',
  },
  followingButtonText: {
    color: '#000',
  },
  descriptionSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#000',
  },
  recommendedSection: {
    padding: 16,
  },
  recommendedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});
