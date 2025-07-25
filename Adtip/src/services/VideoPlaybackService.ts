// adtip-reactnative/Adtip/src/services/VideoPlaybackService.ts
// Hybrid video playback service supporting both Cloudflare Stream and R2 videos
// Automatically selects optimal playback method based on video metadata

import { CLOUDFLARE_STREAM_CONFIG } from '../config/cloudflareConfig';

export interface VideoMetadata {
  id: number;
  video_link: string;
  stream_video_id?: string;
  stream_status?: 'uploading' | 'ready' | 'error' | 'inprogress';
  adaptive_manifest_url?: string;
  stream_ready_at?: string;
  isShot?: boolean;
}

export interface PlaybackOptions {
  preferStream?: boolean;
  quality?: 'auto' | '1080p' | '720p' | '480p' | '360p';
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
}

export interface PlaybackResult {
  useStreamPlayer: boolean;
  streamVideoId?: string;
  videoUrl?: string;
  hlsUrl?: string;
  quality: string;
  estimatedDataUsage: 'low' | 'medium' | 'high';
}

class VideoPlaybackService {
  private static instance: VideoPlaybackService;

  public static getInstance(): VideoPlaybackService {
    if (!VideoPlaybackService.instance) {
      VideoPlaybackService.instance = new VideoPlaybackService();
    }
    return VideoPlaybackService.instance;
  }

  /**
   * Determine optimal playback configuration for a video
   * PRIORITY: Stream-only playback with automatic fallback
   */
  public getPlaybackConfig(
    video: VideoMetadata,
    options: PlaybackOptions = {}
  ): PlaybackResult {
    const {
      preferStream = true, // Always prefer Stream
      quality = 'auto',
      autoplay = true, // Enable autoplay by default
      muted = true,
      controls = true,
    } = options;

    // Check if Stream is available and ready
    const hasStreamVideo = video.stream_video_id && video.stream_status === 'ready';

    // STREAM-FIRST APPROACH: Only use Stream if available
    if (hasStreamVideo) {
      console.log('[VideoPlaybackService] Using Cloudflare Stream (PRIORITY):', {
        videoId: video.id,
        streamVideoId: video.stream_video_id,
        streamStatus: video.stream_status,
        autoplay
      });
      return this.getStreamPlaybackConfig(video, quality);
    }

    // Fallback only if Stream is not available
    if (video.video_link) {
      console.warn('[VideoPlaybackService] Stream not available, using R2 fallback:', {
        videoId: video.id,
        streamVideoId: video.stream_video_id,
        streamStatus: video.stream_status,
        videoLink: video.video_link
      });
      return this.getR2PlaybackConfig(video, quality);
    }

    // No valid source available
    console.error('[VideoPlaybackService] No valid video source available:', {
      videoId: video.id,
      hasStreamVideo,
      hasVideoLink: !!video.video_link
    });

    throw new Error(`No valid video source for video ${video.id}`);
  }

  /**
   * Get Cloudflare Stream playback configuration
   */
  private getStreamPlaybackConfig(
    video: VideoMetadata,
    quality: string
  ): PlaybackResult {
    const streamVideoId = video.stream_video_id!;

    // Generate HLS manifest URL for adaptive streaming
    const hlsUrl = `https://customer-${CLOUDFLARE_STREAM_CONFIG.customerCode}.cloudflarestream.com/${streamVideoId}/manifest/video.m3u8`;

    // Generate direct video URL for specific quality
    const videoUrl = quality !== 'auto'
      ? `https://customer-${CLOUDFLARE_STREAM_CONFIG.customerCode}.cloudflarestream.com/${streamVideoId}/downloads/default.mp4`
      : undefined;

    console.log('[VideoPlaybackService] Generated Stream URLs:', {
      videoId: video.id,
      streamVideoId,
      hlsUrl,
      videoUrl,
      quality
    });

    return {
      useStreamPlayer: true,
      streamVideoId,
      hlsUrl,
      videoUrl,
      quality: quality === 'auto' ? 'adaptive' : quality,
      estimatedDataUsage: this.estimateDataUsage('stream', quality),
    };
  }

  /**
   * Get R2 fallback playback configuration
   */
  private getR2PlaybackConfig(
    video: VideoMetadata,
    quality: string
  ): PlaybackResult {
    console.log('[VideoPlaybackService] Using R2 fallback:', {
      videoId: video.id,
      videoUrl: video.video_link,
      quality
    });

    return {
      useStreamPlayer: false,
      videoUrl: video.video_link,
      quality: 'original',
      estimatedDataUsage: this.estimateDataUsage('r2', quality),
    };
  }

  /**
   * Estimate data usage for different playback methods
   */
  private estimateDataUsage(
    method: 'stream' | 'r2',
    quality: string
  ): 'low' | 'medium' | 'high' {
    if (method === 'stream') {
      // Stream uses adaptive bitrate, generally more efficient
      switch (quality) {
        case 'auto':
        case 'adaptive':
          return 'low'; // Adaptive streaming optimizes for connection
        case '360p':
        case '480p':
          return 'low';
        case '720p':
          return 'medium';
        case '1080p':
          return 'high';
        default:
          return 'medium';
      }
    } else {
      // R2 videos are typically full quality
      return 'high';
    }
  }

