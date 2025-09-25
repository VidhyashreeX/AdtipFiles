/**
 * Chat Connection Manager Hook
 * 
 * React hook for managing chat connections with enhanced reliability:
 * - Automatic reconnection with exponential backoff
 * - Network-aware connection management
 * - Mess      await ErrorHandlingService.logError(new Error('Chat reconnection failed after max attempts'), {
        screen: 'ChatConnection',
        action: 'retry_connection',
        userId: userCredentialsRef.current?.userId,
        additionalData: { maxAttempts: maxReconnectAttempts, finalAttempt: attemptNumber }
      });eue management with offline support
 * - Real-time connection status updates
 * - Error handling and recovery mechanisms
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ErrorHandlingService from '../services/ErrorHandlingService';
import ChatService from '../services/EnhancedChatService';
import Logger from '../utils/LogUtils';

interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  lastConnectedAt: string | null;
  reconnectAttempt: number;
  error: string | null;
  networkStatus: 'connected' | 'disconnected' | 'unknown';
}

interface ConnectionStats {
  totalMessages: number;
  pendingMessages: number;
  failedMessages: number;
  connectionUptime: number;
  reconnectionCount: number;
  lastSyncTime: string | null;
}

interface UseChatConnectionOptions {
  autoConnect?: boolean;
  enableOfflineQueue?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  enableStats?: boolean;
}

export const useChatConnection = (options: UseChatConnectionOptions = {}) => {
  const {
    autoConnect = true,
    enableOfflineQueue = true,
    maxReconnectAttempts = 5,
    reconnectDelay = 1000,
    enableStats = true
  } = options;

  // State management
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false,
    isReconnecting: false,
    lastConnectedAt: null,
    reconnectAttempt: 0,
    error: null,
    networkStatus: 'unknown'
  });

  const [stats, setStats] = useState<ConnectionStats>({
    totalMessages: 0,
    pendingMessages: 0,
    failedMessages: 0,
    connectionUptime: 0,
    reconnectionCount: 0,
    lastSyncTime: null
  });

  // Refs for stable references
  const appStateRef = useRef(AppState.currentState);
  const connectionTimeRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);
  const userCredentialsRef = useRef<{ userId: string; token: string } | null>(null);

  /**
   * Initialize chat connection
   */
  const initializeConnection = useCallback(async (userId: string, authToken: string) => {
    if (isInitializedRef.current) {
      Logger.warn('[useChatConnection] Already initialized, skipping');
      return;
    }

    try {
      Logger.log('[useChatConnection] Initializing chat connection', { userId });
      
      setConnectionState(prev => ({
        ...prev,
        isConnecting: true,
        error: null
      }));

      // Store credentials for reconnection
      userCredentialsRef.current = { userId, token: authToken };
      
      // Initialize the chat service
      await ChatService.initialize(userId, authToken);
      
      isInitializedRef.current = true;
      
      Logger.log('[useChatConnection] Chat connection initialized successfully');

    } catch (error) {
      Logger.error('[useChatConnection] Failed to initialize connection:', error);
      
      setConnectionState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to initialize connection'
      }));

      await ErrorHandlingService.handleApiError(error, {
        screen: 'ChatConnection',
        action: 'initialize',
        showUserFriendlyMessage: true
      });

      throw error;
    }
  }, []);

  /**
   * Manual connection trigger
   */
  const connect = useCallback(async () => {
    if (!userCredentialsRef.current) {
      throw new Error('User credentials not available. Call initializeConnection first.');
    }

    const { userId, token } = userCredentialsRef.current;
    
    try {
      setConnectionState(prev => ({
        ...prev,
        isConnecting: true,
        error: null
      }));

      if (isInitializedRef.current) {
        // If already initialized, just reconnect
        await ChatService.connect();
      } else {
        // Initialize if not done already
        await initializeConnection(userId, token);
      }

    } catch (error) {
      Logger.error('[useChatConnection] Failed to connect:', error);
      
      setConnectionState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      }));

      throw error;
    }
  }, [initializeConnection]);

  /**
   * Manual disconnection
   */
  const disconnect = useCallback(async () => {
    try {
      Logger.log('[useChatConnection] Disconnecting chat service');
      
      // Clear reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Clear stats interval
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
        statsIntervalRef.current = null;
      }

      await ChatService.disconnect();

      setConnectionState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        isReconnecting: false
      }));

    } catch (error) {
      Logger.error('[useChatConnection] Error during disconnect:', error);
    }
  }, []);

  /**
   * Retry connection with exponential backoff
   */
  const retryConnection = useCallback(async () => {
    if (!userCredentialsRef.current || connectionState.isConnecting) {
      return;
    }

    const attemptNumber = connectionState.reconnectAttempt + 1;
    
    if (attemptNumber > maxReconnectAttempts) {
      Logger.warn('[useChatConnection] Max reconnect attempts reached');
      
      setConnectionState(prev => ({
        ...prev,
        error: 'Maximum reconnection attempts exceeded',
        isReconnecting: false
      }));

      await ErrorHandlingService.logError(new Error('Chat reconnection failed after max attempts'), {
        screen: 'ChatConnection',
        action: 'retry_connection',
        userId: userCredentialsRef.current?.userId,
        additional: { maxAttempts: maxReconnectAttempts, finalAttempt: attemptNumber }
      });

      return;
    }

    const delay = Math.min(reconnectDelay * Math.pow(2, attemptNumber - 1), 30000);
    
    Logger.log(`[useChatConnection] Retrying connection in ${delay}ms (attempt ${attemptNumber}/${maxReconnectAttempts})`);
    
    setConnectionState(prev => ({
      ...prev,
      isReconnecting: true,
      reconnectAttempt: attemptNumber,
      error: null
    }));

    reconnectTimeoutRef.current = setTimeout(async () => {
      try {
        await connect();
      } catch (error) {
        Logger.error('[useChatConnection] Retry connection failed:', error);
        // Will trigger another retry through the effect
      }
    }, delay);

  }, [connect, connectionState.reconnectAttempt, connectionState.isConnecting, maxReconnectAttempts, reconnectDelay]);

  /**
   * Update connection statistics
   */
  const updateStats = useCallback(() => {
    if (enableStats) {
      const serviceStats = ChatService.getStats();
      const currentTime = Date.now();
      const uptime = connectionTimeRef.current ? Math.floor((currentTime - connectionTimeRef.current) / 1000) : 0;

      setStats(prev => ({
        ...prev,
        totalMessages: serviceStats.totalMessages,
        pendingMessages: serviceStats.pendingMessages,
        failedMessages: serviceStats.failedMessages,
        connectionUptime: uptime,
        lastSyncTime: serviceStats.lastSync
      }));
    }
  }, [enableStats]);

  // Set up ChatService event listeners
  useEffect(() => {
    const handleConnected = () => {
      Logger.log('[useChatConnection] Chat service connected');
      
      connectionTimeRef.current = Date.now();
      
      setConnectionState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        isReconnecting: false,
        lastConnectedAt: new Date().toISOString(),
        reconnectAttempt: 0,
        error: null
      }));

      // Start stats updates
      if (enableStats && !statsIntervalRef.current) {
        statsIntervalRef.current = setInterval(updateStats, 5000);
      }
    };

    const handleDisconnected = (event: any) => {
      Logger.log('[useChatConnection] Chat service disconnected', { event });
      
      connectionTimeRef.current = null;
      
      setConnectionState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        isReconnecting: false,
        error: event?.reason || 'Connection lost'
      }));

      // Clear stats interval
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
        statsIntervalRef.current = null;
      }

      // Increment reconnection count
      if (event?.code !== 1000) { // Not intentional disconnect
        setStats(prev => ({
          ...prev,
          reconnectionCount: prev.reconnectionCount + 1
        }));
      }
    };

    const handleError = (error: any) => {
      Logger.error('[useChatConnection] Chat service error:', error);
      
      setConnectionState(prev => ({
        ...prev,
        error: error?.message || 'Connection error'
      }));
    };

    const handleNetworkStatusChanged = (isConnected: boolean) => {
      Logger.log('[useChatConnection] Network status changed:', isConnected);
      
      setConnectionState(prev => ({
        ...prev,
        networkStatus: isConnected ? 'connected' : 'disconnected'
      }));
    };

    // Subscribe to events
    ChatService.on('connected', handleConnected);
    ChatService.on('disconnected', handleDisconnected);
    ChatService.on('error', handleError);
    ChatService.on('networkStatusChanged', handleNetworkStatusChanged);

    return () => {
      // Unsubscribe from events
      ChatService.off('connected', handleConnected);
      ChatService.off('disconnected', handleDisconnected);
      ChatService.off('error', handleError);
      ChatService.off('networkStatusChanged', handleNetworkStatusChanged);
    };
  }, [enableStats, updateStats]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      Logger.log('[useChatConnection] App state changed:', appStateRef.current, '->', nextAppState);

      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App became active - attempt reconnection if needed
        if (!connectionState.isConnected && !connectionState.isConnecting && userCredentialsRef.current) {
          Logger.log('[useChatConnection] App became active, attempting reconnection');
          connect().catch(error => {
            Logger.error('[useChatConnection] Auto-reconnect on app active failed:', error);
          });
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background - maintain connection but reduce activity
        Logger.log('[useChatConnection] App went to background');
      }

      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [connectionState.isConnected, connectionState.isConnecting, connect]);

  // Handle network changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasConnected = connectionState.networkStatus === 'connected';
      const isNowConnected = !!state.isConnected;
      
      setConnectionState(prev => ({
        ...prev,
        networkStatus: isNowConnected ? 'connected' : 'disconnected'
      }));

      // If network was restored and chat is not connected, attempt reconnection
      if (!wasConnected && isNowConnected && !connectionState.isConnected && userCredentialsRef.current) {
        Logger.log('[useChatConnection] Network restored, attempting reconnection');
        connect().catch(error => {
          Logger.error('[useChatConnection] Auto-reconnect on network restore failed:', error);
        });
      }
    });

    return unsubscribe;
  }, [connectionState.networkStatus, connectionState.isConnected, connect]);

  // Auto-retry failed connections
  useEffect(() => {
    if (!connectionState.isConnected && 
        !connectionState.isConnecting && 
        !connectionState.isReconnecting &&
        connectionState.error &&
        connectionState.networkStatus === 'connected' &&
        userCredentialsRef.current &&
        connectionState.reconnectAttempt < maxReconnectAttempts) {
      
      Logger.log('[useChatConnection] Auto-retrying failed connection');
      retryConnection();
    }
  }, [
    connectionState.isConnected,
    connectionState.isConnecting,
    connectionState.isReconnecting,
    connectionState.error,
    connectionState.networkStatus,
    connectionState.reconnectAttempt,
    maxReconnectAttempts,
    retryConnection
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    };
  }, []);

  // Exposed methods and state
  return {
    // Connection state
    connectionState,
    
    // Statistics
    stats,
    
    // Connection methods
    initialize: initializeConnection,
    connect,
    disconnect,
    retry: retryConnection,
    
    // Utility methods
    isOnline: connectionState.isConnected,
    hasError: !!connectionState.error,
    canRetry: connectionState.reconnectAttempt < maxReconnectAttempts && 
              connectionState.networkStatus === 'connected',
    
    // Service access
    chatService: ChatService,
    
    // Debug info
    debugInfo: {
      isInitialized: isInitializedRef.current,
      hasCredentials: !!userCredentialsRef.current,
      connectionUptime: stats.connectionUptime,
      reconnectionCount: stats.reconnectionCount
    }
  };
};

export default useChatConnection;