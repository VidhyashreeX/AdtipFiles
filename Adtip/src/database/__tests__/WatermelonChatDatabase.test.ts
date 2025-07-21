/**
 * WatermelonDB Chat Database Tests
 * 
 * Comprehensive tests for the WatermelonDB chat database functionality.
 */

import { WatermelonChatDatabase } from '../services/WatermelonChatDatabase';
import { initializeDatabase, database } from '../index';

describe('WatermelonChatDatabase', () => {
  let chatDb: WatermelonChatDatabase;

  beforeEach(async () => {
    // Initialize database
    await initializeDatabase();
    chatDb = new WatermelonChatDatabase();
    
    // Clear database
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });
  });

  afterEach(async () => {
    // Clean up
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });
  });

  describe('User Operations', () => {
    test('should create a user', async () => {
      const userData = {
        id: 'user1',
        name: 'John Doe',
        username: 'johndoe',
        avatar: 'https://example.com/avatar.jpg',
        fcmToken: 'fcm_token_123'
      };

      const user = await chatDb.createUser(userData);

      expect(user.id).toBe('user1');
      expect(user.name).toBe('John Doe');
      expect(user.username).toBe('johndoe');
      expect(user.avatar).toBe('https://example.com/avatar.jpg');
      expect(user.fcmToken).toBe('fcm_token_123');
    });

    test('should get user by ID', async () => {
      const userData = {
        id: 'user1',
        name: 'John Doe'
      };

      await chatDb.createUser(userData);
      const user = await chatDb.getUserById('user1');

      expect(user).toBeDefined();
      expect(user?.name).toBe('John Doe');
    });

    test('should return null for non-existent user', async () => {
      const user = await chatDb.getUserById('non-existent');
      expect(user).toBeNull();
    });

    test('should update user', async () => {
      const userData = {
        id: 'user1',
        name: 'John Doe'
      };

      await chatDb.createUser(userData);
      
      const updatedUser = await chatDb.updateUser('user1', {
        name: 'John Smith',
        avatar: 'https://example.com/new-avatar.jpg'
      });

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.name).toBe('John Smith');
      expect(updatedUser?.avatar).toBe('https://example.com/new-avatar.jpg');
    });
  });

  describe('Conversation Operations', () => {
    beforeEach(async () => {
      // Create test users
      await chatDb.createUser({ id: 'user1', name: 'User 1' });
      await chatDb.createUser({ id: 'user2', name: 'User 2' });
    });

    test('should create a direct conversation', async () => {
      const conversationData = {
        id: 'conv1',
        type: 'direct' as const,
        participantIds: ['user1', 'user2']
      };

      const conversation = await chatDb.createConversation(conversationData);

      expect(conversation.id).toBe('conv1');
      expect(conversation.type).toBe('direct');
      expect(conversation.unreadCount).toBe(0);
    });

    test('should create a group conversation', async () => {
      await chatDb.createUser({ id: 'user3', name: 'User 3' });
      
      const conversationData = {
        id: 'conv1',
        type: 'group' as const,
        title: 'Test Group',
        participantIds: ['user1', 'user2', 'user3']
      };

      const conversation = await chatDb.createConversation(conversationData);

      expect(conversation.id).toBe('conv1');
      expect(conversation.type).toBe('group');
      expect(conversation.title).toBe('Test Group');
    });

    test('should get conversation by ID', async () => {
      const conversationData = {
        id: 'conv1',
        type: 'direct' as const,
        participantIds: ['user1', 'user2']
      };

      await chatDb.createConversation(conversationData);
      const conversation = await chatDb.getConversationById('conv1');

      expect(conversation).toBeDefined();
      expect(conversation?.type).toBe('direct');
    });

    test('should find conversation by participants', async () => {
      const conversationData = {
        id: 'conv1',
        type: 'direct' as const,
        participantIds: ['user1', 'user2']
      };

      await chatDb.createConversation(conversationData);
      const conversation = await chatDb.getConversationByParticipants(['user1', 'user2']);

      expect(conversation).toBeDefined();
      expect(conversation?.id).toBe('conv1');
    });

    test('should observe conversations reactively', async () => {
      const conversationData = {
        id: 'conv1',
        type: 'direct' as const,
        participantIds: ['user1', 'user2']
      };

      const observable = chatDb.observeConversations();
      let conversations: any[] = [];

      const subscription = observable.subscribe(convs => {
        conversations = convs;
      });

      // Initially empty
      expect(conversations).toHaveLength(0);

      // Create conversation
      await chatDb.createConversation(conversationData);

      // Wait for reactive update
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(conversations).toHaveLength(1);
      expect(conversations[0].id).toBe('conv1');

      subscription.unsubscribe();
    });
  });

  describe('Message Operations', () => {
    beforeEach(async () => {
      // Create test users and conversation
      await chatDb.createUser({ id: 'user1', name: 'User 1' });
      await chatDb.createUser({ id: 'user2', name: 'User 2' });
      await chatDb.createConversation({
        id: 'conv1',
        type: 'direct',
        participantIds: ['user1', 'user2']
      });
    });

    test('should create a message', async () => {
      const messageData = {
        id: 'msg1',
        conversationId: 'conv1',
        senderId: 'user1',
        senderName: 'User 1',
        content: 'Hello World!',
        messageType: 'text' as const
      };

      const message = await chatDb.createMessage(messageData);

      expect(message.id).toBe('msg1');
      expect(message.content).toBe('Hello World!');
      expect(message.messageType).toBe('text');
      expect(message.status).toBe('sending');
    });

    test('should get message by ID', async () => {
      const messageData = {
        id: 'msg1',
        conversationId: 'conv1',
        senderId: 'user1',
        senderName: 'User 1',
        content: 'Hello World!',
        messageType: 'text' as const
      };

      await chatDb.createMessage(messageData);
      const message = await chatDb.getMessageById('msg1');

      expect(message).toBeDefined();
      expect(message?.content).toBe('Hello World!');
    });

    test('should observe messages reactively', async () => {
      const messageData = {
        id: 'msg1',
        conversationId: 'conv1',
        senderId: 'user1',
        senderName: 'User 1',
        content: 'Hello World!',
        messageType: 'text' as const
      };

      const observable = chatDb.observeMessages('conv1');
      let messages: any[] = [];

      const subscription = observable.subscribe(msgs => {
        messages = msgs;
      });

      // Initially empty
      expect(messages).toHaveLength(0);

      // Create message
      await chatDb.createMessage(messageData);

      // Wait for reactive update
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(messages).toHaveLength(1);
      expect(messages[0].content).toBe('Hello World!');

      subscription.unsubscribe();
    });

    test('should update message status', async () => {
      const messageData = {
        id: 'msg1',
        conversationId: 'conv1',
        senderId: 'user1',
        senderName: 'User 1',
        content: 'Hello World!',
        messageType: 'text' as const
      };

      await chatDb.createMessage(messageData);
      const updatedMessage = await chatDb.updateMessageStatus('msg1', 'sent');

      expect(updatedMessage).toBeDefined();
      expect(updatedMessage?.status).toBe('sent');
    });

    test('should update message by temp ID', async () => {
      const messageData = {
        id: 'temp123',
        conversationId: 'conv1',
        senderId: 'user1',
        senderName: 'User 1',
        content: 'Hello World!',
        messageType: 'text' as const,
        tempId: 'temp123'
      };

      await chatDb.createMessage(messageData);
      const updatedMessage = await chatDb.updateMessageByTempId('temp123', {
        id: 'msg1',
        status: 'sent'
      });

      expect(updatedMessage).toBeDefined();
      expect(updatedMessage?.id).toBe('msg1');
      expect(updatedMessage?.status).toBe('sent');
    });
  });

  describe('Participant Operations', () => {
    beforeEach(async () => {
      // Create test users and conversation
      await chatDb.createUser({ id: 'user1', name: 'User 1' });
      await chatDb.createUser({ id: 'user2', name: 'User 2' });
      await chatDb.createUser({ id: 'user3', name: 'User 3' });
      await chatDb.createConversation({
        id: 'conv1',
        type: 'group',
        title: 'Test Group',
        participantIds: ['user1', 'user2']
      });
    });

    test('should add participant to conversation', async () => {
      const participant = await chatDb.addParticipant('conv1', 'user3');

      expect(participant.conversationId).toBe('conv1');
      expect(participant.userId).toBe('user3');
      expect(participant.isActive).toBe(true);
    });

    test('should remove participant from conversation', async () => {
      await chatDb.addParticipant('conv1', 'user3');
      await chatDb.removeParticipant('conv1', 'user3');

      // Verify participant is no longer active
      const conversation = await chatDb.getConversationById('conv1');
      const isParticipant = await conversation?.isUserParticipant('user3');
      expect(isParticipant).toBe(false);
    });

    test('should mark conversation as read', async () => {
      // Create a message first
      await chatDb.createMessage({
        id: 'msg1',
        conversationId: 'conv1',
        senderId: 'user2',
        senderName: 'User 2',
        content: 'Hello!',
        messageType: 'text'
      });

      await chatDb.markConversationAsRead('conv1', 'user1', 'msg1');

      const conversation = await chatDb.getConversationById('conv1');
      expect(conversation?.unreadCount).toBe(0);
    });
  });

  describe('Search and Utility Operations', () => {
    beforeEach(async () => {
      // Create test data
      await chatDb.createUser({ id: 'user1', name: 'User 1' });
      await chatDb.createUser({ id: 'user2', name: 'User 2' });
      await chatDb.createConversation({
        id: 'conv1',
        type: 'direct',
        participantIds: ['user1', 'user2']
      });
      await chatDb.createMessage({
        id: 'msg1',
        conversationId: 'conv1',
        senderId: 'user1',
        senderName: 'User 1',
        content: 'Hello World!',
        messageType: 'text'
      });
      await chatDb.createMessage({
        id: 'msg2',
        conversationId: 'conv1',
        senderId: 'user2',
        senderName: 'User 2',
        content: 'How are you?',
        messageType: 'text'
      });
    });

    test('should search messages', async () => {
      const results = await chatDb.searchMessages('Hello');

      expect(results).toHaveLength(1);
      expect(results[0].content).toBe('Hello World!');
    });

    test('should search messages in specific conversation', async () => {
      const results = await chatDb.searchMessages('Hello', 'conv1');

      expect(results).toHaveLength(1);
      expect(results[0].content).toBe('Hello World!');
    });

    test('should get unread count for user', async () => {
      // Create unread message
      await chatDb.createMessage({
        id: 'msg3',
        conversationId: 'conv1',
        senderId: 'user2',
        senderName: 'User 2',
        content: 'Unread message',
        messageType: 'text'
      });

      const unreadCount = await chatDb.getUnreadCount('user1');
      expect(unreadCount).toBeGreaterThan(0);
    });
  });
});
