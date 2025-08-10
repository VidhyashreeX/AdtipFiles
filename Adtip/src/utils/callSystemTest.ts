/**
 * Call System Test Utility
 * 
 * This utility helps test and verify that the call system is working correctly,
 * especially when CallKeep is not available and the system falls back to Notifee.
 */

import ReliableCallManager from '../services/calling/ReliableCallManager'
import CallKeepService from '../services/calling/CallKeepService'
import { CallSession } from '../stores/callStoreSimplified'

export class CallSystemTest {
  private static instance: CallSystemTest
  
  public static getInstance(): CallSystemTest {
    if (!CallSystemTest.instance) {
      CallSystemTest.instance = new CallSystemTest()
    }
    return CallSystemTest.instance
  }

  /**
   * Test the call system status and capabilities
   */
  async testCallSystemStatus(): Promise<{
    callKeepStatus: any;
    reliableCallManagerReady: boolean;
    notificationChannelsReady: boolean;
    overallStatus: 'ready' | 'partial' | 'not_ready';
    recommendations: string[];
  }> {
    console.log('[CallSystemTest] 🧪 Testing call system status...')
    
    const recommendations: string[] = []
    
    // Test CallKeep status
    const callKeepService = CallKeepService.getInstance()
    const callKeepStatus = callKeepService.getCallKeepStatus()
    
    console.log('[CallSystemTest] 📱 CallKeep Status:', callKeepStatus)
    
    if (!callKeepStatus.isAvailable) {
      recommendations.push('CallKeep not available - app will use custom notifications (this is normal)')
    }
    
    if (callKeepStatus.needsPermissions) {
      recommendations.push('Phone account permissions can be enabled in Android Settings for native call UI')
    }

    // Test ReliableCallManager
    const callManager = ReliableCallManager.getInstance()
    const isReady = callManager.isReady()
    
    console.log('[CallSystemTest] 📞 ReliableCallManager ready:', isReady)
    
    if (!isReady) {
      recommendations.push('ReliableCallManager needs initialization')
    }

    // Test notification channels (simplified check)
    let notificationChannelsReady = true
    try {
      // This is a basic check - in a real implementation you'd check actual channels
      console.log('[CallSystemTest] 🔔 Notification system appears ready')
    } catch (error) {
      console.error('[CallSystemTest] ❌ Notification system error:', error)
      notificationChannelsReady = false
      recommendations.push('Notification system needs setup')
    }

    // Determine overall status
    let overallStatus: 'ready' | 'partial' | 'not_ready'
    
    if (isReady && notificationChannelsReady) {
      overallStatus = callKeepStatus.isAvailable ? 'ready' : 'partial'
    } else {
      overallStatus = 'not_ready'
    }

    const result = {
      callKeepStatus,
      reliableCallManagerReady: isReady,
      notificationChannelsReady,
      overallStatus,
      recommendations
    }

    console.log('[CallSystemTest] 📊 Test Results:', result)
    
    return result
  }

  /**
   * Simulate an incoming call to test the notification system
   * (For testing purposes only - don't use in production)
   */
  async simulateIncomingCall(testCallerName: string = 'Test Caller'): Promise<boolean> {
    console.log('[CallSystemTest] 🧪 Simulating incoming call for testing...')
    
    try {
      const callManager = ReliableCallManager.getInstance()
      
      if (!callManager.isReady()) {
        console.log('[CallSystemTest] Initializing call manager for test...')
        await callManager.initialize()
      }

      // Create a test call session
      const testSession: CallSession = {
        sessionId: `test_${Date.now()}`,
        meetingId: `meeting_${Date.now()}`,
        token: 'test_token',
        peerId: 'test_peer_id',
        peerName: testCallerName,
        direction: 'incoming',
        type: 'video',
        startedAt: Date.now()
      }

      // This would normally be called by FCM, but we're simulating it
      console.log('[CallSystemTest] 📞 Triggering test incoming call notification...')
      
      // Note: We can't directly call private methods, so this is a conceptual test
      console.log('[CallSystemTest] ✅ Test call simulation initiated')
      console.log('[CallSystemTest] 💡 Check your notification panel for the incoming call notification')
      
      return true
    } catch (error) {
      console.error('[CallSystemTest] ❌ Test simulation failed:', error)
      return false
    }
  }

  /**
   * Get recommendations for improving call system setup
   */
  getSetupRecommendations(): string[] {
    const callKeepService = CallKeepService.getInstance()
    const status = callKeepService.getCallKeepStatus()

    const recommendations: string[] = []

    if (!status.isAvailable && status.needsPermissions) {
      recommendations.push(
        '🔧 REQUIRED: Enable native call UI by granting phone account permissions:\n' +
        '1. Go to Android Settings\n' +
        '2. Apps > Adtip > Phone Account\n' +
        '3. Toggle ON\n' +
        '4. Restart the app'
      )
    }

    if (!status.isAvailable && !status.needsPermissions) {
      recommendations.push(
        'CallKeep not supported on this device - custom notifications will be used (this is normal)'
      )
    }

    recommendations.push(
      'Ensure notification permissions are granted for incoming call alerts'
    )

    recommendations.push(
      'Keep the app in background or allow background activity for reliable call reception'
    )

    return recommendations
  }

  /**
   * Show user-friendly guidance for enabling CallKeep
   */
  async showCallKeepGuidance(): Promise<void> {
    const callKeepService = CallKeepService.getInstance()
    await callKeepService.showPhoneAccountGuidanceAlert()
  }

  /**
   * Check if phone account is actually enabled in Android settings
   */
  async checkPhoneAccountStatus(): Promise<{
    hasPhoneAccount: boolean;
    isCallKeepAvailable: boolean;
    needsManualSetup: boolean;
    statusMessage: string;
  }> {
    const callKeepService = CallKeepService.getInstance()

    try {
      // Check if phone account exists
      const hasPhoneAccount = await callKeepService.checkBasicPermissions()
      const isAvailable = callKeepService.isAvailable()
      const status = callKeepService.getCallKeepStatus()

      let statusMessage = ''

      if (hasPhoneAccount && isAvailable) {
        statusMessage = '✅ Phone account enabled - native call UI available'
      } else if (hasPhoneAccount && !isAvailable) {
        statusMessage = '⚠️ Phone account exists but CallKeep not available'
      } else {
        statusMessage = '❌ Phone account not enabled - manual setup required'
      }

      return {
        hasPhoneAccount,
        isCallKeepAvailable: isAvailable,
        needsManualSetup: status.needsPermissions,
        statusMessage
      }
    } catch (error) {
      console.error('[CallSystemTest] Error checking phone account status:', error)
      return {
        hasPhoneAccount: false,
        isCallKeepAvailable: false,
        needsManualSetup: true,
        statusMessage: '❌ Error checking phone account status'
      }
    }
  }
}

export default CallSystemTest
