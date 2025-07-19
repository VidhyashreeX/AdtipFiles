import { CallFCMHandler } from '../../Adtip/src/services/calling/CallFCMHandler'
import { CallUICoordinator } from '../../Adtip/src/services/calling/CallUICoordinator'
import FCMMessageRouter from '../../Adtip/src/services/FCMMessageRouter'
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'

// Mock external dependencies
jest.mock('@react-native-firebase/messaging')
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  Linking: {
    canOpenURL: jest.fn().mockResolvedValue(true),
    openURL: jest.fn().mockResolvedValue(true)
  },
  AppState: { currentState: 'active' }
}))

jest.mock('../../Adtip/src/services/calling/CallKeepService')
jest.mock('../../Adtip/src/services/calling/NotificationService')
jest.mock('../../Adtip/src/stores/callStoreSimplified')

describe('Call Flow Integration Tests', () => {
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

  describe('Incoming Call Flow', () => {
    const incomingCallMessage: FirebaseMessagingTypes.RemoteMessage = {
      messageId: 'call-123',
      data: {
        type: 'CALL_INITIATED',
        sessionId: 'session-123',
        meetingId: 'meeting-456',
        token: 'videosdk-token-789',
        callerName: 'John Doe',
        callerId: 'caller-123',
        callType: 'video'
      }
    }

    it('should handle complete incoming call flow', async () => {
      // Mock CallKeep as available
      const mockCallKeepService = {
        initialize: jest.fn().mockResolvedValue(undefined),
        isAvailable: jest.fn().mockReturnValue(true),
        displayIncomingCall: jest.fn().mockResolvedValue(true),
        endCall: jest.fn()
      }
      ;(uiCoordinator as any).callKeepService = mockCallKeepService

      // Process FCM message through router
      await fcmRouter.routeMessage(incomingCallMessage, 'foreground')

      // Verify CallKeep was used
      expect(mockCallKeepService.displayIncomingCall).toHaveBeenCalledWith(
        'session-123',
        'John Doe',
        'John Doe',
        'generic',
        true
      )
    })

    it('should fallback to custom UI when CallKeep unavailable', async () => {
      // Mock CallKeep as unavailable
      const mockCallKeepService = {
        initialize: jest.fn().mockResolvedValue(undefined),
        isAvailable: jest.fn().mockReturnValue(false)
      }

      const mockNotificationService = {
        showIncomingCall: jest.fn().mockResolvedValue(undefined)
      }

      ;(uiCoordinator as any).callKeepService = mockCallKeepService
      ;(uiCoordinator as any).notificationService = mockNotificationService

      // Process FCM message
      await fcmRouter.routeMessage(incomingCallMessage, 'foreground')

      // Verify custom notification was used
      expect(mockNotificationService.showIncomingCall).toHaveBeenCalledWith(
        'session-123',
        'John Doe',
        'video',
        'meeting-456',
        'videosdk-token-789'
      )
    })

    it('should handle background incoming calls', async () => {
      const mockCallKeepService = {
        initialize: jest.fn().mockResolvedValue(undefined),
        isAvailable: jest.fn().mockReturnValue(true),
        displayIncomingCall: jest.fn().mockResolvedValue(true)
      }
      ;(uiCoordinator as any).callKeepService = mockCallKeepService

      // Process background FCM message
      await fcmRouter.routeMessage(incomingCallMessage, 'background')

      // Verify CallKeep was used for background call
      expect(mockCallKeepService.displayIncomingCall).toHaveBeenCalled()
    })
  })

  describe('Call Acceptance Flow', () => {
    const callAcceptedMessage: FirebaseMessagingTypes.RemoteMessage = {
      messageId: 'accept-123',
      data: {
        type: 'CALL_ACCEPTED',
        sessionId: 'session-123',
        meetingId: 'meeting-456',
        token: 'videosdk-token-789'
      }
    }

    it('should handle call acceptance and navigation', async () => {
      const { Linking } = require('react-native')

      // Process call accepted message
      await fcmRouter.routeMessage(callAcceptedMessage, 'foreground')

      // Verify deep link navigation was triggered
      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining('adtip://call/active/session-123/meeting-456/')
      )
    })

    it('should handle malformed call acceptance data', async () => {
      const malformedMessage: FirebaseMessagingTypes.RemoteMessage = {
        messageId: 'accept-456',
        data: {
          type: 'CALL_ACCEPTED'
          // Missing required fields
        }
      }

      // Should not throw error
      await expect(fcmRouter.routeMessage(malformedMessage, 'foreground')).resolves.not.toThrow()
    })
  })

  describe('Call Termination Flow', () => {
    const callEndedMessage: FirebaseMessagingTypes.RemoteMessage = {
      messageId: 'end-123',
      data: {
        type: 'CALL_ENDED',
        sessionId: 'session-123'
      }
    }

    it('should handle call termination and cleanup', async () => {
      // Set up active call state
      const mockCallKeepService = {
        endCall: jest.fn()
      }
      const mockNotificationService = {
        clearIncomingCall: jest.fn().mockResolvedValue(undefined)
      }

      ;(uiCoordinator as any).callKeepService = mockCallKeepService
      ;(uiCoordinator as any).notificationService = mockNotificationService
      ;(uiCoordinator as any).currentState = {
        isCallKeepActive: true,
        isCustomUIActive: false,
        activeSessionId: 'session-123',
        uiType: 'callkeep'
      }

      // Process call ended message
      await fcmRouter.routeMessage(callEndedMessage, 'foreground')

      // Verify cleanup was performed
      expect(mockCallKeepService.endCall).toHaveBeenCalledWith('session-123')
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle CallKeep initialization failure gracefully', async () => {
      const mockCallKeepService = {
        initialize: jest.fn().mockRejectedValue(new Error('CallKeep init failed')),
        isAvailable: jest.fn().mockReturnValue(false)
      }

      const mockNotificationService = {
        showIncomingCall: jest.fn().mockResolvedValue(undefined)
      }

      ;(uiCoordinator as any).callKeepService = mockCallKeepService
      ;(uiCoordinator as any).notificationService = mockNotificationService

      const incomingCall: FirebaseMessagingTypes.RemoteMessage = {
        messageId: 'call-123',
        data: {
          type: 'CALL_INITIATED',
          sessionId: 'session-123',
          callerName: 'John Doe',
          callType: 'video'
        }
      }

      // Should not throw and should fallback to custom UI
      await expect(fcmRouter.routeMessage(incomingCall, 'foreground')).resolves.not.toThrow()
      expect(mockNotificationService.showIncomingCall).toHaveBeenCalled()
    })

    it('should handle network failures during call processing', async () => {
      const mockCallKeepService = {
        initialize: jest.fn().mockResolvedValue(undefined),
        isAvailable: jest.fn().mockReturnValue(true),
        displayIncomingCall: jest.fn().mockRejectedValue(new Error('Network error'))
      }

      const mockNotificationService = {
        showIncomingCall: jest.fn().mockResolvedValue(undefined)
      }

      ;(uiCoordinator as any).callKeepService = mockCallKeepService
      ;(uiCoordinator as any).notificationService = mockNotificationService

      const incomingCall: FirebaseMessagingTypes.RemoteMessage = {
        messageId: 'call-123',
        data: {
          type: 'CALL_INITIATED',
          sessionId: 'session-123',
          callerName: 'John Doe',
          callType: 'video'
        }
      }

      // Should fallback to custom UI on CallKeep failure
      await expect(fcmRouter.routeMessage(incomingCall, 'foreground')).resolves.not.toThrow()
      expect(mockNotificationService.showIncomingCall).toHaveBeenCalled()
    })
  })

  describe('State Consistency', () => {
    it('should maintain consistent state across call lifecycle', async () => {
      const mockCallKeepService = {
        initialize: jest.fn().mockResolvedValue(undefined),
        isAvailable: jest.fn().mockReturnValue(true),
        displayIncomingCall: jest.fn().mockResolvedValue(true),
        endCall: jest.fn()
      }

      ;(uiCoordinator as any).callKeepService = mockCallKeepService

      // Initial state
      expect(uiCoordinator.isCallKeepActive()).toBe(false)
      expect(uiCoordinator.getActiveSessionId()).toBeNull()

      // Show incoming call
      await uiCoordinator.showIncomingCall({
        sessionId: 'session-123',
        callerName: 'John Doe',
        callType: 'video'
      })

      // Verify active state
      expect(uiCoordinator.isCallKeepActive()).toBe(true)
      expect(uiCoordinator.getActiveSessionId()).toBe('session-123')

      // End call
      await uiCoordinator.endCall('session-123')

      // Verify reset state
      expect(uiCoordinator.isCallKeepActive()).toBe(false)
      expect(uiCoordinator.getActiveSessionId()).toBeNull()
    })

    it('should prevent UI conflicts between CallKeep and custom UI', async () => {
      const mockCallKeepService = {
        initialize: jest.fn().mockResolvedValue(undefined),
        isAvailable: jest.fn().mockReturnValue(true),
        displayIncomingCall: jest.fn().mockResolvedValue(true)
      }

      const mockNotificationService = {
        showIncomingCall: jest.fn().mockResolvedValue(undefined)
      }

      ;(uiCoordinator as any).callKeepService = mockCallKeepService
      ;(uiCoordinator as any).notificationService = mockNotificationService

      // Show call with CallKeep
      await uiCoordinator.showIncomingCall({
        sessionId: 'session-123',
        callerName: 'John Doe',
        callType: 'video'
      })

      // Verify only CallKeep was used
      expect(mockCallKeepService.displayIncomingCall).toHaveBeenCalled()
      expect(mockNotificationService.showIncomingCall).not.toHaveBeenCalled()
      expect(uiCoordinator.isCallKeepActive()).toBe(true)
      expect(uiCoordinator.isCustomUIActive()).toBe(false)
    })
  })
})
