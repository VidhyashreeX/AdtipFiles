# Reliable Call Flow Implementation

## Overview

This document outlines the new reliable call flow implementation that replaces the previous fragmented FCM handling system. The new system consolidates all call handling into a single, robust service that prevents crashes and ensures consistent behavior.

## Key Problems Solved

### 1. **Multiple FCM Handler Conflicts**
- **Before**: Multiple services (CallController, CallSignalingService, FirebaseService, useFcmCallHandlers) all trying to handle FCM messages
- **After**: Single ReliableCallManager handles all FCM messages

### 2. **Threading Issues**
- **Before**: FCM messages processed on different threads causing React state update crashes
- **After**: All state updates properly queued on main thread using setTimeout

### 3. **Race Conditions**
- **Before**: Multiple services updating call store simultaneously
- **After**: Single source of truth with proper concurrency control

### 4. **Notification Conflicts**
- **Before**: Both native Android service and React Native Notifee showing notifications
- **After**: Coordinated notification display with fallback handling

### 5. **Incomplete Error Handling**
- **Before**: Unhandled promise rejections causing app crashes
- **After**: Comprehensive try-catch blocks with graceful error handling

## Architecture

### ReliableCallManager
The central service that handles all call-related functionality:

```typescript
class ReliableCallManager {
  // Singleton pattern for single source of truth
  static getInstance(): ReliableCallManager
  
  // Lifecycle management
  async initialize(): Promise<void>
  destroy(): void
  
  // FCM message handling
  async handleFCMMessage(message, context): Promise<void>
  
  // Call actions
  async acceptCall(): Promise<boolean>
  async endCall(): Promise<boolean>
  
  // State management
  getCurrentSession(): CallSession | null
  isReady(): boolean
}
```

### Key Features

1. **Thread-Safe State Updates**
   ```typescript
   // All state updates are queued on main thread
   setTimeout(() => {
     const store = useCallStore.getState()
     store.actions.setSession(session)
     store.actions.setStatus(status)
   }, 0)
   ```

2. **Concurrency Control**
   ```typescript
   // Prevents concurrent message processing
   if (this.processingMessage) {
     setTimeout(() => this.handleFCMMessage(remoteMessage, context), 100)
     return
   }
   ```

3. **Comprehensive Error Handling**
   ```typescript
   try {
     // Process FCM message
   } catch (error) {
     console.error('Error:', error)
     // Don't throw - just log to prevent app crashes
   } finally {
     this.processingMessage = false
   }
   ```

4. **Fallback Notification System**
   ```typescript
   // Primary notification
   await notifee.displayNotification(...)
   
   // If primary fails, show fallback
   catch (error) {
     await this.showFallbackNotification(session)
   }
   ```

## Implementation Details

### 1. FCM Message Flow

```
FCM Message Received
        ↓
ReliableCallManager.handleFCMMessage()
        ↓
Check message type (CALL_INITIATE/CALL_ACCEPT/CALL_END)
        ↓
Process message with error handling
        ↓
Update call store on main thread
        ↓
Show/hide notifications as needed
        ↓
Navigate to appropriate screen
```

### 2. Notification Strategy

1. **Incoming Calls**: Full-screen notification with Answer/Decline actions
2. **Ongoing Calls**: Persistent notification with End action
3. **Fallback**: Basic notification if primary fails
4. **Cleanup**: All notifications properly cancelled on call end

### 3. State Management

- Single call session stored in ReliableCallManager
- Call store updated through controlled interface
- Comprehensive cleanup on call end
- Emergency cleanup for error scenarios

## Files Modified

### New Files
- `src/services/calling/ReliableCallManager.ts` - Main call management service
- `src/hooks/useReliableCallManager.ts` - React hook for initialization
- `src/test/ReliableCallManagerTest.ts` - Test utilities

### Modified Files
- `index.js` - Updated background FCM handler
- `App.tsx` - Replaced useFcmCallHandlers with useReliableCallManager
- `src/services/FirebaseService.ts` - Disabled old FCM handlers
- `src/services/calling/CallSignalingService.ts` - Disabled FCM listener

## Usage

### Initialization
The ReliableCallManager is automatically initialized when the app starts:

```typescript
// In App.tsx
import useReliableCallManager from './src/hooks/useReliableCallManager'

function App() {
  useReliableCallManager() // Initializes the manager
  // ... rest of app
}
```

### Background Handling
Background FCM messages are handled in index.js:

```typescript
messaging().setBackgroundMessageHandler(async remoteMessage => {
  const callManager = ReliableCallManager.getInstance()
  if (!callManager.isReady()) {
    await callManager.initialize()
  }
  await callManager.handleFCMMessage(remoteMessage, 'background')
})
```

## FCM Message Format

The ReliableCallManager handles both the actual FCM message format and legacy formats:

### Actual Format (Current)
```json
{
  "data": {
    "info": "{\"callerInfo\":{\"name\":\"Test Caller\",\"token\":\"fcm-token-123\"},\"videoSDKInfo\":{\"meetingId\":\"meeting-123\",\"token\":\"videosdk-token-123\",\"callType\":\"video\"},\"type\":\"CALL_INITIATED\",\"uuid\":\"test-uuid-123\"}"
  }
}
```

### Legacy Format (Fallback)
```json
{
  "data": {
    "type": "CALL_INITIATE",
    "sessionId": "test-123",
    "callerName": "Test Caller",
    "callType": "voice",
    "meetingId": "meeting-123",
    "token": "token-123",
    "callerId": "caller-123"
  }
}
```

## Testing

Run the test suite to verify functionality:

```typescript
import { runAllTests } from './src/test/ReliableCallManagerTest'

// Run all tests
await runAllTests()
```

## Benefits

1. **Crash Prevention**: Comprehensive error handling prevents app crashes
2. **Reliability**: Single source of truth eliminates race conditions
3. **Performance**: Efficient message processing with concurrency control
4. **Maintainability**: Centralized call logic easier to debug and modify
5. **Scalability**: Clean architecture supports future enhancements

## Migration Notes

The new system is designed to be a drop-in replacement. No changes are needed to existing call UI components or navigation logic. The ReliableCallManager handles all the complexity internally while maintaining the same external interface.

## Monitoring

The system includes comprehensive logging for debugging:

- `[ReliableCallManager]` - Main service logs
- `[useReliableCallManager]` - Hook initialization logs
- `[Test]` - Test execution logs

Monitor these logs to ensure proper operation and identify any issues.
