import { useEffect } from 'react'
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import notifee, { EventType } from '@notifee/react-native'
import CallController from '../services/calling/CallController'

/**
 * Hook to set up FCM and Notifee handlers for the new call architecture
 * This should be used in App.tsx or a similar root component
 */
export function useFcmCallHandlers() {
  useEffect(() => {
    // Initialize controller
    const callController = CallController.getInstance()
    
    // Handle FCM messages in foreground
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log('[FCM] Foreground message:', remoteMessage)
      
      // Check if this is a call-related message
      if (
        remoteMessage.data?.type === 'CALL_INITIATE' ||
        remoteMessage.data?.type === 'CALL_ACCEPT' ||
        remoteMessage.data?.type === 'CALL_END'
      ) {
        callController.handleFCMMessage(remoteMessage)
      }
    })
    
    // Handle notification press events from Notifee
    const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.ACTION_PRESS) {
        // Get session ID from notification
        const sessionId = detail.notification?.data?.sessionId as string
        
        if (!sessionId) return
        
        switch (detail.pressAction?.id) {
          case 'answer':
            callController.acceptCall()
            break
            
          case 'decline':
          case 'end':
            callController.endCall()
            break
        }
      }
    })
    
    // Clean up
    return () => {
      unsubscribeForeground()
      unsubscribeNotifee()
    }
  }, [])
  
  // For handling background FCM messages, add a helper function in index.js
  // that calls callController.handleFCMMessage
} 

export default useFcmCallHandlers; 