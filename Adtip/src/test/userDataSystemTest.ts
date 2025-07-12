// src/test/userDataSystemTest.ts
import ApiService from '../services/ApiService';
import UserDataStorageService from '../services/UserDataStorageService';
import UserDataErrorHandler from '../services/UserDataErrorHandler';
import { ComprehensiveUserData } from '../types/api';
import * as userDataUtils from '../utils/userDataUtils';

/**
 * Comprehensive test suite for the user data management system
 * Run this to verify all components are working correctly
 */

export class UserDataSystemTest {
  private static testUserId = 4586; // Use a test user ID

  /**
   * Run all tests
   */
  static async runAllTests(): Promise<void> {
    console.log('🧪 Starting User Data System Tests...');
    
    try {
      await this.testApiService();
      await this.testStorageService();
      await this.testErrorHandler();
      await this.testUtilityFunctions();
      await this.testIntegration();
      
      console.log('✅ All tests passed successfully!');
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    }
  }

  /**
   * Test API Service
   */
  static async testApiService(): Promise<void> {
    console.log('📡 Testing API Service...');
    
    try {
      const response = await ApiService.getUserData({ userid: this.testUserId });
      
      if (!response || !response.data) {
        throw new Error('API response is invalid');
      }
      
      if (!response.data.id || !response.data.name) {
        throw new Error('API response missing required fields');
      }
      
      console.log('✅ API Service test passed');
    } catch (error) {
      console.error('❌ API Service test failed:', error);
      throw error;
    }
  }

  /**
   * Test Storage Service
   */
  static async testStorageService(): Promise<void> {
    console.log('💾 Testing Storage Service...');
    
    try {
      // Create test data
      const testData: ComprehensiveUserData = {
        id: this.testUserId,
        name: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        emailId: 'test@example.com',
        gender: 'Male',
        dob: '01/01/1990',
        profile_image: null,
        message_id: null,
        mobile_number: '1234567890',
        otp: null,
        user_type: 2,
        profession: 'Developer',
        maternal_status: 'Single',
        address: 'Test Address',
        longitude: '0',
        latitude: '0',
        pincode: null,
        current_otp_verified: null,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        isOtpVerified: 1,
        isSaveUserDetails: 1,
        is_active: null,
        createdby: null,
        access_type: 2,
        online_status: 1,
        device_token: 'test_token',
        is_block: null,
        is_mute: null,
        referal_code: 'TEST123',
        referal_earnings: 100,
        referred_by: null,
        username: null,
        referred_count: 0,
        is_first_time: 0,
        bio: 'Test bio',
        premium_plan_id: 1,
        content_creator_plan_id: 0,
        is_available: 1,
        dnd: 0,
        premium: 1,
        country_code: '+1',
        country: 'Test Country',
        fcm_token: 'test_fcm_token',
        fcm_token_updation_date: new Date().toISOString(),
        platform: null,
        device_id: null,
        premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_premium: 1,
        content_creator_premium_status: 0,
        content_creator_premium_expires_at: null,
        otp_created_at: null,
        total_withdrawals: 5,
        last_withdrawal_date: null,
        withdrawal_count: 2,
      };

      // Test store
      await UserDataStorageService.storeUserData(this.testUserId, testData);
      
      // Test retrieve
      const retrievedData = await UserDataStorageService.getUserData(this.testUserId);
      if (!retrievedData || retrievedData.id !== this.testUserId) {
        throw new Error('Failed to retrieve stored data');
      }
      
      // Test validity check
      const isValid = await UserDataStorageService.isUserDataValid(this.testUserId);
      if (!isValid) {
        throw new Error('Stored data should be valid');
      }
      
      // Test cache info
      const cacheInfo = await UserDataStorageService.getCacheInfo(this.testUserId);
      if (!cacheInfo.hasData || !cacheInfo.isValid) {
        throw new Error('Cache info is incorrect');
      }
      
      // Test update fields
      await UserDataStorageService.updateUserDataFields(this.testUserId, {
        bio: 'Updated bio',
        referal_earnings: 150,
      });
      
      const updatedData = await UserDataStorageService.getUserData(this.testUserId);
      if (updatedData?.bio !== 'Updated bio' || updatedData?.referal_earnings !== 150) {
        throw new Error('Failed to update fields');
      }
      
      // Clean up
      await UserDataStorageService.clearUserData(this.testUserId);
      
      console.log('✅ Storage Service test passed');
    } catch (error) {
      console.error('❌ Storage Service test failed:', error);
      throw error;
    }
  }

