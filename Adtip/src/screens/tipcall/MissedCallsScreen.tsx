import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { FeedFlatList } from '../../components/common/OptimizedFlatList';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useMissedCalls } from '../../hooks/useMissedCalls';
import { useWallet } from '../../hooks/useWallet';
import Header from '../../components/common/Header';
import ScreenTransition from '../../components/common/ScreenTransition';
import Icon from 'react-native-vector-icons/Feather';
import { Contact } from '../../types/api';
import { MainNavigatorParamList } from '../../types/navigation';
import CallController from '../../services/calling/CallController';
import { checkPremiumAccess, logPremiumAccessAttempt } from '../../utils/premiumAccessUtils';
import PremiumAccessModal from '../../components/modals/PremiumAccessModal';
import Logger from '../../utils/logger';

type NavigationProp = NativeStackNavigationProp<MainNavigatorParamList, 'MissedCalls'>;

// Enhanced Missed Call Card Component
const MissedCallCard: React.FC<{
  contact: Contact;
  onVideoCall: () => void;
  onVoiceCall: () => void;
  onChat: () => void;
  colors: any;
  isDarkMode: boolean;
}> = ({ contact, onVideoCall, onVoiceCall, onChat, colors, isDarkMode }) => {
  const avatarColor = colors.primary;
  
  return (
    <View style={[
      styles.callCard,
      {
        backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
        borderColor: isDarkMode ? colors.border : '#F1F3F4',
        shadowColor: isDarkMode ? '#000000' : '#000000',
        shadowOpacity: isDarkMode ? 0.3 : 0.08,
      }
    ]}>
      <View style={styles.callCardContent}>
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
          </View>
          {/* Missed call indicator */}
          <View style={styles.missedCallIndicator}>
            <Icon name="phone-missed" size={12} color={colors.error} />
          </View>
        </View>

        {/* Contact Info Section */}
        <View style={styles.contactInfo}>
          <Text style={[styles.contactName, { color: colors.text.primary }]} numberOfLines={1}>
            {contact.name || 'Unknown User'}
          </Text>
          
          <Text style={[styles.contactId, { color: colors.text.tertiary }]} numberOfLines={1}>
            ID: {contact.id}
          </Text>
          
          <Text style={[styles.missedTime, { color: colors.error }]} numberOfLines={1}>
            Missed call • {contact.missed_call_time || 'Recently'}
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
              <Icon name="target" size={10} color={colors.text.tertiary} />
              <Text style={[styles.tagText, { color: colors.text.tertiary }]} numberOfLines={1}>
                {contact.interests.slice(0, 2).map(interest => interest.name).join(', ')}
                {contact.interests.length > 2 && ` +${contact.interests.length - 2}`}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {/* Video Call Button */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={onVideoCall}
            activeOpacity={0.8}
          >
            <Icon name="video" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Voice Call Button */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.success }]}
            onPress={onVoiceCall}
            activeOpacity={0.8}
          >
            <Icon name="phone" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Chat Button */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.info }]}
            onPress={onChat}
            activeOpacity={0.8}
          >
            <Icon name="message-circle" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Loading Skeleton Component
const MissedCallsSkeleton: React.FC<{ colors: any; isDarkMode: boolean }> = ({ colors, isDarkMode }) => (
  <View style={styles.skeletonContainer}>
    {Array.from({ length: 6 }).map((_, index) => (
      <View
        key={index}
        style={[
          styles.skeletonCard,
          {
            backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
            borderColor: isDarkMode ? colors.border : '#F1F3F4',
          }
        ]}
      >
        <View style={[styles.skeletonAvatar, { backgroundColor: colors.skeleton.background }]} />
        <View style={styles.skeletonContent}>
          <View style={[styles.skeletonLine, styles.skeletonTitle, { backgroundColor: colors.skeleton.background }]} />
          <View style={[styles.skeletonLine, styles.skeletonSubtitle, { backgroundColor: colors.skeleton.background }]} />
          <View style={[styles.skeletonLine, styles.skeletonDetail, { backgroundColor: colors.skeleton.background }]} />
        </View>
        <View style={styles.skeletonActions}>
          {Array.from({ length: 3 }).map((_, i) => (
            <View
              key={i}
              style={[styles.skeletonActionButton, { backgroundColor: colors.skeleton.background }]}
            />
          ))}
        </View>
      </View>
    ))}
  </View>
);

