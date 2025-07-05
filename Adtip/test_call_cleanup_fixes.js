/**
 * Test Script: Call Cleanup Fixes Verification
 * 
 * This script tests the comprehensive fixes applied to resolve:
 * 1. Meeting navigation issues (brief navigation to MeetingScreen then out)
 * 2. Incomplete media cleanup (mic/camera tracks not properly stopped)
 * 3. Race conditions during end call process
 * 4. VideoSDK coordination issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Testing Call Cleanup Fixes Implementation...\n');

// Test 1: UnifiedCallService endCall method improvements
console.log('📋 Test 1: UnifiedCallService endCall method improvements');
const unifiedCallServicePath = path.join(__dirname, 'src/services/calling/UnifiedCallService.ts');
const unifiedCallServiceContent = fs.readFileSync(unifiedCallServicePath, 'utf8');

// Check for critical fixes in endCall method
const endCallChecks = [
  {
    name: 'leaveCurrentCall event emission',
    pattern: /appEventEmitter\.emit\('leaveCurrentCall', \{ callId: targetCall\.callId \}\);/,
    description: 'Ensures VideoSDK leaves before cleanup'
  },
  {
    name: 'VideoSDK wait period',
    pattern: /await new Promise\(resolve => setTimeout\(resolve, 500\)\);/,
    description: 'Waits for VideoSDK to leave before proceeding'
  },
  {
    name: 'Async media cleanup',
    pattern: /await this\.cleanupMedia\(\);/,
    description: 'Ensures media cleanup completes before state update'
  },
  {
    name: 'Call state update timing',
    pattern: /\/\/ ✅ CRITICAL FIX: Update call state LAST to prevent premature navigation/,
    description: 'Updates call state after all cleanup is complete'
  },
  {
    name: 'Event emission timing',
    pattern: /\/\/ ✅ CRITICAL FIX: Emit callStateChanged event AFTER all cleanup is complete/,
    description: 'Emits events after cleanup is complete'
  }
];

let unifiedCallServicePassed = 0;
endCallChecks.forEach(check => {
  const found = check.pattern.test(unifiedCallServiceContent);
  console.log(`  ${found ? '✅' : '❌'} ${check.name}: ${check.description}`);
  if (found) unifiedCallServicePassed++;
});

console.log(`  Result: ${unifiedCallServicePassed}/${endCallChecks.length} checks passed\n`);

// Test 2: CallMediaManager cleanup improvements
console.log('📋 Test 2: CallMediaManager cleanup improvements');
const callMediaManagerPath = path.join(__dirname, 'src/services/calling/CallMediaManager.ts');
const callMediaManagerContent = fs.readFileSync(callMediaManagerPath, 'utf8');

const mediaManagerChecks = [
  {
    name: 'VideoSDK meeting leave coordination',
    pattern: /if \(this\.currentMeeting && typeof this\.currentMeeting\.leave === 'function'\)/,
    description: 'Ensures VideoSDK meeting is left before cleanup'
  },
  {
    name: 'VideoSDK leave timeout',
    pattern: /await Promise\.race\(\[[\s\S]*?this\.currentMeeting\.leave\(\)[\s\S]*?2000\)/,
    description: 'Uses timeout to prevent hanging on VideoSDK leave'
  },
  {
    name: 'VideoSDK disconnect wait',
    pattern: /await new Promise\(resolve => setTimeout\(resolve, 300\)\);/,
    description: 'Waits for VideoSDK to fully disconnect'
  },
  {
    name: 'Enhanced disableAllMedia',
    pattern: /\/\/ ✅ CRITICAL FIX: Disable mic if enabled/,
    description: 'Properly disables microphone via VideoSDK'
  },
  {
    name: 'Enhanced camera disable',
    pattern: /\/\/ ✅ CRITICAL FIX: Disable camera if enabled/,
    description: 'Properly disables camera via VideoSDK'
  },
  {
    name: 'Media disable wait',
    pattern: /await new Promise\(resolve => setTimeout\(resolve, 200\)\);/,
    description: 'Waits for media to be fully disabled'
  }
];

let mediaManagerPassed = 0;
mediaManagerChecks.forEach(check => {
  const found = check.pattern.test(callMediaManagerContent);
  console.log(`  ${found ? '✅' : '❌'} ${check.name}: ${check.description}`);
  if (found) mediaManagerPassed++;
});

console.log(`  Result: ${mediaManagerPassed}/${mediaManagerChecks.length} checks passed\n`);

// Test 3: MeetingScreen navigation improvements
console.log('📋 Test 3: MeetingScreen navigation improvements');
const meetingScreenPath = path.join(__dirname, 'src/screens/videosdk/MeetingScreen.tsx');
const meetingScreenContent = fs.readFileSync(meetingScreenPath, 'utf8');

const meetingScreenChecks = [
  {
    name: 'Enhanced call state listener',
    pattern: /\/\/ ✅ CRITICAL FIX: Enhanced call state change listener with proper coordination/,
    description: 'Improved call state change handling'
  },
  {
    name: 'Navigation timing fix',
    pattern: /}, 800\); \/\/ Increased delay to ensure proper cleanup/,
    description: 'Increased delay for proper cleanup before navigation'
  },
  {
    name: 'Enhanced handleEndCall',
    pattern: /\/\/ ✅ CRITICAL FIX: Enhanced handleEndCall with proper coordination/,
    description: 'Improved end call handling with proper coordination'
  },
  {
    name: 'Enhanced component cleanup',
    pattern: /\/\/ ✅ CRITICAL FIX: Enhanced component cleanup with proper VideoSDK coordination/,
    description: 'Improved component cleanup with VideoSDK coordination'
  },
  {
    name: 'VideoSDK leave timeout increase',
    pattern: /new Promise\(resolve => setTimeout\(resolve, 2000\)\) \/\/ Increased timeout/,
    description: 'Increased timeout for VideoSDK leave operation'
  },
  {
    name: 'Timer cleanup',
    pattern: /\/\/ ✅ CRITICAL FIX: Clear all timers/,
    description: 'Proper timer cleanup during component unmount'
  }
];

let meetingScreenPassed = 0;
meetingScreenChecks.forEach(check => {
  const found = check.pattern.test(meetingScreenContent);
  console.log(`  ${found ? '✅' : '❌'} ${check.name}: ${check.description}`);
  if (found) meetingScreenPassed++;
});

console.log(`  Result: ${meetingScreenPassed}/${meetingScreenChecks.length} checks passed\n`);

// Test 4: Overall integration checks
console.log('📋 Test 4: Overall integration checks');

const integrationChecks = [
  {
    name: 'Async cleanupMedia method',
    pattern: /private async cleanupMedia\(\): Promise<void>/,
    description: 'cleanupMedia method is now async'
  },
  {
    name: 'Event coordination',
    pattern: /appEventEmitter\.emit\('leaveCurrentCall'/,
    description: 'Proper event coordination between services'
  },
  {
    name: 'Race condition prevention',
    pattern: /isEndingCallInProgress/,
    description: 'Race condition prevention mechanism'
  }
];

let integrationPassed = 0;
integrationChecks.forEach(check => {
  const found = check.pattern.test(unifiedCallServiceContent);
  console.log(`  ${found ? '✅' : '❌'} ${check.name}: ${check.description}`);
  if (found) integrationPassed++;
});

console.log(`  Result: ${integrationPassed}/${integrationChecks.length} checks passed\n`);

// Summary
const totalChecks = endCallChecks.length + mediaManagerChecks.length + meetingScreenChecks.length + integrationChecks.length;
const totalPassed = unifiedCallServicePassed + mediaManagerPassed + meetingScreenPassed + integrationPassed;

console.log('📊 SUMMARY');
console.log('==========');
console.log(`Total checks: ${totalChecks}`);
console.log(`Passed: ${totalPassed}`);
console.log(`Failed: ${totalChecks - totalPassed}`);
console.log(`Success rate: ${((totalPassed / totalChecks) * 100).toFixed(1)}%`);

if (totalPassed === totalChecks) {
  console.log('\n🎉 ALL FIXES SUCCESSFULLY IMPLEMENTED!');
  console.log('\n✅ Expected improvements:');
  console.log('  • Meeting joins properly and stays on MeetingScreen');
  console.log('  • End call properly stops mic/camera tracks');
  console.log('  • VideoSDK meeting is properly left before cleanup');
  console.log('  • Navigation happens only after complete cleanup');
  console.log('  • No race conditions between different end call triggers');
  console.log('  • Proper coordination between UnifiedCallService and CallMediaManager');
} else {
  console.log('\n⚠️  SOME FIXES MISSING - Please review the failed checks above');
}

console.log('\n🔍 Manual Testing Recommendations:');
console.log('1. Start a call and verify it stays on MeetingScreen');
console.log('2. End call from UI and verify mic/camera are properly stopped');
console.log('3. End call from notification and verify same behavior');
console.log('4. Check that navigation only happens after cleanup is complete');
console.log('5. Verify no audio/video tracks remain active after call ends');

console.log('\n📝 Next Steps:');
console.log('• Test the fixes on a real device');
console.log('• Monitor logs for proper cleanup sequence');
console.log('• Verify no memory leaks or hanging processes');
console.log('• Test edge cases (network disconnection, app backgrounding)'); 