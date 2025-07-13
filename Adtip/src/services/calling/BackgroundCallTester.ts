import { AppState } from 'react-native'
import { BackgroundCallHandler } from './BackgroundCallHandler'
import CallStateManager from './CallStateManager'
import CallKeepService from './CallKeepService'
import BackgroundMediaService from './BackgroundMediaService'
import CallCleanupService from './CallCleanupService'

/**
 * Comprehensive tester for background call functionality
 * Use this to verify all fixes are working correctly
 */
export class BackgroundCallTester {
  private static instance: BackgroundCallTester

  private constructor() {}

  public static getInstance(): BackgroundCallTester {
    if (!BackgroundCallTester.instance) {
      BackgroundCallTester.instance = new BackgroundCallTester()
    }
    return BackgroundCallTester.instance
  }

  /**
   * Test complete background call flow
   */
  async testBackgroundCallFlow(): Promise<{
    success: boolean
    results: string[]
    errors: string[]
  }> {
    const results: string[] = []
    const errors: string[] = []

    try {
      console.log('[BackgroundCallTester] Starting comprehensive background call test')

      // Test 1: Service Initialization
      const initTest = await this.testServiceInitialization()
      results.push(`Service Initialization: ${initTest.success ? 'PASS' : 'FAIL'}`)
      if (!initTest.success) errors.push(...initTest.errors)

      // Test 2: Background Call Reception
      const receptionTest = await this.testBackgroundCallReception()
      results.push(`Background Call Reception: ${receptionTest.success ? 'PASS' : 'FAIL'}`)
      if (!receptionTest.success) errors.push(...receptionTest.errors)

      // Test 3: Call State Management
      const stateTest = await this.testCallStateManagement()
      results.push(`Call State Management: ${stateTest.success ? 'PASS' : 'FAIL'}`)
      if (!stateTest.success) errors.push(...stateTest.errors)

      // Test 4: Media Initialization
      const mediaTest = await this.testMediaInitialization()
      results.push(`Media Initialization: ${mediaTest.success ? 'PASS' : 'FAIL'}`)
      if (!mediaTest.success) errors.push(...mediaTest.errors)

      // Test 5: CallKeep Integration
      const callKeepTest = await this.testCallKeepIntegration()
      results.push(`CallKeep Integration: ${callKeepTest.success ? 'PASS' : 'FAIL'}`)
      if (!callKeepTest.success) errors.push(...callKeepTest.errors)

      // Test 6: Cleanup Process
      const cleanupTest = await this.testCleanupProcess()
      results.push(`Cleanup Process: ${cleanupTest.success ? 'PASS' : 'FAIL'}`)
      if (!cleanupTest.success) errors.push(...cleanupTest.errors)

      const overallSuccess = errors.length === 0
      console.log('[BackgroundCallTester] Test completed:', overallSuccess ? 'ALL PASS' : 'SOME FAILURES')

      return {
        success: overallSuccess,
        results,
        errors
      }
    } catch (error) {
      console.error('[BackgroundCallTester] Test failed with error:', error)
      return {
        success: false,
        results,
        errors: [...errors, `Test execution error: ${error}`]
      }
    }
  }

  /**
   * Test service initialization
   */
  private async testServiceInitialization(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = []

    try {
      // Test BackgroundCallHandler
      const backgroundHandler = BackgroundCallHandler.getInstance()
      if (!backgroundHandler) {
        errors.push('BackgroundCallHandler not initialized')
      }

      // Test CallStateManager
      const stateManager = CallStateManager.getInstance()
      if (!stateManager) {
        errors.push('CallStateManager not initialized')
      }

      // Test CallKeepService
      const callKeepService = CallKeepService.getInstance()
      const callKeepInitialized = await callKeepService.initialize()
      if (!callKeepInitialized) {
        errors.push('CallKeepService initialization failed')
      }

      // Test BackgroundMediaService
      const mediaService = BackgroundMediaService.getInstance()
      if (!mediaService) {
        errors.push('BackgroundMediaService not initialized')
      }

      // Test CallCleanupService
      const cleanupService = CallCleanupService.getInstance()
      if (!cleanupService) {
        errors.push('CallCleanupService not initialized')
      }

      return { success: errors.length === 0, errors }
    } catch (error) {
      return { success: false, errors: [`Service initialization test error: ${error}`] }
    }
  }

  /**
   * Test background call reception
   */
  private async testBackgroundCallReception(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = []

    try {
      const backgroundHandler = BackgroundCallHandler.getInstance()

      // Simulate background call data
      const mockCallData = {
        uuid: 'test-session-123',
        callerInfo: {
          name: 'Test Caller',
          token: 'test-caller-token'
        },
        videoSDKInfo: {
          meetingId: 'test-meeting-123',
          token: 'test-meeting-token',
          callType: 'voice'
        },
        type: 'CALL_INITIATED'
      }

      const mockRemoteMessage = {
        data: {
          info: JSON.stringify(mockCallData)
        }
      }

      // Test call reception
      await backgroundHandler.handleIncomingCallBackground(mockCallData, mockRemoteMessage)

      // Verify call was received
      if (!backgroundHandler.hasPendingCall()) {
        errors.push('Background call not properly received')
      }

      const pendingCall = backgroundHandler.getPendingCall()
      if (!pendingCall || pendingCall.sessionId !== 'test-session-123') {
        errors.push('Pending call data incorrect')
      }

      // Clean up test call
      await backgroundHandler.declineBackgroundCall()

      return { success: errors.length === 0, errors }
    } catch (error) {
      return { success: false, errors: [`Background call reception test error: ${error}`] }
    }
  }

