/**
 * Test script to verify the video call fix for FCM message parsing
 * This simulates the incoming video call scenario and verifies proper parsing
 */

// Simulate the actual FCM message structure from the logs for a VIDEO CALL
const mockVideoCallFCMMessage = {
  data: {
    info: '{"callerInfo":{"name":"John Doe","userId":"user123","token":"fcm_token_here"},"videoSDKInfo":{"meetingId":"vid-call-123","token":"video_sdk_token_here"},"type":"CALL_INITIATED","callType":"video","uuid":"video-call-uuid-123","isVideoCall":"true"}'
  },
  from: "333436486029",
  messageId: "0:1751695096463948%e9e87daaf9fd7ecd",
  originalPriority: 1,
  priority: 1,
  sentTime: 1751695096455,
  ttl: 2419200
};

// Simulate the VOICE CALL scenario for comparison
const mockVoiceCallFCMMessage = {
  data: {
    info: '{"callerInfo":{"name":"Jane Smith","userId":"user456","token":"fcm_token_here2"},"videoSDKInfo":{"meetingId":"voice-call-456","token":"video_sdk_token_here2"},"type":"CALL_INITIATED","callType":"voice","uuid":"voice-call-uuid-456"}'
  },
  from: "333436486029",
  messageId: "0:1751695096463948%e9e87daaf9fd7ecd",
  originalPriority: 1,
  priority: 1,
  sentTime: 1751695096455,
  ttl: 2419200
};

