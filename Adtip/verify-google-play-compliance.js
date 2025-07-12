#!/usr/bin/env node

/**
 * Google Play Store Compliance Verification Script
 * 
 * This script verifies that all problematic permissions have been removed
 * and that the app is ready for Google Play Store resubmission.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

// Symbols for output
const symbols = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️'
};

// Problematic permissions that should NOT be present
const PROBLEMATIC_PERMISSIONS = [
  'android.permission.RECEIVE_SMS',
  'android.permission.READ_SMS',
  'android.permission.READ_PHONE_STATE',
  'android.permission.READ_PHONE_NUMBERS',
  'android.permission.ADD_VOICEMAIL',
  'android.permission.READ_CALL_LOG'
];

// Essential permissions that SHOULD be present
const ESSENTIAL_PERMISSIONS = [
  'android.permission.INTERNET',
  'android.permission.RECORD_AUDIO',
  'android.permission.CAMERA',
  'android.permission.BIND_TELECOM_CONNECTION_SERVICE',
  'android.permission.CALL_PHONE',
  'android.permission.USE_FULL_SCREEN_INTENT'
];

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`${title}`, 'cyan');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logResult(symbol, message, color = 'white') {
  log(`${symbol} ${message}`, color);
}

function readManifestFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

function extractPermissions(manifestContent) {
  if (!manifestContent) return [];

  const permissionRegex = /<uses-permission[^>]+android:name="([^"]+)"[^>]*>/g;
  const permissions = [];
  let match;

  while ((match = permissionRegex.exec(manifestContent)) !== null) {
    const fullMatch = match[0];
    const permissionName = match[1];

    // Skip permissions with tools:node="remove" - these are removal directives, not actual permissions
    if (!fullMatch.includes('tools:node="remove"')) {
      permissions.push(permissionName);
    }
  }

  return permissions;
}

function checkMainManifest() {
  logSection('CHECKING MAIN ANDROID MANIFEST');
  
  const manifestPath = path.join(__dirname, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
  const manifestContent = readManifestFile(manifestPath);
  
  if (!manifestContent) {
    logResult(symbols.error, 'Could not read AndroidManifest.xml', 'red');
    return false;
  }
  
  logResult(symbols.success, 'AndroidManifest.xml found and readable', 'green');
  
  const permissions = extractPermissions(manifestContent);
  log(`\nFound ${permissions.length} permissions in main manifest:`, 'blue');
  
  let hasProblems = false;
  
  // Check for problematic permissions
  log('\nChecking for problematic permissions:', 'yellow');
  PROBLEMATIC_PERMISSIONS.forEach(permission => {
    if (permissions.includes(permission)) {
      logResult(symbols.error, `FOUND: ${permission}`, 'red');
      hasProblems = true;
    } else {
      logResult(symbols.success, `NOT FOUND: ${permission}`, 'green');
    }
  });
  
  // Check for essential permissions
  log('\nChecking for essential permissions:', 'yellow');
  ESSENTIAL_PERMISSIONS.forEach(permission => {
    if (permissions.includes(permission)) {
      logResult(symbols.success, `FOUND: ${permission}`, 'green');
    } else {
      logResult(symbols.warning, `MISSING: ${permission}`, 'yellow');
    }
  });
  
  // Check for explicit removal directives
  log('\nChecking for explicit permission removal directives:', 'yellow');
  const removalRegex = /tools:node="remove"/g;
  const removalMatches = manifestContent.match(removalRegex);
  if (removalMatches && removalMatches.length > 0) {
    logResult(symbols.success, `Found ${removalMatches.length} explicit removal directive(s)`, 'green');
  } else {
    logResult(symbols.warning, 'No explicit removal directives found', 'yellow');
  }
  
  return !hasProblems;
}

function checkMergedManifests() {
  logSection('CHECKING MERGED MANIFESTS (BUILD ARTIFACTS)');
  
  const mergedManifestPaths = [
    'android/app/build/intermediates/merged_manifest/release/processReleaseMainManifest/AndroidManifest.xml',
    'android/app/build/intermediates/merged_manifest/debug/processDebugMainManifest/AndroidManifest.xml'
  ];
  
  let foundMergedManifest = false;
  let hasProblems = false;
  
  mergedManifestPaths.forEach(relativePath => {
    const fullPath = path.join(__dirname, relativePath);
    const manifestContent = readManifestFile(fullPath);
    
    if (manifestContent) {
      foundMergedManifest = true;
      log(`\nChecking: ${relativePath}`, 'blue');
      
      const permissions = extractPermissions(manifestContent);
      
      PROBLEMATIC_PERMISSIONS.forEach(permission => {
        if (permissions.includes(permission)) {
          logResult(symbols.error, `FOUND IN MERGED: ${permission}`, 'red');
          hasProblems = true;
        }
      });
      
      if (!hasProblems) {
        logResult(symbols.success, 'No problematic permissions found in merged manifest', 'green');
      }
    }
  });
  
  if (!foundMergedManifest) {
    logResult(symbols.info, 'No merged manifests found (run build first to check)', 'yellow');
    return true; // Not a failure, just no build artifacts
  }
  
  return !hasProblems;
}

function checkRazorpayConfig() {
  logSection('CHECKING RAZORPAY CONFIGURATION');
  
  const configPath = path.join(__dirname, 'android', 'app', 'build', 'intermediates', 'merged-not-compiled-resources', 'release', 'raw', 'rzp_config_checkout.json');
  
  try {
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configContent);
      
      if (config.permissions && config.permissions.enable_custom_message === false) {
        logResult(symbols.success, 'Razorpay SMS auto-fill is disabled', 'green');
        return true;
      } else {
        logResult(symbols.warning, 'Razorpay SMS auto-fill configuration unclear', 'yellow');
        return false;
      }
    } else {
      logResult(symbols.info, 'Razorpay config not found (build first to check)', 'yellow');
      return true;
    }
  } catch (error) {
    logResult(symbols.error, `Error reading Razorpay config: ${error.message}`, 'red');
    return false;
  }
}

function generateReport(mainManifestOk, mergedManifestOk, razorpayConfigOk) {
  logSection('COMPLIANCE REPORT');
  
  const allChecksPass = mainManifestOk && mergedManifestOk && razorpayConfigOk;
  
  if (allChecksPass) {
    logResult(symbols.success, 'ALL CHECKS PASSED', 'green');
    log('\n🎉 The app appears to be compliant with Google Play Store policies!', 'green');
    log('\nNext steps:', 'blue');
    log('1. Build the release APK/AAB', 'white');
    log('2. Test all functionality', 'white');
    log('3. Submit to Google Play Store', 'white');
  } else {
    logResult(symbols.error, 'SOME CHECKS FAILED', 'red');
    log('\n⚠️  The app may still have compliance issues.', 'red');
    log('\nPlease review the errors above and fix them before resubmission.', 'yellow');
  }
  
  log('\nDetailed Results:', 'blue');
  logResult(mainManifestOk ? symbols.success : symbols.error, `Main Manifest: ${mainManifestOk ? 'PASS' : 'FAIL'}`, mainManifestOk ? 'green' : 'red');
  logResult(mergedManifestOk ? symbols.success : symbols.error, `Merged Manifests: ${mergedManifestOk ? 'PASS' : 'FAIL'}`, mergedManifestOk ? 'green' : 'red');
  logResult(razorpayConfigOk ? symbols.success : symbols.error, `Razorpay Config: ${razorpayConfigOk ? 'PASS' : 'FAIL'}`, razorpayConfigOk ? 'green' : 'red');
  
  return allChecksPass;
}

function main() {
  log('Google Play Store Compliance Verification', 'bright');
  log('==========================================', 'bright');
  
  const mainManifestOk = checkMainManifest();
  const mergedManifestOk = checkMergedManifests();
  const razorpayConfigOk = checkRazorpayConfig();
  
  const success = generateReport(mainManifestOk, mergedManifestOk, razorpayConfigOk);
  
  process.exit(success ? 0 : 1);
}

// Run the verification
main();
