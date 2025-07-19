# VideoSDK CallKeep Integration - Comprehensive Implementation Plan

## Executive Summary

This document outlines a systematic approach to implement a comprehensive incoming call handling system for the React Native video calling app following VideoSDK CallKeep integration best practices. The implementation will enhance the existing system by consolidating FCM handlers, removing custom call UI interference, and implementing proper deep linking for seamless call handling across all app states.

## Current Implementation Analysis

### Strengths ✅
1. **CallKeep Integration**: Robust CallKeepService with proper initialization
2. **Background Handling**: BackgroundCallHandler and headless JS tasks implemented
3. **VideoSDK Integration**: Comprehensive VideoSDK integration with meeting management
4. **State Management**: CallStateManager prevents race conditions
5. **Deep Linking**: Extensive deep linking configuration exists

### Critical Issues ❌
1. **Multiple Competing FCM Handlers**: 5+ different FCM handlers causing conflicts
   - ReliableCallManager, CallController, FCMChatService, useFcmCallHandlers, FirebaseService
2. **Background Message Handler Conflicts**: Multiple background handlers competing
3. **Custom Call UI Interference**: Both CallKeep and custom notifications showing simultaneously
4. **Complex Navigation**: Multiple navigation paths causing confusion
5. **Incomplete Call Deep Linking**: Missing proper call-specific deep linking routes

## Implementation Phases

### Phase 1: Analysis and Planning ✅ (Current)
**Objective**: Comprehensive analysis and detailed planning
**Duration**: 1 day
**Status**: IN_PROGRESS

#### Tasks:
- [x] Analyze current implementation architecture
- [x] Identify critical issues and conflicts
- [x] Research VideoSDK CallKeep integration best practices
- [x] Create detailed implementation plan
- [ ] Document FCM payload structures
- [ ] Map current navigation flows

### Phase 2: Background Processing Enhancement
**Objective**: Implement proper headless JS tasks and background services
**Duration**: 2-3 days

#### Key Improvements:
1. **Consolidate FCM Handlers**
   - Create single FCMMessageRouter
   - Remove competing handlers
   - Implement proper message routing

2. **Enhanced Background Processing**
   - Improve headless JS task implementation
   - Add proper background service management
   - Implement call state persistence

3. **Background Call Recovery**
   - Add call state recovery mechanisms
   - Implement proper app state transitions
   - Handle killed app scenarios

#### Files to Modify:
- `index.js` - Consolidate background handlers
- `src/services/calling/FCMMessageRouter.ts` - New centralized router
- `src/services/calling/BackgroundCallHandler.ts` - Enhanced background handling
- `src/services/calling/CallStateManager.ts` - Improved state management

### Phase 3: CallKeep Integration Optimization
**Objective**: Optimize CallKeep integration and remove custom UI interference
**Duration**: 2-3 days

#### Key Improvements:
1. **Remove Custom Call UI Interference**
   - Disable custom notifications when CallKeep is active
   - Remove competing call overlays
   - Streamline call UI flow

2. **Enhanced CallKeep Configuration**
   - Optimize CallKeep setup following VideoSDK guidelines
   - Improve error handling and fallbacks
   - Add proper permission management

3. **Native Call UI Priority**
   - Prioritize CallKeep native UI
   - Add fallback to custom UI only when CallKeep unavailable
   - Implement proper UI state management

#### Files to Modify:
- `src/services/calling/CallKeepService.ts` - Enhanced configuration
- `src/services/calling/NotificationService.ts` - Remove interference
- `src/components/call/IncomingCallOverlay.tsx` - Conditional rendering
- `src/services/calling/CallController.ts` - Streamlined flow

### Phase 4: Deep Linking and Navigation Enhancement
**Objective**: Implement proper deep linking routes for FCM payload data
**Duration**: 1-2 days

#### Key Improvements:
1. **Call-Specific Deep Linking**
   - Add call-specific deep link routes
   - Implement FCM payload to deep link conversion
   - Handle call acceptance from killed app state

2. **Enhanced Navigation Flow**
   - Simplify navigation paths
   - Add proper call screen routing
   - Implement seamless transitions

3. **FCM Payload Integration**
   - Enhance FCM payload structure
   - Add call metadata to deep links
   - Implement proper parameter parsing

#### Files to Modify:
- `src/config/deepLinkConfig.ts` - Add call routes
- `src/navigation/MainNavigator.tsx` - Enhanced routing
- `src/services/calling/CallController.ts` - Deep link integration
- Backend FCM payload structure

### Phase 5: Testing and Validation
**Objective**: Comprehensive testing across all app states
**Duration**: 2-3 days

