// src/utils/CloudflareTestUtil.ts
// Utility for testing Cloudflare R2 configuration and connectivity

import CloudflareUploadService from '../services/CloudflareUploadService';
import { CLOUDFLARE_R2_CONFIG } from '../config/cloudflareConfig';

export interface CloudflareTestResult {
  configValid: boolean;
  connectionSuccess: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

class CloudflareTestUtil {
  
  /**
   * Comprehensive test of Cloudflare R2 setup
   */
  static async runFullTest(): Promise<CloudflareTestResult> {
    const result: CloudflareTestResult = {
      configValid: false,
      connectionSuccess: false,
      errors: [],
      warnings: [],
      suggestions: []
    };

    console.log('[CloudflareTest] Starting comprehensive Cloudflare R2 test...');

    // Test 1: Configuration Validation
    try {
      this.validateConfiguration(result);
    } catch (error: any) {
      result.errors.push(`Configuration error: ${error.message}`);
    }

    // Test 2: Connection Test
    if (result.configValid) {
      try {
        result.connectionSuccess = await CloudflareUploadService.testConnection();
        if (!result.connectionSuccess) {
          result.errors.push('Failed to connect to Cloudflare R2');
        }
      } catch (error: any) {
        result.errors.push(`Connection test failed: ${error.message}`);
      }
    }

    // Test 3: Configuration Suggestions
    this.addConfigSuggestions(result);

    console.log('[CloudflareTest] Test completed:', result);
    return result;
  }

  /**
   * Validate configuration values
   */
  private static validateConfiguration(result: CloudflareTestResult): void {
    const config = CLOUDFLARE_R2_CONFIG;

    // Check required fields
    const requiredFields = [
      { key: 'accountId', value: config.accountId },
      { key: 'accessKeyId', value: config.accessKeyId },
      { key: 'secretAccessKey', value: config.secretAccessKey },
      { key: 'bucketName', value: config.bucketName },
      { key: 'publicUrl', value: config.publicUrl }
    ];

    for (const field of requiredFields) {
      if (!field.value || field.value.includes('your-')) {
        result.errors.push(`${field.key} is not configured properly`);
        return;
      }
    }

    // Validate specific formats
    if (!/^[a-f0-9]{32}$/.test(config.accountId.replace(/-/g, ''))) {
      result.warnings.push('Account ID format looks incorrect (should be 32 hex characters)');
    }

    if (!/^[A-Z0-9]{20}$/.test(config.accessKeyId)) {
      result.warnings.push('Access Key ID format looks incorrect (should be 20 uppercase alphanumeric)');
    }

    if (config.secretAccessKey.length < 20) {
      result.warnings.push('Secret Access Key seems too short');
    }

    if (!config.publicUrl.startsWith('https://')) {
      result.warnings.push('Public URL should use HTTPS');
    }

    result.configValid = result.errors.length === 0;
  }

  /**
   * Add configuration improvement suggestions
   */
  private static addConfigSuggestions(result: CloudflareTestResult): void {
    const config = CLOUDFLARE_R2_CONFIG;

    if (config.publicUrl.includes('r2.cloudflarestorage.com')) {
      result.suggestions.push('Consider setting up a custom domain for better branding and performance');
    }

    if (config.accessKeyId.includes('process.env') || config.secretAccessKey.includes('process.env')) {
      result.suggestions.push('Use environment variables for credentials in production');
    }

    result.suggestions.push('Test file uploads with different file sizes and formats');
    result.suggestions.push('Monitor upload performance and adjust timeout settings if needed');
    result.suggestions.push('Set up proper error tracking for production uploads');
  }

  /**
   * Quick connectivity test
   */
  static async quickConnectivityTest(): Promise<boolean> {
    try {
      console.log('[CloudflareTest] Quick connectivity test...');
      return await CloudflareUploadService.testConnection();
    } catch (error) {
      console.error('[CloudflareTest] Quick test failed:', error);
      return false;
    }
  }

  /**
   * Generate test upload configuration
   */
  static getTestUploadConfig() {
    return CloudflareUploadService.getUploadConfig();
  }

  /**
   * Validate file before upload
   */
  static async validateTestFile(filePath: string, isVideo: boolean = true): Promise<{valid: boolean, errors: string[]}> {
    const result = {valid: true, errors: [] as string[]};
    
    try {
      const config = this.getTestUploadConfig();
      const maxSize = isVideo ? config.limits.VIDEO_MAX : config.limits.THUMBNAIL_MAX;
      const allowedFormats = isVideo ? config.supportedFormats.VIDEO : config.supportedFormats.IMAGE;
      
      // Note: File validation logic would go here
      // This is a simplified version for demonstration
      
      console.log('[CloudflareTest] File validation config:', {
        maxSize: `${maxSize / (1024 * 1024)}MB`,
        allowedFormats
      });
      
    } catch (error: any) {
      result.valid = false;
      result.errors.push(`Validation error: ${error.message}`);
    }
    
    return result;
  }

  /**
   * Display configuration status
   */
  static logConfigurationStatus(): void {
    const config = CLOUDFLARE_R2_CONFIG;
    
    console.log('[CloudflareTest] Configuration Status:');
    console.log('├── Account ID:', config.accountId.substring(0, 8) + '...');
    console.log('├── Access Key:', config.accessKeyId.substring(0, 8) + '...');
    console.log('├── Bucket:', config.bucketName);
    console.log('├── Region:', config.region);
    console.log('└── Public URL:', config.publicUrl);
  }
}

export default CloudflareTestUtil;
