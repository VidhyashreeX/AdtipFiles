import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  PermissionsAndroid,
  AppState,
  AppStateStatus,
} from 'react-native';
import {
  Search,
  Phone,
  Video,
  Clock,
} from 'lucide-react-native';
import Header from '../../components/common/Header';
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  IRtcEngine,
  RtcConnection,
  VideoCanvas,
  RenderModeType,
} from 'react-native-agora';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAuth} from '../../contexts/AuthContext';
import {useTabNavigator} from '../../contexts/TabNavigatorContext';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import ApiService from '../../services/ApiService';
import MissedCallsList from '../../components/tipcall/MissedCallsList';
import { AgoraHelper } from '../../services/AgoraHelper';
import firebase from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import AgoraRtmHelper, { RtmEventType } from '../../services/AgoraRtmHelper';
import { RtmLocalInvitation, RtmRemoteInvitation } from 'agora-react-native-rtm';

// Get the initialized app instance and messaging instance
const firebaseApp = firebase.app();
const messagingInstance = messaging();

// Define navigation stack param list
type RootStackParamList = {
  TipCall: undefined;
  Login: undefined;
  Profile: undefined;
};

// Define navigation prop type
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Define interfaces for API response and data (keeping your existing interfaces)
interface Language {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface Interest {
  id: number;
  name: string;
  isPrimary: boolean;
}

interface Contact {
  id: number;
  name?: string | null;
  emailId?: string | null;
  is_available: boolean;
  dnd: boolean;
  updated_date: string;
  last_active: string | null;
  languages: Language[];
  interests: Interest[];
  product_count: number;
  post_count: number;
  is_following: number;
  following_count: number;
  followers_count: number;
  is_blocked: boolean;
  social_links: string[];
  is_active: boolean;
  last_seen: string;
  online_status: boolean;
}

interface ApiResponse {
  status: boolean;
  message: string;
  error?: string;
  data: Contact[];
  pagination: {
    page: number;
    limit: number;
    totalRecords: number;
  };
}

// New response type for Agora token fetching
interface AgoraTokenResponse {
  token: string;
  channelName: string;
  uid: number;
  expiresAt: string;
}

const APP_ID = 'ef5fbd2647c64582a64db9e47b9f9335';

// Constants for filters
const LANGUAGES: Language[] = [
  {id: '1', name: 'All'},
  {id: '2', name: 'Hindi'},
  {id: '3', name: 'Bengali'},
  {id: '4', name: 'Marathi'},
  {id: '5', name: 'Telugu'},
];

const TABS: Language[] = [
  {id: '1', name: 'All'},
  {id: '2', name: 'Hindi'},
  {id: '3', name: 'Bengali'},
  {id: '4', name: 'Marathi'},
  {id: '5', name: 'Telugu'},
];

const CATEGORIES: Category[] = [
  {id: '1', name: 'All'},
  {id: '2', name: 'Look for jobs'},
  {id: '3', name: 'Prepare for govt job'},
  {id: '4', name: 'Prepare for UPSC'},
];

// Fetch Agora token from server using ApiService
// Now returns an object with token, channelName, and uid from the server response
const fetchAgoraToken = async (uid: number): Promise<AgoraTokenResponse> => {
  try {
    console.log(`Fetching Agora token for uid: ${uid}`);
    // ApiService.getAgoraToken now correctly typed to return Promise<AgoraTokenResponse>
    const agoraTokenData = await ApiService.getAgoraToken({ uid });

    console.log('Exact Agora Token Server Response (agoraTokenData):', JSON.stringify(agoraTokenData, null, 2));

    // Check for essential fields in the received AgoraTokenResponse
    if (agoraTokenData && agoraTokenData.token && agoraTokenData.channelName) {
      console.log('Successfully received Agora token and channelName:', agoraTokenData);
      return agoraTokenData;
    } else {
      // This case implies the server returned a 2xx response, but the body
      // (expected to be AgoraTokenResponse) is missing critical fields or is null.
      let errorMsg = 'Failed to fetch token or channelName from server (malformed response data)';
      if (!agoraTokenData) {
        errorMsg = 'Empty response from Agora token server';
      } else if (!agoraTokenData.token) {
        errorMsg = 'Token missing in Agora server response';
      } else if (!agoraTokenData.channelName) {
        errorMsg = 'ChannelName missing in Agora server response';
      }
      // It's also possible 'agoraTokenData' itself contains an error message from a non-standard success response
      // For example, if the server responds with 200 OK but a JSON like { error: "some issue" }
      // However, the current structure of ApiService would likely have thrown an HTTP error before this if status was not 2xx.
      throw new Error(errorMsg);
    }
  } catch (error) { // This catches errors from ApiService (like network/HTTP errors) or the explicit throw above.
    console.error('Error fetching Agora token:', error);
    // Ensure the error message propagated is useful.
    const specificMessage = error instanceof Error ? error.message : 'An unknown error occurred while fetching the Agora token';
    throw new Error(specificMessage); // Re-throw to be caught by call initiation logic
  }
};

// Notify recipient of incoming call using ApiService
const notifyRecipient = async (
  recipientId: number,
  channelId: string,
  callType: 'voice' | 'video',
  userId: string | undefined,
) => {
  console.log(`[FCM-CALL] Initiating ${callType} call notification to recipient ${recipientId}`);
  console.log(`[FCM-CALL] Call parameters - Channel: ${channelId}, Caller: ${userId}`);
  
  if (!userId) {
    console.warn('[FCM-CALL] No authenticated user for notification');
    return;
  }
  
  try {
    const payload = {
      callerId: userId,
      receiverId: recipientId.toString(),
      action: 'start' as 'start',
      callType: callType === 'video' ? 'video-call' : 'audio-call' as 'video-call' | 'audio-call',
    } as const;
    
    console.log('[FCM-CALL] Sending call notification with payload:', JSON.stringify(payload, null, 2));
    const response = await ApiService.handleCall(payload);
    console.log('[FCM-CALL] Call notification response:', JSON.stringify(response, null, 2));
    console.log(`[FCM-CALL] ${callType} call notification sent to recipient ID ${recipientId}`);
    
    return response;
  } catch (error) {
    console.error('[FCM-CALL] Error notifying recipient:', error);
    return null;
  }
};

// Define the type for call request payloads
type AgoraCallRequest = {
  callerId: string;
  receiverId: string;
  action: 'start' | 'end' | 'missed-video-call' | 'missed-audio-call';
  callType: 'audio-call' | 'video-call';
};

// --- NotificationService with enhanced logging ---
const NotificationService = {
  requestPermissions: async (messagingInstance: any) => {
    try {
      console.log('[FCM] Requesting notification permissions...');
      if (Platform.OS === 'ios') {
        const authStatus = await messagingInstance.requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        console.log('[FCM] iOS notification permissions:', enabled ? 'GRANTED' : 'DENIED');
        
        if (!enabled) {
          Alert.alert('Notification Permission', 'Please enable notifications for a better call experience.');
        }
      } else {
        console.log('[FCM] Android permissions handled by manifest');
      }
    } catch (error) {
      console.error('[FCM] Failed to request notification permissions:', error);
    }
  },
  
  extractCallData: (remoteMessage: any) => {
    console.log('[FCM] Extracting call data from notification payload:', JSON.stringify(remoteMessage.data, null, 2));
    if (remoteMessage.data) {
      // Use the new field names from your specified payload
      const {
        channelName,
        caller_app_user_id, // New field
        callee_agora_uid,   // New field
        agora_token,        // New field
        call_type,          // New field ("audio" or "video")
        callerName          // Keep attempting to get callerName
      } = remoteMessage.data;
      
      console.log('[FCM] Notification data fields:', { channelName, caller_app_user_id, callee_agora_uid, agora_token, call_type, callerName });
      
      // Validate essential fields
      if (caller_app_user_id && channelName && agora_token && callee_agora_uid && (call_type === "audio" || call_type === "video")) {
        const extractedData = {
          callerId: caller_app_user_id, // Map to existing 'callerId'
          callerName: callerName || "Unknown Caller", // Default if not present
          channelName: channelName,
          callType: call_type === "video" ? "video" : "voice", // Map "audio" to "voice"
          calleeAgoraUid: callee_agora_uid,
          agoraToken: agora_token,
        };
        console.log('[FCM] Successfully extracted call data:', JSON.stringify(extractedData, null, 2));
        return extractedData;
      } else {
        console.warn('[FCM] Missing essential fields in call notification data:', remoteMessage.data);
      }
    }
    console.log('[FCM] Failed to extract call data from notification');
    return null;
  },
  
  updateCallStatus: async (
    callerId: string, // This is the original caller's app user ID
    receiverId: string, // This is the current user's app user ID
    action: 'accepted' | 'rejected' | 'missed-video-call' | 'missed-audio-call',
    callType: 'video' | 'audio', // 'audio' or 'video' (JS internal)
  ) => {
    let apiAction: AgoraCallRequest['action'];
    // Map 'accepted' and 'rejected' to allowed values for the API
    if (action === 'accepted') {
      apiAction = 'start';
    } else if (action === 'rejected') {
      apiAction = 'end';
    } else {
      apiAction = action; // 'missed-video-call' or 'missed-audio-call'
    }
    
    console.log(`[FCM] Updating call status - Action: ${action} (API action: ${apiAction}), CallType: ${callType}`);
    console.log(`[FCM] Call parties - Caller: ${callerId}, Receiver: ${receiverId}`);
    
    try {
      const payload: AgoraCallRequest = {
        callerId: callerId, // Original caller
        receiverId: receiverId, // Current user (who accepted/rejected)
        action: apiAction,
        // Map JS 'voice'/'video' to backend's 'audio-call'/'video-call'
        callType: callType === 'video' ? 'video-call' : 'audio-call',
      };
      
      console.log('[FCM] Call status update payload:', JSON.stringify(payload, null, 2));
      const response = await ApiService.handleCall(payload);
      console.log('[FCM] Call status update response:', JSON.stringify(response, null, 2));
      
      // If action was 'accepted', the response might contain the backend's callId
      if (action === 'accepted' && response && response.data && typeof response.data.callId === 'number') {
        return { callId: response.data.callId };
      }
      return response; // Return the whole response or null
    } catch (error) {
      console.error(`[FCM] Error updating call status to ${action}:`, error);
      return null;
    }
  },
};

// --- Placeholder for IncomingCallScreen component ---
// This component is used in TipCallScreen but not defined.
// You'll need to define its UI and functionality.
interface IncomingCallScreenProps {
  callerName: string;
  callType: 'voice' | 'video';
  onAccept: () => void;
  onReject: () => void;
}

const IncomingCallScreen: React.FC<IncomingCallScreenProps> = ({
  callerName,
  callType,
  onAccept,
  onReject,
}) => {
  return (
    <View style={styles.incomingCallOverlay}>
      <Text style={styles.incomingCallText}>Incoming {callType} call from:</Text>
      <Text style={styles.incomingCallerName}>{callerName}</Text>
      <View style={styles.incomingCallButtons}>
        <TouchableOpacity style={styles.acceptCallButton} onPress={onAccept}>
          <Text style={styles.acceptCallText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rejectCallButton} onPress={onReject}>
          <Text style={styles.rejectCallText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};


interface MeetingViewProps {
  meetingId: string;
  engine: IRtcEngine;
  onEndCall: () => void;
  isCaller: boolean; // Indicates if the current user initiated the call
  callType: 'voice' | 'video';
  localUid: number;
}

const MeetingView: React.FC<MeetingViewProps> = ({
  meetingId,
  engine,
  onEndCall,
  isCaller,
  callType,
  localUid,
}) => {
  const [remoteUsers, setRemoteUsers] = useState<number[]>([]);
  const {user} = useAuth();
  // Use useRef with null initial value
  const remoteVideoCanvas = useRef<View>(null);
  const localVideoCanvas = useRef<View>(null);

  // Add a key state to force recreation of video views
  const [videoViewKey, setVideoViewKey] = useState(Date.now());
  const remoteUsersRef = useRef<number[]>([]); // Ref to hold remote users, for use in cleanup

  useEffect(() => {
    remoteUsersRef.current = remoteUsers;
  }, [remoteUsers]);

  // Clean up function for video views - primarily for explicit actions like ending a call
  // or resetting UI if the component were to be reused (though it unmounts here).
  const cleanupVideoViews = useCallback(() => {
    if (callType === 'video' && engine) { // Check engine existence
      console.log('MeetingView: cleanupVideoViews called.');
      try {
        engine.setupLocalVideo({ view: null });
        // Use the ref here as well if this can be called during complex state transitions
        remoteUsersRef.current.forEach(uid => {
          engine.setupRemoteVideo({ uid: uid, view: null });
        });
        // These state updates are okay if cleanupVideoViews is called while component is still mounted
        // and needs a visual reset. If called during unmount, they are less critical.
        setVideoViewKey(Date.now());
        setRemoteUsers([]); // Reset remote users state
      } catch (e) {
        console.error('Error in cleanupVideoViews:', e);
      }
    } else if (callType === 'voice' && engine) {
      // For voice calls, ensure audio is handled if necessary, though no views to clean.
      // This function is mostly for video.
    }
  }, [engine, callType]); // Removed remoteUsers from deps, uses remoteUsersRef.current

  useEffect(() => {
    if (!engine) return;

    // Handle no response after 30 seconds for the caller
    let timeoutId: NodeJS.Timeout | null = null;
    if (isCaller) {
      timeoutId = setTimeout(() => {
        if (remoteUsersRef.current.length === 0) { // Use ref here
          // Get the contact ID from the meeting ID
          const contactIdMatch = meetingId.match(/_([\d]+)_/);
          const contactId = contactIdMatch ? contactIdMatch[1] : null;

          if (contactId && user?.id) {
            // Send missed call notification
            ApiService.handleCall({
              callerId: user.id,
              receiverId: contactId,
              action: callType === 'video' ? 'missed-video-call' : 'missed-audio-call',
              callType: callType === 'video' ? 'video-call' : 'audio-call',
            } as const).catch(err => console.error('Error sending missed call notification:', err));
          }

          Alert.alert(
            'No Response',
            'No one has joined the call. Would you like to end the call?',
            [
              {text: 'Wait', style: 'cancel'},
              {text: 'End Call', onPress: onEndCall},
            ],
          );
        }
      }, 30000);
    }

    const onUserJoined = (connection: RtcConnection, remoteUid: number) => {
      console.log(`User ${remoteUid} joined channel ${connection.channelId}`);

      // First update state to trigger re-render with the new remote user
      setRemoteUsers(prev => {
        // If this user is already in our list, don't add them again
        if (prev.includes(remoteUid)) return prev;
        return [...prev, remoteUid];
      });

      // Use a longer timeout to ensure the view has fully rendered
      setTimeout(() => {
        if (callType === 'video' && remoteVideoCanvas.current) {
          try {
            console.log(`Setting up remote video for uid ${remoteUid}`);
            engine.setupRemoteVideo({
              uid: remoteUid,
              view: remoteVideoCanvas.current,
              renderMode: RenderModeType.RenderModeHidden,
            });
          } catch (e) {
            console.error(`Error setting up remote video for uid ${remoteUid}:`, e);
          }
        }
      }, 1000); // Increased timeout to 1 second
    };

    const onUserOffline = (connection: RtcConnection, remoteUid: number) => {
      console.log(`User ${remoteUid} left channel ${connection.channelId}`);

      // Release the view before removing the user
      if (callType === 'video') {
        try {
          engine.setupRemoteVideo({
            uid: remoteUid,
            view: null,
          });
        } catch (e) {
          console.error(`Error releasing remote video for uid ${remoteUid}:`, e);
        }
      }

      setRemoteUsers(prev => prev.filter(uid => uid !== remoteUid));

      if (remoteUsersRef.current.length === 1 && remoteUsersRef.current[0] === remoteUid) {
        // If the only other user leaves, end the call
        cleanupVideoViews();
        onEndCall();
      }
    };

    const onError = (err: number, msg: string) => {
      console.error('Agora Error:', err, msg);
      Alert.alert('Call Error', `Error code: ${err}, ${msg}`);
      onEndCall(); // End call on critical error
    };

    engine.addListener('onUserJoined', onUserJoined);
    engine.addListener('onUserOffline', onUserOffline);
    engine.addListener('onError', onError);

    // Setup local video view if it's a video call - with delay
    if (callType === 'video') {
      setTimeout(() => {
        if (localVideoCanvas.current) {
          try {
            engine.setupLocalVideo({
              view: localVideoCanvas.current,
              renderMode: RenderModeType.RenderModeHidden,
            });
          } catch (e) {
            console.error('Error setting up local video:', e);
          }
        }
      }, 500);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Clean up video views when unmounting
      cleanupVideoViews();

      engine.removeListener('onUserJoined', onUserJoined);
      engine.removeListener('onUserOffline', onUserOffline);
      engine.removeListener('onError', onError);
    };
  }, [engine, onEndCall, isCaller, meetingId, user, callType, cleanupVideoViews]);

  // In the MeetingView component:

  // 1. Add this function to handle view cleanup when component unmounts or remounts
  useEffect(() => {
    // This cleanup runs when component mounts (to clean up any lingering views)
    // and when it unmounts
    return () => {
      if (callType === 'video' && engine) {
        console.log('Cleaning up video views on unmount');
        try {
          // First set up with null views to detach
          engine.setupLocalVideo({view: null});
          remoteUsersRef.current.forEach(uid => { // Use ref for remoteUsers
            engine.setupRemoteVideo({uid, view: null});
          });
        } catch (e) {
          console.error('Error during view cleanup:', e);
        }
      }
    };
  }, [callType, engine]); // Removed remoteUsers from deps, uses remoteUsersRef.current

  // 2. Update the VideoCanvas rendering to use completely separate containers
  return (
    <View style={styles.callOverlay}>
      {callType === 'video' && (
        <>
          {/* Remote Video */}
          {remoteUsers.length > 0 ? (
            <View
              key={`remote-${videoViewKey}-${remoteUsers[0]}`} // Ensure key changes robustly
              style={styles.remoteVideo}
            >
              <View
                ref={remoteVideoCanvas} // This View is what Agora draws onto
                style={{width: '100%', height: '100%'}}
              />
            </View>
          ) : (
            <View style={[styles.remoteVideo, {justifyContent: 'center', alignItems: 'center'}]}>
              <Text style={{color: 'white'}}>Waiting for other participant...</Text>
            </View>
          )}

          {/* Local Video */}
          <View
            key={`local-${videoViewKey}`}
            style={styles.localVideo}
          >
            <View
              ref={localVideoCanvas} // This View is what Agora draws onto
              style={{width: '100%', height: '100%'}}
            />
          </View>
        </>
      )}

      {/* Call status and other controls... */}
      <Text style={styles.callStatus}>In Call: {meetingId}</Text>
      <Text style={styles.callStatus}>
        {remoteUsers.length > 0
          ? `${remoteUsers.length} user(s) connected`
          : 'Waiting for others...'}
      </Text>
      <TouchableOpacity style={styles.endCallButton} onPress={() => {
        cleanupVideoViews();
        onEndCall();
      }}>
        <Text style={styles.endCallText}>End Call</Text>
      </TouchableOpacity>
    </View>
  );
};

const TipCallScreen: React.FC = () => {
  const {user} = useAuth();
  const {contentPaddingBottom} = useTabNavigator();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>(); // Corrected navigation prop type
  const [selectedCategory, setSelectedCategory] = useState<string>('1');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('1');
  const [selectedTab, setSelectedTab] = useState<string>('1');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [inCall, setInCall] = useState<boolean>(false);
  const [meetingId, setMeetingId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [rtcEngine, setRtcEngine] = useState<IRtcEngine | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCaller, setIsCaller] = useState<boolean>(false); // Track if the current user initiated the call
  const [currentCallType, setCurrentCallType] = useState<'voice' | 'video'>('voice');
  const [activeTab, setActiveTab] = useState('contacts'); // 'contacts' or 'missed'
  const localUid = useRef<number>(0); // Store the local user ID for Agora
  const [incomingCall, setIncomingCall] = useState<{
    callerId: string; // This will store caller_app_user_id
    callerName: string;
    channelName: string;
    callType: 'voice' | 'video'; // Will be mapped from "audio" or "video"
    calleeAgoraUid?: string; // The UID this user (callee) should join with
    agoraToken?: string;   // The token this user (callee) should use
  } | null>(null);

  // New state variables for RTM
  const [rtmInitialized, setRtmInitialized] = useState<boolean>(false);
  const rtmHelperRef = useRef<AgoraRtmHelper | null>(null);
  const localInvitationRef = useRef<RtmLocalInvitation | null>(null);
  const remoteInvitationRef = useRef<RtmRemoteInvitation | null>(null);

  const redirectToLogin = useCallback(() => {
    Alert.alert('Authentication Required', 'Please log in to continue.', [
      {text: 'OK', onPress: () => navigation.navigate('Login')},
    ]);
  }, [navigation]);

  // Request permissions for audio and video
  // Wrapped in useCallback for stability
  const requestPermissions = useCallback(
    async (callType: 'voice' | 'video') => {
      if (Platform.OS === 'android') {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          ...(callType === 'video' ? [PermissionsAndroid.PERMISSIONS.CAMERA] : []),
        ];
        try {
          // Use a timeout or ensure UI is ready before calling requestMultiple
          // A brief delay can sometimes help, though not a guaranteed fix for all race conditions
          // await new Promise(resolve => setTimeout(resolve, 100)); // Optional: small delay

          const granted = await PermissionsAndroid.requestMultiple(permissions);
          const allGranted = permissions.every(
            perm => granted[perm] === PermissionsAndroid.RESULTS.GRANTED,
          );
          if (!allGranted) {
            Alert.alert('Permissions Required', 'Audio and Camera permissions are needed for calls.');
            return false;
          }
        } catch (err) {
          console.warn('PermissionsAndroid Error:', err);
          Alert.alert('Permission Error', 'Failed to request permissions. Please check app settings.');
          return false;
        }
      }
      return true;
    },
    [],
  );

  const fetchUsers = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      if (!user || !user.id) {
        setError('Authentication required. Please log in.');
        redirectToLogin();
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const payload = {
          id: 0,
          page: pageNum,
          limit: 20,
          language:
            selectedLanguage === '1' ? [] : [parseInt(selectedLanguage, 10)],
          interest:
            selectedCategory === '1' ? [] : [parseInt(selectedCategory, 10)],
          user_id: null,
          search_by_name: searchQuery || '',
          loggined_user_id: user.id,
          sortBy: {},
        };

        const response = await ApiService.getUsers(payload);

        setContacts(prev =>
          append ? [...prev, ...response.data] : response.data,
        );
        setTotalRecords(response.pagination.totalRecords);
        setPage(response.pagination.page);
      } catch (error: any) {
        console.error('Error fetching users:', error.message);
        setError(`Failed to load users: ${error.message}`);
        if (error.message.includes('unauthorized')) {
          redirectToLogin();
        }
      } finally {
        setLoading(false);
      }
    },
    [selectedCategory, selectedLanguage, searchQuery, user, redirectToLogin],
  );

