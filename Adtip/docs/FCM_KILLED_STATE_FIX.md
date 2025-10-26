# FCM Killed State Notification Fix

## Problem Summary

The React Native app was not displaying incoming call notifications when completely killed/terminated by the user. This is a critical issue for calling functionality as users need to receive call notifications even when the app is not running.

## Root Causes Identified

1. **Multiple conflicting `setBackgroundMessageHandler` registrations**
   - WatermelonLocalChatManager, FCMChatServiceLocal, and FirebaseService all registered background handlers
   - Only one background handler can be active at a time
   - Conflicts caused messages to be dropped or misrouted

2. **Complex FCM routing in killed state**
   - The FCMMessageRouter was too complex for killed app state
   - Background handlers have limited execution time and capabilities
   - Complex imports and initialization often fail in killed state

3. **Missing direct Notifee integration**
   - Background handlers weren't using Notifee directly to display notifications
   - CallKeep doesn't work reliably in killed state on all devices
   - No fallback mechanism for notification display

4. **Improper data-only message handling**
   - FCM data-only messages require manual notification display
   - The app was relying on system notifications which don't work for data-only payloads

## Solution Implemented

### 1. Unified Background Message Handler

**File: `index.js`**
- Removed all other `setBackgroundMessageHandler` registrations
- Created single, unified handler that processes all background messages
- Simplified routing logic optimized for killed state execution

```javascript
messaging().setBackgroundMessageHandler(async remoteMessage => {
  // Single point of entry for all background messages
  // Handles both call and non-call messages appropriately
});
```

### 2. Direct Notifee Integration for Call Notifications

**Enhanced call notification handling:**
- Uses Notifee directly in background handler for maximum reliability
- Creates high-priority notification channels with proper configuration
- Implements full-screen call notifications with Answer/Decline actions
- Includes proper deep linking for app navigation when opened

```javascript
await notifee.displayNotification({
  id: sessionId,
  title: `Incoming ${callType} call`,
  body: `${callerName} is calling...`,
  android: {
    channelId,
    importance: 4, // HIGH
    category: 'call',
    fullScreenAction: { id: 'answer_call', launchActivity: 'default' },
    actions: [
      { title: '✅ Answer', pressAction: { id: 'answer', launchActivity: 'default' } },
      { title: '❌ Decline', pressAction: { id: 'decline' } },
    ],
    ongoing: true,
    autoCancel: false,
    // ... additional configuration
  }
});
```

### 3. Removed Conflicting Handlers

**Files modified:**
- `src/services/WatermelonLocalChatManager.ts`
- `src/services/FCMChatServiceLocal.ts`
- `src/services/FirebaseService.ts`

All background message handlers removed and replaced with delegation to unified handler.

### 4. Enhanced NotifeeCallHandler

**File: `src/services/notification/NotifeeCallHandler.tsx`**
- Improved background event handling
- Added killed state support
- Initialized early in index.js for maximum reliability

## Testing Instructions

### Prerequisites
1. Ensure you have a test device (physical device required for killed state testing)
2. Install the updated app
3. Grant all necessary permissions (notifications, phone, etc.)

### Test Scenarios

#### 1. App in Foreground
```bash
# Send test FCM message
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: key=YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "DEVICE_FCM_TOKEN",
    "data": {
      "type": "incoming_call",
      "sessionId": "test-session-123",
      "callerName": "Test Caller",
      "callType": "voice",
      "meetingId": "test-meeting-123",
      "token": "test-token-123"
    }
  }'
```

**Expected Result:** Call notification appears immediately with Answer/Decline buttons

#### 2. App in Background
1. Open app, then press home button (app goes to background)
2. Send test FCM message (same as above)

**Expected Result:** Call notification appears with full-screen intent and actions

#### 3. App Completely Killed (Critical Test)
1. Open app, then force-close it (swipe away from recent apps)
2. Wait 10 seconds to ensure app is fully terminated
3. Send test FCM message (same as above)

**Expected Result:** Call notification appears even though app is killed

#### 4. Device Locked Test
1. Kill the app completely
2. Lock the device screen
3. Send test FCM message

**Expected Result:** Notification appears on lock screen with call actions

#### 5. Battery Optimization Test
1. Enable battery optimization for the app (if available)
2. Kill the app completely
3. Send test FCM message

**Expected Result:** Notification should still appear (may have slight delay)

### Verification Checklist

- [ ] Notifications appear in all app states (foreground, background, killed)
- [ ] Answer/Decline buttons work correctly
- [ ] Deep linking works when notification is tapped
- [ ] No duplicate notifications are shown
- [ ] Notifications work on locked screen
- [ ] Sound and vibration work correctly
- [ ] Large icon displays properly (app logo fallback)
- [ ] Notification channel is created correctly

## Technical Details

### Android Manifest Configuration
The app already has proper FCM service configuration:
```xml
<service
    android:name="com.adtip.app.adtip_app.AdtipFirebaseMessagingService"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</service>
```

### Notification Channels
The fix creates high-priority notification channels:
- `adtip_incoming_calls_killed` - For call notifications in killed state
- `adtip_call_fallback` - Fallback channel for basic notifications
- `adtip_general` - For non-call notifications

### Deep Linking
Call notifications include deep link data:
```
adtip://call/meeting/{sessionId}?meetingId={meetingId}&token={token}&callerName={callerName}&callType={callType}
```

## Monitoring and Debugging

### Logs to Monitor
```bash
# Android logs
adb logcat | grep -E "(Index|NotifeeCallHandler|FCM)"

# Key log messages to look for:
# [Index] 🔥 Background message received (killed state)
# [Index] 📞 Processing call message in killed state
# [Index] ✅ Call notification displayed successfully in killed state
# [NotifeeCallHandler] Background event received
```

### Common Issues and Solutions

1. **Notifications not appearing in killed state**
   - Check if multiple background handlers are registered
   - Verify FCM message format includes required data fields
   - Ensure device allows background app refresh

2. **Actions not working**
   - Verify NotifeeCallHandler is initialized in index.js
   - Check background event handler registration
   - Ensure proper action IDs are used

3. **Deep linking not working**
   - Verify deep link format in notification data
   - Check navigation service implementation
   - Ensure app handles deep links properly

## Performance Impact

- **Minimal impact**: The unified handler is more efficient than multiple handlers
- **Faster execution**: Direct Notifee calls are faster than complex routing
- **Better reliability**: Simplified logic reduces failure points
- **Lower memory usage**: Fewer service instances and handlers

## Future Improvements

1. **iOS Support**: Enhance iOS-specific notification handling
2. **Rich Notifications**: Add caller avatar support for killed state
3. **Analytics**: Add tracking for notification delivery and interaction rates
4. **A/B Testing**: Test different notification formats for optimal engagement
