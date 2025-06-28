import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

// Test Ad Unit ID (for development/testing) - using banner test ID for rectangle
const TEST_RECTANGLE_AD_UNIT_ID = TestIds.BANNER; // Official Google test ID for banner ads
// For custom test ID, use a real ad unit ID, not the app ID:
// const TEST_RECTANGLE_AD_UNIT_ID = 'ca-app-pub-3940256099942544/6300978111'; // Google's test banner ad unit

// Production Ad Unit ID (for live app) - using MREC ad unit
const PROD_RECTANGLE_AD_UNIT_ID =
  Platform.OS === 'android'
    ? '/22387492205,23292119919/com.adtip.app.adtip_app.Mrec0.1750929251'
    : '/22387492205,23292119919/com.adtip.app.adtip_app.Mrec0.1750929251';

// Switch between test and production ad unit IDs
const RECTANGLE_AD_UNIT_ID = __DEV__ ? TEST_RECTANGLE_AD_UNIT_ID : PROD_RECTANGLE_AD_UNIT_ID;
//const RECTANGLE_AD_UNIT_ID = PROD_RECTANGLE_AD_UNIT_ID;

const RectangleAdComponent = () => {
  return (
    <View style={styles.container}>
      <BannerAd
        unitId={RECTANGLE_AD_UNIT_ID}
        size={BannerAdSize.MEDIUM_RECTANGLE}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdLoaded={() => {
          console.log('Rectangle ad loaded successfully');
        }}
        onAdFailedToLoad={(error) => {
          console.log('Rectangle ad failed to load:', error);
        }}
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