/**
 * AdViewScreen
 * 
 * Full-screen ad viewing experience with player, progress tracking,
 * and completion flow. Handles all ad types including website visits and quizzes.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Text,
  BackHandler,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AdPlayer, WebsiteVisitModal, QuizModal } from '../../components/ads';
import { useAdViewer } from '../../hooks';
import { AdModelType, getAdModelType } from '../../types/ads';
import type { MainNavigatorParamList } from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<MainNavigatorParamList>;
type RouteParamsProp = RouteProp<MainNavigatorParamList, 'AdView'>;

const AdViewScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParamsProp>();
  const { userId, adId } = route.params;

  const {
    session,
    adData,
    isPlaying,
    watchTime,
    error,
    canSkip,
    skipTimeReached,
    completionPercentage,
    isComplete,
    startAd,
    pauseAd,
    resumeAd,
    skipAd,
    completeAd,
    trackWebsiteVisit,
    submitQuizAnswer,
    reset,
  } = useAdViewer();

  const [showWebsiteModal, setShowWebsiteModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [websiteVisitStartTime, setWebsiteVisitStartTime] = useState(0);

  // Start ad on mount
  useEffect(() => {
    if (userId && adId) {
      startAd(userId, adId);
    }

    return () => {
      reset();
    };
  }, [userId, adId]);

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackPress();
      return true;
    });

    return () => backHandler.remove();
  }, [isComplete, completionPercentage]);

  // Check if ad is complete and show appropriate modal
  useEffect(() => {
    if (isComplete && adData) {
      const adType = adData.ad_model_type;

      // Show website visit modal for brand awareness ads
      if (adType === 'BRAND_AWARENESS' && adData.company_web_url) {
        setShowWebsiteModal(true);
      }
      // Show quiz modal for quiz ads (if quiz data exists)
      else if ((adType === 'BRAND_AWARENESS_QUESTION' || adType === 'NON_SKIP_QUESTION') && adData.question) {
        setShowQuizModal(true);
      }
    }
  }, [isComplete, adData]);

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseAd();
    } else {
      resumeAd();
    }
  };

  const handleSkip = async () => {
    Alert.alert(
      'Skip Ad',
      'Are you sure you want to skip this ad? You will receive partial rewards.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: async () => {
            try {
              await skipAd();
              navigation.goBack();
            } catch (err) {
              console.error('Skip failed:', err);
            }
          },
        },
      ]
    );
  };

  const handleComplete = async () => {
    try {
      await completeAd();
      
      // Show success message
      const payout = adData?.view_price || 0;
      Alert.alert(
        'Congratulations! 🎉',
        `You earned ₹${payout.toFixed(2)}!`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err) {
      console.error('Complete failed:', err);
      Alert.alert('Error', 'Failed to complete ad. Please try again.');
    }
  };

  const handleWebsiteVisitOpen = () => {
    setWebsiteVisitStartTime(Date.now());
    trackWebsiteVisit('visit_start');
  };

  const handleWebsiteVisitComplete = async (duration: number) => {
    await trackWebsiteVisit('visit_end', duration);
    setShowWebsiteModal(false);
    
    // Show completion alert
    Alert.alert(
      'Bonus Earned! 🌟',
      'You earned the website visit bonus!',
      [
        {
          text: 'Continue',
          onPress: handleComplete,
        },
      ]
    );
  };

  const handleWebsiteVisitClose = () => {
    const duration = Math.floor((Date.now() - websiteVisitStartTime) / 1000);
    trackWebsiteVisit('visit_end', duration);
    setShowWebsiteModal(false);
    
    // Still allow completion without bonus
    handleComplete();
  };

  const handleQuizSubmit = async (answer: string): Promise<{ correct: boolean; earned?: number }> => {
    try {
      await submitQuizAnswer(answer);
      // Check if answer is correct
      const correct = answer === adData?.question_answer;
      return { correct, earned: correct ? 2.0 : 0 };
    } catch (err) {
      console.error('Quiz submission error:', err);
      throw err;
    }
  };

  const handleQuizClose = () => {
    setShowQuizModal(false);
    handleComplete();
  };

  const handleBackPress = () => {
    if (isComplete) {
      navigation.goBack();
      return;
    }

    Alert.alert(
      'Exit Ad',
      'Are you sure you want to exit? Your progress will not be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Error State */}
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Failed to Load Ad</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => startAd(userId, adId)}
            activeOpacity={0.8}
          >
            <Icon name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!session || !adData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading ad...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Watch to Earn</Text>
        
        <View style={styles.backButtonPlaceholder} />
      </View>

      {/* Ad Player */}
      <AdPlayer
        adData={adData}
        watchTime={watchTime}
        isPlaying={isPlaying}
        canSkip={canSkip}
        skipTimeReached={skipTimeReached}
        completionPercentage={completionPercentage}
        requiredWatchTime={session?.requiredWatchTime || 0}
        onPlayPause={handlePlayPause}
        onSkip={handleSkip}
        onComplete={
          adData.company_web_url || adData.question
            ? undefined // Modal will handle completion
            : handleComplete
        }
      />

      {/* Website Visit Modal */}
      {adData.company_web_url && (
        <WebsiteVisitModal
          visible={showWebsiteModal}
          websiteUrl={adData.company_web_url}
          requiredDuration={30}
          onComplete={handleWebsiteVisitComplete}
          onClose={handleWebsiteVisitClose}
        />
      )}

      {/* Quiz Modal */}
      {adData.question && (
        <QuizModal
          visible={showQuizModal}
          question={adData.question}
          options={['Option A', 'Option B', 'Option C', 'Option D']} 
          correctAnswer={adData.question_answer}
          bonusAmount={2.0}
          onSubmit={handleQuizSubmit}
          onClose={handleQuizClose}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#111827',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4F46E5',
    borderRadius: 24,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default AdViewScreen;
