// src/components/home/StatusStoriesRow.tsx - Instagram-like stories section for HomeScreen

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { Plus, Crown, Radio } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import LiveStreamService from '../../services/LiveStreamService';

// Types
interface StatusUser {
  user_id: number;
  user_name: string;
  user_avatar: string | null;
  user_is_premium: boolean;
  has_unviewed: boolean;
  total_statuses: number;
  statuses: StatusItem[];
}

interface StatusItem {
  id: number;
  content: string;
  media_url: string | null;
  media_type: 'text' | 'image' | 'video';
  price_to_view: number;
  is_premium_only: boolean;
  created_at: string;
  expires_at: string;
  has_viewed: boolean;
  view_count: number;
}

interface ActiveStream {
  id: number;
  user_id: number;
  user_name: string;
  user_avatar?: string;
  meeting_id: string;
  title: string;
  viewer_count: number;
  is_private: boolean;
  cost_per_minute: number;
}

interface StatusStoriesRowProps {
  statuses: StatusUser[];
  currentUserId?: number;
  currentUserAvatar?: string;
  currentUserName?: string;
  onCreateStatus: () => void;
  onViewStatus: (userId: number, statuses: StatusItem[]) => void;
  onJoinStream?: (meetingId: string, streamTitle: string) => void;
  isLoading?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const STORY_SIZE = 70;
const STORY_MARGIN = 12;

// Style creator function
const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scrollContent: {
    paddingHorizontal: 8,
    gap: STORY_MARGIN,
  },
  storyContainer: {
    alignItems: 'center',
    width: STORY_SIZE + 10,
  },
  createStoryContainer: {
    alignItems: 'center',
  },
  statusStoryContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  storyBorder: {
    padding: 3,
    borderRadius: (STORY_SIZE + 6) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unviewedBorder: {
    borderWidth: 2.5,
    borderColor: colors.primary,
  },
  viewedBorder: {
    borderWidth: 2.5,
    borderColor: colors.gray[300],
  },
  avatarContainer: {
    position: 'relative',
    width: STORY_SIZE,
    height: STORY_SIZE,
  },
  avatar: {
    width: STORY_SIZE,
    height: STORY_SIZE,
    borderRadius: STORY_SIZE / 2,
    backgroundColor: colors.gray[200],
  },
  placeholderAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[300],
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
  },
  plusButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  premiumBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.warning || '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  paidIndicator: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success || '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  paidIndicatorText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.white || '#FFFFFF',
  },
  countBadge: {
    position: 'absolute',
    top: 5,
    left: -5,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.error || '#F44336',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.white || '#FFFFFF',
  },
  storyLabel: {
    fontSize: 12,
    color: colors.text,
    marginTop: 6,
    textAlign: 'center',
    maxWidth: STORY_SIZE + 10,
  },
  // Skeleton styles
  skeletonStory: {
    alignItems: 'center',
  },
  skeletonBorder: {
    backgroundColor: colors.gray[200],
    borderWidth: 0,
  },
  skeletonAvatar: {
    backgroundColor: colors.gray[300],
  },
  skeletonLabel: {
    width: 50,
    height: 12,
    backgroundColor: colors.gray[300],
    borderRadius: 6,
    marginTop: 6,
  },
  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  // Live stream styles
  liveStreamBorder: {
    borderWidth: 2.5,
    borderColor: '#4CAF50', // Green for live streams
  },
  liveIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  viewerCount: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    minWidth: 20,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  viewerCountText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

