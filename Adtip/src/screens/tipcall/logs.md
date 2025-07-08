[CallBillingService] Calculating billing for: {userId: '58422', callType: 'video', currentBalance: 1000, isPremium: false}
CallBillingService.ts:100 [CallBillingService] Calculated billing: {ratePerMinute: 14, maxMinutes: 71, maxDurationSeconds: 4260, warningThresholds: Array(5)}
CallController.ts:304 [CallController] Starting video call to R17BKP
VideoSDKService.ts:44 [VideoSDK] Already initialized
VideoSDKService.ts:151 [VideoSDK] Generating participant token via backend
ApiService.ts:214 Request to protected endpoint: /api/generate-token/videosdk. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/generate-token/videosdk
ApiService.ts:228 🚀 API REQUEST: {method: 'POST', url: '/api/generate-token/videosdk', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/generate-token/videosdk', headers: {…}, params: undefined, data: {…}, timeout: 60000, timestamp: '2025-07-08T16:32:00.912Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'POST', url: '/api/generate-token/videosdk', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/generate-token/videosdk', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T16:32:01.129Z'}
VideoSDKService.ts:110 [VideoSDK] Creating meeting via backend API
ApiService.ts:214 Request to protected endpoint: /api/create-meeting/videosdk. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/create-meeting/videosdk
ApiService.ts:228 🚀 API REQUEST: {method: 'POST', url: '/api/create-meeting/videosdk', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/create-meeting/videosdk', headers: {…}, params: undefined, data: {…}, timeout: 60000, timestamp: '2025-07-08T16:32:01.142Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'POST', url: '/api/create-meeting/videosdk', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/create-meeting/videosdk', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T16:32:01.227Z'}
ApiService.ts:1308 [ApiService] Create VideoSDK meeting response: {success: true, data: {…}, message: 'Meeting created successfully'}
VideoSDKService.ts:115 [VideoSDK] Raw API response: {success: true, data: {…}, message: 'Meeting created successfully'}
VideoSDKService.ts:119 [VideoSDK] Meeting created: cmoa-1t9e-5seq
ApiService.ts:870 [ApiService] Getting FCM token for single user: 58422
ApiService.ts:214 Request to protected endpoint: /api/get-fcm-token/58422. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/get-fcm-token/58422
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', headers: {…}, params: undefined, data: undefined, timeout: 60000, timestamp: '2025-07-08T16:32:01.249Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T16:32:01.330Z'}
ApiService.ts:873 [ApiService] Single user FCM token response: {status: true, fcm_token: 'c3D2_peXS3-T8-KgvaqJrR:APA91bFWlaxBWCmv-AWLCEPrVPUdQNbaAlz7QUA7pQL-pfo4UYneZXxCBEA0z77zLzyOCiiuNkfjJzWloNtgg6Jk2x_Z2sOw73TMPiTdfqU9izXknJXjRzw'}
ApiService.ts:876 [ApiService] Successfully extracted FCM token for user 58422: c3D2_peXS3-T8-KgvaqJrR:APA91bFWlaxBWCmv-AWLCEPrVPUdQNbaAlz7QUA7pQL-pfo4UYneZXxCBEA0z77zLzyOCiiuNkfjJzWloNtgg6Jk2x_Z2sOw73TMPiTdfqU9izXknJXjRzw
ApiService.ts:870 [ApiService] Getting FCM token for single user: 63779
ApiService.ts:214 Request to protected endpoint: /api/get-fcm-token/63779. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/get-fcm-token/63779
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/get-fcm-token/63779', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/63779', headers: {…}, params: undefined, data: undefined, timeout: 60000, timestamp: '2025-07-08T16:32:01.340Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/get-fcm-token/63779', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/63779', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T16:32:01.399Z'}
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
    "meetingId": "cmoa-1t9e-5seq",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiI2MjU3MmY1Yy01NmFkLTRiMjktYmFlNi01MTg2N2ZmYWI2MDkiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIiwiYWxsb3dfbW9kIl0sImlhdCI6MTc1MTk5MjMyMSwiZXhwIjoxNzUxOTk0MTIxfQ.TeqyGcEDObhIGumvgLNeeJs6Po2zjdABQmLoKQBSqaY",
    "callType": "video"
  }
}
ApiService.ts:1340 ✅ [ApiService] initiate-call response: {messageId: 'projects/adtip-3873c/messages/0:1751992321893892%e9e87daaf9fd7ecd'}
CallController.ts:67 [CallController] Status changed: idle -> outgoing
VideoSDKService.ts:44 [VideoSDK] Already initialized
NavigationService.ts:51 [NavigationService] Navigating to Meeting screen with params: {meetingId: 'cmoa-1t9e-5seq', callType: 'video', displayName: 'R17 C', localParticipantId: 'not_provided'}
console.js:654 Bluetooth Connect Permission Granted
MediaService.ts:107 [MediaService] Meeting reference set: true
MeetingScreenSimple.tsx:205 [MeetingScreen] New session detected, resetting join state: 814754c3-5df2-4ca5-896f-a86678dc41a2
MeetingScreenSimple.tsx:221 [MeetingScreen] Attempt 1/3 to join meeting…
MeetingScreenSimple.tsx:235 [MeetingScreen] First join after app load - adding extra delay for WebSocket stability
MeetingScreenSimple.tsx:242 [MeetingScreen] Successfully joined meeting
CallController.ts:67 [CallController] Status changed: outgoing -> in_call
NavigationService.ts:51 [NavigationService] Navigating to Meeting screen with params: {meetingId: 'cmoa-1t9e-5seq', callType: 'video', displayName: 'User', localParticipantId: 'not_provided'}
MediaService.ts:107 [MediaService] Meeting reference set: false
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant ivackjz9: {displayName: 'User', webcamOn: false, hasStream: false, streamId: undefined, hasTrack: false, isLocal: true}
MediaService.ts:107 [MediaService] Meeting reference set: true
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
MediaService.ts:107 [MediaService] Meeting reference set: false
MediaService.ts:107 [MediaService] Meeting reference set: true
MediaService.ts:107 [MediaService] Meeting reference set: false
MediaService.ts:107 [MediaService] Meeting reference set: true
MediaService.ts:107 [MediaService] Meeting reference set: false
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant ivackjz9: {displayName: 'User', webcamOn: true, hasStream: true, streamId: '23d1feb6-52d8-4fff-b8ff-6b3f4da7a716', hasTrack: true, isLocal: true}
MediaService.ts:107 [MediaService] Meeting reference set: true
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
CallController.ts:67 [CallController] Status changed: in_call -> ended
ApiService.ts:1352 [ApiService] Sending call signal to recipient: 63779 {type: 'CALL_END', sessionId: '814754c3-5df2-4ca5-896f-a86678dc41a2'}
ApiService.ts:870 [ApiService] Getting FCM token for single user: 63779
MediaService.ts:107 [MediaService] Meeting reference set: false
MediaService.ts:107 [MediaService] Meeting reference set: true
ApiService.ts:214 Request to protected endpoint: /api/get-fcm-token/63779. Attempting to add Authorization header.
MediaService.ts:57 [MediaService] Leaving meeting
VideoSDKService.ts:189 [VideoSDK] Service reset
MediaService.ts:68 [MediaService] Meeting cleanup completed
MediaService.ts:107 [MediaService] Meeting reference set: false
MediaService.ts:107 [MediaService] Meeting reference set: true
BlocklistService.ts:60 [BlocklistService] Loaded 0 blocked users from storage
BlocklistService.ts:43 [BlocklistService] Initialized with 0 blocked users
BlocklistService.ts:162 [BlocklistService] Getting all blocked users, count: 0
ApiService.ts:221 Authorization header added to request for: /api/get-fcm-token/63779
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/get-fcm-token/63779', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/63779', headers: {…}, params: undefined, data: undefined, timeout: 60000, timestamp: '2025-07-08T16:32:12.168Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/get-fcm-token/63779', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/63779', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T16:32:12.976Z'}
ApiService.ts:873 [ApiService] Single user FCM token response: {status: true, fcm_token: 'ckOrGpJHQ-mtE6jEks9e8x:APA91bFc6mMfPfJyecmMuDZJjl_qW9H-ABdjkYjOEGo8dK2IESfnJvhxz9osyvbL6RklrMKiULffIv692PnYDR2kmuVJYnTPoy7DT1rrj1Pzku66wYwYWL4'}
ApiService.ts:876 [ApiService] Successfully extracted FCM token for user 63779: ckOrGpJHQ-mtE6jEks9e8x:APA91bFc6mMfPfJyecmMuDZJjl_qW9H-ABdjkYjOEGo8dK2IESfnJvhxz9osyvbL6RklrMKiULffIv692PnYDR2kmuVJYnTPoy7DT1rrj1Pzku66wYwYWL4
CallController.ts:67 [CallController] Status changed: ended -> idle
MediaService.ts:107 [MediaService] Meeting reference set: false
MeetingScreenSimple.tsx:274 [MeetingScreen] Component unmounting, cleaning up meeting
MeetingScreenSimple.tsx:278 [MeetingScreen] Successfully left meeting on cleanup
ApiService.ts:870 [ApiService] Getting FCM token for single user: 58422
ApiService.ts:214 Request to protected endpoint: /api/get-fcm-token/58422. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/get-fcm-token/58422
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', headers: {…}, params: undefined, data: undefined, timeout: 60000, timestamp: '2025-07-08T16:32:13.034Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T16:32:13.093Z'}
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
ApiService.ts:1477 ✅ [ApiService] update-call response: {messageId: 'projects/adtip-3873c/messages/0:1751992333396125%e9e87daaf9fd7ecd'}
VideoSDKService.ts:189 [VideoSDK] Service reset
MediaService.ts:68 [MediaService] Meeting cleanup completed
ApiService.ts:870 [ApiService] Getting FCM token for single user: 58422
ApiService.ts:214 Request to protected endpoint: /api/get-fcm-token/58422. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/get-fcm-token/58422
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', headers: {…}, params: undefined, data: undefined, timeout: 60000, timestamp: '2025-07-08T16:32:13.575Z'}
useFcmCallHandlers.ts:18 [FCM] Foreground message: {originalPriority: 1, priority: 1, sentTime: 1751992333386, data: {…}, from: '333436486029', messageId: '0:1751992333396125%e9e87daaf9fd7ecd', ttl: 2419200}
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T16:32:13.632Z'}
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
ApiService.ts:1477 ✅ [ApiService] update-call response: {messageId: 'projects/adtip-3873c/messages/0:1751992333917609%e9e87daaf9fd7ecd'}
useFcmCallHandlers.ts:18 [FCM] Foreground message: {originalPriority: 1, priority: 1, sentTime: 1751992333910, data: {…}, from: '333436486029', messageId: '0:1751992333917609%e9e87daaf9fd7ecd', ttl: 2419200}
CallBillingService.ts:76 [CallBillingService] Calculating billing for: {userId: '58422', callType: 'video', currentBalance: 1000, isPremium: false}
CallBillingService.ts:100 [CallBillingService] Calculated billing: {ratePerMinute: 14, maxMinutes: 71, maxDurationSeconds: 4260, warningThresholds: Array(5)}
CallController.ts:304 [CallController] Starting video call to vivek P
VideoSDKService.ts:51 [VideoSDK] Initializing...
VideoSDKService.ts:60 [VideoSDK] Initialization complete
VideoSDKService.ts:151 [VideoSDK] Generating participant token via backend
ApiService.ts:214 Request to protected endpoint: /api/generate-token/videosdk. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/generate-token/videosdk
ApiService.ts:228 🚀 API REQUEST: {method: 'POST', url: '/api/generate-token/videosdk', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/generate-token/videosdk', headers: {…}, params: undefined, data: {…}, timeout: 60000, timestamp: '2025-07-08T16:32:17.000Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'POST', url: '/api/generate-token/videosdk', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/generate-token/videosdk', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T16:32:17.066Z'}
VideoSDKService.ts:110 [VideoSDK] Creating meeting via backend API
ApiService.ts:214 Request to protected endpoint: /api/create-meeting/videosdk. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/create-meeting/videosdk
ApiService.ts:228 🚀 API REQUEST: {method: 'POST', url: '/api/create-meeting/videosdk', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/create-meeting/videosdk', headers: {…}, params: undefined, data: {…}, timeout: 60000, timestamp: '2025-07-08T16:32:17.077Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'POST', url: '/api/create-meeting/videosdk', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/create-meeting/videosdk', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T16:32:17.164Z'}
ApiService.ts:1308 [ApiService] Create VideoSDK meeting response: {success: true, data: {…}, message: 'Meeting created successfully'}
VideoSDKService.ts:115 [VideoSDK] Raw API response: {success: true, data: {…}, message: 'Meeting created successfully'}
VideoSDKService.ts:119 [VideoSDK] Meeting created: wx3d-5cv4-bgxo
ApiService.ts:870 [ApiService] Getting FCM token for single user: 58422
ApiService.ts:214 Request to protected endpoint: /api/get-fcm-token/58422. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/get-fcm-token/58422
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', headers: {…}, params: undefined, data: undefined, timeout: 60000, timestamp: '2025-07-08T16:32:17.183Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T16:32:17.261Z'}
ApiService.ts:873 [ApiService] Single user FCM token response: {status: true, fcm_token: 'c3D2_peXS3-T8-KgvaqJrR:APA91bFWlaxBWCmv-AWLCEPrVPUdQNbaAlz7QUA7pQL-pfo4UYneZXxCBEA0z77zLzyOCiiuNkfjJzWloNtgg6Jk2x_Z2sOw73TMPiTdfqU9izXknJXjRzw'}
ApiService.ts:876 [ApiService] Successfully extracted FCM token for user 58422: c3D2_peXS3-T8-KgvaqJrR:APA91bFWlaxBWCmv-AWLCEPrVPUdQNbaAlz7QUA7pQL-pfo4UYneZXxCBEA0z77zLzyOCiiuNkfjJzWloNtgg6Jk2x_Z2sOw73TMPiTdfqU9izXknJXjRzw
ApiService.ts:870 [ApiService] Getting FCM token for single user: 50816
ApiService.ts:214 Request to protected endpoint: /api/get-fcm-token/50816. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/get-fcm-token/50816
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/get-fcm-token/50816', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/50816', headers: {…}, params: undefined, data: undefined, timeout: 60000, timestamp: '2025-07-08T16:32:17.279Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/get-fcm-token/50816', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/50816', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T16:32:17.367Z'}
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
    "meetingId": "wx3d-5cv4-bgxo",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiI2MjU3MmY1Yy01NmFkLTRiMjktYmFlNi01MTg2N2ZmYWI2MDkiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIiwiYWxsb3dfbW9kIl0sImlhdCI6MTc1MTk5MjMzNywiZXhwIjoxNzUxOTk0MTM3fQ.G6L9DTxnhZbmuQuyKBQKbQ6nObpUXY-u3Ro88360OEI",
    "callType": "video"
  }
}
ApiService.ts:1340 ✅ [ApiService] initiate-call response: {messageId: 'projects/adtip-3873c/messages/0:1751992337656932%e9e87daaf9fd7ecd'}
CallController.ts:67 [CallController] Status changed: idle -> outgoing
VideoSDKService.ts:44 [VideoSDK] Already initialized
NavigationService.ts:51 [NavigationService] Navigating to Meeting screen with params: {meetingId: 'wx3d-5cv4-bgxo', callType: 'video', displayName: 'R17 C', localParticipantId: 'not_provided'}
2console.js:654 Bluetooth Connect Permission Granted
MediaService.ts:107 [MediaService] Meeting reference set: true
MeetingScreenSimple.tsx:205 [MeetingScreen] New session detected, resetting join state: 8537ddc0-b5b9-4329-9e57-c93fa144ce2c
MeetingScreenSimple.tsx:221 [MeetingScreen] Attempt 1/3 to join meeting…
MeetingScreenSimple.tsx:235 [MeetingScreen] First join after app load - adding extra delay for WebSocket stability
MediaService.ts:107 [MediaService] Meeting reference set: true
MeetingScreenSimple.tsx:205 [MeetingScreen] New session detected, resetting join state: 8537ddc0-b5b9-4329-9e57-c93fa144ce2c
MeetingScreenSimple.tsx:221 [MeetingScreen] Attempt 1/3 to join meeting…
MeetingScreenSimple.tsx:235 [MeetingScreen] First join after app load - adding extra delay for WebSocket stability
MeetingScreenSimple.tsx:242 [MeetingScreen] Successfully joined meeting
CallController.ts:67 [CallController] Status changed: outgoing -> in_call
NavigationService.ts:51 [NavigationService] Navigating to Meeting screen with params: {meetingId: 'wx3d-5cv4-bgxo', callType: 'video', displayName: 'User', localParticipantId: 'not_provided'}
2MediaService.ts:107 [MediaService] Meeting reference set: false
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant slp8ezmx: {displayName: 'User', webcamOn: false, hasStream: false, streamId: undefined, hasTrack: false, isLocal: true}
2MediaService.ts:107 [MediaService] Meeting reference set: true
MeetingScreenSimple.tsx:242 [MeetingScreen] Successfully joined meeting
MediaService.ts:107 [MediaService] Meeting reference set: false
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant ttbdkq6q: {displayName: 'User', webcamOn: false, hasStream: false, streamId: undefined, hasTrack: false, isLocal: true}
MediaService.ts:107 [MediaService] Meeting reference set: true
MediaService.ts:107 [MediaService] Meeting reference set: false
MediaService.ts:107 [MediaService] Meeting reference set: true
2MediaService.ts:107 [MediaService] Meeting reference set: false
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant ttbdkq6q: {displayName: 'User', webcamOn: false, hasStream: false, streamId: undefined, hasTrack: false, isLocal: false}
MediaService.ts:107 [MediaService] Meeting reference set: true
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant slp8ezmx: {displayName: 'User', webcamOn: false, hasStream: false, streamId: undefined, hasTrack: false, isLocal: false}
MediaService.ts:107 [MediaService] Meeting reference set: true
MediaService.ts:107 [MediaService] Meeting reference set: false
MediaService.ts:107 [MediaService] Meeting reference set: true
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant slp8ezmx: {displayName: 'User', webcamOn: true, hasStream: false, streamId: undefined, hasTrack: false, isLocal: true}
2MediaService.ts:107 [MediaService] Meeting reference set: false
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant slp8ezmx: {displayName: 'User', webcamOn: true, hasStream: true, streamId: '998532ae-6565-4a0d-a45a-5ed97a1584e4', hasTrack: true, isLocal: true}
MediaService.ts:107 [MediaService] Meeting reference set: true
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant slp8ezmx: {displayName: 'User', webcamOn: true, hasStream: false, streamId: undefined, hasTrack: false, isLocal: false}
MediaService.ts:107 [MediaService] Meeting reference set: true
MediaService.ts:107 [MediaService] Meeting reference set: false
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant ttbdkq6q: {displayName: 'User', webcamOn: true, hasStream: false, streamId: undefined, hasTrack: false, isLocal: false}
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant ttbdkq6q: {displayName: 'User', webcamOn: true, hasStream: true, streamId: '36d1a653-b3ce-4980-be6c-3c8a23c4b8df', hasTrack: true, isLocal: true}
MediaService.ts:107 [MediaService] Meeting reference set: true
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant slp8ezmx: {displayName: 'User', webcamOn: true, hasStream: true, streamId: '32868245-7b98-4e12-892e-a81ab7889916', hasTrack: true, isLocal: false}
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant ttbdkq6q: {displayName: 'User', webcamOn: true, hasStream: true, streamId: '7a799d2d-4389-40ff-b389-51ed529ed6f5', hasTrack: true, isLocal: false}
CallController.ts:67 [CallController] Status changed: in_call -> ended
ApiService.ts:1352 [ApiService] Sending call signal to recipient: 50816 {type: 'CALL_END', sessionId: '8537ddc0-b5b9-4329-9e57-c93fa144ce2c'}
ApiService.ts:870 [ApiService] Getting FCM token for single user: 50816
2MediaService.ts:107 [MediaService] Meeting reference set: false
2MediaService.ts:107 [MediaService] Meeting reference set: true
ApiService.ts:214 Request to protected endpoint: /api/get-fcm-token/50816. Attempting to add Authorization header.
MediaService.ts:57 [MediaService] Leaving meeting
VideoSDKService.ts:189 [VideoSDK] Service reset
MediaService.ts:68 [MediaService] Meeting cleanup completed
MediaService.ts:107 [MediaService] Meeting reference set: false
MediaService.ts:107 [MediaService] Meeting reference set: true
BlocklistService.ts:60 [BlocklistService] Loaded 0 blocked users from storage
BlocklistService.ts:43 [BlocklistService] Initialized with 0 blocked users
BlocklistService.ts:162 [BlocklistService] Getting all blocked users, count: 0
ApiService.ts:221 Authorization header added to request for: /api/get-fcm-token/50816
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/get-fcm-token/50816', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/50816', headers: {…}, params: undefined, data: undefined, timeout: 60000, timestamp: '2025-07-08T16:32:33.665Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/get-fcm-token/50816', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/50816', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T16:32:34.292Z'}
ApiService.ts:873 [ApiService] Single user FCM token response: {status: true, fcm_token: 'cc-u78LGQOW_nHw8wEffZ8:APA91bGKb9RuVe1seUtYc1Lt1-iQkkUtw-btA4jAacmh2X5sQ5GOJU5i2IyHKUi_mML94IkOOUfjV1CKQ6Eby25nYfqrkO5WoDezL5M2UBa0dJRSqHXpfx4'}
ApiService.ts:876 [ApiService] Successfully extracted FCM token for user 50816: cc-u78LGQOW_nHw8wEffZ8:APA91bGKb9RuVe1seUtYc1Lt1-iQkkUtw-btA4jAacmh2X5sQ5GOJU5i2IyHKUi_mML94IkOOUfjV1CKQ6Eby25nYfqrkO5WoDezL5M2UBa0dJRSqHXpfx4
CallController.ts:67 [CallController] Status changed: ended -> idle
MediaService.ts:107 [MediaService] Meeting reference set: false
MediaService.ts:107 [MediaService] Meeting reference set: true
MediaService.ts:107 [MediaService] Meeting reference set: false
MeetingScreenSimple.tsx:274 [MeetingScreen] Component unmounting, cleaning up meeting
MeetingScreenSimple.tsx:278 [MeetingScreen] Successfully left meeting on cleanup
MediaService.ts:107 [MediaService] Meeting reference set: false
MeetingScreenSimple.tsx:274 [MeetingScreen] Component unmounting, cleaning up meeting
MeetingScreenSimple.tsx:278 [MeetingScreen] Successfully left meeting on cleanup
ApiService.ts:870 [ApiService] Getting FCM token for single user: 58422
ApiService.ts:214 Request to protected endpoint: /api/get-fcm-token/58422. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/get-fcm-token/58422
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', headers: {…}, params: undefined, data: undefined, timeout: 60000, timestamp: '2025-07-08T16:32:34.763Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T16:32:34.823Z'}
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
ApiService.ts:1477 ✅ [ApiService] update-call response: {messageId: 'projects/adtip-3873c/messages/0:1751992355115741%e9e87daaf9fd7ecd'}
VideoSDKService.ts:189 [VideoSDK] Service reset
MediaService.ts:68 [MediaService] Meeting cleanup completed
ApiService.ts:870 [ApiService] Getting FCM token for single user: 58422
ApiService.ts:214 Request to protected endpoint: /api/get-fcm-token/58422. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/get-fcm-token/58422
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', headers: {…}, params: undefined, data: undefined, timeout: 60000, timestamp: '2025-07-08T16:32:35.251Z'}
useFcmCallHandlers.ts:18 [FCM] Foreground message: {originalPriority: 1, priority: 1, sentTime: 1751992355108, data: {…}, from: '333436486029', messageId: '0:1751992355115741%e9e87daaf9fd7ecd', ttl: 2419200}
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T16:32:35.317Z'}
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
ApiService.ts:1477 ✅ [ApiService] update-call response: {messageId: 'projects/adtip-3873c/messages/0:1751992355623312%e9e87daaf9fd7ecd'}
useFcmCallHandlers.ts:18 [FCM] Foreground message: {originalPriority: 1, priority: 1, sentTime: 1751992355614, data: {…}, from: '333436486029', messageId: '0:1751992355623312%e9e87daaf9fd7ecd', ttl: 2419200}
2AppOpenAdManager.ts:67 App open ad failed to load: NativeError: [googleMobileAds/no-fill] No fill.
    at _handleAdEvent (http://localhost:8081/index.bundle//&platform=android&dev=true&lazy=true&minify=false&app=com.adtip.app.adtip_app&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server:138299:100)
    at apply (native)
    at emit (http://localhost:8081/index.bundle//&platform=android&dev=true&lazy=true&minify=false&app=com.adtip.app.adtip_app&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server:2907:40)
    at anonymous (http://localhost:8081/index.bundle//&platform=android&dev=true&lazy=true&minify=false&app=com.adtip.app.adtip_app&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server:140795:100)
    at apply (native)
    at emit (http://localhost:8081/index.bundle//&platform=android&dev=true&lazy=true&minify=false&app=com.adtip.app.adtip_app&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server:2907:40)
    at apply (native)
    at anonymous (http://localhost:8081/index.bundle//&platform=android&dev=true&lazy=true&minify=false&app=com.adtip.app.adtip_app&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server:2769:200)
    at emit (http://localhost:8081/index.bundle//&platform=android&dev=true&lazy=true&minify=false&app=com.adtip.app.adtip_app&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server:2785:66)
CallBillingService.ts:76 [CallBillingService] Calculating billing for: {userId: '58422', callType: 'video', currentBalance: 1000, isPremium: false}
CallBillingService.ts:100 [CallBillingService] Calculated billing: {ratePerMinute: 14, maxMinutes: 71, maxDurationSeconds: 4260, warningThresholds: Array(5)}
CallController.ts:304 [CallController] Starting video call to R17BKP
VideoSDKService.ts:51 [VideoSDK] Initializing...
VideoSDKService.ts:60 [VideoSDK] Initialization complete
VideoSDKService.ts:151 [VideoSDK] Generating participant token via backend
ApiService.ts:214 Request to protected endpoint: /api/generate-token/videosdk. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/generate-token/videosdk
ApiService.ts:228 🚀 API REQUEST: {method: 'POST', url: '/api/generate-token/videosdk', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/generate-token/videosdk', headers: {…}, params: undefined, data: {…}, timeout: 60000, timestamp: '2025-07-08T16:32:43.567Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'POST', url: '/api/generate-token/videosdk', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/generate-token/videosdk', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T16:32:43.781Z'}
VideoSDKService.ts:110 [VideoSDK] Creating meeting via backend API
ApiService.ts:214 Request to protected endpoint: /api/create-meeting/videosdk. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/create-meeting/videosdk
ApiService.ts:228 🚀 API REQUEST: {method: 'POST', url: '/api/create-meeting/videosdk', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/create-meeting/videosdk', headers: {…}, params: undefined, data: {…}, timeout: 60000, timestamp: '2025-07-08T16:32:43.798Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'POST', url: '/api/create-meeting/videosdk', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/create-meeting/videosdk', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T16:32:43.879Z'}
ApiService.ts:1308 [ApiService] Create VideoSDK meeting response: {success: true, data: {…}, message: 'Meeting created successfully'}
VideoSDKService.ts:115 [VideoSDK] Raw API response: {success: true, data: {…}, message: 'Meeting created successfully'}
VideoSDKService.ts:119 [VideoSDK] Meeting created: cad2-x0mj-byeo
ApiService.ts:870 [ApiService] Getting FCM token for single user: 58422
ApiService.ts:214 Request to protected endpoint: /api/get-fcm-token/58422. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/get-fcm-token/58422
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', headers: {…}, params: undefined, data: undefined, timeout: 60000, timestamp: '2025-07-08T16:32:43.898Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T16:32:43.956Z'}
ApiService.ts:873 [ApiService] Single user FCM token response: {status: true, fcm_token: 'c3D2_peXS3-T8-KgvaqJrR:APA91bFWlaxBWCmv-AWLCEPrVPUdQNbaAlz7QUA7pQL-pfo4UYneZXxCBEA0z77zLzyOCiiuNkfjJzWloNtgg6Jk2x_Z2sOw73TMPiTdfqU9izXknJXjRzw'}
ApiService.ts:876 [ApiService] Successfully extracted FCM token for user 58422: c3D2_peXS3-T8-KgvaqJrR:APA91bFWlaxBWCmv-AWLCEPrVPUdQNbaAlz7QUA7pQL-pfo4UYneZXxCBEA0z77zLzyOCiiuNkfjJzWloNtgg6Jk2x_Z2sOw73TMPiTdfqU9izXknJXjRzw
ApiService.ts:870 [ApiService] Getting FCM token for single user: 63779
ApiService.ts:214 Request to protected endpoint: /api/get-fcm-token/63779. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/get-fcm-token/63779
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/get-fcm-token/63779', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/63779', headers: {…}, params: undefined, data: undefined, timeout: 60000, timestamp: '2025-07-08T16:32:43.968Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/get-fcm-token/63779', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/63779', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T16:32:44.030Z'}
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
    "meetingId": "cad2-x0mj-byeo",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiI2MjU3MmY1Yy01NmFkLTRiMjktYmFlNi01MTg2N2ZmYWI2MDkiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIiwiYWxsb3dfbW9kIl0sImlhdCI6MTc1MTk5MjM2MywiZXhwIjoxNzUxOTk0MTYzfQ.0DeHpiJj8JElZksHj5YCMzdbGHDOQpO_2ruoH1yGpEQ",
    "callType": "video"
  }
}
ApiService.ts:1340 ✅ [ApiService] initiate-call response: {messageId: 'projects/adtip-3873c/messages/0:1751992364331379%e9e87daaf9fd7ecd'}
CallController.ts:67 [CallController] Status changed: idle -> outgoing
VideoSDKService.ts:44 [VideoSDK] Already initialized
NavigationService.ts:51 [NavigationService] Navigating to Meeting screen with params: {meetingId: 'cad2-x0mj-byeo', callType: 'video', displayName: 'R17 C', localParticipantId: 'not_provided'}
3console.js:654 Bluetooth Connect Permission Granted
MediaService.ts:107 [MediaService] Meeting reference set: true
MeetingScreenSimple.tsx:205 [MeetingScreen] New session detected, resetting join state: 131b8193-9bda-4184-9d02-15ed7ef3bf2d
MeetingScreenSimple.tsx:221 [MeetingScreen] Attempt 1/3 to join meeting…
MeetingScreenSimple.tsx:235 [MeetingScreen] First join after app load - adding extra delay for WebSocket stability
MediaService.ts:107 [MediaService] Meeting reference set: true
MeetingScreenSimple.tsx:205 [MeetingScreen] New session detected, resetting join state: 131b8193-9bda-4184-9d02-15ed7ef3bf2d
MeetingScreenSimple.tsx:221 [MeetingScreen] Attempt 1/3 to join meeting…
MeetingScreenSimple.tsx:235 [MeetingScreen] First join after app load - adding extra delay for WebSocket stability
MediaService.ts:107 [MediaService] Meeting reference set: true
MeetingScreenSimple.tsx:205 [MeetingScreen] New session detected, resetting join state: 131b8193-9bda-4184-9d02-15ed7ef3bf2d
MeetingScreenSimple.tsx:221 [MeetingScreen] Attempt 1/3 to join meeting…
MeetingScreenSimple.tsx:235 [MeetingScreen] First join after app load - adding extra delay for WebSocket stability
MeetingScreenSimple.tsx:242 [MeetingScreen] Successfully joined meeting
CallController.ts:67 [CallController] Status changed: outgoing -> in_call
NavigationService.ts:51 [NavigationService] Navigating to Meeting screen with params: {meetingId: 'cad2-x0mj-byeo', callType: 'video', displayName: 'User', localParticipantId: 'not_provided'}
3MediaService.ts:107 [MediaService] Meeting reference set: false
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant k7mrkppn: {displayName: 'User', webcamOn: false, hasStream: false, streamId: undefined, hasTrack: false, isLocal: true}
3MediaService.ts:107 [MediaService] Meeting reference set: true
MeetingScreenSimple.tsx:242 [MeetingScreen] Successfully joined meeting
MediaService.ts:107 [MediaService] Meeting reference set: false
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant zugrgvqe: {displayName: 'User', webcamOn: false, hasStream: false, streamId: undefined, hasTrack: false, isLocal: true}
MediaService.ts:107 [MediaService] Meeting reference set: true
MeetingScreenSimple.tsx:242 [MeetingScreen] Successfully joined meeting
MediaService.ts:107 [MediaService] Meeting reference set: false
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant sxjrfec5: {displayName: 'User', webcamOn: false, hasStream: false, streamId: undefined, hasTrack: false, isLocal: true}
MediaService.ts:107 [MediaService] Meeting reference set: true
MediaService.ts:107 [MediaService] Meeting reference set: false
MediaService.ts:107 [MediaService] Meeting reference set: true
3MediaService.ts:107 [MediaService] Meeting reference set: false
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant zugrgvqe: {displayName: 'User', webcamOn: false, hasStream: false, streamId: undefined, hasTrack: false, isLocal: false}
MediaService.ts:107 [MediaService] Meeting reference set: true
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant sxjrfec5: {displayName: 'User', webcamOn: false, hasStream: false, streamId: undefined, hasTrack: false, isLocal: false}
MediaService.ts:107 [MediaService] Meeting reference set: true
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant zugrgvqe: {displayName: 'User', webcamOn: false, hasStream: false, streamId: undefined, hasTrack: false, isLocal: false}
MediaService.ts:107 [MediaService] Meeting reference set: true
3MediaService.ts:107 [MediaService] Meeting reference set: false
3MediaService.ts:107 [MediaService] Meeting reference set: true
3MediaService.ts:107 [MediaService] Meeting reference set: false
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant zugrgvqe: {displayName: 'User', webcamOn: true, hasStream: false, streamId: undefined, hasTrack: false, isLocal: false}
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant k7mrkppn: {displayName: 'User', webcamOn: true, hasStream: true, streamId: '5e2b8366-c3bd-4faa-9a84-907dfb041360', hasTrack: true, isLocal: true}
MediaService.ts:107 [MediaService] Meeting reference set: true
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant sxjrfec5: {displayName: 'User', webcamOn: true, hasStream: false, streamId: undefined, hasTrack: false, isLocal: false}
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant zugrgvqe: {displayName: 'User', webcamOn: true, hasStream: true, streamId: '1abbf9a8-7a32-4584-8e8b-1c521df063da', hasTrack: true, isLocal: true}
MediaService.ts:107 [MediaService] Meeting reference set: true
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant zugrgvqe: {displayName: 'User', webcamOn: true, hasStream: false, streamId: undefined, hasTrack: false, isLocal: false}
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant sxjrfec5: {displayName: 'User', webcamOn: true, hasStream: true, streamId: '1613035e-362e-4b35-b8b8-02b53d9dede5', hasTrack: true, isLocal: true}
MediaService.ts:107 [MediaService] Meeting reference set: true
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant sxjrfec5: {displayName: 'User', webcamOn: true, hasStream: true, streamId: '1643a547-2ed4-4e39-b1b5-c041ddfc8591', hasTrack: true, isLocal: false}
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant zugrgvqe: {displayName: 'User', webcamOn: true, hasStream: true, streamId: 'c1cc008b-d5c4-4451-8782-3eaa93554b46', hasTrack: true, isLocal: false}
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant zugrgvqe: {displayName: 'User', webcamOn: true, hasStream: true, streamId: '7b9bd6b8-8fec-4c80-9604-93843b29e286', hasTrack: true, isLocal: false}