import FCMMessageRouter from '../../Adtip/src/services/FCMMessageRouter'
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'

// Mock handlers
const mockCallHandler = {
  canHandle: jest.fn(),
  handle: jest.fn(),
  priority: 100
}

const mockChatHandler = {
  canHandle: jest.fn(),
  handle: jest.fn(),
  priority: 50
}

const mockNotificationHandler = {
  canHandle: jest.fn(),
  handle: jest.fn(),
  priority: 10
}

// Mock dynamic imports
jest.mock('../../Adtip/src/services/calling/CallFCMHandler', () => ({
  CallFCMHandler: jest.fn(() => mockCallHandler)
}))

jest.mock('../../Adtip/src/services/chat/ChatFCMHandler', () => ({
  ChatFCMHandler: jest.fn(() => mockChatHandler)
}))

jest.mock('../../Adtip/src/services/notification/NotificationFCMHandler', () => ({
  NotificationFCMHandler: jest.fn(() => mockNotificationHandler)
}))

describe('FCMMessageRouter', () => {
  let router: FCMMessageRouter

  beforeEach(() => {
    router = FCMMessageRouter.getInstance()
    
    // Reset singleton for testing
    ;(FCMMessageRouter as any).instance = null
    router = FCMMessageRouter.getInstance()

    jest.clearAllMocks()
  })

  describe('initialization', () => {
    it('should be a singleton', () => {
      const instance1 = FCMMessageRouter.getInstance()
      const instance2 = FCMMessageRouter.getInstance()
      expect(instance1).toBe(instance2)
    })

    it('should initialize successfully', async () => {
      await expect(router.initialize()).resolves.not.toThrow()
      expect(router.isReady()).toBe(true)
    })

    it('should not initialize twice', async () => {
      await router.initialize()
      const firstReady = router.isReady()
      
      await router.initialize()
      const secondReady = router.isReady()
      
      expect(firstReady).toBe(true)
      expect(secondReady).toBe(true)
    })
  })

  describe('message routing', () => {
    beforeEach(async () => {
      await router.initialize()
    })

    it('should route call messages to CallFCMHandler', async () => {
      const message: FirebaseMessagingTypes.RemoteMessage = {
        messageId: 'test-123',
        data: { type: 'CALL_INITIATED' }
      }

      mockCallHandler.canHandle.mockReturnValue(true)
      mockChatHandler.canHandle.mockReturnValue(false)
      mockNotificationHandler.canHandle.mockReturnValue(true)

      await router.routeMessage(message, 'foreground')

      expect(mockCallHandler.canHandle).toHaveBeenCalledWith(message)
      expect(mockCallHandler.handle).toHaveBeenCalledWith(message, 'foreground')
      expect(mockChatHandler.handle).not.toHaveBeenCalled()
      expect(mockNotificationHandler.handle).not.toHaveBeenCalled()
    })

    it('should route chat messages to ChatFCMHandler', async () => {
      const message: FirebaseMessagingTypes.RemoteMessage = {
        messageId: 'test-123',
        data: { type: 'chat_message' }
      }

      mockCallHandler.canHandle.mockReturnValue(false)
      mockChatHandler.canHandle.mockReturnValue(true)
      mockNotificationHandler.canHandle.mockReturnValue(true)

      await router.routeMessage(message, 'foreground')

      expect(mockChatHandler.canHandle).toHaveBeenCalledWith(message)
      expect(mockChatHandler.handle).toHaveBeenCalledWith(message, 'foreground')
      expect(mockCallHandler.handle).not.toHaveBeenCalled()
      expect(mockNotificationHandler.handle).not.toHaveBeenCalled()
    })

    it('should route unknown messages to NotificationFCMHandler', async () => {
      const message: FirebaseMessagingTypes.RemoteMessage = {
        messageId: 'test-123',
        data: { type: 'unknown_type' }
      }

      mockCallHandler.canHandle.mockReturnValue(false)
      mockChatHandler.canHandle.mockReturnValue(false)
      mockNotificationHandler.canHandle.mockReturnValue(true)

      await router.routeMessage(message, 'foreground')

      expect(mockNotificationHandler.canHandle).toHaveBeenCalledWith(message)
      expect(mockNotificationHandler.handle).toHaveBeenCalledWith(message, 'foreground')
      expect(mockCallHandler.handle).not.toHaveBeenCalled()
      expect(mockChatHandler.handle).not.toHaveBeenCalled()
    })

    it('should respect handler priority order', async () => {
      const message: FirebaseMessagingTypes.RemoteMessage = {
        messageId: 'test-123',
        data: { type: 'ambiguous_type' }
      }

      // All handlers can handle the message
      mockCallHandler.canHandle.mockReturnValue(true)
      mockChatHandler.canHandle.mockReturnValue(true)
      mockNotificationHandler.canHandle.mockReturnValue(true)

      await router.routeMessage(message, 'foreground')

      // Should route to highest priority handler (CallFCMHandler)
      expect(mockCallHandler.handle).toHaveBeenCalledWith(message, 'foreground')
      expect(mockChatHandler.handle).not.toHaveBeenCalled()
      expect(mockNotificationHandler.handle).not.toHaveBeenCalled()
    })

    it('should handle background context', async () => {
      const message: FirebaseMessagingTypes.RemoteMessage = {
        messageId: 'test-123',
        data: { type: 'CALL_INITIATED' }
      }

      mockCallHandler.canHandle.mockReturnValue(true)

      await router.routeMessage(message, 'background')

      expect(mockCallHandler.handle).toHaveBeenCalledWith(message, 'background')
    })

    it('should prevent concurrent message processing', async () => {
      const message1: FirebaseMessagingTypes.RemoteMessage = {
        messageId: 'test-123',
        data: { type: 'CALL_INITIATED' }
      }

      const message2: FirebaseMessagingTypes.RemoteMessage = {
        messageId: 'test-456',
        data: { type: 'CALL_INITIATED' }
      }

      mockCallHandler.canHandle.mockReturnValue(true)
      mockCallHandler.handle.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      // Start processing first message
      const promise1 = router.routeMessage(message1, 'foreground')
      
      // Try to process second message immediately
      const promise2 = router.routeMessage(message2, 'foreground')

      await Promise.all([promise1, promise2])

      // Both should complete successfully
      expect(mockCallHandler.handle).toHaveBeenCalledTimes(2)
    })
  })

  describe('error handling', () => {
    beforeEach(async () => {
      await router.initialize()
    })

    it('should handle handler errors gracefully', async () => {
      const message: FirebaseMessagingTypes.RemoteMessage = {
        messageId: 'test-123',
        data: { type: 'CALL_INITIATED' }
      }

      mockCallHandler.canHandle.mockReturnValue(true)
      mockCallHandler.handle.mockRejectedValue(new Error('Handler failed'))

      await expect(router.routeMessage(message, 'foreground')).resolves.not.toThrow()
    })

    it('should handle no matching handler gracefully', async () => {
      const message: FirebaseMessagingTypes.RemoteMessage = {
        messageId: 'test-123',
        data: { type: 'unknown_type' }
      }

      mockCallHandler.canHandle.mockReturnValue(false)
      mockChatHandler.canHandle.mockReturnValue(false)
      mockNotificationHandler.canHandle.mockReturnValue(false)

      await expect(router.routeMessage(message, 'foreground')).resolves.not.toThrow()
    })

    it('should handle malformed messages gracefully', async () => {
      const message: FirebaseMessagingTypes.RemoteMessage = {
        messageId: 'test-123',
        data: null as any
      }

      await expect(router.routeMessage(message, 'foreground')).resolves.not.toThrow()
    })
  })

  describe('message classification', () => {
    it('should classify call messages correctly', () => {
      const message: FirebaseMessagingTypes.RemoteMessage = {
        messageId: 'test-123',
        data: { type: 'CALL_INITIATED' }
      }

      const result = FCMMessageRouter.classifyMessage(message)

      expect(result).toEqual({
        type: 'call',
        subtype: 'CALL_INITIATED',
        payload: { type: 'CALL_INITIATED' }
      })
    })

    it('should classify chat messages correctly', () => {
      const message: FirebaseMessagingTypes.RemoteMessage = {
        messageId: 'test-123',
        data: { type: 'chat_message' },
        notification: { title: 'New Message', body: 'Hello!' }
      }

      const result = FCMMessageRouter.classifyMessage(message)

      expect(result).toEqual({
        type: 'chat',
        subtype: 'chat_message',
        payload: {
          type: 'chat_message',
          notification: { title: 'New Message', body: 'Hello!' }
        }
      })
    })

    it('should classify unknown messages as notifications', () => {
      const message: FirebaseMessagingTypes.RemoteMessage = {
        messageId: 'test-123',
        data: { type: 'unknown_type' }
      }

      const result = FCMMessageRouter.classifyMessage(message)

      expect(result).toEqual({
        type: 'notification',
        subtype: 'unknown_type',
        payload: { type: 'unknown_type', notification: undefined }
      })
    })

    it('should handle info field format', () => {
      const message: FirebaseMessagingTypes.RemoteMessage = {
        messageId: 'test-123',
        data: {
          info: JSON.stringify({ type: 'CALL_INITIATED' })
        }
      }

      const result = FCMMessageRouter.classifyMessage(message)

      expect(result.type).toBe('call')
      expect(result.subtype).toBe('CALL_INITIATED')
    })
  })

  describe('utility methods', () => {
    beforeEach(async () => {
      await router.initialize()
    })

    it('should return registered handlers', () => {
      const handlers = router.getHandlers()
      expect(handlers).toHaveLength(3)
      expect(handlers[0].priority).toBe(100) // CallFCMHandler
      expect(handlers[1].priority).toBe(50)  // ChatFCMHandler
      expect(handlers[2].priority).toBe(10)  // NotificationFCMHandler
    })

    it('should extract message type correctly', () => {
      const message1: FirebaseMessagingTypes.RemoteMessage = {
        messageId: 'test-123',
        data: { type: 'CALL_INITIATED' }
      }

      const message2: FirebaseMessagingTypes.RemoteMessage = {
        messageId: 'test-456',
        data: {
          info: JSON.stringify({ type: 'CALL_INITIATED' })
        }
      }

      const type1 = (router as any).extractMessageType(message1)
      const type2 = (router as any).extractMessageType(message2)

      expect(type1).toBe('CALL_INITIATED')
      expect(type2).toBe('CALL_INITIATED')
    })
  })
})
