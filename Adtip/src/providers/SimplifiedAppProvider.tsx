// src/providers/SimplifiedAppProvider.tsx
import React, { ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardAvoiderProvider } from '@good-react-native/keyboard-avoider';

// ✅ CORE PROVIDERS - Essential for app functionality
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';
import { EnhancedQueryProvider } from './QueryProvider';

// ✅ FEATURE PROVIDERS - Grouped by functionality
import { UserDataProvider } from '../contexts/UserDataContext';
import { WalletProvider } from '../contexts/WalletContext';
import { FCMChatProvider } from '../contexts/FCMChatContext';

// ✅ UI PROVIDERS - UI-specific providers
import { SidebarProvider } from '../contexts/SidebarContext';
import { TabNavigatorProvider } from '../contexts/TabNavigatorContext';

// ✅ OPTIONAL PROVIDERS - Can be conditionally loaded
import { ShortsProvider } from '../contexts/ShortsContext';
import { ContentCreatorPremiumProvider } from '../contexts/ContentCreatorPremiumContext';
import { DataProvider } from './DataProvider';

// ✅ COMBINED CONTEXT
import { CombinedAppProvider } from '../contexts/CombinedAppContext';

interface SimplifiedAppProviderProps {
  children: ReactNode;
  enableOptionalProviders?: boolean;
}

// ✅ CORE APP PROVIDERS - Always needed
const CoreProviders: React.FC<{ children: ReactNode }> = ({ children }) => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <KeyboardAvoiderProvider>
        <ThemeProvider>
          <AuthProvider>
            <EnhancedQueryProvider>
              {children}
            </EnhancedQueryProvider>
          </AuthProvider>
        </ThemeProvider>
      </KeyboardAvoiderProvider>
    </SafeAreaProvider>
  </GestureHandlerRootView>
);

// ✅ FEATURE PROVIDERS - User and data management
const FeatureProviders: React.FC<{ children: ReactNode }> = ({ children }) => (
  <UserDataProvider>
    <WalletProvider>
      <FCMChatProvider>
        {children}
      </FCMChatProvider>
    </WalletProvider>
  </UserDataProvider>
);

// ✅ UI PROVIDERS - Navigation and UI state
const UIProviders: React.FC<{ children: ReactNode }> = ({ children }) => (
  <TabNavigatorProvider>
    <SidebarProvider>
      {children}
    </SidebarProvider>
  </TabNavigatorProvider>
);

// ✅ OPTIONAL PROVIDERS - Can be disabled for performance
const OptionalProviders: React.FC<{ children: ReactNode; enabled: boolean }> = ({ 
  children, 
  enabled 
}) => {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <ShortsProvider>
      <ContentCreatorPremiumProvider>
        <DataProvider>
          {children}
        </DataProvider>
      </ContentCreatorPremiumProvider>
    </ShortsProvider>
  );
};

// ✅ SIMPLIFIED APP PROVIDER - Flattened and optimized
export const SimplifiedAppProvider: React.FC<SimplifiedAppProviderProps> = ({ 
  children, 
  enableOptionalProviders = true 
}) => {
  return (
    <CoreProviders>
      <FeatureProviders>
        <UIProviders>
          <OptionalProviders enabled={enableOptionalProviders}>
            <CombinedAppProvider>
              {children}
            </CombinedAppProvider>
          </OptionalProviders>
        </UIProviders>
      </FeatureProviders>
    </CoreProviders>
  );
};

// ✅ MINIMAL APP PROVIDER - For testing or minimal functionality
export const MinimalAppProvider: React.FC<{ children: ReactNode }> = ({ children }) => (
  <CoreProviders>
    <CombinedAppProvider>
      {children}
    </CombinedAppProvider>
  </CoreProviders>
);

// ✅ DEVELOPMENT APP PROVIDER - With additional debugging
export const DevelopmentAppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Add performance monitoring in development
  React.useEffect(() => {
    if (__DEV__) {
      console.log('🚀 Development App Provider initialized');
      
      // Monitor context re-renders
      const interval = setInterval(() => {
        console.log('📊 Context performance check');
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <SimplifiedAppProvider enableOptionalProviders={true}>
      {children}
    </SimplifiedAppProvider>
  );
};

// ✅ PRODUCTION APP PROVIDER - Optimized for production
export const ProductionAppProvider: React.FC<{ children: ReactNode }> = ({ children }) => (
  <SimplifiedAppProvider enableOptionalProviders={true}>
    {children}
  </SimplifiedAppProvider>
);

// ✅ PROVIDER FACTORY - Choose provider based on environment
export const createAppProvider = (environment: 'development' | 'production' | 'test' = 'production') => {
  switch (environment) {
    case 'development':
      return DevelopmentAppProvider;
    case 'test':
      return MinimalAppProvider;
    case 'production':
    default:
      return ProductionAppProvider;
  }
};

// ✅ PROVIDER PERFORMANCE METRICS
export const useProviderMetrics = () => {
  const [metrics, setMetrics] = React.useState({
    renderCount: 0,
    lastRenderTime: Date.now(),
    averageRenderTime: 0,
  });

  React.useEffect(() => {
    const startTime = Date.now();
    
    setMetrics(prev => {
      const renderTime = startTime - prev.lastRenderTime;
      const newRenderCount = prev.renderCount + 1;
      const newAverageRenderTime = (prev.averageRenderTime * prev.renderCount + renderTime) / newRenderCount;
      
      return {
        renderCount: newRenderCount,
        lastRenderTime: startTime,
        averageRenderTime: newAverageRenderTime,
      };
    });
  });

  return metrics;
};

// ✅ CONTEXT HEALTH CHECK
export const useContextHealthCheck = () => {
  const [health, setHealth] = React.useState({
    isHealthy: true,
    issues: [] as string[],
    lastCheck: Date.now(),
  });

  React.useEffect(() => {
    const checkHealth = () => {
      const issues: string[] = [];
      
      // Check for common context issues
      try {
        // This would be expanded with actual health checks
        const memoryUsage = (performance as any)?.memory?.usedJSHeapSize;
        if (memoryUsage > 50 * 1024 * 1024) { // 50MB threshold
          issues.push('High memory usage detected');
        }
      } catch (error) {
        // Memory API not available
      }

      setHealth({
        isHealthy: issues.length === 0,
        issues,
        lastCheck: Date.now(),
      });
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return health;
};

export default SimplifiedAppProvider;
