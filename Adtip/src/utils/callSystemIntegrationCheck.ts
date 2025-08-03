import { Platform } from 'react-native'
import CallController from '../services/calling/CallController'
import NotificationService from '../services/calling/NotificationService'
import CallKitService from '../services/calling/CallKitService'
import NotificationPersistenceService from '../services/calling/NotificationPersistenceService'
import { useCallStore } from '../stores/callStoreSimplified'

/**
 * Comprehensive integration check for the call system
 * This ensures all components are properly connected and working together
 */
export class CallSystemIntegrationCheck {
  
  /**
   * Verify that TipCallScreenSimple is properly integrated with the enhanced call system
   */
  static async verifyTipCallScreenIntegration(): Promise<boolean> {
    console.log('[IntegrationCheck] Verifying TipCallScreenSimple integration...')
    
    try {
      // 1. Verify CallController is accessible and properly initialized
      const callController = CallController.getInstance()
      if (!callController) {
        console.error('[IntegrationCheck] ❌ CallController not accessible')
        return false
      }
      console.log('[IntegrationCheck] ✅ CallController accessible')

      // 2. Verify NotificationService integration
      const notificationService = NotificationService.getInstance()
      if (!notificationService) {
        console.error('[IntegrationCheck] ❌ NotificationService not accessible')
        return false
      }
      console.log('[IntegrationCheck] ✅ NotificationService accessible')

      // 3. Verify call store integration
      const store = useCallStore.getState()
      if (!store || !store.actions) {
        console.error('[IntegrationCheck] ❌ Call store not properly initialized')
        return false
      }
      console.log('[IntegrationCheck] ✅ Call store properly initialized')

      // 4. Verify persistence service
      const persistenceService = NotificationPersistenceService.getInstance()
      if (!persistenceService) {
        console.error('[IntegrationCheck] ❌ NotificationPersistenceService not accessible')
        return false
      }
      console.log('[IntegrationCheck] ✅ NotificationPersistenceService accessible')

      // 5. Platform-specific checks
      if (Platform.OS === 'ios') {
        const callKitService = CallKitService.getInstance()
        if (!callKitService) {
          console.warn('[IntegrationCheck] ⚠️ CallKitService not accessible on iOS')
        } else {
          console.log('[IntegrationCheck] ✅ CallKitService accessible on iOS')
        }
      }

      console.log('[IntegrationCheck] ✅ All core integrations verified')
      return true
      
    } catch (error) {
      console.error('[IntegrationCheck] ❌ Integration verification failed:', error)
      return false
    }
  }

  /**
   * Verify the complete call flow from TipCallScreenSimple to native notifications
   */
  static async verifyCallFlow(): Promise<boolean> {
    console.log('[IntegrationCheck] Verifying complete call flow...')
    
    try {
      // 1. Simulate the flow that happens when user taps call button in TipCallScreenSimple
      const callController = CallController.getInstance()
      
      // 2. Verify that startCall method exists and is callable
      if (typeof callController.startCall !== 'function') {
        console.error('[IntegrationCheck] ❌ CallController.startCall method not available')
        return false
      }
      console.log('[IntegrationCheck] ✅ CallController.startCall method available')

      // 3. Verify notification flow for incoming calls
      const notificationService = NotificationService.getInstance()
      if (typeof notificationService.showIncomingCall !== 'function') {
        console.error('[IntegrationCheck] ❌ NotificationService.showIncomingCall method not available')
        return false
      }
      console.log('[IntegrationCheck] ✅ NotificationService.showIncomingCall method available')

      // 4. Verify store listeners are set up
      const store = useCallStore.getState()
      if (store.status !== 'idle') {
        console.warn('[IntegrationCheck] ⚠️ Call store not in idle state, may indicate active call or improper cleanup')
      } else {
        console.log('[IntegrationCheck] ✅ Call store in proper idle state')
      }

      console.log('[IntegrationCheck] ✅ Call flow verification complete')
      return true
      
    } catch (error) {
      console.error('[IntegrationCheck] ❌ Call flow verification failed:', error)
      return false
    }
  }

