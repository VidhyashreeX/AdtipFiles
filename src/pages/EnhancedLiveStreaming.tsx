// Enhanced Live Streaming Component with Real-time Features
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MeetingProvider, useMeeting, useParticipant } from '@videosdk.live/react-sdk';
import { useAuth } from '@/contexts/AuthContext';
import LiveStreamService from '@/services/liveStreamService';
import webSocketService, { useWebSocket } from '@/services/websocketService';
import {
  useLiveStreamStore,
  useCurrentStream,
  useChatMessages,
  useViewerCount,
  useStreamActions,
  useStreamConnection,
} from '@/stores/livestream.store';
import {
  Mic,
  MicOff,
  Camera as CameraIcon,
  CameraOff,
  PhoneOff,
  Users,
  MessageCircle,
  Send,
  X,
  AlertCircle,
  Heart,
  IndianRupee,
  Wifi,
  WifiOff,
  Clock,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface LocationState {
  meetingId: string;
  token?: string;
  isHost: boolean;
  streamTitle: string;
  streamType: 'free' | 'influencer' | 'promotional';
}

// Participant Video Component
const ParticipantView: React.FC<{ participantId: string; isLocal?: boolean }> = ({ 
  participantId, 
  isLocal = false 
}) => {
  const { webcamStream, webcamOn, displayName, micOn } = useParticipant(participantId);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && webcamStream) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(webcamStream.track);
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play().catch((err) => console.error('Video play error:', err));
    }
  }, [webcamStream]);

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      {webcamOn && webcamStream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <CameraOff className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-white text-sm">{displayName || 'User'}</p>
          </div>
        </div>
      )}
      
      <div className="absolute bottom-2 left-2 flex items-center gap-2">
        <Badge className="bg-black/50 text-white">
          {displayName || (isLocal ? 'You' : 'Viewer')}
        </Badge>
        {!micOn && (
          <Badge className="bg-red-600 text-white">
            <MicOff className="h-3 w-3" />
          </Badge>
        )}
      </div>
    </div>
  );
};

// Connection Status Component
const ConnectionStatus: React.FC = () => {
  const { isConnected, reconnectAttempts } = useStreamConnection();

  if (isConnected) {
    return (
      <Badge className="bg-green-600 text-white">
        <Wifi className="h-3 w-3 mr-1" />
        Connected
      </Badge>
    );
  }

  return (
    <Badge className="bg-red-600 text-white">
      <WifiOff className="h-3 w-3 mr-1" />
      {reconnectAttempts > 0 ? `Reconnecting... (${reconnectAttempts})` : 'Disconnected'}
    </Badge>
  );
};

// Stream Stats Component
const StreamStats: React.FC<{ isHost: boolean }> = ({ isHost }) => {
  const currentStream = useCurrentStream();
  const viewerCount = useViewerCount();
  const [duration, setDuration] = useState('00:00');

  useEffect(() => {
    if (!currentStream.startTime || !currentStream.isActive) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - currentStream.startTime!) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      setDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentStream.startTime, currentStream.isActive]);

  return (
    <div className="flex items-center gap-4 text-white text-sm">
      <div className="flex items-center gap-1">
        <Eye className="h-4 w-4" />
        <span>{viewerCount}</span>
      </div>
      <div className="flex items-center gap-1">
        <Clock className="h-4 w-4" />
        <span>{duration}</span>
      </div>
      {currentStream.costPerMinute > 0 && (
        <div className="flex items-center gap-1">
          <IndianRupee className="h-4 w-4" />
          <span>₹{currentStream.costPerMinute}/min</span>
        </div>
      )}
    </div>
  );
};

