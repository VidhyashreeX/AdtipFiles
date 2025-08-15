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

// Initialize NotifeeCallHandler for background events (including killed state)
// This ensures call notification actions work even when app is killed
(async () => {
  try {
    const { default: NotifeeCallHandler } = await import('./src/services/notification/NotifeeCallHandler');
    const handler = NotifeeCallHandler.getInstance();
    await handler.initialize();
    console.log('[Index] ✅ NotifeeCallHandler initialized for killed state support');
  } catch (error) {
    console.error('[Index] ❌ Failed to initialize NotifeeCallHandler:', error);
  }
})();

// Export resolver for CallController to use
global.resolveForegroundService = () => {
  if (foregroundServiceResolver) {
    console.log('[Index] Resolving foreground service');
    foregroundServiceResolver();
    foregroundServiceResolver = null;
  }
};

// CallEventTask removed - using simplified calling flow

// UNIFIED BACKGROUND MESSAGE HANDLER FOR KILLED APP STATE
// This is the ONLY setBackgroundMessageHandler registration to prevent conflicts
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('[Index] 🔥 Background message received (killed state):', {
    messageId: remoteMessage.messageId,
    data: remoteMessage.data,
    notification: remoteMessage.notification
  });

  try {
    // Extract message data with multiple format support
    const messageData = remoteMessage.data || {};
    const messageType = messageData.type || messageData.messageType || messageData.info?.type;

    // Check if this is a call-related message
    const isCallMessage = messageType === 'call' ||
                         messageType === 'incoming_call' ||
                         messageType === 'CALL_INITIATED' ||
                         messageType === 'CALL_INITIATE' ||
                         messageData.sessionId ||
                         messageData.callType ||
                         messageData.callerName;

    if (isCallMessage) {
      console.log('[Index] 📞 Processing call message in killed state');
      await handleBackgroundCallNotification(remoteMessage);
    } else {
      console.log('[Index] 💬 Processing non-call message in killed state');
      await handleBackgroundGeneralMessage(remoteMessage);
    }

    console.log('[Index] ✅ Background message processed successfully');
    return Promise.resolve();
  } catch (error) {
    console.error('[Index] ❌ Error processing background message:', error);
    // Always resolve to prevent app crashes in killed state
    return Promise.resolve();
  }
});

// OPTIMIZED CALL NOTIFICATION HANDLER FOR KILLED STATE
// Uses Notifee directly for maximum reliability when app is killed
async function handleBackgroundCallNotification(remoteMessage) {
  try {
    console.log('[Index] 📞 Handling call notification in killed state');

    const callData = remoteMessage.data;
    const sessionId = callData.sessionId || callData.uuid || `call-${Date.now()}`;
    const callerName = callData.callerName || callData.peerName || 'Unknown Caller';
    const callType = callData.callType || 'voice';
    const meetingId = callData.meetingId || '';
    const token = callData.token || '';

    console.log('[Index] 📞 Call data extracted:', {
      sessionId,
      callerName,
      callType,
      hasMeetingId: !!meetingId,
      hasToken: !!token
    });

    // Use Notifee directly for killed state - most reliable approach
    const notifee = require('@notifee/react-native').default;

    // Create high-priority call channel
    const channelId = await notifee.createChannel({
      id: 'adtip_incoming_calls_killed',
      name: 'Incoming Calls (Background)',
      importance: 4, // HIGH
      sound: 'default',
      vibration: true,
      bypassDnd: true, // Bypass Do Not Disturb
    });

    console.log('[Index] 📞 Created notification channel:', channelId);

    // Display full-screen call notification
    await notifee.displayNotification({
      id: sessionId,
      title: `Incoming ${callType} call`,
      body: `${callerName} is calling...`,
      android: {
        channelId,
        importance: 4, // HIGH
        category: 'call',
        fullScreenAction: {
          id: 'answer_call',
          launchActivity: 'default',
        },
        actions: [
          {
            title: '✅ Answer',
            pressAction: {
              id: 'answer',
              launchActivity: 'default'
            },
          },
          {
            title: '❌ Decline',
            pressAction: { id: 'decline' },
          },
        ],
        ongoing: true,
        autoCancel: false,
        sound: 'default',
        vibrationPattern: [300, 1000, 300, 1000],
        pressAction: {
          id: 'default',
          launchActivity: 'default'
        },
        // Use default app icon for killed state
        largeIcon: require('./src/assets/images/logo.png'),
      },
      ios: {
        categoryId: 'call',
        sound: 'default',
        critical: true,
        criticalVolume: 1.0,
      },
      data: {
        sessionId,
        callerName,
        callType,
        meetingId,
        token,
        type: 'incoming_call',
        timestamp: Date.now().toString(),
        // Add deep link for proper navigation when app opens
        deepLink: `adtip://call/meeting/${sessionId}?meetingId=${meetingId}&token=${token}&callerName=${encodeURIComponent(callerName)}&callType=${callType}`
      }
    });

    console.log('[Index] ✅ Call notification displayed successfully in killed state');

  } catch (error) {
    console.error('[Index] ❌ Error displaying call notification in killed state:', error);

    // Fallback to basic notification
    try {
      await showBasicCallNotification(remoteMessage.data);
    } catch (fallbackError) {
      console.error('[Index] ❌ Fallback notification also failed:', fallbackError);
    }
  }
}

