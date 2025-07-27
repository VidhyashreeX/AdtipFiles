import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';
import AdRotationService from '../services/AdRotationService';

// Test Ad Unit ID (for development/testing)
const TEST_NATIVE_AD_UNIT_ID = TestIds.NATIVE; // Official Google test ID for native ads

// Get ad unit ID from rotation service
const getNativeAdUnitId = () => {
  if (__DEV__) {
    return TEST_NATIVE_AD_UNIT_ID;
  }
  return AdRotationService.getInstance().getAdUnitId('native');
};

interface NativeAdComponentProps {
  style?: any;
}

// Note: Native ads require more complex implementation with AdLoader
// This is a placeholder component. For full native ad implementation,
// you would need to use the AdLoader class and create custom native ad layouts
const NativeAdComponent: React.FC<NativeAdComponentProps> = ({ style }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentAdUnitId, setCurrentAdUnitId] = useState(getNativeAdUnitId());

  useEffect(() => {
    // Native ads would be loaded using AdLoader here
    console.log('Native ad component mounted with unit ID:', currentAdUnitId);
    
    // Simulate loading for now
    const timer = setTimeout(() => {
      setIsLoaded(true);
      console.log('Native ad loaded successfully');
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentAdUnitId]); // Re-create when ad unit changes

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