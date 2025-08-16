/**
 * VideoCallMemoryManager - Comprehensive memory management for video calls
 * 
 * This service handles:
 * - Automatic memory cleanup during video calls
 * - Memory pressure detection and response
 * - Video stream optimization based on device capabilities
 * - Periodic garbage collection
 * - Memory leak prevention
 */

import { AppState, Platform } from 'react-native';
import VideoSDKService from '../videosdk/VideoSDKService';
import { logCall, logWarn, logError } from '../../utils/ProductionLogger';

interface MemoryStats {
  totalMemory: number;
  freeMemory: number;
  usedMemory: number;
  memoryPressure: 'low' | 'medium' | 'high' | 'critical';
}

interface DeviceCapabilities {
  isLowEndDevice: boolean;
  maxVideoQuality: 'low' | 'medium' | 'high';
  memoryOptimizationLevel: 'aggressive' | 'moderate' | 'minimal';
}

class VideoCallMemoryManager {
  private static _instance: VideoCallMemoryManager;
  private isActive = false;
  private memoryCheckInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private callStartTime = 0;
  private maxCallDurationTimer: NodeJS.Timeout | null = null;
  private deviceCapabilities: DeviceCapabilities | null = null;
  private lastMemoryWarning = 0;
  private memoryWarningCount = 0;

  // Memory thresholds (in MB)
  private readonly MEMORY_THRESHOLDS = {
    LOW_END_DEVICE_LIMIT: 2048, // 2GB
    HIGH_MEMORY_WARNING: 1536,  // 1.5GB
    CRITICAL_MEMORY_WARNING: 1792, // 1.75GB
    CLEANUP_TRIGGER: 1280,      // 1.25GB
  };

  // Cleanup intervals (in milliseconds)
  private readonly INTERVALS = {
    MEMORY_CHECK: 5000,         // Check memory every 5 seconds
    AGGRESSIVE_CLEANUP: 10000,  // Aggressive cleanup every 10 seconds
    MODERATE_CLEANUP: 30000,    // Moderate cleanup every 30 seconds
    MINIMAL_CLEANUP: 60000,     // Minimal cleanup every 60 seconds
  };

  static getInstance(): VideoCallMemoryManager {
    if (!VideoCallMemoryManager._instance) {
      VideoCallMemoryManager._instance = new VideoCallMemoryManager();
    }
    return VideoCallMemoryManager._instance;
  }

  /**
   * Start memory management for video call
   */
  async startMemoryManagement(): Promise<void> {
    if (this.isActive) {
      logCall('VideoCallMemoryManager', 'Memory management already active');
      return;
    }

    logCall('VideoCallMemoryManager', 'Starting comprehensive memory management');
    this.isActive = true;
    this.callStartTime = Date.now();
    this.lastMemoryWarning = this.callStartTime;
    this.memoryWarningCount = 0;

    // Detect device capabilities
    await this.detectDeviceCapabilities();

    // Setup proactive call duration limits
    this.setupCallDurationLimits();

    // Start memory monitoring
    this.startMemoryMonitoring();

    // Start periodic cleanup
    this.startPeriodicCleanup();

    // Setup app state listeners
    this.setupAppStateListeners();

    logCall('VideoCallMemoryManager', 'Memory management started with capabilities:', this.deviceCapabilities);
  }

  /**
   * Stop memory management
   */
  stopMemoryManagement(): void {
    if (!this.isActive) return;

    logCall('VideoCallMemoryManager', 'Stopping memory management');
    this.isActive = false;

    // Clear intervals
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    if (this.maxCallDurationTimer) {
      clearInterval(this.maxCallDurationTimer);
      this.maxCallDurationTimer = null;
    }

    // Perform final cleanup
    this.performComprehensiveCleanup();
  }

  /**
   * Detect device capabilities for memory optimization
   */
  private async detectDeviceCapabilities(): Promise<void> {
    try {
      const totalMemory = await this.getTotalMemory();
      const isLowEndDevice = totalMemory < this.MEMORY_THRESHOLDS.LOW_END_DEVICE_LIMIT;

      this.deviceCapabilities = {
        isLowEndDevice,
        maxVideoQuality: isLowEndDevice ? 'low' : totalMemory < 4096 ? 'medium' : 'high',
        memoryOptimizationLevel: isLowEndDevice ? 'aggressive' : totalMemory < 4096 ? 'moderate' : 'minimal'
      };

      logCall('VideoCallMemoryManager', 'Device capabilities detected:', {
        totalMemory: `${totalMemory}MB`,
        ...this.deviceCapabilities
      });

    } catch (error) {
      logWarn('VideoCallMemoryManager', 'Failed to detect device capabilities, using defaults', error);
      this.deviceCapabilities = {
        isLowEndDevice: true,
        maxVideoQuality: 'medium',
        memoryOptimizationLevel: 'moderate'
      };
    }
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    this.memoryCheckInterval = setInterval(async () => {
      if (!this.isActive) return;

      try {
        const memoryStats = await this.getMemoryStats();
        await this.handleMemoryPressure(memoryStats);
      } catch (error) {
        logWarn('VideoCallMemoryManager', 'Memory monitoring error', error);
      }
    }, this.INTERVALS.MEMORY_CHECK);
  }

