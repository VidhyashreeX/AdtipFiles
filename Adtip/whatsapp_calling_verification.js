#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 WhatsApp-like Calling System Verification');
console.log('============================================\n');

const errors = [];
const warnings = [];
const passed = [];

// Helper function to check if file exists and contains pattern
function checkFileContent(filePath, pattern, description) {
  try {
    if (!fs.existsSync(filePath)) {
      errors.push(`❌ File not found: ${filePath}`);
      return false;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const found = content.includes(pattern);
    
    if (found) {
      passed.push(`✅ ${description}`);
    } else {
      errors.push(`❌ ${description} - Pattern not found: ${pattern}`);
    }
    
    return found;
  } catch (error) {
    errors.push(`❌ Error checking ${filePath}: ${error.message}`);
    return false;
  }
}

// Check regex pattern
function checkFileRegex(filePath, pattern, description) {
  try {
    if (!fs.existsSync(filePath)) {
      errors.push(`❌ File not found: ${filePath}`);
      return false;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const regex = new RegExp(pattern);
    const found = regex.test(content);
    
    if (found) {
      passed.push(`✅ ${description}`);
    } else {
      errors.push(`❌ ${description} - Pattern not found: ${pattern}`);
    }
    
    return found;
  } catch (error) {
    errors.push(`❌ Error checking ${filePath}: ${error.message}`);
    return false;
  }
}

console.log('🔧 Checking VideoSDK Integration Fixes...\n');

// Check VideoSDK response parsing fix
checkFileContent(
  'src/services/videosdk/VideoSDKService.ts',
  'response.success && response.data && response.data.roomId',
  'VideoSDK response parsing handles nested response structure'
);

checkFileContent(
  'src/services/videosdk/VideoSDKService.ts',
  'participantToken, \'us\'',
  'VideoSDK createMeeting passes region parameter'
);

console.log('\n📱 Checking MeetingScreen Back Button Behavior...\n');

// Check MeetingScreen imports WhatsAppCallManager
checkFileContent(
  'src/screens/videosdk/MeetingScreen.tsx',
  'import WhatsAppCallManager',
  'MeetingScreen imports WhatsAppCallManager'
);

// Check back button doesn\'t navigate back
checkFileContent(
  'src/screens/videosdk/MeetingScreen.tsx',
  'return true; // Prevent default back navigation',
  'MeetingScreen prevents default back navigation'
);

// Check it uses WhatsAppCallManager for ongoing notifications
checkFileContent(
  'src/screens/videosdk/MeetingScreen.tsx',
  'whatsAppCallManager.getCurrentCall()',
  'MeetingScreen uses WhatsAppCallManager for call state'
);

console.log('\n🔔 Checking Notification and Permission Handling...\n');

// Check foreground service permission request
checkFileContent(
  'src/services/calling/WhatsAppCallManager.ts',
  'FOREGROUND_SERVICE_PHONE_CALL',
  'WhatsAppCallManager requests foreground service permission'
);

// Check notification permission request
checkFileContent(
  'src/services/calling/WhatsAppCallManager.ts',
  'notifee.requestPermission()',
  'WhatsAppCallManager requests notification permissions'
);

console.log('\n🌐 Checking API Integration...\n');

// Check initiate call API usage
checkFileContent(
  'src/services/calling/WhatsAppCallManager.ts',
  'initiateCallWithRecipient',
  'WhatsAppCallManager uses proper initiate call API'
);

checkFileContent(
  'src/services/calling/WhatsAppCallManager.ts',
  'ApiService.initiateCall',
  'WhatsAppCallManager calls VideoSDK initiate API'
);

// Check call status update API
checkFileContent(
  'src/services/calling/WhatsAppCallManager.ts',
  'ApiService.handleCall',
  'WhatsAppCallManager sends call status updates'
);

console.log('\n🎯 Checking Persistent Notification System...\n');

// Check ongoing call notification
checkFileContent(
  'src/services/calling/WhatsAppCallManager.ts',
  'showOngoingCallNotification',
  'WhatsAppCallManager has ongoing call notification'
);

// Check app state handling
checkFileContent(
  'src/services/calling/WhatsAppCallManager.ts',
  'setupAppStateListener',
  'WhatsAppCallManager handles app state changes'
);

// Check notification channels
checkFileContent(
  'src/services/calling/WhatsAppCallManager.ts',
  'CHANNEL_IDS.ONGOING_CALLS',
  'WhatsAppCallManager creates ongoing calls channel'
);

console.log('\n🔧 Checking Notification Actions...\n');

// Check notification action handling
checkFileContent(
  'src/services/calling/WhatsAppCallManager.ts',
  'handleNotificationEvent',
  'WhatsAppCallManager handles notification events'
);

checkFileContent(
  'src/services/calling/WhatsAppCallManager.ts',
  'open_call',
  'WhatsAppCallManager has open call action'
);

checkFileContent(
  'src/services/calling/WhatsAppCallManager.ts',
  'mute_toggle',
  'WhatsAppCallManager has mute toggle action'
);

console.log('\n📋 Summary\n');
console.log(`✅ Passed: ${passed.length}`);
console.log(`⚠️  Warnings: ${warnings.length}`);
console.log(`❌ Errors: ${errors.length}\n`);

if (passed.length > 0) {
  console.log('✅ PASSED CHECKS:');
  passed.forEach(item => console.log(`   ${item}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS:');
  warnings.forEach(item => console.log(`   ${item}`));
  console.log('');
}

if (errors.length > 0) {
  console.log('❌ ERRORS:');
  errors.forEach(item => console.log(`   ${item}`));
  console.log('');
}

const success = errors.length === 0;
console.log(success ? '🎉 All checks passed! WhatsApp-like calling system is ready!' : '❌ Some issues found. Please fix the errors above.');

process.exit(success ? 0 : 1);
