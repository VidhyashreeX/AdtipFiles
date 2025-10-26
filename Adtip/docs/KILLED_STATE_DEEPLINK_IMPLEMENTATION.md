# Killed State Deeplink Implementation

## Overview

This implementation provides robust deeplink functionality that works perfectly when the app is in a killed state, specifically for incoming call scenarios. The FCM message automatically wakes up all necessary services required for the calling feature.

## Architecture Components

### 1. Service Orchestrator (`KilledStateServiceOrchestrator.ts`)

**Purpose**: Central service that manages the initialization sequence of all required services when the app is woken up from killed state by FCM.

**Key Features**:
- Coordinated service initialization with dependency management
- Performance monitoring and metrics collection
- Error handling and recovery mechanisms
- Service readiness validation

**Service Initialization Order**:
1. Firebase Service (< 5 seconds)
2. VideoSDK Service (< 8 seconds) 
3. VideoSDK Pre-warming (parallel, non-blocking)
4. DeepLink Service (< 2 seconds)
5. Critical services verification
6. VideoSDK WebSocket readiness check

### 2. Enhanced FCM Background Handler (`index.js`)

**Purpose**: Improved background message handler that uses the Service Orchestrator for killed state scenarios.

**Key Improvements**:
- Service orchestration integration
- Performance metrics tracking
- Enhanced error handling with multiple fallback layers
- Emergency notification display as last resort

**Processing Flow**:
1. Parse FCM message and extract call data
2. Initialize Service Orchestrator
3. Wake up all required services
4. Display call notification
5. Log performance metrics

### 3. VideoSDK Cold Start Optimization (`VideoSDKService.ts`)

**Purpose**: Enhanced VideoSDK initialization for cold start scenarios with pre-warming and faster initialization paths.

**Optimizations**:
- Cold start detection and fast initialization path
- Aggressive WebSocket connection with reduced timeouts
- Fast connectivity validation (2 seconds vs 8 seconds)
- Fallback to regular initialization if fast path fails

**Performance Targets**:
- Cold start initialization: < 3 seconds
- Regular initialization: < 5 seconds
- WebSocket readiness: < 2 seconds

### 4. Enhanced DeepLink Navigation (`DeepLinkService.ts`)

**Purpose**: Improved deep link handling for killed state scenarios with proper timing and service readiness checks.

**Features**:
- Call-specific deep link handling
- Service readiness validation before navigation
- VideoSDK readiness checks for call screens
- Fallback navigation with extended delays

**Navigation Flow**:
1. Detect call-related deep links
2. Check Service Orchestrator readiness
3. Wait for VideoSDK initialization
4. Add stability delay for killed state
5. Navigate to call screen

### 5. Performance Monitoring (`KilledStatePerformanceMonitor.ts`)

**Purpose**: Comprehensive performance tracking for cold start times, service initialization durations, and navigation timing.

**Metrics Tracked**:
- Total wake-up time
- Individual service initialization times
- Success/failure rates
- Navigation completion time
- Device and network context

**Performance Thresholds**:
- Excellent wake-up: < 2 seconds
- Good wake-up: < 5 seconds
- Poor wake-up: > 10 seconds

### 6. Error Handling (`KilledStateErrorHandler.ts`)

**Purpose**: Robust error handling and fallback mechanisms for various edge cases.

**Error Types Handled**:
- Network connectivity issues
- Permission problems
- Service initialization failures
- Resource constraints (memory, battery)
- Timeout errors

**Recovery Strategies**:
- Automatic retry with exponential backoff
- Service-specific recovery actions
- Error escalation and final fallbacks
- User notification for critical failures

### 7. Testing Utilities (`KilledStateTestingUtils.ts`)

**Purpose**: Comprehensive testing framework for validating killed state functionality.

**Test Scenarios**:
- Optimal conditions (voice/video)
- Poor network conditions
- Low memory scenarios
- Worst case combinations

**Validation Metrics**:
- Success rates
- Performance grades
- Service initialization times
- Error frequency analysis

## Implementation Details

### FCM Message Structure

The system expects FCM messages with the following structure:

