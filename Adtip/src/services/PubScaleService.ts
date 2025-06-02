// src/services/PubScaleService.ts
import { NativeModules, Platform, NativeEventEmitter, EmitterSubscription, NetInfo } from 'react-native';
import { PUBSCALE_APP_ID } from '../constants/api';
import PubScaleFallbackService from './PubScaleFallbackService';
import AnalyticsService from './AnalyticsService';

// Check if the module is available
const isNativeModuleAvailable = NativeModules.PubscaleOfferwall !== undefined;

// Log whether the module is available for debugging
console.log(`[PubScaleService] Native module available: ${isNativeModuleAvailable}`);

// Use the native module if available, otherwise use dummy implementations
const PubscaleOfferwall = isNativeModuleAvailable ? NativeModules.PubscaleOfferwall : {
  init: (_appId: string, onSuccess: Function) => {
    console.log('[PubScaleService] Using fallback implementation');
    // Call success immediately since we're using a fallback
    onSuccess();
  },
  launch: (onClose: Function) => {
    console.log('[PubScaleService] Using fallback implementation for launch');
    // Call close immediately since we're using a fallback
    onClose();
  },
  setUserId: () => {}
};

// Event emitter for reward callbacks
const pubscaleEventEmitter = new NativeEventEmitter(PubscaleOfferwall);

interface PubScaleReward {
  amount: number;
  currency: string;
}

