import { Platform } from 'react-native'
import { CallKeepService } from '../../src/services/calling/CallKeepService'
import CallUICoordinator from '../../src/services/calling/CallUICoordinator'

// Mock react-native-callkeep
jest.mock('react-native-callkeep', () => ({
  setup: jest.fn().mockResolvedValue(undefined),
  hasPhoneAccount: jest.fn(),
  registerPhoneAccount: jest.fn().mockResolvedValue(undefined),
  displayIncomingCall: jest.fn().mockResolvedValue(undefined),
  endCall: jest.fn().mockResolvedValue(undefined),
}))

// Mock Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    Version: 30,
  },
}))

describe('CallKeep Permissions', () => {
  let callKeepService: CallKeepService
  let callUICoordinator: CallUICoordinator
  let mockRNCallKeep: any

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Get mock instance
    mockRNCallKeep = require('react-native-callkeep')
    
    // Reset singletons
    ;(CallKeepService as any).instance = null
    ;(CallUICoordinator as any).instance = null
    
    callKeepService = CallKeepService.getInstance()
    callUICoordinator = CallUICoordinator.getInstance()
  })

  describe('CallKeepService Permission Flow', () => {
    it('should automatically request permissions when not granted during initialization', async () => {
      // Mock permissions not granted initially
      mockRNCallKeep.hasPhoneAccount
        .mockResolvedValueOnce(false) // Initial check
        .mockResolvedValueOnce(true)  // After request

      await callKeepService.initialize()

      expect(mockRNCallKeep.hasPhoneAccount).toHaveBeenCalledTimes(2)
      expect(mockRNCallKeep.registerPhoneAccount).toHaveBeenCalledWith({
        ios: { appName: 'Adtip' },
        android: {
          alertTitle: 'Phone Account Permission Required',
          alertDescription: 'Adtip needs access to your phone accounts to provide native call experience',
          cancelButton: 'Cancel',
          okButton: 'Allow',
          additionalPermissions: []
        }
      })
    })

    it('should handle permission request failure gracefully', async () => {
      // Mock permissions denied
      mockRNCallKeep.hasPhoneAccount.mockResolvedValue(false)
      mockRNCallKeep.registerPhoneAccount.mockRejectedValue(new Error('Permission denied'))

      const result = await callKeepService.initialize()

      expect(result).toBe(true) // Should still initialize successfully
      expect(mockRNCallKeep.registerPhoneAccount).toHaveBeenCalled()
    })

    it('should not request permissions on iOS', async () => {
      Platform.OS = 'ios'

      await callKeepService.initialize()

      expect(mockRNCallKeep.registerPhoneAccount).not.toHaveBeenCalled()
    })

    it('should check permissions correctly', async () => {
      mockRNCallKeep.hasPhoneAccount.mockResolvedValue(true)

      const hasPermissions = await callKeepService.checkPermissions()

      expect(hasPermissions).toBe(true)
      expect(mockRNCallKeep.hasPhoneAccount).toHaveBeenCalled()
    })

    it('should request permissions manually', async () => {
      mockRNCallKeep.hasPhoneAccount.mockResolvedValue(true)

      const result = await callKeepService.requestPermissions()

      expect(result).toBe(true)
      expect(mockRNCallKeep.registerPhoneAccount).toHaveBeenCalled()
    })
  })

  describe('CallUICoordinator Permission Integration', () => {
    beforeEach(() => {
      // Mock CallKeepService methods
      jest.spyOn(callKeepService, 'isAvailable').mockReturnValue(true)
      jest.spyOn(callKeepService, 'checkPermissions').mockResolvedValue(false)
      jest.spyOn(callKeepService, 'requestPermissions').mockResolvedValue(true)
    })

    it('should request permissions when not granted and use CallKeep if granted', async () => {
      Platform.OS = 'android'

      // Mock the private method by accessing it through the coordinator
      const shouldUseCallKeepSpy = jest.spyOn(callUICoordinator as any, 'shouldUseCallKeep')
      
      const result = await (callUICoordinator as any).shouldUseCallKeep({
        sessionId: 'test-session',
        callerName: 'Test Caller',
        callType: 'video'
      })

      expect(callKeepService.checkPermissions).toHaveBeenCalled()
      expect(callKeepService.requestPermissions).toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('should fall back to custom UI if permission request fails', async () => {
      Platform.OS = 'android'
      jest.spyOn(callKeepService, 'requestPermissions').mockResolvedValue(false)

      const result = await (callUICoordinator as any).shouldUseCallKeep({
        sessionId: 'test-session',
        callerName: 'Test Caller',
        callType: 'video'
      })

      expect(result).toBe(false)
    })

    it('should handle permission request errors gracefully', async () => {
      Platform.OS = 'android'
      jest.spyOn(callKeepService, 'requestPermissions').mockRejectedValue(new Error('Permission error'))

      const result = await (callUICoordinator as any).shouldUseCallKeep({
        sessionId: 'test-session',
        callerName: 'Test Caller',
        callType: 'video'
      })

      expect(result).toBe(false)
    })
  })

  describe('Permission State Management', () => {
    it('should track permission state correctly', async () => {
      mockRNCallKeep.hasPhoneAccount.mockResolvedValue(true)

      const hasPermissions = await callKeepService.hasRequiredPermissions()

      expect(hasPermissions).toBe(false) // Not initialized yet

      await callKeepService.initialize()
      const hasPermissionsAfterInit = await callKeepService.hasRequiredPermissions()

      expect(hasPermissionsAfterInit).toBe(true)
    })
  })
})
