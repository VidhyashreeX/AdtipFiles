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

// Import the storage prefix constant
const CHAT_STORAGE_PREFIX = '@chat_';

// DISABLED: WebSocket URL (replaced with FCM + API approach)
// const WS_URL = 'wss://api.adtip.in/chat';

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
    page?.messages || []
  ) || [];

  // Add local state for pending messages (optimistic updates)
  const [pendingMessages, setPendingMessages] = useState<ChatMessage[]>([]);
  
  // Combine server messages with pending messages
  const allMessages = [...messages, ...pendingMessages];
  
  // Helper to sort messages by createddate ascending
  const sortedMessages = [...allMessages].sort((a, b) => new Date(a.createddate).getTime() - new Date(b.createddate).getTime());

  // Debug logging for message data
  useEffect(() => {
    console.log('🔍 [ChatScreen] Debug message data:', {
      messagesData: messagesData,
      pages: messagesData?.pages,
      messages: messages,
      pendingMessages: pendingMessages,
      allMessages: allMessages,
      sortedMessages: sortedMessages
    });
  }, [messagesData, messages, pendingMessages, allMessages, sortedMessages]);

  // Check storage on mount for debugging
  useEffect(() => {
    if (self && otherUser) {
      checkStorage();
    }
  }, [self, otherUser]);

  // Test function to add a message to local storage
  const addTestMessage = async () => {
    if (!self) return;
    
    const key = `${CHAT_STORAGE_PREFIX}${self.id}_${otherUser.id}`;
    const now = new Date().toISOString();
    const testMsg = {
      id: Date.now(),
      sender: self.id,
      receiver: otherUser.id,
      message: `Test message at ${new Date().toLocaleTimeString()}`,
      createddate: now,
      is_seen: false,
    };
    
    try {
      const raw = await AsyncStorage.getItem(key);
      let messages = raw ? JSON.parse(raw) : [];
      messages.push(testMsg);
      await AsyncStorage.setItem(key, JSON.stringify(messages));
      console.log('✅ Test message added to storage:', testMsg);
      refetchMessages();
    } catch (error) {
      console.error('❌ Error adding test message:', error);
    }
  };

  // Function to check AsyncStorage contents
  const checkStorage = async () => {
    if (!self) return;
    
    try {
      const key = `${CHAT_STORAGE_PREFIX}${self.id}_${otherUser.id}`;
      const raw = await AsyncStorage.getItem(key);
      console.log('🔍 [ChatScreen] Storage check:', {
        key,
        raw,
        parsed: raw ? JSON.parse(raw) : null
      });
    } catch (error) {
      console.error('❌ Error checking storage:', error);
    }
  };

  // Function to clear chat storage
  const clearStorage = async () => {
    if (!self) return;
    
    try {
      const key = `${CHAT_STORAGE_PREFIX}${self.id}_${otherUser.id}`;
      await AsyncStorage.removeItem(key);
      console.log('🗑️ [ChatScreen] Storage cleared for key:', key);
      refetchMessages();
    } catch (error) {
      console.error('❌ Error clearing storage:', error);
    }
  };

  // Function to manually trigger send message mutation
  const testSendMessage = async () => {
    if (!self) return;
    
    try {
      await sendMessageMutation.mutateAsync({
        userId: self.id,
        receiverId: otherUser.id,
        message: `Test mutation message at ${new Date().toLocaleTimeString()}`
      });
      console.log('✅ Test mutation message sent');
    } catch (error) {
      console.error('❌ Error sending test mutation message:', error);
    }
  };

  // Function to manually save a message to storage (fallback)
  const saveMessageToStorage = async (messageText: string) => {
    if (!self) return;
    
    try {
      const key = `${CHAT_STORAGE_PREFIX}${self.id}_${otherUser.id}`;
      const now = new Date().toISOString();
      const newMsg = {
        id: Date.now(),
        sender: self.id,
        receiver: otherUser.id,
        message: messageText,
        createddate: now,
        is_seen: false,
      };
      
      const raw = await AsyncStorage.getItem(key);
      let messages = raw ? JSON.parse(raw) : [];
      messages.push(newMsg);
      await AsyncStorage.setItem(key, JSON.stringify(messages));
      console.log('✅ Message saved to storage manually:', newMsg);
      refetchMessages();
    } catch (error) {
      console.error('❌ Error saving message to storage:', error);
    }
  };

  // DISABLED: Function to test WebSocket connection (replaced with FCM + API)
  /*
  const testWebSocketConnection = () => {
    console.log('🔍 [ChatScreen] WebSocket connection test:', {
      wsExists: !!ws.current,
      readyState: ws.current?.readyState,
      isConnected,
      isConnecting: isConnectingRef.current
    });

    if (ws.current?.readyState === WebSocket.OPEN) {
      console.log('✅ WebSocket is open and ready');
      // Send a test ping
      ws.current.send(JSON.stringify({ type: 'ping' }));
    } else {
      console.log('❌ WebSocket is not ready, attempting to reconnect');
      connectWebSocket();
    }
  };
  */

  // Function to check storage key consistency
  const checkStorageKeys = async () => {
    if (!self) return;
    
    try {
      const key1 = `${CHAT_STORAGE_PREFIX}${self.id}_${otherUser.id}`;
      const key2 = `${CHAT_STORAGE_PREFIX}${self.id}_${otherUser.id}`;
      
      console.log('🔍 [ChatScreen] Storage key check:', {
        key1,
        key2,
        areEqual: key1 === key2,
        selfId: self.id,
        otherUserId: otherUser.id
      });
      
      const raw1 = await AsyncStorage.getItem(key1);
      const raw2 = await AsyncStorage.getItem(key2);
      
      console.log('🔍 [ChatScreen] Storage contents:', {
        key1Content: raw1 ? JSON.parse(raw1) : null,
        key2Content: raw2 ? JSON.parse(raw2) : null
      });
    } catch (error) {
      console.error('❌ Error checking storage keys:', error);
    }
  };

  // Function to manually test the pruneOldMessages function
  const testPruneFunction = async () => {
    if (!self) return;
    
    try {
      const key = `${CHAT_STORAGE_PREFIX}${self.id}_${otherUser.id}`;
      const raw = await AsyncStorage.getItem(key);
      const messages = raw ? JSON.parse(raw) : [];
      
      console.log('🔍 [ChatScreen] Testing prune function with messages:', messages);
      
      // Import and test the prune function
      const { pruneOldMessages } = require('../../hooks/useQueries');
      const pruned = pruneOldMessages(messages);
      
      console.log('🔍 [ChatScreen] Prune test result:', {
        before: messages.length,
        after: pruned.length,
        removed: messages.length - pruned.length
      });
    } catch (error) {
      console.error('❌ Error testing prune function:', error);
    }
  };

  const testStorageSave = async () => {
    if (!self) return;
    
    try {
      const key = `${CHAT_STORAGE_PREFIX}${self.id}_${otherUser.id}`;
      const testMessage = {
        id: Date.now(),
        sender: self.id,
        receiver: otherUser.id,
        message: 'Test message from storage test',
        createddate: new Date().toISOString(),
        is_seen: false,
      };
      
      console.log('🔍 [ChatScreen] Testing storage save with key:', key);
      console.log('🔍 [ChatScreen] Test message:', testMessage);
      
      // Save test message
      await AsyncStorage.setItem(key, JSON.stringify([testMessage]));
      console.log('✅ Test message saved to storage');
      
      // Read back to verify
      const raw = await AsyncStorage.getItem(key);
      const messages = raw ? JSON.parse(raw) : [];
      console.log('🔍 [ChatScreen] Verification - messages in storage:', messages);
      
      // Force refetch
      refetchMessages();
    } catch (error) {
      console.error('❌ Error testing storage save:', error);
    }
  };

  const testInstantMessage = async () => {
    if (!self) return;
    
    try {
      // Generate a unique test ID that won't conflict with existing messages
      const testId = -Math.floor(Math.random() * 1000000) - 1000000; // Large negative number
      
      // Simulate an incoming message for instant delivery testing
      const incomingMsg = {
        id: testId,
        sender: otherUser.id,
        receiver: self.id,
        message: `Instant message test from other user (${Date.now()})`,
        createddate: new Date().toISOString(),
        is_seen: false,
      };
      
      console.log('🔍 [ChatScreen] Testing instant message delivery:', incomingMsg);
      
      // Add to pending messages for instant display (avoid duplicates)
      setPendingMessages(prev => {
        // Check if message already exists in pending
        const exists = prev.some(msg => msg.id === incomingMsg.id);
        if (exists) {
          console.log('📝 [ChatScreen] Test message already in pending, skipping');
          return prev;
        }
        const newPending = [...prev, incomingMsg];
        console.log('📝 [ChatScreen] Added instant test message to pending:', newPending.length);
        return newPending;
      });
      
      // Save to storage
      const key = `${CHAT_STORAGE_PREFIX}${self.id}_${otherUser.id}`;
      const raw = await AsyncStorage.getItem(key);
      let messages = raw ? JSON.parse(raw) : [];
      messages.push(incomingMsg);
      await AsyncStorage.setItem(key, JSON.stringify(messages));
      console.log('✅ Instant test message saved to storage');
      
      // Remove from pending after a delay
      setTimeout(() => {
        setPendingMessages(prev => prev.filter(msg => msg.id !== incomingMsg.id));
        refetchMessages();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error testing instant message:', error);
    }
  };

  // DISABLED: WebSocket refs (replaced with FCM + API)
  // const ws = useRef<WebSocket & { pingInterval?: NodeJS.Timeout } | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // const messageQueueRef = useRef<string[]>([]);
  // const isConnectingRef = useRef(false);

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

  // DISABLED: WebSocket connection management (replaced with FCM + API)
  /*
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
            console.log('🔍 [ChatScreen] Processing incoming message:', data);
            console.log('🔍 [ChatScreen] Message data:', data.data);
            console.log('🔍 [ChatScreen] Expected sender:', otherUser.id, 'Actual sender:', data.data?.sender);
            console.log('🔍 [ChatScreen] Expected receiver:', self.id, 'Actual receiver:', data.data?.receiver);
            
            if (data.data && data.data.sender === otherUser.id && data.data.receiver === self.id) {
              console.log('✅ [ChatScreen] Message condition matched, processing incoming message...');
              
              // Save incoming message to local storage
              const key = `${CHAT_STORAGE_PREFIX}${self.id}_${otherUser.id}`;
              const incomingMsg = {
                id: data.data.id || Date.now(),
                sender: data.data.sender,
                receiver: data.data.receiver,
                message: data.data.message,
                createddate: data.data.createddate || new Date().toISOString(),
                is_seen: false,
              };
              
              AsyncStorage.getItem(key).then(raw => {
                let messages = raw ? JSON.parse(raw) : [];
                // Check if message already exists
                const exists = messages.some((msg: any) => msg.id === incomingMsg.id);
                if (!exists) {
                  messages.push(incomingMsg);
                  AsyncStorage.setItem(key, JSON.stringify(messages));
                  console.log('✅ Incoming message saved to storage:', incomingMsg);
                  
                  // Add to pending messages for instant display with a negative ID to make it unique
                  const pendingMsg = {
                    ...incomingMsg,
                    id: -Math.abs(incomingMsg.id) // Use negative ID for pending messages
                  };
                  setPendingMessages(prev => {
                    const newPending = [...prev, pendingMsg];
                    console.log('📝 [ChatScreen] Added incoming message to pending:', newPending.length);
                    return newPending;
                  });
                  
                  // Remove the pending message after a short delay and refetch
                  setTimeout(() => {
                    setPendingMessages(prev => prev.filter(msg => msg.id !== pendingMsg.id));
                    refetchMessages();
                    setTimeout(() => scrollToBottom(true), 100);
                  }, 300);
                } else {
                  console.log('⚠️ Message already exists in storage, skipping duplicate');
                }
              });
            } else {
              console.log('❌ [ChatScreen] Message rejected - sender or receiver mismatch');
              console.log('Expected sender:', otherUser.id, 'Got:', data.data?.sender);
              console.log('Expected receiver:', self.id, 'Got:', data.data?.receiver);
            }
          } else if (data.type === 'message_sent') {
            // Confirmation that our message was saved successfully
            if (data.data && data.tempId) {
                          // Remove the pending message smoothly
            setPendingMessages(prev => {
              const filtered = prev.filter(msg => msg.id !== data.tempId);
              console.log('📝 [ChatScreen] Removed pending message, remaining:', filtered.length);
              return filtered;
            });
              
              // Save the confirmed message to local storage
              if (self && data.data) {
                // Use the same key format as useChatMessages hook
                const key = `${CHAT_STORAGE_PREFIX}${self.id}_${otherUser.id}`;
                const confirmedMsg = {
                  id: data.data.id || Date.now(),
                  sender: data.data.sender || self.id,
                  receiver: data.data.receiver || otherUser.id,
                  message: data.data.message,
                  createddate: data.data.createddate || new Date().toISOString(),
                  is_seen: false,
                };
                
                // Use async/await instead of .then() for better error handling
                (async () => {
                  try {
                    console.log('🔍 [ChatScreen] Storage key for confirmed message:', key);
                    const raw = await AsyncStorage.getItem(key);
                    let messages = raw ? JSON.parse(raw) : [];
                    console.log('🔍 [ChatScreen] Before saving confirmed message, current messages:', messages);
                    // Remove any existing message with the same tempId
                    messages = messages.filter((msg: any) => msg.id !== data.tempId);
                    // Add the confirmed message
                    messages.push(confirmedMsg);
                    console.log('🔍 [ChatScreen] Messages after adding confirmed message:', messages);
                    await AsyncStorage.setItem(key, JSON.stringify(messages));
                    console.log('✅ Message confirmed and saved to storage:', confirmedMsg);
                    console.log('✅ Updated messages in storage:', messages);
                    
                    // Verify the save worked by reading back
                    const verifyRaw = await AsyncStorage.getItem(key);
                    const verifyMessages = verifyRaw ? JSON.parse(verifyRaw) : [];
                    console.log('🔍 [ChatScreen] Verification - messages in storage after save:', verifyMessages);
                    
                    // Force a refetch after storage is updated, but with a small delay to avoid blinking
                    setTimeout(() => {
                      console.log('🔄 Forcing refetch after storage update');
                      refetchMessages();
                    }, 50);
                  } catch (error) {
                    console.error('❌ Error saving confirmed message:', error);
                  }
                })();
              }
              
              console.log('Message confirmed via WebSocket, storage update in progress');
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
  */

  // DISABLED: WebSocket send typing event (replaced with FCM + API)
  /*
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
  */

  // DISABLED: WebSocket send message event (replaced with FCM + API)
  /*
  const sendMessageWS = useCallback((msg: string, tempId: number) => {
    if (!self) {
      console.log('❌ Cannot send message - no self user');
      return false;
    }

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
      try {
        ws.current.send(messageString);
        console.log('✅ Message sent via WebSocket successfully');
        return true;
      } catch (error) {
        console.error('❌ Error sending WebSocket message:', error);
        return false;
      }
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
  */

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

  // Send message via API (WebSocket disabled, replaced with FCM + API)
  const handleSend = useCallback(async () => {
    if (!input.trim() || !self) return;

    const now = new Date().toISOString();
    const tempId = -Date.now(); // Use negative number for temp ID to avoid conflicts
    const messageText = input.trim();

    console.log('🎯 [ChatScreen] Sending message:', {
      messageText,
      tempId,
      sender: self.id,
      receiver: otherUser.id
    });

    // Create optimistic message
    const optimisticMessage: ChatMessage = {
      id: tempId,
      sender: self.id,
      receiver: otherUser.id,
      message: messageText,
      createddate: now,
      is_seen: false,
    };

    // Add to pending messages immediately (optimistic update)
    setPendingMessages(prev => {
      const newPending = [...prev, optimisticMessage];
      console.log('📝 [ChatScreen] Pending messages updated:', newPending.length);
      return newPending;
    });

    // Clear input immediately for better UX
    setInput('');
    setInputHeight(40);
    setTyping(false);

    // Auto-scroll after sending
    setTimeout(() => scrollToBottom(true), 100);

    // DISABLED: WebSocket connection logic (replaced with FCM + API)
    /*
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
    } else {
    */

    // Send via API directly (FCM will handle real-time notifications)
    console.log('Sending message via API...');
    await sendMessageAPI(messageText, tempId);

    // DISABLED: WebSocket confirmation timeout (no longer needed with API approach)
    /*
      // Add timeout to handle cases where WebSocket confirmation doesn't come back
      setTimeout(() => {
        // Check if the message is still pending after 5 seconds
        setPendingMessages(prev => {
          const stillPending = prev.find(msg => msg.id === tempId);
          if (stillPending) {
            console.log('⚠️ WebSocket confirmation timeout, saving message manually');
            saveMessageToStorage(messageText);
            return prev.filter(msg => msg.id !== tempId);
          }
          return prev;
        });
      }, 5000);
    }
    */
  }, [input, self, otherUser.id, sendMessageAPI, scrollToBottom]);

  // Enhanced typing handler with multiline support
  const handleTyping = useCallback((text: string) => {
    setInput(text);
    
    // Handle multiline input height
    const lines = text.split('\n').length;
    const newHeight = Math.min(Math.max(40, lines * 20 + 20), 100);
    setInputHeight(newHeight);
    
    if (!typing && self && text.trim()) {
      console.log('User started typing');
      setTyping(true);
      // DISABLED: WebSocket typing indicator (replaced with FCM + API)
      // sendTyping();

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
  }, [typing, self]);

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

  // DISABLED: WebSocket connection setup (replaced with FCM + API)
  /*
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
  */

  // Cleanup effect for typing timeouts
  useEffect(() => {
    return () => {
      // Clear timeouts
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

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

  // Debug effect to log message changes
  useEffect(() => {
    console.log('📊 [ChatScreen] Messages state updated:', {
      serverMessages: messages.length,
      pendingMessages: pendingMessages.length,
      totalMessages: allMessages.length,
      sortedMessages: sortedMessages.length
    });
  }, [messages.length, pendingMessages.length, allMessages.length, sortedMessages.length]);

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
                // Create unique keys to avoid duplicates between server and pending messages
                if (item.id !== undefined && item.id !== null) {
                  // Check if this is a pending message (negative ID)
                  const isPending = item.id < 0;
                  const prefix = isPending ? 'pending' : 'server';
                  return `${prefix}-${Math.abs(item.id)}`;
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
        
        {/* Test button for development */}
        {__DEV__ && (
          <>
            <TouchableOpacity 
              onPress={() => {
                const testMessage: ChatMessage = {
                  id: -Date.now(),
                  sender: self.id,
                  receiver: otherUser.id,
                  message: 'Test message ' + new Date().toLocaleTimeString(),
                  createddate: new Date().toISOString(),
                  is_seen: false,
                };
                setPendingMessages(prev => [...prev, testMessage]);
                setTimeout(() => scrollToBottom(true), 100);
              }}
              style={{
                position: 'absolute',
                top: 100,
                left: 20,
                backgroundColor: '#FF3040',
                padding: 12,
                borderRadius: 8,
                zIndex: 1000,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Test Message</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={addTestMessage}
              style={{
                position: 'absolute',
                top: 150,
                left: 20,
                backgroundColor: '#4CAF50',
                padding: 12,
                borderRadius: 8,
                zIndex: 1000,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Add Test Message</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={checkStorage}
              style={{
                position: 'absolute',
                top: 200,
                left: 20,
                backgroundColor: '#2196F3',
                padding: 12,
                borderRadius: 8,
                zIndex: 1000,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Check Storage</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={clearStorage}
              style={{
                position: 'absolute',
                top: 250,
                left: 20,
                backgroundColor: '#9C27B0',
                padding: 12,
                borderRadius: 8,
                zIndex: 1000,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Clear Storage</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={testSendMessage}
              style={{
                position: 'absolute',
                top: 300,
                left: 20,
                backgroundColor: '#FF9800',
                padding: 12,
                borderRadius: 8,
                zIndex: 1000,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Test Send Mutation</Text>
            </TouchableOpacity>
            {/* DISABLED: WebSocket test button (replaced with FCM + API)
            <TouchableOpacity
              onPress={testWebSocketConnection}
              style={{
                position: 'absolute',
                top: 350,
                left: 20,
                backgroundColor: '#007bff',
                padding: 12,
                borderRadius: 8,
                zIndex: 1000,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Test WebSocket</Text>
            </TouchableOpacity>
            */}
            <TouchableOpacity 
              onPress={() => saveMessageToStorage('Manual save test message')}
              style={{
                position: 'absolute',
                top: 400,
                left: 20,
                backgroundColor: '#607D8B',
                padding: 12,
                borderRadius: 8,
                zIndex: 1000,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Manual Save Message</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={checkStorageKeys}
              style={{
                position: 'absolute',
                top: 450,
                left: 20,
                backgroundColor: '#E91E63',
                padding: 12,
                borderRadius: 8,
                zIndex: 1000,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Check Storage Keys</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={testPruneFunction}
              style={{
                position: 'absolute',
                top: 500,
                left: 20,
                backgroundColor: '#4CAF50',
                padding: 12,
                borderRadius: 8,
                zIndex: 1000,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Test Prune Function</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={testStorageSave}
              style={{
                position: 'absolute',
                top: 550,
                left: 20,
                backgroundColor: '#FF9800',
                padding: 12,
                borderRadius: 8,
                zIndex: 1000,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Test Storage Save</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={testInstantMessage}
              style={{
                position: 'absolute',
                top: 600,
                left: 20,
                backgroundColor: '#9C27B0',
                padding: 12,
                borderRadius: 8,
                zIndex: 1000,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Test Instant Message</Text>
            </TouchableOpacity>
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