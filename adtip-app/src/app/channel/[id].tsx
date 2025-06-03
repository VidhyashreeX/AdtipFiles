import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {ArrowLeft, Bell} from 'lucide-react-native';
import VideoCard from '@/components/VideoCard';
import {channels, videos} from '@/utils/dummyData';
import {useUserStore} from '@/store/userStore';

export default function ChannelScreen() {
  const {id} = useLocalSearchParams<{id: string}>();
  const router = useRouter();
  const {isChannelFollowed, followChannel, unfollowChannel} = useUserStore();

  const channel = channels.find(c => c.id === id);
  const channelVideos = videos.filter(v => v.channel.id === id);

  const isFollowing = channel ? isChannelFollowed(channel.id) : false;

  const handleFollow = () => {
    if (!channel) {
      return;
    }

    if (isFollowing) {
      unfollowChannel(channel.id);
    } else {
      followChannel(channel.id);
    }
  };

  const goBack = () => {
    router.back();
  };

  if (!channel) {
    return (
      <SafeAreaView style={styles.notFoundContainer}>
        <Text>Channel not found</Text>
        <TouchableOpacity onPress={goBack}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{channel.name}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView>
        <View style={styles.channelHeader}>
          <Image source={{uri: channel.avatar}} style={styles.channelAvatar} />

          <View style={styles.channelInfo}>
            <Text style={styles.channelName}>
              {channel.name}
              {channel.verified && <Text style={styles.verifiedBadge}> ✓</Text>}
            </Text>
            <Text style={styles.subscriberCount}>
              {channel.subscribers.toLocaleString()} subscribers
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
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

          {isFollowing && (
            <TouchableOpacity style={styles.notificationButton}>
              <Bell size={20} color="#333" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, styles.activeTab]}>
            <Text style={[styles.tabText, styles.activeTabText]}>Videos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Shorts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Playlists</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>About</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.videosContainer}>
          {channelVideos.length > 0 ? (
            channelVideos.map(video => (
              <VideoCard key={video.id} video={video} />
            ))
          ) : (
            <View style={styles.noVideosContainer}>
              <Text style={styles.noVideosText}>
                This channel has no videos yet
              </Text>
            </View>
          )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  channelHeader: {
    padding: 20,
    alignItems: 'center',
  },
  channelAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  channelInfo: {
    alignItems: 'center',
  },
  channelName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  verifiedBadge: {
    color: '#606060',
  },
  subscriberCount: {
    fontSize: 14,
    color: '#606060',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 16,
  },
  followButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#24d05a',
    borderRadius: 20,
    marginHorizontal: 8,
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
  notificationButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#24d05a',
  },
  tabText: {
    fontSize: 14,
    color: '#606060',
  },
  activeTabText: {
    color: '#24d05a',
    fontWeight: '500',
  },
  videosContainer: {
    padding: 16,
  },
  noVideosContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  noVideosText: {
    fontSize: 16,
    color: '#666',
  },
});
