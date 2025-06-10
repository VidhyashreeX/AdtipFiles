import React, {useEffect, useState, useCallback, useRef} from 'react';
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
import {firebase} from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import RtcEngine, {
  ChannelProfile, 
  ClientRole, 
  IRtcEngine, 
  RtmLocalInvitation, 
  RtmRemoteInvitation,
  RtcLocalView  // Add this import
} from 'react-native-agora';
import RtcRemoteView from 'react-native-agora';


import {useAuth} from '../../contexts/AuthContext';
import {useTabNavigator} from '../../contexts/TabNavigatorContext';
import ApiService from '../../services/ApiService';
import AgoraRtmHelper, { RtmEventType } from '../../services/AgoraRtmHelper'; // Import RtmEventType
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
  channelName,
  rtcEngine,
  onEndCall,
  isCaller,
  callType,
  localUid,
  token,
}) => {
  const [remoteUsers, setRemoteUsers] = useState<number[]>([]);
  const remoteUsersRef = useRef<number[]>([]); // To manage remote users correctly

  useEffect(() => {
    const initRtc = async () => {
      console.log('[RTC] MeetingView: Initializing RTC Engine for call.');
      await rtcEngine.enableVideo(); // Enable video if it's a video call
      await rtcEngine.setChannelProfile(ChannelProfile.Communication);
      if (callType === 'video') {
         await rtcEngine.enableVideo();
      } else {
         await rtcEngine.disableVideo(); // Ensure video is off for voice calls
      }

      rtcEngine.addListener('UserJoined', (uid) => {
        console.log('[RTC] MeetingView: Remote user joined:', uid);
        if (!remoteUsersRef.current.includes(uid)) {
          setRemoteUsers(prev => [...prev, uid]);
          remoteUsersRef.current = [...remoteUsersRef.current, uid];
        }
      });

      rtcEngine.addListener('UserOffline', (uid) => {
        console.log('[RTC] MeetingView: Remote user offline:', uid);
        setRemoteUsers(prev => prev.filter(userUid => userUid !== uid));
        remoteUsersRef.current = remoteUsersRef.current.filter(userUid => userUid !== uid);
        if (remoteUsersRef.current.length === 0 && !isCaller) { // If all remote users left and current user is not caller
            onEndCall(); // Consider ending call if no one else is there
        }
      });
      
      rtcEngine.addListener('JoinChannelSuccess', (channel, uid, elapsed) => {
        console.log(`[RTC] MeetingView: Joined RTC channel ${channel} successfully as UID ${uid}`);
      });

      rtcEngine.addListener('Error', (err) => {
        console.error('[RTC] MeetingView: RTC Error:', err);
        // Potentially end call on critical errors
      });
      
      console.log(`[RTC] MeetingView: Attempting to join RTC channel: ${channelName} with UID: ${localUid} and Token: ${token ? 'Present' : 'Absent'}`);
      await AgoraHelper.safeJoinChannel(rtcEngine, token, channelName, localUid);
    };

    initRtc();

    return () => {
      console.log('[RTC] MeetingView: Cleaning up RTC listeners and leaving channel.');
      rtcEngine.removeAllListeners('UserJoined');
      rtcEngine.removeAllListeners('UserOffline');
      rtcEngine.removeAllListeners('JoinChannelSuccess');
      rtcEngine.removeAllListeners('Error');
      AgoraHelper.safeLeaveChannel(rtcEngine).catch(err => console.error("[RTC] MeetingView: Error leaving channel on cleanup", err));
    };
  }, [rtcEngine, channelName, localUid, token, callType, onEndCall, isCaller]);

  return (
    <View style={styles.callOverlay}>
      <Text style={styles.callStatus}>In {callType} call...</Text>
      {callType === 'video' && (
        <>
          {/* Local Video */}
          <RtcLocalView.SurfaceView style={styles.localVideo} channelId={channelName} />
          {/* Remote Video(s) */}
          {remoteUsers.map(uid => (
            <RtcRemoteView.SurfaceView key={uid} style={styles.remoteVideo} uid={uid} channelId={channelName} />
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

  const [incomingCallData, setIncomingCallData] = useState<{
    rtmInvitation: RtmRemoteInvitation;
    callerName: string;
    callType: 'voice' | 'video';
    channelName: string; // RTC Channel Name from invitation
    rtcToken: string;    // RTC Token from invitation
    callerRtcUid: string; // Caller's UID for RTC
  } | null>(null);

  const rtmHelperRef = useRef<AgoraRtmHelper | null>(null);
  const localInvitationRef = useRef<RtmLocalInvitation | null>(null);
  // remoteInvitationRef is now part of incomingCallData.rtmInvitation

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

  const fetchUsers = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!user || !user.id) {
      redirectToLogin();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await ApiService.getUsers({
        id: user.id, // Assuming this is the current user's ID
        page: pageNum,
        limit: 15,
        language: selectedLanguage === '1' ? [] : [parseInt(selectedLanguage)],
        interest: selectedCategory === '1' ? [] : [parseInt(selectedCategory)],
        search_by_name: searchQuery,
        loggined_user_id: user.id,
        sortBy: {},
      });
      if (response.status && response.data) {
        setContacts(prev => (append ? [...prev, ...response.data] : response.data));
        setPage(response.pagination.page);
        setTotalRecords(response.pagination.totalRecords);
      } else {
        setError(response.message || 'Failed to fetch users.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedLanguage, searchQuery, user, redirectToLogin]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);


  // Initialize RTC Engine
  useEffect(() => {
    const initRtcEngine = async () => {
      try {
        rtcEngineRef.current = await RtcEngine.create(APP_ID);
        console.log('[RTC] RTC Engine created');
      } catch (e) {
        console.error('[RTC] Failed to create RTC Engine:', e);
      }
    };
    initRtcEngine();
    return () => {
      rtcEngineRef.current?.destroy();
      rtcEngineRef.current = null;
      console.log('[RTC] RTC Engine destroyed');
    };
  }, []);

  // Initialize Agora RTM
  useEffect(() => {
    if (user && user.id) {
      const rtmId = user.id.toString(); // RTM UID is typically a string
      console.log(`[RTM] Initializing RTM for user: ${rtmId}`);
      rtmHelperRef.current = AgoraRtmHelper.getInstance();
      rtmHelperRef.current.initialize()
        .then(() => {
          console.log('[RTM] RTM Helper initialized. Attempting login...');
          return rtmHelperRef.current!.login(rtmId);
        })
        .then(() => {
          console.log('[RTM] Successfully logged into RTM.');
          // Setup RTM event listeners after successful login
          rtmHelperRef.current!.on('remoteInvitationReceived', (remoteInvitation: RtmRemoteInvitation) => {
            console.log('[RTM] Remote Invitation Received:', remoteInvitation);
            try {
              const content = JSON.parse(remoteInvitation.getContent());
              console.log('[RTM] Parsed Invitation Content:', content);
              setIncomingCallData({
                rtmInvitation: remoteInvitation,
                callerName: content.callerName || remoteInvitation.getCallerId(),
                callType: content.callType || 'voice',
                channelName: content.channelName, // RTC Channel Name
                rtcToken: content.rtcToken,       // RTC Token
                callerRtcUid: content.callerRtcUid, // Caller's UID for RTC
              });
            } catch (e) {
              console.error('[RTM] Failed to parse remote invitation content:', e);
               // Fallback: if content parsing fails, still show basic invitation
              setIncomingCallData({
                rtmInvitation: remoteInvitation,
                callerName: remoteInvitation.getCallerId(),
                callType: 'voice', // Default if content is unparsable
                channelName: `call_${Date.now()}`, // Generate a fallback channel
                rtcToken: '', // No token available
                callerRtcUid: remoteInvitation.getCallerId(),
              });
            }
          });

          rtmHelperRef.current!.on('localInvitationAccepted', (localInvitation: RtmLocalInvitation) => {
            console.log('[RTM] Local Invitation Accepted by peer:', localInvitation);
            if (localInvitationRef.current && localInvitationRef.current.getCalleeId() === localInvitation.getCalleeId()) {
              // Callee accepted, now the caller joins the RTC channel
              try {
                const content = JSON.parse(localInvitationRef.current.getContent());
                console.log('[RTM] Joining RTC channel from localInvitationAccepted. Content:', content);
                setCurrentChannelName(content.channelName);
                setCurrentRtcToken(content.rtcToken);
                // Caller's RTC UID was set when fetching RTC token
                setInCall(true); 
                // isCaller is already true
              } catch (e) {
                console.error('[RTM] Failed to parse local invitation content on acceptance:', e);
                Alert.alert("Call Error", "Failed to process call acceptance.");
                endCall(); // Clean up
              }
            }
          });

          rtmHelperRef.current!.on('localInvitationRefused', (localInvitation: RtmLocalInvitation) => {
            console.log('[RTM] Local Invitation Refused by peer:', localInvitation);
            Alert.alert('Call Refused', `${localInvitation.getCalleeId()} refused your call.`);
            endCall(); // Clean up
          });
          rtmHelperRef.current!.on('localInvitationFailure', (localInvitation: RtmLocalInvitation, errorCode: number) => {
            console.log('[RTM] Local Invitation Failure:', localInvitation, 'Error Code:', errorCode);
            Alert.alert('Call Failed', `Failed to send call invitation. Error: ${errorCode}`);
            endCall();
          });
           rtmHelperRef.current!.on('tokenExpired', async () => {
            console.warn('[RTM] RTM Token Expired. Attempting to re-login...');
            if (user && user.id) {
              try {
                // You might need a renewToken method in AgoraRtmHelper or re-fetch and login
                await rtmHelperRef.current?.login(user.id.toString());
                console.log('[RTM] Re-logged in successfully after token expiry.');
              } catch (e) {
                console.error('[RTM] Failed to re-login after token expiry:', e);
                Alert.alert("Connection Issue", "RTM connection lost. Please try again.");
                // Potentially logout or redirect to login
              }
            }
          });

        })
        .catch(err => {
          console.error('[RTM] Failed to initialize or login to RTM:', err);
          Alert.alert("RTM Error", "Could not connect to signaling service.");
        });
    }
    return () => {
      rtmHelperRef.current?.release();
      rtmHelperRef.current = null;
      console.log('[RTM] RTM Helper released');
    };
  }, [user]);


  const startCallInternal = async (contact: Contact, callType: 'voice' | 'video') => {
    if (!user || !user.id) {
      Alert.alert('Login Required', 'Please login to make calls.');
      return;
    }
    if (!rtmHelperRef.current) {
      Alert.alert('RTM Error', 'Signaling service not ready.');
      return;
    }
    if (!rtcEngineRef.current) {
      Alert.alert('RTC Error', 'Call engine not ready.');
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
      // 1. Fetch RTC token and channel details (caller initiates this)
      // The UID for RTC token generation should be the current user's ID.
      const rtcAuthDetails = await fetchAgoraRtcToken(user.id); 
      setCurrentChannelName(rtcAuthDetails.channelName);
      setCurrentRtcToken(rtcAuthDetails.token);
      setCurrentLocalRtcUid(rtcAuthDetails.uid); // This is the caller's UID for RTC

      console.log(`[RTM] Creating ${callType} call invitation to ${contact.id.toString()}`);
      console.log(`[RTM] RTC Details for invitation: Channel=${rtcAuthDetails.channelName}, RTC Token=${rtcAuthDetails.token ? 'Present' : 'Absent'}, CallerRTCUid=${rtcAuthDetails.uid}`);

      // 2. Create RTM Local Invitation
      const invitation = await rtmHelperRef.current.createCallInvitation(
        contact.id.toString(), // Callee's RTM UID
        callType,
        rtcAuthDetails.channelName, // RTC Channel Name
        rtcAuthDetails.token        // RTC Token
        // The content of the invitation now includes rtcToken and callerRtcUid (which is user.id)
      );
      localInvitationRef.current = invitation;

      // 3. Send RTM Local Invitation
      await rtmHelperRef.current.sendCallInvitation(invitation);
      console.log('[RTM] Call invitation sent.');
      // UI should update to "Calling..." state. Caller does not join RTC channel yet.
      // Caller joins RTC channel only after 'localInvitationAccepted' is received.
      // For now, let's set inCall to true to show a "calling" UI, but not join RTC yet.
      // This part needs careful UI state management.
      // To simplify, we can set inCall to true and let MeetingView handle joining.
      // However, the correct flow is: send invite -> wait for accept -> then join.
      // For now, to show a calling screen:
      setInCall(true); // This will render MeetingView, which will attempt to join.
                       // This is okay if MeetingView handles "waiting for peer" state.

    } catch (error: any) {
      console.error('[RTM] Failed to start call:', error);
      Alert.alert('Call Failed', error.message || 'Could not initiate the call.');
      setIsCaller(false);
      setInCall(false); // Reset state
    }
  };

  const acceptIncomingCall = async () => {
    if (!incomingCallData || !rtmHelperRef.current || !rtcEngineRef.current || !user || !user.id) {
      Alert.alert("Error", "Cannot accept call. Invitation data or RTM/RTC service missing.");
      return;
    }
    
    const { callType, channelName, rtcToken, callerRtcUid, isFromNotification, rtmInvitation } = incomingCallData as any; // Cast for isFromNotification

    const permissionsGranted = await requestPermissions(callType);
    if (!permissionsGranted) {
      // Optionally, refuse the call if permissions are denied
      await rtmHelperRef.current.refuseCallInvitation(rtmInvitation);
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
            callType
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
    if (!incomingCallData || !rtmHelperRef.current) return;
    try {
      await rtmHelperRef.current.refuseCallInvitation(incomingCallData.rtmInvitation);
      console.log('[RTM] Remote invitation refused.');
    } catch (error: any) {
      console.error('[RTM] Failed to refuse call invitation:', error);
      // Alert.alert('Reject Failed', error.message || 'Could not refuse the call.');
    } finally {
      setIncomingCallData(null);
    }
  };

  const endCall = useCallback(async () => {
    console.log('[CALL] Ending call...');
    if (isCaller && localInvitationRef.current) {
      try {
        // If the call was never accepted, cancel the invitation
        // Check invitation state if SDK provides it, otherwise assume cancel if not in RTC call yet
        // For simplicity, always try to cancel if localInvitationRef exists and user is caller
        console.log('[RTM] Caller ending call, attempting to cancel local invitation.');
        await rtmHelperRef.current?.cancelCallInvitation(localInvitationRef.current);
      } catch (e) {
        console.warn('[RTM] Failed to cancel local invitation on endCall (it might have been accepted/refused already):', e);
      }
    }
    localInvitationRef.current = null;

    if (rtcEngineRef.current) {
      await AgoraHelper.safeLeaveChannel(rtcEngineRef.current);
      console.log('[RTC] Left RTC channel.');
    }
    
    setInCall(false);
    setCurrentChannelName('');
    setCurrentRtcToken('');
    setIsCaller(false);
    setIncomingCallData(null); // Clear any pending incoming call UI
    // Reset RTC engine state if necessary, though destroying/recreating might be safer for complex scenarios
    // For now, just leaving channel.
  }, [isCaller, rtcEngineRef, rtmHelperRef]);


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
    if (initialData && initialData.isFromNotification && !incomingCallData && !inCall) {
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
  }, [route.params?.initialCallNotificationData]);

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
        keyExtractor={item => item.id.toString()}
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