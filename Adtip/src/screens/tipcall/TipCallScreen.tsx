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
} from 'react-native';
import {
  Search,
  Phone,
  Video,
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
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import ApiService from '../../services/ApiService';

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

const APP_ID = 'ef5fbd2647c64582a64db9e47b9f9335';
// const BASE_URL = 'https://api.adtip.in'; // Not directly used in this component after ApiService integration

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
const fetchAgoraToken = async (channelName: string, uid: number): Promise<string> => {
  try {
    console.log(`Fetching Agora token for channel: ${channelName}, uid: ${uid}`);
    const response = await ApiService.getAgoraToken({
      channelName,
      uid,
    });

    if (response.status && response.data?.token) {
      console.log('Successfully received Agora token');
      return response.data.token;
    }
    throw new Error(response.message || 'Failed to fetch token');
  } catch (error) {
    console.error('Error fetching Agora token:', error);
    throw new Error('Failed to get Agora token');
  }
};

// Notify recipient of incoming call using ApiService
const notifyRecipient = async (
  recipientId: number,
  channelId: string,
  callType: 'voice' | 'video',
  userId: string | undefined,
) => {
  if (!userId) {
    console.warn('No authenticated user for notification');
    return;
  }
  try {
    await ApiService.handleCall({
      callerId: userId,
      receiverId: recipientId.toString(),
      action: 'start',
      callType: callType === 'video' ? 'video-call' : 'audio-call',
    });
    console.log(`${callType} call notification sent to recipient ID ${recipientId}`);
  } catch (error) {
    console.error('Error notifying recipient:', error);
  }
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
  const remoteVideoCanvas = useRef<View>(null);
  const localVideoCanvas = useRef<View>(null);

  useEffect(() => {
    if (!engine) return;

    // Handle no response after 30 seconds for the caller
    let timeoutId: NodeJS.Timeout | null = null;
    if (isCaller) {
      timeoutId = setTimeout(() => {
        if (remoteUsers.length === 0) {
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
            }).catch(err => console.error('Error sending missed call notification:', err));
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
      setRemoteUsers(prev => [...new Set([...prev, remoteUid])]);
      if (callType === 'video') {
        engine.setupRemoteVideo({
          uid: remoteUid,
          view: remoteVideoCanvas.current,
          renderMode: RenderModeType.RenderModeHidden,
        });
      }
    };

    const onUserOffline = (connection: RtcConnection, remoteUid: number) => {
      console.log(`User ${remoteUid} left channel ${connection.channelId}`);
      setRemoteUsers(prev => prev.filter(uid => uid !== remoteUid));
      if (remoteUsers.length === 1 && remoteUsers[0] === remoteUid) {
        // If the only other user leaves, end the call
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

    // Setup local video view if it's a video call
    if (callType === 'video') {
      engine.setupLocalVideo({
        view: localVideoCanvas.current,
        renderMode: RenderModeType.RenderModeHidden,
      });
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      engine.removeListener('onUserJoined', onUserJoined);
      engine.removeListener('onUserOffline', onUserOffline);
      engine.removeListener('onError', onError);
    };
  }, [engine, remoteUsers, onEndCall, isCaller, meetingId, user, callType]);

  return (
    <View style={styles.callOverlay}>
      {callType === 'video' && (
        <>
          <VideoCanvas style={styles.remoteVideo} ref={remoteVideoCanvas} zOrderMediaOverlay={true} />
          <VideoCanvas style={styles.localVideo} ref={localVideoCanvas} zOrderMediaOverlay={true} />
        </>
      )}

      <Text style={styles.callStatus}>In Call: {meetingId}</Text>
      <Text style={styles.callStatus}>
        {remoteUsers.length > 0
          ? `${remoteUsers.length} user(s) connected`
          : 'Waiting for others...'}
      </Text>
      <TouchableOpacity style={styles.endCallButton} onPress={onEndCall}>
        <Text style={styles.endCallText}>End Call</Text>
      </TouchableOpacity>
    </View>
  );
};

const TipCallScreen: React.FC = () => {
  const {user} = useAuth();
  const navigation = useNavigation<NavigationProp>();
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
  const localUid = useRef<number>(0); // Store the local user ID for Agora

  const redirectToLogin = () => {
    Alert.alert('Authentication Required', 'Please log in to continue.', [
      {text: 'OK', onPress: () => navigation.navigate('Login')},
    ]);
  };

  // Request permissions for audio and video
  const requestPermissions = async (callType: 'voice' | 'video') => {
    if (Platform.OS === 'android') {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ...(callType === 'video' ? [PermissionsAndroid.PERMISSIONS.CAMERA] : []),
      ];
      try {
        const granted = await PermissionsAndroid.requestMultiple(permissions);
        const allGranted = permissions.every(
          perm => granted[perm] === PermissionsAndroid.results.GRANTED,
        );
        if (!allGranted) {
          Alert.alert('Permissions Required', 'Audio and Camera permissions are needed for calls.');
          return false;
        }
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

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
          loggined_user_id: parseInt(user.id, 10),
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
    [selectedCategory, selectedLanguage, searchQuery, user, navigation],
  );

  useEffect(() => {
    fetchUsers(1, false);
  }, [fetchUsers]);

  const loadMoreUsers = () => {
    if (loading || contacts.length >= totalRecords) return;
    fetchUsers(page + 1, true);
  };

  useEffect(() => {
    const initAgora = async () => {
      try {
        if (!APP_ID) {
          Alert.alert('Error', 'Agora APP_ID is not configured.');
          return;
        }

        const engine = createAgoraRtcEngine();
        await engine.initialize({appId: APP_ID});

        // Set channel profile to communication for one-to-one calls
        await engine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
        await engine.setClientRole(ClientRoleType.ClientRoleBroadcaster); // Broadcaster role for calling

        // Agora event handlers
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
          setCurrentCallType('voice'); // Reset call type on error
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
      // Clean up Agora engine when component unmounts
      if (rtcEngine) {
        try {
          rtcEngine.leaveChannel();
          rtcEngine.release();
          console.log('Agora engine released.');
        } catch (e) {
          console.error('Error releasing Agora engine:', e);
        }
      }
    };
  }, []);

  const startVoiceCall = async (contactId: number) => {
    if (!rtcEngine) {
      Alert.alert('Error', 'Call engine not initialized.');
      return;
    }
    if (inCall) {
      Alert.alert('Error', 'You are already in a call.');
      return;
    }
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated.');
      redirectToLogin();
      return;
    }

    const hasPermissions = await requestPermissions('voice');
    if (!hasPermissions) return;

    try {
      // Ensure audio is enabled and video is disabled for voice call
      await rtcEngine.enableAudio();
      await rtcEngine.disableVideo();

      const newMeetingId = `voice_${user.id}_${contactId}_${Date.now()}`; // Unique channel for each call, include caller and recipient ID
      const uid = Math.floor(Math.random() * 100000); // Generate a random UID for the caller
      localUid.current = uid;
      const token = await fetchAgoraToken(newMeetingId, uid);

      // Join the channel
      await rtcEngine.joinChannel(token, newMeetingId, '', uid);

      setMeetingId(newMeetingId);
      setIsCaller(true);
      setCurrentCallType('voice');
      await notifyRecipient(contactId, newMeetingId, 'voice', user.id);

      console.log(`Voice call started with contact ID ${contactId}`);
    } catch (error: any) {
      console.error('Error starting voice call:', error);
      Alert.alert('Error', `Failed to start voice call: ${error.message}`);
      setInCall(false); // Ensure call state is reset on error
      setMeetingId('');
      setIsCaller(false);
      setCurrentCallType('voice');
    }
  };

  const startVideoCall = async (contactId: number) => {
    if (!rtcEngine) {
      Alert.alert('Error', 'Call engine not initialized.');
      return;
    }
    if (inCall) {
      Alert.alert('Error', 'You are already in a call.');
      return;
    }
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated.');
      redirectToLogin();
      return;
    }

    const hasPermissions = await requestPermissions('video');
    if (!hasPermissions) return;

    try {
      // Enable video for video call
      await rtcEngine.enableVideo();
      await rtcEngine.startPreview(); // Start local video preview

      const newMeetingId = `video_${user.id}_${contactId}_${Date.now()}`; // Unique channel, include caller and recipient ID
      const uid = Math.floor(Math.random() * 100000); // Generate a random UID for the caller
      localUid.current = uid;
      const token = await fetchAgoraToken(newMeetingId, uid);

      // Join the channel
      await rtcEngine.joinChannel(token, newMeetingId, '', uid);

      setMeetingId(newMeetingId);
      setIsCaller(true);
      setCurrentCallType('video');
      await notifyRecipient(contactId, newMeetingId, 'video', user.id);

      console.log(`Video call started with contact ID ${contactId}`);
    } catch (error: any) {
      console.error('Error starting video call:', error);
      Alert.alert('Error', `Failed to start video call: ${error.message}`);
      setInCall(false); // Ensure call state is reset on error
      setMeetingId('');
      setIsCaller(false);
      setCurrentCallType('voice');
    }
  };

  const endCall = async () => {
    if (rtcEngine) {
      try {
        // Get the contact ID from the meeting ID (format: 'type_callerId_contactId_timestamp')
        const parts = meetingId.split('_');
        const isVideo = parts[0] === 'video';
        const callerIdFromMeetingId = parts[1];
        const recipientIdFromMeetingId = parts[2];

        // Determine which ID is the recipient based on whether current user is caller
        const recipientId = isCaller ? recipientIdFromMeetingId : callerIdFromMeetingId;
        const callerId = isCaller ? user?.id : callerIdFromMeetingId;

        // Leave the channel
        await rtcEngine.stopPreview(); // Stop local video preview
        await rtcEngine.leaveChannel();
        setInCall(false);

        // Notify the API that the call has ended
        if (recipientId && callerId) {
          await ApiService.handleCall({
            callerId: callerId,
            receiverId: recipientId,
            action: 'end',
            callType: isVideo ? 'video-call' : 'audio-call',
            callId: parseInt(parts[3] || '0', 10), // Use timestamp as call ID
          });
          console.log(`Call with ${recipientId} ended`);
        }

        setMeetingId('');
        setIsCaller(false);
        setCurrentCallType('voice'); // Reset call type after call ends
      } catch (error) {
        console.error('Error leaving call:', error);
        Alert.alert('Error', 'Failed to end call.');
      }
    }
  };

  const updateFcmToken = async (fcmToken: string) => {
    if (!user?.id) return;

    try {
      await ApiService.updateFcmToken({
        userId: user.id,
        fcmToken: fcmToken
      });
      console.log('FCM token updated successfully');
    } catch (error) {
      console.error('Error updating FCM token:', error);
    }
  };

  const fetchMissedCalls = async () => {
    if (!user?.id) return;

    try {
      const response = await ApiService.getMissedCalls(user.id);
      if (response.status && response.data) {
        console.log('Missed calls:', response.data.calls);
        // You could set state and display them in the UI
      }
    } catch (error) {
      console.error('Error fetching missed calls:', error);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchMissedCalls();
    }
  }, [user]);

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

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search user"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={text => setSearchQuery(text)}
          />
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={() => fetchUsers(1, false)}
            style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

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

      <View style={styles.tabsContainer}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, selectedTab === tab.id && styles.selectedTab]}
            onPress={() => setSelectedTab(tab.id)}>
            <Text
              style={[
                styles.tabText,
                selectedTab === tab.id && styles.selectedTabText,
              ]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.contactsContainer}
        onScroll={({nativeEvent}) => {
          if (
            nativeEvent.contentOffset.y +
              nativeEvent.layoutMeasurement.height >=
            nativeEvent.contentSize.height - 20
          ) {
            loadMoreUsers();
          }
        }}
        scrollEventThrottle={400}>
        {contacts.map(contact => (
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
        ))}
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#24d05a',
  },
  tabText: {
    fontSize: 14,
    color: '#64748b',
  },
  selectedTabText: {
    color: '#24d05a',
    fontWeight: '600',
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
    zIndex: 1000, // Ensure the call overlay is on top
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
    height: 80,
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
  // Styles for video streams
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
});

export default TipCallScreen;