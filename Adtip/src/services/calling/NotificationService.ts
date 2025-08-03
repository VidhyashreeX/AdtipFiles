import notifee, { AndroidImportance } from '@notifee/react-native'
import { CallType } from '../../stores/callStoreSimplified'
import { NativeModules, Platform } from 'react-native'
import CallKitService from './CallKitService'
import NotificationPersistenceService from './NotificationPersistenceService'
import { logCall, logError, logWarn } from '../../utils/ProductionLogger'

// Check if IncomingCallModule exists to prevent crashes
const { IncomingCallModule } = NativeModules
const isIncomingCallModuleAvailable = IncomingCallModule && typeof IncomingCallModule === 'object'

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
      logWarn('NotificationService', 'Failed to initialize enhanced channels', error)
    })
  }

  private async createChannels() {
    await notifee.createChannel({ id: this.incomingChannel, name: 'Incoming Calls', importance: AndroidImportance.HIGH, sound: 'default', vibration: true })
    await notifee.createChannel({ id: this.ongoingChannel, name: 'Ongoing Calls', importance: AndroidImportance.DEFAULT })
  }

  async showIncomingCall(sessionId: string, callerName: string, type: CallType, isConcurrentCall: boolean = false, meetingId?: string, token?: string) {
    logCall('NotificationService', 'Showing incoming call notification', { sessionId, callerName, type, isConcurrentCall })

    // Check if CallKeep is handling the call first
    const callKeepService = await this.getCallKeepService()
    if (callKeepService && callKeepService.isAvailable()) {
      logCall('NotificationService', 'CallKeep is available, skipping custom notification')
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
            logCall('NotificationService', 'CallKit incoming call displayed')
            notificationShown = true
            // Remove from persistence queue since CallKit handled it
            await persistenceService.removePendingCall(sessionId)
          }
        } catch (error) {
          logWarn('NotificationService', 'Failed to display CallKit call', error)
        }
      }
    }

    // Trigger native call handling for Android
    if (Platform.OS === 'android' && isIncomingCallModuleAvailable) {
      try {
        await IncomingCallModule.triggerIncomingCall(sessionId, callerName, type, meetingId || '', token || '')
        logCall('NotificationService', 'Native incoming call triggered')
      } catch (error) {
        logWarn('NotificationService', 'Failed to trigger native call', error)
      }
    }

    // Show Notifee notification as primary/fallback
    if (!notificationShown) {
      try {
        await notifee.displayNotification({
          id: sessionId,
          title: isConcurrentCall ? `New ${type} call (while in call)` : `Incoming ${type} call`,
          body: isConcurrentCall ? `${callerName} - Accept to end current call` : callerName,
          android: {
            channelId: this.incomingChannel,
            category: 'call' as any,
            fullScreenAction: { id: 'default' },
            actions: isConcurrentCall ? [
              { title: 'Accept & End Current', pressAction: { id: 'answer' } },
              { title: 'Decline', pressAction: { id: 'decline' } },
            ] : [
              { title: 'Answer', pressAction: { id: 'answer' } },
              { title: 'Decline', pressAction: { id: 'decline' } },
            ],
            importance: AndroidImportance.HIGH,
            pressAction: { id: 'default' },
            sound: 'default',
            vibrationPattern: isConcurrentCall ? [200, 300, 200, 300, 200, 300] : [300, 1000, 300, 1000],
          },
          data: {
            sessionId,
            callerName,
            type,
            meetingId: meetingId || '',
            token: token || '',
            isConcurrentCall: isConcurrentCall.toString()
          },
        })

        logCall('NotificationService', 'Notifee notification displayed successfully')
        notificationShown = true

        // Remove from persistence queue since notification was shown
        await persistenceService.removePendingCall(sessionId)

      } catch (error) {
        logError('NotificationService', 'Failed to show Notifee notification', error)

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
    logCall('NotificationService', 'Hiding notification', { id })

    // End native call handling
    if (Platform.OS === 'android' && isIncomingCallModuleAvailable) {
      try {
        await IncomingCallModule.endCall()
        logCall('NotificationService', 'Native call ended')
      } catch (error) {
        logWarn('NotificationService', 'Failed to end native call', error)
      }
    }

    try {
      // Cancel the specific notification
      await notifee.cancelNotification(id)
      logCall('NotificationService', 'Cancelled notification', { id })
    } catch (error) {
      logWarn('NotificationService', 'Failed to cancel notification', error)
    }

    // Also try to stop any ongoing foreground service
    try {
      await notifee.stopForegroundService()
      logCall('NotificationService', 'Stopped foreground service')
    } catch (error) {
      logWarn('NotificationService', 'Failed to stop foreground service', error)
    }

    // Clear all notifications for this app as a fallback for persistent notifications
    try {
      await notifee.cancelAllNotifications()
      logCall('NotificationService', 'Cleared all notifications as fallback')
    } catch (error) {
      logWarn('NotificationService', 'Failed to clear all notifications', error)
    }
  }

  /**
   * Hide all call-related notifications
   */
  async hideAllNotifications() {
    logCall('NotificationService', 'Hiding all call notifications')

    // End native call handling
    if (Platform.OS === 'android' && isIncomingCallModuleAvailable) {
      try {
        await IncomingCallModule.endCall()
        logCall('NotificationService', 'Native call ended')
      } catch (error) {
        logWarn('NotificationService', 'Failed to end native call', error)
      }
    }

    try {
      // Cancel all notifications
      await notifee.cancelAllNotifications()
      logCall('NotificationService', 'Cancelled all notifications')
    } catch (error) {
      logWarn('NotificationService', 'Failed to cancel all notifications', error)
    }

    // Stop any ongoing foreground service
    try {
      await notifee.stopForegroundService()
      logCall('NotificationService', 'Stopped foreground service')
    } catch (error) {
      logWarn('NotificationService', 'Failed to stop foreground service', error)
    }

    // Clear CallKeep if available
    try {
      const callKeepService = await this.getCallKeepService()
      if (callKeepService) {
        await callKeepService.endAllCalls()
        logCall('NotificationService', 'CallKeep calls ended')
      }
    } catch (error) {
      logWarn('NotificationService', 'Failed to end CallKeep calls', error)
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

    logCall('NotificationService', 'Enhanced notification channels created')
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
      logWarn('NotificationService', 'CallKeepService not available', error)
      return null
    }
  }
}

export default NotificationService