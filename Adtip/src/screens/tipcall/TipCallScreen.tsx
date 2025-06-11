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
  ScrollView,
} from 'react-native';
import { 
  createAgoraRtcEngine,
  RtcEngineContext,
  ChannelProfileType,
  IRtcEngine,
  RtcSurfaceView,
} from 'react-native-agora';
import IncomingCallScreenComponent from '../../components/tipcall/IncomingCallScreen';
import {useTheme} from '../../contexts/ThemeContext';
import ContactSkeletonItem from '../../components/skeletons/ContactSkeletonItem';
import { UserListRequest, AgoraCallerTokenRequest, AgoraCalleeTokenRequest, AgoraTokenResponse as AgoraApiTokenResponse } from '../../types/api';
import {useAuth} from '../../contexts/AuthContext';
import {useTabNavigator} from '../../contexts/TabNavigatorContext';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import ApiService from '../../services/ApiService';
import Icon from 'react-native-vector-icons/Feather';
import messaging from '@react-native-firebase/messaging';
import * as AgoraHelper from '../../services/AgoraHelper';
import Header from '../../components/common/Header';

// Define a basic colors object for use in styles (customize as needed)
// This local colors object can be a fallback if theme doesn't provide specific keys.
const localFallbackColors = {
  primary: '#24d05a',
  card: '#fff',
  borderLight: '#e5e7eb',
  background: '#f8fafc',
  text: {
    primary: '#374151',
    secondary: '#64748b',
    tertiary: '#9ca3af',
  },
  inputBackground: '#f1f5f9',
  errorBackground: '#fee2e2',
  errorText: '#dc2626',
};

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

