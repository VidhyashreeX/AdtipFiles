// Enhanced Live Stream State Management Store
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import LiveStreamService from '../services/liveStreamService';
import { toast } from 'sonner';

// Interfaces
interface ChatMessage {
  id: string;
  userId: number;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: number;
  type: 'message' | 'tip' | 'join' | 'leave' | 'system';
  tipAmount?: number;
}

interface StreamParticipant {
  id: number;
  name: string;
  avatar?: string;
  joinedAt: number;
  isHost: boolean;
  isActive: boolean;
}

interface LiveStreamState {
  // Current stream info
  currentStream: {
    id: string | null;
    meetingId: string | null;
    title: string | null;
    hostId: number | null;
    hostName: string | null;
    streamType: 'free' | 'influencer' | 'promotional' | null;
    costPerMinute: number;
    earningsPerMinute: number;
    isActive: boolean;
    startTime: number | null;
    endTime: number | null;
  };

  // User's role in current stream
  userRole: 'host' | 'viewer' | null;
  isJoined: boolean;

  // Real-time data
  viewerCount: number;
  participants: StreamParticipant[];
  chatMessages: ChatMessage[];
  
  // Stream earnings/costs
  totalEarnings: number;
  totalCost: number;
  sessionDuration: number; // in seconds

  // UI state
  isChatOpen: boolean;
  isLoading: boolean;
  error: string | null;

  // Connection state
  isConnected: boolean;
  reconnectAttempts: number;
  lastHeartbeat: number;
}

interface LiveStreamActions {
  // Stream management
  joinStream: (meetingId: string, userId: number) => Promise<boolean>;
  leaveStream: (userId: number) => Promise<void>;
  startStream: (config: any, userId: number) => Promise<string | null>;
  endStream: (userId: number) => Promise<void>;

  // Real-time updates
  updateViewerCount: (count: number) => void;
  addParticipant: (participant: StreamParticipant) => void;
  removeParticipant: (participantId: number) => void;
  addChatMessage: (message: ChatMessage) => void;
  sendChatMessage: (text: string, userId: number, userName: string) => void;
  sendTip: (amount: number, message: string, userId: number, userName: string) => void;

  // Session tracking
  updateSessionDuration: () => void;
  updateEarnings: (amount: number) => void;
  updateCost: (amount: number) => void;

  // UI actions
  toggleChat: () => void;
  clearError: () => void;
  
  // Connection management
  setConnected: (connected: boolean) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;
  updateHeartbeat: () => void;

  // Cleanup
  resetStream: () => void;
  clearChat: () => void;
}

interface LiveStreamStore extends LiveStreamState, LiveStreamActions {}

// Initial state
const initialState: LiveStreamState = {
  currentStream: {
    id: null,
    meetingId: null,
    title: null,
    hostId: null,
    hostName: null,
    streamType: null,
    costPerMinute: 0,
    earningsPerMinute: 0,
    isActive: false,
    startTime: null,
    endTime: null,
  },
  userRole: null,
  isJoined: false,
  viewerCount: 0,
  participants: [],
  chatMessages: [],
  totalEarnings: 0,
  totalCost: 0,
  sessionDuration: 0,
  isChatOpen: false,
  isLoading: false,
  error: null,
  isConnected: false,
  reconnectAttempts: 0,
  lastHeartbeat: 0,
};

// Utility functions
const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const createSystemMessage = (text: string): ChatMessage => ({
  id: generateMessageId(),
  userId: 0,
  userName: 'System',
  message: text,
  timestamp: Date.now(),
  type: 'system',
});

