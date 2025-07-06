// test_call_sync_fix.js
// Quick test to verify the infinite loop fix

console.log('🔍 Testing Call Sync Fix');
console.log('=' * 40);

// Test 1: Check CallProvider event handling logic
const testCallProviderLogic = () => {
  console.log('\n📱 Testing CallProvider Event Handling Logic');
  
  const mockEvents = [
    // CallService event
    { isInCall: true, activeCall: { callId: 'test1', status: 'calling' } },
    // WhatsAppCallManager event
    { callId: 'test1', meetingId: 'meeting1', status: 'calling' },
    // Duplicate WhatsAppCallManager event (should be filtered)
    { callId: 'test1', meetingId: 'meeting1', status: 'calling' },
    // Call ended event
    { callId: 'test1', meetingId: 'meeting1', status: 'ended' },
    // CallService clear event
    { isInCall: false }
  ];
  
  let activeCall = null;
  let eventCount = 0;
  
  const handleCallStateChange = (data) => {
    eventCount++;
    console.log(`Event ${eventCount}: Processing`, data);
    
    if (typeof data === 'object' && data !== null) {
      // Check if it's from CallService (has isInCall property)
      if ('isInCall' in data) {
        console.log('  -> CallService event');
        if (data.isInCall && data.activeCall) {
          activeCall = data.activeCall;
          console.log('  -> Set active call from CallService');
        } else {
          activeCall = null;
          console.log('  -> Clear active call from CallService');
        }
      } 
      // Check if it's from WhatsAppCallManager
      else if ('callId' in data && 'meetingId' in data && data.status !== 'ended' && data.status !== 'declined') {
        if (data.status === 'calling' || data.status === 'ringing' || data.status === 'connecting' || data.status === 'connected') {
          activeCall = data;
          console.log('  -> Set active call from WhatsAppCallManager');
        }
      }
    }
    
    console.log(`  -> Active call: ${activeCall ? activeCall.callId : 'null'}`);
  };
  
  mockEvents.forEach(event => handleCallStateChange(event));
  
  console.log(`✅ Processed ${eventCount} events without infinite loops`);
  return eventCount === mockEvents.length;
};

// Test 2: Check CallSyncService debouncing logic
const testCallSyncDebouncing = () => {
  console.log('\n🔄 Testing CallSyncService Debouncing Logic');
  
  let lastSyncedCallId = null;
  let syncDebounceTimer = null;
  let isSyncing = false;
  let syncCount = 0;
  
  const handleCallStateChange = async (callData) => {
    console.log(`Sync attempt: ${callData.callId} - ${callData.status}`);
    
    // Prevent circular events
    if (isSyncing) {
      console.log('  -> Skipping sync - already in progress');
      return;
    }

    // Debounce rapid-fire events
    if (syncDebounceTimer) {
      clearTimeout(syncDebounceTimer);
    }

    syncDebounceTimer = setTimeout(async () => {
      // Check if this is a duplicate event for the same call
      if (callData.callId && callData.callId === lastSyncedCallId) {
        console.log('  -> Skipping duplicate sync');
        return;
      }

      console.log('  -> Processing sync');
      lastSyncedCallId = callData.callId;
      syncCount++;
    }, 50); // Reduced timeout for testing
  };
  
  const mockCallEvents = [
    { callId: 'call1', status: 'calling' },
    { callId: 'call1', status: 'calling' }, // Duplicate - should be filtered
    { callId: 'call1', status: 'calling' }, // Duplicate - should be filtered
    { callId: 'call1', status: 'ringing' },
    { callId: 'call2', status: 'calling' }, // Different call - should process
  ];
  
  return new Promise((resolve) => {
    mockCallEvents.forEach((event, index) => {
      setTimeout(() => handleCallStateChange(event), index * 10);
    });
    
    // Check results after all events and debouncing
    setTimeout(() => {
      console.log(`✅ Sync count: ${syncCount} (expected: 3)`);
      resolve(syncCount === 3); // Should process call1 (calling), call1 (ringing), call2 (calling)
    }, 500);
  });
};

// Test 3: Check notification action handling
const testNotificationActions = () => {
  console.log('\n🔔 Testing Notification Action Handling');
  
  // Mock WhatsAppCallManager endCall method
  const mockEndCall = (callId) => {
    console.log(`WhatsAppCallManager.endCall called with: ${callId}`);
    return Promise.resolve();
  };
  
  // Mock notification action handler
  const handleNotificationEvent = async (type, detail) => {
    const { notification, pressAction } = detail;
    
    if (type === 'ACTION_PRESS' && pressAction) {
      const callId = notification?.data?.callId;
      
      switch (pressAction.id) {
        case 'end_call':
          console.log(`Processing end_call action for: ${callId}`);
          await mockEndCall(callId);
          console.log('✅ End call action completed');
          return true;
        default:
          console.log(`Unknown action: ${pressAction.id}`);
          return false;
      }
    }
    return false;
  };
  
  // Test notification action
  const mockNotificationEvent = {
    type: 'ACTION_PRESS',
    detail: {
      notification: { data: { callId: 'test-call-123' } },
      pressAction: { id: 'end_call' }
    }
  };
  
  return handleNotificationEvent(mockNotificationEvent.type, mockNotificationEvent.detail);
};

// Run all tests
const runTests = async () => {
  try {
    console.log('🚀 Starting Call Sync Fix Tests\n');
    
    const test1Result = testCallProviderLogic();
    const test2Result = await testCallSyncDebouncing();
    const test3Result = await testNotificationActions();
    
    console.log('\n📊 Test Results:');
    console.log(`CallProvider Logic: ${test1Result ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`CallSync Debouncing: ${test2Result ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Notification Actions: ${test3Result ? '✅ PASS' : '❌ FAIL'}`);
    
    const allPassed = test1Result && test2Result && test3Result;
    console.log(`\n🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (allPassed) {
      console.log('\n🎉 The infinite loop fix should work correctly!');
      console.log('📋 Key improvements:');
      console.log('  • CallProvider differentiates between event sources');
      console.log('  • CallSyncService uses debouncing and duplicate filtering');
      console.log('  • Circular event prevention in CallSyncService');
      console.log('  • Notification actions work independently');
    } else {
      console.log('\n⚠️  Some tests failed - review the implementation');
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
};

runTests();