  useEffect(() => {
    fetchUsers(1, false);
  }, [fetchUsers]);

  // Register device FCM token with server for push notifications
  useEffect(() => {
    const registerFcmToken = async () => {
      try {
        if (!user?.id) {
          console.log('[FCM] User not authenticated, skipping FCM token registration');
          return;
        }

        // Get current FCM token from Firebase
        const currentToken = await messaging().getToken();
        console.log('[FCM] Current Firebase token:', currentToken);
        
        // Store token in AsyncStorage
        await AsyncStorage.setItem('fcmToken', currentToken);
        console.log('[FCM] Saved token to AsyncStorage');

        // Register/update token with server
        console.log(`[FCM] Registering token with server for user ${user.id}`);
        const response = await ApiService.updateFcmToken({
          userId: user.id,
          fcmToken: currentToken
        });
        
        console.log('[FCM] Server registration response:', JSON.stringify(response, null, 2));

        // Listen for token refreshes
        const unsubscribe = messaging().onTokenRefresh(async newToken => {
          console.log('[FCM] Token refreshed:', newToken);
          await AsyncStorage.setItem('fcmToken', newToken);
          
          const refreshResponse = await ApiService.updateFcmToken({
            userId: user.id,
            fcmToken: newToken
          });
          console.log('[FCM] Token refresh registration response:', JSON.stringify(refreshResponse, null, 2));
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('[FCM] Failed to register FCM token:', error);
      }
    };

    registerFcmToken();
  }, [user]);

  const loadMoreUsers = useCallback(() => {
    if (loading || contacts.length >= totalRecords) return;
    fetchUsers(page + 1, true);
  }, [loading, contacts.length, totalRecords, page, fetchUsers]);

  useEffect(() => {
    const initAgora = async () => {
      try {
        if (!APP_ID) {
          Alert.alert('Error', 'Agora APP_ID is not configured.');
          return;
        }

        const engine = createAgoraRtcEngine();
        await engine.initialize({appId: APP_ID});

        await engine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
        await engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);

        const onJoinChannelSuccess = (
          connection: RtcConnection,
          elapsed: number,
        ) => {
          console.log(
            `Joined channel ${connection.channelId} in ${elapsed}ms`,
          );
          setInCall(true);
        };

        const onError = (err: number, msg: string) => {
          console.error('Agora Engine Error:', err, msg);
          Alert.alert('Call Error', `Engine Error code: ${err}, ${msg}`);
          setInCall(false);
          setMeetingId('');
          setIsCaller(false);
          setCurrentCallType('voice');
        };

        engine.addListener('onJoinChannelSuccess', onJoinChannelSuccess);
        engine.addListener('onError', onError);

        setRtcEngine(engine);
      } catch (error) {
        console.error('Error initializing Agora:', error);
        Alert.alert('Error', 'Failed to initialize call engine.');
      }
    };

    initAgora();

    return () => {
      if (rtcEngine) {
        try {
          // Remove listeners before leaving and releasing
          rtcEngine.removeAllListeners();
          rtcEngine.leaveChannel();
          rtcEngine.release();
          console.log('Agora engine released.');
        } catch (e) {
          console.error('Error releasing Agora engine:', e);
        }
      }
    };
  }, [rtcEngine]);

  // Initialize Agora RTM (Signaling)
  useEffect(() => {
    const initAgoraRtm = async () => {
      try {
        if (!user?.id) {
          console.log('[RTM] User not authenticated, skipping RTM initialization');
          return;
        }

        console.log('[RTM] Initializing Agora RTM');
        const rtmHelper = AgoraRtmHelper.getInstance();
        await rtmHelper.initialize();
        
        // Login with user ID as string
        await rtmHelper.login(user.id.toString());
        
        // Set up RTM event listeners
        setupRtmEventListeners(rtmHelper);
        
        rtmHelperRef.current = rtmHelper;
        setRtmInitialized(true);
        console.log('[RTM] Agora RTM initialized successfully with user ID:', user.id);
      } catch (error) {
        console.error('[RTM] Failed to initialize RTM:', error);
        Alert.alert('Error', 'Failed to initialize call signaling. Call functionality may be limited.');
      }
    };
    
    const setupRtmEventListeners = (rtmHelper: AgoraRtmHelper) => {
      // Remote invitation received (incoming call)
      rtmHelper.on('remoteInvitationReceived' as RtmEventType, (invitation: RtmRemoteInvitation) => {
        if (inCall || remoteInvitationRef.current) {
          console.log('[RTM] Already in a call, refusing invitation');
          rtmHelper.refuseCallInvitation(invitation).catch(err => {
            console.error('[RTM] Error refusing call while busy:', err);
          });
          return;
        }
        
        remoteInvitationRef.current = invitation;
        
        try {
          const content = JSON.parse(invitation.getContent() || '{}');
          console.log('[RTM] Call invitation content:', content);
          
          setIncomingCall({
            callerId: invitation.getCallerId(),
            callerName: content.callerName || 'Unknown Caller',
            channelName: content.channelName,
            callType: content.callType === 'video' ? 'video' : 'voice',
            calleeAgoraUid: user?.id?.toString(),
            agoraToken: content.rtcToken
          });
        } catch (error) {
          console.error('[RTM] Error parsing invitation content:', error);
          rtmHelper.refuseCallInvitation(invitation).catch(err => {
            console.error('[RTM] Error refusing malformed invitation:', err);
          });
        }
      });
      
      // Local invitation accepted by callee
      rtmHelper.on('localInvitationAccepted' as RtmEventType, (invitation: RtmLocalInvitation) => {
        console.log('[RTM] Call invitation accepted by recipient');
        // The RTC connection should already be established
        localInvitationRef.current = null;
      });
      
      // Local invitation refused by callee
      rtmHelper.on('localInvitationRefused' as RtmEventType, (invitation: RtmLocalInvitation) => {
        console.log('[RTM] Call invitation refused by recipient');
        Alert.alert('Call Rejected', 'The recipient rejected your call');
        
        if (inCall) {
          endCall();
        }
        
        localInvitationRef.current = null;
      });
      
      // Remote invitation canceled by caller
      rtmHelper.on('remoteInvitationCanceled' as RtmEventType, (invitation: RtmRemoteInvitation) => {
        console.log('[RTM] Call invitation canceled by caller');
        Alert.alert('Call Ended', 'The caller canceled the call');
        
        setIncomingCall(null);
        remoteInvitationRef.current = null;
        
        if (inCall) {
          endCall();
        }
      });
      
      // Other event handlers...
    };
    
    initAgoraRtm();
    
    // Cleanup
    return () => {
      if (rtmHelperRef.current) {
        console.log('[RTM] Cleaning up RTM resources');
        rtmHelperRef.current.release().catch(e => {
          console.error('[RTM] Error releasing RTM resources:', e);
        });
      }
    };
  }, [user?.id]);

  // Replace or modify your existing startCallInternal function
  const startCallInternal = async (contactId: number, callType: 'voice' | 'video') => {
    if (!rtcEngine) {
      Alert.alert('Error', 'Call engine not initialized');
      return;
    }
    
    if (inCall) {
      Alert.alert('Error', 'You are already in a call');
      return;
    }
    
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      redirectToLogin();
      return;
    }
    
    if (!rtmInitialized || !rtmHelperRef.current) {
      Alert.alert('Error', 'Call signaling not initialized. Please try again later.');
      return;
    }
    
    const hasPermissions = await requestPermissions(callType);
    if (!hasPermissions) return;
    
    setLoading(true);
    
    try {
      // Configure RTC for call type
      if (callType === 'video') {
        await rtcEngine.enableVideo();
        await rtcEngine.startPreview();
      } else {
        await rtcEngine.enableAudio();
        await rtcEngine.disableVideo();
      }
      
      // Use user.id as RTC UID
      const uid = parseInt(user.id.toString(), 10);
      localUid.current = uid;
      
      // Get token from server
      const agoraAuthData = await fetchAgoraToken(uid);
      const { token: rtcToken, channelName } = agoraAuthData;
      
      if (!rtcToken || !channelName) {
        throw new Error('Failed to get valid token or channel');
      }
      
      // Create RTM call invitation
      const invitation = await rtmHelperRef.current.createCallInvitation(
        contactId.toString(),
        callType,
        channelName,
        rtcToken
      );
      
      localInvitationRef.current = invitation;
      
      // Join RTC channel first
      await AgoraHelper.safeJoinChannel(rtcEngine, rtcToken, channelName, uid);
      
      // Update UI state
      setMeetingId(channelName);
      setIsCaller(true);
      setCurrentCallType(callType);
      setInCall(true);
      
      // Send RTM invitation
      await rtmHelperRef.current.sendCallInvitation(invitation);
      console.log(`[RTM] ${callType} call invitation sent to ${contactId}`);
      
      // Also send FCM notification as backup
      await notifyRecipient(contactId, channelName, callType, user.id.toString());
      
    } catch (error: any) {
      console.error(`Error starting ${callType} call:`, error);
      Alert.alert('Error', `Failed to start call: ${error.message}`);
      
      // Cleanup on error
      if (localInvitationRef.current && rtmHelperRef.current) {
        try {
          await rtmHelperRef.current.cancelCallInvitation(localInvitationRef.current);
        } catch (e) {
          console.error('[RTM] Error canceling invitation during failure:', e);
        }
        localInvitationRef.current = null;
      }
      
      if (inCall && rtcEngine) {
        try {
          await rtcEngine.leaveChannel();
        } catch (e) {
          console.error('[RTC] Error leaving channel during failure:', e);
        }
      }
      
      setInCall(false);
      setMeetingId('');
      setIsCaller(false);
      
    } finally {
      setLoading(false);
    }
  };