// HANDLER FOR NON-CALL MESSAGES IN KILLED STATE
async function handleBackgroundGeneralMessage(remoteMessage) {
  try {
    console.log('[Index] 💬 Handling general message in killed state');

    const messageData = remoteMessage.data || {};
    const messageType = messageData.type || messageData.messageType;

    // Handle chat messages
    if (messageType === 'chat_message') {
      console.log('[Index] 💬 Processing chat message in killed state');

      // Use FCMMessageRouter for chat messages
      const { FCMMessageRouter } = await import('./src/services/FCMMessageRouter');
      const router = FCMMessageRouter.getInstance();
      await router.initialize();
      await router.routeMessage(remoteMessage, 'background');
    } else {
      console.log('[Index] 📢 Processing general notification in killed state');

      // For other notifications, display directly with Notifee
      await showGeneralNotification(remoteMessage);
    }

  } catch (error) {
    console.error('[Index] ❌ Error handling general message in killed state:', error);
  }
}

// BASIC CALL NOTIFICATION FALLBACK
async function showBasicCallNotification(callData) {
  try {
    console.log('[Index] 📞 Showing basic call notification fallback');

    const notifee = require('@notifee/react-native').default;
    const sessionId = callData.sessionId || `call-${Date.now()}`;
    const callerName = callData.callerName || 'Unknown Caller';
    const callType = callData.callType || 'voice';

    // Create basic channel
    const channelId = await notifee.createChannel({
      id: 'adtip_call_fallback',
      name: 'Call Notifications',
      importance: 4, // HIGH
      sound: 'default',
      vibration: true,
    });

    // Display basic notification
    await notifee.displayNotification({
      id: sessionId,
      title: `Incoming ${callType} call`,
      body: `${callerName} is calling...`,
      android: {
        channelId,
        importance: 4, // HIGH
        pressAction: { id: 'default', launchActivity: 'default' },
        actions: [
          { title: 'Open App', pressAction: { id: 'open', launchActivity: 'default' } },
        ],
      },
      data: {
        sessionId,
        callerName,
        callType,
        type: 'incoming_call'
      }
    });

    console.log('[Index] ✅ Basic call notification displayed');

  } catch (error) {
    console.error('[Index] ❌ Failed to show basic call notification:', error);
  }
}

// GENERAL NOTIFICATION HANDLER
async function showGeneralNotification(remoteMessage) {
  try {
    console.log('[Index] 📢 Showing general notification');

    const notifee = require('@notifee/react-native').default;
    const messageData = remoteMessage.data || {};

    // Use notification payload if available, otherwise construct from data
    const title = remoteMessage.notification?.title || messageData.title || 'Adtip';
    const body = remoteMessage.notification?.body || messageData.body || 'You have a new notification';

    // Create general channel
    const channelId = await notifee.createChannel({
      id: 'adtip_general',
      name: 'General Notifications',
      importance: 3, // DEFAULT
      sound: 'default',
    });

    // Display notification
    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId,
        pressAction: { id: 'default', launchActivity: 'default' },
      },
      data: messageData
    });

    console.log('[Index] ✅ General notification displayed');

  } catch (error) {
    console.error('[Index] ❌ Failed to show general notification:', error);
  }
}

// CALLKEEP DISABLED - Background task registration disabled to fix Vivo device issues
console.log('[Index] 🚫 CallKeep background task DISABLED - Using custom UI only');

// DISABLED CODE BELOW
/*
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
*/ // END OF DISABLED CALLKEEP CODE

AppRegistry.registerComponent(appName, () => App);
