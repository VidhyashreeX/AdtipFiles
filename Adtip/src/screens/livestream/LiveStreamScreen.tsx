import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { Play, Users, Clock, IndianRupee, Plus, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/WalletContext';
import Header from '../../components/common/Header';
import LinearGradient from 'react-native-linear-gradient';

import ApiService from '../../services/ApiService';
import LiveStreamService from '../../services/LiveStreamService';
import { HOME_ENDPOINTS } from '../../constants/apiEndpoints';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

export type StreamType = 'free' | 'promote' | 'celebrate';

interface LiveStream {
  id: string;
  title: string;
  streamerName: string;
  thumbnail: string;
  viewerCount: number;
  duration: string;
  streamType: StreamType;
  isLive: boolean;
  pricePerMinute?: number;
  user_id?: number;
  user_name?: string;
  user_profile_image?: string;
  media_url?: string;
  created_at?: string;
}

// Transform post data to stream data
const transformPostToStream = (post: any): LiveStream => {
  // Determine stream type based on post properties
  let streamType: StreamType = 'free';
  if (post.is_promoted) {
    streamType = 'promote';
  } else if (post.is_premium) {
    streamType = 'celebrate';
  }

  return {
    id: post.id?.toString() || Math.random().toString(),
    title: post.title || post.content || 'Live Stream',
    streamerName: post.user_name || 'Anonymous',
    thumbnail: post.media_url || post.user_profile_image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e',
    viewerCount: Math.floor(Math.random() * 10000) + 100, // Random viewer count for demo
    duration: 'LIVE',
    streamType,
    isLive: true,
    pricePerMinute: streamType === 'promote' ? 2 : streamType === 'celebrate' ? 3 : undefined,
    user_id: post.user_id,
    user_name: post.user_name,
    user_profile_image: post.user_profile_image,
    media_url: post.media_url,
    created_at: post.created_at,
  };
};

const streamTypeConfig = {
  free: {
    gradient: ['#4CAF50', '#45A049'],
    text: 'Free Stream',
    description: 'Watch for free',
    icon: '🎉',
  },
  promote: {
    gradient: ['#FF6B35', '#FF8E53'],
    text: 'Product Promo',
    description: 'Get paid to watch',
    icon: '💰',
  },
  celebrate: {
    gradient: ['#9C27B0', '#E91E63'],
    text: 'Celebration',
    description: 'Pay to celebrate',
    icon: '🎊',
  },
};

// Stream Card Component
const StreamCard: React.FC<{
  stream: LiveStream;
  onPress: () => void;
  colors: any;
  isDarkMode: boolean;
}> = ({ stream, onPress, colors, isDarkMode }) => {
  const config = streamTypeConfig[stream.streamType];
  
  return (
    <TouchableOpacity 
      style={[styles.streamCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.streamCardContent}>
        <View style={styles.thumbnailContainer}>
          <Image source={{ uri: stream.thumbnail }} style={styles.thumbnail} />
          {stream.isLive && (
            <View style={[styles.liveBadge, { backgroundColor: '#FF3B30' }]}>
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
          <View style={styles.streamTypeOverlay}>
            <LinearGradient
              colors={config.gradient}
              style={styles.streamTypeBadge}
            >
              <Text style={styles.streamTypeIcon}>{config.icon}</Text>
              <Text style={styles.streamTypeText}>{config.text}</Text>
            </LinearGradient>
          </View>
        </View>
        
        <View style={styles.streamInfo}>
          <Text style={[styles.streamTitle, { color: colors.text.primary }]} numberOfLines={2}>
            {stream.title}
          </Text>
          <Text style={[styles.streamerName, { color: colors.text.secondary }]}>
            {stream.streamerName}
          </Text>
          
          <View style={styles.streamStats}>
            <View style={styles.statItem}>
              <Users size={14} color={colors.text.tertiary} />
              <Text style={[styles.statText, { color: colors.text.tertiary }]}>
                {stream.viewerCount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Clock size={14} color={colors.text.tertiary} />
              <Text style={[styles.statText, { color: colors.text.tertiary }]}>
                {stream.duration}
              </Text>
            </View>
            {stream.pricePerMinute && (
              <View style={styles.statItem}>
                <IndianRupee size={14} color={colors.primary} />
                <Text style={[styles.statText, { color: colors.primary }]}>
                  ₹{stream.pricePerMinute}/min
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Filter Button Component
const FilterButton: React.FC<{
  type: StreamType | 'all';
  label: string;
  count: number;
  isActive: boolean;
  onPress: () => void;
  colors: any;
}> = ({ type, label, count, isActive, onPress, colors }) => {
  return (
    <TouchableOpacity
      style={[
        styles.filterButton,
        {
          backgroundColor: isActive ? colors.primary : colors.card,
          borderColor: isActive ? colors.primary : colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.filterButtonText,
          { color: isActive ? colors.white : colors.text.primary },
        ]}
      >
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );
};

interface LiveStreamScreenProps {
  userId?: number;
  isHost?: boolean;
  meetingId?: string;
  token?: string;
  streamTitle?: string;
}

const LiveStreamScreen: React.FC<LiveStreamScreenProps> = ({
  userId,
  isHost = false,
  meetingId,
  token,
  streamTitle,
}) => {
  const navigation = useNavigation();
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { balance } = useWallet();
  const insets = useSafeAreaInsets();

  const [activeFilter, setActiveFilter] = useState<StreamType | 'all'>('all');
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filter streams based on active filter
  const filteredStreams = activeFilter === 'all' 
    ? streams 
    : streams.filter(stream => stream.streamType === activeFilter);

  // Calculate stream counts
  const streamCounts = {
    all: streams.length,
    free: streams.filter(s => s.streamType === 'free').length,
    promote: streams.filter(s => s.streamType === 'promote').length,
    celebrate: streams.filter(s => s.streamType === 'celebrate').length,
  };

  const loadStreams = useCallback(async () => {
    try {
      setLoading(true);
      
      // Use LiveStreamService to get active streams from the proper API endpoint
      const response = await LiveStreamService.getActiveStreams(1, 20);
      
      if (response.success && response.data && response.data.streams && Array.isArray(response.data.streams)) {
        // Transform live streams data to our UI format
        const liveStreams = response.data.streams.map((stream: any): LiveStream => ({
          id: stream.id?.toString() || Math.random().toString(),
          title: stream.title || 'Live Stream',
          streamerName: stream.streamer_name || 'Anonymous',
          thumbnail: stream.thumbnail || 'https://images.unsplash.com/photo-1542751371-adc38448a05e',
          viewerCount: stream.viewer_count || 0,
          duration: 'LIVE',
          streamType: stream.cost_per_minute > 0 ? 'promote' : 'free',
          isLive: true,
          pricePerMinute: stream.cost_per_minute || undefined,
          user_id: stream.user_id,
          user_name: stream.streamer_name,
        }));
        
        setStreams(liveStreams);
      } else {
        console.warn('No active streams found');
        setStreams([]);
      }
    } catch (error) {
      console.error('Failed to load active streams:', error);
      setStreams([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStreams();
  }, [loadStreams]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadStreams();
  }, [loadStreams]);

  const handleStreamPress = useCallback((stream: LiveStream) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to watch live streams.');
      return;
    }

    // TODO: Navigate to live stream player or join stream
    Alert.alert(
      'Join Stream',
      `Join ${stream.streamerName}'s live stream: ${stream.title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Join', onPress: () => console.log('Joining stream:', stream.id) }
      ]
    );
  }, [user]);

  const handleStartStream = useCallback(() => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to start live streaming.');
      return;
    }

    try {
      console.log('[LiveStreamScreen] Navigating to start live stream');
      // Get the root navigation to avoid tab navigation conflicts
      const rootNavigation = navigation.getParent();
      if (rootNavigation) {
        console.log('[LiveStreamScreen] Using root navigation');
        (rootNavigation as any).navigate('LiveStream', { mode: 'host' });
      } else {
        console.log('[LiveStreamScreen] Using direct navigation');
        (navigation as any).navigate('LiveStream', { mode: 'host' });
      }
    } catch (error) {
      console.error('[LiveStreamScreen] Navigation error to LiveStream:', error);
      Alert.alert('Error', 'Failed to start live streaming. Please try again.');
    }
  }, [user, navigation]);

  const renderStreamCard = useCallback(({ item }: { item: LiveStream }) => (
    <StreamCard
      stream={item}
      onPress={() => handleStreamPress(item)}
      colors={colors}
      isDarkMode={isDarkMode}
    />
  ), [handleStreamPress, colors, isDarkMode]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title="Live Streaming"
        showSearch={false}
        showWallet={true}
        showPremium={true}
      />
      
      <View style={[styles.content, { paddingBottom: 60 + Math.min(insets.bottom, 20) }]}>
        {/* Header Section */}
        <View style={[styles.headerSection, { backgroundColor: colors.card }]}>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
              Live Streams
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
              Watch, earn, and connect with creators
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.startStreamButton, { backgroundColor: colors.primary }]}
            onPress={handleStartStream}
            activeOpacity={0.8}
          >
            <Plus size={20} color={colors.white} />
            <Text style={[styles.startStreamText, { color: colors.white }]}>
              Go Live
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={styles.filtersSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContainer}
          >
            <FilterButton
              type="all"
              label="All"
              count={streamCounts.all}
              isActive={activeFilter === 'all'}
              onPress={() => setActiveFilter('all')}
              colors={colors}
            />
            <FilterButton
              type="free"
              label="Free"
              count={streamCounts.free}
              isActive={activeFilter === 'free'}
              onPress={() => setActiveFilter('free')}
              colors={colors}
            />
            <FilterButton
              type="promote"
              label="Promo"
              count={streamCounts.promote}
              isActive={activeFilter === 'promote'}
              onPress={() => setActiveFilter('promote')}
              colors={colors}
            />
            <FilterButton
              type="celebrate"
              label="Celebrate"
              count={streamCounts.celebrate}
              isActive={activeFilter === 'celebrate'}
              onPress={() => setActiveFilter('celebrate')}
              colors={colors}
            />
          </ScrollView>
        </View>

        {/* Streams Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
              Loading streams...
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredStreams}
            renderItem={renderStreamCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={filteredStreams.length > 1 ? styles.gridRow : null}
            contentContainerStyle={[styles.streamsContainer, { paddingBottom: 20 }]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Sparkles size={48} color={colors.text.tertiary} />
                <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
                  No Live Streams
                </Text>
                <Text style={[styles.emptyMessage, { color: colors.text.secondary }]}>
                  Be the first to start streaming or check back later for live content!
                </Text>
                <TouchableOpacity
                  style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                  onPress={handleStartStream}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.emptyButtonText, { color: colors.white }]}>
                    Start Streaming
                  </Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  startStreamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  startStreamText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filtersSection: {
    paddingVertical: 12,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  streamsContainer: {
    padding: 16,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  streamCard: {
    width: (screenWidth - 48) / 2,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  streamCardContent: {
    flex: 1,
  },
  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  liveBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  streamTypeOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  streamTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  streamTypeIcon: {
    fontSize: 12,
  },
  streamTypeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  streamInfo: {
    padding: 12,
  },
  streamTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    lineHeight: 18,
  },
  streamerName: {
    fontSize: 12,
    marginBottom: 8,
  },
  streamStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default LiveStreamScreen;