/**
 * Centralized Call Store using Zustand
 * 
 * This store acts as the single source of truth for all call-related state.
 * It replaces the distributed state management across UnifiedCallService,
 * CallProvider, and individual components.
 * 
 * Key Features:
 * - Bulletproof state management with proper type safety
 * - Centralized actions for all call operations
 * - Automatic persistence of critical state
 * - Race condition prevention through atomic updates
 * - Debugging support with state history
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ===== TYPES =====

export type CallStatus = 'idle' | 'dialing' | 'ringing' | 'connecting' | 'connected' | 'ending' | 'ended' | 'cleanup_pending';

export interface CallData {
  callId: string;
  meetingId: string;
  token: string;
  callerName: string;
  recipientName: string;
  callType: 'voice' | 'video';
  callerId: string;
  recipientId: string;
  callerAvatar?: string;
  recipientAvatar?: string;
  callerFcmToken?: string;
  recipientFcmToken?: string;
  isInitiator: boolean;
  status: CallStatus;
  startTime?: number;
  endTime?: number;
  duration?: number;
  timestamp?: number;
}

export interface MediaState {
  micEnabled: boolean;
  cameraEnabled: boolean;
  speakerEnabled: boolean;
  isVideoCall: boolean;
}

export interface CallNotificationData {
  callId: string;
  callerName: string;
  callType: 'voice' | 'video';
  callerId: string;
  meetingId: string;
  token: string;
  callerAvatar?: string;
  callerFcmToken?: string;
}

export interface CallMetrics {
  totalCalls: number;
  totalDuration: number;
  lastCallEndReason?: string;
  callHistory: Array<{
    callId: string;
    startTime: number;
    endTime: number;
    duration: number;
    type: 'voice' | 'video';
    status: 'completed' | 'missed' | 'declined' | 'failed';
  }>;
}

// ===== STORE INTERFACE =====

interface CallStore {
  // ===== STATE =====
  callStatus: CallStatus;
  activeCall: CallData | null;
  mediaState: MediaState;
  isCallServiceInitialized: boolean;
  lastCallEndReason?: string;
  callMetrics: CallMetrics;
  
  // UI State
  isNavigatingToMeeting: boolean;
  showParticipants: boolean;
  callDuration: number;
  
  // Notification State
  incomingCallNotificationId: string | null;
  ongoingCallNotificationId: string | null;
  
  // Error State
  lastError: string | null;
  
  // ===== COMPUTED PROPERTIES =====
  isInCall: boolean;
  isVideoCall: boolean;
  canStartCall: boolean;
  
  // ===== ACTIONS =====
  actions: {
    // Service Management
    setServiceInitialized: (initialized: boolean) => void;
    
    // Call Management
    startOutgoingCall: (callData: Omit<CallData, 'status' | 'timestamp'>) => void;
    setIncomingCall: (callData: CallData) => void;
    acceptCall: () => void;
    endCall: (reason?: string) => Promise<void>;
    declineCall: (reason?: string) => void;
    
    // Status Management
    setCallStatus: (status: CallStatus) => void;
    updateCallData: (updates: Partial<CallData>) => void;
    clearActiveCall: () => void;
    
    // Media Management
    setMediaState: (mediaState: Partial<MediaState>) => void;
    toggleMic: () => void;
    toggleCamera: () => void;
    toggleSpeaker: () => Promise<void>;
    
    // UI Management
    setNavigatingToMeeting: (navigating: boolean) => void;
    setShowParticipants: (show: boolean) => void;
    setCallDuration: (duration: number) => void;
    
    // Notification Management
    setIncomingCallNotificationId: (id: string | null) => void;
    setOngoingCallNotificationId: (id: string | null) => void;
    
    // Error Management
    setError: (error: string | null) => void;
    clearError: () => void;
    
    // Metrics
    updateCallMetrics: (metrics: Partial<CallMetrics>) => void;
    addCallToHistory: (call: CallMetrics['callHistory'][0]) => void;
    
    // Reset & Cleanup
    resetCallState: () => void;
    cleanup: () => void;
  }
}

// ===== INITIAL STATE =====

const initialState = {
  callStatus: 'idle' as CallStatus,
  activeCall: null,
  mediaState: {
    micEnabled: true,
    cameraEnabled: false,
    speakerEnabled: true,
    isVideoCall: false,
  },
  isCallServiceInitialized: false,
  lastCallEndReason: undefined,
  callMetrics: {
    totalCalls: 0,
    totalDuration: 0,
    lastCallEndReason: undefined,
    callHistory: [],
  },
  isNavigatingToMeeting: false,
  showParticipants: false,
  callDuration: 0,
  incomingCallNotificationId: null,
  ongoingCallNotificationId: null,
  lastError: null,
};

// ===== ZUSTAND STORE =====

export const useCallStore = create<CallStore>()(
  devtools(
    persist(
      (set, get) => ({
        // ===== STATE =====
        ...initialState,
        
        // ===== COMPUTED PROPERTIES =====
        get isInCall() {
          const state = get();
          if (!state) return false; // Return a default value if state is not ready
          const status = state.callStatus || 'idle';
          return status !== 'idle' && status !== 'ended' && status !== 'cleanup_pending';
        },
        
        get isVideoCall() {
          const state = get();
          if (!state) return false;
          return state.activeCall?.callType === 'video' || state.mediaState.isVideoCall;
        },
        
        get canStartCall() {
          const state = get();
          if (!state) return false;
          return state.callStatus === 'idle' && state.isCallServiceInitialized;
        },
        
        // ===== ACTIONS =====
        actions: {
          // Service Management
          setServiceInitialized: (initialized: boolean) => {
            set({ isCallServiceInitialized: initialized }, false, 'setServiceInitialized');
          },
          
          // Call Management
          startOutgoingCall: (callData: Omit<CallData, 'status' | 'timestamp'>) => {
            const timestamp = Date.now();
            const fullCallData: CallData = {
              ...callData,
              status: 'dialing',
              timestamp,
              startTime: timestamp,
            };
            
            set(
              {
                activeCall: fullCallData,
                callStatus: 'dialing',
                mediaState: {
                  ...get().mediaState,
                  isVideoCall: callData.callType === 'video',
                  cameraEnabled: callData.callType === 'video',
                },
                lastError: null,
                callDuration: 0,
              },
              false,
              'startOutgoingCall'
            );
          },
          
          setIncomingCall: (callData: CallData) => {
            set(
              {
                activeCall: {
                  ...callData,
                  status: 'ringing',
                  timestamp: Date.now(),
                },
                callStatus: 'ringing',
                mediaState: {
                  ...get().mediaState,
                  isVideoCall: callData.callType === 'video',
                  cameraEnabled: callData.callType === 'video',
                },
                lastError: null,
                callDuration: 0,
              },
              false,
              'setIncomingCall'
            );
          },
          
          acceptCall: () => {
            const currentCall = get().activeCall;
            if (!currentCall) return;
            
            set(
              {
                callStatus: 'connecting',
                activeCall: {
                  ...currentCall,
                  status: 'connecting',
                },
              },
              false,
              'acceptCall'
            );
          },
          
          endCall: async (reason?: string) => {
            const currentCall = get().activeCall;
            const endTime = Date.now();
            
            // Update metrics if there was an active call
            if (currentCall && currentCall.startTime) {
              const duration = endTime - currentCall.startTime;
              get().actions.addCallToHistory({
                callId: currentCall.callId,
                startTime: currentCall.startTime,
                endTime: endTime,
                duration: duration,
                type: currentCall.callType,
                status: 'completed',
              });
            }
            
            set(
              {
                callStatus: 'ending',
                lastCallEndReason: reason || 'ended_by_user',
                activeCall: currentCall ? {
                  ...currentCall,
                  status: 'ended',
                  endTime: endTime,
                  duration: currentCall.startTime ? endTime - currentCall.startTime : 0,
                } : null,
              },
              false,
              'endCall'
            );
            
            // Auto-cleanup after a delay
            setTimeout(() => {
              get().actions.cleanup();
            }, 1000);
          },
          
          declineCall: (reason?: string) => {
            const currentCall = get().activeCall;
            
            if (currentCall) {
              get().actions.addCallToHistory({
                callId: currentCall.callId,
                startTime: currentCall.startTime || Date.now(),
                endTime: Date.now(),
                duration: 0,
                type: currentCall.callType,
                status: 'declined',
              });
            }
            
            set(
              {
                callStatus: 'ended',
                lastCallEndReason: reason || 'declined_by_user',
                activeCall: null,
              },
              false,
              'declineCall'
            );
            
            // Auto-cleanup after a delay
            setTimeout(() => {
              get().actions.cleanup();
            }, 500);
          },
          
          // Status Management
          setCallStatus: (status: CallStatus) => {
            const currentCall = get().activeCall;
            
            set(
              {
                callStatus: status,
                activeCall: currentCall ? {
                  ...currentCall,
                  status,
                } : null,
              },
              false,
              'setCallStatus'
            );
          },
          
          updateCallData: (updates: Partial<CallData>) => {
            const currentCall = get().activeCall;
            if (!currentCall) return;
            
            set(
              {
                activeCall: {
                  ...currentCall,
                  ...updates,
                },
              },
              false,
              'updateCallData'
            );
          },
          
          clearActiveCall: () => {
            set(
              {
                activeCall: null,
                callStatus: 'idle',
                callDuration: 0,
                isNavigatingToMeeting: false,
                showParticipants: false,
              },
              false,
              'clearActiveCall'
            );
          },
          
          // Media Management
          setMediaState: (mediaState: Partial<MediaState>) => {
            set(
              {
                mediaState: {
                  ...get().mediaState,
                  ...mediaState,
                },
              },
              false,
              'setMediaState'
            );
          },
          
          toggleMic: () => {
            const currentState = get().mediaState;
            set(
              {
                mediaState: {
                  ...currentState,
                  micEnabled: !currentState.micEnabled,
                },
              },
              false,
              'toggleMic'
            );
          },
          
          toggleCamera: () => {
            const currentState = get().mediaState;
            set(
              {
                mediaState: {
                  ...currentState,
                  cameraEnabled: !currentState.cameraEnabled,
                },
              },
              false,
              'toggleCamera'
            );
          },
          
          toggleSpeaker: async () => {
            const currentState = get().mediaState;
            set(
              {
                mediaState: {
                  ...currentState,
                  speakerEnabled: !currentState.speakerEnabled,
                },
              },
              false,
              'toggleSpeaker'
            );
          },
          
          // UI Management
          setNavigatingToMeeting: (navigating: boolean) => {
            set({ isNavigatingToMeeting: navigating }, false, 'setNavigatingToMeeting');
          },
          
          setShowParticipants: (show: boolean) => {
            set({ showParticipants: show }, false, 'setShowParticipants');
          },
          
          setCallDuration: (duration: number) => {
            set({ callDuration: duration }, false, 'setCallDuration');
          },
          
          // Notification Management
          setIncomingCallNotificationId: (id: string | null) => {
            set({ incomingCallNotificationId: id }, false, 'setIncomingCallNotificationId');
          },
          
          setOngoingCallNotificationId: (id: string | null) => {
            set({ ongoingCallNotificationId: id }, false, 'setOngoingCallNotificationId');
          },
          
          // Error Management
          setError: (error: string | null) => {
            set({ lastError: error }, false, 'setError');
          },
          
          clearError: () => {
            set({ lastError: null }, false, 'clearError');
          },
          
          // Metrics
          updateCallMetrics: (metrics: Partial<CallMetrics>) => {
            set(
              {
                callMetrics: {
                  ...get().callMetrics,
                  ...metrics,
                },
              },
              false,
              'updateCallMetrics'
            );
          },
          
          addCallToHistory: (call: CallMetrics['callHistory'][0]) => {
            const currentMetrics = get().callMetrics;
            const newHistory = [call, ...currentMetrics.callHistory].slice(0, 100); // Keep last 100 calls
            
            set(
              {
                callMetrics: {
                  ...currentMetrics,
                  totalCalls: currentMetrics.totalCalls + 1,
                  totalDuration: currentMetrics.totalDuration + call.duration,
                  callHistory: newHistory,
                },
              },
              false,
              'addCallToHistory'
            );
          },
          
          // Reset & Cleanup
          resetCallState: () => {
            set(
              {
                ...initialState,
                isCallServiceInitialized: get().isCallServiceInitialized, // Preserve initialization state
                callMetrics: get().callMetrics, // Preserve metrics
              },
              false,
              'resetCallState'
            );
          },
          
          cleanup: () => {
            set(
              {
                callStatus: 'idle',
                activeCall: null,
                callDuration: 0,
                isNavigatingToMeeting: false,
                showParticipants: false,
                incomingCallNotificationId: null,
                ongoingCallNotificationId: null,
                lastError: null,
                mediaState: {
                  micEnabled: true,
                  cameraEnabled: false,
                  speakerEnabled: true,
                  isVideoCall: false,
                },
              },
              false,
              'cleanup'
            );
          },
        }
      }),
      {
        name: 'call-store',
        storage: createJSONStorage(() => AsyncStorage),
        // Only persist critical state that needs to survive app restarts
        partialize: (state) => ({
          callMetrics: state.callMetrics,
          isCallServiceInitialized: state.isCallServiceInitialized,
          lastCallEndReason: state.lastCallEndReason,
        }),
      }
    ),
    {
      name: 'call-store',
      enabled: __DEV__, // Only enable devtools in development
    }
  )
);

// ===== SELECTORS =====

// Common selectors to prevent unnecessary re-renders
export const selectCallStatus = (state: CallStore) => state.callStatus;
export const selectActiveCall = (state: CallStore) => state.activeCall;
export const selectMediaState = (state: CallStore) => state.mediaState;
export const selectIsInCall = (state: CallStore) => state.isInCall;
export const selectIsVideoCall = (state: CallStore) => state.isVideoCall;
export const selectCanStartCall = (state: CallStore) => state.canStartCall;
export const selectCallDuration = (state: CallStore) => state.callDuration;
export const selectLastError = (state: CallStore) => state.lastError;

// ===== HOOKS =====

// Convenient hooks for common use cases
export const useCallState = () => {
  return useCallStore((state) => ({
    callStatus: state.callStatus,
    activeCall: state.activeCall,
    isInCall: state.isInCall,
    isVideoCall: state.isVideoCall,
    canStartCall: state.canStartCall,
  }));
};

export const useMediaState = () => {
  return useCallStore((state) => state.mediaState);
};

export const useCallActions = () => {
  return useCallStore((state) => state.actions);
};

export const useCallMetrics = () => {
  return useCallStore((state) => state.callMetrics);
};

// ===== UTILITIES =====

// Helper function to get current call state outside of React components
export const getCallState = () => useCallStore.getState();

// Helper function to subscribe to call state changes outside of React
export const subscribeToCallState = (callback: (state: CallStore) => void) => {
  return useCallStore.subscribe(callback);
};

export default useCallStore;
