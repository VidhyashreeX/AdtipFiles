// src/services/ImageCacheService.ts - Comprehensive image caching and optimization service

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, PixelRatio, Dimensions } from 'react-native';
import { Logger } from '../utils/ProductionLogger';

// Image cache configuration
interface ImageCacheConfig {
  maxCacheSize: number; // Max cache size in MB
  defaultQuality: number; // Image quality (0.1 - 1.0)
  enableResize: boolean; // Enable automatic resizing
  enableWebP: boolean; // Enable WebP format for supported platforms
  cacheExpiration: number; // Cache expiration in milliseconds
}

interface CachedImage {
  uri: string;
  localPath?: string;
  size: number;
  timestamp: number;
  quality: number;
  dimensions?: { width: number; height: number };
}

interface ImageMetrics {
  cacheHits: number;
  cacheMisses: number;
  cacheSize: number;
  optimizationSavings: number;
}

class ImageCacheService {
  private static instance: ImageCacheService;
  private cache = new Map<string, CachedImage>();
  private config: ImageCacheConfig;
  private metrics: ImageMetrics;
  private readonly CACHE_KEY = '@ImageCache:';
  private readonly METRICS_KEY = '@ImageCache:metrics';
  private readonly screenWidth = Dimensions.get('window').width;
  private readonly pixelRatio = PixelRatio.get();
  private isInitialized = false;

  private constructor() {
    this.config = {
      maxCacheSize: 50, // 50MB default
      defaultQuality: 0.8,
      enableResize: true,
      enableWebP: Platform.OS === 'android', // WebP support mainly on Android
      cacheExpiration: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      cacheSize: 0,
      optimizationSavings: 0,
    };
  }

  static getInstance(): ImageCacheService {
    if (!ImageCacheService.instance) {
      ImageCacheService.instance = new ImageCacheService();
    }
    return ImageCacheService.instance;
  }

