# Feature Documentation — Push Notifications (Notifee + FCM)

## Category
Newly added / recently enhanced feature

## Goal
Support notifications for general events and **incoming calls**, including foreground/background/killed-state handling.

## Key files
- `Adtip/App.tsx`
- `Adtip/src/services/FirebaseService.ts` (setup/registration — referenced from App)
- `Adtip/src/services/notification/NotifeeCallHandler.tsx`

## Flow overview (high level)
1. App starts (`Adtip/App.tsx`).
2. Background init triggers:
   - Firebase messaging setup
   - Notification listeners
   - Notifee handler initialization
3. When a Notifee event occurs:
   - `NotifeeCallHandler.handleNotificationEvent(...)` runs
   - For call notifications, it routes to call handling / navigation.

## Killed-state handling (important)
In `Adtip/App.tsx`, there is logic that:
- checks `messaging().getInitialNotification()`
- detects `data.type === 'incoming_call'`
- attempts to navigate to Meeting screen
- initializes call store / persistence

This is the core of “open the call screen when user taps notification while app was killed”.

## Data contract expected in notification
The handler expects fields like:
- `type` (e.g., `incoming_call`)
- `meetingId`
- `token`
- `callerName`
- `callType` (`voice` | `video`)
- optional `sessionId`

## Known risks / related bug docs
- See `vidya/bug_reports/navigation_memory_leak.md` for listener duplication risk.

## How to test (step-by-step)
### Foreground
1. Open app.
2. Trigger an incoming call notification.
3. Tap "answer".
4. Confirm meeting screen opens.

### Background
1. Put app in background.
2. Trigger incoming call.
3. Tap notification action.
4. Confirm app opens + routes to meeting.

### Killed state
1. Force-kill the app.
2. Trigger incoming call.
3. Tap notification.
4. Confirm app launches and navigates to meeting.

## Troubleshooting
- If navigation doesn’t happen:
  - check `navigationRef.isReady()` logic
  - check log output around killed-state handling in `App.tsx`
- If actions fire twice:
  - suspect duplicate Notifee handler registrations
