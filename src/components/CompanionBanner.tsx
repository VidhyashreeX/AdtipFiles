/**
 * CompanionBanner Component
 * 
 * Displays a static banner ad alongside video content
 * Typically shown during ad playback in a dedicated slot below the player
 */

import React from 'react';
import { ExternalLink } from 'lucide-react';

interface CompanionBannerProps {
  imageUrl: string;
  clickThroughUrl: string;
  onBannerClick: () => void;
}

const CompanionBanner: React.FC<CompanionBannerProps> = ({
  imageUrl,
  clickThroughUrl,
  onBannerClick,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onBannerClick();
    
    if (clickThroughUrl) {
      window.open(clickThroughUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="companion-banner-container mt-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shadow-md">
      <a
        href={clickThroughUrl}
        onClick={handleClick}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative group cursor-pointer"
      >
        {/* Ad Badge */}
        <div className="absolute top-2 left-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded z-10">
          Advertisement
        </div>

        {/* Banner Image */}
        <img
          src={imageUrl}
          alt="Advertisement"
          className="w-full h-auto object-contain transition-transform group-hover:scale-105"
          style={{ maxHeight: '120px' }}
          onError={(e) => {
            // Fallback if image fails to load
            e.currentTarget.style.display = 'none';
            const fallback = e.currentTarget.nextElementSibling;
            if (fallback) {
              (fallback as HTMLElement).style.display = 'flex';
            }
          }}
        />

        {/* Fallback for broken images */}
        <div
          className="hidden w-full h-28 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-600 items-center justify-center"
          style={{ display: 'none' }}
        >
          <div className="text-center text-gray-600 dark:text-gray-300">
            <ExternalLink size={32} className="mx-auto mb-2" />
            <p className="text-sm font-medium">Advertisement</p>
          </div>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-gray-900/90 text-black dark:text-white px-4 py-2 rounded-md shadow-lg">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ExternalLink size={16} />
              <span>Visit Website</span>
            </div>
          </div>
        </div>
      </a>

      {/* Optional: Ad disclosure footer */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Sponsored content · 
          <a 
            href="/ad-policy" 
            className="ml-1 underline hover:text-adtip-teal"
            onClick={(e) => e.stopPropagation()}
          >
            Why this ad?
          </a>
        </p>
      </div>
    </div>
  );
};

export default CompanionBanner;
