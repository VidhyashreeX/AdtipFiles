import { AppOpenAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { useEffect, useRef, useState } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';

// Test Ad Unit ID (for development/testing)
const TEST_APP_OPEN_AD_UNIT_ID = TestIds.APP_OPEN; // Official Google test ID for app open ads
// For custom test ID, use a real ad unit ID, not the app ID:
// const TEST_APP_OPEN_AD_UNIT_ID = 'ca-app-pub-3940256099942544/3419835294'; // Google's test app open ad unit

// Production Ad Unit ID (for live app)
const PROD_APP_OPEN_AD_UNIT_ID =
  Platform.OS === 'android'
    ? '/22387492205,23292119919/com.adtip.app.adtip_app.AppOpen0.1750929051'
    : '/22387492205,23292119919/com.adtip.app.adtip_app.AppOpen0.1750929051';

// Switch between test and production ad unit IDs
 const APP_OPEN_AD_UNIT_ID = __DEV__ ? TEST_APP_OPEN_AD_UNIT_ID : PROD_APP_OPEN_AD_UNIT_ID;
//const APP_OPEN_AD_UNIT_ID = PROD_APP_OPEN_AD_UNIT_ID;

// Minimum cooldown period between app open ads (in milliseconds)
const AD_COOLDOWN_PERIOD = 30 * 1000; // 30 seconds to prevent rapid-fire ads

let lastAdShownTime = 0;
let isAdCurrentlyShowing = false;
let hasShownOnThisSession = false;

export function useAppOpenAd() {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adVisible, setAdVisible] = useState(false);
  const adRef = useRef<AppOpenAd | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Create app open ad instance
    adRef.current = AppOpenAd.createForAdRequest(APP_OPEN_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    });

    const onLoaded = () => {
      console.log('App open ad loaded successfully');
      setAdLoaded(true);
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

    const onError = (error: any) => {
      console.log('App open ad failed to load:', error);
      setAdLoaded(false);
      isAdCurrentlyShowing = false;
      
      // Retry loading after a delay
      setTimeout(() => {
        adRef.current?.load();
      }, 30000); // Retry after 30 seconds
    };

    // Set up event listeners
    const unsubscribeLoaded = adRef.current.addAdEventListener(AdEventType.LOADED, onLoaded);
    const unsubscribeClosed = adRef.current.addAdEventListener(AdEventType.CLOSED, onClosed);
    const unsubscribeOpened = adRef.current.addAdEventListener(AdEventType.OPENED, onOpened);
    const unsubscribeError = adRef.current.addAdEventListener(AdEventType.ERROR, onError);

    // Handle app state changes
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('App state changed:', appStateRef.current, '->', nextAppState);
      
      // Show ad when app comes to foreground
      if (
        appStateRef.current.match(/inactive|background/) && 
        nextAppState === 'active' && 
        !isAdCurrentlyShowing
      ) {
        console.log('App came to foreground, attempting to show app open ad');
        hasShownOnThisSession = false; // Reset session flag for new foreground session
        showAdIfAppropriate();
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
  }, []);

  const showAdIfAppropriate = () => {
    const currentTime = Date.now();
    const timeSinceLastAd = currentTime - lastAdShownTime;
    
    if (adLoaded && adRef.current && !isAdCurrentlyShowing) {
      // Check minimal cooldown period (30 seconds to prevent spam)
      if (timeSinceLastAd >= AD_COOLDOWN_PERIOD) {
        console.log('Showing app open ad');
        adRef.current.show();
      } else {
        const remainingCooldown = Math.ceil((AD_COOLDOWN_PERIOD - timeSinceLastAd) / 1000);
        console.log(`App open ad on short cooldown. ${remainingCooldown} seconds remaining.`);
        
        // Still try to show after short delay
        setTimeout(() => {
          if (adLoaded && adRef.current && !isAdCurrentlyShowing) {
            console.log('Showing app open ad after short delay');
            adRef.current.show();
          }
        }, AD_COOLDOWN_PERIOD - timeSinceLastAd);
      }
    } else if (isAdCurrentlyShowing) {
      console.log('App open ad already showing, skipping');
    } else {
      console.log('App open ad not ready to show, will retry when loaded');
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
        // On app launch
        setTimeout(() => {
          console.log('Showing app open ad on app launch');
          showAdIfAppropriate();
        }, 1500); // 1.5 second delay to let app initialize
      } else {
        // When ad reloads after being shown
        setTimeout(() => {
          console.log('App open ad reloaded and ready');
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