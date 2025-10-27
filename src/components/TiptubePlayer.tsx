/**
 * TiptubePlayer - Video Player with Integrated Advertising
 * 
 * YouTube-style video player that supports:
 * - Pre-roll ads (skippable/non-skippable)
 * - Mid-roll ads at specified cue points
 * - Companion banner ads
 * - Full ad analytics tracking
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactPlayer from 'react-player';
import AdOverlay from './AdOverlay';
import CompanionBanner from './CompanionBanner';
import { trackAdEvent } from '../utils/adTracking';
import axios from 'axios';
import VideoAdRewardService from '../services/VideoAdRewardService';
import toast from 'react-hot-toast';

interface TiptubePlayerProps {
  videoId: number;
  videoUrl: string;
  userId?: number;
  autoplay?: boolean;
  width?: string;
  height?: string;
  onVideoEnd?: () => void;
  onVideoPlay?: () => void;
}

interface PlayerProgressState {
  played: number;
  playedSeconds: number;
  loaded: number;
  loadedSeconds: number;
}

interface AdData {
  adId: number;
  campaignId: number;
  placementId: number;
  sessionId: string;
  creative: {
    id: number; // Creative ID for reward tracking (REQUIRED)
    type: string;
    url: string;
    duration: number;
    thumbnail?: string;
    clickThroughUrl?: string;
  };
  placement: 'pre-roll' | 'mid-roll' | 'post-roll' | 'banner';
  isSkippable: boolean;
  skipOffset: number;
  trackingUrls: {
    impression: string;
    start: string;
    firstQuartile: string;
    midpoint: string;
    thirdQuartile: string;
    complete: string;
    skip: string;
    click: string;
    error: string;
  };
  companionBanner?: {
    imageUrl: string;
    clickThroughUrl: string;
  };
}

const TiptubePlayer: React.FC<TiptubePlayerProps> = ({
  videoId,
  videoUrl,
  userId,
  autoplay = false,
  width = '100%',
  height = '100%',
  onVideoEnd,
  onVideoPlay,
}) => {
  // Player state
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [currentAdData, setCurrentAdData] = useState<AdData | null>(null);
  const [mainVideoReady, setMainVideoReady] = useState(false);
  const [preRollComplete, setPreRollComplete] = useState(false);
  const [midRollCuePoints, setMidRollCuePoints] = useState<number[]>([]);
  const [playedCuePoints, setPlayedCuePoints] = useState<Set<number>>(new Set());
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [adCurrentTime, setAdCurrentTime] = useState(0); // Track ad playback time for UI
  
  // Refs
  const playerRef = useRef<any>(null);
  const adPlayerRef = useRef<any>(null);
  const lastQuartileTracked = useRef<string | null>(null);
  const adPlayedSeconds = useRef<number>(0); // Track actual ad playback time
  const adStartTime = useRef<number>(0); // Track when ad started (fallback)
  const adTimerInterval = useRef<NodeJS.Timeout | null>(null); // Fallback timer

  // Base API URL
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  // Disable ads if explicitly set to true, or if not in production
  //const DISABLE_ADS = import.meta.env.VITE_DISABLE_ADS === 'true' || import.meta.env.VITE_DISABLE_ADS === true || true;
  const DISABLE_ADS=false
  /**
   * Fetch mid-roll cue points on component mount
   */
  useEffect(() => {
    const fetchCuePoints = async () => {
      // Skip fetching cue points if ads are disabled
      if (DISABLE_ADS) {
        console.log('[TiptubePlayer] Ads disabled, skipping cue points fetch');
        return;
      }

      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/v1/video-ads/cue-points/${videoId}`
        );
        
        if (response.data.success && response.data.data?.cuePoints) {
          setMidRollCuePoints(response.data.data.cuePoints);
          console.log('[TiptubePlayer] Mid-roll cue points:', response.data.data.cuePoints);
        }
      } catch (error) {
        console.error('[TiptubePlayer] Error fetching cue points:', error);
        // Don't fail the entire player if cue points can't be fetched
      }
    };

    fetchCuePoints();
  }, [videoId, API_BASE_URL, DISABLE_ADS]);

  /**
   * Request an ad from the backend
   */
  const requestAd = async (placement: 'pre-roll' | 'mid-roll' | 'post-roll', videoPosition = 0): Promise<AdData | null> => {
    try {
      // Skip ads if disabled in development
      if (DISABLE_ADS) {
        console.log(`[TiptubePlayer] Ads disabled, skipping ${placement} ad`);
        return null;
      }

      console.log(`[TiptubePlayer] Requesting ${placement} ad for video ${videoId}`);
      
      const params = {
        videoId,
        userId: userId || null,
        placement,
        videoDuration: Math.floor(videoDuration),
        videoPosition: Math.floor(videoPosition),
        platform: 'web'
      };

      const response = await axios.get(`${API_BASE_URL}/api/v1/video-ads/request`, { params });

      if (response.data.status === 200 && response.data.data) {
        const adData = response.data.data;
        console.log('🎬 [TiptubePlayer] ========== RAW AD RESPONSE ==========');
        console.log('🎬 [TiptubePlayer] Full response:', JSON.stringify(adData, null, 2));
        console.log('🎬 [TiptubePlayer] Creative object:', adData.creative);
        console.log('🎬 [TiptubePlayer] Creative ID:', adData.creative?.id);
        
        // Validate that creative.id exists
        if (!adData.creative?.id) {
          console.error('❌ [TiptubePlayer] CRITICAL ERROR: Backend response missing creative.id!');
          console.error('❌ [TiptubePlayer] This will prevent reward crediting!');
          return null; // Don't show ad if we can't track it properly
        }
        
        console.log('✅ [TiptubePlayer] Ad validated with creative ID:', adData.creative.id);
        return adData;
      } else {
        console.log('[TiptubePlayer] No ad available');
        return null;
      }
    } catch (error) {
      // 404 is a valid response when no ads are available
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.log('[TiptubePlayer] No ads available (404)');
        return null;
      }
      
      console.error('[TiptubePlayer] Error requesting ad:', error);
      return null;
    }
  };

  /**
   * Initialize video player - handle ads or skip to content
   */
  useEffect(() => {
    const initializePlayer = async () => {
      if (preRollComplete || isAdPlaying) return;

      // Skip ads entirely if disabled (default behavior for development)
      if (DISABLE_ADS) {
        console.log('[TiptubePlayer] Ads disabled, starting main content immediately');
        setPreRollComplete(true);
        return;
      }

      try {
        // Set a very short timeout to prevent any delays
        const timeoutPromise = new Promise<null>((resolve) => {
          setTimeout(() => {
            console.log('[TiptubePlayer] Ad request timeout, starting main content');
            resolve(null);
          }, 1000); // 1 second timeout for immediate fallback
        });

        const adData = await Promise.race([requestAd('pre-roll'), timeoutPromise]);
        
        if (adData) {
          console.log('🎬 [TiptubePlayer] ========== AD RECEIVED ==========');
          console.log('🎬 [TiptubePlayer] Ad Data:', {
            campaignId: adData.campaignId,
            creativeId: adData.creative?.id,
            isSkippable: adData.isSkippable,
            skipOffset: adData.skipOffset,
            duration: adData.creative?.duration,
            sessionId: adData.sessionId
          });
          
          // Reset ad tracking
          adPlayedSeconds.current = 0;
          adStartTime.current = Date.now();
          lastQuartileTracked.current = null;
          setAdCurrentTime(0); // Reset UI timer
          
          // Start fallback timer (updates every 100ms)
          if (adTimerInterval.current) {
            clearInterval(adTimerInterval.current);
          }
          adTimerInterval.current = setInterval(() => {
            const elapsed = (Date.now() - adStartTime.current) / 1000;
            // Only update if onProgress hasn't updated recently (fallback)
            if (elapsed > adPlayedSeconds.current + 0.5) {
              adPlayedSeconds.current = elapsed;
              setAdCurrentTime(elapsed); // Update UI state!
              console.log('⏱️ [TiptubePlayer] Fallback timer update:', elapsed.toFixed(2) + 's');
            }
          }, 100);
          
          setCurrentAdData(adData);
          setIsAdPlaying(true);
          
          console.log('🎬 [TiptubePlayer] Ad state set - ad should start playing now');
          
          // Track impression
          await trackAdEvent(adData.trackingUrls.impression);
        } else {
          // No pre-roll available or timeout, start main content immediately
          console.log('[TiptubePlayer] No pre-roll ad or timeout, starting main content');
          setPreRollComplete(true);
        }
      } catch (error) {
        // If ad request fails, fallback to main content immediately
        console.error('[TiptubePlayer] Pre-roll ad request failed, starting main content:', error);
        setPreRollComplete(true);
      }
    };

    // Initialize immediately
    if (!preRollComplete) {
      initializePlayer();
    }
  }, [preRollComplete, isAdPlaying, DISABLE_ADS]);

  /**
   * Emergency fallback - ensure video always plays within 2 seconds
   */
  useEffect(() => {
    const emergencyTimeout = setTimeout(() => {
      if (!preRollComplete && !isAdPlaying) {
        console.log('[TiptubePlayer] Emergency fallback - forcing video playback');
        setPreRollComplete(true);
      }
    }, 2000);

    return () => clearTimeout(emergencyTimeout);
  }, [preRollComplete, isAdPlaying]);

  /**
   * Cleanup timer on unmount
   */
  useEffect(() => {
    return () => {
      if (adTimerInterval.current) {
        clearInterval(adTimerInterval.current);
        adTimerInterval.current = null;
        console.log('🔴 [TiptubePlayer] Component unmounting - cleanup fallback timer');
      }
    };
  }, []);

  /**
   * Log ad current time changes for debugging
   */
  useEffect(() => {
    if (isAdPlaying) {
      console.log('🎬 [TiptubePlayer] adCurrentTime state updated:', adCurrentTime);
    }
  }, [adCurrentTime, isAdPlaying]);

  /**
   * Monitor main video progress for mid-roll insertion
   */
  useEffect(() => {
    if (isAdPlaying || !preRollComplete || midRollCuePoints.length === 0) return;

    // Check if we've reached a cue point
    const nearestCuePoint = midRollCuePoints.find(
      (cuePoint) => 
        currentVideoTime >= cuePoint && 
        currentVideoTime < cuePoint + 1 && 
        !playedCuePoints.has(cuePoint)
    );

    if (nearestCuePoint !== undefined) {
      console.log('[TiptubePlayer] Reached mid-roll cue point:', nearestCuePoint);
      handleMidRollAd(nearestCuePoint);
    }
  }, [currentVideoTime, midRollCuePoints, isAdPlaying, preRollComplete, playedCuePoints]);

  /**
   * Handle mid-roll ad insertion
   */
  const handleMidRollAd = async (cuePoint: number) => {
    // Pause main video
    if (playerRef.current) {
      const internalPlayer = playerRef.current.getInternalPlayer();
      if (internalPlayer && typeof internalPlayer.pause === 'function') {
        internalPlayer.pause();
      }
    }

    // Mark cue point as played
    setPlayedCuePoints(prev => new Set([...prev, cuePoint]));

    // Request mid-roll ad
    const adData = await requestAd('mid-roll', cuePoint);

    if (adData) {
      setCurrentAdData(adData);
      setIsAdPlaying(true);
      await trackAdEvent(adData.trackingUrls.impression);
    } else {
      // No ad available, resume main video
      console.log('[TiptubePlayer] No mid-roll ad available, resuming video');
    }
  };

  /**
   * Handle ad completion or skip
   */
  const handleAdEnd = useCallback(async (skipped: boolean = false) => {
    console.log('🔴 [TiptubePlayer] ==================== AD END TRIGGERED ====================');
    console.log('🔴 [TiptubePlayer] handleAdEnd called with skipped:', skipped);
    
    if (!currentAdData) {
      console.log('🔴 [TiptubePlayer] NO CURRENT AD DATA - RETURNING');
      return;
    }

    // Use the tracked playback time (more accurate than wall clock time)
    const watchDuration = adPlayedSeconds.current;

    console.log('🔴 [TiptubePlayer] Ad ending details:', {
      skipped,
      watchDuration,
      skipOffset: currentAdData.skipOffset,
      isSkippable: currentAdData.isSkippable,
      userId,
      creativeId: currentAdData.creative.id,
      campaignId: currentAdData.campaignId,
      sessionId: currentAdData.sessionId
    });

    // Track skip or complete event
    if (skipped) {
      console.log('🔴 [TiptubePlayer] Tracking SKIP event');
      await trackAdEvent(currentAdData.trackingUrls.skip);
    } else {
      console.log('🔴 [TiptubePlayer] Tracking COMPLETE event');
      await trackAdEvent(currentAdData.trackingUrls.complete);
    }

    // Credit reward if user is logged in and has watched enough of the ad
    console.log('🔴 [TiptubePlayer] Checking reward eligibility:', {
      hasUserId: !!userId,
      userId: userId,
      hasCreativeId: !!currentAdData.creative.id,
      creativeId: currentAdData.creative.id,
      campaignId: currentAdData.campaignId
    });
    
    if (userId && currentAdData.creative.id) {
      console.log('✅ [TiptubePlayer] User ID and Creative ID present - proceeding with reward logic');
      
      try {
        // For skippable ads: must watch past skip offset
        // For non-skippable ads: must watch to completion
        const shouldCredit = skipped 
          ? (currentAdData.isSkippable && watchDuration >= currentAdData.skipOffset)
          : true; // Always credit if they watched to the end

        console.log('🔴 [TiptubePlayer] Reward credit check:', {
          shouldCredit,
          calculation: skipped ? `${watchDuration} >= ${currentAdData.skipOffset}` : 'watched to end',
          watchDuration,
          skipOffset: currentAdData.skipOffset,
          isSkippable: currentAdData.isSkippable
        });

        if (shouldCredit) {
          console.log('🟢 [TiptubePlayer] ✅ SHOULD CREDIT - Calling creditReward API...');
          console.log('🟢 [TiptubePlayer] API Call Parameters:', {
            userId,
            campaignId: currentAdData.campaignId,
            creativeId: currentAdData.creative.id,
            viewDuration: watchDuration,
            sessionId: currentAdData.sessionId
          });
          
          const response = await VideoAdRewardService.creditReward(
            userId,
            currentAdData.campaignId,
            currentAdData.creative.id,
            watchDuration,
            currentAdData.sessionId
          );

          console.log('🟢 [TiptubePlayer] ✅ REWARD API RESPONSE:', response);
          console.log('🟢 [TiptubePlayer] Response Status:', response.status);
          console.log('🟢 [TiptubePlayer] Response Data:', response.data);

          if (response.status === 200 && response.data.credited) {
            console.log('🎉 [TiptubePlayer] ✅✅✅ REWARD CREDITED SUCCESSFULLY! Amount:', response.data.rewardAmount);
            
            // Show success message
            toast.success(
              `🎉 ${response.message} You earned ₹${response.data.rewardAmount}!`,
              { duration: 4000 }
            );
            
            // Also show alert for testing
            alert(`✅ REWARD CREDITED!\nAmount: ₹${response.data.rewardAmount}\nCampaign: ${currentAdData.campaignId}\nWatch Duration: ${watchDuration}s`);
          } else {
            console.log('⚠️ [TiptubePlayer] Response received but credited=false:', response);
          }
        } else {
          console.log('🔴 [TiptubePlayer] ❌ NOT CREDITING - insufficient watch duration');
          console.log('🔴 [TiptubePlayer] Required:', currentAdData.skipOffset, 'Actual:', watchDuration);
          alert(`❌ NOT CREDITED\nRequired: ${currentAdData.skipOffset}s\nYou watched: ${watchDuration}s`);
        }
      } catch (error: any) {
        console.error('🔴 [TiptubePlayer] ❌❌❌ ERROR in credit reward:', error);
        console.error('🔴 [TiptubePlayer] Error details:', {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status
        });
        
        // Show error alert for testing
        alert(`❌ ERROR: ${error?.message || 'Unknown error'}\nCheck console for details`);
        
        // Only log specific errors (already rewarded is expected, not an error)
        if (error?.message && !error.message.includes('already been rewarded')) {
          console.warn('[TiptubePlayer] Reward credit error:', error.message);
        }
      }
    } else {
      console.log('🔴 [TiptubePlayer] ❌ Skipping reward credit - missing userId or creativeId:', {
        hasUserId: !!userId,
        userId: userId,
        hasCreativeId: !!currentAdData.creative.id,
        creativeId: currentAdData.creative.id
      });
      alert(`❌ CANNOT CREDIT\nUser ID: ${userId || 'MISSING'}\nCreative ID: ${currentAdData.creative.id || 'MISSING'}`);
    }

    // Reset ad state
    console.log('🔴 [TiptubePlayer] Resetting ad state...');
    
    // Clear fallback timer
    if (adTimerInterval.current) {
      clearInterval(adTimerInterval.current);
      adTimerInterval.current = null;
      console.log('🔴 [TiptubePlayer] Fallback timer cleared');
    }
    
    setIsAdPlaying(false);
    setCurrentAdData(null);
    setAdCurrentTime(0);
    lastQuartileTracked.current = null;
    adPlayedSeconds.current = 0;
    adStartTime.current = 0;

    // Mark pre-roll as complete if this was a pre-roll
    if (!preRollComplete) {
      setPreRollComplete(true);
    }

    console.log('🔴 [TiptubePlayer] ==================== AD END COMPLETE ====================');
  }, [currentAdData, preRollComplete, userId]);

  /**
   * Handle ad progress for quartile tracking
   */
  const handleAdProgress = useCallback(async (state: PlayerProgressState) => {
    if (!currentAdData) return;

    // Safety check - ensure state has required properties
    if (!state || typeof state.playedSeconds !== 'number' || typeof state.played !== 'number') {
      console.warn('⚠️ [TiptubePlayer] Invalid progress state:', state);
      return;
    }

    // Track actual playback time
    adPlayedSeconds.current = state.playedSeconds;
    setAdCurrentTime(state.playedSeconds); // Update state for UI re-render
    
    console.log('⏱️ [TiptubePlayer] Ad progress update - setting adCurrentTime:', state.playedSeconds);
    
    // Log every second for debugging
    const currentSecond = Math.floor(state.playedSeconds);
    const previousSecond = Math.floor(state.playedSeconds - 0.1);
    
    if (currentSecond !== previousSecond) {
      console.log('📊 [TiptubePlayer] Ad Progress:', {
        playedSeconds: state.playedSeconds.toFixed(2),
        played: (state.played * 100).toFixed(1) + '%',
        skipOffset: currentAdData.skipOffset,
        canSkip: state.playedSeconds >= currentAdData.skipOffset
      });
    }

    const progress = state.played * 100; // Percentage

    // Track start
    if (progress > 0 && lastQuartileTracked.current === null) {
      await trackAdEvent(currentAdData.trackingUrls.start);
      lastQuartileTracked.current = 'start';
      console.log('🎬 [TiptubePlayer] Ad started playing - tracking enabled');
    }

    // Track quartiles
    if (progress >= 25 && lastQuartileTracked.current === 'start') {
      await trackAdEvent(currentAdData.trackingUrls.firstQuartile);
      lastQuartileTracked.current = 'firstQuartile';
      console.log('📊 [TiptubePlayer] First quartile reached (25%)');
    } else if (progress >= 50 && lastQuartileTracked.current === 'firstQuartile') {
      await trackAdEvent(currentAdData.trackingUrls.midpoint);
      lastQuartileTracked.current = 'midpoint';
      console.log('📊 [TiptubePlayer] Midpoint reached (50%)');
    } else if (progress >= 75 && lastQuartileTracked.current === 'midpoint') {
      await trackAdEvent(currentAdData.trackingUrls.thirdQuartile);
      lastQuartileTracked.current = 'thirdQuartile';
      console.log('📊 [TiptubePlayer] Third quartile reached (75%)');
    }
  }, [currentAdData]);

  /**
   * Handle main video ready
   */
  const handleVideoReady = useCallback(() => {
    setMainVideoReady(true);
    console.log('[TiptubePlayer] Main video ready');
  }, []);

  /**
   * Handle main video duration
   */
  const handleVideoDuration = useCallback((duration: number) => {
    setVideoDuration(duration);
    console.log('[TiptubePlayer] Video duration:', duration);
  }, []);

  /**
   * Handle main video progress
   */
  const handleVideoProgress = useCallback((state: PlayerProgressState) => {
    setCurrentVideoTime(state.playedSeconds);
  }, []);

  /**
   * Handle main video end
   */
  const handleVideoEnd = useCallback(() => {
    console.log('[TiptubePlayer] Main video ended');
    onVideoEnd?.();
  }, [onVideoEnd]);

  /**
   * Handle ad click
   */
  const handleAdClick = async () => {
    if (!currentAdData) return;
    
    await trackAdEvent(currentAdData.trackingUrls.click);
    
    if (currentAdData.creative.clickThroughUrl) {
      window.open(currentAdData.creative.clickThroughUrl, '_blank');
    }
  };

  return (
    <div className="tiptube-player-container relative" style={{ width, height }}>
      {/* Main Video Player */}
      {!isAdPlaying && preRollComplete && (
        <ReactPlayer
          ref={playerRef}
          src={videoUrl}
          width="100%"
          height="100%"
          playing={autoplay}
          controls
          onReady={handleVideoReady}
          onProgress={(state: any) => {
            handleVideoProgress(state);
            // Get duration from progress state on first call
            if (state.loadedSeconds > 0 && !currentVideoTime) {
              const player = playerRef.current;
              if (player) {
                const duration = player.getDuration ? player.getDuration() : state.duration;
                if (duration) {
                  handleVideoDuration(duration);
                }
              }
            }
          }}
          onEnded={handleVideoEnd}
          onPlay={onVideoPlay}
        />
      )}

      {/* Ad Player */}
      {isAdPlaying && currentAdData && (
        <div className="ad-player-wrapper relative w-full h-full">
          <ReactPlayer
            ref={adPlayerRef}
            src={currentAdData.creative.url}
            width="100%"
            height="100%"
            playing
            controls={false}
            volume={0.8}
            onReady={() => {
              console.log('🎬 [TiptubePlayer] Ad player ready');
              adStartTime.current = Date.now();
            }}
            onStart={() => {
              console.log('🎬 [TiptubePlayer] Ad playback started');
              adStartTime.current = Date.now();
              adPlayedSeconds.current = 0;
            }}
            onProgress={handleAdProgress as any}
            onEnded={() => handleAdEnd(false)}
            onError={(error: any) => {
              console.error('[TiptubePlayer] Ad playback error:', error);
              trackAdEvent(currentAdData.trackingUrls.error);
              handleAdEnd(false); // Skip to content on error
            }}
          />

          {/* Ad Overlay */}
          <AdOverlay
            ad={currentAdData}
            onSkip={() => handleAdEnd(true)}
            onClick={handleAdClick}
            currentPlayedSeconds={adCurrentTime}
          />
        </div>
      )}

      {/* Companion Banner (shown below player) */}
      {currentAdData?.companionBanner && isAdPlaying && (
        <CompanionBanner
          imageUrl={currentAdData.companionBanner.imageUrl}
          clickThroughUrl={currentAdData.companionBanner.clickThroughUrl}
          onBannerClick={handleAdClick}
        />
      )}

      {/* Loading State */}
      {!preRollComplete && !isAdPlaying && (
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading video...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TiptubePlayer;
