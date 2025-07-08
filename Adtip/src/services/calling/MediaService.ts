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
      // Reset VideoSDK service to ensure clean state for new meeting
      this.videoSDK.reset()
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
      console.log('[MediaService] Starting comprehensive meeting cleanup');

      // Step 1: Leave the meeting with timeout protection
      if (this.meeting?.leave) {
        console.log('[MediaService] Leaving meeting with timeout protection');
        try {
          await Promise.race([
            this.meeting.leave(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Leave timeout')), 3000)
            )
          ]);
          console.log('[MediaService] Successfully left meeting');
        } catch (leaveError) {
          console.warn('[MediaService] Leave meeting timeout or error:', leaveError);
          // Continue with cleanup even if leave fails
        }
      }

      // Step 2: Force cleanup of meeting reference
      if (this.meeting) {
        console.log('[MediaService] Force clearing meeting reference');
        try {
          // Attempt to stop all media streams
          if (this.meeting.localParticipant?.webcamStream?.track) {
            this.meeting.localParticipant.webcamStream.track.stop();
          }
          if (this.meeting.localParticipant?.micStream?.track) {
            this.meeting.localParticipant.micStream.track.stop();
          }
        } catch (streamError) {
          console.warn('[MediaService] Error stopping media streams:', streamError);
        }

        this.meeting = null;
      }

      // Step 3: Clear meeting config
      this.currentMeetingConfig = null;

      // Step 4: Reset VideoSDK service to ensure clean state for next meeting
      this.videoSDK.reset();

      // Step 5: Force garbage collection hint
      if (global.gc) {
        global.gc();
      }

      console.log('[MediaService] Comprehensive meeting cleanup completed');

      // Note: Navigation is handled by CallController and App.tsx to prevent conflicts

    } catch (error) {
      console.error('[MediaService] leaveMeeting error:', error);

      // Force cleanup even on error
      this.meeting = null;
      this.currentMeetingConfig = null;
      this.videoSDK.reset();
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