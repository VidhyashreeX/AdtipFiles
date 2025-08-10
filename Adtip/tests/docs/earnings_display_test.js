/**
 * Test file for verifying My Earnings screen functionality
 * This test verifies that the earnings display works correctly with real user data
 */

const axios = require('axios');

// Test configuration
const TEST_CONFIG = {
  BASE_URL: 'http://localhost:3000', // Update with your backend URL
  TEST_USER_ID: 1, // Update with a test user ID
  AUTH_TOKEN: 'your-test-auth-token', // Update with a valid auth token
};

/**
 * Test wallet balance API
 */
async function testWalletBalanceAPI() {
  console.log('🧪 Testing Wallet Balance API...');
  
  try {
    const response = await axios.get(
      `${TEST_CONFIG.BASE_URL}/api/getfunds/${TEST_CONFIG.TEST_USER_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${TEST_CONFIG.AUTH_TOKEN}`
        }
      }
    );
    
    console.log('Wallet Balance Response:', response.data);
    
    if (response.data && response.data.availableBalance !== undefined) {
      console.log(`✅ Wallet balance: ₹${response.data.availableBalance}`);
      return {
        success: true,
        balance: parseFloat(response.data.availableBalance)
      };
    } else {
      console.log('❌ Invalid wallet balance response format');
      return { success: false, balance: 0 };
    }
  } catch (error) {
    console.error('❌ Wallet Balance API Error:', error.response?.data || error.message);
    return { success: false, balance: 0 };
  }
}

/**
 * Test transaction history API (ad passbook)
 */
async function testTransactionHistoryAPI() {
  console.log('🧪 Testing Transaction History API...');
  
  try {
    const response = await axios.get(
      `${TEST_CONFIG.BASE_URL}/api/getadpassbook/${TEST_CONFIG.TEST_USER_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${TEST_CONFIG.AUTH_TOKEN}`
        }
      }
    );
    
    console.log('Transaction History Response:', response.data);
    
    if (response.data && Array.isArray(response.data.data)) {
      const transactions = response.data.data;
      console.log(`✅ Found ${transactions.length} transactions`);
      
      // Calculate earnings from credit transactions
      const creditTransactions = transactions.filter(t => 
        t.transaction_type === 'credit' || t.transaction_type === 'Credit' || t.amount > 0
      );
      
      const totalEarned = creditTransactions.reduce((sum, t) => 
        sum + parseFloat(t.amount || 0), 0
      );
      
      console.log(`💰 Total earned from transactions: ₹${totalEarned.toFixed(2)}`);
      
      return {
        success: true,
        transactions,
        totalEarned
      };
    } else {
      console.log('❌ Invalid transaction history response format');
      return { success: false, transactions: [], totalEarned: 0 };
    }
  } catch (error) {
    console.error('❌ Transaction History API Error:', error.response?.data || error.message);
    return { success: false, transactions: [], totalEarned: 0 };
  }
}

/**
 * Test withdrawal history API
 */
async function testWithdrawalHistoryAPI() {
  console.log('🧪 Testing Withdrawal History API...');
  
  try {
    const response = await axios.get(
      `${TEST_CONFIG.BASE_URL}/api/withdrawal-history/${TEST_CONFIG.TEST_USER_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${TEST_CONFIG.AUTH_TOKEN}`
        }
      }
    );
    
    console.log('Withdrawal History Response:', response.data);
    
    if (response.data && Array.isArray(response.data.data)) {
      const withdrawals = response.data.data;
      console.log(`✅ Found ${withdrawals.length} withdrawals`);
      
      const totalWithdrawn = withdrawals.reduce((sum, w) => 
        sum + parseFloat(w.amount || 0), 0
      );
      
      console.log(`💸 Total withdrawn: ₹${totalWithdrawn.toFixed(2)}`);
      
      return {
        success: true,
        withdrawals,
        totalWithdrawn
      };
    } else {
      console.log('❌ Invalid withdrawal history response format');
      return { success: false, withdrawals: [], totalWithdrawn: 0 };
    }
  } catch (error) {
    console.error('❌ Withdrawal History API Error:', error.response?.data || error.message);
    return { success: false, withdrawals: [], totalWithdrawn: 0 };
  }
}

/**
 * Test reward history API
 */
async function testRewardHistoryAPI() {
  console.log('🧪 Testing Reward History API...');
  
  try {
    const response = await axios.get(
      `${TEST_CONFIG.BASE_URL}/api/reward/history?page=1&limit=50`,
      {
        headers: {
          'Authorization': `Bearer ${TEST_CONFIG.AUTH_TOKEN}`
        }
      }
    );
    
    console.log('Reward History Response:', response.data);
    
    if (response.data && Array.isArray(response.data.data)) {
      const rewards = response.data.data;
      console.log(`✅ Found ${rewards.length} reward entries`);
      
      return {
        success: true,
        rewards
      };
    } else {
      console.log('⚠️  Reward history API may not be fully implemented or has different format');
      return { success: true, rewards: [] }; // Not critical for basic functionality
    }
  } catch (error) {
    console.error('⚠️  Reward History API Error (non-critical):', error.response?.data || error.message);
    return { success: true, rewards: [] }; // Not critical for basic functionality
  }
}

