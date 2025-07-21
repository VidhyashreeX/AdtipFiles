/**
 * WatermelonDB Database Schema
 * 
 * Defines the database schema for the FCMChat system with proper relationships
 * and indexing for optimal performance.
 */

import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    // Users table
    tableSchema({
      name: 'users',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'username', type: 'string', isOptional: true },
        { name: 'avatar', type: 'string', isOptional: true },
        { name: 'fcm_token', type: 'string', isOptional: true },
        { name: 'last_seen', type: 'number', isOptional: true },
        { name: 'is_online', type: 'boolean', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
      indexes: [
        'username',
        'fcm_token',
        'last_seen',
      ]
    }),

    // Conversations table
    tableSchema({
      name: 'conversations',
      columns: [
        { name: 'type', type: 'string' }, // 'direct' | 'group'
        { name: 'title', type: 'string', isOptional: true },
        { name: 'last_activity', type: 'number' },
        { name: 'unread_count', type: 'number' },
        { name: 'is_archived', type: 'boolean', isOptional: true },
        { name: 'is_muted', type: 'boolean', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
      indexes: [
        'type',
        'last_activity',
        'unread_count',
        'is_archived',
      ]
    }),

    // Messages table
    tableSchema({
      name: 'messages',
      columns: [
        { name: 'conversation_id', type: 'string', isIndexed: true },
        { name: 'sender_id', type: 'string', isIndexed: true },
        { name: 'sender_name', type: 'string' },
        { name: 'sender_avatar', type: 'string', isOptional: true },
        { name: 'content', type: 'string' },
        { name: 'message_type', type: 'string' }, // 'text' | 'image' | 'video' | 'audio' | 'file'
        { name: 'status', type: 'string' }, // 'sending' | 'sent' | 'delivered' | 'read'
        { name: 'temp_id', type: 'string', isOptional: true },
        { name: 'reply_to', type: 'string', isOptional: true },
        { name: 'file_url', type: 'string', isOptional: true },
        { name: 'file_name', type: 'string', isOptional: true },
        { name: 'file_size', type: 'number', isOptional: true },
        { name: 'file_mime_type', type: 'string', isOptional: true },
        { name: 'is_edited', type: 'boolean', isOptional: true },
        { name: 'edited_at', type: 'number', isOptional: true },
        { name: 'is_deleted', type: 'boolean', isOptional: true },
        { name: 'deleted_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
      indexes: [
        'conversation_id',
        'sender_id',
        'message_type',
        'status',
        'temp_id',
        'reply_to',
        'created_at',
      ]
    }),

    // Participants table (junction table for conversation participants)
    tableSchema({
      name: 'participants',
      columns: [
        { name: 'conversation_id', type: 'string', isIndexed: true },
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'role', type: 'string', isOptional: true }, // 'admin' | 'member' for groups
        { name: 'joined_at', type: 'number' },
        { name: 'left_at', type: 'number', isOptional: true },
        { name: 'is_active', type: 'boolean' },
        { name: 'last_read_message_id', type: 'string', isOptional: true },
        { name: 'last_read_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
      indexes: [
        'conversation_id',
        'user_id',
        'is_active',
        'last_read_at',
      ]
    }),

    // Message queue table for offline/retry functionality
    tableSchema({
      name: 'message_queue',
      columns: [
        { name: 'message_id', type: 'string', isIndexed: true },
        { name: 'conversation_id', type: 'string', isIndexed: true },
        { name: 'action', type: 'string' }, // 'send' | 'edit' | 'delete'
        { name: 'payload', type: 'string' }, // JSON payload
        { name: 'retry_count', type: 'number' },
        { name: 'max_retries', type: 'number' },
        { name: 'next_retry_at', type: 'number', isOptional: true },
        { name: 'last_error', type: 'string', isOptional: true },
        { name: 'status', type: 'string' }, // 'pending' | 'processing' | 'completed' | 'failed'
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
      indexes: [
        'message_id',
        'conversation_id',
        'action',
        'status',
        'next_retry_at',
      ]
    }),

    // Sync status table for tracking synchronization
    tableSchema({
      name: 'sync_status',
      columns: [
        { name: 'entity_type', type: 'string' }, // 'conversation' | 'message' | 'user'
        { name: 'entity_id', type: 'string' },
        { name: 'local_version', type: 'number' },
        { name: 'server_version', type: 'number', isOptional: true },
        { name: 'sync_status', type: 'string' }, // 'synced' | 'pending' | 'conflict' | 'failed'
        { name: 'last_sync_at', type: 'number', isOptional: true },
        { name: 'conflict_data', type: 'string', isOptional: true }, // JSON for conflict resolution
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
      indexes: [
        'entity_type',
        'entity_id',
        'sync_status',
        'last_sync_at',
      ]
    }),
  ]
});
