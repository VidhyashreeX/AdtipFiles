# Comprehensive Testing Guide - VideoSDK CallKeep Integration

## Overview

This guide provides complete instructions for testing the VideoSDK CallKeep integration implementation. The testing suite covers all aspects of the call handling system with automated scripts, performance monitoring, and comprehensive validation.

## ðŸš€ Quick Start

### Prerequisites
```bash
# Install dependencies
npm install

# Install testing dependencies
npm install --save-dev jest ts-jest @types/jest jest-html-reporters jest-junit detox
```

### Run All Tests
```bash
# Run complete test suite
node testing/scripts/runAllTests.js

# Run with E2E tests (requires device setup)
node testing/scripts/runAllTests.js --e2e

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:performance
npm run test:e2e
```

## ðŸ“ Test Structure

```
testing/
â”œâ”€â”€ unit/                    # Unit tests for individual components
â”‚   â”œâ”€â”€ CallFCMHandler.test.ts
â”‚   â”œâ”€â”€ CallUICoordinator.test.ts
â”‚   â””â”€â”€ FCMMessageRouter.test.ts
â”œâ”€â”€ integration/             # Integration tests for complete flows
â”‚   â””â”€â”€ CallFlow.test.ts
â”œâ”€â”€ e2e/                     # End-to-end tests
â”‚   â””â”€â”€ CallKeepIntegration.e2e.ts
â”œâ”€â”€ performance/             # Performance and load tests
â”‚   â””â”€â”€ CallPerformance.test.ts
â”œâ”€â”€ mocks/                   # Mock data and services
â”‚   â””â”€â”€ FCMMessageMocks.ts
â”œâ”€â”€ utils/                   # Testing utilities
â”‚   â””â”€â”€ TestingUtils.ts
â”œâ”€â”€ setup/                   # Test configuration
â”‚   â”œâ”€â”€ jest.setup.js
â”‚   â”œâ”€â”€ globalSetup.js
â”‚   â””â”€â”€ globalTeardown.js
â”œâ”€â”€ scripts/                 # Automated test execution
â”‚   â””â”€â”€ runAllTests.js
â”œâ”€â”€ reports/                 # Generated test reports
â””â”€â”€ jest.config.js          # Jest configuration
```

## ðŸ§ª Test Categories

### 1. Unit Tests
**Purpose**: Test individual components in isolation
**Coverage**: 90%+ for critical components
**Duration**: ~30 seconds

**Key Test Files**:
- `CallFCMHandler.test.ts` - FCM message handling logic
- `CallUICoordinator.test.ts` - UI coordination logic
- `FCMMessageRouter.test.ts` - Message routing logic

**Run Command**:
```bash
npx jest testing/unit --coverage
```

### 2. Integration Tests
**Purpose**: Test complete call flows and component interactions
**Coverage**: All major call scenarios
**Duration**: ~60 seconds

**Key Test Files**:
- `CallFlow.test.ts` - Complete call lifecycle testing

**Run Command**:
```bash
npx jest testing/integration
```

### 3. Performance Tests
**Purpose**: Validate performance requirements and identify bottlenecks
**Metrics**: Response time, memory usage, throughput
**Duration**: ~120 seconds

**Key Test Files**:
- `CallPerformance.test.ts` - Performance benchmarks

**Performance Thresholds**:
- FCM message processing: <100ms
- Call UI display: <200ms
- Memory usage: <50MB during calls
- Concurrent operations: 50+ ops/second

**Run Command**:
```bash
npx jest testing/performance
```

### 4. E2E Tests
**Purpose**: Test real device scenarios and user interactions
**Requirements**: Physical device or simulator
**Duration**: ~300 seconds

**Key Test Files**:
- `CallKeepIntegration.e2e.ts` - Real device call scenarios

**Run Command**:
```bash
npx detox test --configuration ios.sim.debug
```

## ðŸ“Š Test Reports

### Automated Reports
Tests generate comprehensive reports in multiple formats:

1. **HTML Report**: `testing/reports/jest-report.html`
   - Interactive test results
   - Coverage visualization
   - Performance metrics

2. **JSON Report**: `testing/reports/test-report.json`
   - Machine-readable results
   - CI/CD integration data

3. **JUnit XML**: `testing/reports/junit.xml`
   - CI/CD system compatibility
   - Build pipeline integration

