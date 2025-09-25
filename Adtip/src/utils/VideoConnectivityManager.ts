// adtip-reactnative/Adtip/src/utils/VideoConnectivityManager.ts
// Comprehensive video streaming connectivity manager
// Handles network detection, quality adaptation, and streaming optimization

import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';
import { Logger } from './ProductionLogger';

export interface NetworkQuality {
  type: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
  effectiveType: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

export interface ConnectivityRecommendations {
  recommendedQuality: 'auto' | 'high' | 'medium' | 'low';
  enableAdaptive: boolean;
  bufferConfig: {
    minBuffer: number;
    maxBuffer: number;
    playbackBuffer: number;
    rebufferBuffer: number;
  };
  preloadStrategy: 'aggressive' | 'conservative' | 'disabled';
  retryConfig: {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
  };
}

class VideoConnectivityManager {
  private static instance: VideoConnectivityManager;
  private currentNetworkQuality: NetworkQuality | null = null;
  private connectivityListeners: Set<(quality: NetworkQuality) => void> = new Set();
  private lastQualityCheck = 0;
  private qualityCheckInterval = 5000; // 5 seconds
  private isMonitoring = false;

  public static getInstance(): VideoConnectivityManager {
    if (!VideoConnectivityManager.instance) {
      VideoConnectivityManager.instance = new VideoConnectivityManager();
    }
    return VideoConnectivityManager.instance;
  }

  constructor() {
    this.initializeNetworkMonitoring();
  }

  /**
   * Initialize comprehensive network monitoring
   */
  private async initializeNetworkMonitoring(): Promise<void> {
    try {
      // Set up initial network state
      const netState = await NetInfo.fetch();
      this.currentNetworkQuality = this.analyzeNetworkQuality(netState);

      // Monitor network changes
      NetInfo.addEventListener(state => {
        const newQuality = this.analyzeNetworkQuality(state);
        
        if (this.hasSignificantQualityChange(this.currentNetworkQuality, newQuality)) {
          Logger.debug('VideoConnectivityManager', 'Network quality changed:', {
            from: this.currentNetworkQuality?.type,
            to: newQuality.type,
          });
          
          this.currentNetworkQuality = newQuality;
          this.notifyQualityChange(newQuality);
        }
      });

      // Start periodic quality assessment
      this.startPeriodicQualityAssessment();
      
      Logger.debug('VideoConnectivityManager', 'Network monitoring initialized:', this.currentNetworkQuality);
    } catch (error) {
      Logger.error('VideoConnectivityManager', 'Failed to initialize network monitoring:', error);
    }
  }

  /**
   * Analyze network quality from NetInfo state
   */
  private analyzeNetworkQuality(netState: any): NetworkQuality {
    if (!netState.isConnected) {
      return {
        type: 'offline',
        effectiveType: 'none',
      };
    }

    const details = netState.details || {};
    const connectionType = netState.type;
    const effectiveType = details.effectiveType || connectionType;
    const downlink = details.downlink;
    const rtt = details.rtt;
    const saveData = details.saveData;

    // Determine quality based on connection metrics
    let qualityType: NetworkQuality['type'];

    if (connectionType === 'wifi') {
      if (downlink && downlink > 20) {
        qualityType = 'excellent';
      } else if (downlink && downlink > 10) {
        qualityType = 'good';
      } else {
        qualityType = 'fair';
      }
    } else if (connectionType === 'cellular') {
      switch (effectiveType) {
        case '4g':
        case 'lte':
          if (downlink && downlink > 10) {
            qualityType = 'good';
          } else if (downlink && downlink > 5) {
            qualityType = 'fair';
          } else {
            qualityType = 'poor';
          }
          break;
        case '3g':
          qualityType = 'poor';
          break;
        case '2g':
          qualityType = 'poor';
          break;
        default:
          qualityType = 'fair';
      }
    } else {
      qualityType = 'fair';
    }

    // Adjust for save data mode
    if (saveData) {
      qualityType = qualityType === 'excellent' ? 'good' : 
                   qualityType === 'good' ? 'fair' : 'poor';
    }

    return {
      type: qualityType,
      effectiveType,
      downlink,
      rtt,
      saveData,
    };
  }

  /**
   * Check if there's a significant quality change
   */
  private hasSignificantQualityChange(
    oldQuality: NetworkQuality | null, 
    newQuality: NetworkQuality
  ): boolean {
    if (!oldQuality) return true;
    
    // Type change is always significant
    if (oldQuality.type !== newQuality.type) return true;
    
    // Check for significant bandwidth changes
    if (oldQuality.downlink && newQuality.downlink) {
      const change = Math.abs(oldQuality.downlink - newQuality.downlink) / oldQuality.downlink;
      return change > 0.3; // 30% change threshold
    }
    
    return false;
  }

  /**
   * Notify listeners of quality changes
   */
  private notifyQualityChange(quality: NetworkQuality): void {
    this.connectivityListeners.forEach(listener => {
      try {
        listener(quality);
      } catch (error) {
        Logger.error('VideoConnectivityManager', 'Listener error:', error);
      }
    });
  }

