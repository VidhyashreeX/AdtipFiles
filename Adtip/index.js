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
// Enhanced registration with error handling for WebSocket stability
try {
  console.log('[Index] Registering VideoSDK...');
  register();
  console.log('[Index] VideoSDK registered successfully');
} catch (error) {
  console.error('[Index] VideoSDK registration failed:', error);
  // Don't throw here as it would prevent app startup
  // The VideoSDKService will handle re-initialization if needed
}

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

// Enhanced background message handler with simplified call handling
// Prioritizes CallKeep for incoming calls when app is killed
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('[Index] Background message received:', remoteMessage);

  try {
    // Check if this is a call message
    const messageType = remoteMessage?.data?.type || remoteMessage?.data?.messageType;
    const isCallMessage = messageType === 'call' || messageType === 'incoming_call' ||
                         remoteMessage?.data?.sessionId || remoteMessage?.data?.callType;

    if (isCallMessage) {
      console.log('[Index] Processing background call message');

      // For call messages, use simplified direct CallKeep handling
      await handleBackgroundCall(remoteMessage);
    } else {
      console.log('[Index] Processing non-call background message');

      // For non-call messages, use FCMMessageRouter
      const { FCMMessageRouter } = await import('./src/services/FCMMessageRouter');
      const router = FCMMessageRouter.getInstance();
      await router.initialize();
      await router.routeMessage(remoteMessage, 'background');
    }

    console.log('[Index] Background message processed successfully');
    return Promise.resolve();
  } catch (error) {
    console.error('[Index] Error processing background message:', error);
    // Don't reject to prevent app crashes
    return Promise.resolve();
  }
});

// Simplified background call handler for killed app state
async function handleBackgroundCall(remoteMessage) {
  try {
    console.log('[Index] Handling background call with direct CallKeep');

    const callData = remoteMessage.data;
    const sessionId = callData.sessionId || callData.uuid || `call-${Date.now()}`;
    const callerName = callData.callerName || callData.peerName || 'Unknown Caller';
    const callType = callData.callType || 'voice';

    // Try to initialize CallKeep directly for background calls
    let RNCallKeep;
    try {
      RNCallKeep = require('react-native-callkeep').default;
    } catch (importError) {
      console.warn('[Index] CallKeep not available in background');
      return;
    }

    if (!RNCallKeep) {
      console.warn('[Index] CallKeep not available');
      return;
    }

    // Simple CallKeep setup for background context
    const options = {
      ios: {
        appName: 'Adtip',
        supportsVideo: true,
        maximumCallGroups: '1',
        maximumCallsPerCallGroup: '1',
      },
      android: {
        alertTitle: 'Permissions required',
        alertDescription: 'This application needs to access your phone accounts to make calls',
        cancelButton: 'Cancel',
        okButton: 'OK',
        imageName: 'ic_launcher',
        additionalPermissions: [],
        selfManaged: false,
        foregroundService: {
          channelId: 'com.adtip.calling',
          channelName: 'Adtip Calling Service',
          notificationTitle: 'Adtip is handling a call',
          notificationIcon: 'ic_launcher'
        }
      }
    };

    // Initialize CallKeep for background
    await RNCallKeep.setup(options);

    // Check if phone account is available
    const hasPhoneAccount = await RNCallKeep.hasPhoneAccount();
    if (!hasPhoneAccount) {
      console.warn('[Index] ❌ Phone account not enabled - cannot display CallKeep UI');
      console.warn('[Index] 💡 User must enable: Settings > Apps > Adtip > Phone Account');

      // Fallback to high-priority notification
      await showHighPriorityCallNotification(sessionId, callerName, callType);
      return;
    }

    // Display incoming call via CallKeep
    console.log('[Index] ✅ Displaying CallKeep incoming call in background');
    await RNCallKeep.displayIncomingCall(
      sessionId,
      callerName,
      callerName,
      'generic',
      callType === 'video'
    );

    console.log('[Index] ✅ Background CallKeep call displayed successfully');

  } catch (error) {
    console.error('[Index] Error in background call handling:', error);

    // Fallback to notification
    try {
      const callData = remoteMessage.data;
      const sessionId = callData.sessionId || `call-${Date.now()}`;
      const callerName = callData.callerName || 'Unknown Caller';
      const callType = callData.callType || 'voice';

      await showHighPriorityCallNotification(sessionId, callerName, callType);
    } catch (notifError) {
      console.error('[Index] Fallback notification also failed:', notifError);
    }
  }
}

// High-priority notification fallback for when CallKeep fails
async function showHighPriorityCallNotification(sessionId, callerName, callType) {
  try {
    console.log('[Index] Showing high-priority call notification fallback');

    // Use Notifee for high-priority notification
    const notifee = require('@notifee/react-native').default;

    // Create high-priority channel
    const channelId = await notifee.createChannel({
      id: 'adtip_call_channel',
      name: 'Incoming Calls',
      importance: 4, // HIGH
      sound: 'default',
      vibration: true,
    });

    // Display full-screen notification
    await notifee.displayNotification({
      title: `Incoming ${callType} call`,
      body: `${callerName} is calling...`,
      android: {
        channelId,
        importance: 4, // HIGH
        fullScreenAction: {
          id: 'answer_call',
          launchActivity: 'default',
        },
        actions: [
          {
            title: 'Answer',
            pressAction: { id: 'answer', launchActivity: 'default' },
          },
          {
            title: 'Decline',
            pressAction: { id: 'decline' },
          },
        ],
        category: 'call',
        ongoing: true,
        autoCancel: false,
      },
      data: {
        sessionId,
        callerName,
        callType,
        type: 'incoming_call'
      }
    });

    console.log('[Index] ✅ High-priority call notification displayed');

  } catch (error) {
    console.error('[Index] Failed to show high-priority notification:', error);
  }
}

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
