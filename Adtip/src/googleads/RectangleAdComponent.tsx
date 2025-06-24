import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

const TEST_RECTANGLE_AD_UNIT_ID = 'ca-app-pub-3940256099942544/6300978111'; // Use banner test ID for rectangle
const PROD_RECTANGLE_AD_UNIT_ID =
  Platform.OS === 'android'
    ? '/21753324030,23297313686/com.adtip.app.adtip_app_Rectangle'
    : '/21753324030,23297313686/com.adtip.app.adtip_app_Rectangle';

const RECTANGLE_AD_UNIT_ID = __DEV__ ? TEST_RECTANGLE_AD_UNIT_ID : PROD_RECTANGLE_AD_UNIT_ID;

const RectangleAdComponent = () => {
  return (
    <View style={styles.container}>
      <BannerAd
        unitId={RECTANGLE_AD_UNIT_ID}
        size={BannerAdSize.MEDIUM_RECTANGLE}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={(error) => {
          console.log('Rectangle ad failed to load:', error);
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