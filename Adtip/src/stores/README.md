# Call Store Documentation

## Overview

The Call Store is a centralized Zustand-based state management solution for all call-related functionality in the Adtip application. It provides a single source of truth for call state, replacing the distributed state management across various services and components.

## Architecture

### Core Principles

1. **Single Source of Truth**: All call-related state is managed in one place
2. **Immutable Updates**: All state updates are immutable and atomic
3. **Performance Optimized**: Selective subscriptions prevent unnecessary re-renders
4. **Type Safe**: Full TypeScript support with comprehensive type definitions
5. **Persistent**: Critical state persists across app restarts
6. **Debuggable**: Built-in debugging support with Redux DevTools integration

### Store Structure

```typescript
interface CallStore {
  // Core State
  callStatus: CallStatus;
  activeCall: CallData | null;
  mediaState: MediaState;
  isCallServiceInitialized: boolean;
  
  // UI State
  isNavigatingToMeeting: boolean;
  showParticipants: boolean;
  callDuration: number;
  
  // Computed Properties
  isInCall: boolean;
  isVideoCall: boolean;
  canStartCall: boolean;
  
  // Actions
  startOutgoingCall: (callData) => void;
  endCall: (reason?) => void;
  // ... more actions
}
```

## Usage

### Basic Setup

```typescript
import { useCallStore, useCallActions } from '../stores';

// In a component
const Component = () => {
  const { callStatus, activeCall, isInCall } = useCallStore();
  const { startOutgoingCall, endCall } = useCallActions();
  
  // Component logic
};
```

### Performance Optimized Usage

```typescript
import { useCallStatus, useActiveCall, useMediaProperty } from '../stores';

// Only re-render when call status changes
const callStatus = useCallStatus();

// Only re-render when specific call properties change
const activeCall = useActiveCall(['callId', 'callType', 'callerName']);

// Only re-render when mic state changes
const micEnabled = useMediaProperty('micEnabled');
```

### State Subscriptions

```typescript
import { useCallStatusChange, useCallStart, useCallEnd } from '../stores';

// React to call status changes
useCallStatusChange((newStatus, prevStatus) => {
  console.log(`Call status changed: ${prevStatus} → ${newStatus}`);
});

// React to call start
useCallStart((call) => {
  console.log('Call started:', call);
});

// React to call end
useCallEnd((lastCall, reason) => {
  console.log('Call ended:', lastCall, reason);
});
```

## Call Flow Examples

### Outgoing Call Flow

```typescript
const { startOutgoingCall, setCallStatus, endCall } = useCallActions();

// 1. Start outgoing call
startOutgoingCall({
  callId: 'unique-call-id',
  meetingId: 'meeting-id',
  token: 'videosdk-token',
  callerName: 'John Doe',
  recipientName: 'Jane Smith',
  callType: 'voice',
  callerId: 'caller-id',
  recipientId: 'recipient-id',
  isInitiator: true,
});

// 2. Update status as call progresses
setCallStatus('connecting');
setCallStatus('connected');

// 3. End call when done
endCall('user_ended');
```

### Incoming Call Flow

```typescript
const { setIncomingCall, acceptCall, declineCall } = useCallActions();

// 1. Receive incoming call
setIncomingCall({
  callId: 'incoming-call-id',
  meetingId: 'meeting-id',
  token: 'videosdk-token',
  callerName: 'John Doe',
  recipientName: 'Jane Smith',
  callType: 'video',
  callerId: 'caller-id',
  recipientId: 'recipient-id',
  isInitiator: false,
  status: 'ringing',
  timestamp: Date.now(),
});

// 2. Accept or decline
acceptCall(); // or declineCall('user_declined');
```

### Media Control

```typescript
const { toggleMic, toggleCamera, toggleSpeaker, setMediaState } = useCallActions();

// Individual controls
toggleMic();
toggleCamera();
toggleSpeaker();

// Batch update
setMediaState({
  micEnabled: false,
  cameraEnabled: true,
  speakerEnabled: true,
  isVideoCall: true,
});
```

## Advanced Features

### Call Duration Tracking

```typescript
import { useCallDuration, useFormattedCallDuration } from '../stores';

const duration = useCallDuration(); // Duration in seconds
const formattedDuration = useFormattedCallDuration(); // "01:23" format
```

### Call Validation

```typescript
import { useCallValidation } from '../stores';

const {
  canStartCall,
  canEndCall,
  canAcceptCall,
  canDeclineCall,
  canToggleMedia,
  hasActiveCall,
  isInitialized,
} = useCallValidation();
```

### Error Handling

```typescript
import { useCallError } from '../stores';

const { error, hasError, setError, clearError } = useCallError();

// Errors auto-clear after 5 seconds
if (hasError) {
  console.log('Call error:', error);
}
```