  // Modify acceptIncomingCall to use RTM
  const acceptIncomingCall = async () => {
    if (!incomingCall || !rtcEngine || !user?.id) {
      console.warn('[AcceptCall] Missing required data');
      setIncomingCall(null);
      return;
    }
    
    if (!rtmInitialized || !rtmHelperRef.current || !remoteInvitationRef.current) {
      console.warn('[AcceptCall] RTM not initialized or missing invitation');
      setIncomingCall(null);
      return;
    }
    
    const { channelName, callType, agoraToken } = incomingCall;
    
    if (!agoraToken || !channelName) {
      Alert.alert('Error', 'Call information is incomplete');
      
      try {
        await rtmHelperRef.current.refuseCallInvitation(remoteInvitationRef.current);
      } catch (e) {
        console.error('[RTM] Error refusing call with missing data:', e);
      }
      
      setIncomingCall(null);
      remoteInvitationRef.current = null;
      return;
    }
    
    setLoading(true);
    
    try {
      const hasPermissions = await requestPermissions(callType);
      if (!hasPermissions) {
        await rtmHelperRef.current.refuseCallInvitation(remoteInvitationRef.current);
        setIncomingCall(null);
        remoteInvitationRef.current = null;
        setLoading(false);
        return;
      }
      
      // Configure RTC
      if (callType === 'video') {
        await rtcEngine.enableVideo();
        await rtcEngine.startPreview();
      } else {
        await rtcEngine.enableAudio();
        await rtcEngine.disableVideo();
      }
      
      // Accept RTM invitation
      await rtmHelperRef.current.acceptCallInvitation(remoteInvitationRef.current);
      
      // Join RTC channel
      const uid = parseInt(user.id.toString(), 10);
      localUid.current = uid;
      
      await AgoraHelper.safeJoinChannel(rtcEngine, agoraToken, channelName, uid);
      
      // Update UI state
      setMeetingId(channelName);
      setIsCaller(false);
      setCurrentCallType(callType);
      setInCall(true);
      setIncomingCall(null);
      remoteInvitationRef.current = null;
      
    } catch (error) {
      console.error('[AcceptCall] Error accepting call:', error);
      Alert.alert('Error', 'Failed to accept call');
      
      // Clean up on error
      setIncomingCall(null);
      remoteInvitationRef.current = null;
      
      if (inCall && rtcEngine) {
        try {
          await rtcEngine.leaveChannel();
        } catch (e) {
          console.error('[RTC] Error leaving channel during accept failure:', e);
        }
      }
      
      setInCall(false);
      setMeetingId('');
      
    } finally {
      setLoading(false);
    }
  };

