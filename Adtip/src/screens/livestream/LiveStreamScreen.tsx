import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { Play, Users, Clock, IndianRupee, Plus, Sparkles, Crown, CheckCircle, Zap, Target } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/WalletContext';
import Header from '../../components/common/Header';
import LinearGradient from 'react-native-linear-gradient';

import ApiService from '../../services/ApiService';
import LiveStreamService from '../../services/LiveStreamService';
import EnhancedLiveStreamService from '../../services/EnhancedLiveStreamService';
import { HOME_ENDPOINTS } from '../../constants/apiEndpoints';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

export type StreamType = 'free' | 'influencer' | 'promotional';

interface LiveStream {
  id: string;
  meeting_id: string; // ✅ The actual VideoSDK meeting ID for joining
  title: string;
  streamerName: string;
  thumbnail: string;
  viewerCount: number;
  duration: string;
  streamType: StreamType;
  isLive: boolean;
  pricePerMinute?: number;
  earningsPerMinute?: number;
  user_id?: number;
  user_name?: string;
  user_profile_image?: string;
  media_url?: string;
  created_at?: string;
  product_service_name?: string;
  product_service_description?: string;
}

// Transform API stream data to LiveStream interface
const transformApiStreamToLiveStream = (stream: any): LiveStream => {
  return {
    id: stream.id?.toString() || stream.meeting_id, // Database ID for display
    meeting_id: stream.meeting_id, // ✅ VideoSDK meeting ID for joining
    title: stream.title || 'Live Stream',
    streamerName: stream.streamer_name || 'Anonymous',
    thumbnail: stream.thumbnail_url || stream.profile_image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e',
    viewerCount: stream.viewer_count || 0,
    duration: 'LIVE',
    streamType: stream.stream_type || 'free',
    isLive: true,
    pricePerMinute: stream.cost_per_minute,
    earningsPerMinute: stream.company_pay_per_viewer_per_minute,
    user_id: stream.streamer_id,
    user_name: stream.streamer_name,
    user_profile_image: stream.profile_image,
    created_at: stream.start_time,
    product_service_name: stream.product_service_name,
    product_service_description: stream.product_service_description,
  };
};

const streamTypeConfig = {
  free: {
    gradient: ['#4CAF50', '#45A049'],
    text: 'Free Stream',
    description: 'Watch for free',
    icon: '🎉',
  },
  influencer: {
    gradient: ['#2196F3', '#1976D2'],
    text: 'Influencer',
    description: '₹1/min to watch',
    icon: '⭐',
  },
  promotional: {
    gradient: ['#FF9800', '#F57C00'],
    text: 'Promotional',
    description: 'Earn while watching',
    icon: '💰',
  },
};

// Premium Upgrade Modal Component
interface PremiumUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  colors: any;
}

