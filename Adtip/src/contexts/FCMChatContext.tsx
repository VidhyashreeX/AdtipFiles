/**
 * FCM Chat Context for React Native
 * 
 * This context manages global chat state using FCM high priority notifications
 * for reliable message delivery, replacing Socket.IO with API-based messaging.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FCMChatServiceLocal, Message, Conversation, FCMChatEventHandlers } from '../services/FCMChatServiceLocal';
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
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [currentParticipantId, setCurrentParticipantId] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  const fcmChatService = FCMChatServiceLocal.getInstance();

  // Initialize chat service
  const initializeChat = useCallback(async () => {
    if (!user?.id || isInitialized) {
      return;
    }

    try {
      console.log('[FCMChatContext] Initializing FCM chat service...');

      // Get auth token from AsyncStorage
      const authToken = await AsyncStorage.getItem('accessToken');
      if (!authToken) {
        console.error('[FCMChatContext] No auth token available');
        return;
      }

      // Setup event handlers
      const eventHandlers: FCMChatEventHandlers = {
        onMessageReceived: handleMessageReceived,
        onMessageSent: handleMessageSent,
        onMessageDelivered: handleMessageDelivered,
        onConversationUpdated: handleConversationUpdated,
      };

      // Initialize the service with event handlers
      await fcmChatService.initialize(user.id.toString(), authToken, eventHandlers);

      setIsInitialized(true);
      console.log('[FCMChatContext] FCM chat service initialized successfully');

      // Load initial conversations
      await loadConversations();

    } catch (error) {
      console.error('[FCMChatContext] Failed to initialize chat service:', error);
    }
  }, [user?.id, isInitialized]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!isInitialized) return;

    try {
      setLoadingConversations(true);
      const conversations = await fcmChatService.getConversations();
      setConversations(conversations);

      // Calculate total unread count
      const unreadCount = conversations.reduce((total, conv) => total + conv.unreadCount, 0);
      setTotalUnreadCount(unreadCount);

    } catch (error) {
      console.error('[FCMChatContext] Failed to load conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  }, [isInitialized]);

  // Load messages for a conversation - Local storage only approach
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!isInitialized) return;

    try {
      setLoadingMessages(true);

      // Load from local storage only (no API calls)
      const localMessages = await fcmChatService.getMessages(conversationId);
      console.log('[FCMChatContext] Loaded local messages:', localMessages.length);

      // Set local messages immediately
      setCurrentMessages(localMessages);

    } catch (error) {
      console.error('[FCMChatContext] Failed to load messages:', error);
      // Set empty array on error to show proper empty state
      setCurrentMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [isInitialized]);

  // Intelligent message merging - preserves local data integrity
  const mergeMessagesIntelligently = useCallback(async (
    localMessages: Message[],
    serverMessages: Message[],
    conversationId: string
  ): Promise<Message[]> => {
    try {
      // Create a map of local messages by ID and tempId for quick lookup
      const localMessageMap = new Map<string, Message>();
      const localTempIdMap = new Map<string, Message>();

      localMessages.forEach(msg => {
        if (msg.id) localMessageMap.set(msg.id.toString(), msg);
        if (msg.tempId) localTempIdMap.set(msg.tempId, msg);
      });

      // Start with local messages as base (they are authoritative)
      const mergedMessages = [...localMessages];

      // Add new messages from server that don't exist locally
      for (const serverMsg of serverMessages) {
        const existsLocally = localMessageMap.has(serverMsg.id?.toString() || '') ||
                             (serverMsg.tempId && localTempIdMap.has(serverMsg.tempId));

        if (!existsLocally) {
          console.log('[FCMChatContext] Adding new server message:', serverMsg.id);
          mergedMessages.push(serverMsg);

          // Save new message to local storage
          await fcmChatService.saveMessageToLocal(serverMsg);
        }
      }

      // Sort by timestamp to maintain chronological order
      mergedMessages.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
        const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
        return timeA - timeB;
      });

      return mergedMessages;

    } catch (error) {
      console.error('[FCMChatContext] Error merging messages:', error);
      // Return local messages on error to maintain stability
      return localMessages;
    }
  }, []);

  // Send a message
  const sendMessage = useCallback(async (conversationId: string, content: string, replyTo?: string) => {
    if (!isInitialized || !content.trim() || !user?.id) return;

    // Get proper sender name - prioritize name, fallback to username, then mobile number
    const getSenderName = () => {
      if (user.name && user.name.trim()) return user.name.trim();
      if (user.username && user.username.trim()) return user.username.trim();
      if (user.mobile_number) return user.mobile_number;
      return `User ${user.id}`;
    };

    // Create optimistic message with unique temp ID
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const optimisticMessage: Message = {
      id: tempId,
      conversationId,
      senderId: user.id.toString(),
      senderName: getSenderName(),
      senderAvatar: user.profile_image || undefined,
      content: content.trim(),
      messageType: 'text',
      createdAt: new Date().toISOString(),
      tempId: tempId,
      status: 'sending',
      deliveryStatus: 'pending',
      replyTo
    };

    // Add optimistic message immediately to current conversation if it matches
    if (currentConversationId === conversationId) {
      setCurrentMessages(prev => [...prev, optimisticMessage]);
      console.log('🚀 [FCMChatContext] Added optimistic message with status "sending":', optimisticMessage.tempId);
    }

    try {
      await fcmChatService.sendMessage(conversationId, content.trim(), replyTo);
      console.log('✅ [FCMChatContext] Message sent successfully via API');
    } catch (error) {
      console.error('❌ [FCMChatContext] Failed to send message:', error);

      // Remove the optimistic message on failure
      if (currentConversationId === conversationId) {
        setCurrentMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        console.log('🗑️ [FCMChatContext] Removed failed optimistic message');
      }

      throw error;
    }
  }, [isInitialized, user?.id, currentConversationId]);

  // Update message status
  const updateMessageStatus = useCallback((messageId: string, status: 'sending' | 'sent' | 'delivered' | 'read') => {
    setCurrentMessages(prev => prev.map(message =>
      message.id === messageId || message.tempId === messageId
        ? { ...message, status, deliveryStatus: status }
        : message
    ));
  }, []);

  // Remove failed message
  const removeFailedMessage = useCallback((tempId: string) => {
    setCurrentMessages(prev => prev.filter(message => message.tempId !== tempId));
  }, []);

  // Create or get conversation - Local storage only approach
  const createOrGetConversation = useCallback(async (participantId: string): Promise<string> => {
    if (!isInitialized) {
      throw new Error('Chat service not initialized');
    }

    try {
      // Use FCMChatServiceLocal to create/get conversation
      const conversationId = await fcmChatService.createOrGetConversation(participantId);

      console.log('[FCMChatContext] Using local conversation ID:', conversationId);

      // Set current participant for conversation state tracking
      setCurrentParticipantId(participantId);

      // Set conversation state in FCMChatService for notification management
      fcmChatService.setCurrentConversation(conversationId, participantId);

      return conversationId;
    } catch (error) {
      console.error('[FCMChatContext] Failed to create/get conversation:', error);
      throw error;
    }
  }, [isInitialized]);

  // Set current conversation
  const setCurrentConversation = useCallback((conversationId: string | null) => {
    setCurrentConversationId(conversationId);
    if (!conversationId) {
      setCurrentMessages([]);
      setCurrentParticipantId(null);
      // Clear conversation state in FCMChatService
      fcmChatService.setCurrentConversation(null);
    }
  }, []); // Remove fcmChatService dependency since it's a singleton

  // Mark messages as read
  const markAsRead = useCallback(async (conversationId: string, messageId?: string) => {
    if (!isInitialized) return;

    try {
      await fcmChatService.markMessagesAsRead(conversationId);

      // Update local conversation unread count
      setConversations(prev => prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, unreadCount: 0 }
          : conv
      ));

      // Recalculate total unread count using functional update to avoid dependency
      setTotalUnreadCount(prev => {
        // Get current conversations from state to avoid dependency
        return Math.max(0, prev - 1); // Simple decrement, will be corrected by loadConversations
      });

    } catch (error) {
      console.error('[FCMChatContext] Failed to mark as read:', error);
    }
  }, [isInitialized]); // Remove conversations dependency

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
        const existingIndex = prev.findIndex(m =>
          m.id === message.id ||
          (m.tempId && m.tempId === message.tempId) ||
          (message.tempId && m.tempId === message.tempId)
        );

        if (existingIndex !== -1) {
          // Update existing message with server response - ensure status is 'sent'
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            ...message,
            status: 'sent',
            deliveryStatus: 'sent'
          };
          console.log('✅ [FCMChatContext] Updated message status to sent:', updated[existingIndex].id);
          return updated.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        }

        // Add new message and sort by creation time
        const updated = [...prev, { ...message, status: 'sent', deliveryStatus: 'sent' }];
        console.log('✅ [FCMChatContext] Added new sent message:', message.id);
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
    const checkAndInitialize = async () => {
      const token = await AsyncStorage.getItem('accessToken');

      console.log('[FCMChatContext] Initialization check:', {
        userId: user?.id,
        hasToken: !!token,
        isInitialized
      });

      if (user?.id && token && !isInitialized) {
        console.log('[FCMChatContext] Starting FCM chat initialization...');
        initializeChat();
      } else if (!user?.id) {
        console.log('[FCMChatContext] No user ID available for FCM chat initialization');
      } else if (!token) {
        console.log('[FCMChatContext] No auth token available for FCM chat initialization');
      }
    };

    checkAndInitialize();
  }, [user?.id, isInitialized, initializeChat]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isInitialized) {
        // Clear current conversation on unmount
        fcmChatService.setCurrentConversation(null);
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