// Create the store
export const useLiveStreamStore = create<LiveStreamStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Join stream
        joinStream: async (meetingId: string, userId: number) => {
          set({ isLoading: true, error: null }, false, 'livestream/joinStream/start');

          try {
            const response = await LiveStreamService.joinStream(userId, meetingId);
            
            if (response.success) {
              set((state) => ({
                currentStream: {
                  ...state.currentStream,
                  meetingId,
                  isActive: true,
                },
                userRole: 'viewer',
                isJoined: true,
                isLoading: false,
                error: null,
              }), false, 'livestream/joinStream/success');

              // Add join message to chat
              get().addChatMessage(createSystemMessage(`You joined the stream`));
              
              return true;
            } else {
              throw new Error(response.message || 'Failed to join stream');
            }
          } catch (error: any) {
            console.error('Failed to join stream:', error);
            const errorMessage = error.message || 'Failed to join stream';
            
            set({
              isLoading: false,
              error: errorMessage,
            }, false, 'livestream/joinStream/error');

            toast.error(errorMessage);
            return false;
          }
        },

        // Leave stream
        leaveStream: async (userId: number) => {
          const { currentStream } = get();
          
          if (currentStream.meetingId) {
            try {
              await LiveStreamService.leaveStream(userId, currentStream.meetingId);
              
              // Add leave message to chat
              get().addChatMessage(createSystemMessage(`You left the stream`));
              
            } catch (error) {
              console.error('Failed to leave stream:', error);
            }
          }

          set((state) => ({
            ...initialState,
            chatMessages: [], // Clear chat when leaving
          }), false, 'livestream/leaveStream');
        },

        // Start stream
        startStream: async (config: any, userId: number) => {
          set({ isLoading: true, error: null }, false, 'livestream/startStream/start');

          try {
            const response = await LiveStreamService.startStream(userId, config);
            
            if (response.success && response.data) {
              const startTime = Date.now();
              
              set((state) => ({
                currentStream: {
                  id: response.data.id || response.data.meeting_id,
                  meetingId: response.data.meeting_id,
                  title: config.title,
                  hostId: userId,
                  hostName: response.data.host_name || 'Host',
                  streamType: response.data.stream_type || 'free',
                  costPerMinute: config.cost_per_minute || 0,
                  earningsPerMinute: config.viewer_reward_per_minute || 0,
                  isActive: true,
                  startTime,
                  endTime: null,
                },
                userRole: 'host',
                isJoined: true,
                isLoading: false,
                error: null,
                sessionDuration: 0,
                totalEarnings: 0,
                totalCost: 0,
              }), false, 'livestream/startStream/success');

              // Add welcome message to chat
              get().addChatMessage(createSystemMessage(`Welcome to ${config.title}! You are now live.`));
              
              return response.data.meeting_id;
            } else {
              throw new Error(response.message || 'Failed to start stream');
            }
          } catch (error: any) {
            console.error('Failed to start stream:', error);
            const errorMessage = error.message || 'Failed to start stream';
            
            set({
              isLoading: false,
              error: errorMessage,
            }, false, 'livestream/startStream/error');

            toast.error(errorMessage);
            return null;
          }
        },

        // End stream
        endStream: async (userId: number) => {
          const { currentStream } = get();
          
          if (currentStream.meetingId) {
            try {
              await LiveStreamService.endStream(userId, currentStream.meetingId);
              
              set((state) => ({
                currentStream: {
                  ...state.currentStream,
                  isActive: false,
                  endTime: Date.now(),
                },
              }), false, 'livestream/endStream');

              // Add end message to chat
              get().addChatMessage(createSystemMessage(`Stream ended. Thank you for watching!`));
              
              toast.success('Stream ended successfully');
            } catch (error: any) {
              console.error('Failed to end stream:', error);
              toast.error('Failed to end stream');
            }
          }
        },

        // Update viewer count
        updateViewerCount: (count: number) => {
          set({ viewerCount: count }, false, 'livestream/updateViewerCount');
        },

        // Add participant
        addParticipant: (participant: StreamParticipant) => {
          set((state) => {
            const existingIndex = state.participants.findIndex(p => p.id === participant.id);
            
            if (existingIndex >= 0) {
              // Update existing participant
              const updatedParticipants = [...state.participants];
              updatedParticipants[existingIndex] = { ...updatedParticipants[existingIndex], ...participant };
              return { participants: updatedParticipants };
            } else {
              // Add new participant
              const newParticipants = [...state.participants, participant];
              
              // Add join message to chat
              if (!participant.isHost) {
                get().addChatMessage(createSystemMessage(`${participant.name} joined the stream`));
              }
              
              return { 
                participants: newParticipants,
                viewerCount: newParticipants.filter(p => !p.isHost).length,
              };
            }
          }, false, 'livestream/addParticipant');
        },

        // Remove participant
        removeParticipant: (participantId: number) => {
          set((state) => {
            const participant = state.participants.find(p => p.id === participantId);
            const updatedParticipants = state.participants.filter(p => p.id !== participantId);
            
            // Add leave message to chat
            if (participant && !participant.isHost) {
              get().addChatMessage(createSystemMessage(`${participant.name} left the stream`));
            }
            
            return { 
              participants: updatedParticipants,
              viewerCount: updatedParticipants.filter(p => !p.isHost).length,
            };
          }, false, 'livestream/removeParticipant');
        },

        // Add chat message
        addChatMessage: (message: ChatMessage) => {
          set((state) => ({
            chatMessages: [...state.chatMessages, message].slice(-100), // Keep last 100 messages
          }), false, 'livestream/addChatMessage');
        },

        // Send chat message
        sendChatMessage: (text: string, userId: number, userName: string) => {
          const message: ChatMessage = {
            id: generateMessageId(),
            userId,
            userName,
            message: text,
            timestamp: Date.now(),
            type: 'message',
          };

          get().addChatMessage(message);
          
          // Here you would send the message to the backend/WebSocket
          // For now, we'll just add it locally
        },

        // Send tip
        sendTip: (amount: number, message: string, userId: number, userName: string) => {
          const tipMessage: ChatMessage = {
            id: generateMessageId(),
            userId,
            userName,
            message: message || `Sent a tip of ₹${amount}`,
            timestamp: Date.now(),
            type: 'tip',
            tipAmount: amount,
          };

          get().addChatMessage(tipMessage);
          get().updateCost(amount);
          
          toast.success(`Tip of ₹${amount} sent!`);
        },

        // Update session duration
        updateSessionDuration: () => {
          const { currentStream } = get();
          
          if (currentStream.startTime && currentStream.isActive) {
            const duration = Math.floor((Date.now() - currentStream.startTime) / 1000);
            set({ sessionDuration: duration }, false, 'livestream/updateSessionDuration');
          }
        },

        // Update earnings (for hosts)
        updateEarnings: (amount: number) => {
          set((state) => ({
            totalEarnings: state.totalEarnings + amount,
          }), false, 'livestream/updateEarnings');
        },

        // Update cost (for viewers)
        updateCost: (amount: number) => {
          set((state) => ({
            totalCost: state.totalCost + amount,
          }), false, 'livestream/updateCost');
        },

        // Toggle chat
        toggleChat: () => {
          set((state) => ({
            isChatOpen: !state.isChatOpen,
          }), false, 'livestream/toggleChat');
        },

        // Clear error
        clearError: () => {
          set({ error: null }, false, 'livestream/clearError');
        },

        // Set connected
        setConnected: (connected: boolean) => {
          set({ 
            isConnected: connected,
            lastHeartbeat: connected ? Date.now() : 0,
          }, false, 'livestream/setConnected');
        },

        // Increment reconnect attempts
        incrementReconnectAttempts: () => {
          set((state) => ({
            reconnectAttempts: state.reconnectAttempts + 1,
          }), false, 'livestream/incrementReconnectAttempts');
        },

        // Reset reconnect attempts
        resetReconnectAttempts: () => {
          set({ reconnectAttempts: 0 }, false, 'livestream/resetReconnectAttempts');
        },

        // Update heartbeat
        updateHeartbeat: () => {
          set({ lastHeartbeat: Date.now() }, false, 'livestream/updateHeartbeat');
        },

        // Reset stream
        resetStream: () => {
          set(initialState, false, 'livestream/resetStream');
        },

        // Clear chat
        clearChat: () => {
          set({ chatMessages: [] }, false, 'livestream/clearChat');
        },
      }),
      {
        name: 'livestream-storage',
        storage: createJSONStorage(() => sessionStorage), // Use sessionStorage for live stream data
        partialize: (state) => ({
          // Only persist essential data, not real-time data
          currentStream: state.currentStream,
          userRole: state.userRole,
          isJoined: state.isJoined,
          totalEarnings: state.totalEarnings,
          totalCost: state.totalCost,
          sessionDuration: state.sessionDuration,
        }),
      }
    ),
    {
      name: 'livestream-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// Selectors for optimized re-renders
export const useCurrentStream = () => useLiveStreamStore((state) => state.currentStream);
export const useStreamParticipants = () => useLiveStreamStore((state) => state.participants);
export const useChatMessages = () => useLiveStreamStore((state) => state.chatMessages);
export const useViewerCount = () => useLiveStreamStore((state) => state.viewerCount);
export const useStreamEarnings = () => useLiveStreamStore((state) => ({
  totalEarnings: state.totalEarnings,
  totalCost: state.totalCost,
  sessionDuration: state.sessionDuration,
}));

// Action hooks
export const useStreamActions = () => useLiveStreamStore((state) => ({
  joinStream: state.joinStream,
  leaveStream: state.leaveStream,
  startStream: state.startStream,
  endStream: state.endStream,
  sendChatMessage: state.sendChatMessage,
  sendTip: state.sendTip,
  toggleChat: state.toggleChat,
  updateSessionDuration: state.updateSessionDuration,
}));

export const useStreamConnection = () => useLiveStreamStore((state) => ({
  isConnected: state.isConnected,
  reconnectAttempts: state.reconnectAttempts,
  lastHeartbeat: state.lastHeartbeat,
  setConnected: state.setConnected,
  incrementReconnectAttempts: state.incrementReconnectAttempts,
  resetReconnectAttempts: state.resetReconnectAttempts,
  updateHeartbeat: state.updateHeartbeat,
}));