// Renamed to avoid conflict with the one from types/api
interface TipCallAgoraRtcTokenResponse {
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

// Fetch Agora RTC token from server using ApiService
// Now returns an object with token, channelName, and uid from the server response
const fetchAgoraRtcTokenForCaller = async (uid: number): Promise<TipCallAgoraRtcTokenResponse> => {
  try {
    console.log(`[RTC] Fetching Agora RTC token for CALLER uid: ${uid}`);
    // Use AgoraCallerTokenRequest if your ApiService expects it, or just { uid }
    const agoraTokenData = await ApiService.getAgoraTokenForCaller({ uid });
    console.log('[RTC] Exact Agora RTC Token Server Response for CALLER:', JSON.stringify(agoraTokenData, null, 2));

    if (agoraTokenData && agoraTokenData.token && agoraTokenData.channelName && agoraTokenData.uid) {
      return agoraTokenData;
    } else {
      console.error('[RTC] Invalid Agora RTC token data received for CALLER:', agoraTokenData);
      throw new Error('Invalid Agora RTC token data from server for CALLER.');
    }
  } catch (error) {
    console.error('[RTC] Error fetching Agora RTC token for CALLER:', error);
    const specificMessage = error instanceof Error ? error.message : 'An unknown error occurred while fetching the Agora RTC token for the CALLER';
    throw new Error(specificMessage);
  }
};

// Fetch Agora RTC token for the CALLEE
const fetchAgoraRtcTokenForCallee = async (uid: number, channelName: string): Promise<TipCallAgoraRtcTokenResponse> => {
  try {
    console.log(`[RTC] Fetching Agora RTC token for CALLEE uid: ${uid}, channel: ${channelName}`);
    const agoraTokenData = await ApiService.getAgoraTokenForCallee({ uid, channelName });
    console.log('[RTC] Exact Agora RTC Token Server Response for CALLEE:', JSON.stringify(agoraTokenData, null, 2));

    if (agoraTokenData && agoraTokenData.token && agoraTokenData.channelName && agoraTokenData.uid) {
      // The channelName in response should match the one requested.
      // The uid in response is the callee's RTC UID.
      return agoraTokenData;
    } else {
      console.error('[RTC] Invalid Agora RTC token data received for CALLEE:', agoraTokenData);
      throw new Error('Invalid Agora RTC token data from server for CALLEE.');
    }
  } catch (error) {
    console.error('[RTC] Error fetching Agora RTC token for CALLEE:', error);
    const specificMessage = error instanceof Error ? error.message : 'An unknown error occurred while fetching the Agora RTC token for the CALLEE';
    throw new Error(specificMessage);
  }
};

// Notify recipient of incoming call using ApiService
const notifyRecipient = async (
  recipientId: number,
  channelId: string,
  callType: 'voice' | 'video',
  userId: string | undefined, // This is the caller's app user ID
  callerName: string, // Added callerName
  callerRtcUid: number, // Added callerRtcUid
  callerRtcToken: string // Added callerRtcToken (caller's token for the channel)
) => {
  console.log(`[Signal] Initiating ${callType} call notification to recipient ${recipientId}`);
  console.log(`[Signal] Call parameters - Channel: ${channelId}, CallerAppUserId: ${userId}, CallerName: ${callerName}, CallerRtcUid: ${callerRtcUid}`);
  
  if (!userId) {
    console.warn('[Signal] No authenticated user for notification');
    return;
  }
  
  try {
    // This payload should align with what your backend expects for a push notification
    // to initiate a call. It might include channelName, caller's RTC UID, caller's display name, etc.
    // The `ApiService.handleCall` might be a generic endpoint, or you might have a specific one for notifications.
    const payload = {
      callerId: userId, // Caller's application user ID
      receiverId: recipientId.toString(), // Recipient's application user ID
      action: 'start' as 'start', // Or a specific action like 'initiate_call_notification'
      callType: callType === 'video' ? 'video-call' : 'audio-call' as 'video-call' | 'audio-call',
      // Additional data for the recipient's notification payload:
      channelName: channelId,
      caller_name: callerName, // Name to display on incoming call screen
      caller_rtc_uid: callerRtcUid.toString(), // Caller's RTC UID for the channel
      // The caller's RTC token for the channel might also be sent if the callee needs it
      // directly from the notification, though fetching their own is safer.
      // For now, let's assume the callee fetches their own token upon receiving the notification.
      // rtc_token: callerRtcToken, 
    } as const;
    
    console.log('[Signal] Sending call notification with payload:', JSON.stringify(payload, null, 2));
    // Assuming ApiService.handleCall is suitable for sending this notification trigger
    // or you have another method like ApiService.sendCallNotification(payload)
    const response = await ApiService.handleCall(payload); 
    console.log('[Signal] Call notification response:', JSON.stringify(response, null, 2));
    console.log(`[Signal] ${callType} call notification sent to recipient ID ${recipientId}`);    
    return response;
  } catch (error) {
    console.error('[Signal] Error notifying recipient:', error);
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
            Alert.alert("Permissions Denied", "Cannot receive call notifications without permission.");
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
      // Use the field names from your specified payload
      const {
        channelName, // RTC channel name
        caller_app_user_id, // Caller's application user ID
        callee_agora_uid,   // Callee's (this user's) Agora RTC UID for the channel
        agora_token,        // Callee's (this user's) Agora RTC token for the channel
        call_type,          // "audio" or "video"
        caller_name         // Caller's display name
      } = remoteMessage.data;
      
      console.log('[FCM] Notification data fields:', { channelName, caller_app_user_id, callee_agora_uid, agora_token, call_type, caller_name });
      
      // Validate essential fields
      if (caller_app_user_id && channelName && agora_token && callee_agora_uid && (call_type === "audio" || call_type === "video")) {
        const extractedData = {
          callerId: caller_app_user_id, 
          callerName: caller_name || "Unknown Caller", 
          channelName: channelName,
          callType: call_type === "video" ? "video" : "voice", 
          calleeAgoraUid: callee_agora_uid, // This is THIS user's RTC UID for the call
          agoraToken: agora_token,        // This is THIS user's RTC token for the call
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
      apiAction = 'start'; // Or 'accepted' if your backend uses that
    } else if (action === 'rejected') {
      apiAction = 'end'; // Or 'rejected'
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
        callType: callType === 'video' ? 'video-call' : 'audio-call',
      };
      
      console.log('[FCM] Call status update payload:', JSON.stringify(payload, null, 2));
      const response = await ApiService.handleCall(payload);
      console.log('[FCM] Call status update response:', JSON.stringify(response, null, 2));
      
      if (action === 'accepted' && response && response.data && typeof response.data.callId === 'number') {
        return { callId: response.data.callId };
      }
      return response; 
    } catch (error) {
      console.error(`[FCM] Error updating call status to ${action}:`, error);
      return null;
    }
  },
};


// --- Placeholder for IncomingCallScreen component ---
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
  const {colors} = useTheme(); // Use theme for styling
  return (
    <View style={[styles.incomingCallOverlay, {backgroundColor: colors.backgroundOpac || 'rgba(0,0,0,0.8)'}]}>
      <Text style={[styles.incomingCallText, {color: colors.text.light || '#FFFFFF'}]}>Incoming {callType} call from:</Text>
      <Text style={[styles.incomingCallerName, {color: colors.text.light || '#FFFFFF'}]}>{callerName}</Text>
      <View style={styles.incomingCallButtons}>
        <TouchableOpacity style={[styles.acceptCallButton, {backgroundColor: colors.success || '#4CAF50'}]} onPress={onAccept}>
          <Icon name="phone" size={24} color={colors.white || '#FFFFFF'} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.rejectCallButton, {backgroundColor: colors.danger || '#F44336'}]} onPress={onReject}>
          <Icon name="phone-off" size={24} color={colors.white || '#FFFFFF'} />
        </TouchableOpacity>
      </View>
    </View>
  );
};
interface MeetingViewProps {
  channelName: string; 
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
  const remoteUsersRef = useRef<number[]>([]); // To manage remoteUsers in callbacks without causing re-renders

