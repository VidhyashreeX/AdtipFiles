import { Video } from 'react-native-compressor';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

export interface VideoCompressionOptions {
  quality?: 'low' | 'medium' | 'high';
  compressionMethod?: 'auto' | 'manual';
  maxSize?: number; // Maximum dimension (width or height)
  bitrate?: number; // Only used with manual compression
  minimumFileSizeForCompress?: number; // Minimum file size in MB to compress
}

export interface CompressedVideoResult {
  originalUri: string;
  compressedUri: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  success: boolean;
  error?: string;
}

class VideoCompressionService {
  // Quality presets based on react-native-compressor documentation
  private readonly QUALITY_SETTINGS = {
    low: {
      maxSize: 480, // 480p max dimension
      bitrate: 500000, // 500 kbps
      minimumFileSizeForCompress: 5, // 5MB
    },
    medium: {
      maxSize: 720, // 720p max dimension
      bitrate: 1000000, // 1 Mbps
      minimumFileSizeForCompress: 10, // 10MB
    },
    high: {
      maxSize: 1080, // 1080p max dimension
      bitrate: 2000000, // 2 Mbps
      minimumFileSizeForCompress: 20, // 20MB
    },
  };

  /**
   * Get video file information
   */
  private async getVideoInfo(uri: string): Promise<{ size: number; path: string; exists: boolean }> {
    try {
      const exists = await RNFS.exists(uri);
      if (!exists) {
        throw new Error(`Video file does not exist: ${uri}`);
      }

      const stats = await RNFS.stat(uri);
      return {
        size: stats.size,
        path: uri,
        exists: true,
      };
    } catch (error) {
      console.error('[VideoCompression] Error getting video info:', error);
      throw error;
    }
  }

  /**
   * Compress video using react-native-compressor (CORRECT IMPLEMENTATION)
   */
  async compressVideo(
    uri: string,
    options: VideoCompressionOptions = {},
    onProgress?: (progress: number) => void
  ): Promise<CompressedVideoResult> {
    try {
      console.log('[VideoCompression] Starting compression for:', uri);

      // Get original video info
      const originalInfo = await this.getVideoInfo(uri);
      console.log('[VideoCompression] Original video info:', originalInfo);

      const {
        quality = 'medium',
        compressionMethod = 'auto', // Use 'auto' for WhatsApp-like compression
        maxSize,
        bitrate,
        minimumFileSizeForCompress = 0, // Always compress by default
      } = options;

      // Get quality settings
      const qualitySettings = this.QUALITY_SETTINGS[quality];

      // Prepare compression options according to react-native-compressor docs
      let compressionOptions: any = {
        compressionMethod,
        minimumFileSizeForCompress, // in MB
      };

      // Only add manual settings if using manual compression
      if (compressionMethod === 'manual') {
        compressionOptions.maxSize = maxSize || qualitySettings.maxSize;
        compressionOptions.bitrate = bitrate || qualitySettings.bitrate;
      }

      console.log('[VideoCompression] Compression options:', compressionOptions);

      // Compress video using react-native-compressor
      const compressedUri = await Video.compress(
        uri,
        compressionOptions,
        onProgress // Progress callback
      );

      console.log('[VideoCompression] Compression completed:', compressedUri);

      // Get compressed video info
      const compressedInfo = await this.getVideoInfo(compressedUri);
      console.log('[VideoCompression] Compressed video info:', compressedInfo);

      const result: CompressedVideoResult = {
        originalUri: uri,
        compressedUri,
        originalSize: originalInfo.size,
        compressedSize: compressedInfo.size,
        compressionRatio: originalInfo.size / compressedInfo.size,
        success: true,
      };

      console.log('[VideoCompression] Compression result:', result);
      return result;

    } catch (error) {
      console.error('[VideoCompression] Compression failed:', error);

      // Return error result
      const originalInfo = await this.getVideoInfo(uri).catch(() => ({ size: 0, path: uri, exists: false }));

      return {
        originalUri: uri,
        compressedUri: uri, // Fallback to original
        originalSize: originalInfo.size,
        compressedSize: originalInfo.size,
        compressionRatio: 1,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown compression error',
      };
    }
  }

  /**
   * Create multiple quality versions for adaptive streaming
   */
  async createAdaptiveVersions(
    uri: string,
    targetQualities: string[] = ['360p', '480p', '720p'],
  ): Promise<CompressedVideoResult> {
    try {
      const originalInfo = await this.getVideoInfo(uri);
      const qualities: CompressedVideoResult['qualities'] = {};

      // Filter quality presets based on target qualities
      const selectedPresets = this.QUALITY_PRESETS.filter(preset =>
        targetQualities.includes(preset.resolution),
      );

      let totalCompressedSize = 0;

      // Compress for each quality
      for (const preset of selectedPresets) {
        try {
          const compressedUri = await Video.compress(uri, {
            compressionMethod: 'manual',
            bitrate: preset.bitrate,
            minimumFileSizeForCompress: 1,
          });

          const compressedInfo = await this.getVideoInfo(compressedUri);

          qualities[preset.resolution] = {
            uri: compressedUri,
            size: compressedInfo.size,
            bitrate: preset.bitrate,
            resolution: preset.resolution,
          };

          totalCompressedSize += compressedInfo.size;
        } catch (error) {
          console.error(
            `Error compressing video for ${preset.resolution}:`,
            error,
          );
          // Continue with other qualities even if one fails
        }
      }

      // Ensure we have at least one quality
      if (Object.keys(qualities).length === 0) {
        console.warn('[VideoCompression] No qualities were successfully compressed');
        throw new Error('Video compression failed for all target qualities');
      }

      // Create HLS manifest
      const hlsManifestUri = await this.createHLSManifest(qualities);

      // Select the best available quality as the main compressed URI
      const compressedUri = qualities['480p']?.uri ||
                           qualities['360p']?.uri ||
                           qualities['720p']?.uri ||
                           Object.values(qualities)[0]?.uri ||
                           uri;

      console.log('[VideoCompression] Adaptive compression complete:', {
        originalSize: originalInfo.size,
        totalCompressedSize,
        qualitiesCreated: Object.keys(qualities),
        selectedCompressedUri: compressedUri
      });

      return {
        originalUri: uri,
        compressedUri,
        hlsManifestUri,
        qualities,
        totalSize: totalCompressedSize,
        compressionRatio: totalCompressedSize > 0 ? originalInfo.size / totalCompressedSize : 1,
      };
    } catch (error) {
      console.error('Error creating adaptive versions:', error);
      throw error;
    }
  }

