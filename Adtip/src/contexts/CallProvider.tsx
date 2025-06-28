import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import CallService from '../services/CallService';
import OngoingCallModule from '../services/OngoingCallModule';
import { AppState, AppStateStatus, NativeEventEmitter, NativeModules } from 'react-native';
import { appEventEmitter } from '../events/AppEventEmitter';

// --- THIS IS THE FIX ---
// The ActiveCall interface is updated to include `callerName` and match the data structure
// used across the application (in CallService.ts and App.tsx).
export interface ActiveCall {
  callId?: string;
  meetingId: string;
  token: string;
  callType: 'voice' | 'video';
  isInitiator: boolean;
  recipientName: string;
  callerName: string;
  callerId?: string;
  callerFcmToken?: string;
  recipientId?: string;
  recipientFcmToken?: string;
  status?: 'dialing' | 'ringing' | 'connected' | 'ended';
  timestamp?: number;
}

interface CallContextType {
  activeCall: ActiveCall | null;
  callDuration: number;
  startCall: (callData: ActiveCall) => void;
  endCall: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(CallService.activeCall);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    const handleCallStateChange = (data: { isInCall: boolean; activeCall: ActiveCall | null }) => {
      console.log('[CallProvider] Received callStateChanged event:', data);
      
      if (data.isInCall && data.activeCall) {
        console.log('[CallProvider] Setting active call:', data.activeCall);
        setActiveCall(data.activeCall);
      } else {
        console.log('[CallProvider] Clearing active call.');
        setActiveCall(null);
      }
    };

    const handleCallEnded = (data: any) => {
      console.log('[CallProvider] Received callEnded event:', data);
      setActiveCall(null);
    };

    // Listen to call state changes
    appEventEmitter.on('callStateChanged', handleCallStateChange);
    appEventEmitter.on('callEnded', handleCallEnded);
    
    // Sync with existing call state on mount
    if (CallService.activeCall) {
      console.log('[CallProvider] Found existing call on mount:', CallService.activeCall);
      setActiveCall(CallService.activeCall);
    }
    
    return () => {
      appEventEmitter.off('callStateChanged', handleCallStateChange);
      appEventEmitter.off('callEnded', handleCallEnded);
    };
  }, []);

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(NativeModules.OngoingCall);
    const subscription = eventEmitter.addListener('EndCall', () => {
      CallService.endCall('ended_from_notification');
    });
    return () => subscription.remove();
  }, []);
  
  // Timer for call duration
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeCall) {
      setCallDuration(0); // Reset on new call
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeCall]);

  const startCall = (callData: ActiveCall) => {
    setActiveCall(callData);
  };

  const endCall = () => {
    if (activeCall) {
      OngoingCallModule.stopOngoingCallNotification();
      setActiveCall(null);
    }
  };    const value = useMemo(() => ({ activeCall, callDuration, startCall, endCall }), [activeCall, callDuration]);

  return (
    <CallContext.Provider value={value}>
      {/* FIXED: Remove MeetingProvider from here to avoid conflicts with MeetingScreen's MeetingProvider */}
      {children}
    </CallContext.Provider>
  );
};

export const useCall = (): CallContextType => {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};