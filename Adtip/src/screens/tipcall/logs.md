TabNavigator: Instant navigation to TipCall
ApiService.ts:979 [API] Fetching users with data: {
  "id": 0,
  "page": 1,
  "limit": 20,
  "language": [],
  "interest": [],
  "user_id": null,
  "search_by_name": "",
  "loggined_user_id": 58422,
  "sortBy": {}
}
ApiService.ts:214 Request to protected endpoint: /api/users. Attempting to add Authorization header.
ApiService.ts:214 Request to protected endpoint: /api/missed-calls/58422. Attempting to add Authorization header.
BlocklistService.ts:60 [BlocklistService] Loaded 0 blocked users from storage
BlocklistService.ts:43 [BlocklistService] Initialized with 0 blocked users
BlocklistService.ts:162 [BlocklistService] Getting all blocked users, count: 0
ApiService.ts:221 Authorization header added to request for: /api/users
ApiService.ts:228 🚀 API REQUEST: {method: 'POST', url: '/api/users', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/users', headers: {…}, params: undefined, data: {…}, timeout: 60000, timestamp: '2025-07-08T18:21:27.779Z'}
ApiService.ts:221 Authorization header added to request for: /api/missed-calls/58422
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/missed-calls/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/missed-calls/58422', headers: {…}, params: {…}, data: undefined, timeout: 60000, timestamp: '2025-07-08T18:21:27.783Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/missed-calls/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/missed-calls/58422', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T18:21:28.126Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'POST', url: '/api/users', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/users', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T18:21:30.852Z'}
ApiService.ts:979 [API] Fetching users with data: {
  "id": 0,
  "page": 1,
  "limit": 20,
  "language": [],
  "interest": [],
  "user_id": null,
  "search_by_name": "R",
  "loggined_user_id": 58422,
  "sortBy": {}
}
ApiService.ts:214 Request to protected endpoint: /api/users. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/users
ApiService.ts:228 🚀 API REQUEST: {method: 'POST', url: '/api/users', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/users', headers: {…}, params: undefined, data: {…}, timeout: 60000, timestamp: '2025-07-08T18:21:31.360Z'}
ApiService.ts:979 [API] Fetching users with data: {
  "id": 0,
  "page": 1,
  "limit": 20,
  "language": [],
  "interest": [],
  "user_id": null,
  "search_by_name": "R17",
  "loggined_user_id": 58422,
  "sortBy": {}
}
ApiService.ts:214 Request to protected endpoint: /api/users. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/users
ApiService.ts:228 🚀 API REQUEST: {method: 'POST', url: '/api/users', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/users', headers: {…}, params: undefined, data: {…}, timeout: 60000, timestamp: '2025-07-08T18:21:31.967Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'POST', url: '/api/users', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/users', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T18:21:32.093Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'POST', url: '/api/users', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/users', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T18:21:32.599Z'}
CallBillingService.ts:76 [CallBillingService] Calculating billing for: {userId: '58422', callType: 'video', currentBalance: 1000, isPremium: false}
CallBillingService.ts:100 [CallBillingService] Calculated billing: {ratePerMinute: 14, maxMinutes: 71, maxDurationSeconds: 4260, warningThresholds: Array(5)}
CallController.ts:313 [CallController] Starting video call to R17BKP
VideoSDKService.ts:44 [VideoSDK] Already initialized
VideoSDKService.ts:151 [VideoSDK] Generating participant token via backend
ApiService.ts:214 Request to protected endpoint: /api/generate-token/videosdk. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/generate-token/videosdk
ApiService.ts:228 🚀 API REQUEST: {method: 'POST', url: '/api/generate-token/videosdk', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/generate-token/videosdk', headers: {…}, params: undefined, data: {…}, timeout: 60000, timestamp: '2025-07-08T18:21:33.676Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'POST', url: '/api/generate-token/videosdk', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/generate-token/videosdk', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T18:21:33.712Z'}
VideoSDKService.ts:110 [VideoSDK] Creating meeting via backend API
ApiService.ts:214 Request to protected endpoint: /api/create-meeting/videosdk. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/create-meeting/videosdk
ApiService.ts:228 🚀 API REQUEST: {method: 'POST', url: '/api/create-meeting/videosdk', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/create-meeting/videosdk', headers: {…}, params: undefined, data: {…}, timeout: 60000, timestamp: '2025-07-08T18:21:33.721Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'POST', url: '/api/create-meeting/videosdk', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/create-meeting/videosdk', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T18:21:33.793Z'}
ApiService.ts:1308 [ApiService] Create VideoSDK meeting response: {success: true, data: {…}, message: 'Meeting created successfully'}
VideoSDKService.ts:115 [VideoSDK] Raw API response: {success: true, data: {…}, message: 'Meeting created successfully'}
VideoSDKService.ts:119 [VideoSDK] Meeting created: 413u-advb-zium
ApiService.ts:870 [ApiService] Getting FCM token for single user: 58422
ApiService.ts:214 Request to protected endpoint: /api/get-fcm-token/58422. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/get-fcm-token/58422
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', headers: {…}, params: undefined, data: undefined, timeout: 60000, timestamp: '2025-07-08T18:21:33.814Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T18:21:33.871Z'}
ApiService.ts:873 [ApiService] Single user FCM token response: {status: true, fcm_token: 'c3D2_peXS3-T8-KgvaqJrR:APA91bFWlaxBWCmv-AWLCEPrVPUdQNbaAlz7QUA7pQL-pfo4UYneZXxCBEA0z77zLzyOCiiuNkfjJzWloNtgg6Jk2x_Z2sOw73TMPiTdfqU9izXknJXjRzw'}
ApiService.ts:876 [ApiService] Successfully extracted FCM token for user 58422: c3D2_peXS3-T8-KgvaqJrR:APA91bFWlaxBWCmv-AWLCEPrVPUdQNbaAlz7QUA7pQL-pfo4UYneZXxCBEA0z77zLzyOCiiuNkfjJzWloNtgg6Jk2x_Z2sOw73TMPiTdfqU9izXknJXjRzw
ApiService.ts:870 [ApiService] Getting FCM token for single user: 63779
ApiService.ts:214 Request to protected endpoint: /api/get-fcm-token/63779. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/get-fcm-token/63779
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/get-fcm-token/63779', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/63779', headers: {…}, params: undefined, data: undefined, timeout: 60000, timestamp: '2025-07-08T18:21:33.882Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/get-fcm-token/63779', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/63779', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T18:21:33.942Z'}
ApiService.ts:873 [ApiService] Single user FCM token response: {status: true, fcm_token: 'ckOrGpJHQ-mtE6jEks9e8x:APA91bFc6mMfPfJyecmMuDZJjl_qW9H-ABdjkYjOEGo8dK2IESfnJvhxz9osyvbL6RklrMKiULffIv692PnYDR2kmuVJYnTPoy7DT1rrj1Pzku66wYwYWL4'}
ApiService.ts:876 [ApiService] Successfully extracted FCM token for user 63779: ckOrGpJHQ-mtE6jEks9e8x:APA91bFc6mMfPfJyecmMuDZJjl_qW9H-ABdjkYjOEGo8dK2IESfnJvhxz9osyvbL6RklrMKiULffIv692PnYDR2kmuVJYnTPoy7DT1rrj1Pzku66wYwYWL4
ApiService.ts:1319 🚀 [ApiService] Making direct call to FCM Server for initiate-call: https://us-central1-adtip-3873c.cloudfunctions.net/callApi
ApiService.ts:1320 🚀 [ApiService] Payload with callType: {
  "calleeInfo": {
    "platform": "ANDROID",
    "token": "ckOrGpJHQ-mtE6jEks9e8x:APA91bFc6mMfPfJyecmMuDZJjl_qW9H-ABdjkYjOEGo8dK2IESfnJvhxz9osyvbL6RklrMKiULffIv692PnYDR2kmuVJYnTPoy7DT1rrj1Pzku66wYwYWL4"
  },
  "callerInfo": {
    "name": "R17 C",
    "token": "c3D2_peXS3-T8-KgvaqJrR:APA91bFWlaxBWCmv-AWLCEPrVPUdQNbaAlz7QUA7pQL-pfo4UYneZXxCBEA0z77zLzyOCiiuNkfjJzWloNtgg6Jk2x_Z2sOw73TMPiTdfqU9izXknJXjRzw"
  },
  "videoSDKInfo": {
    "meetingId": "413u-advb-zium",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiI2MjU3MmY1Yy01NmFkLTRiMjktYmFlNi01MTg2N2ZmYWI2MDkiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIiwiYWxsb3dfbW9kIl0sImlhdCI6MTc1MTk5ODg5MywiZXhwIjoxNzUyMDAwNjkzfQ.4Ptk5G7RunrR87CWHQafGj08PJKSnRF1nPpiw3uKJFM",
    "callType": "video"
  }
}
ApiService.ts:1340 ✅ [ApiService] initiate-call response: {messageId: 'projects/adtip-3873c/messages/0:1751998894462754%e9e87daaf9fd7ecd'}
CallController.ts:68 [CallController] Status changed: idle -> outgoing
VideoSDKService.ts:44 [VideoSDK] Already initialized
MeetingScreenSimple.tsx:511 [MeetingScreenSimple] Component mounted with ID: ox7c8wc58 Session: b9d3af53-faaf-472c-ae08-77ca5258552c
NavigationService.ts:69 [NavigationService] Navigating to Meeting screen with params: {meetingId: '413u-advb-zium', callType: 'video', displayName: 'R17 C', localParticipantId: 'not_provided'}
console.js:654 Bluetooth Connect Permission Granted
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: 'b9d3af53-faaf-472c-ae08-77ca5258552c', localParticipantId: undefined, totalParticipants: 0, validRemoteParticipants: 0, participantIds: Array(0), meetingId: '413u-advb-zium', hasSetMeetingRef: false, participantStateReset: false}
MeetingScreenSimple.tsx:208 [MeetingScreen] New session detected, validating participant state: {newSessionId: 'b9d3af53-faaf-472c-ae08-77ca5258552c', lastSessionId: null, localParticipantId: undefined, participantCount: 0}
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: b9d3af53-faaf-472c-ae08-77ca5258552c
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: undefined)
MeetingScreenSimple.tsx:263 [MeetingScreen] New session detected, resetting join state: b9d3af53-faaf-472c-ae08-77ca5258552c
MeetingScreenSimple.tsx:278 [MeetingScreen] Forcing participant state reset for session: b9d3af53-faaf-472c-ae08-77ca5258552c
MeetingScreenSimple.tsx:291 [MeetingScreen] Attempt 1/3 to join meeting…
MeetingScreenSimple.tsx:305 [MeetingScreen] First join after app load - adding extra delay for WebSocket stability
MeetingScreenSimple.tsx:221 [MeetingScreen] Post-session-change participant validation: {sessionId: 'b9d3af53-faaf-472c-ae08-77ca5258552c', localId: undefined, totalParticipants: 0, participantDetails: Array(0)}
MeetingScreenSimple.tsx:312 [MeetingScreen] Successfully joined meeting
CallController.ts:68 [CallController] Status changed: outgoing -> in_call
NavigationService.ts:69 [NavigationService] Navigating to Meeting screen with params: {meetingId: '413u-advb-zium', callType: 'video', displayName: 'User', localParticipantId: 'not_provided'}
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: 'b9d3af53-faaf-472c-ae08-77ca5258552c', localParticipantId: 'ioriztdb', totalParticipants: 1, validRemoteParticipants: 0, participantIds: Array(1), meetingId: '413u-advb-zium', hasSetMeetingRef: false, participantStateReset: true}
MeetingScreenSimple.tsx:51 [ParticipantVideo] Participant ioriztdb: {displayName: 'User', webcamOn: false, hasStream: false, streamId: undefined, hasTrack: false, isLocal: true, passedIsLocal: true, actualIsLocal: true}
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: b9d3af53-faaf-472c-ae08-77ca5258552c
MediaService.ts:201 [MediaService] Replacing existing meeting reference - cleaning up previous
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: 413u-advb-zium)
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: 'b9d3af53-faaf-472c-ae08-77ca5258552c', localParticipantId: 'ioriztdb', totalParticipants: 1, validRemoteParticipants: 0, participantIds: Array(1), meetingId: '413u-advb-zium', hasSetMeetingRef: true, participantStateReset: true}
MeetingScreenSimple.tsx:248 [MeetingScreen] Clearing meeting reference for session: b9d3af53-faaf-472c-ae08-77ca5258552c
MediaService.ts:216 [MediaService] Meeting reference set: false 
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: b9d3af53-faaf-472c-ae08-77ca5258552c
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: 413u-advb-zium)
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: 'b9d3af53-faaf-472c-ae08-77ca5258552c', localParticipantId: 'ioriztdb', totalParticipants: 1, validRemoteParticipants: 0, participantIds: Array(1), meetingId: '413u-advb-zium', hasSetMeetingRef: true, participantStateReset: true}
MeetingScreenSimple.tsx:248 [MeetingScreen] Clearing meeting reference for session: b9d3af53-faaf-472c-ae08-77ca5258552c
MediaService.ts:216 [MediaService] Meeting reference set: false 
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: b9d3af53-faaf-472c-ae08-77ca5258552c
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: 413u-advb-zium)
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: 'b9d3af53-faaf-472c-ae08-77ca5258552c', localParticipantId: 'ioriztdb', totalParticipants: 1, validRemoteParticipants: 0, participantIds: Array(1), meetingId: '413u-advb-zium', hasSetMeetingRef: true, participantStateReset: true}
MeetingScreenSimple.tsx:248 [MeetingScreen] Clearing meeting reference for session: b9d3af53-faaf-472c-ae08-77ca5258552c
MediaService.ts:216 [MediaService] Meeting reference set: false 
MeetingScreenSimple.tsx:51 [ParticipantVideo] Participant ioriztdb: {displayName: 'User', webcamOn: true, hasStream: true, streamId: '793e84f7-33d6-4158-937b-396a5252ca26', hasTrack: true, isLocal: true, passedIsLocal: true, actualIsLocal: true}
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: b9d3af53-faaf-472c-ae08-77ca5258552c
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: 413u-advb-zium)
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: 'b9d3af53-faaf-472c-ae08-77ca5258552c', localParticipantId: 'ioriztdb', totalParticipants: 1, validRemoteParticipants: 0, participantIds: Array(1), meetingId: '413u-advb-zium', hasSetMeetingRef: true, participantStateReset: true}
MeetingScreenSimple.tsx:248 [MeetingScreen] Clearing meeting reference for session: b9d3af53-faaf-472c-ae08-77ca5258552c
MediaService.ts:216 [MediaService] Meeting reference set: false 
MeetingScreenSimple.tsx:51 [ParticipantVideo] Participant ioriztdb: {displayName: 'User', webcamOn: true, hasStream: false, streamId: undefined, hasTrack: false, isLocal: true, passedIsLocal: true, actualIsLocal: true}
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: b9d3af53-faaf-472c-ae08-77ca5258552c
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: 413u-advb-zium)
MeetingScreenSimple.tsx:51 [ParticipantVideo] Participant ioriztdb: {displayName: 'User', webcamOn: false, hasStream: false, streamId: undefined, hasTrack: false, isLocal: true, passedIsLocal: true, actualIsLocal: true}
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: 'b9d3af53-faaf-472c-ae08-77ca5258552c', localParticipantId: 'ioriztdb', totalParticipants: 1, validRemoteParticipants: 0, participantIds: Array(1), meetingId: '413u-advb-zium', hasSetMeetingRef: true, participantStateReset: true}
MeetingScreenSimple.tsx:248 [MeetingScreen] Clearing meeting reference for session: b9d3af53-faaf-472c-ae08-77ca5258552c
MediaService.ts:216 [MediaService] Meeting reference set: false 
MeetingScreenSimple.tsx:51 [ParticipantVideo] Participant ioriztdb: {displayName: 'User', webcamOn: true, hasStream: true, streamId: '215853f4-a39a-4241-930e-57d5522597cd', hasTrack: true, isLocal: true, passedIsLocal: true, actualIsLocal: true}
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: b9d3af53-faaf-472c-ae08-77ca5258552c
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: 413u-advb-zium)
CallController.ts:68 [CallController] Status changed: in_call -> ended
ApiService.ts:1352 [ApiService] Sending call signal to recipient: 63779 {type: 'CALL_END', sessionId: 'b9d3af53-faaf-472c-ae08-77ca5258552c'}
ApiService.ts:870 [ApiService] Getting FCM token for single user: 63779
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: 'b9d3af53-faaf-472c-ae08-77ca5258552c', localParticipantId: 'ioriztdb', totalParticipants: 1, validRemoteParticipants: 0, participantIds: Array(1), meetingId: '413u-advb-zium', hasSetMeetingRef: true, participantStateReset: true}
MeetingScreenSimple.tsx:248 [MeetingScreen] Clearing meeting reference for session: b9d3af53-faaf-472c-ae08-77ca5258552c
MediaService.ts:216 [MediaService] Meeting reference set: false 
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: b9d3af53-faaf-472c-ae08-77ca5258552c
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: 413u-advb-zium)
ApiService.ts:214 Request to protected endpoint: /api/get-fcm-token/63779. Attempting to add Authorization header.
CallController.ts:235 [CallController] Starting comprehensive cleanup
callStateCleanup.ts:74 [CallStateCleanup] Starting comprehensive cleanup
callStateCleanup.ts:110 [CallStateCleanup] Cleaning up media service
MediaService.ts:103 [MediaService] Starting comprehensive meeting cleanup
MediaService.ts:107 [MediaService] Leaving meeting with timeout protection
MediaService.ts:115 [MediaService] Successfully left meeting
MediaService.ts:124 [MediaService] Force clearing meeting reference
VideoSDKService.ts:187 [VideoSDK] Starting comprehensive service reset
VideoSDKService.ts:216 [VideoSDK] Forcing WebRTC connection cleanup
VideoSDKService.ts:224 [VideoSDK] Service reset complete
MediaService.ts:151 [MediaService] Comprehensive meeting cleanup completed
callStateCleanup.ts:134 [CallStateCleanup] Resetting VideoSDK service
VideoSDKService.ts:187 [VideoSDK] Starting comprehensive service reset
VideoSDKService.ts:216 [VideoSDK] Forcing WebRTC connection cleanup
VideoSDKService.ts:224 [VideoSDK] Service reset complete
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: 'b9d3af53-faaf-472c-ae08-77ca5258552c', localParticipantId: undefined, totalParticipants: 0, validRemoteParticipants: 0, participantIds: Array(0), meetingId: '413u-advb-zium', hasSetMeetingRef: true, participantStateReset: true}
MeetingScreenSimple.tsx:248 [MeetingScreen] Clearing meeting reference for session: b9d3af53-faaf-472c-ae08-77ca5258552c
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: b9d3af53-faaf-472c-ae08-77ca5258552c
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: undefined)
BlocklistService.ts:60 [BlocklistService] Loaded 0 blocked users from storage
BlocklistService.ts:43 [BlocklistService] Initialized with 0 blocked users
BlocklistService.ts:162 [BlocklistService] Getting all blocked users, count: 0
ApiService.ts:221 Authorization header added to request for: /api/get-fcm-token/63779
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/get-fcm-token/63779', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/63779', headers: {…}, params: undefined, data: undefined, timeout: 60000, timestamp: '2025-07-08T18:21:43.929Z'}
callStateCleanup.ts:148 [CallStateCleanup] Cleaning up call store
callStoreSimplified.ts:57 [CallStore] Performing comprehensive reset
CallController.ts:68 [CallController] Status changed: ended -> idle
callStoreSimplified.ts:63 [CallStore] Reset complete
callStateCleanup.ts:160 [CallStateCleanup] Cleaning up WebRTC connections
MeetingScreenSimple.tsx:248 [MeetingScreen] Clearing meeting reference for session: b9d3af53-faaf-472c-ae08-77ca5258552c
MediaService.ts:216 [MediaService] Meeting reference set: false 
MeetingScreenSimple.tsx:344 [MeetingScreen] Component unmounting, performing comprehensive cleanup
MeetingScreenSimple.tsx:349 [MeetingScreen] Leaving meeting on cleanup
MeetingScreenSimple.tsx:373 [MeetingScreen] Component cleanup complete
MeetingScreenSimple.tsx:514 [MeetingScreenSimple] Component unmounting with ID: ox7c8wc58 Session: b9d3af53-faaf-472c-ae08-77ca5258552c
MeetingScreenSimple.tsx:511 [MeetingScreenSimple] Component mounted with ID: ox7c8wc58 Session: undefined
callStateCleanup.ts:191 [CallStateCleanup] Clearing participant cache
callStateCleanup.ts:233 [CallStateCleanup] Forcing garbage collection
callStateCleanup.ts:95 [CallStateCleanup] Comprehensive cleanup completed successfully
MeetingScreenSimple.tsx:356 [MeetingScreen] Successfully left meeting on cleanup
CallController.ts:242 [CallController] Comprehensive cleanup complete
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/get-fcm-token/63779', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/63779', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T18:21:44.871Z'}
ApiService.ts:873 [ApiService] Single user FCM token response: {status: true, fcm_token: 'ckOrGpJHQ-mtE6jEks9e8x:APA91bFc6mMfPfJyecmMuDZJjl_qW9H-ABdjkYjOEGo8dK2IESfnJvhxz9osyvbL6RklrMKiULffIv692PnYDR2kmuVJYnTPoy7DT1rrj1Pzku66wYwYWL4'}
ApiService.ts:876 [ApiService] Successfully extracted FCM token for user 63779: ckOrGpJHQ-mtE6jEks9e8x:APA91bFc6mMfPfJyecmMuDZJjl_qW9H-ABdjkYjOEGo8dK2IESfnJvhxz9osyvbL6RklrMKiULffIv692PnYDR2kmuVJYnTPoy7DT1rrj1Pzku66wYwYWL4
callStateCleanup.ts:223 [CallStateCleanup] Participant cache clearing completed
ApiService.ts:870 [ApiService] Getting FCM token for single user: 58422
ApiService.ts:214 Request to protected endpoint: /api/get-fcm-token/58422. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/get-fcm-token/58422
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', headers: {…}, params: undefined, data: undefined, timeout: 60000, timestamp: '2025-07-08T18:21:44.885Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T18:21:44.933Z'}
ApiService.ts:873 [ApiService] Single user FCM token response: {status: true, fcm_token: 'c3D2_peXS3-T8-KgvaqJrR:APA91bFWlaxBWCmv-AWLCEPrVPUdQNbaAlz7QUA7pQL-pfo4UYneZXxCBEA0z77zLzyOCiiuNkfjJzWloNtgg6Jk2x_Z2sOw73TMPiTdfqU9izXknJXjRzw'}
ApiService.ts:876 [ApiService] Successfully extracted FCM token for user 58422: c3D2_peXS3-T8-KgvaqJrR:APA91bFWlaxBWCmv-AWLCEPrVPUdQNbaAlz7QUA7pQL-pfo4UYneZXxCBEA0z77zLzyOCiiuNkfjJzWloNtgg6Jk2x_Z2sOw73TMPiTdfqU9izXknJXjRzw
ApiService.ts:1406 🚀 [ApiService] Making direct call to FCM Server for update-call: https://us-central1-adtip-3873c.cloudfunctions.net/callApi
ApiService.ts:1449 📤 [ApiService] updateCallStatus validated payload: {
  "callerInfo": {
    "token": "c3D2_peXS3-T8-KgvaqJrR:APA91bFWlaxBWCmv-AWLCEPrVPUdQNbaAlz7QUA7pQL-pfo4UYneZXxCBEA0z77zLzyOCiiuNkfjJzWloNtgg6Jk2x_Z2sOw73TMPiTdfqU9izXknJXjRzw",
    "name": "Unknown Caller",
    "platform": "ANDROID"
  },
  "type": "CALL_END"
}
ApiService.ts:1453 🔑 [ApiService] Auth token available: true
ApiService.ts:1466 🚀 [ApiService] Request headers: {Content-Type: 'application/json', Accept: 'application/json', Authorization: 'Bearer [REDACTED]'}
ApiService.ts:1477 ✅ [ApiService] update-call response: {messageId: 'projects/adtip-3873c/messages/0:1751998905252058%e9e87daaf9fd7ecd'}
MediaService.ts:103 [MediaService] Starting comprehensive meeting cleanup
VideoSDKService.ts:187 [VideoSDK] Starting comprehensive service reset
VideoSDKService.ts:216 [VideoSDK] Forcing WebRTC connection cleanup
VideoSDKService.ts:224 [VideoSDK] Service reset complete
MediaService.ts:151 [MediaService] Comprehensive meeting cleanup completed
useFcmCallHandlers.ts:18 [FCM] Foreground message: {originalPriority: 1, priority: 1, sentTime: 1751998905242, data: {…}, from: '333436486029', messageId: '0:1751998905252058%e9e87daaf9fd7ecd', ttl: 2419200}
ApiService.ts:870 [ApiService] Getting FCM token for single user: 58422
ApiService.ts:214 Request to protected endpoint: /api/get-fcm-token/58422. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/get-fcm-token/58422
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', headers: {…}, params: undefined, data: undefined, timeout: 60000, timestamp: '2025-07-08T18:21:45.515Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T18:21:45.569Z'}
ApiService.ts:873 [ApiService] Single user FCM token response: {status: true, fcm_token: 'c3D2_peXS3-T8-KgvaqJrR:APA91bFWlaxBWCmv-AWLCEPrVPUdQNbaAlz7QUA7pQL-pfo4UYneZXxCBEA0z77zLzyOCiiuNkfjJzWloNtgg6Jk2x_Z2sOw73TMPiTdfqU9izXknJXjRzw'}
ApiService.ts:876 [ApiService] Successfully extracted FCM token for user 58422: c3D2_peXS3-T8-KgvaqJrR:APA91bFWlaxBWCmv-AWLCEPrVPUdQNbaAlz7QUA7pQL-pfo4UYneZXxCBEA0z77zLzyOCiiuNkfjJzWloNtgg6Jk2x_Z2sOw73TMPiTdfqU9izXknJXjRzw
ApiService.ts:1406 🚀 [ApiService] Making direct call to FCM Server for update-call: https://us-central1-adtip-3873c.cloudfunctions.net/callApi
ApiService.ts:1449 📤 [ApiService] updateCallStatus validated payload: {
  "callerInfo": {
    "token": "c3D2_peXS3-T8-KgvaqJrR:APA91bFWlaxBWCmv-AWLCEPrVPUdQNbaAlz7QUA7pQL-pfo4UYneZXxCBEA0z77zLzyOCiiuNkfjJzWloNtgg6Jk2x_Z2sOw73TMPiTdfqU9izXknJXjRzw",
    "name": "R17 C",
    "platform": "ANDROID"
  },
  "type": "CALL_ENDED"
}
ApiService.ts:1453 🔑 [ApiService] Auth token available: true
ApiService.ts:1466 🚀 [ApiService] Request headers: {Content-Type: 'application/json', Accept: 'application/json', Authorization: 'Bearer [REDACTED]'}
CallBillingService.ts:76 [CallBillingService] Calculating billing for: {userId: '58422', callType: 'video', currentBalance: 1000, isPremium: false}
CallBillingService.ts:100 [CallBillingService] Calculated billing: {ratePerMinute: 14, maxMinutes: 71, maxDurationSeconds: 4260, warningThresholds: Array(5)}
ApiService.ts:1477 ✅ [ApiService] update-call response: {messageId: 'projects/adtip-3873c/messages/0:1751998905877364%e9e87daaf9fd7ecd'}
callStoreSimplified.ts:57 [CallStore] Performing comprehensive reset
callStoreSimplified.ts:63 [CallStore] Reset complete
useFcmCallHandlers.ts:18 [FCM] Foreground message: {originalPriority: 1, priority: 1, sentTime: 1751998905862, data: {…}, from: '333436486029', messageId: '0:1751998905877364%e9e87daaf9fd7ecd', ttl: 2419200}
CallController.ts:313 [CallController] Starting video call to vivek P
VideoSDKService.ts:51 [VideoSDK] Initializing...
AppOpenAdManager.ts:67 App open ad failed to load: NativeError: [googleMobileAds/no-fill] No fill.
    at _handleAdEvent (http://localhost:8081/index.bundle//&platform=android&dev=true&lazy=true&minify=false&app=com.adtip.app.adtip_app&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server:138299:100)
    at apply (native)
    at emit (http://localhost:8081/index.bundle//&platform=android&dev=true&lazy=true&minify=false&app=com.adtip.app.adtip_app&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server:2907:40)
    at anonymous (http://localhost:8081/index.bundle//&platform=android&dev=true&lazy=true&minify=false&app=com.adtip.app.adtip_app&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server:140795:100)
    at apply (native)
    at emit (http://localhost:8081/index.bundle//&platform=android&dev=true&lazy=true&minify=false&app=com.adtip.app.adtip_app&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server:2907:40)
    at apply (native)
    at anonymous (http://localhost:8081/index.bundle//&platform=android&dev=true&lazy=true&minify=false&app=com.adtip.app.adtip_app&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server:2769:200)
    at emit (http://localhost:8081/index.bundle//&platform=android&dev=true&lazy=true&minify=false&app=com.adtip.app.adtip_app&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server:2785:66)
VideoSDKService.ts:60 [VideoSDK] Initialization complete
VideoSDKService.ts:151 [VideoSDK] Generating participant token via backend
ApiService.ts:214 Request to protected endpoint: /api/generate-token/videosdk. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/generate-token/videosdk
ApiService.ts:228 🚀 API REQUEST: {method: 'POST', url: '/api/generate-token/videosdk', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/generate-token/videosdk', headers: {…}, params: undefined, data: {…}, timeout: 60000, timestamp: '2025-07-08T18:21:47.861Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'POST', url: '/api/generate-token/videosdk', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/generate-token/videosdk', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T18:21:47.910Z'}
VideoSDKService.ts:110 [VideoSDK] Creating meeting via backend API
ApiService.ts:214 Request to protected endpoint: /api/create-meeting/videosdk. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/create-meeting/videosdk
ApiService.ts:228 🚀 API REQUEST: {method: 'POST', url: '/api/create-meeting/videosdk', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/create-meeting/videosdk', headers: {…}, params: undefined, data: {…}, timeout: 60000, timestamp: '2025-07-08T18:21:47.921Z'}
NavigationService.ts:107 [NavigationService] Resetting meeting navigation state
callStateCleanup.ts:74 [CallStateCleanup] Starting comprehensive cleanup
callStateCleanup.ts:110 [CallStateCleanup] Cleaning up media service
MediaService.ts:103 [MediaService] Starting comprehensive meeting cleanup
VideoSDKService.ts:187 [VideoSDK] Starting comprehensive service reset
VideoSDKService.ts:216 [VideoSDK] Forcing WebRTC connection cleanup
VideoSDKService.ts:224 [VideoSDK] Service reset complete
MediaService.ts:151 [MediaService] Comprehensive meeting cleanup completed
callStateCleanup.ts:134 [CallStateCleanup] Resetting VideoSDK service
VideoSDKService.ts:187 [VideoSDK] Starting comprehensive service reset
VideoSDKService.ts:216 [VideoSDK] Forcing WebRTC connection cleanup
VideoSDKService.ts:224 [VideoSDK] Service reset complete
ApiService.ts:253 📥 API RESPONSE: {method: 'POST', url: '/api/create-meeting/videosdk', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/create-meeting/videosdk', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T18:21:48.271Z'}
ApiService.ts:1308 [ApiService] Create VideoSDK meeting response: {success: true, data: {…}, message: 'Meeting created successfully'}
VideoSDKService.ts:115 [VideoSDK] Raw API response: {success: true, data: {…}, message: 'Meeting created successfully'}
VideoSDKService.ts:119 [VideoSDK] Meeting created: 2byx-chph-odmf
ApiService.ts:870 [ApiService] Getting FCM token for single user: 58422
ApiService.ts:214 Request to protected endpoint: /api/get-fcm-token/58422. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/get-fcm-token/58422
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', headers: {…}, params: undefined, data: undefined, timeout: 60000, timestamp: '2025-07-08T18:21:48.285Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T18:21:48.344Z'}
ApiService.ts:873 [ApiService] Single user FCM token response: {status: true, fcm_token: 'c3D2_peXS3-T8-KgvaqJrR:APA91bFWlaxBWCmv-AWLCEPrVPUdQNbaAlz7QUA7pQL-pfo4UYneZXxCBEA0z77zLzyOCiiuNkfjJzWloNtgg6Jk2x_Z2sOw73TMPiTdfqU9izXknJXjRzw'}
ApiService.ts:876 [ApiService] Successfully extracted FCM token for user 58422: c3D2_peXS3-T8-KgvaqJrR:APA91bFWlaxBWCmv-AWLCEPrVPUdQNbaAlz7QUA7pQL-pfo4UYneZXxCBEA0z77zLzyOCiiuNkfjJzWloNtgg6Jk2x_Z2sOw73TMPiTdfqU9izXknJXjRzw
ApiService.ts:870 [ApiService] Getting FCM token for single user: 50816
ApiService.ts:214 Request to protected endpoint: /api/get-fcm-token/50816. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/get-fcm-token/50816
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/get-fcm-token/50816', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/50816', headers: {…}, params: undefined, data: undefined, timeout: 60000, timestamp: '2025-07-08T18:21:48.361Z'}
callStateCleanup.ts:148 [CallStateCleanup] Cleaning up call store
callStoreSimplified.ts:57 [CallStore] Performing comprehensive reset
callStoreSimplified.ts:63 [CallStore] Reset complete
callStateCleanup.ts:160 [CallStateCleanup] Cleaning up WebRTC connections
callStateCleanup.ts:191 [CallStateCleanup] Clearing participant cache
callStateCleanup.ts:233 [CallStateCleanup] Forcing garbage collection
callStateCleanup.ts:95 [CallStateCleanup] Comprehensive cleanup completed successfully
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/get-fcm-token/50816', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/50816', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T18:21:48.517Z'}
ApiService.ts:873 [ApiService] Single user FCM token response: {status: true, fcm_token: 'cc-u78LGQOW_nHw8wEffZ8:APA91bGKb9RuVe1seUtYc1Lt1-iQkkUtw-btA4jAacmh2X5sQ5GOJU5i2IyHKUi_mML94IkOOUfjV1CKQ6Eby25nYfqrkO5WoDezL5M2UBa0dJRSqHXpfx4'}
ApiService.ts:876 [ApiService] Successfully extracted FCM token for user 50816: cc-u78LGQOW_nHw8wEffZ8:APA91bGKb9RuVe1seUtYc1Lt1-iQkkUtw-btA4jAacmh2X5sQ5GOJU5i2IyHKUi_mML94IkOOUfjV1CKQ6Eby25nYfqrkO5WoDezL5M2UBa0dJRSqHXpfx4
ApiService.ts:1319 🚀 [ApiService] Making direct call to FCM Server for initiate-call: https://us-central1-adtip-3873c.cloudfunctions.net/callApi
ApiService.ts:1320 🚀 [ApiService] Payload with callType: {
  "calleeInfo": {
    "platform": "ANDROID",
    "token": "cc-u78LGQOW_nHw8wEffZ8:APA91bGKb9RuVe1seUtYc1Lt1-iQkkUtw-btA4jAacmh2X5sQ5GOJU5i2IyHKUi_mML94IkOOUfjV1CKQ6Eby25nYfqrkO5WoDezL5M2UBa0dJRSqHXpfx4"
  },
  "callerInfo": {
    "name": "R17 C",
    "token": "c3D2_peXS3-T8-KgvaqJrR:APA91bFWlaxBWCmv-AWLCEPrVPUdQNbaAlz7QUA7pQL-pfo4UYneZXxCBEA0z77zLzyOCiiuNkfjJzWloNtgg6Jk2x_Z2sOw73TMPiTdfqU9izXknJXjRzw"
  },
  "videoSDKInfo": {
    "meetingId": "2byx-chph-odmf",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiI2MjU3MmY1Yy01NmFkLTRiMjktYmFlNi01MTg2N2ZmYWI2MDkiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIiwiYWxsb3dfbW9kIl0sImlhdCI6MTc1MTk5ODkwNywiZXhwIjoxNzUyMDAwNzA3fQ.ikkY4iPlm21Zhf08mfg6lE2VprVEVeitUd8r0nrFSjM",
    "callType": "video"
  }
}
callStateCleanup.ts:223 [CallStateCleanup] Participant cache clearing completed
ApiService.ts:1340 ✅ [ApiService] initiate-call response: {messageId: 'projects/adtip-3873c/messages/0:1751998908815757%e9e87daaf9fd7ecd'}
CallController.ts:68 [CallController] Status changed: idle -> outgoing
VideoSDKService.ts:51 [VideoSDK] Initializing...
MeetingScreenSimple.tsx:514 [MeetingScreenSimple] Component unmounting with ID: ox7c8wc58 Session: undefined
MeetingScreenSimple.tsx:511 [MeetingScreenSimple] Component mounted with ID: ox7c8wc58 Session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MeetingScreenSimple.tsx:511 [MeetingScreenSimple] Component mounted with ID: wgk3914f2 Session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
2console.js:654 Bluetooth Connect Permission Granted
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: '90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7', localParticipantId: undefined, totalParticipants: 0, validRemoteParticipants: 0, participantIds: Array(0), meetingId: '2byx-chph-odmf', hasSetMeetingRef: false, participantStateReset: false}
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: '90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7', localParticipantId: undefined, totalParticipants: 0, validRemoteParticipants: 0, participantIds: Array(0), meetingId: '2byx-chph-odmf', hasSetMeetingRef: false, participantStateReset: false}
MeetingScreenSimple.tsx:208 [MeetingScreen] New session detected, validating participant state: {newSessionId: '90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7', lastSessionId: null, localParticipantId: undefined, participantCount: 0}
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: undefined)
MeetingScreenSimple.tsx:263 [MeetingScreen] New session detected, resetting join state: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MeetingScreenSimple.tsx:278 [MeetingScreen] Forcing participant state reset for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MeetingScreenSimple.tsx:291 [MeetingScreen] Attempt 1/3 to join meeting…
MeetingScreenSimple.tsx:208 [MeetingScreen] New session detected, validating participant state: {newSessionId: '90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7', lastSessionId: null, localParticipantId: undefined, participantCount: 0}
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:201 [MediaService] Replacing existing meeting reference - cleaning up previous
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: undefined)
MeetingScreenSimple.tsx:263 [MeetingScreen] New session detected, resetting join state: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MeetingScreenSimple.tsx:278 [MeetingScreen] Forcing participant state reset for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MeetingScreenSimple.tsx:291 [MeetingScreen] Attempt 1/3 to join meeting…
VideoSDKService.ts:60 [VideoSDK] Initialization complete
NavigationService.ts:69 [NavigationService] Navigating to Meeting screen with params: {meetingId: '2byx-chph-odmf', callType: 'video', displayName: 'R17 C', localParticipantId: 'not_provided'}
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: '90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7', localParticipantId: undefined, totalParticipants: 0, validRemoteParticipants: 0, participantIds: Array(0), meetingId: '2byx-chph-odmf', hasSetMeetingRef: false, participantStateReset: false}
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:201 [MediaService] Replacing existing meeting reference - cleaning up previous
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: undefined)
MeetingScreenSimple.tsx:221 [MeetingScreen] Post-session-change participant validation: {sessionId: '90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7', localId: undefined, totalParticipants: 0, participantDetails: Array(0)}
MeetingScreenSimple.tsx:221 [MeetingScreen] Post-session-change participant validation: {sessionId: '90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7', localId: undefined, totalParticipants: 0, participantDetails: Array(0)}
2MeetingScreenSimple.tsx:305 [MeetingScreen] First join after app load - adding extra delay for WebSocket stability
AppOpenAdManager.ts:67 App open ad failed to load: NativeError: [googleMobileAds/no-fill] No fill.
    at _handleAdEvent (http://localhost:8081/index.bundle//&platform=android&dev=true&lazy=true&minify=false&app=com.adtip.app.adtip_app&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server:138299:100)
    at apply (native)
    at emit (http://localhost:8081/index.bundle//&platform=android&dev=true&lazy=true&minify=false&app=com.adtip.app.adtip_app&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server:2907:40)
    at anonymous (http://localhost:8081/index.bundle//&platform=android&dev=true&lazy=true&minify=false&app=com.adtip.app.adtip_app&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server:140795:100)
    at apply (native)
    at emit (http://localhost:8081/index.bundle//&platform=android&dev=true&lazy=true&minify=false&app=com.adtip.app.adtip_app&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server:2907:40)
    at apply (native)
    at anonymous (http://localhost:8081/index.bundle//&platform=android&dev=true&lazy=true&minify=false&app=com.adtip.app.adtip_app&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server:2769:200)
    at emit (http://localhost:8081/index.bundle//&platform=android&dev=true&lazy=true&minify=false&app=com.adtip.app.adtip_app&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server:2785:66)
MeetingScreenSimple.tsx:312 [MeetingScreen] Successfully joined meeting
CallController.ts:68 [CallController] Status changed: outgoing -> in_call
NavigationService.ts:69 [NavigationService] Navigating to Meeting screen with params: {meetingId: '2byx-chph-odmf', callType: 'video', displayName: 'User', localParticipantId: 'not_provided'}
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: '90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7', localParticipantId: 'nsnluuys', totalParticipants: 1, validRemoteParticipants: 0, participantIds: Array(1), meetingId: '2byx-chph-odmf', hasSetMeetingRef: false, participantStateReset: true}
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: '90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7', localParticipantId: undefined, totalParticipants: 0, validRemoteParticipants: 0, participantIds: Array(0), meetingId: '2byx-chph-odmf', hasSetMeetingRef: true, participantStateReset: true}
MeetingScreenSimple.tsx:248 [MeetingScreen] Clearing meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: false 
MeetingScreenSimple.tsx:51 [ParticipantVideo] Participant nsnluuys: {displayName: 'User', webcamOn: false, hasStream: false, streamId: undefined, hasTrack: false, isLocal: true, passedIsLocal: true, actualIsLocal: true}
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: 2byx-chph-odmf)
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:201 [MediaService] Replacing existing meeting reference - cleaning up previous
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: undefined)
MeetingScreenSimple.tsx:312 [MeetingScreen] Successfully joined meeting
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: '90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7', localParticipantId: 'q3ryw3db', totalParticipants: 1, validRemoteParticipants: 0, participantIds: Array(1), meetingId: '2byx-chph-odmf', hasSetMeetingRef: true, participantStateReset: true}
MeetingScreenSimple.tsx:248 [MeetingScreen] Clearing meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: false 
MeetingScreenSimple.tsx:51 [ParticipantVideo] Participant q3ryw3db: {displayName: 'User', webcamOn: false, hasStream: false, streamId: undefined, hasTrack: false, isLocal: true, passedIsLocal: true, actualIsLocal: true}
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: 2byx-chph-odmf)
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: '90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7', localParticipantId: 'nsnluuys', totalParticipants: 1, validRemoteParticipants: 0, participantIds: Array(1), meetingId: '2byx-chph-odmf', hasSetMeetingRef: true, participantStateReset: true}
MeetingScreenSimple.tsx:248 [MeetingScreen] Clearing meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: false 
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: 2byx-chph-odmf)
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: '90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7', localParticipantId: 'nsnluuys', totalParticipants: 2, validRemoteParticipants: 1, participantIds: Array(2), meetingId: '2byx-chph-odmf', hasSetMeetingRef: true, participantStateReset: true}
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: '90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7', localParticipantId: 'q3ryw3db', totalParticipants: 2, validRemoteParticipants: 1, participantIds: Array(2), meetingId: '2byx-chph-odmf', hasSetMeetingRef: true, participantStateReset: true}
MeetingScreenSimple.tsx:248 [MeetingScreen] Clearing meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: false 
MeetingScreenSimple.tsx:248 [MeetingScreen] Clearing meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MeetingScreenSimple.tsx:51 [ParticipantVideo] Participant q3ryw3db: {displayName: 'User', webcamOn: false, hasStream: false, streamId: undefined, hasTrack: false, isLocal: false, passedIsLocal: false, actualIsLocal: false}
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: 2byx-chph-odmf)
MeetingScreenSimple.tsx:51 [ParticipantVideo] Participant nsnluuys: {displayName: 'User', webcamOn: false, hasStream: false, streamId: undefined, hasTrack: false, isLocal: false, passedIsLocal: false, actualIsLocal: false}
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:201 [MediaService] Replacing existing meeting reference - cleaning up previous
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: 2byx-chph-odmf)
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: '90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7', localParticipantId: 'q3ryw3db', totalParticipants: 2, validRemoteParticipants: 1, participantIds: Array(2), meetingId: '2byx-chph-odmf', hasSetMeetingRef: true, participantStateReset: true}
MeetingScreenSimple.tsx:248 [MeetingScreen] Clearing meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: false 
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: 2byx-chph-odmf)
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: '90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7', localParticipantId: 'nsnluuys', totalParticipants: 2, validRemoteParticipants: 1, participantIds: Array(2), meetingId: '2byx-chph-odmf', hasSetMeetingRef: true, participantStateReset: true}
MeetingScreenSimple.tsx:248 [MeetingScreen] Clearing meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: false 
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: 2byx-chph-odmf)
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: '90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7', localParticipantId: 'nsnluuys', totalParticipants: 2, validRemoteParticipants: 1, participantIds: Array(2), meetingId: '2byx-chph-odmf', hasSetMeetingRef: true, participantStateReset: true}
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: '90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7', localParticipantId: 'q3ryw3db', totalParticipants: 2, validRemoteParticipants: 1, participantIds: Array(2), meetingId: '2byx-chph-odmf', hasSetMeetingRef: true, participantStateReset: true}
MeetingScreenSimple.tsx:248 [MeetingScreen] Clearing meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: false 
MeetingScreenSimple.tsx:248 [MeetingScreen] Clearing meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MeetingScreenSimple.tsx:51 [ParticipantVideo] Participant q3ryw3db: {displayName: 'User', webcamOn: true, hasStream: false, streamId: undefined, hasTrack: false, isLocal: false, passedIsLocal: false, actualIsLocal: false}
MeetingScreenSimple.tsx:51 [ParticipantVideo] Participant nsnluuys: {displayName: 'User', webcamOn: true, hasStream: true, streamId: 'ffd90748-40e6-4d58-9992-05fb606d13c5', hasTrack: true, isLocal: true, passedIsLocal: true, actualIsLocal: true}
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: 2byx-chph-odmf)
MeetingScreenSimple.tsx:51 [ParticipantVideo] Participant nsnluuys: {displayName: 'User', webcamOn: true, hasStream: false, streamId: undefined, hasTrack: false, isLocal: false, passedIsLocal: false, actualIsLocal: false}
MeetingScreenSimple.tsx:51 [ParticipantVideo] Participant q3ryw3db: {displayName: 'User', webcamOn: true, hasStream: true, streamId: 'ab798acd-6013-4478-9de2-acf9424fb727', hasTrack: true, isLocal: true, passedIsLocal: true, actualIsLocal: true}
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:201 [MediaService] Replacing existing meeting reference - cleaning up previous
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: 2byx-chph-odmf)
MeetingScreenSimple.tsx:51 [ParticipantVideo] Participant q3ryw3db: {displayName: 'User', webcamOn: true, hasStream: true, streamId: 'c80ae036-740b-41ab-8d1b-7cba3f8411fc', hasTrack: true, isLocal: false, passedIsLocal: false, actualIsLocal: false}
MeetingScreenSimple.tsx:51 [ParticipantVideo] Participant nsnluuys: {displayName: 'User', webcamOn: true, hasStream: true, streamId: '043f58a4-e642-4a2f-b17c-3bc6579abcff', hasTrack: true, isLocal: false, passedIsLocal: false, actualIsLocal: false}
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: '90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7', localParticipantId: 'q3ryw3db', totalParticipants: 2, validRemoteParticipants: 1, participantIds: Array(2), meetingId: '2byx-chph-odmf', hasSetMeetingRef: true, participantStateReset: true}
MeetingScreenSimple.tsx:248 [MeetingScreen] Clearing meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: false 
MeetingScreenSimple.tsx:51 [ParticipantVideo] Participant q3ryw3db: {displayName: 'User', webcamOn: true, hasStream: false, streamId: undefined, hasTrack: false, isLocal: true, passedIsLocal: true, actualIsLocal: true}
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: 2byx-chph-odmf)
MeetingScreenSimple.tsx:51 [ParticipantVideo] Participant q3ryw3db: {displayName: 'User', webcamOn: false, hasStream: false, streamId: undefined, hasTrack: false, isLocal: false, passedIsLocal: false, actualIsLocal: false}
MeetingScreenSimple.tsx:51 [ParticipantVideo] Participant q3ryw3db: {displayName: 'User', webcamOn: false, hasStream: false, streamId: undefined, hasTrack: false, isLocal: true, passedIsLocal: true, actualIsLocal: true}
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: '90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7', localParticipantId: 'q3ryw3db', totalParticipants: 2, validRemoteParticipants: 1, participantIds: Array(2), meetingId: '2byx-chph-odmf', hasSetMeetingRef: true, participantStateReset: true}
MeetingScreenSimple.tsx:248 [MeetingScreen] Clearing meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: false 
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: 2byx-chph-odmf)
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: '90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7', localParticipantId: 'q3ryw3db', totalParticipants: 2, validRemoteParticipants: 1, participantIds: Array(2), meetingId: '2byx-chph-odmf', hasSetMeetingRef: true, participantStateReset: true}
MeetingScreenSimple.tsx:248 [MeetingScreen] Clearing meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: false 
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: 2byx-chph-odmf)
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: '90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7', localParticipantId: 'q3ryw3db', totalParticipants: 2, validRemoteParticipants: 1, participantIds: Array(2), meetingId: '2byx-chph-odmf', hasSetMeetingRef: true, participantStateReset: true}
MeetingScreenSimple.tsx:248 [MeetingScreen] Clearing meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: false 
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: 2byx-chph-odmf)
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: '90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7', localParticipantId: 'q3ryw3db', totalParticipants: 2, validRemoteParticipants: 1, participantIds: Array(2), meetingId: '2byx-chph-odmf', hasSetMeetingRef: true, participantStateReset: true}
MeetingScreenSimple.tsx:248 [MeetingScreen] Clearing meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: false 
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: 2byx-chph-odmf)
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: '90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7', localParticipantId: 'q3ryw3db', totalParticipants: 2, validRemoteParticipants: 1, participantIds: Array(2), meetingId: '2byx-chph-odmf', hasSetMeetingRef: true, participantStateReset: true}
MeetingScreenSimple.tsx:248 [MeetingScreen] Clearing meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: false 
MeetingScreenSimple.tsx:51 [ParticipantVideo] Participant q3ryw3db: {displayName: 'User', webcamOn: true, hasStream: false, streamId: undefined, hasTrack: false, isLocal: false, passedIsLocal: false, actualIsLocal: false}
MeetingScreenSimple.tsx:51 [ParticipantVideo] Participant q3ryw3db: {displayName: 'User', webcamOn: true, hasStream: true, streamId: '1ba07479-18a3-44e1-a71d-869d6f313c1d', hasTrack: true, isLocal: true, passedIsLocal: true, actualIsLocal: true}
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: 2byx-chph-odmf)
MeetingScreenSimple.tsx:51 [ParticipantVideo] Participant q3ryw3db: {displayName: 'User', webcamOn: true, hasStream: true, streamId: '9c8b7912-350a-4057-a837-5e3fefa7fed8', hasTrack: true, isLocal: false, passedIsLocal: false, actualIsLocal: false}
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: '90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7', localParticipantId: 'q3ryw3db', totalParticipants: 2, validRemoteParticipants: 1, participantIds: Array(2), meetingId: '2byx-chph-odmf', hasSetMeetingRef: true, participantStateReset: true}
MeetingScreenSimple.tsx:248 [MeetingScreen] Clearing meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: false 
MeetingScreenSimple.tsx:51 [ParticipantVideo] Participant q3ryw3db: {displayName: 'User', webcamOn: true, hasStream: false, streamId: undefined, hasTrack: false, isLocal: true, passedIsLocal: true, actualIsLocal: true}
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: 2byx-chph-odmf)
MeetingScreenSimple.tsx:51 [ParticipantVideo] Participant q3ryw3db: {displayName: 'User', webcamOn: false, hasStream: false, streamId: undefined, hasTrack: false, isLocal: false, passedIsLocal: false, actualIsLocal: false}
MeetingScreenSimple.tsx:51 [ParticipantVideo] Participant q3ryw3db: {displayName: 'User', webcamOn: false, hasStream: false, streamId: undefined, hasTrack: false, isLocal: true, passedIsLocal: true, actualIsLocal: true}
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: '90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7', localParticipantId: 'q3ryw3db', totalParticipants: 2, validRemoteParticipants: 1, participantIds: Array(2), meetingId: '2byx-chph-odmf', hasSetMeetingRef: true, participantStateReset: true}
MeetingScreenSimple.tsx:248 [MeetingScreen] Clearing meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: false 
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: 2byx-chph-odmf)
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: '90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7', localParticipantId: 'q3ryw3db', totalParticipants: 2, validRemoteParticipants: 1, participantIds: Array(2), meetingId: '2byx-chph-odmf', hasSetMeetingRef: true, participantStateReset: true}
MeetingScreenSimple.tsx:248 [MeetingScreen] Clearing meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: false 
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: 2byx-chph-odmf)
CallController.ts:68 [CallController] Status changed: in_call -> ended
ApiService.ts:1352 [ApiService] Sending call signal to recipient: 50816 {type: 'CALL_END', sessionId: '90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7'}
ApiService.ts:870 [ApiService] Getting FCM token for single user: 50816
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: '90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7', localParticipantId: 'nsnluuys', totalParticipants: 2, validRemoteParticipants: 1, participantIds: Array(2), meetingId: '2byx-chph-odmf', hasSetMeetingRef: true, participantStateReset: true}
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: '90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7', localParticipantId: 'q3ryw3db', totalParticipants: 2, validRemoteParticipants: 1, participantIds: Array(2), meetingId: '2byx-chph-odmf', hasSetMeetingRef: true, participantStateReset: true}
MeetingScreenSimple.tsx:248 [MeetingScreen] Clearing meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: false 
MeetingScreenSimple.tsx:248 [MeetingScreen] Clearing meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: 2byx-chph-odmf)
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:201 [MediaService] Replacing existing meeting reference - cleaning up previous
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: 2byx-chph-odmf)
ApiService.ts:214 Request to protected endpoint: /api/get-fcm-token/50816. Attempting to add Authorization header.
CallController.ts:235 [CallController] Starting comprehensive cleanup
callStateCleanup.ts:74 [CallStateCleanup] Starting comprehensive cleanup
callStateCleanup.ts:110 [CallStateCleanup] Cleaning up media service
MediaService.ts:103 [MediaService] Starting comprehensive meeting cleanup
MediaService.ts:107 [MediaService] Leaving meeting with timeout protection
MediaService.ts:115 [MediaService] Successfully left meeting
MediaService.ts:124 [MediaService] Force clearing meeting reference
VideoSDKService.ts:187 [VideoSDK] Starting comprehensive service reset
VideoSDKService.ts:216 [VideoSDK] Forcing WebRTC connection cleanup
VideoSDKService.ts:224 [VideoSDK] Service reset complete
MediaService.ts:151 [MediaService] Comprehensive meeting cleanup completed
callStateCleanup.ts:134 [CallStateCleanup] Resetting VideoSDK service
VideoSDKService.ts:187 [VideoSDK] Starting comprehensive service reset
VideoSDKService.ts:216 [VideoSDK] Forcing WebRTC connection cleanup
VideoSDKService.ts:224 [VideoSDK] Service reset complete
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: '90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7', localParticipantId: undefined, totalParticipants: 0, validRemoteParticipants: 0, participantIds: Array(0), meetingId: '2byx-chph-odmf', hasSetMeetingRef: true, participantStateReset: true}
MeetingScreenSimple.tsx:248 [MeetingScreen] Clearing meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: undefined)
BlocklistService.ts:60 [BlocklistService] Loaded 0 blocked users from storage
BlocklistService.ts:43 [BlocklistService] Initialized with 0 blocked users
BlocklistService.ts:162 [BlocklistService] Getting all blocked users, count: 0
ApiService.ts:221 Authorization header added to request for: /api/get-fcm-token/50816
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/get-fcm-token/50816', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/50816', headers: {…}, params: undefined, data: undefined, timeout: 60000, timestamp: '2025-07-08T18:22:10.328Z'}
callStateCleanup.ts:148 [CallStateCleanup] Cleaning up call store
callStoreSimplified.ts:57 [CallStore] Performing comprehensive reset
CallController.ts:68 [CallController] Status changed: ended -> idle
callStoreSimplified.ts:63 [CallStore] Reset complete
callStateCleanup.ts:160 [CallStateCleanup] Cleaning up WebRTC connections
MeetingScreenSimple.tsx:248 [MeetingScreen] Clearing meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MediaService.ts:216 [MediaService] Meeting reference set: false 
MeetingScreenSimple.tsx:344 [MeetingScreen] Component unmounting, performing comprehensive cleanup
MeetingScreenSimple.tsx:349 [MeetingScreen] Leaving meeting on cleanup
MeetingScreenSimple.tsx:373 [MeetingScreen] Component cleanup complete
MeetingScreenSimple.tsx:514 [MeetingScreenSimple] Component unmounting with ID: ox7c8wc58 Session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MeetingScreenSimple.tsx:248 [MeetingScreen] Clearing meeting reference for session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MeetingScreenSimple.tsx:344 [MeetingScreen] Component unmounting, performing comprehensive cleanup
MeetingScreenSimple.tsx:349 [MeetingScreen] Leaving meeting on cleanup
MeetingScreenSimple.tsx:373 [MeetingScreen] Component cleanup complete
MeetingScreenSimple.tsx:514 [MeetingScreenSimple] Component unmounting with ID: wgk3914f2 Session: 90882aba-8cc3-402a-9ed4-2ad1c7eb7ea7
MeetingScreenSimple.tsx:511 [MeetingScreenSimple] Component mounted with ID: ox7c8wc58 Session: undefined
MeetingScreenSimple.tsx:511 [MeetingScreenSimple] Component mounted with ID: wgk3914f2 Session: undefined
callStateCleanup.ts:191 [CallStateCleanup] Clearing participant cache
callStateCleanup.ts:233 [CallStateCleanup] Forcing garbage collection
callStateCleanup.ts:95 [CallStateCleanup] Comprehensive cleanup completed successfully
2MeetingScreenSimple.tsx:356 [MeetingScreen] Successfully left meeting on cleanup
CallController.ts:242 [CallController] Comprehensive cleanup complete
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/get-fcm-token/50816', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/50816', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T18:22:11.267Z'}
ApiService.ts:873 [ApiService] Single user FCM token response: {status: true, fcm_token: 'cc-u78LGQOW_nHw8wEffZ8:APA91bGKb9RuVe1seUtYc1Lt1-iQkkUtw-btA4jAacmh2X5sQ5GOJU5i2IyHKUi_mML94IkOOUfjV1CKQ6Eby25nYfqrkO5WoDezL5M2UBa0dJRSqHXpfx4'}
ApiService.ts:876 [ApiService] Successfully extracted FCM token for user 50816: cc-u78LGQOW_nHw8wEffZ8:APA91bGKb9RuVe1seUtYc1Lt1-iQkkUtw-btA4jAacmh2X5sQ5GOJU5i2IyHKUi_mML94IkOOUfjV1CKQ6Eby25nYfqrkO5WoDezL5M2UBa0dJRSqHXpfx4
callStateCleanup.ts:223 [CallStateCleanup] Participant cache clearing completed
ApiService.ts:870 [ApiService] Getting FCM token for single user: 58422
ApiService.ts:214 Request to protected endpoint: /api/get-fcm-token/58422. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/get-fcm-token/58422
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', headers: {…}, params: undefined, data: undefined, timeout: 60000, timestamp: '2025-07-08T18:22:11.280Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T18:22:11.325Z'}
ApiService.ts:873 [ApiService] Single user FCM token response: {status: true, fcm_token: 'c3D2_peXS3-T8-KgvaqJrR:APA91bFWlaxBWCmv-AWLCEPrVPUdQNbaAlz7QUA7pQL-pfo4UYneZXxCBEA0z77zLzyOCiiuNkfjJzWloNtgg6Jk2x_Z2sOw73TMPiTdfqU9izXknJXjRzw'}
ApiService.ts:876 [ApiService] Successfully extracted FCM token for user 58422: c3D2_peXS3-T8-KgvaqJrR:APA91bFWlaxBWCmv-AWLCEPrVPUdQNbaAlz7QUA7pQL-pfo4UYneZXxCBEA0z77zLzyOCiiuNkfjJzWloNtgg6Jk2x_Z2sOw73TMPiTdfqU9izXknJXjRzw
ApiService.ts:1406 🚀 [ApiService] Making direct call to FCM Server for update-call: https://us-central1-adtip-3873c.cloudfunctions.net/callApi
ApiService.ts:1449 📤 [ApiService] updateCallStatus validated payload: {
  "callerInfo": {
    "token": "c3D2_peXS3-T8-KgvaqJrR:APA91bFWlaxBWCmv-AWLCEPrVPUdQNbaAlz7QUA7pQL-pfo4UYneZXxCBEA0z77zLzyOCiiuNkfjJzWloNtgg6Jk2x_Z2sOw73TMPiTdfqU9izXknJXjRzw",
    "name": "Unknown Caller",
    "platform": "ANDROID"
  },
  "type": "CALL_END"
}
ApiService.ts:1453 🔑 [ApiService] Auth token available: true
ApiService.ts:1466 🚀 [ApiService] Request headers: {Content-Type: 'application/json', Accept: 'application/json', Authorization: 'Bearer [REDACTED]'}
ApiService.ts:1477 ✅ [ApiService] update-call response: {messageId: 'projects/adtip-3873c/messages/0:1751998931625053%e9e87daaf9fd7ecd'}
MediaService.ts:103 [MediaService] Starting comprehensive meeting cleanup
VideoSDKService.ts:187 [VideoSDK] Starting comprehensive service reset
VideoSDKService.ts:216 [VideoSDK] Forcing WebRTC connection cleanup
VideoSDKService.ts:224 [VideoSDK] Service reset complete
MediaService.ts:151 [MediaService] Comprehensive meeting cleanup completed
useFcmCallHandlers.ts:18 [FCM] Foreground message: {originalPriority: 1, priority: 1, sentTime: 1751998931616, data: {…}, from: '333436486029', messageId: '0:1751998931625053%e9e87daaf9fd7ecd', ttl: 2419200}
ApiService.ts:870 [ApiService] Getting FCM token for single user: 58422
ApiService.ts:214 Request to protected endpoint: /api/get-fcm-token/58422. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/get-fcm-token/58422
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', headers: {…}, params: undefined, data: undefined, timeout: 60000, timestamp: '2025-07-08T18:22:11.997Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T18:22:12.058Z'}
ApiService.ts:873 [ApiService] Single user FCM token response: {status: true, fcm_token: 'c3D2_peXS3-T8-KgvaqJrR:APA91bFWlaxBWCmv-AWLCEPrVPUdQNbaAlz7QUA7pQL-pfo4UYneZXxCBEA0z77zLzyOCiiuNkfjJzWloNtgg6Jk2x_Z2sOw73TMPiTdfqU9izXknJXjRzw'}
ApiService.ts:876 [ApiService] Successfully extracted FCM token for user 58422: c3D2_peXS3-T8-KgvaqJrR:APA91bFWlaxBWCmv-AWLCEPrVPUdQNbaAlz7QUA7pQL-pfo4UYneZXxCBEA0z77zLzyOCiiuNkfjJzWloNtgg6Jk2x_Z2sOw73TMPiTdfqU9izXknJXjRzw
ApiService.ts:1406 🚀 [ApiService] Making direct call to FCM Server for update-call: https://us-central1-adtip-3873c.cloudfunctions.net/callApi
ApiService.ts:1449 📤 [ApiService] updateCallStatus validated payload: {
  "callerInfo": {
    "token": "c3D2_peXS3-T8-KgvaqJrR:APA91bFWlaxBWCmv-AWLCEPrVPUdQNbaAlz7QUA7pQL-pfo4UYneZXxCBEA0z77zLzyOCiiuNkfjJzWloNtgg6Jk2x_Z2sOw73TMPiTdfqU9izXknJXjRzw",
    "name": "R17 C",
    "platform": "ANDROID"
  },
  "type": "CALL_ENDED"
}
ApiService.ts:1453 🔑 [ApiService] Auth token available: true
ApiService.ts:1466 🚀 [ApiService] Request headers: {Content-Type: 'application/json', Accept: 'application/json', Authorization: 'Bearer [REDACTED]'}
ApiService.ts:1477 ✅ [ApiService] update-call response: {messageId: 'projects/adtip-3873c/messages/0:1751998932378003%e9e87daaf9fd7ecd'}
callStoreSimplified.ts:57 [CallStore] Performing comprehensive reset
callStoreSimplified.ts:63 [CallStore] Reset complete
NavigationService.ts:107 [NavigationService] Resetting meeting navigation state
callStateCleanup.ts:74 [CallStateCleanup] Starting comprehensive cleanup
callStateCleanup.ts:110 [CallStateCleanup] Cleaning up media service
MediaService.ts:103 [MediaService] Starting comprehensive meeting cleanup
VideoSDKService.ts:187 [VideoSDK] Starting comprehensive service reset
VideoSDKService.ts:216 [VideoSDK] Forcing WebRTC connection cleanup
VideoSDKService.ts:224 [VideoSDK] Service reset complete
MediaService.ts:151 [MediaService] Comprehensive meeting cleanup completed
callStateCleanup.ts:134 [CallStateCleanup] Resetting VideoSDK service
VideoSDKService.ts:187 [VideoSDK] Starting comprehensive service reset
VideoSDKService.ts:216 [VideoSDK] Forcing WebRTC connection cleanup
VideoSDKService.ts:224 [VideoSDK] Service reset complete
useFcmCallHandlers.ts:18 [FCM] Foreground message: {originalPriority: 1, priority: 1, sentTime: 1751998932370, data: {…}, from: '333436486029', messageId: '0:1751998932378003%e9e87daaf9fd7ecd', ttl: 2419200}
callStateCleanup.ts:148 [CallStateCleanup] Cleaning up call store
callStoreSimplified.ts:57 [CallStore] Performing comprehensive reset
callStoreSimplified.ts:63 [CallStore] Reset complete
callStateCleanup.ts:160 [CallStateCleanup] Cleaning up WebRTC connections
callStateCleanup.ts:191 [CallStateCleanup] Clearing participant cache
callStateCleanup.ts:233 [CallStateCleanup] Forcing garbage collection
callStateCleanup.ts:95 [CallStateCleanup] Comprehensive cleanup completed successfully
callStateCleanup.ts:223 [CallStateCleanup] Participant cache clearing completed
CallBillingService.ts:76 [CallBillingService] Calculating billing for: {userId: '58422', callType: 'video', currentBalance: 1000, isPremium: false}
CallBillingService.ts:100 [CallBillingService] Calculated billing: {ratePerMinute: 14, maxMinutes: 71, maxDurationSeconds: 4260, warningThresholds: Array(5)}
CallController.ts:313 [CallController] Starting video call to R17BKP
VideoSDKService.ts:51 [VideoSDK] Initializing...
VideoSDKService.ts:60 [VideoSDK] Initialization complete
VideoSDKService.ts:151 [VideoSDK] Generating participant token via backend
ApiService.ts:214 Request to protected endpoint: /api/generate-token/videosdk. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/generate-token/videosdk
ApiService.ts:228 🚀 API REQUEST: {method: 'POST', url: '/api/generate-token/videosdk', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/generate-token/videosdk', headers: {…}, params: undefined, data: {…}, timeout: 60000, timestamp: '2025-07-08T18:22:16.208Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'POST', url: '/api/generate-token/videosdk', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/generate-token/videosdk', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T18:22:16.259Z'}
VideoSDKService.ts:110 [VideoSDK] Creating meeting via backend API
ApiService.ts:214 Request to protected endpoint: /api/create-meeting/videosdk. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/create-meeting/videosdk
ApiService.ts:228 🚀 API REQUEST: {method: 'POST', url: '/api/create-meeting/videosdk', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/create-meeting/videosdk', headers: {…}, params: undefined, data: {…}, timeout: 60000, timestamp: '2025-07-08T18:22:16.276Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'POST', url: '/api/create-meeting/videosdk', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/create-meeting/videosdk', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T18:22:16.339Z'}
ApiService.ts:1308 [ApiService] Create VideoSDK meeting response: {success: true, data: {…}, message: 'Meeting created successfully'}
VideoSDKService.ts:115 [VideoSDK] Raw API response: {success: true, data: {…}, message: 'Meeting created successfully'}
VideoSDKService.ts:119 [VideoSDK] Meeting created: jzgi-vr81-8xsz
ApiService.ts:870 [ApiService] Getting FCM token for single user: 58422
ApiService.ts:214 Request to protected endpoint: /api/get-fcm-token/58422. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/get-fcm-token/58422
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', headers: {…}, params: undefined, data: undefined, timeout: 60000, timestamp: '2025-07-08T18:22:16.364Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T18:22:16.417Z'}
ApiService.ts:873 [ApiService] Single user FCM token response: {status: true, fcm_token: 'c3D2_peXS3-T8-KgvaqJrR:APA91bFWlaxBWCmv-AWLCEPrVPUdQNbaAlz7QUA7pQL-pfo4UYneZXxCBEA0z77zLzyOCiiuNkfjJzWloNtgg6Jk2x_Z2sOw73TMPiTdfqU9izXknJXjRzw'}
ApiService.ts:876 [ApiService] Successfully extracted FCM token for user 58422: c3D2_peXS3-T8-KgvaqJrR:APA91bFWlaxBWCmv-AWLCEPrVPUdQNbaAlz7QUA7pQL-pfo4UYneZXxCBEA0z77zLzyOCiiuNkfjJzWloNtgg6Jk2x_Z2sOw73TMPiTdfqU9izXknJXjRzw
ApiService.ts:870 [ApiService] Getting FCM token for single user: 63779
ApiService.ts:214 Request to protected endpoint: /api/get-fcm-token/63779. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/get-fcm-token/63779
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/get-fcm-token/63779', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/63779', headers: {…}, params: undefined, data: undefined, timeout: 60000, timestamp: '2025-07-08T18:22:16.433Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/get-fcm-token/63779', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/63779', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T18:22:16.489Z'}
ApiService.ts:873 [ApiService] Single user FCM token response: {status: true, fcm_token: 'ckOrGpJHQ-mtE6jEks9e8x:APA91bFc6mMfPfJyecmMuDZJjl_qW9H-ABdjkYjOEGo8dK2IESfnJvhxz9osyvbL6RklrMKiULffIv692PnYDR2kmuVJYnTPoy7DT1rrj1Pzku66wYwYWL4'}
ApiService.ts:876 [ApiService] Successfully extracted FCM token for user 63779: ckOrGpJHQ-mtE6jEks9e8x:APA91bFc6mMfPfJyecmMuDZJjl_qW9H-ABdjkYjOEGo8dK2IESfnJvhxz9osyvbL6RklrMKiULffIv692PnYDR2kmuVJYnTPoy7DT1rrj1Pzku66wYwYWL4
ApiService.ts:1319 🚀 [ApiService] Making direct call to FCM Server for initiate-call: https://us-central1-adtip-3873c.cloudfunctions.net/callApi
ApiService.ts:1320 🚀 [ApiService] Payload with callType: {
  "calleeInfo": {
    "platform": "ANDROID",
    "token": "ckOrGpJHQ-mtE6jEks9e8x:APA91bFc6mMfPfJyecmMuDZJjl_qW9H-ABdjkYjOEGo8dK2IESfnJvhxz9osyvbL6RklrMKiULffIv692PnYDR2kmuVJYnTPoy7DT1rrj1Pzku66wYwYWL4"
  },
  "callerInfo": {
    "name": "R17 C",
    "token": "c3D2_peXS3-T8-KgvaqJrR:APA91bFWlaxBWCmv-AWLCEPrVPUdQNbaAlz7QUA7pQL-pfo4UYneZXxCBEA0z77zLzyOCiiuNkfjJzWloNtgg6Jk2x_Z2sOw73TMPiTdfqU9izXknJXjRzw"
  },
  "videoSDKInfo": {
    "meetingId": "jzgi-vr81-8xsz",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiI2MjU3MmY1Yy01NmFkLTRiMjktYmFlNi01MTg2N2ZmYWI2MDkiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIiwiYWxsb3dfbW9kIl0sImlhdCI6MTc1MTk5ODkzNiwiZXhwIjoxNzUyMDAwNzM2fQ._KqMOznb5d8YgrC3wcgt0gccFgMq6M4sp8mwX9nIwMI",
    "callType": "video"
  }
}
ApiService.ts:1340 ✅ [ApiService] initiate-call response: {messageId: 'projects/adtip-3873c/messages/0:1751998936807094%e9e87daaf9fd7ecd'}
CallController.ts:68 [CallController] Status changed: idle -> outgoing
VideoSDKService.ts:44 [VideoSDK] Already initialized
MeetingScreenSimple.tsx:514 [MeetingScreenSimple] Component unmounting with ID: ox7c8wc58 Session: undefined
MeetingScreenSimple.tsx:514 [MeetingScreenSimple] Component unmounting with ID: wgk3914f2 Session: undefined
MeetingScreenSimple.tsx:511 [MeetingScreenSimple] Component mounted with ID: ox7c8wc58 Session: 9a16b539-fa4c-492c-9349-d28fee8d917d
MeetingScreenSimple.tsx:511 [MeetingScreenSimple] Component mounted with ID: wgk3914f2 Session: 9a16b539-fa4c-492c-9349-d28fee8d917d
MeetingScreenSimple.tsx:511 [MeetingScreenSimple] Component mounted with ID: f14qkqzok Session: 9a16b539-fa4c-492c-9349-d28fee8d917d
NavigationService.ts:69 [NavigationService] Navigating to Meeting screen with params: {meetingId: 'jzgi-vr81-8xsz', callType: 'video', displayName: 'R17 C', localParticipantId: 'not_provided'}
3console.js:654 Bluetooth Connect Permission Granted
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: '9a16b539-fa4c-492c-9349-d28fee8d917d', localParticipantId: undefined, totalParticipants: 0, validRemoteParticipants: 0, participantIds: Array(0), meetingId: 'jzgi-vr81-8xsz', hasSetMeetingRef: false, participantStateReset: false}
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: '9a16b539-fa4c-492c-9349-d28fee8d917d', localParticipantId: undefined, totalParticipants: 0, validRemoteParticipants: 0, participantIds: Array(0), meetingId: 'jzgi-vr81-8xsz', hasSetMeetingRef: false, participantStateReset: false}
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: '9a16b539-fa4c-492c-9349-d28fee8d917d', localParticipantId: undefined, totalParticipants: 0, validRemoteParticipants: 0, participantIds: Array(0), meetingId: 'jzgi-vr81-8xsz', hasSetMeetingRef: false, participantStateReset: false}
MeetingScreenSimple.tsx:208 [MeetingScreen] New session detected, validating participant state: {newSessionId: '9a16b539-fa4c-492c-9349-d28fee8d917d', lastSessionId: null, localParticipantId: undefined, participantCount: 0}
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: 9a16b539-fa4c-492c-9349-d28fee8d917d
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: undefined)
MeetingScreenSimple.tsx:263 [MeetingScreen] New session detected, resetting join state: 9a16b539-fa4c-492c-9349-d28fee8d917d
MeetingScreenSimple.tsx:278 [MeetingScreen] Forcing participant state reset for session: 9a16b539-fa4c-492c-9349-d28fee8d917d
MeetingScreenSimple.tsx:291 [MeetingScreen] Attempt 1/3 to join meeting…
MeetingScreenSimple.tsx:305 [MeetingScreen] First join after app load - adding extra delay for WebSocket stability
MeetingScreenSimple.tsx:208 [MeetingScreen] New session detected, validating participant state: {newSessionId: '9a16b539-fa4c-492c-9349-d28fee8d917d', lastSessionId: null, localParticipantId: undefined, participantCount: 0}
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: 9a16b539-fa4c-492c-9349-d28fee8d917d
MediaService.ts:201 [MediaService] Replacing existing meeting reference - cleaning up previous
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: undefined)
MeetingScreenSimple.tsx:263 [MeetingScreen] New session detected, resetting join state: 9a16b539-fa4c-492c-9349-d28fee8d917d
MeetingScreenSimple.tsx:278 [MeetingScreen] Forcing participant state reset for session: 9a16b539-fa4c-492c-9349-d28fee8d917d
MeetingScreenSimple.tsx:291 [MeetingScreen] Attempt 1/3 to join meeting…
MeetingScreenSimple.tsx:305 [MeetingScreen] First join after app load - adding extra delay for WebSocket stability
MeetingScreenSimple.tsx:208 [MeetingScreen] New session detected, validating participant state: {newSessionId: '9a16b539-fa4c-492c-9349-d28fee8d917d', lastSessionId: null, localParticipantId: undefined, participantCount: 0}
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: 9a16b539-fa4c-492c-9349-d28fee8d917d
MediaService.ts:201 [MediaService] Replacing existing meeting reference - cleaning up previous
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: undefined)
MeetingScreenSimple.tsx:263 [MeetingScreen] New session detected, resetting join state: 9a16b539-fa4c-492c-9349-d28fee8d917d
MeetingScreenSimple.tsx:278 [MeetingScreen] Forcing participant state reset for session: 9a16b539-fa4c-492c-9349-d28fee8d917d
MeetingScreenSimple.tsx:291 [MeetingScreen] Attempt 1/3 to join meeting…
MeetingScreenSimple.tsx:305 [MeetingScreen] First join after app load - adding extra delay for WebSocket stability
AppOpenAdManager.ts:67 App open ad failed to load: NativeError: [googleMobileAds/no-fill] No fill.
    at _handleAdEvent (http://localhost:8081/index.bundle//&platform=android&dev=true&lazy=true&minify=false&app=com.adtip.app.adtip_app&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server:138299:100)
    at apply (native)
    at emit (http://localhost:8081/index.bundle//&platform=android&dev=true&lazy=true&minify=false&app=com.adtip.app.adtip_app&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server:2907:40)
    at anonymous (http://localhost:8081/index.bundle//&platform=android&dev=true&lazy=true&minify=false&app=com.adtip.app.adtip_app&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server:140795:100)
    at apply (native)
    at emit (http://localhost:8081/index.bundle//&platform=android&dev=true&lazy=true&minify=false&app=com.adtip.app.adtip_app&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server:2907:40)
    at apply (native)
    at anonymous (http://localhost:8081/index.bundle//&platform=android&dev=true&lazy=true&minify=false&app=com.adtip.app.adtip_app&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server:2769:200)
    at emit (http://localhost:8081/index.bundle//&platform=android&dev=true&lazy=true&minify=false&app=com.adtip.app.adtip_app&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server:2785:66)
MeetingScreenSimple.tsx:221 [MeetingScreen] Post-session-change participant validation: {sessionId: '9a16b539-fa4c-492c-9349-d28fee8d917d', localId: undefined, totalParticipants: 0, participantDetails: Array(0)}
MeetingScreenSimple.tsx:221 [MeetingScreen] Post-session-change participant validation: {sessionId: '9a16b539-fa4c-492c-9349-d28fee8d917d', localId: undefined, totalParticipants: 0, participantDetails: Array(0)}
MeetingScreenSimple.tsx:221 [MeetingScreen] Post-session-change participant validation: {sessionId: '9a16b539-fa4c-492c-9349-d28fee8d917d', localId: undefined, totalParticipants: 0, participantDetails: Array(0)}
MeetingScreenSimple.tsx:312 [MeetingScreen] Successfully joined meeting
CallController.ts:68 [CallController] Status changed: outgoing -> in_call
NavigationService.ts:69 [NavigationService] Navigating to Meeting screen with params: {meetingId: 'jzgi-vr81-8xsz', callType: 'video', displayName: 'User', localParticipantId: 'not_provided'}
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: '9a16b539-fa4c-492c-9349-d28fee8d917d', localParticipantId: 'nkem8rqz', totalParticipants: 1, validRemoteParticipants: 0, participantIds: Array(1), meetingId: 'jzgi-vr81-8xsz', hasSetMeetingRef: false, participantStateReset: true}
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: '9a16b539-fa4c-492c-9349-d28fee8d917d', localParticipantId: undefined, totalParticipants: 0, validRemoteParticipants: 0, participantIds: Array(0), meetingId: 'jzgi-vr81-8xsz', hasSetMeetingRef: false, participantStateReset: true}
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: '9a16b539-fa4c-492c-9349-d28fee8d917d', localParticipantId: undefined, totalParticipants: 0, validRemoteParticipants: 0, participantIds: Array(0), meetingId: 'jzgi-vr81-8xsz', hasSetMeetingRef: false, participantStateReset: true}
MeetingScreenSimple.tsx:51 [ParticipantVideo] Participant nkem8rqz: {displayName: 'User', webcamOn: false, hasStream: false, streamId: undefined, hasTrack: false, isLocal: true, passedIsLocal: true, actualIsLocal: true}
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: 9a16b539-fa4c-492c-9349-d28fee8d917d
MediaService.ts:201 [MediaService] Replacing existing meeting reference - cleaning up previous
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: jzgi-vr81-8xsz)
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: 9a16b539-fa4c-492c-9349-d28fee8d917d
MediaService.ts:201 [MediaService] Replacing existing meeting reference - cleaning up previous
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: undefined)
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: 9a16b539-fa4c-492c-9349-d28fee8d917d
MediaService.ts:201 [MediaService] Replacing existing meeting reference - cleaning up previous
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: undefined)
MeetingScreenSimple.tsx:312 [MeetingScreen] Successfully joined meeting
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: '9a16b539-fa4c-492c-9349-d28fee8d917d', localParticipantId: 'bzr0vzj2', totalParticipants: 1, validRemoteParticipants: 0, participantIds: Array(1), meetingId: 'jzgi-vr81-8xsz', hasSetMeetingRef: true, participantStateReset: true}
MeetingScreenSimple.tsx:248 [MeetingScreen] Clearing meeting reference for session: 9a16b539-fa4c-492c-9349-d28fee8d917d
MediaService.ts:216 [MediaService] Meeting reference set: false 
MeetingScreenSimple.tsx:51 [ParticipantVideo] Participant bzr0vzj2: {displayName: 'User', webcamOn: false, hasStream: false, streamId: undefined, hasTrack: false, isLocal: true, passedIsLocal: true, actualIsLocal: true}
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: 9a16b539-fa4c-492c-9349-d28fee8d917d
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: jzgi-vr81-8xsz)
MeetingScreenSimple.tsx:312 [MeetingScreen] Successfully joined meeting
MeetingScreenSimple.tsx:421 [MeetingScreen] Participant debug: {sessionId: '9a16b539-fa4c-492c-9349-d28fee8d917d', localParticipantId: 'nj1zms83', totalParticipants: 1, validRemoteParticipants: 0, participantIds: Array(1), meetingId: 'jzgi-vr81-8xsz', hasSetMeetingRef: true, participantStateReset: true}
MeetingScreenSimple.tsx:248 [MeetingScreen] Clearing meeting reference for session: 9a16b539-fa4c-492c-9349-d28fee8d917d
MediaService.ts:216 [MediaService] Meeting reference set: false 
MeetingScreenSimple.tsx:51 [ParticipantVideo] Participant nj1zms83: {displayName: 'User', webcamOn: false, hasStream: false, streamId: undefined, hasTrack: false, isLocal: true, passedIsLocal: true, actualIsLocal: true}
MeetingScreenSimple.tsx:240 [MeetingScreen] Setting meeting reference for session: 9a16b539-fa4c-492c-9349-d28fee8d917d
MediaService.ts:216 [MediaService] Meeting reference set: true (meetingId: jzgi-vr81-8xsz)