4. **Coverage Report**: `testing/coverage/lcov-report/index.html`
   - Line-by-line coverage
   - Branch coverage analysis

### Sample Report Structure
```json
{
  "summary": {
    "totalTests": 45,
    "totalPassed": 43,
    "totalFailed": 2,
    "successRate": "95.56%",
    "duration": "125.34s"
  },
  "details": {
    "unit": { "passed": 20, "failed": 0, "total": 20 },
    "integration": { "passed": 15, "failed": 1, "total": 16 },
    "performance": { "passed": 8, "failed": 1, "total": 9 }
  }
}
```

## ðŸŽ¯ Success Criteria

### Functional Requirements
- âœ… 100% FCM message routing accuracy
- âœ… 95%+ CallKeep UI display success rate
- âœ… <2 second call acceptance response time
- âœ… 100% background call handling reliability
- âœ… Zero UI conflicts between CallKeep and custom UI

### Performance Requirements
- âœ… <50MB memory usage during calls
- âœ… <5% CPU usage for call handling
- âœ… <100ms FCM message processing time
- âœ… Zero memory leaks in 24-hour testing

### Reliability Requirements
- âœ… 99.9% uptime for call services
- âœ… Graceful degradation when CallKeep unavailable
- âœ… Automatic recovery from service failures
- âœ… Consistent behavior across app restarts

## ðŸ”§ Test Configuration

### Jest Configuration
Key settings in `jest.config.js`:
- TypeScript support with ts-jest
- React Native preset
- Comprehensive mocking
- Coverage thresholds
- Multiple test projects

### Mock Services
Comprehensive mocking for:
- React Native APIs
- Firebase Messaging
- CallKeep
- AsyncStorage
- VideoSDK
- Navigation

## ðŸš¨ Troubleshooting

### Common Issues

1. **Tests Timeout**
   ```bash
   # Increase timeout in jest.config.js
   testTimeout: 60000
   ```

2. **Mock Import Errors**
   ```bash
   # Check moduleNameMapper in jest.config.js
   # Ensure all React Native modules are mocked
   ```

3. **Coverage Threshold Failures**
   ```bash
   # Adjust thresholds in jest.config.js
   # Add more test cases for uncovered code
   ```

4. **E2E Test Failures**
   ```bash
   # Ensure device/simulator is running
   # Check Detox configuration
   # Verify app is built for testing
   ```

### Debug Mode
```bash
# Run tests with debug output
npx jest --verbose --no-cache

# Run specific test file
npx jest testing/unit/CallFCMHandler.test.ts --verbose

# Run tests in watch mode
npx jest --watch
```

## ðŸ“ˆ Continuous Integration

### CI/CD Integration
```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: |
    npm install
    node testing/scripts/runAllTests.js
    
- name: Upload Coverage
  uses: codecov/codecov-action@v1
  with:
    file: ./testing/coverage/lcov.info
```

### Quality Gates
- Minimum 80% code coverage
- All tests must pass
- Performance thresholds met
- No critical security vulnerabilities

## ðŸ”„ Test Maintenance

### Regular Tasks
1. **Weekly**: Review test results and update thresholds
2. **Monthly**: Update mock data and test scenarios
3. **Quarterly**: Performance baseline review
4. **Release**: Full test suite execution

### Adding New Tests
1. Create test file in appropriate directory
2. Follow naming convention: `*.test.ts`
3. Use provided utilities and mocks
4. Update coverage thresholds if needed
5. Document test purpose and scenarios

