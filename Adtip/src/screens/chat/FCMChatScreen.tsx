/**
 * FCM Chat Screen for React Native
 * 
 * This screen handles chat functionality using FCM high priority notifications
 * for reliable message delivery, replacing Socket.IO with API-based messaging.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Clock, Check, CheckCheck, MoreVertical, Send } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFCMChat } from '../../contexts/FCMChatContext';
import { Message } from '../../services/FCMChatService';
import { COLORS } from '../../constants/colors';

type RootStackParamList = {
  FCMChat: {
    participantId: string;
    participantName: string;
  };
};

type FCMChatScreenRouteProp = RouteProp<RootStackParamList, 'FCMChat'>;
type FCMChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'FCMChat'>;

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
        return Clock;
      case 'sent':
        return Check; // Single tick for sent
      case 'delivered':
        return CheckCheck; // Double tick for delivered
      case 'read':
        return CheckCheck; // Double tick for read (will be colored differently)
      default:
        return Clock;
    }
  };

  const getStatusColor = () => {
    switch (message.status) {
      case 'sending':
        return typeof COLORS.gray === 'string' ? COLORS.gray : COLORS.gray[500];
      case 'sent':
        return typeof COLORS.white === 'string' ? COLORS.white : COLORS.white[500];
      case 'delivered':
        return typeof COLORS.white === 'string' ? COLORS.white : COLORS.white[500];
      case 'read':
        return typeof COLORS.success === 'string' ? COLORS.success : COLORS.success[500];
      default:
        return typeof COLORS.gray === 'string' ? COLORS.gray : COLORS.gray[500];
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
        
        {isOwn && showStatus && (() => {
          const StatusIcon = getStatusIcon();
          return (
            <StatusIcon
              size={16}
              color={getStatusColor()}
              style={styles.statusIcon}
            />
          );
        })()}
      </View>
    </View>
  );
};

const FCMChatScreen: React.FC = () => {
  const route = useRoute<FCMChatScreenRouteProp>();
  const navigation = useNavigation<FCMChatScreenNavigationProp>();
  const { user } = useAuth();
  const { colors } = useTheme();

  const {
    currentConversationId,
    currentMessages,
    loadingMessages,
    isInitialized,
    sendMessage,
    createOrGetConversation,
    setCurrentConversation,
    markAsRead,
    loadMessages,
    refreshMessages,
  } = useFCMChat();

  const { participantId, participantName } = route.params;
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Set navigation title and header styling
  useEffect(() => {
    navigation.setOptions({
      title: participantName || 'Chat',
      headerStyle: {
        backgroundColor: colors.background,
      },
      headerTintColor: colors.text.primary,
      headerTitleStyle: {
        color: colors.text.primary,
      },
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            // Add any header actions here (e.g., call, video call)
          }}
        >
          <MoreVertical size={24} color={colors.text.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, participantName, colors.text.primary, colors.background]);

  // Keyboard handling
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        // Scroll to bottom when keyboard shows
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Initialize conversation
  useEffect(() => {
    const initializeConversation = async () => {
      if (!isInitialized || !participantId) return;

      try {
        console.log('[FCMChatScreen] Creating/getting conversation with participant:', participantId);
        const result = await createOrGetConversation(participantId);
        setConversationId(result);
        setCurrentConversation(result);
        
        // Load messages for this conversation
        await loadMessages(result);
        
      } catch (error) {
        console.error('[FCMChatScreen] Failed to initialize conversation:', error);
        Alert.alert('Error', 'Failed to load conversation');
      }
    };

    initializeConversation();
  }, [isInitialized, participantId, createOrGetConversation, setCurrentConversation, loadMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (currentMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [currentMessages]);

  // Track if we've already marked messages as read for this conversation
  const hasMarkedAsReadRef = useRef<string | null>(null);

  // Mark messages as read when conversation becomes active (only once per conversation)
  useEffect(() => {
    if (conversationId && currentMessages.length > 0 && hasMarkedAsReadRef.current !== conversationId) {
      // Check if there are any unread messages before calling the API
      const unreadMessages = currentMessages.filter(msg =>
        msg.senderId !== user?.id?.toString() && !msg.isRead
      );

      if (unreadMessages.length > 0) {
        console.log(`🔍 [FCMChatScreen] Marking ${unreadMessages.length} messages as read for conversation:`, conversationId);
        markAsRead(conversationId);
        hasMarkedAsReadRef.current = conversationId;
      }
    }
  }, [conversationId, currentMessages.length, markAsRead, user?.id]);

  // Reset the flag when conversation changes
  useEffect(() => {
    hasMarkedAsReadRef.current = null;
  }, [conversationId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (currentMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [currentMessages.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setCurrentConversation(null);
    };
  }, [setCurrentConversation]);

  // Handle sending message
  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim() || !conversationId || sending) {
      return;
    }

    try {
      setSending(true);
      await sendMessage(conversationId, messageText.trim());
      setMessageText('');

      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  }, [messageText, conversationId, sending, sendMessage]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (conversationId) {
      await refreshMessages(conversationId);
    }
  }, [conversationId, refreshMessages]);

  // Render message item
  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.senderId === user?.id?.toString();
    const showStatus = isOwn && index === currentMessages.length - 1;

    return (
      <MessageBubble
        message={item}
        isOwn={isOwn}
        showStatus={showStatus}
      />
    );
  }, [user?.id, currentMessages.length]);

  // Show loading if not initialized
  if (!isInitialized) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
          Initializing chat...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={currentMessages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={[styles.messagesList, { marginBottom: keyboardHeight > 0 ? 0 : 0 }]}
        contentContainerStyle={[
          styles.messagesContent,
          { paddingBottom: keyboardHeight > 0 ? 10 : 80 } // Add padding when keyboard is visible
        ]}
        onRefresh={handleRefresh}
        refreshing={loadingMessages}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="chat" size={48} color={colors.text.secondary} />
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              No messages yet. Start the conversation!
            </Text>
          </View>
        }
      />

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            marginBottom: Platform.OS === 'android' ? keyboardHeight : 0
          }
        ]}>
          <TextInput
            style={[styles.textInput, {
              backgroundColor: colors.background,
              color: colors.text.primary,
              borderColor: colors.border
            }]}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            placeholderTextColor={colors.text.secondary}
            multiline
            maxLength={1000}
            editable={!sending}
            onFocus={() => {
              // Scroll to bottom when input is focused
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 300);
            }}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: messageText.trim() && !sending ? COLORS.primary : colors.border,
                opacity: messageText.trim() && !sending ? 1 : 0.5
              }
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Send size={20} color={COLORS.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    flexGrow: 1,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
    marginRight: 4,
  },
  statusIcon: {
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
    minHeight: 44,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FCMChatScreen;
