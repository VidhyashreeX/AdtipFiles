// src/services/RewardService.ts
import { Alert } from 'react-native';
import ApiService from './ApiService';
import { ENDPOINTS } from '../constants/api';
// Commented out PubScale integration - June 2, 2025
// import PubScaleService from './PubScaleService';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import AnalyticsService from './AnalyticsService';

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
export default class RewardService {  /**
   * Initialize the reward service
   */  static async init() {
    try {
      // Get user ID from async storage
      const userId = await AsyncStorage.getItem('userId') || 'anonymous_user';
      
      // Commented out PubScale integration - June 2, 2025
      /*
      // We don't initialize PubScale here anymore, as it's done in App.tsx
      // to ensure it happens only once at app startup
      // Set up reward listener if not already set
      PubScaleService.setRewardListener((reward) => {
        console.log('Reward received in RewardService:', reward);
        
        // Example reward object:
        // {
        //   amount: 100,
        //   currency: 'Coins'
        // }
        
        // Track the reward in our analytics system
        AnalyticsService.trackOfferwallEvent('reward_processed', {
          amount: reward.amount,
          currency: reward.currency,
          source: 'pubscale_offerwall'
        });
        
        // Call API to update user's balance
        ApiService.post(ENDPOINTS.REWARDS.TRACK_REWARD, {
          placementName: 'offerwall',
          rewardAmount: reward.amount,
          rewardType: reward.currency
        }).then(() => {
          // Track successful reward submission
          AnalyticsService.trackOfferwallEvent('reward_tracked_success', {
            amount: reward.amount,
            currency: reward.currency
          });
        }).catch(err => {
          console.error('Failed to track reward:', err);
          
          // Track failed reward submission
          AnalyticsService.trackOfferwallEvent('reward_tracked_error', {
            amount: reward.amount,
            currency: reward.currency,
            error: err.message || 'Unknown error'
          });
        });
      });
      */
      
      return true;
    } catch (error) {
      console.error('Failed to initialize PubScale in RewardService:', error);
      return false;
    }
  }
  }
  /**
   * Show rewarded ad and give user reward on completion
   * @param placementName - The placement identifier (e.g. 'video_watch', 'daily_bonus')
   * @param rewardAmount - Amount of coins to reward
   * @param rewardType - Type of reward ('coins', 'points', etc.)
   * @returns Promise with reward result
   */  static async showRewardedAd(
    placementName: string,
    rewardAmount: number = 5,
    rewardType: string = 'coins'
  ): Promise<RewardedResult> {
    try {
      // Commented out PubScale integration - June 2, 2025
      /*
      // For offerwall placement, show the PubScale offerwall
      if (placementName === 'offerwall') {
        await PubScaleService.showOfferwall();
        return {
          success: true
        };
      }
      */
      
      // For all placements, show an error for now
      // This would be replaced with proper video ad implementation
      Alert.alert(
        'Ad Not Available',
        'Rewarded ad is not available at the moment. Please try again later.'
      );
      return {
        success: false,
        error: 'Ad not available'
      };
    } catch (error) {
      console.error('Error showing rewarded ad:', error);
      Alert.alert(
        'Error',
        'Failed to show ad. Please try again later.'
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  /**
   * Show the PubScale offerwall
   * @returns Promise resolving when the offerwall is closed
   */
  static async showOfferwall(): Promise<void> {
    // Commented out PubScale integration - June 2, 2025
    /*
    try {
      // Track offerwall show attempt in RewardService
      AnalyticsService.trackOfferwallEvent('show_attempt_from_reward_service');
      
      // Show the PubScale offerwall
      await PubScaleService.showOfferwall();
      
      // Track successful show
      AnalyticsService.trackOfferwallEvent('show_success_from_reward_service');
    } catch (error) {
      console.error('Error showing offerwall:', error);
      
      // Track error
      AnalyticsService.trackOfferwallEvent('show_error_from_reward_service', {
        error: error.message || 'Unknown error'
      });
      
      Alert.alert(
        'Error',
        'Failed to show offerwall. Please try again later.'
      );
    }
    */
    
    // Temporary notice while PubScale is disabled
    Alert.alert(
      'Feature Disabled',
      'The offerwall feature is currently disabled. Please check back later.'
    );
    return Promise.resolve();
  }
              .then(() => {
                resolve({
                  success: true,
                  amount: rewardAmount,
                  type: rewardType
                });
              })
              .catch(err => {
                console.error('Error tracking reward:', err);
                reject(err);
              });
          } else {
            resolve({
              success: false,
              amount: 0,
              type: rewardType
            });
          }
        },
        onError: (error: string) => {
          console.error('Rewarded ad error:', error);
          reject(new Error(error));
        }
      });
    });
  }

  /**
   * Track watch time for a specific video
   * @param videoId - The ID of the video being watched
   * @param watchTimeSeconds - How long the user watched (in seconds)
   * @returns Promise that resolves when tracking is complete
   */
  static async trackWatchTime(videoId: string, watchTimeSeconds: number): Promise<void> {
    return ApiService.post(ENDPOINTS.TRACK_WATCH_TIME, {
      videoId,
      watchTimeSeconds
    });
  }

  /**
   * Get user's current reward balance
   * @returns Promise with user's reward balance
   */
  static async getRewardBalance(): Promise<{ coins: number }> {
    return ApiService.get(ENDPOINTS.GET_REWARD_BALANCE);
  }

  /**
   * Check if user can claim daily reward
   * @returns Promise with daily reward status
   */
  static async canClaimDailyReward(): Promise<{ canClaim: boolean, nextClaimTime?: string }> {
    return ApiService.get(ENDPOINTS.CHECK_DAILY_REWARD);
  }

  /**
   * Claim daily reward
   * @returns Promise with claim result
   */
  static async claimDailyReward(): Promise<{ success: boolean, amount: number }> {
    try {
      const result = await this.showRewardedAd('daily_reward', 10);
      if (result.success) {
        return { success: true, amount: result.amount };
      }
      return { success: false, amount: 0 };
    } catch (error) {
      console.error('Error claiming daily reward:', error);
      return { success: false, amount: 0 };
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
    limit: number = 20
  ): Promise<{ data: any[], totalPages: number }> {
    return ApiService.get(`${ENDPOINTS.GET_REWARD_HISTORY}?page=${page}&limit=${limit}`);
  }
}

// Types for reward service
export interface RewardedResult {
  success: boolean;
  amount: number;
  type: string;
}
