// src/components/common/OptimizedImage.tsx - High-performance image component with caching

import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import {
  Image,
  ImageProps,
  ImageStyle,
  View,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import ImageCacheService from '../../services/ImageCacheService';
import { Logger } from '../../utils/ProductionLogger';

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  // Source can be string URL or ImageSource object
  source: string | { uri: string } | number;
  
  // Optimization props
  targetWidth?: number;
  targetHeight?: number;
  quality?: number;
  
  // Loading and error states
  showLoader?: boolean;
  loaderColor?: string;
  fallbackSource?: string | { uri: string } | number;
  
  // Performance props
  enableCaching?: boolean;
  enableLazyLoading?: boolean;
  preloadDistance?: number; // Distance in pixels to start preloading
  
  // Style props
  containerStyle?: ViewStyle;
  loaderStyle?: ViewStyle;
  
  // Callbacks
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (error: any) => void;
  onCacheHit?: () => void;
  onCacheMiss?: () => void;
}

interface ImageState {
  isLoading: boolean;
  hasError: boolean;
  isVisible: boolean;
  optimizedUri?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  targetWidth,
  targetHeight,
  quality = 0.8,
  showLoader = true,
  loaderColor = '#007AFF',
  fallbackSource,
  enableCaching = true,
  enableLazyLoading = false,
  preloadDistance = 100,
  containerStyle,
  loaderStyle,
  onLoadStart,
  onLoadEnd,
  onError,
  onCacheHit,
  onCacheMiss,
  style,
  ...imageProps
}) => {
  const [imageState, setImageState] = useState<ImageState>({
    isLoading: true,
    hasError: false,
    isVisible: !enableLazyLoading,
    optimizedUri: undefined,
  });
  
  const imageRef = useRef<Image>(null);
  const containerRef = useRef<View>(null);
  const isMountedRef = useRef(true);
  const cacheService = ImageCacheService.getInstance();

  // Get source URI
  const getSourceUri = useCallback((): string => {
    if (typeof source === 'string') {
      return source;
    }
    if (typeof source === 'object' && 'uri' in source) {
      return source.uri;
    }
    return ''; // For require() sources, we can't optimize
  }, [source]);

  // Initialize cache service and get optimized image
  useEffect(() => {
    let isCancelled = false;

    const initializeAndLoadImage = async () => {
      if (!isMountedRef.current) return;

      try {
        const sourceUri = getSourceUri();
        if (!sourceUri || !enableCaching) {
          if (!isCancelled && isMountedRef.current) {
            setImageState(prev => ({ 
              ...prev, 
              optimizedUri: sourceUri,
              isLoading: false 
            }));
          }
          return;
        }

        // Initialize cache service
        await cacheService.initialize();

        // Get optimized image URL
        const optimizedUri = await cacheService.getOptimizedImageUrl(
          sourceUri,
          targetWidth,
          targetHeight,
          quality
        );

        if (!isCancelled && isMountedRef.current) {
          const cacheMetrics = cacheService.getCacheMetrics();
          
          // Determine if this was a cache hit or miss
          if (optimizedUri !== sourceUri) {
            onCacheHit?.();
            Logger.debug('OptimizedImage', `Cache hit for: ${sourceUri}`);
          } else {
            onCacheMiss?.();
          }

          setImageState(prev => ({ 
            ...prev, 
            optimizedUri,
            isLoading: false 
          }));
        }
      } catch (error) {
        Logger.error('OptimizedImage', 'Failed to initialize image:', error);
        
        if (!isCancelled && isMountedRef.current) {
          setImageState(prev => ({ 
            ...prev, 
            hasError: true,
            isLoading: false 
          }));
        }
      }
    };

    if (imageState.isVisible) {
      initializeAndLoadImage();
    }

    return () => {
      isCancelled = true;
    };
  }, [
    source,
    targetWidth,
    targetHeight,
    quality,
    enableCaching,
    imageState.isVisible,
    getSourceUri,
    onCacheHit,
    onCacheMiss
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Handle image load start
  const handleLoadStart = useCallback(() => {
    if (!isMountedRef.current) return;
    
    setImageState(prev => ({ ...prev, isLoading: true, hasError: false }));
    onLoadStart?.();
  }, [onLoadStart]);

  // Handle image load success
  const handleLoad = useCallback(() => {
    if (!isMountedRef.current) return;
    
    setImageState(prev => ({ ...prev, isLoading: false, hasError: false }));
    onLoadEnd?.();
  }, [onLoadEnd]);

  // Handle image load error
  const handleError = useCallback((error: any) => {
    if (!isMountedRef.current) return;
    
    Logger.error('OptimizedImage', 'Image load error:', error);
    setImageState(prev => ({ ...prev, isLoading: false, hasError: true }));
    onError?.(error);
  }, [onError]);

  // Determine which source to use
  const getImageSource = useCallback((): any => {
    if (imageState.hasError && fallbackSource) {
      return fallbackSource;
    }

    if (imageState.optimizedUri) {
      return { uri: imageState.optimizedUri };
    }

    if (typeof source === 'string') {
      return { uri: source };
    }

    return source;
  }, [imageState.hasError, imageState.optimizedUri, fallbackSource, source]);

  // Render loading indicator
  const renderLoader = () => {
    if (!showLoader || !imageState.isLoading) return null;

    return (
      <View style={[styles.loaderContainer, loaderStyle]}>
        <ActivityIndicator 
          size="small" 
          color={loaderColor}
          testID="optimized-image-loader"
        />
      </View>
    );
  };

  // For lazy loading, render placeholder until visible
  if (enableLazyLoading && !imageState.isVisible) {
    return (
      <View 
        ref={containerRef}
        style={[containerStyle, style]}
        testID="optimized-image-placeholder"
      >
        {renderLoader()}
      </View>
    );
  }

  return (
    <View 
      ref={containerRef}
      style={[styles.container, containerStyle]}
      testID="optimized-image-container"
    >
      <Image
        ref={imageRef}
        source={getImageSource()}
        style={[style]}
        onLoadStart={handleLoadStart}
        onLoad={handleLoad}
        onError={handleError}
        testID="optimized-image"
        {...imageProps}
      />
      {renderLoader()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
});

export default memo(OptimizedImage);

// Hook for preloading images
export const useImagePreloader = () => {
  const cacheService = ImageCacheService.getInstance();

  const preloadImages = useCallback(async (urls: string[]) => {
    try {
      await cacheService.preloadImages(urls);
    } catch (error) {
      Logger.error('useImagePreloader', 'Failed to preload images:', error);
    }
  }, [cacheService]);

  const getCacheMetrics = useCallback(() => {
    return cacheService.getCacheMetrics();
  }, [cacheService]);

  const clearCache = useCallback(async () => {
    await cacheService.clearCache();
  }, [cacheService]);

  return {
    preloadImages,
    getCacheMetrics,
    clearCache,
  };
};