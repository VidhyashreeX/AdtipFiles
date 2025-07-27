/**
 * FCM Chat Context for React Native
 * 
 * This context manages global chat state using FCM high priority notifications
 * for reliable message delivery, replacing Socket.IO with API-based messaging.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FCMChatServiceLocal, Message, Conversation, FCMChatEventHandlers } from '../services/FCMChatServiceLocal';
import { WatermelonLocalChatManager } from '../services/WatermelonLocalChatManager';
import { useAuth } from './AuthContext';
import useChatAvailabilityAlert from '../hooks/useChatAvailabilityAlert';
import ChatUnavailableAlert from '../components/chat/ChatUnavailableAlert';

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

  // Chat availability alert actions (for testing)
  showChatUnavailableAlert: (recipientName: string) => void;

  // WatermelonDB manager access
  watermelonManager: WatermelonLocalChatManager | null;
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

  const fcmChatService = FCMChatServiceLocal.getInstance();

  // WatermelonDB manager for reactive queries
  const [watermelonManager, setWatermelonManager] = useState<WatermelonLocalChatManager | null>(null);

  // Chat availability alert
  const chatAvailabilityAlert = useChatAvailabilityAlert();

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

      // Setup event handlers for legacy FCM service (receive only)
      const legacyEventHandlers: FCMChatEventHandlers = {
        onMessageReceived: handleMessageReceived,
        onMessageSent: () => {}, // Disable to prevent duplicates - WatermelonDB handles this
        onMessageDelivered: handleMessageDelivered,
        onConversationUpdated: handleConversationUpdated,
      };

      // Initialize the legacy service with limited event handlers (FCM disabled to prevent conflicts)
      // Note: FCM message handling is now done by WatermelonLocalChatManager
      await fcmChatService.initialize(user.id.toString(), authToken, legacyEventHandlers, { disableFCMHandlers: true });

      // Initialize WatermelonDB manager for reactive queries (primary message handler)
      // Disable FCM handlers to prevent conflicts with centralized FCMMessageRouter
      const manager = new WatermelonLocalChatManager();
      await manager.initialize(user.id.toString(), user.name || user.username || 'Unknown User', {
        onMessageReceived: handleMessageReceived,
        onMessageSent: handleMessageSent, // Primary message sent handler
        onConversationUpdated: handleConversationUpdated,
        onUnreadCountChanged: (count) => setTotalUnreadCount(count),
        onChatUnavailable: (recipientName: string, error: any) => {
          console.log('[FCMChatContext] 🚫 Chat unavailable event triggered for:', recipientName, error);
          console.log('[FCMChatContext] 🚫 Showing unavailable alert...');
          chatAvailabilityAlert.actions.showUnavailableAlert(recipientName);
          console.log('[FCMChatContext] 🚫 Alert state after trigger:', chatAvailabilityAlert.state);
        },
        onSyncStatusChanged: (status) => {
          console.log('[FCMChatContext] 🔄 Sync status changed:', status);
          // Sync status is handled per-conversation in FCMChatScreen
          // This is just for logging and potential global sync status tracking
        }
      }, { disableFCMHandlers: true });
      setWatermelonManager(manager);

      // Store manager instance globally for FCMMessageRouter access
      (global as any).watermelonChatManager = manager;

      setIsInitialized(true);
      console.log('[FCMChatContext] FCM chat service initialized successfully');

      // Initial conversations will be loaded via reactive subscription

    } catch (error) {
      console.error('[FCMChatContext] Failed to initialize chat service:', error);
    }
  }, [user?.id, isInitialized]);

  // Setup reactive subscriptions for WatermelonDB
  useEffect(() => {
    if (!watermelonManager || !isInitialized) return;

    // Subscribe to conversations
    const conversationsSubscription = watermelonManager.observeConversations().subscribe({
      next: (conversations) => {
        setConversations(conversations);
        const unreadCount = conversations.reduce((total, conv) => total + conv.unreadCount, 0);
        setTotalUnreadCount(unreadCount);
      },
      error: (error) => {
        console.error('[FCMChatContext] Conversations subscription error:', error);
      }
    });

    return () => {
      conversationsSubscription.unsubscribe();
    };
  }, [watermelonManager, isInitialized]);

  // Setup reactive subscription for current conversation messages
  useEffect(() => {
    if (!watermelonManager || !currentConversationId) return;

    const messagesSubscription = watermelonManager.observeMessages(currentConversationId).subscribe({
      next: (messages) => {
        // Debug log to see message statuses from reactive query
        const failedMessages = messages.filter(m => m.status === 'failed');
        if (failedMessages.length > 0) {
          console.log('[FCMChatContext] 🔴 Reactive query found failed messages:', failedMessages.map(m => ({
            id: m.id,
            tempId: m.tempId,
            status: m.status,
            content: m.content.substring(0, 20) + '...'
          })));
        }
        console.log('[FCMChatContext] 📨 Reactive messages update:', {
          total: messages.length,
          failed: failedMessages.length,
          statuses: messages.map(m => ({ id: m.id, status: m.status }))
        });
        setCurrentMessages(messages);
      },
      error: (error) => {
        console.error('[FCMChatContext] Messages subscription error:', error);
      }
    });

    return () => {
      messagesSubscription.unsubscribe();
    };
  }, [watermelonManager, currentConversationId]);

  // Load conversations (now handled by reactive subscription)
  const loadConversations = useCallback(async () => {
    if (!isInitialized || !watermelonManager) return;

    try {
      setLoadingConversations(true);
      // Conversations are automatically loaded via reactive subscription
      // This method is kept for compatibility but does minimal work
      console.log('[FCMChatContext] Conversations loaded via reactive subscription');
    } catch (error) {
      console.error('[FCMChatContext] Failed to load conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  }, [isInitialized, watermelonManager]);

  // Load messages for a conversation (now handled by reactive subscription)
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!isInitialized || !watermelonManager) return;

    try {
      setLoadingMessages(true);

      // Messages are automatically loaded via reactive subscription when currentConversationId changes
      // This method is kept for compatibility but does minimal work
      console.log('[FCMChatContext] Messages loaded via reactive subscription for:', conversationId);

    } catch (error) {
      console.error('[FCMChatContext] Failed to load messages:', error);
      setCurrentMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [isInitialized, watermelonManager]);

  // Send a message
  const sendMessage = useCallback(async (conversationId: string, content: string, replyTo?: string) => {
    if (!isInitialized || !content.trim() || !user?.id || !watermelonManager) return;

    try {
      // Use WatermelonDB manager to send message (handles optimistic UI automatically)
      const message = await watermelonManager.sendMessage(conversationId, content.trim(), replyTo);
      console.log('✅ [FCMChatContext] Message sent successfully via WatermelonDB:', message.id);

      // NOTE: Removed legacy FCM service call to prevent duplicate messages
      // WatermelonDB manager handles both local storage and FCM sending

    } catch (error) {
      console.error('❌ [FCMChatContext] Failed to send message:', error);
      throw error;
    }
  }, [isInitialized, user?.id, watermelonManager]);

  // Create or get conversation - User-based approach
  const createOrGetConversation = useCallback(async (participantId: string): Promise<string> => {
    if (!isInitialized || !watermelonManager || !user) {
      throw new Error('Chat service not initialized');
    }

    try {
      console.log('[FCMChatContext] 🎯 Creating user-based chat between:', user.id, 'and', participantId);

      // Generate user-based chat ID
      const chatId = `chat_${[user.id.toString(), participantId].sort().join('_')}`;
      console.log('[FCMChatContext] 📱 Generated chat ID:', chatId);

      // Use WatermelonDB manager to create/get user chat (it handles the database operations)
      const resultChatId = await watermelonManager.createOrGetConversation(participantId);
      console.log('[FCMChatContext] ✅ User chat ready:', resultChatId);

      // Set conversation state for notification management
      watermelonManager.setCurrentConversation(resultChatId, participantId);
      fcmChatService.setCurrentConversation(resultChatId, participantId);

      return resultChatId;
    } catch (error) {
      console.error('[FCMChatContext] Failed to create/get user chat:', error);
      throw error;
    }
  }, [isInitialized, watermelonManager, fcmChatService, user]);

  // Set current conversation
  const setCurrentConversation = useCallback((conversationId: string | null) => {
    setCurrentConversationId(conversationId);

    // Update WatermelonDB manager
    if (watermelonManager) {
      watermelonManager.setCurrentConversation(conversationId);
    }

    if (!conversationId) {
      setCurrentMessages([]);
      // Clear conversation state in FCMChatService
      fcmChatService.setCurrentConversation(null);
    }
  }, [watermelonManager]);

  // Mark messages as read
  const markAsRead = useCallback(async (conversationId: string, messageId?: string) => {
    if (!isInitialized || !watermelonManager) return;

    try {
      // Use WatermelonDB manager to mark as read (handles reactive updates automatically)
      await watermelonManager.markAsRead(conversationId, messageId);

      // NOTE: Removed legacy service call to prevent duplicate mark as read operations
      // WatermelonDB manager handles all read status updates

    } catch (error) {
      console.error('[FCMChatContext] Failed to mark as read:', error);
    }
  }, [isInitialized, watermelonManager]);

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
          // Update existing message - preserve the actual status from the message
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            ...message,
            // Preserve the actual status (could be 'sent', 'failed', etc.)
            status: message.status,
            deliveryStatus: message.status
          };
          console.log('✅ [FCMChatContext] Updated message with status:', message.status, 'for message:', updated[existingIndex].id);
          return updated.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        }

        // Add new message and sort by creation time - preserve actual status
        const updated = [...prev, { ...message, status: message.status, deliveryStatus: message.status }];
        console.log('✅ [FCMChatContext] Added new message with status:', message.status, 'for message:', message.id);
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
    showChatUnavailableAlert: chatAvailabilityAlert.actions.showUnavailableAlert,
    watermelonManager,
  };

  return (
    <FCMChatContext.Provider value={contextValue}>
      {children}

      {/* Chat Unavailable Alert */}
      <ChatUnavailableAlert
        visible={chatAvailabilityAlert.state.showAlert}
        recipientName={chatAvailabilityAlert.state.recipientName}
        onClose={chatAvailabilityAlert.actions.hideAlert}
        onRetry={chatAvailabilityAlert.actions.retryChat}
      />

      {/* Debug: Log alert state changes */}
      {/* To debug alert state, use a useEffect or log outside JSX */}
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
