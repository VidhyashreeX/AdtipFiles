// src/services/AgoraHelper.ts
import { IRtcEngine } from 'react-native-agora';

/**
 * Helper class for managing Agora RTC Engine calls safely
 */
export class AgoraHelper {
  /**
   * Safely join a channel using the Agora RTC Engine
   * @param engine The Agora RTC engine instance
   * @param token The token received from the server
   * @param channelName The name of the channel to join
   * @param uid The user ID for the local user
   */
  static async safeJoinChannel(
    engine: IRtcEngine,
    token: string,
    channelName: string,
    uid: number
  ): Promise<void> {
    try {
      // In the new Agora SDK, joinChannel takes these parameters
      // Check if the engine has newer joinChannel method with options
      if ('joinChannelWithUserAccount' in engine) {
        return await engine.joinChannelWithUserAccount(token, channelName, uid.toString());
      } else if ('joinChannel' in engine) {
        // Handle different possible signatures of joinChannel
        try {
          // Try the most common signature
          return await (engine.joinChannel as Function)(token, channelName, '', uid);
        } catch (e) {
          console.log('First joinChannel attempt failed, trying alternative signature', e);
          // Try alternative signature (some versions have different parameter orders)
          return await (engine.joinChannel as Function)(token, channelName, null, uid);
        }
      } else {
        throw new Error('No compatible join channel method found in RTC Engine');
      }
    } catch (error) {
      console.error('Error joining Agora channel:', error);
      throw error;
    }
  }

  /**
   * Safely leave the current channel
   * @param engine The Agora RTC engine instance
   */
  static async safeLeaveChannel(engine: IRtcEngine): Promise<void> {
    try {
      if (engine) {
        await engine.leaveChannel();
      }
    } catch (error) {
      console.error('Error leaving Agora channel:', error);
      throw error;
    }
  }

  /**
   * Setup local video view
   * @param engine The Agora RTC engine instance
   * @param view The view reference for displaying the local video
   */
  static setupLocalVideo(
    engine: IRtcEngine,
    view: any
  ): void {
    try {
      if (engine && view) {
        engine.setupLocalVideo({
          view,
          renderMode: 1, // Use numeric value instead of enum
          mirrorMode: 1, // Use numeric value instead of enum
        });
      }
    } catch (error) {
      console.error('Error setting up local video:', error);
    }
  }

  /**
   * Setup remote video view
   * @param engine The Agora RTC engine instance
   * @param view The view reference for displaying the remote video
   * @param uid The user ID of the remote user
   */
  static setupRemoteVideo(
    engine: IRtcEngine,
    view: any,
    uid: number
  ): void {
    try {
      if (engine && view) {
        engine.setupRemoteVideo({
          view,
          uid,
          renderMode: 1, // Use numeric value instead of enum
          mirrorMode: 1, // Use numeric value instead of enum
        });
      }
    } catch (error) {
      console.error('Error setting up remote video:', error);
    }
  }
}