  /**
   * Test call state management
   */
  private async testCallStateManagement(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = []

    try {
      const stateManager = CallStateManager.getInstance()

      // Test action queueing
      await stateManager.queueAction({
        type: 'INCOMING_CALL',
        sessionId: 'test-session-456',
        source: 'FCM',
        data: { test: true }
      })

      // Check queue status
      const queueStatus = stateManager.getQueueStatus()
      if (queueStatus.currentSessionId !== 'test-session-456') {
        errors.push('Call state not properly managed')
      }

      // Test duplicate action prevention
      await stateManager.queueAction({
        type: 'INCOMING_CALL',
        sessionId: 'test-session-456',
        source: 'FCM',
        data: { test: true }
      })

      // Should not create duplicate
      const queueStatusAfter = stateManager.getQueueStatus()
      if (queueStatusAfter.queueLength > 1) {
        errors.push('Duplicate action not prevented')
      }

      // Clean up
      stateManager.clearQueue()

      return { success: errors.length === 0, errors }
    } catch (error) {
      return { success: false, errors: [`Call state management test error: ${error}`] }
    }
  }

  /**
   * Test media initialization
   */
  private async testMediaInitialization(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = []

    try {
      const mediaService = BackgroundMediaService.getInstance()

      // Test permission status check
      const permissions = await mediaService.getPermissionStatus()
      if (typeof permissions.microphone !== 'boolean' || typeof permissions.camera !== 'boolean') {
        errors.push('Permission status check failed')
      }

      // Test media preparation
      const mediaConfig = await mediaService.prepareMediaForCall('voice')
      if (typeof mediaConfig.micEnabled !== 'boolean' || typeof mediaConfig.cameraEnabled !== 'boolean') {
        errors.push('Media preparation failed')
      }

      // Test validation
      const validation = await mediaService.validateMediaSetup('voice')
      if (typeof validation.isValid !== 'boolean' || !Array.isArray(validation.issues)) {
        errors.push('Media validation failed')
      }

      return { success: errors.length === 0, errors }
    } catch (error) {
      return { success: false, errors: [`Media initialization test error: ${error}`] }
    }
  }

  /**
   * Test CallKeep integration
   */
  private async testCallKeepIntegration(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = []

    try {
      const callKeepService = CallKeepService.getInstance()

      // Test availability
      const isAvailable = callKeepService.isAvailable()
      if (typeof isAvailable !== 'boolean') {
        errors.push('CallKeep availability check failed')
      }

      // Test permission check
      const hasPermissions = await callKeepService.checkPermissions()
      if (typeof hasPermissions !== 'boolean') {
        errors.push('CallKeep permission check failed')
      }

      // Test current call UUID (should be null initially)
      const currentUUID = callKeepService.getCurrentCallUUID()
      if (currentUUID !== null) {
        errors.push('CallKeep should not have active call initially')
      }

      return { success: errors.length === 0, errors }
    } catch (error) {
      return { success: false, errors: [`CallKeep integration test error: ${error}`] }
    }
  }

  /**
   * Test cleanup process
   */
  private async testCleanupProcess(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = []

    try {
      const cleanupService = CallCleanupService.getInstance()

      // Test cleanup validation
      const validation = await cleanupService.validateCleanup()
      if (typeof validation.isClean !== 'boolean' || !Array.isArray(validation.issues)) {
        errors.push('Cleanup validation failed')
      }

      // Test emergency cleanup (should not throw)
      await cleanupService.emergencyCleanup()

      // Test specific cleanup methods
      await cleanupService.cleanupBackgroundCallDecline('test-session')
      await cleanupService.cleanupAfterCallAcceptance('test-session')

      return { success: errors.length === 0, errors }
    } catch (error) {
      return { success: false, errors: [`Cleanup process test error: ${error}`] }
    }
  }

  /**
   * Test race condition prevention
   */
  async testRaceConditionPrevention(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = []

    try {
      const stateManager = CallStateManager.getInstance()

      // Simulate rapid concurrent actions
      const promises = [
        stateManager.queueAction({
          type: 'INCOMING_CALL',
          sessionId: 'race-test-1',
          source: 'FCM'
        }),
        stateManager.queueAction({
          type: 'ACCEPT_CALL',
          sessionId: 'race-test-1',
          source: 'CALLKEEP'
        }),
        stateManager.queueAction({
          type: 'ACCEPT_CALL',
          sessionId: 'race-test-1',
          source: 'NOTIFICATION'
        })
      ]

      await Promise.all(promises)

      // Check that only one action was processed
      const queueStatus = stateManager.getQueueStatus()
      if (queueStatus.queueLength > 0) {
        errors.push('Race condition not properly handled')
      }

      // Clean up
      stateManager.clearQueue()

      return { success: errors.length === 0, errors }
    } catch (error) {
      return { success: false, errors: [`Race condition test error: ${error}`] }
    }
  }

  /**
   * Generate test report
   */
  generateTestReport(testResults: { success: boolean; results: string[]; errors: string[] }): string {
    let report = '\n=== BACKGROUND CALL TEST REPORT ===\n\n'
    
    report += `Overall Status: ${testResults.success ? '✅ PASS' : '❌ FAIL'}\n\n`
    
    report += 'Test Results:\n'
    testResults.results.forEach(result => {
      report += `  ${result}\n`
    })
    
    if (testResults.errors.length > 0) {
      report += '\nErrors:\n'
      testResults.errors.forEach(error => {
        report += `  ❌ ${error}\n`
      })
    }
    
    report += '\n=== END REPORT ===\n'
    
    return report
  }
}

export default BackgroundCallTester
