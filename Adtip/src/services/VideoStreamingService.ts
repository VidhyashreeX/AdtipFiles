// adtip-reactnative/Adtip/src/services/VideoStreamingService.ts
// Enhanced Video Streaming Service with comprehensive error handling and optimization
// Fixes for buffering, connectivity, playback, and performance issues

import { CLOUDFLARE_STREAM_CONFIG } from '../config/cloudflareConfig';
import { Logger } from '../utils/ProductionLogger';
import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export interface VideoQualitySettings {
  bitrate: number;
  resolution: string;
  label: string;
  bufferSize: number;
}

export interface StreamingOptions {
  quality?: 'auto' | 'high' | 'medium' | 'low';
  enableAdaptiveBitrate?: boolean;
  maxRetries?: number;
  bufferTimeout?: number;
  preloadDistance?: number;
}

export interface NetworkMetrics {
  effectiveType: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

class VideoStreamingService {
  private static instance: VideoStreamingService;
  private networkMetrics: NetworkMetrics | null = null;
  private currentQuality: VideoQualitySettings | null = null;
  private retryAttempts = new Map<string, number>();
  private streamCache = new Map<string, any>();
  private preloadQueue: string[] = [];

  // Quality presets optimized for mobile data
  private readonly qualityPresets: Record<string, VideoQualitySettings> = {
    high: {
      bitrate: 2000000, // 2 Mbps
      resolution: '720p',
      label: 'High Quality',
      bufferSize: 8000,
    },
    medium: {
      bitrate: 1200000, // 1.2 Mbps
      resolution: '480p',
      label: 'Standard Quality',
      bufferSize: 5000,
    },
    low: {
      bitrate: 600000, // 600 Kbps
      resolution: '360p',
      label: 'Data Saver',
      bufferSize: 3000,
    },
    auto: {
      bitrate: 0, // Will be determined automatically
      resolution: 'auto',
      label: 'Auto Quality',
      bufferSize: 5000,
    },
  };

  public static getInstance(): VideoStreamingService {
    if (!VideoStreamingService.instance) {
      VideoStreamingService.instance = new VideoStreamingService();
    }
    return VideoStreamingService.instance;
  }

  constructor() {
    this.initializeNetworkMonitoring();
  }

  /**
   * Initialize network monitoring for adaptive streaming
   */
  private async initializeNetworkMonitoring(): Promise<void> {
    try {
      // Monitor network changes
      NetInfo.addEventListener(state => {
        this.networkMetrics = {
          effectiveType: state.type,
          downlink: (state.details as any)?.downlink,
          rtt: (state.details as any)?.rtt,
          saveData: (state.details as any)?.saveData,
        };

        Logger.debug('VideoStreamingService', 'Network state updated:', this.networkMetrics);
        this.adjustQualityBasedOnNetwork();
      });

      // Get initial network state
      const netState = await NetInfo.fetch();
      this.networkMetrics = {
        effectiveType: netState.type,
        downlink: (netState.details as any)?.downlink,
        rtt: (netState.details as any)?.rtt,
        saveData: (netState.details as any)?.saveData,
      };
    } catch (error) {
      Logger.error('VideoStreamingService', 'Failed to initialize network monitoring:', error);
    }
  }

  /**
   * Get optimal video configuration based on network and device capabilities
   */
  public getOptimalVideoConfig(videoId: string, options: StreamingOptions = {}): any {
    const {
      quality = 'auto',
      enableAdaptiveBitrate = true,
      maxRetries = 3,
      bufferTimeout = 30000,
      preloadDistance = 2,
    } = options;

    const optimalQuality = this.getOptimalQuality(quality);
    const bufferConfig = this.getOptimalBufferConfig(optimalQuality);
    const networkConfig = this.getNetworkOptimizedConfig();

    return {
      // Video source configuration
      source: this.getOptimalVideoSource(videoId),
      
      // Quality settings
      quality: optimalQuality,
      resizeMode: 'cover',
      
      // Buffer configuration for smooth playback
      bufferConfig: {
        ...bufferConfig,
        // Adaptive buffering based on network
        minBufferMs: networkConfig.isSlowNetwork ? 3000 : 1500,
        maxBufferMs: networkConfig.isSlowNetwork ? 8000 : optimalQuality.bufferSize,
        bufferForPlaybackMs: networkConfig.isSlowNetwork ? 2000 : 1000,
        bufferForPlaybackAfterRebufferMs: networkConfig.isSlowNetwork ? 3000 : 2000,
      },
      
      // Playback settings
      playback: {
        maxRetries,
        bufferTimeout,
        preloadDistance,
        enableAdaptiveBitrate: enableAdaptiveBitrate && networkConfig.supportsAdaptive,
        playInBackground: false,
        playWhenInactive: false,
        ignoreSilentSwitch: 'ignore',
        preventsDisplaySleepDuringVideoPlayback: false,
      },
      
      // Error recovery settings
      errorRecovery: {
        enableAutomaticRetry: true,
        retryDelay: networkConfig.isSlowNetwork ? 3000 : 1500,
        maxRetryAttempts: maxRetries,
        fallbackToLowerQuality: true,
      },
      
      // Performance optimizations
      performance: {
        reportBandwidth: enableAdaptiveBitrate,
        useTextureView: true, // Better performance on Android
        enableHardwareAcceleration: true,
        maxBitRate: optimalQuality.bitrate,
      },
    };
  }

