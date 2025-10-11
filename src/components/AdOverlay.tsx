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
}

const AdOverlay: React.FC<AdOverlayProps> = ({ ad, onSkip, onClick }) => {
  const [secondsPlayed, setSecondsPlayed] = useState(0);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    // Update seconds counter
    const interval = setInterval(() => {
      setSecondsPlayed(prev => {
        const newValue = prev + 1;
        
        // Enable skip button after skip offset
        if (ad.isSkippable && newValue >= ad.skipOffset) {
          setCanSkip(true);
        }
        
        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [ad.isSkippable, ad.skipOffset]);

  const remainingSeconds = ad.creative.duration - secondsPlayed;
  const skipCountdown = ad.skipOffset - secondsPlayed;

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
                  onSkip();
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
