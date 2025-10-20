/**
 * Centralized authentication redirect utility
 * This file provides a single source of truth for handling authentication redirects
 * across the entire application. Use requireAuth() instead of navigate('/login')
 */

let authModalContext: {
  openLoginModal: () => void;
  openOTPModal: (phone: string, tempUserId: string) => void;
} | null = null;

/**
 * Initialize the auth redirect system with the modal context
 * This should be called once when the app initializes
 */
export const initAuthRedirect = (context: {
  openLoginModal: () => void;
  openOTPModal: (phone: string, tempUserId: string) => void;
}) => {
  authModalContext = context;
};

/**
 * Trigger login modal - can be called from anywhere including axios interceptors
 * This is the main function to use for requiring authentication
 */
export const triggerLoginModal = () => {
  if (authModalContext) {
    authModalContext.openLoginModal();
  } else {
    console.error('Auth redirect not initialized. Call initAuthRedirect() in App.tsx');
    // Fallback to navigation if modal context not available
    window.location.href = '/login';
  }
};

/**
 * Require authentication - opens login modal if not authenticated
 * Use this instead of navigate('/login') throughout the app
 * 
 * @param isAuthenticated - Whether the user is currently authenticated
 * @param callback - Optional callback to execute after successful authentication
 * @returns true if authenticated, false if modal was opened
 */
export const requireAuth = (
  isAuthenticated: boolean,
  callback?: () => void
): boolean => {
  if (isAuthenticated) {
    callback?.();
    return true;
  }

  triggerLoginModal();
  return false;
};

/**
 * Hook into the requireAuth for components
 * Returns a function that can be called to check auth and open modal if needed
 */
export const useRequireAuth = () => {
  return requireAuth;
};
