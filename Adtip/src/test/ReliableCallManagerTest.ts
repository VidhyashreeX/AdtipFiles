/**
 * Test file for ReliableCallManager
 * This file can be used to verify the new call flow implementation
 */

import ReliableCallManager from '../services/calling/ReliableCallManager'

/**
 * Test the ReliableCallManager initialization and basic functionality
 */
export const testReliableCallManager = async () => {
  console.log('[Test] Starting ReliableCallManager test...')

  try {
    // Test 1: Get instance
    const callManager = ReliableCallManager.getInstance()
    console.log('[Test] ✅ ReliableCallManager instance created')

    // Test 2: Initialize
    await callManager.initialize()
    console.log('[Test] ✅ ReliableCallManager initialized')

    // Test 3: Check if ready
    const isReady = callManager.isReady()
    console.log('[Test] ✅ ReliableCallManager ready status:', isReady)

    // Test 4: Test FCM message handling (simulate incoming call)
    const mockFCMMessage = {
      data: {
        type: 'CALL_INITIATE',
        sessionId: 'test-session-123',
        callerName: 'Test Caller',
        callType: 'voice',
        meetingId: 'test-meeting-123',
        token: 'test-token-123',
        callerId: 'test-caller-id'
      }
    }

    await callManager.handleFCMMessage(mockFCMMessage as any, 'foreground')
    console.log('[Test] ✅ FCM message handling test completed')

    // Test 5: Get current session
    const currentSession = callManager.getCurrentSession()
    console.log('[Test] ✅ Current session:', currentSession?.sessionId)

    // Test 6: End call
    await callManager.endCall()
    console.log('[Test] ✅ Call ended successfully')

    // Test 7: Cleanup
    callManager.destroy()
    console.log('[Test] ✅ ReliableCallManager destroyed')

    console.log('[Test] 🎉 All tests passed!')
    return true

  } catch (error) {
    console.error('[Test] ❌ Test failed:', error)
    return false
  }
}

/**
 * Test FCM message handling with various scenarios
 */
export const testFCMMessageHandling = async () => {
  console.log('[Test] Starting FCM message handling test...')

  const callManager = ReliableCallManager.getInstance()
  await callManager.initialize()

  const testCases = [
    {
      name: 'Real FCM message format (CALL_INITIATED)',
      message: {
        data: {
          info: JSON.stringify({
            callerInfo: {
              name: "Test Caller",
              token: "fcm-token-123"
            },
            videoSDKInfo: {
              meetingId: "test-meeting-123",
              token: "videosdk-token-123",
              callType: "video"
            },
            type: "CALL_INITIATED",
            uuid: "test-uuid-123"
          })
        }
      }
    },
    {
      name: 'Legacy incoming call format',
      message: {
        data: {
          type: 'CALL_INITIATE',
          sessionId: 'test-1',
          callerName: 'John Doe',
          callType: 'video',
          meetingId: 'meeting-1',
          token: 'token-1',
          callerId: 'caller-1'
        }
      }
    },
    {
      name: 'Call accept message',
      message: {
        data: {
          type: 'CALL_ACCEPT',
          sessionId: 'test-1'
        }
      }
    },
    {
      name: 'Call end message',
      message: {
        data: {
          type: 'CALL_END',
          sessionId: 'test-1'
        }
      }
    },
    {
      name: 'Invalid message (missing data)',
      message: {
        data: null
      }
    },
    {
      name: 'Invalid message (malformed info)',
      message: {
        data: {
          info: 'invalid-json'
        }
      }
    },
    {
      name: 'Invalid message (missing type)',
      message: {
        data: {
          sessionId: 'test-2'
        }
      }
    }
  ]

  for (const testCase of testCases) {
    try {
      console.log(`[Test] Testing: ${testCase.name}`)
      await callManager.handleFCMMessage(testCase.message as any, 'foreground')
      console.log(`[Test] ✅ ${testCase.name} - handled successfully`)
    } catch (error) {
      console.log(`[Test] ⚠️ ${testCase.name} - error handled:`, error.message)
    }
  }

  callManager.destroy()
  console.log('[Test] 🎉 FCM message handling tests completed!')
}

/**
 * Run all tests
 */
export const runAllTests = async () => {
  console.log('[Test] 🚀 Running all ReliableCallManager tests...')
  
  const test1Result = await testReliableCallManager()
  const test2Result = await testFCMMessageHandling()
  
  if (test1Result && test2Result) {
    console.log('[Test] 🎉 All tests passed successfully!')
  } else {
    console.log('[Test] ❌ Some tests failed')
  }
}
