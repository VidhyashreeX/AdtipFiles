import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'

/**
 * Mock FCM messages for testing VideoSDK CallKeep integration
 */

export class FCMMessageMocks {
  /**
   * Create a mock incoming call FCM message
   */
  static createIncomingCallMessage(options: {
    sessionId?: string
    meetingId?: string
    token?: string
    callerName?: string
    callerId?: string
    callType?: 'video' | 'audio'
    format?: 'new' | 'legacy'
  } = {}): FirebaseMessagingTypes.RemoteMessage {
    const {
      sessionId = 'mock-session-123',
      meetingId = 'mock-meeting-456',
      token = 'mock-videosdk-token-789',
      callerName = 'Mock Caller',
      callerId = 'mock-caller-123',
      callType = 'video',
      format = 'new'
    } = options

    if (format === 'new') {
      return {
        messageId: `mock-call-${Date.now()}`,
        data: {
          info: JSON.stringify({
            type: 'CALL_INITIATED',
            uuid: sessionId,
            videoSDKInfo: {
              meetingId,
              token,
              callType
            },
            callerInfo: {
              name: callerName,
              id: callerId
            }
          })
        }
      }
    } else {
      return {
        messageId: `mock-call-${Date.now()}`,
        data: {
          type: 'CALL_INITIATED',
          sessionId,
          meetingId,
          token,
          callerName,
          callerId,
          callType,
          uuid: sessionId
        }
      }
    }
  }

  /**
   * Create a mock call accepted FCM message
   */
  static createCallAcceptedMessage(options: {
    sessionId?: string
    meetingId?: string
    token?: string
  } = {}): FirebaseMessagingTypes.RemoteMessage {
    const {
      sessionId = 'mock-session-123',
      meetingId = 'mock-meeting-456',
      token = 'mock-videosdk-token-789'
    } = options

    return {
      messageId: `mock-accept-${Date.now()}`,
      data: {
        type: 'CALL_ACCEPTED',
        sessionId,
        meetingId,
        token
      }
    }
  }

  /**
   * Create a mock call ended FCM message
   */
  static createCallEndedMessage(options: {
    sessionId?: string
    reason?: string
  } = {}): FirebaseMessagingTypes.RemoteMessage {
    const {
      sessionId = 'mock-session-123',
      reason = 'ended'
    } = options

    return {
      messageId: `mock-end-${Date.now()}`,
      data: {
        type: 'CALL_ENDED',
        sessionId,
        reason
      }
    }
  }

  /**
   * Create a mock call rejected FCM message
   */
  static createCallRejectedMessage(options: {
    sessionId?: string
  } = {}): FirebaseMessagingTypes.RemoteMessage {
    const {
      sessionId = 'mock-session-123'
    } = options

    return {
      messageId: `mock-reject-${Date.now()}`,
      data: {
        type: 'CALL_REJECTED',
        sessionId
      }
    }
  }

  /**
   * Create a mock chat FCM message
   */
  static createChatMessage(options: {
    conversationId?: string
    senderId?: string
    senderName?: string
    message?: string
  } = {}): FirebaseMessagingTypes.RemoteMessage {
    const {
      conversationId = 'mock-conversation-123',
      senderId = 'mock-sender-456',
      senderName = 'Mock Sender',
      message = 'Hello, this is a test message!'
    } = options

    return {
      messageId: `mock-chat-${Date.now()}`,
      data: {
        type: 'chat_message',
        conversationId,
        senderId,
        senderName,
        message
      },
      notification: {
        title: senderName,
        body: message
      }
    }
  }

  /**
   * Create a mock general notification FCM message
   */
  static createGeneralNotification(options: {
    title?: string
    body?: string
    type?: string
    data?: Record<string, any>
  } = {}): FirebaseMessagingTypes.RemoteMessage {
    const {
      title = 'Mock Notification',
      body = 'This is a mock notification',
      type = 'general',
      data = {}
    } = options

    return {
      messageId: `mock-notification-${Date.now()}`,
      data: {
        type,
        ...data
      },
      notification: {
        title,
        body
      }
    }
  }

  /**
   * Create a malformed FCM message for error testing
   */
  static createMalformedMessage(type: 'invalid_json' | 'missing_fields' | 'null_data' = 'invalid_json'): FirebaseMessagingTypes.RemoteMessage {
    switch (type) {
      case 'invalid_json':
        return {
          messageId: 'mock-malformed-json',
          data: {
            info: 'invalid-json-string'
          }
        }

      case 'missing_fields':
        return {
          messageId: 'mock-malformed-missing',
          data: {
            type: 'CALL_INITIATED'
            // Missing required fields like sessionId, meetingId, etc.
          }
        }

      case 'null_data':
        return {
          messageId: 'mock-malformed-null',
          data: null as any
        }

      default:
        return {
          messageId: 'mock-malformed-default',
          data: {}
        }
    }
  }

