/**
 * Call Store Test Utilities
 * 
 * This file provides utilities for testing the call store functionality
 * and validating state transitions during development.
 */

import { useCallStore, CallData, CallStatus, MediaState } from './callStore';

// ===== TEST UTILITIES =====

/**
 * Create a mock call data object for testing
 */
export const createMockCallData = (overrides?: Partial<CallData>): Omit<CallData, 'status' | 'timestamp'> => {
  return {
    callId: 'test-call-id',
    meetingId: 'test-meeting-id',
    token: 'test-token',
    callerName: 'Test Caller',
    recipientName: 'Test Recipient',
    callType: 'voice',
    callerId: 'test-caller-id',
    recipientId: 'test-recipient-id',
    isInitiator: true,
    ...overrides,
  };
};

/**
 * Test all call state transitions
 */
export const testCallStateTransitions = () => {
  console.log('=== Testing Call State Transitions ===');
  
  const store = useCallStore.getState();
  
  // Test 1: Initial state
  console.log('1. Initial state:', {
    callStatus: store.callStatus,
    activeCall: store.activeCall,
    isInCall: store.isInCall,
    canStartCall: store.canStartCall,
  });
  
  // Test 2: Service initialization
  store.setServiceInitialized(true);
  console.log('2. After service init:', {
    isCallServiceInitialized: store.isCallServiceInitialized,
    canStartCall: store.canStartCall,
  });
  
  // Test 3: Start outgoing call
  const mockCall = createMockCallData();
  store.startOutgoingCall(mockCall);
  console.log('3. After starting outgoing call:', {
    callStatus: store.callStatus,
    activeCall: store.activeCall,
    isInCall: store.isInCall,
    isVideoCall: store.isVideoCall,
  });
  
  // Test 4: Call connecting
  store.setCallStatus('connecting');
  console.log('4. After connecting:', {
    callStatus: store.callStatus,
    activeCall: store.activeCall?.status,
  });
  
  // Test 5: Call connected
  store.setCallStatus('connected');
  console.log('5. After connected:', {
    callStatus: store.callStatus,
    activeCall: store.activeCall?.status,
  });
  
  // Test 6: Toggle media
  store.toggleMic();
  store.toggleCamera();
  console.log('6. After toggling media:', {
    mediaState: store.mediaState,
  });
  
  // Test 7: End call
  store.endCall('user_ended');
  console.log('7. After ending call:', {
    callStatus: store.callStatus,
    lastCallEndReason: store.lastCallEndReason,
    callMetrics: store.callMetrics,
  });
  
  // Test 8: Cleanup
  setTimeout(() => {
    console.log('8. After cleanup:', {
      callStatus: store.callStatus,
      activeCall: store.activeCall,
      isInCall: store.isInCall,
    });
  }, 1100);
};

/**
 * Test incoming call flow
 */
export const testIncomingCallFlow = () => {
  console.log('=== Testing Incoming Call Flow ===');
  
  const store = useCallStore.getState();
  
  // Reset state
  store.resetCallState();
  store.setServiceInitialized(true);
  
  // Test incoming call
  const incomingCall: CallData = {
    ...createMockCallData({
      isInitiator: false,
      callType: 'video',
    }),
    status: 'ringing',
    timestamp: Date.now(),
  };
  
  store.setIncomingCall(incomingCall);
  console.log('1. After incoming call:', {
    callStatus: store.callStatus,
    activeCall: store.activeCall,
    isVideoCall: store.isVideoCall,
  });
  
  // Test accept call
  store.acceptCall();
  console.log('2. After accepting call:', {
    callStatus: store.callStatus,
    activeCall: store.activeCall?.status,
  });
  
  // Test decline call
  store.declineCall('user_declined');
  console.log('3. After declining call:', {
    callStatus: store.callStatus,
    lastCallEndReason: store.lastCallEndReason,
  });
};

/**
 * Test media state management
 */
export const testMediaState = () => {
  console.log('=== Testing Media State Management ===');
  
  const store = useCallStore.getState();
  
  // Reset state
  store.resetCallState();
  
  // Test initial media state
  console.log('1. Initial media state:', store.mediaState);
  
  // Test individual toggles
  store.toggleMic();
  console.log('2. After mic toggle:', store.mediaState);
  
  store.toggleCamera();
  console.log('3. After camera toggle:', store.mediaState);
  
  store.toggleSpeaker();
  console.log('4. After speaker toggle:', store.mediaState);
  
  // Test batch update
  store.setMediaState({
    micEnabled: false,
    cameraEnabled: true,
    speakerEnabled: false,
    isVideoCall: true,
  });
  console.log('5. After batch update:', store.mediaState);
};

/**
 * Test error handling
 */
export const testErrorHandling = () => {
  console.log('=== Testing Error Handling ===');
  
  const store = useCallStore.getState();
  
  // Test setting error
  store.setError('Test error message');
  console.log('1. After setting error:', store.lastError);
  
  // Test clearing error
  store.clearError();
  console.log('2. After clearing error:', store.lastError);
};

/**
 * Test call metrics
 */
export const testCallMetrics = () => {
  console.log('=== Testing Call Metrics ===');
  
  const store = useCallStore.getState();
  
  // Reset metrics
  store.updateCallMetrics({
    totalCalls: 0,
    totalDuration: 0,
    callHistory: [],
  });
  
  console.log('1. Initial metrics:', store.callMetrics);
  
  // Add test calls to history
  store.addCallToHistory({
    callId: 'call-1',
    startTime: Date.now() - 120000,
    endTime: Date.now() - 60000,
    duration: 60000,
    type: 'voice',
    status: 'completed',
  });
  
  store.addCallToHistory({
    callId: 'call-2',
    startTime: Date.now() - 300000,
    endTime: Date.now() - 240000,
    duration: 60000,
    type: 'video',
    status: 'completed',
  });
  
  console.log('2. After adding calls:', store.callMetrics);
};

/**
 * Run all tests
 */
export const runAllTests = () => {
  console.log('🧪 Running Call Store Tests...\n');
  
  testCallStateTransitions();
  
  setTimeout(() => {
    testIncomingCallFlow();
  }, 1500);
  
  setTimeout(() => {
    testMediaState();
  }, 2000);
  
  setTimeout(() => {
    testErrorHandling();
  }, 2500);
  
  setTimeout(() => {
    testCallMetrics();
  }, 3000);
  
  setTimeout(() => {
    console.log('\n✅ All tests completed!');
  }, 3500);
};

// ===== DEBUGGING UTILITIES =====

/**
 * Subscribe to store changes for debugging
 */
export const enableStoreDebugging = () => {
  const unsubscribe = useCallStore.subscribe((state) => {
    console.log('🔄 Store state changed:', {
      callStatus: state.callStatus,
      activeCall: state.activeCall?.callId,
      isInCall: state.isInCall,
      mediaState: state.mediaState,
    });
  });
  
  console.log('🐛 Store debugging enabled');
  return unsubscribe;
};

/**
 * Log current store state
 */
export const logCurrentState = () => {
  const state = useCallStore.getState();
  console.log('📊 Current store state:', {
    callStatus: state.callStatus,
    activeCall: state.activeCall,
    mediaState: state.mediaState,
    isInCall: state.isInCall,
    isVideoCall: state.isVideoCall,
    canStartCall: state.canStartCall,
    callMetrics: state.callMetrics,
    lastError: state.lastError,
  });
};

export default {
  createMockCallData,
  testCallStateTransitions,
  testIncomingCallFlow,
  testMediaState,
  testErrorHandling,
  testCallMetrics,
  runAllTests,
  enableStoreDebugging,
  logCurrentState,
};
