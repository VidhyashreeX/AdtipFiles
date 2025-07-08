import notifee, { AndroidImportance } from '@notifee/react-native'
import CallKeepIntegrationService from './CallKeepIntegrationService'
import { CallType } from '../../stores/callStoreSimplified'

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
  }

  private async createChannels() {
    await notifee.createChannel({ id: this.incomingChannel, name: 'Incoming Calls', importance: AndroidImportance.HIGH, sound: 'default', vibration: true })
    await notifee.createChannel({ id: this.ongoingChannel, name: 'Ongoing Calls', importance: AndroidImportance.DEFAULT })
  }

  async showIncomingCall(sessionId: string, callerName: string, type: CallType) {
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
      },
      data: { sessionId },
    })
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
    try { await notifee.cancelNotification(id) } catch {}
  }
}

export default NotificationService 