import { AppOpenAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

const TEST_APP_OPEN_AD_UNIT_ID = 'ca-app-pub-3940256099942544/3419835294';
const PROD_APP_OPEN_AD_UNIT_ID =
  Platform.OS === 'android'
    ? '/21753324030,23297313686/com.adtip.app.adtip_app_AppOpen'
    : '/21753324030,23297313686/com.adtip.app.adtip_app_AppOpen';

const APP_OPEN_AD_UNIT_ID = __DEV__ ? TEST_APP_OPEN_AD_UNIT_ID : PROD_APP_OPEN_AD_UNIT_ID;

export function useAppOpenAd() {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adVisible, setAdVisible] = useState(false);
  const adRef = useRef<AppOpenAd | null>(null);

  useEffect(() => {
    adRef.current = AppOpenAd.createForAdRequest(APP_OPEN_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    });

    const onLoaded = () => setAdLoaded(true);
    const onClosed = () => {
      setAdVisible(false);
      setAdLoaded(false);
      adRef.current?.load();
    };

    const unsubscribeLoaded = adRef.current.addAdEventListener(
      AdEventType.LOADED,
      onLoaded
    );
    const unsubscribeClosed = adRef.current.addAdEventListener(
      AdEventType.CLOSED,
      onClosed
    );

    adRef.current.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
    };
  }, []);

  const showAd = () => {
    if (adLoaded && adRef.current) {
      setAdVisible(true);
      adRef.current.show();
    }
  };

  return { showAd, adLoaded, adVisible, setAdVisible };
} 