  // Modify rejectIncomingCall to use RTM
  const rejectIncomingCall = async () => {
    if (!incomingCall) {
      setIncomingCall(null);
      return;
    }
    
    if (!rtmInitialized || !rtmHelperRef.current || !remoteInvitationRef.current) {
      console.warn('[RejectCall] RTM not initialized or missing invitation');
      setIncomingCall(null);
      return;
    }
    
    setLoading(true);
    
    try {
      // Refuse RTM invitation
      await rtmHelperRef.current.refuseCallInvitation(remoteInvitationRef.current);
      
      // Optionally notify backend
      if (user?.id) {
        await NotificationService.updateCallStatus(
          incomingCall.callerId,
          user.id.toString(),
          'rejected',
          incomingCall.callType === 'video' ? 'video' : 'audio'
        );
      }
      
    } catch (error) {
      console.error('[RejectCall] Error rejecting call:', error);
    } finally {
      setIncomingCall(null);
      remoteInvitationRef.current = null;
      setLoading(false);
    }
  };

  // Modify endCall to include RTM cancellation
  const endCall = useCallback(async () => {
    console.log('[EndCall] Ending call');
    setLoading(true);
    
    // Cancel invitation if we're the caller
    if (isCaller && localInvitationRef.current && rtmHelperRef.current) {
      try {
        await rtmHelperRef.current.cancelCallInvitation(localInvitationRef.current);
      } catch (e) {
        console.error('[RTM] Error canceling invitation:', e);
      }
      
      localInvitationRef.current = null;
    }
    
    // Leave RTC channel
    if (rtcEngine) {
      try {
        await rtcEngine.stopPreview();
        await AgoraHelper.safeLeaveChannel(rtcEngine);
      } catch (error) {
        console.error('[RTC] Error leaving channel:', error);
      }
    }
    
    // Reset state
    setInCall(false);
    setMeetingId('');
    setIsCaller(false);
    setCurrentCallType('voice');
    setLoading(false);
  }, [rtcEngine, isCaller, rtmHelperRef]);

