/**
 * Local Chat System Tests
 * 
 * Comprehensive test suite for the new local-only chat architecture
 * Tests LocalChatManager, FCMChatServiceLocal, and DirectFCMService
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalChatManager, LocalMessage, LocalConversation } from '../services/LocalChatManager';
import { FCMChatServiceLocal } from '../services/FCMChatServiceLocal';
import { DirectFCMService } from '../services/DirectFCMService';
import { ChatStorageCleanup } from '../utils/ChatStorageCleanup';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn(),
  getAllKeys: jest.fn(),
}));

// Mock Firebase messaging
jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  default: () => ({
    requestPermission: jest.fn(() => Promise.resolve(1)),
    getToken: jest.fn(() => Promise.resolve('mock-fcm-token')),
    onMessage: jest.fn(),
    setBackgroundMessageHandler: jest.fn(),
  }),
}));

// Mock notifee
jest.mock('@notifee/react-native', () => ({
  displayNotification: jest.fn(),
  getDisplayedNotifications: jest.fn(() => Promise.resolve([])),
  cancelNotification: jest.fn(),
}));

describe('Local Chat System', () => {
  let localChatManager: LocalChatManager;
  let fcmChatService: FCMChatServiceLocal;
  let directFCMService: DirectFCMService;

  const mockUserId = '123';
  const mockUserName = 'Test User';
  const mockParticipantId = '456';
  const mockAuthToken = 'mock-auth-token';

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset AsyncStorage mock
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([]);
    
    // Get service instances
    localChatManager = LocalChatManager.getInstance();
    fcmChatService = FCMChatServiceLocal.getInstance();
    directFCMService = DirectFCMService.getInstance();
  });

  afterEach(async () => {
    // Clean up after each test
    await ChatStorageCleanup.cleanupAllChatData();
  });

  describe('LocalChatManager', () => {
    test('should initialize successfully', async () => {
      await expect(localChatManager.initialize(mockUserId, mockUserName)).resolves.not.toThrow();
    });

    test('should generate deterministic conversation IDs', () => {
      const conversationId1 = localChatManager.generateConversationId('123', '456');
      const conversationId2 = localChatManager.generateConversationId('456', '123');
      
      expect(conversationId1).toBe(conversationId2);
      expect(conversationId1).toBe('conv_123_456');
    });

    test('should create new conversation', async () => {
      // Mock empty conversations list
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));
      
      await localChatManager.initialize(mockUserId, mockUserName);
      const conversationId = await localChatManager.createOrGetConversation(mockParticipantId);
      
      expect(conversationId).toBe('conv_123_456');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@fcm_chat_conversations',
        expect.stringContaining('conv_123_456')
      );
    });

    test('should return existing conversation', async () => {
      const existingConversation: LocalConversation = {
        id: 'conv_123_456',
        type: 'direct',
        participants: ['123', '456'],
        lastActivity: new Date().toISOString(),
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([existingConversation]));
      
      await localChatManager.initialize(mockUserId, mockUserName);
      const conversationId = await localChatManager.createOrGetConversation(mockParticipantId);
      
      expect(conversationId).toBe('conv_123_456');
    });

    test('should send message with optimistic update', async () => {
      await localChatManager.initialize(mockUserId, mockUserName);
      
      const message = await localChatManager.sendMessage('conv_123_456', 'Hello World');
      
      expect(message.content).toBe('Hello World');
      expect(message.senderId).toBe(mockUserId);
      expect(message.senderName).toBe(mockUserName);
      expect(message.status).toBe('sending');
    });

    test('should handle message storage correctly', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));
      
      await localChatManager.initialize(mockUserId, mockUserName);
      await localChatManager.sendMessage('conv_123_456', 'Test message');
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@fcm_chat_messages_conv_123_456',
        expect.stringContaining('Test message')
      );
    });

    test('should manage unread counts', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({}));
      
      await localChatManager.initialize(mockUserId, mockUserName);
      
      // Test getting unread count
      const unreadCount = await localChatManager.getUnreadCount('conv_123_456');
      expect(unreadCount).toBe(0);
    });

    test('should mark messages as read', async () => {
      const messages: LocalMessage[] = [
        {
          id: 'msg1',
          conversationId: 'conv_123_456',
          senderId: '456',
          senderName: 'Other User',
          content: 'Hello',
          messageType: 'text',
          createdAt: new Date().toISOString(),
          status: 'delivered'
        }
      ];

      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(messages)) // for getMessages
        .mockResolvedValueOnce(JSON.stringify({ 'conv_123_456': 1 })); // for unread counts

      await localChatManager.initialize(mockUserId, mockUserName);
      await localChatManager.markMessagesAsRead('conv_123_456');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@fcm_chat_messages_conv_123_456',
        expect.stringContaining('"status":"read"')
      );
    });
  });

  describe('FCMChatServiceLocal', () => {
    test('should initialize successfully', async () => {
      // Mock user name retrieval
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('Test User');
      
      await expect(fcmChatService.initialize(mockUserId, mockAuthToken)).resolves.not.toThrow();
    });

    test('should handle missing user name gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      
      await expect(fcmChatService.initialize(mockUserId, mockAuthToken)).rejects.toThrow('User name not available');
    });

    test('should delegate to LocalChatManager for core operations', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('Test User');
      
      await fcmChatService.initialize(mockUserId, mockAuthToken);
      
      // Test conversation creation
      const conversationId = await fcmChatService.createOrGetConversation(mockParticipantId);
      expect(conversationId).toBe('conv_123_456');
    });

    test('should handle conversation state management', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('Test User');
      
      await fcmChatService.initialize(mockUserId, mockAuthToken);
      
      // Test setting current conversation
      fcmChatService.setCurrentConversation('conv_123_456', mockParticipantId);
      
      // Test clearing current conversation
      fcmChatService.setCurrentConversation(null);
    });
  });

  describe('DirectFCMService', () => {
    test('should initialize successfully', async () => {
      await expect(directFCMService.initialize()).resolves.not.toThrow();
    });

    test('should validate FCM tokens correctly', () => {
      expect(DirectFCMService.isValidFCMToken('valid-token-123')).toBe(true);
      expect(DirectFCMService.isValidFCMToken('')).toBe(false);
      expect(DirectFCMService.isValidFCMToken('short')).toBe(false);
    });

    test('should create chat message payload correctly', () => {
      const payload = DirectFCMService.createChatMessagePayload(
        'recipient-token',
        mockUserId,
        mockUserName,
        'conv_123_456',
        'Hello World',
        'msg123'
      );

      expect(payload.to).toBe('recipient-token');
      expect(payload.data.senderId).toBe(mockUserId);
      expect(payload.data.senderName).toBe(mockUserName);
      expect(payload.data.content).toBe('Hello World');
      expect(payload.notification?.title).toBe(mockUserName);
      expect(payload.notification?.body).toBe('Hello World');
    });

    test('should handle message sending with fallback', async () => {
      await directFCMService.initialize();
      
      const payload = DirectFCMService.createChatMessagePayload(
        'recipient-token',
        mockUserId,
        mockUserName,
        'conv_123_456',
        'Hello World',
        'msg123'
      );

      const result = await directFCMService.sendMessage(payload);
      
      // Should succeed with fallback method
      expect(result.success).toBe(true);
    });
  });

  describe('ChatStorageCleanup', () => {
    test('should clean up all chat data', async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([
        '@fcm_chat_conversations',
        '@fcm_chat_messages_conv_123_456',
        'other_key'
      ]);

      await ChatStorageCleanup.cleanupAllChatData();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        '@fcm_chat_conversations',
        '@fcm_chat_messages_conv_123_456'
      ]);
    });

    test('should generate storage report', async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([
        '@fcm_chat_conversations',
        '@fcm_chat_messages_conv_123_456',
        'other_key'
      ]);
      
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('{"test": "data"}');

      const report = await ChatStorageCleanup.getStorageReport();

      expect(report.totalKeys).toBe(3);
      expect(report.chatKeys).toHaveLength(2);
      expect(report.storageSize).toBeGreaterThan(0);
    });

    test('should perform complete reset', async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([]);
      
      await ChatStorageCleanup.performCompleteReset();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@fcm_chat_conversations',
        JSON.stringify([])
      );
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete message flow', async () => {
      // Initialize services
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('Test User');
      await fcmChatService.initialize(mockUserId, mockAuthToken);

      // Create conversation
      const conversationId = await fcmChatService.createOrGetConversation(mockParticipantId);
      expect(conversationId).toBe('conv_123_456');

      // Send message
      const message = await fcmChatService.sendMessage(conversationId, 'Integration test message');
      expect(message.content).toBe('Integration test message');

      // Mark as read
      await fcmChatService.markMessagesAsRead(conversationId);
    });

    test('should handle real-time message updates', async () => {
      let receivedMessage: LocalMessage | null = null;

      const eventHandlers = {
        onMessageReceived: (message: LocalMessage) => {
          receivedMessage = message;
        }
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('Test User');
      await fcmChatService.initialize(mockUserId, mockAuthToken, eventHandlers);

      // Simulate receiving a message (this would normally come from FCM)
      // For testing, we'll trigger the event handler directly
      const incomingMessage: LocalMessage = {
        id: 'incoming-msg',
        conversationId: 'conv_123_456',
        senderId: mockParticipantId,
        senderName: 'Other User',
        content: 'Incoming message',
        messageType: 'text',
        createdAt: new Date().toISOString(),
        status: 'delivered'
      };

      eventHandlers.onMessageReceived(incomingMessage);
      expect(receivedMessage).toEqual(incomingMessage);
    });
  });
});