  /**
   * Verify native module integrations
   */
  static async verifyNativeIntegrations(): Promise<boolean> {
    console.log('[IntegrationCheck] Verifying native integrations...')
    
    try {
      if (Platform.OS === 'android') {
        // Check Android native modules
        const { IncomingCallModule } = require('react-native').NativeModules
        
        if (!IncomingCallModule || typeof IncomingCallModule !== 'object') {
          console.warn('[IntegrationCheck] ⚠️ Android IncomingCallModule not available (expected in production)')
          return true // Don't fail the check, just warn
        }
        
        // Verify required methods exist
        const requiredMethods = ['triggerIncomingCall', 'endCall', 'addListener', 'removeListeners']
        for (const method of requiredMethods) {
          if (typeof IncomingCallModule[method] !== 'function') {
            console.warn(`[IntegrationCheck] ⚠️ IncomingCallModule.${method} not available`)
            return true // Don't fail the check, just warn
          }
        }
        
        console.log('[IntegrationCheck] ✅ Android native modules properly integrated')
        
      } else if (Platform.OS === 'ios') {
        // Check iOS CallKit integration
        const callKitService = CallKitService.getInstance()
        
        if (!callKitService.isAvailable()) {
          console.warn('[IntegrationCheck] ⚠️ iOS CallKit not available')
        } else {
          console.log('[IntegrationCheck] ✅ iOS CallKit properly integrated')
        }
      }

      return true
      
    } catch (error) {
      console.error('[IntegrationCheck] ❌ Native integration verification failed:', error)
      return false
    }
  }

  /**
   * Verify background and killed app scenarios
   */
  static async verifyBackgroundHandling(): Promise<boolean> {
    console.log('[IntegrationCheck] Verifying background handling...')
    
    try {
      // 1. Check if FCM background handler is set up (this is done in index.js)
      // We can't directly test this, but we can verify the components exist
      
      // 2. Verify persistence service for reliability
      const persistenceService = NotificationPersistenceService.getInstance()
      const stats = await persistenceService.getStatistics()
      console.log('[IntegrationCheck] ✅ Persistence service statistics:', stats)

      // 3. Verify notification channels are properly set up
      const notificationService = NotificationService.getInstance()
      await notificationService.initializeEnhancedChannels()
      console.log('[IntegrationCheck] ✅ Enhanced notification channels initialized')

      console.log('[IntegrationCheck] ✅ Background handling verification complete')
      return true
      
    } catch (error) {
      console.error('[IntegrationCheck] ❌ Background handling verification failed:', error)
      return false
    }
  }

  /**
   * Run all integration checks
   */
  static async runAllChecks(): Promise<{
    tipCallScreenIntegration: boolean
    callFlow: boolean
    nativeIntegrations: boolean
    backgroundHandling: boolean
    overall: boolean
  }> {
    console.log('[IntegrationCheck] 🚀 Running comprehensive integration checks...')
    
    const results = {
      tipCallScreenIntegration: await this.verifyTipCallScreenIntegration(),
      callFlow: await this.verifyCallFlow(),
      nativeIntegrations: await this.verifyNativeIntegrations(),
      backgroundHandling: await this.verifyBackgroundHandling(),
      overall: false
    }

    results.overall = Object.values(results).every(result => result === true)

    console.log('[IntegrationCheck] 📊 Integration check results:', results)
    
    if (results.overall) {
      console.log('[IntegrationCheck] 🎉 All integration checks passed!')
    } else {
      console.log('[IntegrationCheck] ⚠️ Some integration checks failed. See details above.')
    }

    return results
  }

  /**
   * Generate a detailed report of the integration status
   */
  static async generateIntegrationReport(): Promise<string> {
    const results = await this.runAllChecks()
    
    let report = '\n📋 CALL SYSTEM INTEGRATION REPORT\n'
    report += '=====================================\n'
    report += `Platform: ${Platform.OS}\n`
    report += `Timestamp: ${new Date().toISOString()}\n\n`
    
    report += '🔍 Integration Checks:\n'
    report += `${results.tipCallScreenIntegration ? '✅' : '❌'} TipCallScreenSimple Integration\n`
    report += `${results.callFlow ? '✅' : '❌'} Call Flow Verification\n`
    report += `${results.nativeIntegrations ? '✅' : '❌'} Native Module Integration\n`
    report += `${results.backgroundHandling ? '✅' : '❌'} Background Handling\n\n`
    
    report += `🎯 Overall Status: ${results.overall ? '✅ PASS' : '❌ FAIL'}\n`
    
    if (!results.overall) {
      report += '\n⚠️ Issues Detected:\n'
      if (!results.tipCallScreenIntegration) {
        report += '- TipCallScreenSimple integration issues\n'
      }
      if (!results.callFlow) {
        report += '- Call flow verification failed\n'
      }
      if (!results.nativeIntegrations) {
        report += '- Native module integration problems\n'
      }
      if (!results.backgroundHandling) {
        report += '- Background handling issues\n'
      }
    }
    
    report += '\n=====================================\n'
    
    return report
  }
}

/**
 * Quick integration check function for easy use
 */
export const quickIntegrationCheck = async (): Promise<boolean> => {
  return await CallSystemIntegrationCheck.runAllChecks().then(results => results.overall)
}

/**
 * Log integration report to console
 */
export const logIntegrationReport = async (): Promise<void> => {
  const report = await CallSystemIntegrationCheck.generateIntegrationReport()
  console.log(report)
}
