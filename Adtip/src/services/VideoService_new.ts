// src/services/VideoService.ts
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

// Constants
const VIDEO_CACHE_DIR = `${RNFS.CachesDirectoryPath}/video-cache`;

// Ensure directory exists
const ensureCacheDirectory = async (): Promise<void> => {
  const exists = await RNFS.exists(VIDEO_CACHE_DIR);
  if (!exists) {
    await RNFS.mkdir(VIDEO_CACHE_DIR);
  }
};

/**
 * VideoService - Handles video playback, caching, and management
 */
export default class VideoService {
  /**
   * Download and cache a video for offline playback
   * @param videoUrl - The remote URL of the video
   * @returns - The local file path to the cached video
   */
  static async cacheVideo(videoUrl: string): Promise<string> {
    try {
      await ensureCacheDirectory();

      // Generate a filename based on the URL
      const filename = VideoService.getFileNameFromUrl(videoUrl);
      const localFilePath = `${VIDEO_CACHE_DIR}/${filename}`;

      // Check if the file already exists in cache
      const fileExists = await RNFS.exists(localFilePath);

      // If file exists, return the cached path
      if (fileExists) {
        console.log('Video already cached:', localFilePath);
        return localFilePath;
      }

      // Otherwise download the file
      const result = await RNFS.downloadFile({
        fromUrl: videoUrl,
        toFile: localFilePath,
        background: true,
        discretionary: true,
        progress: (res) => {
          const progressPercent = (res.bytesWritten / res.contentLength) * 100;
          console.log(`Downloading ${Math.round(progressPercent)}%`);
        },
      }).promise;

      if (result.statusCode === 200) {
        console.log('Video cached successfully:', localFilePath);
        return localFilePath;
      } else {
        throw new Error(`Download failed with status ${result.statusCode}`);
      }
    } catch (error) {
      console.error('Error caching video:', error);
      // Return original URL if caching fails
      return videoUrl;
    }
  }

  /**
   * Check if a video is already cached
   * @param videoUrl - The remote URL of the video
   * @returns - True if the video is cached
   */
  static async isVideoCached(videoUrl: string): Promise<boolean> {
    try {
      await ensureCacheDirectory();

      const filename = VideoService.getFileNameFromUrl(videoUrl);
      const localFilePath = `${VIDEO_CACHE_DIR}/${filename}`;

      return await RNFS.exists(localFilePath);
    } catch (error) {
      console.error('Error checking if video is cached:', error);
      return false;
    }
  }

  /**
   * Get the local path for a cached video
   * @param videoUrl - The remote URL of the video
   * @returns - The local file path if cached, null otherwise
   */
  static async getCachedVideoPath(videoUrl: string): Promise<string | null> {
    try {
      const isCached = await VideoService.isVideoCached(videoUrl);
      if (isCached) {
        const filename = VideoService.getFileNameFromUrl(videoUrl);
        return `${VIDEO_CACHE_DIR}/${filename}`;
      }
      return null;
    } catch (error) {
      console.error('Error getting cached video path:', error);
      return null;
    }
  }

  /**
   * Clear the entire video cache
   */
  static async clearVideoCache(): Promise<void> {
    try {
      await ensureCacheDirectory();

      // Remove the cache directory and recreate it
      await RNFS.unlink(VIDEO_CACHE_DIR);
      await RNFS.mkdir(VIDEO_CACHE_DIR);
      
      console.log('Video cache cleared successfully');
    } catch (error) {
      console.error('Error clearing video cache:', error);
    }
  }

  /**
   * Get the cache size of all videos
   * @returns - The size in bytes
   */
  static async getVideoCacheSize(): Promise<number> {
    try {
      await ensureCacheDirectory();

      let totalSize = 0;
      const files = await RNFS.readdir(VIDEO_CACHE_DIR);
      
      for (const file of files) {
        const filePath = `${VIDEO_CACHE_DIR}/${file}`;
        const stat = await RNFS.stat(filePath);
        totalSize += stat.size;
      }
      
      return totalSize;
    } catch (error) {
      console.error('Error getting video cache size:', error);
      return 0;
    }
  }

  /**
   * Generate a filename from a URL
   * @param url - The remote URL
   * @returns - A filename based on the URL
   */
  private static getFileNameFromUrl(url: string): string {
    // Extract filename from URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const filenameWithParams = pathParts[pathParts.length - 1];
    
    // Strip query parameters if they exist
    const filename = filenameWithParams.split('?')[0];
    
    // If we couldn't extract a filename, generate a hash
    if (!filename || filename === '') {
      // Simple hash function
      let hash = 0;
      for (let i = 0; i < url.length; i++) {
        const char = url.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return `video-${Math.abs(hash)}.mp4`;
    }
    
    return filename;
  }
}
