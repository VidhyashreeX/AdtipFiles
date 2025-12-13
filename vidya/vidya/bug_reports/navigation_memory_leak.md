# Bug Report — Navigation / Listener Memory Leak Risk

## Category
Critical / Complex bug

## Summary
There is a **high risk of duplicated event listeners** (and memory/performance issues over time) due to notification handler initialization patterns, especially around Notifee event registrations.

## Why this is likely a real issue in this codebase
In `Adtip/src/services/notification/NotifeeCallHandler.tsx`, `initialize()` registers:
- `notifee.onForegroundEvent(...)`
- `notifee.onBackgroundEvent(...)`

These registration methods typically return an **unsubscribe function**.

However, the current code:
- Registers listeners every time `initialize()` is called.
- Does **not store/cleanup** unsubscribe functions.

Even though a comment says “safe because Notifee handles multiple registrations gracefully”, **multiple registrations can still cause**:
- repeated handler executions
- increased memory usage
- hard-to-debug navigation duplication

### Primary locations
- `Adtip/src/services/notification/NotifeeCallHandler.tsx`
- `Adtip/App.tsx` (calls Notifee handler initialization in background initialization)

## Symptoms you may see
- Increasing memory usage during long sessions
- Multiple navigations/duplicate actions on a single notification press
- Call screen opening multiple times
- Logs repeating for the same event (`[NotifeeCallHandler] ... event`)

## Steps to reproduce (practical)
1. Launch the app.
2. Trigger incoming-call notifications multiple times.
3. Put the app in background / kill & reopen.
4. Repeat steps 1–3 for several cycles.
5. Observe:
   - duplicated logs
   - multiple navigations
   - performance degradation

## Expected behavior
- Only **one** foreground handler and **one** background handler are active.
- Each notification press triggers a single navigation/action.

## Actual behavior (risk)
- Event handlers can be registered multiple times without cleanup.

## Evidence / code reference
File: `Adtip/src/services/notification/NotifeeCallHandler.tsx`
- `notifee.onForegroundEvent(...)`
- `notifee.onBackgroundEvent(...)`

## Recommended fix direction (implementation idea)
- Store unsubscribe functions returned by Notifee registrations.
- Only register once OR clean up before re-registering.
- Example approach:
  - keep `private unsubscribeForeground?: () => void;`
  - keep `private unsubscribeBackground?: () => void;`
  - on `initialize()`:
    - if already set, call them before re-registering

## Screenshots / logs to attach
- Android Studio Profiler / Xcode Instruments memory graph
- Logs showing duplicated event handling for a single notification

## Notes
This bug is categorized as **Critical/Complex** because it impacts:
- performance
- stability
- call/navigation correctness
