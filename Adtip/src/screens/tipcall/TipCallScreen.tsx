import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Alert,
  StatusBar,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTabNavigator } from '../../contexts/TabNavigatorContext';
import Header from '../../components/common/Header';
import ScreenTransition from '../../components/common/ScreenTransition'; // ADD THIS IMPORT
import {
  useMeeting,
  useParticipant,
  MeetingProvider,
  MediaStream,
  usePubSub,
  Constants,
} from '@videosdk.live/react-native-sdk';
import ContactSkeletonItem from '../../components/skeletons/ContactSkeletonItem';
import { UserListRequest } from '../../types/api';
import ApiService from '../../services/ApiService';
import Icon from 'react-native-vector-icons/Feather';
import messaging from '@react-native-firebase/messaging';
import {
  initiateVideoSDKCall,
} from '../../helpers/CallHelper';

// Import the separated styles
import { styles as importedStyles, localFallbackColors } from './TipCallScreenStyles';
import CallKeepService from '../../services/CallKeepService';
import { v4 as uuidv4 } from 'react-native-uuid';

// Define navigation stack param list
type RootStackParamList = {
  TipCall: { initialCallNotificationData?: any } | undefined;
  Login: undefined;
  Profile: { userId: number };
  Call: { // This 'Call' route might be deprecated or renamed if 'Meeting' replaces it
    meetingId: string;
    callerId?: string | number;
    callerName?: string;
    callType: 'voice' | 'video';
    videosdkToken?: string | null;
    isCaller?: boolean;
  };
  Meeting: { // New Route for the actual meeting screen
    meetingId: string;
    token: string; // Participant's token
    callType: 'voice' | 'video';
    displayName: string;
    isInitiator?: boolean;
    recipientName?: string;
  };
};

// Define navigation prop type
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Add this missing type definition
type TipCallScreenRouteProp = RouteProp<RootStackParamList, 'TipCall'>;

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

