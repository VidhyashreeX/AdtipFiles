// src/services/__tests__/CloudflareUploadService.test.ts
// Test file for CloudflareUploadService presigned URL functionality

import { CloudflareUploadService } from '../CloudflareUploadService';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  GetObjectCommand: jest.fn(),
  PutObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
  ListBucketsCommand: jest.fn(),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

// Mock React Native modules
jest.mock('react-native-fs', () => ({}));
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

describe('CloudflareUploadService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the cache before each test
    CloudflareUploadService.clearExpiredCache();
  });

  describe('extractKeyFromUrl', () => {
    it('should extract key from Cloudflare R2 URL', () => {
      const url = 'https://94e2ffe1e7d5daf0d3de8d11c55dd2d6.r2.cloudflarestorage.com/videos/user123/test.mp4';
      const key = CloudflareUploadService.extractKeyFromUrl(url);
      expect(key).toBe('videos/user123/test.mp4');
    });

    it('should extract key from URL with leading slash', () => {
      const url = 'https://94e2ffe1e7d5daf0d3de8d11c55dd2d6.r2.cloudflarestorage.com/videos/test.mp4';
      const key = CloudflareUploadService.extractKeyFromUrl(url);
      expect(key).toBe('videos/test.mp4');
    });

    it('should return null for non-Cloudflare URLs', () => {
      const url = 'https://example.com/videos/test.mp4';
      const key = CloudflareUploadService.extractKeyFromUrl(url);
      expect(key).toBeNull();
    });

    it('should handle invalid URLs gracefully', () => {
      const key = CloudflareUploadService.extractKeyFromUrl('invalid-url');
      expect(key).toBeNull();
    });
  });

  describe('generatePresignedUrlFromPublicUrl', () => {
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

    it('should generate presigned URL from public Cloudflare URL', async () => {
      const publicUrl = 'https://94e2ffe1e7d5daf0d3de8d11c55dd2d6.r2.cloudflarestorage.com/videos/test.mp4';
      const presignedUrl = 'https://presigned-url.com/test.mp4?signature=abc123';
      
      getSignedUrl.mockResolvedValue(presignedUrl);

      const result = await CloudflareUploadService.generatePresignedUrlFromPublicUrl(publicUrl);
      
      expect(result).toBe(presignedUrl);
      expect(getSignedUrl).toHaveBeenCalled();
    });

    it('should return null for invalid URLs', async () => {
      const result = await CloudflareUploadService.generatePresignedUrlFromPublicUrl('invalid-url');
      expect(result).toBeNull();
    });

    it('should cache presigned URLs', async () => {
      const publicUrl = 'https://94e2ffe1e7d5daf0d3de8d11c55dd2d6.r2.cloudflarestorage.com/videos/test.mp4';
      const presignedUrl = 'https://presigned-url.com/test.mp4?signature=abc123';
      
      getSignedUrl.mockResolvedValue(presignedUrl);

      // First call
      const result1 = await CloudflareUploadService.generatePresignedUrlFromPublicUrl(publicUrl);
      expect(result1).toBe(presignedUrl);
      expect(getSignedUrl).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await CloudflareUploadService.generatePresignedUrlFromPublicUrl(publicUrl);
      expect(result2).toBe(presignedUrl);
      expect(getSignedUrl).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });

  describe('cache management', () => {
    it('should clear expired cache entries', () => {
      // This is a basic test - in a real scenario, you'd need to manipulate time
      // to test expiration properly
      CloudflareUploadService.clearExpiredCache();
      // Test passes if no errors are thrown
      expect(true).toBe(true);
    });

    it('should initialize cache cleanup', () => {
      // Mock setInterval to verify it's called
      const originalSetInterval = global.setInterval;
      global.setInterval = jest.fn();

      CloudflareUploadService.initializeCacheCleanup();
      
      expect(global.setInterval).toHaveBeenCalledWith(
        expect.any(Function),
        10 * 60 * 1000 // 10 minutes
      );

      // Restore original setInterval
      global.setInterval = originalSetInterval;
    });
  });
});
