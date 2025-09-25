// App.tsx
// Removed legacy callStore import to prevent dual store confusion
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  Text,
} from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SafeAreaProvider,
  useSafeAreaInsets
} from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getApps } from '@react-native-firebase/app';
import mobileAds from 'react-native-google-mobile-ads';
import { useAppOpenAd } from './src/googleads';

// Contexts
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { WalletProvider } from './src/contexts/WalletContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { ShortsProvider } from './src/contexts/ShortsContext';
import { SidebarProvider } from './src/contexts/SidebarContext';
import { TabNavigatorProvider } from './src/contexts/TabNavigatorContext';
//import { CallProvider, useCall, ActiveCall } from './src/contexts/CallProvider';
import { ContentCreatorPremiumProvider } from './src/contexts/ContentCreatorPremiumContext';
import { UserDataProvider } from './src/contexts/UserDataContext';
import { FCMChatProvider } from './src/contexts/FCMChatContext';
import { DataProvider } from './src/providers/DataProvider';
import { EnhancedQueryProvider } from './src/providers/QueryProvider';
import { KeyboardAvoiderProvider } from '@good-react-native/keyboard-avoider';
import CallEndModalProvider from './src/components/providers/CallEndModalProvider';

// Components & Navigators
import MainNavigator from './src/navigation/MainNavigator';
import { navigationRef } from './src/navigation/NavigationService';

// Services
import FirebaseService from './src/services/FirebaseService';
import VideoSDKService from './src/services/videosdk/VideoSDKService';
import PermissionManagerService from './src/services/PermissionManagerService';
import PubScaleService from './src/services/PubScaleService';



// Constants
import { COLORS } from './src/constants/colors';

// Import ProductionLogger for performance-optimized logging
import { Logger } from './src/utils/ProductionLogger';

// Import required screens
import UserDetailsScreen from './src/screens/auth/UserDetailsScreen';
//import ChatScreen from './src/screens/chat/ChatScreen';

// Ultra Fast Loader for instant app initialization
import UltraFastLoader from './src/components/common/UltraFastLoader';
import AppErrorBoundary from './src/components/common/AppErrorBoundary';
import ForceUpdateModal from './src/components/common/ForceUpdateModal';
import VersionCheckService from './src/services/VersionCheckService';
import ForceUpdateDebugButton from './src/components/debug/ForceUpdateDebugButton';
import ThemeTestModal from './src/components/debug/ThemeTestModal';
import CallKeepTestButtons from './src/components/debug/CallKeepTestButtons';
import DebugButtonsList from './src/components/debug/DebugButtonsList';

import { RootStackParamList } from 'src/types/navigation';
import useReliableCallManager from './src/hooks/useReliableCallManager';
import useFCMMessageRouter from './src/hooks/useFCMMessageRouter';

// Import call store (simplified)
import { useCallStore } from './src/stores/callStoreSimplified';

import CallConfig from './src/config/CallConfig';
import PersistentMeetingManager from './src/components/videosdk/PersistentMeetingManager';

const RootStack = createNativeStackNavigator<RootStackParamList>();

// Theme-aware StatusBar with proper safe area handling
const ThemeAwareStatusBar = () => {
  const { isDarkMode, colors } = useTheme();
  return (
    <StatusBar
      translucent={true}
      backgroundColor="transparent"
      barStyle={isDarkMode ? 'light-content' : 'dark-content'}
    />
  );
};

// Import simplified deep linking configuration
import { DEEP_LINK_CONFIG } from './src/config/deepLinkConfig';

