/**
 * Call Store Integration Examples
 * 
 * This file demonstrates how to integrate the new Zustand call store
 * with existing components and services.
 */

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { 
  useCallStore, 
  useCallActions, 
  useCallState, 
  useMediaState, 
  useCallValidation,
  useCallStatusChange,
  useFormattedCallDuration,
  useCallError
} from '../stores';

// ===== EXAMPLE 1: SIMPLE CALL CONTROLS =====

export const SimpleCallControls = () => {
  const { callStatus, activeCall, isInCall } = useCallState();
  const { micEnabled, cameraEnabled, speakerEnabled } = useMediaState();
  const { toggleMic, toggleCamera, toggleSpeaker, endCall } = useCallActions();
  const { canToggleMedia, canEndCall } = useCallValidation();
  
  if (!isInCall) return null;
  
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-around', padding: 20 }}>
      <TouchableOpacity
        onPress={toggleMic}
        disabled={!canToggleMedia}
        style={{ padding: 10, backgroundColor: micEnabled ? 'green' : 'red' }}
      >
        <Text style={{ color: 'white' }}>
          {micEnabled ? 'Mute' : 'Unmute'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        onPress={toggleCamera}
        disabled={!canToggleMedia}
        style={{ padding: 10, backgroundColor: cameraEnabled ? 'green' : 'red' }}
      >
        <Text style={{ color: 'white' }}>
          {cameraEnabled ? 'Camera Off' : 'Camera On'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        onPress={toggleSpeaker}
        disabled={!canToggleMedia}
        style={{ padding: 10, backgroundColor: speakerEnabled ? 'green' : 'red' }}
      >
        <Text style={{ color: 'white' }}>
          {speakerEnabled ? 'Speaker Off' : 'Speaker On'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        onPress={() => endCall('user_ended')}
        disabled={!canEndCall}
        style={{ padding: 10, backgroundColor: 'red' }}
      >
        <Text style={{ color: 'white' }}>End Call</Text>
      </TouchableOpacity>
    </View>
  );
};

// ===== EXAMPLE 2: CALL STATUS INDICATOR =====

export const CallStatusIndicator = () => {
  const { callStatus, activeCall } = useCallState();
  const formattedDuration = useFormattedCallDuration();
  const { error, hasError } = useCallError();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'gray';
      case 'dialing': return 'blue';
      case 'ringing': return 'orange';
      case 'connecting': return 'yellow';
      case 'connected': return 'green';
      case 'ending': return 'red';
      case 'ended': return 'gray';
      default: return 'gray';
    }
  };
  
  return (
    <View style={{ padding: 10, alignItems: 'center' }}>
      <View
        style={{
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: getStatusColor(callStatus),
          marginBottom: 5,
        }}
      />
      <Text style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
        {callStatus}
      </Text>
      
      {activeCall && (
        <Text style={{ fontSize: 12, color: 'gray' }}>
          {activeCall.isInitiator ? 'Outgoing' : 'Incoming'} {activeCall.callType}
        </Text>
      )}
      
      {activeCall && callStatus === 'connected' && (
        <Text style={{ fontSize: 14, fontWeight: 'bold' }}>
          {formattedDuration}
        </Text>
      )}
      
      {hasError && (
        <Text style={{ color: 'red', fontSize: 12 }}>
          Error: {error}
        </Text>
      )}
    </View>
  );
};

// ===== EXAMPLE 3: INCOMING CALL SCREEN =====

