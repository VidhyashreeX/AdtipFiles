// src/services/SocketService.ts - WebSocket service for real-time features
import io, { Socket } from 'socket.io-client';
import { Logger } from '../utils/ProductionLogger';
import ApiService from './ApiService';

export interface StreamSocketEvents {
  viewer_joined: (data: { userId: number; userName: string; viewerCount: number }) => void;
  viewer_left: (data: { userId: number; userName: string; viewerCount: number }) => void;
  new_tip: (data: { 
    tipId: string;
    userId: number;
    userName: string;
    amount: number;
    message?: string;
    totalEarnings: number;
  }) => void;
  stream_chat: (data: {
    messageId: string;
    userId: number;
    userName: string;
    message: string;
    timestamp: string;
  }) => void;
  stream_ended: (data: {
    reason?: string;
    totalEarnings: number;
    totalViewers: number;
    duration: number;
  }) => void;
  stream_error: (data: {
    error: string;
    code?: string;
  }) => void;
}

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private currentStreamRoom: string | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private eventListeners: Map<string, Set<Function>> = new Map();

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  /**
   * Connect to socket server
   * @param token Authentication token
   * @param userId User ID for identification
   */
  async connect(token: string, userId: number): Promise<boolean> {
    if (this.isConnected && this.socket) {
      Logger.info('SocketService', 'Already connected to socket server');
      return true;
    }

    try {
      Logger.info('SocketService', 'Connecting to socket server...');

      // Get base URL from ApiService
      const baseUrl = ApiService.getBaseUrl().replace('/api', '');
      
      // Initialize socket connection with auth
      this.socket = io(baseUrl, {
        auth: {
          token,
          userId
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      // Setup event handlers
      this.setupEventHandlers();

      // Wait for connection
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          Logger.error('SocketService', 'Connection timeout');
          resolve(false);
        }, 10000);

        this.socket!.once('connect', () => {
          clearTimeout(timeout);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          Logger.info('SocketService', 'Connected to socket server successfully');
          resolve(true);
        });

        this.socket!.once('connect_error', (error) => {
          clearTimeout(timeout);
          Logger.error('SocketService', 'Connection error:', error);
          resolve(false);
        });
      });

    } catch (error) {
      Logger.error('SocketService', 'Failed to connect to socket server:', error);
      return false;
    }
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      Logger.info('SocketService', 'Socket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Rejoin stream room if was in one
      if (this.currentStreamRoom) {
        this.joinStreamRoom(this.currentStreamRoom);
      }
    });

    this.socket.on('disconnect', (reason) => {
      Logger.warn('SocketService', 'Socket disconnected:', reason);
      this.isConnected = false;

      // Handle reconnection based on reason
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.reconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      Logger.error('SocketService', 'Socket connection error:', error.message);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        Logger.error('SocketService', 'Max reconnection attempts reached');
        this.disconnect();
      }
    });

    // Stream events
    this.socket.on('viewer_joined', (data) => {
      Logger.info('SocketService', 'Viewer joined:', data);
      this.emitToListeners('viewer_joined', data);
    });

    this.socket.on('viewer_left', (data) => {
      Logger.info('SocketService', 'Viewer left:', data);
      this.emitToListeners('viewer_left', data);
    });

    this.socket.on('new_tip', (data) => {
      Logger.info('SocketService', 'New tip received:', data);
      this.emitToListeners('new_tip', data);
    });

    this.socket.on('stream_chat', (data) => {
      Logger.debug('SocketService', 'Stream chat message:', data);
      this.emitToListeners('stream_chat', data);
    });

    this.socket.on('stream_ended', (data) => {
      Logger.info('SocketService', 'Stream ended:', data);
      this.emitToListeners('stream_ended', data);
      
      // Leave the room when stream ends
      if (this.currentStreamRoom) {
        this.leaveStreamRoom(this.currentStreamRoom);
      }
    });

    this.socket.on('stream_error', (data) => {
      Logger.error('SocketService', 'Stream error:', data);
      this.emitToListeners('stream_error', data);
    });

    // Custom events
    this.socket.on('stream_update', (data) => {
      Logger.debug('SocketService', 'Stream update:', data);
      this.emitToListeners('stream_update', data);
    });
  }

  /**
   * Join a stream room for real-time updates
   * @param streamId The stream ID to join
   */
  joinStreamRoom(streamId: string): void {
    if (!this.socket || !this.isConnected) {
      Logger.warn('SocketService', 'Cannot join room - not connected');
      return;
    }

    Logger.info('SocketService', 'Joining stream room:', streamId);
    
    // Leave previous room if in one
    if (this.currentStreamRoom && this.currentStreamRoom !== streamId) {
      this.leaveStreamRoom(this.currentStreamRoom);
    }

    this.socket.emit('join_stream', { streamId }, (response: any) => {
      if (response?.success) {
        this.currentStreamRoom = streamId;
        Logger.info('SocketService', 'Joined stream room successfully:', streamId);
      } else {
        Logger.error('SocketService', 'Failed to join stream room:', response?.error);
      }
    });
  }

  /**
   * Leave a stream room
   * @param streamId The stream ID to leave
   */
  leaveStreamRoom(streamId: string): void {
    if (!this.socket || !this.isConnected) {
      Logger.warn('SocketService', 'Cannot leave room - not connected');
      return;
    }

    Logger.info('SocketService', 'Leaving stream room:', streamId);
    
    this.socket.emit('leave_stream', { streamId }, (response: any) => {
      if (response?.success) {
        if (this.currentStreamRoom === streamId) {
          this.currentStreamRoom = null;
        }
        Logger.info('SocketService', 'Left stream room successfully:', streamId);
      } else {
        Logger.error('SocketService', 'Failed to leave stream room:', response?.error);
      }
    });
  }

  /**
   * Send a chat message in the stream
   * @param streamId Stream ID
   * @param message Chat message
   */
  sendStreamChat(streamId: string, message: string): void {
    if (!this.socket || !this.isConnected) {
      Logger.warn('SocketService', 'Cannot send chat - not connected');
      return;
    }

    this.socket.emit('stream_chat', {
      streamId,
      message
    }, (response: any) => {
      if (response?.success) {
        Logger.debug('SocketService', 'Chat message sent successfully');
      } else {
        Logger.error('SocketService', 'Failed to send chat message:', response?.error);
      }
    });
  }

  /**
   * Notify server about a tip (for real-time updates)
   * @param streamId Stream ID
   * @param tipData Tip information
   */
  notifyTip(streamId: string, tipData: {
    tipId: string;
    amount: number;
    message?: string;
    userId: number;
    userName: string;
  }): void {
    if (!this.socket || !this.isConnected) {
      Logger.warn('SocketService', 'Cannot notify tip - not connected');
      return;
    }

    this.socket.emit('stream_tip', {
      streamId,
      ...tipData
    }, (response: any) => {
      if (response?.success) {
        Logger.debug('SocketService', 'Tip notification sent successfully');
      } else {
        Logger.error('SocketService', 'Failed to send tip notification:', response?.error);
      }
    });
  }

  /**
   * Update stream viewer count (for hosts)
   * @param streamId Stream ID
   * @param viewerCount Current viewer count
   */
  updateViewerCount(streamId: string, viewerCount: number): void {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('update_viewer_count', {
      streamId,
      viewerCount
    });
  }

  /**
   * Add event listener for socket events
   * @param event Event name
   * @param callback Callback function
   */
  addEventListener<K extends keyof StreamSocketEvents>(
    event: K,
    callback: StreamSocketEvents[K]
  ): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    const listeners = this.eventListeners.get(event)!;
    listeners.add(callback as Function);

    // Return cleanup function
    return () => {
      listeners.delete(callback as Function);
      if (listeners.size === 0) {
        this.eventListeners.delete(event);
      }
    };
  }

  /**
   * Remove event listener
   * @param event Event name
   * @param callback Callback function
   */
  removeEventListener<K extends keyof StreamSocketEvents>(
    event: K,
    callback: StreamSocketEvents[K]
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback as Function);
      if (listeners.size === 0) {
        this.eventListeners.delete(event);
      }
    }
  }

  /**
   * Emit event to all registered listeners
   * @param event Event name
   * @param data Event data
   */
  private emitToListeners(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          Logger.error('SocketService', `Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Reconnect to socket server
   */
  private async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      Logger.error('SocketService', 'Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      5000
    );

    Logger.info('SocketService', `Reconnecting in ${delay}ms...`);

    setTimeout(() => {
      if (this.socket && !this.isConnected) {
        this.socket.connect();
      }
    }, delay);
  }

  /**
   * Disconnect from socket server
   */
  disconnect(): void {
    if (this.socket) {
      Logger.info('SocketService', 'Disconnecting from socket server...');
      
      // Leave current room if in one
      if (this.currentStreamRoom) {
        this.leaveStreamRoom(this.currentStreamRoom);
      }

      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentStreamRoom = null;
      this.eventListeners.clear();
      
      Logger.info('SocketService', 'Disconnected from socket server');
    }
  }

  /**
   * Get connection status
   */
  isSocketConnected(): boolean {
    return this.isConnected && this.socket !== null;
  }

  /**
   * Get current stream room
   */
  getCurrentStreamRoom(): string | null {
    return this.currentStreamRoom;
  }
}

export default SocketService;