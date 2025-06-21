import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import LastSeenService from '../services/LastSeenService';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to manage the ping service that keeps user's online status updated
 */
export const usePingService = () => {
  const appState = useRef(AppState.currentState);
  const { user, isAuthenticated } = useAuth();
  
  useEffect(() => {
    console.log('🔄 Initializing ping service...');
    
    // Only start if user is authenticated
    if (isAuthenticated && user?.id) {
      console.log(`🔄 Starting ping service for user ${user.id}`);
      LastSeenService.startTracking();
      
      // Handle app state changes
      const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) && 
          nextAppState === 'active'
        ) {
          console.log('🔄 App has come to the foreground, sending immediate ping');
          LastSeenService.ping(); // Send an immediate ping when app comes to foreground
        }
        
        if (
          appState.current === 'active' && 
          nextAppState.match(/inactive|background/)
        ) {
          console.log('🔄 App going to background, recording last seen time');
          LastSeenService.ping(); // Record last seen time before app goes to background
        }
        
        appState.current = nextAppState;
      });
      
      return () => {
        console.log('🔄 Cleaning up ping service');
        LastSeenService.stopTracking();
        subscription.remove();
      };
    } else {
      console.log('🔄 User not authenticated, ping service not started');
    }
  }, [isAuthenticated, user?.id]);
};