// AppNavigator with Services - Ultra Fast with Authentication-aware UltraFastLoader
const AppNavigator = () => {
  const { isAuthenticated, isInitialized, user } = useAuth();
  const { status: callStatus, session: activeSession } = useCallStore();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [pendingCall, setPendingCall] = useState<any>(null);
  const [coldStartChecked, setColdStartChecked] = useState(false);

  // Check if user needs to complete profile details (robust check across possible name fields)
  const hasName = Boolean(user?.name?.trim?.() || (user as any)?.firstname?.trim?.() || (user as any)?.firstName?.trim?.());
  const hasCompleted = user?.isSaveUserDetails === 1 || (user as any)?.isSaveUserDetails === true;
  const needsUserDetails = isAuthenticated && !(hasName && hasCompleted);

  // Check for pending calls from killed state FIRST
  useEffect(() => {
    const checkPendingCall = async () => {
      try {
        Logger.debug('App', '🔍 Checking for pending call from killed state...');
        const pendingCallData = await AsyncStorage.getItem('PENDING_CALL');
        
        if (pendingCallData) {
          const callData = JSON.parse(pendingCallData);
          Logger.info('App', '🔥 PENDING CALL FOUND from killed state:', callData);
          
          // Validate that the call is not too old (5 minutes max)
          const callAge = Date.now() - callData.timestamp;
          if (callAge < 5 * 60 * 1000) {
            setPendingCall(callData);
            // Clear the pending call data
            await AsyncStorage.removeItem('PENDING_CALL');
          } else {
            Logger.warn('App', 'Pending call too old, ignoring:', callAge / 1000, 'seconds');
            await AsyncStorage.removeItem('PENDING_CALL');
          }
        }
      } catch (error) {
        Logger.error('App', 'Error checking pending call:', error);
      } finally {
        setColdStartChecked(true);
      }
    };

    checkPendingCall();
  }, []);

  // Handle pending call navigation after initialization
  useEffect(() => {
    if (!coldStartChecked || !isInitialized || !pendingCall) return;

    const navigateToPendingCall = async () => {
      try {
        Logger.info('App', '🚀 Navigating to pending call from killed state');
        
        // Ensure VideoSDK is initialized first
        const videoSDKService = VideoSDKService.getInstance();
        await videoSDKService.ensureInitialized();
        
        // Navigate to Meeting screen with the pending call data
        const navigationService = await import('./src/navigation/SimplifiedNavigationService');
        
        // Wait a bit for navigation to be ready
        let retries = 0;
        while (!navigationService.navigationRef.isReady() && retries < 10) {
          await new Promise(resolve => setTimeout(resolve, 200));
          retries++;
        }
        
        if (navigationService.navigationRef.isReady()) {
          const success = navigationService.default.navigateToMeeting({
            meetingId: pendingCall.meetingId,
            token: pendingCall.token,
            displayName: user?.name || 'Me',
            callType: pendingCall.callType,
            isInitiator: false,
            recipientName: pendingCall.callerName,
            callData: {
              sessionId: pendingCall.sessionId,
              direction: 'incoming',
              type: pendingCall.callType,
              callerName: pendingCall.callerName,
              fromKilledState: true
            }
          });
          
          if (success) {
            Logger.info('App', '✅ Successfully navigated to pending call');
            
            // Update call store
            const store = useCallStore.getState();
            store.actions.setSession({
              sessionId: pendingCall.sessionId,
              meetingId: pendingCall.meetingId,
              token: pendingCall.token,
              peerId: 'unknown',
              peerName: pendingCall.callerName,
              direction: 'incoming',
              type: pendingCall.callType,
              startedAt: Date.now()
            });
            store.actions.setStatus('connecting');
          } else {
            Logger.error('App', '❌ Failed to navigate to pending call');
          }
        } else {
          Logger.error('App', '❌ Navigation not ready after 10 retries');
        }
        
        // Clear pending call after handling
        setPendingCall(null);
      } catch (error) {
        Logger.error('App', 'Error navigating to pending call:', error);
        setPendingCall(null);
      }
    };

    navigateToPendingCall();
  }, [coldStartChecked, isInitialized, pendingCall, user]);

  // Memoize the initialization complete callback to prevent re-renders
  const handleInitializationComplete = useCallback(() => {
    Logger.debug('App', 'Ultra-fast initialization complete');
    
    // CRITICAL FIX: Check for FCM notification from killed state first
    setTimeout(async () => {
      try {
        // Skip FCM check if we already have a pending call from AsyncStorage
        if (pendingCall) {
          Logger.debug('App', 'Skipping FCM check - already have pending call from AsyncStorage');
          return;
        }

        Logger.debug('App', '🔥 Checking for killed state FCM notification...');
        
        const messaging = (await import('@react-native-firebase/messaging')).default;
        const initialNotification = await messaging().getInitialNotification();
        
        if (initialNotification?.data?.type === 'incoming_call') {
          Logger.info('App', '🔥 KILLED STATE NOTIFICATION DETECTED - Processing incoming call:', {
            messageId: initialNotification.messageId,
            data: initialNotification.data
          });

          // Extract and validate FCM notification data with proper type safety
          const rawData = initialNotification.data;
          const meetingId = typeof rawData.meetingId === 'string' ? rawData.meetingId : '';
          const token = typeof rawData.token === 'string' ? rawData.token : '';
          const callerName = typeof rawData.callerName === 'string' ? rawData.callerName : '';
          const rawCallType = typeof rawData.callType === 'string' ? rawData.callType : 'voice';
          const callType: 'voice' | 'video' = rawCallType === 'video' ? 'video' : 'voice';
          const sessionId = typeof rawData.sessionId === 'string' ? rawData.sessionId : '';

          // Validate required parameters for meeting join
          if (meetingId && token && callerName) {
            Logger.info('App', '🔥 Valid meeting parameters found, navigating directly to Meeting screen');

            // Direct navigation to Meeting screen with all required parameters
            const navigationService = await import('./src/navigation/SimplifiedNavigationService');
            
            // Give navigation container time to initialize in killed state
            const tryNavigateToMeeting = async (attempts = 0) => {
              const maxAttempts = 5;
              const delay = 500 + (attempts * 300); // Increasing delay: 500ms, 800ms, 1100ms, etc.

              if (attempts >= maxAttempts) {
                Logger.error('App', '❌ Failed to navigate to Meeting after max attempts');
                return false;
              }

              if (navigationService.navigationRef.isReady()) {
                const navigationSuccess = navigationService.default.navigateToMeeting({
                  meetingId,
                  token,
                  displayName: 'Me',
                  callType: callType === 'video' ? 'video' : 'voice',
                  isInitiator: false,
                  recipientName: callerName,
                  callData: {
                    sessionId: sessionId || `killed-state-${Date.now()}`,
                    direction: 'incoming',
                    type: callType,
                    callerName,
                    fromKilledState: true // Flag to help meeting screen handle killed state differently
                  }
                });

                if (navigationSuccess) {
                  Logger.info('App', '✅ KILLED STATE: Successfully navigated to Meeting screen');
                  
                  // Initialize call state in the store for proper handling
                  try {
                    const { useCallStore } = await import('./src/stores/callStoreSimplified');
                    const store = useCallStore.getState();
                    
                    store.actions.setSession({
                      sessionId: sessionId || `killed-state-${Date.now()}`,
                      meetingId,
                      token,
                      peerId: 'unknown',
                      peerName: callerName,
                      direction: 'incoming',
                      type: callType === 'video' ? 'video' : 'voice',
                      startedAt: Date.now()
                    });
                    
                    // Set status to connecting since we're directly joining
                    store.actions.setStatus('connecting');
                    Logger.info('App', '✅ KILLED STATE: Call store initialized for incoming call');
                    
                  } catch (storeError) {
                    Logger.error('App', '❌ Failed to initialize call store for killed state:', storeError);
                  }

                  // Save state to persistence service for backup
                  try {
                    const { default: CallStatePersistenceService } = await import('./src/services/calling/CallStatePersistenceService');
                    const persistenceService = CallStatePersistenceService.getInstance();
                    await persistenceService.initialize();
                    
                    await persistenceService.saveCallState({
                      sessionId: sessionId || `killed-state-${Date.now()}`,
                      callerName,
                      callType,
                      meetingId,
                      token,
                      status: 'active',
                      appState: 'foreground',
                      fromKilledState: true
                    });
                    
                    Logger.info('App', '✅ KILLED STATE: Call state saved to persistence');
                  } catch (persistError) {
                    Logger.error('App', '❌ Failed to save killed state call to persistence:', persistError);
                  }

                  return true;
                } else {
                  Logger.warn('App', `🔥 Navigation attempt ${attempts + 1} failed, retrying...`);
                  await new Promise(resolve => setTimeout(resolve, delay));
                  return tryNavigateToMeeting(attempts + 1);
                }
              } else {
                Logger.warn('App', `🔥 Navigation not ready yet, attempt ${attempts + 1}, retrying...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return tryNavigateToMeeting(attempts + 1);
              }
            };

            // Start the navigation retry process
            await tryNavigateToMeeting();
            
            // Skip the persistence recovery check since we handled killed state
            return;

          } else {
            Logger.error('App', '❌ Invalid killed state notification parameters:', {
              meetingId: meetingId ? 'present' : 'missing',
              token: token ? 'present' : 'missing',
              callerName: callerName ? 'present' : 'missing'
            });
            // Fall through to persistence recovery
          }
        } else {
          Logger.debug('App', '🔄 No killed state notification found, checking persistence...');
          // Fall through to persistence recovery
        }

        // Original persistence recovery logic (only if no killed state notification)
        Logger.debug('App', '🔄 Checking for persisted call state recovery...');
        
        const { default: CallStatePersistenceService } = await import('./src/services/calling/CallStatePersistenceService');
        const persistenceService = CallStatePersistenceService.getInstance();
        
        // Initialize the service
        await persistenceService.initialize();
        
        // Check for call recovery
        const recoveredCall = await persistenceService.checkForCallRecovery({
          maxCallAge: 120000, // 2 minutes
          showMissedCallUI: true,
          retryAttempts: 3
        });

        if (recoveredCall) {
          if (recoveredCall.status === 'incoming') {
            Logger.info('App', '🔄 Active call found for recovery - rejoining VideoSDK meeting:', {
              sessionId: recoveredCall.sessionId,
              callerName: recoveredCall.callerName,
              callType: recoveredCall.callType
            });

            // Rejoin the VideoSDK meeting
            try {
              const { default: VideoSDKService } = await import('./src/services/videosdk/VideoSDKService');
              const videoSDKService = VideoSDKService.getInstance();
              
              // Ensure VideoSDK is initialized
              await videoSDKService.initialize();

              // Initialize VideoSDK for recovery (don't auto-join, let user decide)
              await videoSDKService.initialize();

              // Update call status to active
              await persistenceService.updateCallStatus('active', {
                appState: 'foreground'
              });

              Logger.info('App', '✅ Call recovery successful - VideoSDK ready for meeting join');

              // Navigate to meeting screen for recovery
              const { navigationRef } = await import('./src/navigation/NavigationService');
              if (navigationRef.current?.isReady()) {
                navigationRef.current.navigate('Meeting', {
                  meetingId: recoveredCall.meetingId,
                  token: recoveredCall.token,
                  callType: recoveredCall.callType,
                  displayName: 'Me',
                  isInitiator: false,
                  recipientName: recoveredCall.callerName
                });
              }

            } catch (rejoinError) {
              Logger.error('App', '❌ Failed to rejoin recovered call:', rejoinError);
              
              // Mark call as missed since recovery failed
              const errorMessage = rejoinError instanceof Error ? rejoinError.message : 'Recovery failed';
              await persistenceService.updateCallStatus('missed');
            }

          } else if (recoveredCall.status === 'missed') {
            Logger.info('App', '📵 Missed call found - showing missed call notification:', {
              sessionId: recoveredCall.sessionId,
              callerName: recoveredCall.callerName
            });

            // Show missed call notification
            try {
              const notifee = require('@notifee/react-native').default;
              
              // Create notification channel
              const channelId = await notifee.createChannel({
                id: 'missed_calls',
                name: 'Missed Calls',
                importance: 3, // DEFAULT
                sound: 'default',
              });

              // Display missed call notification
              await notifee.displayNotification({
                title: '📞 Missed Call',
                body: `Missed call from ${recoveredCall.callerName}`,
                android: {
                  channelId,
                  pressAction: { id: 'default', launchActivity: 'default' },
                  smallIcon: 'ic_notification',
                },
                data: {
                  type: 'missed_call',
                  callerName: recoveredCall.callerName,
                  callType: recoveredCall.callType
                }
              });

              Logger.info('App', '✅ Missed call notification displayed');
            } catch (missedCallError) {
              Logger.error('App', '❌ Failed to show missed call notification:', missedCallError);
            }
          }
        } else {
          Logger.debug('App', '✅ No persisted call state found - normal app start');
        }

      } catch (error) {
        Logger.error('App', '❌ Killed state/persistence recovery failed:', error);
        // Don't block app startup on recovery failure
      }
    }, 1500); // Reduced delay for faster killed state handling
  }, []);

  // ✅ SIMPLIFIED: Deep linking now handled in UltraFastLoader

  // Set all services as ready immediately - they'll initialize in background
  useEffect(() => {
    // Initialize all services as ready immediately for ultra-fast app start
    Logger.debug('App', 'All services marked as ready for instant app start');
  }, []);

  // Background initialization - no blocking with delayed execution
  useEffect(() => {
    if (!isInitialized) return;
    
    // Background Firebase initialization - minimal delay for UI responsiveness
    setTimeout(() => {
      (async () => {
        try {
          Logger.debug('App', 'Background: Initializing Firebase service...');
          const apps = getApps();
          if (apps.length === 0) {
            Logger.warn('App', 'Background: No Firebase apps found');
          } else {
            Logger.debug('App', `Background: Found ${apps.length} Firebase app(s)`);
          }

          const firebaseService = FirebaseService.getInstance();
          const success = await firebaseService.initializeMessaging();

          if (success) {
            Logger.info('App', 'Background: Firebase service initialized successfully');
            // Setup notifications when ready
            if (isAuthenticated) {
              await firebaseService.setupNotifications();
              firebaseService.setupNotificationListeners();
              firebaseService.executeDelayedNavigation();
            }
          } else {
            Logger.warn('App', 'Background: Firebase service initialization failed');
          }

          // Initialize Notifee call handler for custom notifications
          try {
            const { default: NotifeeCallHandler } = await import('./src/services/notification/NotifeeCallHandler');
            const notifeeHandler = NotifeeCallHandler.getInstance();
            await notifeeHandler.initialize();
            Logger.info('App', 'Background: Notifee call handler initialized successfully');
          } catch (error) {
            Logger.warn('App', 'Background: Notifee call handler initialization failed:', error);
          }
        } catch (error) {
          Logger.error('App', 'Background: Firebase initialization error:', error);
        }
      })();
    }, 100); // Minimal delay for UI responsiveness

    // Background VideoSDK initialization with pre-warming
    setTimeout(() => {
      (async () => {
        try {
          Logger.debug('App', 'Background: Initializing VideoSDK service...');
          const videoSDKService = VideoSDKService.getInstance();
          const success = await videoSDKService.initialize();

          if (success) {
            Logger.info('App', 'Background: VideoSDK service initialized successfully');

            // Start WebSocket pre-warming after successful VideoSDK initialization
            try {
              Logger.debug('App', '🔥 Background: Starting VideoSDK WebSocket pre-warming...');
              const { VideoSDKPrewarmingService } = await import('./src/services/videosdk/VideoSDKPrewarmingService');
              const prewarmingService = VideoSDKPrewarmingService.getInstance();

              Logger.debug('App', '🔥 Background: Initializing pre-warming service...');
              // Initialize pre-warming service
              await prewarmingService.initialize();

              Logger.debug('App', '🔥 Background: Starting pre-warming process...');
              // Start pre-warming process in background (non-blocking)
              prewarmingService.startPrewarming().then((prewarmSuccess) => {
                if (prewarmSuccess) {
                  Logger.info('App', '🔥 Background: VideoSDK WebSocket pre-warming completed successfully');
                } else {
                  Logger.warn('App', '🔥 Background: VideoSDK WebSocket pre-warming failed (non-critical)');
                }
              }).catch((prewarmError) => {
                Logger.warn('App', '🔥 Background: VideoSDK WebSocket pre-warming error (non-critical):', prewarmError);
              });

            } catch (prewarmingError) {
              Logger.warn('App', '🔥 Background: VideoSDK pre-warming service initialization failed (non-critical):', prewarmingError);
            }
          } else {
            Logger.warn('App', 'Background: VideoSDK service initialization failed');
          }
        } catch (error) {
          Logger.error('App', 'Background: VideoSDK initialization error:', error);
        }
      })();
    }, 200);

    // Background Unified Call Service initialization
    setTimeout(() => {
      (async () => {
        try {
          // Request notification permissions using centralized service
          Logger.debug('App', 'Background: Requesting notification permissions...');
          const permissionManager = PermissionManagerService.getInstance();
          const notificationResult = await permissionManager.requestNotificationPermissions();
          Logger.debug('App', 'Background: Notification permissions result:', notificationResult);

          Logger.debug('App', 'Background: Call services initialized via CallController (auto-init)');
        } catch (error) {
          Logger.error('App', 'Background: Unified Call Service initialization error:', error);
        }
      })();
    }, 300);

    // Background permissions initialization - delayed to not impact UI
    if (isAuthenticated) {
      setTimeout(async () => {
        try {
          const PermissionsServiceModule = await import('./src/services/PermissionsService');
          const PermissionsService = PermissionsServiceModule.default;
          await PermissionsService.requestPhoneCallForegroundServicePermission();
          Logger.debug('App', 'Background: Phone call permissions requested');
        } catch (error) {
          Logger.debug('App', 'Background: Phone call permissions request failed (not critical):', error);
        }
      }, 1000); // Reduced from 2000ms to 1000ms
    }

    // Background PubScale initialization - delayed to not impact UI
    if (isAuthenticated && user?.id) {
      setTimeout(async () => {
        try {
          Logger.debug('App', 'Background: Initializing PubScale service...');
          await PubScaleService.initialize(String(user.id));
          Logger.info('App', 'Background: PubScale service initialized successfully');
        } catch (error) {
          Logger.debug('App', 'Background: PubScale service initialization failed (not critical):', error);
        }
      }, 1500); // Initialize after other services
    }

    // Background Cloudflare cache cleanup initialization
    setTimeout(async () => {
      try {
        Logger.debug('App', 'Background: Initializing Cloudflare cache cleanup...');
        const { CloudflareUploadService } = await import('./src/services/CloudflareUploadService');
        CloudflareUploadService.initializeCacheCleanup();
        Logger.info('App', 'Background: Cloudflare cache cleanup initialized successfully');
      } catch (error) {
        Logger.debug('App', 'Background: Cloudflare cache cleanup initialization failed (not critical):', error);
      }
    }, 2000); // Initialize after other services
  }, [isInitialized, isAuthenticated]);

  // Incoming call handling is now managed by ReliableCallManager via FCM
  // No need for manual event handling here as FCM messages are routed automatically

  // Navigation handler for call status changes is no longer needed
  // The PersistentMeetingManager handles call UI directly
  // Removed to prevent conflicts with persistent meeting component

  // CallKeep native call actions are handled automatically by CallKeepService event listeners
  // No need for manual event handling here as CallKeepService sets up its own listeners

  // Always use UltraFastLoader unless user needs profile completion
  if (!needsUserDetails) {
    return <UltraFastLoader onInitializationComplete={handleInitializationComplete} />;
  }

  // Only show UserDetails screen if authenticated but missing user name
  return (
    <NavigationContainer ref={navigationRef} linking={DEEP_LINK_CONFIG} fallback={<Text>Loading...</Text>}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="UserDetails" component={UserDetailsScreen} />
        <RootStack.Screen name="Main" component={MainNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

// Root App Component
function App(): React.JSX.Element {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const { colors } = useTheme();
  const callRef = useRef<string | null>(null);
  const tabRouteRef = useRef<string | null>(null);
  const [initialRoute, setInitialRoute] = useState<string | undefined>();

  // Force update state
  const [showForceUpdate, setShowForceUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);

  // Global error handler for production builds
  useEffect(() => {
    // Check if ErrorUtils is available
    if (!ErrorUtils || typeof ErrorUtils.getGlobalHandler !== 'function') {
      console.warn('[App] ⚠️ ErrorUtils not available, skipping global error handler setup');
      return;
    }

    try {
      const originalErrorHandler = ErrorUtils.getGlobalHandler();
      
      const globalErrorHandler = (error: Error, isFatal?: boolean) => {
        // Log the error
        Logger.error('App', '🚨 Global error caught:', {
          error: error.message,
          stack: error.stack,
          isFatal,
          isProduction: !__DEV__
        });

        // In production, prevent crashes by handling the error gracefully
        if (!__DEV__) {
          console.warn('[App] 🚫 Preventing crash in production build');
          
          // For CallKeep related errors, disable CallKeep and continue
          if (error.message?.includes('RNCallKeep') || error.message?.includes('displayIncomingCall')) {
            console.warn('[App] 🚫 CallKeep error detected, disabling CallKeep functionality');
            // The CallKeepService will handle this gracefully
            return;
          }
          
          // For other errors, log and continue
          console.warn('[App] 🚫 Non-critical error, continuing app execution');
          return;
        }
        
        // In development, let the original handler deal with it
        if (originalErrorHandler && typeof originalErrorHandler === 'function') {
          originalErrorHandler(error, isFatal);
        }
      };
      
      ErrorUtils.setGlobalHandler(globalErrorHandler);
      
      return () => {
        try {
          if (ErrorUtils && typeof ErrorUtils.setGlobalHandler === 'function') {
            ErrorUtils.setGlobalHandler(originalErrorHandler);
          }
        } catch (cleanupError) {
          console.warn('[App] ⚠️ Error during error handler cleanup:', cleanupError);
        }
      };
    } catch (setupError) {
      console.warn('[App] ⚠️ Failed to setup global error handler:', setupError);
    }
  }, []);

  // Initialize call configuration for simplified flow
  useEffect(() => {
    CallConfig.enableSimplifiedFlow();
    Logger.debug('App', 'Call configuration initialized for simplified flow');
  }, []);

  // Version check on app start - critical for force updates
  useEffect(() => {
    const checkAppVersion = async () => {
      try {
        Logger.debug('App', '🔍 Starting critical version check...');
        const versionService = VersionCheckService.getInstance();
        const updateResult = await versionService.forceCheckForUpdates();

        if (updateResult && updateResult.status && updateResult.data) {
          Logger.warn('App', '⚠️ Update required:', updateResult.data);
          setUpdateInfo(updateResult.data);

          if (updateResult.data.force_update) {
            Logger.error('App', '🚨 FORCE UPDATE REQUIRED - Blocking app access');
            setShowForceUpdate(true);
          } else {
            Logger.info('App', '📱 Optional update available');
            // For optional updates, we could show a less intrusive notification
            // For now, we'll still show the modal but allow dismissal
            setShowForceUpdate(true);
          }
        } else {
          Logger.info('App', '✅ App version is up to date');
        }
      } catch (error) {
        Logger.error('App', '❌ Version check failed:', error);
        // Don't block the app if version check fails
      }
    };

    // Run version check immediately on app start
    checkAppVersion();
  }, []);

  // Add reliable call manager for FCM call handling
  useReliableCallManager();

  // Add centralized FCM message router for both call and chat messages
  useFCMMessageRouter();

  // Cleanup pre-warming service on app unmount
  useEffect(() => {
    return () => {
      // Cleanup pre-warming service when app is unmounted
      try {
        import('./src/services/videosdk/VideoSDKPrewarmingService').then(({ VideoSDKPrewarmingService }) => {
          const prewarmingService = VideoSDKPrewarmingService.getInstance();
          prewarmingService.cleanup();
        }).catch(() => {
          // Ignore cleanup errors during app termination
        });
      } catch (error) {
        // Ignore cleanup errors during app termination
      }
    };
  }, []);

  // Initialize background call handler only (lightweight, non-blocking)
  useEffect(() => {
    // Only initialize the lightweight background call handler
    // CallKeep will be initialized later when user is in main app
    const initBackgroundHandler = () => {
      setTimeout(async () => {
        try {
          Logger.debug('App', '🔄 Starting lightweight background call handler initialization...');

          // Initialize background call handler first (lightweight)
          try {
            const { BackgroundCallHandler } = await import('./src/services/calling/BackgroundCallHandler');
            const handler = BackgroundCallHandler.getInstance();
            await handler.loadPendingCall();
            Logger.info('App', '✅ Background call handler initialized');
          } catch (handlerError) {
            Logger.warn('App', '⚠️ Background call handler initialization failed:', handlerError);
          }

          Logger.info('App', '✅ Background services initialization complete');
        } catch (error) {
          Logger.warn('App', '⚠️ Background services setup error (non-critical):', error);
        }
      }, 1000); // Reduced delay to 1 second for faster startup
    };

    // Start lightweight background initialization
    initBackgroundHandler();

  }, []);

  // Initialize AdMob SDK in background
  useEffect(() => {
    setTimeout(() => {
      mobileAds().initialize();
    }, 500);
  }, []);

  // Debug app state for blank screen issues - TEMPORARILY DISABLED
  useEffect(() => {
    Logger.debug('App', '⚠️ Debug utilities temporarily disabled to prevent blank screen');

    // TODO: Re-enable once the blank screen issue is resolved
    // const startDebugging = async () => {
    //   try {
    //     // Run initialization test first
    //     const { testAppInitialization } = await import('./src/utils/testAppInitialization');
    //     setTimeout(testAppInitialization, 1000);

    //     // Then start regular debugging
    //     const { debugAppState, startAppStateMonitoring } = await import('./src/utils/debugAppState');

    //     // Initial debug
    //     setTimeout(debugAppState, 3000);

    //     // Start monitoring if app seems stuck
    //     const stopMonitoring = startAppStateMonitoring();

    //     // Stop monitoring after 2 minutes
    //     setTimeout(stopMonitoring, 120000);
    //   } catch (error) {
    //     console.error('[App] Debug utility error:', error);
    //   }
    // };

    // startDebugging();
  }, []);

  // Initialize App Open Ad with aggressive showing
  const { adLoaded, showAd, forceLoadAd } = useAppOpenAd();
  
  // The AppOpenAdManager now handles showing ads aggressively:
  // - On app launch (after 1.5 second delay)
  // - When app comes to foreground from background
  // - With only 30-second cooldown between ads
  // - Automatically retries loading ads
  
  // Ensure ad is ready with throttling to prevent excessive calls
  useEffect(() => {
    // Only force load if we haven't loaded an ad in the last 2 minutes
    const lastForceLoad = Date.now() - ((global as any).lastAdForceLoad || 0);
    const FORCE_LOAD_COOLDOWN = 2 * 60 * 1000; // 2 minutes

    if (!adLoaded && lastForceLoad > FORCE_LOAD_COOLDOWN) {
      Logger.debug('App', 'Ensuring app open ad is loaded');
      (global as any).lastAdForceLoad = Date.now();
      forceLoadAd();
    }
  }, [adLoaded, forceLoadAd]);

  return (
    <AppErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <KeyboardAvoiderProvider>
            <ThemeProvider>
              <AuthProvider>
                <EnhancedQueryProvider>
                  <UserDataProvider>
                    <FCMChatProvider>
                      <WalletProvider>
                      <ContentCreatorPremiumProvider>
                        <DataProvider>
                        <ShortsProvider>
                          <TabNavigatorProvider>
                            <SidebarProvider>
                              <CallEndModalProvider>
                                <GestureHandlerRootView style={{ flex: 1 }}>
                                  <AppNavigator />
                                  <PersistentMeetingManager />
                              {/* REMOVE Sidebar from here since it's now in UltraFastLoader */}

                              {/* Ad Debugger - only shows in development */}
                              {/*<AdDebugger />*/}

                              {/* Force Update Modal - blocks entire app when force update is required */}
                              <ForceUpdateModal
                                visible={showForceUpdate}
                                updateInfo={updateInfo}
                              />

                              {/* Debug button for testing force updates (only in debug builds) */}
                              <ForceUpdateDebugButton />

                              {/* Theme test modal for debugging dark mode issues (only in debug builds) */}
                              <ThemeTestModal />

                              {/* CallKeep test buttons for triggering native UI (only in debug builds) */}
                              <CallKeepTestButtons />

                              {/* Debug buttons list for comprehensive testing (only in debug builds) */}
                              <DebugButtonsList />
                                </GestureHandlerRootView>
                              </CallEndModalProvider>
                            </SidebarProvider>
                          </TabNavigatorProvider>
                        </ShortsProvider>
                        </DataProvider>
                      </ContentCreatorPremiumProvider>
                    </WalletProvider>
                    </FCMChatProvider>
                  </UserDataProvider>
                </EnhancedQueryProvider>
              </AuthProvider>
            </ThemeProvider>
          </KeyboardAvoiderProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </AppErrorBoundary>
  );
}

// Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
    width: '100%',
    height: '100%',
  },
  appContentContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    width: '100%',
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  }
});

export default App;
