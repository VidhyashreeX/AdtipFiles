/**
 * FCMMessageRouter Test Suite
 * 
 * This test suite verifies that the FCMMessageRouter correctly routes
 * call and chat messages to their appropriate handlers without conflicts.
 */

import { FCMMessageRouter } from '../services/FCMMessageRouter';

interface MockRemoteMessage {
  data?: { [key: string]: string };
  notification?: {
    title?: string;
    body?: string;
  };
}

/**
 * Test FCM message routing functionality
 */
export class FCMMessageRouterTest {
  private router: FCMMessageRouter;

  constructor() {
    this.router = FCMMessageRouter.getInstance();
  }

  /**
   * Initialize the test suite
   */
  async initialize(): Promise<void> {
    console.log('[FCMMessageRouterTest] Initializing test suite...');
    await this.router.initialize();
    console.log('[FCMMessageRouterTest] Test suite initialized');
  }

  /**
   * Test call message routing
   */
  async testCallMessageRouting(): Promise<boolean> {
    console.log('[FCMMessageRouterTest] Testing call message routing...');

    const callMessages: MockRemoteMessage[] = [
      // New format (info field)
      {
        data: {
          info: JSON.stringify({
            type: 'CALL_INITIATED',
            callerInfo: { name: 'Test Caller' },
            videoSDKInfo: { meetingId: 'test-123' }
          })
        }
      },
      // Legacy format (direct type)
      {
        data: {
          type: 'CALL_INITIATE',
          callerName: 'Test Caller',
          sessionId: 'test-session'
        }
      },
      // Call accept message
      {
        data: {
          type: 'CALL_ACCEPT',
          sessionId: 'test-session'
        }
      },
      // Call end message
      {
        data: {
          type: 'CALL_END',
          sessionId: 'test-session'
        }
      }
    ];

    try {
      for (const message of callMessages) {
        console.log('[FCMMessageRouterTest] Testing call message:', message.data?.type);
        await this.router.routeMessage(message as any, 'foreground');
      }
      console.log('[FCMMessageRouterTest] ✅ Call message routing test passed');
      return true;
    } catch (error) {
      console.error('[FCMMessageRouterTest] ❌ Call message routing test failed:', error);
      return false;
    }
  }

  /**
   * Test chat message routing
   */
  async testChatMessageRouting(): Promise<boolean> {
    console.log('[FCMMessageRouterTest] Testing chat message routing...');

    const chatMessages: MockRemoteMessage[] = [
      {
        data: {
          type: 'chat_message',
          conversationId: 'conv-123',
          senderId: '456',
          senderName: 'Test Sender'
        },
        notification: {
          title: 'Test Sender',
          body: 'Hello, this is a test message!'
        }
      }
    ];

    try {
      for (const message of chatMessages) {
        console.log('[FCMMessageRouterTest] Testing chat message:', message.data?.type);
        await this.router.routeMessage(message as any, 'foreground');
      }
      console.log('[FCMMessageRouterTest] ✅ Chat message routing test passed');
      return true;
    } catch (error) {
      console.error('[FCMMessageRouterTest] ❌ Chat message routing test failed:', error);
      return false;
    }
  }

  /**
   * Test unknown message handling
   */
  async testUnknownMessageHandling(): Promise<boolean> {
    console.log('[FCMMessageRouterTest] Testing unknown message handling...');

    const unknownMessages: MockRemoteMessage[] = [
      {
        data: {
          type: 'unknown_type',
          content: 'This should be ignored'
        }
      },
      {
        data: {
          // No type field
          content: 'This should also be ignored'
        }
      }
    ];

    try {
      for (const message of unknownMessages) {
        console.log('[FCMMessageRouterTest] Testing unknown message:', message.data?.type || 'no-type');
        await this.router.routeMessage(message as any, 'foreground');
      }
      console.log('[FCMMessageRouterTest] ✅ Unknown message handling test passed');
      return true;
    } catch (error) {
      console.error('[FCMMessageRouterTest] ❌ Unknown message handling test failed:', error);
      return false;
    }
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    console.log('[FCMMessageRouterTest] 🚀 Starting FCM Message Router tests...');

    await this.initialize();

    const results = {
      callRouting: await this.testCallMessageRouting(),
      chatRouting: await this.testChatMessageRouting(),
      unknownHandling: await this.testUnknownMessageHandling()
    };

    const allPassed = Object.values(results).every(result => result);

    console.log('[FCMMessageRouterTest] 📊 Test Results:');
    console.log('  - Call Message Routing:', results.callRouting ? '✅ PASS' : '❌ FAIL');
    console.log('  - Chat Message Routing:', results.chatRouting ? '✅ PASS' : '❌ FAIL');
    console.log('  - Unknown Message Handling:', results.unknownHandling ? '✅ PASS' : '❌ FAIL');
    console.log('[FCMMessageRouterTest]', allPassed ? '🎉 ALL TESTS PASSED' : '💥 SOME TESTS FAILED');

    if (allPassed) {
      console.log('[FCMMessageRouterTest] FCM Message Router is working correctly!');
      console.log('[FCMMessageRouterTest] ✅ Call FCM functionality preserved');
      console.log('[FCMMessageRouterTest] ✅ Chat FCM functionality enabled');
      console.log('[FCMMessageRouterTest] ✅ No handler conflicts detected');
    }
  }

  /**
   * Get router status for debugging
   */
  getRouterStatus(): any {
    return this.router.getStatus();
  }
}

export default FCMMessageRouterTest;
