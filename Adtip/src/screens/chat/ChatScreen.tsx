import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator, UIManager, LayoutAnimation } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
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
  const ws = useRef<WebSocket | null>(null);

  // Helper to sort messages by createddate ascending
  const sortedMessages = [...messages].sort((a, b) => new Date(a.createddate).getTime() - new Date(b.createddate).getTime());

  // WebSocket send typing event
  const sendTyping = () => {
    if (ws.current && self) {
      ws.current.send(JSON.stringify({ type: 'typing', receiverId: otherUser.id, userId: self.id }));
    }
  };

  // WebSocket send message event
  const sendMessageWS = (msg: string) => {
    if (ws.current && self) {
      const payload = {
        type: 'message',
        userId: self.id,
        receiverId: otherUser.id,
        message: msg,
        chat_type: 'text',
        chat_type_id_value: 0
      };
      ws.current.send(JSON.stringify(payload));
    }
  };

  // Send message via API and WebSocket
  const handleSend = () => {
    if (!input.trim() || !self) return;
    const now = new Date().toISOString();
    const tempId = Date.now(); // numeric temp ID for ChatMessage
    const msgPayload: ChatMessage = {
      id: tempId,
      sender: self.id,
      receiver: otherUser.id,
      message: input,
      createddate: now,
      is_seen: false,
    };
    setMessages(prev => [...prev, msgPayload]); // Optimistically add to UI
    ApiService.sendChatMessage({
      userId: self.id,
      receiverId: otherUser.id,
      message: input
    });
    sendMessageWS(input);
    setInput('');
    setTyping(false);
  };

  // Typing handler
  const handleTyping = (text: string) => {
    setInput(text);
    if (!typing && self) {
      setTyping(true);
      sendTyping();
      setTimeout(() => setTyping(false), 2000);
    }
  };

  // WebSocket receive logic
  useEffect(() => {
    if (!self) return;
    let isMounted = true;
    const setup = async () => {
      if (!self || !self.id) return;
      ApiService.fetchChatMessages(self.id, otherUser.id).then(res => {
        console.log('Chat API response:', res);
        if (isMounted && Array.isArray(res?.data?.data)) {
          setMessages(res.data.data);
        } else if (isMounted && Array.isArray(res?.data)) {
          setMessages(res.data);
        } else if (isMounted && Array.isArray(res)) {
          setMessages(res);
        } else {
          setMessages([]);
        }
      });
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;
      ws.current = new WebSocket(`${WS_URL}?token=${token}`);
      ws.current.onopen = () => {};
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'message' || data.type === 'message_sent') {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setMessages(prev => [...prev, data.data]); // append new message at end
        } else if (data.type === 'typing' && data.userId === otherUser.id) {
          setIsOtherTyping(true);
          setTimeout(() => setIsOtherTyping(false), 2000);
        } else if (data.type === 'read') {
          setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, is_seen: true } : m));
        }
      };
    };
    setup();
    return () => { isMounted = false; ws.current?.close(); };
  }, [self, otherUser.id]);

  // Render message with date label at top of each day
  const renderItem = ({ item, index }: { item: ChatMessage, index: number }) => {
    const isSelf = self && item.sender === self.id;
    // Show date above the first message of each day
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
          <View>
            <Text style={[styles.headerTitle, { color: isDarkMode ? '#fff' : '#222' }]}>{otherUser.name || 'User'}</Text>
            <Text style={[styles.headerSubtitle, { color: isDarkMode ? '#bbb' : '#888' }]}>Your messages will auto-delete after 1 week</Text>
          </View>
        </View>
        <FlatList
          data={sortedMessages}
          renderItem={({ item, index }) => renderItem({ item, index })}
          keyExtractor={item => item.id.toString()}
          style={styles.list}
          contentContainerStyle={{ padding: 16, paddingBottom: 0 }}
        />
        {isOtherTyping && <Text style={[styles.typingText, { color: isDarkMode ? '#bbb' : '#888' }]}>Typing...</Text>}
        <View style={[styles.inputRow, { backgroundColor: isDarkMode ? '#23272f' : '#fff', borderTopColor: isDarkMode ? '#23272f' : '#eee' }]}> 
          <TextInput
            style={[styles.input, { color: isDarkMode ? '#fff' : '#222', backgroundColor: isDarkMode ? '#23272f' : '#f7f7f7', borderColor: isDarkMode ? '#23272f' : '#eee' }]}
            value={input}
            onChangeText={handleTyping}
            placeholder="Type a message"
            placeholderTextColor={isDarkMode ? '#888' : '#aaa'}
          />
          <TouchableOpacity onPress={handleSend} style={[styles.sendButton, { backgroundColor: isDarkMode ? '#1f7a3e' : '#3B82F6' }]}> 
            <Icon name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradientBg: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backBtn: { marginRight: 16, padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  list: { flex: 1 },
  bubble: { marginVertical: 4, padding: 12, borderRadius: 16, maxWidth: '80%', minWidth: 60 },
  bubbleSelf: {},
  bubbleOther: {},
  bubbleMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, alignSelf: 'flex-end' },
  messageText: { fontSize: 16 },
  timeText: { fontSize: 10, marginLeft: 2 },
  typingText: { fontSize: 14, marginLeft: 24, marginBottom: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 8, borderTopWidth: 1 },
  input: { flex: 1, fontSize: 16, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1 },
  sendButton: { marginLeft: 8, borderRadius: 20, padding: 10 },
});

export default ChatScreen; 