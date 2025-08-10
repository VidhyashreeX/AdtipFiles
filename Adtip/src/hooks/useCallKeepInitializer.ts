import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Platform } from 'react-native';

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

              // Check if CallKeep is available first
              let RNCallKeep: any = null;
              try {
                RNCallKeep = require('react-native-callkeep').default;
              } catch (importError) {
                console.log('[useCallKeepInitializer] 📱 CallKeep library not available, skipping initialization');
                return;
              }

              if (!RNCallKeep) {
                console.log('[useCallKeepInitializer] 📱 CallKeep not available, using custom call UI');
                return;
              }

              // Simple CallKeep setup following react-native-callkeep guidelines
              const options = {
                ios: {
                  appName: 'Adtip',
                  supportsVideo: true,
                  maximumCallGroups: '1',
                  maximumCallsPerCallGroup: '1',
                  includesCallsInRecents: true,
                },
                android: {
                  alertTitle: 'Permissions required',
                  alertDescription: 'This application needs to access your phone accounts to make calls',
                  cancelButton: 'Cancel',
                  okButton: 'OK',
                  imageName: 'phone_account_icon',
                  additionalPermissions: [],
                  // Don't use self-managed for better compatibility
                  selfManaged: false,
                  foregroundService: {
                    channelId: 'com.adtip.calling',
                    channelName: 'Adtip Calling Service',
                    notificationTitle: 'Adtip is handling a call',
                    notificationIcon: 'ic_launcher'
                  }
                }
              };

              // Initialize CallKeep
              await RNCallKeep.setup(options);
              console.log('[useCallKeepInitializer] ✅ CallKeep setup completed');

              // For Android, register phone account (this is required for CallKeep to work)
              if (Platform.OS === 'android') {
                try {
                  // Register phone account
                  await RNCallKeep.registerPhoneAccount(options);
                  console.log('[useCallKeepInitializer] 📱 Phone account registered');

                  // Check if we have permissions
                  const hasPhoneAccount = await RNCallKeep.hasPhoneAccount();
                  if (hasPhoneAccount) {
                    console.log('[useCallKeepInitializer] ✅ Phone account permissions granted');
                    // Set CallKeep as available
                    await RNCallKeep.setAvailable(true);
                  } else {
                    console.log('[useCallKeepInitializer] 📱 Phone account not enabled - user must enable in Settings');
                    console.log('[useCallKeepInitializer] 💡 Path: Settings > Apps > Adtip > Phone Account > Enable');
                  }
                } catch (permissionError) {
                  console.log('[useCallKeepInitializer] 📱 Phone account setup failed (expected):', permissionError);
                  console.log('[useCallKeepInitializer] 💡 User must manually enable phone account in Android Settings');
                }
              }

              // Setup basic event listeners for CallKeep
              try {
                RNCallKeep.addEventListener('answerCall', ({ callUUID }: { callUUID: string }) => {
                  console.log('[CallKeep] Answer call:', callUUID);
                  // This will be handled by CallKeepService
                });

                RNCallKeep.addEventListener('endCall', ({ callUUID }: { callUUID: string }) => {
                  console.log('[CallKeep] End call:', callUUID);
                  // This will be handled by CallKeepService
                });

                RNCallKeep.addEventListener('didPerformDTMFAction', ({ callUUID, digits }: { callUUID: string, digits: string }) => {
                  console.log('[CallKeep] DTMF action:', callUUID, digits);
                });

                console.log('[useCallKeepInitializer] ✅ CallKeep event listeners registered');
              } catch (listenerError) {
                console.log('[useCallKeepInitializer] ⚠️ Failed to setup event listeners:', listenerError);
              }

              console.log('[useCallKeepInitializer] ✅ CallKeep initialization completed successfully');

            } catch (error) {
              console.log('[useCallKeepInitializer] 📱 CallKeep initialization failed (non-critical):', error);
              console.log('[useCallKeepInitializer] ✅ App will use custom call UI instead');
            }
          }, 5000); // Increased delay to 5 seconds to ensure UI is fully stable
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
