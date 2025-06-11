import React, {useEffect, useState, useCallback, useRef} from 'react'; // Ensure React is imported
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Alert,
  TextInput,
  StatusBar,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';
import firebase from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import { 
  createAgoraRtcEngine, // Main function to create engine instance
  RtcEngineContext,     // Context for initialization
  ChannelProfileType,   // Enum for channel profile
  ClientRoleType,       // Enum for client role
  IRtcEngine,
  // RtcLocalView, // No longer a direct export
  // RtcRemoteView, // No longer a direct export
  RtcSurfaceView, // Use RtcSurfaceView for both local and remote
} from 'react-native-agora';
// Remove RtcRemoteView import if it was separate, RtcSurfaceView handles both
// import { RtcRemoteView } from 'react-native-agora'; 


import {useAuth} from '../../contexts/AuthContext';
import {useTabNavigator} from '../../contexts/TabNavigatorContext';
import ApiService from '../../services/ApiService';
import AgoraRtmHelper, { RtmEventType, RtmLocalInvitation, RtmRemoteInvitation, RtmLocalInvitationProps } from '../../services/AgoraRtmHelper'; // Added RtmLocalInvitationProps
import {AgoraHelper} from '../../services/AgoraHelper';
import IncomingCallScreenComponent from '../../components/tipcall/IncomingCallScreen'; // Renamed to avoid conflict

// Define navigation stack param list
type RootStackParamList = {
  TipCall: { initialCallNotificationData?: any } | undefined; // Updated to allow params
  Login: undefined;
  Profile: { userId: number };
  // Add other screens if necessary
};

// Define navigation prop type
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Add this missing type definition
type TipCallScreenRouteProp = RouteProp<RootStackParamList, 'TipCall'>;

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

