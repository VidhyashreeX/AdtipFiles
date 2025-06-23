# Adtip-ReactNative Calling Feature Documentation

This document provides a comprehensive overview of the calling feature's architecture and flow within the Adtip-ReactNative application. It details the technologies used, the core services involved, and the step-by-step process of making, receiving, and ending a call.

## 1. Core Technologies & Versions

The calling feature is built upon a stack of modern services and libraries to provide real-time communication.

| Package / Service                 | Version | Role                                                              |
| --------------------------------- | ------- | ----------------------------------------------------------------- |
| `react-native`                    | 0.79.2  | Core mobile application framework.                                |
| `@videosdk.live/react-native-sdk` | ^0.3.4  | Primary SDK for handling video and audio streaming (WebRTC).      |
| `@react-native-firebase/app`      | ^22.2.1 | Core Firebase integration.                                        |
| `@react-native-firebase/messaging`| ^22.2.1 | Handles receiving push notifications (FCM) for incoming calls.    |
| `@react-native-firebase/firestore`| ^22.2.1 | Used for real-time signaling and call state synchronization.      |
| `@notifee/react-native`           | ^9.1.8  | Displays local notifications, including the incoming call UI.     |
| `react-native-voip-push-notification` | ^3.3.3 | Handles iOS-specific VoIP push notifications for reliable call delivery. |

*Package versions are sourced from `Adtip/package.json`.*

## 2. Architectural Overview

The system is designed around a set of decoupled services that manage different aspects of the call lifecycle. This ensures maintainability and separation of concerns.

*   **`WhatsAppCallManager.ts`**: The central orchestrator. It acts as the main entry point for all call actions (starting, answering, ending) and coordinates the other services.
*   **`VideoSDKService.ts`**: A singleton service that abstracts all direct interactions with the VideoSDK platform. It's responsible for creating meetings and generating participant tokens.
*   **`ApiService.ts`**: The application's network layer. It communicates with the Adtip backend to securely request meeting details from the VideoSDK API, preventing client-side exposure of API keys.
*   **`CallNotificationHandler.ts`**: Processes incoming call notifications from FCM. It uses Notifee to display the native-style incoming call UI, even when the app is in the background or terminated.
*   **`FirebaseService.ts`**: Manages real-time call state changes (e.g., `ringing`, `connected`, `ended`) using Firestore, ensuring both caller and callee are in sync.
*   **`MeetingScreen.tsx`**: The React component for the active call UI. It utilizes the `MeetingProvider` and `useMeeting` hook from the VideoSDK to manage the in-call state (mute, video, participants, etc.).

## 3. Detailed Call Flow

### A. Outgoing Call Initiation (Caller's Side)

This flow begins when a user initiates a call to another user.

1.  **Trigger Call**: A user action (e.g., pressing a call button) invokes `WhatsAppCallManager.startOutgoingCall`.

2.  **Create VideoSDK Meeting**: The `WhatsAppCallManager` requests a new meeting from the backend.
    *   It calls `ApiService.generateVideoSDKToken()` to get a temporary authentication token.
    *   It then calls `ApiService.createVideoSDKMeeting(token)` to create a unique room. The backend returns a `meetingId`.

    ```typescript
    // filepath: Adtip/src/services/calling/WhatsAppCallManager.ts
    // ...existing code...
    const videoSDKService = VideoSDKService.getInstance();
    const token = await videoSDKService.generateParticipantToken();
    if (!token) {
      throw new Error('Failed to generate VideoSDK token');
    }
    const meetingId = await videoSDKService.createMeeting(token);
    if (!meetingId) {
      throw new Error('Failed to create VideoSDK meeting');
    }
    // ...existing code...
    ```

3.  **Notify Recipient**: The `WhatsAppCallManager` sends the call invitation to the recipient. This involves:
    *   Making an API call to the backend to trigger an FCM push notification to the recipient's device.
    *   The FCM payload includes the `meetingId`, `token`, and caller's information.
    *   Simultaneously, a call document is created in Firestore with an initial `status: 'ringing'`.

4.  **Navigate to Meeting Screen**: The caller's app navigates to the `MeetingScreen`, passing the `meetingId` and `token` as props.

