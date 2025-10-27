import React, { useEffect, useRef, useState } from 'react';
import { useAdReward } from '../hooks/useAdReward';
import { Loader2, Gift, Clock, X } from 'lucide-react';

interface RewardedVideoAdProps {
  campaignId: number;
  videoUrl: string;
  creativeId: number;
  onAdComplete?: () => void;
  onAdSkipped?: () => void;
  onAdClosed?: () => void;
  autoPlay?: boolean;
}

/**
 * RewardedVideoAd Component
 * Displays a rewarded video ad and handles user crediting
 */
const RewardedVideoAd: React.FC<RewardedVideoAdProps> = ({
  campaignId,
  videoUrl,
  creativeId,
  onAdComplete,
  onAdSkipped,
  onAdClosed,
  autoPlay = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { checkEligibility, creditReward, state } = useAdReward();
  
  const [watchTime, setWatchTime] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasCredited, setHasCredited] = useState(false);
  const sessionIdRef = useRef(`session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  // Check eligibility when component mounts
  useEffect(() => {
    checkEligibility(campaignId);
  }, [campaignId, checkEligibility]);

  // Track video watch time
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      setWatchTime(currentTime);

      // Enable skip button after skip offset
      if (state.adDetails?.isSkippable && currentTime >= (state.adDetails.skipOffset || 5)) {
        setCanSkip(true);
      }
    };

    const handleEnded = async () => {
      setIsCompleted(true);
      
      // Credit user if eligible and not already credited
      if (state.eligible && !hasCredited) {
        await handleCreditReward(video.currentTime);
      }
      
      onAdComplete?.();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [state.eligible, state.adDetails, hasCredited, onAdComplete]);

  /**
   * Credit reward to user
   */
  const handleCreditReward = async (duration: number) => {
    if (hasCredited || !state.eligible || !state.adDetails) {
      return;
    }

    setHasCredited(true);

    try {
      await creditReward(
        campaignId,
        creativeId,
        duration,
        sessionIdRef.current
      );
    } catch (error) {
      console.error('Failed to credit reward:', error);
      setHasCredited(false);
    }
  };

  /**
   * Handle skip button click
   */
  const handleSkip = () => {
    if (videoRef.current && canSkip) {
      videoRef.current.pause();
      onAdSkipped?.();
    }
  };

  /**
   * Handle close button click
   */
  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    onAdClosed?.();
  };

  // Show loading state while checking eligibility
  if (state.loading && !state.adDetails) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center text-white">
          <Loader2 className="animate-spin h-12 w-12 mx-auto mb-4" />
          <p>Loading ad...</p>
        </div>
      </div>
    );
  }

  // Show message if not eligible
  if (!state.eligible) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center text-white max-w-md px-4">
          <Gift className="h-16 w-16 mx-auto mb-4 text-yellow-400" />
          <h2 className="text-2xl font-bold mb-2">Ad Not Available</h2>
          <p className="text-gray-300 mb-4">
            {state.error || 'You have already watched this ad or it is not available.'}
          </p>
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black">
      {/* Video Player */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        autoPlay={autoPlay}
        playsInline
      />

      {/* Ad Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          {/* Ad Info */}
          <div className="flex items-center space-x-3">
            <Gift className="h-6 w-6 text-yellow-400" />
            <div className="text-white">
              <p className="text-sm font-semibold">
                Watch & Earn ₹{state.adDetails?.rewardAmount}
              </p>
              <p className="text-xs text-gray-300">
                {state.adDetails?.campaignName}
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-full transition"
            aria-label="Close ad"
          >
            <X className="h-6 w-6 text-white" />
          </button>
        </div>
      </div>

      {/* Skip Button */}
      {state.adDetails?.isSkippable && (
        <div className="absolute bottom-20 right-4">
          {canSkip ? (
            <button
              onClick={handleSkip}
              className="px-6 py-3 bg-white/90 hover:bg-white text-black font-semibold rounded-lg transition shadow-lg"
            >
              Skip Ad
            </button>
          ) : (
            <div className="px-6 py-3 bg-black/60 text-white rounded-lg flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>
                Skip in {Math.ceil((state.adDetails.skipOffset || 5) - watchTime)}s
              </span>
            </div>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
        <div
          className="h-full bg-yellow-400 transition-all duration-300"
          style={{
            width: `${
              state.adDetails?.videoDuration
                ? (watchTime / state.adDetails.videoDuration) * 100
                : 0
            }%`,
          }}
        />
      </div>

      {/* Completion Message */}
      {isCompleted && hasCredited && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center text-white max-w-md px-4">
            <div className="animate-bounce mb-4">
              <Gift className="h-20 w-20 mx-auto text-yellow-400" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Congratulations! 🎉</h2>
            <p className="text-xl mb-6">
              You earned ₹{state.adDetails?.rewardAmount}
            </p>
            <button
              onClick={handleClose}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold text-lg transition"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardedVideoAd;
