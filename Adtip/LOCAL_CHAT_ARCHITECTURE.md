# Local-Only Chat Architecture Design

## Overview

This document outlines the new local-only chat architecture that eliminates backend dependencies and uses only AsyncStorage for chat data management with direct FCM messaging.

## Core Principles

1. **Local-Only Storage**: All chat data stored exclusively in React Native AsyncStorage
2. **Direct FCM Messaging**: Frontend sends FCM messages directly, no backend API calls
3. **Deterministic Conversation IDs**: Consistent conversation identification without backend
4. **Real-time UI Updates**: Immediate local updates with FCM-based synchronization
5. **No Backend Dependencies**: Complete independence from backend chat APIs

## Storage Architecture

### Storage Keys Structure

```typescript
// Conversation storage
const STORAGE_KEYS = {
  // Main conversation list
  CONVERSATIONS: '@fcm_chat_conversations',
  
  // Messages for specific conversations
  MESSAGES_PREFIX: '@fcm_chat_messages_',
  
  // User profiles cache
  USER_PROFILES: '@fcm_chat_user_profiles',
  
  // Unread counts
  UNREAD_COUNTS: '@fcm_chat_unread_counts',
  
  // Last sync timestamp
  LAST_SYNC: '@fcm_chat_last_sync',
  
  // FCM tokens cache
  FCM_TOKENS: '@fcm_chat_fcm_tokens'
};
```

### Data Structures

#### Conversation Structure
```typescript
interface LocalConversation {
  id: string;                    // Format: "conv_{userId1}_{userId2}"
  type: 'direct' | 'group';
  participants: string[];        // Array of user IDs
  lastMessage?: LocalMessage;
  lastActivity: string;          // ISO timestamp
  unreadCount: number;
  createdAt: string;            // ISO timestamp
  updatedAt: string;            // ISO timestamp
}
```

#### Message Structure
```typescript
interface LocalMessage {
  id: string;                   // Unique message ID
  conversationId: string;       // References conversation
  senderId: string;             // User ID of sender
  senderName: string;           // Display name of sender
  senderAvatar?: string;        // Profile image URL
  content: string;              // Message content
  messageType: 'text' | 'image' | 'video' | 'audio' | 'file';
  createdAt: string;           // ISO timestamp
  status: 'sending' | 'sent' | 'delivered' | 'read';
  tempId?: string;             // Temporary ID for optimistic updates
  replyTo?: string;            // ID of message being replied to
}
```

#### User Profile Cache
```typescript
interface CachedUserProfile {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  fcmToken?: string;
  lastUpdated: string;         // ISO timestamp
}
```

## Conversation Management

### Conversation ID Generation
```typescript
// Deterministic conversation ID for direct chats
function generateConversationId(userId1: string, userId2: string): string {
  const participants = [userId1, userId2].sort();
  return `conv_${participants[0]}_${participants[1]}`;
}
```

### Conversation Creation Flow
1. Generate deterministic conversation ID
2. Check if conversation exists in local storage
3. If not exists, create new conversation object
4. Save to local storage
5. Return conversation ID

## Message Flow Architecture

### Sending Messages

#### 1. Optimistic Update
```typescript
// Create optimistic message
const optimisticMessage: LocalMessage = {
  id: `temp_${Date.now()}_${Math.random()}`,
  conversationId,
  senderId: currentUserId,
  senderName: currentUserName,
  content,
  messageType: 'text',
  createdAt: new Date().toISOString(),
  status: 'sending',
  tempId: `temp_${Date.now()}_${Math.random()}`
};

// Add to local storage immediately
await saveMessageToLocal(optimisticMessage);
```

#### 2. Direct FCM Send
```typescript
// Send directly via FCM API (no backend)
const fcmPayload = {
  to: recipientFCMToken,
  priority: 'high',
  data: {
    type: 'chat_message',
    messageId: optimisticMessage.id,
    conversationId,
    senderId: currentUserId,
    senderName: currentUserName,
    content,
    timestamp: optimisticMessage.createdAt
  },
  notification: {
    title: currentUserName,
    body: content
  }
};

await sendFCMMessage(fcmPayload);
```

#### 3. Status Update
```typescript
// Update message status to 'sent'
optimisticMessage.status = 'sent';
await updateMessageInLocal(optimisticMessage);
```

### Receiving Messages

#### 1. FCM Message Handler
```typescript
// Handle incoming FCM message
function handleIncomingChatMessage(fcmMessage: FCMMessage) {
  const { conversationId, senderId, senderName, content, messageId, timestamp } = fcmMessage.data;
  
  // Create message object
  const incomingMessage: LocalMessage = {
    id: messageId,
    conversationId,
    senderId,
    senderName,
    content,
    messageType: 'text',
    createdAt: timestamp,
    status: 'delivered'
  };
  
  // Save to local storage
  await saveMessageToLocal(incomingMessage);
  
  // Update conversation
  await updateConversationLastMessage(conversationId, incomingMessage);
  
  // Update unread count (if not in active chat)
  if (!isInActiveChat(conversationId)) {
    await incrementUnreadCount(conversationId);
    // Show notification
    await showChatNotification(senderName, content);
  } else {
    // Update UI in real-time
    await updateActiveChatUI(incomingMessage);
  }
}
```

## Real-time UI Updates

### Active Chat Screen Updates
```typescript
// When user is in specific chat screen
function handleActiveChatMessage(message: LocalMessage) {
  // Add message to current chat
  setCurrentMessages(prev => [...prev, message]);
  
  // Auto-scroll to latest message
  scrollToBottom();
  
  // Mark as read immediately
  markMessageAsRead(message.id);
  
  // Don't show notification
}
```

### Conversation List Updates
```typescript
// Update conversation list when new message arrives
function updateConversationList(conversationId: string, lastMessage: LocalMessage) {
  setConversations(prev => 
    prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, lastMessage, lastActivity: lastMessage.createdAt }
        : conv
    )
  );
}
```

## FCM Token Management

### Token Storage
```typescript
// Cache FCM tokens locally
interface FCMTokenCache {
  [userId: string]: {
    token: string;
    lastUpdated: string;
    expiresAt: string;
  }
}
```

### Token Refresh Strategy
1. Cache tokens for 24 hours
2. Refresh on app startup
3. Refresh when message send fails due to invalid token
4. Use direct FCM API to get user tokens (no backend)

## Error Handling & Offline Support

### Message Queue
```typescript
interface QueuedMessage {
  message: LocalMessage;
  retryCount: number;
  nextRetryAt: string;
  maxRetries: number;
}
```

### Retry Strategy
1. Exponential backoff: 1s, 2s, 4s, 8s, 16s
2. Max 5 retries
3. Move to failed queue after max retries
4. Retry failed messages on network reconnection

## Migration Strategy

### Phase 1: Cleanup
1. Run ChatStorageCleanup to remove existing data
2. Initialize clean storage structure

### Phase 2: Implementation
1. Implement LocalChatManager
2. Update FCMChatService for local-only operation
3. Modify FCMChatContext for new architecture

### Phase 3: Testing
1. Test message sending/receiving
2. Test offline scenarios
3. Test real-time updates
4. Performance testing

## Performance Considerations

### Storage Optimization
- Limit message history per conversation (e.g., last 1000 messages)
- Compress old messages
- Lazy load message history

### Memory Management
- Unload inactive conversation messages
- Cache only active conversation data
- Periodic cleanup of old cached data

## Security Considerations

### Data Protection
- Encrypt sensitive message content
- Secure FCM token storage
- Validate incoming FCM messages

### Privacy
- No backend storage of messages
- Local-only conversation history
- User controls data retention
