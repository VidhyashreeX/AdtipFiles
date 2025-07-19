/**
 * Test file for verifying delete post functionality
 * This test verifies that the delete functionality works for both video and image posts
 */

const axios = require('axios');

// Test configuration
const TEST_CONFIG = {
  BASE_URL: 'http://localhost:3000', // Update with your backend URL
  TEST_USER_ID: 1, // Update with a test user ID
  TEST_POST_ID: 1, // Update with a test post ID
  AUTH_TOKEN: 'your-test-auth-token' // Update with a valid auth token
};

/**
 * Test the delete post API endpoint
 */
async function testDeletePostAPI() {
  console.log('🧪 Testing Delete Post API...');
  
  try {
    const response = await axios.post(
      `${TEST_CONFIG.BASE_URL}/api/post/delete`,
      {
        post_id: TEST_CONFIG.TEST_POST_ID
      },
      {
        headers: {
          'Authorization': `Bearer ${TEST_CONFIG.AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Delete Post API Response:', response.data);
    
    if (response.data.status === true) {
      console.log('✅ Post deleted successfully');
      return true;
    } else {
      console.log('❌ Post deletion failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Delete Post API Error:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test the delete video API endpoint (for comparison)
 */
async function testDeleteVideoAPI() {
  console.log('🧪 Testing Delete Video API...');
  
  try {
    const response = await axios.get(
      `${TEST_CONFIG.BASE_URL}/api/deleteVideo/${TEST_CONFIG.TEST_POST_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${TEST_CONFIG.AUTH_TOKEN}`
        }
      }
    );
    
    console.log('✅ Delete Video API Response:', response.data);
    
    if (response.data.status === 200) {
      console.log('✅ Video deleted successfully');
      return true;
    } else {
      console.log('❌ Video deletion failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Delete Video API Error:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test user permission validation
 */
async function testUserPermissionValidation() {
  console.log('🧪 Testing User Permission Validation...');
  
  try {
    // Try to delete a post without proper user ID
    const response = await axios.post(
      `${TEST_CONFIG.BASE_URL}/api/post/delete`,
      {
        post_id: 999999 // Non-existent post ID
      },
      {
        headers: {
          'Authorization': `Bearer ${TEST_CONFIG.AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Permission Test Response:', response.data);
    
    if (response.data.status === false && response.data.message.includes('permission')) {
      console.log('✅ Permission validation working correctly');
      return true;
    } else {
      console.log('❌ Permission validation may not be working properly');
      return false;
    }
  } catch (error) {
    if (error.response?.data?.message?.includes('permission') || 
        error.response?.data?.message?.includes('not found')) {
      console.log('✅ Permission validation working correctly (error response)');
      return true;
    }
    console.error('❌ Permission Test Error:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runDeleteFunctionalityTests() {
  console.log('🚀 Starting Delete Functionality Tests...\n');
  
  const results = {
    deletePostAPI: false,
    deleteVideoAPI: false,
    permissionValidation: false
  };
  
  // Test 1: Delete Post API
  results.deletePostAPI = await testDeletePostAPI();
  console.log('');
  
  // Test 2: Delete Video API (for comparison)
  results.deleteVideoAPI = await testDeleteVideoAPI();
  console.log('');
  
  // Test 3: Permission Validation
  results.permissionValidation = await testUserPermissionValidation();
  console.log('');
  
  // Summary
  console.log('📊 Test Results Summary:');
  console.log('========================');
  console.log(`Delete Post API: ${results.deletePostAPI ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Delete Video API: ${results.deleteVideoAPI ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Permission Validation: ${results.permissionValidation ? '✅ PASS' : '❌ FAIL'}`);
  
  const passedTests = Object.values(results).filter(result => result).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Delete functionality is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation.');
  }
}

/**
 * Instructions for running the test
 */
function printTestInstructions() {
  console.log('📋 Test Instructions:');
  console.log('====================');
  console.log('1. Update TEST_CONFIG with your backend URL and test credentials');
  console.log('2. Ensure your backend server is running');
  console.log('3. Create test posts in your database for testing');
  console.log('4. Run: node delete_post_functionality_test.js');
  console.log('');
}

// Run tests if this file is executed directly
if (require.main === module) {
  printTestInstructions();
  runDeleteFunctionalityTests().catch(console.error);
}

module.exports = {
  testDeletePostAPI,
  testDeleteVideoAPI,
  testUserPermissionValidation,
  runDeleteFunctionalityTests
};
