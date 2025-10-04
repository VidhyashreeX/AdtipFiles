# Live Stream Join - Testing & Verification Guide

## Expected Console Output (After Fix)

### When Host Creates a Free Stream

```javascript
// 1. Backend API Response
[NET:ApiService] POST https://api.adtip.in/api/live-stream/create-free (201)

// 2. GoLiveScreen Debug Logs
[GoLiveScreen] ===== RESPONSE DEBUG =====
[GoLiveScreen] response.success: true
[GoLiveScreen] response.message: "Free live stream created successfully"
[GoLiveScreen] response.data: {
  meeting_id: "7de4-o0pz-zhm2",
  token: "eyJhbGciOiJIUzI1NiIs...",
  stream_type: "free",
  title: "My Stream",
  cost_per_minute: 0
}
[GoLiveScreen] typeof response.data: object

[GoLiveScreen] streamData: {
  meeting_id: "7de4-o0pz-zhm2",
  token: "eyJhbGciOiJIUzI1NiIs...",
  ...
}
[GoLiveScreen] streamData.meeting_id: "7de4-o0pz-zhm2"  ✅
[GoLiveScreen] streamData.token: "eyJhbGciOiJIUzI1NiIs..."  ✅
[GoLiveScreen] ========================

// 3. LiveStreamingScreen Initialization
[LiveStreamingScreen] Initializing with params: {
  meetingId: "7de4-o0pz-zhm2",  ✅ NOT undefined!
  token: "eyJhbGciOiJIUzI1NiIs...",
  isHost: true,
  streamTitle: "My Stream",
  streamType: "free"
}

// 4. Meeting Join Success
[INFO:LiveStreaming] Successfully joined live stream meeting as host {
  meetingId: "7de4-o0pz-zhm2",  ✅ CORRECT!
  localParticipantId: "ejsxkoeh"
}
```

### When Viewer Joins a Stream

```javascript
// 1. Viewer clicks on stream
[LiveStreamScreen] Joining live stream: "7de4-o0pz-zhm2"

// 2. API Call Response
[LiveStreamScreen] Join response: {
  success: true,
  message: "Joined stream successfully",
  hasData: true,
  dataKeys: ["token", "stream_info"]
}

[LiveStreamScreen] streamData: {
  token: "eyJhbGciOiJIUzI1NiIs...",
  stream_info: {
    id: 123,
    meeting_id: "7de4-o0pz-zhm2",
    title: "My Stream",
    ...
  }
}
[LiveStreamScreen] Token: "eyJhbGciOiJIUzI1NiIs..."  ✅

[LiveStreamScreen] Successfully joined stream, navigating to LiveStreaming

// 3. LiveStreamingScreen Initialization
[LiveStreamingScreen] Initializing with params: {
  meetingId: "7de4-o0pz-zhm2",  ✅
  token: "eyJhbGciOiJIUzI1NiIs...",  ✅
  isHost: false,
  streamTitle: "My Stream",
  streamType: "free"
}

// 4. Meeting Join Success
[INFO:LiveStreaming] Successfully joined live stream meeting as viewer {
  meetingId: "7de4-o0pz-zhm2",  ✅
  localParticipantId: "abc123"
}
```

## What to Look For

### ✅ SUCCESS Indicators
1. **meetingId is NOT undefined** in LiveStreamingScreen initialization
2. **Token is present** and looks like a JWT (starts with "eyJ")
3. **Meeting joins successfully** for both host and viewers
4. **Video/audio streams** work correctly
5. **No navigation errors** or "Invalid stream parameters" screens

### ❌ FAILURE Indicators
1. **meetingId: undefined** in any log
2. **token: undefined** or missing
3. **"Invalid stream parameters"** error screen
4. **Meeting fails to join** with errors
5. **Console errors** about missing required fields

## Testing Checklist

### Host Flow
- [ ] Open app and go to Live Streaming tab
- [ ] Click "+" button to start new stream
- [ ] Select "Free Stream" type
- [ ] Enter stream title and click "Start Stream"
- [ ] Check console logs match expected output above
- [ ] Verify meetingId is NOT undefined in logs
- [ ] Verify you see your own video feed
- [ ] Verify mic and camera controls work

### Viewer Flow
- [ ] Open app (on different device/account)
- [ ] Go to Live Streaming tab
- [ ] See active stream in the list
- [ ] Click on the stream to join
- [ ] Check console logs match expected output above
- [ ] Verify meetingId and token are NOT undefined
- [ ] Verify you see host's video feed
- [ ] Verify viewer count updates
- [ ] Verify "Leave" button works

