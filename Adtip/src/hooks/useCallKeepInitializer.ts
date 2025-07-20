import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to initialize CallKeep only when user is authenticated and in main app
 * This prevents CallKeep from blocking the initial app startup
 */
const useCallKeepInitializer = () => {
  const { isAuthenticated, isInitialized } = useAuth();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only initialize CallKeep when:
    // 1. User is authenticated
    // 2. Auth system is initialized
    // 3. We haven't already initialized CallKeep
    if (isAuthenticated && isInitialized && !hasInitialized.current) {
      hasInitialized.current = true;

      // Delay CallKeep initialization to ensure UI is stable
      const initializeCallKeep = () => {
        setTimeout(async () => {
          try {
            console.log('[useCallKeepInitializer] 🔄 Initializing CallKeep for authenticated user...');

            // Dynamic import to avoid blocking main thread
            const { default: CallKeepService } = await import('../services/calling/CallKeepService');
            const callKeepService = CallKeepService.getInstance();

            // Initialize with timeout protection
            const initPromise = callKeepService.initialize();
            const timeoutPromise = new Promise<boolean>((resolve) => {
              setTimeout(() => {
                console.warn('[useCallKeepInitializer] ⚠️ CallKeep initialization timeout');
                resolve(false);
              }, 5000);
            });

            const result = await Promise.race([initPromise, timeoutPromise]);
            
            if (result) {
              console.log('[useCallKeepInitializer] ✅ CallKeep initialized successfully');
            } else {
              console.warn('[useCallKeepInitializer] ⚠️ CallKeep initialization failed or timed out');
            }

          } catch (error) {
            console.warn('[useCallKeepInitializer] ⚠️ CallKeep initialization error (non-critical):', error);
          }
        }, 2000); // 2 second delay after user reaches main app
      };

      initializeCallKeep();
    }
  }, [isAuthenticated, isInitialized]);

  // Reset initialization flag if user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      hasInitialized.current = false;
    }
  }, [isAuthenticated]);
};

export default useCallKeepInitializer;
