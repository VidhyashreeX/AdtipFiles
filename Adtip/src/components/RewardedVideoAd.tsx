import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import { useAdReward } from '../hooks/useAdReward';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

interface RewardedVideoAdProps {
  userId: number;
  campaignId: number;
  videoUrl: string;
  creativeId: number;
  onAdComplete?: () => void;
  onAdSkipped?: () => void;
  onAdClosed?: () => void;
}

/**
 * RewardedVideoAd Component for React Native
 * Displays a rewarded video ad and handles user crediting
 */
const RewardedVideoAd: React.FC<RewardedVideoAdProps> = ({
  userId,
  campaignId,
  videoUrl,
  creativeId,
  onAdComplete,
  onAdSkipped,
  onAdClosed,
}) => {
  const videoRef = useRef<VideoRef>(null);
  const { checkEligibility, creditReward, state } = useAdReward();

  const [watchTime, setWatchTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasCredited, setHasCredited] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const sessionIdRef = useRef(
    `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );

  // Check eligibility when component mounts
  useEffect(() => {
    checkEligibility(userId, campaignId);
  }, [userId, campaignId, checkEligibility]);

  /**
   * Handle video progress
   */
  const handleProgress = (data: { currentTime: number; playableDuration: number }) => {
    const currentTime = data.currentTime;
    setWatchTime(currentTime);

    // Enable skip button after skip offset
    if (state.adDetails?.isSkippable && currentTime >= (state.adDetails.skipOffset || 5)) {
      setCanSkip(true);
    }
  };

  /**
   * Handle video load
   */
  const handleLoad = (data: { duration: number }) => {
    setDuration(data.duration);
  };

  /**
   * Handle video end
   */
  const handleEnd = async () => {
    setIsCompleted(true);

    // Credit user if eligible and not already credited
    if (state.eligible && !hasCredited) {
      setHasCredited(true);
      const success = await creditReward(
        userId,
        campaignId,
        creativeId,
        watchTime,
        sessionIdRef.current
      );

      if (success) {
        // Wait a bit to show completion message
        setTimeout(() => {
          onAdComplete?.();
        }, 3000);
      }
    } else {
      onAdComplete?.();
    }
  };

  /**
   * Handle skip button press
   */
  const handleSkip = () => {
    if (canSkip) {
      setIsPaused(true);
      onAdSkipped?.();
    }
  };

  /**
   * Handle close button press
   */
  const handleClose = () => {
    setIsPaused(true);
    onAdClosed?.();
  };

  // Show loading state
  if (state.loading && !state.adDetails) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Loading ad...</Text>
      </View>
    );
  }

  // Show message if not eligible
  if (!state.eligible) {
    return (
      <View style={styles.notEligibleContainer}>
        <Icon name="gift-outline" size={64} color="#FFD700" />
        <Text style={styles.notEligibleTitle}>Ad Not Available</Text>
        <Text style={styles.notEligibleMessage}>
          {state.error || 'You have already watched this ad or it is not available.'}
        </Text>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progress = duration > 0 ? (watchTime / duration) * 100 : 0;
  const skipTimeRemaining = Math.ceil((state.adDetails?.skipOffset || 5) - watchTime);

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Video Player */}
      <Video
        ref={videoRef}
        source={{ uri: videoUrl }}
        style={styles.video}
        resizeMode="contain"
        paused={isPaused}
        onProgress={handleProgress}
        onLoad={handleLoad}
        onEnd={handleEnd}
        controls={false}
      />

      {/* Top Overlay - Ad Info */}
      <View style={styles.topOverlay}>
        <View style={styles.adInfo}>
          <Icon name="gift" size={24} color="#FFD700" />
          <View style={styles.adTextContainer}>
            <Text style={styles.rewardText}>
              Watch & Earn ₹{state.adDetails?.rewardAmount}
            </Text>
            <Text style={styles.campaignText}>
              {state.adDetails?.campaignName}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.closeIconButton} onPress={handleClose}>
          <Icon name="close" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Skip Button */}
      {state.adDetails?.isSkippable && (
        <View style={styles.skipContainer}>
          {canSkip ? (
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Skip Ad</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.skipTimer}>
              <Icon name="clock-outline" size={20} color="#FFF" />
              <Text style={styles.skipTimerText}>
                Skip in {skipTimeRemaining > 0 ? skipTimeRemaining : 0}s
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      {/* Completion Overlay */}
      {isCompleted && hasCredited && (
        <View style={styles.completionOverlay}>
          <Icon name="gift" size={80} color="#FFD700" />
          <Text style={styles.completionTitle}>Congratulations! 🎉</Text>
          <Text style={styles.completionAmount}>
            You earned ₹{state.adDetails?.rewardAmount}
          </Text>
          <TouchableOpacity
            style={styles.completionButton}
            onPress={handleClose}
          >
            <Text style={styles.completionButtonText}>Awesome!</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    width: width,
    height: height,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFF',
    marginTop: 16,
    fontSize: 16,
  },
  notEligibleContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  notEligibleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 8,
  },
  notEligibleMessage: {
    fontSize: 16,
    color: '#CCC',
    textAlign: 'center',
    marginBottom: 24,
  },
  closeButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingTop: 48,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  adInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  adTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  rewardText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  campaignText: {
    color: '#CCC',
    fontSize: 12,
    marginTop: 2,
  },
  closeIconButton: {
    padding: 8,
  },
  skipContainer: {
    position: 'absolute',
    bottom: 80,
    right: 16,
  },
  skipButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  skipButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  skipTimer: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  skipTimerText: {
    color: '#FFF',
    fontSize: 14,
    marginLeft: 8,
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#444',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFD700',
  },
  completionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 8,
  },
  completionAmount: {
    fontSize: 24,
    color: '#FFD700',
    marginBottom: 32,
  },
  completionButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 8,
  },
  completionButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default RewardedVideoAd;
