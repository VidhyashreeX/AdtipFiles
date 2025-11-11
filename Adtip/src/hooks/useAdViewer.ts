/**
 * useAdViewer Hook
 * 
 * Custom hook for managing ad viewing sessions in React Native.
 * Handles session lifecycle, watch time tracking, playback control, and completion logic.
 * 
 * Features:
 * - Session state management (start, pause, resume, complete)
 * - Automatic watch time tracking with intervals
 * - Skip handling based on ad type
 * - Error state management
 * - Cleanup on unmount
 * 
 * @example
 * ```tsx
 * const {
 *   session,
 *   isPlaying,
 *   watchTime,
 *   error,
 *   canSkip,
 *   startAd,
 *   pauseAd,
 *   resumeAd,
 *   skipAd,
 *   completeAd,
 *   trackWebsiteVisit,
 *   submitQuizAnswer,
 *   reset
 * } = useAdViewer();
 * 
 * // Start watching an ad
 * await startAd(userId, adId);
 * 
 * // Pause playback
 * pauseAd();
 * 
 * // Resume playback
 * resumeAd();
 * 
 * // Skip ad (if allowed)
 * if (canSkip) {
 *   await skipAd();
 * }
 * 
 * // Complete ad
 * await completeAd();
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AdViewerService from '../services/AdViewerService';
import { 
  AdSession, 
  AdViewData, 
  getAdModelType,
  AdModelType 
} from '../types/ads';

interface UseAdViewerReturn {
  // Session state
  session: AdSession | null;
  adData: AdViewData | null;
  isPlaying: boolean;
  watchTime: number;
  error: string | null;
  isLoading: boolean;
  
  // Computed properties
  canSkip: boolean;
  skipTimeReached: boolean;
  completionPercentage: number;
  isComplete: boolean;
  
  // Actions
  startAd: (userId: number, adId: number) => Promise<void>;
  pauseAd: () => void;
  resumeAd: () => void;
  skipAd: () => Promise<void>;
  completeAd: () => Promise<any>;
  trackWebsiteVisit: (action: 'visit_start' | 'visit_end', duration?: number) => Promise<void>;
  submitQuizAnswer: (answer: string) => Promise<any>;
  reset: () => void;
}

export const useAdViewer = (): UseAdViewerReturn => {
  // State
  const [session, setSession] = useState<AdSession | null>(null);
  const [adData, setAdData] = useState<AdViewData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [watchTime, setWatchTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs for interval management
  const watchTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  
  /**
   * Start watch time interval
   * Updates every second and syncs with backend every 5 seconds
   */
  const startWatchTimeInterval = useCallback(() => {
    if (watchTimeIntervalRef.current) {
      clearInterval(watchTimeIntervalRef.current);
    }
    
    lastUpdateTimeRef.current = Date.now();
    
    watchTimeIntervalRef.current = setInterval(() => {
      setWatchTime(prev => {
        const newWatchTime = prev + 1;
        
        // Sync with backend every 5 seconds
        if (newWatchTime % 5 === 0 && session) {
          AdViewerService.updateWatchTime(session.sessionId, newWatchTime)
            .catch(err => {
              console.error('Failed to sync watch time:', err);
            });
        }
        
        return newWatchTime;
      });
    }, 1000);
  }, [session]);
  
  /**
   * Stop watch time interval
   */
  const stopWatchTimeInterval = useCallback(() => {
    if (watchTimeIntervalRef.current) {
      clearInterval(watchTimeIntervalRef.current);
      watchTimeIntervalRef.current = null;
    }
  }, []);
  
  /**
   * Start ad viewing session
   */
  const startAd = useCallback(async (userId: number, adId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await AdViewerService.startAdSession(userId, adId);
      
      // Extract session and ad data from response
      if (response.data) {
        const sessionData: AdSession = {
          sessionId: response.data.sessionId,
          adId: response.data.adId,
          userId: response.data.userId,
          adModelType: response.data.adModelType as AdModelType,
          status: 'ACTIVE',
          currentWatchTime: response.data.currentWatchTime || 0,
          requiredWatchTime: response.data.requiredWatchTime,
          totalAdDuration: response.data.totalAdDuration,
          skipAllowed: response.data.skipAllowed,
          skipAvailableAfter: response.data.skipAvailableAfter || 0,
          canSkipNow: false,
          basePayout: response.data.basePayout,
          bonusPayout: 0,
          totalPayout: 0,
          websiteVisitRequired: response.data.websiteVisitRequired || false,
          websiteUrl: response.data.websiteUrl,
          websiteVisited: false,
          websiteVisitDuration: 0,
          questionRequired: response.data.questionRequired || false,
          question: response.data.question,
          questionOptions: response.data.questionOptions,
          questionAnswered: false,
          createdAt: new Date(),
        };
        setSession(sessionData);
      }
      
      setWatchTime(0);
      setIsPlaying(true);
      
      // Start tracking watch time
      startWatchTimeInterval();
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to start ad session';
      setError(errorMessage);
      console.error('Start ad error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [startWatchTimeInterval]);
  
  /**
   * Pause ad playback
   */
  const pauseAd = useCallback(() => {
    if (!isPlaying) return;
    
    setIsPlaying(false);
    stopWatchTimeInterval();
    
    // Sync current watch time with backend
    if (session && watchTime > 0) {
      AdViewerService.updateWatchTime(session.sessionId, watchTime)
        .catch(err => {
          console.error('Failed to sync watch time on pause:', err);
        });
    }
  }, [isPlaying, session, watchTime, stopWatchTimeInterval]);
  
  /**
   * Resume ad playback
   */
  const resumeAd = useCallback(() => {
    if (isPlaying || !session) return;
    
    setIsPlaying(true);
    startWatchTimeInterval();
  }, [isPlaying, session, startWatchTimeInterval]);
  
  /**
   * Skip ad (if allowed)
   */
  const skipAd = useCallback(async () => {
    if (!session || !adData) {
      setError('No active session');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Stop watch time tracking
      stopWatchTimeInterval();
      setIsPlaying(false);
      
      // Call skip API
      const response = await AdViewerService.skipAd(session.sessionId, watchTime);
      
      // Session is now complete (with skip)
      setSession(prev => prev ? { ...prev, status: 'SKIPPED' } : null);
      
      console.log('Ad skipped successfully:', response);
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to skip ad';
      setError(errorMessage);
      console.error('Skip ad error:', err);
      
      // Resume playback if skip failed
      setIsPlaying(true);
      startWatchTimeInterval();
    } finally {
      setIsLoading(false);
    }
  }, [session, adData, watchTime, stopWatchTimeInterval, startWatchTimeInterval]);
  
  /**
   * Complete ad viewing
   */
  const completeAd = useCallback(async () => {
    if (!session) {
      setError('No active session');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Stop watch time tracking
      stopWatchTimeInterval();
      setIsPlaying(false);
      
      // Final watch time sync
      await AdViewerService.updateWatchTime(session.sessionId, watchTime);
      
      // Complete the ad
      const response = await AdViewerService.completeAdView(session.sessionId);
      
      // Update session status
      setSession(prev => prev ? { ...prev, status: 'COMPLETED' } : null);
      
      console.log('Ad completed successfully:', response);
      
      return response;
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to complete ad';
      setError(errorMessage);
      console.error('Complete ad error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session, watchTime, stopWatchTimeInterval]);
  
  /**
   * Track website visit (for BRAND_AWARENESS ads)
   */
  const trackWebsiteVisit = useCallback(async (
    action: 'visit_start' | 'visit_end',
    duration?: number
  ) => {
    if (!session) {
      setError('No active session');
      return;
    }
    
    try {
      await AdViewerService.trackWebsiteVisit(
        session.sessionId,
        action,
        duration
      );
      
      console.log(`Website visit tracked: ${action}`, duration);
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to track website visit';
      setError(errorMessage);
      console.error('Track website visit error:', err);
    }
  }, [session]);
  
  /**
   * Submit quiz answer (for QUIZ ads)
   */
  const submitQuizAnswer = useCallback(async (answer: string) => {
    if (!session) {
      setError('No active session');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await AdViewerService.submitAnswer(
        session.sessionId,
        answer
      );
      
      console.log('Quiz answer submitted:', response);
      
      return response;
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to submit answer';
      setError(errorMessage);
      console.error('Submit quiz answer error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session]);
  
  /**
   * Reset hook state
   */
  const reset = useCallback(() => {
    stopWatchTimeInterval();
    setSession(null);
    setAdData(null);
    setIsPlaying(false);
    setWatchTime(0);
    setError(null);
    setIsLoading(false);
  }, [stopWatchTimeInterval]);
  
  // Computed properties
  const adModelType = adData ? getAdModelType(adData.ad_model_id) : null;
  
  const canSkip = adModelType === 'SKIP' || 
                  adModelType === 'BRAND_AWARENESS';
  
  const skipTimeReached = canSkip && 
                          session?.skipAvailableAfter !== undefined && 
                          watchTime >= session.skipAvailableAfter;
  
  const completionPercentage = session?.requiredWatchTime 
    ? Math.min((watchTime / session.requiredWatchTime) * 100, 100)
    : 0;
  
  const isComplete = session?.status === 'COMPLETED';
  
  // Handle app state changes (pause when app goes to background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/active/) &&
        nextAppState.match(/inactive|background/)
      ) {
        // App went to background - pause playback
        if (isPlaying) {
          pauseAd();
        }
      }
      
      appStateRef.current = nextAppState;
    });
    
    return () => {
      subscription.remove();
    };
  }, [isPlaying, pauseAd]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWatchTimeInterval();
      
      // Final sync if session is active
      if (session && watchTime > 0 && session.status === 'ACTIVE') {
        AdViewerService.updateWatchTime(session.sessionId, watchTime)
          .catch(err => {
            console.error('Failed to sync watch time on unmount:', err);
          });
      }
    };
  }, [session, watchTime, stopWatchTimeInterval]);
  
  return {
    // State
    session,
    adData,
    isPlaying,
    watchTime,
    error,
    isLoading,
    
    // Computed
    canSkip,
    skipTimeReached,
    completionPercentage,
    isComplete,
    
    // Actions
    startAd,
    pauseAd,
    resumeAd,
    skipAd,
    completeAd,
    trackWebsiteVisit,
    submitQuizAnswer,
    reset,
  };
};

export default useAdViewer;
