# Live Streaming Implementation for AdTip Web

## Overview
This document describes the implementation of live streaming functionality in the AdTip web application, mirroring the features available in the React Native mobile app.

## Features Implemented

### 1. Live Stream List Page (`/livestream`)
- Displays all active live streams (Free, Influencer, Promotional)
- Real-time viewer count
- Stream type badges with appropriate styling
- Refresh functionality
- "Go Live" button to start streaming
- Responsive grid layout for desktop and mobile

### 2. Start Stream Page (`/start-stream`)
- Stream configuration interface
- Three stream types:
  - **Free Stream**: Anyone can watch for free
  - **Influencer Stream**: Charge viewers per minute (₹1-₹100/min)
  - **Promotional Stream**: Pay viewers to watch (₹0.1-₹10/min)
- Privacy settings (public/private streams)
- Stream title configuration
- Broadcasting tips and monetization info

### 3. Live Streaming Screen (`/live-streaming`)
- Real-time video streaming using VideoSDK
- Host controls:
  - Toggle microphone
  - Toggle camera
  - End stream button
  - Viewer count display
- Viewer controls:
  - View host's video feed
  - Leave stream button
  - Stream information display
- Live chat functionality
- Real-time participant tracking

## Technical Architecture

### Services

#### 1. LiveStreamService (`src/services/liveStreamService.ts`)
Handles all live streaming API calls:
- `startStream()` - Start a new live stream
- `endStream()` - End an active stream
- `joinStream()` - Join as a viewer
- `leaveStream()` - Leave a stream
- `getActiveStreams()` - Fetch active streams
- `getAllActiveStreams()` - Fetch all stream types
- `getStreamsByType()` - Fetch streams by type
- `sendTip()` - Send tips during streams
- `getStreamAnalytics()` - Get stream analytics

#### 2. VideoSDKService (`src/services/videoSDKService.ts`)
Manages VideoSDK integration:
- `generateToken()` - Generate VideoSDK authentication token
- `createMeeting()` - Create VideoSDK meeting room
- `validateMeeting()` - Validate meeting ID

### Components

#### 1. LiveStream Component (`src/pages/LiveStream.tsx`)
- Lists all active streams
- Handles stream selection
- Navigation to streaming screen
- Refresh and error handling

#### 2. StartStream Component (`src/pages/StartStream.tsx`)
- Stream configuration form
- Stream type selection with radio buttons
- Dynamic pricing/reward inputs
- Privacy settings with toggle
- Form validation

#### 3. LiveStreaming Component (`src/pages/LiveStreaming.tsx`)
- VideoSDK integration with MeetingProvider
- Host and viewer modes
- Video rendering with ParticipantView
- Control panels for host and viewers
- Live chat panel
- Real-time participant tracking

### Routes Configuration
Updated `src/routes.tsx` to include:
```tsx
{
  path: "livestream",
  element: <LiveStream />,
},
{
  path: "start-stream",
  element: <StartStream />,
},
{
  path: "live-streaming",
  element: <LiveStreaming />,
},
```

### Navigation Integration

#### Sidebar (`src/components/ui/AdTipSidebar.tsx`)
Added LiveStream menu item above TipCall:
```tsx
{ to: "/livestream", label: "LiveStream", icon: <Video className="h-5 w-5" /> }
```

## Backend API Endpoints Used

### Live Streaming APIs
- `POST /api/live-stream/start` - Start a new stream
- `POST /api/live-stream/end` - End an active stream
- `POST /api/live-stream/join` - Join as viewer
- `POST /api/live-stream/leave` - Leave stream
- `GET /api/live-stream/active` - Get active streams
- `POST /api/live-stream/tip` - Send tip

### Enhanced Live Streaming APIs
- `GET /api/enhanced-livestream/streams/free` - Get free streams
- `GET /api/enhanced-livestream/streams/influencer` - Get influencer streams
- `GET /api/enhanced-livestream/streams/promotional` - Get promotional streams

### VideoSDK APIs
- `POST /api/videosdk/generate-token` - Generate VideoSDK token
- `POST /api/videosdk/create-meeting` - Create meeting room
- `POST /api/videosdk/validate-meeting` - Validate meeting

## Dependencies Added

### NPM Packages
```json
{
  "@videosdk.live/react-sdk": "^0.3.x"
}
```

Installed with:
```bash
npm install '@videosdk.live/react-sdk'
```

## Stream Types

### Free Stream
- No cost to watch
- Open to all viewers
- Build audience
- Viewers can send tips

### Influencer Stream
- Charge viewers per minute (₹1-₹100)
- Automatic billing system
- Wallet balance required for viewers
- 70/30 revenue split (influencer/platform)

### Promotional Stream
- Company-sponsored streams
- Pay viewers to watch (₹0.1-₹10/min)
- Product/service promotion
- Earnings credited to viewer wallets

## User Flow

