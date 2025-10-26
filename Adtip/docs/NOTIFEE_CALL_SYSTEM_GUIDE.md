# Notifee Call System Guide

## Overview

This guide covers the new Notifee-based custom call UI system and enhanced outgoing call ringing functionality implemented in the Adtip React Native app.

## Features Implemented

### 1. DebugButtonsList Component
- **Location**: `src/components/debug/DebugButtonsList.tsx`
- **Purpose**: Comprehensive debug buttons for testing call functionalities
- **Visibility**: Only in debug builds (`__DEV__ === true`)
- **Position**: Top-left corner of the screen

### 2. Notifee Custom Incoming Call UI
- **Perfect reliability**: Works in all app states (killed/background/foreground)
- **Full-screen notifications**: Shows on lock screen with answer/decline actions
- **Automatic navigation**: Tapping "Answer" navigates to MeetingScreenSimple
- **Deep link integration**: Uses proper navigation with meeting parameters

### 3. Enhanced Outgoing Call Ringing
- **Automatic ringing**: Starts when outgoing call is connecting
- **Smart detection**: Uses VideoSDK participant join callbacks
- **Auto-stop**: Stops ringing when 2nd participant joins
- **Audio service**: Integrated with RingingAudioService

## Components and Services

### DebugButtonsList.tsx
```typescript
// Test buttons available:
- 📱 Test Notifee Incoming Call
- 📞 Test Outgoing Call Ringing  
- ⚙️ Notification Settings
- 🔗 Test Deep Link
```

### NotifeeCallHandler.tsx
```typescript
// Key methods:
- initialize(): Sets up notification event handlers
- displayIncomingCall(): Shows custom incoming call notification
- handleAnswerCall(): Navigates to meeting screen
- handleDeclineCall(): Dismisses notification
```

### Enhanced MeetingScreenSimple.tsx
```typescript
// Ringing logic:
- Detects outgoing calls
- Starts ringing when connecting
- Stops ringing when remote participant joins
- Uses VideoSDK participant events
```

## How It Works

### Notifee Incoming Call Flow
1. **Notification Display**: High-priority notification with full-screen intent
2. **User Action**: User taps "Answer" or "Decline"
3. **Event Handling**: NotifeeCallHandler processes the action
4. **Navigation**: Automatic navigation to MeetingScreenSimple with proper params
5. **Call Setup**: Meeting screen initializes with call data

### Outgoing Call Ringing Flow
1. **Call Initiation**: User starts outgoing call
2. **Status Detection**: MeetingScreenSimple detects "connecting" status
3. **Ringing Start**: RingingAudioService starts playing ringing sound
4. **Participant Join**: VideoSDK fires onParticipantJoined event
5. **Ringing Stop**: Automatic stop when remote participant detected

## VideoSDK Integration

### Participant Detection
```typescript
// Enhanced onParticipantJoined callback
onParticipantJoined: (participant) => {
  const isRemoteParticipant = participant?.id !== mMeeting?.localParticipant?.id;
  
  if (isRemoteParticipant) {
    // Stop ringing for outgoing calls
    if (props.onRemoteParticipantJoined) {
      props.onRemoteParticipantJoined(participant);
    }
  }
}
```

### Ringing State Management
```typescript
// Ringing logic in MeetingScreenSimple
useEffect(() => {
  const isOutgoingCall = session?.direction === 'outgoing'
  const isConnecting = status === 'connecting' || status === 'outgoing'
  const hasRemoteParticipants = remoteParticipants.length > 0

  if (isOutgoingCall && isConnecting && !hasRemoteParticipants) {
    ringingAudioService.startRinging()
  } else {
    ringingAudioService.stopRinging()
  }
}, [session?.direction, status, remoteParticipants.length])
```

## Testing Instructions

### 1. Test Notifee Incoming Call
1. Open the app in debug mode
2. Look for "🧪 Debug Tests" panel in top-left corner
3. Tap "📱 Test Notifee Incoming Call"
4. Notification should appear immediately
5. Test in different app states:
   - **Foreground**: Notification appears instantly
   - **Background**: Notification shows in notification panel
   - **Killed**: Kill app, notification should still work via FCM

### 2. Test Answer Action
1. When notification appears, tap "✅ Answer"
2. App should navigate to MeetingScreenSimple
3. Meeting screen should show with proper call data
4. Verify meeting ID, token, and caller name are passed correctly

### 3. Test Outgoing Call Ringing
1. Tap "📞 Test Outgoing Call Ringing"
2. Should navigate to meeting screen
3. Should show "Ringing..." status
4. Ringing sound should play
5. When 2nd participant joins (simulate by joining from another device), ringing should stop

### 4. Test in Different States
- **App Active**: All features work immediately
- **App Background**: Notifications work, navigation brings app to foreground
- **App Killed**: FCM triggers notifications, tapping answer launches app and navigates

## Configuration

### Notification Channels
```typescript
// High-priority channel for incoming calls
const channelId = await notifee.createChannel({
  id: 'adtip_incoming_calls',
  name: 'Incoming Calls',
  importance: AndroidImportance.HIGH,
  sound: 'default',
  vibration: true,
});
```

### Deep Link Setup
```typescript
// Deep link format for call navigation
const testUrl = 'adtip://meeting?meetingId=test123&token=testtoken&callerName=TestCaller&callType=video';
```

### FCM Integration
- Background FCM messages trigger Notifee notifications
- NotifeeCallHandler processes all notification actions
- Automatic navigation to meeting screen on answer

## Troubleshooting

### Notifications Not Showing
1. Check notification permissions: Settings > Apps > Adtip > Notifications
2. Verify channel importance is set to HIGH
3. Test with "⚙️ Notification Settings" button

### Navigation Not Working
1. Check NavigationService is properly initialized
2. Verify meeting parameters are valid
3. Check console logs for navigation errors

### Ringing Not Working
1. Verify RingingAudioService is available
2. Check audio permissions
3. Test with different audio output devices

### Background/Killed State Issues
1. Verify FCM is properly configured
2. Check background app restrictions
3. Test NotifeeCallHandler initialization

## Best Practices

### 1. Error Handling
- Always wrap notification calls in try-catch
- Provide fallback mechanisms
- Log errors for debugging

### 2. State Management
- Use proper dependency arrays in useEffect
- Clean up resources on unmount
- Handle edge cases gracefully

### 3. User Experience
- Show clear feedback for user actions
- Handle permissions gracefully
- Provide alternative flows when features unavailable

## Future Enhancements

### 1. Call Quality Indicators
- Network quality detection
- Audio/video quality metrics
- Automatic quality adjustment

### 2. Advanced Notifications
- Rich media in notifications
- Custom notification sounds
- Notification grouping

### 3. Enhanced Ringing
- Custom ringtones
- Vibration patterns
- Volume control

## Notes

- Notifee provides more reliable notifications than React Native's built-in system
- VideoSDK callbacks are essential for proper participant detection
- Deep links ensure proper app state restoration
- Always test in all app states (foreground/background/killed)
- FCM integration is crucial for killed app state functionality
