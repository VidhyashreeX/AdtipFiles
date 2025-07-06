# WhatsApp-Like Calling System Implementation

## Overview

This implementation provides a complete WhatsApp-like calling experience in React Native using:
- **@notifee/react-native** for persistent call notifications
- **@videosdk.live/react-native-sdk** for video/voice calling
- Full background and killed app state support
- Persistent ongoing call notifications

## Architecture

### Core Components

1. **WhatsAppCallManager** (`src/services/calling/WhatsAppCallManager.ts`)
   - Main orchestrator for all call operations
   - Handles call state management and persistence
   - Manages notifications and user interactions
   - Integrates with VideoSDK for actual call functionality

2. **CallNotificationHandler** (`src/services/calling/CallNotificationHandler.ts`)
   - Handles FCM push notifications for calls
   - Routes call notifications to WhatsAppCallManager
   - Manages app state transitions

3. **CallService** (`src/services/CallService.ts`)
   - Updated to delegate to WhatsAppCallManager
   - Maintains compatibility with existing app code
   - Maps between WhatsApp call states and app states

4. **Integration Points**
   - `App.tsx`: Initializes managers and handles incoming calls
   - `TipCallScreen.tsx`: Uses WhatsAppCallManager for outgoing calls
   - `MeetingScreen.tsx`: VideoSDK meeting interface

## Call Flow

### Outgoing Calls

1. User initiates call from TipCallScreen
2. WhatsAppCallManager creates call data
3. API sends notification to recipient
4. Caller sees "Calling..." notification
5. When recipient accepts, both parties join VideoSDK meeting

### Incoming Calls

1. FCM notification received by CallNotificationHandler
2. WhatsAppCallManager displays full-screen call notification
3. User can accept/decline from notification
4. On accept, navigates to VideoSDK meeting
5. On decline, call is ended and cleanup performed

### Background/Killed App Support

- **Background**: Persistent notifications with accept/decline actions
- **Killed**: FCM wakes app, shows full-screen call notification
- **Ongoing**: Floating notification during active calls

## Key Features

### ✅ Persistent Notifications
- High-priority call notifications that stay visible
- Accept/Decline actions work from notification
- Ongoing call notifications with hang-up/mute actions

### ✅ State Management
- Call state persisted to AsyncStorage
- Automatic restoration on app restart
- Proper cleanup on call end

### ✅ Multiple App States
- **Foreground**: Direct UI updates
- **Background**: Notification actions
- **Killed**: FCM triggers notification

### ✅ VideoSDK Integration
- Seamless transition to video/voice calls
- Meeting management through VideoSDK
- Audio/video controls

### ✅ Error Handling
- Graceful degradation when notifications fail
- Retry mechanisms for network issues
- Fallback to basic calling if needed

## API Integration

### Required APIs

1. **Send Call Notification**
   ```typescript
   POST /api/call/notify
   {
     recipientId: string,
     callerName: string,
     callType: 'voice' | 'video',
     meetingId: string,
     token: string
   }
   ```

2. **Update Call Status**
   ```typescript
   POST /api/call/status
   {
     callId: string,
     status: 'accepted' | 'declined' | 'ended',
     participantId: string
   }
   ```

## Setup Instructions

### 1. Dependencies

Already installed:
- `@notifee/react-native`
- `@videosdk.live/react-native-sdk`
- `@react-native-firebase/messaging`
- `@react-native-async-storage/async-storage`

### 2. Android Configuration

Ensure `android/app/src/main/AndroidManifest.xml` has:

```xml
<!-- Call permissions -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />

<!-- Notification permissions -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT" />

<!-- Call activities -->
<activity
    android:name=".CallActivity"
    android:exported="true"
    android:launchMode="singleTask"
    android:showWhenLocked="true"
    android:turnScreenOn="true" />
```

### 3. iOS Configuration

Add to `ios/Adtip/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>This app needs camera access for video calls</string>
<key>NSMicrophoneUsageDescription</key>
<string>This app needs microphone access for voice calls</string>
<key>UIBackgroundModes</key>
<array>
    <string>voip</string>
    <string>audio</string>
</array>
```

## Usage

### Initialize System (App.tsx)

```typescript
import WhatsAppCallManager from './src/services/calling/WhatsAppCallManager';
import CallNotificationHandler from './src/services/calling/CallNotificationHandler';

// In App component
useEffect(() => {
  const initializeCallSystem = async () => {
    const callManager = WhatsAppCallManager.getInstance();
    const notificationHandler = CallNotificationHandler.getInstance();
    
    await callManager.initialize();
    await notificationHandler.initialize();
  };
  
  initializeCallSystem();
}, []);
```

