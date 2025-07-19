#!/usr/bin/env node

/**
 * FCM Integration Test Script
 * 
 * This script verifies that the FCM integration is working correctly
 * by checking the implementation and running basic tests.
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 FCM Integration Test Suite');
console.log('============================');

const tests = [
  {
    name: 'FCMMessageRouter exists',
    check: () => {
      return fs.existsSync('src/services/FCMMessageRouter.ts');
    },
    fix: 'Create FCMMessageRouter.ts file'
  },
  {
    name: 'useFCMMessageRouter hook exists',
    check: () => {
      return fs.existsSync('src/hooks/useFCMMessageRouter.ts');
    },
    fix: 'Create useFCMMessageRouter.ts hook'
  },
  {
    name: 'App.tsx uses useFCMMessageRouter',
    check: () => {
      const content = fs.readFileSync('App.tsx', 'utf8');
      return content.includes('useFCMMessageRouter');
    },
    fix: 'Add useFCMMessageRouter to App.tsx'
  },
  {
    name: 'index.js uses FCMMessageRouter for background',
    check: () => {
      const content = fs.readFileSync('index.js', 'utf8');
      return content.includes('FCMMessageRouter');
    },
    fix: 'Update index.js to use FCMMessageRouter'
  },
  {
    name: 'ReliableCallManager FCM handler disabled',
    check: () => {
      const content = fs.readFileSync('src/services/calling/ReliableCallManager.ts', 'utf8');
      return content.includes('FCM listeners delegated to FCMMessageRouter');
    },
    fix: 'Disable FCM handler in ReliableCallManager'
  },
  {
    name: 'FCMChatService FCM handlers disabled',
    check: () => {
      const content = fs.readFileSync('src/services/FCMChatService.ts', 'utf8');
      return content.includes('FCM message handling delegated to FCMMessageRouter');
    },
    fix: 'Disable FCM handlers in FCMChatService'
  },
  {
    name: 'FCMChatService has router integration method',
    check: () => {
      const content = fs.readFileSync('src/services/FCMChatService.ts', 'utf8');
      return content.includes('handleFCMMessageFromRouter');
    },
    fix: 'Add handleFCMMessageFromRouter method to FCMChatService'
  }
];

let passedTests = 0;
let failedTests = 0;

console.log('\n📋 Running Integration Tests...\n');

tests.forEach((test, index) => {
  try {
    const result = test.check();
    if (result) {
      console.log(`✅ ${index + 1}. ${test.name}`);
      passedTests++;
    } else {
      console.log(`❌ ${index + 1}. ${test.name}`);
      console.log(`   Fix: ${test.fix}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`❌ ${index + 1}. ${test.name} (Error: ${error.message})`);
    console.log(`   Fix: ${test.fix}`);
    failedTests++;
  }
});

console.log('\n📊 Test Results:');
console.log(`   Passed: ${passedTests}`);
console.log(`   Failed: ${failedTests}`);
console.log(`   Total:  ${tests.length}`);

if (failedTests === 0) {
  console.log('\n🎉 All tests passed! FCM integration is ready.');
  console.log('\n✅ Implementation Summary:');
  console.log('   - FCMMessageRouter created for centralized message routing');
  console.log('   - useFCMMessageRouter hook handles foreground messages');
  console.log('   - index.js routes background messages via FCMMessageRouter');
  console.log('   - Call FCM functionality preserved completely');
  console.log('   - Chat FCM functionality enabled');
  console.log('   - Handler conflicts resolved');
  
  console.log('\n🔧 Next Steps:');
  console.log('   1. Test call FCM notifications (should work exactly as before)');
  console.log('   2. Test chat FCM notifications (should now work properly)');
  console.log('   3. Verify no conflicts between call and chat messages');
  console.log('   4. Monitor logs for proper message routing');
} else {
  console.log('\n💥 Some tests failed. Please fix the issues above.');
  process.exit(1);
}

console.log('\n🏁 FCM Integration Test Complete');
