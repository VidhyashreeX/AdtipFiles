# Console Log Examples for TipCall API Integration

## Voice Call Flow - Console Logs

### 1. User clicks Voice Call button
```
🚫 [TipCall] Non-premium user trying to make call, showing upgrade popup
```
*OR*
```
✅ [TipCall] Premium user verified, proceeding with call
✅ [TipCall] Call manager initialized and ready
✅ [TipCall] No active calls, proceeding with new call
📞 [TipCall] Showing call confirmation dialog for: {
  recipient: "John Doe",
  callType: "voice",
  userBalance: "500.00"
}
```

### 2. User confirms call
```
🚀 [TipCall] Starting call via CallManagerService... {
  recipient: "John Doe",
  callType: "voice",
  callerId: 123,
  receiverId: 456
}
📡 [TipCall] Making API call to start call...
📞 [CallManagerService] Starting voice call... { callerId: 123, receiverId: 456 }
🌐 [CallManagerService] Network check passed, proceeding with API call
📡 [CallManagerService] Making API request to /api/voice-call
📤 [CallManagerService] Request payload: {
  callerId: 123,
  receiverId: 456,
  action: "start"
}
📥 [CallManagerService] API Response received: {
  "status": true,
  "statusCode": 200,
  "is_call_ended": false,
  "startTime": "2024-01-15 10:30:00",
  "maxCallLimitTime": 10,
  "maxCallLimitDateTime": "2024-01-15 10:40:00",
  "callId": 12345,
  "duration_seconds": 600,
  "caller_charge_per_minute": 7,
  "caller_balance": 500.00,
  "caller_subscription_status": {
    "hasActiveSubscription": true,
    "planName": "Premium - 1 Month",
    "amount": 200,
    "isPremium": true
  },
  "message": "VideoSDK call started successfully"
}
✅ [CallManagerService] Voice call started successfully {
  callId: 12345,
  maxDuration: 10,
  startTime: "2024-01-15T10:30:00.000Z",
  callType: "voice"
}
🎯 [CallManagerService] Call session created: {
  sessionId: 12345,
  duration: "10 minutes",
  autoEndTime: "2024-01-15T10:40:00.000Z"
}
📥 [TipCall] CallManagerService response received: {
  "status": true,
  "statusCode": 200,
  "is_call_ended": false,
  "startTime": "2024-01-15 10:30:00",
  "maxCallLimitTime": 10,
  "maxCallLimitDateTime": "2024-01-15 10:40:00",
  "callId": 12345,
  "duration_seconds": 600,
  "caller_charge_per_minute": 7,
  "caller_balance": 500.00,
  "caller_subscription_status": {
    "hasActiveSubscription": true,
    "planName": "Premium - 1 Month",
    "amount": 200,
    "isPremium": true
  },
  "message": "VideoSDK call started successfully"
}
✅ [TipCall] Call started successfully via CallManagerService: {
  callId: 12345,
  maxDuration: 10,
  callType: "voice",
  startTime: "2024-01-15 10:30:00",
  chargePerMinute: 7,
  userBalance: 500.00
}
```

### 3. During call (health checks)
```
[CallManagerService] Call health check passed, remaining time: 540 seconds
[CallManagerService] Call health check passed, remaining time: 530 seconds
[CallManagerService] Call health check passed, remaining time: 520 seconds
...
```

### 4. Call ends (manual or automatic)
```
🔚 [CallManagerService] Ending call... {
  callId: 12345,
  callType: "voice",
  duration: 300
}
📡 [CallManagerService] Making API request to end call
📤 [CallManagerService] Request payload: {
  callerId: 123,
  receiverId: 456,
  action: "end",
  callId: 12345
}
📥 [CallManagerService] End call API Response: {
  "status": true,
  "statusCode": 200,
  "caller_user_id": 123,
  "caller_user_name": "Caller Name",
  "receiver_user_id": 456,
  "receiver_user_name": "John Doe",
  "caller_debited_charge": "35.00",
  "receiver_credited_charge": "20.00",
  "total_duration_seconds": 300,
  "available_caller_balance": "465.00",
  "available_receiver_balance": "520.00",
  "message": "VideoSDK call ended, transactions recorded successfully",
  "is_call_ended": true
}
✅ [CallManagerService] Call ended successfully
```

### 5. Missed call (if call is not answered)
```
📞 [CallManagerService] Recording missed call... {
  callerId: 123,
  receiverId: 456,
  callType: "voice"
}
📡 [CallManagerService] Making API request for missed call
📤 [CallManagerService] Request payload: {
  callerId: 123,
  receiverId: 456,
  action: "missed"
}
📥 [CallManagerService] Missed call API Response: {
  "status": true,
  "statusCode": 200,
  "message": "Missed VideoSDK call recorded successfully"
}
✅ [CallManagerService] Missed call recorded successfully
```

---

## Video Call Flow - Console Logs

### 1. User clicks Video Call button
```
✅ [TipCall] Premium user verified, proceeding with call
✅ [TipCall] Call manager initialized and ready
✅ [TipCall] No active calls, proceeding with new call
📞 [TipCall] Showing call confirmation dialog for: {
  recipient: "Jane Smith",
  callType: "video",
  userBalance: "500.00"
}
```

