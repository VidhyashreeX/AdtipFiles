import React from 'react';
import FastImage, { FastImageProps } from '@d11/react-native-fast-image';

// Helper to convert string/null/undefined to FastImage source
function toSource(src: string | null | undefined) {
  if (!src || src === 'null' || src === 'undefined') return undefined;
  return { uri: src };
}

type ImgProps = {
  source: string | null | undefined;
  style?: any;
} & Omit<FastImageProps, 'source' | 'style'>;

export const ProfileFastImage: React.FC<ImgProps & { size?: number }> = ({
  source, style, size = 40, ...props
}) => (
  <FastImage
    source={toSource(source)}
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

export const preloadImages = (urls: (string | null | undefined)[]) => {
  FastImage.preload(
    urls
      .filter((u): u is string => !!u && u !== 'null' && u !== 'undefined')
      .map(uri => ({ uri }))
  );
};

export const clearImageCache = () => {
  FastImage.clearMemoryCache();
  FastImage.clearDiskCache();
};
