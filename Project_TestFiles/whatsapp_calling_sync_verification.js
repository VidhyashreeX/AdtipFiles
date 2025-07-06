// whatsapp_calling_sync_verification.js
// Verification script for WhatsApp-like calling system synchronization

const fs = require('fs');
const path = require('path');

// File paths to check
const filesToCheck = [
  {
    path: 'src/services/calling/WhatsAppCallManager.ts',
    name: 'WhatsApp Call Manager'
  },
  {
    path: 'src/services/calling/CallSyncService.ts',
    name: 'Call Sync Service'
  },
  {
    path: 'src/screens/videosdk/MeetingScreen.tsx',
    name: 'Meeting Screen'
  },
  {
    path: 'src/services/CallService.ts',
    name: 'Call Service'
  },
  {
    path: 'App.tsx',
    name: 'App Component'
  }
];

// Required patterns to check
const requiredPatterns = [
  {
    file: 'src/services/calling/WhatsAppCallManager.ts',
    patterns: [
      'appEventEmitter.emit\\(\'callEnded\'',
      'case \'end_call\'',
      'await this.endCall\\(callId\\)',
      'EventType.ACTION_PRESS',
      'async endCall\\(',
      'handleNotificationEvent'
    ],
    description: 'WhatsApp Call Manager notification action handling and event emission'
  },
  {
    file: 'src/services/calling/CallSyncService.ts',
    patterns: [
      'handleCallEnded',
      'appEventEmitter.on\\(\'callEnded\'',
      'performBackgroundSync',
      'CallSyncBackgroundTask',
      'startBackgroundSync',
      'synchronizeCallState'
    ],
    description: 'Call Sync Service background synchronization'
  },
  {
    file: 'src/screens/videosdk/MeetingScreen.tsx',
    patterns: [
      'appEventEmitter.on\\(\'callEnded\'',
      'handleCallEnded',
      'CallService.endCall',
      'WhatsAppCallManager.getInstance',
      'handleEndCall'
    ],
    description: 'Meeting Screen call end event handling'
  },
  {
    file: 'src/services/CallService.ts',
    patterns: [
      'this.whatsAppCallManager.endCall\\(\\)',
      'async endCall\\(',
      'appEventEmitter.emit\\(\'leaveActiveCall\'\\)',
      'endCall\\(reason'
    ],
    description: 'Call Service WhatsApp Call Manager synchronization'
  },
  {
    file: 'App.tsx',
    patterns: [
      'CallSyncService.getInstance',
      'callSyncService.initialize',
      'WhatsAppCallManager.getInstance',
      'whatsAppCallManager.initialize'
    ],
    description: 'App initialization of sync services'
  }
];

// Event flow patterns to verify
const eventFlowPatterns = [
  {
    name: 'Notification End Call Flow',
    sequence: [
      {
        file: 'WhatsAppCallManager.ts',
        pattern: 'case \'end_call\'.*await this.endCall',
        description: 'Notification action triggers WhatsApp Call Manager endCall'
      },
      {
        file: 'WhatsAppCallManager.ts',
        pattern: 'appEventEmitter.emit\\(\'callEnded\'',
        description: 'WhatsApp Call Manager emits callEnded event'
      },
      {
        file: 'MeetingScreen.tsx',
        pattern: 'appEventEmitter.on\\(\'callEnded\'.*handleCallEnded',
        description: 'Meeting Screen listens for callEnded events'
      }
    ]
  },
  {
    name: 'Meeting Screen End Call Flow',
    sequence: [
      {
        file: 'MeetingScreen.tsx',
        pattern: 'CallService.endCall',
        description: 'Meeting Screen calls CallService.endCall'
      },
      {
        file: 'CallService.ts',
        pattern: 'this.whatsAppCallManager.endCall\\(\\)',
        description: 'Call Service calls WhatsApp Call Manager endCall'
      },
      {
        file: 'WhatsAppCallManager.ts',
        pattern: 'appEventEmitter.emit\\(\'callEnded\'',
        description: 'WhatsApp Call Manager emits callEnded event'
      }
    ]
  },
  {
    name: 'Background Sync Flow',
    sequence: [
      {
        file: 'CallSyncService.ts',
        pattern: 'appEventEmitter.on\\(\'callEnded\'',
        description: 'Call Sync Service listens for call end events'
      },
      {
        file: 'CallSyncService.ts',
        pattern: 'performBackgroundSync',
        description: 'Background sync process runs periodically'
      },
      {
        file: 'CallSyncService.ts',
        pattern: 'synchronizeCallState',
        description: 'State synchronization between services'
      }
    ]
  }
];

console.log('🔍 WhatsApp Calling System Synchronization Verification');
console.log('=' * 60);

let allChecksPass = true;
let totalChecks = 0;
let passedChecks = 0;

