import React, {useEffect, useState, useCallback, useMemo} from 'react';
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
  Image,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTabNavigator } from '../../contexts/TabNavigatorContext';
import { useDataContext } from '../../providers/DataProvider';
import { useNetInfo } from '@react-native-community/netinfo';
import { useUsers, usePrefetchData } from '../../hooks/useQueries';
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
import messaging from '@react-native-firebase/messaging';
import uuid from 'react-native-uuid';
import CallService from '../../services/CallService';
import WhatsAppCallManager from '../../services/calling/WhatsAppCallManager'; // NEW: WhatsApp-like calling
import RectangleAdComponent from '../../googleads/RectangleAdComponent';
import { RootStackParamList, MainNavigatorParamList } from '../../types/navigation';

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

// Constants for filters
const LANGUAGES: Language[] = [
  {id: 0, name: 'All'},
  {id: 12, name: 'English'},
  {id: 2, name: 'Hindi'},
  {id: 3, name: 'Bengali'},
  {id: 4, name: 'Telugu'},
  {id: 5, name: 'Marathi'},
  {id: 6, name: 'Tamil'},
  {id: 7, name: 'Gujarati'},
  {id: 8, name: 'Kannada'},
];

const CATEGORIES: Category[] = [
  {id: 0, name: 'All'},
  {id: 2, name: 'Look for jobs'},
  {id: 101, name: 'Prepare for govt job'},
  {id: 3, name: 'Prepare for UPSC'},
  {id: 11, name: 'Prepare for jobs'},
  {id: 5, name: 'To learn English'},
  {id: 6, name: 'To learn Hindi'},
  {id: 7, name: 'To learn software'},
  {id: 8, name: 'To learn AI'},
  {id: 13, name: 'To learn something new'},
  {id: 20, name: 'Sports'},
  {id: 29, name: 'Spirituality and Religion'},
  {id: 48, name: 'Astrology'},
];

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
}> = ({ contact, onVideoCall, onVoiceCall, onChat, hasUnreadMessages, colors, isDarkMode }) => {
  const isAvailable = contact.is_available && !contact.dnd && contact.online_status;
  const avatarColor = isAvailable ? colors.success : colors.gray?.[400] || '#9CA3AF';
  
  return (
    <View style={[
      styles.contactCard,
      {
        backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
        borderColor: isDarkMode ? colors.border : '#F1F3F4',
        shadowColor: isDarkMode ? '#000000' : '#000000',
        shadowOpacity: isDarkMode ? 0.3 : 0.08,
      }
    ]}>
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

        {/* Action Buttons */}
        {isAvailable && (
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
        )}

        {!isAvailable && (
          <View style={styles.unavailableContainer}>
            <Text style={[styles.unavailableText, { color: colors.text.tertiary }]}>
              Unavailable
            </Text>
          </View>
        )}
      </View>
    </View>
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

// Update the main component to use Header search properly
export default function TipCallScreen() {
  const route = useRoute<TipCallScreenRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { clearCache } = useDataContext();
  const netInfo = useNetInfo();

  useEffect(() => {
    CallService.resetCallState();
  }, []);

  // Request permissions on component mount
  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === 'android') {
        try {
          const grants = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.CAMERA,
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          ]);
          console.log('[TipCallScreen] Permissions granted:', grants);
          if (
            grants[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED &&
            grants[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED
          ) {
            console.log('[TipCallScreen] Camera and mic permissions granted');
          } else {
            console.warn('[TipCallScreen] Some essential permissions were not granted');
            Alert.alert(
              "Permissions Required",
              "Camera and microphone access are required to make calls. Please grant them from app settings."
            );
          }
        } catch (err) {
          console.warn('[TipCallScreen] Permissions request error:', err);
        }
      }
    };
    requestPermissions();
  }, []);

  // UI state management (decoupled from navigation)
  const [languageFilter, setLanguageFilter] = useState<number>(0);
  const [categoryFilter, setCategoryFilter] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDndEnabled, setIsDndEnabled] = useState<boolean>(false);
  const [isDndLoading, setIsDndLoading] = useState<boolean>(false);
  const [unreadCounts, setUnreadCounts] = useState<{ [key: number]: number }>({});

  const initialCallData = route.params?.initialCallNotificationData;
  const [incomingCallNotification, setIncomingCallNotification] = useState<any>(null);

  // Enhanced data layer using React Query v5
  const filters = { languageFilter, categoryFilter, searchQuery };
  const {
    data: usersData,
    isLoading: usersLoading,
    isFetchingNextPage: usersLoadingMore,
    error: usersError,
    refetch: refreshUsers,
    fetchNextPage: loadMoreUsers,
    hasNextPage: hasMoreUsers,
  } = useUsers(filters, user?.id);

  // Prefetch data for better performance
  // const { prefetchProfile } = usePrefetchData(); // Removed to avoid unnecessary API calls

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
  const loadingMore = usersLoadingMore;
  const hasMore = hasMoreUsers;

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
    if (!loadingMore && hasMore) {
      console.log('[TipCall] Loading more users');
      loadMoreUsers();
    }
  }, [loadingMore, hasMore, loadMoreUsers]);

  const handleLanguageFilter = useCallback((languageId: number) => {
    console.log('[TipCall] Language filter changed to:', languageId);
    setLanguageFilter(languageId);
    // Clear cache for better UX on filter change
    clearCache(`users-${JSON.stringify(filters)}`);
  }, [filters, clearCache]);

  const handleCategoryFilter = useCallback((categoryId: number) => {
    console.log('[TipCall] Category filter changed to:', categoryId);
    setCategoryFilter(categoryId);
    // Clear cache for better UX on filter change
    clearCache(`users-${JSON.stringify(filters)}`);
  }, [filters, clearCache]);

  // Search handler - for header search functionality
  const handleSearch = useCallback((query: string) => {
    console.log('[TipCall] Search query:', query);
    setSearchQuery(query);
  }, []);

  // Clear search handler
  const handleClearSearch = useCallback(() => {
    console.log('[TipCall] Clearing search');
    setSearchQuery('');
  }, []);

  // DND (Do Not Disturb) Toggle Handler
  const handleDndToggle = useCallback(async () => {
    try {
      setIsDndLoading(true);
      
      const newDndState = !isDndEnabled;
      console.log('[TipCall] Toggling DND to:', newDndState);
      
      const updateData: UpdateUserRequest = {
        id: user!.id,
        dnd: newDndState ? 1 : 0, // Convert boolean to number
      };
      
      const response: UpdateUserResponse = await ApiService.updateUser(updateData);
      
      if (response.status) { // UpdateUserResponse has status as boolean
        setIsDndEnabled(newDndState);
        console.log('[TipCall] DND updated successfully');
      } else {
        throw new Error(response.message || 'Failed to update DND status');
      }
    } catch (error: any) {
      console.error('[TipCall] Error toggling DND:', error);
      Alert.alert('Error', 'Failed to update Do Not Disturb status. Please try again.');
    } finally {
      setIsDndLoading(false);
    }
  }, [isDndEnabled, user]);

  const handleStartCall = useCallback(async (recipient: Contact, callType: 'voice' | 'video') => {
    if (!user || !recipient.name) {
      Alert.alert("Error", "User or recipient information is missing.");
      return;
    }

    // Prevent multiple rapid call attempts
    if (CallService.activeCall) {
      Alert.alert("Call In Progress", "You are already in a call.");
      return;
    }

    try {
      console.log('[TipCall] Starting WhatsApp-like call to:', recipient.name, 'Type:', callType);
      
      // Initialize WhatsApp Call Manager if not already done
      const whatsAppCallManager = WhatsAppCallManager.getInstance();
      const initialized = await whatsAppCallManager.initialize();
      
      if (!initialized) {
        Alert.alert("Call Error", "Unable to initialize calling system. Please try again.");
        return;
      }
      
      // Start the call with WhatsApp Call Manager
      const callData = await whatsAppCallManager.startOutgoingCall(
        recipient.id.toString(),
        recipient.name,
        callType,
        user.name || 'User',
        user.id.toString()
      );
      
      if (callData) {
        console.log('[TipCall] WhatsApp-like call initiated successfully:', callData.callId);
        // Navigation will be handled automatically by WhatsApp Call Manager
      } else {
        console.error('[TipCall] WhatsApp Call Manager failed to start the call.');
        Alert.alert('Call Failed', 'Unable to start the call. Please check your connection and try again.');
      }
    } catch (error) {
      console.error('[TipCall] Error in handleStartCall:', error);
      Alert.alert('Call Error', 'An unexpected error occurred while starting the call. Please try again.');
    }
  }, [user]);

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
    languageFilter,
    categoryFilter
  });

  const contactsWithAds = getContactsWithAds(filteredContacts);

  const renderItem = ({ item }: { item: Contact | { ad: true, key: string } }) => {
    if ('ad' in item) {
      return <RectangleAdComponent key={item.key} />;
    }
    return renderContactItem({ item });
  };

  return (
    <ScreenTransition animationType="fade">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar backgroundColor={colors.background} barStyle={isDarkMode ? "light-content" : "dark-content"} />
        
        {/* Updated Header with DND button in the same row */}
        <Header 
          title="Tip Call" 
          showWallet={false}
          showSearch={false}
          rightComponent={
            <View style={styles.headerRightContainer}>
              {/* Search Icon - added to the left */}
              <TouchableOpacity
                onPress={() => {
                  // You can implement search modal here or use a different approach
                  console.log('[TipCall] Search icon pressed');
                }}
                style={[styles.headerIconButton, { marginRight: 12 }]}
              >
                <Icon name="search" size={20} color={colors.text.secondary} />
              </TouchableOpacity>

              {/* Notifications Icon - moved right */}
              <TouchableOpacity
                onPress={() => navigation.navigate('Notifications')}
                style={[styles.headerIconButton, { marginRight: 8 }]}
              >
                <Icon name="bell" size={20} color={colors.text.secondary} />
                <View style={[styles.notificationBadge, { backgroundColor: colors.primary }]} />
              </TouchableOpacity>

              {/* DND Button - rightmost */}
              <TouchableOpacity
                style={[
                  styles.dndButtonHeader,
                  {
                    backgroundColor: isDndEnabled 
                      ? colors.danger || '#EF4444' 
                      : colors.success || '#22C55E',
                    opacity: isDndLoading ? 0.6 : 1,
                  }
                ]}
                onPress={handleDndToggle}
                disabled={isDndLoading}
                activeOpacity={0.8}
              >
                {isDndLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon 
                      name={isDndEnabled ? "bell-off" : "bell"} 
                      size={14} 
                      color="#FFFFFF" 
                    />
                    <Text style={styles.dndButtonHeaderText}>
                      {isDndEnabled ? 'DND' : 'Available'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          }
        />

        {/* Enhanced Filters Section */}
        <View style={[styles.filtersSection, { backgroundColor: colors.background }]}>
          {/* Language Filter */}
          <View style={styles.filterGroup}>
            <Text style={[styles.filterGroupTitle, { color: colors.text.primary }]}>
              Languages
            </Text>
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
              />
            </View>
          )}
        </View>
      </View>
    </ScreenTransition>
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
  
  // Original DND button (remove or keep as backup)
  dndButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 80,
    justifyContent: 'center',
    gap: 4,
  },
  
  // New header-specific DND button styles
  dndButtonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 70,
    justifyContent: 'center',
    gap: 3,
  },
  
  dndButtonHeaderText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  
  dndButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  
  dndStatusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  
  // Remove DND container since it's now in header
  // dndContainer: {
  //   flexDirection: 'row',
  //   justifyContent: 'flex-end',
  //   paddingHorizontal: 16,
  //   paddingVertical: 8,
  //   borderBottomWidth: StyleSheet.hairlineWidth,
  //   borderBottomColor: '#E5E7EB',
  // },
  
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
});