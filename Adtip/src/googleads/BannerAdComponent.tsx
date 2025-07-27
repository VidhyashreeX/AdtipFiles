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
  const maxRetries = 2; // Try up to 2 times before giving up

  // Handle ad failure
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

    // Retry with same ad unit (no rotation)
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      console.log(`🔄 [BannerAd] Retrying same ad unit (attempt ${retryCount + 1}/${maxRetries})`);
    } else {
      console.log('❌ [BannerAd] Max retries reached, keeping failed ad');
    }
  };

  // Reset retry count when ad loads successfully
  const handleAdLoaded = () => {
    console.log('Banner ad loaded successfully');
    setAdFailed(false);
    setRetryCount(0);
  };

  // No auto-rotation - using PubScale only
  // useEffect(() => {
  //   const rotationInterval = setInterval(() => {
  //     if (!adFailed) {
  //       console.log('🔄 [BannerAd] Auto-rotating to next ad network');
  //       const nextAdUnitId = AdRotationService.getInstance().getNextAdUnitId('banner');
  //       setCurrentAdUnitId(nextAdUnitId);
  //     }
  //   }, 30000); // Rotate every 30 seconds
  //   return () => clearInterval(rotationInterval);
  // }, [adFailed]);

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
    justifyContent: 'center',
  },
});

export default BannerAdComponent; 