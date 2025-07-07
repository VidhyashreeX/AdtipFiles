/**
 * Call Store Hook Utilities
 * 
 * Additional React hooks for working with the call store,
 * providing specialized functionality and performance optimizations.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useCallStore, CallData, CallStatus, MediaState } from './callStore';

// ===== PERFORMANCE HOOKS =====

/**
 * Hook for call status with optional status filtering
 * Only re-renders when the status matches the filter
 */
export const useCallStatus = (statusFilter?: CallStatus[]) => {
  return useCallStore(
    useCallback(
      (state) => {
        const status = state.callStatus;
        return statusFilter ? statusFilter.includes(status) : status;
      },
      [statusFilter]
    )
  );
};

/**
 * Hook for active call with shallow comparison
 * Only re-renders when relevant call properties change
 */
export const useActiveCall = (properties?: Array<keyof CallData>) => {
  return useCallStore(
    useCallback(
      (state) => {
        const call = state.activeCall;
        if (!call) return null;
        
        if (properties) {
          const filteredCall: Partial<CallData> = {};
          properties.forEach((prop) => {
            (filteredCall as any)[prop] = call[prop];
          });
          return filteredCall as CallData;
        }
        
        return call;
      },
      [properties]
    )
  );
};

/**
 * Hook for specific media state properties
 */
export const useMediaProperty = (property: keyof MediaState) => {
  return useCallStore(
    useCallback(
      (state) => state.mediaState[property],
      [property]
    )
  );
};

// ===== LIFECYCLE HOOKS =====

/**
 * Hook that runs a callback when call status changes
 */
export const useCallStatusChange = (callback: (status: CallStatus, previousStatus: CallStatus) => void) => {
  const previousStatusRef = useRef<CallStatus>('idle');
  
  useEffect(() => {
    const unsubscribe = useCallStore.subscribe((state) => {
      const currentStatus = state.callStatus;
      const previousStatus = previousStatusRef.current;
      
      if (currentStatus !== previousStatus) {
        callback(currentStatus, previousStatus);
        previousStatusRef.current = currentStatus;
      }
    });
    
    return unsubscribe;
  }, [callback]);
};

/**
 * Hook that runs a callback when a call starts
 */
export const useCallStart = (callback: (call: CallData) => void) => {
  const previousCallRef = useRef<CallData | null>(null);
  
  useEffect(() => {
    const unsubscribe = useCallStore.subscribe((state) => {
      const currentCall = state.activeCall;
      const previousCall = previousCallRef.current;
      
      // Call started if we didn't have a call before but now we do
      if (!previousCall && currentCall) {
        callback(currentCall);
      }
      
      previousCallRef.current = currentCall;
    });
    
    return unsubscribe;
  }, [callback]);
};

/**
 * Hook that runs a callback when a call ends
 */
export const useCallEnd = (callback: (lastCall: CallData | null, reason?: string) => void) => {
  const previousCallRef = useRef<CallData | null>(null);
  
  useEffect(() => {
    const unsubscribe = useCallStore.subscribe((state) => {
      const currentCall = state.activeCall;
      const previousCall = previousCallRef.current;
      
      // Call ended if we had a call before but now we don't
      if (previousCall && !currentCall) {
        callback(previousCall, state.lastCallEndReason);
      }
      
      previousCallRef.current = currentCall;
    });
    
    return unsubscribe;
  }, [callback]);
};

/**
 * Hook that runs a callback when media state changes
 */
export const useMediaStateChange = (callback: (mediaState: MediaState, previousMediaState: MediaState) => void) => {
  const previousMediaStateRef = useRef<MediaState>({
    micEnabled: true,
    cameraEnabled: false,
    speakerEnabled: true,
    isVideoCall: false,
  });
  
  useEffect(() => {
    const unsubscribe = useCallStore.subscribe((state) => {
      const currentMediaState = state.mediaState;
      const previousMediaState = previousMediaStateRef.current;
      
      // Check if any property changed
      const hasChanged = Object.keys(currentMediaState).some(
        (key) => currentMediaState[key as keyof MediaState] !== previousMediaState[key as keyof MediaState]
      );
      
      if (hasChanged) {
        callback(currentMediaState, previousMediaState);
        previousMediaStateRef.current = { ...currentMediaState };
      }
    });
    
    return unsubscribe;
  }, [callback]);
};

