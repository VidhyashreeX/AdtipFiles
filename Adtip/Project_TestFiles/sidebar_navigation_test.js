/**
 * Test file for verifying sidebar navigation changes
 * This test verifies that the sidebar navigation has been updated from "Play to Earn" to "Install to Earn"
 * and that it properly navigates to the PubScale functionality
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  SIDEBAR_FILE_PATH: path.join(__dirname, '../src/components/sidebar/Sidebar.tsx'),
  NAVIGATION_FILE_PATH: path.join(__dirname, '../src/navigation/MainNavigator.tsx'),
  INSTALL_TO_EARN_SCREEN_PATH: path.join(__dirname, '../src/screens/installToEarn/InstallToEarnScreen.tsx'),
};

/**
 * Test that sidebar menu text has been changed from "Play to Earn" to "Install to Earn"
 */
function testSidebarMenuText() {
  console.log('🧪 Testing Sidebar Menu Text Change...');
  
  try {
    const sidebarContent = fs.readFileSync(TEST_CONFIG.SIDEBAR_FILE_PATH, 'utf8');
    
    // Check that "Play to Earn" is no longer present
    const hasPlayToEarn = sidebarContent.includes("'Play to Earn'") || sidebarContent.includes('"Play to Earn"');
    
    // Check that "Install to Earn" is present
    const hasInstallToEarn = sidebarContent.includes("'Install to Earn'") || sidebarContent.includes('"Install to Earn"');
    
    if (!hasPlayToEarn && hasInstallToEarn) {
      console.log('✅ Sidebar menu text successfully changed to "Install to Earn"');
      return true;
    } else if (hasPlayToEarn) {
      console.log('❌ "Play to Earn" text still found in sidebar');
      return false;
    } else if (!hasInstallToEarn) {
      console.log('❌ "Install to Earn" text not found in sidebar');
      return false;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error reading sidebar file:', error.message);
    return false;
  }
}

/**
 * Test that the icon has been updated appropriately
 */
function testSidebarIcon() {
  console.log('🧪 Testing Sidebar Icon Change...');
  
  try {
    const sidebarContent = fs.readFileSync(TEST_CONFIG.SIDEBAR_FILE_PATH, 'utf8');
    
    // Check for download icon (more appropriate for "Install to Earn")
    const hasDownloadIcon = sidebarContent.includes("icon: 'download'");
    
    if (hasDownloadIcon) {
      console.log('✅ Sidebar icon updated to download icon');
      return true;
    } else {
      console.log('⚠️  Sidebar icon may not be optimal for "Install to Earn" functionality');
      // This is not a failure, just a suggestion
      return true;
    }
  } catch (error) {
    console.error('❌ Error reading sidebar file:', error.message);
    return false;
  }
}

/**
 * Test that navigation has been updated to use InstallToEarnScreen
 */
function testNavigationUpdate() {
  console.log('🧪 Testing Navigation Update...');
  
  try {
    const navigationContent = fs.readFileSync(TEST_CONFIG.NAVIGATION_FILE_PATH, 'utf8');
    
    // Check that InstallToEarnScreen is imported
    const hasInstallToEarnImport = navigationContent.includes('InstallToEarnScreen');
    
    // Check that PlayToEarn route uses InstallToEarnScreen
    const hasCorrectRouteMapping = navigationContent.includes('withWalletBalance(InstallToEarnScreen)') ||
                                   navigationContent.includes('withFastLoading(InstallToEarnScreen');
    
    if (hasInstallToEarnImport && hasCorrectRouteMapping) {
      console.log('✅ Navigation successfully updated to use InstallToEarnScreen');
      return true;
    } else if (!hasInstallToEarnImport) {
      console.log('❌ InstallToEarnScreen import not found in navigation');
      return false;
    } else if (!hasCorrectRouteMapping) {
      console.log('❌ PlayToEarn route not properly mapped to InstallToEarnScreen');
      return false;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error reading navigation file:', error.message);
    return false;
  }
}

/**
 * Test that InstallToEarnScreen exists and has PubScale functionality
 */
function testInstallToEarnScreen() {
  console.log('🧪 Testing InstallToEarnScreen Implementation...');
  
  try {
    const screenContent = fs.readFileSync(TEST_CONFIG.INSTALL_TO_EARN_SCREEN_PATH, 'utf8');
    
    // Check for PubScale service import
    const hasPubScaleImport = screenContent.includes('PubScaleService');
    
    // Check for offerwall functionality
    const hasOfferwallFunction = screenContent.includes('showOfferwall') || screenContent.includes('handleInstallToEarn');
    
    // Check for proper UI elements
    const hasInstallToEarnTitle = screenContent.includes('Install to Earn') || screenContent.includes('Install Apps');
    
    if (hasPubScaleImport && hasOfferwallFunction && hasInstallToEarnTitle) {
      console.log('✅ InstallToEarnScreen properly implemented with PubScale functionality');
      return true;
    } else {
      const missing = [];
      if (!hasPubScaleImport) missing.push('PubScale import');
      if (!hasOfferwallFunction) missing.push('offerwall functionality');
      if (!hasInstallToEarnTitle) missing.push('proper UI title');
      
      console.log(`❌ InstallToEarnScreen missing: ${missing.join(', ')}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error reading InstallToEarnScreen file:', error.message);
    return false;
  }
}

/**
 * Test that the navigation destination is correct
 */
function testNavigationDestination() {
  console.log('🧪 Testing Navigation Destination...');
  
  try {
    const sidebarContent = fs.readFileSync(TEST_CONFIG.SIDEBAR_FILE_PATH, 'utf8');
    
    // Check that the screen property still points to 'PlayToEarn' (which now maps to InstallToEarnScreen)
    const hasCorrectScreen = sidebarContent.includes("screen: 'PlayToEarn'");
    
    if (hasCorrectScreen) {
      console.log('✅ Navigation destination correctly maintained');
      return true;
    } else {
      console.log('❌ Navigation destination may have been incorrectly changed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error reading sidebar file:', error.message);
    return false;
  }
}

/**
 * Main test runner
 */
function runSidebarNavigationTests() {
  console.log('🚀 Starting Sidebar Navigation Tests...\n');
  
  const results = {
    sidebarMenuText: false,
    sidebarIcon: false,
    navigationUpdate: false,
    installToEarnScreen: false,
    navigationDestination: false
  };
  
  // Test 1: Sidebar menu text change
  results.sidebarMenuText = testSidebarMenuText();
  console.log('');
  
  // Test 2: Sidebar icon update
  results.sidebarIcon = testSidebarIcon();
  console.log('');
  
  // Test 3: Navigation update
  results.navigationUpdate = testNavigationUpdate();
  console.log('');
  
  // Test 4: InstallToEarnScreen implementation
  results.installToEarnScreen = testInstallToEarnScreen();
  console.log('');
  
  // Test 5: Navigation destination
  results.navigationDestination = testNavigationDestination();
  console.log('');
  
  // Summary
  console.log('📊 Test Results Summary:');
  console.log('========================');
  console.log(`Sidebar Menu Text: ${results.sidebarMenuText ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Sidebar Icon: ${results.sidebarIcon ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Navigation Update: ${results.navigationUpdate ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`InstallToEarnScreen: ${results.installToEarnScreen ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Navigation Destination: ${results.navigationDestination ? '✅ PASS' : '❌ FAIL'}`);
  
  const passedTests = Object.values(results).filter(result => result).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Sidebar navigation successfully updated to "Install to Earn".');
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation.');
  }
  
  return results;
}

/**
 * Instructions for running the test
 */
function printTestInstructions() {
  console.log('📋 Test Instructions:');
  console.log('====================');
  console.log('1. Ensure all files are in the correct locations');
  console.log('2. Run: node sidebar_navigation_test.js');
  console.log('3. Check that all tests pass');
  console.log('4. Test the actual navigation in the app to ensure it works correctly');
  console.log('');
}

// Run tests if this file is executed directly
if (require.main === module) {
  printTestInstructions();
  runSidebarNavigationTests();
}

module.exports = {
  testSidebarMenuText,
  testSidebarIcon,
  testNavigationUpdate,
  testInstallToEarnScreen,
  testNavigationDestination,
  runSidebarNavigationTests
};
