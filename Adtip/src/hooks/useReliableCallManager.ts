import { useEffect } from 'react'
import ReliableCallManager from '../services/calling/ReliableCallManager'

/**
 * Hook to initialize and manage the ReliableCallManager
 * This replaces the old useFcmCallHandlers hook with a more reliable implementation
 */
const useReliableCallManager = () => {
  useEffect(() => {
    let callManager: ReliableCallManager | null = null

    const initializeCallManager = async () => {
      try {
        console.log('[useReliableCallManager] Initializing call manager...')
        
        callManager = ReliableCallManager.getInstance()
        await callManager.initialize()
        
        console.log('[useReliableCallManager] Call manager initialized successfully')
      } catch (error) {
        console.error('[useReliableCallManager] Failed to initialize call manager:', error)
      }
    }

    // Initialize the call manager
    initializeCallManager()

    // Cleanup function
    return () => {
      if (callManager) {
        console.log('[useReliableCallManager] Cleaning up call manager')
        callManager.destroy()
      }
    }
  }, [])
}

export default useReliableCallManager
