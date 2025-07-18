/**
 * FCM Chat Context for React Native
 * 
 * This context manages global chat state using FCM high priority notifications
 * for reliable message delivery, replacing Socket.IO with API-based messaging.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FCMChatService, { Message, Conversation, FCMChatEventHandlers } from '../services/FCMChatService';
import { useAuth } from './AuthContext';

interface FCMChatContextType {
  // Connection state
  isInitialized: boolean;
  
  // Conversations
  conversations: Conversation[];
  loadingConversations: boolean;
  
  // Current conversation
  currentConversationId: string | null;
  currentMessages: Message[];
  loadingMessages: boolean;
  
  // Unread counts
  totalUnreadCount: number;
  
  // Actions
  initializeChat: () => Promise<void>;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, replyTo?: string) => Promise<void>;
  createOrGetConversation: (participantId: string) => Promise<string>;
  setCurrentConversation: (conversationId: string | null) => void;
  markAsRead: (conversationId: string, messageId?: string) => Promise<void>;
  
  // Utility
  getConversationById: (conversationId: string) => Conversation | undefined;
  getUnreadCount: (conversationId: string) => number;
  refreshMessages: (conversationId: string) => Promise<void>;
}

const FCMChatContext = createContext<FCMChatContextType | undefined>(undefined);

interface FCMChatProviderProps {
  children: ReactNode;
}

export const FCMChatProvider: React.FC<FCMChatProviderProps> = ({ children }) => {
  const { user, authToken } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  const fcmChatService = FCMChatService.getInstance();

  // Initialize chat service
  const initializeChat = useCallback(async () => {
    if (!user?.id || !authToken || isInitialized) {
      return;
    }

    try {
      console.log('[FCMChatContext] Initializing FCM chat service...');
      
      // Setup event handlers
      const eventHandlers: FCMChatEventHandlers = {
        onMessageReceived: handleMessageReceived,
        onMessageSent: handleMessageSent,
        onMessageDelivered: handleMessageDelivered,
        onConversationUpdated: handleConversationUpdated,
      };

      fcmChatService.setEventHandlers(eventHandlers);
      
      // Initialize the service
      await fcmChatService.initialize(user.id.toString(), authToken);
      
      setIsInitialized(true);
      console.log('[FCMChatContext] FCM chat service initialized successfully');
      
      // Load initial conversations
      await loadConversations();
      
    } catch (error) {
      console.error('[FCMChatContext] Failed to initialize chat service:', error);
    }
  }, [user?.id, authToken, isInitialized]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!isInitialized) return;

    try {
      setLoadingConversations(true);
      const result = await fcmChatService.getConversations();
      setConversations(result.conversations);
      
      // Calculate total unread count
      const unreadCount = result.conversations.reduce((total, conv) => total + conv.unreadCount, 0);
      setTotalUnreadCount(unreadCount);
      
    } catch (error) {
      console.error('[FCMChatContext] Failed to load conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  }, [isInitialized]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!isInitialized) return;

    try {
      setLoadingMessages(true);
      
      // First load from local storage for immediate display
      const localMessages = await fcmChatService.getMessagesFromLocal(conversationId);
      setCurrentMessages(localMessages);
      
      // Then fetch from server for latest messages
      const result = await fcmChatService.getMessages(conversationId);
      setCurrentMessages(result.messages);
      
    } catch (error) {
      console.error('[FCMChatContext] Failed to load messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  }, [isInitialized]);

  // Send a message
  const sendMessage = useCallback(async (conversationId: string, content: string, replyTo?: string) => {
    if (!isInitialized || !content.trim()) return;

    try {
      await fcmChatService.sendMessage(conversationId, content.trim(), replyTo);
    } catch (error) {
      console.error('[FCMChatContext] Failed to send message:', error);
      throw error;
    }
  }, [isInitialized]);

  // Create or get conversation
  const createOrGetConversation = useCallback(async (participantId: string): Promise<string> => {
    if (!isInitialized) {
      throw new Error('Chat service not initialized');
    }

    try {
      const result = await fcmChatService.createOrGetConversation(participantId);
      
      // Refresh conversations to include the new one
      await loadConversations();
      
      return result.conversationId;
    } catch (error) {
      console.error('[FCMChatContext] Failed to create conversation:', error);
      throw error;
    }
  }, [isInitialized, loadConversations]);

  // Set current conversation
  const setCurrentConversation = useCallback((conversationId: string | null) => {
    setCurrentConversationId(conversationId);
    if (!conversationId) {
      setCurrentMessages([]);
    }
  }, []);

  // Mark messages as read
  const markAsRead = useCallback(async (conversationId: string, messageId?: string) => {
    if (!isInitialized) return;

    try {
      await fcmChatService.markAsRead(conversationId, messageId);
      
      // Update local conversation unread count
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unreadCount: 0 }
          : conv
      ));
      
      // Recalculate total unread count
      setTotalUnreadCount(prev => {
        const conversation = conversations.find(c => c.id === conversationId);
        return prev - (conversation?.unreadCount || 0);
      });
      
    } catch (error) {
      console.error('[FCMChatContext] Failed to mark as read:', error);
    }
  }, [isInitialized, conversations]);

  // Refresh messages for current conversation
  const refreshMessages = useCallback(async (conversationId: string) => {
    if (conversationId === currentConversationId) {
      await loadMessages(conversationId);
    }
  }, [currentConversationId, loadMessages]);

  // Event handlers
  const handleMessageReceived = useCallback((message: Message) => {
    console.log('[FCMChatContext] Message received:', message);
    
    // Add to current messages if it's for the current conversation
    if (message.conversationId === currentConversationId) {
      setCurrentMessages(prev => {
        // Check if message already exists
        const exists = prev.some(m => m.id === message.id);
        if (exists) return prev;
        
        // Add new message and sort by creation time
        const updated = [...prev, message];
        return updated.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      });
    }
    
    // Update conversation last message and unread count
    setConversations(prev => prev.map(conv => {
      if (conv.id === message.conversationId) {
        return {
          ...conv,
          lastMessage: message,
          unreadCount: conv.id === currentConversationId ? conv.unreadCount : conv.unreadCount + 1,
          lastActivity: message.createdAt
        };
      }
      return conv;
    }));
    
    // Update total unread count if not current conversation
    if (message.conversationId !== currentConversationId) {
      setTotalUnreadCount(prev => prev + 1);
    }
  }, [currentConversationId]);

  const handleMessageSent = useCallback((message: Message) => {
    console.log('[FCMChatContext] Message sent:', message);
    
    // Add to current messages if it's for the current conversation
    if (message.conversationId === currentConversationId) {
      setCurrentMessages(prev => {
        // Check if message already exists (by tempId or id)
        const exists = prev.some(m => 
          m.id === message.id || 
          (m.tempId && m.tempId === message.tempId)
        );
        if (exists) {
          // Update existing message
          return prev.map(m => 
            (m.id === message.id || (m.tempId && m.tempId === message.tempId))
              ? message 
              : m
          );
        }
        
        // Add new message and sort by creation time
        const updated = [...prev, message];
        return updated.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      });
    }
    
    // Update conversation last message
    setConversations(prev => prev.map(conv => {
      if (conv.id === message.conversationId) {
        return {
          ...conv,
          lastMessage: message,
          lastActivity: message.createdAt
        };
      }
      return conv;
    }));
  }, [currentConversationId]);

  const handleMessageDelivered = useCallback((messageId: string) => {
    console.log('[FCMChatContext] Message delivered:', messageId);
    
    // Update message status in current messages
    setCurrentMessages(prev => prev.map(message => 
      message.id === messageId 
        ? { ...message, status: 'delivered', deliveryStatus: 'delivered' }
        : message
    ));
  }, []);

  const handleConversationUpdated = useCallback((conversation: Conversation) => {
    console.log('[FCMChatContext] Conversation updated:', conversation);
    
    setConversations(prev => {
      const exists = prev.some(c => c.id === conversation.id);
      if (exists) {
        return prev.map(c => c.id === conversation.id ? conversation : c);
      } else {
        return [...prev, conversation];
      }
    });
  }, []);

  // Utility functions
  const getConversationById = useCallback((conversationId: string): Conversation | undefined => {
    return conversations.find(conv => conv.id === conversationId);
  }, [conversations]);

  const getUnreadCount = useCallback((conversationId: string): number => {
    const conversation = getConversationById(conversationId);
    return conversation?.unreadCount || 0;
  }, [getConversationById]);

  // Initialize when user and token are available
  useEffect(() => {
    if (user?.id && authToken && !isInitialized) {
      initializeChat();
    }
  }, [user?.id, authToken, initializeChat, isInitialized]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isInitialized) {
        fcmChatService.cleanup();
      }
    };
  }, [isInitialized]);

  const contextValue: FCMChatContextType = {
    isInitialized,
    conversations,
    loadingConversations,
    currentConversationId,
    currentMessages,
    loadingMessages,
    totalUnreadCount,
    initializeChat,
    loadConversations,
    loadMessages,
    sendMessage,
    createOrGetConversation,
    setCurrentConversation,
    markAsRead,
    getConversationById,
    getUnreadCount,
    refreshMessages,
  };

  return (
    <FCMChatContext.Provider value={contextValue}>
      {children}
    </FCMChatContext.Provider>
  );
};

export const useFCMChat = (): FCMChatContextType => {
  const context = useContext(FCMChatContext);
  if (context === undefined) {
    throw new Error('useFCMChat must be used within a FCMChatProvider');
  }
  return context;
};

export default FCMChatContext;
