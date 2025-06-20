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
  Image,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTabNavigator } from '../../contexts/TabNavigatorContext';
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
import {
  initiateVideoSDKCall,
} from '../../helpers/CallHelper';
import CallKeepService from '../../services/CallKeepService';
import uuid from 'react-native-uuid';
import { useWallet } from '../../contexts/WalletContext';

// Define navigation stack param list
type RootStackParamList = {
  TipCall: { initialCallNotificationData?: any } | undefined;
  Login: undefined;
  Profile: { userId: number };
  Meeting: {
    meetingId: string;
    token: string;
    callType: 'voice' | 'video';
    displayName: string;
    isInitiator?: boolean;
    recipientName?: string;
  };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type TipCallScreenRouteProp = RouteProp<RootStackParamList, 'TipCall'>;

// Add local types for filter constants only
interface Language { id: number; name: string; }
interface Category { id: number; name: string; }

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
        backgroundColor: isSelected 
          ? colors.primary 
          : isDarkMode 
            ? colors.card 
            : '#F8F9FA',
        borderColor: isSelected 
          ? colors.primary 
          : isDarkMode 
            ? colors.border 
            : '#E9ECEF',
      }
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text
      style={[
        styles.filterChipText,
        {
          color: isSelected 
            ? '#FFFFFF' 
            : colors.text.primary,
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
  colors: any;
  isDarkMode: boolean;
}> = ({ contact, onVideoCall, onVoiceCall, colors, isDarkMode }) => {
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

// Update the main component to use Header search properly
export default function TipCallScreen() {
  const route = useRoute<TipCallScreenRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { balance, isLoading } = useWallet();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  const [languageFilter, setLanguageFilter] = useState<string>('0');
  const [categoryFilter, setCategoryFilter] = useState<string>('0');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Add DND state
  const [isDndEnabled, setIsDndEnabled] = useState<boolean>(false);
  const [isDndLoading, setIsDndLoading] = useState<boolean>(false);

  const initialCallData = route.params?.initialCallNotificationData;
  const [incomingCallNotification, setIncomingCallNotification] = useState<any>(null);

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

  // Apply search filter only when search query changes
  useEffect(() => {
    console.log('[TipCall] Applying search filter. Contacts:', contacts.length, 'Search:', searchQuery);
    const filtered = applySearchFilter(searchQuery, contacts);
    setFilteredContacts(filtered);
    console.log('[TipCall] Filtered contacts:', filtered.length);
  }, [contacts, searchQuery, applySearchFilter]);

  // Search handler - for header search functionality
  const handleSearch = useCallback((query: any) => {
    setSearchQuery(typeof query === 'string' ? query : '');
  }, []);

  // Clear search handler
  const handleClearSearch = useCallback(() => {
    console.log('[TipCall] Clearing search');
    setSearchQuery('');
  }, []);

  // Fetch contacts function - removed dependencies to prevent auto-calls
  const fetchContacts = useCallback(async (showLoading = true) => {
    console.log('[TipCall] fetchContacts called with showLoading:', showLoading);
    
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    
    try {
      if (!user || !user.id) {
        throw new Error('User not authenticated');
      }

      const requestData: UserListRequest = {
        id: 0,
        page: 1,
        limit: 50,
        language: languageFilter === '0' ? [] : [parseInt(languageFilter)],
        interest: categoryFilter === '0' ? [] : [parseInt(categoryFilter)],
        user_id: null,
        search_by_name: "",
        loggined_user_id: user.id,
        sortBy: {}
      };

      console.log('[TipCall] Fetching contacts with payload:', JSON.stringify(requestData, null, 2));
      
      const response = await ApiService.getAllUsersList(requestData);
      console.log('[TipCall] Contacts API response status:', response?.status);
      console.log('[TipCall] Contacts API response data length:', response?.data?.length);
      
      if (response && response.status && response.data && Array.isArray(response.data)) {
        const allContacts = response.data.filter(contact => contact.id !== user.id);
        console.log('[TipCall] Setting contacts. Total:', response.data.length, 'Filtered:', allContacts.length);
        setContacts(allContacts);
      } else {
        console.warn('[TipCall] No valid data found in response:', response);
        setContacts([]);
      }
    } catch (err) {
      console.error('[TipCall] Error fetching contacts:', err);
      setError('Failed to load contacts. Please try again later.');
      setContacts([]);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []); // Remove all dependencies to prevent auto-calls

  // Initial fetch - only when component mounts and user is available
  useEffect(() => {
    if (user && user.id) {
      console.log('[TipCall] Initial fetch triggered');
      fetchContacts();
    }
  }, [user?.id]); // Only depend on user.id, not the entire user object

  const handleRefresh = useCallback(() => {
    console.log('[TipCall] Refresh triggered');
    setRefreshing(true);
    
    // Create a new fetchContacts call with current filter values
    const fetchWithCurrentFilters = async () => {
      try {
        if (!user || !user.id) {
          throw new Error('User not authenticated');
        }

        const requestData: UserListRequest = {
          id: 0,
          page: 1,
          limit: 50,
          language: languageFilter === '0' ? [] : [parseInt(languageFilter)],
          interest: categoryFilter === '0' ? [] : [parseInt(categoryFilter)],
          user_id: null,
          search_by_name: "",
          loggined_user_id: user.id,
          sortBy: {}
        };

        const response = await ApiService.getAllUsersList(requestData);
        
        if (response && response.status && response.data && Array.isArray(response.data)) {
          const allContacts = response.data.filter(contact => contact.id !== user.id);
          setContacts(allContacts);
        } else {
          setContacts([]);
        }
      } catch (err) {
        console.error('[TipCall] Error refreshing contacts:', err);
        setError('Failed to refresh contacts.');
      }
    };

    fetchWithCurrentFilters().finally(() => {
      setRefreshing(false);
    });
  }, [user, languageFilter, categoryFilter]);

  // Filter change handlers - these will trigger API calls
  const handleLanguageFilterChange = useCallback((languageId: string) => {
    console.log('[TipCall] Language filter changed to:', languageId);
    setLanguageFilter(languageId);
    
    // Manually fetch with new language filter
    const fetchWithNewLanguage = async () => {
      try {
        if (!user || !user.id) return;

        setLoading(true);
        const requestData: UserListRequest = {
          id: 0,
          page: 1,
          limit: 50,
          language: languageId === '0' ? [] : [parseInt(languageId)],
          interest: categoryFilter === '0' ? [] : [parseInt(categoryFilter)],
          user_id: null,
          search_by_name: "",
          loggined_user_id: user.id,
          sortBy: {}
        };

        const response = await ApiService.getAllUsersList(requestData);
        
        if (response && response.status && response.data && Array.isArray(response.data)) {
          const allContacts = response.data.filter(contact => contact.id !== user.id);
          setContacts(allContacts);
        } else {
          setContacts([]);
        }
      } catch (err) {
        console.error('[TipCall] Error fetching contacts with language filter:', err);
        setError('Failed to load contacts with selected language.');
      } finally {
        setLoading(false);
      }
    };

    fetchWithNewLanguage();
  }, [user, categoryFilter]);

  const handleCategoryFilterChange = useCallback((categoryId: string) => {
    console.log('[TipCall] Category filter changed to:', categoryId);
    setCategoryFilter(categoryId);
    
    // Manually fetch with new category filter
    const fetchWithNewCategory = async () => {
      try {
        if (!user || !user.id) return;

        setLoading(true);
        const requestData: UserListRequest = {
          id: 0,
          page: 1,
          limit: 50,
          language: languageFilter === '0' ? [] : [parseInt(languageFilter)],
          interest: categoryId === '0' ? [] : [parseInt(categoryId)],
          user_id: null,
          search_by_name: "",
          loggined_user_id: user.id,
          sortBy: {}
        };

        const response = await ApiService.getAllUsersList(requestData);
        
        if (response && response.status && response.data && Array.isArray(response.data)) {
          const allContacts = response.data.filter(contact => contact.id !== user.id);
          setContacts(allContacts);
        } else {
          setContacts([]);
        }
      } catch (err) {
        console.error('[TipCall] Error fetching contacts with category filter:', err);
        setError('Failed to load contacts with selected interest.');
      } finally {
        setLoading(false);
      }
    };

    fetchWithNewCategory();
  }, [user, languageFilter]);

  const handleVideoSDKCall = useCallback(async (recipient: Contact, callTypeToInitiate: 'voice' | 'video') => {
    if (!user || !user.id || !recipient || !recipient.id) {
      Alert.alert("Error", "User or recipient information is missing.");
      return;
    }
    
    console.log(`[TipCall] Initiating ${callTypeToInitiate} call to ${recipient.name || recipient.id}`);
    setError(null);

    try {
      // ✅ FIXED: Use react-native-uuid instead of uuid
      const callKeepId = uuid.v4() as string;
      
      const callKeepService = CallKeepService.getInstance();
      await callKeepService.startOutgoingCall(
        callKeepId,
        recipient.name || "Contact",
        callTypeToInitiate === 'video' // hasVideo parameter
      );

      const result = await initiateVideoSDKCall(
        recipient.id.toString(),
        callTypeToInitiate,
        user.name || "User"
      );

      if (result.success && result.meetingId && result.token) {
        console.log(`[TipCall] Call initiated successfully. Meeting ID: ${result.meetingId}`);
        
        navigation.navigate('Meeting', {
          meetingId: result.meetingId,
          token: result.token,
          callType: callTypeToInitiate,
          displayName: user.name || "Me",
          isInitiator: true,
          recipientName: recipient.name || "Participant",
        });
      } else {
        await callKeepService.endCall(callKeepId);
        Alert.alert('Call Failed', result.error || 'Could not initiate the call. Please try again.');
      }
    } catch (error: any) {
      console.error('[TipCall] Error in handleVideoSDKCall:', error);
      Alert.alert('Call Error', error.message || 'An unexpected error occurred.');
    }
  }, [user, navigation]);

  const handleDndToggle = useCallback(async () => {
    if (!user || !user.id) {
      return;
    }

    setIsDndLoading(true);
    const newDndState = !isDndEnabled;

    try {
      const updateData: UpdateUserRequest = {
        id: user.id,
        dnd: newDndState ? 1 : 0,
      };

      console.log('[TipCall] Updating DND status:', updateData);
      const response = await ApiService.updateUser(updateData);

      if (response.status) {
        setIsDndEnabled(newDndState);
        console.log('[TipCall] DND status updated successfully:', newDndState);
      } else {
        console.error('[TipCall] Failed to update DND status:', response.message);
      }
    } catch (error: any) {
      console.error('[TipCall] Error updating DND status:', error);
    } finally {
      setIsDndLoading(false);
    }
  }, [user, isDndEnabled]);

  // Render contact item
  const renderContactItem = ({ item }: { item: Contact }) => (
    <ContactCard
      contact={item}
      onVideoCall={() => handleVideoSDKCall(item, 'video')}
      onVoiceCall={() => handleVideoSDKCall(item, 'voice')}
      colors={colors}
      isDarkMode={isDarkMode}
    />
  );

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
      <View style={[styles.errorStateIcon, { backgroundColor: '#FEE2E2' }]}>
        <Icon name="wifi-off" size={40} color="#EF4444" />
      </View>
      <Text style={[styles.errorStateTitle, { color: colors.text.primary }]}>
        Connection Error
      </Text>
      <Text style={[styles.errorStateMessage, { color: colors.text.secondary }]}>
        {error}
      </Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: colors.primary }]}
        onPress={() => fetchContacts()}
        activeOpacity={0.8}
      >
        <Icon name="refresh-cw" size={16} color="#FFFFFF" />
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  console.log('[TipCall] Render state:', {
    loading,
    error: !!error,
    contactsLength: contacts.length,
    filteredContactsLength: filteredContacts.length,
    searchQuery,
    languageFilter,
    categoryFilter
  });

  return (
    <ScreenTransition animationType="fade">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar backgroundColor={colors.background} barStyle={isDarkMode ? "light-content" : "dark-content"} />
        
        <Header 
          title="Tip Call" 
          showWallet={false}
          showSearch={false}
          onSearchQueryChange={handleSearch}
          onSearchSubmit={handleSearch}
          rightComponent={
            <View style={[styles.headerRow, { justifyContent: 'flex-end', alignItems: 'center', flex: 1 }]}> 
              <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0, minWidth: 0, maxWidth: 110 }}>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8, paddingLeft: 2, flexShrink: 0 }}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('Wallet' as never)}
                >
                  <Icon name="credit-card" size={20} color={colors.primary} />
                  <Text style={{ marginLeft: 4, color: colors.primary, fontWeight: 'bold', fontSize: 16, maxWidth: 60 }} numberOfLines={1} ellipsizeMode="tail">
                    ₹{isLoading ? balance : balance}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 }}>
                <TouchableOpacity
                  onPress={() => {
                    // You can implement search modal here or use a different approach
                    console.log('[TipCall] Search icon pressed');
                  }}
                  style={[styles.headerIconButton, { marginRight: 4 }]}
                >
                  <Icon name="search" size={20} color={colors.text.secondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.dndButtonHeader,
                    {
                      backgroundColor: isDndEnabled 
                        ? '#EF4444'
                        : (colors.success || '#22C55E'),
                      opacity: isDndLoading ? 0.6 : 1,
                      marginRight: 4,
                      paddingHorizontal: 6,
                      minWidth: 0,
                    }
                  ]}
                  onPress={handleDndToggle}
                  disabled={isDndLoading}
                  activeOpacity={0.8}
                >
                  {isDndLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Icon name={isDndEnabled ? "bell-off" : "bell"} size={16} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
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
                  isSelected={languageFilter === lang.id.toString()}
                  onPress={() => handleLanguageFilterChange(lang.id.toString())}
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
                  isSelected={categoryFilter === category.id.toString()}
                  onPress={() => handleCategoryFilterChange(category.id.toString())}
                  colors={colors}
                  isDarkMode={isDarkMode}
                />
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          {loading ? (
            <ContactsSkeleton colors={colors} isDarkMode={isDarkMode} />
          ) : error ? (
            renderErrorState()
          ) : filteredContacts.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={filteredContacts}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderContactItem}
              contentContainerStyle={styles.contactsList}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                  progressBackgroundColor={colors.card}
                />
              }
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={() => (
                <View style={styles.contactsHeader}>
                  <Text style={[styles.contactsCount, { color: colors.text.secondary }]}>
                    {searchQuery ? (
                      <>
                        {filteredContacts.length} result{filteredContacts.length !== 1 ? 's' : ''} for "{searchQuery}"
                        {isDndEnabled && (
                          <Text style={[styles.dndStatusText, { color: '#EF4444' }]}>
                            {' • DND Active'}
                          </Text>
                        )}
                      </>
                    ) : (
                      <>
                        {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''} available
                        {isDndEnabled && (
                          <Text style={[styles.dndStatusText, { color: '#EF4444' }]}>
                            {' • DND Active'}
                          </Text>
                        )}
                      </>
                    )}
                  </Text>
                </View>
              )}
            />
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

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
});