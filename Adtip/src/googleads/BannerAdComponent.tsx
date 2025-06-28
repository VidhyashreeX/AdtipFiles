import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

// Test Ad Unit ID (for development/testing)
const TEST_BANNER_AD_UNIT_ID = TestIds.BANNER; // Official Google test ID for banner ads
// For custom test ID, use a real ad unit ID, not the app ID:
// const TEST_BANNER_AD_UNIT_ID = 'ca-app-pub-3940256099942544/6300978111'; // Google's test banner ad unit

// Production Ad Unit ID (for live app)
const PROD_BANNER_AD_UNIT_ID =
  Platform.OS === 'android'
    ? '/22387492205,23292119919/com.adtip.app.adtip_app.Banner0.1750928844'
    : '/22387492205,23292119919/com.adtip.app.adtip_app.Banner0.1750928844';

// Switch between test and production ad unit IDs
const BANNER_AD_UNIT_ID = __DEV__ ? TEST_BANNER_AD_UNIT_ID : PROD_BANNER_AD_UNIT_ID;
//const BANNER_AD_UNIT_ID = PROD_BANNER_AD_UNIT_ID;

const BannerAdComponent = () => {
  return (
    <View style={styles.container}>
      <BannerAd
        unitId={BANNER_AD_UNIT_ID}
        size={BannerAdSize.BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdLoaded={() => {
          console.log('Banner ad loaded successfully');
        }}
        onAdFailedToLoad={(error) => {
          console.log('Banner ad failed to load:', error);
        }}
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