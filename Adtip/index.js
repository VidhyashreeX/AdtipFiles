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
// Import ReliableCallManager for handling background messages
import ReliableCallManager from './src/services/calling/ReliableCallManager';

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

// Enhanced background message handler with reliable call management
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('[Index] Background message received:', remoteMessage);

  // Check if this is a call-related message
  // Handle both new format (info field) and legacy format (direct type)
  let isCallMessage = false;

  if (remoteMessage.data?.info) {
    try {
      const parsedInfo = JSON.parse(remoteMessage.data.info);
      isCallMessage = parsedInfo.type === 'CALL_INITIATED' ||
                     parsedInfo.type === 'CALL_INITIATE' ||
                     parsedInfo.type === 'CALL_ACCEPT' ||
                     parsedInfo.type === 'CALL_END';
    } catch (e) {
      // Ignore parse errors
    }
  } else if (remoteMessage.data?.type) {
    isCallMessage = remoteMessage.data.type === 'CALL_INITIATE' ||
                   remoteMessage.data.type === 'CALL_ACCEPT' ||
                   remoteMessage.data.type === 'CALL_END';
  }

  if (isCallMessage) {
    try {
      // Use ReliableCallManager for background message handling
      const callManager = ReliableCallManager.getInstance();

      // Initialize if not already done
      if (!callManager.isReady()) {
        await callManager.initialize();
      }

      // Handle the FCM message
      await callManager.handleFCMMessage(remoteMessage, 'background');

      console.log('[Index] Background call message processed successfully');
      return Promise.resolve();
    } catch (error) {
      console.error('[Index] Error processing background call message:', error);
      // Don't reject to prevent app crashes
      return Promise.resolve();
    }
  }

  console.log('[Index] Non-call background message ignored');
  return Promise.resolve();
});

AppRegistry.registerComponent(appName, () => App);