class PubScaleService {
  private rewardListener: ((reward: PubScaleReward) => void) | null = null;
  private isInitialized: boolean = false;
  private userId: string | null = null;
  private rewardSubscription: EmitterSubscription | null = null;  /**
   * Initialize the PubScale SDK
   * @param userId User ID for tracking rewards
   * @returns Promise that resolves when initialization is complete
   */  initialize(userId: string): Promise<void> {
    if (this.isInitialized && this.userId === userId) {
      console.log('PubScale SDK already initialized with this user ID');
      
      // Track initialization status
      AnalyticsService.trackOfferwallEvent('sdk_initialized', {
        status: 'already_initialized',
        userId
      });
      
      return Promise.resolve();
    }

    this.userId = userId;
    
    // Track initialization attempt
    AnalyticsService.trackOfferwallEvent('sdk_initialization_start', {
      userId
    });

    // Clean up any existing subscription
    if (this.rewardSubscription) {
      this.rewardSubscription.remove();
    }

  // Setup reward listener
    this.rewardSubscription = pubscaleEventEmitter.addListener('onReward', (reward) => {
      console.log('Reward received:', reward);
      
      // Track reward received
      AnalyticsService.trackOfferwallEvent('reward_received', {
        userId: this.userId || 'anonymous_user',
        amount: reward.amount,
        currency: reward.currency,
        timestamp: Date.now()
      });
      
      if (this.rewardListener) {
        this.rewardListener(reward);
      }
    });

    return new Promise((resolve, reject) => {
      if (Platform.OS === 'android') {
        try {
          // Initialize Android SDK
          PubscaleOfferwall.init(PUBSCALE_APP_ID,            () => {
              // Success callback
              this.isInitialized = true;
              
              // Set the user ID after initialization
              if (userId) {
                try {
                  PubscaleOfferwall.setUserId(userId);
                  
                  // Track user ID set success
                  AnalyticsService.trackOfferwallEvent('user_id_set', {
                    userId,
                    success: true
                  });
                } catch (err) {
                  console.error('Error setting user ID:', err);
                  // Track user ID set error
                  AnalyticsService.trackOfferwallEvent('user_id_set', {
                    userId,
                    success: false,
                    error: err.message || 'Unknown error'
                  });
                  // Don't reject, just log the error
                }
              }
              
              // Track successful initialization
              AnalyticsService.trackOfferwallEvent('sdk_initialized', {
                status: 'success',
                userId
              });
              
              resolve();
            },            (error: string) => {
              // Error callback
              if (error) {
                console.error('Failed to initialize PubScale SDK:', error);
                
                // Track initialization error
                AnalyticsService.trackOfferwallEvent('sdk_initialization_error', {
                  userId,
                  error
                });
                
                reject(new Error(error));
              } else {
                // If error is null or undefined, treat it as success
                this.isInitialized = true;
                
                // Track successful initialization
                AnalyticsService.trackOfferwallEvent('sdk_initialized', {
                  status: 'success_from_error_callback',
                  userId
                });
                
                resolve();
              }
            }
          );        } catch (err) {
          console.error('Exception initializing PubScale:', err);
          
          // Track initialization exception
          AnalyticsService.trackOfferwallEvent('sdk_initialization_exception', {
            userId,
            error: err.message || 'Unknown error'
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
  }  /**
   * Show the PubScale offerwall
   * @returns Promise that resolves when the offerwall is closed
   */  showOfferwall(): Promise<void> {
    // Track offerwall show attempt
    AnalyticsService.trackOfferwallEvent('show_attempt', {
      userId: this.userId || 'anonymous_user',
      isInitialized: this.isInitialized
    });
    
    if (!this.isInitialized) {
      return this.initialize(this.userId || 'anonymous_user')
        .then(() => this.showOfferwallInternal())
        .catch((err) => {
          console.error('Failed to initialize before showing offerwall:', err);
          
          // Track initialization error during show attempt
          AnalyticsService.trackOfferwallEvent('show_init_error', {
            userId: this.userId || 'anonymous_user',
            error: err.message || 'Unknown error'
          });
          
          throw err;
        });
    }
    
    return this.showOfferwallInternal();
  }
  
  /**
   * Internal method to show the offerwall after initialization
   */  private showOfferwallInternal(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (Platform.OS === 'android') {
        try {
          // Check for network connectivity first
          this.checkNetworkConnectivity()
            .then(isConnected => {
              if (!isConnected) {
                // Track network error
                AnalyticsService.trackOfferwallEvent('network_error', {
                  userId: this.userId || 'anonymous_user'
                });
                
                reject(new Error('No network connection available. Please connect to the internet and try again.'));
                return;
              }
              
              // Track offerwall launch
              AnalyticsService.trackOfferwallEvent('launch', {
                userId: this.userId || 'anonymous_user',
                timestamp: Date.now()
              });
              
              // Launch the offerwall
              PubscaleOfferwall.launch(
                () => {
                  // On close callback - this happens immediately in our implementation
                  // since the PubScale SDK doesn't provide a close callback
                  console.log('Offerwall closed or launched successfully');
                  
                  // Track offerwall close
                  AnalyticsService.trackOfferwallEvent('close', {
                    userId: this.userId || 'anonymous_user',
                    timestamp: Date.now()
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
                      error
                    });
                    
                    reject(new Error(error));
                  } else {
                    // If there's no error message, consider it a success
                    
                    // Track successful launch
                    AnalyticsService.trackOfferwallEvent('launch_success', {
                      userId: this.userId || 'anonymous_user'
                    });
                    
                    resolve();
                  }
                }
              );
            })
            .catch(err => {
              // Handle network check error
              console.error('Error checking network state:', err);
              
              // Try to launch anyway
              PubscaleOfferwall.launch(
                () => resolve(),
                (error: string) => {
                  if (error) {
                    reject(new Error(error));
                  } else {
                    resolve();
                  }
                }
              );
            });        } catch (err) {
          console.error('Exception showing PubScale offerwall:', err);
          
          // Track exception
          AnalyticsService.trackOfferwallEvent('launch_exception', {
            userId: this.userId || 'anonymous_user',
            error: err.message || 'Unknown error'
          });
          
          reject(err);
        }
      } else {
        // Track unsupported platform attempt
        AnalyticsService.trackOfferwallEvent('unsupported_platform', {
          userId: this.userId || 'anonymous_user',
          platform: Platform.OS
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
      // Check if NetInfo is available (it's a separate package in newer versions of React Native)
      if (NetInfo && typeof NetInfo.fetch === 'function') {
        const netInfo = await NetInfo.fetch();
        return netInfo.isConnected || false;
      }
      
      // Fallback to assuming connectivity is available
      return true;
    } catch (err) {
      console.warn('Error checking network connectivity:', err);
      // Assume connectivity is available if we can't check
      return true;
    }
  }
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
