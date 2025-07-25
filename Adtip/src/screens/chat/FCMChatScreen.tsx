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
  Alert,
  StyleSheet,
  ActivityIndicator,
  Animated,
  LayoutAnimation,
  Keyboard,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Clock, Check, CheckCheck, Send, CircleAlert, ArrowLeft } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { KeyboardAvoiderScrollView, KeyboardAvoiderView } from '@good-react-native/keyboard-avoider';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFCMChat } from '../../contexts/FCMChatContext';
import { Message } from '../../services/FCMChatServiceLocal';
import { RealTimeMessageHandler, useRealTimeMessages } from '../../components/chat/RealTimeMessageHandler';
import { COLORS } from '../../constants/colors';
import Header from '../../components/common/Header';

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
        return 'rgba(255, 255, 255, 0.6)'; // Light gray for sending
      case 'sent':
        return 'rgba(255, 255, 255, 0.8)'; // White for sent
      case 'delivered':
        return 'rgba(255, 255, 255, 0.9)'; // Bright white for delivered
      case 'read':
        return '#2196F3'; // Blue for read (blue double tick)
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
    isInitialized,
    sendMessage,
    createOrGetConversation,
    setCurrentConversation,
    markAsRead,
    loadMessages,
    watermelonManager,
  } = useFCMChat();

  const { participantId, participantName } = route.params;
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loadingLocalMessages, setLoadingLocalMessages] = useState(true);
  const [inputHeight, setInputHeight] = useState(50);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'complete' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const textInputRef = useRef<TextInput>(null);
  const sendButtonScale = useRef(new Animated.Value(1)).current;

  // Real-time message handling
  useRealTimeMessages(conversationId || '');

  // Auto-scroll is handled automatically by KeyboardAvoiderScrollView
  const scrollToBottom = useCallback(() => {
    // KeyboardAvoiderScrollView handles scrolling automatically
    console.log('[FCMChatScreen] Auto-scroll handled by KeyboardAvoiderScrollView');
  }, []);

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

  // Create sync indicator component
  const getSyncIndicator = useCallback(() => {
    switch (syncStatus) {
      case 'syncing':
        return (
          <View style={styles.syncIndicator}>
            <ActivityIndicator size="small" color={colors.text.secondary} />
            <Text style={[styles.syncText, { color: colors.text.secondary }]}>Syncing...</Text>
          </View>
        );
      case 'error':
        return (
          <View style={styles.syncIndicator}>
            <Icon name="error-outline" size={16} color="#FF5252" />
            <Text style={[styles.syncText, { color: '#FF5252' }]}>Sync failed</Text>
          </View>
        );
      case 'complete':
        // Show briefly then hide
        setTimeout(() => setSyncStatus('idle'), 2000);
        return (
          <View style={styles.syncIndicator}>
            <Icon name="check-circle-outline" size={16} color="#4CAF50" />
            <Text style={[styles.syncText, { color: '#4CAF50' }]}>Synced</Text>
          </View>
        );
      default:
        return null;
    }
  }, [syncStatus, colors.text.secondary]);

  // Create back button component
  const getBackButton = useCallback(() => {
    return (
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <ArrowLeft size={24} color={colors.text.primary} />
      </TouchableOpacity>
    );
  }, [navigation, colors.text.primary]);

  // Hide the default navigation header since we're using our own Header component
  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Enhanced keyboard handling for focus management
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        console.log('[FCMChatScreen] Keyboard shown');
        setKeyboardVisible(true);
        // Auto-focus the input when keyboard opens
        if (textInputRef.current) {
          textInputRef.current.focus();
        }
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        console.log('[FCMChatScreen] Keyboard hidden');
        setKeyboardVisible(false);
        // Blur the input when keyboard closes
        if (textInputRef.current) {
          textInputRef.current.blur();
        }
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Initialize conversation (immediate local display, background sync)
  useEffect(() => {
    const initializeConversation = async () => {
      if (!isInitialized || !participantId) return;

      try {
        console.log('[FCMChatScreen] Creating/getting conversation with participant:', participantId);

        // Create conversation immediately (non-blocking)
        const result = await createOrGetConversation(participantId);
        setConversationId(result);
        setCurrentConversation(result);

        // Messages are automatically loaded via reactive subscription
        // No need to wait for loadMessages or backend sync
        setLoadingLocalMessages(false);

        console.log('[FCMChatScreen] ✅ Conversation ready locally, background sync will handle backend data');

      } catch (error) {
        console.error('[FCMChatScreen] Failed to initialize conversation:', error);
        setLoadingLocalMessages(false);
        Alert.alert('Error', 'Failed to load conversation');
      }
    };

    initializeConversation();
  }, [isInitialized, participantId, createOrGetConversation, setCurrentConversation]);

  // Listen for sync status changes
  useEffect(() => {
    if (!watermelonManager || !conversationId) return;

    // Set up sync status listener
    const originalHandler = watermelonManager['eventHandlers'].onSyncStatusChanged;

    watermelonManager['eventHandlers'].onSyncStatusChanged = (status) => {
      // Call original handler if it exists
      originalHandler?.(status);

      // Update local sync status if it's for our conversation
      if (status.conversationId === conversationId) {
        setSyncStatus(status.status);
        setSyncError(status.error);
        console.log('[FCMChatScreen] Sync status updated:', status);
      }
    };

    // Get initial sync status
    const initialStatus = watermelonManager.getSyncStatus(conversationId);
    setSyncStatus(initialStatus.status);
    setSyncError(initialStatus.error);

    // Cleanup
    return () => {
      if (watermelonManager['eventHandlers']) {
        watermelonManager['eventHandlers'].onSyncStatusChanged = originalHandler;
      }
    };
  }, [watermelonManager, conversationId]);

  // Auto-scroll is handled by KeyboardAvoiderScrollView
  useEffect(() => {
    // KeyboardAvoiderScrollView handles auto-scrolling
    console.log('[FCMChatScreen] New messages detected, auto-scroll handled by library');
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

  // Auto-scroll is handled by KeyboardAvoiderScrollView
  useEffect(() => {
    // KeyboardAvoiderScrollView handles auto-scrolling
    console.log('[FCMChatScreen] Messages updated, auto-scroll handled by library');
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

      // Auto-scroll is handled by KeyboardAvoiderScrollView
      console.log('[FCMChatScreen] Input height changed, auto-scroll handled by library');
    }
  }, [inputHeight]);

  // Handle input focus with enhanced scroll behavior
  const handleInputFocus = useCallback(() => {
    // The keyboard avoider will handle scrolling automatically
    console.log('[FCMChatScreen] Input focused, auto-scroll handled by library');
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

    // Auto-scroll is handled by KeyboardAvoiderScrollView
    console.log('[FCMChatScreen] Message sent, auto-scroll handled by library');

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

  // Refresh functionality removed since KeyboardAvoiderScrollView doesn't support pull-to-refresh

  // Render message item
  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.senderId === user?.id?.toString();
    // Show status for ALL own messages to provide complete status visibility
    const showStatus = isOwn;

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
        {/* Debug info for testing */}
        {__DEV__ && (
          <Text style={[styles.debugText, { color: colors.text.secondary }]}>
            Debug: participantId={participantId}, user={user?.id}
          </Text>
        )}
      </View>
    );
  }

  // Additional validation for testing
  if (!participantId || !user?.id) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Icon name="error-outline" size={48} color={colors.text.secondary} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
          Invalid chat parameters
        </Text>
        {__DEV__ && (
          <Text style={[styles.debugText, { color: colors.text.secondary }]}>
            Debug: participantId={participantId}, user={user?.id}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, keyboardVisible && styles.containerKeyboardVisible]}>
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

      {/* Header Component */}
      <Header
        title={participantName || 'Chat'}
        leftComponent={getBackButton()}
        rightComponent={getSyncIndicator()}
        showLogo={false}
        showWallet={false}
        showSearch={false}
        showPremium={false}
        showProfile={false}
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

      {/* Messages List with Keyboard Avoider */}
      <KeyboardAvoiderScrollView
        style={styles.messagesList}
        contentContainerStyle={[
          styles.messagesContent,
          { paddingBottom: 20 } // Minimal padding to ensure messages end above input
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        extraSpace={10}
        animationTime={250}
        iosHideBehavior="revert"
        enableAndroid={true}
      >
        {currentMessages.length === 0 && !loadingLocalMessages ? (
          <View style={styles.emptyContainer}>
            <Icon name="chat" size={48} color={colors.text.secondary} />
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              No messages yet. Start the conversation!
            </Text>
          </View>
        ) : (
          currentMessages.map((item, index) => (
            <View key={item.id}>
              {renderMessage({ item, index })}
            </View>
          ))
        )}
      </KeyboardAvoiderScrollView>

      {/* Input Area - Fixed at bottom */}
      <KeyboardAvoiderView
        avoidMode="whole-view"
        extraSpace={10}
        animationTime={250}
        enableAndroid={true}
        iosHideBehavior="revert"
      >
        <Animated.View style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surface,
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
      </KeyboardAvoiderView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerKeyboardVisible: {
    // Ensure header stays fixed when keyboard is visible
    // The KeyboardAvoider components handle the content adjustment
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
  debugText: {
    marginTop: 8,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  messagesList: {
    flex: 1,
    marginTop: 0, // Header component handles its own spacing
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
  syncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  syncText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FCMChatScreen;