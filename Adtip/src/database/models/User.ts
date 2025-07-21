/**
 * User Model for WatermelonDB
 * 
 * Represents a user in the chat system with profile information and FCM token.
 */

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, children } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';

export class User extends Model {
  static table = 'users';

  static associations: Associations = {
    participants: { type: 'has_many', foreignKey: 'user_id' },
    messages: { type: 'has_many', foreignKey: 'sender_id' },
  };

  @field('name') name!: string;
  @field('username') username?: string;
  @field('avatar') avatar?: string;
  @field('fcm_token') fcmToken?: string;
  @date('last_seen') lastSeen?: Date;
  @field('is_online') isOnline?: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @children('participants') participants: any;
  @children('messages') messages: any;

  // Helper methods
  get displayName(): string {
    return this.name || this.username || 'Unknown User';
  }

  get isActive(): boolean {
    if (!this.lastSeen) return false;
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    return this.lastSeen.getTime() > fiveMinutesAgo;
  }

  // Update user profile
  async updateProfile(data: {
    name?: string;
    username?: string;
    avatar?: string;
    fcmToken?: string;
  }): Promise<void> {
    await this.database.write(async () => {
      await this.update(user => {
        if (data.name !== undefined) user.name = data.name;
        if (data.username !== undefined) user.username = data.username;
        if (data.avatar !== undefined) user.avatar = data.avatar;
        if (data.fcmToken !== undefined) user.fcmToken = data.fcmToken;
      });
    });
  }

  // Update last seen timestamp
  async updateLastSeen(): Promise<void> {
    await this.database.write(async () => {
      await this.update(user => {
        user.lastSeen = new Date();
        user.isOnline = true;
      });
    });
  }

  // Set user offline
  async setOffline(): Promise<void> {
    await this.database.write(async () => {
      await this.update(user => {
        user.isOnline = false;
      });
    });
  }
}
