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

interface SurveyBannerProps {
  isPremium: boolean;
  onUpgrade: () => void;
  onRewardEarned?: (amount: number, isPremium: boolean) => void;
  style?: any;
}

const SurveyBanner: React.FC<SurveyBannerProps> = ({ 
  isPremium, 
  onUpgrade, 
  onRewardEarned,
  style 
}) => {
  const { colors, isDarkMode } = useTheme();
  const { user, isGuest } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [surveyCount, setSurveyCount] = useState(0);
  
  // CPX Research refs for method binding
  const markTransactionAsPaidRef = useRef<any>();
  const fetchSurveysAndTransactionsRef = useRef<any>();
  const openWebViewRef = useRef<any>();

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
        title: '📊 Surveys Available',
        description: 'Login to complete surveys and earn rewards!',
        buttonText: 'Login to Start',
        gradientColors: ['#6b48ff', '#5A67D8', '#4C51BF'], // App's secondary purple
        icon: Users,
      };
    }

    if (isPremium) {
      return {
        title: '💎 Premium Surveys',
        description: `Earn 4x more! ${surveyCount > 0 ? `${surveyCount} surveys available` : 'Loading surveys...'}`,
        buttonText: 'Earn 4x Now!',
        gradientColors: ['#FFD700', '#FFA500', '#FF8C00'], // Gold gradient for premium
        icon: Crown,
      };
    }

    return {
      title: '📊 Complete Surveys',
      description: `Earn rewards! ${surveyCount > 0 ? `${surveyCount} surveys available` : 'Loading surveys...'}`,
      buttonText: 'Start Survey',
      gradientColors: ['#24d05a', '#00C853', '#1B5E20'], // App's green gradient
      icon: BarChart3,
    };
  };

  const bannerContent = getBannerContent();
  const IconComponent = bannerContent.icon;

  return (
    <View style={[styles.container, style]}>
      {/* CPX Research SDK Component - Now with visible corner widget */}
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
              <LinearGradient
                colors={['#FFFFFF', '#F0F0F0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.rewardBadge}
              >
                <Text style={styles.rewardText}>
                  {isLoading ? 'Loading...' : bannerContent.buttonText}
                </Text>
              </LinearGradient>
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
    zIndex: 1000, // Put it on top so the corner widget is clickable
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

export default SurveyBanner;
