/**
 * Clean QueryHelpers for User-Based Chat System
 * 
 * Simplified query helpers for user-based chats only.
 * No legacy conversation/participant complexity.
 */

import { Q } from '@nozbe/watermelondb';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  database,
  messagesCollection,
  usersCollection,
  userChatsCollection
} from '../index';

export class QueryHelpers {
  // ===== USER-BASED CHAT METHODS =====

  /**
   * Generate chat ID for two users
   */
  static generateChatId(userId1: string, userId2: string): string {
    const [user1, user2] = [userId1, userId2].sort();
    return `chat_${user1}_${user2}`;
  }

  /**
   * Get or create user chat between two users
   */
  static async getOrCreateUserChat(currentUserId: string, otherUserId: string): Promise<any> {
    const chatId = this.generateChatId(currentUserId, otherUserId);

    console.log('[QueryHelpers] 🔍 Looking for user chat:', chatId);

    // Try to find existing chat
    const userChat = await userChatsCollection
      .query(Q.where('chat_id', chatId))
      .fetch();

    if (userChat.length > 0) {
      console.log('[QueryHelpers] ✅ Found existing user chat:', chatId);
      return userChat[0];
    }

    console.log('[QueryHelpers] 📝 Creating new user chat:', chatId);

    // Get or create user records
    const currentUser = await this.getOrCreateUser(currentUserId);
    const otherUser = await this.getOrCreateUser(otherUserId);

    const [user1, user2] = [currentUserId, otherUserId].sort();
    const [user1Name, user2Name] = user1 === currentUserId
      ? [currentUser.name, otherUser.name]
      : [otherUser.name, currentUser.name];

    // Create new chat
    const newChat = await database.write(async () => {
      return await userChatsCollection.create((chat: any) => {
        chat.chatId = chatId;
        chat.userId1 = user1;
        chat.userId2 = user2;
        chat.user1Name = user1Name;
        chat.user2Name = user2Name;
        chat.user1UnreadCount = 0;
        chat.user2UnreadCount = 0;
        chat.isActive = true;
      });
    });

    console.log('[QueryHelpers] ✅ Created new user chat:', chatId);
    return newChat;
  }

  /**
   * Get messages between two users
   */
  static async getUserMessages(currentUserId: string, otherUserId: string, limit: number = 50): Promise<any[]> {
    const chatId = this.generateChatId(currentUserId, otherUserId);
    
    console.log('[QueryHelpers] 📨 Getting messages for chat:', chatId);
    
    return await messagesCollection
      .query(
        Q.where('chat_id', chatId),
        Q.sortBy('created_at', Q.desc),
        Q.take(limit)
      )
      .fetch();
  }

  /**
   * Get messages observable for real-time updates
   */
  static getUserMessagesObservable(currentUserId: string, otherUserId: string, limit: number = 50): Observable<any[]> {
    const chatId = this.generateChatId(currentUserId, otherUserId);
    
    return messagesCollection
      .query(
        Q.where('chat_id', chatId),
        Q.sortBy('created_at', Q.desc),
        Q.take(limit)
      )
      .observe()
      .pipe(
        map(messages => messages.reverse()) // Reverse to show oldest first
      );
  }

  /**
   * Get all user chats for a user
   */
  static async getUserChats(currentUserId: string): Promise<any[]> {
    console.log('[QueryHelpers] 📋 Getting user chats for:', currentUserId);
    
    return await userChatsCollection
      .query(
        Q.or(
          Q.where('user_id_1', currentUserId),
          Q.where('user_id_2', currentUserId)
        ),
        Q.where('is_active', true),
        Q.sortBy('last_message_time', Q.desc)
      )
      .fetch();
  }

  /**
   * Get user chats observable for real-time updates
   */
  static getUserChatsObservable(currentUserId: string): Observable<any[]> {
    return userChatsCollection
      .query(
        Q.or(
          Q.where('user_id_1', currentUserId),
          Q.where('user_id_2', currentUserId)
        ),
        Q.where('is_active', true),
        Q.sortBy('last_message_time', Q.desc)
      )
      .observe();
  }

