#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Guest Mode Test Suite...\n');

// Test configuration
const testConfig = {
  testDir: path.join(__dirname),
  coverageDir: path.join(__dirname, '../../coverage/guest-mode'),
  jestConfig: path.join(__dirname, 'jest.config.js'),
};

// Test scenarios to run
const testScenarios = [
  {
    name: 'AuthContext Guest Mode Tests',
    pattern: 'AuthContext.guest.test.tsx',
    description: 'Tests guest mode state management and authentication flow',
  },
  {
    name: 'ApiService Guest Mode Tests',
    pattern: 'ApiService.guest.test.ts',
    description: 'Tests API service guest mode functionality and request handling',
  },
  {
    name: 'LoginPromptModal Tests',
    pattern: 'LoginPromptModal.test.tsx',
    description: 'Tests login prompt modal component behavior and interactions',
  },
  {
    name: 'Guest Mode Integration Tests',
    pattern: 'GuestMode.integration.test.tsx',
    description: 'Tests complete guest mode flow and component integration',
  },
];

// Helper functions
function runCommand(command, description) {
  console.log(`📋 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit', cwd: path.join(__dirname, '../..') });
    console.log(`✅ ${description} completed successfully\n`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

function createCoverageDir() {
  if (!fs.existsSync(testConfig.coverageDir)) {
    fs.mkdirSync(testConfig.coverageDir, { recursive: true });
    console.log(`📁 Created coverage directory: ${testConfig.coverageDir}`);
  }
}

function runTestScenario(scenario) {
  console.log(`\n🧪 Running ${scenario.name}`);
  console.log(`📝 ${scenario.description}`);
  console.log('─'.repeat(60));
  
  const command = `npx jest --config=${testConfig.jestConfig} --testPathPattern=${scenario.pattern} --verbose`;
  return runCommand(command, `Test: ${scenario.name}`);
}

function runAllTests() {
  console.log('\n🎯 Running All Guest Mode Tests');
  console.log('─'.repeat(60));
  
  const command = `npx jest --config=${testConfig.jestConfig} --coverage --verbose`;
  return runCommand(command, 'All Guest Mode Tests');
}

function generateCoverageReport() {
  console.log('\n📊 Generating Coverage Report');
  console.log('─'.repeat(60));
  
  const command = `npx jest --config=${testConfig.jestConfig} --coverage --coverageReporters=text --coverageReporters=html`;
  return runCommand(command, 'Coverage Report Generation');
}

function printTestSummary(results) {
  console.log('\n📋 Test Summary');
  console.log('═'.repeat(60));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${results.length}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   • ${r.name}`);
    });
  }
  
  console.log(`\n📁 Coverage Report: ${testConfig.coverageDir}/index.html`);
  console.log('═'.repeat(60));
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const runIndividual = args.includes('--individual');
  const runCoverage = args.includes('--coverage');
  const runSpecific = args.find(arg => arg.startsWith('--test='));
  
  // Create coverage directory
  createCoverageDir();
  
  let results = [];
  
  if (runSpecific) {
    // Run specific test
    const testName = runSpecific.split('=')[1];
    const scenario = testScenarios.find(s => s.pattern.includes(testName));
    
    if (scenario) {
      const success = runTestScenario(scenario);
      results.push({ name: scenario.name, success });
    } else {
      console.error(`❌ Test not found: ${testName}`);
      console.log('Available tests:');
      testScenarios.forEach(s => console.log(`   • ${s.pattern}`));
      process.exit(1);
    }
  } else if (runIndividual) {
    // Run tests individually
    for (const scenario of testScenarios) {
      const success = runTestScenario(scenario);
      results.push({ name: scenario.name, success });
    }
  } else {
    // Run all tests together
    const success = runAllTests();
    results.push({ name: 'All Guest Mode Tests', success });
  }
  
  // Generate coverage report if requested
  if (runCoverage || args.includes('--coverage')) {
    generateCoverageReport();
  }
  
  // Print summary
  printTestSummary(results);
  
  // Exit with appropriate code
  const hasFailures = results.some(r => !r.success);
  process.exit(hasFailures ? 1 : 0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

// Run the tests
main().catch((error) => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});

// Export for programmatic use
module.exports = {
  runTestScenario,
  runAllTests,
  generateCoverageReport,
  testScenarios,
};
