# Live Streaming API Integration Reference

## Backend API Endpoints

### Base URL
```
Production: https://api.adtip.app
Development: http://localhost:7082
```

### Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

---

## Live Stream APIs

### 1. Start Live Stream
**Endpoint**: `POST /api/live-stream/start`

**Description**: Starts a new live stream with VideoSDK integration

**Request Body**:
```json
{
  "user_id": 123,
  "meeting_id": "",  // Empty string - backend auto-generates
  "title": "My Live Stream",
  "cost_per_minute": 10,  // For influencer streams
  "viewer_reward_per_minute": 1,  // For promotional streams
  "is_private": false
}
```

**Success Response** (201):
```json
{
  "success": true,
  "message": "Live stream started successfully",
  "data": {
    "meeting_id": "nzbh-ck6b-g1rw",  // VideoSDK meeting ID
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // VideoSDK token
    "title": "My Live Stream",
    "cost_per_minute": 10,
    "viewer_reward_per_minute": 0,
    "is_private": false,
    "streaming_config": {
      "hls_enabled": true,
      "rtmp_enabled": false,
      "max_participants": 100,
      "auto_record": false,
      "region": "us001"
    },
    "optimizations": {
      "adaptive_bitrate": true,
      "noise_suppression": true,
      "echo_cancellation": true,
      "auto_gain_control": true
    }
  }
}
```

**Error Responses**:
- 400: Missing required fields or insufficient balance
- 404: User not found
- 500: Failed to create VideoSDK meeting

---

### 2. End Live Stream
**Endpoint**: `POST /api/live-stream/end`

**Description**: Ends an active live stream

**Request Body**:
```json
{
  "user_id": 123,
  "meeting_id": "nzbh-ck6b-g1rw"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Live stream ended successfully",
  "data": {
    "meeting_id": "nzbh-ck6b-g1rw",
    "duration_minutes": 45,
    "total_viewers": 234,
    "earnings": 1500.00,
    "analytics": {
      "peak_viewers": 312,
      "average_watch_time": 12.5,
      "total_tips": 250.00
    }
  }
}
```

**Error Responses**:
- 400: Missing required fields
- 404: Stream not found or already ended
- 500: Internal server error

---

### 3. Join Live Stream
**Endpoint**: `POST /api/live-stream/join`

**Description**: Join an active stream as a viewer (includes wallet balance check for influencer streams)

**Request Body**:
```json
{
  "user_id": 456,
  "meeting_id": "nzbh-ck6b-g1rw"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Joined stream successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // VideoSDK token for viewer
    "meeting_id": "nzbh-ck6b-g1rw",
    "viewer_reward_per_minute": 0,
    "stream_info": {
      "meeting_id": "nzbh-ck6b-g1rw",
      "viewer_reward_per_minute": 0
    }
  }
}
```

**Error Responses**:
- 400: Insufficient wallet balance (for influencer streams)
```json
{
  "success": false,
  "message": "Insufficient wallet balance. Required: ₹10 for first minute. Your balance: ₹5",
  "data": {
    "required": 10,
    "available": 5,
    "shortfall": 5
  }
}
```
- 404: Stream not found or ended
- 500: Failed to generate viewer token

---

### 4. Leave Live Stream
**Endpoint**: `POST /api/live-stream/leave`

**Description**: Leave a live stream (triggers billing for influencer streams)

**Request Body**:
```json
{
  "user_id": 456,
  "meeting_id": "nzbh-ck6b-g1rw"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Left stream successfully",
  "data": {
    "watch_time_minutes": 15,
    "amount_charged": 150.00,  // For influencer streams
    "earnings": 30.00  // For promotional streams
  }
}
```

---

### 5. Get Active Streams
**Endpoint**: `GET /api/live-stream/active`

**Description**: Get all currently active live streams

**Query Parameters**:
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 20

