// src/pages/LiveStreaming.tsx - Live Streaming Screen with VideoSDK

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MeetingProvider, useMeeting, useParticipant, Constants } from '@videosdk.live/react-sdk';
import { useAuth } from '@/contexts/AuthContext';
import LiveStreamService from '@/services/liveStreamService';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface LocationState {
  meetingId: string;
  token: string;
  isHost: boolean;
  streamTitle: string;
  streamType: 'free' | 'influencer' | 'promotional';
}

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  timestamp: number;
}

// Participant Video Component
const ParticipantView: React.FC<{ participantId: string; isLocal?: boolean }> = ({ participantId, isLocal = false }) => {
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

// Host Controls Component
const HostControls: React.FC<{
  onLeave: () => void;
  viewerCount: number;
  streamTitle: string;
}> = ({ onLeave, viewerCount, streamTitle }) => {
  const { toggleMic, toggleWebcam, localMicOn, localWebcamOn, leave } = useMeeting();

  const handleEnd = () => {
    leave();
    onLeave();
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="text-white">
            <h2 className="text-xl font-bold">{streamTitle}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-red-600 text-white">LIVE</Badge>
              <span className="flex items-center gap-1 text-sm">
                <Users className="h-4 w-4" />
                {viewerCount} viewers
              </span>
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
  viewerCount: number;
}> = ({ onLeave, streamTitle, viewerCount }) => {
  const { leave } = useMeeting();

  const handleLeave = () => {
    leave();
    onLeave();
  };

  return (
    <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
      <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3">
        <h2 className="text-white font-semibold">{streamTitle}</h2>
        <div className="flex items-center gap-2 mt-1">
          <Badge className="bg-red-600 text-white text-xs">LIVE</Badge>
          <span className="text-white text-sm flex items-center gap-1">
            <Users className="h-3 w-3" />
            {viewerCount}
          </span>
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

// Chat Component
const ChatPanel: React.FC<{ messages: ChatMessage[]; onSendMessage: (text: string) => void; isOpen: boolean; onClose: () => void }> = ({
  messages,
  onSendMessage,
  isOpen,
  onClose,
}) => {
  const [messageText, setMessageText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (messageText.trim()) {
      onSendMessage(messageText.trim());
      setMessageText('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-4 top-4 bottom-20 w-80 bg-card rounded-lg shadow-xl flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Chat
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <div key={msg.id} className="bg-muted rounded-lg p-2">
            <p className="text-xs font-semibold text-blue-600">{msg.user}</p>
            <p className="text-sm">{msg.text}</p>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button onClick={handleSend} disabled={!messageText.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Meeting Container Component
const MeetingContainer: React.FC<LocationState> = ({ meetingId, isHost, streamTitle, streamType }) => {
  const { participants, localParticipant, leave } = useMeeting({
    onMeetingLeft: () => {
      console.log('[LiveStreaming] Meeting left');
    },
    onParticipantJoined: (participant) => {
      console.log('[LiveStreaming] Participant joined:', participant.id);
      setViewerCount((prev) => prev + 1);
    },
    onParticipantLeft: (participant) => {
      console.log('[LiveStreaming] Participant left:', participant.id);
      setViewerCount((prev) => Math.max(0, prev - 1));
    },
  });

  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [viewerCount, setViewerCount] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Get host participant (for viewers)
  const hostParticipants = useMemo(() => {
    return Array.from(participants.values()).filter(
      (participant) => !participant.local && participant.webcamOn
    );
  }, [participants]);

  const handleLeave = async () => {
    if (user?.id) {
      if (isHost) {
        await LiveStreamService.endStream(user.id, meetingId);
        toast({
          title: 'Stream Ended',
          description: 'Your live stream has been ended successfully.',
        });
      } else {
        await LiveStreamService.leaveStream(user.id, meetingId);
      }
    }
    navigate('/livestream');
  };

  const handleSendMessage = (text: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      user: user?.name || 'Anonymous',
      text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, newMessage]);
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
        <HostControls onLeave={handleLeave} viewerCount={viewerCount} streamTitle={streamTitle} />
      ) : (
        <ViewerControls onLeave={handleLeave} streamTitle={streamTitle} viewerCount={viewerCount} />
      )}

      {/* Chat Toggle Button */}
      <div className="absolute bottom-20 right-4">
        <Button
          className="rounded-full w-14 h-14 bg-card/20 backdrop-blur-sm hover:bg-card/30"
          onClick={() => setShowChat(!showChat)}
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
      </div>

      {/* Chat Panel */}
      <ChatPanel
        messages={messages}
        onSendMessage={handleSendMessage}
        isOpen={showChat}
        onClose={() => setShowChat(false)}
      />
    </div>
  );
};

// Main Component with MeetingProvider
const LiveStreaming: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meetingConfig, setMeetingConfig] = useState<LocationState | null>(null);

  useEffect(() => {
    if (!state || !state.meetingId || !state.token) {
      setError('Invalid stream configuration. Please try again.');
      setLoading(false);
      return;
    }

    setMeetingConfig(state);
    setLoading(false);
  }, [state]);

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

export default LiveStreaming;