## ðŸ“š Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Detox E2E Testing](https://github.com/wix/Detox)
- [React Native Testing](https://reactnative.dev/docs/testing-overview)
- [VideoSDK Documentation](https://docs.videosdk.live/)
- [CallKeep Documentation](https://github.com/react-native-webrtc/react-native-callkeep)

## ðŸŽ‰ Conclusion

This comprehensive testing suite ensures the VideoSDK CallKeep integration is robust, performant, and reliable across all scenarios. The automated testing pipeline provides confidence in code quality and helps maintain high standards throughout development.

For questions or issues, refer to the troubleshooting section or create an issue in the project repository.

# Deep Link Testing Guide

## Overview
This guide provides comprehensive testing instructions for the updated deep linking system across all screens in the Adtip app.

## Updated Screens and Share Functionality

### âœ… HomeScreen
- **Share Button**: Updated to use ShareService
- **Deep Link Pattern**: `adtip://post/:postId` or `https://adtip.in/post/:postId`
- **Test**: Share a post from HomeScreen and verify the generated link

### âœ… PostViewerScreen  
- **Share Button**: Updated to use ShareService
- **Deep Link Reception**: Can receive `postId` parameter
- **Test**: Navigate via deep link `adtip://post/123`

### âœ… VideoPlayerModalScreen
- **Share Button**: Updated to use ShareService with VIDEO_PLAYER pattern
- **Deep Link Pattern**: `adtip://watch/:videoId` or `https://adtip.in/watch/:videoId`
- **Test**: Share a video and verify the generated link

### âœ… TipShortsEnhancedScreen (EnhancedShortCard)
- **Share Button**: Updated to use ShareService
- **Deep Link Pattern**: `adtip://short/:shortId` or `https://adtip.in/short/:shortId`
- **Test**: Share a short video and verify the generated link

### âœ… UserProfileScreen
- **Share Button**: Added new share functionality
- **Deep Link Pattern**: `adtip://user/:userId` or `https://adtip.in/user/:userId`
- **Test**: Share a user profile and verify the generated link

### âœ… TipTubeScreen
- **Note**: Shares through VideoPlayerModal (no direct share buttons)
- **Deep Link Reception**: Can receive video deep links through VideoPlayerModal

## Testing Commands

### Android Testing
```bash
# Test post deep link
adb shell am start -W -a android.intent.action.VIEW -d "adtip://post/123" com.adtip.app.adtip_app

# Test video deep link  
adb shell am start -W -a android.intent.action.VIEW -d "adtip://watch/456" com.adtip.app.adtip_app

# Test short video deep link
adb shell am start -W -a android.intent.action.VIEW -d "adtip://short/789" com.adtip.app.adtip_app

# Test user profile deep link
adb shell am start -W -a android.intent.action.VIEW -d "adtip://user/101" com.adtip.app.adtip_app
```

### iOS Testing
```bash
# Test post deep link
xcrun simctl openurl booted "adtip://post/123"

# Test video deep link
xcrun simctl openurl booted "adtip://watch/456"

# Test short video deep link  
xcrun simctl openurl booted "adtip://short/789"

# Test user profile deep link
xcrun simctl openurl booted "adtip://user/101"
```

### Universal Links Testing
```bash
# Test universal links (replace with actual domain)
https://adtip.in/post/123
https://adtip.in/watch/456
https://adtip.in/short/789
https://adtip.in/user/101
```

## Test Scenarios

### 1. Share Button Functionality
- [ ] HomeScreen: Tap share on a post â†’ Verify ShareService is called
- [ ] PostViewerScreen: Tap share on a post â†’ Verify ShareService is called  
- [ ] VideoPlayerModal: Tap share on a video â†’ Verify ShareService is called
- [ ] TipShorts: Tap share on a short â†’ Verify ShareService is called
- [ ] UserProfile: Tap share profile â†’ Verify ShareService is called

### 2. Deep Link Reception
- [ ] Post deep link â†’ Should navigate to PostViewer with correct postId
- [ ] Video deep link â†’ Should navigate to VideoPlayerModal with correct videoId
- [ ] Short deep link â†’ Should navigate to TipShorts with correct shortId
- [ ] User deep link â†’ Should navigate to UserProfile with correct userId

### 3. Share Content Verification
- [ ] Shared links should use proper deep link format
- [ ] Universal links should be used when specified
- [ ] App name should be included when specified
- [ ] Custom messages should work correctly

### 4. Error Handling
- [ ] Invalid deep links should fallback gracefully
- [ ] Network errors during sharing should show fallback
- [ ] Missing parameters should be handled properly

## Expected Behavior

### Share Flow
1. User taps share button
2. ShareService generates proper deep link
3. Native share dialog opens with formatted message
4. Link includes app name and proper URL structure

### Deep Link Flow  
1. User clicks/taps deep link
2. App opens (or switches to foreground)
3. DeepLinkService parses URL
4. Navigation occurs to correct screen with parameters
5. Screen loads with correct content

## Troubleshooting

### Common Issues
1. **Share button not working**: Check ShareService import and function call
2. **Deep link not opening app**: Verify URL scheme registration
3. **Wrong screen navigation**: Check DeepLinkService parsing logic
4. **Missing parameters**: Verify parameter passing in navigation

### Debug Steps
1. Check console logs for ShareService and DeepLinkService
2. Verify deep link patterns in deepLinkConfig.ts
3. Test with simple deep links first
4. Verify navigation stack is ready

## Success Criteria
- âœ… All share buttons use ShareService
- âœ… All screens can receive appropriate deep links
- âœ… Deep links generate correctly formatted URLs
- âœ… Navigation works properly for all link types
- âœ… Error handling works for edge cases

# Local Chat System Testing Guide

## Overview

This guide provides comprehensive testing procedures for the new local-only chat architecture that eliminates backend dependencies and uses only AsyncStorage with direct FCM messaging.

## Pre-Testing Setup

### 1. Clean Up Existing Chat Data

Before testing, run the cleanup script to remove any existing chat data:

```typescript
import { ChatCleanupScript } from './src/scripts/cleanupChatStorage';

// Run cleanup
await ChatCleanupScript.runCleanup();

// Or just generate a report
await ChatCleanupScript.runStorageReport();
```

### 2. Verify Service Initialization

Ensure the new services are properly initialized:

```typescript
import { FCMChatServiceLocal } from './src/services/FCMChatServiceLocal';
import { LocalChatManager } from './src/services/LocalChatManager';

const chatService = FCMChatServiceLocal.getInstance();
const isInitialized = chatService.isServiceInitialized();
console.log('Chat service initialized:', isInitialized);
```

## Test Scenarios

### 1. Basic Message Sending

**Objective**: Verify messages can be sent and stored locally

**Steps**:
1. Open FCMChatScreen with a valid participant ID
2. Type a message and send it
3. Verify message appears in chat with correct sender name (not "You")
4. Check AsyncStorage for message persistence

**Expected Results**:
- Message displays immediately with proper sender name
- Message status shows as "sending" then "sent"
- Message is stored in AsyncStorage under key `@fcm_chat_messages_conv_{userId1}_{userId2}`

**Verification**:
```typescript
// Check AsyncStorage
const messages = await AsyncStorage.getItem('@fcm_chat_messages_conv_123_456');
console.log('Stored messages:', JSON.parse(messages || '[]'));
```

### 2. Conversation Creation

**Objective**: Verify conversations are created locally without backend calls

**Steps**:
1. Navigate to chat with a new participant
2. Send first message
3. Verify conversation is created locally

**Expected Results**:
- Conversation ID follows format: `conv_{userId1}_{userId2}` (sorted)
- Conversation is stored in `@fcm_chat_conversations`
- No backend API calls are made

**Verification**:
```typescript
// Check conversations
const conversations = await AsyncStorage.getItem('@fcm_chat_conversations');
console.log('Stored conversations:', JSON.parse(conversations || '[]'));
```

### 3. Real-time Message Reception

**Objective**: Verify incoming messages update UI without notifications when in active chat

**Steps**:
1. Open FCMChatScreen for a specific conversation
2. Simulate incoming FCM message for that conversation
3. Verify message appears in real-time
4. Verify no notification is shown

**Expected Results**:
- Message appears in chat immediately
- Chat auto-scrolls to new message
- No notification popup appears
- Message is marked as read automatically

**Test FCM Message Simulation**:
```typescript
// Simulate incoming FCM message
const mockFCMMessage = {
  data: {
    type: 'chat_message',
    messageId: 'incoming-123',
    conversationId: 'conv_123_456',
    senderId: '456',
    senderName: 'Test User',
    content: 'Hello from test',
    timestamp: new Date().toISOString()
  }
};

// This would normally be handled by FCM
```

### 4. Notification Handling

**Objective**: Verify notifications appear when not in active chat

**Steps**:
1. Be outside the specific chat screen
2. Simulate incoming FCM message
3. Verify notification appears
4. Tap notification and verify navigation to chat

**Expected Results**:
- Notification displays with sender name and message content
- Unread count increments
- Tapping notification opens correct chat screen

### 5. Offline Message Storage

**Objective**: Verify messages are queued when FCM sending fails

**Steps**:
1. Disable network connection
2. Send messages
3. Verify messages are stored locally
4. Re-enable network
5. Verify retry mechanism works

**Expected Results**:
- Messages show as "sending" status
- Messages are added to retry queue
- When network returns, messages are sent automatically

### 6. Sender Name Resolution

**Objective**: Verify sender names are properly resolved (not "You")

**Steps**:
1. Ensure user profile has name, username, or mobile number
2. Send messages
3. Verify sender name is correct

**Expected Results**:
- Sender name shows actual user name (not "You")
- Fallback order: name â†’ username â†’ mobile_number â†’ "User {id}"

**Debug Sender Name**:
```typescript
// Check user data
const userData = await AsyncStorage.getItem('user');
const userName = await AsyncStorage.getItem('userName');
console.log('User data:', JSON.parse(userData || '{}'));
console.log('User name:', userName);
```

### 7. Storage Cleanup

**Objective**: Verify cleanup utilities work correctly

**Steps**:
1. Create some test conversations and messages
2. Run cleanup script
3. Verify all chat data is removed

**Expected Results**:
- All chat-related AsyncStorage keys are removed
- Clean storage structure is initialized

### 8. Multiple Conversations

**Objective**: Verify multiple conversations work independently

**Steps**:
1. Create conversations with different participants
2. Send messages in each conversation
3. Verify messages are stored separately
4. Verify unread counts are tracked per conversation

**Expected Results**:
- Each conversation has separate storage key
- Messages don't mix between conversations
- Unread counts are independent

### 9. App State Handling

**Objective**: Verify proper behavior during app state changes

**Steps**:
1. Open chat screen
2. Send app to background
3. Receive FCM message
4. Bring app to foreground
5. Verify message handling

**Expected Results**:
- Background messages show notifications
- Foreground messages update UI directly
- Messages are marked as read when returning to active chat

### 10. Performance Testing

**Objective**: Verify system performs well with many messages

**Steps**:
1. Create conversation with 100+ messages
2. Test scrolling performance
3. Test message sending speed
4. Monitor memory usage

**Expected Results**:
- Smooth scrolling through message history
- Fast message sending and receiving
- Reasonable memory usage

## Debugging Tools

### 1. Storage Inspector

```typescript
import { ChatStorageCleanup } from './src/utils/ChatStorageCleanup';

// Get detailed storage report
const report = await ChatStorageCleanup.getStorageReport();
console.log('Storage Report:', report);
```

### 2. Message Flow Tracer

```typescript
// Enable detailed logging in LocalChatManager
// Check console for message flow logs
```

### 3. FCM Token Verification

```typescript
import messaging from '@react-native-firebase/messaging';

// Get current FCM token
const token = await messaging().getToken();
console.log('FCM Token:', token);
```

## Common Issues and Solutions

### Issue: Sender Name Shows "You"

**Cause**: User name not properly populated
**Solution**: 
1. Check user data in AsyncStorage
2. Verify AuthContext provides user.name
3. Ensure fallback logic works

### Issue: Messages Not Appearing

**Cause**: FCM message handling not working
**Solution**:
1. Check FCM token validity
2. Verify message format
3. Check console for FCM errors

### Issue: Notifications Not Working

**Cause**: Notification permissions or setup
**Solution**:
1. Check notification permissions
2. Verify notifee setup
3. Test notification display manually

### Issue: Storage Not Persisting

**Cause**: AsyncStorage errors
**Solution**:
1. Check AsyncStorage permissions
2. Verify storage keys are correct
3. Test AsyncStorage directly

## Test Completion Checklist

- [ ] Messages send successfully with correct sender names
- [ ] Conversations create locally without backend calls
- [ ] Real-time updates work in active chat
- [ ] Notifications appear when not in active chat
- [ ] Offline messages are queued and retry
- [ ] Storage cleanup works correctly
- [ ] Multiple conversations work independently
- [ ] App state changes handled properly
- [ ] Performance is acceptable
- [ ] No backend API calls are made for chat functionality

## Automated Test Execution

Run the automated test suite:

```bash
# Run all chat tests
npm test -- --testPathPattern=LocalChatSystem.test.ts

# Run specific test group
npm test -- --testNamePattern="LocalChatManager"
```

## Production Readiness Verification

Before deploying to production:

1. âœ… All manual tests pass
2. âœ… Automated tests pass
3. âœ… No backend dependencies remain
4. âœ… Performance is acceptable
5. âœ… Error handling is robust
6. âœ… Storage cleanup works
7. âœ… FCM integration is stable
8. âœ… Real-time updates are reliable

# Phase 5: Comprehensive Testing and Validation Plan

## Overview
This document outlines a comprehensive testing strategy for the VideoSDK CallKeep integration implementation. The testing covers all app states, call flows, error scenarios, and edge cases.

## Testing Categories

### 1. ðŸŽ¯ Core Functionality Testing
- FCM message routing and handling
- CallKeep native UI display
- Call acceptance and rejection flows
- Background/killed app scenarios
- Deep linking navigation

### 2. ðŸ”„ Integration Testing
- VideoSDK + CallKeep integration
- FCM + CallKeep coordination
- UI coordination between native and custom
- State management across services

### 3. ðŸš¨ Error Handling Testing
- CallKeep unavailable scenarios
- Permission denied cases
- Network failure handling
- Service initialization failures

### 4. ðŸ“± Platform-Specific Testing
- iOS CallKit integration
- Android CallKeep integration
- Platform permission handling
- Audio session management

### 5. âš¡ Performance Testing
- Memory usage during calls
- CPU usage optimization
- Battery impact assessment
- Network efficiency

## Test Execution Strategy

### Automated Testing
- Unit tests for all services
- Integration tests for call flows
- Mock FCM message testing
- State management validation

### Manual Testing
- Real device testing
- Cross-platform validation
- User experience testing
- Edge case scenarios

### Load Testing
- Multiple simultaneous calls
- High-frequency FCM messages
- Memory leak detection
- Performance under stress

## Test Scripts Structure

```
/testing/
â”œâ”€â”€ unit/                    # Unit tests for individual services
â”œâ”€â”€ integration/             # Integration tests for call flows
â”œâ”€â”€ e2e/                     # End-to-end testing scenarios
â”œâ”€â”€ performance/             # Performance and load testing
â”œâ”€â”€ mocks/                   # Mock data and services
â”œâ”€â”€ utils/                   # Testing utilities and helpers
â””â”€â”€ scripts/                 # Automated test execution scripts
```

## Success Criteria

### Functional Requirements
- âœ… 100% FCM message routing accuracy
- âœ… 95%+ CallKeep UI display success rate
- âœ… <2 second call acceptance response time
- âœ… 100% background call handling reliability
- âœ… Zero UI conflicts between CallKeep and custom UI

### Performance Requirements
- âœ… <50MB memory usage during calls
- âœ… <5% CPU usage for call handling
- âœ… <100ms FCM message processing time
- âœ… Zero memory leaks in 24-hour testing

### Reliability Requirements
- âœ… 99.9% uptime for call services
- âœ… Graceful degradation when CallKeep unavailable
- âœ… Automatic recovery from service failures
- âœ… Consistent behavior across app restarts

## Test Environment Setup

### Development Environment
- React Native development setup
- VideoSDK test account and tokens
- Firebase project with FCM configured
- Physical devices for testing (iOS/Android)

### Testing Tools
- Jest for unit testing
- Detox for E2E testing
- Flipper for debugging
- Firebase Test Lab for device testing

### Mock Services
- Mock FCM message generator
- Mock VideoSDK responses
- Mock CallKeep behaviors
- Simulated network conditions

## Execution Timeline

### Week 1: Foundation Testing
- Unit tests for all services
- Basic integration testing
- Mock data validation

### Week 2: Flow Testing
- Complete call flow testing
- Background scenario testing
- Error handling validation

### Week 3: Performance Testing
- Load testing and optimization
- Memory leak detection
- Performance profiling

### Week 4: Final Validation
- Cross-platform testing
- User acceptance testing
- Production readiness assessment

## Next Steps

1. **Create Test Scripts**: Implement all testing scripts and utilities
2. **Set Up Test Environment**: Configure testing infrastructure
3. **Execute Test Suites**: Run comprehensive testing scenarios
4. **Performance Analysis**: Analyze and optimize performance
5. **Final Validation**: Validate production readiness

# CreateContentModal Test Plan

## Test Scenarios

### 1. Guest Mode Test
**Objective**: Verify CreateContentModal works in guest mode without crashing

**Steps**:
1. Clear app data and launch app
2. Click "Try Now" to enter guest mode
3. Navigate to Home screen
4. Tap the create content button (+ icon in tab bar)
5. Try tapping each content creation option:
   - Create Post
   - Upload Video
   - Create Short
   - Start Stream (disabled)

**Expected Results**:
- âœ… Modal opens without crash
- âœ… Tapping any option shows local login prompt overlay
- âœ… Login prompt has "Login Required" title and appropriate message
- âœ… Cancel button closes the login prompt
- âœ… Login button exits guest mode and closes modal
- âœ… No navigation occurs for guest users
- âœ… No crashes or errors

### 2. Authenticated Mode Test
**Objective**: Verify CreateContentModal works for authenticated users

**Steps**:
1. Login with valid credentials
2. Navigate to Home screen
3. Tap the create content button (+ icon in tab bar)
4. Try tapping each content creation option:
   - Create Post
   - Upload Video
   - Create Short

**Expected Results**:
- âœ… Modal opens without crash
- âœ… Tapping options closes modal and navigates to respective screens
- âœ… No login prompts shown
- âœ… Navigation works correctly
- âœ… No crashes or errors

### 3. Modal Interaction Test
**Objective**: Verify modal interactions work properly

**Steps**:
1. Open CreateContentModal
2. Test swipe down gesture to close
3. Test backdrop tap to close
4. Test X button to close
5. Test opening/closing multiple times

**Expected Results**:
- âœ… All close methods work properly
- âœ… Animations are smooth
- âœ… No memory leaks or state issues
- âœ… Modal can be reopened after closing

## Key Changes Made

### 1. Removed Global Dependencies
- Removed `useGuestGuard` import and usage
- No longer triggers global LoginPromptModal instances
- Self-contained guest mode handling

### 2. Local State Management
```typescript
const [showLocalLoginPrompt, setShowLocalLoginPrompt] = React.useState(false);
const [loginPromptMessage, setLoginPromptMessage] = React.useState('');
```

### 3. Overlay Instead of Nested Modal
- Changed from nested Modal to overlay View
- Prevents modal conflicts
- Uses `StyleSheet.absoluteFill` for proper positioning

### 4. Simplified Navigation
- Removed complex animation-based navigation
- Uses immediate close + setTimeout for authenticated users
- Prevents timing-related crashes

## Debugging Information

### Console Logs to Watch For
```
[CreateContentModal] Navigation handler called for {screenName}, isGuest: {boolean}
[CreateContentModal] Guest user attempting to access {screenName}, showing local login prompt
[CreateContentModal] Authenticated user, closing modal and navigating to {screenName}
[CreateContentModal] Navigating to {screenName}
```

### Error Logs to Watch For
```
[CreateContentModal] Navigation error to {screenName}: {error}
[CreateContentModal] Failed to exit guest mode: {error}
```

## Success Criteria

The fix is successful if:
1. âœ… No crashes when opening CreateContentModal in guest mode
2. âœ… No crashes when tapping content creation options in guest mode
3. âœ… Local login prompt appears and functions correctly
4. âœ… Navigation works for authenticated users
5. âœ… No modal conflicts or rendering issues
6. âœ… All existing functionality preserved

## Rollback Plan

If issues persist:
1. Revert to previous CreateContentModal implementation
2. Investigate alternative approaches:
   - Use React Navigation's modal stack
   - Implement content creation restrictions at tab level
   - Use global state management for modal conflicts

# Guest Mode Testing Suite

This directory contains comprehensive tests for the guest mode functionality in the Adtip React Native application.

## Overview

The guest mode feature allows unauthenticated users to browse limited content without requiring login. This testing suite validates all aspects of the guest mode implementation.

## Test Coverage

### 1. AuthContext Guest Mode Tests (`AuthContext.guest.test.tsx`)
- âœ… Guest mode activation and deactivation
- âœ… State persistence across app restarts
- âœ… State cleanup during login/logout
- âœ… Error handling for guest mode operations
- âœ… Integration with existing authentication flow

### 2. API Service Guest Mode Tests (`ApiService.guest.test.ts`)
- âœ… Guest API calls without authentication tokens
- âœ… Request interceptor guest mode handling
- âœ… Public endpoint configuration
- âœ… Error handling for guest API calls
- âœ… Network error resilience

### 3. LoginPromptModal Tests (`LoginPromptModal.test.tsx`)
- âœ… Modal rendering and visibility
- âœ… User interactions (Cancel, Login buttons)
- âœ… Custom title and message support
- âœ… Theme integration
- âœ… Error handling for guest mode exit
- âœ… Accessibility compliance

### 4. Integration Tests (`GuestMode.integration.test.tsx`)
- âœ… Complete guest mode activation flow
- âœ… Content access in guest mode
- âœ… Restricted action handling
- âœ… State persistence validation
- âœ… Guest mode exit flow
- âœ… API integration testing

## Running Tests

### Prerequisites
```bash
npm install
# or
yarn install
```

### Run All Tests
```bash
# Run all guest mode tests with coverage
node __tests__/guest-mode/run-tests.js --coverage

# Run all tests without coverage
node __tests__/guest-mode/run-tests.js
```

### Run Individual Test Suites
```bash
# Run tests individually (one by one)
node __tests__/guest-mode/run-tests.js --individual

# Run specific test
node __tests__/guest-mode/run-tests.js --test=AuthContext
node __tests__/guest-mode/run-tests.js --test=ApiService
node __tests__/guest-mode/run-tests.js --test=LoginPromptModal
node __tests__/guest-mode/run-tests.js --test=integration
```

### Using Jest Directly
```bash
# Run with Jest configuration
npx jest --config=__tests__/guest-mode/jest.config.js

# Run specific test file
npx jest --config=__tests__/guest-mode/jest.config.js AuthContext.guest.test.tsx

# Run with coverage
npx jest --config=__tests__/guest-mode/jest.config.js --coverage
```

## Test Scenarios

### Guest Mode Activation
1. User clicks "Try Now" on onboarding screen
2. Guest mode state is set in AuthContext
3. Guest flag is persisted in AsyncStorage
4. Navigation bypasses login flow
5. User lands on MainNavigator

### Content Access
1. Guest users can view limited content
2. API calls use guest endpoints without auth tokens
3. Content is properly displayed in read-only mode
4. No authentication headers are sent

### Restricted Actions
1. Guest attempts to like/comment/share
2. LoginPromptModal is displayed
3. User can cancel or proceed to login
4. Guest state is properly cleaned up on login

### State Management
1. Guest mode persists across app restarts
2. Proper cleanup when transitioning to authenticated mode
3. State consistency across all components
4. Error handling for state operations

## Coverage Reports

After running tests with `--coverage`, view the coverage report:

```bash
# Open HTML coverage report
open coverage/guest-mode/index.html

# View text coverage summary
cat coverage/guest-mode/lcov-report/index.html
```

## Test Configuration

### Jest Configuration (`jest.config.js`)
- React Native preset
- Custom test environment setup
- Coverage collection from guest mode files
- Module name mapping for imports

### Setup File (`setup.js`)
- Mock React Native modules
- Mock navigation dependencies
- Mock AsyncStorage
- Global test utilities

## Debugging Tests

### Enable Verbose Output
```bash
node __tests__/guest-mode/run-tests.js --individual --verbose
```

### Debug Specific Test
```bash
# Add --debug flag to Jest
npx jest --config=__tests__/guest-mode/jest.config.js --debug AuthContext.guest.test.tsx
```

### Common Issues
1. **Mock not working**: Check setup.js for proper module mocking
2. **AsyncStorage errors**: Verify AsyncStorage mock implementation
3. **Navigation errors**: Ensure navigation mocks are properly configured
4. **Component rendering issues**: Check React Native component mocks

## Continuous Integration

### GitHub Actions Example
```yaml
- name: Run Guest Mode Tests
  run: |
    node __tests__/guest-mode/run-tests.js --coverage
    
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/guest-mode/lcov.info
```

### Test Metrics
- **Minimum Coverage**: 80%
- **Test Timeout**: 10 seconds
- **Max Test Duration**: 30 seconds per suite

## Contributing

When adding new guest mode features:

1. Add corresponding tests to appropriate test file
2. Update test scenarios in `run-tests.js`
3. Ensure coverage remains above 80%
4. Update this README with new test descriptions

## Troubleshooting

### Common Test Failures
1. **Timeout errors**: Increase timeout in jest.config.js
2. **Mock errors**: Verify all dependencies are properly mocked
3. **State errors**: Check AsyncStorage mock implementation
4. **Navigation errors**: Ensure navigation mocks match actual usage

### Performance Issues
1. Use `--runInBand` for serial test execution
2. Increase `--maxWorkers` for parallel execution
3. Use `--cache` for faster subsequent runs

## Related Documentation
- [Guest Mode Implementation Guide](../../docs/guest-mode.md)
- [API Documentation](../../docs/api.md)
- [Testing Guidelines](../../docs/testing.md)

