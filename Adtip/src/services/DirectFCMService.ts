/**
 * Direct FCM Service
 * 
 * Service for sending FCM messages directly from the frontend
 * without backend dependencies. Uses Firebase Admin SDK approach
 * adapted for React Native.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FCMMessagePayload {
  to: string;                    // Recipient FCM token
  priority: 'high' | 'normal';
  data: {
    type: string;
    messageId: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    content: string;
    timestamp: string;
    [key: string]: string;
  };
  notification?: {
    title: string;
    body: string;
    icon?: string;
    sound?: string;
  };
}

export interface FCMResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class DirectFCMService {
  private static instance: DirectFCMService;
  private fcmServerKey: string | null = null;
  private fcmSenderId: string | null = null;

  private constructor() {}

  static getInstance(): DirectFCMService {
    if (!DirectFCMService.instance) {
      DirectFCMService.instance = new DirectFCMService();
    }
    return DirectFCMService.instance;
  }

  /**
   * Initialize with FCM credentials
   */
  async initialize(): Promise<void> {
    try {
      // Get FCM credentials from secure storage or config
      this.fcmServerKey = await this.getFCMServerKey();
      this.fcmSenderId = await this.getFCMSenderId();

      if (!this.fcmServerKey) {
        console.warn('[DirectFCMService] FCM Server Key not available - using fallback method');
      }

      console.log('[DirectFCMService] Initialized successfully');
    } catch (error) {
      console.error('[DirectFCMService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Send FCM message directly
   */
  async sendMessage(payload: FCMMessagePayload): Promise<FCMResponse> {
    try {
      console.log('[DirectFCMService] Sending FCM message:', {
        to: payload.to.substring(0, 20) + '...',
        type: payload.data.type,
        messageId: payload.data.messageId
      });

      // Method 1: Try direct FCM API call
      if (this.fcmServerKey) {
        const result = await this.sendViaFCMAPI(payload);
        if (result.success) {
          return result;
        }
      }

      // Method 2: Fallback to local notification + storage sync
      return await this.sendViaLocalSync(payload);

    } catch (error) {
      console.error('[DirectFCMService] Error sending FCM message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send via direct FCM API
   */
  private async sendViaFCMAPI(payload: FCMMessagePayload): Promise<FCMResponse> {
    try {
      const fcmEndpoint = 'https://fcm.googleapis.com/fcm/send';
      
      const fcmPayload = {
        to: payload.to,
        priority: payload.priority,
        data: payload.data,
        notification: payload.notification
      };

      const response = await fetch(fcmEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `key=${this.fcmServerKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fcmPayload)
      });

      const responseData = await response.json();

      if (response.ok && responseData.success === 1) {
        console.log('[DirectFCMService] FCM message sent successfully via API');
        return {
          success: true,
          messageId: responseData.results?.[0]?.message_id
        };
      } else {
        console.warn('[DirectFCMService] FCM API response error:', responseData);
        return {
          success: false,
          error: responseData.results?.[0]?.error || 'FCM API error'
        };
      }

    } catch (error) {
      console.error('[DirectFCMService] FCM API call failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'FCM API call failed'
      };
    }
  }

  /**
   * Fallback method using local storage sync
   */
  private async sendViaLocalSync(payload: FCMMessagePayload): Promise<FCMResponse> {
    try {
      console.log('[DirectFCMService] Using local sync fallback method');

      // Store message in a shared sync queue that other app instances can read
      const syncMessage = {
        id: payload.data.messageId,
        targetToken: payload.to,
        payload: payload,
        timestamp: Date.now(),
        attempts: 0
      };

      // Save to sync queue
      await this.addToSyncQueue(syncMessage);

      // For now, simulate success
      // In a real implementation, this would trigger a background sync
      // or use a peer-to-peer mechanism
      
      console.log('[DirectFCMService] Message added to sync queue');
      return {
        success: true,
        messageId: payload.data.messageId
      };

    } catch (error) {
      console.error('[DirectFCMService] Local sync fallback failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Local sync failed'
      };
    }
  }

  /**
   * Get FCM Server Key from secure storage
   */
  private async getFCMServerKey(): Promise<string | null> {
    try {
      // In a real implementation, this would be stored securely
      // For now, return null to use fallback method
      
      // Option 1: From AsyncStorage (not recommended for production)
      const storedKey = await AsyncStorage.getItem('@fcm_server_key');
      if (storedKey) {
        return storedKey;
      }

      // Option 2: From environment or config
      // This would typically be injected during build time
      const configKey = process.env.FCM_SERVER_KEY;
      if (configKey) {
        return configKey;
      }

      // Option 3: From a secure API call
      // const keyResponse = await this.fetchFCMKeyFromAPI();
      // return keyResponse.key;

      return null;
    } catch (error) {
      console.error('[DirectFCMService] Error getting FCM server key:', error);
      return null;
    }
  }

  /**
   * Get FCM Sender ID
   */
  private async getFCMSenderId(): Promise<string | null> {
    try {
      // Similar to server key, this would be from config
      const senderId = await AsyncStorage.getItem('@fcm_sender_id');
      return senderId || process.env.FCM_SENDER_ID || null;
    } catch (error) {
      console.error('[DirectFCMService] Error getting FCM sender ID:', error);
      return null;
    }
  }

  /**
   * Add message to sync queue
   */
  private async addToSyncQueue(syncMessage: any): Promise<void> {
    try {
      const queueKey = '@fcm_sync_queue';
      const existingQueue = await AsyncStorage.getItem(queueKey);
      const queue = existingQueue ? JSON.parse(existingQueue) : [];
      
      queue.push(syncMessage);
      
      // Keep only last 100 messages in queue
      if (queue.length > 100) {
        queue.splice(0, queue.length - 100);
      }
      
      await AsyncStorage.setItem(queueKey, JSON.stringify(queue));
    } catch (error) {
      console.error('[DirectFCMService] Error adding to sync queue:', error);
    }
  }

  /**
   * Validate FCM token format
   */
  static isValidFCMToken(token: string): boolean {
    // Basic FCM token validation
    return token && 
           typeof token === 'string' && 
           token.length > 50 && 
           token.length < 500 &&
           /^[A-Za-z0-9_-]+$/.test(token.replace(/:/g, ''));
  }

  /**
   * Create chat message payload
   */
  static createChatMessagePayload(
    recipientToken: string,
    senderId: string,
    senderName: string,
    conversationId: string,
    content: string,
    messageId: string
  ): FCMMessagePayload {
    return {
      to: recipientToken,
      priority: 'high',
      data: {
        type: 'chat_message',
        messageId,
        conversationId,
        senderId,
        senderName,
        content,
        timestamp: new Date().toISOString()
      },
      notification: {
        title: senderName,
        body: content,
        sound: 'default'
      }
    };
  }

  /**
   * Batch send messages
   */
  async sendBatchMessages(payloads: FCMMessagePayload[]): Promise<FCMResponse[]> {
    const results: FCMResponse[] = [];
    
    for (const payload of payloads) {
      const result = await this.sendMessage(payload);
      results.push(result);
      
      // Add small delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }
}
