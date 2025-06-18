/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { firebase } from '@react-native-firebase/app';

// Initialize Firebase if not already initialized (v22.2.1 compatible)
if (!firebase.apps.length) {
  console.log('[Index] Initializing Firebase app v22.2.1...');
  try {
    // Firebase will auto-initialize from native configuration
    // No need to call firebase.initializeApp() explicitly in v22.2.1
    console.log('[Index] Firebase app v22.2.1 initialized successfully');
  } catch (error) {
    console.error('[Index] Firebase initialization failed:', error);
  }
} else {
  console.log('[Index] Firebase app already initialized');
}

AppRegistry.registerComponent(appName, () => App);
