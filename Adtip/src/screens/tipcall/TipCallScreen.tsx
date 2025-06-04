import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Search,
  Wallet,
  User as UserIcon,
  Phone,
  Video,
} from 'lucide-react-native';
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcConnection,
  IRtcEngine,
} from 'react-native-agora';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAuth} from '../../contexts/AuthContext';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

// Define navigation stack param list
type RootStackParamList = {
  TipCall: undefined;
  Login: undefined;
  Profile: undefined;
};

// Define navigation prop type
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Define interfaces for API response and data
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
const BASE_URL = 'https://api.adtip.in';

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

// Retrieve token from AsyncStorage
const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    return token || '';
  } catch (error) {
    console.error('Error retrieving auth token:', error);
    return '';
  }
};

// Fetch Agora token from server
const fetchAgoraToken = async (channelName: string, uid: number) => {
  try {
    const response = await fetch(`${BASE_URL}/api/agora/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await getAuthToken()}`,
      },
      body: JSON.stringify({channelName, uid}),
    });
    const result = await response.json();
    if (result.status) {
      return result.data.token;
    }
    throw new Error(result.message || 'Failed to fetch token');
  } catch (error) {
    console.error('Error fetching Agora token:', error);
    throw error;
  }
};

// Notify recipient of incoming call
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
    const token = await getAuthToken();
    await fetch(`${BASE_URL}/api/call/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        recipientId,
        channelId,
        callType,
        callerId: parseInt(userId, 10),
      }),
    });
  } catch (error) {
    console.error('Error notifying recipient:', error);
  }
};

// Define event handler types based on Agora documentation
interface RtcEngineEventHandlers {
  onUserJoined: (connection: RtcConnection, remoteUid: number) => void;
  onUserOffline: (connection: RtcConnection, remoteUid: number) => void;
  onError: (err: number, msg: string) => void;
  onJoinChannelSuccess: (connection: RtcConnection, elapsed: number) => void;
}

interface MeetingViewProps {
  meetingId: string;
  engine: IRtcEngine;
  onEndCall: () => void;
}

const MeetingView: React.FC<MeetingViewProps> = ({
  meetingId,
  engine,
  onEndCall,
}) => {
  const [remoteUsers, setRemoteUsers] = useState<number[]>([]);

  useEffect(() => {
    if (!engine) return;

    const timeoutId = setTimeout(() => {
      if (remoteUsers.length === 0) {
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

    const eventHandlers: RtcEngineEventHandlers = {
      onUserJoined: (connection: RtcConnection, remoteUid: number) => {
        console.log(`User ${remoteUid} joined channel ${connection.channelId}`);
        setRemoteUsers(prev => [...new Set([...prev, remoteUid])]);
      },
      onUserOffline: (connection: RtcConnection, remoteUid: number) => {
        console.log(`User ${remoteUid} left channel ${connection.channelId}`);
        setRemoteUsers(prev => prev.filter(uid => uid !== remoteUid));
      },
      onError: (err: number, msg: string) => {
        console.error('Agora Error:', err, msg);
        Alert.alert('Call Error', `Error code: ${err}, ${msg}`);
      },
      onJoinChannelSuccess: () => {},
    };

    engine.addListener('onUserJoined', eventHandlers.onUserJoined);
    engine.addListener('onUserOffline', eventHandlers.onUserOffline);
    engine.addListener('onError', eventHandlers.onError);

    return () => {
      clearTimeout(timeoutId);
      engine.removeListener('onUserJoined', eventHandlers.onUserJoined);
      engine.removeListener('onUserOffline', eventHandlers.onUserOffline);
      engine.removeListener('onError', eventHandlers.onError);
    };
  }, [engine, remoteUsers, onEndCall]);

  return (
    <View style={styles.callOverlay}>
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

  const redirectToLogin = () => {
    Alert.alert('Authentication Required', 'Please log in to continue.', [
      {text: 'OK', onPress: () => navigation.navigate('Login')},
    ]);
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

      const token = await getAuthToken();
      if (!token) {
        setError('Authentication required. Please log in.');
        setLoading(false);
        redirectToLogin();
        return;
      }

      try {
        const endpoint = `${BASE_URL}/api/users`;
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

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `HTTP error! status: ${response.status}, message: ${errorText}`,
          );
        }

        const result: ApiResponse = await response.json();
        if (result.status) {
          setContacts(prev =>
            append ? [...prev, ...result.data] : result.data,
          );
          setTotalRecords(result.pagination.totalRecords);
          setPage(result.pagination.page);
        } else {
          throw new Error(
            result.error || result.message || 'Failed to fetch users',
          );
        }
      } catch (error: any) {
        console.error('Error fetching users:', error.message);
        if (error.message.includes('Failed to authenticate token')) {
          setError('Invalid or expired session. Please log in again.');
          redirectToLogin();
        } else {
          setError(`Failed to load users: ${error.message}`);
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
        const engine = createAgoraRtcEngine();
        await engine.initialize({appId: APP_ID});
        await engine.enableAudio();
        await engine.setChannelProfile(
          ChannelProfileType.ChannelProfileCommunication,
        );
        await engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);

        const eventHandlers: RtcEngineEventHandlers = {
          onJoinChannelSuccess: (
            connection: RtcConnection,
            elapsed: number,
          ) => {
            console.log(
              `Joined channel ${connection.channelId} in ${elapsed}ms`,
            );
            setInCall(true);
          },
          onError: (err: number, msg: string) => {
            console.error('Agora Error:', err, msg);
            Alert.alert('Call Error', `Error code: ${err}, ${msg}`);
            setInCall(false);
            setMeetingId('');
          },
          onUserJoined: () => {},
          onUserOffline: () => {},
        };

        engine.addListener(
          'onJoinChannelSuccess',
          eventHandlers.onJoinChannelSuccess,
        );
        engine.addListener('onError', eventHandlers.onError);

        setRtcEngine(engine);
      } catch (error) {
        console.error('Error initializing Agora:', error);
        Alert.alert('Error', 'Failed to initialize call engine.');
      }
    };

    initAgora();

    return () => {
      if (rtcEngine) {
        rtcEngine.leaveChannel();
        rtcEngine.release();
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

    try {
      const newMeetingId = `voice_${contactId}_${Date.now()}`;
      const token = await fetchAgoraToken(newMeetingId, 0);
      await rtcEngine.disableVideo();
      await rtcEngine.joinChannel(token, newMeetingId, '', 0);
      setMeetingId(newMeetingId);
      await notifyRecipient(contactId, newMeetingId, 'voice', user?.id);
    } catch (error: any) {
      console.error('Error starting voice call:', error);
      Alert.alert('Error', `Failed to start voice call: ${error.message}`);
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

    try {
      const newMeetingId = `video_${contactId}_${Date.now()}`;
      const token = await fetchAgoraToken(newMeetingId, 0);
      await rtcEngine.enableVideo();
      await rtcEngine.joinChannel(token, newMeetingId, '', 0);
      setMeetingId(newMeetingId);
      await notifyRecipient(contactId, newMeetingId, 'video', user?.id);
    } catch (error: any) {
      console.error('Error starting video call:', error);
      Alert.alert('Error', `Failed to start video call: ${error.message}`);
    }
  };

  const endCall = async () => {
    if (rtcEngine) {
      try {
        await rtcEngine.leaveChannel();
        setInCall(false);
        setMeetingId('');
      } catch (error) {
        console.error('Error leaving call:', error);
        Alert.alert('Error', 'Failed to end call.');
      }
    }
  };

  if (loading && !contacts.length) {
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
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <UserIcon size={18} color="white" />
          </View>
          <Text style={styles.title}>Tip Call</Text>
          <View style={styles.toggle}>
            <View style={styles.toggleButton} />
          </View>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.walletChip}>
            <Wallet size={16} color="#24d05a" />
            <Text style={styles.walletAmount}>₹ 204.79</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}>
            <UserIcon size={20} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

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
                onPress={() => startVoiceCall(contact.id)}>
                <Phone size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => startVideoCall(contact.id)}>
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

      {inCall && (
        <MeetingView
          meetingId={meetingId}
          engine={rtcEngine!}
          onEndCall={endCall}
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
});

export default TipCallScreen;
