/**
 * AdPlayer Component
 * 
 * Displays ad content (video or image) with playback controls, progress tracking,
 * skip button (conditional), and completion indicators.
 * 
 * Features:
 * - Video playback using react-native-video
 * - Image display with react-native-fast-image
 * - Progress bar with percentage
 * - Skip button (appears after skip time)
 * - Timer display
 * - Pause/Resume controls
 * - Completion animation
 * 
 * @example
 * ```tsx
 * <AdPlayer
 *   adData={adData}
 *   watchTime={watchTime}
 *   isPlaying={isPlaying}
 *   canSkip={canSkip}
 *   skipTimeReached={skipTimeReached}
 *   completionPercentage={completionPercentage}
 *   onPlayPause={handlePlayPause}
 *   onSkip={handleSkip}
 *   onComplete={handleComplete}
 * />
 * ```
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import FastImage from '@d11/react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AdViewData } from '../../types/ads';
import { formatWatchTime } from '../../types/ads';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AdPlayerProps {
  adData: AdViewData | null;
  watchTime: number;
  isPlaying: boolean;
  canSkip: boolean;
  skipTimeReached: boolean;
  completionPercentage: number;
  requiredWatchTime?: number;
  onPlayPause: () => void;
  onSkip: () => void;
  onComplete?: () => void;
  style?: any;
}

const AdPlayer: React.FC<AdPlayerProps> = ({
  adData,
  watchTime,
  isPlaying,
  canSkip,
  skipTimeReached,
  completionPercentage,
  requiredWatchTime = 0,
  onPlayPause,
  onSkip,
  onComplete,
  style,
}) => {
  const videoRef = useRef<VideoRef>(null);
  const [isBuffering, setIsBuffering] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [showComplete, setShowComplete] = React.useState(false);

  // Check if ad is complete
  useEffect(() => {
    if (completionPercentage >= 100 && !showComplete) {
      setShowComplete(true);
    }
  }, [completionPercentage, showComplete]);

  // Handle video errors
  const handleVideoError = (error: any) => {
    console.error('Video playback error:', error);
    setHasError(true);
  };

  // Handle video buffering
  const handleBuffer = (meta: { isBuffering: boolean }) => {
    setIsBuffering(meta.isBuffering);
  };

  // Determine if content is video or image
  const mediaUrl = adData?.ad_upload_filename || '';
  const isVideoAd = mediaUrl && (
    mediaUrl.includes('.mp4') ||
    mediaUrl.includes('.mov') ||
    mediaUrl.includes('video') ||
    adData?.media_type === 1
  );

  if (!adData) {
    return (
      <View style={[styles.container, style, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading ad...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Ad Content (Video or Image) */}
      <View style={styles.mediaContainer}>
        {isVideoAd ? (
          <>
            {/* Video Player */}
            <Video
              ref={videoRef}
              source={{ uri: mediaUrl }}
              style={styles.video}
              resizeMode="contain"
              paused={!isPlaying}
              repeat={false}
              onError={handleVideoError}
              onBuffer={handleBuffer}
              controls={false}
              muted={false}
            />
            
            {/* Buffering Indicator */}
            {isBuffering && (
              <View style={styles.bufferingOverlay}>
                <ActivityIndicator size="large" color="#FFFFFF" />
              </View>
            )}

            {/* Error State */}
            {hasError && (
              <View style={styles.errorOverlay}>
                <Icon name="error-outline" size={48} color="#EF4444" />
                <Text style={styles.errorText}>Failed to load video</Text>
              </View>
            )}
          </>
        ) : (
          /* Image Ad */
          <FastImage
            source={{ 
              uri: mediaUrl, 
              priority: FastImage.priority.high 
            }}
            style={styles.image}
            resizeMode={FastImage.resizeMode.contain}
          />
        )}

        {/* Play/Pause Overlay Button */}
        <TouchableOpacity
          style={styles.playPauseOverlay}
          onPress={onPlayPause}
          activeOpacity={0.7}
        >
          <View style={styles.playPauseButton}>
            <Icon
              name={isPlaying ? 'pause' : 'play-arrow'}
              size={48}
              color="#FFFFFF"
            />
          </View>
        </TouchableOpacity>

        {/* Skip Button (Top Right) */}
        {canSkip && skipTimeReached && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={onSkip}
            activeOpacity={0.8}
          >
            <Text style={styles.skipButtonText}>Skip Ad →</Text>
          </TouchableOpacity>
        )}

        {/* Completion Overlay */}
        {showComplete && (
          <View style={styles.completeOverlay}>
            <View style={styles.completeContent}>
              <Icon name="check-circle" size={64} color="#10B981" />
              <Text style={styles.completeTitle}>Ad Complete!</Text>
              <Text style={styles.completeSubtitle}>
                You earned ₹{adData.view_price?.toFixed(2)}
              </Text>
              {onComplete && (
                <TouchableOpacity
                  style={styles.claimButton}
                  onPress={onComplete}
                  activeOpacity={0.8}
                >
                  <Text style={styles.claimButtonText}>Claim Reward</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.min(completionPercentage, 100)}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(completionPercentage)}%
        </Text>
      </View>

      {/* Timer and Info */}
      <View style={styles.infoContainer}>
        <View style={styles.timerContainer}>
          <Icon name="schedule" size={16} color="#6B7280" />
          <Text style={styles.timerText}>
            {formatWatchTime(watchTime)} / {formatWatchTime(requiredWatchTime)}
          </Text>
        </View>

        {/* Ad Title */}
        {adData.campaign_name && (
          <Text style={styles.adTitle} numberOfLines={1}>
            {adData.campaign_name}
          </Text>
        )}

        {/* Payout Info */}
        <View style={styles.payoutContainer}>
          <Icon name="account-balance-wallet" size={16} color="#10B981" />
          <Text style={styles.payoutText}>
            Earn ₹{adData.view_price?.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={onPlayPause}
          activeOpacity={0.7}
        >
          <Icon
            name={isPlaying ? 'pause-circle-filled' : 'play-circle-filled'}
            size={40}
            color="#4F46E5"
          />
          <Text style={styles.controlButtonText}>
            {isPlaying ? 'Pause' : 'Resume'}
          </Text>
        </TouchableOpacity>

        {canSkip && skipTimeReached && (
          <TouchableOpacity
            style={[styles.controlButton, styles.skipControlButton]}
            onPress={onSkip}
            activeOpacity={0.7}
          >
            <Icon name="skip-next" size={40} color="#F59E0B" />
            <Text style={styles.controlButtonText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#000000',
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  mediaContainer: {
    width: '100%',
    height: SCREEN_WIDTH * (9 / 16), // 16:9 aspect ratio
    backgroundColor: '#000000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  playPauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  skipButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  completeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeContent: {
    alignItems: 'center',
    padding: 24,
  },
  completeTitle: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  completeSubtitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
  },
  claimButton: {
    marginTop: 24,
    backgroundColor: '#10B981',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  claimButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1F2937',
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 4,
  },
  progressText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    minWidth: 45,
    textAlign: 'right',
  },
  infoContainer: {
    padding: 16,
    backgroundColor: '#111827',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timerText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  adTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  payoutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payoutText: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#111827',
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  controlButton: {
    alignItems: 'center',
  },
  skipControlButton: {
    opacity: 1,
  },
  controlButtonText: {
    marginTop: 4,
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
});

export default AdPlayer;
