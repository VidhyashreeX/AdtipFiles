// adtip-reactnative/Adtip/src/components/CloudflareStreamPlayer.tsx
// Cloudflare Stream Player Component for React Native
// Provides adaptive streaming with mobile data optimization

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Video from 'react-native-video';
import { CLOUDFLARE_STREAM_CONFIG } from '../config/cloudflareConfig';

interface CloudflareStreamPlayerProps {
  streamVideoId?: string;
  streamStatus?: 'uploading' | 'ready' | 'error' | 'inprogress';
  fallbackVideoUrl?: string;
  width?: number;
  height?: number;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  onLoad?: () => void;
  onError?: (error: any) => void;
  onProgress?: (progress: any) => void;
  style?: any;
  resizeMode?: 'contain' | 'cover' | 'stretch';
  useStreamPlayer?: boolean; // Toggle between Stream and fallback
}

const CloudflareStreamPlayer: React.FC<CloudflareStreamPlayerProps> = ({
  streamVideoId,
  streamStatus,
  fallbackVideoUrl,
  width = Dimensions.get('window').width,
  height = 200,
  autoplay = true, // Enable autoplay by default
  muted = true,
  controls = true,
  onLoad,
  onError,
  onProgress,
  style,
  resizeMode = 'contain',
  useStreamPlayer = true,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [useWebView, setUseWebView] = useState(false);
  const webViewRef = useRef<WebView>(null);

  // Validate if Stream playback is possible
  const isStreamReady = streamVideoId && streamStatus === 'ready';
  const shouldUseStream = useStreamPlayer && isStreamReady;

  // Generate Stream Player URL with validation
  const getStreamPlayerUrl = () => {
    if (!isStreamReady) {
      console.warn('[CloudflareStreamPlayer] Cannot generate Stream URL - invalid stream data:', {
        streamVideoId,
        streamStatus,
        isStreamReady
      });
      return null;
    }

    const baseUrl = `https://customer-${CLOUDFLARE_STREAM_CONFIG.customerCode}.cloudflarestream.com`;
    const params = new URLSearchParams({
      autoplay: autoplay.toString(),
      muted: muted.toString(),
      controls: controls.toString(),
      preload: 'metadata',
    });

    return `${baseUrl}/${streamVideoId}/iframe?${params.toString()}`;
  };

  // Generate HLS manifest URL for react-native-video with validation
  const getHLSUrl = () => {
    if (!isStreamReady) {
      console.warn('[CloudflareStreamPlayer] Cannot generate HLS URL - invalid stream data:', {
        streamVideoId,
        streamStatus,
        isStreamReady
      });
      return null;
    }
    return `https://customer-${CLOUDFLARE_STREAM_CONFIG.customerCode}.cloudflarestream.com/${streamVideoId}/manifest/video.m3u8`;
  };

  // WebView HTML content for Stream Player
  const getWebViewHTML = () => {
    const streamUrl = getStreamPlayerUrl();
    if (!streamUrl) return '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>
            body { 
              margin: 0; 
              padding: 0; 
              background: #000;
              overflow: hidden;
            }
            iframe { 
              width: 100vw; 
              height: 100vh; 
              border: none;
            }
          </style>
        </head>
        <body>
          <iframe 
            src="${streamUrl}"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowfullscreen="true">
          </iframe>
          <script>
            // Post messages to React Native
            window.addEventListener('message', function(event) {
              if (event.data.type === 'video-loaded') {
                window.ReactNativeWebView.postMessage(JSON.stringify({type: 'loaded'}));
              }
              if (event.data.type === 'video-error') {
                window.ReactNativeWebView.postMessage(JSON.stringify({type: 'error', error: event.data.error}));
              }
            });
          </script>
        </body>
      </html>
    `;
  };

  // Handle WebView messages
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'loaded':
          setIsLoading(false);
          onLoad?.();
          break;
        case 'error':
          console.warn('[CloudflareStreamPlayer] WebView error:', data.error);
          handleStreamError(data.error);
          break;
      }
    } catch (error) {
      console.warn('[CloudflareStreamPlayer] Failed to parse WebView message:', error);
    }
  };

  // Handle Stream errors and fallback
  const handleStreamError = (error: any) => {
    console.error('[CloudflareStreamPlayer] Stream error, falling back to direct video:', {
      error,
      streamVideoId,
      streamStatus,
      fallbackVideoUrl,
      isStreamReady
    });
    setHasError(true);
    setUseWebView(false);
    onError?.(error);
  };

  // Handle react-native-video events
  const handleVideoLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleVideoError = (error: any) => {
    console.error('[CloudflareStreamPlayer] Video playback error:', error);
    setHasError(true);
    onError?.(error);
  };

  // Determine video source with proper validation
  const getVideoSource = () => {
    // Only use Stream HLS if we have a valid, ready stream
    if (shouldUseStream && useWebView) {
      const hlsUrl = getHLSUrl();
      if (hlsUrl) {
        console.log('[CloudflareStreamPlayer] Using Stream HLS URL:', hlsUrl);
        return { uri: hlsUrl };
      }
    }

    // Fall back to direct video URL
    if (fallbackVideoUrl) {
      console.log('[CloudflareStreamPlayer] Using fallback video URL:', fallbackVideoUrl);
      return { uri: fallbackVideoUrl };
    }

    console.warn('[CloudflareStreamPlayer] No valid video source available:', {
      shouldUseStream,
      useWebView,
      streamVideoId,
      streamStatus,
      fallbackVideoUrl
    });
    return null;
  };

  // Retry with Stream (only if stream is ready)
  const retryWithStream = () => {
    if (!isStreamReady) {
      console.warn('[CloudflareStreamPlayer] Cannot retry - stream not ready:', {
        streamVideoId,
        streamStatus
      });
      return;
    }
    console.log('[CloudflareStreamPlayer] Retrying with Stream player');
    setHasError(false);
    setIsLoading(true);
    setUseWebView(true);
  };

  // Render error state
  if (hasError && !fallbackVideoUrl) {
    return (
      <View style={[styles.container, { width, height }, style]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Video unavailable</Text>
          {isStreamReady && (
            <TouchableOpacity style={styles.retryButton} onPress={retryWithStream}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Initialize useWebView state based on stream readiness
  React.useEffect(() => {
    setUseWebView(shouldUseStream);
    if (!shouldUseStream && streamVideoId) {
      console.warn('[CloudflareStreamPlayer] Stream not ready, using fallback:', {
        streamVideoId,
        streamStatus,
        shouldUseStream,
        reason: streamStatus !== 'ready' ? 'Stream not ready' : 'No stream ID'
      });
    } else if (shouldUseStream) {
      console.log('[CloudflareStreamPlayer] Using Cloudflare Stream player:', {
        streamVideoId,
        streamStatus,
        autoplay
      });
    }
  }, [shouldUseStream, streamVideoId, streamStatus, autoplay]);

  // Render Stream Player via WebView (only if stream is ready)
  if (useWebView && shouldUseStream && !hasError) {
    const streamUrl = getStreamPlayerUrl();
    if (!streamUrl) {
      console.error('[CloudflareStreamPlayer] Failed to generate stream URL');
      setHasError(true);
      return null;
    }

    return (
      <View style={[styles.container, { width, height }, style]}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
        <WebView
          ref={webViewRef}
          source={{ html: getWebViewHTML() }}
          style={styles.webView}
          onMessage={handleWebViewMessage}
          onError={() => handleStreamError('WebView load error')}
          onHttpError={() => handleStreamError('HTTP error')}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={!autoplay}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState={false}
        />
      </View>
    );
  }

  // Render fallback with react-native-video
  const videoSource = getVideoSource();
  if (!videoSource) {
    return (
      <View style={[styles.container, { width, height }, style]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No video source available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width, height }, style]}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
      <Video
        source={videoSource}
        style={styles.video}
        controls={controls}
        resizeMode={resizeMode}
        onLoad={handleVideoLoad}
        onError={handleVideoError}
        onProgress={onProgress}
        muted={muted}
        repeat={false}
        playWhenInactive={false}
        playInBackground={false}
        bufferConfig={{
          minBufferMs: 2000,
          maxBufferMs: 5000,
          bufferForPlaybackMs: 1000,
          bufferForPlaybackAfterRebufferMs: 1500,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 1,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default CloudflareStreamPlayer;
