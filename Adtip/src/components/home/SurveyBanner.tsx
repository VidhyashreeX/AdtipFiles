/**
 * Survey Banner Component
 * 
 * Replaces the Rush Play Games banner with CPX Research survey integration.
 * Provides 4x earning potential for premium users through surveys.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BarChart3, Crown, Users } from 'lucide-react-native';
import CpxResearch from 'cpx-research-sdk-react-native';

// Contexts and hooks
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

// Configuration
import {
  createCPXConfig,
  createGuestCPXConfig,
  createCPXCallbacks,
  calculatePremiumReward,
  formatRewardAmount
} from '../../config/cpxResearchConfig';

// Services
import CPXRewardService from '../../services/CPXRewardService';

// Utils
import Logger from '../../utils/logger';

// Context
import { useCPXResearch, useCPXResearchSafe } from '../../contexts/CPXResearchContext';

interface SurveyBannerProps {
  isPremium: boolean;
  onUpgrade: () => void;
  onRewardEarned?: (amount: number, isPremium: boolean) => void;
  style?: any;
  renderCPXAtRoot?: boolean; // New prop to control where CPX Research is rendered
}

const SurveyBanner: React.FC<SurveyBannerProps> = ({
  isPremium,
  onUpgrade,
  onRewardEarned,
  style,
  renderCPXAtRoot = false
}) => {
  const { colors, isDarkMode } = useTheme();
  const { user, isGuest } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [surveyCount, setSurveyCount] = useState(0);

  // CPX Research refs for method binding (only used when not rendering at root)
  const markTransactionAsPaidRef = useRef<any>(null);
  const fetchSurveysAndTransactionsRef = useRef<any>(null);
  const openWebViewRef = useRef<any>(null);

  // Use CPX Research context when rendering at root level (safe hook)
  const cpxResearchContext = useCPXResearchSafe();

  // Create styles
  const styles = createSurveyBannerStyles(colors, isDarkMode);

  // Handle reward earned callback
  const handleRewardEarned = useCallback(async (amount: number, isPremiumUser: boolean) => {
    if (!user?.id) {
      Logger.error('SurveyBanner', 'No user ID available for reward processing');
      return;
    }

    try {
      // Process the reward through CPXRewardService
      const response = await CPXRewardService.processSurveyReward(
        user.id,
        `survey_${Date.now()}`, // Generate survey ID if not provided
        amount,
        isPremiumUser
      );

      if (response.success) {
        Alert.alert(
          '🎉 Survey Completed!',
          response.message || `You earned ${formatRewardAmount(amount)}${isPremiumUser ? ' (4x Premium Bonus!)' : ''}`,
          [{ text: 'Great!', style: 'default' }]
        );

        // Call the parent callback with the final amount
        const finalAmount = calculatePremiumReward(amount, isPremiumUser);
        onRewardEarned?.(finalAmount, isPremiumUser);
      } else {
        Alert.alert(
          'Reward Processing Failed',
          response.error || 'There was an issue processing your survey reward. Please try again.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      Logger.error('SurveyBanner', 'Error processing survey reward', error);
      Alert.alert(
        'Error',
        'Failed to process survey reward. Please contact support if this continues.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  }, [user?.id, onRewardEarned]);

  // CPX Research callbacks
  const cpxCallbacks = createCPXCallbacks(handleRewardEarned);

  // Enhanced callbacks with survey count tracking
  const onSurveysUpdate = useCallback((surveys: any[]) => {
    setSurveyCount(surveys?.length || 0);
    cpxCallbacks.onSurveysUpdate?.(surveys);
  }, [cpxCallbacks]);

  const onTransactionsUpdate = useCallback(async (transactions: any[]) => {
    Logger.info('SurveyBanner', 'CPX Research transactions updated', { count: transactions?.length || 0 });

    if (transactions && transactions.length > 0) {
      // Process new completed transactions
      for (const transaction of transactions) {
        if (transaction.status === 'completed' && transaction.amount > 0) {
          try {
            await handleRewardEarned(
              parseFloat(transaction.amount),
              isPremium
            );
          } catch (error) {
            Logger.error('SurveyBanner', 'Error processing transaction reward', error);
          }
        }
      }
    }

    cpxCallbacks.onTransactionsUpdate?.(transactions);
  }, [cpxCallbacks, handleRewardEarned, isPremium]);

  const onWebViewWasClosed = useCallback(() => {
    cpxCallbacks.onWebViewWasClosed?.();
    // Refresh surveys after closing webview
    fetchSurveysAndTransactionsRef.current?.();
  }, [cpxCallbacks]);

  // Handle banner press
  const handleBannerPress = useCallback(async () => {
    if (isGuest) {
      Alert.alert(
        'Login Required',
        'Please login to access surveys and earn rewards.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: onUpgrade }
        ]
      );
      return;
    }

    if (!user?.id) {
      Logger.error('SurveyBanner', 'No user ID available for survey access');
      return;
    }

    try {
      setIsLoading(true);

      // Debug: Check if references are available
      Logger.info('SurveyBanner', 'Opening surveys', {
        hasOpenWebView: !!openWebViewRef.current,
        hasFetchFunction: !!fetchSurveysAndTransactionsRef.current,
        userId: user.id,
        surveyCount
      });

      // Use context or direct refs depending on configuration
      if (renderCPXAtRoot && cpxResearchContext) {
        // Using root-level CPX Research component via context
        Logger.info('SurveyBanner', 'Opening survey via context');
        cpxResearchContext.fetchSurveysAndTransactions();
        await new Promise(resolve => setTimeout(resolve, 500));
        cpxResearchContext.openSurveyModal();
      } else {
        // Using local CPX Research component
        // Ensure surveys are loaded first
        if (fetchSurveysAndTransactionsRef.current) {
          fetchSurveysAndTransactionsRef.current();
          // Wait a bit for surveys to load
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Open CPX Research survey webview
        if (openWebViewRef.current) {
          Logger.info('SurveyBanner', 'Attempting to open CPX Research webview');
          try {
            // Call the webview open function (can optionally pass a surveyId)
            const result = openWebViewRef.current();
            Logger.info('SurveyBanner', 'WebView open result:', result);

            // If the webview doesn't open, show a fallback after a delay
            setTimeout(() => {
              Logger.info('SurveyBanner', 'Checking if webview opened successfully');
              // For now, show a temporary message that surveys are being loaded
              // This will be replaced once the webview issue is resolved
            }, 1000);

          } catch (webViewError) {
            Logger.error('SurveyBanner', 'Error calling openWebView:', webViewError);
            Alert.alert('Error', 'Failed to open survey interface. Please try again.');
          }
        } else {
          Logger.warn('SurveyBanner', 'CPX Research webview function not available');
          Alert.alert(
            'Surveys Loading',
            'The survey system is still initializing. Please try again in a few seconds.',
            [{ text: 'OK', style: 'default' }]
          );
        }
      }
    } catch (error) {
      Logger.error('SurveyBanner', 'Error opening surveys:', error);
      Alert.alert('Error', 'Failed to load surveys. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [isGuest, user?.id, onUpgrade, surveyCount]);

  // Fetch surveys on component mount
  useEffect(() => {
    if (!isGuest && user?.id && fetchSurveysAndTransactionsRef.current) {
      fetchSurveysAndTransactionsRef.current();
    }
  }, [isGuest, user?.id]);

  // Create CPX Research configuration
  const cpxConfig = isGuest 
    ? createGuestCPXConfig() 
    : createCPXConfig(user?.id || 0, isPremium, isDarkMode);

  // Determine banner content based on user state
  const getBannerContent = () => {
    if (isGuest) {
      return {
        title: 'Complete Surveys—Cash for Opinions!',
        description: 'Login to share your thoughts and get paid',
        buttonText: 'Login to Start',
        gradientColors: ['#6b48ff', '#5A67D8', '#4C51BF'], // App's secondary purple
        icon: Users,
      };
    }

    if (isPremium) {
      return {
        title: '💎 Complete Surveys—Cash for Opinions!',
        description: 'Share your thoughts and get paid\nEarn rewards with every survey',
        buttonText: 'Earn 4x Now!',
        gradientColors: ['#FFD700', '#FFA500', '#FF8C00'], // Gold gradient for premium
        icon: Crown,
      };
    }

    return {
      title: 'Complete Surveys—Cash for Opinions!',
      description: 'Share your thoughts and get paid\nEarn rewards with every survey',
      buttonText: 'Start Survey',
      gradientColors: ['#667eea', '#764ba2'], // Elegant purple gradient
      icon: BarChart3,
    };
  };

  const bannerContent = getBannerContent();
  const IconComponent = bannerContent.icon;

  return (
    <View style={[styles.container, style]}>
      {/* CPX Research SDK Component - Only render if not at root level */}
      {!renderCPXAtRoot && (
        <View style={styles.cpxContainer}>
          <CpxResearch
            {...cpxConfig}
            onSurveysUpdate={onSurveysUpdate}
            onTransactionsUpdate={onTransactionsUpdate}
            onWebViewWasClosed={onWebViewWasClosed}
            bindMarkTransactionAsPaid={(fn: any) => {
              markTransactionAsPaidRef.current = fn;
              Logger.info('SurveyBanner', 'bindMarkTransactionAsPaid called');
            }}
            bindFetchSurveysAndTransactions={(fn: any) => {
              fetchSurveysAndTransactionsRef.current = fn;
              Logger.info('SurveyBanner', 'bindFetchSurveysAndTransactions called');
            }}
            bindOpenWebView={(fn: any) => {
              openWebViewRef.current = fn;
              Logger.info('SurveyBanner', 'bindOpenWebView called');
            }}
          />
        </View>
      )}

      {/* Survey Banner UI */}
      <TouchableOpacity
        style={styles.bannerItem}
        onPress={handleBannerPress}
        activeOpacity={0.9}
        disabled={isLoading}
      >
        <LinearGradient
          colors={bannerContent.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{bannerContent.title}</Text>
              <Text style={styles.description}>{bannerContent.description}</Text>
            </View>
            <View style={styles.iconContainer}>
              <IconComponent size={32} color="#FFFFFF" />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

// Styles
const createSurveyBannerStyles = (_colors: any, _isDarkMode: boolean) => StyleSheet.create({
  container: {
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  cpxContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Don't move off-screen as it prevents the webview modal from displaying properly
    // The CPX Research component manages its own visibility
  },
  rootCpxContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999, // Ensure it's above everything for full-screen modal
    pointerEvents: 'box-none', // Allow touches to pass through when not showing modal
  },
  bannerItem: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  gradient: {
    padding: 16,
    minHeight: 100,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  rewardBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  rewardText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Separate CPX Research component for root-level rendering
export const CPXResearchProvider: React.FC<{
  isPremium: boolean;
  onRewardEarned?: (amount: number, isPremium: boolean) => void;
}> = ({ isPremium, onRewardEarned }) => {
  const { isDarkMode } = useTheme();
  const { user, isGuest } = useAuth();
  const [_surveyCount, setSurveyCount] = useState(0);

  // Use CPX Research context for binding
  const cpxResearchContext = useCPXResearch();

  // Handle reward earned
  const handleRewardEarned = useCallback(async (amount: number, isPremium: boolean) => {
    try {
      Logger.info('CPXResearchProvider', 'Processing survey reward', { amount, isPremium });

      if (!user?.id) {
        Logger.error('CPXResearchProvider', 'No user ID available for reward processing');
        return;
      }

      // Process the reward through CPXRewardService
      const result = await CPXRewardService.processSurveyReward(
        user.id,
        `survey_${Date.now()}`,
        amount,
        isPremium
      );

      if (result.success) {
        Logger.info('CPXResearchProvider', 'Survey reward processed successfully', result);
        onRewardEarned?.(amount, isPremium);
      } else {
        Logger.error('CPXResearchProvider', 'Failed to process survey reward', result.error);
      }
    } catch (error) {
      Logger.error('CPXResearchProvider', 'Error processing survey reward', error);
    }
  }, [user?.id, onRewardEarned]);

  // CPX Research callbacks
  const cpxCallbacks = createCPXCallbacks(handleRewardEarned);

  // Enhanced callbacks with survey count tracking
  const onSurveysUpdate = useCallback((surveys: any[]) => {
    setSurveyCount(surveys?.length || 0);
    cpxCallbacks.onSurveysUpdate?.(surveys);
  }, [cpxCallbacks]);

  const onTransactionsUpdate = useCallback((transactions: any[]) => {
    cpxCallbacks.onTransactionsUpdate?.(transactions);
  }, [cpxCallbacks]);

  const onWebViewWasClosed = useCallback(() => {
    cpxCallbacks.onWebViewWasClosed?.();
    // Refresh surveys after closing webview
    cpxResearchContext.fetchSurveysAndTransactions();
  }, [cpxCallbacks, cpxResearchContext]);

  // Create CPX Research configuration
  const cpxConfig = isGuest
    ? createGuestCPXConfig()
    : createCPXConfig(user?.id || 0, isPremium, isDarkMode);

  // Fetch surveys on component mount
  useEffect(() => {
    if (!isGuest && user?.id) {
      cpxResearchContext.fetchSurveysAndTransactions();
    }
  }, [isGuest, user?.id, cpxResearchContext]);

  if (isGuest) {
    return null; // Don't render for guest users
  }

  const rootStyles = createSurveyBannerStyles({}, false);

  return (
    <View style={[rootStyles.rootCpxContainer, { pointerEvents: 'box-none' }]}>
      <CpxResearch
        {...cpxConfig}
        onSurveysUpdate={onSurveysUpdate}
        onTransactionsUpdate={onTransactionsUpdate}
        onWebViewWasClosed={onWebViewWasClosed}
        bindMarkTransactionAsPaid={(fn: any) => {
          cpxResearchContext.bindMarkTransactionAsPaid(fn);
        }}
        bindFetchSurveysAndTransactions={(fn: any) => {
          cpxResearchContext.bindFetchSurveysAndTransactions(fn);
        }}
        bindOpenWebView={(fn: any) => {
          cpxResearchContext.bindOpenWebView(fn);
        }}
      />
    </View>
  );
};

export default SurveyBanner;
