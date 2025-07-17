// Upload Debugger Utility
// Use this to test and debug video upload issues

import RNFS from 'react-native-fs';
import { CloudflareUploadService } from '../services/CloudflareUploadService';

export interface UploadDebugInfo {
  filePath: string;
  fileSize: number;
  fileExists: boolean;
  isVideo: boolean;
  contentType: string;
  readableAsBase64: boolean;
  readableAsBinary: boolean;
  uploadMethod: 'direct' | 'presigned';
  uploadSuccess: boolean;
  uploadedSize?: number;
  error?: string;
}

export class UploadDebugger {
  private uploadService: CloudflareUploadService;

  constructor() {
    this.uploadService = new CloudflareUploadService();
  }

  /**
   * Comprehensive debug analysis of a file before upload
   */
  async debugFile(filePath: string): Promise<UploadDebugInfo> {
    const debugInfo: UploadDebugInfo = {
      filePath,
      fileSize: 0,
      fileExists: false,
      isVideo: false,
      contentType: '',
      readableAsBase64: false,
      readableAsBinary: false,
      uploadMethod: 'direct',
      uploadSuccess: false,
    };

    try {
      console.log('[UploadDebugger] Starting debug analysis for:', filePath);

      // Check if file exists
      debugInfo.fileExists = await RNFS.exists(filePath);
      if (!debugInfo.fileExists) {
        debugInfo.error = 'File does not exist';
        return debugInfo;
      }

      // Get file info
      const fileInfo = await RNFS.stat(filePath);
      debugInfo.fileSize = fileInfo.size;

      // Determine file type
      const extension = filePath.split('.').pop()?.toLowerCase() || '';
      debugInfo.isVideo = ['mp4', 'mov', 'avi', 'mkv'].includes(extension);
      debugInfo.contentType = this.getContentType(filePath);

      console.log('[UploadDebugger] File info:', {
        size: debugInfo.fileSize,
        isVideo: debugInfo.isVideo,
        contentType: debugInfo.contentType
      });

      // Test base64 reading
      try {
        const base64Data = await RNFS.readFile(filePath, 'base64');
        debugInfo.readableAsBase64 = base64Data.length > 0;
        console.log('[UploadDebugger] Base64 read successful, length:', base64Data.length);
      } catch (error) {
        console.log('[UploadDebugger] Base64 read failed:', error);
        debugInfo.readableAsBase64 = false;
      }

      // Test binary reading (using fetch)
      try {
        let normalizedPath = filePath;
        if (!filePath.startsWith('file://')) {
          normalizedPath = `file://${filePath}`;
        }
        
        const response = await fetch(normalizedPath);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          debugInfo.readableAsBinary = arrayBuffer.byteLength > 0;
          console.log('[UploadDebugger] Binary read successful, size:', arrayBuffer.byteLength);
        }
      } catch (error) {
        console.log('[UploadDebugger] Binary read failed:', error);
        debugInfo.readableAsBinary = false;
      }

      // Determine upload method
      debugInfo.uploadMethod = debugInfo.isVideo && debugInfo.fileSize > 20 * 1024 * 1024 ? 'presigned' : 'direct';

      console.log('[UploadDebugger] Debug analysis complete:', debugInfo);
      return debugInfo;

    } catch (error) {
      debugInfo.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('[UploadDebugger] Debug analysis failed:', error);
      return debugInfo;
    }
  }

  /**
   * Test upload with detailed logging
   */
  async testUpload(filePath: string, folder: string = 'test'): Promise<UploadDebugInfo> {
    const debugInfo = await this.debugFile(filePath);
    
    if (!debugInfo.fileExists || debugInfo.error) {
      return debugInfo;
    }

    try {
      console.log('[UploadDebugger] Starting test upload...');
      
      const result = await this.uploadService.uploadFile(
        filePath,
        folder,
        `test_${Date.now()}.${filePath.split('.').pop()}`,
        999, // Test user ID
        (progress) => {
          console.log('[UploadDebugger] Upload progress:', progress);
        }
      );

      debugInfo.uploadSuccess = result.success;
      debugInfo.uploadedSize = result.size;
      
      if (!result.success) {
        debugInfo.error = result.error;
      }

      console.log('[UploadDebugger] Upload test complete:', {
        success: debugInfo.uploadSuccess,
        uploadedSize: debugInfo.uploadedSize,
        originalSize: debugInfo.fileSize,
        error: debugInfo.error
      });

    } catch (error) {
      debugInfo.uploadSuccess = false;
      debugInfo.error = error instanceof Error ? error.message : 'Upload test failed';
      console.error('[UploadDebugger] Upload test failed:', error);
    }

    return debugInfo;
  }

  /**
   * Get content type from file extension
   */
  private getContentType(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase();
    
    const contentTypes: { [key: string]: string } = {
      mp4: 'video/mp4',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
      mkv: 'video/x-matroska',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
    };

    return contentTypes[extension || ''] || 'application/octet-stream';
  }

  /**
   * Generate debug report
   */
  generateReport(debugInfo: UploadDebugInfo): string {
    return `
=== UPLOAD DEBUG REPORT ===
File Path: ${debugInfo.filePath}
File Size: ${debugInfo.fileSize} bytes (${(debugInfo.fileSize / 1024 / 1024).toFixed(2)} MB)
File Exists: ${debugInfo.fileExists}
Is Video: ${debugInfo.isVideo}
Content Type: ${debugInfo.contentType}
Readable as Base64: ${debugInfo.readableAsBase64}
Readable as Binary: ${debugInfo.readableAsBinary}
Upload Method: ${debugInfo.uploadMethod}
Upload Success: ${debugInfo.uploadSuccess}
Uploaded Size: ${debugInfo.uploadedSize || 'N/A'} bytes
Error: ${debugInfo.error || 'None'}

=== RECOMMENDATIONS ===
${this.generateRecommendations(debugInfo)}
`;
  }

  private generateRecommendations(debugInfo: UploadDebugInfo): string {
    const recommendations: string[] = [];

    if (!debugInfo.fileExists) {
      recommendations.push('- File does not exist. Check file path and permissions.');
    }

    if (debugInfo.fileSize === 0) {
      recommendations.push('- File is empty. Check if file was properly created/saved.');
    }

    if (!debugInfo.readableAsBase64 && !debugInfo.readableAsBinary) {
      recommendations.push('- File cannot be read. Check file permissions and format.');
    }

    if (debugInfo.isVideo && !debugInfo.readableAsBinary) {
      recommendations.push('- Video file should be readable as binary. Try using fetch() method.');
    }

    if (debugInfo.uploadSuccess && debugInfo.uploadedSize !== debugInfo.fileSize) {
      recommendations.push('- Upload size mismatch. File may be corrupted during upload.');
    }

    if (!debugInfo.uploadSuccess && debugInfo.error?.includes('28')) {
      recommendations.push('- 28-byte upload suggests base64 conversion issue. Use binary upload method.');
    }

    if (recommendations.length === 0) {
      recommendations.push('- No issues detected. Upload should work correctly.');
    }

    return recommendations.join('\n');
  }
}

// Export singleton instance
export const uploadDebugger = new UploadDebugger();
