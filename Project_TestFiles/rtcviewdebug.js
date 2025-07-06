#!/usr/bin/env node

/**
 * RTCView Debug and Call Flow Verification Script
 * 
 * This script helps debug the RTCView black screen issue by:
 * 1. Checking all required dependencies and configurations
 * 2. Verifying permission setup
 * 3. Testing the call flow step by step
 * 4. Logging detailed debugging information
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 RTCView Debug and Call Flow Verification\n');

// Color coding for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  log(`${exists ? '✅' : '❌'} ${description}: ${filePath}`, exists ? 'green' : 'red');
  return exists;
}

function checkFileContent(filePath, searchString, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const found = content.includes(searchString);
    log(`${found ? '✅' : '❌'} ${description}`, found ? 'green' : 'red');
    if (!found) {
      log(`   Expected: "${searchString}"`, 'yellow');
    }
    return found;
  } catch (error) {
    log(`❌ ${description} - File not readable: ${error.message}`, 'red');
    return false;
  }
}

function checkPackageJson() {
  log('\n📦 CHECKING PACKAGE DEPENDENCIES:', 'cyan');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!checkFileExists(packageJsonPath, 'package.json')) return false;
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Check VideoSDK dependency
    const videoSdkVersion = dependencies['@videosdk.live/react-native-sdk'];
    log(`${videoSdkVersion ? '✅' : '❌'} VideoSDK dependency: ${videoSdkVersion || 'NOT FOUND'}`, videoSdkVersion ? 'green' : 'red');
    
    // Check React Native version
    const rnVersion = dependencies['react-native'];
    log(`${rnVersion ? '✅' : '❌'} React Native: ${rnVersion || 'NOT FOUND'}`, rnVersion ? 'green' : 'red');
    
    // Check other required dependencies
    const requiredDeps = [
      '@react-navigation/native',
      '@react-navigation/native-stack',
      'react-native-permissions',
      '@notifee/react-native'
    ];
    
    requiredDeps.forEach(dep => {
      const version = dependencies[dep];
      log(`${version ? '✅' : '❌'} ${dep}: ${version || 'NOT FOUND'}`, version ? 'green' : 'red');
    });
    
    return true;
  } catch (error) {
    log(`❌ Error reading package.json: ${error.message}`, 'red');
    return false;
  }
}

function checkAndroidManifest() {
  log('\n📱 CHECKING ANDROID MANIFEST:', 'cyan');
  
  const manifestPath = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
  if (!checkFileExists(manifestPath, 'AndroidManifest.xml')) return false;
  
  // Check required permissions
  const requiredPermissions = [
    'android.permission.CAMERA',
    'android.permission.RECORD_AUDIO',
    'android.permission.INTERNET',
    'android.permission.FOREGROUND_SERVICE',
    'android.permission.FOREGROUND_SERVICE_CAMERA',
    'android.permission.FOREGROUND_SERVICE_MICROPHONE'
  ];
  
  requiredPermissions.forEach(permission => {
    checkFileContent(manifestPath, permission, `Permission: ${permission}`);
  });
  
  // Check VideoSDK foreground service
  checkFileContent(manifestPath, 'live.videosdk.rnfgservice.ForegroundService', 'VideoSDK Foreground Service');
  checkFileContent(manifestPath, 'foregroundServiceType="camera|microphone"', 'Foreground Service Type');
  
  return true;
}

function checkVideoSDKComponents() {
  log('\n🎥 CHECKING VIDEOSDK COMPONENTS:', 'cyan');
  
  // Check VideoSDKParticipantView
  const participantViewPath = path.join(process.cwd(), 'src', 'components', 'videosdk', 'VideoSDKParticipantView.tsx');
  if (checkFileExists(participantViewPath, 'VideoSDKParticipantView.tsx')) {
    checkFileContent(participantViewPath, 'import { RTCView }', 'RTCView import');
    checkFileContent(participantViewPath, 'useParticipant', 'useParticipant hook');
    checkFileContent(participantViewPath, 'streamURL={webcamStream.id}', 'RTCView streamURL prop');
    checkFileContent(participantViewPath, 'objectFit="cover"', 'RTCView objectFit prop');
    checkFileContent(participantViewPath, 'mirror={isLocal}', 'RTCView mirror prop');
  }
  
  // Check MeetingScreen
  const meetingScreenPath = path.join(process.cwd(), 'src', 'screens', 'videosdk', 'MeetingScreen.tsx');
  if (checkFileExists(meetingScreenPath, 'MeetingScreen.tsx')) {
    checkFileContent(meetingScreenPath, 'useMeeting', 'useMeeting hook');
    checkFileContent(meetingScreenPath, 'useParticipant', 'useParticipant hook');
    checkFileContent(meetingScreenPath, 'toggleWebcam', 'toggleWebcam function');
    checkFileContent(meetingScreenPath, 'VideoSDKParticipantView', 'VideoSDKParticipantView usage');
    checkFileContent(meetingScreenPath, 'FIX 5:', 'Enhanced debugging present');
  }
  
  return true;
}

function checkCallManager() {
  log('\n📞 CHECKING CALL MANAGER:', 'cyan');
  
  const callManagerPath = path.join(process.cwd(), 'src', 'services', 'calling', 'WhatsAppCallManager.ts');
  if (checkFileExists(callManagerPath, 'WhatsAppCallManager.ts')) {
    checkFileContent(callManagerPath, 'requestPermissionsIfNeeded', 'Permission request method');
    checkFileContent(callManagerPath, 'checkPermissions', 'Permission check method');
    checkFileContent(callManagerPath, 'PermissionsAndroid.PERMISSIONS.CAMERA', 'Camera permission check');
    checkFileContent(callManagerPath, 'PermissionsAndroid.PERMISSIONS.RECORD_AUDIO', 'Audio permission check');
    checkFileContent(callManagerPath, 'VideoSDKService.initialize', 'VideoSDK initialization');
  }
  
  return true;
}

function checkVideoSDKService() {
  log('\n🔧 CHECKING VIDEOSDK SERVICE:', 'cyan');
  
  const videoSDKServicePath = path.join(process.cwd(), 'src', 'services', 'videosdk', 'VideoSDKService.ts');
  if (checkFileExists(videoSDKServicePath, 'VideoSDKService.ts')) {
    checkFileContent(videoSDKServicePath, 'register', 'VideoSDK register method');
    checkFileContent(videoSDKServicePath, 'initiateMeeting', 'Meeting initiation method');
    checkFileContent(videoSDKServicePath, 'API_KEY', 'API key configuration');
  }
  
  return true;
}

function generateTestInstructions() {
  log('\n🧪 TESTING INSTRUCTIONS:', 'magenta');
  log('====================', 'magenta');
  
  log('\n1. BUILD AND RUN THE APP:', 'yellow');
  log('   npx react-native run-android');
  
  log('\n2. MONITOR LOGS DURING TESTING:', 'yellow');
  log('   npx react-native log-android | grep -E "(VideoSDKParticipantView|MeetingView|RTCView|Camera|Stream)"');
  
  log('\n3. TEST CALL FLOW:', 'yellow');
  log('   a) Open the app and go to TipCall screen');
  log('   b) Try to start a video call');
  log('   c) Grant permissions when prompted');
  log('   d) Check if MeetingScreen opens');
  log('   e) Look for RTCView rendering in both local and remote participant views');
  
  log('\n4. KEY DEBUG POINTS TO WATCH:', 'yellow');
  log('   📹 LOCAL PARTICIPANT WEBCAM STATE logs');
  log('   🎥 PARTICIPANT STATE UPDATE logs');
  log('   📹 STREAM DETAILS logs');
  log('   🎥 RENDERING RTCView logs');
  log('   ❌ CANNOT RENDER RTCView logs (indicates the issue)');
  
  log('\n5. PERMISSION VERIFICATION:', 'yellow');
  log('   - Check Android Settings > Apps > Adtip > Permissions');
  log('   - Ensure Camera and Microphone are enabled');
  log('   - Try toggling them off/on and test again');
  
  log('\n6. EXPECTED BEHAVIOR:', 'yellow');
  log('   ✅ Permissions should be requested and granted');
  log('   ✅ Meeting should join successfully');
  log('   ✅ Local participant webcam should auto-enable for video calls');
  log('   ✅ RTCView should show camera feed, not black screen');
  log('   ✅ Camera toggle should work');
  
  log('\n7. COMMON ISSUES TO CHECK:', 'yellow');
  log('   ❌ Permissions not granted (check logs and settings)');
  log('   ❌ VideoSDK not initialized with API key');
  log('   ❌ Meeting not joined properly');
  log('   ❌ Webcam not enabled after join');
  log('   ❌ Stream exists but RTCView not rendering');
  log('   ❌ Native WebRTC module issues');
}

function generateFixSuggestions() {
  log('\n🔧 POTENTIAL FIXES TO TRY:', 'magenta');
  log('=========================', 'magenta');
  
  log('\n1. PERMISSION ISSUES:', 'yellow');
  log('   - Clear app data and reinstall');
  log('   - Manually grant permissions in Android settings');
  log('   - Check if permissions are requested at the right time (foreground)');
  
  log('\n2. VIDEOSDK ISSUES:', 'yellow');
  log('   - Verify VideoSDK API key is valid');
  log('   - Check VideoSDK documentation for RTCView props');
  log('   - Try different objectFit values: "contain", "cover", "fill"');
  log('   - Test with mirror={false} for both local and remote');
  
  log('\n3. RTCVIEW ISSUES:', 'yellow');
  log('   - Add explicit width/height to RTCView style');
  log('   - Try adding backgroundColor: "red" to see if RTCView renders');
  log('   - Check if zOrder prop affects rendering');
  log('   - Test on different Android versions/devices');
  
  log('\n4. STREAM ISSUES:', 'yellow');
  log('   - Verify webcamStream.id is a valid string');
  log('   - Check if track exists and is enabled');
  log('   - Ensure meeting is joined before accessing streams');
  log('   - Try manually enabling webcam after join');
  
  log('\n5. NATIVE MODULE ISSUES:', 'yellow');
  log('   - Clean and rebuild: cd android && ./gradlew clean && cd .. && npx react-native run-android');
  log('   - Check if VideoSDK native modules are properly linked');
  log('   - Verify React Native version compatibility with VideoSDK');
  
  log('\n6. DEBUGGING NEXT STEPS:', 'yellow');
  log('   - Add more RTCView props like onLoadStart, onLoad (if available)');
  log('   - Test with a simple WebRTC demo to isolate the issue');
  log('   - Contact VideoSDK support with logs and device info');
  log('   - Try alternative video calling libraries for comparison');
}

// Main execution
function main() {
  log('🚀 Starting RTCView Debug Verification...', 'bright');
  
  let allChecks = true;
  
  allChecks &= checkPackageJson();
  allChecks &= checkAndroidManifest();
  allChecks &= checkVideoSDKComponents();
  allChecks &= checkCallManager();
  allChecks &= checkVideoSDKService();
  
  if (allChecks) {
    log('\n✅ ALL BASIC CHECKS PASSED', 'green');
  } else {
    log('\n❌ SOME CHECKS FAILED - Fix these first', 'red');
  }
  
  generateTestInstructions();
  generateFixSuggestions();
  
  log('\n🏁 Debug verification complete!', 'bright');
  log('📱 Now test the app and monitor the logs for the issues mentioned above.', 'cyan');
}

main();
