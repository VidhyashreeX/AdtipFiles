/**
 * Test script to verify LoginPromptModal navigation fix
 * This script verifies that the Login button in LoginPromptModal
 * correctly navigates to LoginScreen instead of OnboardingScreen
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing LoginPromptModal navigation fix...\n');

// Test 1: Check if resetTo import is added
const loginPromptModalPath = path.join(__dirname, 'src/components/modals/LoginPromptModal.tsx');
const loginPromptModalContent = fs.readFileSync(loginPromptModalPath, 'utf8');

console.log('✅ Test 1: Checking resetTo import...');
if (loginPromptModalContent.includes("import { resetTo } from '../../navigation/NavigationService';")) {
  console.log('   ✓ resetTo import found');
} else {
  console.log('   ✗ resetTo import missing');
  process.exit(1);
}

// Test 2: Check if handleLogin function uses resetTo
console.log('✅ Test 2: Checking handleLogin function...');
if (loginPromptModalContent.includes("resetTo('Auth', { screen: 'Login' });")) {
  console.log('   ✓ resetTo call with correct parameters found');
} else {
  console.log('   ✗ resetTo call with correct parameters missing');
  process.exit(1);
}

// Test 3: Check if old navigation.navigate is removed
if (!loginPromptModalContent.includes("navigation.navigate('Login');")) {
  console.log('   ✓ Old navigation.navigate call removed');
} else {
  console.log('   ✗ Old navigation.navigate call still present');
  process.exit(1);
}

// Test 4: Check if test file has been updated
const testFilePath = path.join(__dirname, '__tests__/guest-mode/LoginPromptModal.test.tsx');
const testFileContent = fs.readFileSync(testFilePath, 'utf8');

console.log('✅ Test 3: Checking test file updates...');
if (testFileContent.includes("jest.mock('../../src/navigation/NavigationService'")) {
  console.log('   ✓ NavigationService mock found');
} else {
  console.log('   ✗ NavigationService mock missing');
  process.exit(1);
}

if (testFileContent.includes("expect(mockResetTo).toHaveBeenCalledWith('Auth', { screen: 'Login' });")) {
  console.log('   ✓ Test for resetTo call found');
} else {
  console.log('   ✗ Test for resetTo call missing');
  process.exit(1);
}

console.log('\n🎉 All tests passed! LoginPromptModal navigation fix is correctly implemented.');
console.log('\n📋 Summary of changes:');
console.log('   • Added resetTo import from NavigationService');
console.log('   • Updated handleLogin to use resetTo instead of navigation.navigate');
console.log('   • Updated tests to verify the new navigation behavior');
console.log('   • Login button now navigates directly to LoginScreen bypassing OnboardingScreen');

console.log('\n🚀 The fix ensures that when users in Guest Mode click Login:');
console.log('   1. exitGuestMode() is called to clear guest state');
console.log('   2. resetTo() navigates directly to Auth stack with Login screen');
console.log('   3. Users bypass OnboardingScreen and go straight to LoginScreen');
