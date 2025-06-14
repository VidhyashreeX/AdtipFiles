import { useCallback, useRef } from 'react';
import { NativeModules } from 'react-native';

const { ExoPlayerPreloader } = NativeModules;

export const useVideoPreloader = () => {
  const preloadedVideos = useRef<Set<string>>(new Set());

  const preloadVideo = useCallback((url: string) => {
    if (!preloadedVideos.current.has(url) && ExoPlayerPreloader) {
      ExoPlayerPreloader.preloadVideo(url);
      preloadedVideos.current.add(url);
    }
  }, []);

  const preloadMultipleVideos = useCallback((urls: string[]) => {
    urls.forEach(url => preloadVideo(url));
  }, [preloadVideo]);

  const clearPreloadCache = useCallback(() => {
    preloadedVideos.current.clear();
  }, []);

  return {
    preloadVideo,
    preloadMultipleVideos,
    clearPreloadCache,
  };
};