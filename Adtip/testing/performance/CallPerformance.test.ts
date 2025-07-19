import { performance } from 'perf_hooks'
import { CallFCMHandler } from '../../Adtip/src/services/calling/CallFCMHandler'
import { CallUICoordinator } from '../../Adtip/src/services/calling/CallUICoordinator'
import FCMMessageRouter from '../../Adtip/src/services/FCMMessageRouter'
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'

// Mock dependencies for performance testing
jest.mock('../../Adtip/src/services/calling/CallKeepService')
jest.mock('../../Adtip/src/services/calling/NotificationService')
jest.mock('../../Adtip/src/stores/callStoreSimplified')

describe('Call Performance Tests', () => {
  let fcmRouter: FCMMessageRouter
  let callHandler: CallFCMHandler
  let uiCoordinator: CallUICoordinator

  beforeEach(async () => {
    // Reset singletons
    ;(FCMMessageRouter as any).instance = null
    ;(CallUICoordinator as any).instance = null

    fcmRouter = FCMMessageRouter.getInstance()
    callHandler = new CallFCMHandler()
    uiCoordinator = CallUICoordinator.getInstance()

    await fcmRouter.initialize()
    await uiCoordinator.initialize()

    jest.clearAllMocks()
  })

  describe('FCM Message Processing Performance', () => {
    const createTestMessage = (id: string): FirebaseMessagingTypes.RemoteMessage => ({
      messageId: `test-${id}`,
      data: {
        type: 'CALL_INITIATED',
        sessionId: `session-${id}`,
        meetingId: `meeting-${id}`,
        token: `token-${id}`,
        callerName: `Caller ${id}`,
        callType: 'video'
      }
    })

    it('should process single FCM message within 100ms', async () => {
      const message = createTestMessage('single')
      
      const startTime = performance.now()
      await fcmRouter.routeMessage(message, 'foreground')
      const endTime = performance.now()
      
      const processingTime = endTime - startTime
      expect(processingTime).toBeLessThan(100) // 100ms threshold
    })

    it('should process 100 FCM messages within 5 seconds', async () => {
      const messages = Array.from({ length: 100 }, (_, i) => createTestMessage(i.toString()))
      
      const startTime = performance.now()
      
      await Promise.all(
        messages.map(message => fcmRouter.routeMessage(message, 'foreground'))
      )
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      expect(totalTime).toBeLessThan(5000) // 5 second threshold
      
      const averageTime = totalTime / messages.length
      expect(averageTime).toBeLessThan(50) // 50ms average per message
    })

    it('should handle rapid sequential messages efficiently', async () => {
      const messageCount = 50
      const messages = Array.from({ length: messageCount }, (_, i) => createTestMessage(i.toString()))
      
      const startTime = performance.now()
      
      // Process messages sequentially (simulating rapid FCM delivery)
      for (const message of messages) {
        await fcmRouter.routeMessage(message, 'foreground')
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      expect(totalTime).toBeLessThan(2500) // 2.5 seconds for 50 messages
    })
  })

  describe('CallUICoordinator Performance', () => {
    const callOptions = {
      sessionId: 'perf-session',
      callerName: 'Performance Test',
      callType: 'video' as const,
      meetingId: 'perf-meeting',
      token: 'perf-token'
    }

    it('should show incoming call UI within 200ms', async () => {
      const mockCallKeepService = {
        initialize: jest.fn().mockResolvedValue(undefined),
        isAvailable: jest.fn().mockReturnValue(true),
        displayIncomingCall: jest.fn().mockResolvedValue(true)
      }
      ;(uiCoordinator as any).callKeepService = mockCallKeepService

      const startTime = performance.now()
      await uiCoordinator.showIncomingCall(callOptions)
      const endTime = performance.now()
      
      const displayTime = endTime - startTime
      expect(displayTime).toBeLessThan(200) // 200ms threshold
    })

    it('should end call and cleanup within 100ms', async () => {
      // Set up active call state
      ;(uiCoordinator as any).currentState = {
        isCallKeepActive: true,
        isCustomUIActive: false,
        activeSessionId: 'perf-session',
        uiType: 'callkeep'
      }

      const mockCallKeepService = {
        endCall: jest.fn()
      }
      ;(uiCoordinator as any).callKeepService = mockCallKeepService

      const startTime = performance.now()
      await uiCoordinator.endCall('perf-session')
      const endTime = performance.now()
      
      const cleanupTime = endTime - startTime
      expect(cleanupTime).toBeLessThan(100) // 100ms threshold
    })

    it('should handle multiple simultaneous call requests efficiently', async () => {
      const mockCallKeepService = {
        initialize: jest.fn().mockResolvedValue(undefined),
        isAvailable: jest.fn().mockReturnValue(true),
        displayIncomingCall: jest.fn().mockResolvedValue(true)
      }
      ;(uiCoordinator as any).callKeepService = mockCallKeepService

      const callCount = 10
      const callPromises = Array.from({ length: callCount }, (_, i) => 
        uiCoordinator.showIncomingCall({
          ...callOptions,
          sessionId: `perf-session-${i}`
        })
      )

      const startTime = performance.now()
      await Promise.all(callPromises)
      const endTime = performance.now()
      
      const totalTime = endTime - startTime
      expect(totalTime).toBeLessThan(1000) // 1 second for 10 calls
    })
  })

  describe('Memory Usage Performance', () => {
    it('should not leak memory during repeated call cycles', async () => {
      const mockCallKeepService = {
        initialize: jest.fn().mockResolvedValue(undefined),
        isAvailable: jest.fn().mockReturnValue(true),
        displayIncomingCall: jest.fn().mockResolvedValue(true),
        endCall: jest.fn()
      }
      ;(uiCoordinator as any).callKeepService = mockCallKeepService

      // Measure initial memory (if available)
      const initialMemory = process.memoryUsage?.()?.heapUsed || 0

      // Perform 100 call cycles
      for (let i = 0; i < 100; i++) {
        await uiCoordinator.showIncomingCall({
          sessionId: `memory-test-${i}`,
          callerName: `Memory Test ${i}`,
          callType: 'video'
        })

        await uiCoordinator.endCall(`memory-test-${i}`)
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      // Measure final memory
      const finalMemory = process.memoryUsage?.()?.heapUsed || 0
      const memoryIncrease = finalMemory - initialMemory

      // Memory increase should be minimal (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    })

    it('should handle large FCM payloads efficiently', async () => {
      // Create message with large payload
      const largePayload = {
        type: 'CALL_INITIATED',
        sessionId: 'large-payload-test',
        meetingId: 'large-meeting',
        token: 'x'.repeat(1000), // 1KB token
        callerName: 'Large Payload Test',
        callType: 'video',
        metadata: JSON.stringify({
          largeData: 'x'.repeat(10000) // 10KB metadata
        })
      }

      const message: FirebaseMessagingTypes.RemoteMessage = {
        messageId: 'large-payload',
        data: largePayload
      }

      const startTime = performance.now()
      await fcmRouter.routeMessage(message, 'foreground')
      const endTime = performance.now()
      
      const processingTime = endTime - startTime
      expect(processingTime).toBeLessThan(500) // 500ms threshold for large payload
    })
  })

  describe('Concurrent Operations Performance', () => {
    it('should handle concurrent FCM routing and UI operations', async () => {
      const mockCallKeepService = {
        initialize: jest.fn().mockResolvedValue(undefined),
        isAvailable: jest.fn().mockReturnValue(true),
        displayIncomingCall: jest.fn().mockResolvedValue(true)
      }
      ;(uiCoordinator as any).callKeepService = mockCallKeepService

      const concurrentOperations = []

      // Start multiple FCM message processing
      for (let i = 0; i < 20; i++) {
        const message: FirebaseMessagingTypes.RemoteMessage = {
          messageId: `concurrent-${i}`,
          data: {
            type: 'CALL_INITIATED',
            sessionId: `concurrent-session-${i}`,
            callerName: `Concurrent Caller ${i}`,
            callType: 'video'
          }
        }
        concurrentOperations.push(fcmRouter.routeMessage(message, 'foreground'))
      }

      // Start multiple UI operations
      for (let i = 0; i < 10; i++) {
        concurrentOperations.push(
          uiCoordinator.showIncomingCall({
            sessionId: `ui-concurrent-${i}`,
            callerName: `UI Concurrent ${i}`,
            callType: 'video'
          })
        )
      }

      const startTime = performance.now()
      await Promise.all(concurrentOperations)
      const endTime = performance.now()
      
      const totalTime = endTime - startTime
      expect(totalTime).toBeLessThan(3000) // 3 seconds for all concurrent operations
    })

    it('should maintain performance under stress conditions', async () => {
      const stressTestDuration = 5000 // 5 seconds
      const startTime = performance.now()
      let operationCount = 0

      // Run stress test for specified duration
      while (performance.now() - startTime < stressTestDuration) {
        const message: FirebaseMessagingTypes.RemoteMessage = {
          messageId: `stress-${operationCount}`,
          data: {
            type: 'CALL_INITIATED',
            sessionId: `stress-session-${operationCount}`,
            callerName: `Stress Test ${operationCount}`,
            callType: 'video'
          }
        }

        await fcmRouter.routeMessage(message, 'foreground')
        operationCount++
      }

      const endTime = performance.now()
      const actualDuration = endTime - startTime
      const operationsPerSecond = operationCount / (actualDuration / 1000)

      // Should handle at least 50 operations per second
      expect(operationsPerSecond).toBeGreaterThan(50)
    })
  })

  describe('Initialization Performance', () => {
    it('should initialize FCMMessageRouter quickly', async () => {
      // Reset singleton
      ;(FCMMessageRouter as any).instance = null
      const router = FCMMessageRouter.getInstance()

      const startTime = performance.now()
      await router.initialize()
      const endTime = performance.now()
      
      const initTime = endTime - startTime
      expect(initTime).toBeLessThan(1000) // 1 second threshold
    })

    it('should initialize CallUICoordinator quickly', async () => {
      // Reset singleton
      ;(CallUICoordinator as any).instance = null
      const coordinator = CallUICoordinator.getInstance()

      const startTime = performance.now()
      await coordinator.initialize()
      const endTime = performance.now()
      
      const initTime = endTime - startTime
      expect(initTime).toBeLessThan(500) // 500ms threshold
    })
  })
})
