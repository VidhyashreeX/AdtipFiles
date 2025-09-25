// src/services/StartupOptimizationService.ts - App startup time optimization service

import AsyncStorage from '@react-native-async-storage/async-storage';
import { InteractionManager, AppState } from 'react-native';
import { Logger } from '../utils/ProductionLogger';
import ImageCacheService from './ImageCacheService';
import LazyLoadingService from './LazyLoadingService';

interface StartupMetrics {
  appStartTime: number;
  initializationTime: number;
  firstScreenTime: number;
  cacheLoadTime: number;
  serviceInitTime: number;
  totalStartupTime: number;
}

interface PreloadConfig {
  images: string[];
  modules: string[];
  data: Array<{ key: string; loader: () => Promise<any> }>;
}

class StartupOptimizationService {
  private static instance: StartupOptimizationService;
  private startupMetrics: StartupMetrics;
  private isOptimizing = false;
  private preloadConfig: PreloadConfig;
  private initializationPromise?: Promise<void>;

  private constructor() {
    this.startupMetrics = {
      appStartTime: Date.now(),
      initializationTime: 0,
      firstScreenTime: 0,
      cacheLoadTime: 0,
      serviceInitTime: 0,
      totalStartupTime: 0,
    };

    this.preloadConfig = {
      images: [],
      modules: [],
      data: [],
    };
  }

  static getInstance(): StartupOptimizationService {
    if (!StartupOptimizationService.instance) {
      StartupOptimizationService.instance = new StartupOptimizationService();
    }
    return StartupOptimizationService.instance;
  }

  /**
   * Initialize startup optimization
   */
  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    const initStart = Date.now();
    
