/**
 * TiptubePlayer - Video Player with Integrated Advertising
 * 
 * YouTube-style video player that supports:
 * - Pre-roll ads (skippable/non-skippable)
 * - Mid-roll ads at specified cue points
 * - Companion banner ads
 * - Full ad analytics tracking
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactPlayer from 'react-player';
import AdOverlay from './AdOverlay';
import CompanionBanner from './CompanionBanner';
import { trackAdEvent } from '../utils/adTracking';
import axios from 'axios';

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

interface AdData {
  adId: number;
  campaignId: number;
  placementId: number;
  sessionId: string;
  creative: {
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
  
  // Refs
  const playerRef = useRef<ReactPlayer>(null);
  const adPlayerRef = useRef<ReactPlayer>(null);
  const lastQuartileTracked = useRef<string | null>(null);

  // Base API URL
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const DISABLE_ADS = import.meta.env.VITE_DISABLE_ADS === 'true' || false;

  /**
   * Fetch mid-roll cue points on component mount
   */
  useEffect(() => {
    const fetchCuePoints = async () => {
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
      }
    };

    fetchCuePoints();
  }, [videoId, API_BASE_URL]);

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
        console.log('[TiptubePlayer] Ad received:', response.data.data.adId);
        return response.data.data;
      } else {
        console.log('[TiptubePlayer] No ad available');
        return null;
      }
    } catch (error) {
      console.error('[TiptubePlayer] Error requesting ad:', error);
      return null;
    }
  };

  /**
   * Play pre-roll ad before main content
   */
  useEffect(() => {
    const playPreRoll = async () => {
      if (preRollComplete || isAdPlaying) return;

      // Skip ads entirely if disabled
      if (DISABLE_ADS) {
        console.log('[TiptubePlayer] Ads disabled, starting main content immediately');
        setPreRollComplete(true);
        return;
      }

      try {
        // Set a timeout to prevent indefinite waiting
        const timeoutPromise = new Promise<null>((resolve) => {
          setTimeout(() => {
            console.log('[TiptubePlayer] Ad request timeout, starting main content');
            resolve(null);
          }, 3000); // 3 second timeout for better UX
        });

        const adData = await Promise.race([requestAd('pre-roll'), timeoutPromise]);
        
        if (adData) {
          setCurrentAdData(adData);
          setIsAdPlaying(true);
          
          // Track impression
          await trackAdEvent(adData.trackingUrls.impression);
        } else {
          // No pre-roll available or timeout, start main content immediately
          console.log('[TiptubePlayer] No pre-roll ad or timeout, starting main content');
          setPreRollComplete(true);
        }
      } catch (error) {
        // If ad request fails, fallback to main content
        console.error('[TiptubePlayer] Pre-roll ad request failed, starting main content:', error);
        setPreRollComplete(true);
      }
    };

    // Only play pre-roll on initial load
    if (!preRollComplete) {
      playPreRoll();
    }
  }, [preRollComplete, isAdPlaying, DISABLE_ADS]);

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
    if (!currentAdData) return;

    if (skipped) {
      await trackAdEvent(currentAdData.trackingUrls.skip);
    } else {
      await trackAdEvent(currentAdData.trackingUrls.complete);
    }

    // Reset ad state
    setIsAdPlaying(false);
    setCurrentAdData(null);
    lastQuartileTracked.current = null;

    // Mark pre-roll as complete if this was a pre-roll
    if (!preRollComplete) {
      setPreRollComplete(true);
    }

    console.log('[TiptubePlayer] Ad playback ended, resuming content');
  }, [currentAdData, preRollComplete]);

  /**
   * Handle ad progress for quartile tracking
   */
  const handleAdProgress = useCallback(async (state: { played: number; playedSeconds: number }) => {
    if (!currentAdData) return;

    const progress = state.played * 100; // Percentage

    // Track start
    if (progress > 0 && lastQuartileTracked.current === null) {
      await trackAdEvent(currentAdData.trackingUrls.start);
      lastQuartileTracked.current = 'start';
    }

    // Track quartiles
    if (progress >= 25 && lastQuartileTracked.current === 'start') {
      await trackAdEvent(currentAdData.trackingUrls.firstQuartile);
      lastQuartileTracked.current = 'firstQuartile';
    } else if (progress >= 50 && lastQuartileTracked.current === 'firstQuartile') {
      await trackAdEvent(currentAdData.trackingUrls.midpoint);
      lastQuartileTracked.current = 'midpoint';
    } else if (progress >= 75 && lastQuartileTracked.current === 'midpoint') {
      await trackAdEvent(currentAdData.trackingUrls.thirdQuartile);
      lastQuartileTracked.current = 'thirdQuartile';
    }
  }, [currentAdData]);

  /**
   * Handle main video ready
   */
  const handleVideoReady = () => {
    setMainVideoReady(true);
    console.log('[TiptubePlayer] Main video ready');
  };

  /**
   * Handle main video duration
   */
  const handleVideoDuration = (duration: number) => {
    setVideoDuration(duration);
    console.log('[TiptubePlayer] Video duration:', duration);
  };

  /**
   * Handle main video progress
   */
  const handleVideoProgress = (state: { played: number; playedSeconds: number }) => {
    setCurrentVideoTime(state.playedSeconds);
  };

  /**
   * Handle main video end
   */
  const handleVideoEnd = () => {
    console.log('[TiptubePlayer] Main video ended');
    onVideoEnd?.();
  };

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
          url={videoUrl}
          width="100%"
          height="100%"
          playing={autoplay || preRollComplete}
          controls
          onReady={handleVideoReady}
          onDuration={handleVideoDuration}
          onProgress={handleVideoProgress}
          onEnded={handleVideoEnd}
          onPlay={onVideoPlay}
          config={{
            file: {
              attributes: {
                controlsList: 'nodownload',
                disablePictureInPicture: false,
              }
            }
          }}
        />
      )}

      {/* Ad Player */}
      {isAdPlaying && currentAdData && (
        <div className="ad-player-wrapper relative w-full h-full">
          <ReactPlayer
            ref={adPlayerRef}
            url={currentAdData.creative.url}
            width="100%"
            height="100%"
            playing
            controls={false}
            volume={0.8}
            onProgress={handleAdProgress}
            onEnded={() => handleAdEnd(false)}
            onError={(error) => {
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
