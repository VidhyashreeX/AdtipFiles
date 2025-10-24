import React, { memo, useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import Video from 'react-native-video';
import { getSecureMediaUrl } from '../../../utils/mediaUtils';
import { TipShortsLogger } from '../../../utils/logger';

interface OptimizedVideoPlayerProps {
  videoId: string;
  videoUrl?: string;
  streamVideoId?: string;
  streamStatus?: string;
  isActive: boolean;
  isPaused: boolean;
  isMuted: boolean;
  onLoad?: (data: any) => void;
  onProgress?: (data: any) => void;
  onCompletion?: (videoId: string) => void;
  style?: any;
  width: number;
  height: number;
}

// Simple Video Player Component - Basic react-native-video for smooth playback
const OptimizedVideoPlayer = memo<OptimizedVideoPlayerProps>(({
  videoId,
  videoUrl,
  isActive,
  isPaused,
  isMuted,
  onLoad,
  onProgress,
  onCompletion,
  style,
}) => {
  const [secureVideoUrl, setSecureVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<any>(null);

  // Load secure video URL
  useEffect(() => {
    const loadSecureUrl = async () => {
      if (videoUrl) {
        try {
          const url = await getSecureMediaUrl(videoUrl);
          setSecureVideoUrl(url || videoUrl);
        } catch (error) {
          TipShortsLogger.warn(`Failed to load secure URL for video ${videoId}, using original:`, error);
          setSecureVideoUrl(videoUrl);
        }
      }
    };
    loadSecureUrl();
  }, [videoUrl, videoId]);

  const handleLoad = useCallback((data: any) => {
    TipShortsLogger.debug(`Video loaded: ${videoId}`);
    onLoad?.(data);
  }, [videoId, onLoad]);

  const handleProgress = useCallback((data: any) => {
    if (isActive) {
      onProgress?.(data);
    }
  }, [isActive, onProgress]);

  const handleError = useCallback((error: any) => {
    TipShortsLogger.error(`Video error for ${videoId}:`, error);
  }, [videoId]);

  const handleEnd = useCallback(() => {
    TipShortsLogger.debug(`Video completed: ${videoId}`);
    onCompletion?.(videoId);
  }, [videoId, onCompletion]);

  const shouldPlay = isActive && !isPaused;
  const hasValidSource = secureVideoUrl && secureVideoUrl.trim().length > 0;

  if (!hasValidSource) {
    return <View style={[styles.errorContainer, style]} />;
  }

  return (
    <View style={[styles.container, style]}>
      <Video
        ref={videoRef}
        source={{ uri: secureVideoUrl }}
        paused={!shouldPlay}
        muted={isMuted}
        repeat={true}
        resizeMode="cover"
        style={styles.video}
        onLoad={handleLoad}
        onProgress={handleProgress}
        onError={handleError}
        onEnd={handleEnd}
        ignoreSilentSwitch="ignore"
        playInBackground={false}
        playWhenInactive={false}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#1F2C34',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

OptimizedVideoPlayer.displayName = 'OptimizedVideoPlayer';

export default OptimizedVideoPlayer;
