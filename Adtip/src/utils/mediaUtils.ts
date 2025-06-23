// src/utils/mediaUtils.ts
// Utility functions for handling media URLs with proper authentication

import { API_BASE_URL } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Converts a relative or partial URL to a fully qualified URL with authentication
 */
export const getSecureMediaUrl = async (mediaUrl?: string | null): Promise<string | undefined> => {
  if (!mediaUrl || mediaUrl === 'null' || mediaUrl === 'undefined') {
    return undefined;
  }

  // If it's already a full URL, return as is
  if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
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
 * Creates a secure video source object for react-native-video
 */
export const createSecureVideoSource = async (videoUrl?: string | null) => {
  const secureUrl = await getSecureMediaUrl(videoUrl);
  
  if (!secureUrl) {
    return { uri: '' };
  }

  const headers = await getMediaHeaders();
  
  return {
    uri: secureUrl,
    headers: headers,
  };
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
 * Validates if a media URL is accessible
 */
export const validateMediaUrl = async (mediaUrl?: string | null): Promise<boolean> => {
  try {
    const secureUrl = await getSecureMediaUrl(mediaUrl);
    if (!secureUrl) return false;

    const headers = await getMediaHeaders();
    
    const response = await fetch(secureUrl, {
      method: 'HEAD',
      headers: headers,
    });

    return response.ok;
  } catch (error) {
    console.error('Media URL validation failed:', error);
    return false;
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
