// File Validation Tests
// Tests for the enhanced file validation system

import { validateFile, isDangerousFile, formatFileSize, detectFileType } from '../fileValidation';

// Mock File constructor for testing
class MockFile extends File {
  constructor(parts: BlobPart[], filename: string, properties?: FilePropertyBag) {
    super(parts, filename, properties);
  }
}

describe('File Validation System', () => {
  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });
  });

  describe('isDangerousFile', () => {
    it('should detect dangerous file extensions', () => {
      expect(isDangerousFile('malware.exe')).toBe(true);
      expect(isDangerousFile('script.bat')).toBe(true);
      expect(isDangerousFile('virus.js')).toBe(true);
      expect(isDangerousFile('safe.jpg')).toBe(false);
      expect(isDangerousFile('video.mp4')).toBe(false);
    });
  });

  describe('detectFileType', () => {
    it('should detect file types from MIME types', () => {
      const imageFile = new MockFile([''], 'test.jpg', { type: 'image/jpeg' });
      const videoFile = new MockFile([''], 'test.mp4', { type: 'video/mp4' });
      const unknownFile = new MockFile([''], 'test.txt', { type: 'text/plain' });

      expect(detectFileType(imageFile)).toBe('image');
      expect(detectFileType(videoFile)).toBe('video');
      expect(detectFileType(unknownFile)).toBe('unknown');
    });
  });

  describe('validateFile', () => {
    it('should reject dangerous files', () => {
      const dangerousFile = new MockFile([''], 'malware.exe', { type: 'application/octet-stream' });
      const result = validateFile(dangerousFile, 'post');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('not allowed for security reasons');
    });

    it('should validate image files for posts', () => {
      const validImage = new MockFile(['x'.repeat(1024)], 'test.jpg', { type: 'image/jpeg' });
      const result = validateFile(validImage, 'post');
      
      expect(result.isValid).toBe(true);
      expect(result.fileInfo?.type).toBe('image');
    });

    it('should reject videos for image posts', () => {
      const videoFile = new MockFile(['x'.repeat(1024)], 'test.mp4', { type: 'video/mp4' });
      const result = validateFile(videoFile, 'post');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('only support image files');
    });

    it('should validate video files for tip-tube', () => {
      const validVideo = new MockFile(['x'.repeat(1024 * 1024)], 'test.mp4', { type: 'video/mp4' });
      const result = validateFile(validVideo, 'tip-tube');
      
      expect(result.isValid).toBe(true);
      expect(result.fileInfo?.type).toBe('video');
    });

    it('should reject oversized files', () => {
      // Create a file larger than 10MB for images
      const oversizedImage = new MockFile(['x'.repeat(11 * 1024 * 1024)], 'huge.jpg', { type: 'image/jpeg' });
      const result = validateFile(oversizedImage, 'post');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds maximum limit');
    });

    it('should reject files without extensions', () => {
      const noExtFile = new MockFile(['x'.repeat(1024)], 'noextension', { type: 'image/jpeg' });
      const result = validateFile(noExtFile, 'post');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must have a valid extension');
    });

    it('should provide warnings for large files', () => {
      // Create a large but valid video file
      const largeVideo = new MockFile(['x'.repeat(60 * 1024 * 1024)], 'large.mp4', { type: 'video/mp4' });
      const result = validateFile(largeVideo, 'tip-tube');
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.[0]).toContain('Large video files');
    });
  });
});

// Ex