### Host Starting a Stream
1. Navigate to `/livestream`
2. Click "Go Live" button
3. Configure stream on `/start-stream`:
   - Enter title
   - Select stream type
   - Set pricing/rewards
   - Configure privacy
4. Click "Start Stream"
5. Redirected to `/live-streaming` with host controls
6. Stream goes live with VideoSDK
7. Viewers can see and join

### Viewer Joining a Stream
1. Navigate to `/livestream`
2. Browse active streams
3. Click on a stream card
4. For influencer streams: wallet balance checked
5. Redirected to `/live-streaming` with viewer view
6. Watch host's video feed
7. Participate in live chat
8. Can leave anytime

## Security Features

1. **Authentication**: All API calls require JWT token
2. **Wallet Validation**: Influencer streams check viewer balance
3. **Private Streams**: Optional privacy settings
4. **Token Expiry**: VideoSDK tokens expire after 2 hours
5. **Billing Records**: Automatic tracking for paid streams

## Real-time Features

1. **Viewer Count**: Real-time participant tracking
2. **Live Chat**: Message broadcasting
3. **Video Streaming**: WebRTC-based low latency
4. **Device Controls**: Toggle mic/camera in real-time
5. **Participant Events**: Join/leave notifications

## Responsive Design

### Desktop
- Grid layout for stream cards (4 columns)
- Side chat panel
- Full-screen video player
- Dedicated control panels

### Mobile
- Single column stream list
- Overlay controls
- Touch-optimized buttons
- Responsive video player

## Performance Optimizations

1. **Lazy Loading**: Stream thumbnails loaded on demand
2. **Parallel Fetching**: All stream types fetched simultaneously
3. **VideoSDK Caching**: Token caching for performance
4. **Memoization**: Participant lists memoized
5. **Background Operations**: Non-critical ops queued

## Error Handling

1. **Network Errors**: Graceful fallback messages
2. **Invalid Stream**: Redirect to stream list
3. **Permission Errors**: Clear user feedback
4. **VideoSDK Failures**: Automatic retry logic
5. **Wallet Insufficient**: Balance requirement display

## Testing Checklist

### Host Functionality
- [ ] Start free stream
- [ ] Start influencer stream
- [ ] Start promotional stream
- [ ] Toggle microphone
- [ ] Toggle camera
- [ ] End stream
- [ ] View viewer count
- [ ] Send/receive chat messages

### Viewer Functionality
- [ ] Browse active streams
- [ ] Join free stream
- [ ] Join influencer stream (with balance)
- [ ] Join promotional stream
- [ ] View host video
- [ ] Leave stream
- [ ] Send chat messages
- [ ] See viewer count

### Edge Cases
- [ ] No active streams
- [ ] Insufficient wallet balance
- [ ] Network disconnection
- [ ] Host leaves unexpectedly
- [ ] Invalid meeting ID
- [ ] Token expiry

## Future Enhancements

1. **HLS Streaming**: Support for large audiences (100+ viewers)
2. **Recording**: Auto-record streams for replay
3. **Screen Sharing**: Host can share screen
4. **Virtual Backgrounds**: Custom backgrounds for hosts
5. **Reactions**: Emoji reactions during stream
6. **Gifting**: Send virtual gifts to hosts
7. **Stream Scheduling**: Schedule streams in advance
8. **Analytics Dashboard**: Detailed stream analytics
9. **Multi-host Streaming**: Co-hosting support
10. **Mobile Optimization**: Progressive Web App features

## Troubleshooting

### Common Issues

**Issue**: Stream not starting
- Check VideoSDK credentials in backend .env
- Verify wallet balance for influencer streams
- Check browser permissions for camera/mic

**Issue**: Can't see host video
- Wait for host to enable camera
- Check network connection
- Refresh page if stale meeting

**Issue**: Chat not working
- Verify WebSocket connection
- Check authentication token
- Try refreshing the page

**Issue**: Audio/Video not working
- Grant browser permissions
- Check device availability
- Verify VideoSDK service status

## Environment Variables

Backend `.env` file must include:
```env
VIDEOSDK_API_KEY=your_videosdk_api_key
VIDEOSDK_SECRET_KEY=your_videosdk_secret_key
VIDEOSDK_API_ENDPOINT=https://api.videosdk.live/v2
```

## Deployment Notes

1. Ensure VideoSDK credentials are configured
2. Database tables for live_streams must exist
3. Test WebRTC connectivity through firewall
4. Enable HTTPS for production (required by WebRTC)
5. Configure CORS for VideoSDK API calls

## Support

For issues or questions:
1. Check backend logs for API errors
2. Check browser console for VideoSDK errors
3. Verify network connectivity
4. Test with different browsers
5. Check VideoSDK status page

## License

This implementation follows the same license as the AdTip application.

---

**Implementation Date**: October 5, 2025
**Version**: 1.0.0
**Status**: Complete and Ready for Testing
