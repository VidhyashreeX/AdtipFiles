# Live Streaming Testing Guide - AdTip Web

## Pre-Testing Setup

### 1. Backend Configuration
Ensure the backend is running with proper VideoSDK credentials:

```bash
cd c:\A2\adtipback
# Check .env file has:
VIDEOSDK_API_KEY=your_api_key
VIDEOSDK_SECRET_KEY=your_secret_key
VIDEOSDK_API_ENDPOINT=https://api.videosdk.live/v2

# Start backend
npm start
```

### 2. Frontend Setup
```bash
cd c:\A2\adtip-web-reactjs
# Ensure dependencies are installed
npm install

# Start development server
npm run dev
```

### 3. Test Accounts
Prepare at least 2 test accounts:
- **Account A** (Host): Has sufficient wallet balance
- **Account B** (Viewer): Has ₹100+ wallet balance for testing influencer streams

## Test Cases

### Test Suite 1: Navigation & UI

#### TC1.1: Access Live Stream Page
1. Login with Account A
2. Click "LiveStream" in sidebar (above TipCall)
3. **Expected**: Navigates to `/livestream`
4. **Expected**: Shows "Live Streams" header with "Go Live" button
5. **Expected**: Shows "No Live Streams" if none active

#### TC1.2: Mobile Navigation
1. Open app on mobile/resize browser to mobile view
2. Check sidebar menu
3. **Expected**: LiveStream option visible above TipCall
4. **Expected**: Responsive layout on mobile

#### TC1.3: Start Stream Page Access
1. On `/livestream`, click "Go Live" button
2. **Expected**: Navigates to `/start-stream`
3. **Expected**: Shows stream configuration form

### Test Suite 2: Free Stream

#### TC2.1: Create Free Stream
1. Navigate to `/start-stream`
2. Enter title: "Test Free Stream"
3. Select "Free Stream" radio button
4. Click "Start Stream"
5. **Expected**: Success toast notification
6. **Expected**: Navigates to `/live-streaming`
7. **Expected**: Shows host video feed
8. **Expected**: Shows control buttons (mic, camera, end)

#### TC2.2: Host Controls
1. In active free stream as host
2. Click microphone button
3. **Expected**: Mic toggles on/off, button color changes
4. Click camera button
5. **Expected**: Camera toggles on/off, video shows/hides
6. **Expected**: Viewer count shows "0 viewers" initially

#### TC2.3: Join Free Stream (Viewer)
1. Open app in new browser window/incognito
2. Login with Account B
3. Navigate to `/livestream`
4. **Expected**: See "Test Free Stream" in the list
5. **Expected**: Shows "LIVE" badge and "Free Stream" badge
6. Click on the stream card
7. **Expected**: Navigates to `/live-streaming`
8. **Expected**: Shows host's video feed
9. **Expected**: Shows "Waiting for host..." if host camera is off

#### TC2.4: Viewer Count Update
1. With viewer joined (TC2.3)
2. On host screen (Account A)
3. **Expected**: Viewer count updates to "1 viewer"
4. Have viewer leave
5. **Expected**: Viewer count decreases to "0 viewers"

#### TC2.5: End Free Stream
1. As host, click "End Stream" button (phone off icon)
2. **Expected**: Confirmation or immediate end
3. **Expected**: Navigates back to `/livestream`
4. **Expected**: Success notification
5. On viewer side (if still connected)
6. **Expected**: Meeting ends, redirects to stream list

### Test Suite 3: Influencer Stream

#### TC3.1: Create Influencer Stream
1. Navigate to `/start-stream`
2. Enter title: "Test Influencer Stream"
3. Select "Influencer Stream" radio button
4. Set cost per minute: ₹10
5. Click "Start Stream"
6. **Expected**: Stream starts successfully
7. **Expected**: Host can see stream controls

#### TC3.2: Join Influencer Stream (Sufficient Balance)
1. Login with Account B (has ₹100+ balance)
2. Navigate to `/livestream`
3. Find "Test Influencer Stream"
4. **Expected**: Shows "₹10/min" indicator
5. Click to join
6. **Expected**: Wallet balance checked on backend
7. **Expected**: Successfully joins stream
8. **Expected**: Can see host video

