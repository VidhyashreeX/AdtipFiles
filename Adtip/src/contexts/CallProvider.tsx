import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { MeetingProvider } from '@videosdk.live/react-native-sdk';
import CallService from '../services/CallService';
import OngoingCallModule from '../services/OngoingCallModule';
import { AppState, AppStateStatus, NativeEventEmitter, NativeModules } from 'react-native';

export interface ActiveCall {
  meetingId: string;
  token: string;
  callType: 'voice' | 'video';
  displayName: string;
  isInitiator: boolean;
  recipientName: string;
}

interface CallContextType {
  activeCall: ActiveCall | null;
  startCall: (callData: ActiveCall) => void;
  endCall: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);

  useEffect(() => {
    const eventEmitter = new NativeEventEmitter(NativeModules.OngoingCall);
    const subscription = eventEmitter.addListener('EndCall', () => {
      console.log('[CallProvider] Received EndCall event from native notification.');
      endCall();
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (activeCall) {
        if (nextAppState === 'background') {
          OngoingCallModule.startOngoingCallNotification(
            'Ongoing Call',
            `In call with ${activeCall.recipientName || 'participant'}`
          );
        } else if (nextAppState === 'active') {
          OngoingCallModule.stopOngoingCallNotification();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [activeCall]);

  const startCall = (callData: ActiveCall) => {
    setActiveCall(callData);
  };

  const endCall = () => {
    if (activeCall) {
      OngoingCallModule.stopOngoingCallNotification();
      // The leave() method inside MeetingScreen will trigger the actual end
      // We just clear the state here
      setActiveCall(null);
    }
  };
  
  const value = { activeCall, startCall, endCall };

  if (activeCall) {
    return (
      <CallContext.Provider value={value}>
        <MeetingProvider
          config={{
            meetingId: activeCall.meetingId,
            micEnabled: true,
            webcamEnabled: activeCall.callType === 'video',
            name: activeCall.displayName,
          }}
          token={activeCall.token}
        >
          {children}
        </MeetingProvider>
      </CallContext.Provider>
    );
  }

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