// Enhanced Chat Component
const EnhancedChatPanel: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  isHost: boolean;
}> = ({ isOpen, onClose, isHost }) => {
  const { user } = useAuth();
  const chatMessages = useChatMessages();
  const currentStream = useCurrentStream();
  const { sendChatMessage, sendTip } = useStreamActions();
  const { sendChatMessage: wsSendChat, sendTip: wsSendTip } = useWebSocket();
  
  const [messageText, setMessageText] = useState('');
  const [showTipDialog, setShowTipDialog] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const [tipMessage, setTipMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = useCallback(() => {
    if (!messageText.trim() || !user?.id) return;

    const message = messageText.trim();
    const userId = user.id;
    const userName = user.name || 'Anonymous';

    // Send via WebSocket for real-time delivery
    const sent = wsSendChat(message, userId, userName);
    
    if (!sent) {
      // Fallback to local store if WebSocket fails
      sendChatMessage(message, userId, userName);
    }

    setMessageText('');
  }, [messageText, user, wsSendChat, sendChatMessage]);

  const handleSendTip = useCallback(() => {
    if (!tipAmount || !user?.id || !currentStream.hostId) return;

    const amount = parseFloat(tipAmount);
    if (isNaN(amount) || amount <= 0) return;

    const userId = user.id;
    const userName = user.name || 'Anonymous';
    const message = tipMessage || `Sent a tip of ₹${amount}`;

    // Send via WebSocket for real-time delivery
    const sent = wsSendTip(amount, message, userId, userName, currentStream.hostId);
    
    if (!sent) {
      // Fallback to local store if WebSocket fails
      sendTip(amount, message, userId, userName);
    }

    setTipAmount('');
    setTipMessage('');
    setShowTipDialog(false);
  }, [tipAmount, tipMessage, user, currentStream.hostId, wsSendTip, sendTip]);

  if (!isOpen) return null;

  return (
    <div className="absolute right-4 top-4 bottom-20 w-80 bg-card rounded-lg shadow-xl flex flex-col border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Live Chat
        </h3>
        <div className="flex items-center gap-2">
          <ConnectionStatus />
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "rounded-lg p-2",
              msg.type === 'tip' && "bg-yellow-50 border border-yellow-200",
              msg.type === 'system' && "bg-blue-50 border border-blue-200",
              msg.type === 'message' && "bg-muted"
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-semibold text-blue-600">{msg.userName}</p>
              {msg.type === 'tip' && (
                <Badge className="bg-yellow-500 text-white text-xs">
                  ₹{msg.tipAmount}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-sm">{msg.message}</p>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t space-y-2">
        {!isHost && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowTipDialog(true)}
          >
            <Heart className="h-4 w-4 mr-2" />
            Send Tip
          </Button>
        )}
        
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button onClick={handleSendMessage} disabled={!messageText.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tip Dialog */}
      {showTipDialog && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm p-4">
            <h3 className="font-semibold mb-4">Send a Tip</h3>
            <div className="space-y-3">
              <Input
                type="number"
                placeholder="Amount (₹)"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
              />
              <Input
                placeholder="Message (optional)"
                value={tipMessage}
                onChange={(e) => setTipMessage(e.target.value)}
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowTipDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendTip} disabled={!tipAmount}>
                  Send Tip
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// Host Controls Component
const HostControls: React.FC<{
  onLeave: () => void;
  streamTitle: string;
}> = ({ onLeave, streamTitle }) => {
  const { toggleMic, toggleWebcam, localMicOn, localWebcamOn, leave } = useMeeting();
  const { endStream } = useStreamActions();
  const { user } = useAuth();

  const handleEnd = async () => {
    if (user?.id) {
      await endStream(user.id);
    }
    leave();
    onLeave();
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="text-white">
            <h2 className="text-xl font-bold">{streamTitle}</h2>
            <div className="flex items-center gap-4 mt-1">
              <Badge className="bg-red-600 text-white">LIVE</Badge>
              <StreamStats isHost={true} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Button
            variant={localMicOn ? 'default' : 'destructive'}
            size="lg"
            className="rounded-full w-14 h-14"
            onClick={() => toggleMic()}
          >
            {localMicOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </Button>

          <Button
            variant={localWebcamOn ? 'default' : 'destructive'}
            size="lg"
            className="rounded-full w-14 h-14"
            onClick={() => toggleWebcam()}
          >
            {localWebcamOn ? <CameraIcon className="h-6 w-6" /> : <CameraOff className="h-6 w-6" />}
          </Button>

          <Button
            variant="destructive"
            size="lg"
            className="rounded-full w-14 h-14"
            onClick={handleEnd}
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Viewer Controls Component
const ViewerControls: React.FC<{
  onLeave: () => void;
  streamTitle: string;
}> = ({ onLeave, streamTitle }) => {
  const { leave } = useMeeting();
  const { leaveStream } = useStreamActions();
  const { user } = useAuth();

  const handleLeave = async () => {
    if (user?.id) {
      await leaveStream(user.id);
    }
    leave();
    onLeave();
  };

  return (
    <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
      <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3">
        <h2 className="text-white font-semibold">{streamTitle}</h2>
        <div className="flex items-center gap-4 mt-1">
          <Badge className="bg-red-600 text-white text-xs">LIVE</Badge>
          <StreamStats isHost={false} />
        </div>
      </div>

      <Button
        variant="destructive"
        size="sm"
        className="bg-black/70 backdrop-blur-sm hover:bg-red-600"
        onClick={handleLeave}
      >
        <X className="h-4 w-4 mr-2" />
        Leave
      </Button>
    </div>
  );
};

// Meeting Container Component
const MeetingContainer: React.FC<LocationState> = ({ meetingId, isHost, streamTitle, streamType }) => {
  const { participants, localParticipant, leave } = useMeeting({
    onMeetingLeft: () => {
      console.log('[EnhancedLiveStreaming] Meeting left');
    },
    onParticipantJoined: (participant) => {
      console.log('[EnhancedLiveStreaming] Participant joined:', participant.id);
      // This will be handled by WebSocket events
    },
    onParticipantLeft: (participant) => {
      console.log('[EnhancedLiveStreaming] Participant left:', participant.id);
      // This will be handled by WebSocket events
    },
  });

  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isChatOpen, toggleChat } = useLiveStreamStore();
  const { connect, disconnect } = useWebSocket();

  // Get host participant (for viewers)
  const hostParticipants = useMemo(() => {
    return Array.from(participants.values()).filter(
      (participant) => !participant.local && participant.webcamOn
    );
  }, [participants]);

  // Connect to WebSocket when component mounts
  useEffect(() => {
    if (user?.id) {
      connect(meetingId, user.id).catch((error) => {
        console.error('Failed to connect to WebSocket:', error);
        toast({
          title: 'Connection Warning',
          description: 'Real-time features may not work properly.',
          variant: 'destructive',
        });
      });
    }

    return () => {
      disconnect();
    };
  }, [meetingId, user?.id, connect, disconnect, toast]);

  const handleLeave = () => {
    disconnect();
    navigate('/livestream');
  };

  return (
    <div className="relative w-full h-screen bg-black">
      {/* Video Container */}
      <div className="w-full h-full">
        {isHost ? (
          // Host view - show local participant
          localParticipant && <ParticipantView participantId={localParticipant.id} isLocal={true} />
        ) : (
          // Viewer view - show host's video
          <>
            {hostParticipants.length > 0 ? (
              <ParticipantView participantId={hostParticipants[0].id} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-white">
                  <AlertCircle className="h-16 w-16 mx-auto mb-4" />
                  <p className="text-xl">Waiting for host...</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      {isHost ? (
        <HostControls onLeave={handleLeave} streamTitle={streamTitle} />
      ) : (
        <ViewerControls onLeave={handleLeave} streamTitle={streamTitle} />
      )}

      {/* Chat Toggle Button */}
      <div className="absolute bottom-20 right-4">
        <Button
          className="rounded-full w-14 h-14 bg-card/20 backdrop-blur-sm hover:bg-card/30"
          onClick={toggleChat}
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
      </div>

      {/* Enhanced Chat Panel */}
      <EnhancedChatPanel
        isOpen={isChatOpen}
        onClose={toggleChat}
        isHost={isHost}
      />
    </div>
  );
};

// Main Component with MeetingProvider
const EnhancedLiveStreaming: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const state = location.state as LocationState;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meetingConfig, setMeetingConfig] = useState<LocationState & { token: string } | null>(null);

  useEffect(() => {
    const initializeStream = async () => {
      if (!state || !state.meetingId) {
        setError('Invalid stream configuration. Please try again.');
        setLoading(false);
        return;
      }

      if (!user?.id) {
        setError('Please log in to join the stream.');
        setLoading(false);
        return;
      }

      try {
        // Validate stream is still active
        const validation = await LiveStreamService.validateStream(state.meetingId);
        if (!validation.success) {
          setError('Stream is no longer active or does not exist.');
          setLoading(false);
          return;
        }

        let token = state.token;

        // Get token if not provided
        if (!token) {
          const tokenResponse = await LiveStreamService.getStreamToken(state.meetingId, user.id);
          if (!tokenResponse.success) {
            setError('Failed to get stream access token.');
            setLoading(false);
            return;
          }
          token = tokenResponse.data.token;
        }

        // Join stream if viewer
        if (!state.isHost) {
          const joinResponse = await LiveStreamService.joinStream(user.id, state.meetingId);
          if (!joinResponse.success) {
            setError('Failed to join stream. It may have ended or be at capacity.');
            setLoading(false);
            return;
          }
        }

        setMeetingConfig({
          ...state,
          token,
        });
        setLoading(false);

      } catch (error: any) {
        console.error('Failed to initialize stream:', error);
        setError('Failed to initialize stream. Please try again.');
        setLoading(false);
      }
    };

    initializeStream();
  }, [state, user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
          <p>Joining stream...</p>
        </div>
      </div>
    );
  }

  if (error || !meetingConfig) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted">
        <Card className="max-w-md w-full p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'Failed to load stream'}</AlertDescription>
          </Alert>
          <Button className="w-full mt-4" onClick={() => navigate('/livestream')}>
            Back to Streams
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <MeetingProvider
      config={{
        meetingId: meetingConfig.meetingId,
        micEnabled: meetingConfig.isHost,
        webcamEnabled: meetingConfig.isHost,
        name: meetingConfig.isHost ? 'Host' : 'Viewer',
        debugMode: false,
      }}
      token={meetingConfig.token}
      reinitialiseMeetingOnConfigChange={true}
      joinWithoutUserInteraction={true}
    >
      <MeetingContainer {...meetingConfig} />
    </MeetingProvider>
  );
};

export default EnhancedLiveStreaming;