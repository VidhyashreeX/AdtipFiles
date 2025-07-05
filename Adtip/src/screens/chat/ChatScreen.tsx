import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator, UIManager, LayoutAnimation } from 'react-native';
import { RouteProp, useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/ApiService';
import { ChatMessage, Contact } from '../../types/api';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../contexts/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';
import ChatBackgroundPattern from '../../components/chat/ChatBackgroundPattern';
import moment from 'moment';
import { 
  useChatMessages, 
  useSendChatMessage, 
  useMarkMessagesAsRead 
} from '../../hooks/useQueries';

// WebSocket URL (update to your backend ws endpoint)
const WS_URL = 'wss://api.adtip.in/chat';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ChatScreenRouteProp = RouteProp<{ Chat: { user: Contact } }, 'Chat'>;

const ChatScreen: React.FC = () => {
  const { user: self } = useAuth();
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation();
  const { colors, isDarkMode } = useTheme();
  const otherUser = route.params.user;
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [inputHeight, setInputHeight] = useState(40);
  const [isUserInChat, setIsUserInChat] = useState(true);
  
  // TanStack Query hooks
  const { 
    data: messagesData, 
    isLoading: isLoadingMessages,
    refetch: refetchMessages 
  } = useChatMessages(Number(self?.id), Number(otherUser.id));

  const sendMessageMutation = useSendChatMessage();
  const markAsReadMutation = useMarkMessagesAsRead();

  // Transform messages data
  const messages: ChatMessage[] = messagesData?.pages?.flatMap(page => 
    page?.messages?.map((msg: any) => ({
      ...msg,
      id: msg.id || `loaded-${Date.now()}-${Math.random()}`
    })) || []
  ) || [];
  
  const ws = useRef<WebSocket & { pingInterval?: NodeJS.Timeout } | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageQueueRef = useRef<string[]>([]);
  const isConnectingRef = useRef(false);

  // Helper to sort messages by createddate ascending
  const sortedMessages = [...messages].sort((a, b) => new Date(a.createddate).getTime() - new Date(b.createddate).getTime());

  // Auto-scroll to bottom function (simplified and reliable)
  const scrollToBottom = useCallback((animated: boolean = true) => {
    if (flatListRef.current && sortedMessages.length > 0) {
      console.log('Scrolling to bottom, animated:', animated, 'messages count:', sortedMessages.length);
      try {
        flatListRef.current.scrollToEnd({ animated });
      } catch (error) {
        console.warn('Error scrolling to bottom:', error);
      }
    }
  }, [sortedMessages.length]);

  // WebSocket connection management
  const connectWebSocket = useCallback(async () => {
    if (!self || ws.current || isConnectingRef.current) {
      console.log('Skipping WebSocket connection:', { 
        self: !!self, 
        wsExists: !!ws.current, 
        isConnecting: isConnectingRef.current 
      });
      return;
    }

    try {
      isConnectingRef.current = true;
      console.log('Starting WebSocket connection...');
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        console.error('No access token found');
        isConnectingRef.current = false;
        return;
      }

      ws.current = new WebSocket(`${WS_URL}?token=${token}`);
      
      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        isConnectingRef.current = false;
        
        // Send queued messages
        while (messageQueueRef.current.length > 0) {
          const queuedMessage = messageQueueRef.current.shift();
          if (queuedMessage && ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(queuedMessage);
          }
        }
        
        // Start ping interval to keep connection alive
        if (ws.current) {
          ws.current.pingInterval = setInterval(() => {
            if (ws.current?.readyState === WebSocket.OPEN) {
              ws.current.send(JSON.stringify({ type: 'ping' }));
              console.log('Ping sent to server');
            } else {
              console.log('WebSocket not open, cannot send ping');
            }
          }, 20000); // Ping every 20 seconds (faster than backend)
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          if (data.type === 'message') {
            // Incoming message from another user
            if (data.data && data.data.sender === otherUser.id && data.data.receiver === self.id) {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              // Refetch messages to get the latest data
              refetchMessages();
              // Auto-scroll after adding new message
              setTimeout(() => scrollToBottom(true), 100);
            }
          } else if (data.type === 'message_sent') {
            // Confirmation that our message was saved successfully
            if (data.data && data.tempId) {
              // Refetch messages to get the updated data
              refetchMessages();
              console.log('Message confirmed via WebSocket, refetching messages');
            }
          } else if (data.type === 'typing' && data.userId === otherUser.id && isUserInChat) {
            console.log('Received typing indicator from user:', data.userId);
            setIsOtherTyping(true);
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => {
              console.log('Hiding typing indicator');
              setIsOtherTyping(false);
            }, 3000);
          } else if (data.type === 'read') {
            // Refetch messages to get updated read status
            refetchMessages();
          } else if (data.type === 'error') {
            console.error('WebSocket error received:', data.message);
          } else if (data.type === 'pong') {
            // Connection is alive
            console.log('WebSocket ping-pong successful');
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
        setIsConnected(false);
        
        // Clear ping interval before setting ws.current to null
        const pingInterval = ws.current?.pingInterval;
        if (pingInterval) {
          clearInterval(pingInterval);
        }
        
        ws.current = null;
        isConnectingRef.current = false;
        
        // Reconnect for any closure except intentional close (1000) when user leaves
        if (isUserInChat) {
          console.log('Attempting to reconnect WebSocket...');
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isUserInChat) { // Double check user is still in chat
              connectWebSocket();
            }
          }, 1000); // Faster reconnection
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
        isConnectingRef.current = false;
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      isConnectingRef.current = false;
    }
  }, [self, otherUser.id, isUserInChat, scrollToBottom]);

  // WebSocket send typing event
  const sendTyping = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN && self) {
      const message = JSON.stringify({ 
        type: 'typing', 
        receiverId: otherUser.id, 
        userId: self.id 
      });
      console.log('Sending typing indicator:', message);
      ws.current.send(message);
    } else {
      console.log('Cannot send typing - WebSocket not ready:', {
        readyState: ws.current?.readyState,
        self: !!self,
        wsExists: !!ws.current
      });
      // Try to reconnect if not connected
      if (!ws.current && !isConnectingRef.current && self) {
        console.log('Attempting to reconnect WebSocket for typing...');
        connectWebSocket();
      }
    }
  }, [self, otherUser.id, connectWebSocket]);

  // WebSocket send message event
  const sendMessageWS = useCallback((msg: string, tempId: number) => {
    if (!self) return false;

    const payload = {
      type: 'message',
      userId: self.id,
      receiverId: otherUser.id,
      message: msg,
      chat_type: 'text',
      chat_type_id_value: 0,
      tempId: tempId // Include tempId for tracking
    };

    console.log('Sending WebSocket message:', payload);
    const messageString = JSON.stringify(payload);

    if (ws.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket is open, sending message');
      ws.current.send(messageString);
      return true;
    } else if (ws.current?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket is connecting, queueing message');
      // Queue message if connecting
      messageQueueRef.current.push(messageString);
      return false; // Will be sent when connection opens
    } else {
      console.log('WebSocket not open, queueing message. ReadyState:', ws.current?.readyState);
      // Queue message if not connected
      messageQueueRef.current.push(messageString);
      // Try to reconnect
      connectWebSocket();
      return false;
    }
  }, [self, otherUser.id, connectWebSocket]);

  // API fallback for sending messages
  const sendMessageAPI = useCallback(async (msg: string, tempId: number) => {
    if (!self) return;

    try {
      await sendMessageMutation.mutateAsync({
        userId: self.id,
        receiverId: otherUser.id,
        message: msg
      });
      
      // The mutation will handle optimistic updates and cache invalidation
      console.log('Message sent successfully via API');
    } catch (error) {
      console.error('API send message failed:', error);
      // The mutation will handle error states
    }
  }, [self, otherUser.id, sendMessageMutation]);

  // Send message via WebSocket with API fallback
  const handleSend = useCallback(async () => {
    if (!input.trim() || !self) return;
    
    const now = new Date().toISOString();
    const tempId = -Date.now(); // Use negative number for temp ID to avoid conflicts
    const msgPayload: ChatMessage = {
      id: tempId,
      sender: self.id,
      receiver: otherUser.id,
      message: input.trim(),
      createddate: now,
      is_seen: false,
    };

    // The mutation will handle optimistic updates automatically
    
    const messageText = input.trim();
    setInput('');
    setInputHeight(40);
    setTyping(false);
    
    // Auto-scroll after sending
    setTimeout(() => scrollToBottom(true), 100);

    // If WebSocket is connecting, wait a bit for it to open
    if (isConnectingRef.current && !ws.current) {
      console.log('WebSocket is connecting, waiting 800ms...');
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    // If still no WebSocket, try to connect before sending
    if (!ws.current && !isConnectingRef.current) {
      console.log('No WebSocket connection, attempting to connect...');
      connectWebSocket();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Try WebSocket first, then fallback to API
    const wsSuccess = sendMessageWS(messageText, tempId);
    if (!wsSuccess) {
      console.log('WebSocket failed, using API fallback');
      await sendMessageAPI(messageText, tempId);
    }
  }, [input, self, otherUser.id, sendMessageWS, sendMessageAPI, scrollToBottom]);

  // Enhanced typing handler with multiline support
  const handleTyping = useCallback((text: string) => {
    setInput(text);
    
    // Handle multiline input height
    const lines = text.split('\n').length;
    const newHeight = Math.min(Math.max(40, lines * 20 + 20), 100);
    setInputHeight(newHeight);
    
    if (!typing && self && text.trim()) {
      console.log('User started typing, sending typing indicator');
      setTyping(true);
      sendTyping();
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout
      typingTimeoutRef.current = setTimeout(() => {
        console.log('User stopped typing');
        setTyping(false);
      }, 2000);
    }
  }, [typing, self, sendTyping]);

  // Handle Enter key press
  const handleKeyPress = useCallback(({ nativeEvent }: any) => {
    if (nativeEvent.key === 'Enter') {
      if (Platform.OS === 'ios') {
        // On iOS, just add new line (default behavior)
        return;
      } else {
        // On Android, we can customize behavior
        // For now, just add new line (default behavior)
        return;
      }
    }
  }, []);

  // Auto-scroll to bottom when messages are loaded
  useEffect(() => {
    if (messages.length > 0 && !isLoadingMessages) {
      setTimeout(() => {
        console.log('Initial scroll to bottom after loading messages');
        scrollToBottom(false);
      }, 500);
      
      // One additional scroll attempt to ensure it works
      setTimeout(() => scrollToBottom(false), 1000);
    }
  }, [messages.length, isLoadingMessages, scrollToBottom]);

  // Setup WebSocket connection immediately when component mounts
  useEffect(() => {
    if (self?.id) {
      // Connect immediately without delay
      console.log('Setting up WebSocket for user:', self.id);
      connectWebSocket();
    }

    return () => {
      // Clear timeouts
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Close WebSocket and clear ping interval
      if (ws.current) {
        const pingInterval = ws.current.pingInterval;
        if (pingInterval) {
          clearInterval(pingInterval);
        }
        ws.current.close();
        ws.current = null;
      }
    };
  }, [self?.id]); // Removed connectWebSocket dependency to prevent loops

  // Separate effect for WebSocket connection setup
  useEffect(() => {
    if (self?.id && !ws.current && !isConnectingRef.current) {
      console.log('Auto-connecting WebSocket...');
      connectWebSocket();
    }
  }, [self?.id, connectWebSocket]);

  // Handle screen focus/blur for chat state management
  useFocusEffect(
    useCallback(() => {
      setIsUserInChat(true);
      
      // Mark messages as read when entering chat
      if (self?.id) {
        markAsReadMutation.mutate({
          userId: self.id,
          senderId: otherUser.id
        });
      }
      
      // Scroll to bottom when focusing on chat (like WhatsApp)
      setTimeout(() => {
        console.log('Chat focused, scrolling to bottom');
        scrollToBottom(false);
      }, 500);
      
      return () => {
        setIsUserInChat(false);
        setIsOtherTyping(false);
      };
    }, [self, otherUser.id, scrollToBottom])
  );

  // Memoized message item component for better performance
  const MessageItem = React.memo(({ item, index, isDarkMode, self }: { 
    item: ChatMessage, 
    index: number, 
    isDarkMode: boolean, 
    self: any 
  }) => {
    const isSelf = self && item.sender === self.id;
    let showDate = false;
    
    if (index === 0) {
      showDate = true;
    } else {
      const currentMsgDate = moment(item.createddate).format('YYYY-MM-DD');
      const prevMsgDate = moment(sortedMessages[index - 1]?.createddate).format('YYYY-MM-DD');
      if (currentMsgDate !== prevMsgDate) {
        showDate = true;
      }
    }
    
    return (
      <>
        {showDate && (
          <View style={{ alignItems: 'center', marginVertical: 8 }}>
            <Text style={{ color: isDarkMode ? '#bbb' : '#888', fontSize: 12 }}>
              {moment(item.createddate).format('DD MMM YYYY')}
            </Text>
          </View>
        )}
        <View style={[
          styles.bubble,
          isSelf ? styles.bubbleSelf : styles.bubbleOther,
          isSelf ? {
            backgroundColor: isDarkMode ? '#1f7a3e' : '#DCF8C6',
            alignSelf: 'flex-end',
            shadowColor: '#1f7a3e',
          } : {
            backgroundColor: isDarkMode ? '#23272f' : '#e3e6ea',
            alignSelf: 'flex-start',
            shadowColor: '#23272f',
          },
          { shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }
        ]}>
          <Text style={[styles.messageText, { color: isDarkMode ? '#fff' : '#222' }]}>{item.message}</Text>
          <View style={styles.bubbleMeta}>
            <Text style={[styles.timeText, { color: isDarkMode ? '#bbb' : '#888' }]}>
              {moment(item.createddate).format('hh:mm a')}
            </Text>
            {isSelf && (
              <Icon name={item.is_seen ? 'check-circle' : 'check'} size={14} color={item.is_seen ? '#4ADE80' : '#A3A3A3'} style={{ marginLeft: 4 }} />
            )}
          </View>
        </View>
      </>
    );
  });

  // Render function for FlatList
  const renderItem = useCallback(({ item, index }: { item: ChatMessage, index: number }) => (
    <MessageItem item={item} index={index} isDarkMode={isDarkMode} self={self} />
  ), [isDarkMode, self]);

  if (!self || isLoadingMessages) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: isDarkMode ? '#181A20' : '#f3f6fa' }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient
        colors={isDarkMode ? ['#16222A', '#3A6073'] : ['#e0eafc', '#cfdef3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBg}
      >
        <ChatBackgroundPattern />
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={22} color={isDarkMode ? '#fff' : '#222'} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: isDarkMode ? '#fff' : '#222' }]}>{otherUser.name || 'User'}</Text>
            <View style={styles.headerStatus}>
              <View style={[styles.connectionDot, { backgroundColor: isConnected ? '#4ADE80' : '#EF4444' }]} />
              <Text style={[styles.headerSubtitle, { color: isDarkMode ? '#bbb' : '#888' }]}>
                {isConnected ? 'Online' : isConnectingRef.current ? 'Connecting...' : 'Reconnecting...'}
              </Text>
            </View>
          </View>
        </View>
        
        {isLoadingMessages ? (
          <View style={[styles.loadingContainer, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color={isDarkMode ? '#fff' : '#333'} />
            <Text style={[styles.loadingText, { color: isDarkMode ? '#bbb' : '#666' }]}>Loading messages...</Text>
          </View>
        ) : (
          <>
            <FlatList
              ref={flatListRef}
              data={sortedMessages}
              renderItem={renderItem}
              keyExtractor={(item, index) => {
                // Ensure we always have a valid key
                if (item.id !== undefined && item.id !== null) {
                  return item.id.toString();
                } else {
                  return `message-${index}-${item.createddate || Date.now()}`;
                }
              }}
              style={styles.list}
              contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
              onContentSizeChange={() => {
                // Scroll to bottom when content size changes (new messages)
                setTimeout(() => scrollToBottom(false), 100);
              }}
              onLayout={() => {
                // Initial layout scroll
                setTimeout(() => scrollToBottom(false), 200);
              }}
              removeClippedSubviews={false}
              maxToRenderPerBatch={15}
              updateCellsBatchingPeriod={50}
              initialNumToRender={25}
              windowSize={15}
              showsVerticalScrollIndicator={true}
              scrollEventThrottle={16}
              scrollEnabled={true}
              nestedScrollEnabled={true}
              bounces={true}
            />
            
            {isOtherTyping && isUserInChat && (
              <View style={styles.typingContainer}>
                <View style={styles.typingBubble}>
                  <Text style={[styles.typingText, { color: isDarkMode ? '#bbb' : '#888' }]}>
                    {otherUser.name} is typing
                  </Text>
                  <View style={styles.typingDots}>
                    <View style={[styles.typingDot, { backgroundColor: isDarkMode ? '#bbb' : '#888' }]} />
                    <View style={[styles.typingDot, { backgroundColor: isDarkMode ? '#bbb' : '#888' }]} />
                    <View style={[styles.typingDot, { backgroundColor: isDarkMode ? '#bbb' : '#888' }]} />
                  </View>
                </View>
              </View>
            )}
          </>
        )}
        
        <View style={[styles.inputRow, { backgroundColor: isDarkMode ? '#23272f' : '#fff', borderTopColor: isDarkMode ? '#23272f' : '#eee' }]}> 
          <TextInput
            style={[
              styles.input, 
              { 
                color: isDarkMode ? '#fff' : '#222', 
                backgroundColor: isDarkMode ? '#23272f' : '#f7f7f7', 
                borderColor: isDarkMode ? '#23272f' : '#eee',
                height: inputHeight,
                textAlignVertical: 'top'
              }
            ]}
            value={input}
            onChangeText={handleTyping}
            onKeyPress={handleKeyPress}
            placeholder="Type a message"
            placeholderTextColor={isDarkMode ? '#888' : '#aaa'}
            multiline={true}
            maxLength={1000}
            returnKeyType="default"
            blurOnSubmit={false}
          />
          <TouchableOpacity 
            onPress={() => {
              handleSend();
            }}
            style={[
              styles.sendButton, 
              { 
                backgroundColor: input.trim() ? (isDarkMode ? '#1f7a3e' : '#3B82F6') : (isDarkMode ? '#555' : '#ccc'),
                opacity: input.trim() ? 1 : 0.5
              }
            ]}
            disabled={!input.trim()}
            activeOpacity={0.7}
          > 
            <Icon name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradientBg: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backBtn: { marginRight: 16, padding: 4 },
  headerContent: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  headerStatus: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 2 
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  headerSubtitle: { fontSize: 12 },
  loadingContainer: { flex: 1 },
  loadingText: { marginTop: 12, fontSize: 16 },
  list: { flex: 1 },
  bubble: { 
    marginVertical: 4, 
    padding: 12, 
    borderRadius: 16, 
    maxWidth: '80%', 
    minWidth: 60 
  },
  bubbleSelf: {},
  bubbleOther: {},
  bubbleMeta: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 4, 
    alignSelf: 'flex-end' 
  },
  messageText: { fontSize: 16, lineHeight: 20 },
  timeText: { fontSize: 10, marginLeft: 2 },
  typingContainer: { 
    paddingHorizontal: 16, 
    paddingBottom: 8 
  },
  typingBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: { fontSize: 14, marginRight: 8 },
  typingDots: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  typingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  inputRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    padding: 8, 
    borderTopWidth: 1 
  },
  input: { 
    flex: 1, 
    fontSize: 16, 
    borderRadius: 20, 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderWidth: 1,
    maxHeight: 100,
  },
  sendButton: { 
    marginLeft: 8, 
    borderRadius: 20, 
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatScreen; 