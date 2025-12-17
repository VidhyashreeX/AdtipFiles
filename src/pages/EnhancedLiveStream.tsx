// Enhanced Live Stream List with Real-time Features
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LiveStreamService, { ActiveStream } from '@/services/liveStreamService';
import { useLiveStreamStore } from '@/stores/livestream.store';
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
  Wifi,
  WifiOff,
  Eye,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

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

// Enhanced Stream Card Component with NEW features
const EnhancedStreamCard: React.FC<{
  stream: LiveStreamData;
  onPress: () => void;
}> = ({ stream, onPress }) => {
  const config = streamTypeConfig[stream.streamType] || streamTypeConfig.free;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-300 cursor-pointer",
        "hover:shadow-xl hover:scale-105 hover:border-adtip-teal",
        isHovered && "ring-2 ring-adtip-teal/20"
      )}
      onClick={onPress}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        <img
          src={stream.thumbnail}
          alt={stream.title}
          className="w-full h-48 object-cover"
        />
        
        {/* LIVE Badge with Animation */}
        <Badge className="absolute top-2 left-2 bg-red-600 text-white animate-pulse">
          <div className="w-2 h-2 bg-white rounded-full mr-1 animate-ping"></div>
          LIVE
        </Badge>
        
        {/* Stream Type Badge */}
        <div className="absolute top-2 right-2">
          <Badge className={`${config.bgColor} text-white`}>
            {config.icon} {config.text}
          </Badge>
        </div>

        {/* NEW: Real-time Viewer Count Overlay */}
        <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
          <Eye className="h-3 w-3 text-white" />
          <span className="text-white text-xs font-medium">{stream.viewerCount}</span>
        </div>

        {/* NEW: Enhanced Features Indicator */}
        <div className="absolute bottom-2 right-2 bg-adtip-teal/90 backdrop-blur-sm rounded-full p-1">
          <Zap className="h-3 w-3 text-white" />
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-2">{stream.title}</h3>
        <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1">
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-adtip-teal to-blue-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {stream.streamerName.charAt(0).toUpperCase()}
            </span>
          </div>
          {stream.streamerName}
        </p>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-green-600">
              <Users className="h-4 w-4" />
              <span className="font-medium">{stream.viewerCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 text-blue-600">
              <Clock className="h-4 w-4" />
              <span className="font-medium">{stream.duration}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {stream.pricePerMinute !== undefined && stream.pricePerMinute > 0 && (
              <Badge variant="outline" className="text-xs">
                <IndianRupee className="h-3 w-3 mr-1" />
                ₹{stream.pricePerMinute}/min
              </Badge>
            )}
            {stream.earningsPerMinute !== undefined && stream.earningsPerMinute > 0 && (
              <Badge className="bg-green-100 text-green-800 text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Earn ₹{stream.earningsPerMinute}/min
              </Badge>
            )}
          </div>
        </div>

        {/* NEW: Enhanced Features Preview */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Wifi className="h-3 w-3 text-green-500" />
                Real-time Chat
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3 text-blue-500" />
                Live Updates
              </span>
            </div>
            <Badge variant="secondary" className="text-xs">
              Enhanced ✨
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// NEW: Enhanced Header with Real-time Status
const EnhancedHeader: React.FC<{
  onRefresh: () => void;
  onStartStream: () => void;
  refreshing: boolean;
  streamCount: number;
}> = ({ onRefresh, onStartStream, refreshing, streamCount }) => {
  return (
    <div className="bg-gradient-to-r from-adtip-teal to-[#13b799] text-white border-b sticky top-0 z-10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Video className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Enhanced Live Streams</h1>
              <p className="text-white/80 text-sm">
                Real-time streaming with WebSocket, chat, and balance monitoring
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* NEW: Live Stream Counter */}
            <div className="text-center">
              <div className="text-2xl font-bold">{streamCount}</div>
              <div className="text-xs text-white/80">Live Streams</div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={refreshing}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                onClick={onStartStream}
                className="bg-white text-adtip-teal hover:bg-white/90 font-semibold"
              >
                <Plus className="h-4 w-4 mr-2" />
                Go Live
              </Button>
            </div>
          </div>
        </div>

        {/* NEW: Feature Highlights */}
        <div className="mt-4 flex items-center gap-6 text-sm text-white/90">
          <div className="flex items-center gap-1">
            <Wifi className="h-4 w-4" />
            <span>Real-time WebSocket</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>Live Viewer Counts</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-4 w-4" />
            <span>Balance Monitoring</span>
          </div>
          <div className="flex items-center gap-1">
            <Sparkles className="h-4 w-4" />
            <span>Enhanced Chat</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const EnhancedLiveStream: React.FC = () => {
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
      console.error('[EnhancedLiveStream] Error fetching streams:', err);
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
    // Clear any existing stream state
    useLiveStreamStore.getState().resetStream();
    
    // Navigate to ENHANCED streaming component
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

  const handleViewComparison = () => {
    navigate('/livestream-comparison');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-adtip-teal/10 to-blue-50">
        <div className="text-center">
          <div className="relative">
            <RefreshCw className="h-16 w-16 animate-spin mx-auto mb-4 text-adtip-teal" />
            <div className="absolute inset-0 h-16 w-16 mx-auto border-4 border-adtip-teal/20 rounded-full animate-pulse"></div>
          </div>
          <p className="text-xl font-semibold text-gray-700">Loading Enhanced Streams...</p>
          <p className="text-sm text-gray-500 mt-2">Preparing real-time features</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Enhanced Header */}
      <EnhancedHeader
        onRefresh={() => fetchStreams(true)}
        onStartStream={handleStartStream}
        refreshing={refreshing}
        streamCount={streams.length}
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* NEW: Enhancement Notice */}
        <div className="mb-6">
          <Alert className="border-adtip-teal/20 bg-adtip-teal/5">
            <Zap className="h-4 w-4 text-adtip-teal" />
            <AlertDescription className="text-adtip-teal">
              <strong>✨ Enhanced Experience:</strong> This page now features real-time WebSocket communication, 
              live viewer counts, balance monitoring, and enhanced chat functionality.{' '}
              <button 
                onClick={handleViewComparison}
                className="underline hover:no-underline font-medium"
              >
                View comparison with old version →
              </button>
            </AlertDescription>
          </Alert>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {streams.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="relative mb-8">
              <Video className="h-24 w-24 mx-auto text-gray-300" />
              <div className="absolute -top-2 -right-2 bg-adtip-teal text-white rounded-full p-1">
                <Zap className="h-4 w-4" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-gray-700">No Live Streams Yet</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Be the first to go live with our enhanced streaming platform featuring 
              real-time chat, viewer tracking, and balance monitoring!
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={handleStartStream} size="lg" className="bg-adtip-teal hover:bg-adtip-teal/90">
                <Plus className="h-5 w-5 mr-2" />
                Start Enhanced Stream
              </Button>
              <Button onClick={handleViewComparison} variant="outline" size="lg">
                <Eye className="h-5 w-5 mr-2" />
                See What's New
              </Button>
            </div>
          </div>
        )}

        {/* Enhanced Stream Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {streams.map((stream) => (
            <EnhancedStreamCard
              key={stream.id}
              stream={stream}
              onPress={() => handleStreamPress(stream)}
            />
          ))}
        </div>

        {/* NEW: Features Footer */}
        {streams.length > 0 && (
          <div className="mt-12 text-center">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                🚀 Enhanced Streaming Features
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex flex-col items-center p-3 bg-green-50 rounded-lg">
                  <Wifi className="h-6 w-6 text-green-600 mb-2" />
                  <span className="font-medium">Real-time Chat</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg">
                  <Eye className="h-6 w-6 text-blue-600 mb-2" />
                  <span className="font-medium">Live Updates</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-purple-50 rounded-lg">
                  <Zap className="h-6 w-6 text-purple-600 mb-2" />
                  <span className="font-medium">Balance Monitor</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-orange-50 rounded-lg">
                  <Sparkles className="h-6 w-6 text-orange-600 mb-2" />
                  <span className="font-medium">Enhanced UI</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedLiveStream;