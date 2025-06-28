import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';

// Test Ad Unit ID (for development/testing)
const TEST_INTERSTITIAL_AD_UNIT_ID = TestIds.INTERSTITIAL; // Official Google test ID for interstitial ads
// For custom test ID, use a real ad unit ID, not the app ID:
// const TEST_INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-3940256099942544/1033173712'; // Google's test interstitial ad unit

// Production Ad Unit ID (for live app)
const PROD_INTERSTITIAL_AD_UNIT_ID =
  Platform.OS === 'android'
    ? '/22387492205,23292119919/com.adtip.app.adtip_app.Interstitial0.1750928897'
    : '/22387492205,23292119919/com.adtip.app.adtip_app.Interstitial0.1750928897';

// Switch between test and production ad unit IDs
const INTERSTITIAL_AD_UNIT_ID = __DEV__ ? TEST_INTERSTITIAL_AD_UNIT_ID : PROD_INTERSTITIAL_AD_UNIT_ID;

let interstitialAd: InterstitialAd | null = null;

export const useInterstitialAd = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Create interstitial ad instance
    interstitialAd = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
      keywords: ['entertainment', 'gaming', 'lifestyle'],
    });

    const onLoaded = () => {
      console.log('Interstitial ad loaded successfully');
      setIsLoaded(true);
      setIsLoading(false);
    };

    const onClosed = () => {
      console.log('Interstitial ad closed');
      setIsLoaded(false);
      // Preload the next ad
      loadAd();
    };

    const onError = (error: any) => {
      console.log('Interstitial ad failed to load:', error);
      setIsLoaded(false);
      setIsLoading(false);
    };

    const onOpened = () => {
      console.log('Interstitial ad opened');
    };

    const unsubscribeLoaded = interstitialAd.addAdEventListener(AdEventType.LOADED, onLoaded);
    const unsubscribeClosed = interstitialAd.addAdEventListener(AdEventType.CLOSED, onClosed);
    const unsubscribeError = interstitialAd.addAdEventListener(AdEventType.ERROR, onError);
    const unsubscribeOpened = interstitialAd.addAdEventListener(AdEventType.OPENED, onOpened);

    // Load the initial ad
    loadAd();

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
      unsubscribeOpened();
    };
  }, []);

  const loadAd = () => {
    if (interstitialAd && !isLoading && !isLoaded) {
      console.log('Loading interstitial ad...');
      setIsLoading(true);
      interstitialAd.load();
    }
  };

  const showAd = () => {
    if (isLoaded && interstitialAd) {
      console.log('Showing interstitial ad');
      interstitialAd.show();
    } else {
      console.log('Interstitial ad not ready to show');
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
  };
};

export default useInterstitialAd; 