#### TC3.3: Join Influencer Stream (Insufficient Balance)
1. Use account with < ₹10 balance
2. Try to join influencer stream
3. **Expected**: Backend returns 400 error
4. **Expected**: Error message shows insufficient balance
5. **Expected**: Shows required amount and shortfall

#### TC3.4: Billing for Influencer Stream
1. Viewer watches influencer stream for 2+ minutes
2. Check backend database: `influencer_stream_billing` table
3. **Expected**: Billing record created for viewer
4. **Expected**: `minutes_watched` increments
5. **Expected**: `amount_charged` calculates correctly

### Test Suite 4: Promotional Stream

#### TC4.1: Create Promotional Stream
1. Navigate to `/start-stream`
2. Enter title: "Test Promotional Stream"
3. Select "Promotional Stream" radio button
4. Set viewer reward: ₹2/min
5. Click "Start Stream"
6. **Expected**: Stream starts successfully

#### TC4.2: Join Promotional Stream
1. Login with Account B
2. Find "Test Promotional Stream"
3. **Expected**: Shows "Earn ₹2/min" indicator
4. Click to join
5. **Expected**: Successfully joins
6. **Expected**: Can see host video

#### TC4.3: Earnings for Promotional Stream
1. Viewer watches promotional stream for 2+ minutes
2. Check backend database: `promotional_stream_earnings` table
3. **Expected**: Earnings record created
4. **Expected**: `minutes_watched` increments
5. **Expected**: `total_earnings` calculates correctly
6. **Expected**: Earnings added to viewer wallet

### Test Suite 5: Live Chat

#### TC5.1: Open Chat Panel
1. In active stream (host or viewer)
2. Click chat button (message circle icon at bottom right)
3. **Expected**: Chat panel slides in from right
4. **Expected**: Shows "Chat" header with close button
5. **Expected**: Shows message input at bottom

#### TC5.2: Send Chat Message
1. In chat panel, type "Hello from test!"
2. Press Enter or click Send button
3. **Expected**: Message appears in chat
4. **Expected**: Shows sender name (You or username)
5. **Expected**: Message persists in chat history

#### TC5.3: Close Chat Panel
1. Click X button on chat panel
2. **Expected**: Chat panel closes
3. **Expected**: Chat button still visible
4. Click chat button again
5. **Expected**: Chat reopens with message history

### Test Suite 6: Privacy Settings

#### TC6.1: Private Stream Creation
1. Navigate to `/start-stream`
2. Enter title: "Private Test Stream"
3. Toggle "Private Stream" switch to ON
4. **Expected**: Shows "Only invited viewers can join"
5. Start stream
6. **Expected**: Stream created as private

#### TC6.2: Public Stream Creation
1. Create stream with "Private Stream" switch OFF
2. **Expected**: Shows "Anyone can join your stream"
3. Start stream
4. **Expected**: Stream visible to all users

### Test Suite 7: Stream Discovery

#### TC7.1: View Active Streams
1. Navigate to `/livestream`
2. **Expected**: All active streams displayed in grid
3. **Expected**: Stream cards show:
   - Thumbnail/profile image
   - "LIVE" badge
   - Stream type badge
   - Title
   - Streamer name
   - Viewer count
   - Duration ("LIVE")
   - Cost/earnings info

#### TC7.2: Refresh Stream List
1. On `/livestream`, click "Refresh" button
2. **Expected**: Button shows loading spinner
3. **Expected**: Stream list updates
4. **Expected**: New streams appear if started

#### TC7.3: Empty Stream List
1. Ensure no active streams exist
2. Navigate to `/livestream`
3. **Expected**: Shows video icon and "No Live Streams" message
4. **Expected**: Shows "Be the first to go live!" text
5. **Expected**: "Start Streaming" button visible

### Test Suite 8: Error Handling

#### TC8.1: Invalid Stream Configuration
1. Navigate to `/start-stream`
2. Leave title empty
3. Click "Start Stream"
4. **Expected**: Shows "Please enter a stream title" error
5. **Expected**: Start button disabled when title empty

#### TC8.2: Network Error Handling
1. Start a stream
2. Disconnect network
3. **Expected**: Graceful error handling
4. **Expected**: User-friendly error message
5. Reconnect network
6. **Expected**: Ability to rejoin or recover

