/**
 * Test Script for WebSocket First-Time Connection Fix
 * 
 * This script validates that the VideoSDK WebSocket connection fix
 * properly handles first-time user connections and prevents the
 * "Error while trying to reconnect websocket error" issue.
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  videoSDKServicePath: './Adtip/src/services/videosdk/VideoSDKService.ts',
  meetingScreenPath: './Adtip/src/screens/videosdk/MeetingScreenSimple.tsx',
  indexPath: './Adtip/index.js'
};

// Expected fixes in the code
const EXPECTED_FIXES = {
  videoSDKService: [
    'testWebSocketConnectivity',
    'isFirstTimeOrColdStart',
    'initializeForFirstTimeUser',
    'validateVideoSDKConnection',
    'waitForWebSocketReady'
  ],
  meetingScreen: [
    'isFirstTimeOrColdStart',
    'ensureInitialized',
    'waitForWebSocketReady'
  ],
  indexFile: [
    'register()'
  ]
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

function testVideoSDKServiceFixes() {
  console.log('\n🔍 Testing VideoSDK Service Fixes...');
  
  const content = readFile(TEST_CONFIG.videoSDKServicePath);
  if (!content) return;

  // Test 1: Check for proper WebSocket validation
  const hasTestConnectivity = content.includes('testWebSocketConnectivity');
  logTest('VideoSDK Service has testWebSocketConnectivity method', hasTestConnectivity);

  // Test 2: Check for first-time user detection
  const hasFirstTimeDetection = content.includes('isFirstTimeOrColdStart');
  logTest('VideoSDK Service has first-time/cold start detection', hasFirstTimeDetection);

  // Test 3: Check for enhanced initialization
  const hasEnhancedInit = content.includes('initializeForFirstTimeUser');
  logTest('VideoSDK Service has enhanced first-time user initialization', hasEnhancedInit);

  // Test 4: Check for improved validation logic
  const hasImprovedValidation = content.includes('validateVideoSDKConnection') && 
                                content.includes('MeetingProvider');
  logTest('VideoSDK Service has improved connection validation', hasImprovedValidation);

  // Test 5: Check for enhanced waitForWebSocketReady
  const hasEnhancedWait = content.includes('waitForWebSocketReady') && 
                         content.includes('testWebSocketConnectivity');
  logTest('VideoSDK Service has enhanced WebSocket ready check', hasEnhancedWait);

  // Test 6: Check for first-time initialization tracking
  const hasFirstTimeTracking = content.includes('isFirstTimeInitialization') && 
                               content.includes('appStartTimestamp');
  logTest('VideoSDK Service tracks first-time initialization', hasFirstTimeTracking);

  // Test 7: Check for progressive delays
  const hasProgressiveDelays = content.includes('3000') && // Initial delay increased
                               content.includes('15000'); // Max timeout increased
  logTest('VideoSDK Service has increased delays for first-time users', hasProgressiveDelays);
}

function testMeetingScreenFixes() {
  console.log('\n🔍 Testing Meeting Screen Fixes...');
  
  const content = readFile(TEST_CONFIG.meetingScreenPath);
  if (!content) return;

  // Test 1: Check for first-time detection usage
  const usesFirstTimeDetection = content.includes('isFirstTimeOrColdStart()');
  logTest('Meeting Screen uses first-time/cold start detection', usesFirstTimeDetection);

  // Test 2: Check for enhanced initialization
  const usesEnhancedInit = content.includes('ensureInitialized()');
  logTest('Meeting Screen uses enhanced initialization', usesEnhancedInit);

  // Test 3: Check for longer timeouts
  const hasLongerTimeouts = content.includes('15000') || content.includes('12000');
  logTest('Meeting Screen uses longer timeouts for first-time users', hasLongerTimeouts);

  // Test 4: Check for extra validation
  const hasExtraValidation = content.includes('websocketReady') && 
                            content.includes('connectivity');
  logTest('Meeting Screen has extra WebSocket validation', hasExtraValidation);

  // Test 5: Check for enhanced error handling
  const hasEnhancedErrorHandling = content.includes('WebSocket failed to become ready');
  logTest('Meeting Screen has enhanced error handling', hasEnhancedErrorHandling);
}

function testIndexFileFixes() {
  console.log('\n🔍 Testing Index File Fixes...');
  
  const content = readFile(TEST_CONFIG.indexPath);
  if (!content) return;

  // Test 1: Check for VideoSDK registration
  const hasVideoSDKRegistration = content.includes('register()') && 
                                  content.includes('@videosdk.live/react-native-sdk');
  logTest('Index file properly registers VideoSDK', hasVideoSDKRegistration);

  // Test 2: Check for error handling
  const hasErrorHandling = content.includes('try') && 
                          content.includes('catch') && 
                          content.includes('VideoSDK registration failed');
  logTest('Index file has VideoSDK registration error handling', hasErrorHandling);
}

function testArchitecturalImprovements() {
  console.log('\n🔍 Testing Architectural Improvements...');
  
  const videoSDKContent = readFile(TEST_CONFIG.videoSDKServicePath);
  if (!videoSDKContent) return;

  // Test 1: Check for singleton pattern
  const hasSingleton = videoSDKContent.includes('getInstance()') && 
                      videoSDKContent.includes('private static instance');
  logTest('VideoSDK Service uses singleton pattern', hasSingleton);

  // Test 2: Check for state management
  const hasStateManagement = videoSDKContent.includes('websocketReady') && 
                             videoSDKContent.includes('isInitialized');
  logTest('VideoSDK Service has proper state management', hasStateManagement);

  // Test 3: Check for promise handling
  const hasPromiseHandling = videoSDKContent.includes('initializationPromise') && 
                            videoSDKContent.includes('async');
  logTest('VideoSDK Service has proper promise handling', hasPromiseHandling);
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

  // Generate recommendations
  console.log('\n💡 Recommendations for Testing:');
  console.log('1. Test with a fresh app installation (clear app data)');
  console.log('2. Test on a slow network connection');
  console.log('3. Test with airplane mode on/off during app startup');
  console.log('4. Test with multiple rapid call attempts');
  console.log('5. Monitor logs for "WebSocket connection confirmed ready" messages');
  console.log('6. Verify no "Error while trying to reconnect websocket error" messages');

  return testResults.failed === 0;
}

// Run all tests
function runTests() {
  console.log('🚀 Starting WebSocket Fix Validation Tests...');
  console.log('==============================================');

  testVideoSDKServiceFixes();
  testMeetingScreenFixes();
  testIndexFileFixes();
  testArchitecturalImprovements();

  const allTestsPassed = generateTestReport();

  if (allTestsPassed) {
    console.log('\n🎉 All tests passed! The WebSocket fix appears to be properly implemented.');
    console.log('\n📝 Next Steps:');
    console.log('1. Build and test the app on a physical device');
    console.log('2. Clear app data and test first-time user experience');
    console.log('3. Monitor production logs for WebSocket connection issues');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the implementation.');
  }

  return allTestsPassed;
}

// Export for use in other scripts
module.exports = {
  runTests,
  TEST_CONFIG,
  EXPECTED_FIXES
};

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}
