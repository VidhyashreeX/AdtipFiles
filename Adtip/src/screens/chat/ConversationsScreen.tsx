/**
 * Conversations List Screen
 * 
 * This component displays the list of user's conversations
 * with real-time updates and unread counts.
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useFCMChat } from '../../contexts/FCMChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../hooks/useWallet';
import { Conversation } from '../../services/FCMChatService';
import { COLORS } from '../../constants/colors';
import { checkPremiumAccess, logPremiumAccessAttempt, PremiumAccessModal } from '../../utils/premiumAccessUtils';

type ConversationsNavigationProp = StackNavigationProp<any, 'Conversations'>;

interface ConversationItemProps {
  conversation: Conversation;
  onPress: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ conversation, onPress }) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getLastMessagePreview = () => {
    if (!conversation.lastMessage) {
      return 'No messages yet';
    }

    const lastMessage = conversation.lastMessage;
    const prefix = lastMessage.senderName === 'You' ? 'You: ' : '';
    const content = lastMessage.content;

    if (lastMessage.messageType === 'image') {
      return `${prefix}📷 Photo`;
    } else if (lastMessage.messageType === 'video') {
      return `${prefix}🎥 Video`;
    } else if (lastMessage.messageType === 'audio') {
      return `${prefix}🎵 Audio`;
    } else if (lastMessage.messageType === 'file') {
      return `${prefix}📎 File`;
    }

    return `${prefix}${content.length > 30 ? content.substring(0, 30) + '...' : content}`;
  };

  const getStatusIcon = () => {
    // FCM conversations don't have online status, so we'll skip this for now
    return null;
  };

  return (
    <TouchableOpacity style={styles.conversationItem} onPress={onPress}>
      <View style={styles.avatarContainer}>
        {conversation.participants[0]?.avatar ? (
          <Image
            source={{ uri: conversation.participants[0].avatar }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.defaultAvatar}>
            <Icon name="person" size={24} color={COLORS.gray[400]} />
          </View>
        )}
        {getStatusIcon()}
      </View>
      
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName} numberOfLines={1}>
            {conversation.participants[0]?.name || conversation.title || 'Unknown'}
          </Text>

          <Text style={styles.conversationTime}>
            {formatTime(conversation.lastActivity)}
          </Text>
        </View>
        
        <View style={styles.conversationFooter}>
          <Text
            style={[
              styles.lastMessage,
              conversation.unreadCount > 0 && styles.unreadMessage
            ]}
            numberOfLines={1}
          >
            {getLastMessagePreview()}
          </Text>

          {conversation.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
              </Text>
            </View>
          )}
          {conversation.isMuted && (
            <Icon name="volume-off" size={16} color={COLORS.gray[400]} style={styles.muteIcon} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ConversationsScreen: React.FC = () => {
  const navigation = useNavigation<ConversationsNavigationProp>();
  const { user } = useAuth();
  const { isPremium } = useWallet();

  const {
    conversations,
    loadingConversations,
    isInitialized,
    loadConversations,
    totalUnreadCount
  } = useFCMChat();

  const [showPremiumPopup, setShowPremiumPopup] = React.useState(false);

  // Set navigation options with unread count
  useEffect(() => {
    navigation.setOptions({
      title: 'Chats',
      headerRight: () => (
        <View style={styles.headerRight}>
          {totalUnreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </Text>
            </View>
          )}
        </View>
      )
    });
  }, [navigation, totalUnreadCount]);

  // Load conversations when initialized
  useEffect(() => {
    if (isInitialized) {
      loadConversations();
    }
  }, [isInitialized, loadConversations]);

  // Handle conversation press with premium access check
  const handleConversationPress = useCallback((conversation: Conversation) => {
    // Check premium access for chat features
    const accessResult = checkPremiumAccess({
      feature: 'chat',
      isPremium,
      userId: user?.id,
    });

    // Log the access attempt for analytics
    logPremiumAccessAttempt(
      'chat',
      isPremium,
      user?.id,
      {
        conversationId: conversation.id,
        participantId: conversation.participants[0]?.id,
        participantName: conversation.participants[0]?.name || conversation.title,
        source: 'ConversationsScreen'
      }
    );

    // If user doesn't have premium access, show upgrade modal
    if (!accessResult.hasAccess) {
      console.log('[ConversationsScreen] Non-premium user attempting chat, showing premium popup');
      setShowPremiumPopup(true);
      return;
    }

    navigation.navigate('FCMChat', {
      conversationId: conversation.id,
      participantId: conversation.participants[0]?.id,
      participantName: conversation.participants[0]?.name || conversation.title
    });
  }, [navigation, isPremium, user?.id]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    if (isInitialized) {
      loadConversations();
    }
  }, [isInitialized, loadConversations]);

  // Render conversation item
  const renderConversation = useCallback(({ item }: { item: Conversation }) => (
    <ConversationItem
      conversation={item}
      onPress={() => handleConversationPress(item)}
    />
  ), [handleConversationPress]);

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="chat-bubble-outline" size={64} color={COLORS.gray[400]} />
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptySubtitle}>
        Start a conversation by messaging someone
      </Text>
    </View>
  );

  // Render loading state
  if (!isInitialized) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Initializing chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* FCM chat is always connected via API */}

      {/* Conversations list */}
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        style={styles.conversationsList}
        refreshControl={
          <RefreshControl
            refreshing={loadingConversations}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={!loadingConversations ? renderEmptyState : null}
        showsVerticalScrollIndicator={false}
      />

      {/* Premium Access Modal */}
      <PremiumAccessModal
        visible={showPremiumPopup}
        feature="chat"
        onClose={() => setShowPremiumPopup(false)}
        onUpgrade={() => {
          setShowPremiumPopup(false);
          navigation.navigate('PremiumUser' as never);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.gray[500],
    fontSize: 16,
  },
  connectionStatus: {
    backgroundColor: COLORS.warning,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  connectionText: {
    color: COLORS.white,
    fontSize: 12,
    marginLeft: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  headerBadge: {
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    flex: 1,
  },
  conversationTime: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  conversationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: COLORS.gray[500],
    flex: 1,
  },
  unreadMessage: {
    fontWeight: '600',
    color: COLORS.black,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  muteIcon: {
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.gray[500],
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ConversationsScreen;
