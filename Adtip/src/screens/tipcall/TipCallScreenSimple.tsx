import React, { useCallback, useEffect, useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Animated,
  Modal,
} from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { useUsers } from '../../hooks/useQueries'
import { Contact } from '../../types/api'
import Header from '../../components/common/Header'
import Icon from 'react-native-vector-icons/Feather'
import { useBlocklist } from '../../hooks/useBlocklist'
import { useMissedCallsCount } from '../../hooks/useMissedCalls'
import { useWallet } from '../../hooks/useWallet'
import { BanknoteArrowUp, Ban, MoreVertical } from 'lucide-react-native'
import { MainNavigatorParamList } from '../../types/navigation'
import { CallType } from '../../stores/callStoreSimplified'
import debounce from 'lodash.debounce'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import LinearGradient from 'react-native-linear-gradient'
import PremiumPopup from '../../components/common/PremiumPopup'
import PremiumCallRateModal from '../../components/modals/PremiumCallRateModal'
import RectangleAdComponent from '../../googleads/RectangleAdComponent'
import UserProfileScreen from '../profile/UserProfileScreen'
import DndToggleSwitch from '../../components/common/DndToggleSwitch'
import PermissionManagerService from '../../services/PermissionManagerService'
import ApiService from '../../services/ApiService'

// Import our new call controller and billing service
import CallController from '../../services/calling/CallController'
import CallBillingService from '../../services/calling/CallBillingService'

/**
 * Elegant and minimalistic ContactCard with professional design
 */
const ContactCard = ({
  contact,
  onVideoCall,
  onVoiceCall,
  onChat,
  hasUnreadMessages,
  colors,
  isDarkMode,
  onProfilePress,
  onBlockUser,
}: {
  contact: Contact
  onVideoCall: () => void
  onVoiceCall: () => void
  onChat: () => void
  hasUnreadMessages: boolean
  colors: any
  isDarkMode: boolean
  onProfilePress?: () => void
  onBlockUser?: () => void
}) => {
  const isOnline = contact.online_status
  const avatarColor = isOnline ? colors.success : colors.text.secondary

  return (
    <TouchableOpacity
      style={[
        styles.contactCard,
        {
          backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
          borderColor: isDarkMode ? colors.border : '#F0F0F0',
          shadowColor: isDarkMode ? '#000000' : '#000000',
        },
      ]}
      onPress={onProfilePress}
      activeOpacity={0.96}
    >
      {/* Subtle top accent for online users */}
      {isOnline && (
        <View style={[styles.onlineAccent, { backgroundColor: colors.success }]} />
      )}

      <View style={styles.contactCardContent}>
        {/* Main contact information */}
        <View style={styles.contactHeader}>
          {/* Minimalist Avatar */}
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarText}>
                {contact.name ? contact.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            {isOnline && (
              <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
            )}
          </View>

          {/* Contact details with clean typography */}
          <View style={styles.contactInfo}>
            <Text
              style={[styles.contactName, { color: colors.text.primary }]}
              numberOfLines={1}
            >
              {contact.name || 'Unknown User'}
            </Text>
            <Text
              style={[styles.contactStatus, { color: colors.text.secondary }]}
              numberOfLines={1}
            >
              {isOnline
                ? 'Online now'
                : contact.dnd
                ? 'Do not disturb'
                : 'Offline'}
            </Text>
          </View>
        </View>

        {/* Plain tags section */}
        {((contact.languages && contact.languages.length > 0) ||
          (contact.interests && contact.interests.length > 0)) && (
          <View style={styles.tagsSection}>
            {contact.languages && contact.languages.length > 0 && (
              <Text style={[styles.tagLabel, { color: colors.text.tertiary }]} numberOfLines={1}>
                {contact.languages.slice(0, 2).map(lang => lang.name).join(', ')}
                {contact.languages.length > 2 && ` +${contact.languages.length - 2}`}
              </Text>
            )}
            {contact.interests && contact.interests.length > 0 && (
              <Text style={[styles.tagLabel, { color: colors.text.tertiary }]} numberOfLines={1}>
                {contact.interests.slice(0, 2).map(interest => interest.name).join(', ')}
                {contact.interests.length > 2 && ` +${contact.interests.length - 2}`}
              </Text>
            )}
          </View>
        )}

        {/* Clean outline action buttons */}
        <View style={styles.actionRow}>
          {/* Left group - main actions */}
          <View style={styles.actionGroup}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onVideoCall}
              activeOpacity={0.6}
            >
              <Icon name="video" size={20} color={colors.text.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={onVoiceCall}
              activeOpacity={0.6}
            >
              <Icon name="phone" size={20} color={colors.text.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={onChat}
              activeOpacity={0.6}
            >
              <Icon name="message-circle" size={20} color={colors.text.primary} />
              {hasUnreadMessages && (
                <View style={[styles.notificationDot, { backgroundColor: colors.error }]} />
              )}
            </TouchableOpacity>
          </View>

          {/* Right side - secondary action */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onBlockUser}
            activeOpacity={0.6}
          >
            <Ban size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )
}

// ------- FILTER CONSTANTS & CHIP COMPONENT -------

interface LanguageOption { id: number; name: string }
interface CategoryOption { id: number; name: string }

const LANGUAGES: LanguageOption[] = [
  { id: 0, name: 'All' },
  { id: 1, name: 'English' },
  { id: 2, name: 'Hindi' },
  { id: 3, name: 'Bengali' },
  { id: 4, name: 'Telugu' },
  { id: 5, name: 'Marathi' },
  { id: 6, name: 'Tamil' },
  { id: 7, name: 'Gujarati' },
  { id: 8, name: 'Kannada' },
]

const CATEGORIES: CategoryOption[] = [
  { id: 0, name: 'All' },
  { id: 2, name: 'Look for jobs' },
  { id: 101, name: 'Prepare for govt job' },
  { id: 3, name: 'Prepare for UPSC' },
  { id: 11, name: 'Prepare for jobs' },
  { id: 5, name: 'To learn English' },
  { id: 6, name: 'To learn Hindi' },
  { id: 7, name: 'To learn software' },
  { id: 8, name: 'To learn AI' },
  { id: 13, name: 'To learn something new' },
  { id: 20, name: 'Sports' },
  { id: 29, name: 'Spirituality & Religion' },
  { id: 48, name: 'Astrology' },
]

// Premium Banner Component
const PremiumBanner = ({ colors, isDarkMode, onUpgradePress }: { 
  colors: any, 
  isDarkMode: boolean, 
  onUpgradePress: () => void 
}) => (
  <LinearGradient
    colors={isDarkMode ? ['#1F2937', '#374151'] : ['#FEF3C7', '#FDE68A']}
    style={styles.premiumContainer}
  >
    <View style={styles.premiumBanner}>
      <Text style={styles.crownIcon}>👑</Text>
      <View style={styles.premiumTextContainer}>
        <Text style={[styles.premiumTitle, { color: isDarkMode ? '#F9FAFB' : '#000000' }]}>
          Upgrade to Premium
        </Text>
        <Text style={[styles.premiumSubtitle, { color: isDarkMode ? '#D1D5DB' : '#000000' }]}>
          Unlimited calls, priority support & more
        </Text>
      </View>
      <TouchableOpacity 
        style={[styles.upgradeButton, { borderColor: isDarkMode ? '#F9FAFB' : '#000000' }]}
        onPress={onUpgradePress}
      >
        <Text style={[styles.upgradeButtonText, { color: isDarkMode ? '#F9FAFB' : '#000000' }]}>
          Upgrade
        </Text>
      </TouchableOpacity>
    </View>
  </LinearGradient>
)

const FilterChip = ({
  label,
  isSelected,
  onPress,
  colors,
  isDarkMode,
}: {
  label: string
  isSelected: boolean
  onPress: () => void
  colors: any
  isDarkMode: boolean
}) => (
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
        shadowColor: isSelected ? colors.primary : 'transparent',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isSelected ? 0.3 : 0,
        shadowRadius: 4,
        elevation: isSelected ? 3 : 1,
      },
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
        },
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
)

