import { AppOpenAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { useEffect, useRef, useState } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { useCallStore } from '../stores/callStoreSimplified';
import AdRotationService from '../services/AdRotationService';
import { isCallInitiationActive } from '../utils/CallInitiationFlag';

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

// Global retry tracking to prevent infinite loops
let globalRetryCount = 0;
const MAX_GLOBAL_RETRIES = 5; // Maximum total retries across all attempts
const RETRY_RESET_INTERVAL = 5 * 60 * 1000; // Reset retry count every 5 minutes
let lastRetryResetTime = Date.now();

let lastAdShownTime = 0;
let isAdCurrentlyShowing = false;
let hasShownOnThisSession = false;

export function useAppOpenAd() {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adVisible, setAdVisible] = useState(false);
  const [currentAdUnitId, setCurrentAdUnitId] = useState(getAppOpenAdUnitId());
  const [adFailed, setAdFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2; // Try up to 2 times before giving up
  const adRef = useRef<AppOpenAd | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const isInitialMount = useRef(true);

  // Handle ad failure (no rotation)
  const handleAdError = (error: any) => {
    // Reset global retry count if enough time has passed
    const now = Date.now();
    if (now - lastRetryResetTime > RETRY_RESET_INTERVAL) {
      globalRetryCount = 0;
      lastRetryResetTime = now;
      console.log('🔄 [AppOpenAd] Reset global retry count after cooldown period');
    }

    // Check global retry limit first to prevent infinite loops
    if (globalRetryCount >= MAX_GLOBAL_RETRIES) {
      console.log('🛑 [AppOpenAd] Maximum global retries reached, stopping ad loading for this session');
      setAdFailed(true);
      setAdLoaded(false);
      isAdCurrentlyShowing = false;
      return;
    }

    globalRetryCount++;
    console.log(`⚠️ [AppOpenAd] Ad failed to load (${globalRetryCount}/${MAX_GLOBAL_RETRIES}):`, error?.code || error?.message || 'Unknown error');

    setAdLoaded(false);
    isAdCurrentlyShowing = false;
    setAdFailed(true);

    // Enhanced error handling for different error types with global retry limits
    if (error.code === 'no-fill') {
      if (__DEV__) {
        console.log('🎯 [AppOpenAd] No-fill error - this is normal for new ad units');
      }

      // For no-fill errors, wait longer and don't retry aggressively
      setTimeout(() => {
        if (globalRetryCount < MAX_GLOBAL_RETRIES && adRef.current) {
          if (__DEV__) console.log('🔄 [AppOpenAd] Retrying after no-fill...');
          adRef.current.load();
        }
      }, 120000); // Wait 2 minutes for no-fill errors

    } else if (error.code === 'network-error' || error.message?.includes('Current Activity was null') || error.code === 'googleMobileAds/null-activity') {
      if (__DEV__) {
        console.log('🌐 [AppOpenAd] Network/Activity error - implementing exponential backoff');
      }

      // For null activity errors, implement exponential backoff
      const backoffDelay = Math.min(30000 * Math.pow(2, globalRetryCount - 1), 300000); // Max 5 minutes

      setTimeout(() => {
        if (globalRetryCount < MAX_GLOBAL_RETRIES && adRef.current) {
          if (__DEV__) console.log(`🔄 [AppOpenAd] Retrying after ${backoffDelay}ms backoff...`);
          adRef.current.load();
        }
      }, backoffDelay);

    } else {
      if (__DEV__) {
        console.log('❌ [AppOpenAd] Other ad error:', error.code, error.message);
      }

      // For other errors, try switching networks if available
      if (retryCount >= maxRetries) {
        const nextAdUnitId = AdRotationService.getInstance().getNextAdUnitId('appOpen');
        setCurrentAdUnitId(nextAdUnitId);
        setRetryCount(0);

        setTimeout(() => {
          if (globalRetryCount < MAX_GLOBAL_RETRIES && adRef.current) {
            if (__DEV__) console.log('🔄 [AppOpenAd] Retrying with new network...');
            adRef.current.load();
          }
        }, 15000);
      } else {
        setRetryCount(prev => prev + 1);

        setTimeout(() => {
          if (globalRetryCount < MAX_GLOBAL_RETRIES && adRef.current) {
            if (__DEV__) console.log('🔄 [AppOpenAd] Retrying with same network...');
            adRef.current.load();
          }
        }, 15000);
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
        const callState = useCallStore.getState();
        const session = callState.session;
        const status = callState.status;

        // Check both session and status to catch calls in all phases, plus global flag
        const isInitiationActive = isCallInitiationActive();
        if (session || (status && status !== 'idle') || isInitiationActive) {
          console.log('[AppOpenAdManager] Suppressing ad because a call is active.', {
            hasSession: !!session,
            status: status,
            isCallInitiationInProgress: isInitiationActive
          });
          return;
        }
        
        // ✅ CRITICAL FIX: Add delay for notification click handling
        // Give notification navigation a chance to occur first
        const delayTime = 500; // Increased from 100ms to 500ms
        
        console.log(`[AppOpenAdManager] App came to foreground, delaying ad check for ${delayTime}ms`);
        setTimeout(() => {
          // Double-check call state again after delay using Zustand store
          try {
            const updatedCallState = useCallStore.getState();
            const updatedSession = updatedCallState.session;
            const updatedStatus = updatedCallState.status;

            // Check both session and status again, plus global flag
            const isInitiationActiveDelayed = isCallInitiationActive();
            if (updatedSession || (updatedStatus && updatedStatus !== 'idle') || isInitiationActiveDelayed) {
              console.log('[AppOpenAdManager] Suppressing delayed ad because a call is now active.', {
                hasSession: !!updatedSession,
                status: updatedStatus,
                isCallInitiationInProgress: isInitiationActiveDelayed
              });
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

// Note: Call initiation flag functions are now in utils/CallInitiationFlag.ts