# Participant State Bleeding Fix - Video Calling

## Issues Identified from Logs

Looking at your logs, there were several critical issues causing extra participants and local participants being treated as remote:

### 1. **Excessive Meeting Reference Cycling**
```
MeetingScreenSimple.tsx:204 [MeetingScreen] Setting meeting reference
MediaService.ts:174 [MediaService] Meeting reference set: true
MeetingScreenSimple.tsx:211 [MeetingScreen] Clearing meeting reference
MediaService.ts:174 [MediaService] Meeting reference set: false
```
The meeting reference was being set and cleared rapidly, causing participant state confusion.

### 2. **Participant ID Conflicts Between Calls**
```
[ParticipantVideo] Participant hb5if15h: Object
[ParticipantVideo] Participant 8r3somoe: Object
[ParticipantVideo] Participant igqxjqjl: Object
```
Different participant IDs appearing in logs shows participant state bleeding between calls.

### 3. **Multiple Component Instances**
```
MeetingScreenSimple.tsx:304 [MeetingScreen] Component unmounting, performing comprehensive cleanup
MeetingScreenSimple.tsx:304 [MeetingScreen] Component unmounting, performing comprehensive cleanup
```
Multiple instances of MeetingScreen were unmounting simultaneously, indicating component lifecycle issues.

## Fixes Applied

### 1. **Enhanced Meeting Reference Management**
- Added session-specific meeting reference tracking
- Prevented multiple reference sets for the same session
- Added proper cleanup when replacing meeting references

### 2. **Participant State Isolation**
- Added participant state validation for new sessions
- Enhanced participant filtering to prevent local/remote confusion
- Added cross-session validation to detect bleeding

### 3. **Component Instance Control**
- Added unique component ID tracking
- Force new MeetingProvider instance for each session using key prop
- Enhanced logging to track component lifecycle

### 4. **Comprehensive State Cleanup**
- Enhanced VideoSDK service reset to clear participant cache
- Added WebRTC connection cleanup
- Improved MediaService cleanup to stop previous streams

### 5. **Session-Specific State Management**
- Added lastSessionId tracking to detect session changes
- Force participant state reset on new sessions
- Added validation delays to ensure state clearing is complete

## Key Changes Made

### MeetingScreenSimple.tsx
- Added participant state validation refs
- Enhanced meeting reference management with session tracking
- Improved participant filtering with cross-session validation
- Added component instance tracking with unique keys

### MediaService.ts
- Enhanced `setMeetingRef()` to prevent duplicate sets and clean up previous meetings
- Improved `ensureCleanState()` with proper stream cleanup and participant clearing
- Added delay to ensure cleanup completion

### VideoSDKService.ts
- Enhanced `reset()` method to clear participant cache and WebRTC state
- Added comprehensive global state cleanup

### CallStateCleanup.ts
- Enhanced participant cache clearing with internal VideoSDK state cleanup
- Added timeout for state clearing completion

## Expected Results

After these fixes, you should see:

1. **No More Participant ID Bleeding**: Each call should have clean participant state
2. **Proper Local/Remote Distinction**: Local participant won't appear as remote in subsequent calls
3. **Reduced Log Noise**: Less excessive meeting reference cycling
4. **Better Component Isolation**: Each call gets a fresh MeetingProvider instance

## Monitoring

Watch for these improvements in your logs:
- Fewer "Setting/Clearing meeting reference" cycles
- Consistent participant IDs per session
- Proper participant validation messages
- No more local participants appearing as remote

The key insight was that VideoSDK participant state was bleeding between calls due to insufficient cleanup and component reuse. The fixes ensure complete state isolation between calls.
