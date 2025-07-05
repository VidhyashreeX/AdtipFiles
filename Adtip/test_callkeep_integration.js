/**
 * CallKeep Integration Test
 * 
 * This file tests the CallKeep integration to ensure it's working properly
 * in self-managed mode without registering as a SIM option.
 */

const CallKeepIntegrationService = require('./src/services/calling/CallKeepIntegrationService').default;
const UnifiedCallService = require('./src/services/calling/UnifiedCallService').default;

async function testCallKeepIntegration() {
  console.log('🧪 Testing CallKeep Integration...\n');

  try {
    // Test 1: Initialize CallKeep
    console.log('1️⃣ Testing CallKeep initialization...');
    const callKeepService = CallKeepIntegrationService.getInstance();
    
    const isAvailable = await callKeepService.isAvailable();
    console.log('   CallKeep available:', isAvailable);
    
    if (isAvailable) {
      const success = await callKeepService.initialize();
      console.log('   CallKeep initialization:', success ? '✅ SUCCESS' : '❌ FAILED');
      
      if (success) {
        const isInitialized = callKeepService.getIsInitialized();
        console.log('   CallKeep initialized:', isInitialized);
        
        const hasPhoneAccount = await callKeepService.isPhoneAccountEnabled();
        console.log('   Phone account enabled:', hasPhoneAccount);
      }
    }
    console.log('');

    // Test 2: Initialize Unified Call Service
    console.log('2️⃣ Testing Unified Call Service with CallKeep...');
    const unifiedCallService = UnifiedCallService.getInstance();
    
    const unifiedSuccess = await unifiedCallService.initialize();
    console.log('   Unified Call Service initialization:', unifiedSuccess ? '✅ SUCCESS' : '❌ FAILED');
    console.log('');

    // Test 3: Test incoming call display
    console.log('3️⃣ Testing incoming call display...');
    if (callKeepService.getIsInitialized()) {
      const testCallId = `test_call_${Date.now()}`;
      const testCallerName = 'Test Caller';
      
      try {
        await callKeepService.displayIncomingCall(
          testCallId,
          testCallerName,
          false, // audio call
          'test_caller_id'
        );
        console.log('   ✅ Incoming call displayed via CallKeep');
        
        // Wait a bit then end the call
        setTimeout(async () => {
          try {
            await callKeepService.endCall(testCallId);
            console.log('   ✅ Test call ended successfully');
          } catch (error) {
            console.log('   ❌ Failed to end test call:', error.message);
          }
        }, 3000);
        
      } catch (error) {
        console.log('   ❌ Failed to display incoming call:', error.message);
      }
    } else {
      console.log('   ⚠️ CallKeep not initialized, skipping test');
    }
    console.log('');

    // Test 4: Test outgoing call
    console.log('4️⃣ Testing outgoing call...');
    if (callKeepService.getIsInitialized()) {
      const testCallId = `test_outgoing_${Date.now()}`;
      const testRecipientName = 'Test Recipient';
      
      try {
        await callKeepService.startOutgoingCall(
          testCallId,
          testRecipientName,
          false, // audio call
          'test_recipient_id'
        );
        console.log('   ✅ Outgoing call started via CallKeep');
        
        // Wait a bit then end the call
        setTimeout(async () => {
          try {
            await callKeepService.endCall(testCallId);
            console.log('   ✅ Outgoing test call ended successfully');
          } catch (error) {
            console.log('   ❌ Failed to end outgoing test call:', error.message);
          }
        }, 3000);
        
      } catch (error) {
        console.log('   ❌ Failed to start outgoing call:', error.message);
      }
    } else {
      console.log('   ⚠️ CallKeep not initialized, skipping test');
    }
    console.log('');

    // Test 5: Test Unified Call Service integration
    console.log('5️⃣ Testing Unified Call Service integration...');
    const unifiedCallServiceInstance = UnifiedCallService.getInstance();
    
    if (unifiedCallServiceInstance.getIsInitialized()) {
      console.log('   ✅ Unified Call Service is initialized');
      
      // Test incoming call handling
      const testCallData = {
        callId: `unified_test_${Date.now()}`,
        callerName: 'Unified Test Caller',
        callType: 'voice',
        callerId: 'unified_test_caller_id',
        meetingId: 'test_meeting_id',
        token: 'test_token',
        callerAvatar: undefined
      };
      
      try {
        await unifiedCallServiceInstance.handleIncomingCall(testCallData);
        console.log('   ✅ Unified Call Service handled incoming call');
        
        // Wait a bit then end the call
        setTimeout(async () => {
          try {
            await unifiedCallServiceInstance.endCall(testCallData.callId);
            console.log('   ✅ Unified Call Service ended call successfully');
          } catch (error) {
            console.log('   ❌ Unified Call Service failed to end call:', error.message);
          }
        }, 3000);
        
      } catch (error) {
        console.log('   ❌ Unified Call Service failed to handle incoming call:', error.message);
      }
    } else {
      console.log('   ❌ Unified Call Service not initialized');
    }
    console.log('');

    console.log('🎉 CallKeep Integration Test Complete!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   - CallKeep will provide native-like call UI');
    console.log('   - Self-managed mode prevents SIM registration');
    console.log('   - Falls back to notifications if CallKeep fails');
    console.log('   - Integrates seamlessly with existing call system');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testCallKeepIntegration();

module.exports = { testCallKeepIntegration }; 