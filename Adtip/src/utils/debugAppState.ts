import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * Debug utility to help diagnose app initialization issues
 */
export const debugAppState = async (): Promise<void> => {
  try {
    console.log('\n🔍 === APP STATE DEBUG ===')
    
    // Check AsyncStorage state
    const userJson = await AsyncStorage.getItem('user')
    const token = await AsyncStorage.getItem('accessToken')
    const guestMode = await AsyncStorage.getItem('@guest_mode')
    
    console.log('📱 AsyncStorage State:')
    console.log('  - User:', userJson ? 'Present' : 'Missing')
    console.log('  - Token:', token ? 'Present' : 'Missing')
    console.log('  - Guest Mode:', guestMode || 'Not set')
    
    if (userJson) {
      try {
        const userData = JSON.parse(userJson)
        console.log('👤 User Data:')
        console.log('  - ID:', userData.id)
        console.log('  - Name:', userData.name || 'Missing')
        console.log('  - First Time:', userData.is_first_time)
        console.log('  - Save Details:', userData.isSaveUserDetails)
      } catch (parseError) {
        console.log('❌ User data parse error:', parseError)
      }
    }
    
    // Check navigation state
    const { navigationRef } = await import('../navigation/NavigationService')
    console.log('🧭 Navigation State:')
    console.log('  - Ready:', navigationRef.isReady())
    console.log('  - Current Route:', navigationRef.isReady() ? navigationRef.getCurrentRoute()?.name : 'Not ready')
    
    // Check call services
    try {
      const { BackgroundCallHandler } = await import('../services/calling/BackgroundCallHandler')
      const handler = BackgroundCallHandler.getInstance()
      console.log('📞 Call Services:')
      console.log('  - Background Handler:', 'Initialized')
      console.log('  - Pending Call:', handler.hasPendingCall())
    } catch (callError) {
      console.log('📞 Call Services: Error -', callError.message)
    }
    
    console.log('=== END DEBUG ===\n')
  } catch (error) {
    console.error('🚨 Debug utility error:', error)
  }
}

/**
 * Monitor app state changes for debugging
 */
export const startAppStateMonitoring = (): (() => void) => {
  console.log('🔍 Starting app state monitoring...')
  
  let checkCount = 0
  const maxChecks = 20 // Stop after 20 checks (2 minutes)
  
  const interval = setInterval(async () => {
    checkCount++
    console.log(`🔍 App State Check #${checkCount}`)
    
    await debugAppState()
    
    if (checkCount >= maxChecks) {
      console.log('🔍 App state monitoring stopped (max checks reached)')
      clearInterval(interval)
    }
  }, 6000) // Check every 6 seconds
  
  // Return cleanup function
  return () => {
    console.log('🔍 App state monitoring stopped (manual)')
    clearInterval(interval)
  }
}

export default debugAppState
