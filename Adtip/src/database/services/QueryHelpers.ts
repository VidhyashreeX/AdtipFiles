/**
 * WatermelonDB Query Helpers
 * 
 * Utility functions for common database queries and operations.
 * Provides reusable query patterns for the chat system.
 */

import { Q } from '@nozbe/watermelondb';
import { Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { 
  conversationsCollection,
  messagesCollection,
  participantsCollection,
  usersCollection
} from '../index';
import type { Conversation } from '../models/Conversation';
import type { Message } from '../models/Message';
import type { User } from '../models/User';
import type { Participant } from '../models/Participant';

export class QueryHelpers {
  
  // Conversation queries
  static observeActiveConversations(userId: string): Observable<Conversation[]> {
    return conversationsCollection
      .query(
        Q.where('is_archived', Q.notEq(true)),
        Q.sortBy('last_activity', Q.desc)
      )
      .observe()
      .pipe(
        map(conversations => 
          conversations.filter(async conv => {
            const isParticipant = await conv.isUserParticipant(userId);
            return isParticipant;
          })
        ),
        distinctUntilChanged()
      );
  }

  static observeConversationMessages(
    conversationId: string, 
    limit: number = 50,
    offset: number = 0
  ): Observable<Message[]> {
    return messagesCollection
      .query(
        Q.where('conversation_id', conversationId),
        Q.where('is_deleted', Q.notEq(true)),
        Q.sortBy('created_at', Q.desc),
        Q.take(limit),
        Q.skip(offset)
      )
      .observe()
      .pipe(
        map(messages => messages.reverse()), // Show oldest first
        distinctUntilChanged()
      );
  }

  static async getConversationParticipants(conversationId: string): Promise<User[]> {
    const participants = await participantsCollection
      .query(
        Q.where('conversation_id', conversationId),
        Q.where('is_active', true)
      )
      .fetch();

    const users: User[] = [];
    for (const participant of participants) {
      const user = await participant.user.fetch();
      if (user) users.push(user);
    }

    return users;
  }

  static async getDirectConversation(userId1: string, userId2: string): Promise<Conversation | null> {
    const conversations = await conversationsCollection
      .query(Q.where('type', 'direct'))
      .fetch();

    for (const conversation of conversations) {
      const participants = await participantsCollection
        .query(
          Q.where('conversation_id', conversation.id),
          Q.where('is_active', true)
        )
        .fetch();

      const participantIds = participants.map(p => p.userId).sort();
      const targetIds = [userId1, userId2].sort();

      if (JSON.stringify(participantIds) === JSON.stringify(targetIds)) {
        return conversation;
      }
    }

    return null;
  }

  // Message queries
  static observeUnreadMessages(userId: string): Observable<Message[]> {
    return messagesCollection
      .query(
        Q.where('sender_id', Q.notEq(userId)),
        Q.where('status', Q.notEq('read')),
        Q.where('is_deleted', Q.notEq(true)),
        Q.sortBy('created_at', Q.desc)
      )
      .observe();
  }

  static async getMessagesByStatus(status: string): Promise<Message[]> {
    return await messagesCollection
      .query(
        Q.where('status', status),
        Q.where('is_deleted', Q.notEq(true)),
        Q.sortBy('created_at', Q.desc)
      )
      .fetch();
  }

  static async getMessagesByTempId(tempId: string): Promise<Message[]> {
    return await messagesCollection
      .query(Q.where('temp_id', tempId))
      .fetch();
  }

  static async getReplyChain(messageId: string): Promise<Message[]> {
    const chain: Message[] = [];
    let currentMessageId: string | undefined = messageId;

    while (currentMessageId) {
      try {
        const message = await messagesCollection.find(currentMessageId);
        if (!message) break;

        chain.unshift(message);
        currentMessageId = message.replyTo;
      } catch {
        break;
      }
    }

    return chain;
  }

  // User queries
  static async searchUsers(query: string, limit: number = 20): Promise<User[]> {
    const searchTerm = query.toLowerCase();
    
    return await usersCollection
      .query(
        Q.or(
          Q.where('name', Q.like(`%${Q.sanitizeLikeString(searchTerm)}%`)),
          Q.where('username', Q.like(`%${Q.sanitizeLikeString(searchTerm)}%`))
        ),
        Q.take(limit),
        Q.sortBy('name', Q.asc)
      )
      .fetch();
  }

  static async getOnlineUsers(): Promise<User[]> {
    return await usersCollection
      .query(
        Q.where('is_online', true),
        Q.sortBy('last_seen', Q.desc)
      )
      .fetch();
  }

  static async getUsersByIds(userIds: string[]): Promise<User[]> {
    if (userIds.length === 0) return [];

    return await usersCollection
      .query(Q.where('id', Q.oneOf(userIds)))
      .fetch();
  }

  // Participant queries
  static async getUserConversations(userId: string): Promise<Conversation[]> {
    const participants = await participantsCollection
      .query(
        Q.where('user_id', userId),
        Q.where('is_active', true)
      )
      .fetch();

    const conversations: Conversation[] = [];
    for (const participant of participants) {
      const conversation = await participant.conversation.fetch();
      if (conversation) conversations.push(conversation);
    }

    return conversations.sort((a, b) => 
      b.lastActivity.getTime() - a.lastActivity.getTime()
    );
  }

  static async getConversationUnreadCount(conversationId: string, userId: string): Promise<number> {
    const participant = await participantsCollection
      .query(
        Q.where('conversation_id', conversationId),
        Q.where('user_id', userId),
        Q.where('is_active', true)
      )
      .fetch();

    if (participant.length === 0) return 0;

    return await participant[0].getUnreadCount();
  }

  static async getTotalUnreadCount(userId: string): Promise<number> {
    const participants = await participantsCollection
      .query(
        Q.where('user_id', userId),
        Q.where('is_active', true)
      )
      .fetch();

    let totalUnread = 0;
    for (const participant of participants) {
      totalUnread += await participant.getUnreadCount();
    }

    return totalUnread;
  }

  // Search and filtering
  static async searchMessages(
    query: string, 
    conversationId?: string,
    limit: number = 50
  ): Promise<Message[]> {
    const baseQuery = [
      Q.where('content', Q.like(`%${Q.sanitizeLikeString(query)}%`)),
      Q.where('is_deleted', Q.notEq(true)),
      Q.sortBy('created_at', Q.desc),
      Q.take(limit)
    ];

    if (conversationId) {
      baseQuery.unshift(Q.where('conversation_id', conversationId));
    }

    return await messagesCollection.query(...baseQuery).fetch();
  }

  static async getMediaMessages(
    conversationId: string,
    messageType?: string,
    limit: number = 50
  ): Promise<Message[]> {
    const baseQuery = [
      Q.where('conversation_id', conversationId),
      Q.where('is_deleted', Q.notEq(true)),
      Q.sortBy('created_at', Q.desc),
      Q.take(limit)
    ];

    if (messageType) {
      baseQuery.push(Q.where('message_type', messageType));
    } else {
      baseQuery.push(Q.where('message_type', Q.oneOf(['image', 'video', 'audio', 'file'])));
    }

    return await messagesCollection.query(...baseQuery).fetch();
  }

  // Analytics and statistics
  static async getConversationStats(conversationId: string): Promise<{
    totalMessages: number;
    mediaMessages: number;
    participantCount: number;
    oldestMessage?: Date;
    newestMessage?: Date;
  }> {
    const [messages, participants] = await Promise.all([
      messagesCollection
        .query(
          Q.where('conversation_id', conversationId),
          Q.where('is_deleted', Q.notEq(true))
        )
        .fetch(),
      participantsCollection
        .query(
          Q.where('conversation_id', conversationId),
          Q.where('is_active', true)
        )
        .fetch()
    ]);

    const mediaMessages = messages.filter(msg => 
      ['image', 'video', 'audio', 'file'].includes(msg.messageType)
    );

    const sortedMessages = messages.sort((a, b) => 
      a.createdAt.getTime() - b.createdAt.getTime()
    );

    return {
      totalMessages: messages.length,
      mediaMessages: mediaMessages.length,
      participantCount: participants.length,
      oldestMessage: sortedMessages[0]?.createdAt,
      newestMessage: sortedMessages[sortedMessages.length - 1]?.createdAt
    };
  }

  static async getUserMessageCount(userId: string, days: number = 30): Promise<number> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const messages = await messagesCollection
      .query(
        Q.where('sender_id', userId),
        Q.where('created_at', Q.gte(since.getTime())),
        Q.where('is_deleted', Q.notEq(true))
      )
      .fetch();

    return messages.length;
  }

  // Cleanup utilities
  static async getOldDeletedMessages(daysOld: number = 30): Promise<Message[]> {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    
    return await messagesCollection
      .query(
        Q.where('is_deleted', true),
        Q.where('deleted_at', Q.lt(cutoffDate.getTime()))
      )
      .fetch();
  }

  static async getInactiveConversations(daysInactive: number = 90): Promise<Conversation[]> {
    const cutoffDate = new Date(Date.now() - daysInactive * 24 * 60 * 60 * 1000);
    
    return await conversationsCollection
      .query(
        Q.where('last_activity', Q.lt(cutoffDate.getTime())),
        Q.where('is_archived', Q.notEq(true))
      )
      .fetch();
  }
}