#### Testing Scenarios:
1. **App State Testing**
   - Foreground call handling
   - Background call handling
   - Killed app call handling
   - Screen locked scenarios

2. **Call Flow Testing**
   - Incoming call acceptance
   - Incoming call rejection
   - Outgoing call initiation
   - Call termination

3. **Integration Testing**
   - VideoSDK integration
   - FCM notification delivery
   - Deep linking navigation
   - CallKeep native UI

4. **Edge Case Testing**
   - Network connectivity issues
   - Permission denied scenarios
   - Multiple simultaneous calls
   - App crash recovery

## Technical Implementation Details

### FCM Message Router Architecture
```typescript
interface FCMMessage {
  type: 'call' | 'chat' | 'notification';
  subtype?: 'incoming_call' | 'call_accepted' | 'call_rejected';
  payload: any;
}

class FCMMessageRouter {
  static route(message: FCMMessage) {
    switch (message.type) {
      case 'call':
        return CallHandler.handle(message);
      case 'chat':
        return ChatHandler.handle(message);
      default:
        return NotificationHandler.handle(message);
    }
  }
}
```

### Enhanced Deep Linking Structure
```typescript
const CALL_ROUTES = {
  INCOMING_CALL: '/call/incoming/:sessionId/:token/:meetingId',
  OUTGOING_CALL: '/call/outgoing/:sessionId/:token/:meetingId',
  CALL_SCREEN: '/call/active/:sessionId/:token/:meetingId',
};
```

### CallKeep Integration Flow
1. FCM message received → FCMMessageRouter
2. Router identifies call message → CallHandler
3. CallHandler displays CallKeep native UI
4. User accepts → Deep link navigation
5. App launches → Call screen with VideoSDK

## Success Metrics

1. **Call Success Rate**: >95% successful call connections
2. **Background Call Handling**: 100% reliability in background/killed states
3. **Native UI Priority**: CallKeep UI shown in >90% of scenarios
4. **Navigation Success**: <2 second navigation to call screen
5. **FCM Delivery**: >98% FCM message delivery rate

## Risk Mitigation

1. **Backward Compatibility**: Maintain fallback to current system
2. **Gradual Rollout**: Phase-wise implementation with testing
3. **Monitoring**: Comprehensive logging and error tracking
4. **Rollback Plan**: Quick rollback mechanism if issues arise

## FCM Payload Analysis

### Current Call FCM Payload Structure
```json
{
  "data": {
    "type": "CALL_INITIATED",
    "callType": "video",
    "callerName": "John Doe",
    "callerId": "123",
    "receiverId": "456",
    "callId": "789",
    "sessionId": "session-123",
    "meetingId": "meeting-456",
    "token": "videosdk-token",
    "maxDuration": "3600",
    "timestamp": "1642678800000",
    "uuid": "unique-call-uuid",
    "platform": "android"
  }
}
```

### Legacy FCM Format (Fallback)
```json
{
  "data": {
    "info": "{\"callerInfo\":{\"name\":\"Test Caller\",\"token\":\"fcm-token-123\"},\"videoSDKInfo\":{\"meetingId\":\"meeting-123\",\"token\":\"videosdk-token-123\",\"callType\":\"video\"},\"type\":\"CALL_INITIATED\",\"uuid\":\"test-uuid-123\"}"
  }
}
```

## Current Navigation Flow Mapping

### Incoming Call Navigation Flow
1. FCM Message → `index.js` background handler
2. `FCMMessageRouter` → `ReliableCallManager`
3. CallKeep displays native UI
4. User accepts → Deep link: `adtip://call/simple/:sessionId`
5. Navigation to `MeetingSimple` screen
6. VideoSDK meeting initialization

### Current Deep Link Routes
```typescript
// Existing call routes
Meeting: {
  path: 'call/:meetingId',
  parse: { meetingId: (meetingId: string) => meetingId }
},
MeetingSimple: {
  path: 'call/simple/:sessionId',
  parse: { sessionId: (sessionId: string) => sessionId }
}
```

### Identified Navigation Issues
1. **Missing FCM-to-DeepLink Conversion**: No automatic conversion of FCM payload to deep link
2. **Complex Route Structure**: Multiple call routes causing confusion
3. **Parameter Mismatch**: FCM payload parameters don't match deep link parameters
4. **Background Navigation**: Inconsistent navigation from background state

## Next Steps

1. ✅ Complete Phase 1 analysis and documentation
2. Begin Phase 2 implementation with FCM consolidation
3. Implement comprehensive testing framework
4. Create monitoring and alerting system
5. Plan gradual rollout strategy
