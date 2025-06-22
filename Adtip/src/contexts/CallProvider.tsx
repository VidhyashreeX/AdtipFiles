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
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  useEffect(() => {
    const handleCallStateChange = (data: { isInCall: boolean; activeCall?: ActiveCall }) => {
      console.log('[CallProvider] Received callStateChanged event:', data);
      
      if (data.isInCall && (data.activeCall || CallService.activeCall)) {
        const callData = data.activeCall || CallService.activeCall;
        console.log('[CallProvider] Setting active call from event data:', callData);
        
        if (callData) {
          setActiveCall({
            meetingId: callData.meetingId,
            token: callData.token,
            callType: callData.callType,
            isInitiator: callData.isInitiator,
            recipientName: callData.recipientName,
            callerName: callData.callerName,
            callId: callData.callId,
            callerId: callData.callerId,
            recipientId: callData.recipientId,
            status: callData.status,
            timestamp: callData.timestamp,
          });
        }
      } else {
        console.log('[CallProvider] Clearing active call');
        setActiveCall(null);
      }
    };

    // FIXED: Use consistent event name (camelCase)
    appEventEmitter.on('callStateChanged', handleCallStateChange);
    
    // Check on mount if there's already an active call
    if (CallService.activeCall) {
      console.log('[CallProvider] Found existing call on mount:', CallService.activeCall);
      handleCallStateChange({ isInCall: true, activeCall: CallService.activeCall });
    }
    
    return () => {
      appEventEmitter.off('callStateChanged', handleCallStateChange);
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