import { Platform } from 'react-native'
import RNCallKeep from 'react-native-callkeep'

/**
 * CallKeep Debug Utility
 * Use this to diagnose CallKeep initialization issues
 */
export class CallKeepDebugger {
  
  /**
   * Run comprehensive CallKeep diagnostics
   */
  static async runDiagnostics(): Promise<void> {
    console.log('🔍 [CallKeepDebugger] Starting comprehensive CallKeep diagnostics...')
    console.log('📱 Platform:', Platform.OS)
    console.log('📱 Platform Version:', Platform.Version)
    
    // Check if CallKeep module is available
    console.log('\n1️⃣ Checking CallKeep module availability...')
    if (!RNCallKeep) {
      console.error('❌ CallKeep module is not available')
      return
    }
    console.log('✅ CallKeep module is available')
    
    // Check available methods
    console.log('\n2️⃣ Checking available CallKeep methods...')
    const requiredMethods = [
      'setup',
      'displayIncomingCall',
      'startCall',
      'endCall',
      'answerIncomingCall',
      'rejectCall'
    ]
    
    for (const method of requiredMethods) {
      if (typeof RNCallKeep[method] === 'function') {
        console.log(`✅ ${method} is available`)
      } else {
        console.error(`❌ ${method} is NOT available`)
      }
    }
    
    // Platform-specific checks
    if (Platform.OS === 'android') {
      await this.runAndroidDiagnostics()
    } else if (Platform.OS === 'ios') {
      await this.runIOSDiagnostics()
    }
    
    console.log('\n🏁 CallKeep diagnostics complete!')
  }
  
  /**
   * Android-specific diagnostics
   */
  private static async runAndroidDiagnostics(): Promise<void> {
    console.log('\n🤖 Running Android-specific diagnostics...')
    
    try {
      // Check if ConnectionService is supported
      if (typeof RNCallKeep.supportConnectionService === 'function') {
        const isSupported = await RNCallKeep.supportConnectionService()
        console.log('📞 ConnectionService supported:', isSupported)
      }
      
      // Check if phone account exists
      if (typeof RNCallKeep.hasPhoneAccount === 'function') {
        const hasAccount = await RNCallKeep.hasPhoneAccount()
        console.log('📱 Phone account exists:', hasAccount)
      }
      
      // Check if default phone account is set
      if (typeof RNCallKeep.hasDefaultPhoneAccount === 'function') {
        const hasDefault = await RNCallKeep.hasDefaultPhoneAccount()
        console.log('📱 Default phone account set:', hasDefault)
      }
      
      // Check if phone account is enabled
      if (typeof RNCallKeep.checkPhoneAccountEnabled === 'function') {
        const isEnabled = await RNCallKeep.checkPhoneAccountEnabled()
        console.log('📱 Phone account enabled:', isEnabled)
      }
      
    } catch (error) {
      console.error('❌ Android diagnostics failed:', error)
    }
  }
  
  /**
   * iOS-specific diagnostics
   */
  private static async runIOSDiagnostics(): Promise<void> {
    console.log('\n🍎 Running iOS-specific diagnostics...')
    
    try {
      // Check if there are active calls
      if (typeof RNCallKeep.isCallActive === 'function') {
        // Note: This requires a UUID, so we'll skip for now
        console.log('📞 isCallActive method available')
      }
      
      // Check current calls
      if (typeof RNCallKeep.getCalls === 'function') {
        const calls = await RNCallKeep.getCalls()
        console.log('📞 Current calls:', calls)
      }
      
    } catch (error) {
      console.error('❌ iOS diagnostics failed:', error)
    }
  }
  
  /**
   * Test basic CallKeep setup with minimal configuration
   */
  static async testBasicSetup(): Promise<boolean> {
    console.log('\n🧪 Testing basic CallKeep setup...')
    
    try {
      const options = {
        ios: {
          appName: 'Adtip Test',
          supportsVideo: false,
          maximumCallGroups: '1',
          maximumCallsPerCallGroup: '1'
        },
        android: {
          alertTitle: 'Test Permission',
          alertDescription: 'Testing CallKeep setup',
          cancelButton: 'Cancel',
          okButton: 'OK',
          additionalPermissions: []
        }
      }
      
      console.log('🔧 Attempting setup with minimal options...')
      await RNCallKeep.setup(options)
      console.log('✅ Basic setup successful!')
      
      // Set availability for Android
      if (Platform.OS === 'android' && typeof RNCallKeep.setAvailable === 'function') {
        await RNCallKeep.setAvailable(true)
        console.log('✅ Availability set to true')
      }
      
      return true
      
    } catch (error) {
      console.error('❌ Basic setup failed:', error)
      return false
    }
  }
  
  /**
   * Test permission flow
   */
  static async testPermissions(): Promise<void> {
    console.log('\n🔐 Testing permission flow...')
    
    if (Platform.OS === 'android') {
      try {
        // Check permissions
        if (typeof RNCallKeep.hasPhoneAccount === 'function') {
          const hasPermissions = await RNCallKeep.hasPhoneAccount()
          console.log('📋 Has permissions:', hasPermissions)
          
          if (!hasPermissions) {
            console.log('📱 Attempting to register phone account...')
            if (typeof RNCallKeep.registerPhoneAccount === 'function') {
              await RNCallKeep.registerPhoneAccount({
                android: {
                  alertTitle: 'Test Permission',
                  alertDescription: 'Testing permission request',
                  cancelButton: 'Cancel',
                  okButton: 'OK'
                }
              })
              console.log('✅ Phone account registration attempted')
            }
          }
        }
      } catch (error) {
        console.error('❌ Permission test failed:', error)
      }
    } else {
      console.log('📱 iOS permissions are handled automatically')
    }
  }
}
