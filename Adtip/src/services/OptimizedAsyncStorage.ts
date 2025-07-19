import AsyncStorage from '@react-native-async-storage/async-storage';
import Logger from '../utils/logger';

/**
 * Optimized AsyncStorage service with batching, caching, and background operations
 * Improves performance by reducing I/O operations and providing intelligent caching
 */
class OptimizedAsyncStorage {
  private cache = new Map<string, any>();
  private pendingWrites = new Map<string, any>();
  private writeTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 100; // ms
  private readonly MAX_CACHE_SIZE = 100;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private cacheTimestamps = new Map<string, number>();

  /**
   * Get item from cache first, then AsyncStorage if not cached
   */
  async getItem(key: string): Promise<string | null> {
    try {
      // Check cache first
      if (this.cache.has(key) && this.isCacheValid(key)) {
        Logger.debug('OptimizedAsyncStorage', `Cache hit for key: ${key}`);
        return this.cache.get(key);
      }

      // Get from AsyncStorage
      const value = await AsyncStorage.getItem(key);

      // Cache the result
      this.setCacheItem(key, value);

      return value;
    } catch (error) {
      Logger.error('OptimizedAsyncStorage', 'Error getting item:', error);
      return null;
    }
  }

  /**
   * Set item with batched writes for better performance
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      // Update cache immediately
      this.setCacheItem(key, value);
      
      // Add to pending writes
      this.pendingWrites.set(key, value);
      
      // Schedule batched write
      this.scheduleBatchWrite();
    } catch (error) {
      Logger.error('OptimizedAsyncStorage', 'Error setting item:', error);
      throw error;
    }
  }

  /**
   * Remove item from both cache and storage
   */
  async removeItem(key: string): Promise<void> {
    try {
      // Remove from cache
      this.cache.delete(key);
      this.cacheTimestamps.delete(key);
      
      // Remove from pending writes if exists
      this.pendingWrites.delete(key);
      
      // Remove from AsyncStorage
      await AsyncStorage.removeItem(key);
    } catch (error) {
      Logger.error('OptimizedAsyncStorage', 'Error removing item:', error);
      throw error;
    }
  }

