/**
 * @format
 */
// Removed legacy callStore import to prevent dual store confusion
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { getApps, initializeApp } from '@react-native-firebase/app';
import notifee from '@notifee/react-native';
import { register } from '@videosdk.live/react-native-sdk';
import messaging from '@react-native-firebase/messaging';
// Import CallController for handling background messages
import CallController from './src/services/calling/CallController';

// Register VideoSDK FIRST - Critical for proper initialization
register();
console.log('[Index] VideoSDK registered successfully');

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

// Register Notifee foreground service ONCE as early as possible (per Notifee docs)
// This promise is resolved when stopForegroundService is called.
let foregroundServiceResolver = null;

notifee.registerForegroundService(notification => {
  console.log('[Index] Foreground service started for call events');

  return new Promise((resolve) => {
    // Store the resolver so it can be called when the service should stop
    foregroundServiceResolver = resolve;

    // Set up a timeout as a fallback to prevent hanging promises
    setTimeout(() => {
      if (foregroundServiceResolver === resolve) {
        console.log('[Index] Foreground service timeout - auto-resolving');
        resolve();
        foregroundServiceResolver = null;
      }
    }, 30 * 60 * 1000); // 30 minutes timeout
  });
});

// Export resolver for CallController to use
global.resolveForegroundService = () => {
  if (foregroundServiceResolver) {
    console.log('[Index] Resolving foreground service');
    foregroundServiceResolver();
    foregroundServiceResolver = null;
  }
};

// CallEventTask removed - using simplified calling flow

// Handle background messages
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('[Index] Background message received:', remoteMessage);
  
  // Check if this is a call-related message
  if (
    remoteMessage.data?.type === 'CALL_INITIATE' ||
    remoteMessage.data?.type === 'CALL_ACCEPT' ||
    remoteMessage.data?.type === 'CALL_END'
  ) {
    // Initialize controller and handle the message
    const callController = CallController.getInstance();
    callController.handleFCMMessage(remoteMessage);
    
    // Return a promise that resolves when the background task is complete
    return Promise.resolve();
  }
});

AppRegistry.registerComponent(appName, () => App);