**Request**:
```
GET /api/live-stream/active?page=1&limit=20
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Active streams fetched successfully",
  "data": {
    "streams": [
      {
        "id": "123",
        "meeting_id": "nzbh-ck6b-g1rw",
        "title": "Gaming Live Stream",
        "streamer_name": "JohnDoe",
        "thumbnail_url": "https://...",
        "profile_image": "https://...",
        "viewer_count": 45,
        "start_time": "2025-10-05T10:30:00Z",
        "stream_type": "free",
        "cost_per_minute": 0,
        "streamer_id": 123,
        "is_active": true,
        "status": "active"
      }
      // ... more streams
    ],
    "total": 15,
    "page": 1,
    "limit": 20
  }
}
```

---

### 6. Send Tip
**Endpoint**: `POST /api/live-stream/tip`

**Description**: Send a tip to a streamer during live stream

**Request Body**:
```json
{
  "user_id": 456,
  "streamer_id": 123,
  "amount": 50,
  "message": "Great stream!"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Tip sent successfully",
  "data": {
    "amount": 50,
    "streamer_receives": 35,  // 70% of tip
    "platform_fee": 15,  // 30% platform fee
    "remaining_balance": 450
  }
}
```

**Error Responses**:
- 400: Insufficient balance
- 404: Stream or streamer not found

---

## Enhanced Live Stream APIs

### 7. Get Free Streams
**Endpoint**: `GET /api/enhanced-livestream/streams/free`

**Query Parameters**:
- `page`: Page number
- `limit`: Items per page
- `user_id`: Current user ID

**Request**:
```
GET /api/enhanced-livestream/streams/free?page=1&limit=10&user_id=123
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "streams": [
      {
        "id": "1",
        "meeting_id": "free-abc-123",
        "title": "Free Gaming Stream",
        "streamer_name": "Gamer123",
        "viewer_count": 50,
        "stream_type": "free",
        // ... other fields
      }
    ]
  }
}
```

---

### 8. Get Influencer Streams
**Endpoint**: `GET /api/enhanced-livestream/streams/influencer`

**Query Parameters**: Same as Free Streams

**Success Response**: Similar structure with `stream_type: "influencer"` and `cost_per_minute` field

---

### 9. Get Promotional Streams
**Endpoint**: `GET /api/enhanced-livestream/streams/promotional`

**Query Parameters**: Same as Free Streams

**Success Response**: Similar structure with `stream_type: "promotional"` and `company_pay_per_viewer_per_minute` field

---

## VideoSDK Integration APIs

### 10. Generate VideoSDK Token
**Endpoint**: `POST /api/videosdk/generate-token`

**Description**: Generate authentication token for VideoSDK

**Success Response** (200):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 11. Create VideoSDK Meeting
**Endpoint**: `POST /api/videosdk/create-meeting`