  const startVoiceCall = useCallback((contactId: number) => {
    startCallInternal(contactId, 'voice');
  }, [rtcEngine, inCall, user, rtmInitialized, rtmHelperRef.current]);

  const startVideoCall = useCallback((contactId: number) => {
    startCallInternal(contactId, 'video');
  }, [rtcEngine, inCall, user, rtmInitialized, rtmHelperRef.current]);

  if (loading && !contacts.length && !inCall) {
    return (
      <View style={[styles.container, {backgroundColor: '#f8fafc'}]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#24d05a" />
          <Text style={styles.loadingText}>Loading contacts...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Tip Call"
        showBackButton={false}
        showLogo={true}
        showWallet={true}
      />

      {/* Tab navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'contacts' && styles.activeTab]}
          onPress={() => setActiveTab('contacts')}
        >
          <Text style={[styles.tabText, activeTab === 'contacts' && styles.activeTabText]}>Contacts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'missed' && styles.activeTab]}
          onPress={() => setActiveTab('missed')}
        >
          <Text style={[styles.tabText, activeTab === 'missed' && styles.activeTabText]}>Missed Calls</Text>
          <Clock size={16} color={activeTab === 'missed' ? '#24d05a' : '#666'} />
        </TouchableOpacity>
      </View>

      {/* Search bar and filters - only show for contacts tab */}
      {activeTab === 'contacts' && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => fetchUsers(1, false)}
            />
          </View>

          <View style={styles.filtersContainer}>
            <Text style={styles.filterTitle}>Categories</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersScroll}>
              {CATEGORIES.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    selectedCategory === category.id
                      ? styles.categoryItemSelected
                      : styles.categoryItemUnselected,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}>
                  <Text
                    style={[
                      styles.categoryItemText,
                      selectedCategory === category.id
                        ? styles.categoryItemTextSelected
                        : styles.categoryItemTextUnselected,
                    ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.filterTitle}>Languages</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersScroll}>
              {LANGUAGES.map(language => (
                <TouchableOpacity
                  key={language.id}
                  style={[
                    styles.categoryItem,
                    selectedLanguage === language.id
                      ? styles.categoryItemSelected
                      : styles.categoryItemUnselected,
                  ]}
                  onPress={() => setSelectedLanguage(language.id)}>
                  <Text
                    style={[
                      styles.categoryItemText,
                      selectedLanguage === language.id
                        ? styles.categoryItemTextSelected
                        : styles.categoryItemTextUnselected,
                    ]}>
                    {language.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Content area */}
      {activeTab === 'contacts' ? (
        <ScrollView
          style={styles.contentScrollView}
          onScroll={({nativeEvent}) => {
            const {layoutMeasurement, contentOffset, contentSize} = nativeEvent;
            const isCloseToBottom =
              layoutMeasurement.height + contentOffset.y >=
              contentSize.height - 50;

            if (isCloseToBottom) {
              loadMoreUsers();
            }
          }}
          scrollEventThrottle={400}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : contacts.length === 0 && !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No contacts found</Text>
            </View>
          ) : (
            contacts.map(contact => (
              <View key={contact.id} style={styles.contactItem}>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>
                    {contact.name || 'Unknown'}
                  </Text>
                  <Text style={styles.contactStatus}>
                    {contact.online_status ? 'available now' : contact.last_seen}
                  </Text>
                </View>
                <View style={styles.callButtons}>
                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={() => startVoiceCall(contact.id)}
                    disabled={inCall}>
                    <Phone size={20} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={() => startVideoCall(contact.id)}
                    disabled={inCall}>
                    <Video size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
          {loading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          )}
          <View style={[styles.bottomPadding, {height: contentPaddingBottom}]} />
        </ScrollView>
      ) : (
        <MissedCallsList onCallUser={(userId, callType) => {
          if (callType === 'audio') {
            startVoiceCall(userId);
          } else {
            startVideoCall(userId);
          }
        }} />
      )}

      {inCall && rtcEngine && (
        <MeetingView
          meetingId={meetingId}
          engine={rtcEngine}
          onEndCall={endCall}
          isCaller={isCaller}
          callType={currentCallType}
          localUid={localUid.current}
        />
      )}

      {incomingCall && (
        <IncomingCallScreen
          callerName={incomingCall.callerName}
          callType={incomingCall.callType}
          onAccept={acceptIncomingCall}
          onReject={rejectIncomingCall}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
  },
  // Tab navigation styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#24d05a',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginRight: 4,
  },
  activeTabText: {
    color: '#24d05a',
  },
  contentScrollView: {
    flex: 1,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#24d05a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#24d05a',
    marginRight: 12,
  },
  toggle: {
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#24d05a',
    padding: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  toggleButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'white',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginRight: 12,
  },
  walletAmount: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#24d05a',
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    padding: 0,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  filtersContainer: {
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filtersScroll: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  contactsContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  contactInfo: {
    flex: 1,
    flexDirection: 'column',
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  contactStatus: {
    fontSize: 14,
    color: '#64748b',
  },
  callButtons: {
    flexDirection: 'row',
    marginLeft: 16,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#24d05a',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  callOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  callStatus: {
    fontSize: 20,
    color: 'white',
    marginBottom: 20,
  },
  endCallButton: {
    backgroundColor: '#ff0000',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  endCallText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#374151',
    marginTop: 12,
  },
  bottomPadding: {
    // Height will be set dynamically using contentPaddingBottom
  },
  categoryItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginRight: 8,
  },
  categoryItemSelected: {
    backgroundColor: '#24d05a',
  },
  categoryItemUnselected: {
    backgroundColor: '#f1f5f9',
  },
  categoryItemText: {
    fontWeight: '600',
  },
  categoryItemTextSelected: {
    color: 'white',
  },
  categoryItemTextUnselected: {
    color: '#374151',
  },
  localVideo: {
    width: 100,
    height: 150,
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'black',
    borderRadius: 10,
    overflow: 'hidden',
    borderColor: '#24d05a',
    borderWidth: 2,
  },
  remoteVideo: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 16,
  },
  // Styles for IncomingCallScreen
  incomingCallOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001, // Higher zIndex to overlay everything
  },
  incomingCallText: {
    fontSize: 22,
    color: 'white',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  incomingCallerName: {
    fontSize: 28,
    color: '#24d05a',
    marginBottom: 40,
    fontWeight: 'bold',
  },
  incomingCallButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
  },
  acceptCallButton: {
    backgroundColor: '#24d05a',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  acceptCallText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  rejectCallButton: {
    backgroundColor: '#ff0000',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  rejectCallText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default TipCallScreen;