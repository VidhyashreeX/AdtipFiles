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
- Fallback order: name → username → mobile_number → "User {id}"

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

1. ✅ All manual tests pass
2. ✅ Automated tests pass
3. ✅ No backend dependencies remain
4. ✅ Performance is acceptable
5. ✅ Error handling is robust
6. ✅ Storage cleanup works
7. ✅ FCM integration is stable
8. ✅ Real-time updates are reliable
