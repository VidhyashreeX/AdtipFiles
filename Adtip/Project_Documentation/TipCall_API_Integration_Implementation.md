# TipCall API Integration Implementation

## Overview

This document describes the production-ready implementation of voice-call and video-call API integration in the TipCall screen. The implementation includes comprehensive safety measures, automatic call ending, and proper error handling to prevent financial losses.

## Key Features Implemented

### 1. API Integration
- **Voice Call APIs**: `/api/voice-call` with start, end, missed actions
- **Video Call APIs**: `/api/video-call` with start, end, missed actions
- **Subscription-based pricing**: Different rates for premium vs non-premium users
- **Real-time balance checking**: Automatic calculation of maximum call duration

### 2. Safety Measures
- **Automatic Call Ending**: Calls are automatically ended after 10 minutes
- **Network Monitoring**: Calls are ended if network connection is lost
- **Health Checks**: Regular monitoring of call status and network connectivity
- **Force End Capability**: Emergency call termination for safety

### 3. Production Ready Features
- **Comprehensive Error Handling**: Graceful handling of all error scenarios
- **User Notifications**: Clear alerts for call status changes
- **Cleanup on Unmount**: Proper resource cleanup when component unmounts
- **Comprehensive Logging**: Detailed logs for debugging and monitoring

## Implementation Details

### 1. Call Manager Service (`CallManagerService.ts`)

#### Key Components:
```typescript
interface CallSession {
  callId: number;
  callerId: number;
  receiverId: number;
  callType: 'voice' | 'video';
  startTime: Date;
  maxDuration: number; // in minutes
  autoEndTimer?: NodeJS.Timeout;
  networkListener?: any;
  healthCheckTimer?: NodeJS.Timeout;
}
```

#### Safety Features:
- **Maximum Call Duration**: 10 minutes (configurable)
- **Network Monitoring**: Real-time network connectivity checks
- **Health Check Interval**: 10-second intervals for call health monitoring
- **Auto-end Timer**: Automatic call termination after max duration

#### Key Methods:
```typescript
// Start voice call with safety measures
async startVoiceCall(callerId: number, receiverId: number): Promise<any>

// Start video call with safety measures  
async startVideoCall(callerId: number, receiverId: number): Promise<any>

// End call safely
async endCall(): Promise<any>

// Force end call (emergency)
async forceEndCall(): Promise<void>

// Record missed call
async recordMissedCall(callerId: number, receiverId: number, callType: 'voice' | 'video'): Promise<any>
```

### 2. API Hooks (`useVideoSDKCall.ts`)

#### Voice Call Hook:
```typescript
export const useVoiceCall = () => {
  const startCall = useCallback(async (callerId: number, receiverId: number) => {
    // API call to /api/voice-call with action: 'start'
  });
  
  const endCall = useCallback(async (callerId: number, receiverId: number, callId: number) => {
    // API call to /api/voice-call with action: 'end'
  });
  
  const missedCall = useCallback(async (callerId: number, receiverId: number) => {
    // API call to /api/voice-call with action: 'missed'
  });
};
```

#### Video Call Hook:
```typescript
export const useVideoCall = () => {
  const startCall = useCallback(async (callerId: number, receiverId: number) => {
    // API call to /api/video-call with action: 'start'
  });
  
  const endCall = useCallback(async (callerId: number, receiverId: number, callId: number) => {
    // API call to /api/video-call with action: 'end'
  });
  
  const missedCall = useCallback(async (callerId: number, receiverId: number) => {
    // API call to /api/video-call with action: 'missed'
  });
};
```

### 3. TipCall Screen Integration

#### Premium Check:
```typescript
// Check premium status first
if (!isPremium) {
  console.log('[TipCall] Non-premium user trying to make call, showing upgrade popup');
  setShowPremiumPopup(true);
  return;
}
```

#### Call Manager Integration:
```typescript
// Check if call manager is initialized
if (!callManager) {
  Alert.alert("Error", "Call service is not ready. Please try again.");
  return;
}

// Check if there's already an active call
if (callManager.hasActiveCall()) {
  Alert.alert("Call In Progress", "You are already in a call. Please end the current call first.");
  return;
}
```

#### Call Initiation:
```typescript
// Start call using the appropriate service
const response = callType === 'voice' 
  ? await callManager.startVoiceCall(user.id, recipient.id)
  : await callManager.startVideoCall(user.id, recipient.id);

if (response.status) {
  console.log('[TipCall] ✅ Call started successfully via CallManagerService:', {
    callId: response.callId,
    maxDuration: response.maxCallLimitTime,
    callType
  });
}
```

## API Endpoints

### 1. Voice Call Endpoints

#### Start Voice Call:
```
POST /api/voice-call
Content-Type: application/json
Authorization: Bearer <token>

{
  "callerId": 123,
  "receiverId": 456,
  "action": "start"
}
```

**Response:**
```json
{
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
```

#### End Voice Call:
```
POST /api/voice-call
Content-Type: application/json
Authorization: Bearer <token>

{
  "callerId": 123,
  "receiverId": 456,
  "action": "end",
  "callId": 12345
}
```

**Response:**
```json
{
  "status": true,
  "statusCode": 200,
  "caller_user_id": 123,
  "caller_user_name": "John Doe",
  "receiver_user_id": 456,
  "receiver_user_name": "Jane Smith",
  "caller_debited_charge": "35.00",
  "receiver_credited_charge": "20.00",
  "total_duration_seconds": 300,
  "available_caller_balance": "465.00",
  "available_receiver_balance": "520.00",
  "message": "VideoSDK call ended, transactions recorded successfully",
  "is_call_ended": true
}
```

