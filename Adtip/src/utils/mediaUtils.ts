// src/utils/mediaUtils.ts
// Utility functions for handling media URLs with proper authentication

import { API_BASE_URL } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CloudflareUploadService } from '../services/CloudflareUploadService';
import { logDebug, logInfo, logWarn, logError } from './ProductionLogger';

/**
 * Check if URL is a Cloudflare R2 URL
 */
export const isCloudflareUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('r2.cloudflarestorage.com') ||
           urlObj.hostname.includes('94e2ffe1e7d5daf0d3de8d11c55dd2d6') ||
           urlObj.hostname.includes('theadtip.in');
  } catch {
    return false;
  }
};

/**
 * Check if URL is for a video file (not images/thumbnails)
 */
const isVideoUrl = (url: string): boolean => {
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.flv', '.wmv'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext));
};

/**
 * Converts a relative or partial URL to a fully qualified URL with authentication
 * Now handles Cloudflare URLs by generating presigned URLs with better error handling
 * IMPORTANT: Presigned URL generation is ONLY done for VIDEO files, not images/thumbnails
 */
export const getSecureMediaUrl = async (mediaUrl?: string | null, skipPresigned: boolean = false): Promise<string | undefined> => {
  if (!mediaUrl || mediaUrl === 'null' || mediaUrl === 'undefined') {
    return undefined;
  }

  // If it's a Cloudflare URL, check if we should generate presigned URL
  if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
    if (isCloudflareUrl(mediaUrl)) {
      // SKIP presigned URL generation for images/thumbnails (performance optimization)
      // Only generate presigned URLs for actual video files
      const shouldGeneratePresigned = !skipPresigned && isVideoUrl(mediaUrl);
      
      if (shouldGeneratePresigned) {
        logDebug('MediaUtils', 'Detected Cloudflare VIDEO URL, generating presigned URL', { mediaUrl });
        try {
          const presignedUrl = await CloudflareUploadService.generatePresignedUrlFromPublicUrl(mediaUrl);
          if (presignedUrl) {
            logDebug('MediaUtils', 'Generated presigned URL successfully');
            return presignedUrl;
          } else {
            logWarn('MediaUtils', 'Failed to generate presigned URL, using fallback strategy');
            // Try to construct a direct access URL as fallback
            const fallbackUrl = mediaUrl.replace('theadtip.in', '94e2ffe1e7d5daf0d3de8d11c55dd2d6.r2.cloudflarestorage.com');
            logDebug('MediaUtils', 'Using fallback URL', { fallbackUrl });
            return fallbackUrl;
          }
        } catch (error) {
          logError('MediaUtils', 'Error generating presigned URL', error);
          // Try to construct a direct access URL as fallback
          const fallbackUrl = mediaUrl.replace('theadtip.in', '94e2ffe1e7d5daf0d3de8d11c55dd2d6.r2.cloudflarestorage.com');
          logDebug('MediaUtils', 'Using fallback URL after error', { fallbackUrl });
          return fallbackUrl;
        }
      } else {
        // For images/thumbnails, return URL as-is (no presigned URL needed)
        logDebug('MediaUtils', 'Cloudflare image/thumbnail URL detected, skipping presigned generation', { mediaUrl });
        return mediaUrl;
      }
    }
    return mediaUrl;
  }

  // If it's a relative URL, prepend the API base URL
  const fullUrl = `${API_BASE_URL}${mediaUrl.startsWith('/') ? '' : '/'}${mediaUrl}`;

  return fullUrl;
};

/**
 * Gets headers for authenticated media requests
 */