```json
{
  "data": {
    "info": "{
      \"callerInfo\": {
        \"name\": \"Caller Name\",
        \"id\": \"caller_id\"
      },
      \"videoSDKInfo\": {
        \"meetingId\": \"meeting_id\",
        \"token\": \"videosdk_token\",
        \"callType\": \"video\"
      },
      \"type\": \"CALL_INITIATED\",
      \"uuid\": \"session_id\"
    }"
  }
}
```

### Deep Link URL Patterns

- Meeting: `/call/:meetingId`
- MeetingSimple: `/call/simple/:sessionId`

### Service Dependencies

1. **Firebase Service**: FCM message handling and authentication
2. **VideoSDK Service**: Core video calling functionality with WebSocket
3. **VideoSDK Pre-warming**: WebSocket connection optimization
4. **DeepLink Service**: Navigation and routing
5. **Notification Service**: Custom call notifications

### Performance Targets

| Metric | Excellent | Good | Poor |
|--------|-----------|------|------|
| Total Wake-up | < 2s | < 5s | > 10s |
| Firebase Init | < 3s | < 5s | > 5s |
| VideoSDK Init | < 5s | < 8s | > 8s |
| Navigation | < 1s | < 3s | > 5s |

## Usage

### Basic Integration

```typescript
// In App.tsx - Initialize orchestrator
import { KilledStateServiceOrchestrator } from './src/services/KilledStateServiceOrchestrator';

const orchestrator = KilledStateServiceOrchestrator.getInstance();
await orchestrator.initialize();
```

### Testing

```typescript
// Run comprehensive test suite
import { KilledStateTestingUtils } from './src/utils/KilledStateTestingUtils';

const testUtils = KilledStateTestingUtils.getInstance();
const results = await testUtils.runTestSuite();
console.log('Test Results:', results);
```

### Performance Monitoring

```typescript
// Get performance analytics
import { KilledStatePerformanceMonitor } from './src/services/KilledStatePerformanceMonitor';

const monitor = KilledStatePerformanceMonitor.getInstance();
const analytics = monitor.getAnalytics(10); // Last 10 sessions
console.log('Performance Analytics:', analytics);
```

## Error Handling

The system implements multiple layers of error handling:

1. **Service-level retries**: Each service has its own retry logic
2. **Orchestrator-level recovery**: Cross-service error handling
3. **FCM handler fallbacks**: Multiple notification display methods
4. **Emergency fallbacks**: Basic notification as last resort

## Platform-Specific Considerations

### Android

- **Manifest Configuration**: Proper notification channels and foreground services
- **Background Processing**: Headless JS for killed state handling
- **Battery Optimization**: Handling Doze mode and app standby
- **Permissions**: Notification and overlay permissions

### iOS

- **App Delegate**: Universal links and VoIP push handling
- **Background App Refresh**: Proper background processing setup
- **Notification Extensions**: UNNotificationServiceExtension for rich notifications
- **CallKit Integration**: Native call interface (if enabled)

## Monitoring and Analytics

The implementation includes comprehensive monitoring:

- **Performance Metrics**: Service initialization times and success rates
- **Error Tracking**: Detailed error classification and recovery attempts
- **User Experience**: Navigation timing and call setup success
- **Device Context**: Memory, network, and battery conditions

## Troubleshooting

### Common Issues

1. **Slow Wake-up Times**
   - Check VideoSDK WebSocket connectivity
   - Verify network conditions
   - Review service initialization order

2. **Service Initialization Failures**
   - Check Firebase configuration
   - Verify VideoSDK API keys
   - Review permission settings

3. **Navigation Issues**
   - Ensure deep link URL patterns are correct
   - Check navigation timing and delays
   - Verify app state during navigation

### Debug Tools

- Performance monitor analytics
- Error handler statistics
- Testing utilities for scenario validation
- Comprehensive logging throughout the system

## Future Enhancements

1. **Machine Learning**: Predictive service pre-warming based on usage patterns
2. **Advanced Caching**: Intelligent service state caching
3. **Network Optimization**: Adaptive timeouts based on connection quality
4. **User Behavior Analytics**: Call acceptance patterns and optimization
5. **Cross-Platform Optimization**: Platform-specific performance tuning
