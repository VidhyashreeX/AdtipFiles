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
      try {
        console.log('[FCM] Foreground message:', remoteMessage)

        // Check if this is a call-related message
        if (
          remoteMessage.data?.type === 'CALL_INITIATE' ||
          remoteMessage.data?.type === 'CALL_ACCEPT' ||
          remoteMessage.data?.type === 'CALL_END'
        ) {
          callController.handleFCMMessage(remoteMessage)
        }
      } catch (error) {
        console.error('[FCM] Error handling foreground message:', error)
      }
    })
    
    // Handle notification press events from Notifee
    const unsubscribeNotifee = notifee.onForegroundEvent(async ({ type, detail }) => {
      try {
        if (type === EventType.ACTION_PRESS) {
          // Get session ID from notification
          const sessionId = detail.notification?.data?.sessionId as string

          if (!sessionId) {
            console.warn('[FCM] No sessionId in notification data')
            return
          }

          console.log('[FCM] Notification action pressed:', detail.pressAction?.id)

          switch (detail.pressAction?.id) {
            case 'answer':
              await callController.acceptCall()
              break

            case 'decline':
            case 'end':
              await callController.endCall()
              break

            default:
              console.warn('[FCM] Unknown notification action:', detail.pressAction?.id)
          }
        }
      } catch (error) {
        console.error('[FCM] Error handling notification action:', error)
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