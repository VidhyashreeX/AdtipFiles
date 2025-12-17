// WebSocket Service for Real-time Live Stream Communication
import { useLiveStreamStore } from '../stores/livestream.store';
import { toast } from 'sonner';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  meetingId?: string;
}

interface StreamEvent {
  type: 'viewer_joined' | 'viewer_left' | 'chat_message' | 'tip_sent' | 'stream_ended' | 'viewer_count_update' | 'balance_update';
  data: any;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private currentMeetingId: string | null = null;
  private userId: number | null = null;

  // WebSocket URL - adjust based on your backend
  private getWebSocketUrl(): string {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:7082';
    const wsUrl = baseUrl.replace(/^http/, 'ws');
    return `${wsUrl}/ws/livestream`;
  }

  // Connect to WebSocket
  connect(meetingId: string, userId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting) {
        resolve(false);
        return;
      }

      this.isConnecting = true;
      this.currentMeetingId = meetingId;
      this.userId = userId;

      try {
        const wsUrl = `${this.getWebSocketUrl()}?meetingId=${meetingId}&userId=${userId}`;
        console.log('[WebSocket] Connecting to:', wsUrl);

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected successfully');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          
          // Update store connection status
          useLiveStreamStore.getState().setConnected(true);
          useLiveStreamStore.getState().resetReconnectAttempts();
          
          // Start heartbeat
          this.startHeartbeat();
          
          // Send join message
          this.sendMessage({
            type: 'join_stream',
            data: { meetingId, userId },
            timestamp: Date.now(),
          });

          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('[WebSocket] Connection closed:', event.code, event.reason);
          this.isConnecting = false;
          this.cleanup();
          
          // Update store connection status
          useLiveStreamStore.getState().setConnected(false);
          
          // Attempt to reconnect if not a normal closure
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Connection error:', error);
          this.isConnecting = false;
          
          // Update store connection status
          useLiveStreamStore.getState().setConnected(false);
          
          reject(error);
        };

