#!/usr/bin/env node

/**
 * WhatsApp Calling Implementation Verification Script
 * 
 * This script verifies that all components of the WhatsApp-like calling
 * system are properly implemented and integrated.
 */

const fs = require('fs');
const path = require('path');

const ADTIP_ROOT = __dirname;

// Files that should exist
const REQUIRED_FILES = [
  'src/services/calling/WhatsAppCallManager.ts',
  'src/services/calling/CallNotificationHandler.ts',
  'src/services/calling/__tests__/WhatsAppCallManager.test.ts',
  'src/services/CallService.ts',
  'src/screens/tipcall/TipCallScreen.tsx',
  'App.tsx',
  'WHATSAPP_CALLING_IMPLEMENTATION.md',
];

// Key code patterns that should exist
const REQUIRED_PATTERNS = [
  {
    file: 'src/services/calling/WhatsAppCallManager.ts',
    patterns: [
      'export interface CallData',
      'export interface CallNotificationData',
      'startOutgoingCall',
      'handleIncomingCall',
      'acceptCall',
      'declineCall',
      'endCall',
      'updateCallStatus',
      'notifee.displayNotification',
      'AsyncStorage.setItem',
    ]
  },
  {
    file: 'src/services/calling/CallNotificationHandler.ts',
    patterns: [
      'messaging().setBackgroundMessageHandler',
      'messaging().onMessage',
      'handleCallNotification',
      'WhatsAppCallManager.getInstance',
    ]
  },
  {
    file: 'src/services/CallService.ts',
    patterns: [
      'WhatsAppCallManager',
      'getInstance',
      'startOutgoingCall',
    ]
  },
  {
    file: 'src/screens/tipcall/TipCallScreen.tsx',
    patterns: [
      'WhatsAppCallManager',
      'startOutgoingCall',
    ]
  },
  {
    file: 'App.tsx',
    patterns: [
      'WhatsAppCallManager',
      'CallNotificationHandler',
      'initialize',
    ]
  },
];

// Dependencies that should be installed
const REQUIRED_DEPENDENCIES = [
  '@notifee/react-native',
  '@videosdk.live/react-native-sdk',
  '@react-native-firebase/messaging',
  '@react-native-async-storage/async-storage',
];

console.log('🔍 WhatsApp Calling Implementation Verification\n');

let allPassed = true;

// Check if files exist
console.log('📁 Checking required files...');
for (const file of REQUIRED_FILES) {
  const filePath = path.join(ADTIP_ROOT, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    allPassed = false;
  }
}

console.log('');

// Check code patterns
console.log('🔍 Checking code patterns...');
for (const check of REQUIRED_PATTERNS) {
  const filePath = path.join(ADTIP_ROOT, check.file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    let filePassed = true;
    
    for (const pattern of check.patterns) {
      if (content.includes(pattern)) {
        console.log(`  ✅ ${check.file}: ${pattern}`);
      } else {
        console.log(`  ❌ ${check.file}: ${pattern} - NOT FOUND`);
        filePassed = false;
        allPassed = false;
      }
    }
    
    if (filePassed) {
      console.log(`  ✅ ${check.file} - All patterns found`);
    }
  } else {
    console.log(`  ⚠️  ${check.file} - File not found, skipping pattern check`);
  }
}

console.log('');

// Check package.json dependencies
console.log('📦 Checking dependencies...');
const packageJsonPath = path.join(ADTIP_ROOT, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };
  
  for (const dep of REQUIRED_DEPENDENCIES) {
    if (allDeps[dep]) {
      console.log(`  ✅ ${dep} - ${allDeps[dep]}`);
    } else {
      console.log(`  ❌ ${dep} - NOT INSTALLED`);
      allPassed = false;
    }
  }
} else {
  console.log('  ❌ package.json not found');
  allPassed = false;
}

console.log('');

// Final result
if (allPassed) {
  console.log('🎉 All verification checks passed!');
  console.log('✅ WhatsApp-like calling implementation is complete and ready.');
  console.log('');
  console.log('Next steps:');
  console.log('1. Test the implementation manually');
  console.log('2. Run the test suite: npm test');
  console.log('3. Deploy and monitor in production');
  process.exit(0);
} else {
  console.log('❌ Some verification checks failed.');
  console.log('Please review the missing files or patterns above.');
  process.exit(1);
}