**Request Body**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "region": "us001"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "meetingId": "nzbh-ck6b-g1rw"
}
```

---

### 12. Validate Meeting
**Endpoint**: `POST /api/videosdk/validate-meeting`

**Request Body**:
```json
{
  "meetingId": "nzbh-ck6b-g1rw",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response** (200):
```json
{
  "valid": true
}
```

---

## Frontend Service Usage

### LiveStreamService Examples

#### Start a Stream
```typescript
import LiveStreamService from '@/services/liveStreamService';

const response = await LiveStreamService.startStream(userId, {
  title: 'My Stream',
  cost_per_minute: 10,
  viewer_reward_per_minute: 0,
  is_private: false
});

if (response.success) {
  const { meeting_id, token } = response.data;
  // Navigate to streaming screen
}
```

#### Join a Stream
```typescript
const response = await LiveStreamService.joinStream(userId, meetingId);

if (response.success) {
  const { token } = response.data;
  // Initialize VideoSDK with token
}
```

#### Get Active Streams
```typescript
const response = await LiveStreamService.getAllActiveStreams(userId, 1, 20);

if (response.success) {
  const streams = response.data.streams;
  // Display streams
}
```

---

## VideoSDK Web SDK Usage

### Initialize Meeting Provider
```tsx
import { MeetingProvider } from '@videosdk.live/react-sdk';

<MeetingProvider
  config={{
    meetingId: 'nzbh-ck6b-g1rw',
    micEnabled: true,
    webcamEnabled: true,
    name: 'Host',
    debugMode: false,
  }}
  token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  reinitialiseMeetingOnConfigChange={true}
  joinWithoutUserInteraction={true}
>
  {/* Meeting components */}
</MeetingProvider>
```

### Use Meeting Hook
```tsx
import { useMeeting } from '@videosdk.live/react-sdk';

const { 
  participants,
  localParticipant,
  toggleMic,
  toggleWebcam,
  leave,
  localMicOn,
  localWebcamOn 
} = useMeeting({
  onMeetingLeft: () => {
    console.log('Left meeting');
  },
  onParticipantJoined: (participant) => {
    console.log('Participant joined:', participant.id);
  },
  onParticipantLeft: (participant) => {
    console.log('Participant left:', participant.id);
  }
});
```

### Use Participant Hook
```tsx
import { useParticipant } from '@videosdk.live/react-sdk';

const { 
  webcamStream,
  webcamOn,
  micOn,
  displayName 
} = useParticipant(participantId);

// Render video
useEffect(() => {
  if (videoRef.current && webcamStream) {
    const mediaStream = new MediaStream();
    mediaStream.addTrack(webcamStream.track);
    videoRef.current.srcObject = mediaStream;
    videoRef.current.play();
  }
}, [webcamStream]);
```

---

## Error Codes Reference

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Missing required fields or validation error |
| 401 | Unauthorized | Invalid or expired JWT token |
| 404 | Not Found | Resource not found (stream, user, etc.) |
| 500 | Internal Server Error | Server-side error |

---

## Rate Limits

- **Start Stream**: 5 requests per hour per user
- **Join Stream**: 100 requests per hour per user
- **Get Active Streams**: 60 requests per minute
- **Send Tip**: 30 requests per minute per user

---

## WebSocket Events (Future Enhancement)

```typescript
// Real-time updates via WebSocket
socket.on('stream:viewer_joined', (data) => {
  // Update viewer count
});

socket.on('stream:viewer_left', (data) => {
  // Update viewer count
});

socket.on('stream:chat_message', (data) => {
  // Add message to chat
});

socket.on('stream:tip_received', (data) => {
  // Show tip notification
});
```

---

## Testing with Postman

### Collection Setup
1. Create new collection: "AdTip Live Streaming"
2. Set base URL variable: `{{baseUrl}}`
3. Set auth token variable: `{{authToken}}`

### Example Request
```
POST {{baseUrl}}/api/live-stream/start
Headers:
  Authorization: Bearer {{authToken}}
  Content-Type: application/json
Body:
{
  "user_id": 123,
  "meeting_id": "",
  "title": "Test Stream",
  "cost_per_minute": 10,
  "viewer_reward_per_minute": 0,
  "is_private": false
}
```

---

## Environment Variables

### Backend (.env)
```env
VIDEOSDK_API_KEY=your_videosdk_api_key
VIDEOSDK_SECRET_KEY=your_videosdk_secret_key
VIDEOSDK_API_ENDPOINT=https://api.videosdk.live/v2

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=adtip

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=24h
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:7082
```

---

## Support & Documentation

- **Backend Code**: `c:\A2\adtipback\controllers\LiveStreamController.js`
- **Frontend Service**: `c:\A2\adtip-web-reactjs\src\services\liveStreamService.ts`
- **VideoSDK Docs**: https://docs.videosdk.live/
- **API Postman Collection**: Available on request

---

**Last Updated**: October 5, 2025
**API Version**: 1.0.0