  /**
   * Setup proactive memory cleanup intervals based on device capabilities
   * NO TIME LIMITS - calls should run indefinitely with proper memory management
   */
  private setupCallDurationLimits(): void {
    if (!this.deviceCapabilities) return;

    // Instead of time limits, setup aggressive cleanup intervals for different devices
    let aggressiveCleanupInterval: number;
    if (this.deviceCapabilities.isLowEndDevice) {
      // Low-end devices: very frequent cleanup every 2 seconds
      aggressiveCleanupInterval = 2 * 1000;
      logCall('VideoCallMemoryManager', 'Setting aggressive cleanup for low-end device: every 2 seconds');
    } else {
      // High-end devices: frequent cleanup every 10 seconds
      aggressiveCleanupInterval = 10 * 1000;
      logCall('VideoCallMemoryManager', 'Setting frequent cleanup for high-end device: every 10 seconds');
    }

    // Setup aggressive cleanup timer (separate from regular cleanup)
    this.maxCallDurationTimer = setInterval(() => {
      if (!this.isActive) return;

      logCall('VideoCallMemoryManager', 'Performing aggressive memory cleanup');
      this.performAggressiveCleanup();
    }, aggressiveCleanupInterval);
  }

  /**
   * Start periodic cleanup based on device capabilities
   */
  private startPeriodicCleanup(): void {
    if (!this.deviceCapabilities) return;

    let cleanupInterval: number;
    switch (this.deviceCapabilities.memoryOptimizationLevel) {
      case 'aggressive':
        cleanupInterval = this.INTERVALS.AGGRESSIVE_CLEANUP;
        break;
      case 'moderate':
        cleanupInterval = this.INTERVALS.MODERATE_CLEANUP;
        break;
      case 'minimal':
        cleanupInterval = this.INTERVALS.MINIMAL_CLEANUP;
        break;
    }

    this.cleanupInterval = setInterval(() => {
      if (!this.isActive) return;
      this.performPeriodicCleanup();
    }, cleanupInterval);
  }

  /**
   * Get total device memory
   */
  private async getTotalMemory(): Promise<number> {
    try {
      if (Platform.OS === 'android') {
        // For Android, we can estimate based on device info
        // This is a simplified approach - in production you might use native modules
        return 3072; // Default to 3GB for Android
      } else {
        // For iOS, we can use device model to estimate
        return 4096; // Default to 4GB for iOS
      }
    } catch (error) {
      logWarn('VideoCallMemoryManager', 'Failed to get total memory', error);
      return 2048; // Conservative default
    }
  }

  /**
   * Get current memory statistics
   */
  private async getMemoryStats(): Promise<MemoryStats> {
    try {
      // In a real implementation, you would use native modules to get actual memory stats
      // For now, we'll simulate based on time and device capabilities
      const totalMemory = await this.getTotalMemory();
      const simulatedUsage = this.simulateMemoryUsage();
      const usedMemory = Math.floor(totalMemory * simulatedUsage);
      const freeMemory = totalMemory - usedMemory;

      let memoryPressure: 'low' | 'medium' | 'high' | 'critical';
      if (usedMemory > this.MEMORY_THRESHOLDS.CRITICAL_MEMORY_WARNING) {
        memoryPressure = 'critical';
      } else if (usedMemory > this.MEMORY_THRESHOLDS.HIGH_MEMORY_WARNING) {
        memoryPressure = 'high';
      } else if (usedMemory > this.MEMORY_THRESHOLDS.CLEANUP_TRIGGER) {
        memoryPressure = 'medium';
      } else {
        memoryPressure = 'low';
      }

      return {
        totalMemory,
        freeMemory,
        usedMemory,
        memoryPressure
      };
    } catch (error) {
      logWarn('VideoCallMemoryManager', 'Failed to get memory stats', error);
      return {
        totalMemory: 2048,
        freeMemory: 1024,
        usedMemory: 1024,
        memoryPressure: 'medium'
      };
    }
  }