// Main component
const StatusStoriesRow: React.FC<StatusStoriesRowProps> = ({
  statuses,
  currentUserId,
  currentUserAvatar, 
  currentUserName,
  onCreateStatus,
  onViewStatus,
  onJoinStream,
  isLoading = false,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const navigation = useNavigation();
  
  // State for active streams
  const [activeStreams, setActiveStreams] = useState<ActiveStream[]>([]);
  const [streamsLoading, setStreamsLoading] = useState(false);

  // Fetch active streams
  const fetchActiveStreams = async () => {
    try {
      setStreamsLoading(true);
      const response = await LiveStreamService.getActiveStreams(1, 10);
      if (response.success && response.data?.streams) {
        setActiveStreams(response.data.streams);
      }
    } catch (error) {
      console.error('Error fetching active streams:', error);
    } finally {
      setStreamsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveStreams();
    // Refresh every 30 seconds to show updated streams
    const interval = setInterval(fetchActiveStreams, 30000);
    return () => clearInterval(interval);
  }, []);

  const renderCreateStoryButton = () => (
    <TouchableOpacity 
      style={styles.storyContainer} 
      onPress={onCreateStatus}
      activeOpacity={0.8}
    >
      <View style={styles.createStoryContainer}>
        <View style={styles.avatarContainer}>
          {currentUserAvatar ? (
            <Image 
              source={{ uri: currentUserAvatar }} 
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.placeholderAvatar]}>
              <Text style={styles.avatarText}>
                {currentUserName?.charAt(0) || 'U'}
              </Text>
            </View>
          )}
          <View style={styles.plusButton}>
            <Plus size={16} color="#FFFFFF" />
          </View>
        </View>
        <Text style={styles.storyLabel} numberOfLines={1}>
          Your Story
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderLiveStream = (stream: ActiveStream, index: number) => {
    const handleJoinStream = () => {
      if (onJoinStream) {
        onJoinStream(stream.meeting_id, stream.title);
      } else {
        // Navigate to live stream screen
        navigation.navigate('LiveStream' as never, { 
          meetingId: stream.meeting_id,
          isHost: false 
        } as never);
      }
    };

    return (
      <TouchableOpacity
        key={`stream-${stream.id}-${index}`}
        style={styles.storyContainer}
        onPress={handleJoinStream}
        activeOpacity={0.8}
      >
        <View style={styles.statusStoryContainer}>
          <View style={[styles.storyBorder, styles.liveStreamBorder]}>
            <View style={styles.avatarContainer}>
              {stream.user_avatar ? (
                <Image 
                  source={{ uri: stream.user_avatar }} 
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.placeholderAvatar]}>
                  <Text style={styles.avatarText}>
                    {stream.user_name?.charAt(0) || 'L'}
                  </Text>
                </View>
              )}
              
              {/* Live indicator */}
              <View style={styles.liveIndicator}>
                <Radio size={10} color="#FFFFFF" />
              </View>
              
              {/* Viewer count */}
              {stream.viewer_count > 0 && (
                <View style={styles.viewerCount}>
                  <Text style={styles.viewerCountText}>{stream.viewer_count}</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.storyLabel} numberOfLines={1}>
            {stream.user_name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderStatusStory = (statusUser: StatusUser, index: number) => {
    const hasUnviewed = statusUser.has_unviewed;
    const isPremiumUser = statusUser.user_is_premium;
    
    return (
      <TouchableOpacity
        key={`status-${statusUser.user_id}-${index}`}
        style={styles.storyContainer}
        onPress={() => onViewStatus(statusUser.user_id, statusUser.statuses)}
        activeOpacity={0.8}
      >
        <View style={styles.statusStoryContainer}>
          <View style={[
            styles.storyBorder,
            hasUnviewed ? styles.unviewedBorder : styles.viewedBorder
          ]}>
            <View style={styles.avatarContainer}>
              {statusUser.user_avatar ? (
                <Image 
                  source={{ uri: statusUser.user_avatar }} 
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.placeholderAvatar]}>
                  <Text style={styles.avatarText}>
                    {statusUser.user_name?.charAt(0) || 'U'}
                  </Text>
                </View>
              )}
              
              {/* Premium badge */}
              {isPremiumUser && (
                <View style={styles.premiumBadge}>
                  <Crown size={10} color="#FFD700" />
                </View>
              )}
              
              {/* Paid status indicator */}
              {statusUser.statuses.some(s => s.price_to_view > 0) && (
                <View style={styles.paidIndicator}>
                  <Text style={styles.paidIndicatorText}>₹</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.storyLabel} numberOfLines={1}>
            {statusUser.user_name}
          </Text>
          
          {/* Status count indicator */}
          {statusUser.total_statuses > 1 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{statusUser.total_statuses}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSkeletonItem = (index: number) => (
    <View key={`skeleton-${index}`} style={styles.storyContainer}>
      <View style={styles.skeletonStory}>
        <View style={[styles.storyBorder, styles.skeletonBorder]}>
          <View style={[styles.avatar, styles.skeletonAvatar]} />
        </View>
        <View style={styles.skeletonLabel} />
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {currentUserId && renderCreateStoryButton()}
          {streamsLoading && Array(2).fill(0).map((_, index) => renderSkeletonItem(index + 100))}
          {Array(5).fill(0).map((_, index) => renderSkeletonItem(index))}
        </ScrollView>
      </View>
    );
  }

  if ((!statuses || statuses.length === 0) && (!activeStreams || activeStreams.length === 0)) {
    return (
      <View style={styles.container}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {currentUserId && renderCreateStoryButton()}
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No stories or live streams available</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {currentUserId && renderCreateStoryButton()}
        {activeStreams.map(renderLiveStream)}
        {statuses.map(renderStatusStory)}
      </ScrollView>
    </View>
  );
};

export default StatusStoriesRow;
export type { StatusUser, StatusItem, StatusStoriesRowProps, ActiveStream };