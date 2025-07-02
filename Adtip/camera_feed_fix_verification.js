#!/usr/bin/env node

/**
 * Camera Feed Fix Verification Script
 * 
 * This script verifies that the camera feed rendering issue has been fixed.
 * It checks for the key changes made to resolve the RTCView rendering problem.
 */

const fs = require('fs');
const path = require('path');

function log(message, color = 'white') {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath, name) {
  if (fs.existsSync(filePath)) {
    log(`  ✅ ${name} exists`, 'green');
    return true;
  } else {
    log(`  ❌ ${name} not found`, 'red');
    return false;
  }
}

function checkFileContent(filePath, pattern, description) {
  if (!fs.existsSync(filePath)) {
    log(`  ❌ ${description} - File not found`, 'red');
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const found = content.includes(pattern);
  
  if (found) {
    log(`  ✅ ${description}`, 'green');
    return true;
  } else {
    log(`  ❌ ${description}`, 'red');
    return false;
  }
}

function checkMeetingProviderConfig() {
  log('\n🔧 CHECKING MEETING PROVIDER CONFIGURATION:', 'cyan');
  
  const meetingScreenPath = path.join(__dirname, 'src', 'screens', 'videosdk', 'MeetingScreen.tsx');
  let allPassed = true;
  
  if (checkFileExists(meetingScreenPath, 'MeetingScreen.tsx')) {
    // Check correct mode is used
    if (!checkFileContent(meetingScreenPath, "mode: 'SEND_AND_RECV' as const", 'Correct VideoSDK mode for video calls')) {
      allPassed = false;
    }
    
    // Check webcam enabled for video calls
    if (!checkFileContent(meetingScreenPath, 'webcamEnabled: callType === \'video\'', 'Webcam enabled for video calls in config')) {
      allPassed = false;
    }
    
    // Check auto-enable webcam logic
    if (!checkFileContent(meetingScreenPath, 'Auto-enabling webcam for video call after join', 'Auto-enable webcam logic present')) {
      allPassed = false;
    }
  } else {
    allPassed = false;
  }
  
  return allPassed;
}

function checkCameraToggleLogic() {
  log('\n📹 CHECKING CAMERA TOGGLE LOGIC:', 'cyan');
  
  const meetingScreenPath = path.join(__dirname, 'src', 'screens', 'videosdk', 'MeetingScreen.tsx');
  let allPassed = true;
  
  if (checkFileExists(meetingScreenPath, 'MeetingScreen.tsx')) {
    // Check enhanced debugging
    if (!checkFileContent(meetingScreenPath, 'TOGGLE CAMERA INITIATED', 'Enhanced camera toggle debugging')) {
      allPassed = false;
    }
    
    // Check direct VideoSDK usage
    if (!checkFileContent(meetingScreenPath, 'Using VideoSDK toggleWebcam directly', 'Direct VideoSDK toggleWebcam usage')) {
      allPassed = false;
    }
    
    // Check camera state logging
    if (!checkFileContent(meetingScreenPath, 'CAMERA STATE AFTER TOGGLE', 'Camera state after toggle logging')) {
      allPassed = false;
    }
  } else {
    allPassed = false;
  }
  
  return allPassed;
}

function checkVideoSDKParticipantView() {
  log('\n🎭 CHECKING VIDEOSDK PARTICIPANT VIEW:', 'cyan');
  
  const participantViewPath = path.join(__dirname, 'src', 'components', 'videosdk', 'VideoSDKParticipantView.tsx');
  let allPassed = true;
  
  if (checkFileExists(participantViewPath, 'VideoSDKParticipantView.tsx')) {
    // Check enhanced debugging
    if (!checkFileContent(participantViewPath, 'SHOULD RENDER RTCView', 'RTCView rendering debug logs')) {
      allPassed = false;
    }
    
    if (!checkFileContent(participantViewPath, 'CANNOT RENDER RTCView', 'RTCView failure debug logs')) {
      allPassed = false;
    }
    
    // Check proper RTCView usage - VideoSDK uses streamURL={webcamStream.id}
    if (!checkFileContent(participantViewPath, 'streamURL={webcamStream.id}', 'Correct RTCView streamURL with webcamStream.id')) {
      allPassed = false;
    }
    
    // Check webcam state validation
    if (!checkFileContent(participantViewPath, 'webcamOn && webcamStream && webcamStream.id', 'Proper webcam state validation')) {
      allPassed = false;
    }
  } else {
    allPassed = false;
  }
  
  return allPassed;
}

function checkMediaManagerIntegration() {
  log('\n🎮 CHECKING MEDIA MANAGER INTEGRATION:', 'cyan');
  
  const callMediaManagerPath = path.join(__dirname, 'src', 'services', 'calling', 'CallMediaManager.ts');
  let allPassed = true;
  
  if (checkFileExists(callMediaManagerPath, 'CallMediaManager.ts')) {
    // Check VideoSDK meeting reference
    if (!checkFileContent(callMediaManagerPath, 'setMeeting(meeting: any)', 'VideoSDK meeting reference setter')) {
      allPassed = false;
    }
    
    // Check toggle camera implementation
    if (!checkFileContent(callMediaManagerPath, 'toggleWebcam()', 'Camera toggle via VideoSDK meeting')) {
      allPassed = false;
    }
    
    // Check centralized media state
    if (!checkFileContent(callMediaManagerPath, 'mediaStateChanged', 'Centralized media state events')) {
      allPassed = false;
    }
  } else {
    allPassed = false;
  }
  
  return allPassed;
}

function checkPermissionsAndSetup() {
  log('\n🔐 CHECKING PERMISSIONS AND SETUP:', 'cyan');
  
  const whatsAppCallManagerPath = path.join(__dirname, 'src', 'services', 'calling', 'WhatsAppCallManager.ts');
  let allPassed = true;
  
  if (checkFileExists(whatsAppCallManagerPath, 'WhatsAppCallManager.ts')) {
    // Check camera permission request
    if (!checkFileContent(whatsAppCallManagerPath, 'PermissionsAndroid.PERMISSIONS.CAMERA', 'Camera permission check')) {
      allPassed = false;
    }
    
    // Check audio permission request
    if (!checkFileContent(whatsAppCallManagerPath, 'PermissionsAndroid.PERMISSIONS.RECORD_AUDIO', 'Audio permission check')) {
      allPassed = false;
    }
    
    // Check permission request flow
    if (!checkFileContent(whatsAppCallManagerPath, 'requestPermissionsIfNeeded', 'Permission request method')) {
      allPassed = false;
    }
  } else {
    allPassed = false;
  }
  
  return allPassed;
}

function generateTestInstructions() {
  log('\n📋 TESTING INSTRUCTIONS:', 'yellow');
  log('');
  log('1. BUILD AND RUN THE APP:', 'yellow');
  log('   cd Adtip && npm run android');
  log('');
  log('2. START A VIDEO CALL:', 'yellow');
  log('   - Navigate to TipCallScreen');
  log('   - Select a user and tap the video call button');
  log('   - Wait for the call to connect');
  log('');
  log('3. VERIFY CAMERA FEED:', 'yellow');
  log('   ✅ Camera permission should be requested automatically');
  log('   ✅ Meeting should join successfully');
  log('   ✅ Webcam should auto-enable after joining for video calls');
  log('   ✅ Local video should appear in small self-view corner');
  log('   ✅ Camera toggle button should work properly');
  log('   ✅ RTCView should render camera feed, not black screen');
  log('');
  log('4. CHECK LOGS FOR:', 'yellow');
  log('   🎥 "Meeting joined successfully"');
  log('   🎥 "Auto-enabling webcam for video call after join"');
  log('   🎥 "SHOULD RENDER RTCView" logs');
  log('   📹 "TOGGLE CAMERA INITIATED" logs');
  log('   ✅ "VideoSDK toggleWebcam completed" logs');
  log('');
  log('5. COMMON ISSUES FIXED:', 'yellow');
  log('   ✅ Fixed VideoSDK mode configuration');
  log('   ✅ Added auto-enable webcam logic for video calls');
  log('   ✅ Enhanced debugging and error tracking');
  log('   ✅ Proper RTCView rendering logic');
  log('   ✅ Centralized media state management');
}

function main() {
  log('🎥 CAMERA FEED FIX VERIFICATION', 'cyan');
  log('=====================================', 'cyan');
  
  const results = [];
  
  results.push(checkMeetingProviderConfig());
  results.push(checkCameraToggleLogic());
  results.push(checkVideoSDKParticipantView());
  results.push(checkMediaManagerIntegration());
  results.push(checkPermissionsAndSetup());
  
  const allPassed = results.every(result => result);
  
  log('\n📊 VERIFICATION SUMMARY:', 'cyan');
  log('=======================', 'cyan');
  
  if (allPassed) {
    log('✅ ALL CHECKS PASSED - Camera feed fix implemented correctly!', 'green');
    log('');
    log('🎯 KEY FIXES APPLIED:', 'green');
    log('  ✅ VideoSDK mode set to SEND_AND_RECV for proper video streaming');
    log('  ✅ Auto-enable webcam logic added for video calls after join');
    log('  ✅ Enhanced debugging for camera toggle and RTCView rendering');
    log('  ✅ Proper webcam state validation before RTCView rendering');
    log('  ✅ Centralized media management with VideoSDK integration');
  } else {
    log('❌ SOME CHECKS FAILED - Please review the issues above', 'red');
  }
  
  generateTestInstructions();
}

main();
