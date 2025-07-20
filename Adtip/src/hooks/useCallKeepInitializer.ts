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

      // Completely non-blocking CallKeep initialization
      const initializeCallKeep = () => {
        // Use setImmediate to ensure this runs after all current UI updates
        setImmediate(() => {
          setTimeout(async () => {
            try {
              console.log('[useCallKeepInitializer] 🔄 Starting non-blocking CallKeep initialization...');

              // Dynamic import to avoid blocking main thread
              const { default: CallKeepService } = await import('../services/calling/CallKeepService');
              const callKeepService = CallKeepService.getInstance();

              // Fire and forget - don't await the result to avoid any blocking
              callKeepService.initialize()
                .then((result) => {
                  if (result) {
                    console.log('[useCallKeepInitializer] ✅ CallKeep initialized successfully');
                    console.log('[useCallKeepInitializer] 📋 CallKeep is now available for native call UI');
                  } else {
                    console.warn('[useCallKeepInitializer] ⚠️ CallKeep initialization failed (app continues normally)');
                    console.warn('[useCallKeepInitializer] 📋 App will use custom call UI instead of native UI');
                  }
                })
                .catch((error) => {
                  console.warn('[useCallKeepInitializer] ⚠️ CallKeep initialization error (non-critical):', error);
                  console.warn('[useCallKeepInitializer] 📋 This is expected on some devices - app will continue normally');
                });

              console.log('[useCallKeepInitializer] 🚀 CallKeep initialization started in background');

            } catch (error) {
              console.warn('[useCallKeepInitializer] ⚠️ CallKeep initialization setup error (non-critical):', error);
            }
          }, 3000); // Increased delay to 3 seconds to ensure UI is fully stable
        });
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
