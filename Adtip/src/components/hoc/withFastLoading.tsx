import React, { Suspense, useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import ScreenTransition from '../common/ScreenTransition';

interface FastLoadingOptions {
  skipAnimation?: boolean;
  preload?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

const LoadingSpinner = () => {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
};

export function withFastLoading<P extends object>(
  Component: React.ComponentType<P>,
  options: FastLoadingOptions = {}
) {
  const { skipAnimation = false, priority = 'medium' } = options;

  const FastLoadedComponent: React.FC<P> = (props) => {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
      // Simulate component preparation time based on priority
      const loadTime = priority === 'high' ? 0 : priority === 'medium' ? 50 : 100;
      
      const timer = setTimeout(() => {
        setIsReady(true);
      }, loadTime);

      return () => clearTimeout(timer);
    }, []);

    if (!isReady && priority !== 'high') {
      return <LoadingSpinner />;
    }

    return (
      <ScreenTransition 
        animationType={skipAnimation ? 'none' : 'scale'}
        skipAnimation={skipAnimation}
      >
        <Suspense fallback={<LoadingSpinner />}>
          <Component {...props} />
        </Suspense>
      </ScreenTransition>
    );
  };

  FastLoadedComponent.displayName = `withFastLoading(${Component.displayName || Component.name})`;
  
  return FastLoadedComponent;
}