### Call Metrics

```typescript
import { useCallMetricsComputed } from '../stores';

const {
  totalCalls,
  totalDuration,
  averageCallDuration,
  recentCalls,
  callsToday,
  completedCalls,
  missedCalls,
} = useCallMetricsComputed();
```

## State Persistence

The store automatically persists critical state across app restarts:

- `callMetrics`: Call history and statistics
- `isCallServiceInitialized`: Service initialization status
- `lastCallEndReason`: Last call end reason

Transient state like `activeCall` and `callStatus` is not persisted to prevent stale state issues.

## Debugging

### Development Mode

```typescript
import { useCallStateLogger } from '../stores';

// Enable automatic state logging (development only)
useCallStateLogger(true);
```

### Manual Debugging

```typescript
import { logCurrentState, enableStoreDebugging } from '../stores/callStore.test';

// Log current state
logCurrentState();

// Enable continuous debugging
const unsubscribe = enableStoreDebugging();
```

### Redux DevTools

The store integrates with Redux DevTools for advanced debugging:

1. Install Redux DevTools extension
2. Open DevTools
3. Navigate to Redux tab
4. Monitor call state changes in real-time

## Testing

### Unit Tests

```typescript
import { runAllTests } from '../stores/callStore.test';

// Run comprehensive test suite
runAllTests();
```

### Mock Data

```typescript
import { createMockCallData } from '../stores/callStore.test';

const mockCall = createMockCallData({
  callType: 'video',
  callerName: 'Test User',
});
```

## Migration Guide

### From CallProvider

```typescript
// Old
const { activeCall, startCall, endCall } = useCall();

// New
const activeCall = useCallStore((state) => state.activeCall);
const { startOutgoingCall, endCall } = useCallActions();
```

### From UnifiedCallService State

```typescript
// Old
unifiedCallService.callState.isInCall

// New
const isInCall = useCallStore((state) => state.isInCall);
```

### From MediaManager

```typescript
// Old
mediaManager.getMediaState()

// New
const mediaState = useMediaState();
```

## Performance Considerations

### Selective Subscriptions

```typescript
// ❌ Bad - subscribes to entire store
const store = useCallStore();

// ✅ Good - subscribes to specific properties
const { callStatus, isInCall } = useCallStore((state) => ({
  callStatus: state.callStatus,
  isInCall: state.isInCall,
}));
```

### Computed Properties

```typescript
// ✅ Use computed properties for derived state
const isInCall = useCallStore((state) => state.isInCall);
const canStartCall = useCallStore((state) => state.canStartCall);
```

### Action Memoization

```typescript
// ✅ Actions are already memoized in the store
const actions = useCallActions(); // Stable reference
```

## Best Practices

1. **Use Selective Subscriptions**: Only subscribe to the state you need
2. **Leverage Computed Properties**: Use `isInCall`, `canStartCall`, etc.
3. **Use Specialized Hooks**: Prefer `useCallStatus()` over `useCallStore()`
4. **Handle Errors Gracefully**: Always use `useCallError()` for error handling
5. **Test State Transitions**: Use the provided test utilities
6. **Monitor Performance**: Use React DevTools to check for unnecessary re-renders

## Common Patterns

### Navigation Based on Call Status

```typescript
useCallStatusChange((newStatus, prevStatus) => {
  if (newStatus === 'dialing' || newStatus === 'connecting') {
    navigation.navigate('Meeting');
  } else if (newStatus === 'ended' || newStatus === 'idle') {
    navigation.navigate('Home');
  }
});
```

### Media Controls Component

```typescript
const MediaControls = () => {
  const { micEnabled, cameraEnabled, speakerEnabled } = useMediaState();
  const { toggleMic, toggleCamera, toggleSpeaker } = useCallActions();
  
  return (
    <View>
      <TouchableOpacity onPress={toggleMic}>
        <Icon name={micEnabled ? 'mic' : 'mic-off'} />
      </TouchableOpacity>
      <TouchableOpacity onPress={toggleCamera}>
        <Icon name={cameraEnabled ? 'camera' : 'camera-off'} />
      </TouchableOpacity>
      <TouchableOpacity onPress={toggleSpeaker}>
        <Icon name={speakerEnabled ? 'speaker' : 'speaker-off'} />
      </TouchableOpacity>
    </View>
  );
};
```

### Call Timer Component

```typescript
const CallTimer = () => {
  const formattedDuration = useFormattedCallDuration();
  const isInCall = useCallStore((state) => state.isInCall);
  
  if (!isInCall) return null;
  
  return <Text>{formattedDuration}</Text>;
};
```

This documentation covers the complete usage of the Call Store system. The store provides a robust, type-safe, and performant solution for managing call state throughout the application.
