// src/pages/LiveStream.tsx - Live Streaming List Page

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LiveStreamService, { ActiveStream } from '@/services/liveStreamService';
import {
  Play,
  Users,
  Clock,
  IndianRupee,
  Plus,
  Sparkles,
  Video,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

type StreamType = 'free' | 'influencer' | 'promotional';

interface LiveStreamData {
  id: string;
  meeting_id: string;
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

const streamTypeConfig = {
  free: {
    gradient: 'from-green-500 to-green-600',
    text: 'Free Stream',
    description: 'Watch for free',
    icon: '🎉',
    bgColor: 'bg-green-500',
  },
  influencer: {
    gradient: 'from-blue-500 to-blue-600',
    text: 'Influencer',
    description: '₹1/min to watch',
    icon: '⭐',
    bgColor: 'bg-blue-500',
  },
  promotional: {
    gradient: 'from-orange-500 to-orange-600',
    text: 'Promotional',
    description: 'Earn while watching',
    icon: '💰',
    bgColor: 'bg-orange-500',
  },
};

// Transform API stream data to LiveStreamData interface
const transformApiStreamToLiveStream = (stream: ActiveStream): LiveStreamData => {
  return {
    id: stream.id?.toString() || stream.meeting_id,
    meeting_id: stream.meeting_id,
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

// Stream Card Component
const StreamCard: React.FC<{
  stream: LiveStreamData;
  onPress: () => void;
}> = ({ stream, onPress }) => {
  const config = streamTypeConfig[stream.streamType] || streamTypeConfig.free;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={onPress}>
      <div className="relative">
        <img
          src={stream.thumbnail}
          alt={stream.title}
          className="w-full h-48 object-cover"
        />
        {stream.isLive && (
          <Badge className="absolute top-2 left-2 bg-red-600 text-white">
            LIVE
          </Badge>
        )}
        <div className="absolute top-2 right-2">
          <Badge className={`${config.bgColor} text-white`}>
            {config.icon} {config.text}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-2">{stream.title}</h3>
        <p className="text-sm text-muted-foreground mb-3">{stream.streamerName}</p>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{stream.viewerCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{stream.duration}</span>
          </div>
          {stream.pricePerMinute !== undefined && (
            <div className="flex items-center gap-1">
              <IndianRupee className="h-4 w-4" />
              <span>₹{stream.pricePerMinute}/min</span>
            </div>
          )}
          {stream.earningsPerMinute !== undefined && stream.earningsPerMinute > 0 && (
            <div className="flex items-center gap-1 text-green-600">
              <Sparkles className="h-4 w-4" />
              <span>Earn ₹{stream.earningsPerMinute}/min</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const LiveStream: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [streams, setStreams] = useState<LiveStreamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStreams = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      if (!user?.id) {
        setError('Please login to view live streams');
        return;
      }

      const response = await LiveStreamService.getAllActiveStreams(user.id, 1, 20);

      if (response.success && response.data?.streams) {
        const transformedStreams = response.data.streams.map(transformApiStreamToLiveStream);
        setStreams(transformedStreams);
      } else {
        setStreams([]);
      }
    } catch (err: any) {
      console.error('[LiveStream] Error fetching streams:', err);
      setError(err.message || 'Failed to load streams');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchStreams();
  }, [fetchStreams]);

  const handleStreamPress = (stream: LiveStreamData) => {
    navigate('/live-streaming', {
      state: {
        meetingId: stream.meeting_id,
        token: '', // Will be fetched when joining
        isHost: false,
        streamTitle: stream.title,
        streamType: stream.streamType,
      },
    });
  };

  const handleStartStream = () => {
    navigate('/start-stream');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading live streams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Live Streams</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchStreams(true)}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={handleStartStream}>
                <Plus className="h-4 w-4 mr-2" />
                Go Live
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {streams.length === 0 && !loading && (
          <div className="text-center py-12">
            <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No Live Streams</h2>
            <p className="text-muted-foreground mb-6">Be the first to go live!</p>
            <Button onClick={handleStartStream}>
              <Plus className="h-4 w-4 mr-2" />
              Start Streaming
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {streams.map((stream) => (
            <StreamCard
              key={stream.id}
              stream={stream}
              onPress={() => handleStreamPress(stream)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveStream;
