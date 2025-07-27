import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';
import AdRotationService from '../services/AdRotationService';

// Test Ad Unit ID (for development/testing)
const TEST_REWARDED_AD_UNIT_ID = TestIds.REWARDED; // Official Google test ID for rewarded ads

// Get ad unit ID from rotation service
const getRewardedAdUnitId = () => {
  if (__DEV__) {
    return TEST_REWARDED_AD_UNIT_ID;
  }
  return AdRotationService.getInstance().getAdUnitId('rewarded');
};

let rewardedAd: RewardedAd | null = null;

export const useRewardedAd = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reward, setReward] = useState<any>(null);
  const [hasEarnedReward, setHasEarnedReward] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAdUnitId, setCurrentAdUnitId] = useState(getRewardedAdUnitId());

  useEffect(() => {
    console.log('RewardedAdEventType available values:', Object.keys(RewardedAdEventType));
    
    // Create rewarded ad instance
    rewardedAd = RewardedAd.createForAdRequest(currentAdUnitId, {
      requestNonPersonalizedAdsOnly: false, // Allow personalized ads for better fill rates
      keywords: ['entertainment', 'social', 'communication', 'lifestyle'],
      contentUrl: 'https://adtip.app',
    });

    const onLoaded = () => {
      console.log('Rewarded ad loaded successfully');
      setIsLoaded(true);
      setIsLoading(false);
      setError(null);
    };

    const onEarnedReward = (rewardData: any) => {
      console.log('User earned reward:', rewardData);
      setReward(rewardData);
      setHasEarnedReward(true);
      // Reset for next ad after showing is complete
      setTimeout(() => {
        setIsLoaded(false);
        setHasEarnedReward(false);
        setReward(null);
        // Preload the next ad
        loadAd();
      }, 1000);
    };

    // Try to use the event types, with fallback to string literals if needed
    let unsubscribeLoaded: (() => void) | null = null;
    let unsubscribeEarnedReward: (() => void) | null = null;

    try {
      unsubscribeLoaded = rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, onLoaded);
      unsubscribeEarnedReward = rewardedAd.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        onEarnedReward
      );
    } catch (err) {
      console.error('Error setting up ad event listeners:', err);
      // Fallback to string literals if enum values don't work
      try {
        unsubscribeLoaded = rewardedAd.addAdEventListener('loaded' as any, onLoaded);
        unsubscribeEarnedReward = rewardedAd.addAdEventListener('earned_reward' as any, onEarnedReward);
      } catch (fallbackErr) {
        console.error('Fallback ad event listeners also failed:', fallbackErr);
      }
    }

    // Load the initial ad
    loadAd();

    return () => {
      if (unsubscribeLoaded) unsubscribeLoaded();
      if (unsubscribeEarnedReward) unsubscribeEarnedReward();
    };
  }, [currentAdUnitId]); // Re-create ad when ad unit changes

  const loadAd = () => {
    if (rewardedAd && !isLoading && !isLoaded) {
      console.log('Loading rewarded ad...');
      setIsLoading(true);
      setError(null);
      rewardedAd.load();
    }
  };

  const showAd = () => {
    if (isLoaded && rewardedAd) {
      console.log('Showing rewarded ad');
      rewardedAd.show();
    } else {
      console.log('Rewarded ad not ready to show');
      // Try to load if not already loading
      if (!isLoading) {
        loadAd();
      }
    }
  };

  return {
    isLoaded,
    isLoading,
    showAd,
    loadAd,
    reward,
    hasEarnedReward,
    error,
  };
};

export default useRewardedAd; 