// src/services/calling/__tests__/WhatsAppCallManager.test.ts

import WhatsAppCallManager, { CallNotificationData, CallData } from '../WhatsAppCallManager';

// Mock dependencies
jest.mock('@notifee/react-native', () => ({
  createChannel: jest.fn(),
  displayNotification: jest.fn(),
  cancelNotification: jest.fn(),
  cancelAllNotifications: jest.fn(),
  AndroidImportance: {
    HIGH: 4,
    DEFAULT: 3,
  },
  AndroidCategory: {
    CALL: 'call',
  },
  AndroidVisibility: {
    PUBLIC: 1,
  },
  AuthorizationStatus: {
    AUTHORIZED: 1,
    DENIED: 2,
  },
  requestPermission: jest.fn(),
  getNotificationSettings: jest.fn(),
  onForegroundEvent: jest.fn(),
  onBackgroundEvent: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../../events/AppEventEmitter', () => ({
  appEventEmitter: {
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  },
}));

jest.mock('../../navigation/NavigationService', () => ({
  navigate: jest.fn(),
}));

jest.mock('../ApiService', () => ({
  getInstance: jest.fn(() => ({
    sendCallNotification: jest.fn(),
    updateCallStatus: jest.fn(),
  })),
}));

describe('WhatsAppCallManager', () => {
  let callManager: WhatsAppCallManager;

  beforeEach(() => {
    jest.clearAllMocks();
    callManager = WhatsAppCallManager.getInstance();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const result = await callManager.initialize();
      expect(result).toBe(true);
    });

    it('should be a singleton', () => {
      const instance1 = WhatsAppCallManager.getInstance();
      const instance2 = WhatsAppCallManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Outgoing Calls', () => {
    it('should start an outgoing call', async () => {
      await callManager.initialize();
      const result = await callManager.startOutgoingCall(
        'recipient-123',
        'Test Recipient',
        'video',
        'Test Caller',
        'caller-123'
      );
      expect(result).toBeTruthy();
    });
  });

  describe('Incoming Calls', () => {
    const mockIncomingCallData: CallNotificationData = {
      callId: 'incoming-call-id',
      callerName: 'Incoming Caller',
      callType: 'voice',
      callerId: 'caller-456',
      meetingId: 'meeting-456',
      token: 'incoming-token',
    };

    it('should handle incoming call', async () => {
      await callManager.initialize();
      await callManager.handleIncomingCall(mockIncomingCallData);
      const currentCall = callManager.getCurrentCall();
      expect(currentCall).toBeTruthy();
      expect(currentCall?.status).toBe('ringing');
    });

    it('should accept incoming call', async () => {
      await callManager.initialize();
      await callManager.handleIncomingCall(mockIncomingCallData);
      await callManager.acceptCall();
      const currentCall = callManager.getCurrentCall();
      expect(currentCall?.status).toBe('connecting');
    });

    it('should decline incoming call', async () => {
      await callManager.initialize();
      await callManager.handleIncomingCall(mockIncomingCallData);
      await callManager.declineCall();
      const currentCall = callManager.getCurrentCall();
      expect(currentCall).toBeNull();
    });
  });

  describe('Call State Management', () => {
    it('should update call status', async () => {
      const mockCallData: CallNotificationData = {
        callId: 'test-call-id',
        callerName: 'Test Caller',
        callType: 'video',
        callerId: 'caller-123',
        meetingId: 'meeting-123',
        token: 'test-token',
      };

      await callManager.initialize();
      await callManager.handleIncomingCall(mockCallData);
      await callManager.updateCallStatus('connected');
      
      const currentCall = callManager.getCurrentCall();
      expect(currentCall?.status).toBe('connected');
    });

    it('should end call and cleanup', async () => {
      const mockCallData: CallNotificationData = {
        callId: 'test-call-id',
        callerName: 'Test Caller',
        callType: 'video',
        callerId: 'caller-123',
        meetingId: 'meeting-123',
        token: 'test-token',
      };

      await callManager.initialize();
      await callManager.handleIncomingCall(mockCallData);
      await callManager.endCall();
      
      const currentCall = callManager.getCurrentCall();
      expect(currentCall).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', async () => {
      // Mock notifee to throw an error
      require('@notifee/react-native').createChannel.mockRejectedValue(
        new Error('Notification permission denied')
      );

      const result = await callManager.initialize();
      expect(result).toBe(false);
    });

    it('should handle call operations without initialization', async () => {
      // Try to start call without initialization
      const result = await callManager.startOutgoingCall(
        'recipient-123',
        'Test Recipient',
        'video',
        'Test Caller',
        'caller-123'
      );
      expect(result).toBeNull();
    });
  });
});
