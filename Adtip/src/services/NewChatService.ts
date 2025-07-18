/**
 * New Chat Service for React Native
 *
 * DISABLED: This service has been completely replaced by APIChatService and LocalChatDatabase
 * for more reliable message delivery via FCM high priority notifications and API calls.
 *
 * Use APIChatService and LocalChatDatabase instead for the new FCM + API architecture.
 */

// Legacy interfaces preserved for backward compatibility
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageType: 'text' | 'image' | 'video' | 'audio' | 'file';
  createdAt: string;
  tempId?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  replyTo?: string;
}

export interface Conversation {
  conversation_id: string;
  type: 'direct' | 'group';
  title?: string;
  last_activity_at: string;
  unread_count: number;
  is_muted: boolean;
  last_message_content?: string;
  last_message_type?: string;
  last_message_time?: string;
  last_message_sender_name?: string;
  other_user_id?: string;
  other_user_name?: string;
  other_user_avatar?: string;
  other_user_status?: 'online' | 'offline' | 'away';
}

export interface ChatEventHandlers {
  onMessageReceived?: (message: Message) => void;
  onMessageSent?: (message: Message) => void;
  onMessageDelivered?: (messageId: string, deliveredAt: string) => void;
  onMessageRead?: (messageId: string, readAt: string, readBy: string) => void;
  onUserTyping?: (conversationId: string, userId: string, isTyping: boolean) => void;
  onUserStatusChanged?: (userId: string, status: string) => void;
  onConversationUpdated?: (conversation: Conversation) => void;
  onConnectionStatusChanged?: (connected: boolean) => void;
}

/**
 * DISABLED: NewChatService has been replaced by APIChatService and LocalChatDatabase
 */
class NewChatService {
  /**
   * Initialize chat service with user authentication
   * DISABLED: Use APIChatService instead
   */
  async initialize(): Promise<void> {
    console.log('[NewChatService] DISABLED - Use APIChatService and LocalChatDatabase instead');
    return;
  }

  /**
   * Set event handlers
   * DISABLED: Use APIChatService instead
   */
  setEventHandlers(): void {
    console.log('[NewChatService] DISABLED - Use APIChatService instead');
  }

  /**
   * Send message
   * DISABLED: Use APIChatService instead
   */
  async sendMessage(): Promise<void> {
    console.log('[NewChatService] DISABLED - Use APIChatService instead');
  }

  /**
   * Get conversations
   * DISABLED: Use APIChatService instead
   */
  async getConversations(): Promise<Conversation[]> {
    console.log('[NewChatService] DISABLED - Use APIChatService instead');
    return [];
  }

  /**
   * Get messages
   * DISABLED: Use APIChatService instead
   */
  async getMessages(): Promise<Message[]> {
    console.log('[NewChatService] DISABLED - Use APIChatService instead');
    return [];
  }

  /**
   * Disconnect
   * DISABLED: Use APIChatService instead
   */
  disconnect(): void {
    console.log('[NewChatService] DISABLED - Use APIChatService instead');
  }
}

export default new NewChatService();
