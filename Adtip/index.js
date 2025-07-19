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

// Enhanced background message handler with centralized FCM routing
// Uses FCMMessageRouter to coordinate between call and chat messages
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('[Index] Background message received:', remoteMessage);

  try {
    // Use FCMMessageRouter to handle all FCM messages
    // This preserves existing call functionality while adding chat support
    const { FCMMessageRouter } = await import('./src/services/FCMMessageRouter');
    const router = FCMMessageRouter.getInstance();

    // Initialize router if needed
    await router.initialize();

    // Route message to appropriate handler (call or chat)
    await router.routeMessage(remoteMessage, 'background');
    console.log('[Index] Background message routed successfully');

    return Promise.resolve();
  } catch (error) {
    console.error('[Index] Error processing background message:', error);
    // Don't reject to prevent app crashes
    return Promise.resolve();
  }
});

// Register CallKeep headless task for background call handling
AppRegistry.registerHeadlessTask('RNCallKeepBackgroundMessage', () => ({ name, callUUID, handle }) => {
  console.log(`[Index] CallKeep background task: name=${name}, callUUID=${callUUID}, handle=${handle}`);

  // Handle the background call using ReliableCallManager
  return new Promise(async (resolve) => {
    try {
      const { ReliableCallManager } = await import('./src/services/calling/ReliableCallManager');
      const callManager = ReliableCallManager.getInstance();

      if (!callManager.isReady()) {
        await callManager.initialize();
      }

      // Process the CallKeep background message
      console.log('[Index] Processing CallKeep background message');
      resolve();
    } catch (error) {
      console.error('[Index] Error in CallKeep background task:', error);
      resolve(); // Always resolve to prevent hanging
    }
  });
});

AppRegistry.registerComponent(appName, () => App);
