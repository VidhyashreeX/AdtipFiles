/**
 * Message Model for WatermelonDB
 * 
 * Represents a chat message with content, status, and metadata.
 */

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'file';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export class Message extends Model {
  static table = 'messages';

  static associations: Associations = {
    sender: { type: 'belongs_to', key: 'sender_id' },
    recipient: { type: 'belongs_to', key: 'recipient_id' },
    replyToMessage: { type: 'belongs_to', key: 'reply_to' },
  };

  // User-based chat fields (clean implementation)
  @field('chat_id') chatId!: string;
  @field('sender_id') senderId!: string;
  @field('recipient_id') recipientId!: string;
  @field('sender_name') senderName!: string;
  @field('sender_avatar') senderAvatar?: string;
  @field('content') content!: string;
  @field('message_type') messageType!: MessageType;
  @field('status') status!: MessageStatus;
  @field('temp_id') tempId?: string;
  @field('reply_to') replyTo?: string;
  @field('file_url') fileUrl?: string;
  @field('file_name') fileName?: string;
  @field('file_size') fileSize?: number;
  @field('file_mime_type') fileMimeType?: string;
  @field('is_edited') isEdited?: boolean;
  @date('edited_at') editedAt?: Date;
  @field('is_deleted') isDeleted?: boolean;
  @date('deleted_at') deletedAt?: Date;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @relation('users', 'sender_id') sender: any;
  @relation('users', 'recipient_id') recipient: any;
  @relation('messages', 'reply_to') replyToMessage: any;

  // Helper methods
  get isOwn(): boolean {
    // This would be determined by comparing with current user ID
    // Implementation depends on how current user is accessed
    return false; // Placeholder
  }

  get isMediaMessage(): boolean {
    return ['image', 'video', 'audio', 'file'].includes(this.messageType);
  }

  get isTextMessage(): boolean {
    return this.messageType === 'text';
  }

  get hasReply(): boolean {
    return !!this.replyTo;
  }

  get displayContent(): string {
    if (this.isDeleted) {
      return 'This message was deleted';
    }
    
    if (this.isMediaMessage && this.fileName) {
      return this.fileName;
    }
    
    return this.content;
  }

  get statusIcon(): string {
    switch (this.status) {
      case 'sending':
        return 'clock';
      case 'sent':
        return 'check';
      case 'delivered':
        return 'check-check';
      case 'read':
        return 'check-check';
      default:
        return 'clock';
    }
  }

  // Update message status
  async updateStatus(status: MessageStatus): Promise<Message> {
    return await this.database.write(async () => {
      return await this.update(message => {
        message.status = status;
      });
    });
  }

  // Edit message content
  async editContent(newContent: string): Promise<void> {
    await this.database.write(async () => {
      await this.update(message => {
        message.content = newContent;
        message.isEdited = true;
        message.editedAt = new Date();
      });
    });
  }

  // Soft delete message
  async softDelete(): Promise<void> {
    await this.database.write(async () => {
      await this.update(message => {
        message.isDeleted = true;
        message.deletedAt = new Date();
      });
    });
  }

  // Restore deleted message
  async restore(): Promise<void> {
    await this.database.write(async () => {
      await this.update(message => {
        message.isDeleted = false;
        message.deletedAt = undefined;
      });
    });
  }

  // Update file information for media messages
  async updateFileInfo(fileInfo: {
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    fileMimeType?: string;
  }): Promise<void> {
    await this.database.write(async () => {
      await this.update(message => {
        if (fileInfo.fileUrl !== undefined) message.fileUrl = fileInfo.fileUrl;
        if (fileInfo.fileName !== undefined) message.fileName = fileInfo.fileName;
        if (fileInfo.fileSize !== undefined) message.fileSize = fileInfo.fileSize;
        if (fileInfo.fileMimeType !== undefined) message.fileMimeType = fileInfo.fileMimeType;
      });
    });
  }

  // Get formatted timestamp
  getFormattedTime(): string {
    const now = new Date();
    const messageDate = this.createdAt;

    // If today, show time only
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // If this week, show day and time
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (messageDate > weekAgo) {
      return messageDate.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    }

    // Otherwise show date
    return messageDate.toLocaleDateString();
  }

  // User-based chat helper methods
  static generateChatId(userId1: string, userId2: string): string {
    const [user1, user2] = [userId1, userId2].sort();
    return `chat_${user1}_${user2}`;
  }

  getOtherUserId(currentUserId: string): string {
    return this.senderId === currentUserId ? this.recipientId : this.senderId;
  }

  getOtherUserName(currentUserId: string): string {
    return this.senderId === currentUserId ? 'You' : this.senderName;
  }

  isFromUser(currentUserId: string): boolean {
    return this.senderId === currentUserId;
  }
}