  useEffect(() => {
    const initRtc = async () => {
      console.log('[RTC] MeetingView: Initializing RTC Engine for call.');
      await rtcEngine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
      if (callType === 'video') {
         await rtcEngine.enableVideo();
      } else {
         await rtcEngine.disableVideo(); // Ensure video is off for voice calls
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
        // If not the caller and the last remote user leaves, end the call for the callee.
        // Caller usually ends the call explicitly or when the app is closed.
        if (remoteUsersRef.current.length === 0 && !isCaller) { 
            console.log('[RTC] MeetingView: Last remote user left, ending call for callee.');
            onEndCall(); 
        }
      });
      
      rtcEngine.addListener('onJoinChannelSuccess', (connection, elapsed) => { 
        console.log(`[RTC] MeetingView: Joined RTC channel ${connection.channelId} successfully as UID ${connection.localUid}`);
      });

      rtcEngine.addListener('onError', (err, msg) => { 
        console.error('[RTC] MeetingView: RTC Error Code:', err, 'Message:', msg);
        // Potentially end call on critical errors
        // onEndCall(); 
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
  }, [rtcEngine, channelName, localUid, token, callType, onEndCall, isCaller]); // Added isCaller

  return (
    <View style={styles.callOverlay}>
      <Text style={styles.callStatus}>In {callType} call...</Text>
      {callType === 'video' && (
        <>
          <RtcSurfaceView 
            style={styles.localVideo} 
            canvas={{uid: 0}} 
          />
          
          {remoteUsers.map(uid => (
            <RtcSurfaceView 
              key={uid} 
              style={styles.remoteVideo} 
              canvas={{uid: uid}} 
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
  const {colors: themeColors, isDarkMode: themeIsDarkMode} = useTheme(); 

  const [allContacts, setAllContacts] = useState<Contact[]>([]); // Stores all fetched contacts
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]); // Contacts to display
  
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false); 
  const [fetchUsersError, setFetchUsersError] = useState<string | null>(null);
  const [initialUsersLoadAttempted, setInitialUsersLoadAttempted] = useState<boolean>(false);
  const [isRtcEngineReady, setIsRtcEngineReady] = useState<boolean>(false);
  const rtcEngineRef = useRef<IRtcEngine | null>(null);
  const rtcInitializationAttempted = useRef<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  
  const [searchQuery, setSearchQuery] = useState<string>(''); // Updated by Header's onSearchQueryChange
  const [inCall, setInCall] = useState<boolean>(false);
  const [currentChannelName, setCurrentChannelName] = useState<string>('');
  const [currentRtcToken, setCurrentRtcToken] = useState<string>('');
  const [currentLocalRtcUid, setCurrentLocalRtcUid] = useState<number>(0);
  
  const [isCaller, setIsCaller] = useState<boolean>(false);
  const [currentCallType, setCurrentCallType] = useState<'voice' | 'video'>('voice');
  const [incomingCallData, setIncomingCallData] = useState<{
    callerName: string;
    callType: 'voice' | 'video';
    channelName: string;
    callerId: string; 
    calleeRtcUid?: string; 
    calleeRtcToken?: string;
    isFromNotification?: boolean;
  } | null>(null);

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

  const applyFilter = useCallback((query: string, contactsToFilter: Contact[]): Contact[] => {
    if (!query.trim()) {
      return contactsToFilter;
    }
    const lowerCaseQuery = query.toLowerCase();
    return contactsToFilter.filter(contact => 
      contact.name?.toLowerCase().includes(lowerCaseQuery)
    );
  }, []);

  const fetchUsers = useCallback(async (options: { pageNumArg?: number, appendArg?: boolean, apiSearchQuery?: string } = {}) => {
    const pageToFetch = options.pageNumArg ?? 1;
    const shouldAppend = options.appendArg ?? false;
    const apiQuery = options.apiSearchQuery !== undefined ? options.apiSearchQuery : ''; // API search query

    if (!user || !user.id) return;

    console.log(`[API] Fetching users. Page: ${pageToFetch}, Append: ${shouldAppend}, API Search: "${apiQuery}"`);
    setLoadingUsers(true);
    if (!shouldAppend) {
      setFetchUsersError(null);
      // Don't clear allContacts here if appending, only if it's a new API search or initial load
    }

    try {
      const payload: UserListRequest = {
        id: 0, page: pageToFetch, limit: 15, language: [], interest: [], user_id: null,
        search_by_name: apiQuery, // Use the API search query
        loggined_user_id: user.id, sortBy: {},
      };
      const response = await ApiService.getAllUsersList(payload);
      if (response.data && response.status) {
        const newContactsData: Contact[] = response.data.map((item: any) => ({
          id: item.id, name: item.name ?? null, emailId: item.emailId ?? null,
          is_available: item.is_available ?? false, dnd: item.dnd ?? false,
          updated_date: item.updated_date ?? '', last_active: item.last_active ?? null,
          languages: item.languages?.map((lang: any) => ({ id: lang.id, name: lang.name, isPrimary: lang.isPrimary ?? false })) ?? [],
          interests: item.interests?.map((int: any) => ({ id: int.id, name: int.name, isPrimary: int.isPrimary ?? false })) ?? [],
          product_count: item.product_count ?? 0, post_count: item.post_count ?? 0,
          is_following: item.is_following ?? 0, following_count: item.following_count ?? 0,
          followers_count: item.followers_count ?? 0, is_blocked: item.is_blocked ?? false,
          social_links: item.social_links ?? [], is_active: item.is_active ?? false,
          last_seen: item.last_seen ?? '', online_status: item.online_status ?? false,
        }));
        
        setAllContacts(prev => {
          const updatedAllContacts = shouldAppend ? [...prev, ...newContactsData] : newContactsData;
          // After updating allContacts, apply the current client-side searchQuery
          setFilteredContacts(applyFilter(searchQuery, updatedAllContacts));
          return updatedAllContacts;
        });

        setPage(response.pagination.page);
        setTotalRecords(response.pagination.totalRecords);
      } else {
        setFetchUsersError(response.message || 'Failed to fetch users.');
        if (!shouldAppend) {
            setAllContacts([]);
            setFilteredContacts([]);
        }
      }
    } catch (err: any) {
      setFetchUsersError(err.message || 'An error occurred while fetching users.');
      if (!shouldAppend) {
        setAllContacts([]);
        setFilteredContacts([]);
      }
    } finally {
      setLoadingUsers(false);
      if (pageToFetch === 1 && !shouldAppend) {
        setInitialUsersLoadAttempted(true);
      }
    }
  }, [user, applyFilter, searchQuery]); // searchQuery is needed to re-filter when allContacts changes

  // Effect for initial load
  useEffect(() => {
    if (user && user.id) {
      fetchUsers({ pageNumArg: 1, appendArg: false, apiSearchQuery: '' }); 
    }
  }, [user]); // Removed fetchUsers from deps, it's stable if its own deps are stable or handled.

  // Effect for client-side filtering when searchQuery changes
  useEffect(() => {
    setFilteredContacts(applyFilter(searchQuery, allContacts));
  }, [searchQuery, allContacts, applyFilter]);

  // After first user list load attempt, initialize RTC engine ONCE
  useEffect(() => {
    // Only run if users load was attempted, RTC not ready, and we haven't tried initializing yet
    if (initialUsersLoadAttempted && !isRtcEngineReady && !rtcInitializationAttempted.current) {
      console.log('[TipCallScreen] Starting RTC Engine initialization after user list fetch.');
      rtcInitializationAttempted.current = true; // Mark that we've started initialization
      
      const initRtcEngine = async () => {
        try {
          if (!rtcEngineRef.current) {
            console.log('[RTC] Creating RTC Engine instance...');
            const engine = createAgoraRtcEngine();
            rtcEngineRef.current = engine;
            
            const rtcContext = new RtcEngineContext(); 
            rtcContext.appId = APP_ID; 
            
            console.log('[RTC] Initializing RTC Engine...');
            await rtcEngineRef.current.initialize(rtcContext);
            
            setIsRtcEngineReady(true);
            console.log('[RTC] RTC Engine created and initialized successfully.');
          }
        } catch (e) {
          console.error('[RTC] Failed to create or initialize RTC Engine:', e);
          setIsRtcEngineReady(false);
          rtcInitializationAttempted.current = false; // Reset on failure to allow retry
          setFetchUsersError("Call services could not be initialized. Please try again later.");
        }
      };
      
      initRtcEngine();
    }
    
    // Cleanup function - only run on unmount
    return () => { 
      if (rtcEngineRef.current) {
        console.log('[RTC] Cleaning up RTC Engine on unmount');
        rtcEngineRef.current.release();
        rtcEngineRef.current = null;
      }
      setIsRtcEngineReady(false);
      rtcInitializationAttempted.current = false;
    };
  }, [initialUsersLoadAttempted]); // REMOVED isRtcEngineReady from dependencies

  // --- Call Handling Logic (startCallInternal, acceptIncomingCall, rejectIncomingCall, endCall) ---
  const startCallInternal = async (contact: Contact, callTypeToStart: 'voice' | 'video') => {
    if (!user || !user.id) {
      Alert.alert('Login Required', 'Please login to make calls.');
      return;
    }
    // Removed RTM readiness check
    if (!isRtcEngineReady || !rtcEngineRef.current) {
      Alert.alert('RTC Error', 'Call engine not ready. Please wait or try again.');
      return;
    }
    
    if (inCall || incomingCallData) {
      Alert.alert('Busy', 'You are already in a call or receiving one.');
      return;
    }

    const permissionsGranted = await requestPermissions(callTypeToStart);
    if (!permissionsGranted) return;

    setIsCaller(true);
    setCurrentCallType(callTypeToStart);

    try {
      const callerRtcAuthDetails = await fetchAgoraRtcTokenForCaller(user.id); 
      
      console.log(`[Signal] Initiating ${callTypeToStart} call to ${contact.id.toString()} via notification.`);
      console.log(`[Signal] Caller RTC Details: Channel=${callerRtcAuthDetails.channelName}, CallerRTCUid=${callerRtcAuthDetails.uid}`);      
      // Notify recipient via your push notification service
      await notifyRecipient(
        contact.id, // Recipient's app user ID
        callerRtcAuthDetails.channelName,
        callTypeToStart,
        user.id.toString(), // Caller's app user ID
        user.name || `User ${user.id}`, // Caller's display name
        callerRtcAuthDetails.uid, // Caller's RTC UID
        callerRtcAuthDetails.token // Caller's RTC Token
      );
      
      console.log('[Signal] Call notification sent.');
      
      setCurrentChannelName(callerRtcAuthDetails.channelName);
      setCurrentRtcToken(callerRtcAuthDetails.token); 
      setCurrentLocalRtcUid(callerRtcAuthDetails.uid); 
      setInCall(true); 

    } catch (error: any) {
      console.error('[Signal/RTC] Failed to start call:', error);
      Alert.alert('Call Failed', error.message || 'Could not initiate the call.');
      setIsCaller(false);
      setInCall(false); 
    }
  };

  const acceptIncomingCall = async () => {
    if (!incomingCallData || !rtcEngineRef.current || !isRtcEngineReady || !user || !user.id) {
      Alert.alert("Error", "Cannot accept call. Services not ready or invitation data missing.");
      setIncomingCallData(null);
      return;
    }
    
    const { callType, channelName, callerId, calleeRtcUid, calleeRtcToken, isFromNotification } = incomingCallData;

    const permissionsGranted = await requestPermissions(callType);
    if (!permissionsGranted) {
      if (isFromNotification) { // Always true now as RTM is removed
        await NotificationService.updateCallStatus(
            callerId, // Original caller's app user ID
            user.id.toString(),
            'rejected',
            callType === 'voice' ? 'audio' : callType
        );
      }
      setIncomingCallData(null);
      return;
    }

    try {
      let finalRtcToken = calleeRtcToken;
      let finalRtcUid = calleeRtcUid ? parseInt(calleeRtcUid, 10) : 0;

      // If token/UID for callee wasn't in notification, fetch it.
      if (!finalRtcToken || !finalRtcUid) {
        console.log(`[RTC] Callee (AppUID: ${user.id}) accepting call for channel: ${channelName}. Fetching callee's RTC token/UID.`);
        const calleeRtcAuthDetails = await fetchAgoraRtcTokenForCallee(user.id, channelName);
        if (!calleeRtcAuthDetails || !calleeRtcAuthDetails.token || !calleeRtcAuthDetails.uid) {
          throw new Error("Failed to fetch callee's RTC token.");
        }
        finalRtcToken = calleeRtcAuthDetails.token;
        finalRtcUid = calleeRtcAuthDetails.uid;
        console.log(`[RTC] Callee RTC Details: UID=${finalRtcUid}, Token=${finalRtcToken.substring(0,10)}...`);
      } else {
        console.log(`[RTC] Callee using RTC details from notification: UID=${finalRtcUid}, Token=${finalRtcToken.substring(0,10)}...`);
      }


      if (isFromNotification) { // This will always be the case now
        console.log('[Signal] Accepting call from notification. Updating backend status.');
         await NotificationService.updateCallStatus(
            callerId, // Original caller's app user ID
            user.id.toString(),
            'accepted',
            callType === 'voice' ? 'audio' : callType
        );
      } else {
        // This 'else' branch is unlikely to be hit if RTM is fully removed.
        console.warn("Accepting call but not marked as from notification - this path should be reviewed.");
      }

      setIsCaller(false);
      setCurrentCallType(callType);
      setCurrentChannelName(channelName); 
      setCurrentRtcToken(finalRtcToken); 
      setCurrentLocalRtcUid(finalRtcUid); 
      setInCall(true);
      setIncomingCallData(null);

    } catch (error: any) {
      console.error('[RTC/Signal] Failed to accept call:', error);
      Alert.alert('Accept Failed', error.message || 'Could not accept the call.');
      setIncomingCallData(null); 
    }
  };
  
  const rejectIncomingCall = async () => {
    if (!incomingCallData || !user || !user.id) { 
        console.warn('[CALL] Cannot reject call. Invitation data missing or user not available.');
        setIncomingCallData(null); 
        return;
    }
    
    const { isFromNotification, callerId, callType } = incomingCallData;

    try {
      if (isFromNotification) { // This will always be the case
        console.log('[Signal] Rejecting call from notification. Updating backend status.');
        await NotificationService.updateCallStatus(
          callerId, // Original caller's app user ID
          user.id.toString(), 
          'rejected',
          callType === 'voice' ? 'audio' : callType 
        );
      } else {
         console.warn('[CALL] Rejecting call but not marked as from notification.');
      }
    } catch (error: any) {
      console.error('[CALL] Failed to reject call:', error);
    } finally {
      setIncomingCallData(null);
    }
  };

  const endCall = useCallback(async () => {
    console.log('[CALL] Ending call...');
    // Removed RTM outgoing invitation cancellation
    
    if (rtcEngineRef.current) {
      await AgoraHelper.safeLeaveChannel(rtcEngineRef.current);
      console.log('[RTC] Left RTC channel.');
    }
    
    setInCall(false);
    setCurrentChannelName('');
    setCurrentRtcToken('');
    setIsCaller(false);
    setIncomingCallData(null); 
  }, [isCaller]); // Removed outgoingInvitationDetails, rtmHelperRef

  const startVoiceCall = useCallback((contact: Contact) => {
    startCallInternal(contact, 'voice');
  }, [startCallInternal]);

  const startVideoCall = useCallback((contact: Contact) => {
    startCallInternal(contact, 'video');
  }, [startCallInternal]);


  const loadMoreUsers = useCallback(() => {
    if (loadingUsers || allContacts.length >= totalRecords) return;
    // When paginating, we fetch with an empty API search query, 
    // the dynamic filter will apply to the combined list.
    fetchUsers({ pageNumArg: page + 1, appendArg: true, apiSearchQuery: '' }); 
  }, [loadingUsers, allContacts.length, totalRecords, page, fetchUsers]); 

  const renderContactItem = useCallback(({item}: {item: Contact}) => (
    <View style={[styles.contactItem, { backgroundColor: themeColors.card, borderBottomColor: themeColors.borderLight }]}>
      <View style={styles.contactInfo}>
        <View style={[styles.avatarPlaceholder, {backgroundColor: themeColors.primary || localFallbackColors.primary}]}>
            <Text style={styles.avatarText}>
                {item.name ? item.name.substring(0, 1).toUpperCase() : 'U'}
            </Text>
        </View>
        <View>
            <Text style={[styles.contactName, {color: themeColors.text?.primary || localFallbackColors.text.primary}]}>{item.name || 'Unknown User'}</Text>
            <Text style={[styles.contactStatus, {color: themeColors.text?.secondary || localFallbackColors.text.secondary}]}>
            {item.online_status ? 'Online' : `Last seen: ${item.last_seen || 'recently'}`}
            </Text>
        </View>
      </View>
      <View style={styles.callButtons}>
        <TouchableOpacity style={[styles.callButton, {backgroundColor: themeColors.primary || localFallbackColors.primary}]} onPress={() => startVoiceCall(item)}>
          <Icon name="phone" size={18} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.callButton, {backgroundColor: themeColors.primary || localFallbackColors.primary, marginLeft: 10}]} onPress={() => startVideoCall(item)}>
          <Icon name="video" size={18} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  ), [themeColors, startVoiceCall, startVideoCall, localFallbackColors]);


  const renderContactListSkeleton = () => (
    <ScrollView
      style={[styles.contactsContainer, { backgroundColor: themeColors.background }]}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}
      showsVerticalScrollIndicator={false}
    >
      {Array(7).fill(0).map((_, index) => ( 
        <ContactSkeletonItem key={`contact-skel-${index}`} />
      ))}
    </ScrollView>
  );

  // Step 1: Determine if the Skeleton View should be shown.
  const showSkeletonView =
    !inCall && !incomingCallData && 
    ( 
      !user || !user.id || 
      !isRtcEngineReady || 
      (loadingUsers && filteredContacts.length === 0 && !fetchUsersError && !initialUsersLoadAttempted) // Adjusted condition
    ) && !fetchUsersError; 

  // Handler for Header dynamic search query changes
  const handleHeaderQueryChange = useCallback((query: string) => {
    setSearchQuery(query); // This will trigger the useEffect for filtering
  }, []);

  // Handler for Header search explicit submit (optional, could trigger API search)
  const handleHeaderSearchAPISubmit = useCallback((query: string) => {
    console.log('[TipCallScreen] Header API search submitted with query:', query);
    setSearchQuery(query); // Update client-side query as well
    // Fetch users with the new query from API, resetting to page 1
    fetchUsers({ apiSearchQuery: query, pageNumArg: 1, appendArg: false });
  }, [fetchUsers]);


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
    <View style={[styles.container, {paddingBottom: contentPaddingBottom, backgroundColor: themeColors.background}]}>
      <StatusBar barStyle={themeIsDarkMode ? 'light-content' : 'dark-content'} backgroundColor={themeColors.background} />
      
      <Header 
        title="TipCall" 
        showWallet={false}
        showNotifications={false}
        showSearch={true}
        onSearchQueryChange={handleHeaderQueryChange} // For dynamic filtering
        onSearchSubmit={handleHeaderSearchAPISubmit} // For explicit API search on submit
      />

      {showSkeletonView ? (
        renderContactListSkeleton()
      ) : fetchUsersError ? (
        <View style={[styles.errorContainerFeedback, {backgroundColor: themeColors.errorBackground || localFallbackColors.errorBackground}]}>
          <Text style={[styles.errorTextFeedback, {color: themeColors.errorText || localFallbackColors.errorText}]}>{fetchUsersError}</Text>
          {!fetchUsersError.includes("Call services could not be initialized") &&
            <TouchableOpacity onPress={() => fetchUsers({ apiSearchQuery: searchQuery, pageNumArg: 1, appendArg: false })} style={[styles.retryButtonFeedback, {borderColor: themeColors.primary || localFallbackColors.primary}]}>
              <Text style={[styles.retryButtonTextFeedback, {color: themeColors.primary || localFallbackColors.primary}]}>Retry</Text>
            </TouchableOpacity>
          }
        </View>
      ) : !loadingUsers && filteredContacts.length === 0 && initialUsersLoadAttempted ? (
        <View style={styles.emptyContainer}>
          <Icon name="users" size={40} color={themeColors.text?.tertiary || localFallbackColors.text.tertiary} />
          <Text style={[styles.emptyText, {color: themeColors.text?.secondary || localFallbackColors.text.secondary}]}>
            {searchQuery ? `No contacts found for "${searchQuery}".` : "No contacts found."}
          </Text>
          {searchQuery ? <Text style={[styles.emptyText, {fontSize: 14, color: themeColors.text?.tertiary || localFallbackColors.text.tertiary}]}>Try a different search.</Text> : null}
        </View>
      ) : (
        <FlatList
          data={filteredContacts} // <<< USE filteredContacts
          renderItem={renderContactItem}
          keyExtractor={(item: Contact) => item.id.toString()}
          style={[styles.contactsContainer, { backgroundColor: themeColors.background }]} 
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: contentPaddingBottom + 16 }} 
          ListEmptyComponent={null} // Already handled by the logic above
          onEndReached={loadMoreUsers}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingUsers && filteredContacts.length > 0 ? <ActivityIndicator size="small" color={themeColors.primary || localFallbackColors.primary} style={{ marginVertical: 20 }}/> : null}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={21}
          removeClippedSubviews={Platform.OS === 'android'}
        />
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Styles for the independent search bar (searchContainer, searchBar, etc.) should have been removed previously.
  // If not, they can be removed now.
  contactsContainer: { flex: 1 },
  contactItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 0, 
    borderBottomWidth: 1,
  },
  contactInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  avatarPlaceholder: { 
    width: 48, height: 48, borderRadius: 24, marginRight: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: 'white', fontSize: 18, fontWeight: 'bold'},
  contactName: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  contactStatus: { fontSize: 13 },
  callButtons: { flexDirection: 'row', marginLeft: 16 },
  callButton: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  callOverlay: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.9)' 
  },
  callStatus: { 
    fontSize: 18, 
    color: 'white', 
    marginBottom: 20 
  },
  endCallButton: { 
    marginTop: 30, 
    paddingVertical: 12, 
    paddingHorizontal: 30, 
    backgroundColor: 'red', 
    borderRadius: 25 
  },
  endCallText: { 
    color: 'white', 
    fontSize: 16 
  },
  localVideo: { 
    width: 120, 
    height: 180, 
    position: 'absolute', 
    top: 40, 
    right: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  remoteVideo: { 
    width: '100%', 
    height: '100%', 
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: -1, 
  },
  incomingCallOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000, 
  },
  incomingCallText: {
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  incomingCallerName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
  },
  incomingCallButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
  },
  acceptCallButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectCallButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainerFeedback: { 
    padding: 16, borderRadius: 8, marginHorizontal: 16, marginVertical: 16,
    alignItems: 'center',
  },
  errorTextFeedback: { 
    fontSize: 14, textAlign: 'center', marginBottom: 12,
  },
  retryButtonFeedback: { 
    paddingVertical: 10, paddingHorizontal: 24, borderRadius: 20, borderWidth: 1,
  },
  retryButtonTextFeedback: { 
    fontSize: 14, fontWeight: '600',
  },
  emptyContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 20, marginTop: 50,
  },
  emptyText: { fontSize: 16, textAlign: 'center', marginBottom: 8 },
});

export default TipCallScreen;