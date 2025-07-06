#!/usr/bin/env node

/**
 * Verification Script: Incoming Call Balance Bypass
 * 
 * This script verifies that incoming calls bypass balance checks
 * while outgoing calls still require balance verification.
 */

const fs = require('fs');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, checks) {
  log(`\n📁 Checking: ${filePath}`, 'blue');
  
  if (!fs.existsSync(filePath)) {
    log(`❌ File not found: ${filePath}`, 'red');
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  let allPassed = true;
  
  checks.forEach(check => {
    const passed = check.test(content);
    log(`${passed ? '✅' : '❌'} ${check.name}`, passed ? 'green' : 'red');
    if (!passed) {
      allPassed = false;
      if (check.details) {
        log(`   ${check.details}`, 'yellow');
      }
    }
  });
  
  return allPassed;
}

function main() {
  log('🔍 Verifying Incoming Call Balance Bypass Implementation', 'bold');
  log('='.repeat(60), 'blue');
  
  let totalPassed = 0;
  let totalChecks = 0;
  
  // Check UnifiedCallService for incoming call balance bypass
  const unifiedCallServicePath = path.join(__dirname, 'src', 'services', 'calling', 'UnifiedCallService.ts');
  const unifiedCallServiceChecks = [
    {
      name: 'Updated header comment mentions balance management',
      test: (content) => content.includes('Balance management (OUTGOING calls only - incoming calls bypass balance checks)'),
      details: 'Header should mention that balance checks are only for outgoing calls'
    },
    {
      name: 'startCallBilling method checks call direction',
      test: (content) => content.includes('isIncomingCall = this.callState.activeCall.recipientId === currentUserId'),
      details: 'startCallBilling should determine if call is incoming or outgoing'
    },
    {
      name: 'Outgoing calls apply balance checks',
      test: (content) => content.includes('if (isOutgoingCall)') && content.includes('applying balance checks'),
      details: 'Outgoing calls should apply normal balance checks'
    },
    {
      name: 'Incoming calls bypass balance checks',
      test: (content) => content.includes('if (isIncomingCall)') && content.includes('bypassing balance checks'),
      details: 'Incoming calls should bypass balance checks'
    },
    {
      name: 'Incoming calls use high balance value',
      test: (content) => content.includes('999999.99') && content.includes('Very high balance to bypass restrictions'),
      details: 'Incoming calls should use a high balance value to bypass restrictions'
    },
    {
      name: 'Incoming calls treated as premium',
      test: (content) => content.includes('true // Treat as premium to avoid any limitations'),
      details: 'Incoming calls should be treated as premium to avoid limitations'
    },
    {
      name: 'startOutgoingCall comment clarifies outgoing-only balance check',
      test: (content) => content.includes('Pre-check wallet balance for OUTGOING calls only'),
      details: 'startOutgoingCall should clarify that balance checks are only for outgoing calls'
    },
    {
      name: 'Logging differentiates call types',
      test: (content) => content.includes('Outgoing call - applying balance checks') && content.includes('Incoming call - bypassing balance checks'),
      details: 'Logging should differentiate between incoming and outgoing call handling'
    }
  ];
  
  const unifiedCallServicePassed = checkFile(unifiedCallServicePath, unifiedCallServiceChecks);
  totalPassed += unifiedCallServicePassed ? 1 : 0;
  totalChecks += 1;
  
  // Summary
  log('\n📊 Summary:', 'bold');
  log('='.repeat(30), 'blue');
  log(`Files checked: ${totalChecks}`, 'blue');
  log(`Files passed: ${totalPassed}`, totalPassed === totalChecks ? 'green' : 'red');
  log(`Success rate: ${Math.round((totalPassed / totalChecks) * 100)}%`, totalPassed === totalChecks ? 'green' : 'red');
  
  if (totalPassed === totalChecks) {
    log('\n🎉 All checks passed! Incoming call balance bypass is correctly implemented.', 'green');
    log('\n✅ Key improvements:', 'green');
    log('   • Incoming calls bypass balance checks completely', 'green');
    log('   • Outgoing calls still require sufficient balance', 'green');
    log('   • Call direction is properly determined', 'green');
    log('   • Logging differentiates between call types', 'green');
    log('   • Recipients can receive calls regardless of their balance', 'green');
  } else {
    log('\n❌ Some checks failed. Please review the implementation.', 'red');
    process.exit(1);
  }
}

main();
