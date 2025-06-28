import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAppOpenAd } from './AppOpenAdManager';

// This is a debug component to test app open ads easily during development.
// Use this only during development to test ad functionality
const AppOpenAdTester: React.FC = () => {
  const { adLoaded, showAd, forceLoadAd, isAdCurrentlyShowing } = useAppOpenAd();

  const handleTestAd = () => {
    console.log('Testing app open ad manually');
    showAd(true); // Force show
  };

  const handleLoadAd = () => {
    console.log('Force loading app open ad');
    forceLoadAd();
  };

  const showStatus = () => {
    Alert.alert(
      'App Open Ad Status',
      `Ad Loaded: ${adLoaded}\nCurrently Showing: ${isAdCurrentlyShowing}`,
      [{ text: 'OK' }]
    );
  };

  // Only show in development mode
  if (!__DEV__) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>App Open Ad Tester (DEV ONLY)</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Status: {adLoaded ? '✅ Loaded' : '⏳ Loading...'}
        </Text>
        <Text style={styles.statusText}>
          Showing: {isAdCurrentlyShowing ? '👁️ Yes' : '❌ No'}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={handleTestAd}
          disabled={!adLoaded}
        >
          <Text style={styles.buttonText}>
            {adLoaded ? 'Show Ad Now' : 'Ad Not Ready'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.loadButton]}
          onPress={handleLoadAd}
        >
          <Text style={styles.buttonText}>Force Load Ad</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.statusButton]}
          onPress={showStatus}
        >
          <Text style={styles.buttonText}>Show Status</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.instructions}>
        Use these buttons to test app open ads during development.
        {'\n'}• "Show Ad Now" - Forces an ad to display
        {'\n'}• "Force Load Ad" - Reloads the ad
        {'\n'}• "Show Status" - Shows current ad state
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 15,
    borderRadius: 10,
    minWidth: 200,
    zIndex: 9999,
  },
  title: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  statusContainer: {
    marginBottom: 10,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    marginBottom: 3,
  },
  buttonContainer: {
    marginBottom: 10,
  },
  button: {
    padding: 8,
    borderRadius: 5,
    marginBottom: 5,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#4CAF50',
  },
  loadButton: {
    backgroundColor: '#2196F3',
  },
  statusButton: {
    backgroundColor: '#FF9800',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  instructions: {
    color: '#ccc',
    fontSize: 10,
    lineHeight: 14,
  },
});

export default AppOpenAdTester; 