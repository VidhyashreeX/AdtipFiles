/**
 * FCM Killed State Test Script
 * 
 * This script helps test FCM notifications when the app is in killed state.
 * Run this from a Node.js environment with Firebase Admin SDK configured.
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Make sure to set up your service account key
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    // Or use service account key:
    // credential: admin.credential.cert(require('./path/to/serviceAccountKey.json')),
  });
}

/**
 * Send test call notification
 * @param {string} fcmToken - Device FCM token
 * @param {object} callData - Call data to send
 */
async function sendTestCallNotification(fcmToken, callData = {}) {
  const defaultCallData = {
    type: 'incoming_call',
    sessionId: `test-session-${Date.now()}`,
    callerName: 'Test Caller',
    callType: 'voice',
    meetingId: `test-meeting-${Date.now()}`,
    token: `test-token-${Date.now()}`,
    timestamp: Date.now().toString()
  };

  const finalCallData = { ...defaultCallData, ...callData };

  console.log('🚀 Sending test call notification...');
  console.log('📱 Target FCM Token:', fcmToken.substring(0, 20) + '...');
  console.log('📞 Call Data:', finalCallData);

  try {
    const message = {
      token: fcmToken,
      data: finalCallData,
      // Note: We use data-only messages for killed state testing
      // The unified background handler will create the notification
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Message sent successfully:', response);
    return response;
  } catch (error) {
    console.error('❌ Error sending message:', error);
    throw error;
  }
}

/**
 * Send test chat notification
 * @param {string} fcmToken - Device FCM token
 * @param {object} chatData - Chat data to send
 */
async function sendTestChatNotification(fcmToken, chatData = {}) {
  const defaultChatData = {
    type: 'chat_message',
    conversationId: `test-conv-${Date.now()}`,
    senderId: 'test-sender',
    senderName: 'Test Sender',
    content: 'This is a test chat message',
    timestamp: Date.now().toString()
  };

  const finalChatData = { ...defaultChatData, ...chatData };

  console.log('💬 Sending test chat notification...');
  console.log('📱 Target FCM Token:', fcmToken.substring(0, 20) + '...');
  console.log('💬 Chat Data:', finalChatData);

  try {
    const message = {
      token: fcmToken,
      data: finalChatData,
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Chat message sent successfully:', response);
    return response;
  } catch (error) {
    console.error('❌ Error sending chat message:', error);
    throw error;
  }
}

/**
 * Send test general notification
 * @param {string} fcmToken - Device FCM token
 * @param {object} notificationData - Notification data to send
 */
async function sendTestGeneralNotification(fcmToken, notificationData = {}) {
  const defaultData = {
    type: 'general',
    title: 'Test Notification',
    body: 'This is a test notification for killed state',
    timestamp: Date.now().toString()
  };

  const finalData = { ...defaultData, ...notificationData };

  console.log('📢 Sending test general notification...');
  console.log('📱 Target FCM Token:', fcmToken.substring(0, 20) + '...');
  console.log('📢 Notification Data:', finalData);

  try {
    const message = {
      token: fcmToken,
      data: finalData,
      notification: {
        title: finalData.title,
        body: finalData.body
      }
    };

    const response = await admin.messaging().send(message);
    console.log('✅ General notification sent successfully:', response);
    return response;
  } catch (error) {
    console.error('❌ Error sending general notification:', error);
    throw error;
  }
}

/**
 * Run comprehensive test suite
 * @param {string} fcmToken - Device FCM token
 */
async function runTestSuite(fcmToken) {
  console.log('🧪 Starting FCM Killed State Test Suite');
  console.log('=' .repeat(50));

  try {
    // Test 1: Voice Call
    console.log('\n📞 Test 1: Voice Call Notification');
    await sendTestCallNotification(fcmToken, {
      callType: 'voice',
      callerName: 'Voice Test Caller'
    });
    await delay(3000);

    // Test 2: Video Call
    console.log('\n📹 Test 2: Video Call Notification');
    await sendTestCallNotification(fcmToken, {
      callType: 'video',
      callerName: 'Video Test Caller'
    });
    await delay(3000);

    // Test 3: Chat Message
    console.log('\n💬 Test 3: Chat Message');
    await sendTestChatNotification(fcmToken, {
      senderName: 'Test Chat Sender',
      content: 'Hello! This is a test chat message.'
    });
    await delay(3000);

    // Test 4: General Notification
    console.log('\n📢 Test 4: General Notification');
    await sendTestGeneralNotification(fcmToken, {
      title: 'Test Alert',
      body: 'This is a general test notification'
    });

    console.log('\n✅ All tests completed successfully!');
    console.log('\n📋 Testing Instructions:');
    console.log('1. Make sure your app is completely killed (swipe away from recent apps)');
    console.log('2. Wait for notifications to appear');
    console.log('3. Test notification actions (Answer/Decline for calls)');
    console.log('4. Verify deep linking works when tapping notifications');
    console.log('5. Check that notifications appear on lock screen');

  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

/**
 * Utility function to add delay between tests
 * @param {number} ms - Milliseconds to delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Example usage:
// Replace 'YOUR_DEVICE_FCM_TOKEN' with actual device token
const DEVICE_FCM_TOKEN = 'YOUR_DEVICE_FCM_TOKEN';

if (require.main === module) {
  if (DEVICE_FCM_TOKEN === 'YOUR_DEVICE_FCM_TOKEN') {
    console.log('❌ Please set a valid FCM token in DEVICE_FCM_TOKEN variable');
    console.log('💡 You can get the FCM token from your app logs or Firebase console');
    process.exit(1);
  }

  runTestSuite(DEVICE_FCM_TOKEN)
    .then(() => {
      console.log('\n🎉 Test suite execution completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = {
  sendTestCallNotification,
  sendTestChatNotification,
  sendTestGeneralNotification,
  runTestSuite
};