#### TC8.3: Invalid Meeting ID
1. Try to join stream with invalid meeting_id
2. **Expected**: Shows error "Invalid stream configuration"
3. **Expected**: "Back to Streams" button available
4. Click button
5. **Expected**: Returns to `/livestream`

#### TC8.4: VideoSDK Token Expiry
1. Start stream and keep it running for 2+ hours
2. **Expected**: Token refresh or graceful handling
3. **Expected**: User notified if token expires
4. **Expected**: Option to restart stream

### Test Suite 9: Responsive Design

#### TC9.1: Desktop Layout
1. View on desktop (1920x1080)
2. **Expected**: Stream grid shows 4 columns
3. **Expected**: Chat panel on right side
4. **Expected**: Full-size video player
5. **Expected**: All controls easily accessible

#### TC9.2: Tablet Layout
1. View on tablet (768x1024)
2. **Expected**: Stream grid shows 2-3 columns
3. **Expected**: Chat panel adapts
4. **Expected**: Touch-optimized controls

#### TC9.3: Mobile Layout
1. View on mobile (375x667)
2. **Expected**: Stream grid shows 1 column
3. **Expected**: Full-screen video player
4. **Expected**: Overlay controls
5. **Expected**: Chat panel overlays video

### Test Suite 10: Performance

#### TC10.1: Multiple Streams
1. Create 3+ streams from different accounts
2. Navigate to `/livestream`
3. **Expected**: All streams load quickly
4. **Expected**: Thumbnails load efficiently
5. **Expected**: No lag in UI

#### TC10.2: Viewer Limit
1. Have 5+ viewers join same stream
2. **Expected**: All viewers see video smoothly
3. **Expected**: Viewer count accurate
4. **Expected**: Chat works for all viewers

#### TC10.3: Stream Quality
1. Start stream with good internet
2. **Expected**: Video quality is HD
3. **Expected**: Audio clear with no echo
4. **Expected**: Low latency (< 2 seconds)

## Test Results Template

### Test Execution Log

| Test ID | Description | Result | Notes | Date | Tester |
|---------|-------------|--------|-------|------|--------|
| TC1.1 | Access Live Stream Page | ⬜ Pass ⬜ Fail | | | |
| TC1.2 | Mobile Navigation | ⬜ Pass ⬜ Fail | | | |
| TC2.1 | Create Free Stream | ⬜ Pass ⬜ Fail | | | |
| ... | ... | ... | ... | ... | ... |

## Known Issues

### Issue Template

**Issue #**: 
**Test Case**: 
**Description**: 
**Steps to Reproduce**: 
**Expected Result**: 
**Actual Result**: 
**Severity**: Critical / High / Medium / Low
**Status**: Open / In Progress / Fixed / Closed

## Browser Compatibility

Test on the following browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

## Device Testing

Test on the following devices:
- [ ] Desktop Windows
- [ ] Desktop macOS
- [ ] Desktop Linux
- [ ] iPhone
- [ ] Android Phone
- [ ] iPad
- [ ] Android Tablet

## Automated Testing (Future)

### Unit Tests
```typescript
// Example test structure
describe('LiveStreamService', () => {
  it('should start stream successfully', async () => {
    // Test implementation
  });
  
  it('should join stream as viewer', async () => {
    // Test implementation
  });
});
```

### Integration Tests
- API endpoint testing
- VideoSDK integration testing
- Database transaction testing

### E2E Tests
- User flow automation
- Cross-browser testing
- Performance benchmarking

## Sign-off

**Development Team**: 
**QA Team**: 
**Product Owner**: 
**Date**: 
**Version**: 1.0.0

---

## Quick Test Commands

```bash
# Start backend
cd c:\A2\adtipback
npm start

# Start frontend
cd c:\A2\adtip-web-reactjs
npm run dev

# Check backend logs
# (Look for LiveStreamController, VideoSDKService logs)

# Check frontend console
# (Look for [LiveStreamService], [VideoSDKService] logs)
```

## Support Contacts

- **Backend Issues**: Check `adtipback/controllers/LiveStreamController.js`
- **Frontend Issues**: Check `adtip-web-reactjs/src/services/liveStreamService.ts`
- **VideoSDK Issues**: Check `adtipback/services/videosdk_service.js`

---

**Last Updated**: October 5, 2025
**Test Version**: 1.0.0
