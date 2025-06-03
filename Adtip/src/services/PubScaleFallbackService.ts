// src/services/PubScaleFallbackService.ts
import {PUBSCALE_APP_ID, PUBSCALE_BASE_URL} from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Alert, Linking} from 'react-native';
import AnalyticsService from './AnalyticsService';

interface PubScaleReward {
  amount: number;
  currency: string;
}

/**
 * This is a fallback implementation of PubScale service that doesn't rely on native modules
 * In a real implementation, this would redirect to a web-based offerwall or show a message
 * about installing the PubScale app
 */
class PubScaleFallbackService {
  private isInitialized: boolean = false;
  private userId: string | null = null;
  private rewardListener: ((reward: PubScaleReward) => void) | null = null;

  /**
   * Initialize the service with a user ID
   * @param userId The user ID to use for tracking rewards
   */ async initialize(userId: string): Promise<void> {
    console.log('[PubScaleFallback] Initializing with userId:', userId);

    // Track fallback initialization
    AnalyticsService.trackOfferwallEvent('fallback_initialization', {
      userId,
    });

    this.userId = userId;

    // Store the user ID for later use
    await AsyncStorage.setItem('pubscale_user_id', userId);

    this.isInitialized = true;

    return Promise.resolve();
  }

  /**
   * Show the offerwall to the user
   */ async showOfferwall(): Promise<void> {
    console.log('[PubScaleFallback] Showing offerwall');

    // Track fallback show attempt
    AnalyticsService.trackOfferwallEvent('fallback_show_attempt', {
      userId: this.userId || 'anonymous_user',
    });

    // In a real implementation, this would open a web-based offerwall
    // For now, we'll just show a mock alert
    return new Promise(resolve => {
      Alert.alert(
        'PubScale Offerwall',
        'The native PubScale SDK is not available. Would you like to visit the web offerwall instead?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              console.log('[PubScaleFallback] User canceled');

              // Track cancellation
              AnalyticsService.trackOfferwallEvent('fallback_cancelled', {
                userId: this.userId || 'anonymous_user',
              });

              resolve();
            },
          },
          {
            text: 'Open Web Offerwall',
            onPress: () => {
              console.log('[PubScaleFallback] Opening web offerwall');

              // Track web offerwall visit
              AnalyticsService.trackOfferwallEvent('fallback_web_visit', {
                userId: this.userId || 'anonymous_user',
              });

              // Open a mock web offerwall
              const fallbackUrl = `${PUBSCALE_BASE_URL || 'https://offerwall.pubscale.com'}/?app_id=${PUBSCALE_APP_ID}&user_id=${this.userId}`;
              Linking.openURL(fallbackUrl).catch(err => {
                console.error('[PubScaleFallback] Error opening URL:', err);

                // Track error
                AnalyticsService.trackOfferwallEvent('fallback_web_error', {
                  userId: this.userId || 'anonymous_user',
                  error: err.message || 'Unknown error',
                  url: fallbackUrl,
                });
              });

              // Simulate receiving a reward after a delay
              setTimeout(() => {
                this.simulateReward();
              }, 5000);

              resolve();
            },
          },
        ],
      );
    });
  }

  /**
   * Set a listener for rewards
   * @param callback The function to call when a reward is received
   */
  setRewardListener(callback: (reward: PubScaleReward) => void): void {
    console.log('[PubScaleFallback] Setting reward listener');
    this.rewardListener = callback;
  }

  /**
   * Remove the reward listener
   */
  removeRewardListener(): void {
    console.log('[PubScaleFallback] Removing reward listener');
    this.rewardListener = null;
  }

  /**
   * Simulate receiving a reward (for testing)
   */ private simulateReward(): void {
    console.log('[PubScaleFallback] Simulating reward');

    const reward: PubScaleReward = {
      amount: Math.floor(Math.random() * 100) + 10,
      currency: 'Coins',
    };

    console.log('[PubScaleFallback] Simulated reward:', reward);

    // Track simulated reward
    AnalyticsService.trackOfferwallEvent('fallback_simulated_reward', {
      userId: this.userId || 'anonymous_user',
      amount: reward.amount,
      currency: reward.currency,
    });

    if (this.rewardListener) {
      this.rewardListener(reward);
    }
  }
}

export default new PubScaleFallbackService();
