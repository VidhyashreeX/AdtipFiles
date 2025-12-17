import React from 'react';
import { Button } from '@/components/ui/button';
import { useEnhancedAuth } from '../../hooks/useEnhancedAuth';
import { toast } from 'sonner';

/**
 * Example component demonstrating how to use the enhanced authentication system
 * This shows best practices for handling authentication in components
 */
export const AuthExample: React.FC = () => {
  const {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // Actions
    requireAuth,
    logout,
    clearError,
    
    // Computed state
    isPremium,
    hasChannel,
    needsProfileCompletion,
  } = useEnhancedAuth();

  // Example of protecting an action that requires authentication
  const handleProtectedAction = () => {
    requireAuth(() => {
      // This code only runs if user is authenticated
      toast.success(`Hello ${user?.name || 'User'}! You are authenticated.`);
    });
  };

  // Example of handling premium features
  const handlePremiumFeature = () => {
    requireAuth(() => {
      if (isPremium) {
        toast.success('Premium feature accessed!');
      } else {
        toast.error('This feature requires a premium subscription.');
      }
    });
  };

  // Example of handling channel-specific features
  const handleChannelFeature = () => {
    requireAuth(() => {
      if (hasChannel) {
        toast.success('Channel feature accessed!');
      } else {
        toast.error('Please create a channel first.');
      }
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
        Authentication Example
      </h2>

      {/* Authentication Status */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="font-semibold mb-2">Status:</h3>
        <p className="text-sm">
          <span className="font-medium">Authenticated:</span>{' '}
          <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
            {isAuthenticated ? 'Yes' : 'No'}
          </span>
        </p>
        {isAuthenticated && user && (
          <>
            <p className="text-sm">
              <span className="font-medium">User:</span> {user.name || 'No name set'}
            </p>
            <p className="text-sm">
              <span className="font-medium">Premium:</span>{' '}
              <span className={isPremium ? 'text-green-600' : 'text-gray-600'}>
                {isPremium ? 'Yes' : 'No'}
              </span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Has Channel:</span>{' '}
              <span className={hasChannel ? 'text-green-600' : 'text-gray-600'}>
                {hasChannel ? 'Yes' : 'No'}
              </span>
            </p>
            {needsProfileCompletion && (
              <p className="text-sm text-orange-600">
                Profile completion required
              </p>
            )}
          </>
        )}
        {isLoading && (
          <p className="text-sm text-blue-600">Loading...</p>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          <Button
            onClick={clearError}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            Clear Error
          </Button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        <Button
          onClick={handleProtectedAction}
          className="w-full"
          disabled={isLoading}
        >
          Protected Action
        </Button>

        <Button
          onClick={handlePremiumFeature}
          variant="outline"
          className="w-full"
          disabled={isLoading}
        >
          Premium Feature
        </Button>

        <Button
          onClick={handleChannelFeature}
          variant="outline"
          className="w-full"
          disabled={isLoading}
        >
          Channel Feature
        </Button>

        {isAuthenticated && (
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full"
            disabled={isLoading}
          >
            Logout
          </Button>
        )}
      </div>

      {/* Usage Tips */}
      <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h4 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">
          Usage Tips:
        </h4>
        <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Use requireAuth() to protect actions that need authentication</li>
          <li>• Check isPremium, hasChannel for feature access</li>
          <li>• Handle loading states to prevent multiple requests</li>
          <li>• Clear errors after showing them to users</li>
          <li>• Use the authentication modals for login/OTP flows</li>
        </ul>
      </div>
    </div>
  );
};