import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

// Test Ad Unit ID (for development/testing)
const TEST_NATIVE_AD_UNIT_ID = TestIds.NATIVE; // Official Google test ID for native ads
// For custom test ID, use a real ad unit ID, not the app ID:
// const TEST_NATIVE_AD_UNIT_ID = 'ca-app-pub-3940256099942544/2247696110'; // Google's test native ad unit

// Production Ad Unit ID (for live app)
const PROD_NATIVE_AD_UNIT_ID =
  Platform.OS === 'android'
    ? '/22387492205,23292119919/com.adtip.app.adtip_app.Native0.1750929216'
    : '/22387492205,23292119919/com.adtip.app.adtip_app.Native0.1750929216';

// Switch between test and production ad unit IDs
const NATIVE_AD_UNIT_ID = __DEV__ ? TEST_NATIVE_AD_UNIT_ID : PROD_NATIVE_AD_UNIT_ID;

interface NativeAdComponentProps {
  style?: any;
}

// Note: Native ads require more complex implementation with AdLoader
// This is a placeholder component. For full native ad implementation,
// you would need to use the AdLoader class and create custom native ad layouts
const NativeAdComponent: React.FC<NativeAdComponentProps> = ({ style }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Native ads would be loaded using AdLoader here
    console.log('Native ad component mounted with unit ID:', NATIVE_AD_UNIT_ID);
    
    // Simulate loading for now
    const timer = setTimeout(() => {
      setIsLoaded(true);
      console.log('Native ad loaded successfully');
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.adContent}>
        <Text style={styles.adLabel}>Native Advertisement</Text>
        {isLoaded ? (
          <Text style={styles.adText}>
            Native ad content would appear here. 
            Full implementation requires AdLoader integration.
          </Text>
        ) : (
          <Text style={styles.loadingText}>Loading native ad...</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
  },
  adContent: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 100,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  adText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    lineHeight: 16,
  },
  loadingText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default NativeAdComponent; 