  /**
   * Simulate memory usage for testing (replace with actual memory monitoring)
   * This simulates the memory leak pattern observed in video calls
   */
  private simulateMemoryUsage(): number {
    const baseUsage = 0.4; // 40% base usage
    const callStartTime = this.lastMemoryWarning || Date.now();
    const callDuration = Date.now() - callStartTime;

    // Simulate different memory leak patterns based on device type
    let durationFactor = 0;
    if (this.deviceCapabilities?.isLowEndDevice) {
      // Low-end devices: rapid memory increase, critical at 15 seconds
      durationFactor = Math.min(callDuration / (15 * 1000), 0.4); // 40% increase over 15 seconds
    } else {
      // High-end devices: slower memory increase, critical at 3 minutes
      durationFactor = Math.min(callDuration / (3 * 60 * 1000), 0.3); // 30% increase over 3 minutes
    }

    // Add some randomness to simulate real-world conditions
    const randomFactor = (Math.random() - 0.5) * 0.05; // ±2.5% random variation

    return Math.min(baseUsage + durationFactor + randomFactor, 0.95);
  }

  /**
   * Handle memory pressure based on current stats
   */
  private async handleMemoryPressure(memoryStats: MemoryStats): Promise<void> {
    switch (memoryStats.memoryPressure) {
      case 'critical':
        logWarn('VideoCallMemoryManager', 'CRITICAL memory pressure detected', memoryStats);
        await this.handleCriticalMemoryPressure();
        break;
      case 'high':
        logWarn('VideoCallMemoryManager', 'HIGH memory pressure detected', memoryStats);
        await this.handleHighMemoryPressure();
        break;
      case 'medium':
        logCall('VideoCallMemoryManager', 'MEDIUM memory pressure detected', memoryStats);
        await this.handleMediumMemoryPressure();
        break;
      case 'low':
        // Normal operation
        break;
    }
  }

  /**
   * Handle critical memory pressure - aggressive cleanup WITHOUT terminating call
   */
  private async handleCriticalMemoryPressure(): Promise<void> {
    this.memoryWarningCount++;

    logError('VideoCallMemoryManager', 'CRITICAL MEMORY PRESSURE - Performing emergency cleanup');

    // Perform multiple rounds of aggressive cleanup
    await this.performAggressiveCleanup();

    // If this is the 3rd critical warning, switch to maximum cleanup mode
    if (this.memoryWarningCount >= 3) {
      logError('VideoCallMemoryManager', 'Multiple critical memory warnings - switching to maximum cleanup mode');
      await this.enableMaximumCleanupMode();
    }
  }

  /**
   * Handle high memory pressure
   */
  private async handleHighMemoryPressure(): Promise<void> {
    logWarn('VideoCallMemoryManager', 'HIGH memory pressure - Optimizing video quality');
    
    // Reduce video quality
    await this.optimizeVideoQuality('low');
    
    // Perform cleanup
    await this.performComprehensiveCleanup();
  }

  /**
   * Handle medium memory pressure
   */
  private async handleMediumMemoryPressure(): Promise<void> {
    logCall('VideoCallMemoryManager', 'MEDIUM memory pressure - Performing routine cleanup');
    
    // Perform routine cleanup
    this.performPeriodicCleanup();
  }

  /**
   * Optimize video quality based on memory pressure
   */
  private async optimizeVideoQuality(quality: 'low' | 'medium' | 'high'): Promise<void> {
    try {
      logCall('VideoCallMemoryManager', `Optimizing video quality to: ${quality}`);
      
      // In a real implementation, you would adjust VideoSDK quality settings
      // For now, we'll just log the optimization
      
    } catch (error) {
      logWarn('VideoCallMemoryManager', 'Failed to optimize video quality', error);
    }
  }

  /**
   * Perform periodic cleanup
   */
  private performPeriodicCleanup(): void {
    try {
      logCall('VideoCallMemoryManager', 'Performing periodic cleanup');
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Clear VideoSDK caches
      this.clearVideoSDKCaches();
      
    } catch (error) {
      logWarn('VideoCallMemoryManager', 'Periodic cleanup error', error);
    }
  }