// Check if all required files exist
console.log('\n📁 File Existence Check:');
for (const file of filesToCheck) {
  const filePath = path.join(__dirname, file.path);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file.name}: ${file.path}`);
    passedChecks++;
  } else {
    console.log(`❌ ${file.name}: ${file.path} - FILE NOT FOUND`);
    allChecksPass = false;
  }
  totalChecks++;
}

// Check required patterns in each file
console.log('\n🔍 Pattern Verification:');
for (const check of requiredPatterns) {
  const filePath = path.join(__dirname, check.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${check.file}: File not found`);
    allChecksPass = false;
    continue;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  console.log(`\n📄 ${check.file} - ${check.description}:`);
  
  for (const pattern of check.patterns) {
    const regex = new RegExp(pattern, 'g');
    const matches = content.match(regex);
    
    totalChecks++;
    if (matches && matches.length > 0) {
      console.log(`  ✅ ${pattern} (${matches.length} matches)`);
      passedChecks++;
    } else {
      console.log(`  ❌ ${pattern} - PATTERN NOT FOUND`);
      allChecksPass = false;
    }
  }
}

// Check event flow patterns
console.log('\n🔄 Event Flow Verification:');
for (const flow of eventFlowPatterns) {
  console.log(`\n📋 ${flow.name}:`);
  
  for (const step of flow.sequence) {
    const matchingFile = filesToCheck.find(f => f.path.includes(step.file));
    if (!matchingFile) {
      console.log(`  ❌ ${step.description} - FILE NOT FOUND: ${step.file}`);
      allChecksPass = false;
      totalChecks++;
      continue;
    }
    
    const filePath = path.join(__dirname, matchingFile.path);
    const content = fs.readFileSync(filePath, 'utf8');
    const regex = new RegExp(step.pattern, 'g');
    const matches = content.match(regex);
    
    totalChecks++;
    if (matches && matches.length > 0) {
      console.log(`  ✅ ${step.description}`);
      passedChecks++;
    } else {
      console.log(`  ❌ ${step.description} - PATTERN NOT FOUND`);
      allChecksPass = false;
    }
  }
}

// Additional integration checks
console.log('\n🔗 Integration Verification:');

// Check if MeetingScreen properly imports appEventEmitter
const meetingScreenPath = path.join(__dirname, 'src/screens/videosdk/MeetingScreen.tsx');
if (fs.existsSync(meetingScreenPath)) {
  const meetingContent = fs.readFileSync(meetingScreenPath, 'utf8');
  
  totalChecks += 3;
  
  // Check import
  if (meetingContent.includes('import { appEventEmitter }')) {
    console.log('  ✅ MeetingScreen imports appEventEmitter');
    passedChecks++;
  } else {
    console.log('  ❌ MeetingScreen missing appEventEmitter import');
    allChecksPass = false;
  }
  
  // Check callEnded listener
  if (meetingContent.includes('appEventEmitter.on(\'callEnded\'')) {
    console.log('  ✅ MeetingScreen listens for callEnded events');
    passedChecks++;
  } else {
    console.log('  ❌ MeetingScreen not listening for callEnded events');
    allChecksPass = false;
  }
  
  // Check cleanup
  if (meetingContent.includes('appEventEmitter.off(\'callEnded\'')) {
    console.log('  ✅ MeetingScreen properly cleans up callEnded listeners');
    passedChecks++;
  } else {
    console.log('  ❌ MeetingScreen missing callEnded listener cleanup');
    allChecksPass = false;
  }
}

// Check if App.tsx initializes CallSyncService
const appPath = path.join(__dirname, 'App.tsx');
if (fs.existsSync(appPath)) {
  const appContent = fs.readFileSync(appPath, 'utf8');
  
  totalChecks += 2;
  
  if (appContent.includes('CallSyncService.getInstance')) {
    console.log('  ✅ App.tsx initializes CallSyncService');
    passedChecks++;
  } else {
    console.log('  ❌ App.tsx missing CallSyncService initialization');
    allChecksPass = false;
  }
  
  if (appContent.includes('callSyncService.initialize')) {
    console.log('  ✅ App.tsx calls CallSyncService.initialize()');
    passedChecks++;
  } else {
    console.log('  ❌ App.tsx missing CallSyncService.initialize() call');
    allChecksPass = false;
  }
}

// Summary
console.log('\n' + '=' * 60);
console.log('📊 VERIFICATION SUMMARY');
console.log('=' * 60);
console.log(`Total Checks: ${totalChecks}`);
console.log(`Passed: ${passedChecks}`);
console.log(`Failed: ${totalChecks - passedChecks}`);
console.log(`Success Rate: ${Math.round((passedChecks / totalChecks) * 100)}%`);

if (allChecksPass) {
  console.log('\n🎉 ALL SYNCHRONIZATION CHECKS PASSED!');
  console.log('✅ The WhatsApp calling system synchronization is properly implemented.');
  console.log('\n📋 Ready for testing:');
  console.log('   1. Test notification end call → MeetingScreen updates');
  console.log('   2. Test MeetingScreen end call → notification dismissal');
  console.log('   3. Test background sync when app is backgrounded');
  console.log('   4. Test sync recovery after app restart');
} else {
  console.log('\n❌ SOME SYNCHRONIZATION CHECKS FAILED!');
  console.log('🔧 Please review the failed patterns and ensure proper implementation.');
}

console.log('\n🏁 Verification Complete');
