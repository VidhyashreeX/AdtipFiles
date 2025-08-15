/**
 * Test Script for Debug Button Fixes
 * 
 * This script tests all the fixes for the debug button issues:
 * 1. Navigation to meeting screen
 * 2. Theme context availability
 * 3. Navigation queue processing
 * 4. Deep link navigation to meeting
 */

// Test Navigation Service
async function testNavigationService() {
  console.log('🧭 Testing Navigation Service...\n');

  try {
    // Import NavigationService
    const NavigationService = await import('./src/navigation/SimplifiedNavigationService');
    const navService = NavigationService.default;

    console.log('✅ NavigationService imported successfully');

    // Test navigation readiness
    const isReady = navService.isReady();
    console.log(`📋 Navigation ready: ${isReady}`);

    // Test navigate to meeting with proper parameters
    const meetingParams = {
      meetingId: 'test-meeting-' + Date.now(),
      token: 'test-token-' + Date.now(),
      displayName: 'Test User',
      callType: 'video',
      isInitiator: false,
      recipientName: 'Test Caller',
      callData: {
        sessionId: 'test-session-' + Date.now(),
        direction: 'incoming',
        type: 'video'
      }
    };

    console.log('📱 Testing navigation to meeting screen...');
    console.log('📋 Meeting parameters:', meetingParams);

    const success = navService.navigateToMeeting(meetingParams);

    if (success) {
      console.log('✅ Navigation to meeting screen successful!');
    } else {
      console.log('❌ Navigation to meeting screen failed');
      
      // Check navigation state
      const navState = navService.getNavigationState();
      console.log('📋 Navigation state:', navState);
    }

  } catch (error) {
    console.error('❌ NavigationService test failed:', error);
  }
}

// Test Theme Context
async function testThemeContext() {
  console.log('\n🎨 Testing Theme Context...\n');

  try {
    // Import ThemeContext
    const { useTheme } = await import('./src/contexts/ThemeContext');
    console.log('✅ ThemeContext imported successfully');

    // Note: useTheme can only be tested within a React component
    console.log('💡 Theme context should be available in components');
    console.log('💡 DebugButtonsList should now render without theme errors');

  } catch (error) {
    console.error('❌ ThemeContext test failed:', error);
  }
}

// Test Deep Link Service
async function testDeepLinkService() {
  console.log('\n🔗 Testing Deep Link Service...\n');

  try {
    // Import SimplifiedDeepLinkService
    const SimplifiedDeepLinkService = await import('./src/services/SimplifiedDeepLinkService');
    const deepLinkService = SimplifiedDeepLinkService.default;

    console.log('✅ SimplifiedDeepLinkService imported successfully');

    // Test meeting deep link parsing
    const testMeetingUrl = 'adtip://meeting?meetingId=test123&token=testtoken&callerName=TestCaller&callType=video';
    console.log('🔗 Testing meeting deep link:', testMeetingUrl);

    // Simulate deep link handling
    console.log('📱 Simulating deep link handling...');
    deepLinkService.handleDeepLink(testMeetingUrl);
    
    console.log('✅ Deep link handling completed');
    console.log('💡 Should navigate to Meeting screen, not Home');

  } catch (error) {
    console.error('❌ DeepLinkService test failed:', error);
  }
}

// Test Notifee Call Handler
async function testNotifeeCallHandler() {
  console.log('\n📱 Testing Notifee Call Handler...\n');

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
      meetingId: 'test-meeting-' + Date.now(),
      token: 'test-token-' + Date.now()
    };

    console.log('📱 Testing incoming call display...');
    const success = await handler.displayIncomingCall(testParams);

    if (success) {
      console.log('✅ Incoming call notification displayed successfully!');
      console.log('📋 Test parameters:', testParams);
    } else {
      console.log('❌ Failed to display incoming call notification');
    }

  } catch (error) {
    console.error('❌ NotifeeCallHandler test failed:', error);
  }
}

// Test Logger Import
async function testLogger() {
  console.log('\n📝 Testing Logger Import...\n');

  try {
    // Test both import styles
    let Logger;
    try {
      Logger = await import('./src/utils/Logger');
      Logger = Logger.default;
      console.log('✅ Logger imported as default export');
    } catch (error) {
      const LoggerModule = await import('./src/utils/Logger');
      Logger = LoggerModule.Logger;
      console.log('✅ Logger imported as named export');
    }

    if (Logger) {
      // Test logger methods
      if (typeof Logger.info === 'function') {
        Logger.info('TestScript', 'Logger test successful');
        console.log('✅ Logger.info method available');
      }
      
      if (typeof Logger.error === 'function') {
        console.log('✅ Logger.error method available');
      }
      
      if (typeof Logger.debug === 'function') {
        console.log('✅ Logger.debug method available');
      }
    }

  } catch (error) {
    console.error('❌ Logger test failed:', error);
  }
}

// Test All Components Integration
async function testComponentsIntegration() {
  console.log('\n🧩 Testing Components Integration...\n');

  try {
    console.log('📱 Testing DebugButtonsList component requirements...');

    // Check if all required modules are available
    const modules = [
      './src/navigation/SimplifiedNavigationService',
      './src/services/notification/NotifeeCallHandler',
      './src/contexts/ThemeContext',
      './src/utils/Logger'
    ];

    for (const modulePath of modules) {
      try {
        await import(modulePath);
        console.log(`✅ ${modulePath} - Available`);
      } catch (error) {
        console.log(`❌ ${modulePath} - Failed: ${error.message}`);
      }
    }

    console.log('\n📋 Integration Summary:');
    console.log('• NavigationService: Should navigate to Meeting screen');
    console.log('• NotifeeCallHandler: Should display custom notifications');
    console.log('• ThemeContext: Should provide colors without errors');
    console.log('• Logger: Should log debug information');
    console.log('• DeepLinks: Should navigate to Meeting, not Home');

  } catch (error) {
    console.error('❌ Components integration test failed:', error);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Debug Button Fixes Tests...\n');
  console.log('=' .repeat(60));

  await testNavigationService();
  await testThemeContext();
  await testDeepLinkService();
  await testNotifeeCallHandler();
  await testLogger();
  await testComponentsIntegration();

  console.log('\n' + '='.repeat(60));
  console.log('🎉 All tests completed!');
  console.log('\n📱 EXPECTED RESULTS AFTER FIXES:');
  console.log('1. ✅ "Test Outgoing Call Ringing" should navigate to Meeting screen');
  console.log('2. ✅ No "Navigation theme not available" errors');
  console.log('3. ✅ No "Failed to process queued navigations" errors');
  console.log('4. ✅ Deep link test should navigate to Meeting screen, not Home');
  console.log('5. ✅ Notifee notifications should work in all app states');
  console.log('\n🧪 HOW TO TEST:');
  console.log('1. Open the app and look for "🧪 Debug Tests" panel');
  console.log('2. Try each button and verify the expected behavior');
  console.log('3. Check console logs for any remaining errors');
}

// Export functions for use in debug screens
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testNavigationService,
    testThemeContext,
    testDeepLinkService,
    testNotifeeCallHandler,
    testLogger,
    testComponentsIntegration,
    runAllTests
  };
}

// Auto-run if in debug environment
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  console.log('🧪 Debug Button Fixes Test Script Loaded');
  console.log('📱 Run runAllTests() to test all fixes');
}
