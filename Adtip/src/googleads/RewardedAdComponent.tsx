import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';

// Test Ad Unit ID (for development/testing)
const TEST_REWARDED_AD_UNIT_ID = TestIds.REWARDED; // Official Google test ID for rewarded ads
// For custom test ID, use a real ad unit ID, not the app ID:
// const TEST_REWARDED_AD_UNIT_ID = 'ca-app-pub-3940256099942544/5224354917'; // Google's test rewarded ad unit

// Production Ad Unit ID (for live app)
const PROD_REWARDED_AD_UNIT_ID =
  Platform.OS === 'android'
    ? '/22387492205,23292119919/com.adtip.app.adtip_app.Rewarded0.1750928989'
    : '/22387492205,23292119919/com.adtip.app.adtip_app.Rewarded0.1750928989';

// Switch between test and production ad unit IDs
const REWARDED_AD_UNIT_ID = __DEV__ ? TEST_REWARDED_AD_UNIT_ID : PROD_REWARDED_AD_UNIT_ID;

let rewardedAd: RewardedAd | null = null;

export const useRewardedAd = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reward, setReward] = useState<any>(null);
  const [hasEarnedReward, setHasEarnedReward] = useState(false);

  useEffect(() => {
    // Create rewarded ad instance
    rewardedAd = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
      keywords: ['entertainment', 'gaming', 'rewards', 'coins'],
    });

    const onLoaded = () => {
      console.log('Rewarded ad loaded successfully');
      setIsLoaded(true);
      setIsLoading(false);
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

    const unsubscribeLoaded = rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, onLoaded);
    const unsubscribeEarnedReward = rewardedAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      onEarnedReward
    );

    // Load the initial ad
    loadAd();

    return () => {
      unsubscribeLoaded();
      unsubscribeEarnedReward();
    };
  }, []);

  const loadAd = () => {
    if (rewardedAd && !isLoading && !isLoaded) {
      console.log('Loading rewarded ad...');
      setIsLoading(true);
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
  };
};

export default useRewardedAd; 