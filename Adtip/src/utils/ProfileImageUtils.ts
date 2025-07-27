// src/utils/ProfileImageUtils.ts
// Centralized utility for handling profile image URLs and caching

import { API_BASE_URL } from '../constants/api';

export interface ProfileImageOptions {
  enableCacheBusting?: boolean;
  fallbackUrl?: string;
  size?: number;
}

/**
 * Get full profile image URL with proper fallback and cache busting
 */
export const getProfileImageUrl = (
  imageUrl?: string | null,
  options: ProfileImageOptions = {}
): string => {
  const {
    enableCacheBusting = true,
    fallbackUrl = 'https://avatar.iran.liara.run/public',
    size
  } = options;

  // Debug logging for input type
  if (imageUrl && typeof imageUrl !== 'string') {
    console.warn('[ProfileImageUtils] getProfileImageUrl received non-string:', typeof imageUrl, imageUrl);
    return fallbackUrl;
  }

  // Handle null, undefined, or invalid URLs
  if (!imageUrl || imageUrl === 'null' || imageUrl === 'undefined' || imageUrl.trim() === '') {
    return fallbackUrl;
  }

  // If it's already a full URL (http/https), return as-is with optional cache busting
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    if (enableCacheBusting) {
      const separator = imageUrl.includes('?') ? '&' : '?';
      return `${imageUrl}${separator}t=${Date.now()}`;
    }
    return imageUrl;
  }

  // If it's a file:// or content:// URL (local file), return as-is
  if (imageUrl.startsWith('file://') || imageUrl.startsWith('content://')) {
    return imageUrl;
  }

  // Construct full URL from relative path
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  let fullUrl = `${baseUrl}${path}`;

  // Add size parameter if specified
  if (size) {
    const separator = fullUrl.includes('?') ? '&' : '?';
    fullUrl += `${separator}size=${size}`;
  }

  // Add cache busting parameter
  if (enableCacheBusting) {
    const separator = fullUrl.includes('?') ? '&' : '?';
    fullUrl += `${separator}t=${Date.now()}`;
  }

  return fullUrl;
};

/**
 * Clear profile image cache by updating the cache busting parameter
 */
export const clearProfileImageCache = (imageUrl: string): string => {
  if (!imageUrl) return imageUrl;

  // Remove existing cache busting parameter
  const urlWithoutCache = imageUrl.replace(/[?&]t=\d+/, '');
  
  // Add new cache busting parameter
  const separator = urlWithoutCache.includes('?') ? '&' : '?';
  return `${urlWithoutCache}${separator}t=${Date.now()}`;
};

/**
 * Validate if an image URL is accessible
 */
export const validateImageUrl = async (imageUrl: string): Promise<boolean> => {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn('[ProfileImageUtils] Image validation failed:', error);
    return false;
  }
};

/**
 * Get optimized profile image URL for different screen sizes
 */
export const getOptimizedProfileImageUrl = (
  imageUrl?: string | null,
  screenSize: 'small' | 'medium' | 'large' = 'medium'
): string => {
  const sizeMap = {
    small: 50,
    medium: 150,
    large: 300
  };

  return getProfileImageUrl(imageUrl, {
    enableCacheBusting: true,
    size: sizeMap[screenSize]
  });
};

/**
 * Handle profile image upload result and update local state
 */
export const handleProfileImageUploadResult = (
  uploadResult: { success: boolean; url?: string; error?: string },
  onSuccess?: (imageUrl: string) => void,
  onError?: (error: string) => void
): void => {
  if (uploadResult.success && uploadResult.url) {
    console.log('[ProfileImageUtils] Profile image uploaded successfully:', uploadResult.url);
    
    // Clear any existing cache for this image
    const freshImageUrl = clearProfileImageCache(uploadResult.url);
    
    if (onSuccess) {
      onSuccess(freshImageUrl);
    }
  } else {
    const errorMessage = uploadResult.error || 'Failed to upload profile image';
    console.error('[ProfileImageUtils] Profile image upload failed:', errorMessage);
    
    if (onError) {
      onError(errorMessage);
    }
  }
};

/**
 * Create a cache-busted version of profile image for immediate display
 */
export const createFreshProfileImageUrl = (imageUrl?: string | null): string => {
  if (!imageUrl) {
    return getProfileImageUrl(imageUrl);
  }

  return getProfileImageUrl(imageUrl, { enableCacheBusting: true });
};

export default {
  getProfileImageUrl,
  clearProfileImageCache,
  validateImageUrl,
  getOptimizedProfileImageUrl,
  handleProfileImageUploadResult,
  createFreshProfileImageUrl
};
