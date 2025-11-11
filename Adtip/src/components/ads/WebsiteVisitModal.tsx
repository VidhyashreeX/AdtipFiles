/**
 * WebsiteVisitModal Component
 * 
 * Modal with WebView for brand awareness ads requiring 30-second website visit.
 * Features countdown timer, progress indicator, and automatic completion tracking.
 * 
 * Features:
 * - WebView for displaying advertiser website
 * - 30-second countdown timer
 * - Progress bar
 * - Auto-close on completion
 * - Manual close with warning
 * - Loading state
 * - Error handling
 * 
 * @example
 * ```tsx
 * <WebsiteVisitModal
 *   visible={showWebsiteModal}
 *   websiteUrl="https://example.com"
 *   requiredDuration={30}
 *   onComplete={handleWebsiteComplete}
 *   onClose={handleWebsiteClose}
 * />
 * ```
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { formatWatchTime } from '../../types/ads';

interface WebsiteVisitModalProps {
  visible: boolean;
  websiteUrl: string;
  requiredDuration?: number; // in seconds
  onComplete: (duration: number) => void;
  onClose: () => void;
}

const WebsiteVisitModal: React.FC<WebsiteVisitModalProps> = ({
  visible,
  websiteUrl,
  requiredDuration = 30,
  onComplete,
  onClose,
}) => {
  const [timeSpent, setTimeSpent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Calculate progress
  const progress = Math.min((timeSpent / requiredDuration) * 100, 100);
  const isComplete = timeSpent >= requiredDuration;
  const remainingTime = Math.max(requiredDuration - timeSpent, 0);

  // Start timer when modal opens
  useEffect(() => {
    if (visible) {
      startTimeRef.current = Date.now();
      setTimeSpent(0);
      setIsLoading(true);
      setHasError(false);

      // Start 1-second interval
      timerRef.current = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    } else {
      // Clear timer when modal closes
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [visible]);

  // Auto-complete when timer reaches required duration
  useEffect(() => {
    if (isComplete && visible) {
      handleComplete();
    }
  }, [isComplete, visible]);

  const handleComplete = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    onComplete(timeSpent);
  };

  const handleClose = () => {
    if (!isComplete) {
      Alert.alert(
        'Close Website Visit',
        `You need to stay for ${remainingTime} more seconds to earn the bonus reward. Are you sure you want to close?`,
        [
          {
            text: 'Keep Browsing',
            style: 'cancel',
          },
          {
            text: 'Close Anyway',
            style: 'destructive',
            onPress: () => {
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              onClose();
            },
          },
        ]
      );
    } else {
      onClose();
    }
  };

  const handleWebViewLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleWebViewError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#111827" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Visit Advertiser Website</Text>
            <Text style={styles.headerSubtitle}>
              Stay for {requiredDuration}s to earn bonus
            </Text>
          </View>

          <View style={styles.closeButtonPlaceholder} />
        </View>

        {/* Timer and Progress */}
        <View style={styles.timerContainer}>
          <View style={styles.timerInfo}>
            <Icon 
              name={isComplete ? 'check-circle' : 'schedule'} 
              size={20} 
              color={isComplete ? '#10B981' : '#F59E0B'} 
            />
            <Text style={[
              styles.timerText,
              isComplete && styles.timerTextComplete
            ]}>
              {isComplete 
                ? 'Completed!' 
                : `${formatWatchTime(remainingTime)} remaining`
              }
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill,
                { width: `${progress}%` },
                isComplete && styles.progressBarComplete
              ]} 
            />
          </View>

          <Text style={styles.progressText}>
            {Math.round(progress)}%
          </Text>
        </View>

        {/* WebView */}
        <View style={styles.webViewContainer}>
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={styles.loadingText}>Loading website...</Text>
            </View>
          )}

          {hasError ? (
            <View style={styles.errorContainer}>
              <Icon name="error-outline" size={64} color="#EF4444" />
              <Text style={styles.errorTitle}>Failed to Load</Text>
              <Text style={styles.errorText}>
                Unable to load the website. Please check your connection.
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setHasError(false);
                  setIsLoading(true);
                }}
              >
                <Icon name="refresh" size={20} color="#FFFFFF" />
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <WebView
              source={{ uri: websiteUrl }}
              style={styles.webView}
              onLoad={handleWebViewLoad}
              onError={handleWebViewError}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={false}
              scalesPageToFit={true}
              bounces={false}
            />
          )}
        </View>

        {/* Completion Message */}
        {isComplete && (
          <View style={styles.completionBanner}>
            <Icon name="celebration" size={24} color="#10B981" />
            <Text style={styles.completionText}>
              Bonus earned! You can close now.
            </Text>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => onClose()}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1F2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonPlaceholder: {
    width: 40,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1F2937',
    gap: 12,
  },
  timerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
  },
  timerTextComplete: {
    color: '#10B981',
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  progressBarComplete: {
    backgroundColor: '#10B981',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    minWidth: 45,
    textAlign: 'right',
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  completionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#10B981',
    gap: 12,
  },
  completionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  doneButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
});

export default WebsiteVisitModal;
