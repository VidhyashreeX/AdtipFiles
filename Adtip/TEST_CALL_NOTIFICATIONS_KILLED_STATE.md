# Test Plan: Call Notifications in Killed State

## Testing the Fix

### Prerequisites
1. Ensure the app is built with the latest changes
2. Have two devices/accounts for testing
3. Enable notification permissions
4. Test on both Android and iOS if possible

### Test Scenarios

#### 1. App in Killed State - Basic Call Notification
**Steps:**
1. Force close the app completely (swipe away from recent apps)
2. Send a call notification from another device/backend
3. Verify notification appears on the device
4. Tap the notification
5. Verify app launches and navigates to call screen

**Expected Result:**
- ✅ Notification appears with Answer/Decline buttons
- ✅ Tapping notification launches app
- ✅ App navigates to meeting screen
- ✅ Call session is properly initialized

#### 2. App in Killed State - Answer Button
**Steps:**
1. Force close the app completely
2. Send a call notification
3. Tap the "Answer" button on the notification
4. Verify app launches and call is accepted

**Expected Result:**
- ✅ App launches immediately
- ✅ Navigates directly to meeting screen
- ✅ Call is in connected state
- ✅ Audio/video works properly

#### 3. App in Killed State - Decline Button
**Steps:**
1. Force close the app completely
2. Send a call notification
3. Tap the "Decline" button on the notification
4. Verify notification is dismissed

**Expected Result:**
- ✅ Notification disappears
- ✅ App does not launch
- ✅ Call is properly declined on sender side

#### 4. App in Background - Call Notification
**Steps:**
1. Put app in background (home button)
2. Send a call notification
3. Verify notification appears
4. Test Answer/Decline buttons

**Expected Result:**
- ✅ Same behavior as killed state
- ✅ App comes to foreground when answered
- ✅ Proper navigation to call screen

#### 5. App in Foreground - Call Notification
**Steps:**
1. Keep app in foreground
2. Send a call notification
3. Verify in-app call UI appears

**Expected Result:**
- ✅ In-app call UI appears (not system notification)
- ✅ Answer/Decline works within app
- ✅ No system notification shown

### Debugging Commands

#### Check Logs
```bash
# Android
adb logcat | grep -E "(Index|NotifeeCallHandler|FCMMessageRouter|CallFCMHandler)"

# iOS
# Use Xcode console or React Native debugger
```

#### Test FCM Message Format
The FCM message should have this structure:
```json
{
  "data": {
    "type": "incoming_call",
    "sessionId": "call-123",
    "callerName": "John Doe",
    "callType": "video",
    "meetingId": "meeting-123",
    "token": "token-123",
    "callerId": "user-456"
  }
}
```

### Troubleshooting

#### If Notifications Don't Appear
1. Check notification permissions
2. Verify FCM token is valid
3. Check if message format is correct
4. Look for errors in logs

#### If App Doesn't Launch
1. Check if notification has proper `launchActivity` setting
2. Verify deep link configuration
3. Check navigation service logs

#### If Navigation Fails
1. Check if NavigationService is ready
2. Verify meeting screen is properly configured
3. Check for navigation errors in logs

### Log Messages to Look For

#### Success Indicators
```
[Index] ✅ NotifeeCallHandler initialized for killed state support
[Index] 📞 Handling call message in killed state using NotifeeCallHandler
[NotifeeCallHandler] ✅ Incoming call notification displayed
[NotifeeCallHandler] Background event received: { type: 1, actionId: 'answer' }
[NavigationService] Successfully navigated to Meeting screen
```

#### Error Indicators
```
[Index] ❌ NotifeeCallHandler failed
[NotifeeCallHandler] Failed to display incoming call
[NavigationService] Navigation failed
```

### Performance Verification

#### Memory Usage
- App should not crash when launched from killed state
- Memory usage should be reasonable
- No memory leaks from notification handlers

#### Battery Impact
- Background processing should be minimal
- No excessive wake locks
- Proper cleanup after call ends

### Comparison with Chat Notifications

Since chat notifications work well, compare:
1. **Notification appearance**: Should be similar reliability
2. **App launch speed**: Should be comparable
3. **Navigation success**: Should work as well as chat
4. **Error handling**: Should be as robust

### Success Criteria

The fix is successful if:
- ✅ Call notifications appear in killed state (like chat notifications)
- ✅ Answer button launches app and connects call
- ✅ Decline button dismisses notification
- ✅ No crashes or errors in killed state scenarios
- ✅ Performance is comparable to chat notifications
- ✅ Works consistently across multiple test runs

### Regression Testing

Ensure existing functionality still works:
- ✅ Foreground call notifications
- ✅ Background call notifications  
- ✅ Chat notifications (should not be affected)
- ✅ Other app functionality
- ✅ CallKeep integration (if enabled)