  /**
   * Mark messages as read for a user chat
   */
  static async markUserChatAsRead(currentUserId: string, otherUserId: string): Promise<void> {
    const chatId = this.generateChatId(currentUserId, otherUserId);
    
    console.log('[QueryHelpers] ✅ Marking chat as read:', chatId);
    
    const userChat = await userChatsCollection
      .query(Q.where('chat_id', chatId))
      .fetch();

    if (userChat.length > 0) {
      await userChat[0].markAsRead(currentUserId);
    }
  }

  /**
   * Get unread count for a user
   */
  static async getTotalUnreadCount(currentUserId: string): Promise<number> {
    const userChats = await this.getUserChats(currentUserId);
    
    return userChats.reduce((total, chat) => {
      return total + chat.getUnreadCount(currentUserId);
    }, 0);
  }

  /**
   * Update user chat with new message
   */
  static async updateUserChatWithMessage(messageId: string, chatId: string, content: string, timestamp: Date): Promise<void> {
    const userChat = await userChatsCollection
      .query(Q.where('chat_id', chatId))
      .fetch();

    if (userChat.length > 0) {
      await userChat[0].updateLastMessage(messageId, content, timestamp);
    }
  }

  /**
   * Search messages across all user chats
   */
  static async searchMessages(query: string, chatId?: string): Promise<any[]> {
    let queryBuilder = messagesCollection.query(
      Q.where('content', Q.like(`%${Q.sanitizeLikeString(query)}%`)),
      Q.sortBy('created_at', Q.desc)
    );

    if (chatId) {
      queryBuilder = messagesCollection.query(
        Q.where('chat_id', chatId),
        Q.where('content', Q.like(`%${Q.sanitizeLikeString(query)}%`)),
        Q.sortBy('created_at', Q.desc)
      );
    }

    return await queryBuilder.fetch();
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<any | null> {
    try {
      return await usersCollection.find(userId);
    } catch (error) {
      console.log('[QueryHelpers] User not found:', userId, error);
      return null;
    }
  }

  /**
   * Get or create user by ID (creates placeholder if not found)
   */
  static async getOrCreateUser(userId: string, name?: string): Promise<any> {
    try {
      return await usersCollection.find(userId);
    } catch (error) {
      console.log('[QueryHelpers] 👤 User not found locally, creating placeholder:', userId, error);
      return await database.write(async () => {
        return await usersCollection.create((user: any) => {
          user._raw.id = userId;
          user.name = name || `User ${userId}`;
          user.username = `user_${userId}`;
          user.isOnline = false;
        });
      });
    }
  }

  /**
   * Search users by name or username
   */
  static async searchUsers(query: string): Promise<any[]> {
    return await usersCollection
      .query(
        Q.or(
          Q.where('name', Q.like(`%${Q.sanitizeLikeString(query)}%`)),
          Q.where('username', Q.like(`%${Q.sanitizeLikeString(query)}%`))
        )
      )
      .fetch();
  }

  // ===== SYNC SERVICE COMPATIBILITY METHODS =====

  /**
   * Get messages by status (for sync service)
   */
  static async getMessagesByStatus(status: string): Promise<any[]> {
    console.log('[QueryHelpers] 📨 Getting messages by status:', status);

    return await messagesCollection
      .query(
        Q.where('status', status),
        Q.sortBy('created_at', Q.desc)
      )
      .fetch();
  }

  /**
   * Get user conversations (alias for getUserChats for sync service compatibility)
   */
  static async getUserConversations(userId: string): Promise<any[]> {
    console.log('[QueryHelpers] 📋 Getting user conversations (alias for getUserChats):', userId);

    // Since we're using user-based chats, this is just an alias for getUserChats
    return await this.getUserChats(userId);
  }
}
