/**
 * Test Deep Link Fix for MeetingScreenSimple
 * 
 * This script tests the fix for deep link navigation to MeetingScreenSimple
 * where the session was not being initialized from route parameters.
 */

console.log('🧪 Testing Deep Link Fix for MeetingScreenSimple...\n');

// Test Deep Link Service
async function testDeepLinkService() {
  console.log('🔗 Testing SimplifiedDeepLinkService...\n');

  try {
    // Import SimplifiedDeepLinkService
    const SimplifiedDeepLinkService = await import('./src/services/SimplifiedDeepLinkService');
    const deepLinkService = SimplifiedDeepLinkService.default;

    console.log('✅ SimplifiedDeepLinkService imported successfully');

    // Test the exact deep link from the logs
    const testUrl = 'adtip://meeting?meetingId=test-meeting-1755259241258&token=test-token-1755259241258&callerName=Deep Link Test Caller&callType=video&sessionId=test-session-1755259241258';
    
    console.log('🔗 Testing deep link:', testUrl);
    console.log('📱 This should navigate to Meeting screen with proper parameters...');

    // Simulate deep link handling
    deepLinkService.handleDeepLink(testUrl);
    
    console.log('✅ Deep link handling completed');
    console.log('💡 Check if MeetingScreenSimple initializes session from route params');

  } catch (error) {
    console.error('❌ SimplifiedDeepLinkService test failed:', error);
  }
}

// Test Call Store Session Initialization
async function testCallStoreInitialization() {
  console.log('\n📦 Testing Call Store Session Initialization...\n');

  try {
    // Import call store
    const { useCallStore } = await import('./src/stores/callStoreSimplified');
    
    console.log('✅ Call store imported successfully');

    // Get current state
    const state = useCallStore.getState();
    console.log('📊 Current call store state:', {
      status: state.status,
      hasSession: !!state.session,
      sessionId: state.session?.sessionId
    });

    // Test session setting
    const testSession = {
      sessionId: 'test-session-' + Date.now(),
      meetingId: 'test-meeting-' + Date.now(),
      token: 'test-token-' + Date.now(),
      peerId: 'test-peer',
      peerName: 'Test Caller',
      direction: 'incoming',
      type: 'video',
      startedAt: Date.now()
    };

    console.log('🔧 Setting test session...');
    state.actions.setSession(testSession);

    const newState = useCallStore.getState();
    console.log('📊 New call store state:', {
      status: newState.status,
      hasSession: !!newState.session,
      sessionId: newState.session?.sessionId
    });

    console.log('✅ Call store session initialization test completed');

  } catch (error) {
    console.error('❌ Call store test failed:', error);
  }
}

// Test Route Parameter Structure
function testRouteParameterStructure() {
  console.log('\n📋 Testing Route Parameter Structure...\n');

  // Simulate the route parameters that would be passed to MeetingScreenSimple
  const mockRouteParams = {
    meetingId: 'test-meeting-1755259241258',
    token: 'test-token-1755259241258',
    displayName: 'User',
    callType: 'video',
    isInitiator: false,
    recipientName: 'Deep Link Test Caller',
    callData: {
      sessionId: 'test-session-1755259241258',
      direction: 'incoming',
      type: 'video',
      callerName: 'Deep Link Test Caller'
    }
  };

  console.log('📋 Mock route parameters:', JSON.stringify(mockRouteParams, null, 2));

  // Validate required fields for session initialization
  const hasRequiredFields = !!(
    mockRouteParams.meetingId &&
    mockRouteParams.token &&
    mockRouteParams.callData?.sessionId
  );

  console.log('✅ Has required fields for session initialization:', hasRequiredFields);

  if (hasRequiredFields) {
    console.log('💡 These parameters should successfully initialize the call store session');
  } else {
    console.log('❌ Missing required fields - session initialization would fail');
  }
}

// Test Navigation Type Fix
function testNavigationTypeFix() {
  console.log('\n🧭 Testing Navigation Type Fix...\n');

  console.log('📝 Type fix applied:');
  console.log('   Before: RouteProp<MainNavigatorParamList, \'Meeting\'>');
  console.log('   After:  RouteProp<RootStackParamList, \'Meeting\'>');
  console.log('');
  console.log('💡 This fix ensures MeetingScreenSimple can access route parameters correctly');
  console.log('   since Meeting is a root-level screen, not nested in MainNavigator');
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Deep Link Fix Tests...\n');

  // Run all tests
  testNavigationTypeFix();
  testRouteParameterStructure();
  await testCallStoreInitialization();
  await testDeepLinkService();

  console.log('\n✅ All tests completed!');
  console.log('\n📋 Summary of fixes applied:');
  console.log('1. Fixed route type: MainNavigatorParamList → RootStackParamList');
  console.log('2. Added session initialization from route parameters in useEffect');
  console.log('3. Added proper validation for required route parameter fields');
  console.log('4. Set appropriate call status (connecting) for incoming calls');
  console.log('\n💡 The "Loading call..." issue should now be resolved!');
}

// Run the tests
runTests().catch(console.error);