  /**
   * Start periodic quality assessment
   */
  private startPeriodicQualityAssessment(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    const assessQuality = async () => {
      try {
        const now = Date.now();
        if (now - this.lastQualityCheck > this.qualityCheckInterval) {
          const netState = await NetInfo.fetch();
          const quality = this.analyzeNetworkQuality(netState);
          
          if (this.hasSignificantQualityChange(this.currentNetworkQuality, quality)) {
            this.currentNetworkQuality = quality;
            this.notifyQualityChange(quality);
          }
          
          this.lastQualityCheck = now;
        }
      } catch (error) {
        Logger.error('VideoConnectivityManager', 'Quality assessment error:', error);
      }
      
      if (this.isMonitoring) {
        setTimeout(assessQuality, this.qualityCheckInterval);
      }
    };
    
    assessQuality();
  }

  /**
   * Get current network quality
   */
  public getCurrentNetworkQuality(): NetworkQuality | null {
    return this.currentNetworkQuality;
  }

  /**
   * Get streaming recommendations based on current network
   */
  public getStreamingRecommendations(): ConnectivityRecommendations {
    const quality = this.currentNetworkQuality;
    
    if (!quality || quality.type === 'offline') {
      return this.getOfflineRecommendations();
    }

    switch (quality.type) {
      case 'excellent':
        return {
          recommendedQuality: 'high',
          enableAdaptive: true,
          bufferConfig: {
            minBuffer: 1500,
            maxBuffer: 8000,
            playbackBuffer: 1000,
            rebufferBuffer: 2000,
          },
          preloadStrategy: 'aggressive',
          retryConfig: {
            maxAttempts: 3,
            baseDelay: 1000,
            maxDelay: 5000,
          },
        };

      case 'good':
        return {
          recommendedQuality: 'medium',
          enableAdaptive: true,
          bufferConfig: {
            minBuffer: 2000,
            maxBuffer: 6000,
            playbackBuffer: 1500,
            rebufferBuffer: 2500,
          },
          preloadStrategy: 'conservative',
          retryConfig: {
            maxAttempts: 4,
            baseDelay: 1500,
            maxDelay: 8000,
          },
        };

      case 'fair':
        return {
          recommendedQuality: 'low',
          enableAdaptive: false,
          bufferConfig: {
            minBuffer: 3000,
            maxBuffer: 8000,
            playbackBuffer: 2000,
            rebufferBuffer: 3000,
          },
          preloadStrategy: 'conservative',
          retryConfig: {
            maxAttempts: 5,
            baseDelay: 2000,
            maxDelay: 10000,
          },
        };

      case 'poor':
        return {
          recommendedQuality: 'low',
          enableAdaptive: false,
          bufferConfig: {
            minBuffer: 5000,
            maxBuffer: 10000,
            playbackBuffer: 3000,
            rebufferBuffer: 4000,
          },
          preloadStrategy: 'disabled',
          retryConfig: {
            maxAttempts: 6,
            baseDelay: 3000,
            maxDelay: 15000,
          },
        };

      default:
        return this.getDefaultRecommendations();
    }
  }

  /**
   * Get offline recommendations
   */
  private getOfflineRecommendations(): ConnectivityRecommendations {
    return {
      recommendedQuality: 'low',
      enableAdaptive: false,
      bufferConfig: {
        minBuffer: 10000,
        maxBuffer: 15000,
        playbackBuffer: 5000,
        rebufferBuffer: 7000,
      },
      preloadStrategy: 'disabled',
      retryConfig: {
        maxAttempts: 10,
        baseDelay: 5000,
        maxDelay: 30000,
      },
    };
  }

  /**
   * Get default recommendations
   */
  private getDefaultRecommendations(): ConnectivityRecommendations {
    return {
      recommendedQuality: 'medium',
      enableAdaptive: true,
      bufferConfig: {
        minBuffer: 2000,
        maxBuffer: 6000,
        playbackBuffer: 1500,
        rebufferBuffer: 2500,
      },
      preloadStrategy: 'conservative',
      retryConfig: {
        maxAttempts: 3,
        baseDelay: 2000,
        maxDelay: 8000,
      },
    };
  }

