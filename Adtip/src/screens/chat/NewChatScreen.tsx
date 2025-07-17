/**
 * New Chat Screen Component
 * 
 * This component provides the main chat interface using the new chat system
 * with Socket.IO and proper FCM notifications.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Message } from '../../services/NewChatService';
import { COLORS } from '../../constants/colors';

type ChatScreenRouteProp = RouteProp<{
  Chat: {
    conversationId?: string;
    participantId?: string;
    participantName?: string;
  };
}, 'Chat'>;

type ChatScreenNavigationProp = StackNavigationProp<any, 'Chat'>;

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showStatus: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn, showStatus }) => {
  const { colors } = useTheme();
  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return 'schedule';
      case 'sent':
        return 'done';
      case 'delivered':
        return 'done-all';
      case 'read':
        return 'done-all';
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (message.status) {
      case 'sending':
        return COLORS.gray[400];
      case 'sent':
        return COLORS.gray[400];
      case 'delivered':
        return COLORS.gray[400];
      case 'read':
        return COLORS.primary;
      default:
        return COLORS.gray[400];
    }
  };

  return (
    <View style={[
      styles.messageBubble,
      isOwn ? [styles.ownMessage, { backgroundColor: COLORS.primary }] : [styles.otherMessage, { backgroundColor: colors.surface }]
    ]}>
      <Text style={[
        styles.messageText,
        { color: isOwn ? COLORS.white : colors.text.primary }
      ]}>
        {message.content}
      </Text>

      <View style={styles.messageFooter}>
        <Text style={[
          styles.messageTime,
          { color: isOwn ? COLORS.white : colors.text.secondary }
        ]}>
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
        
        {isOwn && showStatus && (
          <Icon 
            name={getStatusIcon() || 'done'} 
            size={16} 
            color={getStatusColor()}
            style={styles.statusIcon}
          />
        )}
      </View>
    </View>
  );
};

const NewChatScreen: React.FC = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const { user } = useAuth();
  const { colors } = useTheme();

  const {
    currentConversationId,
    currentMessages,
    loadingMessages,
    isConnected,
    isInitialized,
    sendMessage,
    createOrGetConversation,
    joinConversation,
    leaveConversation,
    markAsRead,
    startTyping,
    stopTyping,
    typingUsers,
    getConversationById
  } = useChat();

  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { conversationId: routeConversationId, participantId, participantName } = route.params || {};

  // Initialize conversation
  useEffect(() => {
    const initializeConversation = async () => {
      // Wait for chat service to be initialized
      if (!isInitialized) {
        console.log('[NewChatScreen] Waiting for chat service to initialize...');
        return;
      }

      try {
        let convId = routeConversationId;

        if (!convId && participantId) {
          // Create or get conversation with participant
          console.log('[NewChatScreen] Creating conversation with participant:', participantId);
          convId = await createOrGetConversation(participantId);
        }

        if (convId) {
          console.log('[NewChatScreen] Joining conversation:', convId);
          setConversationId(convId);
          joinConversation(convId);
          console.log('[NewChatScreen] Conversation setup complete, conversationId:', convId);
        } else {
          console.warn('[NewChatScreen] No conversation ID available');
          Alert.alert('Error', 'Unable to load conversation');
        }
      } catch (error) {
        console.error('[NewChatScreen] Failed to initialize conversation:', error);

        const errorMessage = error instanceof Error ? error.message : String(error);

        if (errorMessage === 'Chat service not initialized') {
          Alert.alert(
            'Chat Service Loading',
            'Chat service is still initializing. Please wait a moment and try again.',
            [
              { text: 'OK', onPress: () => navigation.goBack() }
            ]
          );
        } else {
          Alert.alert('Error', 'Failed to load conversation. Please try again.');
        }
      }
    };

    initializeConversation();

    return () => {
      leaveConversation();
    };
  }, [routeConversationId, participantId, isInitialized, createOrGetConversation, joinConversation, leaveConversation]);

  // Set navigation title and header styling
  useEffect(() => {
    if (conversationId) {
      const conversation = getConversationById(conversationId);
      const title = conversation?.other_user_name || participantName || 'Chat';
      navigation.setOptions({
        title,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          color: colors.text.primary,
        },
      });
    }
  }, [conversationId, getConversationById, participantName, navigation, colors]);

  // Mark messages as read when conversation changes
  useEffect(() => {
    if (conversationId && currentMessages.length > 0) {
      markAsRead(conversationId);
    }
  }, [conversationId, currentMessages.length, markAsRead]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (currentMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [currentMessages.length]);

  // Handle sending message
  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim() || !conversationId || sending) {
      return;
    }

    try {
      setSending(true);
      await sendMessage(conversationId, messageText.trim());
      setMessageText('');
      
      // Stop typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      stopTyping(conversationId);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  }, [messageText, conversationId, sending, sendMessage, stopTyping]);

  // Handle typing indicator
  const handleTextChange = useCallback((text: string) => {
    setMessageText(text);
    
    if (!conversationId) return;

    // Start typing indicator
    if (text.trim() && !typingTimeoutRef.current) {
      startTyping(conversationId);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    if (text.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(conversationId);
        typingTimeoutRef.current = null;
      }, 3000);
    } else {
      stopTyping(conversationId);
      typingTimeoutRef.current = null;
    }
  }, [conversationId, startTyping, stopTyping]);

  // Render message item
  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.senderId === user?.id?.toString();
    const showStatus = isOwn && index === currentMessages.length - 1;
    //Debug Noisy Console, comment out when not needed
    /*
    console.log('[NewChatScreen] Message ownership check:', {
      messageId: item.id,
      messageSenderId: item.senderId,
      currentUserId: user?.id?.toString(),
      isOwn,
      senderName: item.senderName,
      content: item.content.substring(0, 20) + '...'
    });*/

    return (
      <MessageBubble
        message={item}
        isOwn={isOwn}
        showStatus={showStatus}
      />
    );
  }, [user?.id, currentMessages.length]);

  // Render typing indicator
  const renderTypingIndicator = () => {
    if (!conversationId || !typingUsers[conversationId] || typingUsers[conversationId].length === 0) {
      return null;
    }

    return (
      <View style={styles.typingIndicator}>
        <Text style={[styles.typingText, { color: colors.text.secondary }]}>
          {typingUsers[conversationId].length === 1
            ? 'Typing...'
            : `${typingUsers[conversationId].length} people typing...`}
        </Text>
      </View>
    );
  };

  // Show loading state if chat service is not initialized or messages are loading
  if (!isInitialized || loadingMessages) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            {!isInitialized ? 'Initializing chat...' : 'Loading messages...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Connection status */}
        {!isConnected && (
          <View style={[styles.connectionStatus, { backgroundColor: COLORS.warning }]}>
            <Text style={[styles.connectionText, { color: COLORS.white }]}>Connecting...</Text>
          </View>
        )}

        {/* Messages list */}
        {loadingMessages ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.text.primary }]}>Loading messages...</Text>
          </View>
        ) : currentMessages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.text.primary }]}>No messages yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.text.secondary }]}>Start the conversation!</Text>
          </View>
        ) : (
          <View style={[styles.chatBackground, { backgroundColor: colors.background }]}>
            <FlatList
              ref={flatListRef}
              data={currentMessages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContainer}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* Typing indicator */}
        {renderTypingIndicator()}

        {/* Message input */}
        <View style={[styles.inputContainer, {
          backgroundColor: colors.background,
          borderTopColor: colors.border
        }]}>
          <TextInput
            style={[styles.textInput, {
              borderColor: colors.border,
              backgroundColor: colors.surface,
              color: colors.text.primary
            }]}
            value={messageText}
            onChangeText={handleTextChange}
            placeholder="Type a message..."
            placeholderTextColor={colors.text.secondary}
            multiline
            maxLength={1000}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: messageText.trim() ? COLORS.primary : colors.text.secondary,
                opacity: messageText.trim() && !sending ? 1 : 0.5
              }
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Icon name="send" size={24} color={COLORS.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    padding: 8,
    alignItems: 'center',
  },
  connectionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    marginVertical: 4,
    padding: 12,
    borderRadius: 16,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.gray[100],
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  statusIcon: {
    marginLeft: 4,
  },
  typingIndicator: {
    padding: 16,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  chatBackground: {
    flex: 1,
    position: 'relative',
  },
});

export default NewChatScreen;
