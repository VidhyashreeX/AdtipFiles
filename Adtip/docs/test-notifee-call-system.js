/**
 * Test Script for Notifee Call System
 * 
 * This script tests the new Notifee-based call system and outgoing call ringing
 * Run this in React Native debugger console or add to debug screen
 */

// Test Notifee Call Handler
async function testNotifeeCallHandler() {
  console.log('🧪 Testing Notifee Call Handler...\n');

  try {
    // Import NotifeeCallHandler
    const { default: NotifeeCallHandler } = await import('./src/services/notification/NotifeeCallHandler');
    const handler = NotifeeCallHandler.getInstance();

    console.log('✅ NotifeeCallHandler imported successfully');

    // Test initialization
    await handler.initialize();
    console.log('✅ NotifeeCallHandler initialized successfully');

    // Test display incoming call
    const testParams = {
      sessionId: 'test-session-' + Date.now(),
      callerName: 'Test Caller',
      callType: 'video',
      meetingId: 'test-meeting-123',
      token: 'test-token-456'
    };

    console.log('📱 Testing incoming call display...');
    const success = await handler.displayIncomingCall(testParams);

    if (success) {
      console.log('✅ Incoming call notification displayed successfully!');
      console.log('📋 Test parameters:', testParams);
      console.log('💡 Check your notification panel or lock screen');
    } else {
      console.log('❌ Failed to display incoming call notification');
    }

  } catch (error) {
    console.error('❌ NotifeeCallHandler test failed:', error);
  }
}

// Test Navigation Service
async function testNavigationService() {
  console.log('\n🧭 Testing Navigation Service...\n');

  try {
    // Import NavigationService
    const NavigationService = await import('./src/navigation/SimplifiedNavigationService');
    const navService = NavigationService.default;

    console.log('✅ NavigationService imported successfully');

    // Test navigate to meeting
    const meetingParams = {
      meetingId: 'test-meeting-' + Date.now(),
      token: 'test-token-' + Date.now(),
      displayName: 'Test User',
      callType: 'video',
      isInitiator: false,
      recipientName: 'Test Caller',
      callData: {
        sessionId: 'test-session-123',
        direction: 'incoming',
        type: 'video'
      }
    };

    console.log('📱 Testing navigation to meeting screen...');
    const success = navService.navigateToMeeting(meetingParams);

    if (success) {
      console.log('✅ Navigation to meeting screen successful!');
      console.log('📋 Meeting parameters:', meetingParams);
    } else {
      console.log('❌ Navigation to meeting screen failed');
    }

  } catch (error) {
    console.error('❌ NavigationService test failed:', error);
  }
}

// Test Ringing Audio Service
async function testRingingAudioService() {
  console.log('\n🔔 Testing Ringing Audio Service...\n');

  try {
    // Import RingingAudioService
    const { RingingAudioService } = await import('./src/services/audio/RingingAudioService');
    const ringingService = RingingAudioService.getInstance();

    console.log('✅ RingingAudioService imported successfully');

    // Test start ringing
    console.log('🔔 Starting ringing...');
    ringingService.startRinging();
    
    const isRinging = ringingService.isCurrentlyRinging();
    console.log(`📋 Is currently ringing: ${isRinging}`);

    if (isRinging) {
      console.log('✅ Ringing started successfully!');
      console.log('🔊 You should hear ringing sound');
      
      // Stop ringing after 3 seconds
      setTimeout(() => {
        console.log('🔕 Stopping ringing...');
        ringingService.stopRinging();
        console.log('✅ Ringing stopped');
      }, 3000);
    } else {
      console.log('❌ Failed to start ringing');
    }

  } catch (error) {
    console.error('❌ RingingAudioService test failed:', error);
  }
}

// Test Deep Link
async function testDeepLink() {
  console.log('\n🔗 Testing Deep Link...\n');

  try {
    const { Linking } = require('react-native');
    
    const testUrl = 'adtip://meeting?meetingId=test123&token=testtoken&callerName=TestCaller&callType=video';
    console.log('🔗 Testing deep link:', testUrl);

    const canOpen = await Linking.canOpenURL(testUrl);
    console.log(`📋 Can open URL: ${canOpen}`);

    if (canOpen) {
      console.log('✅ Deep link is supported');
      console.log('💡 You can test opening it manually');
    } else {
      console.log('❌ Deep link not supported');
    }

  } catch (error) {
    console.error('❌ Deep link test failed:', error);
  }
}

// Test Notifee Permissions
async function testNotifeePermissions() {
  console.log('\n🔐 Testing Notifee Permissions...\n');

  try {
    const notifee = require('@notifee/react-native').default;
    
    // Check notification settings
    const settings = await notifee.getNotificationSettings();
    console.log('📋 Notification settings:', settings);

    // Request permissions
    const permission = await notifee.requestPermission();
    console.log('📋 Permission result:', permission);

    // Create test channel
    const channelId = await notifee.createChannel({
      id: 'test_channel',
      name: 'Test Channel',
      importance: 4, // HIGH
    });
    console.log('✅ Test channel created:', channelId);

    // Display test notification
    await notifee.displayNotification({
      id: 'test-notification',
      title: 'Test Notification',
      body: 'This is a test notification',
      android: {
        channelId,
        importance: 4,
      }
    });
    console.log('✅ Test notification displayed');

  } catch (error) {
    console.error('❌ Notifee permissions test failed:', error);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Notifee Call System Tests...\n');
  console.log('=' .repeat(50));

  await testNotifeeCallHandler();
  await testNavigationService();
  await testRingingAudioService();
  await testDeepLink();
  await testNotifeePermissions();

  console.log('\n' + '='.repeat(50));
  console.log('🎉 All tests completed!');
  console.log('\n📱 HOW TO USE THE NEW FEATURES:');
  console.log('1. Look for "🧪 Debug Tests" panel in top-left corner');
  console.log('2. Tap "📱 Test Notifee Incoming Call" to test notifications');
  console.log('3. Tap "📞 Test Outgoing Call Ringing" to test ringing');
  console.log('4. Test in different app states (foreground/background/killed)');
  console.log('5. Verify navigation works when tapping "Answer"');
}

// Export functions for use in debug screens
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testNotifeeCallHandler,
    testNavigationService,
    testRingingAudioService,
    testDeepLink,
    testNotifeePermissions,
    runAllTests
  };
}

// Auto-run if in debug environment
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  console.log('🧪 Notifee Call System Test Script Loaded');
  console.log('📱 Run runAllTests() to test all features');
  console.log('🔧 Or run individual test functions');
}
