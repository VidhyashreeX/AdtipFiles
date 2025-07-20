import { Platform, Alert } from 'react-native'
import { CallKeepService } from '../services/calling/CallKeepService'
import CallUICoordinator from '../services/calling/CallUICoordinator'

/**
 * Utility functions for managing CallKeep permissions
 */
export class CallKeepPermissionHelper {
  /**
   * Check if CallKeep permissions are granted
   */
  static async checkPermissions(): Promise<boolean> {
    try {
      if (Platform.OS !== 'android') {
        return true // iOS doesn't need explicit CallKeep permissions
      }

      const callKeepService = CallKeepService.getInstance()
      return await callKeepService.checkPermissions()
    } catch (error) {
      console.error('[CallKeepPermissionHelper] Error checking permissions:', error)
      return false
    }
  }

  /**
   * Request CallKeep permissions with user-friendly messaging
   */
  static async requestPermissions(showAlert = true): Promise<boolean> {
    try {
      if (Platform.OS !== 'android') {
        return true // iOS doesn't need explicit CallKeep permissions
      }

      const hasPermissions = await this.checkPermissions()
      if (hasPermissions) {
        return true // Already granted
      }

      if (showAlert) {
        return new Promise((resolve) => {
          Alert.alert(
            'Native Call Experience',
            'Adtip can provide a native call experience similar to regular phone calls. This requires phone account permissions.',
            [
              {
                text: 'Skip',
                style: 'cancel',
                onPress: () => resolve(false)
              },
              {
                text: 'Enable',
                onPress: async () => {
                  const result = await this.requestPermissionsInternal()
                  resolve(result)
                }
              }
            ]
          )
        })
      } else {
        return await this.requestPermissionsInternal()
      }
    } catch (error) {
      console.error('[CallKeepPermissionHelper] Error requesting permissions:', error)
      return false
    }
  }

  /**
   * Internal method to request permissions without user dialog
   */
  private static async requestPermissionsInternal(): Promise<boolean> {
    try {
      const coordinator = CallUICoordinator.getInstance()
      const result = await coordinator.requestPermissions()
      
      if (result) {
        console.log('[CallKeepPermissionHelper] CallKeep permissions granted')
      } else {
        console.warn('[CallKeepPermissionHelper] CallKeep permissions denied')
      }
      
      return result
    } catch (error) {
      console.error('[CallKeepPermissionHelper] Error in internal permission request:', error)
      return false
    }
  }

  /**
   * Check if CallKeep is available and properly configured
   */
  static async isCallKeepAvailable(): Promise<boolean> {
    try {
      const callKeepService = CallKeepService.getInstance()
      
      // Check if service is available
      if (!callKeepService.isAvailable()) {
        return false
      }

      // Check if permissions are granted (Android only)
      if (Platform.OS === 'android') {
        return await callKeepService.checkPermissions()
      }

      return true
    } catch (error) {
      console.error('[CallKeepPermissionHelper] Error checking availability:', error)
      return false
    }
  }

  /**
   * Get permission status with detailed information
   */
  static async getPermissionStatus(): Promise<{
    available: boolean
    permissions: boolean
    platform: string
    needsPermission: boolean
  }> {
    try {
      const callKeepService = CallKeepService.getInstance()
      const available = callKeepService.isAvailable()
      const needsPermission = Platform.OS === 'android'
      
      let permissions = true
      if (needsPermission) {
        permissions = await callKeepService.checkPermissions()
      }

      return {
        available,
        permissions,
        platform: Platform.OS,
        needsPermission
      }
    } catch (error) {
      console.error('[CallKeepPermissionHelper] Error getting status:', error)
      return {
        available: false,
        permissions: false,
        platform: Platform.OS,
        needsPermission: Platform.OS === 'android'
      }
    }
  }

  /**
   * Show detailed permission status to user
   */
  static async showPermissionStatus(): Promise<void> {
    try {
      const status = await this.getPermissionStatus()
      
      let message = `Platform: ${status.platform}\n`
      message += `CallKeep Available: ${status.available ? 'Yes' : 'No'}\n`
      
      if (status.needsPermission) {
        message += `Permissions Granted: ${status.permissions ? 'Yes' : 'No'}\n`
        if (!status.permissions) {
          message += '\nCallKeep permissions are required for native call experience.'
        }
      } else {
        message += 'No additional permissions required on this platform.'
      }

      Alert.alert('CallKeep Status', message, [{ text: 'OK' }])
    } catch (error) {
      console.error('[CallKeepPermissionHelper] Error showing status:', error)
      Alert.alert('Error', 'Unable to check CallKeep status', [{ text: 'OK' }])
    }
  }
}

export default CallKeepPermissionHelper
