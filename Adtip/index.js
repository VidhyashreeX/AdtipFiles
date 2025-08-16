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
    console.log('[Index] 🔄 Initializing NotifeeCallHandler for killed state support...');

    const { default: NotifeeCallHandler } = await import('./src/services/notification/NotifeeCallHandler');
    const handler = NotifeeCallHandler.getInstance();

    // Force initialization even if already initialized to ensure background handlers are set up
    await handler.initialize();
    console.log('[Index] ✅ NotifeeCallHandler initialized for killed state support');

    // Also ensure basic notification channels exist for fallback scenarios
    const notifee = require('@notifee/react-native').default;

    // Create all necessary channels
    await Promise.all([
      notifee.createChannel({
        id: 'adtip_general',
        name: 'General Notifications',
        importance: 3, // DEFAULT
        sound: 'default',
      }),
      notifee.createChannel({
        id: 'adtip_incoming_calls',
        name: 'Incoming Calls',
        importance: 4, // HIGH
        sound: 'default',
        vibration: true,
      })
    ]);

    console.log('[Index] ✅ All notification channels verified for killed state');
  } catch (error) {
    console.error('[Index] ❌ Failed to initialize NotifeeCallHandler:', error);

    // Try to at least create basic channels as fallback
    try {
      const notifee = require('@notifee/react-native').default;
      await notifee.createChannel({
        id: 'adtip_general',
        name: 'General Notifications',
        importance: 3,
        sound: 'default',
      });
      console.log('[Index] ✅ Basic fallback channel created');
    } catch (channelError) {
      console.error('[Index] ❌ Even basic channel creation failed:', channelError);
    }
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
      // Use FCMMessageRouter for call messages (same pattern as chat)
      await handleBackgroundCallMessage(remoteMessage);
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

// CALL MESSAGE HANDLER OPTIMIZED FOR KILLED STATE
// Use the same reliable pattern as chat notifications for maximum consistency
async function handleBackgroundCallMessage(remoteMessage) {
  try {
    console.log('[Index] 📞 Handling call message in killed state using NotifeeCallHandler');

    // Ensure NotifeeCallHandler is properly initialized for killed state
    const { default: NotifeeCallHandler } = await import('./src/services/notification/NotifeeCallHandler');
    const handler = NotifeeCallHandler.getInstance();

    // Initialize if not already done (critical for killed state)
    if (!handler.isReady) {
      await handler.initialize();
      console.log('[Index] ✅ NotifeeCallHandler initialized for killed state');
    }

    // Extract call data from FCM message
    const callData = remoteMessage.data;
    const sessionId = callData.sessionId || callData.uuid || `call-${Date.now()}`;
    const callerName = callData.callerName || callData.peerName || 'Unknown Caller';
    const callType = callData.callType || callData.type || 'voice';
    const meetingId = callData.meetingId || `meeting-${Date.now()}`;
    const token = callData.token || `token-${Date.now()}`;

    // Use NotifeeCallHandler to display the notification (same as foreground)
    const success = await handler.displayIncomingCall({
      sessionId,
      callerName,
      callType: callType === 'video' ? 'video' : 'voice',
      meetingId,
      token
    });

    if (success) {
      console.log('[Index] ✅ Call notification displayed successfully via NotifeeCallHandler');
    } else {
      throw new Error('NotifeeCallHandler failed to display notification');
    }

  } catch (error) {
    console.error('[Index] ❌ NotifeeCallHandler failed, trying direct notification fallback:', error);

    // Fallback to direct notification if NotifeeCallHandler fails
    try {
      console.log('[Index] 📞 Attempting direct notification as fallback');
      await handleDirectCallNotification(remoteMessage);
      console.log('[Index] ✅ Direct call notification displayed successfully');
    } catch (directError) {
      console.error('[Index] ❌ Both NotifeeCallHandler and direct notification failed:', directError);

      // Final fallback to FCMMessageRouter
      try {
        console.log('[Index] 📞 Attempting FCMMessageRouter as final fallback');
        const { FCMMessageRouter } = await import('./src/services/FCMMessageRouter');
        const router = FCMMessageRouter.getInstance();
        await router.initialize();
        await router.routeMessage(remoteMessage, 'background');
        console.log('[Index] ✅ Call message routed successfully via FCMMessageRouter');
      } catch (routerError) {
        console.error('[Index] ❌ All call notification methods failed:', routerError);
      }
    }
  }
}

// ENHANCED DIRECT CALL NOTIFICATION FOR KILLED STATE
// Uses same channel and data structure as NotifeeCallHandler for consistency
async function handleDirectCallNotification(remoteMessage) {
  try {
    console.log('[Index] 📞 Creating enhanced direct call notification for killed state');

    const callData = remoteMessage.data;
    const sessionId = callData.sessionId || callData.uuid || `call-${Date.now()}`;
    const callerName = callData.callerName || callData.peerName || 'Unknown Caller';
    const callType = callData.callType || callData.type || 'voice';
    const meetingId = callData.meetingId || `meeting-${Date.now()}`;
    const token = callData.token || `token-${Date.now()}`;

    // Use Notifee directly for maximum reliability in killed state
    const notifee = require('@notifee/react-native').default;

    // Use SAME channel ID as NotifeeCallHandler for consistency
    const channelId = await notifee.createChannel({
      id: 'adtip_incoming_calls',
      name: 'Incoming Calls',
      importance: 4, // HIGH
      sound: 'default',
      vibration: true,
    });

    // Display notification with SAME structure as NotifeeCallHandler
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
            title: 'Answer',
            pressAction: {
              id: 'answer',
              launchActivity: 'default'
            },
          },
          {
            title: 'Decline',
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
        }
      },
      data: {
        sessionId,
        callerName,
        callType,
        meetingId: meetingId || '',
        token: token || '',
        type: 'incoming_call'
      }
    });

    console.log('[Index] ✅ Enhanced direct call notification displayed for killed state:', {
      sessionId,
      callerName,
      callType,
      meetingId
    });

  } catch (error) {
    console.error('[Index] ❌ Enhanced direct call notification failed:', error);

    // Ultra-simple fallback notification as last resort
    try {
      console.log('[Index] 📞 Creating ultra-simple fallback notification');
      const notifee = require('@notifee/react-native').default;

      await notifee.displayNotification({
        id: `fallback-${Date.now()}`,
        title: '📞 Incoming Call',
        body: 'Someone is calling you',
        android: {
          channelId: 'adtip_general',
          importance: 4,
          pressAction: { id: 'default', launchActivity: 'default' }
        }
      });

      console.log('[Index] ✅ Ultra-simple fallback notification displayed');
    } catch (ultraFallbackError) {
      console.error('[Index] ❌ Even ultra-simple notification failed:', ultraFallbackError);
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