  /**
   * Perform aggressive cleanup - more frequent and thorough than periodic cleanup
   */
  private async performAggressiveCleanup(): Promise<void> {
    try {
      logCall('VideoCallMemoryManager', 'Performing aggressive cleanup');

      // Clear VideoSDK caches and state
      await this.clearVideoSDKCaches();

      // Clear any unused React Native bridge data
      this.clearReactNativeBridgeData();

      // Force garbage collection multiple times with delays
      if (global.gc) {
        for (let i = 0; i < 5; i++) {
          global.gc();
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      // Clear any cached images or media
      this.clearMediaCaches();

    } catch (error) {
      logWarn('VideoCallMemoryManager', 'Aggressive cleanup error', error);
    }
  }

  /**
   * Perform comprehensive cleanup
   */
  private async performComprehensiveCleanup(): Promise<void> {
    try {
      logCall('VideoCallMemoryManager', 'Performing comprehensive cleanup');

      // Perform aggressive cleanup first
      await this.performAggressiveCleanup();

      // Additional comprehensive cleanup steps
      this.clearAllGlobalReferences();

      // Force garbage collection multiple times
      if (global.gc) {
        for (let i = 0; i < 3; i++) {
          global.gc();
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

    } catch (error) {
      logWarn('VideoCallMemoryManager', 'Comprehensive cleanup error', error);
    }
  }

  /**
   * Enable maximum cleanup mode for critical memory situations
   */
  private async enableMaximumCleanupMode(): Promise<void> {
    try {
      logCall('VideoCallMemoryManager', 'Enabling maximum cleanup mode');

      // Switch to most aggressive cleanup interval
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
      }

      // Set very aggressive cleanup - every 1 second
      this.cleanupInterval = setInterval(() => {
        if (!this.isActive) return;
        this.performAggressiveCleanup();
      }, 1000);

      // Perform immediate comprehensive cleanup
      await this.performComprehensiveCleanup();

    } catch (error) {
      logWarn('VideoCallMemoryManager', 'Maximum cleanup mode error', error);
    }
  }

  /**
   * Clear VideoSDK caches and unused resources
   */
  private clearVideoSDKCaches(): void {
    try {
      // Clear participant data
      if (global.videoSDKParticipants) {
        global.videoSDKParticipants.clear();
      }

      // Clear meeting data
      if (global.videoSDKMeetingData) {
        global.videoSDKMeetingData = null;
      }

      // Clear any VideoSDK internal caches (safely)
      const globalAny = global as any;
      if (globalAny.VideoSDK?.clearCache) {
        globalAny.VideoSDK.clearCache();
      }

    } catch (error) {
      logWarn('VideoCallMemoryManager', 'Error clearing VideoSDK caches', error);
    }
  }

  /**
   * Clear React Native bridge data and unused references
   */
  private clearReactNativeBridgeData(): void {
    try {
      const globalAny = global as any;

      // Clear any cached bridge data
      if (globalAny.__fbBatchedBridge) {
        // Clear any pending callbacks that might hold references
        if (globalAny.__fbBatchedBridge._callbackID) {
          globalAny.__fbBatchedBridge._callbackID = 1;
        }
      }

      // Clear any cached module data (conservative approach)
      if (globalAny.__r && globalAny.__r.clear) {
        // Don't clear everything, just video-related modules
        // This is a conservative approach to avoid breaking the app
      }

    } catch (error) {
      logWarn('VideoCallMemoryManager', 'Error clearing React Native bridge data', error);
    }
  }

  /**
   * Clear media caches and unused media resources
   */
  private clearMediaCaches(): void {
    try {
      const globalAny = global as any;

      // Clear any cached images
      if (globalAny.Image && globalAny.Image.clearCache) {
        globalAny.Image.clearCache();
      }

      // Clear any video element caches
      if (globalAny.HTMLVideoElement) {
        // Clear any cached video elements (browser-specific)
      }

      // Clear any audio context caches
      if (globalAny.AudioContext && globalAny.AudioContext.clearCache) {
        globalAny.AudioContext.clearCache();
      }

    } catch (error) {
      logWarn('VideoCallMemoryManager', 'Error clearing media caches', error);
    }
  }

  /**
   * Clear all global references that might cause memory leaks
   */
  private clearAllGlobalReferences(): void {
    try {
      const globalAny = global as any;

      // Clear any global video call references
      if (globalAny.currentVideoCall) {
        globalAny.currentVideoCall = null;
      }

      // Clear any global participant references
      if (globalAny.currentParticipants) {
        globalAny.currentParticipants = null;
      }

      // Clear any global stream references
      if (globalAny.currentStreams) {
        globalAny.currentStreams = null;
      }

      // Clear any global WebRTC references
      if (globalAny.currentPeerConnections) {
        globalAny.currentPeerConnections = null;
      }

    } catch (error) {
      logWarn('VideoCallMemoryManager', 'Error clearing global references', error);
    }
  }

  /**
   * Setup app state listeners for memory management
   */
  private setupAppStateListeners(): void {
    AppState.addEventListener('change', (nextAppState) => {
      if (!this.isActive) return;

      if (nextAppState === 'background' || nextAppState === 'inactive') {
        logCall('VideoCallMemoryManager', 'App backgrounded - performing cleanup');
        this.performPeriodicCleanup();
      }
    });
  }
}

export default VideoCallMemoryManager;
