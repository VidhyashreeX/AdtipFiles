# FCM Foreground Message Handling - Test Scenarios

## Test 1: Normal Incoming Call (Foreground)

**Scenario**: App is in foreground, receives FCM message for incoming call

**Expected Behavior**:
1. ✅ App does not crash
2. ✅ Notifee notification appears with Answer/Decline buttons
3. ✅ User can tap Answer to join the call
4. ✅ Navigation goes to MeetingScreen with correct meetingId/token
5. ✅ Call connects successfully

**FCM Message Format**:
```json
{
  "data": {
    "type": "INCOMING_CALL",
    "isIncomingCall": "true",
    "callId": "call_123456",
    "meetingId": "meeting_789",
    "token": "videosdk_token_abc",
    "callerName": "John Doe",
    "callerId": "user_456",
    "callType": "video"
  }
}
```

## Test 2: Malformed FCM Message

**Scenario**: App receives FCM message with missing or invalid data

**Expected Behavior**:
1. ✅ App does not crash
2. ✅ Fallback notification handler activates
3. ✅ Basic notification shown with default values
4. ✅ Error logged but app continues running

**FCM Message Format** (malformed):
```json
{
  "data": {
    "type": "INCOMING_CALL",
    "callerName": null,
    "meetingId": "",
    "token": undefined
  }
}
```

## Test 3: Handler Exception

**Scenario**: Primary handler throws exception during processing

**Expected Behavior**:
1. ✅ App does not crash
2. ✅ Exception caught and logged
3. ✅ Fallback handler shows basic notification
4. ✅ User can still answer the call

## Test 4: Network Failure

**Scenario**: Network failure during FCM message processing

**Expected Behavior**:
1. ✅ App does not crash
2. ✅ Timeout handled gracefully
3. ✅ Basic notification shown as fallback
4. ✅ User alerted about incoming call

## Test 5: Call Answering Flow

**Scenario**: User taps "Answer" on foreground notification

**Expected Flow**:
1. ✅ Notification action triggers `accept_call`
2. ✅ WhatsAppCallManager.acceptCall() called
3. ✅ Navigation to MeetingScreen with params:
   ```typescript
   {
     meetingId: "meeting_789",
     token: "videosdk_token_abc", 
     callType: "video",
     displayName: "Current User",
     recipientName: "John Doe",
     isInitiator: false
   }
   ```
4. ✅ VideoSDK joins meeting successfully
5. ✅ Call state synchronized

## Test 6: Multiple Rapid FCM Messages

**Scenario**: Multiple FCM messages received in quick succession

**Expected Behavior**:
1. ✅ App does not crash
2. ✅ Each message processed independently
3. ✅ No race conditions or duplicate notifications
4. ✅ Latest call notification takes precedence

## Test 7: App State Changes During Processing

**Scenario**: App moves to background while processing FCM message

**Expected Behavior**:
1. ✅ Processing continues uninterrupted
2. ✅ Notification shown correctly
3. ✅ App state transition handled gracefully
4. ✅ User can return to call via notification

## Verification Commands

```bash
# Run verification script
cd c:\A2\adtip-reactnative\Adtip
node whatsapp_calling_verification.js

# Check for compilation errors
npm run typecheck

# Test notification permissions
npm run android
# or
npm run ios
```

## Debug Logging

When testing, look for these log messages:

```
[CallNotificationHandler] Processing foreground FCM message
[CallNotificationHandler] Incoming call detected in foreground  
[CallNotificationHandler] Showing foreground call notification
[WhatsAppCallManager] Accepting call: call_123456
[WhatsAppCallManager] Navigating to meeting screen: {...}
```

## Edge Cases Covered

1. ✅ Null/undefined FCM message
2. ✅ Missing required fields (meetingId, token)
3. ✅ Invalid data types in FCM message
4. ✅ Handler exceptions at any level
5. ✅ Network timeouts and failures
6. ✅ Notification service failures
7. ✅ Multiple simultaneous calls
8. ✅ Rapid app state changes

## Success Criteria

✅ **Zero Crashes**: App never crashes from FCM messages  
✅ **Never Miss Calls**: All incoming calls show notifications  
✅ **Correct Navigation**: Answer always joins right meeting  
✅ **Graceful Degradation**: Fallbacks work when primary fails  
✅ **Consistent UX**: Same behavior across all scenarios  

This comprehensive test suite ensures the FCM foreground handling is bulletproof and production-ready.
