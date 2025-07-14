// src/utils/__tests__/mediaUtils.test.ts
// Test file for media URL processing and Cloudflare presigned URL generation

import { isCloudflareUrl, getSecureMediaUrl, validateAndFixVideoUrl } from '../mediaUtils';

// Mock CloudflareUploadService
jest.mock('../../services/CloudflareUploadService', () => ({
  generatePresignedUrlFromPublicUrl: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
}));

describe('MediaUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isCloudflareUrl', () => {
    it('should detect Cloudflare R2 URLs correctly', () => {
      const cloudflareUrl = 'https://94e2ffe1e7d5daf0d3de8d11c55dd2d6.r2.cloudflarestorage.com/videos/test.mp4';
      expect(isCloudflareUrl(cloudflareUrl)).toBe(true);
    });

    it('should detect generic R2 URLs', () => {
      const r2Url = 'https://example.r2.cloudflarestorage.com/videos/test.mp4';
      expect(isCloudflareUrl(r2Url)).toBe(true);
    });

    it('should not detect non-Cloudflare URLs', () => {
      const regularUrl = 'https://example.com/videos/test.mp4';
      expect(isCloudflareUrl(regularUrl)).toBe(false);
    });

    it('should handle invalid URLs gracefully', () => {
      expect(isCloudflareUrl('invalid-url')).toBe(false);
    });
  });

  describe('getSecureMediaUrl', () => {
    const CloudflareUploadService = require('../../services/CloudflareUploadService');

    it('should generate presigned URL for Cloudflare URLs', async () => {
      const cloudflareUrl = 'https://94e2ffe1e7d5daf0d3de8d11c55dd2d6.r2.cloudflarestorage.com/videos/test.mp4';
      const presignedUrl = 'https://presigned-url.com/test.mp4?signature=abc123';
      
      CloudflareUploadService.generatePresignedUrlFromPublicUrl.mockResolvedValue(presignedUrl);

      const result = await getSecureMediaUrl(cloudflareUrl);
      
      expect(CloudflareUploadService.generatePresignedUrlFromPublicUrl).toHaveBeenCalledWith(cloudflareUrl);
      expect(result).toBe(presignedUrl);
    });

    it('should return original URL if presigned URL generation fails', async () => {
      const cloudflareUrl = 'https://94e2ffe1e7d5daf0d3de8d11c55dd2d6.r2.cloudflarestorage.com/videos/test.mp4';
      
      CloudflareUploadService.generatePresignedUrlFromPublicUrl.mockResolvedValue(null);

      const result = await getSecureMediaUrl(cloudflareUrl);
      
      expect(result).toBe(cloudflareUrl);
    });

    it('should handle non-Cloudflare URLs normally', async () => {
      const regularUrl = 'https://example.com/videos/test.mp4';
      
      const result = await getSecureMediaUrl(regularUrl);
      
      expect(CloudflareUploadService.generatePresignedUrlFromPublicUrl).not.toHaveBeenCalled();
      expect(result).toBe(regularUrl);
    });

    it('should handle null/undefined URLs', async () => {
      expect(await getSecureMediaUrl(null)).toBeUndefined();
      expect(await getSecureMediaUrl(undefined)).toBeUndefined();
      expect(await getSecureMediaUrl('null')).toBeUndefined();
      expect(await getSecureMediaUrl('undefined')).toBeUndefined();
    });
  });

  describe('validateAndFixVideoUrl', () => {
    const CloudflareUploadService = require('../../services/CloudflareUploadService');

    it('should generate presigned URL for Cloudflare video URLs', async () => {
      const cloudflareUrl = 'https://94e2ffe1e7d5daf0d3de8d11c55dd2d6.r2.cloudflarestorage.com/videos/test.mp4';
      const presignedUrl = 'https://presigned-url.com/test.mp4?signature=abc123';
      
      CloudflareUploadService.generatePresignedUrlFromPublicUrl.mockResolvedValue(presignedUrl);

      const result = await validateAndFixVideoUrl(cloudflareUrl);
      
      expect(CloudflareUploadService.generatePresignedUrlFromPublicUrl).toHaveBeenCalledWith(cloudflareUrl);
      expect(result).toBe(presignedUrl);
    });

    it('should handle regular video URLs normally', async () => {
      const regularUrl = 'https://example.com/videos/test.mp4';
      
      const result = await validateAndFixVideoUrl(regularUrl);
      
      expect(CloudflareUploadService.generatePresignedUrlFromPublicUrl).not.toHaveBeenCalled();
      expect(result).toBe(regularUrl);
    });

    it('should handle invalid URLs', async () => {
      expect(await validateAndFixVideoUrl(null)).toBeNull();
      expect(await validateAndFixVideoUrl(undefined)).toBeNull();
      expect(await validateAndFixVideoUrl('invalid-url')).toBeNull();
    });
  });
});
