/**
 * Inbox Screen for React Native
 * 
 * Displays all messages received by the current user with sender information,
 * timestamps, read/unread status, and filtering capabilities.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { Mail } from 'lucide-react-native';

import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/common/Header';
import { MainNavigatorParamList } from '../../types/navigation';
import ApiService from '../../services/ApiService';
import Logger from '../../utils/LogUtils';

type InboxScreenNavigationProp = StackNavigationProp<MainNavigatorParamList, 'Inbox'>;

interface InboxConversation {
  id: number;
  chatId: string;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  latestContent: string;
  latestMessageType: string;
  latestCreatedAt: string;
  totalMessages: number;
  unreadCount: number;
  preview: string;
}



const InboxScreen: React.FC = () => {
  const navigation = useNavigation<InboxScreenNavigationProp>();
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();

  // State management
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter] = useState<'all' | 'unread' | 'read'>('all');
  const [sortBy] = useState<'date' | 'sender'>('date');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  // Generate consistent avatar colors based on name
  const getAvatarColor = (name: string): string => {
    const avatarColors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % avatarColors.length;
    return avatarColors[index];
  };

  // Load inbox conversations
  const loadInboxConversations = useCallback(async (page = 1, isRefresh = false) => {
    if (!user?.id) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
        setCurrentPage(1);
      } else if (page > 1) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await ApiService.get(`/api/inbox/conversations/${user.id}`, {
        params: {
          page,
          limit: 20,
          filter,
          sortOrder: 'desc'
        }
      });

      const { conversations: newConversations, pagination } = response.data;

      if (isRefresh || page === 1) {
        setConversations(newConversations);
      } else {
        setConversations(prev => [...prev, ...newConversations]);
      }

      setCurrentPage(pagination.currentPage);
      setHasNextPage(pagination.hasNextPage);

    } catch (error) {
      Logger.error('[InboxScreen] Error loading conversations:', error);
      Alert.alert('Error', 'Failed to load inbox conversations. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [user?.id, filter, sortBy]);

  // Mark message as read
  const markMessageAsRead = useCallback(async (messageId: number) => {
    try {
      await ApiService.put(`/api/inbox/mark-read/${messageId}`);

      // Update local state - reduce unread count for the conversation
      setConversations(prev =>
        prev.map(conv =>
          conv.id === messageId
            ? { ...conv, unreadCount: Math.max(0, conv.unreadCount - 1) }
            : conv
        )
      );
    } catch (error) {
      Logger.error('[InboxScreen] Error marking message as read:', error);
    }
  }, []);

  // Navigate to chat with sender
  // Hide the default navigation header since we're using our own Header component
  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const navigateToChat = useCallback((conversation: InboxConversation) => {
    // Mark as read if has unread messages
    if (conversation.unreadCount > 0) {
      markMessageAsRead(conversation.id);
    }

    // Navigate to FCMChatScreen
    navigation.navigate('FCMChat', {
      participantId: conversation.senderId.toString(),
      participantName: conversation.senderName,
    });
  }, [navigation, markMessageAsRead]);

  // Use conversations directly without search filtering
  const filteredConversations = conversations;

  // Load more conversations
  const loadMoreConversations = useCallback(() => {
    if (!loadingMore && hasNextPage) {
      loadInboxConversations(currentPage + 1);
    }
  }, [loadingMore, hasNextPage, currentPage, loadInboxConversations]);

  // Refresh conversations
  const onRefresh = useCallback(() => {
    loadInboxConversations(1, true);
  }, [loadInboxConversations]);

  // Initial load and filter changes
  useEffect(() => {
    loadInboxConversations(1);
  }, [filter, sortBy]);

  // Focus effect to refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadInboxConversations(1, true);
    }, [])
  );

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Render conversation item
  const renderConversationItem = ({ item }: { item: InboxConversation }) => {
    const hasUnread = item.unreadCount > 0;

    return (
      <TouchableOpacity
        style={[
          styles.conversationItem,
          {
            backgroundColor: hasUnread
              ? colors.background === '#000000' ? '#1A1A1A' : '#F0F8FF'
              : colors.background,
            borderBottomColor: colors.border,
          }
        ]}
        onPress={() => navigateToChat(item)}
        activeOpacity={0.7}
      >
        {/* Sender Avatar */}
        <View style={styles.avatarContainer}>
          {item.senderAvatar ? (
            <Image
              source={{ uri: item.senderAvatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: getAvatarColor(item.senderName) }]}>
              <Text style={styles.avatarText}>
                {item.senderName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {hasUnread && (
            <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
          )}
        </View>

        {/* Conversation Content */}
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text
              style={[
                styles.senderName,
                {
                  color: colors.text.primary,
                  fontWeight: hasUnread ? '600' : '500'
                }
              ]}
              numberOfLines={1}
            >
              {item.senderName}
            </Text>
            <View style={styles.headerRight}>
              <Text style={[styles.timestamp, { color: colors.text.secondary }]}>
                {formatTimestamp(item.latestCreatedAt)}
              </Text>
              <Icon name="chevron-right" size={16} color={colors.text.secondary} />
            </View>
          </View>

          <View style={styles.messagePreviewRow}>
            <Text
              style={[
                styles.messagePreview,
                {
                  color: colors.text.secondary,
                  fontWeight: hasUnread ? '500' : '400',
                  flex: 1
                }
              ]}
              numberOfLines={1}
            >
              {item.latestContent}
            </Text>

          {/* Message Count and Unread Badge */}
          <View style={styles.badgeContainer}>
            {item.totalMessages > 1 && (
              <View style={[styles.messageBadge, { backgroundColor: colors.text.secondary }]}>
                <Text style={[styles.badgeText, { color: colors.background }]}>
                  {item.totalMessages}
                </Text>
              </View>
            )}
            {item.unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.badgeText, { color: '#FFFFFF' }]}>
                  {item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Message Type Icon */}
        {item.latestMessageType !== 'text' && (
          <View style={styles.messageTypeContainer}>
            {item.latestMessageType === 'image' && (
              <Icon name="image" size={16} color={colors.text.secondary} />
            )}
            {item.latestMessageType === 'video' && (
              <Icon name="video" size={16} color={colors.text.secondary} />
            )}
            {item.latestMessageType === 'audio' && (
              <Icon name="mic" size={16} color={colors.text.secondary} />
            )}
            {item.latestMessageType === 'file' && (
              <Icon name="file" size={16} color={colors.text.secondary} />
            )}
          </View>
        )}
        </View>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Mail size={64} color={colors.text.secondary} />
      <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
        No Conversations Yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
        Your inbox is empty. Start a conversation to see it here.
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        backgroundColor={colors.background}
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />

      {/* Gradient Background */}
      <LinearGradient
        colors={colors.background === '#000000'
          ? ['#0A0A0A', '#1A1A1A', '#0F0F0F']
          : ['#E3F2FD', '#F8F9FA', '#FFFFFF']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />

      {/* Header */}
      <Header
        title="Inbox"
        showWallet={false}
        showSearch={false}
        showPremium={false}
        showProfile={false}
        leftComponent={
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        }
      />



      {/* Conversations List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading conversations...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.conversationsList}
          contentContainerStyle={styles.conversationsContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          onEndReached={loadMoreConversations}
          onEndReachedThreshold={0.1}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  backButton: {
    padding: 8,
  },
  conversationsList: {
    flex: 1,
  },
  conversationsContent: {
    paddingBottom: 20,
  },
  conversationItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    position: 'relative' as const,
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
  unreadDot: {
    position: 'absolute' as const,
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  conversationContent: {
    flex: 1,
    marginRight: 8,
  },
  conversationHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  headerRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  senderName: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
  },
  messagePreviewRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  messagePreview: {
    fontSize: 14,
    lineHeight: 20,
  },
  badgeContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  messageBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 6,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  messageTypeContainer: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center' as const,
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  loadMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center' as const,
  },
};

export default InboxScreen;
