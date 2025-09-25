// src/services/LazyLoadingService.ts - Lazy loading and code splitting service

import React from 'react';
import { InteractionManager } from 'react-native';
import { Logger } from '../utils/ProductionLogger';

interface LazyLoadableModule {
  id: string;
  loader: () => Promise<any>;
  preload?: boolean;
  dependencies?: string[];
}

interface LoadedModule {
  id: string;
  module: any;
  loadTime: number;
  size?: number;
}

class LazyLoadingService {
  private static instance: LazyLoadingService;
  private modules = new Map<string, LazyLoadableModule>();
  private loadedModules = new Map<string, LoadedModule>();
  private loadingPromises = new Map<string, Promise<any>>();
  private preloadQueue: string[] = [];
  private isPreloading = false;

  private constructor() {
    this.initialize();
  }

  static getInstance(): LazyLoadingService {
    if (!LazyLoadingService.instance) {
      LazyLoadingService.instance = new LazyLoadingService();
    }
    return LazyLoadingService.instance;
  }

  private async initialize(): Promise<void> {
    // Register core modules
    this.registerCoreModules();
    
    // Start preloading after interactions complete
    InteractionManager.runAfterInteractions(() => {
      this.startPreloading();
    });
  }

  /**
   * Register core modules that should be lazy loaded
   */
  private registerCoreModules(): void {
    // Register component modules that we know exist
    this.registerModule({
      id: 'VideoPlayerModal',
      loader: async () => {
        try {
          return await import('../components/tiptube/VideoPlayerModal');
        } catch (error) {
          Logger.warn('LazyLoadingService', 'VideoPlayerModal not found, using placeholder');
          return { default: null };
        }
      },
      preload: true,
    });

    // Register other modules as needed
    // Note: These will be registered when the actual paths are confirmed
    
    Logger.info('LazyLoadingService', `Registered ${this.modules.size} modules`);
  }

  /**
   * Register a module for lazy loading
   */
  registerModule(module: LazyLoadableModule): void {
    this.modules.set(module.id, module);
    
    if (module.preload) {
      this.preloadQueue.push(module.id);
    }
  }

  /**
   * Load a module asynchronously
   */
  async loadModule<T = any>(moduleId: string): Promise<T> {
    // Return cached module if already loaded
    const cached = this.loadedModules.get(moduleId);
    if (cached) {
      Logger.debug('LazyLoadingService', `Module ${moduleId} loaded from cache`);
      return cached.module;
    }

    // Return existing loading promise if already loading
    const existingPromise = this.loadingPromises.get(moduleId);
    if (existingPromise) {
      Logger.debug('LazyLoadingService', `Module ${moduleId} already loading, waiting...`);
      return existingPromise;
    }

    // Get module configuration
    const moduleConfig = this.modules.get(moduleId);
    if (!moduleConfig) {
      throw new Error(`Module ${moduleId} not registered`);
    }

    // Load dependencies first
    if (moduleConfig.dependencies) {
      await this.loadDependencies(moduleConfig.dependencies);
    }

    // Start loading
    const startTime = Date.now();
    const loadPromise = this.loadModuleInternal(moduleId, moduleConfig, startTime);
    this.loadingPromises.set(moduleId, loadPromise);

    try {
      const module = await loadPromise;
      this.loadingPromises.delete(moduleId);
      return module;
    } catch (error) {
      this.loadingPromises.delete(moduleId);
      throw error;
    }
  }

