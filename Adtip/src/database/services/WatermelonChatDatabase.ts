/**
 * WatermelonDB Chat Database Service
 * 
 * Main database service for chat operations using WatermelonDB.
 * Provides high-level methods for chat functionality with proper error handling.
 */

import { Q } from '@nozbe/watermelondb';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { 
  database, 
  User, 
  Conversation, 
  Message, 
  Participant,
  usersCollection,
  conversationsCollection,
  messagesCollection,
  participantsCollection
} from '../index';
import type { ConversationType } from '../models/Conversation';
import type { MessageType, MessageStatus } from '../models/Message';

export interface CreateUserData {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  fcmToken?: string;
}

export interface CreateConversationData {
  id: string;
  type: ConversationType;
  title?: string;
  participantIds: string[];
}

export interface CreateMessageData {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageType: MessageType;
  status?: MessageStatus;
  tempId?: string;
  replyTo?: string;
}

export class WatermelonChatDatabase {
  // User operations
  async createUser(userData: CreateUserData): Promise<User> {
    return await database.write(async () => {
      return await usersCollection.create(user => {
        user._raw.id = userData.id;
        user.name = userData.name;
        user.username = userData.username;
        user.avatar = userData.avatar;
        user.fcmToken = userData.fcmToken;
        user.isOnline = true;
      });
    });
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      return await usersCollection.find(userId);
    } catch {
      return null;
    }
  }

  async updateUser(userId: string, updates: Partial<CreateUserData>): Promise<User | null> {
    const user = await this.getUserById(userId);
    if (!user) return null;

    return await database.write(async () => {
      return await user.update(u => {
        if (updates.name !== undefined) u.name = updates.name;
        if (updates.username !== undefined) u.username = updates.username;
        if (updates.avatar !== undefined) u.avatar = updates.avatar;
        if (updates.fcmToken !== undefined) u.fcmToken = updates.fcmToken;
      });
    });
  }

  async updateUserLastSeen(userId: string): Promise<User | null> {
    const user = await this.getUserById(userId);
    if (!user) return null;

    return await database.write(async () => {
      return await user.update(u => {
        u.lastSeen = new Date();
        u.isOnline = true;
      });
    });
  }

  async getConversationParticipants(conversationId: string): Promise<Participant[]> {
    const participantsCollection = database.get<Participant>('participants');
    return await participantsCollection
      .query(Q.where('conversation_id', conversationId), Q.where('is_active', true))
      .fetch();
  }



  // Conversation operations
  async createConversation(conversationData: CreateConversationData): Promise<Conversation> {
    return await database.write(async () => {
      // Create conversation
      const conversation = await conversationsCollection.create(conv => {
        conv._raw.id = conversationData.id;
        conv.type = conversationData.type;
        conv.title = conversationData.title;
        conv.lastActivity = new Date();
        conv.unreadCount = 0;
        conv.isArchived = false;
        conv.isMuted = false;
      });

      // Create participants
      for (const participantId of conversationData.participantIds) {
        await participantsCollection.create(participant => {
          participant.conversationId = conversation.id;
          participant.userId = participantId;
          participant.joinedAt = new Date();
          participant.isActive = true;
        });
      }

      return conversation;
    });
  }

  async getConversationById(conversationId: string): Promise<Conversation | null> {
    try {
      return await conversationsCollection.find(conversationId);
    } catch {
      return null;
    }
  }

  observeConversations(): Observable<Conversation[]> {
    return conversationsCollection
      .query(
        Q.where('is_archived', Q.notEq(true)),
        Q.sortBy('last_activity', Q.desc)
      )
      .observe();
  }

  async getConversationByParticipants(participantIds: string[]): Promise<Conversation | null> {
    // For direct conversations, find by exact participant match
    if (participantIds.length === 2) {
      const conversations = await conversationsCollection
        .query(Q.where('type', 'direct'))
        .fetch();

      for (const conversation of conversations) {
        const participants = await conversation.participants
          .extend(Q.where('is_active', true))
          .fetch();
        
        const participantUserIds = participants.map((p: any) => p.userId).sort();
        const sortedInputIds = [...participantIds].sort();
        
        if (JSON.stringify(participantUserIds) === JSON.stringify(sortedInputIds)) {
          return conversation;
        }
      }
    }
    
    return null;
  }

  // Message operations
  async createMessage(messageData: CreateMessageData): Promise<Message> {
    return await database.write(async () => {
      const message = await messagesCollection.create(msg => {
        msg._raw.id = messageData.id;
        msg.conversationId = messageData.conversationId;
        msg.senderId = messageData.senderId;
        msg.senderName = messageData.senderName;
        msg.senderAvatar = messageData.senderAvatar;
        msg.content = messageData.content;
        msg.messageType = messageData.messageType;
        msg.status = messageData.status || 'sending';
        msg.tempId = messageData.tempId;
        msg.replyTo = messageData.replyTo;
        msg.isEdited = false;
        msg.isDeleted = false;
      });

      // Update conversation last activity within the same transaction to avoid nested writers
      const conversation = await this.getConversationById(messageData.conversationId);
      if (conversation) {
        // Update directly without calling updateActivity() to avoid nested database.write()
        await conversation.update(conv => {
          conv.lastActivity = new Date();
        });
      }

      return message;
    });
  }

  async getMessageById(messageId: string): Promise<Message | null> {
    try {
      return await messagesCollection.find(messageId);
    } catch {
      return null;
    }
  }

  observeMessages(conversationId: string, limit: number = 50): Observable<Message[]> {
    return messagesCollection
      .query(
        Q.where('conversation_id', conversationId),
        Q.where('is_deleted', Q.notEq(true)),
        Q.sortBy('created_at', Q.desc),
        Q.take(limit)
      )
      .observe()
      .pipe(
        map(messages => messages.reverse()) // Reverse to show oldest first
      );
  }

  async updateMessageStatus(messageId: string, status: MessageStatus): Promise<Message | null> {
    const message = await this.getMessageById(messageId);
    if (!message) return null;

    return await database.write(async () => {
      // Update directly without calling updateStatus() to avoid nested database.write()
      return await message.update(msg => {
        msg.status = status;
      });
    });
  }

  async updateMessageByTempId(tempId: string, updates: {
    id?: string;
    status?: MessageStatus;
    content?: string;
  }): Promise<Message | null> {
    const messages = await messagesCollection
      .query(Q.where('temp_id', tempId))
      .fetch();
    
    const message = messages[0];
    if (!message) return null;

    return await database.write(async () => {
      return await message.update(msg => {
        if (updates.id !== undefined) msg._raw.id = updates.id;
        if (updates.status !== undefined) msg.status = updates.status;
        if (updates.content !== undefined) msg.content = updates.content;
      });
    });
  }

  // Participant operations
  async addParticipant(conversationId: string, userId: string): Promise<Participant> {
    return await database.write(async () => {
      return await participantsCollection.create(participant => {
        participant.conversationId = conversationId;
        participant.userId = userId;
        participant.joinedAt = new Date();
        participant.isActive = true;
      });
    });
  }

  async removeParticipant(conversationId: string, userId: string): Promise<void> {
    const participants = await participantsCollection
      .query(
        Q.where('conversation_id', conversationId),
        Q.where('user_id', userId),
        Q.where('is_active', true)
      )
      .fetch();

    if (participants.length > 0) {
      await database.write(async () => {
        await participants[0].leave();
      });
    }
  }

  async markConversationAsRead(conversationId: string, userId: string, messageId?: string): Promise<void> {
    const conversation = await this.getConversationById(conversationId);
    if (!conversation) return;

    await database.write(async () => {
      // Update conversation unread count directly to avoid nested database.write()
      await conversation.update(conv => {
        conv.unreadCount = 0;
      });

      // Update participant's last read
      const participants = await participantsCollection
        .query(
          Q.where('conversation_id', conversationId),
          Q.where('user_id', userId),
          Q.where('is_active', true)
        )
        .fetch();

      if (participants.length > 0 && messageId) {
        // Update participant directly to avoid nested database.write()
        await participants[0].update(participant => {
          participant.lastReadMessageId = messageId;
          participant.lastReadAt = new Date();
        });
      }
    });
  }

  // Utility methods
  async getUnreadCount(userId: string): Promise<number> {
    const conversations = await conversationsCollection
      .query(Q.where('is_archived', Q.notEq(true)))
      .fetch();

    let totalUnread = 0;
    for (const conversation of conversations) {
      const participant = await conversation.getParticipant(userId);
      if (participant) {
        totalUnread += await participant.getUnreadCount();
      }
    }

    return totalUnread;
  }

  async searchMessages(query: string, conversationId?: string): Promise<Message[]> {
    const baseQuery = [
      Q.where('content', Q.like(`%${Q.sanitizeLikeString(query)}%`)),
      Q.where('is_deleted', Q.notEq(true)),
      Q.sortBy('created_at', Q.desc)
    ];

    if (conversationId) {
      baseQuery.unshift(Q.where('conversation_id', conversationId));
    }

    return await messagesCollection.query(...baseQuery).fetch();
  }

  // Database maintenance
  async cleanup(): Promise<void> {
    await database.write(async () => {
      // Clean up old deleted messages (older than 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const oldDeletedMessages = await messagesCollection
        .query(
          Q.where('is_deleted', true),
          Q.where('deleted_at', Q.lt(thirtyDaysAgo.getTime()))
        )
        .fetch();

      for (const message of oldDeletedMessages) {
        await message.destroyPermanently();
      }
    });
  }
}