#### Missed Voice Call:
```
POST /api/voice-call
Content-Type: application/json
Authorization: Bearer <token>

{
  "callerId": 123,
  "receiverId": 456,
  "action": "missed"
}
```

### 2. Video Call Endpoints

#### Start Video Call:
```
POST /api/video-call
Content-Type: application/json
Authorization: Bearer <token>

{
  "callerId": 123,
  "receiverId": 456,
  "action": "start"
}
```

#### End Video Call:
```
POST /api/video-call
Content-Type: application/json
Authorization: Bearer <token>

{
  "callerId": 123,
  "receiverId": 456,
  "action": "end",
  "callId": 12346
}
```

#### Missed Video Call:
```
POST /api/video-call
Content-Type: application/json
Authorization: Bearer <token>

{
  "callerId": 123,
  "receiverId": 456,
  "action": "missed"
}
```

## Safety Mechanisms

### 1. Automatic Call Ending
- **Timer-based**: Calls automatically end after 10 minutes
- **User Notification**: Alert shown when call reaches time limit
- **API Call**: Automatic end API call made to record transaction

### 2. Network Monitoring
- **Real-time Checks**: Network connectivity monitored every 5 seconds
- **Automatic Termination**: Call ended if network connection lost
- **User Notification**: Alert shown for network disconnection

### 3. Health Checks
- **Regular Monitoring**: Call health checked every 10 seconds
- **Duration Validation**: Ensures call doesn't exceed max duration
- **Network Validation**: Verifies network connectivity

### 4. Force End Capability
- **Emergency Termination**: Immediate call ending for safety
- **API Fallback**: Continues even if API call fails
- **Resource Cleanup**: Proper cleanup of timers and listeners

## Error Handling

### 1. Network Errors
```typescript
if (error.message?.includes('No internet connection')) {
  errorMessage = 'No internet connection available. Please check your network and try again.';
}
```

### 2. API Errors
```typescript
if (error.message?.includes('Failed to start')) {
  errorMessage = error.message;
}
```

### 3. Service Errors
```typescript
if (!callManager) {
  Alert.alert("Error", "Call service is not ready. Please try again.");
  return;
}
```

## User Experience Flow

### For Premium Users:
1. **Call Button Click**: User clicks voice or video call button
2. **Premium Check**: System verifies premium status
3. **Service Check**: Verifies call manager is ready
4. **Active Call Check**: Ensures no existing call
5. **Confirmation Dialog**: Shows call confirmation with safety info
6. **Call Initiation**: Starts call via appropriate API
7. **Success Notification**: Shows call started confirmation
8. **Safety Monitoring**: Automatic monitoring and ending

### For Non-Premium Users:
1. **Call Button Click**: User clicks voice or video call button
2. **Premium Check**: System detects non-premium status
3. **Upgrade Popup**: Shows premium upgrade popup
4. **User Choice**: User can upgrade or cancel

## Testing

### Test File: `Project_TestFiles/tipcall_api_integration_test.js`

The test file includes comprehensive scenarios:
1. Voice Call Start API
2. Voice Call End API
3. Voice Call Missed API
4. Video Call Start API
5. Video Call End API
6. Video Call Missed API
7. Call Manager Safety Features
8. Production Ready Features

### Running Tests:
```bash
node Project_TestFiles/tipcall_api_integration_test.js
```

## Production Considerations

### 1. Financial Safety
- **Automatic Call Ending**: Prevents unlimited call charges
- **Network Monitoring**: Ends calls on connection loss
- **API Fallbacks**: Ensures call ending even if network fails
- **Transaction Recording**: Proper debit/credit operations

### 2. User Experience
- **Clear Notifications**: Users informed of call status changes
- **Graceful Degradation**: App continues working even if call service fails
- **Loading States**: Proper loading indicators during API calls
- **Error Messages**: Clear, actionable error messages

### 3. Performance
- **Efficient Monitoring**: Minimal performance impact from health checks
- **Resource Cleanup**: Proper cleanup prevents memory leaks
- **Lazy Loading**: Services initialized only when needed

### 4. Monitoring
- **Comprehensive Logging**: Detailed logs for debugging
- **Error Tracking**: All errors logged with context
- **Performance Metrics**: Call duration and success rates tracked

## Future Enhancements

### 1. Advanced Features
- **Call Recording**: Optional call recording functionality
- **Call Quality Monitoring**: Real-time call quality metrics
- **Advanced Analytics**: Detailed call analytics and reporting

### 2. Safety Improvements
- **Geographic Restrictions**: Location-based call restrictions
- **Time-based Restrictions**: Call time window limitations
- **Rate Limiting**: Prevent call abuse

### 3. User Experience
- **Call History**: Detailed call history with analytics
- **Call Scheduling**: Schedule calls for later
- **Group Calls**: Multi-party call support

## Conclusion

The TipCall API integration implementation provides a robust, production-ready solution for voice and video calls with comprehensive safety measures. The implementation ensures financial protection through automatic call ending, network monitoring, and proper error handling while delivering a smooth user experience.

Key achievements:
- ✅ Production-ready API integration
- ✅ Comprehensive safety measures
- ✅ Automatic call ending (10-minute limit)
- ✅ Network monitoring and health checks
- ✅ Proper error handling and user notifications
- ✅ Financial protection mechanisms
- ✅ Comprehensive testing suite
- ✅ Detailed documentation

The implementation is ready for production use and provides a solid foundation for future enhancements. 