  /**
   * Initialize the cache service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load cache from storage
      await this.loadCacheFromStorage();
      
      // Load metrics
      await this.loadMetrics();
      
      // Clean expired cache entries
      await this.cleanExpiredCache();
      
      this.isInitialized = true;
      Logger.info('ImageCacheService', 'Initialized successfully');
    } catch (error) {
      Logger.error('ImageCacheService', 'Failed to initialize:', error);
    }
  }

  /**
   * Get optimized image URL with caching
   */
  async getOptimizedImageUrl(
    originalUrl: string,
    targetWidth?: number,
    targetHeight?: number,
    quality?: number
  ): Promise<string> {
    if (!originalUrl) return '';

    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(originalUrl, targetWidth, targetHeight, quality);
      
      // Check if image is cached
      const cachedImage = this.cache.get(cacheKey);
      if (cachedImage && this.isCacheValid(cachedImage)) {
        this.metrics.cacheHits++;
        Logger.debug('ImageCacheService', `Cache hit for: ${originalUrl}`);
        return cachedImage.localPath || originalUrl;
      }

      // Cache miss - process and cache the image
      this.metrics.cacheMisses++;
      const optimizedUrl = await this.processAndCacheImage(
        originalUrl,
        cacheKey,
        targetWidth,
        targetHeight,
        quality
      );

      return optimizedUrl;
    } catch (error) {
      Logger.error('ImageCacheService', `Failed to get optimized image for ${originalUrl}:`, error);
      return originalUrl; // Fallback to original URL
    }
  }

  /**
   * Process and cache image
   */
  private async processAndCacheImage(
    originalUrl: string,
    cacheKey: string,
    targetWidth?: number,
    targetHeight?: number,
    quality = this.config.defaultQuality
  ): Promise<string> {
    try {
      // Calculate optimal dimensions
      const optimizedDimensions = this.calculateOptimalDimensions(
        targetWidth,
        targetHeight
      );

      // Generate optimized URL (for CDN-based optimization)
      const optimizedUrl = this.generateOptimizedUrl(
        originalUrl,
        optimizedDimensions.width,
        optimizedDimensions.height,
        quality
      );

      // Cache the image metadata
      const cachedImage: CachedImage = {
        uri: optimizedUrl,
        size: 0, // Will be updated after download
        timestamp: Date.now(),
        quality,
        dimensions: optimizedDimensions,
      };

      this.cache.set(cacheKey, cachedImage);
      await this.saveCacheToStorage();

      Logger.debug('ImageCacheService', `Cached image: ${originalUrl}`);
      return optimizedUrl;
    } catch (error) {
      Logger.error('ImageCacheService', `Failed to process image ${originalUrl}:`, error);
      return originalUrl;
    }
  }

  /**
   * Calculate optimal dimensions based on screen size and pixel ratio
   */
  private calculateOptimalDimensions(
    targetWidth?: number,
    targetHeight?: number
  ): { width: number; height: number } {
    const maxWidth = targetWidth || this.screenWidth;
    const maxHeight = targetHeight || this.screenWidth; // Square by default

    // Adjust for pixel ratio but cap at 2x for performance
    const effectivePixelRatio = Math.min(this.pixelRatio, 2);

    return {
      width: Math.round(maxWidth * effectivePixelRatio),
      height: Math.round(maxHeight * effectivePixelRatio),
    };
  }

  /**
   * Generate optimized URL for CDN-based image optimization
   */
  private generateOptimizedUrl(
    originalUrl: string,
    width: number,
    height: number,
    quality: number
  ): string {
    if (!originalUrl.includes('theadtip.in') && !originalUrl.includes('cloudflare')) {
      return originalUrl; // Don't optimize external URLs
    }

    // For Cloudflare Images or similar CDN
    const qualityParam = Math.round(quality * 100);
    const params = new URLSearchParams({
      width: width.toString(),
      height: height.toString(),
      quality: qualityParam.toString(),
      format: this.config.enableWebP ? 'webp' : 'auto',
      fit: 'cover',
    });

    // Check if URL already has parameters
    const separator = originalUrl.includes('?') ? '&' : '?';
    return `${originalUrl}${separator}${params.toString()}`;
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(
    url: string,
    width?: number,
    height?: number,
    quality?: number
  ): string {
    const params = [url, width || 0, height || 0, quality || this.config.defaultQuality];
    return params.join('|');
  }

  /**
   * Check if cached image is still valid
   */
  private isCacheValid(cachedImage: CachedImage): boolean {
    const age = Date.now() - cachedImage.timestamp;
    return age < this.config.cacheExpiration;
  }

  /**
   * Clean expired cache entries
   */
  private async cleanExpiredCache(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((cachedImage, key) => {
      if (!this.isCacheValid(cachedImage)) {
        expiredKeys.push(key);
      }
    });

    // Remove expired entries
    expiredKeys.forEach(key => this.cache.delete(key));

    if (expiredKeys.length > 0) {
      await this.saveCacheToStorage();
      Logger.info('ImageCacheService', `Cleaned ${expiredKeys.length} expired cache entries`);
    }
  }

  /**
   * Load cache from AsyncStorage
   */
  private async loadCacheFromStorage(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_KEY));
      
      if (cacheKeys.length === 0) return;

      const cacheEntries = await AsyncStorage.multiGet(cacheKeys);
      
      cacheEntries.forEach(([key, value]) => {
        if (value) {
          try {
            const cacheKey = key.replace(this.CACHE_KEY, '');
            const cachedImage: CachedImage = JSON.parse(value);
            this.cache.set(cacheKey, cachedImage);
          } catch (error) {
            Logger.error('ImageCacheService', `Failed to parse cache entry ${key}:`, error);
          }
        }
      });

      Logger.info('ImageCacheService', `Loaded ${this.cache.size} cache entries`);
    } catch (error) {
      Logger.error('ImageCacheService', 'Failed to load cache from storage:', error);
    }
  }

  /**
   * Save cache to AsyncStorage
   */
  private async saveCacheToStorage(): Promise<void> {
    try {
      const cacheEntries: [string, string][] = [];
      
      this.cache.forEach((cachedImage, key) => {
        cacheEntries.push([
          `${this.CACHE_KEY}${key}`,
          JSON.stringify(cachedImage)
        ]);
      });

      await AsyncStorage.multiSet(cacheEntries);
    } catch (error) {
      Logger.error('ImageCacheService', 'Failed to save cache to storage:', error);
    }
  }

  /**
   * Load metrics from storage
   */
  private async loadMetrics(): Promise<void> {
    try {
      const metricsData = await AsyncStorage.getItem(this.METRICS_KEY);
      if (metricsData) {
        this.metrics = { ...this.metrics, ...JSON.parse(metricsData) };
      }
    } catch (error) {
      Logger.error('ImageCacheService', 'Failed to load metrics:', error);
    }
  }

  /**
   * Save metrics to storage
   */
  private async saveMetrics(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.METRICS_KEY, JSON.stringify(this.metrics));
    } catch (error) {
      Logger.error('ImageCacheService', 'Failed to save metrics:', error);
    }
  }

  /**
   * Get cache metrics
   */
  getCacheMetrics(): ImageMetrics & { cacheEntries: number; hitRate: number } {
    const totalRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
    const hitRate = totalRequests > 0 ? this.metrics.cacheHits / totalRequests : 0;

    return {
      ...this.metrics,
      cacheEntries: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    try {
      this.cache.clear();
      
      // Remove all cache entries from storage
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_KEY));
      await AsyncStorage.multiRemove(cacheKeys);

      // Reset metrics
      this.metrics = {
        cacheHits: 0,
        cacheMisses: 0,
        cacheSize: 0,
        optimizationSavings: 0,
      };

      await this.saveMetrics();
      Logger.info('ImageCacheService', 'Cache cleared successfully');
    } catch (error) {
      Logger.error('ImageCacheService', 'Failed to clear cache:', error);
    }
  }

  /**
   * Preload images for better performance
   */
  async preloadImages(urls: string[]): Promise<void> {
    if (!this.isInitialized) await this.initialize();

    const preloadPromises = urls.map(url => 
      this.getOptimizedImageUrl(url).catch(error => {
        Logger.error('ImageCacheService', `Failed to preload ${url}:`, error);
        return url;
      })
    );

    try {
      await Promise.all(preloadPromises);
      Logger.info('ImageCacheService', `Preloaded ${urls.length} images`);
    } catch (error) {
      Logger.error('ImageCacheService', 'Failed to preload images:', error);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ImageCacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    Logger.info('ImageCacheService', 'Configuration updated:', newConfig);
  }
}

export default ImageCacheService;
export type { ImageCacheConfig, CachedImage, ImageMetrics };