  /**
   * Create a batch of FCM messages for load testing
   */
  static createMessageBatch(count: number, type: 'call' | 'chat' | 'mixed' = 'mixed'): FirebaseMessagingTypes.RemoteMessage[] {
    const messages: FirebaseMessagingTypes.RemoteMessage[] = []

    for (let i = 0; i < count; i++) {
      let message: FirebaseMessagingTypes.RemoteMessage

      if (type === 'call') {
        message = this.createIncomingCallMessage({
          sessionId: `batch-session-${i}`,
          callerName: `Batch Caller ${i}`
        })
      } else if (type === 'chat') {
        message = this.createChatMessage({
          conversationId: `batch-conversation-${i}`,
          senderName: `Batch Sender ${i}`,
          message: `Batch message ${i}`
        })
      } else {
        // Mixed type
        if (i % 3 === 0) {
          message = this.createIncomingCallMessage({
            sessionId: `mixed-session-${i}`,
            callerName: `Mixed Caller ${i}`
          })
        } else if (i % 3 === 1) {
          message = this.createChatMessage({
            conversationId: `mixed-conversation-${i}`,
            senderName: `Mixed Sender ${i}`,
            message: `Mixed message ${i}`
          })
        } else {
          message = this.createGeneralNotification({
            title: `Mixed Notification ${i}`,
            body: `Mixed notification body ${i}`
          })
        }
      }

      messages.push(message)
    }

    return messages
  }

  /**
   * Create a realistic call flow sequence
   */
  static createCallFlowSequence(sessionId: string = 'flow-session-123'): FirebaseMessagingTypes.RemoteMessage[] {
    return [
      // 1. Incoming call
      this.createIncomingCallMessage({
        sessionId,
        callerName: 'Flow Test Caller',
        callType: 'video'
      }),

      // 2. Call accepted (after some delay in real scenario)
      this.createCallAcceptedMessage({
        sessionId
      }),

      // 3. Call ended
      this.createCallEndedMessage({
        sessionId,
        reason: 'completed'
      })
    ]
  }

  /**
   * Create messages with various edge cases
   */
  static createEdgeCaseMessages(): FirebaseMessagingTypes.RemoteMessage[] {
    return [
      // Very long caller name
      this.createIncomingCallMessage({
        callerName: 'A'.repeat(100),
        sessionId: 'edge-long-name'
      }),

      // Special characters in name
      this.createIncomingCallMessage({
        callerName: 'Test Caller 🎥📞 & Co.',
        sessionId: 'edge-special-chars'
      }),

      // Very long token
      this.createIncomingCallMessage({
        token: 'x'.repeat(1000),
        sessionId: 'edge-long-token'
      }),

      // Empty optional fields
      this.createIncomingCallMessage({
        callerName: '',
        callerId: '',
        sessionId: 'edge-empty-fields'
      }),

      // Unicode characters
      this.createIncomingCallMessage({
        callerName: '测试用户 👨‍💻',
        sessionId: 'edge-unicode'
      })
    ]
  }

  /**
   * Create performance test messages
   */
  static createPerformanceTestMessages(count: number): FirebaseMessagingTypes.RemoteMessage[] {
    const messages: FirebaseMessagingTypes.RemoteMessage[] = []

    for (let i = 0; i < count; i++) {
      // Alternate between different message types for realistic testing
      const messageType = i % 4

      switch (messageType) {
        case 0:
          messages.push(this.createIncomingCallMessage({
            sessionId: `perf-call-${i}`,
            callerName: `Performance Caller ${i}`
          }))
          break

        case 1:
          messages.push(this.createCallAcceptedMessage({
            sessionId: `perf-accept-${i}`
          }))
          break

        case 2:
          messages.push(this.createCallEndedMessage({
            sessionId: `perf-end-${i}`
          }))
          break

        case 3:
          messages.push(this.createChatMessage({
            senderName: `Performance Sender ${i}`,
            message: `Performance test message ${i}`
          }))
          break
      }
    }

    return messages
  }
}

/**
 * Mock VideoSDK responses for testing
 */
export class VideoSDKMocks {
  static createMockMeetingResponse(meetingId: string = 'mock-meeting-123') {
    return {
      meetingId,
      token: 'mock-videosdk-token',
      participants: [],
      localParticipant: {
        id: 'local-participant',
        displayName: 'Local User'
      }
    }
  }

  static createMockParticipant(id: string = 'mock-participant') {
    return {
      id,
      displayName: `Participant ${id}`,
      isLocal: false,
      streams: {
        video: null,
        audio: null
      }
    }
  }
}

/**
 * Mock CallKeep responses for testing
 */
export class CallKeepMocks {
  static createMockCallKeepEvent(type: 'answerCall' | 'endCall', callUUID: string = 'mock-uuid') {
    return {
      type,
      callUUID,
      timestamp: Date.now()
    }
  }

  static createMockCallKeepConfig() {
    return {
      ios: {
        appName: 'Adtip Test',
        supportsVideo: true,
        maximumCallGroups: 1,
        maximumCallsPerCallGroup: 1
      },
      android: {
        alertTitle: 'Test Permissions',
        alertDescription: 'Test app needs permissions',
        cancelButton: 'Cancel',
        okButton: 'OK'
      }
    }
  }
}
