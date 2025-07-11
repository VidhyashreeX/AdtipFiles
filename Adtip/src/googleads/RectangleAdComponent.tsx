import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import AdRotationService from '../services/AdRotationService';

// Test Ad Unit ID (for development/testing) - using banner test ID for rectangle
const TEST_RECTANGLE_AD_UNIT_ID = TestIds.BANNER; // Official Google test ID for banner ads

// Get ad unit ID from rotation service
const getRectangleAdUnitId = () => {
  if (__DEV__) {
    return TEST_RECTANGLE_AD_UNIT_ID;
  }
  return AdRotationService.getInstance().getAdUnitId('rectangle');
};

const RectangleAdComponent = () => {
  const [currentAdUnitId, setCurrentAdUnitId] = useState(getRectangleAdUnitId());
  const [adFailed, setAdFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2; // Try each network up to 2 times before switching

  // Rotate to next network when ad fails
  const handleAdFailed = (error: any) => {
    console.log('Rectangle ad failed to load:', error);
    setAdFailed(true);

    // Enhanced error logging for debugging
    if (error.code === 'no-fill') {
      console.log('🎯 [RectangleAd] No-fill error - this is normal for new ad units');
      console.log('📊 [RectangleAd] Ad inventory will improve over time');
    } else {
      console.log('❌ [RectangleAd] Other ad error:', error.code, error.message);
    }

    // If we've tried the current network enough times, switch to next network
    if (retryCount >= maxRetries) {
      console.log('🔄 [RectangleAd] Switching to next ad network after max retries');
      const nextAdUnitId = AdRotationService.getInstance().getNextAdUnitId('rectangle');
      setCurrentAdUnitId(nextAdUnitId);
      setRetryCount(0);
      setAdFailed(false);
    } else {
      // Retry with same network
      setRetryCount(prev => prev + 1);
      console.log(`🔄 [RectangleAd] Retrying with same network (attempt ${retryCount + 1}/${maxRetries})`);
    }
  };

  // Reset retry count when ad loads successfully
  const handleAdLoaded = () => {
    console.log('Rectangle ad loaded successfully');
    setAdFailed(false);
    setRetryCount(0);
  };

  // Auto-rotate ads every 45 seconds for better fill rates
  useEffect(() => {
    const rotationInterval = setInterval(() => {
      if (!adFailed) {
        console.log('🔄 [RectangleAd] Auto-rotating to next ad network');
        const nextAdUnitId = AdRotationService.getInstance().getNextAdUnitId('rectangle');
        setCurrentAdUnitId(nextAdUnitId);
      }
    }, 45000); // Rotate every 45 seconds

    return () => clearInterval(rotationInterval);
  }, [adFailed]);

  return (
    <View style={styles.container}>
      <BannerAd
        key={currentAdUnitId} // Force re-render when ad unit changes
        unitId={currentAdUnitId}
        size={BannerAdSize.MEDIUM_RECTANGLE}
        requestOptions={{ 
          requestNonPersonalizedAdsOnly: false, // Allow personalized ads for better fill rates
          keywords: ['entertainment', 'social', 'communication', 'lifestyle'],
          contentUrl: 'https://adtip.app',
        }}
        onAdLoaded={handleAdLoaded}
        onAdFailedToLoad={handleAdFailed}
        onAdOpened={() => {
          console.log('Rectangle ad opened');
        }}
        onAdClosed={() => {
          console.log('Rectangle ad closed');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 12,
  },
});

export default RectangleAdComponent; 