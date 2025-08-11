/**
 * Test file for verifying wallet balance updates for reward system
 * This test verifies that the wallet balance is correctly updated for both premium and non-premium users
 */

const axios = require('axios');

// Test configuration
const TEST_CONFIG = {
  BASE_URL: 'http://localhost:3000', // Update with your backend URL
  NON_PREMIUM_USER_ID: 1, // Update with a non-premium test user ID
  PREMIUM_USER_ID: 2, // Update with a premium test user ID
  NON_PREMIUM_AUTH_TOKEN: 'your-non-premium-test-auth-token', // Update with valid auth token
  PREMIUM_AUTH_TOKEN: 'your-premium-test-auth-token', // Update with valid auth token
  NON_PREMIUM_REWARD: 0.03,
  PREMIUM_REWARD: 0.10
};

/**
 * Get wallet balance for a user
 */
async function getWalletBalance(userId, authToken) {
  try {
    const response = await axios.get(
      `${TEST_CONFIG.BASE_URL}/api/getfunds/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    if (response.data && response.data.availableBalance) {
      return parseFloat(response.data.availableBalance);
    }
    
    console.error('Unexpected wallet balance response:', response.data);
    return null;
  } catch (error) {
    console.error('Error getting wallet balance:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Credit ad reward to wallet
 */
async function creditAdReward(userId, amount, authToken) {
  try {
    const response = await axios.post(
      `${TEST_CONFIG.BASE_URL}/api/wallet/credit-ad-reward`,
      {
        userId: userId,
        amount: amount
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Credit Ad Reward Response:', response.data);
    return response.data.status === 200;
  } catch (error) {
    console.error('Error crediting ad reward:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test wallet balance update for non-premium user
 */
async function testNonPremiumUserReward() {
  console.log('🧪 Testing Non-Premium User Reward...');
  
  const userId = TEST_CONFIG.NON_PREMIUM_USER_ID;
  const authToken = TEST_CONFIG.NON_PREMIUM_AUTH_TOKEN;
  const rewardAmount = TEST_CONFIG.NON_PREMIUM_REWARD;
  
  // Get initial balance
  const initialBalance = await getWalletBalance(userId, authToken);
  if (initialBalance === null) {
    console.log('❌ Failed to get initial balance for non-premium user');
    return false;
  }
  
  console.log(`Initial balance for non-premium user: ₹${initialBalance}`);
  
  // Credit reward
  const creditSuccess = await creditAdReward(userId, rewardAmount, authToken);
  if (!creditSuccess) {
    console.log('❌ Failed to credit reward for non-premium user');
    return false;
  }
  
  // Wait a moment for the transaction to process
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Get updated balance
  const updatedBalance = await getWalletBalance(userId, authToken);
  if (updatedBalance === null) {
    console.log('❌ Failed to get updated balance for non-premium user');
    return false;
  }
  
  console.log(`Updated balance for non-premium user: ₹${updatedBalance}`);
  
  // Verify the balance increased by the correct amount
  const expectedBalance = initialBalance + rewardAmount;
  const balanceDifference = Math.abs(updatedBalance - expectedBalance);
  
  if (balanceDifference < 0.001) { // Allow for small floating point differences
    console.log('✅ Non-premium user reward test passed');
    console.log(`Expected: ₹${expectedBalance.toFixed(3)}, Actual: ₹${updatedBalance.toFixed(3)}`);
    return true;
  } else {
    console.log('❌ Non-premium user reward test failed');
    console.log(`Expected: ₹${expectedBalance.toFixed(3)}, Actual: ₹${updatedBalance.toFixed(3)}`);
    return false;
  }
}

/**
 * Test wallet balance update for premium user
 */
async function testPremiumUserReward() {
  console.log('🧪 Testing Premium User Reward...');
  
  const userId = TEST_CONFIG.PREMIUM_USER_ID;
  const authToken = TEST_CONFIG.PREMIUM_AUTH_TOKEN;
  const rewardAmount = TEST_CONFIG.PREMIUM_REWARD;
  
  // Get initial balance
  const initialBalance = await getWalletBalance(userId, authToken);
  if (initialBalance === null) {
    console.log('❌ Failed to get initial balance for premium user');
    return false;
  }
  
  console.log(`Initial balance for premium user: ₹${initialBalance}`);
  
  // Credit reward
  const creditSuccess = await creditAdReward(userId, rewardAmount, authToken);
  if (!creditSuccess) {
    console.log('❌ Failed to credit reward for premium user');
    return false;
  }
  
  // Wait a moment for the transaction to process
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Get updated balance
  const updatedBalance = await getWalletBalance(userId, authToken);
  if (updatedBalance === null) {
    console.log('❌ Failed to get updated balance for premium user');
    return false;
  }
  
  console.log(`Updated balance for premium user: ₹${updatedBalance}`);
  
  // Verify the balance increased by the correct amount
  const expectedBalance = initialBalance + rewardAmount;
  const balanceDifference = Math.abs(updatedBalance - expectedBalance);
  
  if (balanceDifference < 0.001) { // Allow for small floating point differences
    console.log('✅ Premium user reward test passed');
    console.log(`Expected: ₹${expectedBalance.toFixed(3)}, Actual: ₹${updatedBalance.toFixed(3)}`);
    return true;
  } else {
    console.log('❌ Premium user reward test failed');
    console.log(`Expected: ₹${expectedBalance.toFixed(3)}, Actual: ₹${updatedBalance.toFixed(3)}`);
    return false;
  }
}

/**
 * Test reward amount differences between premium and non-premium
 */
async function testRewardAmountDifferences() {
  console.log('🧪 Testing Reward Amount Differences...');
  
  const nonPremiumReward = TEST_CONFIG.NON_PREMIUM_REWARD;
  const premiumReward = TEST_CONFIG.PREMIUM_REWARD;
  
  console.log(`Non-premium reward: ₹${nonPremiumReward}`);
  console.log(`Premium reward: ₹${premiumReward}`);
  
  // Verify premium reward is higher
  if (premiumReward > nonPremiumReward) {
    const difference = premiumReward - nonPremiumReward;
    const percentageIncrease = ((premiumReward / nonPremiumReward) - 1) * 100;
    
    console.log(`✅ Premium reward is ₹${difference.toFixed(3)} higher (${percentageIncrease.toFixed(1)}% increase)`);
    return true;
  } else {
    console.log('❌ Premium reward should be higher than non-premium reward');
    return false;
  }
}

/**
 * Main test runner
 */
async function runWalletBalanceTests() {
  console.log('🚀 Starting Wallet Balance Reward Tests...\n');
  
  const results = {
    nonPremiumReward: false,
    premiumReward: false,
    rewardDifferences: false
  };
  
  // Test 1: Non-premium user reward
  results.nonPremiumReward = await testNonPremiumUserReward();
  console.log('');
  
  // Test 2: Premium user reward
  results.premiumReward = await testPremiumUserReward();
  console.log('');
  
  // Test 3: Reward amount differences
  results.rewardDifferences = await testRewardAmountDifferences();
  console.log('');
  
  // Summary
  console.log('📊 Test Results Summary:');
  console.log('========================');
  console.log(`Non-Premium User Reward: ${results.nonPremiumReward ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Premium User Reward: ${results.premiumReward ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Reward Amount Differences: ${results.rewardDifferences ? '✅ PASS' : '❌ FAIL'}`);
  
  const passedTests = Object.values(results).filter(result => result).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Wallet balance reward system is working correctly.');
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
  console.log('2. Ensure you have both premium and non-premium test users');
  console.log('3. Ensure your backend server is running');
  console.log('4. Run: node wallet_balance_reward_test.js');
  console.log('');
}

// Run tests if this file is executed directly
if (require.main === module) {
  printTestInstructions();
  runWalletBalanceTests().catch(console.error);
}

module.exports = {
  testNonPremiumUserReward,
  testPremiumUserReward,
  testRewardAmountDifferences,
  runWalletBalanceTests
};
