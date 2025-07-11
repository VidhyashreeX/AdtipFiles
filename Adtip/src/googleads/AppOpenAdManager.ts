import { AppOpenAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { useEffect, useRef, useState } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import UnifiedCallService from '../services/calling/UnifiedCallService';
import AdRotationService from '../services/AdRotationService';

// Test Ad Unit ID (for development/testing)
const TEST_APP_OPEN_AD_UNIT_ID = TestIds.APP_OPEN; // Official Google test ID for app open ads

// Get ad unit ID from rotation service
const getAppOpenAdUnitId = () => {
  if (__DEV__) {
    return TEST_APP_OPEN_AD_UNIT_ID;
  }
  return AdRotationService.getInstance().getAdUnitId('appOpen');
};

// Minimum cooldown period between app open ads (in milliseconds)
const AD_COOLDOWN_PERIOD = 60 * 1000; // 1 minute to balance user experience with ad revenue

let lastAdShownTime = 0;
let isAdCurrentlyShowing = false;
let hasShownOnThisSession = false;

export function useAppOpenAd() {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adVisible, setAdVisible] = useState(false);
  const [currentAdUnitId, setCurrentAdUnitId] = useState(getAppOpenAdUnitId());
  const [adFailed, setAdFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2; // Try each network up to 2 times before switching
  const adRef = useRef<AppOpenAd | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const isInitialMount = useRef(true);

  // Rotate to next network when ad fails
  const handleAdError = (error: any) => {
    console.log('App open ad failed to load:', error);
    setAdLoaded(false);
    isAdCurrentlyShowing = false;
    setAdFailed(true);

    // Enhanced error handling for different error types
    if (error.code === 'no-fill') {
      console.log('🎯 [AppOpenAd] No-fill error - this is normal for new ad units');
      console.log('📊 [AppOpenAd] Ad inventory will improve over time as the app gains users');

      // If we've tried the current network enough times, switch to next network
      if (retryCount >= maxRetries) {
        console.log('🔄 [AppOpenAd] Switching to next ad network after max retries');
        const nextAdUnitId = AdRotationService.getInstance().getNextAdUnitId('appOpen');
        setCurrentAdUnitId(nextAdUnitId);
        setRetryCount(0);
        setAdFailed(false);
        
        // Retry with new network
        setTimeout(() => {
          console.log('🔄 [AppOpenAd] Retrying with new network...');
          adRef.current?.load();
        }, 5000);
      } else {
        // Retry with same network
        setRetryCount(prev => prev + 1);
        console.log(`🔄 [AppOpenAd] Retrying with same network (attempt ${retryCount + 1}/${maxRetries})`);
        
        setTimeout(() => {
          console.log('🔄 [AppOpenAd] Retrying ad load after no-fill...');
          adRef.current?.load();
        }, 60000); // Retry after 1 minute for no-fill
      }
    } else {
      console.log('❌ [AppOpenAd] Other ad error:', error.code, error.message);

      // If we've tried the current network enough times, switch to next network
      if (retryCount >= maxRetries) {
        console.log('🔄 [AppOpenAd] Switching to next ad network after max retries');
        const nextAdUnitId = AdRotationService.getInstance().getNextAdUnitId('appOpen');
        setCurrentAdUnitId(nextAdUnitId);
        setRetryCount(0);
        setAdFailed(false);
        
        // Retry with new network
        setTimeout(() => {
          console.log('🔄 [AppOpenAd] Retrying with new network...');
          adRef.current?.load();
        }, 5000);
      } else {
        // Retry with same network
        setRetryCount(prev => prev + 1);
        console.log(`🔄 [AppOpenAd] Retrying with same network (attempt ${retryCount + 1}/${maxRetries})`);
        
        setTimeout(() => {
          console.log('🔄 [AppOpenAd] Retrying ad load after error...');
          adRef.current?.load();
        }, 15000); // Retry after 15 seconds for other errors
      }
    }
  };

  useEffect(() => {
    // Create app open ad instance with optimized request options
    adRef.current = AppOpenAd.createForAdRequest(currentAdUnitId, {
      requestNonPersonalizedAdsOnly: false, // Allow personalized ads for better fill rates
      keywords: ['entertainment', 'social', 'communication', 'lifestyle'],
      contentUrl: 'https://adtip.app',
    });

    const onLoaded = () => {
      console.log('App open ad loaded successfully');
      setAdLoaded(true);
      setAdFailed(false);
      setRetryCount(0);
    };
    
    const onClosed = () => {
      console.log('App open ad closed');
      setAdVisible(false);
      isAdCurrentlyShowing = false;
      lastAdShownTime = Date.now(); // Record when ad was closed
      hasShownOnThisSession = true; // Mark as shown for this session
      
      // Immediately preload the next ad
      setTimeout(() => {
        setAdLoaded(false);
        adRef.current?.load();
      }, 500);
    };

    const onOpened = () => {
      console.log('App open ad opened');
      setAdVisible(true);
      isAdCurrentlyShowing = true;
    };

    // Set up event listeners
    const unsubscribeLoaded = adRef.current.addAdEventListener(AdEventType.LOADED, onLoaded);
    const unsubscribeClosed = adRef.current.addAdEventListener(AdEventType.CLOSED, onClosed);
    const unsubscribeOpened = adRef.current.addAdEventListener(AdEventType.OPENED, onOpened);
    const unsubscribeError = adRef.current.addAdEventListener(AdEventType.ERROR, handleAdError);

    // Handle app state changes
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('App state changed:', appStateRef.current, '->', nextAppState);
      
      // Show ad when app comes to foreground (newly opened or resumed)
      if (
        appStateRef.current.match(/inactive|background/) && 
        nextAppState === 'active' && 
        !isAdCurrentlyShowing
      ) {
        // ✅ FIX: Check if a call is in progress before showing an ad using Zustand store
        const { useCallStore } = require('../stores/callStore');
        const callStatus = useCallStore.getState().callStatus;

        if (callStatus !== 'idle' && callStatus !== 'ended') {
          console.log('[AppOpenAdManager] Suppressing ad because a call is active.');
          return;
        }
        
        // ✅ CRITICAL FIX: Add delay for notification click handling
        // Give notification navigation a chance to occur first
        const delayTime = 500; // Increased from 100ms to 500ms
        
        console.log(`[AppOpenAdManager] App came to foreground, delaying ad check for ${delayTime}ms`);
        setTimeout(() => {
          // Double-check call state again after delay using Zustand store
          try {
            const updatedCallStatus = useCallStore.getState().callStatus;
            if (updatedCallStatus !== 'idle' && updatedCallStatus !== 'ended') {
              console.log('[AppOpenAdManager] Suppressing delayed ad because a call is now active.');
              return;
            }
            showAdIfAppropriate();
          } catch (error) {
            console.error('[AppOpenAdManager] Error in delayed call state check:', error);
          }
        }, delayTime);
      }
      
      // When app goes to background, reset session flag
      if (nextAppState.match(/inactive|background/)) {
        hasShownOnThisSession = false;
        console.log('App went to background, resetting session flag');
      }
      
      appStateRef.current = nextAppState;
      isInitialMount.current = false;
    };

    // Subscribe to app state changes
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // Load the initial ad
    adRef.current.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeOpened();
      unsubscribeError();
      appStateSubscription.remove();
    };
  }, [currentAdUnitId]); // Re-create ad when ad unit changes

  const showAdIfAppropriate = () => {
    const currentTime = Date.now();
    const timeSinceLastAd = currentTime - lastAdShownTime;
    
    if (adLoaded && adRef.current && !isAdCurrentlyShowing) {
      // Check cooldown period (1 minute to prevent spam)
      if (timeSinceLastAd >= AD_COOLDOWN_PERIOD) {
        console.log('Showing app open ad immediately - user must continue to app');
        adRef.current.show();
      } else {
        const remainingCooldown = Math.ceil((AD_COOLDOWN_PERIOD - timeSinceLastAd) / 1000);
        console.log(`App open ad on cooldown. ${remainingCooldown} seconds remaining.`);
        
        // Show after cooldown period for immediate app access
        setTimeout(() => {
          if (adLoaded && adRef.current && !isAdCurrentlyShowing) {
            console.log('Showing app open ad after cooldown - continue to app');
            adRef.current.show();
          }
        }, AD_COOLDOWN_PERIOD - timeSinceLastAd);
      }
    } else if (isAdCurrentlyShowing) {
      console.log('App open ad already showing, user must dismiss to continue');
    } else {
      console.log('App open ad not ready, will show when loaded');
      // Try to load if not already loading
      if (!adLoaded) {
        adRef.current?.load();
      }
    }
  };

  const showAd = (forceShow = false) => {
    // Manual show method
    console.log('Manual app open ad show requested, forceShow:', forceShow);
    
    if (forceShow) {
      // Force show immediately if ad is loaded
      if (adLoaded && adRef.current && !isAdCurrentlyShowing) {
        console.log('Force showing app open ad');
        lastAdShownTime = 0; // Reset cooldown
        adRef.current.show();
      } else {
        console.log('Cannot force show - ad not loaded or already showing');
      }
    } else {
      showAdIfAppropriate();
    }
  };

  const forceLoadAd = () => {
    console.log('Force loading app open ad');
    setAdLoaded(false);
    adRef.current?.load();
  };

  // Show ad on app launch and when ad becomes available
  useEffect(() => {
    if (adLoaded && !isAdCurrentlyShowing) {
      // Show ad when it becomes available
      if (isInitialMount.current) {
        // On app launch - show immediately for "continue to app" experience
        setTimeout(() => {
          console.log('Showing app open ad on app launch - continue to access app');
          showAdIfAppropriate();
        }, 800); // Reduced delay to show ad before users can interact with app
      } else {
        // When ad reloads after being shown
        setTimeout(() => {
          console.log('App open ad reloaded and ready for next display');
          // Don't auto-show here, wait for next foreground event
        }, 500);
      }
    }
  }, [adLoaded]);

  return { 
    showAd, 
    adLoaded, 
    adVisible, 
    setAdVisible,
    showAdIfAppropriate, // For manual control if needed
    forceLoadAd, // Force reload an ad
    isAdCurrentlyShowing: adVisible // Current showing state
  };
}