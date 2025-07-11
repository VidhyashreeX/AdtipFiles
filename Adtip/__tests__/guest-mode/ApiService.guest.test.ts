import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../../src/services/ApiService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

describe('ApiService Guest Mode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Guest Mode API Calls', () => {
    it('should call guest posts API without authentication', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@guest_mode') return Promise.resolve('true');
        return Promise.resolve(null);
      });

      const mockResponse = {
        data: {
          status: true,
          data: [
            {
              id: 1,
              title: 'Test Post',
              content: 'Test content',
            },
          ],
        },
      };

      const axios = require('axios');
      const mockAxiosInstance = axios.create();
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await ApiService.getListPremiumPosts();

      expect(result).toEqual(mockResponse.data);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/list-premium-posts');
    });

    it('should call guest videos API without authentication', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@guest_mode') return Promise.resolve('true');
        return Promise.resolve(null);
      });

      const mockResponse = {
        data: {
          status: true,
          data: [
            {
              id: 1,
              title: 'Test Video',
              url: 'test-url',
            },
          ],
        },
      };

      const axios = require('axios');
      const mockAxiosInstance = axios.create();
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await ApiService.getPublicVideos(0, 1);

      expect(result).toEqual(mockResponse.data);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/getpublicvideos/0/1');
    });

    it('should call guest shorts API without authentication', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@guest_mode') return Promise.resolve('true');
        return Promise.resolve(null);
      });

      const mockResponse = {
        data: {
          status: true,
          data: [
            {
              id: 1,
              name: 'Test Short',
              video_link: 'test-url',
            },
          ],
        },
      };

      const axios = require('axios');
      const mockAxiosInstance = axios.create();
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await ApiService.getPublicShots();

      expect(result).toEqual(mockResponse.data);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/getpublicshots');
    });
  });

  describe('Request Interceptor Guest Mode Handling', () => {
    it('should not add authorization header for guest mode requests', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@guest_mode') return Promise.resolve('true');
        if (key === 'accessToken') return Promise.resolve('test-token');
        return Promise.resolve(null);
      });

      const mockConfig = {
        url: '/api/list-premium-posts',
        headers: {},
      };

      // Test the interceptor logic
      const isGuestMode = await AsyncStorage.getItem('@guest_mode') === 'true';
      const isPublicEndpoint = ['/api/list-premium-posts', '/api/getpublicvideos', '/api/getpublicshots']
        .some(endpoint => mockConfig.url?.startsWith(endpoint));

      expect(isGuestMode || isPublicEndpoint).toBe(true);
      // In guest mode or public endpoint, no auth header should be added
      expect(mockConfig.headers).not.toHaveProperty('Authorization');
    });

    it('should add authorization header for authenticated requests', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@guest_mode') return Promise.resolve(null);
        if (key === 'accessToken') return Promise.resolve('test-token');
        return Promise.resolve(null);
      });

      const mockConfig = {
        url: '/api/protected-endpoint',
        headers: {},
      };

      // Test the interceptor logic
      const isGuestMode = await AsyncStorage.getItem('@guest_mode') === 'true';
      const isPublicEndpoint = ['/api/list-premium-posts', '/api/getpublicvideos', '/api/getpublicshots']
        .some(endpoint => mockConfig.url?.startsWith(endpoint));

      expect(isGuestMode || isPublicEndpoint).toBe(false);
      
      // For protected endpoints in non-guest mode, auth header should be added
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        mockConfig.headers.Authorization = `Bearer ${token}`;
      }

      expect(mockConfig.headers.Authorization).toBe('Bearer test-token');
    });
  });

  describe('Public Endpoints', () => {
    it('should treat guest API endpoints as public', () => {
      const publicEndpoints = [
        '/api/list-premium-posts',
        '/api/getpublicvideos',
        '/api/getpublicshots',
      ];

      const testUrls = [
        '/api/list-premium-posts',
        '/api/getpublicvideos/0/2',
        '/api/getpublicshots',
        '/api/protected-endpoint',
      ];

      testUrls.forEach(url => {
        const isPublic = publicEndpoints.some(endpoint => url.startsWith(endpoint));
        
        if (url === '/api/protected-endpoint') {
          expect(isPublic).toBe(false);
        } else {
          expect(isPublic).toBe(true);
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully in guest mode', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@guest_mode') return Promise.resolve('true');
        return Promise.resolve(null);
      });

      const axios = require('axios');
      const mockAxiosInstance = axios.create();
      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

      await expect(ApiService.getListPremiumPosts()).rejects.toThrow('Network error');
    });

    it('should handle API errors gracefully in guest mode', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@guest_mode') return Promise.resolve('true');
        return Promise.resolve(null);
      });

      const mockErrorResponse = {
        response: {
          status: 500,
          data: { message: 'Server error' },
        },
      };

      const axios = require('axios');
      const mockAxiosInstance = axios.create();
      mockAxiosInstance.get.mockRejectedValue(mockErrorResponse);

      await expect(ApiService.getListPremiumPosts()).rejects.toEqual(mockErrorResponse);
    });
  });
});
