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

  // Add a ref to track pending clear timeout
  const clearActiveCallTimeout = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleCallStateChange = (data: any) => {
      console.log('[CallProvider] Received callStateChanged event:', data);
      
      // CRITICAL FIX: Handle different event formats properly
      // Format 1: Full state object { isInCall: boolean; activeCall: ActiveCall | null }
      if (typeof data === 'object' && 'isInCall' in data) {
        if (data.isInCall && data.activeCall) {
          console.log('[CallProvider] Setting active call:', data.activeCall);
          // Cancel any pending clear
          if (clearActiveCallTimeout.current) {
            clearTimeout(clearActiveCallTimeout.current);
            clearActiveCallTimeout.current = null;
          }
          setActiveCall(data.activeCall);
        } else if (!data.isInCall || !data.activeCall) {
          console.log('[CallProvider] Debouncing clear of active call.');
          // Debounce clearing activeCall to allow navigation to complete
          if (clearActiveCallTimeout.current) {
            clearTimeout(clearActiveCallTimeout.current);
          }
          clearActiveCallTimeout.current = setTimeout(() => {
            setActiveCall(null);
            clearActiveCallTimeout.current = null;
          }, 800); // Increased delay to 800ms for better stability
        }
      }
      // Format 2: Status update only { status: string; callId: string }
      else if (typeof data === 'object' && 'status' in data && 'callId' in data) {
        if (data.status === 'ended' || data.status === 'missed' || data.status === 'declined') {
          console.log('[CallProvider] Received call ended status, clearing active call with delay');
          // Clear activeCall for ended status events with proper delay
          if (clearActiveCallTimeout.current) {
            clearTimeout(clearActiveCallTimeout.current);
          }
          clearActiveCallTimeout.current = setTimeout(() => {
            setActiveCall(null);
            clearActiveCallTimeout.current = null;
          }, 1200); // Increased delay for ended calls to allow navigation to complete
        } else if (activeCall && data.callId === activeCall.callId) {
          // Update status of the existing active call for non-ended status
          console.log('[CallProvider] Updating call status to:', data.status);
          setActiveCall(prev => prev ? { ...prev, status: data.status } : null);
        }
      }
      // Format 3: Direct activeCall object (legacy format)
      else if (data && typeof data === 'object' && 'callId' in data && 'meetingId' in data) {
        console.log('[CallProvider] Setting activeCall from legacy format:', data);
        // Cancel any pending clear
        if (clearActiveCallTimeout.current) {
          clearTimeout(clearActiveCallTimeout.current);
          clearActiveCallTimeout.current = null;
        }
        setActiveCall(data as ActiveCall);
      }
      // Format 4: Unknown format - log but don't change state
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
      
      // Clean up any pending timeouts to prevent memory leaks
      if (clearActiveCallTimeout.current) {
        clearTimeout(clearActiveCallTimeout.current);
        clearActiveCallTimeout.current = null;
      }
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