// src/services/PubScaleService.ts
import {
  NativeModules,
  Platform,
  NativeEventEmitter,
  EmitterSubscription,
} from 'react-native';
import {PUBSCALE_APP_ID} from '../constants/api';
import AnalyticsService from './AnalyticsService';

// Lazy getter for native module to avoid runtime errors
let _pubscaleOfferwall: any = null;
let _isNativeModuleAvailable: boolean | null = null;
let _pubscaleEventEmitter: any = null;

const getPubscaleOfferwall = () => {
  if (_pubscaleOfferwall !== null) {
    return _pubscaleOfferwall;
  }

  try {
    // Check if React Native runtime is ready and NativeModules is available
    if (typeof NativeModules === 'undefined' || !NativeModules) {
      console.log(
        '[PubScaleService] NativeModules not available, using fallback',
      );
      _isNativeModuleAvailable = false;
    } else {
      _isNativeModuleAvailable = NativeModules.PubscaleOfferwall !== undefined;
      console.log(
        `[PubScaleService] Native module available: ${_isNativeModuleAvailable}`,
      );
    }
  } catch (error) {
    console.log(
      '[PubScaleService] Error checking native module, using fallback:',
      error,
    );
    _isNativeModuleAvailable = false;
  }
  // Use the native module if available, otherwise use dummy implementations
  _pubscaleOfferwall = _isNativeModuleAvailable
    ? NativeModules.PubscaleOfferwall
    : {
        init: (_appId: string, onSuccess: () => void) => {
          console.log('[PubScaleService] Using fallback implementation');
          // Call success immediately since we're using a fallback
          setTimeout(onSuccess, 100);
        },
        launch: (onClose: () => void) => {
          console.log(
            '[PubScaleService] Using fallback implementation for launch',
          );
          // Call close immediately since we're using a fallback
          setTimeout(onClose, 100);
        },
        setUserId: () => {},
      };

  return _pubscaleOfferwall;
};

const getPubscaleEventEmitter = () => {
  if (_pubscaleEventEmitter !== null) {
    return _pubscaleEventEmitter;
  }

  try {
    const pubscaleOfferwall = getPubscaleOfferwall();
    _pubscaleEventEmitter = new NativeEventEmitter(pubscaleOfferwall);
  } catch (error) {
    console.log(
      '[PubScaleService] Error creating event emitter, using dummy:',
      error,
    );
    // Create a dummy event emitter that doesn't do anything
    _pubscaleEventEmitter = {
      addListener: () => ({remove: () => {}}),
      removeAllListeners: () => {},
      removeSubscription: () => {},
    };
  }

  return _pubscaleEventEmitter;
};

interface PubScaleReward {
  amount: number;
  currency: string;
}

class PubScaleService {
  private rewardListener: ((reward: PubScaleReward) => void) | null = null;
  private isInitialized: boolean = false;
  private userId: string | null = null;
  private rewardSubscription: EmitterSubscription | null = null;
  /**
   * Initialize the PubScale SDK
   * @param userId User ID for tracking rewards
   * @returns Promise that resolves when initialization is complete
   */ initialize(userId: string): Promise<void> {
    if (this.isInitialized && this.userId === userId) {
      console.log('PubScale SDK already initialized with this user ID');

      // Track initialization status
      AnalyticsService.trackOfferwallEvent('sdk_initialized', {
        status: 'already_initialized',
        userId,
      });

      return Promise.resolve();
    }

    this.userId = userId;

    // Track initialization attempt
    AnalyticsService.trackOfferwallEvent('sdk_initialization_start', {
      userId,
    });

    // Clean up any existing subscription
    if (this.rewardSubscription) {
      this.rewardSubscription.remove();
    } // Setup reward listener
    this.rewardSubscription = getPubscaleEventEmitter().addListener(
      'onReward',
      (reward: any) => {
        console.log('Reward received:', reward);

        // Track reward received
        AnalyticsService.trackOfferwallEvent('reward_received', {
          userId: this.userId || 'anonymous_user',
          amount: reward.amount,
          currency: reward.currency,
          timestamp: Date.now(),
        });

        if (this.rewardListener) {
          this.rewardListener(reward);
        }
      },
    );

    return new Promise((resolve, reject) => {
      if (Platform.OS === 'android') {
        try {
          // Initialize Android SDK
          getPubscaleOfferwall().init(
            PUBSCALE_APP_ID,
            () => {
              // Success callback
              this.isInitialized = true;

              // Set the user ID after initialization
              if (userId) {
                try {
                  getPubscaleOfferwall().setUserId(userId);

                  // Track user ID set success
                  AnalyticsService.trackOfferwallEvent('user_id_set', {
                    userId,
                    success: true,
                  });
                } catch (err) {
                  console.error('Error setting user ID:', err);
                  // Track user ID set error
                  AnalyticsService.trackOfferwallEvent('user_id_set', {
                    userId,
                    success: false,
                    error: err instanceof Error ? err.message : 'Unknown error',
                  });
                  // Don't reject, just log the error
                }
              }

              // Track successful initialization
              AnalyticsService.trackOfferwallEvent('sdk_initialized', {
                status: 'success',
                userId,
              });

              resolve();
            },
            (error: string) => {
              // Error callback
              if (error) {
                console.error('Failed to initialize PubScale SDK:', error);

                // Track initialization error
                AnalyticsService.trackOfferwallEvent(
                  'sdk_initialization_error',
                  {
                    userId,
                    error,
                  },
                );

                reject(new Error(error));
              } else {
                // If error is null or undefined, treat it as success
                this.isInitialized = true;

                // Track successful initialization
                AnalyticsService.trackOfferwallEvent('sdk_initialized', {
                  status: 'success_from_error_callback',
                  userId,
                });

                resolve();
              }
            },
          );
        } catch (err) {
          console.error('Exception initializing PubScale:', err);

          // Track initialization exception
          AnalyticsService.trackOfferwallEvent('sdk_initialization_exception', {
            userId,
            error: err instanceof Error ? err.message : 'Unknown error',
          });

          reject(err);
        }
      } else if (Platform.OS === 'ios') {
        // Initialize iOS SDK (add similar implementation when iOS SDK is available)
        console.warn('PubScale SDK not implemented for iOS yet');
        reject(new Error('PubScale SDK not implemented for iOS yet'));
      } else {
        reject(new Error(`Unsupported platform: ${Platform.OS}`));
      }
    });
  }
  /**
   * Show the PubScale offerwall
   * @returns Promise that resolves when the offerwall is closed
   */ showOfferwall(): Promise<void> {
    // Track offerwall show attempt
    AnalyticsService.trackOfferwallEvent('show_attempt', {
      userId: this.userId || 'anonymous_user',
      isInitialized: this.isInitialized,
    });

    if (!this.isInitialized) {
      return this.initialize(this.userId || 'anonymous_user')
        .then(() => this.showOfferwallInternal())
        .catch(err => {
          console.error('Failed to initialize before showing offerwall:', err);

          // Track initialization error during show attempt
          AnalyticsService.trackOfferwallEvent('show_init_error', {
            userId: this.userId || 'anonymous_user',
            error: err instanceof Error ? err.message : 'Unknown error',
          });

          throw err;
        });
    }

    return this.showOfferwallInternal();
  }

