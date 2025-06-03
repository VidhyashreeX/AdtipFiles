import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {Video, ResizeMode} from 'expo-av';
import {useState, useRef, useEffect} from 'react';
import {Heart, MessageCircle, Share2} from 'lucide-react-native';
import {Short} from '@/utils/dummyData';
import {useUserStore} from '@/store/userStore';
import {router} from 'expo-router';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

interface ShortCardProps {
  short: Short;
  isActive: boolean;
}

export default function ShortCard({short, isActive}: ShortCardProps) {
  const insets = useSafeAreaInsets();
  const HEADER_HEIGHT = 60 + insets.top; // Match with ShortsScreen.tsx
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const {isVideoLiked, likeVideo, unlikeVideo} = useUserStore();
  const liked = isVideoLiked(short.id);

  useEffect(() => {
    if (isActive && !isPlaying) {
      videoRef.current?.playAsync();
      setIsPlaying(true);
    } else if (!isActive && isPlaying) {
      videoRef.current?.pauseAsync();
      setIsPlaying(false);
    }
  }, [isActive, isPlaying]);

  const togglePlayPause = () => {
    if (isPlaying) {
      videoRef.current?.pauseAsync();
    } else {
      videoRef.current?.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  const handleLike = () => {
    if (liked) {
      unlikeVideo(short.id);
    } else {
      likeVideo(short.id);
    }
  };

  const navigateToChannel = () => {
    router.push(`/channel/${short.channel.id}`);
  };

  return (
    <View style={[styles.container, {height: SCREEN_HEIGHT}]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={togglePlayPause}
        style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={{uri: short.videoUrl}}
          rate={1.0}
          volume={1.0}
          isMuted={false}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isActive}
          isLooping
          style={[styles.video, {height: SCREEN_HEIGHT}]}
        />
      </TouchableOpacity>

      <View
        style={[
          styles.overlay,
          {paddingTop: HEADER_HEIGHT, paddingBottom: insets.bottom, zIndex: 2},
        ]}>
        <View style={[styles.bottomContent, {bottom: 32 + insets.bottom}]}>
          <TouchableOpacity
            onPress={navigateToChannel}
            style={styles.channelInfo}>
            <Text style={styles.channelName}>{short.channel.name}</Text>
          </TouchableOpacity>
          <Text
            style={styles.description}
            numberOfLines={2}
            ellipsizeMode="tail">
            {short.description}
          </Text>
        </View>

        <View style={[styles.actions, {bottom: 32 + insets.bottom}]}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <Heart
              size={28}
              color={liked ? '#24d05a' : '#FFF'}
              fill={liked ? '#24d05a' : 'transparent'}
            />
            <Text style={styles.actionText}>{short.likes}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <MessageCircle size={28} color="#FFF" />
            <Text style={styles.actionText}>{short.comments}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Share2 size={28} color="#FFF" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    position: 'relative',
    backgroundColor: '#000',
    overflow: 'hidden', // Clip content to prevent overlap
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    width: SCREEN_WIDTH,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    overflow: 'hidden', // Clip content to prevent overlap
  },
  bottomContent: {
    flex: 1,
    position: 'absolute',
    left: 16,
    right: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background for readability
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