  /**
   * Get multiple items efficiently
   */
  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    try {
      const results: [string, string | null][] = [];
      const keysToFetch: string[] = [];

      // Check cache for each key
      for (const key of keys) {
        if (this.cache.has(key) && this.isCacheValid(key)) {
          results.push([key, this.cache.get(key)]);
        } else {
          keysToFetch.push(key);
        }
      }

      // Fetch remaining keys from AsyncStorage
      if (keysToFetch.length > 0) {
        const storageResults = await AsyncStorage.multiGet(keysToFetch);
        
        // Cache the results and add to return array
        for (const [key, value] of storageResults) {
          this.setCacheItem(key, value);
          results.push([key, value]);
        }
      }

      // Sort results to match original key order
      return keys.map(key => {
        const result = results.find(([k]) => k === key);
        return result || [key, null];
      });
    } catch (error) {
      Logger.error('OptimizedAsyncStorage', 'Error in multiGet:', error);
      return keys.map(key => [key, null]);
    }
  }

  /**
   * Set multiple items efficiently
   */
  async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    try {
      // Update cache for all items
      for (const [key, value] of keyValuePairs) {
        this.setCacheItem(key, value);
        this.pendingWrites.set(key, value);
      }

      // Schedule batched write
      this.scheduleBatchWrite();
    } catch (error) {
      Logger.error('OptimizedAsyncStorage', 'Error in multiSet:', error);
      throw error;
    }
  }

  /**
   * Remove multiple items efficiently
   */
  async multiRemove(keys: string[]): Promise<void> {
    try {
      // Remove from cache
      for (const key of keys) {
        this.cache.delete(key);
        this.cacheTimestamps.delete(key);
        this.pendingWrites.delete(key);
      }

      // Remove from AsyncStorage
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      Logger.error('OptimizedAsyncStorage', 'Error in multiRemove:', error);
      throw error;
    }
  }

  /**
   * Get all keys
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return [...keys]; // Convert readonly array to mutable array
    } catch (error) {
      Logger.error('OptimizedAsyncStorage', 'Error getting all keys:', error);
      return [];
    }
  }

  /**
   * Clear all data
   */
  async clear(): Promise<void> {
    try {
      // Clear cache
      this.cache.clear();
      this.cacheTimestamps.clear();
      this.pendingWrites.clear();
      
      // Clear pending writes
      if (this.writeTimeout) {
        clearTimeout(this.writeTimeout);
        this.writeTimeout = null;
      }

      // Clear AsyncStorage
      await AsyncStorage.clear();
    } catch (error) {
      Logger.error('OptimizedAsyncStorage', 'Error clearing storage:', error);
      throw error;
    }
  }

  /**
   * Force flush all pending writes immediately
   */
  async flush(): Promise<void> {
    if (this.writeTimeout) {
      clearTimeout(this.writeTimeout);
      this.writeTimeout = null;
    }
    
    await this.performBatchWrite();
  }

  /**
   * Get storage info and cache statistics
   */
  async getInfo(): Promise<{
    cacheSize: number;
    pendingWrites: number;
    totalKeys: number;
    cacheHitRate?: number;
  }> {
    try {
      const allKeys = await this.getAllKeys();
      
      return {
        cacheSize: this.cache.size,
        pendingWrites: this.pendingWrites.size,
        totalKeys: allKeys.length,
      };
    } catch (error) {
      Logger.error('OptimizedAsyncStorage', 'Error getting info:', error);
      return {
        cacheSize: this.cache.size,
        pendingWrites: this.pendingWrites.size,
        totalKeys: 0,
      };
    }
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, timestamp] of this.cacheTimestamps.entries()) {
      if (now - timestamp > this.CACHE_TTL) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key);
      this.cacheTimestamps.delete(key);
    }

    if (expiredKeys.length > 0) {
      Logger.debug('OptimizedAsyncStorage', `Cleared ${expiredKeys.length} expired cache entries`);
    }
  }

  /**
   * Private methods
   */
  private setCacheItem(key: string, value: any): void {
    // Implement LRU cache eviction if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE && !this.cache.has(key)) {
      const oldestKey = this.getOldestCacheKey();
      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.cacheTimestamps.delete(oldestKey);
      }
    }

    this.cache.set(key, value);
    this.cacheTimestamps.set(key, Date.now());
  }

  private isCacheValid(key: string): boolean {
    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp) return false;
    
    return Date.now() - timestamp < this.CACHE_TTL;
  }

  private getOldestCacheKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, timestamp] of this.cacheTimestamps.entries()) {
      if (timestamp < oldestTime) {
        oldestTime = timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  private scheduleBatchWrite(): void {
    if (this.writeTimeout) {
      clearTimeout(this.writeTimeout);
    }

    this.writeTimeout = setTimeout(() => {
      this.performBatchWrite();
    }, this.BATCH_DELAY);
  }

  private async performBatchWrite(): Promise<void> {
    if (this.pendingWrites.size === 0) return;

    try {
      const keyValuePairs: [string, string][] = Array.from(this.pendingWrites.entries());

      Logger.debug('OptimizedAsyncStorage', `Performing batch write for ${keyValuePairs.length} items`);

      await AsyncStorage.multiSet(keyValuePairs);

      // Clear pending writes
      this.pendingWrites.clear();
      this.writeTimeout = null;
    } catch (error) {
      Logger.error('OptimizedAsyncStorage', 'Error in batch write:', error);
      // Don't clear pending writes on error - they'll be retried
    }
  }
}

// Initialize cache cleanup interval
const optimizedStorage = new OptimizedAsyncStorage();

// Clean expired cache entries every 5 minutes
setInterval(() => {
  optimizedStorage.clearExpiredCache();
}, 5 * 60 * 1000);

// Export singleton instance
export default optimizedStorage;
