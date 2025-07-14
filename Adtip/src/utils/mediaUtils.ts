// src/utils/mediaUtils.ts
// Utility functions for handling media URLs with proper authentication

import { API_BASE_URL } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CloudflareUploadService } from '../services/CloudflareUploadService';

/**
 * Check if URL is a Cloudflare R2 URL
 */
export const isCloudflareUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('r2.cloudflarestorage.com') ||
           urlObj.hostname.includes('94e2ffe1e7d5daf0d3de8d11c55dd2d6');
  } catch {
    return false;
  }
};

/**
 * Converts a relative or partial URL to a fully qualified URL with authentication
 * Now handles Cloudflare URLs by generating presigned URLs
 */
export const getSecureMediaUrl = async (mediaUrl?: string | null): Promise<string | undefined> => {
  if (!mediaUrl || mediaUrl === 'null' || mediaUrl === 'undefined') {
    return undefined;
  }

  // If it's a Cloudflare URL, generate presigned URL
  if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
    if (isCloudflareUrl(mediaUrl)) {
      console.log('[MediaUtils] Detected Cloudflare URL, generating presigned URL:', mediaUrl);
      try {
        const presignedUrl = await CloudflareUploadService.generatePresignedUrlFromPublicUrl(mediaUrl);
        if (presignedUrl) {
          console.log('[MediaUtils] Generated presigned URL successfully');
          return presignedUrl;
        } else {
          console.warn('[MediaUtils] Failed to generate presigned URL, falling back to original');
          return mediaUrl;
        }
      } catch (error) {
        console.error('[MediaUtils] Error generating presigned URL:', error);
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
 * Enhanced video URL validation and correction
 */
export const validateAndFixVideoUrl = async (videoUrl?: string | null): Promise<string | null> => {
  if (!videoUrl || videoUrl === 'null' || videoUrl === 'undefined') {
    console.warn('[MediaUtils] Invalid video URL provided:', videoUrl);
    return null;
  }

  // Clean the URL
  let cleanUrl = videoUrl.trim();
  
  // Check if URL contains common video file extensions
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'];
  const hasVideoExtension = videoExtensions.some(ext => cleanUrl.toLowerCase().includes(ext));
  
  if (!hasVideoExtension) {
    console.warn('[MediaUtils] URL does not appear to be a video file:', cleanUrl);
  }

  // If it's already a full URL, validate it
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    try {
      const url = new URL(cleanUrl);

      // If it's a Cloudflare URL, generate presigned URL
      if (isCloudflareUrl(cleanUrl)) {
        console.log('[MediaUtils] Cloudflare video URL detected, generating presigned URL');
        const presignedUrl = await CloudflareUploadService.generatePresignedUrlFromPublicUrl(cleanUrl);
        if (presignedUrl) {
          console.log('[MediaUtils] Generated presigned video URL successfully');
          return presignedUrl;
        } else {
          console.warn('[MediaUtils] Failed to generate presigned video URL, using original');
          return url.href;
        }
      }

      console.log('[MediaUtils] Validated external video URL:', url.href);
      return url.href;
    } catch (error) {
      console.error('[MediaUtils] Invalid URL format:', cleanUrl, error);
      return null;
    }
  }

  // If it's a relative URL, construct the full URL
  try {
    const fullUrl = `${API_BASE_URL}${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
    const url = new URL(fullUrl);
    console.log('[MediaUtils] Constructed video URL:', url.href);
    return url.href;
  } catch (error) {
    console.error('[MediaUtils] Failed to construct valid URL:', cleanUrl, error);
    return null;
  }
};

/**
 * Creates a secure video source object for react-native-video with enhanced validation
 */
export const createSecureVideoSource = async (videoUrl?: string | null) => {
  console.log('[MediaUtils] Creating secure video source for:', videoUrl);
  
  const validatedUrl = await validateAndFixVideoUrl(videoUrl);
  
  if (!validatedUrl) {
    console.error('[MediaUtils] Failed to create valid video URL');
    return { uri: '' };
  }

  const headers = await getMediaHeaders();
  
  const source = {
    uri: validatedUrl,
    headers: headers,
  };

  console.log('[MediaUtils] Created video source:', {
    uri: source.uri,
    hasAuth: !!headers['Authorization'],
    hasHeaders: Object.keys(headers).length > 0
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

  const headers = await getMediaHeaders();
  
  return {
    uri: secureUrl,
    headers: headers,
  };
};

/**
 * Enhanced media URL validation with actual network check
 */
export const validateMediaUrl = async (mediaUrl?: string | null): Promise<boolean> => {
  try {
    const secureUrl = await getSecureMediaUrl(mediaUrl);
    if (!secureUrl) return false;

    const headers = await getMediaHeaders();
    
    console.log('[MediaUtils] Validating media URL:', secureUrl);
    
    const response = await fetch(secureUrl, {
      method: 'HEAD',
      headers: headers,
    });

    const isValid = response.ok;
    console.log('[MediaUtils] URL validation result:', {
      url: secureUrl,
      status: response.status,
      statusText: response.statusText,
      isValid
    });

    return isValid;
  } catch (error) {
    console.error('[MediaUtils] Media URL validation failed:', error);
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
    
    console.log('[MediaUtils] Testing video URL:', validatedUrl);
    
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
    console.error('[MediaUtils] Video URL test failed:', error);
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
