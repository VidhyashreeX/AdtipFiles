/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { getApps, initializeApp } from '@react-native-firebase/app';
import notifee from '@notifee/react-native';

// Initialize Firebase if not already initialized (v22.2.1 compatible)
if (getApps().length === 0) {
  console.log('[Index] Initializing Firebase app v22.2.1...');
  try {
    // Firebase will auto-initialize from native configuration
    // No need to call initializeApp() explicitly in v22.2.1 unless custom config needed
    console.log('[Index] Firebase app v22.2.1 initialized successfully');
  } catch (error) {
    console.error('[Index] Firebase initialization failed:', error);
  }
} else {
  console.log('[Index] Firebase app already initialized');
}

notifee.registerForegroundService(notification => {
  console.log('[Index] Foreground service called for call events');
  return new Promise(() => {
    // Keep the promise open for the duration of the call
    // Optionally, listen for call end and resolve the promise
  });
}); 

// Register the headless JS task for call events
import './src/tasks/CallEventTask';

AppRegistry.registerComponent(appName, () => App);
