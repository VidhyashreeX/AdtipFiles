/**
 * Ad Tracking Utility
 * 
 * Handles sending tracking events to the backend
 * Uses Image pixel method for reliability (works even if fetch fails)
 */

/**
 * Track an ad event by hitting the tracking URL
 * Uses both fetch (for reliability) and img pixel (for fallback)
 * 
 * @param trackingUrl - The full tracking URL with query parameters
 */
export const trackAdEvent = async (trackingUrl: string): Promise<void> => {
  if (!trackingUrl) {
    console.warn('[AdTracking] No tracking URL provided');
    return;
  }

  try {
    console.log('[AdTracking] Tracking event:', trackingUrl);

    // Method 1: Use fetch (primary method)
    try {
      await fetch(trackingUrl, {
        method: 'GET',
        mode: 'no-cors', // Don't need response, just fire and forget
        credentials: 'omit',
        cache: 'no-cache',
      });
    } catch (fetchError) {
      console.warn('[AdTracking] Fetch failed, using pixel fallback:', fetchError);
      
      // Method 2: Image pixel fallback (more reliable across browsers)
      const img = new Image(1, 1);
      img.src = trackingUrl;
      img.onerror = () => {
        console.error('[AdTracking] Pixel tracking also failed');
      };
    }

  } catch (error) {
    console.error('[AdTracking] Error tracking event:', error);
  }
};

/**
 * Track multiple ad events in bulk
 * Useful for batching tracking calls
 * 
 * @param trackingUrls - Array of tracking URLs
 */
export const trackAdEventsBulk = async (trackingUrls: string[]): Promise<void> => {
  if (!trackingUrls || trackingUrls.length === 0) {
    return;
  }

  const promises = trackingUrls.map(url => trackAdEvent(url));
  
  try {
    await Promise.all(promises);
  } catch (error) {
    console.error('[AdTracking] Error in bulk tracking:', error);
  }
};

/**
 * Track ad event with additional parameters
 * Builds the tracking URL with custom parameters
 * 
 * @param baseUrl - Base tracking endpoint
 * @param params - Additional query parameters
 */
export const trackAdEventWithParams = async (
  baseUrl: string,
  params: Record<string, string | number | boolean>
): Promise<void> => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    searchParams.append(key, String(value));
  });

  const trackingUrl = `${baseUrl}?${searchParams.toString()}`;
  
  await trackAdEvent(trackingUrl);
};

/**
 * Create a tracking beacon (using navigator.sendBeacon if available)
 * More reliable for tracking when page is unloading
 * 
 * @param trackingUrl - The tracking URL
 */
export const sendTrackingBeacon = (trackingUrl: string): boolean => {
  if (!trackingUrl) {
    return false;
  }

  try {
    if (navigator.sendBeacon) {
      // sendBeacon is more reliable for tracking during page unload
      return navigator.sendBeacon(trackingUrl);
    } else {
      // Fallback to regular tracking
      trackAdEvent(trackingUrl);
      return true;
    }
  } catch (error) {
    console.error('[AdTracking] Error sending beacon:', error);
    return false;
  }
};

/**
 * Track ad impression with visibility check
 * Only tracks if the ad is actually visible in viewport
 * 
 * @param trackingUrl - Impression tracking URL
 * @param element - The ad element to check visibility
 * @param threshold - Percentage of element that must be visible (0-1)
 */
export const trackAdImpressionWhenVisible = (
  trackingUrl: string,
  element: HTMLElement,
  threshold: number = 0.5
): void => {
  if (!trackingUrl || !element) {
    return;
  }

  // Use Intersection Observer to track when ad is actually visible
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
          // Ad is visible, track impression
          trackAdEvent(trackingUrl);
          
          // Disconnect observer after first impression
          observer.disconnect();
        }
      });
    },
    {
      threshold: threshold,
    }
  );

  observer.observe(element);
};

/**
 * Debounced tracking for events that fire frequently
 * Useful for progress events
 * 
 * @param trackingUrl - The tracking URL
 * @param delay - Debounce delay in milliseconds
 */
export const trackAdEventDebounced = (() => {
  let timeoutId: NodeJS.Timeout | null = null;

  return (trackingUrl: string, delay: number = 300): void => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      trackAdEvent(trackingUrl);
      timeoutId = null;
    }, delay);
  };
})();

/**
 * Track ad error with error details
 * 
 * @param trackingUrl - Base error tracking URL
 * @param errorCode - Error code
 * @param errorMessage - Error message
 */
export const trackAdError = async (
  trackingUrl: string,
  errorCode: string,
  errorMessage: string
): Promise<void> => {
  if (!trackingUrl) {
    return;
  }

  const url = new URL(trackingUrl);
  url.searchParams.set('errorCode', errorCode);
  url.searchParams.set('errorMessage', errorMessage);

  await trackAdEvent(url.toString());
};

/**
 * Get user's platform/device type
 * Useful for tracking context
 */
export const getPlatform = (): 'mobile' | 'tablet' | 'desktop' => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
    return 'mobile';
  } else if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    return 'tablet';
  } else {
    return 'desktop';
  }
};

/**
 * Export all tracking utilities
 */
export default {
  trackAdEvent,
  trackAdEventsBulk,
  trackAdEventWithParams,
  sendTrackingBeacon,
  trackAdImpressionWhenVisible,
  trackAdEventDebounced,
  trackAdError,
  getPlatform,
};
