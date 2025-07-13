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

// Enhanced background message handler with centralized call management
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('[Index] Background message received:', remoteMessage);

  try {
    // Check if this is a call-related message
    // Handle both new format (info field) and legacy format (direct type)
    let isCallMessage = false;
    let messageType = null;
    let callData = null;

    if (remoteMessage.data?.info) {
      try {
        const parsedInfo = JSON.parse(remoteMessage.data.info);
        messageType = parsedInfo.type;
        callData = parsedInfo;
        isCallMessage = ['CALL_INITIATED', 'CALL_INITIATE', 'CALL_ACCEPT', 'CALL_ACCEPTED', 'CALL_END', 'CALL_ENDED'].includes(messageType);
      } catch (e) {
        console.warn('[Index] Failed to parse info field:', e);
      }
    } else if (remoteMessage.data?.type) {
      messageType = remoteMessage.data.type;
      callData = remoteMessage.data;
      isCallMessage = ['CALL_INITIATE', 'CALL_ACCEPT', 'CALL_END'].includes(messageType);
    }

    console.log('[Index] Message analysis:', { isCallMessage, messageType });

    if (isCallMessage) {
      // Use existing ReliableCallManager (temporarily disabled new services)
      const { ReliableCallManager } = await import('./src/services/calling/ReliableCallManager');
      const callManager = ReliableCallManager.getInstance();

      if (!callManager.isReady()) {
        await callManager.initialize();
      }

      await callManager.handleFCMMessage(remoteMessage, 'background');
      console.log('[Index] Background call message processed');

      return Promise.resolve();
    }

    console.log('[Index] Non-call background message ignored');
    return Promise.resolve();
  } catch (error) {
    console.error('[Index] Error processing background message:', error);
    // Don't reject to prevent app crashes
    return Promise.resolve();
  }
});

AppRegistry.registerComponent(appName, () => App);
