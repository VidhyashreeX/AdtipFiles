import { NativeModules } from 'react-native';

let ExoPlayerPreloader: any = null;

try {
  ExoPlayerPreloader = NativeModules.ExoPlayerPreloader;
} catch (error) {
  console.warn('ExoPlayer preloader not available');
}

interface PreloadedVideo {
  id: string;
  url: string;
  preloadedAt: number;
}

class VideoPreloaderService {
  private static instance: VideoPreloaderService;
  private preloadedVideos = new Map<string, PreloadedVideo>();
  private maxCacheSize = 3; // Maximum number of videos to keep preloaded
  private preloadTimeoutMs = 30000; // 30 seconds timeout for preloaded videos

  private constructor() {}

  public static getInstance(): VideoPreloaderService {
    if (!VideoPreloaderService.instance) {
      VideoPreloaderService.instance = new VideoPreloaderService();
    }
    return VideoPreloaderService.instance;
  }

  /**
   * Preload a video with smart caching
   */
  public async preloadVideo(videoId: string, videoUrl: string): Promise<boolean> {
    if (!ExoPlayerPreloader || !videoUrl || this.preloadedVideos.has(videoId)) {
      return false;
    }

    try {
      console.log(`[VideoPreloader] Starting preload for video: ${videoId}`);
      
      // Clean up old preloaded videos before adding new ones
      this.cleanupOldPreloads();

      // Preload the video
      await ExoPlayerPreloader.preloadVideo(videoUrl);
      
      // Track the preloaded video
      this.preloadedVideos.set(videoId, {
        id: videoId,
        url: videoUrl,
        preloadedAt: Date.now()
      });

      console.log(`[VideoPreloader] Successfully preloaded video: ${videoId}`);
      return true;
    } catch (error) {
      console.warn(`[VideoPreloader] Failed to preload video ${videoId}:`, error);
      return false;
    }
  }

  /**
   * Preload next video after current starts playing
   */
  public preloadNextVideo(currentIndex: number, videos: Array<{ id: string; videoUrl: string }>): void {
    const nextVideo = videos[currentIndex + 1];
    if (nextVideo && !this.preloadedVideos.has(nextVideo.id)) {
      // Use setTimeout to preload after current video starts playing
      setTimeout(() => {
        this.preloadVideo(nextVideo.id, nextVideo.videoUrl);
      }, 1000); // Delay 1 second after current video starts
    }
  }

  /**
   * Clean up old preloaded videos to save memory
   */
  private cleanupOldPreloads(): void {
    const now = Date.now();
    const videosToRemove: string[] = [];

    // Remove videos that are too old or exceed cache size
    const sortedVideos = Array.from(this.preloadedVideos.values())
      .sort((a, b) => b.preloadedAt - a.preloadedAt);

    sortedVideos.forEach((video, index) => {
      const isOld = now - video.preloadedAt > this.preloadTimeoutMs;
      const exceedsCache = index >= this.maxCacheSize;
      
      if (isOld || exceedsCache) {
        videosToRemove.push(video.id);
      }
    });

    // Remove old videos
    videosToRemove.forEach(videoId => {
      this.releaseVideo(videoId);
    });
  }

  /**
   * Release a specific video from cache
   */
  public releaseVideo(videoId: string): void {
    const video = this.preloadedVideos.get(videoId);
    if (video && ExoPlayerPreloader?.releaseVideo) {
      try {
        ExoPlayerPreloader.releaseVideo(video.url);
        this.preloadedVideos.delete(videoId);
        console.log(`[VideoPreloader] Released video: ${videoId}`);
      } catch (error) {
        console.warn(`[VideoPreloader] Failed to release video ${videoId}:`, error);
      }
    }
  }

  /**
   * Check if video is preloaded
   */
  public isVideoPreloaded(videoId: string): boolean {
    return this.preloadedVideos.has(videoId);
  }

  /**
   * Clear all preloaded videos
   */
  public clearAll(): void {
    this.preloadedVideos.forEach((video, videoId) => {
      this.releaseVideo(videoId);
    });
    this.preloadedVideos.clear();
    console.log('[VideoPreloader] Cleared all preloaded videos');
  }

  /**
   * Get cache info for debugging
   */
  public getCacheInfo(): { count: number; videos: string[] } {
    return {
      count: this.preloadedVideos.size,
      videos: Array.from(this.preloadedVideos.keys())
    };
  }
}

export default VideoPreloaderService;