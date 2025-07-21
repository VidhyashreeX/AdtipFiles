/**
 * WatermelonDB Database Setup
 * 
 * Main database configuration and initialization for FCMChat system.
 * Provides SQLite-based persistent storage that survives app kills and device restarts.
 */

import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { User } from './models/User';
import { Conversation } from './models/Conversation';
import { Message } from './models/Message';
import { Participant } from './models/Participant';
import migrations from './migrations';

// Database adapter configuration
const adapter = new SQLiteAdapter({
  schema,
  migrations,
  dbName: 'FCMChatDB',
  jsi: true, // Enable JSI for better performance
  onSetUpError: (error) => {
    console.error('[WatermelonDB] Database setup error:', error);
  }
});

// Database instance
export const database = new Database({
  adapter,
  modelClasses: [
    User,
    Conversation,
    Message,
    Participant,
  ],
});

// Export models for easy access
export { User, Conversation, Message, Participant };

// Export collections
export const usersCollection = database.get<User>('users');
export const conversationsCollection = database.get<Conversation>('conversations');
export const messagesCollection = database.get<Message>('messages');
export const participantsCollection = database.get<Participant>('participants');

// Database initialization
export const initializeDatabase = async (): Promise<void> => {
  try {
    console.log('[WatermelonDB] Initializing database...');
    
    // Database is automatically initialized when first accessed
    // We can perform any additional setup here if needed
    
    console.log('[WatermelonDB] Database initialized successfully');
  } catch (error) {
    console.error('[WatermelonDB] Database initialization failed:', error);
    throw error;
  }
};

// Database health check
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    // Simple query to test database connectivity
    await usersCollection.query().fetch();
    return true;
  } catch (error) {
    console.error('[WatermelonDB] Database health check failed:', error);
    return false;
  }
};

// Export database instance as default
export default database;
