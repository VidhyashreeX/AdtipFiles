[Index] VideoSDK registered successfully
index.js:30 [Index] Firebase app already initialized
console.js:654 Running "Adtip" with {"rootTag":11,"initialProps":{},"fabric":true}
CallConfig.ts:45 [CallConfig] Configuration updated: Object
App.tsx:432 [App] Call configuration initialized for simplified flow
CallSignalingService.ts:33 [CallSignalingService] Disabled by configuration - skipping FCM listener setup
App.tsx:457 App.tsx: Ensuring app open ad is loaded
AppOpenAdManager.ts:198 Force loading app open ad
UltraFastLoader.tsx:227 [UltraFastLoader] Navigation is ready
UltraFastLoader.tsx:103 [UltraFastLoader] Rendering screen: Object
UltraFastLoader.tsx:126 [UltraFastLoader] App rendered in: 477 ms
UltraFastLoader.tsx:130 [UltraFastLoader] Authentication state: Object
App.tsx:128 [App] Ultra-fast initialization complete
App.tsx:170 [App] All services marked as ready for instant app start
QueryProvider.tsx:49 Cache restored from storage
HomeScreen.tsx:328 [HomeScreen] Screen focused. Invalidating and refetching posts.
HomeScreen.tsx:342 [HomeScreen] Component mounted or user changed. Triggering initial fetch.
UltraFastLoader.tsx:103 [UltraFastLoader] Rendering screen: Object
WalletService.ts:16 WalletService: Fetching balance for user ID: 58422
AuthContext.tsx:424 🔄 User authenticated, starting ping service for user 58422
LastSeenService.ts:45 🔄 Sending ping to update online status...
LastSeenService.ts:25 🔄 Ping service started, will ping every 10 minutes
ApiService.ts:214 Request to protected endpoint: /api/list-posts. Attempting to add Authorization header.
ApiService.ts:214 Request to protected endpoint: /api/check-premium/58422. Attempting to add Authorization header.
ApiService.ts:214 Request to protected endpoint: /api/ping. Attempting to add Authorization header.
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
WalletService.ts:24 WalletService: Auth token available: true
ApiService.ts:214 Request to protected endpoint: /api/getfunds/58422. Attempting to add Authorization header.
App.tsx:181 [App] Background: Initializing Firebase service...
App.tsx:186 [App] Background: Found 1 Firebase app(s)
App.tsx:213 [App] Background: Initializing VideoSDK service...
VideoSDKService.ts:51 [VideoSDK] Initializing...
ApiService.ts:221 Authorization header added to request for: /api/list-posts
ApiService.ts:228 🚀 API REQUEST: Object
ApiService.ts:221 Authorization header added to request for: /api/check-premium/58422
ApiService.ts:228 🚀 API REQUEST: Object
ApiService.ts:221 Authorization header added to request for: /api/ping
ApiService.ts:228 🚀 API REQUEST: Object
ApiService.ts:221 Authorization header added to request for: /api/getfunds/58422
ApiService.ts:228 🚀 API REQUEST: Object
ApiService.ts:269 ❌ API ERROR RESPONSE: Object
ApiService.ts:499 API Error Details (handleError): Object
App.tsx:233 [App] Background: Requesting notification permissions...
PermissionManagerService.ts:135 [PermissionManager] Requesting notification permissions...
ApiService.ts:253 📥 API RESPONSE: Object
WalletService.ts:34 WalletService: API response: {"status":200,"message":"Fetched latest balance successfully.","availableBalance":"1000.00"}
ApiService.ts:214 Request to protected endpoint: /api/check-premium/58422. Attempting to add Authorization header.
ApiService.ts:253 📥 API RESPONSE: Object
LastSeenService.ts:50 🔄 Ping API Response: Object
ApiService.ts:221 Authorization header added to request for: /api/check-premium/58422
ApiService.ts:228 🚀 API REQUEST: Object
ApiService.ts:253 📥 API RESPONSE: Object
FirebaseService.ts:75 [FCM] Firebase Messaging is supported
PostItem.tsx:164 [PostItem 1051] Loading video: https://theadtip.in/videos/7697.mp4
PostItem.tsx:133 [PostItem 1051] Testing video URL: https://theadtip.in/videos/7697.mp4
mediaUtils.ts:68 [MediaUtils] Validated external video URL: https://theadtip.in/videos/7697.mp4
ApiService.ts:269 ❌ API ERROR RESPONSE: Object
ApiService.ts:499 API Error Details (handleError): Object
AppOpenAdManager.ts:85 App state changed: active -> background
AppOpenAdManager.ts:125 App went to background, resetting session flag
FirebaseService.ts:94 [FCM] Firebase messaging v22.2.1 initialized successfully.
App.tsx:193 [App] Background: Firebase service initialized successfully
FirebaseService.ts:164 [FCM] Notification permissions granted: 1
VideoSDKService.ts:60 [VideoSDK] Initialization complete
App.tsx:218 [App] Background: VideoSDK service initialized successfully
AppOpenAdManager.ts:85 App state changed: background -> active
AppOpenAdManager.ts:106 [AppOpenAdManager] App came to foreground, delaying ad check for 500ms
PermissionManagerService.ts:154 [PermissionManager] Android notification permissions: Object
App.tsx:236 [App] Background: Notification permissions result: true
App.tsx:238 [App] Background: Initializing Unified Call Service...
App.tsx:244 [App] Background: Unified Call Service initialized successfully
App.tsx:284 [App] Background: Initializing PubScale service...
PubScaleService.ts:30 [PubScaleService] Native module available: true
PostItem.tsx:164 [PostItem 1108] Loading video: https://theadtip.in/videos/ad123.mp4
PostItem.tsx:133 [PostItem 1108] Testing video URL: https://theadtip.in/videos/ad123.mp4
mediaUtils.ts:68 [MediaUtils] Validated external video URL: https://theadtip.in/videos/ad123.mp4
mediaUtils.ts:188 [MediaUtils] Testing video URL: https://theadtip.in/videos/7697.mp4
PermissionsService.ts:49 [PermissionsService] FOREGROUND_SERVICE_PHONE_CALL already granted
App.tsx:273 [App] Background: Phone call permissions requested
App.tsx:251 [App] Background: CallKeep is available and will be initialized by UnifiedCallService
mediaUtils.ts:188 [MediaUtils] Testing video URL: https://theadtip.in/videos/ad123.mp4
FirebaseService.ts:334 [FCM] Current FCM token: c3D2_peXS3-T8-KgvaqJrR:APA91bFWlaxBWCmv-AWLCEPrVPUdQNbaAlz7QUA7pQL-pfo4UYneZXxCBEA0z77zLzyOCiiuNkfjJzWloNtgg6Jk2x_Z2sOw73TMPiTdfqU9izXknJXjRzw
ApiService.ts:648 [ApiService] Updating FCM token on server: Object
ApiService.ts:214 Request to protected endpoint: /api/update-fcm-token. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/update-fcm-token
ApiService.ts:228 🚀 API REQUEST: Object
ApiService.ts:253 📥 API RESPONSE: Object
ApiService.ts:673 [ApiService] FCM token update response: Object
FirebaseService.ts:172 [FCM] Notification setup completed successfully
FirebaseService.ts:194 [FirebaseService] Notification listeners disabled by configuration
AppOpenAdManager.ts:171 App open ad not ready, will show when loaded
BannerAdComponent.tsx:31 Banner ad failed to load: NativeError: [googleMobileAds/error-code-no-fill] The ad request was successful, but no ad was returned due to lack of ad inventory.
    at onNativeEvent (http://localhost:8081/index.bundle//&platform=android&dev=true&lazy=true&minify=false&app=com.adtip.app.adtip_app&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server:138844:108)
    at executeDispatch (http://localhost:8081/index.bundle//&platform=android&dev=true&lazy=true&minify=false&app=com.adtip.app.adtip_app&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server:4459:17)
    at executeDispatchesAndReleaseTopLevel (http://localhost:8081/index.bundle//&platform=android&dev=true&lazy=true&minify=false&app=com.adtip.app.adtip_app&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server:4807:229)
    at call (native)
    at forEachAccumulated (http://localhost:8081/index.bundle//&platform=android&dev=true&lazy=true&minify=false&app=com.adtip.app.adtip_app&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server:4602:67)
    at anonymous (http://localhost:8081/index.bundle//&platform=android&dev=true&lazy=true&minify=false&app=com.adtip.app.adtip_app&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server:4836:29)
    at batchedUpdatesImpl (http://localhost:8081/index.bundle//&platform=android&dev=true&lazy=true&minify=false&app=com.adtip.app.adtip_app&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server:13074:18)
    at batchedUpdates$1 (http://localhost:8081/index.bundle//&platform=android&dev=true&lazy=true&minify=false&app=com.adtip.app.adtip_app&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server:4797:34)
    at dispatchEvent (http://localhost:8081/index.bundle//&platform=android&dev=true&lazy=true&minify=false&app=com.adtip.app.adtip_app&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server:4819:23)
PostItem.tsx:139 [PostItem 1108] Video URL test result: Object
PostItem.tsx:142 [PostItem 1108] Video URL failed validation: Object
anonymous @ console.js:654
overrideMethod @ backend.js:17042
reactConsoleErrorHandler @ ExceptionsManager.js:182
anonymous @ setUpDeveloperTools.js:40
registerError @ LogBox.js:231
anonymous @ LogBox.js:80
?anon_0_ @ PostItem.tsx:142
asyncGeneratorStep @ asyncToGenerator.js:3
_next @ asyncToGenerator.js:17
Show 8 more frames
Show less
mediaUtils.ts:92 [MediaUtils] Creating secure video source for: https://theadtip.in/videos/ad123.mp4
mediaUtils.ts:68 [MediaUtils] Validated external video URL: https://theadtip.in/videos/ad123.mp4
PostItem.tsx:139 [PostItem 1051] Video URL test result: Object
mediaUtils.ts:92 [MediaUtils] Creating secure video source for: https://theadtip.in/videos/7697.mp4
mediaUtils.ts:68 [MediaUtils] Validated external video URL: https://theadtip.in/videos/7697.mp4
mediaUtils.ts:108 [MediaUtils] Created video source: Object
PostItem.tsx:171 [PostItem 1108] Created secure video source: Object
PostItem.tsx:164 [PostItem 1107] Loading video: https://theadtip.in/videos/1000003423.mp4
PostItem.tsx:133 [PostItem 1107] Testing video URL: https://theadtip.in/videos/1000003423.mp4
mediaUtils.ts:68 [MediaUtils] Validated external video URL: https://theadtip.in/videos/1000003423.mp4
mediaUtils.ts:108 [MediaUtils] Created video source: Object
PostItem.tsx:171 [PostItem 1051] Created secure video source: Object
mediaUtils.ts:188 [MediaUtils] Testing video URL: https://theadtip.in/videos/1000003423.mp4
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
PostItem.tsx:164 [PostItem 1051] Loading video: https://theadtip.in/videos/7697.mp4
mediaUtils.ts:92 [MediaUtils] Creating secure video source for: https://theadtip.in/videos/7697.mp4
mediaUtils.ts:68 [MediaUtils] Validated external video URL: https://theadtip.in/videos/7697.mp4
PostItem.tsx:164 [PostItem 1108] Loading video: https://theadtip.in/videos/ad123.mp4
mediaUtils.ts:92 [MediaUtils] Creating secure video source for: https://theadtip.in/videos/ad123.mp4
mediaUtils.ts:68 [MediaUtils] Validated external video URL: https://theadtip.in/videos/ad123.mp4
mediaUtils.ts:108 [MediaUtils] Created video source: Object
PostItem.tsx:171 [PostItem 1051] Created secure video source: Object
mediaUtils.ts:108 [MediaUtils] Created video source: Object
PostItem.tsx:171 [PostItem 1108] Created secure video source: Object
PostItem.tsx:218 [PostItem 1051] Video load started
App.tsx:286 [App] Background: PubScale service initialized successfully
PostItem.tsx:139 [PostItem 1107] Video URL test result: Object
mediaUtils.ts:92 [MediaUtils] Creating secure video source for: https://theadtip.in/videos/1000003423.mp4
mediaUtils.ts:68 [MediaUtils] Validated external video URL: https://theadtip.in/videos/1000003423.mp4
mediaUtils.ts:108 [MediaUtils] Created video source: Object
PostItem.tsx:171 [PostItem 1107] Created secure video source: Object
PostItem.tsx:164 [PostItem 1107] Loading video: https://theadtip.in/videos/1000003423.mp4
mediaUtils.ts:92 [MediaUtils] Creating secure video source for: https://theadtip.in/videos/1000003423.mp4
mediaUtils.ts:68 [MediaUtils] Validated external video URL: https://theadtip.in/videos/1000003423.mp4
mediaUtils.ts:108 [MediaUtils] Created video source: Object
PostItem.tsx:171 [PostItem 1107] Created secure video source: Object
PostItem.tsx:218 [PostItem 1107] Video load started
PostItem.tsx:223 [PostItem 1051] Video loaded successfully: Object
PostItem.tsx:223 [PostItem 1107] Video loaded successfully: Object
TabNavigator.tsx:117 TabNavigator: Instant navigation to TipCall
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
ApiService.ts:228 🚀 API REQUEST: Object
ApiService.ts:221 Authorization header added to request for: /api/missed-calls/58422
ApiService.ts:228 🚀 API REQUEST: Object
ApiService.ts:253 📥 API RESPONSE: Object
ApiService.ts:253 📥 API RESPONSE: Object
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
ApiService.ts:228 🚀 API REQUEST: Object
ApiService.ts:979 [API] Fetching users with data: {
  "id": 0,
  "page": 1,
  "limit": 20,
  "language": [],
  "interest": [],
  "user_id": null,
  "search_by_name": "R1",
  "loggined_user_id": 58422,
  "sortBy": {}
}
ApiService.ts:214 Request to protected endpoint: /api/users. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/users
ApiService.ts:228 🚀 API REQUEST: Object
ApiService.ts:253 📥 API RESPONSE: Object
ApiService.ts:253 📥 API RESPONSE: Object
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
ApiService.ts:228 🚀 API REQUEST: Object
ApiService.ts:253 📥 API RESPONSE: Object
CallBillingService.ts:76 [CallBillingService] Calculating billing for: Object
CallBillingService.ts:100 [CallBillingService] Calculated billing: Object
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
CallController.ts:304 [CallController] Starting video call to R17BKP
VideoSDKService.ts:44 [VideoSDK] Already initialized
VideoSDKService.ts:151 [VideoSDK] Generating participant token via backend
ApiService.ts:214 Request to protected endpoint: /api/generate-token/videosdk. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/generate-token/videosdk
ApiService.ts:228 🚀 API REQUEST: Object
ApiService.ts:253 📥 API RESPONSE: Object
VideoSDKService.ts:110 [VideoSDK] Creating meeting via backend API
ApiService.ts:214 Request to protected endpoint: /api/create-meeting/videosdk. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/create-meeting/videosdk
ApiService.ts:228 🚀 API REQUEST: Object
ApiService.ts:253 📥 API RESPONSE: Object
ApiService.ts:1308 [ApiService] Create VideoSDK meeting response: Object
VideoSDKService.ts:115 [VideoSDK] Raw API response: Object
VideoSDKService.ts:119 [VideoSDK] Meeting created: rve5-pr90-ar0n
ApiService.ts:870 [ApiService] Getting FCM token for single user: 58422
ApiService.ts:214 Request to protected endpoint: /api/get-fcm-token/58422. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/get-fcm-token/58422
ApiService.ts:228 🚀 API REQUEST: Object
ApiService.ts:253 📥 API RESPONSE: Object
ApiService.ts:873 [ApiService] Single user FCM token response: Object
ApiService.ts:876 [ApiService] Successfully extracted FCM token for user 58422: c3D2_peXS3-T8-KgvaqJrR:APA91bFWlaxBWCmv-AWLCEPrVPUdQNbaAlz7QUA7pQL-pfo4UYneZXxCBEA0z77zLzyOCiiuNkfjJzWloNtgg6Jk2x_Z2sOw73TMPiTdfqU9izXknJXjRzw
ApiService.ts:870 [ApiService] Getting FCM token for single user: 63779
ApiService.ts:214 Request to protected endpoint: /api/get-fcm-token/63779. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/get-fcm-token/63779
ApiService.ts:228 🚀 API REQUEST: Object
ApiService.ts:253 📥 API RESPONSE: Object
ApiService.ts:873 [ApiService] Single user FCM token response: Object
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
    "meetingId": "rve5-pr90-ar0n",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiI2MjU3MmY1Yy01NmFkLTRiMjktYmFlNi01MTg2N2ZmYWI2MDkiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIiwiYWxsb3dfbW9kIl0sImlhdCI6MTc1MTk5NjY4OCwiZXhwIjoxNzUxOTk4NDg4fQ.DkabcTMq4qmUm6jXvn-92r5p0l6v0kp_t6hnHCQ6ktE",
    "callType": "video"
  }
}
ApiService.ts:1340 ✅ [ApiService] initiate-call response: Object
CallController.ts:67 [CallController] Status changed: idle -> outgoing
VideoSDKService.ts:44 [VideoSDK] Already initialized
NavigationService.ts:51 [NavigationService] Navigating to Meeting screen with params: Object
console.js:654 Bluetooth Connect Permission Granted
MediaService.ts:107 [MediaService] Meeting reference set: true
MeetingScreenSimple.tsx:205 [MeetingScreen] New session detected, resetting join state: 2bc1f683-fc3d-4e9c-9535-b80a91d4c53c
MeetingScreenSimple.tsx:221 [MeetingScreen] Attempt 1/3 to join meeting…
MeetingScreenSimple.tsx:235 [MeetingScreen] First join after app load - adding extra delay for WebSocket stability
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
MeetingScreenSimple.tsx:242 [MeetingScreen] Successfully joined meeting
CallController.ts:67 [CallController] Status changed: outgoing -> in_call
NavigationService.ts:51 [NavigationService] Navigating to Meeting screen with params: Object
MediaService.ts:107 [MediaService] Meeting reference set: false
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant 909f2oty: Object
MediaService.ts:107 [MediaService] Meeting reference set: true
MediaService.ts:107 [MediaService] Meeting reference set: false
MediaService.ts:107 [MediaService] Meeting reference set: true
MediaService.ts:107 [MediaService] Meeting reference set: false
MediaService.ts:107 [MediaService] Meeting reference set: true
MediaService.ts:107 [MediaService] Meeting reference set: false
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant 909f2oty: Object
MediaService.ts:107 [MediaService] Meeting reference set: true
Welcome to React Native DevTools
Debugger integration: Android Bridgeless (ReactHostImpl)
MediaService.ts:107 [MediaService] Meeting reference set: false
MediaService.ts:107 [MediaService] Meeting reference set: true
MediaService.ts:107 [MediaService] Meeting reference set: false
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant 909f2oty: {displayName: 'User', webcamOn: true, hasStream: false, streamId: undefined, hasTrack: false, isLocal: true}
MediaService.ts:107 [MediaService] Meeting reference set: true
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant 909f2oty: {displayName: 'User', webcamOn: false, hasStream: false, streamId: undefined, hasTrack: false, isLocal: true}
MediaService.ts:107 [MediaService] Meeting reference set: false
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant 909f2oty: {displayName: 'User', webcamOn: true, hasStream: true, streamId: 'e1814bea-d1ea-498e-b6d5-65aead1c6f35', hasTrack: true, isLocal: true}
MediaService.ts:107 [MediaService] Meeting reference set: true
MediaService.ts:107 [MediaService] Meeting reference set: false
MediaService.ts:107 [MediaService] Meeting reference set: true
MediaService.ts:107 [MediaService] Meeting reference set: false
MediaService.ts:107 [MediaService] Meeting reference set: true
MediaService.ts:107 [MediaService] Meeting reference set: false
MediaService.ts:107 [MediaService] Meeting reference set: true
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
CallController.ts:67 [CallController] Status changed: in_call -> ended
ApiService.ts:1352 [ApiService] Sending call signal to recipient: 63779 {type: 'CALL_END', sessionId: '2bc1f683-fc3d-4e9c-9535-b80a91d4c53c'}
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
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/get-fcm-token/63779', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/63779', headers: {…}, params: undefined, data: undefined, timeout: 60000, timestamp: '2025-07-08T17:45:25.592Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/get-fcm-token/63779', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/63779', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T17:45:26.401Z'}
ApiService.ts:873 [ApiService] Single user FCM token response: {status: true, fcm_token: 'ckOrGpJHQ-mtE6jEks9e8x:APA91bFc6mMfPfJyecmMuDZJjl_qW9H-ABdjkYjOEGo8dK2IESfnJvhxz9osyvbL6RklrMKiULffIv692PnYDR2kmuVJYnTPoy7DT1rrj1Pzku66wYwYWL4'}
ApiService.ts:876 [ApiService] Successfully extracted FCM token for user 63779: ckOrGpJHQ-mtE6jEks9e8x:APA91bFc6mMfPfJyecmMuDZJjl_qW9H-ABdjkYjOEGo8dK2IESfnJvhxz9osyvbL6RklrMKiULffIv692PnYDR2kmuVJYnTPoy7DT1rrj1Pzku66wYwYWL4
CallController.ts:67 [CallController] Status changed: ended -> idle
MediaService.ts:107 [MediaService] Meeting reference set: false
MeetingScreenSimple.tsx:274 [MeetingScreen] Component unmounting, cleaning up meeting
MeetingScreenSimple.tsx:278 [MeetingScreen] Successfully left meeting on cleanup
ApiService.ts:870 [ApiService] Getting FCM token for single user: 58422
ApiService.ts:214 Request to protected endpoint: /api/get-fcm-token/58422. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/get-fcm-token/58422
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', headers: {…}, params: undefined, data: undefined, timeout: 60000, timestamp: '2025-07-08T17:45:26.486Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T17:45:26.538Z'}
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
ApiService.ts:1477 ✅ [ApiService] update-call response: {messageId: 'projects/adtip-3873c/messages/0:1751996726851423%e9e87daaf9fd7ecd'}
VideoSDKService.ts:189 [VideoSDK] Service reset
MediaService.ts:68 [MediaService] Meeting cleanup completed
useFcmCallHandlers.ts:18 [FCM] Foreground message: {originalPriority: 1, priority: 1, sentTime: 1751996726843, data: {…}, from: '333436486029', messageId: '0:1751996726851423%e9e87daaf9fd7ecd', ttl: 2419200}
ApiService.ts:870 [ApiService] Getting FCM token for single user: 58422
ApiService.ts:214 Request to protected endpoint: /api/get-fcm-token/58422. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/get-fcm-token/58422
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', headers: {…}, params: undefined, data: undefined, timeout: 60000, timestamp: '2025-07-08T17:45:26.971Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T17:45:27.017Z'}
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
ApiService.ts:1477 ✅ [ApiService] update-call response: {messageId: 'projects/adtip-3873c/messages/0:1751996727298054%e9e87daaf9fd7ecd'}
useFcmCallHandlers.ts:18 [FCM] Foreground message: {originalPriority: 1, priority: 1, sentTime: 1751996727292, data: {…}, from: '333436486029', messageId: '0:1751996727298054%e9e87daaf9fd7ecd', ttl: 2419200}
CallBillingService.ts:76 [CallBillingService] Calculating billing for: {userId: '58422', callType: 'video', currentBalance: 1000, isPremium: false}
CallBillingService.ts:100 [CallBillingService] Calculated billing: {ratePerMinute: 14, maxMinutes: 71, maxDurationSeconds: 4260, warningThresholds: Array(5)}
CallController.ts:304 [CallController] Starting video call to R17BKP
VideoSDKService.ts:51 [VideoSDK] Initializing...
VideoSDKService.ts:60 [VideoSDK] Initialization complete
VideoSDKService.ts:151 [VideoSDK] Generating participant token via backend
ApiService.ts:214 Request to protected endpoint: /api/generate-token/videosdk. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/generate-token/videosdk
ApiService.ts:228 🚀 API REQUEST: {method: 'POST', url: '/api/generate-token/videosdk', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/generate-token/videosdk', headers: {…}, params: undefined, data: {…}, timeout: 60000, timestamp: '2025-07-08T17:45:33.784Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'POST', url: '/api/generate-token/videosdk', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/generate-token/videosdk', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T17:45:34.068Z'}
VideoSDKService.ts:110 [VideoSDK] Creating meeting via backend API
ApiService.ts:214 Request to protected endpoint: /api/create-meeting/videosdk. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/create-meeting/videosdk
ApiService.ts:228 🚀 API REQUEST: {method: 'POST', url: '/api/create-meeting/videosdk', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/create-meeting/videosdk', headers: {…}, params: undefined, data: {…}, timeout: 60000, timestamp: '2025-07-08T17:45:34.087Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'POST', url: '/api/create-meeting/videosdk', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/create-meeting/videosdk', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T17:45:34.173Z'}
ApiService.ts:1308 [ApiService] Create VideoSDK meeting response: {success: true, data: {…}, message: 'Meeting created successfully'}
VideoSDKService.ts:115 [VideoSDK] Raw API response: {success: true, data: {…}, message: 'Meeting created successfully'}
VideoSDKService.ts:119 [VideoSDK] Meeting created: 37y0-kytm-emil
ApiService.ts:870 [ApiService] Getting FCM token for single user: 58422
ApiService.ts:214 Request to protected endpoint: /api/get-fcm-token/58422. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/get-fcm-token/58422
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', headers: {…}, params: undefined, data: undefined, timeout: 60000, timestamp: '2025-07-08T17:45:34.200Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T17:45:34.275Z'}
ApiService.ts:873 [ApiService] Single user FCM token response: {status: true, fcm_token: 'c3D2_peXS3-T8-KgvaqJrR:APA91bFWlaxBWCmv-AWLCEPrVPUdQNbaAlz7QUA7pQL-pfo4UYneZXxCBEA0z77zLzyOCiiuNkfjJzWloNtgg6Jk2x_Z2sOw73TMPiTdfqU9izXknJXjRzw'}
ApiService.ts:876 [ApiService] Successfully extracted FCM token for user 58422: c3D2_peXS3-T8-KgvaqJrR:APA91bFWlaxBWCmv-AWLCEPrVPUdQNbaAlz7QUA7pQL-pfo4UYneZXxCBEA0z77zLzyOCiiuNkfjJzWloNtgg6Jk2x_Z2sOw73TMPiTdfqU9izXknJXjRzw
ApiService.ts:870 [ApiService] Getting FCM token for single user: 63779
ApiService.ts:214 Request to protected endpoint: /api/get-fcm-token/63779. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/get-fcm-token/63779
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/get-fcm-token/63779', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/63779', headers: {…}, params: undefined, data: undefined, timeout: 60000, timestamp: '2025-07-08T17:45:34.295Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/get-fcm-token/63779', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/63779', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T17:45:34.363Z'}
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
    "meetingId": "37y0-kytm-emil",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiI2MjU3MmY1Yy01NmFkLTRiMjktYmFlNi01MTg2N2ZmYWI2MDkiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIiwiYWxsb3dfbW9kIl0sImlhdCI6MTc1MTk5NjczNCwiZXhwIjoxNzUxOTk4NTM0fQ.CZ8axpNnoOgr1uGa8Y6LMpQck_cuJ7HNWzgRXhcKSLc",
    "callType": "video"
  }
}
ApiService.ts:1340 ✅ [ApiService] initiate-call response: {messageId: 'projects/adtip-3873c/messages/0:1751996734673666%e9e87daaf9fd7ecd'}
CallController.ts:67 [CallController] Status changed: idle -> outgoing
VideoSDKService.ts:44 [VideoSDK] Already initialized
NavigationService.ts:51 [NavigationService] Navigating to Meeting screen with params: {meetingId: '37y0-kytm-emil', callType: 'video', displayName: 'R17 C', localParticipantId: 'not_provided'}
2console.js:654 Bluetooth Connect Permission Granted
MediaService.ts:107 [MediaService] Meeting reference set: true
MeetingScreenSimple.tsx:205 [MeetingScreen] New session detected, resetting join state: 4792a44d-1ad1-4970-8d89-93d2ddde96e9
MeetingScreenSimple.tsx:221 [MeetingScreen] Attempt 1/3 to join meeting…
MeetingScreenSimple.tsx:235 [MeetingScreen] First join after app load - adding extra delay for WebSocket stability
MediaService.ts:107 [MediaService] Meeting reference set: true
MeetingScreenSimple.tsx:205 [MeetingScreen] New session detected, resetting join state: 4792a44d-1ad1-4970-8d89-93d2ddde96e9
MeetingScreenSimple.tsx:221 [MeetingScreen] Attempt 1/3 to join meeting…
MeetingScreenSimple.tsx:235 [MeetingScreen] First join after app load - adding extra delay for WebSocket stability
MeetingScreenSimple.tsx:242 [MeetingScreen] Successfully joined meeting
CallController.ts:67 [CallController] Status changed: outgoing -> in_call
NavigationService.ts:51 [NavigationService] Navigating to Meeting screen with params: {meetingId: '37y0-kytm-emil', callType: 'video', displayName: 'User', localParticipantId: 'not_provided'}
2MediaService.ts:107 [MediaService] Meeting reference set: false
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant hvmpn7oa: {displayName: 'User', webcamOn: false, hasStream: false, streamId: undefined, hasTrack: false, isLocal: true}
2MediaService.ts:107 [MediaService] Meeting reference set: true
MeetingScreenSimple.tsx:242 [MeetingScreen] Successfully joined meeting
MediaService.ts:107 [MediaService] Meeting reference set: false
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant zcnlys8a: {displayName: 'User', webcamOn: false, hasStream: false, streamId: undefined, hasTrack: false, isLocal: true}
MediaService.ts:107 [MediaService] Meeting reference set: true
MediaService.ts:107 [MediaService] Meeting reference set: false
MediaService.ts:107 [MediaService] Meeting reference set: true
2MediaService.ts:107 [MediaService] Meeting reference set: false
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant zcnlys8a: {displayName: 'User', webcamOn: false, hasStream: false, streamId: undefined, hasTrack: false, isLocal: false}
MediaService.ts:107 [MediaService] Meeting reference set: true
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant hvmpn7oa: {displayName: 'User', webcamOn: false, hasStream: false, streamId: undefined, hasTrack: false, isLocal: false}
MediaService.ts:107 [MediaService] Meeting reference set: true
2MediaService.ts:107 [MediaService] Meeting reference set: false
2MediaService.ts:107 [MediaService] Meeting reference set: true
2MediaService.ts:107 [MediaService] Meeting reference set: false
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant zcnlys8a: {displayName: 'User', webcamOn: true, hasStream: false, streamId: undefined, hasTrack: false, isLocal: false}
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant hvmpn7oa: {displayName: 'User', webcamOn: true, hasStream: true, streamId: 'f36ad110-ba1d-4eb5-a6b1-ef4104872d6b', hasTrack: true, isLocal: true}
MediaService.ts:107 [MediaService] Meeting reference set: true
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant hvmpn7oa: {displayName: 'User', webcamOn: true, hasStream: false, streamId: undefined, hasTrack: false, isLocal: false}
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant zcnlys8a: {displayName: 'User', webcamOn: true, hasStream: true, streamId: '90b82bbd-61f7-4739-ae19-e3d7c8672d27', hasTrack: true, isLocal: true}
MediaService.ts:107 [MediaService] Meeting reference set: true
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant zcnlys8a: {displayName: 'User', webcamOn: true, hasStream: true, streamId: 'b152a5e9-1c40-475c-96b4-4b515ee889c3', hasTrack: true, isLocal: false}
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant hvmpn7oa: {displayName: 'User', webcamOn: true, hasStream: true, streamId: 'a7bef945-3ccd-4d62-93d5-a92c8b00710c', hasTrack: true, isLocal: false}
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
CallController.ts:67 [CallController] Status changed: in_call -> ended
ApiService.ts:1352 [ApiService] Sending call signal to recipient: 63779 {type: 'CALL_END', sessionId: '4792a44d-1ad1-4970-8d89-93d2ddde96e9'}
ApiService.ts:870 [ApiService] Getting FCM token for single user: 63779
2MediaService.ts:107 [MediaService] Meeting reference set: false
2MediaService.ts:107 [MediaService] Meeting reference set: true
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
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/get-fcm-token/63779', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/63779', headers: {…}, params: undefined, data: undefined, timeout: 60000, timestamp: '2025-07-08T17:45:57.099Z'}
MediaService.ts:107 [MediaService] Meeting reference set: false
MediaService.ts:107 [MediaService] Meeting reference set: true
CallController.ts:67 [CallController] Status changed: ended -> idle
MediaService.ts:107 [MediaService] Meeting reference set: false
MeetingScreenSimple.tsx:274 [MeetingScreen] Component unmounting, cleaning up meeting
MeetingScreenSimple.tsx:278 [MeetingScreen] Successfully left meeting on cleanup
MediaService.ts:107 [MediaService] Meeting reference set: false
MeetingScreenSimple.tsx:274 [MeetingScreen] Component unmounting, cleaning up meeting
MeetingScreenSimple.tsx:278 [MeetingScreen] Successfully left meeting on cleanup
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/get-fcm-token/63779', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/63779', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T17:45:58.781Z'}
ApiService.ts:873 [ApiService] Single user FCM token response: {status: true, fcm_token: 'ckOrGpJHQ-mtE6jEks9e8x:APA91bFc6mMfPfJyecmMuDZJjl_qW9H-ABdjkYjOEGo8dK2IESfnJvhxz9osyvbL6RklrMKiULffIv692PnYDR2kmuVJYnTPoy7DT1rrj1Pzku66wYwYWL4'}
ApiService.ts:876 [ApiService] Successfully extracted FCM token for user 63779: ckOrGpJHQ-mtE6jEks9e8x:APA91bFc6mMfPfJyecmMuDZJjl_qW9H-ABdjkYjOEGo8dK2IESfnJvhxz9osyvbL6RklrMKiULffIv692PnYDR2kmuVJYnTPoy7DT1rrj1Pzku66wYwYWL4
ApiService.ts:870 [ApiService] Getting FCM token for single user: 58422
ApiService.ts:214 Request to protected endpoint: /api/get-fcm-token/58422. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/get-fcm-token/58422
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', headers: {…}, params: undefined, data: undefined, timeout: 60000, timestamp: '2025-07-08T17:45:58.788Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T17:45:58.847Z'}
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
ApiService.ts:1477 ✅ [ApiService] update-call response: {messageId: 'projects/adtip-3873c/messages/0:1751996759221876%e9e87daaf9fd7ecd'}
VideoSDKService.ts:189 [VideoSDK] Service reset
MediaService.ts:68 [MediaService] Meeting cleanup completed
ApiService.ts:870 [ApiService] Getting FCM token for single user: 58422
ApiService.ts:214 Request to protected endpoint: /api/get-fcm-token/58422. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/get-fcm-token/58422
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', headers: {…}, params: undefined, data: undefined, timeout: 60000, timestamp: '2025-07-08T17:45:59.393Z'}
useFcmCallHandlers.ts:18 [FCM] Foreground message: {originalPriority: 1, priority: 1, sentTime: 1751996759213, data: {…}, from: '333436486029', messageId: '0:1751996759221876%e9e87daaf9fd7ecd', ttl: 2419200}
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T17:45:59.451Z'}
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
ApiService.ts:1477 ✅ [ApiService] update-call response: {messageId: 'projects/adtip-3873c/messages/0:1751996759747193%e9e87daaf9fd7ecd'}
useFcmCallHandlers.ts:18 [FCM] Foreground message: {originalPriority: 1, priority: 1, sentTime: 1751996759738, data: {…}, from: '333436486029', messageId: '0:1751996759747193%e9e87daaf9fd7ecd', ttl: 2419200}
ApiService.ts:979 [API] Fetching users with data: {
  "id": 0,
  "page": 1,
  "limit": 20,
  "language": [],
  "interest": [],
  "user_id": null,
  "search_by_name": "Vivek",
  "loggined_user_id": 58422,
  "sortBy": {}
}
ApiService.ts:214 Request to protected endpoint: /api/users. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/users
ApiService.ts:228 🚀 API REQUEST: {method: 'POST', url: '/api/users', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/users', headers: {…}, params: undefined, data: {…}, timeout: 60000, timestamp: '2025-07-08T17:46:00.653Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'POST', url: '/api/users', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/users', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T17:46:00.801Z'}
CallBillingService.ts:76 [CallBillingService] Calculating billing for: {userId: '58422', callType: 'video', currentBalance: 1000, isPremium: false}
CallBillingService.ts:100 [CallBillingService] Calculated billing: {ratePerMinute: 14, maxMinutes: 71, maxDurationSeconds: 4260, warningThresholds: Array(5)}
CallController.ts:304 [CallController] Starting video call to vivek P
VideoSDKService.ts:51 [VideoSDK] Initializing...
VideoSDKService.ts:60 [VideoSDK] Initialization complete
VideoSDKService.ts:151 [VideoSDK] Generating participant token via backend
ApiService.ts:214 Request to protected endpoint: /api/generate-token/videosdk. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/generate-token/videosdk
ApiService.ts:228 🚀 API REQUEST: {method: 'POST', url: '/api/generate-token/videosdk', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/generate-token/videosdk', headers: {…}, params: undefined, data: {…}, timeout: 60000, timestamp: '2025-07-08T17:46:03.852Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'POST', url: '/api/generate-token/videosdk', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/generate-token/videosdk', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T17:46:03.912Z'}
VideoSDKService.ts:110 [VideoSDK] Creating meeting via backend API
ApiService.ts:214 Request to protected endpoint: /api/create-meeting/videosdk. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/create-meeting/videosdk
ApiService.ts:228 🚀 API REQUEST: {method: 'POST', url: '/api/create-meeting/videosdk', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/create-meeting/videosdk', headers: {…}, params: undefined, data: {…}, timeout: 60000, timestamp: '2025-07-08T17:46:03.927Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'POST', url: '/api/create-meeting/videosdk', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/create-meeting/videosdk', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T17:46:04.000Z'}
ApiService.ts:1308 [ApiService] Create VideoSDK meeting response: {success: true, data: {…}, message: 'Meeting created successfully'}
VideoSDKService.ts:115 [VideoSDK] Raw API response: {success: true, data: {…}, message: 'Meeting created successfully'}
VideoSDKService.ts:119 [VideoSDK] Meeting created: 7vo6-uiem-nz1e
ApiService.ts:870 [ApiService] Getting FCM token for single user: 58422
ApiService.ts:214 Request to protected endpoint: /api/get-fcm-token/58422. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/get-fcm-token/58422
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', headers: {…}, params: undefined, data: undefined, timeout: 60000, timestamp: '2025-07-08T17:46:04.027Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/get-fcm-token/58422', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/58422', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T17:46:04.087Z'}
ApiService.ts:873 [ApiService] Single user FCM token response: {status: true, fcm_token: 'c3D2_peXS3-T8-KgvaqJrR:APA91bFWlaxBWCmv-AWLCEPrVPUdQNbaAlz7QUA7pQL-pfo4UYneZXxCBEA0z77zLzyOCiiuNkfjJzWloNtgg6Jk2x_Z2sOw73TMPiTdfqU9izXknJXjRzw'}
ApiService.ts:876 [ApiService] Successfully extracted FCM token for user 58422: c3D2_peXS3-T8-KgvaqJrR:APA91bFWlaxBWCmv-AWLCEPrVPUdQNbaAlz7QUA7pQL-pfo4UYneZXxCBEA0z77zLzyOCiiuNkfjJzWloNtgg6Jk2x_Z2sOw73TMPiTdfqU9izXknJXjRzw
ApiService.ts:870 [ApiService] Getting FCM token for single user: 50816
ApiService.ts:214 Request to protected endpoint: /api/get-fcm-token/50816. Attempting to add Authorization header.
ApiService.ts:221 Authorization header added to request for: /api/get-fcm-token/50816
ApiService.ts:228 🚀 API REQUEST: {method: 'GET', url: '/api/get-fcm-token/50816', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/50816', headers: {…}, params: undefined, data: undefined, timeout: 60000, timestamp: '2025-07-08T17:46:04.103Z'}
ApiService.ts:253 📥 API RESPONSE: {method: 'GET', url: '/api/get-fcm-token/50816', baseURL: 'https://api.adtip.in', fullURL: 'https://api.adtip.in/api/get-fcm-token/50816', status: 200, statusText: undefined, headers: {…}, data: {…}, timestamp: '2025-07-08T17:46:04.167Z'}
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
    "meetingId": "7vo6-uiem-nz1e",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiI2MjU3MmY1Yy01NmFkLTRiMjktYmFlNi01MTg2N2ZmYWI2MDkiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIiwiYWxsb3dfbW9kIl0sImlhdCI6MTc1MTk5Njc2MywiZXhwIjoxNzUxOTk4NTYzfQ.Gv1HiEGnJe0d9QJKAA-4_JDQ2uAL8nr6M0MIsnEtEDg",
    "callType": "video"
  }
}
ApiService.ts:1340 ✅ [ApiService] initiate-call response: {messageId: 'projects/adtip-3873c/messages/0:1751996764473334%e9e87daaf9fd7ecd'}
CallController.ts:67 [CallController] Status changed: idle -> outgoing
VideoSDKService.ts:44 [VideoSDK] Already initialized
NavigationService.ts:51 [NavigationService] Navigating to Meeting screen with params: {meetingId: '7vo6-uiem-nz1e', callType: 'video', displayName: 'R17 C', localParticipantId: 'not_provided'}
3console.js:654 Bluetooth Connect Permission Granted
MediaService.ts:107 [MediaService] Meeting reference set: true
MeetingScreenSimple.tsx:205 [MeetingScreen] New session detected, resetting join state: f56ee832-0ff7-46e2-8702-c6df75f2609a
MeetingScreenSimple.tsx:221 [MeetingScreen] Attempt 1/3 to join meeting…
MeetingScreenSimple.tsx:235 [MeetingScreen] First join after app load - adding extra delay for WebSocket stability
MediaService.ts:107 [MediaService] Meeting reference set: true
MeetingScreenSimple.tsx:205 [MeetingScreen] New session detected, resetting join state: f56ee832-0ff7-46e2-8702-c6df75f2609a
MeetingScreenSimple.tsx:221 [MeetingScreen] Attempt 1/3 to join meeting…
MeetingScreenSimple.tsx:235 [MeetingScreen] First join after app load - adding extra delay for WebSocket stability
MediaService.ts:107 [MediaService] Meeting reference set: true
MeetingScreenSimple.tsx:205 [MeetingScreen] New session detected, resetting join state: f56ee832-0ff7-46e2-8702-c6df75f2609a
MeetingScreenSimple.tsx:221 [MeetingScreen] Attempt 1/3 to join meeting…
MeetingScreenSimple.tsx:235 [MeetingScreen] First join after app load - adding extra delay for WebSocket stability
MeetingScreenSimple.tsx:242 [MeetingScreen] Successfully joined meeting
CallController.ts:67 [CallController] Status changed: outgoing -> in_call
NavigationService.ts:51 [NavigationService] Navigating to Meeting screen with params: {meetingId: '7vo6-uiem-nz1e', callType: 'video', displayName: 'User', localParticipantId: 'not_provided'}
3MediaService.ts:107 [MediaService] Meeting reference set: false
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant 3iou7hsf: {displayName: 'User', webcamOn: false, hasStream: false, streamId: undefined, hasTrack: false, isLocal: true}
3MediaService.ts:107 [MediaService] Meeting reference set: true
MeetingScreenSimple.tsx:242 [MeetingScreen] Successfully joined meeting
MediaService.ts:107 [MediaService] Meeting reference set: false
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant k05npuhh: {displayName: 'User', webcamOn: false, hasStream: false, streamId: undefined, hasTrack: false, isLocal: true}
MediaService.ts:107 [MediaService] Meeting reference set: true
MeetingScreenSimple.tsx:242 [MeetingScreen] Successfully joined meeting
MediaService.ts:107 [MediaService] Meeting reference set: false
MeetingScreenSimple.tsx:44 [ParticipantVideo] Participant nlrtpj1y: {displayName: 'User', webcamOn: false, hasStream: false, streamId: undefined, hasTrack: false, isLocal: true}
MediaService.ts:107 [MediaService] Meeting reference set: true