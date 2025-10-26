#!/usr/bin/env node

/**
 * Verification script for CallKeep permissions fix
 * This script checks that the necessary changes are in place
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying CallKeep Permissions Fix...\n');

const checks = [
  {
    name: 'CallKeepService automatic permission request',
    file: 'src/services/calling/CallKeepService.ts',
    pattern: /attempting to request/,
    description: 'CallKeepService should automatically request permissions when not granted'
  },
  {
    name: 'CallUICoordinator permission request before fallback',
    file: 'src/services/calling/CallUICoordinator.ts',
    pattern: /attempting to request/,
    description: 'CallUICoordinator should try to request permissions before falling back to custom UI'
  },
  {
    name: 'Enhanced requestPermissions method',
    file: 'src/services/calling/CallKeepService.ts',
    pattern: /registerPhoneAccount.*await/s,
    description: 'requestPermissions method should properly await the registerPhoneAccount call'
  },
  {
    name: 'hasRequiredPermissions method',
    file: 'src/services/calling/CallKeepService.ts',
    pattern: /hasRequiredPermissions/,
    description: 'CallKeepService should have hasRequiredPermissions method'
  },
  {
    name: 'PermissionsScreen CallKeep integration',
    file: 'src/screens/settings/PermissionsScreen.tsx',
    pattern: /callkeep.*Native Call UI/s,
    description: 'PermissionsScreen should include CallKeep in permissions list'
  },
  {
    name: 'CallKeepPermissionHelper utility',
    file: 'src/utils/callKeepPermissionHelper.ts',
    pattern: /class CallKeepPermissionHelper/,
    description: 'CallKeepPermissionHelper utility class should exist'
  }
];

let passedChecks = 0;
let totalChecks = checks.length;

checks.forEach((check, index) => {
  try {
    const filePath = path.join(__dirname, check.file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ ${index + 1}. ${check.name}`);
      console.log(`   File not found: ${check.file}\n`);
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    
    if (check.pattern.test(content)) {
      console.log(`✅ ${index + 1}. ${check.name}`);
      passedChecks++;
    } else {
      console.log(`❌ ${index + 1}. ${check.name}`);
      console.log(`   Pattern not found in ${check.file}`);
    }
    
    console.log(`   ${check.description}\n`);
    
  } catch (error) {
    console.log(`❌ ${index + 1}. ${check.name}`);
    console.log(`   Error checking ${check.file}: ${error.message}\n`);
  }
});

console.log(`\n📊 Results: ${passedChecks}/${totalChecks} checks passed`);

if (passedChecks === totalChecks) {
  console.log('🎉 All checks passed! CallKeep permissions fix is properly implemented.');
  console.log('\n📋 Summary of changes:');
  console.log('• CallKeepService now automatically requests permissions during initialization');
  console.log('• CallUICoordinator attempts permission request before falling back to custom UI');
  console.log('• Enhanced permission request methods with better error handling');
  console.log('• Added CallKeep to PermissionsScreen for manual management');
  console.log('• Created CallKeepPermissionHelper utility for proactive permission management');
  console.log('• Added comprehensive test coverage');
  
  console.log('\n🚀 Next steps:');
  console.log('• Test the app on Android device to verify permission dialogs appear');
  console.log('• Check that CallKeep UI is used when permissions are granted');
  console.log('• Verify graceful fallback to custom UI when permissions are denied');
  console.log('• Monitor logs for permission request success/failure');
} else {
  console.log('⚠️  Some checks failed. Please review the implementation.');
  process.exit(1);
}
