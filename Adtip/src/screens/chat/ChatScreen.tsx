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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [inputHeight, setInputHeight] = useState(40);
  const [isUserInChat, setIsUserInChat] = useState(true);
  
  const ws = useRef<WebSocket | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageQueueRef = useRef<string[]>([]);

  // Helper to sort messages by createddate ascending
  const sortedMessages = [...messages].sort((a, b) => new Date(a.createddate).getTime() - new Date(b.createddate).getTime());

  // Auto-scroll to bottom function
  const scrollToBottom = useCallback((animated: boolean = true) => {
    if (flatListRef.current && sortedMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated });
      }, 100);
    }
  }, [sortedMessages.length]);

  // WebSocket connection management
  const connectWebSocket = useCallback(async () => {
    if (!self || ws.current) return;

    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;

      ws.current = new WebSocket(`${WS_URL}?token=${token}`);
      
      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        
        // Send queued messages
        while (messageQueueRef.current.length > 0) {
          const queuedMessage = messageQueueRef.current.shift();
          if (queuedMessage && ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(queuedMessage);
          }
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          if (data.type === 'message' || data.type === 'message_sent') {
            // Check if the message is for current conversation
            if (data.data && (
              (data.data.sender === otherUser.id && data.data.receiver === self.id) ||
              (data.data.sender === self.id && data.data.receiver === otherUser.id)
            )) {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setMessages(prev => {
                // Avoid duplicates
                const exists = prev.some(msg => msg.id === data.data.id);
                if (exists) return prev;
                const newMessages = [...prev, data.data];
                // Auto-scroll after adding new message
                setTimeout(() => scrollToBottom(true), 100);
                return newMessages;
              });
            }
          } else if (data.type === 'typing' && data.userId === otherUser.id && isUserInChat) {
            setIsOtherTyping(true);
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => {
              setIsOtherTyping(false);
            }, 3000);
          } else if (data.type === 'read') {
            setMessages(prev => prev.map(m => 
              m.id === data.messageId ? { ...m, is_seen: true } : m
            ));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.reason);
        setIsConnected(false);
        ws.current = null;
        
        // Attempt to reconnect after 3 seconds
        if (isUserInChat) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 3000);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
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
      ws.current.send(message);
    }
  }, [self, otherUser.id]);

  // WebSocket send message event
  const sendMessageWS = useCallback((msg: string) => {
    if (!self) return;

    const payload = {
      type: 'message',
      userId: self.id,
      receiverId: otherUser.id,
      message: msg,
      chat_type: 'text',
      chat_type_id_value: 0
    };

    const messageString = JSON.stringify(payload);

    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(messageString);
    } else {
      // Queue message if not connected
      messageQueueRef.current.push(messageString);
      // Try to reconnect
      connectWebSocket();
    }
  }, [self, otherUser.id, connectWebSocket]);

  // Send message via API and WebSocket
  const handleSend = useCallback(() => {
    if (!input.trim() || !self) return;
    
    const now = new Date().toISOString();
    const tempId = Date.now();
    const msgPayload: ChatMessage = {
      id: tempId,
      sender: self.id,
      receiver: otherUser.id,
      message: input.trim(),
      createddate: now,
      is_seen: false,
    };

    // Optimistically add to UI
    setMessages(prev => [...prev, msgPayload]);
    
    // Send via API and WebSocket
    ApiService.sendChatMessage({
      userId: self.id,
      receiverId: otherUser.id,
      message: input.trim()
    });
    
    sendMessageWS(input.trim());
    setInput('');
    setInputHeight(40);
    setTyping(false);
    
    // Auto-scroll after sending
    setTimeout(() => scrollToBottom(true), 100);
  }, [input, self, otherUser.id, sendMessageWS, scrollToBottom]);

  // Enhanced typing handler with multiline support
  const handleTyping = useCallback((text: string) => {
    setInput(text);
    
    // Handle multiline input height
    const lines = text.split('\n').length;
    const newHeight = Math.min(Math.max(40, lines * 20 + 20), 100);
    setInputHeight(newHeight);
    
    if (!typing && self && text.trim()) {
      setTyping(true);
      sendTyping();
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout
      typingTimeoutRef.current = setTimeout(() => {
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

  // Load messages and setup WebSocket
  useEffect(() => {
    let isMounted = true;
    
    const setupChat = async () => {
      if (!self?.id) return;
      
      try {
        // Fetch existing messages
        const res = await ApiService.fetchChatMessages(self.id, otherUser.id);
        console.log('Chat API response:', res);
        
        if (isMounted) {
          if (Array.isArray(res?.data?.data)) {
            setMessages(res.data.data);
          } else if (Array.isArray(res?.data)) {
            setMessages(res.data);
          } else if (Array.isArray(res)) {
            setMessages(res);
          } else {
            setMessages([]);
          }
          
          // Auto-scroll to bottom after loading messages
          setTimeout(() => scrollToBottom(false), 500);
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        if (isMounted) {
          setMessages([]);
        }
      }
      
      // Connect WebSocket
      connectWebSocket();
    };

    setupChat();

    return () => {
      isMounted = false;
      setIsUserInChat(false);
      
      // Clear timeouts
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Close WebSocket
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, [self, otherUser.id, connectWebSocket, scrollToBottom]);

  // Handle screen focus/blur for chat state management
  useFocusEffect(
    useCallback(() => {
      setIsUserInChat(true);
      
      // Mark messages as read when entering chat
      if (self?.id) {
        ApiService.get(`/api/seenallmessage/${self.id}/${otherUser.id}`)
          .catch(error => console.error('Failed to mark messages as read:', error));
      }
      
      return () => {
        setIsUserInChat(false);
        setIsOtherTyping(false);
      };
    }, [self, otherUser.id])
  );

  // Render message with date label at top of each day
  const renderItem = ({ item, index }: { item: ChatMessage, index: number }) => {
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
  };

  if (!self) {
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
                {isConnected ? 'Connected' : 'Connecting...'}
              </Text>
            </View>
          </View>
        </View>
        
        <FlatList
          ref={flatListRef}
          data={sortedMessages}
          renderItem={({ item, index }) => renderItem({ item, index })}
          keyExtractor={item => item.id.toString()}
          style={styles.list}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          onContentSizeChange={() => scrollToBottom(true)}
          onLayout={() => scrollToBottom(false)}
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
            onPress={handleSend} 
            style={[
              styles.sendButton, 
              { 
                backgroundColor: input.trim() ? (isDarkMode ? '#1f7a3e' : '#3B82F6') : (isDarkMode ? '#555' : '#ccc'),
                opacity: input.trim() ? 1 : 0.5
              }
            ]}
            disabled={!input.trim()}
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