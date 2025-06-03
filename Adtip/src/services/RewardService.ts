// src/services/RewardService.ts
import {Alert} from 'react-native';
import ApiService from './ApiService';
import {ENDPOINTS} from '../constants/api';

// Define the reward result interface
interface RewardedResult {
  success: boolean;
  rewardAmount?: number;
  rewardType?: string;
  error?: string;
}

/**
 * RewardService - Handles watch & earn and reward functionality
 */
export default class RewardService {
  /**
   * Initialize the reward service
   */
  static async init() {
    // Add initialization logic here if needed in the future
    return true;
  }
  /**
   * Show rewarded ad and give user reward on completion
   * @returns Promise with reward result
   */
  static async showRewardedAd(): Promise<RewardedResult> {
    try {
      // For all placements, show an error for now
      // This would be replaced with proper video ad implementation
      Alert.alert(
        'Ad Not Available',
        'Rewarded ad is not available at the moment. Please try again later.',
      );
      return {
        success: false,
        error: 'Ad not available',
      };
    } catch (error) {
      console.error('Error showing rewarded ad:', error);
      Alert.alert('Error', 'Failed to show ad. Please try again later.');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Show the PubScale offerwall
   * @returns Promise resolving when the offerwall is closed
   */
  static async showOfferwall(): Promise<void> {
    // Temporary notice while PubScale is disabled
    Alert.alert(
      'Feature Disabled',
      'The offerwall feature is currently disabled. Please check back later.',
    );
    return Promise.resolve();
  }

  /**
   * Track watch time for a specific video
   * @param videoId - The ID of the video being watched
   * @param watchTimeSeconds - How long the user watched (in seconds)
   * @returns Promise that resolves when tracking is complete
   */
  static async trackWatchTime(
    videoId: string,
    watchTimeSeconds: number,
  ): Promise<void> {
    return ApiService.post(ENDPOINTS.TRACK_WATCH_TIME, {
      videoId,
      watchTimeSeconds,
    });
  }

  /**
   * Get user's current reward balance
   * @returns Promise with user's reward balance
   */
  static async getRewardBalance(): Promise<{coins: number}> {
    return ApiService.get(ENDPOINTS.GET_REWARD_BALANCE);
  }

  /**
   * Check if user can claim daily reward
   * @returns Promise with daily reward status
   */
  static async canClaimDailyReward(): Promise<{
    canClaim: boolean;
    nextClaimTime?: string;
  }> {
    return ApiService.get(ENDPOINTS.CHECK_DAILY_REWARD);
  }

  /**
   * Claim daily reward
   * @returns Promise with claim result
   */
  static async claimDailyReward(): Promise<{success: boolean; amount: number}> {
    try {
      const result = await this.showRewardedAd();
      if (result.success) {
        return {success: true, amount: result.rewardAmount || 10};
      }
      return {success: false, amount: 0};
    } catch (error) {
      console.error('Error claiming daily reward:', error);
      return {success: false, amount: 0};
    }
  }

  /**
   * Get user's reward history
   * @param page - Page number for pagination
   * @param limit - Items per page
   * @returns Promise with reward history
   */
  static async getRewardHistory(
    page: number = 1,
    limit: number = 20,
  ): Promise<{data: any[]; totalPages: number}> {
    return ApiService.get(
      `${ENDPOINTS.GET_REWARD_HISTORY}?page=${page}&limit=${limit}`,
    );
  }
}

// Export types for reward service
export type {RewardedResult};