export const getMediaHeaders = async (): Promise<Record<string, string>> => {
  const token = await AsyncStorage.getItem('accessToken') || await AsyncStorage.getItem('@auth_token');
  
  const headers: Record<string, string> = {
    'Accept': 'application/json, image/*, video/*',
    'Cache-Control': 'no-cache',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Enhanced video URL validation and correction with better Cloudflare handling
 */
export const validateAndFixVideoUrl = async (videoUrl?: string | null): Promise<string | null> => {
  if (!videoUrl || videoUrl === 'null' || videoUrl === 'undefined') {
    logWarn('MediaUtils', 'Invalid video URL provided', { videoUrl });
    return null;
  }

  // Clean the URL
  let cleanUrl = videoUrl.trim();

  // Check if URL contains common video file extensions
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'];
  const hasVideoExtension = videoExtensions.some(ext => cleanUrl.toLowerCase().includes(ext));

  if (!hasVideoExtension) {
    logWarn('MediaUtils', 'URL does not appear to be a video file', { cleanUrl });
  }

  // If it's already a full URL, validate it
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    try {
      const url = new URL(cleanUrl);

      // If it's a Cloudflare URL, generate presigned URL
      if (isCloudflareUrl(cleanUrl)) {
        logDebug('MediaUtils', 'Cloudflare video URL detected, generating presigned URL');
        try {
          const presignedUrl = await CloudflareUploadService.generatePresignedUrlFromPublicUrl(cleanUrl);
          if (presignedUrl) {
            logDebug('MediaUtils', 'Generated presigned video URL successfully');
            return presignedUrl;
          } else {
            logWarn('MediaUtils', 'Failed to generate presigned video URL, using fallback');
            // Try fallback URL construction
            const fallbackUrl = cleanUrl.replace('theadtip.in', '94e2ffe1e7d5daf0d3de8d11c55dd2d6.r2.cloudflarestorage.com');
            return fallbackUrl;
          }
        } catch (error) {
          logError('MediaUtils', 'Error generating presigned video URL', error);
          // Try fallback URL construction
          const fallbackUrl = cleanUrl.replace('theadtip.in', '94e2ffe1e7d5daf0d3de8d11c55dd2d6.r2.cloudflarestorage.com');
          return fallbackUrl;
        }
      }

      logDebug('MediaUtils', 'Validated external video URL', { url: url.href });
      return url.href;
    } catch (error) {
      logError('MediaUtils', 'Invalid URL format', error, { cleanUrl });
      return null;
    }
  }

  // If it's a relative URL, construct the full URL
  try {
    const fullUrl = `${API_BASE_URL}${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
    const url = new URL(fullUrl);
    logDebug('MediaUtils', 'Constructed video URL', { url: url.href });
    return url.href;
  } catch (error) {
    logError('MediaUtils', 'Failed to construct valid URL', error, { cleanUrl });
    return null;
  }
};

/**
 * Creates a secure video source object for react-native-video with enhanced validation
 */
export const createSecureVideoSource = async (videoUrl?: string | null) => {
  logDebug('MediaUtils', 'Creating secure video source', { videoUrl });

  const validatedUrl = await validateAndFixVideoUrl(videoUrl);

  if (!validatedUrl) {
    logError('MediaUtils', 'Failed to create valid video URL');
    return { uri: '' };
  }

  // Ensure validatedUrl is always a string
  const safeUri = String(validatedUrl || '');

  // Check if this is a Cloudflare presigned URL (contains signature parameters)
  const isPresignedUrl = safeUri.includes('X-Amz-Signature') || safeUri.includes('Signature=');

  const source: any = {
    uri: safeUri,
  };

  // Only add headers for non-presigned URLs (API-based media)
  if (!isPresignedUrl && !isCloudflareUrl(validatedUrl)) {
    const headers = await getMediaHeaders();
    source.headers = headers;
  }

  logDebug('MediaUtils', 'Created video source', {
    uri: source.uri,
    isPresigned: isPresignedUrl,
    isCloudflare: isCloudflareUrl(validatedUrl),
    hasHeaders: !!source.headers
  });

  return source;
};

/**
 * Creates a secure image source object for Image component
 */
export const createSecureImageSource = async (imageUrl?: string | null) => {
  const secureUrl = await getSecureMediaUrl(imageUrl);

  if (!secureUrl) {
    return undefined;
  }

  // Check if this is a Cloudflare presigned URL (contains signature parameters)
  const isPresignedUrl = secureUrl.includes('X-Amz-Signature') || secureUrl.includes('Signature=');

  const source: any = {
    uri: secureUrl,
  };

  // Only add headers for non-presigned URLs (API-based media)
  if (!isPresignedUrl && !isCloudflareUrl(secureUrl)) {
    const headers = await getMediaHeaders();
    source.headers = headers;
  }

  return source;
};

/**
 * Enhanced media URL validation with actual network check
 */
export const validateMediaUrl = async (mediaUrl?: string | null): Promise<boolean> => {
  try {
    const secureUrl = await getSecureMediaUrl(mediaUrl);
    if (!secureUrl) return false;

    const headers = await getMediaHeaders();

    logDebug('MediaUtils', 'Validating media URL', { secureUrl });

    const response = await fetch(secureUrl, {
      method: 'HEAD',
      headers: headers,
    });

    const isValid = response.ok;
    logDebug('MediaUtils', 'URL validation result', {
      url: secureUrl,
      status: response.status,
      statusText: response.statusText,
      isValid
    });

    return isValid;
  } catch (error) {
    logError('MediaUtils', 'Media URL validation failed', error);
    return false;
  }
};

/**
 * Test video URL accessibility and log detailed results
 */
export const testVideoUrl = async (videoUrl?: string | null): Promise<{
  isValid: boolean;
  error?: string;
  status?: number;
  finalUrl?: string;
}> => {
  try {
    const validatedUrl = await validateAndFixVideoUrl(videoUrl);
    
    if (!validatedUrl) {
      return {
        isValid: false,
        error: 'Invalid or malformed URL'
      };
    }

    const headers = await getMediaHeaders();

    logDebug('MediaUtils', 'Testing video URL', { validatedUrl });

    const response = await fetch(validatedUrl, {
      method: 'HEAD',
      headers: headers,
    });

    return {
      isValid: response.ok,
      status: response.status,
      finalUrl: validatedUrl,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
    };
  } catch (error: any) {
    logError('MediaUtils', 'Video URL test failed', error);
    return {
      isValid: false,
      error: error.message || 'Network error'
    };
  }
};

/**
 * Fallback avatar URL generator
 */
export const getFallbackAvatarUrl = (seed?: string | number): string => {
  return `https://api.dicebear.com/9.x/identicon/svg?seed=${seed || Math.random()}`;
};

/**
 * Fallback thumbnail URL generator
 */
export const getFallbackThumbnailUrl = (videoId?: string | number): string => {
  return `https://via.placeholder.com/400x225/cccccc/666666?text=Video+${videoId || 'Preview'}`;
};

/**
 * Fallback video URL generator (placeholder video)
 */
export const getFallbackVideoUrl = (): string => {
  // Return a test video URL that should work
  return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
};

/**
 * Test if a URL is accessible and return appropriate fallback
 */
export const testAndGetWorkingUrl = async (primaryUrl: string, fallbackUrl?: string): Promise<string> => {
  try {
    logDebug('MediaUtils', 'Testing URL accessibility', { primaryUrl });

    // Create a timeout promise
    const timeoutPromise = new Promise<Response>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 5000);
    });

    // Test primary URL with a quick HEAD request
    const fetchPromise = fetch(primaryUrl, {
      method: 'HEAD',
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]);

    if (response.ok) {
      logDebug('MediaUtils', 'Primary URL is accessible');
      return primaryUrl;
    } else {
      logWarn('MediaUtils', 'Primary URL returned status', { status: response.status });
      if (fallbackUrl) {
        logDebug('MediaUtils', 'Trying fallback URL', { fallbackUrl });
        return fallbackUrl;
      }
      return primaryUrl; // Return original if no fallback
    }
  } catch (error) {
    logError('MediaUtils', 'Error testing URL accessibility', error);
    if (fallbackUrl) {
      logDebug('MediaUtils', 'Using fallback URL due to error', { fallbackUrl });
      return fallbackUrl;
    }
    return primaryUrl; // Return original if no fallback
  }
};
