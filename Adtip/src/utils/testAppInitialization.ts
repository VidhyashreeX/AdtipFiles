import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * Test app initialization to help debug blank screen issues
 */
export const testAppInitialization = async (): Promise<void> => {
  console.log('\n🧪 === APP INITIALIZATION TEST ===')
  
  try {
    // Test 1: AsyncStorage access
    console.log('📱 Testing AsyncStorage...')
    await AsyncStorage.setItem('test_key', 'test_value')
    const testValue = await AsyncStorage.getItem('test_key')
    console.log('✅ AsyncStorage working:', testValue === 'test_value')
    await AsyncStorage.removeItem('test_key')
    
    // Test 2: Check user data
    console.log('👤 Checking user data...')
    const userJson = await AsyncStorage.getItem('user')
    const token = await AsyncStorage.getItem('accessToken')
    console.log('  - User data:', userJson ? 'Present' : 'Missing')
    console.log('  - Token:', token ? 'Present' : 'Missing')
    
    // Test 3: Check guest mode
    console.log('🔍 Checking guest mode...')
    const guestMode = await AsyncStorage.getItem('@guest_mode')
    console.log('  - Guest mode:', guestMode || 'Not set')
    
    // Test 4: Navigation service
    console.log('🧭 Testing navigation service...')
    try {
      const { navigationRef } = await import('../navigation/NavigationService')
      console.log('✅ Navigation service imported successfully')
      console.log('  - Ready:', navigationRef.isReady())
    } catch (navError) {
      console.log('❌ Navigation service error:', navError)
    }
    
    // Test 5: Theme context
    console.log('🎨 Testing theme context...')
    try {
      await import('../contexts/ThemeContext')
      console.log('✅ Theme context imported successfully')
    } catch (themeError) {
      console.log('❌ Theme context error:', themeError)
    }
    
    // Test 6: Auth context
    console.log('🔐 Testing auth context...')
    try {
      await import('../contexts/AuthContext')
      console.log('✅ Auth context imported successfully')
    } catch (authError) {
      console.log('❌ Auth context error:', authError)
    }
    
    // Test 7: Call services
    console.log('📞 Testing call services...')
    try {
      const { BackgroundCallHandler } = await import('../services/calling/BackgroundCallHandler')
      const handler = BackgroundCallHandler.getInstance()
      console.log('✅ Background call handler working')
      console.log('  - Has pending call:', handler.hasPendingCall())
    } catch (callError) {
      console.log('❌ Call service error:', callError)
    }
    
    console.log('✅ App initialization test complete')
    
  } catch (error) {
    console.error('🚨 App initialization test failed:', error)
  }
  
  console.log('=== END TEST ===\n')
}

/**
 * Force clear all app data (for testing)
 */
export const clearAllAppData = async (): Promise<void> => {
  try {
    console.log('🧹 Clearing all app data...')
    
    const keys = await AsyncStorage.getAllKeys()
    await AsyncStorage.multiRemove(keys)
    
    console.log('✅ All app data cleared')
  } catch (error) {
    console.error('❌ Error clearing app data:', error)
  }
}

/**
 * Reset to fresh app state
 */
export const resetToFreshState = async (): Promise<void> => {
  try {
    console.log('🔄 Resetting to fresh app state...')
    
    await clearAllAppData()
    
    // Force reload the app (if possible)
    const { DevSettings } = await import('react-native')
    if (DevSettings && DevSettings.reload) {
      console.log('🔄 Reloading app...')
      DevSettings.reload()
    }
    
  } catch (error) {
    console.error('❌ Error resetting app state:', error)
  }
}

export default testAppInitialization
