/**
 * Network utilities for API calls
 * Used to diagnose and handle common network issues
 */

/**
 * Checks if the server is reachable before making API calls
 * @param baseUrl - The base URL of the API server
 * @returns Promise with connectivity status
 */
export const checkServerConnectivity = async (baseUrl: string): Promise<boolean> => {
  try {
  // Use a lightweight GET request to check if server is reachable
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const token = localStorage.getItem('UserLoggedIn');
    const response = await fetch(`${baseUrl}/api/ping`, {
      method: 'GET',
      headers: token
        ? {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        : {
            'Accept': 'application/json'
          },
      cache: 'no-store',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Consider 401 as a successful connection - it means the server is up but requires auth
    // which is fine for our connectivity check purpose
    return response.ok || response.status === 401;
  } catch (error) {
    console.error('Server connectivity check failed:', error);
    return false;
  }
};

/**
 * Checks if the authorization token is present and valid
 * @returns Boolean indicating if auth token exists
 */
export const hasValidAuthToken = (): boolean => {
  const token = localStorage.getItem('UserLoggedIn');
  return !!token && token.length > 20; // Basic check to ensure token seems valid
};

/**
 * Get common network information for debugging
 * @returns Object with network diagnostic info
 */
export const getNetworkInfo = () => {
  return {
    online: navigator.onLine,
    connectionType: (navigator as any).connection ? (navigator as any).connection.effectiveType : 'unknown',
    timeStamp: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
};

/**
 * Helper to retry failed API requests
 * @param apiCallFn - The API function to retry
 * @param maxRetries - Maximum number of retry attempts
 * @returns Promise with API result
 */
export const retryApiCall = async (apiCallFn: () => Promise<any>, maxRetries = 2): Promise<any> => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // If not first attempt, add delay before retrying
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
      
      const result = await apiCallFn();
      return result;
    } catch (error) {
      lastError = error;
      
      // Only retry on network errors or 5xx server errors
      const isServerError = (error as any).response?.status >= 500;
      const isNetworkError = !(error as any).response;
      
      if (!isServerError && !isNetworkError) {
        throw error; // Don't retry client errors (4xx)
      }
      
      console.log(`API call attempt ${attempt + 1}/${maxRetries + 1} failed, ${attempt < maxRetries ? 'retrying...' : 'giving up.'}`);
    }
  }
  
  throw lastError;
};