  /**
   * Test Error Handler
   */
  static async testErrorHandler(): Promise<void> {
    console.log('🛡️ Testing Error Handler...');
    
    try {
      // Test error classification
      const networkError = { code: 'NETWORK_ERROR' };
      const authError = { response: { status: 401 } };
      const serverError = { response: { status: 500 } };
      
      if (UserDataErrorHandler.classifyError(networkError) !== 'NETWORK_ERROR') {
        throw new Error('Failed to classify network error');
      }
      
      if (UserDataErrorHandler.classifyError(authError) !== 'AUTH_ERROR') {
        throw new Error('Failed to classify auth error');
      }
      
      if (UserDataErrorHandler.classifyError(serverError) !== 'SERVER_ERROR') {
        throw new Error('Failed to classify server error');
      }
      
      // Test retry logic
      if (UserDataErrorHandler.isRetryable(authError, 0)) {
        throw new Error('Auth errors should not be retryable');
      }
      
      if (!UserDataErrorHandler.isRetryable(networkError, 0)) {
        throw new Error('Network errors should be retryable');
      }
      
      // Test retry delay calculation
      const delay1 = UserDataErrorHandler.calculateRetryDelay(0);
      const delay2 = UserDataErrorHandler.calculateRetryDelay(1);
      
      if (delay2 <= delay1) {
        throw new Error('Retry delay should increase exponentially');
      }
      
      console.log('✅ Error Handler test passed');
    } catch (error) {
      console.error('❌ Error Handler test failed:', error);
      throw error;
    }
  }

  /**
   * Test Utility Functions
   */
  static async testUtilityFunctions(): Promise<void> {
    console.log('🔧 Testing Utility Functions...');
    
    try {
      // Create test user data
      const testUser: ComprehensiveUserData = {
        id: this.testUserId,
        name: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
        emailId: 'john@example.com',
        is_premium: 1,
        premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        referal_earnings: 250.75,
        mobile_number: '1234567890',
        country_code: '+1',
        online_status: 1,
        is_available: 1,
        dnd: 0,
        address: 'New York, USA',
        total_withdrawals: 3,
        is_first_time: 0,
        isSaveUserDetails: 1,
        // ... other required fields with default values
      } as ComprehensiveUserData;

      // Test premium status
      if (!userDataUtils.isPremiumUser(testUser)) {
        throw new Error('Should detect premium user');
      }
      
      // Test display name
      const displayName = userDataUtils.getUserDisplayName(testUser);
      if (displayName !== 'John Doe') {
        throw new Error('Display name should be "John Doe"');
      }
      
      // Test wallet balance formatting
      const formattedBalance = userDataUtils.formatWalletBalance(testUser);
      if (formattedBalance !== '₹250.75') {
        throw new Error('Wallet balance formatting failed');
      }
      
      // Test user availability
      if (!userDataUtils.isUserAvailable(testUser)) {
        throw new Error('User should be available');
      }
      
      // Test data validation
      const validation = userDataUtils.validateUserData(testUser);
      if (!validation.isValid) {
        throw new Error('Test user data should be valid');
      }
      
      // Test user summary
      const summary = userDataUtils.createUserSummary(testUser);
      if (summary.displayName !== 'John Doe' || !summary.isPremium) {
        throw new Error('User summary is incorrect');
      }
      
      console.log('✅ Utility Functions test passed');
    } catch (error) {
      console.error('❌ Utility Functions test failed:', error);
      throw error;
    }
  }

  /**
   * Test Integration
   */
  static async testIntegration(): Promise<void> {
    console.log('🔗 Testing Integration...');
    
    try {
      // This would test the full flow from API to storage to utilities
      // In a real app, this would involve the React hooks and context
      
      console.log('✅ Integration test passed (placeholder)');
    } catch (error) {
      console.error('❌ Integration test failed:', error);
      throw error;
    }
  }

  /**
   * Performance test
   */
  static async testPerformance(): Promise<void> {
    console.log('⚡ Testing Performance...');
    
    try {
      const iterations = 100;
      const startTime = Date.now();
      
      // Test storage performance
      for (let i = 0; i < iterations; i++) {
        const testData = { id: i, name: `User ${i}` } as ComprehensiveUserData;
        await UserDataStorageService.storeUserData(i, testData);
        await UserDataStorageService.getUserData(i);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✅ Performance test completed: ${iterations} operations in ${duration}ms`);
      
      // Clean up
      for (let i = 0; i < iterations; i++) {
        await UserDataStorageService.clearUserData(i);
      }
    } catch (error) {
      console.error('❌ Performance test failed:', error);
      throw error;
    }
  }
}

// Export for easy testing
export default UserDataSystemTest;
