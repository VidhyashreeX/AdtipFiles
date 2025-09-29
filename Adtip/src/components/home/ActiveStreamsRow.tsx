// src/components/home/ActiveStreamsRow.tsx - Live streaming status component
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { Video, Zap, Users, Eye } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import LiveStreamService from '../../services/LiveStreamService';
import Logger from '../../utils/logger';

const { width: screenWidth } = Dimensions.get('window');
const STREAM_ITEM_WIDTH = screenWidth * 0.28;
const STREAM_ITEM_MARGIN = 8;

interface ActiveStream {
  id?: number;
  user_id?: number;
  meeting_id: string;
  title: string;
  user_name?: string;
  streamer_name?: string; // Backend might return this instead of user_name
  user_profile_image?: string;
  profile_picture?: string; // Backend might return this instead
  viewer_count: number;
  cost_per_minute: number;
  is_private?: boolean;
  start_time: string;
  status?: string;
}

interface ActiveStreamsRowProps {
  onJoinStream?: (meetingId: string, streamTitle: string) => void;
  refreshTrigger?: number;
}

const ActiveStreamsRow: React.FC<ActiveStreamsRowProps> = ({
  onJoinStream,
  refreshTrigger = 0
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  
  const [activeStreams, setActiveStreams] = useState<ActiveStream[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadActiveStreams = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      Logger.info('ActiveStreamsRow', 'Loading active streams...');
      const response = await LiveStreamService.getActiveStreams(1, 10);
      
      if (response.success && response.data?.streams) {
        // Validate and clean the streams data
        const validStreams = response.data.streams.filter((stream: any) => 
          stream && 
          stream.meeting_id && 
          stream.title
        ).map((stream: any): ActiveStream => ({
          ...stream,
          id: stream.id || Date.now() + Math.random(), // Generate ID if missing
          user_name: stream.user_name || stream.streamer_name || 'Unknown',
          viewer_count: stream.viewer_count || 0,
          cost_per_minute: stream.cost_per_minute || 0,
          is_private: stream.is_private || false
        }));
        
        setActiveStreams(validStreams);
        Logger.info('ActiveStreamsRow', `Loaded ${validStreams.length} active streams`, validStreams);
      } else {
        setActiveStreams([]);
        Logger.info('ActiveStreamsRow', 'No active streams found');
      }
    } catch (error) {
      Logger.error('ActiveStreamsRow', 'Failed to load active streams:', error);
      setError('Failed to load streams');
      setActiveStreams([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load streams on component mount and when refresh trigger changes
  useEffect(() => {
    loadActiveStreams();
  }, [loadActiveStreams, refreshTrigger]);

  // Auto-refresh every 30 seconds when component is visible
  useEffect(() => {
    const interval = setInterval(() => {
      loadActiveStreams();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadActiveStreams]);

  const handleJoinStream = useCallback(async (stream: ActiveStream) => {
    try {
      if (!user) {
        Alert.alert(
          'Login Required',
          'Please login to join live streams.',
          [{ text: 'OK' }]
        );
        return;
      }

      if (stream.is_private) {
        Alert.alert(
          'Private Stream',
          'This is a private stream. Contact the streamer for access.',
          [{ text: 'OK' }]
        );
        return;
      }

      Logger.info('ActiveStreamsRow', `Joining stream: ${stream.meeting_id}`);
      
      // Call parent callback if provided
      if (onJoinStream) {
        onJoinStream(stream.meeting_id, stream.title);
      } else {
        // Navigate to live stream screen with join parameters
        (navigation as any).navigate('LiveStream', {
          meetingId: stream.meeting_id,
          isHost: false,
          streamTitle: stream.title,
          streamerName: stream.user_name || stream.streamer_name || 'Unknown'
        });
      }
    } catch (error) {
      Logger.error('ActiveStreamsRow', 'Failed to join stream:', error);
      Alert.alert(
        'Join Failed',
        'Failed to join the live stream. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [user, navigation, onJoinStream]);

  const renderStreamItem = useCallback(({ item: stream }: { item: ActiveStream }) => (
    <TouchableOpacity
      style={[styles.streamItem, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => handleJoinStream(stream)}
      activeOpacity={0.8}
    >
      {/* Live indicator */}
      <View style={[styles.liveIndicator, { backgroundColor: '#FF4444' }]}>
        <Zap size={10} color="white" />
        <Text style={styles.liveText}>LIVE</Text>
      </View>

      {/* Stream thumbnail / placeholder */}
      <View style={[styles.streamThumbnail, { backgroundColor: colors.surface }]}>
        {(stream.user_profile_image || stream.profile_picture) ? (
          <Image
            source={{ uri: stream.user_profile_image || stream.profile_picture }}
            style={styles.streamerAvatar}
          />
        ) : (
          <Video size={24} color={colors.text.secondary} />
        )}
      </View>

      {/* Stream info */}
      <View style={styles.streamInfo}>
        <Text
          style={[styles.streamTitle, { color: colors.text.primary }]}
          numberOfLines={2}
        >
          {stream.title || 'Live Stream'}
        </Text>
        
        <Text
          style={[styles.streamerName, { color: colors.text.secondary }]}
          numberOfLines={1}
        >
          {stream.user_name || stream.streamer_name || 'Unknown'}
        </Text>

        <View style={styles.streamStats}>
          <View style={styles.statItem}>
            <Eye size={12} color={colors.text.secondary} />
            <Text style={[styles.statText, { color: colors.text.secondary }]}>
              {stream.viewer_count || 0}
            </Text>
          </View>
          
          {!stream.is_private && stream.cost_per_minute && (
            <View style={styles.statItem}>
              <Text style={[styles.costText, { color: colors.primary }]}>
                ₹{stream.cost_per_minute}/min
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  ), [colors, handleJoinStream]);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerLeft}>
        <Zap size={18} color="#FF4444" />
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Live Streams
        </Text>
        {activeStreams.length > 0 && (
          <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.countText}>{activeStreams.length}</Text>
          </View>
        )}
      </View>
      
      {isLoading && (
        <ActivityIndicator size="small" color={colors.primary} />
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Video size={32} color={colors.text.secondary} />
      <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
        No live streams at the moment
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.text.tertiary }]}>
        Start your own stream to be the first!
      </Text>
    </View>
  );

  if (error && activeStreams.length === 0) {
    return null; // Don't show the section if there's an error and no streams
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderHeader()}
      
      {activeStreams.length > 0 ? (
        <FlatList
          data={activeStreams}
          keyExtractor={(item, index) => item.id?.toString() || item.meeting_id || `stream-${index}`}
          renderItem={renderStreamItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.streamsList}
          ItemSeparatorComponent={() => <View style={{ width: STREAM_ITEM_MARGIN }} />}
        />
      ) : !isLoading ? (
        renderEmptyState()
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading streams...
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  countBadge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  streamsList: {
    paddingHorizontal: 4,
  },
  streamItem: {
    width: STREAM_ITEM_WIDTH,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  liveIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 1,
  },
  liveText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  streamThumbnail: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streamerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  streamInfo: {
    padding: 8,
  },
  streamTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  streamerName: {
    fontSize: 12,
    marginBottom: 6,
  },
  streamStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 11,
    marginLeft: 4,
  },
  costText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
});

export default ActiveStreamsRow;