### Influencer Stream
- [ ] Create influencer stream (₹1/min)
- [ ] Verify meetingId is NOT undefined
- [ ] Verify stream starts correctly

### Promotional Stream
- [ ] Create promotional stream
- [ ] Complete Razorpay payment
- [ ] Check payment confirmation logs
- [ ] Verify meetingId and token after payment
- [ ] Verify stream starts after payment

## Common Issues & Solutions

### Issue: meetingId still undefined
**Check:**
1. Is `response.data` an object?
2. Does `response.data.meeting_id` exist?
3. Are you accessing `response.data` directly (not `response.data.data`)?

**Solution:**
```typescript
console.log('Full response:', JSON.stringify(response, null, 2));
console.log('response.data:', response.data);
console.log('typeof response.data:', typeof response.data);
```

### Issue: Token is undefined
**Check:**
1. Is backend returning token in response?
2. Are you accessing `response.data.token` or `serviceResponse.data.token`?
3. Is the token a string?

**Solution:**
```typescript
if (!streamData?.token) {
  console.error('Token missing from response:', streamData);
  Alert.alert('Error', 'Server did not provide access token');
  return;
}
```

### Issue: Navigation fails
**Check:**
1. Are all required params provided? (meetingId, token, isHost, streamTitle, streamType)
2. Are params the correct type? (strings, booleans)
3. Is navigation object available?

**Solution:**
```typescript
const navParams = {
  meetingId: streamData.meeting_id,
  token: streamData.token,
  isHost: true,
  streamTitle: payload.title || 'Live Stream',
  streamType: selectedStreamType || 'free'
};

console.log('Navigation params:', navParams);

// Validate all required params
if (!navParams.meetingId || !navParams.token) {
  console.error('Cannot navigate - missing required params');
  return;
}

navigation.navigate('LiveStreaming', navParams);
```

## Backend Response Reference

### Free/Influencer Stream Creation
```javascript
POST /api/live-stream/create-free
POST /api/live-stream/create-influencer

Response (201):
{
  "success": true,
  "message": "Free live stream created successfully",
  "data": {
    "meeting_id": "7de4-o0pz-zhm2",
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "title": "My Stream",
    "stream_type": "free",
    "cost_per_minute": 0
  }
}
```

### Promotional Stream Creation
```javascript
POST /api/live-stream/create-promotional

Response (201):
{
  "success": true,
  "message": "Promotional stream created, payment required",
  "data": {
    "meeting_id": "7de4-o0pz-zhm2",
    "stream_type": "promotional",
    "total_amount": 6000,
    "razorpay_order_id": "order_...",
    "razorpay_key_id": "rzp_...",
    "payment_details": {...}
  }
}
```

### Join Stream (Viewer)
```javascript
POST /api/live-stream/join

Response (200):
{
  "success": true,
  "message": "Joined stream successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "stream_info": {
      "id": 123,
      "meeting_id": "7de4-o0pz-zhm2",
      "title": "My Stream",
      "streamer_name": "John Doe",
      "viewer_count": 5,
      "cost_per_minute": 0
    }
  }
}
```

## Debug Commands

### Check Response Structure
```javascript
// In GoLiveScreen.tsx
console.log('Response keys:', Object.keys(response));
console.log('Response.data keys:', Object.keys(response.data));
console.log('Response.data type:', typeof response.data);
console.log('Has meeting_id?', 'meeting_id' in response.data);
```

### Check Navigation Params
```javascript
// In LiveStreamingScreen.tsx
console.log('Route params:', route.params);
console.log('MeetingId type:', typeof meetingId);
console.log('Token length:', token?.length);
```

### Check Meeting Object
```javascript
// In LiveStreamContainer
console.log('Meeting object:', meeting);
console.log('Meeting.id:', meeting?.id);
console.log('Local participant:', meeting?.localParticipant);
```

## Success Criteria

✅ **All tests pass** when:
1. Host can create and join all stream types (free, influencer, promotional)
2. Viewers can successfully join active streams
3. No `undefined` values for meetingId or token in any logs
4. Video/audio streams work for both host and viewers
5. Controls (mic, camera, end stream, leave) function correctly
6. No error screens or crashes during stream lifecycle

---

**Last Updated:** October 4, 2025  
**Status:** ✅ FIXED - meetingId now correctly extracted from response.data
