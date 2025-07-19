import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';
import AdRotationService from '../services/AdRotationService';

// Test Ad Unit ID (for development/testing)
const TEST_REWARDED_AD_UNIT_ID = TestIds.REWARDED;

// Get ad unit ID from rotation service for production
const getRewardedAdUnitId = () => {
  if (__DEV__) {
    return TEST_REWARDED_AD_UNIT_ID;
  }
  return AdRotationService.getInstance().getAdUnitId('rewarded');
};

export const useSimpleRewardedAd = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasEarnedReward, setHasEarnedReward] = useState(false);
  const [reward, setReward] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentAdUnitId, setCurrentAdUnitId] = useState(getRewardedAdUnitId());
  const [retryCount, setRetryCount] = useState(0);

  const [rewardedAd, setRewardedAd] = useState<RewardedAd | null>(null);

  useEffect(() => {
    // Create rewarded ad instance with current ad unit ID
    const ad = RewardedAd.createForAdRequest(currentAdUnitId, {
      requestNonPersonalizedAdsOnly: true,
      keywords: ['entertainment', 'gaming', 'rewards', 'coins'],
    });

    // Set up event listeners
    const onLoaded = () => {
      console.log('✅ [SimpleRewardedAd] Rewarded ad loaded successfully');
      setIsLoaded(true);
      setIsLoading(false);
      setError(null);
      setRetryCount(0);
    };

    const onEarnedReward = (rewardData: any) => {
      console.log('🎁 [SimpleRewardedAd] User earned reward:', rewardData);
      setReward(rewardData);
      setHasEarnedReward(true);

      // Reset for next ad after a delay
      setTimeout(() => {
        setIsLoaded(false);
        setHasEarnedReward(false);
        setReward(null);
        // Preload the next ad
        loadAd(ad);
      }, 1000);
    };

    const onFailedToLoad = (error: any) => {
      console.log('❌ [SimpleRewardedAd] Failed to load:', error);
      setIsLoading(false);
      setError(error.message || 'Failed to load ad');

      // Try next ad network if available
      if (retryCount < 2 && !__DEV__) {
        console.log('🔄 [SimpleRewardedAd] Trying next ad network...');
        const nextAdUnitId = AdRotationService.getInstance().getNextAdUnitId('rewarded');
        setCurrentAdUnitId(nextAdUnitId);
        setRetryCount(prev => prev + 1);
      }
    };

    const onClosed = () => {
      console.log('🚪 [SimpleRewardedAd] Ad closed');
      setIsLoaded(false);
      // Preload next ad
      loadAd(ad);
    };

    // Subscribe to events
    const unsubscribeLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, onLoaded);
    const unsubscribeEarnedReward = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, onEarnedReward);
    const unsubscribeFailedToLoad = ad.addAdEventListener(RewardedAdEventType.FAILED_TO_LOAD, onFailedToLoad);
    const unsubscribeClosed = ad.addAdEventListener(RewardedAdEventType.CLOSED, onClosed);

    setRewardedAd(ad);

    // Load the initial ad
    loadAd(ad);

    return () => {
      // Cleanup event listeners
      if (unsubscribeLoaded) unsubscribeLoaded();
      if (unsubscribeEarnedReward) unsubscribeEarnedReward();
      if (unsubscribeFailedToLoad) unsubscribeFailedToLoad();
      if (unsubscribeClosed) unsubscribeClosed();
    };
  }, [currentAdUnitId]);

  const loadAd = (ad: RewardedAd) => {
    if (ad && !isLoading && !isLoaded) {
      console.log('🔄 [SimpleRewardedAd] Loading rewarded ad with unit ID:', currentAdUnitId);
      setIsLoading(true);
      setError(null);

      // Load the ad - events will handle the response
      ad.load();
    }
  };

  const showAd = () => {
    if (isLoaded && rewardedAd) {
      console.log('🎬 [SimpleRewardedAd] Showing rewarded ad');

      try {
        rewardedAd.show();
        console.log('✅ [SimpleRewardedAd] Ad shown successfully');
      } catch (error) {
        console.error('❌ [SimpleRewardedAd] Error showing ad:', error);
        setError('Failed to show ad');
      }
    } else {
      console.log('⚠️ [SimpleRewardedAd] Ad not ready to show (loaded:', isLoaded, ', loading:', isLoading, ')');

      // Try to load if not already loading
      if (!isLoading && rewardedAd) {
        console.log('🔄 [SimpleRewardedAd] Attempting to load ad...');
        loadAd(rewardedAd);
      }
    }
  };

  return {
    isLoaded,
    isLoading,
    showAd,
    reward,
    hasEarnedReward,
    error,
    loadAd: () => rewardedAd && loadAd(rewardedAd),
    currentNetwork: __DEV__ ? 'Test' : AdRotationService.getInstance().getCurrentNetworkName(),
  };
};

export default useSimpleRewardedAd; 