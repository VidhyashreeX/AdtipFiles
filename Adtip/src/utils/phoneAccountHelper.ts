/**
 * Phone Account Helper Utility
 * 
 * Helps users understand and enable CallKeep phone account permissions on Android
 */

import { Platform, Alert, Linking } from 'react-native'
import CallKeepService from '../services/calling/CallKeepService'

export class PhoneAccountHelper {
  private static instance: PhoneAccountHelper
  
  public static getInstance(): PhoneAccountHelper {
    if (!PhoneAccountHelper.instance) {
      PhoneAccountHelper.instance = new PhoneAccountHelper()
    }
    return PhoneAccountHelper.instance
  }

  /**
   * Check if phone account is enabled and show appropriate guidance
   */
  async checkAndGuideUser(): Promise<{
    isEnabled: boolean;
    needsManualSetup: boolean;
    message: string;
  }> {
    if (Platform.OS !== 'android') {
      return {
        isEnabled: true,
        needsManualSetup: false,
        message: 'iOS handles CallKeep permissions automatically'
      }
    }

    const callKeepService = CallKeepService.getInstance()
    
    try {
      // Check current status
      const hasPhoneAccount = await callKeepService.checkBasicPermissions()
      const isAvailable = callKeepService.isAvailable()
      const status = callKeepService.getCallKeepStatus()

      if (hasPhoneAccount && isAvailable) {
        return {
          isEnabled: true,
          needsManualSetup: false,
          message: '✅ Phone account is enabled - native call UI available!'
        }
      } else if (hasPhoneAccount && !isAvailable) {
        return {
          isEnabled: false,
          needsManualSetup: true,
          message: '⚠️ Phone account exists but CallKeep not available - check app configuration'
        }
      } else {
        return {
          isEnabled: false,
          needsManualSetup: true,
          message: '📱 Phone account not enabled - manual setup required in Android Settings'
        }
      }
    } catch (error) {
      console.error('[PhoneAccountHelper] Error checking phone account:', error)
      return {
        isEnabled: false,
        needsManualSetup: true,
        message: '❌ Error checking phone account status'
      }
    }
  }

  /**
   * Show user-friendly explanation and guidance
   */
  async showSetupGuidance(): Promise<void> {
    const status = await this.checkAndGuideUser()
    
    if (status.isEnabled) {
      Alert.alert(
        '✅ CallKeep Enabled',
        'Your phone account is properly configured! You\'ll get native call interface for incoming calls.',
        [{ text: 'Great!', style: 'default' }]
      )
      return
    }

    Alert.alert(
      '📱 Enable Native Call Interface',
      'To get the best calling experience with native phone app integration:\n\n' +
      '🔧 Steps to enable:\n' +
      '1. Open Android Settings\n' +
      '2. Go to Apps → Adtip\n' +
      '3. Look for "Phone Account" or "Calling Account"\n' +
      '4. Toggle it ON\n' +
      '5. Restart the Adtip app\n\n' +
      '💡 Note: The app works perfectly without this - it will use custom notifications for calls.',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Open Settings', onPress: this.openAppSettings },
        { text: 'Check Status', onPress: this.checkStatusAndReport }
      ]
    )
  }

  /**
   * Open Android app settings
   */
  private async openAppSettings(): Promise<void> {
    try {
      await Linking.openSettings()
    } catch (error) {
      console.warn('[PhoneAccountHelper] Could not open app settings:', error)
      Alert.alert(
        'Settings',
        'Please manually open Android Settings → Apps → Adtip → Phone Account',
        [{ text: 'OK' }]
      )
    }
  }

  /**
   * Check status and report to user
   */
  private checkStatusAndReport = async (): Promise<void> => {
    const status = await this.checkAndGuideUser()
    
    Alert.alert(
      'Phone Account Status',
      status.message + '\n\n' + 
      (status.isEnabled 
        ? 'You\'re all set! Restart the app to use native call interface.'
        : 'If you\'ve enabled it in Settings, please restart the app.'),
      [
        { text: 'OK' },
        ...(status.isEnabled ? [] : [{ text: 'Open Settings', onPress: this.openAppSettings }])
      ]
    )
  }

  /**
   * Show explanation of why phone account is needed
   */
  async showExplanation(): Promise<void> {
    Alert.alert(
      '📞 About Phone Account Permission',
      'Phone Account permission allows Adtip to:\n\n' +
      '✅ Show incoming calls in your phone\'s native interface\n' +
      '✅ Display calls in your call history\n' +
      '✅ Work with Bluetooth headsets and car systems\n' +
      '✅ Provide the same experience as regular phone calls\n\n' +
      '🔒 Security: This permission is manually controlled by you in Android Settings. ' +
      'Apps cannot automatically enable it - you must choose to enable it.\n\n' +
      '💡 Without this permission, calls still work perfectly using custom notifications.',
      [
        { text: 'Understood' },
        { text: 'Enable Now', onPress: this.showSetupGuidance }
      ]
    )
  }

  /**
   * Quick status check (for debugging)
   */
  async getQuickStatus(): Promise<string> {
    const status = await this.checkAndGuideUser()
    return status.message
  }
}

export default PhoneAccountHelper
