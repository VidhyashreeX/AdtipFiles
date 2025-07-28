// src/hooks/useStandardizedLoading.ts
import { useState, useCallback, useRef } from 'react';
import { LoadingType } from '../components/common/StandardizedLoading';

export interface LoadingState {
  isLoading: boolean;
  type: LoadingType;
  message?: string;
  progress?: number;
}

export interface LoadingOptions {
  type?: LoadingType;
  message?: string;
  timeout?: number;
  onTimeout?: () => void;
}

// ✅ STANDARDIZED LOADING HOOK
export const useStandardizedLoading = (initialState: LoadingState = {
  isLoading: false,
  type: 'spinner',
}) => {
  const [loadingState, setLoadingState] = useState<LoadingState>(initialState);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ START LOADING with options
  const startLoading = useCallback((options: LoadingOptions = {}) => {
    const {
      type = 'spinner',
      message,
      timeout,
      onTimeout,
    } = options;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setLoadingState({
      isLoading: true,
      type,
      message,
      progress: 0,
    });

    // Set timeout if specified
    if (timeout && timeout > 0) {
      timeoutRef.current = setTimeout(() => {
        setLoadingState(prev => ({ ...prev, isLoading: false }));
        onTimeout?.();
      }, timeout);
    }
  }, []);

  // ✅ STOP LOADING
  const stopLoading = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setLoadingState(prev => ({ ...prev, isLoading: false }));
  }, []);

  // ✅ UPDATE LOADING MESSAGE
  const updateMessage = useCallback((message: string) => {
    setLoadingState(prev => ({ ...prev, message }));
  }, []);

  // ✅ UPDATE PROGRESS (for progress type)
  const updateProgress = useCallback((progress: number) => {
    setLoadingState(prev => ({ ...prev, progress: Math.max(0, Math.min(100, progress)) }));
  }, []);

  // ✅ CHANGE LOADING TYPE
  const changeType = useCallback((type: LoadingType) => {
    setLoadingState(prev => ({ ...prev, type }));
  }, []);

  // ✅ ASYNC WRAPPER - automatically manages loading state
  const withLoading = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options: LoadingOptions = {}
  ): Promise<T> => {
    try {
      startLoading(options);
      const result = await asyncFn();
      return result;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  // ✅ CLEANUP on unmount
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    // State
    ...loadingState,
    
    // Actions
    startLoading,
    stopLoading,
    updateMessage,
    updateProgress,
    changeType,
    withLoading,
    cleanup,
    
    // Convenience getters
    isSpinner: loadingState.type === 'spinner',
    isPulse: loadingState.type === 'pulse',
    isDots: loadingState.type === 'dots',
    isSkeleton: loadingState.type === 'skeleton',
    isProgress: loadingState.type === 'progress',
  };
};

// ✅ MULTIPLE LOADING STATES HOOK
export const useMultipleLoading = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, LoadingState>>({});

  const startLoading = useCallback((key: string, options: LoadingOptions = {}) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        isLoading: true,
        type: options.type || 'spinner',
        message: options.message,
        progress: 0,
      }
    }));
  }, []);

  const stopLoading = useCallback((key: string) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: { ...prev[key], isLoading: false }
    }));
  }, []);

  const updateLoading = useCallback((key: string, updates: Partial<LoadingState>) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: { ...prev[key], ...updates }
    }));
  }, []);

  const isLoading = useCallback((key: string) => {
    return loadingStates[key]?.isLoading || false;
  }, [loadingStates]);

  const getLoadingState = useCallback((key: string) => {
    return loadingStates[key] || { isLoading: false, type: 'spinner' as LoadingType };
  }, [loadingStates]);

  const isAnyLoading = Object.values(loadingStates).some(state => state.isLoading);

  return {
    loadingStates,
    startLoading,
    stopLoading,
    updateLoading,
    isLoading,
    getLoadingState,
    isAnyLoading,
  };
};

// ✅ NAVIGATION LOADING HOOK - specifically for navigation screens
export const useNavigationLoading = () => {
  const loading = useStandardizedLoading();

  // ✅ SCREEN TRANSITION LOADING
  const startScreenTransition = useCallback((message = 'Loading...') => {
    loading.startLoading({
      type: 'fade',
      message,
      timeout: 5000, // 5 second timeout for navigation
    });
  }, [loading]);

  // ✅ DATA LOADING
  const startDataLoading = useCallback((message = 'Loading data...') => {
    loading.startLoading({
      type: 'spinner',
      message,
      timeout: 10000, // 10 second timeout for data
    });
  }, [loading]);

  // ✅ CONTENT LOADING (for lists, feeds, etc.)
  const startContentLoading = useCallback((message?: string) => {
    loading.startLoading({
      type: 'skeleton',
      message,
      timeout: 15000, // 15 second timeout for content
    });
  }, [loading]);

  // ✅ UPLOAD/DOWNLOAD LOADING
  const startProgressLoading = useCallback((message = 'Processing...') => {
    loading.startLoading({
      type: 'progress',
      message,
    });
  }, [loading]);

  return {
    ...loading,
    startScreenTransition,
    startDataLoading,
    startContentLoading,
    startProgressLoading,
  };
};

// ✅ PRESET LOADING CONFIGURATIONS
export const LOADING_PRESETS = {
  // Quick actions
  QUICK_ACTION: {
    type: 'dots' as LoadingType,
    timeout: 3000,
  },
  
  // API calls
  API_CALL: {
    type: 'spinner' as LoadingType,
    timeout: 10000,
  },
  
  // File uploads
  FILE_UPLOAD: {
    type: 'progress' as LoadingType,
    message: 'Uploading...',
  },
  
  // Screen transitions
  SCREEN_TRANSITION: {
    type: 'fade' as LoadingType,
    timeout: 5000,
  },
  
  // Content loading
  CONTENT_LOADING: {
    type: 'skeleton' as LoadingType,
    timeout: 15000,
  },
  
  // Authentication
  AUTH_LOADING: {
    type: 'pulse' as LoadingType,
    message: 'Authenticating...',
    timeout: 8000,
  },
} as const;

export default useStandardizedLoading;
