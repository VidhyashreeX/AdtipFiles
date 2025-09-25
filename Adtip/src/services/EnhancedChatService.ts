/**
 * Enhanced Chat Service with Comprehensive Error Handling and Real-Time Sync
 * 
 * Provides reliable chat functionality with:
 * - WebSocket connection management with auto-reconnection
 * - Message delivery guarantees with retry mechanisms
 * - Offline message queueing and synchronization
 * - Real-time typing indicators and read receipts
 * - Comprehensive error handling and recovery
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { EventEmitter } from 'events';
import { ErrorHandlingService } from './ErrorHandlingService';
import { ApiService } from './ApiService';
import Logger from '../utils/LogUtils';

interface Message {
  id: string;
  tempId?: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageType: 'text' | 'image' | 'file';
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  isOwn: boolean;
  retryCount?: number;
}

interface ChatState {
  isConnected: boolean;
  isConnecting: boolean;
  messageQueue: Message[];
  activeChats: Set<string>;
  typingUsers: Map<string, Set<string>>;
  unreadCounts: Map<string, number>;
  lastSyncTimestamp: string;
}

interface WebSocketMessage {
  type: 'message' | 'typing' | 'read' | 'ping' | 'pong' | 'error' | 'connection' | 'message_sent' | 'read_confirmed';
  data?: any;
  messageId?: string;
  senderId?: string;
  receiverId?: string;
  tempId?: string;
}

class EnhancedChatService extends EventEmitter {
  private ws: WebSocket | null = null;
  private wsUrl: string;
  private authToken: string | null = null;
  private userId: string | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private pingInterval: NodeJS.Timeout | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;
  
  private state: ChatState = {
    isConnected: false,
    isConnecting: false,
    messageQueue: [],
    activeChats: new Set(),
    typingUsers: new Map(),
    unreadCounts: new Map(),
    lastSyncTimestamp: new Date().toISOString()
  };

  constructor(wsUrl: string = 'ws://localhost:8000/chat') {
    super();
    this.wsUrl = wsUrl;
    this.setMaxListeners(50); // Increase max listeners for multiple chat screens
    
    // Initialize network monitoring
    this.initializeNetworkMonitoring();
  }

  /**
   * Initialize the chat service
   */
  async initialize(userId: string, authToken: string): Promise<void> {
    try {
      this.userId = userId;
      this.authToken = authToken;
      
      // Load persisted state
      await this.loadPersistedState();
      
      // Connect to WebSocket
      await this.connect();
      
      // Sync offline messages
      await this.syncOfflineMessages();
      
      this.isInitialized = true;
      
      Logger.log('[EnhancedChatService] Initialized successfully', {
        userId,
        hasPersistedMessages: this.state.messageQueue.length > 0
      });
      
    } catch (error) {
      await ErrorHandlingService.handleApiError(error, {
        screen: 'ChatService',
        action: 'initialize',
        userId
      });
      throw error;
    }
  }

  /**
   * Connect to WebSocket with authentication
   */
  async connect(): Promise<void> {
    if (this.state.isConnecting || this.state.isConnected) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.state.isConnecting = true;
        
        const wsUrlWithAuth = `${this.wsUrl}?token=${this.authToken}&userId=${this.userId}`;
        this.ws = new WebSocket(wsUrlWithAuth);

        // Set connection timeout
        this.connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            this.ws.close();
            this.handleConnectionFailure(new Error('Connection timeout'));
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);

        this.ws.onopen = () => {
          this.clearConnectionTimeout();
          this.state.isConnected = true;
          this.state.isConnecting = false;
          this.reconnectAttempts = 0;
          
          Logger.log('[EnhancedChatService] WebSocket connected');
          
          // Start ping mechanism
          this.startPingMechanism();
          
          // Process queued messages
          this.processMessageQueue();
          
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleIncomingMessage(event.data);
        };

        this.ws.onclose = (event) => {
          this.clearConnectionTimeout();
          this.handleDisconnection(event);
        };

        this.ws.onerror = (error) => {
          this.clearConnectionTimeout();
          this.handleWebSocketError(error);
          reject(error);
        };

      } catch (error) {
        this.state.isConnecting = false;
        Logger.error('[EnhancedChatService] Connection error:', error);
        reject(error);
      }
    });
  }

  /**
   * Send message with delivery guarantees
   */
  async sendMessage(receiverId: string, content: string, messageType: 'text' | 'image' | 'file' = 'text'): Promise<Message> {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const message: Message = {
      id: tempId,
      tempId,
      senderId: this.userId!,
      receiverId,
      content,
      messageType,
      timestamp: new Date().toISOString(),
      status: 'sending',
      isOwn: true,
      retryCount: 0
    };

    try {
      // Add to queue immediately for UI update
      this.state.messageQueue.push(message);
      await this.persistState();
      
      // Emit for UI update
      this.emit('messageUpdated', message);
      
      // Check network connectivity
      const networkState = await NetInfo.fetch();
      if (!networkState.isConnected) {
        message.status = 'failed';
        await ErrorHandlingService.handleNetworkError(
          new Error('No network connection'),
          () => this.retrySendMessage(message),
          {
            screen: 'ChatService',
            action: 'send_message',
            userId: this.userId
          }
        );
        return message;
      }

      // Try WebSocket first, fallback to API
      if (this.state.isConnected && this.ws) {
        await this.sendViaWebSocket(message);
      } else {
        await this.sendViaAPI(message);
      }

      return message;

    } catch (error) {
      message.status = 'failed';
      await this.updateMessageInQueue(message);
      
      await ErrorHandlingService.handleApiError(error, {
        screen: 'ChatService',
        action: 'send_message',
        userId: this.userId,
        showUserFriendlyMessage: true
      });

      throw error;
    }
  }

  /**
   * Send message via WebSocket
   */
  private async sendViaWebSocket(message: Message): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const wsMessage: WebSocketMessage = {
        type: 'message',
        data: {
          message: message.content,
          receiverId: message.receiverId,
          tempId: message.tempId,
          chat_type: message.messageType,
          chat_type_id_value: 0
        }
      };

      // Set up response handler
      const responseHandler = (response: any) => {
        if (response.tempId === message.tempId) {
          if (response.type === 'message_sent') {
            message.status = 'sent';
            message.id = response.data.id;
            this.updateMessageInQueue(message);
            this.emit('messageUpdated', message);
            resolve();
          } else if (response.type === 'error') {
            message.status = 'failed';
            this.updateMessageInQueue(message);
            reject(new Error(response.message || 'Failed to send message'));
          }
          // Remove handler after processing
          this.removeListener('websocket_response', responseHandler);
        }
      };

      this.on('websocket_response', responseHandler);

      // Send with timeout
      setTimeout(() => {
        this.removeListener('websocket_response', responseHandler);
        if (message.status === 'sending') {
          reject(new Error('Message send timeout'));
        }
      }, 30000);

      this.ws.send(JSON.stringify(wsMessage));
    });
  }

  /**
   * Send message via API as fallback
   */
  private async sendViaAPI(message: Message): Promise<void> {
    try {
      const response = await ApiService.sendChatMessage({
        senderId: message.senderId,
        recipientId: message.receiverId,
        content: message.content,
        messageType: message.messageType
      });

      if (response.status) {
        message.status = 'sent';
        message.id = response.data?.messageId || message.id;
      } else {
        message.status = 'failed';
        throw new Error(response.message || 'Failed to send via API');
      }

      await this.updateMessageInQueue(message);
      this.emit('messageUpdated', message);

    } catch (error) {
      message.status = 'failed';
      await this.updateMessageInQueue(message);
      throw error;
    }
  }

  /**
   * Retry failed message
   */
  private async retrySendMessage(message: Message): Promise<void> {
    if (!message.retryCount) message.retryCount = 0;
    
    if (message.retryCount >= 3) {
      Logger.warn('[EnhancedChatService] Max retry attempts reached for message:', message.tempId);
      return;
    }

    message.retryCount++;
    message.status = 'sending';
    
    await this.updateMessageInQueue(message);
    this.emit('messageUpdated', message);

    try {
      // Check network again
      const networkState = await NetInfo.fetch();
      if (!networkState.isConnected) {
        throw new Error('Still no network connection');
      }

      if (this.state.isConnected && this.ws) {
        await this.sendViaWebSocket(message);
      } else {
        await this.sendViaAPI(message);
      }

    } catch (error) {
      message.status = 'failed';
      await this.updateMessageInQueue(message);
      this.emit('messageUpdated', message);
      
      // Schedule next retry with exponential backoff
      const retryDelay = Math.min(1000 * Math.pow(2, message.retryCount), 30000);
      setTimeout(() => this.retrySendMessage(message), retryDelay);
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleIncomingMessage(data: string): void {
    try {
      const message = JSON.parse(data) as WebSocketMessage;
      
      switch (message.type) {
        case 'message':
          this.handleIncomingChatMessage(message);
          break;
        case 'typing':
          this.handleTypingIndicator(message);
          break;
        case 'read':
          this.handleReadReceipt(message);
          break;
        case 'pong':
          // Ping response - connection is alive
          break;
        case 'error':
          Logger.error('[EnhancedChatService] WebSocket error:', message.data);
          break;
        case 'message_sent':
        case 'read_confirmed':
          this.emit('websocket_response', message);
          break;
        default:
          Logger.warn('[EnhancedChatService] Unknown message type:', message.type);
      }

    } catch (error) {
      Logger.error('[EnhancedChatService] Error parsing WebSocket message:', error);
    }
  }

  /**
   * Handle incoming chat messages
   */
  private handleIncomingChatMessage(wsMessage: WebSocketMessage): void {
    if (!wsMessage.data) return;

    const message: Message = {
      id: wsMessage.data.id,
      senderId: wsMessage.data.sender,
      receiverId: wsMessage.data.receiver,
      content: wsMessage.data.message,
      messageType: 'text',
      timestamp: wsMessage.data.createddate,
      status: 'delivered',
      isOwn: false
    };

    // Add to message queue
    this.state.messageQueue.push(message);
    this.persistState();

    // Update unread count
    const chatId = this.generateChatId(message.senderId, message.receiverId);
    const currentCount = this.state.unreadCounts.get(chatId) || 0;
    this.state.unreadCounts.set(chatId, currentCount + 1);

    // Emit events
    this.emit('messageReceived', message);
    this.emit('unreadCountUpdated', chatId, currentCount + 1);

    // Auto-mark as read if chat is active
    if (this.state.activeChats.has(chatId)) {
      this.markMessageAsRead(message.id, message.senderId);
    }
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string, senderId: string): Promise<void> {
    try {
      // Send read receipt via WebSocket
      if (this.state.isConnected && this.ws) {
        const readMessage: WebSocketMessage = {
          type: 'read',
          messageId,
          senderId
        };
        this.ws.send(JSON.stringify(readMessage));
      }

      // Update local state
      const message = this.state.messageQueue.find(m => m.id === messageId);
      if (message && !message.isOwn) {
        message.status = 'read';
        await this.updateMessageInQueue(message);
        
        // Update unread count
        const chatId = this.generateChatId(senderId, this.userId!);
        const currentCount = this.state.unreadCounts.get(chatId) || 0;
        this.state.unreadCounts.set(chatId, Math.max(0, currentCount - 1));
        
        this.emit('unreadCountUpdated', chatId, this.state.unreadCounts.get(chatId)!);
      }

    } catch (error) {
      Logger.error('[EnhancedChatService] Error marking message as read:', error);
    }
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(receiverId: string, isTyping: boolean): void {
    if (!this.state.isConnected || !this.ws) return;

    const typingMessage: WebSocketMessage = {
      type: 'typing',
      data: {
        receiverId,
        isTyping
      }
    };

    this.ws.send(JSON.stringify(typingMessage));
  }

  /**
   * Handle typing indicators
   */
  private handleTypingIndicator(message: WebSocketMessage): void {
    if (!message.data || !message.data.userId) return;

    const { userId, receiverId, isTyping } = message.data;
    const chatId = this.generateChatId(userId, receiverId);
    
    if (!this.state.typingUsers.has(chatId)) {
      this.state.typingUsers.set(chatId, new Set());
    }

    const typingSet = this.state.typingUsers.get(chatId)!;
    
    if (isTyping) {
      typingSet.add(userId);
    } else {
      typingSet.delete(userId);
    }

    this.emit('typingIndicator', chatId, Array.from(typingSet));
  }

  /**
   * Handle read receipts
   */
  private handleReadReceipt(message: WebSocketMessage): void {
    if (!message.messageId || !message.data?.readBy) return;

    // Update message status in queue
    const messageToUpdate = this.state.messageQueue.find(m => m.id === message.messageId);
    if (messageToUpdate && messageToUpdate.isOwn) {
      messageToUpdate.status = 'read';
      this.updateMessageInQueue(messageToUpdate);
      this.emit('messageUpdated', messageToUpdate);
    }
  }

  /**
   * Get messages for a chat
   */
  getMessages(chatId: string, limit: number = 50): Message[] {
    const [userId1, userId2] = this.parseChatId(chatId);
    
    return this.state.messageQueue
      .filter(message => 
        (message.senderId === userId1 && message.receiverId === userId2) ||
        (message.senderId === userId2 && message.receiverId === userId1)
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-limit);
  }

  /**
   * Set active chat for read receipt management
   */
  setActiveChat(chatId: string): void {
    this.state.activeChats.add(chatId);
    
    // Mark all messages in this chat as read
    const messages = this.getMessages(chatId);
    messages.forEach(message => {
      if (!message.isOwn && message.status !== 'read') {
        this.markMessageAsRead(message.id, message.senderId);
      }
    });
  }

  /**
   * Remove active chat
   */
  removeActiveChat(chatId: string): void {
    this.state.activeChats.delete(chatId);
  }

  /**
   * Get unread count for chat
   */
  getUnreadCount(chatId: string): number {
    return this.state.unreadCounts.get(chatId) || 0;
  }

  /**
   * Sync offline messages
   */
  private async syncOfflineMessages(): Promise<void> {
    try {
      // Get messages from server since last sync
      const response = await ApiService.getChatMessages(this.userId!, {
        since_timestamp: this.state.lastSyncTimestamp,
        limit: 100
      });

      if (response.status && response.data) {
        for (const serverMessage of response.data) {
          const existingMessage = this.state.messageQueue.find(m => 
            m.id === serverMessage.id || m.tempId === serverMessage.tempId
          );

          if (!existingMessage) {
            const message: Message = {
              id: serverMessage.id,
              senderId: serverMessage.senderId,
              receiverId: serverMessage.receiverId,
              content: serverMessage.content,
              messageType: serverMessage.messageType || 'text',
              timestamp: serverMessage.timestamp,
              status: 'delivered',
              isOwn: serverMessage.senderId === this.userId
            };

            this.state.messageQueue.push(message);
            this.emit('messageReceived', message);
          }
        }

        this.state.lastSyncTimestamp = new Date().toISOString();
        await this.persistState();
      }

    } catch (error) {
      Logger.error('[EnhancedChatService] Error syncing offline messages:', error);
    }
  }

  /**
   * Process message queue (send pending messages)
   */
  private async processMessageQueue(): Promise<void> {
    const pendingMessages = this.state.messageQueue.filter(m => 
      m.status === 'sending' || m.status === 'failed'
    );

    for (const message of pendingMessages) {
      if (message.retryCount && message.retryCount >= 3) continue;
      
      try {
        await this.retrySendMessage(message);
      } catch (error) {
        Logger.error('[EnhancedChatService] Error processing queued message:', error);
      }
    }
  }

  /**
   * Network monitoring
   */
  private initializeNetworkMonitoring(): void {
    NetInfo.addEventListener(state => {
      if (state.isConnected && !this.state.isConnected && this.isInitialized) {
        Logger.log('[EnhancedChatService] Network restored, reconnecting...');
        this.reconnect();
      } else if (!state.isConnected && this.state.isConnected) {
        Logger.log('[EnhancedChatService] Network lost');
        this.emit('networkStatusChanged', false);
      }
    });
  }

  /**
   * WebSocket reconnection logic
   */
  private async reconnect(): Promise<void> {
    if (this.state.isConnecting || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    Logger.log(`[EnhancedChatService] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        Logger.error('[EnhancedChatService] Reconnection failed:', error);
        this.reconnect();
      }
    }, delay);
  }

  /**
   * Handle WebSocket disconnection
   */
  private handleDisconnection(event: CloseEvent): void {
    Logger.log('[EnhancedChatService] WebSocket disconnected:', event.code, event.reason);
    
    this.state.isConnected = false;
    this.state.isConnecting = false;
    
    this.clearPingMechanism();
    
    this.emit('disconnected', event);
    
    // Attempt reconnection if not intentional close
    if (event.code !== 1000) {
      this.reconnect();
    }
  }

  /**
   * Handle WebSocket errors
   */
  private handleWebSocketError(error: Event): void {
    Logger.error('[EnhancedChatService] WebSocket error:', error);
    
    this.state.isConnected = false;
    this.state.isConnecting = false;
    
    this.emit('error', error);
  }

  /**
   * Handle connection failure
   */
  private handleConnectionFailure(error: Error): void {
    Logger.error('[EnhancedChatService] Connection failure:', error);
    
    this.state.isConnected = false;
    this.state.isConnecting = false;
    
    ErrorHandlingService.handleNetworkError(
      error,
      () => this.reconnect(),
      {
        screen: 'ChatService',
        action: 'connection',
        userId: this.userId
      }
    );
  }

  /**
   * Ping mechanism for keep-alive
   */
  private startPingMechanism(): void {
    this.clearPingMechanism();
    
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const pingMessage: WebSocketMessage = { type: 'ping' };
        this.ws.send(JSON.stringify(pingMessage));
      }
    }, 25000);
  }

  /**
   * Clear ping mechanism
   */
  private clearPingMechanism(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Clear connection timeout
   */
  private clearConnectionTimeout(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  /**
   * Utility functions
   */
  private generateChatId(userId1: string, userId2: string): string {
    const sortedIds = [userId1, userId2].sort();
    return `chat_${sortedIds[0]}_${sortedIds[1]}`;
  }

  private parseChatId(chatId: string): [string, string] {
    const parts = chatId.split('_');
    return [parts[1], parts[2]];
  }

  private async updateMessageInQueue(message: Message): Promise<void> {
    const index = this.state.messageQueue.findIndex(m => 
      m.id === message.id || (m.tempId && m.tempId === message.tempId)
    );
    
    if (index !== -1) {
      this.state.messageQueue[index] = message;
      await this.persistState();
    }
  }

  /**
   * Persistence
   */
  private async persistState(): Promise<void> {
    try {
      await AsyncStorage.setItem('chat_state', JSON.stringify({
        messageQueue: this.state.messageQueue,
        unreadCounts: Array.from(this.state.unreadCounts.entries()),
        lastSyncTimestamp: this.state.lastSyncTimestamp
      }));
    } catch (error) {
      Logger.error('[EnhancedChatService] Error persisting state:', error);
    }
  }

  private async loadPersistedState(): Promise<void> {
    try {
      const savedState = await AsyncStorage.getItem('chat_state');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        this.state.messageQueue = parsed.messageQueue || [];
        this.state.unreadCounts = new Map(parsed.unreadCounts || []);
        this.state.lastSyncTimestamp = parsed.lastSyncTimestamp || new Date().toISOString();
      }
    } catch (error) {
      Logger.error('[EnhancedChatService] Error loading persisted state:', error);
    }
  }

  /**
   * Cleanup
   */
  async disconnect(): Promise<void> {
    Logger.log('[EnhancedChatService] Disconnecting...');
    
    this.clearPingMechanism();
    this.clearConnectionTimeout();
    
    if (this.ws) {
      this.ws.close(1000, 'Intentional disconnect');
      this.ws = null;
    }
    
    this.state.isConnected = false;
    this.state.isConnecting = false;
    
    await this.persistState();
    
    this.emit('disconnected', { code: 1000, reason: 'Intentional disconnect' });
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): { isConnected: boolean; isConnecting: boolean } {
    return {
      isConnected: this.state.isConnected,
      isConnecting: this.state.isConnecting
    };
  }

  /**
   * Get service statistics
   */
  getStats(): any {
    return {
      totalMessages: this.state.messageQueue.length,
      pendingMessages: this.state.messageQueue.filter(m => m.status === 'sending').length,
      failedMessages: this.state.messageQueue.filter(m => m.status === 'failed').length,
      totalUnread: Array.from(this.state.unreadCounts.values()).reduce((sum, count) => sum + count, 0),
      activeChats: this.state.activeChats.size,
      connectionStatus: this.getConnectionStatus(),
      lastSync: this.state.lastSyncTimestamp
    };
  }
}

// Export singleton instance
export const ChatService = new EnhancedChatService();
export default ChatService;