/**
 * Real-time Message Handler Component
 * 
 * Handles real-time message updates for active chat screens.
 * Ensures incoming messages update UI without notifications when user is viewing the chat.
 */

import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFCMChat } from '../../contexts/FCMChatContext';
import Logger from '../../utils/LogUtils';

interface RealTimeMessageHandlerProps {
  conversationId: string;
  onMessageReceived?: (message: any) => void;
  onMessageSent?: (message: any) => void;
  onAutoScroll?: () => void;
}

export const RealTimeMessageHandler: React.FC<RealTimeMessageHandlerProps> = ({
  conversationId,
  onMessageReceived,
  onMessageSent,
  onAutoScroll
}) => {
  const { currentMessages, setCurrentConversation, markAsRead } = useFCMChat();
  const appState = useRef(AppState.currentState);
  const isActiveRef = useRef(true);
  const lastMessageCountRef = useRef(currentMessages.length);
  const currentUserIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const hasSetConversationRef = useRef(false);

  // Get current user ID and set this conversation as active when component mounts
  useEffect(() => {
    const getCurrentUserId = async () => {
      if (!isMountedRef.current) return;

      try {
        const userId = await AsyncStorage.getItem('userId');
        currentUserIdRef.current = userId;
      } catch (error) {
        console.error('[RealTimeMessageHandler] Error getting user ID:', error);
      }
    };

    getCurrentUserId();

    // Only set the conversation if it hasn't been set yet
    if (!hasSetConversationRef.current && conversationId) {
      Logger.log('[RealTimeMessageHandler] Setting active conversation:', conversationId);
      setCurrentConversation(conversationId);
      hasSetConversationRef.current = true;
    }

    // Mark messages as read when entering the chat
    markAsRead(conversationId);

    return () => {
      // Clear active conversation when component unmounts
      isMountedRef.current = false;
      Logger.log('[RealTimeMessageHandler] Clearing active conversation');
      setCurrentConversation(null);
      hasSetConversationRef.current = false;
    };
  }, [conversationId]); // Remove function dependencies

  // Handle app state changes
  useEffect(() => {
    if (!isMountedRef.current) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (!isMountedRef.current) return;

      Logger.log('[RealTimeMessageHandler] App state changed:', appState.current, '->', nextAppState);

      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App became active - mark messages as read
        isActiveRef.current = true;
        markAsRead(conversationId);
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background
        isActiveRef.current = false;
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription?.remove();
    };
  }, [conversationId]); // Remove markAsRead dependency

  // Handle real-time message updates
  useEffect(() => {
    if (!isMountedRef.current) return;

    const currentMessageCount = currentMessages.length;

    // Check if new messages were added
    if (currentMessageCount > lastMessageCountRef.current) {
      const newMessages = currentMessages.slice(lastMessageCountRef.current);

      Logger.log('[RealTimeMessageHandler] New messages detected:', newMessages.length);

      newMessages.forEach(message => {
        if (!isMountedRef.current) return;

        // Check if it's an incoming message (not from current user)
        const isIncomingMessage = message.senderId !== currentUserIdRef.current;

        if (isIncomingMessage) {
          Logger.log('[RealTimeMessageHandler] Incoming message received:', message.id);
          onMessageReceived?.(message);

          // Auto-scroll to new message
          setTimeout(() => {
            if (isMountedRef.current) {
              onAutoScroll?.();
            }
          }, 100);

          // Mark as read immediately since user is viewing the chat
          if (isActiveRef.current) {
            markAsRead(conversationId);
          }
        } else {
          Logger.log('[RealTimeMessageHandler] Outgoing message sent:', message.id);
          onMessageSent?.(message);

          // Auto-scroll to new message
          setTimeout(() => {
            if (isMountedRef.current) {
              onAutoScroll?.();
            }
          }, 100);
        }
      });
    }

    lastMessageCountRef.current = currentMessageCount;
  }, [currentMessages]); // Remove unnecessary dependencies

  // Component cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // This component doesn't render anything - it's just for handling real-time updates
  return null;
};

/**
 * Hook for real-time message handling
 */
export const useRealTimeMessages = (conversationId: string) => {
  const { currentMessages, setCurrentConversation, markAsRead } = useFCMChat();
  const [isActive, setIsActive] = React.useState(true);
  const isMountedRef = React.useRef(true);
  const hasSetConversationRef = React.useRef(false);

  // Set active conversation
  useEffect(() => {
    if (!hasSetConversationRef.current && conversationId) {
      setCurrentConversation(conversationId);
      markAsRead(conversationId);
      hasSetConversationRef.current = true;
    }

    return () => {
      isMountedRef.current = false;
      setCurrentConversation(null);
      hasSetConversationRef.current = false;
    };
  }, [conversationId]); // Remove function dependencies

  // Handle app state changes
  useEffect(() => {
    if (!isMountedRef.current) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (!isMountedRef.current) return;

      const isAppActive = nextAppState === 'active';
      setIsActive(isAppActive);

      if (isAppActive) {
        // Mark messages as read when app becomes active
        markAsRead(conversationId);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription?.remove();
    };
  }, [conversationId]); // Remove markAsRead dependency

  // Auto-mark messages as read when new messages arrive and chat is active
  useEffect(() => {
    if (!isMountedRef.current) return;

    const getCurrentUserId = async () => {
      if (!isMountedRef.current) return;

      try {
        const userId = await AsyncStorage.getItem('userId');

        if (isActive && currentMessages.length > 0 && userId) {
          const hasUnreadMessages = currentMessages.some(msg =>
            msg.status === 'delivered' && msg.senderId !== userId
          );

          if (hasUnreadMessages) {
            // Debounce the mark as read call
            const timer = setTimeout(() => {
              if (isMountedRef.current) {
                markAsRead(conversationId);
              }
            }, 500);

            return () => clearTimeout(timer);
          }
        }
      } catch (error) {
        console.error('[useRealTimeMessages] Error getting user ID:', error);
      }
    };

    getCurrentUserId();
  }, [currentMessages, isActive, conversationId]); // Remove markAsRead dependency

  return {
    isActive,
    messageCount: currentMessages.length,
    hasNewMessages: currentMessages.some(msg => msg.status === 'delivered')
  };
};

export default RealTimeMessageHandler;