interface UserListApiResponse {
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

// Constants for filters
const LANGUAGES: Language[] = [
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

// Define the type for call request payloads
export type VideoSDKCallRequest = {
  callerId: string;
  receiverId: string;
  action: 'start' | 'end' | 'missed-video-call' | 'missed-audio-call';
  callType: 'audio-call' | 'video-call';
  meetingId?: string;
  customData?: {
    videosdk_token?: string;
    caller_name?: string;
  }
};

// NotificationService for handling FCM notifications
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
      } else if (Platform.OS === 'android') {
        // For Android 13+
        if (Platform.Version >= 33) {
          const status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
          if (status !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert("Permissions Denied", "Cannot receive call notifications without permission.");
          }
        }
        console.log('[FCM] Android permissions handled by manifest or requested if API 33+');
      }
    } catch (error) {
      console.error('[FCM] Failed to request notification permissions:', error);
    }
  },
  
  extractCallData: (remoteMessage: any) => {
    console.log('[FCM] Extracting call data from notification payload:', JSON.stringify(remoteMessage.data, null, 2));
    if (remoteMessage.data) {
      const {
        meetingId,
        caller_app_user_id,
        call_type,
        caller_name,
        videosdk_token
      } = remoteMessage.data;
      
      console.log('[FCM] Notification data fields:', { meetingId, caller_app_user_id, call_type, caller_name, videosdk_token });
      
      if (caller_app_user_id && meetingId && (call_type === "audio" || call_type === "video") && videosdk_token) {
        const extractedData = {
          callerId: caller_app_user_id, 
          callerName: caller_name || "Unknown Caller", 
          meetingId: meetingId,
          callType: call_type === "video" ? "video" : "voice", 
          videosdkToken: videosdk_token,
          // Add a unique call ID for CallKeep
          callKeepId: uuidv4(),
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
    callerId: string,
    receiverId: string,
    action: 'accepted' | 'rejected' | 'missed-video-call' | 'missed-audio-call',
    callType: 'video' | 'audio',
    meetingId?: string, // Meeting ID might be relevant for some actions
  ) => {
    let apiAction: VideoSDKCallRequest['action'];
    if (action === 'accepted') {
      apiAction = 'start'; // Or a specific "accepted" action if your backend differentiates
    } else if (action === 'rejected') {
      apiAction = 'end'; // Or a specific "rejected" action
    } else {
      apiAction = action;
    }
    
    console.log(`[FCM] Updating call status - Action: ${action} (API action: ${apiAction}), CallType: ${callType}`);
    console.log(`[FCM] Call parties - Caller: ${callerId}, Receiver: ${receiverId}, Meeting: ${meetingId}`);
    
    try {
      const payload: VideoSDKCallRequest = {
        callerId: callerId,
        receiverId: receiverId,
        action: apiAction,
        callType: callType === 'video' ? 'video-call' : 'audio-call',
        meetingId: meetingId, // Include meetingId if your backend uses it for status updates
      };
      
      console.log('[FCM] Call status update payload:', JSON.stringify(payload, null, 2));
      const response = await ApiService.handleCall(payload); // Ensure ApiService.handleCall can send this
      console.log('[FCM] Call status update response:', JSON.stringify(response, null, 2));
      
      // If 'accepted' leads to call creation and returns a callId from backend:
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

// IncomingCallScreen component
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
  const {colors} = useTheme();
  return (
    <View style={[localStyles.incomingCallOverlay, {backgroundColor: colors.background || localFallbackColors.backgroundOpac}]}>
      <Text style={[localStyles.incomingCallText, {color: colors.text?.light || localFallbackColors.text.light}]}>Incoming {callType} call from:</Text>
      <Text style={[localStyles.incomingCallerName, {color: colors.text?.light || localFallbackColors.text.light}]}>{callerName}</Text>
      <View style={localStyles.incomingCallButtons}>
        <TouchableOpacity style={[localStyles.acceptCallButton, {backgroundColor: colors.success || localFallbackColors.success}]} onPress={onAccept}>
          <Icon name="phone" size={24} color={colors.white || localFallbackColors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={[localStyles.rejectCallButton, {backgroundColor: colors.error || localFallbackColors.danger}]} onPress={onReject}>
          <Icon name="phone-off" size={24} color={colors.white || localFallbackColors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Main TipCallScreen component
export default function TipCallScreen() {
  const route = useRoute<TipCallScreenRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const tabNavigator = useTabNavigator();

  const [callType, setCallType] = useState<'voice' | 'video'>('video');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [languageFilter, setLanguageFilter] = useState<string>('1');
  const [categoryFilter, setCategoryFilter] = useState<string>('1');
  const [tabIndex, setTabIndex] = useState<number>(0);

  const initialCallData = route.params?.initialCallNotificationData;
  const [incomingCallNotification, setIncomingCallNotification] = useState<any>(null); // Renamed for clarity

  useEffect(() => {
    const requestPermissions = async () => {
      await NotificationService.requestPermissions(messaging);
    };
    requestPermissions();
  }, []);

  // Handle initial call data from notification when app opens
  useEffect(() => {
    if (initialCallData) {
      console.log('[TipCall] Initial call data from notification (app opened):', initialCallData);
      // The initialCallData should already be processed by NotificationService.extractCallData if it came from a killed state notification
      // For now, assuming initialCallData is already the extracted format.
      const { meetingId: initMeetingId, callerId, callerName, callType: initCallType, videosdkToken: initToken } = initialCallData;

      if (initMeetingId && initToken) {
         // Display an alert to accept/reject, then navigate
        Alert.alert(
          "Incoming Call",
          `${callerName || 'Someone'} is calling for a ${initCallType} call.`,
          [
            { text: "Reject", onPress: () => console.log("Initial call rejected"), style: "cancel" },
            {
              text: "Accept",
              onPress: () => {
                console.log('[TipCall] Accepting initial call, navigating to Meeting screen.');
                navigation.navigate('Meeting', {
                  meetingId: initMeetingId,
                  token: initToken, // This is the callee's token
                  callType: initCallType === 'video-call' || initCallType === 'video' ? 'video' : 'voice',
                  displayName: user?.name || "Me", // Callee's display name
                  isInitiator: false,
                  recipientName: callerName, // The caller is the "recipient" from callee's perspective
                });
              },
            },
          ]
        );
      } else {
        console.warn('[TipCall] Initial call data missing meetingId or videosdkToken.');
      }
      // Clear initialCallData from route params after processing to prevent re-triggering
      navigation.setParams({ initialCallNotificationData: undefined });
    }
  }, [initialCallData, navigation, user]);

  const fetchContacts = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    
    try {
      const response = await ApiService.getUserList();
      console.log('[Contacts] Fetched contacts:', response);
      
      if (response && response.data) {
        setContacts(response.data);
      } else {
        console.warn('[Contacts] No data found in response:', response);
        setContacts([]);
      }
    } catch (err) {
      console.error('[Contacts] Error fetching contacts:', err);
      setError('Failed to load contacts. Please try again later.');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchContacts(false);
    setTimeout(() => setRefreshing(false), 1000);
  }, [fetchContacts]);

  const handleLanguageFilterChange = useCallback((languageId: string) => {
    setLanguageFilter(languageId);
    console.log('[Contacts] Language filter changed to:', languageId);
  }, []);

  const handleCategoryFilterChange = useCallback((categoryId: string) => {
    setCategoryFilter(categoryId);
    console.log('[Contacts] Category filter changed to:', categoryId);
  }, []);

  // SINGLE handleVideoSDKCall function (FIXED DUPLICATE DECLARATION)
  const handleVideoSDKCall = useCallback(async (recipient: Contact, callTypeToInitiate: 'voice' | 'video') => {
    if (!user || !user.id || !recipient || !recipient.id) {
      Alert.alert("Error", "User or recipient information is missing.");
      return;
    }
    
    console.log(`[TipCall] Initiating ${callTypeToInitiate} call to ${recipient.name || recipient.id}`);
    setError(null);

    try {
      // Generate a unique call ID for CallKeep
      const callKeepId = uuidv4();
      
      // Start outgoing call in CallKeep first
      const callKeepService = CallKeepService.getInstance();
      await callKeepService.startOutgoingCall(
        callKeepId,
        recipient.name || "Contact",
        callTypeToInitiate
      );

      // Then initiate the actual VideoSDK call
      const result = await initiateVideoSDKCall(
        user.id.toString(),
        user.name || "Caller",
        recipient.id.toString(),
        recipient.name || "Recipient",
        callTypeToInitiate
      );

      if (result.success && result.meetingId && result.token) {
        console.log(`[TipCall] Call initiated. Navigating to Meeting screen. Meeting ID: ${result.meetingId}`);
        
        // Mark call as connected in CallKeep
        await callKeepService.setCallConnected(callKeepId);
        
        navigation.navigate('Meeting', {
          meetingId: result.meetingId,
          token: result.token,
          callType: callTypeToInitiate,
          displayName: user.name || "Me",
          isInitiator: true,
          recipientName: recipient.name || "Participant",
        });
      } else {
        // End CallKeep call if VideoSDK call failed
        await callKeepService.endCall(callKeepId);
        Alert.alert('Call Failed', result.error || 'Could not initiate the call. Please try again.');
      }
    } catch (error: any) {
      console.error('[TipCall] Error in handleVideoSDKCall:', error);
      Alert.alert('Call Error', error.message || 'An unexpected error occurred.');
    }
  }, [user, navigation]);

  const handleIncomingCallFromNotification = useCallback(async (callData: any) => {
    console.log('[TipCall] Handling incoming call data from foreground notification:', callData);
    
    try {
      const callKeepService = CallKeepService.getInstance();
      
      // Display incoming call through CallKeep instead of custom UI
      await callKeepService.displayIncomingCall(
        callData.callKeepId,
        callData.callerName,
        callData.callType,
        callData
      );
      
      // Don't show the custom incoming call UI anymore
      // setIncomingCallNotification(callData);
      
    } catch (error) {
      console.error('[TipCall] Error displaying CallKeep incoming call:', error);
      // Fallback to custom UI if CallKeep fails
      setIncomingCallNotification(callData);
    }
  }, []);

  // Initialize CallKeep service
  useEffect(() => {
    const initializeCallKeep = async () => {
      try {
        const callKeepService = CallKeepService.getInstance();
        await callKeepService.initialize();
        
        // Set up callbacks
        callKeepService.setCallbacks({
          onIncomingCallAnswer: (callData) => {
            console.log('[TipCall] CallKeep answered call:', callData);
            // Navigate to meeting screen
            navigation.navigate('Meeting', {
              meetingId: callData.meetingId,
              token: callData.videosdkToken,
              callType: callData.callType,
              displayName: user?.name || "Me",
              isInitiator: false,
              recipientName: callData.callerName,
            });
          },
          onCallEnd: (callId) => {
            console.log('[TipCall] CallKeep ended call:', callId);
            // Handle call end if needed
          },
          onCallRejection: async (callData) => {
            console.log('[TipCall] CallKeep rejected call:', callData);
            // Send rejection to backend
            if (user && callData.callerId && callData.meetingId) {
              await NotificationService.updateCallStatus(
                callData.callerId,
                user.id.toString(),
                'rejected',
                callData.callType,
                callData.meetingId
              );
            }
          },
        });
        
        console.log('[TipCall] CallKeep initialized successfully');
      } catch (error) {
        console.error('[TipCall] Failed to initialize CallKeep:', error);
        Alert.alert('Call Service Error', 'Failed to initialize call service. Calls may not work properly.');
      }
    };

    initializeCallKeep();
    
    // Cleanup on unmount
    return () => {
      CallKeepService.getInstance().cleanup();
    };
  }, [navigation, user]);

  // Handle initial call data from notification when app opens
  useEffect(() => {
    if (initialCallData) {
      console.log('[TipCall] Initial call data from notification (app opened):', initialCallData);
      
      const { meetingId: initMeetingId, callerId, callerName, callType: initCallType, videosdkToken: initToken } = initialCallData;

      if (initMeetingId && initToken) {
        // For app launch from notification, show CallKeep incoming call
        const callData = {
          ...initialCallData,
          callKeepId: uuidv4(),
        };
        
        handleIncomingCallFromNotification(callData);
      } else {
        console.warn('[TipCall] Initial call data missing meetingId or videosdkToken.');
      }
      
      navigation.setParams({ initialCallNotificationData: undefined });
    }
  }, [initialCallData, navigation, user, handleIncomingCallFromNotification]);

  // Render method for TipCallScreen
  return (
    <ScreenTransition animationType="fade">
      <View style={localStyles.container}>
        <Header title="Tip Call" onBackPress={() => navigation.goBack()} />
        
        {/* Filters UI */}
        <View style={localStyles.filtersContainer}>
          <View style={localStyles.filterItem}>
            <Text style={localStyles.filterLabel}>Language:</Text>
            <View style={localStyles.filterButtons}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.id}
                  style={[
                    localStyles.filterButton,
                    languageFilter === lang.id && localStyles.selectedFilterButton
                  ]}
                  onPress={() => handleLanguageFilterChange(lang.id)}
                >
                  <Text style={localStyles.filterButtonText}>{lang.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={localStyles.filterItem}>
            <Text style={localStyles.filterLabel}>Category:</Text>
            <View style={localStyles.filterButtons}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    localStyles.filterButton,
                    categoryFilter === category.id && localStyles.selectedFilterButton
                  ]}
                  onPress={() => handleCategoryFilterChange(category.id)}
                >
                  <Text style={localStyles.filterButtonText}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Contacts List UI */}
        {loading ? (
          <View style={localStyles.loadingContainer}>
            <ActivityIndicator size="large" color={localFallbackColors.primary} />
            <Text style={localStyles.loadingText}>Loading contacts...</Text>
          </View>
        ) : error ? (
          <View style={localStyles.errorContainer}>
            <Text style={localStyles.errorText}>{error}</Text>
            <TouchableOpacity style={localStyles.retryButton} onPress={() => fetchContacts()}>
              <Text style={localStyles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : contacts.length === 0 ? (
          <View style={localStyles.emptyContainer}>
            <Text style={localStyles.emptyText}>No contacts found.</Text>
          </View>
        ) : (
          <FlatList
            data={contacts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({item}) => {
              const isAvailable = item.is_available && !item.dnd;
              return (
                <TouchableOpacity
                  style={[localStyles.contactItem, {borderColor: isAvailable ? colors.success || localFallbackColors.success : colors.borderLight || localFallbackColors.borderLight}]}
                >
                  <View style={localStyles.contactInfo}>
                    <View style={[localStyles.avatarPlaceholder, {backgroundColor: isAvailable ? colors.success || localFallbackColors.success : colors.gray[500] || localFallbackColors.gray[500]}]}>
                      {item.name ? (
                        <Text style={localStyles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                      ) : (
                        <Icon name="user" size={24} color="white" />
                      )}
                    </View>
                    <View style={localStyles.contactDetails}>
                      <Text style={[localStyles.contactName, {color: colors.text?.primary || localFallbackColors.text.primary}]}>{item.name || 'Unknown'}</Text>
                      <Text style={[localStyles.contactStatus, {color: colors.text?.secondary || localFallbackColors.text.secondary}]}>
                        {isAvailable ? 'Available' : item.dnd ? 'Do Not Disturb' : 'Offline'}
                      </Text>
                    </View>
                  </View>
                  
                  {isAvailable && (
                    <View style={localStyles.callButtons}>
                      <TouchableOpacity 
                        style={[localStyles.callButton, {backgroundColor: colors.success || localFallbackColors.success}]}
                        onPress={() => handleVideoSDKCall(item, 'video')}
                      >
                        <Icon name="video" size={20} color="white" />
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[localStyles.callButton, {backgroundColor: colors.primary || localFallbackColors.primary}]}
                        onPress={() => handleVideoSDKCall(item, 'voice')}
                      >
                        <Icon name="phone" size={20} color="white" />
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={{paddingBottom: 100}}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[localFallbackColors.primary]}
              />
            }
          />
        )}

        {/* Only show custom incoming call UI if CallKeep is not handling it */}
        {incomingCallNotification && (
          <IncomingCallScreen
            callerName={incomingCallNotification.callerName}
            callType={incomingCallNotification.callType}
            onAccept={() => {
              console.log('[TipCall] Accepting incoming call from custom UI, navigating to Meeting screen.');
              navigation.navigate('Meeting', {
                meetingId: incomingCallNotification.meetingId,
                token: incomingCallNotification.videosdkToken,
                callType: incomingCallNotification.callType,
                displayName: user?.name || "Me",
                isInitiator: false,
                recipientName: incomingCallNotification.callerName,
              });
              setIncomingCallNotification(null);
            }}
            onReject={async () => {
              console.log('[TipCall] Rejecting incoming call from custom UI.');
              if (user && incomingCallNotification.callerId && incomingCallNotification.meetingId) {
                await NotificationService.updateCallStatus(
                  incomingCallNotification.callerId,
                  user.id.toString(),
                  'rejected',
                  incomingCallNotification.callType,
                  incomingCallNotification.meetingId
                );
              }
              setIncomingCallNotification(null);
            }}
          />
        )}
      </View>
    </ScreenTransition>
  );
}

// localStyles definition
const localStyles = StyleSheet.create({
  ...importedStyles,
  // Add any additional styles here if needed
});