export const IncomingCallScreen = () => {
  const { activeCall, callStatus } = useCallState();
  const { acceptCall, declineCall } = useCallActions();
  const { canAcceptCall, canDeclineCall } = useCallValidation();
  
  if (callStatus !== 'ringing' || !activeCall || activeCall.isInitiator) {
    return null;
  }
  
  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.8)'
    }}>
      <Text style={{ color: 'white', fontSize: 24, marginBottom: 10 }}>
        Incoming Call
      </Text>
      
      <Text style={{ color: 'white', fontSize: 18, marginBottom: 20 }}>
        {activeCall.callerName}
      </Text>
      
      <Text style={{ color: 'white', fontSize: 16, marginBottom: 40 }}>
        {activeCall.callType} call
      </Text>
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '80%' }}>
        <TouchableOpacity
          onPress={() => declineCall('user_declined')}
          disabled={!canDeclineCall}
          style={{ 
            padding: 15, 
            backgroundColor: 'red', 
            borderRadius: 50,
            minWidth: 100,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            Decline
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={acceptCall}
          disabled={!canAcceptCall}
          style={{ 
            padding: 15, 
            backgroundColor: 'green', 
            borderRadius: 50,
            minWidth: 100,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            Accept
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ===== EXAMPLE 4: NAVIGATION INTEGRATION =====

export const CallNavigationHandler = () => {
  const navigation = useNavigation();
  
  useCallStatusChange((newStatus, prevStatus) => {
    console.log(`Call status changed: ${prevStatus} → ${newStatus}`);
    
    switch (newStatus) {
      case 'dialing':
      case 'connecting':
        // Navigate to meeting screen when call starts
        navigation.navigate('Meeting' as never);
        break;
        
      case 'ringing':
        // Could show incoming call overlay or navigate to incoming call screen
        break;
        
      case 'ended':
      case 'idle':
        // Navigate back to main screen when call ends
        if (prevStatus !== 'idle') {
          navigation.navigate('Home' as never);
        }
        break;
        
      default:
        break;
    }
  });
  
  return null; // This is just a handler component
};

// ===== EXAMPLE 5: INTEGRATION WITH UNIFIED CALL SERVICE =====

export const callServiceIntegration = {
  // Example of how UnifiedCallService would use the store
  startCall: (callData: any) => {
    const store = useCallStore.getState();
    
    // Update store state
    store.startOutgoingCall(callData);
    
    // Perform actual call logic (VideoSDK, notifications, etc.)
    // ...
    
    // Update status as call progresses
    store.setCallStatus('connecting');
  },
  
  handleIncomingCall: (callData: any) => {
    const store = useCallStore.getState();
    
    // Update store with incoming call
    store.setIncomingCall(callData);
    
    // Show notification, etc.
    // ...
  },
  
  endCall: (reason?: string) => {
    const store = useCallStore.getState();
    
    // Update store
    store.endCall(reason);
    
    // Cleanup VideoSDK, notifications, etc.
    // ...
  },
  
  updateMediaState: (mediaState: any) => {
    const store = useCallStore.getState();
    
    // Update store media state
    store.setMediaState(mediaState);
    
    // Update actual media devices
    // ...
  },
};

// ===== EXAMPLE 6: ERROR HANDLING =====

export const CallErrorHandler = () => {
  const { error, hasError, clearError } = useCallError();
  
  useEffect(() => {
    if (hasError) {
      Alert.alert(
        'Call Error',
        error || 'An unknown error occurred',
        [
          { text: 'OK', onPress: clearError }
        ]
      );
    }
  }, [hasError, error, clearError]);
  
  return null;
};

// ===== EXAMPLE 7: DEBUGGING COMPONENT =====

export const CallDebugger = () => {
  const store = useCallStore();
  
  if (!__DEV__) return null;
  
  return (
    <View style={{ 
      position: 'absolute', 
      top: 100, 
      right: 10, 
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: 10,
      borderRadius: 5,
      maxWidth: 200
    }}>
      <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
        DEBUG INFO
      </Text>
      <Text style={{ color: 'white', fontSize: 8 }}>
        Status: {store.callStatus}
      </Text>
      <Text style={{ color: 'white', fontSize: 8 }}>
        In Call: {store.isInCall ? 'Yes' : 'No'}
      </Text>
      <Text style={{ color: 'white', fontSize: 8 }}>
        Video: {store.isVideoCall ? 'Yes' : 'No'}
      </Text>
      <Text style={{ color: 'white', fontSize: 8 }}>
        Can Start: {store.canStartCall ? 'Yes' : 'No'}
      </Text>
      <Text style={{ color: 'white', fontSize: 8 }}>
        Call ID: {store.activeCall?.callId || 'None'}
      </Text>
      <Text style={{ color: 'white', fontSize: 8 }}>
        Mic: {store.mediaState.micEnabled ? 'On' : 'Off'}
      </Text>
      <Text style={{ color: 'white', fontSize: 8 }}>
        Camera: {store.mediaState.cameraEnabled ? 'On' : 'Off'}
      </Text>
      <Text style={{ color: 'white', fontSize: 8 }}>
        Speaker: {store.mediaState.speakerEnabled ? 'On' : 'Off'}
      </Text>
    </View>
  );
};

export default {
  SimpleCallControls,
  CallStatusIndicator,
  IncomingCallScreen,
  CallNavigationHandler,
  callServiceIntegration,
  CallErrorHandler,
  CallDebugger,
};
