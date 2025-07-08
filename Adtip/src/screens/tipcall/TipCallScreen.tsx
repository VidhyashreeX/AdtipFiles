import React, {useEffect, useState, useCallback, useMemo, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
  Alert,
  StatusBar,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  StyleSheet,
  Image,
  TextInput,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/WalletContext';
import { useTabNavigator } from '../../contexts/TabNavigatorContext';
import { useDataContext } from '../../providers/DataProvider';
import { useNetInfo } from '@react-native-community/netinfo';
import { useUsers, usePrefetchData } from '../../hooks/useQueries';
import PermissionManagerService from '../../services/PermissionManagerService';
import Header from '../../components/common/Header';
import ScreenTransition from '../../components/common/ScreenTransition';
import {
  useMeeting,
  useParticipant,
  MeetingProvider,
  MediaStream,
  usePubSub,
  Constants,
} from '@videosdk.live/react-native-sdk';
import ContactSkeletonItem from '../../components/skeletons/ContactSkeletonItem';
import { UserListRequest, UpdateUserRequest, UpdateUserResponse, Contact } from '../../types/api';
import ApiService from '../../services/ApiService';
import Icon from 'react-native-vector-icons/Feather';
import { Ban, BanknoteArrowUp } from 'lucide-react-native';
import messaging from '@react-native-firebase/messaging';
import uuid from 'react-native-uuid';
import UnifiedCallService from '../../services/calling/UnifiedCallService'; // Unified call service
import CallBillingService from '../../services/calling/CallBillingService'; // Call billing service
import BlocklistService from '../../services/BlocklistService';
import WalletService from '../../services/WalletService';
import { formatPremiumExpiryDate } from '../../utils/dateUtils';
import { useBlocklist } from '../../hooks/useBlocklist';
import RectangleAdComponent from '../../googleads/RectangleAdComponent';
import { RootStackParamList, MainNavigatorParamList } from '../../types/navigation';
import { useMissedCallsCount } from '../../hooks/useMissedCalls';
import UserProfileScreen from '../profile/UserProfileScreen';
import SingleBannerCard from '../../components/home/SingleBannerCard';
import { Headphones } from 'lucide-react-native';
import debounce from 'lodash.debounce';
import CallMediaManager from '../../services/calling/CallMediaManager';
import useCallStore from '../../stores/callStore';

// Define navigation stack param list
type NavigationProp = NativeStackNavigationProp<MainNavigatorParamList, 'TipCall'>;
type TipCallScreenRouteProp = RouteProp<MainNavigatorParamList, 'TipCall'>;

// Enhanced interfaces
interface Language {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

interface Interest {
  id: number;
  name: string;
  isPrimary: boolean;
}

// Enhanced Filter Chip Component
const FilterChip: React.FC<{
  label: string;
  isSelected: boolean;
  onPress: () => void;
  colors: any;
  isDarkMode: boolean;
}> = ({ label, isSelected, onPress, colors, isDarkMode }) => (
  <TouchableOpacity
    style={[
      styles.filterChip,
      {
        backgroundColor: isSelected ? colors.primary : isDarkMode ? colors.card : '#F8F9FA',
        borderColor: isSelected ? colors.primary : isDarkMode ? colors.border : '#E9ECEF',
      }
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text
      style={[
        styles.filterChipText,
        {
          color: isSelected ? '#FFFFFF' : colors.text.primary,
          fontWeight: isSelected ? '600' : '500',
        }
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

// Enhanced Contact Card Component
const ContactCard: React.FC<{
  contact: Contact;
  onVideoCall: () => void;
  onVoiceCall: () => void;
  onChat: () => void;
  hasUnreadMessages: boolean;
  colors: any;
  isDarkMode: boolean;
  onProfilePress?: () => void; // Added new prop for profile navigation
  onBlockUser?: () => void; // Added new prop for blocking user
}> = ({ contact, onVideoCall, onVoiceCall, onChat, hasUnreadMessages, colors, isDarkMode, onProfilePress, onBlockUser }) => {
  const avatarColor = colors.primary; // Always use primary color
  
  return (
    <TouchableOpacity 
      style={[
        styles.contactCard,
        {
          backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
          borderColor: isDarkMode ? colors.border : '#F1F3F4',
          shadowColor: isDarkMode ? '#000000' : '#000000',
          shadowOpacity: isDarkMode ? 0.3 : 0.08,
        }
      ]}
      onPress={onProfilePress} // Added onPress handler
      onLongPress={onBlockUser} // Added long press handler for blocking
      activeOpacity={0.8}
    >
      <View style={styles.contactCardContent}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            {contact.name ? (
              <Text style={styles.avatarText}>
                {contact.name.charAt(0).toUpperCase()}
              </Text>
            ) : (
              <Icon name="user" size={20} color="#FFFFFF" />
            )}
            {/* Online Status Indicator */}
            {contact.online_status && (
              <View style={styles.onlineIndicator} />
            )}
          </View>
        </View>

        {/* Contact Info Section */}
        <View style={styles.contactInfo}>
          <Text style={[styles.contactName, { color: colors.text.primary }]} numberOfLines={1}>
            {contact.name || 'Unknown User'}
          </Text>
          
          {/* Show User ID for search results */}
          <Text style={[styles.contactId, { color: colors.text.tertiary }]} numberOfLines={1}>
            ID: {contact.id}
          </Text>
          
          <Text style={[styles.contactStatus, { color: colors.text.secondary }]} numberOfLines={1}>
            {contact.online_status ? (
              contact.last_seen === 'just now' ? '🟢 Online' : `Last seen ${contact.last_seen}`
            ) : (
              contact.dnd ? '🔕 Do Not Disturb' : '⚫ Offline'
            )}
          </Text>

          {/* Languages */}
          {contact.languages && contact.languages.length > 0 && (
            <View style={styles.tagContainer}>
              <Icon name="globe" size={10} color={colors.text.tertiary} />
              <Text style={[styles.tagText, { color: colors.text.tertiary }]} numberOfLines={1}>
                {contact.languages.slice(0, 2).map(lang => lang.name).join(', ')}
                {contact.languages.length > 2 && ` +${contact.languages.length - 2}`}
              </Text>
            </View>
          )}

          {/* Interests */}
          {contact.interests && contact.interests.length > 0 && (
            <View style={styles.tagContainer}>
              <Icon name="heart" size={10} color={colors.text.tertiary} />
              <Text style={[styles.tagText, { color: colors.text.tertiary }]} numberOfLines={1}>
                {contact.interests.slice(0, 2).map(interest => interest.name).join(', ')}
                {contact.interests.length > 2 && ` +${contact.interests.length - 2}`}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons - Always Available */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.videoButton, { backgroundColor: colors.primary }]}
            onPress={onVideoCall}
            activeOpacity={0.8}
          >
            <Icon name="video" size={16} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.voiceButton, { backgroundColor: colors.success }]}
            onPress={onVoiceCall}
            activeOpacity={0.8}
          >
            <Icon name="phone" size={16} color="#FFFFFF" />
          </TouchableOpacity>
          
          {/* Enhanced chat button with unread dot indicator */}
          <TouchableOpacity
            style={[styles.actionButton, styles.chatButton, { backgroundColor: colors.info || '#3B82F6' }]}
            onPress={onChat}
            activeOpacity={0.8}
          >
            <Icon name="message-circle" size={16} color="#FFFFFF" />
            {hasUnreadMessages && (
              <View style={styles.unreadDot}>
                {/* Gold dot for unread messages */}
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Enhanced Loading Skeleton Component
const ContactsSkeleton: React.FC<{ colors: any; isDarkMode: boolean }> = ({ colors, isDarkMode }) => (
  <View style={styles.skeletonContainer}>
    {Array.from({ length: 8 }).map((_, index) => (
      <ContactSkeletonItem key={index} />
    ))}
  </View>
);

// Helper to interleave RectangleAdComponent after every 3 contacts
const getContactsWithAds = (contacts: Contact[]) => {
  const result: (Contact | { ad: true; key: string })[] = [];
  contacts.forEach((contact, idx) => {
    result.push(contact);
    if ((idx + 1) % 3 === 0) {
      result.push({ ad: true, key: `ad-${idx}` });
    }
  });
  return result;
};

// Search bar for TipCallScreen, styled like TipTubeSearchBar
const TipCallSearchBar = ({
  value,
  onChangeText,
  onBack,
  colors,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onBack: () => void;
  colors: any;
}) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      width: '100%',
      zIndex: 10,
    }}
  >
    <TouchableOpacity onPress={onBack} style={{ padding: 8, marginRight: 4 }}>
      <Icon name="arrow-left" size={24} color={colors.text.primary} />
    </TouchableOpacity>
    <TextInput
      style={{
        flex: 1,
        height: 40,
        backgroundColor: colors.cardSecondary,
        borderRadius: 20,
        paddingHorizontal: 16,
        color: colors.text.primary,
        fontSize: 16,
      }}
      placeholder="Search users..."
      placeholderTextColor={colors.text.secondary}
      value={value}
      onChangeText={onChangeText}
      autoFocus
      returnKeyType="search"
    />
  </View>
);

// Update the main component to use Header search properly
export default function TipCallScreen() {
  const route = useRoute<TipCallScreenRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { balance } = useWallet();
  const { clearCache } = useDataContext();
  const netInfo = useNetInfo();
  const queryClient = useQueryClient();

  // Premium status state
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [premiumLoading, setPremiumLoading] = useState<boolean>(true);
  const [premiumData, setPremiumData] = useState<any>(null);

  // Get missed calls count for badge
  const { count: missedCallsCount } = useMissedCallsCount(user?.id?.toString());

  // Blocklist functionality
  const { 
    blockedUsers, 
    blockedUsersCount, 
    isUserBlocked, 
    blockUser, 
    unblockUser, 
    refreshBlocklist, 
    isInitialized: blocklistInitialized 
  } = useBlocklist();

  // Initialize BlocklistService on mount
  useEffect(() => {
    const initializeBlocklist = async () => {
      try {
        const blocklistService = BlocklistService.getInstance();
        await blocklistService.initialize();
      } catch (error) {
        console.error('[TipCallScreen] Failed to initialize blocklist:', error);
      }
    };
    initializeBlocklist();
  }, []);

  // Initialize and reset call-related services
  useEffect(() => {
    const initializeAndResetCallServices = async () => {
      try {
        console.log('[TipCallScreen] Initializing and resetting call services...');
        
        // First, ensure any active calls are ended
        const callStore = useCallStore.getState();
        if (callStore.isInCall) {
          console.log('[TipCallScreen] Active call detected, cleaning up first...');
          await callStore.actions.endCall('navigation_reset');
          // Add a small delay to ensure cleanup completes
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // Force cleanup of any lingering media resources
        CallMediaManager.forceCleanupIfNeeded();
        
        // Reset call state
        callStore.actions.resetCallState();
        
        // Initialize the call service if not already initialized
        const unifiedCallService = UnifiedCallService.getInstance();
        if (!unifiedCallService.getIsInitialized()) {
          console.log('[TipCallScreen] Call service not initialized, initializing now...');
          
          // Configure VideoSDK with basic options
          const success = await unifiedCallService.initialize({
            enableCallKeep: true,
            enableNotifications: true,
          });
          
          if (!success) {
            console.error('[TipCallScreen] Failed to initialize call service');
            Alert.alert(
              'Call Service Error', 
              'Failed to initialize call service. Video and voice calls may not work properly.'
            );
            return false;
          }
        } else {
          console.log('[TipCallScreen] Call service already initialized');
        }
        
        // Update the call store to reflect initialization
        callStore.actions.setServiceInitialized(true);
        
        console.log('[TipCallScreen] Call services initialized successfully');
        return true;
      } catch (error) {
        console.error('[TipCallScreen] Error initializing call services:', error);
        Alert.alert(
          'Service Error', 
          'An error occurred while initializing call services. Please try again.'
        );
        return false;
      }
    };
    
    initializeAndResetCallServices();
    
    // Also run this when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('[TipCallScreen] Screen focused, ensuring call services are reset');
      initializeAndResetCallServices();
    });
    
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    // Reset call state using Zustand store
    const { useCallStore } = require('../../stores/callStore');
    useCallStore.getState().actions.cleanup();
  }, []);

  // Request permissions on component mount
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        console.log('[TipCallScreen] Requesting call permissions...');
        const permissionManager = PermissionManagerService.getInstance();
        
        // Request all call permissions (camera, microphone, phone)
        const result = await permissionManager.requestCallPermissions(true);
        
        console.log('[TipCallScreen] Permission result:', result);
        
        if (result.camera && result.microphone) {
          console.log('[TipCallScreen] ✅ All essential permissions granted');
        } else {
          console.warn('[TipCallScreen] ❌ Some essential permissions were not granted:', result);
          Alert.alert(
            "Permissions Required",
            "Camera and microphone access are required to make calls. Please grant them from app settings.",
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => {
                // Open app settings
                const { Linking } = require('react-native');
                Linking.openSettings();
              }}
            ]
          );
        }
      } catch (err) {
        console.warn('[TipCallScreen] Permissions request error:', err);
      }
    };
    requestPermissions();
  }, []);

  // UI state management (decoupled from navigation)
  const [languages, setLanguages] = useState<Language[]>([{ id: 0, name: 'All' }]);
  const [interests, setInterests] = useState<Category[]>([{ id: 0, name: 'All' }]);
  const [selectedLanguage, setSelectedLanguage] = useState<number>(0);
  const [selectedInterest, setSelectedInterest] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isTipCallSearchActive, setIsTipCallSearchActive] = useState<boolean>(false);
  const [isDndEnabled, setIsDndEnabled] = useState<boolean>(false);
  const [isDndLoading, setIsDndLoading] = useState<boolean>(false);
  const [unreadCounts, setUnreadCounts] = useState<{ [key: number]: number }>({});
  const [showUserProfileModal, setShowUserProfileModal] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const isFirstRun = useRef(true);

  // Fetch languages and interests from API
  useEffect(() => {
    console.log('[TipCall] Fetching languages and interests...');
    
    // Fetch languages
    ApiService.getLanguages()
      .then(res => {
        console.log('[TipCall] getLanguages response:', res);
        if (res?.data) {
          const apiLanguages = res.data.map((l: any) => ({ 
            id: l.id, 
            name: l.name.charAt(0).toUpperCase() + l.name.slice(1) 
          }));
          setLanguages([{ id: 0, name: 'All' }, ...apiLanguages]);
        }
      })
      .catch(error => {
        console.error('[TipCall] Error fetching languages:', error);
      });

    // Fetch interests
    ApiService.getInterests()
      .then(res => {
        console.log('[TipCall] getInterests response:', res);
        if (res?.data) {
          const apiInterests = res.data.map((i: any) => ({ 
            id: i.id, 
            name: i.name 
          }));
          setInterests([{ id: 0, name: 'All' }, ...apiInterests]);
        }
      })
      .catch(error => {
        console.error('[TipCall] Error fetching interests:', error);
      });
  }, []);

  const initialCallData = route.params?.initialCallNotificationData;
  const [incomingCallNotification, setIncomingCallNotification] = useState<any>(null);

  // Enhanced data layer using React Query v5
  const filters = { languageFilter: selectedLanguage, categoryFilter: selectedInterest, searchQuery };
  const {
    data: usersData,
    isLoading: usersLoading,
    isFetchingNextPage: loadingMore,
    error: usersError,
    refetch: refreshUsers,
    fetchNextPage: loadMoreUsers,
    hasNextPage: hasMore,
  } = useUsers(filters, user?.id);

  // Fetch data on initial mount
  useEffect(() => {
    if (user?.id) {
      console.log('[TipCallScreen] Component mounted. Triggering initial fetch.');
      refreshUsers();
    }
  }, [user?.id]); // Runs once when user ID is available

  // Refetch data on subsequent screen focuses
  useFocusEffect(
    useCallback(() => {
      if (isFirstRun.current) {
        isFirstRun.current = false;
        return;
      }
      
      console.log('[TipCallScreen] Screen focused. Refetching users.');
      refreshUsers();
    }, [refreshUsers])
  );

  // Refresh blocklist when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('[TipCallScreen] Screen focused. Refreshing blocklist.');
      refreshBlocklist();
    }, [refreshBlocklist])
  );

  // Transform users data for compatibility
  const contacts = useMemo(() => {
    const allUsers = usersData?.pages?.flatMap(page => page?.data || []) || [];
    return allUsers.filter(contact => contact.id !== user?.id);
  }, [usersData, user?.id]);

  // Filtered contacts for search (local filtering for immediate response)
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    
    const lowerCaseQuery = searchQuery.toLowerCase();
    return contacts.filter(contact => 
      contact.name?.toLowerCase().includes(lowerCaseQuery) ||
      contact.id.toString().includes(searchQuery) ||
      contact.emailId?.toLowerCase().includes(lowerCaseQuery)
    );
  }, [contacts, searchQuery]);

  // Network state for offline handling
  const isOnline = netInfo.isConnected;

  // Derived state for UI
  const initialLoading = usersLoading && contacts.length === 0;

  // Fetch unread message counts for contacts with chat history
  const fetchUnreadCounts = useCallback(async () => {
    if (!user?.id || contacts.length === 0) return;
    
    try {
      const response = await ApiService.getUnreadMessageCount(user.id);
      if (response?.data?.unread_count > 0) {
        // Simulate distribution of unread messages across contacts
        // In real implementation, you'd have sender-specific unread counts
        const counts: { [key: number]: number } = {};
        contacts.forEach((contact, index) => {
          // Random distribution for demo - replace with actual logic
          if (index < 3) { // Only first 3 contacts have unread messages for demo
            counts[contact.id] = Math.floor(Math.random() * 5) + 1;
          } else {
            counts[contact.id] = 0;
          }
        });
        setUnreadCounts(counts);
      }
    } catch (error) {
      console.error('Failed to fetch unread counts:', error);
    }
  }, [user?.id, contacts]);

  // Handle chat navigation and mark messages as read
  const handleChatNavigation = useCallback(async (contact: Contact) => {
    // Mark messages as read when opening chat
    if (user?.id && unreadCounts[contact.id] > 0) {
      try {
        await ApiService.markMessagesAsRead(user.id, contact.id);
        // Update local unread count
        setUnreadCounts(prev => ({
          ...prev,
          [contact.id]: 0
        }));
      } catch (error) {
        console.error('Failed to mark messages as read:', error);
      }
    }
    
    navigation.navigate('Chat', { user: contact });
  }, [navigation, user?.id, unreadCounts]);

  // Handle user profile modal
  const handleUserProfilePress = useCallback((userId: number) => {
    setSelectedUserId(userId);
    setShowUserProfileModal(true);
  }, []);

  // Handle blocking a user
  const handleBlockUser = useCallback((contact: Contact) => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${contact.name || 'this user'}? They won't be able to call you anymore.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser(contact.id.toString(), contact.name || 'Unknown User');
              Alert.alert('Success', `${contact.name || 'User'} has been blocked.`);
            } catch (error) {
              console.error('[TipCallScreen] Failed to block user:', error);
              Alert.alert('Error', 'Failed to block user. Please try again.');
            }
          },
        },
      ]
    );
  }, [blockUser]);

  // Handle navigation to blocked users screen
  const handleNavigateToBlockedUsers = useCallback(() => {
    navigation.navigate('BlockedUsers' as never);
  }, [navigation]);

  // Initialize DND state from user data
  useEffect(() => {
    if (user && typeof user.dnd === 'boolean') {
      setIsDndEnabled(user.dnd);
    }
  }, [user]);

  // Live search filter function - only for client-side filtering
  const applySearchFilter = useCallback((query: string, contactsToFilter: Contact[]): Contact[] => {
    if (!query.trim()) {
      return contactsToFilter;
    }
    
    const lowerCaseQuery = query.toLowerCase();
    return contactsToFilter.filter(contact => 
      contact.name?.toLowerCase().includes(lowerCaseQuery) ||
      contact.id.toString().includes(query) ||
      contact.emailId?.toLowerCase().includes(lowerCaseQuery)
    );
  }, []);

  // Enhanced event handlers using React Query
  const handleRefresh = useCallback(() => {
    console.log('[TipCall] Pull to refresh triggered');
    refreshUsers();
  }, [refreshUsers]);

  const handleLoadMore = useCallback(() => {
    if (hasMore) {
      console.log('[TipCall] Loading more users');
      loadMoreUsers();
    }
  }, [hasMore, loadMoreUsers]);

  // TipCall search handlers
  const handleTipCallSearch = useCallback((query: string) => {
    console.log('[TipCall] TipCall search submitted:', query);
    setSearchQuery(query);
    setIsTipCallSearchActive(false);
  }, []);

  const handleTipCallSearchChange = useCallback((query: string) => {
    console.log('[TipCall] TipCall search query changed:', query);
    setSearchQuery(query || '');
  }, []);

  const handleTipCallSearchSubmit = useCallback(() => {
    if (searchQuery && searchQuery.trim()) {
      handleTipCallSearch(searchQuery.trim());
    }
  }, [searchQuery, handleTipCallSearch]);

  // Clear search handler
  const handleClearSearch = useCallback(() => {
    console.log('[TipCall] Clearing search');
    setSearchQuery('');
    setIsTipCallSearchActive(false);
  }, []);

  // DND (Do Not Disturb) Toggle Handler with confirmation
  const handleDndToggle = useCallback(async () => {
    const newDndState = !isDndEnabled;
    const actionText = newDndState ? 'enable' : 'disable';
    const statusText = newDndState ? 'ON' : 'OFF';
    const description = newDndState 
      ? 'You will not receive any incoming call notifications when DND is ON.'
      : 'You will start receiving incoming call notifications when DND is OFF.';

    Alert.alert(
      `Turn DND ${statusText}?`,
      description,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: `Turn ${statusText}`,
          style: newDndState ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setIsDndLoading(true);
              
              console.log('[TipCall] Toggling DND to:', newDndState);
              
              const updateData: UpdateUserRequest = {
                id: user!.id,
                dnd: newDndState ? 1 : 0, // Convert boolean to number
              };
              
              const response: UpdateUserResponse = await ApiService.updateUser(updateData);
              
              if (response.status) { // UpdateUserResponse has status as boolean
                setIsDndEnabled(newDndState);
                console.log('[TipCall] DND updated successfully');
                Alert.alert(
                  'Success',
                  `Do Not Disturb has been turned ${statusText.toLowerCase()}.`
                );
              } else {
                throw new Error(response.message || 'Failed to update DND status');
              }
            } catch (error: any) {
              console.error('[TipCall] Error toggling DND:', error);
              Alert.alert('Error', 'Failed to update Do Not Disturb status. Please try again.');
            } finally {
              setIsDndLoading(false);
            }
          },
        },
      ]
    );
  }, [isDndEnabled, user]);

  const handleStartCall = useCallback(async (recipient: Contact, callType: 'voice' | 'video') => {
    if (!user || !recipient.name) {
      Alert.alert("Error", "User or recipient information is missing.");
      return;
    }

    // Check wallet balance before starting call
    const currentBalance = parseFloat(balance || '0');
    const minimumBalance = 1; // Minimum balance required for calls (₹1)
    
    if (currentBalance < minimumBalance) {
      Alert.alert(
        "Insufficient Funds",
        `You need at least ₹${minimumBalance} to make calls. Please add funds to your wallet.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Add Funds',
            style: 'default',
            onPress: () => {
              navigation.navigate('AddFundsScreen' as never);
            },
          },
        ]
      );
      return;
    }

    // Calculate and show maximum call duration based on balance
    try {
      const callBillingService = CallBillingService.getInstance();
      const callRates = callBillingService.getCallRates();
      const { isPremium } = await WalletService.checkPremiumStatus(user.id);
      
      let ratePerMinute: number;
      if (callType === 'voice') {
        ratePerMinute = isPremium ? callRates.voicePremium : callRates.voiceNonPremium;
      } else {
        ratePerMinute = isPremium ? callRates.videoPremium : callRates.videoNonPremium;
      }
      
      const maxMinutes = Math.floor(currentBalance / ratePerMinute);
      const maxDurationText = maxMinutes >= 60 
        ? `${Math.floor(maxMinutes / 60)}h ${maxMinutes % 60}m`
        : `${maxMinutes}m`;
      
      console.log('[TipCall] Call duration calculation:', {
        balance: currentBalance,
        isPremium,
        ratePerMinute,
        maxMinutes,
        callType
      });

      // Show confirmation with call duration info
      Alert.alert(
        `Start ${callType === 'voice' ? 'Voice' : 'Video'} Call`,
        `Call to ${recipient.name}\n\nRate: ₹${ratePerMinute}/min ${isPremium ? '(Premium)' : ''}\nMax duration: ${maxDurationText}\nBalance: ₹${currentBalance.toFixed(2)}`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Start Call',
            style: 'default',
            onPress: () => initiateCall(),
          },
        ]
      );
    } catch (error) {
      console.error('[TipCall] Error calculating call duration:', error);
      // If calculation fails, still allow the call but without duration info
      Alert.alert(
        `Start ${callType === 'voice' ? 'Voice' : 'Video'} Call`,
        `Call to ${recipient.name}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Start Call',
            style: 'default',
            onPress: () => initiateCall(),
          },
        ]
      );
    }

    async function initiateCall() {
      // Prevent multiple rapid call attempts using Zustand store
      const { useCallStore } = require('../../stores/callStore');
      const currentCallStatus = useCallStore.getState().callStatus;
      if (currentCallStatus !== 'idle' && currentCallStatus !== 'ended') {
        Alert.alert("Call In Progress", "You are already in a call.");
        return;
      }

      try {
        console.log('[TipCall] Starting WhatsApp-like call to:', recipient.name, 'Type:', callType);
        
        // ✅ Check if recipient is available before starting call
        try {
          console.log('[TipCall] Verifying recipient availability...');
          const recipientFCMData = await ApiService.getFCMToken(recipient.id.toString());
          if (!recipientFCMData?.token) {
            Alert.alert(
              "Recipient Unavailable", 
              `${recipient.name} is not available to receive calls right now.`
            );
            return;
          }
          console.log('[TipCall] Recipient is available for calls');
        } catch (error) {
          console.error('[TipCall] Error checking recipient availability:', error);
          Alert.alert("Error", "Unable to verify recipient availability. Please try again.");
          return;
        }
        
        // Initialize Unified Call Service if not already done
        const callService = UnifiedCallService.getInstance();
        const initialized = await callService.initialize();
        
        if (!initialized) {
          Alert.alert("Call Error", "Unable to initialize calling system. Please try again.");
          return;
        }
        
        // Start the call with Unified Call Service
        const callData = await callService.startOutgoingCall(
          recipient.id.toString(),
          recipient.name || 'Unknown',
          callType,
          user?.name || 'User',
          user?.id.toString() || '0'
        );
        
        if (callData) {
          console.log('[TipCall] WhatsApp-like call initiated successfully:', callData.callId);
          // Navigation will be handled automatically by WhatsApp Call Manager
        } else {
          console.error('[TipCall] WhatsApp Call Manager failed to start the call.');
          Alert.alert('Call Failed', 'Unable to start the call. Please check your connection and try again.');
        }
      } catch (error: any) {
        console.error('[TipCall] Error in handleStartCall:', error);
        
        // ✅ Handle specific FCM token errors
        if (error.message?.includes('no FCM token')) {
          if (error.message.includes('Recipient')) {
            Alert.alert(
              "Recipient Unavailable", 
              `${recipient.name} is not available to receive calls right now.`
            );
          } else if (error.message.includes('Caller')) {
            Alert.alert(
              "Call Error", 
              "Unable to initiate call. Please check your internet connection and try again."
            );
          } else {
            Alert.alert(
              "Call Error", 
              "Unable to initiate call. Please try again later."
            );
          }
        } else if (error.message?.includes('Network connection error')) {
          Alert.alert(
            "Network Error", 
            "Please check your internet connection and try again."
          );
        } else if (error.message?.includes('Call failed')) {
          Alert.alert("Call Failed", error.message.replace('Call failed: ', ''));
        } else {
          Alert.alert('Call Error', 'An unexpected error occurred while starting the call. Please try again.');
        }
      }
    }
  }, [user, balance, navigation]);

  // Prefetch profile data only for the current user (not for all contacts)
  // Commented out to avoid unnecessary API calls in TipCallScreen
  // useEffect(() => {
  //   if (user?.id) {
  //     prefetchProfile(user.id);
  //   }
  // }, [user?.id, prefetchProfile]);

  // Fetch unread counts when contacts are loaded or screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchUnreadCounts();
    }, [fetchUnreadCounts])
  );

  // Fetch initial data
  useFocusEffect(
    useCallback(() => {
      console.log('[TipCallScreen] Screen focused, refreshing data');
      refreshUsers();
    }, [user?.id])
  );

  // Check premium status
  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (!user?.id) return;
      
      try {
        setPremiumLoading(true);
        console.log('[TipCallScreen] Checking premium status for user:', user.id);
        
        const premiumResponse = await ApiService.checkPremium(user.id);
        console.log('[TipCallScreen] Premium check response:', premiumResponse);
        
        // Handle different API response formats
        const isPremiumActive = !!(premiumResponse && 
          (premiumResponse as any).status === true || 
          (premiumResponse as any).status === 1);
          
        setIsPremium(isPremiumActive);
        setPremiumData(isPremiumActive ? premiumResponse : null);
      } catch (error) {
        console.error('[TipCallScreen] Error checking premium status:', error);
        setIsPremium(false);
        setPremiumData(null);
      } finally {
        setPremiumLoading(false);
      }
    };
    
    checkPremiumStatus();
  }, [user?.id]);

  // Render premium banner section
  const renderPremiumBanner = () => {
    if (premiumLoading) {
      return null; // Don't show anything while loading
    }

    // Show upgrade banner if user doesn't have premium
    if (!isPremium) {
      return (
        <View style={[styles.premiumContainer, { backgroundColor: isDarkMode ? colors.card : '#fff' }]}>
          <LinearGradient
            colors={['#FFD700', '#FFB300']}
            style={styles.premiumBanner}
          >
            <Text style={styles.crownIcon}>👑</Text>
            <View style={styles.premiumTextContainer}>
              <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
              <Text style={styles.premiumSubtitle}>Lower call rates (₹4/min) & ₹2 per call acceptance</Text>
            </View>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => navigation.navigate('SubscriptionScreen' as never)}
              activeOpacity={0.8}
            >
              <Text style={styles.upgradeButtonText}>Upgrade</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      );
    } else {
      // Show premium active banner with expiry date
      return (
        <View style={[styles.premiumContainer, { backgroundColor: isDarkMode ? colors.card : '#fff' }]}>
          <LinearGradient
            colors={['#4CAF50', '#45A049']}
            style={styles.premiumBanner}
          >
            <Text style={styles.crownIcon}>👑</Text>
            <View style={styles.premiumTextContainer}>
              <Text style={styles.premiumTitle}>Premium Active</Text>
              <Text style={styles.premiumSubtitle}>
                {premiumData?.end_time ? `Expires: ${formatPremiumExpiryDate(premiumData.end_time)}` : 'Enjoying lower call rates'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => navigation.navigate('SubscriptionScreen' as never)}
              activeOpacity={0.8}
            >
              <Text style={styles.upgradeButtonText}>Manage</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      );
    }
  };

  // Render contact item
  const renderContactItem = ({ item }: { item: Contact }) => {
    return (
      <ContactCard
        contact={item}
        onVideoCall={() => handleStartCall(item, 'video')}
        onVoiceCall={() => handleStartCall(item, 'voice')}
        onChat={() => handleChatNavigation(item)}
        hasUnreadMessages={unreadCounts[item.id] > 0}
        colors={colors}
        isDarkMode={isDarkMode}
        onProfilePress={() => handleUserProfilePress(item.id)} // Open profile modal
        onBlockUser={() => handleBlockUser(item)} // Block user on long press
      />
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={[styles.emptyStateIcon, { backgroundColor: colors.primary + '20' }]}>
        <Icon name="users" size={40} color={colors.primary} />
      </View>
      <Text style={[styles.emptyStateTitle, { color: colors.text.primary }]}>
        {searchQuery ? 'No contacts found' : 'No contacts available'}
      </Text>
      <Text style={[styles.emptyStateMessage, { color: colors.text.secondary }]}>
        {searchQuery 
          ? `No contacts match "${searchQuery}". Try a different search term.`
          : 'No contacts are currently available with the selected filters. Try adjusting your language or interest filters.'
        }
      </Text>
    </View>
  );

  // Render error state
  const renderErrorState = () => (
    <View style={styles.errorStateContainer}>
      <View style={[styles.errorStateIcon, { backgroundColor: colors.error + '20' }]}>
        <Icon name="wifi-off" size={40} color={colors.error} />
      </View>
      <Text style={[styles.errorStateTitle, { color: colors.text.primary }]}>
        {isOnline ? 'Something went wrong' : 'You\'re offline'}
      </Text>
      <Text style={[styles.errorStateMessage, { color: colors.text.secondary }]}>
        {isOnline ? 'Failed to load contacts. Please try again.' : 'Contacts will load when you\'re back online.'}
      </Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: colors.primary }]}
        onPress={() => refreshUsers()}
        activeOpacity={0.8}
      >
        <Icon name="refresh-cw" size={16} color="#FFFFFF" />
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  console.log('[TipCall] Render state:', {
    initialLoading,
    error: !!usersError,
    contactsLength: contacts.length,
    filteredContactsLength: filteredContacts.length,
    searchQuery,
    languageFilter: selectedLanguage,
    categoryFilter: selectedInterest
  });

  const contactsWithAds = getContactsWithAds(filteredContacts);

  const renderItem = ({ item }: { item: Contact | { ad: true, key: string } }) => {
    if ('ad' in item) {
      return <RectangleAdComponent key={item.key} />;
    }
    return renderContactItem({ item });
  };

  // Add state for live search query (separate from committed searchQuery)
  const [liveSearchQuery, setLiveSearchQuery] = useState('');

  // Debounced setter for live search
  const debouncedSetLiveSearchQuery = useMemo(() => debounce((q: string) => setLiveSearchQuery(q), 300), []);

  // Live search hook (only when search bar is expanded)
  const {
    data: liveSearchData,
    isLoading: liveSearchLoading,
    error: liveSearchError,
  } = useUsers({ languageFilter: selectedLanguage, categoryFilter: selectedInterest, searchQuery: liveSearchQuery }, user?.id);

  // Transform live search results
  const liveSearchContacts = useMemo(() => {
    const allUsers = liveSearchData?.pages?.flatMap(page => page?.data || []) || [];
    return allUsers.filter(contact => contact.id !== user?.id);
  }, [liveSearchData, user?.id]);

  // Handler for search bar text change (live update)
  const handleTipCallLiveSearchChange = useCallback((text: string) => {
    debouncedSetLiveSearchQuery(text);
    setSearchQuery(text); // keep searchQuery in sync for submit
  }, [debouncedSetLiveSearchQuery]);

  // Handler for tapping a user in live search
  const handleLiveSearchUserPress = useCallback((contact: Contact) => {
    setIsTipCallSearchActive(false);
    setSearchQuery('');
    setLiveSearchQuery('');
    setSelectedUserId(contact.id);
    setShowUserProfileModal(true);
  }, []);

  // Handler for back arrow in search bar (reset live search)
  const handleSearchBack = useCallback(() => {
    setIsTipCallSearchActive(false);
    setSearchQuery('');
    setLiveSearchQuery('');
  }, []);

  if (isTipCallSearchActive) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <TipCallSearchBar
          value={searchQuery}
          onChangeText={handleTipCallLiveSearchChange}
          onBack={handleSearchBack}
          colors={colors}
        />
        <FlatList
          data={liveSearchQuery.trim() ? liveSearchContacts : []}
          keyExtractor={(item) => `live-search-user-${item.id}`}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleLiveSearchUserPress(item)} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={[styles.avatar, { backgroundColor: colors.primary, marginRight: 12 }]}> 
                {item.name ? (
                  <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                ) : (
                  <Icon name="user" size={20} color="#FFFFFF" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text.primary, fontWeight: '500', fontSize: 15 }} numberOfLines={1}>{item.name || 'Unknown User'}</Text>
                <Text style={{ color: colors.text.secondary, fontSize: 13 }}>ID: {item.id}</Text>
                <Text style={{ color: colors.text.tertiary, fontSize: 12 }}>{item.emailId}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={liveSearchQuery.trim() && !liveSearchLoading ? (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Icon name="search" size={32} color={colors.text.tertiary} />
              <Text style={{ color: colors.text.secondary, marginTop: 8 }}>No results found</Text>
            </View>
          ) : null}
          ListFooterComponent={liveSearchLoading ? (
            <View style={{ alignItems: 'center', padding: 20 }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar backgroundColor={colors.background} barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Updated Header with TipCall search functionality */}
      <Header 
        title="" 
        showWallet={false}
        showSearch={false}
        centerComponent={
          isTipCallSearchActive ? (
            <View style={styles.tipCallSearchContainer}>
              <TextInput
                style={[styles.tipCallSearchInput, { color: colors.text.primary, borderColor: colors.border }]}
                placeholder="Search users..."
                placeholderTextColor={colors.text.secondary}
                value={searchQuery || ''}
                onChangeText={handleTipCallLiveSearchChange}
                onSubmitEditing={handleTipCallSearchSubmit}
                autoFocus={true}
                returnKeyType="search"
              />
              <TouchableOpacity 
                onPress={() => setIsTipCallSearchActive(false)}
                style={styles.tipCallSearchClearButton}
              >
                <Icon name="x" size={16} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
          ) : undefined
        }
        rightComponent={
          <View style={styles.headerRightContainer}>
            {/* TipCall Search Icon */}
            <TouchableOpacity
              onPress={() => setIsTipCallSearchActive(true)}
              style={[styles.headerIconButton, { marginRight: 12 }]}
            >
              <Icon name="search" size={20} color={colors.text.primary} />
              {/* Show indicator if search is active */}
              {searchQuery && searchQuery.trim() && (
                <View style={[styles.searchActiveDot, { backgroundColor: colors.primary }]} />
              )}
            </TouchableOpacity>

            {/* Ban Icon - Navigate to Blocked Users */}
            <TouchableOpacity
              onPress={handleNavigateToBlockedUsers}
              style={[styles.headerIconButton, { marginRight: 12 }]}
            >
              <Ban size={20} color={colors.error} />
              {blockedUsersCount > 0 && (
                <Text style={styles.blockedUsersBadgeText}>
                  {blockedUsersCount > 99 ? '99+' : blockedUsersCount.toString()}
                </Text>
              )}
            </TouchableOpacity>

            {/* Missed Calls Icon */}
            <TouchableOpacity
              onPress={() => navigation.navigate('MissedCalls')}
              style={[styles.headerIconButton, { marginRight: 12 }]}
            >
              <Icon name="phone-missed" size={20} color={colors.error} />
              {missedCallsCount > 0 && (
                <View style={[styles.missedCallsBadge, { backgroundColor: colors.error }]}>
                  <Text style={styles.missedCallsBadgeText}>
                    {missedCallsCount > 99 ? '99+' : missedCallsCount.toString()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Banknote Arrow Up Icon - Navigate to AddFundsScreen */}
            <TouchableOpacity
              onPress={() => navigation.navigate('AddFundsScreen')}
              style={[styles.headerIconButton, { marginRight: 8 }]}
            >
              <BanknoteArrowUp size={20} color={colors.primary} />
            </TouchableOpacity>

            {/* DND Toggle Switch */}
            <DndToggleSwitch
              isDndEnabled={isDndEnabled}
              onToggle={handleDndToggle}
              isLoading={isDndLoading}
              colors={colors}
            />
          </View>
        }
      />

      {/* Render premium banner if applicable */}
      {/*{renderPremiumBanner()}*/}

      {/* Enhanced Filters Section */}
      <View style={[styles.filtersSection, { backgroundColor: colors.background }]}>
        <SingleBannerCard
          title="Talk to Earn"
          description={"Earn on Every Call: ₹2/min (Premium)\n₹0.60/min (Free)"}
          icon={<Headphones size={48} color="#fff" />}
          gradient={['#093028', '#237a57']}   
        />
        {/* Language Filter */}
        <View style={styles.filterGroup}>
          <Text style={[styles.filterGroupTitle, { color: colors.text.primary }]}>Languages</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContainer}
            style={styles.filterScrollView}
          >
            {LANGUAGES.map((lang) => (
              <FilterChip
                key={lang.id}
                label={lang.name}
                isSelected={languageFilter === lang.id}
                onPress={() => handleLanguageFilter(lang.id)}
                colors={colors}
                isDarkMode={isDarkMode}
              />
            ))}
          </ScrollView>
        </View>

        {/* Category Filter */}
        <View style={styles.filterGroup}>
          <Text style={[styles.filterGroupTitle, { color: colors.text.primary }]}>
            Interests
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContainer}
            style={styles.filterScrollView}
          >
            {CATEGORIES.map((category) => (
              <FilterChip
                key={category.id}
                label={category.name}
                isSelected={categoryFilter === category.id}
                onPress={() => handleCategoryFilter(category.id)}
                colors={colors}
                isDarkMode={isDarkMode}
              />
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Search Indicator */}
      {searchQuery && searchQuery.trim() && (
        <View style={styles.searchIndicator}>
          <Icon name="search" size={16} color={colors.primary} />
          <Text style={[styles.searchIndicatorText, {color: colors.primary}]}>
            Search results for "{searchQuery.trim()}"
          </Text>
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="x" size={16} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Content Section */}
      <View style={styles.contentSection}>
        {initialLoading ? (
          <ContactsSkeleton colors={colors} isDarkMode={isDarkMode} />
        ) : usersError ? (
          renderErrorState()
        ) : filteredContacts.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={{ marginVertical: 12 }}>
            <FlatList
              data={contactsWithAds}
              renderItem={renderItem}
              keyExtractor={(item, idx) => ('ad' in item ? item.key : String(item.id))}
              refreshControl={
                <RefreshControl
                  refreshing={false} // Managed by React Query
                  onRefresh={handleRefresh}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                loadingMore ? (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : null
              }
              removeClippedSubviews={false}
            />
          </View>
        )}
      </View>

      {/* User Profile Modal */}
      <Modal
        visible={showUserProfileModal}
        animationType="slide"
        onRequestClose={() => {
          setShowUserProfileModal(false);
          setSelectedUserId(null);
        }}
      >
        {selectedUserId && (
          <UserProfileScreen
            userId={selectedUserId}
            onClose={() => {
              setShowUserProfileModal(false);
              setSelectedUserId(null);
            }}
          />
        )}
      </Modal>
    </View>
  );
}

// Updated styles - add header-specific DND button styles and remove separate container
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Header styles
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  headerIconButton: {
    padding: 6,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  
  missedCallsBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  
  
  blockedUsersBadgeText: {
    position: 'absolute',
    top: 0,
    right: 0,
    color: '#EF4444',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  missedCallsBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  // Remove old DND button styles and add new toggle switch styles
  dndToggleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  
  dndToggleCircle: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  
  dndToggleLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Filter Sections
  filtersSection: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  
  filterGroup: {
    marginBottom: 16,
  },
  
  filterGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginHorizontal: 16,
  },
  
  filterScrollView: {
    paddingHorizontal: 16,
  },
  
  filterScrollContainer: {
    paddingRight: 16,
  },
  
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  
  filterChipText: {
    fontSize: 14,
  },

  // Content Section
  contentSection: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  // Contact Cards
  contactCard: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  
  contactCardContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Avatar Section
  avatarSection: {
    marginRight: 12,
  },
  
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // Contact Info
  contactInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  
  contactId: {
    fontSize: 11,
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  
  contactStatus: {
    fontSize: 13,
    marginBottom: 6,
  },
  
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  
  tagText: {
    fontSize: 11,
    marginLeft: 4,
    flex: 1,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  videoButton: {
    // Specific styles for video button
  },
  
  voiceButton: {
    // Specific styles for voice button
  },

  // Unavailable State
  unavailableContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
  },
  
  unavailableText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Contacts List
  contactsList: {
    paddingVertical: 8,
  },
  
  contactsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  
  contactsCount: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Skeleton
  skeletonContainer: {
    padding: 16,
  },

  // Empty State
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  
  emptyStateMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Error State
  errorStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  
  errorStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  errorStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  
  errorStateMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Add to the styles object at the bottom (around line 800-900)
  chatButton: {
    // Add this new style
    backgroundColor: '#3B82F6',
  },

  // New unread dot styles
  unreadDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFD700', // Gold color
    borderRadius: 10,
    width: 8,
    height: 8,
  },

  // Premium Banner Styles
  premiumContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 0, // Reduced from 16 to 8 to decrease gap with Languages section
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    paddingVertical: 4,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  crownIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  premiumTextContainer: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
  },
  premiumSubtitle: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '500',
  },
  upgradeButton: {
    backgroundColor: 'rgba(184, 134, 11, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000000',
  },
  upgradeButtonText: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 13,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  
  modalContent: {
    flex: 1,
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },

  // Missing searchActiveDot style for the search indicator
  searchActiveDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // TipCall Search Styles
  tipCallSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 12,
  },
  tipCallSearchInput: {
    flex: 1,
    height: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: '#F8F9FA',
  },
  tipCallSearchClearButton: {
    padding: 8,
    marginLeft: 8,
  },

  // Search Indicator Styles
  searchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  searchIndicatorText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
});

// Add this new component for the DND Toggle Switch
const DndToggleSwitch: React.FC<{
  isDndEnabled: boolean;
  onToggle: () => void;
  isLoading: boolean;
  colors: any;
}> = ({ isDndEnabled, onToggle, isLoading, colors }) => {
  const switchWidth = 50;
  const switchHeight = 26;
  const circleSize = 22;
  const circleOffset = 2;

  return (
    <TouchableOpacity
      style={[
        styles.dndToggleContainer,
        {
          width: switchWidth,
          height: switchHeight,
          backgroundColor: isDndEnabled ? '#EF4444' : '#22C55E', // Red for DND ON, Green for DND OFF
          borderRadius: switchHeight / 2,
          opacity: isLoading ? 0.6 : 1,
        }
      ]}
      onPress={onToggle}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <View style={styles.dndToggleLoadingContainer}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      ) : (
        <View
          style={[
            styles.dndToggleCircle,
            {
              width: circleSize,
              height: circleSize,
              borderRadius: circleSize / 2,
              left: isDndEnabled ? circleOffset : switchWidth - circleSize - circleOffset,
            }
          ]}
        >
          <Icon name="moon" size={12} color="#666666" />
        </View>
      )}
    </TouchableOpacity>
  );
};