const PremiumUpgradeModal: React.FC<PremiumUpgradeModalProps> = ({
  visible,
  onClose,
  onUpgrade,
  colors
}) => {
  const premiumFeatures = [
    {
      icon: <IndianRupee size={24} color="#FFD700" />,
      title: 'Monetize Your Streams',
      description: 'Earn money from every minute viewers watch your livestreams'
    },
    {
      icon: <Target size={24} color="#FFD700" />,
      title: 'Promotional Streams',
      description: 'Create targeted promotional livestreams for businesses'
    },
    {
      icon: <Users size={24} color="#FFD700" />,
      title: 'Unlimited Audience',
      description: 'Stream to unlimited viewers with no restrictions'
    },
    {
      icon: <Zap size={24} color="#FFD700" />,
      title: 'Priority Support',
      description: 'Get priority support and exclusive creator features'
    }
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.premiumModalOverlay}>
        <View style={[styles.premiumModalContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.premiumModalHeader}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.premiumHeaderGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Crown size={48} color="white" />
              <Text style={styles.premiumModalTitle}>Content Creator Premium</Text>
              <Text style={styles.premiumModalSubtitle}>
                Unlock professional livestreaming features
              </Text>
            </LinearGradient>
          </View>

          {/* Features List - Scrollable */}
          <ScrollView 
            style={styles.premiumFeaturesScrollView}
            contentContainerStyle={styles.premiumFeaturesContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.premiumSectionTitle, { color: colors.text.primary }]}>
              Why Upgrade to Premium?
            </Text>
            
            {premiumFeatures.map((feature, index) => (
              <View 
                key={index} 
                style={[styles.premiumFeatureItem, { backgroundColor: colors.surface }]}
              >
                <View style={styles.premiumFeatureIcon}>
                  {feature.icon}
                </View>
                <View style={styles.premiumFeatureContent}>
                  <Text style={[styles.premiumFeatureTitle, { color: colors.text.primary }]}>
                    {feature.title}
                  </Text>
                  <Text style={[styles.premiumFeatureDescription, { color: colors.text.secondary }]}>
                    {feature.description}
                  </Text>
                </View>
                <CheckCircle size={20} color="#00C853" />
              </View>
            ))}
          </ScrollView>

          {/* Action Buttons */}
          <View style={[styles.premiumModalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.premiumCancelButton, { borderColor: colors.border }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.premiumCancelButtonText, { color: colors.text.secondary }]}>
                Maybe Later
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.premiumUpgradeButton}
              onPress={onUpgrade}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.premiumUpgradeButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Crown size={20} color="white" />
                <Text style={styles.premiumUpgradeButtonText}>
                  Upgrade Now
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
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
            {stream.streamType === 'influencer' && stream.pricePerMinute && (
              <View style={styles.statItem}>
                <IndianRupee size={14} color={colors.error} />
                <Text style={[styles.statText, { color: colors.error }]}>
                  ₹{stream.pricePerMinute}/min
                </Text>
              </View>
            )}
            {stream.streamType === 'promotional' && stream.earningsPerMinute && (
              <View style={styles.statItem}>
                <IndianRupee size={14} color={colors.success} />
                <Text style={[styles.statText, { color: colors.success }]}>
                  +₹{stream.earningsPerMinute}/min
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
  const [showStreamTypeModal, setShowStreamTypeModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Filter streams based on active filter
  const filteredStreams = activeFilter === 'all' 
    ? streams 
    : streams.filter(stream => stream.streamType === activeFilter);

  // Calculate stream counts
  const streamCounts = {
    all: streams.length,
    free: streams.filter(s => s.streamType === 'free').length,
    influencer: streams.filter(s => s.streamType === 'influencer').length,
    promotional: streams.filter(s => s.streamType === 'promotional').length,
  };

  const loadStreams = useCallback(async () => {
    try {
      setLoading(true);
      
      // Use EnhancedLiveStreamService to get all active streams
      const response = await EnhancedLiveStreamService.getAllActiveStreams(user?.id, 1, 20);
      
      if (response.success && response.data && response.data.streams && Array.isArray(response.data.streams)) {
        // Transform API data using the helper function
        const liveStreams = response.data.streams.map(transformApiStreamToLiveStream);
        setStreams(liveStreams);
      } else {
        console.warn('No active streams found');
        setStreams([]);
      }
    } catch (error) {
      console.error('Failed to load active streams:', error);
      // Fallback to original service if enhanced service fails
      try {
        const fallbackResponse = await LiveStreamService.getActiveStreams(1, 20);
        if (fallbackResponse.success && fallbackResponse.data?.streams) {
          const liveStreams = fallbackResponse.data.streams.map((stream: any): LiveStream => {
            let streamType: StreamType = 'free';
            if (parseFloat(stream.cost_per_minute) > 0) {
              streamType = 'influencer';
            }

            return {
              id: stream.meeting_id || stream.id?.toString() || Math.random().toString(),
              title: stream.title || 'Live Stream',
              streamerName: stream.streamer_name || 'Anonymous',
              thumbnail: stream.profile_image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e',
              viewerCount: stream.viewer_count || 0,
              duration: 'LIVE',
              streamType,
              isLive: true,
              pricePerMinute: parseFloat(stream.cost_per_minute) || undefined,
              user_id: stream.streamer_id || stream.user_id,
              user_name: stream.streamer_name,
            };
          });
          setStreams(liveStreams);
        } else {
          setStreams([]);
        }
      } catch (fallbackError) {
        console.error('Fallback service also failed:', fallbackError);
        setStreams([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadStreams();
  }, [loadStreams]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadStreams();
  }, [loadStreams]);

  // ✅ DUPLICATE JOIN FIX: Use useRef instead of useState for synchronous checking
  const joiningStreamRef = useRef<string | null>(null);

  const handleStreamPress = useCallback(async (stream: LiveStream) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to watch live streams.');
      return;
    }

    // ✅ SYNCHRONOUS duplicate join prevention using ref (not async state)
    if (joiningStreamRef.current === stream.meeting_id) {
      console.log('[LiveStreamScreen] Already joining this stream, ignoring duplicate press');
      return;
    }

    // ✅ CHECK WALLET BALANCE for influencer streams
    if (stream.streamType === 'influencer') {
      const walletBalance = parseFloat(balance) || 0;
      console.log('[LiveStreamScreen] Checking wallet balance for influencer stream:', {
        streamType: stream.streamType,
        walletBalance: walletBalance,
        required: 1
      });

      if (walletBalance < 1) {
        Alert.alert(
          'Insufficient Balance',
          `You need at least ₹1 in your wallet to join this stream. Your current balance is ₹${walletBalance.toFixed(2)}.`,
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Add Funds',
              onPress: () => {
                (navigation as any).navigate('AddFunds');
              }
            }
          ]
        );
        return;
      }
    }

    joiningStreamRef.current = stream.meeting_id;

    try {
      console.log('[LiveStreamScreen] Joining live stream:', {
        id: stream.id,
        meeting_id: stream.meeting_id // ✅ Log both IDs for debugging
      });
      
      // ✅ Use meeting_id (VideoSDK ID) for joining, NOT id (database ID)
      const joinResponse = await LiveStreamService.joinStream(user.id, stream.meeting_id);
      
      console.log('[LiveStreamScreen] Join response:', {
        success: joinResponse.success,
        message: joinResponse.message,
        hasData: !!joinResponse.data,
        dataKeys: joinResponse.data ? Object.keys(joinResponse.data) : []
      });
      
      // LiveStreamService returns: { success, message, data: {token, stream_info} }
      // The 'data' property contains the actual response from ApiService.joinLiveStream
      // which is {token, stream_info}
      const streamData = joinResponse.data;
      
      console.log('[LiveStreamScreen] streamData:', streamData);
      console.log('[LiveStreamScreen] Token:', streamData?.token ? `${streamData.token.substring(0, 20)}...` : 'Missing');
      
      if (joinResponse.success && streamData?.token) {
        console.log('[LiveStreamScreen] Successfully joined stream, navigating to LiveStreaming');
        // Navigate to the proper live streaming interface as viewer
        // ✅ Use meeting_id for navigation
        (navigation as any).navigate('LiveStreaming', {
          meetingId: stream.meeting_id,
          token: streamData.token,
          isHost: false,
          streamTitle: stream.title,
          streamType: stream.streamType
        });
      } else {
        console.error('[LiveStreamScreen] Join failed - missing token or unsuccessful');
        Alert.alert('Error', joinResponse.message || 'Failed to join the live stream. Please try again.');
      }
    } catch (error) {
      console.error('[LiveStreamScreen] Error joining stream:', error);
      Alert.alert('Error', 'Failed to join the live stream. Please try again.');
    } finally {
      joiningStreamRef.current = null;
    }
  }, [user, navigation, balance]);

  const handleStartStream = useCallback(() => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to start live streaming.');
      return;
    }
    
    // Check if user has content creator premium
    const hasContentCreatorPremium = user.content_creator_plan_id > 0;
    
    if (!hasContentCreatorPremium) {
      // Show premium upgrade modal
      setShowPremiumModal(true);
      return;
    }
    
    // User has premium, show stream type selection
    setShowStreamTypeModal(true);
  }, [user]);

  const handleStreamTypeSelect = useCallback((streamType: StreamType) => {
    setShowStreamTypeModal(false);
    
    try {
      console.log(`[LiveStreamScreen] Creating ${streamType} stream`);
      // Navigate to GoLive screen with pre-selected stream type
      (navigation as any).navigate('GoLive', { initialStreamType: streamType });
    } catch (error) {
      console.error('[LiveStreamScreen] Navigation error to GoLive:', error);
      Alert.alert('Error', 'Failed to open stream creation. Please try again.');
    }
  }, [navigation]);

  const handleUpgradeToPremium = useCallback(() => {
    setShowPremiumModal(false);
    // Navigate to Content Creator Subscription screen
    (navigation as any).navigate('ContentCreatorSubscriptionScreen');
  }, [navigation]);

  const handleClosePremiumModal = useCallback(() => {
    setShowPremiumModal(false);
  }, []);

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
            {/* HIDDEN: Free Stream Filter - commented out to hide from UI */}
            {/* <FilterButton
              type="free"
              label="Free"
              count={streamCounts.free}
              isActive={activeFilter === 'free'}
              onPress={() => setActiveFilter('free')}
              colors={colors}
            /> */}
            <FilterButton
              type="influencer"
              label="Influencer"
              count={streamCounts.influencer}
              isActive={activeFilter === 'influencer'}
              onPress={() => setActiveFilter('influencer')}
              colors={colors}
            />
            <FilterButton
              type="promotional"
              label="Promotional"
              count={streamCounts.promotional}
              isActive={activeFilter === 'promotional'}
              onPress={() => setActiveFilter('promotional')}
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

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fabButton, { backgroundColor: colors.primary }]}
        onPress={handleStartStream}
        activeOpacity={0.8}
      >
        <Plus size={24} color="white" />
      </TouchableOpacity>

      {/* Premium Upgrade Modal */}
      <PremiumUpgradeModal
        visible={showPremiumModal}
        onClose={handleClosePremiumModal}
        onUpgrade={handleUpgradeToPremium}
        colors={colors}
      />

      {/* Stream Type Selection Modal */}
      <Modal
        visible={showStreamTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStreamTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              Choose Stream Type
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.text.secondary }]}>
              Select how you want to go live
            </Text>

            {/* HIDDEN: Free Stream Option - commented out to hide from UI */}
            {/* <TouchableOpacity
              style={[styles.streamTypeOption, { borderColor: colors.border }]}
              onPress={() => handleStreamTypeSelect('free')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={streamTypeConfig.free.gradient}
                style={styles.streamTypeGradient}
              >
                <Text style={styles.modalStreamTypeIcon}>{streamTypeConfig.free.icon}</Text>
              </LinearGradient>
              <View style={styles.streamTypeInfo}>
                <Text style={[styles.streamTypeTitle, { color: colors.text.primary }]}>
                  Free Live Stream
                </Text>
                <Text style={[styles.streamTypeDescription, { color: colors.text.secondary }]}>
                  Anyone can join and watch for free
                </Text>
              </View>
            </TouchableOpacity> */}

            {/* Influencer Stream Option */}
            <TouchableOpacity
              style={[styles.streamTypeOption, { borderColor: colors.border }]}
              onPress={() => handleStreamTypeSelect('influencer')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={streamTypeConfig.influencer.gradient}
                style={styles.streamTypeGradient}
              >
                <Text style={styles.modalStreamTypeIcon}>{streamTypeConfig.influencer.icon}</Text>
              </LinearGradient>
              <View style={styles.streamTypeInfo}>
                <Text style={[styles.streamTypeTitle, { color: colors.text.primary }]}>
                  Influencer Stream
                </Text>
                <Text style={[styles.streamTypeDescription, { color: colors.text.secondary }]}>
                  Viewers pay ₹1 per minute to watch
                </Text>
              </View>
            </TouchableOpacity>

            {/* Promotional Stream Option */}
            <TouchableOpacity
              style={[styles.streamTypeOption, { borderColor: colors.border }]}
              onPress={() => handleStreamTypeSelect('promotional')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={streamTypeConfig.promotional.gradient}
                style={styles.streamTypeGradient}
              >
                <Text style={styles.modalStreamTypeIcon}>{streamTypeConfig.promotional.icon}</Text>
              </LinearGradient>
              <View style={styles.streamTypeInfo}>
                <Text style={[styles.streamTypeTitle, { color: colors.text.primary }]}>
                  Promotional Stream
                </Text>
                <Text style={[styles.streamTypeDescription, { color: colors.text.secondary }]}>
                  Company pays, viewers earn money
                </Text>
              </View>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={() => setShowStreamTypeModal(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text.secondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  fabButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  streamTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  streamTypeGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  modalStreamTypeIcon: {
    fontSize: 24,
  },
  streamTypeInfo: {
    flex: 1,
  },
  streamTypeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  streamTypeDescription: {
    fontSize: 14,
  },
  cancelButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Premium Modal Styles
  premiumModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  premiumModalContainer: {
    maxHeight: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  premiumModalHeader: {
    overflow: 'hidden',
  },
  premiumHeaderGradient: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  premiumModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
    textAlign: 'center',
  },
  premiumModalSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    marginTop: 6,
    textAlign: 'center',
  },
  premiumFeaturesScrollView: {
    flex: 1,
  },
  premiumFeaturesContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 30,
  },
  premiumSectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  premiumFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  premiumFeatureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  premiumFeatureContent: {
    flex: 1,
    marginRight: 10,
  },
  premiumFeatureTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  premiumFeatureDescription: {
    fontSize: 13,
    lineHeight: 17,
  },
  premiumModalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  premiumCancelButton: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumCancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  premiumUpgradeButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  premiumUpgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    gap: 8,
  },
  premiumUpgradeButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default LiveStreamScreen;