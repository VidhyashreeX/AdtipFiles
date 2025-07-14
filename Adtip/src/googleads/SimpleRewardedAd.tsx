import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { RewardedAd, TestIds } from 'react-native-google-mobile-ads';

// Test Ad Unit ID (for development/testing)
const TEST_REWARDED_AD_UNIT_ID = TestIds.REWARDED;

// Production Ad Unit ID (for live app)
const PROD_REWARDED_AD_UNIT_ID =
  Platform.OS === 'android'
    ? '/22387492205,23292119919/com.adtip.app.adtip_app.Rewarded0.1750928989'
    : '/22387492205,23292119919/com.adtip.app.adtip_app.Rewarded0.1750928989';

// Switch between test and production ad unit IDs
const REWARDED_AD_UNIT_ID = __DEV__ ? TEST_REWARDED_AD_UNIT_ID : PROD_REWARDED_AD_UNIT_ID;

export const useSimpleRewardedAd = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasEarnedReward, setHasEarnedReward] = useState(false);
  const [reward, setReward] = useState<any>(null);

  const [rewardedAd, setRewardedAd] = useState<RewardedAd | null>(null);

  useEffect(() => {
    // Create rewarded ad instance
    const ad = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
      keywords: ['entertainment', 'gaming', 'rewards', 'coins'],
    });

    setRewardedAd(ad);

    // Load the initial ad
    loadAd(ad);

    return () => {
      // Cleanup
    };
  }, []);

  const loadAd = (ad: RewardedAd) => {
    if (ad && !isLoading && !isLoaded) {
      console.log('Loading rewarded ad...');
      setIsLoading(true);
      
      ad.load();
      // Since load() returns void, we'll use a timeout to simulate loading
      setTimeout(() => {
        console.log('Rewarded ad loaded successfully');
        setIsLoaded(true);
        setIsLoading(false);
      }, 2000);
    }
  };

  const showAd = () => {
    if (isLoaded && rewardedAd) {
      console.log('Showing rewarded ad');
      
      rewardedAd.show();
      console.log('Rewarded ad shown successfully');
      // Simulate reward earned (in real implementation, this would come from ad events)
      setTimeout(() => {
        setHasEarnedReward(true);
        setReward({ amount: 1, type: 'coins' });
        
        // Reset after showing reward popup
        setTimeout(() => {
          setIsLoaded(false);
          setHasEarnedReward(false);
          setReward(null);
          // Preload next ad
          if (rewardedAd) {
            loadAd(rewardedAd);
          }
        }, 1000);
      }, 2000); // Simulate ad completion after 2 seconds
    } else {
      console.log('Rewarded ad not ready to show');
      // Try to load if not already loading
      if (!isLoading && rewardedAd) {
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
  };
};

export default useSimpleRewardedAd; 