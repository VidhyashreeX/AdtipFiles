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
  Animated,
  LayoutAnimation,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Clock, Check, CheckCheck, Send, CircleAlert } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFCMChat } from '../../contexts/FCMChatContext';
import { Message } from '../../services/FCMChatServiceLocal';
import { RealTimeMessageHandler, useRealTimeMessages } from '../../components/chat/RealTimeMessageHandler';
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
  const { colors, isDarkMode } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Animate message appearance
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  const getStatusIcon = () => {
    // Debug log to see message status
    if (message.status === 'failed') {
      console.log('[FCMChatScreen] 🔴 Failed message detected:', {
        id: message.id,
        tempId: message.tempId,
        status: message.status,
        content: message.content.substring(0, 20) + '...'
      });
    }

    switch (message.status) {
      case 'sending':
        return Clock;
      case 'sent':
        return Check;
      case 'delivered':
        return CheckCheck;
      case 'read':
        return CheckCheck;
      case 'failed':
        return CircleAlert;
      default:
        return Clock;
    }
  };

  const getStatusColor = () => {
    switch (message.status) {
      case 'sending':
        return 'rgba(255, 255, 255, 0.6)';
      case 'sent':
        return 'rgba(255, 255, 255, 0.8)';
      case 'delivered':
        return 'rgba(255, 255, 255, 0.9)';
      case 'read':
        return '#00E676'; // Bright green for read
      case 'failed':
        return '#FF5252'; // Red for failed
      default:
        return 'rgba(255, 255, 255, 0.6)';
    }
  };

  const ownMessageGradient = isDarkMode
    ? ['#24d05a', '#1db954']
    : ['#24d05a', '#00C853'];

  const otherMessageGradient = isDarkMode
    ? ['#2D2D2D', '#1A1A1A']
    : ['#F5F5F5', '#EEEEEE'];

  return (
    <Animated.View
      style={[
        styles.messageBubbleContainer,
        isOwn ? styles.ownMessageContainer : styles.otherMessageContainer,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        }
      ]}
    >
      {isOwn ? (
        <LinearGradient
          colors={ownMessageGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.messageBubble, styles.ownMessage]}
        >
          <Text style={[styles.messageText, { color: COLORS.white }]}>
            {message.content}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, { color: 'rgba(255, 255, 255, 0.8)' }]}>
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
            {showStatus && (() => {
              const StatusIcon = getStatusIcon();
              return (
                <StatusIcon
                  size={14}
                  color={getStatusColor()}
                  style={styles.statusIcon}
                />
              );
            })()}
          </View>
        </LinearGradient>
      ) : (
        <LinearGradient
          colors={otherMessageGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.messageBubble, styles.otherMessage]}
        >
          <Text style={[styles.messageText, { color: colors.text.primary }]}>
            {message.content}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, { color: colors.text.secondary }]}>
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        </LinearGradient>
      )}
    </Animated.View>
  );
};

