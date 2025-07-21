/**
 * Conversation Model for WatermelonDB
 * 
 * Represents a chat conversation (direct or group) with participants and messages.
 */

import { Model, Q } from '@nozbe/watermelondb';
import { field, date, readonly, children, lazy } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type ConversationType = 'direct' | 'group';

export class Conversation extends Model {
  static table = 'conversations';

  static associations: Associations = {
    messages: { type: 'has_many', foreignKey: 'conversation_id' },
    participants: { type: 'has_many', foreignKey: 'conversation_id' },
  };

  @field('type') type!: ConversationType;
  @field('title') title?: string;
  @date('last_activity') lastActivity!: Date;
  @field('unread_count') unreadCount!: number;
  @field('is_archived') isArchived?: boolean;
  @field('is_muted') isMuted?: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @children('messages') messages: any;
  @children('participants') participants: any;

  // Lazy-loaded last message
  @lazy lastMessage = this.messages
    .observe()
    .pipe(
      map(messages => 
        messages
          .filter(msg => !msg.isDeleted)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
      )
    );

  // Lazy-loaded active participants
  @lazy activeParticipants = this.participants
    .extend(Q.where('is_active', true))
    .observe();

  // Helper methods
  get displayTitle(): string {
    return this.title || `${this.type} conversation`;
  }

  // Update conversation activity
  async updateActivity(): Promise<void> {
    await this.database.write(async () => {
      await this.update(conversation => {
        conversation.lastActivity = new Date();
      });
    });
  }

  // Update unread count
  async updateUnreadCount(count: number): Promise<void> {
    await this.database.write(async () => {
      await this.update(conversation => {
        conversation.unreadCount = Math.max(0, count);
      });
    });
  }

  // Increment unread count
  async incrementUnreadCount(): Promise<void> {
    await this.database.write(async () => {
      await this.update(conversation => {
        conversation.unreadCount = (conversation.unreadCount || 0) + 1;
      });
    });
  }

  // Reset unread count
  async markAsRead(): Promise<void> {
    await this.database.write(async () => {
      await this.update(conversation => {
        conversation.unreadCount = 0;
      });
    });
  }

  // Archive/unarchive conversation
  async setArchived(archived: boolean): Promise<void> {
    await this.database.write(async () => {
      await this.update(conversation => {
        conversation.isArchived = archived;
      });
    });
  }

  // Mute/unmute conversation
  async setMuted(muted: boolean): Promise<void> {
    await this.database.write(async () => {
      await this.update(conversation => {
        conversation.isMuted = muted;
      });
    });
  }

  // Get messages with pagination
  getMessages(limit: number = 50, offset: number = 0): Observable<any[]> {
    return this.messages
      .extend(
        Q.where('is_deleted', Q.notEq(true)),
        Q.sortBy('created_at', Q.desc),
        Q.take(limit),
        Q.skip(offset)
      )
      .observe();
  }

  // Get message count
  async getMessageCount(): Promise<number> {
    const messages = await this.messages
      .extend(Q.where('is_deleted', Q.notEq(true)))
      .fetch();
    return messages.length;
  }

  // Check if user is participant
  async isUserParticipant(userId: string): Promise<boolean> {
    const participant = await this.participants
      .extend(
        Q.where('user_id', userId),
        Q.where('is_active', true)
      )
      .fetch();
    return participant.length > 0;
  }

  // Get participant by user ID
  async getParticipant(userId: string) {
    const participants = await this.participants
      .extend(
        Q.where('user_id', userId),
        Q.where('is_active', true)
      )
      .fetch();
    return participants[0] || null;
  }
}
