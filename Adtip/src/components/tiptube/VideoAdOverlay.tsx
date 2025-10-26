/**
 * VideoAdOverlay - Overlay UI for video ads
 * Displays ad information, skip button, and clickable area
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { VideoAdResponse } from '../../services/ApiService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VideoAdOverlayProps {
  adData: VideoAdResponse;
  videoDuration: number; // Duration of the ad video
  currentTime: number; // Current playback time of the ad
  onSkip: () => void;
  onClick: () => void;
}

const VideoAdOverlay: React.FC<VideoAdOverlayProps> = ({
  adData,
  videoDuration,
  currentTime,
  onSkip,
  onClick,
}) => {
  const [canSkip, setCanSkip] = useState(false);

  // Calculate countdowns
  const countdown = Math.max(0, Math.ceil(videoDuration - currentTime));
  const skipCountdown = Math.max(0, Math.ceil(adData.skipOffset - currentTime));

  // Check if skip button should be enabled
  useEffect(() => {
    if (!canSkip && adData.isSkippable && currentTime >= adData.skipOffset) {
      setCanSkip(true);
    }
  }, [currentTime, adData.isSkippable, adData.skipOffset, canSkip]);

  // Determine what text to show in bottom-left corner
  const getAdInfoText = () => {
    if (!adData.isSkippable) {
      return `Ad • Video plays in ${countdown}s`;
    }
    
    if (!canSkip) {
      return `Ad • You can skip in ${skipCountdown}s`;
    }
    
    return `Ad • ${countdown}s`;
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Clickable area for "Learn More" */}
      <TouchableOpacity
        style={styles.clickableArea}
        onPress={onClick}
        activeOpacity={1}
      >
        <View style={styles.learnMoreContainer}>
          <Text style={styles.learnMoreText}>Visit Advertiser</Text>
          <Text style={styles.learnMoreIcon}>→</Text>
        </View>
      </TouchableOpacity>

      {/* Bottom overlay with ad info and skip button */}
      <View style={styles.bottomOverlay} pointerEvents="box-none">
        {/* Ad info text (left) */}
        <View style={styles.adInfoContainer}>
          <Text style={styles.adInfoText}>{getAdInfoText()}</Text>
        </View>

        {/* Skip button (right) */}
        {canSkip && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={onSkip}
            activeOpacity={0.8}
          >
            <Text style={styles.skipButtonText}>Skip Ad</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  clickableArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  learnMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
  },
  learnMoreText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  learnMoreIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 16,
  },
  adInfoContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  adInfoText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  skipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  skipButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default VideoAdOverlay;