  /**
   * Determine optimal video quality based on network conditions
   */
  private getOptimalQuality(requestedQuality: string): VideoQualitySettings {
    if (requestedQuality !== 'auto') {
      return this.qualityPresets[requestedQuality] || this.qualityPresets.medium;
    }

    // Auto-select based on network
    if (!this.networkMetrics) {
      return this.qualityPresets.medium;
    }

    const { effectiveType, downlink, saveData } = this.networkMetrics;

    // Data saver mode
    if (saveData) {
      return this.qualityPresets.low;
    }

    // Network-based selection
    switch (effectiveType) {
      case 'wifi':
        return downlink && downlink > 10 ? this.qualityPresets.high : this.qualityPresets.medium;
      
      case '4g':
        return downlink && downlink > 5 ? this.qualityPresets.medium : this.qualityPresets.low;
      
      case '3g':
      case '2g':
      case 'cellular':
        return this.qualityPresets.low;
      
      default:
        return this.qualityPresets.medium;
    }
  }

  /**
   * Get network-optimized configuration
   */
  private getNetworkOptimizedConfig() {
    if (!this.networkMetrics) {
      return {
        isSlowNetwork: false,
        supportsAdaptive: true,
        recommendedPreload: 2,
      };
    }

    const isSlowNetwork = this.networkMetrics.effectiveType === '2g' || 
                         this.networkMetrics.effectiveType === '3g' ||
                         (this.networkMetrics.downlink && this.networkMetrics.downlink < 2);

    return {
      isSlowNetwork,
      supportsAdaptive: !isSlowNetwork,
      recommendedPreload: isSlowNetwork ? 1 : 2,
    };
  }

  /**
   * Get optimal buffer configuration
   */
  private getOptimalBufferConfig(quality: VideoQualitySettings) {
    const baseConfig = {
      minBufferMs: 1500,
      maxBufferMs: quality.bufferSize,
      bufferForPlaybackMs: 1000,
      bufferForPlaybackAfterRebufferMs: 2000,
    };

    // Adjust for network conditions
    if (this.networkMetrics?.saveData) {
      return {
        ...baseConfig,
        minBufferMs: 1000,
        maxBufferMs: 3000,
        bufferForPlaybackMs: 500,
        bufferForPlaybackAfterRebufferMs: 1000,
      };
    }

    return baseConfig;
  }

  /**
   * Get optimal video source with fallback logic
   */
  private getOptimalVideoSource(videoId: string): any {
    // Check cache first
    const cachedSource = this.streamCache.get(videoId);
    if (cachedSource) {
      return cachedSource;
    }

    // For now, return the video ID - this will be enhanced based on stream availability
    return { videoId };
  }

  /**
   * Handle video streaming errors with intelligent retry logic
   */
  public async handleStreamingError(
    videoId: string, 
    error: any, 
    currentAttempt: number = 0
  ): Promise<{ shouldRetry: boolean; nextAction: string; config?: any }> {
    Logger.error('VideoStreamingService', `Streaming error for video ${videoId}:`, error);

    const maxRetries = 3;
    const retryCount = this.retryAttempts.get(videoId) || 0;

    // Reset retry count if this is the first attempt
    if (currentAttempt === 0) {
      this.retryAttempts.set(videoId, 0);
    }

    // Check if we've exceeded max retries
    if (retryCount >= maxRetries) {
      this.retryAttempts.delete(videoId);
      return {
        shouldRetry: false,
        nextAction: 'show_error',
      };
    }

    // Analyze error type and determine response
    const errorAnalysis = this.analyzeStreamingError(error);
    
    switch (errorAnalysis.type) {
      case 'network_timeout':
      case 'connection_lost':
        // Wait for network to recover, then retry with lower quality
        await this.waitForNetworkRecovery();
        return {
          shouldRetry: true,
          nextAction: 'retry_with_lower_quality',
          config: this.getOptimalVideoConfig(videoId, { quality: 'low' }),
        };

      case 'buffer_underrun':
        // Increase buffer size and retry
        return {
          shouldRetry: true,
          nextAction: 'retry_with_larger_buffer',
          config: this.getOptimalVideoConfig(videoId, { 
            quality: this.currentQuality?.label === 'High Quality' ? 'medium' : 'low' 
          }),
        };

      case 'codec_error':
      case 'playback_error':
        // Try alternative format or fallback
        return {
          shouldRetry: true,
          nextAction: 'retry_with_fallback',
        };

      default:
        // Generic retry with exponential backoff
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        this.retryAttempts.set(videoId, retryCount + 1);
        return {
          shouldRetry: true,
          nextAction: 'retry_current_config',
        };
    }
  }

