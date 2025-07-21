/**
 * Clean WatermelonDB Chat Database Service
 * 
 * Simplified database service for user-based chat operations only.
 * No legacy conversation/participant complexity.
 */

import { Q } from '@nozbe/watermelondb';
import {
  database,
  User,
  UserChat,
  Message,
  usersCollection,
  userChatsCollection,
  messagesCollection
} from '../index';
import type { MessageType, MessageStatus } from '../models/Message';

export interface CreateUserData {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  fcmToken?: string;
}

export interface CreateMessageData {
  id: string;
  chatId: string;
  senderId: string;
  recipientId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageType: MessageType;
  status: MessageStatus;
  tempId?: string;
  replyTo?: string;
}

export interface UpdateUserData {
  name?: string;
  username?: string;
  avatar?: string;
  fcmToken?: string;
  lastSeen?: Date;
  isOnline?: boolean;
}

export class WatermelonChatDatabase {
  // Expose database instance for compatibility
  database = database;

  // User operations
  async createUser(userData: CreateUserData): Promise<User> {
    return await database.write(async () => {
      return await usersCollection.create(user => {
        user._raw.id = userData.id;
        user.name = userData.name;
        user.username = userData.username;
        user.avatar = userData.avatar;
        user.fcmToken = userData.fcmToken;
        user.isOnline = false;
      });
    });
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      return await usersCollection.find(userId);
    } catch (error) {
      return null;
    }
  }

  async updateUser(userId: string, updateData: UpdateUserData): Promise<User | null> {
    try {
      const user = await usersCollection.find(userId);
      return await database.write(async () => {
        return await user.update(u => {
          if (updateData.name !== undefined) u.name = updateData.name;
          if (updateData.username !== undefined) u.username = updateData.username;
          if (updateData.avatar !== undefined) u.avatar = updateData.avatar;
          if (updateData.fcmToken !== undefined) u.fcmToken = updateData.fcmToken;
          if (updateData.lastSeen !== undefined) u.lastSeen = updateData.lastSeen;
          if (updateData.isOnline !== undefined) u.isOnline = updateData.isOnline;
        });
      });
    } catch (error) {
      console.error('[WatermelonChatDatabase] Error updating user (user not found or update failed):', userId, error);
      return null;
    }
  }

  async updateUserLastSeen(userId: string): Promise<void> {
    try {
      const user = await usersCollection.find(userId);
      await database.write(async () => {
        await user.update(u => {
          u.lastSeen = new Date();
          u.isOnline = true;
        });
      });
    } catch (error) {
      console.error('[WatermelonChatDatabase] Error updating user last seen (user not found):', userId, error);
    }
  }

  // Message operations
  async createMessage(messageData: CreateMessageData): Promise<Message> {
    return await database.write(async () => {
      const message = await messagesCollection.create(msg => {
        msg._raw.id = messageData.id;
        msg.chatId = messageData.chatId;
        msg.senderId = messageData.senderId;
        msg.recipientId = messageData.recipientId;
        msg.senderName = messageData.senderName;
        msg.senderAvatar = messageData.senderAvatar;
        msg.content = messageData.content;
        msg.messageType = messageData.messageType;
        msg.status = messageData.status;
        msg.tempId = messageData.tempId;
        msg.replyTo = messageData.replyTo;
      });

      // Update user chat with new message (using internal method to avoid nested transactions)
      try {
        const userChat = await userChatsCollection
          .query(Q.where('chat_id', messageData.chatId))
          .fetch();

        if (userChat.length > 0) {
          await userChat[0].updateLastMessageInternal(messageData.id, messageData.content, new Date());
        }
      } catch (error) {
        console.warn('[WatermelonChatDatabase] Failed to update user chat:', error);
      }

      return message;
    });
  }

  async getMessageById(messageId: string): Promise<Message | null> {
    try {
      return await messagesCollection.find(messageId);
    } catch (error) {
      return null;
    }
  }

  async updateMessageStatus(messageId: string, status: MessageStatus): Promise<Message | null> {
    try {
      console.log('[WatermelonChatDatabase] 🔄 Updating message status:', { messageId, status });
      const message = await messagesCollection.find(messageId);
      console.log('[WatermelonChatDatabase] 🔄 Found message before update:', {
        id: message.id,
        currentStatus: message.status,
        newStatus: status
      });

      const updatedMessage = await database.write(async () => {
        return await message.update(msg => {
          msg.status = status;
        });
      });

      console.log('[WatermelonChatDatabase] ✅ Message status updated successfully:', {
        id: updatedMessage.id,
        finalStatus: updatedMessage.status
      });

      return updatedMessage;
    } catch (error) {
      console.error('[WatermelonChatDatabase] Error updating message status (message not found):', messageId, error);
      return null;
    }
  }

  // User Chat operations
  async getUserChatById(chatId: string): Promise<UserChat | null> {
    try {
      const userChats = await userChatsCollection
        .query(Q.where('chat_id', chatId))
        .fetch();
      return userChats.length > 0 ? userChats[0] : null;
    } catch (error) {
      console.error('[WatermelonChatDatabase] Error getting user chat:', error);
      return null;
    }
  }

  // Cleanup operations
  async cleanup(): Promise<void> {
    try {
      // Clean up old messages (older than 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      await database.write(async () => {
        const oldMessages = await messagesCollection
          .query(Q.where('created_at', Q.lt(thirtyDaysAgo.getTime())))
          .fetch();

        for (const message of oldMessages) {
          await message.markAsDeleted();
        }
      });

      console.log('[WatermelonChatDatabase] Cleanup completed');
    } catch (error) {
      console.error('[WatermelonChatDatabase] Cleanup failed:', error);
    }
  }

  // Database health check
  async healthCheck(): Promise<boolean> {
    try {
      // Simple query to test database connectivity
      await usersCollection.query().fetch();
      return true;
    } catch (error) {
      console.error('[WatermelonChatDatabase] Health check failed:', error);
      return false;
    }
  }
}
