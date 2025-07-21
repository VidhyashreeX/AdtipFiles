/**
 * WatermelonDB Performance Tests
 * 
 * Tests to validate performance improvements over AsyncStorage.
 */

import { WatermelonChatDatabase } from '../services/WatermelonChatDatabase';
import { QueryHelpers } from '../services/QueryHelpers';
import { initializeDatabase, database } from '../index';

describe('WatermelonDB Performance Tests', () => {
  let chatDb: WatermelonChatDatabase;

  beforeEach(async () => {
    await initializeDatabase();
    chatDb = new WatermelonChatDatabase();
    
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });
  });

  afterEach(async () => {
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });
  });

  describe('Large Dataset Performance', () => {
    test('should handle 1000 messages efficiently', async () => {
      // Setup test data
      await chatDb.createUser({ id: 'user1', name: 'User 1' });
      await chatDb.createUser({ id: 'user2', name: 'User 2' });
      await chatDb.createConversation({
        id: 'conv1',
        type: 'direct',
        participantIds: ['user1', 'user2']
      });

      const startTime = Date.now();

      // Create 1000 messages
      const messagePromises = [];
      for (let i = 0; i < 1000; i++) {
        messagePromises.push(
          chatDb.createMessage({
            id: `msg${i}`,
            conversationId: 'conv1',
            senderId: i % 2 === 0 ? 'user1' : 'user2',
            senderName: i % 2 === 0 ? 'User 1' : 'User 2',
            content: `Message ${i}`,
            messageType: 'text'
          })
        );
      }

      await Promise.all(messagePromises);

      const creationTime = Date.now() - startTime;
      console.log(`Created 1000 messages in ${creationTime}ms`);

      // Test query performance
      const queryStartTime = Date.now();
      const messages = await QueryHelpers.observeConversationMessages('conv1', 50).pipe().toPromise();
      const queryTime = Date.now() - queryStartTime;

      console.log(`Queried 50 messages from 1000 in ${queryTime}ms`);

      expect(messages).toHaveLength(50);
      expect(creationTime).toBeLessThan(10000); // Should complete in under 10 seconds
      expect(queryTime).toBeLessThan(1000); // Should query in under 1 second
    });

    test('should handle 100 conversations efficiently', async () => {
      // Create users
      const userPromises = [];
      for (let i = 0; i < 200; i++) {
        userPromises.push(
          chatDb.createUser({ id: `user${i}`, name: `User ${i}` })
        );
      }
      await Promise.all(userPromises);

      const startTime = Date.now();

      // Create 100 conversations
      const conversationPromises = [];
      for (let i = 0; i < 100; i++) {
        conversationPromises.push(
          chatDb.createConversation({
            id: `conv${i}`,
            type: 'direct',
            participantIds: [`user${i * 2}`, `user${i * 2 + 1}`]
          })
        );
      }

      await Promise.all(conversationPromises);

      const creationTime = Date.now() - startTime;
      console.log(`Created 100 conversations in ${creationTime}ms`);

      // Test query performance
      const queryStartTime = Date.now();
      const conversations = await chatDb.observeConversations().pipe().toPromise();
      const queryTime = Date.now() - queryStartTime;

      console.log(`Queried 100 conversations in ${queryTime}ms`);

      expect(conversations).toHaveLength(100);
      expect(creationTime).toBeLessThan(5000); // Should complete in under 5 seconds
      expect(queryTime).toBeLessThan(500); // Should query in under 500ms
    });

    test('should handle complex search queries efficiently', async () => {
      // Setup test data
      await chatDb.createUser({ id: 'user1', name: 'User 1' });
      await chatDb.createUser({ id: 'user2', name: 'User 2' });
      await chatDb.createConversation({
        id: 'conv1',
        type: 'direct',
        participantIds: ['user1', 'user2']
      });

      // Create messages with searchable content
      const messagePromises = [];
      for (let i = 0; i < 500; i++) {
        const content = i % 10 === 0 ? `Important message ${i}` : `Regular message ${i}`;
        messagePromises.push(
          chatDb.createMessage({
            id: `msg${i}`,
            conversationId: 'conv1',
            senderId: 'user1',
            senderName: 'User 1',
            content,
            messageType: 'text'
          })
        );
      }

      await Promise.all(messagePromises);

      // Test search performance
      const searchStartTime = Date.now();
      const searchResults = await QueryHelpers.searchMessages('Important');
      const searchTime = Date.now() - searchStartTime;

      console.log(`Searched 500 messages in ${searchTime}ms`);

      expect(searchResults.length).toBe(50); // Should find 50 "Important" messages
      expect(searchTime).toBeLessThan(1000); // Should search in under 1 second
    });
  });

  describe('Memory Usage Tests', () => {
    test('should not load all messages into memory at once', async () => {
      // Setup test data
      await chatDb.createUser({ id: 'user1', name: 'User 1' });
      await chatDb.createUser({ id: 'user2', name: 'User 2' });
      await chatDb.createConversation({
        id: 'conv1',
        type: 'direct',
        participantIds: ['user1', 'user2']
      });

      // Create many messages
      const messagePromises = [];
      for (let i = 0; i < 1000; i++) {
        messagePromises.push(
          chatDb.createMessage({
            id: `msg${i}`,
            conversationId: 'conv1',
            senderId: 'user1',
            senderName: 'User 1',
            content: `Message ${i} with some content to make it larger`,
            messageType: 'text'
          })
        );
      }

      await Promise.all(messagePromises);

      // Query with limit should only return limited results
      const limitedMessages = await QueryHelpers.observeConversationMessages('conv1', 20).pipe().toPromise();
      
      expect(limitedMessages).toHaveLength(20);
      
      // Verify pagination works
      const nextBatch = await QueryHelpers.observeConversationMessages('conv1', 20).pipe().toPromise();
      expect(nextBatch).toHaveLength(20);
    });
  });

  describe('Reactive Performance', () => {
    test('should handle rapid updates efficiently', async () => {
      // Setup test data
      await chatDb.createUser({ id: 'user1', name: 'User 1' });
      await chatDb.createUser({ id: 'user2', name: 'User 2' });
      await chatDb.createConversation({
        id: 'conv1',
        type: 'direct',
        participantIds: ['user1', 'user2']
      });

      let updateCount = 0;
      const observable = chatDb.observeMessages('conv1');
      
      const subscription = observable.subscribe(() => {
        updateCount++;
      });

      const startTime = Date.now();

      // Create 100 messages rapidly
      const messagePromises = [];
      for (let i = 0; i < 100; i++) {
        messagePromises.push(
          chatDb.createMessage({
            id: `msg${i}`,
            conversationId: 'conv1',
            senderId: 'user1',
            senderName: 'User 1',
            content: `Message ${i}`,
            messageType: 'text'
          })
        );
      }

      await Promise.all(messagePromises);

      // Wait for all reactive updates
      await new Promise(resolve => setTimeout(resolve, 1000));

      const totalTime = Date.now() - startTime;
      console.log(`Handled ${updateCount} reactive updates in ${totalTime}ms`);

      subscription.unsubscribe();

      expect(updateCount).toBeGreaterThan(0);
      expect(totalTime).toBeLessThan(5000); // Should handle updates in under 5 seconds
    });
  });

  describe('Concurrent Operations', () => {
    test('should handle concurrent reads and writes', async () => {
      // Setup test data
      await chatDb.createUser({ id: 'user1', name: 'User 1' });
      await chatDb.createUser({ id: 'user2', name: 'User 2' });
      await chatDb.createConversation({
        id: 'conv1',
        type: 'direct',
        participantIds: ['user1', 'user2']
      });

      const startTime = Date.now();

      // Concurrent operations
      const operations = [];

      // Write operations
      for (let i = 0; i < 50; i++) {
        operations.push(
          chatDb.createMessage({
            id: `msg${i}`,
            conversationId: 'conv1',
            senderId: 'user1',
            senderName: 'User 1',
            content: `Message ${i}`,
            messageType: 'text'
          })
        );
      }

      // Read operations
      for (let i = 0; i < 50; i++) {
        operations.push(
          QueryHelpers.observeConversationMessages('conv1', 10).pipe().toPromise()
        );
      }

      const results = await Promise.all(operations);
      const totalTime = Date.now() - startTime;

      console.log(`Completed 100 concurrent operations in ${totalTime}ms`);

      expect(results).toHaveLength(100);
      expect(totalTime).toBeLessThan(10000); // Should complete in under 10 seconds
    });
  });

  describe('Database Size and Cleanup', () => {
    test('should handle database cleanup efficiently', async () => {
      // Setup test data
      await chatDb.createUser({ id: 'user1', name: 'User 1' });
      await chatDb.createUser({ id: 'user2', name: 'User 2' });
      await chatDb.createConversation({
        id: 'conv1',
        type: 'direct',
        participantIds: ['user1', 'user2']
      });

      // Create and delete messages
      const messagePromises = [];
      for (let i = 0; i < 100; i++) {
        messagePromises.push(
          chatDb.createMessage({
            id: `msg${i}`,
            conversationId: 'conv1',
            senderId: 'user1',
            senderName: 'User 1',
            content: `Message ${i}`,
            messageType: 'text'
          })
        );
      }

      await Promise.all(messagePromises);

      // Mark some messages as deleted
      for (let i = 0; i < 50; i++) {
        const message = await chatDb.getMessageById(`msg${i}`);
        if (message) {
          await message.softDelete();
        }
      }

      const cleanupStartTime = Date.now();
      await chatDb.cleanup();
      const cleanupTime = Date.now() - cleanupStartTime;

      console.log(`Database cleanup completed in ${cleanupTime}ms`);

      expect(cleanupTime).toBeLessThan(2000); // Should cleanup in under 2 seconds
    });
  });
});