### Start Outgoing Call (TipCallScreen.tsx)

```typescript
import WhatsAppCallManager from '../../services/calling/WhatsAppCallManager';

const handleStartCall = async () => {
  const callManager = WhatsAppCallManager.getInstance();
  
  const callData = await callManager.startOutgoingCall(
    recipientId,
    recipientName,
    callType, // 'voice' | 'video'
    callerName,
    callerId
  );
  
  if (callData) {
    // Navigate to meeting screen or show calling UI
  }
};
```

### Handle Incoming Calls (FCM)

Incoming calls are automatically handled by `CallNotificationHandler` when FCM notifications are received.

## Notification Channels

The system creates these notification channels:

1. **Incoming Calls** (`incoming_call_channel`)
   - High priority
   - Full-screen intent
   - Accept/Decline actions

2. **Outgoing Calls** (`outgoing_call_channel`)
   - High priority
   - Cancel action

3. **Ongoing Calls** (`ongoing_call_channel`)
   - High priority
   - Persistent during call
   - Hang-up/Mute actions

## Testing

### Manual Testing

1. **Outgoing Calls**
   - Start call from TipCallScreen
   - Verify "Calling..." notification appears
   - Test cancel functionality

2. **Incoming Calls**
   - Send FCM notification with call data
   - Verify full-screen notification appears
   - Test accept/decline actions

3. **Background States**
   - Put app in background during call
   - Verify ongoing notification persists
   - Test notification actions

4. **Killed App**
   - Force close app
   - Send FCM call notification
   - Verify app opens with call notification

### Automated Testing

Run the test suite:

```bash
npm test -- --testPathPattern=WhatsAppCallManager.test.ts
```

## Troubleshooting

### Common Issues

1. **Notifications Not Showing**
   - Check notification permissions
   - Verify channel creation
   - Check Android battery optimization

2. **FCM Not Working**
   - Verify Firebase configuration
   - Check FCM token generation
   - Ensure proper message format

3. **VideoSDK Issues**
   - Check meeting ID and token validity
   - Verify VideoSDK service configuration
   - Check network connectivity

4. **App Not Waking from Killed State**
   - Verify FCM high-priority messages
   - Check Android auto-start permissions
   - Ensure proper background processing

### Debug Logs

Enable debug logging in development:

```typescript
// In WhatsAppCallManager.ts
const DEBUG = __DEV__;

if (DEBUG) {
  console.log('[WhatsAppCallManager] Debug info:', data);
}
```

## Performance Considerations

1. **Notification Efficiency**
   - Channels created once on initialization
   - Notifications cancelled when no longer needed
   - Minimal background processing

2. **State Persistence**
   - Only active call state is persisted
   - Automatic cleanup on call end
   - Efficient AsyncStorage usage

3. **Memory Management**
   - Singleton pattern prevents multiple instances
   - Event listeners properly cleaned up
   - VideoSDK resources released on call end

## Security Considerations

1. **Token Validation**
   - VideoSDK tokens have limited lifetime
   - API calls include authentication
   - Sensitive data not logged

2. **Call Privacy**
   - Call data encrypted in transit
   - Local storage encrypted (AsyncStorage)
   - No sensitive data in notifications

## Future Enhancements

1. **Call History**
   - Persist call logs
   - Show missed calls
   - Call analytics

2. **Group Calls**
   - Multi-participant calls
   - Conference management
   - Participant controls

3. **Advanced Features**
   - Call recording
   - Screen sharing
   - File sharing during calls

4. **UI Improvements**
   - Custom call UI themes
   - Animated transitions
   - Rich notifications

## Maintenance

### Regular Tasks

1. **Update Dependencies**
   - Keep Notifee and VideoSDK updated
   - Test compatibility with new versions
   - Review breaking changes

2. **Monitor Performance**
   - Check notification delivery rates
   - Monitor call connection success
   - Track user experience metrics

3. **Security Updates**
   - Review API security
   - Update authentication methods
   - Audit call data handling

---

## Implementation Status: ✅ Complete

All core functionality has been implemented and tested:

- ✅ WhatsApp-like call notifications
- ✅ Background and killed app support
- ✅ VideoSDK integration
- ✅ State persistence and restoration
- ✅ FCM notification handling
- ✅ Error handling and fallbacks
- ✅ TypeScript type safety
- ✅ Test coverage

The system is ready for production use with proper testing and monitoring.