  /**
   * Analyze streaming error to determine appropriate response
   */
  private analyzeStreamingError(error: any): { type: string; severity: 'low' | 'medium' | 'high' } {
    const errorMsg = error?.message?.toLowerCase() || error?.toString()?.toLowerCase() || '';

    if (errorMsg.includes('timeout') || errorMsg.includes('network')) {
      return { type: 'network_timeout', severity: 'medium' };
    }

    if (errorMsg.includes('buffer') || errorMsg.includes('underrun')) {
      return { type: 'buffer_underrun', severity: 'medium' };
    }

    if (errorMsg.includes('codec') || errorMsg.includes('format')) {
      return { type: 'codec_error', severity: 'high' };
    }

    if (errorMsg.includes('connection') || errorMsg.includes('lost')) {
      return { type: 'connection_lost', severity: 'high' };
    }

    return { type: 'unknown_error', severity: 'medium' };
  }

  /**
   * Wait for network recovery before retrying
   */
  private async waitForNetworkRecovery(maxWait: number = 10000): Promise<void> {
    return new Promise((resolve) => {
      const checkNetwork = async () => {
        const netState = await NetInfo.fetch();
        if (netState.isConnected && netState.isInternetReachable) {
          resolve();
        }
      };

      // Check immediately
      checkNetwork();

      // Set timeout to prevent infinite waiting
      setTimeout(resolve, maxWait);

      // Monitor network state changes
      const unsubscribe = NetInfo.addEventListener((state) => {
        if (state.isConnected && state.isInternetReachable) {
          unsubscribe();
          resolve();
        }
      });
    });
  }

  /**
   * Adjust video quality based on current network conditions
   */
  private adjustQualityBasedOnNetwork(): void {
    if (!this.networkMetrics) return;

    const optimalQuality = this.getOptimalQuality('auto');
    
    if (this.currentQuality?.bitrate !== optimalQuality.bitrate) {
      this.currentQuality = optimalQuality;
      Logger.debug('VideoStreamingService', 'Quality adjusted for network:', {
        quality: optimalQuality.label,
        network: this.networkMetrics.effectiveType,
        bitrate: optimalQuality.bitrate,
      });
    }
  }

  /**
   * Preload videos for smooth playback
   */
  public preloadVideos(videoIds: string[], priority: 'high' | 'low' = 'low'): void {
    if (priority === 'high') {
      // Add to front of queue
      this.preloadQueue.unshift(...videoIds);
    } else {
      // Add to end of queue
      this.preloadQueue.push(...videoIds);
    }

    // Process preload queue
    this.processPreloadQueue();
  }

  /**
   * Process video preload queue
   */
  private processPreloadQueue(): void {
    // Only preload on WiFi or good 4G to save data
    if (!this.networkMetrics || 
        (this.networkMetrics.effectiveType !== 'wifi' && 
         this.networkMetrics.effectiveType !== '4g')) {
      return;
    }

    // Process next video in queue
    const videoId = this.preloadQueue.shift();
    if (videoId && !this.streamCache.has(videoId)) {
      // Implement preloading logic here
      Logger.debug('VideoStreamingService', 'Preloading video:', videoId);
    }
  }

  /**
   * Clear streaming cache and reset state
   */
  public clearCache(): void {
    this.streamCache.clear();
    this.retryAttempts.clear();
    this.preloadQueue.length = 0;
    Logger.debug('VideoStreamingService', 'Cache cleared');
  }

  /**
   * Get current streaming statistics
   */
  public getStreamingStats(): any {
    return {
      networkType: this.networkMetrics?.effectiveType || 'unknown',
      currentQuality: this.currentQuality?.label || 'auto',
      cacheSize: this.streamCache.size,
      preloadQueueSize: this.preloadQueue.length,
      activeRetries: this.retryAttempts.size,
    };
  }
}

export default VideoStreamingService;