interface UserListApiResponse { // Renamed to avoid conflict with global ApiResponse if any
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
interface AgoraRtcTokenResponse { // Renamed to be specific for RTC
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
const fetchAgoraRtcToken = async (uid: number): Promise<AgoraRtcTokenResponse> => {
  try {
    console.log(`[RTC] Fetching Agora RTC token for uid: ${uid}`);
    const agoraTokenData = await ApiService.getAgoraToken({ uid });
    console.log('[RTC] Exact Agora RTC Token Server Response:', JSON.stringify(agoraTokenData, null, 2));

    if (agoraTokenData && agoraTokenData.token && agoraTokenData.channelName) {
      return agoraTokenData;
    } else {
      console.error('[RTC] Invalid Agora RTC token data received:', agoraTokenData);
      throw new Error('Invalid Agora RTC token data from server.');
    }
  } catch (error) {
    console.error('[RTC] Error fetching Agora RTC token:', error);
    const specificMessage = error instanceof Error ? error.message : 'An unknown error occurred while fetching the Agora RTC token';
    throw new Error(specificMessage);
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
  channelName: string; // Changed from meetingId to channelName for clarity
  rtcEngine: IRtcEngine;
  onEndCall: () => void;
  isCaller: boolean;
  callType: 'voice' | 'video';
  localUid: number;
  token: string; // RTC Token
}

const MeetingView: React.FC<MeetingViewProps> = ({
  channelName, // This prop is still useful for logging or other logic if needed
  rtcEngine,
  onEndCall,
  isCaller,
  callType,
  localUid, 
  token,
}) => {
  const [remoteUsers, setRemoteUsers] = useState<number[]>([]);
  const remoteUsersRef = useRef<number[]>([]);

  useEffect(() => {
    const initRtc = async () => {
      console.log('[RTC] MeetingView: Initializing RTC Engine for call.');
      await rtcEngine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
      if (callType === 'video') {
         await rtcEngine.enableVideo();
      } else {
         await rtcEngine.disableVideo();
      }

      rtcEngine.addListener('onUserJoined', (connection, uid, elapsed) => { 
        console.log('[RTC] MeetingView: Remote user joined:', uid, 'on channel:', connection.channelId);
        if (!remoteUsersRef.current.includes(uid)) {
          setRemoteUsers(prev => [...prev, uid]);
          remoteUsersRef.current = [...remoteUsersRef.current, uid];
        }
      });

      rtcEngine.addListener('onUserOffline', (connection, uid, reason) => { 
        console.log('[RTC] MeetingView: Remote user offline:', uid, 'reason:', reason, 'on channel:', connection.channelId);
        setRemoteUsers(prev => prev.filter(userUid => userUid !== uid));
        remoteUsersRef.current = remoteUsersRef.current.filter(userUid => userUid !== uid);
        if (remoteUsersRef.current.length === 0 && !isCaller) { 
            onEndCall(); 
        }
      });
      
      rtcEngine.addListener('onJoinChannelSuccess', (connection, elapsed) => { 
        console.log(`[RTC] MeetingView: Joined RTC channel ${connection.channelId} successfully as UID ${connection.localUid}`);
      });

      rtcEngine.addListener('onError', (err, msg) => { 
        console.error('[RTC] MeetingView: RTC Error Code:', err, 'Message:', msg);
      });
      
      console.log(`[RTC] MeetingView: Attempting to join RTC channel: ${channelName} with UID: ${localUid} and Token: ${token ? 'Present' : 'Absent'}`);
      await AgoraHelper.safeJoinChannel(rtcEngine, token, channelName, localUid);
    };

    initRtc();

    return () => {
      console.log('[RTC] MeetingView: Cleaning up RTC listeners and leaving channel.');
      rtcEngine.removeAllListeners('onUserJoined');
      rtcEngine.removeAllListeners('onUserOffline');
      rtcEngine.removeAllListeners('onJoinChannelSuccess');
      rtcEngine.removeAllListeners('onError');
      AgoraHelper.safeLeaveChannel(rtcEngine).catch(err => console.error("[RTC] MeetingView: Error leaving channel on cleanup", err));
    };
  }, [rtcEngine, channelName, localUid, token, callType, onEndCall, isCaller]);

  return (
    <View style={styles.callOverlay}>
      <Text style={styles.callStatus}>In {callType} call...</Text>
      {callType === 'video' && (
        <>
          <RtcSurfaceView 
            style={styles.localVideo} 
            canvas={{uid: 0}} // Standard practice for local view
            // channelId prop removed
          />
          
          {remoteUsers.map(uid => (
            <RtcSurfaceView 
              key={uid} 
              style={styles.remoteVideo} 
              canvas={{uid: uid}} 
              // channelId prop removed
            />
          ))}
          {remoteUsers.length === 0 && <Text style={styles.callStatus}>Waiting for peer...</Text>}
        </>
      )}
      <TouchableOpacity style={styles.endCallButton} onPress={onEndCall}>
        <Text style={styles.endCallText}>End Call</Text>
      </TouchableOpacity>
    </View>
  );
};


const TipCallScreen: React.FC = () => {
  const {user} = useAuth();
  const {contentPaddingBottom} = useTabNavigator();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<TipCallScreenRouteProp>();
  const [selectedCategory, setSelectedCategory] = useState<string>('1');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('1');
  // const [selectedTab, setSelectedTab] = useState<string>('1'); // Not used, activeTab is used
  const [contacts, setContacts] = useState<Contact[]>([]);
  
  const [inCall, setInCall] = useState<boolean>(false);
  const [currentChannelName, setCurrentChannelName] = useState<string>('');
  const [currentRtcToken, setCurrentRtcToken] = useState<string>('');
  const [currentLocalRtcUid, setCurrentLocalRtcUid] = useState<number>(0);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const rtcEngineRef = useRef<IRtcEngine | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCaller, setIsCaller] = useState<boolean>(false);
  const [currentCallType, setCurrentCallType] = useState<'voice' | 'video'>('voice');
  const [activeTab, setActiveTab] = useState('contacts'); // 'contacts' or 'missed_calls'

  const [isRtcEngineReady, setIsRtcEngineReady] = useState<boolean>(false); // New state for RTC readiness
  const [isRtmReady, setIsRtmReady] = useState<boolean>(false); // New state for RTM readiness


  const [incomingCallData, setIncomingCallData] = useState<{
    rtmInvitation: RtmRemoteInvitation; // This can be a full RtmRemoteInvitation or a mocked one
    callerName: string;
    callType: 'voice' | 'video';
    channelName: string; // RTC Channel Name from invitation/notification
    rtcToken: string;    // RTC Token from invitation/notification
    callerRtcUid: string; // Caller's UID for RTC (can be RTM ID or specific RTC UID)
    isFromNotification?: boolean; // Add this optional property
  } | null>(null);

  const rtmHelperRef = useRef<AgoraRtmHelper | null>(null);
  // const localInvitationRef = useRef<RtmLocalInvitation | null>; // Replace with outgoingInvitationDetails
  const [outgoingInvitationDetails, setOutgoingInvitationDetails] = useState<RtmLocalInvitationProps | null>(null);

  const redirectToLogin = useCallback(() => {
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  }, [navigation]);

  const requestPermissions = useCallback(async (callType: 'voice' | 'video') => {
    if (Platform.OS === 'android') {
      try {
        const grants: any = {};
        grants['android.permission.RECORD_AUDIO'] = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Audio Permission',
            message: 'App needs access to your microphone for voice calls.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (callType === 'video') {
          grants['android.permission.CAMERA'] = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
            {
              title: 'Video Permission',
              message: 'App needs access to your camera for video calls.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
        }
        const allGranted = Object.values(grants).every(
          status => status === PermissionsAndroid.RESULTS.GRANTED,
        );
        if (!allGranted) {
          Alert.alert('Permissions Denied', 'Required permissions were not granted.');
          return false;
        }
        return true;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS permissions are typically handled via Info.plist
  }, []);

  const fetchUsers = useCallback(async (pageNum: number = 1, append: boolean = false, currentSearchQuery: string = searchQuery) => {
    if (!user || !user.id) {
      redirectToLogin();
      return;
    }
    setLoading(true);
    if (!append) { // Reset error only when fetching new list, not appending
        setError(null);
    }

    try {
      const payload: UserListRequest = {
        id: 0, // As per /api/allusers sample request
        page: pageNum,
        limit: 15, // Current limit in your code; sample for /api/allusers was 50. Adjust if needed.
        language: [], // Empty array for /api/allusers
        interest: [], // Empty array for /api/allusers
        user_id: null, // As per /api/allusers sample request
        search_by_name: currentSearchQuery, // Use current search query
        loggined_user_id: user.id, // Dynamically set based on the logged-in user
        sortBy: {}, // As per /api/allusers sample request
      };

      // Call getAllUsersList which uses the /api/allusers endpoint
      const response = await ApiService.getAllUsersList(payload);

      if (response.data && response.status) {
        const contactsData: Contact[] = response.data.map((item: any) => ({
          id: item.id,
          name: item.name ?? null,
          emailId: item.emailId ?? null,
          is_available: item.is_available ?? false,
          dnd: item.dnd ?? false,
          updated_date: item.updated_date ?? '',
          last_active: item.last_active ?? null,
          languages: item.languages?.map((lang: any) => ({ id: lang.id, name: lang.name, isPrimary: lang.isPrimary ?? false })) ?? [],
          interests: item.interests?.map((int: any) => ({ id: int.id, name: int.name, isPrimary: int.isPrimary ?? false })) ?? [],
          product_count: item.product_count ?? 0,
          post_count: item.post_count ?? 0,
          is_following: item.is_following ?? 0,
          following_count: item.following_count ?? 0,
          followers_count: item.followers_count ?? 0,
          is_blocked: item.is_blocked ?? false,
          social_links: item.social_links ?? [],
          is_active: item.is_active ?? false,
          last_seen: item.last_seen ?? '',
          online_status: item.online_status ?? false,
        }));
        setContacts(prev => (append ? [...prev, ...contactsData] : contactsData));
        setPage(response.pagination.page);
        setTotalRecords(response.pagination.totalRecords);
      } else {
        setError(response.message || 'Failed to fetch users.');
        if (!append) setContacts([]); // Clear contacts if initial fetch failed
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching users.');
      if (!append) setContacts([]); // Clear contacts on error
    } finally {
      setLoading(false);
    }
  }, [searchQuery, user, redirectToLogin]); // Updated dependencies

  useEffect(() => {
    // Fetch users when the component mounts or when searchQuery changes.
    // The `fetchUsers` function itself now depends on `searchQuery`.
    fetchUsers(1, false, searchQuery);
  }, [fetchUsers, searchQuery]); // searchQuery is a direct dependency here to re-trigger fetch


  // Add this debug effect
  useEffect(() => {
    console.log('[DEBUG] State changes:');
    console.log('[DEBUG] isRtcEngineReady:', isRtcEngineReady);
    console.log('[DEBUG] isRtmReady:', isRtmReady);
    console.log('[DEBUG] user:', user?.id);
  }, [isRtcEngineReady, isRtmReady, user]);

  // Initialize RTC Engine
  useEffect(() => {
    const initRtcEngine = async () => {
      try {
        if (!rtcEngineRef.current) {
          console.log('[RTC] Attempting to create RTC Engine instance...');
          // Use createAgoraRtcEngine to get an instance
          const engine = createAgoraRtcEngine();
          rtcEngineRef.current = engine;

          // Initialize the engine instance with context
          const rtcContext = new RtcEngineContext(); // Construct with no arguments
          rtcContext.appId = APP_ID; // Set the appId property
          // You can also set channelProfile here if it's global for the engine
          // rtcContext.channelProfile = ChannelProfileType.ChannelProfileCommunication;
          await rtcEngineRef.current.initialize(rtcContext);
          
          setIsRtcEngineReady(true);
          console.log('[RTC] RTC Engine created and initialized');
        }
      } catch (e) {
        console.error('[RTC] Failed to create or initialize RTC Engine:', e);
        setIsRtcEngineReady(false);
      }
    };
    initRtcEngine();
    return () => {
      if (rtcEngineRef.current) {
        console.log('[RTC] Releasing RTC Engine...');
        // Use release() to destroy the engine created by createAgoraRtcEngine
        rtcEngineRef.current.release();
        rtcEngineRef.current = null;
        console.log('[RTC] RTC Engine released');
      }
      setIsRtcEngineReady(false);
    };
  }, []);

  // Initialize Agora RTM
  useEffect(() => {
    let isMounted = true;
    if (user && user.id) {
      const rtmId = user.id.toString(); 
      console.log(`[RTM] Initializing RTM for user: ${rtmId}`);
      const rtmHelper = AgoraRtmHelper.getInstance();
      rtmHelperRef.current = rtmHelper;

      rtmHelper.initialize()
        .then(() => {
          if (!isMounted) return;
          console.log('[RTM] RTM Helper initialized. Attempting login...');
          return rtmHelper.login(rtmId);
        })
        .then(() => {
          if (!isMounted) return;
          console.log('[RTM] Successfully logged into RTM.');
          setIsRtmReady(true);
          if (rtmHelperRef.current) {
            console.log('[RTM] Registering remoteInvitationReceived listener');
            rtmHelperRef.current.on('remoteInvitationReceived', (remoteInvitation: RtmRemoteInvitation) => {
              console.log('[RTM] Remote invitation received:', remoteInvitation);
              try {
                // Use the .content property as defined in your agora-rtm.d.ts
                const invitationContentString = remoteInvitation.content; 
                if (invitationContentString) {
                  const parsedContent = JSON.parse(invitationContentString);
                  console.log('[RTM] Parsed remote invitation content:', parsedContent);

                  // Proceed to use parsedContent to setIncomingCallData
                  setIncomingCallData({
                    rtmInvitation: remoteInvitation,
                    callerName: parsedContent.callerName || `User ${remoteInvitation.getCallerId()}`,
                    callType: parsedContent.callType,
                    channelName: parsedContent.channelName,
                    rtcToken: parsedContent.rtcToken,
                    callerRtcUid: parsedContent.callerRtcUid,
                    // isFromNotification: false, // Assuming this is a live RTM event
                  });
                } else {
                  console.error('[RTM] Received remote invitation with empty or null content.');
                  // Handle cases where content might be missing, if applicable
                }
              } catch (e) {
                console.error('[RTM] Error parsing remote invitation content:', e);
                // Handle JSON parsing errors
              }
            });

            rtmHelperRef.current.on('localInvitationAccepted', (localInvitation: RtmLocalInvitation) => {
              console.log('[RTM] Local Invitation Accepted by peer:', localInvitation);
              // Match based on calleeId from the event and stored outgoing details
              if (outgoingInvitationDetails && localInvitation.getCalleeId() === outgoingInvitationDetails.uid) {
                try {
                  const contentString = localInvitation.getContent(); // Get content from event's invitation
                  if (!contentString) {
                    console.error('[RTM] Accepted invitation has no content.');
                    Alert.alert("Call Error", "Failed to process call acceptance: Missing content.");
                    endCall();
                    return;
                  }
                  const content = JSON.parse(contentString);
                  console.log('[RTM] Joining RTC channel from localInvitationAccepted. Content:', content);
                  setCurrentChannelName(content.channelName);
                  setCurrentRtcToken(content.rtcToken);
                  setInCall(true); 
                  setOutgoingInvitationDetails(null); // Clear details once accepted
                } catch (e) {
                  console.error('[RTM] Failed to parse local invitation content on acceptance:', e);
                  Alert.alert("Call Error", "Failed to process call acceptance.");
                  endCall(); 
                }
              } else {
                console.warn('[RTM] Received localInvitationAccepted for an unexpected invitation:', localInvitation.getCalleeId());
              }
            });

            rtmHelperRef.current.on('localInvitationRefused', (localInvitation: RtmLocalInvitation) => {
              console.log('[RTM] Local Invitation Refused by peer:', localInvitation);
              if (outgoingInvitationDetails && localInvitation.getCalleeId() === outgoingInvitationDetails.uid) {
                Alert.alert('Call Refused', `${localInvitation.getCalleeId()} refused your call.`);
                setOutgoingInvitationDetails(null); // Clear details
                endCall(); 
              }
            });
            rtmHelperRef.current.on('localInvitationFailure', (data: { localInvitation: RtmLocalInvitation, errorCode: number }) => {
              const { localInvitation, errorCode } = data;
              console.log('[RTM] Local Invitation Failure:', localInvitation, 'Error Code:', errorCode);
              if (outgoingInvitationDetails && localInvitation.getCalleeId() === outgoingInvitationDetails.uid) {
                Alert.alert('Call Failed', `Failed to send call invitation. Error: ${errorCode}`);
                setOutgoingInvitationDetails(null); // Clear details
                endCall();
              }
            });
            // ... (tokenExpired logic remains the same) ...
          }
        })
        .catch(err => {
          if (!isMounted) return;
          console.error('[RTM] Failed to initialize or login to RTM:', err);
          // Alert.alert("RTM Error", "Could not connect to signaling service."); // Already present
          setIsRtmReady(false); // Ensure RTM is not ready on error
        });
    } else {
      console.log('[RTM] No user found, setting RTM not ready');
      setIsRtmReady(false); // If no user, RTM is not ready
    }
    return () => {
      isMounted = false;
      rtmHelperRef.current?.release();
      rtmHelperRef.current = null;
      setIsRtmReady(false);
      console.log('[RTM] RTM Helper released');
    };
  }, [user]);


  const startCallInternal = async (contact: Contact, callType: 'voice' | 'video') => {
    if (!user || !user.id) {
      Alert.alert('Login Required', 'Please login to make calls.');
      return;
    }
    if (!isRtmReady || !rtmHelperRef.current || !rtmHelperRef.current.getIsLoggedIn()) {
      Alert.alert('RTM Error', 'Signaling service not ready. Please wait or try again.');
      return;
    }
    if (!isRtcEngineReady || !rtcEngineRef.current) {
      Alert.alert('RTC Error', 'Call engine not ready. Please wait or try again.');
      return;
    }
    
    if (inCall || incomingCallData) {
      Alert.alert('Busy', 'You are already in a call or receiving one.');
      return;
    }

    const permissionsGranted = await requestPermissions(callType);
    if (!permissionsGranted) return;

    setIsCaller(true);
    setCurrentCallType(callType);

    try {
      const rtcAuthDetails = await fetchAgoraRtcToken(user.id); 
      setCurrentLocalRtcUid(rtcAuthDetails.uid); 

      console.log(`[RTM] Initiating ${callType} call to ${contact.id.toString()} via sendLocalInvitation props`);
      console.log(`[RTM] RTC Details for invitation: Channel=${rtcAuthDetails.channelName}, CallerRTCUid=${rtcAuthDetails.uid}`);
      
      const calleeRtmId = contact.id.toString();
      const rtmChannelId = rtcAuthDetails.channelName; // Using RTC channel name as RTM channelId
      const invitationContent = JSON.stringify({
        channelName: rtcAuthDetails.channelName,
        callType,
        callerName: user.id.toString(), // Caller's RTM ID
        rtcToken: rtcAuthDetails.token,
        callerRtcUid: rtcAuthDetails.uid,
      });

      // Store details for potential cancellation
      setOutgoingInvitationDetails({
        uid: calleeRtmId,
        channelId: rtmChannelId,
        content: invitationContent,
      });

      await rtmHelperRef.current.initiateAndSendCallInvitation(
        calleeRtmId,
        callType,
        rtmChannelId, 
        rtcAuthDetails.token,
        rtcAuthDetails.uid 
      );
      
      console.log('[RTM] Call invitation sent via props.');
      // UI updates to "Calling..." state. Caller joins RTC upon 'localInvitationAccepted'.
      // For now, setting inCall to true to show a "calling" UI.
      // This will render MeetingView, which will attempt to join.
      // MeetingView should ideally handle "waiting for peer" state until localInvitationAccepted.
      // For simplicity in this step, we set inCall, but RTC join is triggered by MeetingView.
      // The actual RTC join for the caller should happen after localInvitationAccepted.
      // Let's adjust MeetingView or this logic later if needed.
      // For now, to show a "calling..." screen:
      setCurrentChannelName(rtcAuthDetails.channelName); // Set for MeetingView
      setCurrentRtcToken(rtcAuthDetails.token);         // Set for MeetingView
      setInCall(true); 

    } catch (error: any) {
      console.error('[RTM] Failed to start call:', error);
      Alert.alert('Call Failed', error.message || 'Could not initiate the call.');
      setIsCaller(false);
      setInCall(false); 
      setOutgoingInvitationDetails(null); // Clear details on failure
    }
  };

  const acceptIncomingCall = async () => {
    if (!incomingCallData || !rtmHelperRef.current || !isRtmReady || !rtcEngineRef.current || !isRtcEngineReady || !user || !user.id) {
      Alert.alert("Error", "Cannot accept call. Services not ready or invitation data missing.");
      return;
    }
    
    const { callType, channelName, rtcToken, callerRtcUid, isFromNotification, rtmInvitation } = incomingCallData as any; // Cast for isFromNotification

    const permissionsGranted = await requestPermissions(callType);
    if (!permissionsGranted) {
      // Optionally, refuse the call if permissions are denied
      // Ensure rtmInvitation is valid before using it
      if (!isFromNotification && rtmInvitation) {
        await rtmHelperRef.current.refuseCallInvitation(rtmInvitation);
      } else if (isFromNotification) {
        // If from notification and permissions denied, update backend status to rejected
        await NotificationService.updateCallStatus(
            callerRtcUid,
            user.id.toString(),
            'rejected',
            callType === 'voice' ? 'audio' : callType // Map 'voice' to 'audio'
        );
      }
      setIncomingCallData(null);
      return;
    }

    try {
      if (!isFromNotification && rtmInvitation) { // Live RTM invitation
        await rtmHelperRef.current.acceptCallInvitation(rtmInvitation);
        console.log('[RTM] Live remote invitation accepted.');
      } else if (isFromNotification) {
        console.log('[FCM] Accepting call from notification. No RTM accept needed, proceeding to join RTC.');
        // For calls from notifications, we don't have a live RTM invitation object to accept.
        // The notification itself implies the callee wants to interact.
        // We directly proceed to join the RTC channel.
        // The backend should be informed that the call is "answered" if necessary.
        // This might involve a separate API call or be handled by RTC events.
         await NotificationService.updateCallStatus(
            callerRtcUid, // Original caller's ID
            user.id.toString(),    // Current user (callee) ID
            'accepted',
            callType === 'voice' ? 'audio' : callType // Map 'voice' to 'audio'
        );
      } else {
        throw new Error("Invalid incoming call data state.");
      }

      setIsCaller(false);
      setCurrentCallType(callType);
      setCurrentChannelName(channelName);
      setCurrentRtcToken(rtcToken); 
      const calleeRtcUid = user.id;
      setCurrentLocalRtcUid(calleeRtcUid);
      setInCall(true);
      setIncomingCallData(null);
    } catch (error: any) {
      console.error('[RTM] Failed to accept call invitation:', error);
      Alert.alert('Accept Failed', error.message || 'Could not accept the call.');
      setIncomingCallData(null);
    }
  };
  
  const rejectIncomingCall = async () => {
    if (!incomingCallData || !rtmHelperRef.current || !user || !user.id) { // Added user check for updateCallStatus
        console.warn('[CALL] Cannot reject call. Services not ready or invitation data missing.');
        setIncomingCallData(null); // Clear data to prevent stale UI
        return;
    }
    
    const { isFromNotification, rtmInvitation, callerRtcUid, callType } = incomingCallData;

    try {
      if (isFromNotification) {
        console.log('[FCM] Rejecting call from notification. Updating backend status.');
        await NotificationService.updateCallStatus(
          callerRtcUid, // Original caller's ID
          user.id.toString(), // Current user (callee) ID
          'rejected',
          callType === 'voice' ? 'audio' : callType // Map 'voice' to 'audio'
        );
      } else if (rtmInvitation) { // Live RTM invitation
        if (!isRtmReady) {
            console.warn('[RTM] RTM not ready, cannot send RTM refusal.');
            // Still update backend if possible, or just clear UI
        } else {
            await rtmHelperRef.current.refuseCallInvitation(rtmInvitation);
            console.log('[RTM] Live remote invitation refused via RTM.');
        }
      } else {
        console.warn('[CALL] Rejecting call but no valid RTM invitation and not marked as from notification.');
      }
    } catch (error: any) {
      console.error('[CALL] Failed to reject call:', error);
      // Alert.alert('Reject Failed', error.message || 'Could not refuse the call.');
    } finally {
      setIncomingCallData(null);
    }
  };

  const endCall = useCallback(async () => {
    console.log('[CALL] Ending call...');
    if (isCaller && outgoingInvitationDetails) {
      try {
        console.log('[RTM] Caller ending call, attempting to cancel local invitation via props.');
        await rtmHelperRef.current?.cancelCallInvitation(outgoingInvitationDetails);
      } catch (e) {
        console.warn('[RTM] Failed to cancel local invitation on endCall (it might have been accepted/refused already):', e);
      }
    }
    setOutgoingInvitationDetails(null); // Clear outgoing invitation details

    if (rtcEngineRef.current) {
      await AgoraHelper.safeLeaveChannel(rtcEngineRef.current);
      console.log('[RTC] Left RTC channel.');
    }
    
    setInCall(false);
    setCurrentChannelName('');
    setCurrentRtcToken('');
    setIsCaller(false);
    setIncomingCallData(null); 
  }, [isCaller, outgoingInvitationDetails, rtmHelperRef]); // Added outgoingInvitationDetails

  const startVoiceCall = useCallback((contact: Contact) => {
    startCallInternal(contact, 'voice');
  }, [startCallInternal]);

  const startVideoCall = useCallback((contact: Contact) => {
    startCallInternal(contact, 'video');
  }, [startCallInternal]);


  const loadMoreUsers = useCallback(() => {
    if (loading || contacts.length >= totalRecords) return;
    fetchUsers(page + 1, true);
  }, [loading, contacts.length, totalRecords, page, fetchUsers]);


  const renderContactItem = ({item}: {item: Contact}) => (
    <View style={styles.contactItem}>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name || `User ${item.id}`}</Text>
        <Text style={styles.contactStatus}>
          {item.online_status ? 'Online' : `Last seen: ${item.last_seen || 'N/A'}`}
        </Text>
      </View>
      <View style={styles.callButtons}>
        <TouchableOpacity style={styles.callButton} onPress={() => startVoiceCall(item)}>
          <Icon name="phone" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.callButton} onPress={() => startVideoCall(item)}>
          <Icon name="video" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  useEffect(() => {
    const initialData = route.params?.initialCallNotificationData as any; // Cast as needed
    if (initialData && initialData.isFromNotification && !incomingCallData && !inCall && isRtmReady && isRtcEngineReady) { // Check readiness
      console.log('[TipCallScreen] Received initial call data from notification:', initialData);
      // This is not a full RtmRemoteInvitation, so you can't directly use rtmHelper.acceptCallInvitation
      // You need to simulate the state of receiving an invitation.
      // The key challenge is that RTM invitations are live objects.
      // For a call from notification, you might directly proceed to the "accepting" phase
      // if the user confirms, or show a simplified incoming call UI.

      // Simplified: Show an incoming call UI based on this data.
      // The `onAccept` for this UI would then directly try to join the RTC channel.
      setIncomingCallData({
        // This is a mock/partial RtmRemoteInvitation.
        // You won't be able to call rtmInvitation.accept() on this.
        // So, acceptIncomingCall needs to handle this case.
        rtmInvitation: { 
            getCallerId: () => initialData.callerRtcUid, // Or a dedicated caller RTM ID if different
            getContent: () => JSON.stringify({ // Reconstruct content
                channelName: initialData.channelName,
                callType: initialData.callType,
                callerName: initialData.callerName,
                rtcToken: initialData.rtcToken,
                callerRtcUid: initialData.callerRtcUid,
            }),
            // Mock other methods if acceptIncomingCall tries to use them, or modify acceptIncomingCall
        } as any, // Cast to RtmRemoteInvitation, but be careful
        callerName: initialData.callerName,
        callType: initialData.callType,
        channelName: initialData.channelName,
        rtcToken: initialData.rtcToken,
        callerRtcUid: initialData.callerRtcUid,
        // Add a flag to indicate this is from a notification and not a live RTM invite
        isFromNotification: true,
      });
    }
  }, [route.params?.initialCallNotificationData, inCall, incomingCallData, isRtmReady, isRtcEngineReady]); // Added readiness states

  // --- New effect for handling remote invitations with cleanup ---
  useEffect(() => {
    if (isRtmReady && rtmHelperRef.current) {
      const handler = (remoteInvitation: RtmRemoteInvitation) => {
        console.log('[RTM] Remote invitation received:', remoteInvitation);
        try {
          const invitationContentString = remoteInvitation.content;
          if (invitationContentString) {
            const parsedContent = JSON.parse(invitationContentString);
            console.log('[RTM] Parsed remote invitation content:', parsedContent);
            setIncomingCallData({
              rtmInvitation: remoteInvitation,
              callerName: parsedContent.callerName || `User ${remoteInvitation.getCallerId()}`,
              callType: parsedContent.callType,
              channelName: parsedContent.channelName,
              rtcToken: parsedContent.rtcToken,
              callerRtcUid: parsedContent.callerRtcUid,
            });
          } else {
            console.error('[RTM] Received remote invitation with empty or null content.');
          }
        } catch (e) {
          console.error('[RTM] Error parsing remote invitation content:', e);
        }
      };
      console.log('[RTM] Setting up remoteInvitationReceived listener');
      rtmHelperRef.current.on('remoteInvitationReceived', handler);
      console.log('[RTM] remoteInvitationReceived listener setup SUCCESSFUL');
      return () => {
        console.log('[RTM] Removing remoteInvitationReceived listener');
        rtmHelperRef.current?.off('remoteInvitationReceived', handler);
      };
    }
  }, [isRtmReady, rtmHelperRef.current]);


  if (!isRtcEngineReady || !isRtmReady) { // Show a general loading/initializing screen
      if (loading && contacts.length === 0 && !inCall && !incomingCallData) { // Keep existing contacts loading
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#24d05a" />
            <Text style={styles.loadingText}>Loading Contacts...</Text>
          </View>
        );
      }
      // Show a generic initializing screen if engines are not ready yet
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#24d05a" />
          <Text style={styles.loadingText}>Initializing call services...</Text>
        </View>
      );
  }
  
  if (loading && contacts.length === 0 && !inCall && !incomingCallData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#24d05a" />
        <Text style={styles.loadingText}>Loading Contacts...</Text>
      </View>
    );
  }
  
