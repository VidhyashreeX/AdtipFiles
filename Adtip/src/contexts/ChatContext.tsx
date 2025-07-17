/**
 * Chat Context for React Native
 * 
 * This context manages global chat state and provides chat functionality
 * throughout the application.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NewChatService, { Message, Conversation, ChatEventHandlers } from '../services/NewChatService';
import { useAuth } from './AuthContext';

interface ChatContextType {
  // Connection state
  isConnected: boolean;
  isInitialized: boolean;
  
  // Conversations
  conversations: Conversation[];
  loadingConversations: boolean;
  
  // Current conversation
  currentConversationId: string | null;
  currentMessages: Message[];
  loadingMessages: boolean;
  
  // Typing indicators
  typingUsers: { [conversationId: string]: string[] };
  
  // Unread counts
  totalUnreadCount: number;
  
  // Actions
  initializeChat: () => Promise<void>;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, replyTo?: string) => Promise<void>;
  createOrGetConversation: (participantId: string) => Promise<string>;
  joinConversation: (conversationId: string) => void;
  leaveConversation: () => void;
  markAsRead: (conversationId: string, messageId?: string) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  
  // Utility
  getConversationById: (conversationId: string) => Conversation | undefined;
  getUnreadCount: (conversationId: string) => number;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  // Auth context
  const { user } = useAuth();
  
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Conversations state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  
  // Current conversation state
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // Typing indicators
  const [typingUsers, setTypingUsers] = useState<{ [conversationId: string]: string[] }>({});
  
  // Initialize chat service when user is authenticated
  const initializeChat = useCallback(async () => {
    if (!user?.id || isInitialized) {
      return;
    }

    try {
      console.log('[ChatContext] Initializing chat service...');

      // Get auth token from AsyncStorage
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        console.error('[ChatContext] No auth token available');
        return;
      }

      await NewChatService.initialize(user.id.toString(), token);
      
      // Setup event handlers
      const eventHandlers: ChatEventHandlers = {
        onConnectionStatusChanged: (connected) => {
          console.log('[ChatContext] Connection status changed:', connected);
          setIsConnected(connected);
        },
        
        onMessageReceived: (message) => {
          console.log('[ChatContext] Message received:', message);
          
          // Add to current messages if it's for the current conversation
          if (message.conversationId === currentConversationId) {
            setCurrentMessages(prev => [...prev, message]);
          }
          
          // Update conversation list
          updateConversationWithMessage(message);
          
          // Auto-mark as read if user is viewing the conversation
          if (message.conversationId === currentConversationId) {
            NewChatService.markAsRead(message.conversationId, message.id);
          }
        },
        
        onMessageSent: (message) => {
          console.log('[ChatContext] Message sent:', message);
          
          // Update message status in current messages
          if (message.conversationId === currentConversationId) {
            setCurrentMessages(prev => 
              prev.map(msg => 
                msg.tempId === message.tempId 
                  ? { ...message, status: 'sent' }
                  : msg
              )
            );
          }
          
          updateConversationWithMessage(message);
        },
        
        onMessageDelivered: (messageId, _deliveredAt) => {
          console.log('[ChatContext] Message delivered:', messageId);
          updateMessageStatus(messageId, 'delivered');
        },

        onMessageRead: (messageId, _readAt, readBy) => {
          console.log('[ChatContext] Message read:', messageId, 'by', readBy);
          updateMessageStatus(messageId, 'read');
        },
        
        onUserTyping: (conversationId, userId, isTyping) => {
          console.log('[ChatContext] User typing:', userId, isTyping, 'in', conversationId);
          
          setTypingUsers(prev => {
            const currentTyping = prev[conversationId] || [];
            
            if (isTyping) {
              // Add user to typing list if not already there
              if (!currentTyping.includes(userId)) {
                return {
                  ...prev,
                  [conversationId]: [...currentTyping, userId]
                };
              }
            } else {
              // Remove user from typing list
              const filtered = currentTyping.filter(id => id !== userId);
              return {
                ...prev,
                [conversationId]: filtered
              };
            }
            
            return prev;
          });
        },
        
        onUserStatusChanged: (userId, status) => {
          console.log('[ChatContext] User status changed:', userId, status);
          
          // Update user status in conversations
          setConversations(prev => 
            prev.map(conv => 
              conv.other_user_id === userId 
                ? { ...conv, other_user_status: status as any }
                : conv
            )
          );
        },
        
        onConversationUpdated: (conversation) => {
          console.log('[ChatContext] Conversation updated:', conversation);
          updateConversation(conversation);
        }
      };
      
      NewChatService.setEventHandlers(eventHandlers);
      setIsInitialized(true);
      
      console.log('[ChatContext] Chat service initialized successfully');
      
    } catch (error) {
      console.error('[ChatContext] Failed to initialize chat service:', error);
    }
  }, [user?.id, isInitialized, currentConversationId]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!isInitialized) return;

    try {
      setLoadingConversations(true);
      const result = await NewChatService.getConversations();
      setConversations(result.conversations);
    } catch (error) {
      console.error('[ChatContext] Failed to load conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  }, [isInitialized]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!isInitialized) {
      console.log('[ChatContext] Cannot load messages - not initialized');
      return;
    }

    try {
      console.log('[ChatContext] Loading messages for conversation:', conversationId);
      setLoadingMessages(true);
      const result = await NewChatService.getMessages(conversationId);
      console.log('[ChatContext] Messages loaded:', {
        count: result.messages?.length || 0,
        messages: result.messages?.slice(0, 3).map(m => ({ id: m.id, content: m.content.substring(0, 20) }))
      });
      setCurrentMessages(result.messages);
    } catch (error) {
      console.error('[ChatContext] Failed to load messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  }, [isInitialized]);

  // Send a message
  const sendMessage = useCallback(async (conversationId: string, content: string, replyTo?: string) => {
    if (!isInitialized || !content.trim()) return;

    try {
      await NewChatService.sendMessage(conversationId, content.trim(), replyTo);
    } catch (error) {
      console.error('[ChatContext] Failed to send message:', error);
      throw error;
    }
  }, [isInitialized]);

  // Create or get conversation
  const createOrGetConversation = useCallback(async (participantId: string): Promise<string> => {
    if (!isInitialized) throw new Error('Chat service not initialized');

    try {
      const result = await NewChatService.createOrGetConversation(participantId);
      
      // Reload conversations to get the new/existing one
      await loadConversations();
      
      return result.conversationId;
    } catch (error) {
      console.error('[ChatContext] Failed to create/get conversation:', error);
      throw error;
    }
  }, [isInitialized, loadConversations]);

  // Join conversation
  const joinConversation = useCallback((conversationId: string) => {
    if (!isInitialized) return;
    
    setCurrentConversationId(conversationId);
    NewChatService.joinConversation(conversationId);
    loadMessages(conversationId);
  }, [isInitialized, loadMessages]);

  // Leave conversation
  const leaveConversation = useCallback(() => {
    setCurrentConversationId(null);
    setCurrentMessages([]);
  }, []);

  // Mark messages as read
  const markAsRead = useCallback((conversationId: string, messageId?: string) => {
    if (!isInitialized) return;
    
    NewChatService.markAsRead(conversationId, messageId);
    
    // Update local unread count
    setConversations(prev => 
      prev.map(conv => 
        conv.conversation_id === conversationId 
          ? { ...conv, unread_count: 0 }
          : conv
      )
    );
  }, [isInitialized]);

  // Start typing
  const startTyping = useCallback((conversationId: string) => {
    if (!isInitialized) return;
    NewChatService.startTyping(conversationId);
  }, [isInitialized]);

  // Stop typing
  const stopTyping = useCallback((conversationId: string) => {
    if (!isInitialized) return;
    NewChatService.stopTyping(conversationId);
  }, [isInitialized]);

  // Helper: Update conversation with new message
  const updateConversationWithMessage = useCallback((message: Message) => {
    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv.conversation_id === message.conversationId) {
          return {
            ...conv,
            last_message_content: message.content,
            last_message_type: message.messageType,
            last_message_time: message.createdAt,
            last_message_sender_name: message.senderName,
            last_activity_at: message.createdAt,
            unread_count: message.senderId !== user?.id?.toString() 
              ? conv.unread_count + 1 
              : conv.unread_count
          };
        }
        return conv;
      });
      
      // Sort by last activity
      return updated.sort((a, b) => 
        new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime()
      );
    });
  }, [user?.id]);

  // Helper: Update conversation
  const updateConversation = useCallback((conversation: Conversation) => {
    setConversations(prev => {
      const index = prev.findIndex(c => c.conversation_id === conversation.conversation_id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = conversation;
        return updated;
      } else {
        return [conversation, ...prev];
      }
    });
  }, []);

  // Helper: Update message status
  const updateMessageStatus = useCallback((messageId: string, status: 'delivered' | 'read') => {
    setCurrentMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, status }
          : msg
      )
    );
  }, []);

  // Utility functions
  const getConversationById = useCallback((conversationId: string) => {
    return conversations.find(c => c.conversation_id === conversationId);
  }, [conversations]);

  const getUnreadCount = useCallback((conversationId: string) => {
    const conversation = getConversationById(conversationId);
    return conversation?.unread_count || 0;
  }, [getConversationById]);

  // Calculate total unread count
  const totalUnreadCount = conversations.reduce((total, conv) => total + conv.unread_count, 0);

  // Initialize chat when user is available
  useEffect(() => {
    const checkAndInitialize = async () => {
      const token = await AsyncStorage.getItem('accessToken');

      console.log('[ChatContext] Initialization check:', {
        userId: user?.id,
        hasToken: !!token,
        isInitialized
      });

      if (user?.id && token && !isInitialized) {
        console.log('[ChatContext] Starting chat initialization...');
        initializeChat();
      } else if (!user?.id) {
        console.log('[ChatContext] No user ID available for chat initialization');
      } else if (!token) {
        console.log('[ChatContext] No auth token available for chat initialization');
      }
    };

    checkAndInitialize();
  }, [user?.id, isInitialized, initializeChat]);

  // Load conversations when chat is initialized
  useEffect(() => {
    if (isInitialized && isConnected) {
      loadConversations();
    }
  }, [isInitialized, isConnected, loadConversations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      NewChatService.disconnect();
    };
  }, []);

  const value: ChatContextType = {
    // Connection state
    isConnected,
    isInitialized,
    
    // Conversations
    conversations,
    loadingConversations,
    
    // Current conversation
    currentConversationId,
    currentMessages,
    loadingMessages,
    
    // Typing indicators
    typingUsers,
    
    // Unread counts
    totalUnreadCount,
    
    // Actions
    initializeChat,
    loadConversations,
    loadMessages,
    sendMessage,
    createOrGetConversation,
    joinConversation,
    leaveConversation,
    markAsRead,
    startTyping,
    stopTyping,
    
    // Utility
    getConversationById,
    getUnreadCount
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
