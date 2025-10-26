/**
 * Example App.tsx Implementation
 * 
 * This demonstrates how to properly initialize UnifiedCallService
 * at the app level to prevent VideoSDK WebSocket race conditions.
 */

import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, StatusBar } from 'react-native';
import UnifiedCallService from './src/services/calling/UnifiedCallService';
// Import your main navigator
// import RootNavigator from './src/navigation/RootNavigator';

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    const initializeServices = async () => {
      try {
        console.log('[App] Starting service initialization...');
        
        // Initialize UnifiedCallService (which includes VideoSDK initialization)
        const success = await UnifiedCallService.getInstance().initialize();
        
        if (success) {
          console.log('[App] ✅ All services initialized successfully');
          setIsInitialized(true);
        } else {
          console.error('[App] ❌ Service initialization failed');
          setInitializationError('Failed to initialize call services. Please restart the app.');
        }
      } catch (error: any) {
        console.error('[App] ❌ Service initialization error:', error);
        setInitializationError(error.message || 'An unknown error occurred during startup.');
      }
    };

    initializeServices();
  }, []);

  // Show loading screen while services are initializing
  if (!isInitialized) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#121212' 
      }}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#00D4AA" />
        <Text style={{ 
          color: '#fff', 
          marginTop: 16, 
          fontSize: 16,
          textAlign: 'center',
          paddingHorizontal: 20
        }}>
          {initializationError ? `Error: ${initializationError}` : 'Initializing call services...'}
        </Text>
        {initializationError && (
          <Text style={{ 
            color: '#FF6B6B', 
            marginTop: 8, 
            fontSize: 14,
            textAlign: 'center',
            paddingHorizontal: 20
          }}>
            Please restart the app to try again.
          </Text>
        )}
      </View>
    );
  }

  // Once initialized, render the main application
  // return <RootNavigator />;
  
  // For this example, just return a placeholder
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>App Initialized - Main Navigator would go here</Text>
    </View>
  );
};

export default App;

/**
 * Benefits of this approach:
 * 
 * 1. ✅ Prevents VideoSDK WebSocket race conditions
 * 2. ✅ Ensures all services are ready before any UI interactions
 * 3. ✅ Provides clear user feedback during initialization
 * 4. ✅ Handles initialization errors gracefully
 * 5. ✅ Centralizes service initialization logic
 * 
 * How it works:
 * 
 * 1. App starts and shows loading screen
 * 2. UnifiedCallService.initialize() is called and awaited
 * 3. This internally initializes VideoSDKService and ensures it's fully ready
 * 4. Only after successful initialization does the main app render
 * 5. Any call actions (startOutgoingCall, handleIncomingCall, join) are guaranteed
 *    to happen after full initialization
 * 
 * Additional safeguards in place:
 * 
 * - UnifiedCallService.startOutgoingCall() checks ensureInitialized() before proceeding
 * - UnifiedCallService.handleIncomingCall() checks ensureInitialized() before proceeding  
 * - MeetingScreen join logic checks ensureInitialized() before calling join()
 * - Promise-based initialization prevents multiple concurrent initialization attempts
 */