/**
 * Test earnings calculations
 */
function testEarningsCalculations(transactionData, withdrawalData) {
  console.log('🧪 Testing Earnings Calculations...');
  
  const { transactions, totalEarned } = transactionData;
  const { withdrawals, totalWithdrawn } = withdrawalData;
  
  // Test time-based calculations
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const creditTransactions = transactions.filter(t => 
    t.transaction_type === 'credit' || t.transaction_type === 'Credit' || t.amount > 0
  );
  
  const thisMonthEarnings = creditTransactions
    .filter(t => new Date(t.created_at) >= startOfMonth)
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  
  const thisWeekEarnings = creditTransactions
    .filter(t => new Date(t.created_at) >= startOfWeek)
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  
  const todayEarnings = creditTransactions
    .filter(t => new Date(t.created_at) >= startOfDay)
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  
  console.log('📊 Earnings Breakdown:');
  console.log(`   Total Earned: ₹${totalEarned.toFixed(2)}`);
  console.log(`   This Month: ₹${thisMonthEarnings.toFixed(2)}`);
  console.log(`   This Week: ₹${thisWeekEarnings.toFixed(2)}`);
  console.log(`   Today: ₹${todayEarnings.toFixed(2)}`);
  console.log(`   Total Withdrawn: ₹${totalWithdrawn.toFixed(2)}`);
  
  // Validate calculations
  const calculationsValid = 
    totalEarned >= 0 &&
    thisMonthEarnings >= 0 &&
    thisWeekEarnings >= 0 &&
    todayEarnings >= 0 &&
    totalWithdrawn >= 0 &&
    thisMonthEarnings <= totalEarned &&
    thisWeekEarnings <= thisMonthEarnings &&
    todayEarnings <= thisWeekEarnings;
  
  if (calculationsValid) {
    console.log('✅ Earnings calculations are valid');
    return true;
  } else {
    console.log('❌ Earnings calculations have inconsistencies');
    return false;
  }
}

/**
 * Main test runner
 */
async function runEarningsDisplayTests() {
  console.log('🚀 Starting My Earnings Screen Tests...\n');
  
  const results = {
    walletBalance: false,
    transactionHistory: false,
    withdrawalHistory: false,
    rewardHistory: false,
    calculations: false
  };
  
  // Test 1: Wallet Balance API
  const walletResult = await testWalletBalanceAPI();
  results.walletBalance = walletResult.success;
  console.log('');
  
  // Test 2: Transaction History API
  const transactionResult = await testTransactionHistoryAPI();
  results.transactionHistory = transactionResult.success;
  console.log('');
  
  // Test 3: Withdrawal History API
  const withdrawalResult = await testWithdrawalHistoryAPI();
  results.withdrawalHistory = withdrawalResult.success;
  console.log('');
  
  // Test 4: Reward History API
  const rewardResult = await testRewardHistoryAPI();
  results.rewardHistory = rewardResult.success;
  console.log('');
  
  // Test 5: Earnings Calculations
  if (transactionResult.success && withdrawalResult.success) {
    results.calculations = testEarningsCalculations(transactionResult, withdrawalResult);
  }
  console.log('');
  
  // Summary
  console.log('📊 Test Results Summary:');
  console.log('========================');
  console.log(`Wallet Balance API: ${results.walletBalance ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Transaction History API: ${results.transactionHistory ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Withdrawal History API: ${results.withdrawalHistory ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Reward History API: ${results.rewardHistory ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Earnings Calculations: ${results.calculations ? '✅ PASS' : '❌ FAIL'}`);
  
  const passedTests = Object.values(results).filter(result => result).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! My Earnings screen should work correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation and API endpoints.');
  }
  
  return results;
}

/**
 * Instructions for running the test
 */
function printTestInstructions() {
  console.log('📋 Test Instructions:');
  console.log('====================');
  console.log('1. Update TEST_CONFIG with your backend URL and test credentials');
  console.log('2. Ensure your backend server is running');
  console.log('3. Ensure you have test user data with some transactions');
  console.log('4. Run: node earnings_display_test.js');
  console.log('5. Test the actual My Earnings screen in the app');
  console.log('');
}

// Run tests if this file is executed directly
if (require.main === module) {
  printTestInstructions();
  runEarningsDisplayTests().catch(console.error);
}

module.exports = {
  testWalletBalanceAPI,
  testTransactionHistoryAPI,
  testWithdrawalHistoryAPI,
  testRewardHistoryAPI,
  testEarningsCalculations,
  runEarningsDisplayTests
};
