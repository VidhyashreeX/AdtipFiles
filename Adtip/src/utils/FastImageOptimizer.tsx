import React from 'react';
import FastImage, { FastImageProps } from '@d11/react-native-fast-image';
import { getProfileImageUrl } from './ProfileImageUtils';
import { logWarn } from './ProductionLogger';

// Helper to convert string/object/null/undefined to FastImage source with proper URL handling
function toSource(src: string | { uri: string } | null | undefined, isProfile: boolean = false) {
  // Handle object sources (e.g., {uri: string})
  if (src && typeof src === 'object' && 'uri' in src) {
    return toSource(src.uri, isProfile); // Recursively process the URI string
  }

  // Debug logging for unexpected source types
  if (src && typeof src !== 'string') {
    logWarn('FastImageOptimizer', 'toSource received unexpected type', { type: typeof src, src });
    return undefined;
  }

  if (!src || src === 'null' || src === 'undefined') {
    return undefined;
  }

  // For profile images, use the centralized utility
  if (isProfile) {
    const processedUrl = getProfileImageUrl(src, { enableCacheBusting: true });
    return { uri: processedUrl };
  }

  return { uri: src };
}

type ImgProps = {
  source: string | { uri: string } | null | undefined;
  style?: any;
} & Omit<FastImageProps, 'source' | 'style'>;

export const ProfileFastImage: React.FC<ImgProps & { size?: number }> = ({
  source, style, size = 40, ...props
}) => (
  <FastImage
    source={toSource(source, true)} // Use profile image processing
    style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
    resizeMode={FastImage.resizeMode.cover}
    {...props}
  />
);

export const ContentFastImage: React.FC<ImgProps> = ({ source, style, ...props }) => (
  <FastImage
    source={toSource(source)}
    style={style}
    resizeMode={FastImage.resizeMode.cover}
    {...props}
  />
);

export const ThumbnailFastImage: React.FC<ImgProps> = ({ source, style, ...props }) => (
  <FastImage
    source={toSource(source)}
    style={style}
    resizeMode={FastImage.resizeMode.cover}
    {...props}
  />
);

export const BannerFastImage: React.FC<ImgProps> = ({ source, style, ...props }) => (
  <FastImage
    source={toSource(source)}
    style={style}
    resizeMode={FastImage.resizeMode.cover}
    {...props}
  />
);

export const StoryFastImage: React.FC<ImgProps> = ({ source, style, ...props }) => (
  <FastImage
    source={toSource(source)}
    style={style}
    resizeMode={FastImage.resizeMode.cover}
    {...props}
  />
);



export const clearImageCache = () => {
  FastImage.clearMemoryCache();
  FastImage.clearDiskCache();
};
