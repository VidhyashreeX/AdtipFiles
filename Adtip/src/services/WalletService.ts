// src/services/WalletService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './ApiService';

/**
 * Wallet Service for managing wallet-related operations
 */
class WalletService {
  /**
   * Get the current wallet balance for a user
   * @param userId - The user ID
   * @returns Promise with wallet balance as string
   */
  static async getWalletBalance(userId: string | number): Promise<string> {
    try {
      console.log(`WalletService: Fetching balance for user ID: ${userId}`);

      // Ensure userId is properly formatted to avoid API errors
      const formattedUserId = userId.toString().trim(); // Check for token and log authentication status
      let token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        token = await AsyncStorage.getItem('@auth_token'); // Fallback to old key format
      }
      console.log('WalletService: Auth token available:', !!token);

      if (!token) {
        console.warn(
          'WalletService: No auth token found in storage, API call may fail',
        );
      }

      // Make API call with properly formatted userId
      const response = await ApiService.getWalletBalance(formattedUserId);
      console.log('WalletService: API response:', JSON.stringify(response));

      // Store the balance in AsyncStorage for quick access
      // The API returns { status: 200, message: "Fetched latest balance successfully.", availableBalance: "204.59" }
      // In this specific API, availableBalance is directly on the response object, not in a data property
      if (response && response.availableBalance) {
        await AsyncStorage.setItem(
          '@wallet_balance',
          response.availableBalance,
        );
        return response.availableBalance;
      }

      // If no valid response, try to get from cache
      const cachedBalance =
        (await AsyncStorage.getItem('@wallet_balance')) || '0.00';
      return cachedBalance;
    } catch (error: any) {
      console.error('Error getting wallet balance:', error);

      // Log more detailed error info to help with debugging
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(
          'API error response:',
          error.response.status,
          error.response.data,
        );
      } else if (error.request) {
        // The request was made but no response was received
        console.error('API no response error. Network issue?');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('API request setup error:', error.message);
      }

      // Return cached balance if available, or default to '0.00'
      const cachedBalance =
        (await AsyncStorage.getItem('@wallet_balance')) || '0.00';
      return cachedBalance;
    }
  }

  /**
   * Get transaction history for a user
   * @param userId - The user ID
   * @returns Promise with transactions array
   */
  static async getTransactionHistory(userId: string | number): Promise<any[]> {
    try {
      const passbook = await ApiService.getAdPassbook(userId);
      return passbook?.data || [];
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  /**
   * Get user's channel data
   * @param userId - The user ID
   * @returns Promise with channel data
   */
  static async getChannelData(userId: string | number): Promise<any> {
    try {
      const channelData = await ApiService.getChannelByUserId(userId);
      return channelData;
    } catch (error) {
      console.error('Error getting channel data:', error);
      return null;
    }
  }

  /**
   * Get premium status for a user
   * @param userId - The user ID
   * @returns Promise with premium status
   */
  static async checkPremiumStatus(userId: string | number): Promise<{
    isPremium: boolean;
    planId: number | null;
    endTime: string | null;
  }> {
    try {
      const premiumData = await ApiService.checkPremium(userId);

      return {
        isPremium: !premiumData.is_premium_expired,
        planId: premiumData.plan_id,
        endTime: premiumData.end_time,
      };
    } catch (error) {
      console.error('Error checking premium status:', error);
      return {
        isPremium: false,
        planId: null,
        endTime: null,
      };
    }
  }
}

export default WalletService;
