/**
 * Upload Configuration - Feature flags and settings for video upload system
 * Controls whether to use Cloudflare Stream or R2 for video uploads
 */

export interface UploadSystemConfig {
  // Feature flags for upload methods
  useStreamUploads: boolean;
  streamUploadPercentage: number; // 0-100, percentage of users to use Stream
  enableR2Fallback: boolean;
  
  // Upload method preferences
  preferStreamForTipShorts: boolean;
  preferStreamForTipTube: boolean;
  preferStreamForCampaigns: boolean;
  
  // Debug and monitoring
  enableUploadDebugLogs: boolean;
  enableUploadAnalytics: boolean;
  trackUploadPerformance: boolean;
}

// Default configuration - Stream enabled at 100%
export const DEFAULT_UPLOAD_CONFIG: UploadSystemConfig = {
  useStreamUploads: true, // Stream enabled
  streamUploadPercentage: 0, // 100% Stream uploads
  enableR2Fallback: true, // Always maintain R2 fallback

  preferStreamForTipShorts: true, // TipShorts benefit most from Stream (mobile data savings)
  preferStreamForTipTube: true, // TipTube can use Stream for better quality
  preferStreamForCampaigns: true, // Campaigns can use Stream for better reach
  
  enableUploadDebugLogs: __DEV__,
  enableUploadAnalytics: true,
  trackUploadPerformance: true,
};

// Current upload configuration (can be updated at runtime)
let uploadConfig: UploadSystemConfig = { ...DEFAULT_UPLOAD_CONFIG };

/**
 * Upload Configuration Manager
 */
export const UploadConfigManager = {
  /**
   * Get current upload configuration
   */
  getConfig(): UploadSystemConfig {
    return { ...uploadConfig };
  },

  /**
   * Update upload configuration
   */
  update(newConfig: Partial<UploadSystemConfig>): void {
    uploadConfig = { ...uploadConfig, ...newConfig };
    console.log('[UploadConfig] Configuration updated:', uploadConfig);
  },

  /**
   * Check if Stream uploads should be used for a specific content type
   */
  shouldUseStreamUpload(contentType: 'tipshorts' | 'tiptube' | 'campaign'): boolean {
    console.log(`[UploadConfig] Checking Stream upload eligibility for ${contentType}`);
    console.log(`[UploadConfig] Current config:`, {
      useStreamUploads: uploadConfig.useStreamUploads,
      streamUploadPercentage: uploadConfig.streamUploadPercentage,
      preferStreamForTipShorts: uploadConfig.preferStreamForTipShorts,
      preferStreamForTipTube: uploadConfig.preferStreamForTipTube,
      preferStreamForCampaigns: uploadConfig.preferStreamForCampaigns
    });

    // If Stream uploads are disabled globally, use R2
    if (!uploadConfig.useStreamUploads) {
      console.log(`[UploadConfig] Stream uploads disabled globally, using R2`);
      return false;
    }

    // Check percentage-based rollout
    const randomPercentage = Math.random() * 100;
    console.log(`[UploadConfig] Random percentage: ${randomPercentage}, threshold: ${uploadConfig.streamUploadPercentage}`);

    if (randomPercentage > uploadConfig.streamUploadPercentage) {
      console.log(`[UploadConfig] Random percentage exceeds threshold, using R2`);
      return false;
    }

    // Check content-specific preferences
    let contentPreference = false;
    switch (contentType) {
      case 'tipshorts':
        contentPreference = uploadConfig.preferStreamForTipShorts;
        break;
      case 'tiptube':
        contentPreference = uploadConfig.preferStreamForTipTube;
        break;
      case 'campaign':
        contentPreference = uploadConfig.preferStreamForCampaigns;
        break;
      default:
        contentPreference = false;
    }

    console.log(`[UploadConfig] Content preference for ${contentType}: ${contentPreference}`);
    console.log(`[UploadConfig] Final decision for ${contentType}: ${contentPreference ? 'Stream' : 'R2'}`);

    return contentPreference;
  },

  /**
   * Check if R2 fallback should be used
   */
  shouldUseR2Fallback(): boolean {
    return uploadConfig.enableR2Fallback;
  },

  /**
   * Enable Stream uploads with specified percentage
   */
  enableStreamUploads(percentage: number = 100): void {
    this.update({
      useStreamUploads: true,
      streamUploadPercentage: Math.max(0, Math.min(100, percentage)),
      preferStreamForTipShorts: true,
      preferStreamForTipTube: true,
      preferStreamForCampaigns: true,
    });
  },

  /**
   * Force Stream uploads for all content types (100%)
   */
  forceStreamUploads(): void {
    this.enableStreamUploads(100);
    console.log('[UploadConfig] Forced Stream uploads to 100% for all content types');
  },

  /**
   * Disable Stream uploads (fallback to R2)
   */
  disableStreamUploads(): void {
    this.update({
      useStreamUploads: false,
      streamUploadPercentage: 0,
      preferStreamForTipShorts: false,
      preferStreamForTipTube: false,
      preferStreamForCampaigns: false,
    });
  },

  /**
   * Enable gradual rollout phases
   */
  setRolloutPhase(phase: 'disabled' | 'testing' | 'partial' | 'full'): void {
    switch (phase) {
      case 'disabled':
        this.disableStreamUploads();
        break;
      case 'testing':
        this.enableStreamUploads(10); // 10% of users
        break;
      case 'partial':
        this.enableStreamUploads(50); // 50% of users
        break;
      case 'full':
        this.enableStreamUploads(100); // 100% of users
        break;
    }
  },

  /**
   * Get upload method for content type
   */
  getUploadMethod(contentType: 'tipshorts' | 'tiptube' | 'campaign'): 'stream' | 'r2' {
    return this.shouldUseStreamUpload(contentType) ? 'stream' : 'r2';
  },

  /**
   * Log upload decision for analytics
   */
  logUploadDecision(contentType: string, method: 'stream' | 'r2', reason: string): void {
    if (uploadConfig.enableUploadDebugLogs) {
      console.log(`[UploadConfig] ${contentType} upload method: ${method} (${reason})`);
    }
    
    if (uploadConfig.enableUploadAnalytics) {
      // Here you could send analytics to your backend
      // Analytics.track('upload_method_selected', { contentType, method, reason });
    }
  },

  /**
   * Reset to default configuration
   */
  reset(): void {
    uploadConfig = { ...DEFAULT_UPLOAD_CONFIG };
    console.log('[UploadConfig] Configuration reset to defaults');
  },
};

// Export current config for easy access
export { uploadConfig };

// Export types
export type UploadMethod = 'stream' | 'r2';
export type ContentType = 'tipshorts' | 'tiptube' | 'campaign';
