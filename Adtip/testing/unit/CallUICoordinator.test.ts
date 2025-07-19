import { CallUICoordinator } from '../../Adtip/src/services/calling/CallUICoordinator'
import { Platform } from 'react-native'

// Mock dependencies
jest.mock('../../Adtip/src/services/calling/CallKeepService')
jest.mock('../../Adtip/src/services/calling/NotificationService')

describe('CallUICoordinator', () => {
  let coordinator: CallUICoordinator
  let mockCallKeepService: any
  let mockNotificationService: any

  beforeEach(() => {
    coordinator = CallUICoordinator.getInstance()
    
    // Reset singleton for testing
    ;(CallUICoordinator as any).instance = null
    coordinator = CallUICoordinator.getInstance()

    mockCallKeepService = {
      initialize: jest.fn().mockResolvedValue(undefined),
      isAvailable: jest.fn().mockReturnValue(true),
      displayIncomingCall: jest.fn().mockResolvedValue(true),
      endCall: jest.fn(),
      checkPermissions: jest.fn().mockResolvedValue(true),
      requestPermissions: jest.fn().mockResolvedValue(true)
    }

    mockNotificationService = {
      showIncomingCall: jest.fn().mockResolvedValue(undefined),
      clearIncomingCall: jest.fn().mockResolvedValue(undefined)
    }

    ;(coordinator as any).callKeepService = mockCallKeepService
    ;(coordinator as any).notificationService = mockNotificationService

    jest.clearAllMocks()
  })

  describe('initialization', () => {
    it('should be a singleton', () => {
      const instance1 = CallUICoordinator.getInstance()
      const instance2 = CallUICoordinator.getInstance()
      expect(instance1).toBe(instance2)
    })

    it('should initialize successfully', async () => {
      await expect(coordinator.initialize()).resolves.not.toThrow()
      expect(mockCallKeepService.initialize).toHaveBeenCalled()
    })

    it('should handle initialization errors gracefully', async () => {
      mockCallKeepService.initialize.mockRejectedValue(new Error('Init failed'))
      
      await expect(coordinator.initialize()).resolves.not.toThrow()
    })
  })

  describe('showIncomingCall', () => {
    const callOptions = {
      sessionId: 'session-123',
      callerName: 'John Doe',
      callType: 'video' as const,
      meetingId: 'meeting-456',
      token: 'token-789'
    }

    it('should use CallKeep when available', async () => {
      mockCallKeepService.isAvailable.mockReturnValue(true)
      mockCallKeepService.displayIncomingCall.mockResolvedValue(true)

      const result = await coordinator.showIncomingCall(callOptions)

      expect(result).toBe(true)
      expect(mockCallKeepService.displayIncomingCall).toHaveBeenCalledWith(
        'session-123',
        'John Doe',
        'John Doe',
        'generic',
        true
      )
      expect(mockNotificationService.showIncomingCall).not.toHaveBeenCalled()
    })

    it('should fallback to custom UI when CallKeep unavailable', async () => {
      mockCallKeepService.isAvailable.mockReturnValue(false)

      const result = await coordinator.showIncomingCall(callOptions)

      expect(result).toBe(true)
      expect(mockCallKeepService.displayIncomingCall).not.toHaveBeenCalled()
      expect(mockNotificationService.showIncomingCall).toHaveBeenCalledWith(
        'session-123',
        'John Doe',
        'video',
        'meeting-456',
        'token-789'
      )
    })

    it('should fallback to custom UI when CallKeep fails', async () => {
      mockCallKeepService.isAvailable.mockReturnValue(true)
      mockCallKeepService.displayIncomingCall.mockResolvedValue(false)

      const result = await coordinator.showIncomingCall(callOptions)

      expect(result).toBe(true)
      expect(mockCallKeepService.displayIncomingCall).toHaveBeenCalled()
      expect(mockNotificationService.showIncomingCall).toHaveBeenCalled()
    })

    it('should force custom UI when requested', async () => {
      const optionsWithForce = { ...callOptions, forceCustomUI: true }
      
      const result = await coordinator.showIncomingCall(optionsWithForce)

      expect(result).toBe(true)
      expect(mockCallKeepService.displayIncomingCall).not.toHaveBeenCalled()
      expect(mockNotificationService.showIncomingCall).toHaveBeenCalled()
    })

    it('should handle audio calls correctly', async () => {
      const audioCallOptions = { ...callOptions, callType: 'audio' as const }
      mockCallKeepService.isAvailable.mockReturnValue(true)
      mockCallKeepService.displayIncomingCall.mockResolvedValue(true)

      await coordinator.showIncomingCall(audioCallOptions)

      expect(mockCallKeepService.displayIncomingCall).toHaveBeenCalledWith(
        'session-123',
        'John Doe',
        'John Doe',
        'generic',
        false // video = false for audio calls
      )
    })

    it('should convert audio to voice for NotificationService', async () => {
      const audioCallOptions = { ...callOptions, callType: 'audio' as const }
      mockCallKeepService.isAvailable.mockReturnValue(false)

      await coordinator.showIncomingCall(audioCallOptions)

      expect(mockNotificationService.showIncomingCall).toHaveBeenCalledWith(
        'session-123',
        'John Doe',
        'voice', // audio converted to voice
        'meeting-456',
        'token-789'
      )
    })
  })

  describe('endCall', () => {
    beforeEach(() => {
      // Set up active call state
      ;(coordinator as any).currentState = {
        isCallKeepActive: true,
        isCustomUIActive: false,
        activeSessionId: 'session-123',
        uiType: 'callkeep'
      }
    })

    it('should end CallKeep call when active', async () => {
      await coordinator.endCall('session-123')

      expect(mockCallKeepService.endCall).toHaveBeenCalledWith('session-123')
    })

    it('should use active session ID when none provided', async () => {
      await coordinator.endCall()

      expect(mockCallKeepService.endCall).toHaveBeenCalledWith('session-123')
    })

    it('should handle no active session gracefully', async () => {
      ;(coordinator as any).currentState.activeSessionId = null

      await expect(coordinator.endCall()).resolves.not.toThrow()
      expect(mockCallKeepService.endCall).not.toHaveBeenCalled()
    })

    it('should clear custom notifications when active', async () => {
      ;(coordinator as any).currentState = {
        isCallKeepActive: false,
        isCustomUIActive: true,
        activeSessionId: 'session-123',
        uiType: 'custom'
      }

      await coordinator.endCall('session-123')

      expect(mockNotificationService.clearIncomingCall).toHaveBeenCalledWith('session-123')
    })
  })

  describe('state management', () => {
    it('should track CallKeep active state', async () => {
      mockCallKeepService.isAvailable.mockReturnValue(true)
      mockCallKeepService.displayIncomingCall.mockResolvedValue(true)

      await coordinator.showIncomingCall({
        sessionId: 'session-123',
        callerName: 'John Doe',
        callType: 'video'
      })

      expect(coordinator.isCallKeepActive()).toBe(true)
      expect(coordinator.isCustomUIActive()).toBe(false)
      expect(coordinator.getActiveSessionId()).toBe('session-123')
    })

    it('should track custom UI active state', async () => {
      mockCallKeepService.isAvailable.mockReturnValue(false)

      await coordinator.showIncomingCall({
        sessionId: 'session-123',
        callerName: 'John Doe',
        callType: 'video'
      })

      expect(coordinator.isCallKeepActive()).toBe(false)
      expect(coordinator.isCustomUIActive()).toBe(true)
      expect(coordinator.getActiveSessionId()).toBe('session-123')
    })

    it('should reset state after ending call', async () => {
      // Set up active state
      await coordinator.showIncomingCall({
        sessionId: 'session-123',
        callerName: 'John Doe',
        callType: 'video'
      })

      // End call
      await coordinator.endCall('session-123')

      expect(coordinator.isCallKeepActive()).toBe(false)
      expect(coordinator.isCustomUIActive()).toBe(false)
      expect(coordinator.getActiveSessionId()).toBeNull()
    })
  })

  describe('platform-specific behavior', () => {
    it('should check permissions on Android', async () => {
      Platform.OS = 'android'
      mockCallKeepService.checkPermissions.mockResolvedValue(false)

      const result = await coordinator.showIncomingCall({
        sessionId: 'session-123',
        callerName: 'John Doe',
        callType: 'video'
      })

      expect(mockCallKeepService.checkPermissions).toHaveBeenCalled()
      expect(mockNotificationService.showIncomingCall).toHaveBeenCalled()
    })

    it('should request permissions when needed', async () => {
      Platform.OS = 'android'
      
      const result = await coordinator.requestPermissions()

      expect(mockCallKeepService.requestPermissions).toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('should not request permissions on iOS', async () => {
      Platform.OS = 'ios'
      
      const result = await coordinator.requestPermissions()

      expect(mockCallKeepService.requestPermissions).not.toHaveBeenCalled()
      expect(result).toBe(true)
    })
  })
})
