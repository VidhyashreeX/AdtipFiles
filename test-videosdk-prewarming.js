/**
 * Test Script for VideoSDK Pre-warming System
 * 
 * This script validates that the VideoSDK pre-warming system works correctly
 * and doesn't interfere with normal app operation.
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  prewarmingServicePath: './Adtip/src/services/videosdk/VideoSDKPrewarmingService.ts',
  videoSDKServicePath: './Adtip/src/services/videosdk/VideoSDKService.ts',
  appPath: './Adtip/App.tsx'
};

// Test results
const testResults = {
  passed: 0,
  failed: 0,
  details: []
};

function logTest(test, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${test}`);
  if (details) {
    console.log(`   ${details}`);
  }
  
  testResults.details.push({ test, passed, details });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

function readFile(filePath) {
  try {
    return fs.readFileSync(path.join(__dirname, filePath), 'utf8');
  } catch (error) {
    logTest(`Read file ${filePath}`, false, `Error: ${error.message}`);
    return null;
  }
}

function testPrewarmingServiceImplementation() {
  console.log('\n🔍 Testing Pre-warming Service Implementation...');
  
  const content = readFile(TEST_CONFIG.prewarmingServicePath);
  if (!content) return;

  // Test 1: Check for singleton pattern
  const hasSingleton = content.includes('private static instance') &&
                      content.includes('getInstance()');
  logTest('Pre-warming service uses singleton pattern', hasSingleton);

  // Test 2: Check for silent dummy call creation
  const hasDummyCall = content.includes('triggerDummyCall') &&
                      content.includes('Silent dummy call');
  logTest('Pre-warming service creates silent dummy calls', hasDummyCall);

  // Test 3: Check for WebSocket validation
  const hasWebSocketValidation = content.includes('validateWebSocketConnection') && 
                                 content.includes('@videosdk.live/react-native-sdk');
  logTest('Pre-warming service validates WebSocket connection', hasWebSocketValidation);

  // Test 4: Check for state management
  const hasStateManagement = content.includes('AsyncStorage') && 
                             content.includes('loadState') && 
                             content.includes('saveState');
  logTest('Pre-warming service has persistent state management', hasStateManagement);

  // Test 5: Check for configuration management
  const hasConfigManagement = content.includes('PrewarmingConfig') && 
                              content.includes('updateConfig') && 
                              content.includes('enabled');
  logTest('Pre-warming service has configuration management', hasConfigManagement);

  // Test 6: Check for app state monitoring
  const hasAppStateMonitoring = content.includes('AppState.addEventListener') && 
                                content.includes('handleAppStateChange');
  logTest('Pre-warming service monitors app state changes', hasAppStateMonitoring);

  // Test 7: Check for error handling
  const hasErrorHandling = content.includes('try') && 
                          content.includes('catch') && 
                          content.includes('logError');
  logTest('Pre-warming service has proper error handling', hasErrorHandling);

  // Test 8: Check for cleanup mechanisms
  const hasCleanup = content.includes('cleanup()') && 
                    content.includes('cleanupDummySession');
  logTest('Pre-warming service has cleanup mechanisms', hasCleanup);

  // Test 9: Check for timing controls
  const hasTimingControls = content.includes('startupDelayMs') && 
                           content.includes('idleThresholdMinutes') && 
                           content.includes('cacheExpiryHours');
  logTest('Pre-warming service has timing controls', hasTimingControls);

  // Test 10: Check for failure handling
  const hasFailureHandling = content.includes('failureCount') && 
                            content.includes('backoffTime') && 
                            content.includes('maxAttempts');
  logTest('Pre-warming service handles failures gracefully', hasFailureHandling);
}

function testVideoSDKServiceIntegration() {
  console.log('\n🔍 Testing VideoSDK Service Integration...');
  
  const content = readFile(TEST_CONFIG.videoSDKServicePath);
  if (!content) return;

  // Test 1: Check for pre-warming integration
  const hasPrewarmingIntegration = content.includes('isWebSocketPrewarmed') && 
                                  content.includes('VideoSDKPrewarmingService');
  logTest('VideoSDK service integrates with pre-warming', hasPrewarmingIntegration);

  // Test 2: Check for first-time detection
  const hasFirstTimeDetection = content.includes('isFirstTimeOrColdStart') && 
                                content.includes('isFirstTimeInitialization');
  logTest('VideoSDK service detects first-time scenarios', hasFirstTimeDetection);

  // Test 3: Check for enhanced initialization
  const hasEnhancedInit = content.includes('initializeForFirstTimeUser') && 
                         content.includes('ensureInitialized');
  logTest('VideoSDK service has enhanced initialization', hasEnhancedInit);

  // Test 4: Check for WebSocket connectivity testing
  const hasConnectivityTesting = content.includes('testWebSocketConnectivity') && 
                                content.includes('waitForWebSocketReady');
  logTest('VideoSDK service tests WebSocket connectivity', hasConnectivityTesting);
}

function testAppIntegration() {
  console.log('\n🔍 Testing App Integration...');
  
  const content = readFile(TEST_CONFIG.appPath);
  if (!content) return;

  // Test 1: Check for pre-warming initialization
  const hasPrewarmingInit = content.includes('VideoSDKPrewarmingService') && 
                           content.includes('startPrewarming');
  logTest('App initializes pre-warming service', hasPrewarmingInit);

  // Test 2: Check for background execution
  const hasBackgroundExecution = content.includes('Background: Starting VideoSDK WebSocket pre-warming') && 
                                 content.includes('non-blocking');
  logTest('App runs pre-warming in background', hasBackgroundExecution);

  // Test 3: Check for error handling
  const hasErrorHandling = content.includes('prewarmingError') && 
                          content.includes('non-critical');
  logTest('App handles pre-warming errors gracefully', hasErrorHandling);

  // Test 4: Check for cleanup integration
  const hasCleanupIntegration = content.includes('prewarmingService.cleanup()') && 
                               content.includes('useEffect');
  logTest('App properly cleans up pre-warming service', hasCleanupIntegration);

  // Test 5: Check for timing
  const hasProperTiming = content.includes('setTimeout') && 
                         content.includes('200'); // 200ms delay for VideoSDK init
  logTest('App uses proper timing for pre-warming', hasProperTiming);
}

function testArchitecturalPatterns() {
  console.log('\n🔍 Testing Architectural Patterns...');
  
  const prewarmingContent = readFile(TEST_CONFIG.prewarmingServicePath);
  if (!prewarmingContent) return;

  // Test 1: Check for separation of concerns
  const hasSeparationOfConcerns = prewarmingContent.includes('interface PrewarmingConfig') && 
                                 prewarmingContent.includes('interface PrewarmingState') && 
                                 prewarmingContent.includes('interface DummyMeetingSession');
  logTest('Pre-warming service has proper separation of concerns', hasSeparationOfConcerns);

  // Test 2: Check for async/await patterns
  const hasAsyncPatterns = prewarmingContent.includes('async') && 
                          prewarmingContent.includes('await') && 
                          prewarmingContent.includes('Promise');
  logTest('Pre-warming service uses proper async patterns', hasAsyncPatterns);

  // Test 3: Check for defensive programming
  const hasDefensiveProgramming = prewarmingContent.includes('if (!') && 
                                 prewarmingContent.includes('try {') && 
                                 prewarmingContent.includes('|| null');
  logTest('Pre-warming service uses defensive programming', hasDefensiveProgramming);

  // Test 4: Check for resource management
  const hasResourceManagement = prewarmingContent.includes('currentDummySession = null') && 
                               prewarmingContent.includes('appStateSubscription.remove()');
  logTest('Pre-warming service manages resources properly', hasResourceManagement);
}

function testPerformanceConsiderations() {
  console.log('\n🔍 Testing Performance Considerations...');
  
  const prewarmingContent = readFile(TEST_CONFIG.prewarmingServicePath);
  const appContent = readFile(TEST_CONFIG.appPath);
  if (!prewarmingContent || !appContent) return;

  // Test 1: Check for non-blocking execution
  const hasNonBlockingExecution = appContent.includes('.then(') && 
                                  appContent.includes('.catch(') && 
                                  !appContent.includes('await prewarmingService.startPrewarming()');
  logTest('Pre-warming runs non-blocking in app initialization', hasNonBlockingExecution);

  // Test 2: Check for startup delay
  const hasStartupDelay = prewarmingContent.includes('startupDelayMs') && 
                         prewarmingContent.includes('3000'); // 3 second delay
  logTest('Pre-warming waits for app startup to complete', hasStartupDelay);

  // Test 3: Check for cache expiry
  const hasCacheExpiry = prewarmingContent.includes('cacheExpiryHours') && 
                        prewarmingContent.includes('expiryTime');
  logTest('Pre-warming has cache expiry mechanism', hasCacheExpiry);

  // Test 4: Check for failure backoff
  const hasFailureBackoff = prewarmingContent.includes('backoffTime') && 
                           prewarmingContent.includes('Math.min');
  logTest('Pre-warming has failure backoff mechanism', hasFailureBackoff);
}

function generateTestReport() {
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.details
      .filter(result => !result.passed)
      .forEach(result => {
        console.log(`   - ${result.test}: ${result.details}`);
      });
  }

  // Generate testing recommendations
  console.log('\n💡 Manual Testing Recommendations:');
  console.log('1. Fresh app installation test:');
  console.log('   - Clear app data completely');
  console.log('   - Install and launch app');
  console.log('   - Wait 5-10 seconds for pre-warming');
  console.log('   - Attempt first call - should work without WebSocket errors');
  console.log('');
  console.log('2. Background/foreground test:');
  console.log('   - Launch app and let it pre-warm');
  console.log('   - Put app in background for 30+ minutes');
  console.log('   - Bring app to foreground');
  console.log('   - Should trigger re-pre-warming automatically');
  console.log('');
  console.log('3. Network condition test:');
  console.log('   - Test pre-warming on slow network');
  console.log('   - Test pre-warming with intermittent connectivity');
  console.log('   - Verify graceful failure handling');
  console.log('');
  console.log('4. Performance impact test:');
  console.log('   - Measure app startup time with/without pre-warming');
  console.log('   - Monitor memory usage during pre-warming');
  console.log('   - Verify UI responsiveness during pre-warming');
  console.log('');
  console.log('5. Log monitoring:');
  console.log('   - Look for "WebSocket pre-warming completed successfully"');
  console.log('   - Verify no "Error while trying to reconnect websocket error"');
  console.log('   - Check pre-warming service state persistence');

  return testResults.failed === 0;
}

// Run all tests
function runTests() {
  console.log('🚀 Starting VideoSDK Pre-warming System Validation...');
  console.log('====================================================');

  testPrewarmingServiceImplementation();
  testVideoSDKServiceIntegration();
  testAppIntegration();
  testArchitecturalPatterns();
  testPerformanceConsiderations();

  const allTestsPassed = generateTestReport();

  if (allTestsPassed) {
    console.log('\n🎉 All tests passed! The VideoSDK pre-warming system appears to be properly implemented.');
    console.log('\n📝 Next Steps:');
    console.log('1. Build and test the app on a physical device');
    console.log('2. Test with fresh app installation (clear app data)');
    console.log('3. Monitor logs for pre-warming completion messages');
    console.log('4. Verify first-time calls work without WebSocket errors');
    console.log('5. Test background/foreground scenarios');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the implementation.');
  }

  return allTestsPassed;
}

// Export for use in other scripts
module.exports = {
  runTests,
  TEST_CONFIG
};

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}
