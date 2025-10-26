# WebSocket Crash Fix - MessageDeflater IllegalArgumentException

## Problem Summary

The app was experiencing crashes with the following error:
```
java.lang.IllegalArgumentException: Failed requirement.
	at okhttp3.internal.ws.MessageDeflater.deflate(MessageDeflater.kt:39)
	at okhttp3.internal.ws.WebSocketWriter.writeMessageFrame(WebSocketWriter.kt:155)
	at okhttp3.internal.ws.RealWebSocket.writeOneFrame$okhttp(RealWebSocket.kt:527)
```

This crash occurs in OkHttp's WebSocket implementation when:
1. WebSocket compression (per-message-deflate) is enabled
2. Invalid, empty, or malformed messages are sent through the WebSocket
3. The MessageDeflater tries to compress the invalid payload and fails the requirement check

## Root Cause

The issue stems from:
- **Socket.IO client** using OkHttp's WebSocket implementation on Android
- **Per-message compression** enabled by default causing issues with certain message payloads
- **Lack of input validation** before sending messages through WebSocket
- **Potential OkHttp version conflicts** between different dependencies

## Fixes Applied

### 1. ProGuard Rules Enhancement (`android/app/proguard-rules.pro`)

Added comprehensive rules to protect OkHttp WebSocket classes from obfuscation:

```proguard
# OkHttp WebSocket - Critical for preventing MessageDeflater crashes
-keep class okhttp3.internal.ws.** { *; }
-keep class okhttp3.internal.ws.MessageDeflater { *; }
-keep class okhttp3.internal.ws.MessageInflater { *; }
-keep class okhttp3.internal.ws.RealWebSocket { *; }
-keep class okhttp3.internal.ws.RealWebSocket$* { *; }

# Okio - Required by OkHttp
-keep class okio.** { *; }
-keep class okio.Buffer { *; }
-keep class okio.BufferedSource { *; }
-keep class okio.BufferedSink { *; }

# Socket.IO rules
-keep class io.socket.** { *; }
-keep class io.socket.engineio.** { *; }
-keep class io.socket.engineio.client.transports.** { *; }
```

### 2. Gradle Dependency Management (`android/app/build.gradle`)

#### Added Explicit OkHttp Dependencies:
```gradle
dependencies {
    // OkHttp - Explicit version to fix WebSocket MessageDeflater crashes
    implementation 'com.squareup.okhttp3:okhttp:4.12.0'
    implementation 'com.squareup.okio:okio:3.6.0'
    // ... other dependencies
}
```

#### Added Resolution Strategy:
```gradle
// Force resolution of OkHttp and Okio to specific versions
configurations.all {
    resolutionStrategy {
        force 'com.squareup.okhttp3:okhttp:4.12.0'
        force 'com.squareup.okio:okio:3.6.0'
        
        // Exclude conflicting versions
        exclude group: 'com.squareup.okhttp3', module: 'okhttp-bom'
    }
}
```

#### Enhanced Packaging Options:
```gradle
packagingOptions {
    // Prevent duplicate class conflicts
    exclude 'META-INF/INDEX.LIST'
    exclude 'META-INF/DEPENDENCIES.txt'
    // ... additional exclusions
    
    // Pick first for native libraries
    pickFirst '**/libc++_shared.so'
    // ... other native libraries
}
```

### 3. Socket.IO Configuration (`src/services/SocketService.ts`)

#### Disabled/Limited Message Compression:
```typescript
this.socket = io(baseUrl, {
    // ... other options
    perMessageDeflate: {
        threshold: 1024 * 1024, // Only compress messages > 1MB (effectively disabled)
    },
    forceNew: false,
    multiplex: true,
    upgrade: true,
    rememberUpgrade: true,
});
```

#### Added Input Validation:
```typescript
// Example: sendStreamChat validation
sendStreamChat(streamId: string, message: string): void {
    // Validate message to prevent WebSocket compression errors
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        Logger.warn('SocketService', 'Cannot send empty or invalid chat message');
        return;
    }
    
    // Validate streamId
    if (!streamId || typeof streamId !== 'string') {
        Logger.warn('SocketService', 'Cannot send chat - invalid streamId');
        return;
    }
    
    try {
        this.socket.emit('stream_chat', {
            streamId,
            message: message.trim()
        }, (response: any) => {
            // ... handle response
        });
    } catch (error) {
        Logger.error('SocketService', 'Error sending chat message:', error);
    }
}
```

### 4. Enhanced Error Handling

Added try-catch blocks around all Socket.IO emit operations:
- `joinStreamRoom()` - Validates streamId before joining
- `leaveStreamRoom()` - Validates streamId before leaving
- `sendStreamChat()` - Validates message and streamId
- `notifyTip()` - Validates all tip data fields

## Testing Recommendations

### 1. Build and Test
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

### 2. Test Scenarios
- [ ] Send chat messages in live streams
- [ ] Join/leave stream rooms
- [ ] Send tips with and without messages
- [ ] Test with poor network conditions
- [ ] Test with rapid message sending
- [ ] Test edge cases (empty messages, null values, etc.)

### 3. Monitor for Crashes
Check Firebase Crashlytics for:
- `MessageDeflater` crashes should be eliminated
- `RealWebSocket` errors should be reduced
- General WebSocket stability improvements

## Technical Details

### Why This Happens

OkHttp's `MessageDeflater.kt` line 39 contains a requirement check:
```kotlin
require(deflatedBytes.size < uncompressedSize)
```

This fails when:
1. The message is empty or too small to compress efficiently
2. The compression actually makes the message larger (common with small messages)
3. Invalid UTF-8 sequences or null bytes in the payload
4. Binary data mixed with text messages

### Why Our Fix Works

1. **Version Pinning**: Uses OkHttp 4.12.0 which has better WebSocket handling
2. **Compression Threshold**: Sets high threshold to effectively disable compression for normal messages
3. **Input Validation**: Prevents invalid data from reaching the WebSocket layer
4. **ProGuard Protection**: Prevents code obfuscation from breaking WebSocket internals
5. **Error Boundaries**: Catches and logs errors instead of crashing

## Related Files Modified

1. `Adtip/android/app/proguard-rules.pro` - ProGuard rules
2. `Adtip/android/app/build.gradle` - Dependencies and resolution strategy
3. `Adtip/src/services/SocketService.ts` - Socket.IO configuration and validation

## Additional Notes

- The fix maintains backward compatibility
- No server-side changes required
- Performance impact is minimal (compression was rarely beneficial for small messages anyway)
- The app will use uncompressed WebSocket messages for most cases, which is actually more reliable
- Only very large messages (>1MB) will attempt compression

## Verification Steps

After deploying:
1. Monitor crash rates in Firebase Crashlytics
2. Check logs for "SocketService" validation warnings
3. Verify WebSocket connections remain stable
4. Test all real-time features (chat, tips, viewer counts)

## Rollback Plan

If issues arise, revert these commits and redeploy the previous version. The changes are isolated to:
- Build configuration
- SocketService implementation
- ProGuard rules

No database or server changes are required, making rollback safe.
