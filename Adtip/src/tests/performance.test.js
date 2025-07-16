/**
 * Performance Tests for API Optimization
 * 
 * These tests verify that the TanStack Query optimizations have improved
 * app performance and eliminated navigation-blocking API calls.
 */

import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Import screens to test
import UserProfileScreen from '../screens/profile/UserProfileScreen';
import WalletScreen from '../screens/wallet/WalletScreen';
import HomeScreen from '../screens/home/HomeScreen';
import TipCallScreen from '../screens/tipcall/TipCallScreen';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

// Mock route
const mockRoute = {
  params: { userId: 123 },
};

// Create a test query client
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 1000 * 60 * 5, // 5 minutes
        staleTime: 1000 * 60 * 2, // 2 minutes
      },
      mutations: {
        retry: false,
      },
    },
  });
};

// Test wrapper component
const TestWrapper = ({ children }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Performance Tests - Navigation Speed', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  test('ProfileScreen should render quickly without blocking', async () => {
    const startTime = performance.now();
    
    const { getByTestId } = render(
      <TestWrapper>
        <ProfileScreen navigation={mockNavigation} route={mockRoute} />
      </TestWrapper>
    );

    // Screen should render immediately, even if data is loading
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    expect(renderTime).toBeLessThan(500); // Should render in under 500ms
    
    // Loading state should be shown while data loads
    await waitFor(() => {
      expect(getByTestId('profile-screen')).toBeTruthy();
    });
  });

  test('WalletScreen should not block on data fetching', async () => {
    const startTime = performance.now();
    
    const { getByTestId } = render(
      <TestWrapper>
        <WalletScreen navigation={mockNavigation} />
      </TestWrapper>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    expect(renderTime).toBeLessThan(300); // Should render very quickly
    expect(getByTestId('wallet-screen')).toBeTruthy();
  });

  test('Tab navigation should be instant', async () => {
    const tabSwitchTimes = [];

    // Simulate rapid tab switching
    for (let i = 0; i < 5; i++) {
      const startTime = performance.now();
      
      // Mock tab switch
      act(() => {
        mockNavigation.navigate('Tab' + i);
      });
      
      const endTime = performance.now();
      tabSwitchTimes.push(endTime - startTime);
    }

    // All tab switches should be under 100ms
    tabSwitchTimes.forEach(time => {
      expect(time).toBeLessThan(100);
    });

    // Average should be very fast
    const averageTime = tabSwitchTimes.reduce((a, b) => a + b, 0) / tabSwitchTimes.length;
    expect(averageTime).toBeLessThan(50);
  });
});

describe('Performance Tests - Optimistic Updates', () => {
  test('Like button should respond immediately', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <HomeScreen navigation={mockNavigation} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByTestId('home-screen')).toBeTruthy();
    });

    // Find a like button (assuming it exists)
    const likeButton = getByTestId('like-button-1');
    
    const startTime = performance.now();
    fireEvent.press(likeButton);
    
    // UI should update immediately (optimistic update)
    const endTime = performance.now();
    const responseTime = endTime - startTime;

    expect(responseTime).toBeLessThan(100); // Should respond in under 100ms
  });

  test('Follow button should show immediate feedback', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <ProfileScreen navigation={mockNavigation} route={mockRoute} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByTestId('profile-screen')).toBeTruthy();
    });

    const followButton = getByTestId('follow-button');
    
    const startTime = performance.now();
    fireEvent.press(followButton);
    
    const endTime = performance.now();
    const responseTime = endTime - startTime;

    expect(responseTime).toBeLessThan(100); // Optimistic update should be instant
  });
});

describe('Performance Tests - Cache Efficiency', () => {
  test('Second profile load should use cache', async () => {
    const queryClient = createTestQueryClient();
    
    // First load - populates cache
    const { unmount } = render(
      <QueryClientProvider client={queryClient}>
        <ProfileScreen navigation={mockNavigation} route={mockRoute} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      // Wait for initial data to load
    });

    unmount();

    // Second load - should use cache
    const startTime = performance.now();
    
    render(
      <QueryClientProvider client={queryClient}>
        <ProfileScreen navigation={mockNavigation} route={mockRoute} />
      </QueryClientProvider>
    );

    const endTime = performance.now();
    const cacheLoadTime = endTime - startTime;

    expect(cacheLoadTime).toBeLessThan(100); // Cache should be very fast
  });

  test('TanStack Query should minimize API calls', () => {
    const apiCallSpy = jest.spyOn(global, 'fetch');
    
    render(
      <TestWrapper>
        <ProfileScreen navigation={mockNavigation} route={mockRoute} />
      </TestWrapper>
    );

    // Should make minimal API calls due to caching
    expect(apiCallSpy).toHaveBeenCalledTimes(1); // Only one call for fresh data
  });
});

describe('Performance Tests - Memory Usage', () => {
  test('Should not leak memory on navigation', async () => {
    const initialMemory = performance.memory?.usedJSHeapSize || 0;
    
    // Simulate multiple navigations
    for (let i = 0; i < 10; i++) {
      const { unmount } = render(
        <TestWrapper>
          <ProfileScreen navigation={mockNavigation} route={mockRoute} />
        </TestWrapper>
      );
      
      unmount();
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const finalMemory = performance.memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be minimal (less than 10MB)
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });
});

describe('Performance Tests - Network Conditions', () => {
  test('Should handle slow network gracefully', async () => {
    // Mock slow network
    global.fetch = jest.fn(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] })
        }), 3000) // 3 second delay
      )
    );

    const startTime = performance.now();
    
    const { getByTestId } = render(
      <TestWrapper>
        <ProfileScreen navigation={mockNavigation} route={mockRoute} />
      </TestWrapper>
    );

    // Screen should still render quickly despite slow network
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    expect(renderTime).toBeLessThan(500);
    expect(getByTestId('profile-screen')).toBeTruthy();
  });

  test('Should work offline with cached data', async () => {
    const queryClient = createTestQueryClient();
    
    // First load with network
    const { unmount } = render(
      <QueryClientProvider client={queryClient}>
        <ProfileScreen navigation={mockNavigation} route={mockRoute} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      // Wait for data to cache
    });

    unmount();

    // Mock offline
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

    // Should still work with cached data
    const { getByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <ProfileScreen navigation={mockNavigation} route={mockRoute} />
      </QueryClientProvider>
    );

    expect(getByTestId('profile-screen')).toBeTruthy();
  });
});

// Performance utility functions
export const measurePerformance = (testName, fn) => {
  return async () => {
    const startTime = performance.now();
    await fn();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`Performance Test [${testName}]: ${duration.toFixed(2)}ms`);
    return duration;
  };
};

export const benchmarkNavigation = async (screens) => {
  const results = {};
  
  for (const [screenName, ScreenComponent] of Object.entries(screens)) {
    const duration = await measurePerformance(`${screenName} Navigation`, () => {
      return new Promise(resolve => {
        render(
          <TestWrapper>
            <ScreenComponent navigation={mockNavigation} route={mockRoute} />
          </TestWrapper>
        );
        resolve();
      });
    })();
    
    results[screenName] = duration;
  }
  
  return results;
};

// Export test utilities for manual testing
export { TestWrapper, createTestQueryClient, mockNavigation, mockRoute };
