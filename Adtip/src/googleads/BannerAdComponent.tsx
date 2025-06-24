import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

const TEST_BANNER_AD_UNIT_ID = 'ca-app-pub-3940256099942544/6300978111';
const PROD_BANNER_AD_UNIT_ID =
  Platform.OS === 'android'
    ? '/21753324030,23297313686/com.adtip.app.adtip_app_Banner'
    : '/21753324030,23297313686/com.adtip.app.adtip_app_Banner';

const BANNER_AD_UNIT_ID = __DEV__ ? TEST_BANNER_AD_UNIT_ID : PROD_BANNER_AD_UNIT_ID;

const BannerAdComponent = () => {
  return (
    <View style={styles.container}>
      <BannerAd
        unitId={BANNER_AD_UNIT_ID}
        size={BannerAdSize.BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={(error) => {
          console.log('Banner ad failed to load:', error);
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