import { CallFCMHandler } from '../../Adtip/src/services/calling/CallFCMHandler'
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'

// Mock dependencies
jest.mock('../../Adtip/src/services/calling/CallUICoordinator')
jest.mock('../../Adtip/src/stores/callStoreSimplified')

describe('CallFCMHandler', () => {
  let callHandler: CallFCMHandler
  
  beforeEach(() => {
    callHandler = new CallFCMHandler()
    jest.clearAllMocks()
  })

  describe('canHandle', () => {
    it('should handle CALL_INITIATED messages', () => {
      const message: FirebaseMessagingTypes.RemoteMessage = {
        messageId: 'test-123',
        data: {
          type: 'CALL_INITIATED'
        }
      }

      expect(callHandler.canHandle(message)).toBe(true)
    })

    it('should handle CALL_INITIATE messages', () => {
      const message: FirebaseMessagingTypes.RemoteMessage = {
        messageId: 'test-123',
        data: {
          type: 'CALL_INITIATE'
        }
      }

      expect(callHandler.canHandle(message)).toBe(true)
    })

    it('should handle messages with info field format', () => {
      const message: FirebaseMessagingTypes.RemoteMessage = {
        messageId: 'test-123',
        data: {
          info: JSON.stringify({ type: 'CALL_INITIATED' })
        }
      }

      expect(callHandler.canHandle(message)).toBe(true)
    })

    it('should not handle non-call messages', () => {
      const message: FirebaseMessagingTypes.RemoteMessage = {
        messageId: 'test-123',
        data: {
          type: 'chat_message'
        }
      }

      expect(callHandler.canHandle(message)).toBe(false)
    })

    it('should not handle messages without type', () => {
      const message: FirebaseMessagingTypes.RemoteMessage = {
        messageId: 'test-123',
        data: {}
      }

      expect(callHandler.canHandle(message)).toBe(false)
    })
  })

  describe('handle', () => {
    it('should handle incoming call messages', async () => {
      const message: FirebaseMessagingTypes.RemoteMessage = {
        messageId: 'test-123',
        data: {
          type: 'CALL_INITIATED',
          sessionId: 'session-123',
          meetingId: 'meeting-456',
          token: 'token-789',
          callerName: 'John Doe',
          callerId: 'caller-123',
          callType: 'video'
        }
      }

      await expect(callHandler.handle(message, 'foreground')).resolves.not.toThrow()
    })

    it('should handle call accepted messages', async () => {
      const message: FirebaseMessagingTypes.RemoteMessage = {
        messageId: 'test-123',
        data: {
          type: 'CALL_ACCEPTED',
          sessionId: 'session-123',
          meetingId: 'meeting-456',
          token: 'token-789'
        }
      }

      await expect(callHandler.handle(message, 'foreground')).resolves.not.toThrow()
    })

    it('should handle call ended messages', async () => {
      const message: FirebaseMessagingTypes.RemoteMessage = {
        messageId: 'test-123',
        data: {
          type: 'CALL_ENDED',
          sessionId: 'session-123'
        }
      }

      await expect(callHandler.handle(message, 'foreground')).resolves.not.toThrow()
    })

    it('should handle invalid call data gracefully', async () => {
      const message: FirebaseMessagingTypes.RemoteMessage = {
        messageId: 'test-123',
        data: {
          type: 'CALL_INITIATED'
          // Missing required fields
        }
      }

      await expect(callHandler.handle(message, 'foreground')).resolves.not.toThrow()
    })

    it('should handle malformed info field gracefully', async () => {
      const message: FirebaseMessagingTypes.RemoteMessage = {
        messageId: 'test-123',
        data: {
          info: 'invalid-json'
        }
      }

      await expect(callHandler.handle(message, 'foreground')).resolves.not.toThrow()
    })
  })

  describe('parseCallData', () => {
    it('should parse new format (info field) correctly', () => {
      const message: FirebaseMessagingTypes.RemoteMessage = {
        messageId: 'test-123',
        data: {
          info: JSON.stringify({
            uuid: 'session-123',
            videoSDKInfo: {
              meetingId: 'meeting-456',
              token: 'token-789',
              callType: 'video'
            },
            callerInfo: {
              name: 'John Doe',
              id: 'caller-123'
            }
          })
        }
      }

      const result = (callHandler as any).parseCallData(message)
      
      expect(result).toEqual({
        sessionId: 'session-123',
        meetingId: 'meeting-456',
        token: 'token-789',
        callerName: 'John Doe',
        callerId: 'caller-123',
        callType: 'video',
        uuid: 'session-123'
      })
    })

    it('should parse legacy format correctly', () => {
      const message: FirebaseMessagingTypes.RemoteMessage = {
        messageId: 'test-123',
        data: {
          sessionId: 'session-123',
          meetingId: 'meeting-456',
          token: 'token-789',
          callerName: 'John Doe',
          callerId: 'caller-123',
          callType: 'video',
          uuid: 'session-123'
        }
      }

      const result = (callHandler as any).parseCallData(message)
      
      expect(result).toEqual({
        sessionId: 'session-123',
        meetingId: 'meeting-456',
        token: 'token-789',
        callerName: 'John Doe',
        callerId: 'caller-123',
        callType: 'video',
        uuid: 'session-123'
      })
    })

    it('should return null for invalid data', () => {
      const message: FirebaseMessagingTypes.RemoteMessage = {
        messageId: 'test-123',
        data: {}
      }

      const result = (callHandler as any).parseCallData(message)
      expect(result).toBeNull()
    })
  })

  describe('createCallDeepLink', () => {
    it('should create correct deep link', () => {
      const callData = {
        sessionId: 'session-123',
        meetingId: 'meeting-456',
        token: 'token-789',
        callerName: 'John Doe',
        callType: 'video'
      }

      const result = (callHandler as any).createCallDeepLink(callData)
      
      expect(result).toBe(
        'adtip://call/active/session-123/meeting-456/token-789?callerName=John+Doe&callType=video'
      )
    })

    it('should handle special characters in parameters', () => {
      const callData = {
        sessionId: 'session-123',
        meetingId: 'meeting-456',
        token: 'token/with/slashes',
        callerName: 'John & Jane',
        callType: 'video'
      }

      const result = (callHandler as any).createCallDeepLink(callData)
      
      expect(result).toContain('token%2Fwith%2Fslashes')
      expect(result).toContain('callerName=John+%26+Jane')
    })
  })
})
