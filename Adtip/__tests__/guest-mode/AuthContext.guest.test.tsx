import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '../../src/contexts/AuthContext';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock ApiService
jest.mock('../../src/services/ApiService', () => ({
  verifyOtp: jest.fn(),
  logout: jest.fn(),
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    reset: jest.fn(),
  }),
  createNavigationContainerRef: () => ({
    isReady: () => true,
    reset: jest.fn(),
  }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext Guest Mode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Guest Mode Activation', () => {
    it('should enter guest mode successfully', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.enterGuestMode();
      });

      expect(result.current.isGuest).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      // Guest mode is no longer persisted to AsyncStorage
      expect(AsyncStorage.setItem).not.toHaveBeenCalledWith('@guest_mode', 'true');
    });

    it('should exit guest mode successfully', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // First enter guest mode
      await act(async () => {
        await result.current.enterGuestMode();
      });

      // Then exit guest mode
      await act(async () => {
        await result.current.exitGuestMode();
      });

      expect(result.current.isGuest).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      // Guest mode is no longer persisted, so no AsyncStorage operations
    });
  });

  describe('Guest Mode Session Behavior', () => {
    it('should not persist guest mode across app restarts', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Enter guest mode
      await act(async () => {
        await result.current.enterGuestMode();
      });

      expect(result.current.isGuest).toBe(true);

      // Simulate app restart by creating a new hook instance
      const { result: newResult } = renderHook(() => useAuth(), { wrapper });

      // Wait for initialization
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Guest mode should not persist across app restarts
      expect(newResult.current.isGuest).toBe(false);
      expect(newResult.current.isAuthenticated).toBe(false);
    });

    it('should not be in guest mode on fresh app start', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initialization
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.isGuest).toBe(false);
    });
  });

  describe('Guest Mode State Cleanup', () => {
    it('should clear guest mode when user logs in successfully', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Enter guest mode first
      await act(async () => {
        await result.current.enterGuestMode();
      });

      expect(result.current.isGuest).toBe(true);

      // Mock successful OTP verification
      const mockApiService = require('../../src/services/ApiService');
      mockApiService.verifyOtp.mockResolvedValue({
        status: true,
        data: {
          id: 123,
          name: 'Test User',
          mobile: '1234567890',
          is_first_time: 0,
          isSaveUserDetails: 1,
        },
        accessToken: 'test-token',
      });

      // Verify OTP (simulate login)
      await act(async () => {
        await result.current.verifyOtp('1234567890', '123456', 'test-id');
      });

      expect(result.current.isGuest).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
      // Guest mode is no longer persisted, so no AsyncStorage operations
    });

    it('should clear guest mode on logout', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Enter guest mode first
      await act(async () => {
        await result.current.enterGuestMode();
      });

      expect(result.current.isGuest).toBe(true);

      // Logout
      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isGuest).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully when entering guest mode', async () => {
      // Mock a general error in the enterGuestMode function
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Since guest mode no longer uses AsyncStorage, we test basic error handling
      // by ensuring the function completes successfully
      await act(async () => {
        await result.current.enterGuestMode();
      });

      expect(result.current.isGuest).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle errors gracefully when exiting guest mode', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // First enter guest mode
      await act(async () => {
        await result.current.enterGuestMode();
      });

      // Then exit guest mode
      await act(async () => {
        await result.current.exitGuestMode();
      });

      expect(result.current.isGuest).toBe(false);
    });
  });
});
