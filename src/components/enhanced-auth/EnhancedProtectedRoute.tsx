import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useEnhancedAuth } from '../../stores/enhanced-auth.store';

interface EnhancedProtectedRouteProps {
  fallback?: string;
  requireProfile?: boolean;
}

export const EnhancedProtectedRoute: React.FC<EnhancedProtectedRouteProps> = ({ 
  fallback = '/login',
  requireProfile = false 
}) => {
  const { user, isAuthenticated, isLoading, isInitialized } = useEnhancedAuth();

  // Show loading while initializing or loading
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-adtip-teal mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to={fallback} replace />;
  }

  // Check if profile completion is required
  if (requireProfile && (!user.name || !user.profile_image)) {
    return <Navigate to="/complete-profile" replace />;
  }

  return <Outlet />;
};

export const EnhancedPublicRoute: React.FC = () => {
  const { isAuthenticated, isLoading, isInitialized, user } = useEnhancedAuth();

  // Show loading while initializing
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-adtip-teal mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect authenticated users to appropriate page
  if (isAuthenticated && user) {
    // Check if user needs to complete profile
    if (!user.name || !user.profile_image) {
      return <Navigate to="/complete-profile" replace />;
    }
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
};