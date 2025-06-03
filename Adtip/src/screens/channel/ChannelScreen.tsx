// src/screens/channel/ChannelScreen.tsx
import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import type {RootStackParamList} from '../../types/navigation';
import Icon from 'react-native-vector-icons/Feather';
import {useTheme} from '../../contexts/ThemeContext';
import Header from '../../components/common/Header';

interface ChannelInfo {
  id: string;
  name: string;
  username: string;
  avatar: string;
  banner: string;
  description: string;
  subscriberCount: number;
  videoCount: number;
  totalViews: number;
  isSubscribed: boolean;
  isVerified: boolean;
  joinedDate: string;
}

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: number;
  uploadDate: string;
  description: string;
}

const ChannelScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const {colors} = useTheme();
  const [loading, setLoading] = useState(true);
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedTab, setSelectedTab] = useState<'videos' | 'about'>('videos');
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Get channel ID from route params
  const channelId = (route.params as any)?.channelId || 'default';

  // Fix: Move loadChannelData definition above useEffect and wrap in useCallback
  const loadChannelData = useCallback(async () => {
    try {
      setLoading(true);

      // Mock channel data - replace with actual API call
      const mockChannelInfo: ChannelInfo = {
        id: channelId,
        name: 'Adtip Creator',
        username: '@adtipcreator',
        avatar: 'https://via.placeholder.com/100',
        banner: 'https://via.placeholder.com/400x150',
        description:
          'Welcome to my channel! I create amazing content about technology, tips, and tutorials.',
        subscriberCount: 125000,
        videoCount: 234,
        totalViews: 5600000,
        isSubscribed: false,
        isVerified: true,
        joinedDate: '2023-01-15',
      };

      const mockVideos: Video[] = [
        {
          id: '1',
          title: 'Getting Started with React Native',
          thumbnail: 'https://via.placeholder.com/200x120',
          duration: '15:32',
          views: 45000,
          uploadDate: '2024-05-20',
          description: 'Learn the basics of React Native development...',
        },
        {
          id: '2',
          title: 'Advanced Mobile App Development',
          thumbnail: 'https://via.placeholder.com/200x120',
          duration: '22:45',
          views: 32000,
          uploadDate: '2024-05-15',
          description: 'Deep dive into advanced mobile development concepts...',
        },
      ];

      setChannelInfo(mockChannelInfo);
      setVideos(mockVideos);
    } catch (error) {
      console.error('Error loading channel data:', error);
      Alert.alert('Error', 'Failed to load channel information');
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  useEffect(() => {
    loadChannelData();
  }, [loadChannelData]);

  const handleSubscribe = async () => {
    if (!channelInfo) {
      return;
    }

    try {
      setIsSubscribing(true);

      // Mock API call - replace with actual subscription logic
      await new Promise(resolve => setTimeout(resolve, 1000));

      setChannelInfo(prev =>
        prev
          ? {
              ...prev,
              isSubscribed: !prev.isSubscribed,
              subscriberCount: prev.isSubscribed
                ? prev.subscriberCount - 1
                : prev.subscriberCount + 1,
            }
          : null,
      );
    } catch (error) {
      console.error('Error subscribing/unsubscribing:', error);
      Alert.alert('Error', 'Failed to update subscription');
    } finally {
      setIsSubscribing(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const renderVideoItem = ({item}: {item: Video}) => (
    <TouchableOpacity
      style={[styles.videoItem, {borderBottomColor: colors.border}]}
      onPress={() => navigation.navigate('Video', {postId: Number(item.id)})}>
      <Image source={{uri: item.thumbnail}} style={styles.videoThumbnail} />
      <View style={styles.videoDuration}>
        <Text style={styles.videoDurationText}>{item.duration}</Text>
      </View>
      <View style={styles.videoInfo}>
        <Text
          style={[styles.videoTitle, {color: colors.text.primary}]}
          numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.videoStats, {color: colors.text.secondary}]}>
          {formatNumber(item.views)} views • {item.uploadDate}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderAboutTab = () => (
    <View style={styles.aboutContainer}>
      <Text style={[styles.aboutTitle, {color: colors.text.primary}]}>
        About
      </Text>
      <Text style={[styles.aboutDescription, {color: colors.text.secondary}]}>
        {channelInfo?.description}
      </Text>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, {color: colors.text.primary}]}>
            {formatNumber(channelInfo?.subscriberCount || 0)}
          </Text>
          <Text style={[styles.statLabel, {color: colors.text.secondary}]}>
            Subscribers
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, {color: colors.text.primary}]}>
            {formatNumber(channelInfo?.videoCount || 0)}
          </Text>
          <Text style={[styles.statLabel, {color: colors.text.secondary}]}>
            Videos
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, {color: colors.text.primary}]}>
            {formatNumber(channelInfo?.totalViews || 0)}
          </Text>
          <Text style={[styles.statLabel, {color: colors.text.secondary}]}>
            Total Views
          </Text>
        </View>
      </View>

      <Text style={[styles.joinedDate, {color: colors.text.secondary}]}>
        Joined {channelInfo?.joinedDate}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <Header title="Channel" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!channelInfo) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <Header title="Channel" showBackButton />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, {color: colors.text.secondary}]}>
            Channel not found
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Header title="Channel" showBackButton />

      <ScrollView style={styles.content}>
        {/* Channel Banner */}
        <Image source={{uri: channelInfo.banner}} style={styles.banner} />

        {/* Channel Info */}
        <View
          style={[styles.channelHeader, {backgroundColor: colors.background}]}>
          <View style={styles.channelInfoRow}>
            <Image source={{uri: channelInfo.avatar}} style={styles.avatar} />
            <View style={styles.channelDetails}>
              <View style={styles.channelNameRow}>
                <Text
                  style={[styles.channelName, {color: colors.text.primary}]}>
                  {channelInfo.name}
                </Text>
                {channelInfo.isVerified && (
                  <Icon
                    name="check-circle"
                    size={18}
                    color={colors.primary}
                    style={styles.verifiedIcon}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.channelUsername,
                  {color: colors.text.secondary},
                ]}>
                {channelInfo.username}
              </Text>
              <Text
                style={[
                  styles.subscriberCount,
                  {color: colors.text.secondary},
                ]}>
                {formatNumber(channelInfo.subscriberCount)} subscribers
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.subscribeButton,
              {
                backgroundColor: channelInfo.isSubscribed
                  ? colors.border
                  : colors.primary,
              },
            ]}
            onPress={handleSubscribe}
            disabled={isSubscribing}>
            {isSubscribing ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text
                style={[
                  styles.subscribeButtonText,
                  {
                    color: channelInfo.isSubscribed
                      ? colors.text.primary
                      : colors.white,
                  },
                ]}>
                {channelInfo.isSubscribed ? 'Subscribed' : 'Subscribe'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View
          style={[
            styles.tabContainer,
            {borderBottomColor: colors.border},
          ]}>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'videos' && styles.activeTab,
              selectedTab === 'videos' && {borderBottomColor: colors.primary},
            ]}
            onPress={() => setSelectedTab('videos')}>
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    selectedTab === 'videos'
                      ? colors.primary
                      : colors.text.secondary,
                },
              ]}>
              Videos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'about' && styles.activeTab,
              selectedTab === 'about' && {borderBottomColor: colors.primary},
            ]}
            onPress={() => setSelectedTab('about')}>
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    selectedTab === 'about'
                      ? colors.primary
                      : colors.text.secondary,
                },
              ]}>
              About
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {selectedTab === 'videos' ? (
          <FlatList
            data={videos}
            renderItem={renderVideoItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          renderAboutTab()
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  banner: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  channelHeader: {
    padding: 16,
  },
  channelInfoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  channelDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  channelNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  channelUsername: {
    fontSize: 14,
    marginTop: 2,
  },
  subscriberCount: {
    fontSize: 14,
    marginTop: 4,
  },
  subscribeButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  subscribeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  videoItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
  },
  videoThumbnail: {
    width: 120,
    height: 68,
    borderRadius: 8,
    marginRight: 12,
  },
  videoDuration: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoDurationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  videoInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  videoStats: {
    fontSize: 12,
  },
  aboutContainer: {
    padding: 16,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  aboutDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  joinedDate: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default ChannelScreen;
