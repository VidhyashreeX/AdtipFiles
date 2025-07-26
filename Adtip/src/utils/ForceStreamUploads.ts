/**
 * Utility to force Stream uploads and disable R2 fallback for testing
 * This ensures that all uploads go directly to Cloudflare Stream
 */

import { UploadConfigManager } from '../config/UploadConfig';

export class ForceStreamUploads {
  /**
   * Force all uploads to use Stream (100%) and disable R2 fallback
   * Use this for testing to ensure Stream uploads are working
   */
  static enableStreamOnly(): void {
    console.log('[ForceStreamUploads] Forcing Stream uploads to 100% and disabling R2 fallback');
    
    UploadConfigManager.update({
      useStreamUploads: true,
      streamUploadPercentage: 100,
      enableR2Fallback: false, // Disable fallback to force Stream-only
      preferStreamForTipShorts: true,
      preferStreamForTipTube: true,
      preferStreamForCampaigns: true,
      enableUploadDebugLogs: true,
    });
    
    console.log('[ForceStreamUploads] Stream-only configuration applied');
    console.log('[ForceStreamUploads] Current config:', UploadConfigManager.getConfig());
  }
  
  /**
   * Enable Stream uploads with R2 fallback (production mode)
   */
  static enableStreamWithFallback(): void {
    console.log('[ForceStreamUploads] Enabling Stream uploads with R2 fallback');
    
    UploadConfigManager.update({
      useStreamUploads: true,
      streamUploadPercentage: 100,
      enableR2Fallback: true, // Enable fallback for production
      preferStreamForTipShorts: true,
      preferStreamForTipTube: true,
      preferStreamForCampaigns: true,
      enableUploadDebugLogs: true,
    });
    
    console.log('[ForceStreamUploads] Stream with fallback configuration applied');
    console.log('[ForceStreamUploads] Current config:', UploadConfigManager.getConfig());
  }
  
  /**
   * Test upload method selection for different content types
   */
  static testUploadMethodSelection(): void {
    console.log('[ForceStreamUploads] Testing upload method selection...');
    
    const contentTypes: Array<'tipshorts' | 'tiptube' | 'campaign'> = ['tipshorts', 'tiptube', 'campaign'];
    
    contentTypes.forEach(contentType => {
      const method = UploadConfigManager.getUploadMethod(contentType);
      console.log(`[ForceStreamUploads] ${contentType} -> ${method}`);
    });
  }
  
  /**
   * Log current upload configuration
   */
  static logCurrentConfig(): void {
    const config = UploadConfigManager.getConfig();
    console.log('[ForceStreamUploads] Current upload configuration:', {
      useStreamUploads: config.useStreamUploads,
      streamUploadPercentage: config.streamUploadPercentage,
      enableR2Fallback: config.enableR2Fallback,
      preferStreamForTipShorts: config.preferStreamForTipShorts,
      preferStreamForTipTube: config.preferStreamForTipTube,
      preferStreamForCampaigns: config.preferStreamForCampaigns,
      enableUploadDebugLogs: config.enableUploadDebugLogs,
    });
  }
}

// Auto-enable Stream uploads when this module is imported
// This ensures Stream uploads are always enabled in development
if (__DEV__) {
  console.log('[ForceStreamUploads] Development mode detected, enabling Stream uploads');
  ForceStreamUploads.enableStreamWithFallback();
  ForceStreamUploads.testUploadMethodSelection();
}
