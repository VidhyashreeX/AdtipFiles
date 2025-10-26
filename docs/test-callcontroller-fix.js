/**
 * Test Script for CallController Store Access Fix
 * 
 * This script validates that all store access patterns in CallController
 * have been properly fixed to prevent "Property 'store' doesn't exist" errors.
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const CALLCONTROLLER_PATH = './Adtip/src/services/calling/CallController.ts';

// Test results
const testResults = {
  passed: 0,
  failed: 0,
  details: []
};

function logTest(test, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${test}`);
  if (details) {
    console.log(`   ${details}`);
  }
  
  testResults.details.push({ test, passed, details });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

function readFile(filePath) {
  try {
    return fs.readFileSync(path.join(__dirname, filePath), 'utf8');
  } catch (error) {
    logTest(`Read file ${filePath}`, false, `Error: ${error.message}`);
    return null;
  }
}

function testCallControllerFixes() {
  console.log('🔍 Testing CallController Store Access Fixes...');
  
  const content = readFile(CALLCONTROLLER_PATH);
  if (!content) return;

  // Test 1: Check for problematic store.actions patterns
  const hasProblematicPatterns = content.includes('store.actions.');
  logTest('No problematic store.actions patterns found', !hasProblematicPatterns, 
    hasProblematicPatterns ? 'Found store.actions patterns that could cause errors' : '');

  // Test 2: Check for proper destructuring patterns
  const hasProperDestructuring = content.includes('const { actions }') || 
                                 content.includes('const { actions:');
  logTest('Proper destructuring patterns found', hasProperDestructuring);

  // Test 3: Check for useCallStore.getState() usage
  const hasGetStateUsage = content.includes('useCallStore.getState()');
  logTest('useCallStore.getState() properly used', hasGetStateUsage);

  // Test 4: Check for emergency cleanup fix
  const hasEmergencyCleanupFix = content.includes('const { actions } = useCallStore.getState();\n      actions.reset();');
  logTest('Emergency cleanup properly fixed', hasEmergencyCleanupFix);

  // Test 5: Check for session variable scope fixes
  const hasSessionScopeFix = content.includes('const currentSession = currentStore.session');
  logTest('Session variable scope properly handled', hasSessionScopeFix);

  // Test 6: Count total destructuring patterns
  const destructuringMatches = content.match(/const\s*{\s*actions[^}]*}\s*=\s*useCallStore\.getState\(\)/g);
  const destructuringCount = destructuringMatches ? destructuringMatches.length : 0;
  logTest(`Found ${destructuringCount} proper destructuring patterns`, destructuringCount > 10, 
    `Expected at least 10 destructuring patterns, found ${destructuringCount}`);

  // Test 7: Check for consistent store access
  const hasConsistentAccess = !content.includes('store.actions.') && 
                             content.includes('actions.setStatus') &&
                             content.includes('actions.reset');
  logTest('Consistent store access patterns', hasConsistentAccess);

  // Test 8: Check for proper error handling in cleanup
  const hasProperErrorHandling = content.includes('Failed to reset store during emergency cleanup');
  logTest('Proper error handling in cleanup', hasProperErrorHandling);
}

function generateTestReport() {
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.details
      .filter(result => !result.passed)
      .forEach(result => {
        console.log(`   - ${result.test}: ${result.details}`);
      });
  }

  // Generate recommendations
  console.log('\n💡 Testing Recommendations:');
  console.log('1. Test call initiation and termination');
  console.log('2. Test call cleanup after network errors');
  console.log('3. Test emergency cleanup scenarios');
  console.log('4. Monitor logs for "Property \'store\' doesn\'t exist" errors');
  console.log('5. Verify proper store state management during calls');
  console.log('6. Test concurrent call scenarios');

  return testResults.failed === 0;
}

// Run all tests
function runTests() {
  console.log('🚀 Starting CallController Store Access Fix Validation...');
  console.log('========================================================');

  testCallControllerFixes();

  const allTestsPassed = generateTestReport();

  if (allTestsPassed) {
    console.log('\n🎉 All tests passed! The CallController store access fix appears to be properly implemented.');
    console.log('\n📝 Next Steps:');
    console.log('1. Restart the React Native development server');
    console.log('2. Test call initiation and termination');
    console.log('3. Monitor logs for any remaining store access errors');
    console.log('4. Test edge cases like network failures during calls');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the implementation.');
  }

  return allTestsPassed;
}

// Export for use in other scripts
module.exports = {
  runTests,
  CALLCONTROLLER_PATH
};

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}