export default function MissedCallsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { isPremium } = useWallet();
  
  const [refreshing, setRefreshing] = useState(false);
  
  // Premium popup state
  const [showPremiumPopup, setShowPremiumPopup] = useState(false);
  const [premiumFeature, setPremiumFeature] = useState<'voice_call' | 'video_call' | 'chat' | 'general'>('general');

  // Use the missed calls hook
  const {
    data: missedCallsData,
    isLoading,
    isFetchingNextPage,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useMissedCalls(user?.id);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Get flattened contacts from all pages
  const missedCalls = missedCallsData?.pages?.flatMap(page => page.data || []) || [];

  // Call handlers
  const handleVideoCall = useCallback(async (contact: Contact) => {
    try {
      // Check premium access for video calling features
      const accessResult = checkPremiumAccess({
        feature: 'video_call',
        isPremium,
        userId: user?.id,
      });

      // Log the access attempt for analytics
      logPremiumAccessAttempt(
        'video_call',
        isPremium,
        user?.id,
        { contactId: contact.id, contactName: contact.name }
      );

      // If user doesn't have premium access, show upgrade modal
      if (!accessResult.hasAccess) {
        Logger.debug('MissedCallsScreen', 'Non-premium user attempting video call, showing premium popup')
        setPremiumFeature('video_call')
        setShowPremiumPopup(true)
        return
      }

      const callController = CallController.getInstance();
      const success = await callController.startCall(
        contact.id.toString(),
        contact.name || 'Unknown',
        'video'
      );

      if (success) {
        console.log('[MissedCallsScreen] Video call initiated successfully');
      } else {
        Alert.alert('Call Failed', 'Unable to start video call. Please try again.');
      }
    } catch (error) {
      console.error('[MissedCallsScreen] Video call error:', error);
      Alert.alert('Call Failed', 'Unable to start video call. Please try again.');
    }
  }, [user, navigation, isPremium]);

  const handleVoiceCall = useCallback(async (contact: Contact) => {
    try {
      // Check premium access for voice calling features
      const accessResult = checkPremiumAccess({
        feature: 'voice_call',
        isPremium,
        userId: user?.id,
      });

      // Log the access attempt for analytics
      logPremiumAccessAttempt(
        'voice_call',
        isPremium,
        user?.id,
        { contactId: contact.id, contactName: contact.name }
      );

      // If user doesn't have premium access, show upgrade modal
      if (!accessResult.hasAccess) {
        Logger.debug('MissedCallsScreen', 'Non-premium user attempting voice call, showing premium popup')
        setPremiumFeature('voice_call')
        setShowPremiumPopup(true)
        return
      }

      const callController = CallController.getInstance();
      const success = await callController.startCall(
        contact.id.toString(),
        contact.name || 'Unknown',
        'voice'
      );

      if (success) {
        console.log('[MissedCallsScreen] Voice call initiated successfully');
      } else {
        Alert.alert('Call Failed', 'Unable to start voice call. Please try again.');
      }
    } catch (error) {
      console.error('[MissedCallsScreen] Voice call error:', error);
      Alert.alert('Call Failed', 'Unable to start voice call. Please try again.');
    }
  }, [user, navigation, isPremium]);

  const handleChat = useCallback((contact: Contact) => {
    navigation.navigate('FCMChat', {
      participantId: contact.id.toString(),
      participantName: contact.name || 'Unknown User',
    });
  }, [navigation]);

  // Render missed call item
  const renderMissedCallItem = ({ item }: { item: Contact }) => (
    <MissedCallCard
      contact={item}
      onVideoCall={() => handleVideoCall(item)}
      onVoiceCall={() => handleVoiceCall(item)}
      onChat={() => handleChat(item)}
      colors={colors}
      isDarkMode={isDarkMode}
    />
  );

  // Render footer
  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
          Loading more calls...
        </Text>
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="phone-missed" size={64} color={colors.text.light} />
      <Text style={[styles.emptyStateTitle, { color: colors.text.primary }]}>
        No Missed Calls
      </Text>
      <Text style={[styles.emptyStateSubtitle, { color: colors.text.secondary }]}>
        You don't have any missed calls yet
      </Text>
    </View>
  );

  // Show error state
  if (error) {
    return (
      <ScreenTransition animationType="fade">
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <StatusBar backgroundColor={colors.background} barStyle={isDarkMode ? "light-content" : "dark-content"} />
          
          <Header 
            title="Missed Calls" 
            showWallet={false}
            showSearch={false}
            leftComponent={
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <Icon name="arrow-left" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            }
          />

          <View style={styles.errorState}>
            <Icon name="alert-circle" size={64} color={colors.error} />
            <Text style={[styles.errorTitle, { color: colors.text.primary }]}>
              Failed to Load
            </Text>
            <Text style={[styles.errorSubtitle, { color: colors.text.secondary }]}>
              Unable to fetch missed calls
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={onRefresh}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenTransition>
    );
  }

  return (
    <ScreenTransition animationType="fade">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar backgroundColor={colors.background} barStyle={isDarkMode ? "light-content" : "dark-content"} />
        
        <Header 
          title="Missed Calls" 
          showWallet={false}
          showSearch={false}
          leftComponent={
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Icon name="arrow-left" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          }
        />

        {/* Content Section */}
        <View style={styles.contentSection}>
          {isLoading ? (
            <MissedCallsSkeleton colors={colors} isDarkMode={isDarkMode} />
          ) : (
            <FeedFlatList
              data={missedCalls}
              renderItem={renderMissedCallItem}
              idField="id"
              debugName="MissedCalls"
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.3}
              customOptimizations={{
                removeClippedSubviews: true,
                initialNumToRender: 10,
                maxToRenderPerBatch: 8,
                windowSize: 12,
                showsVerticalScrollIndicator: false,
              }}
              ListFooterComponent={renderFooter}
              ListEmptyComponent={renderEmptyState}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
              contentContainerStyle={[
                styles.listContainer,
                missedCalls.length === 0 && styles.emptyListContainer
              ]}
            />
          )}
        </View>

              {/* Premium Access Modal */}
      <PremiumAccessModal
        visible={showPremiumPopup}
        feature={premiumFeature}
        onClose={() => setShowPremiumPopup(false)}
        onUpgrade={() => {
          // Use setTimeout to avoid scheduling updates during animation
          setTimeout(() => {
            setShowPremiumPopup(false)
            navigation.navigate('PremiumUser' as never)
          }, 100)
        }}
      />
      </View>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  backButton: {
    padding: 8,
    marginRight: 8,
  },

  contentSection: {
    flex: 1,
  },

  listContainer: {
    padding: 16,
  },

  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  // Missed Call Card
  callCard: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowRadius: 3,
  },

  callCardContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },

  avatarSection: {
    position: 'relative',
    marginRight: 12,
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },

  missedCallIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  contactInfo: {
    flex: 1,
    marginRight: 12,
  },

  contactName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },

  contactId: {
    fontSize: 12,
    marginBottom: 2,
  },

  missedTime: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },

  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },

  tagText: {
    fontSize: 11,
    marginLeft: 4,
  },

  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  // Loading States
  skeletonContainer: {
    padding: 16,
  },

  skeletonCard: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },

  skeletonAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },

  skeletonContent: {
    flex: 1,
    marginRight: 12,
  },

  skeletonLine: {
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },

  skeletonTitle: {
    width: '70%',
  },

  skeletonSubtitle: {
    width: '50%',
  },

  skeletonDetail: {
    width: '60%',
  },

  skeletonActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  skeletonActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 8,
  },

  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },

  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },

  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },

  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Error State
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },

  errorSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },

  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },

  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