  /**
   * Create HLS manifest file
   */
  private async createHLSManifest(
    qualities: CompressedVideoResult['qualities'],
  ): Promise<string> {
    try {
      const manifestContent = this.generateM3U8Manifest(qualities);
      
      const manifestPath = `${
        Platform.OS === 'ios' ? RNFS.DocumentDirectoryPath : RNFS.ExternalDirectoryPath
      }/hls_manifest_${Date.now()}.m3u8`;

      await RNFS.writeFile(manifestPath, manifestContent, 'utf8');

      return manifestPath;
    } catch (error) {
      console.error('Error creating HLS manifest:', error);
      throw error;
    }
  }

  /**
   * Generate M3U8 manifest content
   */
  private generateM3U8Manifest(
    qualities: CompressedVideoResult['qualities'],
  ): string {
    let manifest = '#EXTM3U\n#EXT-X-VERSION:3\n\n';

    // Sort qualities by bitrate (ascending)
    const sortedQualities = Object.entries(qualities).sort(
      ([, a], [, b]) => a.bitrate - b.bitrate,
    );

    for (const [resolution, quality] of sortedQualities) {
      const width = this.getWidthFromResolution(resolution);
      const height = this.getHeightFromResolution(resolution);

      manifest += `#EXT-X-STREAM-INF:BANDWIDTH=${quality.bitrate},RESOLUTION=${width}x${height}\n`;
      manifest += `${quality.uri}\n\n`;
    }

    return manifest;
  }

  /**
   * Get width from resolution string
   */
  private getWidthFromResolution(resolution: string): number {
    const preset = this.QUALITY_PRESETS.find(p => p.resolution === resolution);
    return preset?.maxWidth || 640;
  }

  /**
   * Get height from resolution string
   */
  private getHeightFromResolution(resolution: string): number {
    const preset = this.QUALITY_PRESETS.find(p => p.resolution === resolution);
    return preset?.maxHeight || 360;
  }

  /**
   * Compress video for TipTube (longer videos) - CORRECTED IMPLEMENTATION
   */
  async compressForTipTube(
    uri: string,
    options: VideoCompressionOptions = {},
    onProgress?: (progress: number) => void
  ): Promise<CompressedVideoResult> {
    console.log('[VideoCompression] Starting TipTube compression for:', uri);

    // TipTube videos should be high quality but compressed
    const tipTubeOptions: VideoCompressionOptions = {
      quality: 'high',
      compressionMethod: 'auto', // Use WhatsApp-like auto compression
      minimumFileSizeForCompress: 0, // Always compress
      ...options, // Allow overrides
    };

    return this.compressVideo(uri, tipTubeOptions, onProgress);
  }

  /**
   * Compress video for TipShorts (short videos) - CORRECTED IMPLEMENTATION
   */
  async compressForTipShorts(
    uri: string,
    options: VideoCompressionOptions = {},
    onProgress?: (progress: number) => void
  ): Promise<CompressedVideoResult> {
    console.log('[VideoCompression] Starting TipShorts compression for:', uri);

    // TipShorts should be medium quality and smaller size
    const tipShortsOptions: VideoCompressionOptions = {
      quality: 'medium',
      compressionMethod: 'auto', // Use WhatsApp-like auto compression
      minimumFileSizeForCompress: 0, // Always compress
      ...options, // Allow overrides
    };

    return this.compressVideo(uri, tipShortsOptions, onProgress);
  }

  /**
   * Get optimal quality based on file size and duration
   */
  getOptimalQuality(fileSizeInMB: number, durationInSeconds?: number): string {
    if (fileSizeInMB < 10) return 'high';
    if (fileSizeInMB < 50) return 'medium';
    return 'low';
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(uris: string[]): Promise<void> {
    for (const uri of uris) {
      try {
        await RNFS.unlink(uri);
      } catch (error) {
        console.warn('Failed to cleanup file:', uri, error);
      }
    }
  }

  /**
   * Test compression with a simple auto compression
   */
  async testCompression(uri: string, onProgress?: (progress: number) => void): Promise<CompressedVideoResult> {
    console.log('[VideoCompression] Testing compression with auto method for:', uri);

    return this.compressVideo(uri, {
      compressionMethod: 'auto',
      minimumFileSizeForCompress: 0,
    }, onProgress);
  }

  /**
   * Simple compression without any custom options (for debugging)
   */
  async simpleCompress(uri: string, onProgress?: (progress: number) => void): Promise<string> {
    try {
      console.log('[VideoCompression] Simple compression for:', uri);

      // Use the most basic compression options
      const result = await Video.compress(uri, {}, onProgress);

      console.log('[VideoCompression] Simple compression result:', result);
      return result;
    } catch (error) {
      console.error('[VideoCompression] Simple compression failed:', error);
      throw error;
    }
  }
}

export default new VideoCompressionService();