  if (inCall && rtcEngineRef.current && currentChannelName && currentRtcToken && currentLocalRtcUid > 0) {
    return (
      <MeetingView
        channelName={currentChannelName}
        rtcEngine={rtcEngineRef.current}
        onEndCall={endCall}
        isCaller={isCaller}
        callType={currentCallType}
        localUid={currentLocalRtcUid}
        token={currentRtcToken}
      />
    );
  }

  if (incomingCallData) {
    return (
      <IncomingCallScreenComponent
        callerName={incomingCallData.callerName}
        callType={incomingCallData.callType}
        onAccept={acceptIncomingCall}
        onReject={rejectIncomingCall}
      />
    );
  }

  return (
    <View style={[styles.container, {paddingBottom: contentPaddingBottom}]}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}><Icon name="phone-call" size={16} color="white" /></View>
          <Text style={styles.title}>TipCall</Text>
        </View>
        {/* ... other header actions ... */}
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={18} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            placeholder="Search contacts..."
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => fetchUsers(1)}
          />
        </View>
      </View>
      
      {/* Filters (Simplified for brevity, you can re-add your complex filters) */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filterTitle}>Users</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchUsers(1)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={contacts}
        renderItem={renderContactItem}
        keyExtractor={(item: Contact) => item.id.toString()}
        style={styles.contactsContainer}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No contacts found.</Text>
            </View>
          ) : null
        }
        onEndReached={loadMoreUsers}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loading && contacts.length > 0 ? <ActivityIndicator size="small" color="#24d05a" /> : null}
      />
    </View>
  );
};

