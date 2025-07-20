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
  const { user } = useAuth();
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
  }, [user?.id, isInitialized]);

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

  // Load messages for a conversation - Local database first approach
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!isInitialized) return;

    try {
      setLoadingMessages(true);

      // Load from local storage for immediate display (primary source)
      const localMessages = await fcmChatService.getMessagesFromLocal(conversationId);
      console.log('[FCMChatContext] Loaded local messages:', localMessages.length);
      setCurrentMessages(localMessages);

      // Fetch from server in background for sync (don't overwrite local)
      try {
        const result = await fcmChatService.getMessages(conversationId);
        const serverMessages = result.messages || [];

        console.log('[FCMChatContext] Fetched server messages:', serverMessages.length);

        // Smart merge: only add new messages from server that don't exist locally
        const mergedMessages = await mergeMessagesIntelligently(localMessages, serverMessages, conversationId);

        // Only update if we have new messages
        if (mergedMessages.length > localMessages.length) {
          console.log('[FCMChatContext] Merged messages, updating display:', mergedMessages.length);
          setCurrentMessages(mergedMessages);
        }

      } catch (serverError) {
        console.warn('[FCMChatContext] Server fetch failed, using local messages only:', serverError);
        // Continue with local messages - don't fail the entire operation
      }

    } catch (error) {
      console.error('[FCMChatContext] Failed to load messages:', error);
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

    // Create optimistic message
    const optimisticMessage: Message = {
      id: `temp_${Date.now()}`,
      conversationId,
      senderId: user.id.toString(),
      senderName: user.name || 'You',
      senderAvatar: user.profile_image || undefined,
      content: content.trim(),
      messageType: 'text',
      createdAt: new Date().toISOString(),
      tempId: `temp_${Date.now()}`,
      status: 'sending',
      deliveryStatus: 'pending',
      replyTo
    };

    // Add optimistic message immediately to current conversation if it matches
    if (currentConversationId === conversationId) {
      setCurrentMessages(prev => [...prev, optimisticMessage]);
      console.log('🚀 [FCMChatContext] Added optimistic message to current conversation:', optimisticMessage);
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
        const existingIndex = prev.findIndex(m =>
          m.id === message.id ||
          (m.tempId && m.tempId === message.tempId) ||
          (message.tempId && m.tempId === message.tempId)
        );

        if (existingIndex !== -1) {
          // Update existing message with server response
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            ...message,
            status: 'sent',
            deliveryStatus: 'sent'
          };
          return updated.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        }

        // Add new message and sort by creation time
        const updated = [...prev, { ...message, status: 'sent', deliveryStatus: 'sent' }];
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