// Enhanced Search Bar Component
const TipCallSearchBar = ({
  value,
  onChangeText,
  onBack,
  colors,
}: {
  value: string
  onChangeText: (text: string) => void
  onBack: () => void
  colors: any
}) => (
  <View
    style={[
      styles.searchBarContainer,
      {
        backgroundColor: colors.background,
        borderBottomColor: colors.border,
      }
    ]}
  >
    <TouchableOpacity onPress={onBack} style={styles.searchBackButton}>
      <Icon name="arrow-left" size={24} color={colors.text.primary} />
    </TouchableOpacity>
    <TextInput
      style={[
        styles.searchInput,
        {
          backgroundColor: colors.cardSecondary || colors.card,
          color: colors.text.primary,
        }
      ]}
      placeholder="Search users..."
      placeholderTextColor={colors.text.secondary}
      value={value}
      onChangeText={onChangeText}
      autoFocus
      returnKeyType="search"
    />
  </View>
)

const TipCallScreenSimple = () => {
  const { colors, isDarkMode } = useTheme()
  const { user } = useAuth()
  const { balance, isPremium } = useWallet()
  const navigation = useNavigation<NativeStackNavigationProp<MainNavigatorParamList>>()
  const { blockUser, isUserBlocked } = useBlocklist()
  const queryClient = useQueryClient()

  // -------------------- Premium --------------------
  const [premiumActive, setPremiumActive] = useState(false)
  const [showPremiumPopup, setShowPremiumPopup] = useState(false)
  const [showPremiumCallRateModal, setShowPremiumCallRateModal] = useState(false)
  const [pendingCallData, setPendingCallData] = useState<{
    recipientId: string;
    recipientName: string;
    callType: CallType;
  } | null>(null)
  const { data: premiumData, isLoading: premiumLoading } = useQuery({
    queryKey: ['premium', user?.id],
    queryFn: () => (user?.id ? ApiService.checkPremium(user.id) : null),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  })

  // Update premium state when data changes
  useEffect(() => {
    if (premiumData) {
      const active = !premiumData.is_premium_expired
      setPremiumActive(active)
    }
  }, [premiumData])
  // --------------------------------------------------

  // -------------------- DND -------------------------
  const [isDndEnabled, setIsDndEnabled] = useState<boolean>(!!user?.dnd)
  const [isDndLoading, setIsDndLoading] = useState(false)
  const updateUserMutation = useMutation({
    mutationFn: (data: any) => ApiService.updateUser(data),
    onSuccess: (_data: any, variables: any) => {
      console.log('[TipCallScreenSimple] DND update successful:', _data, 'Variables:', variables)
      setIsDndEnabled(!!variables.dnd)
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
    },
    onError: (error: any) => {
      console.error('[TipCallScreenSimple] DND update failed:', error)
      Alert.alert('Error', 'Failed to update DND status')
    },
  })

  const handleDndToggle = useCallback(() => {
    console.log('[TipCallScreenSimple] DND toggle initiated. Current state:', isDndEnabled, 'User ID:', user?.id)

    if (!user?.id) {
      console.error('[TipCallScreenSimple] No user ID available for DND toggle')
      Alert.alert('Error', 'User not found. Please try again.')
      return
    }

    const newState = !isDndEnabled
    const statusTxt = newState ? 'ON' : 'OFF'

    console.log('[TipCallScreenSimple] Showing DND confirmation dialog for state:', newState)

    Alert.alert(
      `Turn DND ${statusTxt}?`,
      newState ? 'You will not receive any incoming call notifications.' : 'You will start receiving incoming call notifications.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Turn ${statusTxt}`,
          onPress: () => {
            console.log('[TipCallScreenSimple] User confirmed DND toggle. Making API call...')
            setIsDndLoading(true)

            const updateData = { id: user.id, dnd: newState ? 1 : 0 }
            console.log('[TipCallScreenSimple] Calling updateUserMutation.mutate with data:', updateData)

            updateUserMutation.mutate(
              updateData,
              {
                onSettled: () => {
                  console.log('[TipCallScreenSimple] DND mutation settled')
                  setIsDndLoading(false)
                },
              }
            )
          },
        },
      ],
    )
  }, [isDndEnabled, updateUserMutation, user])
  // --------------------------------------------------

  // ------------------ Dynamic Filters ---------------
  const [languages, setLanguages] = useState<LanguageOption[]>([{ id: 0, name: 'All' }])
  const [categories, setCategories] = useState<CategoryOption[]>([{ id: 0, name: 'All' }])

  const { data: languagesData } = useQuery({
    queryKey: ['languages'],
    queryFn: ApiService.getLanguages,
    staleTime: 24 * 60 * 60 * 1000,
  })

  const { data: interestsData } = useQuery({
    queryKey: ['interests'],
    queryFn: ApiService.getInterests,
    staleTime: 24 * 60 * 60 * 1000,
  })

  // Update languages when data changes
  useEffect(() => {
    if (languagesData?.data) {
      setLanguages([{ id: 0, name: 'All' }, ...languagesData.data.map((l: any) => ({ id: l.id, name: l.name }))])
    }
  }, [languagesData])

  // Update categories when data changes
  useEffect(() => {
    if (interestsData?.data) {
      setCategories([{ id: 0, name: 'All' }, ...interestsData.data.map((c: any) => ({ id: c.id, name: c.name }))])
    }
  }, [interestsData])
  // --------------------------------------------------

  // ----------------- Unread Counts ------------------
  const [unreadCounts, setUnreadCounts] = useState<{ [key: number]: number }>({})
  const fetchUnreadCounts = useCallback(async () => {
    if (!user?.id) return
    try {
      const response = await ApiService.getUnreadMessageCount(user.id)
      const counts: { [key: number]: number } = {}
      if (response?.data?.conversations) {
        response.data.conversations.forEach((conv: any) => {
          counts[conv.peerId] = conv.unread || 0
        })
      }
      setUnreadCounts(counts)
    } catch (e) {
      console.log('Unread count error', e)
    }
  }, [user?.id])

  useFocusEffect(
    useCallback(() => {
      fetchUnreadCounts()
    }, [fetchUnreadCounts])
  )
  // --------------------------------------------------

  // -------------- User Profile Modal ----------------
  const [showUserProfileModal, setShowUserProfileModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const openProfile = useCallback((uid: number) => {
    setSelectedUserId(uid)
    setShowUserProfileModal(true)
  }, [])
  // --------------------------------------------------

  // -------------- Blocklist Badge -------------------
  const { blockedUsersCount, refreshBlocklist } = useBlocklist()
  useFocusEffect(
    useCallback(() => {
      refreshBlocklist()
    }, [refreshBlocklist])
  )
  // --------------------------------------------------

  // --------------- Ad Insertion Helper --------------
  const getContactsWithAds = (list: Contact[]) => {
    const arr: (Contact | { ad: true; key: string })[] = []
    list.forEach((c, idx) => {
      arr.push(c)
      if ((idx + 1) % 3 === 0) arr.push({ ad: true, key: 'ad-' + idx })
    })
    return arr
  }
  // --------------------------------------------------

  // Filters & Search state
  const [languageFilter, setLanguageFilter] = useState<number>(0)
  const [categoryFilter, setCategoryFilter] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  
  // Live search state
  const [isSearchActive, setIsSearchActive] = useState(false)
  const [liveSearchQuery, setLiveSearchQuery] = useState('')

  // Debounce search for main query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400)
    return () => clearTimeout(t)
  }, [searchQuery])

  // Debounced setter for live search
  const debouncedSetLiveSearchQuery = useMemo(
    () => debounce((q: string) => setLiveSearchQuery(q), 300), 
    []
  )

  // Handlers
  const handleLanguageFilter = useCallback((id: number) => setLanguageFilter(id), [])
  const handleCategoryFilter = useCallback((id: number) => setCategoryFilter(id), [])

  // Main contacts data
  const {
    data: usersData,
    isLoading: usersLoading,
    refetch: refreshUsers,
  } = useUsers(
    {
      languageFilter,
      categoryFilter,
      searchQuery: debouncedSearch,
    },
    user?.id,
  )

  // Live search data (only when search is active)
  const {
    data: liveSearchData,
    isLoading: liveSearchLoading,
  } = useUsers(
    {
      languageFilter,
      categoryFilter,
      searchQuery: liveSearchQuery,
    },
    user?.id,
  )

  // Create service instances
  const callController = CallController.getInstance()
  const billingService = CallBillingService.getInstance()

  // Transform users data
  const contacts = usersData?.pages?.flatMap((page) => page?.data || []) || []
  const filteredContacts = contacts.filter(
    (contact) =>
      contact.id !== user?.id &&
      !isUserBlocked(contact.id.toString()) &&
      (debouncedSearch === '' || contact.name?.toLowerCase().includes(debouncedSearch.toLowerCase()))
  )

  const contactsWithAds = useMemo(() => getContactsWithAds(filteredContacts), [filteredContacts])

  // Transform live search results
  const liveSearchContacts = useMemo(() => {
    const allUsers = liveSearchData?.pages?.flatMap(page => page?.data || []) || []
    return allUsers.filter(contact => contact.id !== user?.id && !isUserBlocked(contact.id.toString()))
  }, [liveSearchData, user?.id, isUserBlocked])

  // Handle call initiation with billing check
  const handleStartCall = useCallback(
    async (recipientId: string, recipientName: string, callType: CallType) => {
      try {
        // Check if user is premium - if not, show premium rate modal first
        if (!isPremium) {
          console.log('[TipCallScreen] Non-premium user, showing rate comparison modal')
          setPendingCallData({ recipientId, recipientName, callType })
          setShowPremiumCallRateModal(true)
          return
        }

        // First, request runtime permissions for camera and microphone
        console.log('[TipCallScreen] Requesting call permissions for', callType, 'call')
        const permissionManager = PermissionManagerService.getInstance()
        const permissionResult = await permissionManager.requestCallPermissions(callType === 'video')

        if (!permissionResult.microphone) {
          Alert.alert(
            'Permission Required',
            'Microphone permission is required to make calls. Please grant permission in settings.',
            [{ text: 'OK' }]
          )
          return
        }

        if (callType === 'video' && !permissionResult.camera) {
          Alert.alert(
            'Permission Required',
            'Camera permission is required to make video calls. Please grant permission in settings.',
            [{ text: 'OK' }]
          )
          return
        }

        console.log('[TipCallScreen] Call permissions granted:', permissionResult)

        // Convert balance to number for calculations
        const numericBalance = parseFloat(balance || '0')

        // Check minimum balance requirement
        if (numericBalance < 1) {
          Alert.alert(
            'Insufficient Balance',
            'You need at least ₹1 to make a call. Please add money to your wallet.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Add Funds', onPress: () => navigation.navigate('AddFundsScreen' as never) }
            ]
          )
          return
        }

        // Calculate billing info to show user
        const billingInfo = await billingService.calculateCallBilling(
          user?.id?.toString() || '',
          callType,
          numericBalance,
          isPremium
        )

        const maxMinutes = Math.floor(billingInfo.maxDurationSeconds / 60)
        const rateText = billingService.formatCurrency(billingInfo.ratePerMinute)

        // Show confirmation dialog with billing information
        Alert.alert(
          `${callType === 'video' ? 'Video' : 'Voice'} Call`,
          `Rate: ${rateText}/min${isPremium ? ' (Premium)' : ''}\nMax Duration: ${maxMinutes} minutes\nCurrent Balance: ${billingService.formatCurrency(numericBalance)}\n\nProceed with the call?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Call Now',
              onPress: async () => {
                const success = await callController.startCall(
                  recipientId,
                  recipientName,
                  callType
                )

                if (!success) {
                  Alert.alert(
                    'Call Failed',
                    'Unable to start the call. The user may be unavailable.'
                  )
                }
              }
            }
          ]
        )
      } catch (error) {
        console.error('[TipCallScreen] Start call error:', error)
        Alert.alert('Error', 'Failed to start call. Please try again.')
      }
    },
    [callController, billingService, balance, isPremium, user?.id, navigation]
  )

  // Handle actual call initiation (used by both premium and non-premium flows)
  const initiateCall = useCallback(
    async (recipientId: string, recipientName: string, callType: CallType) => {
      try {
        // First, request runtime permissions for camera and microphone
        console.log('[TipCallScreen] Requesting call permissions for', callType, 'call')
        const permissionManager = PermissionManagerService.getInstance()
        const permissionResult = await permissionManager.requestCallPermissions(callType === 'video')

        if (!permissionResult.microphone) {
          Alert.alert(
            'Permission Required',
            'Microphone permission is required to make calls. Please grant permission in settings.',
            [{ text: 'OK' }]
          )
          return
        }

        if (callType === 'video' && !permissionResult.camera) {
          Alert.alert(
            'Permission Required',
            'Camera permission is required to make video calls. Please grant permission in settings.',
            [{ text: 'OK' }]
          )
          return
        }

        console.log('[TipCallScreen] Call permissions granted:', permissionResult)

        // Convert balance to number for calculations
        const numericBalance = parseFloat(balance || '0')

        // Check minimum balance requirement
        if (numericBalance < 1) {
          Alert.alert(
            'Insufficient Balance',
            'You need at least ₹1 to make a call. Please add money to your wallet.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Add Funds', onPress: () => navigation.navigate('AddFundsScreen' as never) }
            ]
          )
          return
        }

        // Calculate billing info to show user
        const billingInfo = await billingService.calculateCallBilling(
          user?.id?.toString() || '',
          callType,
          numericBalance,
          isPremium
        )

        const maxMinutes = Math.floor(billingInfo.maxDurationSeconds / 60)
        const rateText = billingService.formatCurrency(billingInfo.ratePerMinute)

        // Show confirmation dialog with billing information
        Alert.alert(
          `${callType === 'video' ? 'Video' : 'Voice'} Call`,
          `Rate: ${rateText}/min${isPremium ? ' (Premium)' : ''}\nMax Duration: ${maxMinutes} minutes\nCurrent Balance: ${billingService.formatCurrency(numericBalance)}\n\nProceed with the call?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Call Now',
              onPress: async () => {
                const success = await callController.startCall(
                  recipientId,
                  recipientName,
                  callType
                )

                if (!success) {
                  Alert.alert(
                    'Call Failed',
                    'Unable to start the call. The user may be unavailable.'
                  )
                }
              }
            }
          ]
        )
      } catch (error) {
        console.error('[TipCallScreen] Start call error:', error)
        Alert.alert('Error', 'Failed to start call. Please try again.')
      }
    },
    [callController, billingService, balance, isPremium, user?.id, navigation]
  )

  // Handle premium modal actions
  const handlePremiumModalUpgrade = useCallback(() => {
    setShowPremiumCallRateModal(false)
    setPendingCallData(null)
    navigation.navigate('PremiumUser' as never)
  }, [navigation])

  const handlePremiumModalContinue = useCallback(() => {
    setShowPremiumCallRateModal(false)
    if (pendingCallData) {
      const { recipientId, recipientName, callType } = pendingCallData
      setPendingCallData(null)
      // Continue with the call at non-premium rates
      initiateCall(recipientId, recipientName, callType)
    }
  }, [pendingCallData, initiateCall])

  const handlePremiumModalClose = useCallback(() => {
    setShowPremiumCallRateModal(false)
    setPendingCallData(null)
  }, [])

  // Handle profile press
  const handleProfilePress = useCallback((userId: number) => {
    // TODO: Navigate to user profile
    console.log('Navigate to profile for user:', userId)
  }, [])

  // Handle blocking a user
  const handleBlockUser = useCallback(
    (contact: Contact) => {
      Alert.alert(
        'Block User',
        `Are you sure you want to block ${
          contact.name || 'this user'
        }? They won't be able to call you anymore.`,
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
                await blockUser(
                  contact.id.toString(),
                  contact.name || 'Unknown User'
                )
                Alert.alert(
                  'Success',
                  `${contact.name || 'User'} has been blocked.`
                )
              } catch (error) {
                console.error('[TipCallScreen] Failed to block user:', error)
                Alert.alert('Error', 'Failed to block user. Please try again.')
              }
            },
          },
        ]
      )
    },
    [blockUser]
  )

  // Handle chat
  const handleChatNavigation = useCallback((contact: Contact) => {
    if (!isPremium) {
      setShowPremiumPopup(true)
      return
    }
    navigation.navigate('Chat', { user: contact })

    // Mark messages as read in background
    if (user?.id && unreadCounts[contact.id] > 0) {
      ApiService.markMessagesAsRead(user.id, contact.id).finally(() => {
        setUnreadCounts(prev => ({ ...prev, [contact.id]: 0 }))
      })
    }
  }, [navigation, isPremium, unreadCounts, user?.id])

  // Handle search activation
  const handleSearchActivation = useCallback(() => {
    setIsSearchActive(true)
  }, [])

  // Handle search back
  const handleSearchBack = useCallback(() => {
    setIsSearchActive(false)
    setSearchQuery('')
    setLiveSearchQuery('')
  }, [])

  // Handle live search text change
  const handleLiveSearchChange = useCallback((text: string) => {
    debouncedSetLiveSearchQuery(text)
    setSearchQuery(text)
  }, [debouncedSetLiveSearchQuery])

  // Handle live search user press
  const handleLiveSearchUserPress = useCallback((contact: Contact) => {
    setIsSearchActive(false)
    setSearchQuery('')
    setLiveSearchQuery('')
    // Navigate to user profile or show actions
    handleProfilePress(contact.id)
  }, [handleProfilePress])

  // Render contact item
  const renderContactItem = ({ item }: { item: Contact | { ad: true; key: string } }) => {
    if ('ad' in item) return <RectangleAdComponent key={item.key} />
    return (
      <ContactCard
        contact={item}
        onVideoCall={() =>
          handleStartCall(item.id.toString(), item.name || 'Unknown User', 'video')
        }
        onVoiceCall={() =>
          handleStartCall(item.id.toString(), item.name || 'Unknown User', 'voice')
        }
        onChat={() => handleChatNavigation(item)}
        hasUnreadMessages={unreadCounts[item.id] > 0}
        colors={colors}
        isDarkMode={isDarkMode}
        onProfilePress={() => openProfile(item.id)}
        onBlockUser={() => handleBlockUser(item as Contact)}
      />
    )
  }

  // Render live search item using the same enhanced ContactCard
  const renderLiveSearchItem = ({ item }: { item: Contact }) => (
    <ContactCard
      contact={item}
      onVideoCall={() => handleStartCall(item.id.toString(), item.name || 'Unknown User', 'video')}
      onVoiceCall={() => handleStartCall(item.id.toString(), item.name || 'Unknown User', 'voice')}
      onChat={() => handleChatNavigation(item)}
      hasUnreadMessages={false}
      colors={colors}
      isDarkMode={isDarkMode}
      onProfilePress={() => handleLiveSearchUserPress(item)}
      onBlockUser={() => handleBlockUser(item)}
    />
  )

  // Missed calls count
  const { count: missedCallsCount } = useMissedCallsCount(user?.id ? String(user.id) : undefined)

  // ---------- Premium Banner renderer ---------------
  const renderPremiumBanner = () => {
    if (premiumLoading) return null
    if (!isPremium) {
      return (
        <View style={{ marginHorizontal: 16, marginTop: 8 }}>
          <LinearGradient colors={['#FFD700', '#FFB300']} style={{ borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, marginRight: 12 }}>👑</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700' }}>Upgrade to Premium</Text>
              <Text>Lower call rates & ₹2 per call acceptance</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('SubscriptionScreen' as never)} style={{ backgroundColor: 'rgba(0,0,0,0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}>
              <Text style={{ fontWeight: '600' }}>Upgrade</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )
    }
    return null
  }
  // --------------------------------------------------

  // ------------------ Header Menu State -------------
  const [showDropdown, setShowDropdown] = useState(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    if (showDropdown) {
      const timer = setTimeout(() => {
        setShowDropdown(false)
      }, 5000) // Auto close after 5 seconds
      return () => clearTimeout(timer)
    }
  }, [showDropdown])

  // Header right icons component
  const HeaderRight = () => (
    <View style={styles.headerRightContainer}>
      {/* Add Funds */}
      <TouchableOpacity
        onPress={() => navigation.navigate('AddFundsScreen')}
        style={styles.headerIconButton}
      >
        <BanknoteArrowUp size={20} color={colors.primary} />
      </TouchableOpacity>

      {/* Search */}
      <TouchableOpacity
        onPress={handleSearchActivation}
        style={styles.headerIconButton}
      >
        <Icon name="search" size={20} color={colors.text.secondary} />
      </TouchableOpacity>

      {/* Menu Dropdown */}
      <View style={{ position: 'relative' }}>
        <TouchableOpacity
          onPress={() => setShowDropdown(!showDropdown)}
          style={styles.headerIconButton}
        >
          <MoreVertical size={20} color={colors.text.secondary} />
        </TouchableOpacity>

        {showDropdown && (
          <View style={[styles.dropdownMenu, { 
            backgroundColor: colors.background,
            borderColor: colors.border,
            shadowColor: colors.text.primary,
          }]}>
            {/* Missed Calls */}
            <TouchableOpacity
              onPress={() => {
                setShowDropdown(false)
                navigation.navigate('MissedCalls')
              }}
              style={styles.dropdownItem}
            >
              <Icon name="phone-missed" size={18} color={colors.error} />
              <Text style={[styles.dropdownItemText, { color: colors.text.primary }]}>
                Missed Calls
              </Text>
              {missedCallsCount > 0 && (
                <View style={[styles.dropdownBadge, { backgroundColor: colors.error }]}>
                  <Text style={styles.dropdownBadgeText}>
                    {missedCallsCount > 99 ? '99+' : missedCallsCount.toString()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Blocked Users */}
            <TouchableOpacity
              onPress={() => {
                setShowDropdown(false)
                navigation.navigate('BlockedUsers')
              }}
              style={styles.dropdownItem}
            >
              <Ban size={18} color={colors.text.secondary} />
              <Text style={[styles.dropdownItemText, { color: colors.text.primary }]}>
                Blocked Users
              </Text>
              {blockedUsersCount > 0 && (
                <View style={[styles.dropdownBadge, { backgroundColor: colors.error }]}>
                  <Text style={styles.dropdownBadgeText}>
                    {blockedUsersCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* DND Toggle */}
            <View style={styles.dropdownItem}>
              <Icon name="moon" size={18} color={colors.text.secondary} />
              <Text style={[styles.dropdownItemText, { color: colors.text.primary }]}>
                Do Not Disturb
              </Text>
              <DndToggleSwitch
                isDndEnabled={isDndEnabled}
                onToggle={handleDndToggle}
                isLoading={isDndLoading}
                colors={colors}
                size={32}
              />
            </View>
          </View>
        )}
      </View>
    </View>
  )

  // Render search screen
  if (isSearchActive) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar
          backgroundColor={colors.background}
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        />
        <TipCallSearchBar
          value={searchQuery}
          onChangeText={handleLiveSearchChange}
          onBack={handleSearchBack}
          colors={colors}
        />
        <FlatList
          data={liveSearchQuery.trim() ? liveSearchContacts : []}
          keyExtractor={(item) => `live-search-user-${item.id}`}
          renderItem={renderLiveSearchItem}
          ListEmptyComponent={liveSearchQuery.trim() && !liveSearchLoading ? (
            <View style={styles.emptySearchState}>
              <Icon name="search" size={40} color={colors.text.tertiary} />
              <Text style={[styles.emptySearchText, { color: colors.text.secondary }]}>
                No results found
              </Text>
              <Text style={[styles.emptySearchSubtext, { color: colors.text.tertiary }]}>
                Try searching with a different keyword
              </Text>
            </View>
          ) : null}
          ListFooterComponent={liveSearchLoading ? (
            <View style={styles.searchLoader}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.searchLoadingText, { color: colors.text.secondary }]}>
                Searching...
              </Text>
            </View>
          ) : null}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
          showsVerticalScrollIndicator={false}
        />
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        backgroundColor={colors.background}
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />

      <Header
        title=""
        showWallet={true}
        showSearch={false} // We handle search ourselves
        rightComponent={<HeaderRight />}
      />

      {/* Premium Banner - Always at top if not premium */}
      {!isPremium && (
        <View style={{ marginHorizontal: 16, marginTop: 8 }}>
          <LinearGradient colors={['#FFD700', '#FFB300']} style={{ borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, marginRight: 12 }}>👑</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700' }}>Upgrade to Premium</Text>
              <Text>Lower call rates & ₹2 per call acceptance</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('SubscriptionScreen' as never)} style={{ backgroundColor: 'rgba(0,0,0,0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}>
              <Text style={{ fontWeight: '600' }}>Upgrade</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      {/* Enhanced Filters Section with Languages and Interests */}
      <View style={[styles.filtersSection, { backgroundColor: colors.background }]}>
        {/* Languages Filter */}
        <View style={styles.filterGroup}>
          <Text style={[styles.filterGroupTitle, { color: colors.text.primary }]}>Languages</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {languages.map((lang) => (
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

        {/* Interests/Categories Filter */}
        <View style={styles.filterGroup}>
          <Text style={[styles.filterGroupTitle, { color: colors.text.primary }]}>Interests</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {categories.map((category) => (
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

      {/* Enhanced Content Section */}
      <View style={styles.contentSection}>
        {usersLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={colors.primary}
            />
            <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
              Loading contacts...
            </Text>
          </View>
        ) : filteredContacts.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="users" size={48} color={colors.text.tertiary} />
            <Text
              style={[styles.emptyStateText, { color: colors.text.primary }]}
            >
              No contacts found
            </Text>
            <Text
              style={[styles.emptyStateSubtext, { color: colors.text.secondary }]}
            >
              Try adjusting your filters or refresh the list
            </Text>
            <TouchableOpacity
              style={[styles.refreshButton, { backgroundColor: colors.primary }]}
              onPress={() => refreshUsers()}
              activeOpacity={0.8}
            >
              <Icon name="refresh-cw" size={16} color="#FFFFFF" />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={contactsWithAds}
            renderItem={renderContactItem}
            keyExtractor={(item) => ('ad' in item ? item.key : item.id.toString())}
            contentContainerStyle={styles.contactList}
            onRefresh={refreshUsers}
            refreshing={usersLoading}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
          />
        )}
      </View>

      {/* Enhanced Search indicator */}
      {debouncedSearch !== '' && (
        <Animated.View style={[
          styles.searchIndicator,
          { backgroundColor: colors.card, borderColor: colors.border }
        ]}>
          <Icon name="search" size={16} color={colors.primary} />
          <Text style={[styles.searchIndicatorText, { color: colors.primary }]}>
            Searching for "{debouncedSearch}"
          </Text>
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearSearchButton}
          >
            <Icon name="x" size={14} color={colors.text.secondary} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Premium banner render */}
      

      {/* Modal for user profile */}
      <Modal
        visible={showUserProfileModal}
        animationType="slide"
        onRequestClose={() => setShowUserProfileModal(false)}
      >
        {selectedUserId && (
          <UserProfileScreen userId={selectedUserId} onClose={() => setShowUserProfileModal(false)} />
        )}
      </Modal>

      {/* Premium Popup */}
      <PremiumPopup
        visible={showPremiumPopup}
        onClose={() => setShowPremiumPopup(false)}
        onUpgrade={() => {
          setShowPremiumPopup(false)
          navigation.navigate('SubscriptionScreen' as never)
        }}
      />

      {/* Premium Call Rate Modal */}
      <PremiumCallRateModal
        visible={showPremiumCallRateModal}
        onClose={handlePremiumModalClose}
        onUpgrade={handlePremiumModalUpgrade}
        onContinue={handlePremiumModalContinue}
        callType={pendingCallData?.callType}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Content sections
  contentSection: {
    flex: 1,
  },
  
  // Loading states
  loader: {
    flex: 1,
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Empty states
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyStateSubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptySearchState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptySearchText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySearchSubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  refreshButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Contact list
  contactList: {
    paddingVertical: 12,
    paddingBottom: 20,
  },
  
  // Elegant and minimalistic Contact Card
  contactCard: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  onlineAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  contactCardContent: {
    padding: 20,
  },

  // Contact header with avatar and info
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  // Minimalist avatar design
  avatarContainer: {
    marginRight: 16,
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // Clean contact information
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: 0.1,
    lineHeight: 22,
  },
  contactStatus: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.8,
    lineHeight: 16,
  },

  // Menu button
  menuButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Plain tags section
  tagsSection: {
    marginBottom: 16,
    gap: 4,
  },
  tagLabel: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginBottom: 2,
  },

  // Clean outline action buttons
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },

  // Enhanced Header
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    padding: 8,
    marginLeft: 4,
    position: 'relative',
    borderRadius: 20,
  },
  missedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  missedBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
  },

  // Minimalist Filters
  filtersSection: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  filterScroll: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 2,
    marginRight: 12,
    marginBottom: 6,
  },
  filterChipText: {
    fontSize: 14,
    letterSpacing: 0.3,
    fontWeight: '600',
  },

  // Enhanced Test Button
  testButton: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Enhanced Search Bar
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  searchBackButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 20,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 20,
    fontSize: 16,
    fontWeight: '500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // Live Search Items
  liveSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    marginHorizontal: 8,
    borderRadius: 12,
    marginVertical: 2,
  },
  liveSearchName: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 2,
  },
  liveSearchId: {
    fontSize: 13,
    marginBottom: 2,
  },
  liveSearchEmail: {
    fontSize: 12,
  },
  liveSearchActions: {
    flexDirection: 'row',
    marginLeft: 12,
  },
  quickActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },

  // Search states
  searchLoader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  searchLoadingText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },

  // Enhanced Search indicator
  searchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIndicatorText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  clearSearchButton: {
    padding: 4,
    borderRadius: 12,
  },

  // Dropdown menu styles
  dropdownMenu: {
    position: 'absolute',
    top: 35,
    right: 0,
    minWidth: 180,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  dropdownBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  dropdownBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Premium banner styles
  premiumContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 0,
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
    marginBottom: 2,
  },
  premiumSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  upgradeButton: {
    backgroundColor: 'rgba(184, 134, 11, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  upgradeButtonText: {
    fontWeight: '600',
    fontSize: 13,
  },

  // Filter group styles
  filterGroup: {
    marginBottom: 16,
  },
  filterGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginHorizontal: 16,
  },
})

export default TipCallScreenSimple