  /**
   * Test streaming connectivity with a specific video
   */
  public async testStreamingConnectivity(videoUrl: string): Promise<{
    success: boolean;
    latency: number;
    throughput?: number;
    error?: string;
  }> {
    try {
      const startTime = Date.now();
      
      // Test basic connectivity
      const response = await fetch(videoUrl, {
        method: 'HEAD',
        timeout: 10000,
      });
      
      const latency = Date.now() - startTime;
      
      if (response.ok) {
        // Calculate approximate throughput if available
        const contentLength = response.headers.get('content-length');
        const throughput = contentLength ? parseInt(contentLength) / latency * 1000 : undefined;
        
        return {
          success: true,
          latency,
          throughput,
        };
      } else {
        return {
          success: false,
          latency,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        latency: 0,
        error: error.message,
      };
    }
  }

  /**
   * Handle streaming errors with intelligent recovery
   */
  public async handleStreamingError(
    errorType: string,
    errorMessage: string,
    retryAttempt: number = 0
  ): Promise<{
    shouldRetry: boolean;
    retryDelay: number;
    recommendedAction: string;
    fallbackQuality?: string;
  }> {
    const quality = this.currentNetworkQuality;
    const recommendations = this.getStreamingRecommendations();
    
    Logger.error('VideoConnectivityManager', 'Handling streaming error:', {
      errorType,
      errorMessage,
      retryAttempt,
      networkQuality: quality?.type,
    });

    // Network-related errors
    if (errorType.includes('network') || errorMessage.includes('network')) {
      if (quality?.type === 'offline') {
        return {
          shouldRetry: true,
          retryDelay: 10000, // Wait 10 seconds for network recovery
          recommendedAction: 'wait_for_network',
        };
      }
      
      if (retryAttempt < recommendations.retryConfig.maxAttempts) {
        return {
          shouldRetry: true,
          retryDelay: Math.min(
            recommendations.retryConfig.baseDelay * Math.pow(2, retryAttempt),
            recommendations.retryConfig.maxDelay
          ),
          recommendedAction: 'retry_with_backoff',
          fallbackQuality: this.getFallbackQuality(quality),
        };
      }
    }

    // Buffer-related errors
    if (errorType.includes('buffer') || errorMessage.includes('buffer')) {
      return {
        shouldRetry: true,
        retryDelay: 2000,
        recommendedAction: 'increase_buffer_and_lower_quality',
        fallbackQuality: this.getFallbackQuality(quality),
      };
    }

    // Playback errors
    if (errorType.includes('playback') || errorMessage.includes('codec')) {
      return {
        shouldRetry: true,
        retryDelay: 1000,
        recommendedAction: 'try_fallback_format',
      };
    }

    // Default: retry with exponential backoff
    if (retryAttempt < recommendations.retryConfig.maxAttempts) {
      return {
        shouldRetry: true,
        retryDelay: Math.min(
          recommendations.retryConfig.baseDelay * Math.pow(2, retryAttempt),
          recommendations.retryConfig.maxDelay
        ),
        recommendedAction: 'generic_retry',
      };
    }

    return {
      shouldRetry: false,
      retryDelay: 0,
      recommendedAction: 'show_error',
    };
  }

  /**
   * Get fallback quality based on current network
   */
  private getFallbackQuality(quality: NetworkQuality | null): string {
    if (!quality) return 'low';
    
    switch (quality.type) {
      case 'excellent':
      case 'good':
        return 'medium';
      case 'fair':
        return 'low';
      case 'poor':
      case 'offline':
        return 'low';
      default:
        return 'low';
    }
  }

  /**
   * Show user-friendly connectivity status
   */
  public showConnectivityStatus(): void {
    const quality = this.currentNetworkQuality;
    
    if (!quality) {
      Alert.alert('Connection Status', 'Checking network connection...');
      return;
    }

    let message: string;
    let title = 'Network Status';

    switch (quality.type) {
      case 'excellent':
        message = '🟢 Excellent connection\nHigh quality streaming available';
        break;
      case 'good':
        message = '🟡 Good connection\nStandard quality recommended';
        break;
      case 'fair':
        message = '🟠 Fair connection\nLower quality recommended for smooth playback';
        break;
      case 'poor':
        message = '🔴 Poor connection\nStreaming may be interrupted';
        break;
      case 'offline':
        message = '❌ No connection\nPlease check your internet connection';
        title = 'Connection Error';
        break;
      default:
        message = '❓ Connection status unknown';
    }

    if (quality.saveData) {
      message += '\n\n💾 Data saver mode detected';
    }

    Alert.alert(title, message);
  }

  /**
   * Register for connectivity updates
   */
  public addConnectivityListener(listener: (quality: NetworkQuality) => void): () => void {
    this.connectivityListeners.add(listener);
    
    // Immediately notify with current state
    if (this.currentNetworkQuality) {
      listener(this.currentNetworkQuality);
    }
    
    // Return unsubscribe function
    return () => {
      this.connectivityListeners.delete(listener);
    };
  }

  /**
   * Get detailed connectivity metrics
   */
  public getConnectivityMetrics(): {
    quality: NetworkQuality | null;
    recommendations: ConnectivityRecommendations;
    listeners: number;
    lastCheck: number;
  } {
    return {
      quality: this.currentNetworkQuality,
      recommendations: this.getStreamingRecommendations(),
      listeners: this.connectivityListeners.size,
      lastCheck: this.lastQualityCheck,
    };
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.isMonitoring = false;
    this.connectivityListeners.clear();
    Logger.debug('VideoConnectivityManager', 'Cleaned up resources');
  }
}

export default VideoConnectivityManager;