    try {
      Logger.info('StartupOptimizationService', 'Initializing startup optimization...');

      // Load startup configuration
      await this.loadStartupConfig();

      // Initialize critical services in parallel
      await this.initializeCriticalServices();

      // Set up background optimization
      this.setupBackgroundOptimization();

      this.startupMetrics.initializationTime = Date.now() - initStart;
      Logger.info('StartupOptimizationService', `Initialization completed in ${this.startupMetrics.initializationTime}ms`);
    } catch (error) {
      Logger.error('StartupOptimizationService', 'Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Load startup configuration from storage
   */
  private async loadStartupConfig(): Promise<void> {
    try {
      const configData = await AsyncStorage.getItem('@StartupConfig');
      if (configData) {
        const config = JSON.parse(configData);
        this.preloadConfig = { ...this.preloadConfig, ...config };
      }
    } catch (error) {
      Logger.error('StartupOptimizationService', 'Failed to load startup config:', error);
    }
  }

  /**
   * Initialize critical services
   */
  private async initializeCriticalServices(): Promise<void> {
    const serviceStart = Date.now();

    try {
      // Initialize services in parallel for better performance
      const servicePromises = [
        ImageCacheService.getInstance().initialize(),
        // Add other critical services here
      ];

      await Promise.all(servicePromises);

      this.startupMetrics.serviceInitTime = Date.now() - serviceStart;
      Logger.info('StartupOptimizationService', `Services initialized in ${this.startupMetrics.serviceInitTime}ms`);
    } catch (error) {
      Logger.error('StartupOptimizationService', 'Failed to initialize services:', error);
    }
  }

  /**
   * Setup background optimization tasks
   */
  private setupBackgroundOptimization(): void {
    // Run background tasks after UI interactions complete
    InteractionManager.runAfterInteractions(() => {
      this.runBackgroundOptimization();
    });

    // Setup app state listener for optimization opportunities
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  private handleAppStateChange = (nextAppState: string): void => {
    if (nextAppState === 'active') {
      // App became active - good time for background optimization
      InteractionManager.runAfterInteractions(() => {
        this.runBackgroundOptimization();
      });
    }
  };

  /**
   * Run background optimization tasks
   */
  private async runBackgroundOptimization(): Promise<void> {
    if (this.isOptimizing) return;

    this.isOptimizing = true;

    try {
      Logger.debug('StartupOptimizationService', 'Starting background optimization...');

      // Preload images
      if (this.preloadConfig.images.length > 0) {
        await this.preloadImages();
      }

      // Preload modules
      if (this.preloadConfig.modules.length > 0) {
        await this.preloadModules();
      }

      // Preload data
      if (this.preloadConfig.data.length > 0) {
        await this.preloadData();
      }

      Logger.info('StartupOptimizationService', 'Background optimization completed');
    } catch (error) {
      Logger.error('StartupOptimizationService', 'Background optimization failed:', error);
    } finally {
      this.isOptimizing = false;
    }
  }

  /**
   * Preload critical images
   */
  private async preloadImages(): Promise<void> {
    try {
      const imageCache = ImageCacheService.getInstance();
      await imageCache.preloadImages(this.preloadConfig.images);
      Logger.debug('StartupOptimizationService', `Preloaded ${this.preloadConfig.images.length} images`);
    } catch (error) {
      Logger.error('StartupOptimizationService', 'Image preloading failed:', error);
    }
  }

  /**
   * Preload critical modules
   */
  private async preloadModules(): Promise<void> {
    try {
      const lazyLoader = LazyLoadingService.getInstance();
      await lazyLoader.preloadModules(this.preloadConfig.modules);
      Logger.debug('StartupOptimizationService', `Preloaded ${this.preloadConfig.modules.length} modules`);
    } catch (error) {
      Logger.error('StartupOptimizationService', 'Module preloading failed:', error);
    }
  }

  /**
   * Preload critical data
   */
  private async preloadData(): Promise<void> {
    try {
      const dataPromises = this.preloadConfig.data.map(async ({ key, loader }) => {
        try {
          const data = await loader();
          await AsyncStorage.setItem(`@PreloadedData:${key}`, JSON.stringify(data));
          Logger.debug('StartupOptimizationService', `Preloaded data: ${key}`);
        } catch (error) {
          Logger.error('StartupOptimizationService', `Failed to preload data ${key}:`, error);
        }
      });

      await Promise.all(dataPromises);
    } catch (error) {
      Logger.error('StartupOptimizationService', 'Data preloading failed:', error);
    }
  }

  /**
   * Configure preload settings
   */
  configurePreload(config: Partial<PreloadConfig>): void {
    this.preloadConfig = { ...this.preloadConfig, ...config };
    
    // Save configuration for next startup
    AsyncStorage.setItem('@StartupConfig', JSON.stringify(this.preloadConfig))
      .catch(error => {
        Logger.error('StartupOptimizationService', 'Failed to save preload config:', error);
      });
  }

  /**
   * Add images to preload list
   */
  addImagesToPreload(images: string[]): void {
    const newImages = images.filter(img => !this.preloadConfig.images.includes(img));
    this.preloadConfig.images.push(...newImages);
    
    if (newImages.length > 0) {
      Logger.info('StartupOptimizationService', `Added ${newImages.length} images to preload list`);
    }
  }

  /**
   * Add modules to preload list
   */
  addModulesToPreload(modules: string[]): void {
    const newModules = modules.filter(mod => !this.preloadConfig.modules.includes(mod));
    this.preloadConfig.modules.push(...newModules);
    
    if (newModules.length > 0) {
      Logger.info('StartupOptimizationService', `Added ${newModules.length} modules to preload list`);
    }
  }

  /**
   * Mark first screen rendered
   */
  markFirstScreenRendered(): void {
    if (this.startupMetrics.firstScreenTime === 0) {
      this.startupMetrics.firstScreenTime = Date.now() - this.startupMetrics.appStartTime;
      Logger.info('StartupOptimizationService', `First screen rendered in ${this.startupMetrics.firstScreenTime}ms`);
    }
  }

  /**
   * Mark app ready
   */
  markAppReady(): void {
    this.startupMetrics.totalStartupTime = Date.now() - this.startupMetrics.appStartTime;
    Logger.info('StartupOptimizationService', `App ready in ${this.startupMetrics.totalStartupTime}ms`);
    
    // Save metrics for analysis
    this.saveStartupMetrics();
  }

  /**
   * Save startup metrics for analysis
   */
  private async saveStartupMetrics(): Promise<void> {
    try {
      const metricsHistory = await this.getMetricsHistory();
      metricsHistory.push({
        ...this.startupMetrics,
        timestamp: Date.now(),
      });

      // Keep only last 20 startup metrics
      if (metricsHistory.length > 20) {
        metricsHistory.splice(0, metricsHistory.length - 20);
      }

      await AsyncStorage.setItem('@StartupMetrics', JSON.stringify(metricsHistory));
    } catch (error) {
      Logger.error('StartupOptimizationService', 'Failed to save startup metrics:', error);
    }
  }

  /**
   * Get startup metrics history
   */
  async getMetricsHistory(): Promise<Array<StartupMetrics & { timestamp: number }>> {
    try {
      const data = await AsyncStorage.getItem('@StartupMetrics');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      Logger.error('StartupOptimizationService', 'Failed to load metrics history:', error);
      return [];
    }
  }

  /**
   * Get current startup metrics
   */
  getStartupMetrics(): StartupMetrics {
    return { ...this.startupMetrics };
  }

  /**
   * Get optimization statistics
   */
  getOptimizationStats(): {
    preloadConfig: PreloadConfig;
    isOptimizing: boolean;
    startupMetrics: StartupMetrics;
  } {
    return {
      preloadConfig: { ...this.preloadConfig },
      isOptimizing: this.isOptimizing,
      startupMetrics: { ...this.startupMetrics },
    };
  }

  /**
   * Clear optimization cache
   */
  async clearOptimizationCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const optimizationKeys = keys.filter(key => 
        key.startsWith('@StartupConfig') || 
        key.startsWith('@StartupMetrics') || 
        key.startsWith('@PreloadedData:')
      );
      
      await AsyncStorage.multiRemove(optimizationKeys);
      
      // Reset preload config
      this.preloadConfig = {
        images: [],
        modules: [],
        data: [],
      };

      Logger.info('StartupOptimizationService', 'Optimization cache cleared');
    } catch (error) {
      Logger.error('StartupOptimizationService', 'Failed to clear optimization cache:', error);
    }
  }

  /**
   * Force run optimization now
   */
  async runOptimizationNow(): Promise<void> {
    if (!this.isOptimizing) {
      await this.runBackgroundOptimization();
    }
  }

  /**
   * Cleanup service
   */
  cleanup(): void {
    this.isOptimizing = false;
    AppState.removeEventListener('change', this.handleAppStateChange);
  }
}

export default StartupOptimizationService;
export type { StartupMetrics, PreloadConfig };