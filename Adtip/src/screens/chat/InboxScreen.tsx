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

type InboxScreenNavigationProp = StackNavigationProp<MainNavigatorParamList, 'Inbox'>;

interface InboxMessage {
  id: number;
  chatId: string;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageType: string;
  createdAt: string;
  readStatus: 'read' | 'unread' | 'delivered' | 'sent';
  preview: string;
}



const InboxScreen: React.FC = () => {
  const navigation = useNavigation<InboxScreenNavigationProp>();
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();

  // State management
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter] = useState<'all' | 'unread' | 'read'>('all');
  const [sortBy] = useState<'date' | 'sender'>('date');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  // Load inbox messages
  const loadInboxMessages = useCallback(async (page = 1, isRefresh = false) => {
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

      const response = await ApiService.get(`/api/inbox/${user.id}`, {
        params: {
          page,
          limit: 20,
          filter,
          sortBy,
          sortOrder: 'desc'
        }
      });

      const { messages: newMessages, pagination } = response.data;

      if (isRefresh || page === 1) {
        setMessages(newMessages);
      } else {
        setMessages(prev => [...prev, ...newMessages]);
      }

      setCurrentPage(pagination.currentPage);
      setHasNextPage(pagination.hasNextPage);

    } catch (error) {
      console.error('[InboxScreen] Error loading messages:', error);
      Alert.alert('Error', 'Failed to load inbox messages. Please try again.');
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
      
      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, readStatus: 'read' as const }
            : msg
        )
      );
    } catch (error) {
      console.error('[InboxScreen] Error marking message as read:', error);
    }
  }, []);

  // Navigate to chat with sender
  const navigateToChat = useCallback((message: InboxMessage) => {
    // Mark as read if unread
    if (message.readStatus === 'unread') {
      markMessageAsRead(message.id);
    }

    // Navigate to FCMChatScreen
    navigation.navigate('FCMChat', {
      participantId: message.senderId.toString(),
      participantName: message.senderName,
    });
  }, [navigation, markMessageAsRead]);

  // Use messages directly without search filtering
  const filteredMessages = messages;

  // Load more messages
  const loadMoreMessages = useCallback(() => {
    if (!loadingMore && hasNextPage) {
      loadInboxMessages(currentPage + 1);
    }
  }, [loadingMore, hasNextPage, currentPage, loadInboxMessages]);

  // Refresh messages
  const onRefresh = useCallback(() => {
    loadInboxMessages(1, true);
  }, [loadInboxMessages]);

  // Initial load and filter changes
  useEffect(() => {
    loadInboxMessages(1);
  }, [filter, sortBy]);

  // Focus effect to refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadInboxMessages(1, true);
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

  // Render message item
  const renderMessageItem = ({ item }: { item: InboxMessage }) => {
    const isUnread = item.readStatus === 'unread';
    
    return (
      <TouchableOpacity
        style={[
          styles.messageItem,
          {
            backgroundColor: isUnread 
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
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {item.senderName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {isUnread && (
            <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
          )}
        </View>

        {/* Message Content */}
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <Text 
              style={[
                styles.senderName, 
                { 
                  color: colors.text.primary,
                  fontWeight: isUnread ? '600' : '500'
                }
              ]}
              numberOfLines={1}
            >
              {item.senderName}
            </Text>
            <Text style={[styles.timestamp, { color: colors.text.secondary }]}>
              {formatTimestamp(item.createdAt)}
            </Text>
          </View>
          
          <Text 
            style={[
              styles.messagePreview, 
              { 
                color: colors.text.secondary,
                fontWeight: isUnread ? '500' : '400'
              }
            ]}
            numberOfLines={2}
          >
            {item.preview}
          </Text>
        </View>

        {/* Message Type Icon */}
        <View style={styles.messageTypeContainer}>
          {item.messageType === 'image' && (
            <Icon name="image" size={16} color={colors.text.secondary} />
          )}
          {item.messageType === 'video' && (
            <Icon name="video" size={16} color={colors.text.secondary} />
          )}
          {item.messageType === 'audio' && (
            <Icon name="mic" size={16} color={colors.text.secondary} />
          )}
          {item.messageType === 'file' && (
            <Icon name="file" size={16} color={colors.text.secondary} />
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
        No Messages Yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
        Your inbox is empty. Start a conversation to see messages here.
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



      {/* Messages List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading messages...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredMessages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          onEndReached={loadMoreMessages}
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
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingBottom: 20,
  },
  messageItem: {
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
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600' as const,
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
  messageContent: {
    flex: 1,
    marginRight: 8,
  },
  messageHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  senderName: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
  },
  messagePreview: {
    fontSize: 14,
    lineHeight: 20,
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
