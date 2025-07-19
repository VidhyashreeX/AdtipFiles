import React, { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Video from 'react-native-video';
import { useTheme } from '../../contexts/ThemeContext';
import { createSecureVideoSource, validateAndFixVideoUrl } from '../../utils/mediaUtils';

interface VideoThumbnailProps {
  videoUrl: string;
  style?: any;
  resizeMode?: 'cover' | 'contain' | 'stretch';
  thumbnailTime?: number; // Time in seconds to capture thumbnail
}

const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
  videoUrl,
  style,
  resizeMode = 'cover',
  thumbnailTime = 1,
}) => {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [secureVideoSource, setSecureVideoSource] = useState<any>(null);
  const videoRef = useRef<any>(null);

  useEffect(() => {
    if (!videoUrl) {
      setError(true);
      setIsLoading(false);
      return;
    }

    // Reset state when video URL changes
    setIsLoading(true);
    setError(false);

    // Load secure video source for Cloudflare URLs
    const loadSecureSource = async () => {
      try {
        console.log('[VideoThumbnail] Loading secure source for:', videoUrl);

        // Validate and fix the video URL if needed
        const validatedUrl = await validateAndFixVideoUrl(videoUrl);

        // Create secure video source (handles Cloudflare URLs)
        const secureSource = await createSecureVideoSource(validatedUrl || videoUrl);

        console.log('[VideoThumbnail] Secure source created:', {
          hasUri: !!secureSource.uri,
          uri: secureSource.uri?.substring(0, 100) + '...'
        });

        setSecureVideoSource(secureSource);
      } catch (error) {
        console.error('[VideoThumbnail] Error loading secure source:', error);
        setError(true);
        setIsLoading(false);
      }
    };

    loadSecureSource();
  }, [videoUrl]);

  const handleVideoLoad = (data: any) => {
    // Video loaded successfully, now seek to thumbnail time
    if (videoRef.current && data.duration > thumbnailTime) {
      videoRef.current.seek(thumbnailTime);
    } else {
      // If video is shorter than thumbnail time, just show from beginning
      setIsLoading(false);
    }
  };

  const handleVideoSeek = () => {
    // Called when seek is complete, hide loading
    setIsLoading(false);
  };

  const handleVideoError = (error: any) => {
    console.error('Video thumbnail error:', error);
    setError(true);
    setIsLoading(false);
  };



  if (error) {
    return (
      <View style={[styles.container, style, { backgroundColor: colors.skeleton.background }]}>
        <View style={styles.errorContainer}>
          <View style={[styles.errorIcon, { backgroundColor: colors.text.tertiary }]} />
        </View>
      </View>
    );
  }

  // Don't render video until we have a secure source
  if (!secureVideoSource) {
    return (
      <View style={[styles.container, style]}>
        <View style={[styles.loadingContainer, { backgroundColor: colors.skeleton.background }]}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {isLoading && (
        <View style={[styles.loadingContainer, { backgroundColor: colors.skeleton.background }]}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}

      <Video
        ref={videoRef}
        source={secureVideoSource}
        style={[styles.video, style]}
        resizeMode={resizeMode}
        paused={true} // Keep paused to show as thumbnail
        muted={true}
        repeat={false}
        onLoad={handleVideoLoad}
        onSeek={handleVideoSeek}
        onError={handleVideoError}
        playInBackground={false}
        playWhenInactive={false}
        ignoreSilentSwitch="ignore"
        mixWithOthers="duck"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    opacity: 0.5,
  },
});

export default VideoThumbnail;
