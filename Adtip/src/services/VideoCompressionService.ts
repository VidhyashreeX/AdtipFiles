import {Video} from 'react-native-compressor';
import {Platform} from 'react-native';
import RNFS from 'react-native-fs';

export interface VideoCompressionOptions {
  quality?: 'low' | 'medium' | 'high';
  bitrate?: number;
  maxSize?: number; // in MB
  outputFormat?: 'mp4' | 'mov';
  compressionMethod?: 'auto' | 'manual';
}

export interface VideoQuality {
  resolution: string;
  bitrate: number;
  suffix: string;
  maxWidth: number;
  maxHeight: number;
}

export interface CompressedVideoResult {
  originalUri: string;
  compressedUri: string;
  hlsManifestUri?: string;
  qualities: {
    [key: string]: {
      uri: string;
      size: number;
      bitrate: number;
      resolution: string;
    };
  };
  totalSize: number;
  compressionRatio: number;
  duration?: number;
}

class VideoCompressionService {
  // Define quality presets for adaptive streaming
  private readonly QUALITY_PRESETS: VideoQuality[] = [
    {
      resolution: '240p',
      bitrate: 400000, // 400 kbps
      suffix: '_240p',
      maxWidth: 426,
      maxHeight: 240,
    },
    {
      resolution: '360p',
      bitrate: 800000, // 800 kbps
      suffix: '_360p',
      maxWidth: 640,
      maxHeight: 360,
    },
    {
      resolution: '480p',
      bitrate: 1200000, // 1.2 Mbps
      suffix: '_480p',
      maxWidth: 854,
      maxHeight: 480,
    },
    {
      resolution: '720p',
      bitrate: 2500000, // 2.5 Mbps
      suffix: '_720p',
      maxWidth: 1280,
      maxHeight: 720,
    },
    {
      resolution: '1080p',
      bitrate: 5000000, // 5 Mbps
      suffix: '_1080p',
      maxWidth: 1920,
      maxHeight: 1080,
    },
  ];

  /**
   * Get video information
   */
  private async getVideoInfo(uri: string): Promise<any> {
    try {
      const stats = await RNFS.stat(uri);
      return {
        size: stats.size,
        path: uri,
      };
    } catch (error) {
      console.error('Error getting video info:', error);
      throw error;
    }
  }

  /**
   * Compress video to single quality
   */
  async compressSingleVideo(
    uri: string,
    options: VideoCompressionOptions = {},
  ): Promise<string> {
    try {
      const {
        quality = 'medium',
        bitrate,
        maxSize,
        outputFormat = 'mp4',
        compressionMethod = 'auto',
      } = options;

      let compressionOptions: any = {
        compressionMethod,
        minimumFileSizeForCompress: 1, // Always compress
      };

      if (compressionMethod === 'manual' && bitrate) {
        compressionOptions.bitrate = bitrate;
      } else {
        // Use preset quality
        switch (quality) {
          case 'low':
            compressionOptions.compressionMethod = 'manual';
            compressionOptions.bitrate = 500000; // 500 kbps
            break;
          case 'medium':
            compressionOptions.compressionMethod = 'manual';
            compressionOptions.bitrate = 1000000; // 1 Mbps
            break;
          case 'high':
            compressionOptions.compressionMethod = 'manual';
            compressionOptions.bitrate = 2000000; // 2 Mbps
            break;
        }
      }

      const compressedUri = await Video.compress(uri, compressionOptions);

      // Check if we need to compress further due to size constraint
      if (maxSize) {
        const compressedInfo = await this.getVideoInfo(compressedUri);
        const sizeInMB = compressedInfo.size / (1024 * 1024);

        if (sizeInMB > maxSize) {
          // Compress again with lower bitrate
          const lowerBitrate = Math.floor(
            (compressionOptions.bitrate || 1000000) * 0.7,
          );
          const secondCompressionOptions = {
            ...compressionOptions,
            bitrate: lowerBitrate,
            compressionMethod: 'manual',
          };

          const finalCompressedUri = await Video.compress(
            compressedUri,
            secondCompressionOptions,
          );

          // Clean up intermediate file
          try {
            await RNFS.unlink(compressedUri);
          } catch (e) {
            console.warn('Failed to clean up intermediate file:', e);
          }

          return finalCompressedUri;
        }
      }

      return compressedUri;
    } catch (error) {
      console.error('Error compressing video:', error);
      throw error;
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

      // Create HLS manifest
      const hlsManifestUri = await this.createHLSManifest(qualities);

      return {
        originalUri: uri,
        compressedUri: qualities['480p']?.uri || qualities['360p']?.uri || uri,
        hlsManifestUri,
        qualities,
        totalSize: totalCompressedSize,
        compressionRatio: originalInfo.size / totalCompressedSize,
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
   * Compress video for TipTube (longer videos with adaptive streaming)
   */
  async compressForTipTube(
    uri: string,
    options: VideoCompressionOptions = {},
  ): Promise<CompressedVideoResult> {
    const targetQualities = ['360p', '480p', '720p', '1080p'];
    return this.createAdaptiveVersions(uri, targetQualities);
  }

  /**
   * Compress video for TipShorts (short videos, single quality optimized)
   */
  async compressForTipShorts(
    uri: string,
    options: VideoCompressionOptions = {},
  ): Promise<string> {
    return this.compressSingleVideo(uri, {
      quality: 'medium',
      maxSize: 50, // 50MB max for shorts
      ...options,
    });
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
   * Get compression progress (mock implementation)
   */
  onCompressionProgress(callback: (progress: number) => void): void {
    // This is a mock implementation as react-native-compressor doesn't provide progress
    // You might need to implement this differently or use a different library
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      callback(progress);
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 500);
  }
}

export default new VideoCompressionService();