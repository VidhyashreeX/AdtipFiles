import notifee, { AndroidImportance } from '@notifee/react-native'
import { CallType } from '../../stores/callStoreSimplified'
import { NativeModules, Platform } from 'react-native'
import CallKitService from './CallKitService'
import NotificationPersistenceService from './NotificationPersistenceService'
import { logCall, logError, logWarn } from '../../utils/ProductionLogger'
import NotifeeCallHandler from '../notification/NotifeeCallHandler'

// Import default logo for notifications
// eslint-disable-next-line @typescript-eslint/no-require-imports
const defaultLogo = require('../../assets/images/logo.png')

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

  /**
   * Create deep link for call navigation
   */
  private createCallDeepLink(callData: {
    sessionId: string;
    meetingId: string;
    token: string;
    callerName: string;
    callerId: string;
    callType: CallType;
  }): string {
    try {
      const baseUrl = 'adtip://call/meeting'
      const path = `${baseUrl}/${callData.sessionId}`

      const params = new URLSearchParams({
        meetingId: callData.meetingId,
        token: callData.token,
        callerName: callData.callerName,
        callerId: callData.callerId,
        callType: callData.callType,
        direction: 'incoming',
        source: 'notification'
      })

      return `${path}?${params.toString()}`
    } catch (error) {
      logError('NotificationService', 'Error creating deep link', error)
      return 'adtip://call/meeting'
    }
  }

  /**
   * Initialize enhanced notification channels with better categorization
   */
  private async initializeEnhancedChannels() {
    try {
      // Voice call specific channel
      await notifee.createChannel({
        id: 'voice-calls',
        name: 'Voice Calls',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
        description: 'Voice call notifications with enhanced caller information'
      })

      // Video call specific channel
      await notifee.createChannel({
        id: 'video-calls',
        name: 'Video Calls',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
        description: 'Video call notifications with enhanced caller information'
      })

      // Missed calls channel
      await notifee.createChannel({
        id: 'missed-calls',
        name: 'Missed Calls',
        importance: AndroidImportance.DEFAULT,
        description: 'Notifications for missed calls'
      })

      logCall('NotificationService', 'Enhanced notification channels initialized')
    } catch (error) {
      logError('NotificationService', 'Failed to initialize enhanced channels', error)
    }
  }

  private async createChannels() {
    await notifee.createChannel({
      id: this.incomingChannel,
      name: 'Incoming Calls',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      description: 'Notifications for incoming voice and video calls'
    })
    await notifee.createChannel({
      id: this.ongoingChannel,
      name: 'Ongoing Calls',
      importance: AndroidImportance.DEFAULT,
      description: 'Persistent notifications for active calls'
    })
  }

  async showIncomingCall(sessionId: string, callerName: string, type: CallType, isConcurrentCall: boolean = false, meetingId?: string, token?: string, callerId?: string, callerAvatar?: string) {
    logCall('NotificationService', 'Showing incoming call notification', { sessionId, callerName, type, isConcurrentCall, callerId })

    // Check if CallKeep is handling the call first
    const callKeepService = await this.getCallKeepService()
    if (callKeepService && callKeepService.isAvailable()) {
      logCall('NotificationService', 'CallKeep is available, skipping custom notification')
      return // Let CallKeep handle the call UI
    }

    // Try using NotifeeCallHandler first for better reliability
    try {
      const notifeeHandler = NotifeeCallHandler.getInstance()
      const success = await notifeeHandler.displayIncomingCall({
        sessionId,
        callerName,
        callType: type,
        meetingId,
        token
      })

      if (success) {
        logCall('NotificationService', 'NotifeeCallHandler notification displayed successfully')
        return
      }
    } catch (error) {
      logWarn('NotificationService', 'NotifeeCallHandler failed, falling back to legacy notification', error)
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
        // Enhanced notification content
        const callTypeIcon = type === 'voice' ? '📞' : '📹';
        const callTypeText = type === 'voice' ? 'Voice Call' : 'Video Call';
        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const enhancedTitle = isConcurrentCall
          ? `${callTypeIcon} New ${callTypeText} (while in call)`
          : `${callTypeIcon} Incoming ${callTypeText}`;

        const enhancedBody = isConcurrentCall
          ? `${callerName}\nAccept to end current call • ${currentTime}`
          : `${callerName}\n${currentTime}`;

        await notifee.displayNotification({
          id: sessionId,
          title: enhancedTitle,
          body: enhancedBody,
          android: {
            channelId: this.incomingChannel,
            category: 'call' as any,
            fullScreenAction: { id: 'default' },
            actions: isConcurrentCall ? [
              { title: '✅ Accept & End Current', pressAction: { id: 'answer' } },
              { title: '❌ Decline', pressAction: { id: 'decline' } },
            ] : [
              { title: '✅ Answer', pressAction: { id: 'answer' } },
              { title: '❌ Decline', pressAction: { id: 'decline' } },
            ],
            importance: AndroidImportance.HIGH,
            pressAction: { id: 'default' },
            sound: 'default',
            vibrationPattern: isConcurrentCall ? [200, 300, 200, 300, 200, 300] : [300, 1000, 300, 1000],
            // Enhanced styling
            color: type === 'voice' ? '#4CAF50' : '#2196F3',
            // Only add largeIcon if callerAvatar is a valid string URL or use default logo
            largeIcon: (callerAvatar && typeof callerAvatar === 'string' && callerAvatar.trim() !== '')
              ? callerAvatar
              : defaultLogo,
            style: {
              type: 1, // BigTextStyle
              text: enhancedBody,
            },
            // Add caller info to notification
            person: {
              name: callerName,
              id: callerId || sessionId,
              // Only add icon if callerAvatar is a valid string URL
              icon: (callerAvatar && typeof callerAvatar === 'string' && callerAvatar.trim() !== '')
                ? callerAvatar
                : undefined,
            },
          },
          ios: {
            categoryId: 'call',
            sound: 'default',
            critical: true,
            criticalVolume: 1.0,
          },
          data: {
            sessionId,
            callerName,
            callerId: callerId || '',
            type,
            meetingId: meetingId || '',
            token: token || '',
            isConcurrentCall: isConcurrentCall.toString(),
            timestamp: Date.now().toString(),
            // Deep link data for proper navigation
            deepLink: this.createCallDeepLink({
              sessionId,
              meetingId: meetingId || '',
              token: token || '',
              callerName,
              callerId: callerId || '',
              callType: type
            }),
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
    const callTypeIcon = type === 'voice' ? '📞' : '📹';
    const callTypeText = type === 'voice' ? 'Voice Call' : 'Video Call';
    const startTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    await notifee.displayNotification({
      id: sessionId,
      title: `${callTypeIcon} ${callTypeText} in progress`,
      body: `Connected with ${peerName} • Started ${startTime}`,
      android: {
        channelId: this.ongoingChannel,
        ongoing: true,
        actions: [{ title: '📞 End Call', pressAction: { id: 'end' } }],
        color: type === 'voice' ? '#4CAF50' : '#2196F3',
        style: {
          type: 1, // BigTextStyle
          text: `Connected with ${peerName}\nStarted at ${startTime}\nTap to return to call`,
        },
      },
      ios: {
        categoryId: 'ongoing-call',
      },
      data: {
        sessionId,
        peerName,
        type,
        startTime,
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