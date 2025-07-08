import { MeetingProvider, useMeeting } from '@videosdk.live/react-native-sdk'
import VideoSDKService from '../videosdk/VideoSDKService'
import { CallType } from '../../stores/callStoreSimplified'
import * as NavigationService from '../../navigation/NavigationService'

class MediaService {
  private static _instance: MediaService
  private videoSDK = VideoSDKService.getInstance()
  private meeting: any | null = null
  private currentMeetingConfig: {
    meetingId: string
    token: string
    name: string
    type: CallType
  } | null = null

  static getInstance() {
    if (!MediaService._instance) MediaService._instance = new MediaService()
    return MediaService._instance
  }

  async initialize() {
    await this.videoSDK.initialize()
  }

  async joinMeeting(meetingId: string, token: string, name: string, type: CallType) {
    try {
      await this.initialize()

      // Store meeting config for later use
      this.currentMeetingConfig = { meetingId, token, name, type }

      console.log('[MediaService] Joining meeting:', { meetingId, name, type })

      // Navigate to meeting screen which will handle the actual VideoSDK join
      NavigationService.navigateToMeeting({
        meetingId,
        token,
        callType: type,
        displayName: name,
        recipientName: name, // Will be updated by caller
        isInitiator: false // Will be updated by caller
      })

      return true
    } catch (error) {
      console.error('[MediaService] joinMeeting error:', error)
      return false
    }
  }

  async leaveMeeting() {
    try {
      if (this.meeting?.leave) {
        console.log('[MediaService] Leaving meeting')
        await this.meeting.leave()
      }

      // Clear meeting config
      this.currentMeetingConfig = null
      this.meeting = null

      // Navigate back from meeting screen
      NavigationService.goBack()

    } catch (error) {
      console.error('[MediaService] leaveMeeting error:', error)
    }
  }

  toggleMic() {
    if (this.meeting?.toggleMic) {
      console.log('[MediaService] Toggling microphone')
      this.meeting.toggleMic()
    }
  }

  toggleCamera() {
    if (this.meeting?.toggleWebcam) {
      console.log('[MediaService] Toggling camera')
      this.meeting.toggleWebcam()
    }
  }

  async toggleSpeaker() {
    try {
      if (this.meeting?.changeAudioDevice) {
        console.log('[MediaService] Toggling speaker')
        // VideoSDK method to change audio device
        await this.meeting.changeAudioDevice()
      } else {
        console.warn('[MediaService] Speaker toggle not available - meeting not initialized')
      }
    } catch (error) {
      console.error('[MediaService] toggleSpeaker error:', error)
    }
  }

  setMeetingRef(m: any) {
    this.meeting = m
    console.log('[MediaService] Meeting reference set:', !!m)
  }

  getMeetingConfig() {
    return this.currentMeetingConfig
  }

  isMeetingActive() {
    return !!this.meeting && !!this.currentMeetingConfig
  }
}

export default MediaService 