import React, { createContext, useContext, useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue, runOnJS } from 'react-native-reanimated';
import { useTipShortsControls } from './TipShortsControls';
import { TipShortsLogger } from '../../../utils/logger';

interface TipShortsGestureContextType {
  combinedGesture: any;
  scrollY: any;
}

const TipShortsGestureContext = createContext<TipShortsGestureContextType | null>(null);

export const useTipShortsGesture = () => {
  const context = useContext(TipShortsGestureContext);
  if (!context) {
    throw new Error('useTipShortsGesture must be used within TipShortsGestureProvider');
  }
  return context;
};

interface TipShortsGestureProviderProps {
  children: React.ReactNode;
}

export const TipShortsGestureProvider: React.FC<TipShortsGestureProviderProps> = ({
  children,
}) => {
  const { toggleGlobalPlayPause, toggleGlobalMute } = useTipShortsControls();
  
  // Shared values for animations
  const scrollY = useSharedValue(0);

  // Create optimized gesture handlers
  const combinedGesture = useMemo(() => {
    // Single tap gesture for play/pause
    const singleTap = Gesture.Tap()
      .numberOfTaps(1)
      .maxDuration(250)
      .onEnd(() => {
        runOnJS(toggleGlobalPlayPause)();
      });

    // Double tap gesture for mute/unmute
    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .maxDuration(300)
      .onEnd(() => {
        runOnJS(toggleGlobalMute)();
      });

    // Long press gesture for additional actions (future use)
    const longPress = Gesture.LongPress()
      .minDuration(500)
      .onEnd(() => {
        // Future: Could be used for additional actions like sharing, etc.
        runOnJS(() => {
          TipShortsLogger.debug('Long press detected - future feature');
        })();
      });

    // Pan gesture for potential swipe actions (future use)
    const panGesture = Gesture.Pan()
      .minDistance(50)
      .onEnd((event) => {
        const { translationX, translationY, velocityX, velocityY } = event;
        
        // Future: Could implement swipe gestures for navigation or actions
        runOnJS(() => {
          TipShortsLogger.debug('Pan gesture detected:', {
            translationX,
            translationY,
            velocityX,
            velocityY
          });
        })();
      });

    // Combine gestures with proper exclusion
    return Gesture.Exclusive(
      doubleTap,
      Gesture.Simultaneous(
        singleTap,
        longPress,
        panGesture
      )
    );
  }, [toggleGlobalPlayPause, toggleGlobalMute]);

  const contextValue: TipShortsGestureContextType = {
    combinedGesture,
    scrollY,
  };

  return (
    <TipShortsGestureContext.Provider value={contextValue}>
      {children}
    </TipShortsGestureContext.Provider>
  );
};
