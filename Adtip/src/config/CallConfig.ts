/**
 * Call Configuration - Feature flags and settings for call system
 */

export interface CallSystemConfig {
  // Feature flags
  useSimplifiedFlow: boolean;
  enableLegacyListeners: boolean;
  enableUnifiedCallService: boolean;
  enableCallSignalingService: boolean;
  enableFirebaseServiceListeners: boolean;

  // UI Configuration
  forceCustomUI: boolean;
  enableCallKeep: boolean;

  // Debug settings
  enableDebugLogs: boolean;
  enableVerboseLogging: boolean;
}

// Default configuration - simplified flow enabled by default
export const DEFAULT_CALL_CONFIG: CallSystemConfig = {
  useSimplifiedFlow: true,
  enableLegacyListeners: false,
  enableUnifiedCallService: false,
  enableCallSignalingService: false,
  enableFirebaseServiceListeners: false,

  // Force custom UI for better reliability - CallKeep often fails
  forceCustomUI: true,
  enableCallKeep: false,

  enableDebugLogs: __DEV__,
  enableVerboseLogging: false,
};

// Global configuration instance
let callConfig: CallSystemConfig = { ...DEFAULT_CALL_CONFIG };

export const CallConfig = {
  /**
   * Get current configuration
   */
  get(): CallSystemConfig {
    return { ...callConfig };
  },
  
  /**
   * Update configuration
   */
  update(newConfig: Partial<CallSystemConfig>): void {
    callConfig = { ...callConfig, ...newConfig };
    console.log('[CallConfig] Configuration updated:', callConfig);
  },
  
  /**
   * Reset to default configuration
   */
  reset(): void {
    callConfig = { ...DEFAULT_CALL_CONFIG };
    console.log('[CallConfig] Configuration reset to defaults');
  },
  
  /**
   * Check if simplified flow is enabled
   */
  isSimplifiedFlow(): boolean {
    return callConfig.useSimplifiedFlow;
  },
  
  /**
   * Check if legacy listeners should be enabled
   */
  shouldEnableLegacyListeners(): boolean {
    return callConfig.enableLegacyListeners && !callConfig.useSimplifiedFlow;
  },
  
  /**
   * Check if specific service should be enabled
   */
  shouldEnableService(service: 'unified' | 'signaling' | 'firebase'): boolean {
    switch (service) {
      case 'unified':
        return callConfig.enableUnifiedCallService;
      case 'signaling':
        return callConfig.enableCallSignalingService;
      case 'firebase':
        return callConfig.enableFirebaseServiceListeners;
      default:
        return false;
    }
  },
  
  /**
   * Enable simplified flow and disable legacy services
   */
  enableSimplifiedFlow(): void {
    this.update({
      useSimplifiedFlow: true,
      enableLegacyListeners: false,
      enableUnifiedCallService: false,
      enableCallSignalingService: false,
      enableFirebaseServiceListeners: false,
    });
  },
  
  /**
   * Enable legacy flow and disable simplified services
   */
  enableLegacyFlow(): void {
    this.update({
      useSimplifiedFlow: false,
      enableLegacyListeners: true,
      enableUnifiedCallService: true,
      enableCallSignalingService: true,
      enableFirebaseServiceListeners: true,
    });
  },

  /**
   * Check if custom UI should be forced (bypassing CallKeep)
   */
  shouldForceCustomUI(): boolean {
    return callConfig.forceCustomUI;
  },

  /**
   * Check if CallKeep should be used
   */
  shouldUseCallKeep(): boolean {
    return callConfig.enableCallKeep && !callConfig.forceCustomUI;
  },
};

export default CallConfig;
