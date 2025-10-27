/**
 * AdOverlay Component
 * 
 * Displays an overlay on top of video ads with:
 * - Ad countdown timer
 * - Skip button (after skip offset)
 * - Ad badge/indicator
 * - Click-through functionality
 */

import React, { useState, useEffect } from 'react';
import { Info, X } from 'lucide-react';

interface AdData {
  adId: number;
  campaignId: number;
  creative: {
    duration: number;
    clickThroughUrl?: string;
  };
  isSkippable: boolean;
  skipOffset: number;
}

interface AdOverlayProps {
  ad: AdData;
  onSkip: () => void;
  onClick: () => void;
  currentPlayedSeconds: number; // Track actual video playback time
}

const AdOverlay: React.FC<AdOverlayProps> = ({ ad, onSkip, onClick, currentPlayedSeconds }) => {
  const [canSkip, setCanSkip] = useState(false);

  // Update skip availability based on actual played seconds from video player
  useEffect(() => {
    console.log('🟡 [AdOverlay] Timer update:', {
      currentPlayedSeconds,
      skipOffset: ad.skipOffset,
      canSkip: currentPlayedSeconds >= ad.skipOffset,
      isSkippable: ad.isSkippable
    });
    
    if (ad.isSkippable && currentPlayedSeconds >= ad.skipOffset) {
      setCanSkip(true);
    }
  }, [currentPlayedSeconds, ad.isSkippable, ad.skipOffset]);

  const remainingSeconds = Math.max(0, Math.ceil(ad.creative.duration - currentPlayedSeconds));
  const skipCountdown = Math.max(0, Math.ceil(ad.skipOffset - currentPlayedSeconds));
  
  console.log('🟡 [AdOverlay] Render:', { currentPlayedSeconds, remainingSeconds, skipCountdown, canSkip });

  return (
    <div 
      className="absolute inset-0 pointer-events-none z-10"
      style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.4) 100%)' }}
    >
      {/* Top Bar - Ad Indicator */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between pointer-events-auto">
        {/* Ad Badge */}
        <div className="flex items-center gap-2">
          <div className="bg-yellow-400 text-black px-3 py-1 rounded-md text-sm font-bold flex items-center gap-1">
            <Info size={14} />
            <span>Ad</span>
          </div>
          
          {/* Remaining Time */}
          {remainingSeconds > 0 && (
            <div className="bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-md text-sm">
              Video will play in {remainingSeconds}s
            </div>
          )}
        </div>

        {/* Ad Info Button (optional) */}
        <button
          className="bg-black/50 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/70 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            // Could open ad details modal
          }}
        >
          <Info size={16} />
        </button>
      </div>

      {/* Center - Click-through Area */}
      {ad.creative.clickThroughUrl && (
        <div
          className="absolute inset-0 cursor-pointer pointer-events-auto"
          onClick={onClick}
          role="button"
          aria-label="Click to learn more about this ad"
        >
          {/* Invisible click area */}
        </div>
      )}

      {/* Bottom Bar - Skip Button */}
      <div className="absolute bottom-0 right-0 p-4 pointer-events-auto">
        {ad.isSkippable && (
          <>
            {!canSkip ? (
              // Skip countdown
              <div className="bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-md text-sm">
                You can skip in {skipCountdown}s
              </div>
            ) : (
              // Skip button
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('🟡 [AdOverlay] ========== SKIP BUTTON CLICKED ==========');
                  console.log('🟡 [AdOverlay] Calling onSkip callback...');
                  onSkip();
                  console.log('🟡 [AdOverlay] onSkip callback completed');
                }}
                className="bg-white/90 hover:bg-white text-black font-semibold px-6 py-3 rounded-md shadow-lg transition-all hover:scale-105 flex items-center gap-2"
              >
                <span>Skip Ad</span>
                <X size={18} />
              </button>
            )}
          </>
        )}

        {/* Non-skippable indicator */}
        {!ad.isSkippable && (
          <div className="bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-md text-sm">
            Ad · {remainingSeconds}s
          </div>
        )}
      </div>

      {/* Learn More Button (if clickable) */}
      {ad.creative.clickThroughUrl && (
        <div className="absolute bottom-4 left-4 pointer-events-auto">
          <button
            onClick={onClick}
            className="bg-adtip-teal hover:bg-adtip-teal/90 text-white font-medium px-6 py-2 rounded-md shadow-lg transition-all hover:scale-105"
          >
            Learn More
          </button>
        </div>
      )}
    </div>
  );
};

export default AdOverlay;
