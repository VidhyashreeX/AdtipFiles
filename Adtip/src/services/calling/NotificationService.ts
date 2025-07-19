import notifee, { AndroidImportance } from '@notifee/react-native'
import { CallType } from '../../stores/callStoreSimplified'
import { NativeModules, Platform } from 'react-native'
import CallKitService from './CallKitService'
import NotificationPersistenceService from './NotificationPersistenceService'

const { IncomingCallModule } = NativeModules

class NotificationService {
  private static _instance: NotificationService
  private incomingChannel = 'incoming-calls'
  private ongoingChannel = 'ongoing-calls'

  static getInstance() {
    if (!NotificationService._instance) NotificationService._instance = new NotificationService()
    return NotificationService._instance
  }

  private constructor() {
    this.createChannels()
    // Also initialize enhanced channels
    this.initializeEnhancedChannels().catch(error => {
      console.warn('[NotificationService] Failed to initialize enhanced channels:', error)
    })
  }

  private async createChannels() {
    await notifee.createChannel({ id: this.incomingChannel, name: 'Incoming Calls', importance: AndroidImportance.HIGH, sound: 'default', vibration: true })
    await notifee.createChannel({ id: this.ongoingChannel, name: 'Ongoing Calls', importance: AndroidImportance.DEFAULT })
  }

  async showIncomingCall(sessionId: string, callerName: string, type: CallType, meetingId?: string, token?: string) {
    console.log('[NotificationService] Showing incoming call notification:', { sessionId, callerName, type })

    // Check if CallKeep is handling the call first
    const callKeepService = await this.getCallKeepService()
    if (callKeepService && callKeepService.isAvailable()) {
      console.log('[NotificationService] CallKeep is available, skipping custom notification')
      return // Let CallKeep handle the call UI
    }

    // Add to persistence queue for reliability only if CallKeep is not available
    const persistenceService = NotificationPersistenceService.getInstance()
    await persistenceService.addPendingCall({
      sessionId,
      callerName,
      callType: type,
      meetingId,
      token
    })

    let notificationShown = false

    // Handle iOS CallKit integration (fallback when CallKeep unavailable)
    if (Platform.OS === 'ios') {
      const callKitService = CallKitService.getInstance()
      if (callKitService.isAvailable()) {
        try {
          const success = await callKitService.displayIncomingCall({
            sessionId,
            callerName,
            callType: type,
            meetingId,
            token
          })

          if (success) {
            console.log('[NotificationService] CallKit incoming call displayed')
            notificationShown = true
            // Remove from persistence queue since CallKit handled it
            await persistenceService.removePendingCall(sessionId)
          }
        } catch (error) {
          console.warn('[NotificationService] Failed to display CallKit call:', error)
        }
      }
    }

    // Trigger native call handling for Android
    if (Platform.OS === 'android' && IncomingCallModule) {
      try {
        await IncomingCallModule.triggerIncomingCall(sessionId, callerName, type, meetingId || '', token || '')
        console.log('[NotificationService] Native incoming call triggered')
      } catch (error) {
        console.warn('[NotificationService] Failed to trigger native call:', error)
      }
    }

    // Show Notifee notification as primary/fallback
    if (!notificationShown) {
      try {
        await notifee.displayNotification({
          id: sessionId,
          title: `Incoming ${type} call`,
          body: callerName,
          android: {
            channelId: this.incomingChannel,
            category: 'call' as any,
            fullScreenAction: { id: 'default' },
            actions: [
              { title: 'Answer', pressAction: { id: 'answer' } },
              { title: 'Decline', pressAction: { id: 'decline' } },
            ],
            importance: AndroidImportance.HIGH,
            pressAction: { id: 'default' },
            sound: 'default',
            vibrationPattern: [300, 1000, 300, 1000],
          },
          data: {
            sessionId,
            callerName,
            type,
            meetingId: meetingId || '',
            token: token || ''
          },
        })

        console.log('[NotificationService] Notifee notification displayed successfully')
        notificationShown = true

        // Remove from persistence queue since notification was shown
        await persistenceService.removePendingCall(sessionId)

      } catch (error) {
        console.error('[NotificationService] Failed to show Notifee notification:', error)

        // Create fallback notification
        await persistenceService.createFallbackNotification(sessionId, callerName, type)
      }
    }
  }

  async showOngoingCall(sessionId: string, peerName: string, type: CallType) {
    await notifee.displayNotification({
      id: sessionId,
      title: `${type} call`,
      body: `Talking with ${peerName}`,
      android: {
        channelId: this.ongoingChannel,
        ongoing: true,
        actions: [{ title: 'End', pressAction: { id: 'end' } }],
      },
    })
  }

  async hideNotification(id: string) {
    console.log('[NotificationService] Hiding notification:', id)

    // End native call handling
    if (Platform.OS === 'android' && IncomingCallModule) {
      try {
        await IncomingCallModule.endCall()
        console.log('[NotificationService] Native call ended')
      } catch (error) {
        console.warn('[NotificationService] Failed to end native call:', error)
      }
    }

    try {
      // Cancel the specific notification
      await notifee.cancelNotification(id)
      console.log('[NotificationService] Cancelled notification:', id)
    } catch (error) {
      console.warn('[NotificationService] Failed to cancel notification:', error)
    }

    // Also try to stop any ongoing foreground service
    try {
      await notifee.stopForegroundService()
      console.log('[NotificationService] Stopped foreground service')
    } catch (error) {
      console.warn('[NotificationService] Failed to stop foreground service:', error)
    }

    // Clear all notifications for this app as a fallback for persistent notifications
    try {
      await notifee.cancelAllNotifications()
      console.log('[NotificationService] Cleared all notifications as fallback')
    } catch (error) {
      console.warn('[NotificationService] Failed to clear all notifications:', error)
    }
  }

  /**
   * Initialize notification channels with enhanced settings
   */
  async initializeEnhancedChannels() {
    await notifee.createChannel({
      id: this.incomingChannel,
      name: 'Incoming Calls',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      vibrationPattern: [300, 1000, 300, 1000],
      lights: true,
      lightColor: '#00D4AA',
      badge: true,
    })

    await notifee.createChannel({
      id: this.ongoingChannel,
      name: 'Ongoing Calls',
      importance: AndroidImportance.DEFAULT,
      sound: 'default',
      vibration: false,
    })

    console.log('[NotificationService] Enhanced notification channels created')
  }

  /**
   * Get CallKeepService instance to check availability
   */
  private async getCallKeepService() {
    try {
      const CallKeepServiceModule = await import('./CallKeepService')
      const CallKeepService = CallKeepServiceModule.CallKeepService
      return CallKeepService.getInstance()
    } catch (error) {
      console.warn('[NotificationService] CallKeepService not available:', error)
      return null
    }
  }
}

export default NotificationService