  /**
   * Internal module loading logic
   */
  private async loadModuleInternal(
    moduleId: string,
    config: LazyLoadableModule,
    startTime: number
  ): Promise<any> {
    try {
      Logger.debug('LazyLoadingService', `Loading module: ${moduleId}`);
      
      const module = await config.loader();
      const loadTime = Date.now() - startTime;

      // Cache the loaded module
      const loadedModule: LoadedModule = {
        id: moduleId,
        module: module.default || module,
        loadTime,
      };

      this.loadedModules.set(moduleId, loadedModule);

      Logger.info('LazyLoadingService', `Module ${moduleId} loaded in ${loadTime}ms`);
      return loadedModule.module;
    } catch (error) {
      Logger.error('LazyLoadingService', `Failed to load module ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Load module dependencies
   */
  private async loadDependencies(dependencies: string[]): Promise<void> {
    const dependencyPromises = dependencies.map(dep => this.loadModule(dep));
    await Promise.all(dependencyPromises);
  }

  /**
   * Start preloading modules
   */
  private async startPreloading(): Promise<void> {
    if (this.isPreloading || this.preloadQueue.length === 0) return;

    this.isPreloading = true;
    Logger.info('LazyLoadingService', `Starting preload of ${this.preloadQueue.length} modules`);

    try {
      // Preload modules one by one to avoid overwhelming the system
      for (const moduleId of this.preloadQueue) {
        try {
          await this.loadModule(moduleId);
          
          // Small delay between preloads to keep UI responsive
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          Logger.error('LazyLoadingService', `Failed to preload ${moduleId}:`, error);
        }
      }

      Logger.info('LazyLoadingService', 'Preloading completed');
    } catch (error) {
      Logger.error('LazyLoadingService', 'Preloading failed:', error);
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * Preload specific modules
   */
  async preloadModules(moduleIds: string[]): Promise<void> {
    const preloadPromises = moduleIds.map(async (moduleId) => {
      try {
        await this.loadModule(moduleId);
      } catch (error) {
        Logger.error('LazyLoadingService', `Failed to preload ${moduleId}:`, error);
      }
    });

    await Promise.all(preloadPromises);
  }

  /**
   * Check if module is loaded
   */
  isModuleLoaded(moduleId: string): boolean {
    return this.loadedModules.has(moduleId);
  }

  /**
   * Check if module is currently loading
   */
  isModuleLoading(moduleId: string): boolean {
    return this.loadingPromises.has(moduleId);
  }

  /**
   * Get loading statistics
   */
  getLoadingStats(): {
    totalModules: number;
    loadedModules: number;
    loadingModules: number;
    preloadQueue: number;
    averageLoadTime: number;
    totalLoadTime: number;
  } {
    const loadedModules = Array.from(this.loadedModules.values());
    const totalLoadTime = loadedModules.reduce((sum, module) => sum + module.loadTime, 0);
    const averageLoadTime = loadedModules.length > 0 ? totalLoadTime / loadedModules.length : 0;

    return {
      totalModules: this.modules.size,
      loadedModules: this.loadedModules.size,
      loadingModules: this.loadingPromises.size,
      preloadQueue: this.preloadQueue.length,
      averageLoadTime: Math.round(averageLoadTime),
      totalLoadTime,
    };
  }

  /**
   * Clear cache for specific module
   */
  clearModuleCache(moduleId: string): void {
    this.loadedModules.delete(moduleId);
    this.loadingPromises.delete(moduleId);
    Logger.info('LazyLoadingService', `Cache cleared for module: ${moduleId}`);
  }

  /**
   * Clear all cached modules
   */
  clearAllCache(): void {
    this.loadedModules.clear();
    this.loadingPromises.clear();
    Logger.info('LazyLoadingService', 'All module cache cleared');
  }
}

// React hook for lazy loading modules
export const useLazyModule = <T = any>(moduleId: string): {
  module: T | null;
  isLoading: boolean;
  error: Error | null;
  loadModule: () => Promise<void>;
} => {
  const [module, setModule] = React.useState<T | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const lazyService = LazyLoadingService.getInstance();

  const loadModule = React.useCallback(async () => {
    if (lazyService.isModuleLoaded(moduleId)) {
      const cached = await lazyService.loadModule<T>(moduleId);
      setModule(cached);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const loadedModule = await lazyService.loadModule<T>(moduleId);
      setModule(loadedModule);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [moduleId, lazyService]);

  return {
    module,
    isLoading,
    error,
    loadModule,
  };
};

// Hook for preloading modules
export const useModulePreloader = (): {
  preloadModules: (moduleIds: string[]) => Promise<void>;
  getStats: () => any;
} => {
  const lazyService = LazyLoadingService.getInstance();

  const preloadModules = React.useCallback(async (moduleIds: string[]) => {
    await lazyService.preloadModules(moduleIds);
  }, [lazyService]);

  const getStats = React.useCallback(() => {
    return lazyService.getLoadingStats();
  }, [lazyService]);

  return {
    preloadModules,
    getStats,
  };
};

export default LazyLoadingService;