const FCMChatScreen: React.FC = () => {
  const route = useRoute<FCMChatScreenRouteProp>();
  const navigation = useNavigation<FCMChatScreenNavigationProp>();
  const { user } = useAuth();
  const { colors } = useTheme();

  const {
    currentMessages,
    loadingMessages,
    isInitialized,
    sendMessage,
    createOrGetConversation,
    setCurrentConversation,
    markAsRead,
    loadMessages,
    refreshMessages,
    showChatUnavailableAlert,
  } = useFCMChat();

  const { participantId, participantName } = route.params;
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [loadingLocalMessages, setLoadingLocalMessages] = useState(true);
  const [inputHeight, setInputHeight] = useState(50);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const textInputRef = useRef<TextInput>(null);
  const sendButtonScale = useRef(new Animated.Value(1)).current;
  const keyboardAnimationValue = useRef(new Animated.Value(0)).current;
  const inputContainerAnimValue = useRef(new Animated.Value(0)).current;

  // Real-time message handling
  const { isActive } = useRealTimeMessages(conversationId || '');

  // Auto-scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (flatListRef.current && currentMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [currentMessages.length]);

  // Handle real-time message events
  const handleMessageReceived = useCallback((message: Message) => {
    console.log('[FCMChatScreen] Real-time message received:', message.id);
    // Auto-scroll to new message
    scrollToBottom();
  }, [scrollToBottom]);

  const handleMessageSent = useCallback((message: Message) => {
    console.log('[FCMChatScreen] Real-time message sent:', message.id);
    // Auto-scroll to new message
    scrollToBottom();
  }, [scrollToBottom]);

  // Set navigation title and header styling
  useEffect(() => {
    navigation.setOptions({
      title: participantName || 'Chat',
      headerStyle: {
        backgroundColor: colors.background,
        elevation: 0, // Remove shadow on Android
        shadowOpacity: 0, // Remove shadow on iOS
        borderBottomWidth: 0, // Remove border
      },
      headerTintColor: colors.text.primary,
      headerTitleStyle: {
        color: colors.text.primary,
        fontWeight: '600',
      },
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            console.log('[FCMChatScreen] 🧪 Testing chat unavailable alert');
            showChatUnavailableAlert(participantName || 'Test User');
          }}
          style={{ marginRight: 15, padding: 5 }}
        >
          <Text style={{ color: colors.text.primary, fontSize: 12 }}>TEST</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, participantName, colors.text.primary, colors.background, showChatUnavailableAlert]);

  // Enhanced keyboard handling with smooth animations
  useEffect(() => {
    // Configure layout animations for smooth transitions
    LayoutAnimation.configureNext({
      duration: 250,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });

    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        const keyboardHeight = e.endCoordinates.height;
        setKeyboardHeight(keyboardHeight);
        setIsKeyboardVisible(true);

        // Smooth keyboard animation
        Animated.parallel([
          Animated.timing(keyboardAnimationValue, {
            toValue: 1,
            duration: 250,
            useNativeDriver: false,
          }),
          Animated.timing(inputContainerAnimValue, {
            toValue: keyboardHeight,
            duration: 250,
            useNativeDriver: false,
          }),
        ]).start();

        // Auto-scroll to bottom with proper timing
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);

        // Smooth keyboard hide animation
        Animated.parallel([
          Animated.timing(keyboardAnimationValue, {
            toValue: 0,
            duration: 250,
            useNativeDriver: false,
          }),
          Animated.timing(inputContainerAnimValue, {
            toValue: 0,
            duration: 250,
            useNativeDriver: false,
          }),
        ]).start();
      }
    );

    const keyboardWillShowListener = Platform.OS === 'ios' 
      ? Keyboard.addListener('keyboardWillShow', (e) => {
          // Pre-animate for iOS for smoother experience
          const keyboardHeight = e.endCoordinates.height;
          setKeyboardHeight(keyboardHeight);
          setIsKeyboardVisible(true);
        })
      : null;

    const keyboardWillHideListener = Platform.OS === 'ios'
      ? Keyboard.addListener('keyboardWillHide', () => {
          setIsKeyboardVisible(false);
        })
      : null;

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
      keyboardWillShowListener?.remove();
      keyboardWillHideListener?.remove();
    };
  }, [keyboardAnimationValue, inputContainerAnimValue]);

  // Initialize conversation
  useEffect(() => {
    const initializeConversation = async () => {
      if (!isInitialized || !participantId) return;

      try {
        setLoadingLocalMessages(true);
        console.log('[FCMChatScreen] Creating/getting conversation with participant:', participantId);
        const result = await createOrGetConversation(participantId);
        setConversationId(result);
        setCurrentConversation(result);

        // Load messages for this conversation
        await loadMessages(result);
        setLoadingLocalMessages(false);

      } catch (error) {
        console.error('[FCMChatScreen] Failed to initialize conversation:', error);
        setLoadingLocalMessages(false);
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

  // Cleanup conversation state when component unmounts
  useEffect(() => {
    return () => {
      // Clear conversation state when leaving the screen
      setCurrentConversation(null);
      console.log('[FCMChatScreen] Cleared conversation state on unmount');
    };
  }, [setCurrentConversation]);

  // Mark messages as read when conversation becomes active (only once per conversation)
  useEffect(() => {
    if (conversationId && currentMessages.length > 0 && hasMarkedAsReadRef.current !== conversationId) {
      // Check if there are any unread messages before calling the API
      const unreadMessages = currentMessages.filter(msg =>
        msg.senderId !== user?.id?.toString() && msg.status !== 'read'
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

  // Animate send button on press
  const animateSendButton = useCallback(() => {
    Animated.sequence([
      Animated.timing(sendButtonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(sendButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [sendButtonScale]);

  // Handle input text change with dynamic height
  const handleTextChange = useCallback((text: string) => {
    setMessageText(text);
    
    // Calculate dynamic height based on content
    const lines = text.split('\n').length;
    const calculatedHeight = Math.min(Math.max(50, lines * 20 + 30), 120);
    
    if (calculatedHeight !== inputHeight) {
      LayoutAnimation.configureNext({
        duration: 200,
        create: {
          type: LayoutAnimation.Types.easeInEaseOut,
          property: LayoutAnimation.Properties.opacity,
        },
        update: {
          type: LayoutAnimation.Types.easeInEaseOut,
        },
      });
      setInputHeight(calculatedHeight);
      
      // Ensure messages remain visible above input
      setTimeout(() => {
        if (isKeyboardVisible) {
          flatListRef.current?.scrollToEnd({ animated: true });
        }
      }, 100);
    }
  }, [inputHeight, isKeyboardVisible]);

  // Handle input focus with enhanced scroll behavior
  const handleInputFocus = useCallback(() => {
    // Delay scroll to ensure keyboard animation completes
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, Platform.OS === 'ios' ? 300 : 400);
  }, []);

  // Handle sending message
  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim() || !conversationId || sending) {
      return;
    }

    const messageToSend = messageText.trim();

    // Animate send button
    animateSendButton();

    // Reset input immediately for better UX
    setMessageText('');
    setInputHeight(50); // Reset input height

    // Scroll to bottom immediately to show the optimistic message
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);

    try {
      setSending(true);
      await sendMessage(conversationId, messageToSend);
      console.log('✅ [FCMChatScreen] Message sent successfully');

    } catch (error) {
      console.error('❌ [FCMChatScreen] Failed to send message:', error);
      // Restore message text on failure
      setMessageText(messageToSend);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  }, [messageText, conversationId, sending, sendMessage, animateSendButton]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (conversationId) {
      await refreshMessages(conversationId);
    }
  }, [conversationId, refreshMessages]);

  // Render message item
  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.senderId === user?.id?.toString();
    // Show status for all own messages, especially failed ones
    // Also show for the last message as before
    const showStatus = isOwn && (
      index === currentMessages.length - 1 ||
      item.status === 'failed'
    );

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
    <View style={styles.container}>
      {/* Vibrant Gradient Background */}
      <LinearGradient
        colors={colors.background === '#000000'
          ? ['#0A0A0A', '#1A1A1A', '#0F0F0F']
          : ['#E3F2FD', '#F8F9FA', '#FFFFFF']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />

      {/* Real-time Message Handler */}
      {conversationId && (
        <RealTimeMessageHandler
          conversationId={conversationId}
          onMessageReceived={handleMessageReceived}
          onMessageSent={handleMessageSent}
          onAutoScroll={scrollToBottom}
        />
      )}

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
          !loadingLocalMessages ? (
            <View style={styles.emptyContainer}>
              <Icon name="chat" size={48} color={colors.text.secondary} />
              <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                No messages yet. Start the conversation!
              </Text>
            </View>
          ) : null
        }
      />

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <Animated.View style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            marginBottom: Platform.OS === 'android' ? keyboardHeight : 0,
            height: inputHeight + 24, // Dynamic height based on input content
          }
        ]}>
          <TextInput
            ref={textInputRef}
            style={[styles.textInput, {
              backgroundColor: colors.background,
              color: colors.text.primary,
              borderColor: colors.border,
              height: inputHeight,
            }]}
            value={messageText}
            onChangeText={handleTextChange}
            placeholder="Type a message..."
            placeholderTextColor={colors.text.secondary}
            multiline
            maxLength={1000}
            editable={!sending}
            onFocus={handleInputFocus}
            textAlignVertical="top"
            scrollEnabled={inputHeight >= 120}
          />

          <Animated.View
            style={[
              styles.sendButtonContainer,
              {
                transform: [{ scale: sendButtonScale }],
              }
            ]}
          >
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!messageText.trim() || sending}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={messageText.trim() && !sending
                  ? ['#24d05a', '#00C853']
                  : [colors.border, colors.border]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.sendButton,
                  {
                    opacity: messageText.trim() && !sending ? 1 : 0.5
                  }
                ]}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Send size={20} color={COLORS.white} />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    flexGrow: 1,
  },
  messageBubbleContainer: {
    marginVertical: 3,
    maxWidth: '85%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ownMessage: {
    borderBottomRightRadius: 6,
  },
  otherMessage: {
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  messageTime: {
    fontSize: 11,
    fontWeight: '500',
    marginRight: 4,
  },
  statusIcon: {
    marginLeft: 2,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 120,
    fontSize: 16,
    minHeight: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sendButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default FCMChatScreen;