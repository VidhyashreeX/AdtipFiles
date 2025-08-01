#!/usr/bin/env node

/**
 * Test script to verify force update modal functionality
 * This script tests the complete flow from API call to modal triggering
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:7082';
const TEST_SCENARIOS = [
  {
    name: 'Force Update Required (v1.0.0)',
    current_version: '1.0.0',
    platform: 'android',
    expected_status: true,
    expected_force_update: true
  },
  {
    name: 'App Up to Date (v33.0.0)',
    current_version: '33.0.0',
    platform: 'android',
    expected_status: false,
    expected_force_update: false
  },
  {
    name: 'Newer Version (v34.0.0)',
    current_version: '34.0.0',
    platform: 'android',
    expected_status: false,
    expected_force_update: false
  }
];

/**
 * Test the version check API endpoint
 */
async function testVersionCheckAPI(scenario) {
  try {
    console.log(`\n🔍 Testing: ${scenario.name}`);
    console.log(`   Current Version: ${scenario.current_version}`);
    console.log(`   Platform: ${scenario.platform}`);
    
    const response = await axios.post(`${API_BASE_URL}/api/check-app-version`, {
      current_version: scenario.current_version,
      current_build: '1',
      platform: scenario.platform
    });
    
    console.log(`   ✅ Response Status: ${response.status}`);
    console.log(`   📊 Response Data:`, JSON.stringify(response.data, null, 2));
    
    // Validate response
    const { status, data } = response.data;
    
    if (status !== scenario.expected_status) {
      console.log(`   ❌ FAIL: Expected status ${scenario.expected_status}, got ${status}`);
      return false;
    }
    
    if (scenario.expected_status && data) {
      // Handle both boolean and integer values for force_update (MySQL returns TINYINT as integer)
      const actualForceUpdate = Boolean(data.force_update);
      if (actualForceUpdate !== scenario.expected_force_update) {
        console.log(`   ❌ FAIL: Expected force_update ${scenario.expected_force_update}, got ${actualForceUpdate} (raw: ${data.force_update})`);
        return false;
      }
      
      // Check required fields for force update
      if (scenario.expected_force_update) {
        const requiredFields = ['latest_version', 'force_update', 'store_url'];
        for (const field of requiredFields) {
          if (!data[field]) {
            console.log(`   ❌ FAIL: Missing required field: ${field}`);
            return false;
          }
        }
      }
    }
    
    console.log(`   ✅ PASS: All validations passed`);
    return true;
    
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    if (error.response) {
      console.log(`   📊 Error Response:`, JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/**
 * Simulate the React Native app's version check flow
 */
async function simulateAppVersionCheck() {
  console.log('\n🚀 Simulating React Native App Version Check Flow...');
  
  // This simulates what happens in App.tsx
  try {
    const currentVersion = '1.0.0'; // From app.json
    const currentBuild = '1';
    const platform = 'android';
    
    console.log(`📱 App Version: ${currentVersion}`);
    console.log(`🔧 Build Number: ${currentBuild}`);
    console.log(`📱 Platform: ${platform}`);
    
    // Call the API (simulating VersionCheckService.forceCheckForUpdates())
    const response = await axios.post(`${API_BASE_URL}/api/check-app-version`, {
      current_version: currentVersion,
      current_build: currentBuild,
      platform: platform
    });
    
    console.log(`\n📥 API Response:`, JSON.stringify(response.data, null, 2));
    
    // Simulate App.tsx logic
    const { status, data } = response.data;
    
    if (status && data) {
      console.log(`\n⚠️ Update Required!`);
      console.log(`   Current: ${currentVersion}`);
      console.log(`   Latest: ${data.latest_version}`);
      console.log(`   Force Update: ${data.force_update}`);
      
      if (data.force_update) {
        console.log(`\n🚨 FORCE UPDATE MODAL SHOULD APPEAR`);
        console.log(`   Modal Props:`);
        console.log(`   - visible: true`);
        console.log(`   - updateInfo:`, JSON.stringify(data, null, 4));
        
        // Simulate modal behavior
        console.log(`\n📱 Force Update Modal Behavior:`);
        console.log(`   - Blocks entire app`);
        console.log(`   - Shows update message: "${data.update_message || 'A critical update is required'}"`);
        console.log(`   - Update button opens: ${data.store_url || data.update_url}`);
        console.log(`   - Cannot be dismissed (force update)`);
        
        return {
          shouldShowModal: true,
          modalType: 'force',
          updateInfo: data
        };
      } else {
        console.log(`\n📱 OPTIONAL UPDATE MODAL SHOULD APPEAR`);
        return {
          shouldShowModal: true,
          modalType: 'optional',
          updateInfo: data
        };
      }
    } else {
      console.log(`\n✅ App is up to date - no modal should appear`);
      return {
        shouldShowModal: false,
        modalType: null,
        updateInfo: null
      };
    }
    
  } catch (error) {
    console.log(`\n❌ Version check failed:`, error.message);
    return {
      shouldShowModal: false,
      modalType: null,
      updateInfo: null,
      error: error.message
    };
  }
}

/**
 * Test the middleware behavior
 */
async function testMiddlewareBehavior() {
  console.log('\n🛡️ Testing Middleware Behavior...');
  
  try {
    // Test that version check endpoint is excluded from middleware
    console.log('   Testing version check endpoint exclusion...');
    const versionResponse = await axios.post(`${API_BASE_URL}/api/check-app-version`, {
      current_version: '1.0.0',
      platform: 'android',
      current_build: '1'
    });
    
    if (versionResponse.status === 200) {
      console.log('   ✅ Version check endpoint correctly excluded from middleware');
    } else {
      console.log('   ❌ Version check endpoint blocked by middleware');
      return false;
    }
    
    // Test that other endpoints are protected by middleware
    console.log('   Testing other endpoints with old version...');
    try {
      const protectedResponse = await axios.post(`${API_BASE_URL}/api/ping`, {
        current_version: '1.0.0',
        platform: 'android'
      }, {
        headers: {
          'x-app-version': '1.0.0',
          'x-platform': 'android'
        }
      });
      
      console.log('   ❌ Other endpoints should be blocked by middleware');
      return false;
    } catch (error) {
      if (error.response && error.response.status === 426) {
        console.log('   ✅ Other endpoints correctly blocked by middleware (426 status)');
      } else {
        console.log('   ⚠️ Unexpected error from protected endpoint:', error.message);
      }
    }
    
    return true;
    
  } catch (error) {
    console.log(`   ❌ Middleware test failed:`, error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🧪 Force Update Modal Test Suite');
  console.log('=====================================');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test 1: API Endpoint Tests
  console.log('\n📡 Testing API Endpoints...');
  for (const scenario of TEST_SCENARIOS) {
    totalTests++;
    const passed = await testVersionCheckAPI(scenario);
    if (passed) passedTests++;
  }
  
  // Test 2: App Flow Simulation
  console.log('\n📱 Testing App Flow...');
  totalTests++;
  const appFlowResult = await simulateAppVersionCheck();
  if (appFlowResult.shouldShowModal && appFlowResult.modalType === 'force') {
    console.log('   ✅ PASS: Force update modal should appear correctly');
    passedTests++;
  } else if (appFlowResult.error) {
    console.log('   ❌ FAIL: App flow simulation failed');
  } else {
    console.log('   ❌ FAIL: Force update modal should appear but doesn\'t');
  }
  
  // Test 3: Middleware Behavior
  console.log('\n🛡️ Testing Middleware...');
  totalTests++;
  const middlewarePassed = await testMiddlewareBehavior();
  if (middlewarePassed) passedTests++;
  
  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('========================');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! Force update functionality is working correctly.');
    console.log('\n📋 Next Steps:');
    console.log('1. Test the React Native app with version 1.0.0');
    console.log('2. Verify the ForceUpdateModal appears and blocks the app');
    console.log('3. Test the "Update Now" button opens the correct app store');
    console.log('4. Update app.json version to 33.0.0 for production');
  } else {
    console.log('\n❌ Some tests failed. Please check the issues above.');
  }
  
  return passedTests === totalTests;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testVersionCheckAPI,
  simulateAppVersionCheck,
  testMiddlewareBehavior,
  runTests
};