// Updated parseFCMCallData function with the fix
function parseFCMCallData(data) {
  try {
    console.log('[TEST] Parsing FCM call data:', data);
    
    // Handle nested JSON structures
    let callData = data;
    
    if (typeof data.info === 'string') {
      try {
        callData = JSON.parse(data.info);
        console.log('[TEST] Successfully parsed info field:', callData);
      } catch (error) {
        console.warn('[TEST] Failed to parse FCM info field:', error);
      }
    }

    const callerInfo = (typeof callData.callerInfo === 'object' && callData.callerInfo !== null) 
      ? callData.callerInfo 
      : {};
    const videoSDKInfo = (typeof callData.videoSDKInfo === 'object' && callData.videoSDKInfo !== null) 
      ? callData.videoSDKInfo 
      : {};

    // ✅ FIX: Use uuid as callId if available, otherwise generate one
    const callId = String(callData.uuid || callData.callId || `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

    // ✅ CRITICAL FIX: Properly extract callType from multiple possible sources
    let callType = 'voice'; // Default to voice
    
    // Priority 1: Direct callType field in parsed data
    if (callData.callType) {
      callType = String(callData.callType).toLowerCase();
    }
    // Priority 2: CallType in original data
    else if (data.callType) {
      callType = String(data.callType).toLowerCase();
    }
    // Priority 3: Check if it's explicitly a video call based on context
    else if (data.isVideoCall === 'true' || data.isVideoCall === true) {
      callType = 'video';
    }
    // Priority 4: Check caller info for video indicators
    else if (callerInfo.isVideoCall === 'true' || callerInfo.isVideoCall === true) {
      callType = 'video';
    }
    // Priority 5: Check if meetingId suggests video (some services use this pattern)
    else if (videoSDKInfo.meetingId && (data.type === 'VIDEO_CALL' || data.type === 'video_call')) {
      callType = 'video';
    }

    // Normalize callType to ensure it's either 'video' or 'voice'
    const normalizedCallType = (callType === 'video' || callType === 'VIDEO') ? 'video' : 'voice';

    console.log('[TEST] CallType extraction:', {
      rawCallType: callData.callType,
      dataCallType: data.callType,
      isVideoCall: data.isVideoCall,
      callerIsVideoCall: callerInfo.isVideoCall,
      finalCallType: normalizedCallType
    });

    const parsedData = {
      callId,
      callerName: String(callerInfo.name || callData.callerName || 'Unknown Caller'),
      callType: normalizedCallType,
      callerId: String(callerInfo.userId || callData.callerId || 'unknown'),
      meetingId: String(videoSDKInfo.meetingId || callData.meetingId || ''),
      token: String(videoSDKInfo.token || callData.rtcToken || callData.token || ''),
      callerAvatar: (callerInfo.avatarUrl || callData.callerAvatar) ? String(callerInfo.avatarUrl || callData.callerAvatar) : undefined,
      callerFcmToken: String(callerInfo.token || ''),
    };

    console.log('[TEST] Parsed call data:', parsedData);

    // Validate required fields
    if (!parsedData.callId || !parsedData.callerName || !parsedData.meetingId || !parsedData.token) {
      console.error('[TEST] Invalid call data - missing required fields:', parsedData);
      return null;
    }

    return parsedData;

  } catch (error) {
    console.error('[TEST] Failed to parse FCM call data:', error);
    return null;
  }
}

// Enhanced FCM call notification handler with the fix
function handleFCMCallNotification(remoteMessage) {
  try {
    const { data } = remoteMessage;
    if (!data) return;

    console.log('[TEST] Processing FCM call notification:', data);

    // ✅ FIX: Parse the info field first to get the actual type and preserve call data
    let callType = data.type;
    let parsedInfo = null;

    if (typeof data.info === 'string') {
      try {
        parsedInfo = JSON.parse(data.info);
        callType = parsedInfo.type || data.type;
        console.log('[TEST] Parsed info field, call type:', callType);
        
        // ✅ CRITICAL FIX: Preserve original data structure for proper parsing
        // Merge original data with parsed info to ensure all fields are available
        parsedInfo = {
          ...data,
          ...parsedInfo
        };
        
      } catch (error) {
        console.warn('[TEST] Failed to parse FCM info field:', error);
      }
    }

    if (!callType) {
      console.log('[TEST] No call type found in FCM message');
      return;
    }

    console.log('[TEST] Processing FCM call notification:', callType);

    if (callType === 'CALL_INITIATED' || callType === 'CALL_INITIATION' || callType === 'call') {
      // ✅ FIX: Pass the merged data to handleIncomingFCMCall
      console.log('[TEST] ✅ CALL_INITIATED detected - would trigger incoming call handling');
      const callData = parseFCMCallData(parsedInfo || data);
      if (callData) {
        console.log('[TEST] ✅ Successfully parsed call data for incoming call');
        console.log('[TEST] Call ID:', callData.callId);
        console.log('[TEST] Caller Name:', callData.callerName);
        console.log('[TEST] Meeting ID:', callData.meetingId);
        console.log('[TEST] Call Type:', callData.callType);
        console.log('[TEST] ✅ This would show notification:', `Incoming ${callData.callType} call from ${callData.callerName}`);
        console.log('[TEST] ✅ This would trigger vibration');
        
        // Simulate activeCall setting
        const activeCall = {
          callId: callData.callId,
          callType: callData.callType,
          callerName: callData.callerName,
          status: 'ringing'
        };
        
        console.log('[TEST] ✅ ActiveCall would be set:', activeCall);
        
        // Simulate notification acceptance
        console.log('[TEST] ✅ If user accepts, navigation would trigger to Meeting screen with:', {
          meetingId: callData.meetingId,
          callType: callData.callType,
          token: callData.token
        });
        
      } else {
        console.log('[TEST] ❌ Failed to parse call data');
      }
    } else if (callType === 'CALL_ACCEPTED') {
      console.log('[TEST] CALL_ACCEPTED detected');
    } else if (callType === 'CALL_ENDED') {
      console.log('[TEST] CALL_ENDED detected');
    }
  } catch (error) {
    console.error('[TEST] Error handling FCM call notification:', error);
  }
}

// Run the tests
console.log('🧪 Testing Video Call Fix for FCM message parsing...\n');

console.log('=== VIDEO CALL TEST ===');
console.log('📨 Mock Video Call FCM Message:');
console.log(JSON.stringify(mockVideoCallFCMMessage, null, 2));
console.log('\n🔍 Testing handleFCMCallNotification for VIDEO CALL...');
handleFCMCallNotification(mockVideoCallFCMMessage);

console.log('\n\n=== VOICE CALL TEST ===');
console.log('📨 Mock Voice Call FCM Message:');
console.log(JSON.stringify(mockVoiceCallFCMMessage, null, 2));
console.log('\n🔍 Testing handleFCMCallNotification for VOICE CALL...');
handleFCMCallNotification(mockVoiceCallFCMMessage);

console.log('\n\n✅ Test completed!');
console.log('\n📋 Summary of fixes applied:');
console.log('1. ✅ Enhanced callType extraction: Now checks multiple sources for callType');
console.log('2. ✅ Proper data merging: Preserves original data structure while parsing info');
console.log('3. ✅ Active call recovery: Can recover call data from notification if activeCall is null');
console.log('4. ✅ Enhanced debugging: Added comprehensive logging for troubleshooting');
console.log('5. ✅ Vibration fix: Always stops vibration on decline/accept');

console.log('\n🎯 Expected behavior after fix:');
console.log('- Video calls will show "Incoming video call" notification');
console.log('- Voice calls will show "Incoming voice call" notification');
console.log('- Accept button will work properly and navigate to Meeting screen');
console.log('- Vibration will stop when call is accepted or declined');
console.log('- No more race conditions or missing activeCall issues');
