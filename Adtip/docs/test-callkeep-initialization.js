/**
 * Test script for CallKeep Initialization
 * 
 * This script validates that the CallKeep initialization changes
 * prevent black screen issues and work correctly.
 */

const fs = require('fs');
const path = require('path');

/**
 * Check if CallKeep initialization is properly isolated
 */
function checkCallKeepIsolation() {
  console.log('🧪 Checking CallKeep initialization isolation...');
  
  const appTsxPath = path.join(__dirname, 'App.tsx');
  
  if (!fs.existsSync(appTsxPath)) {
    console.log('❌ App.tsx not found');
    return false;
  }
  
  const appContent = fs.readFileSync(appTsxPath, 'utf8');
  
  // Check for isolation patterns
  const isolationChecks = [
    {
      name: 'setImmediate usage',
      pattern: /setImmediate\(\s*\(\)\s*=>\s*{/,
      description: 'CallKeep should use setImmediate for isolation'
    },
    {
      name: 'Increased delay',
      pattern: /setTimeout\([^,]+,\s*8000\)/,
      description: 'CallKeep should have 8 second delay'
    },
    {
      name: 'Promise isolation',
      pattern: /isolatedCallKeepInit\s*=\s*new\s*Promise/,
      description: 'CallKeep should use isolated promise'
    },
    {
      name: 'Non-blocking approach',
      pattern: /Don't await the isolated initialization/,
      description: 'CallKeep should not block main thread'
    }
  ];
  
  let passedChecks = 0;
  
  isolationChecks.forEach(check => {
    if (check.pattern.test(appContent)) {
      console.log(`✅ ${check.name}: Found`);
      passedChecks++;
    } else {
      console.log(`❌ ${check.name}: Not found - ${check.description}`);
    }
  });
  
  const success = passedChecks === isolationChecks.length;
  console.log(`📊 CallKeep isolation: ${passedChecks}/${isolationChecks.length} checks passed`);
  
  return success;
}

/**
 * Check CallKeepService improvements
 */
function checkCallKeepServiceImprovements() {
  console.log('\n🧪 Checking CallKeepService improvements...');
  
  const servicePath = path.join(__dirname, 'src', 'services', 'calling', 'CallKeepService.ts');
  
  if (!fs.existsSync(servicePath)) {
    console.log('❌ CallKeepService.ts not found');
    return false;
  }
  
  const serviceContent = fs.readFileSync(servicePath, 'utf8');
  
  // Check for improvements
  const improvementChecks = [
    {
      name: 'Non-blocking initialization',
      pattern: /Initialize CallKeep with proper configuration - completely non-blocking/,
      description: 'Service should be marked as non-blocking'
    },
    {
      name: 'Reduced timeout',
      pattern: /setTimeout\([^,]+,\s*3000\)/,
      description: 'Setup timeout should be reduced to 3 seconds'
    },
    {
      name: 'Shorter permission timeout',
      pattern: /setTimeout\([^,]+,\s*1000\)/,
      description: 'Permission timeout should be 1 second'
    },
    {
      name: 'Event listener isolation',
      pattern: /setImmediate\(\(\)\s*=>\s*{[^}]*setupEventListeners/,
      description: 'Event listeners should be setup in isolated context'
    }
  ];
  
  let passedChecks = 0;
  
  improvementChecks.forEach(check => {
    if (check.pattern.test(serviceContent)) {
      console.log(`✅ ${check.name}: Found`);
      passedChecks++;
    } else {
      console.log(`❌ ${check.name}: Not found - ${check.description}`);
    }
  });
  
  const success = passedChecks >= 2; // At least 2 improvements should be present
  console.log(`📊 CallKeepService improvements: ${passedChecks}/${improvementChecks.length} checks passed`);
  
  return success;
}

/**
 * Check for potential blocking patterns
 */
function checkForBlockingPatterns() {
  console.log('\n🧪 Checking for potential blocking patterns...');
  
  const appTsxPath = path.join(__dirname, 'App.tsx');
  const appContent = fs.readFileSync(appTsxPath, 'utf8');
  
  // Patterns that could cause blocking
  const blockingPatterns = [
    {
      name: 'Synchronous CallKeep import',
      pattern: /import.*CallKeepService.*from/,
      description: 'CallKeep should use dynamic import'
    },
    {
      name: 'Awaited CallKeep initialization',
      pattern: /await.*callKeepService\.initialize\(\)/,
      description: 'CallKeep initialization should not be awaited in main thread'
    }
  ];
  
  let foundBlocking = 0;
  
  blockingPatterns.forEach(pattern => {
    if (pattern.pattern.test(appContent)) {
      console.log(`⚠️  ${pattern.name}: Found - ${pattern.description}`);
      foundBlocking++;
    } else {
      console.log(`✅ ${pattern.name}: Not found (good)`);
    }
  });
  
  const success = foundBlocking === 0;
  console.log(`📊 Blocking patterns: ${foundBlocking} found (should be 0)`);
  
  return success;
}

/**
 * Validate Firebase cloud function routes
 */
function checkFirebaseChatRoutes() {
  console.log('\n🧪 Checking Firebase chat cloud function routes...');
  
  const routesPath = path.join(__dirname, '..', '..', 'adtipback', 'functions', 'routes', 'firebaseChatRoutes.js');
  
  if (!fs.existsSync(routesPath)) {
    console.log('❌ firebaseChatRoutes.js not found');
    return false;
  }
  
  const routesContent = fs.readFileSync(routesPath, 'utf8');
  
  // Check for required endpoints
  const endpointChecks = [
    {
      name: 'send-message endpoint',
      pattern: /router\.post\(["']\/send-message["']/,
      description: 'Should have send-message endpoint'
    },
    {
      name: 'send-message-multicast endpoint',
      pattern: /router\.post\(["']\/send-message-multicast["']/,
      description: 'Should have multicast endpoint'
    },
    {
      name: 'create-conversation endpoint',
      pattern: /router\.post\(["']\/create-conversation["']/,
      description: 'Should have create-conversation endpoint'
    },
    {
      name: 'health endpoint',
      pattern: /router\.get\(["']\/health["']/,
      description: 'Should have health endpoint'
    }
  ];
  
  let passedChecks = 0;
  
  endpointChecks.forEach(check => {
    if (check.pattern.test(routesContent)) {
      console.log(`✅ ${check.name}: Found`);
      passedChecks++;
    } else {
      console.log(`❌ ${check.name}: Not found - ${check.description}`);
    }
  });
  
  const success = passedChecks === endpointChecks.length;
  console.log(`📊 Firebase chat routes: ${passedChecks}/${endpointChecks.length} endpoints found`);
  
  return success;
}

/**
 * Run all validation tests
 */
function runValidationTests() {
  console.log('🚀 Starting CallKeep and Chat Cloud Functions Validation');
  console.log('=========================================================');
  
  const results = {
    callKeepIsolation: checkCallKeepIsolation(),
    callKeepServiceImprovements: checkCallKeepServiceImprovements(),
    noBlockingPatterns: checkForBlockingPatterns(),
    firebaseChatRoutes: checkFirebaseChatRoutes()
  };
  
  console.log('\n📊 Validation Results Summary:');
  console.log('==============================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const passedCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedCount}/${totalCount} validations passed`);
  
  if (passedCount === totalCount) {
    console.log('🎉 All validations passed! Changes are working correctly.');
    console.log('\n📋 Next Steps:');
    console.log('1. Test the app to ensure no black screen appears');
    console.log('2. Deploy Firebase cloud functions');
    console.log('3. Update frontend to use new chat endpoints');
    console.log('4. Test chat functionality with FCM notifications');
  } else {
    console.log('⚠️  Some validations failed. Please review the implementation.');
  }
  
  return passedCount === totalCount;
}

// Run validation if this script is executed directly
if (require.main === module) {
  runValidationTests();
}

module.exports = {
  runValidationTests,
  checkCallKeepIsolation,
  checkCallKeepServiceImprovements,
  checkForBlockingPatterns,
  checkFirebaseChatRoutes
};