        // Timeout for connection
        setTimeout(() => {
          if (this.isConnecting) {
            this.isConnecting = false;
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000); // 10 second timeout

      } catch (error) {
        this.isConnecting = false;
        console.error('[WebSocket] Failed to create connection:', error);
        reject(error);
      }
    });
  }

  // Disconnect from WebSocket
  disconnect(): void {
    console.log('[WebSocket] Disconnecting...');
    
    if (this.ws) {
      // Send leave message before closing
      if (this.currentMeetingId && this.userId) {
        this.sendMessage({
          type: 'leave_stream',
          data: { meetingId: this.currentMeetingId, userId: this.userId },
          timestamp: Date.now(),
        });
      }
      
      this.ws.close(1000, 'Normal closure');
    }
    
    this.cleanup();
  }

  // Send message through WebSocket
  sendMessage(message: WebSocketMessage): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('[WebSocket] Failed to send message:', error);
        return false;
      }
    }
    
    console.warn('[WebSocket] Cannot send message - connection not open');
    return false;
  }

  // Handle incoming WebSocket messages
  private handleMessage(message: WebSocketMessage): void {
    console.log('[WebSocket] Received message:', message);
    
    const store = useLiveStreamStore.getState();
    
    switch (message.type) {
      case 'viewer_joined':
        store.addParticipant({
          id: message.data.userId,
          name: message.data.userName || 'Anonymous',
          avatar: message.data.userAvatar,
          joinedAt: Date.now(),
          isHost: false,
          isActive: true,
        });
        break;

      case 'viewer_left':
        store.removeParticipant(message.data.userId);
        break;

      case 'chat_message':
        store.addChatMessage({
          id: `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: message.data.userId,
          userName: message.data.userName,
          userAvatar: message.data.userAvatar,
          message: message.data.message,
          timestamp: message.data.timestamp || Date.now(),
          type: 'message',
        });
        break;

      case 'tip_sent':
        store.addChatMessage({
          id: `tip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: message.data.fromUserId,
          userName: message.data.fromUserName,
          userAvatar: message.data.fromUserAvatar,
          message: message.data.message || `Sent a tip of ₹${message.data.amount}`,
          timestamp: message.data.timestamp || Date.now(),
          type: 'tip',
          tipAmount: message.data.amount,
        });
        
        // Update earnings for host or cost for viewer
        if (message.data.toUserId === store.currentStream.hostId) {
          store.updateEarnings(message.data.amount);
        }
        break;

      case 'viewer_count_update':
        store.updateViewerCount(message.data.count);
        break;

      case 'stream_ended':
        store.addChatMessage({
          id: `system_${Date.now()}`,
          userId: 0,
          userName: 'System',
          message: 'Stream has ended',
          timestamp: Date.now(),
          type: 'system',
        });
        
        // Update stream status
        useLiveStreamStore.setState((state) => ({
          currentStream: {
            ...state.currentStream,
            isActive: false,
            endTime: Date.now(),
          },
        }));
        
        toast.info('Stream has ended');
        break;

      case 'balance_update':
        // Handle wallet balance updates during stream
        if (message.data.userId === this.userId) {
          // Update wallet balance in wallet store if available
          // This would integrate with the wallet-premium store
          toast.info(`Wallet balance updated: ₹${message.data.newBalance}`);
        }
        break;

      case 'heartbeat_response':
        store.updateHeartbeat();
        break;

      case 'error':
        console.error('[WebSocket] Server error:', message.data);
        toast.error(message.data.message || 'Stream error occurred');
        break;

      default:
        console.log('[WebSocket] Unknown message type:', message.type);
    }
  }

  // Send chat message
  sendChatMessage(message: string, userId: number, userName: string): boolean {
    return this.sendMessage({
      type: 'chat_message',
      data: {
        meetingId: this.currentMeetingId,
        userId,
        userName,
        message,
      },
      timestamp: Date.now(),
    });
  }

  // Send tip
  sendTip(amount: number, message: string, fromUserId: number, fromUserName: string, toUserId: number): boolean {
    return this.sendMessage({
      type: 'send_tip',
      data: {
        meetingId: this.currentMeetingId,
        fromUserId,
        fromUserName,
        toUserId,
        amount,
        message,
      },
      timestamp: Date.now(),
    });
  }

  // Update viewer count (for hosts)
  updateViewerCount(count: number): boolean {
    return this.sendMessage({
      type: 'update_viewer_count',
      data: {
        meetingId: this.currentMeetingId,
        count,
      },
      timestamp: Date.now(),
    });
  }

  // Start heartbeat to keep connection alive
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendMessage({
          type: 'heartbeat',
          data: { timestamp: Date.now() },
          timestamp: Date.now(),
        });
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  // Schedule reconnection attempt
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached');
      toast.error('Lost connection to stream. Please refresh the page.');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts); // Exponential backoff
    this.reconnectAttempts++;
    
    useLiveStreamStore.getState().incrementReconnectAttempts();
    
    console.log(`[WebSocket] Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.currentMeetingId && this.userId) {
        console.log(`[WebSocket] Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        this.connect(this.currentMeetingId, this.userId).catch((error) => {
          console.error('[WebSocket] Reconnection failed:', error);
        });
      }
    }, delay);
  }

  // Cleanup resources
  private cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    this.ws = null;
    useLiveStreamStore.getState().setConnected(false);
  }

  // Get connection status
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  // Get current meeting ID
  getCurrentMeetingId(): string | null {
    return this.currentMeetingId;
  }
}

// Create singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;

// React hook for using WebSocket service
export const useWebSocket = () => {
  const connect = (meetingId: string, userId: number) => webSocketService.connect(meetingId, userId);
  const disconnect = () => webSocketService.disconnect();
  const sendChatMessage = (message: string, userId: number, userName: string) => 
    webSocketService.sendChatMessage(message, userId, userName);
  const sendTip = (amount: number, message: string, fromUserId: number, fromUserName: string, toUserId: number) =>
    webSocketService.sendTip(amount, message, fromUserId, fromUserName, toUserId);
  const isConnected = () => webSocketService.isConnected();

  return {
    connect,
    disconnect,
    sendChatMessage,
    sendTip,
    isConnected,
  };
};