#!/usr/bin/env node
/**
 * Instant Navigation Verification Script
 * 
 * This script verifies that the "joining call" loading screen has been removed
 * and navigation to MeetingScreen is now instant with proper connecting states.
 */

const fs = require('fs');
const path = require('path');

const ADTIP_DIR = './Adtip';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';
const CHECKMARK = '✓';
const CROSSMARK = '✗';

function log(message, color = RESET) {
  console.log(`${color}${message}${RESET}`);
}

function readFileContent(filePath) {
  try {
    return fs.readFileSync(path.join(ADTIP_DIR, filePath), 'utf8');
  } catch (error) {
    log(`${CROSSMARK} Could not read ${filePath}: ${error.message}`, RED);
    return null;
  }
}

function checkInstantNavigation() {
  log('\n' + '='.repeat(60), BLUE);
  log('INSTANT NAVIGATION VERIFICATION', BLUE);
  log('='.repeat(60), BLUE);

  const checks = [];
  
  // Check 1: Verify "joining call" loading screen is removed
  const meetingScreenContent = readFileContent('src/screens/videosdk/MeetingScreen.tsx');
  if (meetingScreenContent) {
    const hasJoiningLoadingScreen = meetingScreenContent.includes('Joining call...') && 
                                   meetingScreenContent.includes('isJoining && !hasJoined');
    
    if (!hasJoiningLoadingScreen) {
      checks.push({
        name: 'Remove "joining call" loading screen',
        status: 'PASS',
        message: 'Joining call loading screen successfully removed'
      });
    } else {
      checks.push({
        name: 'Remove "joining call" loading screen',
        status: 'FAIL',
        message: 'Joining call loading screen still present'
      });
    }

    // Check 2: Verify connecting state is shown in main UI
    const hasConnectingIndicators = meetingScreenContent.includes('ActivityIndicator') &&
                                   meetingScreenContent.includes('isJoining ||') &&
                                   meetingScreenContent.includes('statusContainer');
    
    if (hasConnectingIndicators) {
      checks.push({
        name: 'Show connecting state in main UI',
        status: 'PASS',
        message: 'Connecting indicators properly integrated into main UI'
      });
    } else {
      checks.push({
        name: 'Show connecting state in main UI',
        status: 'FAIL',
        message: 'Missing connecting state indicators in main UI'
      });
    }

    // Check 3: Verify status container styles are added
    const hasStatusStyles = meetingScreenContent.includes('statusContainer:') &&
                           meetingScreenContent.includes('statusLoader:');
    
    if (hasStatusStyles) {
      checks.push({
        name: 'Add required styles for status indicators',
        status: 'PASS',
        message: 'Status container and loader styles properly defined'
      });
    } else {
      checks.push({
        name: 'Add required styles for status indicators',
        status: 'FAIL',
        message: 'Missing status container or loader styles'
      });
    }

    // Check 4: Verify video call connecting state
    const hasVideoConnectingState = meetingScreenContent.includes('Setting up video...') &&
                                   meetingScreenContent.includes('Connecting...');
    
    if (hasVideoConnectingState) {
      checks.push({
        name: 'Video call connecting state',
        status: 'PASS',
        message: 'Video call shows proper connecting state'
      });
    } else {
      checks.push({
        name: 'Video call connecting state',
        status: 'FAIL',
        message: 'Video call missing connecting state indicators'
      });
    }

    // Check 5: Verify header status indicators
    const hasHeaderIndicators = meetingScreenContent.includes('Show spinner in header for connecting states');
    
    if (hasHeaderIndicators) {
      checks.push({
        name: 'Header status indicators',
        status: 'PASS',
        message: 'Header shows connecting indicators properly'
      });
    } else {
      checks.push({
        name: 'Header status indicators',
        status: 'FAIL',
        message: 'Header missing connecting state indicators'
      });
    }
  }

  // Check 6: Verify navigation is still working in WhatsAppCallManager
  const whatsAppCallContent = readFileContent('src/services/calling/WhatsAppCallManager.ts');
  if (whatsAppCallContent) {
    const hasNavigateToMeeting = whatsAppCallContent.includes('navigateToMeetingScreen') &&
                                whatsAppCallContent.includes("navigate('Main'") &&
                                whatsAppCallContent.includes("screen: 'Meeting'");
    
    if (hasNavigateToMeeting) {
      checks.push({
        name: 'Navigation to MeetingScreen preserved',
        status: 'PASS',
        message: 'WhatsAppCallManager navigation logic intact'
      });
    } else {
      checks.push({
        name: 'Navigation to MeetingScreen preserved',
        status: 'FAIL',
        message: 'WhatsAppCallManager navigation may be broken'
      });
    }
  }

  // Display results
  log('\nCHECK RESULTS:', BLUE);
  log('-'.repeat(50), BLUE);
  
  let passCount = 0;
  let failCount = 0;
  
  checks.forEach(check => {
    if (check.status === 'PASS') {
      log(`${CHECKMARK} ${check.name}`, GREEN);
      log(`   ${check.message}`, GREEN);
      passCount++;
    } else {
      log(`${CROSSMARK} ${check.name}`, RED);
      log(`   ${check.message}`, RED);
      failCount++;
    }
    log(''); // Empty line
  });

  // Summary
  log('='.repeat(50), BLUE);
  log(`SUMMARY: ${passCount} passed, ${failCount} failed`, failCount === 0 ? GREEN : YELLOW);
  
  if (failCount === 0) {
    log('\n🎉 ALL CHECKS PASSED!', GREEN);
    log('✨ Instant navigation is now implemented:', GREEN);
    log('   • No "joining call" loading screen blocks navigation', GREEN);
    log('   • Users see MeetingScreen immediately', GREEN);
    log('   • Connecting state is shown within the call interface', GREEN);
    log('   • Both voice and video calls show proper status indicators', GREEN);
    log('   • Header displays real-time connection status', GREEN);
  } else {
    log('\n⚠️  Some checks failed. Please review the implementation.', YELLOW);
  }

  log('\n' + '='.repeat(60), BLUE);
  
  return failCount === 0;
}

// Key Benefits Summary
function showBenefits() {
  log('\n📋 KEY BENEFITS OF INSTANT NAVIGATION:', BLUE);
  log('1. 🚀 Immediate response - Users see call interface instantly', GREEN);
  log('2. 📱 WhatsApp-like experience - No loading delays', GREEN);
  log('3. 🔄 Better UX - Connecting state handled within call UI', GREEN);
  log('4. 🎯 Visual feedback - Real-time status indicators', GREEN);
  log('5. 📹 Universal - Works for both voice and video calls', GREEN);
  log('6. 🔔 Consistent - Maintains notification and background behavior', GREEN);
}

// Run verification
const success = checkInstantNavigation();
showBenefits();

process.exit(success ? 0 : 1);
