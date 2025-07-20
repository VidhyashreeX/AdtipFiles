import { useState, useEffect } from 'react'
import { Platform } from 'react-native'
import { CallKeepService } from '../services/calling/CallKeepService'

/**
 * Hook to manage CallKeep permissions and show guidance when needed
 */
export const useCallKeepPermissions = () => {
  const [hasPermissions, setHasPermissions] = useState(false)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  const checkPermissions = async () => {
    if (Platform.OS !== 'android') {
      setHasPermissions(true)
      return true
    }

    setIsChecking(true)
    try {
      const callKeepService = CallKeepService.getInstance()
      
      // Wait for CallKeep to be initialized
      if (!callKeepService.isAvailable()) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      const permissions = await callKeepService.hasRequiredPermissions()
      const manualSetup = callKeepService.needsManualSetup()
      
      setHasPermissions(permissions)
      setNeedsSetup(manualSetup)
      
      // Show guide if permissions are needed and manual setup is required
      if (!permissions && manualSetup) {
        setShowGuide(true)
      }
      
      return permissions
    } catch (error) {
      console.error('[useCallKeepPermissions] Error checking permissions:', error)
      return false
    } finally {
      setIsChecking(false)
    }
  }

  const requestPermissions = async () => {
    if (Platform.OS !== 'android') {
      return true
    }

    setIsChecking(true)
    try {
      const callKeepService = CallKeepService.getInstance()
      const result = await callKeepService.registerPhoneAccountWithGuidance()
      
      // Check permissions again after request
      await checkPermissions()
      
      return result
    } catch (error) {
      console.error('[useCallKeepPermissions] Error requesting permissions:', error)
      return false
    } finally {
      setIsChecking(false)
    }
  }

  const hideGuide = () => {
    setShowGuide(false)
  }

  const showPermissionGuide = () => {
    setShowGuide(true)
  }

  useEffect(() => {
    // Check permissions when hook is first used
    const timer = setTimeout(() => {
      checkPermissions()
    }, 3000) // Wait 3 seconds for CallKeep to initialize

    return () => clearTimeout(timer)
  }, [])

  return {
    hasPermissions,
    needsSetup,
    isChecking,
    showGuide,
    checkPermissions,
    requestPermissions,
    hideGuide,
    showPermissionGuide
  }
}