  /**
   * Get Stream player embed URL
   */
  public getStreamPlayerUrl(
    streamVideoId: string,
    options: {
      autoplay?: boolean;
      muted?: boolean;
      controls?: boolean;
      quality?: string;
    } = {}
  ): string {
    const {
      autoplay = false,
      muted = true,
      controls = true,
      quality = 'auto',
    } = options;

    const baseUrl = `https://customer-${CLOUDFLARE_STREAM_CONFIG.customerCode}.cloudflarestream.com`;
    const params = new URLSearchParams({
      autoplay: autoplay.toString(),
      muted: muted.toString(),
      controls: controls.toString(),
      preload: 'metadata',
    });

    if (quality !== 'auto') {
      params.append('defaultQuality', quality);
    }

    return `${baseUrl}/${streamVideoId}/iframe?${params.toString()}`;
  }

  /**
   * Get HLS manifest URL for react-native-video
   */
  public getHLSManifestUrl(streamVideoId: string): string {
    return `https://customer-${CLOUDFLARE_STREAM_CONFIG.customerCode}.cloudflarestream.com/${streamVideoId}/manifest/video.m3u8`;
  }

  /**
   * Get direct video URL for specific quality
   */
  public getDirectVideoUrl(
    streamVideoId: string,
    quality: string = '720p'
  ): string {
    return `https://customer-${CLOUDFLARE_STREAM_CONFIG.customerCode}.cloudflarestream.com/${streamVideoId}/downloads/default.mp4`;
  }

  /**
   * Check if video supports Stream playback
   */
  public supportsStreamPlayback(video: VideoMetadata): boolean {
    const supports = !!(
      video.stream_video_id &&
      video.stream_status === 'ready' &&
      video.stream_ready_at
    );

    console.log('[VideoPlaybackService] Stream playback support check:', {
      videoId: video.id,
      streamVideoId: video.stream_video_id,
      streamStatus: video.stream_status,
      streamReadyAt: video.stream_ready_at,
      supports
    });

    return supports;
  }

  /**
   * Validate Cloudflare Stream video ID format
   */
  public isValidStreamVideoId(streamVideoId: string): boolean {
    // Cloudflare Stream video IDs are typically 32-character hex strings
    const streamIdPattern = /^[a-f0-9]{32}$/i;
    return streamIdPattern.test(streamVideoId);
  }

  /**
   * Get debug information for video playback issues
   */
  public getDebugInfo(video: VideoMetadata): object {
    return {
      videoId: video.id,
      hasVideoLink: !!video.video_link,
      videoLinkValid: video.video_link?.includes('theadtip.in'),
      hasStreamId: !!video.stream_video_id,
      streamIdValid: video.stream_video_id ? this.isValidStreamVideoId(video.stream_video_id) : false,
      streamStatus: video.stream_status,
      streamReady: video.stream_status === 'ready',
      hasStreamReadyAt: !!video.stream_ready_at,
      supportsStream: this.supportsStreamPlayback(video),
      adaptiveManifestUrl: video.adaptive_manifest_url
    };
  }

  /**
   * Get video analytics data
   */
  public getVideoAnalytics(video: VideoMetadata): {
    hasStream: boolean;
    streamStatus?: string;
    estimatedSavings?: string;
    playbackMethod: 'stream' | 'r2';
  } {
    const hasStream = this.supportsStreamPlayback(video);
    const playbackMethod = hasStream ? 'stream' : 'r2';
    
    let estimatedSavings: string | undefined;
    if (hasStream) {
      // Stream typically saves 40-70% bandwidth
      estimatedSavings = '40-70% data savings vs direct video';
    }

    return {
      hasStream,
      streamStatus: video.stream_status,
      estimatedSavings,
      playbackMethod,
    };
  }

  /**
   * Preload video for better user experience
   */
  public async preloadVideo(video: VideoMetadata): Promise<boolean> {
    try {
      const config = this.getPlaybackConfig(video, { preferStream: true });
      
      if (config.useStreamPlayer && config.hlsUrl) {
        // For Stream videos, we can preload the manifest
        const response = await fetch(config.hlsUrl, { method: 'HEAD' });
        return response.ok;
      } else if (config.videoUrl) {
        // For R2 videos, check if the video is accessible
        const response = await fetch(config.videoUrl, { method: 'HEAD' });
        return response.ok;
      }
      
      return false;
    } catch (error) {
      console.warn('[VideoPlaybackService] Preload failed:', error);
      return false;
    }
  }

  /**
   * Get recommended quality based on network conditions
   */
  public getRecommendedQuality(
    networkType: 'wifi' | 'cellular' | 'unknown' = 'unknown'
  ): string {
    switch (networkType) {
      case 'wifi':
        return 'auto'; // Let adaptive streaming handle it
      case 'cellular':
        return '480p'; // Conservative for mobile data
      default:
        return 'auto';
    }
  }

  /**
   * Log playback analytics
   */
  public logPlaybackEvent(
    video: VideoMetadata,
    event: 'start' | 'complete' | 'error',
    config: PlaybackResult,
    additionalData?: any
  ): void {
    const analytics = {
      videoId: video.id,
      event,
      playbackMethod: config.useStreamPlayer ? 'stream' : 'r2',
      quality: config.quality,
      estimatedDataUsage: config.estimatedDataUsage,
      hasStreamVideo: !!video.stream_video_id,
      streamStatus: video.stream_status,
      timestamp: new Date().toISOString(),
      ...additionalData,
    };

    console.log('[VideoPlaybackService] Analytics:', analytics);
    
    // Here you could send analytics to your backend
    // this.sendAnalytics(analytics);
  }
}

export default VideoPlaybackService;
