/**
 * Debug Phone Account Status
 * 
 * This script helps debug the phone account issue where hasPhoneAccount() returns false
 * even after enabling the account in Android settings.
 * 
 * Run this in the React Native debugger console or add it to a debug screen.
 */

// Function to test phone account status with detailed logging
async function debugPhoneAccountStatus() {
  console.log('🔍 Starting Phone Account Debug...\n');

  try {
    // Import CallKeep
    let RNCallKeep;
    try {
      RNCallKeep = require('react-native-callkeep').default;
      console.log('✅ CallKeep library imported successfully');
    } catch (error) {
      console.error('❌ Failed to import CallKeep:', error);
      return;
    }

    if (!RNCallKeep) {
      console.error('❌ CallKeep is null or undefined');
      return;
    }

    // Check available methods
    console.log('\n📋 Available CallKeep methods:');
    const methods = ['setup', 'registerPhoneAccount', 'hasPhoneAccount', 'setAvailable', 'displayIncomingCall'];
    methods.forEach(method => {
      const available = typeof RNCallKeep[method] === 'function';
      console.log(`  ${method}: ${available ? '✅' : '❌'}`);
    });

    // Test 1: Initial phone account check
    console.log('\n📱 Test 1: Initial phone account check');
    try {
      const hasPhoneAccount1 = await RNCallKeep.hasPhoneAccount();
      console.log(`Initial hasPhoneAccount: ${hasPhoneAccount1}`);
    } catch (error) {
      console.error('Error in initial check:', error);
    }

    // Test 2: Re-register phone account
    console.log('\n🔄 Test 2: Re-registering phone account');
    const options = {
      ios: {
        appName: 'Adtip',
        supportsVideo: true,
        maximumCallGroups: '1',
        maximumCallsPerCallGroup: '1',
      },
      android: {
        alertTitle: 'Phone Account Permission',
        alertDescription: 'Adtip needs access to your phone accounts for native call experience',
        cancelButton: 'Cancel',
        okButton: 'OK',
        imageName: 'ic_launcher',
        additionalPermissions: [],
        selfManaged: false,
        foregroundService: {
          channelId: 'com.adtip.calling',
          channelName: 'Adtip Calling Service',
          notificationTitle: 'Adtip is handling a call',
          notificationIcon: 'ic_launcher'
        }
      }
    };

    try {
      await RNCallKeep.registerPhoneAccount(options);
      console.log('✅ Phone account registration completed');
    } catch (error) {
      console.error('❌ Phone account registration failed:', error);
    }

    // Test 3: Wait and check again
    console.log('\n⏳ Test 3: Waiting 2 seconds and checking again...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const hasPhoneAccount2 = await RNCallKeep.hasPhoneAccount();
      console.log(`After registration hasPhoneAccount: ${hasPhoneAccount2}`);
    } catch (error) {
      console.error('Error in second check:', error);
    }

    // Test 4: Multiple rapid checks
    console.log('\n🔄 Test 4: Multiple rapid checks (sometimes Android needs multiple attempts)');
    for (let i = 1; i <= 5; i++) {
      try {
        const hasPhoneAccount = await RNCallKeep.hasPhoneAccount();
        console.log(`Check ${i}: ${hasPhoneAccount}`);
        
        if (hasPhoneAccount) {
          console.log('✅ Phone account detected! Breaking loop.');
          break;
        }
        
        // Small delay between checks
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Check ${i} failed:`, error);
      }
    }

    // Test 5: Try to set availability
    console.log('\n🔧 Test 5: Setting CallKeep availability');
    try {
      await RNCallKeep.setAvailable(true);
      console.log('✅ CallKeep availability set to true');
    } catch (error) {
      console.error('❌ Failed to set availability:', error);
    }

    // Test 6: Final comprehensive check
    console.log('\n📋 Test 6: Final comprehensive status');
    try {
      const hasPhoneAccount = await RNCallKeep.hasPhoneAccount();
      console.log(`Final hasPhoneAccount: ${hasPhoneAccount}`);
      
      if (hasPhoneAccount) {
        console.log('🎉 SUCCESS: Phone account is now detected!');
        console.log('📞 You should now be able to display incoming calls');
      } else {
        console.log('⚠️  ISSUE: Phone account still not detected');
        console.log('💡 Possible solutions:');
        console.log('   1. Restart the app completely');
        console.log('   2. Check Android Settings > Apps > Adtip > Phone Account');
        console.log('   3. Try disabling and re-enabling the phone account');
        console.log('   4. Clear app cache and restart');
      }
    } catch (error) {
      console.error('Final check failed:', error);
    }

  } catch (error) {
    console.error('❌ Debug script failed:', error);
  }
}

// Function to test incoming call display
async function testIncomingCallDisplay() {
  console.log('\n📞 Testing Incoming Call Display...');
  
  try {
    const RNCallKeep = require('react-native-callkeep').default;
    
    const hasPhoneAccount = await RNCallKeep.hasPhoneAccount();
    console.log(`Phone account status: ${hasPhoneAccount}`);
    
    if (!hasPhoneAccount) {
      console.log('❌ Cannot test - phone account not enabled');
      return;
    }
    
    const testUuid = 'debug-test-' + Date.now();
    console.log(`Testing with UUID: ${testUuid}`);
    
    await RNCallKeep.displayIncomingCall(
      testUuid,
      'Debug Test Caller',
      'Debug Test Caller',
      'generic',
      false
    );
    
    console.log('✅ displayIncomingCall executed - check if native UI appeared');
    
    // End the call after 5 seconds
    setTimeout(() => {
      RNCallKeep.endCall(testUuid);
      console.log('📞 Test call ended');
    }, 5000);
    
  } catch (error) {
    console.error('❌ Test call failed:', error);
  }
}

// Export functions for use in debug screens
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    debugPhoneAccountStatus,
    testIncomingCallDisplay
  };
}

// Auto-run if in debug environment
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  console.log('🧪 Phone Account Debug Script Loaded');
  console.log('📱 Run debugPhoneAccountStatus() to start debugging');
  console.log('📞 Run testIncomingCallDisplay() to test call display');
}