// Keep your existing styles, ensure they match the components used
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 20 + 10 : 48, // Adjusted for status bar
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    padding: 0, // Remove default padding for TextInput
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
 
    // color: '#64748b', // This line seems to be a duplicate or misplaced. Consider removing or correcting it.
                       // If '#64748b' was intended for the status, it's now used below.
  },
  contactStatus: { // Add this new style definition
    fontSize: 14,
    color: '#64748b',
  },
  callButtons: {
    flexDirection: 'row',
    marginLeft: 16,
  },
  callButton: {
    width: 44, // Increased size for easier touch
    height: 44, // Increased size
    borderRadius: 22, // Half of width/height
    backgroundColor: '#24d05a',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10, // Increased spacing
  },
  callOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  callStatus: {
    fontSize: 20,
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  endCallButton: {
    backgroundColor: '#ff3b30', // Standard red for end call
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25, // Rounded
    marginTop: 40,
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
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 14,
    color: '#374151',
    marginTop: 12,
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
    flex: 1, // Allow text to wrap
    marginRight: 8,
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50, // Give some space from filters
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 16,
    textAlign: 'center',
  },
  localVideo: { // For video calls
    width: 120,
    height: 180,
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 60,
    right: 20,
    zIndex: 1001, // Above remote video
    borderRadius: 8,
    overflow: 'hidden', // Important for borderRadius to work on SurfaceView
    borderWidth: 2,
    borderColor: '#24d05a',
  },
  remoteVideo: { // For video calls
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000, // Below local video and controls
    backgroundColor: 'black', // Fallback background
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