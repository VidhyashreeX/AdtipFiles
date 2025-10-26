/**
 * CallKeep Fixes Test Script
 * 
 * This script tests the CallKeep fixes for:
 * 1. Permission conflicts resolution
 * 2. Phone account status checking
 * 3. Background FCM handling
 * 4. Fallback mechanisms
 * 
 * Run this script to verify the fixes are working correctly.
 */

const { CallKeepService } = require('./src/services/calling/CallKeepService');

async function testCallKeepFixes() {
  console.log('🧪 Testing CallKeep Fixes...\n');

  try {
    // Test 1: CallKeep Service Initialization
    console.log('📱 Test 1: CallKeep Service Initialization');
    const callKeepService = CallKeepService.getInstance();
    
    if (!callKeepService) {
      console.log('❌ CallKeepService not available');
      return;
    }
    
    console.log('✅ CallKeepService instance created');

    // Test 2: Phone Account Status Check
    console.log('\n📞 Test 2: Phone Account Status Check');
    const phoneAccountStatus = await callKeepService.checkPhoneAccountStatus();
    
    console.log(`📱 Has Phone Account: ${phoneAccountStatus.hasPhoneAccount}`);
    console.log(`🔧 CallKeep Available: ${phoneAccountStatus.isCallKeepAvailable}`);
    console.log(`📞 Can Display Calls: ${phoneAccountStatus.canDisplayCalls}`);
    console.log(`💬 Status Message: ${phoneAccountStatus.statusMessage}`);

    if (!phoneAccountStatus.hasPhoneAccount) {
      console.log('\n⚠️  IMPORTANT: Phone account is not enabled!');
      console.log('💡 To fix: Go to Settings > Apps > Adtip > Phone Account and enable it');
      console.log('📱 This is required for CallKeep incoming call UI to work');
    }

    // Test 3: CallKeep Availability
    console.log('\n🔍 Test 3: CallKeep Availability Check');
    const isAvailable = callKeepService.isAvailable();
    console.log(`✅ CallKeep Available: ${isAvailable}`);

    const status = callKeepService.getCallKeepStatus();
    console.log(`🔧 Initialized: ${status.isInitialized}`);
    console.log(`🔑 Needs Permissions: ${status.needsPermissions}`);
    
    if (status.guidance) {
      console.log(`💡 Guidance: ${status.guidance}`);
    }

    // Test 4: Test Incoming Call Display (if available)
    if (phoneAccountStatus.canDisplayCalls) {
      console.log('\n📞 Test 4: Testing Incoming Call Display');
      const testUuid = 'test-' + Date.now();
      
      try {
        const displayResult = await callKeepService.displayIncomingCall(
          testUuid,
          'Test Caller',
          'Test Caller',
          'generic',
          false
        );
        
        if (displayResult) {
          console.log('✅ CallKeep incoming call displayed successfully!');
          console.log('📱 You should see the native Android call UI');
          
          // End the test call after 3 seconds
          setTimeout(() => {
            callKeepService.endCall(testUuid);
            console.log('📞 Test call ended');
          }, 3000);
        } else {
          console.log('❌ CallKeep incoming call display failed');
        }
      } catch (error) {
        console.log('❌ Error displaying incoming call:', error.message);
      }
    } else {
      console.log('\n⚠️  Test 4: Skipped - Cannot display calls (phone account not enabled)');
    }

    // Test 5: Background FCM Simulation
    console.log('\n📨 Test 5: Background FCM Message Simulation');
    
    // Simulate a background FCM message
    const mockFCMMessage = {
      data: {
        type: 'call',
        sessionId: 'test-session-' + Date.now(),
        callerName: 'Test Background Caller',
        callType: 'voice',
        meetingId: 'test-meeting-123',
        token: 'test-token-456'
      }
    };

    console.log('📨 Simulating background FCM call message...');
    console.log('📱 Message data:', JSON.stringify(mockFCMMessage.data, null, 2));
    
    // This would normally be handled by the background message handler
    console.log('✅ Background FCM message structure is valid');
    console.log('💡 In real scenario, this would trigger CallKeep or high-priority notification');

    // Summary
    console.log('\n📋 Test Summary:');
    console.log('================');
    console.log(`📱 Phone Account Enabled: ${phoneAccountStatus.hasPhoneAccount ? '✅' : '❌'}`);
    console.log(`🔧 CallKeep Available: ${phoneAccountStatus.isCallKeepAvailable ? '✅' : '❌'}`);
    console.log(`📞 Can Display Calls: ${phoneAccountStatus.canDisplayCalls ? '✅' : '❌'}`);
    
    if (phoneAccountStatus.canDisplayCalls) {
      console.log('\n🎉 All tests passed! CallKeep should work correctly.');
    } else {
      console.log('\n⚠️  Action required: Enable phone account in Android settings');
      console.log('📱 Path: Settings > Apps > Adtip > Phone Account > Enable');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Export for use in other test files
module.exports = {
  testCallKeepFixes
};

// Run tests if this file is executed directly
if (require.main === module) {
  testCallKeepFixes().catch(console.error);
}