5.  **Join Meeting**: The `MeetingScreen` component uses the `MeetingProvider` from VideoSDK, which automatically handles joining the meeting with the provided credentials.

    ```typescript
    // filepath: Adtip/src/screens/videosdk/MeetingScreen.tsx
    // ...existing code...
    return (
      <MeetingProvider
        config={{
          meetingId: meetingId,
          micEnabled: micOn,
          webcamEnabled: webcamOn,
          name: localParticipant?.displayName || 'Participant',
          notification: {
            title: 'Adtip Call',
            message: 'You are in a call.',
          },
        }}
        token={token}>
        <MeetingView ... />
      </MeetingProvider>
    );
    // ...existing code...
    ```

### B. Incoming Call Reception (Callee's Side)

This flow is triggered when a device receives the FCM message for an incoming call.

1.  **Receive FCM Message**: The app's Firebase listener, configured in `index.js`, receives the data-only FCM message.
    ```javascript
    // filepath: Adtip/index.js
    // ...existing code...
    // Register VideoSDK FIRST - Critical for proper initialization
    register();
    console.log('[Index] VideoSDK registered successfully');
    
    messaging().setBackgroundMessageHandler(CallNotificationHandler.onRemoteMessage);
    // ...existing code...
    ```

2.  **Handle Notification**: The message is passed to `CallNotificationHandler.onRemoteMessage`. This handler parses the payload to extract call details.

3.  **Display Incoming Call UI**: The handler uses `@notifee/react-native` to display a full-screen incoming call notification. This UI is highly persistent and works on a locked screen. It includes "Answer" and "Decline" action buttons.

    ```typescript
    // filepath: Adtip/src/services/calling/CallNotificationHandler.ts
    // ...existing code...
    await notifee.displayNotification({
      title: `<p style="color: #00D4AA;"><b>${callerName} is calling</b></p>`,
      body: 'Incoming Call from Adtip',
      data: notificationData,
      android: {
        // ...
        channelId: 'calls',
        asForegroundService: true,
        pressAction: { id: 'default' },
        actions: [
          { title: 'Decline', pressAction: { id: 'decline_call' } },
          { title: 'Answer', pressAction: { id: 'answer_call' }, launchActivity: 'default' },
        ],
        fullScreenAction: { id: 'default', launchActivity: 'default' },
      },
    });
    // ...existing code...
    ```

4.  **User Action**:
    *   **Answer**: If the user taps "Answer", an event listener triggers `WhatsAppCallManager.answerCall`. The app is brought to the foreground and navigates to the `MeetingScreen`, joining the call using the `meetingId` and `token` from the notification.
    *   **Decline**: If the user taps "Decline", `WhatsAppCallManager.endCall` is triggered. It updates the call status in Firestore to `declined` and dismisses the notification. The caller is notified via the real-time Firestore listener.

### C. Active Call & State Management

Once both participants are in the meeting, the `MeetingScreen` is the active component for both.

*   **Hooks**: The `useVideoSDKMeeting` custom hook (which wraps VideoSDK's `useMeeting`) provides all necessary functions (`leave`, `toggleMic`, `toggleWebcam`) and state variables (`participants`, `localParticipant`).
*   **Events**: The component listens to events like `onParticipantJoined` or `onParticipantLeft` to update the UI in real-time, for example, by changing the participant count.
*   **Leaving**: The `useEffect` hook in `MeetingScreen.tsx` ensures that if the component unmounts for any reason (e.g., navigating back), the `leave()` function is called to properly exit the VideoSDK meeting.

### D. Ending a Call

A call can be ended by either participant.

1.  **Trigger End Call**: The user presses the "End Call" button in the `MeetingView`.
2.  **Leave Meeting**: This action calls the `leave()` function provided by the `useMeeting` hook. This signals to the VideoSDK servers that the local user is leaving the room.
3.  **Cleanup**: The `onMeetingLeft` callback is triggered. Inside this callback, `WhatsAppCallManager.endCall` is invoked to perform the final cleanup:
    *   Update the call status in Firestore to `ended`.
    *   Stop any foreground services.
    *   Navigate the user away from the `MeetingScreen` back to the main app.