### 2. User confirms call
```
🚀 [TipCall] Starting call via CallManagerService... {
  recipient: "Jane Smith",
  callType: "video",
  callerId: 123,
  receiverId: 789
}
📡 [TipCall] Making API call to start call...
📹 [CallManagerService] Starting video call... { callerId: 123, receiverId: 789 }
🌐 [CallManagerService] Network check passed, proceeding with API call
📡 [CallManagerService] Making API request to /api/video-call
📤 [CallManagerService] Request payload: {
  callerId: 123,
  receiverId: 789,
  action: "start"
}
📥 [CallManagerService] API Response received: {
  "status": true,
  "statusCode": 200,
  "is_call_ended": false,
  "startTime": "2024-01-15 10:30:00",
  "maxCallLimitTime": 10,
  "maxCallLimitDateTime": "2024-01-15 10:40:00",
  "callId": 12346,
  "duration_seconds": 600,
  "caller_charge_per_minute": 10,
  "caller_balance": 500.00,
  "caller_subscription_status": {
    "hasActiveSubscription": true,
    "planName": "Premium - 1 Month",
    "amount": 200,
    "isPremium": true
  },
  "message": "Video call started successfully"
}
✅ [CallManagerService] Video call started successfully {
  callId: 12346,
  maxDuration: 10,
  startTime: "2024-01-15T10:30:00.000Z",
  callType: "video"
}
🎯 [CallManagerService] Call session created: {
  sessionId: 12346,
  duration: "10 minutes",
  autoEndTime: "2024-01-15T10:40:00.000Z"
}
📥 [TipCall] CallManagerService response received: {
  "status": true,
  "statusCode": 200,
  "is_call_ended": false,
  "startTime": "2024-01-15 10:30:00",
  "maxCallLimitTime": 10,
  "maxCallLimitDateTime": "2024-01-15 10:40:00",
  "callId": 12346,
  "duration_seconds": 600,
  "caller_charge_per_minute": 10,
  "caller_balance": 500.00,
  "caller_subscription_status": {
    "hasActiveSubscription": true,
    "planName": "Premium - 1 Month",
    "amount": 200,
    "isPremium": true
  },
  "message": "Video call started successfully"
}
✅ [TipCall] Call started successfully via CallManagerService: {
  callId: 12346,
  maxDuration: 10,
  callType: "video",
  startTime: "2024-01-15 10:30:00",
  chargePerMinute: 10,
  userBalance: 500.00
}
```

### 3. During call (health checks)
```
[CallManagerService] Call health check passed, remaining time: 540 seconds
[CallManagerService] Call health check passed, remaining time: 530 seconds
[CallManagerService] Call health check passed, remaining time: 520 seconds
...
```

### 4. Call ends (manual or automatic)
```
🔚 [CallManagerService] Ending call... {
  callId: 12346,
  callType: "video",
  duration: 300
}
📡 [CallManagerService] Making API request to end call
📤 [CallManagerService] Request payload: {
  callerId: 123,
  receiverId: 789,
  action: "end",
  callId: 12346
}
📥 [CallManagerService] End call API Response: {
  "status": true,
  "statusCode": 200,
  "caller_user_id": 123,
  "caller_user_name": "Caller Name",
  "receiver_user_id": 789,
  "receiver_user_name": "Jane Smith",
  "caller_debited_charge": "50.00",
  "receiver_credited_charge": "30.00",
  "total_duration_seconds": 300,
  "available_caller_balance": "450.00",
  "available_receiver_balance": "530.00",
  "message": "Video call ended, transactions recorded successfully",
  "is_call_ended": true
}
✅ [CallManagerService] Call ended successfully
```

### 5. Missed video call
```
📞 [CallManagerService] Recording missed call... {
  callerId: 123,
  receiverId: 789,
  callType: "video"
}
📡 [CallManagerService] Making API request for missed call
📤 [CallManagerService] Request payload: {
  callerId: 123,
  receiverId: 789,
  action: "missed"
}
📥 [CallManagerService] Missed call API Response: {
  "status": true,
  "statusCode": 200,
  "message": "Missed video call recorded successfully"
}
✅ [CallManagerService] Missed call recorded successfully
```

---

## Error Scenarios - Console Logs

### Network Error
```
❌ [TipCall] Error starting call: Error: No internet connection available
❌ [TipCall] Error starting call: Error: Network error. Please check your connection and try again.
```

### Service Not Ready
```
❌ [TipCall] Call manager not initialized
```

### Already in Call
```
⚠️ [TipCall] User already has an active call
```

### Non-Premium User
```
🚫 [TipCall] Non-premium user trying to make call, showing upgrade popup
```

### API Error
```
❌ [TipCall] Error starting call: Error: Failed to start call: Insufficient balance
❌ [TipCall] Error starting call: Error: Failed to start call: User not found
```

---

## Safety Features - Console Logs

### Auto-end Timer Triggered
```
[CallManagerService] Auto-ending call due to max duration reached
🔚 [CallManagerService] Ending call... {
  callId: 12345,
  callType: "voice",
  duration: 0
}
```

### Network Disconnection
```
[CallManagerService] Network disconnected, ending call for safety
🔚 [CallManagerService] Ending call... {
  callId: 12345,
  callType: "voice",
  duration: 180
}
```

### Health Check Failed
```
[CallManagerService] Network check failed, ending call
[CallManagerService] Call duration exceeded, ending call
```

---

## Summary

These console logs provide complete visibility into:

1. **API Requests**: All request payloads sent to `/api/voice-call` and `/api/video-call`
2. **API Responses**: Complete response data from the server
3. **Call Flow**: Step-by-step progression through the call lifecycle
4. **Error Handling**: Detailed error messages and handling
5. **Safety Features**: Network monitoring, auto-ending, and health checks
6. **Financial Data**: Charges, balances, and transaction details
7. **Session Management**: Call IDs, durations, and timing information

The logs use emojis and clear prefixes to make them easy to identify and filter in the console. 