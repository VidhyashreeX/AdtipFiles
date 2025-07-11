import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import AdRotationService from '../services/AdRotationService';

// Test Ad Unit ID (for development/testing)
const TEST_BANNER_AD_UNIT_ID = TestIds.BANNER; // Official Google test ID for banner ads

// Get ad unit ID from rotation service
const getBannerAdUnitId = () => {
  if (__DEV__) {
    return TEST_BANNER_AD_UNIT_ID;
  }
  return AdRotationService.getInstance().getAdUnitId('banner');
};

const BannerAdComponent = () => {
  const [currentAdUnitId, setCurrentAdUnitId] = useState(getBannerAdUnitId());
  const [adFailed, setAdFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2; // Try each network up to 2 times before switching

  // Rotate to next network when ad fails
  const handleAdFailed = (error: any) => {
    console.log('Banner ad failed to load:', error);
    setAdFailed(true);

    // Enhanced error logging for debugging
    if (error.code === 'no-fill') {
      console.log('🎯 [BannerAd] No-fill error - this is normal for new ad units');
      console.log('📊 [BannerAd] Ad inventory will improve over time');
    } else {
      console.log('❌ [BannerAd] Other ad error:', error.code, error.message);
    }

    // If we've tried the current network enough times, switch to next network
    if (retryCount >= maxRetries) {
      console.log('🔄 [BannerAd] Switching to next ad network after max retries');
      const nextAdUnitId = AdRotationService.getInstance().getNextAdUnitId('banner');
      setCurrentAdUnitId(nextAdUnitId);
      setRetryCount(0);
      setAdFailed(false);
    } else {
      // Retry with same network
      setRetryCount(prev => prev + 1);
      console.log(`🔄 [BannerAd] Retrying with same network (attempt ${retryCount + 1}/${maxRetries})`);
    }
  };

  // Reset retry count when ad loads successfully
  const handleAdLoaded = () => {
    console.log('Banner ad loaded successfully');
    setAdFailed(false);
    setRetryCount(0);
  };

  // Auto-rotate ads every 30 seconds for better fill rates
  useEffect(() => {
    const rotationInterval = setInterval(() => {
      if (!adFailed) {
        console.log('🔄 [BannerAd] Auto-rotating to next ad network');
        const nextAdUnitId = AdRotationService.getInstance().getNextAdUnitId('banner');
        setCurrentAdUnitId(nextAdUnitId);
      }
    }, 30000); // Rotate every 30 seconds

    return () => clearInterval(rotationInterval);
  }, [adFailed]);

  return (
    <View style={styles.container}>
      <BannerAd
        key={currentAdUnitId} // Force re-render when ad unit changes
        unitId={currentAdUnitId}
        size={BannerAdSize.BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false, // Allow personalized ads for better fill rates
          keywords: ['entertainment', 'social', 'communication', 'lifestyle'],
          contentUrl: 'https://adtip.app',
        }}
        onAdLoaded={handleAdLoaded}
        onAdFailedToLoad={handleAdFailed}
        onAdOpened={() => {
          console.log('Banner ad opened');
        }}
        onAdClosed={() => {
          console.log('Banner ad closed');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
});

export default BannerAdComponent; 