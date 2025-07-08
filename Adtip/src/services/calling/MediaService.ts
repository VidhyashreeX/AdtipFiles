import { MeetingProvider, useMeeting } from '@videosdk.live/react-native-sdk'
import VideoSDKService from '../videosdk/VideoSDKService'
import { CallType } from '../../stores/callStoreSimplified'

class MediaService {
  private static _instance: MediaService
  private videoSDK = VideoSDKService.getInstance()
  private meeting: any | null = null

  static getInstance() {
    if (!MediaService._instance) MediaService._instance = new MediaService()
    return MediaService._instance
  }

  async initialize() {
    await this.videoSDK.initialize()
  }

  async joinMeeting(meetingId: string, token: string, name: string, type: CallType) {
    await this.initialize()
    // MeetingProvider is handled at UI level; but we keep token/meetingId for toggle API
    // Nothing else to do here.
  }

  async leaveMeeting() {
    if (this.meeting?.leave) {
      try { await this.meeting.leave() } catch {}
    }
  }

  toggleMic() {
    if (this.meeting?.toggleMic) this.meeting.toggleMic()
  }
  toggleCamera() {
    if (this.meeting?.toggleWebcam) this.meeting.toggleWebcam()
  }
  async toggleSpeaker() {
    // TODO use CallMediaManager or native audio api
  }

  setMeetingRef(m: any) {
    this.meeting = m
  }
}

export default MediaService 