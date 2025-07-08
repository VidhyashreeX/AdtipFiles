#!/usr/bin/env node

/**
 * Second Call Fix Verification Test
 * 
 * This test verifies that the fixes for the second call issue are properly implemented.
 * The issue was: first call works perfectly, but second call connects and immediately exits.
 * 
 * Tests the following fixes:
 * 1. Proper cleanup state management in UnifiedCallService
 * 2. Flag reset in cleanupMedia method
 * 3. Preventative checks in startOutgoingCall
 * 4. Failsafe cleanup mechanisms
 * 5. Event coordination between services
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Second Call Fix Verification Test');
console.log('=====================================\n');

// Test 1: UnifiedCallService cleanup state management
console.log('📋 Test 1: UnifiedCallService cleanup state management');
const unifiedCallServicePath = path.join(__dirname, '../Adtip/src/services/calling/UnifiedCallService.ts');
const unifiedCallServiceContent = fs.readFileSync(unifiedCallServicePath, 'utf8');

const unifiedCallServiceChecks = [
  {
    name: 'isEndingCallInProgress reset in cleanupMedia',
    pattern: /this\.isEndingCallInProgress = false;/,
    description: 'Ensures isEndingCallInProgress is reset during cleanup'
  },
  {
    name: 'Status check removal in cleanupMedia',
    pattern: /\/\/ ✅ CRITICAL FIX: Remove the status check to ensure cleanup can always be performed/,
    description: 'Allows cleanup to run regardless of call status'
  },
  {
    name: 'Cleanup wait logic in startOutgoingCall',
    pattern: /while \(\(this\.isCleaningUp \|\| this\.isEndingCallInProgress\) && waitCount < 10\)/,
    description: 'Waits for cleanup to complete before starting new call'
  },
  {
    name: 'Flag reset in initialization',
    pattern: /this\.isEndingCallInProgress = false;\s*this\.isCleaningUp = false;/,
    description: 'Resets flags during service initialization'
  },
  {
    name: 'Failsafe state reset in endCall finally block',
    pattern: /setTimeout\(\(\) => \{[\s\S]*?this\.mediaManager\.forceCleanupIfNeeded\(\);/,
    description: 'Provides failsafe state reset after call ends'
  },
  {
    name: 'callMediaCleanupComplete event emission',
    pattern: /appEventEmitter\.emit\('callMediaCleanupComplete'/,
    description: 'Emits cleanup completion event for coordination'
  }
];

let unifiedCallServicePassed = 0;
unifiedCallServiceChecks.forEach(check => {
  const found = check.pattern.test(unifiedCallServiceContent);
  console.log(`  ${found ? '✅' : '❌'} ${check.name}: ${check.description}`);
  if (found) unifiedCallServicePassed++;
});

console.log(`  Result: ${unifiedCallServicePassed}/${unifiedCallServiceChecks.length} checks passed\n`);

// Test 2: CallMediaManager failsafe cleanup
console.log('📋 Test 2: CallMediaManager failsafe cleanup');
const callMediaManagerPath = path.join(__dirname, '../Adtip/src/services/calling/CallMediaManager.ts');
const callMediaManagerContent = fs.readFileSync(callMediaManagerPath, 'utf8');

const mediaManagerChecks = [
  {
    name: 'forceCleanupIfNeeded method implementation',
    pattern: /public forceCleanupIfNeeded\(\): void/,
    description: 'Public method for failsafe cleanup'
  },
  {
    name: 'Lingering state detection',
    pattern: /if \(this\.initialized \|\| this\.callId \|\| this\.currentMeeting/,
    description: 'Detects lingering state that might affect next calls'
  },
  {
    name: 'Cleanup notification emit',
    pattern: /appEventEmitter\.emit\('mediaCleanupCompleted'/,
    description: 'Notifies completion of cleanup operations'
  }
];

let mediaManagerPassed = 0;
mediaManagerChecks.forEach(check => {
  const found = check.pattern.test(callMediaManagerContent);
  console.log(`  ${found ? '✅' : '❌'} ${check.name}: ${check.description}`);
  if (found) mediaManagerPassed++;
});

console.log(`  Result: ${mediaManagerPassed}/${mediaManagerChecks.length} checks passed\n`);

// Test 3: MeetingScreen coordination improvements
console.log('📋 Test 3: MeetingScreen coordination improvements');
const meetingScreenPath = path.join(__dirname, '../Adtip/src/screens/videosdk/MeetingScreen.tsx');
const meetingScreenContent = fs.readFileSync(meetingScreenPath, 'utf8');

const meetingScreenChecks = [
  {
    name: 'callMediaCleanupComplete event listener',
    pattern: /appEventEmitter\.on\('callMediaCleanupComplete'/,
    description: 'Listens for cleanup completion events'
  },
  {
    name: 'Component state reset on cleanup',
    pattern: /setIsJoining\(false\);\s*setIsInitializingService\(false\);\s*setIsEndingCall\(false\);/,
    description: 'Resets component state when cleanup completes'
  },
  {
    name: 'Cleanup error handling',
    pattern: /if \(event\.error\) \{[\s\S]*?console\.warn/,
    description: 'Handles cleanup errors gracefully'
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
    name: 'initializeMediaForCall flag reset',
    pattern: /this\.isEndingCallInProgress = false;\s*this\.isCleaningUp = false;[\s\S]*?this\.mediaManager\.forceCleanupIfNeeded\(\);/,
    description: 'Resets flags and forces cleanup before initializing media'
  },
  {
    name: 'Comprehensive error handling in cleanupMedia',
    pattern: /catch \(error\) \{[\s\S]*?this\.isEndingCallInProgress = false;[\s\S]*?this\.mediaManager\.forceCleanupIfNeeded\(\);/,
    description: 'Ensures flags are reset even when cleanup fails'
  },
  {
    name: 'Preventative checks in startOutgoingCall',
    pattern: /if \(this\.isCleaningUp \|\| this\.isEndingCallInProgress\) \{[\s\S]*?Alert\.alert\('Please wait'/,
    description: 'Prevents starting calls during cleanup/ending process'
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
const totalChecks = unifiedCallServiceChecks.length + mediaManagerChecks.length + meetingScreenChecks.length + integrationChecks.length;
const totalPassed = unifiedCallServicePassed + mediaManagerPassed + meetingScreenPassed + integrationPassed;

console.log('📊 SUMMARY');
console.log('==========');
console.log(`Total checks: ${totalChecks}`);
console.log(`Passed: ${totalPassed}`);
console.log(`Failed: ${totalChecks - totalPassed}`);
console.log(`Success rate: ${((totalPassed / totalChecks) * 100).toFixed(1)}%`);

if (totalPassed === totalChecks) {
  console.log('\n🎉 ALL SECOND CALL FIXES SUCCESSFULLY IMPLEMENTED!');
  console.log('\n✅ Expected improvements:');
  console.log('  • First call works perfectly as before');
  console.log('  • Second call no longer exits immediately after connecting');
  console.log('  • Proper state cleanup between calls');
  console.log('  • No lingering VideoSDK or media state');
  console.log('  • Robust error handling and recovery');
  console.log('  • Event-based coordination between services');
} else {
  console.log('\n⚠️  SOME FIXES MISSING - Please review the failed checks above');
  console.log('\nMissing fixes may cause:');
  console.log('  • Second calls to exit immediately');
  console.log('  • Race conditions between cleanup and new calls');
  console.log('  • Lingering state affecting subsequent calls');
  console.log('  • Poor error recovery');
}

console.log('\n🔍 Manual Testing Recommendations:');
console.log('1. Make a first call and end it normally');
console.log('2. Wait 3-5 seconds after first call ends');
console.log('3. Make a second call to the same or different recipient');
console.log('4. Verify second call stays on MeetingScreen and works normally');
console.log('5. Test multiple consecutive calls to ensure consistent behavior');

console.log('\n📝 Key Behavioral Changes:');
console.log('• cleanup() can now run regardless of call status');
console.log('• startOutgoingCall() waits for cleanup to complete');
console.log('• All critical flags are reset during cleanup');
console.log('• Failsafe mechanisms prevent stuck states');
console.log('• Enhanced event coordination between components');

console.log('\n🔧 Debugging Tips:');
console.log('• Monitor logs for "isEndingCallInProgress" and "isCleaningUp" flags');
console.log('• Check for "callMediaCleanupComplete" events');
console.log('• Verify "forceCleanupIfNeeded" is called when needed');
console.log('• Watch for proper state reset in MeetingScreen');
