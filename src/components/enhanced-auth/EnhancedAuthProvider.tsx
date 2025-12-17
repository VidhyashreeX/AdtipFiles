import React, { useEffect, ReactNode } from 'react';
import { useEnhancedAuth, useAuthActions } from '../../stores/enhanced-auth.store';
import { toast } from 'sonner';

interface EnhancedAuthProviderProps {
  children: ReactNode;
}

export const EnhancedAuthProvider: React.FC<EnhancedAuthProviderProps> = ({ children }) => {
  const { initializeAuth } = useAuthActions();
  const { isInitialized, error } = useEnhancedAuth();

  useEffect(() => {
    // Initialize authentication on app start
    initializeAuth().catch((err) => {
      console.error('Failed to initialize auth:', err);
      toast.error('Failed to restore authentication state');
    });
  }, [initializeAuth]);

  // Show error toast when auth errors occur
  useEffect(() => {
    if (error) {
      // Only show toast for certain types of errors, not validation errors
      const shouldShowToast = !error.includes('Please enter') && 
                             !error.includes('required') && 
                             !error.includes('valid');
      
      if (shouldShowToast) {
        toast.error(error);
      }
    }
  }, [error]);

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-adtip-teal mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Initializing...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};