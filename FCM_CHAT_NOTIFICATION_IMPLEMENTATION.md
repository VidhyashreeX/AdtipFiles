# FCM Chat Notification Implementation

## Overview
This implementation adds notifee notification support and deep linking for FCM chat messages. When a chat message is received via FCM, it will:

1. **Parse the new FCM message format** with the `info` field containing JSON data
2. **Create a notifee notification** with the sender name and message content
3. **Handle notification taps** to navigate directly to FCMChatScreen with the sender
4. **Store messages with proper timestamps** for chronological ordering

## Implementation Details

### 1. FCM Message Format Support
The implementation now supports the new FCM message format:
```json
{
  "data": {
    "info": "{\"type\":\"chat_message\",\"messageId\":\"d90a0cdf-47f7-49f7-978f-a50956734b3e\",\"conversationId\":36,\"senderId\":\"58422\",\"senderName\":\"Current User\",\"content\":\"Helloiii\",\"messageType\":\"text\",\"timestamp\":\"2025-07-20T17:11:24.822Z\",\"replyToMessageId\":null}"
  }
}
```

### 2. Key Changes Made

#### A. FCMChatService.ts Updates
- **Added notifee imports** and notification channel creation
- **Updated handleFCMMessage()** to parse both new `info` field format and legacy format
- **Added createChatNotification()** method to display notifee notifications
- **Enhanced handleNotificationTap()** with proper deep linking to FCMChatScreen
- **Added setupNotifeeEventHandling()** for notification interaction handling
- **Added background notification handling** with pending navigation support

#### B. Notification Channel
- Created dedicated `chat-messages` channel with HIGH importance
- Configured with sound, vibration, and visual indicators
- Proper Android notification settings for chat messages

#### C. Deep Linking Integration
- Navigation to FCMChatScreen with `participantId` and `participantName` parameters
- Handles both foreground and background notification taps
- Queues navigation for background events and executes when app becomes active

### 3. Notification Behavior

#### When FCM Message is Received:
1. **Parse message data** from the `info` field JSON
2. **Create Message object** with proper timestamp from FCM data
3. **Save to local storage** for immediate display and offline access
4. **Trigger event handlers** to update UI if user is in chat
5. **Create notifee notification** (only if app is in background or user not in same chat)

#### When Notification is Tapped:
1. **Extract navigation data** from notification payload
2. **Navigate to FCMChatScreen** with sender information
3. **Load conversation** and display messages in chronological order

### 4. Timestamp Handling
- Uses the `timestamp` field from the FCM message `info` data
- Stores in ISO 8601 format: `2025-07-20T17:11:24.822Z`
- Ensures proper chronological ordering in local database
- Displays correctly formatted time in chat UI

### 5. Navigation Flow
```
FCM Message Received
    ↓
Parse info field
    ↓
Create notifee notification
    ↓
User taps notification
    ↓
Navigate to Main → FCMChat
    ↓
Load conversation with participantId
    ↓
Display messages in chronological order
```

### 6. App State Handling
- **Foreground**: Shows notification only if user not in same chat
- **Background**: Always shows notification
- **Killed**: Notification shown, navigation handled on app launch

## Testing
The implementation has been tested with the actual FCM message format:
- ✅ FCM message parsing from info field
- ✅ Message object creation with proper timestamp
- ✅ Notification data structure
- ✅ Navigation parameters for deep linking

## Files Modified
1. `src/services/FCMChatService.ts` - Main implementation
2. Navigation already configured for FCMChatScreen

## Usage
The implementation is automatic and requires no additional setup. When FCM chat messages are received:

1. **Notifications will appear** with sender name and message content
2. **Tapping notifications** will open the chat with that user
3. **Messages are stored** with proper timestamps for ordering
4. **Works in all app states** (foreground, background, killed)

## Benefits
- **Immediate notifications** for chat messages
- **Direct navigation** to specific chats
- **Proper message ordering** with FCM timestamps
- **Seamless user experience** across app states
- **Reliable message delivery** with local storage backup