  /**
   * Internal method to show the offerwall after initialization
   */ private showOfferwallInternal(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (Platform.OS === 'android') {
        try {
          // Check for network connectivity first
          this.checkNetworkConnectivity()
            .then(isConnected => {
              if (!isConnected) {
                // Track network error
                AnalyticsService.trackOfferwallEvent('network_error', {
                  userId: this.userId || 'anonymous_user',
                });

                reject(
                  new Error(
                    'No network connection available. Please connect to the internet and try again.',
                  ),
                );
                return;
              }
              // Track offerwall launch
              AnalyticsService.trackOfferwallEvent('launch', {
                userId: this.userId || 'anonymous_user',
                timestamp: Date.now(),
              });

              // Launch the offerwall
              getPubscaleOfferwall().launch(
                () => {
                  // On close callback - this happens immediately in our implementation
                  // since the PubScale SDK doesn't provide a close callback
                  console.log('Offerwall closed or launched successfully');

                  // Track offerwall close
                  AnalyticsService.trackOfferwallEvent('close', {
                    userId: this.userId || 'anonymous_user',
                    timestamp: Date.now(),
                  });

                  resolve();
                },
                (error: string) => {
                  // Error callback
                  if (error) {
                    console.error('Failed to show PubScale offerwall:', error);

                    // Track launch error
                    AnalyticsService.trackOfferwallEvent('launch_error', {
                      userId: this.userId || 'anonymous_user',
                      error,
                    });

                    reject(new Error(error));
                  } else {
                    // If there's no error message, consider it a success

                    // Track successful launch
                    AnalyticsService.trackOfferwallEvent('launch_success', {
                      userId: this.userId || 'anonymous_user',
                    });

                    resolve();
                  }
                },
              );
            })
            .catch(err => {
              // Handle network check error
              console.error('Error checking network state:', err);

              // Try to launch anyway
              getPubscaleOfferwall().launch(
                () => resolve(),
                (error: string) => {
                  if (error) {
                    reject(new Error(error));
                  } else {
                    resolve();
                  }
                },
              );
            });
        } catch (err) {
          console.error('Exception showing PubScale offerwall:', err);
          // Track exception
          AnalyticsService.trackOfferwallEvent('launch_exception', {
            userId: this.userId || 'anonymous_user',
            error: err instanceof Error ? err.message : 'Unknown error',
          });

          reject(err);
        }
      } else {
        // Track unsupported platform attempt
        AnalyticsService.trackOfferwallEvent('unsupported_platform', {
          userId: this.userId || 'anonymous_user',
          platform: Platform.OS,
        });

        reject(new Error(`PubScale offerwall not supported on ${Platform.OS}`));
      }
    });
  }

  /**
   * Helper method to check if network is available
   * @returns Promise that resolves to boolean indicating if network is connected
   */
  private async checkNetworkConnectivity(): Promise<boolean> {
    try {
      // Commented out PubScale integration - June 2, 2025
      // if (NetInfo && typeof NetInfo.fetch === 'function') {
      //   const netInfo = await NetInfo.fetch();
      //   return netInfo.isConnected || false;
      // }
      // Fallback to assuming connectivity is available
    } catch (err) {
      console.warn('Error checking network connectivity:', err);
      // Assume connectivity is available if we can't check
    }
    return true;
  }

  /**
   * Set a listener for reward events
   * @param callback Function to call when a reward is received
   */
  setRewardListener(callback: (reward: PubScaleReward) => void): void {
    this.rewardListener = callback;
  }

  /**
   * Remove the reward listener
   */
  removeRewardListener(): void {
    this.rewardListener = null;

    if (this.rewardSubscription) {
      this.rewardSubscription.remove();
      this.rewardSubscription = null;
    }
  }
}

export default new PubScaleService();
