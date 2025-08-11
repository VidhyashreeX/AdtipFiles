/**
 * Test file to verify voice-call and video-call APIs
 * This tests the new subscription-based calling system
 */

const ApiService = require('../src/services/ApiService').default;

// Test configuration
const TEST_CONFIG = {
  baseURL: 'https://api.adtip.in',
  callerId: '50816', // Test caller ID
  receiverId: '58422', // Test receiver ID
  authToken: 'YOUR_AUTH_TOKEN_HERE' // Replace with actual token
};

// Test voice call API
async function testVoiceCallAPI() {
  console.log('🧪 Testing Voice Call API...');
  
  try {
    const response = await ApiService.post('/api/voice-call', {
      caller_id: TEST_CONFIG.callerId,
      receiver_id: TEST_CONFIG.receiverId,
      call_type: 'voice'
    });
    
    console.log('✅ Voice Call API Response:', response);
    return response;
  } catch (error) {
    console.error('❌ Voice Call API Error:', error);
    return null;
  }
}

// Test video call API
async function testVideoCallAPI() {
  console.log('🧪 Testing Video Call API...');
  
  try {
    const response = await ApiService.post('/api/video-call', {
      caller_id: TEST_CONFIG.callerId,
      receiver_id: TEST_CONFIG.receiverId,
      call_type: 'video'
    });
    
    console.log('✅ Video Call API Response:', response);
    return response;
  } catch (error) {
    console.error('❌ Video Call API Error:', error);
    return null;
  }
}

// Test call balance API
async function testCallBalanceAPI() {
  console.log('🧪 Testing Call Balance API...');
  
  try {
    const response = await ApiService.get(`/api/voice-call/balance/${TEST_CONFIG.callerId}`);
    
    console.log('✅ Call Balance API Response:', response);
    return response;
  } catch (error) {
    console.error('❌ Call Balance API Error:', error);
    return null;
  }
}

// Test call history API
async function testCallHistoryAPI() {
  console.log('🧪 Testing Call History API...');
  
  try {
    const response = await ApiService.get(`/api/voice-call/history/${TEST_CONFIG.callerId}`);
    
    console.log('✅ Call History API Response:', response);
    return response;
  } catch (error) {
    console.error('❌ Call History API Error:', error);
    return null;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting API Tests...\n');
  
  // Test voice call
  const voiceCallResult = await testVoiceCallAPI();
  console.log('\n');
  
  // Test video call
  const videoCallResult = await testVideoCallAPI();
  console.log('\n');
  
  // Test balance
  const balanceResult = await testCallBalanceAPI();
  console.log('\n');
  
  // Test history
  const historyResult = await testCallHistoryAPI();
  console.log('\n');
  
  // Summary
  console.log('📊 Test Summary:');
  console.log(`Voice Call API: ${voiceCallResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Video Call API: ${videoCallResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Balance API: ${balanceResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`History API: ${historyResult ? '✅ PASS' : '❌ FAIL'}`);
  
  const totalTests = 4;
  const passedTests = [voiceCallResult, videoCallResult, balanceResult, historyResult].filter(Boolean).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All APIs are working correctly!');
  } else {
    console.log('⚠️ Some APIs need attention');
  }
}

// Export for use in other files
module.exports = {
  testVoiceCallAPI,
  testVideoCallAPI,
  testCallBalanceAPI,
  testCallHistoryAPI,
  runAllTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
} 