// ===== UTILITY HOOKS =====

/**
 * Hook that provides call duration timer
 */
export const useCallDuration = () => {
  const isInCall = useCallStore((state) => state.isInCall);
  const activeCall = useCallStore((state) => state.activeCall);
  const setCallDuration = useCallStore((state) => state.setCallDuration);
  const callDuration = useCallStore((state) => state.callDuration);
  
  useEffect(() => {
    if (!isInCall || !activeCall?.startTime) {
      return;
    }
    
    const updateDuration = () => {
      const duration = Math.floor((Date.now() - (activeCall.startTime || 0)) / 1000);
      setCallDuration(duration);
    };
    
    // Update immediately
    updateDuration();
    
    // Update every second
    const interval = setInterval(updateDuration, 1000);
    
    return () => clearInterval(interval);
  }, [isInCall, activeCall?.startTime, setCallDuration]);
  
  return callDuration;
};

/**
 * Hook that provides formatted call duration
 */
export const useFormattedCallDuration = () => {
  const duration = useCallDuration();
  
  return useCallback(() => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [duration])();
};

/**
 * Hook that provides call state validation
 */
export const useCallValidation = () => {
  const callStatus = useCallStore((state) => state.callStatus);
  const activeCall = useCallStore((state) => state.activeCall);
  const isCallServiceInitialized = useCallStore((state) => state.isCallServiceInitialized);
  
  return {
    canStartCall: callStatus === 'idle' && isCallServiceInitialized,
    canEndCall: callStatus !== 'idle' && callStatus !== 'ended',
    canAcceptCall: callStatus === 'ringing' && activeCall && !activeCall.isInitiator,
    canDeclineCall: callStatus === 'ringing' && activeCall && !activeCall.isInitiator,
    canToggleMedia: callStatus === 'connected' || callStatus === 'connecting',
    hasActiveCall: !!activeCall,
    isInitialized: isCallServiceInitialized,
  };
};

/**
 * Hook that provides call error handling
 */
export const useCallError = () => {
  const lastError = useCallStore((state) => state.lastError);
  const setError = useCallStore((state) => state.setError);
  const clearError = useCallStore((state) => state.clearError);
  
  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (lastError) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [lastError, clearError]);
  
  return {
    error: lastError,
    hasError: !!lastError,
    setError,
    clearError,
  };
};

/**
 * Hook that provides call metrics with computed values
 */
export const useCallMetricsComputed = () => {
  const metrics = useCallStore((state) => state.callMetrics);
  
  return {
    ...metrics,
    averageCallDuration: metrics.totalCalls > 0 ? metrics.totalDuration / metrics.totalCalls : 0,
    recentCalls: metrics.callHistory.slice(0, 10),
    callsToday: metrics.callHistory.filter(
      (call) => new Date(call.startTime).toDateString() === new Date().toDateString()
    ).length,
    completedCalls: metrics.callHistory.filter((call) => call.status === 'completed').length,
    missedCalls: metrics.callHistory.filter((call) => call.status === 'missed').length,
  };
};

// ===== DEBUGGING HOOKS =====

/**
 * Hook that logs call state changes (development only)
 */
export const useCallStateLogger = (enabled: boolean = __DEV__) => {
  useEffect(() => {
    if (!enabled) return;
    
    const unsubscribe = useCallStore.subscribe((state) => {
      console.log('📱 Call State Changed:', {
        timestamp: new Date().toISOString(),
        callStatus: state.callStatus,
        activeCall: state.activeCall?.callId,
        isInCall: state.isInCall,
        mediaState: state.mediaState,
      });
    });
    
    return unsubscribe;
  }, [enabled]);
};

export default {
  useCallStatus,
  useActiveCall,
  useMediaProperty,
  useCallStatusChange,
  useCallStart,
  useCallEnd,
  useMediaStateChange,
  useCallDuration,
  useFormattedCallDuration,
  useCallValidation,
  useCallError,
  useCallMetricsComputed,
  useCallStateLogger,
};
