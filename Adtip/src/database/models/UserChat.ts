/**
 * UserChat Model for WatermelonDB
 * 
 * Represents a chat between two users with simplified user-based mapping.
 * Replaces the complex conversation/participant system with direct user relationships.
 */

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';

export class UserChat extends Model {
  static table = 'user_chats';

  static associations: Associations = {
    user1: { type: 'belongs_to', key: 'user_id_1' },
    user2: { type: 'belongs_to', key: 'user_id_2' },
    lastMessage: { type: 'belongs_to', key: 'last_message_id' },
  };

  @field('chat_id') chatId!: string;
  @field('user_id_1') userId1!: string;        // First user (sorted)
  @field('user_id_2') userId2!: string;        // Second user (sorted)
  @field('user_1_name') user1Name!: string;
  @field('user_2_name') user2Name!: string;
  @field('last_message_id') lastMessageId?: string;
  @field('last_message_content') lastMessageContent?: string;
  @date('last_message_time') lastMessageTime?: Date;
  @field('user_1_unread_count') user1UnreadCount!: number;
  @field('user_2_unread_count') user2UnreadCount!: number;
  @field('is_active') isActive!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @relation('users', 'user_id_1') user1: any;
  @relation('users', 'user_id_2') user2: any;
  @relation('messages', 'last_message_id') lastMessage: any;

  // Helper methods
  static generateChatId(userId1: string, userId2: string): string {
    const [user1, user2] = [userId1, userId2].sort();
    return `chat_${user1}_${user2}`;
  }

  getOtherUserId(currentUserId: string): string {
    return this.userId1 === currentUserId ? this.userId2 : this.userId1;
  }

  getOtherUserName(currentUserId: string): string {
    return this.userId1 === currentUserId ? this.user2Name : this.user1Name;
  }

  getUnreadCount(currentUserId: string): number {
    return this.userId1 === currentUserId ? this.user1UnreadCount : this.user2UnreadCount;
  }

  // Internal methods (for use within existing transactions)
  private async _incrementUnreadCount(currentUserId: string): Promise<void> {
    const isUser1 = this.userId1 === currentUserId;
    await this.update(() => {
      if (isUser1) {
        this.user1UnreadCount += 1;
      } else {
        this.user2UnreadCount += 1;
      }
    });
  }

  private async _markAsRead(currentUserId: string): Promise<void> {
    const isUser1 = this.userId1 === currentUserId;
    await this.update(() => {
      if (isUser1) {
        this.user1UnreadCount = 0;
      } else {
        this.user2UnreadCount = 0;
      }
    });
  }

  private async _updateLastMessage(messageId: string, content: string, timestamp: Date): Promise<void> {
    await this.update(() => {
      this.lastMessageId = messageId;
      this.lastMessageContent = content;
      this.lastMessageTime = timestamp;
    });
  }

  // Public methods (with database write transactions)
  async incrementUnreadCount(currentUserId: string): Promise<void> {
    await this.database.write(async () => {
      await this._incrementUnreadCount(currentUserId);
    });
  }

  async markAsRead(currentUserId: string): Promise<void> {
    await this.database.write(async () => {
      await this._markAsRead(currentUserId);
    });
  }

  async updateLastMessage(messageId: string, content: string, timestamp: Date): Promise<void> {
    await this.database.write(async () => {
      await this._updateLastMessage(messageId, content, timestamp);
    });
  }

  // Internal method for use within existing transactions
  async updateLastMessageInternal(messageId: string, content: string, timestamp: Date): Promise<void> {
    await this._updateLastMessage(messageId, content, timestamp);
  }

  // Get formatted last message time
  getFormattedLastMessageTime(): string {
    if (!this.lastMessageTime) return '';
    
    const now = new Date();
    const messageDate = this.lastMessageTime;
    
    // If today, show time only
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If this week, show day
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (messageDate > weekAgo) {
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise show date
    return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  // Get preview of last message
  getLastMessagePreview(maxLength: number = 50): string {
    if (!this.lastMessageContent) return 'No messages yet';
    
    if (this.lastMessageContent.length <= maxLength) {
      return this.lastMessageContent;
    }
    
    return this.lastMessageContent.substring(0, maxLength - 3) + '...';
  }
}
