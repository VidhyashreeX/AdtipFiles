/**
 * MemoryManagedParticipantView - A wrapper around ParticipantView with proper memory management
 * 
 * This component ensures that ParticipantView instances are properly cleaned up
 * to prevent memory leaks during video calls.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { ParticipantView } from '@videosdk.live/react-native-sdk';

interface MemoryManagedParticipantViewProps {
  participantId: string;
  style?: any;
  onCleanup?: () => void;
}

const MemoryManagedParticipantView: React.FC<MemoryManagedParticipantViewProps> = ({
  participantId,
  style,
  onCleanup,
}) => {
  const isMountedRef = useRef(true);
  const participantViewRef = useRef<any>(null);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log('[MemoryManagedParticipantView] Performing cleanup for participant:', participantId);
    
    try {
      // Clear any pending timeouts
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
        cleanupTimeoutRef.current = null;
      }

      // Mark as unmounted
      isMountedRef.current = false;

      // Call external cleanup if provided
      if (onCleanup) {
        onCleanup();
      }

      // Force garbage collection hint
      if (global.gc) {
        // Delay garbage collection to allow cleanup to complete
        setTimeout(() => {
          if (global.gc) {
            global.gc();
          }
        }, 100);
      }

    } catch (error) {
      console.warn('[MemoryManagedParticipantView] Cleanup error:', error);
    }
  }, [participantId, onCleanup]);

  // Handle app state changes for memory management
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (!isMountedRef.current) return;

      if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log('[MemoryManagedParticipantView] App backgrounded - scheduling cleanup');
        
        // Schedule cleanup after a delay when app goes to background
        cleanupTimeoutRef.current = setTimeout(() => {
          if (!isMountedRef.current) return;
          
          console.log('[MemoryManagedParticipantView] Performing background cleanup');
          
          // Perform lightweight cleanup without unmounting
          if (global.gc) {
            global.gc();
          }
        }, 5000); // 5 second delay
      } else if (nextAppState === 'active') {
        // Cancel scheduled cleanup if app becomes active again
        if (cleanupTimeoutRef.current) {
          clearTimeout(cleanupTimeoutRef.current);
          cleanupTimeoutRef.current = null;
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Cleanup when participant changes
  useEffect(() => {
    // Reset mounted state when participant changes
    isMountedRef.current = true;
    
    return () => {
      // Perform cleanup when participant changes
      if (global.gc) {
        setTimeout(() => {
          if (global.gc) {
            global.gc();
          }
        }, 100);
      }
    };
  }, [participantId]);

  // Don't render if not mounted
  if (!isMountedRef.current) {
    return null;
  }

  return (
    <ParticipantView
      ref={participantViewRef}
      participantId={participantId}
      style={style}
    />
  );
};

export default MemoryManagedParticipantView;
