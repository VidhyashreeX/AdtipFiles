import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import UnifiedCallService from '../services/calling/UnifiedCallService';
import { AppState, AppStateStatus } from 'react-native';
import { appEventEmitter } from '../events/AppEventEmitter';

// Update ActiveCall interface to match UnifiedCallService's CallData
export interface ActiveCall {
  callId: string;
  meetingId: string;
  token: string;
  callType: 'voice' | 'video';
  isInitiator: boolean;
  recipientName: string;
  callerName: string;
  callerId: string;
  callerFcmToken?: string;
  recipientId: string;
  recipientFcmToken?: string;
  status: 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'missed' | 'declined';
  timestamp: number;
}

interface CallContextType {
  activeCall: ActiveCall | null;
  callDuration: number;
  startCall: (callData: ActiveCall) => void;
  endCall: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const unifiedCallService = UnifiedCallService.getInstance();
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    const handleCallStateChange = (data: any) => {
      console.log('[CallProvider] Received callStateChanged event:', data);
      // CRITICAL FIX: Handle different event formats properly
      // Format 1: Full state object { isInCall: boolean; activeCall: ActiveCall | null }
      if (typeof data === 'object' && 'isInCall' in data) {
        if (data.isInCall && data.activeCall) {
          console.log('[CallProvider] Setting active call:', data.activeCall);
          setActiveCall(data.activeCall);
        } else {
          console.log('[CallProvider] Clearing active call.');
          setActiveCall(null);
        }
      }
      // Format 2: Status update only { status: string; callId: string }
      else if (typeof data === 'object' && 'status' in data && 'callId' in data) {
        console.log('[CallProvider] Received status-only event, ignoring to prevent clearing active call');
        // Don't clear activeCall for status-only events - these are just status updates
        // The full state change events will handle clearing when appropriate
      }
      // Format 3: Unknown format - log but don't change state
      else {
        console.log('[CallProvider] Unknown event format, ignoring:', data);
      }
    };

    // Remove handleCallEnded logic for state changes
    // Only listen to callStateChanged
    appEventEmitter.on('callStateChanged', handleCallStateChange);
    
    // Sync with existing call state on mount
    const currentCall = unifiedCallService.getCurrentCall();
    if (currentCall) {
      console.log('[CallProvider] Found existing call on mount:', currentCall);
      setActiveCall(currentCall as ActiveCall);
    }
    
    return () => {
      appEventEmitter.off('callStateChanged', handleCallStateChange);
    };
  }, [unifiedCallService]);

  // Remove native event listener for OngoingCall as it's now handled by UnifiedCallService
  useEffect(() => {
    // Listen to UnifiedCallService events for call end from notification
    const handleNotificationCallEnd = () => {
      unifiedCallService.endCall('ended_from_notification');
    };

    appEventEmitter.on('notificationCallEnd', handleNotificationCallEnd);
    
    return () => {
      appEventEmitter.off('notificationCallEnd', handleNotificationCallEnd);
    };
  }, [unifiedCallService]);
  
  // Timer for call duration
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeCall && activeCall.status === 'connected') {
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
    // Use UnifiedCallService to start the call
    unifiedCallService.startOutgoingCall(
      callData.recipientId, 
      callData.recipientName, 
      callData.callType,
      callData.callerName,
      callData.callerId
    );
  };

  const endCall = async () => {
    // Use UnifiedCallService to end the call
    await unifiedCallService.endCall();
  };

  const value = useMemo(() => ({ activeCall, callDuration, startCall, endCall }), [activeCall, callDuration]);

  return (
    <CallContext.Provider value={value}>
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