import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import AdRotationService from '../services/AdRotationService';

// Test Ad Unit ID (for development/testing)
const TEST_INTERSTITIAL_AD_UNIT_ID = TestIds.INTERSTITIAL; // Official Google test ID for interstitial ads

// Get ad unit ID from rotation service
const getInterstitialAdUnitId = () => {
  if (__DEV__) {
    return TEST_INTERSTITIAL_AD_UNIT_ID;
  }
  return AdRotationService.getInstance().getAdUnitId('interstitial');
};

let interstitialAd: InterstitialAd | null = null;

export const useInterstitialAd = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAdUnitId, setCurrentAdUnitId] = useState(getInterstitialAdUnitId());

  useEffect(() => {
    // Create interstitial ad instance
    interstitialAd = InterstitialAd.createForAdRequest(currentAdUnitId, {
      requestNonPersonalizedAdsOnly: false, // Allow personalized ads for better fill rates
      keywords: ['entertainment', 'social', 'communication', 'lifestyle'],
      contentUrl: 'https://adtip.app',
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
  }, [currentAdUnitId]); // Re-create ad when ad unit changes

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