/**
 * Participant Model for WatermelonDB
 * 
 * Junction table model representing the relationship between users and conversations.
 * Tracks participation status, roles, and read receipts.
 */

import { Model, Q } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';

export type ParticipantRole = 'admin' | 'member';

export class Participant extends Model {
  static table = 'participants';

  static associations: Associations = {
    conversation: { type: 'belongs_to', key: 'conversation_id' },
    user: { type: 'belongs_to', key: 'user_id' },
    lastReadMessage: { type: 'belongs_to', key: 'last_read_message_id' },
  };

  @field('conversation_id') conversationId!: string;
  @field('user_id') userId!: string;
  @field('role') role?: ParticipantRole;
  @date('joined_at') joinedAt!: Date;
  @date('left_at') leftAt?: Date;
  @field('is_active') isActive!: boolean;
  @field('last_read_message_id') lastReadMessageId?: string;
  @date('last_read_at') lastReadAt?: Date;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @relation('conversations', 'conversation_id') conversation: any;
  @relation('users', 'user_id') user: any;
  @relation('messages', 'last_read_message_id') lastReadMessage: any;

  // Helper methods
  get isAdmin(): boolean {
    return this.role === 'admin';
  }

  get isMember(): boolean {
    return this.role === 'member' || !this.role;
  }

  get hasLeft(): boolean {
    return !!this.leftAt;
  }

  get isCurrentlyActive(): boolean {
    return this.isActive && !this.hasLeft;
  }

  // Update participant role (for group chats)
  async updateRole(role: ParticipantRole): Promise<void> {
    await this.update(participant => {
      participant.role = role;
    });
  }

  // Mark participant as left
  async leave(): Promise<void> {
    await this.update(participant => {
      participant.isActive = false;
      participant.leftAt = new Date();
    });
  }

  // Rejoin conversation
  async rejoin(): Promise<void> {
    await this.update(participant => {
      participant.isActive = true;
      participant.leftAt = undefined;
      participant.joinedAt = new Date();
    });
  }

  // Update last read message
  async updateLastRead(messageId: string): Promise<void> {
    await this.update(participant => {
      participant.lastReadMessageId = messageId;
      participant.lastReadAt = new Date();
    });
  }

  // Check if participant has read a specific message
  async hasReadMessage(messageId: string): Promise<boolean> {
    if (!this.lastReadMessageId) return false;
    
    // This would require comparing message timestamps
    // For now, simple string comparison
    return this.lastReadMessageId === messageId;
  }

  // Get unread message count for this participant
  async getUnreadCount(): Promise<number> {
    if (!this.lastReadAt) {
      // If never read, count all messages since joining
      const conversation = await this.conversation.fetch();
      const messages = await conversation.messages
        .extend(
          Q.where('created_at', Q.gte(this.joinedAt.getTime())),
          Q.where('is_deleted', Q.notEq(true))
        )
        .fetch();
      return messages.length;
    }

    // Count messages since last read
    const conversation = await this.conversation.fetch();
    const messages = await conversation.messages
      .extend(
        Q.where('created_at', Q.gt(this.lastReadAt.getTime())),
        Q.where('is_deleted', Q.notEq(true))
      )
      .fetch();
    return messages.length;
  }

  // Get participation duration
  getDuration(): number {
    const endTime = this.leftAt || new Date();
    return endTime.getTime() - this.joinedAt.getTime();
  }

  // Get formatted join date
  getFormattedJoinDate(): string {
    return this.joinedAt.toLocaleDateString();
  }

  // Check if user joined recently (within last 24 hours)
  isRecentJoin(): boolean {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.joinedAt > oneDayAgo;
  }
}
